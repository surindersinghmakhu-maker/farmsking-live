import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StatusBar,
  TextInput,
  Image,
  Modal,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { apiClient } from '@/src/api/client';

export default function AdminSellersScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED'>('ALL');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [customCommission, setCustomCommission] = useState('5.0');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Document photo preview modal state
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('Document Preview');

  // GSTR-8 Tax report modal state
  const [gstr8ModalVisible, setGstr8ModalVisible] = useState(false);
  const [gstr8Data, setGstr8Data] = useState<any>(null);
  const [isFetchingGstr8, setIsFetchingGstr8] = useState(false);
  const [gstr8Month, setGstr8Month] = useState('9');
  const [gstr8Year, setGstr8Year] = useState('2026');

  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    fetchStores();
  }, [selectedFilter]);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchStores = async () => {
    try {
      setLoading(true);
      setFetchError(null);
      const kycParam = selectedFilter !== 'ALL' ? `?kycStatus=${selectedFilter}` : '';
      const res = await apiClient.get(`/seller/admin/stores${kycParam}`);
      setStores(res.data);
    } catch (err: any) {
      console.log('Error fetching seller stores for admin:', err?.response?.data || err.message);
      const status = err?.response?.status;
      if (status === 401 || status === 403) {
        setFetchError('⚠️ Admin Access Required. Please log in with an Admin account (Mobile: 9872066901) to view and approve seller applications.');
      } else {
        setFetchError(err?.response?.data?.message || err?.message || 'Failed to connect to backend server.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateKyc = async (storeId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'REJECTED' && !rejectionReasonInput.trim()) {
      showAlert('Reason Required ⚠️', 'Please enter a clear reason for rejecting this seller application.');
      return;
    }

    try {
      await apiClient.patch(`/seller/admin/stores/${storeId}/kyc`, {
        status,
        commissionRate: parseFloat(customCommission || '5.0'),
        rejectionReason: status === 'REJECTED' ? rejectionReasonInput.trim() : undefined,
      });

      showAlert('Status Updated 🎉', `Seller Store KYC successfully marked as ${status}`);
      setEditingStoreId(null);
      setRejectionReasonInput('');
      fetchStores();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update store KYC.';
      showAlert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  const handleDownloadGstr8 = async (sellerStoreId: string) => {
    try {
      setIsFetchingGstr8(true);
      setGstr8ModalVisible(true);
      const res = await apiClient.get(
        `/seller/admin/gstr8?sellerStoreId=${sellerStoreId}&month=${gstr8Month}&year=${gstr8Year}`
      );
      setGstr8Data(res.data);
    } catch (err: any) {
      showAlert('Error ⚠️', 'Could not fetch GSTR-8 tax report.');
      setGstr8ModalVisible(false);
    } finally {
      setIsFetchingGstr8(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>👑 Admin Seller Verification Hub</Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => router.push('/(tabs)/shop')}>
            <Ionicons name="storefront" size={18} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchStores}>
            <Ionicons name="refresh" size={18} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterBar}>
        {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterTab, selectedFilter === (filter as any) && styles.activeFilterTab]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text style={[styles.filterText, selectedFilter === (filter as any) && styles.activeFilterText]}>
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 40 }} />
        ) : fetchError ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-lock" size={54} color="#EF4444" />
            <Text style={[styles.emptyText, { color: '#F87171', marginTop: 12, textAlign: 'center', paddingHorizontal: 20 }]}>
              {fetchError}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                backgroundColor: '#10B981',
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 8,
              }}
              onPress={() => router.push('/(auth)/sign-in' as any)}
            >
              <Text style={{ color: '#FFF', fontWeight: '700' }}>🔑 Admin Log In</Text>
            </TouchableOpacity>
          </View>
        ) : stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="store-search-outline" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>No seller stores found for filter: {selectedFilter}</Text>
          </View>
        ) : (
          stores.map((store) => (
            <View key={store.id} style={styles.storeCard}>
              <View style={styles.storeHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.storeName}>{store.storeName}</Text>
                  <Text style={styles.sellerName}>
                    👤 Owner: {store.seller?.name || 'Unknown'} (📞 {store.seller?.mobile})
                  </Text>
                  <Text style={styles.slugText}>🌐 farmsking.in/store/{store.slug}</Text>
                </View>

                <View
                  style={[
                    styles.kycBadge,
                    {
                      backgroundColor:
                        store.kycStatus === 'VERIFIED'
                          ? '#065F46'
                          : store.kycStatus === 'REJECTED'
                          ? '#991B1B'
                          : '#92400E',
                    },
                  ]}
                >
                  <Text style={styles.kycBadgeText}>{store.kycStatus}</Text>
                </View>
              </View>

              {/* Verified Details Box */}
              <View style={styles.detailsBox}>
                <Text style={styles.detailText}>🏢 Registered Legal Firm Name: <Text style={styles.highlightText}>{store.legalName || 'N/A'}</Text></Text>
                <Text style={styles.detailText}>📜 GSTIN Number: <Text style={styles.highlightText}>{store.gstin || 'N/A'}</Text></Text>
                <Text style={styles.detailText}>💳 Business PAN: <Text style={styles.highlightText}>{store.panNumber || 'N/A'}</Text></Text>
                <Text style={styles.detailText}>
                  🏦 Bank Acc No: <Text style={styles.highlightText}>{store.bankAccountNo || 'N/A'}</Text> (IFSC: {store.bankIfsc || 'N/A'})
                </Text>
                <Text style={styles.detailText}>
                  📍 Pickup Warehouse: <Text style={styles.highlightText}>{store.pickupAddress || 'N/A'} ({store.pickupCity}, {store.pickupState} - {store.pickupPincode})</Text>
                </Text>
                <Text style={styles.detailText}>
                  💰 Current Platform Fee: <Text style={{ color: '#10B981', fontWeight: '800' }}>{store.commissionRate}%</Text>
                </Text>
              </View>

              {/* Uploaded Documents Inspection Panel */}
              <View style={styles.docPanel}>
                <Text style={styles.docPanelTitle}>🖼️ Uploaded Documents & Certificates:</Text>
                <View style={styles.docRow}>
                  {/* GST Doc */}
                  <TouchableOpacity
                    style={styles.docThumbBox}
                    onPress={() => {
                      if (store.gstDocUrl) {
                        setPreviewDocTitle(`GST Certificate - ${store.storeName}`);
                        setPreviewDocUrl(store.gstDocUrl);
                      } else {
                        showAlert('No Document ⚠️', 'Seller has not attached a GST Certificate photo yet.');
                      }
                    }}
                  >
                    {store.gstDocUrl ? (
                      <Image source={{ uri: store.gstDocUrl }} style={styles.docImage} />
                    ) : (
                      <Ionicons name="document-text-outline" size={24} color="#6B7280" />
                    )}
                    <Text style={styles.docThumbLabel}>GST Cert</Text>
                  </TouchableOpacity>

                  {/* PAN Card Doc */}
                  <TouchableOpacity
                    style={styles.docThumbBox}
                    onPress={() => {
                      if (store.panDocUrl) {
                        setPreviewDocTitle(`PAN Card Photo - ${store.storeName}`);
                        setPreviewDocUrl(store.panDocUrl);
                      } else {
                        showAlert('No Document ⚠️', 'Seller has not attached a PAN Card photo yet.');
                      }
                    }}
                  >
                    {store.panDocUrl ? (
                      <Image source={{ uri: store.panDocUrl }} style={styles.docImage} />
                    ) : (
                      <Ionicons name="card-outline" size={24} color="#6B7280" />
                    )}
                    <Text style={styles.docThumbLabel}>PAN Card</Text>
                  </TouchableOpacity>

                  {/* Cancelled Cheque / Bank Passbook Doc */}
                  <TouchableOpacity
                    style={styles.docThumbBox}
                    onPress={() => {
                      if (store.chequeDocUrl) {
                        setPreviewDocTitle(`Cancelled Cheque / Passbook - ${store.storeName}`);
                        setPreviewDocUrl(store.chequeDocUrl);
                      } else {
                        showAlert('No Document ⚠️', 'Seller has not attached a Cancelled Cheque / Passbook photo yet.');
                      }
                    }}
                  >
                    {store.chequeDocUrl ? (
                      <Image source={{ uri: store.chequeDocUrl }} style={styles.docImage} />
                    ) : (
                      <Ionicons name="cash-outline" size={24} color="#6B7280" />
                    )}
                    <Text style={styles.docThumbLabel}>Bank Cheque</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Approval & Decision Actions */}
              <View style={styles.actionRow}>
                {editingStoreId === store.id ? (
                  <View style={styles.editCommissionBox}>
                    <Text style={{ color: '#FFF', fontSize: 12, marginBottom: 4, fontWeight: '700' }}>
                      Set Custom Platform Commission (%):
                    </Text>
                    <TextInput
                      style={styles.commissionInput}
                      keyboardType="numeric"
                      value={customCommission}
                      onChangeText={setCustomCommission}
                    />

                    <Text style={{ color: '#F87171', fontSize: 12, marginTop: 10, marginBottom: 4, fontWeight: '700' }}>
                      Rejection Reason (Required if Rejecting):
                    </Text>
                    <TextInput
                      style={[styles.commissionInput, { borderColor: '#7F1D1D' }]}
                      placeholder="e.g. Blurry GST certificate, IFSC code mismatch"
                      placeholderTextColor="#9CA3AF"
                      value={rejectionReasonInput}
                      onChangeText={setRejectionReasonInput}
                    />

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#059669', flex: 1, justifyContent: 'center' }]}
                        onPress={() => handleUpdateKyc(store.id, 'VERIFIED')}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                        <Text style={styles.btnText}> Approve KYC</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#DC2626', flex: 1, justifyContent: 'center' }]}
                        onPress={() => handleUpdateKyc(store.id, 'REJECTED')}
                      >
                        <Ionicons name="close-circle" size={16} color="#FFF" />
                        <Text style={styles.btnText}> Reject Application</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: '#059669' }]}
                      onPress={() => {
                        setEditingStoreId(store.id);
                        setCustomCommission(store.commissionRate?.toString() || '5.0');
                      }}
                    >
                      <Ionicons name="shield-checkmark" size={16} color="#FFF" />
                      <Text style={styles.btnText}> Verify Data</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: '#2563EB' }]}
                      onPress={() => handleDownloadGstr8(store.id)}
                    >
                      <FontAwesome5 name="file-invoice-dollar" size={14} color="#FFF" />
                      <Text style={styles.btnText}> GSTR-8 Tax Report</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Full-Screen Document Inspection Image Modal */}
      {previewDocUrl ? (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.imageModalContainer}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>{previewDocTitle}</Text>
                <TouchableOpacity onPress={() => setPreviewDocUrl(null)} style={styles.closeBtn}>
                  <Ionicons name="close-circle" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: previewDocUrl }} style={styles.fullDocImage} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      ) : null}

      {/* GSTR-8 Tax Report Detail Modal */}
      {gstr8ModalVisible ? (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.gstr8ModalBox}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>📊 CA GSTR-8 (1% GST TCS) Tax Summary</Text>
                <TouchableOpacity onPress={() => setGstr8ModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close-circle" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>

              {isFetchingGstr8 ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 30 }} />
              ) : gstr8Data ? (
                <ScrollView style={{ maxHeight: 420, paddingVertical: 10 }}>
                  <View style={styles.gstrSummaryCard}>
                    <Text style={styles.gstrValText}>Gross Sales Value: <Text style={{ color: '#10B981' }}>₹{gstr8Data.totalGrossSales}</Text></Text>
                    <Text style={styles.gstrValText}>Net Taxable Supply: <Text style={{ color: '#3B82F6' }}>₹{gstr8Data.netTaxableValue}</Text></Text>
                    <Text style={styles.gstrValText}>0.5% CGST TCS: ₹{gstr8Data.cgstTcs}</Text>
                    <Text style={styles.gstrValText}>0.5% SGST TCS: ₹{gstr8Data.sgstTcs}</Text>
                    <Text style={[styles.gstrValText, { fontSize: 16, marginTop: 4, fontWeight: '800' }]}>
                      Total 1% GST TCS: <Text style={{ color: '#F59E0B' }}>₹{gstr8Data.totalTcs}</Text>
                    </Text>
                  </View>

                  <Text style={{ color: '#D1D5DB', fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 6 }}>
                    📦 Eligible Sales Orders ({gstr8Data.itemCount || 0} items):
                  </Text>
                  {gstr8Data.itemsSummary && gstr8Data.itemsSummary.length > 0 ? (
                    gstr8Data.itemsSummary.map((item: any, idx: number) => (
                      <View key={idx} style={styles.gstrItemRow}>
                        <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{item.productName}</Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 11 }}>
                          HSN: {item.hsnCode} | Qty: {item.quantity} | Subtotal: ₹{item.subtotal}
                        </Text>
                        <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700' }}>
                          1% TCS Share: ₹{item.tcsAmount} (Order: {item.orderNumber})
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No taxable sales recorded for selected period.</Text>
                  )}
                </ScrollView>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F17' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  backBtn: { padding: 4 },
  refreshBtn: { backgroundColor: '#065F46', padding: 8, borderRadius: 8 },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '700' },

  filterBar: { flexDirection: 'row', backgroundColor: '#111827', padding: 6 },
  filterTab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeFilterTab: { backgroundColor: '#059669' },
  filterText: { color: '#9CA3AF', fontSize: 13, fontWeight: '600' },
  activeFilterText: { color: '#FFF', fontWeight: '700' },

  scrollContent: { padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#9CA3AF', marginTop: 12, fontSize: 14 },

  storeCard: {
    backgroundColor: '#1F2937',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  storeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  storeName: { color: '#F9FAFB', fontSize: 17, fontWeight: '700' },
  sellerName: { color: '#D1D5DB', fontSize: 13, marginTop: 2 },
  slugText: { color: '#10B981', fontSize: 12, marginTop: 2 },
  kycBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, height: 26 },
  kycBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  detailsBox: {
    backgroundColor: '#111827',
    borderRadius: 8,
    padding: 10,
    marginVertical: 8,
  },
  detailText: { color: '#9CA3AF', fontSize: 12, marginVertical: 2 },
  highlightText: { color: '#F3F4F6', fontWeight: '700' },

  docPanel: { backgroundColor: '#111827', borderRadius: 8, padding: 10, marginTop: 4, marginBottom: 8 },
  docPanelTitle: { color: '#D1D5DB', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  docRow: { flexDirection: 'row', gap: 10 },
  docThumbBox: { flex: 1, backgroundColor: '#1F2937', height: 75, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151', overflow: 'hidden' },
  docImage: { width: '100%', height: 52, resizeMode: 'cover' },
  docThumbLabel: { color: '#9CA3AF', fontSize: 10, fontWeight: '600', marginTop: 2 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  btnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  editCommissionBox: { width: '100%', backgroundColor: '#111827', padding: 10, borderRadius: 8 },
  commissionInput: {
    backgroundColor: '#1F2937',
    color: '#FFF',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  imageModalContainer: { width: '100%', maxWidth: 500, backgroundColor: '#111827', borderRadius: 14, padding: 14 },
  imageModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  imageModalTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  closeBtn: { padding: 2 },
  fullDocImage: { width: '100%', height: 350, borderRadius: 8 },

  gstr8ModalBox: { width: '100%', maxWidth: 540, backgroundColor: '#111827', borderRadius: 14, padding: 16 },
  gstrSummaryCard: { backgroundColor: '#1F2937', borderRadius: 8, padding: 12, gap: 4 },
  gstrValText: { color: '#F3F4F6', fontSize: 13, fontWeight: '700' },
  gstrItemRow: { backgroundColor: '#1F2937', borderRadius: 6, padding: 8, marginVertical: 4, borderWidth: 1, borderColor: '#374151' },
});
