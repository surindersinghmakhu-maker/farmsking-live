import React from 'react';
import { ActivityIndicator, FlatList, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useMarkAllNotificationsRead, useMarkNotificationRead, useMyNotifications } from '@/src/hooks/useNotifications';
import { AppNotification, NotificationType } from '@/src/types/api';

const theme = RoleThemes.FARMER;

const TYPE_ICON: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  SPRAY_REMINDER: 'water',
  PAYMENT_DUE: 'card',
  ADVISOR_MESSAGE: 'chatbubble-ellipses',
  CROP_PROBLEM_UPDATE: 'medkit',
  MARKET_RATE_ALERT: 'trending-up',
  SYSTEM: 'information-circle',
};

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading } = useMyNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const hasUnread = (notifications ?? []).some((n) => !n.isRead);

  const renderItem = ({ item }: { item: AppNotification }) => (
    <TouchableOpacity
      style={[styles.card, !item.isRead && styles.cardUnread]}
      activeOpacity={0.8}
      onPress={() => {
        if (!item.isRead) markRead.mutate(item.id);
      }}
    >
      <View style={[styles.iconBg, !item.isRead && { backgroundColor: theme.primary }]}>
        <Ionicons name={TYPE_ICON[item.type] ?? 'notifications'} size={17} color={!item.isRead ? '#ffffff' : theme.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          {!item.isRead ? <View style={styles.unreadDot} /> : null}
        </View>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {hasUnread ? (
          <TouchableOpacity onPress={() => markAllRead.mutate()}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 80 }} />
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications ?? []}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCenter}>
              <Ionicons name="notifications-off-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: Platform.OS === 'web' ? 18 : 50,
    paddingBottom: SPACING.md,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  markAllText: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary },
  list: { padding: SPACING.lg, gap: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'sm'),
  },
  cardUnread: { borderColor: theme.primary, borderWidth: 1.5 },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  title: { flex: 1, fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: theme.primary },
  body: { fontSize: 12.5, fontFamily: FONT.medium, color: '#475569', marginTop: 3, lineHeight: 18 },
  time: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 5 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 8 },
  emptyText: { fontSize: 13.5, fontFamily: FONT.medium, color: '#94a3b8' },
});
