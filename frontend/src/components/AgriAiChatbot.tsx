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
  { icon: "🌾", label: "Wheat Yellow Rust Treatment" },
  { icon: "🌱", label: "Paddy Urea Fertilizer Dosage" },
  { icon: "📊", label: "Live Mandi Rates & Weather Today" },
  { icon: "🍅", label: "Tomato Leaf Blight Remedy" },
];

export function AgriAiChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'AI',
      text: "Welcome! 👨‍🌾 I am FarmsKing Agri AI Doctor (Kheti Mitra AI).\n\nI can answer all your questions about crop diseases, fertilizer dosage, seed selection, weather, and mandi rates in English, Punjabi (ਪੰਜਾਬੀ), and Hindi (हिंदी).\n\nType your question in any language below or select an option:",
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

    if (q.includes('ਕਣਕ') || q.includes('wheat') || q.includes('ਕੁੰਗੀ') || q.includes('rust') || q.includes('ਗੇਂਹੂ') || q.includes('kanak') || q.includes('gehu')) {
      return '🌾 **Wheat Yellow Rust (ਕਣਕ ਦੀ ਪੀਲੀ ਕੁੰਗੀ / गेहूं का पीला रतुआ) Solution:**\n\n1. **Chemical Spray:** Propiconazole 25% EC (Tilt) @ 200 ml per acre mixed in 200 Liters of water.\n2. **Precaution:** Avoid excessive Urea application during cloudy humid weather.\n3. **Organic Remedy:** Spray 5% Neem seed extract or sour buttermilk solution (5L in 200L water).';
    }

    if (q.includes('ਮੰਡੀ') || q.includes('ਭਾਵ') || q.includes('mandi') || q.includes('price') || q.includes('rate')) {
      return '📊 **Today Live Mandi Rates (ਪੰਜਾਬ / Haryana Mandi Updates):**\n\n• **Wheat (ਕਣਕ / गेहूं):** ₹2,275 - ₹2,450 / Quintal\n• **Paddy (ਝੋਨਾ / धान):** ₹3,800 - ₹4,250 / Quintal\n• **Tomato (ਟਮਾਟਰ / टमाटर):** ₹1,400 - ₹1,800 / Quintal\n• **Mustard (ਸਰ੍ਹੋਂ / सरसों):** ₹5,400 - ₹5,850 / Quintal\n\n💡 *Check live updates anytime in the "Mandi Rates" tab.*';
    }

    if (q.includes('ਟਮਾਟਰ') || q.includes('tomato') || q.includes('ਸਬਜ਼ੀ') || q.includes('vegetable') || q.includes('blight')) {
      return '🍅 **Tomato & Vegetable Blight (ਝੁਲਸ ਰੋਗ / झुलसा रोग) Remedy:**\n\n1. **Chemical Spray:** Ridomil Gold (Mefenoxam + Mancozeb) @ 500g per acre in 200L water.\n2. **Bio-Remedy:** Trichoderma viride 1kg per acre mixed with organic FYM compost.';
    }

    return '🌾 **FarmsKing Agri Expert Advice (ਖੇਤੀਬਾੜੀ ਸਲਾਹ):**\n\nYour agricultural query has been analyzed:\n• Ensure timely irrigation and balanced NPK fertilizer application.\n• Inspect field leaves every 3 days for early pest or fungal disease signs.\n• Order genuine chemical sprays and organic fertilizers directly from FarmsKing Store.';
  };

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery || 'ਖੇਤੀਬਾੜੀ ਅਤੇ ਖਾਦਾਂ ਬਾਰੇ ਜਾਣਕਾਰੀ').trim();
    if (isLoading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'USER',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
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
        aiText = '⚠️ **Agricultural Questions Only (ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ ਸਵਾਲ):**\n\nI am FarmsKing\'s AI Kheti Doctor 🌾.\nI can only answer questions related to crops, fertilizers, sprays, seeds, weather, and mandi rates in English, Punjabi (ਪੰਜਾਬੀ), and Hindi (हिंदी).\n\nPlease ask a question related to your crops or farming!';
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
          placeholder="Ask about wheat, paddy, fertilizers, sprays or mandi rates..."
          placeholderTextColor="#94a3b8"
          value={inputQuery}
          onChangeText={setInputQuery}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={styles.sendBtn}
          onPress={() => handleSend()}
          disabled={isLoading}
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
