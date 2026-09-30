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

const QUICK_FARMING_SUGGESTIONS = [
  { icon: "🌾", label: "Wheat Yellow Rust Treatment" },
  { icon: "🌱", label: "Paddy Urea Fertilizer Dosage" },
  { icon: "📊", label: "Live Mandi Rates & Weather Today" },
  { icon: "🍅", label: "Tomato Leaf Blight Remedy" },
];

export type LanguageCode = 'GURMUKHI' | 'DEVANAGARI' | 'ENGLISH';

export type CropTopic =
  | 'GENDA'
  | 'WHEAT'
  | 'PADDY'
  | 'COTTON'
  | 'SUGARCANE'
  | 'POTATO'
  | 'TOMATO'
  | 'MUSTARD'
  | 'DAIRY'
  | 'STORE'
  | 'MANDI'
  | 'WEATHER'
  | 'FERTILIZER'
  | 'PLANT_AGE_20'
  | 'GENERAL';

export type ActionTopic =
  | 'WATER'
  | 'SPRAY_DISEASE'
  | 'FERTILIZER_DOSAGE'
  | 'GROWTH_TILLERING'
  | 'WEED_CONTROL'
  | 'SEED_SOWING'
  | 'MANDI_RATE'
  | 'WEATHER_INFO'
  | 'GENERAL_CARE';

interface AgriAiChatbotProps {
  isModal?: boolean;
}

