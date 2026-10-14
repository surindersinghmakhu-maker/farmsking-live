import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

export default function TermsOfServiceScreen() {
  const router = useRouter();
  const { colors } = useExecutiveTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <Stack.Screen options={{ headerShown: false, title: 'Terms of Service • FarmsKing' }} />

      {/* Header Bar */}
      <View style={[styles.headerBar, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.titleColor }]}>Terms of Service</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner */}
        <LinearGradient
          colors={colors.headerGradient}
          style={styles.heroBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.badgeRow}>
            <Ionicons name="shield-checkmark" size={14} color="#00ff87" />
            <Text style={styles.badgeText}>COMPANIES ACT, 2013 & IT ACT, 2000 COMPLIANT</Text>
          </View>
          <Text style={styles.heroTitle}>FarmsKing Terms of Service</Text>
          <Text style={styles.heroSubtitle}>
            Official Legal Agreement for Cultivators, Agronomists, Store Vendors, and Platform Members
          </Text>
          <Text style={styles.effectiveDate}>Last Updated: October 2026 • FarmsKing India Private Limited</Text>
        </LinearGradient>

        {/* Section 1: Entity & Agreement */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>1. Corporate Identity & Acceptance</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            These Terms of Service ("Terms") govern your access to and use of the FarmsKing digital platform, mobile applications, APMC mandi price telemetry, AI Crop Doctor tools, and e-commerce services operated by <Text style={{ color: colors.primary, fontFamily: FONT.bold }}>FarmsKing India Private Limited</Text> (incorporated under the Companies Act, 2013, Ministry of Corporate Affairs, Government of India).
          </Text>
          <Text style={[styles.bodyText, { color: colors.textMuted, marginTop: 10 }]}>
            By downloading, registering, accessing, or placing orders on farmsking.in or related applications, you enter into a legally binding agreement in accordance with the Information Technology Act, 2000 and applicable digital commerce rules.
          </Text>
        </View>

        {/* Section 2: APMC Mandi Price Intelligence */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>2. Mandi Price Telemetry & Market Intelligence</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            FarmsKing provides agricultural commodity price aggregation, historical price graphs, and arrival estimates from regulated Agricultural Produce Market Committees (APMCs) across Punjab, Haryana, Rajasthan, and wider India.
          </Text>
          <View style={styles.bulletBox}>
            <Text style={[styles.bulletItem, { color: colors.textMuted }]}>
              • <Text style={{ fontFamily: FONT.bold, color: colors.text }}>Advisory Nature:</Text> Commodity rates displayed on the platform represent recent market trade entries and verified platform transactions. Official mandi bidding and physical trade settlements are conducted in accordance with the respective State APMC Acts.
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textMuted, marginTop: 8 }]}>
              • <Text style={{ fontFamily: FONT.bold, color: colors.text }}>No Financial Speculation:</Text> FarmsKing does not operate unregulated futures or illegal commodity pools. All platform trade connectivity is designed for transparent physical price discovery.
            </Text>
          </View>
        </View>

        {/* Section 3: AI Crop Doctor & Agronomy Advice */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>3. AI Crop Doctor & Diagnostic Advisory</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            Our AI-powered image diagnostics and tele-consultations with certified agronomists provide scientific advisory guidelines based on agronomic standards published by the Indian Council of Agricultural Research (ICAR) and State Agricultural Universities.
          </Text>
          <Text style={[styles.bodyText, { color: colors.textMuted, marginTop: 10 }]}>
            Because local micro-climates, soil pH, irrigation salinity, and sprayer calibration affect crop response, cultivators must follow manufacturer chemical label directions and adhere to standard safety waiting periods (pre-harvest intervals).
          </Text>
        </View>

        {/* Section 4: Certified Agri Store Marketplace */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>4. Agri Store, Vendor Marketplace & Product Compliance</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            All hybrid seeds, bio-fertilizers, water-soluble nutrients, spray equipment, and organic inputs available on FarmsKing Agri Store comply with the Seeds Act (1966), Fertilizer (Control) Order (1985), and Insecticides Act (1968).
          </Text>
          <View style={styles.bulletBox}>
            <Text style={[styles.bulletItem, { color: colors.textMuted }]}>
              • All registered vendors and sellers undergo identity verification and license auditing.
            </Text>
            <Text style={[styles.bulletItem, { color: colors.textMuted, marginTop: 6 }]}>
              • Genuine branded inputs are shipped with manufacturer batch seals and GST invoices.
            </Text>
          </View>
        </View>

        {/* Section 5: Data Privacy & Security */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>5. Data Protection & Plot Telemetry</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            Under the Digital Personal Data Protection Act (DPDPA), 2023, your personal data, GPS plot boundaries, farm ledgers, and transactions remain strictly protected. We do not sell or monetize cultivator crop data to speculative third parties.
          </Text>
        </View>

        {/* Section 6: Grievance Redressal */}
        <View style={[styles.legalCard, { backgroundColor: colors.cardBg, borderColor: colors.borderColor }]}>
          <Text style={[styles.sectionHeading, { color: colors.titleColor }]}>6. Statutory Grievance Redressal Officer</Text>
          <Text style={[styles.bodyText, { color: colors.textMuted }]}>
            In compliance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021 and Consumer Protection (E-Commerce) Rules, 2020:
          </Text>
          <View style={[styles.officerBox, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
            <Text style={[styles.officerTitle, { color: colors.primary }]}>Grievance Officer: Surinder Singh</Text>
            <Text style={[styles.officerDetail, { color: colors.text }]}>Designation: Legal & Agronomy Operations Desk</Text>
            <Text style={[styles.officerDetail, { color: colors.text }]}>E-mail: farmskingindia@gmail.com / grievance@farmsking.in</Text>
            <Text style={[styles.officerDetail, { color: colors.text }]}>Farmer Helpline: 95776-220000 (6:00 AM – 10:00 PM IST)</Text>
            <Text style={[styles.officerDetail, { color: colors.text }]}>Jurisdiction: Courts of Punjab, India</Text>
          </View>
        </View>

        {/* Back to Home Button */}
        <TouchableOpacity
          style={[styles.returnButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/')}
          activeOpacity={0.85}
        >
          <Ionicons name="home" size={18} color="#020d06" />
          <Text style={styles.returnButtonText}>Return to FarmsKing Home</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 6,
  },
  backText: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 60,
    maxWidth: 860,
    alignSelf: 'center',
    width: '100%',
  },
  heroBanner: {
    borderRadius: RADIUS.lg,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 20,
    marginBottom: 8,
  },
  effectiveDate: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  legalCard: {
    borderRadius: RADIUS.md,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.2,
  },
  sectionHeading: {
    fontSize: 16,
    fontFamily: FONT.bold,
    marginBottom: 10,
  },
  bodyText: {
    fontSize: 13,
    fontFamily: FONT.regular,
    lineHeight: 21,
  },
  bulletBox: {
    marginTop: 10,
    paddingLeft: 6,
  },
  bulletItem: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    lineHeight: 19,
  },
  officerBox: {
    marginTop: 12,
    borderRadius: RADIUS.sm,
    padding: 14,
    borderWidth: 1,
    gap: 4,
  },
  officerTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    marginBottom: 4,
  },
  officerDetail: {
    fontSize: 12,
    fontFamily: FONT.medium,
    lineHeight: 18,
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: RADIUS.pill,
    marginTop: 16,
    marginBottom: 20,
  },
  returnButtonText: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#020d06',
  },
});
