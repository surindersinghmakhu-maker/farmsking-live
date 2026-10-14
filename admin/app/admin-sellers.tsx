import React, { useState, useEffect, useRef } from 'react';
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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { apiClient } from '@/src/api/client';
import { exportSellersToExcel } from '@/src/utils/excelExport';
import { playKycAlertChime } from '@/src/utils/audioAlert';
import { useExecutiveTheme } from '@/src/store/theme-context';

export default function AdminSellersScreen() {
  const router = useRouter();
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'VERIFIED' | 'PENDING' | 'REJECTED' | 'BLOCKED' | 'ALL'>('VERIFIED');
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [customCommission, setCustomCommission] = useState('5.0');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [expandedStoreIds, setExpandedStoreIds] = useState<Record<string, boolean>>({});

  // Category-wise commission modal state
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [categoryStore, setCategoryStore] = useState<any>(null);
  const [categoryCommissions, setCategoryCommissions] = useState({
    fertilizer: '2.0',
    seeds: '5.0',
    spray: '4.0',
    machinery: '3.0',
    feed: '2.0',
    general: '5.0',
  });
  const [savingCategoryCommission, setSavingCategoryCommission] = useState(false);

  // Live Bell notification & Audio chime state
  const [pendingKycCount, setPendingKycCount] = useState<number>(0);
  const prevPendingCountRef = useRef<number>(0);

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

  const toggleExpandStore = (id: string, defaultExpanded: boolean) => {
    setExpandedStoreIds((prev) => ({
      ...prev,
      [id]: prev[id] !== undefined ? !prev[id] : !defaultExpanded,
    }));
  };

  useEffect(() => {
    fetchStores();
  }, [selectedFilter]);

  useEffect(() => {
    // 25-second live background check for new seller KYC submissions
    const timer = setInterval(() => {
      apiClient.get('/seller/admin/stores?kycStatus=PENDING').then((res) => {
        const count = Array.isArray(res.data) ? res.data.length : 0;
        if (count > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
          playKycAlertChime();
        }
        prevPendingCountRef.current = count;
        setPendingKycCount(count);
      }).catch(() => {});
    }, 25000);
    return () => clearInterval(timer);
  }, []);

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
      const [res, pendingRes] = await Promise.all([
        apiClient.get(`/seller/admin/stores${kycParam}`),
        apiClient.get('/seller/admin/stores?kycStatus=PENDING').catch(() => ({ data: [] })),
      ]);
      setStores(res.data);
      const currentPending = Array.isArray(pendingRes.data) ? pendingRes.data.length : 0;
      if (currentPending > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
        playKycAlertChime();
      }
      prevPendingCountRef.current = currentPending;
      setPendingKycCount(currentPending);
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

  const openCategoryModal = (store: any) => {
    setCategoryStore(store);
    const existing = store.categoryCommissions || {};
    setCategoryCommissions({
      fertilizer: existing.fertilizer !== undefined ? String(existing.fertilizer) : '2.0',
      seeds: existing.seeds !== undefined ? String(existing.seeds) : '5.0',
      spray: existing.spray !== undefined ? String(existing.spray) : '4.0',
      machinery: existing.machinery !== undefined ? String(existing.machinery) : '3.0',
      feed: existing.feed !== undefined ? String(existing.feed) : '2.0',
      general: store.commissionRate !== undefined ? String(store.commissionRate) : '5.0',
    });
    setCategoryModalVisible(true);
  };

  const handleSaveCategoryCommissions = async () => {
    if (!categoryStore) return;
    try {
      setSavingCategoryCommission(true);
      const catPayload = {
        fertilizer: parseFloat(categoryCommissions.fertilizer || '2.0'),
        seeds: parseFloat(categoryCommissions.seeds || '5.0'),
        spray: parseFloat(categoryCommissions.spray || '4.0'),
        machinery: parseFloat(categoryCommissions.machinery || '3.0'),
        feed: parseFloat(categoryCommissions.feed || '2.0'),
      };
      const generalRate = parseFloat(categoryCommissions.general || '5.0');
      await apiClient.patch(`/seller/admin/stores/${categoryStore.id}/settings`, {
        categoryCommissions: catPayload,
        commissionRate: generalRate,
      });
      showAlert('Commission Saved ✅', `Category commission for seller "${categoryStore.storeName}" saved successfully.`);
      setCategoryModalVisible(false);
      fetchStores();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Could not save category commissions.';
      showAlert('Error ⚠️', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setSavingCategoryCommission(false);
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

  const handleBlockToggle = async (storeId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'BLOCKED' ? 'VERIFIED' : 'BLOCKED';
    const action = newStatus === 'BLOCKED' ? 'block' : 'unblock';
    try {
      await apiClient.patch(`/seller/admin/stores/${storeId}/kyc`, {
        status: newStatus,
        commissionRate: parseFloat(customCommission || '5.0'),
        rejectionReason: newStatus === 'BLOCKED' ? (rejectionReasonInput.trim() || 'Store blocked by Admin due to policy violation.') : undefined,
      });
      showAlert(`Store ${action === 'block' ? 'Blocked 🚫' : 'Unblocked ✅'}`, `Seller store has been ${action}ed successfully.`);
      setRejectionReasonInput('');
      fetchStores();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || `Failed to ${action} store.`;
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar barStyle={isLight ? 'dark-content' : 'light-content'} backgroundColor={isLight ? '#ffffff' : '#03140a'} />

      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderBottomColor: cardBorder, borderBottomWidth: 1 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={20} color={textColor} />
          </TouchableOpacity>
          <View style={styles.headerTitleBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MaterialCommunityIcons name="shield-check-outline" size={20} color={isLight ? '#16a34a' : '#10B981'} />
              <Text style={[styles.headerTitle, { color: textColor }]}>Seller Verification Control</Text>
            </View>
            <Text style={[styles.headerSubtitle, { color: subTextColor }]}>FarmsKing National Vendor Hub • Admin Console</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          {/* Live Sound Alert & Bell Notification */}
          <TouchableOpacity
            style={[
              styles.headerActionBtn,
              pendingKycCount > 0 && { backgroundColor: isLight ? '#fef3c7' : '#78350F', borderColor: '#F59E0B', borderWidth: 1 },
              isLight && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1 },
            ]}
            onPress={() => {
              playKycAlertChime();
              setSelectedFilter('PENDING');
            }}
          >
            <Ionicons
              name={pendingKycCount > 0 ? 'notifications' : 'notifications-outline'}
              size={16}
              color={pendingKycCount > 0 ? '#F59E0B' : (isLight ? '#16a34a' : '#10B981')}
            />
            {pendingKycCount > 0 && (
              <View style={styles.liveBellBadge}>
                <Text style={styles.liveBellBadgeText}>{pendingKycCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* 1-Click Excel Export for All Sellers */}
          <TouchableOpacity
            style={[styles.headerActionBtn, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : '#064E3B', borderColor: isLight ? '#16a34a' : '#10B981', borderWidth: 1 }]}
            onPress={() => exportSellersToExcel(stores)}
          >
            <Ionicons name="download-outline" size={16} color={isLight ? '#16a34a' : '#34D399'} />
            <Text style={[styles.headerActionText, { color: isLight ? '#16a34a' : '#34D399', fontWeight: '800' }]}>Excel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.headerActionBtn, isLight && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', borderWidth: 1 }]}
            onPress={() => router.push('/shop')}
          >
            <Ionicons name="storefront" size={16} color={isLight ? '#16a34a' : '#10B981'} />
            <Text style={[styles.headerActionText, isLight && { color: '#0f172a' }]}>Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerActionBtn, styles.refreshBtn, isLight && { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}
            onPress={fetchStores}
          >
            <Ionicons name="refresh" size={16} color={isLight ? '#16a34a' : '#10B981'} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter Chips Bar */}
      <View style={[styles.filterBarContainer, { backgroundColor: isLight ? '#f8fafc' : '#041209', borderBottomColor: cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterBar}>
          {(['VERIFIED', 'PENDING', 'REJECTED', 'BLOCKED', 'ALL'] as const).map((filter) => {
            const isActive = selectedFilter === filter;
            const dotColor =
              filter === 'VERIFIED' ? '#10B981' :
              filter === 'PENDING' ? '#F59E0B' :
              filter === 'REJECTED' ? '#EF4444' :
              filter === 'BLOCKED' ? '#DC2626' :
              '#6B7280';
            return (
              <TouchableOpacity
                key={filter}
                style={[
                  styles.filterChip,
                  isLight && { backgroundColor: '#ffffff', borderColor: '#cbd5e1' },
                  isActive && (isLight ? { backgroundColor: '#16a34a', borderColor: '#16a34a' } : styles.activeFilterChip),
                  isActive && filter === 'BLOCKED' && { backgroundColor: '#7F1D1D', borderColor: '#DC2626' },
                ]}
                onPress={() => setSelectedFilter(filter as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.filterDot, { backgroundColor: dotColor }]} />
                <Text
                  style={[
                    styles.filterText,
                    isLight && { color: '#475569' },
                    isActive && (isLight ? { color: '#ffffff', fontWeight: '800' } : styles.activeFilterText),
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading Seller Verification Records...</Text>
          </View>
        ) : fetchError ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="shield-lock-outline" size={48} color="#EF4444" />
            <Text style={styles.errorTitle}>Access Restricted</Text>
            <Text style={styles.errorSubtext}>{fetchError}</Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push('/(auth)/sign-in' as any)}
            >
              <Ionicons name="key-outline" size={16} color="#FFF" />
              <Text style={styles.loginBtnText}> Admin Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : stores.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="store-search-outline" size={44} color="#4B5563" />
            <Text style={styles.emptyText}>No seller accounts found under filter "{selectedFilter}"</Text>
          </View>
        ) : (
          stores.map((store) => {
            const isVerified = store.kycStatus === 'VERIFIED';
            const isRejected = store.kycStatus === 'REJECTED';
            const isBlocked = store.kycStatus === 'BLOCKED';
            const defaultExpanded = !isVerified && !isRejected;
            const isExpanded = expandedStoreIds[store.id] !== undefined ? expandedStoreIds[store.id] : defaultExpanded;

            return (
              <View key={store.id} style={[styles.storeCard, isLight && { backgroundColor: cardBg, borderColor: cardBorder }]}>
                {/* Compact Card Header Row */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={[styles.storeHeader, isLight && { backgroundColor: cardBg }]}
                  onPress={() => toggleExpandStore(store.id, defaultExpanded)}
                >
                  <View style={styles.storeHeaderMain}>
                    <View style={styles.storeTitleRow}>
                      <View style={styles.storeIconBox}>
                        <Ionicons name="business" size={14} color="#10B981" />
                      </View>
                      <Text style={[styles.storeName, isLight && { color: textColor }]} numberOfLines={1}>{store.storeName}</Text>
                    </View>

                    <View style={styles.metaRow}>
                      <View style={styles.metaItem}>
                        <Ionicons name="person-outline" size={12} color={isLight ? '#64748b' : '#9CA3AF'} />
                        <Text style={[styles.metaText, isLight && { color: subTextColor }]} numberOfLines={1}>{store.seller?.name || 'Seller'}</Text>
                      </View>
                      <Text style={[styles.metaDot, isLight && { color: '#94a3b8' }]}>•</Text>
                      <View style={styles.metaItem}>
                        <Ionicons name="call-outline" size={12} color={isLight ? '#64748b' : '#9CA3AF'} />
                        <Text style={[styles.metaText, isLight && { color: subTextColor }]}>{store.seller?.mobile || 'N/A'}</Text>
                      </View>
                      <Text style={[styles.metaDot, isLight && { color: '#94a3b8' }]}>•</Text>
                      <View style={styles.metaItem}>
                        <Ionicons name="globe-outline" size={12} color="#059669" />
                        <Text style={styles.slugText} numberOfLines={1}>{store.slug}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Status Badge + Expand Toggle Pill */}
                  <View style={styles.badgeContainer}>
                    <View
                      style={[
                        styles.kycBadge,
                        isVerified ? styles.badgeVerified :
                        isRejected ? styles.badgeRejected :
                        isBlocked ? styles.badgeBlocked :
                        styles.badgePending,
                      ]}
                    >
                      <View style={[
                        styles.statusDot,
                        { backgroundColor: isVerified ? '#34D399' : isRejected ? '#F87171' : isBlocked ? '#EF4444' : '#FBBF24' }
                      ]} />
                      <Text style={[
                        styles.kycBadgeText,
                        { color: isVerified ? '#6EE7B7' : isRejected ? '#FCA5A5' : isBlocked ? '#FCA5A5' : '#FDE68A' }
                      ]}>
                        {isBlocked ? '🚫 BLOCKED' : store.kycStatus}
                      </Text>
                    </View>

                    <View style={[styles.expandPill, isLight && { backgroundColor: '#f1f5f9' }]}>
                      <Text style={[styles.expandPillText, isLight && { color: subTextColor }]}>{isExpanded ? 'Hide' : 'Inspect'}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={14}
                        color={isLight ? '#64748b' : '#9CA3AF'}
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <View style={[styles.expandedContent, isLight && { backgroundColor: '#f8fafc', borderTopColor: cardBorder }]}>
                    {/* Rejection Alert */}
                    {isRejected && store.rejectionReason && (
                      <View style={styles.rejectionAlert}>
                        <Ionicons name="alert-circle-outline" size={16} color="#F87171" />
                        <Text style={styles.rejectionText}>
                          Reason: {store.rejectionReason}
                        </Text>
                      </View>
                    )}

                    {/* Blocked Alert */}
                    {isBlocked && (
                      <View style={[styles.rejectionAlert, { backgroundColor: '#1C0303', borderColor: '#DC2626' }]}>
                        <Ionicons name="ban-outline" size={16} color="#EF4444" />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.rejectionText, { color: '#FCA5A5', fontWeight: '800' }]}>
                            Store Blocked by Admin
                          </Text>
                          {store.rejectionReason && (
                            <Text style={[styles.rejectionText, { color: '#FDA4AF', marginTop: 2 }]}>
                              Reason: {store.rejectionReason}
                            </Text>
                          )}
                        </View>
                      </View>
                    )}

                    {/* Concise Details Grid */}
                    <View style={[styles.detailsGrid, isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' }]}>
                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isLight && { color: '#64748b' }]}>Firm Legal Name:</Text>
                        <Text style={[styles.detailVal, isLight && { color: textColor }]} numberOfLines={1}>{store.legalName || 'N/A'}</Text>
                      </View>
                      
                      <View style={styles.detailTwoCol}>
                        <View style={styles.detailCol}>
                          <Text style={[styles.detailLabel, isLight && { color: '#64748b' }]}>GSTIN:</Text>
                          <Text style={styles.detailValMonospace}>{store.gstin || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailCol}>
                          <Text style={[styles.detailLabel, isLight && { color: '#64748b' }]}>PAN:</Text>
                          <Text style={styles.detailValMonospace}>{store.panNumber || 'N/A'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailTwoCol}>
                        <View style={styles.detailCol}>
                          <Text style={[styles.detailLabel, isLight && { color: '#64748b' }]}>Bank Account:</Text>
                          <Text style={styles.detailValMonospace}>{store.bankAccountNo || 'N/A'}</Text>
                        </View>
                        <View style={styles.detailCol}>
                          <Text style={[styles.detailLabel, isLight && { color: '#64748b' }]}>IFSC Code:</Text>
                          <Text style={styles.detailValMonospace}>{store.bankIfsc || 'N/A'}</Text>
                        </View>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isLight && { color: '#64748b' }]}>Warehouse:</Text>
                        <Text style={[styles.detailVal, isLight && { color: textColor }]} numberOfLines={2}>
                          {store.pickupAddress ? `${store.pickupAddress}, ${store.pickupCity}, ${store.pickupState} - ${store.pickupPincode}` : 'N/A'}
                        </Text>
                      </View>

                      <View style={styles.detailRow}>
                        <Text style={[styles.detailLabel, isLight && { color: '#64748b' }]}>Platform Commission:</Text>
                        <Text style={styles.commissionVal}>{store.commissionRate}%</Text>
                      </View>

                      {store.categoryCommissions && Object.keys(store.categoryCommissions).length > 0 && (
                        <View style={[styles.categoryRatesBox, isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                          <Text style={[styles.categoryRatesTitle, isLight && { color: textColor }]}>Category Commission Breakdown:</Text>
                          <View style={styles.categoryRatesRow}>
                            {store.categoryCommissions.fertilizer !== undefined && (
                              <View style={[styles.catRatePill, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
                                <Text style={[styles.catRatePillText, isLight && { color: textColor }]}>🌱 Fertilizer: {store.categoryCommissions.fertilizer}%</Text>
                              </View>
                            )}
                            {store.categoryCommissions.seeds !== undefined && (
                              <View style={[styles.catRatePill, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
                                <Text style={[styles.catRatePillText, isLight && { color: textColor }]}>🌾 Seeds: {store.categoryCommissions.seeds}%</Text>
                              </View>
                            )}
                            {store.categoryCommissions.spray !== undefined && (
                              <View style={[styles.catRatePill, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
                                <Text style={[styles.catRatePillText, isLight && { color: textColor }]}>🧪 Pesticides & Spray: {store.categoryCommissions.spray}%</Text>
                              </View>
                            )}
                            {store.categoryCommissions.machinery !== undefined && (
                              <View style={[styles.catRatePill, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
                                <Text style={[styles.catRatePillText, isLight && { color: textColor }]}>🚜 Machinery: {store.categoryCommissions.machinery}%</Text>
                              </View>
                            )}
                            {store.categoryCommissions.feed !== undefined && (
                              <View style={[styles.catRatePill, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
                                <Text style={[styles.catRatePillText, isLight && { color: textColor }]}>🐄 Cattle Feed: {store.categoryCommissions.feed}%</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      )}
                    </View>

                    {/* Uploaded Documents Panel */}
                    {!isRejected && !isBlocked && (
                      <View style={[styles.docPanel, isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' }]}>
                        <Text style={[styles.docPanelTitle, isLight && { color: '#64748b' }]}>Verified Verification Uploads</Text>
                        <View style={styles.docRow}>
                          {/* GST Doc */}
                          <TouchableOpacity
                            style={styles.docThumbBox}
                            activeOpacity={0.8}
                            onPress={() => {
                              if (store.gstDocUrl) {
                                setPreviewDocTitle(`GST Certificate - ${store.storeName}`);
                                setPreviewDocUrl(store.gstDocUrl);
                              } else {
                                showAlert('No Document ⚠️', 'Seller has not attached a GST Certificate photo.');
                              }
                            }}
                          >
                            {store.gstDocUrl ? (
                              <Image source={{ uri: store.gstDocUrl }} style={styles.docImage} />
                            ) : (
                              <View style={styles.docPlaceholder}>
                                <Ionicons name="document-text-outline" size={20} color="#4B5563" />
                              </View>
                            )}
                            <Text style={styles.docThumbLabel}>GST Cert</Text>
                          </TouchableOpacity>

                          {/* PAN Card Doc */}
                          <TouchableOpacity
                            style={styles.docThumbBox}
                            activeOpacity={0.8}
                            onPress={() => {
                              if (store.panDocUrl) {
                                setPreviewDocTitle(`PAN Card - ${store.storeName}`);
                                setPreviewDocUrl(store.panDocUrl);
                              } else {
                                showAlert('No Document ⚠️', 'Seller has not attached a PAN Card photo.');
                              }
                            }}
                          >
                            {store.panDocUrl ? (
                              <Image source={{ uri: store.panDocUrl }} style={styles.docImage} />
                            ) : (
                              <View style={styles.docPlaceholder}>
                                <Ionicons name="card-outline" size={20} color="#4B5563" />
                              </View>
                            )}
                            <Text style={styles.docThumbLabel}>PAN Card</Text>
                          </TouchableOpacity>

                          {/* Cancelled Cheque / Bank Passbook Doc */}
                          <TouchableOpacity
                            style={styles.docThumbBox}
                            activeOpacity={0.8}
                            onPress={() => {
                              if (store.chequeDocUrl) {
                                setPreviewDocTitle(`Bank Passbook / Cheque - ${store.storeName}`);
                                setPreviewDocUrl(store.chequeDocUrl);
                              } else {
                                showAlert('No Document ⚠️', 'Seller has not attached a Cancelled Cheque / Passbook photo.');
                              }
                            }}
                          >
                            {store.chequeDocUrl ? (
                              <Image source={{ uri: store.chequeDocUrl }} style={styles.docImage} />
                            ) : (
                              <View style={styles.docPlaceholder}>
                                <Ionicons name="cash-outline" size={20} color="#4B5563" />
                              </View>
                            )}
                            <Text style={styles.docThumbLabel}>Bank Cheque</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}

                    {/* Action Bar */}
                    {!isRejected && (
                      <View style={styles.actionRow}>
                        {editingStoreId === store.id ? (
                          <View style={styles.editCommissionBox}>
                            <View style={styles.inputGroup}>
                              <Text style={styles.inputLabel}>Platform Commission Rate (%)</Text>
                              <TextInput
                                style={styles.compactInput}
                                keyboardType="numeric"
                                value={customCommission}
                                onChangeText={setCustomCommission}
                                placeholder="5.0"
                                placeholderTextColor="#6B7280"
                              />
                            </View>

                            <View style={[styles.inputGroup, { marginTop: 8 }]}>
                              <Text style={[styles.inputLabel, { color: '#F87171' }]}>Rejection Reason (Required if rejecting)</Text>
                              <TextInput
                                style={[styles.compactInput, { borderColor: '#991B1B' }]}
                                placeholder="e.g. Invalid GSTIN or blurry document photo"
                                placeholderTextColor="#6B7280"
                                value={rejectionReasonInput}
                                onChangeText={setRejectionReasonInput}
                              />
                            </View>

                            <View style={styles.drawerActions}>
                              <TouchableOpacity
                                style={[styles.btn, styles.btnApprove]}
                                onPress={() => handleUpdateKyc(store.id, 'VERIFIED')}
                              >
                                <Ionicons name="checkmark-circle" size={15} color="#FFF" />
                                <Text style={styles.btnText}> Approve Store</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.btn, styles.btnReject]}
                                onPress={() => handleUpdateKyc(store.id, 'REJECTED')}
                              >
                                <Ionicons name="close-circle" size={15} color="#FFF" />
                                <Text style={styles.btnText}> Reject Store</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.btn, styles.btnCancel]}
                                onPress={() => setEditingStoreId(null)}
                              >
                                <Text style={[styles.btnText, { color: '#9CA3AF' }]}>Cancel</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <View style={styles.mainBtnGroup}>
                            {/* Verify KYC button: only for PENDING stores, hidden if already VERIFIED or BLOCKED */}
                            {!isVerified && !isBlocked && (
                              <TouchableOpacity
                                style={[styles.btn, styles.btnVerify]}
                                onPress={() => {
                                  setEditingStoreId(store.id);
                                  setCustomCommission(store.commissionRate?.toString() || '5.0');
                                }}
                              >
                                <Ionicons name="shield-checkmark-outline" size={15} color="#FFF" />
                                <Text style={styles.btnText}> Verify KYC</Text>
                              </TouchableOpacity>
                            )}

                            {/* Block / Unblock Toggle — shown for VERIFIED and BLOCKED stores */}
                            {(isVerified || isBlocked) && (
                              <TouchableOpacity
                                style={[
                                  styles.btn,
                                  isBlocked
                                    ? { backgroundColor: '#059669' }
                                    : { backgroundColor: '#7C1D1D', borderWidth: 1, borderColor: '#DC2626' },
                                ]}
                                onPress={() => {
                                  if (!isBlocked) {
                                    setRejectionReasonInput('');
                                  }
                                  handleBlockToggle(store.id, store.kycStatus);
                                }}
                              >
                                <Ionicons
                                  name={isBlocked ? 'lock-open-outline' : 'ban-outline'}
                                  size={15}
                                  color="#FFF"
                                />
                                <Text style={styles.btnText}>
                                  {isBlocked ? ' Unblock Store' : ' Block Store'}
                                </Text>
                              </TouchableOpacity>
                            )}

                            {!isBlocked && (
                              <TouchableOpacity
                                style={[styles.btn, { backgroundColor: '#1E3A8A', borderWidth: 1, borderColor: '#3B82F6' }]}
                                onPress={() => openCategoryModal(store)}
                              >
                                <Ionicons name="options-outline" size={15} color="#93C5FD" />
                                <Text style={[styles.btnText, { color: '#93C5FD' }]}> % ਕੈਟੇਗਰੀ ਕਮਿਸ਼ਨ</Text>
                              </TouchableOpacity>
                            )}

                            {!isBlocked && (
                              <TouchableOpacity
                                style={[styles.btn, styles.btnGstr8]}
                                onPress={() => handleDownloadGstr8(store.id)}
                              >
                                <MaterialCommunityIcons name="file-document-outline" size={15} color="#FFF" />
                                <Text style={styles.btnText}> GSTR-8 Audit</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Document Inspection Image Modal */}
      {previewDocUrl ? (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.imageModalContainer}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle} numberOfLines={1}>{previewDocTitle}</Text>
                <TouchableOpacity onPress={() => setPreviewDocUrl(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: previewDocUrl }} style={styles.fullDocImage} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      ) : null}

      {/* GSTR-8 Tax Report Modal */}
      {gstr8ModalVisible ? (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.gstr8ModalBox}>
              <View style={styles.imageModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <MaterialCommunityIcons name="cash-register" size={20} color="#10B981" />
                  <Text style={styles.imageModalTitle}>GSTR-8 (1% GST TCS) Audit Report</Text>
                </View>
                <TouchableOpacity onPress={() => setGstr8ModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color="#FFF" />
                </TouchableOpacity>
              </View>

              {isFetchingGstr8 ? (
                <ActivityIndicator size="large" color="#10B981" style={{ marginVertical: 30 }} />
              ) : gstr8Data ? (
                <ScrollView style={{ maxHeight: 420, paddingVertical: 10 }}>
                  <View style={styles.gstrSummaryCard}>
                    <View style={styles.gstrRow}>
                      <Text style={styles.gstrLabel}>Gross Sales Value:</Text>
                      <Text style={[styles.gstrValText, { color: '#10B981' }]}>₹{gstr8Data.totalGrossSales}</Text>
                    </View>
                    <View style={styles.gstrRow}>
                      <Text style={styles.gstrLabel}>Net Taxable Supply:</Text>
                      <Text style={[styles.gstrValText, { color: '#60A5FA' }]}>₹{gstr8Data.netTaxableValue}</Text>
                    </View>
                    <View style={styles.gstrRow}>
                      <Text style={styles.gstrLabel}>0.5% CGST TCS:</Text>
                      <Text style={styles.gstrValText}>₹{gstr8Data.cgstTcs}</Text>
                    </View>
                    <View style={styles.gstrRow}>
                      <Text style={styles.gstrLabel}>0.5% SGST TCS:</Text>
                      <Text style={styles.gstrValText}>₹{gstr8Data.sgstTcs}</Text>
                    </View>
                    <View style={[styles.gstrRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#374151' }]}>
                      <Text style={[styles.gstrLabel, { color: '#FFF', fontWeight: '800' }]}>Total 1% TCS Collected:</Text>
                      <Text style={[styles.gstrValText, { color: '#F59E0B', fontSize: 15, fontWeight: '800' }]}>₹{gstr8Data.totalTcs}</Text>
                    </View>
                  </View>

                  <Text style={styles.gstrSectionHeader}>
                    Eligible Sales Orders ({gstr8Data.itemCount || 0} items)
                  </Text>
                  {gstr8Data.itemsSummary && gstr8Data.itemsSummary.length > 0 ? (
                    gstr8Data.itemsSummary.map((item: any, idx: number) => (
                      <View key={idx} style={styles.gstrItemRow}>
                        <Text style={{ color: '#F3F4F6', fontSize: 13, fontWeight: '700' }}>{item.productName}</Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                          HSN: {item.hsnCode} | Qty: {item.quantity} | Subtotal: ₹{item.subtotal}
                        </Text>
                        <Text style={{ color: '#F59E0B', fontSize: 11, fontWeight: '700', marginTop: 2 }}>
                          1% TCS Share: ₹{item.tcsAmount} (Order: #{item.orderNumber})
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>No taxable sales recorded for selected period.</Text>
                  )}
                </ScrollView>
              ) : null}
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Simplified Category-Wise Commission Setting Modal */}
      {categoryModalVisible && categoryStore ? (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.categoryModalBox, isLight && { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.imageModalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="options" size={20} color="#34D399" />
                  <Text style={[styles.imageModalTitle, isLight && { color: textColor }]}>
                    Seller Commission Rates ({categoryStore.storeName})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setCategoryModalVisible(false)} style={styles.closeBtn}>
                  <Ionicons name="close" size={22} color={isLight ? '#64748b' : '#FFF'} />
                </TouchableOpacity>
              </View>

              <Text style={[styles.modalHelperText, isLight && { color: subTextColor }]}>
                Configure category-specific commission rates (e.g. Fertilizer at 2%, Seeds at 5%):
              </Text>

              {/* Preset quick buttons */}
              <View style={styles.presetRow}>
                <TouchableOpacity
                  style={[styles.presetBtn, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}
                  onPress={() =>
                    setCategoryCommissions((prev) => ({
                      ...prev,
                      fertilizer: '2.0',
                      seeds: '5.0',
                      spray: '4.0',
                      machinery: '3.0',
                    }))
                  }
                >
                  <Text style={[styles.presetBtnText, isLight && { color: textColor }]}>⚡ Standard (Fert 2% / Seed 5% / Spray 4%)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.presetBtn, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}
                  onPress={() =>
                    setCategoryCommissions((prev) => ({
                      ...prev,
                      fertilizer: '1.5',
                      seeds: '4.0',
                      spray: '3.0',
                      machinery: '2.5',
                    }))
                  }
                >
                  <Text style={[styles.presetBtnText, isLight && { color: textColor }]}>🏷️ Low-Margin (Fert 1.5% / Seed 4%)</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380, marginVertical: 8 }}>
                <View style={styles.categoryInputGrid}>
                  {/* Fertilizer */}
                  <View style={styles.catInputItem}>
                    <Text style={[styles.catInputLabel, isLight && { color: subTextColor }]}>🌱 Fertilizer (%)</Text>
                    <TextInput
                      style={[styles.catInputField, isLight && { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: textColor }]}
                      keyboardType="numeric"
                      value={categoryCommissions.fertilizer}
                      onChangeText={(val) => setCategoryCommissions((c) => ({ ...c, fertilizer: val }))}
                      placeholder="2.0"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Seeds */}
                  <View style={styles.catInputItem}>
                    <Text style={[styles.catInputLabel, isLight && { color: subTextColor }]}>🌾 Seeds (%)</Text>
                    <TextInput
                      style={[styles.catInputField, isLight && { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: textColor }]}
                      keyboardType="numeric"
                      value={categoryCommissions.seeds}
                      onChangeText={(val) => setCategoryCommissions((c) => ({ ...c, seeds: val }))}
                      placeholder="5.0"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Pesticides / Spray */}
                  <View style={styles.catInputItem}>
                    <Text style={[styles.catInputLabel, isLight && { color: subTextColor }]}>🧪 Pesticides & Spray (%)</Text>
                    <TextInput
                      style={[styles.catInputField, isLight && { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: textColor }]}
                      keyboardType="numeric"
                      value={categoryCommissions.spray}
                      onChangeText={(val) => setCategoryCommissions((c) => ({ ...c, spray: val }))}
                      placeholder="4.0"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Machinery */}
                  <View style={styles.catInputItem}>
                    <Text style={[styles.catInputLabel, isLight && { color: subTextColor }]}>🚜 Machinery (%)</Text>
                    <TextInput
                      style={[styles.catInputField, isLight && { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: textColor }]}
                      keyboardType="numeric"
                      value={categoryCommissions.machinery}
                      onChangeText={(val) => setCategoryCommissions((c) => ({ ...c, machinery: val }))}
                      placeholder="3.0"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Feed */}
                  <View style={styles.catInputItem}>
                    <Text style={[styles.catInputLabel, isLight && { color: subTextColor }]}>🐄 Cattle Feed (%)</Text>
                    <TextInput
                      style={[styles.catInputField, isLight && { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: textColor }]}
                      keyboardType="numeric"
                      value={categoryCommissions.feed}
                      onChangeText={(val) => setCategoryCommissions((c) => ({ ...c, feed: val }))}
                      placeholder="2.0"
                      placeholderTextColor="#64748B"
                    />
                  </View>

                  {/* Default / General Store Rate */}
                  <View style={styles.catInputItem}>
                    <Text style={[styles.catInputLabel, isLight && { color: subTextColor }]}>📦 General Store Rate (%)</Text>
                    <TextInput
                      style={[styles.catInputField, isLight && { backgroundColor: '#f8fafc', borderColor: '#cbd5e1', color: textColor }]}
                      keyboardType="numeric"
                      value={categoryCommissions.general}
                      onChangeText={(val) => setCategoryCommissions((c) => ({ ...c, general: val }))}
                      placeholder="5.0"
                      placeholderTextColor="#64748B"
                    />
                  </View>
                </View>
              </ScrollView>

              <View style={styles.catModalFooter}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnCancel, { flex: 1 }]}
                  onPress={() => setCategoryModalVisible(false)}
                >
                  <Text style={[styles.btnText, { color: '#9CA3AF' }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btn, styles.btnApprove, { flex: 2 }]}
                  disabled={savingCategoryCommission}
                  onPress={handleSaveCategoryCommissions}
                >
                  {savingCategoryCommission ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={16} color="#FFF" />
                      <Text style={styles.btnText}> ਕਮਿਸ਼ਨ ਸੇਵ ਕਰੋ (Save)</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#022C22',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#064E3B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#064E3B40',
  },
  headerTitleBox: {
    flex: 1,
  },
  headerTitle: {
    color: '#F9FAFB',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: '#6EE7B7',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#064E3B60',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#05966940',
  },
  refreshBtn: {
    paddingHorizontal: 8,
  },
  headerActionText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '700',
  },

  // Filter Chips
  filterBarContainer: {
    backgroundColor: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingVertical: 8,
  },
  filterBar: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeFilterChip: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  activeFilterText: {
    color: '#ECFDF5',
  },

  scrollContent: {
    padding: 12,
  },
  loadingBox: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: 20,
  },
  errorTitle: {
    color: '#F87171',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 8,
  },
  errorSubtext: {
    color: '#9CA3AF',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  loginBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyText: {
    color: '#6B7280',
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },

  // Store Card
  storeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1E293B',
    overflow: 'hidden',
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0F172A',
  },
  storeHeaderMain: {
    flex: 1,
    marginRight: 10,
  },
  storeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#064E3B40',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#05966930',
  },
  storeName: {
    color: '#F1F5F9',
    fontSize: 14,
    fontWeight: '800',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  metaDot: {
    color: '#475569',
    fontSize: 10,
  },
  slugText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '600',
  },

  // Badges & Actions
  badgeContainer: {
    alignItems: 'flex-end',
    gap: 4,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  badgeVerified: {
    backgroundColor: '#064E3B50',
    borderColor: '#05966980',
  },
  badgeRejected: {
    backgroundColor: '#7F1D1D50',
    borderColor: '#DC262680',
  },
  badgePending: {
    backgroundColor: '#78350F50',
    borderColor: '#D9770680',
  },
  badgeBlocked: {
    backgroundColor: '#7F1D1D80',
    borderColor: '#DC2626',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  kycBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  expandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#1E293B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  expandPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '700',
  },

  // Expanded Content
  expandedContent: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    backgroundColor: '#090D16',
  },
  rejectionAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#270C0C',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#7F1D1D',
    marginTop: 8,
  },
  rejectionText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },

  // Details Grid
  detailsGrid: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailTwoCol: {
    flexDirection: 'row',
    gap: 10,
  },
  detailCol: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  detailVal: {
    color: '#E2E8F0',
    fontSize: 11,
    fontWeight: '700',
  },
  detailValMonospace: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  commissionVal: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '800',
  },

  // Doc Panel
  docPanel: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  docPanelTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  docRow: {
    flexDirection: 'row',
    gap: 8,
  },
  docThumbBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    height: 60,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  docImage: {
    width: '100%',
    height: 42,
    resizeMode: 'cover',
  },
  docPlaceholder: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docThumbLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
  },

  // Actions
  actionRow: {
    marginTop: 8,
  },
  mainBtnGroup: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  btnVerify: {
    backgroundColor: '#059669',
  },
  btnGstr8: {
    backgroundColor: '#2563EB',
  },
  btnApprove: {
    backgroundColor: '#059669',
    flex: 1,
    justifyContent: 'center',
  },
  btnReject: {
    backgroundColor: '#DC2626',
    flex: 1,
    justifyContent: 'center',
  },
  btnCancel: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
  },
  btnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },

  editCommissionBox: {
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  inputGroup: {
    gap: 4,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 11,
    fontWeight: '700',
  },
  compactInput: {
    backgroundColor: '#1E293B',
    color: '#F8FAFC',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  drawerActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 10,
  },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  imageModalContainer: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  imageModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageModalTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    padding: 2,
  },
  fullDocImage: {
    width: '100%',
    height: 320,
    borderRadius: 6,
  },

  gstr8ModalBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  gstrSummaryCard: {
    backgroundColor: '#1E293B',
    borderRadius: 8,
    padding: 10,
    gap: 6,
  },
  gstrRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gstrLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  gstrValText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
  },
  gstrSectionHeader: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  gstrItemRow: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    padding: 8,
    marginVertical: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },

  // Live Bell notification badge
  liveBellBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#022C22',
  },
  liveBellBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '900',
  },

  // Category Rates display in store card
  categoryRatesBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  categoryRatesTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 5,
  },
  categoryRatesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catRatePill: {
    backgroundColor: '#1E293B',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catRatePillText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '700',
  },

  // Category Commission Modal styles
  categoryModalBox: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
  },
  modalHelperText: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 10,
    lineHeight: 16,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  presetBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  presetBtnText: {
    color: '#6EE7B7',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryInputGrid: {
    gap: 8,
  },
  catInputItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E293B',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catInputLabel: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  catInputField: {
    backgroundColor: '#0F172A',
    color: '#34D399',
    fontWeight: '800',
    fontSize: 14,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 80,
    textAlign: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  catModalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
});
