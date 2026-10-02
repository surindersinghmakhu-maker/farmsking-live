import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Modal,
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { GoogleGenAI } from '@google/genai';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

// ===== Garden AI (Gemini 2.5 Flash) =====
const gardenAi = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY || '' });

const GARDEN_SYSTEM_PROMPT = `You are "FarmsKing Garden Expert AI" — a premium, highly knowledgeable assistant exclusively for VIP Gardeners on the FarmsKing platform.

YOUR ALLOWED TOPICS — answer ONLY these:
1. Home Garden — flower plants, seasonal plants, terrace gardens, balcony gardens
2. Kitchen Garden — vegetables, herbs (tulsi, mint, coriander, etc.), home-grown fruits
3. Plant care — watering, sunlight, fertilizers for garden plants, soil preparation, pots, pruning
4. Pests & diseases on garden plants — home remedies, organic solutions
5. FarmsKing platform features — how to track plants, how to record expenses, how to use Garden VIP card, how to hire a Garden Expert, how to upgrade plan

CRITICAL RULES:
1. LANGUAGE: Detect the user's language automatically (Punjabi, Hindi, or English) and reply in EXACTLY the same language. If Punjabi — reply in Punjabi. If Hindi — reply in Hindi. If English — reply in English.
2. STRICT FILTER: If the user asks anything outside the above allowed topics (e.g. farming crops, politics, coding, general knowledge), POLITELY REFUSE in their language. Example: "ਮੈਂ ਸਿਰਫ਼ ਬਾਗਬਾਨੀ ਅਤੇ FarmsKing ਨਾਲ ਸੰਬੰਧਿਤ ਸਵਾਲਾਂ ਦੀ ਮਦਦ ਕਰ ਸਕਦਾ ਹਾਂ।"
3. TONE: Friendly, encouraging, like a personal garden guide speaking to a VIP member.
4. Be concise but complete. Use bullet points when listing steps.`;

async function askGardenAI(question: string): Promise<string> {
  try {
    const response = await gardenAi.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: question,
      config: {
        systemInstruction: GARDEN_SYSTEM_PROMPT,
        tools: [{ googleSearch: {} }],
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_LOW_AND_ABOVE' },
        ],
      },
    });
    return response.text || 'No response generated.';
  } catch (err) {
    console.error('[Garden AI Error]', err);
    return 'AI ਨਾਲ ਜੁੜਨ ਵਿੱਚ ਗੜਬੜ ਆਈ। ਕਿਰਪਾ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।';
  }
}

// Quick suggestion chips
const QUICK_SUGGESTIONS = [
  'ਘਰ ਵਿੱਚ ਟਮਾਟਰ ਕਿਵੇਂ ਉਗਾਈਏ?',
  'ਗਮਲੇ ਲਈ ਮਿੱਟੀ ਕਿਹੋ ਜਿਹੀ ਹੋਣੀ ਚਾਹੀਦੀ?',
  'ਤੁਲਸੀ ਦੇ ਪੌਦੇ ਦੀ ਦੇਖਭਾਲ ਕਿਵੇਂ ਕਰੀਏ?',
  'How to grow roses at home?',
  'Kitchen garden mein kya lagaein?',
  'FarmsKing VIP card ke fayde?',
];

interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface Props {
  adminWhatsapp?: string;
}

