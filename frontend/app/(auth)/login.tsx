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
} from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { useFirebasePhoneAuth } from '@/src/hooks/useFirebasePhoneAuth';
import { useAuth } from '@/src/store/auth-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useLanguage } from '@/src/store/language-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';
import { PartnerSignupModal } from '@/src/components/PartnerSignupModal';
import { LegalPoliciesModal, PolicyType } from '@/src/components/LegalPoliciesModal';
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
  const { user, login, googleLogin, sendLoginOtp, otpLogin, completeOtpRegistration, firebaseLogin, logout } = useAuth();
  const { data: appSettings } = useAppSettings();
  const { setLanguage } = useLanguage();
  const router = useRouter();
  const { redirect, portal } = useLocalSearchParams<{ redirect?: string; portal?: string }>();
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
      router.replace('/partner-login' as any);
    }
  }, [portal]);

  // Enforce English as default language for Login and Auth
  useEffect(() => {
    setLanguage('en');
  }, []);

  // Detect local testing environment
  const isLocalhost =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.'));

  const handleSuccessNavigation = (isProfileIncomplete = false, loggedInUser?: any) => {
    const targetUser = loggedInUser || user;
    const needsMobileOtp =
      !targetUser?.mobile || String(targetUser.mobile).startsWith('G_');
    if (needsMobileOtp) {
      router.replace('/verify-mobile' as any);
      return;
    }
    if (isProfileIncomplete) {
      router.replace('/farmer-profile-setup');
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

  // Centralized FarmsKing Firebase Phone Auth Hook
  const {
    mobile,
    setMobile,
    cleanMobile,
    otpSent,
    setOtpSent,
    otpDigits,
    setOtpDigits,
    otpSending,
    isSubmitting,
    setIsSubmitting,
    resendTimer,
    error,
    setError,
    confirmationResult,
    isFallback,
    otpCellRefs,
    sendOtp,
    verifyOtp,
    handleDigitChange: hookDigitChange,
    handleKeyPress: hookKeyPress,
    resetOtp,
  } = useFirebasePhoneAuth({
    hostId: 'fk-recaptcha-login-host',
    verifierGlobalKey: 'recaptchaVerifierLogin',
    portal: portalMode,
    fallbackSendOtp: (mob) => sendLoginOtp(mob, portalModeRef.current),
    fallbackVerifyOtp: (p) => otpLogin({ mobile: p.mobile, otp: p.otp, portal: portalModeRef.current }),
  });

  const [focusedField, setFocusedField] = useState<'mobile' | 'otp' | 'name' | 'partnerId' | 'partnerPass' | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  // New User Role Selection State
  const [isNewUserModal, setIsNewUserModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'FARMER' | 'GARDENER'>('FARMER');
  const [newUserName, setNewUserName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalPolicyType, setLegalPolicyType] = useState<PolicyType>('TERMS_OF_SERVICE');
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

  // Step 1: Request Mobile OTP via centralized FarmsKing Firebase Phone Auth
  const handleSendOtp = async () => {
    setError(null);
    setPartnerActionPrompt(null);
    const res = await sendOtp();
    if (!res.success && res.error) {
      applyStructuredPartnerError(res.error, cleanMobile);
    }
  };

  const handleDigitChange = (val: string, index: number) => {
    hookDigitChange(val, index, (code) => handleOtpLogin(code));
  };

  const handleKeyPress = (e: any, index: number) => {
    hookKeyPress(e, index, (code) => handleOtpLogin(code));
  };

  // Step 2: Verify Mobile OTP via centralized Firebase Phone Auth
  const handleOtpLogin = async (explicitCode?: string) => {
    setError(null);
    const verified: any = await verifyOtp(explicitCode);
    if (!verified) return;

    try {
      if (verified.isFallback) {
        if (verified.isNewUser) {
          if (portalMode === 'PARTNER') {
            setPartnerActionPrompt({ code: 'PARTNER_ROLE_NOT_GRANTED', mobile: cleanMobile });
            setError('Not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please contact FarmsKing Support or switch to User Login.');
          } else {
            setIsNewUserModal(true);
          }
        } else {
          handleSuccessNavigation(false, verified.user);
        }
        return;
      }

      const res: any = await firebaseLogin(verified.idToken, portalMode);
      if (res?.isNewUser) {
        if (portalMode === 'PARTNER') {
          setPartnerActionPrompt({ code: 'PARTNER_ROLE_NOT_GRANTED', mobile: cleanMobile });
          setError('Not registered as a FarmsKing Partner (Seller, Crop Doctor, Garden Advisor, or Sales Manager). Please contact FarmsKing Support or switch to User Login.');
        } else {
          setIsNewUserModal(true);
        }
      } else {
        handleSuccessNavigation(false, res?.user || res);
      }
    } catch (err: any) {
      console.warn('[handleOtpLogin error]:', err);
      if (applyStructuredPartnerError(err, cleanMobile)) {
        return;
      }
      const msg = err?.response?.data?.message ?? err?.message ?? 'Verification failed.';
      setError(Array.isArray(msg) ? msg.join(', ') : String(msg));
    }
  };

  // Step 3: Complete Role Selection for New Users
  const handleCompleteRegistration = async () => {
    setModalError(null);
    if (portalMode === 'PARTNER') {
      setIsNewUserModal(false);
      setError('New Partner registration (Seller, Crop Doctor, Garden Advisor, or Sales Manager) requires Admin approval. Please apply below or switch to User Login.');
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
    setConfirmationResult(null);
    setResendTimer(0);
    autoSubmittedCodeRef.current = null;
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
                  <TouchableOpacity
                    style={styles.showcaseHeader}
                    onPress={() => router.replace('/')}
                    activeOpacity={0.8}
                  >
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
                  </TouchableOpacity>

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
                    <Text style={styles.trustInlineText}> · Verified Cultivator Network</Text>
                  </View>
                  <Text style={styles.corpAddressNotice}>
                    Regd. Office: Village Booh, Kapurthala - 144601, Punjab
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

            {/* Already Signed In Banner */}
            {user && (
              <View style={styles.activeSessionBanner}>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="person-circle" size={15} color="#34d399" />
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
              <View style={styles.userBadge}>
                <Ionicons name="leaf" size={11} color="#34d399" />
                <Text style={styles.userBadgeText}>FARMER &amp; USER LOGIN</Text>
              </View>
              <Text style={styles.mainTitle}>Fast Mobile OTP Sign In</Text>
              <Text style={styles.subTitle}>
                Instant access to crop scan, leaf doctor advice, and live mandi rates
              </Text>
            </View>

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
                  {portalMode === 'PARTNER' ? (
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
                  ) : null}

                  {!otpSent && (
                    <TouchableOpacity
                      onPress={() => {
                        setError(null);
                        setOtpSent(true);
                        setResendTimer(60);
                        setTimeout(() => otpCellRefs[0]?.current?.focus(), 250);
                      }}
                      activeOpacity={0.85}
                      style={[
                        styles.portalSwitchHintBtn,
                        {
                          borderColor: portalMode === 'PARTNER' ? 'rgba(245, 158, 11, 0.6)' : 'rgba(16, 185, 129, 0.6)',
                          backgroundColor: portalMode === 'PARTNER' ? 'rgba(245, 158, 11, 0.18)' : 'rgba(16, 185, 129, 0.18)',
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                        },
                      ]}
                    >
                      <Ionicons name="key" size={13} color={portalMode === 'PARTNER' ? '#fbbf24' : '#10b981'} />
                      <Text
                        style={[
                          styles.portalSwitchHintText,
                          {
                            color: portalMode === 'PARTNER' ? '#fbbf24' : '#10b981',
                            fontFamily: FONT.bold,
                          },
                        ]}
                      >
                        Already received the 6-digit SMS code? Enter code here →
                      </Text>
                    </TouchableOpacity>
                  )}
                  {((error.includes('Agent Login') || error.includes('Partner Login') || error.includes('Partner'))) && (
                    <TouchableOpacity
                      onPress={() => router.push('/partner-login' as any)}
                      activeOpacity={0.85}
                      style={[
                        styles.portalSwitchHintBtn,
                        { borderColor: 'rgba(245, 158, 11, 0.45)', backgroundColor: 'rgba(245, 158, 11, 0.14)' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.portalSwitchHintText,
                          { color: '#fbbf24' },
                        ]}
                      >
                        Open Partner Login Screen →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ) : null}

            {/* Partner / User login form continues below */}

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
                  <>
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

                    <TouchableOpacity
                      onPress={() => {
                        setError(null);
                        setOtpSent(true);
                        setResendTimer(60);
                        setTimeout(() => otpCellRefs[0]?.current?.focus(), 250);
                      }}
                      activeOpacity={0.7}
                      style={{ marginTop: 12, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
                    >
                      <Text style={{ fontSize: 12, color: '#94a3b8', fontFamily: FONT.medium }}>
                        Already received the SMS code?{' '}
                        <Text style={{ color: portalMode === 'PARTNER' ? '#fbbf24' : '#34d399', fontFamily: FONT.bold, textDecorationLine: 'underline' }}>
                          Enter code here
                        </Text>
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  /* ── STEP 2: Segmented 6-Cell OTP Input ── */
                  <View style={styles.otpSectionBox}>
                    <View style={styles.otpInfoBar}>
                      <Ionicons name="shield-checkmark" size={14} color="#34d399" />
                      <Text style={styles.otpInfoText}>
                        OTP sent to <Text style={{ fontFamily: FONT.bold, color: '#f8fafc' }}>+91 {mobile}</Text>
                      </Text>
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
                              {portalMode === 'PARTNER' ? 'Verify & Open Partner Portal' : 'Verify & Open FarmsKing'}
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
                    Apply as Nursery Owner, Seller, Crop Doctor / Advisor, Garden Advisor, or Sales Manager. Existing accounts keep their exact same King ID after Admin approval.
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

            {/* Small Option to open dedicated Partner Login Screen */}
            <View style={styles.smallPartnerBottomCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="briefcase-outline" size={13} color="#f59e0b" />
                <Text style={styles.smallPartnerBottomLabel}>Are you a Seller, Doctor or Advisor?</Text>
              </View>
              <TouchableOpacity
                style={styles.smallPartnerLinkBtn}
                onPress={() => router.push('/partner-login' as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.smallPartnerLinkText}>Partner Login →</Text>
              </TouchableOpacity>
            </View>

            {/* Statutory Corporate Identity Footer */}
            <View style={styles.statutoryFooter}>
              <Ionicons name="shield-checkmark" size={13} color="#10b981" />
              <Text style={styles.statutoryFooterText}>
                FARMSKING TECHNOLOGIES PRIVATE LIMITED · CIN: U62013PB2026PTC070389
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
            <View
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
              <TouchableOpacity
                onPress={() => {
                  setTermsAccepted((v) => !v);
                  if (modalError) setModalError(null);
                }}
                activeOpacity={0.7}
                style={{ marginTop: 1, cursor: 'pointer' as any }}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: termsAccepted }}
              >
                <Ionicons
                  name={termsAccepted ? 'checkbox' : 'square-outline'}
                  size={19}
                  color={termsAccepted ? '#10b981' : '#64748b'}
                />
              </TouchableOpacity>
              <Text style={{ flex: 1, fontSize: 11.5, lineHeight: 17, color: '#cbd5e1' }}>
                <Text
                  onPress={() => {
                    setTermsAccepted((v) => !v);
                    if (modalError) setModalError(null);
                  }}
                  style={{ cursor: 'pointer' as any }}
                >
                  I agree to{' '}
                </Text>
                <Text
                  style={{ color: '#34d399', fontWeight: '700', textDecorationLine: 'underline', cursor: 'pointer' as any }}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setLegalPolicyType('TERMS_OF_SERVICE');
                    setShowLegalModal(true);
                  }}
                >
                  Terms of Service
                </Text>
                <Text
                  onPress={() => {
                    setTermsAccepted((v) => !v);
                    if (modalError) setModalError(null);
                  }}
                  style={{ cursor: 'pointer' as any }}
                >
                  ,{' '}
                </Text>
                <Text
                  style={{ color: '#34d399', fontWeight: '700', textDecorationLine: 'underline', cursor: 'pointer' as any }}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setLegalPolicyType('PRIVACY_POLICY');
                    setShowLegalModal(true);
                  }}
                >
                  Privacy Policy
                </Text>
                <Text
                  onPress={() => {
                    setTermsAccepted((v) => !v);
                    if (modalError) setModalError(null);
                  }}
                  style={{ cursor: 'pointer' as any }}
                >
                  {' '}&amp;{' '}
                </Text>
                <Text
                  style={{ color: '#34d399', fontWeight: '700', textDecorationLine: 'underline', cursor: 'pointer' as any }}
                  onPress={(e) => {
                    e?.stopPropagation?.();
                    setLegalPolicyType('REFUND_POLICY');
                    setShowLegalModal(true);
                  }}
                >
                  Refund Policy
                </Text>
                <Text
                  onPress={() => {
                    setTermsAccepted((v) => !v);
                    if (modalError) setModalError(null);
                  }}
                  style={{ cursor: 'pointer' as any }}
                >
                  {' '}of FARMSKING TECHNOLOGIES PRIVATE LIMITED.
                </Text>
              </Text>
            </View>

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

      <LegalPoliciesModal
        visible={showLegalModal}
        initialType={legalPolicyType}
        onClose={() => setShowLegalModal(false)}
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

  // ── Small Header Partner Link ──
  smallPartnerHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.40)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
  },
  smallPartnerHeaderText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  activeSessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  activeSessionTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#34d399',
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
    backgroundColor: '#10b981',
  },
  activeSessionBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
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
  headingBox: {
    marginBottom: 14,
  },
  userBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4.5,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.35)',
    paddingHorizontal: 7.5,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  userBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#34d399',
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
  smallPartnerBottomCard: {
    marginTop: 14,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.07)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  smallPartnerBottomLabel: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#fde68a',
  },
  smallPartnerLinkBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.40)',
  },
  smallPartnerLinkText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#fbbf24',
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
