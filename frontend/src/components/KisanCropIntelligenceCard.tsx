import React, { useEffect, useMemo, useState } from 'react';
// Kisan Crop Intelligence Component - 2 Categories Architecture with Exact Dates, Advance vs Seasonal Filter & Language Selector
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

export type LangCode = 'en' | 'pa' | 'hi' | 'bn' | 'mr' | 'gu' | 'ta' | 'te' | 'kn' | 'ml';
export type MainTabType = 'DEMAND_PRICE' | 'SOWING_PLANNING';
export type SeasonType = 'ADVANCE_SEASONAL' | 'SEASONAL';

export interface LanguageItem {
  code: LangCode;
  nativeName: string;
}

export const LANG_LIST: LanguageItem[] = [
  { code: 'pa', nativeName: 'ਪੰਜਾਬੀ (Punjabi)' },
  { code: 'hi', nativeName: 'हिन्दी (Hindi)' },
  { code: 'en', nativeName: 'English' },
  { code: 'bn', nativeName: 'বাংলা (Bengali)' },
  { code: 'mr', nativeName: 'मराठी (Marathi)' },
  { code: 'gu', nativeName: 'ગુજરાતી (Gujarati)' },
  { code: 'ta', nativeName: 'தமிழ் (Tamil)' },
  { code: 'te', nativeName: 'తెలుగు (Telugu)' },
  { code: 'kn', nativeName: 'ਕನ್ನಡ (Kannada)' },
  { code: 'ml', nativeName: 'മലയാളം (Malayalam)' },
];

export const EVENT_DAYS_OPTIONS = [
  { days: 30, labelPa: '📅 ਅਗਲੇ 30 ਦਿਨ', labelEn: '📅 Next 30 Days' },
  { days: 60, labelPa: '📅 ਅਗਲੇ 60 ਦਿਨ', labelEn: '📅 Next 60 Days' },
  { days: 90, labelPa: '📅 ਅਗਲੇ 90 ਦਿਨ', labelEn: '📅 Next 90 Days' },
  { days: 120, labelPa: '📅 ਅਗਲੇ 120 ਦਿਨ', labelEn: '📅 Next 120 Days' },
  { days: 999, labelPa: '🌟 ਸਾਰੇ ਦਿਨ', labelEn: '🌟 All Days' },
];

export const SEASON_FILTER_OPTIONS = [
  { id: 'ALL_SEASONS', labelPa: '🌐 ਸਾਰੇ ਸੀਜ਼ਨ (All)', labelEn: '🌐 All Seasons', labelHi: '🌐 सभी सीजन' },
  { id: 'ADVANCE_SEASONAL', labelPa: '🌱 ਅਗੇਤੀ ਬੀਜਾਈ (Advance Seasonal)', labelEn: '🌱 Advance Seasonal', labelHi: '🌱 अगेती बुवाई' },
  { id: 'SEASONAL', labelPa: '🌾 ਰਵਾਇਤੀ ਸੀਜ਼ਨ (Main Seasonal)', labelEn: '🌾 Main Seasonal', labelHi: '🌾 मुख्य सीजन' },
];

export const CROP_FILTER_OPTIONS = [
  { id: 'MY_CROPS', labelPa: '🌟 ਮੇਰੀਆਂ ਬਚਾਈਆਂ ਫ਼ਸਲਾਂ', labelEn: '🌟 My Saved Crops', labelHi: '🌟 मेरी सहेजी फसलें' },
  { id: 'ALL', labelPa: '🌐 ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ', labelEn: '🌐 All Crops', labelHi: '🌐 सभी फसलें' },
  { id: 'VEG', labelPa: '🥬 ਸਬਜ਼ੀਆਂ (Tomato, Potato, Peas)', labelEn: '🥬 Vegetables', labelHi: '🥬 सब्जियां' },
  { id: 'FLOWERS', labelPa: '🌸 ਫੁੱਲ (Flowers - Commercial)', labelEn: '🌸 Flowers', labelHi: '🌸 फूल' },
  { id: 'GRAINS_CASH', labelPa: '🌾 ਅਨਾਜ, ਗੰਨਾ, ਕਪਾਹ & ਸਰ੍ਹੋਂ', labelEn: '🌾 Grains & Commercial', labelHi: '🌾 अनाज व वाणिज्यिक' },
  { id: 'FRUITS', labelPa: '🍉 ਫਲ (Watermelon)', labelEn: '🍉 Fruits', labelHi: '🍉 फल' },
  { id: 'FODDER', labelPa: '🌿 ਹਰਾ ਚਾਰਾ (Fodder)', labelEn: '🌿 Green Fodder', labelHi: '🌿 हरा चारा' },
];

export interface CropIntelligenceItem {
  cropName: Partial<Record<LangCode, string>> & { en: string };
  category: 'VEG' | 'FLOWERS' | 'GRAINS_CASH' | 'FRUITS' | 'FODDER';
  seasonType: SeasonType;
  stateRegion: string;
  statesListText: Partial<Record<LangCode, string>> & { en: string };
  localLangName: string;
  daysToEvent: number;
  eventDate: Partial<Record<LangCode, string>> & { en: string };
  sowWindow: Partial<Record<LangCode, string>> & { en: string };
  sowDates: Partial<Record<LangCode, string>> & { en: string };
  priceChange: Partial<Record<LangCode, string>> & { en: string };
  festivalName: Partial<Record<LangCode, string>> & { en: string };
  faithCategory: string;
  farmerAdvice: Partial<Record<LangCode, string>> & { en: string };
  harvestDelayAdvice: Partial<Record<LangCode, string>> & { en: string };
  targetFestivalSeason: Partial<Record<LangCode, string>> & { en: string };
  significance: Partial<Record<LangCode, string>> & { en: string };
  mandiImpact: Partial<Record<LangCode, string>> & { en: string };
  historicalMandiTrend?: Partial<Record<LangCode, string>> & { en: string };
}

export const UI_TRANSLATIONS: Record<string, {
  headerTitle: string;
  headerSub: string;
  tabDemand: string;
  tabSowing: string;
  cropFilterLabel: string;
  daysFilterLabel: string;
  seasonFilterLabel: string;
  eventDateLabel: string;
  sowDateLabel: string;
  cropLabel: string;
  stateLabel: string;
  localLangLabel: string;
  adviceHeaderLabel: string;
  harvestDelayHeaderLabel: string;
  targetFestivalHeaderLabel: string;
  significanceHeaderLabel: string;
  mandiHeaderLabel: string;
  historicalHeaderLabel: string;
  shareBtnLabel: string;
  emptyText: string;
}> = {
  en: {
    headerTitle: "Kisan Crop Demand & Sowing Intelligence Engine",
    headerSub: "Differentiate Advance Seasonal (Early Sowing) vs Main Seasonal crops to earn 2x-3x higher profits",
    tabDemand: "1. 📊 Mandi Demand & Rates",
    tabSowing: "2. 🌱 Sowing & Crop Planning",
    cropFilterLabel: "🌾 Select Crops:",
    daysFilterLabel: "📅 Days Filter:",
    seasonFilterLabel: "🌱 Sowing Season Type:",
    eventDateLabel: "📅 Peak Mandi Demand Date:",
    sowDateLabel: "⏱️ Optimal Sowing Window:",
    cropLabel: "🌾 Crop:",
    stateLabel: "📍 Target Regions:",
    localLangLabel: "🌐 Regional Names:",
    adviceHeaderLabel: "💡 Sowing & Field Prep Advice:",
    harvestDelayHeaderLabel: "🛑 Harvesting & Picking Stoppage Advisory:",
    targetFestivalHeaderLabel: "🎯 Target Season & Festival to Target:",
    significanceHeaderLabel: "📖 Cultural & Festive Significance:",
    mandiHeaderLabel: "📊 Mandi Demand & Price Impact:",
    historicalHeaderLabel: "📈 5-Year Historical Mandi Record (2021-2025):",
    shareBtnLabel: "📲 Share Advisory & Calendar Dates on WhatsApp",
    emptyText: "No crops match your selected filter in this tab. Try changing filters above!"
  },
  pa: {
    headerTitle: "ਕਿਸਾਨ ਫ਼ਸਲ ਮੰਗ & ਬੀਜਾਈ ਇੰਜਣ",
    headerSub: "ਅਗੇਤੀ ਬੀਜਾਈ (Advance Seasonal) ਅਤੇ ਰਵਾਇਤੀ ਫ਼ਸਲਾਂ ਦੀ ਸਹੀ ਜਾਣਕਾਰੀ ਨਾਲ 2x-3x ਵੱਧ ਕਮਾਈ ਕਰੋ",
    tabDemand: "1. 📊 ਮੰਡੀ ਮੰਗ & ਰੇਟ (Demand & Price)",
    tabSowing: "2. 🌱 ਬੀਜਾਈ & ਯੋਜਨਾ (Sowing & Plan)",
    cropFilterLabel: "🌾 ਫ਼ਸਲ ਚੋਣ (Select Crops):",
    daysFilterLabel: "📅 ਦਿਨਾਂ ਦਾ ਫਿਲਟਰ (Days Filter):",
    seasonFilterLabel: "🌱 ਬੀਜਾਈ ਸੀਜ਼ਨ ਕਿਸਮ (Season Type):",
    eventDateLabel: "📅 ਮੰਡੀ ਪੀਕ ਮੰਗ ਮਿਤੀ:",
    sowDateLabel: "⏱️ ਅਨੁਕੂਲ ਬੀਜਾਈ ਮਿਤੀ:",
    cropLabel: "🌾 ਫ਼ਸਲ:",
    stateLabel: "📍 ਲਕਸ਼ਿਤ ਰਾਜ:",
    localLangLabel: "🌐 ਸਥਾਨਕ ਭਾਸ਼ਾ ਨਾਮ:",
    adviceHeaderLabel: "💡 ਬੀਜਾਈ ਅਤੇ ਖੇਤ ਤਿਆਰੀ ਸਲਾਹ:",
    harvestDelayHeaderLabel: "🛑 ਫਸਲ ਦੀ ਤੁੜਵਾਈ / ਵਢਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ:",
    targetFestivalHeaderLabel: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ / ਤਿਉਹਾਰ (Target Event):",
    significanceHeaderLabel: "📖 ਤਿਉਹਾਰ ਦਾ ਮਹੱਤਵ:",
    mandiHeaderLabel: "📊 ਮੰਡੀ ਮੰਗ ਅਤੇ ਰੇਟ ਅਸਰ:",
    historicalHeaderLabel: "📈 5-ਸਾਲਾ ਮੰਡੀ ਰਿਕਾਰਡ (2021-2025):",
    shareBtnLabel: "📲 ਵਟਸਐਪ 'ਤੇ ਮਿਤੀਆਂ ਅਤੇ ਸਲਾਹ ਸ਼ੇਅਰ ਕਰੋ",
    emptyText: "ਇਸ ਟੈਬ ਵਿੱਚ ਤੁਹਾਡੇ ਚੁਣੇ ਹੋਏ ਫਿਲਟਰ ਨਾਲ ਕੋਈ ਫ਼ਸਲ ਮੇਲ ਨਹੀਂ ਖਾਂਦੀ। ਉੱਪਰ ਫਿਲਟਰ ਬਦਲੋ!"
  },
  hi: {
    headerTitle: "किसान फसल मांग व बुवाई इंटेलिजेंस इंजन",
    headerSub: "अगेती बुवाई (Advance Seasonal) व मुख्य सीजन फसलों की सही जानकारी से 2x-3x अधिक लाभ प्राप्त करें",
    tabDemand: "1. 📊 मंडी मांग व भाव (Demand & Price)",
    tabSowing: "2. 🌱 बुवाई व फसल योजना (Sowing & Plan)",
    cropFilterLabel: "🌾 फसल चयन (Select Crops):",
    daysFilterLabel: "📅 दिनों का फ़िल्टर (Days Filter):",
    seasonFilterLabel: "🌱 बुवाई सीजन प्रकार (Season Type):",
    eventDateLabel: "📅 मंडी पिक मांग तिथि:",
    sowDateLabel: "⏱️ अनुकूल बुवाई अवधि:",
    cropLabel: "🌾 फसल:",
    stateLabel: "📍 लक्षित राज्य:",
    localLangLabel: "🌐 स्थानीय भाषा नाम:",
    adviceHeaderLabel: "💡 बुवाई व खेत तैयारी सलाह:",
    harvestDelayHeaderLabel: "🛑 फसल तुड़ाई / कटाई रोकने की सलाह:",
    targetFestivalHeaderLabel: "🎯 लक्षित सीजन व त्योहार (Target Event):",
    significanceHeaderLabel: "📖 त्योहार का महत्व:",
    mandiHeaderLabel: "📊 मंडी मांग व भाव प्रभाव:",
    historicalHeaderLabel: "📈 5-वर्षीय मंडी रिकॉर्ड (2021-2025):",
    shareBtnLabel: "📲 व्हाट्सएप पर तिथियां व सलाह शेयर करें",
    emptyText: "आपके चयनित फ़िल्टर से कोई फसल मेल नहीं खाती। ऊपर फ़िल्टर बदलें!"
  }
};

