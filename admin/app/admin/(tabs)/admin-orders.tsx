import React, { useState } from 'react';
import { ActivityIndicator, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAllOrders, useCancelOrder, useConfirmOrder } from '@/src/hooks/useOrders';
import { CustomerOrder, OrderPaymentMode, OrderPaymentStatus, OrderStatus } from '@/src/types/api';
import { exportOrdersToExcel } from '@/src/utils/excelExport';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { showAdminToast } from '@/components/AdminLiveToastNotification';

const theme = RoleThemes.ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  PLACED: { label: 'Placed', bg: '#fef3c7', color: '#b45309' },
  CONFIRMED: { label: 'Confirmed', bg: '#d1fae5', color: '#047857' },
  PACKING: { label: 'Packing', bg: '#e0e7ff', color: '#4338ca' },
  PACKED: { label: 'Packed', bg: '#dbeafe', color: '#1d4ed8' },
  DISPATCHED: { label: 'Dispatched', bg: '#dbeafe', color: '#1d4ed8' },
  DELIVERED: { label: 'Delivered', bg: '#f1f5f9', color: '#64748b' },
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

const PAYMENT_STATUS_META: Record<OrderPaymentStatus, { label: string; bg: string; color: string }> = {
  UNPAID: { label: 'Unpaid', bg: '#f1f5f9', color: '#64748b' },
  PENDING: { label: 'Payment Pending', bg: '#fef3c7', color: '#b45309' },
  PAID: { label: 'Paid', bg: '#d1fae5', color: '#047857' },
  FAILED: { label: 'Payment Failed', bg: '#fee2e2', color: '#dc2626' },
};

