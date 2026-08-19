import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useLanguage } from '@/src/store/language-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { ServerConfigModal } from '@/components/ServerConfigModal';
import { LanguagePickerModal } from '@/src/components/LanguagePickerModal';
import { SwitchDashboardSection } from '@/src/components/SwitchDashboardSection';
import { TranslationKey, LANGUAGE_OPTIONS } from '@/src/constants/translations';
import { useAppSettings, useSupportContact } from '@/src/hooks/useAppSettings';
import { Avatar } from '@/src/components/Avatar';

const theme = RoleThemes.FARMER;

type AccountItem = { key: TranslationKey; label: string; icon: keyof typeof Ionicons.glyphMap; href?: string };

const BASE_ACCOUNT_ITEMS: AccountItem[] = [
  { key: 'myProfile', label: 'My Profile', icon: 'person-outline', href: '/profile' },
  { key: 'myAddresses', label: 'My Addresses', icon: 'location-outline', href: '/profile' },
  { key: 'notifications', label: 'Notifications', icon: 'notifications-outline', href: '/profile' },
];

const FARMER_ONLY_ITEM: AccountItem = { key: 'editFarmProfile', label: 'Mandatory Farmer Profile', icon: 'clipboard-outline', href: '/farmer-profile-setup' };
const ADVISOR_PROFILE_ITEM: AccountItem = { key: 'advisorProfile', label: 'Advisor Profile', icon: 'briefcase-outline', href: '/advisor-profile' };

const ADVISOR_BUSINESS_ITEMS: { key: TranslationKey; label: string; icon: keyof typeof Ionicons.glyphMap; href?: string }[] = [
  { key: 'tabMyBusiness', label: 'My Business', icon: 'wallet-outline', href: '/(tabs)/wallet' },
];

const SHOP_ITEMS: { key: TranslationKey; label: string; icon: keyof typeof Ionicons.glyphMap; href?: string }[] = [
  { key: 'browseCategories', label: 'Browse Categories', icon: 'grid-outline', href: '/(tabs)/categories' },
  { key: 'myCart', label: 'My Cart', icon: 'cart-outline', href: '/(tabs)/cart' },
  { key: 'myOrders', label: 'My Orders', icon: 'receipt-outline', href: '/(tabs)/orders' },
];

