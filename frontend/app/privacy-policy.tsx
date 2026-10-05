import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/store/auth-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { apiClient } from '@/src/api/client';

interface PolicyModule {
  id: string;
  titleEn: string;
  titlePa: string;
  purposeEn: string;
  purposePa: string;
  dataCollected: string[];
  isMandatory: boolean;
}

const FALLBACK_MODULES: PolicyModule[] = [
  {
    id: 'user_account_identity',
    titleEn: 'User Account & Identity Data',
    titlePa: 'ਯੂਜ਼ਰ ਅਕਾਊਂਟ ਅਤੇ ਪਛਾਣ ਡਾਟਾ',
    purposeEn: 'To create your unique FarmsKing ID (King ID), authenticate your account, process orders, and send agricultural advisory notifications.',
    purposePa: 'ਤੁਹਾਡੀ ਯੂਨੀਕ FarmsKing ID (King ID) ਬਣਾਉਣ, ਅਕਾਊਂਟ ਦੀ ਪ੍ਰਮਾਣਿਕਤਾ, ਆਰਡਰ ਪ੍ਰੋਸੈਸ ਕਰਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ਭੇਜਣ ਲਈ।',
    dataCollected: ['Full Name', 'Mobile Number', 'Email Address', 'Village/District/State', 'Pincode', 'Role Type (Farmer, Gardener, Advisor, Partner, Customer)'],
    isMandatory: true,
  },
  {
    id: 'gps_location_satellite',
    titleEn: 'Location & Satellite Monitoring Services',
    titlePa: 'ਲੋਕੇਸ਼ਨ ਅਤੇ ਸੈਟੇਲਾਈਟ ਖੇਤ ਨਿਗਰਾਨੀ ਸੇਵਾਵਾਂ',
    purposeEn: 'Used for precise field boundary mapping, satellite crop health index monitoring, weather forecasts, and real-time delivery tracking.',
    purposePa: 'ਖੇਤ ਦੀ ਸਹੀ ਨਿਸ਼ਾਨਦੇਹੀ, ਸੈਟੇਲਾਈਟ ਫਸਲ ਸਿਹਤ ਜਾਂਚ, ਮੌਸਮ ਜਾਣਕਾਰੀ ਅਤੇ ਡਿਲੀਵਰੀ ਟ੍ਰੈਕਿੰਗ ਲਈ।',
    dataCollected: ['Fine GPS Location', 'Coarse Location', 'Farm Geo-Polygon Coordinates'],
    isMandatory: false,
  },
  {
    id: 'voice_ai_microphone',
    titleEn: 'Microphone & Punjabi Voice AI Assistant',
    titlePa: 'ਮਾਈਕ੍ਰੋਫੋਨ ਅਤੇ ਪੰਜਾਬੀ Voice AI ਮਾਈਕ',
    purposeEn: 'Used exclusively when you tap the mic button to speak query in Punjabi/Hindi to our Agri Voice AI Assistant for crop advice.',
    purposePa: 'ਸਿਰਫ ਉਦੋਂ ਜਦੋਂ ਤੁਸੀਂ ਪੰਜਾਬੀ/ਹਿੰਦੀ ਵਿੱਚ ਖੇਤੀਬਾੜੀ ਸਲਾਹ ਲਈ Voice AI ਮਾਈਕ ਦਾ ਬਟਨ ਦਬਾਉਂਦੇ ਹੋ।',
    dataCollected: ['Audio Speech Streams (Processed in real-time, never stored permanently)'],
    isMandatory: false,
  },
  {
    id: 'camera_photo_media',
    titleEn: 'Camera & Gallery Access',
    titlePa: 'ਕੈਮਰਾ ਅਤੇ ਫੋਟੋ ਗੈਲਰੀ ਪਰਮਿਸ਼ਨ',
    purposeEn: 'Allows uploading profile pictures, scanning QR codes, and submitting crop disease photos for instant AI/Advisor diagnosis.',
    purposePa: 'ਪ੍ਰੋਫਾਈਲ ਫੋਟੋ ਲਗਾਉਣ, QR ਕੋਡ ਸਕੈਨ ਕਰਨ ਅਤੇ ਬੀਮਾਰ ਫਸਲ ਦੀ ਫੋਟੋ ਭੇਜ ਕੇ ਸਲਾਹ ਲੈਣ ਲਈ।',
    dataCollected: ['Selected Crop Photos', 'Profile Avatar Images', 'Receipt Scans'],
    isMandatory: false,
  },
  {
    id: 'mandi_expense_calculator',
    titleEn: 'Farm Expense & Mandi Accounting Tool',
    titlePa: 'ਖੇਤ ਖਰਚਾ ਅਤੇ ਮੰਡੀ ਹਿਸਾਬ-ਕਿਤਾਬ ਕੈਲਕੁਲੇਟਰ',
    purposeEn: 'Used as an accounting ledger for farmers to record crop yields, labor costs, and commission agent (Aarthi) interest calculations. This is strictly a record-keeping tool and DOES NOT act as a loan/lending service.',
    purposePa: 'ਕਿਸਾਨਾਂ ਲਈ ਫਸਲ ਦੀ ਪੈਦਾਵਾਰ, ਮਜ਼ਦੂਰੀ ਖਰਚਾ ਅਤੇ ਆੜ੍ਹਤੀਏ ਦੇ ਵਿਆਜ ਦਾ ਹਿਸਾਬ ਰੱਖਣ ਦਾ ਟੂਲ। ਇਹ ਸਿਰਫ ਨਿੱਜੀ ਰਿਕਾਰਡ ਲਈ ਹੈ, ਕੋਈ ਉਧਾਰ/ਲੋਨ ਸੇਵਾ ਨਹੀਂ ਹੈ।',
    dataCollected: ['Farmer Expense Entries', 'Crop Yield Quantities', 'Sale Bills Records'],
    isMandatory: false,
  },
  {
    id: 'coupon_rewards_royalty',
    titleEn: 'Advisor & Partner Reward Program',
    titlePa: 'ਸਲਾਹਕਾਰ ਅਤੇ ਬਿਜ਼ਨਸ ਪਾਰਟਨਰ ਕੂਪਨ ਪ੍ਰੋਗਰਾਮ',
    purposeEn: 'Calculates cashback, referral commissions, and coupon redemptions for authorized Agri Advisors and Business Partners.',
    purposePa: 'ਮਾਨਤਾ ਪ੍ਰਾਪਤ ਸਲਾਹਕਾਰਾਂ ਅਤੇ ਪਾਰਟਨਰਾਂ ਲਈ ਕੈਸ਼ਬੈਕ, ਰੈਫਰਲ ਅਤੇ ਕੂਪਨ ਡਿਸਕਾਊਂਟ ਦਾ ਹਿਸਾਬ ਕਰਨ ਲਈ।',
    dataCollected: ['Coupon Redemption History', 'Royalty Earnings Balance', 'UPI ID for Payouts'],
    isMandatory: false,
  },
  {
    id: 'data_deletion_rights',
    titleEn: 'User Control & Complete Account Deletion',
    titlePa: 'ਯੂਜ਼ਰ ਅਧਿਕਾਰ ਅਤੇ ਅਕਾਊਂਟ ਡਿਲੀਟ ਕਰਨ ਦੀ ਸੁਵਿਧਾ',
    purposeEn: 'In compliance with Google Play Store rules, users have the full right to delete their FarmsKing account and purge all personal data at any time via in-app Profile Settings or the Web Deletion Portal.',
    purposePa: 'ਗੂਗਲ ਪਲੇਅ ਸਟੋਰ ਨਿਯਮਾਂ ਅਨੁਸਾਰ ਯੂਜ਼ਰ ਐਪ ਦੇ ਅੰਦਰੋਂ ਜਾਂ ਵੈੱਬ ਪੋਰਟਲ ਰਾਹੀਂ ਆਪਣਾ ਅਕਾਊਂਟ ਅਤੇ ਸਾਰਾ ਡਾਟਾ ਪੂਰੀ ਤਰ੍ਹਾਂ ਡਿਲੀਟ ਕਰ ਸਕਦੇ ਹਨ।',
    dataCollected: ['Deletion Requests', 'Purge Timestamps'],
    isMandatory: true,
  },
];

