import React, { useCallback, useMemo, useRef, useState } from 'react';
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
  Switch,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '@/src/store/auth-context';
import { useUpdateMyAddress } from '@/src/hooks/useAdvisorProfile';
import { useMyAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress } from '@/src/hooks/useAddresses';
import type { CustomerAddress } from '@/src/api/addresses.api';
import { lookupPincode, PincodeOffice } from '@/src/api/pincode.api';
import { uploadPhoto } from '@/src/api/uploads.api';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { Avatar } from '@/src/components/Avatar';
import { LabourFamilySwitcher } from '@/src/components/LabourFamilySwitcher';
import { useLabourDashboard } from '@/src/hooks/useLabour';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { user, updateUser, refreshUser } = useAuth();
  const updateAddress = useUpdateMyAddress();
  const theme = RoleThemes[user?.role === 'ADVISOR' ? 'FARM_ADVISOR' : 'FARMER'] ?? RoleThemes.FARMER;

  const [activeTab, setActiveTab] = useState<'PROFILE' | 'ADDRESSES'>(
    params.tab === 'ADDRESSES' ? 'ADDRESSES' : 'PROFILE'
  );

  React.useEffect(() => {
    if (params.tab === 'ADDRESSES') {
      setActiveTab('ADDRESSES');
    } else if (params.tab === 'PROFILE') {
      setActiveTab('PROFILE');
    }
  }, [params.tab]);

  // This screen is the single canonical profile for the account — one per mobile number, shared across
  // every role the account holds. Name/email/photo/address all write to the same User row on save.
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [farmName, setFarmName] = useState(user?.farmName || user?.name || '');
  const [farmAddress, setFarmAddress] = useState(
    user?.farmAddress || [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || ''
  );
  const [farmMobile, setFarmMobile] = useState(user?.farmMobile || user?.mobile || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);

  const [whatsappGroupEnabled, setWhatsappGroupEnabled] = useState<boolean>(user?.whatsappGroupEnabled ?? true);

  // Labour Family Profile Switcher state (when logged in as Labour role)
  const isLabour = user?.role === 'LABOUR';
  const { data: labourData, refetch: refetchLabour } = useLabourDashboard();
  const [selectedLabourWorkerId, setSelectedLabourWorkerId] = useState<string | null>(null);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string | null>(null);

  const labourWorkersList = useMemo(() => {
    if (!labourData?.profiles) return [];
    return labourData.profiles.map((p) => p.worker);
  }, [labourData]);

  const isInitializedRef = React.useRef(false);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  React.useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setFarmName(user.farmName || user.name || '');
      setFarmAddress(user.farmAddress || [user.village, user.district, user.state].filter(Boolean).join(', ') || '');
      setFarmMobile(user.farmMobile || user.mobile || '');
      setUpiId(user.upiId || '');
      if (user.whatsappGroupEnabled !== undefined) {
        setWhatsappGroupEnabled(user.whatsappGroupEnabled);
      }
      if (user.pincode) setPincode(user.pincode);
      if (user.postOffice) setPostOffice(user.postOffice);
      if (user.district) setDistrict(user.district);
      if (user.state) setState(user.state);
      if (user.photoUrl !== undefined) setPhotoUrl(user.photoUrl ?? null);
    }
  }, [user?.id, user?.upiId, user?.farmName, user?.farmAddress, user?.farmMobile, user?.name, user?.email, user?.whatsappGroupEnabled, user?.photoUrl]);

  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const [pincode, setPincode] = useState(user?.pincode ?? '');
  const [postOffice, setPostOffice] = useState(user?.postOffice ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [officeOptions, setOfficeOptions] = useState<PincodeOffice[]>([]);
  const [isPostOfficeExpanded, setIsPostOfficeExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

    const selectedUri = result.assets[0].uri;
    setPhotoUrl(selectedUri);
    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadPhoto(selectedUri);
      const newPhotoUrl = uploaded.fileUrl;
      setPhotoUrl(newPhotoUrl);

      // Auto-save photoUrl directly to database & update AuthContext
      const updated = await updateAddress.mutateAsync({ photoUrl: newPhotoUrl });
      await updateUser({
        ...(user || {}),
        ...(updated || {}),
        photoUrl: newPhotoUrl,
      } as any);
      await refreshUser();

      setIsPhotoModalOpen(false);
      if (Platform.OS !== 'web') {
        Alert.alert('Success ✨', 'Profile photo updated successfully!');
      }
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.message ?? err?.message ?? 'Could not upload your photo. Please try again.');
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
      setIsPostOfficeExpanded(true);
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
    const trimmedName = (name || user?.name || 'User').trim();
    if (!trimmedName) {
      setSaveError('❌ Please enter your full name.');
      return;
    }
    if (user?.role !== 'LABOUR') {
      if (!farmName.trim()) {
        setSaveError('❌ Please enter Farm Name under Use in Printing.');
        return;
      }
      if (!farmAddress.trim()) {
        setSaveError('❌ Please enter Farm Address under Use in Printing.');
        return;
      }
      if (!farmMobile.trim()) {
        setSaveError('❌ Please enter Farm Mobile under Use in Printing.');
        return;
      }
    }
    if (pincode && pincode.trim().length !== 6) {
      setPincodeStatus('❌ PIN Code must be exactly 6 digits.');
      return;
    }
    try {
      const finalFarmName = farmName.trim() || trimmedName;
      const finalFarmAddress = farmAddress.trim();
      const finalFarmMobile = farmMobile.trim();
      const finalUpiId = upiId.trim();

      const payload = {
        name: trimmedName,
        email: email.trim() || undefined,
        photoUrl: photoUrl ?? undefined,
        pincode: pincode.trim() || undefined,
        postOffice: postOffice.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        farmName: finalFarmName,
        farmAddress: finalFarmAddress,
        farmMobile: finalFarmMobile,
        upiId: finalUpiId,
        whatsappGroupEnabled,
      };

      const updated = await updateAddress.mutateAsync(payload);

      await updateUser({
        ...(user || {}),
        ...(updated || {}),
        ...payload,
        upiId: finalUpiId,
      } as any);

      await refreshUser();
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (err: any) {
      setSaveError(err?.response?.data?.message ?? 'Could not save your profile.');
    }
  };

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isWorker = user?.role === 'LABOUR' || user?.role === 'OPERATOR';

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={theme.gradient} style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {activeTab === 'ADDRESSES'
            ? 'My Registered Addresses'
            : isAdmin
            ? 'System Admin Profile'
            : isWorker
            ? 'Worker & Labour Profile'
            : 'Personal Profile'}
        </Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Top Tab Navigation: Personal Profile & Addresses */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'PROFILE' && styles.activeTabBtn]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setActiveTab('PROFILE');
          }}
        >
          <Ionicons name="person-outline" size={16} color={activeTab === 'PROFILE' ? theme.primary : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'PROFILE' && { color: theme.primary, fontFamily: FONT.bold }]}>
            Personal Profile
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ADDRESSES' && styles.activeTabBtn]}
          activeOpacity={0.8}
          onPress={() => {
            tap();
            setActiveTab('ADDRESSES');
          }}
        >
          <Ionicons name="location-outline" size={16} color={activeTab === 'ADDRESSES' ? theme.primary : '#64748b'} />
          <Text style={[styles.tabText, activeTab === 'ADDRESSES' && { color: theme.primary, fontFamily: FONT.bold }]}>
            Addresses
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ADDRESSES' ? (
        <AddressesTab theme={theme} />
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ─── ROLE TYPE 1: SYSTEM ADMIN PROFILE (NO PHOTO) ─── */}
          {isAdmin ? (
            <View style={{ width: '100%', maxWidth: 460, gap: 12 }}>
              <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="shield-checkmark" size={18} color="#2563eb" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#1e293b' }}>
                      🛡️ System Admin Profile
                    </Text>
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                      Official Admin Credentials & Contact Information
                    </Text>
                  </View>
                </View>

                {/* Badges Row */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>
                      🔑 King ID: {user?.kingId || '—'}
                    </Text>
                  </View>
                  {user?.mobile ? (
                    <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>
                        📞 Mobile: {user.mobile}
                      </Text>
                    </View>
                  ) : null}
                  <View style={{ backgroundColor: '#eff6ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bfdbfe' }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#1d4ed8' }}>
                      👑 Role: {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Admin'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.inputLabel}>Admin Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="System Administrator Name"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Official Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="admin@farmsking.tech"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {isSaved && (
                <View style={styles.savedNotice}>
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                  <Text style={styles.savedNoticeText}>Admin Profile Saved Successfully!</Text>
                </View>
              )}
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary, marginTop: 4 }]}
                onPress={saveProfile}
                disabled={updateAddress.isPending}
              >
                {updateAddress.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#ffffff" />
                    <Text style={styles.saveBtnText}>Save Admin Profile</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : isWorker ? (
            /* ─── ROLE TYPE 2: WORKER PROFILE ─── */
            <View style={{ width: '100%', maxWidth: 460, gap: 12 }}>
              {/* Photo Avatar */}
              <View style={styles.avatarSection}>
                <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.85} onPress={() => setIsPhotoModalOpen(true)}>
                  <Avatar uri={photoUrl ?? undefined} size={88} />
                  <View style={styles.photoEditBadge}>
                    <Ionicons name="camera" size={13} color="#ffffff" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.changePhotoBtn} onPress={() => setIsPhotoModalOpen(true)}>
                  <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Worker Personal Details Card */}
              <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                <Text style={styles.inputLabel}>Worker Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Full Name"
                  placeholderTextColor="#94a3b8"
                />

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                  <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>
                      🔑 King ID: {user?.kingId || '—'}
                    </Text>
                  </View>
                  {user?.mobile ? (
                    <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>
                        📞 Mobile: {user.mobile}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Labour Family Member & Farmer Switcher Section */}
              {labourWorkersList.length > 0 && (
                <View style={{ width: '100%' }}>
                  <LabourFamilySwitcher
                    workers={labourWorkersList}
                    selectedWorkerId={selectedLabourWorkerId}
                    onSelectWorker={(w) => setSelectedLabourWorkerId(w.id)}
                    selectedFarmerId={selectedFarmerId}
                    onSelectFarmer={(fId) => setSelectedFarmerId(fId)}
                    onRefresh={refetchLabour}
                    hideFarmerSwitcher={true}
                    showActiveCard={true}
                    showAddButton={true}
                  />
                </View>
              )}

              {isSaved && (
                <View style={styles.savedNotice}>
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                  <Text style={styles.savedNoticeText}>Workers Profiles Saved Successfully!</Text>
                </View>
              )}
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: '#16a34a', marginTop: 4 }]}
                onPress={async () => {
                  tap();
                  await refetchLabour();
                  await saveProfile();
                }}
                disabled={updateAddress.isPending}
              >
                {updateAddress.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-done-circle-outline" size={17} color="#ffffff" />
                    <Text style={styles.saveBtnText}>Save Workers Profiles</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* ─── ROLE TYPE 3: REGULAR USER PROFILE (FARMER, ADVISOR, CUSTOMER, GARDENER) ─── */
            <View style={{ width: '100%', maxWidth: 460, gap: 12 }}>
              {/* Photo Avatar */}
              <View style={styles.avatarSection}>
                <TouchableOpacity style={styles.avatarWrap} activeOpacity={0.85} onPress={() => setIsPhotoModalOpen(true)}>
                  <Avatar uri={photoUrl ?? undefined} size={88} />
                  <View style={styles.photoEditBadge}>
                    <Ionicons name="camera" size={13} color="#ffffff" />
                  </View>
                </TouchableOpacity>
                <TouchableOpacity style={styles.changePhotoBtn} onPress={() => setIsPhotoModalOpen(true)}>
                  <Text style={styles.changePhotoText}>Change Profile Photo</Text>
                </TouchableOpacity>
              </View>

              {/* Personal Details Card */}
              <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                <Text style={styles.sectionHeaderTitle}>👤 Personal Details</Text>

                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Your Full Name"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="yourname@domain.com"
                  placeholderTextColor="#94a3b8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
                  <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>
                      🔑 King ID: {user?.kingId || '—'}
                    </Text>
                  </View>
                  {user?.mobile ? (
                    <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>
                        📞 Mobile: {user.mobile}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Printing & Farm Details Card */}
              <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                <Text style={styles.sectionHeaderTitle}>🌾 Farm & Printing Details</Text>

                <Text style={styles.inputLabel}>Farm Name (Printed on Bills/Receipts) *</Text>
                <TextInput
                  style={styles.input}
                  value={farmName}
                  onChangeText={setFarmName}
                  placeholder="e.g. Makhu Organic Agri Farm"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Farm Address *</Text>
                <TextInput
                  style={styles.input}
                  value={farmAddress}
                  onChangeText={setFarmAddress}
                  placeholder="e.g. Village Makhu, Distt. Ferozepur"
                  placeholderTextColor="#94a3b8"
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>Farm Contact Mobile *</Text>
                <TextInput
                  style={styles.input}
                  value={farmMobile}
                  onChangeText={setFarmMobile}
                  placeholder="10-digit mobile"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                />

                <Text style={[styles.inputLabel, { marginTop: 10 }]}>UPI ID (For Payments/Receipts)</Text>
                <TextInput
                  style={styles.input}
                  value={upiId}
                  onChangeText={setUpiId}
                  placeholder="e.g. farmer@upi"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                />
              </View>

              {/* Location & Address Details Card */}
              <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
                <Text style={styles.sectionHeaderTitle}>📍 Location & Address</Text>

                <Text style={styles.inputLabel}>Postal PIN Code</Text>
                <View style={styles.pincodeRow}>
                  <View style={[styles.inputWrap, { flex: 1, backgroundColor: '#f8fafc' }]}>
                    <TextInput
                      style={styles.input}
                      placeholder="6-digit PIN"
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
                    disabled={isPincodeLoading || pincode.length !== 6}
                    onPress={() => fetchLocationFromPincode(pincode)}
                  >
                    {isPincodeLoading ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.fetchBtnText}>Fetch</Text>}
                  </TouchableOpacity>
                </View>

                {pincodeStatus ? (
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: pincodeStatus.includes('❌') ? '#dc2626' : '#16a34a', marginVertical: 4 }}>
                    {pincodeStatus}
                  </Text>
                ) : null}

                <Text style={[styles.inputLabel, { marginTop: 8 }]}>Post Office / Locality</Text>
                {officeOptions.length > 0 ? (
                  postOffice && !isPostOfficeExpanded ? (
                    <TouchableOpacity
                      style={[styles.selectedOfficeCard, { borderColor: theme.primary, backgroundColor: '#f0fdf4' }]}
                      activeOpacity={0.85}
                      onPress={() => { tap(); setIsPostOfficeExpanded(true); }}
                    >
                      <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                      <Text style={[styles.selectedOfficeText, { color: theme.primary }]} numberOfLines={1}>
                        {postOffice} ({district})
                      </Text>
                      <View style={[styles.changePill, { borderColor: theme.primary }]}>
                        <Text style={[styles.changePillText, { color: theme.primary }]}>Change</Text>
                        <Ionicons name="chevron-down" size={12} color={theme.primary} />
                      </View>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.expandedOfficeList}>
                      {officeOptions.map((off) => {
                        const isSel = off.name === postOffice;
                        return (
                          <TouchableOpacity
                            key={off.name}
                            style={[styles.officeOptionRow, isSel && { backgroundColor: '#f0fdf4', borderColor: theme.primary }]}
                            onPress={() => {
                              tap();
                              setPostOffice(off.name);
                              setIsPostOfficeExpanded(false);
                            }}
                          >
                            <Ionicons name={isSel ? 'radio-button-on' : 'radio-button-off'} size={15} color={isSel ? theme.primary : '#94a3b8'} />
                            <Text style={[styles.officeOptionText, isSel && { fontFamily: FONT.bold, color: theme.primary }]}>
                              {off.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )
                ) : (
                  <TextInput
                    style={styles.input}
                    value={postOffice}
                    onChangeText={setPostOffice}
                    placeholder="Post Office Name"
                    placeholderTextColor="#94a3b8"
                  />
                )}

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>District</Text>
                    <TextInput
                      style={styles.input}
                      value={district}
                      onChangeText={setDistrict}
                      placeholder="District"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>State</Text>
                    <TextInput
                      style={styles.input}
                      value={state}
                      onChangeText={setState}
                      placeholder="State"
                      placeholderTextColor="#94a3b8"
                    />
                  </View>
                </View>
              </View>

              {isSaved && (
                <View style={styles.savedNotice}>
                  <Ionicons name="checkmark-circle" size={15} color="#16a34a" />
                  <Text style={styles.savedNoticeText}>Profile Saved Successfully!</Text>
                </View>
              )}
              {saveError ? <Text style={styles.errorText}>{saveError}</Text> : null}

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: theme.primary, marginTop: 4 }]}
                onPress={saveProfile}
                disabled={updateAddress.isPending}
              >
                {updateAddress.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="checkmark-done-circle-outline" size={18} color="#ffffff" />
                    <Text style={styles.saveBtnText}>Save Profile</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* APK Download Card */}
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#f0f9ff',
              borderRadius: RADIUS.lg,
              borderWidth: 1.5,
              borderColor: '#bae6fd',
              padding: 12,
              marginTop: 12,
              marginBottom: 20,
              width: '100%',
              maxWidth: 460,
            }}
            onPress={() => {
              tap();
              const url = 'https://farmsking.tech/download/farmsking.apk';
              if (Platform.OS === 'web' && typeof window !== 'undefined') {
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', 'farmsking.apk');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                return;
              }
              Linking.openURL(url).catch(() => {});
            }}
            activeOpacity={0.85}
          >
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="logo-android" size={20} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#0369a1' }}>📲 Download FarmsKing App (APK) · ~18.5 MB</Text>
            </View>
            <View style={{ backgroundColor: '#0284c7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill }}>
              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' }}>Download</Text>
            </View>
          </TouchableOpacity>
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
                  <Text style={[styles.browsePhotoBtnText, { color: theme.primary }]}>Choose Photo from Device</Text>
                </>
              )}
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
  const [editingAddress, setEditingAddress] = useState<CustomerAddress | null>(null);

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
          onPress={() => { tap(); setEditingAddress(null); setIsAddOpen(true); }}
        >
          <Ionicons name="add-circle" size={20} color={theme.primary} />
          <Text style={[styles.addAddressCtaText, { color: theme.primary }]}>Add New Registered Address</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
        ) : addresses.length === 0 ? (
          <Text style={styles.addressEmptyText}>No registered addresses found. Add an address to proceed with orders.</Text>
        ) : (
          addresses.map((addr) => (
            <View key={addr.id} style={[styles.addressCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.addressCardHeader}>
                <View style={styles.addressTagBadge}>
                  <Text style={styles.addressTagText}>{addr.tag}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity onPress={() => { tap(); setEditingAddress(addr); setIsAddOpen(true); }}>
                    <Ionicons name="pencil" size={15} color={theme.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => removeAddress(addr.id)}>
                    <Ionicons name="trash-outline" size={16} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.addressLine}>{addr.line}</Text>
              <Text style={styles.addressMeta}>{addr.postOffice}, {addr.district}, {addr.state} - {addr.pincode}</Text>
              {addr.mobile ? <Text style={styles.addressMeta}>📞 {addr.mobile}</Text> : null}
            </View>
          ))
        )}
      </View>

      <AddAddressModal
        theme={theme}
        visible={isAddOpen}
        editingAddress={editingAddress}
        onClose={() => { setIsAddOpen(false); setEditingAddress(null); }}
      />
    </ScrollView>
  );
}

