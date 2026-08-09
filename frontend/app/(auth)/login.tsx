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
import { useRole } from '@/src/store/role-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';

const theme = RoleThemes.FARMER;

export default function LoginScreen() {
  const { login } = useAuth();
  const { setRole } = useRole();
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ mobile, password });
      setRole('CUSTOMER');
      router.replace('/(tabs)');
    } catch (err: any) {
      console.log('Login error:', err);
      setError(err?.response?.data?.message ?? err?.message ?? 'Login failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandBadge}>
          <Ionicons name="leaf" size={28} color="#ffffff" />
        </View>
        <Text style={styles.brandName}>FarmsKing</Text>

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Login to continue</Text>

        <Text style={styles.label}>Mobile Number</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            maxLength={10}
            placeholder="10-digit mobile number"
            placeholderTextColor="#94a3b8"
            value={mobile}
            onChangeText={setMobile}
          />
        </View>

        <Text style={styles.label}>Password</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            secureTextEntry
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity style={styles.forgotLink} activeOpacity={0.7}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={15} color="#dc2626" />
            <Text style={styles.error}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity onPress={onSubmit} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
          {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Login</Text>}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.75}
          onPress={() => {
            setMobile('9876543210');
            setPassword('123456');
          }}
        >
          <Text style={styles.secondaryButtonText}>⚡ Fill Demo Credentials</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register" style={styles.link}>
            Register
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: SPACING.xxl, paddingTop: Platform.OS === 'web' ? 56 : 80, alignItems: 'center' },
  brandBadge: {
    width: 64, height: 64, borderRadius: RADIUS.md, backgroundColor: theme.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  brandName: { fontSize: 22, fontFamily: FONT.extraBold, color: theme.primary, letterSpacing: 0.2, marginBottom: 28 },
  title: { fontSize: 24, fontFamily: FONT.extraBold, color: '#0f172a', alignSelf: 'flex-start', letterSpacing: -0.3 },
  subtitle: { fontSize: 14.5, color: '#64748b', fontFamily: FONT.medium, alignSelf: 'flex-start', marginBottom: 24, marginTop: 4 },
  label: { fontSize: 13, color: '#334155', fontFamily: FONT.bold, marginBottom: 7, marginTop: 14, alignSelf: 'flex-start' },
  inputWrap: {
    width: '100%',
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#eef2f6', borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15.5, fontFamily: FONT.medium, color: '#0f172a' },
  forgotLink: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: theme.primary, fontSize: 12.5, fontFamily: FONT.bold },
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
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 12, fontFamily: FONT.bold },
  secondaryButton: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: { color: theme.primary, fontSize: 15, fontFamily: FONT.bold },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748b', fontFamily: FONT.medium },
  link: { color: theme.primary, fontFamily: FONT.bold },
});
