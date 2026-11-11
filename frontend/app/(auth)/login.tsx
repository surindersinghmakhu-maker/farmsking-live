import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';
import * as Haptics from 'expo-haptics';
import {
  GoogleAuthProvider,
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { useAuth } from '@/src/store/auth-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useLanguage } from '@/src/store/language-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

const GOOGLE_CLIENT_ID = '742233980320-ito7h8q3iq5vdon6b93qc08q5l8c3v9v.apps.googleusercontent.com';

export default function LoginScreen() {
  const { user, login, googleLogin, sendLoginOtp, otpLogin, completeOtpRegistration, firebaseLogin } = useAuth();
  const { data: appSettings } = useAppSettings();
  const { setLanguage } = useLanguage();
  const router = useRouter();
  const { redirect, portal } = useLocalSearchParams<{ redirect?: string; portal?: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const [portalMode, setPortalMode] = useState<'CLIENT' | 'PARTNER'>(() =>
    String(portal || '').toLowerCase() === 'partner' ? 'PARTNER' : 'CLIENT',
  );
  const [partnerAuthMethod, setPartnerAuthMethod] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [partnerIdentifier, setPartnerIdentifier] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [showPartnerPassword, setShowPartnerPassword] = useState(false);

  useEffect(() => {
    if (String(portal || '').toLowerCase() === 'partner') {
      setPortalMode('PARTNER');
    } else if (String(portal || '').toLowerCase() === 'client') {
      setPortalMode('CLIENT');
    }
  }, [portal]);

  // Enforce English as default language for Login and Auth
  useEffect(() => {
    setLanguage('en');
  }, []);

  // Refs for 6 segmented OTP cells
  const otpCellRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Detect local testing environment
  const isLocalhost =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.'));

  const handleSuccessNavigation = (isProfileIncomplete = false, loggedInUser?: any) => {
    if (isProfileIncomplete) {
      router.replace('/farmer-profile-setup');
      return;
    }
    if (redirect) {
      router.replace(redirect as any);
      return;
    }
    const targetUser = loggedInUser || user;
    const allRoles: string[] = [
      targetUser?.role,
      ...(Array.isArray(targetUser?.roles) ? targetUser.roles : []),
    ].filter(Boolean);
    const partnerDashboardRoles = [
      'BUSINESS_PARTNER',
      'ADVISOR',
      'FARM_ADVISOR',
      'GARDEN_ADVISOR',
      'TECHNICAL_TRAINER',
    ];
    if (allRoles.some((r) => partnerDashboardRoles.includes(r))) {
      router.replace('/(partner)/(tabs)');
      return;
    }
    if (allRoles.includes('SELLER')) {
      router.replace('/seller-dashboard' as any);
      return;
    }
    router.replace('/(user)/(tabs)');
  };

  const [mobile, setMobile] = useState('');
  const [focusedField, setFocusedField] = useState<'mobile' | 'otp' | 'name' | 'partnerId' | 'partnerPass' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const autoSubmittedCodeRef = useRef<string | null>(null);

  // New User Role Selection State
  const [isNewUserModal, setIsNewUserModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'FARMER' | 'GARDENER'>('FARMER');
  const [newUserName, setNewUserName] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCompletingReg, setIsCompletingReg] = useState(false);

  // Guarantee pitch dark body background on Web to eliminate any bottom blank/white gap
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const prevBodyBg = document.body.style.backgroundColor;
      const prevHtmlBg = document.documentElement.style.backgroundColor;
      document.body.style.backgroundColor = '#070c18';
      document.documentElement.style.backgroundColor = '#070c18';
      return () => {
        document.body.style.backgroundColor = prevBodyBg;
        document.documentElement.style.backgroundColor = prevHtmlBg;
      };
    }
  }, []);

  // Mouse movement tracking for 4D laser illumination & spotlight effects
  const mouseTargetRef = useRef({ x: 0, y: 0, normX: 0, normY: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, normX: 0, normY: 0 });
  const [isMouseActive, setIsMouseActive] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !isDesktop) return;

    let animId: number;
    let currX = window.innerWidth / 2;
    let currY = window.innerHeight / 2;

    const onMove = (e: MouseEvent) => {
      if (!isMouseActive) setIsMouseActive(true);
      const nx = (e.clientX / window.innerWidth) * 2 - 1;
      const ny = (e.clientY / window.innerHeight) * 2 - 1;
      mouseTargetRef.current = { x: e.clientX, y: e.clientY, normX: nx, normY: ny };
    };

    const onLeave = () => {
      setIsMouseActive(false);
      mouseTargetRef.current = { x: window.innerWidth / 2, y: window.innerHeight / 2, normX: 0, normY: 0 };
    };

    const loop = () => {
      const tgt = mouseTargetRef.current;
      currX += (tgt.x - currX) * 0.08;
      currY += (tgt.y - currY) * 0.08;
      const nx = (currX / window.innerWidth) * 2 - 1;
      const ny = (currY / window.innerHeight) * 2 - 1;
      setMousePos({
        x: Math.round(currX),
        y: Math.round(currY),
        normX: Math.round(nx * 1000) / 1000,
        normY: Math.round(ny * 1000) / 1000,
      });
      animId = requestAnimationFrame(loop);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    window.addEventListener('mouseleave', onLeave);
    animId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      cancelAnimationFrame(animId);
    };
  }, [isDesktop]);

  // Timer countdown for OTP resend
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Google OAuth setup
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'farmsking' });
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_CLIENT_ID,
    clientId: GOOGLE_CLIENT_ID,
    scopes: ['openid', 'profile', 'email'],
    redirectUri,
    responseType: AuthSession.ResponseType.Token,
    prompt: AuthSession.Prompt.SelectAccount,
    usePKCE: false,
  });

  useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        setGoogleLoading(true);
        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${authentication.accessToken}` },
        })
          .then((res) => res.json())
          .then(async (userInfo) => {
            if (!userInfo?.email) {
              setError('Google login failed: Email not provided.');
              return;
            }
            const loggedInUser = await googleLogin({
              email: userInfo.email,
              name: userInfo.name || userInfo.given_name || userInfo.email.split('@')[0],
              photoUrl: userInfo.picture,
              googleId: userInfo.sub,
              accessToken: authentication.accessToken,
            });
            handleSuccessNavigation(loggedInUser.isProfileIncomplete, loggedInUser.user);
          })
          .catch((err) => {
            setError(err?.response?.data?.message ?? err?.message ?? 'Google Sign-In failed.');
          })
          .finally(() => setGoogleLoading(false));
      }
    } else if (response.type === 'error') {
      setError('Google Sign-In error: ' + (response.error?.message || 'Please retry.'));
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    setError(null);
    try {
      if (Platform.OS === 'web') {
        setGoogleLoading(true);
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const cred = await signInWithPopup(auth, provider);
          const idToken = await cred.user.getIdToken();
          const res = await googleLogin({
            idToken,
            email: cred.user.email || undefined,
            name: cred.user.displayName || undefined,
            photoUrl: cred.user.photoURL || undefined,
            googleId: cred.user.uid,
          });
          handleSuccessNavigation(res.isProfileIncomplete, res.user);
        } catch (fbErr: any) {
          if (fbErr?.code === 'auth/popup-closed-by-user') {
            setGoogleLoading(false);
            return;
          }
          if (request) {
            await promptAsync();
          } else {
            setError('Google Sign-In error: ' + (fbErr?.message || 'Please retry.'));
          }
        } finally {
          setGoogleLoading(false);
        }
      } else {
        if (request) {
          await promptAsync();
        } else {
          setError('Google Sign-In is initializing. Please tap again.');
        }
      }
    } catch (err: any) {
      setError('Google Sign-In failed: ' + (err?.message || 'Please retry.'));
      setGoogleLoading(false);
    }
  };

  // Step 1: Request Mobile OTP
  const handleSendOtp = async () => {
    setError(null);
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    setOtpSending(true);

    if (isLocalhost) {
      // 💻 LOCALHOST ONLY: Standard 123456 test mode
      try {
        await sendLoginOtp(cleanNum);
      } catch (err: any) {
        console.warn('[sendLoginOtp fallback]:', err);
      } finally {
        setOtpSent(true);
        setDevOtp('123456');
        setOtpDigits(['', '', '', '', '', '']);
        setResendTimer(60);
        setOtpSending(false);
        setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
      }
    } else {
      // 🚀 LIVE PRODUCTION: Real Firebase Phone Auth SMS with Backend Fallback
      try {
        if (typeof window !== 'undefined') {
          let el = document.getElementById('recaptcha-container-login');
          if (!el) {
            el = document.createElement('div');
            el.id = 'recaptcha-container-login';
            el.style.position = 'fixed';
            el.style.bottom = '0';
            el.style.right = '0';
            el.style.zIndex = '9999';
            document.body.appendChild(el);
          }
          if ((window as any).recaptchaVerifierLogin) {
            try {
              (window as any).recaptchaVerifierLogin.clear();
            } catch {}
            (window as any).recaptchaVerifierLogin = null;
          }
          (window as any).recaptchaVerifierLogin = new RecaptchaVerifier(
            auth,
            el,
            { size: 'invisible' }
          );
        }

        const confirmation = await signInWithPhoneNumber(
          auth,
          `+91${cleanNum}`,
          (window as any).recaptchaVerifierLogin
        );

        setConfirmationResult(confirmation);
        setOtpSent(true);
        setDevOtp(null);
        setOtpDigits(['', '', '', '', '', '']); // Always empty on live for real SMS input
        setResendTimer(60);
        setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
      } catch (err: any) {
        console.warn('[Firebase Phone Auth error, initiating fallback]:', err);

        // 🛡️ ULTRA-ROBUST LIVE FALLBACK:
        // If Firebase throws auth/internal-error, quota limits, or reCAPTCHA errors,
        // instantly dispatch verification OTP via backend so the user is NEVER blocked!
        try {
          const fallbackRes = await sendLoginOtp(cleanNum);
          setConfirmationResult(null); // Indicates backend OTP verification
          setOtpSent(true);
          setDevOtp(fallbackRes?.devOtp || null);
          setOtpDigits(['', '', '', '', '', '']);
          setResendTimer(60);
          setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
          return;
        } catch (backendErr: any) {
          console.warn('[Backend OTP fallback error]:', backendErr);
        }

        if (typeof window !== 'undefined') {
          const el = document.getElementById('recaptcha-container-login');
          if (el) el.innerHTML = '';
          if ((window as any).recaptchaVerifierLogin) {
            try {
              (window as any).recaptchaVerifierLogin.clear();
            } catch {}
            (window as any).recaptchaVerifierLogin = null;
          }
        }

        let msg = 'Failed to send verification code. Please try again.';
        if (err?.code === 'auth/invalid-phone-number') {
          msg = 'Invalid mobile number format. Please check the 10-digit number.';
        } else if (err?.code === 'auth/too-many-requests') {
          msg = 'Too many requests. Please wait a few moments before retrying.';
        } else if (err?.code === 'auth/quota-exceeded') {
          msg = 'Daily SMS quota reached. Please use Google Sign-In or contact support.';
        } else if (err?.message?.includes('already been rendered') || err?.code === 'auth/internal-error') {
          msg = 'Verification service was refreshed. Please tap Continue again.';
        } else if (err?.message) {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setOtpSending(false);
      }
    }
  };

  // Handle segmented digit input with instant auto-submit on completion
  const handleDigitChange = (val: string, index: number) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
      // Pasting full code
      const pasted = clean.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      otpCellRefs[nextIndex]?.current?.focus();
      const fullCode = newDigits.join('').trim();
      if (fullCode.length === 6 && autoSubmittedCodeRef.current !== fullCode) {
        handleOtpLogin(fullCode);
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    if (clean && index < 5) {
      otpCellRefs[index + 1]?.current?.focus();
    }

    const fullCode = newDigits.join('').trim();
    if (fullCode.length === 6 && autoSubmittedCodeRef.current !== fullCode) {
      handleOtpLogin(fullCode);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpCellRefs[index - 1]?.current?.focus();
    } else if (e.nativeEvent.key === 'Enter') {
      const fullCode = otpDigits.join('').trim();
      if (fullCode.length === 6) {
        handleOtpLogin(fullCode);
      }
    }
  };

  // Step 2: Verify Mobile OTP (supports explicit code passed from auto-submit)
  const handleOtpLogin = async (explicitCode?: string) => {
    setError(null);
    const code = (typeof explicitCode === 'string' ? explicitCode : otpDigits.join('')).trim();
    if (!code || code.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }
    if (isSubmitting) return;

    autoSubmittedCodeRef.current = code;
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    setIsSubmitting(true);

    try {
      if (!isLocalhost && confirmationResult) {
        // 🚀 LIVE PRODUCTION: Verify SMS code via Firebase & backend session
        const resConfirm = await confirmationResult.confirm(code);
        const idToken = await resConfirm.user.getIdToken();
        const res: any = await firebaseLogin(idToken);
        if (res?.isNewUser) {
          setIsNewUserModal(true);
        } else {
          handleSuccessNavigation(false, res);
        }
      } else {
        // 💻 LOCALHOST: Verify via backend OTP store
        const res = await otpLogin({ mobile: cleanNum, otp: code });
        if (res?.isNewUser) {
          setIsNewUserModal(true);
        } else {
          handleSuccessNavigation(false, res);
        }
      }
    } catch (err: any) {
      console.warn('[handleOtpLogin error]:', err);
      autoSubmittedCodeRef.current = null;
      let msg = 'Verification failed. Please check the 6-digit code.';
      if (err?.code === 'auth/invalid-verification-code') {
        msg = 'Incorrect SMS OTP code. Please enter the valid 6-digit code received on your phone.';
      } else if (err?.code === 'auth/code-expired') {
        msg = 'Verification code has expired. Please tap Resend to request a new code.';
      } else if (err?.response?.data?.message) {
        msg = err.response.data.message;
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Complete Role Selection for New Users
  const handleCompleteRegistration = async () => {
    setModalError(null);
    const trimmedName = newUserName.trim();
    if (!trimmedName) {
      setModalError('Please enter your full name to proceed.');
      return;
    }
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    setIsCompletingReg(true);
    try {
      const loggedInUser = await completeOtpRegistration({
        mobile: cleanNum,
        name: trimmedName,
        role: selectedRole,
      });
      setIsNewUserModal(false);
      handleSuccessNavigation(false, loggedInUser);
    } catch (err: any) {
      setModalError(err?.response?.data?.message ?? err?.message ?? 'Registration failed. Please try again.');
    } finally {
      setIsCompletingReg(false);
    }
  };

  const handlePartnerPasswordLogin = async () => {
    setError(null);
    const idClean = partnerIdentifier.trim();
    const passClean = partnerPassword.trim();
    if (!idClean) {
      setError('Please enter your registered Partner Mobile Number or King ID.');
      return;
    }
    if (!passClean) {
      setError('Please enter your password.');
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const loggedInUser = await login({ mobile: idClean, password: passClean });
      handleSuccessNavigation(false, loggedInUser);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Partner sign in failed. Check your King ID / Mobile and Password.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchPortal = (nextPortal: 'CLIENT' | 'PARTNER') => {
    if (nextPortal === portalMode) return;
    setPortalMode(nextPortal);
    setError(null);
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const autoFillDevOtp = () => {
    const code = '123456';
    setOtpDigits(code.split(''));
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    handleOtpLogin(code);
  };

  const currentOtpFilled = otpDigits.join('').length === 6;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Ambient Breathing Laser Glow Orbs (Dynamic Cursor Parallax Tracking) */}
      <View
        style={[
          styles.glowOrbTopLeft,
          Platform.OS === 'web' && isDesktop
            ? ({
                transform: [
                  { translateX: mousePos.normX * 55 },
                  { translateY: mousePos.normY * 45 },
                ],
                filter: 'blur(75px)',
                opacity: isMouseActive ? 0.95 : 0.7,
                transition: 'opacity 0.4s ease',
              } as any)
            : undefined,
        ]}
        pointerEvents="none"
      />
      <View
        style={[
          styles.glowOrbBottomRight,
          Platform.OS === 'web' && isDesktop
            ? ({
                transform: [
                  { translateX: -mousePos.normX * 50 },
                  { translateY: -mousePos.normY * 40 },
                ],
                filter: 'blur(85px)',
                opacity: isMouseActive ? 0.9 : 0.65,
                transition: 'opacity 0.4s ease',
              } as any)
            : undefined,
        ]}
        pointerEvents="none"
      />

      {/* Global Interactive Dynamic Spotlight (Desktop Pointer Following) */}
      {Platform.OS === 'web' && isDesktop && isMouseActive ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              pointerEvents: 'none',
              zIndex: 1,
              background: `radial-gradient(750px circle at ${mousePos.x}px ${mousePos.y}px, rgba(16, 185, 129, 0.08), transparent 75%)`,
            } as any,
          ]}
        />
      ) : null}

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainConsoleWrap, isDesktop && styles.mainConsoleWrapDesktop]}>
          
          {/* ══════════════════════════════════════════════════════
              LEFT PANEL: Dynamic Portal Identity & Telemetry Showcase (Desktop)
             ══════════════════════════════════════════════════════ */}
          {isDesktop && (
            <View style={styles.leftShowcasePanel}>
              <LinearGradient
                colors={
                  portalMode === 'PARTNER'
                    ? ['#0f172a', '#1e293b', '#0c1322']
                    : ['#042f24', '#064e3b', '#022c22']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.leftShowcaseGradient}
              >
                {/* 4D Interactive Dynamic Sheen Overlay */}
                {Platform.OS === 'web' && isDesktop && isMouseActive && (
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        pointerEvents: 'none',
                        zIndex: 2,
                        background:
                          portalMode === 'PARTNER'
                            ? `radial-gradient(550px circle at ${Math.max(0, mousePos.x - 40)}px ${mousePos.y}px, rgba(245, 158, 11, 0.12), transparent 70%)`
                            : `radial-gradient(550px circle at ${Math.max(0, mousePos.x - 40)}px ${mousePos.y}px, rgba(52, 211, 153, 0.12), transparent 70%)`,
                      } as any,
                    ]}
                  />
                )}
                {/* Brand Emblem & Header */}
                <View style={styles.showcaseHeader}>
                  <BrandLogo size={52} round useGoldRing useHdQuality />
                  <View style={{ marginLeft: 14 }}>
                    <Text style={styles.showcaseBrandName}>FarmsKing</Text>
                    <Text
                      style={[
                        styles.showcaseTagline,
                        portalMode === 'PARTNER' && { color: '#fcd34d' },
                      ]}
                    >
                      {portalMode === 'PARTNER'
                        ? 'Partner Portal · Doctors & Partners'
                        : 'Client Portal · Farmers, Gardeners & Buyers'}
                    </Text>
                  </View>
                </View>

                {/* Institutional Compliance Seal Strip */}
                <View style={styles.complianceSealRow}>
                  <View style={styles.complianceSealBadge}>
                    <Ionicons
                      name="shield-checkmark"
                      size={13}
                      color={portalMode === 'PARTNER' ? '#fbbf24' : '#34d399'}
                    />
                    <Text style={styles.complianceSealText}>ISO 27001 SECURED</Text>
                  </View>
                  <View style={styles.complianceSealBadge}>
                    <Ionicons
                      name={portalMode === 'PARTNER' ? 'briefcase' : 'leaf'}
                      size={13}
                      color={portalMode === 'PARTNER' ? '#93c5fd' : '#a7f3d0'}
                    />
                    <Text style={styles.complianceSealText}>
                      {portalMode === 'PARTNER' ? 'VERIFIED PARTNER ACCESS' : 'CLIENT ACCOUNT PORTAL'}
                    </Text>
                  </View>
                </View>

                {/* 4 Role-Specific Feature Telemetry Cards */}
                {portalMode === 'PARTNER' ? (
                  <View style={styles.pillarsContainer}>
                    <View style={styles.pillarCard}>
                      <View style={styles.pillarIconWrap}>
                        <Ionicons name="people" size={22} color="#fbbf24" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pillarTitle}>Farmers & Advisory Management</Text>
                        <Text style={styles.pillarDesc}>Adopt farms, guide crop growth, and monitor active plots</Text>
                      </View>
                    </View>

                    <View style={styles.pillarCard}>
                      <View style={styles.pillarIconWrap}>
                        <Ionicons name="medkit" size={22} color="#38bdf8" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pillarTitle}>Crop Doctor & Prescriptions</Text>
                        <Text style={styles.pillarDesc}>Review leaf disease scans, send treatment plans & chat live</Text>
                      </View>
                    </View>

                    <View style={styles.pillarCard}>
                      <View style={styles.pillarIconWrap}>
                        <Ionicons name="storefront" size={22} color="#4ade80" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pillarTitle}>Verified Seller Desk</Text>
                        <Text style={styles.pillarDesc}>Manage listings, dispatch orders, and view direct settlements</Text>
                      </View>
                    </View>

                    <View style={styles.pillarCard}>
                      <View style={styles.pillarIconWrap}>
                        <Ionicons name="wallet" size={22} color="#f472b6" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pillarTitle}>Partner Wallet & Earnings</Text>
                        <Text style={styles.pillarDesc}>Track commissions, training bonuses & instant bank payouts</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.pillarsContainer}>
                    <View style={styles.pillarCard}>
                      <View style={styles.pillarIconWrap}>
                        <Ionicons name="scan-circle" size={22} color="#34d399" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pillarTitle}>AI Crop Pathology</Text>
                        <Text style={styles.pillarDesc}>5-second disease diagnosis aligned with ICAR agronomy protocols</Text>
                      </View>
                    </View>

                    <View style={styles.pillarCard}>
                      <View style={styles.pillarIconWrap}>
                        <Ionicons name="trending-up" size={22} color="#60a5fa" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pillarTitle}>4D Mandi Telemetry</Text>
                        <Text style={styles.pillarDesc}>Live APMC market rates & price trends across 2,400+ mandis</Text>
                      </View>
                    </View>

                    <View style={styles.pillarCard}>
                      <View style={styles.pillarIconWrap}>
                        <Ionicons name="film" size={22} color="#f59e0b" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pillarTitle}>Crop Media Record</Text>
                        <Text style={styles.pillarDesc}>Save 7-day crop photos, live video & voice notes with permanent archive</Text>
                      </View>
                    </View>

                    <View style={styles.pillarCard}>
                      <View style={styles.pillarIconWrap}>
                        <Ionicons name="cart" size={22} color="#ec4899" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pillarTitle}>Official Agri Store</Text>
                        <Text style={styles.pillarDesc}>Direct seeds, fertilizers, crop inputs & tracked farm delivery</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Trust Metrics & Corporate Regd Seal */}
                <View style={styles.showcaseFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={14} color="#facc15" />
                    ))}
                    <Text style={styles.ratingText}>4.9 / 5.0</Text>
                  </View>
                  <Text style={styles.trustText}>
                    Trusted by 50,000+ Cultivators & Agronomists across India
                  </Text>
                  <Text style={styles.corpAddressNotice}>
                    Regd. Office: VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════
              RIGHT PANEL: Ultra-Frictionless Auth Console
             ══════════════════════════════════════════════════════ */}
          <View style={[styles.rightAuthPanel, isDesktop && styles.rightAuthPanelDesktop]}>
            {/* 4D Subtle Spotlight Sheen on Login Card */}
            {Platform.OS === 'web' && isDesktop && isMouseActive && (
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    pointerEvents: 'none',
                    zIndex: 0,
                    borderRadius: 24,
                    background: `radial-gradient(500px circle at ${Math.max(0, mousePos.x - width * 0.45)}px ${mousePos.y}px, rgba(16, 185, 129, 0.07), transparent 70%)`,
                  } as any,
                ]}
              />
            )}
            
            {/* Top Navigation Strip */}
            <View style={styles.topNavRow}>
              <TouchableOpacity
                style={styles.backHomeBtn}
                onPress={() => router.replace('/')}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-back" size={14} color="#94a3b8" />
                <Text style={styles.backHomeText}>Back to FarmsKing</Text>
              </TouchableOpacity>

              {/* Mobile-only brand badge */}
              {!isDesktop && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BrandLogo size={28} round useGoldRing useHdQuality />
                  <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#f8fafc' }}>FarmsKing</Text>
                </View>
              )}
            </View>

            {/* ── TWO SEPARATE LOGIN PARTS: CLIENTS VS PARTNERS ── */}
            <View style={styles.portalSwitchSection}>
              <Text style={styles.portalSectionLabel}>SELECT ACCOUNT TYPE TO SIGN IN</Text>
              <View style={styles.portalSwitchRow}>
                {/* PART 1: CLIENTS */}
                <TouchableOpacity
                  style={[
                    styles.portalOptionCard,
                    portalMode === 'CLIENT' && styles.portalOptionCardClientActive,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => handleSwitchPortal('CLIENT')}
                >
                  <View style={styles.portalCardTopRow}>
                    <View
                      style={[
                        styles.portalIconBox,
                        portalMode === 'CLIENT' && styles.portalIconBoxClientActive,
                      ]}
                    >
                      <Ionicons
                        name="leaf"
                        size={17}
                        color={portalMode === 'CLIENT' ? '#10b981' : '#64748b'}
                      />
                    </View>
                    <Ionicons
                      name={portalMode === 'CLIENT' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={17}
                      color={portalMode === 'CLIENT' ? '#10b981' : '#475569'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.portalCardTitle,
                      portalMode === 'CLIENT' && { color: '#34d399' },
                    ]}
                  >
                    Client Login
                  </Text>
                  <Text style={styles.portalCardSub}>
                    Farmers, Gardeners &amp; Store Buyers
                  </Text>
                </TouchableOpacity>

                {/* PART 2: PARTNERS */}
                <TouchableOpacity
                  style={[
                    styles.portalOptionCard,
                    portalMode === 'PARTNER' && styles.portalOptionCardPartnerActive,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => handleSwitchPortal('PARTNER')}
                >
                  <View style={styles.portalCardTopRow}>
                    <View
                      style={[
                        styles.portalIconBox,
                        portalMode === 'PARTNER' && styles.portalIconBoxPartnerActive,
                      ]}
                    >
                      <Ionicons
                        name="briefcase"
                        size={17}
                        color={portalMode === 'PARTNER' ? '#f59e0b' : '#64748b'}
                      />
                    </View>
                    <Ionicons
                      name={portalMode === 'PARTNER' ? 'checkmark-circle' : 'ellipse-outline'}
                      size={17}
                      color={portalMode === 'PARTNER' ? '#f59e0b' : '#475569'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.portalCardTitle,
                      portalMode === 'PARTNER' && { color: '#fbbf24' },
                    ]}
                  >
                    Partner Login
                  </Text>
                  <Text style={styles.portalCardSub}>
                    Crop Doctors, Partners, Trainers &amp; Sellers
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Console Header */}
            <View style={styles.authHeadingBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Text style={styles.authTitle}>
                  {portalMode === 'PARTNER' ? 'Partner Portal Sign In' : 'Client Sign In'}
                </Text>
                <View
                  style={[
                    styles.portalHeaderTag,
                    portalMode === 'PARTNER'
                      ? { backgroundColor: 'rgba(245, 158, 11, 0.14)', borderColor: 'rgba(245, 158, 11, 0.4)' }
                      : { backgroundColor: 'rgba(16, 185, 129, 0.14)', borderColor: 'rgba(16, 185, 129, 0.4)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.portalHeaderTagText,
                      { color: portalMode === 'PARTNER' ? '#fbbf24' : '#34d399' },
                    ]}
                  >
                    {portalMode === 'PARTNER' ? 'PARTNER ACCESS' : 'CLIENT ACCESS'}
                  </Text>
                </View>
              </View>
              <Text style={styles.authSubtitle}>
                {portalMode === 'PARTNER'
                  ? 'Sign in to your verified Doctor, Business Partner, Trainer, or Seller dashboard.'
                  : 'Fast verified sign in for Farmers, Home Gardeners, and Buyers using mobile OTP or Google.'}
              </Text>
            </View>

            {/* PARTNER SECTION HEADER & AUTH METHOD TOGGLE */}
            {portalMode === 'PARTNER' && (
              <View style={styles.partnerSectionCard}>
                <View style={styles.partnerRolesChipsRow}>
                  {['Crop Doctor', 'Business Partner', 'Trainer', 'Verified Seller'].map((roleLabel) => (
                    <View key={roleLabel} style={styles.partnerRoleChip}>
                      <Ionicons name="shield-checkmark" size={11} color="#fbbf24" />
                      <Text style={styles.partnerRoleChipText}>{roleLabel}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.partnerMethodBar}>
                  <TouchableOpacity
                    style={[
                      styles.partnerMethodBtn,
                      partnerAuthMethod === 'OTP' && styles.partnerMethodBtnActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setPartnerAuthMethod('OTP');
                      setError(null);
                    }}
                  >
                    <Ionicons
                      name="phone-portrait-outline"
                      size={14}
                      color={partnerAuthMethod === 'OTP' ? '#0f172a' : '#cbd5e1'}
                    />
                    <Text
                      style={[
                        styles.partnerMethodText,
                        partnerAuthMethod === 'OTP' && styles.partnerMethodTextActive,
                      ]}
                    >
                      Mobile OTP
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.partnerMethodBtn,
                      partnerAuthMethod === 'PASSWORD' && styles.partnerMethodBtnActive,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      setPartnerAuthMethod('PASSWORD');
                      setError(null);
                    }}
                  >
                    <Ionicons
                      name="key-outline"
                      size={14}
                      color={partnerAuthMethod === 'PASSWORD' ? '#0f172a' : '#cbd5e1'}
                    />
                    <Text
                      style={[
                        styles.partnerMethodText,
                        partnerAuthMethod === 'PASSWORD' && styles.partnerMethodTextActive,
                      ]}
                    >
                      King ID / Password
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Error Banner */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={17} color="#ef4444" style={{ marginTop: 1 }} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Invisible Firebase reCAPTCHA container for Web Phone Auth */}
            <View
              nativeID="recaptcha-container-login"
              id="recaptcha-container-login"
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                opacity: 0,
                overflow: 'hidden',
                pointerEvents: 'none',
              }}
            />

            {portalMode === 'PARTNER' && partnerAuthMethod === 'PASSWORD' ? (
              /* ── PARTNER KING ID / MOBILE + PASSWORD SIGN IN ── */
              <View style={{ gap: 14 }}>
                <View>
                  <Text style={styles.fieldLabel}>Partner King ID or Mobile Number</Text>
                  <View
                    style={[
                      styles.mobileInputWrap,
                      focusedField === 'partnerId' && { borderColor: '#f59e0b' },
                    ]}
                  >
                    <View style={styles.countryCodeBadge}>
                      <Ionicons name="id-card-outline" size={16} color="#fbbf24" />
                    </View>
                    <TextInput
                      style={styles.mobileInput}
                      placeholder="Enter Mobile Number or King ID"
                      placeholderTextColor="#64748b"
                      value={partnerIdentifier}
                      onChangeText={setPartnerIdentifier}
                      onFocus={() => setFocusedField('partnerId')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="none"
                      returnKeyType="next"
                    />
                  </View>
                </View>

                <View>
                  <Text style={styles.fieldLabel}>Password</Text>
                  <View
                    style={[
                      styles.mobileInputWrap,
                      focusedField === 'partnerPass' && { borderColor: '#f59e0b' },
                    ]}
                  >
                    <View style={styles.countryCodeBadge}>
                      <Ionicons name="lock-closed-outline" size={16} color="#fbbf24" />
                    </View>
                    <TextInput
                      style={styles.mobileInput}
                      placeholder="Enter your password"
                      placeholderTextColor="#64748b"
                      secureTextEntry={!showPartnerPassword}
                      value={partnerPassword}
                      onChangeText={setPartnerPassword}
                      onFocus={() => setFocusedField('partnerPass')}
                      onBlur={() => setFocusedField(null)}
                      returnKeyType="done"
                      onSubmitEditing={handlePartnerPasswordLogin}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPartnerPassword((prev) => !prev)}
                      style={{ paddingHorizontal: 12 }}
                    >
                      <Ionicons
                        name={showPartnerPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color="#94a3b8"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handlePartnerPasswordLogin}
                  disabled={isSubmitting || !partnerIdentifier.trim() || !partnerPassword.trim()}
                  activeOpacity={0.88}
                  style={[
                    styles.primaryActionBtn,
                    (!partnerIdentifier.trim() || !partnerPassword.trim() || isSubmitting) && {
                      opacity: 0.55,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={['#f59e0b', '#d97706']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#0f172a" size="small" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Ionicons name="log-in" size={17} color="#0f172a" />
                        <Text style={[styles.buttonText, { color: '#0f172a' }]}>
                          Sign In to Partner Portal
                        </Text>
                      </View>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <Text style={styles.partnerHelperNote}>
                  Partner roles (Crop Doctor, Business Partner, Trainer, Seller) are approved by FarmsKing Admin.
                </Text>
              </View>
            ) : (
              <>
                {/* Localhost Testing Mode Banner: Strictly shown only on Localhost */}
                {isLocalhost && (
                  <View style={styles.devBanner}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="construct" size={16} color="#10b981" />
                      <View>
                        <Text style={styles.devBannerTitle}>Localhost Testing Mode</Text>
                        <Text style={styles.devBannerSubtitle}>
                          Standard Test OTP: <Text style={{ fontFamily: FONT.bold, color: '#f59e0b' }}>123456</Text>
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={autoFillDevOtp}
                      style={styles.autoFillBtn}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.autoFillBtnText}>Auto-Fill 123456</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── STEP 1: Mobile Number Input ── */}
                <View style={styles.inputSection}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.fieldLabel}>
                      {portalMode === 'PARTNER' ? 'Registered Partner Mobile' : 'Mobile Number'}
                    </Text>
                    {otpSent && (
                      <TouchableOpacity
                        onPress={() => {
                          setOtpSent(false);
                          setOtpDigits(['', '', '', '', '', '']);
                          setDevOtp(null);
                          setConfirmationResult(null);
                          autoSubmittedCodeRef.current = null;
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                      >
                        <Ionicons name="pencil" size={13} color="#10b981" />
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#10b981' }}>Change Number</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  <View
                    style={[
                      styles.mobileInputWrap,
                      focusedField === 'mobile' &&
                        (portalMode === 'PARTNER'
                          ? { borderColor: '#f59e0b' }
                          : styles.inputWrapFocused),
                    ]}
                  >
                    <View style={styles.countryCodeBadge}>
                      <Text style={styles.countryCodeText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={styles.mobileInput}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="10-digit mobile number"
                      placeholderTextColor="#64748b"
                      value={mobile}
                      onChangeText={(t) => {
                        setMobile(t);
                        if (otpSent) {
                          setOtpSent(false);
                          setOtpDigits(['', '', '', '', '', '']);
                          setDevOtp(null);
                          setConfirmationResult(null);
                          autoSubmittedCodeRef.current = null;
                        }
                      }}
                      onFocus={() => setFocusedField('mobile')}
                      onBlur={() => setFocusedField(null)}
                      returnKeyType="send"
                      onSubmitEditing={() => {
                        if (mobile.trim().length >= 10 && !otpSending) {
                          handleSendOtp();
                        }
                      }}
                      onKeyPress={(e: any) => {
                        if (e.nativeEvent.key === 'Enter' && mobile.trim().length >= 10 && !otpSending) {
                          handleSendOtp();
                        }
                      }}
                      editable={!otpSent}
                      autoCapitalize="none"
                    />
                    {otpSent && (
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" style={{ marginRight: 10 }} />
                    )}
                  </View>
                </View>

                {/* Request OTP Button */}
                {!otpSent ? (
                  <TouchableOpacity
                    onPress={handleSendOtp}
                    disabled={otpSending || mobile.trim().length < 10}
                    activeOpacity={0.88}
                    style={[styles.primaryActionBtn, (mobile.trim().length < 10 || otpSending) && { opacity: 0.55 }]}
                  >
                    <LinearGradient
                      colors={portalMode === 'PARTNER' ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.gradientBtn}
                    >
                      {otpSending ? (
                        <ActivityIndicator
                          color={portalMode === 'PARTNER' ? '#0f172a' : '#fff'}
                          size="small"
                        />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Ionicons
                            name="paper-plane"
                            size={16}
                            color={portalMode === 'PARTNER' ? '#0f172a' : '#fff'}
                          />
                          <Text
                            style={[
                              styles.buttonText,
                              portalMode === 'PARTNER' && { color: '#0f172a' },
                            ]}
                          >
                            {portalMode === 'PARTNER'
                              ? 'Get Partner Verification Code'
                              : 'Get Verification Code'}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  /* ── STEP 2: Segmented 6-Cell OTP Input ── */
                  <View style={styles.otpSectionBox}>
                    <View style={styles.otpInfoBar}>
                      <Ionicons name="shield-checkmark" size={15} color="#34d399" />
                      <Text style={styles.otpInfoText}>
                        {isLocalhost ? 'Code sent to ' : 'SMS verification code sent to '}
                        <Text style={{ fontFamily: FONT.bold, color: '#f8fafc' }}>+91 {mobile}</Text>
                      </Text>
                    </View>

                    {/* 🌟 Direct In-Context Test OTP Helper Card (Localhost Only) 🌟 */}
                    {isLocalhost && (
                      <View style={styles.testOtpCard}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                            <Ionicons name="key" size={14} color="#f59e0b" />
                            <Text style={styles.testOtpLabel}>Standard Test Code:</Text>
                          </View>
                          <Text style={styles.testOtpCode}>123456</Text>
                        </View>
                        <TouchableOpacity
                          onPress={autoFillDevOtp}
                          style={styles.quickFillButton}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="flash" size={13} color="#10b981" />
                          <Text style={styles.quickFillText}>Auto-Fill 123456</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <Text style={styles.fieldLabel}>Enter 6-Digit Code</Text>
                    
                    {/* 6 Individual Segmented Boxes */}
                    <View style={styles.segmentedRow}>
                      {otpDigits.map((digit, idx) => (
                        <TextInput
                          key={idx}
                          ref={otpCellRefs[idx]}
                          style={[
                            styles.otpCell,
                            digit ? styles.otpCellFilled : null,
                            focusedField === 'otp' && idx === otpDigits.findIndex(d => !d) ? styles.otpCellActive : null,
                          ]}
                          keyboardType="number-pad"
                          maxLength={idx === 0 ? 6 : 1}
                          value={digit}
                          onChangeText={(val) => handleDigitChange(val, idx)}
                          onKeyPress={(e) => handleKeyPress(e, idx)}
                          onFocus={() => setFocusedField('otp')}
                          onBlur={() => setFocusedField(null)}
                          selectTextOnFocus
                          textAlign="center"
                        />
                      ))}
                    </View>

                    {/* Verify & Enter Button */}
                    <TouchableOpacity
                      onPress={() => handleOtpLogin()}
                      disabled={isSubmitting || !currentOtpFilled}
                      activeOpacity={0.88}
                      style={[styles.primaryActionBtn, (!currentOtpFilled || isSubmitting) && { opacity: 0.6 }]}
                    >
                      <LinearGradient
                        colors={portalMode === 'PARTNER' ? ['#f59e0b', '#d97706'] : ['#10b981', '#059669']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBtn}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator
                            color={portalMode === 'PARTNER' ? '#0f172a' : '#fff'}
                            size="small"
                          />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons
                              name="log-in"
                              size={17}
                              color={portalMode === 'PARTNER' ? '#0f172a' : '#fff'}
                            />
                            <Text
                              style={[
                                styles.buttonText,
                                portalMode === 'PARTNER' && { color: '#0f172a' },
                              ]}
                            >
                              {portalMode === 'PARTNER' ? 'Verify & Open Partner Portal' : 'Verify & Enter'}
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Resend Timer / Action */}
                    <View style={styles.resendRow}>
                      {resendTimer > 0 ? (
                        <Text style={styles.resendTimerText}>
                          Resend code in <Text style={{ fontFamily: FONT.bold, color: '#10b981' }}>{resendTimer}s</Text>
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={handleSendOtp} disabled={otpSending}>
                          <Text style={styles.resendActiveText}>Resend Verification Code</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Alternative Divider */}
            <View style={styles.dividerBox}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR CONTINUE WITH GOOGLE</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Google Sign-In Button */}
            <TouchableOpacity
              style={[styles.googleIconBtn, (!request || googleLoading) && styles.googleBtnDisabled]}
              onPress={handleGoogleSignIn}
              disabled={!request || googleLoading || isSubmitting}
              activeOpacity={0.88}
            >
              {googleLoading ? (
                <ActivityIndicator color="#4285F4" size="small" />
              ) : (
                <>
                  <Ionicons name="logo-google" size={18} color="#4285F4" />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Statutory Corporate Identity Footer */}
            <View style={styles.statutoryFooter}>
              <Ionicons name="shield-checkmark" size={14} color="#10b981" />
              <Text style={styles.statutoryFooterText}>
                FARMSKING TECHNOLOGIES PRIVATE LIMITED | CIN: U01100PB2026PTC063294
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ══════════════════════════════════════════════════════
          ONBOARDING ROLE SELECTION MODAL (New Users Only)
         ══════════════════════════════════════════════════════ */}
      <Modal
        visible={isNewUserModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, premiumShadow('#10b981', 'lg')]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalBadge}>
                <Text style={styles.modalBadgeText}>WELCOME TO FARMSKING</Text>
              </View>
              <Text style={styles.modalTitle}>Choose Your Primary Profile</Text>
              <Text style={styles.modalSubtitle}>
                {portalMode === 'PARTNER'
                  ? 'This number is not registered as a Partner yet (Admin approval activates Partner access). You can register below as a Client account.'
                  : 'Select how you primarily use FarmsKing. All accounts include full Customer access automatically.'}
              </Text>
            </View>

            {/* Error Message inside Modal */}
            {modalError ? (
              <View style={[styles.errorBox, { marginBottom: 14 }]}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{modalError}</Text>
              </View>
            ) : null}

            {/* Mandatory Full Name Input */}
            <View style={{ marginBottom: 16 }}>
              <Text style={styles.fieldLabel}>
                Your Full Name <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your full name"
                placeholderTextColor="#64748b"
                value={newUserName}
                onChangeText={(t) => {
                  setNewUserName(t);
                  if (modalError) setModalError(null);
                }}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleCompleteRegistration}
              />
            </View>

            {/* 3 Role Selection Cards */}
            <View style={{ gap: 10, marginBottom: 20 }}>
              {/* Option 1: Customer */}
              <TouchableOpacity
                style={[styles.roleCard, selectedRole === 'CUSTOMER' && styles.roleCardActive]}
                onPress={() => setSelectedRole('CUSTOMER')}
                activeOpacity={0.85}
              >
                <View style={styles.roleCardIcon}>
                  <Ionicons
                    name="cart"
                    size={22}
                    color={selectedRole === 'CUSTOMER' ? '#10b981' : '#64748b'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleCardTitle, selectedRole === 'CUSTOMER' && styles.roleCardTitleActive]}>
                    Customer / Buyer Only
                  </Text>
                  <Text style={styles.roleCardDesc}>
                    Purchase certified seeds, crop protection, tools & fresh farm produce
                  </Text>
                </View>
                <Ionicons
                  name={selectedRole === 'CUSTOMER' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedRole === 'CUSTOMER' ? '#10b981' : '#475569'}
                />
              </TouchableOpacity>

              {/* Option 2: Farmer */}
              <TouchableOpacity
                style={[styles.roleCard, selectedRole === 'FARMER' && styles.roleCardActive]}
                onPress={() => setSelectedRole('FARMER')}
                activeOpacity={0.85}
              >
                <View style={styles.roleCardIcon}>
                  <Ionicons
                    name="leaf"
                    size={22}
                    color={selectedRole === 'FARMER' ? '#10b981' : '#64748b'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleCardTitle, selectedRole === 'FARMER' && styles.roleCardTitleActive]}>
                    Farmer + Buyer
                  </Text>
                  <Text style={styles.roleCardDesc}>
                    AI crop doctor scanner, live mandi prices, farm logs & precision schedules
                  </Text>
                </View>
                <Ionicons
                  name={selectedRole === 'FARMER' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedRole === 'FARMER' ? '#10b981' : '#475569'}
                />
              </TouchableOpacity>

              {/* Option 3: Gardener */}
              <TouchableOpacity
                style={[styles.roleCard, selectedRole === 'GARDENER' && styles.roleCardActive]}
                onPress={() => setSelectedRole('GARDENER')}
                activeOpacity={0.85}
              >
                <View style={styles.roleCardIcon}>
                  <Ionicons
                    name="flower"
                    size={22}
                    color={selectedRole === 'GARDENER' ? '#10b981' : '#64748b'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.roleCardTitle, selectedRole === 'GARDENER' && styles.roleCardTitleActive]}>
                    Home Gardener
                  </Text>
                  <Text style={styles.roleCardDesc}>
                    Terrace gardens, indoor botany, organic remedies & plant care advisory
                  </Text>
                </View>
                <Ionicons
                  name={selectedRole === 'GARDENER' ? 'radio-button-on' : 'radio-button-off'}
                  size={20}
                  color={selectedRole === 'GARDENER' ? '#10b981' : '#475569'}
                />
              </TouchableOpacity>
            </View>

            {/* Confirm & Launch Dashboard */}
            <TouchableOpacity
              onPress={handleCompleteRegistration}
              disabled={isCompletingReg || !newUserName.trim()}
              activeOpacity={0.88}
              style={[styles.primaryActionBtn, (isCompletingReg || !newUserName.trim()) && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={['#10b981', '#059669']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBtn}
              >
                {isCompletingReg ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="checkmark-done" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Complete Profile & Enter</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    backgroundColor: '#070c18',
    width: '100%',
  },
  scroll: {
    flexGrow: 1,
    minHeight: Platform.OS === 'web' ? ('100vh' as any) : '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 10,
    backgroundColor: '#070c18',
    width: '100%',
  },
  glowOrbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  glowOrbBottomRight: {
    position: 'absolute',
    bottom: -120,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(5, 150, 105, 0.10)',
  },
  mainConsoleWrap: {
    width: '100%',
    maxWidth: 480,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mainConsoleWrapDesktop: {
    maxWidth: 1080,
    flexDirection: 'row',
    minHeight: 640,
  },

  // ── Left Showcase Panel (Desktop) ──
  leftShowcasePanel: {
    flex: 1.1,
  },
  leftShowcaseGradient: {
    flex: 1,
    padding: 36,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showcaseBrandName: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  showcaseTagline: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    marginTop: 1,
  },
  complianceSealRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 18,
  },
  complianceSealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  complianceSealText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
    letterSpacing: 0.6,
  },
  pillarsContainer: {
    gap: 12,
    marginVertical: 24,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...(Platform.OS === 'web'
      ? ({
          transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.22s ease, background-color 0.22s ease',
        } as any)
      : {}),
  },
  pillarIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  pillarDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginTop: 2,
    lineHeight: 15,
  },
  showcaseFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    paddingTop: 16,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#fef08a',
    marginLeft: 4,
  },
  trustText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#d1fae5',
    lineHeight: 16,
  },
  corpAddressNotice: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#6ee7b7',
    marginTop: 6,
    opacity: 0.85,
  },

  // ── Right Auth Panel ──
  rightAuthPanel: {
    padding: 18,
    backgroundColor: '#0c1322',
    justifyContent: 'center',
    width: '100%',
  },
  rightAuthPanelDesktop: {
    flex: 1,
    padding: 38,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backHomeText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  authHeadingBox: {
    marginBottom: 22,
  },
  authTitle: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  authSubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 18,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: RADIUS.md,
    padding: 11,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#fca5a5',
    lineHeight: 16,
  },
  testOtpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  testOtpLabel: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#fbbf24',
  },
  testOtpCode: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#34d399',
    letterSpacing: 2,
  },
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.50)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  quickFillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 16,
  },
  devBannerTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  devBannerSubtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  autoFillBtn: {
    backgroundColor: '#10b981',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  autoFillBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // ── Inputs & Segmented OTP ──
  inputSection: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  mobileInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#141d30',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    overflow: 'hidden',
  },
  inputWrapFocused: {
    borderColor: '#10b981',
    backgroundColor: '#162238',
  },
  countryCodeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 13,
    backgroundColor: '#1a263e',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  countryCodeText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    letterSpacing: 0.5,
  },
  primaryActionBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: 4,
  },
  gradientBtn: {
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // ── Segmented 6-Cell OTP Input ──
  otpSectionBox: {
    marginTop: 4,
    marginBottom: 8,
  },
  otpInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.10)',
    padding: 8,
    borderRadius: 8,
    marginBottom: 14,
  },
  otpInfoText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#a7f3d0',
  },
  segmentedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  otpCell: {
    width: 44,
    height: 48,
    backgroundColor: '#141d30',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    textAlign: 'center',
    padding: 0,
  },
  otpCellFilled: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  otpCellActive: {
    borderColor: '#34d399',
    backgroundColor: '#172540',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendTimerText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  resendActiveText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#34d399',
  },

  // ── Alternative Divider ──
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  dividerText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.8,
    marginHorizontal: 12,
  },
  googleIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    paddingVertical: 12,
    gap: 10,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#1e293b',
  },
  statutoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 22,
  },
  statutoryFooterText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#475569',
    textAlign: 'center',
  },

  // ── Modal Styles ──
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(3, 7, 18, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0c1322',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    marginBottom: 16,
  },
  modalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  modalBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.6,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
  },
  modalSubtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
  },
  modalInput: {
    backgroundColor: '#141d30',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.10)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#f8fafc',
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#141d30',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
  },
  roleCardActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  roleCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleCardTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  roleCardTitleActive: {
    color: '#34d399',
  },
  roleCardDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },

  // ── Two-Part Client vs Partner Login Selector ──
  portalSwitchSection: {
    marginBottom: 18,
    gap: 8,
  },
  portalSectionLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.7,
  },
  portalSwitchRow: {
    flexDirection: 'row',
    gap: 10,
  },
  portalOptionCard: {
    flex: 1,
    backgroundColor: '#111a2e',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 14,
    padding: 12,
    gap: 5,
  },
  portalOptionCardClientActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },
  portalOptionCardPartnerActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#f59e0b',
  },
  portalCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  portalIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  portalIconBoxClientActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  portalIconBoxPartnerActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  portalCardTitle: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
  },
  portalCardSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 14,
  },
  portalHeaderTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  portalHeaderTagText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.6,
  },
  partnerSectionCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.22)',
    borderRadius: 14,
    padding: 10,
    gap: 10,
    marginBottom: 14,
  },
  partnerRolesChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  partnerRoleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  partnerRoleChipText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#fde68a',
  },
  partnerMethodBar: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: 'rgba(7, 12, 24, 0.65)',
    padding: 4,
    borderRadius: 10,
  },
  partnerMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: 7,
  },
  partnerMethodBtnActive: {
    backgroundColor: '#fbbf24',
  },
  partnerMethodText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  partnerMethodTextActive: {
    color: '#0f172a',
    fontFamily: FONT.extraBold,
  },
  partnerHelperNote: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 15,
  },
});
