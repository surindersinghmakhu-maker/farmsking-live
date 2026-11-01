import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Modal,
  Image,
  Pressable,
  Dimensions,
  useWindowDimensions,
  Switch,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/api/client';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { Product } from '@/src/types/api';
import {
  useProducts,
  useRemoveProduct,
  useUpdateProduct,
  useCreateProduct,
} from '@/src/hooks/useProducts';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { showAdminToast } from '@/components/AdminLiveToastNotification';

const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

const CATEGORY_OPTIONS = [
  'All',
  'Fertilizers',
  'Bio & Organics',
  'Seeds',
  'Pesticides',
  'Garden Tools',
  'Irrigation',
  'Animal & Cattle Feed',
  'Food Products',
  'Other',
];

const BRAND_OPTIONS = [
  'FarmsKing Certified',
  'IFFCO',
  'Bayer CropScience',
  'Syngenta',
  'UPL India',
  'Tata Rallis',
  'Dhanuka',
  'Direct Farmer Produced',
];

const COMMON_HSN_CODES = [
  { code: '310100', label: 'Bio / Organic Fertilizers' },
  { code: '120991', label: 'Crop Seeds' },
  { code: '380899', label: 'Agro Pesticides / Spray' },
  { code: '842482', label: 'Irrigation & Sprayers' },
];

const GST_RATES = ['0', '5', '12', '18'];

const ADD_PRODUCT_TABS = [
  { id: 'STORE_BASIC', label: '1. Store & Basics', icon: 'storefront-outline' },
  { id: 'PRICING_STOCK', label: '2. Pricing & Stock', icon: 'cash-outline' },
  { id: 'LOGISTICS', label: '3. Package & Size', icon: 'cube-outline' },
  { id: 'AGRI_SPECS', label: '4. Agri Technical', icon: 'leaf-outline' },
  { id: 'PHOTOS', label: '5. Photos & Labels', icon: 'images-outline' },
  { id: 'POLICIES', label: '6. Policies & Notes', icon: 'shield-checkmark-outline' },
] as const;

interface VerifiedSellerStore {
  id: string;
  storeName: string;
  slug?: string;
  sellerType?: string;
  gstin?: string | null;
  pickupCity?: string | null;
  pickupState?: string | null;
  kycStatus?: string;
  seller?: {
    id?: string;
    name?: string;
    mobile?: string;
    email?: string;
  };
}

const UNIT_OPTIONS = ['kg', 'litre', 'bag', 'packet', 'quintal', 'piece', 'box', 'bottle'];

