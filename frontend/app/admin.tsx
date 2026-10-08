import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { SuperAdminDashboardView } from '@/components/dashboards/SuperAdminDashboardView';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';

export default function AdminWebPortalScreen() {
  const { user, login } = useAuth();
  const router = useRouter();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in as ADMIN or SUPER_ADMIN, show Executive Admin Center
  if (user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN')) {
    return <SuperAdminDashboardView />;
  }

  const handleAdminLogin = async (demoMobile?: string, demoPass?: string) => {
    const loginMobile = demoMobile || mobile;
    const loginPassword = demoPass || password;

    if (!loginMobile || !loginPassword) {
      setError('Please enter admin mobile number and password.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await login(loginMobile, loginPassword);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Invalid admin credentials. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginCard}>
        {/* Header */}
        <View style={styles.headerBox}>
          <View style={styles.logoBox}>
            <BrandLogo size={28} iconColor="#00ff87" />
          </View>
          <Text style={styles.title}>FarmsKing Admin Portal</Text>
          <Text style={styles.subtitle}>Executive Marketplace Command Center Login</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.label}>Admin Mobile Number</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="call-outline" size={18} color="#94a3b8" />
            <TextInput
              style={styles.input}
              placeholder="e.g. 9872066901"
              placeholderTextColor="#64748b"
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
            />
          </View>

          <Text style={styles.label}>Password</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
            <TextInput
              style={styles.input}
              placeholder="Enter password"
              placeholderTextColor="#64748b"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

          <TouchableOpacity
            style={styles.loginBtn}
            activeOpacity={0.85}
            disabled={isSubmitting}
            onPress={() => handleAdminLogin()}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#020d06" />
            ) : (
              <>
                <Ionicons name="shield-checkmark" size={18} color="#020d06" />
                <Text style={styles.loginBtnText}>Sign In to Admin Portal</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick One-Click Demo Admin Buttons */}
        <View style={styles.quickBox}>
          <Text style={styles.quickTitle}>⚡ Quick Admin Login Presets</Text>
          <View style={styles.presetRow}>
            <TouchableOpacity
              style={styles.presetBtnSuper}
              onPress={() => handleAdminLogin('9872066901', '12345678')}
            >
              <Ionicons name="key" size={14} color="#00ff87" />
              <Text style={styles.presetTextSuper}>👑 Super Admin (9872066901)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.presetBtnAdmin}
              onPress={() => handleAdminLogin('9999900009', 'admin123')}
            >
              <Ionicons name="shield" size={14} color="#38bdf8" />
              <Text style={styles.presetTextAdmin}>🛡️ Standard Admin (9999900009)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020d06',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  loginCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    gap: 16,
  },
  headerBox: { alignItems: 'center', gap: 6 },
  logoBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0,255,135,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.3)',
  },
  title: { fontSize: 20, fontFamily: FONT.extraBold, color: '#ffffff' },
  subtitle: { fontSize: 12, color: '#94a3b8', fontFamily: FONT.medium, textAlign: 'center' },
  form: { gap: 10, marginTop: 10 },
  label: { fontSize: 12, fontFamily: FONT.bold, color: '#cbd5e1' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#020d06',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.2)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  input: { flex: 1, color: '#ffffff', fontSize: 13.5, fontFamily: FONT.medium },
  errorText: { fontSize: 12, color: '#ef4444', fontFamily: FONT.bold },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#00ff87',
    paddingVertical: 13,
    borderRadius: RADIUS.md,
    marginTop: 8,
  },
  loginBtnText: { fontSize: 14, fontFamily: FONT.extraBold, color: '#020d06' },
  quickBox: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 14,
    gap: 8,
  },
  quickTitle: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b' },
  presetRow: { gap: 8 },
  presetBtnSuper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,255,135,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.3)',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  presetTextSuper: { fontSize: 12, fontFamily: FONT.bold, color: '#00ff87' },
  presetBtnAdmin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56,189,248,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56,189,248,0.3)',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  presetTextAdmin: { fontSize: 12, fontFamily: FONT.bold, color: '#38bdf8' },
});
