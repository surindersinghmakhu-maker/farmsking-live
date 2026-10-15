import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';

export default function RefundPolicyScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('farmsking_theme_mode');
      if (savedTheme === 'night' || savedTheme === 'day') {
        setThemeMode(savedTheme);
      }
      const handleStorage = () => {
        const t = localStorage.getItem('farmsking_theme_mode');
        if (t === 'night' || t === 'day') setThemeMode(t);
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const toggleTheme = (mode: 'day' | 'night') => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmsking_theme_mode', mode);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const isDay = themeMode === 'day';

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      <Stack.Screen options={{ headerShown: false, title: 'Refund & Return Policy • FarmsKing' }} />

      {/* Unified Public Floating Header */}
      <PublicHeader themeMode={themeMode} onThemeToggle={toggleTheme} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Top Breadcrumb */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={16} color={isDay ? '#059669' : '#34d399'} />
            <Text style={[styles.backText, isDay ? styles.backTextDay : styles.backTextNight]}>
              Back to FarmsKing
            </Text>
          </TouchableOpacity>

          {/* Hero Banner */}
          <View style={[styles.heroCard, isDay ? styles.heroCardDay : styles.heroCardNight]}>
            <View style={styles.badgeRow}>
              <View style={[styles.govBadge, isDay ? styles.govBadgeDay : styles.govBadgeNight]}>
                <Ionicons name="receipt-outline" size={14} color={isDay ? '#059669' : '#00ff87'} />
                <Text style={[styles.govBadgeText, isDay ? styles.govBadgeTextDay : styles.govBadgeTextNight]}>
                  CONSUMER PROTECTION (E-COMMERCE) RULES 2020
                </Text>
              </View>
              <View style={[styles.statuteBadge, isDay ? styles.statuteBadgeDay : styles.statuteBadgeNight]}>
                <Text style={[styles.statuteBadgeText, isDay ? styles.statuteBadgeTextDay : styles.statuteBadgeTextNight]}>
                  FAIR RETURN COMMITMENT
                </Text>
              </View>
            </View>

            <Text style={[styles.heroTitle, isDay ? styles.heroTitleDay : styles.heroTitleNight]}>
              Refund, Return & Cancellation Policy
            </Text>
            <Text style={[styles.heroSubtitle, isDay ? styles.heroSubtitleDay : styles.heroSubtitleNight]}>
              Transparent, Farmer-First Guidelines for Certified Seeds, Bio-Nutrients, and Equipment Purchases
            </Text>
            <Text style={[styles.effectiveDate, isDay ? styles.effectiveDateDay : styles.effectiveDateNight]}>
              FarmsKing India Private Limited • Customer Trust Desk • 100% Genuine Agri Guarantee
            </Text>
          </View>

          {/* Trust Metric Strip */}
          <View style={styles.trustGrid}>
            <View style={[styles.trustBox, isDay ? styles.trustBoxDay : styles.trustBoxNight]}>
              <Ionicons name="time-outline" size={22} color={isDay ? '#059669' : '#34d399'} />
              <Text style={[styles.trustNum, isDay ? styles.trustNumDay : styles.trustNumNight]}>7 Days</Text>
              <Text style={[styles.trustLabel, isDay ? styles.trustLabelDay : styles.trustLabelNight]}>Hassle-Free Replacement</Text>
            </View>

            <View style={[styles.trustBox, isDay ? styles.trustBoxDay : styles.trustBoxNight]}>
              <Ionicons name="wallet-outline" size={22} color={isDay ? '#0284c7' : '#38bdf8'} />
              <Text style={[styles.trustNum, isDay ? styles.trustNumDay : styles.trustNumNight]}>Instant</Text>
              <Text style={[styles.trustLabel, isDay ? styles.trustLabelDay : styles.trustLabelNight]}>FarmsKing Wallet Credit</Text>
            </View>

            <View style={[styles.trustBox, isDay ? styles.trustBoxDay : styles.trustBoxNight]}>
              <Ionicons name="shield-checkmark-outline" size={22} color={isDay ? '#d97706' : '#fbbf24'} />
              <Text style={[styles.trustNum, isDay ? styles.trustNumDay : styles.trustNumNight]}>100%</Text>
              <Text style={[styles.trustLabel, isDay ? styles.trustLabelDay : styles.trustLabelNight]}>Manufacturer Sealed Goods</Text>
            </View>
          </View>

          {/* Section 1: Order Cancellation Windows */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                <Ionicons name="close-circle-outline" size={18} color={isDay ? '#059669' : '#34d399'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                1. Order Cancellation Windows
              </Text>
            </View>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  <Text style={{ fontFamily: FONT.bold }}>Pre-Dispatch Cancellations: </Text>
                  You can cancel any marketplace order free of charge before it is dispatched from the seller's hub or regional fulfillment warehouse. A 100% refund is credited immediately to your original payment method or FarmsKing Wallet.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  <Text style={{ fontFamily: FONT.bold }}>Post-Dispatch Consignments: </Text>
                  If the consignment is already in transit via Shiprocket/Delhivery/Bluedart courier partners, you may refuse delivery at your doorstep. Standard return transit charges may apply if declined without defect grounds.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 2: Returns & Replacements */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(2,132,199,0.1)' : 'rgba(56,189,248,0.15)' }]}>
                <Ionicons name="refresh-circle-outline" size={18} color={isDay ? '#0284c7' : '#38bdf8'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                2. 7-Day Hassle-Free Returns & Replacements
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              Cultivators, farmers, and garden owners are eligible for a replacement or full refund within 7 days of verified delivery under any of the following circumstances:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>✓</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  Transit damage, broken manufacturer container seals, or leaking chemical/nutrient bottles.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>✓</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  Incorrect item variant received, net weight discrepancy, or expired manufacturing batch date.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>✓</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  Defective agricultural equipment, malfunctioning battery sprayers, or non-functional solar implements.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 3: Certified Seed & Perishable Exclusions */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)' }]}>
                <Ionicons name="alert-circle-outline" size={18} color={isDay ? '#d97706' : '#fbbf24'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                3. Perishable & Certified Seed Exclusions
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              To protect biosecurity and prevent counterfeit seed re-circulation:
            </Text>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              Certified hybrid seed packets, inoculated live bio-fertilizers, and live nursery saplings cannot be returned once the manufacturer seal is broken or tampered with, unless verifiable germination defect certification is documented.
            </Text>
          </View>

          {/* Section 4: Refund Timelines */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(16,185,129,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                <Ionicons name="card-outline" size={18} color={isDay ? '#059669' : '#34d399'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                4. Refund Processing Timelines
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              Once the returned consignment arrives at our regional quality verification center:
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  <Text style={{ fontFamily: FONT.bold }}>FarmsKing Wallet Credit: </Text>
                  Instant (within 15 minutes) — 100% usable on any marketplace purchase with zero deductions.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  <Text style={{ fontFamily: FONT.bold }}>UPI & Bank Transfers: </Text>
                  2 to 4 business days credited directly to your original bank account or UPI ID.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  <Text style={{ fontFamily: FONT.bold }}>Cash on Delivery (COD) Orders: </Text>
                  Refunded via direct NEFT / IMPS or UPI transfer upon providing your beneficiary details.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 5: Support Desk */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(99,102,241,0.1)' : 'rgba(129,140,248,0.15)' }]}>
                <Ionicons name="headset-outline" size={18} color={isDay ? '#4f46e5' : '#818cf8'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                5. Need Assistance with an Order Return?
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              Our dedicated Farmer Support Desk is available 7 days a week:
            </Text>
            <View style={[styles.officerBox, isDay ? styles.officerBoxDay : styles.officerBoxNight]}>
              <Text style={[styles.officerDetail, isDay ? styles.officerDetailDay : styles.officerDetailNight]}>
                📞 Farmer Helpline: 95776-22000 (6:00 AM – 10:00 PM IST)
              </Text>
              <Text style={[styles.officerDetail, isDay ? styles.officerDetailDay : styles.officerDetailNight]}>
                ✉️ Support Email: farmskingindia@gmail.com / orders@farmsking.in
              </Text>
              <Text style={[styles.officerDetail, isDay ? styles.officerDetailDay : styles.officerDetailNight]}>
                📍 Fulfillment Center: Makhu, District Ferozepur, Punjab - 142044
              </Text>
            </View>
          </View>

          {/* Bottom Back Button */}
          <View style={styles.bottomCtaRow}>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.push('/')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isDay ? ['#059669', '#047857'] : ['#10b981', '#059669']}
                style={styles.homeBtnInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="home" size={17} color="#ffffff" />
                <Text style={styles.homeBtnText}>Return to FarmsKing Homepage</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootDay: {
    backgroundColor: '#f8fafc',
  },
  rootNight: {
    backgroundColor: '#040a17',
  },
  scrollContent: {
    paddingTop: 84,
    paddingBottom: 60,
  },
  scrollContentMobile: {
    paddingTop: 68,
    paddingBottom: 80,
  },
  container: {
    width: '92%',
    maxWidth: 960,
    alignSelf: 'center',
    gap: 18,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  backTextDay: {
    color: '#059669',
  },
  backTextNight: {
    color: '#34d399',
  },
  heroCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    gap: 10,
  },
  heroCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.06)', 'md'),
  },
  heroCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...premiumShadow('rgba(0,0,0,0.4)', 'md'),
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  govBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  govBadgeDay: {
    backgroundColor: 'rgba(5,150,105,0.1)',
  },
  govBadgeNight: {
    backgroundColor: 'rgba(0,255,135,0.12)',
  },
  govBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.6,
  },
  govBadgeTextDay: {
    color: '#059669',
  },
  govBadgeTextNight: {
    color: '#34d399',
  },
  statuteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
  },
  statuteBadgeDay: {
    backgroundColor: '#f1f5f9',
  },
  statuteBadgeNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statuteBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  statuteBadgeTextDay: {
    color: '#64748b',
  },
  statuteBadgeTextNight: {
    color: '#94a3b8',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    lineHeight: 30,
  },
  heroTitleDay: {
    color: '#0f172a',
  },
  heroTitleNight: {
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FONT.medium,
    lineHeight: 19,
  },
  heroSubtitleDay: {
    color: '#475569',
  },
  heroSubtitleNight: {
    color: '#94a3b8',
  },
  effectiveDate: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
  },
  effectiveDateDay: {
    color: '#059669',
  },
  effectiveDateNight: {
    color: '#6ee7b7',
  },

  // Trust Strip
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  trustBox: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    gap: 4,
  },
  trustBoxDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.04)', 'sm'),
  },
  trustBoxNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...premiumShadow('rgba(0,0,0,0.25)', 'sm'),
  },
  trustNum: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    marginTop: 4,
  },
  trustNumDay: {
    color: '#0f172a',
  },
  trustNumNight: {
    color: '#f8fafc',
  },
  trustLabel: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    textAlign: 'center',
  },
  trustLabelDay: {
    color: '#64748b',
  },
  trustLabelNight: {
    color: '#94a3b8',
  },

  sectionCard: {
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    gap: 12,
  },
  sectionCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.04)', 'sm'),
  },
  sectionCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...premiumShadow('rgba(0,0,0,0.3)', 'sm'),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    flex: 1,
  },
  cardTitleDay: {
    color: '#0f172a',
  },
  cardTitleNight: {
    color: '#f8fafc',
  },
  bodyText: {
    fontSize: 13.5,
    fontFamily: FONT.regular,
    lineHeight: 21,
  },
  bodyTextDay: {
    color: '#334155',
  },
  bodyTextNight: {
    color: '#cbd5e1',
  },
  bulletList: {
    gap: 8,
    marginTop: 4,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletDot: {
    fontSize: 14,
    fontFamily: FONT.bold,
    lineHeight: 20,
  },
  bulletDotDay: {
    color: '#059669',
  },
  bulletDotNight: {
    color: '#34d399',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.regular,
    lineHeight: 20,
  },
  bulletTextDay: {
    color: '#475569',
  },
  bulletTextNight: {
    color: '#94a3b8',
  },
  officerBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: 4,
  },
  officerBoxDay: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  officerBoxNight: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  officerDetail: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    lineHeight: 18,
  },
  officerDetailDay: {
    color: '#166534',
  },
  officerDetailNight: {
    color: '#a7f3d0',
  },
  bottomCtaRow: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  homeBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  homeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  homeBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
});
