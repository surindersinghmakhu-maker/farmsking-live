import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useLookupCropByCropId, useUpdateCrop } from '@/src/hooks/useCrops';
import { CropLookupResult } from '@/src/api/crops.api';
import { INITIAL_CROP_CATEGORIES, CROP_UNITS, LAND_AREA_UNITS, IRRIGATION_TYPES, HarvestType, IrrigationType, LandAreaUnit, CropUnit } from '@/constants/cropCategoriesData';

const theme = RoleThemes.SUPER_ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

type Stage = 'PLANTATION' | 'VEGETATIVE' | 'FLOWERING' | 'HARVESTING' | 'COMPLETED';

const STAGES: { value: Stage; label: string; icon: string; color: string }[] = [
  { value: 'PLANTATION', label: '🌱 Plantation', icon: 'leaf', color: '#d97706' },
  { value: 'VEGETATIVE', label: '🌿 Vegetative', icon: 'bar-chart', color: '#0284c7' },
  { value: 'FLOWERING', label: '🌸 Flowering', icon: 'flower', color: '#e11d48' },
  { value: 'HARVESTING', label: '🌾 Harvesting', icon: 'basket', color: '#16a34a' },
  { value: 'COMPLETED', label: '🏁 Completed', icon: 'checkmark-circle', color: '#475569' },
];

