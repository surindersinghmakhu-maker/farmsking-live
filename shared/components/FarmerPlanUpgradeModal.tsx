import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerPlan, useFarmerPlanPricing, usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon, useActivateTrial } from '@/src/hooks/useFarmerPlan';
import { ENABLE_COUPON_SYSTEM } from '@/src/constants/featureFlags';
import { useInitiateFarmerPlanPayment } from '@/src/hooks/useFarmerPlanPayments';
import { useAvailableAdvisors, useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import type { FarmerPlanType, FarmerPlanPricing } from '@/src/api/farmerPlans.api';

const theme = RoleThemes.FARMER;

const PLAN_RANK: Record<FarmerPlanType, number> = {
  FREE: 0,
  BASIC: 0,
  PRO: 1,
  SILVER: 1,
  SMART: 2,
  GOLD: 2,
  VIP: 3,
  SUPER: 3,
  ROYAL: 3,
  PLATINUM: 3,
  DIAMOND: 4,
};

const PLAN_COLUMN_META: Record<FarmerPlanType, { label: string; emoji: string; color: string; price: string }> = {
  FREE: { label: 'Free Plan', emoji: '🌱', color: '#166534', price: '₹0' },
  PRO: { label: 'Kisan Plan', emoji: '🌾', color: '#0284c7', price: '₹199/yr' },
  SMART: { label: 'Boss Plan', emoji: '👷', color: '#1d4ed8', price: '₹499/yr' },
  VIP: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
  BASIC: { label: 'Free Plan', emoji: '🌱', color: '#166534', price: '₹0' },
  SUPER: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
  PLATINUM: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
  DIAMOND: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
  SILVER: { label: 'Kisan Plan', emoji: '🌾', color: '#0284c7', price: '₹199/yr' },
  GOLD: { label: 'Boss Plan', emoji: '👷', color: '#1d4ed8', price: '₹499/yr' },
  ROYAL: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
};

interface PlanRow {
  label: string;
  values: Partial<Record<FarmerPlanType, string>>;
}

const PLAN_ROWS: PlanRow[] = [
  { label: 'Bookkeeping Logs', values: { FREE: 'Basic', PRO: '✓ All', SMART: '✓ All', VIP: '✓ All' } },
  { label: 'Total Crop Cycles', values: { FREE: 'Max 3', PRO: 'Unlimited', SMART: 'Unlimited', VIP: 'Unlimited' } },
  { label: 'Crop History', values: { FREE: 'Summary', PRO: 'Full', SMART: 'Full', VIP: 'Full' } },
  { label: 'Weather Report', values: { FREE: '✓', PRO: '✓', SMART: '✓', VIP: '✓' } },
  { label: 'Labour Record', values: { FREE: '—', PRO: '—', SMART: '✓ Included', VIP: '✓ Included' } },
  { label: 'Worker Login', values: { FREE: '—', PRO: '—', SMART: '✓ Enabled', VIP: '✓ Enabled' } },
  { label: 'Dedicated Farm Advisor', values: { FREE: '—', PRO: '—', SMART: '—', VIP: '✓ Included' } },
  { label: 'Advisor Chat', values: { FREE: '—', PRO: '—', SMART: '—', VIP: '✓ Enabled' } },
  { label: 'Advisor Call Request', values: { FREE: '—', PRO: '—', SMART: '—', VIP: '✓ Enabled' } },
  { label: 'Mandi AI Predictions', values: { FREE: '—', PRO: '—', SMART: '—', VIP: '✓ Included' } },
];

function PlanComparisonChart({
  plans,
  currentPlan,
  isExpired,
  inGrace,
  pricingList = [],
  onPickPlan,
  maxFreeCrops = 3,
}: {
  plans: FarmerPlanType[];
  currentPlan: FarmerPlanType;
  isExpired: boolean;
  inGrace: boolean;
  pricingList?: FarmerPlanPricing[];
  onPickPlan: (plan: FarmerPlanType) => void;
  maxFreeCrops?: number;
}) {
  const dynamicRows = PLAN_ROWS.map((r) => {
    if (r.label === 'Total Crop Cycles') {
      return { ...r, values: { ...r.values, FREE: `Max ${maxFreeCrops}` } };
    }
    return r;
  });

  return (
    <View style={chartStyles.tableContainer}>
      <View style={chartStyles.headerRow}>
        <View style={[chartStyles.cell, chartStyles.labelCellHeader]}>
          <Text style={chartStyles.headerTitle}>Features</Text>
        </View>
        {plans.map((p) => {
          const colMeta = PLAN_COLUMN_META[p] ?? { label: `${p} Plan`, emoji: '👑', color: '#b45309', price: '₹0' };
          const activeVariants = (pricingList ?? []).filter((it) => it.plan === p && it.isActive !== false);
          const displayPrice = p === 'FREE' ? '₹0' : activeVariants[0]
            ? `₹${activeVariants[0].price}/${Number(activeVariants[0].billingPeriodDays) === 365 ? 'yr' : `${activeVariants[0].billingPeriodDays}d`}`
            : colMeta.price;

          return (
            <View key={p} style={[chartStyles.cell, chartStyles.headerPlanCell]}>
              <Text style={[chartStyles.headEmojiText]}>{colMeta.emoji}</Text>
              <Text style={[chartStyles.headText, { color: colMeta.color }]}>
                {colMeta.label}
              </Text>
              <Text style={chartStyles.headPriceText}>{displayPrice}</Text>
            </View>
          );
        })}
      </View>

      {dynamicRows.map((row, idx) => (
        <View key={row.label} style={[chartStyles.row, idx % 2 === 1 && chartStyles.zebraRow]}>
          <View style={[chartStyles.cell, chartStyles.labelCell]}>
            <Text style={chartStyles.labelText} numberOfLines={2}>{row.label}</Text>
          </View>
          {plans.map((p) => {
            const val = row.values[p] ?? '—';
            const isCheck = val.includes('✓');
            const isDash = val === '—';
            return (
              <View key={p} style={chartStyles.cell}>
                <Text
                  style={[
                    chartStyles.valueText,
                    isCheck && { color: '#15803d', fontFamily: FONT.bold },
                    isDash && { color: '#94a3b8' },
                  ]}
                  numberOfLines={1}
                >
                  {val}
                </Text>
              </View>
            );
          })}
        </View>
      ))}

      <View style={chartStyles.actionRow}>
        <View style={[chartStyles.cell, chartStyles.labelCell]} />
        {plans.map((p) => {
          const isCurrent = p === currentPlan && currentPlan !== 'FREE';
          return (
            <View key={p} style={chartStyles.cell}>
              {p === 'FREE' ? (
                <TouchableOpacity
                  style={[chartStyles.planBtn, { backgroundColor: '#166534' }]}
                  onPress={() => onPickPlan('FREE')}
                >
                  <Text style={chartStyles.planBtnText}>Trial</Text>
                </TouchableOpacity>
              ) : isCurrent ? (
                <TouchableOpacity
                  style={[chartStyles.planBtn, { backgroundColor: PLAN_COLUMN_META[p].color }]}
                  onPress={() => onPickPlan(p)}
                >
                  <Text style={chartStyles.planBtnText}>Renew</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[chartStyles.planBtn, { backgroundColor: PLAN_COLUMN_META[p].color }]}
                  onPress={() => onPickPlan(p)}
                >
                  <Text style={chartStyles.planBtnText}>Select</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const chartStyles = StyleSheet.create({
  tableContainer: {
    width: '100%',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    marginVertical: 4,
    ...premiumShadow('#0f172a', 'sm'),
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
    paddingVertical: 6,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    alignItems: 'center',
    paddingVertical: 7,
  },
  zebraRow: {
    backgroundColor: '#f8fafc',
  },
  actionRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
  },
  cell: {
    flex: 1,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelCellHeader: {
    flex: 1.35,
    paddingLeft: 8,
    alignItems: 'flex-start',
  },
  headerPlanCell: {
    alignItems: 'center',
    gap: 1,
  },
  headerTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  headEmojiText: {
    fontSize: 14,
  },
  headText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  headPriceText: {
    fontSize: 9.5,
    fontFamily: FONT.semiBold,
    color: '#64748b',
  },
  labelCell: {
    flex: 1.35,
    paddingLeft: 8,
    alignItems: 'flex-start',
  },
  labelText: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#334155',
    lineHeight: 13,
  },
  valueText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#1e293b',
    textAlign: 'center',
  },
  planBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    width: '90%',
    alignItems: 'center',
  },
  planBtnText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: FONT.bold,
  },
});

export function FarmerPlanUpgradeModal({
  visible,
  onClose,
  tiers = ['PRO', 'SMART', 'SUPER'],
  initialMode = 'GET_COUPON',
}: {
  visible: boolean;
  onClose: () => void;
  tiers?: FarmerPlanType[];
  initialMode?: 'GET_COUPON' | 'REDEEM_CODE';
}) {
  const { plan: currentPlan, isExpired, inGrace, hasUsedTrial } = useFarmerPlan();
  const { data: rawPricing } = useFarmerPlanPricing();
  const { data: settings } = useAppSettings();
  const freeTrialDays = settings?.freeTrialDays ?? 10;
  const freeTrialPlan = settings?.freeTrialPlan || 'Super VIP';
  const pricingList = Array.isArray(rawPricing) ? rawPricing : (rawPricing as any)?.items || (rawPricing as any)?.data || [];
  const isTrialEligible = !hasUsedTrial && currentPlan === 'FREE';

  const plans: FarmerPlanType[] = ['FREE', ...tiers];
  const preview = usePreviewFarmerPlanCoupon();
  const redeem = useRedeemFarmerPlanCoupon();
  const activateTrial = useActivateTrial();
  const initiate = useInitiateFarmerPlanPayment();
  const { data: myAdvisor } = useMyAdvisor();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>> | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [showCouponInput, setShowCouponInput] = useState(initialMode === 'REDEEM_CODE');
  const [pickedPlan, setPickedPlan] = useState<FarmerPlanType>('PRO');
  const [selectedDaysMap, setSelectedDaysMap] = useState<Record<string, number>>({});
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const codeInputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (visible) {
      setError(null);
      setShowCouponInput(initialMode === 'REDEEM_CODE');
      if (currentPlan && currentPlan !== 'FREE' && tiers.includes(currentPlan)) {
        setPickedPlan(currentPlan);
      } else {
        setPickedPlan('PRO');
      }
    }
  }, [visible, initialMode, currentPlan]);

  const needsAdvisorPick = !!previewResult?.includesAdvisor && !myAdvisor;
  const { data: availableAdvisors, isLoading: isLoadingAvailableAdvisors } = useAvailableAdvisors(needsAdvisorPick);

  const reset = () => {
    setCode('');
    setError(null);
    setPreviewResult(null);
    setResult(null);
    setShowChart(false);
    setShowCouponInput(false);
    setSelectedAdvisorId(null);
    setIsPaying(false);
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  const handlePickPlan = async (plan: FarmerPlanType) => {
    if (plan === 'FREE') {
      try {
        await activateTrial.mutateAsync();
        const msg = '🎉 Trial Activated successfully!';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Trial Activated', msg);
        closeAndReset();
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Trial already active or used.';
        if (Platform.OS === 'web') alert(`Notice: ${msg}`);
        else Alert.alert('Notice', msg);
        closeAndReset();
      }
      return;
    }

    setPickedPlan(plan);
    const activeVariants = pricingList.filter((it: FarmerPlanPricing) => it.plan === plan && it.isActive !== false);
    if (activeVariants.length > 0 && !selectedDaysMap[plan]) {
      setSelectedDaysMap((prev) => ({ ...prev, [plan]: Number(activeVariants[0].billingPeriodDays) }));
    }
    setShowChart(false);
  };

  const handleProceedToGatewayPayment = async () => {
    if (pickedPlan === 'FREE') {
      handlePickPlan('FREE');
      return;
    }
    setError(null);
    setIsPaying(true);
    try {
      const activeVariants = pricingList
        .filter((it: FarmerPlanPricing) => it.plan === pickedPlan && it.isActive !== false)
        .sort((a: FarmerPlanPricing, b: FarmerPlanPricing) => Number(a.billingPeriodDays) - Number(b.billingPeriodDays));
      const days = selectedDaysMap[pickedPlan] || activeVariants[0]?.billingPeriodDays || 365;

      const res: any = await initiate.mutateAsync({
        targetPlan: pickedPlan,
        billingPeriodDays: Number(days),
      });

      if (res?.cashfreeSessionId) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = `https://payments.cashfree.com/order/#${res.cashfreeSessionId}`;
        } else {
          await Linking.openURL(`https://payments.cashfree.com/order/#${res.cashfreeSessionId}`);
        }
      } else if (res?.cashfreeSubscriptionLink) {
        await Linking.openURL(res.cashfreeSubscriptionLink);
      } else if (res?.razorpayShortUrl) {
        await Linking.openURL(res.razorpayShortUrl);
      } else if (res?.upiLink) {
        await Linking.openURL(res.upiLink);
      } else {
        setError('Payment gateway link generated. Please check your screen.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not initiate payment gateway.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCheckCode = async () => {
    if (!code.trim()) {
      setError('Enter your plan coupon code.');
      return;
    }
    setError(null);
    try {
      const res = await preview.mutateAsync({ code: code.trim().toUpperCase() });
      setPreviewResult(res);
    } catch (err: any) {
      setPreviewResult(null);
      setError(err?.response?.data?.message ?? 'Invalid or already-used code.');
    }
  };

  const handleConfirmCoupon = async () => {
    setError(null);
    try {
      const res = await redeem.mutateAsync({
        code: code.trim().toUpperCase(),
        advisorId: selectedAdvisorId ?? undefined,
      });
      setResult(res);
    } catch (err: any) {
      setPreviewResult(null);
      setError(err?.response?.data?.message ?? 'Invalid or already-used code.');
    }
  };

  const planOptions = [
    { id: 'PRO', key: 'PRO' as FarmerPlanType, label: '🌾 Kisan Plan', iconName: 'flash', color: '#0284c7', sub: 'Bookkeeping & Expense Logs + Voice AI Mic 🧾' },
    { id: 'SMART', key: 'SMART' as FarmerPlanType, label: '👷 Boss Plan', iconName: 'sparkles', color: '#1d4ed8', sub: 'All Bookkeeping + Labour Record & Worker Login 👥' },
    { id: 'SUPER', key: 'SUPER' as FarmerPlanType, label: '👑 Farmer VIP Plan', iconName: 'shield-checkmark', color: '#b45309', sub: 'Unlimited Crops, Mandi AI & Supervisor Delegation 🛡️' },
    ...(isTrialEligible ? [{ id: 'FREE', key: 'FREE' as FarmerPlanType, label: '🌱 Free Plan Trial 🎁', iconName: 'leaf', color: '#166534', sub: `Full ${freeTrialPlan} Plan Access (${freeTrialDays}-Day Free Demo Trial) 🎁` }] : []),
  ];

  const currentPickedVariants = pricingList
    .filter((it: FarmerPlanPricing) => it.plan === pickedPlan && it.isActive !== false)
    .sort((a: FarmerPlanPricing, b: FarmerPlanPricing) => Number(a.billingPeriodDays) - Number(b.billingPeriodDays));
  const currentPickedDays = selectedDaysMap[pickedPlan];
  const activePricingVariant = (currentPickedDays != null
    ? currentPickedVariants.find((v: FarmerPlanPricing) => Number(v.billingPeriodDays) === Number(currentPickedDays))
    : null) || currentPickedVariants[0] || { price: pickedPlan === 'FREE' ? '0' : pickedPlan === 'SUPER' ? '999' : pickedPlan === 'SMART' ? '499' : '199', billingPeriodDays: 365 };

  const currentPayAmount = pickedPlan === 'FREE' ? 0 : Number(activePricingVariant.price);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAndReset}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient colors={['#022c22', '#065f46', '#0f172a']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerBanner}>
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.highlightVipLabelWrap}>
                <Ionicons name="sparkles" size={13} color="#f59e0b" />
                <Text style={styles.highlightVipLabelText}>FARMSKING VIP PASS SCHEME</Text>
              </View>
              {currentPlan && currentPlan !== 'FREE' ? (
                <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#86efac' }}>
                  Currently Active: {currentPlan} Plan
                </Text>
              ) : null}
            </View>
            <TouchableOpacity onPress={closeAndReset} style={styles.closeBtnIcon}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {result ? (
            <View style={{ gap: 12, paddingVertical: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                <Text style={styles.successText}>
                  {result.plan.plan} VIP Pass active! New expiry: {new Date(result.newEndDate).toLocaleDateString('en-IN')}
                  {result.advisorHired ? ' A Farm Advisor has been assigned to you.' : ''}
                  {selectedAdvisorId ? ' Your hire request has been sent to the selected advisor.' : ''}
                </Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={closeAndReset}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : previewResult ? (
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="pricetag" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  This code activates the {previewResult.plan} VIP Pass for {previewResult.daysGranted} day(s). New expiry:{' '}
                  {new Date(previewResult.newEndDate).toLocaleDateString('en-IN')}.
                  {previewResult.includesAdvisor ? ' Includes a Farm Advisor.' : ''}
                </Text>
              </View>

              {needsAdvisorPick ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.label}>Select a Farm Advisor (Optional)</Text>
                  {isLoadingAvailableAdvisors ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : !availableAdvisors || availableAdvisors.length === 0 ? (
                    <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#475569', backgroundColor: '#f8fafc', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      ⚡ An available Farm Advisor will be assigned automatically upon confirmation.
                    </Text>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {availableAdvisors.map((advisor) => {
                        const isSelected = advisor.id === selectedAdvisorId;
                        return (
                          <TouchableOpacity
                            key={advisor.id}
                            style={[styles.advisorPickRow, isSelected && { borderColor: theme.primary, backgroundColor: '#f0fdf4' }]}
                            activeOpacity={0.85}
                            onPress={() => setSelectedAdvisorId(isSelected ? null : advisor.id)}
                          >
                            <View style={{ flex: 1 }}>
                              <Text style={styles.advisorPickName}>{advisor.name}</Text>
                              <Text style={styles.advisorPickMeta}>
                                🏷️ {advisor.specialization || 'General Specialist'} · {advisor.activeFarmerCount} farmers
                              </Text>
                            </View>
                            <Ionicons
                              name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                              size={20}
                              color={isSelected ? theme.primary : '#cbd5e1'}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              ) : null}

              {error ? <Text style={styles.errorText}>❌ {error}</Text> : null}
              <TouchableOpacity
                style={styles.submitBtn}
                disabled={redeem.isPending}
                onPress={handleConfirmCoupon}
              >
                {redeem.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm Coupon Activation</Text>}
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.label}>SELECT MEMBERSHIP PLAN:</Text>
              <View style={{ gap: 8 }}>
                {planOptions.map((item) => {
                  const p = item.key;
                  const availableVariants = pricingList
                    .filter((it: FarmerPlanPricing) => it.plan === p && it.isActive !== false)
                    .sort((a: FarmerPlanPricing, b: FarmerPlanPricing) => Number(a.billingPeriodDays) - Number(b.billingPeriodDays));

                  const selectedDays = selectedDaysMap[p];
                  const currentVariant =
                    (selectedDays != null
                      ? availableVariants.find((v: FarmerPlanPricing) => Number(v.billingPeriodDays) === Number(selectedDays))
                      : null) ||
                    availableVariants[0] ||
                    { price: p === 'FREE' ? '0' : p === 'SUPER' ? '999' : p === 'SMART' ? '499' : '199', billingPeriodDays: 365 };

                  const isSelected = pickedPlan === p;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.advisorPickRow,
                        isSelected && { borderColor: item.color, backgroundColor: '#f0fdf4' },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handlePickPlan(p)}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Ionicons name={item.iconName as any} size={15} color={item.color} />
                          <Text style={[styles.advisorPickName, { color: item.color }]}>
                            {item.label}
                          </Text>
                          {currentPlan === p ? (
                            <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.pill }}>
                              <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#166534' }}>Current Plan</Text>
                            </View>
                          ) : null}
                        </View>
                        <Text style={[styles.advisorPickMeta, { color: '#0f172a', fontWeight: '700' }]}>
                          Price: {p === 'FREE' ? `₹0 (${freeTrialDays} Days Demo)` : `₹${currentVariant.price} / ${currentVariant.billingPeriodDays === 365 ? '1 year' : `${currentVariant.billingPeriodDays} days`}`}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>
                          {item.sub}
                        </Text>

                        {/* Duration Variant Selector Chips */}
                        {availableVariants.length > 1 ? (
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                            {availableVariants.map((v: FarmerPlanPricing) => {
                              const isDurSelected = isSelected && Number(currentVariant.billingPeriodDays) === Number(v.billingPeriodDays);
                              return (
                                <TouchableOpacity
                                  key={v.id}
                                  style={[
                                    {
                                      paddingHorizontal: 8,
                                      paddingVertical: 3,
                                      borderRadius: RADIUS.pill,
                                      borderWidth: 1,
                                      borderColor: isDurSelected ? item.color : '#cbd5e1',
                                      backgroundColor: isDurSelected ? item.color : '#ffffff',
                                    },
                                  ]}
                                  onPress={() => {
                                    setPickedPlan(p);
                                    setSelectedDaysMap((prev) => ({ ...prev, [p]: Number(v.billingPeriodDays) }));
                                  }}
                                >
                                  <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: isDurSelected ? '#ffffff' : '#334155' }}>
                                    {v.billingPeriodDays}d (₹{v.price})
                                  </Text>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        ) : null}
                      </View>
                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={isSelected ? item.color : '#cbd5e1'}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Error Display */}
              {error ? (
                <View style={{ backgroundColor: '#fef2f2', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fecaca' }}>
                  <Text style={styles.errorText}>❌ {error}</Text>
                </View>
              ) : null}

              {/* DIRECT PAYMENT GATEWAY ACTION BUTTON */}
              <TouchableOpacity
                style={[styles.submitBtn, isPaying && { opacity: 0.7 }]}
                disabled={isPaying}
                onPress={handleProceedToGatewayPayment}
                activeOpacity={0.88}
              >
                {isPaying ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
                    <Text style={styles.submitBtnText}>
                      {pickedPlan === 'FREE' ? 'Activate Free Demo Trial 🎁' : `Proceed to Pay ₹${currentPayAmount} Securely`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* COLLAPSIBLE COUPON ACCORDION */}
              {ENABLE_COUPON_SYSTEM ? (
                <View style={{ marginTop: 4 }}>
                  <TouchableOpacity
                    style={styles.seePlansBtn}
                    onPress={() => setShowCouponInput((v) => !v)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pricetag-outline" size={14} color={theme.primary} />
                    <Text style={styles.seePlansBtnText}>
                      {showCouponInput ? 'Hide Coupon Box ▲' : 'Have a VIP Pass Coupon Code? Tap here ▼'}
                    </Text>
                  </TouchableOpacity>

                  {showCouponInput ? (
                    <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', gap: 8, marginTop: 4 }}>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#475569' }}>
                        Enter your VIP Pass coupon code below:
                      </Text>
                      <TextInput
                        ref={codeInputRef}
                        style={styles.input}
                        placeholder="e.g. PLAN-A1B2C3"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters"
                        value={code}
                        onChangeText={setCode}
                      />
                      <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: '#0f172a', paddingVertical: 10 }]}
                        disabled={preview.isPending}
                        onPress={handleCheckCode}
                      >
                        {preview.isPending ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Check Coupon Code</Text>}
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {/* COMPARISON CHART ACCORDION */}
              <TouchableOpacity style={styles.seePlansBtn} onPress={() => setShowChart((v) => !v)}>
                <Ionicons name="stats-chart-outline" size={14} color={theme.primary} />
                <Text style={styles.seePlansBtnText}>{showChart ? 'Hide Plan Features' : 'Compare VIP Pass Features'}</Text>
                <Ionicons name={showChart ? 'chevron-up' : 'chevron-down'} size={14} color={theme.primary} />
              </TouchableOpacity>

              {showChart ? (
                <PlanComparisonChart
                  plans={plans}
                  currentPlan={currentPlan}
                  isExpired={isExpired}
                  inGrace={inGrace}
                  pricingList={pricingList}
                  onPickPlan={handlePickPlan}
                  maxFreeCrops={settings?.freePlanMaxCrops ?? 3}
                />
              ) : null}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: 8,
    overflow: 'hidden',
    ...premiumShadow('#000000', 'lg'),
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: -SPACING.lg,
    marginTop: -SPACING.lg,
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#10b981',
  },
  highlightVipLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  highlightVipLabelText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  closeBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT.bold,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  errorText: {
    color: '#dc2626',
    fontFamily: FONT.bold,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...premiumShadow('#16a34a', 'sm'),
  },
  submitBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 13.5,
  },
  seePlansBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  seePlansBtnText: {
    color: theme.primary,
    fontFamily: FONT.bold,
    fontSize: 12,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#15803d',
  },
  advisorPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 11,
    backgroundColor: '#ffffff',
  },
  advisorPickName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  advisorPickMeta: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
});
