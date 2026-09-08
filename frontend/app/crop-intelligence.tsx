import React, { useEffect, useMemo, useState } from 'react';
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useLanguage } from '@/src/store/language-context';
import {
  CROP_INTELLIGENCE_DATA,
  CropIntelligenceItem,
  LangCode,
  MainTabType,
  SeasonType,
  UI_TRANSLATIONS,
} from '@/src/components/KisanCropIntelligenceCard';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export type ViewByMode = 'DATE_MONTH' | 'CROP' | 'FESTIVAL' | 'SEASON';

export const DATE_MONTH_FILTER_OPTIONS = [
  { id: 'ALL', labelPa: '🌐 ਸਾਰੇ ਮਹੀਨੇ/ਤਾਰੀਖਾਂ (All)', labelEn: '🌐 All Dates', labelHi: '🌐 सभी तिथियां' },
  { id: 'NEXT_30', labelPa: '⚡ ਅਗਲੇ 30 ਦਿਨ (Next 30 Days)', labelEn: '⚡ Next 30 Days', labelHi: '⚡ अगले 30 दिन' },
  { id: 'NEXT_60', labelPa: '📅 ਅਗਲੇ 60 ਦਿਨ (Next 60 Days)', labelEn: '📅 Next 60 Days', labelHi: '📅 अगले 60 दिन' },
  { id: 'SEP_OCT', labelPa: '🪔 ਸਤੰਬਰ - ਅਕਤੂਬਰ (Sep-Oct)', labelEn: '🪔 Sep - Oct', labelHi: '🪔 सितंबर - अक्टूबर' },
  { id: 'NOV_DEC', labelPa: '🌾 ਨਵੰਬਰ - ਦਸੰਬਰ (Nov-Dec)', labelEn: '🌾 Nov - Dec', labelHi: '🌾 नवंबर - दिसंबर' },
  { id: 'JAN_FEB', labelPa: '❄️ ਜਨਵਰੀ - ਫਰਵਰੀ (Jan-Feb)', labelEn: '❄️ Jan - Feb', labelHi: '❄️ जनवरी - फरवरी' },
  { id: 'MAR_APR', labelPa: '🌸 ਮਾਰਚ - ਅਪ੍ਰੈਲ (Mar-Apr)', labelEn: '🌸 Mar - Apr', labelHi: '🌸 मार्च - अप्रैल' },
  { id: 'MAY_JUN', labelPa: '☀️ ਮਈ - ਜੂਨ (May-Jun)', labelEn: '☀️ May - Jun', labelHi: '☀️ मई - जून' },
  { id: 'JUL_AUG', labelPa: '🌧️ ਜੁਲਾਈ - ਅਗਸਤ (Jul-Aug)', labelEn: '🌧️ Jul - Aug', labelHi: '🌧️ जुलाई - अगस्त' },
];

export const FESTIVAL_FILTER_OPTIONS = [
  { id: 'ALL', labelPa: '🌐 ਸਾਰੇ ਤਿਉਹਾਰ (All)', labelEn: '🌐 All Festivals', labelHi: '🌐 सभी त्योहार' },
  { id: 'NAVRATRI', labelPa: '🛕 ਨਵਰਾਤਰੇ & ਦੁਰਗਾ ਪੂਜਾ', labelEn: '🛕 Navratri & Durga Puja', labelHi: '🛕 नवरात्रि व दुर्गा पूजा' },
  { id: 'DIWALI', labelPa: '🪔 ਦਿਵਾਲੀ & ਵਿਆਹ ਸੀਜ਼ਨ', labelEn: '🪔 Diwali & Marriage Season', labelHi: '🪔 दिवाली व शादी सीजन' },
  { id: 'CHHATH', labelPa: '☀️ ਛੱਠ ਪੂਜਾ (ਗੰਨਾ)', labelEn: '☀️ Chhath Puja (Sugarcane)', labelHi: '☀️ छठ पूजा (गन्ना)' },
  { id: 'BAKRID', labelPa: '🐐 ਬਕਰੀਦ ਪਸ਼ੂ ਮੰਡੀ (ਚਾਰਾ)', labelEn: '🐐 Bakrid Animal Mandi', labelHi: '🐐 बकरीद पशु मंडी' },
  { id: 'BAISAKHI', labelPa: '🌾 ਵਿਸਾਖੀ & MSP (ਕਣਕ)', labelEn: '🌾 Baisakhi & MSP Wheat', labelHi: '🌾 बैसाखी व MSP गेहूं' },
  { id: 'RAMADAN', labelPa: '🌙 ਰਮਜ਼ਾਨ ਇਫ਼ਤਾਰ (ਤਰਬੂਜ)', labelEn: '🌙 Ramadan Iftar Melon', labelHi: '🌙 रमजान इफ्तार तरबूज' },
];

