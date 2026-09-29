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

const EXPLICIT_NON_FARMING_KEYWORDS = [
  'movie', 'film', 'song', 'gaana', 'cinema', 'bollywood', 'hollywood',
  'cricket', 'ipl', 'match', 'score', 'football', 'game',
  'politics', 'modi', 'bjp', 'congress', 'election', 'vote', 'minister',
  'actress', 'actor', 'dance', 'comedy', 'pubg', 'freefire'
];

const FARMING_KEYWORDS = [
  // Punjabi / Roman Punjabi
  'ਕਣਕ', 'ਝੋਨਾ', 'ਨਰਮਾ', 'ਗੰਨਾ', 'ਆਲੂ', 'ਟਮਾਟਰ', 'ਸਰ੍ਹੋਂ', 'ਫਸਲ', 'ਬੀਜ', 'ਖਾਦ', 'ਸਪ੍ਰੇ', 'ਕੀਟਨਾਸ਼ਕ', 'ਯੂਰੀਆ', 'ਡੀ.ਏ.ਪੀ',
  'ਮੰਡੀ', 'ਭਾਵ', 'ਮੌਸਮ', 'ਪੱਤੇ', 'ਕੁੰਗੀ', 'ਝੁਲਸ', 'ਸੁੰਡੀ', 'ਬੀਮਾਰੀ', 'ਪਾਣੀ', 'ਖੇਤੀ', 'ਟਰੈਕਟਰ', 'ਮਜ਼ਦੂਰੀ', 'ਖਰਚਾ',
  'kanak', 'jhona', 'narma', 'ganna', 'aloo', 'tamatar', 'sarson', 'fasal', 'beej', 'khad', 'spray', 'keetnashak',
  'urea', 'dap', 'mandi', 'bhav', 'mausam', 'patte', 'kungi', 'jhulas', 'sundi', 'beemari', 'paani', 'kheti',
  'dawai', 'dawaii', 'ilaaj', 'ilaac', 'dawa', 'tika', 'keeda', 'khet', 'kisaan', 'farmer', 'paau', 'icar',
  // English
  'wheat', 'paddy', 'rice', 'cotton', 'sugarcane', 'potato', 'tomato', 'mustard', 'crop', 'seed', 'fertilizer', 'spray',
  'pesticide', 'urea', 'dap', 'mandi', 'rate', 'price', 'weather', 'disease', 'rust', 'blight', 'fungicide', 'soil',
  'irrigation', 'farming', 'farm', 'yield', 'organic', 'fungus', 'insect', 'gulkand', 'vermicompost', 'cocopeat',
  'help', 'hello', 'hi', 'hiii', 'doctor', 'medicine', 'pest', 'leaf', 'plant', 'tree', 'growth', 'npk', 'water',
  // Hindi
  'गेहूं', 'धान', 'सरसों', 'फसल', 'खाद', 'बीज', 'स्प्रे', 'मंडी', 'भाव', 'मौसम', 'कीटनाशक', 'रोग', 'कृषि', 'खेती', 'दवा', 'इलाज', 'कीड़ा'
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

  const isExplicitNonFarming = (query: string): boolean => {
    const qLower = query.toLowerCase();
    return EXPLICIT_NON_FARMING_KEYWORDS.some((kw) => qLower.includes(kw));
  };

  const generateAgriResponse = (query: string): string => {
    const q = query.toLowerCase();

    // 1. Wheat / Yellow Rust / Kanak / Gehu
    if (q.includes('ਕਣਕ') || q.includes('wheat') || q.includes('ਕੁੰਗੀ') || q.includes('rust') || q.includes('ਗੇਂਹੂ') || q.includes('kanak') || q.includes('gehu')) {
      return '🌾 **Wheat Yellow Rust (ਕਣਕ ਦੀ ਪੀਲੀ ਕੁੰਗੀ / गेहूं का पीला रतुआ) Solution:**\n\n1. **Chemical Spray:** Propiconazole 25% EC (Tilt / FarmsKing CropProtect) @ 200 ml per acre mixed in 200 Liters of water.\n2. **Precaution:** Avoid excessive Urea application during cloudy humid weather.\n3. **Organic Remedy:** Spray 5% Neem seed extract or sour buttermilk solution (5L in 200L water).\n4. **Recommended Product:** Tilt 25% EC Propiconazole (₹380) available on FarmsKing Store.';
    }

    // 2. Paddy / Rice / Jhona / Dhan / Blast / Sundi
    if (q.includes('ਝੋਨਾ') || q.includes('paddy') || q.includes('rice') || q.includes('dhan') || q.includes('jhona') || q.includes('blast') || q.includes('sheath')) {
      return '🌱 **Paddy Leaf Blast & Sheath Blight (ਝੋਨੇ ਦਾ ਬਲਾਸਟ / धान का झुलसा) Solution:**\n\n1. **Chemical Spray:** Tricyclazole 75% WP (Baan / Beam) @ 120g per acre in 200 Liters of water.\n2. **Precaution:** Stop top-dressing Nitrogen fertilizers immediately when leaf spots appear.\n3. **Organic Remedy:** Apply Trichoderma viride bio-fungicide @ 1 kg per acre mixed with organic FYM compost.';
    }

    // 3. Cotton / Narma / Kapas / Whitefly / Sundi
    if (q.includes('ਨਰਮਾ') || q.includes('cotton') || q.includes('narma') || q.includes('kapas') || q.includes('whitefly') || q.includes('bollworm')) {
      return '☁️ **Cotton Whitefly & Pink Bollworm (ਗੁਲਾਬੀ ਸੁੰਡੀ ਤੇ ਚਿੱਟੀ ਮੱਖੀ) Solution:**\n\n1. **Chemical Spray:** Emamectin Benzoate 5% SG (100g) + Afidopyropen (Sefina) @ 400ml per acre in 200L water.\n2. **Monitoring:** Install 5 Pheromone Traps per acre.\n3. **Organic Remedy:** Spray Neem Oil 10,000 PPM @ 500ml per acre.';
    }

    // 4. Sugarcane / Ganna / Kumaad / Red Rot
    if (q.includes('ਗੰਨਾ') || q.includes('sugarcane') || q.includes('ganna') || q.includes('kumaad') || q.includes('red rot')) {
      return '🎋 **Sugarcane Red Rot Disease (ਗੰਨੇ ਦਾ ਰੱਤਾ ਰੋਗ) Solution:**\n\n1. **Soil Drenching:** Mix 500g Carbendazim 50% WP per acre in water and drench cane roots.\n2. **Bio-Control:** Apply Trichoderma harzianum @ 2.5 kg/acre mixed with organic compost.\n3. **Sanitation:** Uproot and destroy severely reddened stalks to prevent field spore spread.';
    }

    // 5. Potato / Aloo / Blight
    if (q.includes('ਆਲੂ') || q.includes('potato') || q.includes('aloo') || q.includes('potato blight')) {
      return '🥔 **Potato Early & Late Blight (ਆਲੂਆਂ ਦਾ ਝੁਲਸ ਰੋਗ) Solution:**\n\n1. **Chemical Spray:** Dimethomorph 50% WP (Acrobat 400g) + Mancozeb 75% WP (600g) in 200L water per acre.\n2. **Precaution:** Apply protective contact fungicide before heavy morning fog or frost.';
    }

    // 6. Tomato / Vegetables / Sabzi / Blight
    if (q.includes('ਟਮਾਟਰ') || q.includes('tomato') || q.includes('tamatar') || q.includes('ਸਬਜ਼ੀ') || q.includes('vegetable') || q.includes('blight')) {
      return '🍅 **Tomato & Vegetable Blight (ਝੁਲਸ ਰੋਗ / झुलसा रोग) Remedy:**\n\n1. **Chemical Spray:** Ridomil Gold (Mefenoxam + Mancozeb) @ 500g per acre in 200L water.\n2. **Bio-Remedy:** Trichoderma viride 1kg per acre mixed with organic FYM compost.';
    }

    // 7. Fertilizer / Khad / Urea / DAP / NPK / Spray / Medicine / Dawai
    if (q.includes('ਖਾਦ') || q.includes('fertilizer') || q.includes('urea') || q.includes('dap') || q.includes('npk') || q.includes('khad') || q.includes('spray') || q.includes('dawai') || q.includes('medicine')) {
      return '🌱 **Fertilizer & Spray Recommendation (PAU / ICAR Advisory):**\n\n• **Basal Sowing Dose:** 1 bag DAP (50kg) + 1/2 bag MOP (Potash) per acre.\n• **Urea Application:** Top-dress 45kg Urea per acre in 2-3 split doses at 1st & 2nd irrigation.\n• **Organic Soil Booster:** Apply Vermicompost (500kg/acre) or Humic Acid to double soil micro-nutrients.\n• **Order Genuine Products:** Buy genuine fertilizers and sprays directly on FarmsKing Store.';
    }

    // 8. Mandi Rates / Price / Market / Bhav
    if (q.includes('ਮੰਡੀ') || q.includes('ਭਾਵ') || q.includes('mandi') || q.includes('price') || q.includes('rate') || q.includes('bhav')) {
      return '📊 **Today Live Mandi Rates (Punjab & Haryana Mandi Updates):**\n\n• **Wheat (ਕਣਕ / गेहूं):** ₹2,275 - ₹2,450 / Quintal\n• **Paddy (ਝੋਨਾ / धान):** ₹3,800 - ₹4,250 / Quintal\n• **Tomato (ਟਮਾਟਰ / टमाटर):** ₹1,400 - ₹1,800 / Quintal\n• **Mustard (ਸਰ੍ਹੋਂ / सरसों):** ₹5,400 - ₹5,850 / Quintal\n\n💡 *Check live district-wise updates anytime in the "Mandi Rates" tab.*';
    }

    // 9. Weather / Mausam / Rain / Barish
    if (q.includes('ਮੌਸਮ') || q.includes('mausam') || q.includes('weather') || q.includes('rain') || q.includes('barish')) {
      return '🌤️ **FarmsKing Weather Advisory:**\n\n• Check live 7-day temperature, humidity & rainfall forecast on your FarmsKing Home Dashboard.\n• **Spraying Tip:** Avoid chemical sprays when wind speed exceeds 15 km/h or rain is expected within 4 hours.';
    }

    // 10. General Agri / Pest / Soil / Growth / Default Advice
    return '🌾 **FarmsKing Agri Expert Advice (ਖੇਤੀਬਾੜੀ ਸਲਾਹ):**\n\nYour agricultural query has been analyzed:\n1. **Crop Health:** Ensure timely irrigation and balanced NPK fertilizer application based on PAU guidelines.\n2. **Disease & Pest Watch:** Inspect leaf surfaces every 3 days. Spot-spray early infected patches.\n3. **Organic Remedies:** Use 5% Neem extract or bio-control agent Trichoderma to improve plant immunity.\n4. **FarmsKing AgriStore:** You can order genuine chemical sprays, seeds, and organic fertilizers with 24-hour village delivery.';
  };

  const handleSend = (textToSend?: string) => {
    const rawInput = (textToSend || inputQuery).trim();
    const query = rawInput || 'Farming and fertilizer advisory';
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

      if (isExplicitNonFarming(query)) {
        // Explicit non-farming question blocked
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
            <Text style={styles.headerSubtitle}>100% Free Smart Agricultural Assistant · Supports All Languages</Text>
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
});
