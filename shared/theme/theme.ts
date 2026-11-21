import { Platform, ViewStyle } from 'react-native';

export const RADIUS = {
  xs: 8,
  sm: 14,
  md: 18,
  lg: 24,
  xl: 32,
  xxl: 40,
  pill: 999,
  full: 9999,
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  cardGap: 16,
  cardPadding: 16,
  tableRowPadding: 14,
  buttonPaddingY: 10,
  buttonPaddingX: 16,
  buttonGap: 10,
  sectionGap: 22,
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
export function premiumShadow(color: string = '#00ff87', level: 'xs' | 'sm' | 'md' | 'lg' | 'xl' = 'md'): ViewStyle {
  const shadowMap = {
    xs: { opacity: 0.10, radius: 6, offsetY: 2, elevation: 2 },
    sm: { opacity: 0.16, radius: 10, offsetY: 3, elevation: 3 },
    md: { opacity: 0.24, radius: 18, offsetY: 6, elevation: 6 },
    lg: { opacity: 0.36, radius: 28, offsetY: 10, elevation: 10 },
    xl: { opacity: 0.45, radius: 36, offsetY: 14, elevation: 14 },
  };
  const levels = shadowMap[level] ?? shadowMap.sm;

  return {
    shadowColor: color || '#00ff87',
    shadowOpacity: levels.opacity,
    shadowRadius: levels.radius,
    shadowOffset: { width: 0, height: levels.offsetY },
    elevation: levels.elevation,
  };
}

/** Hairline border with cyber neon glass glow. */
export const HAIRLINE_BORDER = Platform.select({
  web: { borderWidth: 1, borderColor: 'rgba(0, 255, 135, 0.20)' },
  default: { borderWidth: 1, borderColor: 'rgba(0, 255, 135, 0.20)' },
});

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
