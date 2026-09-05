import { useState } from 'react';
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
import { forgotPasswordStart, forgotPasswordVerify, forgotPasswordReset } from '@/src/api/auth.api';

const theme = RoleThemes.FARMER;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'lookup' | 'otp' | 'new-password' | 'done'>('lookup');
  const [mobile, setMobile] = useState('');
  const [pincode, setPincode] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Step 1: Lookup Mobile + PIN & send WhatsApp OTP
  const onLookup = async () => {
    setError(null);
    if (mobile.trim().length !== 10) {
      setError('Enter a valid 10-digit mobile number.');
      return;
    }
    if (pincode.trim().length !== 6) {
      setError('Enter your 6-digit PIN code.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordStart({ mobile: mobile.trim(), pincode: pincode.trim() });
      if (result.devOtp) {
        setDevOtpHint(result.devOtp);
      }
      setStep('otp');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not find an account matching this mobile number and PIN code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 2: Verify WhatsApp OTP
  const onVerifyOtp = async () => {
    setError(null);
    if (!otp.trim() || otp.trim().length < 4) {
      setError('Enter the 4-digit OTP code received on WhatsApp.');
      return;
    }
    setIsSubmitting(true);
    try {
      await forgotPasswordVerify({ mobile: mobile.trim(), otp: otp.trim() });
      setStep('new-password');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Invalid or expired OTP code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Update Password
  const onResetPassword = async () => {
    setError(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please re-type your password.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordReset({
        mobile: mobile.trim(),
        otp: otp.trim(),
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
        <TouchableOpacity style={styles.backBtn} onPress={() => (step === 'lookup' ? router.back() : setStep('lookup'))}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          {step === 'lookup' && 'Enter your 10-digit mobile number and 6-digit PIN code to receive a WhatsApp OTP.'}
          {step === 'otp' && `Enter the 4-digit OTP sent to your WhatsApp number (+91 ${mobile}).`}
          {step === 'new-password' && 'Enter and confirm your new account password.'}
          {step === 'done' && 'Your password has been updated successfully!'}
        </Text>

        {/* STEP 1: LOOKUP */}
        {step === 'lookup' && (
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
              />
            </View>

            <Text style={styles.label}>PIN Code</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="navigate-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                maxLength={6}
                placeholder="6-digit PIN Code"
                placeholderTextColor="#94a3b8"
                value={pincode}
                onChangeText={setPincode}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={onLookup} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send WhatsApp OTP</Text>}
            </TouchableOpacity>
          </>
        )}

        {/* STEP 2: OTP VERIFICATION */}
        {step === 'otp' && (
          <>
            <View style={styles.otpBox}>
              <Ionicons name="logo-whatsapp" size={24} color="#25D366" />
              <View style={{ flex: 1 }}>
                <Text style={styles.otpBoxTitle}>WhatsApp OTP Sent!</Text>
                <Text style={styles.otpBoxSubtitle}>
                  Check your WhatsApp messages for the 4-digit code.
                  {devOtpHint ? ` (Demo Code: ${devOtpHint})` : ''}
                </Text>
              </View>
            </View>

            <Text style={styles.label}>Enter 4-Digit OTP</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="key-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { letterSpacing: 6, fontSize: 18, fontFamily: FONT.extraBold }]}
                keyboardType="numeric"
                maxLength={6}
                placeholder="• • • •"
                placeholderTextColor="#94a3b8"
                value={otp}
                onChangeText={setOtp}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={onVerifyOtp} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={onLookup} style={{ marginTop: 16, alignItems: 'center' }}>
              <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: theme.primary }}>Didn't receive OTP? Resend via WhatsApp</Text>
            </TouchableOpacity>
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
                placeholder="Min 6 characters"
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
  otpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 14,
    marginBottom: 6,
  },
  otpBoxTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#166534' },
  otpBoxSubtitle: { fontSize: 12.5, fontFamily: FONT.medium, color: '#15803d', marginTop: 1 },
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
