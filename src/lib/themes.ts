/**
 * themes.ts — 10 Premium Editorial Theme Definitions v2
 *
 * 5 Light Themes (warm, romantic, premium palettes)
 * 5 Dark Themes (velvet, ember, noir, sapphire, jungle)
 *
 * Default: blush-romance (warm pink + cream)
 * Super admin can push any theme live to all users via global_settings.
 */

export type ThemeMode = 'light' | 'dark';

export interface AppTheme {
  id: string;
  name: string;
  description: string;
  mode: ThemeMode;
  /** Hero gradient — used in HomeHeader animated background */
  heroGradient: string;
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

/** 1. Blush Romance — Default. Warm rose pink + cream + gold */
const blushRomance: AppTheme = {
  id: 'blush-romance',
  name: 'Blush Romance',
  description: 'Warm rose pink, cream & champagne gold — romantic and timeless',
  mode: 'light',
  heroGradient: 'linear-gradient(145deg, #E91E63 0%, #C2185B 30%, #E91E8C 60%, #AD1457 100%)',
  preview: { primary: '#E91E63', background: '#FFF5F7', accent: '#F59E0B', card: '#FFFFFF' },
  vars: {
    '--background': '340 60% 98%',
    '--foreground': '340 40% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '340 40% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '340 40% 10%',
    '--primary': '336 82% 52%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '340 30% 95%',
    '--secondary-foreground': '340 40% 10%',
    '--muted': '340 20% 96%',
    '--muted-foreground': '340 10% 46%',
    '--accent': '36 93% 52%',
    '--accent-foreground': '340 40% 10%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '340 20% 91%',
    '--input': '340 20% 91%',
    '--ring': '336 82% 52%',
    '--teal': '168 55% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '336 50% 70%',
    '--deep-maroon': '336 70% 25%',
    '--warm-ivory': '340 30% 97%',
    '--mehendi-green': '160 35% 38%',
    '--mehendi-dark': '160 30% 18%',
    '--gold-shimmer': '42 85% 58%',
  },
};

/** 2. Champagne Gold — Warm gold + rich ivory + amber */
const champagneGold: AppTheme = {
  id: 'champagne-gold',
  name: 'Champagne Gold',
  description: 'Warm champagne, rich amber & creamy ivory — pure luxury',
  mode: 'light',
  heroGradient: 'linear-gradient(145deg, #D4971E 0%, #C68B1A 30%, #E8A020 60%, #B8790F 100%)',
  preview: { primary: '#D4971E', background: '#FEFCF5', accent: '#DC7A1E', card: '#FFFFFF' },
  vars: {
    '--background': '45 50% 98%',
    '--foreground': '30 40% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '30 40% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '30 40% 10%',
    '--primary': '38 75% 47%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '42 40% 93%',
    '--secondary-foreground': '30 40% 10%',
    '--muted': '42 30% 95%',
    '--muted-foreground': '30 10% 48%',
    '--accent': '24 80% 50%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '42 20% 89%',
    '--input': '42 20% 89%',
    '--ring': '38 75% 47%',
    '--teal': '168 45% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '20 55% 68%',
    '--deep-maroon': '38 65% 22%',
    '--warm-ivory': '45 30% 96%',
    '--mehendi-green': '140 35% 38%',
    '--mehendi-dark': '140 30% 18%',
    '--gold-shimmer': '42 85% 55%',
  },
};

/** 3. Lavender Mist — Soft purple + white + lilac */
const lavenderMist: AppTheme = {
  id: 'lavender-mist',
  name: 'Lavender Mist',
  description: 'Dreamy lavender, soft lilac & misty white — elegant serenity',
  mode: 'light',
  heroGradient: 'linear-gradient(145deg, #7C3AED 0%, #6D28D9 30%, #8B5CF6 60%, #5B21B6 100%)',
  preview: { primary: '#7C3AED', background: '#FAF8FF', accent: '#D946EF', card: '#FFFFFF' },
  vars: {
    '--background': '260 40% 98%',
    '--foreground': '260 40% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '260 40% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '260 40% 10%',
    '--primary': '262 83% 58%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '260 30% 95%',
    '--secondary-foreground': '260 40% 10%',
    '--muted': '260 20% 96%',
    '--muted-foreground': '260 10% 48%',
    '--accent': '292 84% 61%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '260 18% 91%',
    '--input': '260 18% 91%',
    '--ring': '262 83% 58%',
    '--teal': '168 50% 40%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '320 40% 70%',
    '--deep-maroon': '262 60% 25%',
    '--warm-ivory': '260 20% 97%',
    '--mehendi-green': '160 35% 38%',
    '--mehendi-dark': '160 30% 18%',
    '--gold-shimmer': '45 75% 55%',
  },
};

/** 4. Peach Blossom — Peach + coral + soft cream */
const peachBlossom: AppTheme = {
  id: 'peach-blossom',
  name: 'Peach Blossom',
  description: 'Sun-kissed peach, coral warmth & soft cream — joyful & bright',
  mode: 'light',
  heroGradient: 'linear-gradient(145deg, #F97316 0%, #EA580C 30%, #FB923C 60%, #DC6209 100%)',
  preview: { primary: '#F97316', background: '#FFF8F5', accent: '#E11D48', card: '#FFFFFF' },
  vars: {
    '--background': '20 60% 98%',
    '--foreground': '20 40% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '20 40% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '20 40% 10%',
    '--primary': '24 95% 53%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '20 40% 94%',
    '--secondary-foreground': '20 40% 10%',
    '--muted': '20 25% 96%',
    '--muted-foreground': '20 10% 48%',
    '--accent': '347 77% 50%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '20 20% 90%',
    '--input': '20 20% 90%',
    '--ring': '24 95% 53%',
    '--teal': '168 50% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '340 45% 68%',
    '--deep-maroon': '24 65% 22%',
    '--warm-ivory': '20 30% 97%',
    '--mehendi-green': '140 35% 38%',
    '--mehendi-dark': '140 30% 18%',
    '--gold-shimmer': '38 90% 58%',
  },
};

/** 5. Arctic White — Ultra clean white + electric blue */
const arcticWhite: AppTheme = {
  id: 'arctic-white',
  name: 'Arctic White',
  description: 'Crisp arctic white, electric blue & silver — modern precision',
  mode: 'light',
  heroGradient: 'linear-gradient(145deg, #0EA5E9 0%, #0284C7 30%, #38BDF8 60%, #0369A1 100%)',
  preview: { primary: '#0EA5E9', background: '#F8FAFF', accent: '#6366F1', card: '#FFFFFF' },
  vars: {
    '--background': '210 60% 98%',
    '--foreground': '210 40% 10%',
    '--card': '0 0% 100%',
    '--card-foreground': '210 40% 10%',
    '--popover': '0 0% 100%',
    '--popover-foreground': '210 40% 10%',
    '--primary': '199 89% 48%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '210 30% 95%',
    '--secondary-foreground': '210 40% 10%',
    '--muted': '210 20% 96%',
    '--muted-foreground': '210 10% 48%',
    '--accent': '239 84% 67%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 72% 51%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '210 18% 91%',
    '--input': '210 18% 91%',
    '--ring': '199 89% 48%',
    '--teal': '168 55% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 30% 65%',
    '--deep-maroon': '199 70% 20%',
    '--warm-ivory': '210 25% 97%',
    '--mehendi-green': '160 35% 38%',
    '--mehendi-dark': '160 30% 18%',
    '--gold-shimmer': '45 75% 55%',
  },
};

// ═══════════════════════════════════════════
//   DARK THEMES
// ═══════════════════════════════════════════

/** 6. Velvet Night — Deep purple + gold + midnight luxury */
const velvetNight: AppTheme = {
  id: 'velvet-night',
  name: 'Velvet Night',
  description: 'Midnight velvet purple, liquid gold & deep noir — opulent luxury',
  mode: 'dark',
  heroGradient: 'linear-gradient(145deg, #4C1D95 0%, #5B21B6 30%, #6D28D9 60%, #3B0764 100%)',
  preview: { primary: '#A78BFA', background: '#0D0720', accent: '#F59E0B', card: '#1A0D35' },
  vars: {
    '--background': '262 60% 5%',
    '--foreground': '260 20% 92%',
    '--card': '262 45% 9%',
    '--card-foreground': '260 20% 92%',
    '--popover': '262 45% 9%',
    '--popover-foreground': '260 20% 92%',
    '--primary': '262 70% 70%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '262 30% 16%',
    '--secondary-foreground': '260 20% 92%',
    '--muted': '262 25% 12%',
    '--muted-foreground': '260 15% 52%',
    '--accent': '38 90% 55%',
    '--accent-foreground': '262 60% 5%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '262 20% 18%',
    '--input': '262 20% 18%',
    '--ring': '262 70% 70%',
    '--teal': '168 40% 40%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '336 40% 55%',
    '--deep-maroon': '262 50% 20%',
    '--warm-ivory': '262 15% 8%',
    '--mehendi-green': '160 25% 32%',
    '--mehendi-dark': '160 20% 10%',
    '--gold-shimmer': '42 85% 50%',
  },
};

/** 7. Ember Glow — Dark charcoal + warm orange ember + amber */
const emberGlow: AppTheme = {
  id: 'ember-glow',
  name: 'Ember Glow',
  description: 'Dark charcoal, burning ember orange & molten amber — intense & bold',
  mode: 'dark',
  heroGradient: 'linear-gradient(145deg, #92400E 0%, #B45309 30%, #D97706 60%, #78350F 100%)',
  preview: { primary: '#F59E0B', background: '#0C0903', accent: '#EF4444', card: '#1A1008' },
  vars: {
    '--background': '24 50% 3%',
    '--foreground': '30 20% 90%',
    '--card': '24 35% 7%',
    '--card-foreground': '30 20% 90%',
    '--popover': '24 35% 7%',
    '--popover-foreground': '30 20% 90%',
    '--primary': '38 92% 50%',
    '--primary-foreground': '24 50% 3%',
    '--secondary': '24 25% 14%',
    '--secondary-foreground': '30 20% 90%',
    '--muted': '24 20% 10%',
    '--muted-foreground': '30 12% 50%',
    '--accent': '0 84% 60%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '24 18% 16%',
    '--input': '24 18% 16%',
    '--ring': '38 92% 50%',
    '--teal': '168 35% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '20 40% 50%',
    '--deep-maroon': '24 55% 20%',
    '--warm-ivory': '24 12% 7%',
    '--mehendi-green': '140 25% 28%',
    '--mehendi-dark': '140 20% 8%',
    '--gold-shimmer': '38 90% 48%',
  },
};

/** 8. Sapphire Dark — Rich navy + deep sapphire + silver chrome */
const sapphireDark: AppTheme = {
  id: 'sapphire-dark',
  name: 'Sapphire Dark',
  description: 'Deep royal navy, lustrous sapphire & chrome silver — prestige',
  mode: 'dark',
  heroGradient: 'linear-gradient(145deg, #1E3A8A 0%, #1D4ED8 30%, #2563EB 60%, #172554 100%)',
  preview: { primary: '#60A5FA', background: '#030B1A', accent: '#818CF8', card: '#0A1628' },
  vars: {
    '--background': '220 60% 4%',
    '--foreground': '214 25% 90%',
    '--card': '220 45% 8%',
    '--card-foreground': '214 25% 90%',
    '--popover': '220 45% 8%',
    '--popover-foreground': '214 25% 90%',
    '--primary': '213 93% 68%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '220 30% 14%',
    '--secondary-foreground': '214 25% 90%',
    '--muted': '220 25% 10%',
    '--muted-foreground': '214 15% 50%',
    '--accent': '239 84% 67%',
    '--accent-foreground': '0 0% 100%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '220 20% 18%',
    '--input': '220 20% 18%',
    '--ring': '213 93% 68%',
    '--teal': '187 60% 42%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 20% 48%',
    '--deep-maroon': '213 55% 20%',
    '--warm-ivory': '220 12% 7%',
    '--mehendi-green': '160 25% 30%',
    '--mehendi-dark': '160 20% 8%',
    '--gold-shimmer': '45 60% 45%',
  },
};

/** 9. Rose Noir — Dark noir + rose gold + muted blush */
const roseNoir: AppTheme = {
  id: 'rose-noir',
  name: 'Rose Noir',
  description: 'Dark noir elegance, rose gold shimmer & dusty blush — mysterious romance',
  mode: 'dark',
  heroGradient: 'linear-gradient(145deg, #881337 0%, #9F1239 30%, #BE185D 60%, #701A35 100%)',
  preview: { primary: '#FB7185', background: '#0D0408', accent: '#FCA5A5', card: '#1A0810' },
  vars: {
    '--background': '336 50% 4%',
    '--foreground': '336 15% 90%',
    '--card': '336 35% 8%',
    '--card-foreground': '336 15% 90%',
    '--popover': '336 35% 8%',
    '--popover-foreground': '336 15% 90%',
    '--primary': '350 89% 72%',
    '--primary-foreground': '0 0% 100%',
    '--secondary': '336 25% 14%',
    '--secondary-foreground': '336 15% 90%',
    '--muted': '336 20% 10%',
    '--muted-foreground': '336 10% 50%',
    '--accent': '350 80% 80%',
    '--accent-foreground': '336 50% 4%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '336 15% 17%',
    '--input': '336 15% 17%',
    '--ring': '350 89% 72%',
    '--teal': '168 35% 38%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '336 50% 62%',
    '--deep-maroon': '336 55% 18%',
    '--warm-ivory': '336 10% 7%',
    '--mehendi-green': '160 20% 28%',
    '--mehendi-dark': '160 15% 8%',
    '--gold-shimmer': '25 55% 45%',
  },
};

/** 10. Jungle Night — Deep forest + vivid emerald + teal */
const jungleNight: AppTheme = {
  id: 'jungle-night',
  name: 'Jungle Night',
  description: 'Dark jungle forest, vivid emerald & electric teal — natural intensity',
  mode: 'dark',
  heroGradient: 'linear-gradient(145deg, #064E3B 0%, #065F46 30%, #059669 60%, #022C22 100%)',
  preview: { primary: '#34D399', background: '#020E09', accent: '#6EE7B7', card: '#061A10' },
  vars: {
    '--background': '155 60% 3%',
    '--foreground': '150 20% 90%',
    '--card': '155 45% 7%',
    '--card-foreground': '150 20% 90%',
    '--popover': '155 45% 7%',
    '--popover-foreground': '150 20% 90%',
    '--primary': '160 84% 52%',
    '--primary-foreground': '155 60% 3%',
    '--secondary': '155 30% 13%',
    '--secondary-foreground': '150 20% 90%',
    '--muted': '155 25% 9%',
    '--muted-foreground': '150 12% 50%',
    '--accent': '166 76% 58%',
    '--accent-foreground': '155 60% 3%',
    '--destructive': '0 62% 50%',
    '--destructive-foreground': '0 0% 100%',
    '--border': '155 20% 16%',
    '--input': '155 20% 16%',
    '--ring': '160 84% 52%',
    '--teal': '174 60% 42%',
    '--teal-foreground': '0 0% 100%',
    '--rose-gold': '14 15% 45%',
    '--deep-maroon': '160 45% 18%',
    '--warm-ivory': '155 12% 6%',
    '--mehendi-green': '152 45% 38%',
    '--mehendi-dark': '152 35% 12%',
    '--gold-shimmer': '48 55% 42%',
  },
};

// ═══════════════════════════════════════════
//   EXPORTS
// ═══════════════════════════════════════════

/** All themes keyed by ID */
export const THEMES: Record<string, AppTheme> = {
  'blush-romance': blushRomance,
  'champagne-gold': champagneGold,
  'lavender-mist': lavenderMist,
  'peach-blossom': peachBlossom,
  'arctic-white': arcticWhite,
  'velvet-night': velvetNight,
  'ember-glow': emberGlow,
  'sapphire-dark': sapphireDark,
  'rose-noir': roseNoir,
  'jungle-night': jungleNight,
};

/** Light themes */
export const LIGHT_THEMES = [blushRomance, champagneGold, lavenderMist, peachBlossom, arcticWhite];

/** Dark themes */
export const DARK_THEMES = [velvetNight, emberGlow, sapphireDark, roseNoir, jungleNight];

/** All themes as array */
export const ALL_THEMES = [...LIGHT_THEMES, ...DARK_THEMES];

/** Default theme ID — Blush Romance */
export const DEFAULT_THEME_ID = 'blush-romance';
