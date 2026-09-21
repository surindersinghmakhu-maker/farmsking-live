import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

interface DoctorChangeDisclaimerModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentDoctorName?: string;
  newDoctorName?: string;
  isLoading?: boolean;
}

export const DoctorChangeDisclaimerModal: React.FC<DoctorChangeDisclaimerModalProps> = ({
  visible,
  onClose,
  onConfirm,
  currentDoctorName,
  newDoctorName,
  isLoading = false,
}) => {
  const handleConfirm = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onConfirm();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, premiumShadow('#000000', 'lg')]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="warning" size={24} color="#d97706" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>⚠️ Doctor Change Request</Text>
              <Text style={styles.subtitle}>
                Important terms & conditions before changing doctor
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={isLoading}>
              <Ionicons name="close-circle" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
            {/* Warning Details */}
            <View style={styles.infoBox}>
              <View style={styles.bulletRow}>
                <Ionicons name="alert-circle" size={18} color="#dc2626" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bulletTitle}>Previous Doctor Fees Non-Refundable</Text>
                  <Text style={styles.bulletDesc}>
                    The consultation fees paid to your current doctor{currentDoctorName ? ` (Dr. ${currentDoctorName})` : ''} are strictly non-refundable under platform policy.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletRow}>
                <Ionicons name="ticket" size={18} color="#0284c7" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bulletTitle}>New Coupon / Fee Required</Text>
                  <Text style={styles.bulletDesc}>
                    You will need to redeem a new Doctor Coupon or purchase a new Crop Care Plan for{newDoctorName ? ` Dr. ${newDoctorName}` : ' the new Doctor'}.
                  </Text>
                </View>
              </View>

              <View style={styles.bulletRow}>
                <Ionicons name="shield-checkmark" size={18} color="#059669" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.bulletTitle}>Super Admin Review & Notice</Text>
                  <Text style={styles.bulletDesc}>
                    Your request will be submitted to Super Admin first. Super Admin will inform your current doctor before approving and forwarding the request to your new doctor.
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.disclaimerNote}>
              <Text style={styles.disclaimerText}>
                📌 By proceeding, you agree that your current doctor will be informed and a new coupon/plan will be assigned after Admin review.
              </Text>
            </View>
          </ScrollView>

          {/* Action Buttons */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmBtn, isLoading && { opacity: 0.6 }]}
              onPress={handleConfirm}
              disabled={isLoading}
            >
              <Text style={styles.confirmBtnText}>
                {isLoading ? 'Submitting...' : 'I Understand & Request Change'}
              </Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  infoBox: {
    gap: 12,
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  bulletTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  bulletDesc: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  disclaimerNote: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1,
    padding: 10,
    borderRadius: RADIUS.md,
    marginTop: 12,
  },
  disclaimerText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#92400e',
    lineHeight: 15,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  cancelBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: '#0284c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
