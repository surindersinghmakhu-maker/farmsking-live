import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { clearDetachedRecaptchaHost, getFreshDetachedRecaptchaHost } from '@/src/utils/recaptchaHost';
import { useAuth } from '@/src/store/auth-context';
import { FONT, RADIUS } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';

export default function VerifyMobileScreen() {
  const router = useRouter();
  const { user, loginPortal, sendMobileLinkOtp, verifyMobileLinkOtp, firebaseMobileLink, logout } = useAuth();

  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [useServerOtp, setUseServerOtp] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const isLocalhost =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.'));

  useEffect(() => {
    if (!user) {
      router.replace('/(auth)/login' as any);
      return;
    }
    if (user.mobile && !String(user.mobile).startsWith('G_')) {
      navigateAfterVerification(user);
    }
  }, [user]);

  useEffect(() => {
    if (!otpSent || resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer((prev) => prev - 1), 1000);
    return () => clearTimeout(t);
  }, [otpSent, resendTimer]);

  const navigateAfterVerification = (verifiedUser: any) => {
    const roles: string[] = Array.from(
      new Set([verifiedUser?.role, ...(Array.isArray(verifiedUser?.roles) ? verifiedUser.roles : [])].filter(Boolean)),
    );
    if (loginPortal === 'PARTNER') {
      if (roles.some((r) => ['AGENT', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR'].includes(r))) {
        router.replace('/(partner)/(tabs)' as any);
        return;
      }
      if (roles.includes('SELLER')) {
        router.replace('/seller-dashboard' as any);
        return;
      }
    }
    router.replace('/(user)/(tabs)' as any);
  };

  const handleSendOtp = async () => {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setErrorMsg(null);
    setInfoMsg(null);
    setDevOtpHint(null);
    setIsSending(true);

    if (isLocalhost) {
      try {
        const res = await sendMobileLinkOtp(cleanMobile);
        setUseServerOtp(true);
        if (res?.devOtp) {
          setDevOtpHint(res.devOtp);
        }
        setInfoMsg(res?.message || `Verification code sent to +91 ${cleanMobile}.`);
        setOtpSent(true);
        setOtp('');
        setResendTimer(30);
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Could not send OTP.';
        setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
      } finally {
        setIsSending(false);
      }
      return;
    }

    try {
      if (typeof window !== 'undefined') {
        const hostEl = getFreshDetachedRecaptchaHost('fk-recaptcha-verify-mobile', 'recaptchaVerifierMobileLink');
        (window as any).recaptchaVerifierMobileLink = new RecaptchaVerifier(auth, hostEl, { size: 'invisible' });
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${cleanMobile}`,
        (window as any).recaptchaVerifierMobileLink,
      );
      setUseServerOtp(false);
      setConfirmationResult(confirmation);
      setOtpSent(true);
      setOtp('');
      setResendTimer(30);
      setInfoMsg(`6-digit SMS code sent to +91 ${cleanMobile}.`);
    } catch {
      clearDetachedRecaptchaHost('fk-recaptcha-verify-mobile', 'recaptchaVerifierMobileLink');
      try {
        const res = await sendMobileLinkOtp(cleanMobile);
        setUseServerOtp(true);
        if (res?.devOtp) {
          setDevOtpHint(res.devOtp);
        }
        setInfoMsg(res?.message || `Verification code sent to +91 ${cleanMobile}.`);
        setOtpSent(true);
        setOtp('');
        setResendTimer(30);
      } catch (srvErr: any) {
        const msg = srvErr?.response?.data?.message || srvErr?.message || 'Failed to send verification OTP.';
        setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    const cleanOtp = otp.trim();
    if (cleanOtp.length !== 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    setErrorMsg(null);
    setIsVerifying(true);
    try {
      let result;
      if (useServerOtp) {
        result = await verifyMobileLinkOtp({ mobile: cleanMobile, otp: cleanOtp });
      } else {
        if (!confirmationResult) {
          setErrorMsg('OTP session expired. Please request a new code.');
          setIsVerifying(false);
          return;
        }
        const cred = await confirmationResult.confirm(cleanOtp);
        const idToken = await cred.user.getIdToken();
        result = await firebaseMobileLink({ idToken });
      }
      navigateAfterVerification(result?.user || user);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid OTP code. Please try again.';
      setErrorMsg(Array.isArray(msg) ? msg.join(', ') : String(msg));
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#050a12', '#090e17', '#0d1a14']} style={StyleSheet.absoluteFill} />

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.logoWrap}>
            <BrandLogo height={34} width={132} />
            <View style={styles.isoPill}>
              <Ionicons name="shield-checkmark" size={12} color="#00ff87" />
              <Text style={styles.isoPillText}>ISO 27001 Verified Security</Text>
            </View>
          </View>

          <View style={styles.badge}>
            <Ionicons name="phone-portrait-outline" size={14} color="#00ff87" />
            <Text style={styles.badgeText}>Mobile Verification Required</Text>
          </View>

          <Text style={styles.title}>Verify Your Mobile Number</Text>
          <Text style={styles.subtitle}>
            Your Gmail ({user?.email || 'Google Account'}) is verified. To activate your FarmsKing account and King ID, please verify your 10-digit mobile number with OTP.
          </Text>

          {!otpSent ? (
            <View style={styles.formBlock}>
              <Text style={styles.label}>Mobile Number (10 Digits)</Text>
              <View style={styles.inputRow}>
                <View style={styles.prefixBox}>
                  <Text style={styles.prefixText}>+91</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter 10-digit mobile number"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={mobile}
                  onChangeText={(val) => {
                    setMobile(val.replace(/\D/g, '').slice(0, 10));
                    setErrorMsg(null);
                  }}
                />
              </View>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#f87171" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, (isSending || mobile.length !== 10) && styles.btnDisabled]}
                activeOpacity={0.85}
                disabled={isSending || mobile.length !== 10}
                onPress={handleSendOtp}
              >
                {isSending ? (
                  <ActivityIndicator color="#041b11" size="small" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#041b11" />
                    <Text style={styles.primaryBtnText}>Send Verification OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.formBlock}>
              {infoMsg ? (
                <View style={styles.infoBox}>
                  <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                  <Text style={styles.infoText}>
                    {infoMsg}
                    {devOtpHint ? ` (Local test code: ${devOtpHint})` : ''}
                  </Text>
                </View>
              ) : null}

              <Text style={styles.label}>Enter 6-Digit OTP for +91 {mobile}</Text>
              <TextInput
                style={[styles.input, styles.otpInput]}
                placeholder="000000"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={(val) => {
                  setOtp(val.replace(/\D/g, '').slice(0, 6));
                  setErrorMsg(null);
                }}
              />

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#f87171" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.primaryBtn, (isVerifying || otp.length !== 6) && styles.btnDisabled]}
                activeOpacity={0.85}
                disabled={isVerifying || otp.length !== 6}
                onPress={handleVerifyOtp}
              >
                {isVerifying ? (
                  <ActivityIndicator color="#041b11" size="small" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={16} color="#041b11" />
                    <Text style={styles.primaryBtnText}>Verify OTP &amp; Continue</Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.secondaryRow}>
                <TouchableOpacity
                  onPress={() => {
                    setOtpSent(false);
                    setOtp('');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                >
                  <Text style={styles.linkText}>Change Mobile Number</Text>
                </TouchableOpacity>

                <TouchableOpacity disabled={resendTimer > 0 || isSending} onPress={handleSendOtp}>
                  <Text style={[styles.linkText, resendTimer > 0 && { color: '#64748b' }]}>
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.logoutRow} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={15} color="#94a3b8" />
            <Text style={styles.logoutText}>Sign Out / Use Another Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090e17' },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 28,
    gap: 14,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  isoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  isoPillText: { fontSize: 11, fontFamily: FONT.semiBold, color: '#00ff87' },
  badge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginTop: 6,
  },
  badgeText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#00ff87' },
  title: { fontSize: 22, fontFamily: FONT.bold, color: '#f8fafc' },
  subtitle: { fontSize: 13.5, fontFamily: FONT.regular, color: '#94a3b8', lineHeight: 20 },
  formBlock: { gap: 12, marginTop: 4 },
  label: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#cbd5e1' },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefixBox: {
    height: 48,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    justifyContent: 'center',
  },
  prefixText: { fontSize: 14, fontFamily: FONT.bold, color: '#e2e8f0' },
  input: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: '#0b1322',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: FONT.semiBold,
    color: '#f8fafc',
  },
  otpInput: {
    textAlign: 'center',
    letterSpacing: 8,
    fontSize: 20,
    fontFamily: FONT.bold,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  errorText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#fca5a5' },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  infoText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#6ee7b7' },
  primaryBtn: {
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: '#00ff87',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  btnDisabled: { opacity: 0.5 },
  primaryBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#041b11' },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  linkText: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#38bdf8' },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  logoutText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8' },
});

