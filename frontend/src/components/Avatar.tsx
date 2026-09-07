import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVATAR_PRESET_URLS } from '../constants/avatarPresets';
import { RoleThemes } from '../../constants/Colors';
import { resolveMediaUrl } from '../api/client';

interface AvatarProps {
  uri?: string | null;
  size?: number;
  /** Defaults to auto-detecting: badge shows for FarmsKing preset avatars, not for a user's own uploaded photo. */
  showBadge?: boolean;
}

const FALLBACK_URI = AVATAR_PRESET_URLS[0];

/** Profile photo with a small FarmsKing logo badge — shown on preset avatars only, never on a real uploaded photo. */
export function Avatar({ uri, size = 52, showBadge }: AvatarProps) {
  const resolvedUri = resolveMediaUrl(uri) || FALLBACK_URI;
  const isPreset = showBadge ?? AVATAR_PRESET_URLS.includes(resolvedUri);
  const badgeSize = Math.max(14, Math.round(size * 0.32));

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          source={{ uri: resolvedUri }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </View>
      {isPreset ? (
        <View
          style={[
            styles.badge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
              right: -badgeSize * 0.12,
              bottom: -badgeSize * 0.12,
            },
          ]}
        >
          <Ionicons name="leaf" size={badgeSize * 0.6} color={RoleThemes.FARMER.primary} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#e2e8f0' },
  badge: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#f0fdf4',
  },
});
