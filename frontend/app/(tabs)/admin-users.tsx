import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.ADMIN;

const ROLE_COLOR: Record<string, { bg: string; color: string }> = {
  Customer: { bg: '#dbeafe', color: '#1d4ed8' },
  Farmer: { bg: '#dcfce7', color: '#166534' },
  Advisor: { bg: '#ffedd5', color: '#c2410c' },
  Partner: { bg: '#f3e8ff', color: '#6d28d9' },
};

const USERS = [
  { name: 'Aman Kumar', role: 'Customer', mobile: '9876543210' },
  { name: 'Kisan Veer', role: 'Farmer', mobile: '9876543211' },
  { name: 'Gurpreet Singh', role: 'Farmer', mobile: '9876543212' },
  { name: 'Dr. Amar Singh', role: 'Advisor', mobile: '9876543213' },
  { name: 'Surinder Pal', role: 'Partner', mobile: '9876543214' },
];

export default function AdminUsersScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Users</Text>
        <Text style={styles.heroSubtitle}>2,568 total users</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {USERS.map((u) => (
          <View key={u.name} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.iconBg}>
              <Ionicons name="person-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{u.name}</Text>
              <Text style={styles.mobile}>{u.mobile}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: ROLE_COLOR[u.role].bg }]}>
              <Text style={[styles.badgeText, { color: ROLE_COLOR[u.role].color }]}>{u.role}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  heroSubtitle: { fontSize: 12.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  list: { padding: SPACING.xxl, gap: 10 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  name: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  mobile: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 10.5, fontFamily: FONT.bold },
});