export const CROP_FILTER_OPTIONS_PAGE = [
  { id: 'ALL', labelPa: '🌐 ਸਾਰੀਆਂ ਫ਼ਸਲਾਂ (All)', labelEn: '🌐 All Crops', labelHi: '🌐 सभी फसलें' },
  { id: 'VEG', labelPa: '🥬 ਸਬਜ਼ੀਆਂ (Veg)', labelEn: '🥬 Vegetables', labelHi: '🥬 सब्जियां' },
  { id: 'FLOWERS', labelPa: '🌸 ਫੁੱਲ (Flowers)', labelEn: '🌸 Flowers', labelHi: '🌸 फूल' },
  { id: 'GRAINS_CASH', labelPa: '🌾 ਅਨਾਜ, ਗੰਨਾ, ਕਪਾਹ & ਸਰ੍ਹੋਂ', labelEn: '🌾 Grains & Cash Crops', labelHi: '🌾 अनाज व नकदी फसलें' },
  { id: 'FRUITS', labelPa: '🍉 ਫਲ (Fruits)', labelEn: '🍉 Fruits', labelHi: '🍉 फल' },
  { id: 'FODDER', labelPa: '🌿 ਹਰਾ ਚਾਰਾ (Fodder)', labelEn: '🌿 Green Fodder', labelHi: '🌿 हरा चारा' },
];

export const SEASON_FILTER_OPTIONS_PAGE = [
  { id: 'ALL', labelPa: '🌐 ਸਾਰੇ ਸੀਜ਼ਨ (All)', labelEn: '🌐 All Seasons', labelHi: '🌐 सभी सीजन' },
  { id: 'ADVANCE_SEASONAL', labelPa: '🌱 ਅਗੇਤੀ ਬੀਜਾਈ (Advance Seasonal)', labelEn: '🌱 Advance Seasonal', labelHi: '🌱 अगेती बुवाई' },
  { id: 'SEASONAL', labelPa: '🌾 ਰਵਾਇਤੀ ਸੀਜ਼ਨ (Main Seasonal)', labelEn: '🌾 Main Seasonal', labelHi: '🌾 मुख्य सीजन' },
];

