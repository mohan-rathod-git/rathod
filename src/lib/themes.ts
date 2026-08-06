/**
 * themes.ts — 10 Premium Theme Definitions
 *
 * 5 Light Themes + 5 Dark Themes
 * Each theme supplies all CSS custom-property values consumed by Tailwind.
 * The super admin can push any theme live to all users in real-time.
 */

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  /** Preview colors for the admin theme picker UI */
  preview: {
    primary: string;
    background: string;
    accent: string;
    card: string;
  };
  /** CSS custom property values (hsl space-separated without hsl()) */
  vars: Record<string, string>;
}

// ═══════════════════════════════════════════
//   LIGHT THEMES
// ═══════════════════════════════════════════

const premiumWhite: AppTheme = {
  id: 'premium-white',
  name: 'Premium White',
  description: 'Cool indigo & crisp white — Claude-inspired elegance',
  mode: 'light',
  preview: { primary: '#818CF8', background: '#F5F6FA', accent: '#A855F7', card: '#FFFFFF' },
  vars: {
    '--background': '220 16% 97%',
    '--foreground': '224 47% 11%',
    '--card': '0 0% 100%',
    '--card-foreground': '224 47% 11%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '224 47% 11%',
    '--primary': '239 84% 67%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '220 14% 96%',
    '--secondary-foreground': '224 47% 11%',
    '--muted': '220 14% 96%',
    '--muted-foreground': '220 9% 46%',
    '--accent': '262 83% 58%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '220 13% 91%',
    '--input': '220 13% 91%',
    '--ring': '239 84% 67%',
    '--teal': '168 55% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 35% 72%',
    '--deep-maroon': '239 60% 30%',
    '--warm-ivory': '220 20% 97%',
    '--mehendi-green': '160 35% 38%',
    '--mehendi-dark': '160 30% 18%',
    '--gold-shimmer': '45 80% 55%',
  },
};

const saffronWarmth: AppTheme = {
  id: 'saffron-warmth',
  name: 'Saffron Warmth',
  description: 'Vibrant saffron, warm ivory & earthy tones',
  mode: 'light',
  preview: { primary: '#E8541E', background: '#FAF8F5', accent: '#D4A853', card: '#FFFFFF' },
  vars: {
    '--background': '30 20% 97%',
    '--foreground': '20 25% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '20 25% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '20 25% 10%',
    '--primary': '14 80% 52%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '355 50% 32%',
    '--secondary-foreground': '0 0% 100%',
    '--muted': '30 15% 93%',
    '--muted-foreground': '20 10% 46%',
    '--accent': '38 75% 55%',
    '--accent-foreground': '20 25% 10%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '30 15% 89%',
    '--input': '30 15% 89%',
    '--ring': '14 80% 52%',
    '--teal': '168 55% 32%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 45% 72%',
    '--deep-maroon': '355 60% 22%',
    '--warm-ivory': '40 30% 95%',
    '--mehendi-green': '140 35% 38%',
    '--mehendi-dark': '140 30% 18%',
    '--gold-shimmer': '42 80% 60%',
  },
};

const mintFresh: AppTheme = {
  id: 'mint-fresh',
  name: 'Mint Fresh',
  description: 'Refreshing teal, mint green & airy whites',
  mode: 'light',
  preview: { primary: '#0D9488', background: '#F0FDF9', accent: '#2DD4BF', card: '#FFFFFF' },
  vars: {
    '--background': '166 76% 97%',
    '--foreground': '172 46% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '172 46% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '172 46% 10%',
    '--primary': '173 58% 39%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '167 40% 91%',
    '--secondary-foreground': '172 46% 10%',
    '--muted': '168 30% 95%',
    '--muted-foreground': '172 10% 45%',
    '--accent': '168 76% 50%',
    '--accent-foreground': '172 46% 10%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '168 20% 90%',
    '--input': '168 20% 90%',
    '--ring': '173 58% 39%',
    '--teal': '173 58% 39%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 35% 72%',
    '--deep-maroon': '173 55% 20%',
    '--warm-ivory': '166 20% 97%',
    '--mehendi-green': '160 40% 40%',
    '--mehendi-dark': '160 35% 18%',
    '--gold-shimmer': '48 80% 55%',
  },
};

