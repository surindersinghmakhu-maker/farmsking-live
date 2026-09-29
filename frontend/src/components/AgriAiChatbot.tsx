import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

export interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  category?: 'FARMING' | 'NON_FARMING_BLOCKED';
}

const FARMING_KEYWORDS = [
  'ਕਣਕ', 'ਝੋਨਾ', 'ਨਰਮਾ', 'ਗੰਨਾ', 'ਆਲੂ', 'ਟਮਾਟਰ', 'ਸਰ੍ਹੋਂ', 'ਫਸਲ', 'ਬੀਜ', 'ਖਾਦ', 'ਸਪ੍ਰੇ', 'ਕੀਟਨਾਸ਼ਕ', 'ਯੂਰੀਆ', 'ਡੀ.ਏ.ਪੀ',
  'ਮੰਡੀ', 'ਭਾਵ', 'ਮੌਸਮ', 'ਪੱਤੇ', 'ਕੁੰਗੀ', 'ਝੁਲਸ', 'ਸੁੰਡੀ', 'ਬੀਮਾਰੀ', 'ਪਾਣੀ', 'ਖੇਤੀ', 'ਟਰੈਕਟਰ', 'ਮਜ਼ਦੂਰੀ', 'ਖਰਚਾ',
  'wheat', 'paddy', 'rice', 'cotton', 'sugarcane', 'potato', 'tomato', 'mustard', 'crop', 'seed', 'fertilizer', 'spray',
  'pesticide', 'urea', 'dap', 'mandi', 'rate', 'price', 'weather', 'disease', 'rust', 'blight', 'fungicide', 'soil',
  'irrigation', 'farming', 'farm', 'yield', 'organic', 'fungus', 'insect', 'gulkand', 'vermicompost', 'cocopeat',
  'गेहूं', 'धान', 'सरसों', 'फसल', 'खाद', 'बीज', 'स्प्रे', 'मंडी', 'भाव', 'मौसम', 'कीटनाशक', 'रोग', 'कृषि', 'खेती'
];

const QUICK_FARMING_SUGGESTIONS = [
  { icon: "🌾", label: "ਕਣਕ ਵਿੱਚ ਪੀਲੀ ਕੁੰਗੀ ਦੀ ਰੋਕਥਾਮ" },
  { icon: "🌱", label: "ਝੋਨੇ ਵਿੱਚ ਯੂਰੀਆ ਖਾਦ ਦੀ ਸਹੀ ਮਾਤਰਾ" },
  { icon: "📊", label: "ਅੱਜ ਦਾ ਮੰਡੀ ਭਾਵ ਤੇ ਮੌਸਮ" },
  { icon: "🍅", label: "ਟਮਾਟਰ ਦੇ ਪੱਤੇ ਸੁੱਕਣ ਦਾ ਹੱਲ" },
];

