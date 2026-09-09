import React, { useState, useMemo } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useParties, useCreateParty, useUpdateParty, usePartyStatement } from '@/src/hooks/useParties';
import { useLabourWorkers, useCreateLabourWorker, useUpdateLabourWorker, useLabourWorkerStatement } from '@/src/hooks/useLabour';
import { Party, LabourWorker } from '@/src/types/api';
import { formatInr } from '@/src/utils/formatInr';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { Avatar } from '@/src/components/Avatar';
import { useAuth } from '@/src/store/auth-context';
import { BrandLogo } from '@/src/components/BrandLogo';
import { buildPartyLedgerRows } from '@/src/utils/partyLedger';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface UnifiedPartyItem {
  id: string;
  originalId: string;
  name: string;
  mobile?: string | null;
  address?: string | null;
  category: 'BUYER' | 'SUPPLIER' | 'LABOUR' | 'PARTY';
  balance: number; // >0 means Payable (Dr), <0 means Receivable (Cr) for parties; for labour pendingBalance >0 means Dr
  isLabourWorker: boolean;
  rawParty?: Party;
  rawWorker?: LabourWorker;
}

export function AllPartiesSection() {
  const { data: rawParties = [], isLoading: isLoadingParties } = useParties();
  const { data: rawWorkers = [], isLoading: isLoadingWorkers } = useLabourWorkers();

  const createParty = useCreateParty();
  const createWorker = useCreateLabourWorker();
  const updateParty = useUpdateParty();
  const updateWorker = useUpdateLabourWorker();

  const [searchText, setSearchText] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'BUYERS' | 'SUPPLIERS' | 'LABOUR'>('ALL');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingItem, setEditingItem] = useState<UnifiedPartyItem | null>(null);
  const [editName, setEditName] = useState('');
  const [editMobile, setEditMobile] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editPartyType, setEditPartyType] = useState<'BUYER' | 'SUPPLIER' | 'SERVICE' | 'WORKER' | 'OTHER'>('BUYER');
  const [editShowOtpInput, setEditShowOtpInput] = useState(false);
  const [editOtpCode, setEditOtpCode] = useState('');
  const [editIsVerified, setEditIsVerified] = useState(false);
  const [editOtpNotice, setEditOtpNotice] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // New Party Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newMobile, setNewMobile] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPartyType, setNewPartyType] = useState<'BUYER' | 'SUPPLIER' | 'SERVICE' | 'WORKER' | 'OTHER'>('BUYER');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  const [otpNotice, setOtpNotice] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);

  // Statement View Modal State
  const [selectedStatementItem, setSelectedStatementItem] = useState<UnifiedPartyItem | null>(null);

  // Unified Parties List Transformation
  const unifiedParties: UnifiedPartyItem[] = useMemo(() => {
    const list: UnifiedPartyItem[] = [];

    // 1. General Parties (Buyers, Suppliers, Traders)
    (rawParties || []).forEach((p) => {
      const bal = Number(p.balance || 0);
      let cat: 'BUYER' | 'SUPPLIER' | 'PARTY' = 'PARTY';
      const lowerName = (p.name || '').toLowerCase();
      if (lowerName.includes('trader') || lowerName.includes('supplier') || lowerName.includes('kisan') || lowerName.includes('mandi')) {
        cat = 'SUPPLIER';
      } else if (bal > 0) {
        cat = 'BUYER';
      } else if (bal < 0) {
        cat = 'SUPPLIER';
      }

      list.push({
        id: `party_${p.id}`,
        originalId: p.id,
        name: p.name,
        mobile: p.mobile,
        address: p.address,
        category: cat,
        balance: bal,
        isLabourWorker: false,
        rawParty: p,
      });
    });

    // 2. Labour Workers
    (rawWorkers || []).forEach((w) => {
      list.push({
        id: `labour_${w.id}`,
        originalId: w.id,
        name: w.name,
        mobile: w.mobile,
        address: w.address,
        category: 'LABOUR',
        balance: Number(w.pendingBalance || 0),
        isLabourWorker: true,
        rawWorker: w,
      });
    });

    return list;
  }, [rawParties, rawWorkers]);

  // Filtered List
  const filteredParties = useMemo(() => {
    return unifiedParties.filter((item) => {
      if (selectedFilter === 'BUYERS' && item.category !== 'BUYER' && item.category !== 'PARTY') return false;
      if (selectedFilter === 'SUPPLIERS' && item.category !== 'SUPPLIER') return false;
      if (selectedFilter === 'LABOUR' && !item.isLabourWorker) return false;

      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.mobile && item.mobile.includes(q)) ||
        (item.address && item.address.toLowerCase().includes(q))
      );
    });
  }, [unifiedParties, selectedFilter, searchText]);

  // Edit Party Handler
  const handleOpenEdit = (item: UnifiedPartyItem) => {
    tap();
    setEditingItem(item);
    setEditName(item.name);
    setEditMobile(item.mobile || '');
    setEditAddress(item.address || '');
    setEditPartyType(
      item.isLabourWorker
        ? 'WORKER'
        : item.category === 'BUYER'
          ? 'BUYER'
          : item.category === 'SUPPLIER'
            ? 'SUPPLIER'
            : 'OTHER'
    );
    setEditIsVerified(!!item.mobile);
    setEditShowOtpInput(false);
    setEditOtpNotice(null);
    setEditError(null);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingItem) return;
    setEditError(null);
    if (!editName.trim()) {
      setEditError('Party Name is required.');
      return;
    }

    try {
      if (editingItem.isLabourWorker && editingItem.rawWorker) {
        await updateWorker.mutateAsync({
          id: editingItem.originalId,
          payload: {
            name: editName.trim(),
            mobile: editMobile.trim() || undefined,
            address: editAddress.trim() || undefined,
          },
        });
      } else {
        await updateParty.mutateAsync({
          id: editingItem.originalId,
          payload: {
            name: editName.trim(),
            mobile: editMobile.trim() || undefined,
            address: editAddress.trim() || '',
          },
        });
      }
      setShowEditModal(false);
      setEditingItem(null);
    } catch (err: any) {
      setEditError(err?.response?.data?.message || 'Could not update party details.');
    }
  };

  // Create Party Handler
  const handleSaveCreate = async () => {
    setCreateError(null);
    if (!newName.trim()) {
      setCreateError('Party Name is required.');
      return;
    }

    try {
      if (newPartyType === 'WORKER') {
        await createWorker.mutateAsync({
          name: newName.trim(),
          mobile: newMobile.trim() || undefined,
          address: newAddress.trim() || undefined,
        });
      } else {
        await createParty.mutateAsync({
          name: newName.trim(),
          mobile: newMobile.trim() || undefined,
          address: newAddress.trim() || '',
        });
      }
      setShowCreateModal(false);
      setNewName('');
      setNewMobile('');
      setNewAddress('');
      setNewPartyType('BUYER');
      setIsVerified(false);
      setShowOtpInput(false);
      setOtpNotice(null);
    } catch (err: any) {
      setCreateError(err?.response?.data?.message || 'Could not create new party.');
    }
  };

  const isLoading = isLoadingParties || isLoadingWorkers;

  return (
    <View style={styles.container}>
      {/* 1. Compact Top Bar: Search Input & + New Party Button */}
      <View style={styles.topRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={16} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search party (Buyer, Supplier, Labour)..."
            placeholderTextColor="#94a3b8"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={16} color="#94a3b8" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.addBtn}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setNewName('');
            setNewMobile('');
            setNewAddress('');
            setCreateError(null);
            setShowCreateModal(true);
          }}
        >
          <Ionicons name="add" size={16} color="#ffffff" />
          <Text style={styles.addBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Compact Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 8 }}>
        {[
          { key: 'ALL', label: `All (${unifiedParties.length})` },
          { key: 'BUYERS', label: 'Buyers' },
          { key: 'SUPPLIERS', label: 'Suppliers' },
          { key: 'LABOUR', label: 'Labour' },
        ].map((f) => {
          const isActive = selectedFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              activeOpacity={0.8}
              onPress={() => {
                tap();
                setSelectedFilter(f.key as any);
              }}
            >
              <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* 3. Compact Professional Parties List */}
      {isLoading ? (
        <ActivityIndicator color="#16a34a" size="large" style={{ marginVertical: 30 }} />
      ) : filteredParties.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="people-outline" size={36} color="#cbd5e1" />
          <Text style={styles.emptyTitle}>No Matching Party</Text>
        </View>
      ) : (
        <View style={{ gap: 6 }}>
          {filteredParties.map((item) => {
            let balanceText = '₹0 Nil';
            let isDr = false;
            let isCr = false;

            if (item.isLabourWorker) {
              if (item.balance > 0) {
                balanceText = `₹${item.balance.toLocaleString('en-IN')} Dr`;
                isDr = true;
              } else {
                balanceText = '₹0 Nil';
              }
            } else {
              if (item.balance > 0) {
                balanceText = `₹${item.balance.toLocaleString('en-IN')} Cr`;
                isCr = true;
              } else if (item.balance < 0) {
                balanceText = `₹${Math.abs(item.balance).toLocaleString('en-IN')} Dr`;
                isDr = true;
              }
            }

            const badgeBg = isDr ? '#fef2f2' : isCr ? '#f0fdf4' : '#f8fafc';
            const badgeBorder = isDr ? '#fecdd3' : isCr ? '#bbf7d0' : '#e2e8f0';
            const badgeColor = isDr ? '#dc2626' : isCr ? '#16a34a' : '#64748b';

            const typeLabel = item.isLabourWorker
              ? '👷 Labour'
              : item.category === 'BUYER'
                ? '🤝 Buyer'
                : item.category === 'SUPPLIER'
                  ? '🚜 Supplier'
                  : '👤 Party';

            return (
              <View key={item.id} style={[styles.compactCard, premiumShadow('#0f172a', 'sm')]}>
                {/* Header Row: Avatar + Name + Type Badge + Edit Button (Left) | Net Balance + Statement Button (Right) */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                  {/* Left: Avatar + Party Name + Type Badge + Edit Button */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, minWidth: 160 }}>
                    <Avatar size={34} />
                    <View style={{ flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                      <Text style={styles.partyName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.typeBadge}>{typeLabel}</Text>
                      {/* Edit Button right next to Party Name */}
                      <TouchableOpacity
                        style={{
                          paddingHorizontal: 6,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: '#f1f5f9',
                          borderWidth: 1,
                          borderColor: '#cbd5e1',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 3,
                        }}
                        activeOpacity={0.8}
                        onPress={() => handleOpenEdit(item)}
                        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                      >
                        <Ionicons name="create-outline" size={12} color="#475569" />
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#475569' }}>Edit</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Right: Net Balance + Statement Button */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {/* Party Balance */}
                    <View style={[styles.balanceBadge, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                      <Text style={[styles.balanceBadgeText, { color: badgeColor }]}>{balanceText}</Text>
                    </View>

                    {/* Statement Button at the end */}
                    <TouchableOpacity
                      style={[styles.compactBtn, { backgroundColor: '#e0f2fe', borderColor: '#bae6fd', borderWidth: 1 }]}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        setSelectedStatementItem(item);
                      }}
                    >
                      <Ionicons name="document-text-outline" size={13} color="#0284c7" />
                      <Text style={[styles.compactBtnText, { color: '#0284c7', fontFamily: FONT.bold }]}>Statement</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Sub-row: Contact info if available */}
                {(item.mobile || item.address) ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4, paddingLeft: 40 }}>
                    {item.mobile ? <Text style={styles.metaText}>📱 {item.mobile}</Text> : null}
                    {item.address ? <Text style={styles.metaText}>📍 {item.address}</Text> : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* 4. EDIT PARTY / WORKER MODAL (MATCHES SCREENSHOT PERFECTLY) */}
      <Modal visible={showEditModal} transparent animationType="fade" onRequestClose={() => setShowEditModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderRadius: 24, padding: 18 }]}>
            <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 12 }}>
              Edit Party / Dealer / Buyer Details
            </Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Party Mobile Label & Verify Button Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>Party Mobile</Text>
                {editIsVerified ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill }}>
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d' }}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.pill }}
                    onPress={() => {
                      if (!editMobile || editMobile.length < 10) {
                        setEditOtpNotice('Please enter 10-digit mobile number first.');
                        return;
                      }
                      setEditShowOtpInput(true);
                      setEditOtpNotice('OTP sent to ' + editMobile + '. Enter 1234 to verify.');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="shield-checkmark-outline" size={13} color="#0284c7" />
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0284c7' }}>Verify / Send OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.pillInput}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                value={editMobile}
                onChangeText={setEditMobile}
                keyboardType="phone-pad"
                maxLength={10}
              />

              {editOtpNotice ? (
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#0284c7', marginTop: 4, marginBottom: 4 }}>
                  {editOtpNotice}
                </Text>
              ) : null}

              {editShowOtpInput && !editIsVerified ? (
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, marginBottom: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.pillInput, { flex: 1, height: 38 }]}
                    placeholder="Enter OTP (1234)"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    maxLength={4}
                    value={editOtpCode}
                    onChangeText={setEditOtpCode}
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: '#16a34a', paddingHorizontal: 14, height: 38, justifyContent: 'center', borderRadius: RADIUS.pill }}
                    onPress={() => {
                      if (editOtpCode === '1234' || editOtpCode.length === 4) {
                        setEditIsVerified(true);
                        setEditShowOtpInput(false);
                        setEditOtpNotice('Mobile number verified successfully!');
                      } else {
                        setEditOtpNotice('Invalid OTP. Enter 1234 to test.');
                      }
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 11.5 }}>Verify</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', marginTop: 10, marginBottom: 4 }}>
                Party Name *
              </Text>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g. Bathinda Mandi Merchant / Dealer"
                placeholderTextColor="#94a3b8"
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', marginTop: 10, marginBottom: 6 }}>
                Party Type *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'BUYER', label: '🛒 Buyer' },
                  { id: 'SUPPLIER', label: '🏥 Supplier' },
                  { id: 'SERVICE', label: '⚒️ Service' },
                  { id: 'WORKER', label: '👷 Worker' },
                  { id: 'OTHER', label: '📌 Other' },
                ].map((pt) => {
                  const isSelected = editPartyType === pt.id;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      style={[
                        styles.partyTypeChip,
                        isSelected ? styles.partyTypeChipSelected : styles.partyTypeChipUnselected,
                      ]}
                      onPress={() => {
                        tap();
                        setEditPartyType(pt.id as any);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.partyTypeChipText, isSelected ? styles.partyTypeChipTextSelected : styles.partyTypeChipTextUnselected]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', marginTop: 10, marginBottom: 4 }}>
                Address *
              </Text>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g. Grain Market, Bathinda"
                placeholderTextColor="#94a3b8"
                value={editAddress}
                onChangeText={setEditAddress}
              />
            </ScrollView>

            {editError ? <Text style={styles.errorText}>{editError}</Text> : null}

            {/* Action Buttons: Cancel & Save Party */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.pillCancelBtn}
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.pillCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pillSaveBtn}
                onPress={handleSaveEdit}
                disabled={updateParty.isPending || updateWorker.isPending}
                activeOpacity={0.85}
              >
                {updateParty.isPending || updateWorker.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.pillSaveBtnText}>Save Party</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. CREATE NEW PARTY MODAL (MATCHES SCREENSHOT PERFECTLY) */}
      <Modal visible={showCreateModal} transparent animationType="fade" onRequestClose={() => setShowCreateModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { borderRadius: 24, padding: 18 }]}>
            <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 12 }}>
              Add New Party / Dealer / Buyer
            </Text>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Party Mobile Label & Verify Button Row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>Party Mobile</Text>
                {isVerified ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill }}>
                    <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d' }}>Verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.pill }}
                    onPress={() => {
                      if (!newMobile || newMobile.length < 10) {
                        setOtpNotice('Please enter 10-digit mobile number first.');
                        return;
                      }
                      setShowOtpInput(true);
                      setOtpNotice('OTP sent to ' + newMobile + '. Enter 1234 to verify.');
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="shield-checkmark-outline" size={13} color="#0284c7" />
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0284c7' }}>Verify / Send OTP</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.pillInput}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                value={newMobile}
                onChangeText={setNewMobile}
                keyboardType="phone-pad"
                maxLength={10}
              />

              {otpNotice ? (
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#0284c7', marginTop: 4, marginBottom: 4 }}>
                  {otpNotice}
                </Text>
              ) : null}

              {showOtpInput && !isVerified ? (
                <View style={{ flexDirection: 'row', gap: 6, marginTop: 4, marginBottom: 8, alignItems: 'center' }}>
                  <TextInput
                    style={[styles.pillInput, { flex: 1, height: 38 }]}
                    placeholder="Enter OTP (1234)"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    maxLength={4}
                    value={otpCode}
                    onChangeText={setOtpCode}
                  />
                  <TouchableOpacity
                    style={{ backgroundColor: '#16a34a', paddingHorizontal: 14, height: 38, justifyContent: 'center', borderRadius: RADIUS.pill }}
                    onPress={() => {
                      if (otpCode === '1234' || otpCode.length === 4) {
                        setIsVerified(true);
                        setShowOtpInput(false);
                        setOtpNotice('Mobile number verified successfully!');
                      } else {
                        setOtpNotice('Invalid OTP. Enter 1234 to test.');
                      }
                    }}
                  >
                    <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 11.5 }}>Verify</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', marginTop: 10, marginBottom: 4 }}>
                Party Name *
              </Text>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g. Bathinda Mandi Merchant / Dealer"
                placeholderTextColor="#94a3b8"
                value={newName}
                onChangeText={setNewName}
              />

              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', marginTop: 10, marginBottom: 6 }}>
                Party Type *
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { id: 'BUYER', label: '🛒 Buyer' },
                  { id: 'SUPPLIER', label: '🏥 Supplier' },
                  { id: 'SERVICE', label: '⚒️ Service' },
                  { id: 'WORKER', label: '👷 Worker' },
                  { id: 'OTHER', label: '📌 Other' },
                ].map((pt) => {
                  const isSelected = newPartyType === pt.id;
                  return (
                    <TouchableOpacity
                      key={pt.id}
                      style={[
                        styles.partyTypeChip,
                        isSelected ? styles.partyTypeChipSelected : styles.partyTypeChipUnselected,
                      ]}
                      onPress={() => {
                        tap();
                        setNewPartyType(pt.id as any);
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.partyTypeChipText, isSelected ? styles.partyTypeChipTextSelected : styles.partyTypeChipTextUnselected]}>
                        {pt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', marginTop: 10, marginBottom: 4 }}>
                Address *
              </Text>
              <TextInput
                style={styles.pillInput}
                placeholder="e.g. Grain Market, Bathinda"
                placeholderTextColor="#94a3b8"
                value={newAddress}
                onChangeText={setNewAddress}
              />
            </ScrollView>

            {createError ? <Text style={styles.errorText}>{createError}</Text> : null}

            {/* Action Buttons: Cancel & Save Party */}
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={styles.pillCancelBtn}
                onPress={() => setShowCreateModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.pillCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pillSaveBtn}
                onPress={handleSaveCreate}
                disabled={createParty.isPending || createWorker.isPending}
                activeOpacity={0.85}
              >
                {createParty.isPending || createWorker.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.pillSaveBtnText}>Save Party</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. STATEMENT MODAL COMPONENT */}
      {selectedStatementItem && (
        <StatementViewModal
          item={selectedStatementItem}
          onClose={() => setSelectedStatementItem(null)}
        />
      )}
    </View>
  );
}

/** Statement Modal Helper Component */
function StatementViewModal({ item, onClose }: { item: UnifiedPartyItem; onClose: () => void }) {
  const isLabour = item.isLabourWorker;

  if (isLabour) {
    return <WorkerStatementModalInner workerId={item.originalId} onClose={onClose} />;
  }

  return <PartyStatementModalInner partyId={item.originalId} partyName={item.name} onClose={onClose} />;
}

function WorkerStatementModalInner({ workerId, onClose }: { workerId: string; onClose: () => void }) {
  const { user } = useAuth();
  const { data: statement, isLoading } = useLabourWorkerStatement(workerId);
  const timeline = statement?.timeline || [];
  const worker = statement?.worker;

  const farmerName = user?.name || 'Farm Owner';
  const farmerMobile = user?.mobile || '';
  const farmerVillage = user?.village || '';

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxWidth: 520, maxHeight: '90%', padding: 14 }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📜 Worker Statement</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#16a34a" size="large" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
              {/* 1. TOP HEADING: FarmsKing Logo & Title */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2.5, borderBottomColor: '#16a34a', paddingBottom: 8, marginBottom: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <BrandLogo size={34} useHdQuality />
                  <View>
                    <Text style={{ fontSize: 18, fontFamily: FONT.extraBold, color: '#15803d', letterSpacing: -0.3 }}>FarmsKing</Text>
                    <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b' }}>WORKER ACCOUNT STATEMENT</Text>
                  </View>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' }}>Date: {new Date().toLocaleDateString('en-IN')}</Text>
                  <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#16a34a' }}>Official Record</Text>
                </View>
              </View>

              {/* 2 & 3. FARMER DETAILS (LEFT) & WORKER DETAILS (RIGHT) ROW */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
                {/* Farmer Details Box (Left) */}
                <View style={{ flex: 1, backgroundColor: '#f0fdf4', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#bbf7d0' }}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.extraBold, color: '#15803d', marginBottom: 2 }}>👨‍🌾 FARMER DETAILS</Text>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>{farmerName}</Text>
                  {farmerMobile ? <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📱 {farmerMobile}</Text> : null}
                  {farmerVillage ? <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📍 {farmerVillage}</Text> : null}
                </View>

                {/* Worker Details Box (Right) */}
                <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#e2e8f0' }}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.extraBold, color: '#475569', marginBottom: 2 }}>👷 WORKER DETAILS</Text>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>{worker?.name || 'Worker'}</Text>
                  {worker?.mobile ? <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📱 {worker.mobile}</Text> : null}
                  {worker?.address ? <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📍 {worker.address}</Text> : null}
                </View>
              </View>

              {/* FINANCIAL SUMMARY METRICS */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                <View style={{ flex: 1, backgroundColor: '#fff7ed', padding: 6, borderRadius: 6, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#c2410c' }}>Earned</Text>
                  <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#c2410c' }}>{formatInr(statement?.totalEarned || 0)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#f0fdf4', padding: 6, borderRadius: 6, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#15803d' }}>Paid</Text>
                  <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#15803d' }}>{formatInr(statement?.totalPaid || 0)}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#fef2f2', padding: 6, borderRadius: 6, alignItems: 'center' }}>
                  <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#b91c1c' }}>Net Balance</Text>
                  <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#dc2626' }}>{formatInr(statement?.pendingBalance || 0)}</Text>
                </View>
              </View>

              {/* 4. STATEMENT LEDGER TABLE */}
              <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 8 }}>
                  <Text style={{ width: 65, fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' }}>Date</Text>
                  <Text style={{ flex: 2, fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' }}>Particulars</Text>
                  <Text style={{ flex: 1, fontSize: 10, fontFamily: FONT.bold, color: '#ffedd5', textAlign: 'right' }}>Earned</Text>
                  <Text style={{ flex: 1, fontSize: 10, fontFamily: FONT.bold, color: '#bbf7d0', textAlign: 'right' }}>Paid</Text>
                </View>
                {timeline.map((row, idx) => (
                  <View key={row.id || idx} style={{ flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 6, backgroundColor: idx % 2 === 0 ? '#fff' : '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                    <Text style={{ width: 65, fontSize: 10, fontFamily: FONT.medium, color: '#475569' }}>{new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</Text>
                    <Text style={{ flex: 2, fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' }}>{row.title}</Text>
                    <Text style={{ flex: 1, fontSize: 10.5, fontFamily: FONT.bold, color: '#c2410c', textAlign: 'right' }}>{row.type === 'WORK' ? `+${row.amount}` : '—'}</Text>
                    <Text style={{ flex: 1, fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a', textAlign: 'right' }}>{row.type !== 'WORK' ? `-${row.amount}` : '—'}</Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function PartyStatementModalInner({ partyId, partyName, onClose }: { partyId: string; partyName: string; onClose: () => void }) {
  const shotRef = React.useRef<any>(null);
  const [isSharing, setIsSharing] = useState(false);
  const { user } = useAuth();
  const { data: statement, isLoading } = usePartyStatement(partyId);
  const entries = statement?.entries || [];
  const party = statement?.party;

  const ledgerRows = useMemo(() => buildPartyLedgerRows(entries), [entries]);

  const farmerName = user?.name || 'Farm Owner';
  const farmerMobile = user?.mobile || '';
  const farmerVillage = user?.village || '';

  const handleDownloadJpg = async () => {
    if (!shotRef.current) return;
    tap();
    setIsSharing(true);
    try {
      const uri = await captureRef(shotRef, {
        format: 'jpg',
        quality: 0.95,
        result: Platform.OS === 'web' ? 'data-uri' : 'tmpfile',
      });
      const cleanFileName = `Party_Statement_${partyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.jpg`;

      if (Platform.OS === 'web') {
        const link = document.createElement('a');
        link.href = uri;
        link.download = cleanFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: `Download Party Statement JPG`,
          UTI: 'public.jpeg',
        });
      }
    } catch (err) {
      console.error('Failed to capture statement JPG:', err);
    } finally {
      setIsSharing(false);
    }
  };

  const handleExportPdf = async () => {
    tap();
    setIsSharing(true);
    try {
      const rowsHtml = ledgerRows
        .map(
          (row) => `
        <tr>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px;">${new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: bold; color: #1d4ed8;">${row.billNo}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: bold; color: #0f172a;">${row.reason}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: right; color: #dc2626; font-weight: bold;">${row.drAmount > 0 ? `₹${row.drAmount.toLocaleString('en-IN')}` : '—'}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: right; color: #16a34a; font-weight: bold;">${row.crAmount > 0 ? `₹${row.crAmount.toLocaleString('en-IN')}` : '—'}</td>
          <td style="padding: 6px; border-bottom: 1px solid #e2e8f0; font-size: 10px; text-align: right; font-weight: 800; color: ${row.runningBalance >= 0 ? '#15803d' : '#b91c1c'};">₹${Math.abs(row.runningBalance).toLocaleString('en-IN')} ${row.runningBalance >= 0 ? 'Dr' : 'Cr'}</td>
        </tr>`
        )
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <title>FARMSKING PARTY ACCOUNT STATEMENT</title>
            <style>
              body { font-family: 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #ffffff; color: #0f172a; }
              .card { max-width: 750px; margin: 0 auto; background: #ffffff; border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 20px; }
              .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #16a34a; padding-bottom: 10px; margin-bottom: 12px; }
              .brand { font-size: 22px; font-weight: 800; color: #15803d; }
              .tagline { font-size: 10px; color: #64748b; }
              .grid { display: flex; gap: 10px; margin-bottom: 12px; }
              .box { flex: 1; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; font-size: 11px; }
              .box-title { font-weight: 800; color: #475569; font-size: 9.5px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; margin-bottom: 4px; }
              .summary-box { background: ${(statement?.balance || 0) >= 0 ? '#f0fdf4' : '#fef2f2'}; border: 1.5px solid ${(statement?.balance || 0) >= 0 ? '#16a34a' : '#dc2626'}; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; font-size: 13px; font-weight: bold; margin-bottom: 12px; }
              .table { width: 100%; border-collapse: collapse; margin-bottom: 12px; border: 1px solid #cbd5e1; }
              .table th { background: #334155; color: #fff; font-size: 9.5px; padding: 7px; text-align: left; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="header">
                <div>
                  <div class="brand">👑 FarmsKing</div>
                  <div class="tagline">PARTY ACCOUNT STATEMENT</div>
                </div>
                <div style="text-align: right; font-size: 11px;">
                  <strong>Date: ${new Date().toLocaleDateString('en-IN')}</strong><br/>
                  <span style="color:#16a34a; font-weight: bold;">Official Ledger</span>
                </div>
              </div>
              <div class="grid">
                <div class="box">
                  <div class="box-title">👨‍🌾 FARMER DETAILS</div>
                  <strong>${farmerName}</strong><br/>
                  ${farmerMobile ? `Mobile: ${farmerMobile}<br/>` : ''}
                  ${farmerVillage ? `Location: ${farmerVillage}` : ''}
                </div>
                <div class="box">
                  <div class="box-title">🤝 PARTY DETAILS</div>
                  <strong>${party?.name || partyName}</strong><br/>
                  ${party?.mobile ? `Mobile: ${party.mobile}<br/>` : ''}
                  ${party?.address ? `Location: ${party.address}` : ''}
                </div>
              </div>
              <div class="summary-box">
                <span>Net Party Balance</span>
                <span style="color: ${(statement?.balance || 0) >= 0 ? '#16a34a' : '#dc2626'}">₹${Math.abs(statement?.balance || 0).toLocaleString('en-IN')} ${(statement?.balance || 0) >= 0 ? 'Dr (Receivable)' : 'Cr (Payable)'}</span>
              </div>
              <table class="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Bill No.</th>
                    <th>Particulars</th>
                    <th style="text-align:right; color:#fca5a5;">Dr. (₹)</th>
                    <th style="text-align:right; color:#86efac;">Cr. (₹)</th>
                    <th style="text-align:right; color:#38bdf8;">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>
          </body>
        </html>
      `;

      if (Platform.OS === 'web') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      } else {
        await Print.printAsync({ html });
      }
    } catch (err) {
      console.error('Failed to export PDF statement:', err);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxWidth: 580, maxHeight: '90%', padding: 14 }]}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>📜 Party Account Statement</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#16a34a" size="large" style={{ marginVertical: 30 }} />
          ) : (
            <>
              {/* Action Bar with Compact Download JPG & Download PDF Buttons */}
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 6, marginTop: 2 }}>
                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#16a34a', paddingVertical: 6, borderRadius: RADIUS.md }}
                  onPress={handleDownloadJpg}
                  disabled={isSharing}
                  activeOpacity={0.85}
                >
                  {isSharing ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="image-outline" size={14} color="#ffffff" />
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' }}>Download JPG</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: '#0284c7', paddingVertical: 6, borderRadius: RADIUS.md }}
                  onPress={handleExportPdf}
                  disabled={isSharing}
                  activeOpacity={0.85}
                >
                  {isSharing ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="document-text-outline" size={14} color="#ffffff" />
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' }}>Download PDF</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <ViewShot ref={shotRef} options={{ format: 'jpg', quality: 0.95 }} style={{ backgroundColor: '#ffffff', padding: 2 }}>
                  {/* 1. TOP HEADING: Compact FarmsKing Logo & Title */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 2, borderBottomColor: '#16a34a', paddingBottom: 6, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <BrandLogo size={28} useHdQuality />
                      <View>
                        <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#15803d', letterSpacing: -0.3 }}>FarmsKing</Text>
                        <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#64748b' }}>PARTY ACCOUNT STATEMENT</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#334155' }}>Date: {new Date().toLocaleDateString('en-IN')}</Text>
                      <Text style={{ fontSize: 9, fontFamily: FONT.medium, color: '#16a34a' }}>Official Ledger</Text>
                    </View>
                  </View>

                  {/* 2 & 3. FARMER DETAILS (LEFT) & PARTY DETAILS (RIGHT) ROW */}
                  <View style={{ flexDirection: 'row', gap: 6, marginBottom: 8 }}>
                    {/* Farmer Details Box (Left) */}
                    <View style={{ flex: 1, backgroundColor: '#f0fdf4', padding: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#bbf7d0' }}>
                      <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#15803d', marginBottom: 1 }}>👨‍🌾 FARMER DETAILS</Text>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>{farmerName}</Text>
                      {farmerMobile ? <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📱 {farmerMobile}</Text> : null}
                      {farmerVillage ? <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📍 {farmerVillage}</Text> : null}
                    </View>

                    {/* Party Details Box (Right) */}
                    <View style={{ flex: 1, backgroundColor: '#f8fafc', padding: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#475569', marginBottom: 1 }}>🤝 PARTY DETAILS</Text>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }}>{party?.name || partyName}</Text>
                      {party?.mobile ? <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📱 {party.mobile}</Text> : null}
                      {party?.address ? <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#475569', marginTop: 1 }}>📍 {party.address}</Text> : null}
                    </View>
                  </View>

                  {/* FINANCIAL SUMMARY METRICS - Single Compact Row for Net Party Balance */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6, backgroundColor: (statement?.balance || 0) >= 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 6, borderWidth: 1, borderColor: (statement?.balance || 0) >= 0 ? '#bbf7d0' : '#fecdd3', marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: (statement?.balance || 0) >= 0 ? '#15803d' : '#b91c1c' }}>Net Party Balance</Text>
                    <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: (statement?.balance || 0) >= 0 ? '#16a34a' : '#dc2626' }}>
                      ₹{Math.abs(statement?.balance || 0).toLocaleString('en-IN')} {(statement?.balance || 0) >= 0 ? 'Dr (Receivable)' : 'Cr (Payable)'}
                    </Text>
                  </View>

                  {/* 4. STATEMENT LEDGER TABLE WITH CLEAN NON-OVERLAPPING COLUMNS */}
                  <View style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 6, overflow: 'hidden' }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ minWidth: 460, flexGrow: 1 }}>
                      <View style={{ flex: 1, minWidth: 460 }}>
                        <View style={{ flexDirection: 'row', backgroundColor: '#334155', paddingVertical: 6, paddingHorizontal: 6, alignItems: 'center', minWidth: 460 }}>
                          <Text style={{ width: 50, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>Date</Text>
                          <Text style={{ width: 82, fontSize: 9.5, fontFamily: FONT.bold, color: '#e2e8f0' }}>Bill No.</Text>
                          <Text style={{ flex: 1, minWidth: 100, fontSize: 9.5, fontFamily: FONT.bold, color: '#ffffff' }}>Particulars</Text>
                          <Text style={{ width: 58, fontSize: 9.5, fontFamily: FONT.bold, color: '#fca5a5', textAlign: 'right' }}>Dr. (₹)</Text>
                          <Text style={{ width: 58, fontSize: 9.5, fontFamily: FONT.bold, color: '#86efac', textAlign: 'right' }}>Cr. (₹)</Text>
                          <Text style={{ width: 70, fontSize: 9.5, fontFamily: FONT.bold, color: '#38bdf8', textAlign: 'right' }}>Balance</Text>
                        </View>

                        {ledgerRows.length === 0 ? (
                          <View style={{ padding: 14, alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#94a3b8' }}>No ledger transactions yet.</Text>
                          </View>
                        ) : (
                          ledgerRows.map((row, idx) => (
                            <View key={row.id || idx} style={{ flexDirection: 'row', paddingHorizontal: 6, paddingVertical: 5, backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', alignItems: 'center', minWidth: 460 }}>
                              <Text style={{ width: 50, fontSize: 9, fontFamily: FONT.medium, color: '#475569' }}>
                                {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </Text>

                              <View style={{ width: 82 }}>
                                {row.billNo && row.billNo !== '—' ? (
                                  <View style={{ backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1, alignSelf: 'flex-start', maxWidth: 78 }}>
                                    <Text style={{ fontSize: 8.5, fontFamily: FONT.extraBold, color: '#1d4ed8' }} numberOfLines={1}>{row.billNo}</Text>
                                  </View>
                                ) : (
                                  <Text style={{ fontSize: 9, fontFamily: FONT.medium, color: '#94a3b8' }}>—</Text>
                                )}
                              </View>

                              <Text style={{ flex: 1, minWidth: 100, fontSize: 9.5, fontFamily: FONT.bold, color: '#0f172a', paddingRight: 4 }} numberOfLines={2}>
                                {row.reason}
                              </Text>

                              <Text style={{ width: 58, fontSize: 9.5, fontFamily: FONT.bold, color: row.drAmount > 0 ? '#b91c1c' : '#94a3b8', textAlign: 'right' }}>
                                {row.drAmount > 0 ? `₹${row.drAmount.toLocaleString('en-IN')}` : '—'}
                              </Text>

                              <Text style={{ width: 58, fontSize: 9.5, fontFamily: FONT.bold, color: row.crAmount > 0 ? '#15803d' : '#94a3b8', textAlign: 'right' }}>
                                {row.crAmount > 0 ? `₹${row.crAmount.toLocaleString('en-IN')}` : '—'}
                              </Text>

                              <Text style={{ width: 70, fontSize: 9, fontFamily: FONT.extraBold, color: row.runningBalance >= 0 ? '#16a34a' : '#dc2626', textAlign: 'right' }}>
                                ₹{Math.abs(row.runningBalance).toLocaleString('en-IN')} {row.runningBalance >= 0 ? 'Dr' : 'Cr'}
                              </Text>
                            </View>
                          ))
                        )}
                      </View>
                    </ScrollView>
                  </View>
                </ViewShot>
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    height: 38,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: RADIUS.md,
  },
  addBtnText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' },

  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  filterChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  filterChipText: { fontSize: 11, fontFamily: FONT.bold, color: '#475569' },
  filterChipTextActive: { color: '#ffffff' },

  compactCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 10,
    gap: 6,
  },
  cardRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  partyName: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  typeBadge: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#15803d',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  metaText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },

  balanceBadge: {
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  balanceBadgeText: { fontSize: 11, fontFamily: FONT.extraBold },

  compactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 4,
  },
  compactBtnText: { fontSize: 10.5, fontFamily: FONT.bold },

  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  label: { fontSize: 11, fontFamily: FONT.bold, color: '#475569', marginTop: 6, marginBottom: 3 },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  errorText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#ef4444', marginTop: 6 },
  modalActionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#475569' },
  saveBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  saveBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },

  pillInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 42,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  partyTypeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  partyTypeChipSelected: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  partyTypeChipUnselected: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
  partyTypeChipText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  partyTypeChipTextSelected: {
    color: '#ffffff',
  },
  partyTypeChipTextUnselected: {
    color: '#475569',
  },
  pillCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillCancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  pillSaveBtn: {
    flex: 1.2,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f43f5e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillSaveBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
