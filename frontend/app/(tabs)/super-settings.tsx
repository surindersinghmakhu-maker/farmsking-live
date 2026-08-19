import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/store/auth-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerPlanPricing, useUpdateFarmerPlanPricing } from '@/src/hooks/useFarmerPlan';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import { useCouponSettings, useUpdateCouponSettings } from '@/src/hooks/useCouponSettings';
import type { FarmerPlanPricing } from '@/src/api/farmerPlans.api';
import { SwitchDashboardSection } from '@/src/components/SwitchDashboardSection';
import { uploadPhoto } from '@/src/api/uploads.api';
import { resolveMediaUrl } from '@/src/api/client';

const theme = RoleThemes.SUPER_ADMIN;

export default function SuperSettingsScreen() {
  const { logout } = useAuth();

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Settings</Text>
        <Text style={styles.heroSubtitle}>Platform configuration</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <SwitchDashboardSection />

        <BrandingSection />

        <UpiSettingsSection />
      </ScrollView>
    </View>
  );
}

function BrandingSection() {
  const { data: settings, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isEditingTagline, setIsEditingTagline] = useState(false);
  const [taglineDraft, setTaglineDraft] = useState('');

  const startEditingTagline = () => {
    setTaglineDraft(settings?.tagline ?? '');
    setError(null);
    setIsEditingTagline(true);
  };

  const saveTagline = async () => {
    setError(null);
    try {
      await update.mutateAsync({ tagline: taglineDraft.trim() });
      setIsEditingTagline(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save the tagline. Please try again.');
    }
  };

  const pickLogo = async () => {
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Please allow photo access to upload a logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    setIsUploading(true);
    try {
      const uploaded = await uploadPhoto(result.assets[0].uri);
      await update.mutateAsync({ logoUrl: uploaded.fileUrl });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not upload the logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Farmsking Brand</Text>

      <Text style={[styles.label, { marginTop: 4 }]}>Logo</Text>
      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 10 }} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginTop: 8 }}>
          {settings?.logoUrl ? (
            <Image source={{ uri: resolveMediaUrl(settings.logoUrl) }} style={styles.logoPreview} />
          ) : (
            <View style={[styles.logoPreview, styles.logoPlaceholder]}>
              <Ionicons name="image-outline" size={26} color="#94a3b8" />
            </View>
          )}
          <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginTop: 0 }]} disabled={isUploading} onPress={pickLogo}>
            {isUploading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>{settings?.logoUrl ? 'Change Logo' : 'Upload Logo'}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Text style={[styles.label, { marginTop: 12 }]}>Tagline (shown below the logo on bills & receipts)</Text>
      {isEditingTagline ? (
        <>
          <TextInput
            style={styles.input}
            value={taglineDraft}
            onChangeText={setTaglineDraft}
            placeholder="e.g. Trusted by farmers, powered by experts"
          />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#e2e8f0' }]} onPress={() => setIsEditingTagline(false)}>
              <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} disabled={update.isPending} onPress={saveTagline}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <TouchableOpacity style={styles.priceRow} activeOpacity={0.8} onPress={startEditingTagline}>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceRowTitle}>{settings?.tagline || 'Not set'}</Text>
          </View>
          <Ionicons name="create-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      )}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {saved ? <Text style={[styles.helperText, { color: '#16a34a' }]}>✓ Saved.</Text> : null}
    </View>
  );
}

function UpiSettingsSection() {
  const { data: settings, isLoading } = useAppSettings();
  const update = useUpdateAppSettings();
  const [upiId, setUpiId] = useState('');
  const [upiPayeeName, setUpiPayeeName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    setUpiId(settings?.upiId ?? '');
    setUpiPayeeName(settings?.upiPayeeName ?? '');
    setError(null);
    setSaved(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    if (!upiId.trim()) {
      setError('Enter a UPI ID.');
      return;
    }
    try {
      await update.mutateAsync({ upiId: upiId.trim(), upiPayeeName: upiPayeeName.trim() || undefined });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save UPI settings.');
    }
  };

  return (
    <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>UPI Payment ID</Text>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 10 }} />
      ) : isEditing ? (
        <>
          <Text style={styles.label}>UPI ID</Text>
          <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="yourname@bank" autoCapitalize="none" />
          <Text style={styles.label}>Payee Name (shown in the paying app)</Text>
          <TextInput style={styles.input} value={upiPayeeName} onChangeText={setUpiPayeeName} placeholder="FarmsKing" />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#e2e8f0' }]} onPress={() => setIsEditing(false)}>
              <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} disabled={update.isPending} onPress={handleSave}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <TouchableOpacity style={styles.priceRow} activeOpacity={0.8} onPress={startEditing}>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceRowTitle}>{settings?.upiId || 'Not configured'}</Text>
            <Text style={styles.priceRowMeta}>Payee name: {settings?.upiPayeeName || 'FarmsKing'}</Text>
          </View>
          <Ionicons name="create-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      )}
      {saved ? <Text style={[styles.helperText, { color: '#16a34a' }]}>✓ UPI settings saved.</Text> : null}
    </View>
  );
}

