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

const theme = RoleThemes.ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function AdminProductsScreen() {
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
    <View style={styles.container}>
      {/* Header Banner */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <View>
            <View style={styles.badgeRow}>
              <View style={styles.multiSellerTag}>
                <Ionicons name="storefront" size={12} color="#00ff87" />
                <Text style={styles.multiSellerTagText}>MULTI-SELLER MARKETPLACE</Text>
              </View>
            </View>
            <Text style={styles.heroTitle}>🛒 Seller Products & Moderation</Text>
            <Text style={styles.heroSubtitle}>
              Inspect, approve, feature, or deactivate product listings submitted by registered marketplace sellers.
            </Text>
          </View>
        </View>

        {/* Analytics Summary Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{totalCount}</Text>
            <Text style={styles.statLbl}>Total Listings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#00ff87' }]}>{activeCount}</Text>
            <Text style={styles.statLbl}>Active Approved</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#ef4444' }]}>{deactivatedCount}</Text>
            <Text style={styles.statLbl}>Deactivated / Hold</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statVal, { color: '#38bdf8' }]}>5% Avg</Text>
            <Text style={styles.statLbl}>Commission</Text>
          </View>
        </View>
      </View>

      {/* Filter & Search Bar */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by product name, category, or seller..."
            placeholderTextColor="#64748b"
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
                style={[styles.chip, isSel && styles.chipActive]}
                onPress={() => {
                  tap();
                  setFilter(chip.id as any);
                }}
              >
                <Text style={[styles.chipText, isSel && styles.chipTextActive]}>{chip.label}</Text>
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
            <Text style={styles.emptyTitle}>No seller listings found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try changing your search terms.' : 'Sellers will appear here when they upload products via their Seller Portal.'}
            </Text>
          </View>
        ) : (
          filteredProducts.map((p, index) => {
            const seller = getProductSellerInfo(p, index);
            const isLowStock = p.stockQty > 0 && p.stockQty < 5;
            const isOutOfStock = p.stockQty <= 0;

            return (
              <View key={p.id} style={[styles.card, premiumShadow('#000', 'sm'), !p.isActive && styles.cardInactive]}>
                {/* Top Seller Header */}
                <View style={styles.sellerHeader}>
                  <View style={styles.sellerLeft}>
                    <View style={styles.sellerAvatar}>
                      <Ionicons name="storefront" size={14} color="#00ff87" />
                    </View>
                    <View>
                      <Text style={styles.sellerName}>{seller.name}</Text>
                      <Text style={styles.sellerShop}>{seller.shop} • ⭐ {seller.rating}</Text>
                    </View>
                  </View>
                  <View style={styles.commissionBadge}>
                    <Text style={styles.commissionText}>Commission: {seller.commission}</Text>
                  </View>
                </View>

                {/* Product Content */}
                <View style={styles.productBody}>
                  <View style={styles.productIconBox}>
                    <Ionicons name="bag-handle" size={22} color="#00ff87" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={styles.productName}>{p.name}</Text>
                      {p.category ? (
                        <View style={styles.catBadge}>
                          <Text style={styles.catText}>{p.category}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.productPrice}>
                      ₹{p.price} <Text style={styles.unitText}>/ {p.unit}</Text> • Stock: {p.stockQty}
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

