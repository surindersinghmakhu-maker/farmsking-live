import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { lookupPincode } from '@/src/api/pincode.api';
import { BrandLogo } from '@/src/components/BrandLogo';
import { OtpVerificationModal } from '@/src/components/OtpVerificationModal';
import { PickerModal } from '@/src/components/PickerModal';
import { SOIL_TYPE_OPTIONS, SPRAY_TANK_SIZE_OPTIONS, WATER_TYPE_OPTIONS } from '@/src/constants/farmerProfileOptions';
import { SoilType, SprayTankSizeL, WaterType } from '@/src/types/api';
import { CaptchaChallenge, CaptchaRef } from '@/src/components/CaptchaChallenge';
import { useSearchWorkersByMobile } from '@/src/hooks/useLabour';

const theme = RoleThemes.FARMER;

const FIELDS: { key: 'mobile' | 'name' | 'password' | 'confirmPassword'; label: string; icon: keyof typeof Ionicons.glyphMap; placeholder: string; secure?: boolean; keyboard?: 'phone-pad' }[] = [
  { key: 'mobile', label: 'Mobile Number *', icon: 'call-outline', placeholder: '10-digit mobile number', keyboard: 'phone-pad' },
  { key: 'name', label: 'Full Name *', icon: 'person-outline', placeholder: 'Your name' },
  { key: 'password', label: 'Password *', icon: 'lock-closed-outline', placeholder: 'At least 8 characters', secure: true },
  { key: 'confirmPassword', label: 'Confirm Password *', icon: 'lock-closed-outline', placeholder: 'Re-enter password', secure: true },
];