function PartnerCouponSettingsSection() {
  const { data: settings, isLoading } = useCouponSettings();
  const update = useUpdateCouponSettings();
  const [discountPercent, setDiscountPercent] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountCap, setMaxDiscountCap] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const startEditing = () => {
    setDiscountPercent(settings?.partnerCouponDiscountPercent ?? '10');
    setCommissionPercent(settings?.partnerCouponCommissionPercent ?? '5');
    setMinOrderAmount(settings?.partnerCouponMinOrderAmount ?? '500');
    setMaxDiscountCap(settings?.partnerCouponMaxDiscountCap ?? '100');
    setValidityDays(String(settings?.partnerCouponValidityDays ?? 365));
    setError(null);
    setSaved(false);
    setIsEditing(true);
  };

  const handleSave = async () => {
    setError(null);
    if (!discountPercent || !commissionPercent || !minOrderAmount || !maxDiscountCap || !validityDays) {
      setError('Fill in all fields.');
      return;
    }
    try {
      await update.mutateAsync({
        partnerCouponDiscountPercent: Number(discountPercent),
        partnerCouponCommissionPercent: Number(commissionPercent),
        partnerCouponMinOrderAmount: Number(minOrderAmount),
        partnerCouponMaxDiscountCap: Number(maxDiscountCap),
        partnerCouponValidityDays: Number(validityDays),
      });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save these settings.');
    }
  };

  return (
    <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Partners Referral Coupon</Text>
      <Text style={styles.helperText}>
        Auto-issued to every new Business Partner: 5% commission, 10% capped discount, min order applies.
      </Text>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 10 }} />
      ) : isEditing ? (
        <>
          <Text style={styles.label}>Customer Discount (%)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={discountPercent} onChangeText={setDiscountPercent} />
          <Text style={styles.label}>Partner Commission (%)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={commissionPercent} onChangeText={setCommissionPercent} />
          <Text style={styles.label}>Minimum Order Amount (₹)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={minOrderAmount} onChangeText={setMinOrderAmount} />
          <Text style={styles.label}>Maximum Customer Discount (₹)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={maxDiscountCap} onChangeText={setMaxDiscountCap} />
          <Text style={styles.label}>Validity (days from issue)</Text>
          <TextInput style={styles.input} keyboardType="numeric" value={validityDays} onChangeText={setValidityDays} />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#e2e8f0' }]} onPress={() => setIsEditing(false)}>
              <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} disabled={update.isPending} onPress={handleSave}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <TouchableOpacity style={styles.priceRow} activeOpacity={0.8} onPress={startEditing}>
          <View style={{ flex: 1 }}>
            <Text style={styles.priceRowTitle}>
              {settings?.partnerCouponDiscountPercent ?? 10}% discount upto ₹{settings?.partnerCouponMaxDiscountCap ?? 100}
            </Text>
            <Text style={styles.priceRowMeta}>
              {settings?.partnerCouponCommissionPercent ?? 5}% partner commission · Min order ₹{settings?.partnerCouponMinOrderAmount ?? 500} · Valid{' '}
              {settings?.partnerCouponValidityDays ?? 365} days
            </Text>
          </View>
          <Ionicons name="create-outline" size={18} color={theme.primary} />
        </TouchableOpacity>
      )}
      {saved ? <Text style={[styles.helperText, { color: '#16a34a' }]}>✓ Settings saved.</Text> : null}
    </View>
  );
}