export default function PrivacyPolicyScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [lang, setLang] = useState<'PA' | 'EN'>('PA');
  const [loading, setLoading] = useState(false);
  const [modules, setModules] = useState<PolicyModule[]>(FALLBACK_MODULES);
  const [lastUpdated, setLastUpdated] = useState<string>(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  useEffect(() => {
    const fetchPolicyData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/api/privacy-policy');
        if (res.data?.success && Array.isArray(res.data.modules)) {
          setModules(res.data.modules);
          if (res.data.lastUpdated) {
            setLastUpdated(new Date(res.data.lastUpdated).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }));
          }
        }
      } catch (e) {
        // Fallback to static modules if backend offline
      } finally {
        setLoading(false);
      }
    };
    fetchPolicyData();
  }, []);

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Invalid Confirmation', 'Please type DELETE in capital letters to confirm account deletion.');
      return;
    }
    setIsDeleting(true);
    try {
      await apiClient.delete('/users/me');
      setIsDeleteModalOpen(false);
      Alert.alert(
        'Account Deleted',
        'Your FarmsKing account and personal data have been unlinked and deleted. Thank you.',
        [
          {
            text: 'OK',
            onPress: () => logout(),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Could not delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <LinearGradient colors={['#064E3B', '#047857']} style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {lang === 'PA' ? 'ਪ੍ਰਾਈਵੇਸੀ ਅਤੇ ਡਾਟਾ ਸੁਰੱਖਿਆ' : 'Privacy & Data Protection'}
        </Text>

        {/* Language Toggle Button */}
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => {
            tap();
            setLang(l => (l === 'PA' ? 'EN' : 'PA'));
          }}
        >
          <Text style={styles.langText}>{lang === 'PA' ? '🇬🇧 English' : '🇮🇳 ਪੰਜਾਬੀ'}</Text>
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Play Store Compliance Header Card */}
        <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ecfdf5', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="shield-checkmark" size={22} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' }}>
                {lang === 'PA' ? '👑 ਫਾਰਮਜ਼ਕਿੰਗ ਡਾਟਾ ਸੁਰੱਖਿਆ ਨੀਤੀ' : '👑 FarmsKing Data Privacy Policy'}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#15803d' }}>
                Google Play Store Compliant • Last Sync: {lastUpdated}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 12.5, fontFamily: FONT.medium, color: '#475569', lineHeight: 18, marginTop: 4 }}>
            {lang === 'PA'
              ? 'ਫਾਰਮਜ਼ਕਿੰਗ ਕਿਸਾਨਾਂ, ਗਾਰਡਨਰਾਂ, ਗਾਹਕਾਂ, ਸਲਾਹਕਾਰਾਂ ਅਤੇ ਬਿਜ਼ਨਸ ਪਾਰਟਨਰਾਂ ਦੇ ਨਿੱਜੀ ਡਾਟਾ, ਲੋਕੇਸ਼ਨ ਅਤੇ ਖੇਤੀਬਾੜੀ ਰਿਕਾਰਡ ਦੀ ਪੂਰੀ ਸੁਰੱਖਿਆ ਕਰਨ ਲਈ ਵਚਨਬੱਧ ਹੈ।'
              : 'FarmsKing is committed to safeguarding the personal identity, GPS location, microphone audio, and agricultural ledger data of all our users.'}
          </Text>

          <View style={styles.autoSyncBadge}>
            <Ionicons name="sync-circle" size={18} color="#059669" />
            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#065f46', flex: 1 }}>
              {lang === 'PA'
                ? '🔄 ਆਟੋ-ਡਾਇਨਾਮਿਕ ਸਿਸਟਮ: ਜਦੋਂ ਵੀ ਐਪ ਵਿੱਚ ਨਵਾਂ ਫੀਚਰ ਆਉਂਦਾ ਹੈ, ਇਹ ਪ੍ਰਾਈਵੇਸੀ ਪਾਲਿਸੀ ਆਪਣੇ ਆਪ ਅਪਡੇਟ ਹੁੰਦੀ ਰਹਿੰਦੀ ਹੈ।'
                : '🔄 Auto-Dynamic System: Synchronized live with active platform modules to ensure continuous Google Play Store compliance.'}
            </Text>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color="#10b981" size="large" style={{ marginVertical: 20 }} />
        ) : (
          modules.map((m, idx) => (
            <View key={m.id || idx} style={[styles.card, styles.moduleCard]}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
                <View style={styles.numCircle}>
                  <Text style={{ color: '#FFF', fontSize: 12, fontFamily: FONT.extraBold }}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14.5, fontFamily: FONT.extraBold, color: '#0f172a' }}>
                    {lang === 'PA' ? m.titlePa : m.titleEn}
                  </Text>
                  <View style={[styles.reqBadge, { backgroundColor: m.isMandatory ? '#fef2f2' : '#f0fdf4', borderColor: m.isMandatory ? '#fca5a5' : '#bbf7d0' }]}>
                    <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: m.isMandatory ? '#991b1b' : '#166534' }}>
                      {m.isMandatory ? (lang === 'PA' ? 'ਜ਼ਰੂਰੀ ਅਕਾਊਂਟ ਨਿਯਮ' : 'Core Requirement') : (lang === 'PA' ? 'ਇੱਛੁਕ ਫੀਚਰ' : 'Optional Feature')}
                    </Text>
                  </View>
                </View>
              </View>

              <Text style={{ fontSize: 12.5, fontFamily: FONT.medium, color: '#334155', marginTop: 8, lineHeight: 18 }}>
                <Text style={{ fontFamily: FONT.bold, color: '#0f172a' }}>
                  {lang === 'PA' ? 'ਮਕਸਦ: ' : 'Purpose: '}
                </Text>
                {lang === 'PA' ? m.purposePa : m.purposeEn}
              </Text>

              <View style={styles.dataBox}>
                <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0369a1', marginBottom: 4 }}>
                  {lang === 'PA' ? '📌 ਇਕੱਠਾ ਕੀਤਾ ਜਾਂਦਾ ਡਾਟਾ:' : '📌 Data Items Collected:'}
                </Text>
                {m.dataCollected.map((item, i) => (
                  <Text key={i} style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#1e293b' }}>
                    • {item}
                  </Text>
                ))}
              </View>
            </View>
          ))
        )}

        {/* Play Store Account Deletion Requirement Card */}
        <View style={[styles.card, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Ionicons name="trash-bin-outline" size={20} color="#dc2626" />
            <Text style={{ fontSize: 14.5, fontFamily: FONT.extraBold, color: '#991b1b' }}>
              {lang === 'PA' ? '🗑️ ਅਕਾਊਂਟ ਡਿਲੀਟ ਕਰਨ ਦਾ ਅਧਿਕਾਰ' : '🗑️ Account Deletion Right'}
            </Text>
          </View>
          <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#7f1d1d', lineHeight: 17 }}>
            {lang === 'PA'
              ? 'ਗੂਗਲ ਪਲੇਅ ਸਟੋਰ ਦੀ ਨੀਤੀ ਅਨੁਸਾਰ ਤੁਸੀਂ ਕਿਸੇ ਵੀ ਸਮੇਂ ਆਪਣਾ ਅਕਾਊਂਟ ਅਤੇ ਸਾਰਾ ਡਾਟਾ ਡਿਲੀਟ ਕਰ ਸਕਦੇ ਹੋ।'
              : 'As per Google Play policies, you can request full account deletion and data purge at any time.'}
          </Text>

          <TouchableOpacity
            style={styles.deleteBtn}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setIsDeleteModalOpen(true);
            }}
          >
            <Ionicons name="trash-outline" size={16} color="#ffffff" />
            <Text style={{ color: '#FFF', fontSize: 13, fontFamily: FONT.bold }}>
              {lang === 'PA' ? 'ਅਕਾਊਂਟ ਡਿਲੀਟ ਕਰੋ (Delete Account)' : 'Delete Account Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Public Web Policy Link */}
        <TouchableOpacity
          style={styles.webLinkBtn}
          onPress={() => Linking.openURL('https://farmsking.in/privacy-policy')}
        >
          <Ionicons name="globe-outline" size={16} color="#0284c7" />
          <Text style={{ color: '#0284c7', fontSize: 12.5, fontFamily: FONT.bold }}>
            {lang === 'PA' ? '🌐 ਵੈੱਬਸਾਈਟ ਤੇ ਪ੍ਰਾਈਵੇਸੀ ਪਾਲਿਸੀ ਵੇਖੋ' : '🌐 View Web Privacy Policy Page'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal visible={isDeleteModalOpen} animationType="fade" transparent onRequestClose={() => setIsDeleteModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="warning" size={22} color="#dc2626" />
                <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#991b1b' }}>Delete Account</Text>
              </View>
              <TouchableOpacity onPress={() => setIsDeleteModalOpen(false)}>
                <Ionicons name="close" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12.5, fontFamily: FONT.medium, color: '#475569', marginBottom: 12 }}>
              Are you sure you want to delete your FarmsKing account ({user?.mobile || user?.name})? All your saved plots, crop advisories, and history will be permanently erased.
            </Text>

            <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a', marginBottom: 6 }}>
              Type <Text style={{ color: '#dc2626', fontFamily: FONT.extraBold }}>DELETE</Text> to confirm:
            </Text>
            <TextInput
              style={styles.confirmInput}
              value={deleteConfirmText}
              onChangeText={setDeleteConfirmText}
              placeholder="DELETE"
              placeholderTextColor="#cbd5e1"
              autoCapitalize="characters"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' }}
                onPress={() => setIsDeleteModalOpen(false)}
              >
                <Text style={{ color: '#475569', fontSize: 13, fontFamily: FONT.bold }}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ flex: 1, backgroundColor: '#dc2626', paddingVertical: 12, borderRadius: RADIUS.md, alignItems: 'center' }}
                onPress={handleDeleteAccount}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <Text style={{ color: '#FFF', fontSize: 13, fontFamily: FONT.bold }}>Delete Permanently</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    paddingTop: Platform.OS === 'ios' ? 50 : 36,
    paddingBottom: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#ffffff' },
  langToggle: { backgroundColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
  langText: { color: '#FFF', fontSize: 11.5, fontFamily: FONT.bold },
  scrollContent: { padding: 16, gap: 12, maxWidth: 540, alignSelf: 'center', width: '100%' },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  autoSyncBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ecfdf5', padding: 8, borderRadius: RADIUS.md, marginTop: 10, borderWidth: 1, borderColor: '#a7f3d0' },
  moduleCard: { gap: 4 },
  numCircle: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' },
  reqBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm, borderWidth: 1, marginTop: 4 },
  dataBox: { backgroundColor: '#f0f9ff', padding: 10, borderRadius: RADIUS.md, marginTop: 8, borderWidth: 1, borderColor: '#bae6fd' },
  deleteBtn: { backgroundColor: '#dc2626', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: RADIUS.md, marginTop: 10 },
  webLinkBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#f0f9ff', paddingVertical: 12, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#bae6fd', marginBottom: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', borderRadius: RADIUS.xl, padding: 20, width: '100%', maxWidth: 400 },
  confirmInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, fontFamily: FONT.bold, letterSpacing: 2, textAlign: 'center', color: '#0f172a' },
});
