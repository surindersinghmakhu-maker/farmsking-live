import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAllOrders, useCancelOrder, useConfirmOrder } from '@/src/hooks/useOrders';
import { CustomerOrder, OrderStatus } from '@/src/types/api';

const theme = RoleThemes.SUPER_ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  PLACED: { label: 'Placed', bg: '#fef3c7', color: '#b45309' },
  CONFIRMED: { label: 'Confirmed', bg: '#d1fae5', color: '#047857' },
  PACKING: { label: 'Packing', bg: '#e0e7ff', color: '#4338ca' },
  PACKED: { label: 'Packed', bg: '#dbeafe', color: '#1d4ed8' },
  DISPATCHED: { label: 'Dispatched', bg: '#dbeafe', color: '#1d4ed8' },
  DELIVERED: { label: 'Delivered', bg: '#f1f5f9', color: '#334155' },
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

const FILTERS: { value: OrderStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'PLACED', label: 'Placed' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PACKING', label: 'Packing' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

/** Super Admin's dedicated Sale/Order oversight surface — same underlying orders data Admin/Operator already see. */
export default function SuperOrdersScreen() {
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const { data: orders, isLoading } = useAllOrders(filter === 'ALL' ? undefined : filter);

  const totalAmount = (orders ?? []).reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Sale / Order Management</Text>
        <Text style={styles.heroSubtitle}>
          {orders?.length ?? 0} order(s) · ₹{totalAmount.toLocaleString('en-IN')} total
        </Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: SPACING.xxl }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterChip, filter === f.value && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => {
              tap();
              setFilter(f.value);
            }}
          >
            <Text style={[styles.filterChipText, filter === f.value && { color: '#ffffff' }]}>{f.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {!orders || orders.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No orders in this filter.</Text>
            </View>
          ) : (
            orders.map((order) => <OrderRow key={order.id} order={order} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function OrderRow({ order }: { order: CustomerOrder }) {
  const confirmOrder = useConfirmOrder();
  const cancelOrder = useCancelOrder();
  const meta = STATUS_META[order.status];

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <View style={styles.cardTopRow}>
        <View style={styles.iconBg}>
          <Ionicons name="receipt-outline" size={18} color={theme.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.orderId}>{order.orderNumber}</Text>
          <Text style={styles.orderName}>{order.customer?.name ?? 'Customer'}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>₹{order.totalAmount}</Text>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
      </View>

      {order.status === 'PLACED' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.confirmBtn}
            disabled={confirmOrder.isPending}
            onPress={() => confirmOrder.mutate(order.id)}
          >
            <Text style={styles.confirmBtnText}>Confirm Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            disabled={cancelOrder.isPending}
            onPress={() => cancelOrder.mutate(order.id)}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  filterRow: { marginTop: 12, flexGrow: 0 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  filterChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  list: { padding: SPACING.xxl, gap: 10 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 50, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  orderId: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  orderName: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 10.5, fontFamily: FONT.bold },
  actionRow: { flexDirection: 'row', gap: 8 },
  confirmBtn: { flex: 1, backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  confirmBtnText: { color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold },
  cancelBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: '#dc2626', fontSize: 12.5, fontFamily: FONT.bold },
});
