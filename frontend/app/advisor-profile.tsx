import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { RoleThemes } from '@/constants/Colors';
import { INITIAL_CROPS_LIST } from '@/constants/cropCategoriesData';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useUpdateAdvisorProfile } from '@/src/hooks/useAdvisorProfile';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { uploadPhoto } from '@/src/api/uploads.api';
import { apiClient, resolveMediaUrl } from '@/src/api/client';
import * as SecureStore from '@/src/lib/storage';
import { lookupPincode } from '@/src/api/pincode.api';

const theme = RoleThemes.FARM_ADVISOR;

const CROP_CATEGORIES = [
  { key: 'FLOWERS', label: '🌸 Flowers & Floriculture' },
  { key: 'VEGETABLES', label: '🥦 Vegetables' },
  { key: 'FRUITS', label: '🍎 Fruits & Orchards' },
  { key: 'GRAINS', label: '🌾 Grains & Cereals' },
  { key: 'PULSES', label: '🌱 Pulses & Legumes' },
  { key: 'SPICES', label: '🌶️ Spices' },
  { key: 'CASH_CROP', label: '🎋 Cash Crops' },
  { key: 'OTHER', label: '🌿 Other Crops' },
];

const PAN_INDIA_CROPS = Array.from(new Set(INITIAL_CROPS_LIST.map((c) => c.name)));

