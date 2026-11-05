import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

// ISO 27001 Standard Inactivity Timeout: 15 minutes (900 seconds)
const TIMEOUT_SECONDS = 15 * 60;
// Warning triggers at last 2 minutes (120 seconds)
const WARNING_THRESHOLD_SECONDS = 2 * 60;

const STAFF_ROLES = [
  'ADMIN',
  'SUPERADMIN',
  'SUPER_ADMIN',
  'OPERATOR',
  'SUPERVISOR',
  'MANAGER',
  'DISTRICT_MANAGER',
  'STATE_MANAGER',
  'ACCOUNTS_MANAGER',
  'OPERATIONS_MANAGER',
  'ADVISOR',
  'FARM_ADVISOR',
  'GARDEN_ADVISOR',
  'TECHNICAL_TRAINER',
];

export function StaffSessionGuardian() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const isStaff = Boolean(
    user && (STAFF_ROLES.includes(user.role) || user.roles?.some((r) => STAFF_ROLES.includes(r)))
  );

  const [secondsRemaining, setSecondsRemaining] = useState<number>(TIMEOUT_SECONDS);
  const [showWarningModal, setShowWarningModal] = useState<boolean>(false);
  const [isLoggedOutModal, setIsLoggedOutModal] = useState<boolean>(false);
  const lastActivityRef = useRef<number>(Date.now());

  // Activity reset handler
  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setSecondsRemaining(TIMEOUT_SECONDS);
    if (showWarningModal) {
      setShowWarningModal(false);
    }
  }, [showWarningModal]);

  // Listen to user interactions on Web (Mouse, Key, Touch, Scroll)
  useEffect(() => {
    if (!isStaff || Platform.OS !== 'web') return;

    const handleUserActivity = () => {
      // Throttle activity updates to once per 5 seconds
      if (Date.now() - lastActivityRef.current > 5000) {
        resetTimer();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', handleUserActivity);
      window.addEventListener('keydown', handleUserActivity);
      window.addEventListener('click', handleUserActivity);
      window.addEventListener('scroll', handleUserActivity, true);
      window.addEventListener('touchstart', handleUserActivity);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('mousemove', handleUserActivity);
        window.removeEventListener('keydown', handleUserActivity);
        window.removeEventListener('click', handleUserActivity);
        window.removeEventListener('scroll', handleUserActivity, true);
        window.removeEventListener('touchstart', handleUserActivity);
      }
    };
  }, [isStaff, resetTimer]);

  // Main 1-second countdown loop
  useEffect(() => {
    if (!isStaff) return;

    const interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, TIMEOUT_SECONDS - elapsedSeconds);
      setSecondsRemaining(remaining);

      // Show warning modal when 2 minutes remaining
      if (remaining <= WARNING_THRESHOLD_SECONDS && remaining > 0) {
        setShowWarningModal(true);
      } else if (remaining > WARNING_THRESHOLD_SECONDS) {
        setShowWarningModal(false);
      }

      // Session timeout reached!
      if (remaining <= 0) {
        clearInterval(interval);
        handleAutoLogout();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isStaff]);

  const handleAutoLogout = async () => {
    setShowWarningModal(false);
    setIsLoggedOutModal(true);
    try {
      await logout();
    } catch (e) {
      console.warn('[StaffSessionGuardian] Auto logout error:', e);
    }
  };

  const closeAndGoToLogin = () => {
    setIsLoggedOutModal(false);
    router.replace('/(auth)/login');
  };

  if (!isStaff) {
    return null;
  }

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isExpiringSoon = secondsRemaining <= WARNING_THRESHOLD_SECONDS;

  return (
    <>
      {/* Sleek Floating Header Badge for PC & Laptop View */}
      <View style={[styles.floatingBadge, isExpiringSoon && styles.floatingBadgeWarning, premiumShadow('#000', 'md')]}>
        <View style={styles.badgeContent}>
          <Ionicons
            name={isExpiringSoon ? 'alert-circle' : 'shield-checkmark'}
            size={14}
            color={isExpiringSoon ? '#ef4444' : '#10b981'}
          />
          <Text style={[styles.badgeText, isExpiringSoon && styles.badgeTextWarning]}>
            Staff Session: <Text style={styles.timeMono}>{formattedTime}</Text>
          </Text>
          <TouchableOpacity style={styles.extendBtn} onPress={resetTimer} activeOpacity={0.8}>
            <Text style={styles.extendBtnText}>Extend</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Warning Modal: Last 2 Minutes Warning */}
      <Modal visible={showWarningModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, premiumShadow('#000', 'lg')]}>
            <View style={styles.warningIconCircle}>
              <Ionicons name="timer-outline" size={32} color="#f59e0b" />
            </View>
            <Text style={styles.modalTitle}>Staff Security Timeout Warning</Text>
            <Text style={styles.modalDesc}>
              To protect master database records and prevent unauthorized tampering (ISO 27001 Security Policy), your staff session will automatically terminate in:
            </Text>
            <Text style={styles.countdownBig}>{formattedTime}</Text>
            <Text style={styles.modalFootnote}>
              Click "Keep Me Logged In" to extend your session for another 15 minutes.
            </Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={resetTimer}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.modalBtnTextPrimary}>Keep Me Logged In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={handleAutoLogout}
                activeOpacity={0.85}
              >
                <Text style={styles.modalBtnTextSecondary}>Log Out Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Session Expired Termination Notice */}
      <Modal visible={isLoggedOutModal} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalBox, premiumShadow('#000', 'lg')]}>
            <View style={[styles.warningIconCircle, { backgroundColor: 'rgba(239,68,68,0.15)' }]}>
              <Ionicons name="lock-closed" size={32} color="#ef4444" />
            </View>
            <Text style={[styles.modalTitle, { color: '#f87171' }]}>Staff Session Terminated</Text>
            <Text style={styles.modalDesc}>
              Your session was safely locked and logged out due to 15 minutes of inactivity. All master company data remains protected.
            </Text>
            <TouchableOpacity
              style={[styles.modalBtn, styles.modalBtnPrimary, { marginTop: 16 }]}
              onPress={closeAndGoToLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.modalBtnTextPrimary}>Return to Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingBadge: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 9999,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: RADIUS.pill,
    paddingVertical: 5,
    paddingHorizontal: 12,
    backdropFilter: 'blur(8px)',
  },
  floatingBadgeWarning: {
    borderColor: 'rgba(239, 68, 68, 0.7)',
    backgroundColor: 'rgba(30, 10, 10, 0.95)',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badgeText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  badgeTextWarning: {
    color: '#fca5a5',
    fontFamily: FONT.semiBold,
  },
  timeMono: {
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.5,
  },
  extendBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.sm,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginLeft: 4,
  },
  extendBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalBox: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    padding: 24,
    maxWidth: 440,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
  },
  warningIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
  },
  countdownBig: {
    fontSize: 36,
    fontFamily: FONT.extraBold,
    color: '#fbbf24',
    letterSpacing: 2,
    marginBottom: 12,
  },
  modalFootnote: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalBtnPrimary: {
    backgroundColor: '#10b981',
  },
  modalBtnSecondary: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalBtnTextPrimary: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  modalBtnTextSecondary: {
    fontSize: 13.5,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
  },
});

