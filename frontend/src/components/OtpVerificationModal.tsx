import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Linking,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { auth } from '@/src/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface OtpVerificationModalProps {
  visible: boolean;
  mobileNumber: string;
  onVerifySuccess: (firebaseIdToken: string) => void;
  onClose: () => void;
}

export function OtpVerificationModal({
  visible,
  mobileNumber,
  onVerifySuccess,
  onClose,
}: OtpVerificationModalProps) {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (visible && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [visible, timer]);

  useEffect(() => {
    if (visible && mobileNumber) {
      triggerFirebaseOtp();
    } else {
      setConfirmationResult(null);
      setEnteredOtp('');
      setErrorText(null);
    }
  }, [visible, mobileNumber]);

  const triggerFirebaseOtp = async () => {
    setIsSending(true);
    setErrorText(null);
    try {
      if (typeof window !== 'undefined' && !(window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier = new RecaptchaVerifier(
          auth,
          'recaptcha-container-otp',
          { size: 'invisible' }
        );
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${mobileNumber}`,
        (window as any).recaptchaVerifier
      );
      setConfirmationResult(confirmation);
      setTimer(30);
    } catch (err: any) {
      setErrorText(err.message || 'Failed to send OTP via Firebase.');
    } finally {
      setIsSending(false);
    }
  };

  const handleVerify = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setErrorText(null);
    const clean = enteredOtp.trim();
    if (clean.length < 4) {
      setErrorText('Please enter a valid OTP.');
      return;
    }
    
    if (!confirmationResult) {
      setErrorText('OTP session expired. Please request a new OTP.');
      return;
    }
    
    setIsVerifying(true);
    try {
      const res = await confirmationResult.confirm(clean);
      const idToken = await res.user.getIdToken();
      onVerifySuccess(idToken);
    } catch (err: any) {
      setErrorText(err.message || 'Invalid OTP! Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, premiumShadow('#000', 'lg')]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="logo-whatsapp" size={24} color="#25d366" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>WhatsApp Verification</Text>
              <Text style={styles.subtitle}>Mobile: {mobileNumber}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View id="recaptcha-container-otp" style={{ display: 'none' }} />

          {isSending ? (
            <View style={{ alignItems: 'center', marginVertical: 20 }}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={{ marginTop: 10, color: '#475569', fontFamily: FONT.medium }}>Sending OTP via Firebase...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.instruction}>
                A 6-digit OTP code has been sent via SMS to (+91 {mobileNumber}). Enter the code below:
              </Text>
            </>
          )}

          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={6}
              placeholder="••••••"
              placeholderTextColor="#cbd5e1"
              value={enteredOtp}
              onChangeText={(text) => {
                setEnteredOtp(text);
                setErrorText(null);
              }}
            />
          </View>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}


          {/* Verify Action Button */}
          <TouchableOpacity
            style={[styles.verifyBtnWrap, !enteredOtp.trim() && { opacity: 0.6 }]}
            disabled={!enteredOtp.trim()}
            onPress={handleVerify}
          >
            <LinearGradient colors={['#16a34a', '#15803d']} style={styles.verifyBtn}>
              {isVerifying ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.verifyBtnText}>Verify OTP</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend Timer */}
          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={() => { setTimer(30); triggerFirebaseOtp(); }}>
                <Text style={styles.resendBtnText}>🔄 Resend OTP</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a' },
  subtitle: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a', marginTop: 1 },
  instruction: { fontSize: 13, fontFamily: FONT.medium, color: '#475569', lineHeight: 19, marginBottom: 16 },
  botStatusWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', padding: 10, borderRadius: RADIUS.md, marginBottom: 14 },
  botStatusText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#15803d', textAlign: 'center', marginBottom: 12 },
  fallbackBox: {
    backgroundColor: '#fefce8',
    borderWidth: 1.5,
    borderColor: '#fde047',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  fallbackTitle: { fontSize: 12, fontFamily: FONT.extraBold, color: '#b45309' },
  fallbackSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#78350f', marginTop: 2, marginBottom: 8 },
  quickFillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#d97706',
    borderRadius: RADIUS.sm,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  quickFillText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
  inputContainer: { alignItems: 'center', marginBottom: 10 },
  otpInput: { width: '100%', backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#16a34a', borderRadius: RADIUS.md, paddingVertical: 12, textAlign: 'center', fontSize: 24, fontFamily: FONT.extraBold, letterSpacing: 8, color: '#0f172a' },
  errorText: { fontSize: 12, color: '#dc2626', fontFamily: FONT.bold, textAlign: 'center', marginBottom: 8 },
  freeWaLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: RADIUS.md, paddingVertical: 9, marginBottom: 14 },
  freeWaLinkText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#15803d' },
  verifyBtnWrap: { borderRadius: RADIUS.md, overflow: 'hidden' },
  verifyBtn: { paddingVertical: 13, alignItems: 'center' },
  verifyBtnText: { color: '#ffffff', fontSize: 14, fontFamily: FONT.extraBold },
  resendRow: { alignItems: 'center', marginTop: 14 },
  timerText: { fontSize: 12, color: '#94a3b8', fontFamily: FONT.medium },
  resendBtnText: { fontSize: 12.5, color: '#16a34a', fontFamily: FONT.bold },
});
