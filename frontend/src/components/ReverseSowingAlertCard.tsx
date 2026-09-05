import React, { useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useLanguage } from '@/src/store/language-context';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export type LanguageCode = 'en' | 'pa' | 'hi' | 'bn' | 'mr' | 'gu' | 'ta' | 'te' | 'kn' | 'ml';

export interface LanguageOption {
  code: LanguageCode;
  label: string;
  native: string;
}

export const LANGUAGES: LanguageOption[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'pa', label: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
];

export interface FestivalEvent {
  id: string;
  state: string;
  religion: string;
  daysToEvent: number;
  sowWindowDays: number; // Days remaining to sow today
  translations: Record<
    LanguageCode,
    {
      eventName: string;
      sowAlertTitle: string;
      sowCrops: string[];
      sowAdvice: string;
      highDemand: string[];
      lowDemand: string[];
      strategyTip: string;
    }
  >;
}

export const FESTIVAL_DATA: FestivalEvent[] = [
  {
    id: 'diwali',
    state: 'Pan-India / All States',
    religion: 'Hindu / Sikh / National',
    daysToEvent: 66,
    sowWindowDays: 4,
    translations: {
      en: {
        eventName: '🪔 Grand Diwali & Dhanteras Surge',
        sowAlertTitle: '🌱 SOW TODAY FOR 3X DIWALI PRICE SURGE',
        sowCrops: ['Flowers', 'Cauliflower (Gobhi)', 'Green Peas (Matar)', 'Capsicum'],
        sowAdvice: 'Plant Marigold flowers & Early Peas today. Harvest right 3 days before Diwali for 300% market price surge.',
        highDemand: ['▲ Flowers (3x Surge)', '▲ Green Peas & Capsicum', '▲ Fresh Milk & Mawa', '▲ Sweet Vegetables'],
        lowDemand: ['▼ Stored Onions (Price Slump)', '▼ Coarse Grains', '▼ Non-Festival Leafy Greens'],
        strategyTip: '💡 Expert Tip: Inter-crop Marigold with Cauliflower to prevent pests naturally and double your income on Dhanteras!',
      },
      pa: {
        eventName: '🪔 ਦਿਵਾਲੀ ਅਤੇ ਧਨਤੇਰਸ ਬੰਪਰ ਮੰਗ',
        sowAlertTitle: '🌱 3 ਗੁਣਾ ਵੱਧ ਰੇਟ ਲਈ ਅੱਜ ਹੀ ਬੀਜੋ',
        sowCrops: ['ਫੁੱਲ (Flowers)', 'ਫੁੱਲ ਗੋਭੀ', 'ਹਰੇ ਮਟਰ', 'ਸ਼ਿਮਲਾ ਮਿਰਚ'],
        sowAdvice: 'ਫੁੱਲ ਅਤੇ ਅਗੇਤੇ ਮਟਰ ਅੱਜ ਹੀ ਬੀਜੋ। ਦਿਵਾਲੀ ਤੋਂ 3 ਦਿਨ ਪਹਿਲਾਂ ਵਢਾਈ ਕਰਕੇ ਮੰਡੀ ਵਿੱਚ 3 ਗੁਣਾ ਵੱਧ ਰੇਟ ਲਵੋ।',
        highDemand: ['▲ ਫੁੱਲ (3 ਗੁਣਾ ਰੇਟ)', '▲ ਹਰੇ ਮਟਰ ਅਤੇ ਸ਼ਿਮਲਾ ਮਿਰਚ', '▲ ਤਾਜ਼ਾ ਦੁੱਧ ਅਤੇ ਮੋਆ', '▲ ਮਿੱਠੀਆਂ ਸਬਜ਼ੀਆਂ'],
        lowDemand: ['▼ ਪੁਰਾਣਾ ਪਿਆਜ਼ (ਮੰਦਾ)', '▼ ਮੋਟਾ ਅਨਾਜ', '▼ ਆਮ ਪੱਤੇਦਾਰ ਸਬਜ਼ੀਆਂ'],
        strategyTip: '💡 ਮਾਹਿਰ ਦੀ ਸਲਾਹ: ਗੋਭੀ ਦੇ ਨਾਲ ਫੁੱਲ ਲਗਾਓ, ਇਸ ਨਾਲ ਕੀੜੇ ਵੀ ਨਹੀਂ ਲਗਣਗੇ ਅਤੇ ਧਨਤੇਰਸ ਉੱਤੇ ਦੁੱਗਣਾ ਮੁਨਾਫਾ ਹੋਵੇਗਾ!',
      },
      hi: {
        eventName: '🪔 भव्य दिवाली एवं धनतेरस बंपर मांग',
        sowAlertTitle: '🌱 3 गुना अधिक रेट के लिए आज ही बोएं',
        sowCrops: ['फूल (Flowers)', 'फूलगोभी', 'हरी मटर', 'शिमला मिर्च'],
        sowAdvice: 'फूल और अगेती मटर आज ही बोएं। दिवाली से 3 दिन पहले तुड़ाई करके मंडी में 300% अधिक दाम प्राप्त करें।',
        highDemand: ['▲ फूल (3 गुना दाम)', '▲ हरी मटर व शिमला मिर्च', '▲ ताजा दूध व मावा', '▲ पूजा की हरी सब्जियां'],
        lowDemand: ['▼ पुराना प्याज (मंदा)', '▼ मोटा अनाज', '▼ बिना त्यौहार वाली सब्जियां'],
        strategyTip: '💡 विशेषज्ञ सलाह: गोभी के साथ गेंदे की खेती करें, कीटों से सुरक्षा होगी और धनतेरस पर दोगुना लाभ मिलेगा!',
      },
      bn: {
        eventName: '🪔 দিওয়ালি ও ধানতেরাস বাম্পার চাহিদা',
        sowAlertTitle: '🌱 ৩ গুণ বেশি দাম পেতে আজই বপন করুন',
        sowCrops: ['ফুল', 'ফুলকপি', 'সবুজ কড়াইশুঁটি', 'ক্যাপসিকাম'],
        sowAdvice: 'আজই ফুল ও আগাম কড়াইশুঁটি রোপণ করুন। দিওয়ালির ৩ দিন আগে তুললে ৩ গুণ বাজারে দাম পাবেন।',
        highDemand: ['▲ ফুল (৩ গুণ দাম)', '▲ সবুজ কড়াইশুঁটি ও ক্যাপসিকাম', '▲ টাটকা দুধ ও ছানা', '▲ মিষ্টি সবজি'],
        lowDemand: ['▼ পুরনো পেঁয়াজ (দাম কম)', '▼ মোটা দানা শস্য', '▼ সাধারণ শাকসবজি'],
        strategyTip: '💡 পরামর্শ: ফুলকপির সাথে গাঁদা গাছ লাগান, পোকা কম হবে এবং ধানতেরাসে দ্বিগুণ লাভ হবে!',
      },
      mr: {
        eventName: '🪔 दिवाळी व धनत्रयोदशी बंपर मागणी',
        sowAlertTitle: '🌱 ३ पट जास्त दरासाठी आजच पेरा',
        sowCrops: ['झेंडूची फुले (Marigold)', 'फ्लॉवर (Cauliflower)', 'हिरवा मटार', 'शिमला मिरची'],
        sowAdvice: 'झेंडूची फुले व लवकरात लवकर मटार आजच लावा. दिवाळीच्या ३ दिवस आधी काढणी करून ३००% जास्त भाव मिळवा.',
        highDemand: ['▲ झेंडूची फुले (३ पट भाव)', '▲ हिरवा मटार व शिमला मिरची', '▲ ताजे दूध व मावा', '▲ पूजेच्या भाज्या'],
        lowDemand: ['▼ साठवलेला कांदा (मंदी)', '▼ जाडे धान्य', '▼ नेहमीच्या भाज्या'],
        strategyTip: '💡 तज्ज्ञ सल्ला: फ्लॉवरसोबत झेंडू लावा, किडीपासून संरक्षण होईल आणि धनत्रयोदशीला दुप्पट नफा मिळेल!',
      },
      gu: {
        eventName: '🪔 દિવાળી અને ધનતેરસ બમ્પર માંગ',
        sowAlertTitle: '🌱 3 ગણા ભાવ માટે આજે જ વાવણી કરો',
        sowCrops: ['ફૂલો (Flowers)', 'ફ્લાવર', 'લીલા વટાણા', 'કેપ્સિકમ'],
        sowAdvice: 'ગલગોટા અને વહેલા વટાણા આજે જ વાવો. દિવાળીના 3 દિવસ પહેલાં લણણી કરીને મંડીમાં 3 ગણા ભાવ મેળવો.',
        highDemand: ['▲ ફૂલો (3 ગણો ભાવ)', '▲ લીલા વટાણા અને કેપ્સિકમ', '▲ તાજું દૂધ અને માવો', '▲ પૂજાની શાકભાજી'],
        lowDemand: ['▼ જૂની ડુંગળી (મંદી)', '▼ મોટું અનાજ', '▼ સામાન્ય શાકભાજી'],
        strategyTip: '💡 નિષ્ણાત ટિપ: ફ્લાવર સાથે ગલગોટા વાવો, જીવાત નહીં આવે અને ધનતેરસ પર બમણો નફો થશે!',
      },
      ta: {
        eventName: '🪔 தீபாவளி & தனத்ரயோதசி அதிக தேவை',
        sowAlertTitle: '🌱 3 மடங்கு அதிக விலைக்கு இன்றே விதையுங்கள்',
        sowCrops: ['பூக்கள் (Flowers)', 'காலிபிளவர்', 'பச்சை பட்டாணி', 'குடைமிளகாய்'],
        sowAdvice: 'சாமந்தி மற்றும் பட்டாணியை இன்றே விதையுங்கள். தீபாவளிக்கு 3 நாட்கள் முன் அறுவடை செய்து 3 மடங்கு விலை பெறுங்கள்.',
        highDemand: ['▲ பூக்கள் (3x விலை ஏற்றம்)', '▲ பச்சை பட்டாணி & குடைமிளகாய்', '▲ புதிய பால் & பால்கட்டி', '▲ பூஜை காய்கறிகள்'],
        lowDemand: ['▼ பழைய வெங்காயம் (விலை குறைவு)', '▼ தானியங்கள்', '▼ சாதாரண கீரைகள்'],
        strategyTip: '💡 நிபுணர் குறிப்பு: காலிபிளவருடன் பூக்கள் பயிரிடுங்கள், பூச்சிகள் வராது, இரட்டிப்பு லாபம் கிடைக்கும்!',
      },
      te: {
        eventName: '🪔 దీపావళి & ధన్తేరస్ అధిక డిమాండ్',
        sowAlertTitle: '🌱 3 రెట్లు ఎక్కువ ధర కోసం నేడే విత్తండి',
        sowCrops: ['పూలు (Flowers)', 'కాలీఫ్లవర్', 'పచ్చి బఠాణీ', 'క్యాప్సికం'],
        sowAdvice: 'పూలు మరియు బఠాణీ నేడే నాటండి. దీపావళికి 3 రోజుల ముందు కోసి మార్కెట్‌లో 300% ఎక్కువ ధర పొందండి.',
        highDemand: ['▲ పూలు (3 రెట్ల ధర)', '▲ పచ్చి బఠాణీ & క్యాప్సికం', '▲ తాజా పాలు & కోవా', '▲ పూజ కూరగాయలు'],
        lowDemand: ['▼ నిల్వ ఉల్లిపాయలు (తక్కువ ధర)', '▼ తృణధాన్యాలు', '▼ సాధారణ ఆకుకూరలు'],
        strategyTip: '💡 నిపుణుల సలహా: కాలీఫ్లవర్‌తో పాటు పూలు నాటండి, పురుగులు రావు మరియు ధన్తేరస్‌లో రెట్టింపు లాభం!',
      },
      kn: {
        eventName: '🪔 ದೀಪಾವಳಿ ಮತ್ತು ಧನತ್ರಯೋದಶಿ ಭರ್ಜರಿ ಬೇಡಿಕೆ',
        sowAlertTitle: '🌱 3 ಪಟ್ಟು ಹೆಚ್ಚು ಬೆಲೆಗೆ ಇಂದೇ ಬಿತ್ತನೆ ಮಾಡಿ',
        sowCrops: ['ಹೂವುಗಳು (Flowers)', 'ಕೋಸು (Cauliflower)', 'ಹಸಿ ಬಟಾಣಿ', 'ಕ್ಯಾಪ್ಸಿಕಂ'],
        sowAdvice: 'ಹೂವುಗಳು ಮತ್ತು ಬಟಾಣಿ ಇಂದೇ ಬಿತ್ತಿ. ದೀಪಾವಳಿಗೆ 3 ದಿನ ಮುಂಚಿತವಾಗಿ ಕಟಾವು ಮಾಡಿ ಮಾರುಕಟ್ಟೆಯಲ್ಲಿ 3 ಪಟ್ಟು ಬೆಲೆ ಪಡೆಯಿರಿ.',
        highDemand: ['▲ ಹೂವುಗಳು (3x ಬೆಲೆ ಏರಿಕೆ)', '▲ ಹಸಿ ಬಟಾಣಿ ಮತ್ತು ಕ್ಯಾಪ್ಸಿಕಂ', '▲ ತಾಜಾ ಹಾಲು ಮತ್ತು ಖೋವಾ', '▲ ಪೂಜಾ ತರಕಾರಿಗಳು'],
        lowDemand: ['▼ ಹಳೆಯ ಈರುಳ್ಳಿ (ಬೆಲೆ ಕುಸಿತ)', '▼ ದಪ್ಪ ಧಾನ್ಯಗಳು', '▼ ಸಾಮಾನ್ಯ ಸೊಪ್ಪು'],
        strategyTip: '💡 ತಜ್ಞರ ಸಲಹೆ: ಕೋಸಿನ ಜೊತೆ ಹೂವುಗಳು ಬೆಳೆಯಿರಿ, ಕೀಟಬಾಧೆ ಕಡಿಮೆಯಾಗಿ ಧನತ್ರಯೋದಶಿಯಲ್ಲಿ ದುಪ್ಪಟ್ಟು ಲಾಭ ಸಿಗಲಿದೆ!',
      },
      ml: {
        eventName: '🪔 ദീപാവലി & ധൻതേരസ് വൻ ഡിമാൻഡ്',
        sowAlertTitle: '🌱 3 ഇരട്ടി വിലയ്ക്ക് ഇന്നേ വിതയ്ക്കൂ',
        sowCrops: ['പൂക്കൾ (Flowers)', 'കോളിഫ്ലവർ', 'പച്ചപ്പട്ടാണി', 'ക്യാപ്സിക്കം'],
        sowAdvice: 'പൂക്കൾയും പട്ടാണിയും ഇന്നേ വിതയ്ക്കൂ. ദീപാവലിക്ക് 3 ദിവസം മുൻപ് വിളവെടുത്ത് 3 ഇരട്ടി ലാഭം നേടൂ.',
        highDemand: ['▲ പൂക്കൾ പൂക്കൾ (3x വില)', '▲ പച്ചപ്പട്ടാണി & ക്യാപ്സിക്കം', '▲ ഫ്രഷ് പാൽ & പാൽ ഉൽപ്പന്നങ്ങൾ', '▲ പൂജ പച്ചക്കറികൾ'],
        lowDemand: ['▼ പഴയ ഉള്ളി (വിലക്കുറവ്)', '▼ ധാന്യങ്ങൾ', '▼ സാധാരണ ഇലക്കറികൾ'],
        strategyTip: '💡 വിദഗ്ദ്ധ നിർദ്ദേശം: കോളിഫ്ലവറിനൊപ്പം പൂക്കൾ നടൂ, കീടങ്ങൾ കുറയും, ധൻതേരസിന് ഇരട്ടി ലാഭം ലഭിക്കും!',
      },
    },
  },
  {
    id: 'chhath',
    state: 'UP, Bihar, Jharkhand & Bengal',
    religion: 'Hindu / Folk Tradition',
    daysToEvent: 72,
    sowWindowDays: 5,
    translations: {
      en: {
        eventName: '☀️ Mahaparv Chhath Puja Special Surge',
        sowAlertTitle: '🌱 HIGH VALUE SOWING ALERT FOR CHHATH PUJA',
        sowCrops: ['Red Sugarcane (Ganna)', 'Green Banana Stalks', 'Radish (Mooli)', 'Spinach (Palak)', 'Sweet Potato'],
        sowAdvice: 'Sow Sugarcane, Sweet Potato & Radish now. Chhath Puja requires raw whole sugarcane stalks with leaves.',
        highDemand: ['▲ Whole Red Sugarcane (3.5x Price)', '▲ Green Banana Clusters', '▲ Fresh Mooli with Leaves', '▲ Lemon & Ginger Plants'],
        lowDemand: ['▼ Brinjal / Eggplant (Strictly avoided during fasting)', '▼ Non-Satvik Veggies', '▼ Garlic & Onion'],
        strategyTip: '💡 Expert Tip: Bundle whole red sugarcane with fresh leafy tops; buyers pay premium ₹150-₹200 per stalk during Arghya!',
      },
      pa: {
        eventName: '☀️ ਛੱਠ ਪੂਜਾ ਮਹਾਪੁਰਬ ਵਿਸ਼ੇਸ਼ ਮੰਗ',
        sowAlertTitle: '🌱 ਛੱਠ ਪੂਜਾ ਲਈ ਉੱਚ ਮੁਨਾਫੇ ਵਾਲੀ ਬੀਜਾਈ',
        sowCrops: ['ਲਾਲ ਕਮਾਦ/ਗੰਨਾ', 'ਕੱਚਾ ਕੇਲਾ', 'ਮੂਲੀ (ਪੱਤਿਆਂ ਸਮੇਤ)', 'ਪਾਲਕ', 'ਸ਼ਕਰਕੰਦੀ'],
        sowAdvice: 'ਗੰਨਾ, ਸ਼ਕਰਕੰਦੀ ਅਤੇ ਮੂਲੀ ਅੱਜ ਹੀ ਬੀਜੋ। ਛੱਠ ਪੂਜਾ ਵਿੱਚ ਪੱਤਿਆਂ ਵਾਲਾ ਪੂਰਾ ਗੰਨਾ ਸਭ ਤੋਂ ਮਹਿੰਗਾ ਵਿਕਦਾ ਹੈ।',
        highDemand: ['▲ ਪੂਰਾ ਲਾਲ ਗੰਨਾ (3.5 ਗੁਣਾ ਰੇਟ)', '▲ ਕੱਚੇ ਕੇਲੇ ਦੇ ਘੜ', '▲ ਪੱਤਿਆਂ ਵਾਲੀ ਤਾਜ਼ਾ ਮੂਲੀ', '▲ ਨਿੰਬੂ ਅਤੇ ਅਦਰਕ'],
        lowDemand: ['▼ ਬੈਂਗਣ (ਬਰਤ ਵਿੱਚ ਮਨਾਹੀ)', '▼ ਲਸਣ ਅਤੇ ਪਿਆਜ਼', '▼ ਗੈਰ-ਸਾਤਵਿਕ ਸਬਜ਼ੀਆਂ'],
        strategyTip: '💡 ਮਾਹਿਰ ਦੀ ਸਲਾਹ: ਪੱਤਿਆਂ ਵਾਲੇ ਲਾਲ ਗੰਨੇ ਦੇ ਛੱਤੇ ਬਣਾ ਕੇ ਵੇਚੋ; ਅਰਘ ਵਾਲੇ ਦਿਨ ਗਾਹਕ ₹150-₹200 ਪ੍ਰਤੀ ਗੰਨਾ ਖੁਸ਼ੀ ਨਾਲ ਦਿੰਦੇ ਹਨ!',
      },
      hi: {
        eventName: '☀️ महापर्व छठ पूजा विशेष मांग',
        sowAlertTitle: '🌱 छठ पूजा हेतु उच्च मुनाफे वाली बुवाई',
        sowCrops: ['लाल गन्ना (Sugarcane)', 'कच्चा केला', 'मूली (पत्तों सहित)', 'पालक', 'शकरकंद'],
        sowAdvice: 'गन्ना, शकरकंद और मूली आज ही बोएं। छठ पूजा में पत्तों वाला खड़ा लाल गन्ना सर्वाधिक महंगे दाम पर बिकता है।',
        highDemand: ['▲ खड़ा लाल गन्ना (3.5 गुना रेट)', '▲ हरे कच्चे केले का घौंद', '▲ पत्तों वाली ताजी मूली', '▲ नींबू व अदरक पौधा'],
        lowDemand: ['▼ बैंगन (व्रत में वर्जित)', '▼ लहसुन व प्याज', '▼ बिना सात्विक सब्जियां'],
        strategyTip: '💡 विशेषज्ञ सलाह: पत्तों सहित खड़े लाल गन्ने के बंडल बनाकर बेचें; अर्घ्य के दिन श्रद्धालु ₹150-₹200 प्रति गन्ना खरीदते हैं!',
      },
      bn: {
        eventName: '☀️ ছট পূজা মহাপর্ব বিশেষ চাহিদা',
        sowAlertTitle: '🌱 ছট পূজার জন্য লাভজনক রোপণ সংকেত',
        sowCrops: ['লাল আখ (Sugarcane)', 'কাঁচা কলা', 'পাতাযুক্ত মুলো', 'পালং শাক', 'মিষ্টি আলু'],
        sowAdvice: 'আজই আখ, মিষ্টি আলু ও মুলো রোপণ করুন। ছট পূজায় পাতাসমেত গোট আখের চাহিদা আকাশছোঁয়া হয়।',
        highDemand: ['▲ পাতাযুক্ত লাল আখ (৩.৫ গুণ দাম)', '▲ কাঁচা কলার কাঁদি', '▲ সতেজ পাতাযুক্ত মুলো', '▲ লেবু ও আদা'],
        lowDemand: ['▼ বেগুন (পুজোয় নিষিদ্ধ)', '▼ রসুন ও পেঁয়াজ', '▼ আমিষ সবজি'],
        strategyTip: '💡 পরামর্শ: পাতাসমেত গোটা আখ বাজারে আনুন, অর্ঘ্যের দিনে প্রতি আখে ১৫০-২০০ টাকা পর্যন্ত দাম পাওয়া যায়!',
      },
      mr: {
        eventName: '☀️ छठ पूजा महापर्व विशेष मागणी',
        sowAlertTitle: '🌱 छठ पूजेसाठी उच्च नफ्याची पेरणी',
        sowCrops: ['लाल ऊस (Sugarcane)', 'काच्ची केळी', 'पानांसह मुळा', 'पालक', 'रताळे (Sweet Potato)'],
        sowAdvice: 'ऊस, रताळे व मुळा आजच लावा. छठ पूजेत पानांसह पूर्ण लाल ऊस अत्यंत चढ्या दराने विकला जातो.',
        highDemand: ['▲ पानांसह लाल ऊस (३.५ पट भाव)', '▲ काच्च्या केळ्यांचे घड', '▲ पानांसह ताजा मुळा', '▲ लिंबू व आले'],
        lowDemand: ['▼ वांगे (उपासात वर्ज्य)', '▼ लसूण व कांदा', '▼ अ-सात्विक भाज्या'],
        strategyTip: '💡 तज्ज्ञ सल्ला: पानांसह उसाचे गट्टे तयार करा; पूजेच्या दिवशी भाविक ₹१५०-₹२०० प्रति ऊस आनंदाने देतात!',
      },
      gu: {
        eventName: '☀️ છઠ પૂજા મહાપર્વ વિશેષ માંગ',
        sowAlertTitle: '🌱 છઠ પૂજા માટે ઊંચા નફાની વાવણી',
        sowCrops: ['લાલ શેરડી (Sugarcane)', 'કાચા કેળાં', 'પાંદડાવાળા મૂળા', 'પાલક', 'શકરિયાં'],
        sowAdvice: 'શેરડી, શકરિયાં અને મૂળા આજે જ વાવો. છઠ પૂજામાં પાંદડાવાળી આખી લાલ શેરડી ખૂબ ઊંચા ભાવે વેચાય છે.',
        highDemand: ['▲ આખી લાલ શેરડી (3.5 ગણો ભાવ)', '▲ કાચા કેળાંની લૂમ', '▲ તાજા પાંદડાવાળા મૂળા', '▲ લીંબુ અને આદુ'],
        lowDemand: ['▼ રીંગણ (વ્રતમાં વર્જિત)', '▼ લસણ અને ડુંગળી', '▼ બિન-સાત્વિક શાકભાજી'],
        strategyTip: '💡 નિષ્ણાત ટિપ: પાંદડાવાળી લાલ શેરડીના ભારી બનાવો; પૂજાના દિવસે ₹150-₹200 પ્રતિ શેરડી સરળતાથી મળશે!',
      },
      ta: {
        eventName: '☀️ சத் பூஜை சிறப்பு தேவை',
        sowAlertTitle: '🌱 சத் பூஜைக்கு அதிக லாபகரமான விதைப்பு',
        sowCrops: ['செங்கரும்பு (Sugarcane)', 'பச்சை வாழைக்காய்', 'இலை முள்ளங்கி', 'பசலைக்கீரை', 'சர்க்கரைவள்ளி'],
        sowAdvice: 'செங்கரும்பு மற்றும் சர்க்கரைவள்ளி கிழங்கை இன்றே விதையுங்கள். பூஜையில் தோகையுடன் கூடிய முழு கரும்புக்கு பெரும் தேவை உண்டு.',
        highDemand: ['▲ தோகை செங்கரும்பு (3.5 மடங்கு விலை)', '▲ பச்சை வாழைக்காய் தார்', '▲ இலைகளுடன் புதிய முள்ளங்கி', '▲ எலுமிச்சை & இஞ்சி'],
        lowDemand: ['▼ கத்தரிக்காய் (நோன்பில் தவிர்க்கப்படும்)', '▼ வெங்காயம் & பூண்டு', '▼ சாதாரண காய்கறிகள்'],
        strategyTip: '💡 நிபுணர் குறிப்பு: தோகையுடன் கரும்புகளை விற்கவும், பூஜை நாளில் கரும்பு ஒன்று ₹150-₹200 வரை விற்கும்!',
      },
      te: {
        eventName: '☀️ ఛత్ పూజ ప్రత్యేక డిమాండ్',
        sowAlertTitle: '🌱 ఛత్ పూజ కొరకు అధిక లాభదాయక విత్తనం',
        sowCrops: ['ఎర్ర చెరకు (Sugarcane)', 'పచ్చి అరటి', 'ఆకుల ముల్లంగి', 'పాలకూర', 'చిలగడదుంప'],
        sowAdvice: 'చెరకు మరియు చిలగడదుంప నేడే నాటండి. పూజలో ఆకులతో కూడిన ఎర్ర చెరకు అత్యధిక ధరకు అమ్ముడవుతుంది.',
        highDemand: ['▲ ఆకుల ఎర్ర చెరకు (3.5 రెట్ల ధర)', '▲ పచ్చి అరటి గెలలు', '▲ ఆకులతో కూడిన తాజా ముల్లంగి', '▲ నిమ్మకాయ & అల్లం'],
        lowDemand: ['▼ వంకాయ (ఉపవాసంలో నిషేధం)', '▼ ఉల్లి & వెల్లుల్లి', '▼ సాత్వికం కాని కూరగాయలు'],
        strategyTip: '💡 నిపుణుల సలహా: ఆకులతో కూడిన చెరకు గడలను అమ్మండి; పూజ రోజున ఒక్కో గడ ₹150-₹200 పలుకుతుంది!',
      },
      kn: {
        eventName: '☀️ ಛತ್ ಪೂಜಾ ವಿಶೇಷ ಬೇಡಿಕೆ',
        sowAlertTitle: '🌱 ಛತ್ ಪೂಜೆಗೆ ಹೆಚ್ಚಿನ ಲಾಭದ ಬಿತ್ತನೆ',
        sowCrops: ['ಕೆಂಪು ಕಬ್ಬು (Sugarcane)', 'ಹಸಿ ಬಾಳೆಕಾಯಿ', 'ಎಲೆ ಸಹಿತ ಮೂಲಂಗಿ', 'ಪಾಲಕ್', 'ಗೆಣಸು'],
        sowAdvice: 'ಕಬ್ಬು ಮತ್ತು ಗೆಣಸನ್ನು ಇಂದೇ ಬಿತ್ತನೆ ಮಾಡಿ. ಪೂಜೆಯಲ್ಲಿ ಎಲೆ ಸಹಿತ ಕೆಂಪು ಕಬ್ಬಿಗೆ ಅತ್ಯಂತ ಹೆಚ್ಚಿನ ಬೆಲೆ ಸಿಗುತ್ತದೆ.',
        highDemand: ['▲ ಎಲೆ ಸಹಿತ ಕೆಂಪು ಕಬ್ಬು (3.5x ಬೆಲೆ)', '▲ ಹಸಿ ಬಾಳೆ ಗೊನೆ', '▲ ತಾಜಾ ಮೂಲಂಗಿ', '▲ ನಿಂಬೆ ಮತ್ತು ಶುಂಠಿ'],
        lowDemand: ['▼ ಬದನೆಕಾಯಿ (ವ್ರತದಲ್ಲಿ ವರ್ಜ್ಯ)', '▼ ಈರುಳ್ಳಿ ಮತ್ತು ಬೆಳ್ಳುಳ್ಳಿ', '▼ ಸಾತ್ವಿಕವಲ್ಲದ ತರಕಾರಿ'],
        strategyTip: '💡 ತಜ್ಞರ ಸಲಹೆ: ಎಲೆ ಸಹಿತ ಕಬ್ಬಿನ ಕಟ್ಟುಗಳನ್ನು ಮಾರಿ; ಪೂಜೆಯ ದಿನ ಒಂದು ಕಬ್ಬಿಗೆ ₹150-₹200 ಸಿಗುತ್ತದೆ!',
      },
      ml: {
        eventName: '☀️ ഛത്ത് പൂജ പ്രത്യേക ഡിമാൻഡ്',
        sowAlertTitle: '🌱 ഛത്ത് പൂജയ്ക്കായി ഉയർന്ന ലാഭകരമായ വിതയ്ക്കൽ',
        sowCrops: ['ചെങ്കരിമ്പ് (Sugarcane)', 'പച്ചക്കായ', 'ഇലയുള്ള മുള്ളങ്കി', 'പാലക്ക്', 'മധുരക്കിഴങ്ങ്'],
        sowAdvice: 'കരിമ്പും മധുരക്കിഴങ്ങും ഇന്നേ നടൂ. പൂജയ്ക്ക് ഇലയോടു കൂടിയ ചെങ്കരിമ്പിന് വൻ വില ലഭിക്കും.',
        highDemand: ['▲ ഇലയുള്ള ചെങ്കരിമ്പ് (3.5x വില)', '▲ പച്ചക്കായ കുലകൾ', '▲ ഫ്രഷ് മുള്ളങ്കി', '▲ ചെറുനാരങ്ങ & ഇഞ്ചി'],
        lowDemand: ['▼ വഴുതനങ്ങ (വ്രതത്തിന് നിഷിദ്ധം)', '▼ ഉള്ളി & വെളുത്തുള്ളി', '▼ സാധാരണ പച്ചക്കറികൾ'],
        strategyTip: '💡 വിദഗ്ദ്ധ നിർദ്ദേശം: ഇലയോടു കൂടിയ കരിമ്പ് വിൽക്കൂ, പൂജ ദിനത്തിൽ ഒന്നിന് ₹150-₹200 വരെ ലഭിക്കും!',
      },
    },
  },
  {
    id: 'baisakhi',
    state: 'Punjab, Haryana & North India',
    religion: 'Sikh / Hindu / Agricultural Harvest',
    daysToEvent: 85,
    sowWindowDays: 6,
    translations: {
      en: {
        eventName: '🌾 Baisakhi Harvest & Summer Cash Crop Surge',
        sowAlertTitle: '🌱 SOW SHORT-DURATION CASH CROPS TODAY',
        sowCrops: ['Summer Moong Pulse', 'Okra (Bhindi)', 'Bottle Gourd (Lauki)', 'Cucumber (Kheera)', 'Muskmelon'],
        sowAdvice: 'Sow 60-day Summer Moong & Cucumber immediately post Rabi harvest. Capture high summer vegetable prices.',
        highDemand: ['▲ Summer Moong Pulse (2.5x Price)', '▲ Fresh Cucumber & Muskmelon', '▲ Okra & Bottle Gourd', '▲ Green Fodder'],
        lowDemand: ['▼ Heavy Winter Root Veggies', '▼ Stored Potatoes', '▼ Low-Moisture Crops'],
        strategyTip: '💡 Expert Tip: 60-day Summer Moong yields ₹40,000/acre in just 2 months while fixing nitrogen in your soil for Next Paddy crop!',
      },
      pa: {
        eventName: '🌾 ਵਿਸਾਖੀ ਅਤੇ ਗਰਮੂਰਤੀ ਨਕਦੀ ਫਸਲ ਬੰਪਰ ਮੰਗ',
        sowAlertTitle: '🌱 ਘੱਟ ਸਮੇਂ ਵਾਲੀ ਗਰਮ ਰੁੱਤ ਦੀ ਫਸਲ ਅੱਜ ਹੀ ਬੀਜੋ',
        sowCrops: ['ਗਰਮੀ ਦੀ ਮੂੰਗੀ (Summer Moong)', 'ਭਿੰਡੀ', 'ਘੀਆ/ਲੌਕੀ', 'ਖੀਰਾ', 'ਖਰਬੂਜ਼ਾ'],
        sowAdvice: 'ਕਣਕ ਦੀ ਵਢਾਈ ਤੋਂ ਤੁਰੰਤ ਬਾਅਦ 60 ਦਿਨਾਂ ਵਾਲੀ ਮੂੰਗੀ ਅਤੇ ਖੀਰਾ ਬੀਜੋ। ਗਰਮੀਆਂ ਵਿੱਚ ਸਬਜ਼ੀਆਂ ਦੇ 2.5 ਗੁਣਾ ਵੱਧ ਰੇਟ ਲਵੋ।',
        highDemand: ['▲ 60 ਦਿਨਾਂ ਮੂੰਗੀ (2.5 ਗੁਣਾ ਰੇਟ)', '▲ ਤਾਜ਼ਾ ਖੀਰਾ ਅਤੇ ਖਰਬੂਜ਼ਾ', '▲ ਭਿੰਡੀ ਅਤੇ ਘੀਆ', '▲ ਹਰਾ ਚਾਰਾ'],
        lowDemand: ['▼ ਸਰਦੀਆਂ ਵਾਲੇ ਆਲੂ', '▼ ਪੁਰਾਣੀਆਂ ਜੜ੍ਹ ਵਾਲੀਆਂ ਸਬਜ਼ੀਆਂ', '▼ ਘੱਟ ਪਾਣੀ ਵਾਲੀਆਂ ਫਸਲਾਂ'],
        strategyTip: '💡 ਮਾਹਿਰ ਦੀ ਸਲਾਹ: 60 ਦਿਨਾਂ ਦੀ ਮੂੰਗੀ 2 ਮਹੀਨਿਆਂ ਵਿੱਚ ₹40,000/ਏਕੜ ਦੀ ਕਮਾਈ ਦਿੰਦੀ ਹੈ ਅਤੇ ਝੋਨੇ ਲਈ ਜ਼ਮੀਨ ਦੀ ਉਪਜਾਊ ਸ਼ਕਤੀ ਵੀ ਵਧਾਉਂਦੀ ਹੈ!',
      },
      hi: {
        eventName: '🌾 बैसाखी व ग्रीष्मकालीन नकदी फसल मांग',
        sowAlertTitle: '🌱 कम अवधि वाली ग्रीष्मकालीन फसल आज बोएं',
        sowCrops: ['साठिया मूंग (Summer Moong)', 'भिंडी', 'लौकी', 'खीरा', 'खरबूजा'],
        sowAdvice: 'गेहूं कटाई के तुरंत बाद 60 दिन की मूंग व खीरा बोएं। गर्मियों में सब्जियों के 2.5 गुना अधिक दाम प्राप्त करें।',
        highDemand: ['▲ साठिया मूंग (2.5 गुना दाम)', '▲ ताजा खीरा व खरबूजा', '▲ भिंडी व लौकी', '▲ हरा चारा'],
        lowDemand: ['▼ सर्दियों का आलू', '▼ भारी जड़ वाली सब्जियां', '▼ कम नमी वाली फसलें'],
        strategyTip: '💡 विशेषज्ञ सलाह: 60 दिन की मूंग 2 महीने में ₹40,000/एकड़ की कमाई देती है और धान की फसल के लिए खेत को उपजाऊ बनाती है!',
      },
      bn: {
        eventName: '🌾 বৈশাখী ও গ্রীষ্মকালীন অর্থকরী ফসল চাহিদা',
        sowAlertTitle: '🌱 স্বল্পমেয়াদী গ্রীষ্মকালীন ফসল আজই রোপণ করুন',
        sowCrops: ['গ্রীষ্মকালীন মুগ ডাল', 'ঢ্যাঁড়শ (Bhindi)', 'লাউ', 'শসা', 'खरબૂজা'],
        sowAdvice: 'গম কাটার পরপরই ৬০ দিনের মুগ ডাল ও শসা রোপণ করুন। গ্রীষ্মে ২.৫ গুণ বেশি দামে সবজি বিক্রি করুন।',
        highDemand: ['▲ গ্রীষ্মকালীন মুগ ডাল (২.৫ গুণ দাম)', '▲ টাটকা শসা ও তরমুজ', '▲ ঢ্যাঁড়শ ও লাউ', '▲ সবুজ গোখাদ্য'],
        lowDemand: ['▼ শীতকালীন আলু', '▼ মূলজাতীয় পুরনো সবজি', '▼ শুষ্ক শস্য'],
        strategyTip: '💡 পরামর্শ: ৬০ দিনের মুগ ডাল চাষে বিঘা প্রতি দারুণ লাভ হয় এবং জমির উর্বরতা বৃদ্ধি পায়!',
      },
      mr: {
        eventName: '🌾 वैसाखी व उन्हाळी नगदी पिके मागणी',
        sowAlertTitle: '🌱 कमी कालावधीची उन्हाळी पिके आजच लावा',
        sowCrops: ['उन्हाळी मूग (Summer Moong)', 'भेंडी', 'दुधी भोपळा', 'काकडी', 'खरबूज'],
        sowAdvice: 'गहू काढणीनंतर लगेच ६० दिवसांचा मूग व काकडी लावा. उन्हाळ्यात भाज्यांना २.५ पट जास्त भाव मिळवा.',
        highDemand: ['▲ उन्हाळी मूग (२.५ पट भाव)', '▲ ताजी काकडी व खरबूज', '▲ भेंडी व दुधी भोपळा', '▲ हिरवा चारा'],
        lowDemand: ['▼ साठवलेला बटाटा', '▼ हिवाळी मुळा-गाजर', '▼ कोरडवाहू धान्य'],
        strategyTip: '💡 तज्ज्ञ सल्ला: ६० दिवसांचा मूग २ महिन्यात ₹४०,०००/एकरी उत्पन्न देतो आणि पुढच्या पिकासाठी जमीन सुपीक करतो!',
      },
      gu: {
        eventName: '🌾 વૈશાખી અને ઉનાળુ રોકડિયા પાક માંગ',
        sowAlertTitle: '🌱 ટૂંકા ગાળાના ઉનાળુ પાકની આજે વાવણી કરો',
        sowCrops: ['ઉનાળુ મગ (Summer Moong)', 'ભીંડા', 'દૂધી', 'કાંકડી', 'શકરટેટી'],
        sowAdvice: 'ઘઉંની લણણી પછી તરત જ 60 દિવસના મગ અને કાંકડી વાવો. ઉનાળામાં શાકભાજીના 2.5 ગણા ભાવ મેળવો.',
        highDemand: ['▲ ઉનાળુ મગ (2.5 ગણો ભાવ)', '▲ તાજી કાંકડી અને શકરટેટી', '▲ ભીંડા અને દૂધી', '▲ લીલો ચારો'],
        lowDemand: ['▼ શિયાળુ બટાટા', '▼ જૂના કંદમૂળ', '▼ બિન-મોસમી અનાજ'],
        strategyTip: '💡 નિષ્ણાત ટિપ: 60 દિવસના મગ વાવવાથી 2 મહિનામાં ₹40,000/એકર કમાણી થાય છે અને જમીનની ફળદ્રુપતા વધે છે!',
      },
      ta: {
        eventName: '🌾 வைசாகி & கோடைக்கால பணப்பயிர் தேவை',
        sowAlertTitle: '🌱 குறுகிய கால கோடைப்பயிர்களை இன்றே விதையுங்கள்',
        sowCrops: ['கோடை பாசிப்பயறு (Moong)', 'வெண்டைக்காய்', 'சுரைக்காய்', 'வெள்ளரிக்காய்', 'முலாம்பழம்'],
        sowAdvice: 'அறுவடைக்கு பின் 60 நாள் பாசிப்பயறு மற்றும் வெள்ளரியை விதையுங்கள். கோடையில் 2.5 மடங்கு விலை பெறுங்கள்.',
        highDemand: ['▲ கோடை பாசிப்பயறு (2.5 மடங்கு விலை)', '▲ புதிய வெள்ளரி & முலாம்பழம்', '▲ வெண்டை & சுரைக்காய்', '▲ பசுந்தீவனம்'],
        lowDemand: ['▼ உருளைக்கிழங்கு', '▼ குளிர்கால காய்கறிகள்', '▼ உலர்ந்த தானியங்கள்'],
        strategyTip: '💡 நிபுணர் குறிப்பு: 60 நாள் பாசிப்பயறு 2 மாதத்தில் ஏக்கருக்கு ₹40,000 வருமானம் தருவதோடு நிலத்தின் வளத்தையும் கூட்டுகிறது!',
      },
      te: {
        eventName: '🌾 వైశాఖి & వేసవి నగదు పంటల డిమాండ్',
        sowAlertTitle: '🌱 స్వల్పకాలిక వేసవి పంటలను నేడే విత్తండి',
        sowCrops: ['వేసవి పెసర (Summer Moong)', 'బెండకాయ', 'సొరకాయ', 'కీరదోస', 'కర్బూజా'],
        sowAdvice: 'వరి/గోధుమ కోతల తర్వాత 60 రోజుల పెసర మరియు దోస నాటండి. వేసవిలో 2.5 రెట్లు ఎక్కువ ధర పొందండి.',
        highDemand: ['▲ వేసవి పెసర (2.5 రెట్ల ధర)', '▲ తాజా కీరదోస & కర్బూజా', '▲ బెండకాయ & సొరకాయ', '▲ పచ్చి మేత'],
        lowDemand: ['▼ శీతాకాలపు ఆలూ', '▼ పాత దుంపలు', '▼ పొడి ధాన్యాలు'],
        strategyTip: '💡 నిపుణుల సలహా: 60 రోజుల పెసర పంట 2 నెలల్లో ఎకరాకు ₹40,000 రాబడి ఇస్తూనే నేల సారాన్ని పెంచుతుంది!',
      },
      kn: {
        eventName: '🌾 ಬೈಸಾಖಿ ಮತ್ತು ಬೇಸಿಗೆ ನಗದು ಬೆಳೆ ಬೇಡಿಕೆ',
        sowAlertTitle: '🌱 ಅಲ್ಪಾವಧಿಯ ಬೇಸಿಗೆ ಬೆಳೆಗಳನ್ನು ಇಂದೇ ಬಿತ್ತನೆ ಮಾಡಿ',
        sowCrops: ['ಬೇಸಿಗೆ ಹೆಸರು ಕಾಳು (Moong)', 'ಬೆಂಡೆಕಾಯಿ', 'ಸೋರೆಕಾಯಿ', 'ಸೌತೆಕಾಯಿ', 'ಖರ್ಬೂಜ'],
        sowAdvice: 'ಕಟಾವಿನ ನಂತರ 60 ದಿನದ ಹೆಸರು ಕಾಳು ಮತ್ತು ಸೌತೆಕಾಯಿ ಬಿತ್ತಿ. ಬೇಸಿಗೆಯಲ್ಲಿ 2.5 ಪಟ್ಟು ಹೆಚ್ಚು ಬೆಲೆ ಪಡೆಯಿರಿ.',
        highDemand: ['▲ ಬೇಸಿಗೆ ಹೆಸರು ಕಾಳು (2.5x ಬೆಲೆ)', '▲ ತಾಜಾ ಸೌತೆಕಾಯಿ & ಖರ್ಬೂಜ', '▲ ಬೆಂಡೆಕಾಯಿ & ಸೋರೆಕಾಯಿ', '▲ ಹಸಿರು ಮೇವು'],
        lowDemand: ['▼ ಚಳಿಗಾಲದ ಆಲೂಗಡ್ಡೆ', '▼ ಹಳೆಯ ಗಡ್ಡೆ ತರಕಾರಿ', '▼ ಒಣ ಧಾನ್ಯಗಳು'],
        strategyTip: '💡 ತಜ್ಞರ ಸಲಹೆ: 60 ದಿನದ ಹೆಸರು ಕಾಳು 2 ತಿಂಗಳಲ್ಲಿ ಎಕರೆಗೆ ₹40,000 ಆದಾಯ ನೀಡುತ್ತದೆ ಜೊತೆಗೆ ಭೂಮಿಯ ಫಲವತ್ತತೆ ಹೆಚ್ಚಿಸುತ್ತದೆ!',
      },
      ml: {
        eventName: '🌾 വൈശാഖി & വേനൽക്കാല പണപ്പയർ ഡിമാൻഡ്',
        sowAlertTitle: '🌱 ഹ്രസ്വകാല വേനൽക്കാല വിളകൾ ഇന്നേ വിതയ്ക്കൂ',
        sowCrops: ['വേനൽക്കാല ചെറുപയർ (Moong)', 'വെണ്ടയ്ക്ക', 'ചുരയ്ക്ക', 'വെള്ളരിക്ക', 'തണ്ണിമത്തൻ'],
        sowAdvice: 'വിളവെടുപ്പിന് ശേഷം 60 ദിവസത്തെ ചെറുപയറും വെള്ളരിയും നടൂ. വേനൽക്കാലത്ത് 2.5 ഇരട്ടി വില നേടൂ.',
        highDemand: ['▲ വേനൽക്കാല ചെറുപയർ (2.5x വില)', '▲ ഫ്രഷ് വെള്ളരിക്ക & തണ്ണിമത്തൻ', '▲ വെണ്ടയ്ക്ക & ചുരയ്ക്ക', '▲ പച്ചപ്പുല്ല്'],
        lowDemand: ['▼ ഉരുളക്കിഴങ്ങ്', '▼ തണുപ്പുകാല കിഴങ്ങുവർഗ്ഗങ്ങൾ', '▼ ഉണങ്ങിയ ധാന്യങ്ങൾ'],
        strategyTip: '💡 വിദഗ്ദ്ധ നിർദ്ദേശം: 60 ദിവസത്തെ ചെറുപയർ 2 മാസത്തിൽ ഏക്കറിന് ₹40,000 വരുമാനം നൽകുകയും മണ്ണ് ഫലഭൂയിഷ്ഠമാക്കുകയും ചെയ്യും!',
      },
    },
  },
];

