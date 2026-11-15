import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import {
  getAllCategoryConfigs,
  saveAllCategoryConfigs,
  CategoryFieldConfig,
  DEFAULT_CATEGORY_CONFIGS,
} from '@/constants/categorySchema';

export default function AdminCategoriesScreen() {
  const { colors, isLight, cardBg, textColor } = useExecutiveTheme();

  const [categories, setCategories] = useState<CategoryFieldConfig[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'FARM' | 'FOOD' | 'CUSTOM'>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New Category Modal Form State
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<'FARM' | 'FOOD'>('FARM');
  const [newBadge, setNewBadge] = useState('Certified Agri');
  const [newDescription, setNewDescription] = useState('');
  const [newIcon, setNewIcon] = useState('leaf-outline');
  const [isLiquidAllowed, setIsLiquidAllowed] = useState(false);
  const [isFertilizer, setIsFertilizer] = useState(false);
  const [isPesticide, setIsPesticide] = useState(false);
  const [isSeed, setIsSeed] = useState(false);
  const [isNursery, setIsNursery] = useState(false);
  const [isFood, setIsFood] = useState(false);
  const [requiresAgri, setRequiresAgri] = useState(false);
  const [requiresFssai, setRequiresFssai] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = () => {
    const data = getAllCategoryConfigs();
    setCategories(data);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleField = (catId: string, field: keyof CategoryFieldConfig) => {
    const updated = categories.map((c) => {
      if (c.id === catId) {
        return {
          ...c,
          [field]: !c[field],
        };
      }
      return c;
    });
    setCategories(updated);
    saveAllCategoryConfigs(updated);
    showToast('Attribute configuration saved');
  };

  const handleResetDefaults = () => {
    setCategories(DEFAULT_CATEGORY_CONFIGS);
    saveAllCategoryConfigs(DEFAULT_CATEGORY_CONFIGS);
    showToast('Reset to system default category schemas');
  };

  const handleCreateCategory = () => {
    if (!newName.trim()) {
      alert('Please enter a valid Category Name.');
      return;
    }

    const newCat: CategoryFieldConfig = {
      id: `cat-custom-${Date.now()}`,
      name: newName.trim(),
      slug: newName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      type: newType,
      icon: newIcon || (newType === 'FOOD' ? 'restaurant-outline' : 'leaf-outline'),
      badge: newBadge || 'Custom Schema',
      description: newDescription || `${newName} specialized marketplace profile`,
      isLiquidOptionAllowed: isLiquidAllowed,
      isFertilizer,
      isPesticideOrProtection: isPesticide,
      isSeed,
      isLivePlantOrNursery: isNursery,
      isFoodProduct: isFood,
      requiresAgriLicense: requiresAgri,
      requiresFssaiLicense: requiresFssai,
      isCustom: true,
    };

    const updated = [newCat, ...categories];
    setCategories(updated);
    saveAllCategoryConfigs(updated);
    setShowAddModal(false);
    resetModalForm();
    showToast(`Category "${newCat.name}" created successfully!`);
  };

  const resetModalForm = () => {
    setNewName('');
    setNewType('FARM');
    setNewBadge('Certified Agri');
    setNewDescription('');
    setIsLiquidAllowed(false);
    setIsFertilizer(false);
    setIsPesticide(false);
    setIsSeed(false);
    setIsNursery(false);
    setIsFood(false);
    setRequiresAgri(false);
    setRequiresFssai(false);
  };

  const handleDeleteCustomCategory = (id: string) => {
    const updated = categories.filter((c) => c.id !== id);
    setCategories(updated);
    saveAllCategoryConfigs(updated);
    showToast('Custom category removed');
  };

  const filteredCategories = useMemo(() => {
    return categories.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.badge.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedFilter === 'FARM') return c.type === 'FARM';
      if (selectedFilter === 'FOOD') return c.type === 'FOOD';
      if (selectedFilter === 'CUSTOM') return !!c.isCustom;
      return true;
    });
  }, [categories, searchQuery, selectedFilter]);

  const stats = useMemo(() => {
    const total = categories.length;
    const farm = categories.filter((c) => c.type === 'FARM').length;
    const food = categories.filter((c) => c.type === 'FOOD').length;
    const custom = categories.filter((c) => c.isCustom).length;
    return { total, farm, food, custom };
  }, [categories]);

  return (
    <View style={[styles.container, { backgroundColor: isLight ? '#F8FAFC' : '#090E17' }]}>
      {/* Toast Notification Banner */}
      {toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Header Bar */}
      <View style={[styles.header, { backgroundColor: isLight ? '#FFFFFF' : '#0F172A', borderColor: isLight ? '#E2E8F0' : '#1E293B' }]}>
        <View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="git-network-outline" size={24} color="#10B981" />
            <Text style={[styles.headerTitle, { color: textColor }]}>Category Attribute Schema Engine</Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: isLight ? '#64748B' : '#94A3B8' }]}>
            Configure dynamic fields, chemical toxicity & regulatory criteria per category
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#1E293B', borderColor: '#334155' }]}
            onPress={handleResetDefaults}
          >
            <Ionicons name="refresh-outline" size={16} color="#94A3B8" />
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '700' }}>Reset Defaults</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: '#059669', borderColor: '#10B981' }]}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add-circle-outline" size={16} color="#FFF" />
            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '800' }}>+ Create Category</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Metric Badges Strip */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: isLight ? '#E2E8F0' : '#1E293B' }]}>
            <Text style={[styles.statLabel, { color: isLight ? '#64748B' : '#94A3B8' }]}>Total Categories</Text>
            <Text style={[styles.statValue, { color: '#10B981' }]}>{stats.total}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: isLight ? '#E2E8F0' : '#1E293B' }]}>
            <Text style={[styles.statLabel, { color: isLight ? '#64748B' : '#94A3B8' }]}>🌾 Farm Inputs</Text>
            <Text style={[styles.statValue, { color: '#38BDF8' }]}>{stats.farm}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: isLight ? '#E2E8F0' : '#1E293B' }]}>
            <Text style={[styles.statLabel, { color: isLight ? '#64748B' : '#94A3B8' }]}>🥗 Food & Edibles</Text>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>{stats.food}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: cardBg, borderColor: isLight ? '#E2E8F0' : '#1E293B' }]}>
            <Text style={[styles.statLabel, { color: isLight ? '#64748B' : '#94A3B8' }]}>⚙️ Custom Admin</Text>
            <Text style={[styles.statValue, { color: '#A855F7' }]}>{stats.custom}</Text>
          </View>
        </View>

        {/* Search & Filter Controls */}
        <View style={styles.filterSection}>
          <View style={[styles.searchBox, { backgroundColor: cardBg, borderColor: isLight ? '#CBD5E1' : '#334155' }]}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              style={[styles.searchInput, { color: textColor }]}
              placeholder="Search category by name or keyword..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.tabsRow}>
            {(['ALL', 'FARM', 'FOOD', 'CUSTOM'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tabChip,
                  selectedFilter === tab && styles.activeTabChip,
                  { borderColor: isLight ? '#CBD5E1' : '#334155' },
                ]}
                onPress={() => setSelectedFilter(tab)}
              >
                <Text
                  style={[
                    styles.tabChipText,
                    selectedFilter === tab && styles.activeTabChipText,
                    { color: selectedFilter === tab ? '#FFF' : textColor },
                  ]}
                >
                  {tab === 'ALL' ? 'All Schemas' : tab === 'FARM' ? 'Agri Inputs' : tab === 'FOOD' ? 'Food & Edibles' : 'Custom Added'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Cards List */}
        <View style={styles.cardsGrid}>
          {filteredCategories.map((c) => (
            <View
              key={c.id}
              style={[
                styles.categoryCard,
                { backgroundColor: cardBg, borderColor: isLight ? '#E2E8F0' : '#1E293B' },
              ]}
            >
              {/* Card Top Row */}
              <View style={styles.cardHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={[styles.iconCircle, { backgroundColor: c.type === 'FOOD' ? '#064E3B' : '#1E3A5F' }]}>
                    <Ionicons name={(c.icon as any) || 'leaf'} size={20} color={c.type === 'FOOD' ? '#34D399' : '#60A5FA'} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.cardTitle, { color: textColor }]}>{c.name}</Text>
                      {c.isCustom && (
                        <View style={{ backgroundColor: '#581C87', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ color: '#D8B4FE', fontSize: 9, fontWeight: '800' }}>CUSTOM</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 1 }}>{c.description}</Text>
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={{ backgroundColor: c.type === 'FOOD' ? '#064E3B' : '#0F2942', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                    <Text style={{ color: c.type === 'FOOD' ? '#34D399' : '#60A5FA', fontSize: 10, fontWeight: '800' }}>
                      {c.badge}
                    </Text>
                  </View>
                  {c.isCustom && (
                    <TouchableOpacity onPress={() => handleDeleteCustomCategory(c.id)}>
                      <Ionicons name="trash-outline" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Toggles Matrix */}
              <View style={styles.togglesContainer}>
                <Text style={styles.toggleGroupTitle}>Attribute & Field Form Rules:</Text>

                {/* 1. Liquid Cargo Mode */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelCol}>
                    <Text style={[styles.toggleName, { color: textColor }]}>🧪 Liquid / Chemical Cargo Mode</Text>
                    <Text style={styles.toggleDesc}>Surface transport rule & dangerous goods toggle</Text>
                  </View>
                  <Switch
                    value={c.isLiquidOptionAllowed}
                    onValueChange={() => handleToggleField(c.id, 'isLiquidOptionAllowed')}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={c.isLiquidOptionAllowed ? '#34D399' : '#9CA3AF'}
                  />
                </View>

                {/* 2. Seeds Specs */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelCol}>
                    <Text style={[styles.toggleName, { color: textColor }]}>🌱 Seeds Specifications</Text>
                    <Text style={styles.toggleDesc}>Germination %, Purity %, Sowing Season & Hybrid type</Text>
                  </View>
                  <Switch
                    value={c.isSeed}
                    onValueChange={() => handleToggleField(c.id, 'isSeed')}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={c.isSeed ? '#34D399' : '#9CA3AF'}
                  />
                </View>

                {/* 3. Live Nursery Specs */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelCol}>
                    <Text style={[styles.toggleName, { color: textColor }]}>🌸 Live Nursery Specs</Text>
                    <Text style={styles.toggleDesc}>Plant height/age, grafted method & polybag container</Text>
                  </View>
                  <Switch
                    value={c.isLivePlantOrNursery}
                    onValueChange={() => handleToggleField(c.id, 'isLivePlantOrNursery')}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={c.isLivePlantOrNursery ? '#34D399' : '#9CA3AF'}
                  />
                </View>

                {/* 4. Fertilizer Specs */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelCol}>
                    <Text style={[styles.toggleName, { color: textColor }]}>🧪 Fertilizer & Plant Nutrition</Text>
                    <Text style={styles.toggleDesc}>NPK Ratio, Physical State (Liquid/Granule) & Foliar/Soil</Text>
                  </View>
                  <Switch
                    value={c.isFertilizer}
                    onValueChange={() => handleToggleField(c.id, 'isFertilizer')}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={c.isFertilizer ? '#34D399' : '#9CA3AF'}
                  />
                </View>

                {/* 5. Crop Protection & Toxicity Specs */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelCol}>
                    <Text style={[styles.toggleName, { color: textColor }]}>⚠️ Crop Protection & Toxicity Band</Text>
                    <Text style={styles.toggleDesc}>CIBRC color band, Active Formula, Mode of Action & PHI</Text>
                  </View>
                  <Switch
                    value={c.isPesticideOrProtection}
                    onValueChange={() => handleToggleField(c.id, 'isPesticideOrProtection')}
                    trackColor={{ false: '#374151', true: '#D97706' }}
                    thumbColor={c.isPesticideOrProtection ? '#FBBF24' : '#9CA3AF'}
                  />
                </View>

                {/* 6. Food & Nutritional Specs */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelCol}>
                    <Text style={[styles.toggleName, { color: textColor }]}>🥗 Packaged Food & Nutritional Matrix</Text>
                    <Text style={styles.toggleDesc}>FSSAI License, Veg/Non-Veg, Ingredients & Calories</Text>
                  </View>
                  <Switch
                    value={c.isFoodProduct}
                    onValueChange={() => handleToggleField(c.id, 'isFoodProduct')}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={c.isFoodProduct ? '#34D399' : '#9CA3AF'}
                  />
                </View>

                {/* 7. Agri Inputs License Requirement */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelCol}>
                    <Text style={[styles.toggleName, { color: '#38BDF8' }]}>🛡️ Mandatory Agri Inputs License</Text>
                    <Text style={styles.toggleDesc}>Seller cannot select category without verified Agri License</Text>
                  </View>
                  <Switch
                    value={c.requiresAgriLicense}
                    onValueChange={() => handleToggleField(c.id, 'requiresAgriLicense')}
                    trackColor={{ false: '#374151', true: '#0284C7' }}
                    thumbColor={c.requiresAgriLicense ? '#38BDF8' : '#9CA3AF'}
                  />
                </View>

                {/* 8. FSSAI License Requirement */}
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelCol}>
                    <Text style={[styles.toggleName, { color: '#34D399' }]}>📋 Mandatory FSSAI License</Text>
                    <Text style={styles.toggleDesc}>Seller cannot select category without verified FSSAI No.</Text>
                  </View>
                  <Switch
                    value={c.requiresFssaiLicense}
                    onValueChange={() => handleToggleField(c.id, 'requiresFssaiLicense')}
                    trackColor={{ false: '#374151', true: '#059669' }}
                    thumbColor={c.requiresFssaiLicense ? '#34D399' : '#9CA3AF'}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Create New Category Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg, borderColor: isLight ? '#E2E8F0' : '#1E293B' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="add-circle" size={22} color="#10B981" />
                <Text style={[styles.modalTitle, { color: textColor }]}>Create Custom Category Schema</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={22} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 500 }}>
              <Text style={styles.inputLabel}>Category Name *</Text>
              <TextInput
                style={[styles.modalInput, { color: textColor, borderColor: isLight ? '#CBD5E1' : '#334155' }]}
                placeholder="e.g. Animal & Cattle Feed"
                placeholderTextColor="#94A3B8"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={styles.inputLabel}>Domain Classification</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginVertical: 6 }}>
                <TouchableOpacity
                  style={[styles.typeSelectBtn, newType === 'FARM' && styles.activeTypeSelectBtn]}
                  onPress={() => setNewType('FARM')}
                >
                  <Text style={[styles.typeSelectText, newType === 'FARM' && styles.activeTypeSelectText]}>🌾 Agri Inputs (FARM)</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.typeSelectBtn, newType === 'FOOD' && styles.activeTypeSelectBtn]}
                  onPress={() => setNewType('FOOD')}
                >
                  <Text style={[styles.typeSelectText, newType === 'FOOD' && styles.activeTypeSelectText]}>🥗 Food & Edibles (FOOD)</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Badge Label</Text>
              <TextInput
                style={[styles.modalInput, { color: textColor, borderColor: isLight ? '#CBD5E1' : '#334155' }]}
                placeholder="e.g. Pure Feed Direct"
                placeholderTextColor="#94A3B8"
                value={newBadge}
                onChangeText={setNewBadge}
              />

              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.modalInput, { color: textColor, borderColor: isLight ? '#CBD5E1' : '#334155' }]}
                placeholder="e.g. High protein cattle feed, mineral mixtures & silage"
                placeholderTextColor="#94A3B8"
                value={newDescription}
                onChangeText={setNewDescription}
              />

              <Text style={[styles.inputLabel, { marginTop: 12, fontWeight: '800', color: '#10B981' }]}>
                Select Required Form Attributes for Sellers:
              </Text>

              {/* Checkbox Rows */}
              {[
                { label: '🧪 Liquid Cargo Mode Allowed', val: isLiquidAllowed, set: setIsLiquidAllowed },
                { label: '🌱 Seeds Specs (Germination, Purity, Season)', val: isSeed, set: setIsSeed },
                { label: '🌸 Live Nursery Specs (Age, Height, Container)', val: isNursery, set: setIsNursery },
                { label: '🧪 Fertilizer Specs (NPK Ratio, Physical State)', val: isFertilizer, set: setIsFertilizer },
                { label: '⚠️ Crop Protection (Active Formula, CIBRC Toxicity)', val: isPesticide, set: setIsPesticide },
                { label: '🥗 Packaged Food Matrix (FSSAI, Veg/Non-Veg)', val: isFood, set: setIsFood },
                { label: '🛡️ Require Agri Inputs License', val: requiresAgri, set: setRequiresAgri },
                { label: '📋 Require FSSAI License', val: requiresFssai, set: setRequiresFssai },
              ].map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.modalCheckRow}
                  onPress={() => item.set(!item.val)}
                >
                  <Ionicons name={item.val ? 'checkbox' : 'square-outline'} size={20} color={item.val ? '#10B981' : '#64748B'} />
                  <Text style={[styles.modalCheckText, { color: textColor }]}>{item.label}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#334155', flex: 1 }]}
                onPress={() => setShowAddModal(false)}
              >
                <Text style={{ color: '#FFF', fontWeight: '700', textAlign: 'center' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#059669', flex: 1.5 }]}
                onPress={handleCreateCategory}
              >
                <Text style={{ color: '#FFF', fontWeight: '800', textAlign: 'center' }}>Save Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastBanner: {
    position: 'absolute',
    top: 14,
    right: 20,
    zIndex: 999,
    backgroundColor: '#064E3B',
    borderWidth: 1,
    borderColor: '#10B981',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    ...premiumShadow('#000', 'md'),
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: FONT.bold,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
    fontFamily: FONT.regular,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    minWidth: 140,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  filterSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  activeTabChip: {
    backgroundColor: '#059669',
    borderColor: '#10B981',
  },
  tabChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeTabChipText: {
    fontWeight: '800',
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    flex: 1,
    minWidth: 320,
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    ...premiumShadow('#000', 'sm'),
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  togglesContainer: {
    gap: 10,
  },
  toggleGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleLabelCol: {
    flex: 1,
    marginRight: 10,
  },
  toggleName: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    ...premiumShadow('#000', 'xl'),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#94A3B8',
    fontSize: 11.5,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    backgroundColor: '#0F172A',
  },
  typeSelectBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
  activeTypeSelectBtn: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  typeSelectText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeTypeSelectText: {
    color: '#34D399',
    fontWeight: '800',
  },
  modalCheckRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
  },
  modalCheckText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderBottomWidth: 0,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
});