export function AgriAiChatbot({ isModal = false }: AgriAiChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'AI',
      text: "🌾 **ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! Welcome to FarmsKing Agri AI Doctor (Kheti Mitra AI)**\n\nI have active conversation memory! Ask me any farming question in Punjabi, Hindi, or English. If you ask follow-up questions (e.g. 'ehnu pani kadon laiye?'), I remember what crop we are discussing!",
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

  const detectLanguage = (query: string): LanguageCode => {
    const qLower = query.toLowerCase();

    if (qLower.includes('punjabi') || qLower.includes('gurmukhi') || /[\u0A00-\u0A7F]/.test(query)) {
      return 'GURMUKHI';
    }
    if (qLower.includes('hindi') || qLower.includes('हिंदी') || /[\u0900-\u097F]/.test(query)) {
      return 'DEVANAGARI';
    }
    if (qLower.includes('english')) {
      return 'ENGLISH';
    }

    const punjabiWords = [
      'krda', 'karda', 'krdi', 'kardi', 'ha', 'haan', 'han', 'hunda', 'hunde',
      'vich', 'te', 'nu', 'saada', 'saadi', 'tuhanu', 'puaa', 'pao', 'karni',
      'dasso', 'mera', 'meri', 'de', 'da', 'di', 'khet', 'khetan', 'laayi',
      'layi', 'pind', 'kisaan', 'paude', 'kra', 'paani', 'din', 'gende', 'genda',
      'ehnu', 'ehda', 'kadon', 'laiye', 'kera', 'krie', 'kini', 'pava'
    ];
    const hindiWords = [
      'krta', 'karta', 'krti', 'karti', 'hu', 'hoon', 'hai', 'hain', 'kaise',
      'kya', 'kaun', 'chahiye', 'batao', 'karein', 'kare', 'ki', 'ke', 'ko',
      'mein', 'se', 'par', 'karte', 'hoge', 'karo', 'dijiye', 'paudhe', 'isme'
    ];

    let pCount = 0;
    let hCount = 0;
    const words = qLower.split(/\s+/);

    words.forEach((w) => {
      if (punjabiWords.includes(w)) pCount++;
      if (hindiWords.includes(w)) hCount++;
    });

    if (pCount > hCount) return 'GURMUKHI';
    if (hCount > pCount) return 'DEVANAGARI';

    // Default Roman Indian input to Gurmukhi script for Punjabi farmers
    return 'GURMUKHI';
  };

  // Extract crop entity from current text or conversation history memory
  const extractCropTopic = (text: string): CropTopic | null => {
    const q = text.toLowerCase();
    if (q.includes('genda') || q.includes('gende') || q.includes('marigold') || q.includes('ਗੇਂਦਾ') || q.includes('ਗੇਂਦੇ') || q.includes('गेंदा')) return 'GENDA';
    if (q.includes('kanak') || q.includes('gehu') || q.includes('wheat') || q.includes('ਕਣਕ') || q.includes('ਗੇਂਹੂ') || q.includes('rust') || q.includes('ਕੁੰਗੀ')) return 'WHEAT';
    if (q.includes('jhona') || q.includes('dhan') || q.includes('paddy') || q.includes('rice') || q.includes('ਝੋਨਾ') || q.includes('ਧਾਨ') || q.includes('blast')) return 'PADDY';
    if (q.includes('narma') || q.includes('kapas') || q.includes('cotton') || q.includes('ਨਰਮਾ') || q.includes('ਕਪਾਹ') || q.includes('whitefly')) return 'COTTON';
    if (q.includes('ganna') || q.includes('kumaad') || q.includes('sugarcane') || q.includes('ਗੰਨਾ') || q.includes('गन्ना')) return 'SUGARCANE';
    if (q.includes('aloo') || q.includes('potato') || q.includes('ਆਲੂ') || q.includes('आलू')) return 'POTATO';
    if (q.includes('tamatar') || q.includes('tomato') || q.includes('sabzi') || q.includes('ਟਮਾਟਰ') || q.includes('ਸਬਜ਼ੀ') || q.includes('टमाटर')) return 'TOMATO';
    if (q.includes('sarson') || q.includes('mustard') || q.includes('ਸਰ੍ਹੋਂ') || q.includes('सरसों')) return 'MUSTARD';
    if (q.includes('majh') || q.includes('gai') || q.includes('cow') || q.includes('buffalo') || q.includes('milk') || q.includes('doodh') || q.includes('ਮੱਝ') || q.includes('ਗਾਂ') || q.includes('ਦੁੱਧ')) return 'DAIRY';
    if (q.includes('farmsking') || q.includes('app') || q.includes('store') || q.includes('wallet') || q.includes('dukan')) return 'STORE';
    if (q.includes('mandi') || q.includes('bhav') || q.includes('rate') || q.includes('price') || q.includes('ਮੰਡੀ') || q.includes('ਭਾਵ')) return 'MANDI';
    if (q.includes('mausam') || q.includes('weather') || q.includes('rain') || q.includes('barish') || q.includes('ਮੌਸਮ')) return 'WEATHER';
    if (q.includes('urea') || q.includes('dap') || q.includes('npk') || q.includes('khad') || q.includes('ਖਾਦ') || q.includes('खाद')) return 'FERTILIZER';
    if (q.includes('20 din') || q.includes('15 din') || q.includes('25 din') || q.includes('30 din') || q.includes('paude') || q.includes('ਪੌਦੇ')) return 'PLANT_AGE_20';
    return null;
  };

  // Find active crop context from recent conversation history
  const getContextCrop = (query: string, history: ChatMessage[]): { crop: CropTopic; fromMemory: boolean } => {
    const directCrop = extractCropTopic(query);
    if (directCrop) {
      return { crop: directCrop, fromMemory: false };
    }

    // Look backwards in history for active crop topic
    for (let i = history.length - 1; i >= 0; i--) {
      const topic = extractCropTopic(history[i].text);
      if (topic && topic !== 'STORE' && topic !== 'MANDI' && topic !== 'WEATHER') {
        return { crop: topic, fromMemory: true };
      }
    }

    return { crop: 'GENERAL', fromMemory: false };
  };

  // Extract action/concern from query
  const extractActionTopic = (query: string): ActionTopic => {
    const q = query.toLowerCase();
    if (q.includes('pani') || q.includes('paani') || q.includes('water') || q.includes('irrigation') || q.includes('ਪਾਣੀ') || q.includes('ਸਿੰਚਾਈ') || q.includes('पानी')) return 'WATER';
    if (q.includes('spray') || q.includes('dawai') || q.includes('dawaii') || q.includes('dawa') || q.includes('sundi') || q.includes('keeda') || q.includes('beemari') || q.includes('ilaaj') || q.includes('ਸਪ੍ਰੇ') || q.includes('ਦਵਾਈ') || q.includes('ਬੀਮਾਰੀ') || q.includes('ਇਲਾਜ') || q.includes('ਕੀੜਾ') || q.includes('रोग') || q.includes('कीड़ा')) return 'SPRAY_DISEASE';
    if (q.includes('khad') || q.includes('urea') || q.includes('dap') || q.includes('npk') || q.includes('kini') || q.includes('dosage') || q.includes('ਖਾਦ') || q.includes('ਯੂਰੀਆ') || q.includes('खाद')) return 'FERTILIZER_DOSAGE';
    if (q.includes('growth') || q.includes('phutara') || q.includes('futara') || q.includes('vadhara') || q.includes('ਫੁੱਟਾਰਾ') || q.includes('ਗ੍ਰੋਥ') || q.includes('फुटाव')) return 'GROWTH_TILLERING';
    if (q.includes('nadin') || q.includes('gulli') || q.includes('danda') || q.includes('weed') || q.includes('ghas') || q.includes('ਨਦੀਨ') || q.includes('ਗੁੱਲੀ') || q.includes('खरपतवार')) return 'WEED_CONTROL';
    if (q.includes('beej') || q.includes('sowing') || q.includes('bijai') || q.includes('variety') || q.includes('ਕਿਸਮ') || q.includes('ਬੀਜ') || q.includes('ਬਿਜਾਈ') || q.includes('बीज')) return 'SEED_SOWING';
    if (q.includes('mandi') || q.includes('rate') || q.includes('bhav') || q.includes('price') || q.includes('ਮੰਡੀ') || q.includes('ਭਾਵ')) return 'MANDI_RATE';
    if (q.includes('weather') || q.includes('rain') || q.includes('mausam') || q.includes('ਮੌਸਮ') || q.includes('मौसम')) return 'WEATHER_INFO';
    return 'GENERAL_CARE';
  };

  const generateAgriResponse = (query: string, history: ChatMessage[]): string => {
    const q = query.toLowerCase().trim();
    const lang = detectLanguage(query);
    const { crop, fromMemory } = getContextCrop(query, history);
    const action = extractActionTopic(query);
    const userQueryTitle = query.length > 35 ? query.substring(0, 35) + '...' : query;

    const memoryNoticeGurmukhi = fromMemory ? `\n💡 *(ਪਿਛਲੀ ਗੱਲਬਾਤ ਦੀ ਯਾਦ ਦੇ ਅਧਾਰ 'ਤੇ)*` : '';
    const memoryNoticeDevanagari = fromMemory ? `\n💡 *(पिछली बातचीत के आधार पर)*` : '';
    const memoryNoticeEnglish = fromMemory ? `\n💡 *(Context remembered from conversation)*` : '';

    // 1. Language Request Command
    if ((q.includes('punjabi') || q.includes('ਪੰਜਾਬੀ')) && (q.includes('language') || q.includes('gall') || q.includes('use') || q.includes('speak') || q.includes('vich') || q.includes('ch'))) {
      return `🌾 **ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! (FarmsKing AI ਖੇਤੀ ਡਾਕਟਰ):**\n\nਜੀ ਹਾਂ, ਹੁਣ ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਪੂਰੀ ਤਰ੍ਹਾਂ ਪੰਜਾਬੀ (ਗੁਰਮੁਖੀ) ਵਿੱਚ ਗੱਲਬਾਤ ਕਰਾਂਗਾ। ਮੈਨੂੰ ਤੁਹਾਡੀ ਪਿਛਲੀ ਗੱਲਬਾਤ ਵੀ ਯਾਦ ਰਹਿੰਦੀ ਹੈ!\n\nਤੁਸੀਂ ਆਪਣੀ ਫਸਲ (ਕਣਕ, ਝੋਨਾ, ਨਰਮਾ, ਗੰਨਾ, ਆਲੂ, ਟਮਾਟਰ, ਗੇਂਦਾ), ਖਾਦਾਂ, ਯੂਰੀਆ, 20 ਦਿਨਾਂ ਦੇ ਪੌਦਿਆਂ ਲਈ ਸਪ੍ਰੇ, ਮੰਡੀ ਭਾਵ, ਮੌਸਮ ਅਤੇ FarmsKing ਐਪ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ!`;
    }

    // 2. MARIGOLD / GENDA FLOWER FARMING
    if (crop === 'GENDA') {
      if (action === 'WATER') {
        if (lang === 'DEVANAGARI') {
          return `🌼 **गेंदा खेती — सिंचाई एवं पानी सलाह ("${userQueryTitle}"):${memoryNoticeDevanagari}**\n\n1. **पहली सिंचाई:** पौधे लगाने के तुरंत बाद हल्की सिंचाई करें। शुरुआती 15-20 दिनों में 7-8 दिनों के अंतर पर पानी दें।\n2. **जल निकासी:** खेत में पानी जमा न होने दें, इससे जड़ें सड़ने का खतरा रहता है।\n3. **उर्वरक की मात्रा:** सिंचाई के बाद प्रति एकड़ 20kg यूरिया की टॉप-ड्रेसिंग करें।\n4. **FarmsKing Store:** असली दवाएं और एनपीके सीधे ऐप से मंगाएं।`;
        }
        if (lang === 'ENGLISH') {
          return `🌼 **Marigold Farming — Irrigation Advisory ("${userQueryTitle}"):${memoryNoticeEnglish}**\n\n1. **First Water:** Apply light irrigation immediately after transplanting. Irrigate every 7-8 days for initial 3 weeks.\n2. **Drainage:** Prevent stagnation of standing water to avoid root rot fungal attack.\n3. **Fertilizer Dose:** Top-dress 20kg Urea per acre post irrigation.\n4. **FarmsKing Store:** Order genuine NPK & fungicides on FarmsKing Store.`;
        }
        return `🌼 **ਗੇਂਦੇ ਦੀ ਖੇਤੀ — ਪਾਣੀ ਅਤੇ ਸਿੰਚਾਈ ਦੀ ਸਲਾਹ ("${userQueryTitle}"):${memoryNoticeGurmukhi}**\n\n1. **ਪਹਿਲਾ ਪਾਣੀ:** ਪੌਦੇ ਲਾਉਣ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ ਹਲਕਾ ਪਾਣੀ ਲਾਓ। ਸ਼ੁਰੂਆਤੀ 15-20 ਦਿਨਾਂ ਵਿੱਚ 7-8 ਦਿਨਾਂ ਦੇ ਫਾਸਲੇ 'ਤੇ ਪਾਣੀ ਦਿਓ।\n2. **ਨਮੀ ਦੀ ਜਾਂਚ:** ਗੇਂਦੇ ਦੇ ਖੇਤ ਵਿੱਚ ਬਹੁਤ ਜ਼ਿਆਦਾ ਪਾਣੀ ਖੜ੍ਹਨ ਨਾਲ ਜੜ੍ਹਾਂ ਗਲਣ ਦਾ ਖਤਰਾ ਹੁੰਦਾ ਹੈ। ਖੇਤ ਵਿੱਚੋਂ ਵਾਧੂ ਪਾਣੀ ਦੀ ਨਿਕਾਸੀ ਰੱਖੋ।\n3. **ਖਾਦ ਦੀ ਖੁਰਾਕ:** ਪਾਣੀ ਲਾਉਣ ਤੋਂ ਬਾਅਦ ਪ੍ਰਤੀ ਏਕੜ 20kg ਨਾਈਟ੍ਰੋਜਨ (ਯੂਰੀਆ) ਦੀ ਟਾਪ-ਡ੍ਰੈਸਿੰਗ ਕਰੋ।\n4. **FarmsKing Store:** ਅਸਲੀ ਖਾਦਾਂ ਅਤੇ ਗ੍ਰੋਥ ਪ੍ਰਮੋਟਰ FarmsKing ਐਪ ਤੋਂ ਮੰਗਵਾਓ।`;
      }
      if (action === 'SPRAY_DISEASE') {
        if (lang === 'DEVANAGARI') {
          return `🌼 **गेंदा फसल — झुलसा रोग एवं कीट नियंत्रण स्प्रे ("${userQueryTitle}"):${memoryNoticeDevanagari}**\n\n1. **झुलसा रोग (Leaf Blight):** पत्तियों पर काले धब्बे दिखने पर मैंकोज़ेब (Mancozeb 75% WP) 2g/L पानी (400g/एकड़) छिड़कें।\n2. **सुंडी एवं चेपा:** इमामेक्टिन बेंजोएट 5% SG (100g/एकड़) 200L पानी में छिड़कें।\n3. **जैविक उपाय:** 5% नीम तेल (500ml/एकड़) का छिड़काव करें।\n4. **दवा खरीदें:** FarmsKing Store से 100% असली दवाएं मंगाएं।`;
        }
        if (lang === 'ENGLISH') {
          return `🌼 **Marigold Crop — Blight & Pest Spray Advisory ("${userQueryTitle}"):${memoryNoticeEnglish}**\n\n1. **Leaf Blight:** Spray Mancozeb 75% WP @ 2g/L water (400g/acre) at first sign of black spots.\n2. **Caterpillar & Aphids:** Spray Emamectin Benzoate 5% SG @ 100g/acre in 200L water.\n3. **Organic Protection:** Spray 5% Neem Oil @ 500ml/acre.\n4. **FarmsKing Store:** Buy genuine crop medicines on FarmsKing.`;
        }
        return `🌼 **ਗੇਂਦੇ ਦੀ ਫਸਲ — ਕੀੜੇ ਅਤੇ ਝੁਲਸ ਰੋਗ ਦੀ ਸਪ੍ਰੇ ("${userQueryTitle}"):${memoryNoticeGurmukhi}**\n\n1. **ਝੁਲਸ ਰੋਗ (Leaf Blight):** ਪੱਤਿਆਂ 'ਤੇ ਕਾਲੇ ਦਾਗ਼ ਦਿਸਣ 'ਤੇ ਮੈਂਕੋਜ਼ੇਬ (Mancozeb 75% WP) 2g ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ (400g/ਏਕੜ) ਸਪ੍ਰੇ ਕਰੋ।\n2. **ਸੁੰਡੀ ਅਤੇ ਚੇਪਾ:** ਸੁੰਡੀ ਲਈ ਇਮਾਮੈਕਟਿਨ ਬੈਂਜ਼ੋਏਟ 5% SG (100g/ਏਕੜ) 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n3. **ਜੈਵਿਕ ਸੁਰੱਖਿਆ:** 5% ਨਿੰਮ ਦਾ ਤੇਲ (500ml/ਏਕੜ) ਸਪ੍ਰੇ ਕਰਕੇ ਫਸਲ ਨੂੰ ਕੀੜਿਆਂ ਤੋਂ ਬਚਾਓ।\n4. **FarmsKing Store:** ਅਸਲੀ ਫੰਗਸਨਾਸ਼ਕ ਅਤੇ ਸਪ੍ਰੇਆਂ FarmsKing ਐਪ ਤੋਂ ਮੰਗਵਾਓ।`;
      }
      return `🌼 **ਗੇਂਦੇ ਦੀ ਖੇਤੀ ("${userQueryTitle}") ਮਾਹਰ ਸਲਾਹ:${memoryNoticeGurmukhi}**\n\n1. **ਉੱਤਮ ਕਿਸਮਾਂ:** ਪੂਸਾ ਨਾਰੰਗੀ ਗੇਂਦਾ ਅਤੇ ਪੂਸਾ ਬਸੰਤੀ ਗੇਂਦਾ ਦੀ ਬਿਜਾਈ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ।\n2. **ਖਾਦ ਅਤੇ ਪਾਣੀ:** 1 ਏਕੜ ਵਿੱਚ 10 ਟਨ ਦੇਸੀ ਰੂੜੀ ਖਾਦ + 40kg ਨਾਈਟ੍ਰੋਜਨ ਅਤੇ 20kg ਫਾਸਫੋਰਸ ਪਾਓ। 7-10 ਦਿਨਾਂ ਬਾਅਦ ਪਾਣੀ ਦਿਓ।\n3. **ਕੀੜੇ ਅਤੇ ਬੀਮਾਰੀ:** ਸੁੰਡੀ ਅਤੇ ਝੁਲਸ ਰੋਗ ਤੋਂ ਬਚਾਅ ਲਈ ਮੈਂਕੋਜ਼ੇਬ (2g/L) ਅਤੇ ਨਿੰਮ ਦੇ ਤੇਲ ਦੀ ਸਪ੍ਰੇ ਕਰੋ।\n4. **ਮੁਨਾਫ਼ਾ:** 1 ਏਕੜ ਗੇਂਦੇ ਤੋਂ 80-100 ਕੁਇੰਟਲ ਫੁੱਲ ਪ੍ਰਾਪਤ ਹੁੰਦੇ ਹਨ।`;
    }

    // 3. WHEAT / KANAK / GEHU
    if (crop === 'WHEAT') {
      if (action === 'SPRAY_DISEASE') {
        if (lang === 'DEVANAGARI') {
          return `🌾 **गेहूं पीला रतुआ एवं स्प्रे ("${userQueryTitle}"):${memoryNoticeDevanagari}**\n\n1. **पीला रतुआ (Yellow Rust):** प्रोपिकोनाज़ोल 25% EC (टिल्ट / Tilt) 200 ml प्रति एकड़ 200L पानी में मिलाकर छिड़कें।\n2. **सावधानी:** बादलों वाले मौसम में अत्यधिक यूरिया का उपयोग न करें।\n3. **जैविक उपाय:** 5% नीम का अर्क या खट्टी छाछ (5L/200L पानी) छिड़कें।\n4. **FarmsKing Store:** असली टिल्ट दवा सीधे घर मंगाएं।`;
        }
        if (lang === 'ENGLISH') {
          return `🌾 **Wheat Yellow Rust & Spray Advisory ("${userQueryTitle}"):${memoryNoticeEnglish}**\n\n1. **Yellow Rust Remedy:** Spray Propiconazole 25% EC (Tilt) @ 200 ml per acre in 200 Liters of water.\n2. **Precaution:** Avoid excessive Urea application during cloudy humid weather.\n3. **Organic Spray:** Spray 5% Neem seed extract or sour buttermilk solution.\n4. **FarmsKing Store:** Order genuine Tilt 25% EC on FarmsKing Store.`;
        }
        return `🌾 **ਕਣਕ ਦੀ ਪੀਲੀ ਕੁੰਗੀ ਅਤੇ ਸਪ੍ਰੇ ("${userQueryTitle}"):${memoryNoticeGurmukhi}**\n\n1. **ਪੀਲੀ ਕੁੰਗੀ ਦਾ ਹੱਲ:** ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25% EC (ਟਿਲਟ / Tilt) 200 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।\n2. **ਸਾਵਧਾਨੀ:** ਬੱਦਲਵਾਈ ਵਾਲੇ ਮੌਸਮ ਵਿੱਚ ਜ਼ਿਆਦਾ ਯੂਰੀਆ ਪਾਉਣ ਤੋਂ ਪਰਹੇਜ਼ ਕਰੋ।\n3. **ਦੇਸੀ ਹੱਲ:** 5% ਨਿੰਮ ਦਾ ਅਰਕ ਜਾਂ ਖੱਟੀ ਲੱਸੀ (5L/200L ਪਾਣੀ) ਦਾ ਛਿੜਕਾਅ ਕਰੋ।\n4. **FarmsKing Store:** ਅਸਲੀ ਟਿਲਟ 25% EC FarmsKing Store ਤੋਂ ਮੰਗਵਾਓ।`;
      }
      if (action === 'WEED_CONTROL') {
        return `🌾 **ਕਣਕ ਵਿੱਚ ਗੁੱਲੀ ਡੰਡਾ ਅਤੇ ਨਦੀਨ ਨਾਸ਼ਕ ("${userQueryTitle}"):${memoryNoticeGurmukhi}**\n\n1. **ਗੁੱਲੀ ਡੰਡਾ ਸਪ੍ਰੇ:** ਪਹਿਲੇ ਪਾਣੀ ਤੋਂ 3-4 ਦਿਨ ਬਾਅਦ ਐਕਸੀਅਲ (Axial 400ml/ਏਕੜ) ਜਾਂ ਸ਼ਗਨ ਪ੍ਰਤੀ ਏਕੜ ਸਪ੍ਰੇ ਕਰੋ।\n2. **ਚੌੜੇ ਪੱਤੇ ਵਾਲੇ ਨਦੀਨ:** 2,4-D ਜਾਂ ਐਲਗ੍ਰਿਪ (Algrip) 8g ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n3. **FarmsKing Store:** ਅਸਲੀ ਨਦੀਨ ਨਾਸ਼ਕ FarmsKing Store ਤੋਂ ਮੰਗਵਾਓ।`;
      }
      return `🌾 **ਕਣਕ ਦੀ ਫਸਲ ਦੀ ਸੰਪੂਰਨ ਸਲਾਹ ("${userQueryTitle}"):${memoryNoticeGurmukhi}**\n\n1. **ਪਹਿਲਾ ਪਾਣੀ & ਯੂਰੀਆ:** ਬਿਜਾਈ ਤੋਂ 20-22 ਦਿਨਾਂ ਬਾਅਦ ਪਹਿਲਾ ਪਾਣੀ ਲਾਓ ਅਤੇ ਪ੍ਰਤੀ ਏਕੜ 45kg ਯੂਰੀਆ ਪਾਓ।\n2. **ਕੁੰਗੀ ਨਿਗਰਾਨੀ:** ਪੱਤਿਆਂ 'ਤੇ ਪੀਲਾ ਪਾਊਡਰ ਦਿਸਣ 'ਤੇ ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25% EC (200ml/ਏਕੜ) ਸਪ੍ਰੇ ਕਰੋ।\n3. **ਗ੍ਰੋਥ ਸਪ੍ਰੇ:** 1kg NPK (19:19:19) 200L ਪਾਣੀ 'ਚ ਛਿੜਕ ਕੇ ਵਧੇਰੇ ਫੁੱਟਾਰਾ ਲਵੋ।`;
    }

    // 4. PADDY / RICE / JHONA
    if (crop === 'PADDY') {
      if (lang === 'DEVANAGARI') {
        return `🌱 **धान का झुलसा/ब्लास्ट रोग ("${userQueryTitle}"):${memoryNoticeDevanagari}**\n\n1. **स्प्रे:** ट्राइसाइक्लाज़ोल 75% WP (Beam) 120g प्रति एकड़ 200L पानी में मिलाकर छिड़कें।\n2. **सावधानी:** पत्तों पर धब्बे दिखने पर यूरिया का उपयोग रोकें।\n3. **जैविक उपाय:** ट्राइकोडरमा 1 किग्रा प्रति एकड़ जैविक खाद के साथ प्रयोग करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌱 **Paddy Leaf Blast & Spray advisory ("${userQueryTitle}"):${memoryNoticeEnglish}**\n\n1. **Chemical Control:** Spray Tricyclazole 75% WP @ 120g per acre in 200L water.\n2. **Precaution:** Pause top-dressing Nitrogen fertilizers when spots appear.\n3. **Bio-Control:** Apply Trichoderma viride bio-fungicide @ 1 kg/acre.`;
      }
      return `🌱 **ਝੋਨੇ ਦਾ ਬਲਾਸਟ/ਝੁਲਸ ਰੋਗ ("${userQueryTitle}"):${memoryNoticeGurmukhi}**\n\n1. **ਸਪ੍ਰੇ:** ਟ੍ਰਾਈਸਾਈਕਲਾਜ਼ੋਲ 75% WP (ਬਾਨ / Beam) 120 ਗ੍ਰਾਮ ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n2. **ਸਾਵਧਾਨੀ:** ਦਾਗ਼ ਦਿਸਣ ਤੇ ਯੂਰੀਆ ਪਾਉਣਾ ਤੁਰੰਤ ਬੰਦ ਕਰੋ।\n3. **ਜੈਵਿਕ ਹੱਲ:** ਟ੍ਰਾਈਕੋਡਰਮਾ ਵਿਰਡੀ 1 ਕਿੱਲੋ ਪ੍ਰਤੀ ਏਕੜ ਰੂੜੀ ਦੀ ਖਾਦ ਨਾਲ ਮਿਲਾ ਕੇ ਪਾਓ।`;
    }

    // 5. COTTON / NARMA
    if (crop === 'COTTON') {
      return `☁️ **ਨਰਮੇ ਦੀ ਗੁਲਾਬੀ ਸੁੰਡੀ/ਚਿੱਟੀ ਮੱਖੀ ("${userQueryTitle}"):${memoryNoticeGurmukhi}**\n\n1. **ਸਪ੍ਰੇ:** ਇਮਾਮੈਕਟਿਨ ਬੈਂਜ਼ੋਏਟ 5% SG (100g) + ਸੇਫੀਨਾ (Sefina 400ml) ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n2. **ਟਰੈਪ:** 1 ਏਕੜ ਵਿੱਚ 5 ਫੇਰੋਮੋਨ ਟਰੈਪ ਲਗਾਓ।\n3. **ਦੇਸੀ ਹੱਲ:** ਨਿੰਮ ਦਾ ਤੇਲ (Neem Oil 500ml) ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ।`;
    }

    // 6. 20-30 DAY PLANT AGE ADVISORY
    if (crop === 'PLANT_AGE_20' || action === 'WATER') {
      return `🌱 **20-25 ਦਿਨਾਂ ਦੇ ਪੌਦਿਆਂ ਲਈ ਪਹਿਲਾ ਪਾਣੀ ਅਤੇ ਸਪ੍ਰੇ ("${userQueryTitle}"):${memoryNoticeGurmukhi}**\n\n1. **ਪਹਿਲਾ ਪਾਣੀ ਅਤੇ ਯੂਰੀਆ:** 20-22 ਦਿਨਾਂ ਦੀ ਫਸਲ/ਪੌਦਿਆਂ ਨੂੰ ਪਹਿਲਾ ਪਾਣੀ ਲਾਓ ਅਤੇ ਪ੍ਰਤੀ ਏਕੜ 45kg (1 ਗੱਟਾ) ਯੂਰੀਆ ਦਿਓ।\n2. **ਨਦੀਨ ਨਾਸ਼ਕ ਸਪ੍ਰੇ:** ਨਦੀਨਾਂ ਲਈ ਪਾਣੀ ਤੋਂ 3-4 ਦਿਨ ਬਾਅਦ ਸਿਫਾਰਿਸ਼ ਕੀਤੀ ਨਦੀਨ ਨਾਸ਼ਕ ਸਪ੍ਰੇ ਕਰੋ।\n3. **ਗ੍ਰੋਥ ਬੂਸਟਰ:** ਵਧੀਆ ਫੁੱਟਾਰੇ ਲਈ 1kg NPK (19:19:19) ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕੋ।\n4. **FarmsKing Store:** ਅਸਲੀ ਦਵਾਈਆਂ FarmsKing Store ਤੋਂ ਮੰਗਵਾਓ।`;
    }

    // 7. DAIRY / LIVESTOCK
    if (crop === 'DAIRY') {
      return `🥛 **ਪਸ਼ੂ ਪਾਲਣ ਅਤੇ ਦੁੱਧ ਵਧਾਉਣ ("${userQueryTitle}") ਦੀ ਮਾਹਰ ਸਲਾਹ:${memoryNoticeGurmukhi}**\n\n1. **ਖੁਰਾਕ & ਮਿਨਰਲ ਮਿਕਸਚਰ:** ਮੱਝ/ਗਾਂ ਨੂੰ ਰੋਜ਼ਾਨਾ 50g-100g ਚੰਗੀ ਕੁਆਲਿਟੀ ਦਾ Mineral Mixture ਖੁਰਾਕ ਵਿੱਚ ਦਿਓ।\n2. **ਹਰਾ ਚਾਰਾ:** ਹਰੇ ਚਾਰੇ ਨਾਲ 1kg ਤੂੜੀ ਅਤੇ ਸੁੱਕਾ ਚਾਰਾ ਜ਼ਰੂਰ ਮਿਲਾਓ।\n3. **ਪਾਣੀ:** ਪਸ਼ੂ ਨੂੰ ਦਿਨ ਵਿੱਚ 4-5 ਵਾਰ ਸਾਫ਼ ਅਤੇ ਤਾਜ਼ਾ ਪਾਣੀ ਪਿਲਾਓ।`;
    }

    // 8. FARMSKING APP & STORE
    if (crop === 'STORE') {
      return `🌾 **FarmsKing ਸੁਪਰ ਐਪ ਜਾਣਕਾਰੀ ("${userQueryTitle}"):**\n\n1. **ਖੇਤੀ ਦਵਾਈਆਂ & ਖਾਦਾਂ (AgriStore):** ਅਸਲੀ ਯੂਰੀਆ, DAP, NPK, ਅਤੇ PAU ਸਿਫਾਰਿਸ਼ ਕੀਤੀਆਂ ਸਪ੍ਰੇਆਂ ਪਿੰਡਾਂ 'ਚ ਡਿਲੀਵਰੀ।\n2. **ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਵ:** ਪੰਜਾਬ, ਹਰਿਆਣਾ ਦੇ ਰੋਜ਼ਾਨਾ ਸਰਕਾਰੀ ਭਾਵ।\n3. **ਸੈਟੇਲਾਈਟ ਖੇਤ ਦੇਖਭਾਲ:** ਸੈਟੇਲਾਈਟ ਰਾਹੀਂ ਆਪਣੇ ਖੇਤ ਦੀ ਹਰਿਆਲੀ ਅਤੇ ਪਾਣੀ ਦੀ ਜਾਂਚ ਕਰੋ।\n4. **ਦੁਕਾਨਦਾਰ & ਵਾਲਿਟ:** ਦੁਕਾਨਦਾਰ ਆਪਣਾ ਸਮਾਨ ਵੇਚ ਸਕਦੇ ਹਨ ਅਤੇ ਵਾਲਿਟ ਵਿੱਚ ਪੈਸੇ ਪ੍ਰਾਪਤ ਕਰ ਸਕਦੇ ਹਨ।`;
    }

    // 9. MANDI RATES
    if (crop === 'MANDI' || action === 'MANDI_RATE') {
      return `📊 **ਅੱਜ ਦੇ ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਵ ("${userQueryTitle}"):**\n\n• **ਕਣਕ:** ₹2,275 - ₹2,450 / ਕੁਇੰਟਲ\n• **ਝੋਨਾ (ਬਾਸਮਤੀ):** ₹3,800 - ₹4,250 / ਕੁਇੰਟਲ\n• **ਟਮਾਟਰ:** ₹1,400 - ₹1,800 / ਕੁਇੰਟਲ\n• **ਸਰ੍ਹੋਂ:** ₹5,400 - ₹5,850 / ਕੁਇੰਟਲ\n\n💡 *ਜ਼ਿਲ੍ਹੇਵਾਰ ਤਾਜ਼ਾ ਭਾਵ ਦੇਖਣ ਲਈ FarmsKing "Mandi Rates" ਟੈਬ ਦੀ ਵਰਤੋਂ ਕਰੋ।`;
    }

    // 10. WEATHER ADVISORY
    if (crop === 'WEATHER' || action === 'WEATHER_INFO') {
      return `🌤️ **ਮੌਸਮ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ("${userQueryTitle}"):**\n\n• 7 ਦਿਨਾਂ ਦਾ ਮੌਸਮ ਅਤੇ ਬਾਰਿਸ਼ ਦਾ ਪੂਰਵ-ਅਨੁਮਾਨ FarmsKing ਹੋਮ ਡੈਸ਼ਬੋਰਡ 'ਤੇ ਦੇਖੋ।\n• **ਸਪ੍ਰੇ ਦੀ ਸਲਾਹ:** ਤੇਜ਼ ਹਵਾ (15 km/h ਤੋਂ ਵੱਧ) ਜਾਂ 4 ਘੰਟਿਆਂ ਵਿੱਚ ਬਾਰਿਸ਼ ਦੀ ਸੰਭਾਵਨਾ ਹੋਵੇ ਤਾਂ ਸਪ੍ਰੇ ਨਾ ਕਰੋ।`;
    }

    // 11. GENERAL / DYNAMIC RESEARCH FALLBACK
    if (lang === 'DEVANAGARI') {
      return `🌾 **कृषि विशेषज्ञ सलाह — "${userQueryTitle}":${memoryNoticeDevanagari}**\n\n1. **फसल देखभाल:** आपके प्रश्न ("${userQueryTitle}") के अनुसार समय पर सिंचाई करें और अनुशंसित उर्वरक (यूरिया / DAP) दें।\n2. **रोग निगरानी:** खेत की 3 दिनों में जांच करें और शुरुआती लक्षण दिखने पर उपयुक्त फफूंदनाशक छिड़कें।\n3. **जैविक सुरक्षा:** 5% नीम अर्क या ट्राइकोडरमा का प्रयोग करें।\n4. **FarmsKing Store:** असली दवाएं और बीज सीधे FarmsKing ऐप से घर मंगाएं।`;
    }
    if (lang === 'ENGLISH') {
      return `🌾 **Agricultural Expert Advice — "${userQueryTitle}":${memoryNoticeEnglish}**\n\n1. **Crop Health:** Regarding your question ("${userQueryTitle}"), ensure timely irrigation and balanced NPK fertilizer top-dressing.\n2. **Disease & Pest Watch:** Monitor leaf surfaces every 3 days. Apply recommended fungicides/pesticides early.\n3. **Organic Protection:** Use 5% Neem seed extract or Trichoderma bio-control.\n4. **FarmsKing Store:** Order genuine sprays, seeds, and fertilizers with doorstep delivery on FarmsKing.`;
    }
    return `🌾 **ਖੇਤੀਬਾੜੀ ਮਾਹਰ ਸਲਾਹ — "${userQueryTitle}":${memoryNoticeGurmukhi}**\n\n1. **ਫਸਲ ਦੀ ਦੇਖਭਾਲ:** ਤੁਹਾਡੇ ਸਵਾਲ ("${userQueryTitle}") ਅਨੁਸਾਰ ਸਮੇਂ ਸਿਰ ਪਾਣੀ ਅਤੇ PAU ਸਿਫਾਰਿਸ਼ ਅਨੁਸਾਰ ਖਾਦਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ।\n2. **ਬੀਮਾਰੀ ਦੀ ਜਾਂਚ:** ਹਰ 3 ਦਿਨਾਂ ਬਾਅਦ ਪੱਤਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ। ਸ਼ੁਰੂਆਤ 'ਚ ਹੀ ਸਪ੍ਰੇ ਕਰੋ।\n3. **ਜੈਵਿਕ ਸੁਰੱਖਿਆ:** 5% ਨਿੰਮ ਦਾ ਅਰਕ ਜਾਂ ਟ੍ਰਾਈਕੋਡਰਮਾ ਦੀ ਵਰਤੋਂ ਕਰੋ।\n4. **FarmsKing Store:** ਅਸਲੀ ਦਵਾਈਆਂ ਤੇ ਖਾਦਾਂ FarmsKing ਐਪ ਤੋਂ ਘਰ ਬੈਠੇ ਮੰਗਵਾਓ।`;
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

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputQuery('');
    setIsLoading(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    // AI Processing with Active Context Memory & Exact Language Matching
    setTimeout(() => {
      let aiText = '';
      let category: 'FARMING' | 'NON_FARMING_BLOCKED' = 'FARMING';
      const lang = detectLanguage(query);

      if (isExplicitNonFarming(query)) {
        category = 'NON_FARMING_BLOCKED';
        if (lang === 'GURMUKHI') {
          aiText = '⚠️ **ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ ਸਵਾਲ / Sirf Kheti Sawal:**\n\nਮੈਂ FarmsKing ਦਾ AI ਖੇਤੀ ਡਾਕਟਰ 🌾 ਹਾਂ।\nਮੈਂ ਸਿਰਫ਼ ਫਸਲਾਂ, ਖਾਦਾਂ, ਸਪ੍ਰੇਆਂ, ਬੀਜਾਂ, ਮੌਸਮ ਅਤੇ ਮੰਡੀ ਭਾਵਾਂ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ।\n\nਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਫਸਲ ਜਾਂ ਖੇਤੀਬਾੜੀ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲ ਪੁੱਛੋ!';
        } else if (lang === 'DEVANAGARI') {
          aiText = '⚠️ **केवल कृषि संबंधी प्रश्न / Sirf Kheti Sawal:**\n\nमैं FarmsKing का AI खेती डॉक्टर 🌾 हूँ।\nमैं केवल फसलों, उर्वरकों, स्प्रे, बीजों, मौसम और मंडी भावों से संबंधित प्रश्नों के उत्तर दे सकता हूँ।\n\nकृपया अपनी फसल या खेती से जुड़ा सवाल पूछें!';
        } else {
          aiText = '⚠️ **Agricultural Questions Only:**\n\nI am FarmsKing\'s AI Kheti Doctor 🌾.\nI can only answer questions related to crops, fertilizers, sprays, seeds, weather, and mandi rates.\n\nPlease ask a question related to your crops or farming!';
        }
      } else {
        // Pass complete message history so AI remembers active crop/topic!
        aiText = generateAgriResponse(query, updatedMessages);
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
    <KeyboardAvoidingView
      style={[styles.container, isModal && styles.containerModal]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Banner */}
      {!isModal && (
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <View style={styles.botAvatarCircle}>
              <Ionicons name="sparkles" size={18} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>🤖 FarmsKing Kheti Mitra AI Doctor</Text>
              <Text style={styles.headerSubtitle}>100% Free Smart Assistant · Active Conversation Memory</Text>
            </View>
            <View style={styles.badgeFree}>
              <Text style={styles.badgeFreeText}>FREE 🌾</Text>
            </View>
          </View>
        </View>
      )}

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
                AI Doctor is analyzing farming database & history...
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
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    overflow: 'hidden',
    marginVertical: 10,
    minHeight: 440,
    maxHeight: 560,
  },
  containerModal: {
    flex: 1,
    borderRadius: 0,
    borderWidth: 0,
    marginVertical: 0,
    minHeight: '100%',
    maxHeight: undefined,
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
