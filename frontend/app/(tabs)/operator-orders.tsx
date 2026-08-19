import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import ViewShot, { captureRef } from 'react-native-view-shot';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  useCancelOrder,
  useConfirmOrder,
  useDispatchOrder,
  useFulfillmentQueue,
  useMarkOrderDelivered,
  useMarkOrderPacked,
  useStartPackingOrder,
} from '@/src/hooks/useOrders';
import { CustomerOrder, OrderStatus } from '@/src/types/api';

const theme = RoleThemes.OPERATOR;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const STATUS_META: Record<OrderStatus, { label: string; bg: string; color: string }> = {
  PLACED: { label: 'Placed', bg: '#fef3c7', color: '#b45309' },
  CONFIRMED: { label: 'Ready to Pack', bg: '#d1fae5', color: '#047857' },
  PACKING: { label: 'Packing', bg: '#e0e7ff', color: '#4338ca' },
  PACKED: { label: 'Ready to Dispatch', bg: '#dbeafe', color: '#1d4ed8' },
  DISPATCHED: { label: 'Dispatched', bg: '#dbeafe', color: '#1d4ed8' },
  DELIVERED: { label: 'Delivered', bg: '#f1f5f9', color: '#334155' },
  CANCELLED: { label: 'Cancelled', bg: '#fee2e2', color: '#dc2626' },
};

export default function OperatorOrdersScreen() {
  const { data: queue, isLoading } = useFulfillmentQueue();
  const [printOrder, setPrintOrder] = useState<{ order: CustomerOrder; mode: 'BILL' | 'LABEL' } | null>(null);
  const [dispatchOrder, setDispatchOrderTarget] = useState<CustomerOrder | null>(null);

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Fulfillment Queue</Text>
        <Text style={styles.heroSubtitle}>{queue?.length ?? 0} order(s) awaiting action</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          {!queue || queue.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="checkmark-done-circle-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nothing to pack or dispatch right now.</Text>
            </View>
          ) : (
            queue.map((order) => (
              <OrderFulfillmentCard
                key={order.id}
                order={order}
                onPrintBill={() => setPrintOrder({ order, mode: 'BILL' })}
                onPrintLabel={() => setPrintOrder({ order, mode: 'LABEL' })}
                onDispatch={() => setDispatchOrderTarget(order)}
              />
            ))
          )}
        </ScrollView>
      )}

      <PrintModal
        target={printOrder}
        onClose={() => setPrintOrder(null)}
      />
      <DispatchModal order={dispatchOrder} onClose={() => setDispatchOrderTarget(null)} />
    </View>
  );
}

