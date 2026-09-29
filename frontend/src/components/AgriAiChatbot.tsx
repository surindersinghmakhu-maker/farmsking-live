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

    // Direct language switch request
    if (qLower.includes('punjabi') || qLower.includes('gurmukhi') || /[\u0A00-\u0A7F]/.test(query)) {
      return 'GURMUKHI';
    }
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
    const punjabiWords = ['krda', 'karda', 'krdi', 'kardi', 'ha', 'haan', 'han', 'hunda', 'hunde', 'vich', 'te', 'nu', 'saada', 'saadi', 'tuhanu', 'puaa', 'pao', 'karni', 'dasso', 'mera', 'meri', 'de', 'da', 'di', 'khet', 'khetan', 'laayi', 'layi', 'pind', 'kisaan', 'paude', 'kra', 'paani', 'din'];
    const hindiWords = ['krta', 'karta', 'krti', 'karti', 'hu', 'hoon', 'hai', 'hain', 'kaise', 'kya', 'kaun', 'chahiye', 'batao', 'karein', 'kare', 'ki', 'ke', 'ko', 'mein', 'se', 'par', 'karte', 'hoge', 'karo', 'dijiye', 'paudhe'];

    let pCount = 0;
    let hCount = 0;
    const words = qLower.split(/\s+/);

    words.forEach(w => {
      if (punjabiWords.includes(w)) pCount++;
      if (hindiWords.includes(w)) hCount++;
    });

    if (qLower.includes('krda') || qLower.includes('karda') || qLower.includes('di kheti') || qLower.includes('da ilaaj') || qLower.includes('paude') || qLower.includes('spray kra')) {
      return 'GURMUKHI';
    }
    if (qLower.includes('krta') || qLower.includes('karta') || qLower.includes('ki kheti') || qLower.includes('kaise kare')) {
      return 'DEVANAGARI';
    }

    if (pCount > hCount && pCount > 0) return 'GURMUKHI';
    if (hCount > pCount && hCount > 0) return 'DEVANAGARI';

    const localCropWords = ['genda', 'kanak', 'jhona', 'narma', 'ganna', 'aloo', 'tamatar', 'sarson', 'fasal', 'beej', 'khad', 'kheti', 'mausam', 'mandi', 'bhav', 'dawai', 'ilaaj'];
    if (localCropWords.some(w => qLower.includes(w))) {
      return 'GURMUKHI';
    }

    return 'ENGLISH';
  };

  const generateAgriResponse = (query: string): string => {
    const q = query.toLowerCase();
    const lang = detectLanguage(query);

    // 0. Language Request Command ("punjabi language vich gall kro", "use punjabi language")
    if ((q.includes('punjabi') || q.includes('ਪੰਜਾਬੀ')) && (q.includes('language') || q.includes('gall') || q.includes('use') || q.includes('speak') || q.includes('vich'))) {
      return '🌾 **ਸਤਿ ਸ਼੍ਰੀ ਅਕਾਲ ਜੀ! (FarmsKing AI ਖੇਤੀ ਡਾਕਟਰ):**\n\nਜੀ ਹਾਂ, ਹੁਣ ਮੈਂ ਤੁਹਾਡੇ ਨਾਲ ਪੂਰੀ ਤਰ੍ਹਾਂ ਪੰਜਾਬੀ (ਗੁਰਮੁਖੀ) ਵਿੱਚ ਗੱਲਬਾਤ ਕਰਾਂਗਾ।\n\nਤੁਸੀਂ ਆਪਣੀ ਫਸਲ (ਕਣਕ, ਝੋਨਾ, ਨਰਮਾ, ਗੰਨਾ, ਆਲੂ, ਟਮਾਟਰ, ਗੇਂਦਾ), ਖਾਦਾਂ, ਯੂਰੀਆ, 20 ਦਿਨਾਂ ਦੇ ਪੌਦਿਆਂ ਲਈ ਸਪ੍ਰੇ, ਮੰਡੀ ਭਾਵ ਅਤੇ ਮੌਸਮ ਬਾਰੇ ਕੋਈ ਵੀ ਸਵਾਲ ਪੁੱਛੋ!';
    }

    // 0.1 Plant Age / 20-Day Crop Spray Advisory ("20 din de paude", "ki spray kra", "paude ho gye")
    if (q.includes('20 din') || q.includes('paude') || q.includes('paudhe') || q.includes('spray kra') || q.includes('spray kare') || q.includes('15 din') || q.includes('25 din') || q.includes('30 din')) {
      if (lang === 'DEVANAGARI') {
        return '🌱 **20-25 दिनों के पौधों के लिए पहली सिंचाई और स्प्रे (PAU सलाह):**\n\n1. **पहली सिंचाई एवं यूरिया:** 20-22 दिनों के पौधों को पहला पानी दें और प्रति एकड़ 45kg (1 बोरी) यूरिया की टॉप-ड्रेसिंग करें।\n2. **खरपतवार नियंत्रण:** गुल्ली डंडा या चौड़ी पत्ती के खरपतवारों के लिए सिंचाई के 3-4 दिन बाद खरपतवार नाशक स्प्रे करें।\n3. **ग्रोथ बूस्टर स्प्रे:** पौधों के अच्छे फुटाव के लिए 1kg NPK (19:19:19) प्रति एकड़ 200L पानी में मिलाकर छिड़काव करें।\n4. **दवा ऑर्डर:** FarmsKing Store से असली 19:19:19 और खरपतवार नाशक मंगाएं।';
      }
      if (lang === 'ENGLISH') {
        return '🌱 **20-25 Day Plant Growth & Spray Advisory (PAU Advisory):**\n\n1. **First Irrigation & Urea:** Apply 1st irrigation at 20-22 days followed by top-dressing 45kg Urea per acre.\n2. **Weed Control Spray:** Spray recommended post-emergence herbicide 3-4 days after irrigation.\n3. **Foliar Growth Spray:** Spray 1kg NPK (19:19:19) per acre in 200L water to boost root tillering and plant health.\n4. **Order Online:** Buy genuine NPK 19:19:19 and sprays on FarmsKing Store.';
      }
      return '🌱 **20-25 ਦਿਨਾਂ ਦੇ ਪੌਦਿਆਂ ਲਈ ਪਹਿਲਾ ਪਾਣੀ ਅਤੇ ਸਪ੍ਰੇ (PAU ਸਿਫਾਰਿਸ਼):**\n\n1. **ਪਹਿਲਾ ਪਾਣੀ ਅਤੇ ਯੂਰੀਆ:** 20-22 ਦਿਨਾਂ ਦੀ ਫਸਲ ਨੂੰ ਪਹਿਲਾ ਪਾਣੀ ਲਾਓ ਅਤੇ ਪਾਣੀ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ ਪ੍ਰਤੀ ਏਕੜ 45kg (1 ਗੱਟਾ) ਯੂਰੀਆ ਦਿਓ।\n2. **ਨਦੀਨ ਨਾਸ਼ਕ ਸਪ੍ਰੇ:** ਗੁੱਲੀ ਡੰਡਾ ਜਾਂ ਚੌੜੇ ਪੱਤੇ ਵਾਲੇ ਨਦੀਨਾਂ ਲਈ ਪਾਣੀ ਤੋਂ 3-4 ਦਿਨ ਬਾਅਦ ਨਦੀਨ ਨਾਸ਼ਕ ਦੀ ਸਪ੍ਰੇ ਕਰੋ।\n3. **ਗ੍ਰੋਥ ਬੂਸਟਰ ਸਪ੍ਰੇ:** ਪੌਦਿਆਂ ਦੇ ਚੰਗੇ ਫੁੱਟਾਰੇ ਲਈ 1kg NPK (19:19:19) ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।\n4. **ਅਸਲੀ ਦਵਾਈਆਂ:** FarmsKing Store ਤੋਂ ਅਸਲੀ ਨਦੀਨ ਨਾਸ਼ਕ ਅਤੇ 19:19:19 ਖਾਦ ਮੰਗਵਾਓ।';
    }

    // 1. Marigold / Genda Flower Farming (ਗੇਂਦਾ / गेंदा / Marigold)
    if (q.includes('genda') || q.includes('gende') || q.includes('marigold') || q.includes('ਗੇਂਦਾ') || q.includes('ਗੇਂਦੇ') || q.includes('गेंदा') || q.includes('गेंदे')) {
      if (lang === 'PUNJABI_ROMAN') {
        return '🌼 **Gende di Kheti (Marigold Farming) Advisory:**\n\n1. **Vadiya Varieti:** Pusa Narangi Genda te Pusa Basanti Genda di kheti sab ton vadiya hai.\n2. **Khad & Paani:** Per acre 10 ton desi rudi khad + 40kg Nitrogen, 20kg Phosphorus paao. Paani 7-10 din baad devo.\n3. **Keeda & Spray:** Gende vich Sundi te Leaf Blight ton bachav layi Mancozeb (2g/L) te Neem Oil di spray karo.\n4. **Kamaayi:** 1 acre gende ton 80-100 quintal phool hunde han te bhot vadiya munafa milda hai.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '🌼 **Genda ki Kheti (Marigold Farming) Jankari:**\n\n1. **Unnat Kism:** Pusa Narangi Genda aur Pusa Basanti Genda ki kheti sabse behtareen hai.\n2. **Khad aur Sinchai:** Per acre 10 ton gobar khad + 40kg Nitrogen, 20kg Phosphorus dalein. 7-10 din me sinchai karein.\n3. **Kitaanu aur Spray:** Sundi aur leaf blight se bachav ke liye Mancozeb (2g/L paani) aur Neem Oil ki spray karein.\n4. **Munafa:** 1 acre genda ki kheti se 80-100 quintal phool hote hain aur achha labh milta hai.';
      }
      if (lang === 'GURMUKHI') {
        return '🌼 **ਗੇਂਦੇ ਦੀ ਖੇਤੀ (Marigold Farming) ਮਾਹਰ ਸਲਾਹ:**\n\n1. **ਉੱਤਮ ਕਿਸਮਾਂ:** ਪੂਸਾ ਨਾਰੰਗੀ ਗੇਂਦਾ ਅਤੇ ਪੂਸਾ ਬਸੰਤੀ ਗੇਂਦਾ ਦੀ ਬਿਜਾਈ ਸਭ ਤੋਂ ਵਧੀਆ ਹੈ।\n2. **ਖਾਦ ਅਤੇ ਪਾਣੀ:** 1 ਏਕੜ ਵਿੱਚ 10 ਟਨ ਦੇਸੀ ਰੂੜੀ ਖਾਦ + 40kg ਨਾਈਟ੍ਰੋਜਨ ਅਤੇ 20kg ਫਾਸਫੋਰਸ ਪਾਓ। 7-10 ਦਿਨਾਂ ਬਾਅਦ ਪਾਣੀ ਦਿਓ।\n3. **ਕੀੜੇ ਅਤੇ ਬੀਮਾਰੀ:** ਸੁੰਡੀ ਅਤੇ ਝੁਲਸ ਰੋਗ ਤੋਂ ਬਚਾਅ ਲਈ ਮੈਂਕੋਜ਼ੇਬ (2g/L) ਅਤੇ ਨਿੰਮ ਦੇ ਤੇਲ ਦੀ ਸਪ੍ਰੇ ਕਰੋ।\n4. **ਮੁਨਾਫ਼ਾ:** 1 ਏਕੜ ਗੇਂਦੇ ਤੋਂ 80-100 ਕੁਇੰਟਲ ਫੁੱਲ ਪ੍ਰਾਪਤ ਹੁੰਦੇ ਹਨ।';
      }
      if (lang === 'DEVANAGARI') {
        return '🌼 **गेंदा खेती (Marigold Farming) सलाह:**\n\n1. **उन्नत किस्में:** पूसा नारंगी गेंदा और पूसा बसंती गेंदा की खेती सबसे उत्तम है।\n2. **खाद एवं सिंचाई:** प्रति एकड़ 10 टन गोबर खाद + 40kg नाइट्रोजन, 20kg फास्फोरस दें। 7-10 दिनों में सिंचाई करें।\n3. **कीट एवं रोग नियंत्रण:** झुलसा रोग से बचाव के लिए मैंकोज़ेब (2g/L) और नीम तेल का छिड़काव करें।\n4. **उत्पादन:** 1 एकड़ से 80-100 क्विंटल फूल प्राप्त होते हैं।';
      }
      if (lang === 'BENGALI') {
        return '🌼 **গাঁদা ফুল চাষ (Marigold Farming) নির্দেশিকা:**\n\n১. **উন্নত জাত:** পুসা নারঙ্গী গাঁদা এবং পুসা বাসন্তী গাঁদা চাষের জন্য সেরা।\n২. **সার ও সেচ:** একর প্রতি ১০ টন জৈব সার + ৪০ কেজি নাইট্রোজেন এবং ২০ কেজি ফসফরাস প্রয়োগ করুন।\n৩. **পোকা ও রোগ দমনে:** ম্যানকোজেব (২ গ্রাম/লিটার) এবং নিম তেলের স্প্রে করুন।\n৪. **ফলন:** প্রতি একরে ৮০-১০০ কুইন্টাল ফুল পাওয়া যায়।';
      }
      if (lang === 'TELUGU') {
        return '🌼 **బంతి పూల సాగు (Marigold Farming) సలహా:**\n\n1. **మేలైన రకాలు:** పూసా నారంగి బంతి మరియు పూసా బసంతి బంతి సాగుకు అనుకూలం.\n2. **ఎరువులు:** ఎకరాకు 10 టన్నుల పశువుల ఎరువు + 40 కిలోల నత్రజని, 20 కిలోల భాస్వరం వాడండి.\n3. **తెగుళ్ల నివారణ:** మ్యాంకోజెబ్ (2గ్రా/లీ) మరియు వేప నూనె పిచికారీ చేయండి.';
      }
      if (lang === 'TAMIL') {
        return '🌼 **சாமந்திப் பூ சாகுபடி (Marigold Farming) வழிகாட்டி:**\n\n1. **சிறந்த ரகங்கள்:** பூசா நாரங்கி மற்றும் பூசா பசந்தி சாமந்தி சாகுபடிக்கு ஏற்றது.\n2. **உரம் மற்றும் பாசனம்:** ஏக்கருக்கு 10 டன் தொழு உரம் + 40 கிலோ நைட்ரஜன், 20 கிலோ பாஸ்பரஸ் இடவும்.\n3. **பூச்சி கட்டுப்பாடு:** மேன்கோசெப் (2 கிராம்/லிட்டர்) மற்றும் வேப்ப எண்ணெய் தெளிக்கவும்.';
      }
      if (lang === 'KANNADA') {
        return '🌼 **ಚೆಂಡು ಹೂವು ಬೇಸಾಯ (Marigold Farming) ಸಲಹೆ:**\n\n1. **ಉತ್ತಮ ತಳಿಗಳು:** ಪೂಸಾ ನಾರಂಗಿ ಮತ್ತು ಪೂಸಾ ಬಸಂತಿ ತಳಿಗಳು ಅತ್ಯುತ್ತಮವಾಗಿವೆ.\n2. **ಗೊಬ್ಬರ ಮತ್ತು ನೀರಾವರಿ:** ಎಕರೆಗೆ 10 ಟನ್ ಸೌದೆ ಗೊಬ್ಬರ + 40 ಕೆಜಿ ಸಾರಜನಕ ಬಳಸಿ.\n3. **ಕೀಟ ನಿಯಂತ್ರಣ:** ಮ್ಯಾಂಕೋಜೆಬ್ (2ಗ್ರಾಂ/ಲೀಟರ್) ಮತ್ತು ಬೇವಿನ ಎಣ್ಣೆ ಸಿಂಪಡಿಸಿ.';
      }
      if (lang === 'GUJARATI') {
        return '🌼 **ગલગોટાની ખેતી (Marigold Farming) માર્ગદર્શન:**\n\n૧. **ઉત્તમ જાતો:** પૂસા નારંગી ગલગોટા અને પૂસા બસંતી ગલગોટાની ખેતી ઉત્તમ છે.\n૨. **ખાતર અને પિયત:** એકર દીઠ ૧૦ ટન છાણિયું ખાતર + ૪૦ કિગ્રા નાઇટ્રોજન આપો.\n૩. **રોગ નિયંત્રણ:** મેન્કોઝેબ (૨ ગ્રામ/લીટર) અને લીમડાના તેલનો છંટકાવ કરો.';
      }
      return '🌼 **Marigold (Genda) Farming Complete Guide:**\n\n1. **Best Varieties:** Pusa Narangi Gainda & Pusa Basanti Gainda yield high-quality blooms.\n2. **Fertilizer & Irrigation:** Apply 10 tons FYM compost + 40kg N, 20kg P per acre. Irrigate every 7-10 days.\n3. **Pest & Disease Control:** Spray Mancozeb @ 2g/L water for leaf blight and Neem Oil for aphid prevention.\n4. **Yield & Profit:** 1 acre produces 80-100 quintals of flowers with high market demand.';
    }

    // 2. Wheat / Kanak / Gehu / Yellow Rust
    if (q.includes('ਕਣਕ') || q.includes('wheat') || q.includes('ਕੁੰਗੀ') || q.includes('rust') || q.includes('ਗੇਂਹੂ') || q.includes('kanak') || q.includes('gehu')) {
      if (lang === 'GURMUKHI') {
        return '🌾 **ਕਣਕ ਦੀ ਪੀਲੀ ਕੁੰਗੀ ਦਾ ਹੱਲ (PAU ਸਿਫਾਰਿਸ਼):**\n\n1. **ਸਪ੍ਰੇ:** ਪ੍ਰੋਪੀਕੋਨਾਜ਼ੋਲ 25% EC (ਟਿਲਟ / Tilt) 200 ਮਿ.ਲੀ. ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਛਿੜਕਾਅ ਕਰੋ।\n2. **ਸਾਵਧਾਨੀ:** ਬੱਦਲਵਾਈ ਵਾਲੇ ਮੌਸਮ ਵਿੱਚ ਜ਼ਿਆਦਾ ਯੂਰੀਆ ਪਾਉਣ ਤੋਂ ਪਰਹੇਜ਼ ਕਰੋ।\n3. **ਦੇਸੀ ਹੱਲ:** 5% ਨਿੰਮ ਦਾ ਅਰਕ ਜਾਂ ਖੱਟੀ ਲੱਸੀ (5L/200L ਪਾਣੀ) ਦਾ ਛਿੜਕਾਅ ਕਰੋ।\n4. **ਦਵਾਈ ਖਰੀਦੋ:** FarmsKing Store ਤੋਂ ਅਸਲੀ ਟਿਲਟ 25% EC ਮੰਗਵਾਓ।';
      }
      if (lang === 'DEVANAGARI') {
        return '🌾 **गेहूं का पीला रतुआ (Yellow Rust) समाधान:**\n\n1. **स्प्रे:** प्रोपिकोनाज़ोल 25% EC (टिल्ट / Tilt) 200 मिली प्रति एकड़ 200 लीटर पानी में मिलाकर छिड़काव करें।\n2. **सावधानी:** बादलों वाले मौसम में अत्यधिक यूरिया का उपयोग न करें।\n3. **जैविक उपाय:** 5% नीम का अर्क या खट्टी छाछ का छिड़काव करें।\n4. **दवा खरीदें:** FarmsKing Store से असली दवा ऑर्डर करें।';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '🌾 **Kanak di Peeli Kungi (Yellow Rust) da Ilaaj:**\n\n1. **Spray:** Propiconazole 25% EC (Tilt) @ 200ml per acre 200 Liters paani vich milake spray karo.\n2. **Parhez:** Badal wale mausam vich zyada Urea na paao.\n3. **Desi Ilaaj:** 5% Neem extract ya khatti lassi (5L in 200L paani) di spray karo.\n4. **Dawai Order:** FarmsKing Store ton original Tilt spray mangwaao.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '🌾 **Gehun ka Peela Ratua (Yellow Rust) Ilaaj:**\n\n1. **Spray:** Propiconazole 25% EC (Tilt) @ 200ml per acre 200 Liters paani me milakar spray karein.\n2. **Parhez:** Badal wale mausam me zyada Urea mat dalein.\n3. **Desi Ilaaj:** 5% Neem extract ya khatti chach ki spray karein.\n4. **Dawa Order:** FarmsKing Store se original Tilt spray manguayein.';
      }
      return '🌾 **Wheat Yellow Rust Treatment Advisory:**\n\n1. **Chemical Spray:** Propiconazole 25% EC (Tilt / FarmsKing CropProtect) @ 200 ml per acre mixed in 200 Liters of water.\n2. **Precaution:** Avoid excessive Urea application during cloudy humid weather.\n3. **Organic Remedy:** Spray 5% Neem seed extract or sour buttermilk solution (5L in 200L water).\n4. **Order Online:** Genuine Tilt 25% EC is available on FarmsKing Store.';
    }

    // 3. Paddy / Rice / Jhona / Dhan / Blast / Sheath Blight
    if (q.includes('ਝੋਨਾ') || q.includes('paddy') || q.includes('rice') || q.includes('dhan') || q.includes('jhona') || q.includes('blast') || q.includes('sheath')) {
      if (lang === 'GURMUKHI') {
        return '🌱 **ਝੋਨੇ ਦਾ ਬਲਾਸਟ ਅਤੇ ਝੁਲਸ ਰੋਗ ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਟ੍ਰਾਈਸਾਈਕਲਾਜ਼ੋਲ 75% WP (ਬਾਨ / Beam) 120 ਗ੍ਰਾਮ ਪ੍ਰਤੀ ਏਕੜ 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n2. **ਸਾਵਧਾਨੀ:** ਦਾਗ਼ ਦਿਸਣ ਤੇ ਯੂਰੀਆ ਪਾਉਣਾ ਤੁਰੰਤ ਬੰਦ ਕਰੋ।\n3. **ਜੈਵਿਕ ਹੱਲ:** ਟ੍ਰਾਈਕੋਡਰਮਾ ਵਿਰਡੀ 1 ਕਿੱਲੋ ਪ੍ਰਤੀ ਏਕੜ ਰੂੜੀ ਦੀ ਖਾਦ ਨਾਲ ਮਿਲਾ ਕੇ ਪਾਓ।';
      }
      if (lang === 'DEVANAGARI') {
        return '🌱 **धान का झुलसा (Leaf Blast) रोग समाधान:**\n\n1. **स्प्रे:** ट्राइसाइक्लाज़ोल 75% WP 120 ग्राम प्रति एकड़ 200 लीटर पानी में मिलाकर छिड़कें।\n2. **सावधानी:** धब्बे दिखने पर तुरंत नाइट्रोजन देना बंद करें।\n3. **जैविक उपाय:** ट्राइकोडरमा विरिडी 1 किग्रा प्रति एकड़ जैविक खाद के साथ प्रयोग करें।';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '🌱 **Jhone da Blast & Jhulas Beemari da Ilaaj:**\n\n1. **Spray:** Tricyclazole 75% WP @ 120g per acre 200L paani vich milake spray karo.\n2. **Parhez:** Dhabbe dekhte hi Urea paana band karo.\n3. **Desi Ilaaj:** Trichoderma viride 1kg per acre desi rudi khad vich milake paao.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '🌱 **Dhan ka Jhulsa (Blast) Rog Ilaaj:**\n\n1. **Spray:** Tricyclazole 75% WP @ 120g per acre 200L paani me milakar spray karein.\n2. **Parhez:** Dhabbe dikhte hi Urea daalna band karein.\n3. **Desi Ilaaj:** Trichoderma viride 1kg per acre desi gobar khad me milakar dalein.';
      }
      return '🌱 **Paddy Leaf Blast & Sheath Blight Solution:**\n\n1. **Chemical Spray:** Tricyclazole 75% WP (Baan / Beam) @ 120g per acre in 200 Liters of water.\n2. **Precaution:** Stop top-dressing Nitrogen fertilizers immediately when leaf spots appear.\n3. **Organic Remedy:** Apply Trichoderma viride bio-fungicide @ 1 kg per acre mixed with organic FYM compost.';
    }

    // 4. Cotton / Narma / Kapas / Whitefly / Sundi
    if (q.includes('ਨਰਮਾ') || q.includes('cotton') || q.includes('narma') || q.includes('kapas') || q.includes('whitefly') || q.includes('bollworm')) {
      if (lang === 'GURMUKHI') {
        return '☁️ **ਨਰਮੇ ਦੀ ਗੁਲਾਬੀ ਸੁੰਡੀ ਅਤੇ ਚਿੱਟੀ ਮੱਖੀ ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਇਮਾਮੈਕਟਿਨ ਬੈਂਜ਼ੋਏਟ 5% SG (100g) + ਸੇਫੀਨਾ (Sefina) 400ml ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n2. **ਦੇਸੀ ਹੱਲ:** ਨਿੰਮ ਦਾ ਤੇਲ (Neem Oil) 500ml ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕਾਅ ਕਰੋ।';
      }
      if (lang === 'DEVANAGARI') {
        return '☁️ **कपास की गुलाबी सुंडी और सफेद मक्खी का इलाज:**\n\n1. **स्प्रे:** इमामेक्टिन बेंजोएट 5% SG (100g) + सेफिना 400ml प्रति एकड़ 200L पानी में छिड़कें।\n2. **जैविक उपाय:** नीम का तेल 500ml प्रति एकड़ उपयोग करें।';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '☁️ **Narme di Gulabi Sundi & Chitti Makhi da Ilaaj:**\n\n1. **Spray:** Emamectin Benzoate 5% SG (100g) + Sefina 400ml per acre 200L paani vich milake spray karo.\n2. **Desi Ilaaj:** Neem Oil 500ml per acre di spray karo.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '☁️ **Kapas ki Gulabi Sundi aur Safed Makhi Ilaaj:**\n\n1. **Spray:** Emamectin Benzoate 5% SG (100g) + Sefina 400ml per acre 200L paani me milakar spray karein.\n2. **Desi Ilaaj:** Neem Oil 500ml per acre ki spray karein.';
      }
      return '☁️ **Cotton Whitefly & Pink Bollworm Remedy:**\n\n1. **Chemical Spray:** Emamectin Benzoate 5% SG (100g) + Afidopyropen (Sefina) @ 400ml per acre in 200L water.\n2. **Monitoring:** Install 5 Pheromone Traps per acre.\n3. **Organic Remedy:** Spray Neem Oil 10,000 PPM @ 500ml per acre.';
    }

    // 5. Sugarcane / Ganna / Kumaad / Red Rot
    if (q.includes('ਗੰਨਾ') || q.includes('sugarcane') || q.includes('ganna') || q.includes('kumaad') || q.includes('red rot')) {
      if (lang === 'GURMUKHI') {
        return '🎋 **ਗੰਨੇ ਦੇ ਰੱਤਾ ਰੋਗ (Red Rot) ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ / ਜੜ੍ਹਾਂ ਵਿੱਚ:** ਕਾਰਬੈਂਡਾਜ਼ਿਮ 50% WP (500g) ਪ੍ਰਤੀ ਏਕੜ ਪਾਣੀ ਵਿੱਚ ਮਿਲਾ ਕੇ ਜੜ੍ਹਾਂ \'ਚ ਪਾਓ।\n2. **ਜੈਵਿਕ ਹੱਲ:** ਟ੍ਰਾਈਕੋਡਰਮਾ 2.5 ਕਿੱਲੋ ਪ੍ਰਤੀ ਏਕੜ ਦੇਸੀ ਖਾਦ ਨਾਲ ਮਿਲਾ ਕੇ ਪਾਓ।';
      }
      if (lang === 'DEVANAGARI') {
        return '🎋 **गन्ने का लाल सड़न (Red Rot) रोग इलाज:**\n\n1. **उपचार:** कारबेन्डाजिम 50% WP (500g) प्रति एकड़ जड़ों में दें।\n2. **जैविक उपाय:** ट्राइकोडरमा 2.5 किग्रा प्रति एकड़ गोबर खाद में मिलाकर दें।';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '🎋 **Ganne di Ratta Beemari (Red Rot) da Ilaaj:**\n\n1. **Ilaaj:** Carbendazim 50% WP 500g per acre paani vich milake jadah vich paao.\n2. **Desi Ilaaj:** Trichoderma 2.5kg per acre desi rudi khad vich milake paao.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '🎋 **Ganne ki Laal Sadan (Red Rot) Ilaaj:**\n\n1. **Ilaaj:** Carbendazim 50% WP 500g per acre paani me milakar jadon me dalein.\n2. **Desi Ilaaj:** Trichoderma 2.5kg per acre desi gobar khad me milakar dalein.';
      }
      return '🎋 **Sugarcane Red Rot Disease Remedy:**\n\n1. **Soil Drenching:** Mix 500g Carbendazim 50% WP per acre in water and drench cane roots.\n2. **Bio-Control:** Apply Trichoderma harzianum @ 2.5 kg/acre mixed with organic compost.';
    }

    // 6. Potato / Aloo / Blight
    if (q.includes('ਆਲੂ') || q.includes('potato') || q.includes('aloo') || q.includes('blight')) {
      if (lang === 'GURMUKHI') {
        return '🥔 **ਆਲੂਆਂ ਦੇ ਝੁਲਸ ਰੋਗ ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਐਕਰੋਬੈਟ (Acrobat 400g) + ਮੈਂਕੋਜ਼ੇਬ (600g) 200 ਲੀਟਰ ਪਾਣੀ ਵਿੱਚ ਪ੍ਰਤੀ ਏਕੜ ਛਿੜਕੋ।\n2. **ਸਾਵਧਾਨੀ:** ਧੁੰਦ ਜਾਂ ਠੰਡ ਤੋਂ ਪਹਿਲਾਂ ਸਪ੍ਰੇ ਜ਼ਰੂਰ ਕਰੋ।';
      }
      if (lang === 'DEVANAGARI') {
        return '🥔 **आलू का झुलसा रोग इलाज:**\n\n1. **स्प्रे:** एक्रोबेट (400g) + मैंकोजेब (600g) 200 लीटर पानी में प्रति एकड़ छिड़कें।\n2. **सावधानी:** कोहरे से पहले फफूंदनाशक स्प्रे करें।';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '🥔 **Alooan de Jhulas Beemari da Ilaaj:**\n\n1. **Spray:** Acrobat (400g) + Mancozeb (600g) 200L paani vich per acre spray karo.\n2. **Parhez:** Dhund pehn ton pehle spray zaroor karo.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '🥔 **Aloo ka Jhulsa Rog Ilaaj:**\n\n1. **Spray:** Acrobat (400g) + Mancozeb (600g) 200L paani me per acre spray karein.\n2. **Parhez:** Kohre se pehle spray zaroor karein.';
      }
      return '🥔 **Potato Early & Late Blight Remedy:**\n\n1. **Chemical Spray:** Dimethomorph 50% WP (Acrobat 400g) + Mancozeb 75% WP (600g) in 200L water per acre.\n2. **Precaution:** Apply protective contact fungicide before heavy morning fog or frost.';
    }

    // 7. Tomato / Vegetables / Sabzi / Blight
    if (q.includes('ਟਮਾਟਰ') || q.includes('tomato') || q.includes('tamatar') || q.includes('ਸਬਜ਼ੀ') || q.includes('vegetable') || q.includes('blight')) {
      if (lang === 'GURMUKHI') {
        return '🍅 **ਟਮਾਟਰ ਅਤੇ ਸਬਜ਼ੀਆਂ ਦੇ ਝੁਲਸ ਰੋਗ ਦਾ ਹੱਲ:**\n\n1. **ਸਪ੍ਰੇ:** ਰਿਡੋਮਿਲ ਗੋਲਡ (Ridomil Gold) 500g ਪ੍ਰਤੀ ਏਕੜ 200L ਪਾਣੀ ਵਿੱਚ ਛਿੜਕੋ।\n2. **ਜੈਵਿਕ ਹੱਲ:** ਟ੍ਰਾਈਕੋਡਰਮਾ 1 ਕਿੱਲੋ ਪ੍ਰਤੀ ਏਕੜ ਦੇਸੀ ਖਾਦ ਨਾਲ ਪਾਓ।';
      }
      if (lang === 'DEVANAGARI') {
        return '🍅 **टमाटर और सब्जियों के झुलसा रोग का इलाज:**\n\n1. **स्प्रे:** रिडोमिल गोल्ड (Ridomil Gold) 500g प्रति एकड़ 200L पानी में छिड़कें।\n2. **जैविक उपाय:** ट्राइकोडरमा 1 किग्रा प्रति एकड़ देसी खाद में मिलाकर डालें।';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '🍅 **Tamatar & Sabziyan de Jhulas Beemari da Ilaaj:**\n\n1. **Spray:** Ridomil Gold 500g per acre 200L paani vich milake spray karo.\n2. **Desi Ilaaj:** Trichoderma 1kg per acre rudi khad vich milake paao.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '🍅 **Tamatar aur Sabziyon ke Jhulsa Rog Ilaaj:**\n\n1. **Spray:** Ridomil Gold 500g per acre 200L paani me milakar spray karein.\n2. **Desi Ilaaj:** Trichoderma 1kg per acre gobar khad me milakar dalein.';
      }
      return '🍅 **Tomato & Vegetable Blight Remedy:**\n\n1. **Chemical Spray:** Ridomil Gold (Mefenoxam + Mancozeb) @ 500g per acre in 200L water.\n2. **Bio-Remedy:** Trichoderma viride 1kg per acre mixed with organic FYM compost.';
    }

    // 8. Fertilizer / Khad / Urea / DAP / NPK / Spray / Medicine / Dawai
    if (q.includes('ਖਾਦ') || q.includes('fertilizer') || q.includes('urea') || q.includes('dap') || q.includes('npk') || q.includes('khad') || q.includes('spray') || q.includes('dawai') || q.includes('medicine')) {
      if (lang === 'GURMUKHI') {
        return '🌱 **ਖਾਦ ਅਤੇ ਸਪ੍ਰੇ ਦੀ ਸਿਫਾਰਿਸ਼ (PAU ਮਾਹਰ ਸਲਾਹ):**\n\n1. **ਬਿਜਾਈ ਵੇਲੇ:** 1 ਗੱਟਾ ਡੀ.ਏ.ਪੀ (50kg) + 1/2 ਗੱਟਾ ਪੋਟਾਸ਼ ਪ੍ਰਤੀ ਏਕੜ ਪਾਓ।\n2. **ਯੂਰੀਆ:** 45 ਕਿੱਲੋ ਯੂਰੀਆ ਪ੍ਰਤੀ ਏਕੜ ਪਹਿਲੇ ਅਤੇ ਦੂਜੇ ਪਾਣੀ ਨਾਲ 2-3 ਕਿਸ਼ਤਾਂ ਵਿੱਚ ਦਿਓ।\n3. **ਜੈਵਿਕ ਖਾਦ:** ਵਰਮੀਕੰਪੋਸਟ ਜਾਂ ਹਿਊਮਿਕ ਐਸਿਡ ਪਾ ਕੇ ਜ਼ਮੀਨ ਦੀ ਤਾਕਤ ਵਧਾਓ।\n4. **ਖਰੀਦਦਾਰੀ:** FarmsKing Store ਤੋਂ ਅਸਲੀ ਖਾਦਾਂ ਅਤੇ ਸਪ੍ਰੇਆਂ ਮੰਗਵਾਓ।';
      }
      if (lang === 'DEVANAGARI') {
        return '🌱 **खाद और स्प्रे की सिफारिश:**\n\n1. **बुआई के समय:** 1 बोरी डी.ए.पी (50kg) + 1/2 बोरी पोटाश प्रति एकड़ डालें।\n2. **यूरिया:** 45 किग्रा यूरिया प्रति एकड़ पहली और दूसरी सिंचाई पर 2-3 किस्तों में दें।\n3. **जैविक खाद:** वर्मीकंपोस्ट या ह्यूमिक एसिड का प्रयोग करें।\n4. **खरीददारी:** FarmsKing Store से असली दवाएं मंगाएं।';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '🌱 **Khad & Spray di Recommendation:**\n\n1. **Bijai Wele:** 1 bag DAP (50kg) + 1/2 bag Potash per acre paao.\n2. **Urea:** 45kg Urea per acre pehle te dooje paani naal 2-3 kishtan vich devo.\n3. **Desi Khad:** Vermicompost ya Humic Acid paake zameen di taakat vadhao.\n4. **Order Online:** Genuine fertilizers te spray FarmsKing Store ton buy karo.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '🌱 **Khad & Spray di Recommendation:**\n\n1. **Buai ke Samay:** 1 bag DAP (50kg) + 1/2 bag Potash per acre dalein.\n2. **Urea:** 45kg Urea per acre pehle aur doosre paani me 2-3 kishton me dein.\n3. **Desi Khad:** Vermicompost ya Humic Acid dalkar zameen ki shakti badhayein.\n4. **Order Online:** FarmsKing Store se asli khad aur spray order karein.';
      }
      return '🌱 **Fertilizer & Spray Recommendation:**\n\n1. **Basal Dose:** Apply 1 bag DAP (50kg) + 1/2 bag Potash (MOP) per acre during sowing.\n2. **Urea Application:** Top-dress 45kg Urea per acre in 2-3 split doses at first & second irrigation.\n3. **Organic Booster:** Apply Vermicompost (500kg/acre) or Humic Acid to improve soil health.\n4. **Order Online:** Genuine fertilizers and sprays are available on FarmsKing Store.';
    }

    // 9. Mandi Rates / Price / Rate / Bhav
    if (q.includes('ਮੰਡੀ') || q.includes('ਭਾਵ') || q.includes('mandi') || q.includes('price') || q.includes('rate') || q.includes('bhav')) {
      if (lang === 'GURMUKHI') {
        return '📊 **ਅੱਜ ਦੇ ਤਾਜ਼ਾ ਮੰਡੀ ਭਾਵ:**\n\n• **ਕਣਕ:** ₹2,275 - ₹2,450 / ਕੁਇੰਟਲ\n• **ਝੋਨਾ (ਬਾਸਮਤੀ):** ₹3,800 - ₹4,250 / ਕੁਇੰਟਲ\n• **ਟਮਾਟਰ:** ₹1,400 - ₹1,800 / ਕੁਇੰਟਲ\n• **ਸਰ੍ਹੋਂ:** ₹5,400 - ₹5,850 / ਕੁਇੰਟਲ\n\n💡 *ਜ਼ਿਲ੍ਹੇਵਾਰ ਤਾਜ਼ਾ ਭਾਵ ਦੇਖਣ ਲਈ "Mandi Rates" ਟੈਬ ਦੀ ਵਰਤੋਂ ਕਰੋ।*';
      }
      if (lang === 'DEVANAGARI') {
        return '📊 **आज के ताजा मंडी भाव:**\n\n• **गेहूं:** ₹2,275 - ₹2,450 / क्विंटल\n• **धान:** ₹3,800 - ₹4,250 / क्विंटल\n• **टमाटर:** ₹1,400 - ₹1,800 / क्विंटल\n• **सरसों:** ₹5,400 - ₹5,850 / क्विंटल\n\n💡 *ज़िलेवार ताज़ा भाव देखने के लिए "Mandi Rates" टैब का उपयोग करें।*';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '📊 **Ajj de Mandi Rate (Punjab & Haryana):**\n\n• **Kanak:** ₹2,275 - ₹2,450 / Quintal\n• **Jhona (Basmati):** ₹3,800 - ₹4,250 / Quintal\n• **Tamatar:** ₹1,400 - ₹1,800 / Quintal\n• **Sarson:** ₹5,400 - ₹5,850 / Quintal\n\n💡 *Live mandi rate dekhan layi "Mandi Rates" tab te jao.*';
      }
      if (lang === 'HINDI_ROMAN') {
        return '📊 **Aaj ke Mandi Rate:**\n\n• **Gehun:** ₹2,275 - ₹2,450 / Quintal\n• **Dhan (Basmati):** ₹3,800 - ₹4,250 / Quintal\n• **Tamatar:** ₹1,400 - ₹1,800 / Quintal\n• **Sarson:** ₹5,400 - ₹5,850 / Quintal\n\n💡 *Live mandi rate dekhne ke liye "Mandi Rates" tab par jayein.*';
      }
      return '📊 **Today Live Mandi Rates:**\n\n• **Wheat:** ₹2,275 - ₹2,450 / Quintal\n• **Paddy:** ₹3,800 - ₹4,250 / Quintal\n• **Tomato:** ₹1,400 - ₹1,800 / Quintal\n• **Mustard:** ₹5,400 - ₹5,850 / Quintal\n\n💡 *Check live district-wise updates anytime in the "Mandi Rates" tab.*';
    }

    // 10. Weather / Mausam / Rain / Barish
    if (q.includes('ਮੌਸਮ') || q.includes('mausam') || q.includes('weather') || q.includes('rain') || q.includes('barish')) {
      if (lang === 'GURMUKHI') {
        return '🌤️ **ਮੌਸਮ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਲਾਹ:**\n\n• 7 ਦਿਨਾਂ ਦਾ ਮੌਸਮ ਅਤੇ ਬਾਰਿਸ਼ ਦਾ ਪੂਰਵ-ਅਨੁਮਾਨ ਆਪਣੇ ਹੋਮ ਡੈਸ਼ਬੋਰਡ \'ਤੇ ਦੇਖੋ।\n• **ਸਪ੍ਰੇ ਦੀ ਸਲਾਹ:** ਤੇਜ਼ ਹਵਾ (15 km/h ਤੋਂ ਵੱਧ) ਜਾਂ 4 ਘੰਟਿਆਂ ਵਿੱਚ ਬਾਰਿਸ਼ ਦੀ ਸੰਭਾਵਨਾ ਹੋਵੇ ਤਾਂ ਸਪ੍ਰੇ ਨਾ ਕਰੋ।';
      }
      if (lang === 'DEVANAGARI') {
        return '🌤️ **मौसम और कृषि सलाह:**\n\n• 7 दिनों का मौसम पूर्वानुमान होम डैशबोर्ड पर देखें।\n• **स्प्रे सलाह:** तेज़ हवा या बारिश की संभावना होने पर स्प्रे न करें।';
      }
      if (lang === 'PUNJABI_ROMAN') {
        return '🌤️ **Mausam & Kheti Advisory:**\n\n• Live 7 days da mausam forecast app de Home Dashboard te dekho.\n• **Spray Tip:** Tej hawa ya barish di samabhavna hove ta spray na karo.';
      }
      if (lang === 'HINDI_ROMAN') {
        return '🌤️ **Mausam & Kheti Advisory:**\n\n• Live 7 days ka mausam forecast app ke Home Dashboard par dekhein.\n• **Spray Tip:** Tej hawa ya barish ki sambhavna hone par spray mat karein.';
      }
      return '🌤️ **Weather & Agricultural Advisory:**\n\n• Check live 7-day temperature, humidity, and rainfall forecast on your FarmsKing Home Dashboard.\n• **Spraying Tip:** Avoid chemical sprays when wind speed exceeds 15 km/h or rain is expected within 4 hours.';
    }

    // 11. General Agri / Default Advice across languages
    if (lang === 'GURMUKHI') {
      return '🌾 **ਖੇਤੀਬਾੜੀ ਮਾਹਰ ਦੀ ਸਲਾਹ:**\n\n1. **ਫਸਲ ਦੀ ਦੇਖਭਾਲ:** ਸਮੇਂ ਸਿਰ ਪਾਣੀ ਅਤੇ PAU ਸਿਫਾਰਿਸ਼ ਅਨੁਸਾਰ ਖਾਦਾਂ ਦੀ ਵਰਤੋਂ ਕਰੋ।\n2. **ਬੀਮਾਰੀ ਦੀ ਜਾਂਚ:** ਹਰ 3 ਦਿਨਾਂ ਬਾਅਦ ਪੱਤਿਆਂ ਦੀ ਜਾਂਚ ਕਰੋ। ਸ਼ੁਰੂਆਤ \'ਚ ਹੀ ਸਪ੍ਰੇ ਕਰੋ।\n3. **ਜੈਵਿਕ ਸੁਰੱਖਿਆ:** 5% ਨਿੰਮ ਦਾ ਅਰਕ ਜਾਂ ਟ੍ਰਾਈਕੋਡਰਮਾ ਦੀ ਵਰਤੋਂ ਕਰੋ।\n4. **ਦਵਾਈਆਂ:** FarmsKing Store ਤੋਂ ਅਸਲੀ ਦਵਾਈਆਂ ਤੇ ਖਾਦਾਂ ਘਰ ਬੈਠੇ ਮੰਗਵਾਓ।';
    }
    if (lang === 'DEVANAGARI') {
      return '🌾 **कृषि विशेषज्ञ सलाह:**\n\n1. **फसल देखभाल:** समय पर सिंचाई और संतुलित उर्वरक का प्रयोग करें।\n2. **रोग निगरानी:** हर 3 दिन में पत्तियों की जांच करें।\n3. **जैविक सुरक्षा:** 5% नीम अर्क या ट्राइकोडरमा का प्रयोग करें।\n4. **दवाइयां:** FarmsKing Store से असली उत्पाद मंगाएं।';
    }
    if (lang === 'PUNJABI_ROMAN') {
      return '🌾 **Kheti Baari Expert Advice:**\n\n1. **Fasal di dekhbhaal:** Same sir paani te PAU recommendation mutabiq khad paao.\n2. **Beemari check:** Har 3 din baad patteyan di jaanch karo. Shuru vich hi spray karo.\n3. **Desi Ilaaj:** 5% Neem extract ya Trichoderma di spray karo.\n4. **Dawai Order:** FarmsKing Store ton original products buy karo.';
    }
    if (lang === 'HINDI_ROMAN') {
      return '🌾 **Kheti Baari Expert Advice:**\n\n1. **Fasal ki dekhbhal:** Samay par paani aur sifarish ke anusar khad dalein.\n2. **Rog jaanch:** Har 3 din me pattiyon ki jaanch karein. Shuru me hi spray karein.\n3. **Desi Ilaaj:** 5% Neem extract ya Trichoderma ki spray karein.\n4. **Dawa Order:** FarmsKing Store se original products khareedein.';
    }
    return '🌾 **FarmsKing Agri Expert Advice:**\n\n1. **Crop Health:** Ensure timely irrigation and balanced NPK fertilizer application based on recommendations.\n2. **Disease Watch:** Inspect leaf surfaces every 3 days. Spot-spray early infected patches.\n3. **Organic Protection:** Use 5% Neem extract or Trichoderma to boost plant immunity.\n4. **FarmsKing AgriStore:** Order genuine sprays, seeds, and fertilizers with 24-hour delivery on FarmsKing Store.';
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