const SUPER_ADMIN_ITEMS: { key: TranslationKey; label: string; icon: keyof typeof Ionicons.glyphMap; href?: string }[] = [
  { key: 'superSaleManagement', label: 'Sale / Order Management', icon: 'receipt-outline', href: '/(tabs)/super-orders' },
  { key: 'superAuditLog', label: 'Audit Log', icon: 'time-outline', href: '/(tabs)/super-audit-log' },
  { key: 'superEditCrop', label: 'Edit Crop by Crop ID', icon: 'leaf-outline', href: '/(tabs)/super-crop-edit' },
  { key: 'tabSettings', label: 'Settings', icon: 'settings-outline', href: '/(tabs)/super-settings' },
];

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const { data: appSettings } = useAppSettings();
  const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN';
  const brandLogoUri = appSettings?.logoUrl ?? null;
  const { language, t } = useLanguage();
  const router = useRouter();
  const [showServerModal, setShowServerModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [contactModalMode, setContactModalMode] = useState<'SUPPORT' | 'CONTACT' | null>(null);
  const currentLanguageName = LANGUAGE_OPTIONS.find((opt) => opt.code === language)?.nativeName ?? 'English';

  const showShopSection = role !== 'CUSTOMER' && role !== 'ADMIN' && role !== 'SUPER_ADMIN';
  const showSuperAdminSection = role === 'SUPER_ADMIN';
  const showAdvisorBusinessSection = role === 'FARM_ADVISOR' || role === 'GARDEN_ADVISOR';

  const accountItems: AccountItem[] =
    role === 'ADMIN'
      ? BASE_ACCOUNT_ITEMS.filter((item) => item.href !== '/profile')
      : role === 'FARM_ADVISOR' || role === 'GARDEN_ADVISOR'
        ? [...BASE_ACCOUNT_ITEMS, ADVISOR_PROFILE_ITEM]
        : role === 'FARMER' || role === 'GARDENER'
          ? [...BASE_ACCOUNT_ITEMS, FARMER_ONLY_ITEM]
          : BASE_ACCOUNT_ITEMS;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <View style={styles.avatarCircle}>
          {isAdminRole && brandLogoUri ? (
            <Avatar uri={brandLogoUri} size={60} />
          ) : user?.photoUrl ? (
            <Avatar uri={user.photoUrl} size={60} />
          ) : (
            <Ionicons name="person" size={26} color="#fff" />
          )}
        </View>
        <Text style={styles.name}>{user?.name ?? t('farmsKingUser')}</Text>
        <Text style={styles.mobile}>{user?.mobile ?? ''}</Text>
        {user?.kingId ? (
          <View style={styles.kingIdBadge}>
            <Ionicons name="key-outline" size={11} color="#ffffff" />
            <Text style={styles.kingIdText}>{user.kingId}</Text>
          </View>
        ) : null}
      </LinearGradient>

      <View style={styles.body}>
        <SwitchDashboardSection
          extraRows={
            showAdvisorBusinessSection
              ? ADVISOR_BUSINESS_ITEMS.map((item) => ({
                  key: item.key,
                  label: t(item.key, item.label),
                  icon: item.icon,
                  onPress: () => item.href && router.push(item.href as any),
                }))
              : undefined
          }
        />

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('accountSection')}</Text>
          <View style={styles.sectionCard}>
            {accountItems.map((item, idx) => (
              <TouchableOpacity
                key={item.key}
                style={styles.row}
                activeOpacity={0.7}
                onPress={() => item.href && router.push(item.href as any)}
              >
                <View style={styles.rowIconBg}>
                  <Ionicons name={item.icon} size={18} color={theme.primary} />
                </View>
                <Text style={styles.rowLabel}>{t(item.key, item.label)}</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            ))}

            {/* Language Row — opens a picker modal since the app now supports 7 languages */}
            <TouchableOpacity
              style={[styles.row, { borderBottomWidth: 0 }]}
              activeOpacity={0.7}
              onPress={() => setShowLanguageModal(true)}
            >
              <View style={[styles.rowIconBg, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="language-outline" size={18} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{t('languageSwitchLabel')}</Text>
                <Text style={styles.rowSubLabel}>{t('languageSwitchSub')}</Text>
              </View>
              <View style={styles.switchBadgeContainer}>
                <Text style={styles.langBadgeTextActive}>{currentLanguageName}</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Super Admin Tools Section */}
        {showSuperAdminSection ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('superAdminSection')}</Text>
            <View style={styles.sectionCard}>
              {SUPER_ADMIN_ITEMS.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.row, idx === SUPER_ADMIN_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => item.href && router.push(item.href as any)}
                >
                  <View style={styles.rowIconBg}>
                    <Ionicons name={item.icon} size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{t(item.key, item.label)}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Shopping Section */}
        {showShopSection ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('shoppingSection')}</Text>
            <View style={styles.sectionCard}>
              {SHOP_ITEMS.map((item, idx) => (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.row, idx === SHOP_ITEMS.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => item.href && router.push(item.href as any)}
                >
                  <View style={styles.rowIconBg}>
                    <Ionicons name={item.icon} size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{t(item.key, item.label)}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : null}

        {/* Developer & Support Section */}
        {role !== 'SUPER_ADMIN' ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('devSupportSection')}</Text>
            <View style={styles.sectionCard}>
              {__DEV__ ? (
                <TouchableOpacity
                  style={styles.row}
                  activeOpacity={0.7}
                  onPress={() => setShowServerModal(true)}
                >
                  <View style={[styles.rowIconBg, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="hardware-chip-outline" size={18} color="#16a34a" />
                  </View>
                  <Text style={styles.rowLabel}>{t('serverIpConfig')}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ) : null}

              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => setContactModalMode('SUPPORT')}>
                <View style={styles.rowIconBg}>
                  <Ionicons name="help-circle-outline" size={18} color={theme.primary} />
                </View>
                <Text style={styles.rowLabel}>Support</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.row, { borderBottomWidth: 0 }]} activeOpacity={0.7} onPress={() => setContactModalMode('CONTACT')}>
                <View style={styles.rowIconBg}>
                  <Ionicons name="call-outline" size={18} color={theme.primary} />
                </View>
                <Text style={styles.rowLabel}>Contact Us</Text>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={19} color="#dc2626" />
          <Text style={styles.logoutText}>{t('logout')}</Text>
        </TouchableOpacity>
      </View>

      <ServerConfigModal
        visible={showServerModal}
        onClose={() => setShowServerModal(false)}
      />

      <LanguagePickerModal visible={showLanguageModal} onClose={() => setShowLanguageModal(false)} />

      <ContactModal mode={contactModalMode} onClose={() => setContactModalMode(null)} />
    </ScrollView>
  );
}

