import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useConversations, useConversationsPresenceSync } from '@/src/hooks/useChat';
import { Avatar } from '@/src/components/Avatar';
import { useExecutiveTheme } from '@/src/store/theme-context';

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { colors, isLight, isDarkTheme, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  
  const { data: conversations, isLoading, refetch, isFetching } = useConversations();
  useConversationsPresenceSync(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD' | 'ONLINE'>('ALL');

  const unreadTotal = (conversations ?? []).reduce((sum, c) => sum + (c.unreadCount || 0), 0);
  const onlineTotal = (conversations ?? []).filter((c) => !!c.isOnline).length;

  const filteredConversations = useMemo(() => {
    let list = conversations ?? [];
    if (filterMode === 'UNREAD') {
      list = list.filter((c) => (c.unreadCount || 0) > 0);
    } else if (filterMode === 'ONLINE') {
      list = list.filter((c) => !!c.isOnline);
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.trim().toLowerCase();
    return list.filter((c) => {
      const name = c.partner?.name?.toLowerCase() || '';
      const mobile = c.partner?.mobile?.toLowerCase() || '';
      const kingId = c.partner?.kingId?.toLowerCase() || '';
      const lastMsg = c.lastMessage?.content?.toLowerCase() || '';
      return name.includes(q) || mobile.includes(q) || kingId.includes(q) || lastMsg.includes(q);
    });
  }, [conversations, filterMode, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Executive Cockpit Header ────────────────────────────────────────── */}
      <LinearGradient
        colors={
          isLight
            ? ['#0f172a', '#1e293b']
            : isDarkTheme
            ? ['#061330', '#020817']
            : ['#02130a', '#052e16']
        }
        style={[styles.hero, { paddingHorizontal: isDesktop ? 24 : 14 }]}
      >
        <View style={styles.heroTopRow}>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <View style={[styles.statusBadge, { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: 'rgba(34, 197, 94, 0.4)' }]}>
                <View style={styles.pulseDot} />
                <Text style={styles.statusBadgeText}>SUPPORT CONCIERGE</Text>
              </View>
              {unreadTotal > 0 && (
                <View style={[styles.statusBadge, { backgroundColor: '#ef4444', borderColor: '#f87171' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#ffffff' }]}>{unreadTotal} UNREAD</Text>
                </View>
              )}
            </View>
            <Text style={styles.heroTitle}>Support & Advisory Chat</Text>
            <Text style={styles.heroSubtitle}>
              Real-time consultations between farmers, gardeners, advisors and platform staff
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.refreshBtn, isLight && { backgroundColor: 'rgba(255,255,255,0.12)' }]}
            onPress={() => refetch()}
            activeOpacity={0.8}
          >
            <Ionicons name="refresh" size={16} color={isFetching ? '#22c55e' : '#ffffff'} />
            {isDesktop && <Text style={styles.refreshBtnText}>{isFetching ? 'Syncing...' : 'Refresh'}</Text>}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by client name, mobile number, or King ID..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <View style={styles.filterChipsRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterMode === 'ALL' && styles.filterChipActive]}
            onPress={() => setFilterMode('ALL')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filterMode === 'ALL' && styles.filterChipTextActive]}>
              All ({conversations?.length || 0})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterMode === 'UNREAD' && styles.filterChipActive]}
            onPress={() => setFilterMode('UNREAD')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filterMode === 'UNREAD' && styles.filterChipTextActive]}>
              Unread ({unreadTotal})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterChip, filterMode === 'ONLINE' && styles.filterChipActive]}
            onPress={() => setFilterMode('ONLINE')}
            activeOpacity={0.8}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e', marginRight: 4 }} />
            <Text style={[styles.filterChipText, filterMode === 'ONLINE' && styles.filterChipTextActive]}>
              Active Online ({onlineTotal})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* ── Conversations List ────────────────────────────────────────────── */}
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={isLight ? '#16a34a' : '#00ff87'} size="large" />
          <Text style={[styles.loadingText, { color: subTextColor }]}>Loading client conversations...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingHorizontal: isDesktop ? 20 : 12 }]}
          showsVerticalScrollIndicator={false}
        >
          {filteredConversations.length === 0 ? (
            <View style={styles.emptyCenter}>
              <View style={[styles.emptyIconCircle, { backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.05)' }]}>
                <Ionicons name="chatbubbles-outline" size={38} color="#94a3b8" />
              </View>
              <Text style={[styles.emptyTitle, { color: textColor }]}>
                {searchQuery.trim() ? 'No Matching Conversations' : 'No Conversations Yet'}
              </Text>
              <Text style={[styles.emptyText, { color: subTextColor }]}>
                {searchQuery.trim()
                  ? 'No clients or messages found matching your search query.'
                  : 'Active conversations with farmers and gardeners will appear here automatically.'}
              </Text>
            </View>
          ) : (
            filteredConversations.map((c) => {
              const hasUnread = (c.unreadCount || 0) > 0;
              return (
                <TouchableOpacity
                  key={c.partner.id}
                  style={[
                    styles.chatCard,
                    {
                      backgroundColor: cardBg,
                      borderColor: hasUnread ? (isLight ? '#16a34a' : '#00ff87') : cardBorder,
                      borderWidth: hasUnread ? 1.5 : 1,
                    },
                    hasUnread && (isLight ? { backgroundColor: '#f0fdf4' } : { backgroundColor: 'rgba(0, 255, 135, 0.05)' }),
                    premiumShadow('#0f172a', 'xs'),
                  ]}
                  activeOpacity={0.75}
                  onPress={() =>
                    router.push({
                      pathname: '/chat-thread/[userId]',
                      params: { userId: c.partner.id, name: c.partner.name },
                    } as never)
                  }
                >
                  <View style={styles.avatarWrap}>
                    <Avatar uri={c.partner.photoUrl} size={46} />
                    <View
                      style={[
                        styles.presenceDot,
                        {
                          backgroundColor: c.isOnline ? '#22c55e' : '#cbd5e1',
                          borderColor: cardBg,
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.infoCol}>
                    <View style={styles.nameRow}>
                      <Text style={[styles.nameText, { color: textColor }]} numberOfLines={1}>
                        {c.partner.name || 'User'}
                      </Text>
                      {c.partner.kingId ? (
                        <View style={[styles.kingIdBadge, isLight && { backgroundColor: '#f1f5f9' }]}>
                          <Text style={styles.kingIdText}>#{c.partner.kingId}</Text>
                        </View>
                      ) : null}
                    </View>

                    <Text style={[styles.metaPhone, { color: subTextColor }]} numberOfLines={1}>
                      📱 {c.partner.mobile || 'No Mobile'}
                    </Text>

                    <Text
                      style={[
                        styles.messageSnippet,
                        { color: subTextColor },
                        hasUnread && { color: isLight ? '#0f172a' : '#ffffff', fontFamily: FONT.bold },
                      ]}
                      numberOfLines={1}
                    >
                      {c.lastMessage?.content ?? 'Start consultation 👋'}
                    </Text>
                  </View>

                  <View style={styles.trailingCol}>
                    {c.lastMessage?.createdAt ? (
                      <Text style={[styles.timeText, { color: subTextColor }]}>
                        {timeAgo(c.lastMessage.createdAt)}
                      </Text>
                    ) : null}

                    {hasUnread ? (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {(c.unreadCount || 0) > 9 ? '9+' : c.unreadCount}
                        </Text>
                      </View>
                    ) : (
                      <Ionicons name="chevron-forward" size={16} color={subTextColor} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hero: {
    paddingTop: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#22c55e',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  heroSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
    lineHeight: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  refreshBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#ffffff',
    paddingVertical: 2,
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#22c55e',
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  list: {
    paddingVertical: 12,
    gap: 8,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  emptyCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  emptyText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 18,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  presenceDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    maxWidth: '75%',
  },
  kingIdBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
  },
  kingIdText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  metaPhone: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  messageSnippet: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  trailingCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 6,
    minWidth: 44,
  },
  timeText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
});
