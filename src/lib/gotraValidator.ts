/**
 * Gotra Exogamy Validator — Banjara Bandhan v4.0 §7
 *
 * Implements the endogamy/exogamy marriage rules:
 * - Same gotra match → soft-block with educational warning
 * - Known incompatible gotras → optional warning
 *
 * This is advisory only — does not prevent users from connecting,
 * but shows a prominent warning banner on the profile.
 */

export type GotraCompatibility = 'compatible' | 'same_gotra' | 'unknown';

/**
 * Checks gotra compatibility between two users.
 *
 * @param viewerGotra - The logged-in user's gotra
 * @param targetGotra - The profile being viewed's gotra
 * @returns GotraCompatibility status
 */
export function checkGotraCompatibility(
  viewerGotra: string | null | undefined,
  targetGotra: string | null | undefined
): GotraCompatibility {
  // If either party hasn't specified gotra, we can't check
  if (!viewerGotra || !targetGotra) return 'unknown';

  // Normalize for comparison
  const v = viewerGotra.trim().toLowerCase();
  const t = targetGotra.trim().toLowerCase();

  if (v === t) return 'same_gotra';

  return 'compatible';
}

/**
 * Returns the warning message for a given compatibility status.
 */
export function getGotraWarningMessage(
  status: GotraCompatibility,
  viewerGotra: string,
  targetGotra: string,
  lang: 'en' | 'hi' | 'kn' | 'te' = 'en'
): string | null {
  if (status !== 'same_gotra') return null;

  const messages: Record<string, string> = {
    en: `Both profiles share the same gotra (${viewerGotra}). In Banjara tradition, same-gotra marriages are generally not recommended. Please consult with your family elders.`,
    hi: `दोनों प्रोफ़ाइल का गोत्र एक ही है (${viewerGotra})। बंजारा परंपरा में, एक ही गोत्र में विवाह सामान्यतः अनुशंसित नहीं है। कृपया अपने परिवार के बुजुर्गों से परामर्श करें।`,
    kn: `ಎರಡೂ ಪ್ರೊಫೈಲ್‌ಗಳು ಒಂದೇ ಗೋತ್ರವನ್ನು (${viewerGotra}) ಹೊಂದಿವೆ. ಬಂಜಾರ ಸಂಪ್ರದಾಯದಲ್ಲಿ, ಒಂದೇ ಗೋತ್ರದ ವಿವಾಹಗಳು ಸಾಮಾನ್ಯವಾಗಿ ಶಿಫಾರಸು ಮಾಡುವುದಿಲ್ಲ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಕುಟುಂಬದ ಹಿರಿಯರ ಸಲಹೆ ಪಡೆಯಿರಿ.`,
    te: `రెండు ప్రొఫైల్‌లు ఒకే గోత్రాన్ని (${viewerGotra}) కలిగి ఉన్నాయి. బంజారా సంప్రదాయంలో, ఒకే గోత్రంలో వివాహాలు సాధారణంగా సిఫార్సు చేయబడవు. దయచేసి మీ కుటుంబ పెద్దలను సంప్రదించండి.`,
  };

  return messages[lang] || messages.en;
}
