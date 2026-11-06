import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { verifyEmailApi } from '../src/api/auth.api';
import { useAuth } from '../src/store/auth-context';
import { FONT, RADIUS, SPACING } from '../constants/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const token = params.token;
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');

  useEffect(() => {
    let mounted = true;

    async function handleVerification() {
      if (!token) {
        setLoading(false);
        setSuccess(false);
        setMessage('No verification token provided. Please use the link sent to your email.');
        return;
      }

      try {
        const res = await verifyEmailApi(token);
        if (!mounted) return;
        if (res.success) {
          setSuccess(true);
          setMessage(res.message || 'Email verified successfully!');
          setVerifiedEmail(res.email || '');
          try {
            await refreshUser();
          } catch {}
        } else {
          setSuccess(false);
          setMessage(res.message || 'Verification link is invalid or has expired.');
        }
      } catch (err: any) {
        if (!mounted) return;
        setSuccess(false);
        setMessage(err?.response?.data?.message || err?.message || 'Verification failed. The link may have expired.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    handleVerification();
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false, title: 'Verify Email • FarmsKing' }} />
      <View style={styles.card}>
        {/* Brand Header */}
        <View style={styles.brandRow}>
          <View style={styles.brandBadge}>
            <Text style={styles.brandBadgeText}>FARMSKING VERIFICATION</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.statusBox}>
            <ActivityIndicator size="large" color="#16a34a" />
            <Text style={styles.statusTitle}>Verifying Your Email</Text>
            <Text style={styles.statusSubtitle}>Please wait while we confirm your email credentials...</Text>
          </View>
        ) : success ? (
          <View style={styles.statusBox}>
            <View style={styles.iconCircleSuccess}>
              <Ionicons name="checkmark-circle" size={48} color="#16a34a" />
            </View>
            <Text style={styles.statusTitleSuccess}>Email Verified!</Text>
            <Text style={styles.statusSubtitle}>
              {message}
            </Text>
            {verifiedEmail ? (
              <View style={styles.emailPill}>
                <Ionicons name="mail" size={15} color="#15803d" />
                <Text style={styles.emailPillText}>{verifiedEmail}</Text>
                <View style={styles.activeTag}>
                  <Text style={styles.activeTagText}>ACTIVE</Text>
                </View>
              </View>
            ) : null}
            <TouchableOpacity
              style={styles.actionBtnSuccess}
              onPress={() => router.replace('/profile')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnText}>Return to Profile</Text>
              <Ionicons name="arrow-forward" size={16} color="#ffffff" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.statusBox}>
            <View style={styles.iconCircleError}>
              <Ionicons name="alert-circle" size={48} color="#dc2626" />
            </View>
            <Text style={styles.statusTitleError}>Verification Failed</Text>
            <Text style={styles.statusSubtitle}>
              {message}
            </Text>
            <TouchableOpacity
              style={styles.actionBtnNeutral}
              onPress={() => router.replace('/profile')}
              activeOpacity={0.85}
            >
              <Text style={styles.actionBtnNeutralText}>Go to Profile & Resend</Text>
              <Ionicons name="arrow-forward" size={16} color="#0f172a" />
            </TouchableOpacity>
          </View>
        )}

        {/* Statutory footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>FARMSKING TECHNOLOGIES PRIVATE LIMITED</Text>
          <Text style={styles.footerSubText}>CIN: U01100PB2026PTC063294 • ISO 27001 Certified Security</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090e17',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  brandRow: {
    marginBottom: 20,
    alignItems: 'center',
  },
  brandBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    borderColor: 'rgba(34, 197, 94, 0.3)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  brandBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#4ade80',
    letterSpacing: 1.2,
  },
  statusBox: {
    alignItems: 'center',
    width: '100%',
    paddingVertical: 10,
  },
  iconCircleSuccess: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  iconCircleError: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(220, 38, 38, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusTitle: {
    fontSize: 19,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusTitleSuccess: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#4ade80',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusTitleError: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#f87171',
    marginBottom: 6,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  emailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.pill,
    marginBottom: 20,
  },
  emailPillText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  activeTag: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  activeTagText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  actionBtnSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    width: '100%',
    maxWidth: 280,
    marginTop: 8,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  actionBtnNeutral: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: RADIUS.md,
    width: '100%',
    maxWidth: 280,
    marginTop: 8,
  },
  actionBtnNeutralText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    width: '100%',
  },
  footerText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  footerSubText: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 3,
  },
});
