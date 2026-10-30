import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';
import { useMyAdvisor } from '../hooks/useAdvisorAssignments';
import { useChatUnreadCount } from '../hooks/useChat';

const theme = RoleThemes.FARMER;

/** Quick entry point into the chat thread with the farmer's currently assigned advisor. */
export function ChatWithAdvisorCard() {
  const router = useRouter();
  const { data: assignment } = useMyAdvisor();
  const { data: unread } = useChatUnreadCount();

  if (!assignment || assignment.status !== 'ACTIVE' || !assignment.advisor) return null;

  return (
    <TouchableOpacity
      style={[styles.card, premiumShadow('#0f172a', 'sm')]}
      activeOpacity={0.85}
      onPress={() =>
        router.push({
          pathname: '/chat-thread/[userId]',
          params: { userId: assignment.advisor!.id, name: assignment.advisor!.name },
        } as never)
      }
    >
      <View style={styles.iconBg}>
        <Ionicons name="chatbubble-ellipses" size={20} color={theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>Chat with {assignment.advisor.name}</Text>
        <Text style={styles.subtitle}>Your assigned advisor</Text>
      </View>
      {unread && unread.count > 0 ? (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{unread.count}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  iconBg: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  subtitle: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  unreadBadge: { backgroundColor: '#dc2626', minWidth: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadBadgeText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.bold },
});