export const ReverseSowingAlertCard: React.FC = () => {
  const { language } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LanguageCode>((language as LanguageCode) || 'en');
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);

  const activeEvent = FESTIVAL_DATA[selectedEventIndex] || FESTIVAL_DATA[0];
  const t = activeEvent.translations[selectedLang] || activeEvent.translations['en'];

  const handleShareWhatsapp = () => {
    tap();
    const shareText = `🌾 *FarmsKing Reverse Sowing Alert (${activeEvent.state})*\n\n🎉 Event: ${t.eventName}\n⏳ Countdown: ${activeEvent.daysToEvent} Days to Harvest\n\n${t.sowAlertTitle}:\n• ${t.sowCrops.join('\n• ')}\n\n💡 Advice: ${t.sowAdvice}\n\n📈 High Demand Surge:\n${t.highDemand.join('\n')}\n\n📲 Download FarmsKing App for Daily Market Rates & Reverse Sowing Alerts!`;
    const url = `whatsapp://send?text=${encodeURIComponent(shareText)}`;
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') alert(shareText);
    });
  };

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'md')]}>
      {/* Header Banner */}
      <LinearGradient colors={['#065f46', '#047857']} style={styles.cardHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar" size={18} color="#a7f3d0" />
            <Text style={styles.cardHeaderTag}>REVERSE SOWING ENGINE</Text>
          </View>
          <View style={styles.countdownPill}>
            <Ionicons name="time-outline" size={12} color="#ffffff" />
            <Text style={styles.countdownPillText}>{activeEvent.daysToEvent} Days to Event</Text>
          </View>
        </View>

        <Text style={styles.eventTitle}>{t.eventName}</Text>

        <View style={styles.badgeRow}>
          <View style={styles.stateBadge}>
            <Ionicons name="location" size={11} color="#dcfce7" />
            <Text style={styles.stateBadgeText}>{activeEvent.state}</Text>
          </View>
          <View style={styles.religionBadge}>
            <Ionicons name="star" size={11} color="#fef3c7" />
            <Text style={styles.religionBadgeText}>{activeEvent.religion}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* 10-Language Multi-Language Real-time Switcher Pills */}
      <View style={styles.langSection}>
        <Text style={styles.langSectionTitle}>🌐 Choose Language / ਭਾਸ਼ਾ ਚੁਣੋ:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
          {LANGUAGES.map((lang) => {
            const isActive = selectedLang === lang.code;
            return (
              <TouchableOpacity
                key={lang.code}
                style={[styles.langChip, isActive && styles.langChipActive]}
                onPress={() => {
                  tap();
                  setSelectedLang(lang.code);
                }}
              >
                <Text style={[styles.langChipText, isActive && styles.langChipTextActive]}>
                  {lang.native} ({lang.code.toUpperCase()})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Festival Selector Tabs */}
      <View style={styles.eventTabsRow}>
        {FESTIVAL_DATA.map((evt, idx) => {
          const isActive = selectedEventIndex === idx;
          const tr = evt.translations[selectedLang] || evt.translations['en'];
          return (
            <TouchableOpacity
              key={evt.id}
              style={[styles.eventTab, isActive && styles.eventTabActive]}
              onPress={() => {
                tap();
                setSelectedEventIndex(idx);
              }}
            >
              <Text style={[styles.eventTabText, isActive && styles.eventTabTextActive]} numberOfLines={1}>
                {tr.eventName.split(' ')[0]} {tr.eventName.split(' ')[1]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Green Highlighted Sowing Alert Box */}
      <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.sowAlertBox}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.sowAlertTitle}>{t.sowAlertTitle}</Text>
          <View style={styles.sowWindowTag}>
            <Text style={styles.sowWindowTagText}>⚡ Sow Today: {activeEvent.sowWindowDays} Days Left</Text>
          </View>
        </View>

        <View style={styles.cropChipsGrid}>
          {t.sowCrops.map((crop, i) => (
            <View key={i} style={styles.cropChip}>
              <Text style={styles.cropChipText}>🌱 {crop}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sowAdviceText}>{t.sowAdvice}</Text>
      </LinearGradient>

      {/* High vs Low Demand Comparison Grid */}
      <View style={styles.comparisonGrid}>
        {/* High Demand Column */}
        <View style={[styles.comparisonBox, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
          <Text style={[styles.comparisonHeader, { color: '#15803d' }]}>▲ High Demand (2x-3x Price)</Text>
          {t.highDemand.map((item, idx) => (
            <Text key={idx} style={styles.highDemandItem}>{item}</Text>
          ))}
        </View>

        {/* Low Demand Column */}
        <View style={[styles.comparisonBox, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
          <Text style={[styles.comparisonHeader, { color: '#b91c1c' }]}>▼ Low Demand (Price Slump)</Text>
          {t.lowDemand.map((item, idx) => (
            <Text key={idx} style={styles.lowDemandItem}>{item}</Text>
          ))}
        </View>
      </View>

      {/* Strategy Tip Box */}
      <View style={styles.strategyTipBox}>
        <Text style={styles.strategyTipText}>{t.strategyTip}</Text>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.whatsappBtn} onPress={handleShareWhatsapp}>
          <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
          <Text style={styles.whatsappBtnText}>Share Reverse Sowing Alert on WhatsApp</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginTop: 10,
    marginBottom: 16,
  },
  cardHeader: {
    padding: 14,
    gap: 8,
  },
  cardHeaderTag: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  countdownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  countdownPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  eventTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    lineHeight: 22,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  stateBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#dcfce7',
  },
  religionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  religionBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#fef3c7',
  },

  langSection: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  langSectionTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 2,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  langChipActive: {
    backgroundColor: '#047857',
    borderColor: '#047857',
  },
  langChipText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  langChipTextActive: {
    color: '#ffffff',
  },

  eventTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  eventTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  eventTabActive: {
    borderBottomColor: '#047857',
    backgroundColor: '#f0fdf4',
  },
  eventTabText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  eventTabTextActive: {
    color: '#047857',
  },

  sowAlertBox: {
    margin: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#86efac',
    gap: 8,
  },
  sowAlertTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#15803d',
    flex: 1,
  },
  sowWindowTag: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sowWindowTagText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  cropChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cropChip: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  cropChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  sowAdviceText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#14532d',
    lineHeight: 16,
  },

  comparisonGrid: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    gap: 8,
  },
  comparisonBox: {
    flex: 1,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
  },
  comparisonHeader: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    marginBottom: 2,
  },
  highDemandItem: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  lowDemandItem: {
    fontSize: 10,
    fontFamily: FONT.semiBold,
    color: '#991b1b',
  },

  strategyTipBox: {
    margin: 12,
    padding: 10,
    backgroundColor: '#fffbe8',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  strategyTipText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#92400e',
    lineHeight: 15,
  },

  actionBar: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#25d366',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  whatsappBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
