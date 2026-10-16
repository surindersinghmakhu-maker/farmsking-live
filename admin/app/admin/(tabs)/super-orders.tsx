import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAllOrders, useCancelOrder, useConfirmOrder } from '@/src/hooks/useOrders';
import { CustomerOrder, OrderStatus } from '@/src/types/api';
import { useExecutiveTheme } from '@/src/store/theme-context';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  PLACED: { label: 'Placed', bg: '#fef3c7', color: '#b45309' },
  CONFIRMED: { label: 'Confirmed', bg: '#d1fae5', color: '#047857' },
  PACKING: { label: 'Packing', bg: '#e0e7ff', color: '#4338ca' },
  PACKED: { label: 'Packed', bg: '#dbeafe', color: '#1d4ed8' },
  DISPATCHED: { label: 'Dispatched', bg: '#dbeafe', color: '#1d4ed8' },
  DELIVERED: { label: 'Delivered', bg: '#f0fdf4', color: '#16a34a' },
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

export default function SuperOrdersScreen() {
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const { data: orders, isLoading } = useAllOrders(filter === 'ALL' ? undefined : filter);

  const totalAmount = (orders ?? []).reduce((sum, o) => sum + Number(o.totalAmount), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient
        colors={isLight ? ['#16a34a', '#15803d'] : ['#031018', '#052622', '#083828']}
        style={styles.hero}
      >
        <Text style={styles.heroTitle}>Revenue & Orders Analytics</Text>
        <Text style={styles.heroSubtitle}>
          {orders?.length ?? 0} order(s) · ₹{totalAmount.toLocaleString('en-IN')} total gross sales
        </Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
        {FILTERS.map((f) => {
          const isSelected = filter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              style={[
                styles.filterChip,
                { backgroundColor: innerBg, borderColor: cardBorder },
                isSelected && (isLight ? styles.filterChipSelectedLight : styles.filterChipSelectedDark),
                isSelected && premiumShadow(isLight ? '#16a34a' : '#00ff87', 'xs'),
              ]}
              onPress={() => {
                tap();
                setFilter(f.value);
              }}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: isLight ? '#475569' : '#94a3b8' },
                  isSelected && { color: isLight ? '#ffffff' : '#020d06', fontWeight: '800' },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={isLight ? '#16a34a' : '#00ff87'} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {!orders || orders.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="receipt-outline" size={40} color={subTextColor} />
              <Text style={[styles.emptyText, { color: subTextColor }]}>No orders found in this filter.</Text>
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
  const { isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  const confirmOrder = useConfirmOrder();
  const cancelOrder = useCancelOrder();
  const meta = STATUS_META[order.status];

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, premiumShadow('#0f172a', 'sm')]}>
      <View style={styles.cardTopRow}>
        <View style={[styles.iconBg, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.12)' }]}>
          <Ionicons name="receipt-outline" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.orderId, { color: textColor }]}>{order.orderNumber}</Text>
          <Text style={[styles.orderName, { color: subTextColor }]}>{order.customer?.name ?? 'Customer'}</Text>
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: textColor }]}>₹{order.totalAmount}</Text>
          <View style={[styles.badge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>
      </View>

      {order.status === 'PLACED' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: isLight ? '#16a34a' : '#00ff87' }]}
            disabled={confirmOrder.isPending}
            onPress={() => confirmOrder.mutate(order.id)}
          >
            <Text style={[styles.confirmBtnText, { color: isLight ? '#ffffff' : '#020d06' }]}>Confirm Order</Text>
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
  container: { flex: 1, ...(typeof window !== 'undefined' ? { height: '100%', overflow: 'hidden' } as any : {}) },
  hero: { paddingTop: 14, paddingBottom: 12, paddingHorizontal: 16 },
  heroTitle: { color: '#ffffff', fontSize: 18, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontFamily: FONT.medium, marginTop: 2 },
  filterRow: { marginTop: 10, flexGrow: 0 },
  filterChip: { paddingHorizontal: 13, paddingVertical: 6.5, borderRadius: RADIUS.pill, borderWidth: 1.5 },
  filterChipSelectedLight: { backgroundColor: '#16a34a', borderColor: '#15803d' },
  filterChipSelectedDark: { backgroundColor: '#00ff87', borderColor: '#00cc6a' },
  filterChipText: { fontSize: 11.5, fontFamily: FONT.bold },
  list: { padding: 12, gap: 10 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 50, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium },
  card: { borderRadius: RADIUS.lg, padding: 12, gap: 10, borderWidth: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  orderId: { fontSize: 13.5, fontFamily: FONT.bold },
  orderName: { fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 4 },
  amount: { fontSize: 14, fontFamily: FONT.extraBold },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 10, fontFamily: FONT.bold },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  confirmBtn: { flex: 1, borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  confirmBtnText: { fontSize: 12, fontFamily: FONT.bold },
  cancelBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: RADIUS.md, paddingVertical: 8, alignItems: 'center' },
  cancelBtnText: { color: '#dc2626', fontSize: 12, fontFamily: FONT.bold },
});
