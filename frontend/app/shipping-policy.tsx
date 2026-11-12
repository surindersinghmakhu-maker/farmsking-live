import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { FONT } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';

export default function ShippingPolicyScreen() {
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
    }
  }, []);

  const toggleTheme = (mode: 'day' | 'night') => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmsking_theme_mode', mode);
    }
  };

  const isDay = themeMode === 'day';

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      <Stack.Screen options={{ headerShown: false, title: 'Shipping & Delivery Policy • FarmsKing' }} />
      <PublicHeader themeMode={themeMode} onThemeToggle={toggleTheme} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={16} color={isDay ? '#059669' : '#34d399'} />
            <Text style={[styles.backText, isDay ? styles.backTextDay : styles.backTextNight]}>
              Back to FarmsKing
            </Text>
          </TouchableOpacity>

          <View style={[styles.heroCard, isDay ? styles.heroCardDay : styles.heroCardNight]}>
            <View style={styles.badgeRow}>
              <View style={[styles.govBadge, isDay ? styles.govBadgeDay : styles.govBadgeNight]}>
                <Ionicons name="cube-outline" size={14} color={isDay ? '#059669' : '#00ff87'} />
                <Text style={[styles.govBadgeText, isDay ? styles.govBadgeTextDay : styles.govBadgeTextNight]}>
                  PAN-INDIA AGRI LOGISTICS PROTOCOL
                </Text>
              </View>
            </View>
            <Text style={[styles.heroTitle, isDay ? styles.heroTitleDay : styles.heroTitleNight]}>
              Shipping & Delivery Policy
            </Text>
            <Text style={[styles.heroSubtitle, isDay ? styles.heroSubtitleDay : styles.heroSubtitleNight]}>
              Dispatch Slas, Courier Partners, Delivery Windows & Packaging Standards for Certified Agri Inputs
            </Text>
            <Text style={[styles.effectiveDate, isDay ? styles.effectiveDateDay : styles.effectiveDateNight]}>
              FARMSKING TECHNOLOGIES PRIVATE LIMITED • CIN: U01100PB2026PTC063294 • Pan-India Fulfillment
            </Text>
          </View>

          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
              1. Order Dispatch & Processing Window
            </Text>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              • All verified orders placed before 2:00 PM IST on working days (Monday to Saturday) are packed and dispatched within 24 to 48 business hours.{'\n'}
              • Orders placed on Sundays or National Holidays are processed on the next working day.{'\n'}
              • Verified marketplace sellers dispatch consignments directly from their registered pickup warehouses under tamper-evident FarmsKing quality seals.
            </Text>
          </View>

          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
              2. Estimated Delivery Timelines & Courier Partners
            </Text>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              • <Text style={{ fontFamily: FONT.bold }}>Punjab, Haryana, Himachal & North India:</Text> 2 to 5 business days.{'\n'}
              • <Text style={{ fontFamily: FONT.bold }}>Rest of India (Metro & Tier 2/3 Villages):</Text> 4 to 7 business days via Shiprocket, Delhivery, BlueDart, Xpressbees, Ecom Express, or India Post Speed Parcel for remote pin codes.{'\n'}
              • Live AWB tracking links are sent automatically via SMS, WhatsApp, and your in-app Orders tab once shipped.
            </Text>
          </View>

          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
              3. Shipping Charges, Free Delivery & Bulk Inputs (COD Rules)
            </Text>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              • <Text style={{ fontFamily: FONT.bold }}>Standard Orders:</Text> Free delivery applies on eligible cart totals above ₹499 (otherwise ₹40–₹90 depending on weight/zone shown cleanly at checkout before payment).{'\n'}
              • <Text style={{ fontFamily: FONT.bold }}>Heavy Fertilizers & Restricted Liquid Sprays (25 kg+):</Text> Heavy agricultural consignments require prepaid online checkout (Cashfree, Razorpay, PhonePe, or UPI) to prevent transit return losses.
            </Text>
          </View>

          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
              4. Undelivered / RTO & Damaged-in-Transit Claims
            </Text>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              • Ensure your village/tehsil address, postal PIN code, and active mobile number are accurate at checkout. Three delivery attempts are made before Return-to-Origin (RTO).{'\n'}
              • For damaged, leaking, or wrong consignments, please record a clear unboxing photo/video within 24 hours of delivery via "My Orders" or call our support helpline for instant replacement or full refund.
            </Text>
          </View>

          <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
            <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
              5. Logistics Support & Registered Fulfillment Desk
            </Text>
            <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
              Entity: FARMSKING TECHNOLOGIES PRIVATE LIMITED (CIN: U01100PB2026PTC063294){'\n'}
              Registered Office: VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422{'\n'}
              Operational HQ: Main Market, Makhu, Tehsil Zira, Ferozepur, Punjab - 142044{'\n'}
              Support Email: support@farmsking.in • Logistics Helpline: +91 95776-22000 (Mon–Sat, 10 AM – 6 PM IST)
            </Text>
          </View>

          <TouchableOpacity style={styles.homeBtn} onPress={() => router.push('/')} activeOpacity={0.85}>
            <LinearGradient
              colors={isDay ? ['#059669', '#047857'] : ['#10b981', '#059669']}
              style={styles.homeBtnInner}
            >
              <Ionicons name="home" size={17} color="#ffffff" />
              <Text style={styles.homeBtnText}>Return to FarmsKing Homepage</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootDay: { backgroundColor: '#f8fafc' },
  rootNight: { backgroundColor: '#040a17' },
  scrollContent: { paddingTop: 84, paddingBottom: 60 },
  scrollContentMobile: { paddingTop: 68, paddingBottom: 80 },
  container: { width: '92%', maxWidth: 960, alignSelf: 'center', gap: 18 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
  backText: { fontSize: 13, fontFamily: FONT.bold },
  backTextDay: { color: '#059669' },
  backTextNight: { color: '#34d399' },
  heroCard: { borderRadius: 20, padding: 24, borderWidth: 1, gap: 10 },
  heroCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  heroCardNight: { backgroundColor: '#0c1322', borderColor: 'rgba(16,185,129,0.22)' },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  govBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  govBadgeDay: { backgroundColor: '#ecfdf5' },
  govBadgeNight: { backgroundColor: 'rgba(16,185,129,0.14)' },
  govBadgeText: { fontSize: 10, fontFamily: FONT.extraBold, letterSpacing: 0.6 },
  govBadgeTextDay: { color: '#047857' },
  govBadgeTextNight: { color: '#34d399' },
  heroTitle: { fontSize: 26, fontFamily: FONT.extraBold },
  heroTitleDay: { color: '#0f172a' },
  heroTitleNight: { color: '#f8fafc' },
  heroSubtitle: { fontSize: 14, fontFamily: FONT.medium },
  heroSubtitleDay: { color: '#475569' },
  heroSubtitleNight: { color: '#94a3b8' },
  effectiveDate: { fontSize: 11.5, fontFamily: FONT.bold },
  effectiveDateDay: { color: '#059669' },
  effectiveDateNight: { color: '#10b981' },
  sectionCard: { borderRadius: 16, padding: 20, borderWidth: 1, gap: 8 },
  sectionCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  sectionCardNight: { backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.08)' },
  cardTitle: { fontSize: 16, fontFamily: FONT.extraBold },
  cardTitleDay: { color: '#0f172a' },
  cardTitleNight: { color: '#f8fafc' },
  bodyText: { fontSize: 13.5, fontFamily: FONT.regular, lineHeight: 21 },
  bodyTextDay: { color: '#334155' },
  bodyTextNight: { color: '#cbd5e1' },
  homeBtn: { borderRadius: 14, overflow: 'hidden', alignSelf: 'center', marginTop: 8 },
  homeBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 13 },
  homeBtnText: { color: '#ffffff', fontSize: 14, fontFamily: FONT.extraBold },
});

