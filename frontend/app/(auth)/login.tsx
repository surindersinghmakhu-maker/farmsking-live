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
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
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
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const otpInputRef = useRef<TextInput>(null);

  const handleSuccessNavigation = (isProfileIncomplete = false) => {
    if (isProfileIncomplete) {
      router.replace('/farmer-profile-setup');
    } else if (redirect) {
      router.replace(redirect as any);
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const [activeTab, setActiveTab] = useState<LoginTab>('password');
  const [tabRowWidth, setTabRowWidth] = useState(0);
  const tabSlideAnim = useRef(new Animated.Value(0)).current;
  const formFadeAnim = useRef(new Animated.Value(1)).current;
  const formTranslateY = useRef(new Animated.Value(0)).current;

  const handleTabSwitch = (tab: LoginTab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.spring(tabSlideAnim, {
        toValue: tab === 'password' ? 0 : 1,
        tension: 90,
        friction: 9.5,
        useNativeDriver: false,
      }),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(formFadeAnim, {
            toValue: 0.35,
            duration: 70,
            useNativeDriver: true,
          }),
          Animated.timing(formTranslateY, {
            toValue: 8,
            duration: 70,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.spring(formFadeAnim, {
            toValue: 1,
            tension: 85,
            friction: 9,
            useNativeDriver: true,
          }),
          Animated.spring(formTranslateY, {
            toValue: 0,
            tension: 85,
            friction: 9,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
  };
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
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const existingV3 = document.getElementById('recaptcha-v3-script');
      if (existingV3) existingV3.remove();
      const badge = document.querySelector('.grecaptcha-badge') as HTMLElement;
      if (badge) badge.style.display = 'none';
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

          handleSuccessNavigation(Boolean(res?.isProfileIncomplete));
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
    setError(null);
    setGoogleLoading(true);

    if (Platform.OS === 'web') {
      try {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const fbUser = result.user;
        const idToken = await fbUser.getIdToken();
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const accessToken = credential?.accessToken || (result as any)?._tokenResponse?.oauthAccessToken;

        const res = await googleLogin({
          email: fbUser.email || undefined,
          name: fbUser.displayName || undefined,
          photoUrl: fbUser.photoURL || undefined,
          googleId: fbUser.uid,
          idToken,
          accessToken,
        });

        handleSuccessNavigation(Boolean(res?.isProfileIncomplete));
        return;
      } catch (fbErr: any) {
        console.warn('[GoogleSignIn Web] Firebase popup error:', fbErr);
        if (
          fbErr?.code === 'auth/popup-closed-by-user' ||
          fbErr?.code === 'auth/cancelled-popup-request'
        ) {
          setGoogleLoading(false);
          return;
        }
        // If popup was blocked or failed, fall through to promptAsync fallback
      }
    }

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
        handleSuccessNavigation();
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
      handleSuccessNavigation();
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
      {/* Subtle Ambient Glowing Baby Light Orbs */}
      <View style={styles.glowOrbBabyMint} />
      <View style={styles.glowOrbBabyBlue} />

      <ScrollView contentContainerStyle={[styles.scroll, isDesktop && styles.scrollDesktop]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* ── LEFT BRAND PANEL (desktop only) ── */}
        {isDesktop && (
          <View style={styles.leftPanel}>
            <LinearGradient colors={['#042f2e', '#064e3b', '#065f46']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
            {/* Subtle Grid Pattern Overlay */}
            <View style={styles.leftGridOverlay} />

            <View style={styles.leftContent}>
              <View style={styles.logoBadgeContainer}>
                <BrandLogo size={68} useHdQuality />
                <View style={styles.livePulseDot} />
              </View>
              <Text style={styles.leftTitle}>FarmsKing</Text>
              <Text style={styles.leftSub}>India's Leading Digital Agriculture & Farm Intelligence Platform</Text>
              
              <View style={styles.trustBadgeStrip}>
                <Ionicons name="shield-checkmark" size={13} color="#34d399" />
                <Text style={styles.trustBadgeStripText}>ISO 27001 SECURED • eNAM ALIGNED</Text>
              </View>

              <View style={styles.leftDivider} />
              
              {[
                { icon: 'scan-outline', text: 'AI Crop Pathology & 5-Second Diagnostics' },
                { icon: 'trending-up-outline', text: 'Live APMC Mandi Rates & 4D Market Telemetry' },
                { icon: 'storefront-outline', text: 'Certified Agri Inputs Delivered Directly to Farm' },
                { icon: 'calendar-outline', text: 'Digital Farm Records & Scientific Spray Calendars' },
              ].map((item, i) => (
                <View key={i} style={styles.leftFeature}>
                  <View style={styles.leftFeatureIcon}>
                    <Ionicons name={item.icon as any} size={16} color="#34d399" />
                  </View>
                  <Text style={styles.leftFeatureText}>{item.text}</Text>
                </View>
              ))}

              <View style={styles.leftSocialProofBox}>
                <View style={styles.leftStarsRow}>
                  {[1, 2, 3, 4, 5].map((_, i) => (
                    <Ionicons key={i} name="star" size={12} color="#f59e0b" style={{ marginRight: 1 }} />
                  ))}
                  <Text style={styles.leftStarsRating}>4.9/5</Text>
                </View>
                <Text style={styles.leftFooter}>Trusted by 50,000+ Cultivators & Agronomists across India</Text>
              </View>
            </View>
          </View>
        )}

        {/* ── RIGHT FORM PANEL ── */}
        <View style={[styles.rightPanel, isDesktop && styles.rightPanelDesktop]}>

          {/* Back to Home Button */}
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/')} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={15} color="#059669" />
            <Text style={styles.backBtnText}>Back to FarmsKing</Text>
          </TouchableOpacity>

          {/* Logo (mobile only) */}
          {!isDesktop && (
            <View style={styles.mobileBrand}>
              <BrandLogo size={46} useHdQuality />
              <View style={{ marginLeft: 12 }}>
                <Text style={styles.mobileBrandName}>FarmsKing</Text>
                <Text style={styles.mobileBrandTag}>Smart Farming & Agri Intelligence</Text>
              </View>
            </View>
          )}

          {/* Frosted Glass Card */}
          <View style={[styles.card, premiumShadow('rgba(16,185,129,0.12)', 'lg')]}>
            {redirect ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 }}>
                <Ionicons name="cart" size={22} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#065f46' }}>
                    Your shopping cart is safely saved!
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#047857', marginTop: 1 }}>
                    Please login or create an account to proceed with your order.
                  </Text>
                </View>
              </View>
            ) : null}
            <Text style={styles.title}>Welcome Back 👋</Text>
            <Text style={styles.subtitle}>Sign in to continue to your account</Text>

            <div id="recaptcha-container" />

            {/* Movement Animated Tabs */}
            <View
              style={styles.tabRow}
              onLayout={(e) => setTabRowWidth(e.nativeEvent.layout.width)}
            >
              {tabRowWidth > 0 && (
                <Animated.View
                  style={[
                    styles.slidingActivePill,
                    {
                      width: (tabRowWidth - 8) / 2,
                      transform: [
                        {
                          translateX: tabSlideAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, (tabRowWidth - 8) / 2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              )}

              {(['password', 'otp'] as const).map((tab) => {
                const isSelected = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={styles.tab}
                    onPress={() => handleTabSwitch(tab)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={tab === 'password' ? 'lock-closed' : 'phone-portrait-outline'}
                      size={14}
                      color={isSelected ? '#059669' : '#64748b'}
                    />
                    <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                      {tab === 'password' ? 'Password' : 'OTP'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Form Canvas with Spring Slide-and-Fade Motion */}
            <Animated.View style={{ opacity: formFadeAnim, transform: [{ translateY: formTranslateY }] }}>

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
            </Animated.View>

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
            <TouchableOpacity
              style={styles.registerRow}
              onPress={() => router.push({ pathname: '/(auth)/register', params: redirect ? { redirect } : undefined } as any)}
              activeOpacity={0.85}
            >
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
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    position: 'relative',
    overflow: 'hidden',
  },

  // Subtle Ambient Glowing Orbs
  glowOrbBabyMint: {
    position: 'absolute',
    width: 520,
    height: 520,
    borderRadius: 260,
    backgroundColor: 'rgba(167, 243, 208, 0.35)',
    top: -120,
    right: -100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(120px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbBabyBlue: {
    position: 'absolute',
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: 'rgba(186, 230, 253, 0.35)',
    bottom: -100,
    left: -100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(120px)', pointerEvents: 'none' } as any) : {}),
  },

  // Layouts
  scroll: { flexGrow: 1 },
  scrollDesktop: { flexDirection: 'row', minHeight: '100%' },

  // Left green brand panel (desktop)
  leftPanel: {
    width: 440,
    overflow: 'hidden',
    position: 'relative',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.12)',
  },
  leftGridOverlay: {
    ...StyleSheet.absoluteFill,
    opacity: 0.08,
    ...(Platform.OS === 'web'
      ? ({
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.6) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        } as any)
      : {}),
  },
  leftContent: { flex: 1, padding: 44, justifyContent: 'center' },
  logoBadgeContainer: {
    position: 'relative',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.4)',
  },
  livePulseDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34d399',
    borderWidth: 2,
    borderColor: '#064e3b',
  },
  leftTitle: { fontSize: 34, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.3 },
  leftSub: { fontSize: 13.5, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.85)', marginTop: 8, marginBottom: 18, lineHeight: 20 },
  trustBadgeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
  },
  trustBadgeStripText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#a7f3d0',
    letterSpacing: 0.5,
  },
  leftDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 22 },
  leftFeature: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 15 },
  leftFeatureIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  leftFeatureText: { fontSize: 13, fontFamily: FONT.bold, color: '#f8fafc', flex: 1, lineHeight: 18 },
  leftSocialProofBox: {
    marginTop: 26,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
  },
  leftStarsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  leftStarsRating: { fontSize: 12, fontFamily: FONT.extraBold, color: '#ffffff', marginLeft: 4 },
  leftFooter: { fontSize: 11.5, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.75)', lineHeight: 16 },

  // Right form panel
  rightPanel: { flex: 1, justifyContent: 'center', padding: 20, paddingTop: 40, paddingBottom: 32, zIndex: 10 },
  rightPanelDesktop: { maxWidth: 500, alignSelf: 'center', width: '100%' },

  // Back button
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    alignSelf: 'flex-start',
    backgroundColor: '#ffffff',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.25)',
    ...premiumShadow('rgba(0,0,0,0.05)', 'xs'),
  },
  backBtnText: { color: '#059669', fontSize: 12, fontFamily: FONT.bold },

  // Mobile brand
  mobileBrand: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  mobileBrandName: { fontSize: 21, fontFamily: FONT.extraBold, color: '#0f172a' },
  mobileBrandTag: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },

  // Card
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderRadius: 24,
    padding: 26,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.22)',
    ...(Platform.OS === 'web'
      ? ({
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px -12px rgba(16, 185, 129, 0.14), 0 0 1px rgba(0,0,0,0.06)',
        } as any)
      : {
          ...premiumShadow('rgba(16,185,129,0.15)', 'lg'),
        }),
  },

  title: { fontSize: 24, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 4 },
  subtitle: { fontSize: 13, color: '#64748b', fontFamily: FONT.medium, marginBottom: 18 },

  // Tabs
  tabRow: {
    position: 'relative',
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  slidingActivePill: {
    position: 'absolute',
    left: 4,
    top: 4,
    bottom: 4,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    shadowColor: '#10b981',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    zIndex: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    zIndex: 2,
  },
  tabText: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b' },
  tabTextActive: { color: '#059669', fontFamily: FONT.extraBold },

  // Inputs
  label: { fontSize: 11, color: '#475569', fontFamily: FONT.bold, marginBottom: 5, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrap: {
    width: '100%',
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 13,
  },
  inputWrapFocused: {
    borderColor: '#059669',
    backgroundColor: '#ffffff',
    shadowColor: '#10b981',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 2,
  },
  inputIcon: { marginRight: 9 },
  input: { flex: 1, fontSize: 14.5, fontFamily: FONT.medium, color: '#0f172a' },

  forgotLink: { alignSelf: 'flex-end', marginTop: 8 },
  forgotText: { color: '#059669', fontSize: 12, fontFamily: FONT.bold },

  sendOtpBtn: { width: '100%', marginTop: 14, borderRadius: 14, overflow: 'hidden' },
  otpSentMsg: { fontSize: 12, fontFamily: FONT.bold, color: '#059669', backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', borderRadius: 12, padding: 10, marginTop: 10, textAlign: 'center' },
  devOtpBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 10, padding: 8, marginTop: 8 },
  devOtpLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#d97706' },
  devOtpCode: { fontSize: 18, fontFamily: FONT.extraBold, color: '#d97706', letterSpacing: 4 },
  resendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8 },
  resendTimer: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8' },
  resendLink: { fontSize: 12, fontFamily: FONT.bold, color: '#0284c7' },

  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, backgroundColor: 'rgba(220,38,38,0.06)', borderWidth: 1, borderColor: 'rgba(220,38,38,0.18)', padding: 10, borderRadius: 12 },
  error: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 12, lineHeight: 16, flex: 1 },

  button: {
    width: '100%',
    marginTop: 16,
    borderRadius: 14,
    overflow: 'hidden',
    ...premiumShadow('rgba(16,185,129,0.35)', 'md'),
  },
  gradientBtn: { paddingVertical: 13.5, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#ffffff', fontSize: 14.5, fontFamily: FONT.bold },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { color: '#94a3b8', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 0.5 },

  googleIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    width: '100%',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.03)', 'xs'),
  },
  googleBtnDisabled: { opacity: 0.6 },
  googleText: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },

  registerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18, gap: 3 },
  registerText: { fontSize: 13, fontFamily: FONT.medium, color: '#64748b' },
  registerLink: { fontSize: 13, fontFamily: FONT.bold, color: '#059669' },
});
