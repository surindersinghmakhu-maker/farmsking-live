import React, { useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as ImagePicker from 'expo-image-picker';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';
import { useFarmerPlan, useFarmerPlanPricing, usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon } from '../hooks/useFarmerPlan';
import { useInitiateFarmerPlanPayment, useSubmitFarmerPlanPayment } from '../hooks/useFarmerPlanPayments';
import { useAvailableAdvisors, useMyAdvisor } from '../hooks/useAdvisorAssignments';
import { uploadPhoto } from '../api/uploads.api';
import type { FarmerPlanType, FarmerPlanPricing } from '../api/farmerPlans.api';
import type { InitiateFarmerPlanPaymentResponse } from '../api/farmerPlanPayments.api';

const theme = RoleThemes.FARMER;

const PLAN_RANK: Record<FarmerPlanType, number> = { FREE: 0, PRO: 1, SMART: 2, SUPER: 3 };
const PLAN_COLUMN_META: Record<FarmerPlanType, { label: string; emoji: string; color: string; price: string }> = {
  FREE: { label: 'Free', emoji: '🌱', color: '#166534', price: '₹0' },
  PRO: { label: 'Lite', emoji: '🌾', color: '#6d28d9', price: '₹299/yr' },
  SMART: { label: 'Pro', emoji: '👑', color: '#1d4ed8', price: '₹499/yr' },
  SUPER: { label: 'Smart', emoji: '🎓', color: '#b45309', price: '₹999/30d' },
};

interface PlanRow {
  label: string;
  values: Record<FarmerPlanType, string>;
}

const PLAN_ROWS: PlanRow[] = [
  { label: 'Bookkeeping Logs', values: { FREE: 'Basic', PRO: '✓ All', SMART: '✓ All', SUPER: '✓ All' } },
  { label: 'Total Crop Cycles', values: { FREE: 'Max 3', PRO: 'Unlimited', SMART: 'Unlimited', SUPER: 'Unlimited' } },
  { label: 'Crop History', values: { FREE: 'Summary', PRO: 'Full', SMART: 'Full', SUPER: 'Full' } },
  { label: 'Weather Report', values: { FREE: '✓', PRO: '✓', SMART: '✓', SUPER: '✓' } },
  { label: 'Labour Record', values: { FREE: '—', PRO: '—', SMART: '✓ Included', SUPER: '✓ Included' } },
  { label: 'Worker Login', values: { FREE: '—', PRO: '—', SMART: '✓ Enabled', SUPER: '✓ Enabled' } },
  { label: 'Dedicated Farm Advisor', values: { FREE: '—', PRO: '—', SMART: '—', SUPER: '✓ Included' } },
  { label: 'Advisor Chat', values: { FREE: '—', PRO: '—', SMART: '—', SUPER: '✓ Enabled' } },
  { label: 'Advisor Call Request', values: { FREE: '—', PRO: '—', SMART: '—', SUPER: '✓ Enabled' } },
  { label: 'Mandi AI Predictions', values: { FREE: '—', PRO: '—', SMART: '—', SUPER: '✓ Included' } },
];


/** 100% Single-Screen Responsive Plan Comparison Chart — fits perfectly on one screen without horizontal scrolling */
function PlanComparisonChart({
  plans,
  currentPlan,
  isExpired,
  inGrace,
  pricingList = [],
  onPickPlan,
}: {
  plans: FarmerPlanType[];
  currentPlan: FarmerPlanType;
  isExpired: boolean;
  inGrace: boolean;
  pricingList?: FarmerPlanPricing[];
  onPickPlan: (plan: FarmerPlanType) => void;
}) {
  return (
    <View style={chartStyles.tableContainer}>
      <View style={chartStyles.headerRow}>
        <View style={[chartStyles.cell, chartStyles.labelCellHeader]}>
          <Text style={chartStyles.headerTitle}>Features</Text>
        </View>
        {plans.map((p) => {
          const activeVariants = (pricingList ?? []).filter((it) => it.plan === p && it.isActive !== false);
          const displayPrice = p === 'FREE' ? '₹0' : activeVariants[0]
            ? `₹${activeVariants[0].price}/${Number(activeVariants[0].billingPeriodDays) === 365 ? 'yr' : `${activeVariants[0].billingPeriodDays}d`}`
            : PLAN_COLUMN_META[p].price;

          return (
            <View key={p} style={[chartStyles.cell, chartStyles.headerPlanCell]}>
              <Text style={[chartStyles.headEmojiText]}>{PLAN_COLUMN_META[p].emoji}</Text>
              <Text style={[chartStyles.headText, { color: PLAN_COLUMN_META[p].color }]}>
                {PLAN_COLUMN_META[p].label}
              </Text>
              <Text style={chartStyles.headPriceText}>{displayPrice}</Text>
            </View>
          );
        })}
      </View>

      {PLAN_ROWS.map((row, idx) => (
        <View key={row.label} style={[chartStyles.row, idx % 2 === 1 && chartStyles.zebraRow]}>
          <View style={[chartStyles.cell, chartStyles.labelCell]}>
            <Text style={chartStyles.labelText} numberOfLines={2}>{row.label}</Text>
          </View>
          {plans.map((p) => {
            const val = row.values[p];
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
          const isDowngrade = PLAN_RANK[p] < PLAN_RANK[currentPlan];
          return (
            <View key={p} style={chartStyles.cell}>
              {p === 'FREE' ? null : isCurrent ? (
                <TouchableOpacity
                  style={[chartStyles.planBtn, { backgroundColor: PLAN_COLUMN_META[p].color }]}
                  onPress={() => onPickPlan(p)}
                >
                  <Text style={chartStyles.planBtnText}>Renew</Text>
                </TouchableOpacity>
              ) : isDowngrade ? (
                <View style={chartStyles.planBtnDisabled}>
                  <Text style={chartStyles.planBtnDisabledText}>—</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={[chartStyles.planBtn, { backgroundColor: PLAN_COLUMN_META[p].color }]}
                  onPress={() => onPickPlan(p)}
                >
                  <Text style={chartStyles.planBtnText}>Get</Text>
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
  planBtnDisabled: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f1f5f9',
  },
  planBtnDisabledText: {
    color: '#94a3b8',
    fontSize: 10,
    fontFamily: FONT.bold,
  },
});

/**
 * Upgrade flow for the Farmer plan — pick a plan from the comparison chart to pay for it directly via UPI, or
 * redeem an admin/advisor-issued coupon code. `tiers` scopes which paid plans are offered: the dashboard only
 * offers BASIC (record-keeping, no advisor); the Advisor tab only offers STANDARD/PREMIUM (advisor included).
 */
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
  const { plan: currentPlan, isExpired, inGrace } = useFarmerPlan();
  const { data: pricingList = [] } = useFarmerPlanPricing();
  const plans: FarmerPlanType[] = ['FREE', ...tiers];
  const preview = usePreviewFarmerPlanCoupon();
  const redeem = useRedeemFarmerPlanCoupon();
  const { data: myAdvisor } = useMyAdvisor();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>> | null>(null);
  const [showChart, setShowChart] = useState(false);
  const [pickedPlan, setPickedPlan] = useState<FarmerPlanType | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('FARMER_LITE');
  const [planCategory, setPlanCategory] = useState<'FARMER' | 'ADVISOR'>('FARMER');
  const [mode, setMode] = useState<'CODE' | 'UPI'>('CODE');
  const [tabMode, setTabMode] = useState<'GET_COUPON' | 'REDEEM_CODE'>(initialMode);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [selectedDaysMap, setSelectedDaysMap] = useState<Record<string, number>>({});
  const codeInputRef = useRef<TextInput>(null);

  // Sync initialMode when modal becomes visible
  React.useEffect(() => {
    if (visible) {
      setTabMode(initialMode);
    }
  }, [visible, initialMode]);

  // Only a genuinely fresh advisor plan needs the farmer to pick one here — if they already have an
  // active advisor, a same-tier renewal just extends their days and keeps that advisor as-is.
  const needsAdvisorPick = !!previewResult?.includesAdvisor && !myAdvisor;
  const { data: availableAdvisors, isLoading: isLoadingAvailableAdvisors } = useAvailableAdvisors(needsAdvisorPick);

  const reset = () => {
    setCode('');
    setError(null);
    setPreviewResult(null);
    setResult(null);
    setShowChart(false);
    setPickedPlan(null);
    setMode('CODE');
    setTabMode(initialMode);
    setSelectedAdvisorId(null);
  };

  const handlePickPlan = (plan: FarmerPlanType) => {
    setPickedPlan(plan);
    if (plan === 'PRO') {
      setPlanCategory('FARMER');
      setSelectedOptionId('FARMER_LITE');
    } else if (plan === 'SMART') {
      setPlanCategory('FARMER');
      setSelectedOptionId('FARMER_PRO');
    } else if (plan === 'SUPER') {
      setPlanCategory('ADVISOR');
      setSelectedOptionId('ADVISOR_SUPER');
    }
    const activeVariants = pricingList.filter((it) => it.plan === plan && it.isActive !== false);
    if (activeVariants.length > 0 && !selectedDaysMap[plan]) {
      setSelectedDaysMap((prev) => ({ ...prev, [plan]: Number(activeVariants[0].billingPeriodDays) }));
    }
    setShowChart(false);
    setMode('UPI');
  };

  const closeAndReset = () => {
    reset();
    onClose();
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

  const handleConfirm = async () => {
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAndReset}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{tabMode === 'GET_COUPON' ? 'Get Plan Coupon' : 'Upgrade Plan'}</Text>
            <TouchableOpacity onPress={closeAndReset}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {mode === 'UPI' && pickedPlan ? (
            <UpiUpgradeFlow
              plan={pickedPlan}
              billingPeriodDays={
                selectedDaysMap[pickedPlan] ?? (
                  pricingList
                    .filter((it) => it.plan === pickedPlan && it.isActive !== false)
                    .sort((a, b) => Number(a.billingPeriodDays) - Number(b.billingPeriodDays))[0]?.billingPeriodDays
                )
              }
              onDone={closeAndReset}
              onSwitchToCode={() => {
                setMode('CODE');
                setTabMode('REDEEM_CODE');
              }}
              onPickDifferentPlan={() => {
                setPickedPlan(null);
                setMode('CODE');
                setShowChart(true);
              }}
            />
          ) : result ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  {result.plan.plan} plan active! New expiry: {new Date(result.newEndDate).toLocaleDateString('en-IN')}
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
                  This code activates the {previewResult.plan} plan for {previewResult.daysGranted} day(s). New expiry:{' '}
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
                      ⚡ An available Farm Advisor will be assigned automatically to your account upon confirmation.
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
                                {advisor.specialization || 'Farm Advisor'}
                                {advisor.yearsExperience ? ` · ${advisor.yearsExperience} yrs exp` : ''} · {advisor.activeFarmerCount} farmers
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

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity
                style={styles.submitBtn}
                disabled={redeem.isPending}
                onPress={handleConfirm}
              >
                {redeem.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm</Text>}
              </TouchableOpacity>
            </ScrollView>
          ) : tabMode === 'GET_COUPON' ? (
            /* GET PLAN COUPON FLOW: Category + Sub-category Plan Selection + Generate UPI QR Code */
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Select Plan Category:</Text>
              <View style={styles.chipRow}>
                {(['FARMER', 'ADVISOR'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.partnerChip,
                      planCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary },
                    ]}
                    onPress={() => {
                      setPlanCategory(cat);
                      if (cat === 'FARMER') {
                        setSelectedOptionId('FARMER_LITE');
                        setPickedPlan('PRO');
                      } else {
                        setSelectedOptionId('ADVISOR_SMART');
                        setPickedPlan('SMART');
                      }
                    }}
                  >
                    <Text style={[styles.partnerChipText, planCategory === cat && { color: '#ffffff' }]}>
                      {cat === 'FARMER' ? '🌾 Farmer Plan' : '🎓 Advisor Plan'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Select Plan Option:</Text>
              <View style={{ gap: 8 }}>
                {(planCategory === 'FARMER'
                  ? [
                      { id: 'FARMER_LITE', key: 'PRO', label: 'Lite Plan', emoji: '🌾', color: '#6d28d9', sub: '⚡ Bookkeeping & Expense Logs + Voice AI Mic' },
                      { id: 'FARMER_PRO', key: 'SMART', label: 'Pro Plan', emoji: '👑', color: '#1d4ed8', sub: '👑 All Bookkeeping + Labour Record & Worker Login' },
                    ]
                  : [
                      { id: 'ADVISOR_SMART', key: 'SMART', label: 'Smart Plan', emoji: '🎓', color: '#b45309', sub: '🎓 Dedicated Farm Doctor, Advisor Chat & Mandi AI Predictions' },
                      { id: 'ADVISOR_SUPER', key: 'SUPER', label: 'Super Plan', emoji: '⭐', color: '#d97706', sub: '⭐ Full Dedicated Advisor Suite, Priority Call Consultation & Personal Soil Doctor' },
                    ]
                ).map((item) => {
                  const p = item.key as FarmerPlanType;
                  const availableVariants = pricingList
                    .filter((it) => it.plan === p && it.isActive !== false)
                    .sort((a, b) => Number(a.billingPeriodDays) - Number(b.billingPeriodDays));
                  
                  const selectedDays = selectedDaysMap[item.id];
                  const currentVariant =
                    (selectedDays != null
                      ? availableVariants.find((v) => Number(v.billingPeriodDays) === Number(selectedDays))
                      : null) ||
                    availableVariants[0] ||
                    { price: p === 'SUPER' ? '999' : p === 'SMART' ? '499' : '299', billingPeriodDays: planCategory === 'FARMER' ? 365 : 30 };

                  const isSelected = selectedOptionId === item.id;

                  return (
                    <TouchableOpacity
                      key={`${planCategory}-${item.id}`}
                      style={[
                        styles.advisorPickRow,
                        isSelected && { borderColor: item.color, backgroundColor: '#f5f3ff' },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedOptionId(item.id);
                        setPickedPlan(p);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.advisorPickName, { color: item.color }]}>
                            {item.emoji} {item.label}
                          </Text>
                        </View>
                        <Text style={[styles.advisorPickMeta, { color: '#475569', fontWeight: '700' }]}>
                          Price: ₹{currentVariant.price} / {currentVariant.billingPeriodDays === 365 ? '1 year' : `${currentVariant.billingPeriodDays} days`}
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>
                          {item.sub}
                        </Text>

                        {/* Duration Variant Selector Chips */}
                        {availableVariants.length > 1 ? (
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                            {availableVariants.map((v) => {
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
                                    setSelectedOptionId(item.id);
                                    setPickedPlan(p);
                                    setSelectedDaysMap((prev) => ({ ...prev, [item.id]: Number(v.billingPeriodDays) }));
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
                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
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

              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#6d28d9', flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
                onPress={() => {
                  if (!pickedPlan) setPickedPlan(planCategory === 'FARMER' ? 'PRO' : 'SUPER');
                  setMode('UPI');
                }}
              >
                <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>
                  Pay via UPI for {
                    (() => {
                      const allOpts = [
                        { id: 'FARMER_LITE', label: 'Lite Plan', key: 'PRO' },
                        { id: 'FARMER_PRO', label: 'Pro Plan', key: 'SMART' },
                        { id: 'ADVISOR_SMART', label: 'Smart Plan', key: 'SMART' },
                        { id: 'ADVISOR_SUPER', label: 'Super Plan', key: 'SUPER' },
                      ];
                      const selOpt = allOpts.find((o) => o.id === selectedOptionId) || allOpts[0];
                      const availableVariants = pricingList
                        .filter((it) => it.plan === selOpt.key && it.isActive !== false)
                        .sort((a, b) => Number(a.billingPeriodDays) - Number(b.billingPeriodDays));
                      const selectedDays = selectedDaysMap[selOpt.id];
                      const currentVariant =
                        (selectedDays != null
                          ? availableVariants.find((v) => Number(v.billingPeriodDays) === Number(selectedDays))
                          : null) ||
                        availableVariants[0] ||
                        { price: selOpt.key === 'SUPER' ? '999' : selOpt.key === 'SMART' ? '499' : '299' };

                      return `${selOpt.label} (₹${currentVariant.price})`;
                    })()
                  }
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.seePlansBtn} onPress={() => setTabMode('REDEEM_CODE')}>
                <Ionicons name="key-outline" size={14} color={theme.primary} />
                <Text style={styles.seePlansBtnText}>Have a coupon code? Enter code</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* REDEEM CODE / UPGRADE PLAN FLOW: Enter Coupon Code */
            <View style={{ gap: 12 }}>
              <Text style={styles.label}>Enter your plan coupon code to upgrade or extend your plan:</Text>

              <TextInput
                ref={codeInputRef}
                style={styles.input}
                placeholder="e.g. PLAN-A1B2C3"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#0f172a' }]} disabled={preview.isPending} onPress={handleCheckCode}>
                {preview.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Check Coupon Code</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.seePlansBtn} onPress={() => setTabMode('GET_COUPON')}>
                <Ionicons name="qr-code-outline" size={14} color={theme.primary} />
                <Text style={styles.seePlansBtnText}>Don't have a coupon code? Get Plan Coupon via UPI</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.seePlansBtn} onPress={() => setShowChart((v) => !v)}>
                <Ionicons name="stats-chart-outline" size={14} color={theme.primary} />
                <Text style={styles.seePlansBtnText}>{showChart ? 'Hide Plan Features' : 'Compare Plan Features'}</Text>
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
                />
              ) : null}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

function UpiUpgradeFlow({
  plan,
  billingPeriodDays,
  onDone,
  onSwitchToCode,
  onPickDifferentPlan,
}: {
  plan: FarmerPlanType;
  billingPeriodDays?: number;
  onDone: () => void;
  onSwitchToCode: () => void;
  onPickDifferentPlan: () => void;
}) {
  const initiate = useInitiateFarmerPlanPayment();
  const submit = useSubmitFarmerPlanPayment();
  const [request, setRequest] = useState<InitiateFarmerPlanPaymentResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [utr, setUtr] = useState('');
  const [screenshotUri, setScreenshotUri] = useState<string | null>(null);
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showForm, setShowForm] = useState(false);

  // Auto-generate payment request & UPI link as soon as Pay via UPI is clicked
  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      setError(null);
      try {
        const res = await initiate.mutateAsync({ targetPlan: plan, billingPeriodDays });
        if (isMounted) setRequest(res);
      } catch (err: any) {
        if (isMounted) setError(err?.response?.data?.message ?? 'Could not generate payment link. Try again.');
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [plan, billingPeriodDays]);

  const handleOpenUpiApp = async () => {
    if (!request) return;
    try {
      await Linking.openURL(request.upiLink);
    } catch {
      setError('No UPI app found on this device.');
    }
  };

  const handlePickScreenshot = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].uri;
        setScreenshotUri(uri);
        setIsUploadingPhoto(true);
        try {
          const uploaded = await uploadPhoto(uri);
          setScreenshotUrl(uploaded.fileUrl);
        } catch {
          setError('Could not upload screenshot image. You can still submit payment info without it.');
        } finally {
          setIsUploadingPhoto(false);
        }
      }
    } catch {
      setError('Could not open image picker.');
    }
  };

  const handleWhatsAppNotify = () => {
    if (!request) return;
    const kingId = request.farmer.kingId || request.farmerId;
    const planName = (PLAN_COLUMN_META[plan]?.label ?? plan).toUpperCase();
    const paymentRefCode = `FK-${kingId}-${planName}-${request.id.slice(0, 6).toUpperCase()}`;
    const utrText = utr.trim() ? `\nUPI Txn ID / UTR: ${utr.trim()}` : '';
    const text = `Sat Shri Akaal Admin, I have paid ₹${request.amount} for the ${planName} Plan via UPI.\n\nPayment Ref Code: ${paymentRefCode}${utrText}\nKing ID: ${kingId}\nFarmer Name: ${request.farmer.name}\n\nAttaching payment screenshot for verification.`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => { });
  };

  const handleSubmit = async () => {
    if (!request) return;
    if (!utr.trim()) {
      setError('⚠️ UPI Transaction ID / UTR is required!');
      return;
    }
    setError(null);
    try {
      await submit.mutateAsync({
        id: request.id,
        utr: utr.trim(),
        screenshotUrl: screenshotUrl ?? undefined,
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not submit payment info to admin.');
    }
  };

  if (submitted) {
    return (
      <View style={{ gap: 12 }}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#15803d' }}>
              Payment details sent to Admin!
            </Text>
            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#166534', lineHeight: 16 }}>
              Your payment and plan code will be verified by the Admin and activated within 24 hours.
            </Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#25D366', flexDirection: 'row', justifyContent: 'center', gap: 8 }]} onPress={handleWhatsAppNotify}>
          <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
          <Text style={styles.submitBtnText}>Send Screenshot to Admin on WhatsApp</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitBtn} onPress={onDone}>
          <Text style={styles.submitBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (initiate.isPending && !request) {
    return (
      <View style={{ padding: 30, alignItems: 'center', gap: 12 }}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={{ fontSize: 13, fontFamily: FONT.semiBold, color: '#475569' }}>
          Generating Superadmin UPI QR Code & Plan Code...
        </Text>
      </View>
    );
  }

  if (request) {
    const kingId = request.farmer.kingId || request.farmerId;
    const planName = (PLAN_COLUMN_META[plan]?.label ?? plan).toUpperCase();
    const paymentRefCode = `FK-${kingId}-${planName}-${request.id.slice(0, 6).toUpperCase()}`;

    return (
      <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, alignItems: 'center' }}>
        <Text style={[styles.label, { alignSelf: 'flex-start', color: '#0f172a', fontWeight: '700' }]}>
          {planName} Plan Price: ₹{request.amount}
        </Text>

        <View style={styles.qrBox}>
          <QRCode value={request.upiLink} size={160} />
        </View>

        <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md, alignItems: 'center', gap: 2, width: '100%' }}>
          <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#1e293b' }}>
            UPI ID: surindersinghmakhu-5@oksbi
          </Text>
          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#6d28d9' }}>
            Payment Ref Code: {paymentRefCode}
          </Text>
        </View>

        <TouchableOpacity style={[styles.submitBtn, { width: '100%' }]} onPress={handleOpenUpiApp}>
          <Text style={styles.submitBtnText}>Open in UPI App (Google Pay / PhonePe / Paytm)</Text>
        </TouchableOpacity>

        {/* Button to toggle Payment Info Submission Form */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: showForm ? '#1e293b' : '#0f172a', width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 }]}
          onPress={() => setShowForm((v) => !v)}
        >
          <Ionicons name={showForm ? 'chevron-up-circle' : 'paper-plane'} size={18} color="#ffffff" />
          <Text style={styles.submitBtnText}>
            {showForm ? 'Hide Payment Info Form' : '📩 Send Payment Information to Admin'}
          </Text>
        </TouchableOpacity>

        {/* Payment Information Form Section */}
        {showForm ? (
          <View style={{ gap: 10, width: '100%', padding: 12, backgroundColor: '#f8fafc', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#cbd5e1', marginTop: 4 }}>
            <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 2 }}>
              📩 Send Payment Information to Admin
            </Text>

            {/* Auto-filled Payment Ref Code */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Payment Ref Code (Auto-filled):</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 10 }}>
                <Ionicons name="lock-closed" size={15} color="#64748b" style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: 'transparent', borderWidth: 0, color: '#1e293b', fontFamily: FONT.bold, paddingVertical: 8 }]}
                  value={paymentRefCode}
                  editable={false}
                />
              </View>
            </View>

            {/* Auto-filled Amount */}
            <View style={{ gap: 4 }}>
              <Text style={styles.label}>Amount (Auto-filled):</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 10 }}>
                <Ionicons name="lock-closed" size={15} color="#64748b" style={{ marginRight: 6 }} />
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: 'transparent', borderWidth: 0, color: '#1e293b', fontFamily: FONT.bold, paddingVertical: 8 }]}
                  value={`₹${request.amount}`}
                  editable={false}
                />
              </View>
            </View>

            {/* Mandatory UPI Transaction ID */}
            <View style={{ gap: 4 }}>
              <Text style={[styles.label, { color: '#0f172a' }]}>
                UPI Transaction ID / UTR <Text style={{ color: '#dc2626' }}>* (Required)</Text>:
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: '#ffffff', borderColor: !utr.trim() && error ? '#dc2626' : '#cbd5e1' }]}
                placeholder="Enter 12-digit UTR or UPI Transaction ID"
                placeholderTextColor="#94a3b8"
                value={utr}
                onChangeText={(val) => { setUtr(val); setError(null); }}
              />
            </View>

            {/* Optional Screenshot Upload */}
            <View style={{ gap: 6 }}>
              <Text style={styles.label}>Upload Payment Screenshot (Optional):</Text>
              {screenshotUri ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1' }}>
                  <Image source={{ uri: screenshotUri }} style={{ width: 42, height: 42, borderRadius: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#16a34a' }}>
                      {isUploadingPhoto ? 'Uploading screenshot...' : '✓ Screenshot attached'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => { setScreenshotUri(null); setScreenshotUrl(null); }}
                    style={{ paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#fee2e2', borderRadius: RADIUS.pill }}
                  >
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#dc2626' }}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#ffffff',
                    paddingVertical: 10,
                    borderRadius: RADIUS.md,
                    borderWidth: 1.5,
                    borderColor: '#cbd5e1',
                    borderStyle: 'dashed',
                  }}
                  disabled={isUploadingPhoto}
                  onPress={handlePickScreenshot}
                >
                  <Ionicons name="camera-outline" size={18} color="#475569" />
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#475569' }}>
                    {isUploadingPhoto ? 'Uploading...' : '📷 Attach Screenshot (Optional)'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: '#16a34a', width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 4 }]}
              disabled={submit.isPending || isUploadingPhoto}
              onPress={handleSubmit}
            >
              {submit.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Submit Payment Info to Admin</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity
        style={styles.submitBtn}
        disabled={initiate.isPending}
        onPress={() => {
          setError(null);
          initiate.mutateAsync({ targetPlan: plan, billingPeriodDays }).then(setRequest).catch((err: any) => {
            setError(err?.response?.data?.message ?? 'Could not generate payment link.');
          });
        }}
      >
        {initiate.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Retry Generating UPI QR Code</Text>}
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <TouchableOpacity onPress={onPickDifferentPlan}>
          <Text style={styles.seePlansBtnText}>Pick a different plan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onSwitchToCode}>
          <Text style={styles.seePlansBtnText}>Have a coupon code?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, gap: 8, ...premiumShadow('#000000', 'lg') },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  label: { fontSize: 12, fontFamily: FONT.semiBold, color: '#64748b' },
  chipRow: { flexDirection: 'row', gap: 8, marginVertical: 2 },
  partnerChip: { flex: 1, paddingVertical: 8, paddingHorizontal: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc', alignItems: 'center' },
  partnerChipText: { fontSize: 12, fontFamily: FONT.bold, color: '#475569' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnSecondary: { backgroundColor: '#0f172a' },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  qrBox: { padding: 12, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#e2e8f0' },
  seePlansBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  seePlansBtnText: { color: theme.primary, fontFamily: FONT.bold, fontSize: 12.5 },
  hintBox: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#eff6ff', borderRadius: RADIUS.md, padding: 8, borderWidth: 1, borderColor: '#bfdbfe' },
  hintText: { flex: 1, fontSize: 11.5, fontFamily: FONT.semiBold, color: '#1d4ed8' },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#15803d' },
  advisorPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 10,
    backgroundColor: '#ffffff',
  },
  advisorPickName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  advisorPickMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  screenshotNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    width: '100%',
  },
  screenshotNoticeText: { flex: 1, fontSize: 11.5, fontFamily: FONT.bold, color: '#166534', lineHeight: 16 },
});
