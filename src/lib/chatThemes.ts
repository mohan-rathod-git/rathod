/**
 * Chat Themes — Banjara Bandhan
 *
 * Curated couple chat themes with full token system.
 * Each theme defines colors for bubbles, backgrounds, accents,
 * and the composer bar. Themes are per-match and stored in localStorage.
 */

export interface ChatTheme {
  id: string;
  name: string;
  emoji: string;
  /** Sent bubble background */
  bubbleSent: string;
  /** Sent bubble text color */
  bubbleSentText: string;
  /** Received bubble background */
  bubbleReceived: string;
  /** Received bubble text color */
  bubbleReceivedText: string;
  /** Chat area background gradient start */
  backgroundGradientStart: string;
  /** Chat area background gradient end */
  backgroundGradientEnd: string;
  /** Accent glow color (send button, focus rings) */
  accentGlow: string;
  /** Composer bar background */
  composerBg: string;
  /** Composer bar border color */
  composerBorder: string;
  /** Date separator text color */
  dateSeparatorColor: string;
}

export const CHAT_THEMES: ChatTheme[] = [
  {
    id: 'saffron-love',
    name: 'Saffron Love',
    emoji: '🧡',
    bubbleSent: 'linear-gradient(135deg, hsl(14 80% 52%), hsl(25 85% 55%))',
    bubbleSentText: '#ffffff',
    bubbleReceived: 'rgba(255, 255, 255, 0.92)',
    bubbleReceivedText: 'hsl(20 25% 15%)',
    backgroundGradientStart: 'hsl(30 25% 96%)',
    backgroundGradientEnd: 'hsl(14 30% 93%)',
    accentGlow: 'hsl(14 80% 52%)',
    composerBg: 'rgba(255, 255, 255, 0.85)',
    composerBorder: 'rgba(232, 84, 30, 0.15)',
    dateSeparatorColor: 'hsl(14 40% 60%)',
  },
  {
    id: 'rose-garden',
    name: 'Rose Garden',
    emoji: '🌹',
    bubbleSent: 'linear-gradient(135deg, hsl(340 65% 50%), hsl(355 60% 55%))',
    bubbleSentText: '#ffffff',
    bubbleReceived: 'rgba(255, 245, 248, 0.95)',
    bubbleReceivedText: 'hsl(340 30% 20%)',
    backgroundGradientStart: 'hsl(340 20% 96%)',
    backgroundGradientEnd: 'hsl(355 25% 93%)',
    accentGlow: 'hsl(340 65% 50%)',
    composerBg: 'rgba(255, 248, 250, 0.88)',
    composerBorder: 'rgba(220, 60, 100, 0.12)',
    dateSeparatorColor: 'hsl(340 35% 55%)',
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    emoji: '🌅',
    bubbleSent: 'linear-gradient(135deg, hsl(38 75% 50%), hsl(28 80% 55%))',
    bubbleSentText: '#ffffff',
    bubbleReceived: 'rgba(255, 252, 245, 0.95)',
    bubbleReceivedText: 'hsl(38 30% 18%)',
    backgroundGradientStart: 'hsl(40 30% 96%)',
    backgroundGradientEnd: 'hsl(38 25% 92%)',
    accentGlow: 'hsl(38 75% 50%)',
    composerBg: 'rgba(255, 253, 247, 0.88)',
    composerBorder: 'rgba(200, 150, 50, 0.12)',
    dateSeparatorColor: 'hsl(38 40% 55%)',
  },
  {
    id: 'midnight-plum',
    name: 'Midnight Plum',
    emoji: '🍇',
    bubbleSent: 'linear-gradient(135deg, hsl(280 50% 45%), hsl(300 45% 50%))',
    bubbleSentText: '#ffffff',
    bubbleReceived: 'rgba(250, 245, 255, 0.95)',
    bubbleReceivedText: 'hsl(280 25% 20%)',
    backgroundGradientStart: 'hsl(280 15% 96%)',
    backgroundGradientEnd: 'hsl(300 15% 93%)',
    accentGlow: 'hsl(280 50% 55%)',
    composerBg: 'rgba(252, 248, 255, 0.88)',
    composerBorder: 'rgba(150, 80, 180, 0.12)',
    dateSeparatorColor: 'hsl(280 30% 55%)',
  },
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    emoji: '🌊',
    bubbleSent: 'linear-gradient(135deg, hsl(200 70% 45%), hsl(180 60% 42%))',
    bubbleSentText: '#ffffff',
    bubbleReceived: 'rgba(245, 252, 255, 0.95)',
    bubbleReceivedText: 'hsl(200 25% 18%)',
    backgroundGradientStart: 'hsl(200 20% 96%)',
    backgroundGradientEnd: 'hsl(180 18% 93%)',
    accentGlow: 'hsl(200 70% 50%)',
    composerBg: 'rgba(248, 253, 255, 0.88)',
    composerBorder: 'rgba(60, 150, 200, 0.12)',
    dateSeparatorColor: 'hsl(200 35% 55%)',
  },
  {
    id: 'forest-whisper',
    name: 'Forest Whisper',
    emoji: '🌿',
    bubbleSent: 'linear-gradient(135deg, hsl(150 45% 38%), hsl(140 40% 42%))',
    bubbleSentText: '#ffffff',
    bubbleReceived: 'rgba(245, 255, 250, 0.95)',
    bubbleReceivedText: 'hsl(150 25% 18%)',
    backgroundGradientStart: 'hsl(150 15% 96%)',
    backgroundGradientEnd: 'hsl(140 12% 93%)',
    accentGlow: 'hsl(150 45% 42%)',
    composerBg: 'rgba(248, 255, 252, 0.88)',
    composerBorder: 'rgba(60, 150, 100, 0.12)',
    dateSeparatorColor: 'hsl(150 30% 50%)',
  },
];

/** Default theme */
export const DEFAULT_THEME = CHAT_THEMES[0];

/**
 * Get the chat theme for a specific match pair.
 * Uses sorted user IDs as the key so both users share the same theme.
 */
export function getChatThemeForMatch(userId: string, partnerId: string): ChatTheme {
  const key = getChatThemeKey(userId, partnerId);
  const storedId = localStorage.getItem(key);
  return CHAT_THEMES.find(t => t.id === storedId) || DEFAULT_THEME;
}

/**
 * Save the selected theme for a match pair.
 */
export function setChatThemeForMatch(userId: string, partnerId: string, themeId: string): void {
  const key = getChatThemeKey(userId, partnerId);
  localStorage.setItem(key, themeId);
}

/**
 * Generate a consistent localStorage key for a match pair.
 */
function getChatThemeKey(userId: string, partnerId: string): string {
  const sorted = [userId, partnerId].sort();
  return `bb_chat_theme_${sorted[0]}_${sorted[1]}`;
}
