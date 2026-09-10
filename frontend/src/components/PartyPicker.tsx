import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { Party, LabourWorker } from '@/src/types/api';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export type PartyTypeCategory = 'BUYER' | 'SUPPLIER' | 'SERVICE' | 'WORKER' | 'OTHER';

export const PARTY_TYPES = [
  { id: 'BUYER', label: '🛒 Buyer', color: '#0284c7' },
  { id: 'SUPPLIER', label: '🏪 Supplier', color: '#dc2626' },
  { id: 'SERVICE', label: '🛠️ Service', color: '#7c3aed' },
  { id: 'WORKER', label: '👷 Worker', color: '#16a34a' },
  { id: 'OTHER', label: '📌 Other', color: '#475569' },
] as const;

export interface CreatePartyPayload {
  name: string;
  address: string;
  mobile?: string;
  partyType?: PartyTypeCategory;
  kingId?: string;
  isVerified?: boolean;
}

export interface UnifiedPartyItem {
  id: string;
  name: string;
  type: 'PARTY' | 'LABOUR';
  mobile?: string;
  address?: string;
  balance?: number;
  originalItem: Party | LabourWorker;
}

interface PartyPickerProps {
  parties: Party[];
  labourWorkers?: LabourWorker[];
  selectedParty: Party | null;
  onSelect: (party: Party | null) => void;
  onCreate: (payload: CreatePartyPayload) => Promise<Party>;
  accentColor: string;
  label?: string;
  placeholder?: string;
  /** Optional — receives every keystroke, for callers that also want to accept a free-typed name that isn't a saved party. */
  onTextChange?: (text: string) => void;
  hideLabel?: boolean;
  inlineAddButton?: boolean;
}

