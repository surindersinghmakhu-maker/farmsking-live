import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { Product } from '@/src/types/api';
import { useProducts, useRemoveProduct, useUpdateProduct } from '@/src/hooks/useProducts';
import { useExecutiveTheme } from '@/src/store/theme-context';

const theme = RoleThemes.ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function AdminProductsScreen() {
  const { colors, isLight, isMedium, textColor, subTextColor, cardBg, cardBorder } = useExecutiveTheme();
  const { data: products, isLoading: isLoadingProducts } = useProducts(true);
  const updateProduct = useUpdateProduct();
  const removeProduct = useRemoveProduct();

  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'DEACTIVATED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Mock sample seller product attributes for rich multi-seller UI demonstration
  const getProductSellerInfo = (p: Product, index: number) => {
    const sellers = [
      { name: 'Punjab Agri Traders', shop: 'Shop #12, Ludhiana Mandi', rating: 4.8, commission: '5%' },
      { name: 'Malwa Seed Suppliers', shop: 'G.T. Road, Bathinda', rating: 4.6, commission: '4%' },
      { name: 'Doaba Fertilizer Hub', shop: 'Jalandhar Bypass', rating: 4.9, commission: '6%' },
      { name: 'Green Field Kisan Store', shop: 'Moga Main Market', rating: 4.7, commission: '5%' },
    ];
    return sellers[index % sellers.length];
  };

  const filteredProducts = (products || []).filter((p, index) => {
    const sellerInfo = getProductSellerInfo(p, index);
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
      sellerInfo.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'ACTIVE') return p.isActive;
    if (filter === 'DEACTIVATED') return !p.isActive;
    if (filter === 'PENDING') return p.stockQty === 0 || !p.isActive;
    return true;
  });

  const totalCount = products?.length || 0;
  const activeCount = products?.filter((p) => p.isActive).length || 0;
  const deactivatedCount = products?.filter((p) => !p.isActive).length || 0;

  const handleToggleStatus = (p: Product) => {
    tap();
    updateProduct.mutate({
      id: p.id,
      payload: { isActive: !p.isActive },
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Header Banner */}
      <View
        style={[
          styles.hero,
          isLight && { backgroundColor: '#ffffff', borderBottomColor: '#e2e8f0' },
          isMedium && { backgroundColor: 'rgba(6, 26, 30, 0.85)', borderBottomColor: 'rgba(34, 197, 94, 0.25)' },
        ]}
      >
        <View style={styles.heroTopRow}>
          <View>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.multiSellerTag,
                  isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' },
                  isMedium && { backgroundColor: 'rgba(34, 197, 94, 0.15)', borderColor: '#fbbf24' },
                ]}
              >
                <Ionicons name="storefront" size={12} color={isLight ? '#16a34a' : isMedium ? '#22c55e' : '#00ff87'} />
                <Text style={[styles.multiSellerTagText, isLight && { color: '#16a34a' }, isMedium && { color: '#fbbf24' }]}>
                  MULTI-SELLER MARKETPLACE
                </Text>
              </View>
            </View>
            <Text style={[styles.heroTitle, { color: textColor }]}>🛒 Seller Products & Moderation</Text>
            <Text style={[styles.heroSubtitle, { color: subTextColor }]}>
              Inspect, approve, feature, or deactivate product listings submitted by registered marketplace sellers.
            </Text>
          </View>
        </View>

        {/* Analytics Summary Stats */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
              isMedium && { backgroundColor: 'rgba(6, 26, 30, 0.8)', borderColor: 'rgba(34, 197, 94, 0.25)' },
            ]}
          >
            <Text style={[styles.statVal, { color: textColor }]}>{totalCount}</Text>
            <Text style={[styles.statLbl, { color: subTextColor }]}>Total Listings</Text>
          </View>
          <View
            style={[
              styles.statCard,
              isLight && { backgroundColor: '#f0fdf4', borderColor: 'rgba(22, 163, 74, 0.25)' },
              isMedium && { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: 'rgba(34, 197, 94, 0.4)' },
            ]}
          >
            <Text style={[styles.statVal, { color: isLight ? '#16a34a' : isMedium ? '#22c55e' : '#00ff87' }]}>{activeCount}</Text>
            <Text style={[styles.statLbl, { color: subTextColor }]}>Active Approved</Text>
          </View>
          <View
            style={[
              styles.statCard,
              isLight && { backgroundColor: '#fef2f2', borderColor: 'rgba(239, 68, 68, 0.2)' },
              isMedium && { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.3)' },
            ]}
          >
            <Text style={[styles.statVal, { color: '#ef4444' }]}>{deactivatedCount}</Text>
            <Text style={[styles.statLbl, { color: subTextColor }]}>Deactivated / Hold</Text>
          </View>
          <View
            style={[
              styles.statCard,
              isLight && { backgroundColor: '#fefce8', borderColor: 'rgba(245, 158, 11, 0.25)' },
              isMedium && { backgroundColor: 'rgba(251, 191, 36, 0.1)', borderColor: 'rgba(251, 191, 36, 0.35)' },
            ]}
          >
            <Text style={[styles.statVal, { color: isLight ? '#d97706' : isMedium ? '#fbbf24' : '#38bdf8' }]}>5% Avg</Text>
            <Text style={[styles.statLbl, { color: subTextColor }]}>Commission</Text>
          </View>
        </View>
      </View>

      {/* Filter & Search Bar */}
      <View style={styles.filterSection}>
        <View
          style={[
            styles.searchBar,
            isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
            isMedium && { backgroundColor: 'rgba(6, 26, 30, 0.85)', borderColor: 'rgba(34, 197, 94, 0.35)' },
          ]}
        >
          <Ionicons name="search" size={16} color={isLight ? '#64748b' : isMedium ? '#22c55e' : '#94a3b8'} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search by product name, category, or seller..."
            placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {[
            { id: 'ALL', label: `All (${totalCount})` },
            { id: 'ACTIVE', label: `Active (${activeCount})` },
            { id: 'DEACTIVATED', label: `Deactivated (${deactivatedCount})` },
          ].map((chip) => {
            const isSel = filter === chip.id;
            return (
              <TouchableOpacity
                key={chip.id}
                style={[
                  styles.chip,
                  isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
                  isMedium && { backgroundColor: 'rgba(6, 26, 30, 0.8)', borderColor: 'rgba(34, 197, 94, 0.25)' },
                  isSel && (
                    isLight
                      ? { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }
                      : isMedium
                      ? { backgroundColor: 'rgba(34, 197, 94, 0.2)', borderColor: '#fbbf24' }
                      : styles.chipActive
                  ),
                ]}
                onPress={() => {
                  tap();
                  setFilter(chip.id as any);
                }}
              >
                <Text
                  style={[
                    styles.chipText,
                    isLight && { color: '#64748b' },
                    isSel && (
                      isLight
                        ? { color: '#16a34a', fontFamily: FONT.bold }
                        : isMedium
                        ? { color: '#fbbf24', fontFamily: FONT.bold }
                        : styles.chipTextActive
                    ),
                  ]}
                >
                  {chip.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Product List */}
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {isLoadingProducts ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 40 }} />
        ) : filteredProducts.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="cube-outline" size={48} color="#475569" />
            <Text style={[styles.emptyTitle, { color: textColor }]}>No seller listings found</Text>
            <Text style={[styles.emptySubtitle, { color: subTextColor }]}>
              {searchQuery ? 'Try changing your search terms.' : 'Sellers will appear here when they upload products via their Seller Portal.'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((p, index) => {
            const seller = getProductSellerInfo(p, index);
            const isLowStock = p.stockQty > 0 && p.stockQty < 5;
            const isOutOfStock = p.stockQty <= 0;

            return (
              <View
                key={p.id}
                style={[
                  styles.card,
                  isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
                  isMedium && { backgroundColor: 'rgba(6, 26, 30, 0.82)', borderColor: 'rgba(34, 197, 94, 0.3)' },
                  premiumShadow('#000', 'sm'),
                  !p.isActive && styles.cardInactive,
                ]}
              >
                {/* Top Seller Header */}
                <View style={styles.sellerHeader}>
                  <View style={styles.sellerLeft}>
                    <View
                      style={[
                        styles.sellerAvatar,
                        isMedium && { backgroundColor: 'rgba(34, 197, 94, 0.2)' },
                      ]}
                    >
                      <Ionicons name="storefront" size={14} color={isLight ? '#16a34a' : isMedium ? '#22c55e' : '#00ff87'} />
                    </View>
                    <View>
                      <Text style={[styles.sellerName, { color: textColor }]}>{seller.name}</Text>
                      <Text style={[styles.sellerShop, { color: subTextColor }]}>{seller.shop} • ⭐ {seller.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.commissionBadge}>
                    <Text style={[styles.commissionText, isMedium && { color: '#fbbf24' }]}>Commission: {seller.commission}</Text>
                  </View>
                </View>

                {/* Product Content */}
                <View style={styles.productBody}>
                  <View
                    style={[
                      styles.productIconBox,
                      isMedium && { backgroundColor: 'rgba(34, 197, 94, 0.15)' },
                    ]}
                  >
                    <Ionicons name="bag-handle" size={22} color={isLight ? '#16a34a' : isMedium ? '#22c55e' : '#00ff87'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.productName, { color: textColor }]}>{p.name}</Text>
                      {p.category ? (
                        <View style={styles.catBadge}>
                          <Text style={styles.catText}>{p.category}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[styles.productPrice, { color: isLight ? '#16a34a' : isMedium ? '#fbbf24' : '#00ff87' }]}>
                      ₹{p.price} <Text style={[styles.unitText, { color: subTextColor }]}>/ {p.unit}</Text> • Stock: {p.stockQty}
                    </Text>
                  </View>
                </View>

                {/* Status & Actions Footer */}
                <View style={styles.cardFooter}>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: !p.isActive
                          ? 'rgba(239, 68, 68, 0.15)'
                          : isOutOfStock
                          ? 'rgba(245, 158, 11, 0.15)'
                          : 'rgba(0, 255, 135, 0.15)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dot,
                        {
                          backgroundColor: !p.isActive
                            ? '#ef4444'
                            : isOutOfStock
                            ? '#f59e0b'
                            : '#00ff87',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: !p.isActive
                            ? '#f87171'
                            : isOutOfStock
                            ? '#fbbf24'
                            : '#00ff87',
                        },
                      ]}
                    >
                      {!p.isActive ? 'Deactivated' : isOutOfStock ? 'Out of Stock' : 'Approved Listing'}
                    </Text>
                  </View>

                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.actionBtn,
                        { backgroundColor: p.isActive ? 'rgba(239, 68, 68, 0.2)' : 'rgba(0, 255, 135, 0.2)' },
                      ]}
                      onPress={() => handleToggleStatus(p)}
                    >
                      <Ionicons
                        name={p.isActive ? 'pause-circle-outline' : 'checkmark-circle-outline'}
                        size={15}
                        color={p.isActive ? '#ef4444' : '#00ff87'}
                      />
                      <Text
                        style={[
                          styles.actionBtnText,
                          { color: p.isActive ? '#f87171' : '#00ff87' },
                        ]}
                      >
                        {p.isActive ? 'Deactivate' : 'Approve'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => {
                        tap();
                        removeProduct.mutate(p.id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={15} color="#cbd5e1" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#020d06' },
  hero: {
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#05180c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,255,135,0.15)',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  badgeRow: { flexDirection: 'row', marginBottom: 6 },
  multiSellerTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,255,135,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  multiSellerTagText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#00ff87', letterSpacing: 0.5 },
  heroTitle: { fontSize: 20, fontFamily: FONT.extraBold, color: '#ffffff' },
  heroSubtitle: { fontSize: 12, color: '#94a3b8', fontFamily: FONT.medium, marginTop: 4, maxWidth: 540 },
  statsGrid: { flexDirection: 'row', gap: 10, marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(0,255,135,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.15)',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statVal: { fontSize: 16, fontFamily: FONT.extraBold, color: '#ffffff' },
  statLbl: { fontSize: 10, color: '#64748b', fontFamily: FONT.bold, marginTop: 2 },
  filterSection: { paddingHorizontal: SPACING.lg, paddingTop: 12, paddingBottom: 6, gap: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.2)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 13, fontFamily: FONT.medium },
  chipsRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#05180c',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  chipActive: { backgroundColor: 'rgba(0,255,135,0.15)', borderColor: '#00ff87' },
  chipText: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8' },
  chipTextActive: { color: '#00ff87', fontFamily: FONT.bold },
  list: { padding: SPACING.lg, gap: 14, paddingBottom: 40 },
  emptyBox: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: 10 },
  emptyTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
  emptySubtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', maxWidth: 300, fontFamily: FONT.medium },
  card: {
    backgroundColor: '#05180c',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,255,135,0.2)',
    padding: SPACING.md,
    gap: 12,
  },
  cardInactive: { opacity: 0.65, borderColor: 'rgba(239, 68, 68, 0.3)' },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 8,
  },
  sellerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sellerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,255,135,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },
  sellerShop: { fontSize: 10.5, color: '#64748b', fontFamily: FONT.medium },
  commissionBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  commissionText: { fontSize: 10, fontFamily: FONT.bold, color: '#38bdf8' },
  productBody: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  productIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(0,255,135,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  productName: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  catBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catText: { fontSize: 10, fontFamily: FONT.medium, color: '#cbd5e1' },
  productPrice: { fontSize: 12.5, fontFamily: FONT.bold, color: '#00ff87', marginTop: 3 },
  unitText: { color: '#64748b', fontSize: 11, fontFamily: FONT.medium },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  dot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: FONT.bold },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md },
  actionBtnText: { fontSize: 11, fontFamily: FONT.bold },
  deleteBtn: { padding: 6 },
});