export default function SuperCropEditScreen() {
  const [cropIdInput, setCropIdInput] = useState('');
  const [crop, setCrop] = useState<CropLookupResult | null>(null);

  // Form Fields pre-filled from target crop
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [fieldName, setFieldName] = useState('');
  const [area, setArea] = useState('');
  const [areaUnit, setAreaUnit] = useState<LandAreaUnit>('Killa (Acre)');
  const [plantCount, setPlantCount] = useState('');
  const [sowingDate, setSowingDate] = useState('');
  const [stage, setStage] = useState<Stage>('PLANTATION');
  const [selectedCatId, setSelectedCatId] = useState<string>('cereals');
  const [irrigation, setIrrigation] = useState<IrrigationType>('Tube Well / Borewell');
  const [harvestPattern, setHarvestPattern] = useState<HarvestType>('CONTINUOUS');
  const [cropUnit, setCropUnit] = useState<CropUnit>('KG');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [notes, setNotes] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  const lookup = useLookupCropByCropId();
  const update = useUpdateCrop();

  const handleLookup = () => {
    const code = cropIdInput.trim();
    if (!code) return;
    tap();
    setSavedMsg('');
    lookup.mutate(code, {
      onSuccess: (result) => {
        setCrop(result);
        setCropName(result.cropName ?? '');
        setVariety(result.variety ?? '');
        setFieldName(result.plot?.name ?? '');

        // Area & unit parsing
        if (result.area != null) {
          setArea(String(result.area));
        } else {
          setArea('1');
        }

        if (result.plot?.areaUnit) {
          const found = LAND_AREA_UNITS.find(u => u.unit.toLowerCase().includes(result.plot.areaUnit.toLowerCase()));
          if (found) setAreaUnit(found.unit);
        }

        setPlantCount(result.plantCount != null ? String(result.plantCount) : '');
        setSowingDate(result.sowingDate ? result.sowingDate.slice(0, 10) : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }));
        setStage(result.stage ?? 'PLANTATION');

        if (result.category) {
          const matched = INITIAL_CROP_CATEGORIES.find(c => c.name.toLowerCase().includes((result.category || '').toLowerCase()));
          if (matched) setSelectedCatId(matched.id);
        }

        if (result.plot?.irrigationType) {
          setIrrigation(result.plot.irrigationType as IrrigationType);
        }

        if (result.harvestType) {
          setHarvestPattern(result.harvestType);
        }

        if (result.unit) {
          setCropUnit(result.unit as CropUnit);
        }

        const priceVal = result.pricePerUnit || result.maxPrice || result.minPrice;
        if (priceVal != null) {
          setPricePerUnit(String(priceVal));
        } else {
          setPricePerUnit('50');
        }

        setNotes(result.notes ?? '');
      },
      onError: () => setCrop(null),
    });
  };

  const handleSave = () => {
    if (!crop) return;
    tap();
    setSavedMsg('');
    update.mutate(
      {
        id: crop.id,
        payload: {
          cropName: cropName.trim() || undefined,
          variety: variety.trim() || undefined,
          area: area.trim() ? Number(area) : undefined,
          plantCount: plantCount.trim() ? Number(plantCount) : undefined,
          sowingDate: sowingDate.trim() || undefined,
          stage,
          unit: cropUnit,
          pricePerUnit: pricePerUnit.trim() ? Number(pricePerUnit) : undefined,
          harvestType: harvestPattern,
          notes: notes.trim() || undefined,
        },
      },
      {
        onSuccess: (updated) => {
          setCrop((prev) => (prev ? { ...prev, ...updated } : prev));
          setSavedMsg(`✅ Crop #${crop.cropId || crop.id} updated successfully!`);
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Super Admin — Edit Crop</Text>
        <Text style={styles.heroSubtitle}>Enter Crop ID to pre-fill farmer's full crop details and edit safely</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Enter Crop ID (e.g. CR-482910)..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={cropIdInput}
            onChangeText={setCropIdInput}
            autoCapitalize="characters"
            onSubmitEditing={handleLookup}
          />
          <TouchableOpacity onPress={handleLookup} disabled={lookup.isPending} activeOpacity={0.8}>
            {lookup.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="arrow-forward-circle" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {lookup.isError ? (
          <View style={styles.emptyCenter}>
            <Ionicons name="alert-circle-outline" size={36} color="#dc2626" />
            <Text style={styles.errorText}>No crop found with Crop ID "{cropIdInput}".</Text>
          </View>
        ) : null}

        {!crop && !lookup.isError ? (
          <View style={styles.emptyCenter}>
            <Ionicons name="leaf-outline" size={44} color="#cbd5e1" />
            <Text style={styles.emptyText}>Enter a Crop ID above to load farmer's full crop data.</Text>
          </View>
        ) : null}

        {crop ? (
          <>
            {/* Read-Only Target Crop Header Badge */}
            <View style={[styles.readOnlyHeaderCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={styles.cropIdBadge}>
                  <Ionicons name="key" size={14} color="#7c3aed" />
                  <Text style={styles.cropIdBadgeText}>Crop ID: {crop.cropId || crop.id} (Read-Only)</Text>
                </View>
                <View style={styles.readOnlyTag}>
                  <Text style={styles.readOnlyTagText}>🔒 Locked Target</Text>
                </View>
              </View>

              <View style={{ marginTop: 8, gap: 3 }}>
                <Text style={styles.contextLine}>
                  <Ionicons name="person" size={13} color="#475569" /> Farmer: <Text style={{ fontFamily: FONT.bold }}>{crop.plot?.farm?.owner?.name || 'Farmer'}</Text>
                  {crop.plot?.farm?.owner?.kingId ? ` (🔑 ${crop.plot.farm.owner.kingId})` : ''}
                </Text>
                <Text style={styles.contextLine}>📱 Mobile: {crop.plot?.farm?.owner?.mobile || 'N/A'}</Text>
                <Text style={styles.contextLine}>🌾 Farm & Plot: {crop.plot?.farm?.name || 'Farm'} → {crop.plot?.name || 'Plot'}</Text>
              </View>
            </View>

            {/* Complete Add / Edit Crop Data Form */}
            <View style={[styles.formCard, premiumShadow('#0f172a', 'sm')]}>
              <Text style={styles.formSectionHeader}>📋 Full Farmer Crop Specifications</Text>

              {/* 1. Category */}
              <Text style={styles.label}>Crop Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {INITIAL_CROP_CATEGORIES.map((cat) => {
                  const isSelected = cat.id === selectedCatId;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.chip,
                        isSelected ? { backgroundColor: cat.color, borderColor: cat.color } : { backgroundColor: cat.bg, borderColor: '#cbd5e1' },
                      ]}
                      onPress={() => { tap(); setSelectedCatId(cat.id); }}
                    >
                      <Ionicons name={cat.icon as any} size={13} color={isSelected ? '#fff' : cat.color} />
                      <Text style={[styles.chipText, isSelected ? { color: '#fff', fontFamily: FONT.bold } : { color: cat.color }]}>{cat.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 2. Crop Name & Variety */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Crop Name *</Text>
                  <TextInput style={styles.input} value={cropName} onChangeText={setCropName} placeholder="Crop name" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Variety (Optional)</Text>
                  <TextInput style={styles.input} value={variety} onChangeText={setVariety} placeholder="Variety name" />
                </View>
              </View>

              {/* 3. Field Plot Name & Sowing Date */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Field / Plot Name</Text>
                  <TextInput style={styles.input} value={fieldName} onChangeText={setFieldName} placeholder="Plot name" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Sowing Date</Text>
                  <TextInput style={styles.input} value={sowingDate} onChangeText={setSowingDate} placeholder="Sowing date" />
                </View>
              </View>

              {/* 4. Crop Stage */}
              <Text style={styles.label}>Crop Stage *</Text>
              <View style={styles.chipRow}>
                {STAGES.map((st) => {
                  const isSelected = stage === st.value;
                  return (
                    <TouchableOpacity
                      key={st.value}
                      style={[styles.chip, isSelected && { backgroundColor: st.color, borderColor: st.color }]}
                      onPress={() => { tap(); setStage(st.value); }}
                    >
                      <Text style={[styles.chipText, isSelected && { color: '#fff', fontFamily: FONT.bold }]}>{st.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 5. Area Size, Land Unit, Plant Count */}
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Area Size *</Text>
                  <TextInput style={styles.input} value={area} onChangeText={setArea} keyboardType="numeric" placeholder="1" />
                </View>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.label}>Land Unit *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                    {LAND_AREA_UNITS.map((u) => {
                      const isSel = u.unit === areaUnit;
                      return (
                        <TouchableOpacity
                          key={u.unit}
                          style={[styles.chip, isSel && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]}
                          onPress={() => { tap(); setAreaUnit(u.unit); }}
                        >
                          <Text style={[styles.chipText, isSel && { color: '#fff', fontFamily: FONT.bold }]}>{u.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>No. of Plants</Text>
                  <TextInput style={styles.input} value={plantCount} onChangeText={setPlantCount} keyboardType="numeric" placeholder="Opt." />
                </View>
              </View>

              {/* 6. Irrigation System */}
              <Text style={styles.label}>Irrigation System *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 5 }}>
                {IRRIGATION_TYPES.map((irr) => {
                  const isSel = irr.type === irrigation;
                  return (
                    <TouchableOpacity
                      key={irr.type}
                      style={[styles.chip, isSel && { backgroundColor: '#0284c7', borderColor: '#0284c7' }]}
                      onPress={() => { tap(); setIrrigation(irr.type); }}
                    >
                      <Ionicons name={irr.icon as any} size={12} color={isSel ? '#fff' : '#0284c7'} />
                      <Text style={[styles.chipText, isSel && { color: '#fff', fontFamily: FONT.bold }]}>{irr.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 7. Harvest Pattern */}
              <Text style={styles.label}>Harvest Pattern *</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <TouchableOpacity
                  style={[styles.chip, { flex: 1, justifyContent: 'center' }, harvestPattern === 'CONTINUOUS' && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]}
                  onPress={() => { tap(); setHarvestPattern('CONTINUOUS'); }}
                >
                  <Text style={[styles.chipText, harvestPattern === 'CONTINUOUS' && { color: '#fff', fontFamily: FONT.bold }]}>Daily (ਸੁਭਾ/ਸ਼ਾਮ)</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.chip, { flex: 1, justifyContent: 'center' }, harvestPattern === 'ONE_TIME' && { backgroundColor: '#d97706', borderColor: '#d97706' }]}
                  onPress={() => { tap(); setHarvestPattern('ONE_TIME'); }}
                >
                  <Text style={[styles.chipText, harvestPattern === 'ONE_TIME' && { color: '#fff', fontFamily: FONT.bold }]}>🌾 1-Time Harvest</Text>
                </TouchableOpacity>
              </View>

              {/* 8. Estimated Max Price & Crop Unit */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Estimated Max Price (₹)</Text>
                  <TextInput style={styles.input} value={pricePerUnit} onChangeText={setPricePerUnit} keyboardType="numeric" placeholder="50" />
                </View>
                <View style={{ flex: 1.2 }}>
                  <Text style={styles.label}>Crop Unit *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                    {CROP_UNITS.map((u) => {
                      const isSel = u.unit === cropUnit;
                      return (
                        <TouchableOpacity
                          key={u.unit}
                          style={[styles.chip, isSel && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]}
                          onPress={() => { tap(); setCropUnit(u.unit); }}
                        >
                          <Text style={[styles.chipText, isSel && { color: '#fff', fontFamily: FONT.bold }]}>{u.unit}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>

              {/* 9. Notes */}
              <Text style={styles.label}>Notes / Remarks</Text>
              <TextInput
                style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Crop notes..."
                multiline
              />

              {update.isError ? <Text style={styles.errorText}>Failed to save changes. Please try again.</Text> : null}
              {savedMsg ? <Text style={styles.successText}>{savedMsg}</Text> : null}

              {/* Save Button specifying the target Crop ID */}
              <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave} disabled={update.isPending}>
                {update.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                    <Text style={styles.saveBtnText}>Save & Update Crop #{crop.cropId || crop.id}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.lg },
  heroTitle: { color: '#fff', fontSize: 19, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 11.5, fontFamily: FONT.medium, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 12,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13.5, fontFamily: FONT.bold },
  list: { padding: SPACING.md, gap: 12, paddingBottom: 36 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyText: { color: '#64748b', fontSize: 13, fontFamily: FONT.medium },
  errorText: { color: '#dc2626', fontSize: 12.5, fontFamily: FONT.bold, marginVertical: 4 },
  successText: { color: '#16a34a', fontSize: 12.5, fontFamily: FONT.bold, marginVertical: 4 },
  readOnlyHeaderCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 12, borderWidth: 1.5, borderColor: '#ddd6fe' },
  cropIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f3e8ff', borderWidth: 1, borderColor: '#c084fc', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  cropIdBadgeText: { fontSize: 13, fontFamily: FONT.extraBold, color: '#7c3aed' },
  readOnlyTag: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.sm },
  readOnlyTagText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#64748b' },
  contextLine: { fontSize: 12, fontFamily: FONT.medium, color: '#334155' },
  formCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 8 },
  formSectionHeader: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 4 },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  chipText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#334155' },
  saveBtn: {
    marginTop: 14,
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 14, fontFamily: FONT.extraBold },
});
