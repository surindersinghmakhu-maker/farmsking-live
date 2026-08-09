import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  INITIAL_CROP_CATEGORIES,
  INITIAL_CROPS_LIST,
  CropCategory,
  CropItem,
} from '@/constants/cropCategoriesData';

const theme = RoleThemes.ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const INITIAL_PRODUCTS = [
  { id: '1', name: 'Bio Organic Fertilizer', price: '₹450', stock: 'In Stock' },
  { id: '2', name: 'Neem Oil Insecticide', price: '₹220', stock: 'In Stock' },
  { id: '3', name: 'Vermi Compost 50kg', price: '₹280', stock: 'In Stock' },
  { id: '4', name: 'Hybrid Wheat Seed Pack', price: '₹850', stock: 'Low Stock' },
];

export default function AdminProductsScreen() {
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'CROPS'>('CROPS');

  // Crops management state
  const [cropsList, setCropsList] = useState<CropItem[]>(INITIAL_CROPS_LIST);
  const [selectedCatId, setSelectedCatId] = useState<string>('cereals');
  const [isAddCropModalOpen, setIsAddCropModalOpen] = useState(false);

  // New Crop Form state
  const [newCropName, setNewCropName] = useState('');
  const [newVariety, setNewVariety] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newSeason, setNewSeason] = useState('Kharif');
  const [notice, setNotice] = useState<string | null>(null);

  const selectedCategory =
    INITIAL_CROP_CATEGORIES.find((c) => c.id === selectedCatId) || INITIAL_CROP_CATEGORIES[0];

  const filteredCrops = cropsList.filter((c) => c.categoryId === selectedCatId);

  const handleAddCrop = () => {
    if (!newCropName.trim()) {
      setNotice('⚠️ Kripya Crop Name bharein');
      return;
    }
    tap();
    const createdItem: CropItem = {
      id: Date.now().toString(),
      categoryId: selectedCatId,
      name: newCropName.trim(),
      hindiName: newCropName.trim(),
      variety: newVariety.trim() || undefined,
      duration: newDuration.trim() || undefined,
      season: newSeason,
    };
    setCropsList([createdItem, ...cropsList]);
    setNewCropName('');
    setNewVariety('');
    setNewDuration('');
    setNotice(`✨ Crop "${createdItem.name}" added under ${selectedCategory.name}!`);
    setTimeout(() => {
      setNotice(null);
      setIsAddCropModalOpen(false);
    }, 1500);
  };

  const deleteCrop = (id: string) => {
    tap();
    setCropsList(cropsList.filter((c) => c.id !== id));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.hero}>
        <View style={styles.heroTopRow}>
          <Text style={styles.heroTitle}>Admin Catalog & Crops</Text>
          <TouchableOpacity
            style={styles.addButton}
            activeOpacity={0.85}
            onPress={() => {
              tap();
              if (activeTab === 'CROPS') setIsAddCropModalOpen(true);
            }}
          >
            <Ionicons name="add" size={16} color="#fff" />
            <Text style={styles.addButtonText}>
              {activeTab === 'CROPS' ? 'Add Crop Name' : 'Add Product'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'CROPS' && styles.activeTabBtn]}
            onPress={() => {
              tap();
              setActiveTab('CROPS');
            }}
          >
            <Ionicons
              name="leaf"
              size={15}
              color={activeTab === 'CROPS' ? theme.primary : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'CROPS' && { color: theme.primary }]}>
              Crop Names List
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'PRODUCTS' && styles.activeTabBtn]}
            onPress={() => {
              tap();
              setActiveTab('PRODUCTS');
            }}
          >
            <Ionicons
              name="cube"
              size={15}
              color={activeTab === 'PRODUCTS' ? theme.primary : '#64748b'}
            />
            <Text style={[styles.tabText, activeTab === 'PRODUCTS' && { color: theme.primary }]}>
              Shop Products
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {activeTab === 'CROPS' ? (
          <View style={{ gap: 12 }}>
            <Text style={styles.sectionHeaderTitle}>Select Crop Category to Manage:</Text>

            {/* Category Pills Carousel */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.catRow}
            >
              {INITIAL_CROP_CATEGORIES.map((cat) => {
                const isSelected = cat.id === selectedCatId;
                const count = cropsList.filter((c) => c.categoryId === cat.id).length;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.catChip,
                      isSelected
                        ? { backgroundColor: cat.color, borderColor: cat.color }
                        : { backgroundColor: cat.bg },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setSelectedCatId(cat.id);
                    }}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={15}
                      color={isSelected ? '#ffffff' : cat.color}
                    />
                    <Text
                      style={[
                        styles.catChipText,
                        isSelected ? { color: '#ffffff' } : { color: cat.color },
                      ]}
                    >
                      {cat.name} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.catBanner}>
              <Ionicons name={selectedCategory.icon as any} size={20} color={selectedCategory.color} />
              <View style={{ flex: 1 }}>
                <Text style={styles.catBannerTitle}>{selectedCategory.name} ({selectedCategory.hindiName})</Text>
                <Text style={styles.catBannerSub}>Total {filteredCrops.length} crop names in this category</Text>
              </View>
              <TouchableOpacity
                style={[styles.miniAddBtn, { backgroundColor: selectedCategory.color }]}
                onPress={() => setIsAddCropModalOpen(true)}
              >
                <Text style={styles.miniAddBtnText}>+ Add Crop</Text>
              </TouchableOpacity>
            </View>

            {/* Crop Items list under selected category */}
            {filteredCrops.map((crop) => (
              <View key={crop.id} style={[styles.cropCard, premiumShadow('#0f172a', 'sm')]}>
                <View style={[styles.cropIconBg, { backgroundColor: selectedCategory.bg }]}>
                  <Ionicons name="leaf" size={18} color={selectedCategory.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cropNameText}>{crop.name}</Text>
                  {crop.variety ? (
                    <Text style={styles.cropVarietyText}>Variety: {crop.variety}</Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    {crop.season ? (
                      <View style={styles.seasonBadge}>
                        <Text style={styles.seasonBadgeText}>{crop.season}</Text>
                      </View>
                    ) : null}
                    {crop.duration ? (
                      <Text style={styles.durationText}>⏳ {crop.duration}</Text>
                    ) : null}
                  </View>
                </View>
                <TouchableOpacity onPress={() => deleteCrop(crop.id)}>
                  <Ionicons name="trash-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : (
          /* Products Tab */
          <View style={{ gap: 10 }}>
            {INITIAL_PRODUCTS.map((p) => (
              <View key={p.id} style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                <View style={styles.iconBg}>
                  <Ionicons name="cube-outline" size={18} color={theme.primary} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{p.name}</Text>
                  <Text style={styles.price}>{p.price}</Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: p.stock === 'In Stock' ? '#dcfce7' : '#fef3c7' },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: p.stock === 'In Stock' ? theme.primary : '#b45309' },
                    ]}
                  >
                    {p.stock}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add New Crop Name Modal (Admin Only) */}
      {isAddCropModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Add New Crop under {selectedCategory.name}
              </Text>
              <TouchableOpacity onPress={() => setIsAddCropModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Crop Name (e.g. Basmati Rice, Mustard, Kinnow)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Cotton / Desi Chana / Potato"
              value={newCropName}
              onChangeText={setNewCropName}
            />

            <Text style={styles.inputLabel}>Popular Varieties (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. HD-2967 / Pusa 1121"
              value={newVariety}
              onChangeText={setNewVariety}
            />

            <Text style={styles.inputLabel}>Harvest Duration (Optional)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. 120-140 Days"
              value={newDuration}
              onChangeText={setNewDuration}
            />

            <Text style={styles.inputLabel}>Crop Season</Text>
            <View style={styles.seasonRow}>
              {(['Kharif', 'Rabi', 'Zaid', 'All Seasons'] as const).map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.seasonChip,
                    newSeason === s && {
                      backgroundColor: selectedCategory.color,
                      borderColor: selectedCategory.color,
                    },
                  ]}
                  onPress={() => setNewSeason(s)}
                >
                  <Text
                    style={[
                      styles.seasonChipText,
                      newSeason === s && { color: '#ffffff' },
                    ]}
                  >
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {notice ? <Text style={styles.noticeText}>{notice}</Text> : null}

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: selectedCategory.color }]}
              onPress={handleAddCrop}
            >
              <Text style={styles.modalSubmitText}>+ Save & Add Crop to Category</Text>
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
    paddingBottom: 12,
    paddingHorizontal: SPACING.lg,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a' },
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
  tabContainer: { flexDirection: 'row', marginTop: 12, gap: 10 },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f1f5f9',
  },
  activeTabBtn: { backgroundColor: '#dcfce7' },
  tabText: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  list: { padding: SPACING.md, gap: 10, paddingBottom: 36 },
  sectionHeaderTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#475569' },
  catRow: { gap: 8, paddingVertical: 4 },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  catChipText: { fontSize: 11.5, fontFamily: FONT.bold },
  catBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  catBannerTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  catBannerSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  miniAddBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.sm },
  miniAddBtnText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.bold },
  cropCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 12,
  },
  cropIconBg: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropNameText: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  cropVarietyText: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  seasonBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs },
  seasonBadgeText: { fontSize: 10, fontFamily: FONT.bold, color: '#334155' },
  durationText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
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
  name: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
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
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  inputLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#334155', marginTop: 10, marginBottom: 4 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  seasonRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  seasonChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  seasonChipText: { fontSize: 11, fontFamily: FONT.bold, color: '#64748b' },
  noticeText: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a', marginTop: 10 },
  modalSubmitBtn: { marginTop: 16, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  modalSubmitText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
});