function PlanPricingSection() {
  const { data: pricing, isLoading } = useFarmerPlanPricing();
  const [editing, setEditing] = useState<FarmerPlanPricing | null>(null);

  return (
    <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Plan Pricing & Commission Splits</Text>
      <Text style={styles.helperText}>Only the Super Admin can edit these — changes apply the next time a coupon for that plan is redeemed.</Text>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
      ) : !pricing || pricing.length === 0 ? (
        <Text style={styles.emptyText}>No pricing configured yet.</Text>
      ) : (
        <View style={{ gap: 8 }}>
          {pricing.map((p) => (
            <TouchableOpacity key={p.id} style={styles.priceRow} activeOpacity={0.8} onPress={() => setEditing(p)}>
              <View style={{ flex: 1 }}>
                <Text style={styles.priceRowTitle}>{p.plan}</Text>
                <Text style={styles.priceRowMeta}>
                  ₹{p.price} / {p.billingPeriodDays === 365 ? 'year' : `${p.billingPeriodDays}d`} · Partner{' '}
                  {p.partnerShareType === 'PERCENTAGE' ? `${p.partnerShareValue}%` : `₹${p.partnerShareValue}`}
                  {p.advisorShareValue ? ` · Advisor ₹${p.advisorShareValue}` : ''}
                </Text>
              </View>
              <Ionicons name="create-outline" size={16} color={theme.primary} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <EditPricingModal pricing={editing} onClose={() => setEditing(null)} />
    </View>
  );
}

function EditPricingModal({ pricing, onClose }: { pricing: FarmerPlanPricing | null; onClose: () => void }) {
  const update = useUpdateFarmerPlanPricing();
  const [price, setPrice] = useState('');
  const [billingPeriodDays, setBillingPeriodDays] = useState('');
  const [partnerShareType, setPartnerShareType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [partnerShareValue, setPartnerShareValue] = useState('');
  const [advisorShareValue, setAdvisorShareValue] = useState('');
  const [adminShareValue, setAdminShareValue] = useState('');
  const [partnerGenerationCostPercent, setPartnerGenerationCostPercent] = useState('');
  const [advisorGenerationCostPercent, setAdvisorGenerationCostPercent] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (pricing) {
      setPrice(pricing.price);
      setBillingPeriodDays(String(pricing.billingPeriodDays));
      setPartnerShareType(pricing.partnerShareType);
      setPartnerShareValue(pricing.partnerShareValue);
      setAdvisorShareValue(pricing.advisorShareValue ?? '');
      setAdminShareValue(pricing.adminShareValue ?? '');
      setPartnerGenerationCostPercent(pricing.partnerGenerationCostPercent ?? '');
      setAdvisorGenerationCostPercent(pricing.advisorGenerationCostPercent ?? '');
      setError(null);
    }
  }, [pricing]);

  if (!pricing) return null;

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        plan: pricing.plan,
        payload: {
          price: Number(price),
          billingPeriodDays: Number(billingPeriodDays),
          partnerShareType,
          partnerShareValue: Number(partnerShareValue),
          advisorShareValue: advisorShareValue ? Number(advisorShareValue) : undefined,
          adminShareValue: adminShareValue ? Number(adminShareValue) : undefined,
          partnerGenerationCostPercent: partnerGenerationCostPercent ? Number(partnerGenerationCostPercent) : undefined,
          advisorGenerationCostPercent: advisorGenerationCostPercent ? Number(advisorGenerationCostPercent) : undefined,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save pricing.');
    }
  };

  return (
    <Modal visible={!!pricing} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{pricing.plan} Plan Pricing</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Text style={styles.label}>Price (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={price} onChangeText={setPrice} />

            <Text style={styles.label}>Billing Period (days)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={billingPeriodDays} onChangeText={setBillingPeriodDays} />

            <Text style={styles.label}>Business Partner Commission Type</Text>
            <View style={styles.chipRow}>
              {(['FIXED', 'PERCENTAGE'] as const).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.farmerChip, partnerShareType === t && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setPartnerShareType(t)}
                >
                  <Text style={[styles.farmerChipText, partnerShareType === t && { color: '#ffffff' }]}>
                    {t === 'FIXED' ? 'Fixed ₹' : 'Percentage %'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Business Partner Share ({partnerShareType === 'FIXED' ? '₹' : '%'})</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={partnerShareValue} onChangeText={setPartnerShareValue} />

            <Text style={styles.label}>Advisor Share (₹, optional — leave blank if plan has no advisor)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={advisorShareValue} onChangeText={setAdvisorShareValue} />

            <Text style={styles.label}>Platform/Admin Share (₹, informational only)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={adminShareValue} onChangeText={setAdminShareValue} />

            <Text style={styles.label}>Business Partner Generation Cost (%, debited from their wallet the moment a coupon is issued to them)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={partnerGenerationCostPercent} onChangeText={setPartnerGenerationCostPercent} />

            <Text style={styles.label}>Advisor Generation Cost (%, debited from their wallet the moment a coupon is issued to them)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={advisorGenerationCostPercent} onChangeText={setAdvisorGenerationCostPercent} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} disabled={update.isPending} onPress={handleSave}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Pricing</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  logoPreview: { width: 64, height: 64, borderRadius: RADIUS.md, backgroundColor: '#f1f5f9' },
  logoPlaceholder: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  list: { padding: SPACING.lg, gap: 12, paddingBottom: SPACING.xxl },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 10 },
  sectionTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  helperText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8' },
  priceRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  priceRowTitle: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  priceRowMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  logoutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  logoutText: { fontSize: 13, fontFamily: FONT.bold, color: '#dc2626' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '88%', backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  farmerChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  farmerChipText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#334155' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
});
