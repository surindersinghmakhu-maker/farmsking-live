import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { SprayItemTemplate, SprayType } from '@/src/types/api';
import {
  useMySprayItemTemplates,
  useCreateSprayItemTemplate,
  useUpdateSprayItemTemplate,
  useDeleteSprayItemTemplate,
} from '@/src/hooks/useSprayItemTemplates';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const SPRAY_TYPE_OPTIONS: { key: SprayType; label: string }[] = [
  { key: 'PESTICIDE', label: '🐛 Pesticide' },
  { key: 'FUNGICIDE', label: '🍄 Fungicide' },
  { key: 'HERBICIDE', label: '🌿 Herbicide' },
  { key: 'INSECTICIDE', label: '🦟 Insecticide' },
  { key: 'GROWTH_REGULATOR', label: '📈 Growth Regulator' },
  { key: 'OTHER', label: '⚗️ Other / Fertilizer' },
];

const DOSE_UNITS = ['ml', 'gram', 'KG'] as const;
type DoseUnit = (typeof DOSE_UNITS)[number];

/** Splits a saved dose string like "2 ml" back into its value and unit, for prefilling the edit form. */
function splitDose(dose: string | undefined | null): { value: string; unit: DoseUnit } {
  if (!dose) return { value: '', unit: 'ml' };
  const match = DOSE_UNITS.find((u) => dose.trim().toLowerCase().endsWith(u.toLowerCase()));
  if (!match) return { value: dose, unit: 'ml' };
  return { value: dose.slice(0, dose.length - match.length).trim(), unit: match };
}