const PAYMENT_MODE_LABEL: Record<OrderPaymentMode, string> = {
  COD: 'Cash on Delivery',
  ONLINE: 'Online Payment',
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

export default function AdminOrdersScreen() {
  const { colors, isLight, isMedium, textColor, subTextColor, cardBg, cardBorder } = useExecutiveTheme();
  const [filter, setFilter] = useState<OrderStatus | 'ALL'>('ALL');
  const { data: orders, isLoading } = useAllOrders(filter === 'ALL' ? undefined : filter);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const totalAmount = (orders ?? []).reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.hero,
          isLight && { backgroundColor: '#ffffff', borderBottomColor: '#e2e8f0' },
          isMedium && { backgroundColor: 'rgba(6, 26, 30, 0.85)', borderBottomColor: 'rgba(34, 197, 94, 0.25)' },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <View>
            <Text style={[styles.heroTitle, { color: textColor }]}>Trade Orders & Sales</Text>
            <Text style={[styles.heroSubtitle, { color: subTextColor }]}>
              {orders?.length ?? 0} order(s) · ₹{totalAmount.toLocaleString('en-IN')} gross sales
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.exportBtn,
              isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' },
            ]}
            onPress={() => {
              tap();
              exportOrdersToExcel(orders || []);
              showAdminToast('INFO', 'Export Generated', 'Orders report downloaded successfully.');
            }}
          >
            <Ionicons name="download-outline" size={14} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.exportBtnText, isLight && { color: '#16a34a' }]}>Excel Export</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: 12 }}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[
              styles.filterChip,
              isLight && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
              isMedium && { backgroundColor: 'rgba(16, 25, 40, 0.7)', borderColor: 'rgba(255, 255, 255, 0.12)' },
              filter === f.value && {
                backgroundColor: isLight ? '#16a34a' : '#10b981',
                borderColor: isLight ? '#15803d' : '#059669',
                ...premiumShadow(isLight ? '#16a34a' : '#10b981', 'sm'),
              },
            ]}
            onPress={() => {
              tap();
              setFilter(f.value);
            }}
          >
            <Text
              style={[
                styles.filterChipText,
                isLight && { color: '#475569' },
                filter === f.value && { color: '#ffffff' },
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={isLight ? '#16a34a' : theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {!orders || orders.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="receipt-outline" size={40} color={isLight ? '#94a3b8' : '#cbd5e1'} />
              <Text style={[styles.emptyText, { color: subTextColor }]}>No orders in this filter.</Text>
            </View>
          ) : (
            orders.map((order) => (
              <OrderRow
                key={order.id}
                order={order}
                isExpanded={expandedId === order.id}
                onToggle={() => setExpandedId((cur) => (cur === order.id ? null : order.id))}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function OrderRow({ order, isExpanded, onToggle }: { order: CustomerOrder; isExpanded: boolean; onToggle: () => void }) {
  const { isLight, isMedium, textColor, subTextColor, cardBg, cardBorder } = useExecutiveTheme();
  const confirmOrder = useConfirmOrder();
  const cancelOrder = useCancelOrder();
  const meta = STATUS_META[order.status];
  const paymentMeta = PAYMENT_STATUS_META[order.paymentStatus];
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: isLight ? '#ffffff' : cardBg,
          borderWidth: 1,
          borderColor: cardBorder,
        },
        premiumShadow(isLight ? 'rgba(0,0,0,0.06)' : '#0f172a', 'sm'),
      ]}
    >
      <TouchableOpacity activeOpacity={0.7} onPress={() => { tap(); onToggle(); }}>
        <View style={styles.cardTopRow}>
          <View style={[styles.iconBg, isLight && { backgroundColor: '#f0fdf4' }]}>
            <Ionicons name="receipt-outline" size={18} color={isLight ? '#16a34a' : theme.primary} />
          </View>
          <View style={styles.info}>
            <Text style={[styles.orderId, { color: textColor }]}>{order.orderNumber}</Text>
            <Text style={[styles.orderName, { color: subTextColor }]}>{order.customer?.name ?? 'Customer'}</Text>
            <Text style={[styles.orderSummary, { color: subTextColor }]}>
              {itemCount} item{itemCount === 1 ? '' : 's'} · {new Date(order.orderDate).toLocaleDateString('en-IN')}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={[styles.amount, { color: isLight ? '#16a34a' : '#10b981' }]}>₹{order.totalAmount}</Text>
            <View style={[styles.badge, { backgroundColor: meta.bg }]}>
              <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.paymentRow, isLight && { borderTopColor: '#f1f5f9' }]}>
          <View style={styles.paymentRowLeft}>
            <Ionicons name={order.paymentMode === 'ONLINE' ? 'card-outline' : 'cash-outline'} size={13} color="#64748b" />
            <Text style={styles.paymentModeText}>{PAYMENT_MODE_LABEL[order.paymentMode]}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: paymentMeta.bg }]}>
            <Text style={[styles.badgeText, { color: paymentMeta.color }]}>{paymentMeta.label}</Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#94a3b8" style={{ marginLeft: 4 }} />
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <View style={styles.detailBlock}>
          <View style={[styles.itemsBox, isLight && { backgroundColor: '#f8fafc' }, isMedium && { backgroundColor: 'rgba(0, 0, 0, 0.25)' }]}>
            {order.items.map((item) => (
              <View key={item.id} style={styles.itemRow}>
                <Text style={[styles.itemName, { color: textColor }]} numberOfLines={1}>
                  {item.productName} <Text style={[styles.itemQty, { color: subTextColor }]}>× {item.quantity}</Text>
                </Text>
                <Text style={[styles.itemAmount, { color: textColor }]}>₹{(Number(item.price) * item.quantity).toFixed(2)}</Text>
              </View>
            ))}
            {order.discountAmount ? (
              <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 6, marginTop: 2 }]}>
                <Text style={[styles.itemName, { color: textColor }]}>Discount</Text>
                <Text style={[styles.itemAmount, { color: '#16a34a' }]}>−₹{order.discountAmount}</Text>
              </View>
            ) : null}
            <View style={[styles.itemRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 4 }]}>
              <Text style={[styles.totalLabel, { color: textColor }]}>Total</Text>
              <Text style={[styles.totalAmount, { color: textColor }]}>₹{order.totalAmount}</Text>
            </View>
          </View>

          <View style={[styles.paymentBox, isLight && { backgroundColor: '#f8fafc' }, isMedium && { backgroundColor: 'rgba(0, 0, 0, 0.25)' }]}>
            <Text style={[styles.paymentBoxTitle, { color: subTextColor }]}>Payment</Text>
            <View style={styles.itemRow}>
              <Text style={styles.metaLabel}>Method</Text>
              <Text style={[styles.metaValue, { color: textColor }]}>{PAYMENT_MODE_LABEL[order.paymentMode]}</Text>
            </View>
            <View style={styles.itemRow}>
              <Text style={styles.metaLabel}>Status</Text>
              <View style={[styles.badge, { backgroundColor: paymentMeta.bg }]}>
                <Text style={[styles.badgeText, { color: paymentMeta.color }]}>{paymentMeta.label}</Text>
              </View>
            </View>
            {order.phonepeMerchantOrderId ? (
              <View style={styles.itemRow}>
                <Text style={styles.metaLabel}>Transaction ID</Text>
                <Text style={[styles.metaValue, { color: textColor }]} numberOfLines={1}>{order.phonepeMerchantOrderId}</Text>
              </View>
            ) : null}
            {order.phonepePaymentState ? (
              <View style={styles.itemRow}>
                <Text style={styles.metaLabel}>Gateway State</Text>
                <Text style={[styles.metaValue, { color: textColor }]}>{order.phonepePaymentState}</Text>
              </View>
            ) : null}
          </View>

          {order.deliveryAddress ? (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={14} color="#64748b" />
              <Text style={styles.metaText}>{order.deliveryAddress}</Text>
            </View>
          ) : null}
          {order.customer?.mobile ? (
            <View style={styles.metaRow}>
              <Ionicons name="call-outline" size={14} color="#64748b" />
              <Text style={styles.metaText}>{order.customer.mobile}</Text>
            </View>
          ) : null}
          {order.courierName ? (
            <View style={styles.metaRow}>
              <Ionicons name="cube-outline" size={14} color="#64748b" />
              <Text style={styles.metaText}>
                {order.courierName}
                {order.trackingId ? ` · Tracking: ${order.trackingId}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {order.status === 'PLACED' ? (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.confirmBtn}
            disabled={confirmOrder.isPending}
            onPress={() => {
              confirmOrder.mutate(order.id, {
                onSuccess: () => {
                  showAdminToast('SUCCESS', 'Order Confirmed', `Order ${order.orderNumber} confirmed for fulfillment.`);
                },
              });
            }}
          >
            <Text style={styles.confirmBtnText}>Confirm Order</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cancelBtn}
            disabled={cancelOrder.isPending}
            onPress={() => {
              cancelOrder.mutate(order.id, {
                onSuccess: () => {
                  showAdminToast('WARNING', 'Order Cancelled', `Order ${order.orderNumber} has been cancelled.`);
                },
              });
            }}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.bg,
    // On web/desktop fill the full canvas height
    ...(typeof window !== 'undefined' ? { height: '100%', overflow: 'hidden' } as any : {}),
  },
  hero: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(0,255,135,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  heroTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#ffffff' },
  heroSubtitle: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  filterRow: { marginTop: 6, flexGrow: 0 },
  filterChip: { paddingHorizontal: 9, paddingVertical: 4.5, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: 'rgba(0,255,135,0.3)', backgroundColor: 'rgba(0,255,135,0.03)' },
  filterChipText: { fontSize: 11, fontFamily: FONT.bold, color: '#e2e8f0' },
  list: { padding: 8, gap: 6, paddingBottom: Platform.OS === 'web' ? 16 : 24 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },
  card: { backgroundColor: 'rgba(0,255,135,0.03)', borderRadius: RADIUS.lg, padding: 10, gap: 8 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  orderId: { fontSize: 13.5, fontFamily: FONT.bold, color: '#ffffff' },
  orderName: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  orderSummary: { fontSize: 10.5, color: '#94a3b8', fontFamily: FONT.medium, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 10.5, fontFamily: FONT.bold },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  paymentRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 },
  paymentModeText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#64748b' },
  detailBlock: { gap: 8 },
  itemsBox: { backgroundColor: 'rgba(0,255,135,0.03)', borderRadius: RADIUS.md, padding: 10, gap: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemName: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#e2e8f0' },
  itemQty: { color: '#94a3b8', fontFamily: FONT.medium },
  itemAmount: { fontSize: 12, fontFamily: FONT.semiBold, color: '#ffffff' },
  totalLabel: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },
  totalAmount: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  paymentBox: { backgroundColor: 'rgba(0,255,135,0.03)', borderRadius: RADIUS.md, padding: 10, gap: 6 },
  paymentBoxTitle: { fontSize: 10.5, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 2 },
  metaLabel: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  metaValue: { fontSize: 12, fontFamily: FONT.semiBold, color: '#ffffff', flexShrink: 1, textAlign: 'right' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  actionRow: { flexDirection: 'row', gap: 8 },
  confirmBtn: { flex: 1, backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  confirmBtnText: { color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold },
  cancelBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  cancelBtnText: { color: '#dc2626', fontSize: 12.5, fontFamily: FONT.bold },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,255,135,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.3)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  exportBtnText: {
    color: '#00ff87',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
});
