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

const CLIENT_BENEFITS: ShowcaseBenefit[] = [
  {
    icon: 'scan-circle',
    color: '#34d399',
    title: 'Scan Crop Leaf',
    desc: 'Click a photo to find disease and spray dose in 5 seconds',
  },
  {
    icon: 'trending-up',
    color: '#60a5fa',
    title: 'Daily Mandi Prices',
    desc: 'Check today crop rates across Mandis near your village',
  },
  {
    icon: 'images',
    color: '#fbbf24',
    title: 'Field Photo & Video Diary',
    desc: 'Save 7-day crop photos, videos & doctor advice safely',
  },
  {
    icon: 'storefront',
    color: '#f472b6',
    title: 'Genuine Farm Store',
    desc: 'Order original seeds, fertilizers & sprays at direct rates',
  },
];

const PARTNER_BENEFITS: ShowcaseBenefit[] = [
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
    title: 'Agent Wallet & Bank Payouts',
    desc: 'Track agent earnings & withdraw directly to your bank',
  },
];

const ONBOARDING_ROLE_CARDS: Array<{
  role: 'FARMER' | 'GARDENER' | 'CUSTOMER';
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  badge?: string;
  desc: string;
}> = [
  {
    role: 'FARMER',
    icon: 'leaf',
    title: 'Farmer',
    badge: 'MOST POPULAR',
    desc: 'Scan crop diseases, check mandi rates & manage your farm',
  },
  {
    role: 'GARDENER',
    icon: 'flower',
    title: 'Home Gardener',
    desc: 'Care for kitchen gardens, terrace pots & home plants',
  },
  {
    role: 'CUSTOMER',
    icon: 'cart',
    title: 'Shop Buyer Only',
    desc: 'Buy certified seeds, sprays, fertilizers & farm tools',
  },
];

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
  const portalModeRef = useRef<'CLIENT' | 'PARTNER'>(portalMode);
  portalModeRef.current = portalMode;
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

    if (portalMode === 'CLIENT') {
      router.replace('/(user)/(tabs)');
      return;
    }

    const partnerTabRoles = ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR'];
    if (activeRoles.some((r) => partnerTabRoles.includes(r))) {
      router.replace('/(partner)/(tabs)');
      return;
    }
    if (activeRoles.includes('SELLER')) {
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
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isCompletingReg, setIsCompletingReg] = useState(false);

  // Partner Self-Signup / Status / Rejection-Edit Modal State
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
      portalMode === 'PARTNER' &&
      (code === 'PARTNER_APPLICATION_PENDING' ||
        code === 'PARTNER_APPLICATION_REJECTED' ||
        code === 'PARTNER_ROLE_NOT_GRANTED')
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
              portal: portalModeRef.current,
            });
            handleSuccessNavigation(loggedInUser.isProfileIncomplete, loggedInUser.user);
          })
          .catch((err) => {
            const msg = err?.response?.data?.message ?? err?.message ?? 'Google Sign-In failed.';
            setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
          })
          .finally(() => setGoogleLoading(false));
      }
    } else if (response.type === 'error') {
      setError('Google Sign-In error: ' + (response.error?.message || 'Please retry.'));
    }
  }, [response]);

  const handleGoogleSignIn = async () => {
    setError(null);
    const activePortal = portalMode;
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
            portal: activePortal,
          });
          handleSuccessNavigation(res.isProfileIncomplete, res.user);
        } catch (apiErr: any) {
          const msg = apiErr?.response?.data?.message ?? apiErr?.message ?? 'Google Sign-In failed.';
          setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
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

  // Step 1: Request Mobile OTP
  const handleSendOtp = async () => {
    setError(null);
    setPartnerActionPrompt(null);
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    const activePortal = portalMode;
    setOtpSending(true);

    if (isLocalhost) {
      // 💻 LOCALHOST ONLY: Enforce strict portal match before opening OTP screen
      try {
        const otpRes = await sendLoginOtp(cleanNum, activePortal);
        if (activePortal === 'PARTNER' && otpRes?.isNewUser) {
          setPartnerActionPrompt({ code: 'PARTNER_ROLE_NOT_GRANTED', mobile: cleanNum });
          setError('No Partner account is active on this number yet. Apply as Agent, Advisor, or Seller below.');
          return;
        }
        setOtpSent(true);
        setDevOtp(otpRes?.devOtp || '123456');
        setOtpDigits(['', '', '', '', '', '']);
        setResendTimer(60);
        setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
      } catch (err: any) {
        if (!applyStructuredPartnerError(err, cleanNum)) {
          const msg = err?.response?.data?.message ?? err?.message ?? 'Could not send verification code. Please check your details.';
          setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
        }
      } finally {
        setOtpSending(false);
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
        // instantly dispatch verification OTP via backend so valid users are NEVER blocked!
        try {
          const fallbackRes = await sendLoginOtp(cleanNum, activePortal);
          if (activePortal === 'PARTNER' && fallbackRes?.isNewUser) {
            setError('No Partner account is registered with these details. Please switch to the Client Login section for Farmer, Gardener, or Buyer accounts.');
            return;
          }
          setConfirmationResult(null); // Indicates backend OTP verification
          setOtpSent(true);
          setDevOtp(fallbackRes?.devOtp || null);
          setOtpDigits(['', '', '', '', '', '']);
          setResendTimer(60);
          setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
          return;
        } catch (backendErr: any) {
          console.warn('[Backend OTP fallback error]:', backendErr);
          const backendStatus = backendErr?.response?.status;
          const backendMsg = backendErr?.response?.data?.message;
          if ((backendStatus === 403 || backendStatus === 401) && backendMsg) {
            setError(Array.isArray(backendMsg) ? backendMsg.join(', ') : String(backendMsg));
            return;
          }
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
        const res: any = await firebaseLogin(idToken, portalMode);
        if (res?.isNewUser) {
          if (portalMode === 'PARTNER') {
            setError('No Agent account is registered with these details. Please switch to the User Login section for Farmer, Gardener, or Buyer accounts.');
          } else {
            setIsNewUserModal(true);
          }
        } else {
          handleSuccessNavigation(false, res);
        }
      } else {
        // 💻 LOCALHOST: Verify via backend OTP store
        const res = await otpLogin({ mobile: cleanNum, otp: code, portal: portalMode });
        if (res?.isNewUser) {
          if (portalMode === 'PARTNER') {
            setError('No Agent account is registered with these details. Please switch to the User Login section for Farmer, Gardener, or Buyer accounts.');
          } else {
            setIsNewUserModal(true);
          }
        } else {
          handleSuccessNavigation(false, res);
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

  // Step 3: Complete Role Selection for New Users
  const handleCompleteRegistration = async () => {
    setModalError(null);
    if (portalMode === 'PARTNER') {
      setIsNewUserModal(false);
      setError('New Agent account registration requires Admin approval. Please switch to the User Login section.');
      return;
    }
    const trimmedName = newUserName.trim();
    if (!trimmedName) {
      setModalError('Please enter your full name to proceed.');
      return;
    }
    if (!termsAccepted) {
      setModalError('Please accept the Terms of Service, Privacy & Refund Policies to continue.');
      return;
    }
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    setIsCompletingReg(true);
    try {
      const loggedInUser = await completeOtpRegistration({
        mobile: cleanNum,
        name: trimmedName,
        role: selectedRole,
        portal: portalMode,
        termsAccepted: true,
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
    setPartnerActionPrompt(null);
    const idClean = partnerIdentifier.trim();
    const passClean = partnerPassword.trim();
    if (!idClean) {
      setError('Please enter your registered Agent Mobile Number or King ID.');
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
      handleSuccessNavigation(false, loggedInUser);
    } catch (err: any) {
      if (!applyStructuredPartnerError(err, idClean)) {
        const msg =
          err?.response?.data?.message ??
          err?.message ??
          'Agent sign in failed. Check your King ID / Mobile and Password.';
        setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchPortal = (nextPortal: 'CLIENT' | 'PARTNER') => {
    if (nextPortal === portalMode) return;
    setPortalMode(nextPortal);
    setError(null);
    setPartnerActionPrompt(null);
    setOtpSent(false);
    setOtpDigits(['', '', '', '', '', '']);
    setDevOtp(null);
    setConfirmationResult(null);
    setResendTimer(0);
    autoSubmittedCodeRef.current = null;
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
  const activeBenefits = portalMode === 'PARTNER' ? PARTNER_BENEFITS : CLIENT_BENEFITS;

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
          <LinearGradient
            colors={
              portalMode === 'PARTNER'
                ? ['#f59e0b', '#fbbf24', '#d97706']
                : ['#10b981', '#34d399', '#059669']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topAccentRim}
          />
          <View style={isDesktop ? styles.consoleColumnsDesktop : undefined}>
          {/* ══════════════════════════════════════════════════════
              LEFT PANEL: Compact Farmer-Clear Feature Showcase (Desktop)
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
                            ? `radial-gradient(500px circle at ${Math.max(0, mousePos.x - 40)}px ${mousePos.y}px, rgba(245, 158, 11, 0.12), transparent 70%)`
                            : `radial-gradient(500px circle at ${Math.max(0, mousePos.x - 40)}px ${mousePos.y}px, rgba(52, 211, 153, 0.12), transparent 70%)`,
                      } as any,
                    ]}
                  />
                )}

                <View>
                  {/* Brand Emblem & Compact Header */}
                  <View style={styles.showcaseHeader}>
                    <BrandLogo size={42} round useGoldRing useHdQuality />
                    <View style={{ marginLeft: 12 }}>
                      <Text style={styles.showcaseBrandName}>FarmsKing</Text>
                      <Text
                        style={[
                          styles.showcaseTagline,
                          portalMode === 'PARTNER' && { color: '#fcd34d' },
                        ]}
                      >
                        {portalMode === 'PARTNER'
                          ? 'Agent & Crop Doctor Portal'
                          : 'Smart Farming & Seeds App'}
                      </Text>
                    </View>
                  </View>

                  {/* Compact Trust Seal Strip */}
                  <View style={styles.complianceSealRow}>
                    <View style={styles.complianceSealBadge}>
                      <Ionicons
                        name="shield-checkmark"
                        size={12}
                        color={portalMode === 'PARTNER' ? '#fbbf24' : '#34d399'}
                      />
                      <Text style={styles.complianceSealText}>ISO 27001 SAFE</Text>
                    </View>
                    <View style={styles.complianceSealBadge}>
                      <Ionicons
                        name={portalMode === 'PARTNER' ? 'briefcase' : 'leaf'}
                        size={12}
                        color={portalMode === 'PARTNER' ? '#93c5fd' : '#a7f3d0'}
                      />
                      <Text style={styles.complianceSealText}>
                        {portalMode === 'PARTNER' ? 'VERIFIED AGENT DESK' : 'FREE FOR FARMERS'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Compact Data-Driven Benefit List */}
                <View style={styles.pillarsContainer}>
                  {activeBenefits.map((item) => (
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

                {/* Compact Trust Footer */}
                <View style={styles.showcaseFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 3 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={12} color="#facc15" />
                    ))}
                    <Text style={styles.ratingText}>4.9 / 5</Text>
                    <Text style={styles.trustInlineText}> · Trusted by 50,000+ Farmers</Text>
                  </View>
                  <Text style={styles.corpAddressNotice}>
                    Regd. Office: VPO Goindwal Sahib, Tarn Taran, Punjab
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════
              RIGHT PANEL: Compact Farmer-Friendly Auth Console
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
                    borderRadius: 22,
                    background:
                      portalMode === 'PARTNER'
                        ? `radial-gradient(460px circle at ${Math.max(0, mousePos.x - width * 0.45)}px ${mousePos.y}px, rgba(245, 158, 11, 0.06), transparent 70%)`
                        : `radial-gradient(460px circle at ${Math.max(0, mousePos.x - width * 0.45)}px ${mousePos.y}px, rgba(16, 185, 129, 0.07), transparent 70%)`,
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
                <Text style={styles.backHomeText}>Back to Home</Text>
              </TouchableOpacity>

              {!isDesktop ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <BrandLogo size={26} round useGoldRing useHdQuality />
                  <Text style={{ fontSize: 13.5, fontFamily: FONT.bold, color: '#f8fafc' }}>FarmsKing</Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.portalHeaderTag,
                    portalMode === 'PARTNER'
                      ? { backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)' }
                      : { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.35)' },
                  ]}
                >
                  <Text
                    style={[
                      styles.portalHeaderTagText,
                      { color: portalMode === 'PARTNER' ? '#fbbf24' : '#34d399' },
                    ]}
                  >
                    {portalMode === 'PARTNER' ? 'AGENT ACCOUNT' : 'FAST OTP LOGIN'}
                  </Text>
                </View>
              )}
            </View>

            {/* ── ULTRA-COMPACT & PREMIUM 2-PART SELECTOR: USER VS AGENT (TEXT ONLY) ── */}
            <View style={styles.portalSwitchTray}>
              {/* OPTION 1: USER */}
              <TouchableOpacity
                style={[
                  styles.portalPillBtn,
                  portalMode === 'CLIENT' && styles.portalPillBtnClientActive,
                ]}
                activeOpacity={0.9}
                onPress={() => handleSwitchPortal('CLIENT')}
              >
                <Text
                  style={[
                    styles.portalPillTitle,
                    portalMode === 'CLIENT' && { color: '#ecfdf5' },
                  ]}
                >
                  User
                </Text>
                <Text
                  style={[
                    styles.portalPillSub,
                    portalMode === 'CLIENT' && { color: '#6ee7b7' },
                  ]}
                >
                  Farmer, Gardener &amp; Buyer
                </Text>
              </TouchableOpacity>

              {/* OPTION 2: AGENT */}
              <TouchableOpacity
                style={[
                  styles.portalPillBtn,
                  portalMode === 'PARTNER' && styles.portalPillBtnAgentActive,
                ]}
                activeOpacity={0.9}
                onPress={() => handleSwitchPortal('PARTNER')}
              >
                <Text
                  style={[
                    styles.portalPillTitle,
                    portalMode === 'PARTNER' && { color: '#fffbeb' },
                  ]}
                >
                  Agent
                </Text>
                <Text
                  style={[
                    styles.portalPillSub,
                    portalMode === 'PARTNER' && { color: '#fcd34d' },
                  ]}
                >
                  Doctor, Agent &amp; Seller
                </Text>
              </TouchableOpacity>
            </View>

            {/* AGENT LOGIN METHOD TOGGLE (Mobile OTP vs King ID & Password) */}
            {portalMode === 'PARTNER' && (
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
                  {portalMode === 'PARTNER' && partnerActionPrompt ? (
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
                  {((portalMode === 'CLIENT' && (error.includes('Agent Login') || error.includes('Partner Login'))) ||
                    (portalMode === 'PARTNER' && (error.includes('User Login') || error.includes('Client Login') || error.includes('Farmer')))) && (
                    <TouchableOpacity
                      onPress={() => handleSwitchPortal(portalMode === 'CLIENT' ? 'PARTNER' : 'CLIENT')}
                      activeOpacity={0.85}
                      style={[
                        styles.portalSwitchHintBtn,
                        portalMode === 'CLIENT'
                          ? { borderColor: 'rgba(245, 158, 11, 0.45)', backgroundColor: 'rgba(245, 158, 11, 0.14)' }
                          : { borderColor: 'rgba(16, 185, 129, 0.45)', backgroundColor: 'rgba(16, 185, 129, 0.14)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.portalSwitchHintText,
                          { color: portalMode === 'CLIENT' ? '#fbbf24' : '#34d399' },
                        ]}
                      >
                        {portalMode === 'CLIENT' ? 'Switch to Agent Login →' : 'Switch to User Login →'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
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
                  <Text style={styles.fieldLabel}>Agent King ID or Mobile Number</Text>
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
                          Sign In to Agent Portal
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
              <>
                {/* Localhost Testing Mode Banner: Strictly shown only on Localhost */}
                {isLocalhost && (
                  <View style={styles.devBanner}>
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="construct" size={14} color="#10b981" />
                      <Text style={styles.devBannerSubtitle}>
                        Local Test OTP: <Text style={{ fontFamily: FONT.bold, color: '#f59e0b' }}>123456</Text>
                      </Text>
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
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <Text style={styles.fieldLabel}>
                      {portalMode === 'PARTNER' ? 'Registered Agent Mobile' : 'Your Mobile Number'}
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
                        <Ionicons name="pencil" size={12} color="#10b981" />
                        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#10b981' }}>Change Number</Text>
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
                      <Text style={styles.countryCodeText}>+91</Text>
                    </View>
                    <TextInput
                      style={styles.mobileInput}
                      keyboardType="phone-pad"
                      maxLength={10}
                      placeholder="Enter 10-digit mobile number"
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
                      <Ionicons name="checkmark-circle" size={17} color="#10b981" style={{ marginRight: 10 }} />
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
                            size={15}
                            color={portalMode === 'PARTNER' ? '#0f172a' : '#fff'}
                          />
                          <Text
                            style={[
                              styles.buttonText,
                              portalMode === 'PARTNER' && { color: '#0f172a' },
                            ]}
                          >
                            {portalMode === 'PARTNER'
                              ? 'Send Agent OTP Code'
                              : 'Send OTP on Mobile'}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  /* ── STEP 2: Segmented 6-Cell OTP Input ── */
                  <View style={styles.otpSectionBox}>
                    <View style={styles.otpInfoBar}>
                      <Ionicons name="shield-checkmark" size={14} color="#34d399" />
                      <Text style={styles.otpInfoText}>
                        OTP sent to <Text style={{ fontFamily: FONT.bold, color: '#f8fafc' }}>+91 {mobile}</Text>
                      </Text>
                      {isLocalhost && (
                        <TouchableOpacity
                          onPress={autoFillDevOtp}
                          style={styles.quickFillButton}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="flash" size={12} color="#10b981" />
                          <Text style={styles.quickFillText}>Fill 123456</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    <Text style={styles.fieldLabel}>Enter 6-Digit OTP</Text>

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
                              size={16}
                              color={portalMode === 'PARTNER' ? '#0f172a' : '#fff'}
                            />
                            <Text
                              style={[
                                styles.buttonText,
                                portalMode === 'PARTNER' && { color: '#0f172a' },
                              ]}
                            >
                              {portalMode === 'PARTNER' ? 'Verify & Open Agent Portal' : 'Verify & Open FarmsKing'}
                            </Text>
                          </View>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>

                    {/* Resend Timer / Action */}
                    <View style={styles.resendRow}>
                      {resendTimer > 0 ? (
                        <Text style={styles.resendTimerText}>
                          Resend OTP in <Text style={{ fontFamily: FONT.bold, color: '#10b981' }}>{resendTimer}s</Text>
                        </Text>
                      ) : (
                        <TouchableOpacity onPress={handleSendOtp} disabled={otpSending}>
                          <Text style={styles.resendActiveText}>Resend OTP Code</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                )}
              </>
            )}

            {/* Partner Self-Signup & Rejected Application Editor CTA */}
            {portalMode === 'PARTNER' && (
              <View style={styles.partnerApplyBox}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.partnerApplyTitle}>
                    Need a Partner role or Rejected Profile update?
                  </Text>
                  <Text style={styles.partnerApplySub}>
                    Apply as Agent, Advisor, or Seller. Existing Farmer/Buyer accounts keep their exact same King ID after Admin approval.
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.partnerApplyBtn}
                  onPress={() => openPartnerSignupModal()}
                  activeOpacity={0.88}
                >
                  <Ionicons name="person-add-outline" size={14} color="#0f172a" />
                  <Text style={styles.partnerApplyBtnText}>Sign Up / Check Status</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Alternative Divider */}
            <View style={styles.dividerBox}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
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
                  <Ionicons name="logo-google" size={17} color="#4285F4" />
                  <Text style={styles.googleText}>Continue with Google</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Statutory Corporate Identity Footer */}
            <View style={styles.statutoryFooter}>
              <Ionicons name="shield-checkmark" size={13} color="#10b981" />
              <Text style={styles.statutoryFooterText}>
                FARMSKING TECHNOLOGIES PRIVATE LIMITED · CIN: U01100PB2026PTC063294
              </Text>
            </View>
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
              <Text style={styles.modalTitle}>Tell Us Who You Are</Text>
              <Text style={styles.modalSubtitle}>
                Choose your profile below. Seeds &amp; farm store access is included for all users.
              </Text>
            </View>

            {/* Error Message inside Modal */}
            {modalError ? (
              <View style={[styles.errorBox, { marginBottom: 12 }]}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{modalError}</Text>
              </View>
            ) : null}

            {/* Mandatory Full Name Input */}
            <View style={{ marginBottom: 14 }}>
              <Text style={styles.fieldLabel}>
                Your Full Name <Text style={{ color: '#ef4444' }}>*</Text>
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter your name (e.g. Gurpreet Singh)"
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

            {/* Compact Data-Driven Role Selection Cards */}
            <View style={{ gap: 9, marginBottom: 18 }}>
              {ONBOARDING_ROLE_CARDS.map((card) => {
                const active = selectedRole === card.role;
                return (
                  <TouchableOpacity
                    key={card.role}
                    style={[styles.roleCard, active && styles.roleCardActive]}
                    onPress={() => setSelectedRole(card.role)}
                    activeOpacity={0.85}
                  >
                    <View style={styles.roleCardIcon}>
                      <Ionicons
                        name={card.icon}
                        size={20}
                        color={active ? '#10b981' : '#64748b'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.roleCardTitle, active && styles.roleCardTitleActive]}>
                          {card.title}
                        </Text>
                        {card.badge ? (
                          <View style={styles.roleRecommendedBadge}>
                            <Text style={styles.roleRecommendedText}>{card.badge}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={styles.roleCardDesc}>{card.desc}</Text>
                    </View>
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={19}
                      color={active ? '#10b981' : '#475569'}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Mandatory Legal & DPDPA 2023 Consent */}
            <TouchableOpacity
              onPress={() => {
                setTermsAccepted((v) => !v);
                if (modalError) setModalError(null);
              }}
              activeOpacity={0.85}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 10,
                padding: 10,
                borderRadius: 10,
                backgroundColor: termsAccepted ? 'rgba(16, 185, 129, 0.08)' : 'rgba(15, 23, 42, 0.65)',
                borderWidth: 1,
                borderColor: termsAccepted ? 'rgba(16, 185, 129, 0.45)' : '#1e293b',
                marginBottom: 14,
              }}
            >
              <Ionicons
                name={termsAccepted ? 'checkbox' : 'square-outline'}
                size={19}
                color={termsAccepted ? '#10b981' : '#64748b'}
                style={{ marginTop: 1 }}
              />
              <Text style={{ flex: 1, fontSize: 11.5, lineHeight: 16, color: '#cbd5e1' }}>
                I agree to{' '}
                <Text
                  style={{ color: '#34d399', fontWeight: '700', textDecorationLine: 'underline' }}
                  onPress={() => router.push('/terms' as any)}
                >
                  Terms of Service
                </Text>
                ,{' '}
                <Text
                  style={{ color: '#34d399', fontWeight: '700', textDecorationLine: 'underline' }}
                  onPress={() => router.push('/privacy-policy' as any)}
                >
                  Privacy Policy
                </Text>
                {' '}&amp;{' '}
                <Text
                  style={{ color: '#34d399', fontWeight: '700', textDecorationLine: 'underline' }}
                  onPress={() => router.push('/refund-policy' as any)}
                >
                  Refund Policy
                </Text>
                {' '}of FARMSKING TECHNOLOGIES PRIVATE LIMITED.
              </Text>
            </TouchableOpacity>

            {/* Confirm & Launch Dashboard */}
            <TouchableOpacity
              onPress={handleCompleteRegistration}
              disabled={isCompletingReg || !newUserName.trim() || !termsAccepted}
              activeOpacity={0.88}
              style={[styles.primaryActionBtn, (isCompletingReg || !newUserName.trim() || !termsAccepted) && { opacity: 0.6 }]}
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
                    <Text style={styles.buttonText}>Start Using FarmsKing</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <PartnerSignupModal
        visible={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        initialMobile={partnerModalMobile}
        initialPartnerUploadToken={partnerUploadToken}
        initialExistingUserSummary={partnerExistingUser}
        initialExistingApplication={partnerExistingApp}
      />
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
    maxWidth: 440,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.11)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 24px 60px rgba(0, 0, 0, 0.55)' } as any)
      : {}),
  },
  mainConsoleWrapDesktop: {
    maxWidth: 920,
  },
  topAccentRim: {
    height: 3,
    width: '100%',
  },
  consoleColumnsDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  // ── Left Showcase Panel (Desktop) ──
  leftShowcasePanel: {
    flex: 0.92,
  },
  leftShowcaseGradient: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.08)',
  },
  showcaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  showcaseBrandName: {
    fontSize: 21,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  showcaseTagline: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#a7f3d0',
    marginTop: 1,
  },
  complianceSealRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  complianceSealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  complianceSealText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
    letterSpacing: 0.5,
  },
  pillarsContainer: {
    gap: 8,
    marginVertical: 16,
  },
  pillarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.24)',
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillarIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  pillarDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginTop: 1,
    lineHeight: 14.5,
  },
  showcaseFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.10)',
    paddingTop: 12,
  },
  ratingText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#fef08a',
    marginLeft: 2,
  },
  trustInlineText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#d1fae5',
  },
  corpAddressNotice: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#6ee7b7',
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
    marginBottom: 12,
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
  quickFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.20)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.50)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  quickFillText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  devBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.30)',
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
    backgroundColor: '#10b981',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
  },
  autoFillBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // ── Inputs & Segmented OTP ──
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
  inputWrapFocused: {
    borderColor: '#10b981',
    backgroundColor: '#162238',
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
    color: '#ffffff',
    letterSpacing: 0.2,
  },

  // ── Segmented 6-Cell OTP Input ──
  otpSectionBox: {
    marginTop: 2,
    marginBottom: 4,
  },
  otpInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
    backgroundColor: 'rgba(52, 211, 153, 0.10)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    marginBottom: 10,
  },
  otpInfoText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#a7f3d0',
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
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.10)',
  },
  otpCellActive: {
    borderColor: '#34d399',
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
    color: '#34d399',
  },

  // ── Alternative Divider ──
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

  roleRecommendedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  roleRecommendedText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#34d399',
    letterSpacing: 0.4,
  },

  // ── Ultra-Compact & Premium Login Option Switcher ──
  portalSwitchTray: {
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#09101f',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    borderRadius: 14,
    padding: 4,
    marginBottom: 14,
  },
  portalPillBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    ...(Platform.OS === 'web'
      ? ({ transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', cursor: 'pointer' } as any)
      : {}),
  },
  portalPillBtnClientActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    borderColor: 'rgba(52, 211, 153, 0.55)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 16px rgba(16, 185, 129, 0.16)' } as any)
      : {}),
  },
  portalPillBtnAgentActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.16)',
    borderColor: 'rgba(251, 191, 36, 0.55)',
    ...(Platform.OS === 'web'
      ? ({ boxShadow: '0 4px 16px rgba(245, 158, 11, 0.16)' } as any)
      : {}),
  },
  portalPillTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#cbd5e1',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  portalPillSub: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
    lineHeight: 13,
    textAlign: 'center',
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
  partnerMethodBar: {
    flexDirection: 'row',
    gap: 5,
    backgroundColor: '#09101f',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.20)',
    padding: 3.5,
    borderRadius: 11,
    marginBottom: 12,
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
  partnerApplyBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.30)',
    gap: 10,
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
    marginTop: 2,
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
});
