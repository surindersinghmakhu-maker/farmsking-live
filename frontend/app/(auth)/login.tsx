import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/store/auth-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';

const theme = RoleThemes.FARMER;

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'mobile' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async () => {
    setError(null);
    if (!mobile.trim()) {
      setError('Please enter your 10-digit mobile number.');
      return;
    }
    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ mobile: mobile.trim(), password: password.trim() });
      router.replace('/(tabs)');
    } catch (err: any) {
      const isNetworkErr = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      if (isNetworkErr) {
        setError('Network error! Could not connect to backend server. Please check your internet connection.');
      } else {
        setError(err?.response?.data?.message ?? err?.message ?? 'Login failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Top Hero Header */}
        <LinearGradient colors={['#16a34a', '#15803d', '#0f766e']} style={styles.heroBanner}>
          <View style={styles.brandBox}>
            <View style={styles.brandIconWrap}>
              <BrandLogo size={32} iconColor="#ffffff" fallbackIconName="leaf" />
            </View>
            <Text style={styles.brandName}>FarmsKing</Text>
            <Text style={styles.brandTagline}>Smart Agriculture & Farm Management</Text>
          </View>
        </LinearGradient>

        {/* Elevated Form Card */}
        <View style={[styles.card, premiumShadow('#0f172a', 'md')]}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>Enter your details to sign in to your account</Text>

          {/* Mobile Field */}
          <Text style={styles.label}>Mobile Number</Text>
          <View style={[styles.inputWrap, focusedField === 'mobile' && styles.inputWrapFocused]}>
            <Ionicons name="call-outline" size={18} color={focusedField === 'mobile' ? '#16a34a' : '#94a3b8'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94a3b8"
              value={mobile}
              onChangeText={setMobile}
              onFocus={() => setFocusedField('mobile')}
              onBlur={() => setFocusedField(null)}
            />
          </View>

          {/* Password Field */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrap, focusedField === 'password' && styles.inputWrapFocused]}>
            <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#16a34a' : '#94a3b8'} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              secureTextEntry={!showPassword}
              placeholder="Password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity style={styles.forgotLink} activeOpacity={0.7} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Error Alert Box */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          {/* Main Submit Button */}
          <TouchableOpacity onPress={onSubmit} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
            <LinearGradient colors={['#16a34a', '#15803d']} style={styles.gradientBtn}>
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.buttonText}>Login</Text>
                  <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer Register Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <Link href="/(auth)/register" style={styles.link}>
              Register Now
            </Link>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, paddingBottom: 40 },
  heroBanner: {
    paddingTop: Platform.OS === 'web' ? 24 : 50,
    paddingBottom: 45,
    paddingHorizontal: SPACING.lg,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    alignItems: 'center',
  },
  heroHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  serverPillText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  brandBox: {
    alignItems: 'center',
    marginTop: 4,
  },
  brandIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  brandName: {
    fontSize: 26,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: SPACING.lg,
    marginTop: -25,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, color: '#64748b', fontFamily: FONT.medium, marginBottom: 20, marginTop: 3 },
  label: { fontSize: 12.5, color: '#334155', fontFamily: FONT.bold, marginBottom: 6, marginTop: 12 },
  inputWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
  },
  inputWrapFocused: {
    borderColor: '#16a34a',
    backgroundColor: '#ffffff',
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 14.5, fontFamily: FONT.medium, color: '#0f172a' },
  forgotLink: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: '#16a34a', fontSize: 12.5, fontFamily: FONT.bold },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 14,
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 12,
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
    marginTop: 22,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 15.5, fontFamily: FONT.bold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 20, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 0.5 },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  demoChip: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  demoChipText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#334155',
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { color: '#64748b', fontFamily: FONT.medium, fontSize: 13 },
  link: { color: '#16a34a', fontFamily: FONT.bold, fontSize: 13 },
});
