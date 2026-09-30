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
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { Avatar } from '@/src/components/Avatar';
import { SuperAdminExpenseCategoriesModal } from '@/components/SuperAdminExpenseCategoriesModal';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { SwitchDashboardSection } from '@/src/components/SwitchDashboardSection';

const getCleanMobile = (mobile?: string | null) => {
  if (!mobile || mobile.startsWith('G_')) return '';
  return mobile;
};

type AdminMenuItem = {
  key: string;
  label: string;
  subLabel?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  href?: string;
  isModal?: 'workspace' | 'categories' | 'about' | 'guides';
};

const PLATFORM_CONTROL_ITEMS: AdminMenuItem[] = [
  {
    key: 'agristoreHub',
    label: '👑 National AgriStore Hub',
    subLabel: 'National store management & direct catalog',
    icon: 'storefront-outline',
    iconBg: '#fef3c7',
    iconColor: '#d97706',
    href: '/agristore',
  },
  {
    key: 'superUsers',
    label: '👥 User & Role Management',
    subLabel: 'Manage all users, farmers, advisors & role assignments',
    icon: 'people-outline',
    iconBg: '#eef2ff',
    iconColor: '#4f46e5',
    href: '/(tabs)/super-users',
  },
  {
    key: 'superCoupons',
    label: '🎟️ Farmers & Coupon Engine',
    subLabel: 'Issue discount codes, vouchers & farmer schemes',
    icon: 'ticket-outline',
    iconBg: '#fdf4ff',
    iconColor: '#c026d3',
    href: '/(tabs)/super-coupons',
  },
  {
    key: 'superAccounts',
    label: '💰 Finance & Accounts Control',
    subLabel: 'Approve withdrawal requests & plan claims',
    icon: 'cash-outline',
    iconBg: '#f0fdf4',
    iconColor: '#16a34a',
    href: '/(tabs)/super-accounts',
  },
  {
    key: 'adminSellers',
    label: '🏪 Seller Verification & Approvals',
    subLabel: 'Approve new seller store registrations & Cashfree accounts',
    icon: 'shield-checkmark-outline',
    iconBg: '#fff7ed',
    iconColor: '#ea580c',
    href: '/admin-sellers',
  },
  {
    key: 'adminProducts',
    label: '📦 Product Catalog & Stock Approvals',
    subLabel: 'Review, approve & manage store product inventory',
    icon: 'cube-outline',
    iconBg: '#eff6ff',
    iconColor: '#2563eb',
    href: '/(tabs)/admin-products',
  },
  {
    key: 'adminOrders',
    label: '🧾 Admin Orders & Fulfillment',
    subLabel: 'Process customer orders & manage shipping status',
    icon: 'receipt-outline',
    iconBg: '#f5f3ff',
    iconColor: '#7c3aed',
    href: '/(tabs)/admin-orders',
  },
  {
    key: 'sellerPayouts',
    label: '💸 Seller Payouts & Commission',
    subLabel: 'Release seller balances & monitor transaction payouts',
    icon: 'wallet-outline',
    iconBg: '#ecfdf5',
    iconColor: '#059669',
    href: '/seller-payouts',
  },
  {
    key: 'superOrders',
    label: '📊 Sales Order Analytics',
    subLabel: 'View pan-India sales order logs & history',
    icon: 'bar-chart-outline',
    iconBg: '#f0f9ff',
    iconColor: '#0284c7',
    href: '/(tabs)/super-orders',
  },
  {
    key: 'superAuditLog',
    label: '🕒 System Audit Log',
    subLabel: 'Track administrative actions & security logs',
    icon: 'time-outline',
    iconBg: '#f8fafc',
    iconColor: '#475569',
    href: '/(tabs)/super-audit-log',
  },
  {
    key: 'superCropEdit',
    label: '🌱 Edit Crop & Disease Data',
    subLabel: 'Update crop master database & disease symptoms',
    icon: 'leaf-outline',
    iconBg: '#f0fdf4',
    iconColor: '#15803d',
    href: '/(tabs)/super-crop-edit',
  },
];

export default function AdminMoreScreen() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { data: appSettings } = useAppSettings();
  const brandLogoUri = appSettings?.logoUrl ?? null;
  const { t } = useLanguage();
  const router = useRouter();

  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
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
          {/* Switch Role / Dashboard */}
          <SwitchDashboardSection />

          {/* 👑 PLATFORM CONTROL CENTER */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👑 PLATFORM CONTROL CENTER (11 OPTIONS)</Text>
            <View style={styles.sectionCard}>
              {PLATFORM_CONTROL_ITEMS.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.row, idx === PLATFORM_CONTROL_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => item.href && router.push(item.href as any)}
                >
                  <View style={[styles.rowIconBg, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon} size={18} color={item.iconColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowLabel}>{item.label}</Text>
                    {item.subLabel ? <Text style={styles.rowSubLabel}>{item.subLabel}</Text> : null}
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* 🛠️ C-PANEL & SYSTEM MANAGEMENT */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🛠️ C-PANEL & CONFIGURATION (6 OPTIONS)</Text>
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
                  <Text style={styles.rowLabel}>🏷️ Expense Categories Manager</Text>
                  <Text style={styles.rowSubLabel}>Add, edit & deactivate farm expense categories</Text>
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
                  <Text style={styles.rowLabel}>🎙️ Group Voice Call Status</Text>
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
                  <Text style={styles.rowLabel}>⚙️ System Settings & Feature Flags</Text>
                  <Text style={styles.rowSubLabel}>Full system controls, feature toggles & API flags</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              {/* 💼 Workspace */}
              <TouchableOpacity
                style={[styles.row, { borderBottomWidth: 0 }]}
                activeOpacity={0.7}
                onPress={() => setShowWorkspaceModal(true)}
              >
                <View style={[styles.rowIconBg, { backgroundColor: '#ccfbf1' }]}>
                  <Ionicons name="briefcase-outline" size={18} color="#0d9488" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowLabel}>💼 Workspace (Backup & Tools)</Text>
                  <Text style={styles.rowSubLabel}>System data exports & developer diagnostics</Text>
                </View>
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
  rowIconBg: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  rowSubLabel: { fontSize: 11, fontFamily: FONT.regular, color: '#64748b', marginTop: 2 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fef2f2', padding: 14, borderRadius: 16, marginTop: 10, marginBottom: 30 },
  logoutText: { fontSize: 15, fontFamily: FONT.bold, color: '#dc2626' },
});
