import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
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
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';
import { CaptchaChallenge, CaptchaRef } from '@/src/components/CaptchaChallenge';

const theme = RoleThemes.FARMER;

export default function LoginScreen() {
  const { login } = useAuth();
  const { data: appSettings } = useAppSettings();
  const router = useRouter();
  const captchaRef = useRef<CaptchaRef>(null);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'mobile' | 'password' | 'captcha' | null>(null);
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
    if (captchaRef.current && !captchaRef.current.validate()) {
      setError('Invalid Captcha security code! Please enter the correct 4-character code shown below.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ mobile: mobile.trim(), password: password.trim() });
      router.replace('/(tabs)');
    } catch (err: any) {
      captchaRef.current?.refresh();
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
            <BrandLogo size={56} useHdQuality style={{ marginBottom: 8 }} />
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
              returnKeyType="next"
              onSubmitEditing={onSubmit}
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
              returnKeyType="done"
              onSubmitEditing={onSubmit}
            />
            <TouchableOpacity onPress={() => setShowPassword((v) => !v)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Security Captcha Challenge */}
          <CaptchaChallenge ref={captchaRef} onValueChange={setCaptchaInput} onSubmitEditing={onSubmit} />

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

          {/* Prominent Highlighted Register Button Box for Farmers */}
          <View style={styles.registerHighlightCard}>
            <Text style={styles.registerHighlightText}>New to FarmsKing?</Text>
            <TouchableOpacity
              style={styles.registerHighlightBtn}
              onPress={() => router.push('/(auth)/register')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add" size={18} color="#ffffff" />
              <Text style={styles.registerHighlightBtnText}>Create New Account / Register Now ✨</Text>
            </TouchableOpacity>
          </View>

          {/* Download Android App Button Box at Bottom of Login Page */}
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              style={styles.downloadAppBtn}
              onPress={async () => {
                const url = appSettings?.appDownloadUrl || 'https://farmsking.tech/download/farmsking.apk';
                try {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', 'farmsking.apk');
                    link.setAttribute('target', '_self');
                    link.setAttribute('rel', 'noopener noreferrer');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                  }
                  const can = await Linking.canOpenURL(url);
                  if (can) {
                    await Linking.openURL(url);
                  } else {
                    window.location.href = url;
                  }
                } catch {
                  if (typeof window !== 'undefined') {
                    window.location.href = url;
                  } else {
                    alert('Could not open download link.');
                  }
                }
              }}
              activeOpacity={0.85}
            >
              <View style={styles.downloadIconCircle}>
                <Ionicons name="logo-android" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.downloadAppTitle}>📲 Download Android App (APK)</Text>
                <Text style={styles.downloadAppSub}>Install FarmsKing App on your phone</Text>
              </View>
              <View style={styles.downloadBadge}>
                <Text style={styles.downloadBadgeText}>Download</Text>
              </View>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { flexGrow: 1, paddingBottom: 24 },
  heroBanner: {
    paddingTop: Platform.OS === 'web' ? 18 : 40,
    paddingBottom: 28,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: 'center',
  },
  heroHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  serverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  serverPillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  brandBox: {
    alignItems: 'center',
    marginTop: 2,
  },
  brandIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  brandName: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  brandTagline: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.85)',
    marginTop: 1,
  },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: -16,
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3 },
  subtitle: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginBottom: 10, marginTop: 2 },
  label: { fontSize: 11.5, color: '#334155', fontFamily: FONT.bold, marginBottom: 4, marginTop: 8 },
  inputWrap: {
    width: '100%',
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
  },
  inputWrapFocused: {
    borderColor: '#16a34a',
    backgroundColor: '#ffffff',
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 6, fontSize: 13.5, fontFamily: FONT.medium, color: '#0f172a' },
  forgotLink: { alignSelf: 'flex-end', marginTop: 6 },
  forgotText: { color: '#16a34a', fontSize: 11.5, fontFamily: FONT.bold },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    width: '100%',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  error: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 11.5, lineHeight: 15 },
  configErrorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  configErrorBtnText: {
    color: '#15803d',
    fontFamily: FONT.bold,
    fontSize: 11.5,
  },
  button: {
    width: '100%',
    marginTop: 14,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  gradientBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#ffffff', fontSize: 14, fontFamily: FONT.bold },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 14, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 10.5, fontFamily: FONT.bold, letterSpacing: 0.5 },
  demoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  demoChip: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  demoChipText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#334155',
  },
  registerHighlightCard: {
    marginTop: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: RADIUS.md,
    padding: 10,
    alignItems: 'center',
    gap: 6,
  },
  registerHighlightText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  registerHighlightBtn: {
    width: '100%',
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  registerHighlightBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  downloadAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    padding: 10,
    marginTop: 10,
  },
  downloadIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  downloadAppTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#0369a1',
  },
  downloadAppSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#0284c7',
    marginTop: 1,
  },
  downloadBadge: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  downloadBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
