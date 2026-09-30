import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useProducts, useCreateProduct, useUpdateProduct, useRemoveProduct } from '@/src/hooks/useProducts';
import { useAllOrders } from '@/src/hooks/useOrders';
import { resolveMediaUrl } from '@/src/api/client';
import { Product, OrderStatus } from '@/src/types/api';
import { SuperAdminExpenseCategoriesModal } from '@/components/SuperAdminExpenseCategoriesModal';

export default function AdminShopScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useRole();
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'INVENTORY' | 'ORDERS' | 'CATEGORIES' | 'SETTINGS'>('OVERVIEW');
  const [searchQuery, setSearchQuery] = useState('');

  const { data: products = [], isLoading: isLoadingProducts, refetch: refetchProducts } = useProducts(true);
  const { data: allOrders = [], isLoading: isLoadingOrders } = useAllOrders();
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const pendingOrders = allOrders.filter((o: any) => o.status === 'PLACED' || o.status === 'CONFIRMED');
  const totalRevenue = allOrders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);

  return (
    <View style={styles.container}>
      {/* Admin Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="storefront" size={24} color="#d97706" />
          <View>
            <Text style={styles.headerTitle}>👑 National E-Commerce Hub</Text>
            <Text style={styles.headerSub}>Platform E-Commerce & Product Inventory Command</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.viewStoreBtn} onPress={() => router.push('/(tabs)/shop')}>
          <Ionicons name="eye-outline" size={16} color="#ffffff" />
          <Text style={styles.viewStoreBtnText}>View Customer Store</Text>
        </TouchableOpacity>
      </View>

      {/* KPI Stats Summary */}
      <View style={styles.kpiRow}>
        <View style={[styles.kpiCard, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
          <Ionicons name="cube-outline" size={20} color="#d97706" />
          <Text style={styles.kpiVal}>{products.length}</Text>
          <Text style={styles.kpiLabel}>Total Products</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }]}>
          <Ionicons name="receipt-outline" size={20} color="#4f46e5" />
          <Text style={styles.kpiVal}>{allOrders.length}</Text>
          <Text style={styles.kpiLabel}>Total Orders</Text>
        </View>
        <View style={[styles.kpiCard, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
          <Ionicons name="cash-outline" size={20} color="#16a34a" />
          <Text style={styles.kpiVal}>₹{totalRevenue.toLocaleString()}</Text>
          <Text style={styles.kpiLabel}>Revenue</Text>
        </View>
      </View>

      {/* Navigation Sub-Tabs */}
      <View style={styles.navTabs}>
        {[
          { key: 'OVERVIEW', label: '📊 Overview', icon: 'grid-outline' },
          { key: 'INVENTORY', label: '📦 Catalog', icon: 'cube-outline' },
          { key: 'ORDERS', label: '🧾 Orders', icon: 'receipt-outline' },
          { key: 'CATEGORIES', label: '🏷️ Categories', icon: 'pricetags-outline' },
        ].map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.navTabBtn, isActive && styles.navTabBtnActive]}
              onPress={() => {
                if (tab.key === 'CATEGORIES') {
                  setShowCategoriesModal(true);
                } else {
                  setActiveTab(tab.key as any);
                }
              }}
            >
              <Text style={[styles.navTabText, isActive && styles.navTabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'OVERVIEW' ? (
          <View style={{ gap: 14 }}>
            {/* Quick Actions */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⚡ Admin Quick Actions</Text>
              <View style={styles.actionGrid}>
                <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/(tabs)/admin-products')}>
                  <Ionicons name="add-circle-outline" size={18} color="#2563eb" />
                  <Text style={styles.actionPillText}>Add New Product</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/admin-sellers')}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#ea580c" />
                  <Text style={styles.actionPillText}>Seller Store Approvals</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/seller-payouts')}>
                  <Ionicons name="wallet-outline" size={18} color="#059669" />
                  <Text style={styles.actionPillText}>Seller Payouts</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/(tabs)/admin-orders')}>
                  <Ionicons name="receipt-outline" size={18} color="#7c3aed" />
                  <Text style={styles.actionPillText}>Order Processing</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Pending Orders Alerts */}
            <View style={styles.card}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={styles.cardTitle}>🔔 Pending Orders Action Required ({pendingOrders.length})</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/admin-orders')}>
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#2563eb' }}>View All →</Text>
                </TouchableOpacity>
              </View>

              {pendingOrders.length === 0 ? (
                <Text style={styles.emptyText}>No pending orders require processing right now.</Text>
              ) : (
                pendingOrders.slice(0, 4).map((ord: any) => (
                  <View key={ord.id} style={styles.orderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.orderIdText}>Order #{ord.id.slice(-6).toUpperCase()}</Text>
                      <Text style={styles.orderSubText}>
                        Customer: {ord.user?.name || ord.customer?.name || 'Farmer'} · ₹{ord.totalAmount}
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>{ord.status}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        ) : activeTab === 'INVENTORY' ? (
          <View style={{ gap: 10 }}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search catalog products..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <TouchableOpacity style={styles.addProductFullBtn} onPress={() => router.push('/(tabs)/admin-products')}>
              <Ionicons name="add-circle" size={20} color="#ffffff" />
              <Text style={styles.addProductFullBtnText}>+ Create / Manage Store Products</Text>
            </TouchableOpacity>

            {isLoadingProducts ? (
              <ActivityIndicator size="large" color="#d97706" style={{ marginVertical: 20 }} />
            ) : filteredProducts.length === 0 ? (
              <Text style={styles.emptyText}>No products found matching search.</Text>
            ) : (
              filteredProducts.map((p) => {
                const displayImg = resolveMediaUrl(p.imageUrl);
                return (
                  <View key={p.id} style={styles.productRow}>
                    <View style={styles.prodImgBox}>
                      {displayImg ? (
                        <Image source={{ uri: displayImg }} style={{ width: 44, height: 44, borderRadius: 8 }} />
                      ) : (
                        <Ionicons name="cube-outline" size={22} color="#64748b" />
                      )}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.prodName}>{p.name}</Text>
                      <Text style={styles.prodSub}>
                        Cat: {p.category ?? 'General'} · Price: ₹{p.sellingPrice} (MRP ₹{p.mrpPrice})
                      </Text>
                    </View>
                    <View style={[styles.stockTag, p.stockQuantity < 5 && { backgroundColor: '#fef2f2' }]}>
                      <Text style={[styles.stockTagText, p.stockQuantity < 5 && { color: '#dc2626' }]}>
                        Stock: {p.stockQuantity}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        ) : activeTab === 'ORDERS' ? (
          <View style={{ gap: 10 }}>
            {allOrders.map((ord: any) => (
              <View key={ord.id} style={styles.orderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.orderIdText}>Order #{ord.id.slice(-8).toUpperCase()}</Text>
                  <Text style={styles.orderSubText}>
                    Date: {new Date(ord.createdAt).toLocaleDateString()} · Items: {ord.items?.length || 1}
                  </Text>
                  <Text style={styles.orderSubText}>Total: ₹{ord.totalAmount}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{ord.status}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <SuperAdminExpenseCategoriesModal visible={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    backgroundColor: '#1e293b',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#ffffff' },
  headerSub: { fontSize: 10.5, fontFamily: FONT.regular, color: '#cbd5e1' },
  viewStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  viewStoreBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
  kpiRow: { flexDirection: 'row', gap: 8, padding: 12 },
  kpiCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  kpiVal: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a' },
  kpiLabel: { fontSize: 10, fontFamily: FONT.bold, color: '#475569' },
  navTabs: { flexDirection: 'row', paddingHorizontal: 12, gap: 6, marginBottom: 10 },
  navTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  navTabBtnActive: { backgroundColor: '#d97706', borderColor: '#d97706' },
  navTabText: { fontSize: 11, fontFamily: FONT.bold, color: '#475569' },
  navTabTextActive: { color: '#ffffff' },
  content: { flex: 1, paddingHorizontal: 12 },
  card: { backgroundColor: '#ffffff', borderRadius: 14, padding: 14, marginBottom: 12, ...premiumShadow('#0f172a', 'xs') },
  cardTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a', marginBottom: 10 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    width: '48%',
  },
  actionPillText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  emptyText: { fontSize: 12, fontFamily: FONT.regular, color: '#94a3b8', textAlign: 'center', marginVertical: 12 },
  orderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 6,
  },
  orderIdText: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  orderSubText: { fontSize: 11, fontFamily: FONT.regular, color: '#64748b', marginTop: 2 },
  statusBadge: { backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontFamily: FONT.bold, color: '#b45309' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 13, fontFamily: FONT.regular, color: '#0f172a' },
  addProductFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 12,
  },
  addProductFullBtnText: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  prodImgBox: { width: 44, height: 44, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  prodName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  prodSub: { fontSize: 11, fontFamily: FONT.regular, color: '#64748b', marginTop: 2 },
  stockTag: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  stockTagText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a' },
});
