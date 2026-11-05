import React, { useState, useEffect } from 'react';
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
  description = 'Confirming changes to critical APIs and master configurations requires a one-time security authorization code.',
  onConfirm,
  onCancel,
}: AdminActionOtpModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [requestingOtp, setRequestingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isLocalhost =
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('192.168.'));

  useEffect(() => {
    if (visible) {
      setOtp('');
      setError(null);
      handleRequestOtp();
    }
  }, [visible]);

  const handleRequestOtp = async () => {
    setRequestingOtp(true);
    try {
      const res = await apiClient.post('/app-settings/request-admin-action-otp');
      if (res.data?.devOtp) {
        setDevOtp(res.data.devOtp);
      } else if (isLocalhost) {
        setDevOtp('123456');
      }
    } catch (e: any) {
      console.warn('[AdminActionOtp] Request OTP notice:', e?.message);
      if (isLocalhost) {
        setDevOtp('123456');
      }
    } finally {
      setRequestingOtp(false);
    }
  };

  const handleSubmit = async () => {
    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 6) {
      setError('Please enter the 6-digit confirmation code.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onConfirm(cleanOtp);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Authorization failed.');
    } finally {
      setLoading(false);
    }
  };

  const autoFillCode = () => {
    setOtp(devOtp || '123456');
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          
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

          {isLocalhost && (
            <View style={styles.devPill}>
              <View style={{ flex: 1 }}>
                <Text style={styles.devPillTitle}>💻 Localhost Testing Mode</Text>
                <Text style={styles.devPillSub}>
                  Test Code: <Text style={{ fontWeight: 'bold', color: '#10b981' }}>{devOtp || '123456'}</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.fillBtn} onPress={autoFillCode}>
                <Text style={styles.fillBtnText}>Auto-Fill Code</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>Enter 6-Digit Authorization Code</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="keypad-outline" size={18} color="#94a3b8" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.input}
              value={otp}
              onChangeText={setOtp}
              placeholder="● ● ● ● ● ●"
              placeholderTextColor="#64748b"
              maxLength={6}
              keyboardType="number-pad"
              autoFocus
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} disabled={loading}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, (!otp || otp.length < 6 || loading) && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={!otp || otp.length < 6 || loading}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.gradient}>
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>Authorize & Save</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
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
    marginBottom: 16,
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
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  input: {
    flex: 1,
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 6,
    textAlign: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239,68,68,0.15)',
    borderColor: 'rgba(239,68,68,0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
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
    marginTop: 20,
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
    flex: 1.4,
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

