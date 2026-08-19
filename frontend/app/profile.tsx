import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/store/auth-context';
import { useUpdateMyAddress } from '@/src/hooks/useAdvisorProfile';
import { useMyAddresses, useCreateAddress, useDeleteAddress } from '@/src/hooks/useAddresses';
import { lookupPincode, PincodeOffice } from '@/src/api/pincode.api';
import { uploadPhoto } from '@/src/api/uploads.api';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { AVATAR_PRESETS } from '@/src/constants/avatarPresets';
import { Avatar } from '@/src/components/Avatar';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const updateAddress = useUpdateMyAddress();
  const theme = RoleThemes[user?.role === 'ADVISOR' ? 'FARM_ADVISOR' : 'FARMER'] ?? RoleThemes.FARMER;

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ADDRESSES'>('PROFILE');

  // This screen is the single canonical profile for the account — one per mobile number, shared across
  // every role the account holds. Name/email/photo/address all write to the same User row on save.
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [customPhotoInput, setCustomPhotoInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [pincode, setPincode] = useState(user?.pincode ?? '');
  const [postOffice, setPostOffice] = useState(user?.postOffice ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [officeOptions, setOfficeOptions] = useState<PincodeOffice[]>([]);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeStatus, setPincodeStatus] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to choose a picture.');
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
      Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const fetchLocationFromPincode = async (codeToFetch?: string) => {
    const target = codeToFetch || pincode;
    if (!target || target.length !== 6) {
      setPincodeStatus('⚠️ Please enter a valid 6-digit PIN Code first');
      return;
    }
    setIsPincodeLoading(true);
    setPincodeStatus(null);
    try {
      const result = await lookupPincode(target);
      setOfficeOptions(result.offices);
      setPostOffice(result.postOffice);
      setDistrict(result.district);
      setState(result.state);
      setPincodeStatus(`✨ Address Fetched: ${result.postOffice}, ${result.district}, ${result.state}`);
    } catch (err: any) {
      setPincodeStatus(`❌ ${err?.message ?? 'Could not fetch PIN details'}`);
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const saveProfile = async () => {
    tap();
    setSaveError(null);
    setIsSaved(false);
    if (pincode && pincode.trim().length !== 6) {
      setPincodeStatus('❌ PIN Code must be exactly 6 digits.');
      return;
    }
    try {
      await updateAddress.mutateAsync({
        name: name.trim() || undefined,
        email: email.trim() || undefined,
        photoUrl: photoUrl ?? undefined,
        pincode: pincode.trim() || undefined,
        postOffice: postOffice.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Could not save your profile.');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PROFILE' && styles.activeTabBtn]}
          onPress={() => { tap(); setActiveTab('PROFILE'); }}
        >
          <Ionicons name="person-outline" size={17} color={activeTab === 'PROFILE' ? theme.primary : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'PROFILE' && { color: theme.primary }]}>My Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ADDRESSES' && styles.activeTabBtn]}
          onPress={() => { tap(); setActiveTab('ADDRESSES'); }}
        >
          <Ionicons name="location-outline" size={17} color={activeTab === 'ADDRESSES' ? theme.primary : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'ADDRESSES' && { color: theme.primary }]}>My Addresses</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ADDRESSES' ? (
        <AddressesTab theme={theme} />
      ) : (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.avatarSection}>
            <TouchableOpacity style={styles.avatarRingBig} activeOpacity={0.85} onPress={() => setIsPhotoModalOpen(true)}>
              <Avatar uri={photoUrl} size={60} />
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={14} color="#ffffff" />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsPhotoModalOpen(true)}>
              <Text style={styles.changePhotoText}>📷 Change Profile Photo</Text>
            </TouchableOpacity>
            {user?.kingId ? (
              <View style={styles.kingIdBadge}>
                <Ionicons name="key-outline" size={12} color={theme.primary} />
                <Text style={[styles.kingIdText, { color: theme.primary }]}>King ID: {user.kingId}</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.inputLabel}>Full Name</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={16} color="#94a3b8" />
            <TextInput style={styles.input} value={name} onChangeText={setName} />
          </View>

          <Text style={styles.inputLabel}>Mobile Number</Text>
          <View style={[styles.inputWrap, styles.readOnlySelector]}>
            <Ionicons name="call-outline" size={16} color="#94a3b8" />
            <Text style={styles.readOnlyText}>{user?.mobile}</Text>
            <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
          </View>

          <Text style={styles.inputLabel}>Email Address</Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={16} color="#94a3b8" />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="you@example.com" placeholderTextColor="#94a3b8" />
          </View>

          <Text style={styles.inputLabel}>PIN Code</Text>
          <View style={styles.pincodeRow}>
            <View style={[styles.inputWrap, { flex: 1 }]}>
              <Ionicons name="navigate-outline" size={16} color={theme.primary} />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit PIN"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={(t) => {
                  setPincode(t);
                  if (t.length === 6) fetchLocationFromPincode(t);
                }}
              />
            </View>
            <TouchableOpacity
              style={[styles.fetchBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
              onPress={() => fetchLocationFromPincode(pincode)}
              disabled={isPincodeLoading}
            >
              {isPincodeLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="search" size={14} color="#ffffff" />
                  <Text style={styles.fetchBtnText}>Fetch Address</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          {pincodeStatus ? (
            <Text style={[styles.pincodeStatusText, pincodeStatus.includes('❌') && { color: '#dc2626' }]}>{pincodeStatus}</Text>
          ) : null}

          <Text style={styles.inputLabel}>Post Office / Locality</Text>
          {officeOptions.length > 1 ? (
            <View style={styles.officeChipRow}>
              {officeOptions.map((office) => (
                <TouchableOpacity
                  key={office.name}
                  style={[styles.officeChip, postOffice === office.name && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => {
                    tap();
                    setPostOffice(office.name);
                    setDistrict(office.district);
                    setState(office.state);
                  }}
                >
                  <Text style={[styles.officeChipText, postOffice === office.name && { color: '#ffffff' }]}>{office.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.inputWrap}>
              <Ionicons name="home-outline" size={16} color="#94a3b8" />
              <TextInput style={styles.input} value={postOffice} onChangeText={setPostOffice} placeholder="Auto-filled from PIN" placeholderTextColor="#94a3b8" />
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>District</Text>
              <View style={styles.readOnlySelector}>
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text style={styles.readOnlyText} numberOfLines={1}>{district || '—'}</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>State</Text>
              <View style={styles.readOnlySelector}>
                <Ionicons name="map-outline" size={16} color="#64748b" />
                <Text style={styles.readOnlyText} numberOfLines={1}>{state || '—'}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={styles.notificationRow}
            activeOpacity={0.75}
            onPress={() => { tap(); router.push('/notification-settings' as never); }}
          >
            <View style={[styles.rowIconBg, { backgroundColor: theme.primaryLight ?? '#f0fdf4' }]}>
              <Ionicons name="notifications-outline" size={16} color={theme.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Notification & Weather Settings</Text>
              <Text style={styles.rowSubLabel}>Push alerts, rain & temperature setup</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </TouchableOpacity>

          {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}
          {isSaved && (
            <View style={styles.savedNotice}>
              <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
              <Text style={styles.savedNoticeText}>Profile Details Saved Successfully!</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: theme.primary }]}
            onPress={saveProfile}
            disabled={updateAddress.isPending}
          >
            {updateAddress.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Profile Changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
      )}

      {isPhotoModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Profile Photo</Text>
              <TouchableOpacity onPress={() => setIsPhotoModalOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.browsePhotoBtn, { borderColor: theme.primary }]}
              activeOpacity={0.8}
              disabled={isUploadingPhoto}
              onPress={pickPhoto}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator color={theme.primary} size="small" />
              ) : (
                <>
                  <Ionicons name="image-outline" size={17} color={theme.primary} />
                  <Text style={[styles.browsePhotoBtnText, { color: theme.primary }]}>Browse from Device</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.inputLabel}>Choose Avatar Preset</Text>
            <View style={styles.presetGrid}>
              {AVATAR_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset.url}
                  style={styles.presetItemWrap}
                  onPress={() => {
                    tap();
                    setPhotoUrl(preset.url);
                  }}
                >
                  <View style={[styles.presetItem, photoUrl === preset.url && { borderColor: theme.primary, borderWidth: 3 }]}>
                    <Avatar uri={preset.url} size={54} />
                  </View>
                  <Text style={styles.presetLabel}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Or Enter Image URL</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="https://example.com/my-photo.jpg"
              value={customPhotoInput}
              onChangeText={setCustomPhotoInput}
            />

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                tap();
                if (customPhotoInput.trim()) {
                  setPhotoUrl(customPhotoInput.trim());
                }
                setIsPhotoModalOpen(false);
              }}
            >
              <Text style={styles.modalSubmitText}>Use Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

function AddressesTab({ theme }: { theme: (typeof RoleThemes)['FARMER'] }) {
  const { data: addresses = [], isLoading } = useMyAddresses();
  const deleteAddress = useDeleteAddress();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const removeAddress = (id: string) => {
    tap();
    deleteAddress.mutate(id);
  };

  return (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={{ width: '100%', maxWidth: 460, gap: 12 }}>
        <TouchableOpacity
          style={[styles.addAddressCta, { borderColor: theme.primary }]}
          activeOpacity={0.85}
          onPress={() => { tap(); setIsAddOpen(true); }}
        >
          <Ionicons name="add-circle" size={20} color={theme.primary} />
          <Text style={[styles.addAddressCtaText, { color: theme.primary }]}>Add New Address</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
        ) : addresses.length === 0 ? (
          <Text style={styles.addressEmptyText}>No saved addresses yet. Add one to use it at checkout.</Text>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={[styles.addressCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.addressCardHeader}>
                <View style={styles.addressTagBadge}>
                  <Text style={styles.addressTagText}>{addr.tag}</Text>
                </View>
                <TouchableOpacity onPress={() => removeAddress(addr.id)}>
                  <Ionicons name="trash-outline" size={16} color="#dc2626" />
                </TouchableOpacity>
              </View>
              <Text style={styles.addressLine}>{addr.line}</Text>
              <Text style={styles.addressMeta}>{addr.postOffice}, {addr.district}, {addr.state} - {addr.pincode}</Text>
              {addr.mobile ? <Text style={styles.addressMeta}>📞 {addr.mobile}</Text> : null}
            </View>
          ))
        )}
      </View>

      <AddAddressModal theme={theme} visible={isAddOpen} onClose={() => setIsAddOpen(false)} />
    </ScrollView>
  );
}

function AddAddressModal({
  theme,
  visible,
  onClose,
}: {
  theme: (typeof RoleThemes)['FARMER'];
  visible: boolean;
  onClose: () => void;
}) {
  const createAddress = useCreateAddress();
  const [tag, setTag] = useState<'HOME' | 'FARM' | 'WORK'>('HOME');
  const [line, setLine] = useState('');
  const [mobile, setMobile] = useState('');
  const [pincode, setPincode] = useState('');
  const [postOffice, setPostOffice] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [officeOptions, setOfficeOptions] = useState<PincodeOffice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const reset = () => {
    setTag('HOME');
    setLine('');
    setMobile('');
    setPincode('');
    setPostOffice('');
    setDistrict('');
    setState('');
    setOfficeOptions([]);
    setStatus(null);
  };

  const fetchAddress = async (code: string) => {
    setIsLoading(true);
    setStatus(null);
    try {
      const result = await lookupPincode(code);
      setOfficeOptions(result.offices);
      setPostOffice(result.postOffice);
      setDistrict(result.district);
      setState(result.state);
    } catch (err: any) {
      setStatus(`❌ ${err?.message ?? 'Could not fetch PIN details'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (pincode.length !== 6) {
      setStatus('❌ Enter a valid 6-digit PIN code.');
      return;
    }
    if (!line.trim()) {
      setStatus('❌ Enter the address line (house/street/farm plot).');
      return;
    }
    if (!postOffice || !district || !state) {
      setStatus('❌ Fetch the address from the PIN code first.');
      return;
    }
    tap();
    try {
      await createAddress.mutateAsync({ tag, line: line.trim(), mobile: mobile.trim() || undefined, postOffice, district, state, pincode });
      reset();
      onClose();
    } catch (err: any) {
      setStatus(`❌ ${err?.response?.data?.message ?? 'Could not save this address.'}`);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Address</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
            {(['HOME', 'FARM', 'WORK'] as const).map((t) => (
              <TouchableOpacity
                key={t}
                style={[styles.tagChip, tag === t && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setTag(t)}
              >
                <Text style={[styles.tagChipText, tag === t && { color: '#ffffff' }]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.inputLabel}>Address Line</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="House no, street / farm plot"
            placeholderTextColor="#94a3b8"
            value={line}
            onChangeText={setLine}
          />

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Mobile Number (Optional)</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="10-digit mobile number for this address"
            placeholderTextColor="#94a3b8"
            keyboardType="phone-pad"
            maxLength={10}
            value={mobile}
            onChangeText={setMobile}
          />

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>PIN Code</Text>
          <View style={styles.pincodeRow}>
            <View style={[styles.inputWrap, { flex: 1, backgroundColor: '#f8fafc' }]}>
              <TextInput
                style={styles.input}
                placeholder="6-digit PIN"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                maxLength={6}
                value={pincode}
                onChangeText={(t) => { setPincode(t); if (t.length === 6) fetchAddress(t); }}
              />
            </View>
            <TouchableOpacity
              style={[styles.fetchBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
              disabled={isLoading || pincode.length !== 6}
              onPress={() => fetchAddress(pincode)}
            >
              {isLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.fetchBtnText}>Fetch</Text>}
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Post Office / Locality</Text>
          {officeOptions.length > 1 ? (
            <View style={styles.officeChipRow}>
              {officeOptions.map((office) => (
                <TouchableOpacity
                  key={office.name}
                  style={[styles.officeChip, postOffice === office.name && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => {
                    tap();
                    setPostOffice(office.name);
                    setDistrict(office.district);
                    setState(office.state);
                  }}
                >
                  <Text style={[styles.officeChipText, postOffice === office.name && { color: '#ffffff' }]}>{office.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <TextInput style={styles.modalInput} value={postOffice} onChangeText={setPostOffice} placeholder="Auto-filled from PIN" placeholderTextColor="#94a3b8" />
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>District</Text>
              <TextInput style={styles.modalInput} value={district} onChangeText={setDistrict} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>State</Text>
              <View style={styles.readOnlySelector}>
                <Text style={styles.readOnlyText} numberOfLines={1}>{state || '—'}</Text>
                <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
              </View>
            </View>
          </View>

          {status ? <Text style={styles.errorText}>{status}</Text> : null}

          <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={createAddress.isPending}>
            {createAddress.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.modalSubmitText}>Save Address</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  headerBar: {
    paddingTop: Platform.OS === 'web' ? 18 : 44,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 17, fontFamily: FONT.extraBold },
  tabContainer: { flexDirection: 'row', backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderBottomWidth: 2.5, borderBottomColor: 'transparent' },
  activeTabBtn: { borderBottomColor: '#16a34a' },
  tabText: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b' },
  addAddressCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, paddingVertical: 12, borderWidth: 1.5 },
  addAddressCtaText: { fontSize: 14, fontFamily: FONT.bold },
  addressEmptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', marginTop: 20 },
  addressCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 6 },
  addressCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addressTagBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.xs },
  addressTagText: { fontSize: 10, fontFamily: FONT.bold, color: '#475569' },
  addressLine: { fontSize: 13.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  addressMeta: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  tagChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  tagChipText: { fontSize: 11, fontFamily: FONT.bold, color: '#64748b' },
  scrollContent: { padding: SPACING.md, paddingBottom: 32, alignItems: 'center' },
  card: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, ...premiumShadow('#0f172a', 'sm') },
  avatarSection: { alignItems: 'center', marginBottom: 14 },
  kingIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  kingIdText: { fontSize: 11.5, fontFamily: FONT.bold, letterSpacing: 0.3 },
  avatarRingBig: { width: 68, height: 68, borderRadius: 34, borderWidth: 2, borderColor: '#16a34a', padding: 2, position: 'relative', marginBottom: 6 },
  cameraBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#16a34a', position: 'absolute', bottom: 0, right: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#ffffff' },
  changePhotoText: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a' },
  browsePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    marginBottom: 6,
  },
  browsePhotoBtnText: { fontSize: 13, fontFamily: FONT.bold },
  officeChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  officeChip: { paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  officeChipText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#334155' },
  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14, paddingVertical: 4 },
  rowIconBg: { width: 32, height: 32, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  rowSubLabel: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  pincodeRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  fetchBtn: { height: 42, paddingHorizontal: 12, borderRadius: RADIUS.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  fetchBtnText: { color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold },
  pincodeStatusText: { fontSize: 11, fontFamily: FONT.bold, color: '#15803d', marginTop: 5 },
  inputLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#334155', marginTop: 10, marginBottom: 4 },
  inputWrap: { height: 42, flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, backgroundColor: '#ffffff', paddingHorizontal: 10 },
  input: { flex: 1, paddingVertical: 6, fontSize: 13.5, fontFamily: FONT.medium, color: '#0f172a' },
  readOnlySelector: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
  },
  readOnlyText: { flex: 1, fontSize: 13, fontFamily: FONT.bold, color: '#475569' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12.5, marginTop: 8 },
  saveBtn: { marginTop: 18, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 14.5, fontFamily: FONT.bold },
  savedNotice: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0fdf4', padding: 8, borderRadius: RADIUS.md, marginTop: 10 },
  savedNoticeText: { color: '#16a34a', fontSize: 12, fontFamily: FONT.bold },
  modalOverlay: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 20, zIndex: 999 },
  modalContent: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 10, paddingVertical: 8, fontSize: 13.5, color: '#0f172a', backgroundColor: '#f8fafc' },
  modalSubmitBtn: { marginTop: 16, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  modalSubmitText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14.5 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 10 },
  presetItemWrap: { alignItems: 'center', gap: 4, width: 62 },
  presetItem: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  presetLabel: { fontSize: 9.5, fontFamily: FONT.semiBold, color: '#64748b' },
});
