/**
 * Client-Side Rate Limiter — Banjara Bandhan Security
 *
 * Tracks login attempts per identifier (email/phone) in sessionStorage.
 * Enforces a lockout period after too many failed attempts.
 *
 * Note: This is a UX-level protection. Server-side rate limiting
 * should also be enforced via Supabase Auth settings and RLS policies.
 */

const STORAGE_PREFIX = "bb_ratelimit_";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

interface RateLimitRecord {
  attempts: number;
  firstAttemptAt: number;
  lockedUntil?: number;
}

function getRecord(identifier: string): RateLimitRecord {
  try {
    const key = STORAGE_PREFIX + btoa(identifier).slice(0, 20);
    const stored = sessionStorage.getItem(key);
    if (stored) return JSON.parse(stored);
  } catch {
    // sessionStorage unavailable or JSON parse error — fail open
  }
  return { attempts: 0, firstAttemptAt: Date.now() };
}

function saveRecord(identifier: string, record: RateLimitRecord): void {
  try {
    const key = STORAGE_PREFIX + btoa(identifier).slice(0, 20);
    sessionStorage.setItem(key, JSON.stringify(record));
  } catch {
    // sessionStorage unavailable — fail open
  }
}

function clearRecord(identifier: string): void {
  try {
    const key = STORAGE_PREFIX + btoa(identifier).slice(0, 20);
    sessionStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Check if a login attempt is allowed for the given identifier.
 * @returns { allowed: true } or { allowed: false, secondsRemaining: number }
 */
export function checkRateLimit(identifier: string): { allowed: boolean; secondsRemaining?: number } {
  if (!identifier?.trim()) return { allowed: true };

  const record = getRecord(identifier.toLowerCase().trim());
  const now = Date.now();

  // Check active lockout
  if (record.lockedUntil && now < record.lockedUntil) {
    const secondsRemaining = Math.ceil((record.lockedUntil - now) / 1000);
    return { allowed: false, secondsRemaining };
  }

  // Reset stale record (older than lockout duration)
  if (now - record.firstAttemptAt > LOCKOUT_DURATION_MS) {
    clearRecord(identifier);
    return { allowed: true };
  }

  return { allowed: true };
}

/**
 * Record a failed login attempt.
 * Automatically triggers lockout after MAX_ATTEMPTS failures.
 * @returns Number of remaining attempts before lockout
 */
export function recordFailedAttempt(identifier: string): number {
  if (!identifier?.trim()) return MAX_ATTEMPTS;

  const key = identifier.toLowerCase().trim();
  const record = getRecord(key);
  const now = Date.now();

  // Reset if previous lockout has expired
  if (record.lockedUntil && now >= record.lockedUntil) {
    const fresh: RateLimitRecord = { attempts: 1, firstAttemptAt: now };
    saveRecord(key, fresh);
    return MAX_ATTEMPTS - 1;
  }

  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    saveRecord(key, record);
    return 0;
  }

  if (record.attempts === 1) {
    record.firstAttemptAt = now;
  }

  saveRecord(key, record);
  return MAX_ATTEMPTS - record.attempts;
}

/**
 * Clear the rate limit record on successful login.
 */
export function clearRateLimit(identifier: string): void {
  if (!identifier?.trim()) return;
  clearRecord(identifier.toLowerCase().trim());
}

/**
 * Format lockout message for display.
 */
export function formatLockoutMessage(secondsRemaining: number): string {
  if (secondsRemaining >= 60) {
    const minutes = Math.ceil(secondsRemaining / 60);
    return `Too many failed attempts. Please try again in ${minutes} minute${minutes > 1 ? "s" : ""}.`;
  }
  return `Too many failed attempts. Please try again in ${secondsRemaining} second${secondsRemaining > 1 ? "s" : ""}.`;
}