const roseGold: AppTheme = {
  id: 'rose-gold',
  name: 'Rose Gold',
  description: 'Soft pink, rose gold shimmer & warm cream',
  mode: 'light',
  preview: { primary: '#E11D48', background: '#FFF5F7', accent: '#F59E0B', card: '#FFFFFF' },
  vars: {
    '--background': '340 50% 98%',
    '--foreground': '340 40% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '340 40% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '340 40% 10%',
    '--primary': '347 77% 50%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '340 20% 94%',
    '--secondary-foreground': '340 40% 10%',
    '--muted': '340 18% 95%',
    '--muted-foreground': '340 10% 46%',
    '--accent': '36 93% 52%',
    '--accent-foreground': '340 40% 10%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '340 15% 90%',
    '--input': '340 15% 90%',
    '--ring': '347 77% 50%',
    '--teal': '168 55% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '347 50% 68%',
    '--deep-maroon': '347 60% 25%',
    '--warm-ivory': '340 25% 97%',
    '--mehendi-green': '160 35% 38%',
    '--mehendi-dark': '160 30% 18%',
    '--gold-shimmer': '36 90% 55%',
  },
};

const silverMinimal: AppTheme = {
  id: 'silver-minimal',
  name: 'Silver Minimal',
  description: 'Clean slate, monochrome elegance & pure white',
  mode: 'light',
  preview: { primary: '#475569', background: '#F8FAFC', accent: '#64748B', card: '#FFFFFF' },
  vars: {
    '--background': '210 40% 98%',
    '--foreground': '222 47% 11%',
    '--card': '0 0% 100%',
    '--card-foreground': '222 47% 11%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '222 47% 11%',
    '--primary': '215 20% 33%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '210 40% 96%',
    '--secondary-foreground': '222 47% 11%',
    '--muted': '210 40% 96%',
    '--muted-foreground': '215 16% 47%',
    '--accent': '215 16% 47%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '214 32% 91%',
    '--input': '214 32% 91%',
    '--ring': '215 20% 33%',
    '--teal': '168 55% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 15% 60%',
    '--deep-maroon': '215 35% 22%',
    '--warm-ivory': '210 20% 97%',
    '--mehendi-green': '160 25% 35%',
    '--mehendi-dark': '160 20% 18%',
    '--gold-shimmer': '45 50% 50%',
  },
};

// ═══════════════════════════════════════════
//   DARK THEMES
// ═══════════════════════════════════════════

const premiumDark: AppTheme = {
  id: 'premium-dark',
  name: 'Premium Dark',
  description: 'Midnight blue & indigo — sleek and modern',
  mode: 'dark',
  preview: { primary: '#818CF8', background: '#0F172A', accent: '#A855F7', card: '#1E293B' },
  vars: {
    '--background': '224 71% 4%',
    '--foreground': '213 31% 91%',
    '--card': '222 47% 11%',
    '--card-foreground': '213 31% 91%',
    '--popover': '222 47% 11%',
    '--popover-foreground': '213 31% 91%',
    '--primary': '239 84% 67%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '223 47% 16%',
    '--secondary-foreground': '213 31% 91%',
    '--muted': '223 47% 13%',
    '--muted-foreground': '215 20% 55%',
    '--accent': '262 83% 58%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '216 34% 17%',
    '--input': '216 34% 17%',
    '--ring': '239 84% 67%',
    '--teal': '168 40% 45%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 25% 50%',
    '--deep-maroon': '239 40% 30%',
    '--warm-ivory': '224 10% 12%',
    '--mehendi-green': '160 25% 35%',
    '--mehendi-dark': '160 20% 12%',
    '--gold-shimmer': '45 50% 45%',
  },
};

const onyxBlack: AppTheme = {
  id: 'onyx-black',
  name: 'Onyx Black',
  description: 'Pure OLED black & saffron accents — dramatic contrast',
  mode: 'dark',
  preview: { primary: '#F97316', background: '#000000', accent: '#FBBF24', card: '#0A0A0A' },
  vars: {
    '--background': '0 0% 0%',
    '--foreground': '0 0% 92%',
    '--card': '0 0% 4%',
    '--card-foreground': '0 0% 92%',
    '--popover': '0 0% 4%',
    '--popover-foreground': '0 0% 92%',
    '--primary': '24 95% 53%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '0 0% 10%',
    '--secondary-foreground': '0 0% 92%',
    '--muted': '0 0% 8%',
    '--muted-foreground': '0 0% 55%',
    '--accent': '45 93% 57%',
    '--accent-foreground': '0 0% 5%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '0 0% 14%',
    '--input': '0 0% 14%',
    '--ring': '24 95% 53%',
    '--teal': '168 40% 40%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 35% 55%',
    '--deep-maroon': '24 60% 25%',
    '--warm-ivory': '0 0% 6%',
    '--mehendi-green': '160 25% 30%',
    '--mehendi-dark': '160 20% 8%',
    '--gold-shimmer': '45 80% 50%',
  },
};

