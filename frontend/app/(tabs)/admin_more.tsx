import { BrandLogo } from '@/src/components/BrandLogo';
import { useState, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Linking, ActivityIndicator, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useLanguage } from '@/src/store/language-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { TranslationKey, LANGUAGE_OPTIONS } from '@/src/constants/translations';
import { useAppSettings, useSupportContact, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import { Avatar } from '@/src/components/Avatar';
import { SuperAdminExpenseCategoriesModal } from '@/components/SuperAdminExpenseCategoriesModal';
import { useExecutiveTheme } from '@/src/store/theme-context';

const theme = RoleThemes.FARMER;

const getCleanMobile = (mobile?: string | null) => {
  if (!mobile || mobile.startsWith('G_')) return '';
  return mobile;
};

const SUPER_ADMIN_ITEMS: { key: TranslationKey | 'workspace' | 'agristoreHub'; label: string; icon: keyof typeof Ionicons.glyphMap; href?: string }[] = [
  { key: 'agristoreHub', label: '👑 National AgriStore Hub', icon: 'storefront-outline', href: '/agristore' },
  { key: 'workspace', label: '💼 Workspace (Backup & Tools)', icon: 'briefcase-outline' },
  { key: 'superSaleManagement', label: 'Sale / Order Management', icon: 'receipt-outline', href: '/(tabs)/super-orders' },
  { key: 'superAuditLog', label: 'Audit Log', icon: 'time-outline', href: '/(tabs)/super-audit-log' },
  { key: 'superEditCrop', label: 'Edit Crop by Crop ID', icon: 'leaf-outline', href: '/(tabs)/super-crop-edit' },
];

export default function AdminMoreScreen() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { colors } = useExecutiveTheme();
  const { data: appSettings } = useAppSettings();
  const brandLogoUri = appSettings?.logoUrl ?? null;
  const { t } = useLanguage();
  const router = useRouter();

  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showGuidesModal, setShowGuidesModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<'SUPPORT' | 'CONTACT' | null>(null);
  const [isGroupVoiceCallEnabled, setIsGroupVoiceCallEnabled] = useState(true);

  return (
    <>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#1e293b', '#0f172a']} style={styles.hero}>
          <View style={styles.avatarCircle}>
            {brandLogoUri ? (
              <Avatar uri={brandLogoUri} size={56} />
            ) : (
              <Ionicons name="shield-checkmark" size={28} color="#f59e0b" />
            )}
          </View>
          <Text style={styles.name}>{user?.name ?? 'Admin User'}</Text>
          <View style={styles.roleTag}>
            <Text style={styles.roleTagText}>👑 {user?.role ?? role ?? 'ADMIN'}</Text>
          </View>
          <View style={styles.kingIdBadge}>
            <Ionicons name="key-outline" size={11} color="#ffffff" />
            <Text style={styles.kingIdText}>
              KING ID: {user?.kingId ?? 'N/A'}{getCleanMobile(user?.mobile) ? ` · 📞 ${getCleanMobile(user?.mobile)}` : ''}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.body}>
          {/* 👑 Admin Control Center & Fast Tools */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👑 ADMIN CONTROL CENTER</Text>
            <View style={styles.sectionCard}>
              {SUPER_ADMIN_ITEMS.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.row, idx === SUPER_ADMIN_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (item.key === 'workspace') {
                      setShowWorkspaceModal(true);
                    } else if (item.href) {
                      router.push(item.href as any);
                    }
                  }}
                >
                  <View style={[styles.rowIconBg, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name={item.icon} size={18} color="#d97706" />
                  </View>
                  <Text style={[styles.rowLabel, { fontWeight: '700' }]}>
                    {item.key === 'workspace' ? item.label : t(item.key as TranslationKey, item.label)}
                  </Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 🛠️ C-PANEL & MANAGEMENT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ C-PANEL & MANAGEMENT</Text>
            <View style={styles.sectionCard}>
              {/* 🏷️ Expense Categories */}
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setShowCategoriesModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#fef2f2' }]}>
                  <Ionicons name="pricetags-outline" size={18} color="#dc2626" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>🏷️ Expense Categories</Text>
                  <Text style={styles.rowSubLabel}>Add, edit & deactivate expense categories</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              {/* 👑 Admin Info */}
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setShowAboutModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#eff6ff' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#2563eb" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>👑 Admin Info</Text>
                  <Text style={styles.rowSubLabel}>App Name, Brand Logo, Tagline, UPI & Admin Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              {/* 🎙️ Group Voice Call Toggle */}
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setIsGroupVoiceCallEnabled(v => !v)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="mic-outline" size={18} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>🎙️ Group Voice Call</Text>
                  <Text style={styles.rowSubLabel}>{isGroupVoiceCallEnabled ? 'STATUS: ACTIVE' : 'STATUS: DISABLED'}</Text>
                </View>
                <Ionicons
                  name={isGroupVoiceCallEnabled ? 'toggle' : 'toggle-outline'}
                  size={28}
                  color={isGroupVoiceCallEnabled ? '#10b981' : '#cbd5e1'}
                />
              </TouchableOpacity>

              {/* ⚙️ System Settings */}
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/super-settings' as any)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#f8fafc' }]}>
                  <Ionicons name="options-outline" size={18} color="#0d9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>⚙️ System Settings</Text>
                  <Text style={styles.rowSubLabel}>Full system & feature flag controls</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              {/* 💼 Workspace */}
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setShowWorkspaceModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#ccfbf1' }]}>
                  <Ionicons name="briefcase-outline" size={18} color="#0d9488" />
                </View>
                <Text style={styles.rowLabel}>💼 Workspace (Backup & Tools)</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              {/* 📖 User Guides */}
              <TouchableOpacity
                style={[styles.row, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => setShowGuidesModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="book-outline" size={18} color="#15803d" />
                </View>
                <Text style={styles.rowLabel}>📖 User Guides</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Developer & Support Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('devSupportSection')}</Text>
            <View style={styles.sectionCard}>
              {/* Privacy Policy Row */}
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => setShowPrivacyModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#16a34a" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>🛡️ Privacy Policy</Text>
                  <Text style={styles.rowSubLabel}>Data Protection & Google Play Policy</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              {/* Support Row */}
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setContactModalMode('SUPPORT')}>
                <View style={styles.rowIconBg}>
                  <Ionicons name="help-circle-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.rowLabel}>Support</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              {/* Contact Us Row */}
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => setContactModalMode('CONTACT')}>
                <View style={styles.rowIconBg}>
                  <Ionicons name="call-outline" size={18} color="#0284c7" />
                </View>
                <Text style={styles.rowLabel}>Contact Us</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={19} color="#dc2626" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SuperAdminExpenseCategoriesModal visible={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: {
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#f59e0b',
  },
  name: { fontSize: 20, fontFamily: FONT.bold, color: '#ffffff', marginBottom: 4 },
  roleTag: { backgroundColor: '#f59e0b', paddingHorizontal: 10, paddingVertical: 2, borderRadius: RADIUS.pill, marginBottom: 8 },
  roleTagText: { fontSize: 11, fontFamily: FONT.extraBold, color: '#ffffff' },
  kingIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  kingIdText: { fontSize: 11, fontFamily: FONT.medium, color: '#ffffff' },
  body: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b', marginBottom: 8, letterSpacing: 0.5 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', ...premiumShadow('#0f172a', 'xs') },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  rowIconBg: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  rowSubLabel: { fontSize: 11, fontFamily: FONT.regular, color: '#64748b', marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', padding: 14, borderRadius: 16, marginTop: 10, marginBottom: 30 },
  logoutText: { fontSize: 15, fontFamily: FONT.bold, color: '#dc2626' },
});
