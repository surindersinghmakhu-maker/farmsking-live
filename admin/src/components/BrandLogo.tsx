import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { resolveMediaUrl } from '@/src/api/client';

const LOGO_ICON_FAST = require('@/assets/images/farmsking_logo_icon.png');
const LOGO_STANDARD = require('@/assets/images/farmsking_logo.png');
const LOGO_HD = require('@/assets/images/farmsking_logo_hd.png');
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
  resizeMode = 'contain',
}: BrandLogoProps) {
  const { data: settings } = useAppSettings();

  const [imageError, setImageError] = useState(false);

  // Highest priority: The official Brand Logo saved in Settings
  const rawLogo = settings?.logoUrl || '/brand_logo.png';
  const logoUri = resolveMediaUrl(rawLogo);

  useEffect(() => {
    setImageError(false);
  }, [logoUri]);

  // Optimal bundled fallback asset
  const bundledAsset = useHdQuality
    ? LOGO_HD
    : (size && size <= 58)
    ? LOGO_ICON_FAST
    : LOGO_STANDARD;

  // Guard against known broken legacy URLs or invalid schemes
  const isInvalidRemoteLogo = !logoUri || logoUri.includes('farmsking.in/assets/logo.png') || imageError;

  // Always use the official Brand Logo saved in settings; gracefully fall back to local emblem
  const finalSource = (!isInvalidRemoteLogo && !useFastBundledOnly)
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
