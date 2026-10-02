import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useProducts } from '@/src/hooks/useProducts';
import { useCart } from '@/src/store/cart-context';
import { Product } from '@/src/types/api';

import { BrandLogo } from '@/src/components/BrandLogo';

const theme = RoleThemes.CUSTOMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function CategoriesScreen() {
  const { data: products, isLoading } = useProducts();
  const { addItem, items } = useCart();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(() => {
    const distinct = Array.from(new Set((products ?? []).map((p) => p.category).filter(Boolean))) as string[];
    return ['All', ...distinct];
  }, [products]);

  const filteredProducts = (products ?? []).filter((p) => activeCategory === 'All' || p.category === activeCategory);

  const cartQtyFor = (productId: string) => items.find((i) => i.productId === productId)?.quantity ?? 0;

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Shop</Text>
        <Text style={styles.heroSubtitle}>Browse everything your farm needs</Text>
      </LinearGradient>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ gap: 8, paddingHorizontal: SPACING.xxl }}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, activeCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => {
              tap();
              setActiveCategory(cat);
            }}
          >
            <Text style={[styles.filterChipText, activeCategory === cat && { color: '#ffffff' }]}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
          {filteredProducts.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="storefront-outline" size={40} color="#cbd5e1" />
              <Text style={styles.emptyText}>No products available right now.</Text>
            </View>
          ) : (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                cartQty={cartQtyFor(product.id)}
                onAdd={() =>
                  addItem({
                    productId: product.id,
                    name: product.name,
                    price: Number(product.price),
                    unit: product.unit,
                    imageUrl: product.imageUrl,
                  })
                }
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

function ProductCard({ product, cartQty, onAdd }: { product: Product; cartQty: number; onAdd: () => void }) {
  const outOfStock = product.stockQty <= 0;

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      {product.imageUrl ? (
        <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImage, styles.productImagePlaceholder]}>
          <BrandLogo size={36} />
        </View>
      )}
      <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
      <Text style={styles.productMeta}>₹{product.price} / {product.unit}</Text>

      <TouchableOpacity
        style={[styles.addBtn, outOfStock && { backgroundColor: '#e2e8f0' }]}
        activeOpacity={0.85}
        disabled={outOfStock}
        onPress={() => {
          tap();
          onAdd();
        }}
      >
        <Ionicons name={cartQty > 0 ? 'checkmark' : 'add'} size={14} color={outOfStock ? '#94a3b8' : '#ffffff'} />
        <Text style={[styles.addBtnText, outOfStock && { color: '#94a3b8' }]}>
          {outOfStock ? 'Out of Stock' : cartQty > 0 ? `In Cart (${cartQty})` : 'Add to Cart'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13.5, fontFamily: FONT.medium, marginTop: 2 },
  filterRow: { marginTop: 12, flexGrow: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  filterChipText: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
  grid: { padding: SPACING.xxl, flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  emptyCenter: { width: '100%', alignItems: 'center', justifyContent: 'center', padding: 50, gap: 8 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },
  card: { width: '47%', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 6 },
  productImage: { width: '100%', height: 90, borderRadius: RADIUS.md },
  productImagePlaceholder: { backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  productName: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a', minHeight: 32 },
  productMeta: { fontSize: 12, fontFamily: FONT.semiBold, color: theme.primary },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: theme.primary, paddingVertical: 8, borderRadius: RADIUS.md, marginTop: 2 },
  addBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
});
