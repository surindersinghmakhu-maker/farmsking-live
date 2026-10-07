import React, { ReactNode } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, ModalProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

export interface ThemedModalProps extends ModalProps {
  visible: boolean;
  onClose?: () => void;
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: ReactNode;
  maxWidth?: number;
}

export function ThemedModal({
  visible,
  onClose,
  title,
  icon,
  children,
  maxWidth = 450,
  animationType = 'fade',
  ...rest
}: ThemedModalProps) {
  const { colors } = useExecutiveTheme();

  return (
    <Modal visible={visible} transparent animationType={animationType} onRequestClose={onClose} {...rest}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              maxWidth,
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
            premiumShadow(colors.shadowColor || '#000000', 'lg'),
          ]}
        >
          {title ? (
            <View style={[styles.headerRow, { borderBottomColor: colors.borderColor || colors.cardBorder }]}>
              <View style={styles.titleWrap}>
                {icon ? (
                  <View style={[styles.iconCircle, { backgroundColor: colors.primaryLight }]}>
                    <Ionicons name={icon} size={20} color={colors.primary} />
                  </View>
                ) : null}
                <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              </View>
              {onClose ? (
                <TouchableOpacity
                  style={[styles.closeBtn, { backgroundColor: colors.bg }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}

          <View style={styles.content}>{children}</View>
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
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    marginBottom: 12,
    borderBottomWidth: 1,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexShrink: 1,
  },
});
