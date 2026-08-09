import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.ADMIN;

const ORDERS = [
  { id: 'Order #1254', name: 'Aman Kumar', amount: '₹500', status: 'Delivered', bg: '#f1f5f9', color: '#334155' },
  { id: 'Order #1255', name: 'Rakesh Kumar', amount: '₹780', status: 'Processing', bg: '#ffedd5', color: '#c2410c' },
  { id: 'Order #1253', name: 'Sukhdeep Singh', amount: '₹1,240', status: 'In Transit', bg: '#dbeafe', color: '#1d4ed8' },
  { id: 'Order #1252', name: 'Harpreet Kaur', amount: '₹360', status: 'Delivered', bg: '#f1f5f9', color: '#334155' },
];

export default function AdminOrdersScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Orders</Text>
        <Text style={styles.heroSubtitle}>3,256 total orders</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {ORDERS.map((o) => (
          <View key={o.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.iconBg}>
              <Ionicons name="receipt-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.orderId}>{o.id}</Text>
              <Text style={styles.orderName}>{o.name}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.amount}>{o.amount}</Text>
              <View style={[styles.badge, { backgroundColor: o.bg }]}>
                <Text style={[styles.badgeText, { color: o.color }]}>{o.status}</Text>
              </View>
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
  orderId: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  orderName: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 10.5, fontFamily: FONT.bold },
});
