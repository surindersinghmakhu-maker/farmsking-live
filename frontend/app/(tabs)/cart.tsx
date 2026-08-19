import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoLinking from 'expo-linking';
import QRCode from 'react-native-qrcode-svg';
import { useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useCart } from '@/src/store/cart-context';
import { useAuth } from '@/src/store/auth-context';
import { useCreateOrder, useOrderUpiLink, useInitiatePhonePePayment } from '@/src/hooks/useOrders';
import { useCouponPreview } from '@/src/hooks/useCoupons';
import { useMyAddresses } from '@/src/hooks/useAddresses';
import type { OrderUpiLink } from '@/src/api/orders.api';

const theme = RoleThemes.CUSTOMER;

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, updateQuantity, removeItem, clearCart, totalAmount } = useCart();
  const createOrder = useCreateOrder();
  const orderUpiLink = useOrderUpiLink();
  const initiatePhonePe = useInitiatePhonePePayment();
  const couponPreview = useCouponPreview();
  const [upiModal, setUpiModal] = useState<OrderUpiLink | null>(null);
  const { data: savedAddresses = [] } = useMyAddresses();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [deliveryAddress, setDeliveryAddress] = useState(
    [user?.village, user?.district, user?.state].filter(Boolean).join(', '),
  );
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'COD'>('ONLINE');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const discountAmount = appliedDiscount?.amount ?? 0;
  const finalAmount = Math.max(totalAmount - discountAmount, 0);

  const composeAddress = (addr: (typeof savedAddresses)[number]) =>
    `${addr.line}, ${addr.postOffice}, ${addr.district}, ${addr.state} - ${addr.pincode}`;

  // Once saved addresses load, default to the most recent one if nothing's been picked/typed yet.
  useEffect(() => {
    if (selectedAddressId || savedAddresses.length === 0) return;
    setSelectedAddressId(savedAddresses[0].id);
    setDeliveryAddress(composeAddress(savedAddresses[0]));
  }, [savedAddresses]);

  const handleApplyCoupon = async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    try {
      const preview = await couponPreview.mutateAsync({ code, amount: totalAmount });
      setAppliedDiscount({ code, amount: Number(preview.discountAmount) });
    } catch (err: any) {
      setAppliedDiscount(null);
      setCouponError(err?.response?.data?.message ?? 'Invalid coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedDiscount(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!deliveryAddress.trim()) {
      setError('Enter a delivery address.');
      return;
    }
    setError(null);
    try {
      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: deliveryAddress.trim(),
        couponCode: appliedDiscount?.code,
        paymentMode: paymentMethod,
      });
      clearCart();
      setAppliedDiscount(null);
      setCouponCode('');

      if (paymentMethod === 'COD') {
        const message = `Order ${order.orderNumber} placed successfully! Pay cash on delivery.`;
        Platform.OS === 'web' ? alert(message) : Alert.alert('Order Placed 💵', message);
        router.push('/(tabs)/orders');
        return;
      }

      const redirectUrl =
        Platform.OS === 'web' ? `${window.location.origin}/orders` : ExpoLinking.createURL('orders');

      try {
        const phonepe = await initiatePhonePe.mutateAsync({ id: order.id, redirectUrl });
        await Linking.openURL(phonepe.redirectUrl);
        router.push('/(tabs)/orders');
        return;
      } catch {
        // PhonePe not configured yet — fall back to the plain UPI QR flow.
      }

      try {
        const upi = await orderUpiLink.mutateAsync(order.id);
        setUpiModal(upi);
      } catch {
        // UPI not configured yet either — still confirm the order without blocking on payment.
        const message = `Order ${order.orderNumber} placed successfully!`;
        Platform.OS === 'web' ? alert(message) : Alert.alert('Order Placed', message);
        router.push('/(tabs)/orders');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not place the order.');
    }
  };

  const closeUpiModal = () => {
    setUpiModal(null);
    router.push('/(tabs)/orders');
  };

  const handleOpenUpiApp = async () => {
    if (!upiModal) return;
    try {
      await Linking.openURL(upiModal.upiLink);
    } catch {
      Platform.OS === 'web' ? alert('No UPI app found on this device.') : Alert.alert('Could Not Open', 'No UPI app found on this device.');
    }
  };

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
            <View key={item.productId} style={[styles.itemCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.itemIconBg}>
                <Ionicons name="cube-outline" size={20} color={theme.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemVariant}>{item.unit}</Text>
                <Text style={styles.itemPrice}>₹{item.price}</Text>
              </View>
              <View style={styles.itemActions}>
                <TouchableOpacity onPress={() => removeItem(item.productId)} style={styles.removeBtn}>
                  <Ionicons name="trash-outline" size={14} color="#dc2626" />
                </TouchableOpacity>
                <View style={styles.qtyRow}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, item.quantity - 1)}>
                    <Ionicons name="remove" size={14} color="#334155" />
                  </TouchableOpacity>
                  <Text style={styles.qtyText}>{item.quantity}</Text>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => updateQuantity(item.productId, item.quantity + 1)}>
                    <Ionicons name="add" size={14} color="#334155" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        {items.length > 0 ? (
          <>
            <Text style={styles.sectionLabel}>Have a coupon code?</Text>
            {appliedDiscount ? (
              <View style={styles.couponAppliedRow}>
                <Ionicons name="pricetag" size={14} color="#16a34a" />
                <Text style={styles.couponAppliedText}>
                  {appliedDiscount.code} applied — ₹{appliedDiscount.amount.toLocaleString('en-IN')} off
                </Text>
                <TouchableOpacity onPress={handleRemoveCoupon}>
                  <Ionicons name="close-circle" size={16} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponRow}>
                <TextInput
                  style={[styles.addressInput, styles.couponInput]}
                  placeholder="Enter coupon code"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="characters"
                  value={couponCode}
                  onChangeText={setCouponCode}
                />
                <TouchableOpacity
                  style={styles.applyCouponBtn}
                  disabled={!couponCode.trim() || couponPreview.isPending}
                  onPress={handleApplyCoupon}
                >
                  {couponPreview.isPending ? (
                    <ActivityIndicator color={theme.primary} size="small" />
                  ) : (
                    <Text style={styles.applyCouponBtnText}>Apply</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
            {couponError ? <Text style={styles.errorText}>{couponError}</Text> : null}

            <Text style={styles.sectionLabel}>Delivery Address</Text>
            {savedAddresses.length > 0 ? (
              <View style={styles.addressChipRow}>
                {savedAddresses.map((addr) => (
                  <TouchableOpacity
                    key={addr.id}
                    style={[styles.addressChip, selectedAddressId === addr.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => {
                      setSelectedAddressId(addr.id);
                      setDeliveryAddress(composeAddress(addr));
                    }}
                  >
                    <Ionicons name="location" size={12} color={selectedAddressId === addr.id ? '#ffffff' : theme.primary} />
                    <Text style={[styles.addressChipText, selectedAddressId === addr.id && { color: '#ffffff' }]}>{addr.tag}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={styles.addressChip}
                  onPress={() => router.push('/profile')}
                >
                  <Ionicons name="add" size={12} color={theme.primary} />
                  <Text style={styles.addressChipText}>Add New</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.addAddressLink} onPress={() => router.push('/profile')}>
                <Ionicons name="add-circle-outline" size={14} color={theme.primary} />
                <Text style={[styles.addAddressLinkText, { color: theme.primary }]}>Add a saved address in My Profile</Text>
              </TouchableOpacity>
            )}
            <TextInput
              style={styles.addressInput}
              placeholder="House no, village, district, state"
              placeholderTextColor="#94a3b8"
              value={deliveryAddress}
              onChangeText={(t) => { setDeliveryAddress(t); setSelectedAddressId(null); }}
              multiline
            />

            <Text style={styles.sectionLabel}>Payment Method</Text>
            <View style={styles.paymentMethodRow}>
              <TouchableOpacity
                style={[styles.paymentMethodChip, paymentMethod === 'ONLINE' && styles.paymentMethodChipActive]}
                onPress={() => setPaymentMethod('ONLINE')}
              >
                <Ionicons name="card" size={16} color={paymentMethod === 'ONLINE' ? '#ffffff' : theme.primary} />
                <Text style={[styles.paymentMethodChipText, paymentMethod === 'ONLINE' && { color: '#ffffff' }]}>Pay Online</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentMethodChip, paymentMethod === 'COD' && styles.paymentMethodChipActive]}
                onPress={() => setPaymentMethod('COD')}
              >
                <Ionicons name="cash" size={16} color={paymentMethod === 'COD' ? '#ffffff' : theme.primary} />
                <Text style={[styles.paymentMethodChipText, paymentMethod === 'COD' && { color: '#ffffff' }]}>Cash on Delivery</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>

      {items.length > 0 ? (
        <View style={styles.footer}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.subtotalValue}>₹{totalAmount.toLocaleString('en-IN')}</Text>
          </View>
          {appliedDiscount ? (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Discount</Text>
              <Text style={styles.discountValue}>-₹{discountAmount.toLocaleString('en-IN')}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>₹{finalAmount.toLocaleString('en-IN')}</Text>
          </View>
          <TouchableOpacity style={styles.checkoutBtn} disabled={createOrder.isPending} onPress={handlePlaceOrder}>
            {createOrder.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.checkoutBtnText}>
                {paymentMethod === 'ONLINE' ? 'Place Order & Pay Online' : 'Place Order (Cash on Delivery)'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      <Modal visible={!!upiModal} transparent animationType="fade" onRequestClose={closeUpiModal}>
        <View style={styles.upiOverlay}>
          <View style={[styles.upiCard, premiumShadow('#000000', 'lg')]}>
            <View style={styles.upiHeaderRow}>
              <Text style={styles.upiTitle}>Order Placed! Pay via UPI</Text>
              <TouchableOpacity onPress={closeUpiModal}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            {upiModal ? (
              <>
                <Text style={styles.upiOrderNo}>Order {upiModal.orderNumber}</Text>
                <View style={styles.upiQrBox}>
                  <QRCode value={upiModal.upiLink} size={200} />
                </View>
                <Text style={styles.upiAmount}>₹{upiModal.amount.toLocaleString('en-IN')}</Text>
                <Text style={styles.upiHint}>Scan with any UPI app, or tap below to open one directly.</Text>
                <TouchableOpacity style={styles.upiOpenBtn} onPress={handleOpenUpiApp}>
                  <Text style={styles.upiOpenBtnText}>Open in UPI App</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.upiDoneBtn} onPress={closeUpiModal}>
                  <Text style={styles.upiDoneBtnText}>I'll pay later — View Order</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  upiOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  upiCard: { width: '100%', maxWidth: 380, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, alignItems: 'center', gap: 6 },
  upiHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 4 },
  upiTitle: { fontSize: 15.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  upiOrderNo: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#64748b' },
  upiQrBox: { padding: 14, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#e2e8f0', marginTop: 8 },
  upiAmount: { fontSize: 26, fontFamily: FONT.extraBold, color: theme.primary, marginTop: 10 },
  upiHint: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', marginTop: 4, paddingHorizontal: 10 },
  upiOpenBtn: { width: '100%', backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 14 },
  upiOpenBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  upiDoneBtn: { width: '100%', paddingVertical: 11, alignItems: 'center', marginTop: 2 },
  upiDoneBtnText: { color: '#64748b', fontFamily: FONT.semiBold, fontSize: 12.5 },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  list: { padding: SPACING.xxl, gap: 10 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 60, gap: 8 },
  emptyText: { fontSize: 13.5, fontFamily: FONT.medium, color: '#94a3b8' },
  itemCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 12 },
  itemIconBg: { width: 42, height: 42, borderRadius: RADIUS.md, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  itemVariant: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  itemPrice: { fontSize: 12.5, fontFamily: FONT.extraBold, color: theme.primary, marginTop: 2 },
  itemActions: { alignItems: 'flex-end', gap: 6 },
  removeBtn: { padding: 2 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', borderRadius: RADIUS.pill, paddingHorizontal: 6, paddingVertical: 3 },
  qtyBtn: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  qtyText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a', minWidth: 16, textAlign: 'center' },
  sectionLabel: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a', marginTop: 8 },
  addressInput: { backgroundColor: '#ffffff', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e2e8f0', padding: 12, fontSize: 13, fontFamily: FONT.medium, color: '#0f172a', minHeight: 60, textAlignVertical: 'top' },
  addressChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 8 },
  addressChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: theme.primary, backgroundColor: '#ffffff' },
  addressChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: theme.primary },
  addAddressLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6, marginBottom: 8 },
  addAddressLinkText: { fontSize: 12, fontFamily: FONT.semiBold },
  couponRow: { flexDirection: 'row', gap: 8 },
  couponInput: { flex: 1, minHeight: 44 },
  applyCouponBtn: { paddingHorizontal: 18, borderRadius: RADIUS.md, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  applyCouponBtnText: { color: theme.primary, fontSize: 13, fontFamily: FONT.bold },
  couponAppliedRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bbf7d0', paddingVertical: 10, paddingHorizontal: 12 },
  couponAppliedText: { flex: 1, fontSize: 12.5, fontFamily: FONT.semiBold, color: '#15803d' },
  paymentMethodRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  paymentMethodChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: theme.primary,
    backgroundColor: '#ffffff',
  },
  paymentMethodChipActive: { backgroundColor: theme.primary },
  paymentMethodChipText: { fontSize: 12.5, fontFamily: FONT.bold, color: theme.primary },
  footer: { padding: SPACING.xxl, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8 },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  totalLabel: { fontSize: 13, fontFamily: FONT.semiBold, color: '#64748b' },
  subtotalValue: { fontSize: 13.5, fontFamily: FONT.bold, color: '#334155' },
  discountValue: { fontSize: 13.5, fontFamily: FONT.bold, color: '#16a34a' },
  totalValue: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  checkoutBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center' },
  checkoutBtnText: { color: '#ffffff', fontSize: 15, fontFamily: FONT.bold },
});