export default function CropIntelligenceScreen() {
  const router = useRouter();
  const { language } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<LangCode>('pa');
  
  // Primary operational tab (Demand vs Sowing)
  const [activeMainTab, setActiveMainTab] = useState<MainTabType>('DEMAND_PRICE');
  
  // 4 Primary View Modes requested by user (Date/Month-wise, Crop-wise, Festival-wise, Season-wise)
  const [viewByMode, setViewByMode] = useState<ViewByMode>('DATE_MONTH');
  
  // Sub filters
  const [selectedDateMonthFilter, setSelectedDateMonthFilter] = useState<string>('ALL');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('ALL');
  const [selectedFestivalFilter, setSelectedFestivalFilter] = useState<string>('ALL');
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<string>('ALL');

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

    // View mode filters
    if (viewByMode === 'DATE_MONTH') {
      if (selectedDateMonthFilter === 'NEXT_30') {
        list = list.filter((i) => i.daysToEvent <= 30);
      } else if (selectedDateMonthFilter === 'NEXT_60') {
        list = list.filter((i) => i.daysToEvent <= 60);
      } else if (selectedDateMonthFilter === 'SEP_OCT') {
        list = list.filter((i) => {
          const text = (i.eventDate.en + ' ' + i.sowDates.en).toLowerCase();
          return text.includes('sep') || text.includes('oct');
        });
      } else if (selectedDateMonthFilter === 'NOV_DEC') {
        list = list.filter((i) => {
          const text = (i.eventDate.en + ' ' + i.sowDates.en).toLowerCase();
          return text.includes('nov') || text.includes('dec');
        });
      } else if (selectedDateMonthFilter === 'JAN_FEB') {
        list = list.filter((i) => {
          const text = (i.eventDate.en + ' ' + i.sowDates.en).toLowerCase();
          return text.includes('jan') || text.includes('feb');
        });
      } else if (selectedDateMonthFilter === 'MAR_APR') {
        list = list.filter((i) => {
          const text = (i.eventDate.en + ' ' + i.sowDates.en).toLowerCase();
          return text.includes('mar') || text.includes('apr');
        });
      } else if (selectedDateMonthFilter === 'MAY_JUN') {
        list = list.filter((i) => {
          const text = (i.eventDate.en + ' ' + i.sowDates.en).toLowerCase();
          return text.includes('may') || text.includes('jun');
        });
      } else if (selectedDateMonthFilter === 'JUL_AUG') {
        list = list.filter((i) => {
          const text = (i.eventDate.en + ' ' + i.sowDates.en).toLowerCase();
          return text.includes('jul') || text.includes('aug');
        });
      }
    } else if (viewByMode === 'CROP') {
      if (selectedCropFilter === 'VEG') list = list.filter((i) => i.category === 'VEG');
      else if (selectedCropFilter === 'FLOWERS') list = list.filter((i) => i.category === 'FLOWERS');
      else if (selectedCropFilter === 'GRAINS_CASH') list = list.filter((i) => i.category === 'GRAINS_CASH');
      else if (selectedCropFilter === 'FRUITS') list = list.filter((i) => i.category === 'FRUITS');
      else if (selectedCropFilter === 'FODDER') list = list.filter((i) => i.category === 'FODDER');
    } else if (viewByMode === 'FESTIVAL') {
      if (selectedFestivalFilter === 'NAVRATRI') list = list.filter((i) => i.festivalName.en.includes('Navratri'));
      else if (selectedFestivalFilter === 'DIWALI') list = list.filter((i) => i.festivalName.en.includes('Diwali'));
      else if (selectedFestivalFilter === 'CHHATH') list = list.filter((i) => i.festivalName.en.includes('Chhath'));
      else if (selectedFestivalFilter === 'BAKRID') list = list.filter((i) => i.festivalName.en.includes('Bakrid'));
      else if (selectedFestivalFilter === 'BAISAKHI') list = list.filter((i) => i.festivalName.en.includes('Baisakhi'));
      else if (selectedFestivalFilter === 'RAMADAN') list = list.filter((i) => i.festivalName.en.includes('Ramadan'));
    } else if (viewByMode === 'SEASON') {
      if (selectedSeasonFilter === 'ADVANCE_SEASONAL') list = list.filter((i) => i.seasonType === 'ADVANCE_SEASONAL');
      else if (selectedSeasonFilter === 'SEASONAL') list = list.filter((i) => i.seasonType === 'SEASONAL');
    }

    return list;
  }, [viewByMode, selectedDateMonthFilter, selectedCropFilter, selectedFestivalFilter, selectedSeasonFilter]);

  const shareWhatsApp = () => {
    tap();
    const titleText = activeMainTab === 'DEMAND_PRICE' ? uiText.tabDemand : uiText.tabSowing;
    const text =
      `🌾 *${titleText}*\n\n` +
      filteredCrops
        .map((c) => {
          const cropNameStr = c.cropName[selectedLang] || c.cropName.en;
          const priceStr = c.priceChange[selectedLang] || c.priceChange.en;
          if (activeMainTab === 'DEMAND_PRICE') {
            const eventStr = c.eventDate[selectedLang] || c.eventDate.en;
            const delayStr = c.harvestDelayAdvice[selectedLang] || c.harvestDelayAdvice.en;
            return `• ${cropNameStr} (${priceStr})\n  ${uiText.eventDateLabel} ${eventStr}\n  ${uiText.harvestDelayHeaderLabel} ${delayStr}`;
          } else {
            const sowStr = c.sowDates[selectedLang] || c.sowDates.en;
            const targetStr = c.targetFestivalSeason[selectedLang] || c.targetFestivalSeason.en;
            return `• ${cropNameStr} (${priceStr})\n  ${uiText.sowDateLabel} ${sowStr}\n  ${uiText.targetFestivalHeaderLabel} ${targetStr}`;
          }
        })
        .join('\n\n') +
      `\n\n📲 FarmsKing App`;
    const url = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') alert(text);
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 🌟 TOP APP HEADER */}
      <View style={styles.topNavHeader}>
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
          <Text style={styles.backBtnText}>ਪਿੱਛੇ (Back)</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitleMain} numberOfLines={1}>
            Crop Engine (Demand & Sowing)
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedLang === 'pa' ? 'ਫ਼ਸਲ ਬੀਜਾਈ ਤੇ ਮੰਗ ਮੰਡੀ ਇੰਜਣ' : selectedLang === 'hi' ? 'फसल बुवाई व मांग मंडी इंजन' : 'Smart Market & Sowing Advisor'}
          </Text>
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

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 50 }}>
        {/* 🌟 2 OPERATIONAL TABS BAR (Demand & Price vs Sowing & Planning) */}
        <View style={styles.mainTabBar}>
          <TouchableOpacity
            style={[styles.mainTabBtn, activeMainTab === 'DEMAND_PRICE' && styles.mainTabBtnActiveA]}
            activeOpacity={0.85}
            onPress={() => {
              tap();
              setActiveMainTab('DEMAND_PRICE');
            }}
          >
            <View style={[styles.tabIconBadge, activeMainTab === 'DEMAND_PRICE' && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="trending-up" size={17} color={activeMainTab === 'DEMAND_PRICE' ? '#ffffff' : '#0284c7'} />
            </View>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={[styles.mainTabBtnText, activeMainTab === 'DEMAND_PRICE' && styles.mainTabBtnTextActive]}>
                {uiText.tabDemand}
              </Text>
              <Text style={[styles.mainTabSubText, activeMainTab === 'DEMAND_PRICE' && { color: 'rgba(255,255,255,0.85)' }]}>
                {selectedLang === 'pa' ? 'ਮੰਗ, ਮੰਡੀ ਰੇਟ & ਕਟਾਈ ਰੋਕ' : selectedLang === 'hi' ? 'मांग, मंडी रेट व कटाई रोक' : 'Peak Demand & Rate Impact'}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.mainTabBtn, activeMainTab === 'SOWING_PLANNING' && styles.mainTabBtnActiveB]}
            activeOpacity={0.85}
            onPress={() => {
              tap();
              setActiveMainTab('SOWING_PLANNING');
            }}
          >
            <View style={[styles.tabIconBadge, activeMainTab === 'SOWING_PLANNING' && { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Ionicons name="leaf" size={17} color={activeMainTab === 'SOWING_PLANNING' ? '#ffffff' : '#15803d'} />
            </View>
            <View style={{ alignItems: 'flex-start' }}>
              <Text style={[styles.mainTabBtnText, activeMainTab === 'SOWING_PLANNING' && styles.mainTabBtnTextActive]}>
                {uiText.tabSowing}
              </Text>
              <Text style={[styles.mainTabSubText, activeMainTab === 'SOWING_PLANNING' && { color: 'rgba(255,255,255,0.85)' }]}>
                {selectedLang === 'pa' ? 'ਬੀਜਾਈ ਸਮਾਂ & ਲਕਸ਼ਿਤ ਸੀਜ਼ਨ' : selectedLang === 'hi' ? 'बुवाई समय व टारगेट सीजन' : 'Sowing Dates & Target Events'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 🎯 4 VIEW MODE FILTER SELECTOR BAR (Date/Month-wise / Crop-wise / Festival-wise / Season-wise) */}
        <View style={styles.viewModeContainer}>
          <Text style={styles.viewModeHeaderTitle}>
            {selectedLang === 'pa' ? '🔍 ਦੇਖਣ ਦਾ ਤਰੀਕਾ (Select View Mode):' : selectedLang === 'hi' ? '🔍 देखने का तरीका:' : '🔍 Choose View Mode:'}
          </Text>

          <View style={styles.viewModeRow}>
            <TouchableOpacity
              style={[styles.viewModeBtn, viewByMode === 'DATE_MONTH' && styles.viewModeBtnActiveRed]}
              onPress={() => {
                tap();
                setViewByMode('DATE_MONTH');
              }}
            >
              <Ionicons name="time-outline" size={14} color={viewByMode === 'DATE_MONTH' ? '#ffffff' : '#b91c1c'} />
              <Text style={[styles.viewModeBtnText, viewByMode === 'DATE_MONTH' && styles.viewModeBtnTextActive]}>
                {selectedLang === 'pa' ? '📅 ਤਾਰੀਖ/ਮਹੀਨੇ ਅਨੁਸਾਰ' : selectedLang === 'hi' ? '📅 तारीख/महीने अनुसार' : '📅 Date/Month-wise'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeBtn, viewByMode === 'CROP' && styles.viewModeBtnActiveGreen]}
              onPress={() => {
                tap();
                setViewByMode('CROP');
              }}
            >
              <Ionicons name="leaf-outline" size={14} color={viewByMode === 'CROP' ? '#ffffff' : '#166534'} />
              <Text style={[styles.viewModeBtnText, viewByMode === 'CROP' && styles.viewModeBtnTextActive]}>
                {selectedLang === 'pa' ? '🌾 ਫ਼ਸਲ ਅਨੁਸਾਰ' : selectedLang === 'hi' ? '🌾 फसल अनुसार' : '🌾 Crop-wise'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeBtn, viewByMode === 'FESTIVAL' && styles.viewModeBtnActiveAmber]}
              onPress={() => {
                tap();
                setViewByMode('FESTIVAL');
              }}
            >
              <Ionicons name="sparkles-outline" size={14} color={viewByMode === 'FESTIVAL' ? '#ffffff' : '#92400e'} />
              <Text style={[styles.viewModeBtnText, viewByMode === 'FESTIVAL' && styles.viewModeBtnTextActive]}>
                {selectedLang === 'pa' ? '🛕 ਤਿਉਹਾਰ ਅਨੁਸਾਰ' : selectedLang === 'hi' ? '🛕 त्योहार अनुसार' : '🛕 Festival-wise'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.viewModeBtn, viewByMode === 'SEASON' && styles.viewModeBtnActiveBlue]}
              onPress={() => {
                tap();
                setViewByMode('SEASON');
              }}
            >
              <Ionicons name="calendar-outline" size={14} color={viewByMode === 'SEASON' ? '#ffffff' : '#1e40af'} />
              <Text style={[styles.viewModeBtnText, viewByMode === 'SEASON' && styles.viewModeBtnTextActive]}>
                {selectedLang === 'pa' ? '🌱 ਸੀਜ਼ਨ ਅਨੁਸਾਰ' : selectedLang === 'hi' ? '🌱 सीजन अनुसार' : '🌱 Season-wise'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ⚙️ DYNAMIC SUB-FILTER SCROLL ROW */}
        <View style={styles.subFilterRowContainer}>
          {viewByMode === 'DATE_MONTH' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
              {DATE_MONTH_FILTER_OPTIONS.map((opt) => {
                const isActive = selectedDateMonthFilter === opt.id;
                const label = selectedLang === 'pa' ? opt.labelPa : selectedLang === 'hi' ? opt.labelHi : opt.labelEn;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.chipRed, isActive && styles.chipRedActive]}
                    onPress={() => {
                      tap();
                      setSelectedDateMonthFilter(opt.id);
                    }}
                  >
                    <Text style={[styles.chipRedText, isActive && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {viewByMode === 'CROP' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
              {CROP_FILTER_OPTIONS_PAGE.map((opt) => {
                const isActive = selectedCropFilter === opt.id;
                const label = selectedLang === 'pa' ? opt.labelPa : selectedLang === 'hi' ? opt.labelHi : opt.labelEn;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.chipGreen, isActive && styles.chipGreenActive]}
                    onPress={() => {
                      tap();
                      setSelectedCropFilter(opt.id);
                    }}
                  >
                    <Text style={[styles.chipGreenText, isActive && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {viewByMode === 'FESTIVAL' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
              {FESTIVAL_FILTER_OPTIONS.map((opt) => {
                const isActive = selectedFestivalFilter === opt.id;
                const label = selectedLang === 'pa' ? opt.labelPa : selectedLang === 'hi' ? opt.labelHi : opt.labelEn;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.chipAmber, isActive && styles.chipAmberActive]}
                    onPress={() => {
                      tap();
                      setSelectedFestivalFilter(opt.id);
                    }}
                  >
                    <Text style={[styles.chipAmberText, isActive && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {viewByMode === 'SEASON' && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 4 }}>
              {SEASON_FILTER_OPTIONS_PAGE.map((opt) => {
                const isActive = selectedSeasonFilter === opt.id;
                const label = selectedLang === 'pa' ? opt.labelPa : selectedLang === 'hi' ? opt.labelHi : opt.labelEn;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.chipBlue, isActive && styles.chipBlueActive]}
                    onPress={() => {
                      tap();
                      setSelectedSeasonFilter(opt.id);
                    }}
                  >
                    <Text style={[styles.chipBlueText, isActive && styles.chipTextActive]}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* 📋 CROPS INTELLIGENCE CARDS FEED */}
        <View style={styles.cardsFeed}>
          {filteredCrops.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="information-circle-outline" size={32} color="#64748b" />
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
                        
                        {/* Season Badge Pill */}
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
                      <Ionicons name="trending-up" size={12} color="#92400e" />
                      <Text style={styles.pricePillText}>{priceChangeStr}</Text>
                    </View>
                  </View>

                  <View style={styles.cropCardBody}>
                    {/* Festival / Event Tag Row */}
                    <View style={styles.eventRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                        <Ionicons name="sparkles" size={15} color="#d97706" />
                        <Text style={styles.festivalNameText}>{festivalNameStr}</Text>
                      </View>
                      <View style={styles.faithTag}>
                        <Text style={styles.faithTagText}>{item.faithCategory}</Text>
                      </View>
                    </View>

                    {/* Regions / States Row */}
                    <View style={styles.metaRow}>
                      <Ionicons name="location-sharp" size={14} color="#0284c7" />
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
                        <View style={styles.dateGridBox}>
                          <Ionicons name="time-outline" size={16} color="#dc2626" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dateGridLabel}>{uiText.eventDateLabel}</Text>
                            <Text style={styles.dateGridValueRed}>{eventDateStr}</Text>
                          </View>
                        </View>

                        {/* 🛑 HARVESTING & PICKING STOPPAGE ADVISORY BOX */}
                        <View style={styles.harvestDelayBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Ionicons name="hand-stop-outline" size={17} color="#b45309" />
                            <Text style={styles.harvestDelayTitle}>{uiText.harvestDelayHeaderLabel}</Text>
                          </View>
                          <Text style={styles.harvestDelayText}>{harvestDelayAdviceStr}</Text>
                        </View>

                        {/* Mandi Price Impact Box */}
                        <View style={styles.mandiBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Ionicons name="stats-chart" size={15} color="#0369a1" />
                            <Text style={styles.sectionHeaderTitle}>{uiText.mandiHeaderLabel}</Text>
                          </View>
                          <Text style={styles.mandiBodyText}>{mandiImpactStr}</Text>
                        </View>

                        {/* 5-Year Historical Trend Box */}
                        {historicalTrendStr ? (
                          <View style={styles.historicalBox}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                              <Ionicons name="bar-chart-outline" size={15} color="#475569" />
                              <Text style={styles.historicalHeaderTitle}>{uiText.historicalHeaderLabel}</Text>
                            </View>
                            <Text style={styles.historicalBodyText}>{historicalTrendStr}</Text>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      /* ==================================================== */
                      /* TAB 2: SOWING & CROP PLANNING FOCUS */
                      /* ==================================================== */
                      <>
                        <View style={[styles.dateGridBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                          <Ionicons name="calendar" size={16} color="#16a34a" />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dateGridLabel}>{uiText.sowDateLabel}</Text>
                            <Text style={styles.dateGridValueGreen}>{sowDatesStr}</Text>
                          </View>
                        </View>

                        {/* 🎯 TARGET SEASON & FESTIVAL TO TARGET BOX */}
                        <View style={styles.targetFestivalBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Ionicons name="flag" size={16} color="#047857" />
                            <Text style={styles.targetFestivalTitle}>{uiText.targetFestivalHeaderLabel}</Text>
                          </View>
                          <Text style={styles.targetFestivalText}>{targetFestivalSeasonStr}</Text>
                        </View>

                        {/* Sowing & Field Prep Advisory */}
                        <View style={styles.adviceBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Ionicons name="construct" size={15} color="#166534" />
                            <Text style={styles.sectionHeaderTitleGreen}>{uiText.adviceHeaderLabel}</Text>
                          </View>
                          <Text style={styles.adviceBodyText}>{farmerAdviceStr}</Text>
                        </View>

                        {/* Cultural Significance Box */}
                        <View style={styles.significanceBox}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <Ionicons name="flower-outline" size={15} color="#6b21a8" />
                            <Text style={styles.significanceTitle}>{uiText.significanceHeaderLabel}</Text>
                          </View>
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
      </ScrollView>

      {/* 📲 WHATSAPP SHARE ACTION FOOTER */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.shareWhatsappBtn} activeOpacity={0.88} onPress={shareWhatsApp}>
          <Ionicons name="logo-whatsapp" size={19} color="#ffffff" />
          <Text style={styles.shareWhatsappBtnText}>{uiText.shareBtnLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  topNavHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#334155',
  },
  backBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitleMain: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
  },
  headerSubtitle: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  topLangPillBox: {
    flexDirection: 'row',
    gap: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
    borderRadius: RADIUS.pill,
  },
  topLangBtn: {
    paddingHorizontal: 7,
    paddingVertical: 3,
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
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  mainTabBar: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    padding: 8,
    gap: 8,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: RADIUS.lg,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  mainTabBtnActiveA: {
    backgroundColor: '#0284c7',
    borderColor: '#0369a1',
  },
  mainTabBtnActiveB: {
    backgroundColor: '#15803d',
    borderColor: '#166534',
  },
  tabIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTabBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#334155',
  },
  mainTabBtnTextActive: {
    color: '#ffffff',
  },
  mainTabSubText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  viewModeContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  viewModeHeaderTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  viewModeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  viewModeBtnActiveRed: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  viewModeBtnActiveGreen: {
    backgroundColor: '#166534',
    borderColor: '#14532d',
  },
  viewModeBtnActiveAmber: {
    backgroundColor: '#b45309',
    borderColor: '#78350f',
  },
  viewModeBtnActiveBlue: {
    backgroundColor: '#1e40af',
    borderColor: '#1e3a8a',
  },
  viewModeBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  viewModeBtnTextActive: {
    color: '#ffffff',
  },
  subFilterRowContainer: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  chipRed: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipRedActive: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  chipRedText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#991b1b',
  },
  chipGreen: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipGreenActive: {
    backgroundColor: '#15803d',
    borderColor: '#166534',
  },
  chipGreenText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  chipAmber: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipAmberActive: {
    backgroundColor: '#d97706',
    borderColor: '#b45309',
  },
  chipAmberText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#92400e',
  },
  chipBlue: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  chipBlueActive: {
    backgroundColor: '#2563eb',
    borderColor: '#1d4ed8',
  },
  chipBlueText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#1e40af',
  },
  chipTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  cardsFeed: {
    padding: 12,
    gap: 12,
  },
  emptyCard: {
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
  cropCardItem: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  cropCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    gap: 8,
  },
  cropCardTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  advanceSeasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  advanceSeasonBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#065f46',
  },
  regularSeasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dbeafe',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  regularSeasonBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#1e3a8a',
  },
  cropCardSubNames: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbe6',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  pricePillText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#92400e',
  },
  cropCardBody: {
    padding: 12,
    gap: 9,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  festivalNameText: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#b45309',
  },
  faithTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.xs,
  },
  faithTagText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#92400e',
  },
  dateGridBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 9,
  },
  dateGridLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  dateGridValueRed: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#dc2626',
    marginTop: 1,
  },
  dateGridValueGreen: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#16a34a',
    marginTop: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaLabel: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  metaValue: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#334155',
    flex: 1,
  },
  harvestDelayBox: {
    backgroundColor: '#fffbe6',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  harvestDelayTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#92400e',
  },
  harvestDelayText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#78350f',
    lineHeight: 16,
  },
  targetFestivalBox: {
    backgroundColor: '#ecfdf5',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  targetFestivalTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#065f46',
  },
  targetFestivalText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#047857',
    lineHeight: 16,
  },
  adviceBox: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  sectionHeaderTitleGreen: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  historicalHeaderTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  adviceBodyText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#14532d',
    lineHeight: 16,
  },
  mandiBox: {
    backgroundColor: '#f0f9ff',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  mandiBodyText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#0c4a6e',
    lineHeight: 16,
  },
  historicalBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  historicalBodyText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#334155',
    lineHeight: 15,
  },
  significanceBox: {
    backgroundColor: '#faf5ff',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e9d5ff',
  },
  significanceTitle: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#6b21a8',
  },
  significanceText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#581c87',
    lineHeight: 15,
  },
  footerContainer: {
    padding: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#cbd5e1',
  },
  shareWhatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#25d366',
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
  },
  shareWhatsappBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
