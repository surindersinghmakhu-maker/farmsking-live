import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.FARMER;

const ACCOUNT_ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: string }[] = [
  { label: 'My Profile', icon: 'person-outline', href: '/profile' },
  { label: 'My Addresses', icon: 'location-outline', href: '/profile' },
  { label: 'Notifications', icon: 'notifications-outline' },
  { label: 'Language', icon: 'language-outline' },
];

const SHOP_ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap; href: string }[] = [
  { label: 'Browse Categories', icon: 'grid-outline', href: '/(tabs)/categories' },
  { label: 'My Cart', icon: 'cart-outline', href: '/(tabs)/cart' },
  { label: 'My Orders', icon: 'receipt-outline', href: '/(tabs)/orders' },
];

const SUPPORT_ITEMS: { label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { label: 'Help & Support', icon: 'help-circle-outline' },
  { label: 'About FarmsKing', icon: 'information-circle-outline' },
];

export default function MoreScreen() {
  const { user, logout } = useAuth();
  const { role } = useRole();
  const router = useRouter();

  // Every non-admin user is also a customer, so shopping stays reachable
  // from here — except for the Customer role itself, which already has
  // Categories/Cart/Orders as dedicated tabs.
  const showShopSection = role !== 'CUSTOMER' && role !== 'ADMIN';

  const sections = [
    { title: 'Account', items: ACCOUNT_ITEMS },
    ...(showShopSection ? [{ title: 'Shopping', items: SHOP_ITEMS }] : []),
    { title: 'Support', items: SUPPORT_ITEMS },
  ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={26} color="#fff" />
        </View>
        <Text style={styles.name}>{user?.name ?? 'FarmsKing User'}</Text>
        <Text style={styles.mobile}>{user?.mobile ?? ''}</Text>
      </LinearGradient>

      <View style={styles.body}>
        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.label}
                  style={[styles.row, idx === section.items.length - 1 && { borderBottomWidth: 0 }]}
                  activeOpacity={0.7}
                  onPress={() => 'href' in item && item.href && router.push(item.href as any)}
                >
                  <View style={styles.rowIconBg}>
                    <Ionicons name={item.icon} size={18} color={theme.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.logoutButton} activeOpacity={0.8} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={19} color="#dc2626" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

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
  logoutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#fef2f2', borderRadius: RADIUS.md, paddingVertical: 14,
    borderWidth: 1, borderColor: '#fecaca',
  },
  logoutText: { color: '#dc2626', fontFamily: FONT.bold, fontSize: 15 },
});
