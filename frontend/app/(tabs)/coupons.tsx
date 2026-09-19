import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { CopyButton } from '@/src/components/CopyButton';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface OfferCoupon {
  id: string;
  code: string;
  title: string;
  description: string;
  discountBadge: string;
  validUntil: string;
  category: 'FARMER_PLAN' | 'CROP_CARE' | 'GENERAL';
  bgColor: string;
}

const ACTIVE_OFFER_COUPONS: OfferCoupon[] = [
  {
    id: '1',
    code: 'FARMS2026',
    title: '20% OFF Farmer Pro VIP Plan',
    description: 'Get 20% instant discount on 1-Year Pro VIP Farmer Software membership.',
    discountBadge: '20% OFF',
    validUntil: '31 Dec 2026',
    category: 'FARMER_PLAN',
    bgColor: '#ecfdf5',
  },
  {
    id: '2',
    code: 'DOCTOR100',
    title: '₹100 OFF Doctor Crop Care Plan',
    description: 'Get flat ₹100 OFF on 5-Crop or 10-Crop Specialist Doctor Advisory Care.',
    discountBadge: '₹100 OFF',
    validUntil: '15 Nov 2026',
    category: 'CROP_CARE',
    bgColor: '#e0f2fe',
  },
  {
    id: '3',
    code: 'VIPFARMER',
    title: '30 Days Free Pro VIP Access',
    description: 'Unlock 30 extra days of Pro VIP Plan features & Satellite NDVI Field Maps.',
    discountBadge: '30 DAYS FREE',
    validUntil: '30 Oct 2026',
    category: 'FARMER_PLAN',
    bgColor: '#f3e8ff',
  },
  {
    id: '4',
    code: 'EARLYBIRD',
    title: '15% OFF Early Bird Bonus',
    description: 'Special early bird signup bonus discount for all new registered farmers.',
    discountBadge: '15% OFF',
    validUntil: '31 Dec 2026',
    category: 'GENERAL',
    bgColor: '#fffbe6',
  },
];

export default function CouponsScreen() {
  const router = useRouter();
  const [inputCode, setInputCode] = useState('');
  const [redemptionStatus, setRedemptionStatus] = useState<{
    type: 'SUCCESS' | 'ERROR' | null;
    message: string;
  }>({ type: null, message: '' });

  const handleRedeemCode = () => {
    if (!inputCode.trim()) {
      setRedemptionStatus({ type: 'ERROR', message: '⚠️ Please enter a coupon or promo key.' });
      return;
    }
    tap();
    const cleanCode = inputCode.trim().toUpperCase();
    const matched = ACTIVE_OFFER_COUPONS.find((c) => c.code === cleanCode);

    if (matched) {
      setRedemptionStatus({
        type: 'SUCCESS',
        message: `🎉 Coupon "${matched.code}" Activated! ${matched.title} is now ready for your next checkout.`,
      });
    } else {
      setRedemptionStatus({
        type: 'ERROR',
        message: `❌ Coupon code "${cleanCode}" is invalid or expired. Please check and try again.`,
      });
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Header */}
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>🎟️ Coupon System</Text>
            <Text style={styles.heroSubtitle}>Redeem Promo Keys & Browse Offer Discounts</Text>
          </View>
        </View>

        {/* Highlight Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>4 Active</Text>
            <Text style={styles.statLbl}>Available Coupons</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>Up to 20%</Text>
            <Text style={styles.statLbl}>Max Discount</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>Instant</Text>
            <Text style={styles.statLbl}>1-Tap Activation</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Promo Code Input Card */}
        <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
          <Text style={styles.cardTitle}>🔑 Redeem Promo Key / Coupon Code</Text>
          <Text style={styles.cardSub}>Enter your partner invite code or promo key below:</Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="ENTER CODE (e.g. FARMS2026)"
              placeholderTextColor="#94a3b8"
              value={inputCode}
              onChangeText={setInputCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity style={styles.submitBtn} onPress={handleRedeemCode}>
              <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
              <Text style={styles.submitBtnText}>Redeem</Text>
            </TouchableOpacity>
          </View>

          {redemptionStatus.type ? (
            <View
              style={[
                styles.statusBox,
                { backgroundColor: redemptionStatus.type === 'SUCCESS' ? '#ecfdf5' : '#fef2f2' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: redemptionStatus.type === 'SUCCESS' ? '#047857' : '#dc2626' },
                ]}
              >
                {redemptionStatus.message}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Section 2: Active Offer Coupons List */}
        <Text style={styles.sectionHeaderTitle}>AVAILABLE DISCOUNT OFFERS & COUPONS</Text>

        {ACTIVE_OFFER_COUPONS.map((coupon) => (
          <View
            key={coupon.id}
            style={[
              styles.offerCard,
              { backgroundColor: coupon.bgColor, borderColor: '#e2e8f0' },
              premiumShadow('#000000', 'sm'),
            ]}
          >
            <View style={styles.offerCardHeader}>
              <View style={styles.codeBadge}>
                <Ionicons name="pricetag" size={14} color="#0f172a" />
                <Text style={styles.codeBadgeText}>{coupon.code}</Text>
              </View>

              <View style={styles.discountPill}>
                <Text style={styles.discountPillText}>{coupon.discountBadge}</Text>
              </View>
            </View>

            <Text style={styles.offerTitle}>{coupon.title}</Text>
            <Text style={styles.offerDesc}>{coupon.description}</Text>

            <View style={styles.offerFooter}>
              <Text style={styles.validText}>📅 Valid until: {coupon.validUntil}</Text>
              <CopyButton value={coupon.code} />
            </View>
          </View>
        ))}

        {/* Section 3: Navigation to Memberships */}
        <TouchableOpacity
          style={styles.membershipBanner}
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/memberships')}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>👑 Ready to Use Your Coupon?</Text>
            <Text style={styles.bannerSub}>Apply discount coupons on Farmer Software & Crop Care Memberships now.</Text>
          </View>
          <View style={styles.bannerArrow}>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#ffffff' },
  heroSubtitle: { fontSize: 11.5, fontFamily: FONT.medium, color: '#cbd5e1', marginTop: 1 },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', paddingVertical: 10, paddingHorizontal: 12, borderRadius: RADIUS.lg, marginTop: 4 },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  statLbl: { fontSize: 10, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.2)' },
  scrollContent: { padding: 14, paddingBottom: 32, gap: 14 },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  cardSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: { flex: 1, height: 44, backgroundColor: '#f1f5f9', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  submitBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#10b981', paddingHorizontal: 16, height: 44, borderRadius: RADIUS.md },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  statusBox: { marginTop: 10, padding: 10, borderRadius: RADIUS.md },
  statusText: { fontSize: 12, fontFamily: FONT.bold },
  sectionHeaderTitle: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b', letterSpacing: 0.5, marginTop: 4 },
  offerCard: { borderRadius: RADIUS.xl, padding: 14, borderWidth: 1 },
  offerCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  codeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#cbd5e1' },
  codeBadgeText: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  discountPill: { backgroundColor: '#0f172a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  discountPillText: { fontSize: 10.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  offerTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  offerDesc: { fontSize: 12, fontFamily: FONT.medium, color: '#475569', marginTop: 2 },
  offerFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' },
  validText: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  membershipBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0f172a', borderRadius: RADIUS.lg, padding: 14, marginTop: 6 },
  bannerTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  bannerSub: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  bannerArrow: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
});
