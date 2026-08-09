import React, { useState } from 'react';
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
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

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

export const AdvisorDashboardView: React.FC = () => {
  const theme = RoleThemes.FARM_ADVISOR;

  // Selected Farm Detail Modal state
  const [selectedFarm, setSelectedFarm] = useState<ActiveFarmCropDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openFarmDetails = (farm: ActiveFarmCropDetail) => {
    tap();
    setSelectedFarm(farm);
    setIsModalOpen(true);
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <RoleHeader
          currentRole="FARM_ADVISOR"
          profileName="Gurpreet Singh"
          subtitle="Senior Farm Advisor & Agronomist"
          avatarUrl="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        />

        <View style={styles.content}>
          {/* Assigned Farmers Card */}
          <LinearGradient colors={theme.heroGradient} style={[styles.assignedCard, premiumShadow(theme.primary, 'md')]}>
            <Ionicons name="school" size={104} color={theme.primary} style={styles.watermark} />
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabelText}>Assigned Farmers</Text>
              <View style={[styles.badgePill, { backgroundColor: theme.primaryLight }]}>
                <Text style={[styles.badgePillText, { color: theme.primary }]}>Active Advisor Portal</Text>
              </View>
            </View>
            <Text style={styles.assignedCount}>25 Farmers</Text>

            <View style={styles.sparklineContainer}>
              <View style={styles.sparklineBarRow}>
                {[20, 30, 40, 35, 55, 75].map((h, index) => (
                  <LinearGradient key={index} colors={[theme.accent, theme.primary]} style={[styles.sparklineBar, { height: h }]} />
                ))}
              </View>
            </View>
          </LinearGradient>

          {/* 3 Metrics Row */}
          <View style={[styles.metricsRow, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.metricItem}>
              <Text style={styles.metricLabel}>Active Farms</Text>
              <Text style={styles.metricValue}>42 Plots</Text>
            </View>
            <View style={[styles.metricItem, styles.metricBorderLeft]}>
              <Text style={styles.metricLabel}>Consultations</Text>
              <Text style={styles.metricValue}>128</Text>
            </View>
            <View style={[styles.metricItem, styles.metricBorderLeft]}>
              <Text style={styles.metricLabel}>Follow-ups</Text>
              <Text style={styles.metricValue}>36</Text>
            </View>
          </View>

          {/* ACTIVE FARMS & CROPS LIST (Tap to view full farm details) */}
          <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Active Crop Farms ({ACTIVE_CROP_FARMS.length})</Text>
                <Text style={styles.sectionSub}>Tap any farm plot card to view full crop & field details</Text>
              </View>
              <View style={styles.liveTag}>
                <View style={styles.greenDot} />
                <Text style={styles.liveTagText}>ACTIVE</Text>
              </View>
            </View>

            {ACTIVE_CROP_FARMS.map((farm) => {
              const isHealthy = farm.healthStatus === 'HEALTHY';
              const isAttention = farm.healthStatus === 'ATTENTION';

              return (
                <TouchableOpacity
                  key={farm.id}
                  style={[styles.farmCardItem, premiumShadow('#000000', 'sm')]}
                  activeOpacity={0.8}
                  onPress={() => openFarmDetails(farm)}
                >
                  <View style={[styles.farmIconBg, { backgroundColor: farm.categoryBg }]}>
                    <Ionicons name="leaf" size={22} color={farm.categoryColor} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <Text style={styles.plotTitle}>📍 {farm.plotName}</Text>
                      <View style={[styles.cropBadge, { backgroundColor: farm.categoryBg }]}>
                        <Text style={[styles.cropBadgeText, { color: farm.categoryColor }]}>
                          🌾 {farm.cropName}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.farmerNameText}>
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
          </View>

          {/* Today's Advisor Tasks */}
          <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Advisory Schedule</Text>
              <TouchableOpacity activeOpacity={0.7}>
                <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
              </TouchableOpacity>
            </View>

            {[
              { title: 'Farm Inspection Visit', client: 'Kartar Singh Farm', time: '10:00 AM', icon: 'navigate-outline', color: theme.primary },
              { title: 'Pest Problem Review', client: 'Harjeet Singh (Polyhouse 2)', time: '11:30 AM', icon: 'search-outline', color: '#3b82f6' },
              { title: 'Nutrient Spray Guidance', client: 'Balwinder Singh Farm', time: '02:00 PM', icon: 'calendar-outline', color: '#166534' },
              { title: 'Harvesting Review Call', client: 'Gurpreet Singh', time: '04:30 PM', icon: 'call-outline', color: '#a855f7', last: true },
            ].map((task, idx) => (
              <View key={idx} style={[styles.taskItem, task.last && { borderBottomWidth: 0 }]}>
                <View style={[styles.taskIconBg, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name={task.icon as any} size={17} color={task.color} />
                </View>
                <View style={styles.taskInfo}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  <Text style={styles.taskSubtitle}>{task.client}</Text>
                </View>
                <Text style={styles.taskTime}>{task.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* COMPREHENSIVE FARM & CROP DETAILS MODAL */}
      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.farmDetailsModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📍 {selectedFarm?.plotName}</Text>
                <Text style={styles.modalSub}>Full Farm & Crop Inspection Details</Text>
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
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  assignedCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, overflow: 'hidden' },
  watermark: { position: 'absolute', top: -12, right: -16, opacity: 0.08 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabelText: { fontSize: 13.5, color: '#64748b', fontFamily: FONT.semiBold },
  badgePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgePillText: { fontSize: 11, fontFamily: FONT.bold },
  assignedCount: { fontSize: 30, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6, letterSpacing: -0.6 },
  sparklineContainer: { marginTop: 18, height: 45, justifyContent: 'flex-end' },
  sparklineBarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 },
  sparklineBar: { width: 22, borderRadius: 7 },
  metricsRow: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  metricItem: { flex: 1, alignItems: 'center' },
  metricBorderLeft: { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' },
  metricLabel: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium },
  metricValue: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 5 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  sectionSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  greenDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16a34a' },
  liveTagText: { fontSize: 10, fontFamily: FONT.bold, color: '#16a34a' },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold },
  farmCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 10,
  },
  farmIconBg: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  cropBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  cropBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  farmerNameText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 3,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  metaText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  healthBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  healthBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  taskIconBg: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  taskInfo: { flex: 1, marginLeft: 12 },
  taskTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  taskSubtitle: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  taskTime: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },

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
