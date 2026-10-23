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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
  'Seeds',
  'Pesticides',
  'Organic Bio',
  'Garden Tools',
  'Irrigation',
  'Other',
];

const UNIT_OPTIONS = ['piece', 'kg', 'litre', 'bag', 'packet', 'quintal', 'box'];

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

  // New Product Form State
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Fertilizers');
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('50');
  const [newUnit, setNewUnit] = useState('kg');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newDescription, setNewDescription] = useState('');

  // Edit Product Form State
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editIsActive, setEditIsActive] = useState(true);

  // Seller Mock Helper (if store details not on product)
  const getProductSellerInfo = (p: Product, index: number) => {
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

  // Submit Create Product
  const handleCreateProduct = async () => {
    if (!newName.trim()) return;
    const priceNum = parseFloat(newPrice) || 100;
    const stockNum = parseInt(newStock, 10) || 10;
    const createdName = newName.trim();

    await createProduct.mutateAsync({
      name: createdName,
      category: newCategory,
      price: priceNum,
      stockQty: stockNum,
      unit: newUnit,
      description: newDescription.trim() || undefined,
      imageUrl: newImageUrl.trim() || undefined,
    });

    showAdminToast(
      'SUCCESS',
      'Product Listed',
      `${createdName} has been published to the store.`
    );

    // Reset Form
    setNewName('');
    setNewPrice('');
    setNewStock('50');
    setNewDescription('');
    setNewImageUrl('');
    setShowAddModal(false);
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

      {/* ➕ Quick Add Product Modal */}
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
              styles.modalContent,
              isLight && { backgroundColor: '#ffffff' },
              isDarkTheme && { backgroundColor: '#020b06', borderColor: 'rgba(56, 189, 248, 0.3)' },
            ]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.modalIconWrap, isLight && { backgroundColor: '#f0fdf4' }]}>
                  <Ionicons name="add-circle" size={20} color={isLight ? '#16a34a' : '#00ff87'} />
                </View>
                <Text style={[styles.modalTitle, { color: textColor }]}>Add New Product</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* Product Name */}
              <Text style={[styles.inputLabel, { color: textColor }]}>Product Name *</Text>
              <TextInput
                style={[
                  styles.formInput,
                  isLight && styles.formInputLight,
                  { color: textColor },
                ]}
                placeholder="e.g. Bio-Potash Granules 50kg"
                placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                value={newName}
                onChangeText={setNewName}
              />

              {/* Category Picker */}
              <Text style={[styles.inputLabel, { color: textColor }]}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, marginBottom: 12 }}
              >
                {CATEGORY_OPTIONS.filter((c) => c !== 'All').map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.modalOptionPill,
                      newCategory === cat && styles.modalOptionPillActive,
                      isLight && newCategory !== cat && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                    ]}
                    onPress={() => setNewCategory(cat)}
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

              {/* Price & Stock Row */}
              <View style={styles.formRow2}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Price (₹) *</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      isLight && styles.formInputLight,
                      { color: textColor },
                    ]}
                    placeholder="450"
                    placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                    keyboardType="numeric"
                    value={newPrice}
                    onChangeText={setNewPrice}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Stock Qty *</Text>
                  <TextInput
                    style={[
                      styles.formInput,
                      isLight && styles.formInputLight,
                      { color: textColor },
                    ]}
                    placeholder="50"
                    placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                    keyboardType="numeric"
                    value={newStock}
                    onChangeText={setNewStock}
                  />
                </View>
              </View>

              {/* Unit Selection */}
              <Text style={[styles.inputLabel, { color: textColor }]}>Unit of Measure</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, marginBottom: 12 }}
              >
                {UNIT_OPTIONS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[
                      styles.modalOptionPill,
                      newUnit === u && styles.modalOptionPillActive,
                      isLight && newUnit !== u && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                    ]}
                    onPress={() => setNewUnit(u)}
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

              {/* Image URL */}
              <Text style={[styles.inputLabel, { color: textColor }]}>Image URL (Optional)</Text>
              <TextInput
                style={[
                  styles.formInput,
                  isLight && styles.formInputLight,
                  { color: textColor },
                ]}
                placeholder="https://images.unsplash.com/..."
                placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                value={newImageUrl}
                onChangeText={setNewImageUrl}
              />

              {/* Description */}
              <Text style={[styles.inputLabel, { color: textColor }]}>Short Description</Text>
              <TextInput
                style={[
                  styles.formInput,
                  isLight && styles.formInputLight,
                  { color: textColor, height: 60 },
                ]}
                placeholder="High-grade agricultural input..."
                placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                multiline
                value={newDescription}
                onChangeText={setNewDescription}
              />
            </ScrollView>

            {/* Modal Actions */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, isLight && styles.modalCancelBtnLight]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={[styles.modalCancelBtnText, isLight && { color: '#64748b' }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, isLight && styles.modalSubmitBtnLight]}
                onPress={handleCreateProduct}
                disabled={createProduct.isPending || !newName.trim()}
              >
                {createProduct.isPending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Create Listing</Text>
                )}
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
    gap: 6,
  },
  metricPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
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
    paddingHorizontal: 9,
    paddingVertical: 5,
    gap: 6,
    height: 32,
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
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: Platform.OS === 'web' ? 16 : 24,
    gap: 6,
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
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.18)',
    padding: 8,
    gap: 6,
  },
  productCardInactive: {
    opacity: 0.72,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  thumbnailBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
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
    gap: 3.5,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
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
    gap: 5,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 5,
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
});
