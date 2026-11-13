import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { apiClient } from '@/src/api/client';

type TabView = 'BATCHES' | 'ORDERS' | 'ESCROW';

export const NurseryOwnerDashboardView: React.FC = () => {
  const theme = RoleThemes.AGENT;
  const { colors: tConfig } = useExecutiveTheme();
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<TabView>('BATCHES');
  const [loading, setLoading] = useState(true);
  const [batches, setBatches] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  // Create Batch Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);
  const [batchForm, setBatchForm] = useState({
    isReadyStock: true,
    category: 'FLOWER_PLUG_EXPRESS',
    varietyName: '',
    botanicalName: '',
    seedBatchLotNumber: '',
    seedSupplierCompany: '',
    totalUnitsAvailable: '5000',
    pricePerUnit: '1.20',
    plugCavityCount: '104',
    minOrderUnits: '1000',
    sowingDate: '',
    readyDate: new Date().toISOString().split('T')[0],
    city: 'Amritsar',
    district: 'Tarn Taran',
    state: 'Punjab',
    specialHandlingNotes: 'Ready healthy plants for immediate dispatch.',
  });

  // Dispatch Modal State
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [dispatchOrder, setDispatchOrder] = useState<any | null>(null);
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState(false);
  const [dispatchForm, setDispatchForm] = useState({
    transportMode: 'ROADWAYS_BUS_PARCEL',
    busServiceNumber: '',
    biltyReceiptNumber: '',
    driverOrConductorPhone: '',
    busStandDeliveryLocation: '',
    estimatedArrivalAt: '',
  });

  useEffect(() => {
    fetchGrowerData();
  }, []);

  const fetchGrowerData = async () => {
    try {
      setLoading(true);
      const [batchesRes, ordersRes] = await Promise.all([
        apiClient.get('/nursery/grower/batches').catch(() => ({ data: [] })),
        apiClient.get('/nursery/grower/orders').catch(() => ({ data: [] })),
      ]);
      setBatches(Array.isArray(batchesRes.data) ? batchesRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
    } catch {
      // Keep state intact
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBatch = async () => {
    if (!batchForm.varietyName.trim()) {
      Alert.alert('Required Field', 'Please enter the plant variety name.');
      return;
    }
    try {
      setIsSubmittingBatch(true);
      const now = new Date();
      const readyDate = batchForm.isReadyStock ? now : (batchForm.readyDate ? new Date(batchForm.readyDate) : now);
      const sowingDate = batchForm.isReadyStock
        ? undefined
        : (batchForm.sowingDate ? new Date(batchForm.sowingDate).toISOString() : undefined);

      const payload = {
        category: batchForm.category,
        varietyName: batchForm.varietyName.trim(),
        botanicalName: batchForm.botanicalName.trim() || undefined,
        seedBatchLotNumber: batchForm.seedBatchLotNumber.trim() || undefined,
        seedSupplierCompany: batchForm.seedSupplierCompany.trim() || undefined,
        totalUnitsAvailable: parseInt(batchForm.totalUnitsAvailable, 10) || 5000,
        pricePerUnit: parseFloat(batchForm.pricePerUnit) || 1.5,
        plugCavityCount: parseInt(batchForm.plugCavityCount, 10) || 104,
        minOrderUnits: parseInt(batchForm.minOrderUnits, 10) || 1000,
        sowingDate,
        readyDate: readyDate.toISOString(),
        city: batchForm.city.trim(),
        district: batchForm.district.trim(),
        state: batchForm.state.trim(),
        specialHandlingNotes: batchForm.specialHandlingNotes.trim() || undefined,
      };

      await apiClient.post('/nursery/grower/batches', payload);
      Alert.alert('Success', 'Seedling batch listed successfully on FarmsKing Marketplace!');
      setShowCreateModal(false);
      fetchGrowerData();
    } catch (e: any) {
      Alert.alert('Listing Failed', e.response?.data?.message || 'Could not list batch.');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  const openDispatchDialog = (order: any) => {
    setDispatchOrder(order);
    setDispatchForm({
      transportMode: order.transportMode || 'ROADWAYS_BUS_PARCEL',
      busServiceNumber: '',
      biltyReceiptNumber: '',
      driverOrConductorPhone: '',
      busStandDeliveryLocation: order.deliveryLocationDistrict || '',
      estimatedArrivalAt: new Date(Date.now() + 6 * 3600000).toISOString().slice(0, 16),
    });
    setShowDispatchModal(true);
  };

  const handleSubmitDispatch = async () => {
    if (!dispatchOrder) return;
    if (!dispatchForm.biltyReceiptNumber.trim()) {
      Alert.alert('Required Field', 'Please enter the parcel bilty or receipt number.');
      return;
    }
    try {
      setIsSubmittingDispatch(true);
      const payload = {
        transportMode: dispatchForm.transportMode,
        busServiceNumber: dispatchForm.busServiceNumber.trim() || undefined,
        biltyReceiptNumber: dispatchForm.biltyReceiptNumber.trim(),
        driverOrConductorPhone: dispatchForm.driverOrConductorPhone.trim() || undefined,
        busStandDeliveryLocation: dispatchForm.busStandDeliveryLocation.trim() || undefined,
        estimatedArrivalAt: dispatchForm.estimatedArrivalAt
          ? new Date(dispatchForm.estimatedArrivalAt).toISOString()
          : undefined,
      };

      await apiClient.patch(`/nursery/grower/orders/${dispatchOrder.id}/dispatch`, payload);
      Alert.alert('Order Dispatched', 'Buyer has been notified with the bus/railway parcel tracking details.');
      setShowDispatchModal(false);
      fetchGrowerData();
    } catch (e: any) {
      Alert.alert('Dispatch Update Failed', e.response?.data?.message || 'Could not update dispatch.');
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const pendingDispatches = orders.filter((o) => ['CONFIRMED', 'PREPARING'].includes(o.status));
  const activeDispatched = orders.filter((o) => o.status === 'DISPATCHED');
  const deliveredOrders = orders.filter((o) => o.status === 'DELIVERED');
  const totalEscrowReleased = deliveredOrders.reduce((sum, o) => sum + Number(o.growerPayoutAmount || 0), 0);
  const pendingEscrow = orders
    .filter((o) => ['CONFIRMED', 'PREPARING', 'DISPATCHED'].includes(o.status))
    .reduce((sum, o) => sum + Number(o.growerPayoutAmount || 0), 0);

  return (
    <ScrollView style={[styles.container, { backgroundColor: tConfig.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="NURSERY_OWNER"
        profileName={user?.name || 'Nursery Partner'}
        subtitle="Certified Seedling Grower & Dispatch Desk"
        avatarUrl={user?.photoUrl || undefined}
      />

      <View style={styles.content}>
        {/* Top Summary Banner */}
        <LinearGradient colors={['#042413', '#021209']} style={[styles.heroCard, premiumShadow('#10b981', 'md')]}>
          <View style={styles.heroRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.badgePill}>
                <Ionicons name="shield-checkmark" size={13} color="#22c55e" />
                <Text style={styles.badgePillText}>CENTRAL ESCROW PROTECTED</Text>
              </View>
              <Text style={styles.heroTitle}>Nursery Dispatch Desk</Text>
              <Text style={styles.heroSub}>
                Manage seedling batches, road & rail parcel dispatches, and guaranteed bank payouts.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.addBatchBtn}
              activeOpacity={0.85}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add-circle" size={18} color="#070c18" />
              <Text style={styles.addBatchBtnText}>List Batch</Text>
            </TouchableOpacity>
          </View>

          {/* Quick Metrics */}
          <View style={styles.heroMetrics}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.heroMetricVal}>{batches.length}</Text>
              <Text style={styles.heroMetricLbl}>Active Batches</Text>
            </View>
            <View style={[styles.heroMetricItem, styles.metricDivider]}>
              <Text style={[styles.heroMetricVal, { color: '#f59e0b' }]}>{pendingDispatches.length}</Text>
              <Text style={styles.heroMetricLbl}>Pending Dispatch</Text>
            </View>
            <View style={[styles.heroMetricItem, styles.metricDivider]}>
              <Text style={[styles.heroMetricVal, { color: '#22c55e' }]}>₹{totalEscrowReleased.toLocaleString('en-IN')}</Text>
              <Text style={styles.heroMetricLbl}>Escrow Released</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'BATCHES' && styles.tabItemActive]}
            onPress={() => setActiveTab('BATCHES')}
          >
            <Ionicons
              name="leaf"
              size={16}
              color={activeTab === 'BATCHES' ? '#22c55e' : '#94a3b8'}
            />
            <Text style={[styles.tabItemText, activeTab === 'BATCHES' && styles.tabItemTextActive]}>
              Seedling Batches ({batches.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'ORDERS' && styles.tabItemActive]}
            onPress={() => setActiveTab('ORDERS')}
          >
            <Ionicons
              name="bus"
              size={16}
              color={activeTab === 'ORDERS' ? '#22c55e' : '#94a3b8'}
            />
            <Text style={[styles.tabItemText, activeTab === 'ORDERS' && styles.tabItemTextActive]}>
              Bookings & Dispatch ({orders.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'ESCROW' && styles.tabItemActive]}
            onPress={() => setActiveTab('ESCROW')}
          >
            <Ionicons
              name="wallet"
              size={16}
              color={activeTab === 'ESCROW' ? '#22c55e' : '#94a3b8'}
            />
            <Text style={[styles.tabItemText, activeTab === 'ESCROW' && styles.tabItemTextActive]}>
              Escrow Payouts
            </Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#22c55e" />
            <Text style={styles.loadingText}>Syncing nursery inventory...</Text>
          </View>
        ) : (
          <>
            {/* ─── TAB 1: BATCHES ─── */}
            {activeTab === 'BATCHES' && (
              <View style={styles.sectionWrap}>
                {batches.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="leaf-outline" size={48} color="#64748b" />
                    <Text style={styles.emptyTitle}>No Seedling Batches Listed Yet</Text>
                    <Text style={styles.emptySub}>
                      List your flower plugs, vegetable seedlings, or paddy batches for instant orders.
                    </Text>
                    <TouchableOpacity
                      style={styles.emptyCta}
                      onPress={() => setShowCreateModal(true)}
                    >
                      <Text style={styles.emptyCtaText}>+ List First Batch</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  batches.map((batch) => (
                    <View key={batch.id} style={styles.batchCard}>
                      <View style={styles.batchHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.batchCategory}>
                            {String(batch.category || '').replace(/_/g, ' ')}
                          </Text>
                          <Text style={styles.batchName}>{batch.varietyName}</Text>
                          {batch.botanicalName ? (
                            <Text style={styles.botanicalText}>({batch.botanicalName})</Text>
                          ) : null}
                        </View>
                        <View style={styles.statusBadge}>
                          <Text style={styles.statusBadgeText}>
                            {String(batch.status || 'ACTIVE').replace(/_/g, ' ')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.batchDetailsGrid}>
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Available Plugs</Text>
                          <Text style={styles.detailValue}>
                            {Number(batch.totalUnitsAvailable).toLocaleString('en-IN')} units
                          </Text>
                        </View>
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Price Per Plug</Text>
                          <Text style={[styles.detailValue, { color: '#22c55e' }]}>
                            ₹{Number(batch.pricePerUnit).toFixed(2)}
                          </Text>
                        </View>
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Tray Cavity</Text>
                          <Text style={styles.detailValue}>{batch.plugCavityCount || 104} Plugs</Text>
                        </View>
                        <View style={styles.detailCol}>
                          <Text style={styles.detailLabel}>Min Order</Text>
                          <Text style={styles.detailValue}>{batch.minOrderUnits || 1000} units</Text>
                        </View>
                      </View>

                      <View style={styles.batchFooter}>
                        <Text style={styles.dateInfoText}>
                          Sown: {new Date(batch.sowingDate).toLocaleDateString('en-IN')} · Ready:{' '}
                          {new Date(batch.readyDate).toLocaleDateString('en-IN')}
                        </Text>
                        <Text style={styles.locationText}>
                          📍 {batch.city || batch.district}, {batch.state}
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ─── TAB 2: ORDERS ─── */}
            {activeTab === 'ORDERS' && (
              <View style={styles.sectionWrap}>
                {orders.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="receipt-outline" size={48} color="#64748b" />
                    <Text style={styles.emptyTitle}>No Orders Received Yet</Text>
                    <Text style={styles.emptySub}>
                      Incoming seedling bookings from verified farmers will appear here.
                    </Text>
                  </View>
                ) : (
                  orders.map((ord) => (
                    <View key={ord.id} style={styles.orderCard}>
                      <View style={styles.orderHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.orderNumber}>{ord.orderNumber}</Text>
                          <Text style={styles.orderItemName}>{ord.batch?.varietyName || 'Seedlings'}</Text>
                          <Text style={styles.orderBuyer}>Buyer: {ord.buyer?.name || 'Verified Farmer'} ({ord.buyer?.phone || ''})</Text>
                        </View>
                        <View
                          style={[
                            styles.orderStatusBadge,
                            ord.status === 'DELIVERED' && { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
                            ord.status === 'DISPATCHED' && { backgroundColor: 'rgba(56, 189, 248, 0.2)' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.orderStatusText,
                              ord.status === 'DELIVERED' && { color: '#22c55e' },
                              ord.status === 'DISPATCHED' && { color: '#38bdf8' },
                            ]}
                          >
                            {ord.status}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.orderGrid}>
                        <View style={styles.orderMetric}>
                          <Text style={styles.orderMetricLbl}>Quantity</Text>
                          <Text style={styles.orderMetricVal}>{ord.quantityUnits} Plugs</Text>
                        </View>
                        <View style={styles.orderMetric}>
                          <Text style={styles.orderMetricLbl}>Grower Payout</Text>
                          <Text style={[styles.orderMetricVal, { color: '#22c55e' }]}>
                            ₹{Number(ord.growerPayoutAmount || 0).toLocaleString('en-IN')}
                          </Text>
                        </View>
                        <View style={styles.orderMetric}>
                          <Text style={styles.orderMetricLbl}>Target Delivery</Text>
                          <Text style={styles.orderMetricVal}>
                            {new Date(ord.requestedDeliveryDate).toLocaleDateString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      {/* Dispatch & Bilty Details */}
                      {ord.biltyReceiptNumber ? (
                        <View style={styles.dispatchDetailsBox}>
                          <Ionicons name="document-text" size={16} color="#38bdf8" />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.biltyTitle}>
                              Bilty #{ord.biltyReceiptNumber} ({String(ord.transportMode).replace(/_/g, ' ')})
                            </Text>
                            {ord.busServiceNumber ? (
                              <Text style={styles.biltySub}>Bus/Service: {ord.busServiceNumber}</Text>
                            ) : null}
                            {ord.driverOrConductorPhone ? (
                              <Text style={styles.biltySub}>Conductor Phone: {ord.driverOrConductorPhone}</Text>
                            ) : null}
                          </View>
                        </View>
                      ) : null}

                      {/* Action Button */}
                      {['CONFIRMED', 'PREPARING'].includes(ord.status) && (
                        <TouchableOpacity
                          style={styles.dispatchActionBtn}
                          onPress={() => openDispatchDialog(ord)}
                        >
                          <Ionicons name="bus" size={16} color="#070c18" />
                          <Text style={styles.dispatchActionBtnText}>Input Parcel Bilty & Mark Dispatched</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))
                )}
              </View>
            )}

            {/* ─── TAB 3: ESCROW WALLET ─── */}
            {activeTab === 'ESCROW' && (
              <View style={styles.sectionWrap}>
                <View style={styles.escrowCard}>
                  <View style={styles.escrowHeader}>
                    <Ionicons name="lock-closed" size={24} color="#22c55e" />
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={styles.escrowTitle}>FarmsKing Central Escrow Protection</Text>
                      <Text style={styles.escrowSub}>
                        Payment is collected from the farmer upfront and held in FarmsKing Escrow. It is released
                        directly to your registered bank account once the farmer confirms receipt via 4-digit OTP.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.escrowMetricsRow}>
                    <View style={styles.escrowMetricCol}>
                      <Text style={styles.escrowMetricLbl}>Total Released Payouts</Text>
                      <Text style={[styles.escrowMetricVal, { color: '#22c55e' }]}>
                        ₹{totalEscrowReleased.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={[styles.escrowMetricCol, { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.08)' }]}>
                      <Text style={styles.escrowMetricLbl}>Escrow In-Transit</Text>
                      <Text style={[styles.escrowMetricVal, { color: '#f59e0b' }]}>
                        ₹{pendingEscrow.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.guaranteeBox}>
                    <Ionicons name="shield-checkmark" size={18} color="#22c55e" />
                    <Text style={styles.guaranteeText}>
                      Zero bad-debt guarantee: If buyer cancels late or refuses delivery without valid ICAR defect,
                      grower cancellation claim is reimbursed up to 95% of order value.
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* ─── CREATE BATCH MODAL ─── */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>List Seedling Batch for Sale</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Ionicons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Listing Mode: Ready Stock vs Advance Booking */}
              <View style={styles.stockTypeSelector}>
                <TouchableOpacity
                  style={[styles.stockTypeBtn, batchForm.isReadyStock && styles.stockTypeBtnActive]}
                  onPress={() => setBatchForm((p) => ({ ...p, isReadyStock: true }))}
                >
                  <Ionicons name="flash" size={14} color={batchForm.isReadyStock ? '#22c55e' : '#94a3b8'} />
                  <Text style={[styles.stockTypeBtnText, batchForm.isReadyStock && styles.stockTypeBtnTextActive]}>
                    Ready Stock (Immediate)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.stockTypeBtn, !batchForm.isReadyStock && styles.stockTypeBtnActive]}
                  onPress={() => setBatchForm((p) => ({ ...p, isReadyStock: false }))}
                >
                  <Ionicons name="calendar" size={14} color={!batchForm.isReadyStock ? '#22c55e' : '#94a3b8'} />
                  <Text style={[styles.stockTypeBtnText, !batchForm.isReadyStock && styles.stockTypeBtnTextActive]}>
                    Advance Booking (Future)
                  </Text>
                </TouchableOpacity>
              </View>

              {batchForm.isReadyStock ? (
                <View style={styles.readyStockAlert}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <Text style={styles.readyStockAlertText}>
                    ⚡ Ready Stock: Plants are grown and ready for immediate dispatch. No sowing date required.
                  </Text>
                </View>
              ) : (
                <View style={styles.formRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Sowing Date (Optional)</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={batchForm.sowingDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748b"
                      onChangeText={(v) => setBatchForm((p) => ({ ...p, sowingDate: v }))}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.inputLabel}>Expected Ready Date *</Text>
                    <TextInput
                      style={styles.modalInput}
                      value={batchForm.readyDate}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#64748b"
                      onChangeText={(v) => setBatchForm((p) => ({ ...p, readyDate: v }))}
                    />
                  </View>
                </View>
              )}

              <Text style={styles.inputLabel}>Variety / Crop Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Calcutta Orange Marigold (Pusa Narangi)"
                placeholderTextColor="#64748b"
                value={batchForm.varietyName}
                onChangeText={(v) => setBatchForm((p) => ({ ...p, varietyName: v }))}
              />

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Available Plugs *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="10000"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={batchForm.totalUnitsAvailable}
                    onChangeText={(v) => setBatchForm((p) => ({ ...p, totalUnitsAvailable: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputLabel}>Price Per Plug (₹) *</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="1.20"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={batchForm.pricePerUnit}
                    onChangeText={(v) => setBatchForm((p) => ({ ...p, pricePerUnit: v }))}
                  />
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputLabel}>Seed Purity Lot # (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. SY-8829-MR"
                    placeholderTextColor="#64748b"
                    value={batchForm.seedBatchLotNumber}
                    onChangeText={(v) => setBatchForm((p) => ({ ...p, seedBatchLotNumber: v }))}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.inputLabel}>Seed Company (Optional)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. Syngenta / Namdhari"
                    placeholderTextColor="#64748b"
                    value={batchForm.seedSupplierCompany}
                    onChangeText={(v) => setBatchForm((p) => ({ ...p, seedSupplierCompany: v }))}
                  />
                </View>
              </View>

              <Text style={styles.inputLabel}>Special Handling Notes</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                multiline
                placeholder="Care, plug pro-tray size, or transit specifications"
                placeholderTextColor="#64748b"
                value={batchForm.specialHandlingNotes}
                onChangeText={(v) => setBatchForm((p) => ({ ...p, specialHandlingNotes: v }))}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleCreateBatch}
                disabled={isSubmittingBatch}
              >
                {isSubmittingBatch ? (
                  <ActivityIndicator color="#070c18" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Confirm & Publish Seedlings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ─── DISPATCH MODAL ─── */}
      <Modal visible={showDispatchModal} animationType="fade" transparent>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Dispatch Parcel Bilty Details</Text>
              <TouchableOpacity onPress={() => setShowDispatchModal(false)}>
                <Ionicons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Parcel Bilty / Receipt Number *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. PB-AMR-883921"
                placeholderTextColor="#64748b"
                value={dispatchForm.biltyReceiptNumber}
                onChangeText={(v) => setDispatchForm((p) => ({ ...p, biltyReceiptNumber: v }))}
              />

              <Text style={styles.inputLabel}>Bus Number / Train Express Service</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Punjab Roadways Bus PB-02-EE-1928"
                placeholderTextColor="#64748b"
                value={dispatchForm.busServiceNumber}
                onChangeText={(v) => setDispatchForm((p) => ({ ...p, busServiceNumber: v }))}
              />

              <Text style={styles.inputLabel}>Driver / Conductor Phone</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 98140-XXXXX"
                placeholderTextColor="#64748b"
                keyboardType="phone-pad"
                value={dispatchForm.driverOrConductorPhone}
                onChangeText={(v) => setDispatchForm((p) => ({ ...p, driverOrConductorPhone: v }))}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.submitModalBtn}
                onPress={handleSubmitDispatch}
                disabled={isSubmittingDispatch}
              >
                {isSubmittingDispatch ? (
                  <ActivityIndicator color="#070c18" />
                ) : (
                  <Text style={styles.submitModalBtnText}>Mark Dispatched</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 60 },
  heroCard: {
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    marginBottom: 16,
  },
  heroRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  badgePillText: { fontSize: 10, fontFamily: FONT.bold, color: '#22c55e', letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, fontFamily: FONT.regular, color: '#94a3b8', marginTop: 4, maxWidth: 440 },
  addBatchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  addBatchBtnText: { fontSize: 13, fontFamily: FONT.bold, color: '#070c18' },
  heroMetrics: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroMetricItem: { flex: 1, alignItems: 'center' },
  metricDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255, 255, 255, 0.08)' },
  heroMetricVal: { fontSize: 17, fontFamily: FONT.extraBold, color: '#ffffff' },
  heroMetricLbl: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.md,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.sm,
  },
  tabItemActive: { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
  tabItemText: { fontSize: 12, fontFamily: FONT.bold, color: '#94a3b8' },
  tabItemTextActive: { color: '#22c55e' },
  loadingBox: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 10 },
  sectionWrap: { gap: 12 },
  emptyCard: {
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.lg,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#f1f5f9', marginTop: 12 },
  emptySub: { fontSize: 12.5, fontFamily: FONT.regular, color: '#64748b', textAlign: 'center', marginTop: 4, maxWidth: 360 },
  emptyCta: {
    marginTop: 16,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
  },
  emptyCtaText: { fontSize: 13, fontFamily: FONT.bold, color: '#22c55e' },
  batchCard: {
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  batchHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  batchCategory: { fontSize: 10, fontFamily: FONT.bold, color: '#22c55e', letterSpacing: 0.5 },
  batchName: { fontSize: 16, fontFamily: FONT.bold, color: '#ffffff', marginTop: 2 },
  botanicalText: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', fontStyle: 'italic' },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  statusBadgeText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#22c55e' },
  batchDetailsGrid: {
    flexDirection: 'row',
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailCol: { flex: 1 },
  detailLabel: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  detailValue: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff', marginTop: 2 },
  batchFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  dateInfoText: { fontSize: 11, fontFamily: FONT.regular, color: '#94a3b8' },
  locationText: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8' },
  orderCard: {
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.md,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  orderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  orderNumber: { fontSize: 11, fontFamily: FONT.bold, color: '#38bdf8' },
  orderItemName: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff', marginTop: 2 },
  orderBuyer: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  orderStatusText: { fontSize: 11, fontFamily: FONT.bold, color: '#f59e0b' },
  orderGrid: {
    flexDirection: 'row',
    marginTop: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  orderMetric: { flex: 1 },
  orderMetricLbl: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  orderMetricVal: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff', marginTop: 2 },
  dispatchDetailsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    padding: 10,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  biltyTitle: { fontSize: 12, fontFamily: FONT.bold, color: '#38bdf8' },
  biltySub: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  dispatchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: '#22c55e',
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  dispatchActionBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#070c18' },
  escrowCard: {
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  escrowHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  escrowTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#ffffff' },
  escrowSub: { fontSize: 12, fontFamily: FONT.regular, color: '#94a3b8', marginTop: 4, lineHeight: 18 },
  escrowMetricsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  escrowMetricCol: { flex: 1, alignItems: 'center' },
  escrowMetricLbl: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  escrowMetricVal: { fontSize: 18, fontFamily: FONT.extraBold, marginTop: 4 },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 16,
    padding: 12,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(34, 197, 94, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  guaranteeText: { flex: 1, fontSize: 12, fontFamily: FONT.medium, color: '#cbd5e1', lineHeight: 17 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 16 },
  modalCard: {
    backgroundColor: '#0c1322',
    borderRadius: RADIUS.lg,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#ffffff' },
  modalBody: { padding: 16 },
  stockTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    backgroundColor: '#070c18',
    padding: 4,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  stockTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.xs,
  },
  stockTypeBtnActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  stockTypeBtnText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  stockTypeBtnTextActive: {
    color: '#22c55e',
    fontFamily: FONT.bold,
  },
  readyStockAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    borderRadius: RADIUS.xs,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  readyStockAlertText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#86efac',
    lineHeight: 16,
  },
  formRow: { flexDirection: 'row', marginBottom: 12 },
  inputLabel: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', marginBottom: 4, marginTop: 8 },
  modalInput: {
    backgroundColor: '#111827',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  submitModalBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 12,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  submitModalBtnText: { fontSize: 13.5, fontFamily: FONT.bold, color: '#070c18' },
});

