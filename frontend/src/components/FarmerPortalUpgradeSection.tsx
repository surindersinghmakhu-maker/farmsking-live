import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { formatInr } from '@/src/utils/formatInr';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
};

export type ExecutiveTheme = 'EMERALD' | 'DARK' | 'GOLD';

const THEME_CONFIG: Record<
  ExecutiveTheme,
  {
    name: string;
    icon: keyof typeof Ionicons.glyphMap;
    headerGradient: [string, string, string];
    cardBg: string;
    borderColor: string;
    titleColor: string;
    subColor: string;
    accentColor: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  EMERALD: {
    name: 'Royal Emerald',
    icon: 'leaf',
    headerGradient: ['#064e3b', '#047857', '#065f46'],
    cardBg: '#ffffff',
    borderColor: '#e2e8f0',
    titleColor: '#0f172a',
    subColor: '#64748b',
    accentColor: '#047857',
    badgeBg: 'rgba(251, 191, 36, 0.18)',
    badgeText: '#fbbf24',
  },
  DARK: {
    name: 'Midnight Dark',
    icon: 'moon',
    headerGradient: ['#0f172a', '#1e293b', '#334155'],
    cardBg: 'rgba(30, 41, 59, 0.92)',
    borderColor: '#334155',
    titleColor: '#f8fafc',
    subColor: '#94a3b8',
    accentColor: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.2)',
    badgeText: '#38bdf8',
  },
  GOLD: {
    name: 'Golden Harvest',
    icon: 'sparkles',
    headerGradient: ['#78350f', '#b45309', '#d97706'],
    cardBg: '#fffbeb',
    borderColor: '#fde68a',
    titleColor: '#78350f',
    subColor: '#b45309',
    accentColor: '#d97706',
    badgeBg: 'rgba(255, 255, 255, 0.25)',
    badgeText: '#ffffff',
  },
};

interface FarmerPortalUpgradeSectionProps {
  executiveTheme?: ExecutiveTheme;
}

