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
  const [soilType, setSoilType] = useState<SoilType | null>((user as any)?.soilType ?? null);
  const [waterType, setWaterType] = useState<WaterType | null>((user as any)?.waterType ?? null);
  const [upiId, setUpiId] = useState<string>((user as any)?.upiId ?? '');
  const [billPrintingAddress, setBillPrintingAddress] = useState<string>((user as any)?.billPrintingAddress ?? '');
  const [village, setVillage] = useState<string>(user?.village ?? '');
  const [district, setDistrict] = useState<string>(user?.district ?? '');

  const [isSoilPickerOpen, setIsSoilPickerOpen] = useState(false);
  const [isWaterPickerOpen, setIsWaterPickerOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const selectedSoilLabel = SOIL_TYPE_OPTIONS.find((o) => o.value === soilType)?.label;
  const selectedWaterLabel = WATER_TYPE_OPTIONS.find((o) => o.value === waterType)?.label;

  const isValid = !!sprayTankSizeL && !!soilType && !!waterType;

  const handleSubmit = async () => {
    tap();
    if (!isValid) {
      setErrorMessage('ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਜ਼ਰੂਰੀ ਖੇਤਰ (Spray Tank, Soil Type, Water Source) ਭਰੋ।');
      return;
    }
    setErrorMessage(null);

    try {
      const updatedUser = await becomeFarmer.mutateAsync({
        sprayTankSizeL: sprayTankSizeL!,
        soilType: soilType!,
        waterType: waterType!,
        upiId: upiId.trim() || undefined,
        billPrintingAddress: billPrintingAddress.trim() || undefined,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
      });

      onSuccess(updatedUser);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ?? 'ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਸੇਵ ਕਰਨ ਵਿੱਚ ਦਿੱਕਤ ਆਈ। ਕਿਰਪਾ ਕਰਕੇ ਦੁਬਾਰਾ ਕੋਸ਼ਿਸ਼ ਕਰੋ।';
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
                <Ionicons name="leaf" size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.headerTitle}>🌾 Become a Farmer Profile Setup</Text>
                <Text style={styles.headerSub}>ਕਿਸਾਨ ਪ੍ਰੋਫਾਈਲ ਜਾਣਕਾਰੀ</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} activeOpacity={0.7} onPress={onClose}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            <View style={styles.noticeBanner}>
              <Ionicons name="information-circle-outline" size={18} color="#0369a1" />
              <Text style={styles.noticeText}>
                ਕਿਸਾਨ ਡੈਸ਼ਬੋਰਡ ਚਾਲੂ ਕਰਨ ਲਈ ਹੇਠਾਂ ਦਿੱਤੀ ਜਾਣਕਾਰੀ ਭਰਨਾ ਲਾਜ਼ਮੀ ਹੈ।
              </Text>
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#ef4444" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Spray Tank Size */}
            <View style={styles.fieldSection}>
              <Text style={styles.label}>
                Spray Tank Size (ਛਿੜਕਾਅ ਟੈਂਕ ਦਾ ਸਾਈਜ਼) <Text style={styles.req}>*</Text>
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
                        size={15}
                        color={isSelected ? '#ffffff' : theme.primary}
                        style={{ marginBottom: 2 }}
                      />
                      <Text style={[styles.chipText, isSelected && { color: '#ffffff' }]}>{size} Litres</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Soil Type */}
            <View style={styles.fieldSection}>
              <Text style={styles.label}>
                Soil Type (ਮਿੱਟੀ ਦੀ ਕਿਸਮ) <Text style={styles.req}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectField}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  setIsSoilPickerOpen(true);
                }}
              >
                <View style={styles.selectLeft}>
                  <Ionicons name="earth" size={18} color="#64748b" />
                  <Text style={[styles.selectText, !selectedSoilLabel && styles.placeholder]}>
                    {selectedSoilLabel ?? 'Select Soil Type (ਮਿੱਟੀ ਚੁਣੋ)'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Water Source */}
            <View style={styles.fieldSection}>
              <Text style={styles.label}>
                Water Source (ਪਾਣੀ / ਸਿੰਚਾਈ ਦਾ ਸਰੋਤ) <Text style={styles.req}>*</Text>
              </Text>
              <TouchableOpacity
                style={styles.selectField}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  setIsWaterPickerOpen(true);
                }}
              >
                <View style={styles.selectLeft}>
                  <Ionicons name="water" size={18} color="#0284c7" />
                  <Text style={[styles.selectText, !selectedWaterLabel && styles.placeholder]}>
                    {selectedWaterLabel ?? 'Select Water Source (ਪਾਣੀ ਦਾ ਸਰੋਤ ਚੁਣੋ)'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* UPI ID for Bill QR Code */}
            <View style={[styles.fieldSection, styles.upiHighlightBox]}>
              <View style={styles.upiHeaderRow}>
                <Ionicons name="qr-code" size={18} color="#15803d" />
                <Text style={[styles.label, { marginBottom: 0 }]}>
                  Farmer UPI ID (ਬਿੱਲ ਵਿੱਚ Payment QR ਜਨਰੇਟ ਕਰਨ ਲਈ)
                </Text>
              </View>
              <Text style={styles.upiHelpSub}>
                ਆਪਣੀ GPay / PhonePe / Paytm ਦੀ UPI ID ਦਰਜ ਕਰੋ, ਇਸ ਨਾਲ ਬਿੱਲ ਉੱਤੇ ਆਟੋਮੈਟਿਕ QR Code ਲੱਗੇਗਾ।
              </Text>
              <View style={styles.inputContainer}>
                <Ionicons name="card-outline" size={18} color="#15803d" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 9876543210@paytm, name@oksbi"
                  placeholderTextColor="#94a3b8"
                  value={upiId}
                  onChangeText={setUpiId}
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Bill Printing Address */}
            <View style={styles.fieldSection}>
              <Text style={styles.label}>Bill Printing Address (ਬਿੱਲ 'ਤੇ ਪ੍ਰਿੰਟ ਹੋਣ ਵਾਲਾ ਪਤਾ)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="document-text-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Grain Market, Shop No. 12, Phul"
                  placeholderTextColor="#94a3b8"
                  value={billPrintingAddress}
                  onChangeText={setBillPrintingAddress}
                />
              </View>
            </View>

            {/* Village / District */}
            <View style={styles.fieldSection}>
              <Text style={styles.label}>Village / Location (ਪਿੰਡ / ਸ਼ਹਿਰ)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="location-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Rampura Phul"
                  placeholderTextColor="#94a3b8"
                  value={village}
                  onChangeText={setVillage}
                />
              </View>
            </View>

            <View style={styles.fieldSection}>
              <Text style={styles.label}>District (ਜ਼ਿਲ੍ਹਾ)</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="map-outline" size={18} color="#64748b" />
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Bathinda"
                  placeholderTextColor="#94a3b8"
                  value={district}
                  onChangeText={setDistrict}
                />
              </View>
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
                premiumShadow(theme.primary, 'md'),
              ]}
              activeOpacity={0.85}
              disabled={!isValid || becomeFarmer.isPending}
              onPress={handleSubmit}
            >
              {becomeFarmer.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                  <Text style={styles.saveBtnText}>Save & Activate Farmer</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Pickers */}
      <PickerModal
        visible={isSoilPickerOpen}
        title="Select Soil Type (ਮਿੱਟੀ ਦੀ ਕਿਸਮ)"
        options={SOIL_TYPE_OPTIONS}
        selectedValue={soilType}
        onSelect={(value) => setSoilType(value)}
        onClose={() => setIsSoilPickerOpen(false)}
      />
      <PickerModal
        visible={isWaterPickerOpen}
        title="Select Water Source (ਪਾਣੀ ਦਾ ਸਰੋਤ)"
        options={WATER_TYPE_OPTIONS}
        selectedValue={waterType}
        onSelect={(value) => setWaterType(value)}
        onClose={() => setIsWaterPickerOpen(false)}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...premiumShadow('#0f172a', 'lg'),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  headerIconBg: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  headerSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    gap: 14,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#0369a1',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#ef4444',
  },
  fieldSection: {
    gap: 6,
  },
  label: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  req: {
    color: '#ef4444',
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  chipText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingVertical: 12,
    paddingHorizontal: SPACING.md,
  },
  selectLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  selectText: {
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    flex: 1,
  },
  placeholder: {
    color: '#94a3b8',
  },
  upiHighlightBox: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 10,
  },
  upiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  upiHelpSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#166534',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    paddingHorizontal: SPACING.md,
    height: 44,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    height: '100%',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
