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

export default function TermsOfServiceScreen() {
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
      <Stack.Screen options={{ headerShown: false, title: 'Terms of Service • FarmsKing' }} />

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
                <Ionicons name="shield-checkmark" size={14} color={isDay ? '#059669' : '#00ff87'} />
                <Text style={[styles.govBadgeText, isDay ? styles.govBadgeTextDay : styles.govBadgeTextNight]}>
                  COMPANIES ACT 2013 & IT ACT 2000 COMPLIANT
                </Text>
              </View>
              <View style={[styles.statuteBadge, isDay ? styles.statuteBadgeDay : styles.statuteBadgeNight]}>
                <Text style={[styles.statuteBadgeText, isDay ? styles.statuteBadgeTextDay : styles.statuteBadgeTextNight]}>
                  LEGAL FRAMEWORK
                </Text>
              </View>
            </View>

            <Text style={[styles.heroTitle, isDay ? styles.heroTitleDay : styles.heroTitleNight]}>
              FarmsKing Terms of Service
            </Text>
            <Text style={[styles.heroSubtitle, isDay ? styles.heroSubtitleDay : styles.heroSubtitleNight]}>
              Official Legal Agreement for Cultivators, Agronomists, Store Vendors, and Platform Members
            </Text>
            <Text style={[styles.effectiveDate, isDay ? styles.effectiveDateDay : styles.effectiveDateNight]}>
              Last Updated: October 2026 • FarmsKing India Private Limited • Registered in Punjab, India
            </Text>
          </View>

          {/* Section 1: Entity & Acceptance */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                <Ionicons name="business-outline" size={18} color={isDay ? '#059669' : '#34d399'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                1. Corporate Identity & Acceptance
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              These Terms of Service ("Terms") govern your access to and use of the FarmsKing digital platform, mobile applications, APMC mandi price telemetry, AI Crop Doctor tools, and e-commerce services operated by <Text style={{ fontFamily: FONT.bold, color: isDay ? '#059669' : '#34d399' }}>FarmsKing India Private Limited</Text> (incorporated under the Companies Act, 2013, Ministry of Corporate Affairs, Government of India).
            </Text>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              By downloading, registering, browsing, or placing orders on farmsking.in or associated mobile apps, you enter into a legally binding contract in accordance with the Information Technology Act, 2000 and applicable digital commerce regulations.
            </Text>
          </View>

          {/* Section 2: APMC Mandi Telemetry */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(2,132,199,0.1)' : 'rgba(56,189,248,0.15)' }]}>
                <Ionicons name="trending-up" size={18} color={isDay ? '#0284c7' : '#38bdf8'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                2. Mandi Price Telemetry & Market Intelligence
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              FarmsKing aggregates agricultural commodity price data, historical trends, and market arrival insights from regulated Agricultural Produce Market Committees (APMCs) across Punjab, Haryana, Rajasthan, and throughout India.
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  <Text style={{ fontFamily: FONT.bold }}>Advisory Nature: </Text>
                  Rates displayed represent recent verified mandi transactions and platform records. Physical trade settlements follow respective State APMC Acts.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  <Text style={{ fontFamily: FONT.bold }}>No Unregulated Speculation: </Text>
                  FarmsKing operates exclusively for physical trade discovery and transparent farmer connectivity without speculative commodity pooling.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 3: AI Crop Doctor & Agronomy Advice */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)' }]}>
                <Ionicons name="medkit-outline" size={18} color={isDay ? '#d97706' : '#fbbf24'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                3. AI Crop Doctor & Agronomic Advisory
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              Our AI image diagnostics and certified agronomist consultations provide scientific recommendations benchmarked against Indian Council of Agricultural Research (ICAR) protocols and State Agricultural University standards.
            </Text>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              Because soil micro-climates, water salinity, and application timing vary per farm, cultivators must follow manufacturer label instructions and adhere strictly to statutory pre-harvest intervals (PHI).
            </Text>
          </View>

          {/* Section 4: Agri Store Marketplace */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(16,185,129,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                <Ionicons name="storefront-outline" size={18} color={isDay ? '#059669' : '#34d399'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                4. Agri Store, Marketplace & Product Compliance
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              All hybrid seeds, bio-fertilizers, soluble nutrients, spray equipment, and organic inputs on FarmsKing Agri Store adhere to the Seeds Act (1966), Fertilizer Control Order (1985), and Insecticides Act (1968).
            </Text>
            <View style={styles.bulletList}>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  Vendors are vetted for verified business registrations, GST compliance, and trade licenses.
                </Text>
              </View>
              <View style={styles.bulletItem}>
                <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                  Original branded inputs are sealed by manufacturers and accompanied by GST tax invoices.
                </Text>
              </View>
            </View>
          </View>

          {/* Section 5: Data Privacy & Security */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(99,102,241,0.1)' : 'rgba(129,140,248,0.15)' }]}>
                <Ionicons name="lock-closed-outline" size={18} color={isDay ? '#4f46e5' : '#818cf8'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                5. Data Protection & Plot Telemetry
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              Under the Digital Personal Data Protection Act (DPDPA), 2023, your personal credentials, farm GPS boundaries, financial ledgers, and transaction records remain strictly confidential. We never monetize cultivator crop data to third-party data brokers.
            </Text>
          </View>

          {/* Section 6: Grievance Desk */}
          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <View style={styles.cardHeaderRow}>
              <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                <Ionicons name="person-outline" size={18} color={isDay ? '#059669' : '#34d399'} />
              </View>
              <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                6. Statutory Grievance Redressal Desk
              </Text>
            </View>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              In compliance with the Information Technology Rules, 2021 and Consumer Protection (E-Commerce) Rules, 2020:
            </Text>
            <View style={[styles.officerBox, isDay ? styles.officerBoxDay : styles.officerBoxNight]}>
              <Text style={[styles.officerName, isDay ? styles.officerNameDay : styles.officerNameNight]}>
                Surinder Singh
              </Text>
              <Text style={[styles.officerRole, isDay ? styles.officerRoleDay : styles.officerRoleNight]}>
                Grievance Officer • Legal & Agronomy Operations Desk
              </Text>
              <Text style={[styles.officerDetail, isDay ? styles.officerDetailDay : styles.officerDetailNight]}>
                Email: farmskingindia@gmail.com / grievance@farmsking.in
              </Text>
              <Text style={[styles.officerDetail, isDay ? styles.officerDetailDay : styles.officerDetailNight]}>
                Helpline: 95776-22000 (Farmer Support Desk • 6:00 AM – 10:00 PM IST)
              </Text>
              <Text style={[styles.officerDetail, isDay ? styles.officerDetailDay : styles.officerDetailNight]}>
                Registered Office: Makhu, District Ferozepur, Punjab - 142044 • Jurisdiction: Courts of Punjab, India
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
  officerName: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
  },
  officerNameDay: {
    color: '#166534',
  },
  officerNameNight: {
    color: '#34d399',
  },
  officerRole: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
  },
  officerRoleDay: {
    color: '#15803d',
  },
  officerRoleNight: {
    color: '#a7f3d0',
  },
  officerDetail: {
    fontSize: 12,
    fontFamily: FONT.regular,
    lineHeight: 18,
  },
  officerDetailDay: {
    color: '#334155',
  },
  officerDetailNight: {
    color: '#cbd5e1',
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