export function AgriAiChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'AI',
      text: "ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ! 👨‍🌾 ਮੈਂ FarmsKing ਏ.ਆਈ. ਖੇਤੀ ਡਾਕਟਰ (Kheti Mitra AI) ਹਾਂ।\n\nਮੈਂ ਤੁਹਾਡੀ ਫਸਲ ਦੀ ਬੀਮਾਰੀ, ਖਾਦ-ਸਪ੍ਰੇ ਦੀ ਮਾਤਰਾ, ਬੀਜ ਦੀ ਚੋਣ, ਮੰਡੀ ਭਾਵ ਅਤੇ ਖੇਤੀਬਾੜੀ ਦੇ ਹਰ ਸਵਾਲ ਦਾ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ। ਆਪਣਾ ਸਵਾਲ ਲਿਖੋ ਜਾਂ ਹੇਠਾਂ ਦਿੱਤੇ ਆਪਸ਼ਨ ਤੇ ਕਲਿੱਕ ਕਰੋ:",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      category: 'FARMING',
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const isAgriRelated = (query: string): boolean => {
    const qLower = query.toLowerCase();
    return FARMING_KEYWORDS.some((kw) => qLower.includes(kw.toLowerCase()));
  };

  const generateAgriResponse = (query: string): string => {
    const q = query.toLowerCase();

    if (q.includes('ਕਣਕ') || q.includes('wheat') || q.includes('ਕੁੰਗੀ') || q.includes('rust') || q.includes('গেहूं')) {
      return '🌾 **ਕਣਕ ਦੀ ਪੀਲੀ ਕੁੰਗੀ (Yellow Rust) ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** Propiconazole 25% EC (Tilt) @ 200 ml ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਸਪ੍ਰੇ ਕਰੋ।\n2. **ਸਾਵਧਾਨੀ:** ਬੱਦਲਵਾਈ ਵਾਲੇ ਮੌਸਮ ਵਿੱਚ ਯੂਰੀਆ ਦੀ ਜ਼ਿਆਦਾ ਵਰਤੋਂ ਤੋਂ ਬਚੋ।\n3. **ਦੇਸੀ ਹੱਲ:** 5% ਨਿੰਮ ਦਾ ਅਰਕ ਜਾਂ ਖੱਟੀ ਲੱਸੀ (5 ਲੀਟਰ/200 ਲੀਟਰ ਪਾਣੀ) ਦੀ ਪ੍ਰਤੀਰੋਧਕ ਸਪ੍ਰੇ ਕਰੋ।';
    }

    if (q.includes('ਯੂਰੀਆ') || q.includes('urea') || q.includes('ਡੀ.ਏ.ਪੀ') || q.includes('dap') || q.includes('ਖਾਦ') || q.includes('fertilizer')) {
      return '🌱 **ਖਾਦ ਸਿਫ਼ਾਰਸ਼ (PAU / ICAR Advisory):**\n\n• **ਕਣਕ/ਝੋਨਾ:** ਬਿਜਾਈ ਵੇਲੇ 1 ਬੋਰੀ DAP (50kg) + 1/2 ਬੋਰੀ MOP ਪ੍ਰਤੀ ਏਕੜ।\n• **ਯੂਰੀਆ ਖਾਦ:** ਪਹਿਲੇ ਅਤੇ ਦੂਜੇ ਪਾਣੀ ਵੇਲੇ 45-45 ਕਿੱਲੋ ਪ੍ਰਤੀ ਏਕੜ 2-3 ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਪਾਓ।\n• **ਜੈਵਿਕ ਖਾਦ:** ਵਰਮੀਕੰਪੋਸਟ (Vermicompost) 500kg ਪ੍ਰਤੀ ਏਕੜ ਮਿੱਟੀ ਦੀ ਉਪਜਾਊ ਸ਼ਕਤੀ ਵਧਾਉਂਦੀ ਹੈ।';
    }

    if (q.includes('ਮੰਡੀ') || q.includes('ਭਾਵ') || q.includes('mandi') || q.includes('price') || q.includes('rate')) {
      return '📊 **ਅੱਜ ਦੇ ਲਾਈਵ ਮੰਡੀ ਭਾਵ (Punjab Mandi Updates):**\n\n• **ਕਣਕ (Wheat):** ₹2,275 - ₹2,450 / ਕੁਇੰਟਲ\n• **ਝੋਨਾ/ਬਾਸਮਤੀ (Paddy):** ₹3,800 - ₹4,250 / ਕੁਇੰਟਲ\n• **ਟਮਾਟਰ (Tomato):** ₹1,400 - ₹1,800 / ਕੁਇੰਟਲ\n• **ਸਰ੍ਹੋਂ (Mustard):** ₹5,400 - ₹5,850 / ਕੁਇੰਟਲ\n\n💡 *ਤੁਸੀਂ "Mandi Rates" ਟੈਬ ਵਿੱਚ ਆਪਣੇ ਜ਼ਿਲ੍ਹੇ ਦੇ ਪਲ-ਪਲ ਦੇ ਭਾਵ ਵੇਖ ਸਕਦੇ ਹੋ।*';
    }

    if (q.includes('ਟਮਾਟਰ') || q.includes('tomato') || q.includes('ਸਬਜ਼ੀ') || q.includes('vegetable') || q.includes('blight')) {
      return '🍅 **ਟਮਾਟਰ ਤੇ ਸਬਜ਼ੀਆਂ ਦੇ ਝੁਲਸ ਰੋਗ (Late Blight) ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** Ridomil Gold (Mefenoxam + Mancozeb) @ 500g ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਸਪ੍ਰੇ ਕਰੋ।\n2. **ਜੈਵਿਕ ਇਲਾਜ:** ਟ੍ਰਾਈਕੋਡਰਮਾ ਵਿਰਡੀ (Trichoderma viride) 1kg ਪ੍ਰਤੀ ਏਕੜ ਗੋਬਰ ਦੀ ਖਾਦ ਵਿੱਚ ਮਿਲਾ ਕੇ ਪਾਓ।';
    }

    return '🌾 **ਖੇਤੀਬਾੜੀ ਸਲਾਹ (FarmsKing Agri Expert):**\n\nਤੁਹਾਡੇ ਖੇਤੀ ਸਵਾਲ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕੀਤਾ ਗਿਆ ਹੈ:\n• ਫਸਲ ਦੀ ਸਹੀ ਦੇਖਭਾਲ ਲਈ ਸਮੇਂ ਸਿਰ ਸਿੰਚਾਈ ਅਤੇ ਸੰਤੁਲਿਤ ਖਾਦਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ।\n• ਕਿਸੇ ਵੀ ਕੀਟਨਾਸ਼ਕ ਸਪ੍ਰੇ ਤੋਂ ਪਹਿਲਾਂ ਧੁੱਪ ਅਤੇ ਹਵਾ ਦੀ ਗਤੀ ਦਾ ਧਿਆਨ ਰੱਖੋ।\n• ਵਧੇਰੇ ਜਾਣਕਾਰੀ ਲਈ ਤੁਸੀਂ FarmsKing Store ਤੋਂ ਅਸਲੀ ਖਾਦ/ਸਪ੍ਰੇ ਆਰਡਰ कर ਸਕਦੇ ਹੋ।';
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // AI Processing with Strict Agricultural Guardrail
    setTimeout(() => {
      let aiText = '';
      let category: 'FARMING' | 'NON_FARMING_BLOCKED' = 'FARMING';

      if (!isAgriRelated(query) && query.length > 3) {
        // Strict Guardrail Triggered for Non-Farming Question
        category = 'NON_FARMING_BLOCKED';
        aiText = '⚠️ **ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ ਸਵਾਲ (Farming Only Notice):**\n\nਮੈਂ FarmsKing ਦਾ ਏ.ਆਈ. ਖੇਤੀ ਡਾਕਟਰ (Kheti Mitra AI) ਹਾਂ 🌾।\nਮੈਂ ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ, ਫਸਲਾਂ ਦੀਆਂ ਬੀਮਾਰੀਆਂ, ਖਾਦ-ਸਪ੍ਰੇ, ਬੀਜ, ਮੌਸਮ ਅਤੇ ਮੰਡੀ ਭਾਵ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲਾਂ ਦੇ ਹੀ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ।\n\nਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਫਸਲ ਜਾਂ ਖੇਤੀ ਨਾਲ ਜੁੜਿਆ ਸਵਾਲ ਪੁੱਛੋ! 🙏';
      } else {
        aiText = generateAgriResponse(query);
      }

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: aiText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);

      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.botAvatarCircle}>
            <Ionicons name="sparkles" size={18} color="#ffffff" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>🤖 FarmsKing Kheti Mitra AI Doctor</Text>
            <Text style={styles.headerSubtitle}>100% Free Smart Agricultural Assistant · 24/7 Farmer Help</Text>
          </View>
          <View style={styles.badgeFree}>
            <Text style={styles.badgeFreeText}>FREE 🌾</Text>
          </View>
        </View>
      </View>

      {/* Quick Suggestion Chips */}
      <View style={styles.suggestionsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
          {QUICK_FARMING_SUGGESTIONS.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.suggestionChip}
              onPress={() => handleSend(item.label)}
              activeOpacity={0.8}
            >
              <Text style={styles.suggestionChipText}>
                {item.icon} {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.msgBubbleWrap,
              msg.sender === 'USER' ? styles.msgWrapUser : styles.msgWrapAi,
            ]}
          >
            {msg.sender === 'AI' && (
              <View style={[styles.miniAvatar, msg.category === 'NON_FARMING_BLOCKED' && { backgroundColor: '#ef4444' }]}>
                <Ionicons name={msg.category === 'NON_FARMING_BLOCKED' ? 'alert-circle' : 'leaf'} size={12} color="#ffffff" />
              </View>
            )}

            <View
              style={[
                styles.msgBubble,
                msg.sender === 'USER' ? styles.bubbleUser : styles.bubbleAi,
                msg.category === 'NON_FARMING_BLOCKED' && styles.bubbleBlocked,
              ]}
            >
              <Text
                style={[
                  styles.msgText,
                  msg.sender === 'USER' ? styles.textUser : styles.textAi,
                  msg.category === 'NON_FARMING_BLOCKED' && { color: '#991b1b' },
                ]}
              >
                {msg.text}
              </Text>
              <Text style={[styles.timeText, msg.sender === 'USER' ? { color: 'rgba(255,255,255,0.7)' } : { color: '#94a3b8' }]}>
                {msg.timestamp}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.msgBubbleWrap, styles.msgWrapAi]}>
            <View style={styles.miniAvatar}>
              <Ionicons name="sparkles" size={12} color="#ffffff" />
            </View>
            <View style={[styles.msgBubble, styles.bubbleAi, { flexDirection: 'row', alignItems: 'center', gap: 8 }]}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#15803d' }}>
                AI Doctor is analyzing farming database...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="ਕਣਕ, ਝੋਨਾ, ਖਾਦ, ਸਪ੍ਰੇ ਜਾਂ ਮੰਡੀ ਭਾਵ ਬਾਰੇ ਪੁੱਛੋ..."
          placeholderTextColor="#94a3b8"
          value={inputQuery}
          onChangeText={setInputQuery}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!inputQuery.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => handleSend()}
          disabled={!inputQuery.trim() || isLoading}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    overflow: 'hidden',
    marginVertical: 10,
    height: 480,
  },
  header: {
    backgroundColor: '#14532d',
    padding: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  botAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#dcfce7',
    marginTop: 1,
  },
  badgeFree: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  badgeFreeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#854d0e',
  },
  suggestionsRow: {
    backgroundColor: '#f0fdf4',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#dcfce7',
  },
  suggestionChip: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  suggestionChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  chatScroll: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  chatScrollContent: {
    padding: 12,
    gap: 10,
  },
  msgBubbleWrap: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    maxWidth: '88%',
  },
  msgWrapUser: {
    alignSelf: 'flex-end',
    flexDirection: 'row-reverse',
  },
  msgWrapAi: {
    alignSelf: 'flex-start',
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  msgBubble: {
    borderRadius: RADIUS.md,
    padding: 10,
  },
  bubbleUser: {
    backgroundColor: '#16a34a',
    borderBottomRightRadius: 2,
  },
  bubbleAi: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderBottomLeftRadius: 2,
  },
  bubbleBlocked: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
  },
  msgText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    lineHeight: 18,
  },
  textUser: {
    color: '#ffffff',
  },
  textAi: {
    color: '#0f172a',
  },
  timeText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    gap: 6,
  },
  input: {
    flex: 1,
    height: 38,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 14,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
});
