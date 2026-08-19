import React, { useRef, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, View } from 'react-native';
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
  return (
    <View style={cardStyles.card} collapsable={false}>
      <View style={cardStyles.brandRow}>
        <BillLogo />
        <Text style={cardStyles.brand}>{settings?.appName || 'FarmsKing'}</Text>
      </View>

      <Text style={cardStyles.title}>Discount Coupon</Text>
      <Text style={cardStyles.headline}>{couponHeadline(coupon)}*</Text>
      {couponSubline(coupon) ? <Text style={cardStyles.subline}>{couponSubline(coupon)}</Text> : null}

      <View style={cardStyles.codeBox}>
        <Text style={cardStyles.codeLabel}>USE CODE</Text>
        <Text style={cardStyles.codeValue}>{coupon.code}</Text>
      </View>

      <Text style={cardStyles.terms}>*Terms & Conditions apply</Text>
    </View>
  );
}

export function FarmerPlanCouponCardPreview({ coupon }: { coupon: { code: string; plan: string; daysGranted: number } }) {
  const { data: settings } = useAppSettings();
  return (
    <View style={cardStyles.card} collapsable={false}>
      <View style={cardStyles.brandRow}>
        <BillLogo />
        <Text style={cardStyles.brand}>{settings?.appName || 'FarmsKing'}</Text>
      </View>

      <Text style={cardStyles.title}>Farmer Plan Coupon</Text>
      <Text style={cardStyles.headline}>{coupon.daysGranted} Days FREE*</Text>
      <Text style={cardStyles.subline}>{coupon.plan} Plan</Text>

      <View style={cardStyles.codeBox}>
        <Text style={cardStyles.codeLabel}>USE CODE</Text>
        <Text style={cardStyles.codeValue}>{coupon.code}</Text>
      </View>

      <Text style={cardStyles.terms}>*Terms & Conditions apply</Text>
    </View>
  );
}

export function useShareCouponAsJpg() {
  const cardShotRef = useRef<ViewShot>(null);
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
  card: {
    width: 320,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 24,
    alignItems: 'center',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 18 },
  brand: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  title: { fontSize: 14, fontFamily: FONT.bold, color: '#64748b', letterSpacing: 0.4, textTransform: 'uppercase' },
  headline: { fontSize: 40, fontFamily: FONT.extraBold, color: '#16a34a', marginTop: 6, letterSpacing: -0.5 },
  subline: { fontSize: 13, fontFamily: FONT.semiBold, color: '#64748b', marginTop: 2 },
  codeBox: {
    marginTop: 20,
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderStyle: 'dashed',
    paddingHorizontal: 22,
    paddingVertical: 12,
    alignItems: 'center',
  },
  codeLabel: { fontSize: 10, fontFamily: FONT.bold, color: '#16a34a', letterSpacing: 1 },
  codeValue: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: 1.5, marginTop: 2 },
  terms: { fontSize: 9.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 20 },
});
