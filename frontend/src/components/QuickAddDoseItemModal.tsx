import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { SprayType } from '@/src/types/api';
import { useCreateSprayItemTemplate } from '@/src/hooks/useSprayItemTemplates';

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

/** Standalone "add a new Dose Item to the library" modal — reused wherever an advisor needs to create
 * a new item without leaving the flow they're in (Dose Items tab, or mid-way through building a
 * schedule template). Trigger it with a `visible`/`onClose` pair from the parent. */
export function QuickAddDoseItemModal({
  visible,
  onClose,
  themeColor,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  themeColor: string;
  onCreated?: (item: { item: string; dose?: string }) => void;
}) {
  const createTemplate = useCreateSprayItemTemplate();

  const [item, setItem] = useState('');
  const [sprayType, setSprayType] = useState<SprayType | undefined>(undefined);
  const [dose, setDose] = useState('');
  const [doseUnit, setDoseUnit] = useState<DoseUnit>('ml');
  const [alt1, setAlt1] = useState('');
  const [alt2, setAlt2] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setItem('');
    setSprayType(undefined);
    setDose('');
    setDoseUnit('ml');
    setAlt1('');
    setAlt2('');
    setError(null);
  }, [visible]);

  const handleSave = async () => {
    if (!item.trim()) {
      setError('Kripya item ka naam bharein.');
      return;
    }
    const doseStr = dose.trim() ? `${dose.trim()} ${doseUnit}` : undefined;
    try {
      await createTemplate.mutateAsync({
        item: item.trim(),
        sprayType,
        dose: doseStr,
        alternative1: alt1.trim() || undefined,
        alternative2: alt2.trim() || undefined,
      });
      onCreated?.({ item: item.trim(), dose: doseStr });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Save nahi ho saka, dobara try karein.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>🧪 Add Dose Item</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.modalLabel}>Item *</Text>
            <TextInput style={styles.modalInput} value={item} onChangeText={setItem} placeholder="e.g. Propiconazole 25% EC" placeholderTextColor="#94a3b8" />

            <Text style={styles.modalLabel}>Category (Spray Type)</Text>
            <View style={styles.chipRow}>
              {SPRAY_TYPE_OPTIONS.map((opt) => {
                const isSelected = opt.key === sprayType;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.chip, isSelected && { backgroundColor: themeColor, borderColor: themeColor }]}
                    onPress={() => setSprayType(isSelected ? undefined : opt.key)}
                  >
                    <Text style={[styles.chipText, isSelected && { color: '#fff' }]}>{opt.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.modalLabel}>Dose</Text>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <TextInput
                style={[styles.modalInput, { width: 70 }]}
                value={dose}
                onChangeText={setDose}
                placeholder="2"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
              />
              <View style={[styles.chipRow, { marginVertical: 0, flex: 1 }]}>
                {DOSE_UNITS.map((u) => {
                  const isSelected = u === doseUnit;
                  return (
                    <TouchableOpacity
                      key={u}
                      style={[styles.chip, isSelected && { backgroundColor: themeColor, borderColor: themeColor }]}
                      onPress={() => setDoseUnit(u)}
                    >
                      <Text style={[styles.chipText, isSelected && { color: '#fff' }]}>{u}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <Text style={styles.modalLabel}>Alternative 1</Text>
            <TextInput style={styles.modalInput} value={alt1} onChangeText={setAlt1} placeholder="Optional alternative product" placeholderTextColor="#94a3b8" />

            <Text style={styles.modalLabel}>Alternative 2</Text>
            <TextInput style={styles.modalInput} value={alt2} onChangeText={setAlt2} placeholder="Optional second alternative" placeholderTextColor="#94a3b8" />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: themeColor }]}
              activeOpacity={0.85}
              disabled={createTemplate.isPending}
              onPress={handleSave}
            >
              {createTemplate.isPending ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Save Item</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'flex-end', alignItems: 'center' },
  modalCard: { width: '100%', maxWidth: 480, maxHeight: '90%', backgroundColor: '#ffffff', borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.lg, paddingBottom: 32, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  closeBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#334155', marginTop: 10, marginBottom: 4 },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, color: '#0f172a', backgroundColor: '#f8fafc', fontFamily: FONT.medium },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 4 },
  chip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#475569' },
  errorText: { fontSize: 12, fontFamily: FONT.bold, color: '#dc2626', marginTop: 8 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 18, marginBottom: 4, borderRadius: RADIUS.md, paddingVertical: 13 },
  saveBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14.5 },
});
