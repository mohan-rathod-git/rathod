/**
 * Privacy Utility — canView() function
 *
 * Central lookup-table for field visibility based on:
 * - The viewer's relationship to the profile owner
 * - The owner's privacy_mode setting
 *
 * Every component that displays potentially-sensitive data
 * MUST call canView() before rendering.
 */

export type PrivacyMode = 'public' | 'verified_only' | 'matches_only' | 'private';

export type ViewerRelationship =
  | 'self'        // Viewing own profile
  | 'matched'     // Mutual match exists
  | 'verified'    // Viewer is verified (is_verified = true)
  | 'stranger';   // No relationship

export type PrivacyField =
  | 'photo'
  | 'additional_photos'
  | 'last_seen'
  | 'phone'
  | 'email'
  | 'exact_location'  // city_village
  | 'distance';

type VisibilityResult = 'visible' | 'blurred' | 'hidden';

/**
 * Privacy visibility matrix.
 *
 * Rows: [field][privacy_mode]
 * Columns: viewer relationship
 *
 * Key rules from v4.0 §6:
 * - Phone/email: NEVER shown pre-match, regardless of mode
 * - Last seen: hidden always except to matches (and even then only in public/matches_only mode)
 * - Photo: blurred thumbnail in public mode for strangers, hidden in private mode
 */
const VISIBILITY_MATRIX: Record<
  PrivacyField,
  Record<PrivacyMode, Record<ViewerRelationship, VisibilityResult>>
> = {
  photo: {
    public:        { self: 'visible', matched: 'visible', verified: 'visible', stranger: 'blurred' },
    verified_only: { self: 'visible', matched: 'visible', verified: 'visible', stranger: 'blurred' },
    matches_only:  { self: 'visible', matched: 'visible', verified: 'blurred', stranger: 'blurred' },
    private:       { self: 'visible', matched: 'visible', verified: 'hidden',  stranger: 'hidden' },
  },
  additional_photos: {
    public:        { self: 'visible', matched: 'visible', verified: 'visible', stranger: 'hidden' },
    verified_only: { self: 'visible', matched: 'visible', verified: 'visible', stranger: 'hidden' },
    matches_only:  { self: 'visible', matched: 'visible', verified: 'hidden',  stranger: 'hidden' },
    private:       { self: 'visible', matched: 'visible', verified: 'hidden',  stranger: 'hidden' },
  },
  last_seen: {
    public:        { self: 'visible', matched: 'hidden',  verified: 'hidden',  stranger: 'hidden' },
    verified_only: { self: 'visible', matched: 'hidden',  verified: 'hidden',  stranger: 'hidden' },
    matches_only:  { self: 'visible', matched: 'visible', verified: 'hidden',  stranger: 'hidden' },
    private:       { self: 'visible', matched: 'hidden',  verified: 'hidden',  stranger: 'hidden' },
  },
  phone: {
    public:        { self: 'visible', matched: 'visible', verified: 'hidden', stranger: 'hidden' },
    verified_only: { self: 'visible', matched: 'visible', verified: 'hidden', stranger: 'hidden' },
    matches_only:  { self: 'visible', matched: 'visible', verified: 'hidden', stranger: 'hidden' },
    private:       { self: 'visible', matched: 'visible', verified: 'hidden', stranger: 'hidden' },
  },
  email: {
    public:        { self: 'visible', matched: 'visible', verified: 'hidden', stranger: 'hidden' },
    verified_only: { self: 'visible', matched: 'visible', verified: 'hidden', stranger: 'hidden' },
    matches_only:  { self: 'visible', matched: 'visible', verified: 'hidden', stranger: 'hidden' },
    private:       { self: 'visible', matched: 'visible', verified: 'hidden', stranger: 'hidden' },
  },
  exact_location: {
    public:        { self: 'visible', matched: 'visible', verified: 'visible', stranger: 'visible' },
    verified_only: { self: 'visible', matched: 'visible', verified: 'visible', stranger: 'hidden' },
    matches_only:  { self: 'visible', matched: 'visible', verified: 'hidden',  stranger: 'hidden' },
    private:       { self: 'visible', matched: 'hidden',  verified: 'hidden',  stranger: 'hidden' },
  },
  distance: {
    public:        { self: 'visible', matched: 'visible', verified: 'visible', stranger: 'visible' },
    verified_only: { self: 'visible', matched: 'visible', verified: 'visible', stranger: 'hidden' },
    matches_only:  { self: 'visible', matched: 'visible', verified: 'hidden',  stranger: 'hidden' },
    private:       { self: 'visible', matched: 'hidden',  verified: 'hidden',  stranger: 'hidden' },
  },
};

