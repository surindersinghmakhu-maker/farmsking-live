import React, { useState } from 'react';
import { View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { Product } from '@/src/types/api';
import { useCreateProduct, useProducts, useRemoveProduct, useUpdateProduct } from '@/src/hooks/useProducts';

const theme = RoleThemes.ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};


const Hoverable4DCard = ({ children, style, onPress }: any) => {
  return (
    <Pressable onPress={onPress} style={({ hovered, pressed }: any) => [
      style,
      hovered && {
        borderColor: 'rgba(0,255,135,0.55)',
        shadowColor: '#00ff87',
        shadowOpacity: 0.3,
        shadowRadius: 15,
        elevation: 10,
        transform: [{ scale: 1.02 }]
      },
      pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }
    ]}>
      {children}
    </Pressable>
  );
};

export default function AdminProductsScreen() {

  // Real shop products
  const { data: products, isLoading: isLoadingProducts } = useProducts(true);
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const removeProduct = useRemoveProduct();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('piece');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('0');
  const [productError, setProductError] = useState<string | null>(null);

  const openCreateProductModal = () => {
    tap();
    setEditingProduct(null);
    setNewProductName('');
    setNewProductCategory('');
    setNewProductUnit('piece');
    setNewProductPrice('');
    setNewProductStock('0');
    setProductError(null);
    setIsAddProductModalOpen(true);
  };

  const openEditProductModal = (p: Product) => {
    tap();
    setEditingProduct(p);
    setNewProductName(p.name || '');
    setNewProductCategory(p.category || '');
    setNewProductUnit(p.unit || 'piece');
    setNewProductPrice(p.price != null ? String(p.price) : '');
    setNewProductStock(p.stockQty != null ? String(p.stockQty) : '0');
    setProductError(null);
    setIsAddProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) {
      setProductError('Enter a product name and price.');
      return;
    }
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          payload: {
            name: newProductName.trim(),
            category: newProductCategory.trim() || undefined,
            unit: newProductUnit.trim() || 'piece',
            price: Number(newProductPrice),
            stockQty: Number(newProductStock) || 0,
          },
        });
      } else {
        await createProduct.mutateAsync({
          name: newProductName.trim(),
          category: newProductCategory.trim() || undefined,
          unit: newProductUnit.trim() || 'piece',
          price: Number(newProductPrice),
          stockQty: Number(newProductStock) || 0,
        });
      }
      setEditingProduct(null);
      setNewProductName('');
      setNewProductCategory('');
      setNewProductUnit('piece');
      setNewProductPrice('');
      setNewProductStock('0');
      setProductError(null);
      setIsAddProductModalOpen(false);
    } catch (err: any) {
      setProductError(err?.response?.data?.message ?? (editingProduct ? 'Could not update product.' : 'Could not create product.'));
    }
  };



  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>📦 Product Inventory & Catalog</Text>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={openCreateProductModal}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>Add Product</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 4 }}>
          Manage all e-commerce products, prices & stock levels
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <View style={{ gap: 10 }}>
          {isLoadingProducts ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
          ) : !products || products.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 40, gap: 8 }}>
              <Ionicons name="cube-outline" size={42} color="#cbd5e1" />
              <Text style={styles.sectionHeaderTitle}>No products in the catalog yet.</Text>
              <Text style={{ fontSize: 11.5, color: '#94a3b8', fontFamily: FONT.medium, textAlign: 'center' }}>
                Sellers add products from their dashboard. Use the button above to add platform products.
              </Text>
            </View>
          ) : (
            products.map((p) => {
              const isLowStock = p.stockQty > 0 && p.stockQty < 5;
              const isOutOfStock = p.stockQty <= 0;
              return (
                <View key={p.id} style={[styles.card, premiumShadow('#0f172a', 'sm'), !p.isActive && { opacity: 0.5 }]}>
                  <View style={styles.iconBg}>
                    <Ionicons name="cube-outline" size={18} color={theme.primary} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{p.name}</Text>
                    <Text style={styles.price}>₹{p.price} / {p.unit} · Stock: {p.stockQty}</Text>
                    {p.category ? <Text style={{ fontSize: 10, color: '#94a3b8', fontFamily: FONT.medium }}>{p.category}</Text> : null}
                  </View>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: isOutOfStock ? '#fee2e2' : isLowStock ? '#fef3c7' : '#dcfce7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.badgeText,
                        { color: isOutOfStock ? '#dc2626' : isLowStock ? '#b45309' : theme.primary },
                      ]}
                    >
                      {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginLeft: 8 }}>
                    <TouchableOpacity onPress={() => openEditProductModal(p)}>
                      <Ionicons name="create-outline" size={18} color="#0284c7" />
                    </TouchableOpacity>
                    {p.isActive ? (
                      <TouchableOpacity
                        onPress={() => {
                          tap();
                          removeProduct.mutate(p.id);
                        }}
                      >
                        <Ionicons name="trash-outline" size={18} color="#dc2626" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add / Edit Product Modal */}
      {isAddProductModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Edit Shop Product' : 'Add Shop Product'}
              </Text>
              <TouchableOpacity onPress={() => setIsAddProductModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Product Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Bio Organic Fertilizer"
              value={newProductName}
              onChangeText={setNewProductName}
            />

            <Text style={styles.inputLabel}>Category (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Fertilizers"
              value={newProductCategory}
              onChangeText={setNewProductCategory}
            />

            <Text style={styles.inputLabel}>Unit</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. kg, litre, piece, bag"
              value={newProductUnit}
              onChangeText={setNewProductUnit}
            />

            <Text style={styles.inputLabel}>Price (₹)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 450"
              keyboardType="numeric"
              value={newProductPrice}
              onChangeText={setNewProductPrice}
            />

            <Text style={styles.inputLabel}>Stock Quantity</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 50"
              keyboardType="numeric"
              value={newProductStock}
              onChangeText={setNewProductStock}
            />

            {productError ? <Text style={[styles.noticeText, { color: '#dc2626' }]}>{productError}</Text> : null}

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
              disabled={createProduct.isPending || updateProduct.isPending}
              onPress={handleSaveProduct}
            >
              {createProduct.isPending || updateProduct.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.modalSubmitText}>
                  {editingProduct ? 'Update Product' : '+ Save Product'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: {
    paddingTop: 18,
    paddingBottom: 14,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'rgba(0,255,135,0.03)',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 17, fontFamily: FONT.extraBold, color: '#ffffff' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  addButtonText: { color: '#fff', fontSize: 12, fontFamily: FONT.bold },
  list: { padding: SPACING.md, gap: 10, paddingBottom: 36 },
  sectionHeaderTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#475569', textAlign: 'center' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,255,135,0.03)',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: 12,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  name: { fontSize: 13.5, fontFamily: FONT.bold, color: '#ffffff' },
  price: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  badge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgeText: { fontSize: 10.5, fontFamily: FONT.bold },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 999,
  },
  modalContent: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: 'rgba(0,255,135,0.03)',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
  inputLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#e2e8f0', marginTop: 10, marginBottom: 4 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: 'rgba(0,255,135,0.3)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#ffffff',
    backgroundColor: '#020d06',
  },
  noticeText: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a', marginTop: 10 },
  modalSubmitBtn: { marginTop: 16, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  modalSubmitText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
});
