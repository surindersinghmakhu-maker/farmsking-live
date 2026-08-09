import { Platform, ViewStyle } from 'react-native';

export const RADIUS = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 26,
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
export function premiumShadow(color: string, level: 'sm' | 'md' | 'lg' = 'md'): ViewStyle {
  const shadowMap = {
    sm: { opacity: 0.08, radius: 10, offsetY: 4, elevation: 3 },
    md: { opacity: 0.12, radius: 18, offsetY: 8, elevation: 6 },
    lg: { opacity: 0.18, radius: 28, offsetY: 14, elevation: 10 },
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
