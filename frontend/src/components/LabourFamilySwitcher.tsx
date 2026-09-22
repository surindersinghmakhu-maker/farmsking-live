import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { Avatar } from '@/src/components/Avatar';
import { LabourWorker } from '@/src/types/api';
import { formatInr } from '@/src/utils/formatInr';
import { uploadPhoto } from '@/src/api/uploads.api';
import { useCreateLabourWorker, useUpdateLabourWorker } from '@/src/hooks/useLabour';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const RELATION_OPTIONS = [
  { key: 'Head / Self', label: '👨‍🌾 Head / Self' },
  { key: 'Spouse / Wife', label: '👩‍🌾 Wife / Spouse' },
  { key: 'Son', label: '👨‍🦱 Son' },
  { key: 'Daughter', label: '👩‍🦱 Daughter' },
  { key: 'Brother', label: '👨‍👦 Brother' },
  { key: 'Other', label: '👷 Family Member' },
];

interface FarmerGroup {
  id: string;
  name: string;
  mobile?: string;
  village?: string;
  photoUrl?: string;
}

interface LabourFamilySwitcherProps {
  workers: LabourWorker[];
  selectedWorkerId: string | null;
  onSelectWorker: (worker: LabourWorker) => void;
  onRefresh?: () => void;
  farmerList?: FarmerGroup[];
  selectedFarmerId?: string | null;
  onSelectFarmer?: (farmerId: string | null) => void;
  hideFarmerSwitcher?: boolean;
  showActiveCard?: boolean;
  showAddButton?: boolean;
  openEditSignal?: number;
}

