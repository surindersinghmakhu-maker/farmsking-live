import React, { useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

/** Shows the farmer's current membership expiry and a code-redeem flow to extend it. */
export function RenewMembershipCard() {
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
          <Text style={styles.title}>{subscription.plan?.name ?? 'Advisor VIP Pass'}</Text>
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

export const RenewPlanCard = RenewMembershipCard;

/** Renew flow with two tabs: pay a fixed amount via UPI (then an admin verifies), or redeem a code from an admin. Reused for a farmer renewing their own membership and an advisor renewing on behalf of one of their farmers (pass `farmerId`). */
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
            <Text style={styles.modalTitle}>Renew {farmerId ? "Farmer's" : 'Your'} VIP Pass</Text>
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

          <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', padding: 8, borderRadius: RADIUS.sm, marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="shield-checkmark" size={15} color="#16a34a" />
            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#166534', flex: 1 }}>
              Continuous Coverage: Renewing extends your validity directly from your previous expiry date.
            </Text>
          </View>

          {mode === 'upi' ? <UpiPaymentFlow farmerId={farmerId} onDone={closeAndReset} /> : <CodeRedeemFlow farmerId={farmerId} onDone={closeAndReset} />}
        </View>
      </View>
    </Modal>
  );
}

/** Generates a fixed-amount UPI QR for the membership, displays on PC screen or opens on mobile, then lets them submit the 12-digit UTR for admin verification. */
function UpiPaymentFlow({ farmerId, onDone }: { farmerId?: string; onDone: () => void }) {
  const initiate = useInitiatePlanPayment();
  const submit = useSubmitPlanPayment();
  const [request, setRequest] = useState<InitiatePlanPaymentResponse | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [utr, setUtr] = useState('');
  const [copiedVpa, setCopiedVpa] = useState(false);

  const handleGenerate = async () => {
    setError(null);
    try {
      const res = await initiate.mutateAsync(farmerId);
      setRequest(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not start payment. Try again.');
    }
  };

  const handleCopyVpa = (vpa: string) => {
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(vpa);
    }
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  const handleOpenUpiApp = async () => {
    if (!request) return;
    tap();
    try {
      await Linking.openURL(request.upiLink);
    } catch {
      setError('No UPI app found on this device. Please scan the QR code above.');
    }
  };

  const handleSubmit = async () => {
    if (!request) return;
    if (!utr.trim()) {
      setError('Please enter the 12-digit UPI UTR / Transaction reference number.');
      return;
    }
    setError(null);
    try {
      await submit.mutateAsync({ id: request.id, utr: utr.trim() });
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not submit payment for verification.');
    }
  };

  if (submitted) {
    return (
      <View style={{ gap: 10 }}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
          <Text style={styles.successText}>Payment submitted successfully! Your plan will be verified and activated shortly.</Text>
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={onDone}>
          <Text style={styles.submitBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (request) {
    const payeeVpa = request.payeeVpa || 'surindersinghmakhu-8@okicici';
    return (
      <View style={{ gap: 10 }}>
        <View style={styles.successBox}>
          <Ionicons name="pricetag" size={20} color="#16a34a" />
          <Text style={styles.successText}>
            {request.subscription.plan.name}: Pay ₹{request.amount} via UPI QR. Note: FK-{(request.farmer.kingId ?? request.farmerId).slice(0, 10)}
          </Text>
        </View>

        {/* In-Modal Direct QR Code (Never opens blank upi:// tab on PC Web) */}
        <View style={styles.qrCard}>
          <Text style={styles.qrCardTitle}>Step 1: Scan QR Code with Any UPI App</Text>
          <Text style={styles.qrCardSub}>Google Pay · PhonePe · Paytm · BHIM · Mobile Banking</Text>
          <Image
            source={{
              uri: `https://api.qrserver.com/v1/create-qr-code/?size=280x280&margin=1&ecc=H&data=${encodeURIComponent(request.upiLink)}`,
            }}
            style={styles.qrImg}
            resizeMode="contain"
          />
          <View style={styles.vpaRow}>
            <Text style={styles.vpaLabel}>UPI ID:</Text>
            <Text style={styles.vpaVal}>{payeeVpa}</Text>
            <TouchableOpacity style={styles.copyBtn} onPress={() => handleCopyVpa(payeeVpa)}>
              <Ionicons name={copiedVpa ? 'checkmark' : 'copy-outline'} size={12} color="#ffffff" />
              <Text style={styles.copyBtnText}>{copiedVpa ? 'Copied' : 'Copy'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mobile Native App Intent Only (Zero blank tab on PC Web) */}
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.submitBtn} onPress={handleOpenUpiApp}>
            <Text style={styles.submitBtnText}>Open in UPI App on Phone</Text>
          </TouchableOpacity>
        )}

        {/* Step 2: 12-Digit UTR Input */}
        <View style={{ gap: 4, marginTop: 4 }}>
          <Text style={styles.label}>Step 2: Enter 12-Digit UPI Transaction / UTR Number</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 431289567812"
            placeholderTextColor="#94a3b8"
            value={utr}
            onChangeText={setUtr}
            keyboardType="number-pad"
            maxLength={22}
          />
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[styles.submitBtn, styles.submitBtnSecondary]} disabled={submit.isPending} onPress={handleSubmit}>
          {submit.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Verify & Confirm Renewal</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <Text style={styles.label}>Pay the fixed VIP Pass amount via UPI QR. An admin verifies your UTR to confirm your renewal.</Text>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <TouchableOpacity style={styles.submitBtn} disabled={initiate.isPending} onPress={handleGenerate}>
        {initiate.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Get UPI Payment QR</Text>}
      </TouchableOpacity>
    </View>
  );
}

/** Preview a code's membership/days/new-expiry first, then confirm to actually apply it. Works for BASIC/STANDARD/PREMIUM codes — STANDARD and PREMIUM also hire a Farm Advisor. */
function CodeRedeemFlow({ farmerId, onDone }: { farmerId?: string; onDone: () => void }) {
  const preview = usePreviewFarmerPlanCoupon();
  const redeem = useRedeemFarmerPlanCoupon();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>> | null>(null);

  const handleCheckCode = async () => {
    if (!code.trim()) {
      setError('Enter your VIP Pass code.');
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
            {result.plan.plan} VIP Pass active! New expiry: {new Date(result.newEndDate).toLocaleDateString('en-IN')}
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
              ? `This code adds ${previewResult.daysGranted} day(s) to your ${previewResult.resultPlan} VIP Pass.`
              : `This code activates the ${previewResult.plan} VIP Pass for ${previewResult.daysGranted} day(s).`}
            {' '}New expiry will be {new Date(previewResult.newEndDate).toLocaleDateString('en-IN')}.
            {previewResult.includesAdvisor ? ' Includes a Farm Advisor.' : ''}
          </Text>
        </View>
        {isDowngradeKept ? (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={18} color="#b45309" />
            <Text style={styles.warningText}>
              You already have the {previewResult.resultPlan} VIP Pass active, which is higher than this {previewResult.plan} code — your VIP Pass won't be downgraded, this code's {previewResult.daysGranted} day(s) will just be added to your current {previewResult.resultPlan} VIP Pass.
            </Text>
          </View>
        ) : isSamePlan ? (
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle" size={18} color="#b45309" />
            <Text style={styles.warningText}>
              You already have the {previewResult.plan} VIP Pass active — applying this code won't change your VIP Pass, it will just add {previewResult.daysGranted} day(s) to your current validity.
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
      <Text style={styles.label}>Enter the VIP Pass code {farmerId ? 'for this farmer' : 'your admin gave you'}</Text>
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
  qrCard: { backgroundColor: '#f8fafc', borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center', gap: 6 },
  qrCardTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  qrCardSub: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' },
  qrImg: { width: 170, height: 170, backgroundColor: '#ffffff', borderRadius: 8, marginVertical: 4, borderWidth: 1, borderColor: '#cbd5e1' },
  vpaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1' },
  vpaLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#64748b' },
  vpaVal: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  copyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  copyBtnText: { color: '#ffffff', fontSize: 10.5, fontFamily: FONT.bold },
});