export function GardenAIChatbot({ adminWhatsapp }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'ai',
      text: '🌿 ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ! ਮੈਂ ਤੁਹਾਡਾ FarmsKing Garden Expert AI ਹਾਂ। ਬਾਗਬਾਨੀ, ਕਿਚਨ ਗਾਰਡਨ ਜਾਂ FarmsKing ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ! 🌺',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = async (text?: string) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    tap();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: question,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const reply = await askGardenAI(question);
    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'ai',
      text: reply,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, aiMsg]);
    setLoading(false);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleContactAdmin = () => {
    const phone = adminWhatsapp || '919888000000';
    const url = `https://wa.me/${phone}?text=ਹੈਲੋ FarmsKing Admin! ਮੈਂ VIP Gardener ਹਾਂ ਅਤੇ ਮੈਨੂੰ ਮਦਦ ਚਾਹੀਦੀ ਹੈ।`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <>
      {/* FAB Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => { tap(); setIsOpen(true); }}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#16a34a', '#15803d', '#14532d']} style={styles.fabGradient}>
          <Ionicons name="leaf" size={22} color="#fff" />
          <View style={styles.fabBadge}>
            <Text style={styles.fabBadgeText}>AI</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Chat Modal */}
      <Modal
        visible={isOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalWrapper}
        >
          <View style={styles.chatContainer}>
            {/* Chat Header */}
            <LinearGradient
              colors={['#14532d', '#166534', '#15803d']}
              style={styles.chatHeader}
            >
              <View style={styles.headerLeft}>
                <View style={styles.avatarCircle}>
                  <Ionicons name="flower" size={20} color="#fff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Garden Expert AI</Text>
                  <View style={styles.vipBadgeRow}>
                    <View style={styles.vipBadge}>
                      <Text style={styles.vipBadgeText}>✦ VIP</Text>
                    </View>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineText}>Online</Text>
                  </View>
                </View>
              </View>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.adminBtn} onPress={handleContactAdmin}>
                  <Ionicons name="logo-whatsapp" size={16} color="#fff" />
                  <Text style={styles.adminBtnText}>Admin</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsOpen(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            </LinearGradient>

            {/* Messages */}
            <ScrollView
              ref={scrollRef}
              style={styles.messageList}
              contentContainerStyle={styles.messageContent}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
            >
              {messages.map(msg => (
                <View
                  key={msg.id}
                  style={[
                    styles.msgRow,
                    msg.role === 'user' ? styles.msgRowUser : styles.msgRowAI,
                  ]}
                >
                  {msg.role === 'ai' && (
                    <View style={styles.msgAvatar}>
                      <Ionicons name="leaf" size={14} color="#16a34a" />
                    </View>
                  )}
                  <View
                    style={[
                      styles.msgBubble,
                      msg.role === 'user' ? styles.msgBubbleUser : styles.msgBubbleAI,
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgText,
                        msg.role === 'user' ? { color: '#fff' } : { color: '#0f172a' },
                      ]}
                    >
                      {msg.text}
                    </Text>
                    <Text
                      style={[
                        styles.msgTime,
                        msg.role === 'user' ? { color: 'rgba(255,255,255,0.7)' } : { color: '#94a3b8' },
                      ]}
                    >
                      {msg.timestamp.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}

              {loading && (
                <View style={[styles.msgRow, styles.msgRowAI]}>
                  <View style={styles.msgAvatar}>
                    <Ionicons name="leaf" size={14} color="#16a34a" />
                  </View>
                  <View style={[styles.msgBubble, styles.msgBubbleAI, styles.typingBubble]}>
                    <ActivityIndicator size="small" color="#16a34a" />
                    <Text style={{ fontSize: 12, color: '#64748b', fontFamily: FONT.medium }}>
                      Garden AI ਸੋਚ ਰਿਹਾ ਹੈ...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Quick Suggestions */}
            {messages.length <= 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.suggestions}
              >
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.suggestionChip}
                    onPress={() => sendMessage(s)}
                  >
                    <Text style={styles.suggestionText}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Input Bar */}
            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="ਬਾਗਬਾਨੀ ਬਾਰੇ ਸਵਾਲ ਪੁੱਛੋ..."
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={500}
                onSubmitEditing={() => sendMessage()}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[styles.sendBtn, loading && { opacity: 0.6 }]}
                onPress={() => sendMessage()}
                disabled={loading || !input.trim()}
              >
                <LinearGradient colors={['#16a34a', '#15803d']} style={styles.sendGradient}>
                  <Ionicons name="send" size={18} color="#fff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Ionicons name="sparkles" size={12} color="#94a3b8" />
              <Text style={styles.footerText}>
                Powered by Gemini 2.5 Flash · VIP Gardeners Only
              </Text>
              <TouchableOpacity onPress={handleContactAdmin} style={styles.footerAdminLink}>
                <Text style={styles.footerAdminText}>📞 Contact Admin</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 18,
    zIndex: 999,
    ...premiumShadow('#16a34a', 'lg'),
  },
  fabGradient: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#f59e0b',
    borderRadius: 6,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  fabBadgeText: { fontSize: 8, fontFamily: FONT.extraBold, color: '#fff' },

  modalWrapper: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  chatContainer: {
    height: '88%',
    backgroundColor: '#f8fafc',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },

  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.4)',
  },
  headerTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#fff' },
  vipBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  vipBadge: {
    backgroundColor: '#f59e0b', borderRadius: 4,
    paddingHorizontal: 5, paddingVertical: 1,
  },
  vipBadgeText: { fontSize: 9, fontFamily: FONT.extraBold, color: '#fff' },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#86efac' },
  onlineText: { fontSize: 11, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.8)' },

  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  adminBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.pill,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  adminBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#fff' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  messageList: { flex: 1, backgroundColor: '#f1f5f9' },
  messageContent: { padding: 16, gap: 10, paddingBottom: 8 },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '90%' },
  msgRowUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgRowAI: { alignSelf: 'flex-start' },
  msgAvatar: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center',
  },
  msgBubble: { borderRadius: 16, padding: 12, maxWidth: 280 },
  msgBubbleUser: { backgroundColor: '#16a34a', borderBottomRightRadius: 4 },
  msgBubbleAI: { backgroundColor: '#fff', borderBottomLeftRadius: 4, ...premiumShadow('#000', 'xs') },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  msgText: { fontSize: 13.5, fontFamily: FONT.medium, lineHeight: 20 },
  msgTime: { fontSize: 10, fontFamily: FONT.medium, marginTop: 4, textAlign: 'right' },

  suggestions: { paddingHorizontal: 14, paddingVertical: 8, gap: 8, backgroundColor: '#f8fafc' },
  suggestionChip: {
    backgroundColor: '#fff',
    borderWidth: 1, borderColor: '#d1fae5',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  suggestionText: { fontSize: 12, fontFamily: FONT.medium, color: '#166534' },

  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#e2e8f0',
  },
  input: {
    flex: 1, borderWidth: 1, borderColor: '#d1fae5',
    borderRadius: RADIUS.lg, paddingHorizontal: 14, paddingVertical: 10,
    fontSize: 13.5, fontFamily: FONT.medium,
    color: '#0f172a', backgroundColor: '#f0fdf4',
    maxHeight: 100,
  },
  sendBtn: { marginBottom: 2 },
  sendGradient: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },

  footer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, backgroundColor: '#fff',
    borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  footerText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8' },
  footerAdminLink: { marginLeft: 4 },
  footerAdminText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a' },
});
