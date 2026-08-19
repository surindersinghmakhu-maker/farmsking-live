import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useLookupCropByCropId, useUpdateCrop } from '@/src/hooks/useCrops';
import { CropLookupResult } from '@/src/api/crops.api';

const theme = RoleThemes.SUPER_ADMIN;

type Stage = CropLookupResult['stage'];

const STAGES: { value: Stage; label: string }[] = [
  { value: 'PLANTATION', label: 'Plantation' },
  { value: 'VEGETATIVE', label: 'Vegetative' },
  { value: 'FLOWERING', label: 'Flowering' },
  { value: 'HARVESTING', label: 'Harvesting' },
  { value: 'COMPLETED', label: 'Completed' },
];

export default function SuperCropEditScreen() {
  const [cropIdInput, setCropIdInput] = useState('');
  const [crop, setCrop] = useState<CropLookupResult | null>(null);
  const [cropName, setCropName] = useState('');
  const [variety, setVariety] = useState('');
  const [area, setArea] = useState('');
  const [plantCount, setPlantCount] = useState('');
  const [notes, setNotes] = useState('');
  const [stage, setStage] = useState<Stage | undefined>(undefined);
  const [savedMsg, setSavedMsg] = useState('');

  const lookup = useLookupCropByCropId();
  const update = useUpdateCrop();

  const handleLookup = () => {
    const code = cropIdInput.trim();
    if (!code) return;
    setSavedMsg('');
    lookup.mutate(code, {
      onSuccess: (result) => {
        setCrop(result);
        setCropName(result.cropName ?? '');
        setVariety(result.variety ?? '');
        setArea(result.area != null ? String(result.area) : '');
        setPlantCount(result.plantCount != null ? String(result.plantCount) : '');
        setNotes(result.notes ?? '');
        setStage(result.stage ?? undefined);
      },
      onError: () => setCrop(null),
    });
  };

  const handleSave = () => {
    if (!crop) return;
    setSavedMsg('');
    update.mutate(
      {
        id: crop.id,
        payload: {
          cropName: cropName.trim() || undefined,
          variety: variety.trim() || undefined,
          area: area.trim() ? Number(area) : undefined,
          plantCount: plantCount.trim() ? Number(plantCount) : undefined,
          notes: notes.trim() || undefined,
          stage,
        },
      },
      {
        onSuccess: (updated) => {
          setCrop((prev) => (prev ? { ...prev, ...updated } : prev));
          setSavedMsg('Crop updated successfully.');
        },
      },
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Edit Crop</Text>
        <Text style={styles.heroSubtitle}>Look up a crop by its Crop ID, then edit its details</Text>

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
          <TouchableOpacity onPress={handleLookup} disabled={lookup.isPending}>
            {lookup.isPending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="arrow-forward-circle" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {lookup.isError ? (
          <View style={styles.emptyCenter}>
            <Ionicons name="alert-circle-outline" size={36} color="#dc2626" />
            <Text style={styles.errorText}>No crop found with this Crop ID.</Text>
          </View>
        ) : null}

        {!crop && !lookup.isError ? (
          <View style={styles.emptyCenter}>
            <Ionicons name="leaf-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>Enter a Crop ID above to look it up.</Text>
          </View>
        ) : null}

        {crop ? (
          <>
            <View style={[styles.contextCard, premiumShadow('#0f172a', 'sm')]}>
              <Text style={styles.contextCropId}>{crop.cropId}</Text>
              <Text style={styles.contextLine}>
                <Ionicons name="person-outline" size={12} color="#64748b" /> {crop.plot.farm.owner.name}
                {crop.plot.farm.owner.kingId ? `  ·  🔑 ${crop.plot.farm.owner.kingId}` : ''}
              </Text>
              <Text style={styles.contextLine}>📱 {crop.plot.farm.owner.mobile}</Text>
              <Text style={styles.contextLine}>🌾 {crop.plot.farm.name} → {crop.plot.name}</Text>
            </View>

            <View style={[styles.formCard, premiumShadow('#0f172a', 'sm')]}>
              <Text style={styles.label}>Crop Name</Text>
              <TextInput style={styles.input} value={cropName} onChangeText={setCropName} placeholder="Crop name" />

              <Text style={styles.label}>Variety</Text>
              <TextInput style={styles.input} value={variety} onChangeText={setVariety} placeholder="Variety" />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Area</Text>
                  <TextInput style={styles.input} value={area} onChangeText={setArea} placeholder="Area" keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Plant Count</Text>
                  <TextInput style={styles.input} value={plantCount} onChangeText={setPlantCount} placeholder="Plant count" keyboardType="numeric" />
                </View>
              </View>

              <Text style={styles.label}>Stage</Text>
              <View style={styles.chipRow}>
                {STAGES.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.chip, stage === s.value && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setStage(s.value)}
                  >
                    <Text style={[styles.chipText, stage === s.value && { color: '#fff' }]}>{s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Notes</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Notes"
                multiline
              />

              {update.isError ? <Text style={styles.errorText}>Failed to save changes. Please try again.</Text> : null}
              {savedMsg ? <Text style={styles.successText}>{savedMsg}</Text> : null}

              <TouchableOpacity style={styles.saveBtn} activeOpacity={0.85} onPress={handleSave} disabled={update.isPending}>
                {update.isPending ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
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
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13.5, fontFamily: FONT.medium },
  list: { padding: SPACING.lg, gap: 12, paddingBottom: SPACING.xxl },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  emptyText: { color: '#64748b', fontSize: 13, fontFamily: FONT.medium },
  errorText: { color: '#dc2626', fontSize: 12.5, fontFamily: FONT.bold },
  successText: { color: '#16a34a', fontSize: 12.5, fontFamily: FONT.bold },
  contextCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 4 },
  contextCropId: { fontSize: 15, fontFamily: FONT.extraBold, color: theme.primary, letterSpacing: 0.5 },
  contextLine: { fontSize: 12.5, fontFamily: FONT.medium, color: '#334155' },
  formCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 6 },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b', marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  chipText: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
  saveBtn: {
    marginTop: 14,
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnText: { color: '#fff', fontSize: 13.5, fontFamily: FONT.extraBold },
});
