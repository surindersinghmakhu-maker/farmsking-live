import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
  INITIAL_CROP_CATEGORIES,
  INITIAL_CROPS_LIST,
  CROP_UNITS,
  LAND_AREA_UNITS,
  IRRIGATION_TYPES,
  CropCategory,
  CropItem,
  CropUnit,
  LandAreaUnit,
  HarvestType,
  IrrigationType,
} from '@/constants/cropCategoriesData';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';

export interface CropFormValues {
  crop: CropItem;
  category: CropCategory;
  fieldName: string;
  area: string;
  areaUnit: LandAreaUnit;
  sowingDate: string;
  unit: CropUnit;
  pricePerUnit: string;
  minPricePerUnit?: string;
  maxPricePerUnit?: string;
  stage: 'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED' | 'SOWING' | 'GROWTH';
  harvestType: HarvestType;
  irrigationType: IrrigationType;
  plantCount?: string;
}

import { RegisteredCropField } from '@/src/store/crops-context';

interface CropCategorySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveCropForm: (values: CropFormValues) => void;
  customCrops?: CropItem[];
  editingCrop?: RegisteredCropField | null;
  onOpenUpgradeModal?: () => void;
}

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const CropCategorySelectorModal: React.FC<CropCategorySelectorModalProps> = ({
  visible,
  onClose,
  onSaveCropForm,
  customCrops,
  editingCrop,
  onOpenUpgradeModal,
}) => {
  const router = useRouter();
  const [selectedCatId, setSelectedCatId] = useState<string>('flowers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);

  // Single Unified Form Modal
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);
  const [isCropPickerOpen, setIsCropPickerOpen] = useState<boolean>(false);
  const [isAreaUnitPickerOpen, setIsAreaUnitPickerOpen] = useState<boolean>(false);

  // Form Fields
  const [fieldName, setFieldName] = useState('');
  const [area, setArea] = useState('1');
  const [plantCount, setPlantCount] = useState('');
  const [selectedAreaUnit, setSelectedAreaUnit] = useState<LandAreaUnit>('Killa (Acre)');
  const [selectedIrrigation, setSelectedIrrigation] = useState<IrrigationType>('Tube Well / Borewell');
  const [cropStage, setCropStage] = useState<'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED' | 'SOWING' | 'GROWTH'>('PLANTATION');
  const [sowingDate, setSowingDate] = useState(() =>
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  );
  const [selectedSeason, setSelectedSeason] = useState<string>('Rabi (Winter)');
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [selectedUnit, setSelectedUnit] = useState<CropUnit>('KG');
  const [minPricePerUnit, setMinPricePerUnit] = useState('40');
  const [maxPricePerUnit, setMaxPricePerUnit] = useState('60');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const [customCropName, setCustomCropName] = useState('');
  const [varietyName, setVarietyName] = useState('');
  const [customHarvestType, setCustomHarvestType] = useState<HarvestType>('CONTINUOUS');

  useEffect(() => {
    if (visible && editingCrop) {
      setFieldName(editingCrop.fieldName || '');

      // Parse area & land area unit accurately
      if (editingCrop.area) {
        const parts = editingCrop.area.trim().split(' ');
        const numericVal = parts[0];
        setArea(numericVal || '1');

        const restUnitText = parts.slice(1).join(' ').trim();
        const foundUnit = LAND_AREA_UNITS.find(
          (u) => u.unit.toLowerCase() === restUnitText.toLowerCase() || u.label.toLowerCase() === restUnitText.toLowerCase()
        );
        if (foundUnit) {
          setSelectedAreaUnit(foundUnit.unit);
        }
      } else {
        setArea('1');
      }

      setVarietyName(editingCrop.variety || '');
      setPlantCount(editingCrop.plantCount ? String(editingCrop.plantCount) : '');
      if (editingCrop.sowingDate) setSowingDate(editingCrop.sowingDate);
      if (editingCrop.unit) setSelectedUnit(editingCrop.unit);
      if (editingCrop.minPricePerUnit) setMinPricePerUnit(editingCrop.minPricePerUnit);
      if (editingCrop.maxPricePerUnit) setMaxPricePerUnit(editingCrop.maxPricePerUnit);
      else if (editingCrop.pricePerUnit) setMaxPricePerUnit(editingCrop.pricePerUnit);
      if (editingCrop.stage) setCropStage(editingCrop.stage);
      if (editingCrop.irrigationType) setSelectedIrrigation(editingCrop.irrigationType);
      if (editingCrop.harvestType) setCustomHarvestType(editingCrop.harvestType);

      const matchedCat = INITIAL_CROP_CATEGORIES.find((c) => c.name === editingCrop.categoryName) || INITIAL_CROP_CATEGORIES[0];
      setSelectedCatId(matchedCat.id);

      const baseName = editingCrop.cropName.replace(/\s*\([^)]*\)/g, '').trim();
      setSelectedCrop({
        id: editingCrop.id,
        categoryId: matchedCat.id,
        name: baseName,
        hindiName: baseName,
        variety: editingCrop.variety,
        defaultUnit: editingCrop.unit,
        harvestType: editingCrop.harvestType,
      });
    } else if (visible && !editingCrop) {
      // Reset form defaults when adding a new crop
      setFieldName('');
      setArea('1');
      setVarietyName('');
      setPlantCount('');
      setSelectedIrrigation('Tube Well / Borewell');
      setCustomHarvestType('CONTINUOUS');
      setSowingDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
      setSelectedCrop(null);
    }
  }, [visible, editingCrop]);

  const allCrops = customCrops || INITIAL_CROPS_LIST;

  const currentCategory = useMemo(() => {
    return (
      INITIAL_CROP_CATEGORIES.find((c) => c.id === selectedCatId) ||
      INITIAL_CROP_CATEGORIES[0]
    );
  }, [selectedCatId]);

  // Filter crops belonging to selected category
  const filteredCrops = useMemo(() => {
    const list = allCrops.filter((crop) => crop.categoryId === selectedCatId);
    if (!searchQuery.trim()) return list;
    return list.filter(
      (crop) =>
        crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (crop.variety && crop.variety.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allCrops, selectedCatId, searchQuery]);

  const handleSelectCategory = (catId: string) => {
    tap();
    setSelectedCatId(catId);
    setSearchQuery('');
    setCustomCropName('');
    setCustomHarvestType('CONTINUOUS');
    setIsCategoryPickerOpen(false);
  };

  const handleAddCustomCrop = () => {
    if (!customCropName.trim()) return;
    tap();
    handleSelectCropItem({
      id: `custom-${Date.now()}`,
      categoryId: 'other',
      name: customCropName.trim(),
      hindiName: customCropName.trim(),
      harvestType: customHarvestType,
    });
  };

  const handleSelectCropItem = (crop: CropItem) => {
    tap();
    setSelectedCrop(crop);
    if (!fieldName.trim()) {
      setFieldName(`${crop.name} Plot 1`);
    }
    setSelectedUnit(crop.defaultUnit || 'KG');
    setVarietyName(crop.variety || '');
    const defPrice = crop.defaultPrice || 50;
    setMaxPricePerUnit(String(Math.round(defPrice)));
    setMinPricePerUnit(String(Math.round(defPrice)));
  };

  const handleFormSubmit = () => {
    tap();
    const baseCrop = selectedCrop || filteredCrops[0] || {
      id: `custom-${Date.now()}`,
      categoryId: selectedCatId,
      name: customCropName || 'Crop',
      hindiName: customCropName || 'Crop',
      harvestType: 'CONTINUOUS',
    };
    const cropToSave: CropItem = {
      ...baseCrop,
      variety: varietyName.trim() || undefined,
    };
    const maxP = parseFloat(maxPricePerUnit) > 0 ? parseFloat(maxPricePerUnit) : (cropToSave.defaultPrice || 50);
    const finalFieldName = fieldName.trim() ? fieldName.trim() : `${cropToSave.name || 'Crop'} Plot 1`;

    onSaveCropForm({
      crop: cropToSave,
      category: currentCategory,
      fieldName: finalFieldName,
      area: area.trim() || '1',
      areaUnit: selectedAreaUnit,
      sowingDate: sowingDate,
      unit: selectedUnit || 'KG',
      pricePerUnit: String(maxP),
      minPricePerUnit: String(maxP),
      maxPricePerUnit: String(maxP),
      stage: cropStage,
      harvestType: cropToSave.harvestType || 'CONTINUOUS',
      irrigationType: selectedIrrigation,
      plantCount: plantCount.trim() || undefined,
    });
    // Reset state & close
    setSelectedCrop(null);
    setFieldName('');
    setArea('1');
    setVarietyName('');
    setPlantCount('');
    setSowingDate(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
    setErrorNotice(null);
    onClose();
  };

  const isContinuousHarvest = (selectedCrop?.harvestType || 'CONTINUOUS') === 'CONTINUOUS';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>{editingCrop ? "✏️ Edit Crop Details" : "Add Crop Form"}</Text>
              <Text style={styles.modalSub}>{editingCrop ? "Update crop specifications & field details below" : "Fill crop details & field specifications below"}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
            {/* 1. Category Horizontal Pill Bar */}
            <Text style={styles.inputLabelCompact}>Select Crop Category *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
              {INITIAL_CROP_CATEGORIES.map((cat) => {
                const isSelected = cat.id === selectedCatId;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.compactCategoryChip,
                      isSelected
                        ? { backgroundColor: cat.color, borderColor: cat.color }
                        : { backgroundColor: cat.bg, borderColor: '#cbd5e1' },
                    ]}
                    onPress={() => handleSelectCategory(cat.id)}
                  >
                    <Ionicons name={cat.icon as any} size={13} color={isSelected ? '#ffffff' : cat.color} />
                    <Text
                      style={[
                        styles.compactCategoryText,
                        isSelected ? { color: '#ffffff', fontFamily: FONT.bold } : { color: cat.color },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. Select Crop & Variety Name Side-by-Side Row */}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabelCompact} numberOfLines={1}>Select Crop *</Text>
                {selectedCatId !== 'other' ? (
                  <TouchableOpacity
                    style={[
                      styles.cropSelectBtnLarge,
                      { borderColor: currentCategory.color, backgroundColor: currentCategory.bg, height: 40, marginBottom: 0 },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setIsCropPickerOpen(true);
                    }}
                  >
                    <Ionicons name="leaf" size={15} color={currentCategory.color} />
                    <Text style={[styles.cropSelectTextLarge, { color: currentCategory.color }]} numberOfLines={1}>
                      {selectedCrop ? selectedCrop.name : `Choose Crop (${filteredCrops.length})`}
                    </Text>
                    <Ionicons name="chevron-down" size={13} color={currentCategory.color} />
                  </TouchableOpacity>
                ) : (
                  <TextInput
                    style={styles.compactFormInput}
                    placeholder="Custom Crop Name"
                    placeholderTextColor="#94a3b8"
                    value={customCropName}
                    onChangeText={(text) => {
                      setCustomCropName(text);
                      setFieldName(text.trim() ? `${text.trim()} Plot 1` : '');
                    }}
                  />
                )}
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabelCompact} numberOfLines={1}>Variety (Optional)</Text>
                <TextInput
                  style={styles.compactFormInput}
                  placeholder="e.g. Desi / Pusa Ruby"
                  placeholderTextColor="#94a3b8"
                  value={varietyName}
                  onChangeText={setVarietyName}
                />
              </View>
            </View>

            {/* 3. Side-by-Side Row: Field Name (Left) + Sowing Date (Right) */}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 4 }}>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.inputLabelCompact}>Farm / Field Name *</Text>
                <TextInput
                  style={styles.compactFormInput}
                  placeholder="e.g. Plot 1 / Field"
                  placeholderTextColor="#94a3b8"
                  value={fieldName}
                  onChangeText={setFieldName}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabelCompact}>Sowing Date *</Text>
                <TouchableOpacity
                  style={styles.calendarSelector}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setIsCalendarOpen(true);
                  }}
                >
                  <Ionicons name="calendar" size={15} color="#16a34a" />
                  <Text style={styles.calendarSelectorDate} numberOfLines={1}>
                    {sowingDate}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 4. Current Crop Stage */}
            <Text style={styles.inputLabelCompact}>Current Crop Stage *</Text>
            <View style={styles.compactStageGrid}>
              {[
                { key: 'PLANTATION', label: '🌱 Plantation', color: '#d97706', bg: '#fef3c7' },
                { key: 'VEGETATIVE', label: '🌿 Vegetative', color: '#0284c7', bg: '#e0f2fe' },
                { key: 'FLOWERING', label: '🌸 Flowering', color: '#e11d48', bg: '#ffe4e6' },
                { key: 'HARVESTING', label: '🌾 Harvesting', color: '#16a34a', bg: '#dcfce7' },
              ].map((st) => {
                const isSelected = st.key === cropStage;
                return (
                  <TouchableOpacity
                    key={st.key}
                    style={[
                      styles.compactStageChip,
                      isSelected
                        ? { backgroundColor: st.color, borderColor: st.color }
                        : { backgroundColor: st.bg, borderColor: 'transparent' },
                    ]}
                    onPress={() => {
                      tap();
                      setCropStage(st.key as any);
                    }}
                  >
                    <Text
                      style={[
                        styles.compactStageText,
                        isSelected ? { color: '#ffffff', fontFamily: FONT.bold } : { color: st.color },
                      ]}
                    >
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 5. 3-Column Row: Total Area Size + Land Area Unit + No. of Plants (Optional) */}
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 4 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabelCompact} numberOfLines={1}>Area Size *</Text>
                <TextInput
                  style={styles.compactFormInput}
                  placeholder="e.g. 1"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={area}
                  onChangeText={setArea}
                />
              </View>
              <View style={{ flex: 1.1 }}>
                <Text style={styles.inputLabelCompact} numberOfLines={1}>Land Unit *</Text>
                <TouchableOpacity
                  style={styles.dropdownUnitSelectorBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setIsAreaUnitPickerOpen(true);
                  }}
                >
                  <Ionicons name="map-outline" size={14} color="#16a34a" />
                  <Text style={styles.dropdownUnitSelectorText} numberOfLines={1}>
                    {selectedAreaUnit}
                  </Text>
                  <Ionicons name="chevron-down" size={12} color="#64748b" />
                </TouchableOpacity>
              </View>
              <View style={{ flex: 1.1 }}>
                <Text style={styles.inputLabelCompact} numberOfLines={1}>No. of Plants (Opt.)</Text>
                <TextInput
                  style={styles.compactFormInput}
                  placeholder="e.g. 500"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={plantCount}
                  onChangeText={setPlantCount}
                />
              </View>
            </View>

            {/* 6. Irrigation Type & Harvest Pattern Row */}
            <View style={{ marginTop: 6, gap: 6 }}>
              <Text style={styles.inputLabelCompact}>Irrigation System *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                {IRRIGATION_TYPES.map((irr) => {
                  const isSelected = irr.type === selectedIrrigation;
                  return (
                    <TouchableOpacity
                      key={irr.type}
                      style={[
                        styles.compactMiniChip,
                        isSelected
                          ? { backgroundColor: '#0284c7', borderColor: '#0284c7' }
                          : { backgroundColor: '#e0f2fe', borderColor: '#cbd5e1' },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedIrrigation(irr.type);
                      }}
                    >
                      <Ionicons name={irr.icon as any} size={12} color={isSelected ? '#ffffff' : '#0284c7'} />
                      <Text
                        style={[
                          styles.compactMiniText,
                          isSelected ? { color: '#ffffff', fontFamily: FONT.bold } : { color: '#0369a1' },
                        ]}
                      >
                        {irr.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.inputLabelCompact, { marginTop: 4 }]}>Harvest Pattern *</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[
                    styles.compactMiniChip,
                    { flex: 1, justifyContent: 'center', height: 34 },
                    customHarvestType === 'CONTINUOUS'
                      ? { backgroundColor: '#16a34a', borderColor: '#16a34a' }
                      : { backgroundColor: '#f0fdf4', borderColor: '#cbd5e1' },
                  ]}
                  onPress={() => {
                    tap();
                    setCustomHarvestType('CONTINUOUS');
                  }}
                >
                  <Text style={[styles.compactMiniText, customHarvestType === 'CONTINUOUS' ? { color: '#fff', fontFamily: FONT.bold } : { color: '#16a34a' }]}>
                     Daily Harvest (ਸੁਭਾ/ਸ਼ਾਮ)
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.compactMiniChip,
                    { flex: 1, justifyContent: 'center', height: 34 },
                    customHarvestType === 'ONE_TIME'
                      ? { backgroundColor: '#d97706', borderColor: '#d97706' }
                      : { backgroundColor: '#fef3c7', borderColor: '#cbd5e1' },
                  ]}
                  onPress={() => {
                    tap();
                    setCustomHarvestType('ONE_TIME');
                  }}
                >
                  <Text style={[styles.compactMiniText, customHarvestType === 'ONE_TIME' ? { color: '#fff', fontFamily: FONT.bold } : { color: '#d97706' }]}>
                    🌾 1-Time Harvest (ਇੱਕ ਵਾਰ)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* 7. Dedicated Sale / Market Information Card */}
            <View style={styles.saleInfoCard}>
              <View style={styles.saleCardHeader}>
                <Ionicons name="pricetag" size={14} color="#16a34a" />
                <Text style={styles.saleCardTitle}>Sale / Market Information (Estimated Max Price)</Text>
              </View>

              {/* Estimated max price per Unit */}
              <View style={{ marginBottom: 4 }}>
                <Text style={styles.inputLabelCompact}>Estimated max price / {selectedUnit} (₹) *</Text>
                <View style={styles.priceWrap}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.priceInput}
                    placeholder="Estimated max price ₹"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={maxPricePerUnit}
                    onChangeText={(val) => {
                      setMaxPricePerUnit(val);
                      setMinPricePerUnit(val);
                    }}
                  />
                </View>
              </View>

              {/* Crop Measurement Unit Selector */}
              <Text style={[styles.inputLabelCompact, { marginTop: 6 }]}>Crop Unit *</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 2 }}>
                {CROP_UNITS.map((u) => {
                  const isSelected = u.unit === selectedUnit;
                  return (
                    <TouchableOpacity
                      key={u.unit}
                      style={[
                        styles.compactMiniChip,
                        isSelected
                          ? { backgroundColor: '#16a34a', borderColor: '#16a34a' }
                          : { backgroundColor: '#f0fdf4', borderColor: '#cbd5e1' },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedUnit(u.unit);
                      }}
                    >
                      <Text
                        style={[
                          styles.compactMiniText,
                          isSelected ? { color: '#ffffff', fontFamily: FONT.bold } : { color: '#15803d' },
                        ]}
                      >
                        {u.unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {errorNotice ? (
              <View style={{ gap: 6, marginVertical: 6, alignItems: 'center' }}>
                <Text style={styles.errorText}>{errorNotice}</Text>
                {errorNotice.toLowerCase().includes('upgrade') ? (
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#16a34a',
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: RADIUS.md,
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                    }}
                    onPress={() => {
                      onClose();
                      if (onOpenUpgradeModal) {
                        onOpenUpgradeModal();
                      } else {
                        router.push('/(tabs)/wallet');
                      }
                    }}
                  >
                    <Ionicons name="sparkles" size={15} color="#ffffff" />
                    <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 }}>Upgrade Plan Now 👑</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitFormBtn, { backgroundColor: currentCategory.color, marginTop: 12 }]}
              activeOpacity={0.85}
              onPress={handleFormSubmit}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.submitFormText}>{editingCrop ? "✏️ Update Crop Details" : "Save Crop & Field Details"}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* COMPACT CATEGORY PICKER MODAL */}
        <Modal visible={isCategoryPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Select Crop Category</Text>
                  <Text style={styles.modalSub}>Tap any category to filter crop list</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCategoryPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={styles.categoryGridContainer}>
                {INITIAL_CROP_CATEGORIES.map((cat) => {
                  const isSelected = cat.id === selectedCatId;
                  const count = allCrops.filter((c) => c.categoryId === cat.id).length;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.compactGridTile,
                        isSelected
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : { backgroundColor: cat.bg, borderColor: 'transparent' },
                      ]}
                      activeOpacity={0.8}
                      onPress={() => handleSelectCategory(cat.id)}
                    >
                      <Ionicons name={cat.icon as any} size={15} color={isSelected ? '#ffffff' : cat.color} />
                      <Text style={[styles.compactTileTitle, { color: isSelected ? '#ffffff' : cat.color }]} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <View style={[styles.compactTileBadge, { backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.7)' }]}>
                        <Text style={[styles.compactTileBadgeText, { color: isSelected ? '#ffffff' : cat.color }]}>
                          {count}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>

        {/* COMPACT CROP ITEMS PICKER MODAL */}
        <Modal visible={isCropPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Available Crops ({filteredCrops.length})</Text>
                  <Text style={styles.modalSub}>Category: {currentCategory.name}</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCropPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                <View style={styles.categoryGridContainer}>
                  {filteredCrops.length > 0 ? (
                    filteredCrops.map((crop) => {
                      const isCont = (crop.harvestType || 'CONTINUOUS') === 'CONTINUOUS';
                      return (
                        <TouchableOpacity
                          key={crop.id}
                          style={[
                            styles.compactGridTile,
                            { backgroundColor: currentCategory.bg, borderColor: currentCategory.color + '60' },
                          ]}
                          activeOpacity={0.8}
                          onPress={() => {
                            tap();
                            setIsCropPickerOpen(false);
                            handleSelectCropItem(crop);
                          }}
                        >
                          <Ionicons name="leaf" size={14} color={currentCategory.color} />
                          <Text style={[styles.compactTileTitle, { color: currentCategory.color }]} numberOfLines={1}>
                            {crop.name}{crop.variety ? ` · ${crop.variety}` : ''}
                          </Text>
                          <View style={[styles.compactTileBadge, isCont ? { backgroundColor: '#e0f2fe' } : { backgroundColor: '#fef3c7' }]}>
                            <Text style={[styles.compactTileBadgeText, isCont ? { color: '#0369a1' } : { color: '#b45309' }]}>
                              {isCont ? 'Daily' : '1-Time'}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  ) : (
                    <View style={styles.emptyWrap}>
                      <Ionicons name="leaf-outline" size={28} color="#cbd5e1" />
                      <Text style={styles.emptyText}>No crops found in this category.</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* CALENDAR DATE PICKER MODAL */}
        <CalendarDatePickerModal
          visible={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          onSelectDate={(formattedDate, season) => {
            setSowingDate(formattedDate);
            setSelectedSeason(season);
          }}
          initialDate={sowingDate}
        />
        {/* COMPACT LAND AREA UNIT PICKER MODAL */}
        <Modal visible={isAreaUnitPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Select Land Area Unit</Text>
                  <Text style={styles.modalSub}>Tap your preferred unit of land measurement</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsAreaUnitPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 8, paddingVertical: 8 }}>
                {LAND_AREA_UNITS.map((u) => {
                  const isSelected = u.unit === selectedAreaUnit;
                  return (
                    <TouchableOpacity
                      key={u.unit}
                      style={[
                        styles.unitOptionRow,
                        isSelected && { backgroundColor: '#f0fdf4', borderColor: '#16a34a' },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedAreaUnit(u.unit);
                        setIsAreaUnitPickerOpen(false);
                      }}
                    >
                      <Ionicons name="map-outline" size={16} color={isSelected ? '#16a34a' : '#64748b'} />
                      <Text style={[styles.unitOptionText, isSelected && { color: '#16a34a', fontFamily: FONT.bold }]}>
                        {u.label}
                      </Text>
                      {isSelected ? <Ionicons name="checkmark-circle" size={18} color="#16a34a" /> : null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 32,
    ...premiumShadow('#000000', 'lg'),
  },
  pickerModalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 32,
    ...premiumShadow('#000000', 'lg'),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  categorySelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    maxWidth: '48%',
  },
  categorySelectText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    flexShrink: 1,
  },
  compactSearchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  compactSearchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    padding: 0,
  },
  inputLabelCompact: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  compactStageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  compactStageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    flexGrow: 1,
  },
  compactStageText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
  },
  compactFormInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 40,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  selectPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginTop: 4,
    marginBottom: 8,
  },
  selectPromptTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  selectPromptSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  cropDropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  cropDropdownTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  cropDropdownSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  categoryGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 6,
  },
  compactGridTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    paddingHorizontal: 9,
    paddingVertical: 8,
  },
  compactTileTitle: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  compactTileBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  compactTileBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
  },
  categoryOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: 10,
  },
  catOptionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catOptionTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  countBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  countBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  examplesTagBox: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  examplesTagText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  listHeader: {
    marginBottom: 8,
  },
  listHeaderTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  cropListScroll: {
    maxHeight: 380,
  },
  compactCropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginBottom: 6,
    gap: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  compactCropIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactCropName: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  miniHarvestBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  miniHarvestBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  cropRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 8,
    gap: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  cropIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCropBox: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: SPACING.md,
  },
  customCropHint: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 4,
  },
  cropName: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  cropDesc: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 5,
  },
  miniBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  miniBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },
  selectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
  },
  selectedCropTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  selectedCropSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
  },
  readOnlyNoticeBox: {
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 10,
    gap: 4,
  },
  readOnlyNoticeTitle: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  readOnlyNoticeSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    fontFamily: FONT.medium,
  },
  calendarSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 40,
  },
  calendarSelectorDate: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  calendarSelectorSeason: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
    marginTop: 2,
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 4,
  },
  unitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  unitChipText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#475569',
  },
  priceWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  currencySymbol: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  priceInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  unitSuffix: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#dc2626',
    marginTop: 8,
  },
  submitFormBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 18,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
  },
  submitFormText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 14.5,
  },
  compactMiniChip: {
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  compactMiniText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
  compactCategoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  compactCategoryText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  cropSelectBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    marginBottom: 6,
  },
  cropSelectTextLarge: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  dropdownUnitSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    height: 40,
  },
  dropdownUnitSelectorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  unitOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  unitOptionText: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  saleInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginTop: 8,
  },
  saleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  saleCardTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
});
