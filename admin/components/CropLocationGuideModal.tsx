import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CropLocationGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onOpenGpsPicker: () => void;
}

export const CropLocationGuideModal: React.FC<CropLocationGuideModalProps> = ({
  visible,
  onClose,
  onOpenGpsPicker,
}) => {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="information-circle" size={24} color="#166534" />
              </View>
              <Text style={styles.title}>📍 Crop GPS Location Process Guide</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <Text style={styles.introText}>
              How setting your crop GPS location empowers both you and your Farm Advisor to inspect crop health remotely:
            </Text>

            {/* Step 1 */}
            <View style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 1</Text>
              </View>
              <Text style={styles.stepTitle}>📍 1-Tap Field GPS Lock</Text>
              <Text style={styles.stepDesc}>
                Stand in your crop field and tap 1-Click GPS Lock button. Mobile GPS automatically captures your exact latitude & longitude coordinates.
              </Text>
            </View>

            {/* Step 2 */}
            <View style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 2</Text>
              </View>
              <Text style={styles.stepTitle}>🗺️ Mark Field Boundary & Acres</Text>
              <Text style={styles.stepDesc}>
                Tap 4 corners of your plot on the preview map. The app automatically calculates your exact field size in Acres (e.g. 2.8 Acres).
              </Text>
            </View>

            {/* Step 3 */}
            <View style={styles.stepCard}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>STEP 3</Text>
              </View>
              <Text style={styles.stepTitle}>🛰️ Automatic ISRO Satellite Sync</Text>
              <Text style={styles.stepDesc}>
                Sentinel-2 / ISRO satellites will scan your saved field location every 5 days, generating color-coded NDVI health & soil moisture heatmaps.
              </Text>
            </View>

            {/* Step 4 */}
            <View style={[styles.stepCard, styles.highlightStepCard]}>
              <View style={[styles.stepBadge, { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.stepBadgeText, { color: '#15803d' }]}>STEP 4 — ADVISOR INSPECTION</Text>
              </View>
              <Text style={[styles.stepTitle, { color: '#166534' }]}>
                👨‍🌾 Advisor & Farmer Remote Inspection
              </Text>
              <Text style={styles.stepDesc}>
                Your assigned Farm Advisor can view your exact crop GPS location & live satellite map directly from their Advisor Dashboard. They can diagnose crop diseases and prescribe sprays without needing a physical farm visit!
              </Text>
            </View>
          </ScrollView>

          {/* Bottom Action Row */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
              <Text style={styles.closeModalText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.openGpsBtn}
              onPress={() => {
                onClose();
                onOpenGpsPicker();
              }}
            >
              <Ionicons name="location" size={18} color="#ffffff" />
              <Text style={styles.openGpsText}>Set Location Now</Text>
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
    padding: 16,
  },
  card: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0f172a',
  },
  closeBtn: {
    padding: 4,
  },
  introText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  stepCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },
  highlightStepCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderLeftWidth: 4,
    borderLeftColor: '#16a34a',
  },
  stepBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#e2e8f0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 6,
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  stepDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  closeModalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
  },
  openGpsBtn: {
    flex: 1.8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16a34a',
  },
  openGpsText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
  },
});