export const CROP_INTELLIGENCE_DATA: CropIntelligenceItem[] = [
  // ==========================================
  // 🌸 FLOWERS (ONLY COMMERCIAL FLORICULTURE)
  // ==========================================
  {
    cropName: {
      en: "Flowers (Commercial Flowers & Floriculture)",
      pa: "ਫੁੱਲ (Commercial ਫੁੱਲਾਂ ਦੀ ਖੇਤੀ - Flowers)",
      hi: "फूल (व्यावसायिक फूलों की खेती - Flowers)"
    },
    category: "FLOWERS",
    seasonType: "SEASONAL",
    stateRegion: "ALL_INDIA",
    statesListText: {
      en: "Punjab, Maharashtra, UP, West Bengal, Tamil Nadu, Karnataka, MP, Gujarat",
      pa: "ਪੰਜਾਬ, ਮਹਾਰਾਸ਼ਟਰ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਪੱਛਮੀ ਬੰਗਾਲ, ਤਾਮਿਲਨਾਡੂ, ਕਰਨਾਟਕ, ਮੱਧ ਪ੍ਰਦੇਸ਼",
      hi: "पंजाब, महाराष्ट्र, उत्तर प्रदेश, पश्चिम बंगाल, तमिलनाडु, कर्नाटक, मध्य प्रदेश"
    },
    localLangName: "Flowers / ਫੁੱਲ (PB) / फूल (HI) / പൂക്കൾ (ML) / பூக்கள் (TN)",
    daysToEvent: 37,
    eventDate: {
      en: "Oct 11 - Oct 19 (Sharad Navratri & Durga Puja)",
      pa: "11 ਓਕਤੂਬਰ - 19 ਓਕਤੂਬਰ (ਨਵਰਾਤਰੇ & ਦੁਰਗਾ ਪੂਜਾ)",
      hi: "11 अक्टूबर - 19 अक्टूबर (नवरात्रि व दुर्गा पूजा)"
    },
    sowWindow: { en: "🌱 Year-round Flush Sowing: Jun 15 - Jul 15", pa: "🌱 ਸਾਲਾਨਾ ਪੌਧ ਲਵਾਈ: 15 ਜੂਨ - 15 ਜੁਲਾਈ", hi: "🌱 वार्षिक पौध रोपण: 15 जून - 15 जुलाई" },
    sowDates: { en: "Sowing / Transplanting: Jun 15 - Jul 15", pa: "ਪੌਧ ਲਵਾਈ ਮਿਤੀ: 15 ਜੂਨ - 15 ਜੁਲਾਈ", hi: "पौध रोपण तिथि: 15 जून - 15 जुलाई" },
    priceChange: { en: "▲ 3x Mandi Surge (₹120-₹250/kg)", pa: "▲ 3 ਗੁਣਾ ਮੰਡੀ ਰੇਟ (₹120-₹250/ਕਿਲੋ)", hi: "▲ 3 गुना मंडी रेट (₹120-₹250/किग्रा)" },
    festivalName: {
      en: "🛕 Sharad Navratri, Durga Puja & Wedding Season",
      pa: "🛕 ਸ਼ਾਰਦ ਨਵਰਾਤਰੇ, ਦੁਰਗਾ ਪੂਜਾ & ਵਿਆਹ ਸੀਜ਼ਨ",
      hi: "🛕 शरद नवरात्रि, दुर्गा पूजा व शादी सीजन"
    },
    faithCategory: "⭐ Worship & Festival Decoration",
    harvestDelayAdvice: {
      en: "🛑 Picking Delay Advisory: Stop picking flowers 4 days prior to Navratri/Durga Puja to capture 3x peak surge rates (₹120-₹250/kg) in wholesale mandis.",
      pa: "🛑 ਤੁੜਵਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਮੰਦਿਰਾਂ ਤੇ ਪਾਂਡਾਲਾਂ ਵਿੱਚ 3 ਗੁਣਾ ਮੰਗ ਵੇਲੇ ₹120-₹250/ਕਿਲੋ ਪੀਕ ਰੇਟ ਲੈਣ ਲਈ ਨਵਰਾਤਰੇ/ਦੁਰਗਾ ਪੂਜਾ ਤੋਂ 4 ਦਿਨ ਪਹਿਲਾਂ ਫੁੱਲਾਂ ਦੀ ਤੋੜਾਈ ਬਿਲਕੁਲ ਰੋਕ ਦਿਓ।",
      hi: "🛑 तुड़ाई रोकने की सलाह: नवरात्रि व दुर्गा पूजा से 4 दिन पूर्व फूलों की तुड़ाई रोकें ताकि मंडी में 3 गुना (₹120-₹250/किग्रा) भाव मिले।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Sharad Navratri, Durga Puja & Diwali Worship (Peak Market: Oct 11 - Nov 01)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਸ਼ਾਰਦ ਨਵਰਾਤਰੇ, ਦੁਰਗਾ ਪੂਜਾ & ਦੀਵਾਲੀ ਪੂਜਾ (ਪੀਕ ਮੰਡੀ ਮੰਗ: 11 ਓਕਤੂਬਰ - 01 ਨਵੰਬਰ)",
      hi: "🎯 लक्षित सीजन: शरद नवरात्रि, दुर्गा पूजा व दिवाली पूजन (पीक मंडी मांग: 11 अक्टूबर - 01 नवंबर)"
    },
    farmerAdvice: {
      en: "🌹 Plant early saplings in mid-June with 45x45 cm spacing. Apply neem oil spray every 10 days to protect blooms for October festival flushes.",
      pa: "🌹 ਜੂਨ ਦੇ ਅੱਧ ਵਿੱਚ 45x45 ਸੈਂਟੀਮੀਟਰ ਦੀ ਦੂਰੀ 'ਤੇ ਪੌਧ ਲਾਓ। ਓਕਤੂਬਰ ਦੇ ਤਿਉਹਾਰੀ ਫੁੱਲ ਖਿੜਨ ਲਈ ਹਰ 10 ਦਿਨ ਬਾਅਦ ਨੀਮ ਤੇਲ ਦਾ ਛਿੜਕਾਅ ਕਰੋ।",
      hi: "🌹 जून मध्य में 45x45 सेमी दूरी पर पौध लगाएं। अक्टूबर त्योहार पर फूलों की सुरक्षा के लिए नीम तेल का छिड़काव करें।"
    },
    significance: {
      en: "Navratri & Durga Puja festival where millions offer fresh garlands & petals for deity worship and mandap decorations.",
      pa: "ਨਵਰਾਤਰੇ ਅਤੇ ਦੁਰਗਾ ਪੂਜਾ ਵਿੱਚ ਮਾਤਾ ਰਾਣੀ ਦੀ ਪੂਜਾ ਅਤੇ ਪਾਂਡਾਲਾਂ ਦੀ ਸਜਾਵਟ ਲਈ ਕਰੋੜਾਂ ਫੁੱਲਾਂ ਦੀ ਖਪਤ ਹੁੰਦੀ ਹੈ।",
      hi: "नवरात्रि व दुर्गा पूजा में माता रानी की पूजा और मंडप सजावट हेतु करोड़ों फूलों की खपत होती है।"
    },
    mandiImpact: {
      en: "Wholesale mandi rate for flower garlands hits ₹120-₹250/kg across Ghazipur, Dadar & Bangalore flower markets.",
      pa: "ਗਾਜ਼ੀਪੁਰ (ਦਿੱਲੀ), ਦਾਦਰ (ਮੁੰਬਈ) ਅਤੇ ਬੰਗਲੌਰ ਮੰਡੀਆਂ ਵਿੱਚ ਫੁੱਲਾਂ ਦੇ ਹਾਰਾਂ ਦਾ ਭਾਅ ₹120-₹250/ਕਿਲੋ ਤੱਕ ਪਹੁੰਚ ਜਾਂਦਾ ਹੈ।",
      hi: "गाजीपुर, दादर और बंगलुरु मंडियों में फूल मालाओं का थोक भाव ₹120-₹250/किग्रा तक पहुंच जाता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Flowers surge 3x-4x to ₹120-₹250/kg during Navratri & Diwali compared to normal ₹30-₹50/kg off-season rates.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਨਵਰਾਤਰੇ ਅਤੇ ਦਿਵਾਲੀ ਵੇਲੇ ਫੁੱਲਾਂ ਦੇ ਥੋਕ ਮੰਡੀ ਭਾਅ ₹120-₹250/ਕਿਲੋ ਰਹੇ (ਆਮ ਦਿਨਾਂ ਦੇ ₹30-₹50 ਰੇਟ ਨਾਲੋਂ 3-4 ਗੁਣਾ ਵੱਧ)।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: नवरात्रि व दिवाली पर फूलों के थोक दाम ₹120-₹250/किग्रा रहे (सामान्य ₹30-₹50 से 3-4 गुना अधिक)।"
    }
  },

  // ==========================================
  // 🌱 ADVANCE SEASONAL VEGETABLES & CROPS
  // ==========================================
  {
    cropName: { en: "Early Peas (Pisum sativum)", pa: "ਅਗੇਤੇ ਮਟਰ (Early Peas)", hi: "अगेती मटर (Early Peas)" },
    category: "VEG",
    seasonType: "ADVANCE_SEASONAL",
    stateRegion: "NORTH",
    statesListText: {
      en: "Punjab, Himachal, UP, MP, Karnataka",
      pa: "ਪੰਜਾਬ, ਹਿਮਾਚਲ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਮੱਧ ਪ੍ਰਦੇਸ਼, ਕਰਨਾਟਕ",
      hi: "पंजाब, हिमाचल, उत्तर प्रदेश, मध्य प्रदेश, कर्नाटक"
    },
    localLangName: "ਮਟਰ (PB) | मटर (HI) | मटार (MR) | பட்டாணி (TN) | బటానీలు (TE)",
    daysToEvent: 63,
    eventDate: { en: "Nov 06 - Dec 31 (Diwali & Winter Weddings)", pa: "06 ਨਵੰਬਰ - 31 ਦਸੰਬਰ (ਦਿਵਾਲੀ & ਵਿਆਹ ਸੀਜ਼ਨ)", hi: "06 नवंबर - 31 दिसंबर (दिवाली व शादी सीजन)" },
    sowWindow: { en: "🌱 Advance Sowing: Sep 05 - Sep 20 (AP-3 / Matar 10)", pa: "🌱 ਅਗੇਤੀ ਬੀਜਾਈ: 05 ਸਤੰਬਰ - 20 ਸਤੰਬਰ", hi: "🌱 अगेती बुवाई: 05 सितंबर - 20 सितंबर" },
    sowDates: { en: "Sowing Window: Sep 05 - Sep 20", pa: "ਬੀਜਾਈ ਮਿਤੀ: 05 ਸਤੰਬਰ - 20 ਸਤੰਬਰ", hi: "बुवाई तिथि: 05 सितंबर - 20 सितंबर" },
    priceChange: { en: "▲ 3x Rate Surge (₹80-₹140/kg)", pa: "▲ 3 ਗੁਣਾ ਰੇਟ ਵਾਧਾ (₹80-₹140/ਕਿਲੋ)", hi: "▲ 3 गुना रेट वृद्धि (₹80-₹140/किग्रा)" },
    festivalName: { en: "🪔 Diwali & Winter Wedding Catering Demand", pa: "🪔 ਦਿਵਾਲੀ & ਸਰਦੀਆਂ ਦੇ ਵਿਆਹ", hi: "🪔 दिवाली व सर्दियों की शादियां" },
    faithCategory: "⭐ Advance Festive & Marriage Catering Demand",
    harvestDelayAdvice: {
      en: "🛑 Harvesting Delay Advisory: Do not pick immature pods. Delay pod picking by 3-5 days to align with Diwali week when rates peak at ₹80-₹140/kg.",
      pa: "🛑 ਤੁੜਵਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਅਗੇਤੀਆਂ ਫਲੀਂਆਂ ਦੀ ਤੋੜਾਈ ਕੱਚੀ ਨਾ ਕਰੋ! ਪੂਰੀ ਫਲੀ ਭਰਨ ਤੱਕ 3-5 ਦਿਨ ਰੋਕ ਕੇ ਦਿਵਾਲੀ ਹਫ਼ਤੇ ਵਿੱਚ ₹80-₹140/ਕਿਲੋ ਪੀਕ ਰੇਟ 'ਤੇ ਵੇਚੋ।",
      hi: "🛑 तुड़ाई रोकने की सलाह: कच्ची फलियों की तुड़ाई न करें! 3-5 दिन रोककर दिवाली सप्ताह में ₹80-₹140/किग्रा भाव पर बेचें।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Early Winter, Diwali & Marriage Season Catering (Target Harvest: Nov 01 - Nov 20)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਅਗੇਤੀ ਸਰਦੀ, ਦਿਵਾਲੀ & ਵਿਆਹ ਕੈਟਰਿੰਗ ਮੰਗ (ਲਕਸ਼ਿਤ ਵਢਾਈ: 01 ਨਵੰਬਰ - 20 ਨਵੰਬਰ)",
      hi: "🎯 लक्षित सीजन: अगेती सर्दी, दिवाली व विवाह कैटरिंग मांग (लक्षित कटाई: 01 नवंबर - 20 नवंबर)"
    },
    farmerAdvice: {
      en: "🫛 Sow early varieties AP-3 or Matar 10 between Sep 05-20. Treat seed with Rhizobium culture to harvest during Diwali & marriage season.",
      pa: "🫛 ਅਗੇਤੀਆਂ ਕਿਸਮਾਂ AP-3 ਜਾਂ ਮਟਰ 10 ਦੀ ਬੀਜਾਈ 05-20 ਸਤੰਬਰ ਵਿੱਚ ਕਰੋ। ਰਾਈਜ਼ੋਬੀਅਮ ਟੀਕੇ ਨਾਲ ਬੀਜ ਸੋਧ ਕੇ ਦਿਵਾਲੀ ਅਤੇ ਵਿਆਹ ਸੀਜ਼ਨ ਲਈ ਤਿਆਰ ਕਰੋ।",
      hi: "🫛 अगेती किस्म AP-3 या मटर 10 की बुवाई 05-20 सितंबर के बीच करें। राइजोबियम से बीज उपचारित करें।"
    },
    significance: {
      en: "Diwali feasts and lavish North Indian wedding banquets consume massive quantities of fresh green peas (Matar Paneer, Pulao).",
      pa: "ਦਿਵਾਲੀ ਦੇ ਪਕਵਾਨਾਂ ਅਤੇ ਸਰਦੀਆਂ ਦੇ ਵਿਆਹਾਂ ਦੇ ਖਾਣਿਆਂ (ਮਟਰ ਪਨੀਰ, ਪੁਲਾਓ) ਵਿੱਚ ਤਾਜ਼ੇ ਹਰੇ ਮਟਰਾਂ ਦੀ ਬਹੁਤ ਭਾਰੀ ਖਪਤ ਹੁੰਦੀ ਹੈ।",
      hi: "दिवाली के व्यंजनों व शादियों के खानों (मटर पनीर, पुलाव) में ताजा हरे मटर की भारी खपत होती है।"
    },
    mandiImpact: {
      en: "Early peas arriving in early November command ₹80-₹140/kg in Delhi Azadpur, Ludhiana & Chandigarh mandis before bulk harvest arrives.",
      pa: "ਨਵੰਬਰ ਦੇ ਸ਼ੁਰੂ ਵਿੱਚ ਆਉਣ ਵਾਲੇ ਅਗੇਤੇ ਮਟਰਾਂ ਦਾ ਭਾਅ ਦਿੱਲੀ ਆਜ਼ਾਦਪੁਰ, ਲੁਧਿਆਣਾ ਅਤੇ ਚੰਡੀਗੜ੍ਹ ਮੰਡੀਆਂ ਵਿੱਚ ₹80-₹140/ਕਿਲੋ ਤੱਕ ਮਿਲਦਾ ਹੈ।",
      hi: "नवंबर शुरुआत में अगेती मटर का भाव दिल्ली आजादपुर, लुधियाना व चंडीगढ़ में ₹80-₹140/किग्रा तक मिलता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Early November peas opened at ₹80-₹140/kg, whereas main-season December crop fell to ₹20-₹30/kg.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਨਵੰਬਰ ਦੇ ਸ਼ੁਰੂ ਵਿੱਚ ਮਟਰ ₹80-₹140/ਕਿਲੋ ਵਿਕੇ, ਜਦਕਿ ਦਸੰਬਰ ਦੇ ਮੁੱਖ ਸੀਜ਼ਨ ਵਿੱਚ ਰੇਟ ਘਟ ਕੇ ₹20-₹30/ਕਿਲੋ ਰਹਿ ਜਾਂਦਾ ਹੈ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: नवंबर शुरुआत में मटर ₹80-₹140/किग्रा बिके, जबकि दिसंबर मुख्य फसल ₹20-₹30/किग्रा रह जाती है।"
    }
  },

  {
    cropName: { en: "Early Cauliflower (Brassica oleracea)", pa: "ਅਗੇਤੀ ਗੋਭੀ (Early Cauliflower)", hi: "अगेती फूलगोभी (Early Cauliflower)" },
    category: "VEG",
    seasonType: "ADVANCE_SEASONAL",
    stateRegion: "NORTH",
    statesListText: {
      en: "Punjab, Haryana, HP, UP, Bihar",
      pa: "ਪੰਜਾਬ, ਹਰਿਆਣਾ, ਹਿਮਾਚਲ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਬਿਹਾਰ",
      hi: "पंजाब, हरियाणा, हिमाचल, उत्तर प्रदेश, बिहार"
    },
    localLangName: "ਫੁੱਲ ਗੋਭੀ (PB) | फूलगोभी (HI) | फ्लावर (MR) | காலிபிளவர் (TN)",
    daysToEvent: 44,
    eventDate: { en: "Oct 18 - Nov 05 (Post-Navratri & Dussehra)", pa: "18 ਓਕਤੂਬਰ - 05 ਨਵੰਬਰ (ਨਵਰਾਤਰੇ ਬਾਅਦ & ਦੁਸਹਿਰਾ)", hi: "18 अक्टूबर - 05 नवंबर (नवरात्रि बाद व दशहरा)" },
    sowWindow: { en: "🌱 Advance Nursery: Jul 15 - Aug 10 (Pusa Katki)", pa: "🌱 ਅਗੇਤੀ ਪਨੀਰੀ: 15 ਜੁਲਾਈ - 10 ਅਗਸਤ", hi: "🌱 अगेती नर्सरी: 15 जुलाई - 10 अगस्त" },
    sowDates: { en: "Nursery / Transplanting: Jul 15 - Aug 10", pa: "ਪਨੀਰੀ / ਲਵਾਈ ਮਿਤੀ: 15 ਜੁਲਾਈ - 10 ਅਗਸਤ", hi: "नर्सरी / रोपाई तिथि: 15 जुलाई - 10 अगस्त" },
    priceChange: { en: "▲ +120% Price Premium (₹45-₹70/kg)", pa: "▲ +120% ਰੇਟ ਮੁਨਾਫ਼ਾ (₹45-₹70/ਕਿਲੋ)", hi: "▲ +120% मूल्य लाभ (₹45-₹70/किग्रा)" },
    festivalName: { en: "🏹 Dussehra & Post-Fasting Feast Demand", pa: "🏹 ਦੁਸਹਿਰਾ & ਵਰਤ ਖੁੱਲ੍ਹਣ ਦੀ ਮੰਗ", hi: "🏹 दशहरा व व्रत खुलने की मांग" },
    faithCategory: "⭐ Post-Fasting Fresh Veggie Demand",
    harvestDelayAdvice: {
      en: "🛑 Picking Delay Advisory: Delay cauliflower harvesting by 5 days until Navratri fasting ends (Oct 18). Demand surges immediately after fasting, pushing rates to ₹45-₹70/kg.",
      pa: "🛑 ਤੁੜਵਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਨਵਰਾਤਰਿਆਂ ਦੇ ਵਰਤ ਖਤਮ ਹੋਣ ਤੱਕ (18 ਓਕਤੂਬਰ) ਗੋਭੀ ਦੇ ਫੁੱਲ ਦੀ ਤੋੜਾਈ 5 ਦਿਨ ਰੋਕੋ। ਵਰਤ ਖੁੱਲ੍ਹਦੇ ਹੀ ਮੰਡੀ ਵਿੱਚ ₹45-₹70/ਕਿਲੋ ਦਾ ਰੇਟ ਮਿਲੇਗਾ।",
      hi: "🛑 तुड़ाई रोकने की सलाह: नवरात्रि व्रत समाप्ति (18 अक्टूबर) तक तुड़ाई 5 दिन रोकें। व्रत खुलते ही ₹45-₹70/किग्रा रेट मिलेगा।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Post-Navratri, Dussehra & Diwali Fresh Veggie Demand (Target Harvest: Oct 15 - Oct 30)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਨਵਰਾਤਰੇ ਸਮਾਪਤੀ, ਦੁਸਹਿਰਾ & ਦੀਵਾਲੀ ਮੰਗ (ਲਕਸ਼ਿਤ ਤੋੜਾਈ: 15 ਓਕਤੂਬਰ - 30 ਓਕਤੂਬਰ)",
      hi: "🎯 लक्षित सीजन: नवरात्रि समाप्ति, दशहरा व दिवाली मांग (लक्षित कटाई: 15 अक्टूबर - 30 अक्टूबर)"
    },
    farmerAdvice: {
      en: "🥦 Sow early variety Pusa Katki or Early Kunwari in July. Ensure ridge planting to protect young plants from monsoon waterlogging.",
      pa: "🥦 ਅਗੇਤੀ ਕਿਸਮ ਪੂਸਾ ਕਾਤਕੀ ਜਾਂ ਅਗੇਤੀ ਕੁਆਰੀ ਜੁਲਾਈ ਵਿੱਚ ਬੀਜੋ। ਬਰਸਾਤੀ ਪਾਣੀ ਤੋਂ ਬਚਾਅ ਲਈ ਵੱਟਾਂ 'ਤੇ ਪੌਧ ਲਾਓ।",
      hi: "🥦 अगेती किस्म पूसा कातकी की बुवाई जुलाई में करें। बारिश से बचाव के लिए मेड़ों पर पौध लगाएं।"
    },
    significance: {
      en: "After 9 days of strict Navratri fasting, North Indian households resume buying fresh green vegetables, causing a massive demand spike.",
      pa: "9 ਦਿਨਾਂ ਦੇ ਨਵਰਾਤਰੇ ਵਰਤਾਂ ਤੋਂ ਬਾਅਦ ਘਰਾਂ ਵਿੱਚ ਤਾਜ਼ੀਆਂ ਸਬਜ਼ੀਆਂ ਦੀ ਖਪਤ ਅਚਾਨਕ ਵਧ ਜਾਂਦੀ ਹੈ।",
      hi: "9 दिनों के नवरात्रि व्रत के बाद घरों में ताजा सब्जियों की खपत अचानक बढ़ जाती है।"
    },
    mandiImpact: {
      en: "Early cauliflower commands ₹45-₹70/kg in October mandis, compared to ₹10-₹15/kg in peak winter (January).",
      pa: "ਓਕਤੂਬਰ ਵਿੱਚ ਅਗੇਤੀ ਗੋਭੀ ਦਾ ਰੇਟ ₹45-₹70/ਕਿਲੋ ਮਿਲਦਾ ਹੈ, ਜਦਕਿ ਜਨਵਰੀ ਦੇ ਪੀਕ ਸੀਜ਼ਨ ਵਿੱਚ ਇਹ ਰੇਟ ₹10-₹15/ਕਿਲੋ ਰਹਿ ਜਾਂਦਾ ਹੈ।",
      hi: "अक्टूबर में अगेती गोभी का भाव ₹45-₹70/किग्रा मिलता है, जबकि जनवरी में यह ₹10-₹15/किग्रा रह जाता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): October early cauliflower fetched ₹45-₹70/kg average across Punjab & Haryana mandis.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਓਕਤੂਬਰ ਵਿੱਚ ਅਗੇਤੀ ਗੋਭੀ ਦਾ ਥੋਕ ਰੇਟ ₹45-₹70/ਕਿਲੋ ਰਿਕਾਰਡ ਕੀਤਾ ਗਿਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: अक्टूबर में अगेती गोभी का थोक रेट ₹45-₹70/किग्रा दर्ज हुआ।"
    }
  },

  {
    cropName: { en: "Potato (Solanum tuberosum)", pa: "ਆਲੂ (Potato - Cold Storage & Early)", hi: "आलू (Potato - कोल्ड स्टोरेज व अगेती)" },
    category: "VEG",
    seasonType: "ADVANCE_SEASONAL",
    stateRegion: "NORTH",
    statesListText: {
      en: "Punjab, UP, West Bengal, Gujarat, MP",
      pa: "ਪੰਜਾਬ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਪੱਛਮੀ ਬੰਗਾਲ, ਗੁਜਰਾਤ, ਮੱਧ ਪ੍ਰਦੇਸ਼",
      hi: "पंजाब, उत्तर प्रदेश, पश्चिम बंगाल, गुजरात, मध्य प्रदेश"
    },
    localLangName: "ਆਲੂ (PB) | आलू (HI) | बटाटा (MR) | உருளைக்கிழங்கு (TN) | బంగాళాదుంప (TE)",
    daysToEvent: 34,
    eventDate: { en: "Oct 08 - Oct 18 (Navratri Fasting Period)", pa: "08 ਓਕਤੂਬਰ - 18 ਓਕਤੂਬਰ (ਨਵਰਾਤਰੇ ਵਰਤ ਦਿਨ)", hi: "08 अक्टूबर - 18 अक्टूबर (नवरात्रि व्रत)" },
    sowWindow: { en: "🌱 Cold-Storage Release / Early Planting: Sep 15 - Oct 05", pa: "🌱 ਸਟੋਰ ਨਿਕਾਸ / ਅਗੇਤੀ ਬੀਜਾਈ: 15 ਸਤੰਬਰ - 05 ਓਕਤੂਬਰ", hi: "🌱 स्टोरेज निकासी / अगेती बुवाई: 15 सितंबर - 05 अक्टूबर" },
    sowDates: { en: "Sow / Release Window: Sep 15 - Oct 05", pa: "ਬੀਜਾਈ / ਨਿਕਾਸ ਮਿਤੀ: 15 ਸਤੰਬਰ - 05 ਓਕਤੂਬਰ", hi: "बुवाई / निकासी तिथि: 15 सितंबर - 05 अक्टूबर" },
    priceChange: { en: "▲ +85% Mandi Surge (₹25-₹35/kg)", pa: "▲ +85% ਮੰਡੀ ਰੇਟ (₹25-₹35/ਕਿਲੋ)", hi: "▲ +85% मंडी रेट (₹25-₹35/किग्रा)" },
    festivalName: { en: "🛕 Navratri Fasting (Falahar) Consumption", pa: "🛕 ਨਵਰਾਤਰੇ ਵਰਤ (ਫਲਾਹਾਰ) ਮੰਗ", hi: "🛕 नवरात्रि व्रत (फलाहार) मांग" },
    faithCategory: "⭐ Essential Navratri Fasting Food",
    harvestDelayAdvice: {
      en: "🛑 Store Release Delay Advisory: Hold potato release until Oct 07. Non-onion/garlic Navratri fasting pushes potato consumption, driving rates to ₹25-₹35/kg from Oct 08.",
      pa: "🛑 ਸਟੋਰ ਨਿਕਾਲ ਰੋਕਣ ਦੀ ਸਲਾਹ: 07 ਓਕਤੂਬਰ ਤੱਕ ਕੋਲਡ ਸਟੋਰ ਆਲੂ ਦੀ ਨਿਕਾਸੀ ਰੋਕੋ! ਨਵਰਾਤਰਿਆਂ ਵਿੱਚ ਪਿਆਜ਼-ਲਸਣ ਬੰਦ ਹੋਣ ਕਰਕੇ 08 ਓਕਤੂਬਰ ਤੋਂ ਆਲੂ ₹25-₹35/ਕਿਲੋ ਦੇ ਪੀਕ ਭਾਅ 'ਤੇ ਵਿਕੇਗਾ।",
      hi: "🛑 निकासी रोकने की सलाह: 07 अक्टूबर तक आलू निकासी रोकें। नवरात्रि में बिना प्याज-लहसुन आलू की खपत से भाव ₹25-₹35/किग्रा मिलेगा।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Navratri Fasting (Falahar) & Dussehra Feast (Target Release: Oct 08 - Oct 18)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਨਵਰਾਤਰੇ ਫਲਾਹਾਰ & ਦੁਸਹਿਰਾ ਮੰਗ (ਲਕਸ਼ਿਤ ਮੰਡੀ ਨਿਕਾਲ: 08 ਓਕਤੂਬਰ - 18 ਓਕਤੂਬਰ)",
      hi: "🎯 लक्षित सीजन: नवरात्रि फलाहार व दशहरा मांग (लक्षित मंडी निकासी: 08 अक्टूबर - 18 अक्टूबर)"
    },
    farmerAdvice: {
      en: "🥔 Release cold storage stock systematically starting Oct 08. For early sowing, use Kufri Pukhraj seed tubers treated with Emesto Prime.",
      pa: "🥔 08 ਓਕਤੂਬਰ ਤੋਂ ਕੋਲਡ ਸਟੋਰ ਆਲੂ ਮੰਡੀ ਵਿੱਚ ਲਿਆਓ। ਅਗੇਤੀ ਬੀਜਾਈ ਲਈ ਕੁਫ਼ਰੀ ਪੁਖਰਾਜ ਬੀਜ ਨੂੰ ਇਮੈਸਟੋ ਪ੍ਰਾਈਮ ਨਾਲ ਸੋਧ ਕੇ ਬੀਜੋ।",
      hi: "🥔 08 अक्टूबर से कोल्ड स्टोरेज आलू मंडी में लाएं। अगेती बुवाई के लिए कुफरी पुखराज बीज का प्रयोग करें।"
    },
    significance: {
      en: "Potato is the primary allowed staple food (Falahar) during Navratri when millions refrain from grains, onion, and garlic.",
      pa: "ਨਵਰਾਤਰਿਆਂ ਦੇ ਵਰਤਾਂ ਵਿੱਚ ਅਨਾਜ, ਪਿਆਜ਼ ਅਤੇ ਲਸਣ ਬੰਦ ਹੋਣ ਕਰਕੇ ਆਲੂ (ਫਲਾਹਾਰ) ਦੀ ਵਰਤੋਂ ਸਭ ਤੋਂ ਵੱਧ ਹੁੰਦੀ ਹੈ।",
      hi: "नवरात्रि व्रतों में अनाज व प्याज-लहसुन बंद होने से आलू (फलाहार) का सेवन सर्वाधिक होता है।"
    },
    mandiImpact: {
      en: "Table potato rates surge to ₹25-₹35/kg in North Indian wholesale mandis due to Navratri falahar demand.",
      pa: "ਨਵਰਾਤਰੇ ਫਲਾਹਾਰ ਦੀ ਮੰਗ ਕਰਕੇ ਉੱਤਰੀ ਭਾਰਤ ਦੀਆਂ ਮੰਡੀਆਂ ਵਿੱਚ ਆਲੂ ਦਾ ਭਾਅ ₹25-₹35/ਕਿਲੋ ਤੱਕ ਚੜ੍ਹ ਜਾਂਦਾ ਹੈ।",
      hi: "नवरात्रि फलाहार मांग से उत्तर भारत की मंडियों में आलू का भाव ₹25-₹35/किग्रा हो जाता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Navratri week potato prices recorded an 85% price jump compared to August off-season averages.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਨਵਰਾਤਰੇ ਹਫ਼ਤੇ ਵਿੱਚ ਆਲੂ ਦੇ ਰੇਟ ਵਿੱਚ ਅਗਸਤ ਨਾਲੋਂ 85% ਵਾਧਾ ਦਰਜ ਕੀਤਾ ਗਿਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: नवरात्रि सप्ताह में आलू भाव में अगस्त की तुलना में 85% वृद्धि हुई।"
    }
  },

  // ==========================================
  // 🌾 GRAINS & COMMERCIAL CASH CROPS
  // ==========================================
  {
    cropName: { en: "Paddy / Basmati Rice (Oryza sativa)", pa: "ਝੋਨਾ / ਬਾਸਮਤੀ ਚਾਵਲ (Paddy)", hi: "धान / बासमती चावल (Paddy)" },
    category: "GRAINS_CASH",
    seasonType: "SEASONAL",
    stateRegion: "ALL_INDIA",
    statesListText: {
      en: "Punjab, Haryana, UP, West Bengal, AP, Odisha, Telangana",
      pa: "ਪੰਜਾਬ, ਹਰਿਆਣਾ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਪੱਛਮੀ ਬੰਗਾਲ, ਆਂਧਰਾ, ਓਡੀਸ਼ਾ, ਤੇਲੰਗਾਨਾ",
      hi: "पंजाब, हरियाणा, उत्तर प्रदेश, पश्चिम बंगाल, आंध्र, ओडिशा, तेलंगाना"
    },
    localLangName: "ਝੋਨਾ/ਚਾਵਲ (PB) | धान/चावल (HI) | भात (MR) | ধান (BN) | அரிசி (TN)",
    daysToEvent: 50,
    eventDate: { en: "Oct 15 - Nov 10 (Diwali Mandi Procurement)", pa: "15 ਓਕਤੂਬਰ - 10 ਨਵੰਬਰ (ਦਿਵਾਲੀ ਮੰਡੀ ਖਰੀਦ)", hi: "15 अक्टूबर - 10 नवंबर (दिवाली मंडी खरीद)" },
    sowWindow: { en: "🌱 Nursery / Sowing: May 20 - Jun 25 (Pusa 1121 / PR 126)", pa: "🌱 ਪਨੀਰੀ / ਬੀਜਾਈ: 20 ਮਈ - 25 ਜੂਨ", hi: "🌱 पौध / बुवाई: 20 मई - 25 जून" },
    sowDates: { en: "Nursery / Transplanting: May 20 - Jun 25", pa: "ਪਨੀਰੀ / ਲਵਾਈ ਮਿਤੀ: 20 ਮਈ - 25 ਜੂਨ", hi: "पौध / रोपाई तिथि: 20 मई - 25 जून" },
    priceChange: { en: "▲ MSP & Export Surge (₹4,200-₹4,850/qtl)", pa: "▲ ਬਾਸਮਤੀ ਮੰਡੀ ਭਾਅ (₹4,200-₹4,850/ਕੁਇੰਟਲ)", hi: "▲ बासमती मंडी भाव (₹4,200-₹4,850/कुंतल)" },
    festivalName: { en: "🪔 Post-Diwali Mill Procurement Season", pa: "🪔 ਦਿਵਾਲੀ ਮਿਲ ਖਰੀਦ ਸੀਜ਼ਨ", hi: "🪔 दिवाली मिल खरीद सीजन" },
    faithCategory: "⭐ Main Festive Grain & Basmati Export Demand",
    harvestDelayAdvice: {
      en: "🛑 Harvesting Delay Advisory: Do not harvest high-moisture paddy (>17%). Delay combine harvesting by 4-6 days to let grains dry naturally for full ₹4,200-₹4,850/qtl price.",
      pa: "🛑 ਵਢਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਝੋਨੇ ਵਿੱਚ ਸਿੱਲ 17% ਤੋਂ ਵੱਧ ਹੋਣ 'ਤੇ ਕੰਬਾਈਨ ਨਾ ਲਾਓ! 4-6 ਦਿਨ ਵਢਾਈ ਰੋਕ ਕੇ ਦਾਣਾ ਪੱਕਣ ਦਿਓ ਤਾਂ ਜੋ ਮੰਡੀ ਵਿੱਚ ਰਿਜੈਕਸ਼ਨ ਨਾ ਹੋਵੇ ਅਤੇ ₹4,200-₹4,850/ਕੁਇੰਟਲ ਪੂਰਾ ਭਾਅ ਮਿਲੇ।",
      hi: "🛑 कटाई रोकने की सलाह: 17% से अधिक नमी पर कटाई न करें! 4-6 दिन रोककर प्राकृतिक सुखाने के बाद पूरा ₹4,200-₹4,850/कुंतल भाव लें।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Post-Diwali Mill Procurement & Basmati Rice Export Season (Target Harvest: Oct 15 - Nov 10)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਦਿਵਾਲੀ ਮੰਡੀ ਖਰੀਦ & ਬਾਸਮਤੀ ਐਕਸਪੋਰਟ ਸੀਜ਼ਨ (ਲਕਸ਼ਿਤ ਵਢਾਈ: 15 ਓਕਤੂਬਰ - 10 ਨਵੰਬਰ)",
      hi: "🎯 लक्षित सीजन: दिवाली मंडी खरीद व बासमती निर्यात सीजन (लक्षित कटाई: 15 अक्टूबर - 10 नवंबर)"
    },
    farmerAdvice: {
      en: "🌾 Sow nursery between May 20-Jun 15. Apply recommended NPK doses and avoid excess nitrogen near maturity to ensure long grain quality for Basmati export.",
      pa: "🌾 ਪਨੀਰੀ 20 ਮਈ ਤੋਂ 15 ਜੂਨ ਵਿਚਕਾਰ ਲਾਓ। ਬਾਸਮਤੀ ਦੀ ਐਕਸਪੋਰਟ ਗੁਣਵੱਤਾ ਲਈ ਪੱਕਣ ਸਮੇਂ ਵਾਧੂ ਯੂਰੀਆ ਨਾ ਪਾਓ।",
      hi: "🌾 मई 20 से जून 15 के बीच पौध लगाएं। बासमती की अच्छी गुणवत्ता के लिए पकाई पर अधिक यूरिया न दें।"
    },
    significance: {
      en: "Basmati rice is the centerpiece of festive biryanis, kheer, and religious rituals across India during Diwali and New Year.",
      pa: "ਦਿਵਾਲੀ, ਗੁਰਪੁਰਬ ਅਤੇ ਛੱਠ ਪੂਜਾ 'ਤੇ ਖੀਰ ਅਤੇ ਪਕਵਾਨਾਂ ਲਈ ਬਾਸਮਤੀ ਚਾਵਲ ਦੀ ਸਭ ਤੋਂ ਵੱਧ ਖਪਤ ਹੁੰਦੀ ਹੈ।",
      hi: "दिवाली व छठ पूजा पर खीर व व्यंजनों हेतु बासमती चावल का सर्वाधिक प्रयोग होता है।"
    },
    mandiImpact: {
      en: "Pusa 1121 & 1509 Basmati paddy fetch ₹4,200-₹4,850/qtl in Punjab & Haryana mandis during post-Diwali export buying.",
      pa: "ਦਿਵਾਲੀ ਤੋਂ ਬਾਅਦ ਬਾਸਮਤੀ 1121 ਅਤੇ 1509 ਦਾ ਭਾਅ ਪੰਜਾਬ-ਹਰਿਆਣਾ ਮੰਡੀਆਂ ਵਿੱਚ ₹4,200-₹4,850/ਕੁਇੰਟਲ ਤੱਕ ਵਿਕਦਾ ਹੈ।",
      hi: "दिवाली के बाद बासमती 1121 का भाव पंजाब व हरियाणा मंडियों में ₹4,200-₹4,850/कुंतल तक बिकता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Basmati paddy prices averaged ₹4,200-₹4,850/qtl in October-November mandi buying.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਓਕਤੂਬਰ-ਨਵੰਬਰ ਵਿੱਚ ਬਾਸਮਤੀ ਦਾ ਔਸਤ ਮੰਡੀ ਭਾਅ ₹4,200-₹4,850/ਕੁਇੰਟਲ ਰਿਕਾਰਡ ਹੋਇਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: अक्टूबर-नवंबर में बासमती का औसत मंडी भाव ₹4,200-₹4,850/कुंतल रहा।"
    }
  },

  {
    cropName: { en: "Red Sugarcane (Saccharum officinarum)", pa: "ਗੰਨਾ / ਲਾਲ ਗੰਨਾ (Red Sugarcane)", hi: "गन्ना / लाल गन्ना (Red Sugarcane)" },
    category: "GRAINS_CASH",
    seasonType: "SEASONAL",
    stateRegion: "ALL_INDIA",
    statesListText: {
      en: "UP, Punjab, Maharashtra, Karnataka, Tamil Nadu, Bihar",
      pa: "ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਪੰਜਾਬ, ਮਹਾਰਾਸ਼ਟਰ, ਕਰਨਾਟਕ, ਤਾਮਿਲਨਾਡੂ, ਬਿਹਾਰ",
      hi: "उत्तर प्रदेश, पंजाब, महाराष्ट्र, कर्नाटक, तमिलनाडु, बिहार"
    },
    localLangName: "ਗੰਨਾ (PB) | गन्ना (HI) | ऊस (MR) | கரும்பு (TN) | చెరకు (TE)",
    daysToEvent: 58,
    eventDate: { en: "Nov 05 - Nov 08 (Chhath Puja Worship)", pa: "05 ਨਵੰਬਰ - 08 ਨਵੰਬਰ (ਛੱਠ ਪੂਜਾ ਪੂਜਨ)", hi: "05 नवंबर - 08 नवंबर (छठ पूजा पूजन)" },
    sowWindow: { en: "🌱 Spring / Autumn Planting: Feb 15 - Mar 30 (Co 0238 / CoPB 92)", pa: "🌱 ਬੀਜਾਈ ਮਿਤੀ: 15 ਫਰਵਰੀ - 30 ਮਾਰਚ", hi: "🌱 बुवाई तिथि: 15 फरवरी - 30 मार्च" },
    sowDates: { en: "Sowing Window: Feb 15 - Mar 30", pa: "ਬੀਜਾਈ ਮਿਤੀ: 15 ਫਰਵਰੀ - 30 ਮਾਰਚ", hi: "बुवाई तिथि: 15 फरवरी - 30 मार्च" },
    priceChange: { en: "▲ ₹40-₹70 per Stick / Mill SAP", pa: "▲ ₹40-₹70 ਪ੍ਰਤੀ ਗੰਨਾ (ਛੱਠ ਪੂਜਾ)", hi: "▲ ₹40-₹70 प्रति गन्ना (छठ पूजा)" },
    festivalName: { en: "☀️ Chhath Puja & Sugar Mill Crushing Season", pa: "☀️ ਛੱਠ ਪੂਜਾ & ਸ਼ੂਗਰ ਮਿਲ ਸੀਜ਼ਨ", hi: "☀️ छठ पूजा व चीनी मिल सीजन" },
    faithCategory: "⭐ Chhath Sacred Offerings & Cash Crop",
    harvestDelayAdvice: {
      en: "🛑 Harvest Delay Advisory: Reserve whole red sugarcane sticks for Chhath Puja (Nov 05-07). Selling whole stalks for worship yields ₹40-₹70 per stick instead of mill rates.",
      pa: "🛑 ਛਿੱਲਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਛੱਠ ਪੂਜਾ (05-07 ਨਵੰਬਰ) ਤੋਂ ਪਹਿਲਾਂ ਲਾਲ ਸਾਬਤ ਗੰਨੇ ਦੀ ਛਿੱਲਾਈ ਨਾ ਕਰੋ! ਪੂਜਾ ਲਈ ਸਾਬਤ ਪੋਰੀ ਵਾਲਾ ਗੰਨਾ ਮੰਡੀ ਵਿੱਚ ₹40-₹70/ਪੋਰੀ (ਗੰਨਾ) ਦੇ ਸੁਪਰ ਰੇਟ 'ਤੇ ਵਿਕਦਾ ਹੈ।",
      hi: "🛑 छिलाई रोकने की सलाह: छठ पूजा (05-07 नवंबर) हेतु पूरे लाल गन्ने को सुरक्षित रखें! पूजा हेतु ₹40-₹70 प्रति गन्ना थोक भाव मिलता है।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Chhath Puja Worship & Sugar Mill Crushing Operations (Target Harvest: Oct 25 - Nov 10)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਛੱਠ ਪੂਜਾ, ਦੀਵਾਲੀ & ਸ਼ੂਗਰ ਮਿਲ ਪੜੜੀ ਕ੍ਰਸ਼ਿੰਗ (ਲਕਸ਼ਿਤ ਛਿੱਲਾਈ: 25 ਓਕਤੂਬਰ - 10 ਨਵੰਬਰ)",
      hi: "🎯 लक्षित सीजन: छठ पूजा पूजन व चीनी मिल पेराई (लक्षित छिलाई: 25 अक्टूबर - 10 नवंबर)"
    },
    farmerAdvice: {
      en: "🎋 Plant high-sucrose varieties Co 0238 or CoPB 92 in Feb-March. Tie cane stalks in August to prevent lodging and maintain straight whole canes for festival sale.",
      pa: "🎋 ਫਰਵਰੀ-ਮਾਰਚ ਵਿੱਚ Co 0238 ਜਾਂ CoPB 92 ਕਿਸਮ ਲਾਓ। ਅਗਸਤ ਵਿੱਚ ਗੰਨੇ ਦੀ ਬੰਨ੍ਹਾਈ ਕਰੋ ਤਾਂ ਜੋ ਗੰਨਾ ਲੰਮਾ ਅਤੇ ਸਿੱਧਾ ਰਹੇ।",
      hi: "🎋 फरवरी-मार्च में Co 0238 किस्म लगाएं। अगस्त में गन्ने की बंधाई करें ताकि गन्ना सीधा रहे।"
    },
    significance: {
      en: "Full intact red sugarcane stalks with leaves are mandatory offerings to the Sun God during the ancient festival of Chhath Puja.",
      pa: "ਛੱਠ ਪੂਜਾ ਵਿੱਚ ਸੂਰਜ ਦੇਵਤਾ ਨੂੰ ਅਰਘ ਦੇਣ ਲਈ ਪੱਤਿਆਂ ਸਮੇਤ ਲਾਲ ਸਾਬਤ ਗੰਨਾ ਜ਼ਰੂਰੀ ਪੂਜਾ ਸਮੱਗਰੀ ਹੈ।",
      hi: "छठ पूजा में सूर्य देव को अर्घ्य देने हेतु पत्तियों सहित लाल गन्ना अनिवार्य होता है।"
    },
    mandiImpact: {
      en: "Whole sugarcane stalks fetch ₹40-₹70 per cane in retail urban mandis during Chhath Puja, yielding 5x higher profit than sugar mill rate.",
      pa: "ਛੱਠ ਪੂਜਾ ਮੌਕੇ ਮੰਡੀ ਵਿੱਚ ਸਾਬਤ ਗੰਨਾ ₹40-₹70 ਪ੍ਰਤੀ ਗੰਨਾ ਵਿਕਦਾ ਹੈ, ਜੋ ਕਿ ਸ਼ੂਗਰ ਮਿਲ ਦੇ ਰੇਟ ਨਾਲੋਂ 5 ਗੁਣਾ ਵੱਧ ਮੁਨਾਫ਼ਾ ਦਿੰਦਾ ਹੈ।",
      hi: "छठ पूजा पर मंडी में साबित गन्ना ₹40-₹70 प्रति गन्ना बिकता है, जो मिल रेट से 5 गुना अधिक लाभ देता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Chhath Puja festive demand pushed retail whole-cane prices to ₹40-₹70/stick across North India.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਛੱਠ ਪੂਜਾ 'ਤੇ ਥੋਕ ਤੇ ਫੁੱਟਕਰ ਮੰਡੀਆਂ ਵਿੱਚ ਸਾਬਤ ਗੰਨਾ ₹40-₹70 ਪ੍ਰਤੀ ਗੰਨਾ ਵਿਕਿਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: छठ पूजा पर मंडियों में साबित गन्ना ₹40-₹70 प्रति गन्ना बिका।"
    }
  },

  {
    cropName: { en: "Cotton / Narma (Gossypium hirsutum)", pa: "ਕਪਾਹ / ਨਰਮਾ (Cotton)", hi: "कपास / नरमा (Cotton)" },
    category: "GRAINS_CASH",
    seasonType: "SEASONAL",
    stateRegion: "NORTH",
    statesListText: {
      en: "Punjab, Haryana, Rajasthan, Gujarat, Maharashtra",
      pa: "ਪੰਜਾਬ, ਹਰਿਆਣਾ, ਰਾਜਸਥਾਨ, ਗੁਜਰਾਤ, ਮਹਾਰਾਸ਼ਟਰ",
      hi: "पंजाब, हरियाणा, राजस्थान, गुजरात, महाराष्ट्र"
    },
    localLangName: "ਕਪਾਹ/ਨਰਮਾ (PB) | कपास/नरमा (HI) | कापूस (MR) | பருத்தி (TN)",
    daysToEvent: 52,
    eventDate: { en: "Oct 20 - Nov 15 (Festive Textile Mill Buying)", pa: "20 ਓਕਤੂਬਰ - 15 ਨਵੰਬਰ (ਟੈਕਸਟਾਈਲ ਮਿਲ ਖਰੀਦ)", hi: "20 अक्टूबर - 15 नवंबर (टेक्सटाइल मिल खरीद)" },
    sowWindow: { en: "🌱 Kharif Sowing: Apr 15 - May 15 (Bt Cotton Hybrids)", pa: "🌱 ਬੀਜਾਈ ਮਿਤੀ: 15 ਅਪ੍ਰੈਲ - 15 ਮਈ", hi: "🌱 बुवाई तिथि: 15 अप्रैल - 15 मई" },
    sowDates: { en: "Sowing Window: Apr 15 - May 15", pa: "ਬੀਜਾਈ ਮਿਤੀ: 15 ਅਪ੍ਰੈਲ - 15 ਮਈ", hi: "बुवाई तिथि: 15 अप्रैल - 15 मई" },
    priceChange: { en: "▲ High Mill Demand (₹7,200-₹8,100/qtl)", pa: "▲ ਟੈਕਸਟਾਈਲ ਮਿਲ ਭਾਅ (₹7,200-₹8,100/ਕੁਇੰਟਲ)", hi: "▲ टेक्सटाइल मिल भाव (₹7,200-₹8,100/कुंतल)" },
    festivalName: { en: "🪔 Post-Diwali Textile Festive Wear Demand", pa: "🪔 ਦਿਵਾਲੀ ਕੱਪੜਾ ਉਦਯੋਗ ਮੰਗ", hi: "🪔 दिवाली कपड़ा उद्योग मांग" },
    faithCategory: "⭐ Commercial Cash Crop & Spinner Demand",
    harvestDelayAdvice: {
      en: "🛑 Picking Delay Advisory: Avoid picking dew-moistened cotton early in the morning. Delay daily picking until 10 AM to prevent yellow staining and command ₹7,200-₹8,100/qtl.",
      pa: "🛑 ਚੁਣਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਤ੍ਰੇਲ ਜਾਂ ਨਮੀ ਵਾਲੇ ਵੇਲੇ ਨਰਮਾ ਨਾ ਚੁਣੋ! ਧੁੱਪ ਖੁੱਲ੍ਹਣ ਤੱਕ 2-3 ਘੰਟੇ ਰੋਕ ਕੇ ਸੁੱਕਾ ਨਰਮਾ ਚੁਣੋ ਤਾਂ ਜੋ ਮੰਡੀ ਵਿੱਚ ਧੱਬਾ ਨਾ ਲੱਗੇ ਅਤੇ ₹7,200-₹8,100/ਕੁਇੰਟਲ ਰੇਟ ਮਿਲੇ।",
      hi: "🛑 चुनाई रोकने की सलाह: सुबह ओस में कपास की चुनाई न करें। धूप खिलने तक रोककर सूखी कपास चुनें ताकि ₹7,200-₹8,100/कुंतल भाव मिले।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Post-Diwali Textile Festive Wear & Spinning Mill Season (Target Picking: Oct 10 - Nov 15)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਦੀਵਾਲੀ ਟੈਕਸਟਾਈਲ & ਸਪਿਨਿੰਗ ਮਿਲ ਖਰੀਦ ਸੀਜ਼ਨ (ਲਕਸ਼ਿਤ ਚੁਣਾਈ: 10 ਓਕਤੂਬਰ - 15 ਨਵੰਬਰ)",
      hi: "🎯 लक्षित सीजन: दिवाली टेक्सटाइल व स्पिनिंग मिल खरीद सीजन (लक्षित चुनाई: 10 अक्टूबर - 15 नवंबर)"
    },
    farmerAdvice: {
      en: "☁️ Sow Bt Cotton hybrids between Apr 15-May 15 with 67.5 cm row spacing. Manage pink bollworm with pheromone traps to protect lint quality.",
      pa: "☁️ ਬੀਟੀ ਨਰਮਾ ਹਾਈਬ੍ਰਿਡ 15 ਅਪ੍ਰੈਲ ਤੋਂ 15 ਮਈ ਵਿੱਚ 67.5 ਸੈਂਟੀਮੀਟਰ ਦੀ ਵਿੱਥ 'ਤੇ ਬੀਜੋ। ਗੁਲਾਬੀ ਸੁੰਡੀ ਦੇ ਬਚਾਅ ਲਈ ਫੇਰੋਮੋਨ ਟ੍ਰੈਪ ਲਾਓ।",
      hi: "☁️ बीटी कपास 15 अप्रैल से 15 मई के बीच लगाएं। गुलाबी सूंडी बचाव हेतु फेरोमोन ट्रैप लगाएं।"
    },
    significance: {
      en: "Massive festive apparel manufacturing ahead of Diwali and winter marriage seasons drives intense cotton spinner buying.",
      pa: "ਦਿਵਾਲੀ ਅਤੇ ਸ਼ਾਦੀਆਂ ਦੇ ਸੀਜ਼ਨ ਵਿੱਚ ਕੱਪੜਾ ਮਿੱਲਾਂ ਵਿੱਚ ਨਰਮੇ ਦੀ ਜ਼ਬਰਦਸਤ ਮੰਗ ਹੁੰਦੀ ਹੈ।",
      hi: "दिवाली व शादियों के सीजन में कपड़ा मिलों में कपास की भारी मांग रहती है।"
    },
    mandiImpact: {
      en: "Clean dry cotton fetches ₹7,200-₹8,100/qtl in Abohar, Bhatinda & Sirsa mandis during October-November.",
      pa: "ਅਬੋਹਰ, ਬਠਿੰਡਾ ਅਤੇ ਸਰਸਾ ਮੰਡੀਆਂ ਵਿੱਚ ਸਾਫ਼ ਸੁੱਕਾ ਨਰਮਾ ₹7,200-₹8,100/ਕੁਇੰਟਲ ਦੇ ਭਾਅ 'ਤੇ ਵਿਕਦਾ ਹੈ।",
      hi: "अबोहर, बठिंडा व सिरसा मंडियों में साफ कपास ₹7,200-₹8,100/कुंतल के भाव पर बिकती है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Cotton prices hovered between ₹7,200-₹8,100/qtl in peak November mill buying.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਨਵੰਬਰ ਦੀ ਮਿਲ ਖਰੀਦ ਵੇਲੇ ਨਰਮੇ ਦਾ ਭਾਅ ₹7,200-₹8,100/ਕੁਇੰਟਲ ਰਿਕਾਰਡ ਹੋਇਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: नवंबर मिल खरीद पर कपास का भाव ₹7,200-₹8,100/कुंतल दर्ज हुआ।"
    }
  },

  {
    cropName: { en: "Mustard / Raya (Brassica juncea)", pa: "ਸਰ੍ਹੋਂ / ਰਾਇਆ (Mustard)", hi: "सरसों / राया (Mustard)" },
    category: "GRAINS_CASH",
    seasonType: "SEASONAL",
    stateRegion: "NORTH",
    statesListText: {
      en: "Rajasthan, Haryana, Punjab, MP, UP",
      pa: "ਰਾਜਸਥਾਨ, ਹਰਿਆਣਾ, ਪੰਜਾਬ, ਮੱਧ ਪ੍ਰਦੇਸ਼, ਉੱਤਰ ਪ੍ਰਦੇਸ਼",
      hi: "राजस्थान, हरियाणा, पंजाब, मध्य प्रदेश, उत्तर प्रदेश"
    },
    localLangName: "ਸਰ੍ਹੋਂ (PB) | सरसों (HI) | मोहरी (MR) | கடுகு (TN) | ఆవాలు (TE)",
    daysToEvent: 25,
    eventDate: { en: "Oct 01 - Oct 25 (Optimal Rabi Sowing)", pa: "01 ਓਕਤੂਬਰ - 25 ਓਕਤੂਬਰ (ਰਬੀ ਅਨੁਕੂਲ ਬੀਜਾਈ)", hi: "01 अक्टूबर - 25 अक्टूबर (रबी अनुकूल बुवाई)" },
    sowWindow: { en: "🌱 Rabi Sowing Window: Oct 01 - Oct 25 (Pusa Mustard 30 / RLC 3)", pa: "🌱 ਬੀਜਾਈ ਮਿਤੀ: 01 ਓਕਤੂਬਰ - 25 ਓਕਤੂਬਰ", hi: "🌱 बुवाई तिथि: 01 अक्टूबर - 25 अक्टूबर" },
    sowDates: { en: "Sowing Window: Oct 01 - Oct 25", pa: "ਬੀਜਾਈ ਮਿਤੀ: 01 ਓਕਤੂਬਰ - 25 ਓਕਤੂਬਰ", hi: "बुवाई तिथि: 01 अक्टूबर - 25 अक्टूबर" },
    priceChange: { en: "▲ High Oil Mill Demand (₹5,800-₹6,400/qtl)", pa: "▲ ਤੇਲ ਮਿਲ ਭਾਅ (₹5,800-₹6,400/ਕੁਇੰਟਲ)", hi: "▲ तेल मिल भाव (₹5,800-₹6,400/कुंतल)" },
    festivalName: { en: "🪔 Winter Oil & Festive Cooking Demand", pa: "🪔 ਸਰਦੀਆਂ ਵਿੱਚ ਸਰ੍ਹੋਂ ਤੇਲ ਮੰਗ", hi: "🪔 सर्दियों में सरसों तेल मांग" },
    faithCategory: "⭐ Rabi Cash Crop & Edible Oil Demand",
    harvestDelayAdvice: {
      en: "🛑 Threshing Delay Advisory: Do not thresh damp mustard pods. Sun-dry harvested plants in bundles for 3-4 days to achieve 40%+ oil content for top ₹5,800-₹6,400/qtl rate.",
      pa: "🛑 ਕੱਢਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਪੱਕੀਆਂ ਫਲੀਆਂ ਸੁੱਕਣ ਤੋਂ ਪਹਿਲਾਂ ਥਰੈਸ਼ਰ ਨਾ ਲਾਓ! 3-4 ਦਿਨ ਖੇਤ ਵਿੱਚ ਛਾਂਵੇਂ ਸੁਕਾ ਕੇ ਕੱਢੋ ਤਾਂ ਜੋ ਤੇਲ ਦੀ ਮਾਤਰਾ (40%+) ਪੂਰੀ ਰਹੇ ਅਤੇ ₹5,800-₹6,400/ਕੁਇੰਟਲ ਰੇਟ ਮਿਲੇ।",
      hi: "🛑 गहाई रोकने की सलाह: गीली फलियों की गहाई न करें! 3-4 दिन धूप में सुखाकर कढाई करें ताकि 40%+ तेल मात्रा से ₹5,800-₹6,400/कुंतल रेट मिले।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Rabi Optimal Sowing & Winter Mustard Oil Festive Demand (Target Sowing: Oct 01 - Oct 25)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਰਬੀ ਅਨੁਕੂਲ ਬੀਜਾਈ & ਸਰਦੀਆਂ ਵਿੱਚ ਤੇਲ ਮਿੱਲ ਖਰੀਦ (ਲਕਸ਼ਿਤ ਬੀਜਾਈ: 01 ਓਕਤੂਬਰ - 25 ਓਕਤੂਬਰ)",
      hi: "🎯 लक्षित सीजन: रबी अनुकूल बुवाई व शीतकालीन सरसों तेल मांग (लक्षित बुवाई: 01 अक्टूबर - 25 अक्टूबर)"
    },
    farmerAdvice: {
      en: "🌼 Sow Pusa Mustard 30 or RLC 3 between Oct 01-25. Treat seeds with Trichoderma to avoid stem rot and maximize oil yield.",
      pa: "🌼 01 ਤੋਂ 25 ਓਕਤੂਬਰ ਵਿਚਕਾਰ ਪੂਸਾ ਮਸਟਰਡ 30 ਜਾਂ RLC 3 ਦੀ ਬੀਜਾਈ ਕਰੋ। ਤਣਾ ਗਲਣ ਬਿਮਾਰੀ ਤੋਂ ਬਚਾਅ ਲਈ ਟ੍ਰਾਈਕੋਡਰਮਾ ਨਾਲ ਬੀਜ ਸੋਧੋ।",
      hi: "🌼 01 से 25 अक्टूबर के बीच सरसों बुवाई करें। तना गलन से बचाव हेतु ट्राइकोडेर्मा से बीज उपचारित करें।"
    },
    significance: {
      en: "Mustard oil is the foundation of winter festive cooking and traditional North Indian dishes.",
      pa: "ਸਰਦੀਆਂ ਦੇ ਪਕਵਾਨਾਂ ਅਤੇ ਸਾਗ ਤੜਕੇ ਲਈ ਸਰ੍ਹੋਂ ਦੇ ਤੇਲ ਦੀ ਸਭ ਤੋਂ ਵੱਧ ਖਪਤ ਹੁੰਦੀ ਹੈ।",
      hi: "सर्दियों के व्यंजनों व सरसों के साग हेतु सरसों तेल की भारी मांग होती है।"
    },
    mandiImpact: {
      en: "Mustard seed commands ₹5,800-₹6,400/qtl in Bharatpur, Alwar & Bathinda oil mill mandis.",
      pa: "ਭਰਤਪੁਰ, ਅਲਵਰ ਅਤੇ ਬਠਿੰਡਾ ਤੇਲ ਮਿੱਲ ਮੰਡੀਆਂ ਵਿੱਚ ਸਰ੍ਹੋਂ ਦਾ ਰੇਟ ₹5,800-₹6,400/ਕੁਇੰਟਲ ਰਹਿੰਦਾ ਹੈ।",
      hi: "भरतपुर, अलवर व बठिंडा तेल मिल मंडियों में सरसों का रेट ₹5,800-₹6,400/कुंतल रहता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Dry mustard seed averaged ₹5,800-₹6,400/qtl during peak crush season.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਸੁੱਕੀ ਸਰ੍ਹੋਂ ਦਾ ਥੋਕ ਮੰਡੀ ਭਾਅ ₹5,800-₹6,400/ਕੁਇੰਟਲ ਰਿਕਾਰਡ ਕੀਤਾ ਗਿਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: सूखी सरसों का थोक भाव ₹5,800-₹6,400/कुंतल दर्ज हुआ।"
    }
  },

  // ==========================================
  // 🍉 FRUITS (ADVANCE WATERMELON)
  // ==========================================
  {
    cropName: { en: "Hybrid Watermelon (Citrullus lanatus)", pa: "ਅਗੇਤੀ ਹਦਵਾਣਾ / ਤਰਬੂਜ (Watermelon)", hi: "अगेती तरबूज (Hybrid Watermelon)" },
    category: "FRUITS",
    seasonType: "ADVANCE_SEASONAL",
    stateRegion: "NORTH_CENTRAL",
    statesListText: {
      en: "Punjab, Haryana, UP, MP, Rajasthan, Maharashtra",
      pa: "ਪੰਜਾਬ, ਹਰਿਆਣਾ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਮੱਧ ਪ੍ਰਦੇਸ਼, ਰਾਜਸਥਾਨ, ਮਹਾਰਾਸ਼ਟਰ",
      hi: "पंजाब, हरियाणा, उत्तर प्रदेश, मध्य प्रदेश, राजस्थान, महाराष्ट्र"
    },
    localLangName: "ਹਦਵਾਣਾ/ਤਰਬੂਜ (PB) | तरबूज (HI) | कलिंगड (MR) | தர்பூசணி (TN) | పుచ్చకాయ (TE)",
    daysToEvent: 190,
    eventDate: { en: "Mar 15 - Apr 10 (Holy Ramadan Iftar)", pa: "15 ਮਾਰਚ - 10 ਅਪ੍ਰੈਲ (ਰਮਜ਼ਾਨ ਇਫ਼ਤਾਰ ਮੰਗ)", hi: "15 मार्च - 10 अप्रैल (रमजान इफ्तार)" },
    sowWindow: { en: "🌱 Low-Tunnel Advance Sowing: Dec 15 - Jan 15 (Max / Saraswati)", pa: "🌱 ਅਗੇਤੀ ਸੁਰੰਗ ਬੀਜਾਈ: 15 ਦਸੰਬਰ - 15 ਜਨਵਰੀ", hi: "🌱 अगेती टनल बुवाई: 15 दिसंबर - 15 जनवरी" },
    sowDates: { en: "Sowing Window: Dec 15 - Jan 15", pa: "ਬੀਜਾਈ ਮਿਤੀ: 15 ਦਸੰਬਰ - 15 ਜਨਵਰੀ", hi: "बुवाई तिथि: 15 दिसंबर - 15 जनवरी" },
    priceChange: { en: "▲ 2.5x Early Surge (₹30-₹45/kg)", pa: "▲ 2.5 ਗੁਣਾ ਅਗੇਤਾ ਰੇਟ (₹30-₹45/ਕਿਲੋ)", hi: "▲ 2.5 गुना अगेती दर (₹30-₹45/किग्रा)" },
    festivalName: { en: "🌙 Holy Ramadan Iftar & Early Summer Demand", pa: "🌙 ਰਮਜ਼ਾਨ ਇਫ਼ਤਾਰ & ਅਗੇਤੀ ਗਰਮੀ", hi: "🌙 रमजान इफ्तार व अगेती गर्मी" },
    faithCategory: "⭐ Holy Iftar Hydration Fruit",
    harvestDelayAdvice: {
      en: "🛑 Harvesting Delay Advisory: Do not pick unripe melons. Delay harvesting by 5 days for sugar accumulation before Ramadan Iftar to capture peak ₹30-₹45/kg rates.",
      pa: "🛑 ਤੁੜਵਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਕੱਚਾ ਤਰਬੂਜ ਨਾ ਤੋੜੋ! ਰਮਜ਼ਾਨ ਇਫ਼ਤਾਰ ਮੰਗ (ਮਿਤੀ 20 ਮਾਰਚ) ਲਈ ਵੇਲ 'ਤੇ 5 ਦਿਨ ਹੋਰ ਮਿਠਾਸ ਚੜ੍ਹਨ ਦਿਓ, ਮੰਡੀ ਵਿੱਚ ₹30-₹45/ਕਿਲੋ ਰੇਟ ਮਿਲੇਗਾ।",
      hi: "🛑 तुड़ाई रोकने की सलाह: कच्चा तरबूज न तोड़ें! रमजान इफ्तार हेतु 5 दिन मिठास चढ़ने दें, मंडी में ₹30-₹45/किग्रा भाव मिलेगा।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Holy Ramadan Iftar & Early Summer Heat Peak Demand (Target Harvest: Mar 15 - Apr 10)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਰਮਜ਼ਾਨ ਮਹੀਨਾ & ਅਗੇਤੀ ਗਰਮੀ ਪੀਕ ਮੰਗ (ਲਕਸ਼ਿਤ ਤੋੜਾਈ: 15 ਮਾਰਚ - 10 ਅਪ੍ਰੈਲ)",
      hi: "🎯 लक्षित सीजन: पवित्र रमजान इफ्तार व अगेती गर्मी मांग (लक्षित कटाई: 15 मार्च - 10 अप्रैल)"
    },
    farmerAdvice: {
      en: "🍉 Plant hybrid varieties Max or Saraswati under plastic low-tunnels in Dec-Jan. Early harvest in March gets 2.5x higher price.",
      pa: "🍉 ਦਸੰਬਰ-ਜਨਵਰੀ ਵਿੱਚ ਪਲਾਸਟਿਕ ਸੁਰੰਗ (Low Tunnel) ਹੇਠ ਅਗੇਤਾ ਤਰਬੂਜ ਬੀਜੋ। ਮਾਰਚ ਦੀ ਅਗੇਤੀ ਫਸਲ 2.5 ਗੁਣਾ ਵੱਧ ਰੇਟ ਦਿੰਦੀ ਹੈ।",
      hi: "🍉 दिसंबर-जनवरी में प्लास्टिक टनल के नीचे अगेता तरबूज लगाएं। मार्च की अगेती फसल 2.5 गुना अधिक दाम देती है।"
    },
    significance: {
      en: "Watermelon is the #1 preferred hydrating fruit to break the day-long fast during Holy Ramadan Iftar.",
      pa: "ਰਮਜ਼ਾਨ ਦੇ ਪਵਿੱਤਰ ਮਹੀਨੇ ਵਿੱਚ ਇਫ਼ਤਾਰ ਸਮੇਂ ਤਰਬੂਜ ਦੀ ਵਰਤੋਂ ਸਭ ਤੋਂ ਵੱਧ ਕੀਤੀ ਜਾਂਦੀ ਹੈ।",
      hi: "रमजान में इफ्तार के समय तरबूज का सेवन सर्वाधिक पसंद किया जाता है।"
    },
    mandiImpact: {
      en: "March early watermelon commands ₹30-₹45/kg wholesale rate versus ₹10-₹12/kg in peak summer (May).",
      pa: "ਮਾਰਚ ਵਿੱਚ ਅਗੇਤੇ ਤਰਬੂਜ ਦਾ ਭਾਅ ₹30-₹45/ਕਿਲੋ ਰਹਿੰਦਾ ਹੈ, ਜਦਕਿ ਮਈ ਦੇ ਆਮ ਸੀਜ਼ਨ ਵਿੱਚ ਇਹ ਰੇਟ ₹10-₹12/ਕਿਲੋ ਰਹਿ ਜਾਂਦਾ ਹੈ।",
      hi: "मार्च में अगेती तरबूज का भाव ₹30-₹45/किग्रा रहता है, जबकि मई में यह ₹10-₹12/किग्रा रह जाता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Early March watermelon harvested under low tunnels consistently fetched ₹30-₹45/kg.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਮਾਰਚ ਵਿੱਚ ਅਗੇਤੇ ਤਰਬੂਜ ਦਾ ਮੰਡੀ ਭਾਅ ₹30-₹45/ਕਿਲੋ ਰਿਕਾਰਡ ਹੋਇਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: मार्च में अगेती तरबूज का मंडी भाव ₹30-₹45/किग्रा रहा।"
    }
  },

  // ==========================================
  // 🌿 GREEN FODDER (ADVANCE GREEN FODDER)
  // ==========================================
  {
    cropName: { en: "Early Jowar & Maize Fodder (Sorghum bicolor)", pa: "ਅਗੇਤੀ ਚਾਰੀ / ਮੱਕੀ ਹਰਾ ਚਾਰਾ (Fodder)", hi: "अगेती चरी / मक्का हरा चारा (Fodder)" },
    category: "FODDER",
    seasonType: "ADVANCE_SEASONAL",
    stateRegion: "NORTH",
    statesListText: {
      en: "Punjab, Haryana, UP, Rajasthan, Gujarat",
      pa: "ਪੰਜਾਬ, ਹਰਿਆਣਾ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਰਾਜਸਥਾਨ, ਗੁਜਰਾਤ",
      hi: "पंजाब, हरियाणा, उत्तर प्रदेश, राजस्थान, गुजरात"
    },
    localLangName: "ਚਾਰੀ/ਚਾਰਾ (PB) | चरी/चारा (HI) | कड़बा (MR) | పశువుల మేత (TE)",
    daysToEvent: 270,
    eventDate: { en: "Jun 01 - Jun 15 (Pre-Bakrid Animal Mandis)", pa: "01 ਜੂਨ - 15 ਜੂਨ (ਬਕਰੀਦ ਪਸ਼ੂ ਮੰਡੀ ਮੰਗ)", hi: "01 जून - 15 जून (बकरीद पशु मंडी)" },
    sowWindow: { en: "🌱 Advance Summer Sowing: Mar 01 - Mar 25 (Jowar Chari / African Tall)", pa: "🌱 ਅਗੇਤੀ ਬੀਜਾਈ: 01 ਮਾਰਚ - 25 ਮਾਰਚ", hi: "🌱 अगेती बुवाई: 01 मार्च - 25 मार्च" },
    sowDates: { en: "Sowing Window: Mar 01 - Mar 25", pa: "ਬੀਜਾਈ ਮਿਤੀ: 01 ਮਾਰਚ - 25 ਮਾਰਚ", hi: "बुवाई तिथि: 01 मार्च - 25 मार्च" },
    priceChange: { en: "▲ +150% Mandi Rate (₹600-₹900/qtl)", pa: "▲ +150% ਮੰਡੀ ਰੇਟ (₹600-₹900/ਕੁਇੰਟਲ)", hi: "▲ +150% मंडी रेट (₹600-₹900/कुंतल)" },
    festivalName: { en: "🐐 Bakrid Livestock Mandi Feed Demand", pa: "🐐 ਬਕਰੀਦ ਪਸ਼ੂ ਮੰਡੀ ਹਰਾ ਚਾਰਾ", hi: "🐐 बकरीद पशु मंडी हरा चारा" },
    faithCategory: "⭐ Livestock Festive Feed Supply",
    harvestDelayAdvice: {
      en: "🛑 Cutting Delay Advisory: Hold fodder harvesting for 4 days until Bakrid animal mandis open (Jun 05). Livestock traders pay premium ₹600-₹900/qtl for fresh green fodder.",
      pa: "🛑 ਵਢਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਬਕਰੀਦ ਪਸ਼ੂ ਮੰਡੀਆਂ ਸ਼ੁਰੂ ਹੋਣ (05 ਜੂਨ) ਤੱਕ ਹਰੇ ਚਾਰੇ ਦੀ ਕਟਾਈ 4 ਦਿਨ ਰੋਕੋ! ਪਸ਼ੂ ਵਪਾਰੀਆਂ ਵੱਲੋਂ ਹਰੇ ਚਾਰੇ ਦੇ ₹600-₹900/ਕੁਇੰਟਲ ਤੱਕ ਰੇਟ ਮਿਲਣਗੇ।",
      hi: "🛑 कटाई रोकने की सलाह: बकरीद पशु मंडी शुरू होने (05 जून) तक कटाई 4 दिन रोकें! व्यापारी हरे चारे का ₹600-₹900/कुंतल भाव देंगे।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Bakrid Livestock Mandi & Summer Dairy Feeding (Target Harvest: Jun 01 - Jun 15)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਬਕਰੀਦ ਪਸ਼ੂ ਮੰਡੀ & ਡੇਅਰੀ ਪਸ਼ੂ ਮੰਗ (ਲਕਸ਼ਿਤ ਵਢਾਈ: 01 ਜੂਨ - 15 ਜੂਨ)",
      hi: "🎯 लक्षित सीजन: बकरीद पशु मंडी व ग्रीष्मकालीन डेयरी मांग (लक्षित कटाई: 01 जून - 15 जून)"
    },
    farmerAdvice: {
      en: "🌾 Sow early Jowar chari or African Tall maize in March with frequent irrigation to harvest succulent green fodder during June livestock markets.",
      pa: "🌾 ਮਾਰਚ ਵਿੱਚ ਅਗੇਤੀ ਚਾਰੀ ਜਾਂ ਅਫਰੀਕਨ ਟਾਲ ਮੱਕੀ ਬੀਜੋ। ਜੂਨ ਦੀਆਂ ਪਸ਼ੂ ਮੰਡੀਆਂ ਲਈ ਨਰਮ ਹਰਾ ਚਾਰਾ ਤਿਆਰ ਕਰਨ ਲਈ ਸਮੇਂ ਸਿਰ ਪਾਣੀ ਲਾਓ।",
      hi: "🌾 मार्च में अगेती चरी बुवाई करें। जून की पशु मंडियों हेतु नरम चारा तैयार करने के लिए समय पर सिंचाई करें।"
    },
    significance: {
      en: "Millions of sacrifice animals gathered in festive urban mandis require enormous daily fresh green fodder.",
      pa: "ਬਕਰੀਦ ਮੌਕੇ ਪਸ਼ੂ ਮੰਡੀਆਂ ਵਿੱਚ ਲੱਖਾਂ ਪਸ਼ੂਆਂ ਲਈ ਹਰੇ ਚਾਰੇ ਦੀ ਜ਼ਬਰਦਸਤ ਮੰਗ ਹੁੰਦੀ ਹੈ।",
      hi: "बकरीद पर पशु मंडियों में लाखों पशुओं हेतु हरे चारे की भारी मांग होती है।"
    },
    mandiImpact: {
      en: "Green fodder rates reach ₹600-₹900/qtl near urban livestock mandis, compared to normal ₹200-₹250/qtl dairy rates.",
      pa: "ਸ਼ਹਿਰੀ ਪਸ਼ੂ ਮੰਡੀਆਂ ਕੋਲ ਹਰੇ ਚਾਰੇ ਦਾ ਭਾਅ ₹600-₹900/ਕੁਇੰਟਲ ਤੱਕ ਪਹੁੰਚ ਜਾਂਦਾ ਹੈ (ਆਮ ਦਿਨਾਂ ਦੇ ₹200-₹250 ਦੇ ਮੁਕਾਬਲੇ)।",
      hi: "पशु मंडियों के पास हरे चारे का रेट ₹600-₹900/कुंतल तक पहुंच जाता है (सामान्य ₹200-₹250 की तुलना में)।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Pre-Bakrid green fodder prices jumped +150% in Delhi, Ludhiana, and Lucknow livestock mandis.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਪਸ਼ੂ ਮੰਡੀਆਂ ਵਿੱਚ ਹਰੇ ਚਾਰੇ ਦਾ ਰੇਟ 150% ਤੱਕ ਵਧਿਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: पशु मंडियों में हरे चारे का रेट 150% तक बढ़ा।"
    }
  },

  {
    cropName: { en: "Wheat (Triticum aestivum)", pa: "ਕਣਕ (Wheat - HD 3086 & PBW 826)", hi: "गेहूं (Wheat - HD 3086 व PBW 826)" },
    category: "GRAINS_CASH",
    seasonType: "SEASONAL",
    stateRegion: "NORTH",
    statesListText: {
      en: "Punjab, Haryana, UP, MP, Rajasthan, Bihar",
      pa: "ਪੰਜਾਬ, ਹਰਿਆਣਾ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਮੱਧ ਪ੍ਰਦੇਸ਼, ਰਾਜਸਥਾਨ, ਬਿਹਾਰ",
      hi: "पंजाब, हरियाणा, उत्तर प्रदेश, मध्य प्रदेश, राजस्थान, बिहार"
    },
    localLangName: "ਕਣਕ (PB) | गेहूं (HI) | गव्हा (MR) | கோதுமை (TN) | గోధుమలు (TE)",
    daysToEvent: 215,
    eventDate: { en: "Apr 10 - Apr 30 (Baisakhi Harvest & MSP Buying)", pa: "10 ਅਪ੍ਰੈਲ - 30 ਅਪ੍ਰੈਲ (ਵਿਸਾਖੀ ਵਢਾਈ & MSP ਖਰੀਦ)", hi: "10 अप्रैल - 30 अप्रैल (बैसाखी कटाई व MSP)" },
    sowWindow: { en: "🌱 Rabi Sowing Window: Oct 25 - Nov 15 (HD 3086 / PBW 826)", pa: "🌱 ਬੀਜਾਈ ਮਿਤੀ: 25 ਓਕਤੂਬਰ - 15 ਨਵੰਬਰ", hi: "🌱 बुवाई तिथि: 25 अक्टूबर - 15 नवंबर" },
    sowDates: { en: "Sowing Window: Oct 25 - Nov 15", pa: "ਬੀਜਾਈ ਮਿਤੀ: 25 ਓਕਤੂਬਰ - 15 ਨਵੰਬਰ", hi: "बुवाई तिथि: 25 अक्टूबर - 15 नवंबर" },
    priceChange: { en: "▲ Govt MSP Purchase (₹2,275/qtl)", pa: "▲ ਸਰਕਾਰੀ MSP ਖਰੀਦ (₹2,275/ਕੁਇੰਟਲ)", hi: "▲ सरकारी MSP खरीद (₹2,275/कुंतल)" },
    festivalName: { en: "🌾 Baisakhi Harvest Festival & Govt Procurement", pa: "🌾 ਵਿਸਾਖੀ ਵਢਾਈ & MSP ਖਰੀਦ ਸੀਜ਼ਨ", hi: "🌾 बैसाखी कटाई व MSP खरीद सीजन" },
    faithCategory: "⭐ Staple Grain Harvest & MSP Procurement",
    harvestDelayAdvice: {
      en: "🛑 Harvesting Delay Advisory: Do not harvest green-tinged wheat. Delay combine harvest by 5 days for full grain maturity to receive full ₹2,275/qtl MSP.",
      pa: "🛑 ਵਢਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਹਰੇ ਦਾਣੇ ਵਾਲੀ ਕਣਕ 'ਤੇ ਕੰਬਾਈਨ ਨਾ ਲਾਓ! 5 ਦਿਨ ਧੁੱਪ ਲੱਗਣ ਦਿਓ ਤਾਂ ਜੋ ਮੰਡੀ ਵਿੱਚ ਸਿੱਲ ਘਟੇ ਅਤੇ ₹2,275/ਕੁਇੰਟਲ ਪੂਰਾ MSP ਰੇਟ ਮਿਲੇ।",
      hi: "🛑 कटाई रोकने की सलाह: हरे दाने वाली गेहूं की कटाई न करें! 5 दिन धूप लगने दें ताकि नमी कम हो और ₹2,275/कुंतल पूरा MSP भाव मिले।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Baisakhi Mandi Procurement & Govt MSP Season (Target Harvest: Apr 10 - Apr 30)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਵਿਸਾਖੀ ਮੰਡੀ ਖਰੀਦ & ਸਰਕਾਰੀ MSP ਖਰੀਦ (ਲਕਸ਼ਿਤ ਵਢਾਈ: 10 ਅਪ੍ਰੈਲ - 30 ਅਪ੍ਰੈਲ)",
      hi: "🎯 लक्षित सीजन: बैसाखी मंडी खरीद व सरकारी MSP सीजन (लक्षित कटाई: 10 अप्रैल - 30 अप्रैल)"
    },
    farmerAdvice: {
      en: "🌾 Sow HD 3086 or PBW 826 between Oct 25-Nov 15 using Happy Seeder in standing paddy stubble. Apply first irrigation at 21 days (CRI stage).",
      pa: "🌾 25 ਓਕਤੂਬਰ ਤੋਂ 15 ਨਵੰਬਰ ਵਿੱਚ ਹੈਪੀ ਸੀਡਰ ਨਾਲ ਕਣਕ ਬੀਜੋ। 21 ਦਿਨ ਬਾਅਦ ਕੋਰ ਪਾਣੀ (CRI stage) ਜ਼ਰੂਰ ਲਾਓ।",
      hi: "🌾 25 अक्टूबर से 15 नवंबर के बीच हैप्पी सीडर से गेहूं बुवाई करें। 21 दिन बाद पहला पानी दें।"
    },
    significance: {
      en: "Baisakhi marks the golden harvest of wheat, celebrated across Punjab with traditional Bhangra and thanksgiving.",
      pa: "ਵਿਸਾਖੀ ਦਾ ਤਿਉਹਾਰ ਕਣਕ ਦੀ ਸੁਨਹਿਰੀ ਵਢਾਈ ਦੀ ਖੁਸ਼ੀ ਵਿੱਚ ਮਨਾਇਆ ਜਾਂਦਾ ਹੈ।",
      hi: "बैसाखी का त्योहार गेहूं की कटाई की खुशी में मनाया जाता है।"
    },
    mandiImpact: {
      en: "Govt MSP procurement centers buy clean dry wheat at ₹2,275/qtl across all Punjab and Haryana mandis.",
      pa: "ਸਰਕਾਰੀ ਖਰੀਦ ਕੇਂਦਰਾਂ ਵਿੱਚ ਕਣਕ ਦਾ ਸਰਕਾਰੀ ਰੇਟ ₹2,275/ਕੁਇੰਟਲ ਮਿਲਦਾ ਹੈ।",
      hi: "सरकारी खरीद केंद्रों पर गेहूं का MSP ₹2,275/कुंतल मिलता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Wheat procurement completed smoothly at full MSP rates during April Baisakhi season.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਅਪ੍ਰੈਲ ਵਿੱਚ ਕਣਕ ਦੀ ਖਰੀਦ MSP 'ਤੇ ਸਫਲਤਾਪੂਰਵਕ ਰਿਕਾਰਡ ਹੋਈ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: अप्रैल में गेहूं की खरीद MSP पर दर्ज हुई।"
    }
  },

  {
    cropName: { en: "Maize (Zea mays)", pa: "ਮੱਕੀ (Maize - PMH 1 & Bio 9681)", hi: "मक्का (Maize - PMH 1 व Bio 9681)" },
    category: "GRAINS_CASH",
    seasonType: "SEASONAL",
    stateRegion: "NORTH",
    statesListText: {
      en: "Punjab, Bihar, UP, Rajasthan, Karnataka, Telangana",
      pa: "ਪੰਜਾਬ, ਬਿਹਾਰ, ਉੱਤਰ ਪ੍ਰਦੇਸ਼, ਰਾਜਸਥਾਨ, ਕਰਨਾਟਕ, ਤੇਲੰਗਾਨਾ",
      hi: "पंजाब, बिहार, उत्तर प्रदेश, राजस्थान, कर्नाटक, तेलंगाना"
    },
    localLangName: "ਮੱਕੀ (PB) | मक्का (HI) | मका (MR) | மக்காச்சோளம் (TN) | జొన్నలు (TE)",
    daysToEvent: 30,
    eventDate: { en: "Sep 15 - Oct 10 (Feed Mill Procurement)", pa: "15 ਸਤੰਬਰ - 10 ਓਕਤੂਬਰ (ਫੀਡ ਮਿਲ ਖਰੀਦ)", hi: "15 सितंबर - 10 अक्टूबर (फीड़ मिल खरीद)" },
    sowWindow: { en: "🌱 Kharif Sowing Window: May 25 - Jun 20 (PMH 1 / Bio 9681)", pa: "🌱 ਬੀਜਾਈ ਮਿਤੀ: 25 ਮਈ - 20 ਜੂਨ", hi: "🌱 बुवाई तिथि: 25 मई - 20 जून" },
    sowDates: { en: "Sowing Window: May 25 - Jun 20", pa: "ਬੀਜਾਈ ਮਿਤੀ: 25 ਮਈ - 20 ਜੂਨ", hi: "बुवाई तिथि: 25 मई - 20 जून" },
    priceChange: { en: "▲ High Feed Demand (₹2,090-₹2,450/qtl)", pa: "▲ ਫੀਡ ਮਿਲ ਭਾਅ (₹2,090-₹2,450/ਕੁਇੰਟਲ)", hi: "▲ फीड मिल भाव (₹2,090-₹2,450/कुंतल)" },
    festivalName: { en: "🌽 Green Cob Street Food & Poultry Feed Demand", pa: "🌽 ਛੱਲੀ ਮੰਗ & ਪੋਲਟਰੀ ਫੀਡ", hi: "🌽 भुट्टा मांग व पोल्ट्री फीड" },
    faithCategory: "⭐ Grain & Industrial Poultry Feed Demand",
    harvestDelayAdvice: {
      en: "🛑 Cob Harvesting Delay Advisory: Hold cob picking for 4 days until grains mature past milk stage to secure ₹2,090-₹2,450/qtl in feed mandis.",
      pa: "🛑 ਛੱਲੀ ਤੋੜਾਈ ਰੋਕਣ ਦੀ ਸਲਾਹ: ਕੱਚੀ ਛੱਲੀ ਨਾ ਤੋੜੋ! ਛੱਲੀ ਦਾ ਦਾਣਾ ਦੁੱਧ ਤੋਂ ਪੱਕਣ ਤੱਕ 4 ਦਿਨ ਹੋਰ ਰੋਕੋ, ਮੰਡੀ ਵਿੱਚ ₹2,090-₹2,450/ਕੁਇੰਟਲ ਰੇਟ ਮਿਲੇਗਾ।",
      hi: "🛑 भुट्टा तुड़ाई रोकने की सलाह: कच्चा भुट्टा न तोड़ें! 4 दिन दाना पकने दें ताकि ₹2,090-₹2,450/कुंतल भाव मिले।"
    },
    targetFestivalSeason: {
      en: "🎯 Target Season: Green Cob Street Food & Poultry Feed Industry Demand (Target Harvest: Sep 15 - Oct 10)",
      pa: "🎯 ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ: ਛੱਲੀ ਮੰਗ & ਪੋਲਟਰੀ ਫੀਡ ਇੰਡਸਟਰੀ ਮੰਗ (ਲਕਸ਼ਿਤ ਵਢਾਈ: 15 ਸਤੰਬਰ - 10 ਓਕਤੂਬਰ)",
      hi: "🎯 लक्षित सीजन: भुट्टा मांग व पोल्ट्री फीड उद्योग मांग (लक्षित कटाई: 15 सितंबर - 10 अक्टूबर)"
    },
    farmerAdvice: {
      en: "🌽 Sow hybrid maize PMH 1 or Bio 9681 between May 25-Jun 20. Ensure ridge sowing for water drainage during monsoon rains.",
      pa: "🌽 25 ਮਈ ਤੋਂ 20 ਜੂਨ ਵਿੱਚ ਮੱਕੀ ਬੀਜੋ। ਬਰਸਾਤ ਦੇ ਪਾਣੀ ਦੀ ਨਿਕਾਸੀ ਲਈ ਵੱਟਾਂ 'ਤੇ ਬੀਜਾਈ ਕਰੋ।",
      hi: "🌽 25 मई से 20 जून के बीच मक्का बुवाई करें। जल निकासी हेतु मेड़ों पर बुवाई करें।"
    },
    significance: {
      en: "Monsoon street food roasted cobs and starch industry processing consume vast quantities of early harvested maize.",
      pa: "ਬਰਸਾਤ ਵਿੱਚ ਭੁੰਨੀ ਛੱਲੀ ਅਤੇ ਪੋਲਟਰੀ ਫੀਡ ਲਈ ਮੱਕੀ ਦੀ ਜ਼ਬਰਦਸਤ ਮੰਗ ਹੁੰਦੀ ਹੈ।",
      hi: "बारिश में भुट्टे व पोल्ट्री फीड हेतु मक्के की भारी मांग रहती है।"
    },
    mandiImpact: {
      en: "Dry grain maize fetches ₹2,090-₹2,450/qtl in Khanna, Rajpura & Bihar mandis.",
      pa: "ਖੰਨਾ, ਰਾਜਪੁਰਾ ਅਤੇ ਬਿਹਾਰ ਮੰਡੀਆਂ ਵਿੱਚ ਮੱਕੀ ਦਾ ਰੇਟ ₹2,090-₹2,450/ਕੁਇੰਟਲ ਰਹਿੰਦਾ ਹੈ।",
      hi: "खन्ना, राजपुरा व बिहार मंडियों में मक्के का भाव ₹2,090-₹2,450/कुंतल मिलता है।"
    },
    historicalMandiTrend: {
      en: "📊 5-Year Mandi Record (2021-2025): Maize prices averaged ₹2,090-₹2,450/qtl during autumn procurement.",
      pa: "📊 ਪਿਛਲੇ 5 ਸਾਲਾਂ ਦਾ ਰਿਕਾਰਡ: ਓਕਤੂਬਰ ਵਿੱਚ ਮੱਕੀ ਦਾ ਔਸਤ ਮੰਡੀ ਭਾਅ ₹2,090-₹2,450/ਕੁਇੰਟਲ ਰਿਕਾਰਡ ਹੋਇਆ।",
      hi: "📊 पिछले 5 वर्षों का रिकॉर्ड: अक्टूबर में मक्के का औसत मंडी भाव ₹2,090-₹2,450/कुंतल रहा।"
    }
  }
];

