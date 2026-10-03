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

const GOOGLE_CLIENT_ID = '526414717221-j7s76lkacilevmucm0npnehrnqtqu0f3.apps.googleusercontent.com';

// Google OAuth2 discovery document
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

type LoginTab = 'password' | 'otp';

// ─────────────────────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { login, sendLoginOtp, otpLogin, googleLogin } = useAuth();
  const { data: appSettings } = useAppSettings();
  const router = useRouter();
  const captchaRef = useRef<CaptchaRef>(null);
  const otpInputRef = useRef<TextInput>(null);

  const [activeTab, setActiveTab] = useState<LoginTab>('password');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<'mobile' | 'password' | 'otp' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Reset OTP state when switching tabs or changing mobile
  useEffect(() => {
    setOtpSent(false);
    setOtpCode('');
    setDevOtp(null);
    setResendTimer(0);
    setError(null);
  }, [activeTab]);

  // ── expo-auth-session Google OAuth request ────────────────────────────────
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
      usePKCE: false,
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
          const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${response.authentication!.accessToken}` },
          });
          const userInfo = await userInfoRes.json();

          if (!userInfo?.email) {
            setError('Google account email not found. Please try again.');
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

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    setError(null);
    if (!mobile.trim() || mobile.trim().length < 10) {
      setError('Please enter a 10-digit mobile number.');
      return;
    }
    setOtpSending(true);
    try {
      const res = await sendLoginOtp(mobile.trim());
      setOtpSent(true);
      setResendTimer(60);
      setDevOtp(res.devOtp || null);
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err: any) {
      const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(isNet
        ? 'Network error! Please check your internet connection.'
        : (err?.response?.data?.message ?? err?.message ?? 'Failed to send OTP. Please try again.')
      );
    } finally {
      setOtpSending(false);
    }
  };

  // ── Verify OTP login ─────────────────────────────────────────────────────
  const handleOtpLogin = async () => {
    setError(null);
    if (!otpCode.trim() || otpCode.trim().length < 6) {
      setError('Please enter the 6-digit OTP.');
      return;
    }
    setIsSubmitting(true);
    try {
      await otpLogin({ mobile: mobile.trim(), otp: otpCode.trim() });
      router.replace('/(tabs)');
    } catch (err: any) {
      const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(isNet
        ? 'Network error! Please check your internet connection.'
        : (err?.response?.data?.message ?? err?.message ?? 'OTP verification failed.')
      );
    } finally {
      setIsSubmitting(false);
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
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleBtnText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.googleHint}>
            🔐 Select your Google account to log in instantly without a password!
          </Text>

          {/* OR Divider */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR login with mobile</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* ─── Login Method Tabs ─── */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'password' && styles.tabActive]}
              onPress={() => setActiveTab('password')}
              activeOpacity={0.8}
            >
              <Ionicons name="lock-closed" size={15} color={activeTab === 'password' ? '#16a34a' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'password' && styles.tabTextActive]}>Password</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'otp' && styles.tabActive]}
              onPress={() => setActiveTab('otp')}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses" size={15} color={activeTab === 'otp' ? '#16a34a' : '#94a3b8'} />
              <Text style={[styles.tabText, activeTab === 'otp' && styles.tabTextActive]}>WhatsApp OTP</Text>
            </TouchableOpacity>
          </View>

          {/* Mobile Field (shared) */}
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
              onChangeText={(t) => { setMobile(t); if (otpSent) { setOtpSent(false); setOtpCode(''); setDevOtp(null); } }}
              onFocus={() => setFocusedField('mobile')}
              onBlur={() => setFocusedField(null)}
              returnKeyType="next"
              editable={!(activeTab === 'otp' && otpSent)}
            />
            {activeTab === 'otp' && otpSent && (
              <TouchableOpacity onPress={() => { setOtpSent(false); setOtpCode(''); setDevOtp(null); }} style={{ padding: 4 }}>
                <Ionicons name="pencil" size={16} color="#16a34a" />
              </TouchableOpacity>
            )}
          </View>

          {/* ─── PASSWORD TAB ─── */}
          {activeTab === 'password' && (
            <>
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
            </>
          )}

          {/* ─── OTP TAB ─── */}
          {activeTab === 'otp' && (
            <>
              {!otpSent ? (
                <>
                  <Text style={styles.otpHint}>
                    📱 A 6-digit OTP will be sent to your WhatsApp. Log in instantly without a password!
                  </Text>
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={otpSending || !mobile.trim()}
                    activeOpacity={0.85}
                    style={[styles.sendOtpBtn, (!mobile.trim() || otpSending) && { opacity: 0.6 }]}
                  >
                    <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.gradientBtn}>
                      {otpSending ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="chatbubble-ellipses" size={18} color="#ffffff" />
                          <Text style={styles.buttonText}>Send WhatsApp OTP</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.otpSentMsg}>
                    ✅ OTP sent successfully to {mobile} via WhatsApp
                  </Text>

                  {devOtp && (
                    <View style={styles.devOtpBox}>
                      <Text style={styles.devOtpLabel}>🧪 Dev OTP:</Text>
                      <Text style={styles.devOtpCode}>{devOtp}</Text>
                    </View>
                  )}

                  <Text style={styles.label}>Enter 6-Digit OTP</Text>
                  <View style={[styles.inputWrap, focusedField === 'otp' && styles.inputWrapFocused]}>
                    <Ionicons name="keypad-outline" size={18} color={focusedField === 'otp' ? '#16a34a' : '#94a3b8'} style={styles.inputIcon} />
                    <TextInput
                      ref={otpInputRef}
                      style={[styles.input, { letterSpacing: 6, fontSize: 18, fontFamily: FONT.extraBold }]}
                      keyboardType="number-pad"
                      maxLength={6}
                      placeholder="● ● ● ● ● ●"
                      placeholderTextColor="#cbd5e1"
                      value={otpCode}
                      onChangeText={setOtpCode}
                      onFocus={() => setFocusedField('otp')}
                      onBlur={() => setFocusedField(null)}
                      returnKeyType="done"
                      onSubmitEditing={handleOtpLogin}
                    />
                  </View>

                  {/* Resend */}
                  <View style={styles.resendRow}>
                    {resendTimer > 0 ? (
                      <Text style={styles.resendTimer}>Resend in {resendTimer}s</Text>
                    ) : (
                      <TouchableOpacity onPress={handleSendOtp} disabled={otpSending}>
                        <Text style={styles.resendLink}>🔄 Resend OTP</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </>
              )}
            </>
          )}

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={20} color="#dc2626" />
              <Text style={styles.error}>{error}</Text>
            </View>
          ) : null}

          {/* Login / Verify Button */}
          {activeTab === 'password' ? (
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
          ) : otpSent ? (
            <TouchableOpacity onPress={handleOtpLogin} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
              <LinearGradient colors={['#16a34a', '#15803d']} style={styles.gradientBtn}>
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={styles.buttonText}>Verify OTP & Login</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ) : null}

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

  // ── Tabs ───────────────────────────────────────────────────────────────────
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tabActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  tabText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#16a34a',
  },

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

  // ── OTP specific ──────────────────────────────────────────────────────────
  otpHint: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#0369a1',
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  sendOtpBtn: {
    width: '100%',
    marginTop: 12,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  otpSentMsg: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#16a34a',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
    textAlign: 'center',
  },
  devOtpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fefce8',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: RADIUS.md,
    padding: 8,
    marginTop: 6,
  },
  devOtpLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#92400e' },
  devOtpCode: { fontSize: 18, fontFamily: FONT.extraBold, color: '#b45309', letterSpacing: 4 },
  resendRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  resendTimer: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8' },
  resendLink: { fontSize: 12, fontFamily: FONT.bold, color: '#0284c7' },

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
});
