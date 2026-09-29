import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '@/src/store/auth-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';
import { CaptchaChallenge, CaptchaRef } from '@/src/components/CaptchaChallenge';

// Required for expo-auth-session to close auth browser after redirect
WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || '';

// Google OAuth2 discovery document
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { login, googleLogin } = useAuth();
  const { data: appSettings } = useAppSettings();
  const router = useRouter();
  const captchaRef = useRef<CaptchaRef>(null);

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'mobile' | 'password' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // ── expo-auth-session Google OAuth request ────────────────────────────────
  // On web: use current page origin as redirect URI (must match Google Console)
  const redirectUri = AuthSession.makeRedirectUri(
    Platform.OS === 'web'
      ? { useProxy: false }
      : { scheme: 'farmsking', path: 'auth' }
  );

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ['openid', 'email', 'profile'],
      responseType: AuthSession.ResponseType.Token,
      redirectUri,
      prompt: AuthSession.Prompt.SelectAccount,
      usePKCE: false,  // Token flow does not support PKCE
    },
    discovery
  );

  // ── Handle OAuth response ─────────────────────────────────────────────────
  useEffect(() => {
    if (!response) return;

    const handleResponse = async () => {
      if (response.type === 'success' && response.authentication?.accessToken) {
        setGoogleLoading(true);
        setError(null);
        try {
          // Fetch user info from Google using the access token
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.authentication!.accessToken}` },
          });
          const userInfo = await userInfoRes.json();

          if (!userInfo?.email) {
            setError('Google account email nahi mili. Dobara try karo.');
            return;
          }

          const res = await googleLogin({
            email: userInfo.email,
            name: userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
            photoUrl: userInfo.picture,
            googleId: userInfo.sub,
          });

          if (res?.isProfileIncomplete) {
            router.replace('/farmer-profile-setup');
          } else {
            router.replace('/(tabs)');
          }
        } catch (err: any) {
          setError(err?.response?.data?.message ?? err?.message ?? 'Google Sign-In failed.');
        } finally {
          setGoogleLoading(false);
        }
      } else if (response.type === 'error') {
        setError('Google Sign-In failed: ' + (response.error?.message || 'Unknown error'));
        setGoogleLoading(false);
      } else if (response.type === 'cancel' || response.type === 'dismiss') {
        setGoogleLoading(false);
      }
    };

    handleResponse();
  }, [response]);

  // ── Button click → open Google account chooser ───────────────────────────
  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In configuration missing.');
      return;
    }
    setError(null);
    setGoogleLoading(true);
    // Log redirect URI so you can add it to Google Console if needed
    console.log('[Google OAuth] Using redirect URI:', redirectUri);
    try {
      const result = await promptAsync({ showInRecents: true });
      console.log('[Google OAuth] Result type:', result?.type);
      if (result?.type !== 'success') {
        setGoogleLoading(false);
      }
    } catch (err: any) {
      console.error('[Google OAuth] Error:', err);
      setError('Google Sign-In failed: ' + (err?.message || 'Please retry.'));
      setGoogleLoading(false);
    }
  };

  // ── Mobile + Password login ───────────────────────────────────────────────
  const onSubmit = async () => {
    setError(null);
    if (!mobile.trim()) { setError('Please enter your 10-digit mobile number.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    if (captchaRef.current && !captchaRef.current.validate()) {
      setError('Invalid Captcha! Please enter the correct code shown below.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login({ mobile: mobile.trim(), password: password.trim() });
      router.replace('/(tabs)');
    } catch (err: any) {
      captchaRef.current?.refresh();
      const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(isNet
        ? 'Network error! Could not connect. Please check your internet.'
        : (err?.response?.data?.message ?? err?.message ?? 'Login failed.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Hero Banner */}
        <LinearGradient colors={['#16a34a', '#15803d', '#0f766e']} style={styles.heroBanner}>
          <View style={styles.brandBox}>
            <BrandLogo size={56} useHdQuality style={{ marginBottom: 8 }} />
            <Text style={styles.brandName}>FarmsKing</Text>
            <Text style={styles.brandTagline}>Smart Agriculture & Farm Management</Text>
          </View>
        </LinearGradient>

        {/* Card */}
        <View style={[styles.card, premiumShadow('#0f172a', 'md')]}>
          <Text style={styles.title}>Welcome Back! 👋</Text>
          <Text style={styles.subtitle}>Sign in to your FarmsKing account</Text>

          {/* ─── Google Sign-In Button ─── */}
          <TouchableOpacity
            style={[styles.googleBtn, (!request || googleLoading) && styles.googleBtnDisabled]}
            onPress={handleGoogleSignIn}
            disabled={!request || googleLoading || isSubmitting}
            activeOpacity={0.88}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" size="small" />
            ) : (
              <>
                <View style={styles.googleIconBox}>
                  {/* Google G colored icon using SVG-like approach */}
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.googleHint}>
            🔐 Apna Google account select karo — bina password ke login ho jao!
          </Text>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR login with mobile</Text>
            <View style={styles.dividerLine} />
          </View>

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
            <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Captcha */}
          <CaptchaChallenge ref={captchaRef} onValueChange={() => {}} onSubmitEditing={onSubmit} />

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotLink} activeOpacity={0.7} onPress={() => router.push('/(auth)/forgot-password')}>
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          {/* Login Button */}
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

          {/* Register Card */}
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

          {/* Download APK */}
          <View style={{ marginTop: 10 }}>
            <TouchableOpacity
              style={styles.downloadAppBtn}
              onPress={async () => {
                const url = appSettings?.appDownloadUrl || 'https://farmsking.in/download/farmsking.apk';
                try {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    const a = document.createElement('a');
                    a.href = url; a.setAttribute('download', 'farmsking.apk');
                    a.setAttribute('target', '_self'); document.body.appendChild(a);
                    a.click(); document.body.removeChild(a); return;
                  }
                  const can = await Linking.canOpenURL(url);
                  if (can) await Linking.openURL(url); else window.location.href = url;
                } catch { if (typeof window !== 'undefined') window.location.href = url; }
              }}
              activeOpacity={0.85}
            >
              <View style={styles.downloadIconCircle}>
                <Ionicons name="logo-android" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.downloadAppTitle}>📲 Download Android App (APK) · ~18.5 MB</Text>
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
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  heroBanner: {
    paddingTop: Platform.OS === 'web' ? 18 : 44,
    paddingBottom: 32,
    paddingHorizontal: SPACING.md,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  brandBox: { alignItems: 'center', marginTop: 2 },
  brandName: { fontSize: 24, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.5 },
  brandTagline: { fontSize: 12, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  card: {
    backgroundColor: '#ffffff',
    marginHorizontal: 12,
    marginTop: -20,
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3, marginBottom: 2 },
  subtitle: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginBottom: 14 },

  // ── Google button ──────────────────────────────────────────────────────────
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dadce0',
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    marginBottom: 2,
  },
  googleBtnDisabled: { opacity: 0.7 },
  googleIconBox: {
    width: 26, height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  googleG: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#4285F4',
    lineHeight: 20,
  },
  googleBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#3c4043',
    letterSpacing: 0.1,
  },
  googleHint: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#16a34a',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 2,
  },

  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 14, gap: 8 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 10.5, fontFamily: FONT.bold, letterSpacing: 0.3 },

  label: { fontSize: 11.5, color: '#334155', fontFamily: FONT.bold, marginBottom: 4, marginTop: 8 },
  inputWrap: {
    width: '100%', height: 42,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: RADIUS.md, backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
  },
  inputWrapFocused: { borderColor: '#16a34a', backgroundColor: '#ffffff' },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 6, fontSize: 13.5, fontFamily: FONT.medium, color: '#0f172a' },

  forgotLink: { alignSelf: 'flex-end', marginTop: 6 },
  forgotText: { color: '#16a34a', fontSize: 11.5, fontFamily: FONT.bold },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 10, width: '100%',
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca',
    padding: 10, borderRadius: RADIUS.md,
  },
  error: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 11.5, lineHeight: 15, flex: 1 },

  button: { width: '100%', marginTop: 14, borderRadius: RADIUS.md, overflow: 'hidden' },
  gradientBtn: { paddingVertical: 12, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#ffffff', fontSize: 14, fontFamily: FONT.bold },

  registerHighlightCard: {
    marginTop: 14,
    backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac',
    borderRadius: RADIUS.md, padding: 10, alignItems: 'center', gap: 6,
  },
  registerHighlightText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#166534' },
  registerHighlightBtn: {
    width: '100%', backgroundColor: '#16a34a',
    paddingVertical: 9, borderRadius: RADIUS.md,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  registerHighlightBtnText: { color: '#ffffff', fontSize: 13, fontFamily: FONT.extraBold },

  downloadAppBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f0f9ff', borderRadius: RADIUS.md,
    borderWidth: 1.5, borderColor: '#bae6fd', padding: 10, marginTop: 10,
  },
  downloadIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center',
  },
  downloadAppTitle: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#0369a1' },
  downloadBadge: { backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
  downloadBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
});
