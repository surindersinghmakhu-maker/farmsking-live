import { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { firebaseForgotPasswordReset } from '@/src/api/auth.api';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { BrandLogo } from '@/src/components/BrandLogo';

const theme = RoleThemes.FARMER;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const [step, setStep] = useState<'phone' | 'otp' | 'new-password' | 'done'>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const otpInputRef = useRef<TextInput>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((v) => v - 1), 1000);
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

  // Step 1: Send Firebase OTP
  const onSendOtp = async () => {
    setError(null);
    const cleanNum = mobile.trim().replace(/\D/g, '').slice(-10);
    if (!cleanNum || cleanNum.length < 10) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    
    setIsSubmitting(true);
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
      setResendTimer(60);
      setStep('otp');
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err: any) {
      setError(err?.message ?? 'Could not send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify Firebase OTP
  const onVerifyOtp = async () => {
    setError(null);
    const cleanCode = otp.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setError('Please enter the 6-digit OTP code sent via SMS.');
      return;
    }
    setIsSubmitting(true);
    try {
      if (confirmationResult) {
        const credential = await confirmationResult.confirm(cleanCode);
        const token = await credential.user.getIdToken();
        setIdToken(token);
        setStep('new-password');
      } else {
        throw new Error('Verification session missing. Please request a new OTP.');
      }
    } catch (err: any) {
      setError('Invalid or expired OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Update Password
  const onResetPassword = async () => {
    setError(null);
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }
    if (!idToken) {
      setError('Authentication session missing. Please restart the process.');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const result = await firebaseForgotPasswordReset({
        idToken,
        newPassword,
      });
      setSuccessMessage(result.message);
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not update password. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepsList = [
    { key: 'phone', label: 'Mobile' },
    { key: 'otp', label: 'Verify' },
    { key: 'new-password', label: 'Reset' },
    { key: 'done', label: 'Success' },
  ];

  const currentStepIndex = stepsList.findIndex((s) => s.key === step);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Ambient background glows */}
      <View style={styles.glowOrbMint} pointerEvents="none" />
      <View style={styles.glowOrbBlue} pointerEvents="none" />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Quick Back Pill */}
        <TouchableOpacity
          style={styles.backPill}
          onPress={() => (step === 'phone' ? router.back() : setStep('phone'))}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={16} color="#065f46" />
          <Text style={styles.backPillText}>Back</Text>
        </TouchableOpacity>

        {/* Card Container */}
        <View style={[styles.card, isMobile && styles.cardMobile]}>
          {/* Header */}
          <View style={styles.logoRow}>
            <BrandLogo size={42} useHdQuality />
            <View>
              <Text style={styles.brandTitle}>FarmsKing</Text>
              <Text style={styles.brandSubtitle}>Secure Account Recovery</Text>
            </View>
          </View>

          {/* Stepper Dots */}
          <View style={styles.stepperRow}>
            {stepsList.map((s, idx) => (
              <View key={s.key} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    idx <= currentStepIndex && styles.stepDotActive,
                    idx === currentStepIndex && styles.stepDotCurrent,
                  ]}
                >
                  {idx < currentStepIndex ? (
                    <Ionicons name="checkmark" size={11} color="#ffffff" />
                  ) : (
                    <Text
                      style={[
                        styles.stepDotText,
                        idx <= currentStepIndex && styles.stepDotTextActive,
                      ]}
                    >
                      {idx + 1}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    idx === currentStepIndex && styles.stepLabelActive,
                  ]}
                >
                  {s.label}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.title}>
            {step === 'phone' && 'Reset Account Password'}
            {step === 'otp' && 'Verify Phone Number'}
            {step === 'new-password' && 'Create New Password'}
            {step === 'done' && 'Password Updated!'}
          </Text>

          <Text style={styles.subtitle}>
            {step === 'phone' && 'Enter your registered 10-digit mobile number to receive an SMS verification code.'}
            {step === 'otp' && `Enter the 6-digit SMS verification code sent to +91 ${mobile}.`}
            {step === 'new-password' && 'Set a strong new password with at least 8 characters.'}
            {step === 'done' && 'Your password has been reset securely. You can now log in.'}
          </Text>

          <div id="recaptcha-container"></div>

          {/* STEP 1: PHONE */}
          {step === 'phone' && (
            <View style={styles.formSection}>
              <Text style={styles.label}>Mobile Number</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="call-outline" size={18} color="#059669" style={styles.inputIcon} />
                <Text style={styles.prefixText}>+91</Text>
                <TextInput
                  style={styles.input}
                  keyboardType="phone-pad"
                  maxLength={10}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94a3b8"
                  value={mobile}
                  onChangeText={setMobile}
                  onSubmitEditing={onSendOtp}
                  autoFocus={Platform.OS === 'web'}
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={15} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={onSendOtp}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>Send SMS OTP</Text>
                    <Ionicons name="arrow-forward" size={17} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: OTP */}
          {step === 'otp' && (
            <View style={styles.formSection}>
              <Text style={styles.label}>6-Digit SMS Code</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="key-outline" size={18} color="#059669" style={styles.inputIcon} />
                <TextInput
                  ref={otpInputRef}
                  style={[styles.input, styles.otpInput]}
                  keyboardType="numeric"
                  maxLength={6}
                  placeholder="• • • • • •"
                  placeholderTextColor="#94a3b8"
                  value={otp}
                  onChangeText={setOtp}
                  onSubmitEditing={onVerifyOtp}
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={15} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={onVerifyOtp}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>Verify OTP</Text>
                    <Ionicons name="checkmark-circle" size={17} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.resendRow}>
                {resendTimer > 0 ? (
                  <Text style={styles.resendTimer}>Resend SMS in {resendTimer}s</Text>
                ) : (
                  <TouchableOpacity onPress={onSendOtp} disabled={isSubmitting} activeOpacity={0.7}>
                    <Text style={styles.resendLink}>Resend SMS OTP</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* STEP 3: NEW PASSWORD */}
          {step === 'new-password' && (
            <View style={styles.formSection}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#059669" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#94a3b8"
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm New Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#059669" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94a3b8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onSubmitEditing={onResetPassword}
                />
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={15} color="#dc2626" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={onResetPassword}
                disabled={isSubmitting}
                activeOpacity={0.85}
                style={[styles.primaryButton, isSubmitting && { opacity: 0.7 }]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <View style={styles.buttonInner}>
                    <Text style={styles.buttonText}>Update Password</Text>
                    <Ionicons name="shield-checkmark" size={17} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 'done' && (
            <View style={styles.formSection}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={28} color="#059669" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.successTitle}>Password Reset Complete</Text>
                  <Text style={styles.successText}>
                    {successMessage || 'Your account password has been updated successfully. You can now log in.'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.85}
                style={styles.primaryButton}
              >
                <View style={styles.buttonInner}>
                  <Text style={styles.buttonText}>Proceed to Login</Text>
                  <Ionicons name="log-in-outline" size={18} color="#ffffff" />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer Assistance */}
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Remember your password?</Text>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.7}>
              <Text style={styles.footerLink}>Log In</Text>
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
    backgroundColor: '#031a16',
    position: 'relative',
  },
  glowOrbMint: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 360,
    height: 360,
    borderRadius: 180,
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    ...(Platform.OS === 'web' ? { filter: 'blur(90px)' } : {}),
  },
  glowOrbBlue: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(14, 165, 233, 0.12)',
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingVertical: 48,
  },
  backPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginBottom: 20,
    alignSelf: 'center',
  },
  backPillText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#065f46',
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 32,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.18)',
    ...(Platform.OS === 'web'
      ? {
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(16, 185, 129, 0.1)',
        }
      : {
          elevation: 10,
        }),
  },
  cardMobile: {
    padding: 22,
    borderRadius: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#064e3b',
    letterSpacing: -0.2,
  },
  brandSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  stepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 18,
  },
  stepItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: '#059669',
  },
  stepDotCurrent: {
    backgroundColor: '#047857',
    transform: [{ scale: 1.15 }],
  },
  stepDotText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  stepDotTextActive: {
    color: '#ffffff',
  },
  stepLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  stepLabelActive: {
    color: '#065f46',
    fontFamily: FONT.bold,
  },
  title: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    fontFamily: FONT.medium,
    lineHeight: 19,
    marginTop: 4,
    marginBottom: 18,
  },
  formSection: {
    gap: 4,
  },
  label: {
    fontSize: 12.5,
    color: '#1e293b',
    fontFamily: FONT.bold,
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 14,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  prefixText: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#065f46',
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#064e3b',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginTop: 10,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#b91c1c',
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: RADIUS.md,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  resendRow: {
    alignItems: 'center',
    marginTop: 12,
  },
  resendTimer: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  resendLink: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: RADIUS.md,
    padding: 16,
    marginTop: 6,
  },
  successTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#166534',
    marginBottom: 4,
  },
  successText: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    color: '#15803d',
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 22,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerText: {
    fontSize: 12.5,
    color: '#64748b',
    fontFamily: FONT.regular,
  },
  footerLink: {
    fontSize: 12.5,
    color: '#059669',
    fontFamily: FONT.bold,
  },
});
