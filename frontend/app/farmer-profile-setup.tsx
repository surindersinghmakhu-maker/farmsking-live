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
  const { user, updateUser, refreshUser } = useAuth();
  const { data: status } = useFarmerProfileStatus();
  const updateProfile = useUpdateFarmerProfile();
  const updateAddress = useUpdateMyAddress();

  const [sprayTankSizeL, setSprayTankSizeL] = useState<SprayTankSizeL | null>(status?.profile.sprayTankSizeL ?? null);
  const [name, setName] = useState<string>(user?.name || '');
  const [farmName, setFarmName] = useState<string>(user?.farmName || user?.name || '');
  const [farmAddress, setFarmAddress] = useState<string>(
    user?.farmAddress || user?.billPrintingAddress || [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || ''
  );
  const [farmMobile, setFarmMobile] = useState<string>(user?.farmMobile || user?.mobile || '');
  const [upiId, setUpiId] = useState<string>(user?.upiId || '');
  const [whatsappGroupEnabled, setWhatsappGroupEnabled] = useState<boolean>(user?.whatsappGroupEnabled ?? true);

  const hasSeededFromUser = useRef(false);
  useEffect(() => {
    if (user && !hasSeededFromUser.current) {
      hasSeededFromUser.current = true;
      if (user.name) setName(user.name);
      setFarmName(user.farmName || user.name || '');
      setFarmAddress(
        user.farmAddress || user.billPrintingAddress || [user.village, user.district, user.state].filter(Boolean).join(', ') || ''
      );
      setFarmMobile(user.farmMobile || user.mobile || '');
      if (user.upiId) setUpiId(user.upiId);
      if (user.whatsappGroupEnabled !== undefined) setWhatsappGroupEnabled(user.whatsappGroupEnabled);
    }
    if (status?.profile.sprayTankSizeL) {
      setSprayTankSizeL(status.profile.sprayTankSizeL);
    }
  }, [status, user]);

  const canSave = !!sprayTankSizeL && !!farmName.trim() && !!farmAddress.trim() && !!farmMobile.trim();

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSave = async () => {
    if (!canSave) return;
    tap();
    try {
      const trimmedName = name.trim() || user?.name || '';
      const finalFarmName = farmName.trim() || trimmedName;
      const finalFarmAddress = farmAddress.trim();
      const finalFarmMobile = farmMobile.trim() || user?.mobile || '';

      const updatedUser = await updateProfile.mutateAsync({
        name: trimmedName,
        sprayTankSizeL: sprayTankSizeL!,
        farmName: finalFarmName,
        farmAddress: finalFarmAddress,
        farmMobile: finalFarmMobile,
        upiId: upiId.trim() || undefined,
        billPrintingAddress: finalFarmAddress,
        whatsappGroupEnabled,
      });

      if (updatedUser) {
        await updateUser(updatedUser as any);
      } else {
        await updateUser({
          name: trimmedName,
          farmName: finalFarmName,
          farmAddress: finalFarmAddress,
          farmMobile: finalFarmMobile,
          upiId: upiId.trim() || undefined,
          billPrintingAddress: finalFarmAddress,
          whatsappGroupEnabled,
        });
      }
      await refreshUser();
      handleGoBack();
    } catch (error) {
      Alert.alert('Could not save', 'Something went wrong while saving your details. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={theme.gradient} style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Farmer Special Profile</Text>
        <View style={{ width: 34 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>

          {/* Full Name */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Full Name / Account Name *</Text>
            <View style={styles.selectField}>
              <Ionicons name="person-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={{ flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' }}
                placeholder="Enter full name"
                placeholderTextColor="#94a3b8"
                value={name}
                onChangeText={(t) => {
                  setName(t);
                  if (!farmName || farmName === user?.name) {
                    setFarmName(t);
                  }
                }}
              />
            </View>
          </View>

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

          {/* Use in Printing Section */}
          <View style={styles.printingHeaderBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Ionicons name="print" size={18} color={theme.primary} />
              <Text style={styles.printingTitle}>Use in Printing</Text>
            </View>

            {/* Farm Name */}
            <View style={[styles.section, { marginTop: 10 }]}>
              <Text style={styles.sectionLabel}>Farm Name *</Text>
              <View style={styles.selectField}>
                <Ionicons name="business-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' }}
                  placeholder="e.g. Surinder Agro Farm"
                  placeholderTextColor="#94a3b8"
                  value={farmName}
                  onChangeText={setFarmName}
                />
              </View>
            </View>

            {/* Farm Address */}
            <View style={[styles.section, { marginTop: 10 }]}>
              <Text style={styles.sectionLabel}>Farm Address *</Text>
              <View style={styles.selectField}>
                <Ionicons name="location-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' }}
                  placeholder="e.g. Grain Market, Shop No. 12, Phul"
                  placeholderTextColor="#94a3b8"
                  value={farmAddress}
                  onChangeText={setFarmAddress}
                />
              </View>
            </View>

            {/* Farm Mobile */}
            <View style={[styles.section, { marginTop: 10 }]}>
              <Text style={styles.sectionLabel}>Farm Mobile *</Text>
              <View style={styles.selectField}>
                <Ionicons name="call-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' }}
                  placeholder="e.g. 98720XXXXX"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={farmMobile}
                  onChangeText={setFarmMobile}
                />
              </View>
            </View>

            {/* UPI ID (Optional) */}
            <View style={[styles.section, { marginTop: 10 }]}>
              <Text style={styles.sectionLabel}>UPI ID (Optional)</Text>
              <View style={styles.selectField}>
                <Ionicons name="qr-code-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={{ flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' }}
                  placeholder="e.g. name@paytm, 9876543210@ybl"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </View>
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
  printingHeaderBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 14,
    gap: 4,
  },
  printingTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  printingSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#166534',
    marginBottom: 4,
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
