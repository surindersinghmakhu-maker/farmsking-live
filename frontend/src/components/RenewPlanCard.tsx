import React, { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';
import { useSubscriptionStatus } from '../hooks/useSubscriptionStatus';
import { usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon } from '../hooks/useFarmerPlan';
import { useInitiatePlanPayment, useSubmitPlanPayment } from '../hooks/usePlanPayments';
import type { InitiatePlanPaymentResponse } from '../api/planPayments.api';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/** Shows the farmer's current plan expiry and a code-redeem flow to extend it. */
export function RenewPlanCard() {
  const { data: subscription, isLoading } = useSubscriptionStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading || !subscription) return null;

  const endDate = subscription.endDate ? new Date(subscription.endDate) : null;
  const isExpired = endDate ? endDate.getTime() < Date.now() : false;
  const daysRemaining = endDate ? Math.ceil((endDate.getTime() - Date.now()) / 86_400_000) : null;

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <View style={styles.row}>
        <View style={[styles.iconBg, isExpired && { backgroundColor: '#fee2e2' }]}>
          <Ionicons name="refresh-circle" size={22} color={isExpired ? '#dc2626' : theme.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{subscription.plan?.name ?? 'Advisor Plan'}</Text>
          {endDate ? (
            <Text style={[styles.subtitle, isExpired && { color: '#dc2626' }]}>
              {isExpired ? 'Expired' : `${daysRemaining} day(s) left`} · {endDate.toLocaleDateString('en-IN')}
            </Text>
          ) : (
            <Text style={styles.subtitle}>No active end date</Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.renewBtn}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setIsModalOpen(true);
          }}
        >
          <Text style={styles.renewBtnText}>Renew</Text>
        </TouchableOpacity>
      </View>

      <RenewModal visible={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </View>
  );
}

/** Renew flow with two tabs: pay a fixed amount via UPI (then an admin verifies), or redeem a code from an admin. Reused for a farmer renewing their own plan and an advisor renewing on behalf of one of their farmers (pass `farmerId`). */
export function RenewModal({ visible, onClose, farmerId }: { visible: boolean; onClose: () => void; farmerId?: string }) {
  const [mode, setMode] = useState<'upi' | 'code'>('upi');

  const closeAndReset = () => {
    setMode('upi');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAndReset}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Renew {farmerId ? "Farmer's" : 'Your'} Plan</Text>
            <TouchableOpacity onPress={closeAndReset}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.tabRow}>
            <TouchableOpacity style={[styles.tabBtn, mode === 'upi' && styles.tabBtnActive]} onPress={() => setMode('upi')}>
              <Text style={[styles.tabBtnText, mode === 'upi' && styles.tabBtnTextActive]}>Pay via UPI</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn, mode === 'code' && styles.tabBtnActive]} onPress={() => setMode('code')}>
              <Text style={[styles.tabBtnText, mode === 'code' && styles.tabBtnTextActive]}>Have a Code</Text>
            </TouchableOpacity>
          </View>

          {mode === 'upi' ? <UpiPaymentFlow farmerId={farmerId} onDone={closeAndReset} /> : <CodeRedeemFlow farmerId={farmerId} onDone={closeAndReset} />}
        </View>
      </View>
    </Modal>
  );
}

