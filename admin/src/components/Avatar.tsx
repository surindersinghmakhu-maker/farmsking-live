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

export function Avatar({ uri, size = 52 }: AvatarProps) {
  const resolvedUri = uri ? resolveMediaUrl(uri) : undefined;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
        {resolvedUri ? (
          <Image
            source={{ uri: resolvedUri }}
            style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ width: '100%', height: '100%', backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="person" size={Math.round(size * 0.52)} color="#94a3b8" />
          </View>
        )}
      </View>
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