/** Advisor's reusable item/dose/alternatives library — quick reference table, add/edit/delete rows. */
export function ItemTemplatesSection({ themeColor }: { themeColor: string }) {
  const { data: templates, isLoading } = useMySprayItemTemplates();
  const createTemplate = useCreateSprayItemTemplate();
  const updateTemplate = useUpdateSprayItemTemplate();
  const deleteTemplate = useDeleteSprayItemTemplate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [item, setItem] = useState('');
  const [sprayType, setSprayType] = useState<SprayType | undefined>(undefined);
  const [dose, setDose] = useState('');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('ml');
  const [alt1, setAlt1] = useState('');
  const [alt2, setAlt2] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isModalOpen) return;
    if (!editingId) {
      setItem('');
      setSprayType(undefined);
      setDose('');
      setDoseUnit('ml');
      setAlt1('');
      setAlt2('');
    }
    setError(null);
  }, [isModalOpen, editingId]);

  const openNew = () => {
    tap();
    setEditingId(null);
    setIsModalOpen(true);
  };

  const openEdit = (tpl: SprayItemTemplate) => {
    tap();
    setEditingId(tpl.id);
    setItem(tpl.item);
    setSprayType(tpl.sprayType ?? undefined);
    const parsedDose = splitDose(tpl.dose);
    setDose(parsedDose.value);
    setDoseUnit(parsedDose.unit);
    setAlt1(tpl.alternative1 ?? '');
    setAlt2(tpl.alternative2 ?? '');
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!item.trim()) {
      setError('Kripya item ka naam bharein.');
      return;
    }
    const payload = {
      item: item.trim(),
      sprayType,
      dose: dose.trim() ? `${dose.trim()} ${doseUnit}` : undefined,
      alternative1: alt1.trim() || undefined,
      alternative2: alt2.trim() || undefined,
    };
    try {
      if (editingId) {
        await updateTemplate.mutateAsync({ id: editingId, payload });
      } else {
        await createTemplate.mutateAsync(payload);
      }
      setIsModalOpen(false);
      setEditingId(null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Save nahi ho saka, dobara try karein.');
    }
  };

  const handleDelete = (tpl: SprayItemTemplate) => {
    const doDelete = () => deleteTemplate.mutate(tpl.id);
    if (Platform.OS === 'web') {
      if (confirm(`Delete template "${tpl.item}"?`)) doDelete();
    } else {
      Alert.alert('Delete Template?', `"${tpl.item}" template hata diya jayega.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <View style={itemTplStyles.card}>
      <View style={itemTplStyles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={itemTplStyles.headerTitle}>Dose Items</Text>
          <Text style={itemTplStyles.headerSub}>Item, Dose aur Alternatives ki quick-fill library.</Text>
        </View>
        <TouchableOpacity style={[itemTplStyles.addBtn, { backgroundColor: themeColor }]} activeOpacity={0.85} onPress={openNew}>
          <Ionicons name="add-circle" size={16} color="#ffffff" />
          <Text style={itemTplStyles.addBtnText}>+ Add Item</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={themeColor} style={{ marginVertical: 16 }} />
      ) : (templates ?? []).length === 0 ? (
        <Text style={itemTplStyles.emptyText}>Abhi koi dose item nahi hai. "+ Add Item" se banayein.</Text>
      ) : (
        <View style={itemTplStyles.compactList}>
          {(templates ?? []).map((tpl, idx) => (
            <View
              key={tpl.id}
              style={[itemTplStyles.compactRow, idx === (templates ?? []).length - 1 && { borderBottomWidth: 0 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={itemTplStyles.compactItemText}>
                  {tpl.item}
                  {tpl.dose ? <Text style={itemTplStyles.compactDoseText}> · {tpl.dose}</Text> : null}
                </Text>
                {tpl.alternative1 || tpl.alternative2 ? (
                  <Text style={itemTplStyles.compactAltText}>
                    Alt: {[tpl.alternative1, tpl.alternative2].filter(Boolean).join(', ')}
                  </Text>
                ) : null}
              </View>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity onPress={() => openEdit(tpl)}>
                  <Ionicons name="create-outline" size={17} color={themeColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(tpl)}>
                  <Ionicons name="trash-outline" size={17} color="#dc2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
        <View style={itemTplStyles.modalOverlay}>
          <View style={itemTplStyles.modalCard}>
            <View style={itemTplStyles.modalHeaderRow}>
              <Text style={itemTplStyles.modalTitle}>{editingId ? '✏️ Edit Dose Item' : '🧪 Add Dose Item'}</Text>
              <TouchableOpacity style={itemTplStyles.closeBtn} onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={itemTplStyles.modalLabel}>Item *</Text>
              <TextInput style={itemTplStyles.modalInput} value={item} onChangeText={setItem} placeholder="e.g. Propiconazole 25% EC" placeholderTextColor="#94a3b8" />

              <Text style={itemTplStyles.modalLabel}>Category (Spray Type)</Text>
              <View style={itemTplStyles.chipRow}>
                {SPRAY_TYPE_OPTIONS.map((opt) => {
                  const isSelected = opt.key === sprayType;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[itemTplStyles.chip, isSelected && { backgroundColor: themeColor, borderColor: themeColor }]}
                      onPress={() => {
                        tap();
                        setSprayType(isSelected ? undefined : opt.key);
                      }}
                    >
                      <Text style={[itemTplStyles.chipText, isSelected && { color: '#fff' }]}>{opt.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={itemTplStyles.modalLabel}>Dose</Text>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <TextInput
                  style={[itemTplStyles.modalInput, { width: 70 }]}
                  value={dose}
                  onChangeText={setDose}
                  placeholder="2"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                />
                <View style={[itemTplStyles.chipRow, { marginVertical: 0, flex: 1 }]}>
                  {DOSE_UNITS.map((u) => {
                    const isSelected = u === doseUnit;
                    return (
                      <TouchableOpacity
                        key={u}
                        style={[itemTplStyles.chip, isSelected && { backgroundColor: themeColor, borderColor: themeColor }]}
                        onPress={() => {
                          tap();
                          setDoseUnit(u);
                        }}
                      >
                        <Text style={[itemTplStyles.chipText, isSelected && { color: '#fff' }]}>{u}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <Text style={itemTplStyles.modalLabel}>Alternative 1</Text>
              <TextInput style={itemTplStyles.modalInput} value={alt1} onChangeText={setAlt1} placeholder="Optional alternative product" placeholderTextColor="#94a3b8" />

              <Text style={itemTplStyles.modalLabel}>Alternative 2</Text>
              <TextInput style={itemTplStyles.modalInput} value={alt2} onChangeText={setAlt2} placeholder="Optional second alternative" placeholderTextColor="#94a3b8" />

              {error ? <Text style={itemTplStyles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[itemTplStyles.saveBtn, { backgroundColor: themeColor }]}
                activeOpacity={0.85}
                disabled={isSaving}
                onPress={handleSave}
              >
                {isSaving ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#fff" />
                    <Text style={itemTplStyles.saveBtnText}>{editingId ? 'Update Item' : 'Save Item'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const itemTplStyles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    ...premiumShadow('#0f172a', 'sm'),
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 14.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  headerSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md },
  addBtnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', paddingVertical: 20 },
  groupHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, paddingHorizontal: 2 },
  groupHeaderText: { fontSize: 12, fontFamily: FONT.bold },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#475569' },
  compactList: { marginTop: 4, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md, overflow: 'hidden' },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  compactItemText: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  compactDoseText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  compactAltText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end', alignItems: 'center' },
  modalCard: { width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: '#ffffff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 32, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#334155', marginTop: 10, marginBottom: 4 },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, color: '#0f172a', backgroundColor: '#f8fafc', fontFamily: FONT.medium },
  errorText: { fontSize: 12, fontFamily: FONT.bold, color: '#dc2626', marginTop: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, marginBottom: 4, borderRadius: RADIUS.md, paddingVertical: 13 },
  saveBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14.5 },
});
