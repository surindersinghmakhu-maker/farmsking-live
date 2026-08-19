import { useState } from 'react';
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
import { ServerConfigModal } from '@/components/ServerConfigModal';
import { lookupPincode } from '@/src/api/pincode.api';

const theme = RoleThemes.FARMER;

const SECURITY_QUESTIONS = [
  'Your childhood nickname?',
  "Your mother's maiden name?",
  'Name of your first pet?',
  'Your birth city/village?',
];

const FIELDS: { key: 'name' | 'mobile' | 'password' | 'confirmPassword'; label: string; icon: keyof typeof Ionicons.glyphMap; placeholder: string; secure?: boolean; keyboard?: 'phone-pad' }[] = [
  { key: 'name', label: 'Full Name *', icon: 'person-outline', placeholder: 'Your name' },
  { key: 'mobile', label: 'Mobile Number *', icon: 'call-outline', placeholder: '10-digit mobile number', keyboard: 'phone-pad' },
  { key: 'password', label: 'Password *', icon: 'lock-closed-outline', placeholder: 'At least 8 characters', secure: true },
  { key: 'confirmPassword', label: 'Confirm Password *', icon: 'lock-closed-outline', placeholder: 'Re-enter password', secure: true },
];

const ACCOUNT_TYPES: { value: 'CUSTOMER' | 'FARMER' | 'GARDENER'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'CUSTOMER', label: 'Customer', icon: 'cart-outline' },
  { value: 'FARMER', label: 'Farmer', icon: 'leaf-outline' },
  { value: 'GARDENER', label: 'Gardener', icon: 'flower-outline' },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const { ref: refParam } = useLocalSearchParams<{ ref?: string }>();
  const referredViaLink = typeof refParam === 'string' && refParam.trim().length > 0;
  const [accountType, setAccountType] = useState<'CUSTOMER' | 'FARMER' | 'GARDENER'>('CUSTOMER');
  const [values, setValues] = useState({ name: '', mobile: '', password: '', confirmPassword: '' });
  const [pincode, setPincode] = useState('');
  const [postOffice, setPostOffice] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [securityQuestion, setSecurityQuestion] = useState(SECURITY_QUESTIONS[0]);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [referralCode, setReferralCode] = useState(typeof refParam === 'string' ? refParam : '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showServerModal, setShowServerModal] = useState(false);

  const onFetchPincode = async () => {
    setPincodeError(null);
    if (pincode.trim().length !== 6) {
      setPincodeError('Enter a valid 6-digit PIN code first.');
      return;
    }
    setIsFetchingPincode(true);
    try {
      const result = await lookupPincode(pincode.trim());
      setPostOffice(result.postOffice);
      setDistrict(result.district);
      setState(result.state);
    } catch (err: any) {
      setPostOffice('');
      setDistrict('');
      setState('');
      setPincodeError(err?.message ?? 'Could not fetch details for this PIN code.');
    } finally {
      setIsFetchingPincode(false);
    }
  };

  const onSubmit = async () => {
    setError(null);

    if (pincode.trim().length !== 6) {
      setError('PIN Code compulsory hai! Kripya 6-digit PIN Code bharein aur Fetch dabayein.');
      return;
    }
    if (!district || !state) {
      setError('PIN Code se district/state fetch karein pehle "Fetch" button dabakar.');
      return;
    }
    if (!securityAnswer.trim()) {
      setError('Forgot-password ke liye security answer bharna zaroori hai.');
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

    setIsSubmitting(true);
    try {
      await register({
        name: values.name,
        mobile: values.mobile,
        password: values.password,
        accountType,
        pincode: pincode.trim(),
        postOffice: postOffice || undefined,
        district: district || undefined,
        state: state || undefined,
        securityQuestion,
        securityAnswer: securityAnswer.trim(),
        referralCode: referralCode.trim() || undefined,
      });
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      const isNetworkErr = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      if (isNetworkErr) {
        setError('Network error! Could not connect to backend server. Tap "Configure Server IP" below.');
      } else {
        setError(err?.response?.data?.message ?? 'Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.topHeader}>
          <TouchableOpacity style={styles.serverPill} onPress={() => setShowServerModal(true)}>
            <Ionicons name="hardware-chip-outline" size={15} color="#16a34a" />
            <Text style={styles.serverPillText}>Server IP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.brandBadge}>
          <Ionicons name="leaf" size={24} color="#ffffff" />
        </View>
        <Text style={styles.brandName}>FarmsKing</Text>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join FarmsKing Today</Text>

        <Text style={styles.label}>Aap register hona chahte hain as *</Text>
        <View style={styles.accountTypeRow}>
          {ACCOUNT_TYPES.map((t) => {
            const isSelected = accountType === t.value;
            return (
              <TouchableOpacity
                key={t.value}
                style={[styles.accountTypeChip, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setAccountType(t.value)}
                activeOpacity={0.85}
              >
                <Ionicons name={t.icon} size={18} color={isSelected ? '#ffffff' : theme.primary} />
                <Text style={[styles.accountTypeChipText, isSelected && { color: '#ffffff' }]}>{t.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {accountType !== 'CUSTOMER' ? (
          <Text style={styles.accountTypeHint}>
            {accountType === 'FARMER' ? 'Farmer' : 'Gardener'} account ke saath aapko Customer role (products khareedne ke liye) bhi mil jayega.
          </Text>
        ) : null}

        {FIELDS.slice(0, 2).map((f) => (
          <View key={f.key} style={{ width: '100%' }}>
            <Text style={styles.label}>{f.label}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name={f.icon} size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor="#94a3b8"
                secureTextEntry={f.secure}
                keyboardType={f.keyboard}
                maxLength={f.key === 'mobile' ? 10 : undefined}
                value={values[f.key]}
                onChangeText={(t) => setValues((prev) => ({ ...prev, [f.key]: t }))}
              />
            </View>
          </View>
        ))}

        {/* PIN code + Fetch */}
        <Text style={styles.label}>PIN Code * (Compulsory)</Text>
        <View style={{ flexDirection: 'row', gap: 8, width: '100%' }}>
          <View style={[styles.inputWrap, { flex: 1 }]}>
            <Ionicons name="navigate-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="6-digit PIN Code"
              placeholderTextColor="#94a3b8"
              keyboardType="numeric"
              maxLength={6}
              value={pincode}
              onChangeText={(t) => {
                setPincode(t);
                setPostOffice('');
                setDistrict('');
                setState('');
              }}
            />
          </View>
          <TouchableOpacity style={styles.fetchBtn} onPress={onFetchPincode} disabled={isFetchingPincode}>
            {isFetchingPincode ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.fetchBtnText}>Fetch</Text>}
          </TouchableOpacity>
        </View>
        {pincodeError ? <Text style={styles.fieldError}>{pincodeError}</Text> : null}

        {district && state ? (
          <View style={styles.readonlyBox}>
            <Text style={styles.readonlyRow}>Post Office: <Text style={styles.readonlyValue}>{postOffice}</Text></Text>
            <Text style={styles.readonlyRow}>District: <Text style={styles.readonlyValue}>{district}</Text></Text>
            <Text style={styles.readonlyRow}>State: <Text style={styles.readonlyValue}>{state}</Text></Text>
          </View>
        ) : null}

        {FIELDS.slice(2).map((f) => (
          <View key={f.key} style={{ width: '100%' }}>
            <Text style={styles.label}>{f.label}</Text>
            <View style={styles.inputWrap}>
              <Ionicons name={f.icon} size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder={f.placeholder}
                placeholderTextColor="#94a3b8"
                secureTextEntry={f.secure}
                keyboardType={f.keyboard}
                value={values[f.key]}
                onChangeText={(t) => setValues((prev) => ({ ...prev, [f.key]: t }))}
              />
            </View>
          </View>
        ))}

        {/* Referral code — optional, links this account permanently to the referrer's King ID */}
        <Text style={styles.label}>Referral Code (Optional)</Text>
        <View style={[styles.inputWrap, referredViaLink && { backgroundColor: '#f0fdf4', borderColor: theme.primary }]}>
          <Ionicons name="gift-outline" size={18} color={referredViaLink ? theme.primary : '#94a3b8'} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Referrer's King ID, if you have one"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            editable={!referredViaLink}
            value={referralCode}
            onChangeText={setReferralCode}
          />
          {referredViaLink ? <Ionicons name="checkmark-circle" size={18} color={theme.primary} /> : null}
        </View>
        {referredViaLink ? (
          <Text style={styles.accountTypeHint}>Applied from your invite link — you'll get a welcome discount coupon after signup.</Text>
        ) : null}

        {/* Security question, for forgot-password */}
        <Text style={styles.label}>Security Question (Forgot Password ke liye) *</Text>
        <View style={styles.chipRow}>
          {SECURITY_QUESTIONS.map((q) => (
            <TouchableOpacity
              key={q}
              style={[styles.chip, securityQuestion === q && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => setSecurityQuestion(q)}
            >
              <Text style={[styles.chipText, securityQuestion === q && { color: '#ffffff' }]}>{q}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.inputWrap}>
          <Ionicons name="help-circle-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Your answer"
            placeholderTextColor="#94a3b8"
            value={securityAnswer}
            onChangeText={setSecurityAnswer}
          />
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={18} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.error}>{error}</Text>
              <TouchableOpacity style={styles.configErrorBtn} onPress={() => setShowServerModal(true)}>
                <Ionicons name="settings-outline" size={13} color="#16a34a" />
                <Text style={styles.configErrorBtnText}>⚙️ Configure Server IP</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity onPress={onSubmit} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Register</Text>}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" style={styles.link}>
            Login
          </Link>
        </View>
      </ScrollView>

      <ServerConfigModal
        visible={showServerModal}
        onClose={() => setShowServerModal(false)}
        onSaved={() => setError(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: SPACING.xxl, paddingTop: Platform.OS === 'web' ? 36 : 56, alignItems: 'center' },
  topHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.lg,
  },
  serverPillText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  brandBadge: {
    width: 52, height: 52, borderRadius: RADIUS.md, backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  brandName: { fontSize: 18, fontFamily: FONT.extraBold, color: theme.primary, letterSpacing: 0.2, marginBottom: 22 },
  title: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a', alignSelf: 'flex-start', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: '#64748b', fontFamily: FONT.medium, alignSelf: 'flex-start', marginBottom: 20, marginTop: 4 },
  label: { fontSize: 13, color: '#334155', fontFamily: FONT.bold, marginBottom: 7, marginTop: 14 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#eef2f6', borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15.5, fontFamily: FONT.medium, color: '#0f172a' },
  fetchBtn: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fetchBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  fieldError: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 12, marginTop: 6 },
  readonlyBox: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 10,
    gap: 3,
  },
  readonlyRow: { fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b' },
  readonlyValue: { fontFamily: FONT.bold, color: '#0f172a' },
  accountTypeRow: { flexDirection: 'row', gap: 8, width: '100%' },
  accountTypeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  accountTypeChipText: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  accountTypeHint: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 6, alignSelf: 'flex-start' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  chipText: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  error: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 12.5, lineHeight: 17 },
  configErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    alignSelf: 'flex-start',
  },
  configErrorBtnText: {
    color: '#15803d',
    fontFamily: FONT.bold,
    fontSize: 12,
  },
  button: {
    width: '100%',
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: FONT.bold },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#64748b', fontFamily: FONT.medium },
  link: { color: theme.primary, fontFamily: FONT.bold },
});
