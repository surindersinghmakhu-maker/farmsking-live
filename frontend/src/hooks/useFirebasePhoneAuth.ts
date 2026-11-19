import { useState, useRef, useEffect, useCallback } from 'react';
import { Platform, TextInput } from 'react-native';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { getFreshDetachedRecaptchaHost, clearDetachedRecaptchaHost } from '@/src/utils/recaptchaHost';

export interface UseFirebasePhoneAuthOptions {
  hostId?: string;
  verifierGlobalKey?: string;
  countryCode?: string;
  portal?: 'CLIENT' | 'PARTNER';
  fallbackSendOtp?: (mobile: string, portal?: 'CLIENT' | 'PARTNER') => Promise<any>;
  fallbackVerifyOtp?: (payload: { mobile: string; otp: string; portal?: 'CLIENT' | 'PARTNER' }) => Promise<any>;
}

export function formatFirebasePhoneAuthError(err: any): string {
  if (err?.code === 'auth/invalid-phone-number') {
    return 'Please enter a valid 10-digit mobile number.';
  }
  if (err?.code === 'auth/too-many-requests') {
    return 'SMS rate limit reached. Please wait a few moments before requesting another OTP.';
  }
  if (err?.code === 'auth/captcha-check-failed' || err?.message?.includes('Hostname match not found')) {
    return 'Security verification failed. Please ensure you are accessing https://farmsking.in.';
  }
  if (err?.code === 'auth/invalid-app-credential' || err?.message?.includes('invalid-app-credential')) {
    return 'Security verification refresh required. Please tap Continue again.';
  }
  if (err?.code === 'auth/invalid-verification-code') {
    return 'Incorrect SMS OTP code. Please enter the valid 6-digit code received on your mobile phone.';
  }
  if (err?.code === 'auth/code-expired') {
    return 'Verification code has expired. Please tap Resend to request a new code.';
  }
  if (err?.code === 'auth/network-request-failed') {
    return 'Network error! Please check your internet connection.';
  }
  if (err?.code === 'auth/internal-error' || err?.message?.includes('internal-error')) {
    return 'Verification service was refreshed. Please tap Continue again.';
  }
  if (err?.response?.data?.message) {
    const raw = err.response.data.message;
    return Array.isArray(raw) ? raw.join(', ') : String(raw);
  }
  if (err?.message) {
    return String(err.message);
  }
  return 'Failed to send SMS OTP. Please try again.';
}

/**
 * 👑 Centralized FarmsKing Firebase Phone Auth Hook
 * Provides single-source-of-truth OTP lifecycle for Client, Partner, and Admin portals.
 * - On-demand invisible reCAPTCHA with fresh DOM node per attempt to prevent "already rendered" errors
 * - Hidden floating badge CSS rule for zero UI clutter
 * - Automatic high-reliability server SMS OTP fallback if Firebase fails
 * - Segmented 6-digit auto-advancing input handling
 * - Automatic resend timer countdown and memory leak cleanup
 */
