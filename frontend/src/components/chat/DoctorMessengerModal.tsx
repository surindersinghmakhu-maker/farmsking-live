import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useConversations, useConversationsPresenceSync } from '@/src/hooks/useChat';
import { Avatar } from '@/src/components/Avatar';
import { useExecutiveTheme } from '@/src/store/theme-context';

interface DoctorMessengerModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenGroupCall?: () => void;
}

function timeAgo(iso?: string): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export const DoctorMessengerModal: React.FC<DoctorMessengerModalProps> = ({
  visible,
  onClose,
  onOpenGroupCall,
}) => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  const { data: conversations, isLoading } = useConversations();
  useConversationsPresenceSync(visible);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'UNREAD' | 'ONLINE'>('ALL');

  const unreadTotal = useMemo(
    () => (conversations ?? []).reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations],
  );

  const filteredConversations = useMemo(() => {
    let list = conversations ?? [];
    if (filter === 'UNREAD') {
      list = list.filter((c) => c.unreadCount > 0);
    } else if (filter === 'ONLINE') {
      list = list.filter((c) => c.isOnline);
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.partner.name.toLowerCase().includes(q) ||
          (c.partner.mobile && c.partner.mobile.toLowerCase().includes(q)) ||
          (c.partner.kingId && c.partner.kingId.toLowerCase().includes(q)) ||
          (c.lastMessage?.content && c.lastMessage.content.toLowerCase().includes(q)),
      );
    }
    return list;
  }, [conversations, filter, search]);

  const handleOpenThread = (userId: string, name: string) => {
    onClose();
    router.push({
      pathname: '/chat-thread/[userId]',
      params: { userId, name },
    } as never);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogContainer,
            isDesktop && styles.dialogContainerDesktop,
            {
              backgroundColor: isLight ? '#ffffff' : '#0b1320',
              borderColor: isLight ? '#cbd5e1' : '#1e293b',
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              { borderBottomColor: isLight ? '#f1f5f9' : '#1e293b' },
            ]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.headerIconBox}>
                <Ionicons name="chatbubbles" size={20} color="#10b981" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.title, { color: textColor }]}>
                    Doctor Agronomy Messenger
                  </Text>
                  {unreadTotal > 0 && (
                    <View style={styles.unreadCountPill}>
                      <Text style={styles.unreadCountPillText}>{unreadTotal} New</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.subtitle, { color: subTextColor }]}>
                  Instant 1-on-1 consultations & advisory chat with farmers
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.closeBtn,
                { backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)' },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={textColor} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchWrapper}>
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isLight ? '#f8fafc' : '#070f1a',
                  borderColor: isLight ? '#e2e8f0' : '#1e293b',
                },
              ]}
            >
              <Ionicons name="search" size={17} color={subTextColor} />
              <TextInput
                style={[styles.searchInput, { color: textColor }]}
                placeholder="Search farmers by name, King ID, mobile..."
                placeholderTextColor={subTextColor}
                value={search}
                onChangeText={setSearch}
              />
              {search.trim().length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Ionicons name="close-circle" size={16} color={subTextColor} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Filter Chips */}
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.chip,
                filter === 'ALL' && styles.chipActive,
                {
                  backgroundColor:
                    filter === 'ALL'
                      ? '#10b981'
                      : isLight
                        ? '#f1f5f9'
                        : 'rgba(255,255,255,0.05)',
                },
              ]}
              onPress={() => setFilter('ALL')}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: filter === 'ALL' ? '#ffffff' : subTextColor },
                ]}
              >
                All Chats ({conversations?.length ?? 0})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                filter === 'UNREAD' && styles.chipActive,
                {
                  backgroundColor:
                    filter === 'UNREAD'
                      ? '#10b981'
                      : isLight
                        ? '#f1f5f9'
                        : 'rgba(255,255,255,0.05)',
                },
              ]}
              onPress={() => setFilter('UNREAD')}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: filter === 'UNREAD' ? '#ffffff' : subTextColor },
                ]}
              >
                Unread ({unreadTotal})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                filter === 'ONLINE' && styles.chipActive,
                {
                  backgroundColor:
                    filter === 'ONLINE'
                      ? '#10b981'
                      : isLight
                        ? '#f1f5f9'
                        : 'rgba(255,255,255,0.05)',
                },
              ]}
              onPress={() => setFilter('ONLINE')}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: filter === 'ONLINE' ? '#ffffff' : subTextColor },
                ]}
              >
                🟢 Online (
                {(conversations ?? []).filter((c) => c.isOnline).length}
                )
              </Text>
            </TouchableOpacity>
          </View>

          {/* Conversation List */}
          {isLoading ? (
            <View style={styles.loaderCenter}>
              <ActivityIndicator color="#10b981" size="large" />
              <Text style={[styles.loadingText, { color: subTextColor }]}>
                Connecting to live agronomy chat server...
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.chatList}
              contentContainerStyle={styles.chatListContent}
              showsVerticalScrollIndicator={false}
            >
              {filteredConversations.length === 0 ? (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconBox}>
                    <Ionicons name="chatbubble-ellipses-outline" size={32} color="#10b981" />
                  </View>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>
                    No Conversations Found
                  </Text>
                  <Text style={[styles.emptyDesc, { color: subTextColor }]}>
                    {search.trim()
                      ? 'No farmers matching your search.'
                      : 'Farmer messages and consultation requests will appear here in real time.'}
                  </Text>
                </View>
              ) : (
                filteredConversations.map((c) => {
                  const hasUnread = (c.unreadCount || 0) > 0;
                  return (
                    <TouchableOpacity
                      key={c.partner.id}
                      style={[
                        styles.convoRow,
                        {
                          backgroundColor: hasUnread
                            ? isLight
                              ? '#f0fdf4'
                              : 'rgba(16, 185, 129, 0.12)'
                            : isLight
                              ? '#ffffff'
                              : 'rgba(255, 255, 255, 0.02)',
                          borderColor: hasUnread
                            ? '#10b981'
                            : isLight
                              ? '#f1f5f9'
                              : '#1e293b',
                        },
                      ]}
                      activeOpacity={0.75}
                      onPress={() => handleOpenThread(c.partner.id, c.partner.name)}
                    >
                      <View style={styles.avatarWrap}>
                        <Avatar uri={c.partner.photoUrl} size={46} />
                        <View
                          style={[
                            styles.onlineDot,
                            { backgroundColor: c.isOnline ? '#22c55e' : '#94a3b8' },
                          ]}
                        />
                      </View>

                      <View style={styles.convoInfo}>
                        <View style={styles.convoTopRow}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text
                              style={[
                                styles.farmerName,
                                {
                                  color: textColor,
                                  fontFamily: hasUnread ? FONT.extraBold : FONT.bold,
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {c.partner.name}
                            </Text>
                            {c.partner.kingId ? (
                              <View style={styles.kingIdBadge}>
                                <Text style={styles.kingIdText}>#{c.partner.kingId}</Text>
                              </View>
                            ) : null}
                          </View>
                          {c.lastMessage && (
                            <Text style={[styles.timestamp, { color: subTextColor }]}>
                              {timeAgo(c.lastMessage.createdAt)}
                            </Text>
                          )}
                        </View>

                        <Text style={[styles.mobileText, { color: subTextColor }]}>
                          📞 {c.partner.mobile}
                        </Text>

                        <Text
                          style={[
                            styles.messagePreview,
                            {
                              color: hasUnread ? textColor : subTextColor,
                              fontFamily: hasUnread ? FONT.semiBold : FONT.regular,
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {c.lastMessage?.content || 'Tap to send consultation advice 👋'}
                        </Text>
                      </View>

                      {hasUnread && (
                        <View style={styles.unreadBadge}>
                          <Text style={styles.unreadBadgeText}>
                            {c.unreadCount > 9 ? '9+' : c.unreadCount}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* Footer Action Bar */}
          <View
            style={[
              styles.footerBar,
              {
                borderTopColor: isLight ? '#f1f5f9' : '#1e293b',
                backgroundColor: isLight ? '#f8fafc' : '#070f1a',
              },
            ]}
          >
            {onOpenGroupCall && (
              <TouchableOpacity
                style={styles.broadcastBtn}
                onPress={() => {
                  onClose();
                  onOpenGroupCall();
                }}
              >
                <Ionicons name="mic" size={16} color="#ffffff" />
                <Text style={styles.broadcastBtnText}>Start Live Voice Broadcast</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.fullChatBtn}
              onPress={() => {
                onClose();
                router.push('/(partner)/(tabs)/chat' as never);
              }}
            >
              <Text style={styles.fullChatBtnText}>View Full Messenger</Text>
              <Ionicons name="arrow-forward" size={14} color="#10b981" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  dialogContainer: {
    width: '100%',
    maxWidth: 580,
    height: '84%',
    maxHeight: 680,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    ...premiumShadow('#000000', 'lg'),
  },
  dialogContainerDesktop: {
    maxWidth: 620,
    maxHeight: 720,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 15.5,
    fontFamily: FONT.extraBold,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  unreadCountPill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  unreadCountPillText: {
    color: '#ffffff',
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.pill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  chipActive: {
    ...premiumShadow('#10b981', 'sm'),
  },
  chipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  loaderCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  chatList: {
    flex: 1,
  },
  chatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  convoInfo: {
    flex: 1,
    gap: 2,
  },
  convoTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  farmerName: {
    fontSize: 13,
    maxWidth: 160,
  },
  kingIdBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  kingIdText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#3b82f6',
  },
  timestamp: {
    fontSize: 10,
    fontFamily: FONT.medium,
  },
  mobileText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
  messagePreview: {
    fontSize: 11.5,
    marginTop: 2,
  },
  unreadBadge: {
    backgroundColor: '#10b981',
    borderRadius: RADIUS.pill,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: FONT.extraBold,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyIconBox: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  emptyDesc: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 16,
  },
  footerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  broadcastBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  broadcastBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  fullChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  fullChatBtnText: {
    color: '#10b981',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
});
