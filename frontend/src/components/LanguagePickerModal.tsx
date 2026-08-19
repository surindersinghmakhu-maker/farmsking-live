import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useLanguage } from '@/src/store/language-context';
import { LANGUAGE_OPTIONS } from '@/src/constants/translations';

export function LanguagePickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{t('language')}</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = language === option.code;
              return (
                <TouchableOpacity
                  key={option.code}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                  activeOpacity={0.7}
                  onPress={async () => {
                    await setLanguage(option.code);
                    onClose();
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionNative, isSelected && styles.optionTextSelected]}>{option.nativeName}</Text>
                    <Text style={[styles.optionEnglish, isSelected && styles.optionTextSelected]}>{option.englishName}</Text>
                  </View>
                  {isSelected ? <Ionicons name="checkmark-circle" size={22} color="#16a34a" /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...premiumShadow('#000000', 'lg'),
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  optionRowSelected: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  optionNative: { fontSize: 15, fontFamily: FONT.bold, color: '#0f172a' },
  optionEnglish: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  optionTextSelected: { color: '#15803d' },
});