/** Generates a fixed-amount UPI link for the plan, opens the farmer's UPI app, then lets them mark it paid for admin verification. */
function UpiPaymentFlow({ farmerId, onDone }: { farmerId?: string; onDone: () => void }) {
  const initiate = useInitiatePlanPayment();
  const submit = useSubmitPlanPayment();
  const [request, setRequest] = useState<InitiatePlanPaymentResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    try {
      const res = await initiate.mutateAsync(farmerId);
      setRequest(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not start payment. Try again.');
    }
  };

  const handleOpenUpiApp = async () => {
    if (!request) return;
    tap();
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
          <Text style={styles.successText}>Payment submitted! An admin will verify and confirm it shortly — you'll get a notification once it's approved.</Text>
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={onDone}>
          <Text style={styles.submitBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (request) {
    return (
      <View style={{ gap: 10 }}>
        <View style={styles.successBox}>
          <Ionicons name="pricetag" size={20} color="#16a34a" />
          <Text style={styles.successText}>
            {request.subscription.plan.name}: pay ₹{request.amount} via UPI. Note carries your ID ({request.farmer.kingId ?? request.farmerId}) so it's easy to match.
          </Text>
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.submitBtn} onPress={handleOpenUpiApp}>
          <Text style={styles.submitBtnText}>Open in UPI App</Text>
        </TouchableOpacity>
        <Text style={styles.label}>Paid already? Tap below once the payment goes through — it opens for admin verification.</Text>
        <TouchableOpacity style={[styles.submitBtn, styles.submitBtnSecondary]} disabled={submit.isPending} onPress={handleSubmit}>
          {submit.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>I've Paid</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.label}>Pay the fixed plan amount via UPI. An admin verifies it and confirms your renewal.</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.submitBtn} disabled={initiate.isPending} onPress={handleGenerate}>
        {initiate.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Get UPI Payment Link</Text>}
      </TouchableOpacity>
    </View>
  );
}

/** Preview a code's plan/days/new-expiry first, then confirm to actually apply it. Works for BASIC/STANDARD/PREMIUM codes — STANDARD and PREMIUM also hire a Farm Advisor. */
function CodeRedeemFlow({ farmerId, onDone }: { farmerId?: string; onDone: () => void }) {
  const preview = usePreviewFarmerPlanCoupon();
  const redeem = useRedeemFarmerPlanCoupon();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>> | null>(null);

  const handleCheckCode = async () => {
    if (!code.trim()) {
      setError('Enter your plan code.');
      return;
    }
    setError(null);
    try {
      const res = await preview.mutateAsync({ code: code.trim().toUpperCase(), farmerId });
      setPreviewResult(res);
    } catch (err: any) {
      setPreviewResult(null);
      setError(err?.response?.data?.message ?? 'Invalid or already-used code.');
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await redeem.mutateAsync({ code: code.trim().toUpperCase(), farmerId });
      setResult(res);
    } catch (err: any) {
      setPreviewResult(null);
      setError(err?.response?.data?.message ?? 'Invalid or already-used code.');
    }
  };

  if (result) {
    return (
      <View style={{ gap: 10 }}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={styles.successText}>
            {result.plan.plan} plan active! New expiry: {new Date(result.newEndDate).toLocaleDateString('en-IN')}
            {result.advisorHired ? ' A Farm Advisor has been assigned.' : ''}
          </Text>
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={onDone}>
          <Text style={styles.submitBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (previewResult) {
    const isSamePlan = previewResult.plan === previewResult.currentPlan;
    const isDowngradeKept = previewResult.resultPlan !== previewResult.plan;
    return (
      <View style={{ gap: 10 }}>
        <View style={styles.successBox}>
          <Ionicons name="pricetag" size={20} color="#16a34a" />
          <Text style={styles.successText}>
            {isDowngradeKept
              ? `This code adds ${previewResult.daysGranted} day(s) to your ${previewResult.resultPlan} plan.`
              : `This code activates the ${previewResult.plan} plan for ${previewResult.daysGranted} day(s).`}
            {' '}New expiry will be {new Date(previewResult.newEndDate).toLocaleDateString('en-IN')}.
            {previewResult.includesAdvisor ? ' Includes a Farm Advisor.' : ''}
          </Text>
        </View>
        {isDowngradeKept ? (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={18} color="#b45309" />
            <Text style={styles.warningText}>
              You already have the {previewResult.resultPlan} plan active, which is higher than this {previewResult.plan} code — your plan won't be downgraded, this code's {previewResult.daysGranted} day(s) will just be added to your current {previewResult.resultPlan} plan.
            </Text>
          </View>
        ) : isSamePlan ? (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={18} color="#b45309" />
            <Text style={styles.warningText}>
              You already have the {previewResult.plan} plan active — applying this code won't change your plan, it will just add {previewResult.daysGranted} day(s) to your current validity.
            </Text>
          </View>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        <TouchableOpacity style={styles.submitBtn} disabled={redeem.isPending} onPress={handleConfirm}>
          {redeem.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.label}>Enter the plan code {farmerId ? 'for this farmer' : 'your admin gave you'}</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. P738610"
        placeholderTextColor="#94a3b8"
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.submitBtn} disabled={preview.isPending} onPress={handleCheckCode}>
        {preview.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Check Code</Text>}
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1.5, borderColor: '#e2e8f0' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  subtitle: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  renewBtn: { backgroundColor: theme.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: RADIUS.pill },
  renewBtnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, gap: 8, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  tabRow: { flexDirection: 'row', gap: 8, backgroundColor: '#f1f5f9', borderRadius: RADIUS.md, padding: 4, marginBottom: 4 },
  tabBtn: { flex: 1, paddingVertical: 9, borderRadius: RADIUS.sm, alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#ffffff', ...premiumShadow('#0f172a', 'sm') },
  tabBtnText: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#64748b' },
  tabBtnTextActive: { color: theme.primary },
  label: { fontSize: 12, fontFamily: FONT.semiBold, color: '#64748b' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnSecondary: { backgroundColor: '#0f172a' },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#15803d' },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fffbeb', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#92400e', lineHeight: 16 },
});