function OrderFulfillmentCard({
  order,
  onPrintBill,
  onPrintLabel,
  onDispatch,
}: {
  order: CustomerOrder;
  onPrintBill: () => void;
  onPrintLabel: () => void;
  onDispatch: () => void;
}) {
  const confirmOrder = useConfirmOrder();
  const startPacking = useStartPackingOrder();
  const markPacked = useMarkOrderPacked();
  const markDelivered = useMarkOrderDelivered();
  const cancelOrder = useCancelOrder();
  const meta = STATUS_META[order.status];
  const itemsSummary = order.items.map((i) => `${i.productName} x${i.quantity}`).join(', ');

  const confirmCancel = () => {
    const message = `Order ${order.orderNumber} ko cancel kar diya jayega. Confirm karein?`;
    const doCancel = () => cancelOrder.mutate(order.id);
    if (Platform.OS === 'web') {
      if (confirm(message)) doCancel();
    } else {
      Alert.alert('Cancel Order', message, [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: doCancel },
      ]);
    }
  };

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <View style={styles.cardTopRow}>
        <View style={styles.iconBg}>
          <Ionicons name="cube-outline" size={18} color={theme.primary} />
        </View>
        <View style={styles.info}>
          <Text style={styles.orderId}>{order.orderNumber}</Text>
          <Text style={styles.orderName}>{order.customer?.name ?? 'Customer'}</Text>
          <Text style={styles.orderItems} numberOfLines={2}>{itemsSummary}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>

      <View style={styles.printRow}>
        <TouchableOpacity style={styles.printBtn} activeOpacity={0.85} onPress={onPrintBill}>
          <Ionicons name="receipt-outline" size={14} color={theme.primary} />
          <Text style={styles.printBtnText}>View Bill</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.printBtn} activeOpacity={0.85} onPress={onPrintLabel}>
          <Ionicons name="pricetag-outline" size={14} color={theme.primary} />
          <Text style={styles.printBtnText}>View Label</Text>
        </TouchableOpacity>
      </View>

      {order.status === 'PLACED' ? (
        <TouchableOpacity
          style={styles.actionBtn}
          disabled={confirmOrder.isPending}
          onPress={() => {
            tap();
            confirmOrder.mutate(order.id);
          }}
        >
          {confirmOrder.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionBtnText}>Confirm Order</Text>}
        </TouchableOpacity>
      ) : null}

      {order.status === 'CONFIRMED' ? (
        <TouchableOpacity
          style={styles.actionBtn}
          disabled={startPacking.isPending}
          onPress={() => {
            tap();
            startPacking.mutate(order.id);
          }}
        >
          {startPacking.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionBtnText}>Start Packing</Text>}
        </TouchableOpacity>
      ) : null}

      {order.status === 'PACKING' ? (
        <TouchableOpacity
          style={styles.actionBtn}
          disabled={markPacked.isPending}
          onPress={() => {
            tap();
            markPacked.mutate(order.id);
          }}
        >
          {markPacked.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionBtnText}>Mark Packed</Text>}
        </TouchableOpacity>
      ) : null}

      {order.status === 'PACKED' ? (
        <TouchableOpacity style={styles.actionBtn} onPress={onDispatch}>
          <Text style={styles.actionBtnText}>Dispatch Order</Text>
        </TouchableOpacity>
      ) : null}

      {order.status === 'DISPATCHED' ? (
        <TouchableOpacity
          style={styles.actionBtn}
          disabled={markDelivered.isPending}
          onPress={() => {
            tap();
            markDelivered.mutate(order.id);
          }}
        >
          {markDelivered.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.actionBtnText}>Mark Delivered</Text>}
        </TouchableOpacity>
      ) : null}

      {order.status !== 'DISPATCHED' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' ? (
        <TouchableOpacity style={styles.cancelLink} activeOpacity={0.7} disabled={cancelOrder.isPending} onPress={confirmCancel}>
          <Text style={styles.cancelLinkText}>Cancel Order</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function DispatchModal({ order, onClose }: { order: CustomerOrder | null; onClose: () => void }) {
  const dispatch = useDispatchOrder();
  const [courierName, setCourierName] = useState('');
  const [trackingId, setTrackingId] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!order) return null;

  const handleDispatch = async () => {
    if (!courierName.trim()) {
      setError('Enter the courier name.');
      return;
    }
    try {
      await dispatch.mutateAsync({ id: order.id, courierName: courierName.trim(), trackingId: trackingId.trim() || undefined });
      setCourierName('');
      setTrackingId('');
      setError(null);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not dispatch this order.');
    }
  };

  return (
    <Modal visible={!!order} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Dispatch {order.orderNumber}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Courier Name</Text>
          <TextInput style={styles.input} placeholder="e.g. BlueDart, Delhivery" placeholderTextColor="#94a3b8" value={courierName} onChangeText={setCourierName} />

          <Text style={styles.label}>Tracking ID (optional)</Text>
          <TextInput style={styles.input} placeholder="e.g. BD123456789" placeholderTextColor="#94a3b8" value={trackingId} onChangeText={setTrackingId} />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitBtn} disabled={dispatch.isPending} onPress={handleDispatch}>
            {dispatch.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Confirm Dispatch</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function PrintModal({ target, onClose }: { target: { order: CustomerOrder; mode: 'BILL' | 'LABEL' } | null; onClose: () => void }) {
  const shotRef = useRef<ViewShot>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!target) return null;
  const { order, mode } = target;

  const handlePrint = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleDownload = async () => {
    if (!shotRef.current) return;
    tap();
    setIsDownloading(true);
    try {
      const uri = await captureRef(shotRef, { format: 'jpg', quality: 0.95 });
      const fileName = `${order.orderNumber}-${mode === 'BILL' ? 'bill' : 'label'}`;
      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = `${fileName}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/jpeg', dialogTitle: mode === 'BILL' ? 'Bill' : 'Shipping Label' });
      }
    } catch {
      Alert.alert('Download Failed', 'Could not generate the file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{mode === 'BILL' ? 'Bill' : 'Shipping Label'}</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.printSheet} showsVerticalScrollIndicator={false}>
            <ViewShot ref={shotRef} style={{ backgroundColor: '#fafafa' }}>
              <Text style={styles.printBrand}>FarmsKing</Text>
              <Text style={styles.printOrderNum}>{order.orderNumber}</Text>
              <Text style={styles.printDate}>{new Date(order.orderDate).toLocaleDateString('en-IN')}</Text>

              <View style={styles.printDivider} />

              <Text style={styles.printSectionLabel}>{mode === 'BILL' ? 'Bill To' : 'Ship To'}</Text>
              <Text style={styles.printCustomerName}>{order.customer?.name}</Text>
              <Text style={styles.printCustomerMeta}>{order.customer?.mobile}</Text>
              {order.deliveryAddress ? <Text style={styles.printCustomerMeta}>{order.deliveryAddress}</Text> : null}

              {mode === 'BILL' ? (
                <>
                  <View style={styles.printDivider} />
                  {order.items.map((item) => (
                    <View key={item.id} style={styles.printItemRow}>
                      <Text style={styles.printItemName}>{item.productName} x{item.quantity}</Text>
                      <Text style={styles.printItemAmount}>₹{(Number(item.price) * item.quantity).toFixed(2)}</Text>
                    </View>
                  ))}
                  <View style={styles.printDivider} />
                  <View style={styles.printItemRow}>
                    <Text style={styles.printTotalLabel}>Total</Text>
                    <Text style={styles.printTotalValue}>₹{order.totalAmount}</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.printDivider} />
                  <Text style={styles.printSectionLabel}>Items</Text>
                  <Text style={styles.printCustomerMeta}>
                    {order.items.reduce((sum, i) => sum + i.quantity, 0)} item(s) — {order.items.map((i) => i.productName).join(', ')}
                  </Text>
                  {order.courierName ? (
                    <>
                      <View style={styles.printDivider} />
                      <Text style={styles.printSectionLabel}>Courier</Text>
                      <Text style={styles.printCustomerName}>{order.courierName}</Text>
                      {order.trackingId ? <Text style={styles.printCustomerMeta}>Tracking: {order.trackingId}</Text> : null}
                    </>
                  ) : null}
                </>
              )}
            </ViewShot>
          </ScrollView>

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} disabled={isDownloading} onPress={handleDownload}>
              {isDownloading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="download-outline" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>  Download</Text>
                </>
              )}
            </TouchableOpacity>
            {Platform.OS === 'web' ? (
              <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#334155' }]} onPress={handlePrint}>
                <Ionicons name="print-outline" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>  Print</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  heroSubtitle: { fontSize: 12.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  list: { padding: SPACING.xxl, gap: 12 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 50, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 10 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  iconBg: { width: 40, height: 40, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  orderId: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  orderName: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  orderItems: { fontSize: 11, color: '#94a3b8', fontFamily: FONT.medium, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 10, fontFamily: FONT.bold },
  printRow: { flexDirection: 'row', gap: 8 },
  printBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: theme.primaryLight, paddingVertical: 9, borderRadius: RADIUS.md },
  printBtnText: { fontSize: 11.5, fontFamily: FONT.bold, color: theme.primary },
  actionBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center' },
  actionBtnText: { color: '#ffffff', fontSize: 13, fontFamily: FONT.bold },
  cancelLink: { alignItems: 'center', paddingVertical: 4 },
  cancelLinkText: { color: '#dc2626', fontSize: 12, fontFamily: FONT.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 420, maxHeight: '88%', backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, gap: 8, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginTop: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { flexDirection: 'row', backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  printSheet: { maxHeight: 380, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md, padding: SPACING.md, backgroundColor: '#fafafa' },
  printBrand: { fontSize: 15, fontFamily: FONT.extraBold, color: theme.primary },
  printOrderNum: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a', marginTop: 4 },
  printDate: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  printDivider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  printSectionLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 3 },
  printCustomerName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  printCustomerMeta: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  printItemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  printItemName: { fontSize: 12, fontFamily: FONT.medium, color: '#0f172a', flex: 1 },
  printItemAmount: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  printTotalLabel: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  printTotalValue: { fontSize: 13, fontFamily: FONT.extraBold, color: theme.primary },
});
