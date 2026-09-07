import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerDetail, useAcceptAssignment, useRejectAssignment } from '@/src/hooks/useAdvisorAssignments';
import { resolveMediaUrl } from '@/src/api/client';

const theme = RoleThemes.FARM_ADVISOR;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const AVATAR_PALETTE = ['#16a34a', '#0d9488', '#2563eb', '#9333ea', '#c2410c', '#be123c'];

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function CompactAvatar({ name, photoUrl, size = 44 }: { name: string; photoUrl?: string | null; size?: number }) {
  if (photoUrl) {
    return (
      <View style={{ width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
        <Image
          source={{ uri: resolveMediaUrl(photoUrl) }}
          style={{ width: '100%', height: '100%', borderRadius: size / 2 }}
          resizeMode="cover"
        />
      </View>
    );
  }
  const bg = colorForName(name || '?');
  return (
    <View style={[styles.avatarBox, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

interface FarmerProfileModalProps {
  visible: boolean;
  farmerId: string | null;
  assignmentId?: string | null;
  onClose: () => void;
}

export function FarmerProfileModal({ visible, farmerId, assignmentId, onClose }: FarmerProfileModalProps) {
  const { data: detail, isLoading, isError } = useFarmerDetail(visible && farmerId ? farmerId : undefined);
  const acceptAssignment = useAcceptAssignment();
  const rejectAssignment = useRejectAssignment();

  const farmer = detail?.farmer;
  const assignment = detail?.assignment;
  const isPendingAssignment = assignmentId || assignment?.status === 'PENDING';
  const targetAssignmentId = assignmentId || assignment?.id;

  const locationText = [farmer?.village, farmer?.district, farmer?.state].filter(Boolean).join(', ');

  // Filter and format ONLY ACTIVE crops for the compact table
  const activeCrops = useMemo(() => {
    if (!farmer) return [];
    const crops: {
      id: string;
      cropNo: string;
      subcategory: string;
      variety: string;
      area: string;
      status: string;
    }[] = [];

    let cropCounter = 1;
    (farmer?.farms ?? []).forEach((farm) => {
      (farm.plots ?? []).forEach((plot) => {
        (plot.cropCycles ?? []).forEach((cycle) => {
          const isCompleted =
            cycle.stage === 'COMPLETED' ||
            (cycle as any).status === 'COMPLETED' ||
            (cycle as any).status === 'DEACTIVE' ||
            (cycle as any).status === 'FAILED';

          // 1. EXCLUDE non-active / completed / deactivated crops
          if (isCompleted) return;

          // 2. ONLY SHOW CROPS ACCEPTED BY ADVISOR
          const isAcceptedByAdvisor = (cycle as any).advisorReviewStatus === 'ACCEPTED';
          if (!isAcceptedByAdvisor) return;

          const cropNo = cycle.cropId || `CR-${cropCounter.toString().padStart(3, '0')}`;
          cropCounter++;

          const areaText = cycle.area
            ? `${cycle.area} ${plot.areaUnit ?? 'Acre'}`
            : `${plot.area} ${plot.areaUnit ?? 'Acre'}`;

          crops.push({
            id: cycle.id,
            cropNo,
            subcategory: cycle.cropName,
            variety: cycle.variety ?? '—',
            area: areaText,
            status: 'Active',
          });
        });
      });
    });
    return crops;
  }, [farmer]);

  const handleAccept = () => {
    if (!targetAssignmentId) return;
    tap();
    acceptAssignment.mutate(targetAssignmentId, {
      onSuccess: () => onClose(),
    });
  };

  const handleReject = () => {
    if (!targetAssignmentId) return;
    tap();
    rejectAssignment.mutate(
      { id: targetAssignmentId },
      {
        onSuccess: () => onClose(),
      },
    );
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>👨‍🌾 Farmer Profile</Text>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Ionicons name="close" size={18} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="small" color={theme.primary} />
              <Text style={styles.loadingText}>Loading profile...</Text>
            </View>
          ) : isError || !farmer ? (
            <View style={styles.centerLoading}>
              <Ionicons name="alert-circle-outline" size={32} color="#ef4444" />
              <Text style={styles.errorText}>Could not load farmer profile details.</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {/* Compact Summary Header */}
              <View style={styles.summaryCard}>
                <CompactAvatar name={farmer.name} photoUrl={farmer.photoUrl} size={44} />
                <View style={styles.summaryInfo}>
                  <Text style={styles.farmerName}>{farmer.name}</Text>
                  <View style={styles.metaRow}>
                    {farmer.kingId ? <Text style={styles.kingIdText}>🔑 {farmer.kingId}</Text> : null}
                    {farmer.mobile ? (
                      <TouchableOpacity
                        style={styles.callPill}
                        activeOpacity={0.8}
                        onPress={() => {
                          tap();
                          Linking.openURL(`tel:${farmer.mobile}`);
                        }}
                      >
                        <Ionicons name="call" size={10} color="#ffffff" />
                        <Text style={styles.callPillText}>{farmer.mobile}</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Action Buttons (Accept / Reject) if PENDING */}
              {isPendingAssignment && targetAssignmentId ? (
                <View style={styles.pendingActionBox}>
                  <Text style={styles.pendingActionTitle}>🔔 Hire Request Pending</Text>
                  <View style={styles.pendingBtnRow}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      activeOpacity={0.85}
                      disabled={acceptAssignment.isPending}
                      onPress={handleAccept}
                    >
                      {acceptAssignment.isPending ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                          <Text style={styles.acceptBtnText}>Accept</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      activeOpacity={0.85}
                      disabled={rejectAssignment.isPending}
                      onPress={handleReject}
                    >
                      {rejectAssignment.isPending ? (
                        <ActivityIndicator color="#ef4444" size="small" />
                      ) : (
                        <>
                          <Ionicons name="close-circle-outline" size={14} color="#ef4444" />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : null}

              {/* Compact Info List */}
              <View style={styles.infoList}>
                {locationText ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="location-outline" size={14} color="#64748b" />
                    <Text style={styles.infoLabel}>Location:</Text>
                    <Text style={styles.infoVal} numberOfLines={1}>{locationText}</Text>
                  </View>
                ) : null}

                <View style={styles.infoRow}>
                  <Ionicons name="leaf-outline" size={14} color="#64748b" />
                  <Text style={styles.infoLabel}>Soil / Water:</Text>
                  <Text style={styles.infoVal} numberOfLines={1}>
                    {farmer.soilType || '—'} · {farmer.waterType ? farmer.waterType.replace('_', ' ') : '—'}
                  </Text>
                </View>

                {farmer.sprayTankSizeL ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="funnel-outline" size={14} color="#64748b" />
                    <Text style={styles.infoLabel}>Spray Tank:</Text>
                    <Text style={styles.infoVal}>{farmer.sprayTankSizeL} Liters</Text>
                  </View>
                ) : null}

                {farmer.farmerPlan ? (
                  <View style={styles.infoRow}>
                    <Ionicons name="ribbon-outline" size={14} color="#64748b" />
                    <Text style={styles.infoLabel}>Plan:</Text>
                    <Text style={[styles.infoVal, { color: theme.primary, fontFamily: FONT.bold }]}>
                      {farmer.farmerPlan.plan}
                      {farmer.farmerPlan.endDate
                        ? ` (Exp: ${new Date(farmer.farmerPlan.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })})`
                        : ''}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Active Crops Table View */}
              <View style={styles.tableCard}>
                <Text style={styles.tableCardHeader}>🌾 Active Crops ({activeCrops.length})</Text>
                {activeCrops.length === 0 ? (
                  <Text style={styles.noCropsText}>No active crops registered for this farmer.</Text>
                ) : (
                  <View style={styles.tableContainer}>
                    {/* Table Header */}
                    <View style={styles.tableHeaderRow}>
                      <Text style={[styles.tableTh, { flex: 1.2 }]}>Crop No.</Text>
                      <Text style={[styles.tableTh, { flex: 1.5 }]}>Subcategory</Text>
                      <Text style={[styles.tableTh, { flex: 1.3 }]}>Variety</Text>
                      <Text style={[styles.tableTh, { flex: 1.1 }]}>Area</Text>
                      <Text style={[styles.tableTh, { flex: 1 }]}>Status</Text>
                    </View>

                    {/* Table Rows */}
                    {activeCrops.map((c) => (
                      <View key={c.id} style={styles.tableTr}>
                        <Text style={[styles.cropNoText, { flex: 1.2 }]} numberOfLines={1}>{c.cropNo}</Text>
                        <Text style={[styles.tableTd, { flex: 1.5, fontFamily: FONT.bold, color: '#0f172a' }]} numberOfLines={1}>{c.subcategory}</Text>
                        <Text style={[styles.tableTd, { flex: 1.3 }]} numberOfLines={1}>{c.variety}</Text>
                        <Text style={[styles.tableTd, { flex: 1.1 }]} numberOfLines={1}>{c.area}</Text>
                        <View style={{ flex: 1, alignItems: 'flex-start' }}>
                          <View style={styles.activeStatusBadge}>
                            <View style={styles.greenDot} />
                            <Text style={styles.activeStatusText}>Active</Text>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '90%',
    ...premiumShadow('#000000', 'md'),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLoading: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  errorText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#ef4444',
    textAlign: 'center',
  },
  scrollContent: {
    gap: 10,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  avatarBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  summaryInfo: {
    flex: 1,
    gap: 2,
  },
  farmerName: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginTop: 1,
  },
  kingIdText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: theme.primary,
  },
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  callPillText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  pendingActionBox: {
    backgroundColor: '#eff6ff',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#bfdbfe',
    gap: 6,
  },
  pendingActionTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#1e40af',
  },
  pendingBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  rejectBtnText: {
    color: '#ef4444',
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  infoList: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 7,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  infoVal: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    flex: 1,
  },
  tableCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  tableCardHeader: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  noCropsText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  tableContainer: {
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  tableTh: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  tableTr: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  cropNoText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  cropNameSub: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  tableTd: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#1e293b',
  },
  activeStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  greenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#16a34a',
  },
  activeStatusText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
});
