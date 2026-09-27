import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
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
import { verifyAccountPassword } from '@/src/api/auth.api';

import { UpiQrScannerModal } from '@/src/components/UpiQrScannerModal';

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
  const [upiPayeeName, setUpiPayeeName] = useState<string | null>(null);
  const [showQrScanner, setShowQrScanner] = useState<boolean>(false);
  const [whatsappGroupEnabled, setWhatsappGroupEnabled] = useState<boolean>(user?.whatsappGroupEnabled ?? true);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Password verification state for UPI ID save
  const [showPasswordModal, setShowPasswordModal] = useState<boolean>(false);
  const [verifyPassword, setVerifyPassword] = useState<string>('');
  const [isVerifyingPassword, setIsVerifyingPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const isInitializedRef = React.useRef(false);

  useFocusEffect(
    useCallback(() => {
      refreshUser();
    }, [])
  );

  React.useEffect(() => {
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
    if (status?.profile.sprayTankSizeL && !sprayTankSizeL) {
      setSprayTankSizeL(status.profile.sprayTankSizeL);
    }
  }, [user?.id, user?.upiId, user?.farmName, user?.farmAddress, user?.farmMobile, user?.name, user?.whatsappGroupEnabled, status]);

  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const executeSaveProfile = async () => {
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
        farmName: finalFarmName,
        farmAddress: finalFarmAddress,
        farmMobile: finalFarmMobile,
        upiId: finalUpiId,
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

  const handleSave = () => {
    tap();
    const finalUpiId = upiId.trim();

    // 🔒 If UPI ID is filled, require account password verification first
    if (finalUpiId && user?.mobile) {
      setVerifyPassword('');
      setPasswordError(null);
      setShowPasswordModal(true);
      return;
    }

    // Direct save if UPI ID is empty
    executeSaveProfile();
  };

  const handleConfirmPasswordAndSave = async () => {
    if (!verifyPassword.trim()) {
      setPasswordError('Kripya apna account password darj karo.');
      return;
    }

    setIsVerifyingPassword(true);
    setPasswordError(null);

    let isPasswordCorrect = false;

    try {
      // 1. Verify password (returns 200 OK with success: true / false)
      const res = await verifyAccountPassword(verifyPassword.trim());

      if (!res?.success) {
        setIsVerifyingPassword(false);
        setVerifyPassword(''); // 🔄 Clear input so user can re-enter immediately
        setPasswordError(res?.message || '❌ ਪਾਸਵਰਡ ਗਲਤ ਹੈ! ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਸਹੀ ਪਾਸਵਰਡ ਭਰੋ (Re-enter Password).');
        return;
      }

      isPasswordCorrect = true;
    } catch (err: any) {
      setIsVerifyingPassword(false);
      setVerifyPassword('');
      setPasswordError('❌ ਪਾਸਵਰਡ ਚੈੱਕ ਕਰਨ ਵਿੱਚ ਦਿੱਕਤ ਆਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਪਾਸਵਰਡ ਭਰੋ।');
      return;
    }

    if (isPasswordCorrect) {
      setIsVerifyingPassword(false);
      setShowPasswordModal(false);

      // 2. Password verified -> Proceed to save profile
      await executeSaveProfile();
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
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                <Text style={[styles.fieldLabel, { flex: 1 }]}>
                  UPI ID (Optional) <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>(for generating payment QR Code on bill)</Text>
                </Text>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.scanQrBtn}
                  onPress={() => {
                    tap();
                    setShowQrScanner(true);
                  }}
                >
                  <Ionicons name="camera-outline" size={14} color="#059669" />
                  <Text style={styles.scanQrBtnText}>📷 Scan QR</Text>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputWrap, { backgroundColor: '#ffffff' }]}>
                <Ionicons name="qr-code-outline" size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. name@paytm, 9876543210@ybl"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  value={upiId}
                  onChangeText={(val) => {
                    setUpiId(val);
                    setUpiPayeeName(null);
                  }}
                />
              </View>

              {/* Verified Payee Name Label underneath text box */}
              {upiPayeeName ? (
                <View style={styles.payeeNameBadge}>
                  <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                  <Text style={styles.payeeNameText}>
                    Verified Payee: <Text style={{ fontFamily: FONT.extraBold, color: '#15803d' }}>{upiPayeeName}</Text>
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <UpiQrScannerModal
            visible={showQrScanner}
            onClose={() => setShowQrScanner(false)}
            onScanSuccess={(res) => {
              setUpiId(res.upiId);
              if (res.payeeName) {
                setUpiPayeeName(res.payeeName);
              } else {
                setUpiPayeeName(null);
              }
            }}
          />

          {/* 🔒 Account Password Verification Modal for UPI ID Save */}
          <Modal
            visible={showPasswordModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPasswordModal(false)}
          >
            <View style={styles.passwordOverlay}>
              <View style={styles.passwordCard}>
                <View style={styles.passwordHeader}>
                  <View style={styles.passwordIconBg}>
                    <Ionicons name="lock-closed" size={20} color="#15803d" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.passwordTitle}>Verify Account Password</Text>
                    <Text style={styles.passwordSub}>
                      UPI ID save karan lyi apna password enter karo
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setShowPasswordModal(false)}
                    style={styles.passwordCloseBtn}
                  >
                    <Ionicons name="close" size={18} color="#64748b" />
                  </TouchableOpacity>
                </View>

                {passwordError ? (
                  <View style={styles.passwordErrorBox}>
                    <Ionicons name="alert-circle" size={18} color="#dc2626" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.passwordErrorText}>{passwordError}</Text>
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#b91c1c', marginTop: 2 }}>
                        👉 ਹੇਠਾਂ ਦਿੱਤੇ ਬਾਕਸ ਵਿੱਚ ਸਹੀ ਪਾਸਵਰਡ ਦੁਬਾਰਾ ਭਰੋ:
                      </Text>
                    </View>
                  </View>
                ) : null}

                <View style={[styles.passwordInputWrap, passwordError ? { borderColor: '#ef4444', backgroundColor: '#fef2f2' } : null]}>
                  <Ionicons name="key-outline" size={18} color={passwordError ? '#dc2626' : '#64748b'} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.passwordTextInput}
                    placeholder={passwordError ? "Re-enter Account Password" : "Enter Your Account Password"}
                    placeholderTextColor={passwordError ? '#ef4444' : '#94a3b8'}
                    secureTextEntry
                    autoFocus
                    value={verifyPassword}
                    onChangeText={(t) => {
                      setVerifyPassword(t);
                      setPasswordError(null);
                    }}
                  />
                </View>

                <View style={styles.passwordActionsRow}>
                  <TouchableOpacity
                    style={styles.passwordCancelBtn}
                    onPress={() => setShowPasswordModal(false)}
                  >
                    <Text style={styles.passwordCancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.passwordConfirmBtn}
                    disabled={isVerifyingPassword}
                    onPress={handleConfirmPasswordAndSave}
                  >
                    {isVerifyingPassword ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="shield-checkmark" size={16} color="#ffffff" />
                        <Text style={styles.passwordConfirmBtnText}>Verify & Save</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>

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
  scanQrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  scanQrBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  payeeNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  payeeNameText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#166534',
  },
  passwordOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  passwordCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 18,
    gap: 12,
    ...premiumShadow('#0f172a', 'lg'),
  },
  passwordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  passwordIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  passwordSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  passwordCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    padding: 8,
    borderRadius: RADIUS.md,
  },
  passwordErrorText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#dc2626',
    flex: 1,
  },
  passwordInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    height: 44,
  },
  passwordTextInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  passwordActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
  },
  passwordCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  passwordCancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  passwordConfirmBtn: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordConfirmBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
