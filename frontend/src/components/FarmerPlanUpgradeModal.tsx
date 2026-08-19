import React, { useRef, useState } from 'react';
import { ActivityIndicator, Linking, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';
import { useFarmerPlan, usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon } from '../hooks/useFarmerPlan';
import { useInitiateFarmerPlanPayment, useSubmitFarmerPlanPayment } from '../hooks/useFarmerPlanPayments';
import { useAvailableAdvisors, useMyAdvisor } from '../hooks/useAdvisorAssignments';
import type { FarmerPlanType } from '../api/farmerPlans.api';
import type { InitiateFarmerPlanPaymentResponse } from '../api/farmerPlanPayments.api';

const theme = RoleThemes.FARMER;

const PLAN_RANK: Record<FarmerPlanType, number> = { FREE: 0, BASIC: 1, STANDARD: 2, PREMIUM: 3 };
const PLAN_COLUMN_META: Record<FarmerPlanType, { label: string; emoji: string; color: string }> = {
  FREE: { label: 'Free', emoji: '🌱', color: '#166534' },
  BASIC: { label: 'Basic', emoji: '⭐', color: '#92400e' },
  STANDARD: { label: 'Standard', emoji: '🚀', color: '#1d4ed8' },
  PREMIUM: { label: 'Premium', emoji: '👑', color: '#6d28d9' },
};

interface PlanRow {
  label: string;
  values: Record<FarmerPlanType, string>;
}

const PLAN_ROWS: PlanRow[] = [
  { label: 'Total crop cycles', values: { FREE: 'Up to 3', BASIC: 'Unlimited', STANDARD: 'Unlimited', PREMIUM: 'Unlimited' } },
  { label: 'Active crops at once', values: { FREE: 'Up to 3', BASIC: 'Unlimited', STANDARD: 'Unlimited', PREMIUM: 'Unlimited' } },
  { label: 'Crops under advisor review at once', values: { FREE: '—', BASIC: '—', STANDARD: 'Up to 5', PREMIUM: 'Up to 10' } },
  { label: 'Completed crop details', values: { FREE: 'Summary only', BASIC: 'Full history', STANDARD: 'Full history', PREMIUM: 'Full history' } },
  { label: 'Farm Advisor assigned', values: { FREE: '—', BASIC: '—', STANDARD: '✓ Included', PREMIUM: '✓ Included' } },
  { label: 'Weather report', values: { FREE: '✓', BASIC: '✓', STANDARD: '✓', PREMIUM: '✓' } },
  { label: 'Chat with advisor', values: { FREE: '—', BASIC: '—', STANDARD: '✓', PREMIUM: '✓' } },
];

/** FREE/BASIC/STANDARD/PREMIUM feature comparison — mirrors the limits returned by GET /farmer-plans/my-plan. Each
 * column gets an action button: "Renew" for the currently active tier, "Get Plan" for any higher tier
 * (a lower tier can never replace an active higher one — coupons enforce this server-side too). */
function PlanComparisonChart({
  plans,
  currentPlan,
  isExpired,
  inGrace,
  onPickPlan,
}: {
  plans: FarmerPlanType[];
  currentPlan: FarmerPlanType;
  isExpired: boolean;
  inGrace: boolean;
  onPickPlan: (plan: FarmerPlanType) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={chartStyles.table}>
        <View style={chartStyles.row}>
          <View style={[chartStyles.cell, chartStyles.labelCell]} />
          {plans.map((p) => (
            <View key={p} style={chartStyles.cell}>
              <Text style={[chartStyles.headText, { color: PLAN_COLUMN_META[p].color }]}>
                {PLAN_COLUMN_META[p].emoji} {PLAN_COLUMN_META[p].label}
              </Text>
            </View>
          ))}
        </View>
        {PLAN_ROWS.map((row) => (
          <View key={row.label} style={chartStyles.row}>
            <View style={[chartStyles.cell, chartStyles.labelCell]}>
              <Text style={chartStyles.labelText}>{row.label}</Text>
            </View>
            {plans.map((p) => (
              <View key={p} style={chartStyles.cell}>
                <Text style={chartStyles.valueText}>{row.values[p]}</Text>
              </View>
            ))}
          </View>
        ))}
        <View style={[chartStyles.row, { borderBottomWidth: 0 }]}>
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
                    <Text style={chartStyles.planBtnText}>Get Plan</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const chartStyles = StyleSheet.create({
  table: { borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  cell: { width: 92, paddingVertical: 8, paddingHorizontal: 6, justifyContent: 'center', alignItems: 'center' },
  labelCell: { width: 150, alignItems: 'flex-start', backgroundColor: '#f8fafc' },
  labelText: { fontSize: 11, fontFamily: FONT.semiBold, color: '#334155' },
  valueText: { fontSize: 11, fontFamily: FONT.medium, color: '#0f172a', textAlign: 'center' },
  headText: { fontSize: 11.5, fontFamily: FONT.bold },
  planBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill },
  planBtnText: { color: '#ffffff', fontSize: 10.5, fontFamily: FONT.bold },
  planBtnDisabled: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, backgroundColor: '#f1f5f9' },
  planBtnDisabledText: { color: '#94a3b8', fontSize: 10.5, fontFamily: FONT.bold },
});

/**
 * Upgrade flow for the Farmer plan — pick a plan from the comparison chart to pay for it directly via UPI, or
 * redeem an admin/advisor-issued coupon code. `tiers` scopes which paid plans are offered: the dashboard only
 * offers BASIC (record-keeping, no advisor); the Advisor tab only offers STANDARD/PREMIUM (advisor included).
 */
export function FarmerPlanUpgradeModal({
  visible,
  onClose,
  tiers = ['BASIC', 'STANDARD', 'PREMIUM'],
}: {
  visible: boolean;
  onClose: () => void;
  tiers?: FarmerPlanType[];
}) {
  const { plan: currentPlan, isExpired, inGrace } = useFarmerPlan();
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
  const [mode, setMode] = useState<'CODE' | 'UPI'>('CODE');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const codeInputRef = useRef<TextInput>(null);

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
    setSelectedAdvisorId(null);
  };

  const handlePickPlan = (plan: FarmerPlanType) => {
    setPickedPlan(plan);
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
    if (needsAdvisorPick && !selectedAdvisorId) {
      setError('Select a Farm Advisor to continue.');
      return;
    }
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
            <Text style={styles.title}>Upgrade Plan</Text>
            <TouchableOpacity onPress={closeAndReset}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {mode === 'UPI' && pickedPlan ? (
            <UpiUpgradeFlow
              plan={pickedPlan}
              onDone={closeAndReset}
              onSwitchToCode={() => setMode('CODE')}
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
                  <Text style={styles.label}>Select a Farm Advisor</Text>
                  {isLoadingAvailableAdvisors ? (
                    <ActivityIndicator color={theme.primary} />
                  ) : !availableAdvisors || availableAdvisors.length === 0 ? (
                    <Text style={styles.errorText}>No advisors available right now. Try again later.</Text>
                  ) : (
                    <View style={{ gap: 8 }}>
                      {availableAdvisors.map((advisor) => {
                        const isSelected = advisor.id === selectedAdvisorId;
                        return (
                          <TouchableOpacity
                            key={advisor.id}
                            style={[styles.advisorPickRow, isSelected && { borderColor: theme.primary, backgroundColor: '#f0fdf4' }]}
                            activeOpacity={0.85}
                            onPress={() => setSelectedAdvisorId(advisor.id)}
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
                disabled={redeem.isPending || (needsAdvisorPick && !selectedAdvisorId)}
                onPress={handleConfirm}
              >
                {redeem.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm</Text>}
              </TouchableOpacity>
            </ScrollView>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Enter your plan coupon code to upgrade or extend your plan.</Text>
              {pickedPlan ? (
                <View style={styles.hintBox}>
                  <Ionicons name="arrow-down-circle" size={14} color={theme.primary} />
                  <Text style={styles.hintText}>Ask your admin/advisor for a {pickedPlan} coupon code, or pay via UPI instead.</Text>
                </View>
              ) : null}
              {pickedPlan ? (
                <TouchableOpacity style={[styles.submitBtn, { backgroundColor: '#1d4ed8' }]} onPress={() => setMode('UPI')}>
                  <Text style={styles.submitBtnText}>Pay ₹ via UPI for {pickedPlan}</Text>
                </TouchableOpacity>
              ) : null}
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
              <TouchableOpacity style={styles.submitBtn} disabled={preview.isPending} onPress={handleCheckCode}>
                {preview.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Check Code</Text>}
              </TouchableOpacity>

              <TouchableOpacity style={styles.seePlansBtn} onPress={() => setShowChart((v) => !v)}>
                <Ionicons name="stats-chart-outline" size={14} color={theme.primary} />
                <Text style={styles.seePlansBtnText}>{showChart ? 'Hide Plans' : 'See Plans'}</Text>
                <Ionicons name={showChart ? 'chevron-up' : 'chevron-down'} size={14} color={theme.primary} />
              </TouchableOpacity>

              {showChart ? (
                <PlanComparisonChart
                  plans={plans}
                  currentPlan={currentPlan}
                  isExpired={isExpired}
                  inGrace={inGrace}
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

/** Generates a fixed-amount UPI link + QR for the picked plan, opens the farmer's UPI app, then lets them mark it paid for admin verification. */
function UpiUpgradeFlow({
  plan,
  onDone,
  onSwitchToCode,
  onPickDifferentPlan,
}: {
  plan: FarmerPlanType;
  onDone: () => void;
  onSwitchToCode: () => void;
  onPickDifferentPlan: () => void;
}) {
  const initiate = useInitiateFarmerPlanPayment();
  const submit = useSubmitFarmerPlanPayment();
  const [request, setRequest] = useState<InitiateFarmerPlanPaymentResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    try {
      const res = await initiate.mutateAsync({ targetPlan: plan });
      setRequest(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not start payment. Try again.');
    }
  };

  const handleOpenUpiApp = async () => {
    if (!request) return;
    try {
      await Linking.openURL(request.upiLink);
    } catch {
      setError('No UPI app found on this device.');
    }
  };

  const handleSubmit = async () => {
    if (!request) return;
    try {
      await submit.mutateAsync({ id: request.id });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not submit payment for verification.');
    }
  };

  if (submitted) {
    return (
      <View style={{ gap: 10 }}>
        <View style={styles.successBox}>
          <Ionicons name="time" size={20} color="#16a34a" />
          <Text style={styles.successText}>Payment submitted! An admin will verify and confirm it shortly — you'll get a notification once your {plan} plan is active.</Text>
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={onDone}>
          <Text style={styles.submitBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (request) {
    return (
      <View style={{ gap: 10, alignItems: 'center' }}>
        <Text style={[styles.label, { alignSelf: 'flex-start' }]}>
          {plan} plan: pay ₹{request.amount} via UPI. Note carries your ID ({request.farmer.kingId ?? request.farmerId}) so it's easy to match.
        </Text>
        <View style={styles.qrBox}>
          <QRCode value={request.upiLink} size={180} />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={[styles.submitBtn, { width: '100%' }]} onPress={handleOpenUpiApp}>
          <Text style={styles.submitBtnText}>Open in UPI App</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Paid already? Tap below once the payment goes through — it opens for admin verification.</Text>
        <TouchableOpacity style={[styles.submitBtn, styles.submitBtnSecondary, { width: '100%' }]} disabled={submit.isPending} onPress={handleSubmit}>
          {submit.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>I've Paid</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.label}>Pay the fixed {plan} plan amount via UPI. An admin verifies it and your plan activates immediately after.</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.submitBtn} disabled={initiate.isPending} onPress={handleGenerate}>
        {initiate.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Get UPI Payment Link</Text>}
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
});
