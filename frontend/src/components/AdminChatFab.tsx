import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useMyAdminChatMessages } from '../hooks/useAdminChat';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface AdminChatFabProps {
  onPress: () => void;
}

export function AdminChatFab({ onPress }: AdminChatFabProps) {
  const { data } = useMyAdminChatMessages();
  const unreadCount = data?.unreadCount || 0;

  return (
    <TouchableOpacity
      style={[styles.fab, premiumShadow('#16a34a', 'lg')]}
      activeOpacity={0.85}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
    >
      <View style={styles.iconWrap}>
        <Ionicons name="chatbubble-ellipses" size={20} color="#ffffff" />
        <View style={styles.onlineDot} />
      </View>
      <Text style={styles.fabText}>Chat with Admin</Text>

      {unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    elevation: 6,
    zIndex: 9999,
  },
  iconWrap: { position: 'relative' },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
    position: 'absolute',
    top: -2,
    right: -2,
    borderWidth: 1,
    borderColor: '#15803d',
  },
  fabText: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  badge: {
    backgroundColor: '#ef4444',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#ffffff' },
});
