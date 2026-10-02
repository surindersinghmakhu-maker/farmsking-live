import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
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
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { getDefaultApiUrl } from '../constants/config';
import { useFarmerPlan } from '@/src/hooks/useFarmerPlan';
import { useAuth } from '@/src/store/auth-context';
import { FarmerPlanUpgradeModal } from '@/src/components/FarmerPlanUpgradeModal';

const googleAiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
const googleAi = new GoogleGenAI({ apiKey: googleAiKey });

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
  { icon: "🌾", label: "What is the average yield of Wheat per acre?" },
  { icon: "🌾", label: "Which month is best for Paddy sowing?" },
  { icon: "🌼", label: "How to prevent Marigold leaf drying disease?" },
  { icon: "📊", label: "Today's Live Mandi Rates" },
];

export type LanguageCode = 'GURMUKHI' | 'DEVANAGARI' | 'ENGLISH';

export type CropTopic =
  | 'GENDA'
  | 'CHILLI'
  | 'ONION'
  | 'GOBHI'
  | 'GARLIC'
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
  | 'MONTH_SEASON'
  | 'YIELD_PROFIT'
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
  const { width: windowWidth } = useWindowDimensions();
  const isMobile = windowWidth < 768;
  const { user } = useAuth();
  const { plan, isExpired, hasActiveSoftwarePlan } = useFarmerPlan();
  
  const isPaidUser = React.useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toUpperCase();
    if (['SUPER_ADMIN', 'ADMIN', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'SUPERVISOR', 'BUSINESS_PARTNER'].includes(role)) {
      return true;
    }
    if (hasActiveSoftwarePlan) return true;
    if (plan && plan.toUpperCase() !== 'FREE' && !isExpired) return true;
    const userPlan = ((user as any)?.plan || (user as any)?.activePlan || (user as any)?.softwarePlan || (user as any)?.membership || '').toUpperCase();
    if (userPlan && userPlan !== 'FREE') return true;
    if (typeof window !== 'undefined' && window.localStorage && localStorage.getItem('farmsking_vip_plan_active') === 'true') {
      return true;
    }
    return false;
  }, [user, plan, isExpired, hasActiveSoftwarePlan]);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const [askedCount, setAskedCount] = useState<number>(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = localStorage.getItem('farmsking_ai_free_asked_count');
        return val ? parseInt(val, 10) || 0 : 0;
      }
    } catch {}
    return 0;
  });

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'AI',
      text: "🌾 **Farmsking Kisan AI Doctor (National Farmers Expert)**\n\nHello / Namaste! I am the AI Agriculture Doctor for farmers across India.\n\nAsk your question about any crop, disease, fertilizer (Urea/DAP), spray, weather, or mandi prices — you will get a short & direct answer instantly!",
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
      'dasso', 'daso', 'mera', 'meri', 'de', 'da', 'di', 'khet', 'khetan', 'laayi',
      'layi', 'pind', 'kisaan', 'paude', 'kra', 'paani', 'din', 'gende', 'genda',
      'ehnu', 'ehda', 'kadon', 'kado', 'laiye', 'kera', 'krie', 'kini', 'pava', 'kehde',
      'mahine', 'kiti', 'jandi', 'lagai', 'lagaye', 'kinna', 'kinni', 'jhaad', 'jhad', 'dindi', 'mircha', 'mirch'
    ];
    const hindiWords = [
      'krta', 'karta', 'krti', 'karti', 'hu', 'hoon', 'hai', 'hain', 'kaise',
      'kya', 'kaun', 'chahiye', 'batao', 'karein', 'kare', 'ki', 'ke', 'ko',
      'mein', 'se', 'par', 'karte', 'hoge', 'karo', 'dijiye', 'paudhe', 'isme',
      'kaunse', 'mahine', 'kab', 'kitna', 'kitni'
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

  // Extract crop entity from current text
  const extractCropTopic = (text: string): CropTopic | null => {
    const q = text.toLowerCase();
    if (q.includes('mirch') || q.includes('mircha') || q.includes('mirchan') || q.includes('chilli') || q.includes('chili') || q.includes('chillies') || q.includes('ਮਿਰਚ') || q.includes('ਮਿਰਚਾਂ') || q.includes('ਮਿਰਚਾ') || q.includes('मिर्च')) return 'CHILLI';
    if (q.includes('pyaaz') || q.includes('piaz') || q.includes('gandha') || q.includes('onion') || q.includes('ਪਿਆਜ਼') || q.includes('ਗੰਢਾ') || q.includes('प्याज')) return 'ONION';
    if (q.includes('lassan') || q.includes('lesan') || q.includes('garlic') || q.includes('ਲਸਣ') || q.includes('लहसुन')) return 'GARLIC';
    if (q.includes('gobhi') || q.includes('cauliflower') || q.includes('cabbage') || q.includes('ਗੋਭੀ') || q.includes('गोभी')) return 'GOBHI';
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

  // Find active crop context from recent conversation history ONLY IF continuation pronoun is used
  const getContextCrop = (query: string, history: ChatMessage[]): { crop: CropTopic; fromMemory: boolean } => {
    const directCrop = extractCropTopic(query);
    if (directCrop) {
      return { crop: directCrop, fromMemory: false };
    }

    const qLower = query.toLowerCase();
    const hasContinuationWord =
      qLower.includes('eh') ||
      qLower.includes('ehda') ||
      qLower.includes('ehnu') ||
      qLower.includes('isda') ||
      qLower.includes('isdi') ||
      qLower.includes('isnu') ||
      qLower.includes('isvich') ||
      qLower.includes('ਇਹ') ||
      qLower.includes('ਇਹਦਾ') ||
      qLower.includes('ਇਹਨੂੰ') ||
      qLower.includes('ਇਸਦਾ') ||
      qLower.includes('ਇਸਦੀ');

    // ONLY inherit previous crop from history IF the user used explicit continuation pronouns!
    if (hasContinuationWord) {
      for (let i = history.length - 1; i >= 0; i--) {
        const topic = extractCropTopic(history[i].text);
        if (topic && topic !== 'STORE' && topic !== 'MANDI' && topic !== 'WEATHER') {
          return { crop: topic, fromMemory: true };
        }
      }
    }

    return { crop: 'GENERAL', fromMemory: false };
  };

  // Extract action/concern from query
  const extractActionTopic = (query: string): ActionTopic => {
    const q = query.toLowerCase();

    // Priority 1: Month / Season / Timing / Sowing questions
    if (
      q.includes('mahine') ||
      q.includes('maheene') ||
      q.includes('month') ||
      q.includes('months') ||
      q.includes('kab') ||
      q.includes('kado') ||
      q.includes('kadon') ||
      q.includes('kad') ||
      q.includes('kehde') ||
      q.includes('kede') ||
      q.includes('kaunse') ||
      q.includes('samay') ||
      q.includes('lagai') ||
      q.includes('lagaye') ||
      q.includes('lagaee') ||
      q.includes('bijiye') ||
      q.includes('bijai') ||
      q.includes('bijaai') ||
      q.includes('bije') ||
      q.includes('sowing') ||
      q.includes('ਸਮਾਂ') ||
      q.includes('ਮਹੀਨੇ') ||
      q.includes('ਮਹੀਨਾ') ||
      q.includes('ਕਦੋਂ') ||
      q.includes('ਕਦ') ||
      q.includes('ਬਿਜਾਈ') ||
      q.includes('ਮਹੀਨਿਆਂ') ||
      q.includes('महीने')
    ) {
      return 'MONTH_SEASON';
    }

    // Priority 2: Yield / Profit / Production / Jhaad questions
    if (
      q.includes('jhad') ||
      q.includes('jhaad') ||
      q.includes('jhar') ||
      q.includes('jhaar') ||
      q.includes('jhadu') ||
      q.includes('yield') ||
      q.includes('production') ||
      q.includes('output') ||
      q.includes('kamai') ||
      q.includes('profit') ||
      q.includes('quintel') ||
      q.includes('quintal') ||
      q.includes('kuintal') ||
      q.includes('ਕੁਇੰਟਲ') ||
      q.includes('ਝਾੜ') ||
      q.includes('ਕਮਾਈ') ||
      q.includes('ਮੁਨਾਫ਼ਾ') ||
      q.includes('झाड़') ||
      q.includes('उपज')
    ) {
      return 'YIELD_PROFIT';
    }

    // Priority 3: Water / Irrigation questions
    if (q.includes('pani') || q.includes('paani') || q.includes('water') || q.includes('irrigation') || q.includes('ਪਾਣੀ') || q.includes('ਸਿੰਚਾਈ') || q.includes('पानी')) {
      return 'WATER';
    }

    // Priority 4: Spray / Disease / Pest / Leaf Drying / Cure questions
    if (
      q.includes('spray') ||
      q.includes('dawai') ||
      q.includes('dawaii') ||
      q.includes('dawa') ||
      q.includes('sundi') ||
      q.includes('keeda') ||
      q.includes('beemari') ||
      q.includes('bimari') ||
      q.includes('ilaaj') ||
      q.includes('ilaj') ||
      q.includes('sukk') ||
      q.includes('sukke') ||
      q.includes('sukkde') ||
      q.includes('sukh') ||
      q.includes('sukka') ||
      q.includes('sukki') ||
      q.includes('pila') ||
      q.includes('peela') ||
      q.includes('patte') ||
      q.includes('patta') ||
      q.includes('leaves') ||
      q.includes('leaf') ||
      q.includes('blight') ||
      q.includes('wilt') ||
      q.includes('ਸਪ੍ਰੇ') ||
      q.includes('ਦਵਾਈ') ||
      q.includes('ਬੀਮਾਰੀ') ||
      q.includes('ਇਲਾਜ') ||
      q.includes('ਕੀੜਾ') ||
      q.includes('ਸੁੱਕ') ||
      q.includes('ਪੱਤੇ') ||
      q.includes('ਰੋਗ') ||
      q.includes('कीड़ा') ||
      q.includes('इलाज')
    ) {
      return 'SPRAY_DISEASE';
    }

    // Priority 5: Fertilizer questions
    if (q.includes('khad') || q.includes('urea') || q.includes('dap') || q.includes('npk') || q.includes('kini') || q.includes('dosage') || q.includes('ਖਾਦ') || q.includes('ਯੂਰੀਆ') || q.includes('खाद')) {
      return 'FERTILIZER_DOSAGE';
    }

    // Priority 6: Growth / Tillering
    if (q.includes('growth') || q.includes('phutara') || q.includes('futara') || q.includes('vadhara') || q.includes('ਫੁੱਟਾਰਾ') || q.includes('ਗ੍ਰੋਥ') || q.includes('फुटाव')) {
      return 'GROWTH_TILLERING';
    }

    // Priority 7: Weed control
    if (q.includes('nadin') || q.includes('gulli') || q.includes('danda') || q.includes('weed') || q.includes('ghas') || q.includes('ਨਦੀਨ') || q.includes('ਗੁੱਲੀ') || q.includes('खरपतवार')) {
      return 'WEED_CONTROL';
    }

    // Priority 8: Seeds & Sowing
    if (q.includes('beej') || q.includes('sowing') || q.includes('bijai') || q.includes('variety') || q.includes('ਕਿਸਮ') || q.includes('ਬੀਜ') || q.includes('ਬਿਜਾਈ') || q.includes('बीज')) {
      return 'SEED_SOWING';
    }

    // Priority 9: Mandi Rates
    if (q.includes('mandi') || q.includes('rate') || q.includes('bhav') || q.includes('price') || q.includes('ਮੰਡੀ') || q.includes('ਭਾਵ')) {
      return 'MANDI_RATE';
    }

    // Priority 10: Weather
    if (q.includes('weather') || q.includes('rain') || q.includes('mausam') || q.includes('ਮੌਸਮ') || q.includes('मौसम')) {
      return 'WEATHER_INFO';
    }

    return 'GENERAL_CARE';
  };

  const generateAgriResponse = (query: string, history: ChatMessage[]): string => {
    const q = query.toLowerCase().trim();
    const lang = detectLanguage(query);
    const { crop } = getContextCrop(query, history);
    const action = extractActionTopic(query);

    // 1. Language Request Command
    if ((q.includes('punjabi') || q.includes('ਪੰਜਾਬੀ')) && (q.includes('language') || q.includes('gall') || q.includes('use') || q.includes('speak') || q.includes('vich') || q.includes('ch'))) {
      return `🌾 **ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ!**\n\nਜੀ ਹਾਂ, ਹੁਣ ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਪੂਰੀ ਤਰ੍ਹਾਂ ਪੰਜਾਬੀ (ਗੁਰਮੁਖੀ) ਵਿੱਚ ਗੱਲਬਾਤ ਕਰਾਂਗਾ। ਤੁਸੀਂ ਆਪਣੀ ਫਸਲ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ!`;
    }

    // 2. MARIGOLD / GENDA FLOWER FARMING
    if (crop === 'GENDA') {
      if (action === 'MONTH_SEASON') {
        if (lang === 'DEVANAGARI') {
          return `🌼 **गेंदा बुआई के महीने:**\n\n1. **बरसाती गेंदा:** जून - जुलाई में नर्सरी लगाएं (फूल: सितंबर - अक्टूबर)।\n2. **सर्दी का गेंदा:** सितंबर - अक्टूबर में नर्सरी लगाएं (फूल: दिसंबर - फरवरी)।\n3. **गर्मी का गेंदा:** जनवरी - फरवरी में नर्सरी लगाएं (फूल: अप्रैल - मई)।`;
        }
        if (lang === 'ENGLISH') {
          return `🌼 **Marigold Sowing Months & Seasons:**\n\n1. **Rainy Crop:** Sow nursery in June - July (Harvest: Sept - Oct).\n2. **Winter Crop:** Sow nursery in Sept - Oct (Harvest: Dec - Feb).\n3. **Summer Crop:** Sow nursery in Jan - Feb (Harvest: April - May).`;
        }
        return `🌼 **ਗੇਂਦੇ ਦੀ ਬਿਜਾਈ ਦੇ ਮਹੀਨੇ (Sowing Months):**\n\n1. **ਬਰਸਾਤੀ ਗੇਂਦਾ:** ਜੂਨ - ਜੁਲਾਈ ਵਿੱਚ ਪਨੀਰੀ ਲਾਓ (ਫੁੱਲ: ਸਤੰਬਰ - ਅਕਤੂਬਰ)।\n2. **ਸਰਦੀਆਂ ਦਾ ਗੇਂਦਾ:** ਸਤੰਬਰ - ਅਕਤੂਬਰ ਵਿੱਚ ਪਨੀਰੀ ਲਾਓ (ਫੁੱਲ: ਦਸੰਬਰ - ਫਰਵਰੀ)।\n3. **ਗਰਮੀਆਂ ਦਾ ਗੇਂਦਾ:** ਜਨਵਰੀ - ਫਰਵਰੀ ਵਿੱਚ ਪਨੀਰੀ ਲਾਓ (ਫੁੱਲ: ਅਪ੍ਰੈਲ - ਮਈ)।`;
      }
      if (action === 'YIELD_PROFIT') {
        return `🌼 **ਗੇਂਦੇ ਦੀ ਫਸਲ ਤੋਂ ਝਾੜ:**\n\n1. 1 ਏਕੜ ਗੇਂਦੇ ਤੋਂ 80 ਤੋਂ 100 ਕੁਇੰਟਲ ਤਾਜ਼ੇ ਫੁੱਲ ਪ੍ਰਾਪਤ ਹੁੰਦੇ ਹਨ।`;
      }
      if (action === 'WATER') {
        return `🌼 **ਗੇਂਦੇ ਦੀ ਫਸਲ — ਪਾਣੀ ਦੀ ਸਲਾਹ:**\n\n1. **ਪਹਿਲਾ ਪਾਣੀ:** ਪੌਦੇ ਲਾਉਣ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ ਪਹਿਲਾ ਹਲਕਾ ਪਾਣੀ ਲਾਓ।\n2. **ਸਮਾਂ:** ਸ਼ੁਰੂਆਤੀ 20 ਦਿਨਾਂ ਵਿੱਚ ਹਰ 7-8 ਦਿਨਾਂ ਬਾਅਦ ਪਾਣੀ ਦਿਓ।`;
      }
      if (action === 'SPRAY_DISEASE' || q.includes('sukk') || q.includes('sukh') || q.includes('patte') || q.includes('ilaj') || q.includes('ilaaj')) {
        if (lang === 'DEVANAGARI') {
          return `🌼 **गेंदे के पत्ते सूखने एवं बीमारी का इलाज:**\n\n1. **लीफ ब्लाइट (पत्ते सूखना):** मैन्कोजेब (Mancozeb 75% WP) 2 ग्राम प्रति लीटर पानी (400g/एकड़) में मिलाकर छिड़कें।\n2. **जड़ गलन/सूखा (Wilt):** बाविस्टिन (Bavistin) 1.5g/L पानी मिलाकर पौधों की जड़ों में दें।`;
        }
        return `🌼 **ਗੇਂਦੇ ਦੇ ਪੱਤੇ ਸੁੱਕਣ ਅਤੇ ਝੁਲਸ ਰੋਗ ਦਾ ਇਲਾਜ:**\n\n1. **ਝੁਲਸ ਰੋਗ / ਪੱਤੇ ਸੁੱਕਣਾ (Leaf Blight):** ਪੱਤੇ ਸੁੱਕਣ ਜਾਂ ਕਾਲੇ ਦਾਗ਼ ਹੋਣ 'ਤੇ **ਮੈਂਕੋਜ਼ੇਬ (Mancozeb 75% WP)** 2 ਗ੍ਰਾਮ ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ (400g ਪ੍ਰਤੀ ਏਕੜ) ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।\n2. **ਜੜ੍ਹ ਗਲਣ / ਸੁਕਾਅ (Wilt/Root Rot):** ਜੇਕਰ ਪੌਦਾ ਜੜ੍ਹ ਤੋਂ ਸੁੱਕ ਰਿਹਾ ਹੈ, ਤਾਂ **ਕਾਰਬੈਂਡਾਜ਼ਿਮ (Bavistin)** 1.5g ਪ੍ਰਤੀ ਲੀਟਰ ਪਾਣੀ ਨਾਲ ਜੜ੍ਹਾਂ ਨੂੰ ਭਿਓ ਦਿਓ।\n3. **ਕੀੜਿਆਂ ਦਾ ਛਿੜਕਾਅ:** ਜੇਕਰ ਤੇਲਾ/ਮੱਖੀ ਹੋਵੇ ਤਾਂ ਥਿਆਮੈਥੋਕਸਾਮ (Actara) 40g ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕੋ।`;
      }
      return `🌼 **ਗੇਂਦੇ ਦੀ ਖੇਤੀ (Marigold Farming):**\n\n1. **ਬਿਜਾਈ ਦੇ ਮਹੀਨੇ:** ਜੂਨ-ਜੁਲਾਈ (ਬਰਸਾਤੀ) ਅਤੇ ਸਤੰਬਰ-ਅਕਤੂਬਰ (ਸਰਦੀਆਂ)।\n2. **ਉੱਤਮ ਕਿਸਮਾਂ:** ਪੂਸਾ ਨਾਰੰਗੀ ਅਤੇ ਪੂਸਾ ਬਸੰਤੀ ਗੇਂਦਾ।`;
    }

    // 3. CHILLI / MIRCH FARMING
    if (crop === 'CHILLI') {
      if (action === 'SPRAY_DISEASE' || q.includes('bimari') || q.includes('beemari') || q.includes('ilaj') || q.includes('ilaaj') || q.includes('sukk') || q.includes('patte') || q.includes('curling') || q.includes('churda')) {
        return `🌶️ **ਮਿਰਚਾਂ ਦੀਆਂ ਆਮ ਬੀਮਾਰੀਆਂ ਅਤੇ ਇਲਾਜ (Chilli Diseases & Spray):**\n\n1. **ਚੂੜਾ-ਮੂੜਾ / ਪੱਤਾ ਮਰੋੜ ਰੋਗ (Leaf Curl Virus):** ਚਿੱਟੀ ਮੱਖੀ ਅਤੇ ਥ੍ਰਿਪਸ ਰਸ ਚੂਸਦੇ ਹਨ। ਇਸ ਲਈ **ਸੇਫੀਨਾ (Sefina)** 400ml/ਏਕੜ ਜਾਂ **ਇਮੀਡਾਕਲੋਪ੍ਰਿਡ (Confidor)** 0.5ml/L ਪਾਣੀ ਸਪ੍ਰੇ ਕਰੋ।\n2. **ਫ਼ਲ ਗਲਣ / ਡਾਈ-ਬੈਕ (Fruit Rot / Anthracnose):** ਫ਼ਲ ਗਲਣ 'ਤੇ **ਟੈਬੂਕੋਨਾਜ਼ੋਲ (Folicur)** 1ml/L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n3. **ਜੜ੍ਹ ਗਲਣ / ਉਖੜਾ ਰੋਗ (Wilt):** **ਟ੍ਰਾਈਕੋਡਰਮਾ (Trichoderma)** 2kg/ਏਕੜ ਰੂੜੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਖੇਤ ਵਿੱਚ ਦਿਓ।`;
      }
      if (action === 'MONTH_SEASON') {
        return `🌶️ **ਮਿਰਚਾਂ ਦੀ ਬਿਜਾਈ ਅਤੇ ਲਵਾਈ ਦੇ ਮਹੀਨੇ:**\n\n1. **ਪਨੀਰੀ ਬੀਜਣਾ:** ਅਕਤੂਬਰ - ਨਵੰਬਰ (ਸਰਦੀਆਂ) ਅਤੇ ਅਪ੍ਰੈਲ - ਮਈ (ਗਰਮੀਆਂ)।\n2. **ਖੇਤ ਵਿੱਚ ਲਵਾਈ:** ਫਰਵਰੀ - ਮਾਰਚ (ਬਸੰਤ) ਅਤੇ ਜੂਨ - ਜੁਲਾਈ (ਬਰਸਾਤ)।`;
      }
      if (action === 'YIELD_PROFIT') {
        return `🌶️ **ਮਿਰਚਾਂ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ਝਾੜ:**\n\n1. **ਹਰੀਆਂ ਮਿਰਚਾਂ:** 80 ਤੋਂ 100 ਕੁਇੰਟਲ ਪ੍ਰਤੀ ਏਕੜ।\n2. **ਸੁੱਕੀਆਂ ਲਾਲ ਮਿਰਚਾਂ:** 15 ਤੋਂ 18 ਕੁਇੰਟਲ ਪ੍ਰਤੀ ਏਕੜ।`;
      }
      return `🌶️ **ਮਿਰਚਾਂ ਦੀ ਖੇਤੀ ਸਲਾਹ (Chilli Advisory):**\n\n1. **ਆਮ ਬੀਮਾਰੀਆਂ:** ਪੱਤਾ ਮਰੋੜ (ਚੂੜਾ-ਮੂੜਾ), ਫ਼ਲ ਗਲਣ ਅਤੇ ਥ੍ਰਿਪਸ।\n2. **ਸਪ੍ਰੇ:** ਪੱਤਾ ਮਰੋੜ ਲਈ ਸੇਫੀਨਾ (400ml/ਏਕੜ) ਅਤੇ ਫ਼ਲ ਗਲਣ ਲਈ ਫੋਲੀਕੁਰ (Folicur) ਸਪ੍ਰੇ ਕਰੋ।`;
    }

    // 3. WHEAT / KANAK / GEHU
    if (crop === 'WHEAT') {
      if (action === 'YIELD_PROFIT') {
        if (lang === 'DEVANAGARI') {
          return `🌾 **गेहूं का प्रति एकड़ उत्पादन (Yield):**\n\n1. **औसत पैदावार:** 1 एकड़ से 22 से 26 क्विंटल गेहूं की पैदावार होती है।`;
        }
        if (lang === 'ENGLISH') {
          return `🌾 **Wheat Yield per Acre:**\n\n1. **Average Yield:** 22 to 26 Quintals per acre with timely sowing and proper management.`;
        }
        return `🌾 **ਕਣਕ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ਝਾੜ (Wheat Yield):**\n\n1. **ਔਸਤਨ ਝਾੜ:** 1 ਏਕੜ ਤੋਂ 22 ਤੋਂ 26 ਕੁਇੰਟਲ ਕਣਕ ਦਾ ਝਾੜ ਮਿਲਦਾ ਹੈ (ਚੰਗੀ ਦੇਖਭਾਲ ਅਤੇ ਸਮੇਂ ਸਿਰ ਬਿਜਾਈ ਨਾਲ)।`;
      }
      if (action === 'MONTH_SEASON') {
        if (lang === 'DEVANAGARI') {
          return `🌾 **गेहूं की बुआई का समय:**\n\n1. **सबसे उत्तम समय:** 25 अक्टूबर से 15 नवंबर।\n2. **पछेती बुआई:** 16 नवंबर से 10 दिसंबर।`;
        }
        if (lang === 'ENGLISH') {
          return `🌾 **Wheat Sowing Period:**\n\n1. **Optimum Time:** 25th Oct to 15th Nov.\n2. **Late Sowing:** 16th Nov to 10th Dec.`;
        }
        return `🌾 **ਕਣਕ ਦੀ ਬਿਜਾਈ ਦਾ ਸਮਾਂ:**\n\n1. **ਸਭ ਤੋਂ ਉੱਤਮ ਸਮਾਂ:** 25 ਅਕਤੂਬਰ ਤੋਂ 15 ਨਵੰਬਰ।\n2. **ਪਛੇਤੀ ਬਿਜਾਈ (Late Sowing):** 16 ਨਵੰਬਰ ਤੋਂ 10 ਦਸੰਬਰ।`;
      }
      if (action === 'WATER') {
        return `🌾 **ਕਣਕ ਨੂੰ ਪਾਣੀ (CRI Stage):**\n\n1. ਬਿਜਾਈ ਤੋਂ 20-22 ਦਿਨਾਂ ਬਾਅਦ ਪਹਿਲਾ ਪਾਣੀ ਲਾਓ।\n2. ਪਾਣੀ ਹਲਕਾ ਲਾਓ ਅਤੇ ਪਾਣੀ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ ਪ੍ਰਤੀ ਏਕੜ 45kg (1 ਗੱਟਾ) ਯੂਰੀਆ ਪਾਓ।`;
      }
      if (action === 'SPRAY_DISEASE') {
        return `🌾 **ਕਣਕ ਦੀ ਪੀਲੀ ਕੁੰਗੀ ਦਾ ਇਲਾਜ:**\n\n1. ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25% EC (ਟਿਲਟ / Tilt) 200 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕੋ।`;
      }
      if (action === 'WEED_CONTROL') {
        return `🌾 **ਕਣਕ ਵਿੱਚ ਗੁੱਲੀ ਡੰਡਾ / ਨਦੀਨ:**\n\n1. ਪਹਿਲੇ ਪਾਣੀ ਤੋਂ 3-4 ਦਿਨ ਬਾਅਦ ਐਕਸੀਅਲ (Axial 400ml/ਏਕੜ) ਸਪ੍ਰੇ ਕਰੋ।`;
      }
      return `🌾 **ਕਣਕ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ਝਾੜ:**\n\n1. 1 ਏਕੜ ਤੋਂ 22 ਤੋਂ 26 ਕੁਇੰਟਲ ਝਾੜ ਮਿਲਦਾ ਹੈ।`;
    }

    // 4. PADDY / RICE / JHONA
    if (crop === 'PADDY') {
      if (action === 'YIELD_PROFIT') {
        return `🌱 **ਝੋਨੇ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ਝਾੜ:**\n\n1. **ਪਰਮਲ ਝੋਨਾ:** 30 ਤੋਂ 35 ਕੁਇੰਟਲ ਪ੍ਰਤੀ ਏਕੜ।\n2. **ਬਾਸਮਤੀ:** 20 ਤੋਂ 25 ਕੁਇੰਟਲ ਪ੍ਰਤੀ ਏਕੜ।`;
      }
      if (action === 'MONTH_SEASON') {
        return `🌱 **ਝੋਨੇ ਦੀ ਲਵਾਈ ਦੇ ਮਹੀਨੇ (PAU ਸਿਫਾਰਿਸ਼):**\n\n1. **ਪਨੀਰੀ ਬੀਜਣਾ:** 15 ਮਈ ਤੋਂ 30 ਮਈ।\n2. **ਖੇਤ ਵਿੱਚ ਲਵਾਈ:** 15 ਜੂਨ ਤੋਂ 30 ਜੂਨ।`;
      }
      return `🌱 **ਝੋਨੇ ਦਾ ਬਲਾਸਟ/ਝੁਲਸ ਰੋਗ:**\n\n1. **ਸਪ੍ਰੇ:** ਟ੍ਰਾਈਸਾਈਕਲਾਜ਼ੋਲ 75% WP (Beam) 120g ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।`;
    }

    // 5. COTTON / NARMA
    if (crop === 'COTTON') {
      if (action === 'YIELD_PROFIT') {
        return `☁️ **ਨਰਮੇ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ਝਾੜ:**\n\n1. **ਔਸਤਨ ਝਾੜ:** 1 ਏਕੜ ਤੋਂ 10 ਤੋਂ 14 ਕੁਇੰਟਲ ਨਰਮਾ ਮਿਲਦਾ ਹੈ।`;
      }
      if (action === 'MONTH_SEASON') {
        return `☁️ **ਨਰਮੇ ਦੀ ਬਿਜਾਈ ਦੇ ਮਹੀਨੇ:**\n\n1. **ਸਮਾਂ:** 15 ਅਪ੍ਰੈਲ ਤੋਂ 15 ਮਈ।`;
      }
      return `☁️ **ਨਰਮੇ ਦੀ ਗੁਲਾਬੀ ਸੁੰਡੀ/ਚਿੱਟੀ ਮੱਖੀ:**\n\n1. **ਸਪ੍ਰੇ:** ਇਮਾਮੈਕਟਿਨ ਬੈਂਜ਼ੋਏਟ 5% SG (100g) + ਸੇਫੀਨਾ (400ml) ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।`;
    }

    // 6. MUSTARD / SARSON
    if (crop === 'MUSTARD') {
      if (action === 'YIELD_PROFIT') {
        return `🌼 **ਸਰ੍ਹੋਂ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ਝਾੜ:**\n\n1. **ਔਸਤਨ ਝਾੜ:** 1 ਏਕੜ ਤੋਂ 8 ਤੋਂ 11 ਕੁਇੰਟਲ ਸਰ੍ਹੋਂ ਮਿਲਦੀ ਹੈ।`;
      }
      if (action === 'MONTH_SEASON') {
        return `🌼 **ਸਰ੍ਹੋਂ ਦੀ ਬਿਜਾਈ ਦੇ ਮਹੀਨੇ:**\n\n1. **ਸਮਾਂ:** 25 ਸਤੰਬਰ ਤੋਂ 20 ਅਕਤੂਬਰ।`;
      }
      return `🌼 **ਸਰ੍ਹੋਂ ਦੀ ਫਸਲ ਤੇ ਤੇਲਾ/ਚੇਪਾ:**\n\n1. **ਸਪ੍ਰੇ:** ਥਿਆਮੈਥੋਕਸਾਮ (Actara) 40g ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।`;
    }

    // 7. POTATO / ALOO
    if (crop === 'POTATO') {
      if (action === 'YIELD_PROFIT') {
        return `🥔 **ਆਲੂਆਂ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ਝਾੜ:**\n\n1. **ਔਸਤਨ ਝਾੜ:** 1 ਏਕੜ ਤੋਂ 120 ਤੋਂ 150 ਕੁਇੰਟਲ ਆਲੂ ਮਿਲਦੇ ਹਨ।`;
      }
      return `🥔 **ਆਲੂਆਂ ਦੇ ਝੁਲਸ ਰੋਗ ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਐਕਰੋਬੈਟ (400g) + ਮੈਂਕੋਜ਼ੇਬ (600g) 200L ਪਾਣੀ ਵਿੱਚ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕੋ।`;
    }

    // 8. 20-30 DAY PLANT AGE ADVISORY
    if (crop === 'PLANT_AGE_20' || action === 'WATER') {
      return `🌱 **20-25 ਦਿਨਾਂ ਦੇ ਪੌਦਿਆਂ ਲਈ ਪਾਣੀ & ਯੂਰੀਆ:**\n\n1. **ਪਹਿਲਾ ਪਾਣੀ:** 20-22 ਦਿਨਾਂ ਦੀ ਫਸਲ ਨੂੰ ਹਲਕਾ ਪਾਣੀ ਲਾਓ ਅਤੇ ਪ੍ਰਤੀ ਏਕੜ 45kg ਯੂਰੀਆ ਦਿਓ।`;
    }

    // 9. DAIRY / LIVESTOCK
    if (crop === 'DAIRY') {
      return `🥛 **ਪਸ਼ੂ ਦਾ ਦੁੱਧ ਵਧਾਉਣ ਦੀ ਸਲਾਹ:**\n\n1. **ਮਿਨਰਲ ਮਿਕਸਚਰ:** ਮੱਝ/ਗਾਂ ਨੂੰ ਰੋਜ਼ਾਨਾ 50g-100g ਮਿਨਰਲ ਮਿਕਸਚਰ ਖੁਰਾਕ ਵਿੱਚ ਦਿਓ।`;
    }

    // 10. MANDI RATES
    if (crop === 'MANDI' || action === 'MANDI_RATE') {
      return `📊 **ਅੱਜ ਦੇ ਮੰਡੀ ਭਾਵ:**\n\n• **ਕਣਕ:** ₹2,275 - ₹2,450 / ਕੁਇੰਟਲ\n• **ਝੋਨਾ (ਬਾਸਮਤੀ):** ₹3,800 - ₹4,250 / ਕੁਇੰਟਲ\n• **ਟਮਾਟਰ:** ₹1,400 - ₹1,800 / ਕੁਇੰਟਲ\n• **ਸਰ੍ਹੋਂ:** ₹5,400 - ₹5,850 / ਕੁਇੰਟਲ`;
    }

    // 11. WEATHER ADVISORY
    if (crop === 'WEATHER' || action === 'WEATHER_INFO') {
      return `🌤️ **ਮੌਸਮ ਜਾਣਕਾਰੀ:**\n\n• ਤੇਜ਼ ਹਵਾ (15 km/h ਤੋਂ ਵੱਧ) ਜਾਂ ਬਾਰਿਸ਼ ਦੀ ਸੰਭਾਵਨਾ ਹੋਣ 'ਤੇ ਖੇਤ ਵਿੱਚ ਸਪ੍ਰੇ ਨਾ ਕਰੋ।`;
    }

    // 12. GENERAL YIELD FALLBACK
    if (action === 'YIELD_PROFIT') {
      if (lang === 'DEVANAGARI') {
        return `🌾 **प्रति एकड़ औसत पैदावार (Yield):**\n\n• **गेहूं:** 22 - 26 क्विंटल/एकड़।\n• **धान:** 30 - 35 क्विंटल/एकड़।\n• **गेंदा:** 80 - 100 क्विंटल/एकड़।`;
      }
      return `🌾 **ਫਸਲਾਂ ਦਾ ਪ੍ਰਤੀ ਏਕੜ ਔਸਤਨ ਝਾੜ:**\n\n• **ਕਣਕ:** 22 - 26 ਕੁਇੰਟਲ/ਏਕੜ।\n• **ਝੋਨਾ:** 30 - 35 ਕੁਇੰਟਲ/ਏਕੜ।\n• **ਗੇਂਦਾ:** 80 - 100 ਕੁਇੰਟਲ/ਏਕੜ।\n• **ਨਰਮਾ:** 10 - 14 ਕੁਇੰਟਲ/ਏਕੜ।`;
    }

    // 13. DIRECT TARGETED DYNAMIC FALLBACK WITH KEYWORD CHECK
    const farmingKeywords = [
      'kheti', 'baadi', 'kisan', 'fasal', 'khet', 'paani', 'beej', 'mitti', 'tractor', 'hal',
      'guddai', 'katai', 'bijai', 'mandi', 'dhaan', 'kanak', 'narma', 'kapas', 'makki', 'jowar',
      'bajra', 'ganna', 'sarson', 'aaloo', 'sabzi', 'fal', 'pashu', 'majh', 'gaaw', 'motor',
      'tubewell', 'khad', 'khaad', 'urea', 'dap', 'spray', 'dawai', 'disease', 'bimari', 'ilaj',
      'rate', 'bhav', 'price', 'weed', 'nadin', 'machhli', 'murgi', 'dairy', 'pashupalan',
      'krishi', 'kisaan', 'fasle', 'beejai', 'sinchai', 'boai', 'kheti-badi', 'jhaad', 'yield',
      'kuintal', 'genda', 'marigold', 'chilli', 'mirch', 'wheat', 'paddy', 'rice', 'dhan',
      'jhona', 'cotton', 'mustard', 'potato', 'onion', 'pyaaz', 'garlic', 'lasan', 'gobhi',
      'tomato', 'tamatar', 'baingan', 'bhindi', 'moong', 'chana', 'matar', 'agriculture',
      'farm', 'crop', 'soil', 'water', 'weather', 'mausam', 'baarish', 'rain', 'dudh',
      'milk', 'cow', 'buffalo', 'goat', 'sheep', 'bee', 'honey', 'poultry', 'fish', 'meat',
      'kisan', 'farmer', 'kisaani', 'faslan', 'boota', 'paude', 'patte', 'jad'
    ];

    const isFarmingRelated = farmingKeywords.some(kw => q.includes(kw));
    const cleanQ = query.trim();

    if (isFarmingRelated) {
      if (lang === 'DEVANAGARI') {
        return `🌾 **कृषि सलाह:**\n\n1. **सिंचाई एवं पानी:** फसल की आवश्यकता अनुसार हल्का पानी दें। जलजमाव न होने दें।\n2. **उर्वरक की मात्रा:** 45kg यूरिया प्रति एकड़ सिंचाई के साथ दें और micronutrient स्प्रे करें।\n3. **कीट/बीमारी सुरक्षा:** सुबह के समय पत्तों की जांच करें। सुंडी या तेले का लक्षण होने पर सिफारिश के अनुसार स्प्रे करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌾 **FarmsKing Kisan Advisory:**\n\n1. **Irrigation:** Water early morning or late evening depending on soil moisture.\n2. **Fertilizer:** Top-dress 45kg Urea per acre during vegetative growth stage.\n3. **Pest Control:** Inspect crop regularly for thrips or fungal spots; apply recommended PAU/ICAR sprays.`;
      }
      return `🌾 **ਖੇਤੀਬਾੜੀ ਸਲਾਹ:**\n\n1. **ਪਾਣੀ ਅਤੇ ਸਿੰਚਾਈ:** ਫਸਲ ਨੂੰ ਲੋੜ ਅਨੁਸਾਰ ਹਲਕਾ ਪਾਣੀ ਲਾਓ। ਜੜ੍ਹਾਂ ਵਿੱਚ ਪਾਣੀ ਖੜ੍ਹਾ ਨਾ ਹੋਣ ਦਿਓ।\n2. **ਯੂਰੀਆ / ਖਾਦ ਦੀ ਖੁਰਾਕ:** ਸਿਫਾਰਿਸ਼ ਅਨੁਸਾਰ ਯੂਰੀਆ ਜਾਂ DAP ਖਾਦ ਦੀ ਵਰਤੋਂ ਕਰੋ।\n3. **ਬੀਮਾਰੀ ਅਤੇ ਕੀੜਿਆਂ ਦੀ ਰੋਕਥਾਮ:** ਸਵੇਰੇ ਫਸਲ ਦੇ ਪੱਤੇ ਚੈੱਕ ਕਰੋ। ਤੇਲਾ ਜਾਂ ਝੁਲਸ ਰੋਗ ਦਿਸਣ 'ਤੇ ਸਮੇਂ ਸਿਰ ਸਿਫਾਰਿਸ਼ ਕੀਤੀ ਸਪ੍ਰੇ ਕਰੋ।`;
    } else {
      if (lang === 'DEVANAGARI') return "⚠️ **केवल कृषि प्रश्न:**\n\nमैं केवल कृषि, फसलों, उर्वरक, स्प्रे, मौसम और मंडी भाव से संबंधित प्रश्नों का उत्तर दे सकता हूँ। कृपया कृषि से संबंधित प्रश्न पूछें।";
      if (lang === 'ENGLISH') return "⚠️ **Agricultural Questions Only:**\n\nI can only answer questions related to crops, fertilizers, sprays, seeds, weather, and mandi rates. Please ask a farming-related question!";
      return "⚠️ **ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ ਸਵਾਲ:**\n\nਮੈਂ ਸਿਰਫ਼ ਖੇਤੀ, ਫਸਲਾਂ, ਖਾਦਾਂ, ਸਪ੍ਰੇ, ਮੌਸਮ ਅਤੇ ਮੰਡੀ ਭਾਵ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ। ਕਿਰਪਾ ਕਰਕੇ ਖੇਤੀ ਨਾਲ ਸਬੰਧਤ ਕੋਈ ਸਵਾਲ ਪੁੱਛੋ।";
    }
  };

  const handleSend = async (textToSend?: string) => {
    const rawInput = (textToSend || inputQuery).trim();
    const query = rawInput || 'Farming and fertilizer advisory';
    if (isLoading) return;

    // Check Free User 10 Question Limit
    if (!isPaidUser && askedCount >= 10) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'AI',
          text: "🔒 **Free AI Consultation Limit Reached (10/10 Used)**\n\nYou have used your 10 free AI questions on the Free Plan.\n\n✨ **Upgrade to FarmsKing VIP Pass / Paid Card** to unlock **UNLIMITED AI Doctor Consultations**, live mandi predictions, and priority PAU expert guidance!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'NON_FARMING_BLOCKED',
        },
      ]);
      setIsLoading(false);
      setShowUpgradeModal(true);
      return;
    }

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

    if (!isPaidUser) {
      const nextCount = askedCount + 1;
      setAskedCount(nextCount);
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('farmsking_ai_free_asked_count', nextCount.toString());
        }
      } catch {}
    }

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    const lang = detectLanguage(query);

    // Explicit non-farming filter on client side as first line of defense
    if (isExplicitNonFarming(query)) {
      const aiText = '⚠️ **Agricultural Questions Only:**\n\nI can only answer questions related to crops, fertilizers, sprays, seeds, weather, mandi rates, and FarmsKing app features. Please ask a farming-related question!';

      setMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'AI',
          text: aiText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          category: 'NON_FARMING_BLOCKED',
        },
      ]);
      setIsLoading(false);
      return;
    }

    // Direct Google Gemini 2.5 Flash AI call with Search Grounding
    const isRealGoogleAiKey = Boolean(googleAiKey && !googleAiKey.includes('your_gemini_api_key'));
    if (isRealGoogleAiKey) {
      try {
        const response = await googleAi.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: query,
          config: {
            systemInstruction: `You are "Farmsking Kisan AI Doctor", an elite National AI Agriculture & Farming Expert serving ALL Indian Farmers across all states (Punjab, Haryana, UP, MP, MH, RJ, AP, TS, KA, TN, WB, Bihar, Gujarat, etc.) powered by Google Gemini 2.5 Flash with Live Google Search Grounding.

CRITICAL RULES:
1. SHORT, DIRECT, AND CONCISE ANSWERS:
   - Provide clear bullet points, exact chemical/organic spray names, exact fertilizer dosages (kg/acre), CRI irrigation dates, and yield estimates per acre.
   - Keep answers short, structured, and easy for farmers to read quickly without unnecessary fluff.
2. NATIONAL FARMERS COVERAGE:
   - Cover all Indian crops (Wheat, Paddy, Cotton, Sugarcane, Potato, Marigold, Mustard, Tomato, Chilli, Vegetables, Fruits, Spices, Pulses, Dairy).
3. STRICT TOPIC GUARDRAIL:
   - Only answer agriculture, farming, crop disease, fertilizer, spray, livestock, weather, mandi rates, and FarmsKing platform queries.
   - Refuse non-farming questions politely: "I can only assist with agriculture, crops, fertilizers, sprays, livestock, weather, mandi rates, and FarmsKing app queries. Please ask a farming-related question."`,
            tools: [{ googleSearch: {} }],
          },
        });

        const answerText = response.text?.trim();
        if (answerText) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'AI',
              text: answerText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              category: 'FARMING',
            },
          ]);
          setIsLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          return;
        }
      } catch (gErr: any) {
        console.warn('Google GenAI Direct Call Error, checking quota error or fallback:', gErr);
        const errStr = (gErr?.message || '') + JSON.stringify(gErr || '');
        const errLower = errStr.toLowerCase();
        if (errLower.includes('429') || errLower.includes('quota') || errLower.includes('resource_exhausted') || errLower.includes('api_key_invalid') || errLower.includes('invalid_argument')) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'AI',
              text: "⚠️ **FarmsKing Kisan AI Doctor is temporarily unavailable due to daily Google AI quota limits.**\n\nPlease try again shortly or contact FarmsKing support for assistance.",
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              category: 'NON_FARMING_BLOCKED',
            },
          ]);
          setIsLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          return;
        }
      }
    }

    // Try backend NestJS AI API route
    try {
      const baseUrl = getDefaultApiUrl();
      const historyPayload = updatedMessages.slice(-6).map((m) => ({
        role: m.sender === 'USER' ? ('user' as const) : ('assistant' as const),
        content: m.text,
      }));
      const response = await fetch(`${baseUrl}/ai-chat/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.answer) {
          setMessages((prev) => [
            ...prev,
            {
              id: `ai-${Date.now()}`,
              sender: 'AI',
              text: data.answer,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              category: 'FARMING',
            },
          ]);
          setIsLoading(false);
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend AI Chat API failed, using fallback generator:', err);
    }

    // Fallback to internal rule-based engine if network/API fails
    const fallbackText = generateAgriResponse(query, updatedMessages);
    setMessages((prev) => [
      ...prev,
      {
        id: `ai-${Date.now()}`,
        sender: 'AI',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        category: 'FARMING',
      },
    ]);
    setIsLoading(false);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, styles.containerModal]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header Banner */}
      {!isModal && (
        <View style={[styles.header, isMobile && { paddingHorizontal: 10, paddingVertical: 8 }]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.botAvatarCircle, isMobile && { width: 28, height: 28, borderRadius: 14 }]}>
              <Ionicons name="sparkles" size={isMobile ? 14 : 18} color="#ffffff" />
            </View>
            <View style={{ flex: 1, flexShrink: 1, paddingRight: 4 }}>
              <Text style={[styles.headerTitle, isMobile && { fontSize: 12.5 }]} numberOfLines={1}>
                ✨ Farmsking Kisan AI Doctor
              </Text>
              <Text style={[styles.headerSubtitle, isMobile && { fontSize: 9.5 }]} numberOfLines={1}>
                100% Free · Google Search Grounded
              </Text>
            </View>
            <View style={[styles.badgeFree, isMobile && { paddingHorizontal: 6, paddingVertical: 2 }]}>
              <Text style={[styles.badgeFreeText, isMobile && { fontSize: 8.5 }]}>FREE 🌾</Text>
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
                AI Doctor is calculating answer...
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Free Plan 10 Questions Usage Counter Banner */}
      {!isPaidUser ? (
        <View style={styles.askedCounterBar}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="help-circle" size={14} color="#d97706" />
            <Text style={styles.askedCounterText}>
              Free Plan: <Text style={{ fontFamily: FONT.extraBold, color: '#b45309' }}>{askedCount}/10</Text> AI Questions Used
            </Text>
          </View>
          <TouchableOpacity
            style={styles.upgradeInlineBtn}
            onPress={() => setShowUpgradeModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles" size={11} color="#ffffff" />
            <Text style={styles.upgradeInlineBtnText}>VIP Pass 👑</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.askedCounterBar, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
          <Text style={[styles.askedCounterText, { color: '#15803d' }]}>
            FarmsKing Paid VIP Card: <Text style={{ fontFamily: FONT.extraBold }}>UNLIMITED AI Consultations</Text> ✨
          </Text>
        </View>
      )}

      {/* Input Bar */}
      <View style={[styles.inputBar, isMobile && { paddingHorizontal: 10, paddingVertical: 8 }]}>
        <TextInput
          style={[
            styles.input,
            { height: isMobile ? 42 : 46, fontSize: isMobile ? 12.5 : 13.5, paddingHorizontal: 14 },
          ]}
          placeholder={isMobile ? "Ask about crops, sprays, mandi rates..." : "Ask about wheat, paddy, fertilizers, sprays or mandi rates..."}
          placeholderTextColor="#94a3b8"
          value={inputQuery}
          onChangeText={setInputQuery}
          onSubmitEditing={() => handleSend()}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[styles.sendBtn, { width: isMobile ? 42 : 46, height: isMobile ? 42 : 46, borderRadius: isMobile ? 21 : 23 }]}
          onPress={() => handleSend()}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={isMobile ? 16 : 18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <FarmerPlanUpgradeModal
        visible={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        tiers={['PRO', 'SMART', 'SUPER']}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    overflow: 'hidden',
    marginVertical: 8,
  },
  containerModal: {
    flex: 1,
    height: '100%',
    borderRadius: 0,
    borderWidth: 0,
    marginVertical: 0,
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
  askedCounterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fffbeb',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#fef3c7',
  },
  askedCounterText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#92400e',
  },
  upgradeInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d97706',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  upgradeInlineBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
