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
export function premiumShadow(color: string = '#00ff87', level: 'sm' | 'md' | 'lg' = 'md'): ViewStyle {
  const shadowMap = {
    sm: { opacity: 0.16, radius: 10, offsetY: 3, elevation: 3 },
    md: { opacity: 0.24, radius: 18, offsetY: 6, elevation: 6 },
    lg: { opacity: 0.36, radius: 28, offsetY: 10, elevation: 10 },
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
