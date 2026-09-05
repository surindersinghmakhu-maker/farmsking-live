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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useMyAdminChatMessages, useAdminFarmerThread, useSendAdminChatMessage } from '../hooks/useAdminChat';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

interface AdminChatModalProps {
  visible: boolean;
  onClose: () => void;
  farmerId?: string;
  farmerName?: string;
}

const QUICK_CHIPS = [
  '🌾 Crop Disease Advice',
  '🧪 Fertilizer & Spray Advice',
  '💰 Mandi Rate Info',
  '📱 App Usage Help',
];

export function AdminChatModal({ visible, onClose, farmerId, farmerName }: AdminChatModalProps) {
  const isAdminReplyMode = !!farmerId;

  const farmerChatQuery = useMyAdminChatMessages();
  const adminThreadQuery = useAdminFarmerThread(farmerId);

  const sendMessage = useSendAdminChatMessage();
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const isLoading = isAdminReplyMode ? adminThreadQuery.isLoading : farmerChatQuery.isLoading;
  const messages = isAdminReplyMode
    ? adminThreadQuery.data?.messages || []
    : farmerChatQuery.data?.messages || [];

  const displayName = isAdminReplyMode
    ? (farmerName || adminThreadQuery.data?.farmer?.name || 'Farmer')
    : 'FarmsKing Admin Support';

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [visible, messages.length]);

  const handleSend = async (customMsg?: string) => {
    const text = (customMsg || inputText).trim();
    if (!text) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (!customMsg) setInputText('');

    try {
      await sendMessage.mutateAsync(
        isAdminReplyMode ? { farmerId, message: text } : { message: text }
      );
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err) {
      // Fallback
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <LinearGradient colors={['#15803d', '#166534']} style={styles.header}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={styles.avatarWrap}>
                <Ionicons name={isAdminReplyMode ? 'person' : 'chatbubbles'} size={20} color="#15803d" />
                <View style={styles.onlineDot} />
              </View>
              <View>
                <Text style={styles.headerTitle}>{displayName}</Text>
                <Text style={styles.headerSub}>
                  {isAdminReplyMode ? '🛡️ Admin Live Reply Mode' : '🟢 Admin support available (Online)'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Quick Action Chips (Farmer Mode Only) */}
          {!isAdminReplyMode && (
            <View style={styles.chipsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
                {QUICK_CHIPS.map((chip, idx) => (
                  <TouchableOpacity key={idx} style={styles.chipBtn} onPress={() => handleSend(chip)}>
                    <Text style={styles.chipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Messages Body */}
          <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
            {isLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="large" color="#16a34a" />
              </View>
            ) : messages.length === 0 ? (
              <View style={styles.emptyWrap}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="chatbox-ellipses-outline" size={40} color="#16a34a" />
                </View>
                <Text style={styles.emptyTitle}>Welcome!</Text>
                <Text style={styles.emptySub}>
                  {isAdminReplyMode
                    ? 'No previous messages from this farmer.'
                    : 'Write your question below for agricultural advice, crop disease help, or app support.'}
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
                  const dt = new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  const isResolutionMsg = msg.message.includes('✓') || msg.message.toLowerCase().includes('solved') || msg.message.toLowerCase().includes('resolved');

                  if (isResolutionMsg) {
                    return (
                      <View key={msg.id} style={styles.resolutionCard}>
                        <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.resolutionTitle}>✅ Problem / Request Solved</Text>
                          <Text style={styles.resolutionBody}>{msg.message}</Text>
                          <Text style={styles.resolutionTime}>{dt}</Text>
                        </View>
                      </View>
                    );
                  }

                  // Align messages cleanly depending on viewer
                  const isRight = isAdminReplyMode ? !isFarmerMsg : isFarmerMsg;

                  return (
                    <View key={msg.id} style={[styles.msgRow, isRight ? styles.msgRowFarmer : styles.msgRowAdmin]}>
                      <View style={[styles.bubble, isRight ? styles.bubbleFarmer : styles.bubbleAdmin]}>
                        {!isFarmerMsg && <Text style={styles.senderTag}>🛡️ Admin Support</Text>}
                        {isFarmerMsg && isAdminReplyMode && <Text style={[styles.senderTag, { color: '#ffffff' }]}>🌾 Farmer</Text>}
                        <Text style={[styles.msgText, isRight ? styles.msgTextFarmer : styles.msgTextAdmin]}>
                          {msg.message}
                        </Text>
                        <Text style={[styles.timeText, isRight ? styles.timeFarmer : styles.timeAdmin]}>
                          {dt}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}

          </View>

          {/* Input Footer */}
          <View style={styles.inputFooter}>
            <TextInput
              style={styles.textInput}
              placeholder={isAdminReplyMode ? `Reply to ${displayName}...` : 'Type a message...'}
              placeholderTextColor="#94a3b8"
              value={inputText}
              onChangeText={setInputText}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]}
              disabled={!inputText.trim() || sendMessage.isPending}
              onPress={() => handleSend()}
            >
              {sendMessage.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={18} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end' },
  modalCard: { height: '88%', backgroundColor: '#ffffff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, overflow: 'hidden' },
  header: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  avatarWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  onlineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#22c55e', position: 'absolute', bottom: 0, right: 0, borderWidth: 1.5, borderColor: '#ffffff' },
  headerTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#ffffff' },
  headerSub: { fontSize: 11, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.9)', marginTop: 1 },
  closeBtn: { padding: 4 },
  chipsRow: { backgroundColor: '#f1f5f9', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  chipBtn: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
  chipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#1e293b' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, gap: 8 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a' },
  emptySub: { fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', lineHeight: 18 },
  msgRow: { flexDirection: 'row', width: '100%' },
  msgRowFarmer: { justifyContent: 'flex-end' },
  msgRowAdmin: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '82%', borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 9 },
  bubbleFarmer: { backgroundColor: '#16a34a', borderBottomRightRadius: 2 },
  bubbleAdmin: { backgroundColor: '#ffffff', borderBottomLeftRadius: 2, borderWidth: 1, borderColor: '#e2e8f0', ...premiumShadow('#000', 'sm') },
  senderTag: { fontSize: 10, fontFamily: FONT.extraBold, color: '#ea580c', marginBottom: 2 },
  msgText: { fontSize: 13, lineHeight: 18 },
  msgTextFarmer: { color: '#ffffff', fontFamily: FONT.medium },
  msgTextAdmin: { color: '#0f172a', fontFamily: FONT.medium },
  timeText: { fontSize: 9.5, marginTop: 4, textAlign: 'right' },
  timeFarmer: { color: 'rgba(255,255,255,0.85)' },
  timeAdmin: { color: '#94a3b8' },
  resolutionCard: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#16a34a', borderRadius: RADIUS.lg, padding: 12, gap: 10, marginVertical: 4 },
  resolutionTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#15803d' },
  resolutionBody: { fontSize: 12.5, fontFamily: FONT.medium, color: '#166534', marginTop: 2 },
  resolutionTime: { fontSize: 9.5, color: '#15803d', fontFamily: FONT.medium, marginTop: 4 },
  inputFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  textInput: { flex: 1, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, maxHeight: 80, color: '#0f172a' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#16a34a', alignItems: 'center', justifyContent: 'center' },
});