export default function AdvisorProfileScreen() {
  const router = useRouter();
  const { user, updateUser, refreshUser } = useAuth();
  const { role } = useRole();
  const isGarden = role === 'GARDEN_ADVISOR';
  const updateProfile = useUpdateAdvisorProfile();
  const { data: appSettings } = useAppSettings();
  const certRef = React.useRef<View>(null);

  const platformFeePercent = appSettings?.advisorPlatformFeePercent ?? 10.0;
  const adminFeePercent = appSettings?.advisorAdminFeePercent ?? 10.0;
  const doctorPayoutPercent = Math.max(0, 100 - (platformFeePercent + adminFeePercent));

  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);

  React.useEffect(() => {
    if (user?.photoUrl !== undefined) {
      setPhotoUrl(user.photoUrl ?? null);
    }
  }, [user?.photoUrl]);

  // Persistent Accreditation / Test Clearance Date
  const [certifiedDate, setCertifiedDate] = useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const localCached = await SecureStore.getItemAsync(`doctorCertifiedAt_${user?.id || 'me'}`);
        if (localCached && isMounted) {
          setCertifiedDate(localCached);
        }
        const res = await apiClient.get('/advisor-assignment/doctor-settings', {
          params: user?.id ? { advisorId: user.id } : undefined,
        });
        if (res.data?.certifiedAt && isMounted) {
          setCertifiedDate(res.data.certifiedAt);
          await SecureStore.setItemAsync(`doctorCertifiedAt_${user?.id || 'me'}`, res.data.certifiedAt);
        }
      } catch {}
    })();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  const eligibilityDate = React.useMemo(() => {
    const raw = certifiedDate || (user as any)?.certifiedAt || (user as any)?.testPassedAt || (user as any)?.testPassedDate;
    if (!raw) return 'Verification Pending (Test Required)';
    const d = new Date(raw);
    return isNaN(d.getTime())
      ? 'Verification Pending (Test Required)'
      : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  }, [certifiedDate, user]);

  const specializationState = useState(user?.specialization ?? '');
  const specialization = specializationState[0];
  const setSpecialization = specializationState[1];
  const [bio, setBio] = useState(user?.bio ?? '');
  const [yearsExperience, setYearsExperience] = useState(user?.yearsExperience?.toString() ?? '');
  const [feePerConsultation, setFeePerConsultation] = useState((user as any)?.feePerConsultation?.toString() ?? '99');
  const [feePerCropSeason, setFeePerCropSeason] = useState((user as any)?.feePerCropSeason?.toString() ?? '499');
  const [feeVipMonthly, setFeeVipMonthly] = useState((user as any)?.feeVipMonthly?.toString() ?? '1999');
  const [monthlyIncludedCrops, setMonthlyIncludedCrops] = useState((user as any)?.monthlyIncludedCrops?.toString() ?? '3');
  const [feeAdditionalCropMonthly, setFeeAdditionalCropMonthly] = useState((user as any)?.feeAdditionalCropMonthly?.toString() ?? '300');
  const [specializedCategories, setSpecializedCategories] = useState<string[]>((user as any)?.specializedCategories ?? ['GRAINS', 'VEGETABLES']);
  const [specializedCrops, setSpecializedCrops] = useState<string[]>((user as any)?.specializedCrops ?? ['Wheat', 'Paddy & Basmati']);
  const [email, setEmail] = useState(user?.email ?? '');
  const [village, setVillage] = useState(user?.village ?? '');
  const [pincode, setPincode] = useState(user?.pincode ?? '');
  const [postOffice, setPostOffice] = useState(user?.postOffice ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);

  const fetchPincodeAddress = async (code: string) => {
    setPincodeError(null);
    setIsPincodeLoading(true);
    try {
      const result = await lookupPincode(code);
      setPostOffice(result.postOffice);
      setDistrict(result.district);
      setState(result.state);
    } catch (err: any) {
      setPincodeError(err?.message ?? 'Could not fetch address for this PIN code.');
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setLocalPhotoUri(uri);
    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadPhoto(uri);
      const newPhotoUrl = uploaded.fileUrl;
      setPhotoUrl(newPhotoUrl);
      const updated = await updateProfile.mutateAsync({ photoUrl: newPhotoUrl });
      await updateUser({
        ...(user || {}),
        ...(updated || {}),
        photoUrl: newPhotoUrl,
      } as any);
      await refreshUser();
      Alert.alert('Success ✨', 'Profile photo updated successfully!');
    } catch (err: any) {
      Alert.alert('Upload failed', err?.response?.data?.message ?? err?.message ?? 'Could not upload your photo. Please try again.');
      setLocalPhotoUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    try {
      await updateProfile.mutateAsync({
        photoUrl: photoUrl ?? undefined,
        specialization: specialization.trim() || undefined,
        bio: bio.trim() || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        email: email.trim() || undefined,
        village: village.trim() || undefined,
        pincode: pincode.trim() || undefined,
        postOffice: postOffice.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        notificationsEnabled,
        feePerConsultation: feePerConsultation ? Number(feePerConsultation) : undefined,
        feePerCropSeason: feePerCropSeason ? Number(feePerCropSeason) : undefined,
        feeVipMonthly: feeVipMonthly ? Number(feeVipMonthly) : undefined,
        monthlyIncludedCrops: monthlyIncludedCrops ? Number(monthlyIncludedCrops) : 3,
        feeAdditionalCropMonthly: feeAdditionalCropMonthly ? Number(feeAdditionalCropMonthly) : 300,
        specializedCategories: specializedCategories as any,
        specializedCrops,
      });
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save your profile.');
    }
  };

  const handleDownloadCertificate = async () => {
    try {
      if (!certRef.current) return;
      const uri = await captureRef(certRef.current, {
        format: 'jpg',
        quality: 1,
      });
      await Sharing.shareAsync(uri, {
        dialogTitle: 'My Advisor Certificate',
        mimeType: 'image/jpeg',
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to generate certificate.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isGarden ? 'Garden Advisor Profile' : 'Crop Doctor Profile'}</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your Certificate</Text>
        <View 
          ref={certRef}
          style={styles.certificateBox}
          collapsable={false}
        >
          <View style={styles.certInner}>
            <Ionicons name="ribbon" size={40} color="#15803d" style={{ alignSelf: 'center', marginBottom: 8 }} />
            <Text style={styles.certTitle}>CERTIFICATE OF EXCELLENCE</Text>
            <Text style={styles.certSub}>This certifies that</Text>
            <Text style={styles.certName}>{user?.name || (isGarden ? 'Garden Advisor' : 'Crop Doctor')}</Text>
            <Text style={styles.certBody}>
              {isGarden
                ? 'has successfully passed the Horticulture Expert Assessment and is officially recognized as a Certified Garden Advisor on FarmsKing.'
                : 'has successfully passed the Agronomy & Plant Pathology Expert Assessment and is officially recognized as a Certified Crop Doctor on FarmsKing.'}
            </Text>
            <View style={styles.certFooter}>
              <View>
                <Text style={styles.certFooterVal}>{eligibilityDate}</Text>
                <Text style={styles.certFooterLabel}>Accreditation Date</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.certFooterVal}>FarmsKing Team</Text>
                <Text style={styles.certFooterLabel}>Authorized</Text>
              </View>
            </View>
          </View>
        </View>
        
        <TouchableOpacity style={styles.downloadCertBtn} onPress={handleDownloadCertificate}>
          <Ionicons name="download-outline" size={16} color="#ffffff" />
          <Text style={styles.downloadCertBtnText}>Download as JPG</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your Photograph</Text>
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.85}>
          {localPhotoUri || photoUrl ? (
            <Image source={{ uri: localPhotoUri ?? resolveMediaUrl(photoUrl) }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={26} color={theme.primary} />
            </View>
          )}
          <View style={styles.photoPickerText}>
            <Text style={styles.photoPickerTitle}>{photoUrl ? 'Change photo' : 'Add a photo'}</Text>
            {isUploadingPhoto && <ActivityIndicator size="small" color={theme.primary} />}
          </View>
        </TouchableOpacity>
      </View>

      {user?.kingId ? (
        <View style={[styles.section, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
          <Ionicons name="key-outline" size={13} color={theme.primary} />
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>King ID: {user.kingId}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Specialization</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rose & Floriculture, Wheat & Cereals"
          placeholderTextColor="#94a3b8"
          value={specialization}
          onChangeText={setSpecialization}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 8"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={yearsExperience}
          onChangeText={setYearsExperience}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About / Bio</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder="Tell farmers about your background and expertise..."
          placeholderTextColor="#94a3b8"
          value={bio}
          onChangeText={setBio}
          multiline
        />
      </View>

      {/* Agronomic Categories Matching */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.sectionLabel}>Agronomic Categories Specialization</Text>
          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: theme.primary }}>
            {specializedCategories.length} Selected
          </Text>
        </View>
        <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b' }}>
          Choose categories where you offer consultations. Farmers can only adopt you for crops in these categories:
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {CROP_CATEGORIES.map((cat) => {
            const isSelected = specializedCategories.includes(cat.key);
            return (
              <TouchableOpacity
                key={cat.key}
                style={[
                  styles.cropChip,
                  isSelected && styles.cropChipSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (isSelected) {
                    setSpecializedCategories((prev) => prev.filter((c) => c !== cat.key));
                  } else {
                    setSpecializedCategories((prev) => [...prev, cat.key]);
                  }
                }}
              >
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                  size={14}
                  color={isSelected ? '#ffffff' : '#64748b'}
                />
                <Text style={[styles.cropChipText, isSelected && styles.cropChipTextSelected]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Pan-India Crop Specializations */}
      <View style={styles.section}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={styles.sectionLabel}>Pan-India Crop Specializations</Text>
          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: theme.primary }}>
            {specializedCrops.length} Selected
          </Text>
        </View>
        <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b' }}>
          Select crops where you provide expert spray schedules and disease diagnosis:
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {PAN_INDIA_CROPS.map((crop) => {
            const isSelected = specializedCrops.includes(crop);
            return (
              <TouchableOpacity
                key={crop}
                style={[
                  styles.cropChip,
                  isSelected && styles.cropChipSelected,
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (isSelected) {
                    setSpecializedCrops((prev) => prev.filter((c) => c !== crop));
                  } else {
                    setSpecializedCrops((prev) => [...prev, crop]);
                  }
                }}
              >
                <Ionicons
                  name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                  size={14}
                  color={isSelected ? '#ffffff' : '#64748b'}
                />
                <Text style={[styles.cropChipText, isSelected && styles.cropChipTextSelected]}>
                  {crop}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3-Tier Advisory Packages & Transparent Fee Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Advisory Consultation Packages & Pricing</Text>
        <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b' }}>
          Set your professional advisory rates. You receive guaranteed {doctorPayoutPercent.toFixed(0)}% net payout directly into your wallet:
        </Text>

        <View style={styles.priceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.priceCardTitle}>1. Pay Per Prescription (Instant SOS)</Text>
              <Text style={styles.priceCardSub}>Single leaf scan diagnosis & phone consultation</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' }}>₹</Text>
              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                value={feePerConsultation}
                onChangeText={setFeePerConsultation}
                placeholder="99"
              />
            </View>
          </View>
          <View style={styles.payoutSplitRow}>
            <Text style={styles.payoutSplitDoctor}>
              Doctor Net ({doctorPayoutPercent.toFixed(0)}%): ₹{Math.round(Number(feePerConsultation || 0) * (doctorPayoutPercent / 100))}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.payoutSplitPlatform}>
                Platform ({platformFeePercent.toFixed(0)}%): ₹{Math.round(Number(feePerConsultation || 0) * (platformFeePercent / 100))}
              </Text>
              <Text style={[styles.payoutSplitPlatform, { color: '#8b5cf6' }]}>
                Admin ({adminFeePercent.toFixed(0)}%): ₹{Math.round(Number(feePerConsultation || 0) * (adminFeePercent / 100))}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.priceCardTitle}>2. Per Crop Season Supervision</Text>
              <Text style={styles.priceCardSub}>120-day complete spray schedule from sowing to harvest</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' }}>₹</Text>
              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                value={feePerCropSeason}
                onChangeText={setFeePerCropSeason}
                placeholder="499"
              />
            </View>
          </View>
          <View style={styles.payoutSplitRow}>
            <Text style={styles.payoutSplitDoctor}>
              Doctor Net ({doctorPayoutPercent.toFixed(0)}%): ₹{Math.round(Number(feePerCropSeason || 0) * (doctorPayoutPercent / 100))}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.payoutSplitPlatform}>
                Platform ({platformFeePercent.toFixed(0)}%): ₹{Math.round(Number(feePerCropSeason || 0) * (platformFeePercent / 100))}
              </Text>
              <Text style={[styles.payoutSplitPlatform, { color: '#8b5cf6' }]}>
                Admin ({adminFeePercent.toFixed(0)}%): ₹{Math.round(Number(feePerCropSeason || 0) * (adminFeePercent / 100))}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.priceCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.priceCardTitle}>3. VIP Farm Care (Monthly Retainer)</Text>
              <Text style={styles.priceCardSub}>Large farms & orchards: periodic field audits & direct calls</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' }}>₹</Text>
              <TextInput
                style={styles.priceInput}
                keyboardType="numeric"
                value={feeVipMonthly}
                onChangeText={setFeeVipMonthly}
                placeholder="1999"
              />
            </View>
          </View>
          <View style={styles.payoutSplitRow}>
            <Text style={styles.payoutSplitDoctor}>
              Doctor Net ({doctorPayoutPercent.toFixed(0)}%): ₹{Math.round(Number(feeVipMonthly || 0) * (doctorPayoutPercent / 100))}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
              <Text style={styles.payoutSplitPlatform}>
                Platform ({platformFeePercent.toFixed(0)}%): ₹{Math.round(Number(feeVipMonthly || 0) * (platformFeePercent / 100))}
              </Text>
              <Text style={[styles.payoutSplitPlatform, { color: '#8b5cf6' }]}>
                Admin ({adminFeePercent.toFixed(0)}%): ₹{Math.round(Number(feeVipMonthly || 0) * (adminFeePercent / 100))}
              </Text>
            </View>
          </View>

          {/* Monthly Plan Quota Settings */}
          <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#e2e8f0', flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Included Crops Quota</Text>
              <TextInput
                style={[styles.input, { paddingVertical: 8, fontSize: 13 }]}
                keyboardType="numeric"
                value={monthlyIncludedCrops}
                onChangeText={setMonthlyIncludedCrops}
                placeholder="3"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', marginBottom: 4 }}>Extra Crop Fee (₹/mo)</Text>
              <TextInput
                style={[styles.input, { paddingVertical: 8, fontSize: 13 }]}
                keyboardType="numeric"
                value={feeAdditionalCropMonthly}
                onChangeText={setFeeAdditionalCropMonthly}
                placeholder="300"
              />
            </View>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Contact Details</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} />
        <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Village" placeholderTextColor="#94a3b8" value={village} onChangeText={setVillage} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PIN Code</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="6-digit PIN"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={6}
            value={pincode}
            onChangeText={(t) => {
              setPincode(t);
              if (t.length === 6) fetchPincodeAddress(t);
            }}
          />
          <TouchableOpacity
            style={[styles.fetchButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
            disabled={isPincodeLoading || pincode.length !== 6}
            onPress={() => fetchPincodeAddress(pincode)}
          >
            {isPincodeLoading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.fetchButtonText}>Fetch</Text>}
          </TouchableOpacity>
        </View>
        {pincodeError ? <Text style={styles.errorText}>{pincodeError}</Text> : null}

        {postOffice ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Post Office</Text>
            <TextInput style={styles.input} value={postOffice} onChangeText={setPostOffice} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View style={[styles.readOnlyBox, { flex: 1 }]}>
                <Text style={styles.readOnlyLabel}>District</Text>
                <Text style={styles.readOnlyValue}>{district}</Text>
              </View>
              <View style={[styles.readOnlyBox, { flex: 1 }]}>
                <Text style={styles.readOnlyLabel}>State</Text>
                <Text style={styles.readOnlyValue}>{state}</Text>
              </View>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.notificationRow}>
          <View style={styles.notificationIconBg}>
            <Ionicons name="notifications-outline" size={16} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationLabel}>Push Notifications</Text>
            <Text style={styles.notificationSubLabel}>Assignments, messages & updates</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#cbd5e1', true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {saved ? <Text style={styles.savedText}>Profile saved ✓</Text> : null}

      <TouchableOpacity
        style={[styles.saveButton, premiumShadow(theme.primary, 'md')]}
        disabled={updateProfile.isPending}
        onPress={handleSave}
      >
        {updateProfile.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  
  certificateBox: { backgroundColor: '#f0fdf4', padding: 4, borderRadius: RADIUS.lg, borderWidth: 2, borderColor: '#15803d', overflow: 'hidden' },
  certInner: { backgroundColor: '#ffffff', padding: 20, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bbf7d0', alignItems: 'center' },
  certTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#15803d', textAlign: 'center', marginBottom: 4, letterSpacing: 1 },
  certSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', marginBottom: 12 },
  certName: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a', textAlign: 'center', marginBottom: 16 },
  certBody: { fontSize: 12, fontFamily: FONT.medium, color: '#475569', textAlign: 'center', lineHeight: 18, marginBottom: 24, paddingHorizontal: 10 },
  certFooter: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 12 },
  certFooterLabel: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8' },
  certFooterVal: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
  downloadCertBtn: { backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.md },
  downloadCertBtnText: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' },

  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notificationIconBg: { width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  notificationLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  notificationSubLabel: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  photoPicker: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#e2e8f0', padding: SPACING.md },
  photoPreview: { width: 56, height: 56, borderRadius: RADIUS.pill },
  photoPlaceholder: { width: 56, height: 56, borderRadius: RADIUS.pill, backgroundColor: RoleThemes.FARM_ADVISOR.primaryLight, alignItems: 'center', justifyContent: 'center' },
  photoPickerText: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photoPickerTitle: { fontSize: 14, fontFamily: FONT.bold, color: theme.primary },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, fontFamily: FONT.medium, backgroundColor: '#ffffff', color: '#0f172a' },
  fetchButton: { paddingHorizontal: 18, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  fetchButtonText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  readOnlyBox: { backgroundColor: '#f1f5f9', borderRadius: RADIUS.lg, padding: 10 },
  readOnlyLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#94a3b8' },
  readOnlyValue: { fontSize: 13, fontFamily: FONT.semiBold, color: '#334155', marginTop: 2 },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 13 },
  savedText: { color: '#16a34a', fontFamily: FONT.bold, fontSize: 13 },
  saveButton: { backgroundColor: theme.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },

  cropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1.2,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
  },
  cropChipSelected: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  cropChipText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#334155',
  },
  cropChipTextSelected: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },

  priceCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  priceCardTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  priceCardSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  priceInput: {
    width: 80,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    textAlign: 'right',
  },
  payoutSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  payoutSplitDoctor: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  payoutSplitPlatform: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
});