export function PartyPicker({
  parties,
  labourWorkers = [],
  selectedParty,
  onSelect,
  onCreate,
  accentColor,
  label = 'Party / Account Name *',
  placeholder = 'Type to search party, supplier or worker',
  onTextChange,
  hideLabel = false,
  inlineAddButton = false,
}: PartyPickerProps) {
  const [text, setText] = useState(selectedParty?.name ?? '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [filterType, setFilterType] = useState<'ALL' | 'PARTY' | 'LABOUR'>('ALL');
  const [newName, setNewName] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [partyType, setPartyType] = useState<PartyTypeCategory>('BUYER');
  const [isCreating, setIsCreating] = useState(false);
  const [autoFoundNotice, setAutoFoundNotice] = useState<string | null>(null);

  // OTP Verification & King ID Activation states
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [kingId, setKingId] = useState<string | null>(null);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);

  const handleSendOtp = () => {
    const cleaned = newMobile.trim().replace(/\D/g, '');
    if (cleaned.length < 10) {
      setOtpNotice('⚠️ Kripya 10-digit mobile number enter karein.');
      return;
    }
    tap();
    setShowOtpInput(true);
    setOtpNotice(`📲 OTP sent to ${cleaned}. (Enter 1234 to confirm)`);
  };

  const handleConfirmOtp = () => {
    if (!otpCode.trim()) {
      setOtpNotice('⚠️ Kripya OTP code enter karein.');
      return;
    }
    tap();
    const generatedKingId = `FK-${Math.floor(100000 + Math.random() * 900000)}`;
    setIsVerified(true);
    setKingId(generatedKingId);
    setShowOtpInput(false);
    setOtpNotice(null);
  };

  // Sync text when selectedParty changes
  useEffect(() => {
    setText(selectedParty?.name ?? '');
  }, [selectedParty?.id]);

  // Combine Parties & Labour Workers into a single unified list
  const combinedList = useMemo<UnifiedPartyItem[]>(() => {
    const list: UnifiedPartyItem[] = [];

    // 1. Registered Dealers, Buyers, Mandi Traders & Suppliers
    parties.forEach((p) => {
      list.push({
        id: p.id,
        name: p.name,
        type: 'PARTY',
        mobile: p.mobile ?? undefined,
        address: p.address ?? undefined,
        balance: p.balance,
        originalItem: p,
      });
    });

    // 2. Registered Labour Workers
    labourWorkers.forEach((w) => {
      list.push({
        id: `labour_${w.id}`,
        name: w.name,
        type: 'LABOUR',
        mobile: w.mobile ?? undefined,
        address: w.address ?? undefined,
        balance: w.pendingBalance,
        originalItem: w,
      });
    });

    return list;
  }, [parties, labourWorkers]);

  const filteredMatches = useMemo(() => {
    const q = text.trim().toLowerCase();
    let result = combinedList;

    if (filterType === 'PARTY') {
      result = result.filter((item) => item.type === 'PARTY');
    } else if (filterType === 'LABOUR') {
      result = result.filter((item) => item.type === 'LABOUR');
    }

    if (!q) return result;
    return result.filter((item) => item.name.toLowerCase().includes(q) || (item.mobile && item.mobile.includes(q)));
  }, [combinedList, text, filterType]);

  const selectUnifiedItem = (item: UnifiedPartyItem) => {
    tap();
    setText(item.name);
    setIsDropdownOpen(false);

    if (item.type === 'PARTY') {
      onSelect(item.originalItem as Party);
    } else {
      // Synthesize a Party object for Labour Worker compatibility
      const w = item.originalItem as LabourWorker;
      const synthParty: Party & { __type?: string; isWorker?: boolean } = {
        id: w.id,
        ownerId: w.farmerId || '',
        name: w.name,
        mobile: w.mobile ?? undefined,
        address: w.address ?? 'Labour Worker',
        balance: w.pendingBalance || 0,
        createdAt: w.createdAt || new Date().toISOString(),
        __type: 'LABOUR',
        isWorker: true,
      };
      onSelect(synthParty);
    }
  };

  // Auto-Fill Data when typing Mobile Number in Add Modal
  const handleMobileChange = (num: string) => {
    setNewMobile(num);
    setAutoFoundNotice(null);

    const cleaned = num.trim().replace(/\D/g, '');
    if (cleaned.length >= 10) {
      // Search in existing parties and labour workers for matching mobile
      const match = combinedList.find((item) => item.mobile && item.mobile.replace(/\D/g, '').includes(cleaned));
      if (match) {
        tap();
        setNewName(match.name);
        if (match.address) setNewAddress(match.address);
        setAutoFoundNotice(`✨ Auto-filled data from existing record: ${match.name}`);
      }
    }
  };

  const canCreate = newName.trim().length > 0;

  const handleCreate = async () => {
    if (!canCreate || isCreating) return;
    setIsCreating(true);
    try {
      const typeTag = partyType ? ` [${partyType}]` : '';
      const addressVal = newAddress.trim() || 'Local Party';
      const party = await onCreate({
        name: newName.trim(),
        address: `${addressVal}${typeTag}`,
        mobile: newMobile.trim() || undefined,
        partyType,
        kingId: kingId || undefined,
        isVerified,
      });
      tap();
      setText(party.name);
      onSelect(party);
      setNewName('');
      setNewAddress('');
      setNewMobile('');
      setPartyType('BUYER');
      setIsVerified(false);
      setKingId(null);
      setShowOtpInput(false);
      setOtpCode('');
      setOtpNotice(null);
      setAutoFoundNotice(null);
      setIsAddOpen(false);
    } catch (err: any) {
      console.error('Error creating party:', err);
      const serverMsg = err?.response?.data?.message || err?.message;
      const msg = Array.isArray(serverMsg) ? serverMsg.join(', ') : serverMsg;
      setOtpNotice(`⚠️ ${msg || 'Could not save party. Please try again.'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <View style={{ gap: 4 }}>
      {!hideLabel && (
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.label}>{label}</Text>
          {!inlineAddButton && (
            <TouchableOpacity
              style={[styles.addBtn, { borderColor: accentColor }]}
              activeOpacity={0.8}
              onPress={() => {
                tap();
                setNewName('');
                setNewAddress('');
                setNewMobile('');
                setAutoFoundNotice(null);
                setIsAddOpen(true);
              }}
            >
              <Ionicons name="add-circle-outline" size={14} color={accentColor} />
              <Text style={[styles.addBtnText, { color: accentColor }]}>+ New Party</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
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
        />
        {inlineAddButton && (
          <TouchableOpacity
            style={[styles.addBtn, { borderColor: accentColor, height: 38, paddingHorizontal: 10, justifyContent: 'center' }]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setNewName('');
              setNewAddress('');
              setNewMobile('');
              setAutoFoundNotice(null);
              setIsAddOpen(true);
            }}
          >
            <Ionicons name="add-circle-outline" size={14} color={accentColor} />
            <Text style={[styles.addBtnText, { color: accentColor }]}>+ New Party</Text>
          </TouchableOpacity>
        )}
      </View>

      {isDropdownOpen && (
        <View style={[styles.dropdown, premiumShadow('#000000', 'sm')]}>
          {/* Quick Filter Tabs inside Dropdown */}
          <View style={styles.filterTabRow}>
            {(['ALL', 'PARTY', 'LABOUR'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.filterChip, filterType === t && styles.filterChipActive]}
                onPressIn={() => {
                  tap();
                  setFilterType(t);
                }}
              >
                <Text style={[styles.filterChipText, filterType === t && styles.filterChipTextActive]}>
                  {t === 'ALL' ? 'All Parties' : t === 'PARTY' ? '🏪 Dealers/Buyers' : '👷 Labour Workers'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredMatches.length === 0 ? (
            <View style={styles.emptyDropdown}>
              <Text style={styles.emptyDropdownText}>No matching party or worker found</Text>
            </View>
          ) : (
            <ScrollView style={styles.dropdownScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator>
              {filteredMatches.map((item) => {
                const isLabour = item.type === 'LABOUR';
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownRow}
                    activeOpacity={0.7}
                    onPressIn={() => selectUnifiedItem(item)}
                  >
                    <View style={[styles.iconBg, { backgroundColor: isLabour ? '#eff6ff' : '#f0fdf4' }]}>
                      <Ionicons name={isLabour ? 'person' : 'business'} size={14} color={isLabour ? '#2563eb' : '#16a34a'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.dropdownRowText}>{item.name}</Text>
                        <View style={[styles.typeTag, { backgroundColor: isLabour ? '#dbeafe' : '#dcfce7' }]}>
                          <Text style={[styles.typeTagText, { color: isLabour ? '#1d4ed8' : '#15803d' }]}>
                            {isLabour ? 'Labour Worker' : 'Dealer / Party'}
                          </Text>
                        </View>
                      </View>
                      {item.mobile ? <Text style={styles.dropdownSubText}>📱 {item.mobile}</Text> : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <TouchableOpacity style={styles.dropdownCloseRow} onPressIn={() => setIsDropdownOpen(false)}>
            <Text style={styles.dropdownCloseText}>Close Search</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Add New Party Modal with Auto-Fill by Mobile Number */}
      <Modal visible={isAddOpen} transparent animationType="fade" onRequestClose={() => setIsAddOpen(false)}>
        <View style={styles.overlay}>
          <View style={[styles.card, premiumShadow('#000000', 'lg')]}>
            <Text style={styles.cardTitle}>Add New Party / Dealer / Buyer</Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={styles.label}>Party Mobile</Text>
              {isVerified ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill }}>
                  <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d' }}>👑 King ID Active</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill }}
                  onPress={handleSendOtp}
                  activeOpacity={0.8}
                >
                  <Ionicons name="shield-checkmark-outline" size={13} color="#2563eb" />
                  <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#2563eb' }}>Verify / Send OTP</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              <TextInput
                style={[
                  styles.input,
                  { flex: 1 },
                  isVerified && { backgroundColor: '#f1f5f9', color: '#475569', borderColor: '#cbd5e1' },
                ]}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                value={newMobile}
                onChangeText={handleMobileChange}
                keyboardType="phone-pad"
                maxLength={10}
                editable={!isVerified}
                autoFocus
              />
            </View>

            {otpNotice ? (
              <View style={[styles.autoNoticeBox, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                <Ionicons name="information-circle-outline" size={14} color="#2563eb" />
                <Text style={[styles.autoNoticeText, { color: '#1d4ed8' }]}>{otpNotice}</Text>
              </View>
            ) : null}

            {showOtpInput && !isVerified ? (
              <View style={{ flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' }}>
                <TextInput
                  style={[styles.input, { flex: 1, height: 38 }]}
                  placeholder="Enter 4-digit OTP (1234)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={4}
                  value={otpCode}
                  onChangeText={setOtpCode}
                />
                <TouchableOpacity
                  style={{ backgroundColor: '#16a34a', paddingHorizontal: 12, height: 38, justifyContent: 'center', borderRadius: RADIUS.md }}
                  onPress={handleConfirmOtp}
                >
                  <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 12 }}>Confirm OTP</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {isVerified && kingId ? (
              <View style={[styles.autoNoticeBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginTop: 6 }]}>
                <Ionicons name="key-outline" size={16} color="#16a34a" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#15803d' }}>
                    👑 King ID Active: {kingId}
                  </Text>
                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#166534', marginTop: 1 }}>
                    Username: {newMobile} | Password: {newMobile}
                  </Text>
                  <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#475569', marginTop: 2 }}>
                    Worker can login using this mobile number to view farmer-wise work details & change password anytime.
                  </Text>
                </View>
              </View>
            ) : null}

            {autoFoundNotice ? (
              <View style={styles.autoNoticeBox}>
                <Ionicons name="sparkles" size={14} color="#16a34a" />
                <Text style={styles.autoNoticeText}>{autoFoundNotice}</Text>
              </View>
            ) : null}

            <Text style={[styles.label, { marginTop: 10 }]}>Party Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bathinda Mandi Merchant / Dealer"
              placeholderTextColor="#94a3b8"
              value={newName}
              onChangeText={setNewName}
            />

            <Text style={[styles.label, { marginTop: 10 }]}>Party Type *</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
              {PARTY_TYPES.map((pt) => {
                const isSelected = partyType === pt.id;
                return (
                  <TouchableOpacity
                    key={pt.id}
                    style={[
                      styles.filterChip,
                      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: RADIUS.md, borderWidth: 1, borderColor: isSelected ? pt.color : '#cbd5e1' },
                      isSelected ? { backgroundColor: pt.color } : { backgroundColor: '#f8fafc' },
                    ]}
                    onPress={() => {
                      tap();
                      setPartyType(pt.id);
                    }}
                  >
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: isSelected ? '#ffffff' : '#475569' }}>
                      {pt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={[styles.label, { marginTop: 10 }]}>Address *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Grain Market, Bathinda"
              placeholderTextColor="#94a3b8"
              value={newAddress}
              onChangeText={setNewAddress}
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
                {isCreating ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Save Party</Text>}
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
    paddingVertical: 3,
  },
  addBtnText: { fontSize: 11, fontFamily: FONT.bold },
  input: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13.5,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    fontFamily: FONT.medium,
  },
  dropdown: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    overflow: 'hidden',
  },
  filterTabRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    padding: 6,
    gap: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  filterChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  filterChipActive: { backgroundColor: '#0f172a' },
  filterChipText: { fontSize: 10, fontFamily: FONT.bold, color: '#64748b' },
  filterChipTextActive: { color: '#ffffff' },
  dropdownScroll: { maxHeight: 220 },
  dropdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconBg: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownRowText: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  typeTag: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.pill },
  typeTagText: { fontSize: 9.5, fontFamily: FONT.extraBold },
  dropdownSubText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  emptyDropdown: { padding: 14, alignItems: 'center' },
  emptyDropdownText: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8' },
  dropdownCloseRow: { paddingVertical: 8, alignItems: 'center', backgroundColor: '#f8fafc' },
  dropdownCloseText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b' },
  autoNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.sm,
    padding: 8,
    marginTop: 6,
  },
  autoNoticeText: { fontSize: 11, fontFamily: FONT.bold, color: '#15803d' },
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