export function LabourFamilySwitcher({
  workers,
  selectedWorkerId,
  onSelectWorker,
  onRefresh,
  farmerList = [],
  selectedFarmerId,
  onSelectFarmer,
  hideFarmerSwitcher = false,
  showActiveCard = true,
  showAddButton = true,
  openEditSignal,
}: LabourFamilySwitcherProps) {
  const createWorker = useCreateLabourWorker();
  const updateWorker = useUpdateLabourWorker();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingWorker, setEditingWorker] = useState<LabourWorker | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  // Form state for adding family member
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Head / Self');
  const [mobile, setMobile] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [defaultRate, setDefaultRate] = useState('');
  const [defaultUnit, setDefaultUnit] = useState('Days');
  const [formError, setFormError] = useState<string | null>(null);
  const [isUnitDropdownOpen, setIsUnitDropdownOpen] = useState(false);

  // Form state for editing active profile
  const [editName, setEditName] = useState('');
  const [editRelation, setEditRelation] = useState('Head / Self');
  const [editMobile, setEditMobile] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState<string | null>(null);
  const [editDefaultRate, setEditDefaultRate] = useState('');
  const [editDefaultUnit, setEditDefaultUnit] = useState('Days');
  const [editFormError, setEditFormError] = useState<string | null>(null);
  const [isEditUnitDropdownOpen, setIsEditUnitDropdownOpen] = useState(false);

  const openEditModal = (targetWorker: LabourWorker) => {
    tap();
    setEditingWorker(targetWorker);
    setEditName(targetWorker.name || '');
    setEditRelation(targetWorker.relation || 'Head / Self');
    setEditMobile(targetWorker.mobile || '');
    setEditPhotoUrl(targetWorker.photoUrl || null);
    setEditDefaultRate(targetWorker.defaultRate ? String(targetWorker.defaultRate) : '');
    setEditDefaultUnit(targetWorker.defaultUnit || 'Days');
    setEditFormError(null);
    setIsEditModalOpen(true);
  };

  const pickPhotoForEditForm = async () => {
    tap();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to select a picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadPhoto(result.assets[0].uri);
      setEditPhotoUrl(uploaded.fileUrl);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSaveEditProfile = async () => {
    if (!editingWorker) return;
    setEditFormError(null);
    if (!editName.trim()) {
      setEditFormError('Member Name is required.');
      return;
    }

    try {
      await updateWorker.mutateAsync({
        id: editingWorker.id,
        payload: {
          name: editName.trim(),
          relation: editRelation,
          mobile: editMobile.trim() || undefined,
          photoUrl: editPhotoUrl || undefined,
          defaultRate: editDefaultRate ? Number(editDefaultRate) : undefined,
          defaultUnit: editDefaultUnit.trim() || 'Days',
        },
      });
      setIsEditModalOpen(false);
      setEditingWorker(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setEditFormError(err?.response?.data?.message || 'Could not update profile.');
    }
  };

  // Derived list of distinct farmers from workers if farmerList not provided
  const availableFarmers = useMemo(() => {
    if (farmerList.length > 0) return farmerList;
    const map = new Map<string, FarmerGroup>();
    workers.forEach((w) => {
      const f = (w as any).farmer;
      if (f && f.id && !map.has(f.id)) {
        map.set(f.id, {
          id: f.id,
          name: f.name || 'Farmer',
          mobile: f.mobile,
          village: f.village,
          photoUrl: f.photoUrl,
        });
      }
    });
    return Array.from(map.values());
  }, [farmerList, workers]);

  // Filter workers by selected farmer (defaults to first available farmer)
  const activeFarmerId = useMemo(() => {
    if (selectedFarmerId) return selectedFarmerId;
    if (availableFarmers.length > 0) return availableFarmers[0].id;
    return null;
  }, [selectedFarmerId, availableFarmers]);

  const filteredWorkersByFarmer = useMemo(() => {
    if (!activeFarmerId) return workers;
    return workers.filter((w) => (w as any).farmerId === activeFarmerId || (w as any).farmer?.id === activeFarmerId);
  }, [workers, activeFarmerId]);

  const displayWorkers = hideFarmerSwitcher ? workers : filteredWorkersByFarmer;

  // Active Worker Object
  const activeWorker = useMemo(() => {
    if (!selectedWorkerId && displayWorkers.length > 0) return displayWorkers[0];
    return displayWorkers.find((w) => w.id === selectedWorkerId) || displayWorkers[0] || null;
  }, [displayWorkers, selectedWorkerId]);

  // Trigger external edit modal signal
  React.useEffect(() => {
    if (openEditSignal && openEditSignal > 0 && activeWorker) {
      openEditModal(activeWorker);
    }
  }, [openEditSignal, activeWorker]);

  // Handle Pick Photo in Add Form
  const pickPhotoForForm = async () => {
    tap();
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to select a picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (result.canceled || !result.assets[0]) return;

    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadPhoto(result.assets[0].uri);
      setPhotoUrl(uploaded.fileUrl);
    } catch {
      Alert.alert('Upload Failed', 'Could not upload photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleAddFamilyMember = async () => {
    setFormError(null);
    if (!name.trim()) {
      setFormError('Member Name is required.');
      return;
    }

    try {
      const newWorker = await createWorker.mutateAsync({
        name: name.trim(),
        relation,
        mobile: mobile.trim() || undefined,
        photoUrl: photoUrl || undefined,
        defaultRate: defaultRate ? Number(defaultRate) : undefined,
        defaultUnit: defaultUnit.trim() || 'Days',
      });
      setIsAddModalOpen(false);
      resetForm();
      if (newWorker) onSelectWorker(newWorker);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setFormError(err?.response?.data?.message || 'Could not add family member.');
    }
  };

  const resetForm = () => {
    setName('');
    setRelation('Head / Self');
    setMobile('');
    setPhotoUrl(null);
    setDefaultRate('');
    setDefaultUnit('Days');
    setFormError(null);
  };

  return (
    <View style={styles.container}>
      {/* 1. FARMER SWITCHER CARD (DISTINCT GREEN/EMERALD BACKGROUND) */}
      {!hideFarmerSwitcher && availableFarmers.length > 0 && (
        <View style={styles.farmerCardContainer}>
          <View style={styles.cardHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 15 }}>🌾</Text>
              <Text style={styles.farmerCardTitle}>Select Farmer / Kheti Malik</Text>
            </View>
            <View style={styles.farmerRoleBadge}>
              <Text style={styles.farmerRoleBadgeText}>Employer / Landowner</Text>
            </View>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.avatarScrollContainer}>
            {availableFarmers.map((f) => {
              const isSelected = activeFarmerId === f.id;
              return (
                <TouchableOpacity
                  key={`farmer-${f.id}`}
                  style={[styles.avatarCard, isSelected && styles.avatarCardActive]}
                  activeOpacity={0.85}
                  onPress={() => {
                    tap();
                    if (onSelectFarmer) onSelectFarmer(f.id);
                  }}
                >
                  <View style={[styles.avatarRing, isSelected && styles.farmerRingActive]}>
                    <Avatar uri={f.photoUrl} size={54} />
                    {isSelected && (
                      <View style={styles.farmerActiveBadge}>
                        <Ionicons name="checkmark" size={10} color="#ffffff" />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.avatarName, isSelected && styles.farmerNameActive]} numberOfLines={1}>
                    {f.name}
                  </Text>
                  <Text style={styles.farmerSubText} numberOfLines={1}>
                    {f.village ? `📍 ${f.village}` : '🌾 Farmer'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 2. FAMILY WORKER PROFILE SWITCHER CARD (DISTINCT SLATE/BLUE BACKGROUND) */}
      <View style={styles.workerCardContainer}>
        <View style={styles.cardHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="people" size={18} color="#15803d" />
            <Text style={styles.workerCardTitle}>Family Profiles</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{displayWorkers.length} Members</Text>
            </View>
          </View>
          <Text style={styles.workerRoleTag}>Workers / Labour</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.avatarScrollContainer}
        >
          {displayWorkers.map((w) => {
            const isSelected = activeWorker?.id === w.id;

            return (
              <TouchableOpacity
                key={`worker-${w.id}`}
                style={[styles.avatarCard, isSelected && styles.avatarCardActive]}
                activeOpacity={0.85}
                onPress={() => {
                  tap();
                  onSelectWorker(w);
                }}
              >
                <View style={[styles.avatarRing, isSelected && styles.avatarRingActive]}>
                  <Avatar uri={w.photoUrl} size={54} />
                  {isSelected && (
                    <View style={styles.activeBadge}>
                      <Ionicons name="checkmark" size={10} color="#ffffff" />
                    </View>
                  )}
                </View>

                <Text style={[styles.avatarName, isSelected && styles.avatarNameActive]} numberOfLines={1}>
                  {w.name}
                </Text>
                <Text style={styles.avatarRelation} numberOfLines={1}>
                  {w.relation || 'Member'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 4. ACTIVE PROFILE CARD WITH PHOTO EDIT ON TAP */}
      {showActiveCard && activeWorker && (
        <View style={[styles.activeProfileCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.activeProfileHeader}>
            <TouchableOpacity
              style={styles.activePhotoWrap}
              activeOpacity={0.85}
              onPress={() => openEditModal(activeWorker)}
            >
              <Avatar uri={activeWorker.photoUrl} size={54} />
              <View style={styles.activeCameraOverlay}>
                <Ionicons name="camera" size={12} color="#ffffff" />
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ flex: 1 }}
              activeOpacity={0.85}
              onPress={() => openEditModal(activeWorker)}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.activeName}>{activeWorker.name}</Text>
                {activeWorker.relation && (
                  <View style={styles.relationBadge}>
                    <Text style={styles.relationBadgeText}>{activeWorker.relation}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.activeSubtitle}>
                {activeWorker.mobile ? `📱 ${activeWorker.mobile}` : 'Labour Member Profile'}
                {activeWorker.defaultRate ? ` · ₹${activeWorker.defaultRate}/${activeWorker.defaultUnit || 'Day'}` : ''}
              </Text>
              <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a', marginTop: 3 }}>
                📷 Tap profile photo to edit profile / change photo
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.updatePhotoCta}
              activeOpacity={0.8}
              onPress={() => openEditModal(activeWorker)}
            >
              <Ionicons name="pencil" size={13} color="#16a34a" />
              <Text style={styles.updatePhotoCtaText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Inline Financial Summary for Selected Member */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Earned</Text>
              <Text style={[styles.statVal, { color: '#c2410c' }]}>
                {formatInr(activeWorker.totalEarned ?? 0)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Total Paid</Text>
              <Text style={[styles.statVal, { color: '#16a34a' }]}>
                {formatInr(activeWorker.totalPaid ?? 0)}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Pending Bal</Text>
              <Text
                style={[
                  styles.statVal,
                  { color: (activeWorker.pendingBalance ?? 0) > 0 ? '#dc2626' : '#16a34a' },
                ]}
              >
                {formatInr(activeWorker.pendingBalance ?? 0)}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* 5. ADD FAMILY MEMBER BUTTON BELOW ACTIVE PROFILE CARD */}
      {showAddButton && (
        <TouchableOpacity
          style={styles.addFamilyMemberBarBtn}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            resetForm();
            setIsAddModalOpen(true);
          }}
        >
          <Ionicons name="person-add-outline" size={16} color="#15803d" />
          <Text style={styles.addFamilyMemberBarBtnText}>+ Add Family Member Profile</Text>
        </TouchableOpacity>
      )}

      {/* 5. ADD FAMILY MEMBER MODAL */}
      <Modal visible={isAddModalOpen} transparent animationType="slide" onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Family Member Profile</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Photo Upload Box */}
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <TouchableOpacity
                  style={styles.formAvatarWrap}
                  activeOpacity={0.8}
                  onPress={pickPhotoForForm}
                >
                  <Avatar uri={photoUrl} size={64} />
                  <View style={styles.formCameraOverlay}>
                    <Ionicons name="camera" size={14} color="#ffffff" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickPhotoForForm} style={{ marginTop: 6 }}>
                  <Text style={styles.uploadPhotoLink}>📷 Upload Photo for Illiterate Identification</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Member Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Suman Devi / Jeet Singh"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.label}>Family Relation / Rishta</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {RELATION_OPTIONS.map((r) => {
                  const isSelected = relation === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.relationChip, isSelected && styles.relationChipActive]}
                      onPress={() => setRelation(r.key)}
                    >
                      <Text style={[styles.relationChipText, isSelected && styles.relationChipTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>Mobile Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
              />

              <View style={{ flexDirection: 'row', gap: 10, zIndex: 100 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Default Daily Rate (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 500"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={defaultRate}
                    onChangeText={setDefaultRate}
                  />
                </View>
                <View style={{ flex: 1.2, position: 'relative' }}>
                  <Text style={styles.label}>Working Unit *</Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: isUnitDropdownOpen ? '#16a34a' : '#cbd5e1',
                      borderRadius: RADIUS.md,
                      paddingHorizontal: 8,
                      height: 40,
                      backgroundColor: '#f8fafc',
                    }}
                    activeOpacity={0.8}
                    onPress={() => setIsUnitDropdownOpen((prev) => !prev)}
                  >
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
                      {defaultUnit}
                    </Text>
                    <Ionicons name={isUnitDropdownOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#64748b" />
                  </TouchableOpacity>

                  {/* Dropdown Options */}
                  {isUnitDropdownOpen && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 62,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#ffffff',
                        borderRadius: RADIUS.md,
                        borderWidth: 1.5,
                        borderColor: '#cbd5e1',
                        maxHeight: 180,
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                      }}
                    >
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {[
                          'Days (ਦਿਨ / ਡੇਲੀ)',
                          'Hours (ਘੰਟੇ / ਪਰ ਘੰਟਾ)',
                          'Monthly (ਮਹੀਨਾਵਾਰ)',
                          'Fixed Contract / Lumpsum (ਫਿਕਸ / ਠੇਕਾ)',
                          'Acre / Kila (ਏਕੜ / ਕਿੱਲਾ)',
                          'Bags / Catt (ਬੋਰੀਆਂ / ਕੱਟੇ)',
                          'Quintal / Kg (ਕੁਇੰਟਲ / ਕਿੱਲੋ)',
                          'Trips (ਗੇੜੇ / ਟ੍ਰਿਪ)',
                        ].map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: '#f1f5f9',
                              backgroundColor: defaultUnit === u ? '#f0fdf4' : '#ffffff',
                            }}
                            onPress={() => {
                              setDefaultUnit(u);
                              setIsUnitDropdownOpen(false);
                            }}
                          >
                            <Text style={{ fontSize: 11.5, fontFamily: defaultUnit === u ? FONT.bold : FONT.regular, color: defaultUnit === u ? '#16a34a' : '#334155' }}>
                              {u}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsAddModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleAddFamilyMember}
                disabled={createWorker.isPending || isUploadingPhoto}
              >
                {createWorker.isPending || isUploadingPhoto ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Family Member</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 6. EDIT FAMILY MEMBER / WORKER PROFILE MODAL */}
      <Modal visible={isEditModalOpen} transparent animationType="slide" onRequestClose={() => setIsEditModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Member Profile / Photo</Text>
              <TouchableOpacity onPress={() => setIsEditModalOpen(false)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
              {/* Photo Upload Box */}
              <View style={{ alignItems: 'center', marginVertical: 10 }}>
                <TouchableOpacity
                  style={styles.formAvatarWrap}
                  activeOpacity={0.8}
                  onPress={pickPhotoForEditForm}
                >
                  <Avatar uri={editPhotoUrl} size={72} />
                  <View style={styles.formCameraOverlay}>
                    <Ionicons name="camera" size={14} color="#ffffff" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={pickPhotoForEditForm} style={{ marginTop: 6 }}>
                  <Text style={styles.uploadPhotoLink}>📷 Change Profile Photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Member Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Suman Devi / Jeet Singh"
                placeholderTextColor="#94a3b8"
                value={editName}
                onChangeText={setEditName}
              />

              <Text style={styles.label}>Family Relation / Rishta</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
                {RELATION_OPTIONS.map((r) => {
                  const isSelected = editRelation === r.key;
                  return (
                    <TouchableOpacity
                      key={r.key}
                      style={[styles.relationChip, isSelected && styles.relationChipActive]}
                      onPress={() => setEditRelation(r.key)}
                    >
                      <Text style={[styles.relationChipText, isSelected && styles.relationChipTextActive]}>
                        {r.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={styles.label}>Mobile Number (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94a3b8"
                keyboardType="phone-pad"
                value={editMobile}
                onChangeText={setEditMobile}
              />

              <View style={{ flexDirection: 'row', gap: 10, zIndex: 100 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Default Daily Rate (₹)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 500"
                    placeholderTextColor="#94a3b8"
                    keyboardType="numeric"
                    value={editDefaultRate}
                    onChangeText={setEditDefaultRate}
                  />
                </View>
                <View style={{ flex: 1.2, position: 'relative' }}>
                  <Text style={styles.label}>Working Unit *</Text>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderWidth: 1,
                      borderColor: isEditUnitDropdownOpen ? '#16a34a' : '#cbd5e1',
                      borderRadius: RADIUS.md,
                      paddingHorizontal: 8,
                      height: 40,
                      backgroundColor: '#f8fafc',
                    }}
                    activeOpacity={0.8}
                    onPress={() => setIsEditUnitDropdownOpen((prev) => !prev)}
                  >
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' }} numberOfLines={1}>
                      {editDefaultUnit}
                    </Text>
                    <Ionicons name={isEditUnitDropdownOpen ? 'chevron-up' : 'chevron-down'} size={14} color="#64748b" />
                  </TouchableOpacity>

                  {/* Dropdown Options */}
                  {isEditUnitDropdownOpen && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 62,
                        left: 0,
                        right: 0,
                        zIndex: 1000,
                        backgroundColor: '#ffffff',
                        borderRadius: RADIUS.md,
                        borderWidth: 1.5,
                        borderColor: '#cbd5e1',
                        maxHeight: 180,
                        elevation: 10,
                        shadowColor: '#000',
                        shadowOpacity: 0.2,
                        shadowRadius: 8,
                      }}
                    >
                      <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled">
                        {[
                          'Days (ਦਿਨ / ਡੇਲੀ)',
                          'Hours (ਘੰਟੇ / ਪਰ ਘੰਟਾ)',
                          'Monthly (ਮਹੀਨਾਵਾਰ)',
                          'Fixed Contract / Lumpsum (ਫਿਕਸ / ਠੇਕਾ)',
                          'Acre / Kila (ਏਕੜ / ਕਿੱਲਾ)',
                          'Bags / Catt (ਬੋਰੀਆਂ / ਕੱਟੇ)',
                          'Quintal / Kg (ਕੁਇੰਟਲ / ਕਿੱਲੋ)',
                          'Trips (ਗੇੜੇ / ਟ੍ਰਿਪ)',
                        ].map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={{
                              paddingHorizontal: 10,
                              paddingVertical: 8,
                              borderBottomWidth: 1,
                              borderBottomColor: '#f1f5f9',
                              backgroundColor: editDefaultUnit === u ? '#f0fdf4' : '#ffffff',
                            }}
                            onPress={() => {
                              setEditDefaultUnit(u);
                              setIsEditUnitDropdownOpen(false);
                            }}
                          >
                            <Text style={{ fontSize: 11.5, fontFamily: editDefaultUnit === u ? FONT.bold : FONT.regular, color: editDefaultUnit === u ? '#16a34a' : '#334155' }}>
                              {u}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </ScrollView>

            {editFormError ? <Text style={styles.errorText}>{editFormError}</Text> : null}

            <View style={styles.modalActionRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveEditProfile}
                disabled={updateWorker.isPending || isUploadingPhoto}
              >
                {updateWorker.isPending || isUploadingPhoto ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.saveBtnText}>Save Profile Changes</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  addFamilyMemberBarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    paddingVertical: 9,
    paddingHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
  },
  addFamilyMemberBarBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  container: {
    marginVertical: SPACING.sm,
  },
  farmerSwitcherBox: {
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  farmerCardContainer: {
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    padding: SPACING.sm,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#16a34a',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  workerCardContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    padding: SPACING.sm,
    marginBottom: SPACING.sm,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  farmerCardTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  farmerRoleBadge: {
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  farmerRoleBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  workerCardTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  countBadge: {
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  countBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  workerRoleTag: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  farmerRingActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  farmerActiveBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#16a34a',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  farmerNameActive: {
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  farmerSubText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
  addMemberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  addMemberBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  avatarScrollContainer: {
    gap: 12,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  avatarCard: {
    alignItems: 'center',
    width: 74,
  },
  avatarCardActive: {
    opacity: 1,
  },
  avatarRing: {
    position: 'relative',
    padding: 3,
    borderRadius: 35,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarRingActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  activeBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#16a34a',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cameraBadgeBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#0f172a',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  avatarName: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 4,
    textAlign: 'center',
  },
  avatarNameActive: {
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  avatarRelation: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
  },
  quickAddCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  quickAddCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
  },
  quickAddText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
    marginTop: 4,
  },
  activeProfileCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  activeProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: SPACING.sm,
  },
  activePhotoWrap: {
    position: 'relative',
  },
  activeCameraOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#16a34a',
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  activeName: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  relationBadge: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  relationBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  activeSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  updatePhotoCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  updatePhotoCtaText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  statVal: {
    fontSize: 13,
    fontFamily: FONT.bold,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#cbd5e1',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  formAvatarWrap: {
    position: 'relative',
  },
  formCameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#16a34a',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  uploadPhotoLink: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  label: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  input: {
    height: 40,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: FONT.regular,
    backgroundColor: '#f8fafc',
  },
  relationChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  relationChipActive: {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
  },
  relationChipText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  relationChipTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 8,
  },
  modalActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: SPACING.md,
  },
  cancelBtn: {
    flex: 1,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  saveBtn: {
    flex: 1.5,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
