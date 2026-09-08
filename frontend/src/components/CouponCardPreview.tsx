import React, { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { Coupon } from '@/src/types/api';
import { couponHeadline, couponSubline } from '@/src/utils/couponTagline';
import { FONT, RADIUS } from '@/constants/theme';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { BillLogo } from '@/src/components/SaleBillPreview';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export function CouponCardPreview({ coupon }: { coupon: Coupon }) {
  const { data: settings } = useAppSettings();

  // Expiry date calculation
  const expiresDateStr = coupon.expiresAt
    ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Never Expires';

  return (
    <View style={cardStyles.cardContainer} collapsable={false}>
      <View style={cardStyles.card}>
        {/* Sleek Ticket Top Notches */}
        <View style={cardStyles.notchLeft} />
        <View style={cardStyles.notchRight} />

        {/* Gradient Header with Fixed FarmsKing Logo & MRP Badge */}
        <LinearGradient colors={['#059669', '#10b981', '#047857']} style={cardStyles.headerGradient}>
          <View style={cardStyles.brandRow}>
            <BillLogo />
            <View>
              <Text style={cardStyles.brandName}>{settings?.appName || 'FarmsKing'}</Text>
              <Text style={cardStyles.brandTagline}>{settings?.tagline || 'Smart Agriculture Platform'}</Text>
            </View>
          </View>
          <View style={cardStyles.mrpBadge}>
            <Text style={cardStyles.mrpText}>MRP: ₹{coupon.discountMaxCap || 500}</Text>
          </View>
        </LinearGradient>

        <View style={cardStyles.cardBody}>
          <Text style={cardStyles.title}>OFFICIAL DISCOUNT COUPON</Text>
          
          {/* Main Highlighted Benefit */}
          <Text style={cardStyles.headline}>{couponHeadline(coupon)}</Text>
          
          {/* Small Subscript Promo Tagline */}
          <Text style={cardStyles.promoSubscript}>*Up to ₹{coupon.discountMaxCap || 500} Off on Fertilizer & Seed Store Purchases</Text>

          {/* Dashed Stub Divider */}
          <View style={cardStyles.separatorRow}>
            <View style={cardStyles.dashedLine} />
          </View>

          {/* Code Box */}
          <View style={[cardStyles.codeBox, { backgroundColor: '#ecfdf5', borderColor: '#6ee7b7' }]}>
            <Text style={[cardStyles.codeLabel, { color: '#047857' }]}>REDEEM CODE</Text>
            <Text style={cardStyles.codeValue}>{coupon.code}</Text>
            <Text style={cardStyles.codeHint}>Apply in app during order checkout</Text>
          </View>

          {/* Validity & Terms */}
          <View style={cardStyles.validityBadge}>
            <Ionicons name="calendar-outline" size={11} color="#475569" />
            <Text style={cardStyles.validityText}>Valid Till: {expiresDateStr}</Text>
          </View>

          <Text style={cardStyles.terms}>*Terms & Conditions Apply · Official FarmsKing Pass · Non-Transferable</Text>
        </View>
      </View>
    </View>
  );
}

export function FarmerPlanCouponCardPreview({
  coupon,
}: {
  coupon: {
    code: string;
    plan: string;
    daysGranted: number;
    expiresAt?: string | Date | null;
    mrp?: number | string | null;
  };
}) {
  const { data: settings } = useAppSettings();

  // Dynamic MRP & Benefit Tagline Calculator based on Plan Tier & Days
  let mrpAmount = 299;
  let planBenefitTitle = `${coupon.plan} PLAN (${coupon.daysGranted} DAYS)`;
  let promoTagline = `*Up to ₹500 Extra Savings on Farm Advisory`;
  let gradientColors: [string, string, ...string[]] = ['#0f172a', '#1e293b'];
  let codeBoxBg = '#f0fdf4';
  let codeBoxBorder = '#86efac';
  let codeLabelColor = '#15803d';

  if (coupon.plan === 'PRO') {
    mrpAmount = coupon.daysGranted >= 365 ? 299 : 199;
    planBenefitTitle = `LITE PLAN (${coupon.daysGranted} DAYS)`;
    promoTagline = `*Up to ₹500 Savings on Ledger Logs & Voice AI Mic`;
    gradientColors = ['#3730a3', '#4f46e5', '#6366f1'];
    codeBoxBg = '#eep2ff';
    codeBoxBorder = '#c7d2fe';
    codeLabelColor = '#4338ca';
  } else if (coupon.plan === 'SMART') {
    mrpAmount = coupon.daysGranted >= 365 ? 3999 : 499;
    planBenefitTitle = `SMART PLAN (${coupon.daysGranted} DAYS)`;
    promoTagline = `*Up to ₹1,000 Savings on Satellite Crop Radar & Doctor`;
    gradientColors = ['#0369a1', '#0284c7', '#0369a1'];
    codeBoxBg = '#e0f2fe';
    codeBoxBorder = '#7dd3fc';
    codeLabelColor = '#0369a1';
  } else if (coupon.plan === 'SUPER') {
    mrpAmount = coupon.daysGranted >= 365 ? 6999 : 999;
    planBenefitTitle = `SUPER PLAN (${coupon.daysGranted} DAYS)`;
    promoTagline = `*Up to ₹2,500 Extra Savings on Mandi AI Predictions`;
    gradientColors = ['#92400e', '#d97706', '#b45309'];
    codeBoxBg = '#fffbe6';
    codeBoxBorder = '#fde047';
    codeLabelColor = '#b45309';
  }

  if (coupon.mrp && Number(coupon.mrp) > 0) {
    mrpAmount = Number(coupon.mrp);
  }

  const expiresDateStr = coupon.expiresAt
    ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Valid for 30 Days After Claim';

  return (
    <View style={cardStyles.cardContainer} collapsable={false}>
      <View style={cardStyles.card}>
        {/* Ticket Side Notches */}
        <View style={cardStyles.notchLeft} />
        <View style={cardStyles.notchRight} />

        {/* Header Gradient with Fixed Logo & MRP Badge */}
        <LinearGradient colors={gradientColors} style={cardStyles.headerGradient}>
          <View style={cardStyles.brandRow}>
            <BillLogo />
            <View>
              <Text style={cardStyles.brandName}>{settings?.appName || 'FarmsKing'}</Text>
              <Text style={cardStyles.brandTagline}>{settings?.tagline || 'Smart Agriculture Platform'}</Text>
            </View>
          </View>
          <View style={cardStyles.mrpBadge}>
            <Text style={cardStyles.mrpText}>MRP: ₹{mrpAmount.toLocaleString('en-IN')}</Text>
          </View>
        </LinearGradient>

        <View style={cardStyles.cardBody}>
          <Text style={cardStyles.title}>OFFICIAL PLAN VOUCHER</Text>
          
          {/* Main Benefit Highlighted in Big Bold Text */}
          <Text style={cardStyles.headline}>{planBenefitTitle}</Text>
          
          {/* Small "Upto..." Subscript Tagline as requested */}
          <Text style={cardStyles.promoSubscript}>{promoTagline}</Text>

          {/* Dashed Separator */}
          <View style={cardStyles.separatorRow}>
            <View style={cardStyles.dashedLine} />
          </View>

          {/* Code Box */}
          <View style={[cardStyles.codeBox, { backgroundColor: codeBoxBg, borderColor: codeBoxBorder }]}>
            <Text style={[cardStyles.codeLabel, { color: codeLabelColor }]}>REDEEM CODE</Text>
            <Text style={cardStyles.codeValue}>{coupon.code}</Text>
            <Text style={cardStyles.codeHint}>Redeem in app under "Get Plan Coupon"</Text>
          </View>

          {/* Validity Date */}
          <View style={cardStyles.validityBadge}>
            <Ionicons name="calendar-outline" size={11} color="#475569" />
            <Text style={cardStyles.validityText}>Valid Till: {expiresDateStr}</Text>
          </View>

          {/* Terms & Conditions Notice */}
          <Text style={cardStyles.terms}>*Terms & Conditions Apply · Valid for 1 Farmer Account · Official Pass</Text>
        </View>
      </View>
    </View>
  );
}

export function useShareCouponAsJpg() {
  const cardShotRef = useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareCouponAsJpg = async (fileName?: string) => {
    if (!cardShotRef.current) return;
    tap();
    setIsSharing(true);
    try {
      const uri = await captureRef(cardShotRef, { format: 'jpg', quality: 0.95 });
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `${fileName || 'coupon'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: 'Discount Coupon' });
      }
    } catch {
      Alert.alert('Not Shared', 'Could not generate the coupon image. Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return { cardShotRef, isSharing, shareCouponAsJpg };
}

const cardStyles = StyleSheet.create({
  cardContainer: {
    width: 340,
    backgroundColor: 'transparent',
    padding: 4,
  },
  card: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  notchLeft: {
    position: 'absolute',
    left: -12,
    top: 155,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    zIndex: 10,
  },
  notchRight: {
    position: 'absolute',
    right: -12,
    top: 155,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    zIndex: 10,
  },
  headerGradient: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 16, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.2 },
  brandTagline: { fontSize: 9.5, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.85)', marginTop: 1 },
  mrpBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  mrpText: { fontSize: 12, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.5 },
  cardBody: {
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 14,
    alignItems: 'center',
  },
  title: { fontSize: 10.5, fontFamily: FONT.extraBold, color: '#64748b', letterSpacing: 1.5, textTransform: 'uppercase' },
  headline: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6, textAlign: 'center', letterSpacing: -0.3 },
  promoSubscript: { fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a', marginTop: 4, textAlign: 'center', fontStyle: 'italic' },
  separatorRow: {
    width: '100%',
    marginVertical: 14,
    alignItems: 'center',
  },
  dashedLine: {
    width: '100%',
    height: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
  },
  codeBox: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    paddingHorizontal: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  codeLabel: { fontSize: 9.5, fontFamily: FONT.extraBold, letterSpacing: 1.5 },
  codeValue: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: 2, marginTop: 2 },
  codeHint: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  validityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginTop: 12,
  },
  validityText: { fontSize: 10, fontFamily: FONT.bold, color: '#334155' },
  terms: { fontSize: 8.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 10, textAlign: 'center' },
});
