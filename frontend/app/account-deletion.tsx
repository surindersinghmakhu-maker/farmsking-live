import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import PublicHeader from '@/components/PublicHeader';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { apiClient } from '@/src/api/client';
import { useAuth } from '@/src/store/auth-context';
import { DeleteAccountModal } from '@/src/components/DeleteAccountModal';

export default function AccountDeletionScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const [themeMode, setThemeMode] = useState<'day' | 'night'>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('farmsking_theme_mode');
      if (saved === 'night' || saved === 'day') return saved;
    }
    return 'day';
  });

  const [mobile, setMobile] = useState(user?.mobile?.startsWith('G_') ? '' : user?.mobile || '');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeletedPermanently, setIsDeletedPermanently] = useState(false);

  const isDay = themeMode === 'day';

  const toggleTheme = (mode: 'day' | 'night') => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('farmsking_theme_mode', mode);
    }
  };

  const handleSubmit = async () => {
    setStatusMessage(null);

    if (user) {
      setShowDeleteModal(true);
      return;
    }

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setStatusMessage({ type: 'error', text: 'Please enter your valid 10-digit registered mobile number.' });
      return;
    }
    if (!password.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Please enter your account password (or sign in via OTP first under Account -> Privacy -> Delete Account).',
      });
      return;
    }

    try {
      setLoading(true);
      const { data } = await apiClient.post('/api/request-account-deletion', {
        mobile: cleanMobile,
        password: password.trim(),
        reason: reason.trim() || undefined,
      });
      setIsDeletedPermanently(true);
      setStatusMessage({
        type: 'success',
        text: data?.message || 'Your FarmsKing ID and account have been permanently deleted.',
      });
      setPassword('');
      setReason('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not process request. Please verify details or call 95776-22000.';
      if (Platform.OS !== 'web') {
        Alert.alert('Request Notice', msg);
      }
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      <Stack.Screen options={{ headerShown: false, title: 'FarmsKing - Smart Farming' }} />
      <PublicHeader themeMode={themeMode} onThemeToggle={toggleTheme} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isMobile && { paddingHorizontal: 14, paddingTop: 14 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={15} color={isDay ? '#059669' : '#34d399'} />
            <Text style={[styles.backText, isDay ? styles.backTextDay : styles.backTextNight]}>
              Back to FarmsKing
            </Text>
          </TouchableOpacity>

          <View style={[styles.card, isDay ? styles.cardDay : styles.cardNight, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.headerRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="trash-outline" size={22} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, isDay ? styles.titleDay : styles.titleNight]}>
                  Account &amp; Data Deletion Portal
                </Text>
                <Text style={[styles.subtitle, isDay ? styles.subtitleDay : styles.subtitleNight]}>
                  FARMSKING TECHNOLOGIES PRIVATE LIMITED • Google Play &amp; DPDPA 2023 Compliant
                </Text>
              </View>
            </View>

            {isDeletedPermanently ? (
              <View style={{ alignItems: 'center', paddingVertical: 14, gap: 14 }}>
                <View style={[styles.iconCircle, { backgroundColor: '#fee2e2', width: 64, height: 64, borderRadius: 32, marginBottom: 8 }]}>
                  <Ionicons name="checkmark-done-circle" size={38} color="#dc2626" />
                </View>
                <Text style={[styles.title, { color: '#991b1b', fontSize: 22, textAlign: 'center' }]}>
                  ID Permanently Deleted
                </Text>
                <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: isDay ? '#1e293b' : '#f1f5f9', textAlign: 'center' }}>
                  Your FarmsKing ID and account have been permanently deleted.
                </Text>
                <View style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', borderWidth: 1, borderRadius: RADIUS.md, padding: 14, width: '100%' }}>
                  <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#991b1b', marginBottom: 4 }}>
                    Mobile Number Unlinked &amp; Data Protected
                  </Text>
                  <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: '#64748b', lineHeight: 18 }}>
                    Your mobile number has been successfully unlinked and freed. In accordance with statutory audit regulations, your historical records (orders, bills, ledger entries) remain safely archived.
                  </Text>
                </View>
                <TouchableOpacity
                  style={{ backgroundColor: '#dc2626', borderRadius: RADIUS.md, paddingVertical: 14, paddingHorizontal: 24, marginTop: 12, width: '100%', alignItems: 'center' }}
                  onPress={() => router.replace('/')}
                >
                  <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 15 }}>Back to FarmsKing Home</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.warningBox}>
                  <Ionicons name="warning-outline" size={18} color="#b91c1c" />
                  <Text style={styles.warningText}>
                    Deleting your account permanently unlinks your FarmsKing King ID, saved farm plots, crop history, and profile credentials. Financial tax records required by statutory law are retained securely in anonymized ledger form.
                  </Text>
                </View>

                {user ? (
                  <View style={{ gap: 12 }}>
                    <Text style={[styles.label, isDay ? styles.labelDay : styles.labelNight]}>
                      Signed in as: {user.name || 'Member'} ({user.mobile})
                    </Text>
                    <Text style={{ fontSize: 13, fontFamily: FONT.regular, color: isDay ? '#475569' : '#94a3b8', lineHeight: 19 }}>
                      As an active member, account deletion requires a one-time SMS / WhatsApp OTP verification to ensure security before permanently unlinking your ID.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    <View>
                      <Text style={[styles.label, isDay ? styles.labelDay : styles.labelNight]}>
                        Registered Mobile Number (10 Digits) *
                      </Text>
                      <TextInput
                        style={[styles.input, isDay ? styles.inputDay : styles.inputNight]}
                        value={mobile}
                        onChangeText={setMobile}
                        placeholder="Enter 10-digit mobile number"
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        maxLength={10}
                      />
                    </View>

                    <View>
                      <Text style={[styles.label, isDay ? styles.labelDay : styles.labelNight]}>
                        Account Password *
                      </Text>
                      <TextInput
                        style={[styles.input, isDay ? styles.inputDay : styles.inputNight]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder="Enter account password"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry
                      />
                    </View>

                    <View>
                      <Text style={[styles.label, isDay ? styles.labelDay : styles.labelNight]}>
                        Reason (Optional)
                      </Text>
                      <TextInput
                        style={[styles.input, styles.inputDay, !isDay && styles.inputNight, { minHeight: 72, textAlignVertical: 'top' }]}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Optional feedback or reason"
                        placeholderTextColor="#94a3b8"
                        multiline
                      />
                    </View>
                  </View>
                )}

                {statusMessage ? (
                  <View
                    style={[
                      styles.statusBox,
                      statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: statusMessage.type === 'success' ? '#065f46' : '#991b1b' },
                      ]}
                    >
                      {statusMessage.text}
                    </Text>
                  </View>
                ) : null}

                <TouchableOpacity
                  style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={['#dc2626', '#b91c1c']}
                    style={styles.submitGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="trash" size={16} color="#ffffff" />
                        <Text style={styles.submitBtnText}>
                          {user ? 'Verify via OTP & Delete Account' : 'Confirm Account Deletion'}
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <View style={styles.footerRow}>
                  <TouchableOpacity onPress={() => router.push('/(auth)/login' as any)} activeOpacity={0.75}>
                    <Text style={styles.linkText}>OTP Account? Sign in first →</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/privacy-policy' as any)} activeOpacity={0.75}>
                    <Text style={styles.linkText}>View Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* In-app OTP verified deletion modal */}
      <DeleteAccountModal
        visible={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootDay: { backgroundColor: '#f8fafc' },
  rootNight: { backgroundColor: '#070c18' },
  scrollContent: { padding: 24, paddingBottom: 90, alignItems: 'center' },
  container: { width: '100%', maxWidth: 560 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14 },
  backText: { fontSize: 13, fontFamily: FONT.bold },
  backTextDay: { color: '#059669' },
  backTextNight: { color: '#34d399' },
  card: { borderRadius: RADIUS.xl, padding: 22, borderWidth: 1, gap: 14 },
  cardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  cardNight: { backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 19, fontFamily: FONT.extraBold },
  titleDay: { color: '#0f172a' },
  titleNight: { color: '#f8fafc' },
  subtitle: { fontSize: 11.5, fontFamily: FONT.semiBold, marginTop: 2 },
  subtitleDay: { color: '#64748b' },
  subtitleNight: { color: '#94a3b8' },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: RADIUS.md,
    padding: 12,
  },
  warningText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#991b1b', lineHeight: 18 },
  label: { fontSize: 12.5, fontFamily: FONT.bold, marginBottom: 6 },
  labelDay: { color: '#334155' },
  labelNight: { color: '#cbd5e1' },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  inputDay: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: '#0f172a' },
  inputNight: { backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' },
  statusBox: { borderRadius: RADIUS.md, padding: 12, borderWidth: 1 },
  statusSuccess: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  statusError: { backgroundColor: '#fef2f2', borderColor: '#fecaca' },
  statusText: { fontSize: 12.5, fontFamily: FONT.bold },
  submitBtn: { borderRadius: RADIUS.lg, overflow: 'hidden', marginTop: 4 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14 },
  submitBtnText: { color: '#ffffff', fontSize: 14, fontFamily: FONT.extraBold },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, paddingTop: 6 },
  linkText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0284c7' },
});

