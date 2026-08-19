import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { PickerModal } from '@/src/components/PickerModal';
import { SOIL_TYPE_OPTIONS, SPRAY_TANK_SIZE_OPTIONS, WATER_TYPE_OPTIONS } from '@/src/constants/farmerProfileOptions';
import { useFarmerProfileStatus, useUpdateFarmerProfile } from '@/src/hooks/useFarmerProfile';
import { uploadPhoto } from '@/src/api/uploads.api';
import { resolveMediaUrl } from '@/src/api/client';
import { SoilType, SprayTankSizeL, WaterType } from '@/src/types/api';

const theme = RoleThemes.FARMER;

export default function FarmerProfileSetupScreen() {
  const router = useRouter();
  const { data: status } = useFarmerProfileStatus();
  const updateProfile = useUpdateFarmerProfile();

  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(status?.profile.photoUrl ?? null);
  const [sprayTankSizeL, setSprayTankSizeL] = useState<SprayTankSizeL | null>(status?.profile.sprayTankSizeL ?? null);
  const [soilType, setSoilType] = useState<SoilType | null>(status?.profile.soilType ?? null);
  const [waterType, setWaterType] = useState<WaterType | null>(status?.profile.waterType ?? null);

  const [isSoilPickerOpen, setIsSoilPickerOpen] = useState(false);
  const [isWaterPickerOpen, setIsWaterPickerOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const hasSeededFromStatus = useRef(false);
  useEffect(() => {
    if (status && !hasSeededFromStatus.current) {
      hasSeededFromStatus.current = true;
      setPhotoUrl(status.profile.photoUrl);
      setSprayTankSizeL(status.profile.sprayTankSizeL);
      setSoilType(status.profile.soilType);
      setWaterType(status.profile.waterType);
    }
  }, [status]);

  const selectedSoilLabel = SOIL_TYPE_OPTIONS.find((o) => o.value === soilType)?.label;
  const selectedWaterLabel = WATER_TYPE_OPTIONS.find((o) => o.value === waterType)?.label;

  const canSave = !!photoUrl && !!sprayTankSizeL && !!soilType && !!waterType;

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
    if (result.canceled || !result.assets[0]) {
      return;
    }

    const uri = result.assets[0].uri;
    setLocalPhotoUri(uri);
    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadPhoto(uri);
      setPhotoUrl(uploaded.fileUrl);
    } catch (error) {
      Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
      setLocalPhotoUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    try {
      await updateProfile.mutateAsync({
        photoUrl: photoUrl!,
        sprayTankSizeL: sprayTankSizeL!,
        soilType: soilType!,
        waterType: waterType!,
      });
      router.back();
    } catch (error) {
      Alert.alert('Could not save', 'Something went wrong while saving your profile. Please try again.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      {/* Top Header Row with Back Button */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
        <TouchableOpacity
          style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#cbd5e1' }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 13.5, fontFamily: FONT.bold, color: '#64748b' }}>
          Mandatory Farmer Profile
        </Text>
      </View>

      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Complete Your Mandatory Farmer Profile</Text>
        <Text style={styles.subheading}>
          Your advisor needs a few details to give you accurate spray and irrigation advice — you also can't add a
          crop or have one accepted by your advisor until this is complete.
        </Text>
      </View>

      {/* Photograph */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your Photograph (किसान की फोटो) *</Text>
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

      {/* Spray tank size */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Spray Tank Size (स्प्रे टैंक का साइज़) *</Text>
        <View style={styles.chipRow}>
          {SPRAY_TANK_SIZE_OPTIONS.map((size) => {
            const isSelected = size === sprayTankSizeL;
            return (
              <TouchableOpacity
                key={size}
                style={[styles.chip, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                onPress={() => setSprayTankSizeL(size)}
              >
                <Text style={[styles.chipText, isSelected && { color: '#ffffff' }]}>{size} Litre</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Soil type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Soil Type (मिट्टी का प्रकार) *</Text>
        <TouchableOpacity style={styles.selectField} onPress={() => setIsSoilPickerOpen(true)}>
          <Text style={[styles.selectFieldText, !selectedSoilLabel && styles.selectFieldPlaceholder]}>
            {selectedSoilLabel ?? 'Select soil type'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Water type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Water / Irrigation Source (पानी का स्रोत) *</Text>
        <TouchableOpacity style={styles.selectField} onPress={() => setIsWaterPickerOpen(true)}>
          <Text style={[styles.selectFieldText, !selectedWaterLabel && styles.selectFieldPlaceholder]}>
            {selectedWaterLabel ?? 'Select water source'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, premiumShadow(theme.primary, 'md'), !canSave && styles.saveButtonDisabled]}
        disabled={!canSave || updateProfile.isPending}
        onPress={handleSave}
      >
        {updateProfile.isPending ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.saveButtonText}>Save Profile</Text>
        )}
      </TouchableOpacity>

      <PickerModal
        visible={isSoilPickerOpen}
        title="Select Soil Type"
        options={SOIL_TYPE_OPTIONS}
        selectedValue={soilType}
        onSelect={(value) => setSoilType(value)}
        onClose={() => setIsSoilPickerOpen(false)}
      />
      <PickerModal
        visible={isWaterPickerOpen}
        title="Select Water Source"
        options={WATER_TYPE_OPTIONS}
        selectedValue={waterType}
        onSelect={(value) => setWaterType(value)}
        onClose={() => setIsWaterPickerOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  headerBlock: { gap: 6, marginBottom: SPACING.sm },
  heading: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a' },
  subheading: { fontSize: 13.5, fontFamily: FONT.medium, color: '#64748b', lineHeight: 19 },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  photoPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: SPACING.md,
  },
  photoPreview: { width: 56, height: 56, borderRadius: RADIUS.pill },
  photoPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: RADIUS.pill,
    backgroundColor: RoleThemes.FARMER.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerText: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photoPickerTitle: { fontSize: 14, fontFamily: FONT.bold, color: theme.primary },
  chipRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  chipText: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingVertical: 14,
    paddingHorizontal: SPACING.md,
  },
  selectFieldText: { fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' },
  selectFieldPlaceholder: { color: '#94a3b8' },
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
});
