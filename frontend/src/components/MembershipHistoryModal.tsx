import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerPlanHistory, PLAN_META } from '@/src/hooks/useFarmerPlan';
import { FarmerPlanType } from '@/src/api/farmerPlans.api';

interface MembershipHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  farmerId?: string;
}

export const MembershipHistoryModal: React.FC<MembershipHistoryModalProps> = ({
  visible,
  onClose,
  farmerId,
}) => {
  const { data, isLoading } = useFarmerPlanHistory(farmerId);

  const activeRecord = data?.activeRecord;
  const sleepRecords = data?.sleepRecords ?? [];
  const pastRecords = data?.pastRecords ?? [];
  const allHistory = data?.allHistory ?? [];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, premiumShadow('#000000', 'lg')]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerIconCircle}>
              <Ionicons name="time" size={24} color="#0284c7" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>📜 Membership & Care Plan History</Text>
              <Text style={styles.subtitle}>
                Track Active, Sleep Mode (Paused), and Past Memberships
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#0284c7" style={{ marginVertical: 32 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 4 }}>
              {/* 1. SLEEP MODE PLANS (PAUSED) */}
              {sleepRecords.length > 0 ? (
                <View style={styles.sleepSection}>
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="moon" size={18} color="#d97706" />
                    <Text style={styles.sleepSectionTitle}>
                      🌙 SLEEP MODE MEMBERSHIPS ({sleepRecords.length})
                    </Text>
                  </View>
                  <Text style={styles.sleepSectionDesc}>
                    These plans are safely paused while your higher-tier plan is active. They will automatically wake up & resume when your current plan ends.
                  </Text>

                  {sleepRecords.map((rec) => {
                    const meta = PLAN_META[rec.plan as FarmerPlanType] || { label: rec.plan, emoji: '🌾', color: '#d97706' };
                    return (
                      <View key={rec.id} style={styles.sleepCard}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Text style={{ fontSize: 20 }}>{meta.emoji}</Text>
                            <View>
                              <Text style={[styles.planTitle, { color: '#92400e' }]}>{meta.label}</Text>
                              <Text style={styles.planDates}>
                                Saved: {rec.remainingDays ?? rec.daysGranted} Remaining Days
                              </Text>
                            </View>
                          </View>
                          <View style={styles.sleepBadge}>
                            <Text style={styles.sleepBadgeText}>🌙 SLEEP MODE</Text>
                          </View>
                        </View>
                        {rec.notes ? <Text style={styles.recNotes}>{rec.notes}</Text> : null}
                      </View>
                    );
                  })}
                </View>
              ) : null}

              {/* 2. ACTIVE MEMBERSHIP */}
              <View style={styles.activeSection}>
                <Text style={styles.sectionTitle}>🟢 CURRENT ACTIVE MEMBERSHIP</Text>
                {activeRecord ? (
                  <View style={styles.activeCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ fontSize: 22 }}>
                          {PLAN_META[activeRecord.plan as FarmerPlanType]?.emoji || '⚡'}
                        </Text>
                        <View>
                          <Text style={styles.activePlanTitle}>
                            {PLAN_META[activeRecord.plan as FarmerPlanType]?.label || activeRecord.plan}
                          </Text>
                          <Text style={styles.planDates}>
                            Granted: {activeRecord.daysGranted} Days · Expiry: {activeRecord.endDate ? new Date(activeRecord.endDate).toLocaleDateString('en-IN') : 'N/A'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.activeBadge}>
                        <Text style={styles.activeBadgeText}>ACTIVE</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No paid membership currently active (Free Tier)</Text>
                  </View>
                )}
              </View>

              {/* 3. FULL HISTORY LOG */}
              <View style={styles.historySection}>
                <Text style={styles.sectionTitle}>📜 ALL MEMBERSHIP RECORDS ({allHistory.length})</Text>
                {allHistory.length === 0 ? (
                  <Text style={styles.emptyText}>No membership history records found.</Text>
                ) : (
                  allHistory.map((rec) => {
                    const meta = PLAN_META[rec.plan as FarmerPlanType] || { label: rec.plan, emoji: '🌾', color: '#0284c7' };
                    const isSleep = rec.status === 'SLEEP';
                    const isActive = rec.status === 'ACTIVE';

                    return (
                      <View key={rec.id} style={styles.historyRow}>
                        <View style={[styles.statusIconCircle, { backgroundColor: isSleep ? '#fef3c7' : isActive ? '#dcfce7' : '#f1f5f9' }]}>
                          <Ionicons
                            name={isSleep ? 'moon' : isActive ? 'checkmark-circle' : 'checkmark-done'}
                            size={18}
                            color={isSleep ? '#d97706' : isActive ? '#16a34a' : '#64748b'}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={styles.historyPlanName}>{meta.emoji} {meta.label}</Text>
                            <View
                              style={[
                                styles.statusChip,
                                {
                                  backgroundColor: isSleep ? '#fef3c7' : isActive ? '#dcfce7' : '#f1f5f9',
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.statusChipText,
                                  { color: isSleep ? '#d97706' : isActive ? '#16a34a' : '#64748b' },
                                ]}
                              >
                                {rec.status}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.historySubText}>
                            {rec.daysGranted} Days Granted {rec.remainingDays ? `(${rec.remainingDays} Days Saved in Sleep)` : ''} · {new Date(rec.createdAt).toLocaleDateString('en-IN')}
                          </Text>
                          {rec.notes ? <Text style={styles.historyNoteText}>💬 {rec.notes}</Text> : null}
                          {rec.coupon ? <Text style={styles.couponTagText}>🎟️ Code: {rec.coupon.code}</Text> : null}
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </ScrollView>
          )}
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
    maxWidth: 460,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    maxHeight: '85%',
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
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#e0f2fe',
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
    marginTop: 1,
  },
  sleepSection: {
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sleepSectionTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  sleepSectionDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#b45309',
    lineHeight: 15,
  },
  sleepCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
    gap: 4,
  },
  planTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  planDates: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  sleepBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  sleepBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#d97706',
  },
  recNotes: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#d97706',
    marginTop: 2,
  },
  activeSection: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  activeCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  activePlanTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0284c7',
  },
  activeBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  activeBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  emptyBox: {
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },
  historySection: {
    gap: 8,
    marginTop: 6,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyPlanName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  statusChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  statusChipText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  historySubText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  historyNoteText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 2,
  },
  couponTagText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
    marginTop: 2,
  },
});
