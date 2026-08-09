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
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';

const theme = RoleThemes.FARMER;

const FIELDS: { key: 'name' | 'mobile' | 'pincode' | 'state' | 'password' | 'confirmPassword'; label: string; icon: keyof typeof Ionicons.glyphMap; placeholder: string; secure?: boolean; keyboard?: 'phone-pad' | 'numeric' }[] = [
  { key: 'name', label: 'Full Name *', icon: 'person-outline', placeholder: 'Your name' },
  { key: 'mobile', label: 'Mobile Number *', icon: 'call-outline', placeholder: '10-digit mobile number', keyboard: 'phone-pad' },
  { key: 'pincode', label: 'PIN Code * (Compulsory)', icon: 'navigate-outline', placeholder: '6-digit PIN Code', keyboard: 'numeric' },
  { key: 'state', label: 'State / Local Mandi', icon: 'location-outline', placeholder: 'e.g. Punjab (for local mandi rates)' },
  { key: 'password', label: 'Password *', icon: 'lock-closed-outline', placeholder: 'At least 8 characters', secure: true },
  { key: 'confirmPassword', label: 'Confirm Password *', icon: 'lock-closed-outline', placeholder: 'Re-enter password', secure: true },
];

export default function RegisterScreen() {
  const { register } = useAuth();
  const router = useRouter();
  const [values, setValues] = useState({ name: '', mobile: '', pincode: '', state: '', password: '', confirmPassword: '' });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);

    if (!values.pincode || values.pincode.trim().length !== 6) {
      setError('PIN Code compulsory hai! Kripya 6-digit PIN Code bharein.');
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
        state: values.state.trim() || undefined,
      });
      router.replace('/(auth)/onboarding');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBadge}>
          <Ionicons name="leaf" size={24} color="#ffffff" />
        </View>
        <Text style={styles.brandName}>FarmsKing</Text>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join FarmsKing Today</Text>

        {FIELDS.map((f) => (
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

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={15} color="#dc2626" />
            <Text style={styles.error}>{error}</Text>
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: SPACING.xxl, paddingTop: Platform.OS === 'web' ? 44 : 64, alignItems: 'center' },
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
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'flex-start' },
  error: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 13 },
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
