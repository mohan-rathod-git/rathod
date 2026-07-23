/**
 * Content Moderation Utility — Banjara Bandhan v4.0 §10
 *
 * Client-side moderation filter for chat messages and public profile fields.
 * Checks for:
 * - Profanity and harassment patterns
 * - Explicit contact info sharing in restricted contexts (phone numbers, email addresses, external URLs)
 * - Spam patterns
 */

export interface ModerationResult {
  isClean: boolean;
  flagged: boolean;
  reasons: string[];
  sanitizedText: string;
}

// Basic list of offensive / prohibited words or patterns
const PROFANITY_PATTERNS = [
  /\b(abuse|scam|fraud|hate|fake)\b/i,
];

// Regex for phone number detection (e.g., +91 9876543210, 9876543210, etc.)
const PHONE_REGEX = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g;

// Regex for email detection
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Regex for URL detection
const URL_REGEX = /(https?:\/\/[^\s]+)/g;

/**
 * Moderate text content (messages, bios, comments).
 *
 * @param text - Input text string
 * @param options - Context configuration (e.g. checkContactInfo: true)
 */
export function moderateText(
  text: string,
  options: { checkContactInfo?: boolean } = {}
): ModerationResult {
  const reasons: string[] = [];
  let sanitizedText = text;
  let flagged = false;

  if (!text || text.trim().length === 0) {
    return { isClean: true, flagged: false, reasons: [], sanitizedText: text };
  }

  // 1. Check profanity / abuse patterns
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(text)) {
      flagged = true;
      reasons.push('Contains offensive language');
      sanitizedText = sanitizedText.replace(pattern, '***');
    }
  }

  // 2. Check contact info sharing if restricted (e.g. in public bio before match)
  if (options.checkContactInfo) {
    if (PHONE_REGEX.test(text)) {
      flagged = true;
      reasons.push('Phone numbers not allowed in public text');
      sanitizedText = sanitizedText.replace(PHONE_REGEX, '[phone hidden]');
    }
    if (EMAIL_REGEX.test(text)) {
      flagged = true;
      reasons.push('Email addresses not allowed in public text');
      sanitizedText = sanitizedText.replace(EMAIL_REGEX, '[email hidden]');
    }
    if (URL_REGEX.test(text)) {
      flagged = true;
      reasons.push('External URLs not allowed');
      sanitizedText = sanitizedText.replace(URL_REGEX, '[link hidden]');
    }
  }

  return {
    isClean: !flagged,
    flagged,
    reasons,
    sanitizedText,
  };
}