/**
 * Check if a viewer can see a specific field on a profile.
 *
 * @param field - The sensitive field to check
 * @param viewerRelationship - How the viewer relates to the profile owner
 * @param ownerPrivacyMode - The profile owner's privacy setting
 * @returns VisibilityResult: 'visible', 'blurred', or 'hidden'
 *
 * @example
 * ```ts
 * const photoVisibility = canView('photo', 'stranger', 'private');
 * // Returns 'hidden'
 *
 * const phoneVisibility = canView('phone', 'matched', 'public');
 * // Returns 'visible'
 * ```
 */
export function canView(
  field: PrivacyField,
  viewerRelationship: ViewerRelationship,
  ownerPrivacyMode: PrivacyMode = 'public'
): VisibilityResult {
  const fieldMatrix = VISIBILITY_MATRIX[field];
  if (!fieldMatrix) return 'hidden'; // unknown field → fail closed

  const modeMatrix = fieldMatrix[ownerPrivacyMode];
  if (!modeMatrix) return 'hidden'; // unknown mode → fail closed

  return modeMatrix[viewerRelationship] ?? 'hidden'; // unknown relationship → fail closed
}

/**
 * Determine the viewer's relationship to a profile owner.
 *
 * @param viewerUserId - The current logged-in user's ID
 * @param ownerUserId - The profile being viewed
 * @param isMatched - Whether a mutual match exists
 * @param isViewerVerified - Whether the viewer's profile is verified
 */
export function getViewerRelationship(
  viewerUserId: string | undefined,
  ownerUserId: string,
  isMatched: boolean = false,
  isViewerVerified: boolean = false
): ViewerRelationship {
  if (!viewerUserId) return 'stranger';
  if (viewerUserId === ownerUserId) return 'self';
  if (isMatched) return 'matched';
  if (isViewerVerified) return 'verified';
  return 'stranger';
}

/**
 * Filter a profile object to remove/mask fields based on privacy rules.
 * Use this when displaying a profile to a viewer.
 */
export function applyPrivacyFilter(
  profile: Record<string, any>,
  viewerRelationship: ViewerRelationship,
  ownerPrivacyMode: PrivacyMode = 'public'
): Record<string, any> {
  const filtered = { ...profile };

  // Phone & email
  if (canView('phone', viewerRelationship, ownerPrivacyMode) === 'hidden') {
    filtered.phone = null;
  }
  if (canView('email', viewerRelationship, ownerPrivacyMode) === 'hidden') {
    filtered.email = null;
  }

  // Photo
  const photoVis = canView('photo', viewerRelationship, ownerPrivacyMode);
  if (photoVis === 'hidden') {
    filtered.photo_url = null;
  } else if (photoVis === 'blurred') {
    filtered._photo_blurred = true; // signal to UI to render blurred
  }

  // Additional photos
  if (canView('additional_photos', viewerRelationship, ownerPrivacyMode) === 'hidden') {
    filtered.additional_photos = [];
  }

  // Exact location
  if (canView('exact_location', viewerRelationship, ownerPrivacyMode) !== 'visible') {
    filtered.city_village = null;
    filtered.district = null;
    // Keep state-level (approximate) location visible
  }

  // Online status / last seen
  if (canView('last_seen', viewerRelationship, ownerPrivacyMode) === 'hidden') {
    filtered.is_online = null;
  }

  return filtered;
}
