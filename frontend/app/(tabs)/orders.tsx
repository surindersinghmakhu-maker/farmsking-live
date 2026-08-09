import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.CUSTOMER;

const ORDERS = [
  { num: 'Order #ORD1234', desc: 'Marigold Seeds - 1kg', price: '₹450', status: 'In Transit', bg: '#dbeafe', color: '#1d4ed8' },
  { num: 'Order #ORD1235', desc: 'Organic Compost - 5kg', price: '₹350', status: 'Processing', bg: '#ffedd5', color: '#c2410c' },
  { num: 'Order #ORD1236', desc: 'Neem Oil - 1L', price: '₹280', status: 'Confirmed', bg: '#d1fae5', color: '#047857' },
  { num: 'Order #ORD1230', desc: 'DAP Fertilizer - 10kg', price: '₹620', status: 'Delivered', bg: '#f1f5f9', color: '#334155' },
];

export default function OrdersScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>My Orders</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {ORDERS.map((ord) => (
          <View key={ord.num} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.iconBg}>
              <Ionicons name="cube-outline" size={19} color={theme.primary} />
            </View>
            <View style={styles.info}>
              <Text style={styles.orderNum}>{ord.num}</Text>
              <Text style={styles.orderDesc}>{ord.desc}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.orderPrice}>{ord.price}</Text>
              <View style={[styles.statusBadge, { backgroundColor: ord.bg }]}>
                <Text style={[styles.statusText, { color: ord.color }]}>{ord.status}</Text>
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
  list: { padding: SPACING.xxl, gap: 12 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  orderNum: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  orderDesc: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  orderPrice: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  statusText: { fontSize: 10.5, fontFamily: FONT.bold },
});
