import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useLanguage } from '@/src/store/language-context';
import { LANGUAGE_OPTIONS } from '@/src/constants/translations';
import { useExecutiveTheme } from '@/src/store/theme-context';

export function LanguagePickerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { language, setLanguage, t } = useLanguage();
  const { colors } = useExecutiveTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <View style={styles.headerRow}>
            <Text style={[styles.title, { color: colors.text }]}>{t('language')}</Text>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: colors.bg }]} onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
            {LANGUAGE_OPTIONS.map((option) => {
              const isSelected = language === option.code;
              return (
                <TouchableOpacity
                  key={option.code}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: isSelected ? colors.primaryLight : colors.bg,
                      borderColor: isSelected ? colors.primary : colors.borderColor || colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={async () => {
                    await setLanguage(option.code);
                    onClose();
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionNative, { color: isSelected ? colors.primary : colors.text }]}>{option.nativeName}</Text>
                    <Text style={[styles.optionEnglish, { color: isSelected ? colors.primary : colors.textMuted }]}>{option.englishName}</Text>
                  </View>
                  {isSelected ? <Ionicons name="checkmark-circle" size={22} color={colors.primary} /> : null}
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    ...premiumShadow('#000000', 'lg'),
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 16, fontFamily: FONT.extraBold },
  closeBtn: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  optionNative: { fontSize: 15, fontFamily: FONT.bold },
  optionEnglish: { fontSize: 11.5, fontFamily: FONT.medium, marginTop: 1 },
});
