import React, { useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';
import { usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon } from '../hooks/useFarmerPlan';
import { useLookupByKingId } from '../hooks/useUsersAdmin';

/**
 * Lets an advisor/admin/business partner apply a farmer-plan coupon on behalf of any farmer, identified by
 * their FarmsKing ID rather than needing an existing assigned-farmer relationship.
 */
export function RedeemForFarmerModal({ visible, onClose, theme }: { visible: boolean; onClose: () => void; theme: (typeof RoleThemes)['FARMER'] }) {
  const lookup = useLookupByKingId();
  const preview = usePreviewFarmerPlanCoupon();
  const redeem = useRedeemFarmerPlanCoupon();

  const [kingId, setKingId] = useState('');
  const [farmer, setFarmer] = useState<{ id: string; name: string; kingId: string | null } | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>> | null>(null);

  const reset = () => {
    setKingId('');
    setFarmer(null);
    setCode('');
    setError(null);
    setPreviewResult(null);
    setResult(null);
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  const handleLookup = async () => {
    if (!kingId.trim()) {
      setError('Enter the farmer\'s FarmsKing ID.');
      return;
    }
    setError(null);
    try {
      const found = await lookup.mutateAsync(kingId.trim().toUpperCase());
      setFarmer(found);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'No farmer found with that FarmsKing ID.');
    }
  };

  const handleCheckCode = async () => {
    if (!code.trim() || !farmer) return;
    setError(null);
    try {
      const res = await preview.mutateAsync({ code: code.trim().toUpperCase(), farmerId: farmer.id });
      setPreviewResult(res);
    } catch (err: any) {
      setPreviewResult(null);
      setError(err?.response?.data?.message ?? 'Invalid or already-used code.');
    }
  };

  const handleConfirm = async () => {
    if (!farmer) return;
    try {
      const res = await redeem.mutateAsync({ code: code.trim().toUpperCase(), farmerId: farmer.id });
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
            <Text style={styles.title}>Apply Coupon for a Farmer</Text>
            <TouchableOpacity onPress={closeAndReset}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {result ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  {result.plan.plan} plan active for {farmer?.name}! New expiry: {new Date(result.newEndDate).toLocaleDateString('en-IN')}
                  {result.advisorHired ? ' A Farm Advisor has been assigned.' : ''}
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
                  {previewResult.resultPlan !== previewResult.plan
                    ? `This code adds ${previewResult.daysGranted} day(s) to ${farmer?.name}'s ${previewResult.resultPlan} plan.`
                    : `This code activates the ${previewResult.plan} plan for ${farmer?.name}, ${previewResult.daysGranted} day(s).`}
                  {' '}New expiry: {new Date(previewResult.newEndDate).toLocaleDateString('en-IN')}.
                  {previewResult.includesAdvisor ? ' Includes a Farm Advisor.' : ''}
                </Text>
              </View>
              {previewResult.resultPlan !== previewResult.plan ? (
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle" size={18} color="#b45309" />
                  <Text style={styles.warningText}>
                    {farmer?.name} already has the {previewResult.resultPlan} plan active, higher than this {previewResult.plan} code — their plan won't be downgraded, this code's {previewResult.daysGranted} day(s) will just be added to their current {previewResult.resultPlan} plan.
                  </Text>
                </View>
              ) : previewResult.plan === previewResult.currentPlan ? (
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle" size={18} color="#b45309" />
                  <Text style={styles.warningText}>
                    {farmer?.name} already has the {previewResult.plan} plan active — applying this code won't change their plan, it will just add {previewResult.daysGranted} day(s) to their current validity.
                  </Text>
                </View>
              ) : null}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={styles.submitBtn} disabled={redeem.isPending} onPress={handleConfirm}>
                {redeem.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          ) : farmer ? (
            <View style={{ gap: 10 }}>
              <View style={styles.farmerBox}>
                <Ionicons name="person-circle" size={20} color={theme.primary} />
                <Text style={styles.farmerBoxText}>{farmer.name} · {farmer.kingId}</Text>
                <TouchableOpacity onPress={() => setFarmer(null)}>
                  <Text style={[styles.changeText, { color: theme.primary }]}>Change</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.label}>Enter the plan coupon code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. P738610"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} disabled={preview.isPending} onPress={handleCheckCode}>
                {preview.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Check Code</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              <Text style={styles.label}>Enter the farmer's FarmsKing ID (e.g. 12345678)</Text>
              <TextInput
                style={styles.input}
                placeholder="12345678"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={kingId}
                onChangeText={setKingId}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={[styles.submitBtn, { backgroundColor: theme.primary }]} disabled={lookup.isPending} onPress={handleLookup}>
                {lookup.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Find Farmer</Text>}
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
  submitBtn: { backgroundColor: '#166534', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#15803d' },
  warningBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: '#fffbeb', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#fde68a' },
  warningText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#92400e', lineHeight: 16 },
  farmerBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  farmerBoxText: { flex: 1, fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  changeText: { fontSize: 11.5, fontFamily: FONT.bold },
});
