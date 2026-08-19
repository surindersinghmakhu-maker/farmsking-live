import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { Party } from '@/src/types/api';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface CreatePartyPayload {
  name: string;
  address: string;
  mobile?: string;
}

interface PartyPickerProps {
  parties: Party[];
  selectedParty: Party | null;
  onSelect: (party: Party | null) => void;
  onCreate: (payload: CreatePartyPayload) => Promise<Party>;
  accentColor: string;
  label?: string;
  placeholder?: string;
  /** Optional — receives every keystroke, for callers that also want to accept a free-typed name that isn't a saved party. */
  onTextChange?: (text: string) => void;
}

export function PartyPicker({
  parties,
  selectedParty,
  onSelect,
  onCreate,
  accentColor,
  label = 'Buyer / Trader Name *',
  placeholder = 'Type to search or select a party',
  onTextChange,
}: PartyPickerProps) {
  const [text, setText] = useState(selectedParty?.name ?? '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Keep the input text in sync when the parent selects/clears a party from elsewhere.
  useEffect(() => {
    setText(selectedParty?.name ?? '');
  }, [selectedParty?.id]);

  const matches = useMemo(() => {
    const q = text.trim().toLowerCase();
    if (!q) return parties;
    return parties.filter((p) => p.name.toLowerCase().includes(q));
  }, [parties, text]);

  const selectParty = (p: Party) => {
    tap();
    setText(p.name);
    onSelect(p);
    setIsDropdownOpen(false);
  };

  const canCreate = newName.trim().length > 0 && newAddress.trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    try {
      const party = await onCreate({ name: newName.trim(), address: newAddress.trim(), mobile: newMobile.trim() || undefined });
      selectParty(party);
      setNewName('');
      setNewAddress('');
      setNewMobile('');
      setIsAddOpen(false);
    } catch {
      // swallow — caller surfaces its own error state if needed
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={styles.label}>{label}</Text>
        <TouchableOpacity
          style={[styles.addBtn, { borderColor: accentColor }]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setNewName('');
            setIsAddOpen(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={14} color={accentColor} />
          <Text style={[styles.addBtnText, { color: accentColor }]}>Add New Party</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        value={text}
        onChangeText={(value) => {
          setText(value);
          setIsDropdownOpen(true);
          if (selectedParty && value !== selectedParty.name) onSelect(null);
          onTextChange?.(value);
        }}
        onFocus={() => setIsDropdownOpen(true)}
        onBlur={() => setTimeout(() => setIsDropdownOpen(false), 200)}
      />

      {isDropdownOpen && matches.length > 0 && (
        <View style={[styles.dropdown, premiumShadow('#000000', 'sm')]}>
          <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
            {matches.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.dropdownRow}
                activeOpacity={0.7}
                onPressIn={() => selectParty(p)}
              >
                <Ionicons name="person-outline" size={14} color="#64748b" />
                <Text style={styles.dropdownRowText}>{p.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.dropdownCloseRow} onPressIn={() => setIsDropdownOpen(false)}>
            <Text style={styles.dropdownCloseText}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={isAddOpen} transparent animationType="fade" onRequestClose={() => setIsAddOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.card, premiumShadow('#000000', 'lg')]}>
            <Text style={styles.cardTitle}>Add New Party</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bathinda Mandi Merchant"
              placeholderTextColor="#94a3b8"
              value={newName}
              onChangeText={setNewName}
              autoFocus
            />
            <Text style={[styles.label, { marginTop: 10 }]}>Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grain Market, Bathinda"
              placeholderTextColor="#94a3b8"
              value={newAddress}
              onChangeText={setNewAddress}
            />
            <Text style={[styles.label, { marginTop: 10 }]}>Mobile Number (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="10-digit mobile number"
              placeholderTextColor="#94a3b8"
              value={newMobile}
              onChangeText={setNewMobile}
              keyboardType="phone-pad"
              maxLength={10}
            />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: accentColor, opacity: canCreate ? 1 : 0.6 }]}
                disabled={!canCreate || isCreating}
                onPress={handleCreate}
              >
                {isCreating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  addBtnText: { fontSize: 11, fontFamily: FONT.bold },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    fontFamily: FONT.medium,
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 220,
  },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  dropdownRowText: { fontSize: 13, fontFamily: FONT.medium, color: '#0f172a' },
  dropdownCloseRow: { paddingVertical: 8, alignItems: 'center', backgroundColor: '#f8fafc' },
  dropdownCloseText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 18,
  },
  cardTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 10 },
  cancelBtn: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center' },
  cancelBtnText: { color: '#334155', fontFamily: FONT.semiBold, fontSize: 13.5 },
  saveBtn: { flex: 1, borderRadius: RADIUS.md, paddingVertical: 11, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontFamily: FONT.bold, fontSize: 13.5 },
});
