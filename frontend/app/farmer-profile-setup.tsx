import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { SPRAY_TANK_SIZE_OPTIONS } from '@/src/constants/farmerProfileOptions';
import { useFarmerProfileStatus, useUpdateFarmerProfile } from '@/src/hooks/useFarmerProfile';
import { useAuth } from '@/src/store/auth-context';
import { SprayTankSizeL } from '@/src/types/api';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function FarmerProfileSetupScreen() {
  const router = useRouter();
  const { user, updateUser, refreshUser } = useAuth();
  const { data: status } = useFarmerProfileStatus();
  const updateProfile = useUpdateFarmerProfile();

  const [sprayTankSizeL, setSprayTankSizeL] = useState<SprayTankSizeL | null>(status?.profile.sprayTankSizeL ?? null);
  const [name, setName] = useState<string>(user?.name || '');
  const [farmName, setFarmName] = useState<string>(user?.farmName || user?.name || '');
  const [farmAddress, setFarmAddress] = useState<string>(
    user?.farmAddress || [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || ''
  );
  const [farmMobile, setFarmMobile] = useState<string>(user?.farmMobile || user?.mobile || '');
  const [upiId, setUpiId] = useState<string>(user?.upiId || '');
  const [whatsappGroupEnabled, setWhatsappGroupEnabled] = useState<boolean>(user?.whatsappGroupEnabled ?? true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        setName(user.name || '');
        setFarmName(user.farmName || user.name || '');
        setFarmAddress(
          user.farmAddress || [user.village, user.district, user.state].filter(Boolean).join(', ') || ''
        );
        setFarmMobile(user.farmMobile || user.mobile || '');
        setUpiId(user.upiId || '');
        if (user.whatsappGroupEnabled !== undefined) setWhatsappGroupEnabled(user.whatsappGroupEnabled);
        if (user.sprayTankSizeL) setSprayTankSizeL(user.sprayTankSizeL);
      }
      if (status?.profile.sprayTankSizeL) {
        setSprayTankSizeL(status.profile.sprayTankSizeL);
      }
    }, [])
  );

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSave = async () => {
    tap();
    const selectedTankSize = sprayTankSizeL ?? 20;
    const finalFarmName = farmName.trim() || user?.name || '';
    const finalFarmAddress = farmAddress.trim();
    const finalFarmMobile = farmMobile.trim() || user?.mobile || '';
    const finalUpiId = upiId.trim();

    try {
      const trimmedName = name.trim() || user?.name || finalFarmName || 'Farmer';

      const payload = {
        name: trimmedName,
        sprayTankSizeL: selectedTankSize as SprayTankSizeL,
        farmName: finalFarmName || undefined,
        farmAddress: finalFarmAddress || undefined,
        farmMobile: finalFarmMobile || undefined,
        upiId: finalUpiId !== '' ? finalUpiId : undefined,
        whatsappGroupEnabled,
      };

      const updatedUser = await updateProfile.mutateAsync(payload);

      const mergedUser = {
        ...(user || {}),
        ...(updatedUser || {}),
        name: trimmedName,
        farmName: finalFarmName || user?.farmName || user?.name,
        farmAddress: finalFarmAddress || user?.farmAddress,
        farmMobile: finalFarmMobile || user?.farmMobile || user?.mobile,
        upiId: finalUpiId,
        sprayTankSizeL: selectedTankSize,
        whatsappGroupEnabled,
      };

      await updateUser(mergedUser as any);
      await refreshUser();
      setSaveSuccessMsg('✨ ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਜਾਣਕਾਰੀ ਸਫ਼ਲਤਾਪੂਰਵਕ ਸੇਵ ਹੋ ਗਈ ਹੈ!');
      setTimeout(() => {
        setSaveSuccessMsg(null);
        handleGoBack();
      }, 1200);
    } catch (error: any) {
      const msg = error?.response?.data?.message ?? 'Could not save farmer profile details. Please try again.';
      Alert.alert('Error Saving Profile', typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient colors={['#059669', '#10b981', '#15803d']} style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} activeOpacity={0.75} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={22} color="#ffffff" />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={styles.headerTitle}>🌾 Farmer Profile Setup</Text>
          <Text style={styles.headerSubtitle}>Farmer Profile & Printing Settings</Text>
        </View>
        <View style={{ width: 34 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>

          {/* King ID Badge Banner */}
          <View style={styles.kingIdBanner}>
            <Ionicons name="key" size={18} color="#15803d" style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.kingIdBannerText}>
                FarmsKing Account ID: <Text style={{ fontFamily: FONT.extraBold }}>{user?.kingId || '—'}</Text>
              </Text>
              <Text style={styles.userNameBannerText}>
                Farmer Name: <Text style={{ fontFamily: FONT.bold }}>{user?.name || name || '—'}</Text>
              </Text>
            </View>
          </View>

          {saveSuccessMsg ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={styles.successText}>{saveSuccessMsg}</Text>
            </View>
          ) : null}

          {/* SECTION 1: SPRAY TANK SIZE */}
          <View style={styles.tableCard}>
            {/* Field: Spray Tank Capacity */}
            <View style={[styles.tableRowField, { borderBottomWidth: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }]}>
              <Text style={[styles.fieldLabel, { marginTop: 0 }]}>Spray Tank Capacity *</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {SPRAY_TANK_SIZE_OPTIONS.map((size) => {
                  const isSelected = size === sprayTankSizeL;
                  return (
                    <TouchableOpacity
                      key={size}
                      activeOpacity={0.75}
                      style={[styles.radioInlineItem, isSelected && styles.radioInlineItemActive]}
                      onPress={() => {
                        tap();
                        setSprayTankSizeL(size);
                      }}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={16}
                        color={isSelected ? '#16a34a' : '#94a3b8'}
                      />
                      <Text style={[styles.radioLabel, isSelected && styles.radioLabelActive]}>
                        {size} Litre
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* SECTION 2: USE IN PRINTING DETAILS */}
          <View style={styles.printingHeaderBox}>
            <View style={styles.tableHeader}>
              <Ionicons name="print" size={18} color="#15803d" />
              <View style={{ flex: 1 }}>
                <Text style={styles.printingTitle}>🖨️ Use in Printing</Text>
                <Text style={styles.printingSub}>Enter farm details to be printed on bills, receipts, and vouchers.</Text>
              </View>
            </View>

            {/* Farm Name */}
            <View style={styles.tableRowField}>
              <Text style={styles.fieldLabel}>
                Farm Name * <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>(e.g. Surinder Agro Farm)</Text>
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: '#ffffff' }]}>
                <Ionicons name="business-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Surinder Agro Farm"
                  placeholderTextColor="#94a3b8"
                  value={farmName}
                  onChangeText={setFarmName}
                />
              </View>
            </View>

            {/* Farm Address */}
            <View style={styles.tableRowField}>
              <Text style={styles.fieldLabel}>Farm Address *</Text>
              <View style={[styles.inputWrap, { backgroundColor: '#ffffff' }]}>
                <Ionicons name="location-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Grain Market, Shop No. 12, Phul"
                  placeholderTextColor="#94a3b8"
                  value={farmAddress}
                  onChangeText={setFarmAddress}
                />
              </View>
            </View>

            {/* Farm Mobile */}
            <View style={styles.tableRowField}>
              <Text style={styles.fieldLabel}>Farm Mobile *</Text>
              <View style={[styles.inputWrap, { backgroundColor: '#ffffff' }]}>
                <Ionicons name="call-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9501529971"
                  placeholderTextColor="#94a3b8"
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={farmMobile}
                  onChangeText={setFarmMobile}
                />
              </View>
            </View>

            {/* UPI ID (Optional) */}
            <View style={[styles.tableRowField, { borderBottomWidth: 0 }]}>
              <Text style={styles.fieldLabel}>
                UPI ID (Optional) <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>(for generating payment QR Code on bill)</Text>
              </Text>
              <View style={[styles.inputWrap, { backgroundColor: '#ffffff' }]}>
                <Ionicons name="qr-code-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. name@paytm, 9876543210@ybl"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={upiId}
                  onChangeText={setUpiId}
                />
              </View>
            </View>
          </View>

          {/* SECTION 3: WHATSAPP GROUP MEMBERSHIP */}
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

          {/* SUBMIT BUTTON: Save Farmer Profile */}
          <TouchableOpacity
            style={[styles.saveButton, premiumShadow('#15803d', 'md')]}
            disabled={updateProfile.isPending}
            onPress={handleSave}
            activeOpacity={0.85}
          >
            {updateProfile.isPending ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-done-circle" size={20} color="#ffffff" />
                <Text style={styles.saveButtonText}>Save Farmer Profile</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  headerBar: {
    paddingTop: Platform.OS === 'web' ? 18 : 44,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
  },
  backBtn: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#ffffff', fontSize: 17, fontFamily: FONT.extraBold },
  headerSubtitle: { color: '#e2e8f0', fontSize: 11, fontFamily: FONT.medium },
  scrollContent: { padding: SPACING.md, paddingBottom: 40, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: 16,
    ...premiumShadow('#0f172a', 'md'),
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  kingIdBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  kingIdBannerText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#166534' },
  userNameBannerText: { fontSize: 12, fontFamily: FONT.medium, color: '#15803d', marginTop: 2 },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    borderRadius: RADIUS.md,
    padding: 10,
  },
  successText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#15803d' },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  tableRowField: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 6,
  },
  fieldLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 44,
  },
  textInput: { flex: 1, fontSize: 14, fontFamily: FONT.medium, color: '#0f172a' },
  radioInlineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    backgroundColor: '#f8fafc',
  },
  radioInlineItemActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  radioLabel: { fontSize: 12.5, fontFamily: FONT.medium, color: '#334155' },
  radioLabelActive: { fontSize: 12.5, fontFamily: FONT.bold, color: '#15803d' },
  printingHeaderBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  printingTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#15803d' },
  printingSub: { fontSize: 11, fontFamily: FONT.medium, color: '#166534', marginTop: 1 },
  whatsappGroupToggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  whatsappGroupToggleTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  whatsappGroupToggleSubtitle: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  saveButton: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveButtonDisabled: { opacity: 0.5, backgroundColor: '#94a3b8' },
  saveButtonText: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
});
