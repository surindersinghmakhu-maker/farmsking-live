import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.CUSTOMER;

interface CartLine {
  id: string;
  name: string;
  variant: string;
  price: number;
  qty: number;
  icon: keyof typeof Ionicons.glyphMap;
}

const INITIAL_ITEMS: CartLine[] = [
  { id: '1', name: 'Bio Organic Fertilizer', variant: '1 Litre', price: 450, qty: 1, icon: 'flask-outline' },
  { id: '2', name: 'Neem Oil', variant: '500ml', price: 220, qty: 1, icon: 'leaf-outline' },
  { id: '3', name: 'Vermi Compost', variant: '5kg', price: 280, qty: 1, icon: 'nutrition-outline' },
];

export default function CartScreen() {
  const [items, setItems] = useState(INITIAL_ITEMS);

  const updateQty = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it)),
    );
  };
  const removeItem = (id: string) => setItems((prev) => prev.filter((it) => it.id !== id));

  const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>My Cart ({items.length})</Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cart-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Your cart is empty</Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} style={[styles.itemCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.itemIconBg}>
                <Ionicons name={item.icon} size={20} color={theme.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemVariant}>{item.variant}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => removeItem(item.id)} style={styles.removeBtn}>
                  <Ionicons name="close" size={16} color="#94a3b8" />
                </TouchableOpacity>
                <View style={styles.stepper}>
                  <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.stepBtn}>
                    <Ionicons name="remove" size={14} color={theme.primary} />
                  </TouchableOpacity>
                  <Text style={styles.stepValue}>{item.qty}</Text>
                  <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.stepBtn}>
                    <Ionicons name="add" size={14} color={theme.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {items.length > 0 && (
          <TouchableOpacity style={styles.couponRow} activeOpacity={0.7}>
            <Ionicons name="pricetag-outline" size={16} color={theme.primary} />
            <Text style={styles.couponText}>Apply Coupon</Text>
            <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </ScrollView>

      {items.length > 0 && (
        <View style={styles.footer}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>₹{total.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutButton} activeOpacity={0.85}>
            <Text style={styles.checkoutText}>Proceed to Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  list: { padding: SPACING.xxl, gap: 12, flexGrow: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyText: { color: '#94a3b8', fontFamily: FONT.medium, fontSize: 14 },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 12 },
  itemIconBg: { width: 44, height: 44, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  itemVariant: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  itemPrice: { fontSize: 13.5, fontFamily: FONT.extraBold, color: theme.primary, marginTop: 4 },
  itemActions: { alignItems: 'flex-end', gap: 8 },
  removeBtn: { alignSelf: 'flex-end' },
  stepper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: RADIUS.pill, gap: 10, paddingHorizontal: 8, paddingVertical: 4 },
  stepBtn: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  stepValue: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a', minWidth: 14, textAlign: 'center' },
  couponRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff',
    borderRadius: RADIUS.md, padding: SPACING.lg, borderWidth: 1, borderColor: '#eef2f6',
  },
  couponText: { flex: 1, fontSize: 13.5, fontFamily: FONT.bold, color: theme.primary },
  footer: {
    backgroundColor: '#ffffff', padding: SPACING.xxl, borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl,
    ...premiumShadow('#000000', 'lg'),
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  totalLabel: { fontSize: 14, color: '#64748b', fontFamily: FONT.semiBold },
  totalValue: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3 },
  checkoutButton: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 15, alignItems: 'center' },
  checkoutText: { color: '#fff', fontSize: 15.5, fontFamily: FONT.bold },
});
