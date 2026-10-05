import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/src/hooks/useProducts';
import { FONT, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';
import { useAuth } from '@/src/store/auth-context';

export default function TopicPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { user } = useAuth();

  // Fetch data (super admin products)
  const { data: products, isLoading } = useProducts(true);

  // Filter products based on topic (e.g. if id="Farming", show Natural Farmer Foods or Farming tools)
  const filteredProducts = React.useMemo(() => {
    if (!products) return [];
    if (id === 'Farming') {
      return products.filter(p => p.category === 'Natural Farmer Foods' || p.category?.includes('Farm'));
    }
    if (id === 'Market' || id === 'Gardening') {
      return products.filter(p => p.category?.includes('Garden') || p.category?.includes('Tool'));
    }
    if (id === 'Farmer Stores') {
      return products;
    }
    return products;
  }, [products, id]);

  const title = id ? id.replace('-', ' ') : 'Topic';

  return (
    <View style={styles.container}>
      {/* 100% RESPONSIVE FULL SCREEN BACKGROUND */}
      <Image 
        source={require('@/assets/images/farmsking_clean_bg.png')} 
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} 
        resizeMode="cover" 
      />
      {/* Dark overlay for readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.65)' }]} />

      {/* PUBLIC FLOATING HEADER */}
      <PublicHeader />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerArea}>
          <Text style={styles.pageTitle}>{title}</Text>
          <Text style={styles.pageSubtitle}>Discover everything you need about {title} sourced directly from our platform.</Text>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.gridContainer}>
            {filteredProducts.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="leaf-outline" size={48} color="#10b981" />
                <Text style={styles.emptyText}>No products found for {title}.</Text>
                <TouchableOpacity style={styles.storeBtn} onPress={() => router.push('/shop')}>
                  <Text style={styles.storeBtnText}>Go to Main Store</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredProducts.map(product => (
                <View key={product.id} style={styles.productCard}>
                  {product.images && product.images[0] ? (
                    <Image source={{ uri: product.images[0] }} style={styles.productImage} />
                  ) : (
                    <View style={[styles.productImage, { backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="image-outline" size={32} color="#94a3b8" />
                    </View>
                  )}
                  <View style={styles.productInfo}>
                    <Text style={styles.productName} numberOfLines={1}>{product.name}</Text>
                    <Text style={styles.productCategory}>{product.category}</Text>
                    <Text style={styles.productPrice}>₹{product.price}</Text>
                    <TouchableOpacity 
                      style={styles.buyBtn} 
                      onPress={() => router.push('/shop')}
                    >
                      <Text style={styles.buyBtnText}>View in Store</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a1912' },
  floatingHeader: {
    alignSelf: 'center',
    position: 'absolute',
    top: 20,
    width: '90%', maxWidth: 1200, height: 70, backgroundColor: 'rgba(20, 30, 45, 0.75)',
    borderRadius: 35, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, zIndex: 100,
    ...premiumShadow('rgba(0,0,0,0.5)', 'lg'),
  },
  floatingHeaderMobile: { width: '95%', height: 60, top: 10, borderRadius: 30, paddingHorizontal: 15 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 24, fontFamily: FONT.extraBold, color: '#fff', letterSpacing: 0.5 },
  navLinks: { flexDirection: 'row', gap: 16, alignItems: 'center' },
  navLink: { fontSize: 16, fontFamily: FONT.bold, color: '#e2e8f0' },
  loginBtn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  loginBtnText: { color: '#fff', fontSize: 15, fontFamily: FONT.bold },
  
  scrollContent: {
    paddingTop: 120,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  headerArea: {
    alignItems: 'center',
    marginBottom: 40,
  },
  pageTitle: {
    fontSize: 40,
    fontFamily: FONT.extraBold,
    color: '#10b981',
    marginBottom: 10,
    textTransform: 'capitalize',
  },
  pageSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    fontFamily: FONT.medium,
    textAlign: 'center',
    maxWidth: 600,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  emptyText: { color: '#fff', fontSize: 18, marginTop: 16, fontFamily: FONT.medium, marginBottom: 20 },
  storeBtn: { backgroundColor: '#10b981', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  storeBtnText: { color: '#fff', fontSize: 15, fontFamily: FONT.bold },
  productCard: {
    width: 280,
    backgroundColor: 'rgba(20, 30, 45, 0.7)',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    ...premiumShadow('rgba(0,0,0,0.5)', 'md'),
  },
  productImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  productInfo: {
    padding: 16,
  },
  productName: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#fff',
    marginBottom: 4,
  },
  productCategory: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: FONT.medium,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 20,
    color: '#f59e0b',
    fontFamily: FONT.extraBold,
    marginBottom: 16,
  },
  buyBtn: {
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyBtnText: {
    color: '#fff',
    fontFamily: FONT.bold,
    fontSize: 14,
  }
});
