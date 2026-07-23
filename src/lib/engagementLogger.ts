/**
 * Engagement Event Logger
 *
 * Logs user interactions with profiles for the recommendation engine.
 * Even before the recommendation algorithm is built (Phase 4),
 * we log events from day one so training data is ready.
 *
 * Event types:
 * - impression: profile appeared in a feed/carousel
 * - view: user opened a profile detail page
 * - view_long: user spent >10s on a profile detail
 * - profile_click: user tapped a profile card
 * - photo_view: user viewed additional photos
 * - interest_sent: user sent interest
 * - accept: user accepted an interest
 * - reject: user declined an interest
 * - skip: user scrolled past without interaction
 */

import { supabase } from "@/integrations/supabase/client";

export type EngagementEventType =
  | 'impression'
  | 'view'
  | 'view_long'
  | 'profile_click'
  | 'photo_view'
  | 'interest_sent'
  | 'interest_received'
  | 'accept'
  | 'reject'
  | 'skip';

// Batch events in memory and flush periodically to avoid excessive DB writes
const EVENT_BUFFER: Array<{
  user_id: string;
  target_profile_id: string;
  event_type: EngagementEventType;
  metadata: Record<string, unknown>;
}> = [];

let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5000; // Flush every 5 seconds
const MAX_BUFFER_SIZE = 20; // Or when buffer reaches 20 events

async function flushEvents() {
  if (EVENT_BUFFER.length === 0) return;

  const eventsToFlush = EVENT_BUFFER.splice(0, EVENT_BUFFER.length);

  try {
    const { error } = await supabase
      .from("engagement_events" as any)
      .insert(eventsToFlush);

    if (error) {
      // On error, don't lose events — put them back (best effort)
      console.warn("[EngagementLogger] Flush failed, re-queuing:", error.message);
      EVENT_BUFFER.unshift(...eventsToFlush);
    }
  } catch (err) {
    console.warn("[EngagementLogger] Flush exception:", err);
    EVENT_BUFFER.unshift(...eventsToFlush);
  }
}

function scheduleFlush() {
  if (flushTimer) return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushEvents();
  }, FLUSH_INTERVAL_MS);
}

/**
 * Log an engagement event.
 *
 * @param userId - The current user's auth UID
 * @param targetProfileId - The profile being interacted with (user_id, not profile row id)
 * @param eventType - Type of interaction
 * @param metadata - Optional additional context (e.g., { source: 'home_carousel', position: 3 })
 */
export function logEngagementEvent(
  userId: string | undefined,
  targetProfileId: string,
  eventType: EngagementEventType,
  metadata: Record<string, unknown> = {}
) {
  if (!userId || userId === targetProfileId) return; // Don't log self-views

  EVENT_BUFFER.push({
    user_id: userId,
    target_profile_id: targetProfileId,
    event_type: eventType,
    metadata,
  });

  if (EVENT_BUFFER.length >= MAX_BUFFER_SIZE) {
    flushEvents();
  } else {
    scheduleFlush();
  }
}

// Flush on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (EVENT_BUFFER.length > 0) {
      // Use sendBeacon for reliability on unload
      const payload = JSON.stringify(EVENT_BUFFER.splice(0, EVENT_BUFFER.length));
      try {
        navigator.sendBeacon?.(
          `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/engagement_events`,
          new Blob([payload], { type: 'application/json' })
        );
      } catch {
        // Best effort — some events may be lost on unload
      }
    }
  });
}
