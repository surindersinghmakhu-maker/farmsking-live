import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useProducts } from '@/src/hooks/useProducts';
import { formatInr } from '@/src/utils/formatInr';

type SortMode = 'RECENT' | 'CATEGORY' | 'PRICE_LOW' | 'PRICE_HIGH';

const SORT_OPTIONS: { key: SortMode; label: string }[] = [
  { key: 'RECENT', label: 'Recently Added' },
  { key: 'CATEGORY', label: 'Category' },
  { key: 'PRICE_LOW', label: 'Price: Low to High' },
  { key: 'PRICE_HIGH', label: 'Price: High to Low' },
];

const PAGE_SIZE = 30;

export const CustomerDashboardView: React.FC = () => {
  const theme = RoleThemes.CUSTOMER;
  const router = useRouter();
  const { user } = useAuth();
  const { data: products } = useProducts();
  const [sortMode, setSortMode] = useState<SortMode>('RECENT');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const activeProducts = useMemo(() => (products ?? []).filter((p) => p.isActive), [products]);

  const sortedProducts = useMemo(() => {
    const list = [...activeProducts];
    switch (sortMode) {
      case 'CATEGORY':
        return list.sort((a, b) => (a.category ?? '').localeCompare(b.category ?? '') || a.name.localeCompare(b.name));
      case 'PRICE_LOW':
        return list.sort((a, b) => Number(a.price) - Number(b.price));
      case 'PRICE_HIGH':
        return list.sort((a, b) => Number(b.price) - Number(a.price));
      case 'RECENT':
      default:
        return list;
    }
  }, [activeProducts, sortMode]);

  const visibleProducts = sortedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < sortedProducts.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="CUSTOMER"
        profileName={user?.name || 'Customer'}
        subtitle="Happy Customer"
        avatarUrl={user?.photoUrl || 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150'}
      />

      <View style={styles.content}>
        {/* Products */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>All Products</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(tabs)/shop')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>Open Shop</Text>
            </TouchableOpacity>
          </View>

          {activeProducts.length === 0 ? (
            <Text style={styles.emptyText}>No products available yet.</Text>
          ) : (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
                {SORT_OPTIONS.map((opt) => {
                  const isActive = sortMode === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.sortChip, isActive && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        setSortMode(opt.key);
                        setVisibleCount(PAGE_SIZE);
                      }}
                    >
                      <Text style={[styles.sortChipText, isActive && { color: '#ffffff' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <View style={styles.productGrid}>
                {visibleProducts.map((p) => (
                  <TouchableOpacity key={p.id} style={styles.productCard} activeOpacity={0.8} onPress={() => router.push('/(tabs)/shop')}>
                    {p.imageUrl ? (
                      <Image source={{ uri: p.imageUrl }} style={styles.productImg} />
                    ) : (
                      <View style={[styles.productImg, styles.productImgFallback]}>
                        <Ionicons name="leaf-outline" size={26} color="#94a3b8" />
                      </View>
                    )}
                    <Text style={styles.productName} numberOfLines={1}>{p.name}</Text>
                    {p.category ? <Text style={styles.productCategory} numberOfLines={1}>{p.category}</Text> : null}
                    <Text style={[styles.productPrice, { color: theme.primary }]}>{formatInr(Number(p.price))}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {hasMore ? (
                <TouchableOpacity
                  style={[styles.showMoreBtn, { borderColor: theme.primary }]}
                  activeOpacity={0.8}
                  onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  <Text style={[styles.showMoreText, { color: theme.primary }]}>Show More</Text>
                  <Ionicons name="chevron-down" size={15} color={theme.primary} />
                </TouchableOpacity>
              ) : null}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8' },
  sortRow: { gap: 8, paddingBottom: 12 },
  sortChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  sortChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  productCard: { width: '31%', backgroundColor: '#f8fafc', borderRadius: RADIUS.md, padding: 8, gap: 3 },
  productImg: { width: '100%', height: 74, borderRadius: RADIUS.sm },
  productImgFallback: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' },
  productName: { fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' },
  productCategory: { fontSize: 9.5, fontFamily: FONT.medium, color: '#94a3b8' },
  productPrice: { fontSize: 12, fontFamily: FONT.extraBold },
  showMoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1.5, borderRadius: RADIUS.md, paddingVertical: 10, marginTop: 14 },
  showMoreText: { fontSize: 12.5, fontFamily: FONT.bold },
});
