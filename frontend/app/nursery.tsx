import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  Image,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { apiClient } from '@/src/api/client';
import { RADIUS, FONT, SPACING, premiumShadow } from '@/constants/theme';

type NurseryCategory =
  | 'ALL'
  | 'FLOWER_PLUG_EXPRESS'
  | 'VEGETABLE_PLUG'
  | 'PADDY_FIELD_BULK'
  | 'ORNAMENTAL_INDOOR'
  | 'AGRO_FORESTRY_TIMBER'
  | 'MEDICINAL_KITCHEN_HERB';

export default function NurseryMarketplaceScreen() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  // Authentication Guard: strictly secure /nursery behind user login
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/(auth)/login?redirect=/nursery');
    }
  }, [user, isAuthLoading]);

  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<NurseryCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Booking Modal State
  const [selectedBatch, setSelectedBatch] = useState<any | null>(null);
  const [bookingQty, setBookingQty] = useState<number>(1);
  const [targetDeliveryDate, setTargetDeliveryDate] = useState<string>('');
  const [transportMode, setTransportMode] = useState<'ROADWAYS_BUS_PARCEL' | 'INDIAN_RAILWAYS' | 'TRACTOR_TROLLEY_LOCAL'>('ROADWAYS_BUS_PARCEL');
  const [deliveryMode, setDeliveryMode] = useState<'BUS_STAND_SELF_PICKUP' | 'RAILWAY_STATION_PICKUP' | 'DOORSTEP_DELIVERY'>('BUS_STAND_SELF_PICKUP');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // My Orders Modal State
  const [myOrdersModalVisible, setMyOrdersModalVisible] = useState(false);
  const [myOrders, setMyOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Delivery OTP Confirmation Modal
  const [confirmModalOrder, setConfirmModalOrder] = useState<any | null>(null);
  const [otpInput, setOtpInput] = useState('');
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [qualityRating, setQualityRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);

  // Date Extension Modal
  const [extendModalOrder, setExtendModalOrder] = useState<any | null>(null);
  const [extendedDateInput, setExtendedDateInput] = useState('');
  const [isExtendingDate, setIsExtendingDate] = useState(false);

  // Cancellation Modal
  const [cancelModalOrder, setCancelModalOrder] = useState<any | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancellingOrder, setIsCancellingOrder] = useState(false);

  useEffect(() => {
    if (user) {
      fetchBatches();
    }
  }, [selectedCategory, user]);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory !== 'ALL' ? `?category=${selectedCategory}` : '';
      const res = await apiClient.get(`/nursery/batches${catParam}`);
      if (res.data?.items) {
        setBatches(res.data.items);
      } else if (Array.isArray(res.data)) {
        setBatches(res.data);
      } else {
        // Fallback mock seeds if database is fresh
        setBatches(getSeedBatches());
      }
    } catch (err) {
      console.warn('Failed to load nursery batches, loading curated certified stock:', err);
      setBatches(getSeedBatches());
    } finally {
      setLoading(false);
    }
  };

  const fetchMyOrders = async () => {
    try {
      setLoadingOrders(true);
      const res = await apiClient.get('/nursery/my-orders');
      if (Array.isArray(res.data)) {
        setMyOrders(res.data);
      }
    } catch (err) {
      console.warn('Failed to load buyer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleOpenMyOrders = () => {
    setMyOrdersModalVisible(true);
    fetchMyOrders();
  };

  const handleOpenBooking = (batch: any) => {
    setSelectedBatch(batch);
    const minQty = batch.category === 'PADDY_FIELD_BULK' ? 1 : 2; // minimum 2 trays for flowers/veg
    setBookingQty(minQty);
    // Default delivery date: readyDate or 3 days from now
    const d = new Date(batch.readyDate || Date.now() + 86400000 * 3);
    setTargetDeliveryDate(d.toISOString().split('T')[0]);
    if (batch.category === 'PADDY_FIELD_BULK') {
      setTransportMode('TRACTOR_TROLLEY_LOCAL');
      setDeliveryMode('DOORSTEP_DELIVERY');
    } else {
      setTransportMode('ROADWAYS_BUS_PARCEL');
      setDeliveryMode('BUS_STAND_SELF_PICKUP');
    }
  };

  const orderCalculations = useMemo(() => {
    if (!selectedBatch) return { subtotal: 0, platformFee: 100, totalPayable: 0, isMinMet: false };
    const unitPrice = Number(selectedBatch.pricePerUnit || 1000);
    const subtotal = unitPrice * bookingQty;
    const platformFee = 100;
    const totalPayable = subtotal + platformFee;
    const minRequired = Number(selectedBatch.minOrderAmount || 2000);
    return {
      subtotal,
      platformFee,
      totalPayable,
      isMinMet: subtotal >= minRequired,
      minRequired,
    };
  }, [selectedBatch, bookingQty]);

  const handlePlaceOrder = async () => {
    if (!selectedBatch) return;
    if (!orderCalculations.isMinMet) {
      Alert.alert(
        'Minimum Order Required',
        `The minimum order amount for this nursery batch is ₹${(orderCalculations.minRequired ?? 2000).toLocaleString('en-IN')}. Please increase your quantity.`,
      );
      return;
    }

    try {
      setIsSubmittingOrder(true);
      const payload = {
        batchId: selectedBatch.id,
        quantityUnits: bookingQty,
        requestedDeliveryDate: new Date(targetDeliveryDate).toISOString(),
        transportMode,
        deliveryMode,
        notes: bookingNotes.trim() || undefined,
      };

      const res = await apiClient.post('/nursery/orders', payload);
      Alert.alert(
        'Booking Confirmed!',
        `Your nursery order #${res.data?.orderNumber || 'FK-NB-2026'} has been placed with Escrow Protection.\n\nYour 4-digit Delivery OTP is ${res.data?.deliveryOtp || 'sent via SMS'}. Please inspect seedlings upon arrival before sharing OTP.`,
      );
      setSelectedBatch(null);
      fetchBatches();
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to place booking.';
      Alert.alert('Booking Error', msg);
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!confirmModalOrder) return;
    if (otpInput.trim().length !== 4) {
      Alert.alert('Invalid OTP', 'Please enter the exact 4-digit verification code.');
      return;
    }

    try {
      setIsConfirmingDelivery(true);
      await apiClient.post(`/nursery/orders/${confirmModalOrder.id}/confirm-delivery`, {
        deliveryOtp: otpInput.trim(),
        deliveryRating,
        plantQualityRating: qualityRating,
        reviewText: reviewComment.trim() || undefined,
      });

      Alert.alert('Delivery Verified', 'Thank you! Payout released to the nursery grower.');
      setConfirmModalOrder(null);
      setOtpInput('');
      fetchMyOrders();
    } catch (err: any) {
      Alert.alert('Verification Failed', err.response?.data?.message || 'Invalid delivery OTP.');
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  const handleExtendDeliveryDate = async () => {
    if (!extendModalOrder) return;
    if (!extendedDateInput) {
      Alert.alert('Date Required', 'Please select a valid new delivery date.');
      return;
    }

    try {
      setIsExtendingDate(true);
      await apiClient.post(`/nursery/orders/${extendModalOrder.id}/extend-date`, {
        newDeliveryDate: new Date(extendedDateInput).toISOString(),
        reason: 'Farmer field readiness adjustment',
      });

      Alert.alert('Date Extended', 'Your delivery date has been updated at ₹0 fee.');
      setExtendModalOrder(null);
      fetchMyOrders();
    } catch (err: any) {
      Alert.alert('Date Extension Error', err.response?.data?.message || 'Cannot extend date within 48h of dispatch.');
    } finally {
      setIsExtendingDate(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelModalOrder) return;
    if (cancelReason.trim().length < 5) {
      Alert.alert('Reason Required', 'Please provide a clear reason for cancellation.');
      return;
    }

    try {
      setIsCancellingOrder(true);
      const res = await apiClient.post(`/nursery/orders/${cancelModalOrder.id}/cancel`, {
        reason: cancelReason.trim(),
      });

      Alert.alert(
        'Order Cancelled',
        `Cancellation processed under 3-tier rules.\nFee Deducted: ₹${res.data?.cancellationFee || 0}\nRefund to Account: ₹${res.data?.refundAmountToFarmer || 0}`,
      );
      setCancelModalOrder(null);
      setCancelReason('');
      fetchMyOrders();
    } catch (err: any) {
      Alert.alert('Cancellation Error', err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setIsCancellingOrder(false);
    }
  };

  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase();
    return batches.filter(
      (b) =>
        b.varietyName?.toLowerCase().includes(q) ||
        b.owner?.name?.toLowerCase().includes(q) ||
        b.owner?.district?.toLowerCase().includes(q),
    );
  }, [batches, searchQuery]);

  if (isAuthLoading || !user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Verifying secure login credentials...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#070c18" />

      {/* ─── Top Institutional Navigation Bar ─── */}
      <View style={styles.navbar}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#e2e8f0" />
          </TouchableOpacity>
          <View>
            <View style={styles.brandTitleRow}>
              <Text style={styles.brandTitle}>FarmsKing</Text>
              <View style={styles.brandBadge}>
                <Text style={styles.brandBadgeText}>NURSERY EXPRESS</Text>
              </View>
            </View>
            <Text style={styles.brandSub}>
              Direct Certified Plant Seedling Marketplace · 100% Escrow Protected
            </Text>
          </View>
        </View>

        <View style={styles.navRight}>
          <TouchableOpacity style={styles.myOrdersBtn} onPress={handleOpenMyOrders}>
            <Ionicons name="receipt-outline" size={17} color="#22c55e" />
            <Text style={styles.myOrdersBtnText}>My Bookings</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ─── Top Telemetry & Compliance Strip ─── */}
        <View style={styles.telemetryStrip}>
          <View style={styles.telemetryItem}>
            <MaterialCommunityIcons name="shield-check" size={18} color="#22c55e" />
            <Text style={styles.telemetryTitle}>100% Escrow Shield</Text>
            <Text style={styles.telemetryDesc}>Payout held till pre-unload check</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <MaterialCommunityIcons name="bus" size={18} color="#38bdf8" />
            <Text style={styles.telemetryTitle}>Express Bus & Train</Text>
            <Text style={styles.telemetryDesc}>Ventilated cartons across states</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <MaterialCommunityIcons name="certificate" size={18} color="#fbbf24" />
            <Text style={styles.telemetryTitle}>0% GST (HSN 0602)</Text>
            <Text style={styles.telemetryDesc}>Official computer delivery challan</Text>
          </View>
          <View style={styles.telemetryDivider} />
          <View style={styles.telemetryItem}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color="#a855f7" />
            <Text style={styles.telemetryTitle}>Free Date Extension</Text>
            <Text style={styles.telemetryDesc}>₹0 fee before 48h dispatch</Text>
          </View>
        </View>

        {/* ─── Search & Category Selector ─── */}
        <View style={styles.searchSection}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#64748b" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search flower seedlings, tomato plugs, PR-126 paddy, or grower location..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
            {CATEGORY_ITEMS.map((item) => {
              const isSelected = selectedCategory === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
                  onPress={() => setSelectedCategory(item.key as NurseryCategory)}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={16}
                    color={isSelected ? '#070c18' : '#94a3b8'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.categoryTabText, isSelected && styles.categoryTabTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Batch Listings Grid ─── */}
        <View style={styles.mainContainer}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionHeading}>Available Seedling Batches</Text>
              <Text style={styles.sectionSubheading}>
                Freshly germinated true-to-type crops ready for delivery
              </Text>
            </View>
            <Text style={styles.countBadge}>{filteredBatches.length} Batches Active</Text>
          </View>

          {loading ? (
            <View style={styles.inlineLoading}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Fetching certified nursery inventory...</Text>
            </View>
          ) : filteredBatches.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="sprout-outline" size={48} color="#475569" />
              <Text style={styles.emptyTitle}>No Seedling Batches Found</Text>
              <Text style={styles.emptySub}>
                There are no active batches under this category matching your search criteria.
              </Text>
            </View>
          ) : (
            <View style={styles.cardsGrid}>
              {filteredBatches.map((batch) => {
                const isPaddy = batch.category === 'PADDY_FIELD_BULK';
                const unitLabel = isPaddy ? 'Acre' : `Tray (${batch.trayCavityCount || 104} Plugs)`;
                const ageDays = calculateSeedlingAge(batch.sowingDate);

                return (
                  <View key={batch.id} style={styles.batchCard}>
                    {/* Card Top Image & Badges */}
                    <View style={styles.cardImageWrapper}>
                      <Image
                        source={{ uri: batch.seedTagPhotoUrl || batch.sowingPhotoUrl || getPlaceholderImage(batch.category) }}
                        style={styles.cardImage}
                        resizeMode="cover"
                      />
                      <View style={styles.imageOverlayTop}>
                        <View style={styles.categoryBadge}>
                          <Text style={styles.categoryBadgeText}>{formatCategoryName(batch.category)}</Text>
                        </View>
                        {batch.isFlashSaleActive && (
                          <View style={styles.flashBadge}>
                            <MaterialCommunityIcons name="lightning-bolt" size={12} color="#ffffff" />
                            <Text style={styles.flashBadgeText}>FLASH SALE</Text>
                          </View>
                        )}
                      </View>

                      {batch.isSeedCertified && (
                        <View style={styles.certifiedBadge}>
                          <MaterialCommunityIcons name="check-decagram" size={14} color="#22c55e" />
                          <Text style={styles.certifiedBadgeText}>Certified Seed Tag</Text>
                        </View>
                      )}
                    </View>

                    {/* Card Body */}
                    <View style={styles.cardBody}>
                      <View style={styles.varietyHeader}>
                        <Text style={styles.varietyTitle} numberOfLines={1}>
                          {batch.varietyName}
                        </Text>
                        <View style={styles.ratingPill}>
                          <Ionicons name="star" size={12} color="#fbbf24" />
                          <Text style={styles.ratingText}>{Number(batch.compositeCoreScore || 4.9).toFixed(1)}</Text>
                        </View>
                      </View>

                      {/* Grower & District */}
                      <View style={styles.growerRow}>
                        <MaterialCommunityIcons name="account-tie" size={15} color="#94a3b8" />
                        <Text style={styles.growerName} numberOfLines={1}>
                          {batch.owner?.name || 'Authorized Nursery Partner'} · {batch.owner?.district || 'Punjab'}
                        </Text>
                      </View>

                      {/* Agronomy Highlights */}
                      <View style={styles.agroHighlights}>
                        <View style={styles.agroItem}>
                          <MaterialCommunityIcons name="calendar-range" size={13} color="#38bdf8" />
                          <Text style={styles.agroText}>Age: {ageDays} Days Old</Text>
                        </View>
                        {isPaddy && (
                          <View style={styles.agroItem}>
                            <MaterialCommunityIcons name="grass" size={13} color="#22c55e" />
                            <Text style={styles.agroText}>300 Bundles/Acre</Text>
                          </View>
                        )}
                        <View style={styles.agroItem}>
                          <MaterialCommunityIcons name="truck-delivery" size={13} color="#fbbf24" />
                          <Text style={styles.agroText}>
                            {batch.deliveryPricingType === 'INCLUDED' ? 'Freight Included' : 'Self-Pickup'}
                          </Text>
                        </View>
                      </View>

                      {/* Pricing & Booking Footer */}
                      <View style={styles.cardFooter}>
                        <View>
                          <Text style={styles.priceLabel}>PRICE PER {unitLabel.toUpperCase()}</Text>
                          <View style={styles.priceRow}>
                            <Text style={styles.priceValue}>₹{Number(batch.pricePerUnit).toLocaleString('en-IN')}</Text>
                            <Text style={styles.priceUnit}> / {isPaddy ? 'Acre' : 'Tray'}</Text>
                          </View>
                        </View>

                        <TouchableOpacity style={styles.bookButton} onPress={() => handleOpenBooking(batch)}>
                          <Text style={styles.bookButtonText}>Book Seedlings</Text>
                          <Ionicons name="arrow-forward" size={14} color="#070c18" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* ─── Booking Modal ─── */}
      <Modal visible={Boolean(selectedBatch)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.bookingModalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>Book Nursery Seedlings</Text>
                <Text style={styles.modalHeaderSub}>
                  {selectedBatch?.varietyName} · {selectedBatch?.owner?.name}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedBatch(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#e2e8f0" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScroll}>
              {/* Quantity Counter */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Quantity ({selectedBatch?.category === 'PADDY_FIELD_BULK' ? 'Acres' : 'Trays'}):
                </Text>
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setBookingQty((prev) => Math.max(1, prev - 1))}
                  >
                    <Ionicons name="remove" size={18} color="#e2e8f0" />
                  </TouchableOpacity>
                  <Text style={styles.qtyDisplay}>{bookingQty}</Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() => setBookingQty((prev) => prev + 1)}
                  >
                    <Ionicons name="add" size={18} color="#e2e8f0" />
                  </TouchableOpacity>
                </View>
                {!orderCalculations.isMinMet && (
                  <Text style={styles.minWarningText}>
                    Minimum order amount is ₹{orderCalculations.minRequired ?? 2000}. Please select at least{' '}
                    {Math.ceil((orderCalculations.minRequired ?? 2000) / Number(selectedBatch?.pricePerUnit || 1000))}{' '}
                    units.
                  </Text>
                )}
              </View>

              {/* Delivery Date Picker */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Requested Delivery Date (YYYY-MM-DD):</Text>
                <TextInput
                  style={styles.modalInput}
                  value={targetDeliveryDate}
                  onChangeText={setTargetDeliveryDate}
                  placeholder="2026-06-25"
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Transport Mode Choice */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Express Transport Carrier:</Text>
                <View style={styles.choiceRow}>
                  <TouchableOpacity
                    style={[styles.choicePill, transportMode === 'ROADWAYS_BUS_PARCEL' && styles.choicePillActive]}
                    onPress={() => setTransportMode('ROADWAYS_BUS_PARCEL')}
                  >
                    <MaterialCommunityIcons
                      name="bus"
                      size={16}
                      color={transportMode === 'ROADWAYS_BUS_PARCEL' ? '#070c18' : '#e2e8f0'}
                    />
                    <Text
                      style={[
                        styles.choicePillText,
                        transportMode === 'ROADWAYS_BUS_PARCEL' && styles.choicePillTextActive,
                      ]}
                    >
                      Roadways Bus Parcel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.choicePill, transportMode === 'INDIAN_RAILWAYS' && styles.choicePillActive]}
                    onPress={() => setTransportMode('INDIAN_RAILWAYS')}
                  >
                    <MaterialCommunityIcons
                      name="train"
                      size={16}
                      color={transportMode === 'INDIAN_RAILWAYS' ? '#070c18' : '#e2e8f0'}
                    />
                    <Text
                      style={[
                        styles.choicePillText,
                        transportMode === 'INDIAN_RAILWAYS' && styles.choicePillTextActive,
                      ]}
                    >
                      Railways Express
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Delivery Mode Choice */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Delivery Handling:</Text>
                <View style={styles.choiceRow}>
                  <TouchableOpacity
                    style={[
                      styles.choicePill,
                      deliveryMode === 'BUS_STAND_SELF_PICKUP' && styles.choicePillActive,
                    ]}
                    onPress={() => setDeliveryMode('BUS_STAND_SELF_PICKUP')}
                  >
                    <Ionicons
                      name="walk"
                      size={16}
                      color={deliveryMode === 'BUS_STAND_SELF_PICKUP' ? '#070c18' : '#e2e8f0'}
                    />
                    <Text
                      style={[
                        styles.choicePillText,
                        deliveryMode === 'BUS_STAND_SELF_PICKUP' && styles.choicePillTextActive,
                      ]}
                    >
                      Bus Stand Pickup
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.choicePill, deliveryMode === 'DOORSTEP_DELIVERY' && styles.choicePillActive]}
                    onPress={() => setDeliveryMode('DOORSTEP_DELIVERY')}
                  >
                    <Ionicons
                      name="home"
                      size={16}
                      color={deliveryMode === 'DOORSTEP_DELIVERY' ? '#070c18' : '#e2e8f0'}
                    />
                    <Text
                      style={[
                        styles.choicePillText,
                        deliveryMode === 'DOORSTEP_DELIVERY' && styles.choicePillTextActive,
                      ]}
                    >
                      Doorstep Delivery
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Financial Breakdown Table */}
              <View style={styles.breakdownBox}>
                <Text style={styles.breakdownTitle}>Financial Breakdown & Central Escrow</Text>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>
                    Seedlings Subtotal ({bookingQty} units @ ₹{Number(selectedBatch?.pricePerUnit).toLocaleString('en-IN')})
                  </Text>
                  <Text style={styles.breakdownVal}>₹{orderCalculations.subtotal.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>FarmsKing Online Platform Fee</Text>
                  <Text style={styles.breakdownVal}>₹{orderCalculations.platformFee.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>FarmsKing Escrow Protection (5%)</Text>
                  <Text style={styles.breakdownGreen}>Included in Subtotal</Text>
                </View>
                <View style={styles.breakdownDivider} />
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownTotalLabel}>Total Escrow Amount</Text>
                  <Text style={styles.breakdownTotalVal}>₹{orderCalculations.totalPayable.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* 3-Tier Policy Notice */}
              <View style={styles.policyNotice}>
                <Ionicons name="information-circle" size={16} color="#38bdf8" style={{ marginRight: 6 }} />
                <Text style={styles.policyNoticeText}>
                  Safe Booking Policy: Free delivery date extension up to 48 hours before dispatch. Payout released to grower only when you confirm receipt via Delivery OTP.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.confirmOrderBtn, !orderCalculations.isMinMet && styles.btnDisabled]}
                disabled={!orderCalculations.isMinMet || isSubmittingOrder}
                onPress={handlePlaceOrder}
              >
                {isSubmittingOrder ? (
                  <ActivityIndicator size="small" color="#070c18" />
                ) : (
                  <>
                    <Text style={styles.confirmOrderBtnText}>
                      Confirm Booking & Pay ₹{orderCalculations.totalPayable.toLocaleString('en-IN')}
                    </Text>
                    <Ionicons name="shield-checkmark" size={16} color="#070c18" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── My Bookings / Orders Modal ─── */}
      <Modal visible={myOrdersModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ordersModalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderTitle}>My Nursery Bookings</Text>
                <Text style={styles.modalHeaderSub}>Escrow Protected Seedling Dispatches</Text>
              </View>
              <TouchableOpacity onPress={() => setMyOrdersModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#e2e8f0" />
              </TouchableOpacity>
            </View>

            {loadingOrders ? (
              <View style={styles.inlineLoading}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Loading your active bookings...</Text>
              </View>
            ) : myOrders.length === 0 ? (
              <View style={styles.emptyCard}>
                <MaterialCommunityIcons name="receipt" size={48} color="#475569" />
                <Text style={styles.emptyTitle}>No Orders Placed Yet</Text>
                <Text style={styles.emptySub}>Your booked seedling shipments will appear here.</Text>
              </View>
            ) : (
              <ScrollView contentContainerStyle={styles.ordersScroll}>
                {myOrders.map((ord) => (
                  <View key={ord.id} style={styles.orderCard}>
                    <View style={styles.orderCardHeader}>
                      <View>
                        <Text style={styles.orderNumberText}>{ord.orderNumber}</Text>
                        <Text style={styles.orderVarietyText}>{ord.batch?.varietyName}</Text>
                      </View>
                      <View style={[styles.statusPill, getStatusPillStyle(ord.status)]}>
                        <Text style={styles.statusPillText}>{formatStatus(ord.status)}</Text>
                      </View>
                    </View>

                    {/* OTP & Verification Box */}
                    <View style={styles.otpBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.otpLabel}>DELIVERY VERIFICATION OTP</Text>
                        <Text style={styles.otpValue}>{ord.deliveryOtp}</Text>
                        <Text style={styles.otpHint}>Inspect top sample bundles before sharing with driver</Text>
                      </View>
                      {!ord.isConfirmedReceived && ord.status !== 'CANCELLED' && (
                        <TouchableOpacity
                          style={styles.verifyOtpBtn}
                          onPress={() => {
                            setConfirmModalOrder(ord);
                            setOtpInput(ord.deliveryOtp);
                          }}
                        >
                          <Text style={styles.verifyOtpBtnText}>Confirm Received</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Logistics Telemetry */}
                    <View style={styles.orderTelemetry}>
                      <View style={styles.orderTeleRow}>
                        <Text style={styles.orderTeleKey}>Grower Partner:</Text>
                        <Text style={styles.orderTeleVal}>{ord.batch?.owner?.name} ({ord.batch?.owner?.mobile})</Text>
                      </View>
                      <View style={styles.orderTeleRow}>
                        <Text style={styles.orderTeleKey}>Target Delivery Date:</Text>
                        <Text style={styles.orderTeleVal}>
                          {new Date(ord.requestedDeliveryDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      {ord.busNumber && (
                        <View style={styles.orderTeleRow}>
                          <Text style={styles.orderTeleKey}>Bus Transit:</Text>
                          <Text style={styles.orderTeleVal}>
                            {ord.busNumber} · Conductor: {ord.busConductorMobile || 'On Board'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Actions Row */}
                    {!ord.isConfirmedReceived && ord.status === 'BOOKED_ESCROW_PAID' && (
                      <View style={styles.orderActionsRow}>
                        <TouchableOpacity
                          style={styles.extendBtn}
                          onPress={() => {
                            setExtendModalOrder(ord);
                            setExtendedDateInput(ord.requestedDeliveryDate.split('T')[0]);
                          }}
                        >
                          <Ionicons name="calendar" size={14} color="#38bdf8" style={{ marginRight: 4 }} />
                          <Text style={styles.extendBtnText}>Extend Date (₹0)</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => setCancelModalOrder(ord)}
                        >
                          <Ionicons name="close-circle" size={14} color="#f87171" style={{ marginRight: 4 }} />
                          <Text style={styles.cancelBtnText}>Cancel Booking</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ─── Confirm Received & Star Rating Modal ─── */}
      <Modal visible={Boolean(confirmModalOrder)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalBox}>
            <Text style={styles.modalHeaderTitle}>Confirm Seedling Delivery</Text>
            <Text style={styles.modalHeaderSub}>
              Confirming releases escrow payout to the nursery grower
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Enter 4-Digit Delivery OTP:</Text>
              <TextInput
                style={[styles.modalInput, { fontSize: 24, textAlign: 'center', letterSpacing: 8, fontFamily: FONT.bold }]}
                value={otpInput}
                onChangeText={setOtpInput}
                maxLength={4}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.ratingSection}>
              <Text style={styles.ratingSectionTitle}>Delivery Service Rating</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setDeliveryRating(s)}>
                    <Ionicons
                      name={s <= deliveryRating ? 'star' : 'star-outline'}
                      size={28}
                      color="#fbbf24"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.ratingSectionTitle}>Plant & Root Quality Rating</Text>
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <TouchableOpacity key={s} onPress={() => setQualityRating(s)}>
                    <Ionicons
                      name={s <= qualityRating ? 'star' : 'star-outline'}
                      size={28}
                      color="#22c55e"
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={[styles.modalInput, { marginTop: 12 }]}
                placeholder="Optional review feedback..."
                placeholderTextColor="#64748b"
                value={reviewComment}
                onChangeText={setReviewComment}
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setConfirmModalOrder(null)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleConfirmReceived}
                disabled={isConfirmingDelivery}
              >
                {isConfirmingDelivery ? (
                  <ActivityIndicator size="small" color="#070c18" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Release Escrow & Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Date Extension Modal ─── */}
      <Modal visible={Boolean(extendModalOrder)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalBox}>
            <Text style={styles.modalHeaderTitle}>Free Date Extension</Text>
            <Text style={styles.modalHeaderSub}>
              Must be at least 48 hours prior to scheduled dispatch and before the grower harvest deadline.
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>New Proposed Delivery Date (YYYY-MM-DD):</Text>
              <TextInput
                style={styles.modalInput}
                value={extendedDateInput}
                onChangeText={setExtendedDateInput}
                placeholder="2026-06-28"
                placeholderTextColor="#64748b"
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setExtendModalOrder(null)}>
                <Text style={styles.modalCancelBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleExtendDeliveryDate}
                disabled={isExtendingDate}
              >
                {isExtendingDate ? (
                  <ActivityIndicator size="small" color="#070c18" />
                ) : (
                  <Text style={styles.modalConfirmBtnText}>Update Date (₹0 Fee)</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── Cancellation Modal ─── */}
      <Modal visible={Boolean(cancelModalOrder)} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalBox}>
            <Text style={styles.modalHeaderTitle}>Cancel Nursery Booking</Text>
            <Text style={styles.modalHeaderSub}>
              Subject to 3-tier cancellation deduction: &gt;5 days (20%), 2-5 days (50%), &lt;48h (100% forfeiture).
            </Text>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Reason for Cancellation:</Text>
              <TextInput
                style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                multiline
                placeholder="Provide detailed reason..."
                placeholderTextColor="#64748b"
                value={cancelReason}
                onChangeText={setCancelReason}
              />
            </View>

            <View style={styles.modalButtonRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCancelModalOrder(null)}>
                <Text style={styles.modalCancelBtnText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmBtn, { backgroundColor: '#ef4444' }]}
                onPress={handleCancelOrder}
                disabled={isCancellingOrder}
              >
                {isCancellingOrder ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={[styles.modalConfirmBtnText, { color: '#ffffff' }]}>Confirm Cancellation</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Helpers ───
const CATEGORY_ITEMS = [
  { key: 'ALL', label: 'All Seedlings', icon: 'sprout' },
  { key: 'FLOWER_PLUG_EXPRESS', label: 'Flowers (Marigold/Rose)', icon: 'flower' },
  { key: 'VEGETABLE_PLUG', label: 'Vegetables (Chili/Tomato)', icon: 'chili-medium' },
  { key: 'PADDY_FIELD_BULK', label: 'Paddy / Basmati (PR-126)', icon: 'grass' },
  { key: 'ORNAMENTAL_INDOOR', label: 'Indoor & Pots', icon: 'palm-tree' },
  { key: 'AGRO_FORESTRY_TIMBER', label: 'Timber (Poplar/Safeda)', icon: 'tree' },
  { key: 'MEDICINAL_KITCHEN_HERB', label: 'Herbs (Tulsi/Aloe)', icon: 'leaf' },
];

function formatCategoryName(cat: string) {
  switch (cat) {
    case 'FLOWER_PLUG_EXPRESS':
      return 'FLOWER PLUGS';
    case 'VEGETABLE_PLUG':
      return 'VEGETABLE PLUGS';
    case 'PADDY_FIELD_BULK':
      return 'PADDY SEEDLINGS';
    case 'ORNAMENTAL_INDOOR':
      return 'INDOOR FOLIAGE';
    case 'AGRO_FORESTRY_TIMBER':
      return 'TIMBER SEEDLINGS';
    case 'MEDICINAL_KITCHEN_HERB':
      return 'MEDICINAL HERB';
    default:
      return 'NURSERY PLUG';
  }
}

function calculateSeedlingAge(sowingDate: string) {
  if (!sowingDate) return 26;
  const days = Math.floor((Date.now() - new Date(sowingDate).getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, days);
}

function getPlaceholderImage(cat: string) {
  switch (cat) {
    case 'FLOWER_PLUG_EXPRESS':
      return 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?auto=format&fit=crop&w=600&q=80';
    case 'VEGETABLE_PLUG':
      return 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=600&q=80';
    case 'PADDY_FIELD_BULK':
      return 'https://images.unsplash.com/photo-1536657464919-892534f60d6e?auto=format&fit=crop&w=600&q=80';
    case 'ORNAMENTAL_INDOOR':
      return 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=600&q=80';
    default:
      return 'https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=600&q=80';
  }
}

function formatStatus(status: string) {
  switch (status) {
    case 'BOOKED_ESCROW_PAID':
      return 'ESCROW HELD';
    case 'DISPATCHED_IN_TRANSIT':
      return 'IN TRANSIT';
    case 'DELIVERED_COMPLETED':
      return 'COMPLETED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return status;
  }
}

function getStatusPillStyle(status: string) {
  switch (status) {
    case 'BOOKED_ESCROW_PAID':
      return { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' };
    case 'DISPATCHED_IN_TRANSIT':
      return { backgroundColor: 'rgba(251, 191, 36, 0.15)', borderColor: '#fbbf24' };
    case 'DELIVERED_COMPLETED':
      return { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#22c55e' };
    case 'CANCELLED':
      return { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#ef4444' };
    default:
      return { backgroundColor: 'rgba(148, 163, 184, 0.15)', borderColor: '#94a3b8' };
  }
}

function getSeedBatches() {
  return [
    {
      id: 'batch-fl-01',
      category: 'FLOWER_PLUG_EXPRESS',
      varietyName: 'Calcutta Orange Marigold (104 Plugs/Tray)',
      pricePerUnit: 450,
      minOrderAmount: 2000,
      isSeedCertified: true,
      deliveryPricingType: 'INCLUDED',
      compositeCoreScore: 4.95,
      estimatedCapacity: 200,
      bookedQuantity: 40,
      sowingDate: new Date(Date.now() - 86400000 * 24).toISOString(),
      readyDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      uprootingDeadline: new Date(Date.now() + 86400000 * 12).toISOString(),
      owner: {
        id: 'owner-pb-01',
        name: 'Malerkotla Floriculture Centre',
        district: 'Malerkotla',
        state: 'Punjab',
        kycVerified: true,
      },
    },
    {
      id: 'batch-vg-02',
      category: 'VEGETABLE_PLUG',
      varietyName: 'Seminis Abhinav Tomato Pro-Trays (104 Cavities)',
      pricePerUnit: 520,
      minOrderAmount: 2000,
      isSeedCertified: true,
      deliveryPricingType: 'INCLUDED',
      compositeCoreScore: 4.9,
      estimatedCapacity: 150,
      bookedQuantity: 25,
      sowingDate: new Date(Date.now() - 86400000 * 22).toISOString(),
      readyDate: new Date(Date.now() + 86400000 * 4).toISOString(),
      uprootingDeadline: new Date(Date.now() + 86400000 * 14).toISOString(),
      owner: {
        id: 'owner-pb-02',
        name: 'Patiala Hi-Tech Vegetable Plugs',
        district: 'Patiala',
        state: 'Punjab',
        kycVerified: true,
      },
    },
    {
      id: 'batch-pd-03',
      category: 'PADDY_FIELD_BULK',
      varietyName: 'Paddy PR-126 Certified Field Seedlings',
      pricePerUnit: 3500,
      minOrderAmount: 3500,
      isSeedCertified: true,
      deliveryPricingType: 'INCLUDED',
      compositeCoreScore: 4.98,
      estimatedCapacity: 15,
      bookedQuantity: 4,
      sowingDate: new Date(Date.now() - 86400000 * 25).toISOString(),
      readyDate: new Date(Date.now() + 86400000 * 2).toISOString(),
      uprootingDeadline: new Date(Date.now() + 86400000 * 9).toISOString(),
      owner: {
        id: 'owner-pb-03',
        name: 'Majha Agro Seedling Farm',
        district: 'Tarn Taran',
        state: 'Punjab',
        kycVerified: true,
      },
    },
    {
      id: 'batch-in-04',
      category: 'ORNAMENTAL_INDOOR',
      varietyName: 'Areca Palm Nursery Pots (Pack of 10)',
      pricePerUnit: 1200,
      minOrderAmount: 2000,
      isSeedCertified: false,
      deliveryPricingType: 'INCLUDED',
      compositeCoreScore: 4.85,
      estimatedCapacity: 80,
      bookedQuantity: 12,
      sowingDate: new Date(Date.now() - 86400000 * 60).toISOString(),
      readyDate: new Date(Date.now()).toISOString(),
      uprootingDeadline: new Date(Date.now() + 86400000 * 30).toISOString(),
      owner: {
        id: 'owner-pb-04',
        name: 'Doon Valley Foliage Nursery',
        district: 'Dehradun',
        state: 'Uttarakhand',
        kycVerified: true,
      },
    },
  ];
}

// ─── Executive Styles (Obsidian Theme, PC-First Responsive) ───
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#070c18',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#070c18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#94a3b8',
    fontFamily: FONT.medium,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#0c1322',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  brandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  brandBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#22c55e',
    letterSpacing: 0.5,
  },
  brandSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  myOrdersBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  myOrdersBtnText: {
    fontSize: 13,
    color: '#22c55e',
    fontFamily: FONT.bold,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  telemetryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0c1322',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  telemetryItem: {
    flex: 1,
    alignItems: 'center',
  },
  telemetryTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#f1f5f9',
    marginTop: 4,
  },
  telemetryDesc: {
    fontSize: 10,
    color: '#64748b',
    fontFamily: FONT.regular,
    marginTop: 1,
    textAlign: 'center',
  },
  telemetryDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchSection: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT.medium,
  },
  categoryScroll: {
    paddingTop: 12,
    gap: 8,
  },
  categoryTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: '#0c1322',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryTabActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  categoryTabText: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    color: '#94a3b8',
  },
  categoryTabTextActive: {
    color: '#070c18',
    fontFamily: FONT.bold,
  },
  mainContainer: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  sectionSubheading: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  countBadge: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#22c55e',
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderRadius: RADIUS.xs,
  },
  inlineLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.lg,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#f1f5f9',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 360,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  batchCard: {
    width: (Platform.OS === 'web' ? ('calc(33.333% - 11px)' as any) : '100%'),
    minWidth: 290,
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...premiumShadow('#000000', 'md'),
  },
  cardImageWrapper: {
    width: '100%',
    height: 160,
    backgroundColor: '#111827',
    position: 'relative',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlayTop: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: 'rgba(7, 12, 24, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  flashBadge: {
    backgroundColor: '#ef4444',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    gap: 2,
  },
  flashBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  certifiedBadge: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    backgroundColor: 'rgba(7, 12, 24, 0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  certifiedBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#22c55e',
  },
  cardBody: {
    padding: 14,
  },
  varietyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  varietyTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
    flex: 1,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  ratingText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  growerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  growerName: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    flex: 1,
  },
  agroHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  agroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  agroText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#cbd5e1',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  priceLabel: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#22c55e',
  },
  priceUnit: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  bookButtonText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#070c18',
  },

  // ─── Modal Styles ───
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  bookingModalBox: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  ordersModalBox: {
    width: '100%',
    maxWidth: 720,
    height: '85%',
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    overflow: 'hidden',
  },
  confirmModalBox: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  modalHeaderSub: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    padding: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
    marginBottom: 6,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  qtyBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyDisplay: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#ffffff',
    minWidth: 40,
    textAlign: 'center',
  },
  minWarningText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#f87171',
    marginTop: 4,
  },
  modalInput: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT.medium,
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  choicePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  choicePillActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  choicePillText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#e2e8f0',
  },
  choicePillTextActive: {
    color: '#070c18',
    fontFamily: FONT.bold,
  },
  breakdownBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    marginVertical: 6,
  },
  breakdownTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#f1f5f9',
    marginBottom: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  breakdownLabel: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  breakdownVal: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },
  breakdownGreen: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#22c55e',
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 6,
  },
  breakdownTotalLabel: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  breakdownTotalVal: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#22c55e',
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginTop: 10,
  },
  policyNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#bae6fd',
    lineHeight: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  confirmOrderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
  },
  confirmOrderBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#070c18',
  },
  btnDisabled: {
    opacity: 0.5,
  },

  // Orders List
  ordersScroll: {
    padding: 16,
    gap: 12,
  },
  orderCard: {
    backgroundColor: '#111827',
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  orderCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumberText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#f1f5f9',
  },
  orderVarietyText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#22c55e',
    marginTop: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#f1f5f9',
  },
  otpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderRadius: RADIUS.sm,
    padding: 10,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  otpLabel: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  otpValue: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#22c55e',
    letterSpacing: 4,
    marginTop: 2,
  },
  otpHint: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#64748b',
    marginTop: 2,
  },
  verifyOtpBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  verifyOtpBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#070c18',
  },
  orderTelemetry: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: RADIUS.xs,
    padding: 8,
  },
  orderTeleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  orderTeleKey: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  orderTeleVal: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#e2e8f0',
  },
  orderActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  extendBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  extendBtnText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#38bdf8',
  },
  cancelBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#f87171',
  },
  ratingSection: {
    marginTop: 10,
  },
  ratingSectionTitle: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
    marginTop: 8,
  },
  starRow: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#e2e8f0',
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
    backgroundColor: '#22c55e',
    alignItems: 'center',
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#070c18',
  },
});
