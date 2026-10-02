import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, SPACING } from '@/constants/theme';
import { useConversations, useConversationsPresenceSync } from '@/src/hooks/useChat';
import { Avatar } from '@/src/components/Avatar';

const theme = RoleThemes.FARM_ADVISOR;

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export default function ChatScreen() {
  const router = useRouter();
  const { data: conversations, isLoading } = useConversations();
  useConversationsPresenceSync(true);
  const unreadTotal = (conversations ?? []).reduce((sum, c) => sum + c.unreadCount, 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Chat</Text>
        <Text style={styles.heroSubtitle}>
          {isLoading
            ? 'Loading conversations…'
            : `${(conversations ?? []).length} conversation${(conversations ?? []).length === 1 ? '' : 's'}${unreadTotal > 0 ? ` · ${unreadTotal} unread` : ''}`}
        </Text>
      </LinearGradient>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {!conversations || conversations.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="chatbubble-ellipses-outline" size={36} color="#cbd5e1" />
              <Text style={styles.emptyText}>No conversations yet — they'll appear once you have farmers assigned.</Text>
            </View>
          ) : (
            conversations.map((c) => (
              <TouchableOpacity
                key={c.partner.id}
                style={[styles.row, c.unreadCount > 0 && styles.rowUnread]}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({ pathname: '/chat-thread/[userId]', params: { userId: c.partner.id, name: c.partner.name } } as never)
                }
              >
                <View>
                  <Avatar uri={c.partner.photoUrl} size={46} />
                  <View style={[styles.presenceDot, { backgroundColor: c.isOnline ? '#22c55e' : '#cbd5e1' }]} />
                </View>
                <View style={styles.info}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <Text style={styles.name} numberOfLines={1}>{c.partner.name}</Text>
                    {c.partner.kingId ? <Text style={styles.subMeta} numberOfLines={1}>#{c.partner.kingId}</Text> : null}
                  </View>
                  <Text style={styles.subMeta} numberOfLines={1}>{c.partner.mobile}</Text>
                  <Text style={[styles.message, c.unreadCount > 0 && styles.messageUnread]} numberOfLines={1}>
                    {c.lastMessage?.content ?? 'Say hello 👋'}
                  </Text>
                </View>
                <View style={styles.right}>
                  {c.lastMessage ? <Text style={styles.time}>{timeAgo(c.lastMessage.createdAt)}</Text> : null}
                  {c.unreadCount > 0 ? (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{c.unreadCount > 9 ? '9+' : c.unreadCount}</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={15} color="#e2e8f0" />
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#ffffff' },
  heroSubtitle: { fontSize: 12, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  list: { paddingHorizontal: SPACING.lg, paddingTop: 4 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 10, borderRadius: 14, marginTop: 6, gap: 12 },
  presenceDot: { position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: '#ffffff' },
  rowUnread: { backgroundColor: '#f0fdf4' },
  info: { flex: 1 },
  name: { fontSize: 14.5, fontFamily: FONT.bold, color: '#0f172a' },
  subMeta: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8' },
  message: { fontSize: 12.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  messageUnread: { color: '#0f172a', fontFamily: FONT.semiBold },
  right: { alignItems: 'flex-end', gap: 7, minWidth: 30 },
  time: { fontSize: 10.5, color: '#94a3b8', fontFamily: FONT.medium },
  unreadBadge: { minWidth: 19, height: 19, borderRadius: 9.5, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadBadgeText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#ffffff' },
});
