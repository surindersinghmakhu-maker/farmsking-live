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
      `🌾 *FarmsKing Crop Advisory Service* 🌾\n\n` +
      `Want to get 2x to 3x higher mandi prices for your crops?\n\n` +
      `🔥 *Key Features:*\n` +
      `1️⃣ *Festival Demand & Sowing Timing*: Timely sowing advice based on Navratri, Diwali, Chhath, and Ramadan.\n` +
      `2️⃣ *AI Disease Scanner*: Take a leaf photo and get instant diagnostic advice.\n` +
      `3️⃣ *Live Doctor Consultation*: Direct phone/voice consultation with verified crop experts.\n` +
      `4️⃣ *Satellite Field Monitoring*: Monitor crop health (NDVI heatmaps) remotely.\n\n` +
      `📲 *Download FarmsKing App today for free crop advisory!*`;

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
            <Text style={styles.badgeText}>📢 Free Crop Advisory</Text>
          </View>
        </View>

        <Text style={styles.promoTitle}>
          🌾 Smart Crop Advisory - Sow Right, Earn 2x-3x Higher Price!
        </Text>

        <Text style={styles.promoSub}>
          Plan crops by festive demand, satellite health scans & AI disease diagnostics.
        </Text>
      </LinearGradient>

      {/* Feature Highlights Grid */}
      <View style={styles.featuresContainer}>
        <View style={styles.featureRow}>
          <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="trending-up" size={18} color="#b45309" />
          </View>
          <View style={styles.featureTextGroup}>
            <Text style={styles.featureTitle}>📈 2x-3x Mandi Rate Strategy</Text>

            <Text style={styles.featureSub}>
              Align sowing & harvest with high-demand festival dates for peak mandi rates.
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="scan" size={18} color="#15803d" />
          </View>

          <View style={styles.featureTextGroup}>
            <Text style={styles.featureTitle}>🔬 Instant AI Disease Scan</Text>

            <Text style={styles.featureSub}>
              Snap leaf photo to get instant diagnostic analysis and spray guidance.
            </Text>
          </View>
        </View>

        <View style={styles.featureRow}>
          <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
            <Ionicons name="people" size={18} color="#0369a1" />
          </View>

          <View style={styles.featureTextGroup}>
            <Text style={styles.featureTitle}>🎙️ Live Expert Consultation</Text>

            <Text style={styles.featureSub}>
              Join live group voice calls with top certified agricultural experts.
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