const ACCOUNT_TYPES: { value: 'CUSTOMER' | 'FARMER' | 'GARDENER'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'CUSTOMER', label: 'Customer', icon: 'cart-outline' },
  { value: 'FARMER', label: 'Farmer', icon: 'leaf-outline' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const captchaRef = useRef<CaptchaRef>(null);
  const { ref: refParam } = useLocalSearchParams<{ ref?: string }>();
  const referredViaLink = typeof refParam === 'string' && refParam.trim().length > 0;
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'FARMER' | 'GARDENER'>('CUSTOMER');
  const [sprayTankSizeL, setSprayTankSizeL] = useState<SprayTankSizeL | null>(20);
  const [soilType, setSoilType] = useState<SoilType | null>(null);
  const [waterType, setWaterType] = useState<WaterType | null>('BOREWELL_TUBEWELL');
  const [upiId, setUpiId] = useState('');
  const [pincode, setPincode] = useState('');
  const [isSoilPickerOpen, setIsSoilPickerOpen] = useState(false);
  const [isWaterPickerOpen, setIsWaterPickerOpen] = useState(false);

  const [values, setValues] = useState({ name: '', mobile: '', password: '', confirmPassword: '' });
  const { data: searchMobileResult, isLoading: isSearchingMobile } = useSearchWorkersByMobile(values.mobile);

  // Auto-fill registered name if King ID user account is found and name is empty
  useEffect(() => {
    if (searchMobileResult?.user?.name && !values.name) {
      setValues((prev) => ({ ...prev, name: searchMobileResult.user!.name }));
    }
  }, [searchMobileResult?.user?.name]);

  const [postOffice, setPostOffice] = useState('');
  const [allOffices, setAllOffices] = useState<string[]>([]);
  const [isPostOfficePickerOpen, setIsPostOfficePickerOpen] = useState(false);
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState(typeof refParam === 'string' ? refParam : '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');

  const selectedSoilLabel = SOIL_TYPE_OPTIONS.find((o) => o.value === soilType)?.label;
  const selectedWaterLabel = WATER_TYPE_OPTIONS.find((o) => o.value === waterType)?.label;

  const onFetchPincode = async (codeToFetch?: string) => {
    setPincodeError(null);
    const targetPin = (codeToFetch ?? pincode).trim();
    if (targetPin.length !== 6) {
      setPincodeError('Enter a valid 6-digit Postal PIN code.');
      return;
    }
    setIsFetchingPincode(true);
    try {
      const result = await lookupPincode(targetPin);
      const officeNames = (result.offices || []).map((o) => o.name);
      setAllOffices(officeNames);
      setPostOffice(result.postOffice);
      setDistrict(result.district);
      setState(result.state);
      if (officeNames.length > 1) {
        setIsPostOfficePickerOpen(true);
      }
    } catch (err: any) {
      setAllOffices([]);
      setPostOffice('');
      setDistrict('');
      setState('');
      setPincodeError(err?.message ?? 'Could not fetch details for this Postal PIN code.');
    } finally {
      setIsFetchingPincode(false);
    }
  };

  const onSubmit = () => {
    setError(null);

    if (values.mobile.trim().length !== 10) {
      setError('10-digit mobile number compulsory hai!');
      return;
    }
    if (!values.name.trim()) {
      setError('Full Name is compulsory!');
      return;
    }

    if (accountType === 'FARMER') {
      if (!sprayTankSizeL) {
        setError('Farmer registration ke liye Spray Tank Size compulsory hai!');
        return;
      }
    }

    if (pincode.trim().length !== 6) {
      setError('PIN Code compulsory hai! Kripya 6-digit PIN Code bharein aur Fetch dabayein.');
      return;
    }
    if (!district || !state) {
      setError('PIN Code se district/state fetch karein pehle "Fetch" button dabakar.');
      return;
    }
    if (values.password !== values.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (values.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (captchaRef.current && !captchaRef.current.validate()) {
      setError('Invalid Captcha security code! Please enter the correct 4-character code.');
      return;
    }

    // Generate 5-digit WhatsApp OTP & open modal
    const code = Math.floor(10000 + Math.random() * 90000).toString();
    setGeneratedOtp(code);
    setShowOtpModal(true);
  };

  const handleCompleteRegistration = async () => {
    setShowOtpModal(false);
    setIsSubmitting(true);
    try {
      await register({
        name: values.name,
        mobile: values.mobile,
        password: values.password,
        accountType,
        sprayTankSizeL: accountType === 'FARMER' ? (sprayTankSizeL ?? undefined) : undefined,
        soilType: accountType === 'FARMER' ? (soilType ?? undefined) : undefined,
        waterType: accountType === 'FARMER' ? (waterType ?? undefined) : undefined,
        upiId: accountType === 'FARMER' && upiId.trim() ? upiId.trim() : undefined,
        pincode: pincode.trim(),
        postOffice: postOffice || undefined,
        district: district || undefined,
        state: state || undefined,
        referralCode: referralCode.trim() || undefined,
      });
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      const isNetworkErr = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      if (isNetworkErr) {
        setError('Network error! Could not connect to backend server. Please check your internet connection.');
      } else {
        setError(err?.response?.data?.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          {/* Top Brand Header */}
          <View style={styles.headerRow}>
            <BrandLogo size={36} useHdQuality />
            <View>
              <Text style={styles.brandName}>FarmsKing</Text>
              <Text style={styles.brandSub}>Smart Farming Platform</Text>
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Enter details to get started</Text>
          </View>

          {/* Account Type Selector (Customer / Farmer) */}
          <View style={styles.accountTypeWrap}>
            {ACCOUNT_TYPES.map((type) => {
              const isSelected = accountType === type.value;
              return (
                <TouchableOpacity
                  key={type.value}
                  style={[styles.accountTypeChip, isSelected && styles.accountTypeChipActive]}
                  onPress={() => setAccountType(type.value)}
                  activeOpacity={0.8}
                >
                  <Ionicons name={type.icon} size={16} color={isSelected ? '#ffffff' : '#64748b'} />
                  <Text style={[styles.accountTypeChipText, isSelected && styles.accountTypeChipTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Mobile Number Input */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Mobile Number *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                maxLength={10}
                value={values.mobile}
                onChangeText={(t) => setValues((prev) => ({ ...prev, mobile: t }))}
              />
            </View>

            {/* King ID Found Badge */}
            {isSearchingMobile ? (
              <View style={styles.statusBadgeRow}>
                <ActivityIndicator size="small" color="#16a34a" />
                <Text style={styles.statusBadgeText}>Checking King ID & existing account...</Text>
              </View>
            ) : searchMobileResult?.user?.kingId ? (
              <View style={styles.kingIdBadge}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                  <Text style={styles.kingIdTitle}>✨ King ID Found: {searchMobileResult.user.kingId}</Text>
                </View>
                {searchMobileResult.user.name ? (
                  <Text style={styles.kingIdSub}>Name: {searchMobileResult.user.name}</Text>
                ) : null}
                <Text style={styles.kingIdHint}>Your new account will link to this same King ID!</Text>
              </View>
            ) : null}
          </View>

          {/* Full Name Input */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Full Name *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor="#94a3b8"
                value={values.name}
                onChangeText={(t) => setValues((prev) => ({ ...prev, name: t }))}
              />
            </View>
          </View>

          {/* Farmer-Specific Optional / Extra Fields */}
          {accountType === 'FARMER' && (
            <View style={styles.farmerCardBox}>
              <View style={styles.farmerCardHeader}>
                <Ionicons name="leaf" size={15} color="#16a34a" />
                <Text style={styles.farmerCardTitle}>Farmer Profile Details</Text>
              </View>
              
              <Text style={styles.farmerLabel}>Spray Tank Size (Liters) *</Text>
              <View style={styles.farmerChipRow}>
                {SPRAY_TANK_SIZE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    style={[styles.farmerChip, sprayTankSizeL === opt && styles.farmerChipActive]}
                    onPress={() => setSprayTankSizeL(opt)}
                  >
                    <Text style={[styles.farmerChipText, sprayTankSizeL === opt && styles.farmerChipTextActive]}>
                      {opt} L
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.farmerLabel}>Soil Type</Text>
              <TouchableOpacity style={styles.farmerSelectField} onPress={() => setIsSoilPickerOpen(true)}>
                <Text style={[styles.farmerSelectText, !selectedSoilLabel && styles.placeholder]}>
                  {selectedSoilLabel || 'Select soil type'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>

              <Text style={styles.farmerLabel}>Water Source</Text>
              <TouchableOpacity style={styles.farmerSelectField} onPress={() => setIsWaterPickerOpen(true)}>
                <Text style={[styles.farmerSelectText, !selectedWaterLabel && styles.placeholder]}>
                  {selectedWaterLabel || 'Select water source'}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#64748b" />
              </TouchableOpacity>

              <Text style={styles.farmerLabel}>UPI ID (Optional)</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="card-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. name@upi"
                  placeholderTextColor="#94a3b8"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </View>
            </View>
          )}

          {/* Postal PIN Code */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Postal PIN Code *</Text>
            <View style={{ flexDirection: 'row', gap: 6, width: '100%' }}>
              <View style={[styles.inputWrap, { flex: 1 }]}>
                <Ionicons name="location-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="6-digit PIN"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={6}
                  value={pincode}
                  onChangeText={(t) => {
                    setPincode(t);
                    setPostOffice('');
                    setDistrict('');
                    setState('');
                    if (t.trim().length === 6) {
                      onFetchPincode(t.trim());
                    }
                  }}
                />
              </View>
              <TouchableOpacity style={styles.fetchBtn} onPress={() => onFetchPincode()} disabled={isFetchingPincode} activeOpacity={0.8}>
                {isFetchingPincode ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.fetchBtnText}>🔍 Check</Text>
                )}
              </TouchableOpacity>
            </View>
            {pincodeError ? <Text style={styles.fieldError}>{pincodeError}</Text> : null}

            {district && state ? (
              <View style={styles.readonlyBox}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
                  onPress={() => allOffices.length > 1 && setIsPostOfficePickerOpen(true)}
                  activeOpacity={allOffices.length > 1 ? 0.7 : 1}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.readonlyRow}>Branch: <Text style={styles.readonlyValue}>{postOffice}</Text></Text>
                    {allOffices.length > 1 ? (
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#16a34a', marginTop: 1 }}>
                        👇 {allOffices.length} Branches Available (Tap to Choose)
                      </Text>
                    ) : null}
                  </View>
                  {allOffices.length > 1 ? <Ionicons name="chevron-down-circle" size={18} color="#16a34a" /> : null}
                </TouchableOpacity>
                <Text style={styles.readonlyRow}>Location: <Text style={styles.readonlyValue}>{district}, {state}</Text></Text>
              </View>
            ) : null}
          </View>

          {/* Password & Confirm Password Side-by-Side Row */}
          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Min 8 chars"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={values.password}
                  onChangeText={(t) => setValues((prev) => ({ ...prev, password: t }))}
                />
              </View>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Confirm *</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={17} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Re-enter"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry
                  value={values.confirmPassword}
                  onChangeText={(t) => setValues((prev) => ({ ...prev, confirmPassword: t }))}
                />
              </View>
            </View>
          </View>

          {/* Referral code */}
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Referral Code (Optional)</Text>
            <View style={[styles.inputWrap, referredViaLink && { backgroundColor: '#f0fdf4', borderColor: theme.primary }]}>
              <Ionicons name="gift-outline" size={17} color={referredViaLink ? theme.primary : '#94a3b8'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Referrer's King ID"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                editable={!referredViaLink}
                value={referralCode}
                onChangeText={setReferralCode}
              />
              {referredViaLink ? <Ionicons name="checkmark-circle" size={17} color={theme.primary} /> : null}
            </View>
          </View>

          {/* Security Captcha Challenge */}
          <CaptchaChallenge ref={captchaRef} onSubmitEditing={onSubmit} />

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={17} color="#dc2626" />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <TouchableOpacity onPress={onSubmit} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
            {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register Now ✨</Text>}
          </TouchableOpacity>

          {/* Login Highlight Bar */}
          <View style={styles.loginHighlightCard}>
            <Text style={styles.loginHighlightText}>Already have an account?</Text>
            <TouchableOpacity
              style={styles.loginHighlightBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.85}
            >
              <Ionicons name="log-in-outline" size={16} color="#16a34a" />
              <Text style={styles.loginHighlightBtnText}>Login Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <OtpVerificationModal
        visible={showOtpModal}
        mobileNumber={values.mobile}
        generatedOtp={generatedOtp}
        onVerifySuccess={handleCompleteRegistration}
        onClose={() => setShowOtpModal(false)}
      />

      <PickerModal
        visible={isPostOfficePickerOpen}
        title="Select Post Office Branch"
        options={allOffices.map((name) => ({ value: name, label: name }))}
        selectedValue={postOffice}
        onSelect={(val) => setPostOffice(val)}
        onClose={() => setIsPostOfficePickerOpen(false)}
      />

      <PickerModal
        visible={isSoilPickerOpen}
        title="Select Soil Type"
        options={SOIL_TYPE_OPTIONS}
        selectedValue={soilType}
        onSelect={(val) => setSoilType(val as SoilType)}
        onClose={() => setIsSoilPickerOpen(false)}
      />

      <PickerModal
        visible={isWaterPickerOpen}
        title="Select Water Source"
        options={WATER_TYPE_OPTIONS}
        selectedValue={waterType}
        onSelect={(val) => setWaterType(val as WaterType)}
        onClose={() => setIsWaterPickerOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: Platform.OS === 'web' ? 20 : 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  brandName: { fontSize: 17, fontFamily: FONT.extraBold, color: theme.primary, letterSpacing: -0.2 },
  brandSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  titleSection: { marginBottom: 12 },
  title: { fontSize: 21, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3 },
  subtitle: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 1 },
  accountTypeWrap: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
    marginBottom: 10,
  },
  accountTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  accountTypeChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  accountTypeChipText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#475569' },
  accountTypeChipTextActive: { color: '#ffffff' },
  fieldBlock: { width: '100%', marginBottom: 10 },
  rowTwoCols: { flexDirection: 'row', gap: 8, width: '100%', marginBottom: 10 },
  label: { fontSize: 11.5, color: '#334155', fontFamily: FONT.bold, marginBottom: 4 },
  inputWrap: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
  },
  inputIcon: { marginRight: 6 },
  input: { flex: 1, paddingVertical: 4, fontSize: 13, fontFamily: FONT.medium, color: '#0f172a' },
  statusBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  statusBadgeText: { fontSize: 11, fontFamily: FONT.medium, color: '#16a34a' },
  kingIdBadge: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    padding: 8,
    borderRadius: RADIUS.md,
    marginTop: 6,
  },
  kingIdTitle: { fontSize: 12, fontFamily: FONT.extraBold, color: '#15803d' },
  kingIdSub: { fontSize: 11, fontFamily: FONT.bold, color: '#334155', marginTop: 1 },
  kingIdHint: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  fetchBtn: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 },
  fieldError: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 11, marginTop: 3 },
  readonlyBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 7,
    marginTop: 6,
    gap: 1,
  },
  readonlyRow: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  readonlyValue: { fontFamily: FONT.bold, color: '#0f172a' },
  farmerCardBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 10,
    gap: 4,
  },
  farmerCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  farmerCardTitle: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a' },
  farmerChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  farmerChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#cbd5e1', backgroundColor: '#ffffff' },
  farmerChipActive: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  farmerChipText: { fontSize: 11, fontFamily: FONT.bold, color: '#334155' },
  farmerChipTextActive: { color: '#ffffff' },
  farmerLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#334155', marginTop: 4, marginBottom: 2 },
  farmerSelectField: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#ffffff' },
  farmerSelectText: { fontSize: 12, fontFamily: FONT.medium, color: '#0f172a' },
  placeholder: { color: '#94a3b8' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  error: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 11.5, flex: 1 },
  button: {
    width: '100%',
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: theme.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  buttonText: { color: '#fff', fontSize: 14, fontFamily: FONT.extraBold },
  loginHighlightCard: {
    width: '100%',
    marginTop: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loginHighlightText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  loginHighlightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
  },
  loginHighlightBtnText: {
    color: '#16a34a',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
});