export const KisanCropIntelligenceCard: React.FC = () => {
  const { language } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LangCode>('pa');
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('DEMAND_PRICE');
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('ALL_SEASONS');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('ALL');
  const [selectedDays, setSelectedDays] = useState<number>(999);
  const [farmerCrops, setFarmerCrops] = useState<string[]>(['Potato', 'Paddy', 'Peas', 'Wheat']);

  useEffect(() => {
    if (language && (language === 'en' || language === 'pa' || language === 'hi')) {
      setSelectedLang(language as LangCode);
    }
  }, [language]);

  const uiText = useMemo(() => {
    return UI_TRANSLATIONS[selectedLang] || UI_TRANSLATIONS.en;
  }, [selectedLang]);

  const filteredCrops = useMemo(() => {
    let list = CROP_INTELLIGENCE_DATA;

    if (selectedDays !== 999) {
      list = list.filter((item) => item.daysToEvent <= selectedDays);
    }

    if (selectedSeasonFilter === 'ADVANCE_SEASONAL') {
      list = list.filter((item) => item.seasonType === 'ADVANCE_SEASONAL');
    } else if (selectedSeasonFilter === 'SEASONAL') {
      list = list.filter((item) => item.seasonType === 'SEASONAL');
    }

    if (selectedCropFilter === 'MY_CROPS') {
      list = list.filter((item) => {
        const cEn = item.cropName.en.toLowerCase();
        const cPa = (item.cropName.pa || '').toLowerCase();
        const cHi = (item.cropName.hi || '').toLowerCase();
        return farmerCrops.some((fc) => {
          const f = fc.toLowerCase();
          return cEn.includes(f) || cPa.includes(f) || cHi.includes(f);
        });
      });
    } else if (selectedCropFilter === 'VEG') {
      list = list.filter((item) => item.category === 'VEG');
    } else if (selectedCropFilter === 'FLOWERS') {
      list = list.filter((item) => item.category === 'FLOWERS');
    } else if (selectedCropFilter === 'FRUITS') {
      list = list.filter((item) => item.category === 'FRUITS');
    } else if (selectedCropFilter === 'FODDER') {
      list = list.filter((item) => item.category === 'FODDER');
    } else if (selectedCropFilter === 'GRAINS_CASH') {
      list = list.filter((item) => item.category === 'GRAINS_CASH');
    }

    return list;
  }, [selectedDays, selectedSeasonFilter, selectedCropFilter, farmerCrops]);

  const shareWhatsApp = () => {
    tap();
    const titleText = activeMainTab === 'DEMAND_PRICE' ? uiText.tabDemand : uiText.tabSowing;
    const text =
      `🌾 *${titleText}*\n\n` +
      filteredCrops
        .map(
          (c) => {
            const cropNameStr = c.cropName[selectedLang] || c.cropName.en;
            const priceStr = c.priceChange[selectedLang] || c.priceChange.en;
            if (activeMainTab === 'DEMAND_PRICE') {
              const eventStr = c.eventDate[selectedLang] || c.eventDate.en;
              const delayStr = c.harvestDelayAdvice[selectedLang] || c.harvestDelayAdvice.en;
              const mandiStr = c.mandiImpact[selectedLang] || c.mandiImpact.en;
              return `• ${cropNameStr} (${priceStr})\n  ${uiText.eventDateLabel} ${eventStr}\n  ${uiText.harvestDelayHeaderLabel} ${delayStr}\n  ${uiText.mandiHeaderLabel} ${mandiStr}`;
            } else {
              const sowStr = c.sowDates[selectedLang] || c.sowDates.en;
              const targetStr = c.targetFestivalSeason[selectedLang] || c.targetFestivalSeason.en;
              const adviceStr = c.farmerAdvice[selectedLang] || c.farmerAdvice.en;
              return `• ${cropNameStr} (${priceStr})\n  ${uiText.sowDateLabel} ${sowStr}\n  ${uiText.targetFestivalHeaderLabel} ${targetStr}\n  ${uiText.adviceHeaderLabel} ${adviceStr}`;
            }
          }
        )
        .join('\n\n') +
      `\n\n📲 FarmsKing App`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') alert(text);
    });
  };

  return (
    <View style={[styles.mainEngineContainer, premiumShadow('#0f172a', 'md')]}>
      {/* 🌟 HEADER BANNER WITH INTEGRATED 1-TAP LANGUAGE SELECTOR */}
      <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.headerBanner}>
        <View style={styles.headerTopRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
            <Ionicons name="analytics" size={20} color="#38bdf8" />
            <Text style={styles.headerTitle}>{uiText.headerTitle}</Text>
          </View>

          {/* 1-Tap Language Quick Switcher */}
          <View style={styles.topLangPillBox}>
            <TouchableOpacity
              style={[styles.topLangBtn, selectedLang === 'pa' && styles.topLangBtnActive]}
              onPress={() => {
                tap();
                setSelectedLang('pa');
              }}
            >
              <Text style={[styles.topLangBtnText, selectedLang === 'pa' && styles.topLangBtnTextActive]}>ਪੰਜਾਬੀ</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topLangBtn, selectedLang === 'hi' && styles.topLangBtnActive]}
              onPress={() => {
                tap();
                setSelectedLang('hi');
              }}
            >
              <Text style={[styles.topLangBtnText, selectedLang === 'hi' && styles.topLangBtnTextActive]}>हिंदी</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topLangBtn, selectedLang === 'en' && styles.topLangBtnActive]}
              onPress={() => {
                tap();
                setSelectedLang('en');
              }}
            >
              <Text style={[styles.topLangBtnText, selectedLang === 'en' && styles.topLangBtnTextActive]}>ENG</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.headerSub}>{uiText.headerSub}</Text>
      </LinearGradient>

      {/* 🌟 2 MAIN TABS BAR */}
      <View style={styles.mainTabBar}>
        <TouchableOpacity
          style={[styles.mainTabBtn, activeMainTab === 'DEMAND_PRICE' && styles.mainTabBtnActiveA]}
          onPress={() => {
            tap();
            setActiveMainTab('DEMAND_PRICE');
          }}
        >
          <Ionicons name="trending-up" size={16} color={activeMainTab === 'DEMAND_PRICE' ? '#ffffff' : '#94a3b8'} />
          <Text style={[styles.mainTabBtnText, activeMainTab === 'DEMAND_PRICE' && styles.mainTabBtnTextActive]}>
            {uiText.tabDemand}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, activeMainTab === 'SOWING_PLANNING' && styles.mainTabBtnActiveB]}
          onPress={() => {
            tap();
            setActiveMainTab('SOWING_PLANNING');
          }}
        >
          <Ionicons name="leaf" size={16} color={activeMainTab === 'SOWING_PLANNING' ? '#ffffff' : '#94a3b8'} />
          <Text style={[styles.mainTabBtnText, activeMainTab === 'SOWING_PLANNING' && styles.mainTabBtnTextActive]}>
            {uiText.tabSowing}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ⚙️ TOP CONTROL FILTERS BAR */}
      <View style={styles.topBarContainer}>
        {/* Season Type Filter Dropdown */}
        <View style={styles.controlBoxBlue}>
          <Text style={styles.controlBoxTitleBlue}>{uiText.seasonFilterLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
            {SEASON_FILTER_OPTIONS.map((opt) => {
              const isActive = selectedSeasonFilter === opt.id;
              const optLabel = selectedLang === 'pa' ? opt.labelPa : selectedLang === 'hi' ? opt.labelHi : opt.labelEn;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.pillBtnBlue, isActive && styles.pillBtnBlueActive]}
                  onPress={() => {
                    tap();
                    setSelectedSeasonFilter(opt.id);
                  }}
                >
                  <Text style={[styles.pillBtnTextBlue, isActive && styles.pillBtnTextBlueActive]}>
                    {optLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Crop Category Dropdown */}
        <View style={styles.controlBoxGreen}>
          <Text style={styles.controlBoxTitleGreen}>{uiText.cropFilterLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
            {CROP_FILTER_OPTIONS.map((opt) => {
              const isActive = selectedCropFilter === opt.id;
              const optLabel = selectedLang === 'pa' ? opt.labelPa : selectedLang === 'hi' ? opt.labelHi : opt.labelEn;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.pillBtnGreen, isActive && styles.pillBtnGreenActive]}
                  onPress={() => {
                    tap();
                    setSelectedCropFilter(opt.id);
                  }}
                >
                  <Text style={[styles.pillBtnTextGreen, isActive && styles.pillBtnTextGreenActive]}>
                    {optLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Days Window Filter */}
        <View style={styles.controlBoxSlate}>
          <Text style={styles.controlBoxTitleSlate}>{uiText.daysFilterLabel}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
            {EVENT_DAYS_OPTIONS.map((opt) => {
              const isActive = selectedDays === opt.days;
              const optLabel = selectedLang === 'pa' ? opt.labelPa : opt.labelEn;
              return (
                <TouchableOpacity
                  key={opt.days}
                  style={[styles.pillBtnSlate, isActive && styles.pillBtnSlateActive]}
                  onPress={() => {
                    tap();
                    setSelectedDays(opt.days);
                  }}
                >
                  <Text style={[styles.pillBtnTextSlate, isActive && styles.pillBtnTextSlateActive]}>
                    {optLabel}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* 📋 CROPS INTELLIGENCE CARDS FEED */}
      <View style={styles.cardsFeed}>
        {filteredCrops.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="information-circle-outline" size={28} color="#64748b" />
            <Text style={styles.emptyText}>{uiText.emptyText}</Text>
          </View>
        ) : (
          filteredCrops.map((item, idx) => {
            const cropTitle = item.cropName[selectedLang] || item.cropName.en;
            const eventDateStr = item.eventDate[selectedLang] || item.eventDate.en;
            const sowDatesStr = item.sowDates[selectedLang] || item.sowDates.en;
            const priceChangeStr = item.priceChange[selectedLang] || item.priceChange.en;
            const festivalNameStr = item.festivalName[selectedLang] || item.festivalName.en;
            const statesTextStr = item.statesListText[selectedLang] || item.statesListText.en;
            const farmerAdviceStr = item.farmerAdvice[selectedLang] || item.farmerAdvice.en;
            const harvestDelayAdviceStr = item.harvestDelayAdvice[selectedLang] || item.harvestDelayAdvice.en;
            const targetFestivalSeasonStr = item.targetFestivalSeason[selectedLang] || item.targetFestivalSeason.en;
            const significanceStr = item.significance[selectedLang] || item.significance.en;
            const mandiImpactStr = item.mandiImpact[selectedLang] || item.mandiImpact.en;
            const historicalTrendStr = item.historicalMandiTrend
              ? item.historicalMandiTrend[selectedLang] || item.historicalMandiTrend.en
              : null;

            return (
              <View key={`${item.category}-${idx}`} style={[styles.cropCardItem, premiumShadow('#0f172a', 'sm')]}>
                {/* Crop Card Header Banner */}
                <View style={styles.cropCardHeader}>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.cropCardTitle}>{cropTitle}</Text>
                      
                      {/* Advance Seasonal vs Seasonal Badge Pill */}
                      {item.seasonType === 'ADVANCE_SEASONAL' ? (
                        <View style={styles.advanceSeasonBadge}>
                          <Ionicons name="sparkles" size={10} color="#065f46" />
                          <Text style={styles.advanceSeasonBadgeText}>
                            {selectedLang === 'pa' ? '🌱 ਅਗੇਤੀ ਬੀਜਾਈ (Advance)' : selectedLang === 'hi' ? '🌱 अगेती बुवाई (Advance)' : '🌱 Advance Seasonal'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.regularSeasonBadge}>
                          <Ionicons name="calendar-outline" size={10} color="#1e3a8a" />
                          <Text style={styles.regularSeasonBadgeText}>
                            {selectedLang === 'pa' ? '🌾 ਰਵਾਇਤੀ ਸੀਜ਼ਨ (Main)' : selectedLang === 'hi' ? '🌾 मुख्य सीजन (Main)' : '🌾 Main Seasonal'}
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cropCardSubNames}>{item.localLangName}</Text>
                  </View>

                  <View style={styles.pricePill}>
                    <Text style={styles.pricePillText}>{priceChangeStr}</Text>
                  </View>
                </View>

                <View style={styles.cropCardBody}>
                  {/* Festival / Event Tag Row */}
                  <View style={styles.eventRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                      <Ionicons name="sparkles" size={14} color="#d97706" />
                      <Text style={styles.festivalNameText}>{festivalNameStr}</Text>
                    </View>
                    <View style={styles.faithTag}>
                      <Text style={styles.faithTagText}>{item.faithCategory}</Text>
                    </View>
                  </View>

                  {/* Regions / States Row */}
                  <View style={styles.metaRow}>
                    <Ionicons name="location-sharp" size={13} color="#0284c7" />
                    <Text style={styles.metaLabel}>{uiText.stateLabel}</Text>
                    <Text style={styles.metaValue} numberOfLines={1}>
                      {statesTextStr}
                    </Text>
                  </View>

                  {/* ==================================================== */}
                  {/* TAB 1: DEMAND & PRICE FOCUS */}
                  {/* ==================================================== */}
                  {activeMainTab === 'DEMAND_PRICE' ? (
                    <>
                      {/* Date Grid Box for Peak Mandi Date */}
                      <View style={styles.dateGridBox}>
                        <View style={[styles.dateGridCol, { width: '100%' }]}>
                          <Text style={styles.dateGridLabel}>{uiText.eventDateLabel}</Text>
                          <Text style={styles.dateGridValueRed}>{eventDateStr}</Text>
                        </View>
                      </View>

                      {/* 🛑 HARVESTING & PICKING STOPPAGE ADVISORY BOX */}
                      <View style={styles.harvestDelayBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Ionicons name="alert-circle" size={16} color="#b45309" />
                          <Text style={styles.harvestDelayTitle}>{uiText.harvestDelayHeaderLabel}</Text>
                        </View>
                        <Text style={styles.harvestDelayText}>{harvestDelayAdviceStr}</Text>
                      </View>

                      {/* Mandi Price Impact Box */}
                      <View style={styles.mandiBox}>
                        <Text style={styles.sectionHeaderTitle}>{uiText.mandiHeaderLabel}</Text>
                        <Text style={styles.mandiBodyText}>{mandiImpactStr}</Text>
                      </View>

                      {/* 5-Year Historical Trend Box */}
                      {historicalTrendStr ? (
                        <View style={styles.historicalBox}>
                          <Text style={styles.sectionHeaderTitle}>{uiText.historicalHeaderLabel}</Text>
                          <Text style={styles.historicalBodyText}>{historicalTrendStr}</Text>
                        </View>
                      ) : null}
                    </>
                  ) : (
                    /* ==================================================== */
                    /* TAB 2: SOWING & CROP PLANNING FOCUS */
                    /* ==================================================== */
                    <>
                      {/* Date Grid Box for Optimal Sowing Window */}
                      <View style={styles.dateGridBox}>
                        <View style={[styles.dateGridCol, { width: '100%' }]}>
                          <Text style={styles.dateGridLabel}>{uiText.sowDateLabel}</Text>
                          <Text style={styles.dateGridValueGreen}>{sowDatesStr}</Text>
                        </View>
                      </View>

                      {/* 🎯 TARGET SEASON & FESTIVAL TO TARGET BOX */}
                      <View style={styles.targetFestivalBox}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Ionicons name="ribbon-outline" size={16} color="#047857" />
                          <Text style={styles.targetFestivalTitle}>{uiText.targetFestivalHeaderLabel}</Text>
                        </View>
                        <Text style={styles.targetFestivalText}>{targetFestivalSeasonStr}</Text>
                      </View>

                      {/* Sowing & Field Prep Farmer Advice Box */}
                      <View style={styles.adviceBox}>
                        <Text style={styles.sectionHeaderTitle}>{uiText.adviceHeaderLabel}</Text>
                        <Text style={styles.adviceBodyText}>{farmerAdviceStr}</Text>
                      </View>

                      {/* Cultural Significance Box */}
                      <View style={styles.significanceBox}>
                        <Text style={styles.significanceTitle}>{uiText.significanceHeaderLabel}</Text>
                        <Text style={styles.significanceText}>{significanceStr}</Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}
      </View>

      {/* 📲 WHATSAPP SHARE ACTION FOOTER */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.shareWhatsappBtn} activeOpacity={0.85} onPress={shareWhatsApp}>
          <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
          <Text style={styles.shareWhatsappBtnText}>{uiText.shareBtnLabel}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainEngineContainer: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginTop: 6,
    marginBottom: 16,
  },
  headerBanner: {
    padding: 14,
    gap: 6,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 15,
  },
  topLangPillBox: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topLangBtn: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  topLangBtnActive: {
    backgroundColor: '#ffffff',
  },
  topLangBtnText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  topLangBtnTextActive: {
    color: '#0f172a',
  },
  mainTabBar: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 4,
    gap: 4,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mainTabBtnActiveA: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  mainTabBtnActiveB: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  mainTabBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  mainTabBtnTextActive: {
    color: '#ffffff',
  },
  topBarContainer: {
    padding: 10,
    backgroundColor: '#f1f5f9',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  controlBoxBlue: {
    backgroundColor: '#eff6ff',
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  controlBoxTitleBlue: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#1e40af',
  },
  pillBtnBlue: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pillBtnBlueActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  pillBtnTextBlue: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#334155',
  },
  pillBtnTextBlueActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  controlBoxGreen: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  controlBoxTitleGreen: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  pillBtnGreen: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pillBtnGreenActive: {
    backgroundColor: '#16a34a',
    borderColor: '#15803d',
  },
  pillBtnTextGreen: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#334155',
  },
  pillBtnTextGreenActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  controlBoxSlate: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  controlBoxTitleSlate: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  pillBtnSlate: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pillBtnSlateActive: {
    backgroundColor: '#475569',
    borderColor: '#334155',
  },
  pillBtnTextSlate: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#334155',
  },
  pillBtnTextSlateActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  cardsFeed: {
    padding: 10,
    gap: 10,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
  cropCardItem: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 10,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  cropCardTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  advanceSeasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  advanceSeasonBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#065f46',
  },
  regularSeasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  regularSeasonBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#1e3a8a',
  },
  cropCardSubNames: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  pricePill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pricePillText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#92400e',
  },
  cropCardBody: {
    padding: 10,
    gap: 8,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  festivalNameText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  faithTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  faithTagText: {
    fontSize: 9,
    fontFamily: FONT.semiBold,
    color: '#92400e',
  },
  dateGridBox: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 8,
  },
  dateGridCol: {
    gap: 2,
  },
  dateGridLabel: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  dateGridValueRed: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
  },
  dateGridValueGreen: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#16a34a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  metaValue: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#334155',
    flex: 1,
  },
  harvestDelayBox: {
    backgroundColor: '#fffbe6',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  harvestDelayTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#92400e',
  },
  harvestDelayText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#78350f',
    lineHeight: 15,
  },
  targetFestivalBox: {
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  targetFestivalTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#065f46',
  },
  targetFestivalText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#047857',
    lineHeight: 15,
  },
  adviceBox: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  sectionHeaderTitle: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#166534',
    marginBottom: 2,
  },
  adviceBodyText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#14532d',
    lineHeight: 15,
  },
  mandiBox: {
    backgroundColor: '#f0f9ff',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  mandiBodyText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#0c4a6e',
    lineHeight: 15,
  },
  historicalBox: {
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  historicalBodyText: {
    fontSize: 10,
    fontFamily: FONT.semiBold,
    color: '#334155',
    lineHeight: 14,
  },
  significanceBox: {
    backgroundColor: '#faf5ff',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  significanceTitle: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#6b21a8',
    marginBottom: 2,
  },
  significanceText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#581c87',
    lineHeight: 14,
  },
  footerContainer: {
    padding: 10,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  shareWhatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25d366',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  shareWhatsappBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
