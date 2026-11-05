import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, Platform, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { resolveMediaUrl } from '@/src/api/client';

const LOGO_ICON_FAST = require('@/assets/images/farmsking_logo_icon.png');
const LOGO_STANDARD = require('@/assets/images/farmsking_logo.png');
const LOGO_HD = require('@/assets/images/farmsking_logo_hd.png');
const LOGO_DARK = require('@/assets/images/farmsking_logo_dark.png');
const LOGO_ROUND_GOLDRING = require('@/assets/images/farmsking_logo_round_goldring.png');

interface BrandLogoProps {
  size?: number;
  width?: number | string;
  height?: number | string;
  aspectRatio?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle | ImageStyle>;
  fallbackIconName?: keyof typeof Ionicons.glyphMap;
  useCrownFallback?: boolean;
  useHdQuality?: boolean;
  useFastBundledOnly?: boolean;
  useGoldRing?: boolean;
  round?: boolean;
  dark?: boolean;
  isNight?: boolean;
  resizeMode?: 'contain' | 'cover' | 'stretch' | 'center';
}

function resolveAsset(src: any) {
  if (!src) return undefined;
  if (typeof src === 'string') return { uri: src };
  if (typeof src === 'number') {
    const resolved = Image.resolveAssetSource(src);
    return resolved || src;
  }
  if (typeof src === 'object') {
    if (src.uri) return src;
    if (src.default) {
      return typeof src.default === 'string' ? { uri: src.default } : src.default;
    }
  }
  return src;
}

export function BrandLogo({
  size,
  width,
  height,
  aspectRatio,
  iconColor = '#facc15',
  style,
  useCrownFallback = false,
  useHdQuality = false,
  useFastBundledOnly = false,
  useGoldRing = false,
  round = false,
  dark = false,
  isNight = false,
  resizeMode = 'contain',
}: BrandLogoProps) {
  const { data: settings } = useAppSettings();

  const [imageError, setImageError] = useState(false);
  const isDarkMode = dark || isNight;

  // Highest priority: The official Brand Logo saved in Settings
  const rawLogo = settings?.logoUrl || '/brand_logo.png';
  const logoUri = resolveMediaUrl(rawLogo);

  useEffect(() => {
    setImageError(false);
  }, [logoUri]);

  // Optimal bundled fallback asset (light vs dark mode aware)
  const bundledAsset = isDarkMode
    ? LOGO_DARK
    : useHdQuality
    ? LOGO_HD
    : (size && size <= 58)
    ? LOGO_ICON_FAST
    : LOGO_STANDARD;

  // Guard against known broken legacy URLs, remote JPEGs with white boxes, or invalid schemes
  const isInvalidRemoteLogo =
    !logoUri ||
    logoUri.includes('farmsking.in/assets/logo.png') ||
    logoUri.includes('farmsking.in/brand_logo.png') ||
    logoUri.includes('farmsking.in/brand_logo.jpeg') ||
    imageError;

  // When dark mode is active or bundled HD is requested, prefer the 100% transparent bundled asset
  const shouldUseBundled = useFastBundledOnly || isDarkMode || useHdQuality || isInvalidRemoteLogo;

  const finalSource = !shouldUseBundled && !isInvalidRemoteLogo
    ? { uri: logoUri }
    : resolveAsset(bundledAsset);

  // Compute responsive dimensions
  const finalHeight = height ?? size ?? 36;
  const finalWidth = width ?? (aspectRatio && typeof finalHeight === 'number' ? finalHeight * aspectRatio : (size ?? 36));
  const finalBorderRadius = round ? (typeof finalHeight === 'number' ? finalHeight / 2 : 18) : 0;

  return (
    <Image
      source={finalSource}
      style={[
        { 
          width: finalWidth as any, 
          height: finalHeight as any, 
          backgroundColor: 'transparent',
          borderRadius: finalBorderRadius,
          ...(Platform.OS === 'web' ? ({
            imageRendering: '-webkit-optimize-contrast',
            WebkitBackfaceVisibility: 'hidden',
          } as any) : {}),
        }, 
        style as StyleProp<ImageStyle>
      ]}
      resizeMode={resizeMode}
      onError={() => {
        setImageError(true);
      }}
    />
  );
}
