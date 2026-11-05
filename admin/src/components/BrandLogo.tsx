import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, Platform, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { resolveMediaUrl } from '@/src/api/client';

const LOGO_HD = require('@/assets/images/farmsking_logo_hd.png');
const LOGO_DARK = require('@/assets/images/farmsking_logo_dark.png');
const LOGO_ROUND_GOLDRING = require('@/assets/images/farmsking_logo_round_goldring.png');
const LOGO_FAVICON = require('@/assets/images/favicon.png');

export interface BrandLogoProps {
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
  useFavicon?: boolean;
  emblem?: boolean;
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
  useHdQuality = true,
  useFastBundledOnly = false,
  useGoldRing = false,
  round = false,
  dark = false,
  isNight = false,
  useFavicon = false,
  emblem = false,
  resizeMode = 'contain',
}: BrandLogoProps) {
  const { data: settings } = useAppSettings();

  const [imageError, setImageError] = useState(false);
  const isDarkMode = dark || isNight;
  const isEmblemMode = round || useGoldRing || useFavicon || emblem;

  // Highest priority: The official Brand Logo saved in Settings
  const rawLogo = settings?.logoUrl || '/brand_logo.png';
  const logoUri = resolveMediaUrl(rawLogo);

  useEffect(() => {
    setImageError(false);
  }, [logoUri]);

  // Optimal bundled master asset: 1254x1254 Emblem or 1600x533 Wide Banner
  const bundledAsset = isEmblemMode
    ? LOGO_FAVICON
    : isDarkMode
    ? LOGO_DARK
    : LOGO_HD;

  // Guard against known broken legacy URLs, remote JPEGs with white boxes, or invalid schemes
  const isInvalidRemoteLogo =
    !logoUri ||
    isEmblemMode ||
    logoUri.includes('farmsking.in/assets/logo.png') ||
    logoUri.includes('farmsking.in/brand_logo.png') ||
    logoUri.includes('farmsking.in/brand_logo.jpeg') ||
    imageError;

  // When dark mode, emblem mode, or bundled HD is requested, prefer the 100% transparent bundled master asset
  const shouldUseBundled = useFastBundledOnly || isDarkMode || isEmblemMode || useHdQuality || isInvalidRemoteLogo;

  const finalSource = !shouldUseBundled && !isInvalidRemoteLogo
    ? { uri: logoUri }
    : resolveAsset(bundledAsset);

  // Compute responsive dimensions:
  // - Emblem / Round / Favicon: Strictly 1:1 square / circle
  // - Wide Brand Banner: Natural 3.0 ratio (1600:533)
  const finalHeight = height ?? size ?? 36;
  const defaultAspectRatio = isEmblemMode ? 1.0 : (aspectRatio ?? 3.0);
  const finalWidth = width ?? (typeof finalHeight === 'number' ? Math.round(finalHeight * defaultAspectRatio) : finalHeight);
  const finalBorderRadius = round
    ? (typeof finalHeight === 'number' ? finalHeight / 2 : 18)
    : isEmblemMode
    ? (typeof finalHeight === 'number' ? Math.round(finalHeight * 0.22) : 8)
    : 0;

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
            transform: 'translateZ(0)',
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
