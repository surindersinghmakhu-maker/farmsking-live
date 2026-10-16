import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useCancelOrder, useMyOrders, useInitiateCashfreePayment } from '@/src/hooks/useOrders';
import { CustomerOrder, OrderStatus } from '@/src/types/api';

const theme = RoleThemes.CUSTOMER;

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

export default function OrdersScreen() {
  const { data: orders, isLoading } = useMyOrders();
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'>('ALL');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const allOrders = useMemo(() => orders || [], [orders]);
  const activeOrders = useMemo(
    () => allOrders.filter((o) => ['PLACED', 'CONFIRMED', 'PACKING', 'PACKED', 'DISPATCHED'].includes(o.status)),
    [allOrders]
  );
  const deliveredOrders = useMemo(
    () => allOrders.filter((o) => o.status === 'DELIVERED'),
    [allOrders]
  );
  const cancelledOrders = useMemo(
    () => allOrders.filter((o) => o.status === 'CANCELLED'),
    [allOrders]
  );

  const displayedOrders = useMemo(() => {
    if (filter === 'ACTIVE') return activeOrders;
    if (filter === 'DELIVERED') return deliveredOrders;
    if (filter === 'CANCELLED') return cancelledOrders;
    return allOrders;
  }, [filter, allOrders, activeOrders, deliveredOrders, cancelledOrders]);

  const ORDER_TABS: Array<{ id: 'ALL' | 'ACTIVE' | 'DELIVERED' | 'CANCELLED'; label: string; count: number; color: string }> = [
    { id: 'ALL', label: 'All', count: allOrders.length, color: theme.primary },
    { id: 'ACTIVE', label: 'Active', count: activeOrders.length, color: '#0284c7' },
    { id: 'DELIVERED', label: 'Delivered', count: deliveredOrders.length, color: '#16a34a' },
    { id: 'CANCELLED', label: 'Cancelled', count: cancelledOrders.length, color: '#dc2626' },
  ];

  useEffect(() => {
    const targetIdx = ORDER_TABS.findIndex((t) => t.id === filter);
    Animated.spring(slideAnim, {
      toValue: targetIdx >= 0 ? targetIdx : 0,
      friction: 9,
      tension: 65,
      useNativeDriver: false,
    }).start();
  }, [filter]);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={styles.heroTitle}>My Orders</Text>
            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>
              {allOrders.length} order{allOrders.length === 1 ? '' : 's'} recorded
            </Text>
          </View>
          <View style={{ backgroundColor: '#f0fdf4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#bbf7d0' }}>
            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' }}>
              Live Tracking Enabled
            </Text>
          </View>
        </View>
      </View>

      {/* 🏎️ Liquid Sliding Segmented Tab Filter Bar */}
      <View style={styles.tabContainer}>
        <View style={styles.tabTrack}>
          <Animated.View
            style={[
              styles.slidingPill,
              {
                left: slideAnim.interpolate({
                  inputRange: [0, 1, 2, 3],
                  outputRange: ['0%', '25%', '50%', '75%'],
                }),
                backgroundColor: ORDER_TABS.find((t) => t.id === filter)?.color || theme.primary,
                ...premiumShadow(ORDER_TABS.find((t) => t.id === filter)?.color || theme.primary, 'xs'),
              },
            ]}
          />
          {ORDER_TABS.map((t) => {
            const isActive = filter === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={styles.tabBtn}
                onPress={() => {
                  tap();
                  setFilter(t.id);
                }}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tabBtnText,
                    isActive && styles.tabBtnTextActive,
                  ]}
                  numberOfLines={1}
                >
                  {t.label} ({t.count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {displayedOrders.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="receipt-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {filter === 'ALL'
                  ? 'No orders placed yet.'
                  : `No ${filter.toLowerCase()} orders found.`}
              </Text>
            </View>
          ) : (
            displayedOrders.map((order) => <OrderCard key={order.id} order={order} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}

function OrderCard({ order }: { order: CustomerOrder }) {
  const cancelOrder = useCancelOrder();
  const initiateCashfree = useInitiateCashfreePayment();
  const meta = STATUS_META[order.status];
  const canCancel = order.status === 'PLACED';
  const canPayOnline = order.paymentMode === 'ONLINE' && order.paymentStatus !== 'PAID' && order.status !== 'CANCELLED';
  const itemsSummary = order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ');

  const handlePayNow = async () => {
    try {
      const res = await initiateCashfree.mutateAsync({ id: order.id });
      if (res.paymentSessionId) {
        if (Platform.OS === 'web') {
          window.location.href = `https://payments.cashfree.com/order/#${res.paymentSessionId}`;
        } else {
          import('react-native').then(({ Linking }) => {
            Linking.openURL(`https://payments.cashfree.com/order/#${res.paymentSessionId}`);
          });
        }
      }
    } catch (err: any) {
      if (Platform.OS === 'web') alert('Payment initiation failed.');
    }
  };

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
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
          {canPayOnline && (
            <TouchableOpacity
              style={[styles.cancelBtn, { backgroundColor: '#10b981' }]}
              disabled={initiateCashfree.isPending}
              onPress={handlePayNow}
            >
              <Text style={[styles.cancelBtnText, { color: '#ffffff' }]}>Pay Now (Cashfree)</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.cancelBtn}
            disabled={cancelOrder.isPending}
            onPress={() => cancelOrder.mutate(order.id)}
          >
            <Text style={styles.cancelBtnText}>Cancel Order</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  tabContainer: {
    paddingHorizontal: SPACING.xxl,
    paddingTop: 10,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  tabTrack: {
    flexDirection: 'row',
    position: 'relative',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.pill,
    padding: 3,
    height: 38,
    alignItems: 'center',
  },
  slidingPill: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    width: '25%',
    borderRadius: RADIUS.pill,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    height: '100%',
  },
  tabBtnText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#64748b',
  },
  tabBtnTextActive: {
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
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
