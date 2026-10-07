import { BrandLogo } from '@/src/components/BrandLogo';
import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useLanguage } from '@/src/store/language-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { TranslationKey } from '@/src/constants/translations';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import { Avatar } from '@/src/components/Avatar';
import { SuperAdminExpenseCategoriesModal } from '@/components/SuperAdminExpenseCategoriesModal';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { SwitchDashboardSection } from '@/src/components/SwitchDashboardSection';
import { UserGuidesModal, SuperAdminWorkspaceModal, AdminInfoModal } from './more';

const getCleanMobile = (mobile?: string | null) => {
  if (!mobile || mobile.startsWith('G_')) return '';
  return mobile;
};

// Reorganized categories rendered directly in the body

export default function AdminMoreScreen() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { data: appSettings } = useAppSettings();
  const brandLogoUri = appSettings?.logoUrl ?? null;
  const { t } = useLanguage();
  const router = useRouter();

  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showGuidesModal, setShowGuidesModal] = useState(false);
  const updateSettings = useUpdateAppSettings();
  const isGroupVoiceCallEnabled = (appSettings as any)?.groupVoiceCallEnabled ?? true;

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
          {/* Switch Role / Dashboard */}
          <SwitchDashboardSection />

          {/* 📦 E-COMMERCE & MARKETPLACE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📦 E-COMMERCE & MARKETPLACE</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/agristore')}>
                <View style={[styles.rowIconBg, { backgroundColor: '#fef3c7' }]}><Ionicons name="storefront-outline" size={18} color="#d97706" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>👑 National E-Commerce Hub</Text><Text style={styles.rowSubLabel}>E-Commerce store overview & management dashboard</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/admin/(tabs)/admin-products' as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#eff6ff' }]}><Ionicons name="cube-outline" size={18} color="#2563eb" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>📦 Product Inventory & Catalog</Text><Text style={styles.rowSubLabel}>Manage platform products, stock levels & pricing</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/admin/(tabs)/admin-orders' as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#f5f3ff' }]}><Ionicons name="receipt-outline" size={18} color="#7c3aed" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>🧾 Order Processing & Fulfillment</Text><Text style={styles.rowSubLabel}>Process customer orders & update shipping status</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/admin-sellers')}>
                <View style={[styles.rowIconBg, { backgroundColor: '#fff7ed' }]}><Ionicons name="shield-checkmark-outline" size={18} color="#ea580c" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>🏪 Seller KYC & Approvals</Text><Text style={styles.rowSubLabel}>Approve new seller store registrations & verify KYC</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/seller-payouts')}>
                <View style={[styles.rowIconBg, { backgroundColor: '#ecfdf5' }]}><Ionicons name="wallet-outline" size={18} color="#059669" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>💸 Seller Payouts & Commission</Text><Text style={styles.rowSubLabel}>Release seller balances & monitor payout transactions</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => router.push('/admin/(tabs)/super-orders' as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#f0f9ff' }]}><Ionicons name="bar-chart-outline" size={18} color="#0284c7" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>📊 Sales Order Analytics</Text><Text style={styles.rowSubLabel}>View pan-India sales order logs & revenue history</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 👥 USERS & FARMER MANAGEMENT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 USERS & FARMER MANAGEMENT</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/admin/(tabs)/super-users' as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#eef2ff' }]}><Ionicons name="people-outline" size={18} color="#4f46e5" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>👥 User & Role Management</Text><Text style={styles.rowSubLabel}>Manage all users, farmers, advisors & role assignments</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/admin/(tabs)/super-crop-edit' as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#f0fdf4' }]}><Ionicons name="leaf-outline" size={18} color="#15803d" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>🌾 Edit Farmer Crop Data</Text><Text style={styles.rowSubLabel}>Look up farmer's live crop by ID and override field data</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => router.push('/admin/(tabs)/super-coupons' as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#fdf4ff' }]}><Ionicons name="ticket-outline" size={18} color="#c026d3" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>🎟️ VIP Pass & Coupon Manager</Text><Text style={styles.rowSubLabel}>Issue VIP passes, discount codes & farmer schemes</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* ⚙️ SYSTEM & MASTER DATA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚙️ SYSTEM & MASTER DATA</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setShowCategoriesModal(true)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#fef2f2' }]}><Ionicons name="pricetags-outline" size={18} color="#dc2626" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>🏷️ Expense Categories Manager</Text><Text style={styles.rowSubLabel}>Add, edit & deactivate farm expense categories</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => router.push('/admin/(tabs)/super-audit-log' as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#f8fafc' }]}><Ionicons name="time-outline" size={18} color="#475569" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>🕒 System Audit Log</Text><Text style={styles.rowSubLabel}>Track all administrative actions & security events</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* 🛠️ C-PANEL & CONFIGURATION */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ C-PANEL & CONFIGURATION (5 OPTIONS)</Text>
            <View style={styles.sectionCard}>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => router.push('/admin/(tabs)/super-settings' as any as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#f8fafc' }]}><Ionicons name="options-outline" size={18} color="#0d9488" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>⚙️ System Settings & Feature Flags</Text><Text style={styles.rowSubLabel}>Full system controls, feature toggles & API flags</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setShowAboutModal(true)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#eff6ff' }]}><Ionicons name="shield-checkmark-outline" size={18} color="#2563eb" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>👑 Admin Info & Branding Console</Text><Text style={styles.rowSubLabel}>App name, brand logo, tagline, payment UPI & profile</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => updateSettings.mutateAsync({ groupVoiceCallEnabled: !isGroupVoiceCallEnabled } as any)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#f0fdf4' }]}><Ionicons name="mic-outline" size={18} color="#059669" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>🎙️ Group Voice Call Status</Text><Text style={styles.rowSubLabel}>{isGroupVoiceCallEnabled ? 'STATUS: ACTIVE' : 'STATUS: DISABLED'}</Text></View>
                <Ionicons name={isGroupVoiceCallEnabled ? 'toggle' : 'toggle-outline'} size={28} color={isGroupVoiceCallEnabled ? '#10b981' : '#cbd5e1'} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setShowWorkspaceModal(true)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#ccfbf1' }]}><Ionicons name="briefcase-outline" size={18} color="#0d9488" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>💼 Workspace (Backup & Tools)</Text><Text style={styles.rowSubLabel}>System data exports & developer diagnostics</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => setShowGuidesModal(true)}>
                <View style={[styles.rowIconBg, { backgroundColor: '#f0fdf4' }]}><Ionicons name="book-outline" size={18} color="#15803d" /></View>
                <View style={{ flex: 1 }}><Text style={styles.rowLabel}>📖 Admin User Guides</Text><Text style={styles.rowSubLabel}>Guidelines, docs & platform manual</Text></View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Account Logout */}
          <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={() => logout()}>
            <Ionicons name="log-out-outline" size={19} color="#dc2626" />
            <Text style={styles.logoutText}>{t('logout')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <SuperAdminExpenseCategoriesModal visible={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} />
      <SuperAdminWorkspaceModal visible={showWorkspaceModal} onClose={() => setShowWorkspaceModal(false)} />
      <UserGuidesModal visible={showGuidesModal} onClose={() => setShowGuidesModal(false)} />
      <AdminInfoModal visible={showAboutModal} onClose={() => setShowAboutModal(false)} />
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
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 16, overflow: 'hidden', ...premiumShadow('#0f172a', 'sm') as any },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 12 },
  rowIconBg: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  rowSubLabel: { fontSize: 11, fontFamily: FONT.regular, color: '#64748b', marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', padding: 14, borderRadius: 16, marginTop: 10, marginBottom: 30 },
  logoutText: { fontSize: 15, fontFamily: FONT.bold, color: '#dc2626' },
});
