import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

export interface CropOption {
  id: string;
  cropName: string;
  variety?: string | null;
  cropId?: string | null;
  plot?: { name?: string | null } | null;
  area?: number | null;
  stage?: string | null;
}

interface CropSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (cropId: string, cropName: string, notes?: string) => void;
  doctorName?: string;
  crops: CropOption[];
  isInstantCall?: boolean;
  isLoading?: boolean;
}

export const CropSelectionModal: React.FC<CropSelectionModalProps> = ({
  visible,
  onClose,
  onConfirm,
  doctorName = 'Agri-Doctor',
  crops,
  isInstantCall = false,
  isLoading = false,
}) => {
  const { isDark, colors } = useExecutiveTheme();
  const [selectedCropId, setSelectedCropId] = useState<string>(crops[0]?.id || 'GENERAL');
  const [notes, setNotes] = useState<string>('');

  const tap = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const selectedCrop = crops.find((c) => c.id === selectedCropId);
  const selectedCropName = selectedCrop ? selectedCrop.cropName : 'General Farm Advisory';

  const handleConfirm = () => {
    tap();
    onConfirm(selectedCropId, selectedCropName, notes.trim() || undefined);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDark ? '#0b1322' : '#ffffff', borderColor: isDark ? 'rgba(0, 255, 135, 0.25)' : '#cbd5e1' }, premiumShadow('#000000', 'lg')]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={[styles.iconCircle, { backgroundColor: isInstantCall ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
              <Ionicons name={isInstantCall ? 'flash' : 'shield-checkmark'} size={22} color={isInstantCall ? '#f59e0b' : '#10b981'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                {isInstantCall ? '⚡ Instant Consultation Request' : '🩺 Grant Crop Permission'}
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? colors.textMuted : '#64748b' }]}>
                Doctor: Dr. {doctorName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Ionicons name="close-circle" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8, gap: 12 }}>
            {/* Privacy Callout */}
            <View style={[styles.privacyNotice, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#ecfdf5', borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#a7f3d0' }]}>
              <Ionicons name="lock-closed" size={17} color="#059669" style={{ marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.privacyNoticeTitle, { color: isDark ? '#34d399' : '#065f46' }]}>
                  Strict Crop Privacy Protocol
                </Text>
                <Text style={[styles.privacyNoticeText, { color: isDark ? '#cbd5e1' : '#047857' }]}>
                  Dr. {doctorName} will only receive diagnostic authority for the specific crop selected below. Your other farm plots, financial bahi-khata, and private ledger remain 100% confidential.
                </Text>
              </View>
            </View>

            {/* Crop Picker Section */}
            <Text style={[styles.sectionLabel, { color: isDark ? '#ffffff' : '#1e293b' }]}>
              Select Crop to Share:
            </Text>

            {crops.length === 0 ? (
              <View style={[styles.emptyCropsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }]}>
                <Ionicons name="leaf-outline" size={24} color="#94a3b8" />
                <Text style={{ fontSize: 13, fontFamily: FONT.semiBold, color: '#64748b', textAlign: 'center' }}>
                  No registered crops found on your farm.
                </Text>
                <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' }}>
                  A general advisory consultation will be opened for you.
                </Text>
              </View>
            ) : (
              crops.map((crop) => {
                const isSelected = selectedCropId === crop.id;
                return (
                  <TouchableOpacity
                    key={crop.id}
                    style={[
                      styles.cropOptionRow,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#f0fdf4')
                          : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                        borderColor: isSelected ? '#10b981' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'),
                      },
                    ]}
                    onPress={() => {
                      tap();
                      setSelectedCropId(crop.id);
                    }}
                  >
                    <View style={[styles.radioCircle, { borderColor: isSelected ? '#10b981' : '#94a3b8' }]}>
                      {isSelected ? <View style={styles.radioInner} /> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.cropNameText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          🌾 {crop.cropName}
                        </Text>
                        {crop.stage ? (
                          <View style={styles.stageBadge}>
                            <Text style={styles.stageBadgeText}>{crop.stage}</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text style={[styles.cropDetailText, { color: isDark ? colors.textMuted : '#64748b' }]}>
                        {crop.variety ? `Variety: ${crop.variety}` : 'Local Variety'}
                        {crop.plot?.name ? ` · Plot: ${crop.plot.name}` : ''}
                        {crop.area ? ` · Area: ${crop.area} Acres` : ''}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            {/* General Farm Option */}
            {crops.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.cropOptionRow,
                  {
                    backgroundColor: selectedCropId === 'GENERAL'
                      ? (isDark ? 'rgba(16, 185, 129, 0.16)' : '#f0fdf4')
                      : (isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc'),
                    borderColor: selectedCropId === 'GENERAL' ? '#10b981' : (isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0'),
                  },
                ]}
                onPress={() => {
                  tap();
                  setSelectedCropId('GENERAL');
                }}
              >
                <View style={[styles.radioCircle, { borderColor: selectedCropId === 'GENERAL' ? '#10b981' : '#94a3b8' }]}>
                  {selectedCropId === 'GENERAL' ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cropNameText, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    🌱 General Farm Advisory (Whole Farm Consultation)
                  </Text>
                  <Text style={[styles.cropDetailText, { color: isDark ? colors.textMuted : '#64748b' }]}>
                    General soil, weather telemetry, or seed planning across your entire farm
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Optional Issue Notes */}
            <View style={{ marginTop: 4 }}>
              <Text style={[styles.sectionLabel, { color: isDark ? '#ffffff' : '#1e293b' }]}>
                Describe Issue / Symptoms (Optional):
              </Text>
              <TextInput
                style={[
                  styles.notesInput,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#ffffff',
                    color: isDark ? '#ffffff' : '#0f172a',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1',
                  },
                ]}
                placeholder="e.g. Yellow leaves on flag leaf, need urgent spray recommendation..."
                placeholderTextColor="#94a3b8"
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : '#cbd5e1' }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                { backgroundColor: isInstantCall ? '#f59e0b' : '#10b981' },
                isLoading && { opacity: 0.7 },
              ]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.confirmBtnText}>
                  {isInstantCall ? 'Request Instant Call ⚡' : 'Grant Permission & Assign 🩺'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  privacyNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  privacyNoticeTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  privacyNoticeText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 2,
    lineHeight: 16,
  },
  sectionLabel: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    marginBottom: 6,
  },
  emptyCropsBox: {
    padding: 18,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  cropOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
  },
  cropNameText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  cropDetailText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  stageBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  stageBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  notesInput: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 10,
    fontSize: 12.5,
    fontFamily: FONT.regular,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});

