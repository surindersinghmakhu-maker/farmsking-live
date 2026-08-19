import React, { useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { RoleHeader } from './RoleHeader';
import { MarketRatesCard } from '@/src/components/MarketRatesCard';
import { WeatherCard } from '@/src/components/WeatherCard';
import { FarmerPlanUpgradeModal } from '@/src/components/FarmerPlanUpgradeModal';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerPlan, useFarmerPlanPricing, PLAN_META, usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon } from '@/src/hooks/useFarmerPlan';
import { formatInr } from '@/src/utils/formatInr';
import { useReminderAlertOnLoad } from '@/src/hooks/useNotifications';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const FarmerDashboardView: React.FC = () => {
  const theme = RoleThemes.FARMER;
  const router = useRouter();
  const { user } = useAuth();
  const { plan, meta, startDate, endDate, isExpired, inGrace, daysUntilExpiry } = useFarmerPlan();
  const { data: pricing } = useFarmerPlanPricing();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  useReminderAlertOnLoad(true);

  // Formatted apply/expiry dates + full amount for paid plans
  const formattedApplyDate = startDate
    ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const formattedExpiry = endDate
    ? new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const planPrice = pricing?.find((p) => p.plan === plan)?.price;

  const planActionLabel = 'Upgrade';

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="FARMER"
        profileName={user?.name || 'Balwinder Singh'}
        subtitle="Farmer"
        avatarUrl={user?.photoUrl || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
        planBadge={
          <View>
            <View style={styles.planRow}>
              <View style={styles.planBadge}>
                <View style={[styles.planDot, { backgroundColor: meta.color }]} />
                <Text style={styles.planBadgeText} numberOfLines={1}>
                  {meta.emoji} {meta.label}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.planActionBtn}
                activeOpacity={0.85}
                onPress={() => {
                  tap();
                  setIsPlanModalOpen(true);
                }}
              >
                <Text style={styles.planActionBtnText} numberOfLines={1}>{planActionLabel}</Text>
                <Ionicons name="chevron-forward" size={12} color="#166534" />
              </TouchableOpacity>
            </View>
            {plan !== 'FREE' && !isExpired && daysUntilExpiry !== null ? (
              <Text style={styles.planDaysLeftText}>
                {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'} left{formattedExpiry ? ` · Till ${formattedExpiry}` : ''}
              </Text>
            ) : null}
            {plan !== 'FREE' && planPrice ? (
              <Text style={styles.planDaysLeftText}>
                {formatInr(Number(planPrice))}{formattedApplyDate ? ` · Applied: ${formattedApplyDate}` : ''}
              </Text>
            ) : null}
          </View>
        }
      />

      <FarmerPlanUpgradeModal visible={isPlanModalOpen} onClose={() => setIsPlanModalOpen(false)} tiers={['BASIC']} />

      <View style={styles.content}>
        {/* Weather report */}
        <WeatherCard />

        {/* Your Crop Prices LIVE */}
        <MarketRatesCard />

        {/* Farm Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, premiumShadow('#000000', 'sm')]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              router.push('/farm');
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="leaf" size={22} color="#16a34a" />
            </View>
            <Text style={styles.actionCardTitle}>My Active Crops</Text>
            <Text style={styles.actionCardSub}>3 Crop Plots</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, premiumShadow('#000000', 'sm')]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              router.push('/records');
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="document-text" size={22} color="#d97706" />
            </View>
            <Text style={styles.actionCardTitle}>Sales & Expenses</Text>
            <Text style={styles.actionCardSub}>Log Records</Text>
          </TouchableOpacity>
        </View>

        {/* Basic Plan coupon redeem */}
        <RedeemBasicPlanCouponCard />
      </View>
    </ScrollView>
  );
};

/** Farmer home only ever self-activates the BASIC (record-keeping) tier — Standard/Premium always go through an advisor. */
function RedeemBasicPlanCouponCard() {
  const preview = usePreviewFarmerPlanCoupon();
  const redeem = useRedeemFarmerPlanCoupon();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>> | null>(null);

  const isPending = preview.isPending || redeem.isPending;

  const handleRedeem = async () => {
    setError(null);
    setSuccess(null);
    if (!code.trim()) {
      setError('Enter a coupon code.');
      return;
    }
    const trimmedCode = code.trim().toUpperCase();
    try {
      const previewResult = await preview.mutateAsync({ code: trimmedCode });
      if (previewResult.plan !== 'BASIC') {
        setError('Only Basic Plan coupons can be applied here. Standard/Premium codes go through your advisor.');
        return;
      }
      const res = await redeem.mutateAsync({ code: trimmedCode });
      setSuccess(res);
      setCode('');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not redeem this code.');
    }
  };

  return (
    <View style={[couponStyles.card, premiumShadow('#000000', 'sm')]}>
      <Text style={couponStyles.title}>Have a Basic Plan code?</Text>
      <Text style={couponStyles.sub}>Redeem it here to activate/extend your BASIC plan days.</Text>
      <View style={couponStyles.row}>
        <TextInput
          style={couponStyles.input}
          placeholder="e.g. B-XXXXXX"
          placeholderTextColor="#94a3b8"
          autoCapitalize="characters"
          value={code}
          onChangeText={setCode}
        />
        <TouchableOpacity style={couponStyles.btn} disabled={isPending} onPress={handleRedeem}>
          {isPending ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={couponStyles.btnText}>Redeem</Text>}
        </TouchableOpacity>
      </View>
      {error ? <Text style={couponStyles.error}>{error}</Text> : null}
      {success ? (
        <Text style={couponStyles.successText}>
          +{success.daysGranted} day(s) added. New expiry: {new Date(success.newEndDate).toLocaleDateString('en-IN')}
        </Text>
      ) : null}
    </View>
  );
}

const couponStyles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 6,
  },
  title: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  sub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  row: { flexDirection: 'row', gap: 8, marginTop: 6 },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  btn: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  error: { color: '#dc2626', fontSize: 12, fontFamily: FONT.medium, marginTop: 4 },
  successText: { color: '#16a34a', fontSize: 12, fontFamily: FONT.semiBold, marginTop: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingTop: 6, gap: SPACING.sm, paddingBottom: 24 },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionCardTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  actionCardSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  // Plan badge styles — frosted-glass pills so they read cleanly against the gradient header, in any theme.
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  planDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  planBadgeText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  planExpirySep: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  planExpiryText: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: 'rgba(255,255,255,0.9)',
  },
  planExpiryTextExpired: {
    color: '#fecaca',
  },
  planDaysLeftText: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  planActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 3,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
    ...premiumShadow('#000000', 'sm'),
  },
  planActionBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#166534',
  },
});
