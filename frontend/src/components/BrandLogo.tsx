import React, { useEffect, useState } from 'react';
import { Image, ImageStyle, StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { resolveMediaUrl } from '@/src/api/client';
import { useAuth } from '@/src/store/auth-context';

const LOGO_ICON_FAST = require('@/assets/images/farmsking_logo_icon.png');
const LOGO_STANDARD = require('@/assets/images/farmsking_logo.png');
const LOGO_HD = require('@/assets/images/farmsking_logo_hd.png');

interface BrandLogoProps {
  size?: number;
  iconColor?: string;
  style?: StyleProp<ViewStyle | ImageStyle>;
  fallbackIconName?: keyof typeof Ionicons.glyphMap;
  useCrownFallback?: boolean;
  useHdQuality?: boolean;
  useFastBundledOnly?: boolean;
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
  size = 32,
  iconColor = '#facc15',
  style,
  useCrownFallback = false,
  useHdQuality = false,
  useFastBundledOnly = false,
}: BrandLogoProps) {
  const { data: settings } = useAppSettings();
  const { user } = useAuth();
  const [imageError, setImageError] = useState(false);

  const rawLogo = settings?.logoUrl;
  const logoUri = resolveMediaUrl(rawLogo);

  useEffect(() => {
    setImageError(false);
  }, [logoUri]);

  // Pick optimal normal quality bundled asset
  const bundledAsset = useHdQuality
    ? LOGO_HD
    : size <= 58
    ? LOGO_ICON_FAST
    : LOGO_STANDARD;

  // Prefer Database logoUrl when present; fall back to local official emblem
  const finalSource = (logoUri && !imageError)
    ? { uri: logoUri }
    : resolveAsset(bundledAsset);

  return (
    <Image
      source={finalSource}
      style={[{ width: size, height: size, borderRadius: size / 4 }, style as StyleProp<ImageStyle>]}
      resizeMode="contain"
      onError={() => {
        setImageError(true);
      }}
    />
  );
}


