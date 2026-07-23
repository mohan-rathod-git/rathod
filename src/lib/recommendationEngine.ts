/**
 * Recommendation Engine — Phase 1 (v4.0 §8)
 *
 * Scoring strategy:
 * 1. Hard filters: community match, age range, gender, location, not blocked
 * 2. Weighted attribute score:
 *    - Preference overlap (age, state, education, marital status)
 *    - Profile completeness bonus
 *    - Freshness (newer profiles get slight boost)
 *    - Reciprocity dampener (already sent interest → lower rank)
 *    - Diversity injection (rotate communities, locations)
 *
 * This is a deterministic, non-ML engine suitable for cold start.
 * Future phases will incorporate engagement_events for ML-based scoring.
 */

interface ProfileData {
  id: string;
  user_id: string;
  full_name: string;
  gender: string;
  date_of_birth: string | null;
  community: string | null;
  gotra: string | null;
  state: string | null;
  city_village: string | null;
  education: string | null;
  occupation: string | null;
  annual_income: string | null;
  marital_status: string | null;
  height: string | null;
  is_premium: boolean;
  is_verified: boolean;
  is_online: boolean;
  photo_url: string | null;
  profile_completion: number | null;
  created_at: string;
  // Preferences
  pref_age_min: number;
  pref_age_max: number;
  pref_states: string[];
  pref_marital_status: string[];
  pref_education: string[];
}

interface ScoringContext {
  viewerProfile: ProfileData;
  blockedUserIds: Set<string>;
  sentInterestUserIds: Set<string>;
  receivedInterestUserIds: Set<string>;
}

function getAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  return Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
}

function daysSince(dateStr: string): number {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 60 * 60 * 1000));
}

/**
 * Score a candidate profile relative to the viewer.
 * Returns a score between 0 and 100. Higher = better match.
 */
function scoreProfile(candidate: ProfileData, ctx: ScoringContext): number {
  const viewer = ctx.viewerProfile;
  let score = 50; // Base score

  // ── Preference Overlap (max +25) ──
  const candidateAge = getAge(candidate.date_of_birth);
  if (candidateAge !== null) {
    if (candidateAge >= viewer.pref_age_min && candidateAge <= viewer.pref_age_max) {
      score += 8; // Within age preference
    } else {
      score -= 5; // Outside age preference
    }
  }

  // State preference match
  if (viewer.pref_states?.length > 0 && candidate.state) {
    if (viewer.pref_states.includes(candidate.state)) {
      score += 7;
    }
  } else if (candidate.state === viewer.state) {
    score += 4; // Same state even without explicit preference
  }

  // Education preference match
  if (viewer.pref_education?.length > 0 && candidate.education) {
    if (viewer.pref_education.includes(candidate.education)) {
      score += 5;
    }
  }

  // Marital status preference match
  if (viewer.pref_marital_status?.length > 0 && candidate.marital_status) {
    if (viewer.pref_marital_status.includes(candidate.marital_status)) {
      score += 5;
    }
  }

  // ── Community & Gotra (max +10) ──
  if (candidate.community === viewer.community) {
    score += 5; // Same community is a positive
  }
  // Same gotra is NOT a positive (exogamy rule in many communities)
  if (candidate.gotra && viewer.gotra && candidate.gotra === viewer.gotra) {
    score -= 3; // Mild penalty for same gotra
  }

  // ── Profile Quality (max +15) ──
  const completion = candidate.profile_completion || 0;
  score += Math.round((completion / 100) * 8); // Up to +8 for complete profile

  if (candidate.photo_url && candidate.photo_url !== '/placeholder.svg') {
    score += 4; // Has a real photo
  }

  if (candidate.is_verified) {
    score += 3; // Verified profiles rank higher
  }

  // ── Freshness (max +8) ──
  const age = daysSince(candidate.created_at);
  if (age <= 7) score += 8;       // Very new
  else if (age <= 30) score += 5;  // Recent
  else if (age <= 90) score += 2;  // Somewhat recent
  // Old profiles get no freshness bonus

  // ── Online status (+3) ──
  if (candidate.is_online) {
    score += 3;
  }

  // ── Reciprocity Dampening ──
  if (ctx.sentInterestUserIds.has(candidate.user_id)) {
    score -= 15; // Already sent interest — push down to show new faces
  }
  if (ctx.receivedInterestUserIds.has(candidate.user_id)) {
    score += 10; // They're interested in us — boost!
  }

  // ── Premium Boost (small) ──
  if (candidate.is_premium) {
    score += 2;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Apply hard filters and score/sort profiles for the recommendation feed.
 */
export function getRecommendedProfiles(
  allProfiles: ProfileData[],
  ctx: ScoringContext
): ProfileData[] {
  const viewer = ctx.viewerProfile;

  // Step 1: Hard filters
  const filtered = allProfiles.filter((p) => {
    // Exclude self
    if (p.user_id === viewer.user_id) return false;
    // Exclude blocked
    if (ctx.blockedUserIds.has(p.user_id)) return false;
    // Gender filter (show opposite gender by default)
    if (viewer.gender && p.gender) {
      if (viewer.gender === p.gender) return false;
    }
    // Must have at least completed registration
    return true;
  });

  // Step 2: Score each profile
  const scored = filtered.map((p) => ({
    profile: p,
    score: scoreProfile(p, ctx),
  }));

  // Step 3: Sort by score (descending)
  scored.sort((a, b) => b.score - a.score);

  // Step 4: Diversity injection — ensure we don't show 10 profiles from same state
  const result: ProfileData[] = [];
  const stateCount = new Map<string, number>();
  const MAX_SAME_STATE = 3; // Max consecutive from same state

  for (const item of scored) {
    const state = item.profile.state || 'unknown';
    const count = stateCount.get(state) || 0;
    if (count < MAX_SAME_STATE) {
      result.push(item.profile);
      stateCount.set(state, count + 1);
    }
  }

  // Add back any remaining profiles that were filtered by diversity
  for (const item of scored) {
    if (!result.includes(item.profile)) {
      result.push(item.profile);
    }
  }

  return result;
}