function AddAddressModal({
  theme,
  visible,
  editingAddress,
  onClose,
}: {
  theme: (typeof RoleThemes)['FARMER'];
  visible: boolean;
  editingAddress?: CustomerAddress | null;
  onClose: () => void;
}) {
  const { user } = useAuth();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const [tag, setTag] = useState<'HOME' | 'FARM' | 'WORK'>('HOME');
  const [fullName, setFullName] = useState(user?.name ?? '');
  const [line, setLine] = useState('');
  const [locality, setLocality] = useState('');
  const [mobile, setMobile] = useState(user?.mobile ?? '');
  const [pincode, setPincode] = useState('');
  const [postOffice, setPostOffice] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [officeOptions, setOfficeOptions] = useState<PincodeOffice[]>([]);
  const [isPostOfficeExpanded, setIsPostOfficeExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  React.useEffect(() => {
    if (editingAddress) {
      setTag(editingAddress.tag);
      setFullName(user?.name || '');
      setLine(editingAddress.line);
      setMobile(editingAddress.mobile || user?.mobile || '');
      setPincode(editingAddress.pincode);
      setPostOffice(editingAddress.postOffice);
      setDistrict(editingAddress.district);
      setState(editingAddress.state);
    } else {
      reset();
    }
  }, [editingAddress, visible]);

  const reset = () => {
    setTag('HOME');
    setFullName(user?.name ?? '');
    setLine('');
    setLocality('');
    setMobile(user?.mobile ?? '');
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
      setIsPostOfficeExpanded(true);
    } catch (err: any) {
      setStatus(`❌ ${err?.message ?? 'Could not fetch PIN details'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
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
      const addressText = locality.trim() ? `${line.trim()}, ${locality.trim()}` : line.trim();
      const fullAddressLine = fullName.trim() ? `${fullName.trim()} - ${addressText}` : addressText;

      if (editingAddress) {
        await updateAddress.mutateAsync({
          id: editingAddress.id,
          payload: { tag, line: fullAddressLine, mobile: mobile.trim() || undefined, postOffice, district, state, pincode },
        });
      } else {
        await createAddress.mutateAsync({ tag, line: fullAddressLine, mobile: mobile.trim() || undefined, postOffice, district, state, pincode });
      }
      reset();
      onClose();
    } catch (err: any) {
      setStatus(`❌ ${err?.response?.data?.message ?? 'Could not save this address.'}`);
    }
  };

  const isPending = createAddress.isPending || updateAddress.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingAddress ? 'Edit Registered Address' : 'Add Registered Address'}</Text>
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

          <Text style={styles.inputLabel}>Full Name / Contact Person</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Recipient full name *"
            placeholderTextColor="#94a3b8"
            value={fullName}
            onChangeText={setFullName}
          />

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Address Line *</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="House no, street / farm plot"
            placeholderTextColor="#94a3b8"
            value={line}
            onChangeText={setLine}
          />

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Locality / Area / Landmark (Optional)</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="e.g. Near Water Tank / Main Road / Colony Name"
            placeholderTextColor="#94a3b8"
            value={locality}
            onChangeText={setLocality}
          />

          <Text style={[styles.inputLabel, { marginTop: 10 }]}>Delivery Mobile Number</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="10-digit mobile number for delivery *"
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
          {officeOptions.length > 0 ? (
            postOffice && !isPostOfficeExpanded ? (
              <TouchableOpacity
                style={[styles.selectedOfficeCard, { borderColor: theme.primary, backgroundColor: theme.primaryLight ?? '#f0fdf4' }]}
                activeOpacity={0.85}
                onPress={() => {
                  tap();
                  setIsPostOfficeExpanded(true);
                }}
              >
                <Ionicons name="checkmark-circle" size={18} color={theme.primary} />
                <Text style={[styles.selectedOfficeText, { color: theme.primary }]} numberOfLines={1}>
                  {postOffice} ({district})
                </Text>
                <View style={[styles.changePill, { borderColor: theme.primary }]}>
                  <Text style={[styles.changePillText, { color: theme.primary }]}>Change</Text>
                  <Ionicons name="chevron-down" size={12} color={theme.primary} />
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.expandedOfficeList}>
                {officeOptions.map((office) => {
                  const isSelected = postOffice === office.name;
                  return (
                    <TouchableOpacity
                      key={office.name}
                      style={[
                        styles.expandedOfficeCard,
                        isSelected && { backgroundColor: theme.primaryLight ?? '#f0fdf4', borderColor: theme.primary },
                      ]}
                      onPress={() => {
                        tap();
                        setPostOffice(office.name);
                        setDistrict(office.district);
                        setState(office.state);
                        setIsPostOfficeExpanded(false);
                      }}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={16}
                        color={isSelected ? theme.primary : '#94a3b8'}
                      />
                      <Text style={[styles.expandedOfficeText, isSelected && { color: theme.primary, fontFamily: FONT.bold }]}>
                        {office.name} ({office.district})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )
          ) : (
            <TextInput style={styles.modalInput} value={postOffice} onChangeText={setPostOffice} placeholder="Auto-filled from PIN" placeholderTextColor="#94a3b8" />
          )}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputLabel}>District</Text>
              <View style={styles.readOnlySelector}>
                <Ionicons name="location-outline" size={16} color="#64748b" />
                <Text style={styles.readOnlyText} numberOfLines={1}>{district || '—'}</Text>
                <Ionicons name="lock-closed-outline" size={13} color="#94a3b8" />
              </View>
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

          <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleSave} disabled={isPending}>
            {isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.modalSubmitText}>{editingAddress ? 'Update Address' : 'Save Address'}</Text>}
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
  scrollContent: { padding: 10, paddingBottom: 20, alignItems: 'center' },
  card: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, ...premiumShadow('#0f172a', 'sm') },
  avatarSection: { alignItems: 'center', marginBottom: 8 },
  avatarWrap: { position: 'relative', marginBottom: 4 },
  photoEditBadge: { position: 'absolute', bottom: 2, right: 2, backgroundColor: '#16a34a', width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#ffffff' },
  changePhotoBtn: { marginTop: 4 },
  sectionHeaderTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 10 },
  officeOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  officeOptionText: { fontSize: 13, fontFamily: FONT.medium, color: '#334155' },
  singleMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 6,
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  metaNameText: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  metaKingIdText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  metaMobileText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#475569',
  },
  metaDot: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: FONT.bold,
    marginHorizontal: 1,
  },
  avatarRingBig: { width: 58, height: 58, borderRadius: 29, borderWidth: 2.5, borderColor: '#16a34a', alignItems: 'center', justifyContent: 'center', position: 'relative', marginBottom: 4 },
  cameraBadge: { width: 18, height: 18, borderRadius: 9, backgroundColor: '#16a34a', position: 'absolute', bottom: 0, right: 0, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#ffffff' },
  changePhotoText: { fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' },
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
  expandedOfficeList: {
    gap: 6,
    marginVertical: 4,
  },
  expandedOfficeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  expandedOfficeText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  selectedOfficeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    backgroundColor: '#f0fdf4',
  },
  selectedOfficeText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  changePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  changePillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
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
  printingHeaderBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 12,
    gap: 4,
  },
  printingTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  printingLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
    marginBottom: 4,
  },
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
  whatsappGroupToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 14,
  },
  whatsappGroupToggleTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  whatsappGroupToggleSubtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12.5, marginTop: 8 },
  saveBtn: { marginTop: 18, borderRadius: RADIUS.md, paddingVertical: 12, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontSize: 14.5, fontFamily: FONT.bold },
  familyHeadSummaryCard: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    paddingVertical: 7,
    paddingHorizontal: 10,
    marginTop: 4,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  familyHeadBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  familyHeadNameText: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  familyHeadTag: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  familyHeadTagText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  familyHeadMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  familyHeadMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  familyHeadMetaLabel: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  familyHeadMetaValue: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
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
