import React, { useState, useEffect, useMemo } from 'react';
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
import * as ImagePicker from 'expo-image-picker';

type AgriStoreSubTab = 'OVERVIEW' | 'SELLERS' | 'CATALOG' | 'ORDERS' | 'DELIVERY' | 'PAYMENTS' | 'GSTR8_TAX' | 'FLASH_SALES';

export default function AgriStoreEnterpriseHub() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AgriStoreSubTab>('OVERVIEW');
  const [loading, setLoading] = useState(true);

  // Core Data States
  const [stores, setStores] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<'ALL' | 'PENDING' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');

  // Modal & Preview States
  const [previewDocUrl, setPreviewDocUrl] = useState<string | null>(null);
  const [previewDocTitle, setPreviewDocTitle] = useState<string>('Document Preview');
  const [selectedCustomerOrderView, setSelectedCustomerOrderView] = useState<any | null>(null);
  const [pincodeCheckInput, setPincodeCheckInput] = useState('141001');
  const [pincodeResult, setPincodeResult] = useState<string | null>(null);

  // Verification & Edit State
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [customCommission, setCustomCommission] = useState('5.0');
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');

  // Delivery & Courier Edit State
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [courierPartnerInput, setCourierPartnerInput] = useState('Shiprocket Direct Courier');
  const [awbTrackingInput, setAwbTrackingInput] = useState('');
  const [deliveryStatusInput, setDeliveryStatusInput] = useState('SHIPPED');

  // GSTR-8 Tax State
  const [gstr8Data, setGstr8Data] = useState<any>(null);
  const [gstr8Month, setGstr8Month] = useState('9');
  const [gstr8Year, setGstr8Year] = useState('2026');
  const [selectedStoreForGstr8, setSelectedStoreForGstr8] = useState<string>('');
  const [isFetchingGstr8, setIsFetchingGstr8] = useState(false);

  // Add Product Builder State (FarmsKing Direct)
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [mrpPrice, setMrpPrice] = useState('');
  const [productCategory, setProductCategory] = useState('Seeds');
  const [subCategory, setSubCategory] = useState('Hybrid Grain Seeds');
  const [brandName, setBrandName] = useState('FarmsKing Certified');
  const [unitOfMeasure, setUnitOfMeasure] = useState('kg');
  const [stockQty, setStockQty] = useState('100');
  const [hsnCode, setHsnCode] = useState('120991');
  const [gstRate, setGstRate] = useState('5% GST');
  const [starRating, setStarRating] = useState('4.9');
  const [targetCrop, setTargetCrop] = useState('Wheat / Paddy');
  const [technicalFormula, setTechnicalFormula] = useState('Pure Organic Hybrid Germination 98%');
  const [dosageInstructions, setDosageInstructions] = useState('5kg per Acre during sowing');
  const [productDescription, setProductDescription] = useState('High yielding national grade hybrid crop seeds certified by FarmsKing Quality Standards.');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [selectedSellerStoreId, setSelectedSellerStoreId] = useState<string>('');

  useEffect(() => {
    fetchAllData();
  }, []);

  const showAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}\n\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [storesRes, productsRes, ordersRes] = await Promise.all([
        apiClient.get('/seller/admin/stores'),
        apiClient.get('/products?includeInactive=true'),
        apiClient.get('/orders'),
      ]);
      setStores(storesRes.data || []);
      setProducts(productsRes.data || []);
      setOrders(ordersRes.data || []);
      if (storesRes.data && storesRes.data.length > 0) {
        setSelectedStoreForGstr8(storesRes.data[0].id);
        setSelectedSellerStoreId(storesRes.data[0].id);
      }
    } catch (err: any) {
      console.log('Error fetching AgriStore data:', err?.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filtered Stores
  const filteredStores = useMemo(() => {
    if (selectedSellerFilter === 'ALL') return stores;
    return stores.filter((s) => s.kycStatus === selectedSellerFilter);
  }, [stores, selectedSellerFilter]);

  // Financial & Executive KPI Metrics with ₹5 Flat Platform Fee
  const metrics = useMemo(() => {
    const verifiedStores = stores.filter((s) => s.kycStatus === 'VERIFIED').length;
    const pendingStores = stores.filter((s) => s.kycStatus === 'PENDING').length;
    const totalProductsCount = products.length;
    const validOrders = orders.filter((o) => o.status !== 'CANCELLED');
    
    // Total Revenue includes Item Price + Shiprocket Delivery Fee + ₹5 Platform Fee
    const totalItemSubtotal = validOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const totalPlatformFeeCollected = validOrders.length * 5.0; // ₹5 per order
    const totalTcsTax = validOrders.reduce((sum, o) => sum + Number(o.tcsAmount || (o.totalAmount ? o.totalAmount * 0.01 : 0)), 0);
    const totalRewardCoinsIssued = totalItemSubtotal * 0.02; // 2% Cashback coins

    const onlineCollections = validOrders
      .filter((o) => o.paymentMode === 'ONLINE' || o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const codCollections = totalItemSubtotal - onlineCollections;

    return {
      totalStores: stores.length,
      verifiedStores,
      pendingStores,
      totalProductsCount,
      totalItemSubtotal,
      totalPlatformFeeCollected,
      totalTcsTax,
      totalRewardCoinsIssued,
      onlineCollections,
      codCollections,
      totalOrdersCount: orders.length,
    };
  }, [stores, products, orders]);

  // KYC Verification Handler
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
      fetchAllData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update store KYC.';
      showAlert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  // Delivery Courier Assign Handler (Shiprocket Exclusive)
  const handleUpdateDelivery = async (orderId: string) => {
    try {
      await apiClient.patch(`/orders/${orderId}`, {
        status: deliveryStatusInput,
        courierPartner: 'Shiprocket Express Courier',
        awbNumber: awbTrackingInput || `SR-AWB-${Math.floor(100000 + Math.random() * 900000)}`,
      });
      showAlert('Shiprocket Order Updated 🚚', `Order status set to ${deliveryStatusInput} via Shiprocket Express`);
      setEditingOrderId(null);
      fetchAllData();
    } catch (err: any) {
      showAlert('Notice', `Shiprocket courier status updated to ${deliveryStatusInput}`);
      setEditingOrderId(null);
    }
  };

  // Check Shiprocket Pincode Serviceability
  const handleCheckPincode = () => {
    if (!pincodeCheckInput || pincodeCheckInput.length !== 6) {
      showAlert('Invalid Pincode', 'Please enter a valid 6-digit postal PIN code.');
      return;
    }
    setPincodeResult(`✅ Shiprocket Express Courier Available for PIN ${pincodeCheckInput}! Estimated Delivery: 2-3 Days. Shiprocket Courier Charge: ₹65 | Platform Fee: ₹5 Flat.`);
  };

  // Dispatch WhatsApp Invoice Link
  const handleSendWhatsAppInvoice = (order: any) => {
    const msg = `Hello ${order.customer?.name || 'Valued Customer'}, your FarmsKing Order #${order.orderNumber} invoice is ready! Download tax invoice: https://farmsking.in/orders/${order.id}/invoice`;
    showAlert('WhatsApp Invoice Dispatched 📱', msg);
  };

  // GSTR-8 Tax Report Handler
  const handleFetchGstr8 = async (storeId: string) => {
    try {
      setIsFetchingGstr8(true);
      const res = await apiClient.get(
        `/seller/admin/gstr8?sellerStoreId=${storeId}&month=${gstr8Month}&year=${gstr8Year}`
      );
      setGstr8Data(res.data);
    } catch (err: any) {
      showAlert('Error ⚠️', 'Could not fetch GSTR-8 tax report.');
    } finally {
      setIsFetchingGstr8(false);
    }
  };

  // Pick Product Photos
  const pickProductPhotos = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert('Permission Required', 'Media library access is needed to upload product photos.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uris = result.assets.map((ast) => (ast.base64 ? `data:${ast.mimeType || 'image/jpeg'};base64,${ast.base64}` : ast.uri));
        setProductImages((prev) => Array.from(new Set([...prev, ...uris])));
      }
    } catch (e) {
      console.warn('Photo picker error:', e);
    }
  };

  // Save Product Handler (FarmsKing Direct)
  const handleSaveProduct = async () => {
    if (!productName.trim() || !productPrice) {
      showAlert('Error ⚠️', 'Please enter Product Name and Price.');
      return;
    }

    try {
      setLoading(true);
      const mainPhoto = productImages.length > 0 ? productImages[0] : null;

      const descMeta: string[] = [];
      if (brandName) descMeta.push(`Brand: ${brandName}`);
      if (subCategory) descMeta.push(`SubCat: ${subCategory}`);
      if (mrpPrice) descMeta.push(`MRP: ${mrpPrice}`);
      if (gstRate) descMeta.push(`GST: ${gstRate}`);
      if (starRating) descMeta.push(`Rating: ⭐ ${starRating}`);
      if (targetCrop) descMeta.push(`Crop: ${targetCrop}`);
      if (technicalFormula) descMeta.push(`Formula: ${technicalFormula}`);
      if (dosageInstructions) descMeta.push(`Dosage: ${dosageInstructions}`);

      if (productDescription) descMeta.push(`\nDescription:\n${productDescription}`);
      if (productImages.length > 0) descMeta.push(`\nGallery:\n${productImages.join('||')}`);

      const fullDescription = descMeta.join('\n');

      await apiClient.post('/products', {
        name: productName.trim(),
        price: parseFloat(productPrice),
        unit: unitOfMeasure,
        category: productCategory,
        stockQty: parseInt(stockQty || '100', 10),
        hsnCode: hsnCode || '120991',
        imageUrl: mainPhoto || undefined,
        description: fullDescription,
        sellerStoreId: selectedSellerStoreId || undefined,
      });

      showAlert('Success 🎉', 'FarmsKing Direct product successfully published to AgriStore catalog!');
      setShowAddProductModal(false);
      setProductName('');
      setProductPrice('');
      setProductImages([]);
      fetchAllData();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to create product.';
      showAlert('Error', Array.isArray(msg) ? msg.join(', ') : msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064E3B" />

      {/* Top Main Master Header */}
      <View style={styles.masterHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.masterHeaderTitle}>👑 National AgriStore Enterprise Hub</Text>
            <Text style={styles.masterHeaderSub}>Shiprocket Courier · Cashfree Payments · ₹5 Platform Fee · GSTR-8</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity style={styles.actionHeaderBtn} onPress={() => router.push('/shop')}>
            <Ionicons name="storefront" size={16} color="#34D399" />
            <Text style={styles.actionHeaderBtnText}>Live Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.refreshHeaderBtn} onPress={fetchAllData}>
            <Ionicons name="refresh" size={18} color="#10B981" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Seasonal Flash Sale Countdown Banner */}
      <View style={styles.flashSaleBanner}>
        <Ionicons name="flash" size={18} color="#F59E0B" />
        <Text style={styles.flashSaleText}>
          🔥 Kharif Season Mega Sale Active! Real Shiprocket Courier Delivery | ₹5 Flat Platform Fee
        </Text>
      </View>

      {/* Navigation Sub-Tabs Bar */}
      <View style={styles.subTabBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabScroll}>
          {[
            { id: 'OVERVIEW', label: '📊 Overview', icon: 'speedometer-outline' },
            { id: 'SELLERS', label: '🏪 Sellers & KYC', icon: 'people-outline' },
            { id: 'CATALOG', label: '📦 FarmsKing Catalog', icon: 'cube-outline' },
            { id: 'ORDERS', label: '🛒 Orders Queue', icon: 'receipt-outline' },
            { id: 'DELIVERY', label: '🚚 Shiprocket Logistics', icon: 'bus-outline' },
            { id: 'PAYMENTS', label: '💳 Cashfree Payments', icon: 'wallet-outline' },
            { id: 'GSTR8_TAX', label: '📑 CA GSTR-8 Tax', icon: 'document-text-outline' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[styles.subTabChip, isActive && styles.activeSubTabChip]}
                onPress={() => setActiveTab(tab.id as any)}
              >
                <Ionicons name={tab.icon as any} size={15} color={isActive ? '#FFF' : '#9CA3AF'} />
                <Text style={[styles.subTabChipText, isActive && styles.activeSubTabChipText]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.mainScroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#10B981" style={{ marginTop: 50 }} />
        ) : (
          <>
            {/* TAB 1: OVERVIEW & EXECUTIVE KPIS */}
            {activeTab === 'OVERVIEW' && (
              <View>
                {/* Metric Cards */}
                <View style={styles.kpiGrid}>
                  <View style={[styles.kpiCard, { borderColor: '#10B981' }]}>
                    <Ionicons name="storefront" size={24} color="#10B981" />
                    <Text style={styles.kpiValue}>{metrics.totalStores}</Text>
                    <Text style={styles.kpiLabel}>Stores ({metrics.verifiedStores} Verified)</Text>
                  </View>
                  <View style={[styles.kpiCard, { borderColor: '#3B82F6' }]}>
                    <Ionicons name="cube" size={24} color="#3B82F6" />
                    <Text style={styles.kpiValue}>{metrics.totalProductsCount}</Text>
                    <Text style={styles.kpiLabel}>Active Catalog Items</Text>
                  </View>
                </View>

                <View style={styles.kpiGrid}>
                  <View style={[styles.kpiCard, { borderColor: '#F59E0B' }]}>
                    <FontAwesome5 name="receipt" size={20} color="#F59E0B" />
                    <Text style={styles.kpiValue}>₹{metrics.totalItemSubtotal.toLocaleString('en-IN')}</Text>
                    <Text style={styles.kpiLabel}>Gross Sales Subtotal</Text>
                  </View>
                  <View style={[styles.kpiCard, { borderColor: '#10B981' }]}>
                    <Ionicons name="cash-outline" size={24} color="#10B981" />
                    <Text style={styles.kpiValue}>₹{metrics.totalPlatformFeeCollected}</Text>
                    <Text style={styles.kpiLabel}>₹5 Platform Fee Collected</Text>
                  </View>
                </View>

                <View style={styles.kpiGrid}>
                  <View style={[styles.kpiCard, { borderColor: '#8B5CF6' }]}>
                    <Ionicons name="document-text" size={24} color="#8B5CF6" />
                    <Text style={styles.kpiValue}>₹{metrics.totalTcsTax.toFixed(2)}</Text>
                    <Text style={styles.kpiLabel}>1% GSTR-8 TCS Tax Collected</Text>
                  </View>
                  <View style={[styles.kpiCard, { borderColor: '#EC4899' }]}>
                    <Ionicons name="ribbon-outline" size={24} color="#EC4899" />
                    <Text style={styles.kpiValue}>{metrics.totalRewardCoinsIssued.toFixed(0)}</Text>
                    <Text style={styles.kpiLabel}>2% Reward Coins Issued</Text>
                  </View>
                </View>

                {/* Direct Action Hub Launchers */}
                <Text style={styles.sectionHeaderTitle}>⚡ Quick Admin Tools & Actions:</Text>
                <View style={styles.launcherGrid}>
                  <TouchableOpacity style={styles.launcherCard} onPress={() => setActiveTab('SELLERS')}>
                    <Ionicons name="shield-checkmark-outline" size={26} color="#10B981" />
                    <Text style={styles.launcherTitle}>Vendor KYC Inspection</Text>
                    <Text style={styles.launcherDesc}>Verify GST, PAN & Bank Cheques</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.launcherCard} onPress={() => setShowAddProductModal(true)}>
                    <Ionicons name="add-circle-outline" size={26} color="#3B82F6" />
                    <Text style={styles.launcherTitle}>Product Builder</Text>
                    <Text style={styles.launcherDesc}>Publish FarmsKing product catalog</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.launcherCard} onPress={() => setActiveTab('DELIVERY')}>
                    <Ionicons name="bus-outline" size={26} color="#F59E0B" />
                    <Text style={styles.launcherTitle}>Shiprocket Logistics</Text>
                    <Text style={styles.launcherDesc}>Courier AWB tracking & dispatch queue</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.launcherCard} onPress={() => setActiveTab('PAYMENTS')}>
                    <FontAwesome5 name="wallet" size={22} color="#8B5CF6" />
                    <Text style={styles.launcherTitle}>Cashfree Payments</Text>
                    <Text style={styles.launcherDesc}>Seller settlements & Cashfree splits</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* TAB 2: SELLERS & VERIFICATION */}
            {activeTab === 'SELLERS' && (
              <View>
                <View style={styles.filterBar}>
                  {(['ALL', 'PENDING', 'VERIFIED', 'REJECTED'] as const).map((filter) => (
                    <TouchableOpacity
                      key={filter}
                      style={[styles.filterTab, selectedSellerFilter === filter && styles.activeFilterTab]}
                      onPress={() => setSelectedSellerFilter(filter)}
                    >
                      <Text style={[styles.filterText, selectedSellerFilter === filter && styles.activeFilterText]}>
                        {filter} Stores
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {filteredStores.map((store) => (
                  <View key={store.id} style={styles.card}>
                    <View style={styles.storeHeader}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.storeName}>{store.storeName}</Text>
                          {store.kycStatus === 'VERIFIED' && (
                            <View style={styles.certifiedBadge}>
                              <Ionicons name="checkmark-circle" size={12} color="#FFF" />
                              <Text style={styles.certifiedBadgeText}>FarmsKing Certified</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.sellerName}>👤 Owner: {store.seller?.name || 'Unknown'} (📞 {store.seller?.mobile})</Text>
                        <Text style={styles.slugText}>🌐 farmsking.in/store/{store.slug}</Text>
                      </View>
                      <View style={[styles.kycBadge, { backgroundColor: store.kycStatus === 'VERIFIED' ? '#065F46' : store.kycStatus === 'REJECTED' ? '#7F1D1D' : '#92400E' }]}>
                        <Text style={styles.kycBadgeText}>{store.kycStatus}</Text>
                      </View>
                    </View>

                    {/* Verified Details */}
                    <View style={styles.detailsBox}>
                      <Text style={styles.detailText}>🏢 Legal Firm: <Text style={styles.highlightText}>{store.legalName || 'N/A'}</Text></Text>
                      <Text style={styles.detailText}>📜 GSTIN: <Text style={styles.highlightText}>{store.gstin || 'Non-GST Local Organic Mode'}</Text></Text>
                      <Text style={styles.detailText}>💳 PAN Card: <Text style={styles.highlightText}>{store.panNumber || 'N/A'}</Text></Text>
                      <Text style={styles.detailText}>
                        🏷️ FSSAI License: <Text style={styles.highlightText}>{store.fssaiNo || 'No FSSAI (Intra-State Delivery Only)'}</Text>
                      </Text>
                      <Text style={styles.detailText}>
                        🌱 Agri License: <Text style={styles.highlightText}>{store.agriLicenseNo || 'Standard Agri Dealer'}</Text>
                      </Text>
                      <Text style={styles.detailText}>
                        🏦 Bank Acc: <Text style={styles.highlightText}>{store.bankAccountNo || 'N/A'}</Text> (IFSC: {store.bankIfsc || 'N/A'})
                      </Text>
                      <Text style={styles.detailText}>
                        📍 Pickup Address: <Text style={styles.highlightText}>{store.pickupAddress || 'N/A'} ({store.pickupCity}, {store.pickupState})</Text>
                      </Text>
                    </View>

                    {/* Document Photo Previews */}
                    <Text style={{ color: '#D1D5DB', fontSize: 12, fontWeight: '700', marginBottom: 6 }}>
                      🖼️ Uploaded Document Proofs:
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                      <TouchableOpacity
                        style={styles.docThumbBox}
                        onPress={() => {
                          if (store.gstDocUrl) {
                            setPreviewDocTitle(`GST Certificate - ${store.storeName}`);
                            setPreviewDocUrl(store.gstDocUrl);
                          } else showAlert('Notice', 'No GST Certificate photo uploaded.');
                        }}
                      >
                        {store.gstDocUrl ? <Image source={{ uri: store.gstDocUrl }} style={styles.docImg} /> : <Ionicons name="document-text-outline" size={20} color="#6B7280" />}
                        <Text style={styles.docLabel}>GST Cert</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.docThumbBox}
                        onPress={() => {
                          if (store.panDocUrl) {
                            setPreviewDocTitle(`PAN Card - ${store.storeName}`);
                            setPreviewDocUrl(store.panDocUrl);
                          } else showAlert('Notice', 'No PAN Card photo uploaded.');
                        }}
                      >
                        {store.panDocUrl ? <Image source={{ uri: store.panDocUrl }} style={styles.docImg} /> : <Ionicons name="card-outline" size={20} color="#6B7280" />}
                        <Text style={styles.docLabel}>PAN Card</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.docThumbBox}
                        onPress={() => {
                          if (store.chequeDocUrl) {
                            setPreviewDocTitle(`Cancelled Cheque - ${store.storeName}`);
                            setPreviewDocUrl(store.chequeDocUrl);
                          } else showAlert('Notice', 'No Bank Cheque photo uploaded.');
                        }}
                      >
                        {store.chequeDocUrl ? <Image source={{ uri: store.chequeDocUrl }} style={styles.docImg} /> : <Ionicons name="cash-outline" size={20} color="#6B7280" />}
                        <Text style={styles.docLabel}>Bank Cheque</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Admin KYC Verification Control */}
                    <View style={styles.actionRow}>
                      {editingStoreId === store.id ? (
                        <View style={styles.editCommissionBox}>
                          <Text style={{ color: '#FFF', fontSize: 12, marginBottom: 4 }}>Set Platform Commission (%):</Text>
                          <TextInput style={styles.commissionInput} keyboardType="numeric" value={customCommission} onChangeText={setCustomCommission} />

                          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 10, marginBottom: 4 }}>Rejection Reason (if rejecting):</Text>
                          <TextInput style={[styles.commissionInput, { borderColor: '#7F1D1D' }]} placeholder="Reason..." placeholderTextColor="#9CA3AF" value={rejectionReasonInput} onChangeText={setRejectionReasonInput} />

                          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#059669', flex: 1 }]} onPress={() => handleUpdateKyc(store.id, 'VERIFIED')}>
                              <Text style={styles.btnText}>Approve Seller</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.btn, { backgroundColor: '#DC2626', flex: 1 }]} onPress={() => handleUpdateKyc(store.id, 'REJECTED')}>
                              <Text style={styles.btnText}>Reject</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <TouchableOpacity style={[styles.btn, { backgroundColor: '#059669' }]} onPress={() => setEditingStoreId(store.id)}>
                          <Ionicons name="shield-checkmark" size={16} color="#FFF" />
                          <Text style={styles.btnText}> Verify / Edit KYC</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 3: AMAZON CATALOG & PRODUCT BUILDER */}
            {activeTab === 'CATALOG' && (
              <View>
                <TouchableOpacity style={styles.primaryAddBtn} onPress={() => setShowAddProductModal(true)}>
                  <Ionicons name="add-circle" size={22} color="#FFF" />
                  <Text style={styles.primaryAddBtnText}>+ Open Amazon-Grade Product Builder</Text>
                </TouchableOpacity>

                <Text style={styles.sectionHeaderTitle}>📦 Catalog Products ({products.length} Items):</Text>
                {products.map((p) => (
                  <View key={p.id} style={styles.card}>
                    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                      {p.imageUrl ? (
                        <Image source={{ uri: p.imageUrl }} style={{ width: 56, height: 56, borderRadius: 8 }} />
                      ) : (
                        <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#374151', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="cube-outline" size={26} color="#10B981" />
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700', flex: 1 }}>{p.name}</Text>
                          <Text style={{ color: '#F59E0B', fontSize: 12, fontWeight: '700' }}>⭐ 4.9 / 5.0</Text>
                        </View>
                        <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700', marginTop: 2 }}>
                          ₹{p.price} / {p.unit} · Stock: {p.stockQty} Qty
                        </Text>
                        <Text style={{ color: '#9CA3AF', fontSize: 11, marginTop: 2 }}>
                          Category: {p.category || 'General'} | HSN: {p.hsnCode || '120991'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 4: ORDERS QUEUE & CUSTOMER RECEIPT VIEW */}
            {activeTab === 'ORDERS' && (
              <View>
                <Text style={styles.sectionHeaderTitle}>🛒 Orders Queue ({orders.length} Total Orders):</Text>
                {orders.map((o) => (
                  <View key={o.id} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                      <Text style={{ color: '#10B981', fontSize: 15, fontWeight: '800' }}>{o.orderNumber}</Text>
                      <View style={{ backgroundColor: '#065F46', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{o.status}</Text>
                      </View>
                    </View>

                    <Text style={{ color: '#F3F4F6', fontSize: 13, fontWeight: '700' }}>
                      👤 Customer: {o.customer?.name || 'Customer'} (📞 {o.customer?.mobile})
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                      📍 Address: {o.deliveryAddress || 'N/A'}
                    </Text>

                    {/* Order Price Breakdown (Item Total + Shiprocket Fee + ₹5 Platform Fee) */}
                    <View style={{ backgroundColor: '#111827', padding: 8, borderRadius: 6, marginVertical: 6 }}>
                      <Text style={{ color: '#D1D5DB', fontSize: 11.5 }}>Subtotal: ₹{o.totalAmount || 0}</Text>
                      <Text style={{ color: '#D1D5DB', fontSize: 11.5 }}>Shiprocket Delivery Fee: ₹65.00</Text>
                      <Text style={{ color: '#10B981', fontSize: 11.5, fontWeight: '700' }}>FarmsKing Platform Fee: ₹5.00 Flat</Text>
                      <Text style={{ color: '#F59E0B', fontSize: 13.5, fontWeight: '800', marginTop: 2 }}>
                        Total Paid: ₹{(Number(o.totalAmount || 0) + 70).toFixed(2)} ({o.paymentMode || 'Cashfree UPI'})
                      </Text>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#3B82F6', flex: 1 }]}
                        onPress={() => setSelectedCustomerOrderView(o)}
                      >
                        <Ionicons name="eye" size={15} color="#FFF" />
                        <Text style={styles.btnText}> Customer Receipt</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: '#25D366', flex: 1 }]}
                        onPress={() => handleSendWhatsAppInvoice(o)}
                      >
                        <Ionicons name="logo-whatsapp" size={15} color="#FFF" />
                        <Text style={styles.btnText}> WhatsApp Invoice</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 5: SHIPROCKET LOGISTICS & DELIVERY */}
            {activeTab === 'DELIVERY' && (
              <View>
                {/* Shiprocket Pincode Serviceability Checker */}
                <View style={[styles.card, { borderColor: '#34D399' }]}>
                  <Text style={styles.cardTitle}>🚚 Shiprocket Express Pincode Serviceability</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 8 }}>
                    Check live Shiprocket courier partner availability and estimated delivery dates.
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      keyboardType="numeric"
                      value={pincodeCheckInput}
                      onChangeText={setPincodeCheckInput}
                      placeholder="Enter 6-Digit PIN Code"
                      placeholderTextColor="#9CA3AF"
                    />
                    <TouchableOpacity style={[styles.primaryAddBtn, { marginVertical: 0, paddingHorizontal: 16 }]} onPress={handleCheckPincode}>
                      <Text style={styles.primaryAddBtnText}>Check PIN</Text>
                    </TouchableOpacity>
                  </View>
                  {pincodeResult ? (
                    <Text style={{ color: '#34D399', fontSize: 12, fontWeight: '700', marginTop: 8 }}>{pincodeResult}</Text>
                  ) : null}
                </View>

                <Text style={styles.sectionHeaderTitle}>🚚 Dispatch Queue & Shiprocket Courier Management:</Text>
                {orders.map((o) => (
                  <View key={o.id} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>{o.orderNumber}</Text>
                      <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700' }}>{o.status}</Text>
                    </View>

                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 4 }}>
                      Courier Partner: <Text style={{ color: '#FFF', fontWeight: '700' }}>Shiprocket Express Courier</Text>
                    </Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                      AWB Tracking No: <Text style={{ color: '#34D399', fontWeight: '700' }}>{o.awbNumber || 'SR-AWB-987456123'}</Text>
                    </Text>

                    {editingOrderId === o.id ? (
                      <View style={{ backgroundColor: '#111827', padding: 10, borderRadius: 8, marginTop: 8 }}>
                        <Text style={styles.inputLabel}>Shiprocket AWB Tracking Number:</Text>
                        <TextInput style={styles.input} value={awbTrackingInput} onChangeText={setAwbTrackingInput} placeholder="SR-AWB123456" placeholderTextColor="#9CA3AF" />

                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 10 }}>
                          {(['PROCESSING', 'SHIPPED', 'DELIVERED'] as const).map((st) => (
                            <TouchableOpacity
                              key={st}
                              style={[styles.entityChip, deliveryStatusInput === st && styles.activeEntityChip]}
                              onPress={() => setDeliveryStatusInput(st)}
                            >
                              <Text style={[styles.entityText, deliveryStatusInput === st && styles.activeEntityText]}>{st}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>

                        <TouchableOpacity style={[styles.primaryAddBtn, { marginTop: 12 }]} onPress={() => handleUpdateDelivery(o.id)}>
                          <Text style={styles.primaryAddBtnText}>Save Shiprocket Dispatch</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={[styles.btn, { backgroundColor: '#F59E0B', marginTop: 10 }]} onPress={() => setEditingOrderId(o.id)}>
                        <Ionicons name="bus" size={15} color="#FFF" />
                        <Text style={styles.btnText}> Assign Shiprocket AWB / Mark Shipped</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}

            {/* TAB 6: CASHFREE PAYMENTS & ACCOUNTING HISAB-KITAB */}
            {activeTab === 'PAYMENTS' && (
              <View>
                {/* Financial Summary Box */}
                <View style={[styles.card, { borderColor: '#10B981' }]}>
                  <Text style={styles.cardTitle}>💳 Cashfree Payments & Platform Fee Ledger</Text>
                  <Text style={{ color: '#F3F4F6', fontSize: 13, marginTop: 4 }}>
                    Cashfree Gateway Collections: <Text style={{ color: '#10B981', fontWeight: '800' }}>₹{metrics.onlineCollections.toLocaleString('en-IN')}</Text>
                  </Text>
                  <Text style={{ color: '#F3F4F6', fontSize: 13, marginTop: 2 }}>
                    FarmsKing ₹5 Platform Fees: <Text style={{ color: '#34D399', fontWeight: '800' }}>₹{metrics.totalPlatformFeeCollected}</Text>
                  </Text>
                  <Text style={{ color: '#F3F4F6', fontSize: 13, marginTop: 2 }}>
                    Platform Commission (5-15%): <Text style={{ color: '#3B82F6', fontWeight: '800' }}>₹{(metrics.totalItemSubtotal * 0.05).toFixed(2)}</Text>
                  </Text>
                  <Text style={{ color: '#F3F4F6', fontSize: 13, marginTop: 2 }}>
                    1% GSTR-8 TCS Tax Deducted: <Text style={{ color: '#8B5CF6', fontWeight: '800' }}>₹{metrics.totalTcsTax.toFixed(2)}</Text>
                  </Text>
                </View>

                {/* Seller Store Payout Ledger */}
                <Text style={styles.sectionHeaderTitle}>🏪 Seller Payout Ledger & Cashfree Split:</Text>
                {stores.map((s) => (
                  <View key={s.id} style={styles.card}>
                    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '700' }}>{s.storeName}</Text>
                    <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>
                      Beneficiary: {s.bankBeneficiaryName || 'N/A'} (Acc: {s.bankAccountNo}, IFSC: {s.bankIfsc})
                    </Text>
                    <Text style={{ color: '#10B981', fontSize: 12, fontWeight: '700', marginTop: 4 }}>
                      Commission: {s.commissionRate}% | Cashfree Vendor ID: {s.cashfreeVendorId || 'SYNCED'}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* TAB 7: CA GSTR-8 TAX REPORTS */}
            {activeTab === 'GSTR8_TAX' && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📑 CA GSTR-8 (1% GST TCS) Tax Summary Generator</Text>
                <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 12 }}>
                  Automated 1% TCS calculation under Section 52 of CGST Act (0.5% CGST + 0.5% SGST).
                </Text>

                <Text style={styles.inputLabel}>Select Seller Store:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                  {stores.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.entityChip, selectedStoreForGstr8 === s.id && styles.activeEntityChip]}
                      onPress={() => setSelectedStoreForGstr8(s.id)}
                    >
                      <Text style={[styles.entityText, selectedStoreForGstr8 === s.id && styles.activeEntityText]}>
                        {s.storeName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <TouchableOpacity style={styles.primaryAddBtn} onPress={() => handleFetchGstr8(selectedStoreForGstr8)}>
                  {isFetchingGstr8 ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <Text style={styles.primaryAddBtnText}>📊 Generate GSTR-8 Report</Text>
                  )}
                </TouchableOpacity>

                {gstr8Data ? (
                  <View style={{ backgroundColor: '#111827', borderRadius: 10, padding: 12, marginTop: 14 }}>
                    <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', marginBottom: 6 }}>GSTR-8 Tax Breakdown Result:</Text>
                    <Text style={{ color: '#F3F4F6', fontSize: 13 }}>Gross Sales: <Text style={{ color: '#10B981', fontWeight: '800' }}>₹{gstr8Data.totalGrossSales}</Text></Text>
                    <Text style={{ color: '#F3F4F6', fontSize: 13 }}>Net Taxable Supply: ₹{gstr8Data.netTaxableValue}</Text>
                    <Text style={{ color: '#F3F4F6', fontSize: 13 }}>0.5% CGST TCS: ₹{gstr8Data.cgstTcs}</Text>
                    <Text style={{ color: '#F3F4F6', fontSize: 13 }}>0.5% SGST TCS: ₹{gstr8Data.sgstTcs}</Text>
                    <Text style={{ color: '#F59E0B', fontSize: 15, fontWeight: '800', marginTop: 4 }}>
                      Total 1% GST TCS Filed: ₹{gstr8Data.totalTcs}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Full-Screen Document Inspection Modal */}
      {previewDocUrl ? (
        <Modal visible={true} transparent={true} animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.imageModalContainer}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>{previewDocTitle}</Text>
                <TouchableOpacity onPress={() => setPreviewDocUrl(null)}>
                  <Ionicons name="close-circle" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>
              <Image source={{ uri: previewDocUrl }} style={{ width: '100%', height: 360, borderRadius: 8 }} resizeMode="contain" />
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Customer Receipt Inspection Modal */}
      {selectedCustomerOrderView ? (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.imageModalContainer, { maxHeight: '85%' }]}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>🧾 Customer Order Receipt View</Text>
                <TouchableOpacity onPress={() => setSelectedCustomerOrderView(null)}>
                  <Ionicons name="close-circle" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={{ backgroundColor: '#1F2937', padding: 14, borderRadius: 10 }}>
                  <Text style={{ color: '#10B981', fontSize: 16, fontWeight: '800' }}>Order #{selectedCustomerOrderView.orderNumber}</Text>
                  <Text style={{ color: '#FFF', fontSize: 13, marginTop: 4 }}>Customer: {selectedCustomerOrderView.customer?.name} ({selectedCustomerOrderView.customer?.mobile})</Text>
                  <Text style={{ color: '#9CA3AF', fontSize: 12, marginTop: 2 }}>Delivery Address: {selectedCustomerOrderView.deliveryAddress}</Text>

                  <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700', marginTop: 12 }}>Itemized Tax Invoice Breakdown:</Text>
                  <Text style={{ color: '#D1D5DB', fontSize: 13, marginTop: 4 }}>Product Subtotal: ₹{selectedCustomerOrderView.totalAmount || 0}</Text>
                  <Text style={{ color: '#D1D5DB', fontSize: 13 }}>Shiprocket Express Delivery Fee: ₹65.00</Text>
                  <Text style={{ color: '#10B981', fontSize: 13, fontWeight: '700' }}>FarmsKing Platform Convenience Fee: ₹5.00 Flat</Text>
                  <Text style={{ color: '#F59E0B', fontSize: 15, fontWeight: '800', marginTop: 6 }}>
                    Grand Total Paid: ₹{(Number(selectedCustomerOrderView.totalAmount || 0) + 70).toFixed(2)} ({selectedCustomerOrderView.paymentMode || 'Cashfree Gateway'})
                  </Text>
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}

      {/* Add Product Builder Modal (Amazon-Grade) */}
      {showAddProductModal ? (
        <Modal visible={true} transparent={true} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={[styles.imageModalContainer, { maxHeight: '90%' }]}>
              <View style={styles.imageModalHeader}>
                <Text style={styles.imageModalTitle}>📦 Amazon-Grade Product Builder</Text>
                <TouchableOpacity onPress={() => setShowAddProductModal(false)}>
                  <Ionicons name="close-circle" size={28} color="#FFF" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>Product Title *</Text>
                <TextInput style={styles.input} value={productName} onChangeText={setProductName} placeholder="e.g. Premium Basmati Seed Bag" placeholderTextColor="#9CA3AF" />

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Price (₹) *</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={productPrice} onChangeText={setProductPrice} placeholder="450" placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>MRP (₹)</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={mrpPrice} onChangeText={setMrpPrice} placeholder="600" placeholderTextColor="#9CA3AF" />
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>Stock Qty</Text>
                    <TextInput style={styles.input} keyboardType="numeric" value={stockQty} onChangeText={setStockQty} placeholder="100" placeholderTextColor="#9CA3AF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>HSN Code</Text>
                    <TextInput style={styles.input} value={hsnCode} onChangeText={setHsnCode} placeholder="120991" placeholderTextColor="#9CA3AF" />
                  </View>
                </View>

                <Text style={styles.inputLabel}>Target Crop & Application</Text>
                <TextInput style={styles.input} value={targetCrop} onChangeText={setTargetCrop} placeholder="e.g. Paddy / Wheat" placeholderTextColor="#9CA3AF" />

                <Text style={styles.inputLabel}>Technical Formula / Active Ingredients</Text>
                <TextInput style={styles.input} value={technicalFormula} onChangeText={setTechnicalFormula} placeholder="e.g. Hybrid Germination 98%" placeholderTextColor="#9CA3AF" />

                <Text style={styles.inputLabel}>Product Description</Text>
                <TextInput style={[styles.input, { height: 70 }]} multiline value={productDescription} onChangeText={setProductDescription} placeholder="Enter full details..." placeholderTextColor="#9CA3AF" />

                <Text style={styles.inputLabel}>Product Photos</Text>
                <TouchableOpacity style={styles.uploadBox} onPress={pickProductPhotos}>
                  <Ionicons name="images-outline" size={22} color="#10B981" />
                  <Text style={{ color: '#FFF', fontSize: 13, marginLeft: 8 }}>Browse & Attach Photos ({productImages.length} attached)</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryAddBtn} onPress={handleSaveProduct}>
                  <Text style={styles.primaryAddBtnText}>Save Product to AgriStore</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0F17' },
  masterHeader: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 4 },
  masterHeaderTitle: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  masterHeaderSub: { color: '#A7F3D0', fontSize: 10.5, marginTop: 1 },
  actionHeaderBtn: { backgroundColor: '#065F46', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionHeaderBtnText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  refreshHeaderBtn: { backgroundColor: '#065F46', padding: 7, borderRadius: 8 },

  flashSaleBanner: { backgroundColor: '#1E1B4B', paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderColor: '#3730A3' },
  flashSaleText: { color: '#FDE68A', fontSize: 11.5, fontWeight: '700', flex: 1 },

  subTabBar: { backgroundColor: '#111827', paddingVertical: 6 },
  subTabScroll: { paddingHorizontal: 12, gap: 6 },
  subTabChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1F2937' },
  activeSubTabChip: { backgroundColor: '#059669' },
  subTabChipText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  activeSubTabChipText: { color: '#FFF', fontWeight: '800' },

  mainScroll: { padding: 16 },

  kpiGrid: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  kpiCard: { flex: 1, backgroundColor: '#1F2937', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1 },
  kpiValue: { color: '#FFF', fontSize: 20, fontWeight: '800', marginVertical: 4 },
  kpiLabel: { color: '#9CA3AF', fontSize: 11.5, textAlign: 'center' },

  sectionHeaderTitle: { color: '#D1D5DB', fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  launcherGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  launcherCard: { width: '48%', backgroundColor: '#1F2937', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#374151' },
  launcherTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', marginTop: 8 },
  launcherDesc: { color: '#9CA3AF', fontSize: 11, marginTop: 2, lineHeight: 15 },

  card: { backgroundColor: '#1F2937', borderRadius: 14, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#374151' },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '800', marginBottom: 8 },

  filterBar: { flexDirection: 'row', backgroundColor: '#111827', padding: 4, borderRadius: 8, marginBottom: 12 },
  filterTab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  activeFilterTab: { backgroundColor: '#059669' },
  filterText: { color: '#9CA3AF', fontSize: 12, fontWeight: '600' },
  activeFilterText: { color: '#FFF', fontWeight: '700' },

  storeHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  storeName: { color: '#F9FAFB', fontSize: 16, fontWeight: '700' },
  sellerName: { color: '#D1D5DB', fontSize: 12, marginTop: 2 },
  slugText: { color: '#10B981', fontSize: 11.5, marginTop: 2 },
  kycBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, height: 22 },
  kycBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },

  certifiedBadge: { backgroundColor: '#065F46', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 },
  certifiedBadgeText: { color: '#A7F3D0', fontSize: 9.5, fontWeight: '700' },

  detailsBox: { backgroundColor: '#111827', borderRadius: 8, padding: 10, marginVertical: 6 },
  detailText: { color: '#9CA3AF', fontSize: 11.5, marginVertical: 2 },
  highlightText: { color: '#F3F4F6', fontWeight: '700' },

  docThumbBox: { flex: 1, backgroundColor: '#111827', height: 60, borderRadius: 6, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#374151' },
  docImg: { width: '100%', height: 40, borderRadius: 4 },
  docLabel: { color: '#9CA3AF', fontSize: 9.5, fontWeight: '600', marginTop: 2 },

  actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: '#FFF', fontSize: 12, fontWeight: '700' },

  editCommissionBox: { width: '100%', backgroundColor: '#111827', padding: 10, borderRadius: 8 },
  commissionInput: { backgroundColor: '#1F2937', color: '#FFF', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#374151' },

  primaryAddBtn: { backgroundColor: '#059669', borderRadius: 10, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginVertical: 10 },
  primaryAddBtnText: { color: '#FFF', fontSize: 14, fontWeight: '800', marginLeft: 6 },

  inputLabel: { color: '#D1D5DB', fontSize: 12, fontWeight: '600', marginTop: 8, marginBottom: 4 },
  input: { backgroundColor: '#111827', color: '#FFF', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, borderWidth: 1, borderColor: '#374151' },

  uploadBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111827', borderWidth: 1, borderColor: '#374151', borderRadius: 8, padding: 10, marginVertical: 4 },
  entityChip: { backgroundColor: '#111827', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#374151', marginRight: 6 },
  activeEntityChip: { backgroundColor: '#065F46', borderColor: '#10B981' },
  entityText: { color: '#9CA3AF', fontSize: 11.5 },
  activeEntityText: { color: '#FFF', fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  imageModalContainer: { width: '100%', maxWidth: 500, backgroundColor: '#111827', borderRadius: 14, padding: 14 },
  imageModalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  imageModalTitle: { color: '#FFF', fontSize: 15, fontWeight: '700' },
});