export const FarmerPortalUpgradeSection: React.FC<FarmerPortalUpgradeSectionProps> = ({
  executiveTheme = 'EMERALD',
}) => {
  const tConfig = THEME_CONFIG[executiveTheme];

  // Modal Visibility States
  const [showDoctorVideoModal, setShowDoctorVideoModal] = useState(false);
  const [showScannerModal, setShowScannerModal] = useState(false);

  // Video Call State
  const [isVideoCalling, setIsVideoCalling] = useState(false);
  const [callConnected, setCallConnected] = useState(false);

  // Scanner State
  const [scanResult, setScanResult] = useState<null | {
    brand: string;
    productName: string;
    batchNo: string;
    expiryDate: string;
    authenticity: 'ORIGINAL' | 'SUSPICIOUS';
    dosage: string;
  }>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Emergency Siren State
  const [isSirenActive, setIsSirenActive] = useState(true);

  // Multi-Mandi Comparison Selected Crop
  const [selectedCrop, setSelectedCrop] = useState<'Wheat' | 'Paddy 1509' | 'Cotton'>('Wheat');

  const mandiData = {
    Wheat: [
      { mandi: 'Khanna Mandi', price: 2350, distance: '12 km', isBest: true },
      { mandi: 'Kotkapura Mandi', price: 2315, distance: '28 km', isBest: false },
      { mandi: 'Bathinda Mandi', price: 2320, distance: '45 km', isBest: false },
      { mandi: 'Abohar Mandi', price: 2295, distance: '60 km', isBest: false },
    ],
    'Paddy 1509': [
      { mandi: 'Khanna Mandi', price: 3820, distance: '12 km', isBest: false },
      { mandi: 'Kotkapura Mandi', price: 4120, distance: '28 km', isBest: true },
      { mandi: 'Bathinda Mandi', price: 3950, distance: '45 km', isBest: false },
      { mandi: 'Abohar Mandi', price: 3890, distance: '60 km', isBest: false },
    ],
    Cotton: [
      { mandi: 'Abohar Mandi', price: 7450, distance: '60 km', isBest: true },
      { mandi: 'Bathinda Mandi', price: 7310, distance: '28 km', isBest: false },
      { mandi: 'Kotkapura Mandi', price: 7280, distance: '28 km', isBest: false },
      { mandi: 'Khanna Mandi', price: 7150, distance: '12 km', isBest: false },
    ],
  };

  const handleSimulateScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setScanResult({
        brand: 'IFFCO Official Chemical & Fertilizer',
        productName: 'Nano Urea Liquid (500 ml)',
        batchNo: 'IF-2026-B884',
        expiryDate: '12/2028',
        authenticity: 'ORIGINAL',
        dosage: '2ml to 4ml per Liter of clean water spray',
      });
    }, 1500);
  };

  const handleStartVideoCall = () => {
    setIsVideoCalling(true);
    setTimeout(() => {
      setIsVideoCalling(false);
      setCallConnected(true);
    }, 2000);
  };

  return (
    <View style={styles.container}>

      {/* 📹 Video Call Modal */}
      <Modal visible={showDoctorVideoModal} transparent animationType="slide" onRequestClose={() => setShowDoctorVideoModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="videocam" size={20} color="#047857" />
                <Text style={styles.modalTitle}>Agri Doctor Video Call</Text>
              </View>
              <TouchableOpacity onPress={() => setShowDoctorVideoModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {callConnected ? (
              <View style={{ gap: 12, alignItems: 'center', paddingVertical: 10 }}>
                <View style={styles.connectedVideoBox}>
                  <Ionicons name="person-circle" size={80} color="#047857" />
                  <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#ffffff', marginTop: 4 }}>
                    Dr. Sudhir Kumar (Senior Agronomist)
                  </Text>
                  <View style={styles.connectedLiveTag}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.connectedLiveText}>LIVE VIDEO CONSULTATION</Text>
                  </View>
                </View>

                <View style={styles.prescriptionCard}>
                  <Text style={styles.prescriptionTitle}>📝 Official Prescription Summary</Text>
                  <Text style={styles.prescriptionText}>• Recommended Fungicide: Propiconazole 25% EC (200ml / acre)</Text>
                  <Text style={styles.prescriptionText}>• Water Ratio: 150 Liters water per acre spray</Text>
                </View>

                <TouchableOpacity
                  style={styles.endCallBtn}
                  onPress={() => {
                    setCallConnected(false);
                    setShowDoctorVideoModal(false);
                  }}
                >
                  <Ionicons name="call" size={16} color="#ffffff" style={{ transform: [{ rotate: '135deg' }] }} />
                  <Text style={styles.endCallBtnText}>End Video Call</Text>
                </TouchableOpacity>
              </View>
            ) : isVideoCalling ? (
              <View style={{ alignItems: 'center', paddingVertical: 30, gap: 12 }}>
                <Ionicons name="call-outline" size={48} color="#047857" />
                <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' }}>
                  Connecting to Dr. Sudhir Kumar...
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b', fontFamily: FONT.medium }}>
                  Please hold on while video stream initializes
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                <View style={styles.doctorInfoBox}>
                  <View style={styles.doctorAvatar}>
                    <Ionicons name="person" size={24} color="#047857" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' }}>
                      Dr. Sudhir Kumar
                    </Text>
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' }}>
                      Senior Agronomist & Crop Protection Specialist
                    </Text>
                    <View style={styles.onlineBadge}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' }} />
                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#15803d' }}>
                        ONLINE & AVAILABLE FOR VIDEO CALL
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity style={styles.startCallBtn} onPress={handleStartVideoCall}>
                  <Ionicons name="videocam" size={18} color="#ffffff" />
                  <Text style={styles.startCallBtnText}>Start Live Video Call Now</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 🔎 Scanner Modal */}
      <Modal visible={showScannerModal} transparent animationType="slide" onRequestClose={() => setShowScannerModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="qr-code" size={20} color="#0284c7" />
                <Text style={styles.modalTitle}>Authenticity Barcode Scanner</Text>
              </View>
              <TouchableOpacity onPress={() => setShowScannerModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {scanResult ? (
              <View style={{ gap: 12 }}>
                <View style={styles.scanSuccessBox}>
                  <Ionicons name="checkmark-circle" size={32} color="#16a34a" />
                  <Text style={styles.scanSuccessTitle}>VERIFIED ORIGINAL PRODUCT</Text>
                  <Text style={styles.scanBrandText}>{scanResult.brand}</Text>
                </View>

                <View style={styles.scanDetailCard}>
                  <Text style={styles.scanDetailRow}>📦 Product: {scanResult.productName}</Text>
                  <Text style={styles.scanDetailRow}>🏷️ Batch No: {scanResult.batchNo}</Text>
                  <Text style={styles.scanDetailRow}>📅 Expiry Date: {scanResult.expiryDate}</Text>
                  <Text style={styles.scanDetailRow}>🧪 Safe Dosage: {scanResult.dosage}</Text>
                </View>

                <TouchableOpacity style={styles.scanAgainBtn} onPress={() => setScanResult(null)}>
                  <Ionicons name="refresh" size={16} color="#ffffff" />
                  <Text style={styles.scanAgainBtnText}>Scan Another Product</Text>
                </TouchableOpacity>
              </View>
            ) : isScanning ? (
              <View style={{ alignItems: 'center', paddingVertical: 30, gap: 12 }}>
                <Ionicons name="scan" size={48} color="#0284c7" />
                <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' }}>
                  Scanning Product Barcode / QR Code...
                </Text>
              </View>
            ) : (
              <View style={{ gap: 14, alignItems: 'center' }}>
                <View style={styles.cameraViewfinder}>
                  <Ionicons name="qr-code-outline" size={80} color="#0284c7" />
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', marginTop: 8 }}>
                    Align fertilizer bag or spray bottle barcode inside camera frame
                  </Text>
                </View>

                <TouchableOpacity style={styles.triggerScanBtn} onPress={handleSimulateScan}>
                  <Ionicons name="camera" size={18} color="#ffffff" />
                  <Text style={styles.triggerScanBtnText}>Tap to Scan Barcode</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* 📹 5. Agri Doctor Video Call & 🔎 6. Authenticity Scanner Buttons (Single Row at Bottom, Disabled by Default) */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: '#047857' },
            styles.actionBtnDisabled,
            premiumShadow('#047857', 'sm'),
          ]}
          activeOpacity={0.88}
          disabled={true}
          onPress={() => {
            tap();
            setShowDoctorVideoModal(true);
          }}
        >
          <Ionicons name="videocam" size={18} color="#ffffff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionBtnTitle} numberOfLines={1} adjustsFontSizeToFit>Agri Doctor Video Call</Text>
            <Text style={styles.actionBtnSub} numberOfLines={1} adjustsFontSizeToFit>1-Tap Video Consultation</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: '#0284c7' },
            styles.actionBtnDisabled,
            premiumShadow('#0284c7', 'sm'),
          ]}
          activeOpacity={0.88}
          disabled={true}
          onPress={() => {
            tap();
            setScanResult(null);
            setShowScannerModal(true);
          }}
        >
          <Ionicons name="qr-code" size={18} color="#ffffff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionBtnTitle} numberOfLines={1} adjustsFontSizeToFit>Authenticity Scanner</Text>
            <Text style={styles.actionBtnSub} numberOfLines={1} adjustsFontSizeToFit>Verify Barcode & Spray</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 10 },
  royalBanner: {
    borderRadius: RADIUS.lg,
    padding: 14,
    gap: 6,
  },
  royalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  royalBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  royalBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  themeSelectorBox: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 2,
    borderRadius: RADIUS.pill,
  },
  themePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  themePillBtnActive: {
    backgroundColor: '#ffffff',
  },
  themePillText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  themePillTextActive: {
    color: '#0f172a',
  },
  royalTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginTop: 2,
  },
  royalSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  glassCard: {
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  radialGaugeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 10,
    borderRadius: 10,
  },
  outerRingGauge: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRingContent: {
    alignItems: 'center',
  },
  gaugeValueText: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
  },
  gaugeLabelText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    marginTop: -2,
  },
  liveSensorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  liveSensorText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#047857',
  },
  gaugeStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  gaugeStatLabel: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  gaugeStatVal: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  emergencyCard: {
    backgroundColor: '#fef2f2',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#fecaca',
    gap: 8,
  },
  emergencyTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  alertIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#991b1b',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#dc2626',
  },
  livePulseTag: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    backgroundColor: '#dc2626',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  emergencySub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#7f1d1d',
    marginTop: 1,
  },
  sirenToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#991b1b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  sirenToggleActive: {
    backgroundColor: '#dc2626',
  },
  sirenToggleText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  emergencyAdviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  emergencyAdviceText: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#991b1b',
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  doctorStampBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  doctorStampText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#047857',
  },
  timelineProgressContainer: { gap: 4 },
  timelineLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stageActiveText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  stagePercentText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#e2e8f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  recommendationBox: {
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  recommendationTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#047857',
  },
  recommendationText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#166534',
    marginTop: 2,
  },
  actionButtonsRow: {
    flexDirection: 'column',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.md,
    gap: 10,
  },
  actionBtnTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  actionBtnSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.88)',
  },
  cropPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f1f5f9',
  },
  cropPillActive: {
    backgroundColor: '#2563eb',
  },
  cropPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  cropPillTextActive: {
    color: '#ffffff',
  },
  mandiTable: { gap: 6 },
  mandiTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    padding: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  mandiTableRowBest: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  mandiNameText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  mandiDistanceText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  bestPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#16a34a',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  bestPriceBadgeText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  mandiPriceText: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 12,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  doctorInfoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  startCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#047857',
    paddingVertical: 12,
    borderRadius: 10,
  },
  startCallBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  connectedVideoBox: {
    width: '100%',
    backgroundColor: '#064e3b',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  connectedLiveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dc2626',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 8,
  },
  connectedLiveText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  prescriptionCard: {
    width: '100%',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  prescriptionTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  prescriptionText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  endCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    width: '100%',
  },
  endCallBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  cameraViewfinder: {
    width: '100%',
    height: 180,
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#0284c7',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  triggerScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: 10,
    width: '100%',
  },
  triggerScanBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  scanSuccessBox: {
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#86efac',
    gap: 4,
  },
  scanSuccessTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  scanBrandText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  scanDetailCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 6,
  },
  scanDetailRow: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  scanAgainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  scanAgainBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  actionBtnDisabled: {
    opacity: 0.55,
  },
  actionBtnTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  actionBtnSub: {
    fontSize: 9,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.85)',
  },
});
