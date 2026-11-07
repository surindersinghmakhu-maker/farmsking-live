import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useCart } from '@/src/store/cart-context';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useCreateOrder, useInitiateCashfreePayment } from '@/src/hooks/useOrders';
import { useCouponPreview } from '@/src/hooks/useCoupons';
import { useMyWallet } from '@/src/hooks/useWallet';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useMyAddresses, useSetDefaultAddress } from '@/src/hooks/useAddresses';
import type { CustomerAddress } from '@/src/api/addresses.api';
import AddAddressModal from '@/src/components/AddAddressModal';

const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export default function CartScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors: tConfig } = useExecutiveTheme();
  const { items, itemCount, subtotal, updateQuantity, removeItem, clearCart } = useCart();
  const { data: wallet } = useMyWallet();
  const { data: settings } = useAppSettings();
  const { data: addresses } = useMyAddresses();
  const setDefaultAddressMutation = useSetDefaultAddress();

  const createOrder = useCreateOrder();
  const initiateCashfree = useInitiateCashfreePayment();
  const couponPreview = useCouponPreview();

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);

  // Address & modal state
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

  const composeAddress = (addr: CustomerAddress) => {
    const parts = [];
    if (addr.name) parts.push(`Name: ${addr.name}`);
    parts.push(addr.line);
    if (addr.postOffice) parts.push(`PO: ${addr.postOffice}`);
    if (addr.district) parts.push(addr.district);
    if (addr.state) parts.push(addr.state);
    if (addr.pincode) parts.push(`PIN: ${addr.pincode}`);
    const mob = addr.mobile || user?.mobile || (user as any)?.phone;
    if (mob) parts.push(`📞 ${mob}`);
    return parts.join(', ');
  };

  // Delivery & payment state
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'ONLINE'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  React.useEffect(() => {
    if (Array.isArray(addresses) && addresses.length > 0) {
      const currentExists = selectedAddressId ? addresses.find((a) => a.id === selectedAddressId) : null;
      if (!currentExists) {
        const target = addresses.find((a) => a.isDefault) || addresses[0];
        setSelectedAddressId(target.id);
        setDeliveryAddress(composeAddress(target));
      }
    } else {
      setSelectedAddressId(null);
      setDeliveryAddress('');
    }
  }, [addresses, selectedAddressId]);

  const walletBalance = Number(wallet?.balance || 0);

  // Delivery fee rules: Free for >= 999, else 100
  const deliveryFeeAmount = subtotal >= 999 || items.length === 0 ? 0 : 100;
  const discountAmount = appliedDiscount?.amount || 0;
  const billTotalBeforeWallet = Math.max(0, subtotal + deliveryFeeAmount - discountAmount);
  const walletDeduction = useWalletBalance ? Math.min(walletBalance, billTotalBeforeWallet) : 0;
  const finalPayableAmount = Math.max(0, billTotalBeforeWallet - walletDeduction);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponError(null);
    try {
      tap();
      const res = await couponPreview.mutateAsync({
        code: couponCode.trim().toUpperCase(),
        orderTotal: subtotal,
      });
      const discount = Number((res as any)?.discount || (res as any)?.discountAmount || 0);
      if (discount > 0) {
        setAppliedDiscount({ code: couponCode.trim().toUpperCase(), amount: discount });
        setCouponError(null);
      } else {
        setCouponError('Invalid coupon code or minimum order amount not met.');
      }
    } catch (err: any) {
      setCouponError(err?.response?.data?.message || err?.message || 'Invalid coupon code.');
    }
  };

  const handleRemoveCoupon = () => {
    tap();
    setAppliedDiscount(null);
    setCouponCode('');
    setCouponError(null);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!Array.isArray(addresses) || addresses.length === 0 || !deliveryAddress.trim()) {
      setCheckoutError('Please add a delivery address to place your order.');
      setEditingAddress(null);
      setIsAddressModalOpen(true);
      return;
    }
    setCheckoutError(null);
    setIsPlacingOrder(true);

    try {
      tap();
      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        deliveryAddress: deliveryAddress.trim(),
        couponCode: appliedDiscount?.code || couponCode.trim() || undefined,
        paymentMode: paymentMethod,
        useWalletBalance,
      } as any);

      if (paymentMethod === 'ONLINE') {
        try {
          const res = await initiateCashfree.mutateAsync({ id: order.id });
          if (res?.paymentSessionId) {
            const checkoutUrl = `https://payments.cashfree.com/order/#${res.paymentSessionId}`;
            if (Platform.OS === 'web') {
              window.location.href = checkoutUrl;
              return;
            } else {
              await Linking.openURL(checkoutUrl);
            }
          }
        } catch (e: any) {
          console.warn('Cashfree payment failed to initiate:', e);
          setCheckoutError('Payment gateway could not initiate. Order is created in Orders list.');
        }
      }

      const placedOrderNum = order?.orderNumber || 'PLACED';
      clearCart();
      setCouponCode('');
      setAppliedDiscount(null);

      const msg = `Order #${placedOrderNum} confirmed successfully! Total: ₹${finalPayableAmount.toLocaleString('en-IN')}`;
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Order Confirmed 🎉', msg);
      }

      // Open orders tab
      router.push('/(user)/(tabs)/orders' as any);

      // WhatsApp confirmation trigger
      const shopPhone = (settings as any)?.phone || '919876543210';
      const waMsg = `Hello FarmsKing! I have placed Order #${placedOrderNum} for ₹${finalPayableAmount.toLocaleString('en-IN')}.\nDelivery Address: ${deliveryAddress.trim()}\nPayment: ${paymentMethod}`;
      setTimeout(() => {
        Linking.openURL(`https://wa.me/${shopPhone}?text=${encodeURIComponent(waMsg)}`).catch(() => {});
      }, 700);
    } catch (err: any) {
      console.error('Order placement error:', err);
      const serverMsg = err?.response?.data?.message || err?.message || 'Could not place order. Please try again.';
      setCheckoutError(Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: tConfig.bg }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* 🌾 Hero Header */}
      <LinearGradient colors={['#0a2417', '#0f3923', '#15803d']} style={styles.heroBanner}>
        <View style={styles.heroInner}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={styles.heroBadge}>
              <Ionicons name="cart" size={24} color="#4ade80" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>My Shopping Cart</Text>
              <Text style={styles.heroSubtitle}>100% Genuine Certified Seeds, Nutrition & Tools</Text>
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* 🛒 Cart Items Container */}
      <View style={styles.mainWrapper}>
        <View style={styles.cartCard}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="bag-handle-outline" size={20} color="#15803d" />
              <Text style={styles.cardTitle}>Cart Items ({itemCount})</Text>
            </View>
            {items.length > 0 && (
              <TouchableOpacity onPress={clearCart} style={styles.clearBtn} activeOpacity={0.8}>
                <Ionicons name="trash-outline" size={15} color="#dc2626" />
                <Text style={styles.clearBtnText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {items.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="cart-outline" size={46} color="#94a3b8" />
              </View>
              <Text style={styles.emptyTitle}>Your shopping cart is empty</Text>
              <Text style={styles.emptySubtitle}>
                Explore certified seeds, fertilizers, organic pesticides and tools from our official AgriStore.
              </Text>
              <TouchableOpacity
                style={styles.browseStoreBtn}
                activeOpacity={0.85}
                onPress={() => {
                  tap();
                  router.push('/(user)/(tabs)/shop');
                }}
              >
                <Ionicons name="storefront-outline" size={18} color="#ffffff" />
                <Text style={styles.browseStoreBtnText}>Browse Agri Store</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              {items.map((item) => (
                <View key={item.productId} style={styles.itemRow}>
                  <View style={styles.itemIconBox}>
                    <Ionicons name="cube-outline" size={24} color="#15803d" />
                  </View>
                  <View style={{ flex: 1, paddingHorizontal: 8 }}>
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    {item.unit ? <Text style={styles.itemUnit}>Pack: {item.unit}</Text> : null}
                    <Text style={styles.itemPrice}>₹{item.price.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => removeItem(item.productId)}
                      style={styles.deleteItemBtn}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="trash-outline" size={16} color="#ef4444" />
                    </TouchableOpacity>
                    <View style={styles.stepperBox}>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                        style={styles.stepperBtn}
                      >
                        <Ionicons name="remove" size={14} color="#334155" />
                      </TouchableOpacity>
                      <Text style={styles.stepperCount}>{item.quantity}</Text>
                      <TouchableOpacity
                        onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                        style={styles.stepperBtn}
                      >
                        <Ionicons name="add" size={14} color="#334155" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* 🧾 Bill Summary, Coupons, Address & Checkout */}
        {items.length > 0 && (
          <View style={styles.checkoutWrapper}>
            {/* 🎟️ Discount Coupon Box */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons name="pricetag-outline" size={18} color="#15803d" />
                <Text style={styles.sectionTitle}>Apply Discount Coupon</Text>
              </View>

              {appliedDiscount ? (
                <View style={styles.appliedCouponPill}>
                  <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                  <Text style={styles.appliedCouponText}>
                    Code <Text style={{ fontFamily: FONT.extraBold }}>'{appliedDiscount.code}'</Text> applied — ₹
                    {appliedDiscount.amount} Off
                  </Text>
                  <TouchableOpacity onPress={handleRemoveCoupon}>
                    <Ionicons name="close-circle" size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.couponInputRow}>
                  <TextInput
                    style={styles.couponInput}
                    placeholder="Enter Coupon Code (e.g. KISAAN50)"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="characters"
                    value={couponCode}
                    onChangeText={setCouponCode}
                  />
                  <TouchableOpacity
                    style={styles.applyCouponBtn}
                    activeOpacity={0.8}
                    disabled={!couponCode.trim() || couponPreview.isPending}
                    onPress={handleApplyCoupon}
                  >
                    {couponPreview.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.applyCouponBtnText}>Apply</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
              {couponError ? <Text style={styles.couponErrorText}>{couponError}</Text> : null}
            </View>

            {/* 📍 Delivery Destination Address Box */}
            <View style={styles.card}>
              <View style={[styles.sectionHeader, { justifyContent: 'space-between' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="location-outline" size={18} color="#15803d" />
                  <Text style={styles.sectionTitle}>Delivery Destination Address</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    tap();
                    setEditingAddress(null);
                    setIsAddressModalOpen(true);
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#15803d' }}>+ Add New</Text>
                </TouchableOpacity>
              </View>

              {Array.isArray(addresses) && addresses.length > 0 ? (
                <View style={{ gap: 8, marginTop: 4 }}>
                  {addresses.map((addr) => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'flex-start',
                          gap: 10,
                          padding: 10,
                          borderRadius: RADIUS.md,
                          borderWidth: 1.5,
                          borderColor: isSelected ? '#15803d' : '#cbd5e1',
                          backgroundColor: isSelected ? '#f0fdf4' : '#ffffff',
                        }}
                        onPress={() => {
                          tap();
                          setSelectedAddressId(addr.id);
                          setDeliveryAddress(composeAddress(addr));
                        }}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={20}
                          color={isSelected ? '#15803d' : '#94a3b8'}
                          style={{ marginTop: 2 }}
                        />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isSelected ? '#15803d' : '#0f172a' }}>
                              🏷️ {addr.tag || 'Address'}
                            </Text>
                            {addr.isDefault && (
                              <View style={{ backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#b45309' }}>⭐ DEFAULT</Text>
                              </View>
                            )}
                            {isSelected && (
                              <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#15803d' }}>SELECTED</Text>
                              </View>
                            )}
                          </View>
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#334155', marginTop: 2, lineHeight: 16 }}>
                            {composeAddress(addr)}
                          </Text>
                          {!addr.isDefault && (
                            <TouchableOpacity
                              style={{ marginTop: 6, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }}
                              onPress={async (e) => {
                                e.stopPropagation();
                                tap();
                                await setDefaultAddressMutation.mutateAsync(addr.id);
                                setSelectedAddressId(addr.id);
                                setDeliveryAddress(composeAddress(addr));
                              }}
                            >
                              <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#0369a1' }}>⭐ Set as Default</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                        <TouchableOpacity
                          style={{ padding: 4 }}
                          onPress={(e) => {
                            e.stopPropagation();
                            tap();
                            setEditingAddress(addr);
                            setIsAddressModalOpen(true);
                          }}
                        >
                          <Ionicons name="pencil" size={16} color={isSelected ? '#15803d' : '#64748b'} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : (
                <View style={{ padding: 14, backgroundColor: '#fef2f2', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#fca5a5', gap: 8, marginTop: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="alert-circle" size={18} color="#dc2626" />
                    <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#991b1b' }}>No Delivery Address Added</Text>
                  </View>
                  <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#7f1d1d' }}>
                    Please add your delivery address before confirming the order.
                  </Text>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: '#15803d', borderRadius: RADIUS.sm, marginTop: 4 }}
                    onPress={() => {
                      tap();
                      setEditingAddress(null);
                      setIsAddressModalOpen(true);
                    }}
                  >
                    <Ionicons name="add-circle" size={18} color="#ffffff" />
                    <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' }}>Add Delivery Address Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* 💳 Payment Method Box */}
            <View style={styles.card}>
              <View style={styles.sectionHeader}>
                <Ionicons name="card-outline" size={18} color="#15803d" />
                <Text style={styles.sectionTitle}>Select Payment Method</Text>
              </View>

              <View style={{ gap: 8 }}>
                <TouchableOpacity
                  style={[styles.payOption, paymentMethod === 'COD' && styles.payOptionActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setPaymentMethod('COD');
                  }}
                >
                  <Ionicons
                    name={paymentMethod === 'COD' ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={paymentMethod === 'COD' ? '#15803d' : '#94a3b8'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payOptionTitle}>Cash on Delivery (COD)</Text>
                    <Text style={styles.payOptionSub}>Pay cash when products are delivered to your doorstep</Text>
                  </View>
                  <View style={styles.verifiedTag}>
                    <Text style={styles.verifiedTagText}>Safe & Verified</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.payOption, paymentMethod === 'ONLINE' && styles.payOptionActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setPaymentMethod('ONLINE');
                  }}
                >
                  <Ionicons
                    name={paymentMethod === 'ONLINE' ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={paymentMethod === 'ONLINE' ? '#15803d' : '#94a3b8'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.payOptionTitle}>Instant Online / UPI / Cards</Text>
                    <Text style={styles.payOptionSub}>Zero gateway fee via UPI, Google Pay, PhonePe & NetBanking</Text>
                  </View>
                  <Ionicons name="flash" size={16} color="#f59e0b" />
                </TouchableOpacity>
              </View>

              {walletBalance > 0 && (
                <TouchableOpacity
                  style={[styles.walletBox, useWalletBalance && styles.walletBoxActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    tap();
                    setUseWalletBalance(!useWalletBalance);
                  }}
                >
                  <Ionicons
                    name={useWalletBalance ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={useWalletBalance ? '#15803d' : '#64748b'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.walletTitle}>Use FarmsKing Royal Wallet Balance</Text>
                    <Text style={styles.walletSub}>Available Balance: ₹{walletBalance.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.walletDeduct}>-₹{walletDeduction.toLocaleString('en-IN')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 🧾 Live Bill Summary Card */}
            <View style={[styles.card, styles.billCard]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="receipt-outline" size={18} color="#0f172a" />
                <Text style={styles.sectionTitle}>Order Bill Summary</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Items Subtotal:</Text>
                <Text style={styles.billValue}>₹{subtotal.toLocaleString('en-IN')}</Text>
              </View>

              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Delivery Fee:</Text>
                <Text style={[styles.billValue, deliveryFeeAmount === 0 && { color: '#16a34a' }]}>
                  {deliveryFeeAmount === 0 ? 'FREE (Order >= ₹999) 🎉' : '+₹100 (Free above ₹999)'}
                </Text>
              </View>

              {discountAmount > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: '#16a34a' }]}>Coupon Discount:</Text>
                  <Text style={[styles.billValue, { color: '#16a34a' }]}>-₹{discountAmount.toLocaleString('en-IN')}</Text>
                </View>
              )}

              {walletDeduction > 0 && (
                <View style={styles.billRow}>
                  <Text style={[styles.billLabel, { color: '#0284c7' }]}>Wallet Deduction:</Text>
                  <Text style={[styles.billValue, { color: '#0284c7' }]}>-₹{walletDeduction.toLocaleString('en-IN')}</Text>
                </View>
              )}

              <View style={styles.billDivider} />

              <View style={styles.billTotalRow}>
                <Text style={styles.billTotalLabel}>Final Payable Total:</Text>
                <Text style={styles.billTotalValue}>₹{finalPayableAmount.toLocaleString('en-IN')}</Text>
              </View>

              {checkoutError ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={16} color="#dc2626" />
                  <Text style={styles.errorText}>{checkoutError}</Text>
                </View>
              ) : null}

              {/* Confirm Order Button */}
              <TouchableOpacity
                style={styles.confirmOrderBtn}
                activeOpacity={0.85}
                disabled={isPlacingOrder}
                onPress={handlePlaceOrder}
              >
                {isPlacingOrder ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark-done" size={20} color="#ffffff" />
                    <Text style={styles.confirmOrderBtnText}>
                      Confirm Order — ₹{finalPayableAmount.toLocaleString('en-IN')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <AddAddressModal
        visible={isAddressModalOpen}
        editingAddress={editingAddress}
        onClose={() => {
          setIsAddressModalOpen(false);
          setEditingAddress(null);
        }}
        onSaved={(newAddr) => {
          setSelectedAddressId(newAddr.id);
          setDeliveryAddress(composeAddress(newAddr));
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 60,
  },
  heroBanner: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  heroInner: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
  },
  heroBadge: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  heroSubtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#86efac',
    marginTop: 2,
  },
  mainWrapper: {
    maxWidth: 1100,
    width: '100%',
    alignSelf: 'center',
    padding: 16,
    gap: 16,
  },
  cartCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'sm'),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#dc2626',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 36,
    paddingHorizontal: 16,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 380,
    lineHeight: 18,
    marginBottom: 18,
  },
  browseStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  browseStoreBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.sm,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  itemUnit: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
    marginTop: 2,
  },
  deleteItemBtn: {
    padding: 2,
  },
  stepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  stepperBtn: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperCount: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
    minWidth: 16,
    textAlign: 'center',
  },
  checkoutWrapper: {
    gap: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...premiumShadow('#0f172a', 'sm'),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  appliedCouponPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  appliedCouponText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#15803d',
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  applyCouponBtn: {
    backgroundColor: '#15803d',
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyCouponBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  couponErrorText: {
    color: '#dc2626',
    fontSize: 11.5,
    fontFamily: FONT.medium,
    marginTop: 6,
  },
  savedAddrChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  savedAddrChipSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  savedAddrText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  savedAddrTextSelected: {
    color: '#065f46',
    fontFamily: FONT.bold,
  },
  addressInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    padding: 12,
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlignVertical: 'top',
    minHeight: 70,
  },
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  payOptionActive: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  payOptionTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  payOptionSub: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#64748b',
    marginTop: 1,
  },
  verifiedTag: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#065f46',
  },
  walletBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
    marginTop: 6,
  },
  walletBoxActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  walletTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  walletSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  walletDeduct: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  billCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  billValue: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  billDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 8,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  billTotalLabel: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  billTotalValue: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: RADIUS.sm,
    marginBottom: 12,
  },
  errorText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#dc2626',
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    ...premiumShadow('#15803d', 'sm'),
  },
  confirmOrderBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
});
