import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useCancelOrder, useMyOrders } from '@/src/hooks/useOrders';
import { CustomerOrder, OrderStatus } from '@/src/types/api';

const theme = RoleThemes.CUSTOMER;

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  PLACED: { label: 'Placed', bg: '#fef3c7', color: '#b45309' },
  CONFIRMED: { label: 'Confirmed', bg: '#d1fae5', color: '#047857' },
  PACKING: { label: 'Packing', bg: '#e0e7ff', color: '#4338ca' },
  PACKED: { label: 'Packed', bg: '#dbeafe', color: '#1d4ed8' },
  DISPATCHED: { label: 'Dispatched', bg: '#dbeafe', color: '#1d4ed8' },
  DELIVERED: { label: 'Delivered', bg: '#f1f5f9', color: '#334155' },
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

export default function OrdersScreen() {
  const { data: orders, isLoading } = useMyOrders();

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>My Orders</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {!orders || orders.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No orders yet.</Text>
            </View>
          ) : (
            orders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const cancelOrder = useCancelOrder();
  const meta = STATUS_META[order.status];
  const canCancel = order.status === 'PLACED';
  const itemsSummary = order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ');

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <View style={styles.cardTopRow}>
        <View style={styles.iconBg}>
          <Ionicons name="cube-outline" size={19} color={theme.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.orderNum}>{order.orderNumber}</Text>
          <Text style={styles.orderDesc} numberOfLines={2}>{itemsSummary}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.orderPrice}>₹{order.totalAmount}</Text>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
      </View>

      {order.status === 'DISPATCHED' && order.courierName ? (
        <Text style={styles.trackingText}>
          🚚 {order.courierName}{order.trackingId ? ` · Tracking: ${order.trackingId}` : ''}
        </Text>
      ) : null}

      {canCancel ? (
        <TouchableOpacity
          style={styles.cancelBtn}
          disabled={cancelOrder.isPending}
          onPress={() => cancelOrder.mutate(order.id)}
        >
          <Text style={styles.cancelBtnText}>Cancel Order</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  list: { padding: SPACING.xxl, gap: 12 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 8 },
  emptyText: { fontSize: 13.5, fontFamily: FONT.medium, color: '#94a3b8' },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 8 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  orderNum: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  orderDesc: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  orderPrice: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  statusText: { fontSize: 10.5, fontFamily: FONT.bold },
  trackingText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#1d4ed8' },
  cancelBtn: { alignSelf: 'flex-start', backgroundColor: '#fee2e2', paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill },
  cancelBtnText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#dc2626' },
});
