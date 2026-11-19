import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '../src/lib/firebase';
import { getFreshDetachedRecaptchaHost, clearDetachedRecaptchaHost } from '../src/utils/recaptchaHost';
import { apiClient } from '../src/api/client';
import { useAuth } from '../src/store/auth-context';

interface AdminActionOtpModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  onConfirm: (otp: string) => Promise<void> | void;
  onCancel: () => void;
}

export function AdminActionOtpModal({
  visible,
  title = 'Authorize System Configuration Update',
  description = 'Updating platform integrations, payment gateways, and system configurations requires a 6-digit security authorization code.',
  onConfirm,
  onCancel,
}: AdminActionOtpModalProps) {
  const { user } = useAuth();
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [firebaseSending, setFirebaseSending] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [adminMobile, setAdminMobile] = useState<string>('9872066901');
  const [deliveredVia, setDeliveredVia] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  const cellRefs = useRef<(TextInput | null)[]>([]);

  const isLocalhost =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.'));

  // Countdown timer for resend OTP
  useEffect(() => {
    let timer: any;
    if (visible && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [visible, countdown]);

  useEffect(() => {
    if (visible) {
      setOtpDigits(['', '', '', '', '', '']);
      setError(null);
      setCountdown(60);
      setConfirmationResult(null);
      handleRequestOtp();
      setTimeout(() => {
        cellRefs.current[0]?.focus();
      }, 350);
    } else {
      clearDetachedRecaptchaHost('fk-recaptcha-stepup-host', 'recaptchaVerifierAdminStepUp');
    }
  }, [visible]);

  const sendFirebaseTextSms = async (targetPhone: string) => {
    if (Platform.OS !== 'web' || typeof window !== 'undefined' === false) return;
    const clean = targetPhone.replace(/\D/g, '').slice(-10);
    if (!clean || clean.length < 10) return;

    setFirebaseSending(true);
    try {
      const fullPhone = `+91${clean}`;
      const container = getFreshDetachedRecaptchaHost('fk-recaptcha-stepup-host', 'recaptchaVerifierAdminStepUp');
      const verifier = new RecaptchaVerifier(auth, container, {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          try {
            verifier.clear();
          } catch {}
          (window as any)['recaptchaVerifierAdminStepUp'] = null;
        },
      });
      (window as any)['recaptchaVerifierAdminStepUp'] = verifier;

      const confirmation = await signInWithPhoneNumber(auth, fullPhone, verifier);
      setConfirmationResult(confirmation);
      setDeliveredVia((prev) => Array.from(new Set(['Firebase SMS', ...prev])));
    } catch (fbErr: any) {
      console.warn('[AdminActionOtpModal] Firebase Text Message error:', fbErr?.code, fbErr?.message);
      clearDetachedRecaptchaHost('fk-recaptcha-stepup-host', 'recaptchaVerifierAdminStepUp');
      setDeliveredVia((prev) => prev.filter((c) => c !== 'Firebase SMS'));
    } finally {
      setFirebaseSending(false);
    }
  };

  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    setDevOtp(null);
    setError(null);
    setCountdown(60);
    setConfirmationResult(null);

    let resolvedMobile = (user?.mobile || '9872066901').replace(/\D/g, '').slice(-10);

    // 1. Backend session & fallback channels
    try {
      const res = await apiClient.post('/app-settings/request-admin-action-otp');
      if (res.data?.devOtp) {
        const code = String(res.data.devOtp).trim();
        setDevOtp(code);
        // Automatically pick the 6-digit code according to the OTP module
        const digits = code.slice(0, 6).split('');
        while (digits.length < 6) digits.push('');
        setOtpDigits(digits);
      }
      if (res.data?.mobile) {
        resolvedMobile = String(res.data.mobile).replace(/\D/g, '').slice(-10);
      }
      if (Array.isArray(res.data?.deliveredVia)) {
        setDeliveredVia(res.data.deliveredVia);
      }
    } catch (e: any) {
      console.warn('[AdminActionOtp] Request OTP API warning:', e?.message);
    }

    setAdminMobile(resolvedMobile);

    // 2. Dispatch real Text Message (SMS) via Google Firebase Phone Auth
    await sendFirebaseTextSms(resolvedMobile);

    setRequestingOtp(false);
  };

  const executeSubmit = async (codeOverride?: string) => {
    const rawOtp = (codeOverride || otpDigits.join('')).trim();
    if (!rawOtp || rawOtp.length < 6) {
      setError('Please enter the full 6-digit confirmation code.');
      return;
    }
    setLoading(true);
    setError(null);

    // 1. If Firebase Phone Auth session exists and code is not explicitly the OTP module bypass code, try Firebase
    if (confirmationResult && (!devOtp || rawOtp !== devOtp)) {
      try {
        const userCred = await confirmationResult.confirm(rawOtp);
        const idToken = await userCred.user.getIdToken();
        if (idToken) {
          await onConfirm(idToken);
          setLoading(false);
          return;
        }
      } catch (fbVerifyErr: any) {
        console.warn('[AdminActionOtpModal] Firebase verify note, checking server OTP fallback:', fbVerifyErr?.message);
      }
    }

    // 2. Direct server OTP verification via OTP Module
    try {
      await onConfirm(rawOtp);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitChange = (val: string, index: number) => {
    const clean = val.replace(/\D/g, '');

    // Multi-digit paste support (e.g. pasted all 6 digits into first or active cell)
    if (clean.length > 1) {
      const pasted = clean.slice(0, 6).split('');
      const newDigits = ['', '', '', '', '', ''];
      pasted.forEach((d, i) => {
        newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasted.length, 5);
      cellRefs.current[nextIndex]?.focus();
      if (newDigits.every((d) => d.length > 0)) {
        executeSubmit(newDigits.join(''));
      }
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = clean;
    setOtpDigits(newDigits);

    // Auto-advance cursor to next input box
    if (clean && index < 5) {
      cellRefs.current[index + 1]?.focus();
    }

    // Auto-submit on 6th digit entered
    if (clean && index === 5) {
      const fullCode = newDigits.join('');
      if (fullCode.length === 6) {
        executeSubmit(fullCode);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
        cellRefs.current[index - 1]?.focus();
      }
    } else if (e.nativeEvent.key === 'Enter') {
      const fullCode = otpDigits.join('');
      if (fullCode.length === 6) {
        executeSubmit(fullCode);
      }
    }
  };

  const autoFillCode = () => {
    if (devOtp) {
      const clean = String(devOtp).replace(/\D/g, '').slice(0, 6);
      const digits = clean.split('');
      while (digits.length < 6) digits.push('');
      setOtpDigits(digits);
      cellRefs.current[5]?.focus();
      if (clean.length === 6) {
        executeSubmit(clean);
      }
    }
  };

  const isFilled = otpDigits.every((d) => d.trim().length > 0);
  const maskedPhone = adminMobile ? `+91 ******${adminMobile.slice(-4)}` : '+91 98720*****';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="shield-checkmark" size={24} color="#10b981" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.sub}>{description}</Text>
            </View>
            <TouchableOpacity onPress={onCancel} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* OTP Module Auto-Picked Code Banner */}
          {devOtp ? (
            <View style={styles.devPill}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                  <Text style={styles.devPillTitle}>OTP Module Authorization Code</Text>
                </View>
                <Text style={styles.devPillSub}>
                  Security Code: <Text style={{ fontWeight: 'bold', color: '#10b981', letterSpacing: 2, fontSize: 14 }}>{devOtp}</Text> (Auto-Picked)
                </Text>
              </View>
              <TouchableOpacity style={styles.fillBtn} onPress={autoFillCode}>
                <Ionicons name="flash" size={13} color="#ffffff" style={{ marginRight: 4 }} />
                <Text style={styles.fillBtnText}>Auto-Fill Code</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Phone Target & Dispatch Badges */}
          <View style={styles.deliveryStatusRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 6 }}>
              <Text style={styles.deliveryLabel}>
                Text Message Target: <Text style={{ color: '#ffffff', fontWeight: 'bold' }}>{maskedPhone}</Text>
              </Text>
              {firebaseSending && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <ActivityIndicator size="small" color="#f59e0b" />
                  <Text style={{ fontSize: 11, color: '#f59e0b' }}>Sending SMS...</Text>
                </View>
              )}
            </View>

            <View style={styles.badgesWrap}>
              {deliveredVia.includes('Firebase SMS') && (
                <View style={[styles.channelChip, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
                  <Ionicons name="flame" size={13} color="#f59e0b" />
                  <Text style={[styles.channelChipText, { color: '#fbbf24' }]}>Firebase Text SMS</Text>
                </View>
              )}
              {deliveredVia.filter(c => c !== 'Firebase SMS').map((channel) => (
                <View key={channel} style={styles.channelChip}>
                  <Ionicons
                    name={
                      channel.toLowerCase().includes('whatsapp')
                        ? 'logo-whatsapp'
                        : channel.toLowerCase().includes('sms')
                        ? 'chatbubble-ellipses-outline'
                        : 'shield-checkmark-outline'
                    }
                    size={12}
                    color="#10b981"
                  />
                  <Text style={styles.channelChipText}>{channel}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 6 Individual Segmented OTP Boxes */}
          <Text style={styles.label}>Enter 6-Digit Authorization Code</Text>
          <View style={styles.segmentedRow}>
            {otpDigits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(el) => {
                  cellRefs.current[idx] = el;
                }}
                style={[
                  styles.otpCell,
                  digit ? styles.otpCellFilled : null,
                  focusedIndex === idx ? styles.otpCellActive : null,
                ]}
                keyboardType="number-pad"
                maxLength={idx === 0 ? 6 : 1}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                onFocus={() => setFocusedIndex(idx)}
                onBlur={() => setFocusedIndex(null)}
                selectTextOnFocus
                textAlign="center"
              />
            ))}
          </View>

          {/* 60-Second Resend & Direct Firebase Trigger */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.resendTimerText}>
                Resend code in <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleRequestOtp}
                disabled={requestingOtp || firebaseSending}
                style={styles.resendActionBtn}
              >
                {requestingOtp || firebaseSending ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="chatbox-ellipses" size={14} color="#f59e0b" />
                    <Text style={[styles.resendActiveText, { color: '#fbbf24' }]}>Resend Firebase Text Message</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!isFilled || loading) && { opacity: 0.5 }]}
              onPress={() => executeSubmit()}
              disabled={!isFilled || loading}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.gradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="lock-open-outline" size={16} color="#ffffff" />
                    <Text style={styles.saveText}>Authorize & Confirm</Text>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 99999,
  },
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    padding: 24,
    maxWidth: 440,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16,185,129,0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  sub: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 17,
  },
  closeBtn: {
    padding: 4,
  },
  devPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  devPillTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a7f3d0',
    textTransform: 'uppercase',
  },
  devPillSub: {
    fontSize: 12,
    color: '#ffffff',
    marginTop: 2,
  },
  fillBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  fillBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#064e3b',
  },
  deliveryStatusRow: {
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  deliveryLabel: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  badgesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  channelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16,185,129,0.12)',
    borderColor: 'rgba(16,185,129,0.3)',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  channelChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#a7f3d0',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
    textAlign: 'center',
  },
  segmentedRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 10,
  },
  otpCell: {
    flex: 1,
    maxWidth: 50,
    height: 52,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    padding: 0,
  },
  otpCellFilled: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    color: '#10b981',
  },
  otpCellActive: {
    borderColor: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  resendRow: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    marginBottom: 6,
    minHeight: 24,
  },
  resendTimerText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  resendActionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  resendActiveText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10b981',
    textDecorationLine: 'underline',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 18,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#cbd5e1',
    fontSize: 13.5,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 1.5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  gradient: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: 'bold',
  },
});
