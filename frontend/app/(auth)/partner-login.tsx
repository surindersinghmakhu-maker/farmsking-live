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
import { clearDetachedRecaptchaHost, getFreshDetachedRecaptchaHost } from '@/src/utils/recaptchaHost';
import { useAuth } from '@/src/store/auth-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useLanguage } from '@/src/store/language-context';
import { FONT, RADIUS } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';
import { PartnerSignupModal } from '@/src/components/PartnerSignupModal';
import type { PartnerApplicationDto, PartnerUserSummary } from '@/src/api/auth.api';

if (Platform.OS !== 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

const GOOGLE_CLIENT_ID = '742233980320-ito7h8q3iq5vdon6b93qc08q5l8c3v9v.apps.googleusercontent.com';

interface ShowcaseBenefit {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  title: string;
  desc: string;
}

const PARTNER_BENEFITS: ShowcaseBenefit[] = [
  {
    icon: 'leaf',
    color: '#22c55e',
    title: 'Nursery Seedling & Paniri Desk',
    desc: 'Supply certified flower, vegetable & paddy plugs with central escrow',
  },
  {
    icon: 'people',
    color: '#fbbf24',
    title: 'Manage Adopted Farmers',
    desc: 'Guide assigned farms and monitor active crop plots',
  },
  {
    icon: 'medkit',
    color: '#38bdf8',
    title: 'Crop Doctor Advice',
    desc: 'Check farmer leaf photos and send clear spray plans',
  },
  {
    icon: 'storefront',
    color: '#4ade80',
    title: 'Seller Store & Orders',
    desc: 'Manage product stock, dispatch orders & settlements',
  },
  {
    icon: 'wallet',
    color: '#f472b6',
    title: 'Partner Wallet & Bank Payouts',
    desc: 'Track partner earnings & withdraw directly to your bank',
  },
];

export default function PartnerLoginScreen() {
  const { user, login, googleLogin, sendLoginOtp, otpLogin, firebaseLogin, logout } = useAuth();
  const { data: appSettings } = useAppSettings();
  const { setLanguage } = useLanguage();
  const router = useRouter();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 960;

  const handleBackHome = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/';
    } else {
      router.replace('/');
    }
  };

  const getDashboardRoute = (u: any) => {
    if (!u) return '/login';
    const roles = [u.role, ...(Array.isArray(u.roles) ? u.roles : [])];
    if (roles.includes('SELLER')) return '/seller-dashboard';
    if (['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].some((r) => roles.includes(r))) {
      return '/(partner)/(tabs)';
    }
    return '/(user)/(tabs)';
  };

  const [partnerAuthMethod, setPartnerAuthMethod] = useState<'OTP' | 'PASSWORD'>('OTP');
  const [partnerIdentifier, setPartnerIdentifier] = useState('');
  const [partnerPassword, setPartnerPassword] = useState('');
  const [showPartnerPassword, setShowPartnerPassword] = useState(false);

  // Enforce English as default language
  useEffect(() => {
    setLanguage('en');
  }, []);

  // Guarantee dark background
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

  const handleSuccessNavigation = (loggedInUser?: any) => {
    const targetUser = loggedInUser || user;
    const needsMobileOtp =
      !targetUser?.mobile || String(targetUser.mobile).startsWith('G_');
    if (needsMobileOtp) {
      router.replace('/verify-mobile' as any);
      return;
    }
    if (redirect) {
      router.replace(redirect as any);
      return;
    }
    const deactivatedSet = new Set<string>(
      Array.isArray((targetUser as any)?.deactivatedRoles) ? (targetUser as any).deactivatedRoles : [],
    );
    const activeRoles: string[] = Array.from(
      new Set(
        [
          targetUser?.role,
          ...(Array.isArray(targetUser?.roles) ? targetUser.roles : []),
        ].filter((r): r is string => Boolean(r) && !deactivatedSet.has(r)),
      ),
    );

    const partnerTabRoles = ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR'];
    if (activeRoles.some((r) => partnerTabRoles.includes(r))) {
      router.replace('/(partner)/(tabs)');
      return;
    }
    if (activeRoles.includes('SELLER')) {
      router.replace('/seller-dashboard' as any);
      return;
    }
    router.replace('/(partner)/(tabs)');
  };

  const [mobile, setMobile] = useState('');
  const [focusedField, setFocusedField] = useState<'mobile' | 'otp' | 'partnerId' | 'partnerPass' | null>(null);
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

  // Inactivity / 30-minute idle lock alert
  const [idleTimeoutNotice, setIdleTimeoutNotice] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        if (sessionStorage.getItem('farmsking_partner_idle_expired') === '1') {
          setIdleTimeoutNotice(true);
          sessionStorage.removeItem('farmsking_partner_idle_expired');
        }
      } catch {}
    }
  }, []);

  // Partner Self-Signup / Status / Rejection Modal State
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [partnerModalMobile, setPartnerModalMobile] = useState('');
  const [partnerUploadToken, setPartnerUploadToken] = useState<string | null>(null);
  const [partnerExistingUser, setPartnerExistingUser] = useState<PartnerUserSummary | null>(null);
  const [partnerExistingApp, setPartnerExistingApp] = useState<PartnerApplicationDto | null>(null);
  const [partnerActionPrompt, setPartnerActionPrompt] = useState<{
    code: 'PARTNER_APPLICATION_PENDING' | 'PARTNER_APPLICATION_REJECTED' | 'PARTNER_ROLE_NOT_GRANTED';
    rejectionReason?: string;
    mobile?: string;
    existingKingId?: string | null;
    partnerUploadToken?: string | null;
    existingUserSummary?: PartnerUserSummary | null;
    existingApplication?: PartnerApplicationDto | null;
  } | null>(null);

  const openPartnerSignupModal = (opts?: {
    mobile?: string;
    partnerUploadToken?: string | null;
    existingUserSummary?: PartnerUserSummary | null;
    existingApplication?: PartnerApplicationDto | null;
  }) => {
    setPartnerModalMobile(opts?.mobile ?? (mobile.trim() || partnerIdentifier.trim()));
    setPartnerUploadToken(opts?.partnerUploadToken ?? null);
    setPartnerExistingUser(opts?.existingUserSummary ?? null);
    setPartnerExistingApp(opts?.existingApplication ?? null);
    setPartnerModalOpen(true);
  };

  const applyStructuredPartnerError = (err: any, fallbackMobile?: string): boolean => {
    const data = err?.response?.data;
    const code = data?.code;
    if (
      code === 'PARTNER_APPLICATION_PENDING' ||
      code === 'PARTNER_APPLICATION_REJECTED' ||
      code === 'PARTNER_ROLE_NOT_GRANTED'
    ) {
      setPartnerActionPrompt({
        code,
        rejectionReason: data?.rejectionReason,
        mobile: data?.mobile || fallbackMobile,
        existingKingId: data?.existingKingId,
        partnerUploadToken: data?.partnerUploadToken ?? null,
        existingUserSummary: data?.existingUserSummary ?? null,
        existingApplication: data?.existingApplication ?? null,
      });
      setError(data?.message || 'Partner account requires verification or approval.');
      return true;
    }
    setPartnerActionPrompt(null);
    return false;
  };

  // Mouse tracking for 4D lighting
  const mouseTargetRef = useRef({ x: 0, y: 0, normX: 0, normY: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, normX: 0, normY: 0 });
  const [isMouseActive, setIsMouseActive] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined' || !isDesktop) return;

    let animId: number;
    let currX = window.innerWidth / 2;
    let currY = window.innerHeight / 2;

    const onMove = (e: MouseEvent) => {
      setIsMouseActive((prev) => (prev ? prev : true));
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
      const dx = tgt.x - currX;
      const dy = tgt.y - currY;
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        currX += dx * 0.08;
        currY += dy * 0.08;
        const nx = (currX / window.innerWidth) * 2 - 1;
        const ny = (currY / window.innerHeight) * 2 - 1;
        const nextX = Math.round(currX);
        const nextY = Math.round(currY);
        const nextNormX = Math.round(nx * 1000) / 1000;
        const nextNormY = Math.round(ny * 1000) / 1000;
        setMousePos((prev) => {
          if (prev.x === nextX && prev.y === nextY && prev.normX === nextNormX && prev.normY === nextNormY) {
            return prev;
          }
          return {
            x: nextX,
            y: nextY,
            normX: nextNormX,
            normY: nextNormY,
          };
        });
      }
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
              portal: 'PARTNER',
            });
            handleSuccessNavigation(loggedInUser.user);
          })
          .catch((err) => {
            if (!applyStructuredPartnerError(err)) {
              const msg = err?.response?.data?.message ?? err?.message ?? 'Google Sign-In failed.';
              setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
            }
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
        let idToken: string | undefined;
        let credUser: any = null;
        try {
          const provider = new GoogleAuthProvider();
          provider.setCustomParameters({ prompt: 'select_account' });
          const cred = await signInWithPopup(auth, provider);
          credUser = cred.user;
          idToken = await cred.user.getIdToken();
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
          setGoogleLoading(false);
          return;
        }

        try {
          const res = await googleLogin({
            idToken,
            email: credUser?.email || undefined,
            name: credUser?.displayName || undefined,
            photoUrl: credUser?.photoURL || undefined,
            googleId: credUser?.uid,
            portal: 'PARTNER',
          });
          handleSuccessNavigation(res.user);
        } catch (apiErr: any) {
          if (!applyStructuredPartnerError(apiErr)) {
            const msg = apiErr?.response?.data?.message ?? apiErr?.message ?? 'Google Sign-In failed.';
            setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
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
      const msg = err?.response?.data?.message ?? err?.message ?? 'Please retry.';
      setError('Google Sign-In failed: ' + (Array.isArray(msg) ? msg.join(', ') : String(msg)));
      setGoogleLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setError(null);
    setPartnerActionPrompt(null);
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length < 10) {
      setError('Please enter a valid 10-digit registered partner mobile number.');
      return;
    }
    setOtpSending(true);

    if (isLocalhost) {
      try {
        const otpRes = await sendLoginOtp(cleanNum, 'PARTNER');
        if (otpRes?.isNewUser) {
          setPartnerActionPrompt({ code: 'PARTNER_ROLE_NOT_GRANTED', mobile: cleanNum });
          setError('Mobile number is not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please apply below or contact support.');
          return;
        }
        setOtpSent(true);
        const codeToFill = String(otpRes?.devOtp || '123456').slice(0, 6);
        setDevOtp(codeToFill);
        setOtpDigits(codeToFill.split(''));
        setResendTimer(60);
        setTimeout(() => otpCellRefs[5]?.current?.focus(), 300);
      } catch (err: any) {
        if (!applyStructuredPartnerError(err, cleanNum)) {
          const msg = err?.response?.data?.message ?? err?.message ?? 'Could not send verification code. Please check your details.';
          setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
        }
      } finally {
        setOtpSending(false);
      }
    } else {
      try {
        if (typeof window !== 'undefined') {
          const el = getFreshDetachedRecaptchaHost('fk-recaptcha-partner-login-host', 'recaptchaVerifierPartnerLogin');
          (window as any).recaptchaVerifierPartnerLogin = new RecaptchaVerifier(
            auth,
            el,
            { size: 'invisible' }
          );
        }

        const confirmation = await signInWithPhoneNumber(
          auth,
          `+91${cleanNum}`,
          (window as any).recaptchaVerifierPartnerLogin
        );

        setConfirmationResult(confirmation);
        setOtpSent(true);
        setDevOtp(null);
        setOtpDigits(['', '', '', '', '', '']);
        setResendTimer(60);
        setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
      } catch (err: any) {
        console.warn('[Firebase Phone Auth error, initiating fallback]:', err);

        try {
          const fallbackRes = await sendLoginOtp(cleanNum, 'PARTNER');
          if (fallbackRes?.isNewUser) {
            setPartnerActionPrompt({ code: 'PARTNER_ROLE_NOT_GRANTED', mobile: cleanNum });
            setError('Mobile number is not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please apply below or contact support.');
            return;
          }
          setConfirmationResult(null);
          setOtpSent(true);
          setDevOtp(fallbackRes?.devOtp || null);
          setOtpDigits(['', '', '', '', '', '']);
          setResendTimer(60);
          setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
          return;
        } catch (backendErr: any) {
          if (applyStructuredPartnerError(backendErr, cleanNum)) {
            return;
          }
          const backendStatus = backendErr?.response?.status;
          const backendMsg = backendErr?.response?.data?.message;
          if (backendStatus && backendStatus < 500 && backendMsg) {
            setError(Array.isArray(backendMsg) ? backendMsg.join(', ') : String(backendMsg));
            return;
          }
        }

        clearDetachedRecaptchaHost('fk-recaptcha-partner-login-host', 'recaptchaVerifierPartnerLogin');

        let msg = 'Failed to send verification code. Please try again.';
        if (err?.code === 'auth/invalid-phone-number') {
          msg = 'Invalid mobile number format. Please check the 10-digit number.';
        } else if (err?.code === 'auth/too-many-requests') {
          msg = 'Too many requests. Please wait a few moments before retrying.';
        } else if (err?.code === 'auth/quota-exceeded') {
          msg = 'Daily SMS quota reached. Please use King ID & Password or contact support.';
        } else if (err?.message) {
          msg = err.message;
        }
        setError(msg);
      } finally {
        setOtpSending(false);
      }
    }
  };

  const handleDigitChange = (val: string, index: number) => {
    const clean = val.replace(/\D/g, '');
    if (clean.length > 1) {
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
        const resConfirm = await confirmationResult.confirm(code);
        const idToken = await resConfirm.user.getIdToken();
        const res: any = await firebaseLogin(idToken, 'PARTNER');
        if (res?.isNewUser) {
          setPartnerActionPrompt({ code: 'PARTNER_ROLE_NOT_GRANTED', mobile: cleanNum });
          setError('Not registered as a FarmsKing Partner. Please apply below or contact support.');
        } else {
          handleSuccessNavigation(res);
        }
      } else {
        const res = await otpLogin({ mobile: cleanNum, otp: code, portal: 'PARTNER' });
        if (res?.isNewUser) {
          setPartnerActionPrompt({ code: 'PARTNER_ROLE_NOT_GRANTED', mobile: cleanNum });
          setError('Not registered as a FarmsKing Partner. Please apply below or contact support.');
        } else {
          handleSuccessNavigation(res);
        }
      }
    } catch (err: any) {
      console.warn('[handleOtpLogin error]:', err);
      autoSubmittedCodeRef.current = null;
      if (applyStructuredPartnerError(err, cleanNum)) {
        return;
      }
      let msg = 'Verification failed. Please check the 6-digit code.';
      if (err?.code === 'auth/invalid-verification-code') {
        msg = 'Incorrect SMS OTP code. Please enter the valid 6-digit code received on your phone.';
      } else if (err?.code === 'auth/code-expired') {
        msg = 'Verification code has expired. Please tap Resend to request a new code.';
      } else if (err?.response?.data?.message) {
        msg = Array.isArray(err.response.data.message)
          ? err.response.data.message.join(', ')
          : String(err.response.data.message);
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePartnerPasswordLogin = async () => {
    setError(null);
    setPartnerActionPrompt(null);
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
      const loggedInUser = await login({ mobile: idClean, password: passClean, portal: 'PARTNER' });
      handleSuccessNavigation(loggedInUser);
    } catch (err: any) {
      if (!applyStructuredPartnerError(err, idClean)) {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          'Partner sign in failed. Check your King ID / Mobile and Password.';
        setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const autoFillDevOtp = (codeOverride?: string) => {
    const code = String(codeOverride || devOtp || '123456').slice(0, 6);
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
      {/* Dynamic Cursor Parallax Glow Orbs */}
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

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainConsoleWrap, isDesktop && styles.mainConsoleWrapDesktop]}>
          <LinearGradient
            colors={['#f59e0b', '#fbbf24', '#d97706']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topAccentRim}
          />
          <View style={isDesktop ? styles.consoleColumnsDesktop : undefined}>
            {/* ══════════════════════════════════════════════════════
                LEFT PANEL: Partner Benefits Showcase (Desktop)
               ══════════════════════════════════════════════════════ */}
            {isDesktop && (
              <View style={styles.leftShowcasePanel}>
                <LinearGradient
                  colors={['#0f172a', '#1e293b', '#0c1322']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.leftShowcaseGradient}
                >
                  <View>
                    {/* Brand Emblem & Header */}
                    <TouchableOpacity
                      style={styles.showcaseHeader}
                      onPress={() => router.replace('/')}
                      activeOpacity={0.8}
                    >
                      <BrandLogo size={42} round useGoldRing useHdQuality />
                      <View style={{ marginLeft: 12 }}>
                        <Text style={styles.showcaseBrandName}>FarmsKing</Text>
                        <Text style={[styles.showcaseTagline, { color: '#fcd34d' }]}>
                          Partner &amp; Agronomist Portal
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* Trust Seal Strip */}
                    <View style={styles.complianceSealRow}>
                      <View style={styles.complianceSealBadge}>
                        <Ionicons name="shield-checkmark" size={12} color="#fbbf24" />
                        <Text style={styles.complianceSealText}>ISO 27001 SAFE</Text>
                      </View>
                      <View style={styles.complianceSealBadge}>
                        <Ionicons name="briefcase" size={12} color="#93c5fd" />
                        <Text style={styles.complianceSealText}>VERIFIED AGENT DESK</Text>
                      </View>
                    </View>
                  </View>

                  {/* Partner Benefits List */}
                  <View style={styles.pillarsContainer}>
                    {PARTNER_BENEFITS.map((item) => (
                      <View key={item.title} style={styles.pillarCard}>
                        <View style={[styles.pillarIconWrap, { backgroundColor: `${item.color}18` }]}>
                          <Ionicons name={item.icon} size={18} color={item.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pillarTitle}>{item.title}</Text>
                          <Text style={styles.pillarDesc} numberOfLines={2}>
                            {item.desc}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Trust Footer */}
                  <View style={styles.showcaseFooter}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons key={s} name="star" size={12} color="#facc15" />
                      ))}
                      <Text style={styles.ratingText}>4.9 / 5</Text>
                      <Text style={styles.trustInlineText}> · Trusted by 5,000+ Agri Partners</Text>
                    </View>
                    <Text style={styles.corpAddressNotice}>
                      Regd. Office: VPO Goindwal Sahib, Tarn Taran, Punjab
                    </Text>
                  </View>
                </LinearGradient>
              </View>
            )}

            {/* ══════════════════════════════════════════════════════
                RIGHT PANEL: Dedicated Partner Auth Console
               ══════════════════════════════════════════════════════ */}
            <View style={[styles.rightAuthPanel, isDesktop && styles.rightAuthPanelDesktop]}>
              {/* Top Navigation Strip */}
              <View style={styles.topNavRow}>
                <TouchableOpacity
                  style={styles.backHomeBtn}
                  onPress={handleBackHome}
                  accessibilityRole="link"
                  {...(Platform.OS === 'web' ? { href: '/' } : {})}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={14} color="#94a3b8" />
                  <Text style={styles.backHomeText}>Back to Home</Text>
                </TouchableOpacity>

                {!isDesktop ? (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}
                    onPress={handleBackHome}
                    accessibilityRole="link"
                    {...(Platform.OS === 'web' ? { href: '/' } : {})}
                    activeOpacity={0.8}
                  >
                    <BrandLogo size={26} round useGoldRing useHdQuality />
                    <Text style={{ fontSize: 13.5, fontFamily: FONT.bold, color: '#f8fafc' }}>FarmsKing</Text>
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Already Signed In Banner (e.g. Farmer wanting to switch to Partner) */}
              {user && (
                <View style={styles.activeSessionBanner}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="person-circle" size={15} color="#fbbf24" />
                      <Text style={styles.activeSessionTitle}>Already Signed In</Text>
                    </View>
                    <Text style={styles.activeSessionSubtitle} numberOfLines={1}>
                      {user.name || user.mobile} ({user.role})
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      style={styles.activeSessionBtn}
                      onPress={() => router.push(getDashboardRoute(user) as any)}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.activeSessionBtnText}>Dashboard →</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.activeSessionBtn, styles.activeSessionLogoutBtn]}
                      onPress={async () => {
                        await logout();
                      }}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.activeSessionLogoutText}>Logout</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Title & Portal Badge */}
              <View style={styles.headingBox}>
                <View style={styles.partnerBadge}>
                  <Ionicons name="briefcase" size={11} color="#fbbf24" />
                  <Text style={styles.partnerBadgeText}>PARTNER PORTAL</Text>
                </View>
                <Text style={styles.mainTitle}>Partner Sign In</Text>
                <Text style={styles.subTitle}>
                  For authorized Agronomists, Crop Doctors, Sellers, and Field Managers
                </Text>
              </View>

              {/* PARTNER LOGIN METHOD TOGGLE (Mobile OTP vs King ID & Password) */}
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
                    size={13}
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
                    size={13}
                    color={partnerAuthMethod === 'PASSWORD' ? '#0f172a' : '#cbd5e1'}
                  />
                  <Text
                    style={[
                      styles.partnerMethodText,
                      partnerAuthMethod === 'PASSWORD' && styles.partnerMethodTextActive,
                    ]}
                  >
                    King ID &amp; Password
                  </Text>
                </TouchableOpacity>
              </View>

              {/* 120-Minute Idle Timeout Notice */}
              {idleTimeoutNotice && (
                <View style={styles.idleNoticeBox}>
                  <Ionicons name="time" size={18} color="#f59e0b" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.idleNoticeTitle}>Partner Session Locked (120 Min Idle)</Text>
                    <Text style={styles.idleNoticeText}>
                      Your session expired due to 120 minutes of inactivity. For ISO 27001 data protection, please sign in again.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIdleTimeoutNotice(false)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              )}

              {/* Error Banner */}
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginTop: 1 }} />
                  <View style={{ flex: 1, gap: 6 }}>
                    <Text style={styles.errorText}>{error}</Text>
                    {partnerActionPrompt?.code === 'PARTNER_APPLICATION_REJECTED' &&
                    partnerActionPrompt.rejectionReason ? (
                      <Text style={{ fontSize: 11.5, color: '#fca5a5', fontFamily: FONT.semiBold }}>
                        Reason: {partnerActionPrompt.rejectionReason}
                      </Text>
                    ) : null}
                    {partnerActionPrompt ? (
                      <TouchableOpacity
                        onPress={() =>
                          openPartnerSignupModal({
                            mobile: partnerActionPrompt.mobile,
                            partnerUploadToken: partnerActionPrompt.partnerUploadToken ?? null,
                            existingUserSummary: partnerActionPrompt.existingUserSummary ?? null,
                            existingApplication: partnerActionPrompt.existingApplication ?? null,
                          })
                        }
                        activeOpacity={0.85}
                        style={[
                          styles.portalSwitchHintBtn,
                          { borderColor: 'rgba(245, 158, 11, 0.55)', backgroundColor: 'rgba(245, 158, 11, 0.16)' },
                        ]}
                      >
                        <Text style={[styles.portalSwitchHintText, { color: '#fbbf24' }]}>
                          {partnerActionPrompt.code === 'PARTNER_APPLICATION_REJECTED'
                            ? 'Edit & Resubmit Rejected Profile →'
                            : partnerActionPrompt.code === 'PARTNER_APPLICATION_PENDING'
                            ? 'Check / Update Application →'
                            : 'Apply / Sign Up as Partner →'}
                        </Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      onPress={() => router.push('/contact-us' as any)}
                      activeOpacity={0.85}
                      style={[
                        styles.portalSwitchHintBtn,
                        { borderColor: 'rgba(56, 189, 248, 0.45)', backgroundColor: 'rgba(56, 189, 248, 0.14)' },
                      ]}
                    >
                      <Text style={[styles.portalSwitchHintText, { color: '#38bdf8' }]}>
                        Contact FarmsKing Support →
                      </Text>
                    </TouchableOpacity>
                    {(error.includes('User Login') || error.includes('Farmer')) && (
                      <TouchableOpacity
                        onPress={() => router.replace('/login' as any)}
                        activeOpacity={0.85}
                        style={[
                          styles.portalSwitchHintBtn,
                          { borderColor: 'rgba(16, 185, 129, 0.45)', backgroundColor: 'rgba(16, 185, 129, 0.14)' },
                        ]}
                      >
                        <Text style={[styles.portalSwitchHintText, { color: '#34d399' }]}>
                          Switch to Farmer Login →
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : null}

              {partnerAuthMethod === 'PASSWORD' ? (
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
                    Agent, Doctor, Trainer, and Seller accounts are activated by FarmsKing Admin.
                  </Text>
                </View>
              ) : (
                /* ── PARTNER MOBILE OTP SIGN IN ── */
                <>
                  {/* Localhost Testing Mode Banner: Strictly shown only on Localhost when devOtp is present */}
                  {isLocalhost && devOtp && (
                    <View style={styles.devBanner}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="construct" size={14} color="#f59e0b" />
                        <Text style={styles.devBannerSubtitle}>
                          Local Test OTP: <Text style={{ fontFamily: FONT.bold, color: '#f59e0b' }}>{devOtp}</Text>
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => autoFillDevOtp(devOtp)}
                        style={styles.autoFillBtn}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.autoFillBtnText}>Auto-Fill {devOtp}</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.inputSection}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <Text style={styles.fieldLabel}>Registered Partner Mobile</Text>
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
                          <Ionicons name="pencil" size={12} color="#fbbf24" />
                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#fbbf24' }}>Change Number</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <View
                      style={[
                        styles.mobileInputWrap,
                        focusedField === 'mobile' && { borderColor: '#f59e0b' },
                      ]}
                    >
                      <View style={styles.countryCodeBadge}>
                        <Text style={styles.countryCodeText}>+91</Text>
                      </View>
                      <TextInput
                        style={styles.mobileInput}
                        keyboardType="phone-pad"
                        maxLength={10}
                        placeholder="Enter 10-digit registered number"
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
                        <Ionicons name="checkmark-circle" size={17} color="#fbbf24" style={{ marginRight: 10 }} />
                      )}
                    </View>
                  </View>

                  {!otpSent ? (
                    <TouchableOpacity
                      onPress={handleSendOtp}
                      disabled={otpSending || mobile.trim().length < 10}
                      activeOpacity={0.88}
                      style={[
                        styles.primaryActionBtn,
                        (mobile.trim().length < 10 || otpSending) && { opacity: 0.55 },
                      ]}
                    >
                      <LinearGradient
                        colors={['#f59e0b', '#d97706']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.gradientBtn}
                      >
                        {otpSending ? (
                          <ActivityIndicator color="#0f172a" size="small" />
                        ) : (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="paper-plane" size={15} color="#0f172a" />
                            <Text style={[styles.buttonText, { color: '#0f172a' }]}>Send Partner OTP</Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.otpSectionBox}>
                      <View style={styles.otpInfoBar}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="shield-checkmark" size={14} color="#fbbf24" />
                          <Text style={styles.otpInfoText}>
                            Code sent to +91 {mobile.slice(0, 5)} {mobile.slice(5)}
                          </Text>
                        </View>
                        {isLocalhost && devOtp && (
                          <TouchableOpacity
                            onPress={() => autoFillDevOtp(devOtp)}
                            style={styles.quickFillButton}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="flash" size={12} color="#fbbf24" />
                            <Text style={[styles.quickFillText, { color: '#fbbf24' }]}>Fill {devOtp}</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* 6 Segmented OTP Cells */}
                      <View style={styles.segmentedRow}>
                        {otpDigits.map((digit, idx) => {
                          const isFilled = Boolean(digit);
                          return (
                            <TextInput
                              key={idx}
                              ref={otpCellRefs[idx]}
                              style={[
                                styles.otpCell,
                                isFilled && styles.otpCellFilled,
                                focusedField === 'otp' && styles.otpCellActive,
                              ]}
                              keyboardType="number-pad"
                              maxLength={1}
                              value={digit}
                              onChangeText={(v) => handleDigitChange(v, idx)}
                              onKeyPress={(e) => handleKeyPress(e, idx)}
                              onFocus={() => setFocusedField('otp')}
                              onBlur={() => setFocusedField(null)}
                              selectTextOnFocus
                              autoCapitalize="none"
                            />
                          );
                        })}
                      </View>

                      {/* Resend Code Row */}
                      <View style={styles.resendRow}>
                        {resendTimer > 0 ? (
                          <Text style={styles.resendTimerText}>
                            Resend code in <Text style={{ fontFamily: FONT.bold, color: '#f59e0b' }}>{resendTimer}s</Text>
                          </Text>
                        ) : (
                          <TouchableOpacity onPress={handleSendOtp} disabled={otpSending}>
                            <Text style={styles.resendActiveText}>Resend OTP Code</Text>
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Verify Button */}
                      <TouchableOpacity
                        onPress={() => handleOtpLogin()}
                        disabled={isSubmitting || !currentOtpFilled}
                        activeOpacity={0.88}
                        style={[
                          styles.primaryActionBtn,
                          { marginTop: 10 },
                          (!currentOtpFilled || isSubmitting) && { opacity: 0.55 },
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
                            <Text style={[styles.buttonText, { color: '#0f172a' }]}>
                              Verify &amp; Enter Partner Portal
                            </Text>
                          )}
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}

              {/* Apply / Check Application Status Box */}
              <View style={styles.partnerApplyBox}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="sparkles" size={15} color="#fbbf24" />
                  <Text style={styles.partnerApplyTitle}>New Partner or Need Help?</Text>
                </View>
                <Text style={styles.partnerApplySub}>
                  Want to supply nursery seedlings, advise farmers, or sell agricultural inputs?
                </Text>
                <TouchableOpacity
                  style={styles.partnerApplyBtn}
                  onPress={() => openPartnerSignupModal()}
                  activeOpacity={0.88}
                >
                  <Ionicons name="person-add-outline" size={14} color="#0f172a" />
                  <Text style={styles.partnerApplyBtnText}>Sign Up / Check Status</Text>
                </TouchableOpacity>
              </View>

              {/* Alternative Divider */}
              <View style={styles.dividerBox}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Google Sign-In */}
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
                    <Ionicons name="logo-google" size={17} color="#4285F4" />
                    <Text style={styles.googleText}>Continue with Google</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Small Option to Return to Farmer / User Login */}
              <View style={styles.smallUserBottomCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="leaf-outline" size={13} color="#34d399" />
                  <Text style={styles.smallUserBottomLabel}>Looking for Farmer or Customer login?</Text>
                </View>
                <TouchableOpacity
                  style={styles.smallUserLinkBtn}
                  onPress={() => router.replace('/login' as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.smallUserLinkText}>Go to User Login →</Text>
                </TouchableOpacity>
              </View>

              {/* Statutory Corporate Identity Footer */}
              <View style={styles.statutoryFooter}>
                <Ionicons name="shield-checkmark" size={13} color="#fbbf24" />
                <Text style={styles.statutoryFooterText}>
                  FARMSKING TECHNOLOGIES PRIVATE LIMITED · CIN: U01100PB2026PTC063294
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Partner Signup / Check Status Modal */}
      <PartnerSignupModal
        visible={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        initialMobile={partnerModalMobile}
        uploadToken={partnerUploadToken}
        existingUserSummary={partnerExistingUser}
        existingApplication={partnerExistingApp}
        onSubmitted={({ mobile: submittedMobile }) => {
          setPartnerModalOpen(false);
          setMobile(submittedMobile);
          setPartnerIdentifier(submittedMobile);
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#070c18',
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 28,
  },
  glowOrbTopLeft: {
    position: 'absolute',
    top: -120,
    left: -100,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
  },
  glowOrbBottomRight: {
    position: 'absolute',
    bottom: -140,
    right: -120,
    width: 420,
    height: 420,
    borderRadius: 210,
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  mainConsoleWrap: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0c1322',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
    overflow: 'hidden',
  },
  mainConsoleWrapDesktop: {
    maxWidth: 960,
  },
  topAccentRim: {
    height: 3,
    width: '100%',
  },
  consoleColumnsDesktop: {
    flexDirection: 'row',
  },

  // ── Left Showcase Panel ──
  leftShowcasePanel: {
    flex: 0.95,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  leftShowcaseGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  showcaseBrandName: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  showcaseTagline: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  complianceSealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  complianceSealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.30)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3.5,
  },
  complianceSealText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#fcd34d',
    letterSpacing: 0.5,
  },
  pillarsContainer: {
    gap: 10,
    marginVertical: 10,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillarIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    marginBottom: 1,
  },
  pillarDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 14.5,
  },
  showcaseFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 12,
  },
  ratingText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#facc15',
    marginLeft: 2,
  },
  trustInlineText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#fde68a',
  },
  corpAddressNotice: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#fbbf24',
    marginTop: 2,
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
    flex: 1.05,
    padding: 26,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  backHomeText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  switchUserPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.40)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  switchUserPillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  headingBox: {
    marginBottom: 14,
  },
  partnerBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.40)',
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  partnerBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#fbbf24',
    letterSpacing: 0.6,
  },
  mainTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  subTitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  partnerMethodBar: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#09101f',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.20)',
    padding: 3.5,
    borderRadius: 11,
    marginBottom: 14,
  },
  partnerMethodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7.5,
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
  idleNoticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.45)',
    borderRadius: RADIUS.md,
    padding: 11,
    marginBottom: 12,
  },
  idleNoticeTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  idleNoticeText: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#fef3c7',
    lineHeight: 15.5,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#fca5a5',
    lineHeight: 16,
  },
  portalSwitchHintBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  portalSwitchHintText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  inputSection: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    marginBottom: 5,
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
  countryCodeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: '#1a263e',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  countryCodeText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  mobileInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10.5,
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    letterSpacing: 0.4,
  },
  primaryActionBtn: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: 2,
  },
  gradientBtn: {
    paddingVertical: 11.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.2,
  },
  partnerHelperNote: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 15,
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.30)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 10,
  },
  devBannerSubtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  autoFillBtn: {
    backgroundColor: '#f59e0b',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autoFillBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  otpSectionBox: {
    marginTop: 2,
    marginBottom: 4,
  },
  otpInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 10,
  },
  otpInfoText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#fcd34d',
  },
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.50)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickFillText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  segmentedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  otpCell: {
    flex: 1,
    maxWidth: 46,
    height: 44,
    backgroundColor: '#141d30',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: 10,
    fontSize: 17,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    textAlign: 'center',
    padding: 0,
  },
  otpCellFilled: {
    borderColor: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
  },
  otpCellActive: {
    borderColor: '#fbbf24',
    backgroundColor: '#172540',
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  resendTimerText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  resendActiveText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  partnerApplyBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.30)',
    gap: 8,
  },
  partnerApplyTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  partnerApplySub: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#cbd5e1',
    lineHeight: 15,
  },
  partnerApplyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#fbbf24',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 9,
  },
  partnerApplyBtnText: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  dividerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 13,
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
    marginHorizontal: 10,
  },
  googleIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    paddingVertical: 10.5,
    gap: 9,
  },
  googleBtnDisabled: {
    opacity: 0.6,
  },
  googleText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#1e293b',
  },
  smallUserBottomCard: {
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallUserBottomLabel: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#a7f3d0',
  },
  smallUserLinkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.40)',
  },
  smallUserLinkText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  activeSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  activeSessionTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#fbbf24',
    letterSpacing: 0.3,
  },
  activeSessionSubtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#f8fafc',
  },
  activeSessionBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    backgroundColor: '#fbbf24',
  },
  activeSessionBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  activeSessionLogoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.45)',
  },
  activeSessionLogoutText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#fca5a5',
  },
  statutoryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 14,
  },
  statutoryFooterText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#475569',
    textAlign: 'center',
  },
});
