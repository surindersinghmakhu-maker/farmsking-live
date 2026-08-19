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
import { forgotPasswordStart, forgotPasswordVerify } from '@/src/api/auth.api';

const theme = RoleThemes.FARMER;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'lookup' | 'answer' | 'done'>('lookup');
  const [mobile, setMobile] = useState('');
  const [pincode, setPincode] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<string | null>(null);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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
      setSecurityQuestion(result.securityQuestion);
      setStep('answer');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not find an account with this mobile number and PIN code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerify = async () => {
    setError(null);
    if (!securityAnswer.trim()) {
      setError('Enter your security answer.');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await forgotPasswordVerify({ mobile: mobile.trim(), pincode: pincode.trim(), securityAnswer: securityAnswer.trim() });
      setSuccessMessage(result.message);
      setStep('done');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Security answer did not match.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          {step === 'lookup' && 'Enter your mobile number and PIN code to continue.'}
          {step === 'answer' && 'Answer your security question to reset your password.'}
          {step === 'done' && 'Your password has been reset.'}
        </Text>

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
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === 'answer' && (
          <>
            <View style={styles.questionBox}>
              <Text style={styles.questionText}>{securityQuestion}</Text>
            </View>

            <Text style={styles.label}>Your Answer</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="help-circle-outline" size={18} color="#94a3b8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Your answer"
                placeholderTextColor="#94a3b8"
                value={securityAnswer}
                onChangeText={setSecurityAnswer}
              />
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity onPress={onVerify} disabled={isSubmitting} activeOpacity={0.85} style={styles.button}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Reset Password</Text>}
            </TouchableOpacity>
          </>
        )}

        {step === 'done' && (
          <>
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={22} color="#16a34a" />
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
  questionBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 6,
  },
  questionText: { fontSize: 14.5, fontFamily: FONT.bold, color: '#0f172a' },
  successBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 14,
    marginTop: 6,
  },
  successText: { flex: 1, fontSize: 13.5, fontFamily: FONT.medium, color: '#166534', lineHeight: 19 },
});