export function useFirebasePhoneAuth(options?: UseFirebasePhoneAuthOptions) {
  const hostId = options?.hostId || 'fk-recaptcha-phone-auth-host';
  const verifierGlobalKey = options?.verifierGlobalKey || 'recaptchaVerifierPhoneAuth';
  const countryCode = options?.countryCode || '+91';

  const [mobile, setMobile] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpSending, setOtpSending] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isFallback, setIsFallback] = useState(false);

  const autoSubmittedCodeRef = useRef<string | null>(null);
  const isSendingRef = useRef(false);

  const otpCellRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  // Clean unmount
  useEffect(() => {
    return () => {
      clearDetachedRecaptchaHost(hostId, verifierGlobalKey);
    };
  }, [hostId, verifierGlobalKey]);

  const cleanMobile = mobile.trim().replace(/\D/g, '').slice(-10);

  /**
   * Sends real SMS OTP via Firebase Phone Auth on Web, with automatic backend SMS fallback.
   */
  const sendOtp = useCallback(
    async (overrideMobile?: string): Promise<{ success: boolean; confirmation?: ConfirmationResult; isFallback?: boolean; error?: any }> => {
      if (isSendingRef.current) {
        console.warn('[useFirebasePhoneAuth] sendOtp already in flight, ignoring duplicate call');
        return { success: false, error: new Error('IN_PROGRESS') };
      }
      isSendingRef.current = true;
      setError(null);
      const targetClean = (overrideMobile ?? mobile).trim().replace(/\D/g, '').slice(-10);
      if (!targetClean || targetClean.length < 10) {
        isSendingRef.current = false;
        const msg = 'Please enter a valid 10-digit mobile number.';
        setError(msg);
        return { success: false, error: new Error(msg) };
      }

      setOtpSending(true);

      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          const fullPhone = `${countryCode}${targetClean}`;

          // 1. Prepare completely fresh detached DOM host to eliminate "already rendered" collision
          const container = getFreshDetachedRecaptchaHost(hostId, verifierGlobalKey);

          // 2. Create fresh invisible RecaptchaVerifier on demand right at send time
          const verifier = new RecaptchaVerifier(auth, container, {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved silently
            },
            'expired-callback': () => {
              try {
                verifier.clear();
              } catch {}
              (window as any)[verifierGlobalKey] = null;
            },
          });
          (window as any)[verifierGlobalKey] = verifier;

          // 3. Request Firebase Phone Auth SMS
          const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
          setConfirmationResult(confirmation);
          setIsFallback(false);
          setOtpSent(true);
          setOtpDigits(['', '', '', '', '', '']);
          setResendTimer(60);
          autoSubmittedCodeRef.current = null;
          setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
          return { success: true, confirmation, isFallback: false };
        } else {
          // Native platform fallback
          if (options?.fallbackSendOtp) {
            await options.fallbackSendOtp(targetClean, options.portal);
            setIsFallback(true);
            setConfirmationResult(null);
            setOtpSent(true);
            setOtpDigits(['', '', '', '', '', '']);
            setResendTimer(60);
            autoSubmittedCodeRef.current = null;
            setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
            return { success: true, isFallback: true };
          }
          return { success: false, error: new Error('NATIVE_AUTH_REQUIRED') };
        }
      } catch (err: any) {
        console.warn('[useFirebasePhoneAuth sendOtp error]:', err?.code, err?.message);
        clearDetachedRecaptchaHost(hostId, verifierGlobalKey);

        // 🛡️ Automatic High-Reliability Fallback:
        // If Firebase fails with auth/internal-error, quota-exceeded, captcha failure, or network error,
        // seamlessly dispatch verification session via FarmsKing backend SMS gateway!
        if (
          options?.fallbackSendOtp &&
          (err?.code === 'auth/internal-error' ||
           err?.code === 'auth/quota-exceeded' ||
           err?.code === 'auth/captcha-check-failed' ||
           err?.code === 'auth/network-request-failed' ||
           err?.code === 'auth/invalid-app-credential' ||
           err?.message?.includes('internal-error') ||
           err?.message?.includes('Hostname match not found'))
        ) {
          try {
            console.log('[useFirebasePhoneAuth] Engaging high-reliability Server SMS OTP fallback...');
            await options.fallbackSendOtp(targetClean, options.portal);
            setIsFallback(true);
            setConfirmationResult(null);
            setOtpSent(true);
            setOtpDigits(['', '', '', '', '', '']);
            setResendTimer(60);
            autoSubmittedCodeRef.current = null;
            setTimeout(() => otpCellRefs[0]?.current?.focus(), 300);
            return { success: true, isFallback: true };
          } catch (fallbackErr: any) {
            console.warn('[useFirebasePhoneAuth fallbackSendOtp error]:', fallbackErr);
            setError(formatFirebasePhoneAuthError(fallbackErr));
            return { success: false, error: fallbackErr };
          }
        }

        setError(formatFirebasePhoneAuthError(err));
        return { success: false, error: err };
      } finally {
        isSendingRef.current = false;
        setOtpSending(false);
      }
    },
    [countryCode, hostId, mobile, options, verifierGlobalKey],
  );

  /**
   * Confirms OTP with Firebase or backend fallback and returns verification payload.
   */
  const verifyOtp = useCallback(
    async (
      explicitCode?: string,
    ): Promise<{ idToken?: string; userCred?: any; isFallback?: boolean; user?: any; isNewUser?: boolean } | null> => {
      setError(null);
      const code = (typeof explicitCode === 'string' ? explicitCode : otpDigits.join('')).trim();
      if (!code || code.length < 6) {
        setError('Please enter the complete 6-digit verification code.');
        return null;
      }
      if (isSubmitting) return null;

      const targetClean = mobile.trim().replace(/\D/g, '').slice(-10);

      // Handle fallback verification via backend
      if (isFallback || !confirmationResult) {
        if (options?.fallbackVerifyOtp) {
          autoSubmittedCodeRef.current = code;
          setIsSubmitting(true);
          try {
            const fallbackResult = await options.fallbackVerifyOtp({
              mobile: targetClean,
              otp: code,
              portal: options.portal,
            });
            return {
              isFallback: true,
              user: fallbackResult?.user || fallbackResult,
              isNewUser: Boolean(fallbackResult?.isNewUser),
            };
          } catch (fallbackErr: any) {
            console.warn('[useFirebasePhoneAuth fallbackVerifyOtp error]:', fallbackErr);
            autoSubmittedCodeRef.current = null;
            setError(formatFirebasePhoneAuthError(fallbackErr));
            return null;
          } finally {
            setIsSubmitting(false);
          }
        } else {
          setError('Verification session missing. Please request a new OTP.');
          return null;
        }
      }

      autoSubmittedCodeRef.current = code;
      setIsSubmitting(true);

      try {
        const userCred = await confirmationResult.confirm(code);
        const idToken = await userCred.user.getIdToken();
        return { idToken, userCred, isFallback: false };
      } catch (err: any) {
        console.warn('[useFirebasePhoneAuth verifyOtp error]:', err?.code, err?.message);
        autoSubmittedCodeRef.current = null;
        setError(formatFirebasePhoneAuthError(err));
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [confirmationResult, isFallback, isSubmitting, mobile, options, otpDigits],
  );

  /**
   * Handles individual cell input and paste across the 6 OTP cells.
   */
  const handleDigitChange = useCallback(
    (val: string, index: number, onAutoSubmit?: (code: string) => void) => {
      const clean = val.replace(/\D/g, '');
      if (clean.length > 1) {
        // Full paste
        const pasted = clean.slice(0, 6).split('');
        const newDigits = [...otpDigits];
        pasted.forEach((d, i) => {
          newDigits[i] = d;
        });
        setOtpDigits(newDigits);
        const nextIndex = Math.min(pasted.length, 5);
        otpCellRefs[nextIndex]?.current?.focus();
        const fullCode = newDigits.join('').trim();
        if (fullCode.length === 6 && autoSubmittedCodeRef.current !== fullCode && onAutoSubmit) {
          onAutoSubmit(fullCode);
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
      if (fullCode.length === 6 && autoSubmittedCodeRef.current !== fullCode && onAutoSubmit) {
        onAutoSubmit(fullCode);
      }
    },
    [otpDigits],
  );

  /**
   * Handles keyboard navigation (backspace to previous cell, Enter to submit).
   */
  const handleKeyPress = useCallback(
    (e: any, index: number, onSubmit?: (code: string) => void) => {
      if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
        otpCellRefs[index - 1]?.current?.focus();
      } else if (e.nativeEvent.key === 'Enter') {
        const fullCode = otpDigits.join('').trim();
        if (fullCode.length === 6 && onSubmit) {
          onSubmit(fullCode);
        }
      }
    },
    [otpDigits],
  );

  /**
   * Resets OTP state back to mobile number editing.
   */
  const resetOtp = useCallback(() => {
    setOtpSent(false);
    setIsFallback(false);
    setOtpDigits(['', '', '', '', '', '']);
    setConfirmationResult(null);
    setResendTimer(0);
    setError(null);
    autoSubmittedCodeRef.current = null;
    clearDetachedRecaptchaHost(hostId, verifierGlobalKey);
  }, [hostId, verifierGlobalKey]);

  return {
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
    setResendTimer,
    error,
    setError,
    confirmationResult,
    setConfirmationResult,
    isFallback,
    setIsFallback,
    otpCellRefs,
    sendOtp,
    verifyOtp,
    handleDigitChange,
    handleKeyPress,
    resetOtp,
    autoSubmittedCodeRef,
  };
}
