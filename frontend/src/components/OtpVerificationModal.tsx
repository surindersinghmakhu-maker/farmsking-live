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
import { apiClient } from '../api/client';

interface OtpVerificationModalProps {
  visible: boolean;
  mobileNumber: string;
  generatedOtp: string;
  adminWhatsAppNumber?: string;
  onVerifySuccess: () => void;
  onClose: () => void;
}

export function OtpVerificationModal({
  visible,
  mobileNumber,
  generatedOtp,
  adminWhatsAppNumber = '919577622000',
  onVerifySuccess,
  onClose,
}: OtpVerificationModalProps) {
  const [enteredOtp, setEnteredOtp] = useState('');
  const [timer, setTimer] = useState(30);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isBotSending, setIsBotSending] = useState(false);
  const [botStatusText, setBotStatusText] = useState<string | null>(null);
  const [isBotConnected, setIsBotConnected] = useState<boolean | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (visible && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [visible, timer]);

  useEffect(() => {
    if (visible && mobileNumber && generatedOtp) {
      triggerAutomatedBotOtp();
    }
  }, [visible, mobileNumber, generatedOtp]);

  const triggerAutomatedBotOtp = async () => {
    setIsBotSending(true);
    setBotStatusText(null);
    setIsBotConnected(null);
    try {
      const res = await apiClient.post('/auth/send-otp', {
        mobile: mobileNumber,
        otp: generatedOtp,
      });
      if (res.data?.success) {
        setIsBotConnected(true);
        setBotStatusText(`🟢 4-digit OTP sent to your WhatsApp (+91 ${mobileNumber})!`);
      } else {
        setIsBotConnected(false);
        setBotStatusText("⚠️ Automated WhatsApp Bot is currently offline.");
      }
    } catch {
      setIsBotConnected(false);
      setBotStatusText("⚠️ Automated WhatsApp Bot is currently offline.");
    } finally {
      setIsBotSending(false);
    }
  };

  const handleOpenWhatsAppDeepLink = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const msg = `🌾 FarmsKing Verification Code: ${generatedOtp}\nMobile Number: ${mobileNumber}`;
    const cleanAdminNum = adminWhatsAppNumber.replace(/\D/g, '');
    const url = `https://wa.me/${cleanAdminNum}?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Not Available', 'WhatsApp app is not installed on this device.');
    });
  };

  const handleVerify = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setErrorText(null);
    const clean = enteredOtp.trim();
    if (clean === generatedOtp) {
      onVerifySuccess();
    } else {
      setErrorText('Invalid OTP! Please enter the correct code.');
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

          {isBotSending ? (
            <View style={styles.botStatusWrap}>
              <ActivityIndicator size="small" color="#16a34a" />
              <Text style={styles.botStatusText}>Sending 4-digit OTP to WhatsApp...</Text>
            </View>
          ) : botStatusText ? (
            <Text style={[styles.botStatusText, isBotConnected === false && { color: '#b45309' }]}>
              {botStatusText}
            </Text>
          ) : (
            <Text style={styles.instruction}>
              A 4-digit OTP code has been sent to your WhatsApp number (+91 {mobileNumber}). Enter the code below:
            </Text>
          )}

          {/* If Bot is Offline, show Fallback Quick-Fill Card */}
          {isBotConnected === false && (
            <View style={styles.fallbackBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="alert-circle" size={16} color="#d97706" />
                <Text style={styles.fallbackTitle}>Bot Service Offline Notice</Text>
              </View>
              <Text style={styles.fallbackSub}>
                Your verification OTP is <Text style={{ fontFamily: FONT.extraBold, color: '#16a34a', fontSize: 14 }}>{generatedOtp}</Text>. Tap Quick-Fill to auto-enter the code:
              </Text>
              <TouchableOpacity
                style={styles.quickFillBtn}
                onPress={() => {
                  setEnteredOtp(generatedOtp);
                  setErrorText(null);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="flash" size={15} color="#ffffff" />
                <Text style={styles.quickFillText}>⚡ Quick-Fill Code ({generatedOtp})</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OTP Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.otpInput}
              keyboardType="number-pad"
              maxLength={4}
              placeholder="••••"
              placeholderTextColor="#cbd5e1"
              value={enteredOtp}
              onChangeText={(text) => {
                setEnteredOtp(text);
                setErrorText(null);
              }}
            />
          </View>

          {errorText ? <Text style={styles.errorText}>{errorText}</Text> : null}

          {/* Deep Link WhatsApp Support Option */}
          <TouchableOpacity style={styles.freeWaLinkBtn} onPress={handleOpenWhatsAppDeepLink}>
            <Ionicons name="logo-whatsapp" size={16} color="#25d366" />
            <Text style={styles.freeWaLinkText}>💬 Open WhatsApp Support</Text>
          </TouchableOpacity>

          {/* Verify Action Button */}
          <TouchableOpacity
            style={[styles.verifyBtnWrap, !enteredOtp.trim() && { opacity: 0.6 }]}
            disabled={!enteredOtp.trim()}
            onPress={handleVerify}
          >
            <LinearGradient colors={['#16a34a', '#15803d']} style={styles.verifyBtn}>
              <Text style={styles.verifyBtnText}>Verify OTP & Complete Registration</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Resend Timer */}
          <View style={styles.resendRow}>
            {timer > 0 ? (
              <Text style={styles.timerText}>Resend in {timer}s</Text>
            ) : (
              <TouchableOpacity onPress={() => { setTimer(30); triggerAutomatedBotOtp(); }}>
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
