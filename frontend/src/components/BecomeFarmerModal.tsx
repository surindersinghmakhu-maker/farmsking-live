import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { PickerModal } from './PickerModal';
import { SOIL_TYPE_OPTIONS, SPRAY_TANK_SIZE_OPTIONS, WATER_TYPE_OPTIONS } from '../constants/farmerProfileOptions';
import { useBecomeFarmer } from '../hooks/useBecomeRole';
import { useAuth } from '../store/auth-context';
import { SoilType, SprayTankSizeL, WaterType } from '../types/api';

import { UpiQrScannerModal } from './UpiQrScannerModal';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface BecomeFarmerModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (updatedUser: any) => void;
}

export function BecomeFarmerModal({ visible, onClose, onSuccess }: BecomeFarmerModalProps) {
  const { user } = useAuth();
  const becomeFarmer = useBecomeFarmer();

  const [sprayTankSizeL, setSprayTankSizeL] = useState<SprayTankSizeL | null>(
    (user as any)?.sprayTankSizeL ?? 20,
  );
  const [upiId, setUpiId] = useState<string>((user as any)?.upiId ?? '');
  const [upiPayeeName, setUpiPayeeName] = useState<string | null>(null);
  const [showQrScanner, setShowQrScanner] = useState<boolean>(false);
  const [farmName, setFarmName] = useState<string>(user?.farmName || user?.name || '');
  const [farmAddress, setFarmAddress] = useState<string>(
    user?.farmAddress || [user?.village, user?.district, user?.state].filter(Boolean).join(', ') || ''
  );
  const [farmMobile, setFarmMobile] = useState<string>(user?.farmMobile || user?.mobile || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setUpiId((user as any)?.upiId ?? '');
      setFarmName(user.farmName || user.name || '');
      setFarmAddress(user.farmAddress || [user.village, user.district, user.state].filter(Boolean).join(', ') || '');
      setFarmMobile(user.farmMobile || user.mobile || '');
    }
  }, [user?.id, user?.upiId, user?.farmName, user?.farmAddress, user?.farmMobile, user?.name]);

  const isValid = !!sprayTankSizeL;

  const handleSubmit = async () => {
    tap();
    if (!isValid) {
      setErrorMessage('Please select Spray Tank size.');
      return;
    }
    if (!farmName.trim()) {
      setErrorMessage('Please enter Farm Name.');
      return;
    }
    if (!farmAddress.trim()) {
      setErrorMessage('Please enter Farm Address.');
      return;
    }
    if (!farmMobile.trim()) {
      setErrorMessage('Please enter Farm Mobile.');
      return;
    }
    setErrorMessage(null);

    try {
      const updatedUser = await becomeFarmer.mutateAsync({
        sprayTankSizeL: sprayTankSizeL!,
        upiId: upiId.trim() || undefined,
        farmName: farmName.trim(),
        farmAddress: farmAddress.trim(),
        farmMobile: farmMobile.trim(),
      });

      onSuccess(updatedUser);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'Could not save farmer profile details. Please try again.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBg, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="leaf" size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>🌾 Become a Farmer Profile Setup</Text>
                <Text style={styles.headerSub}>Farmer Profile & Printing Settings</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.noticeBanner}>
              <Ionicons name="information-circle-outline" size={16} color="#0369a1" />
              <Text style={styles.noticeText}>
                Fill required details to activate your Farmer Dashboard.
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={15} color="#ef4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Spray Tank Size */}
            <View style={styles.fieldSection}>
              <Text style={styles.label}>
                Spray Tank Size <Text style={styles.req}>*</Text>
              </Text>
              <View style={styles.chipRow}>
                {SPRAY_TANK_SIZE_OPTIONS.map((size) => {
                  const isSelected = size === sprayTankSizeL;
                  return (
                    <TouchableOpacity
                      key={size}
                      activeOpacity={0.8}
                      style={[styles.chip, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={() => {
                        tap();
                        setSprayTankSizeL(size);
                      }}
                    >
                      <Ionicons
                        name="flask"
                        size={13}
                        color={isSelected ? '#ffffff' : theme.primary}
                      />
                      <Text style={[styles.chipText, isSelected && { color: '#ffffff' }]}>{size} Litres</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Use in Printing Section */}
            <View style={styles.printingCard}>
              <View style={styles.printingHeaderRow}>
                <Ionicons name="print" size={16} color="#15803d" />
                <Text style={styles.printingTitle}>🖨️ Use in Printing (Bills / Receipts)</Text>
              </View>

              {/* 2-Column Row for Farm Name & Farm Mobile */}
              <View style={styles.twoColRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.compactLabel}>Farm Name *</Text>
                  <View style={styles.inputContainerCompact}>
                    <Ionicons name="business-outline" size={16} color="#64748b" />
                    <TextInput
                      style={styles.textInputCompact}
                      placeholder="Surinder Agro Farm"
                      placeholderTextColor="#94a3b8"
                      value={farmName}
                      onChangeText={setFarmName}
                    />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.compactLabel}>Farm Mobile *</Text>
                  <View style={styles.inputContainerCompact}>
                    <Ionicons name="call-outline" size={16} color="#64748b" />
                    <TextInput
                      style={styles.textInputCompact}
                      placeholder="9876543210"
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={farmMobile}
                      onChangeText={setFarmMobile}
                    />
                  </View>
                </View>
              </View>

              {/* Farm Address */}
              <View style={{ marginTop: 6 }}>
                <Text style={styles.compactLabel}>Farm Address *</Text>
                <View style={styles.inputContainerCompact}>
                  <Ionicons name="location-outline" size={16} color="#64748b" />
                  <TextInput
                    style={styles.textInputCompact}
                    placeholder="Grain Market, Shop No. 12, Phul"
                    placeholderTextColor="#94a3b8"
                    value={farmAddress}
                    onChangeText={setFarmAddress}
                  />
                </View>
              </View>

              {/* UPI ID */}
              <View style={{ marginTop: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                  <Text style={styles.compactLabel}>UPI ID (Optional - For Bill QR Code)</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.scanQrBtnCompact}
                    onPress={() => {
                      tap();
                      setShowQrScanner(true);
                    }}
                  >
                    <Ionicons name="camera-outline" size={12} color="#059669" />
                    <Text style={styles.scanQrBtnTextCompact}>📷 Scan QR</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainerCompact}>
                  <Ionicons name="qr-code-outline" size={16} color="#64748b" />
                  <TextInput
                    style={styles.textInputCompact}
                    placeholder="e.g. name@paytm"
                    placeholderTextColor="#94a3b8"
                    value={upiId}
                    onChangeText={(val) => {
                      setUpiId(val);
                      setUpiPayeeName(null);
                    }}
                    autoCapitalize="none"
                  />
                </View>

                {upiPayeeName ? (
                  <View style={styles.payeeBadgeCompact}>
                    <Ionicons name="checkmark-circle" size={13} color="#16a34a" />
                    <Text style={styles.payeeTextCompact}>
                      Verified: <Text style={{ fontFamily: FONT.extraBold, color: '#15803d' }}>{upiPayeeName}</Text>
                    </Text>
                  </View>
                ) : null}
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
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: theme.primary },
                !isValid && styles.saveBtnDisabled,
                premiumShadow(theme.primary, 'sm'),
              ]}
              activeOpacity={0.85}
              disabled={!isValid || becomeFarmer.isPending}
              onPress={handleSubmit}
            >
              {becomeFarmer.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Save & Activate</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xs,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    ...premiumShadow('#0f172a', 'md'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  headerIconBg: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 12,
    gap: 10,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#e0f2fe',
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  noticeText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#0369a1',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fef2f2',
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#ef4444',
  },
  fieldSection: {
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  compactLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
    marginBottom: 3,
  },
  req: {
    color: '#ef4444',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  chipText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  printingCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    gap: 2,
  },
  printingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  printingTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    height: 38,
  },
  textInputCompact: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
    height: '100%',
  },
  scanQrBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  scanQrBtnTextCompact: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  payeeBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  payeeTextCompact: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#166534',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
