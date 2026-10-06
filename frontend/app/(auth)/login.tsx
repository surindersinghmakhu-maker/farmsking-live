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
    try {
      await login({ mobile: mobile.trim(), password: password.trim() });
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      const isNet = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(isNet ? 'Network error! Could not connect. Please check your internet.' : (err?.response?.data?.message ?? err?.message ?? 'Login failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* 5-Star Dark Premium Background */}
      <Image
        source={require('@/assets/images/farmsking_hero_bg_new.png')}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode="cover"
      />
      <LinearGradient colors={['rgba(4,15,28,0.7)', 'rgba(4,15,28,0.92)']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        
        {/* Floating Back Button */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')}>
          <Ionicons name="home" size={16} color="#fff" />
          <Text style={styles.backBtnText}>Home</Text>
        </TouchableOpacity>

        <View style={isDesktop ? styles.cardWebWrapper : { paddingHorizontal: 16 }}>
          
          {/* Logo & Brand Header */}
          <View style={styles.brandBox}>
            <BrandLogo size={60} useHdQuality style={{ marginBottom: 10 }} />
            <Text style={styles.brandName}>FarmsKing</Text>
            <Text style={styles.brandTagline}>Smart Agriculture & Farm Management</Text>
          </View>

          {/* Glassmorphism Card */}
          <View style={[styles.card, isDesktop && styles.cardDesktop, premiumShadow('rgba(0,0,0,0.6)', 'lg')]}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

            <Text style={styles.title}>Welcome Back! 👋</Text>
            <Text style={styles.subtitle}>Sign in to your premium account</Text>

            <div id="recaptcha-container"></div>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'password' && styles.tabActive]}
                onPress={() => setActiveTab('password')}
                activeOpacity={0.8}
              >
                <LinearGradient colors={activeTab === 'password' ? ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)'] : ['transparent', 'transparent']} style={StyleSheet.absoluteFill} />
                <Ionicons name="lock-closed" size={15} color={activeTab === 'password' ? '#10b981' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'password' && styles.tabTextActive]}>Password</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, activeTab === 'otp' && styles.tabActive]}
                onPress={() => setActiveTab('otp')}
                activeOpacity={0.8}
              >
                <LinearGradient colors={activeTab === 'otp' ? ['rgba(16,185,129,0.2)', 'rgba(16,185,129,0.05)'] : ['transparent', 'transparent']} style={StyleSheet.absoluteFill} />
                <Ionicons name="phone-portrait-outline" size={15} color={activeTab === 'otp' ? '#10b981' : '#64748b'} />
                <Text style={[styles.tabText, activeTab === 'otp' && styles.tabTextActive]}>OTP</Text>
              </TouchableOpacity>
            </View>

            {/* Inputs */}
            <Text style={styles.label}>{activeTab === 'password' ? 'Mobile Number or King ID' : 'Mobile Number'}</Text>
            <View style={[styles.inputWrap, focusedField === 'mobile' && styles.inputWrapFocused]}>
              <Ionicons name={activeTab === 'password' ? 'person-outline' : 'call-outline'} size={18} color={focusedField === 'mobile' ? '#10b981' : '#64748b'} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                keyboardType={activeTab === 'password' ? 'default' : 'phone-pad'}
                maxLength={activeTab === 'otp' ? 10 : 30}
                placeholder={activeTab === 'password' ? 'Enter Mobile Number or King ID' : '10-digit mobile number'}
                placeholderTextColor="#64748b"
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
                  <Ionicons name="pencil" size={16} color="#10b981" />
                </TouchableOpacity>
              )}
            </View>

            {activeTab === 'password' && (
              <>
                <Text style={styles.label}>Password</Text>
                <View style={[styles.inputWrap, focusedField === 'password' && styles.inputWrapFocused]}>
                  <Ionicons name="lock-closed-outline" size={18} color={focusedField === 'password' ? '#10b981' : '#64748b'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    secureTextEntry={!showPassword}
                    placeholder="Password"
                    placeholderTextColor="#64748b"
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={{ padding: 4 }}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.forgotLink} onPress={() => router.push('/(auth)/forgot-password')}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </>
            )}

            {activeTab === 'otp' && (
              <>
                {!otpSent ? (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={otpSending || !mobile.trim()}
                    activeOpacity={0.85}
                    style={[styles.sendOtpBtn, (!mobile.trim() || otpSending) && { opacity: 0.6 }]}
                  >
                    <LinearGradient colors={['#0ea5e9', '#0284c7']} style={styles.gradientBtn}>
                      {otpSending ? <ActivityIndicator color="#ffffff" /> : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons name="paper-plane" size={18} color="#ffffff" />
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
                        <Text style={styles.devOtpLabel}>🧪 Test OTP Code:</Text>
                        <Text style={styles.devOtpCode}>{devOtp}</Text>
                      </View>
                    )}
                    <Text style={styles.label}>Enter 6-Digit OTP</Text>
                    <View style={[styles.inputWrap, focusedField === 'otp' && styles.inputWrapFocused]}>
                      <Ionicons name="keypad-outline" size={18} color={focusedField === 'otp' ? '#10b981' : '#64748b'} style={styles.inputIcon} />
                      <TextInput
                        ref={otpInputRef}
                        style={[styles.input, { letterSpacing: 6, fontSize: 18, fontFamily: FONT.extraBold, textAlign: 'center' }]}
                        keyboardType="number-pad"
                        maxLength={6}
                        placeholder="● ● ● ● ● ●"
                        placeholderTextColor="#475569"
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
                        <Text style={styles.resendTimer}>Resend SMS in {resendTimer}s</Text>
                      ) : (
                        <TouchableOpacity onPress={handleSendOtp} disabled={otpSending}>
                          <Text style={styles.resendLink}>🔄 Resend SMS OTP</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </>
                )}
              </>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={20} color="#f87171" />
                <Text style={styles.error}>{error}</Text>
              </View>
            ) : null}

            {activeTab === 'password' || otpSent ? (
              <TouchableOpacity onPress={activeTab === 'password' ? onSubmit : handleOtpLogin} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
                <LinearGradient colors={['#10b981', '#059669']} style={styles.gradientBtn}>
                  {isSubmitting ? <ActivityIndicator color="#ffffff" /> : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.buttonText}>{activeTab === 'password' ? 'Secure Login' : 'Verify & Login'}</Text>
                      <Ionicons name="arrow-forward" size={18} color="#ffffff" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ) : null}

            {/* Google Login */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONNECT WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.googleIconBtn, (!request || googleLoading) && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={!request || googleLoading || isSubmitting}
              activeOpacity={0.88}
            >
              {googleLoading ? <ActivityIndicator color="#4285F4" /> : (
                <>
                  <Ionicons name="logo-google" size={20} color="#fff" />
                  <Text style={styles.googleText}>Sign in with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register */}
            <TouchableOpacity style={styles.registerHighlightBtn} onPress={() => router.push('/(auth)/register')} activeOpacity={0.85}>
              <Text style={styles.registerHighlightText}>New to FarmsKing? </Text>
              <Text style={styles.registerHighlightBtnText}>Create Account</Text>
              <Ionicons name="arrow-forward" size={14} color="#10b981" />
            </TouchableOpacity>

          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040f1c' },
  scroll: { flexGrow: 1, paddingBottom: 40, paddingTop: 40 },
  backBtn: {
    position: 'absolute', top: 20, left: 20, zIndex: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)'
  },
  backBtnText: { color: '#fff', fontSize: 13, fontFamily: FONT.bold },
  
  brandBox: { alignItems: 'center', marginBottom: 24, marginTop: 30 },
  brandName: { fontSize: 32, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.5 },
  brandTagline: { fontSize: 14, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 4 },
  
  cardWebWrapper: { width: '100%', alignItems: 'center', paddingHorizontal: 16 },
  card: {
    width: '100%',
    backgroundColor: 'rgba(16, 25, 40, 0.45)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  cardDesktop: { maxWidth: 480, alignSelf: 'center', padding: 32 },
  
  title: { fontSize: 24, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: -0.3, marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#94a3b8', fontFamily: FONT.medium, marginBottom: 24 },

  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)', overflow: 'hidden'
  },
  tabActive: { borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)' },
  tabText: { fontSize: 13, fontFamily: FONT.bold, color: '#94a3b8' },
  tabTextActive: { color: '#10b981' },

  label: { fontSize: 12, color: '#cbd5e1', fontFamily: FONT.bold, marginBottom: 6, marginTop: 12 },
  inputWrap: {
    width: '100%', height: 48, flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 14,
  },
  inputWrapFocused: { borderColor: '#10b981', backgroundColor: 'rgba(0,0,0,0.5)' },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 8, fontSize: 14, fontFamily: FONT.medium, color: '#ffffff' },

  forgotLink: { alignSelf: 'flex-end', marginTop: 10 },
  forgotText: { color: '#10b981', fontSize: 12, fontFamily: FONT.bold },

  sendOtpBtn: { width: '100%', marginTop: 16, borderRadius: 14, overflow: 'hidden' },
  otpSentMsg: {
    fontSize: 13, fontFamily: FONT.bold, color: '#10b981',
    backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
    borderRadius: 12, padding: 12, marginTop: 12, textAlign: 'center',
  },
  devOtpBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)',
    borderRadius: 12, padding: 10, marginTop: 10,
  },
  devOtpLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#fcd34d' },
  devOtpCode: { fontSize: 18, fontFamily: FONT.extraBold, color: '#fbbf24', letterSpacing: 4 },
  resendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 },
  resendTimer: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8' },
  resendLink: { fontSize: 12, fontFamily: FONT.bold, color: '#38bdf8' },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, width: '100%',
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    padding: 12, borderRadius: 12,
  },
  error: { color: '#fca5a5', fontFamily: FONT.medium, fontSize: 12, lineHeight: 16, flex: 1 },

  button: { width: '100%', marginTop: 20, borderRadius: 14, overflow: 'hidden', ...premiumShadow('#10b981', 'lg') },
  gradientBtn: { paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#ffffff', fontSize: 15, fontFamily: FONT.bold },

  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: 24, gap: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  dividerText: { color: '#64748b', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 1 },

  googleIconBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12,
    width: '100%', paddingVertical: 12,
    borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  googleBtnDisabled: { opacity: 0.7 },
  googleText: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },

  registerHighlightBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    marginTop: 24, paddingVertical: 14,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderRadius: 14, borderWidth: 1, borderColor: 'rgba(16,185,129,0.2)',
  },
  registerHighlightText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },
  registerHighlightBtnText: { color: '#10b981', fontSize: 13, fontFamily: FONT.bold },
});
