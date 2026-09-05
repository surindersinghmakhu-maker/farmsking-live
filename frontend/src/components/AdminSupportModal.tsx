import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  useAdminConversations,
  useAdminFarmerThread,
  useSendAdminChatMessage,
  useResolveAdminFarmerThread,
} from '../hooks/useAdminChat';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface AdminSupportModalProps {
  visible: boolean;
  onClose: () => void;
  initialFarmerId?: string;
  initialFarmerName?: string;
}

export function AdminSupportModal({
  visible,
  onClose,
  initialFarmerId,
  initialFarmerName,
}: AdminSupportModalProps) {
  const [selectedFarmer, setSelectedFarmer] = useState<{ farmerId: string; farmerName: string } | null>(
    initialFarmerId ? { farmerId: initialFarmerId, farmerName: initialFarmerName || 'Farmer' } : null
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');

  // Live queries
  const { data: conversations = [], isLoading: isLoadingConversations } = useAdminConversations();
  const threadQuery = useAdminFarmerThread(selectedFarmer?.farmerId);
  const sendMessage = useSendAdminChatMessage();
  const resolveThread = useResolveAdminFarmerThread();

  const scrollViewRef = useRef<ScrollView>(null);

  // Sync initial farmer prop
  useEffect(() => {
    if (initialFarmerId) {
      setSelectedFarmer({ farmerId: initialFarmerId, farmerName: initialFarmerName || 'Farmer' });
    }
  }, [initialFarmerId, initialFarmerName]);

  // Auto scroll to end on new message in thread view
  const messages = threadQuery.data?.messages || [];
  useEffect(() => {
    if (selectedFarmer && visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [selectedFarmer, visible, messages.length]);

  const handleSendReply = async () => {
    if (!selectedFarmer?.farmerId || !inputText.trim()) return;
    const text = inputText.trim();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setInputText('');

    try {
      await sendMessage.mutateAsync({
        farmerId: selectedFarmer.farmerId,
        message: text,
      });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      // Error handled by query
    }
  };

  const handleResolveThread = async () => {
    if (!selectedFarmer?.farmerId) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    try {
      await resolveThread.mutateAsync({
        farmerId: selectedFarmer.farmerId,
        notes: 'Admin marked this support request as solved.',
      });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 150);
    } catch (err) {
      Alert.alert('Error', 'Could not resolve request. Please try again.');
    }
  };

  // Filter conversations by search term
  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const name = conv.farmer?.name?.toLowerCase() || '';
    const mobile = conv.farmer?.mobile || '';
    const msg = conv.lastMessage?.toLowerCase() || '';
    return name.includes(q) || mobile.includes(q) || msg.includes(q);
  });

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <LinearGradient colors={['#15803d', '#166534']} style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              {selectedFarmer ? (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setSelectedFarmer(null)}
                >
                  <Ionicons name="arrow-back" size={20} color="#ffffff" />
                </TouchableOpacity>
              ) : (
                <View style={styles.avatarWrap}>
                  <Ionicons name="chatbubbles" size={20} color="#15803d" />
                  <View style={styles.onlineDot} />
                </View>
              )}

              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle} numberOfLines={1}>
                  {selectedFarmer
                    ? selectedFarmer.farmerName || threadQuery.data?.farmer?.name || 'Farmer Chat'
                    : 'Farmer Support Chat'}
                </Text>
                <Text style={styles.headerSub}>
                  {selectedFarmer
                    ? '🛡️ Admin Live Reply Mode'
                    : `🟢 Live Socket · ${conversations.length} Active Conversations${
                        totalUnread > 0 ? ` (${totalUnread} New)` : ''
                      }`}
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {selectedFarmer ? (
                <TouchableOpacity
                  style={styles.resolveBtnHeader}
                  disabled={resolveThread.isPending}
                  onPress={handleResolveThread}
                >
                  {resolveThread.isPending ? (
                    <ActivityIndicator size="small" color="#15803d" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#15803d" />
                      <Text style={styles.resolveBtnHeaderText}>Mark Solved</Text>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Body View 1: Conversations List */}
          {!selectedFarmer ? (
            <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
              {/* Search Bar */}
              <View style={styles.searchBarWrap}>
                <Ionicons name="search-outline" size={18} color="#64748b" style={{ marginLeft: 10 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search farmer by name or mobile..."
                  placeholderTextColor="#94a3b8"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')} style={{ paddingHorizontal: 8 }}>
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>

              {isLoadingConversations ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text style={{ marginTop: 10, fontSize: 12, color: '#64748b', fontFamily: FONT.medium }}>
                    Connecting to Live Socket...
                  </Text>
                </View>
              ) : filteredConversations.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="chatbox-ellipses-outline" size={40} color="#16a34a" />
                  </View>
                  <Text style={styles.emptyTitle}>No Farmer Chats Found</Text>
                  <Text style={styles.emptySub}>
                    {searchQuery
                      ? 'No farmer matching your search query.'
                      : 'Farmers who send support queries will appear here in real time.'}
                  </Text>
                </View>
              ) : (
                <ScrollView contentContainerStyle={{ padding: 12, gap: 8 }}>
                  {filteredConversations.map((conv) => {
                    const farmer = conv.farmer || {};
                    const isUnread = (conv.unreadCount || 0) > 0;
                    const dateStr = conv.lastMessageDate
                      ? new Date(conv.lastMessageDate).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '';

                    return (
                      <TouchableOpacity
                        key={farmer.id || Math.random().toString()}
                        style={[
                          styles.convCard,
                          isUnread && { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
                        ]}
                        activeOpacity={0.8}
                        onPress={() =>
                          setSelectedFarmer({
                            farmerId: farmer.id,
                            farmerName: farmer.name || 'Farmer',
                          })
                        }
                      >
                        <View style={styles.farmerAvatar}>
                          <Ionicons name="person" size={20} color="#15803d" />
                          {isUnread && <View style={styles.unreadBadgeDot} />}
                        </View>

                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.farmerName}>{farmer.name || 'Farmer'}</Text>
                            {dateStr ? <Text style={styles.timeText}>{dateStr}</Text> : null}
                          </View>

                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                            <Text style={styles.lastMsgText} numberOfLines={1}>
                              {conv.lastMessage || 'No messages'}
                            </Text>
                            {conv.unreadCount > 0 ? (
                              <View style={styles.unreadPill}>
                                <Text style={styles.unreadPillText}>{conv.unreadCount} New</Text>
                              </View>
                            ) : null}
                          </View>

                          {farmer.mobile ? (
                            <Text style={styles.mobileText}>📱 {farmer.mobile}</Text>
                          ) : null}
                        </View>

                        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}
            </View>
          ) : (
            /* Body View 2: Single Farmer Thread Chat */
            <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
              {threadQuery.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="large" color="#16a34a" />
                </View>
              ) : messages.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconWrap}>
                    <Ionicons name="chatbubbles-outline" size={40} color="#16a34a" />
                  </View>
                  <Text style={styles.emptyTitle}>No Messages Yet</Text>
                  <Text style={styles.emptySub}>
                    Send a message below to start chatting with {selectedFarmer.farmerName}.
                  </Text>
                </View>
              ) : (
                <ScrollView
                  ref={scrollViewRef}
                  contentContainerStyle={{ padding: 12, gap: 10 }}
                  onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
                >
                  {messages.map((msg) => {
                    const isFarmerMsg = msg.senderRole === 'FARMER';
                    const dt = new Date(msg.createdAt).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                    const isResolutionMsg = msg.message.includes('✓') || msg.message.toLowerCase().includes('solved') || msg.message.toLowerCase().includes('resolved');

                    // Right side = Admin response, Left side = Farmer request
                    const isRight = !isFarmerMsg;

                    if (isResolutionMsg) {
                      return (
                        <View key={msg.id} style={styles.resolutionCard}>
                          <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.resolutionTitle}>✅ Request / Problem Solved</Text>
                            <Text style={styles.resolutionBody}>{msg.message}</Text>
                            <Text style={styles.resolutionTime}>{dt}</Text>
                          </View>
                        </View>
                      );
                    }

                    return (
                      <View
                        key={msg.id}
                        style={[styles.msgRow, isRight ? styles.msgRowAdmin : styles.msgRowFarmer]}
                      >
                        <View style={[styles.bubble, isRight ? styles.bubbleAdmin : styles.bubbleFarmer]}>
                          {isFarmerMsg ? (
                            <Text style={styles.senderTagFarmer}>🌾 {selectedFarmer.farmerName}</Text>
                          ) : (
                            <Text style={styles.senderTagAdmin}>🛡️ Admin Support</Text>
                          )}
                          <Text style={[styles.msgText, isRight ? styles.msgTextAdmin : styles.msgTextFarmer]}>
                            {msg.message}
                          </Text>
                          <Text style={[styles.msgTime, isRight ? styles.msgTimeAdmin : styles.msgTimeFarmer]}>
                            {dt}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}


              {/* Reply Footer Input */}
              <View style={styles.inputFooter}>
                <TextInput
                  style={styles.textInput}
                  placeholder={`Reply to ${selectedFarmer.farmerName}...`}
                  placeholderTextColor="#94a3b8"
                  value={inputText}
                  onChangeText={setInputText}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
                  disabled={!inputText.trim() || sendMessage.isPending}
                  onPress={handleSendReply}
                >
                  {sendMessage.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Ionicons name="send" size={18} color="#ffffff" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalCard: { height: '90%', backgroundColor: '#ffffff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', position: 'absolute', bottom: 0, right: 0, borderWidth: 1.5, borderColor: '#ffffff' },
  headerTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#ffffff' },
  headerSub: { fontSize: 11, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  resolveBtnHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
  resolveBtnHeaderText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#15803d' },
  closeBtn: { padding: 4 },
  searchBarWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', margin: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1' },
  searchInput: { flex: 1, paddingVertical: 9, paddingHorizontal: 10, fontSize: 13, fontFamily: FONT.medium, color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a' },
  emptySub: { fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  convCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 12, ...premiumShadow('#000', 'sm') },
  farmerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  unreadBadgeDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', position: 'absolute', top: 0, right: 0, borderWidth: 1.5, borderColor: '#ffffff' },
  farmerName: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  timeText: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8' },
  lastMsgText: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, flex: 1 },
  mobileText: { fontSize: 11, color: '#ea580c', fontFamily: FONT.medium, marginTop: 2 },
  unreadPill: { backgroundColor: '#ef4444', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, marginLeft: 6 },
  unreadPillText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#ffffff' },
  msgRow: { flexDirection: 'row', width: '100%' },
  msgRowFarmer: { justifyContent: 'flex-start' },
  msgRowAdmin: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '82%', borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleFarmer: { backgroundColor: '#ffffff', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#e2e8f0', ...premiumShadow('#000', 'sm') },
  bubbleAdmin: { backgroundColor: '#16a34a', borderBottomRightRadius: 2 },
  senderTagFarmer: { fontSize: 10, fontFamily: FONT.extraBold, color: '#16a34a', marginBottom: 2 },
  senderTagAdmin: { fontSize: 10, fontFamily: FONT.extraBold, color: '#ffffff', marginBottom: 2 },
  msgText: { fontSize: 13, lineHeight: 18 },
  msgTextFarmer: { color: '#0f172a', fontFamily: FONT.medium },
  msgTextAdmin: { color: '#ffffff', fontFamily: FONT.medium },
  msgTime: { fontSize: 9.5, marginTop: 4, textAlign: 'right' },
  msgTimeFarmer: { color: '#94a3b8' },
  msgTimeAdmin: { color: 'rgba(255,255,255,0.85)' },
  resolutionCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#16a34a', borderRadius: RADIUS.lg, padding: 12, gap: 10, marginVertical: 4 },
  resolutionTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#15803d' },
  resolutionBody: { fontSize: 12.5, fontFamily: FONT.medium, color: '#166534', marginTop: 2 },
  resolutionTime: { fontSize: 9.5, color: '#15803d', fontFamily: FONT.medium, marginTop: 4 },
  inputFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  textInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, maxHeight: 80, color: '#0f172a' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
});

