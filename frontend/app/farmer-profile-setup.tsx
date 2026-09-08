import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { PickerModal } from '@/src/components/PickerModal';
import { SOIL_TYPE_OPTIONS, SPRAY_TANK_SIZE_OPTIONS, WATER_TYPE_OPTIONS } from '@/src/constants/farmerProfileOptions';
import { useFarmerProfileStatus, useUpdateFarmerProfile } from '@/src/hooks/useFarmerProfile';
import { useUpdateMyAddress } from '@/src/hooks/useAdvisorProfile';
import { useAuth } from '@/src/store/auth-context';
import { uploadPhoto } from '@/src/api/uploads.api';
import { resolveMediaUrl } from '@/src/api/client';
import { SoilType, SprayTankSizeL, WaterType } from '@/src/types/api';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function FarmerProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: status } = useFarmerProfileStatus();
  const updateProfile = useUpdateFarmerProfile();
  const updateAddress = useUpdateMyAddress();

  const [sprayTankSizeL, setSprayTankSizeL] = useState<SprayTankSizeL | null>(status?.profile.sprayTankSizeL ?? null);
  const [soilType, setSoilType] = useState<SoilType | null>(status?.profile.soilType ?? null);
  const [waterType, setWaterType] = useState<WaterType | null>(status?.profile.waterType ?? null);
  const [billPrintingAddress, setBillPrintingAddress] = useState<string>(user?.billPrintingAddress ?? '');
  const [whatsappGroupEnabled, setWhatsappGroupEnabled] = useState<boolean>(user?.whatsappGroupEnabled ?? true);

  const [isSoilPickerOpen, setIsSoilPickerOpen] = useState(false);
  const [isWaterPickerOpen, setIsWaterPickerOpen] = useState(false);

  const hasSeededFromStatus = useRef(false);
  useEffect(() => {
    if (status && !hasSeededFromStatus.current) {
      hasSeededFromStatus.current = true;
      setSprayTankSizeL(status.profile.sprayTankSizeL);
      setSoilType(status.profile.soilType);
      setWaterType(status.profile.waterType);
      if (user?.billPrintingAddress) setBillPrintingAddress(user.billPrintingAddress);
      if (user?.whatsappGroupEnabled !== undefined) setWhatsappGroupEnabled(user.whatsappGroupEnabled);
    }
  }, [status, user]);

  const selectedSoilLabel = SOIL_TYPE_OPTIONS.find((o) => o.value === soilType)?.label;
  const selectedWaterLabel = WATER_TYPE_OPTIONS.find((o) => o.value === waterType)?.label;

  const canSave = !!sprayTankSizeL && !!soilType && !!waterType;

  const handleSave = async () => {
    if (!canSave) return;
    tap();
    try {
      await Promise.all([
        updateProfile.mutateAsync({
          sprayTankSizeL: sprayTankSizeL!,
          soilType: soilType!,
          waterType: waterType!,
          billPrintingAddress: billPrintingAddress.trim() || undefined,
        }),
        updateAddress.mutateAsync({
          billPrintingAddress: billPrintingAddress.trim() || undefined,
          whatsappGroupEnabled,
        }),
      ]);
      router.back();
    } catch (error) {
      Alert.alert('Could not save', 'Something went wrong while saving your details. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={theme.gradient} style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Special Profile</Text>
        <View style={{ width: 34 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>

      {/* Spray Tank Size */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Spray Tank Size *</Text>
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
        <Text style={styles.sectionLabel}>Soil Type *</Text>
        <TouchableOpacity style={styles.selectField} onPress={() => setIsSoilPickerOpen(true)}>
          <Text style={[styles.selectFieldText, !selectedSoilLabel && styles.selectFieldPlaceholder]}>
            {selectedSoilLabel ?? 'Select soil type'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Water type */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Water / Irrigation Source *</Text>
        <TouchableOpacity style={styles.selectField} onPress={() => setIsWaterPickerOpen(true)}>
          <Text style={[styles.selectFieldText, !selectedWaterLabel && styles.selectFieldPlaceholder]}>
            {selectedWaterLabel ?? 'Select water source'}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Bill Printing Address */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Bill Printing Address (Printed on Bill)</Text>
        <View style={styles.selectField}>
          <Ionicons name="document-text-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
          <TextInput
            style={{ flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' }}
            placeholder="e.g. Grain Market, Shop No. 12, Phul"
            placeholderTextColor="#94a3b8"
            value={billPrintingAddress}
            onChangeText={setBillPrintingAddress}
          />
        </View>
      </View>

      {/* WhatsApp Group Toggle */}
      <View style={styles.whatsappGroupToggleCard}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
            <Text style={styles.whatsappGroupToggleTitle}>WhatsApp Group Membership</Text>
          </View>
          <Text style={styles.whatsappGroupToggleSubtitle}>
            {whatsappGroupEnabled
              ? 'ON (Default): Auto-added to official WhatsApp group'
              : 'OFF: Immediately removed from official WhatsApp group'}
          </Text>
        </View>
        <Switch
          value={whatsappGroupEnabled}
          onValueChange={(val) => {
            tap();
            setWhatsappGroupEnabled(val);
          }}
          trackColor={{ false: '#cbd5e1', true: '#86efac' }}
          thumbColor={whatsappGroupEnabled ? '#16a34a' : '#f8fafc'}
        />
      </View>

          <TouchableOpacity
            style={[styles.saveButton, premiumShadow(theme.primary, 'md'), !canSave && styles.saveButtonDisabled]}
            disabled={!canSave || updateProfile.isPending}
            onPress={handleSave}
          >
            {updateProfile.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Details</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    </View>
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
  scrollContent: { padding: SPACING.md, paddingBottom: 32, alignItems: 'center' },
  card: { width: '100%', maxWidth: 460, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 16, ...premiumShadow('#0f172a', 'sm') },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
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
  whatsappGroupToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 12,
    marginTop: 4,
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
  saveButton: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.5 },
  saveButtonText: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
});