function ContactModal({ mode, onClose }: { mode: 'SUPPORT' | 'CONTACT' | null; onClose: () => void }) {
  const { data: contact, isLoading } = useSupportContact();

  return (
    <Modal visible={mode !== null} transparent animationType="fade" onRequestClose={onClose}>
      <View style={contactStyles.overlay}>
        <View style={contactStyles.card}>
          <View style={contactStyles.header}>
            <Text style={contactStyles.title}>{mode === 'SUPPORT' ? 'Support' : 'Contact Us'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
          ) : !contact ? (
            <Text style={contactStyles.emptyText}>Contact details are not available right now.</Text>
          ) : (
            <>
              <Text style={contactStyles.subText}>
                {mode === 'SUPPORT'
                  ? 'Need help? Reach out to our support team directly.'
                  : "Here's how you can reach us."}
              </Text>
              <Text style={contactStyles.name}>{contact.name}</Text>

              <TouchableOpacity
                style={contactStyles.row}
                activeOpacity={0.7}
                onPress={() => Linking.openURL(`tel:${contact.mobile}`)}
              >
                <View style={contactStyles.rowIconBg}>
                  <Ionicons name="call" size={16} color="#16a34a" />
                </View>
                <Text style={contactStyles.rowText}>{contact.mobile}</Text>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
              </TouchableOpacity>

              {contact.email ? (
                <TouchableOpacity
                  style={contactStyles.row}
                  activeOpacity={0.7}
                  onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                >
                  <View style={contactStyles.rowIconBg}>
                    <Ionicons name="mail" size={16} color="#16a34a" />
                  </View>
                  <Text style={contactStyles.rowText}>{contact.email}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const contactStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 400, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  subText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b', marginBottom: 10 },
  name: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a', marginBottom: 10 },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8', marginVertical: 20, textAlign: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  rowIconBg: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, fontSize: 13, fontFamily: FONT.semiBold, color: '#0f172a' },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 28, paddingBottom: 28, alignItems: 'center' },
  avatarCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  name: { color: '#fff', fontSize: 19, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  mobile: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: FONT.medium, marginTop: 2 },
  kingIdBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(255,255,255,0.16)', borderRadius: RADIUS.pill,
    paddingHorizontal: 10, paddingVertical: 4, marginTop: 8,
  },
  kingIdText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 0.3 },
  body: { padding: SPACING.xxl, paddingBottom: 40 },
  section: { marginBottom: SPACING.xl },
  sectionTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 10 },
  sectionCard: {
    backgroundColor: '#ffffff', borderRadius: RADIUS.lg, ...premiumShadow('#0f172a', 'sm'),
  },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: SPACING.lg,
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9',
  },
  rowIconBg: {
    width: 36, height: 36, borderRadius: 12, backgroundColor: theme.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  rowLabel: { flex: 1, fontSize: 14.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  rowSubLabel: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  switchBadgeContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  langBadgeTextActive: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a' },
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: RADIUS.md, paddingVertical: 14,
    borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { color: '#dc2626', fontFamily: FONT.bold, fontSize: 15 },
});
