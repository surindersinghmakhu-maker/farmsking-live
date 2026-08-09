import React, { useState, useMemo } from 'react';
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

export interface CropFormValues {
  crop: CropItem;
  category: CropCategory;
  fieldName: string;
  area: string;
  areaUnit: LandAreaUnit;
  sowingDate: string;
  unit: CropUnit;
  pricePerUnit: string;
  stage: 'HARVESTING' | 'SOWING' | 'GROWTH';
  harvestType: HarvestType;
  irrigationType: IrrigationType;
}

interface CropCategorySelectorModalProps {
  visible: boolean;
  onClose: () => void;
  onSaveCropForm: (values: CropFormValues) => void;
  customCrops?: CropItem[];
}

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const CropCategorySelectorModal: React.FC<CropCategorySelectorModalProps> = ({
  visible,
  onClose,
  onSaveCropForm,
  customCrops,
}) => {
  const [selectedCatId, setSelectedCatId] = useState<string>('flowers');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCategoryPickerOpen, setIsCategoryPickerOpen] = useState<boolean>(false);

  // Step 1: Crop List Selection -> Step 2: Attached Details Form
  const [step, setStep] = useState<'LIST' | 'FORM'>('LIST');
  const [selectedCrop, setSelectedCrop] = useState<CropItem | null>(null);

  // Form Fields
  const [fieldName, setFieldName] = useState('');
  const [area, setArea] = useState('4');
  const [selectedAreaUnit, setSelectedAreaUnit] = useState<LandAreaUnit>('Killa (Acre)');
  const [selectedIrrigation, setSelectedIrrigation] = useState<IrrigationType>('Tube Well / Borewell');
  const [cropStage, setCropStage] = useState<'HARVESTING' | 'SOWING' | 'GROWTH'>('HARVESTING');
  const [sowingDate, setSowingDate] = useState('15 Oct 2026');
  const [selectedUnit, setSelectedUnit] = useState<CropUnit>('KG');
  const [pricePerUnit, setPricePerUnit] = useState('50');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // "Other Crops" has no preset list — the farmer types their own crop name.
  const [customCropName, setCustomCropName] = useState('');
  const [customHarvestType, setCustomHarvestType] = useState<HarvestType>('CONTINUOUS');

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
    setFieldName(`${crop.hindiName || crop.name} Plot 1`);
    setSelectedUnit(crop.defaultUnit || 'KG');
    setPricePerUnit(crop.defaultPrice ? String(crop.defaultPrice) : '50');
    setStep('FORM');
  };

  const handleFormSubmit = () => {
    if (!fieldName.trim() || !area.trim()) {
      setErrorNotice('⚠️ Kripya Field Name aur Land Area Size bharein.');
      return;
    }
    tap();
    if (selectedCrop) {
      onSaveCropForm({
        crop: selectedCrop,
        category: currentCategory,
        fieldName: fieldName.trim(),
        area: area.trim(),
        areaUnit: selectedAreaUnit,
        sowingDate,
        unit: selectedUnit,
        pricePerUnit: pricePerUnit.trim(),
        stage: cropStage,
        harvestType: selectedCrop.harvestType || 'CONTINUOUS',
        irrigationType: selectedIrrigation,
      });
    }
    // Reset state & close
    setStep('LIST');
    setSelectedCrop(null);
    setFieldName('');
    setArea('');
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
            {step === 'FORM' ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => {
                  tap();
                  setStep('LIST');
                }}
              >
                <Ionicons name="arrow-back" size={18} color="#0f172a" />
              </TouchableOpacity>
            ) : null}
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>
                {step === 'LIST' ? 'Add New Crop to My Farm' : 'Crop Details Form'}
              </Text>
              <Text style={styles.modalSub}>
                {step === 'LIST'
                  ? 'Select category & crop name from intuitive categories below'
                  : `Fill land area, water source & stage for ${selectedCrop?.name}`}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          {step === 'LIST' ? (
            <>
              {/* Category Dropdown Selector Field */}
              <Text style={styles.dropdownLabel}>Selected Crop Category (Tap to change category)</Text>
              <TouchableOpacity
                style={[styles.dropdownSelector, { borderColor: currentCategory.color, backgroundColor: currentCategory.bg }]}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  setIsCategoryPickerOpen(true);
                }}
              >
                <View style={[styles.catIconWrap, { backgroundColor: '#ffffff' }]}>
                  <Ionicons name={currentCategory.icon as any} size={20} color={currentCategory.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={[styles.dropdownSelectedText, { color: currentCategory.color }]} numberOfLines={1}>
                      {currentCategory.name} ({currentCategory.hindiName})
                    </Text>
                  </View>
                  {currentCategory.examples ? (
                    <Text style={styles.dropdownSubText} numberOfLines={1}>
                      Includes: {currentCategory.examples}
                    </Text>
                  ) : null}
                </View>
                <Ionicons name="chevron-down-circle" size={22} color={currentCategory.color} />
              </TouchableOpacity>

              {/* Horizontal Scrollable Category Quick Bar */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catQuickBar}>
                {INITIAL_CROP_CATEGORIES.map((cat) => {
                  const isSelected = cat.id === selectedCatId;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catQuickPill,
                        isSelected
                          ? { backgroundColor: cat.color, borderColor: cat.color }
                          : { backgroundColor: cat.bg, borderColor: 'transparent' },
                      ]}
                      onPress={() => handleSelectCategory(cat.id)}
                    >
                      <Ionicons name={cat.icon as any} size={14} color={isSelected ? '#ffffff' : cat.color} />
                      <Text
                        style={[
                          styles.catQuickText,
                          isSelected ? { color: '#ffffff', fontFamily: FONT.bold } : { color: cat.color },
                        ]}
                      >
                        {cat.hindiName || cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Search bar inside category */}
              {selectedCatId !== 'other' ? (
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={17} color="#94a3b8" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={`Search crop name in ${currentCategory.name}...`}
                    placeholderTextColor="#94a3b8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}

              {selectedCatId === 'other' ? (
                /* OTHER CROPS: no preset list — farmer types their own crop name */
                <View style={styles.customCropBox}>
                  <Text style={styles.customCropHint}>
                    Ye category kisi bhi listed crop me na aane wali fasal ke liye hai. Apni fasal ka naam khud likhein.
                  </Text>

                  <Text style={styles.inputLabel}>Crop Name (फसल का नाम) *</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. Dragon Fruit / अपनी फसल का नाम"
                    placeholderTextColor="#94a3b8"
                    value={customCropName}
                    onChangeText={setCustomCropName}
                  />

                  <Text style={styles.inputLabel}>Harvest Type (कटाई का प्रकार) *</Text>
                  <View style={styles.unitGrid}>
                    {[
                      { key: 'CONTINUOUS' as HarvestType, label: '🔄 Daily / Continuous' },
                      { key: 'ONE_TIME' as HarvestType, label: '🌾 One-Time Seasonal' },
                    ].map((h) => {
                      const isSelected = h.key === customHarvestType;
                      return (
                        <TouchableOpacity
                          key={h.key}
                          style={[
                            styles.unitChip,
                            isSelected && { backgroundColor: currentCategory.color, borderColor: currentCategory.color },
                          ]}
                          onPress={() => {
                            tap();
                            setCustomHarvestType(h.key);
                          }}
                        >
                          <Text style={[styles.unitChipText, isSelected && { color: '#ffffff', fontFamily: FONT.bold }]}>
                            {h.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <TouchableOpacity
                    style={[styles.submitFormBtn, { backgroundColor: currentCategory.color, opacity: customCropName.trim() ? 1 : 0.5 }]}
                    activeOpacity={0.85}
                    onPress={handleAddCustomCrop}
                    disabled={!customCropName.trim()}
                  >
                    <Ionicons name="add-circle" size={18} color="#ffffff" />
                    <Text style={styles.submitFormText}>Continue with This Crop</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {/* List Header */}
                  <View style={styles.listHeader}>
                    <Text style={styles.listHeaderTitle}>
                      Available Crop Names in {currentCategory.name} ({filteredCrops.length})
                    </Text>
                  </View>

                  {/* Crop List */}
                  <ScrollView style={styles.cropListScroll} showsVerticalScrollIndicator={false}>
                    {filteredCrops.length > 0 ? (
                      filteredCrops.map((crop) => {
                        const isCont = (crop.harvestType || 'CONTINUOUS') === 'CONTINUOUS';
                        return (
                          <TouchableOpacity
                            key={crop.id}
                            style={[styles.cropRow, premiumShadow('#0f172a', 'sm')]}
                            activeOpacity={0.8}
                            onPress={() => handleSelectCropItem(crop)}
                          >
                            <View style={[styles.cropIconBg, { backgroundColor: currentCategory.bg }]}>
                              <Ionicons name="leaf" size={20} color={currentCategory.color} />
                            </View>

                            <View style={{ flex: 1 }}>
                              <Text style={styles.cropName}>{crop.name}</Text>
                              {crop.variety ? (
                                <Text style={styles.cropDesc}>Variety: {crop.variety}</Text>
                              ) : null}
                              <View style={styles.badgeRow}>
                                <View style={[styles.miniBadge, isCont ? { backgroundColor: '#e0f2fe' } : { backgroundColor: '#fef3c7' }]}>
                                  <Text style={[styles.miniBadgeText, isCont ? { color: '#0369a1' } : { color: '#b45309' }]}>
                                    {isCont ? '🔄 Daily Harvest' : '🌾 One-Time Harvest'}
                                  </Text>
                                </View>
                                {crop.season ? (
                                  <View style={styles.miniBadge}>
                                    <Text style={styles.miniBadgeText}>{crop.season}</Text>
                                  </View>
                                ) : null}
                              </View>
                            </View>

                            <Ionicons name="add-circle" size={24} color={currentCategory.color} />
                          </TouchableOpacity>
                        );
                      })
                    ) : (
                      <View style={styles.emptyWrap}>
                        <Ionicons name="leaf-outline" size={32} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No crops found in this category.</Text>
                        <Text style={styles.emptySub}>Admin can add new crop names from Admin Panel.</Text>
                      </View>
                    )}
                  </ScrollView>
                </>
              )}
            </>
          ) : (
            /* STEP 2: ATTACHED CROP DETAILS FORM */
            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              {/* Selected Crop Banner */}
              <View style={[styles.selectedBanner, { backgroundColor: currentCategory.bg }]}>
                <Ionicons name="leaf" size={24} color={currentCategory.color} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.selectedCropTitle, { color: currentCategory.color }]}>
                    {selectedCrop?.name}
                  </Text>
                  <Text style={styles.selectedCropSub}>
                    Category: {currentCategory.name} {selectedCrop?.variety ? `· ${selectedCrop.variety}` : ''}
                  </Text>
                </View>
              </View>

              {/* READ ONLY HARVEST TYPE INFORMATIONAL NOTICE */}
              <View
                style={[
                  styles.readOnlyNoticeBox,
                  isContinuousHarvest
                    ? { backgroundColor: '#e0f2fe', borderColor: '#bae6fd' }
                    : { backgroundColor: '#fef3c7', borderColor: '#fde68a' },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={isContinuousHarvest ? 'sync-circle' : 'leaf'}
                    size={18}
                    color={isContinuousHarvest ? '#0284c7' : '#b45309'}
                  />
                  <Text
                    style={[
                      styles.readOnlyNoticeTitle,
                      isContinuousHarvest ? { color: '#0369a1' } : { color: '#92400e' },
                    ]}
                  >
                    {isContinuousHarvest
                      ? '🔄 Daily / Continuous Harvest Crop (दैनिक/निरंतर कटाई)'
                      : '🌾 One-Time Seasonal Harvest Crop (एक बार की कटाई)'}
                  </Text>
                  <Ionicons name="lock-closed-outline" size={13} color="#64748b" />
                </View>
                <Text
                  style={[
                    styles.readOnlyNoticeSub,
                    isContinuousHarvest ? { color: '#075985' } : { color: '#78350f' },
                  ]}
                >
                  {isContinuousHarvest
                    ? 'ℹ️ Read-Only Note: Is crop ki continuous harvesting hoti hai, isliye iska daily Mandi market price reflect kiya jayega!'
                    : 'ℹ️ Read-Only Note: Is crop ki ek hi baar seasonal harvest hoti hai, isliye iska daily rate na dikhakar single seasonal harvest price apply hoga.'}
                </Text>
              </View>

              {/* SOURCE OF WATER / IRRIGATION TYPE SELECTOR */}
              <Text style={styles.inputLabel}>Source of Water / Irrigation Type (सिंचाई का स्रोत) *</Text>
              <View style={styles.unitGrid}>
                {IRRIGATION_TYPES.map((irr) => {
                  const isSelected = irr.type === selectedIrrigation;
                  return (
                    <TouchableOpacity
                      key={irr.type}
                      style={[
                        styles.unitChip,
                        isSelected
                          ? { backgroundColor: '#0284c7', borderColor: '#0284c7' }
                          : { backgroundColor: '#f8fafc' },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedIrrigation(irr.type);
                      }}
                    >
                      <Ionicons
                        name={irr.icon as any}
                        size={13}
                        color={isSelected ? '#ffffff' : '#0369a1'}
                      />
                      <Text
                        style={[
                          styles.unitChipText,
                          isSelected ? { color: '#ffffff', fontFamily: FONT.bold } : { color: '#334155' },
                        ]}
                      >
                        {irr.hindiLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Crop Growth Stage Selector */}
              <Text style={styles.inputLabel}>Current Crop Stage (फसल की स्थिति) *</Text>
              <View style={styles.unitGrid}>
                {[
                  { key: 'HARVESTING', label: '🌾 Harvesting Ready (कटाई योग्य)', color: '#16a34a', bg: '#dcfce7' },
                  { key: 'GROWTH', label: '🌿 Vegetative Growth (बढ़वार)', color: '#0284c7', bg: '#e0f2fe' },
                  { key: 'SOWING', label: '🌱 Sowing / Germination (बुवाई)', color: '#d97706', bg: '#fef3c7' },
                ].map((st) => {
                  const isSelected = st.key === cropStage;
                  return (
                    <TouchableOpacity
                      key={st.key}
                      style={[
                        styles.unitChip,
                        isSelected
                          ? { backgroundColor: st.color, borderColor: st.color }
                          : { backgroundColor: '#f8fafc' },
                      ]}
                      onPress={() => {
                        tap();
                        setCropStage(st.key as any);
                      }}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          isSelected ? { color: '#ffffff', fontFamily: FONT.bold } : { color: '#334155' },
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Farm / Field Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. Plot 1 / Canal Field"
                placeholderTextColor="#94a3b8"
                value={fieldName}
                onChangeText={setFieldName}
              />

              {/* Land Area Value & Unit Selector */}
              <Text style={styles.inputLabel}>Land Area Unit (क्षेत्रफल की इकाई) *</Text>
              <View style={styles.unitGrid}>
                {LAND_AREA_UNITS.map((u) => {
                  const isSelected = u.unit === selectedAreaUnit;
                  return (
                    <TouchableOpacity
                      key={u.unit}
                      style={[
                        styles.unitChip,
                        isSelected && {
                          backgroundColor: '#16a34a',
                          borderColor: '#16a34a',
                        },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedAreaUnit(u.unit);
                      }}
                    >
                      <Ionicons
                        name="map-outline"
                        size={13}
                        color={isSelected ? '#ffffff' : '#475569'}
                      />
                      <Text
                        style={[
                          styles.unitChipText,
                          isSelected && { color: '#ffffff', fontFamily: FONT.bold },
                        ]}
                      >
                        {u.hindiLabel}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Total Area Size (in {selectedAreaUnit}) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder={`e.g. 4 ${selectedAreaUnit}`}
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={area}
                onChangeText={setArea}
              />

              {/* Crop Measurement Unit Selector */}
              <Text style={styles.inputLabel}>Crop Measurement Unit (फसल माप इकाई) *</Text>
              <View style={styles.unitGrid}>
                {CROP_UNITS.map((u) => {
                  const isSelected = u.unit === selectedUnit;
                  return (
                    <TouchableOpacity
                      key={u.unit}
                      style={[
                        styles.unitChip,
                        isSelected && {
                          backgroundColor: currentCategory.color,
                          borderColor: currentCategory.color,
                        },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedUnit(u.unit);
                      }}
                    >
                      <Ionicons
                        name={u.icon as any}
                        size={13}
                        color={isSelected ? '#ffffff' : '#475569'}
                      />
                      <Text
                        style={[
                          styles.unitChipText,
                          isSelected && { color: '#ffffff', fontFamily: FONT.bold },
                        ]}
                      >
                        {u.unit}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Price / Rate per Unit */}
              <Text style={styles.inputLabel}>
                Previous Sale Price per {selectedUnit} (₹) *
              </Text>
              <View style={styles.priceWrap}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder={`Rate per ${selectedUnit}`}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={pricePerUnit}
                  onChangeText={setPricePerUnit}
                />
                <Text style={styles.unitSuffix}>/ {selectedUnit}</Text>
              </View>

              <Text style={styles.inputLabel}>Sowing Date / Season</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. 15 Oct 2026"
                placeholderTextColor="#94a3b8"
                value={sowingDate}
                onChangeText={setSowingDate}
              />

              {errorNotice ? <Text style={styles.errorText}>{errorNotice}</Text> : null}

              <TouchableOpacity
                style={[styles.submitFormBtn, { backgroundColor: currentCategory.color }]}
                activeOpacity={0.85}
                onPress={handleFormSubmit}
              >
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={styles.submitFormText}>Save Crop & Field Details</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>

        {/* INTUITIVE CATEGORY DROPDOWN PICKER MODAL */}
        <Modal visible={isCategoryPickerOpen} transparent animationType="slide">
          <View style={styles.overlay}>
            <View style={styles.pickerModalCard}>
              <View style={styles.headerRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>All Agricultural Crop Categories ({INITIAL_CROP_CATEGORIES.length})</Text>
                  <Text style={styles.modalSub}>Tap any category to view & select crop names</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsCategoryPickerOpen(false)}>
                  <Ionicons name="close" size={20} color="#475569" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                {INITIAL_CROP_CATEGORIES.map((cat) => {
                  const isSelected = cat.id === selectedCatId;
                  const count = allCrops.filter((c) => c.categoryId === cat.id).length;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryOptionRow,
                        isSelected
                          ? { backgroundColor: cat.bg, borderColor: cat.color }
                          : { backgroundColor: '#ffffff', borderColor: '#f1f5f9' },
                        premiumShadow('#000000', 'sm'),
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handleSelectCategory(cat.id)}
                    >
                      <View style={[styles.catOptionIconBg, { backgroundColor: cat.bg }]}>
                        <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <Text style={[styles.catOptionTitle, isSelected && { color: cat.color, fontFamily: FONT.bold }]}>
                            {cat.name} ({cat.hindiName})
                          </Text>
                          <View style={[styles.countBadge, { backgroundColor: cat.bg }]}>
                            <Text style={[styles.countBadgeText, { color: cat.color }]}>{count} Crops</Text>
                          </View>
                        </View>

                        {/* REPRESENTATIVE CROP EXAMPLES BOX */}
                        {cat.examples ? (
                          <View style={styles.examplesTagBox}>
                            <Text style={styles.examplesTagText} numberOfLines={2}>
                              💡 Includes: {cat.examples}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {isSelected ? (
                        <Ionicons name="checkmark-circle" size={22} color={cat.color} />
                      ) : (
                        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
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
  dropdownLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 4,
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  catIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownSelectedText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  dropdownSubText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  catQuickBar: {
    marginBottom: 10,
  },
  catQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginRight: 6,
  },
  catQuickText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
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
    maxHeight: 340,
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
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
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
});
