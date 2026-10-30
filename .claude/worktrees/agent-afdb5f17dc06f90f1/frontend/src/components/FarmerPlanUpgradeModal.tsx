import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';
import { usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon } from '../hooks/useFarmerPlan';

const theme = RoleThemes.FARMER;

/** Coupon-code redeem flow for the Farmer plan (FREE -> BASIC/PREMIUM upgrade, or extend/renew an existing paid plan). */
export function FarmerPlanUpgradeModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const preview = usePreviewFarmerPlanCoupon();
  const redeem = useRedeemFarmerPlanCoupon();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>> | null>(null);

  const reset = () => {
    setCode('');
    setError(null);
    setPreviewResult(null);
    setResult(null);
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
      const res = await preview.mutateAsync(code.trim().toUpperCase());
      setPreviewResult(res);
    } catch (err: any) {
      setPreviewResult(null);
      setError(err?.response?.data?.message ?? 'Invalid or already-used code.');
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await redeem.mutateAsync(code.trim().toUpperCase());
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

          {result ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  {result.plan.plan} plan active! New expiry: {new Date(result.newEndDate).toLocaleDateString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={closeAndReset}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : previewResult ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="pricetag" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  This code activates the {previewResult.plan} plan for {previewResult.daysGranted} day(s). New expiry:{' '}
                  {new Date(previewResult.newEndDate).toLocaleDateString('en-IN')}.
                </Text>
              </View>
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={styles.submitBtn} disabled={redeem.isPending} onPress={handleConfirm}>
                {redeem.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Enter your plan coupon code to upgrade or extend your plan.</Text>
              <TextInput
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
            </View>
          )}
        </View>
      </View>
    </Modal>
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
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#15803d' },
});