const deepOcean: AppTheme = {
  id: 'deep-ocean',
  name: 'Deep Ocean',
  description: 'Abyssal navy, luminous cyan & deep sea ambiance',
  mode: 'dark',
  preview: { primary: '#06B6D4', background: '#0B1120', accent: '#22D3EE', card: '#111827' },
  vars: {
    '--background': '222 55% 5%',
    '--foreground': '195 20% 90%',
    '--card': '222 47% 8%',
    '--card-foreground': '195 20% 90%',
    '--popover': '222 47% 8%',
    '--popover-foreground': '195 20% 90%',
    '--primary': '187 86% 42%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '222 35% 14%',
    '--secondary-foreground': '195 20% 90%',
    '--muted': '222 35% 11%',
    '--muted-foreground': '210 18% 50%',
    '--accent': '187 92% 49%',
    '--accent-foreground': '222 50% 8%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '222 25% 16%',
    '--input': '222 25% 16%',
    '--ring': '187 86% 42%',
    '--teal': '187 60% 40%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 20% 50%',
    '--deep-maroon': '187 50% 20%',
    '--warm-ivory': '222 15% 8%',
    '--mehendi-green': '170 30% 32%',
    '--mehendi-dark': '170 25% 12%',
    '--gold-shimmer': '48 55% 45%',
  },
};

const crimsonNight: AppTheme = {
  id: 'crimson-night',
  name: 'Crimson Night',
  description: 'Dark maroon, crimson red & warm noir ambiance',
  mode: 'dark',
  preview: { primary: '#DC2626', background: '#1A0A0A', accent: '#FB923C', card: '#1F1111' },
  vars: {
    '--background': '0 40% 5%',
    '--foreground': '0 10% 90%',
    '--card': '0 25% 8%',
    '--card-foreground': '0 10% 90%',
    '--popover': '0 25% 8%',
    '--popover-foreground': '0 10% 90%',
    '--primary': '0 72% 51%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '0 20% 14%',
    '--secondary-foreground': '0 10% 90%',
    '--muted': '0 18% 11%',
    '--muted-foreground': '0 10% 50%',
    '--accent': '27 96% 61%',
    '--accent-foreground': '0 0% 5%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '0 15% 16%',
    '--input': '0 15% 16%',
    '--ring': '0 72% 51%',
    '--teal': '168 35% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '0 30% 55%',
    '--deep-maroon': '0 50% 20%',
    '--warm-ivory': '0 10% 8%',
    '--mehendi-green': '160 20% 28%',
    '--mehendi-dark': '160 15% 10%',
    '--gold-shimmer': '30 60% 45%',
  },
};

const forestDark: AppTheme = {
  id: 'forest-dark',
  name: 'Forest Dark',
  description: 'Deep pine, emerald green & nature-inspired serenity',
  mode: 'dark',
  preview: { primary: '#16A34A', background: '#071210', accent: '#4ADE80', card: '#0C1F1B' },
  vars: {
    '--background': '160 35% 4%',
    '--foreground': '140 15% 90%',
    '--card': '155 28% 8%',
    '--card-foreground': '140 15% 90%',
    '--popover': '155 28% 8%',
    '--popover-foreground': '140 15% 90%',
    '--primary': '142 71% 45%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '155 25% 14%',
    '--secondary-foreground': '140 15% 90%',
    '--muted': '155 20% 11%',
    '--muted-foreground': '150 12% 48%',
    '--accent': '142 69% 58%',
    '--accent-foreground': '155 35% 6%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '155 18% 16%',
    '--input': '155 18% 16%',
    '--ring': '142 71% 45%',
    '--teal': '160 45% 40%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 15% 45%',
    '--deep-maroon': '142 40% 20%',
    '--warm-ivory': '155 12% 8%',
    '--mehendi-green': '142 40% 38%',
    '--mehendi-dark': '142 35% 12%',
    '--gold-shimmer': '50 50% 40%',
  },
};

// ═══════════════════════════════════════════
//   EXPORTS
// ═══════════════════════════════════════════

/** All themes keyed by ID */
export const THEMES: Record<string, AppTheme> = {
  'premium-white': premiumWhite,
  'saffron-warmth': saffronWarmth,
  'mint-fresh': mintFresh,
  'rose-gold': roseGold,
  'silver-minimal': silverMinimal,
  'premium-dark': premiumDark,
  'onyx-black': onyxBlack,
  'deep-ocean': deepOcean,
  'crimson-night': crimsonNight,
  'forest-dark': forestDark,
};

/** Light themes */
export const LIGHT_THEMES = [premiumWhite, saffronWarmth, mintFresh, roseGold, silverMinimal];

/** Dark themes */
export const DARK_THEMES = [premiumDark, onyxBlack, deepOcean, crimsonNight, forestDark];

/** All themes as array */
export const ALL_THEMES = [...LIGHT_THEMES, ...DARK_THEMES];

/** Default theme ID */
export const DEFAULT_THEME_ID = 'premium-white';
