import React, { useEffect, useRef, useState } from 'react';
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
  useWindowDimensions,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/store/auth-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';
import { BlurView } from 'expo-blur';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = '742233980320-ito7h8q3iq5vdon6b93qc08q5l8c3v9v.apps.googleusercontent.com';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

type LoginTab = 'password' | 'otp';

export default function LoginScreen() {
  const { login, firebaseLogin, googleLogin } = useAuth();
  const { data: appSettings } = useAppSettings();
  const router = useRouter();
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
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const initRecaptcha = () => {
    if (Platform.OS !== 'web') return;
    try {
      const container = document.getElementById('recaptcha-container');
      if (!container) return;
      const existing = (window as any).recaptchaVerifier;
      if (existing && (window as any).recaptchaContainer === container) return;
      if (existing) {
        try { existing.clear(); } catch (e) {}
        (window as any).recaptchaVerifier = null;
      }
      container.innerHTML = '';
      (window as any).recaptchaContainer = container;
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {},
      });
    } catch (e) {
      console.warn('ReCaptcha init error:', e);
    }
  };

  const resetRecaptcha = async () => {
    if (Platform.OS !== 'web') return;
    try {
      const verifier = (window as any).recaptchaVerifier;
      if (!verifier) return;
      const widgetId = await verifier.render();
      (window as any).grecaptcha?.reset(widgetId);
    } catch (e) {
      console.warn('ReCaptcha reset error:', e);
    }
  };

  useEffect(() => {
    initRecaptcha();
    if (Platform.OS === 'web') {
      const siteKey = process.env.EXPO_PUBLIC_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';
      const scriptId = 'recaptcha-v3-script';
      if (!document.getElementById(scriptId)) {
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
        document.head.appendChild(script);
      }
      (window as any).recaptchaSiteKey = siteKey;
    }
  }, []);

  useEffect(() => {
    setOtpSent(false);
    setOtpCode('');
    setDevOtp(null);
    setResendTimer(0);
    setError(null);
    setConfirmationResult(null);
  }, [activeTab]);

  const redirectUri = AuthSession.makeRedirectUri(
    Platform.OS === 'web' ? ({ useProxy: false } as any) : { scheme: 'farmsking', path: 'auth' }
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
            accessToken: response.authentication!.accessToken,
          });

          if (res?.isProfileIncomplete) {
            router.replace('/farmer-profile-setup');
          } else {
            router.replace('/(tabs)' as any);
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

  const handleGoogleSignIn = async () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In configuration missing.');
      return;
    }
    setError(null);
    setGoogleLoading(true);
    try {
      const result = await promptAsync({ showInRecents: true });
      if (result?.type !== 'success') {
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError('Google Sign-In failed: ' + (err?.message || 'Please retry.'));
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSending(true);
    try {
      if (Platform.OS === 'web') {
        const fullPhone = `+91${cleanNum}`;
        try {
          initRecaptcha();
          const verifier = (window as any).recaptchaVerifier;
          const result = await signInWithPhoneNumber(auth, fullPhone, verifier);
          setConfirmationResult(result);
        } catch (firebaseErr: any) {
          console.warn('[Firebase Auth Phone OTP]:', firebaseErr?.code, firebaseErr?.message);
          await resetRecaptcha();
          throw new Error(`Firebase Error: ${firebaseErr?.message || 'Failed to send SMS'}`);
        }
      }
      setOtpSent(true);
      setResendTimer(60);
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err: any) {
      const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(isNet ? 'Network error! Please check your internet connection.' : (err?.response?.data?.message ?? err?.message ?? 'Failed to send OTP. Please try again.'));
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpLogin = async () => {
    setError(null);
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the 6-digit OTP code.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (confirmationResult) {
        const credential = await confirmationResult.confirm(cleanCode);
        const idToken = await credential.user.getIdToken();
        await firebaseLogin(idToken);
        router.replace('/(tabs)' as any);
      } else {
        throw new Error('Firebase Confirmation Result is missing. Please request a new OTP.');
      }
    } catch (err: any) {
      const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(isNet ? 'Network error! Please check your internet connection.' : (err?.response?.data?.message ?? err?.message ?? 'OTP verification failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    if (!mobile.trim()) { setError('Please enter your Mobile Number or King ID.'); return; }
    if (!password.trim()) { setError('Please enter your password.'); return; }
    setIsSubmitting(true);

    let captchaToken = undefined;
    if (Platform.OS === 'web' && (window as any).grecaptcha) {
      try {
        captchaToken = await new Promise<string>((resolve) => {
          (window as any).grecaptcha.ready(() => {
            (window as any).grecaptcha.execute((window as any).recaptchaSiteKey, { action: 'login' }).then((token: string) => {
              resolve(token);
            });
          });
        });
      } catch (e) {
        console.warn('reCAPTCHA v3 failed:', e);
      }
    }

    try {
      await login({ mobile: mobile.trim(), password: password.trim(), captchaToken });
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(isNet ? 'Network error! Could not connect. Please check your internet.' : (err?.response?.data?.message ?? err?.message ?? 'Login failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const { width } = useWindowDimensions();
  const isDesktop = width > 900;
  const isMobile = width <= 768;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── LEFT BRAND PANEL (desktop only) ── */}
        {isDesktop && (
          <View style={styles.leftPanel}>
            <LinearGradient colors={['#10b981', '#059669', '#047857']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            <View style={styles.leftContent}>
              <BrandLogo size={64} useHdQuality style={{ marginBottom: 20 }} />
              <Text style={styles.leftTitle}>FarmsKing</Text>
              <Text style={styles.leftSub}>India's #1 Smart Farming Platform</Text>
              <View style={styles.leftDivider} />
              {[
                { icon: 'leaf', text: 'AI-powered Crop Intelligence' },
                { icon: 'storefront', text: 'Certified Agri Store' },
                { icon: 'medkit', text: '24/7 Crop Doctor Support' },
                { icon: 'shield-checkmark', text: 'ISO 27001 Certified Security' },
              ].map((item, i) => (
                <View key={i} style={styles.leftFeature}>
                  <View style={styles.leftFeatureIcon}>
                    <Ionicons name={item.icon as any} size={16} color="#10b981" />
                  </View>
                  <Text style={styles.leftFeatureText}>{item.text}</Text>
                </View>
              ))}
              <Text style={styles.leftFooter}>Trusted by 50,000+ Farmers across India</Text>
            </View>
          </View>
        )}

        {/* ── RIGHT FORM PANEL ── */}
        <View style={[styles.rightPanel, isDesktop && styles.rightPanelDesktop]}>

          {/* Back Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
            <Ionicons name="arrow-back" size={16} color="#10b981" />
            <Text style={styles.backBtnText}>Back</Text>
          </TouchableOpacity>

          {/* Logo (mobile only) */}
          {!isDesktop && (
            <View style={styles.mobileBrand}>
              <BrandLogo size={44} useHdQuality />
              <View>
                <Text style={styles.mobileBrandName}>FarmsKing</Text>
                <Text style={styles.mobileBrandTag}>Smart Farming Platform</Text>
              </View>
            </View>
          )}

          {/* Card */}
          <View style={[styles.card, premiumShadow('rgba(0,0,0,0.07)', 'lg')]}>
            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.subtitle}>Sign in to continue to your account</Text>

            <div id="recaptcha-container" />

            {/* Tabs */}
            <View style={styles.tabRow}>
              {(['password', 'otp'] as const).map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={tab === 'password' ? 'lock-closed' : 'phone-portrait-outline'}
                    size={14}
                    color={activeTab === tab ? '#10b981' : '#94a3b8'}
                  />
                  <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                    {tab === 'password' ? 'Password' : 'OTP'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Mobile Input */}
            <Text style={styles.label}>{activeTab === 'password' ? 'Mobile / King ID' : 'Mobile Number'}</Text>
            <View style={[styles.inputWrap, focusedField === 'mobile' && styles.inputWrapFocused]}>
              <Ionicons name={activeTab === 'password' ? 'person-outline' : 'call-outline'} size={17} color={focusedField === 'mobile' ? '#10b981' : '#94a3b8'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                keyboardType={activeTab === 'password' ? 'default' : 'phone-pad'}
                maxLength={activeTab === 'otp' ? 10 : 30}
                placeholder={activeTab === 'password' ? 'Mobile number or King ID' : '10-digit mobile'}
                placeholderTextColor="#cbd5e1"
                value={mobile}
                onChangeText={(t) => { setMobile(t); if (otpSent) { setOtpSent(false); setOtpCode(''); setDevOtp(null); } }}
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
                returnKeyType="next"
                editable={!(activeTab === 'otp' && otpSent)}
                autoCapitalize="none"
              />
              {activeTab === 'otp' && otpSent && (
                <TouchableOpacity onPress={() => { setOtpSent(false); setOtpCode(''); setDevOtp(null); }} style={{ padding: 4 }}>
                  <Ionicons name="pencil" size={15} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>

            {/* Password Tab */}
            {activeTab === 'password' && (
              <>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrap, focusedField === 'password' && styles.inputWrapFocused]}>
                  <Ionicons name="lock-closed-outline" size={17} color={focusedField === 'password' ? '#10b981' : '#94a3b8'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    placeholder="Password"
                    placeholderTextColor="#cbd5e1"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </>
            )}

            {/* OTP Tab */}
            {activeTab === 'otp' && (
              <>
                {!otpSent ? (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={otpSending || !mobile.trim()}
                    activeOpacity={0.85}
                    style={[styles.sendOtpBtn, (!mobile.trim() || otpSending) && { opacity: 0.5 }]}
                  >
                    <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.gradientBtn}>
                      {otpSending ? <ActivityIndicator color="#fff" /> : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="paper-plane" size={16} color="#fff" />
                          <Text style={styles.buttonText}>Send OTP</Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <>
                    <Text style={styles.otpSentMsg}>✅ OTP sent to +91 {mobile}</Text>
                    {devOtp && (
                      <View style={styles.devOtpBox}>
                        <Text style={styles.devOtpLabel}>🧪 Test OTP:</Text>
                        <Text style={styles.devOtpCode}>{devOtp}</Text>
                      </View>
                    )}
                    <Text style={styles.label}>6-Digit OTP</Text>
                    <View style={[styles.inputWrap, focusedField === 'otp' && styles.inputWrapFocused]}>
                      <Ionicons name="keypad-outline" size={17} color={focusedField === 'otp' ? '#10b981' : '#94a3b8'} style={styles.inputIcon} />
                      <TextInput
                        ref={otpInputRef}
                        style={[styles.input, { letterSpacing: 8, fontSize: 20, fontFamily: FONT.extraBold, textAlign: 'center' }]}
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
                <Ionicons name="alert-circle" size={18} color="#dc2626" />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            {/* Submit */}
            {activeTab === 'password' || otpSent ? (
              <TouchableOpacity onPress={activeTab === 'password' ? onSubmit : handleOtpLogin} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.gradientBtn}>
                  {isSubmitting ? <ActivityIndicator color="#fff" /> : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.buttonText}>{activeTab === 'password' ? 'Secure Login' : 'Verify & Login'}</Text>
                      <Ionicons name="arrow-forward" size={16} color="#fff" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleIconBtn, (!request || googleLoading) && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={!request || googleLoading || isSubmitting}
              activeOpacity={0.88}
            >
              {googleLoading ? <ActivityIndicator color="#4285F4" /> : (
                <>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register */}
            <TouchableOpacity style={styles.registerRow} onPress={() => router.push('/(auth)/register')} activeOpacity={0.85}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Text style={styles.registerLink}>Create one →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },

  // Layouts
  scroll: { flexGrow: 1 },
  scrollDesktop: { flexDirection: 'row', minHeight: '100%' },

  // Left green brand panel (desktop)
  leftPanel: { width: 400, overflow: 'hidden' },
  leftContent: { flex: 1, padding: 48, justifyContent: 'center' },
  leftTitle: { fontSize: 34, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.3 },
  leftSub: { fontSize: 14, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.75)', marginTop: 6, marginBottom: 28 },
  leftDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 24 },
  leftFeature: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  leftFeatureIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  leftFeatureText: { fontSize: 13, fontFamily: FONT.bold, color: 'rgba(255,255,255,0.9)' },
  leftFooter: { fontSize: 12, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.5)', marginTop: 28, textAlign: 'center' },

  // Right form panel
  rightPanel: { flex: 1, justifyContent: 'center', padding: 20, paddingTop: 60, paddingBottom: 32 },
  rightPanelDesktop: { maxWidth: 520, alignSelf: 'center', width: '100%' },

  // Back button
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20, alignSelf: 'flex-start', backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)' },
  backBtnText: { color: '#10b981', fontSize: 12, fontFamily: FONT.bold },

  // Mobile brand
  mobileBrand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 20 },
  mobileBrandName: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a' },
  mobileBrandTag: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },

  // Card
  card: { backgroundColor: '#ffffff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: '#e2e8f0' },

  title: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', fontFamily: FONT.medium, marginBottom: 20 },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14, backgroundColor: '#f8fafc', borderRadius: 12, padding: 4, borderWidth: 1, borderColor: '#e2e8f0' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 9 },
  tabActive: { backgroundColor: '#ffffff', shadowColor: '#000', shadowOpacity: 0.07, shadowOffset: { width: 0, height: 1 }, shadowRadius: 3, elevation: 2 },
  tabText: { fontSize: 13, fontFamily: FONT.bold, color: '#94a3b8' },
  tabTextActive: { color: '#10b981' },

  // Inputs
  label: { fontSize: 11, color: '#64748b', fontFamily: FONT.bold, marginBottom: 5, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: { width: '100%', height: 46, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, backgroundColor: '#f8fafc', paddingHorizontal: 13 },
  inputWrapFocused: { borderColor: '#10b981', backgroundColor: '#ffffff', shadowColor: '#10b981', shadowOpacity: 0.1, shadowOffset: { width: 0, height: 0 }, shadowRadius: 6, elevation: 1 },
  inputIcon: { marginRight: 9 },
  input: { flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' },

  forgotLink: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: '#10b981', fontSize: 12, fontFamily: FONT.bold },

  sendOtpBtn: { width: '100%', marginTop: 14, borderRadius: 12, overflow: 'hidden' },
  otpSentMsg: { fontSize: 12, fontFamily: FONT.bold, color: '#059669', backgroundColor: 'rgba(16,185,129,0.07)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)', borderRadius: 10, padding: 10, marginTop: 10, textAlign: 'center' },
  devOtpBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 10, padding: 8, marginTop: 8 },
  devOtpLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#d97706' },
  devOtpCode: { fontSize: 18, fontFamily: FONT.extraBold, color: '#d97706', letterSpacing: 4 },
  resendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  resendTimer: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8' },
  resendLink: { fontSize: 12, fontFamily: FONT.bold, color: '#0ea5e9' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: 'rgba(220,38,38,0.06)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.15)', padding: 10, borderRadius: 10 },
  error: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 12, lineHeight: 16, flex: 1 },

  button: { width: '100%', marginTop: 16, borderRadius: 12, overflow: 'hidden', ...premiumShadow('rgba(16,185,129,0.3)', 'md') },
  gradientBtn: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#ffffff', fontSize: 14, fontFamily: FONT.bold },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 0.5 },

  googleIconBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, width: '100%', paddingVertical: 12, borderRadius: 12, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' },
  googleBtnDisabled: { opacity: 0.6 },
  googleText: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },

  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18, gap: 2 },
  registerText: { fontSize: 13, fontFamily: FONT.medium, color: '#64748b' },
  registerLink: { fontSize: 13, fontFamily: FONT.bold, color: '#10b981' },

  // Legacy aliases (keep for safety)
  registerHighlightBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 18, paddingVertical: 13, backgroundColor: 'rgba(16,185,129,0.06)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16,185,129,0.15)' },
  registerHighlightText: { fontSize: 13, fontFamily: FONT.medium, color: '#64748b' },
  registerHighlightBtnText: { color: '#10b981', fontSize: 13, fontFamily: FONT.bold },
});
