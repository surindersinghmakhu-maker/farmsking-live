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

export type LanguageCode =
  | 'GURMUKHI'
  | 'DEVANAGARI'
  | 'BENGALI'
  | 'TELUGU'
  | 'TAMIL'
  | 'KANNADA'
  | 'GUJARATI'
  | 'MALAYALAM'
  | 'PUNJABI_ROMAN'
  | 'HINDI_ROMAN'
  | 'ENGLISH';

interface AgriAiChatbotProps {
  isModal?: boolean;
}

export function AgriAiChatbot({ isModal = false }: AgriAiChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'AI',
      text: "Welcome! 👨‍🌾 I am FarmsKing Agri AI Doctor (Kheti Mitra AI).\n\nAsk me any farming question in English, Punjabi, Hindi, or Hinglish/Pinglish. I will reply in the SAME language you ask!",
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

    // Direct Gurmukhi or Punjabi triggers
    if (qLower.includes('punjabi') || qLower.includes('gurmukhi') || /[\u0A00-\u0A7F]/.test(query)) {
      return 'GURMUKHI';
    }
    // Direct Hindi or Devanagari triggers
    if (qLower.includes('hindi') || qLower.includes('हिंदी') || /[\u0900-\u097F]/.test(query)) {
      return 'DEVANAGARI';
    }
    if (qLower.includes('english')) {
      return 'ENGLISH';
    }

    if (/[\u0980-\u09FF]/.test(query)) return 'BENGALI';
    if (/[\u0C00-\u0C7F]/.test(query)) return 'TELUGU';
    if (/[\u0B80-\u0BFF]/.test(query)) return 'TAMIL';
    if (/[\u0C80-\u0CFF]/.test(query)) return 'KANNADA';
    if (/[\u0A80-\u0AFF]/.test(query)) return 'GUJARATI';
    if (/[\u0D00-\u0D7F]/.test(query)) return 'MALAYALAM';

    // Roman Transliteration differentiation
    const punjabiWords = ['krda', 'karda', 'krdi', 'kardi', 'ha', 'haan', 'han', 'hunda', 'hunde', 'vich', 'te', 'nu', 'saada', 'saadi', 'tuhanu', 'puaa', 'pao', 'karni', 'dasso', 'mera', 'meri', 'de', 'da', 'di', 'khet', 'khetan', 'laayi', 'layi', 'pind', 'kisaan', 'paude', 'kra', 'paani', 'din', 'gende', 'genda'];
    const hindiWords = ['krta', 'karta', 'krti', 'karti', 'hu', 'hoon', 'hai', 'hain', 'kaise', 'kya', 'kaun', 'chahiye', 'batao', 'karein', 'kare', 'ki', 'ke', 'ko', 'mein', 'se', 'par', 'karte', 'hoge', 'karo', 'dijiye', 'paudhe'];

    let pCount = 0;
    let hCount = 0;
    const words = qLower.split(/\s+/);

    words.forEach(w => {
      if (punjabiWords.includes(w)) pCount++;
      if (hindiWords.includes(w)) hCount++;
    });

    if (qLower.includes('krda') || qLower.includes('karda') || qLower.includes('di kheti') || qLower.includes('da ilaaj') || qLower.includes('paude') || qLower.includes('spray kra') || qLower.includes('krda ha')) {
      return 'GURMUKHI';
    }
    if (qLower.includes('krta') || qLower.includes('karta') || qLower.includes('ki kheti') || qLower.includes('kaise kare') || qLower.includes('krta hu')) {
      return 'DEVANAGARI';
    }

    if (pCount > hCount) return 'GURMUKHI';
    if (hCount > pCount) return 'DEVANAGARI';

    // Default Roman Indian input to Gurmukhi script for Punjabi farmers
    return 'GURMUKHI';
  };

  const generateAgriResponse = (query: string): string => {
    const q = query.toLowerCase().trim();
    const lang = detectLanguage(query);
    const userQueryTitle = query.length > 40 ? query.substring(0, 40) + '...' : query;

    // 1. Language Request / Switch Command
    if ((q.includes('punjabi') || q.includes('ਪੰਜਾਬੀ')) && (q.includes('language') || q.includes('gall') || q.includes('use') || q.includes('speak') || q.includes('vich') || q.includes('ch'))) {
      return `🌾 **ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! (FarmsKing AI ਖੇਤੀ ਡਾਕਟਰ):**\n\nਜੀ ਹਾਂ, ਹੁਣ ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਪੂਰੀ ਤਰ੍ਹਾਂ ਪੰਜਾਬੀ (ਗੁਰਮੁਖੀ) ਵਿੱਚ ਗੱਲਬਾਤ ਕਰਾਂਗਾ।\n\nਤੁਸੀਂ ਆਪਣੀ ਫਸਲ (ਕਣਕ, ਝੋਨਾ, ਨਰਮਾ, ਗੰਨਾ, ਆਲੂ, ਟਮਾਟਰ, ਗੇਂਦਾ), ਖਾਦਾਂ, ਯੂਰੀਆ, 20 ਦਿਨਾਂ ਦੇ ਪੌਦਿਆਂ ਲਈ ਸਪ੍ਰੇ, ਮੰਡੀ ਭਾਵ, ਮੌਸਮ ਅਤੇ FarmsKing ਐਪ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ!`;
    }

    // 2. FarmsKing Web App & Platform Features
    if (q.includes('farmsking') || q.includes('app') || q.includes('website') || q.includes('web application') || q.includes('site') || q.includes('store') || q.includes('dukan') || q.includes('wallet')) {
      if (lang === 'DEVANAGARI') {
        return `🌾 **FarmsKing ऐप और वेबसाइट जानकारी ("${userQueryTitle}"):**\n\n1. **एग्रीस्टोर (AgriStore):** असली बीज, यूरिया, DAP और कीटनाशक घर बैठे मंगाएं।\n2. **ताजा मंडी भाव (Live Mandi Rates):** प्रतिदिन जिलेवार मंडी भाव देखें।\n3. **सैटेलाइट खेत निगरानी (Satellite View):** खेत की नमी और फसल स्वास्थ्य जांचें।\n4. **मौसम पूर्वानुमान:** 7 दिनों की सटीक मौसम रिपोर्ट।\n5. **विक्रेता एवं वॉलेट (Seller Store):** अपनी दुकान रजिस्टर करें और डायरेक्ट पेमेंट पाएं।`;
      }
      if (lang === 'ENGLISH') {
        return `🌾 **FarmsKing Web Application & Platform Guide ("${userQueryTitle}"):**\n\n1. **AgriStore Shopping:** Order 100% genuine fertilizers, seeds, and sprays with fast village delivery.\n2. **Live Mandi Rates:** Real-time crop prices across Punjab, Haryana & North India mandis.\n3. **Satellite Crop Health:** Monitor field soil moisture & satellite NDVI greenness.\n4. **7-Day Weather Forecast:** Live temperature, wind speed & rain alerts.\n5. **Seller Store & Digital Wallet:** Register as an agri-seller to list products & receive instant wallet payouts!`;
      }
      return `🌾 **FarmsKing ਸੁਪਰ ਐਪ ਜਾਣਕਾਰੀ ("${userQueryTitle}"):**\n\n1. **ਖੇਤੀ ਦਵਾਈਆਂ & ਖਾਦਾਂ (AgriStore):** ਅਸਲੀ ਯੂਰੀਆ, DAP, NPK, ਅਤੇ PAU ਸਿਫਾਰਿਸ਼ ਕੀਤੀਆਂ ਸਪ੍ਰੇਆਂ 24-48 ਘੰਟਿਆਂ ਵਿੱਚ ਪਿੰਡਾਂ 'ਚ ਡਿਲੀਵਰੀ।\n2. **ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਵ (Live Mandi Rates):** ਪੰਜਾਬ, ਹਰਿਆਣਾ ਅਤੇ ਰਾਜਸਥਾਨ ਦੀਆਂ ਮੰਡੀਆਂ ਦੇ ਰੋਜ਼ਾਨਾ ਸਰਕਾਰੀ ਭਾਵ।\n3. **ਸੈਟੇਲਾਈਟ ਖੇਤ ਦੇਖਭਾਲ (Satellite Health):** ਸੈਟੇਲਾਈਟ ਰਾਹੀਂ ਆਪਣੇ ਖੇਤ ਦੀ ਹਰਿਆਲੀ ਅਤੇ ਪਾਣੀ ਦੀ ਜਾਂਚ ਕਰੋ।\n4. **ਮੌਸਮ ਜਾਣਕਾਰੀ (Weather Forecast):** 7 ਦਿਨਾਂ ਦਾ ਮੌਸਮ ਅਤੇ ਬਾਰਿਸ਼ ਦਾ ਪੂਰਵ-ਅਨੁਮਾਨ।\n5. **ਦੁਕਾਨਦਾਰ & ਵਾਲਿਟ (Seller Store):** ਦੁਕਾਨਦਾਰ ਆਪਣਾ ਸਮਾਨ ਵੇਚ ਸਕਦੇ ਹਨ ਅਤੇ ਵਾਲਿਟ ਵਿੱਚ ਪੈਸੇ ਪ੍ਰਾਪਤ ਕਰ ਸਕਦੇ ਹਨ।`;
    }

    // 3. Plant Age (15-30 Days) & First Water Advisory
    if (q.includes('20 din') || q.includes('15 din') || q.includes('25 din') || q.includes('30 din') || q.includes('paude') || q.includes('paudhe') || q.includes('ਪੌਦੇ')) {
      if (lang === 'DEVANAGARI') {
        return `🌱 **"${userQueryTitle}" — 20-25 दिनों के पौधों के लिए पहली सिंचाई एवं स्प्रे (PAU सलाह):**\n\n1. **पहली सिंचाई एवं यूरिया:** 20-22 दिनों के पौधों को पहला पानी दें और प्रति एकड़ 45kg (1 बोरी) यूरिया की टॉप-ड्रेसिंग करें।\n2. **खरपतवार नियंत्रण:** गुल्ली डंडा या चौड़ी पत्ती के खरपतवारों के लिए सिंचाई के 3-4 दिन बाद खरपतवार नाशक स्प्रे करें।\n3. **ग्रोथ बूस्टर स्प्रे:** पौधों के अच्छे फुटाव के लिए 1kg NPK (19:19:19) प्रति एकड़ 200L पानी में मिलाकर छिड़कें।\n4. **दवा ऑर्डर:** FarmsKing Store से असली 19:19:19 और खरपतवार नाशक मंगाएं।`;
      }
      if (lang === 'ENGLISH') {
        return `🌱 **"${userQueryTitle}" — 20-25 Day Plant Growth & Spray Advisory (PAU Advisory):**\n\n1. **First Irrigation & Urea:** Apply 1st irrigation at 20-22 days followed by top-dressing 45kg Urea per acre.\n2. **Weed Control Spray:** Spray recommended post-emergence herbicide 3-4 days after irrigation.\n3. **Foliar Growth Spray:** Spray 1kg NPK (19:19:19) per acre in 200L water to boost root tillering and plant health.\n4. **Order Online:** Buy genuine NPK 19:19:19 and sprays on FarmsKing Store.`;
      }
      return `🌱 **"${userQueryTitle}" — 20-25 ਦਿਨਾਂ ਦੇ ਪੌਦਿਆਂ ਲਈ ਪਹਿਲਾ ਪਾਣੀ ਅਤੇ ਸਪ੍ਰੇ (PAU ਸਿਫਾਰਿਸ਼):**\n\n1. **ਪਹਿਲਾ ਪਾਣੀ ਅਤੇ ਯੂਰੀਆ:** 20-22 ਦਿਨਾਂ ਦੀ ਫਸਲ ਨੂੰ ਪਹਿਲਾ ਪਾਣੀ ਲਾਓ ਅਤੇ ਪਾਣੀ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ ਪ੍ਰਤੀ ਏਕੜ 45kg (1 ਗੱਟਾ) ਯੂਰੀਆ ਦਿਓ।\n2. **ਨਦੀਨ ਨਾਸ਼ਕ ਸਪ੍ਰੇ:** ਗੁੱਲੀ ਡੰਡਾ ਜਾਂ ਚੌੜੇ ਪੱਤੇ ਵਾਲੇ ਨਦੀਨਾਂ ਲਈ ਪਾਣੀ ਤੋਂ 3-4 ਦਿਨ ਬਾਅਦ ਨਦੀਨ ਨਾਸ਼ਕ ਦੀ ਸਪ੍ਰੇ ਕਰੋ।\n3. **ਗ੍ਰੋਥ ਬੂਸਟਰ ਸਪ੍ਰੇ:** ਪੌਦਿਆਂ ਦੇ ਚੰਗੇ ਫੁੱਟਾਰੇ ਲਈ 1kg NPK (19:19:19) ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।\n4. **ਅਸਲੀ ਦਵਾਈਆਂ:** FarmsKing Store ਤੋਂ ਅਸਲੀ ਨਦੀਨ ਨਾਸ਼ਕ ਅਤੇ 19:19:19 ਖਾਦ ਮੰਗਵਾਓ।`;
    }

    // 4. Marigold / Genda Flower Farming
    if (q.includes('genda') || q.includes('gende') || q.includes('marigold') || q.includes('ਗੇਂਦਾ') || q.includes('ਗੇਂਦੇ') || q.includes('गेंदा') || q.includes('गेंदे')) {
      if (lang === 'DEVANAGARI') {
        return `🌼 **गेंदा खेती ("${userQueryTitle}") सलाह:**\n\n1. **उन्नत किस्में:** पूसा नारंगी गेंदा और पूसा बसंती गेंदा की खेती सबसे उत्तम है।\n2. **खाद एवं सिंचाई:** प्रति एकड़ 10 टन गोबर खाद + 40kg नाइट्रोजन, 20kg फास्फोरस दें। 7-10 दिनों में सिंचाई करें।\n3. **कीट एवं रोग नियंत्रण:** झुलसा रोग से बचाव के लिए मैंकोज़ेब (2g/L) और नीम तेल का छिड़काव करें।\n4. **उत्पादन:** 1 एकड़ से 80-100 क्विंटल फूल प्राप्त होते हैं।`;
      }
      if (lang === 'ENGLISH') {
        return `🌼 **Marigold ("${userQueryTitle}") Farming Guide:**\n\n1. **Best Varieties:** Pusa Narangi Gainda & Pusa Basanti Gainda yield high-quality blooms.\n2. **Fertilizer & Irrigation:** Apply 10 tons FYM compost + 40kg N, 20kg P per acre. Irrigate every 7-10 days.\n3. **Pest & Disease Control:** Spray Mancozeb @ 2g/L water for leaf blight and Neem Oil for aphid prevention.\n4. **Yield & Profit:** 1 acre produces 80-100 quintals of flowers with high market demand.`;
      }
      return `🌼 **ਗੇਂਦੇ ਦੀ ਖੇਤੀ ("${userQueryTitle}") ਮਾਹਰ ਸਲਾਹ:**\n\n1. **ਉੱਤਮ ਕਿਸਮਾਂ:** ਪੂਸਾ ਨਾਰੰਗੀ ਗੇਂਦਾ ਅਤੇ ਪੂਸਾ ਬਸੰਤੀ ਗੇਂਦਾ ਦੀ ਬਿਜਾਈ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ।\n2. **ਖਾਦ ਅਤੇ ਪਾਣੀ:** 1 ਏਕੜ ਵਿੱਚ 10 ਟਨ ਦੇਸੀ ਰੂੜੀ ਖਾਦ + 40kg ਨਾਈਟ੍ਰੋਜਨ ਅਤੇ 20kg ਫਾਸਫੋਰਸ ਪਾਓ। 7-10 ਦਿਨਾਂ ਬਾਅਦ ਪਾਣੀ ਦਿਓ।\n3. **ਕੀੜੇ ਅਤੇ ਬੀਮਾਰੀ:** ਸੁੰਡੀ ਅਤੇ ਝੁਲਸ ਰੋਗ ਤੋਂ ਬਚਾਅ ਲਈ ਮੈਂਕੋਜ਼ੇਬ (2g/L) ਅਤੇ ਨਿੰਮ ਦੇ ਤੇਲ ਦੀ ਸਪ੍ਰੇ ਕਰੋ।\n4. **ਮੁਨਾਫ਼ਾ:** 1 ਏਕੜ ਗੇਂਦੇ ਤੋਂ 80-100 ਕੁਇੰਟਲ ਫੁੱਲ ਪ੍ਰਾਪਤ ਹੁੰਦੇ ਹਨ।`;
    }

    // 5. Wheat / Kanak / Gehu / Yellow Rust
    if (q.includes('ਕਣਕ') || q.includes('wheat') || q.includes('ਕੁੰਗੀ') || q.includes('rust') || q.includes('ਗੇਂਹੂ') || q.includes('kanak') || q.includes('gehu')) {
      if (lang === 'DEVANAGARI') {
        return `🌾 **गेहूं पीला रतुआ ("${userQueryTitle}") समाधान:**\n\n1. **स्प्रे:** प्रोपिकोनाज़ोल 25% EC (टिल्ट / Tilt) 200 मिली प्रति एकड़ 200 लीटर पानी में मिलाकर छिड़काव करें।\n2. **सावधानी:** बादलों वाले मौसम में अत्यधिक यूरिया का उपयोग न करें।\n3. **जैविक उपाय:** 5% नीम का अर्क या खट्टी छाछ का छिड़काव करें।\n4. **दवा खरीदें:** FarmsKing Store से असली दवा ऑर्डर करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌾 **Wheat Yellow Rust ("${userQueryTitle}") Advisory:**\n\n1. **Chemical Spray:** Propiconazole 25% EC (Tilt) @ 200 ml per acre in 200 Liters of water.\n2. **Precaution:** Avoid excessive Urea application during cloudy humid weather.\n3. **Organic Remedy:** Spray 5% Neem seed extract or sour buttermilk solution (5L in 200L water).\n4. **Order Online:** Genuine Tilt 25% EC is available on FarmsKing Store.`;
      }
      return `🌾 **ਕਣਕ ਦੀ ਪੀਲੀ ਕੁੰਗੀ ("${userQueryTitle}") ਦਾ ਹੱਲ (PAU ਸਿਫਾਰਿਸ਼):**\n\n1. **ਸਪ੍ਰੇ:** ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25% EC (ਟਿਲਟ / Tilt) 200 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।\n2. **ਸਾਵਧਾਨੀ:** ਬੱਦਲਵਾਈ ਵਾਲੇ ਮੌਸਮ ਵਿੱਚ ਜ਼ਿਆਦਾ ਯੂਰੀਆ ਪਾਉਣ ਤੋਂ ਪਰਹੇਜ਼ ਕਰੋ।\n3. **ਦੇਸੀ ਹੱਲ:** 5% ਨਿੰਮ ਦਾ ਅਰਕ ਜਾਂ ਖੱਟੀ ਲੱਸੀ (5L/200L ਪਾਣੀ) ਦਾ ਛਿੜਕਾਅ ਕਰੋ।\n4. **ਦਵਾਈ ਖਰੀਦੋ:** FarmsKing Store ਤੋਂ ਅਸਲੀ ਟਿਲਟ 25% EC ਮੰਗਵਾਓ।`;
    }

    // 6. Paddy / Rice / Jhona / Dhan / Blast
    if (q.includes('ਝੋਨਾ') || q.includes('paddy') || q.includes('rice') || q.includes('dhan') || q.includes('jhona') || q.includes('blast') || q.includes('sheath')) {
      if (lang === 'DEVANAGARI') {
        return `🌱 **धान का झुलसा/ब्लास्ट ("${userQueryTitle}") रोग समाधान:**\n\n1. **स्प्रे:** ट्राइसाइक्लाज़ोल 75% WP 120 ग्राम प्रति एकड़ 200 लीटर पानी में मिलाकर छिड़कें।\n2. **सावधानी:** धब्बे दिखने पर तुरंत नाइट्रोजन देना बंद करें।\n3. **जैविक उपाय:** ट्राइकोडरमा विरिडी 1 किग्रा प्रति एकड़ जैविक खाद के साथ प्रयोग करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌱 **Paddy Leaf Blast ("${userQueryTitle}") Solution:**\n\n1. **Chemical Spray:** Tricyclazole 75% WP @ 120g per acre in 200 Liters of water.\n2. **Precaution:** Stop top-dressing Nitrogen fertilizers immediately when leaf spots appear.\n3. **Organic Remedy:** Apply Trichoderma viride bio-fungicide @ 1 kg per acre.`;
      }
      return `🌱 **ਝੋਨੇ ਦਾ ਬਲਾਸਟ/ਝੁਲਸ ਰੋਗ ("${userQueryTitle}") ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਟ੍ਰਾਈਸਾਈਕਲਾਜ਼ੋਲ 75% WP (ਬਾਨ / Beam) 120 ਗ੍ਰਾਮ ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n2. **ਸਾਵਧਾਨੀ:** ਦਾਗ਼ ਦਿਸਣ ਤੇ ਯੂਰੀਆ ਪਾਉਣਾ ਤੁਰੰਤ ਬੰਦ ਕਰੋ।\n3. **ਜੈਵਿਕ ਹੱਲ:** ਟ੍ਰਾਈਕੋਡਰਮਾ ਵਿਰਡੀ 1 ਕਿੱਲੋ ਪ੍ਰਤੀ ਏਕੜ ਰੂੜੀ ਦੀ ਖਾਦ ਨਾਲ ਮਿਲਾ ਕੇ ਪਾਓ।`;
    }

    // 7. Cotton / Narma / Kapas / Whitefly / Sundi
    if (q.includes('ਨਰਮਾ') || q.includes('cotton') || q.includes('narma') || q.includes('kapas') || q.includes('whitefly') || q.includes('bollworm')) {
      if (lang === 'DEVANAGARI') {
        return `☁️ **कपास गुलाबी सुंडी/सफेद मक्खी ("${userQueryTitle}") इलाज:**\n\n1. **स्प्रे:** इमामेक्टिन बेंजोएट 5% SG (100g) + सेफिना 400ml प्रति एकड़ 200L पानी में छिड़कें।\n2. **जैविक उपाय:** नीम का तेल 500ml प्रति एकड़ उपयोग करें।`;
      }
      if (lang === 'ENGLISH') {
        return `☁️ **Cotton Whitefly & Pink Bollworm ("${userQueryTitle}") Remedy:**\n\n1. **Chemical Spray:** Emamectin Benzoate 5% SG (100g) + Sefina 400ml per acre in 200L water.\n2. **Monitoring:** Install 5 Pheromone Traps per acre.`;
      }
      return `☁️ **ਨਰਮੇ ਦੀ ਗੁਲਾਬੀ ਸੁੰਡੀ/ਚਿੱਟੀ ਮੱਖੀ ("${userQueryTitle}") ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਇਮਾਮੈਕਟਿਨ ਬੈਂਜ਼ੋਏਟ 5% SG (100g) + ਸੇਫੀਨਾ (Sefina) 400ml ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n2. **ਦੇਸੀ ਹੱਲ:** ਨਿੰਮ ਦਾ ਤੇਲ (Neem Oil) 500ml ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ।`;
    }

    // 8. Sugarcane / Ganna / Kumaad / Red Rot
    if (q.includes('ਗੰਨਾ') || q.includes('sugarcane') || q.includes('ganna') || q.includes('kumaad') || q.includes('red rot')) {
      if (lang === 'DEVANAGARI') {
        return `🎋 **गन्ने का लाल सड़न ("${userQueryTitle}") रोग इलाज:**\n\n1. **उपचार:** कारबेन्डाजिम 50% WP (500g) प्रति एकड़ जड़ों में दें।\n2. **जैविक उपाय:** ट्राइकोडरमा 2.5 किग्रा प्रति एकड़ गोबर खाद में मिलाकर दें।`;
      }
      if (lang === 'ENGLISH') {
        return `🎋 **Sugarcane Red Rot ("${userQueryTitle}") Disease Remedy:**\n\n1. **Soil Drenching:** Mix 500g Carbendazim 50% WP per acre in water and drench roots.\n2. **Bio-Control:** Apply Trichoderma harzianum @ 2.5 kg/acre.`;
      }
      return `🎋 **ਗੰਨੇ ਦੇ ਰੱਤਾ ਰੋਗ ("${userQueryTitle}") ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ / ਜੜ੍ਹਾਂ ਵਿੱਚ:** ਕਾਰਬੈਂਡਾਜ਼ਿਮ 50% WP (500g) ਪ੍ਰਤੀ ਏਕੜ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਜੜ੍ਹਾਂ 'ਚ ਪਾਓ।\n2. **ਜੈਵਿਕ ਹੱਲ:** ਟ੍ਰਾਈਕੋਡਰਮਾ 2.5 ਕਿੱਲੋ ਪ੍ਰਤੀ ਏਕੜ ਦੇਸੀ ਖਾਦ ਨਾਲ ਮਿਲਾ ਕੇ ਪਾਓ।`;
    }

    // 9. Potato / Aloo / Blight
    if (q.includes('ਆਲੂ') || q.includes('potato') || q.includes('aloo') || q.includes('blight')) {
      if (lang === 'DEVANAGARI') {
        return `🥔 **आलू का झुलसा रोग ("${userQueryTitle}") इलाज:**\n\n1. **स्प्रे:** एक्रोबेट (400g) + मैंकोजेब (600g) 200 लीटर पानी में प्रति एकड़ छिड़कें।\n2. **सावधानी:** कोहरे से पहले फफूंदनाशक स्प्रे करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🥔 **Potato Blight ("${userQueryTitle}") Remedy:**\n\n1. **Chemical Spray:** Acrobat (400g) + Mancozeb (600g) in 200L water per acre.\n2. **Precaution:** Apply protective fungicide before heavy morning frost.`;
      }
      return `🥔 **ਆਲੂਆਂ ਦੇ ਝੁਲਸ ਰੋਗ ("${userQueryTitle}") ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਐਕਰੋਬੈਟ (Acrobat 400g) + ਮੈਂਕੋਜ਼ੇਬ (600g) 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕੋ।\n2. **ਸਾਵਧਾਨੀ:** ਧੁੰਦ ਜਾਂ ਠੰਡ ਤੋਂ ਪਹਿਲਾਂ ਸਪ੍ਰੇ ਜ਼ਰੂਰ ਕਰੋ।`;
    }

    // 10. Tomato / Vegetables / Sabzi
    if (q.includes('ਟਮਾਟਰ') || q.includes('tomato') || q.includes('tamatar') || q.includes('ਸਬਜ਼ੀ') || q.includes('vegetable')) {
      if (lang === 'DEVANAGARI') {
        return `🍅 **टमाटर एवं सब्जी रोग ("${userQueryTitle}") का इलाज:**\n\n1. **स्प्रे:** रिडोमिल गोल्ड (Ridomil Gold) 500g प्रति एकड़ 200L पानी में छिड़कें।\n2. **जैविक उपाय:** ट्राइकोडरमा 1 किग्रा प्रति एकड़ देसी खाद में मिलाकर डालें।`;
      }
      if (lang === 'ENGLISH') {
        return `🍅 **Tomato & Vegetable ("${userQueryTitle}") Remedy:**\n\n1. **Chemical Spray:** Ridomil Gold @ 500g per acre in 200L water.\n2. **Bio-Remedy:** Trichoderma viride 1kg per acre mixed with compost.`;
      }
      return `🍅 **ਟਮਾਟਰ ਅਤੇ ਸਬਜ਼ੀਆਂ ਦੇ ਰੋਗ ("${userQueryTitle}") ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਰਿਡੋਮਿਲ ਗੋਲਡ (Ridomil Gold) 500g ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n2. **ਜੈਵਿਕ ਹੱਲ:** ਟ੍ਰਾਈਕੋਡਰਮਾ 1 ਕਿੱਲੋ ਪ੍ਰਤੀ ਏਕੜ ਦੇਸੀ ਖਾਦ ਨਾਲ ਪਾਓ।`;
    }

    // 11. Fertilizer / Khad / Urea / DAP / NPK
    if (q.includes('ਖਾਦ') || q.includes('fertilizer') || q.includes('urea') || q.includes('dap') || q.includes('npk') || q.includes('khad')) {
      if (lang === 'DEVANAGARI') {
        return `🌱 **खाद एवं उर्वरक ("${userQueryTitle}") सिफारिश:**\n\n1. **बुआई के समय:** 1 बोरी डी.ए.पी (50kg) + 1/2 बोरी पोटाश प्रति एकड़ डालें।\n2. **यूरिया:** 45 किग्रा यूरिया प्रति एकड़ पहली और दूसरी सिंचाई पर 2-3 किस्तों में दें।\n3. **जैविक खाद:** वर्मीकंपोस्ट या ह्यूमिक एसिड का प्रयोग करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌱 **Fertilizer ("${userQueryTitle}") Recommendation:**\n\n1. **Basal Dose:** Apply 1 bag DAP (50kg) + 1/2 bag Potash per acre during sowing.\n2. **Urea Application:** Top-dress 45kg Urea per acre in 2-3 split doses at irrigation.`;
      }
      return `🌱 **ਖਾਦ ਅਤੇ ਯੂਰੀਆ ("${userQueryTitle}") ਦੀ ਸਿਫਾਰਿਸ਼ (PAU ਸਲਾਹ):**\n\n1. **ਬਿਜਾਈ ਵੇਲੇ:** 1 ਗੱਟਾ ਡੀ.ਏ.ਪੀ (50kg) + 1/2 ਗੱਟਾ ਪੋਟਾਸ਼ ਪ੍ਰਤੀ ਏਕੜ ਪਾਓ।\n2. **ਯੂਰੀਆ:** 45 ਕਿੱਲੋ ਯੂਰੀਆ ਪ੍ਰਤੀ ਏਕੜ ਪਹਿਲੇ ਅਤੇ ਦੂਜੇ ਪਾਣੀ ਨਾਲ 2-3 ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਦਿਓ।\n3. **ਜੈਵਿਕ ਖਾਦ:** ਵਰਮੀਕੰਪੋਸਟ ਜਾਂ ਹਿਊਮਿਕ ਐਸਿਡ ਪਾ ਕੇ ਜ਼ਮੀਨ ਦੀ ਤਾਕਤ ਵਧਾਓ।`;
    }

    // 12. Pesticides / Sundi / Keeda / Dawai / Spray
    if (q.includes('dawai') || q.includes('dawaii') || q.includes('dawa') || q.includes('spray') || q.includes('sundi') || q.includes('keeda') || q.includes('beemari') || q.includes('ilaaj') || q.includes('ilac') || q.includes('ਸਪ੍ਰੇ') || q.includes('ਦਵਾਈ') || q.includes('ਬੀਮਾਰੀ') || q.includes('ਇਲਾਜ') || q.includes('ਕੀੜਾ') || q.includes('ਸੁੰਡੀ')) {
      if (lang === 'DEVANAGARI') {
        return `🐛 **कीटनाशक एवं स्प्रे ("${userQueryTitle}") सलाह:**\n\n1. **सुंडी/कीट स्प्रे:** इमामेक्टिन बेंजोएट 5% SG (100g प्रति एकड़) 200L पानी में मिलाकर छिड़कें।\n2. **फफूंद/झुलसा रोग:** एक्रोबेट (400g) + मैंकोजेब (600g) प्रति एकड़ छिड़कें।\n3. **जैविक उपाय:** नीम का तेल (500ml) का छिड़काव करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🐛 **Pesticide & Spray ("${userQueryTitle}") Advisory:**\n\n1. **Pest Control:** Spray Emamectin Benzoate 5% SG @ 100g per acre in 200L water.\n2. **Fungal Control:** Spray Acrobat (400g) + Mancozeb (600g) per acre.\n3. **Organic Protection:** Spray 5% Neem Oil @ 500ml/acre.`;
      }
      return `🐛 **ਖੇਤੀ ਦਵਾਈਆਂ ਅਤੇ ਸਪ੍ਰੇ ("${userQueryTitle}") ਦਾ ਹੱਲ (PAU ਮਾਹਰ ਸਲਾਹ):**\n\n1. **ਸੁੰਡੀ/ਕੀੜੇ ਦੀ ਸਪ੍ਰੇ:** ਇਮਾਮੈਕਟਿਨ ਬੈਂਜ਼ੋਏਟ 5% SG (100g ਪ੍ਰਤੀ ਏਕੜ) 200L ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕੋ।\n2. **ਝੁਲਸ/ਫੰਗਸ ਰੋਗ:** ਐਕਰੋਬੈਟ (400g) + ਮੈਂਕੋਜ਼ੇਬ (600g) ਪ੍ਰਤੀ ਏਕੜ ਸਪ੍ਰੇ ਕਰੋ।\n3. **ਜੈਵਿਕ ਹੱਲ:** ਨਿੰਮ ਦਾ ਤੇਲ (Neem Oil 500ml) ਛਿੜਕਾਅ ਕਰੋ।`;
    }

    // 13. Weeds / Herbicides / Gulli Danda / Nadin
    if (q.includes('nadin') || q.includes('gulli') || q.includes('danda') || q.includes('weed') || q.includes('ghas') || q.includes('herbicide') || q.includes('ਨਦੀਨ') || q.includes('ਗੁੱਲੀ')) {
      if (lang === 'DEVANAGARI') {
        return `🌾 **खरपतवार ("${userQueryTitle}") नियंत्रण:**\n\n1. **गुल्ली डंडा:** सिंचाई के 3-4 दिन बाद एक्शियल (Axial) का छिड़काव करें।\n2. **चौड़ी पत्ती:** 2,4-D या एल्ग्रिप 8g प्रति एकड़ 200L पानी में छिड़कें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌾 **Weed & Herbicide ("${userQueryTitle}") Advisory:**\n\n1. **Grassy Weeds:** Spray Axial or Shogun 3-4 days after 1st irrigation.\n2. **Broadleaf Weeds:** Spray Algrip @ 8g per acre in 200L water.`;
      }
      return `🌾 **ਨਦੀਨ ਨਾਸ਼ਕ ("${userQueryTitle}") ਦਾ ਹੱਲ:**\n\n1. **ਗੁੱਲੀ ਡੰਡਾ:** ਕਣਕ ਵਿੱਚ ਪਹਿਲੇ ਪਾਣੀ ਤੋਂ 3-4 ਦਿਨ ਬਾਅਦ ਐਕਸੀਅਲ (Axial) ਜਾਂ ਸ਼ਗਨ ਪ੍ਰਤੀ ਏਕੜ ਸਪ੍ਰੇ ਕਰੋ।\n2. **ਚੌੜੇ ਪੱਤੇ ਵਾਲੇ ਨਦੀਨ:** 2,4-D ਜਾਂ ਐਲਗ੍ਰਿਪ (Algrip) 8g ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।`;
    }

    // 14. Plant Growth / Tillering / Phutara
    if (q.includes('growth') || q.includes('phutara') || q.includes('futara') || q.includes('vadhara') || q.includes('ਫੁੱਟਾਰਾ') || q.includes('ਗ੍ਰੋਥ')) {
      if (lang === 'DEVANAGARI') {
        return `🌱 **पौधों के फुटाव एवं बढ़वार ("${userQueryTitle}") की सलाह:**\n\n1. **ग्रोथ स्प्रे:** 1kg NPK (19:19:19) प्रति एकड़ 200L पानी में मिलाकर छिड़कें।\n2. **ह्यूमिक एसिड:** जड़ों की मजबूती के लिए 1 लीटर ह्यूमिक एसिड सिंचाई के साथ दें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌱 **Crop Growth & Tillering ("${userQueryTitle}") Advisory:**\n\n1. **Foliar Spray:** Spray 1kg NPK (19:19:19) per acre in 200L water.\n2. **Root Booster:** Apply 1L Humic Acid with irrigation water for vigorous root growth.`;
      }
      return `🌱 **ਫਸਲ ਦੇ ਵਧੀਆ ਫੁੱਟਾਰੇ ("${userQueryTitle}") ਲਈ ਸਲਾਹ:**\n\n1. **ਗ੍ਰੋਥ ਸਪ੍ਰੇ:** 1kg NPK (19:19:19) ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।\n2. **ਹਿਊਮਿਕ ਐਸਿਡ:** ਜ਼ਮੀਨ 'ਚ ਜੜ੍ਹਾਂ ਦੀ ਮਜ਼ਬੂਤੀ ਲਈ 1 ਲੀਟਰ ਹਿਊਮਿਕ ਐਸਿਡ ਪਾਣੀ ਨਾਲ ਦਿਓ।`;
    }

    // 15. Dairy / Livestock / Majh / Gai / Milk
    if (q.includes('majh') || q.includes('gai') || q.includes('cow') || q.includes('buffalo') || q.includes('milk') || q.includes('doodh') || q.includes('dood') || q.includes('pashu') || q.includes('ਦੁੱਧ') || q.includes('ਮੱਝ') || q.includes('ਗਾਂ')) {
      if (lang === 'DEVANAGARI') {
        return `🥛 **पशुपालन एवं दूध उत्पादन ("${userQueryTitle}") की सलाह:**\n\n1. **मिनरल मिक्सचर:** गाय/भैंस को रोजाना 50g-100g मिनरल मिक्सचर दें।\n2. **चारा एवं पानी:** हरे चारे के साथ सूखा चारा दें और दिन में 4-5 बार ताजा पानी पिलाएं।`;
      }
      if (lang === 'ENGLISH') {
        return `🥛 **Livestock & Milk Yield ("${userQueryTitle}") Advisory:**\n\n1. **Mineral Supplement:** Provide 50-100g daily Mineral Mixture to cattle/buffalo.\n2. **Feed Balance:** Mix dry fodder with green forage for optimum digestion and milk output.`;
      }
      return `🥛 **ਪਸ਼ੂ ਪਾਲਣ ਅਤੇ ਦੁੱਧ ਵਧਾਉਣ ("${userQueryTitle}") ਦੀ ਮਾਹਰ ਸਲਾਹ:**\n\n1. **ਖੁਰਾਕ & ਮਿਨਰਲ ਮਿਕਸਚਰ:** ਮੱਝ/ਗਾਂ ਨੂੰ ਰੋਜ਼ਾਨਾ 50g-100g ਚੰਗੀ ਕੁਆਲਿਟੀ ਦਾ Mineral Mixture ਖੁਰਾਕ ਵਿੱਚ ਦਿਓ।\n2. **ਹਰਾ ਚਾਰਾ:** ਹਰੇ ਚਾਰੇ ਨਾਲ 1kg ਤੂੜੀ ਅਤੇ ਸੁੱਕਾ ਚਾਰਾ ਜ਼ਰੂਰ ਮਿਲਾਓ।\n3. **ਪਾਣੀ:** ਪਸ਼ੂ ਨੂੰ ਦਿਨ ਵਿੱਚ 4-5 ਵਾਰ ਸਾਫ਼ ਅਤੇ ਤਾਜ਼ਾ ਪਾਣੀ ਪਿਲਾਓ।`;
    }

    // 16. Seeds / Sowing / Varieties
    if (q.includes('beej') || q.includes('variety') || q.includes('bijai') || q.includes('sowing') || q.includes('varieti') || q.includes('ਕਿਸਮ') || q.includes('ਬੀਜ') || q.includes('ਬਿਜਾਈ')) {
      if (lang === 'DEVANAGARI') {
        return `🌱 **उन्नत बीज एवं बुआई ("${userQueryTitle}") सलाह:**\n\n1. **बीज उपचार:** बुआई से पहले बीज को बाविस्टिन (Bavistin 2g/kg) से संशोधित करें।\n2. **बीज दर:** 1 एकड़ में 40kg गेहूं या 8kg धान का प्रमाणित बीज प्रयोग करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌱 **Seeds & Sowing ("${userQueryTitle}") Guide:**\n\n1. **Seed Treatment:** Treat seeds with Bavistin @ 2g/kg before sowing.\n2. **Seed Rate:** Use 40kg wheat seed or 8kg paddy seed per acre.`;
      }
      return `🌱 **ਉੱਤਮ ਬੀਜ ਅਤੇ ਬਿਜਾਈ ("${userQueryTitle}") ਦੀ ਸਲਾਹ (PAU Advisory):**\n\n1. **ਬੀਜ ਦੀ ਸੋਧ:** ਬਿਜਾਈ ਤੋਂ ਪਹਿਲਾਂ ਬੀਜ ਨੂੰ ਬਾਵਿਸਟਿਨ (Bavistin 2g/kg) ਨਾਲ ਸੋਧੋ।\n2. **ਬਿਜਾਈ ਦਾ ਸਮਾਂ:** ਸੁਧਰੀਆਂ ਕਿਸਮਾਂ ਦੀ ਬਿਜਾਈ ਸਮੇਂ ਸਿਰ ਕਰੋ ਅਤੇ ਪ੍ਰਤੀ ਏਕੜ ਸਿਫਾਰਿਸ਼ ਕੀਤਾ ਬੀਜ ਹੀ ਵਰਤੋ।`;
    }

    // 17. Mandi Rates / Prices
    if (q.includes('ਮੰਡੀ') || q.includes('ਭਾਵ') || q.includes('mandi') || q.includes('price') || q.includes('rate') || q.includes('bhav')) {
      if (lang === 'DEVANAGARI') {
        return `📊 **आज के ताजा मंडी भाव ("${userQueryTitle}"):**\n\n• **गेहूं:** ₹2,275 - ₹2,450 / क्विंटल\n• **धान:** ₹3,800 - ₹4,250 / क्विंटल\n• **टमाटर:** ₹1,400 - ₹1,800 / क्विंटल\n• **सरसों:** ₹5,400 - ₹5,850 / क्विंटल\n\n💡 *ज़िलेवार ताज़ा भाव देखने के लिए FarmsKing "Mandi Rates" टैब का उपयोग करें।`;
      }
      if (lang === 'ENGLISH') {
        return `📊 **Today Live Mandi Rates ("${userQueryTitle}"):**\n\n• **Wheat:** ₹2,275 - ₹2,450 / Quintal\n• **Paddy:** ₹3,800 - ₹4,250 / Quintal\n• **Tomato:** ₹1,400 - ₹1,800 / Quintal\n• **Mustard:** ₹5,400 - ₹5,850 / Quintal\n\n💡 *Check live district updates anytime in FarmsKing "Mandi Rates" tab.`;
      }
      return `📊 **ਅੱਜ ਦੇ ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਵ ("${userQueryTitle}"):**\n\n• **ਕਣਕ:** ₹2,275 - ₹2,450 / ਕੁਇੰਟਲ\n• **ਝੋਨਾ (ਬਾਸਮਤੀ):** ₹3,800 - ₹4,250 / ਕੁਇੰਟਲ\n• **ਟਮਾਟਰ:** ₹1,400 - ₹1,800 / ਕੁਇੰਟਲ\n• **ਸਰ੍ਹੋਂ:** ₹5,400 - ₹5,850 / ਕੁਇੰਟਲ\n\n💡 *ਜ਼ਿਲ੍ਹੇਵਾਰ ਤਾਜ਼ਾ ਭਾਵ ਦੇਖਣ ਲਈ FarmsKing "Mandi Rates" ਟੈਬ ਦੀ ਵਰਤੋਂ ਕਰੋ।`;
    }

    // 18. Weather Advisory
    if (q.includes('ਮੌਸਮ') || q.includes('mausam') || q.includes('weather') || q.includes('rain') || q.includes('barish')) {
      if (lang === 'DEVANAGARI') {
        return `🌤️ **मौसम एवं कृषि सलाह ("${userQueryTitle}"):**\n\n• 7 दिनों का मौसम पूर्वानुमान FarmsKing होम डैशबोर्ड पर देखें।\n• **स्प्रे सलाह:** तेज़ हवा या बारिश की संभावना होने पर स्प्रे न करें।`;
      }
      if (lang === 'ENGLISH') {
        return `🌤️ **Weather Advisory ("${userQueryTitle}"):**\n\n• Check live 7-day temperature & rainfall forecast on FarmsKing Dashboard.\n• **Spraying Tip:** Avoid chemical sprays when wind speed exceeds 15 km/h or rain is expected.`;
      }
      return `🌤️ **ਮੌਸਮ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ("${userQueryTitle}"):**\n\n• 7 ਦਿਨਾਂ ਦਾ ਮੌਸਮ ਅਤੇ ਬਾਰਿਸ਼ ਦਾ ਪੂਰਵ-ਅਨੁਮਾਨ FarmsKing ਹੋਮ ਡੈਸ਼ਬੋਰਡ 'ਤੇ ਦੇਖੋ।\n• **ਸਪ੍ਰੇ ਦੀ ਸਲਾਹ:** ਤੇਜ਼ ਹਵਾ (15 km/h ਤੋਂ ਵੱਧ) ਜਾਂ 4 ਘੰਟਿਆਂ ਵਿੱਚ ਬਾਰਿਸ਼ ਦੀ ਸੰਭਾਵਨਾ ਹੋਵੇ ਤਾਂ ਸਪ੍ਰੇ ਨਾ ਕਰੋ।`;
    }

    // 19. Greetings & Friendly Chat
    if (q.includes('hi') || q.includes('hello') || q.includes('sat sri akal') || q.includes('namaste') || q.includes('dasso') || q.includes('batao') || q.includes('help') || q.includes('doctor')) {
      if (lang === 'DEVANAGARI') {
        return `🌾 **नमस्ते जी! (FarmsKing AI कृषि डॉक्टर 👨‍🌾):**\n\nबताएं, आज आपकी किस फसल, खाद, स्प्रे, मंडी भाव या FarmsKing ऐप में सहायता करूँ?`;
      }
      if (lang === 'ENGLISH') {
        return `🌾 **Hello! Welcome to FarmsKing Agri AI Doctor 👨‍🌾:**\n\nHow can I assist your farm today? Ask about crops, pests, fertilizers, sprays, weather, or FarmsKing features!`;
      }
      return `🌾 **ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! (FarmsKing AI ਖੇਤੀ ਡਾਕਟਰ 👨‍🌾):**\n\nਦੱਸੋ ਜੀ, ਅੱਜ ਤੁਹਾਡੀ ਕਿਸ ਫਸਲ (ਕਣਕ, ਝੋਨਾ, ਨਰਮਾ, ਗੰਨਾ, ਆਲੂ, ਟਮਾਟਰ, ਗੇਂਦਾ), ਖਾਦ, ਸਪ੍ਰੇ, ਮੰਡੀ ਭਾਵ ਜਾਂ FarmsKing ਐਪ ਬਾਰੇ ਮਦਦ ਕਰਾਂ?`;
    }

    // 20. Dynamic Targeted Advice for any specific farming query
    if (lang === 'DEVANAGARI') {
      return `🌾 **कृषि विशेषज्ञ सलाह — "${userQueryTitle}":**\n\n1. **फसल देखभाल:** आपके प्रश्न ("${userQueryTitle}") के अनुसार समय पर सिंचाई करें और अनुशंसित उर्वरक (यूरिया / DAP) दें।\n2. **रोग निगरानी:** खेत की 3 दिनों में जांच करें और शुरुआती लक्षण दिखने पर उपयुक्त फफूंदनाशक छिड़कें।\n3. **जैविक सुरक्षा:** 5% नीम अर्क या ट्राइकोडरमा का प्रयोग करें।\n4. **FarmsKing Store:** असली दवाएं और बीज सीधे FarmsKing ऐप से घर मंगाएं।`;
    }
    if (lang === 'ENGLISH') {
      return `🌾 **Agricultural Expert Advice — "${userQueryTitle}":**\n\n1. **Crop Health:** Regarding your question ("${userQueryTitle}"), ensure timely irrigation and balanced NPK fertilizer top-dressing.\n2. **Disease & Pest Watch:** Monitor leaf surfaces every 3 days. Apply recommended fungicides/pesticides early.\n3. **Organic Protection:** Use 5% Neem seed extract or Trichoderma bio-control.\n4. **FarmsKing Store:** Order genuine sprays, seeds, and fertilizers with doorstep delivery on FarmsKing.`;
    }
    return `🌾 **ਖੇਤੀਬਾੜੀ ਮਾਹਰ ਸਲਾਹ — "${userQueryTitle}":**\n\n1. **ਫਸਲ ਦੀ ਦੇਖਭਾਲ:** ਤੁਹਾਡੇ ਸਵਾਲ ("${userQueryTitle}") ਅਨੁਸਾਰ ਸਮੇਂ ਸਿਰ ਪਾਣੀ ਅਤੇ PAU ਸਿਫਾਰਿਸ਼ ਅਨੁਸਾਰ ਖਾਦਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ।\n2. **ਬੀਮਾਰੀ ਦੀ ਜਾਂਚ:** ਹਰ 3 ਦਿਨਾਂ ਬਾਅਦ ਪੱਤਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ। ਸ਼ੁਰੂਆਤ 'ਚ ਹੀ ਸਪ੍ਰੇ ਕਰੋ।\n3. **ਜੈਵਿਕ ਸੁਰੱਖਿਆ:** 5% ਨਿੰਮ ਦਾ ਅਰਕ ਜਾਂ ਟ੍ਰਾਈਕੋਡਰਮਾ ਦੀ ਵਰਤੋਂ ਕਰੋ।\n4. **FarmsKing Store:** ਅਸਲੀ ਦਵਾਈਆਂ ਤੇ ਖਾਦਾਂ FarmsKing ਐਪ ਤੋਂ ਘਰ ਬੈਠੇ ਮੰਗਵਾਓ।`;
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

    // AI Processing with Strict Agricultural Guardrail & Exact Language Matching
    setTimeout(() => {
      let aiText = '';
      let category: 'FARMING' | 'NON_FARMING_BLOCKED' = 'FARMING';
      const lang = detectLanguage(query);

      if (isExplicitNonFarming(query)) {
        category = 'NON_FARMING_BLOCKED';
        if (lang === 'GURMUKHI' || lang === 'PUNJABI_ROMAN') {
          aiText = '⚠️ **ਸਿਰਫ਼ ਖੇਤੀਬਾੜੀ ਸਵਾਲ / Sirf Kheti Sawal:**\n\nਮੈਂ FarmsKing ਦਾ AI ਖੇਤੀ ਡਾਕਟਰ 🌾 ਹਾਂ।\nਮੈਂ ਸਿਰਫ਼ ਫਸਲਾਂ, ਖਾਦਾਂ, ਸਪ੍ਰੇਆਂ, ਬੀਜਾਂ, ਮੌਸਮ ਅਤੇ ਮੰਡੀ ਭਾਵਾਂ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲਾਂ ਦੇ ਜਵਾਬ ਦੇ ਸਕਦਾ ਹਾਂ।\n\nਕਿਰਪਾ ਕਰਕੇ ਆਪਣੀ ਫਸਲ ਜਾਂ ਖੇਤੀਬਾੜੀ ਨਾਲ ਸਬੰਧਤ ਸਵਾਲ ਪੁੱਛੋ!';
        } else if (lang === 'DEVANAGARI' || lang === 'HINDI_ROMAN') {
          aiText = '⚠️ **केवल कृषि संबंधी प्रश्न / Sirf Kheti Sawal:**\n\nमैं FarmsKing का AI खेती डॉक्टर 🌾 हूँ।\nमैं केवल फसलों, उर्वरकों, स्प्रे, बीजों, मौसम और मंडी भावों से संबंधित प्रश्नों के उत्तर दे सकता हूँ।\n\nकृपया अपनी फसल या खेती से जुड़ा सवाल पूछें!';
        } else {
          aiText = '⚠️ **Agricultural Questions Only:**\n\nI am FarmsKing\'s AI Kheti Doctor 🌾.\nI can only answer questions related to crops, fertilizers, sprays, seeds, weather, and mandi rates.\n\nPlease ask a question related to your crops or farming!';
        }
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
              <Text style={styles.headerSubtitle}>100% Free Smart Agricultural Assistant · Supports All Languages</Text>
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
