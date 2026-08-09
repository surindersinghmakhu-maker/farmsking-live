import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

export const CustomerDashboardView: React.FC = () => {
  const theme = RoleThemes.CUSTOMER;
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="CUSTOMER"
        profileName="Aman Verma"
        subtitle="Happy Customer"
        avatarUrl="https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150"
      />

      <View style={styles.content}>
        {/* My Orders Card */}
        <LinearGradient colors={theme.heroGradient} style={[styles.ordersCard, premiumShadow(theme.primary, 'md')]}>
          <View style={styles.cardColLeft}>
            <Text style={styles.cardLabelText}>My Orders</Text>
            <Text style={styles.ordersCount}>3</Text>
            <Text style={[styles.ordersStatus, { color: theme.primary }]}>In Progress</Text>
          </View>
          <LinearGradient colors={theme.gradient} style={[styles.cartIconCircle, premiumShadow(theme.primary, 'sm')]}>
            <Ionicons name="cart-outline" size={28} color="#ffffff" />
          </LinearGradient>
        </LinearGradient>

        {/* Top Categories */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Categories</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text></TouchableOpacity>
          </View>

          <View style={styles.categoriesGrid}>
            {[
              { name: 'Seeds', icon: 'leaf-outline', bg: '#f0fdf4', color: '#166534' },
              { name: 'Fertilizers', icon: 'flask-outline', bg: theme.primaryLight, color: theme.primary },
              { name: 'Pesticides', icon: 'shield-outline', bg: '#fefce8', color: '#ca8a04' },
              { name: 'Tools', icon: 'build-outline', bg: '#fcf4ff', color: '#9333ea' },
              { name: 'More', icon: 'grid-outline', bg: '#f1f5f9', color: '#64748b' },
            ].map((cat, idx) => (
              <TouchableOpacity key={idx} style={styles.categoryItem} activeOpacity={0.7}>
                <View style={[styles.categoryIconBg, { backgroundColor: cat.bg }]}>
                  <Ionicons name={cat.icon as any} size={19} color={cat.color} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* My Orders Track List */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Orders</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text></TouchableOpacity>
          </View>

          {[
            { num: 'Order #ORD1234', desc: 'Marigold Seeds - 1kg', price: '₹450', status: 'In Transit', bg: '#dbeafe', color: '#1d4ed8' },
            { num: 'Order #ORD1235', desc: 'Organic Compost - 5kg', price: '₹350', status: 'Processing', bg: '#ffedd5', color: '#c2410c' },
            { num: 'Order #ORD1236', desc: 'Neem Oil - 1L', price: '₹280', status: 'Confirmed', bg: '#d1fae5', color: '#047857', last: true },
          ].map((ord, idx) => (
            <View key={idx} style={[styles.orderTrackItem, ord.last && { borderBottomWidth: 0 }]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.orderNum}>{ord.num}</Text>
                <Text style={styles.orderDesc}>{ord.desc}</Text>
              </View>
              <Text style={styles.orderPrice}>{ord.price}</Text>
              <View style={[styles.statusBadge, { backgroundColor: ord.bg }]}>
                <Text style={[styles.statusText, { color: ord.color }]}>{ord.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Recent Products Carousel */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Products</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text></TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.prodScroll}>
            {[
              { name: 'Marigold Seeds', price: '₹450', rating: '4.5', img: 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=200' },
              { name: 'Organic Compost', price: '₹350', rating: '4.4', img: 'https://images.unsplash.com/photo-1615811361523-6bd03d7748e7?w=200' },
              { name: 'Neem Oil', price: '₹280', rating: '4.4', img: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=200' },
            ].map((p, idx) => (
              <View key={idx} style={styles.productCard}>
                <Image source={{ uri: p.img }} style={styles.productImg} />
                <Text style={styles.productName}>{p.name}</Text>
                <View style={styles.prodPriceRow}>
                  <Text style={[styles.productPrice, { color: theme.primary }]}>{p.price}</Text>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={12} color="#f59e0b" />
                    <Text style={styles.ratingText}>{p.rating}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Support Grid */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Support</Text>
          <View style={styles.supportGrid}>
            {[
              { label: 'Track Order', icon: 'map-outline', href: '/(tabs)/orders' },
              { label: 'My Addresses', icon: 'location-outline', href: '/profile' },
              { label: 'Contact Us', icon: 'chatbubbles-outline' },
              { label: 'Help Center', icon: 'help-circle-outline' },
            ].map((s, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.supportBtn}
                activeOpacity={0.7}
                onPress={() => 'href' in s && s.href && router.push(s.href as any)}
              >
                <Ionicons name={s.icon as any} size={20} color={theme.primary} />
                <Text style={styles.supportLabel}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  ordersCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardColLeft: { flex: 1 },
  cardLabelText: { fontSize: 13.5, color: '#64748b', fontFamily: FONT.semiBold },
  ordersCount: { fontSize: 36, fontFamily: FONT.extraBold, color: '#0f172a', marginVertical: 2, letterSpacing: -0.6 },
  ordersStatus: { fontSize: 13, fontFamily: FONT.bold },
  cartIconCircle: { width: 68, height: 68, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold },
  categoriesGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  categoryItem: { alignItems: 'center', gap: 6 },
  categoryIconBg: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  categoryName: { fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' },
  orderTrackItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', gap: 8 },
  orderNum: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  orderDesc: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  orderPrice: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  statusText: { fontSize: 10.5, fontFamily: FONT.bold },
  prodScroll: { gap: 12 },
  productCard: { width: 124, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, padding: 8 },
  productImg: { width: '100%', height: 80, borderRadius: 10 },
  productName: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', marginTop: 7 },
  prodPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  productPrice: { fontSize: 12, fontFamily: FONT.bold },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  ratingText: { fontSize: 10, color: '#64748b', fontFamily: FONT.medium },
  supportGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  supportBtn: { flex: 1, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 6 },
  supportLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' },
});
