import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, useWindowDimensions, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/src/hooks/useProducts';
import { FONT, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';
import { useAuth } from '@/src/store/auth-context';

const getTopicDetails = (id: string) => {
  switch(id) {
    case 'Farming':
      return {
        subtitle: 'Empowering farmers with modern tools, high-yield seeds, and expert advisory.',
        details: 'FarmsKing provides a complete end-to-end ecosystem for farmers. From advanced crop intelligence to the highest quality natural seeds and fertilizers, we aim to maximize your yield and profit. Join thousands of progressive farmers revolutionizing Indian agriculture.',
        features: ['High-Yield Seeds', 'Modern Farm Machinery', 'Expert Crop Advisory']
      };
    case 'Gardening':
      return {
        subtitle: 'Everything you need to build and maintain a beautiful, blooming garden.',
        details: 'Whether you are a hobbyist or a professional landscaper, our gardening section brings you the finest tools, organic composts, and exotic seeds. Grow your own organic vegetables or create stunning floral landscapes effortlessly with our premium supplies.',
        features: ['Organic Composts', 'Premium Garden Tools', 'Exotic Plant Seeds']
      };
    case 'Crop Doctors':
      return {
        subtitle: 'Instant diagnosis and expert solutions for all your crop diseases.',
        details: 'Our Kisan Crop Intelligence Engine and expert agronomists are available 24/7. Upload a picture of your infected crop, and get immediate recommendations on the exact crop protection chemicals and dosages required to save your harvest.',
        features: ['AI Crop Disease Detection', 'Expert Agronomists', 'Precise Chemical Dosages']
      };
    case 'Agri Store':
      return {
        subtitle: 'Your one-stop destination for genuine, lab-tested agricultural products.',
        details: 'Shop from a wide range of verified crop protection chemicals, fertilizers, and farm equipment. We guarantee 100% original products delivered directly to your farm, eliminating middlemen and ensuring the best market prices.',
        features: ['100% Genuine Products', 'Direct Farm Delivery', 'Best Market Prices']
      };
    default:
      return {
        subtitle: `Discover everything you need about ${id ? id.replace('-', ' ') : 'Topic'} sourced directly from our platform.`,
        details: 'Explore our vast catalogue of verified agricultural products and services tailored for your specific needs.',
        features: []
      };
  }
};

export default function TopicPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { user } = useAuth();

  // Fetch data (super admin products)
  const { data: products, isLoading } = useProducts(true);

  const title = id ? id.replace('-', ' ') : 'Topic';
  const topicDetails = getTopicDetails(id || '');

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

  return (
    <View style={styles.container}>
      {/* 100% RESPONSIVE FULL SCREEN BACKGROUND */}
      <Image 
        source={require('@/assets/images/farmsking_clean_bg.png')} 
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]} 
        resizeMode="cover" 
      />
      {/* Dark overlay for readability */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.75)' }]} />

      {/* PUBLIC FLOATING HEADER */}
      <PublicHeader />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerArea}>
          <Text style={styles.pageTitle}>{title}</Text>
          <Text style={styles.pageSubtitle}>{topicDetails.subtitle}</Text>
          
          <View style={styles.detailsCard}>
            <Text style={styles.detailsText}>{topicDetails.details}</Text>
            
            {topicDetails.features.length > 0 && (
              <View style={styles.featuresList}>
                {topicDetails.features.map((feat, idx) => (
                  <View key={idx} style={styles.featureItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                    <Text style={styles.featureText}>{feat}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          <TouchableOpacity 
            style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}
            onPress={() => router.push('/')}
          >
            <Ionicons name="home-outline" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontFamily: FONT.bold, fontSize: 14 }}>Go Home</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.gridContainer}>
            {filteredProducts.map(product => (
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
            ))}
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
  detailsCard: {
    marginTop: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxWidth: 800,
    width: '100%',
  },
  detailsText: {
    fontSize: 15,
    color: '#f8fafc',
    fontFamily: FONT.regular,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 20,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  featureText: {
    color: '#10b981',
    fontFamily: FONT.bold,
    fontSize: 13,
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
