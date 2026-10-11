import { Platform, ViewStyle } from 'react-native';

export const RADIUS = {
  xs: 8,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
};

export const FONT = {
  regular: 'Manrope_400Regular',
  medium: 'Manrope_500Medium',
  semiBold: 'Manrope_600SemiBold',
  bold: 'Manrope_700Bold',
  extraBold: 'Manrope_800ExtraBold',
};

/**
 * Soft, colored elevation used across cards. On native this maps to the
 * shadow and elevation props; react-native-web translates the shadow
 * props to a CSS box-shadow, so the same call works on web too.
 */
export function premiumShadow(color: string, level: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): ViewStyle {
  const shadowMap: Record<string, { opacity: number; radius: number; offsetY: number; elevation: number }> = {
    xs: { opacity: 0.03, radius: 6, offsetY: 2, elevation: 1 },
    sm: { opacity: 0.04, radius: 12, offsetY: 4, elevation: 2 },
    md: { opacity: 0.06, radius: 20, offsetY: 8, elevation: 4 },
    lg: { opacity: 0.08, radius: 30, offsetY: 12, elevation: 8 },
    xl: { opacity: 0.12, radius: 40, offsetY: 16, elevation: 12 },
  };
  const levels = shadowMap[level] ?? shadowMap.sm;

  return {
    shadowColor: color,
    shadowOpacity: levels.opacity,
    shadowRadius: levels.radius,
    shadowOffset: { width: 0, height: levels.offsetY },
    elevation: levels.elevation,
  };
}

/** Hairline border that reads on both light cards and gradients. */
export const HAIRLINE_BORDER = Platform.select({
  web: { borderWidth: 1, borderColor: 'rgba(15, 23, 42, 0.06)' },
  default: { borderWidth: StyleSheetHairline(), borderColor: 'rgba(15, 23, 42, 0.06)' },
});

function StyleSheetHairline() {
  // Kept as a function to avoid importing StyleSheet just for one constant.
  return 0.5;
}

/**
 * 🌌 4D Futuristic Command Center Design Tokens
 * Premium dark theme with deep forest green, obsidian black, emerald neon & subtle cyber gold.
 */
export const THEME_4D = {
  bgAbyss: '#020905',
  bgDarkForest: '#04140a',
  bgCardGlass: 'rgba(6, 26, 15, 0.72)',
  bgCardGlassLight: 'rgba(8, 34, 20, 0.6)',
  bgCardSolid: '#071d10',
  borderGlass: 'rgba(0, 255, 135, 0.2)',
  borderGlassHover: 'rgba(0, 255, 135, 0.65)',
  borderGlassSubtle: 'rgba(255, 255, 255, 0.08)',
  neonEmerald: '#00ff87',
  neonEmeraldGlow: 'rgba(0, 255, 135, 0.35)',
  laserMint: '#10b981',
  cyberCyan: '#00f2fe',
  cyberGold: '#f59e0b',
  cyberGoldGlow: 'rgba(245, 158, 11, 0.3)',
  criticalRed: '#ef4444',
  textPrimary: '#ffffff',
  textSecondary: '#e2e8f0',
  textMuted: '#94a3b8',
  textDim: '#64748b',
};

/**
 * 4D Luminous Glow & Shadow
 */
export function neonGlow(color: string = '#00ff87', level: 'sm' | 'md' | 'lg' = 'md'): ViewStyle {
  const levels = {
    sm: { opacity: 0.3, radius: 10, elevation: 3 },
    md: { opacity: 0.45, radius: 18, elevation: 6 },
    lg: { opacity: 0.65, radius: 28, elevation: 12 },
  }[level];

  return {
    shadowColor: color,
    shadowOpacity: levels.opacity,
    shadowRadius: levels.radius,
    shadowOffset: { width: 0, height: 0 },
    elevation: levels.elevation,
  };
}
