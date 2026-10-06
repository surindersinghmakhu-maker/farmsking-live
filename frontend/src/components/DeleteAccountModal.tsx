import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { auth } from '@/src/lib/firebase';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { deleteMyAccount } from '@/src/api/users.api';
import { useAuth } from '@/src/store/auth-context';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DeleteAccountModal({ visible, onClose }: DeleteAccountModalProps) {
  const { user, logout } = useAuth();
  const [mobileInput, setMobileInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  useEffect(() => {
    if (visible) {
      setMobileInput('');
      setOtpInput('');
      setConfirmationResult(null);
      setOtpSent(false);
      setErrorMsg(null);
      setIsSendingOtp(false);
      setIsVerifying(false);
      setIsDeletingAccount(false);
    }
  }, [visible]);

  const handleSendOtp = async () => {
    const cleanNumber = mobileInput.trim();
    if (!cleanNumber || cleanNumber.length !== 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (cleanNumber !== user?.mobile && cleanNumber !== user?.farmMobile) {
      setErrorMsg('Please enter the mobile number registered with this account.');
      return;
    }

    setIsSendingOtp(true);
    setErrorMsg(null);
    try {
      if (typeof window !== 'undefined' && !(window as any).recaptchaVerifierDelete) {
        (window as any).recaptchaVerifierDelete = new RecaptchaVerifier(
          auth,
          'recaptcha-container-delete',
          { size: 'invisible' }
        );
      }

      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${cleanNumber}`,
        (window as any).recaptchaVerifierDelete
      );

      setConfirmationResult(confirmation);
      setOtpSent(true);
    } catch (err: any) {
      console.warn('Firebase OTP Error:', err);
      setErrorMsg(err?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyAndDelete = async () => {
    if (!otpInput.trim() || otpInput.trim().length !== 6) {
      setErrorMsg('Please enter a valid 6-digit OTP.');
      return;
    }

    if (!confirmationResult) {
      setErrorMsg('OTP session expired. Please request a new OTP.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    try {
      // 1. Verify OTP with Firebase
      await confirmationResult.confirm(otpInput.trim());
      
      // 2. Delete Account on Backend
      setIsDeletingAccount(true);
      await deleteMyAccount();
      
      // 3. Logout
      await logout();
    } catch (err: any) {
      console.warn('Verification/Deletion Error:', err);
      setErrorMsg(err?.response?.data?.message || err?.message || 'Invalid OTP or failed to delete account.');
      setIsDeletingAccount(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.iconBg}>
              <Ionicons name="trash-outline" size={24} color="#dc2626" />
            </View>
            <Text style={styles.title}>Delete Account</Text>
            <Text style={styles.subTitle}>Verify via OTP to permanently delete account.</Text>
          </View>

          {/* Invisible Recaptcha */}
          <View id="recaptcha-container-delete" style={{ display: 'none' }} />

          <View style={{ gap: 12, width: '100%' }}>
            {!otpSent ? (
              <>
                <View>
                  <Text style={styles.label}>1. Enter Registered Mobile Number *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="call-outline" size={17} color="#94a3b8" style={{ marginRight: 6 }} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 9876543210"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={mobileInput}
                      onChangeText={(t) => {
                        setMobileInput(t);
                        setErrorMsg(null);
                      }}
                    />
                  </View>
                </View>

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSendingOtp}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.actionBtn} onPress={handleSendOtp} disabled={isSendingOtp || mobileInput.length !== 10}>
                    {isSendingOtp ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>Send OTP</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <Text style={styles.successText}>OTP sent to {mobileInput}</Text>
                </View>

                <View>
                  <Text style={styles.label}>2. Enter 6-Digit OTP *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="keypad-outline" size={17} color="#94a3b8" style={{ marginRight: 6 }} />
                    <TextInput
                      style={[styles.textInput, { fontSize: 16, letterSpacing: 2 }]}
                      placeholder="000000"
                      placeholderTextColor="#94a3b8"
                      keyboardType="number-pad"
                      maxLength={6}
                      textContentType="oneTimeCode"
                      autoComplete="one-time-code"
                      value={otpInput}
                      onChangeText={(t) => {
                        setOtpInput(t);
                        setErrorMsg(null);
                      }}
                    />
                  </View>
                </View>

                {errorMsg ? (
                  <View style={styles.errorBox}>
                    <Ionicons name="alert-circle" size={16} color="#dc2626" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                ) : null}

                <View style={styles.rowActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isVerifying || isDeletingAccount}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#dc2626' }]} onPress={handleVerifyAndDelete} disabled={isVerifying || isDeletingAccount || otpInput.length !== 6}>
                    {isVerifying || isDeletingAccount ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.actionBtnText}>Verify & Delete</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 2,
    borderColor: '#fecaca',
    ...premiumShadow('#0f172a', 'lg'),
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#991b1b',
    textAlign: 'center',
  },
  subTitle: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: FONT.medium,
    textAlign: 'center',
    marginTop: 2,
  },
  label: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 4,
  },
  inputWrap: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  errorText: {
    color: '#dc2626',
    fontFamily: FONT.medium,
    fontSize: 11.5,
    flex: 1,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  successText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  rowActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  actionBtn: {
    flex: 1.4,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
});
