import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface CropAdvisoryPromoCardProps {
  onOpenLiveCall?: () => void;
  onExploreEngine?: () => void;
}

import { useLanguage } from '@/src/store/language-context';

export const CropAdvisoryPromoCard: React.FC<CropAdvisoryPromoCardProps> = ({
  onOpenLiveCall,
  onExploreEngine,
}) => {
  const { language } = useLanguage();
  const [lang, setLang] = useState<'pa' | 'hi' | 'en'>((language === 'hi' || language === 'pa' ? language : 'en'));

  const sharePromoWhatsApp = () => {
    tap();
    const promoText =
      `🌾 *FarmsKing ਕਿਸਾਨ ਫ਼ਸਲ ਸਲਾਹ ਸੇਵਾ (Crop Advisory)* 🌾\n\n` +
      `ਕੀ ਤੁਸੀਂ ਆਪਣੀ ਫ਼ਸਲ ਦਾ 2x ਤੋਂ 3x ਵੱਧ ਮੰਡੀ ਰੇਟ ਲੈਣਾ ਚਾਹੁੰਦੇ ਹੋ?\n\n` +
      `🔥 *ਮੁੱਖ ਫਾਇਦੇ (Key Features):*\n` +
      `1️⃣ *ਤਿਉਹਾਰੀ ਮੰਗ ਅਤੇ ਬੀਜਾਈ ਸਮਾਂ*: ਨਵਰਾਤਰੇ, ਦਿਵਾਲੀ, ਛੱਠ ਅਤੇ ਰਮਜ਼ਾਨ ਅਨੁਸਾਰ ਸਹੀ ਬੀਜਾਈ ਸਲਾਹ।\n` +
      `2️⃣ *AI ਬੀਮਾਰੀ ਸਕੈਨਰ*: ਪੱਤੇ ਦੀ ਫੋਟੋ ਖਿੱਚੋ ਅਤੇ 1 ਸਕਿੰਟ ਵਿੱਚ ਪੱਕਾ ਇਲਾਜ ਪਾਓ।\n` +
      `3️⃣ *ਲਾਈਵ ਮਾਹਰ ਸਲਾਹਕਾਰ*: 4.9★ ਵੈਰੀਫਾਈਡ ਖੇਤੀ ਮਾਹਰਾਂ ਨਾਲ ਡਾਇਰੈਕਟ ਕਾਲ 'ਤੇ ਗੱਲ ਕਰੋ।\n` +
      `4️⃣ *ਸੈਟੇਲਾਈਟ ਖੇਤ ਨਿਗਰਾਨੀ*: ਘਰ ਬੈਠੇ ਆਪਣੇ ਖੇਤਾਂ ਦੀ ਹਰਿਆਲੀ (NDVI) ਦੇਖੋ।\n\n` +
      `📲 *ਅੱਜ ਹੀ FarmsKing ਐਪ ਡਾਊਨਲੋਡ ਕਰੋ ਅਤੇ ਮੁਫ਼ਤ ਸਲਾਹ ਲਓ!*`;

    const url = `whatsapp://send?text=${encodeURIComponent(promoText)}`;
    Linking.openURL(url).catch(() => {
      if (Platform.OS === 'web') alert(promoText);
    });
  };

  return (
    <View style={[styles.cardContainer, premiumShadow('#16a34a', 'sm')]}>
      {/* Top Banner Gradient Header */}
      <LinearGradient colors={['#14532d', '#15803d']} style={styles.gradientHeader}>
        <View style={styles.topBadgeRow}>
          <View style={styles.badgePill}>
            <Ionicons name="sparkles" size={12} color="#facc15" />
            <Text style={styles.badgeText}>
              {lang === 'pa' ? '📢 ਮੁਫ਼ਤ ਕਿਸਾਨ ਫ਼ਸਲ ਸਲਾਹ' : lang === 'hi' ? '📢 मुफ्त फसल सलाह सेवा' : '📢 Free Crop Advisory'}
            </Text>
          </View>

          {/* Lang Selector */}
          <View style={styles.langSelectorRow}>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'pa' && styles.langBtnActive]}
              onPress={() => {
                tap();
                setLang('pa');
              }}
            >
              <Text style={[styles.langBtnText, lang === 'pa' && styles.langBtnTextActive]}>ਪੰਜਾਬੀ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'hi' && styles.langBtnActive]}
              onPress={() => {
                tap();
                setLang('hi');
              }}
            >
              <Text style={[styles.langBtnText, lang === 'hi' && styles.langBtnTextActive]}>हिंदी</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langBtn, lang === 'en' && styles.langBtnActive]}
              onPress={() => {
                tap();
                setLang('en');
              }}
            >
              <Text style={[styles.langBtnText, lang === 'en' && styles.langBtnTextActive]}>ENG</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.promoTitle}>
          {lang === 'pa'
            ? '🌾 ਕਿਸਾਨ ਫ਼ਸਲ ਸਲਾਹ - ਸਹੀ ਸਮੇਂ ਬੀਜੋ, 2x-3x ਵੱਧ ਰੇਟ ਲਓ!'
            : lang === 'hi'
            ? '🌾 किसान फसल सलाह - सही समय बोएं, 2x-3x अधिक दाम पाएं!'
            : '🌾 Smart Crop Advisory - Sow Right, Earn 2x-3x Higher Price!'}
        </Text>

        <Text style={styles.promoSub}>
          {lang === 'pa'
            ? 'ਤਿਉਹਾਰੀ ਮੰਗ, ਸੈਟੇਲਾਈਟ ਖੇਤ ਰਿਪੋਰਟ ਅਤੇ ਏ.ਆਈ. ਬੀਮਾਰੀ ਸਕੈਨ ਨਾਲ ਬਣਾਓ ਆਪਣੀ ਖੇਤੀ ਨੂੰ ਲਾਹੇਵੰਦ।'
            : lang === 'hi'
            ? 'त्योहारों की मांग, सैटेलाइट रिपोर्ट और एआई बीमारी स्कैनर से खेती को बनाएं अधिक लाभदायक।'
            : 'Plan crops by festive demand, satellite health scans & AI disease diagnostics.'}
        </Text>
      </LinearGradient>

      {/* Feature Highlights Grid */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureRow}>
          <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="trending-up" size={18} color="#b45309" />
          </View>
          <View style={styles.featureTextGroup}>
            <Text style={styles.featureTitle}>
              {lang === 'pa' ? '📈 2x-3x ਮੰਡੀ ਰੇਟ ਸਲਾਹ' : lang === 'hi' ? '📈 2x-3x मंडी रेट सलाह' : '📈 2x-3x Mandi Rate Strategy'}
            </Text>

            <Text style={styles.featureSub}>
              {lang === 'pa'
                ? 'ਨਵਰਾਤਰੇ, ਦਿਵਾਲੀ, ਛੱਠ ਅਤੇ ਰਮਜ਼ਾਨ ਦੇ ਮਿਤੀਆਂ ਅਨੁਸਾਰ ਅਗੇਤੀ ਬੀਜਾਈ ਕਰਕੇ ਵੱਧ ਕਮਾਈ ਕਰੋ।'
                : lang === 'hi'
                ? 'नवरात्रि, दिवाली, छठ और रमजान की तारीखों के अनुसार अगेती बुवाई से अधिक कमाएं।'
                : 'Align sowing & harvest with high-demand festival dates for peak mandi rates.'}
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="scan" size={18} color="#15803d" />
          </View>

          <View style={styles.featureTextGroup}>
            <Text style={styles.featureTitle}>
              {lang === 'pa' ? '🔬 AI ਫ਼ਸਲ ਬੀਮਾਰੀ ਸਕੈਨਰ' : lang === 'hi' ? '🔬 AI बीमारी स्कैनर' : '🔬 Instant AI Disease Scan'}
            </Text>

            <Text style={styles.featureSub}>
              {lang === 'pa'
                ? 'ਖਰਾਬ ਪੱਤੇ ਦੀ ਫੋਟੋ ਅਪਲੋਡ ਕਰੋ ਅਤੇ 1 ਸਕਿੰਟ ਵਿੱਚ ਪੂਰੀ ਬੀਮਾਰੀ ਦਾ ਇਲਾਜ ਤੇ ਸਪਰੇਅ ਪਤਾ ਕਰੋ।'
                : lang === 'hi'
                ? 'खराब पत्ते की फोटो अपलोड करें और 1 सेकंड में बीमारी का सटीक इलाज पाएं।'
                : 'Snap leaf photo to get instant diagnostic analysis and spray guidance.'}
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="people" size={18} color="#0369a1" />
          </View>

          <View style={styles.featureTextGroup}>
            <Text style={styles.featureTitle}>
              {lang === 'pa' ? '🎙️ ਵੈਰੀਫਾਈਡ ਮਾਹਰਾਂ ਨਾਲ ਲਾਈਵ ਗੱਲਬਾਤ' : lang === 'hi' ? '🎙️ कृषि विशेषज्ञों से लाइव बातचीत' : '🎙️ Live 4.9★ Expert Consultation'}
            </Text>

            <Text style={styles.featureSub}>
              {lang === 'pa'
                ? '4.9★ ਰੇਟਿਡ ਖੇਤੀ ਮਾਹਰਾਂ ਨਾਲ ਡਾਇਰੈਕਟ ਗਰੁੱਪ ਵੋਇਸ ਕਾਲ ਵਿੱਚ ਜੁੜ ਕੇ ਸਵਾਲ ਪੁੱਛੋ।'
                : lang === 'hi'
                ? '4.9★ कृषि विशेषज्ञों से लाइव वॉइस कॉल पर सीधे सलाह और जवाब पाएं।'
                : 'Join live group voice calls with top certified agricultural experts.'}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Footer Buttons */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.shareBtn}
          activeOpacity={0.85}
          onPress={sharePromoWhatsApp}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
          <Text style={styles.shareBtnText}>
            {lang === 'pa' ? 'ਸ਼ੇਅਰ ਕਰੋ (WhatsApp)' : lang === 'hi' ? 'शेयर करें (WhatsApp)' : 'Share via WhatsApp'}
          </Text>
        </TouchableOpacity>

        {onOpenLiveCall ? (
          <TouchableOpacity
            style={styles.callBtn}
            activeOpacity={0.85}
            onPress={() => {
              tap();
              onOpenLiveCall();
            }}
          >
            <Ionicons name="call" size={15} color="#15803d" />
            <Text style={styles.callBtnText}>
              {lang === 'pa' ? 'ਮਾਹਰ ਨਾਲ ਕਾਲ ਕਰੋ' : lang === 'hi' ? 'विशेषज्ञ से कॉल करें' : 'Call Expert'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#86efac',
    marginBottom: 8,
  },
  gradientHeader: {
    padding: 14,
    gap: 8,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  badgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  langSelectorRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 2,
    borderRadius: RADIUS.pill,
  },
  langBtn: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  langBtnActive: {
    backgroundColor: '#ffffff',
  },
  langBtnText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: 'rgba(255,255,255,0.85)',
  },
  langBtnTextActive: {
    color: '#14532d',
  },
  promoTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    lineHeight: 19,
  },
  promoSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#bbf7d0',
    lineHeight: 15,
  },
  featuresContainer: {
    padding: 12,
    gap: 10,
    backgroundColor: '#f0fdf4',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  featureTextGroup: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  featureSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 1,
    lineHeight: 14,
  },
  actionsBar: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#dcfce7',
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  shareBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  callBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
});
