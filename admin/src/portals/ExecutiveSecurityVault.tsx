import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import * as Storage from '../lib/storage';

const VAULT_PIN_STORAGE_KEY = 'farmsking_executive_vault_pin';
const DEFAULT_VAULT_PIN = '1947';

export type VaultSeverity = 'NORMAL' | 'HIGH' | 'CRITICAL';

export interface VaultRequest {
  title: string;
  subtitle?: string;
  severity?: VaultSeverity;
  metadata?: { label: string; value: string }[];
  onAuthorize: () => Promise<void> | void;
  onCancel?: () => void;
}

interface ExecutiveVaultContextType {
  requestAuthorization: (req: VaultRequest) => void;
  isLocked: boolean;
}

const ExecutiveVaultContext = createContext<ExecutiveVaultContextType | undefined>(undefined);

export function useExecutiveVault() {
  const context = useContext(ExecutiveVaultContext);
  if (!context) {
    throw new Error('useExecutiveVault must be used within an ExecutiveVaultProvider');
  }
  return context;
}

export function ExecutiveVaultProvider({ children }: { children: ReactNode }) {
  const [currentRequest, setCurrentRequest] = useState<VaultRequest | null>(null);
  const [pin, setPin] = useState<string>('');
  const [storedPin, setStoredPin] = useState<string>(DEFAULT_VAULT_PIN);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPinDraft, setNewPinDraft] = useState('');

  // Load configured PIN from storage
  useEffect(() => {
    (async () => {
      try {
        const saved = await Storage.getItemAsync(VAULT_PIN_STORAGE_KEY);
        if (saved && saved.length === 4) {
          setStoredPin(saved);
        } else {
          await Storage.setItemAsync(VAULT_PIN_STORAGE_KEY, DEFAULT_VAULT_PIN);
          setStoredPin(DEFAULT_VAULT_PIN);
        }
      } catch {
        // Fallback to default
      }
    })();
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer <= 0) return;
    const interval = setInterval(() => {
      setLockoutTimer((t) => {
        if (t <= 1) {
          setFailedAttempts(0);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutTimer]);

  // Physical keyboard listener on web
  useEffect(() => {
    if (Platform.OS !== 'web' || !currentRequest || lockoutTimer > 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentRequest, pin, lockoutTimer, storedPin, isChangingPin, newPinDraft]);

  const requestAuthorization = (req: VaultRequest) => {
    setCurrentRequest(req);
    setPin('');
    setErrorMsg(null);
    setIsChangingPin(false);
    setNewPinDraft('');
  };

  const handleDismiss = () => {
    if (currentRequest?.onCancel) {
      currentRequest.onCancel();
    }
    setCurrentRequest(null);
    setPin('');
    setErrorMsg(null);
    setIsChangingPin(false);
  };

  const handleDigitPress = (digit: string) => {
    if (lockoutTimer > 0 || isProcessing) return;

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    if (isChangingPin) {
      if (newPinDraft.length < 4) {
        const nextDraft = newPinDraft + digit;
        setNewPinDraft(nextDraft);
        if (nextDraft.length === 4) {
          // Save new PIN
          Storage.setItemAsync(VAULT_PIN_STORAGE_KEY, nextDraft)
            .then(() => {
              setStoredPin(nextDraft);
              setIsChangingPin(false);
              setNewPinDraft('');
              setPin('');
              setErrorMsg('PIN updated successfully. Enter new PIN to authorize.');
            })
            .catch(() => {
              setErrorMsg('Failed to update PIN.');
            });
        }
      }
      return;
    }

    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verifyAndExecute(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (isChangingPin) {
      setNewPinDraft((prev) => prev.slice(0, -1));
      return;
    }
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg(null);
  };

  const verifyAndExecute = async (enteredPin: string) => {
    if (enteredPin === storedPin) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
      setIsProcessing(true);
      setErrorMsg(null);

      try {
        if (currentRequest?.onAuthorize) {
          await currentRequest.onAuthorize();
        }
        setCurrentRequest(null);
        setPin('');
        setFailedAttempts(0);
      } catch (err: any) {
        setErrorMsg(err?.message || 'Operation failed during execution.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      }
      const attempts = failedAttempts + 1;
      setFailedAttempts(attempts);
      setPin('');

      if (attempts >= 3) {
        setLockoutTimer(30);
        setErrorMsg('Too many failed attempts. Vault locked for 30s.');
      } else {
        setErrorMsg(`Incorrect security PIN. ${3 - attempts} attempt(s) remaining.`);
      }
    }
  };

  const severityColor =
    currentRequest?.severity === 'CRITICAL'
      ? '#ef4444'
      : currentRequest?.severity === 'HIGH'
      ? '#f59e0b'
      : '#10b981';

  return (
    <ExecutiveVaultContext.Provider
      value={{
        requestAuthorization,
        isLocked: lockoutTimer > 0,
      }}
    >
      {children}

      {/* Security Vault Modal */}
      <Modal visible={!!currentRequest} transparent animationType="fade" onRequestClose={handleDismiss}>
        <View style={styles.overlay}>
          <View style={[styles.card, { borderColor: `${severityColor}66` }]}>
            {/* Top Vault Header */}
            <View style={styles.header}>
              <View style={[styles.shieldBadge, { backgroundColor: `${severityColor}1a`, borderColor: severityColor }]}>
                <Ionicons name="shield-checkmark" size={24} color={severityColor} />
              </View>
              <Text style={styles.vaultLabel}>FARMSKING EXECUTIVE VAULT</Text>
              <Text style={styles.actionTitle}>{currentRequest?.title}</Text>
              {currentRequest?.subtitle && (
                <Text style={styles.actionSubtitle}>{currentRequest.subtitle}</Text>
              )}
            </View>

            {/* Action Metadata preview */}
            {currentRequest?.metadata && currentRequest.metadata.length > 0 && (
              <View style={styles.metaBox}>
                {currentRequest.metadata.map((m, idx) => (
                  <View key={idx} style={styles.metaRow}>
                    <Text style={styles.metaLabel}>{m.label}:</Text>
                    <Text style={styles.metaValue}>{m.value}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Lockout or PIN input indicators */}
            {lockoutTimer > 0 ? (
              <View style={styles.lockoutBox}>
                <Ionicons name="lock-closed" size={28} color="#ef4444" />
                <Text style={styles.lockoutTitle}>Security Lockout Active</Text>
                <Text style={styles.lockoutTimer}>Retry in {lockoutTimer} seconds</Text>
              </View>
            ) : isProcessing ? (
              <View style={styles.processingBox}>
                <ActivityIndicator size="large" color="#10b981" />
                <Text style={styles.processingText}>Authorizing Executive Action...</Text>
              </View>
            ) : (
              <>
                <Text style={styles.pinPrompt}>
                  {isChangingPin ? 'Enter New 4-Digit Executive PIN' : 'Enter 4-Digit Executive Security PIN'}
                </Text>

                {/* 4-Digit Indicator Dots */}
                <View style={styles.dotsRow}>
                  {[0, 1, 2, 3].map((index) => {
                    const currentLen = isChangingPin ? newPinDraft.length : pin.length;
                    const isFilled = index < currentLen;
                    return (
                      <View
                        key={index}
                        style={[
                          styles.dot,
                          isFilled && { backgroundColor: severityColor, borderColor: severityColor, transform: [{ scale: 1.15 }] },
                        ]}
                      />
                    );
                  })}
                </View>

                {errorMsg && (
                  <View style={styles.errorContainer}>
                    <Ionicons name="alert-circle" size={14} color="#ef4444" />
                    <Text style={styles.errorText}>{errorMsg}</Text>
                  </View>
                )}

                {/* Keypad */}
                <View style={styles.keypad}>
                  {[['1', '2', '3'], ['4', '5', '6'], ['7', '8', '9'], ['C', '0', '⌫']].map((row, rIdx) => (
                    <View key={rIdx} style={styles.keypadRow}>
                      {row.map((btn) => {
                        const isAction = btn === 'C' || btn === '⌫';
                        return (
                          <TouchableOpacity
                            key={btn}
                            style={[styles.keypadBtn, isAction && styles.keypadActionBtn]}
                            activeOpacity={0.7}
                            onPress={() => {
                              if (btn === 'C') {
                                if (isChangingPin) setNewPinDraft('');
                                else setPin('');
                                setErrorMsg(null);
                              } else if (btn === '⌫') {
                                handleBackspace();
                              } else {
                                handleDigitPress(btn);
                              }
                            }}
                          >
                            <Text style={[styles.keypadBtnText, isAction && styles.keypadActionText]}>
                              {btn}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  ))}
                </View>

                {/* Change PIN toggle */}
                <View style={styles.pinActionsRow}>
                  <TouchableOpacity
                    style={styles.changePinBtn}
                    onPress={() => {
                      setIsChangingPin(!isChangingPin);
                      setNewPinDraft('');
                      setPin('');
                      setErrorMsg(null);
                    }}
                  >
                    <Ionicons name={isChangingPin ? 'close-outline' : 'key-outline'} size={13} color="#94a3b8" />
                    <Text style={styles.changePinText}>
                      {isChangingPin ? 'Cancel PIN Change' : 'Change Security PIN (Default: 1947)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelBtn} onPress={handleDismiss} activeOpacity={0.7}>
              <Text style={styles.cancelBtnText}>Dismiss & Cancel Action</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ExecutiveVaultContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#091122',
    borderRadius: RADIUS.xxl,
    borderWidth: 1.5,
    padding: 24,
    alignItems: 'center',
    ...premiumShadow('#000000', 'lg'),
  },
  header: {
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  vaultLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  actionTitle: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#ffffff',
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 4,
  },
  metaBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 10,
    marginBottom: 16,
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontFamily: FONT.medium,
  },
  metaValue: {
    fontSize: 11.5,
    color: '#f8fafc',
    fontFamily: FONT.bold,
  },
  pinPrompt: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginBottom: 14,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 16,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#475569',
    backgroundColor: 'transparent',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  keypad: {
    width: '100%',
    gap: 8,
    marginBottom: 14,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  keypadBtn: {
    flex: 1,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keypadActionBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  keypadBtnText: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  keypadActionText: {
    fontSize: 15,
    color: '#94a3b8',
  },
  pinActionsRow: {
    marginBottom: 12,
  },
  changePinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  changePinText: {
    fontSize: 10.5,
    color: '#94a3b8',
    fontFamily: FONT.medium,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#334155',
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  lockoutBox: {
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  lockoutTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ef4444',
  },
  lockoutTimer: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  processingBox: {
    padding: 30,
    alignItems: 'center',
    gap: 12,
  },
  processingText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#10b981',
  },
});
