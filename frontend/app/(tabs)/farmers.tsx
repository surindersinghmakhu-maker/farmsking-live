import React, { useState } from 'react';
// Updated Farmers & Active Crop Farms Screen with full details modal
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useRole } from '@/src/store/role-context';

export interface ActiveFarmCropDetail {
  id: string;
  farmerName: string;
  farmerPhone: string;
  location: string;
  plotName: string;
  cropName: string;
  categoryName: string;
  areaSize: string;
  irrigationSource: string;
  sowingDate: string;
  cropStage: 'HARVESTING' | 'GROWTH' | 'SOWING';
  previousSalePrice: string;
  unit: string;
  healthStatus: 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
  pestScore: string;
  advisoryNote: string;
  categoryBg: string;
  categoryColor: string;
}

const ACTIVE_CROP_FARMS: ActiveFarmCropDetail[] = [
  {
    id: 'f1',
    farmerName: 'Balwinder Singh',
    farmerPhone: '+91 98765 43210',
    location: 'Bathinda, Punjab',
    plotName: 'Flower Garden - Plot A',
    cropName: 'Rose (गुलाब)',
    categoryName: 'Flowers & Floriculture',
    areaSize: '2.0 Killa (Acre)',
    irrigationSource: 'Drip Irrigation (ड्रिप)',
    sowingDate: '15 Nov 2025',
    cropStage: 'HARVESTING',
    previousSalePrice: '40',
    unit: 'Bunch',
    healthStatus: 'HEALTHY',
    pestScore: '98% Excellent',
    advisoryNote: 'Optimal soil moisture. Ready for morning harvesting cycle.',
    categoryBg: '#ffe4e6',
    categoryColor: '#e11d48',
  },
  {
    id: 'f2',
    farmerName: 'Kartar Singh',
    farmerPhone: '+91 98123 55678',
    location: 'Barnala, Punjab',
    plotName: 'North Field - Plot 1',
    cropName: 'Wheat (गेहूँ)',
    categoryName: 'Cereals & Grains',
    areaSize: '5.0 Killa (Acre)',
    irrigationSource: 'Canal (नहर)',
    sowingDate: '10 Nov 2025',
    cropStage: 'HARVESTING',
    previousSalePrice: '2275',
    unit: 'Quintal',
    healthStatus: 'HEALTHY',
    pestScore: '95% Healthy',
    advisoryNote: 'Grain filling complete. Schedule seasonal harvest combine machine.',
    categoryBg: '#f0fdf4',
    categoryColor: '#15803d',
  },
  {
    id: 'f3',
    farmerName: 'Harjeet Singh',
    farmerPhone: '+91 97800 12345',
    location: 'Moga, Punjab',
    plotName: 'Polyhouse 2',
    cropName: 'Tomato (टमाटर)',
    categoryName: 'Vegetables',
    areaSize: '1.5 Killa (Acre)',
    irrigationSource: 'Tube Well / Borewell',
    sowingDate: '01 Oct 2025',
    cropStage: 'GROWTH',
    previousSalePrice: '-',
    unit: 'KG',
    healthStatus: 'ATTENTION',
    pestScore: '82% Moderate',
    advisoryNote: 'Minor aphid activity detected. Recommended bio-pesticide spray within 48h.',
    categoryBg: '#ecfdf5',
    categoryColor: '#047857',
  },
  {
    id: 'f4',
    farmerName: 'Gurpreet Singh',
    farmerPhone: '+91 99144 88776',
    location: 'Mansha, Punjab',
    plotName: 'Orchard Plot 3',
    cropName: 'Kinnow / Orange (किन्नू)',
    categoryName: 'Fruits & Orchards',
    areaSize: '3.0 Killa (Acre)',
    irrigationSource: 'Sprinkler System',
    sowingDate: '15 Aug 2024',
    cropStage: 'GROWTH',
    previousSalePrice: '45',
    unit: 'KG',
    healthStatus: 'HEALTHY',
    pestScore: '92% Healthy',
    advisoryNote: 'Apply micronutrient zinc sulfate spray for fruit sizing.',
    categoryBg: '#fff7ed',
    categoryColor: '#c2410c',
  },
];

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function FarmersScreen() {
  const { role } = useRole();
  const isGardenAdvisor = role === 'GARDEN_ADVISOR';
  const theme = RoleThemes[isGardenAdvisor ? 'GARDEN_ADVISOR' : 'FARM_ADVISOR'];
  const noun = isGardenAdvisor ? 'Gardeners' : 'Farmers';

  // Selected Farm Detail Modal state
  const [selectedFarm, setSelectedFarm] = useState<ActiveFarmCropDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openFarmDetails = (farm: ActiveFarmCropDetail) => {
    tap();
    setSelectedFarm(farm);
    setIsModalOpen(true);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>My {noun} & Active Crop Farms</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{isGardenAdvisor ? 18 : 25}</Text>
            <Text style={styles.statLabel}>Total {noun}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{isGardenAdvisor ? 29 : 42}</Text>
            <Text style={styles.statLabel}>{isGardenAdvisor ? 'Total Gardens' : 'Active Crop Plots'}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{isGardenAdvisor ? 5 : 8}</Text>
            <Text style={styles.statLabel}>Pending Reviews</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionHeaderTitle}>Assigned Crop Plots (Tap card for full details)</Text>

        {ACTIVE_CROP_FARMS.map((farm) => {
          const isHealthy = farm.healthStatus === 'HEALTHY';
          const isAttention = farm.healthStatus === 'ATTENTION';

          return (
            <TouchableOpacity
              key={farm.id}
              style={[styles.card, premiumShadow('#0f172a', 'sm')]}
              activeOpacity={0.8}
              onPress={() => openFarmDetails(farm)}
            >
              <View style={[styles.avatar, { backgroundColor: farm.categoryBg }]}>
                <Ionicons name="leaf" size={20} color={farm.categoryColor} />
              </View>

              <View style={styles.info}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.plotTitle}>📍 {farm.plotName}</Text>
                  <View style={[styles.cropBadge, { backgroundColor: farm.categoryBg }]}>
                    <Text style={[styles.cropBadgeText, { color: farm.categoryColor }]}>
                      🌾 {farm.cropName}
                    </Text>
                  </View>
                </View>

                <Text style={styles.farmerSub}>
                  👨‍🌾 {farm.farmerName} · {farm.location}
                </Text>

                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>📏 {farm.areaSize}</Text>
                  <Text style={styles.metaText}>💧 {farm.irrigationSource}</Text>
                </View>
              </View>

              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <View
                  style={[
                    styles.healthBadge,
                    isHealthy
                      ? { backgroundColor: '#dcfce7' }
                      : isAttention
                      ? { backgroundColor: '#fef3c7' }
                      : { backgroundColor: '#fee2e2' },
                  ]}
                >
                  <Text
                    style={[
                      styles.healthBadgeText,
                      isHealthy
                        ? { color: '#15803d' }
                        : isAttention
                        ? { color: '#b45309' }
                        : { color: '#dc2626' },
                    ]}
                  >
                    {farm.healthStatus}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* COMPREHENSIVE FARM & CROP DETAILS MODAL */}
      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.farmDetailsModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📍 {selectedFarm?.plotName}</Text>
                <Text style={styles.modalSub}>Full Farm & Crop Details</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {selectedFarm ? (
              <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
                {/* Crop Banner */}
                <View style={[styles.cropBanner, { backgroundColor: selectedFarm.categoryBg }]}>
                  <Ionicons name="leaf" size={28} color={selectedFarm.categoryColor} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cropBannerTitle, { color: selectedFarm.categoryColor }]}>
                      {selectedFarm.cropName}
                    </Text>
                    <Text style={styles.cropBannerSub}>
                      Category: {selectedFarm.categoryName}
                    </Text>
                  </View>
                  <View style={styles.stageBadgeHeader}>
                    <Text style={styles.stageBadgeHeaderText}>
                      {selectedFarm.cropStage === 'HARVESTING'
                        ? '🌾 Harvesting Ready'
                        : selectedFarm.cropStage === 'GROWTH'
                        ? '🌿 Vegetative Growth'
                        : '🌱 Sowing Stage'}
                    </Text>
                  </View>
                </View>

                {/* Farmer Info Card */}
                <View style={styles.detailSectionCard}>
                  <Text style={styles.detailSectionTitle}>👨‍🌾 Farmer & Location</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Farmer Name:</Text>
                    <Text style={styles.detailVal}>{selectedFarm.farmerName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone Contact:</Text>
                    <Text style={[styles.detailVal, { color: '#0284c7' }]}>{selectedFarm.farmerPhone}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Mandi / State:</Text>
                    <Text style={styles.detailVal}>📍 {selectedFarm.location}</Text>
                  </View>
                </View>

                {/* Land & Irrigation Specifications */}
                <View style={styles.detailSectionCard}>
                  <Text style={styles.detailSectionTitle}>📏 Land Area & Irrigation Specs</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plot Name:</Text>
                    <Text style={styles.detailVal}>{selectedFarm.plotName}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Land Area:</Text>
                    <Text style={styles.detailVal}>📏 {selectedFarm.areaSize}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Water Source:</Text>
                    <Text style={styles.detailVal}>💧 {selectedFarm.irrigationSource}</Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Sowing Date:</Text>
                    <Text style={styles.detailVal}>📅 {selectedFarm.sowingDate}</Text>
                  </View>
                </View>

                {/* Rates & Crop Health */}
                <View style={styles.detailSectionCard}>
                  <Text style={styles.detailSectionTitle}>🏷️ Market Rates & Health Index</Text>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Previous Sale Price:</Text>
                    <Text style={[styles.detailVal, { color: '#16a34a', fontFamily: FONT.extraBold }]}>
                      {selectedFarm.previousSalePrice && selectedFarm.previousSalePrice !== '-'
                        ? `₹${selectedFarm.previousSalePrice} / ${selectedFarm.unit}`
                        : '-'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Crop Health Status:</Text>
                    <Text
                      style={[
                        styles.detailVal,
                        {
                          color:
                            selectedFarm.healthStatus === 'HEALTHY'
                              ? '#16a34a'
                              : selectedFarm.healthStatus === 'ATTENTION'
                              ? '#d97706'
                              : '#dc2626',
                          fontFamily: FONT.bold,
                        },
                      ]}
                    >
                      {selectedFarm.healthStatus} ({selectedFarm.pestScore})
                    </Text>
                  </View>
                </View>

                {/* Agronomist Advisory Note */}
                <View style={styles.advisoryCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Ionicons name="bulb" size={16} color="#d97706" />
                    <Text style={styles.advisoryTitle}>Agronomist Advisory & Action Note</Text>
                  </View>
                  <Text style={styles.advisoryText}>{selectedFarm.advisoryNote}</Text>
                </View>

                <TouchableOpacity
                  style={[styles.closeModalBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                  onPress={() => setIsModalOpen(false)}
                >
                  <Text style={styles.closeModalBtnText}>Close Details</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f7f9f8' },
  hero: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2, marginBottom: 14 },
  statsRow: { flexDirection: 'row', gap: 20 },
  statItem: {},
  statValue: { color: '#fff', fontSize: 18, fontFamily: FONT.extraBold },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 11.5, fontFamily: FONT.medium, marginTop: 2 },
  list: { padding: SPACING.lg, gap: 10 },
  sectionHeaderTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  plotTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  cropBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: RADIUS.xs },
  cropBadgeText: { fontSize: 10.5, fontFamily: FONT.bold },
  farmerSub: { fontSize: 12, color: '#475569', fontFamily: FONT.medium, marginTop: 3 },
  metaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  metaText: { fontSize: 11, color: '#64748b', fontFamily: FONT.medium },
  healthBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.xs },
  healthBadgeText: { fontSize: 10, fontFamily: FONT.bold },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  farmDetailsModalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 32,
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  modalSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 12,
  },
  cropBannerTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  cropBannerSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
  },
  stageBadgeHeader: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
  },
  stageBadgeHeaderText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  detailSectionCard: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: RADIUS.lg,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  detailSectionTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  detailVal: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  advisoryCard: {
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  advisoryTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  advisoryText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#92400e',
    lineHeight: 17,
  },
  closeModalBtn: {
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  closeModalBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 14,
  },
});
