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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { firebaseForgotPasswordReset } from '@/src/api/auth.api';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { LinearGradient } from 'expo-linear-gradient';

const theme = RoleThemes.FARMER;

export default function ForgotPasswordScreen() {
  const router = useRouter();
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
      setError('Enter a valid 10-digit mobile number.');
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
      setError('Enter the 6-digit OTP code received via SMS.');
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
      setError('Passwords do not match. Please re-type your password.');
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

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => (step === 'phone' ? router.back() : setStep('phone'))}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>
          {step === 'phone' && 'Enter your 10-digit mobile number to receive an SMS OTP.'}
          {step === 'otp' && `Enter the 6-digit OTP sent to your number (+91 ${mobile}).`}
          {step === 'new-password' && 'Enter and confirm your new account password.'}
          {step === 'done' && 'Your password has been updated successfully!'}
        </Text>

        <div id="recaptcha-container"></div>

        {/* STEP 1: PHONE */}
        {step === 'phone' && (
          <>
            <Text style={styles.label}>Mobile Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                keyboardType="phone-pad"
                maxLength={10}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                value={mobile}
                onChangeText={setMobile}
                onSubmitEditing={onSendOtp}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={onSendOtp} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send SMS OTP</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <>
            <Text style={styles.label}>Enter 6-Digit OTP</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                ref={otpInputRef}
                style={[styles.input, { letterSpacing: 6, fontSize: 18, fontFamily: FONT.extraBold }]}
                keyboardType="numeric"
                maxLength={6}
                placeholder="• • • • • •"
                placeholderTextColor="#94a3b8"
                value={otp}
                onChangeText={setOtp}
                onSubmitEditing={onVerifyOtp}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={onVerifyOtp} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
            </TouchableOpacity>

            <View style={styles.resendRow}>
              {resendTimer > 0 ? (
                <Text style={styles.resendTimer}>Resend SMS in {resendTimer}s</Text>
              ) : (
                <TouchableOpacity onPress={onSendOtp} disabled={isSubmitting}>
                  <Text style={styles.resendLink}>🔄 Resend SMS OTP</Text>
                </TouchableOpacity>
              )}
            </View>
          </>
        )}

        {/* STEP 3: CREATE NEW PASSWORD */}
        {step === 'new-password' && (
          <>
            <Text style={styles.label}>New Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Min 8 characters"
                placeholderTextColor="#94a3b8"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((s) => !s)}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Confirm New Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                secureTextEntry={!showPassword}
                placeholder="Re-type new password"
                placeholderTextColor="#94a3b8"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                onSubmitEditing={onResetPassword}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={onResetPassword} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Update Password</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 4: SUCCESS / DONE */}
        {step === 'done' && (
          <>
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
            <TouchableOpacity onPress={() => router.replace('/(auth)/login')} activeOpacity={0.85} style={styles.button}>
              <Text style={styles.buttonText}>Back to Login</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  scroll: { padding: SPACING.xxl, paddingTop: Platform.OS === 'web' ? 36 : 56 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8fafc',
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 16,
  },
  title: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, color: '#64748b', fontFamily: FONT.medium, marginBottom: 20, marginTop: 4, lineHeight: 19 },
  label: { fontSize: 13, color: '#334155', fontFamily: FONT.bold, marginBottom: 7, marginTop: 14 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#eef2f6', borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc', paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 13, fontSize: 15.5, fontFamily: FONT.medium, color: '#0f172a' },
  error: { color: '#dc2626', fontFamily: FONT.medium, fontSize: 12.5, marginTop: 10 },
  button: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  buttonText: { color: '#fff', fontSize: 16, fontFamily: FONT.bold },
  resendRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 },
  resendTimer: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },
  resendLink: { fontSize: 13, fontFamily: FONT.bold, color: '#0284c7' },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 16,
    marginTop: 6,
  },
  successText: { flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#166534', lineHeight: 20 },
});
