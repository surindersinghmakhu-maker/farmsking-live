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
import { apiClient } from '../api/client';

interface AdminActionOtpModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  onConfirm: (otp: string) => Promise<void> | void;
  onCancel: () => void;
}

export function AdminActionOtpModal({
  visible,
  title = 'Admin Authorization Required',
  description = 'Confirming changes to critical APIs, payment gateways, and master configurations requires a 6-digit security authorization code.',
  onConfirm,
  onCancel,
}: AdminActionOtpModalProps) {
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [deliveredVia, setDeliveredVia] = useState<string[]>([]);
  const [countdown, setCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);

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
      handleRequestOtp();
      setTimeout(() => {
        cellRefs.current[0]?.focus();
      }, 350);
    }
  }, [visible]);

  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    setDevOtp(null);
    setError(null);
    setCountdown(60);
    try {
      const res = await apiClient.post('/app-settings/request-admin-action-otp');
      if (res.data?.devOtp) {
        setDevOtp(String(res.data.devOtp));
      }
      if (Array.isArray(res.data?.deliveredVia)) {
        setDeliveredVia(res.data.deliveredVia);
      }
    } catch (e: any) {
      console.warn('[AdminActionOtp] Request OTP error:', e?.message);
      setError(e?.response?.data?.message || 'Could not request authorization code. Please retry.');
    } finally {
      setRequestingOtp(false);
    }
  };

  const executeSubmit = async (codeOverride?: string) => {
    const rawOtp = (codeOverride || otpDigits.join('')).trim();
    if (!rawOtp || rawOtp.length < 6) {
      setError('Please enter the full 6-digit confirmation code.');
      return;
    }
    setLoading(true);
    setError(null);
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

          {/* Localhost / Dev Auto-fill Pill */}
          {isLocalhost && devOtp ? (
            <View style={styles.devPill}>
              <View style={{ flex: 1 }}>
                <Text style={styles.devPillTitle}>Local Development Bypass Code</Text>
                <Text style={styles.devPillSub}>
                  Server OTP: <Text style={{ fontWeight: 'bold', color: '#10b981' }}>{devOtp}</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.fillBtn} onPress={autoFillCode}>
                <Text style={styles.fillBtnText}>Auto-Fill Code</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Dispatch Channel Badges */}
          <View style={styles.deliveryStatusRow}>
            <Text style={styles.deliveryLabel}>Dispatched via:</Text>
            <View style={styles.badgesWrap}>
              {deliveredVia.length > 0 ? (
                deliveredVia.map((channel) => (
                  <View key={channel} style={styles.channelChip}>
                    <Ionicons
                      name={
                        channel.toLowerCase().includes('whatsapp')
                          ? 'logo-whatsapp'
                          : channel.toLowerCase().includes('sms')
                          ? 'chatbubble-ellipses-outline'
                          : 'mail-outline'
                      }
                      size={12}
                      color="#10b981"
                    />
                    <Text style={styles.channelChipText}>{channel}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.channelChip}>
                  <Ionicons name="shield-checkmark-outline" size={12} color="#10b981" />
                  <Text style={styles.channelChipText}>Admin 2FA Security Channel</Text>
                </View>
              )}
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

          {/* 60-Second Resend Countdown */}
          <View style={styles.resendRow}>
            {countdown > 0 ? (
              <Text style={styles.resendTimerText}>
                Resend code in <Text style={{ color: '#10b981', fontWeight: 'bold' }}>{countdown}s</Text>
              </Text>
            ) : (
              <TouchableOpacity
                onPress={handleRequestOtp}
                disabled={requestingOtp}
                style={styles.resendActionBtn}
              >
                {requestingOtp ? (
                  <ActivityIndicator size="small" color="#10b981" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="refresh" size={13} color="#10b981" />
                    <Text style={styles.resendActiveText}>Resend Authorization Code</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  deliveryLabel: {
    fontSize: 11.5,
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