export default function AdminProductsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { colors, isLight, isDarkTheme, textColor, subTextColor, cardBg, cardBorder } =
    useExecutiveTheme();
  const { data: products, isLoading: isLoadingProducts, refetch } = useProducts(true);
  const updateProduct = useUpdateProduct();
  const removeProduct = useRemoveProduct();
  const createProduct = useCreateProduct();

  // Screen State
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'DEACTIVATED'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  // Active Verified Sellers Query
  const { data: verifiedStores = [], isLoading: isLoadingStores, refetch: refetchStores } = useQuery<VerifiedSellerStore[]>({
    queryKey: ['admin-verified-stores'],
    queryFn: async () => {
      const res = await apiClient.get('/seller/admin/stores?kycStatus=VERIFIED');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  // Seller Selection State (Admin creates product on behalf of an active seller)
  const [selectedSellerStoreId, setSelectedSellerStoreId] = useState<string>('');
  const [sellerSearchQuery, setSellerSearchQuery] = useState('');
  const [showSellerPickerModal, setShowSellerPickerModal] = useState(false);

  // Seller Product Form State
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('FarmsKing Certified');
  const [newCategory, setNewCategory] = useState('Fertilizers');
  const [newUnit, setNewUnit] = useState('kg');
  const [newMrp, setNewMrp] = useState('600');
  const [newPrice, setNewPrice] = useState('450');
  const [newStock, setNewStock] = useState('50');
  const [newSku, setNewSku] = useState(`FK-${Math.floor(100000 + Math.random() * 900000)}`);
  const [newHsn, setNewHsn] = useState('310100');
  const [newGstRate, setNewGstRate] = useState('18');
  const [newDeadWeight, setNewDeadWeight] = useState('0.5');
  const [newLength, setNewLength] = useState('10');
  const [newWidth, setNewWidth] = useState('10');
  const [newHeight, setNewHeight] = useState('10');
  const [newTechnicalName, setNewTechnicalName] = useState('');
  const [newDosageInstructions, setNewDosageInstructions] = useState('');
  const [newSuitableCrops, setNewSuitableCrops] = useState('');
  const [newTargetPests, setNewTargetPests] = useState('');
  const [newBatchNumber, setNewBatchNumber] = useState('');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newImageFrontUrl, setNewImageFrontUrl] = useState('');
  const [newImageBackUrl, setNewImageBackUrl] = useState('');
  const [newImageDosageUrl, setNewImageDosageUrl] = useState('');
  const [newIsCodAllowed, setNewIsCodAllowed] = useState(true);
  const [newIsReturnable, setNewIsReturnable] = useState(true);
  const [newReturnWindowDays, setNewReturnWindowDays] = useState('7');
  const [newDescription, setNewDescription] = useState('');

  // Active Tab in Create Modal
  const [addModalTab, setAddModalTab] = useState<typeof ADD_PRODUCT_TABS[number]['id']>('STORE_BASIC');

  // Edit Product Form State
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Seller Store Helper (uses actual store if linked)
  const getProductSellerInfo = (p: Product, index: number) => {
    if (p.sellerStore?.storeName) {
      return {
        name: p.sellerStore.storeName,
        shop: p.sellerStore.pickupCity || p.sellerStore.pickupState || 'Verified Merchant',
        verified: p.sellerStore.kycStatus === 'VERIFIED',
      };
    }
    const sellers = [
      { name: 'Punjab Agri Traders', shop: 'Ludhiana Mandi', verified: true },
      { name: 'Malwa Seed Suppliers', shop: 'Bathinda Hub', verified: true },
      { name: 'Doaba Fertilizer Corp', shop: 'Jalandhar Bypass', verified: true },
      { name: 'FarmsKing Direct Store', shop: 'Corporate Depot', verified: true },
    ];
    return sellers[index % sellers.length];
  };

  // Filtered & Searched Products
  const filteredProducts = useMemo(() => {
    return (products || []).filter((p, index) => {
      const seller = getProductSellerInfo(p, index);
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.sellerStore?.storeName && p.sellerStore.storeName.toLowerCase().includes(q)) ||
        seller.name.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Category filter
      if (selectedCategory !== 'All') {
        const cat = (p.category || '').toLowerCase();
        if (!cat.includes(selectedCategory.toLowerCase())) return false;
      }

      // Status filter
      if (filter === 'ACTIVE') return p.isActive && p.stockQty > 0;
      if (filter === 'LOW_STOCK') return p.isActive && p.stockQty > 0 && p.stockQty <= 5;
      if (filter === 'OUT_OF_STOCK') return p.stockQty <= 0;
      if (filter === 'DEACTIVATED') return !p.isActive;

      return true;
    });
  }, [products, searchQuery, filter, selectedCategory]);

  // Metric counts
  const totalCount = products?.length || 0;
  const activeCount = products?.filter((p) => p.isActive && p.stockQty > 0).length || 0;
  const lowStockCount = products?.filter((p) => p.stockQty <= 5).length || 0;
  const deactivatedCount = products?.filter((p) => !p.isActive).length || 0;

  // Toggle Status Handler
  const handleToggleStatus = (p: Product) => {
    tap();
    const willBeActive = !p.isActive;
    updateProduct.mutate({
      id: p.id,
      payload: { isActive: willBeActive },
    }, {
      onSuccess: () => {
        showAdminToast(
          'INFO',
          'Product Status Updated',
          `${p.name} is now ${willBeActive ? 'Active' : 'Deactivated'}`
        );
      },
    });
  };

  // Open Edit Modal
  const openEditModal = (p: Product) => {
    tap();
    setEditingProduct(p);
    setEditPrice(String(p.price || ''));
    setEditStock(String(p.stockQty ?? 0));
    setEditIsActive(Boolean(p.isActive));
  };

  // Submit Edit
  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    const priceNum = parseFloat(editPrice) || Number(editingProduct.price) || 0;
    const stockNum = parseInt(editStock, 10) || 0;

    await updateProduct.mutateAsync({
      id: editingProduct.id,
      payload: {
        price: priceNum,
        stockQty: stockNum,
        isActive: editIsActive,
      },
    });

    showAdminToast(
      'SUCCESS',
      'Product Updated',
      `${editingProduct.name} saved successfully.`
    );
    setEditingProduct(null);
  };

  // Selected Store Object
  const selectedStore = useMemo(() => {
    return verifiedStores.find((s) => s.id === selectedSellerStoreId);
  }, [verifiedStores, selectedSellerStoreId]);

  // Filtered Active Sellers for Modal Selector
  const filteredActiveSellers = useMemo(() => {
    const q = sellerSearchQuery.trim().toLowerCase();
    if (!q) return verifiedStores;
    return verifiedStores.filter((s) => {
      const matchStore = s.storeName && s.storeName.toLowerCase().includes(q);
      const matchOwner = s.seller?.name && s.seller.name.toLowerCase().includes(q);
      const matchMobile = s.seller?.mobile && s.seller.mobile.toLowerCase().includes(q);
      const matchCity = s.pickupCity && s.pickupCity.toLowerCase().includes(q);
      const matchState = s.pickupState && s.pickupState.toLowerCase().includes(q);
      const matchGst = s.gstin && s.gstin.toLowerCase().includes(q);
      return matchStore || matchOwner || matchMobile || matchCity || matchState || matchGst;
    });
  }, [verifiedStores, sellerSearchQuery]);

  // Helpers for SKU and Sample Photos
  const handleGenerateSku = () => {
    tap();
    setNewSku(`FK-${Math.floor(100000 + Math.random() * 900000)}`);
  };

  const handleAttachSamplePhoto = () => {
    tap();
    setNewImageFrontUrl('https://images.unsplash.com/photo-1592417817098-8f3d6ef23a80?q=80&w=600&auto=format&fit=crop');
    setNewImageBackUrl('https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=600&auto=format&fit=crop');
    setNewImageDosageUrl('https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?q=80&w=600&auto=format&fit=crop');
    showAdminToast('INFO', 'Sample Photos Attached', 'High-resolution agricultural product images loaded for testing.');
  };

  // Pricing & Logistics Computations
  const mrpNum = parseFloat(newMrp) || 0;
  const priceNum = parseFloat(newPrice) || 0;
  const discountPercent = mrpNum > priceNum && mrpNum > 0 ? Math.round(((mrpNum - priceNum) / mrpNum) * 100) : 0;
  const discountAmount = mrpNum > priceNum ? (mrpNum - priceNum).toFixed(0) : '0';

  const lengthNum = parseFloat(newLength) || 10;
  const widthNum = parseFloat(newWidth) || 10;
  const heightNum = parseFloat(newHeight) || 10;
  const deadWeightNum = parseFloat(newDeadWeight) || 0.5;
  const volumetricWeight = ((lengthNum * widthNum * heightNum) / 5000).toFixed(2);
  const billableWeight = Math.max(deadWeightNum, parseFloat(volumetricWeight)).toFixed(2);

  // Tab Navigation Indices
  const currentTabIndex = ADD_PRODUCT_TABS.findIndex((t) => t.id === addModalTab);
  const hasPrevTab = currentTabIndex > 0;
  const hasNextTab = currentTabIndex < ADD_PRODUCT_TABS.length - 1;

  const goToPrevTab = () => {
    tap();
    if (hasPrevTab) setAddModalTab(ADD_PRODUCT_TABS[currentTabIndex - 1].id);
  };
  const goToNextTab = () => {
    tap();
    if (hasNextTab) setAddModalTab(ADD_PRODUCT_TABS[currentTabIndex + 1].id);
  };

  // Submit Create Product (Admin creates on behalf of selected active seller)
  const handleCreateProduct = async () => {
    if (!selectedSellerStoreId) {
      showAdminToast('WARNING', 'Seller Selection Required', 'Please select an active verified seller store to list this product.');
      setAddModalTab('STORE_BASIC');
      return;
    }
    if (!newName.trim()) {
      showAdminToast('WARNING', 'Product Name Required', 'Please enter a product title or name.');
      setAddModalTab('STORE_BASIC');
      return;
    }
    if (!newPrice.trim()) {
      showAdminToast('WARNING', 'Selling Price Required', 'Please enter a valid selling price.');
      setAddModalTab('PRICING_STOCK');
      return;
    }

    const priceVal = parseFloat(newPrice) || 100;
    const mrpVal = parseFloat(newMrp) || priceVal;
    const stockVal = parseInt(newStock, 10) || 10;
    const deadWeightVal = parseFloat(newDeadWeight) || 0.5;
    const lengthVal = parseFloat(newLength) || 10;
    const widthVal = parseFloat(newWidth) || 10;
    const heightVal = parseFloat(newHeight) || 10;
    const gstVal = parseFloat(newGstRate) || 18;
    const returnDaysVal = parseInt(newReturnWindowDays, 10) || 7;

    const createdName = newName.trim();

    try {
      await createProduct.mutateAsync({
        name: createdName,
        title: createdName,
        brand: newBrand.trim() || undefined,
        category: newCategory,
        categorySlug: newCategory.toLowerCase().replace(/\s+/g, '-'),
        unit: newUnit,
        price: priceVal,
        sellingPrice: priceVal,
        mrp: mrpVal,
        stockQty: stockVal,
        sellerStoreId: selectedSellerStoreId,
        sku: newSku.trim() || undefined,
        hsnCode: newHsn.trim() || undefined,
        gstPercentage: gstVal,
        deadWeightKg: deadWeightVal,
        weightKg: deadWeightVal,
        lengthCm: lengthVal,
        widthCm: widthVal,
        heightCm: heightVal,
        technicalName: newTechnicalName.trim() || undefined,
        dosageInstructions: newDosageInstructions.trim() || undefined,
        suitableCrops: newSuitableCrops.trim() || undefined,
        targetPests: newTargetPests.trim() || undefined,
        batchNumber: newBatchNumber.trim() || undefined,
        expiryDate: newExpiryDate.trim() || undefined,
        imageUrl: newImageFrontUrl.trim() || undefined,
        imageFrontUrl: newImageFrontUrl.trim() || undefined,
        imageBackLabelUrl: newImageBackUrl.trim() || undefined,
        imageDosageUrl: newImageDosageUrl.trim() || undefined,
        imageProductUrl: newImageFrontUrl.trim() || undefined,
        isCodAllowed: newIsCodAllowed,
        isReturnable: newIsReturnable,
        returnWindowDays: returnDaysVal,
        description: newDescription.trim() || undefined,
      });

      const storeName = selectedStore ? selectedStore.storeName : 'Selected Merchant';
      showAdminToast(
        'SUCCESS',
        'Product Listed Successfully',
        `"${createdName}" published under seller: ${storeName}`
      );

      // Reset Form
      setNewName('');
      setNewPrice('450');
      setNewMrp('600');
      setNewStock('50');
      setNewDescription('');
      setNewImageFrontUrl('');
      setNewImageBackUrl('');
      setNewImageDosageUrl('');
      setNewTechnicalName('');
      setNewDosageInstructions('');
      setNewSuitableCrops('');
      setNewTargetPests('');
      setNewBatchNumber('');
      setNewExpiryDate('');
      setNewSku(`FK-${Math.floor(100000 + Math.random() * 900000)}`);
      setShowAddModal(false);
      setAddModalTab('STORE_BASIC');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to list product.';
      showAdminToast('ALERT', 'Listing Failed', Array.isArray(msg) ? msg.join(', ') : msg);
    }
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!deletingProduct) return;
    const deletedName = deletingProduct.name;
    await removeProduct.mutateAsync(deletingProduct.id);
    showAdminToast(
      'WARNING',
      'Product Removed',
      `${deletedName} was deleted from catalog.`
    );
    setDeletingProduct(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 🌟 Top Executive Header */}
      <View
        style={[
          styles.headerBar,
          isLight && { backgroundColor: '#ffffff', borderBottomColor: '#e2e8f0' },
          isDarkTheme && { backgroundColor: '#020b06', borderBottomColor: 'rgba(56, 189, 248, 0.2)' },
        ]}
      >
        <View style={styles.headerTitleCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <Text style={[styles.headerTitle, { color: textColor }]}>Market Products</Text>
            <View
              style={[
                styles.marketBadge,
                isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.25)' },
                isDarkTheme && { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.35)' },
              ]}
            >
              <Text
                style={[
                  styles.marketBadgeText,
                  isLight && { color: '#16a34a' },
                  isDarkTheme && { color: '#38bdf8' },
                ]}
              >
                {totalCount} Items
              </Text>
            </View>
            <View style={styles.livePulse}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Live</Text>
            </View>
          </View>
        </View>

        {/* Top Action Buttons */}
        <View style={styles.headerActionsRow}>
          <TouchableOpacity
            style={[styles.refreshIconBtn, isLight && styles.refreshIconBtnLight]}
            onPress={() => refetch()}
            activeOpacity={0.7}
            accessibilityLabel="Refresh Products"
          >
            <Ionicons name="refresh-outline" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.addListingBtn, isLight && styles.addListingBtnLight]}
            onPress={() => {
              tap();
              setShowAddModal(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={16} color="#ffffff" />
            <Text style={styles.addListingBtnText}>New Product</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 📊 Compact Interactive Filter Ribbon */}
      <View style={styles.analyticsSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.metricsGrid}
        >
          {/* Total */}
          <TouchableOpacity
            style={[
              styles.metricPill,
              isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: 'rgba(56, 189, 248, 0.05)', borderColor: 'rgba(56, 189, 248, 0.2)' },
              filter === 'ALL' && (isLight ? styles.metricPillSelectedLight : styles.metricPillSelected),
            ]}
            onPress={() => {
              tap();
              setFilter('ALL');
            }}
          >
            <Ionicons name="cube-outline" size={13} color="#38bdf8" />
            <Text style={[styles.metricPillLabel, { color: subTextColor }]}>Total</Text>
            <Text style={[styles.metricPillCount, { color: textColor }]}>{totalCount}</Text>
          </TouchableOpacity>

          {/* Active */}
          <TouchableOpacity
            style={[
              styles.metricPill,
              isLight && { backgroundColor: '#f0fdf4', borderColor: 'rgba(22, 163, 74, 0.25)' },
              isDarkTheme && { backgroundColor: 'rgba(34, 197, 94, 0.05)', borderColor: 'rgba(34, 197, 94, 0.25)' },
              filter === 'ACTIVE' && (isLight ? styles.metricPillSelectedLight : styles.metricPillSelected),
            ]}
            onPress={() => {
              tap();
              setFilter('ACTIVE');
            }}
          >
            <Ionicons name="checkmark-circle-outline" size={13} color="#22c55e" />
            <Text style={[styles.metricPillLabel, { color: subTextColor }]}>Active</Text>
            <Text style={[styles.metricPillCount, { color: isLight ? '#16a34a' : '#00ff87' }]}>
              {activeCount}
            </Text>
          </TouchableOpacity>

          {/* Low Stock */}
          <TouchableOpacity
            style={[
              styles.metricPill,
              isLight && { backgroundColor: '#fefce8', borderColor: 'rgba(245, 158, 11, 0.25)' },
              isDarkTheme && { backgroundColor: 'rgba(245, 158, 11, 0.05)', borderColor: 'rgba(245, 158, 11, 0.25)' },
              filter === 'LOW_STOCK' && (isLight ? styles.metricPillSelectedLight : styles.metricPillSelected),
            ]}
            onPress={() => {
              tap();
              setFilter('LOW_STOCK');
            }}
          >
            <Ionicons name="alert-circle-outline" size={13} color="#f59e0b" />
            <Text style={[styles.metricPillLabel, { color: subTextColor }]}>Stock Alerts</Text>
            <Text style={[styles.metricPillCount, { color: '#f59e0b' }]}>{lowStockCount}</Text>
          </TouchableOpacity>

          {/* Out of Stock */}
          <TouchableOpacity
            style={[
              styles.metricPill,
              isLight && { backgroundColor: '#fef2f2', borderColor: 'rgba(239, 68, 68, 0.2)' },
              isDarkTheme && { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.25)' },
              filter === 'OUT_OF_STOCK' && (isLight ? styles.metricPillSelectedLight : styles.metricPillSelected),
            ]}
            onPress={() => {
              tap();
              setFilter('OUT_OF_STOCK');
            }}
          >
            <Ionicons name="close-circle-outline" size={13} color="#f87171" />
            <Text style={[styles.metricPillLabel, { color: subTextColor }]}>Out of Stock</Text>
          </TouchableOpacity>

          {/* Deactivated */}
          <TouchableOpacity
            style={[
              styles.metricPill,
              isLight && { backgroundColor: '#fef2f2', borderColor: 'rgba(239, 68, 68, 0.2)' },
              isDarkTheme && { backgroundColor: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.25)' },
              filter === 'DEACTIVATED' && (isLight ? styles.metricPillSelectedLight : styles.metricPillSelected),
            ]}
            onPress={() => {
              tap();
              setFilter('DEACTIVATED');
            }}
          >
            <Ionicons name="pause-circle-outline" size={13} color="#ef4444" />
            <Text style={[styles.metricPillLabel, { color: subTextColor }]}>Deactivated</Text>
            <Text style={[styles.metricPillCount, { color: '#ef4444' }]}>{deactivatedCount}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* 🔍 Compact Search & Category Row */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBarBox,
            isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
            isDarkTheme && { backgroundColor: '#05180c', borderColor: 'rgba(0, 255, 135, 0.25)' },
          ]}
        >
          <Ionicons name="search" size={14} color={isLight ? '#64748b' : '#00ff87'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search products by name, seller or category..."
            placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={15} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Category Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryChipsScroll}
        >
          {CATEGORY_OPTIONS.map((cat) => {
            const isSel = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.catChip,
                  isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
                  isSel && (
                    isLight
                      ? { backgroundColor: '#16a34a', borderColor: '#16a34a' }
                      : isDarkTheme
                      ? { backgroundColor: '#38bdf8', borderColor: '#38bdf8' }
                      : { backgroundColor: '#00ff87', borderColor: '#00ff87' }
                  ),
                ]}
                onPress={() => {
                  tap();
                  setSelectedCategory(cat);
                }}
              >
                <Text
                  style={[
                    styles.catChipText,
                    isLight && { color: '#475569' },
                    isSel && { color: isLight ? '#ffffff' : '#020617', fontFamily: FONT.bold },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 📦 Product Listings List */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingProducts ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.loadingText, { color: subTextColor }]}>
              Loading market products...
            </Text>
          </View>
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <View style={[styles.emptyIconCircle, isLight && styles.emptyIconCircleLight]}>
              <Ionicons
                name="storefront-outline"
                size={38}
                color={isLight ? '#16a34a' : '#00ff87'}
              />
            </View>
            <Text style={[styles.emptyTitle, { color: textColor }]}>No Products Found</Text>
            <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
              {searchQuery || filter !== 'ALL' || selectedCategory !== 'All'
                ? 'No items match your active search or filters. Clear them to see all catalog items.'
                : 'Your market catalog is currently empty. Tap "New Product" to add your first listing.'}
            </Text>
            {(searchQuery || filter !== 'ALL' || selectedCategory !== 'All') && (
              <TouchableOpacity
                style={[styles.clearFilterBtn, isLight && styles.clearFilterBtnLight]}
                onPress={() => {
                  setSearchQuery('');
                  setFilter('ALL');
                  setSelectedCategory('All');
                }}
              >
                <Text style={styles.clearFilterBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredProducts.map((p, index) => {
            const seller = getProductSellerInfo(p, index);
            const isOutOfStock = p.stockQty <= 0;
            const isLowStock = p.stockQty > 0 && p.stockQty <= 5;

            return (
              <View
                key={p.id}
                style={[
                  styles.productCard,
                  isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
                  isDarkTheme && { backgroundColor: '#05180c', borderColor: 'rgba(0, 255, 135, 0.2)' },
                  !p.isActive && styles.productCardInactive,
                  premiumShadow('#000000', 'sm') as any,
                ]}
              >
                {/* Main Card Body Row */}
                <View style={styles.cardMainRow}>
                  {/* Thumbnail 40x40 */}
                  <View
                    style={[
                      styles.thumbnailBox,
                      isLight && styles.thumbnailBoxLight,
                      isDarkTheme && { backgroundColor: 'rgba(0, 255, 135, 0.08)' },
                    ]}
                  >
                    {p.imageUrl ? (
                      <Image
                        source={{ uri: p.imageUrl }}
                        style={styles.productImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons
                        name="cube"
                        size={20}
                        color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'}
                      />
                    )}
                  </View>

                  {/* Info Column */}
                  <View style={styles.productDetailsCol}>
                    <View style={styles.productTopRow}>
                      <Text
                        style={[styles.productName, { color: textColor }]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </Text>

                      {/* Price on right */}
                      <View style={styles.priceContainer}>
                        <Text
                          style={[
                            styles.priceValue,
                            isLight && { color: '#16a34a' },
                            isDarkTheme && { color: '#38bdf8' },
                          ]}
                        >
                          ₹{p.price}
                        </Text>
                        <Text style={[styles.unitValue, { color: subTextColor }]}>
                          /{p.unit || 'piece'}
                        </Text>
                      </View>
                    </View>

                    {/* Metadata: Category, Seller & Stock Badges */}
                    <View style={styles.metaBadgesRow}>
                      <View style={[styles.categoryTag, isLight && styles.categoryTagLight]}>
                        <Text style={[styles.categoryTagText, isLight && { color: '#16a34a' }]}>
                          {p.category || 'General'}
                        </Text>
                      </View>

                      <View style={styles.sellerMetaRow}>
                        <Ionicons
                          name="storefront-outline"
                          size={11}
                          color={isLight ? '#64748b' : '#94a3b8'}
                        />
                        <Text
                          style={[styles.sellerNameText, { color: subTextColor }]}
                          numberOfLines={1}
                        >
                          {seller.name}
                        </Text>
                        {seller.verified && (
                          <Ionicons name="checkmark-circle" size={11} color="#0284c7" />
                        )}
                      </View>

                      {/* Stock Status Badge */}
                      <View
                        style={[
                          styles.stockStatusBadge,
                          !p.isActive
                            ? styles.stockBadgeDeactivated
                            : isOutOfStock
                            ? styles.stockBadgeOut
                            : isLowStock
                            ? styles.stockBadgeLow
                            : styles.stockBadgeIn,
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            {
                              backgroundColor: !p.isActive
                                ? '#ef4444'
                                : isOutOfStock
                                ? '#ef4444'
                                : isLowStock
                                ? '#f59e0b'
                                : '#22c55e',
                            },
                          ]}
                        />
                        <Text
                          style={[
                            styles.stockStatusText,
                            {
                              color: !p.isActive
                                ? '#ef4444'
                                : isOutOfStock
                                ? '#ef4444'
                                : isLowStock
                                ? '#f59e0b'
                                : isLight
                                ? '#16a34a'
                                : '#00ff87',
                            },
                          ]}
                        >
                          {!p.isActive
                            ? 'Deactivated'
                            : isOutOfStock
                            ? 'Out of Stock'
                            : isLowStock
                            ? `Low (${p.stockQty})`
                            : `In Stock (${p.stockQty})`}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Card Footer: Quick Status Toggle, Edit, Delete */}
                <View
                  style={[
                    styles.cardFooter,
                    isLight && { borderTopColor: '#f1f5f9' },
                    isDarkTheme && { borderTopColor: 'rgba(255, 255, 255, 0.06)' },
                  ]}
                >
                  <TouchableOpacity
                    style={[
                      styles.statusToggleBtn,
                      p.isActive
                        ? isLight
                          ? styles.statusToggleBtnActiveLight
                          : styles.statusToggleBtnActive
                        : styles.statusToggleBtnInactive,
                    ]}
                    onPress={() => handleToggleStatus(p)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={p.isActive ? 'checkmark-circle' : 'pause-circle'}
                      size={12}
                      color={p.isActive ? (isLight ? '#16a34a' : '#00ff87') : '#ef4444'}
                    />
                    <Text
                      style={[
                        styles.statusToggleText,
                        {
                          color: p.isActive
                            ? isLight
                              ? '#16a34a'
                              : '#00ff87'
                            : '#ef4444',
                        },
                      ]}
                    >
                      {p.isActive ? 'Active Listing' : 'Hold / Inactive'}
                    </Text>
                  </TouchableOpacity>

                  <View style={styles.actionIconsRow}>
                    <TouchableOpacity
                      style={[styles.editBtn, isLight && styles.editBtnLight]}
                      onPress={() => openEditModal(p)}
                      activeOpacity={0.7}
                      accessibilityLabel="Quick Edit"
                    >
                      <Ionicons
                        name="create-outline"
                        size={13}
                        color={isLight ? '#0284c7' : '#38bdf8'}
                      />
                      <Text
                        style={[
                          styles.editBtnText,
                          isLight && { color: '#0284c7' },
                          isDarkTheme && { color: '#38bdf8' },
                        ]}
                      >
                        Edit
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.deleteIconButton, isLight && styles.deleteIconButtonLight]}
                      onPress={() => {
                        tap();
                        setDeletingProduct(p);
                      }}
                      activeOpacity={0.7}
                      accessibilityLabel="Delete Product"
                    >
                      <Ionicons name="trash-outline" size={13} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ➕ Comprehensive Add Product Modal (Seller Mode with Active Seller Selection) */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowAddModal(false)}
        >
          <Pressable
            style={[
              styles.largeModalContent,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020b06', borderColor: 'rgba(56, 189, 248, 0.35)' },
              premiumShadow('#000000', 'lg') as any,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <View style={[styles.modalHeader, isLight && { borderBottomColor: '#e2e8f0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                <View style={[styles.modalIconWrap, isLight && { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="storefront" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Add New Product (Seller Mode)</Text>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
                    {selectedStore ? `Listing under: ${selectedStore.storeName}` : 'Select an active verified seller to list catalog item'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ padding: 4 }}>
                <Ionicons name="close" size={22} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* 6 Wizard Tabs Ribbon */}
            <View style={[styles.modalTabsBar, isLight && { backgroundColor: '#f8fafc', borderBottomColor: '#e2e8f0' }]}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
                {ADD_PRODUCT_TABS.map((tab) => {
                  const isActive = addModalTab === tab.id;
                  return (
                    <TouchableOpacity
                      key={tab.id}
                      style={[
                        styles.wizardTabPill,
                        isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
                        isDarkTheme && { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.12)' },
                        isActive && (isLight ? styles.wizardTabPillActiveLight : styles.wizardTabPillActive),
                      ]}
                      onPress={() => {
                        tap();
                        setAddModalTab(tab.id);
                      }}
                    >
                      <Ionicons
                        name={tab.icon as any}
                        size={13}
                        color={isActive ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8')}
                      />
                      <Text
                        style={[
                          styles.wizardTabPillText,
                          { color: isActive ? '#ffffff' : subTextColor },
                          isActive && { fontFamily: FONT.bold },
                        ]}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Modal Body */}
            <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
              {/* TAB 1: STORE & BASICS */}
              {addModalTab === 'STORE_BASIC' && (
                <View style={{ gap: 12 }}>
                  {/* Active Seller Store Card */}
                  <View style={[styles.formCardBox, isLight && styles.formCardBoxLight]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="business" size={16} color={isLight ? '#16a34a' : '#38bdf8'} />
                        <Text style={[styles.cardSectionHeading, { color: textColor }]}>Select Active Seller *</Text>
                      </View>
                      <View style={[styles.verifiedCountBadge, isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)' }]}>
                        <Text style={[styles.verifiedCountText, isLight && { color: '#16a34a' }]}>
                          {verifiedStores.length} Active Sellers
                        </Text>
                      </View>
                    </View>

                    {selectedStore ? (
                      <View style={[styles.selectedSellerCard, isLight && styles.selectedSellerCardLight]}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={[styles.selectedStoreName, { color: textColor }]}>{selectedStore.storeName}</Text>
                            <View style={styles.kycVerifiedTag}>
                              <Ionicons name="checkmark-circle" size={11} color="#16a34a" />
                              <Text style={styles.kycVerifiedText}>Active Verified</Text>
                            </View>
                            <View style={[styles.sellerTypeTag, isLight && { backgroundColor: '#f1f5f9' }]}>
                              <Text style={[styles.sellerTypeText, { color: subTextColor }]}>
                                {selectedStore.sellerType || 'VENDOR'}
                              </Text>
                            </View>
                          </View>
                          <Text style={[styles.selectedStoreSub, { color: subTextColor }]}>
                            Owner: {selectedStore.seller?.name || 'Seller'} • {selectedStore.seller?.mobile || 'No Mobile'}
                          </Text>
                          <Text style={[styles.selectedStoreSub, { color: subTextColor }]}>
                            Location: {selectedStore.pickupCity || ''}{selectedStore.pickupCity && selectedStore.pickupState ? ', ' : ''}{selectedStore.pickupState || 'Punjab'} • GST: {selectedStore.gstin || 'Unregistered'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.changeSellerBtn, isLight && styles.changeSellerBtnLight]}
                          onPress={() => {
                            tap();
                            setShowSellerPickerModal(true);
                          }}
                        >
                          <Ionicons name="swap-horizontal" size={14} color={isLight ? '#0284c7' : '#38bdf8'} />
                          <Text style={[styles.changeSellerBtnText, isLight && { color: '#0284c7' }]}>Change Seller</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={[styles.chooseSellerPrompt, isLight && styles.chooseSellerPromptLight]}
                        onPress={() => {
                          tap();
                          setShowSellerPickerModal(true);
                        }}
                      >
                        <View style={[styles.sellerPromptIconBox, isLight && { backgroundColor: '#fef3c7' }]}>
                          <Ionicons name="storefront-outline" size={22} color="#f59e0b" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.chooseSellerPromptTitle, { color: textColor }]}>
                            Click to Select Active Seller Store
                          </Text>
                          <Text style={[styles.chooseSellerPromptSub, { color: subTextColor }]}>
                            Choose which verified merchant catalog this product belongs to.
                          </Text>
                        </View>
                        <View style={[styles.pickSellerActionPill, isLight && { backgroundColor: '#16a34a' }]}>
                          <Text style={styles.pickSellerActionText}>Select Seller</Text>
                          <Ionicons name="chevron-forward" size={14} color="#ffffff" />
                        </View>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Product Title / Name */}
                  <View style={[styles.formCardBox, isLight && styles.formCardBoxLight]}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Product Name / Title *</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="e.g. Bio-Potash Granules 50kg / Micro-Nutrient Mix"
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newName}
                      onChangeText={setNewName}
                    />

                    {/* Brand Selection */}
                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 4 }]}>Brand / Manufacturer</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {BRAND_OPTIONS.map((brand) => (
                        <TouchableOpacity
                          key={brand}
                          style={[
                            styles.modalOptionPill,
                            newBrand === brand && styles.modalOptionPillActive,
                            isLight && newBrand !== brand && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                          ]}
                          onPress={() => {
                            tap();
                            setNewBrand(brand);
                          }}
                        >
                          <Text
                            style={[
                              styles.modalOptionPillText,
                              newBrand === brand && styles.modalOptionPillTextActive,
                              isLight && newBrand !== brand && { color: '#475569' },
                            ]}
                          >
                            {brand}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="Custom Brand Name (or selected above)"
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newBrand}
                      onChangeText={setNewBrand}
                    />

                    {/* Category Selection */}
                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 4 }]}>Category *</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {CATEGORY_OPTIONS.filter((c) => c !== 'All').map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[
                            styles.modalOptionPill,
                            newCategory === cat && styles.modalOptionPillActive,
                            isLight && newCategory !== cat && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                          ]}
                          onPress={() => {
                            tap();
                            setNewCategory(cat);
                          }}
                        >
                          <Text
                            style={[
                              styles.modalOptionPillText,
                              newCategory === cat && styles.modalOptionPillTextActive,
                              isLight && newCategory !== cat && { color: '#475569' },
                            ]}
                          >
                            {cat}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    {/* Unit Selection */}
                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 4 }]}>Unit of Measure</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                      {UNIT_OPTIONS.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            styles.modalOptionPill,
                            newUnit === u && styles.modalOptionPillActive,
                            isLight && newUnit !== u && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                          ]}
                          onPress={() => {
                            tap();
                            setNewUnit(u);
                          }}
                        >
                          <Text
                            style={[
                              styles.modalOptionPillText,
                              newUnit === u && styles.modalOptionPillTextActive,
                              isLight && newUnit !== u && { color: '#475569' },
                            ]}
                          >
                            {u}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                </View>
              )}

              {/* TAB 2: PRICING & STOCK */}
              {addModalTab === 'PRICING_STOCK' && (
                <View style={{ gap: 12 }}>
                  <View style={[styles.formCardBox, isLight && styles.formCardBoxLight]}>
                    <View style={styles.formRow2}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textColor }]}>MRP / Maximum Retail Price (₹)</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="600"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="numeric"
                          value={newMrp}
                          onChangeText={setNewMrp}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textColor }]}>Selling / Offer Price (₹) *</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="450"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="numeric"
                          value={newPrice}
                          onChangeText={setNewPrice}
                        />
                      </View>
                    </View>

                    {/* Discount Preview */}
                    {discountPercent > 0 && (
                      <View style={[styles.discountPreviewBanner, isLight && { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                        <Ionicons name="pricetag" size={14} color="#16a34a" />
                        <Text style={[styles.discountPreviewText, isLight && { color: '#16a34a' }]}>
                          Farmer Offer Discount: Save ₹{discountAmount} ({discountPercent}% OFF)
                        </Text>
                      </View>
                    )}

                    {/* Stock Qty & SKU */}
                    <View style={[styles.formRow2, { marginTop: 6 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textColor }]}>Stock Quantity *</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="50"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="numeric"
                          value={newStock}
                          onChangeText={setNewStock}
                        />
                      </View>
                      <View style={{ flex: 1.3 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.inputLabel, { color: textColor }]}>SKU Code</Text>
                          <TouchableOpacity onPress={handleGenerateSku}>
                            <Text style={{ fontSize: 10, color: isLight ? '#0284c7' : '#38bdf8', fontFamily: FONT.bold }}>
                              Auto Generate
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="FK-100234"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          value={newSku}
                          onChangeText={setNewSku}
                        />
                      </View>
                    </View>

                    {/* HSN Code & GST Rate */}
                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 4 }]}>Common Agricultural HSN Codes</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {COMMON_HSN_CODES.map((item) => (
                        <TouchableOpacity
                          key={item.code}
                          style={[
                            styles.modalOptionPill,
                            newHsn === item.code && styles.modalOptionPillActive,
                            isLight && newHsn !== item.code && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                          ]}
                          onPress={() => {
                            tap();
                            setNewHsn(item.code);
                          }}
                        >
                          <Text
                            style={[
                              styles.modalOptionPillText,
                              newHsn === item.code && styles.modalOptionPillTextActive,
                              isLight && newHsn !== item.code && { color: '#475569' },
                            ]}
                          >
                            {item.code} ({item.label})
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={styles.formRow2}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textColor }]}>HSN Code</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="310100"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          value={newHsn}
                          onChangeText={setNewHsn}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textColor }]}>GST Rate (%)</Text>
                        <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                          {GST_RATES.map((rate) => (
                            <TouchableOpacity
                              key={rate}
                              style={[
                                styles.gstPill,
                                newGstRate === rate && styles.gstPillActive,
                                isLight && newGstRate !== rate && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' },
                              ]}
                              onPress={() => {
                                tap();
                                setNewGstRate(rate);
                              }}
                            >
                              <Text
                                style={[
                                  styles.gstPillText,
                                  newGstRate === rate && styles.gstPillTextActive,
                                  isLight && newGstRate !== rate && { color: '#475569' },
                                ]}
                              >
                                {rate}%
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 3: PACKAGE & SIZE */}
              {addModalTab === 'LOGISTICS' && (
                <View style={{ gap: 12 }}>
                  <View style={[styles.formCardBox, isLight && styles.formCardBoxLight]}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Dead / Actual Weight (kg) *</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="0.5"
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      keyboardType="numeric"
                      value={newDeadWeight}
                      onChangeText={setNewDeadWeight}
                    />

                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 6 }]}>Parcel Dimensions (cm)</Text>
                    <View style={styles.formRow3}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subLabel, { color: subTextColor }]}>Length (cm)</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="10"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="numeric"
                          value={newLength}
                          onChangeText={setNewLength}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subLabel, { color: subTextColor }]}>Width (cm)</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="10"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="numeric"
                          value={newWidth}
                          onChangeText={setNewWidth}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.subLabel, { color: subTextColor }]}>Height (cm)</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="10"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="numeric"
                          value={newHeight}
                          onChangeText={setNewHeight}
                        />
                      </View>
                    </View>

                    {/* Volumetric Weight Calculator Preview */}
                    <View style={[styles.volumetricPreviewBox, isLight && styles.volumetricPreviewBoxLight]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Ionicons name="cube" size={15} color={isLight ? '#0284c7' : '#38bdf8'} />
                        <Text style={[styles.volumetricHeading, { color: textColor }]}>Courier Weight Matrix (Shiprocket Standard)</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                        <Text style={[styles.volumetricItem, { color: subTextColor }]}>Volumetric: <Text style={{ color: textColor, fontFamily: FONT.bold }}>{volumetricWeight} kg</Text></Text>
                        <Text style={[styles.volumetricItem, { color: subTextColor }]}>Dead Weight: <Text style={{ color: textColor, fontFamily: FONT.bold }}>{deadWeightNum} kg</Text></Text>
                        <Text style={[styles.volumetricItem, { color: isLight ? '#16a34a' : '#00ff87', fontFamily: FONT.bold }]}>Billable: {billableWeight} kg</Text>
                      </View>
                      <Text style={{ fontSize: 10, color: subTextColor, marginTop: 6 }}>
                        Formula: (Length × Width × Height) / 5000. Logistics partners bill based on the greater of dead weight or volumetric weight.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 4: AGRI TECHNICAL */}
              {addModalTab === 'AGRI_SPECS' && (
                <View style={{ gap: 12 }}>
                  <View style={[styles.formCardBox, isLight && styles.formCardBoxLight]}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Technical Formulation / Active Ingredient</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="e.g. Trichoderma Viride 1.5% WP / Chlorpyrifos 20% EC"
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newTechnicalName}
                      onChangeText={setNewTechnicalName}
                    />

                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 4 }]}>Dosage & Application Instructions</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="e.g. 2-3 ml per litre of water or 1 kg per acre; spray during evening hours"
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newDosageInstructions}
                      onChangeText={setNewDosageInstructions}
                    />

                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 4 }]}>Suitable Crops</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
                      {['Wheat', 'Paddy / Rice', 'Cotton', 'Mustard', 'Tomato', 'Potato', 'Vegetables', 'Sugarcane'].map((crop) => (
                        <TouchableOpacity
                          key={crop}
                          style={[
                            styles.modalOptionPill,
                            newSuitableCrops.includes(crop) && styles.modalOptionPillActive,
                            isLight && !newSuitableCrops.includes(crop) && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                          ]}
                          onPress={() => {
                            tap();
                            setNewSuitableCrops((prev) => (prev ? `${prev}, ${crop}` : crop));
                          }}
                        >
                          <Text
                            style={[
                              styles.modalOptionPillText,
                              newSuitableCrops.includes(crop) && styles.modalOptionPillTextActive,
                              isLight && !newSuitableCrops.includes(crop) && { color: '#475569' },
                            ]}
                          >
                            + {crop}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="e.g. Wheat, Paddy, Cotton, Mustard, Vegetables"
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newSuitableCrops}
                      onChangeText={setNewSuitableCrops}
                    />

                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 4 }]}>Target Pests / Diseases / Weeds</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="e.g. Stem Borer, Aphids, Yellow Rust, Leaf Blight"
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newTargetPests}
                      onChangeText={setNewTargetPests}
                    />

                    <View style={[styles.formRow2, { marginTop: 4 }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textColor }]}>Batch Number</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="e.g. FK-2026-B01"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          value={newBatchNumber}
                          onChangeText={setNewBatchNumber}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.inputLabel, { color: textColor }]}>Expiry Date (YYYY-MM-DD)</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="2027-12-31"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          value={newExpiryDate}
                          onChangeText={setNewExpiryDate}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 5: PHOTOS & MEDIA */}
              {addModalTab === 'PHOTOS' && (
                <View style={{ gap: 12 }}>
                  <View style={[styles.formCardBox, isLight && styles.formCardBoxLight]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                      <Text style={[styles.cardSectionHeading, { color: textColor }]}>Product Photos & Visual Labels</Text>
                      <TouchableOpacity
                        style={[styles.samplePhotoBtn, isLight && styles.samplePhotoBtnLight]}
                        onPress={handleAttachSamplePhoto}
                      >
                        <Ionicons name="sparkles" size={13} color={isLight ? '#16a34a' : '#00ff87'} />
                        <Text style={[styles.samplePhotoBtnText, isLight && { color: '#16a34a' }]}>Attach Sample Photos</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Front Photo */}
                    <Text style={[styles.inputLabel, { color: textColor }]}>Primary / Front Pack Photo URL *</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="https://images.unsplash.com/photo-..."
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newImageFrontUrl}
                      onChangeText={setNewImageFrontUrl}
                    />

                    {/* Live Preview if Front URL */}
                    {Boolean(newImageFrontUrl) && (
                      <View style={[styles.photoPreviewCard, isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                        <Image source={{ uri: newImageFrontUrl }} style={styles.photoPreviewImg} resizeMode="contain" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: textColor }}>Front Photo Live Preview</Text>
                          <Text style={{ fontSize: 10, color: subTextColor, marginTop: 2 }} numberOfLines={1}>{newImageFrontUrl}</Text>
                        </View>
                      </View>
                    )}

                    {/* Back Label URL */}
                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 8 }]}>Back Label & Ingredients Photo URL</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="https://images.unsplash.com/photo-..."
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newImageBackUrl}
                      onChangeText={setNewImageBackUrl}
                    />

                    {/* Dosage Chart URL */}
                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 8 }]}>Dosage Schedule & Application Chart URL</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                      placeholder="https://images.unsplash.com/photo-..."
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      value={newImageDosageUrl}
                      onChangeText={setNewImageDosageUrl}
                    />
                  </View>
                </View>
              )}

              {/* TAB 6: POLICIES & NOTES */}
              {addModalTab === 'POLICIES' && (
                <View style={{ gap: 12 }}>
                  <View style={[styles.formCardBox, isLight && styles.formCardBoxLight]}>
                    {/* COD Switch */}
                    <View style={[styles.toggleSettingRow, isLight && { borderBottomColor: '#f1f5f9' }]}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.toggleSettingTitle, { color: textColor }]}>Allow Cash on Delivery (COD)</Text>
                        <Text style={[styles.toggleSettingDesc, { color: subTextColor }]}>
                          Permit buyers to pay cash at delivery. Automatically restricted if weight is 25 kg or more.
                        </Text>
                      </View>
                      <Switch
                        value={newIsCodAllowed}
                        onValueChange={setNewIsCodAllowed}
                        trackColor={{ false: '#64748b', true: '#10b981' }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    {/* Returnable Switch */}
                    <View style={[styles.toggleSettingRow, isLight && { borderBottomColor: '#f1f5f9' }, { marginTop: 10 }]}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.toggleSettingTitle, { color: textColor }]}>Return & Replacement Policy</Text>
                        <Text style={[styles.toggleSettingDesc, { color: subTextColor }]}>
                          Allow farmers to request replacement or return if damaged/wrong batch received.
                        </Text>
                      </View>
                      <Switch
                        value={newIsReturnable}
                        onValueChange={setNewIsReturnable}
                        trackColor={{ false: '#64748b', true: '#10b981' }}
                        thumbColor="#ffffff"
                      />
                    </View>

                    {newIsReturnable && (
                      <View style={{ marginTop: 8 }}>
                        <Text style={[styles.inputLabel, { color: textColor }]}>Return Window (Days)</Text>
                        <TextInput
                          style={[styles.formInput, isLight && styles.formInputLight, { color: textColor }]}
                          placeholder="7"
                          placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                          keyboardType="numeric"
                          value={newReturnWindowDays}
                          onChangeText={setNewReturnWindowDays}
                        />
                      </View>
                    )}

                    {/* Detailed Description */}
                    <Text style={[styles.inputLabel, { color: textColor, marginTop: 8 }]}>Full Product Description & Usage Guide</Text>
                    <TextInput
                      style={[styles.formInput, isLight && styles.formInputLight, { color: textColor, height: 80 }]}
                      placeholder="Detailed features, active ingredients, safety precautions, farmer tips..."
                      placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                      multiline
                      value={newDescription}
                      onChangeText={setNewDescription}
                    />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Footer Navigation */}
            <View style={[styles.modalFooter, isLight && { borderTopColor: '#e2e8f0' }]}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, isLight && styles.modalCancelBtnLight]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalCancelBtnText, isLight && { color: '#64748b' }]}>Cancel</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {hasPrevTab && (
                  <TouchableOpacity
                    style={[styles.modalNavBtn, isLight && styles.modalNavBtnLight]}
                    onPress={goToPrevTab}
                  >
                    <Ionicons name="arrow-back" size={14} color={textColor} />
                    <Text style={[styles.modalNavBtnText, { color: textColor }]}>Back</Text>
                  </TouchableOpacity>
                )}

                {hasNextTab && (
                  <TouchableOpacity
                    style={[styles.modalNavBtn, isLight && styles.modalNavBtnLight]}
                    onPress={goToNextTab}
                  >
                    <Text style={[styles.modalNavBtnText, { color: textColor }]}>Next</Text>
                    <Ionicons name="arrow-forward" size={14} color={textColor} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalSubmitBtn, isLight && styles.modalSubmitBtnLight]}
                  onPress={handleCreateProduct}
                  disabled={createProduct.isPending || !newName.trim() || !selectedSellerStoreId}
                >
                  {createProduct.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={15} color="#ffffff" />
                      <Text style={styles.modalSubmitBtnText}>Publish Listing</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 🏬 Dedicated Active Seller Store Picker Modal */}
      <Modal
        visible={showSellerPickerModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSellerPickerModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowSellerPickerModal(false)}
        >
          <Pressable
            style={[
              styles.sellerPickerModalContent,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020b06', borderColor: 'rgba(56, 189, 248, 0.35)' },
              premiumShadow('#000000', 'lg') as any,
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Picker Header */}
            <View style={[styles.modalHeader, isLight && { borderBottomColor: '#e2e8f0' }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={[styles.modalIconWrap, isLight && { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="storefront" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.modalTitle, { color: textColor }]}>Select Active Verified Seller</Text>
                  <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }}>
                    Only verified active sellers are eligible for product listings
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowSellerPickerModal(false)}>
                <Ionicons name="close" size={22} color={subTextColor} />
              </TouchableOpacity>
            </View>

            {/* Search Active Sellers */}
            <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 }}>
              <View style={[styles.sellerSearchInputWrap, isLight && styles.sellerSearchInputWrapLight]}>
                <Ionicons name="search" size={15} color={subTextColor} />
                <TextInput
                  style={[styles.sellerSearchInput, { color: textColor }]}
                  placeholder="Search by store name, owner, or mobile..."
                  placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                  value={sellerSearchQuery}
                  onChangeText={setSellerSearchQuery}
                />
                {Boolean(sellerSearchQuery) && (
                  <TouchableOpacity onPress={() => setSellerSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color={subTextColor} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Active Sellers List */}
            <ScrollView style={{ maxHeight: 380, paddingHorizontal: 16 }} showsVerticalScrollIndicator={false}>
              {isLoadingStores ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <ActivityIndicator size="small" color={isLight ? '#16a34a' : '#00ff87'} />
                  <Text style={{ marginTop: 8, fontSize: 12, color: subTextColor }}>Loading verified sellers...</Text>
                </View>
              ) : filteredActiveSellers.length === 0 ? (
                <View style={{ padding: 24, alignItems: 'center' }}>
                  <Ionicons name="storefront-outline" size={36} color={subTextColor} />
                  <Text style={{ marginTop: 8, fontSize: 13, fontFamily: FONT.bold, color: textColor }}>
                    No Active Sellers Found
                  </Text>
                  <Text style={{ marginTop: 4, fontSize: 11, color: subTextColor, textAlign: 'center' }}>
                    {sellerSearchQuery
                      ? 'No active seller matches your search. Try another keyword.'
                      : 'No sellers with verified KYC currently active.'}
                  </Text>
                </View>
              ) : (
                filteredActiveSellers.map((store) => {
                  const isSelected = store.id === selectedSellerStoreId;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={[
                        styles.sellerPickerRowItem,
                        isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
                        isDarkTheme && { backgroundColor: 'rgba(255, 255, 255, 0.03)', borderColor: 'rgba(255, 255, 255, 0.1)' },
                        isSelected && (isLight ? styles.sellerPickerRowItemSelectedLight : styles.sellerPickerRowItemSelected),
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedSellerStoreId(store.id);
                        setShowSellerPickerModal(false);
                        showAdminToast('INFO', 'Seller Selected', `Product listing will be credited to ${store.storeName}`);
                      }}
                    >
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={[styles.pickerStoreName, { color: textColor }]}>{store.storeName}</Text>
                          <View style={styles.kycVerifiedTag}>
                            <Ionicons name="checkmark-circle" size={10} color="#16a34a" />
                            <Text style={styles.kycVerifiedText}>Verified</Text>
                          </View>
                          <View style={[styles.sellerTypeTag, isLight && { backgroundColor: '#e2e8f0' }]}>
                            <Text style={[styles.sellerTypeText, { color: subTextColor }]}>
                              {store.sellerType || 'VENDOR'}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.pickerOwnerText, { color: subTextColor }]}>
                          Owner: {store.seller?.name || 'Seller'} • {store.seller?.mobile || 'No Mobile'}
                        </Text>
                        <Text style={[styles.pickerOwnerText, { color: subTextColor }]}>
                          Location: {store.pickupCity || ''}{store.pickupCity && store.pickupState ? ', ' : ''}{store.pickupState || 'Punjab'} • GST: {store.gstin || 'Unregistered'}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.selectSellerRadio,
                          isSelected && styles.selectSellerRadioActive,
                          isLight && !isSelected && { borderColor: '#cbd5e1' },
                        ]}
                      >
                        {isSelected && <View style={styles.selectSellerRadioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {/* Picker Footer */}
            <View style={[styles.modalFooter, isLight && { borderTopColor: '#e2e8f0' }, { justifyContent: 'space-between' }]}>
              <Text style={{ fontSize: 11, color: subTextColor }}>
                {verifiedStores.length} Active Sellers Loaded
              </Text>
              <TouchableOpacity
                style={[styles.modalCancelBtn, isLight && styles.modalCancelBtnLight]}
                onPress={() => setShowSellerPickerModal(false)}
              >
                <Text style={[styles.modalCancelBtnText, isLight && { color: '#64748b' }]}>Close</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ✏️ Quick Edit Product Modal */}
      <Modal
        visible={Boolean(editingProduct)}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingProduct(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setEditingProduct(null)}
        >
          <Pressable
            style={[
              styles.editModalContent,
              isLight && { backgroundColor: '#ffffff' },
              isDarkTheme && { backgroundColor: '#020b06', borderColor: 'rgba(56, 189, 248, 0.3)' },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]} numberOfLines={1}>
                Edit: {editingProduct?.name}
              </Text>
              <TouchableOpacity onPress={() => setEditingProduct(null)}>
                <Ionicons name="close" size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, paddingVertical: 12 }}>
              <View style={styles.formRow2}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Price (₹)</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      isLight && styles.formInputLight,
                      { color: textColor },
                    ]}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Stock Units</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      isLight && styles.formInputLight,
                      { color: textColor },
                    ]}
                    keyboardType="numeric"
                    value={editStock}
                    onChangeText={setEditStock}
                  />
                </View>
              </View>

              {/* Status Switch */}
              <TouchableOpacity
                style={[
                  styles.statusToggleBar,
                  editIsActive
                    ? isLight
                      ? styles.statusToggleBarActiveLight
                      : styles.statusToggleBarActive
                    : styles.statusToggleBarInactive,
                ]}
                onPress={() => setEditIsActive(!editIsActive)}
              >
                <Ionicons
                  name={editIsActive ? 'checkmark-circle' : 'pause-circle'}
                  size={18}
                  color={editIsActive ? (isLight ? '#16a34a' : '#00ff87') : '#ef4444'}
                />
                <Text
                  style={[
                    styles.statusToggleBarText,
                    {
                      color: editIsActive
                        ? isLight
                          ? '#16a34a'
                          : '#00ff87'
                        : '#ef4444',
                    },
                  ]}
                >
                  {editIsActive ? 'Product is Active in Store' : 'Product is Deactivated / On Hold'}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, isLight && styles.modalCancelBtnLight]}
                onPress={() => setEditingProduct(null)}
              >
                <Text style={[styles.modalCancelBtnText, isLight && { color: '#64748b' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isLight && styles.modalSubmitBtnLight]}
                onPress={handleSaveEdit}
                disabled={updateProduct.isPending}
              >
                {updateProduct.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Save Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 🗑️ Safe Delete Confirmation Modal */}
      <Modal
        visible={Boolean(deletingProduct)}
        transparent
        animationType="fade"
        onRequestClose={() => setDeletingProduct(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setDeletingProduct(null)}
        >
          <Pressable
            style={[
              styles.deleteModalContent,
              isLight && { backgroundColor: '#ffffff' },
              isDarkTheme && { backgroundColor: '#020b06', borderColor: 'rgba(239, 68, 68, 0.4)' },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash" size={26} color="#ef4444" />
            </View>
            <Text style={[styles.deleteModalTitle, { color: textColor }]}>Delete Product?</Text>
            <Text style={[styles.deleteModalDesc, { color: subTextColor }]}>
              Are you sure you want to permanently remove "{deletingProduct?.name}" from the market catalog?
            </Text>

            <View style={styles.deleteModalBtnRow}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, isLight && styles.modalCancelBtnLight, { flex: 1 }]}
                onPress={() => setDeletingProduct(null)}
              >
                <Text style={[styles.modalCancelBtnText, isLight && { color: '#64748b' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteConfirmBtn}
                onPress={handleConfirmDelete}
                disabled={removeProduct.isPending}
              >
                {removeProduct.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020d06',
    ...(typeof window !== 'undefined'
      ? ({ height: '100%', overflow: 'hidden' } as any)
      : {}),
  },

  /* Header Bar */
  headerBar: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#03140a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.15)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  marketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  marketBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  livePulse: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#22c55e',
  },
  liveText: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: '#22c55e',
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  refreshIconBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshIconBtnLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  addListingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 8,
    ...premiumShadow('#059669', 'sm') as any,
  },
  addListingBtnLight: {
    backgroundColor: '#16a34a',
  },
  addListingBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },

  /* Metrics Ribbon */
  analyticsSection: {
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  metricPillSelected: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderColor: '#00ff87',
  },
  metricPillSelectedLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  metricPillLabel: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  metricPillCount: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },

  /* Search & Filter Area */
  searchSection: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 2,
    gap: 5,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#ffffff',
    padding: 0,
  },
  categoryChipsScroll: {
    gap: 4,
    paddingVertical: 1,
  },
  catChip: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  catChipText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },

  /* List & Cards */
  listContainer: {
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'web' ? 24 : 32,
    gap: 12,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  emptyIconCircleLight: {
    backgroundColor: '#f0fdf4',
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  emptySubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 320,
  },
  clearFilterBtn: {
    marginTop: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: '#00ff87',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  clearFilterBtnLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  clearFilterBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },

  /* Product Card */
  productCard: {
    backgroundColor: '#04140a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.18)',
    padding: 14,
    gap: 10,
  },
  productCardInactive: {
    opacity: 0.72,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailBox: {
    width: 46,
    height: 46,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailBoxLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetailsCol: {
    flex: 1,
    gap: 2,
  },
  productTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  productName: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
    flex: 1,
  },
  metaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 5,
  },
  categoryTag: {
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  categoryTagLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  categoryTagText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  sellerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  sellerNameText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    maxWidth: 120,
  },
  stockStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  stockBadgeIn: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.3)',
  },
  stockBadgeLow: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  stockBadgeOut: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  stockBadgeDeactivated: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  statusDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.25,
  },
  stockStatusText: {
    fontSize: 9,
    fontFamily: FONT.bold,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceValue: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  unitValue: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },

  /* Card Footer */
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusToggleBtnActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  statusToggleBtnActiveLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  statusToggleBtnInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  statusToggleText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  actionIconsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5.5,
    borderRadius: 6,
  },
  editBtnLight: {
    backgroundColor: '#f0f9ff',
    borderColor: 'rgba(2, 132, 199, 0.25)',
  },
  editBtnText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#38bdf8',
  },
  deleteIconButton: {
    padding: 4,
    borderRadius: 5,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  deleteIconButtonLight: {
    backgroundColor: '#fef2f2',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },

  /* Modals */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#04140a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    maxHeight: '90%',
    overflow: 'hidden',
    ...premiumShadow('#000000', 'lg') as any,
  },
  editModalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#04140a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    padding: 16,
    ...premiumShadow('#000000', 'lg') as any,
  },
  deleteModalContent: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#04140a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    padding: 18,
    alignItems: 'center',
    gap: 8,
    ...premiumShadow('#000000', 'lg') as any,
  },
  deleteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  deleteModalTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  deleteModalDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 17,
  },
  deleteModalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginTop: 10,
  },
  deleteConfirmBtn: {
    flex: 1,
    backgroundColor: '#dc2626',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#ffffff',
    marginBottom: 10,
  },
  formInputLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  formRow2: {
    flexDirection: 'row',
    gap: 10,
  },
  modalOptionPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  modalOptionPillActive: {
    backgroundColor: '#059669',
    borderColor: '#00ff87',
  },
  modalOptionPillText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  modalOptionPillTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelBtnLight: {
    backgroundColor: '#f1f5f9',
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  modalSubmitBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubmitBtnLight: {
    backgroundColor: '#16a34a',
  },
  modalSubmitBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  statusToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusToggleBarActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  statusToggleBarActiveLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.3)',
  },
  statusToggleBarInactive: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  statusToggleBarText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },

  /* Upgraded Large Modal & Seller Mode Styles */
  largeModalContent: {
    width: '100%',
    maxWidth: 860,
    maxHeight: '92%',
    backgroundColor: '#04140a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    overflow: 'hidden',
  },
  modalTabsBar: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  wizardTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  wizardTabPillActive: {
    backgroundColor: '#059669',
    borderColor: '#00ff87',
  },
  wizardTabPillActiveLight: {
    backgroundColor: '#16a34a',
    borderColor: '#15803d',
  },
  wizardTabPillText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  modalBodyScroll: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    maxHeight: 520,
  },
  formCardBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 14,
  },
  formCardBoxLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  cardSectionHeading: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  verifiedCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  verifiedCountText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#38bdf8',
  },
  selectedSellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 255, 135, 0.06)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    padding: 12,
    marginTop: 6,
    gap: 10,
  },
  selectedSellerCardLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  selectedStoreName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  selectedStoreSub: {
    fontSize: 11,
    marginTop: 2,
  },
  kycVerifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  kycVerifiedText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  sellerTypeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  sellerTypeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    textTransform: 'uppercase',
  },
  changeSellerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  changeSellerBtnLight: {
    backgroundColor: '#e0f2fe',
    borderColor: '#bae6fd',
  },
  changeSellerBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#38bdf8',
  },
  chooseSellerPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    marginTop: 6,
  },
  chooseSellerPromptLight: {
    backgroundColor: '#fffbeb',
    borderColor: '#f59e0b',
  },
  sellerPromptIconBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chooseSellerPromptTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  chooseSellerPromptSub: {
    fontSize: 11,
    marginTop: 2,
  },
  pickSellerActionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  pickSellerActionText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  discountPreviewBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    marginTop: 6,
  },
  discountPreviewText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  gstPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gstPillActive: {
    backgroundColor: '#059669',
    borderColor: '#00ff87',
  },
  gstPillText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  gstPillTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  formRow3: {
    flexDirection: 'row',
    gap: 8,
  },
  subLabel: {
    fontSize: 10,
    marginBottom: 3,
  },
  volumetricPreviewBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginTop: 8,
  },
  volumetricPreviewBoxLight: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  volumetricHeading: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  volumetricItem: {
    fontSize: 11,
  },
  samplePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  samplePhotoBtnLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  samplePhotoBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  photoPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  photoPreviewImg: {
    width: 48,
    height: 48,
    borderRadius: 6,
    backgroundColor: '#000000',
  },
  toggleSettingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  toggleSettingTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  toggleSettingDesc: {
    fontSize: 10.5,
    marginTop: 2,
  },
  modalNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalNavBtnLight: {
    backgroundColor: '#f1f5f9',
  },
  modalNavBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  sellerPickerModalContent: {
    width: '100%',
    maxWidth: 620,
    backgroundColor: '#04140a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    overflow: 'hidden',
  },
  sellerSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  sellerSearchInputWrapLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  sellerSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    padding: 0,
  },
  sellerPickerRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  sellerPickerRowItemSelected: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderColor: '#00ff87',
  },
  sellerPickerRowItemSelectedLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  pickerStoreName: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  pickerOwnerText: {
    fontSize: 11,
    marginTop: 2,
  },
  selectSellerRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectSellerRadioActive: {
    borderColor: '#10b981',
  },
  selectSellerRadioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
});
