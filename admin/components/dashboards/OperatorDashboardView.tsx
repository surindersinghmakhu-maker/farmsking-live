import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { useAuth } from '@/src/store/auth-context';
import { useFulfillmentQueue } from '@/src/hooks/useOrders';
import { useCrops } from '@/src/store/crops-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

const theme = RoleThemes.OPERATOR;

export const OperatorDashboardView: React.FC = () => {
  const { colors: tConfig, isDark } = useExecutiveTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { data: queue } = useFulfillmentQueue();
  const { gpsUnlockRequests = [], acceptGpsUnlockRequest, declineGpsUnlockRequest } = useCrops();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'DECLINED' | 'ALL'>('PENDING');
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [targetRejectId, setTargetRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const confirmed = (queue ?? []).filter((o) => o.status === 'CONFIRMED').length;
  const packing = (queue ?? []).filter((o) => o.status === 'PACKING').length;
  const packed = (queue ?? []).filter((o) => o.status === 'PACKED').length;

  const pendingRequests = gpsUnlockRequests.filter((r) => r.status === 'PENDING');
  const approvedRequests = gpsUnlockRequests.filter((r) => r.status === 'APPROVED');
  const declinedRequests = gpsUnlockRequests.filter((r) => r.status === 'DECLINED');

  const filteredRequests =
    activeTab === 'ALL'
      ? gpsUnlockRequests
      : activeTab === 'APPROVED'
      ? approvedRequests
      : activeTab === 'DECLINED'
      ? declinedRequests
      : pendingRequests;

  const handleApprove = (id: string, cropName: string, farmerName: string) => {
    acceptGpsUnlockRequest(id, 'Approved by Operator');
    Alert.alert(
      'Field Unlocked ✅',
      `Satellite field unlocked for ${farmerName} (${cropName}). The farmer can now adjust GPS boundaries.`
    );
  };

  const openRejectDialog = (id: string) => {
    setTargetRejectId(id);
    setRejectReason('');
    setRejectModalVisible(true);
  };

  const handleConfirmReject = () => {
    if (!targetRejectId) return;
    const remark = rejectReason.trim() || 'Declined by Operator (boundaries already calibrated)';
    declineGpsUnlockRequest(targetRejectId, remark);
    setRejectModalVisible(false);
    setTargetRejectId(null);
    setRejectReason('');
    Alert.alert('Request Declined ❌', 'Unlock request has been rejected.');
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: tConfig.bg }]} showsVerticalScrollIndicator={false}>
      <RoleHeader currentRole="OPERATOR" profileName={user?.name || 'Operator'} subtitle="Fulfillment & Satellite Field Operations" />

      <View style={styles.content}>
        {/* STATS OVERVIEW */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Text style={[styles.statValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{confirmed}</Text>
            <Text style={styles.statLabel}>Ready to Pack</Text>
          </View>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Text style={[styles.statValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{packing}</Text>
            <Text style={styles.statLabel}>Packing</Text>
          </View>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <Text style={[styles.statValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{packed}</Text>
            <Text style={styles.statLabel}>Ready to Dispatch</Text>
          </View>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.15)' : '#fffbeb', borderColor: '#fde68a', borderWidth: 1 }]}>
            <Text style={[styles.statValue, { color: '#b45309' }]}>{pendingRequests.length}</Text>
            <Text style={[styles.statLabel, { color: '#b45309', fontWeight: '700' }]}>GPS Unlocks</Text>
          </View>
        </View>

        {/* FULFILLMENT QUEUE ACTION BUTTON */}
        <TouchableOpacity
          style={[styles.queueBtn, premiumShadow(theme.primary, 'md')]}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/operator-orders' as never)}
        >
          <Ionicons name="cube" size={20} color="#ffffff" />
          <Text style={styles.queueBtnText}>Open Fulfillment Queue</Text>
          <Ionicons name="chevron-forward" size={18} color="#ffffff" />
        </TouchableOpacity>

        {/* SATELLITE FIELD UNLOCK REQUESTS CONSOLE */}
        <View style={[styles.sectionCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.sectionIconCircle, { backgroundColor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#eff6ff' }]}>
                <Ionicons name="planet" size={18} color="#2563eb" />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  Satellite Field Unlock Requests
                </Text>
                <Text style={styles.sectionSubtitle}>
                  Review farmer unlock requests, check reasons, and accept or reject
                </Text>
              </View>
            </View>

            {pendingRequests.length > 0 ? (
              <View style={styles.badgePending}>
                <Text style={styles.badgePendingText}>{pendingRequests.length} Pending</Text>
              </View>
            ) : null}
          </View>

          {/* FILTER TABS */}
          <View style={[styles.tabBar, { backgroundColor: isDark ? '#0f172a' : '#f1f5f9' }]}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'PENDING' && styles.tabItemActive]}
              onPress={() => setActiveTab('PENDING')}
            >
              <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
                Pending ({pendingRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'APPROVED' && styles.tabItemActive]}
              onPress={() => setActiveTab('APPROVED')}
            >
              <Text style={[styles.tabText, activeTab === 'APPROVED' && styles.tabTextActive]}>
                Approved ({approvedRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'DECLINED' && styles.tabItemActive]}
              onPress={() => setActiveTab('DECLINED')}
            >
              <Text style={[styles.tabText, activeTab === 'DECLINED' && styles.tabTextActive]}>
                Rejected ({declinedRequests.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'ALL' && styles.tabItemActive]}
              onPress={() => setActiveTab('ALL')}
            >
              <Text style={[styles.tabText, activeTab === 'ALL' && styles.tabTextActive]}>
                All ({gpsUnlockRequests.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* REQUESTS LIST */}
          <View style={{ gap: 12, marginTop: 4 }}>
            {filteredRequests.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="checkmark-circle-outline" size={36} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No Requests in this Tab</Text>
                <Text style={styles.emptySub}>
                  {activeTab === 'PENDING'
                    ? 'All farmer field unlock requests have been reviewed.'
                    : `No ${activeTab.toLowerCase()} requests recorded.`}
                </Text>
              </View>
            ) : (
              filteredRequests.map((req) => {
                const isPending = req.status === 'PENDING';
                const isApproved = req.status === 'APPROVED';

                return (
                  <View
                    key={req.id}
                    style={[
                      styles.requestCard,
                      {
                        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                        borderColor: isPending
                          ? isDark ? 'rgba(245, 158, 11, 0.4)' : '#fde68a'
                          : isApproved
                          ? isDark ? 'rgba(34, 197, 94, 0.3)' : '#bbf7d0'
                          : isDark ? 'rgba(239, 68, 68, 0.3)' : '#fecaca',
                      },
                    ]}
                  >
                    {/* TOP META ROW */}
                    <View style={styles.requestTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: isPending
                                ? '#fef3c7'
                                : isApproved
                                ? '#dcfce7'
                                : '#fee2e2',
                            },
                          ]}
                        >
                          <Ionicons
                            name={isPending ? 'hourglass-outline' : isApproved ? 'checkmark-circle' : 'close-circle'}
                            size={12}
                            color={isPending ? '#b45309' : isApproved ? '#15803d' : '#dc2626'}
                          />
                          <Text
                            style={[
                              styles.statusPillText,
                              {
                                color: isPending ? '#b45309' : isApproved ? '#15803d' : '#dc2626',
                              },
                            ]}
                          >
                            {isPending ? 'PENDING OPERATOR' : isApproved ? 'APPROVED & UNLOCKED' : 'REJECTED'}
                          </Text>
                        </View>

                        <Text style={styles.timeText}>
                          {req.requestedAt ? new Date(req.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </Text>
                      </View>

                      <Text style={styles.reqIdText}>ID: {req.id}</Text>
                    </View>

                    {/* FARMER & CROP INFO */}
                    <View style={styles.cropDetailsBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.farmerName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                          👨‍🌾 {req.farmerName}
                        </Text>
                        <Text style={styles.farmerPhone}>📞 {req.farmerPhone}</Text>
                      </View>

                      <Text style={[styles.cropName, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                        🌾 {req.cropName} · <Text style={{ fontFamily: FONT.medium }}>Plot: {req.plotName}</Text>
                      </Text>

                      <Text style={styles.locationText} numberOfLines={1}>
                        🛰️ {req.location}
                      </Text>
                    </View>

                    {/* FARMER'S REASON BOX */}
                    <View style={[styles.reasonBox, { backgroundColor: isDark ? 'rgba(217, 119, 6, 0.12)' : '#fffbeb' }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                        <Ionicons name="chatbubble-ellipses-outline" size={13} color="#b45309" />
                        <Text style={styles.reasonLabel}>Farmer's Reason for Unlock:</Text>
                      </View>
                      <Text style={[styles.reasonValue, { color: isDark ? '#fed7aa' : '#78350f' }]}>
                        "{req.comment || 'Need to re-map boundary coordinates.'}"
                      </Text>
                    </View>

                    {/* OPERATOR REMARK IF ALREADY REVIEWED */}
                    {!isPending && req.operatorRemark ? (
                      <View style={styles.reviewedRemarkBox}>
                        <Text style={styles.reviewedRemarkText}>
                          Operator Note: {req.operatorRemark}
                          {req.reviewedAt ? ` (${new Date(req.reviewedAt).toLocaleDateString()})` : ''}
                        </Text>
                      </View>
                    ) : null}

                    {/* OPERATOR ACTION BUTTONS (FOR PENDING) */}
                    {isPending ? (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          activeOpacity={0.85}
                          onPress={() => handleApprove(req.id, req.cropName, req.farmerName)}
                        >
                          <Ionicons name="checkmark-circle" size={15} color="#ffffff" />
                          <Text style={styles.approveBtnText}>Accept & Unlock Field</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.rejectBtn}
                          activeOpacity={0.85}
                          onPress={() => openRejectDialog(req.id)}
                        >
                          <Ionicons name="close-circle-outline" size={15} color="#dc2626" />
                          <Text style={styles.rejectBtnText}>Reject</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>

      {/* REJECT OPERATOR REMARK MODAL */}
      <Modal visible={rejectModalVisible} transparent animationType="fade" onRequestClose={() => setRejectModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? '#1e293b' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.modalIconWrap, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="close" size={18} color="#dc2626" />
                </View>
                <View>
                  <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Reject Unlock Request</Text>
                  <Text style={styles.modalSub}>Optionally specify reason for rejection</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setRejectModalVisible(false)}>
                <Ionicons name="close-circle" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.modalInput,
                {
                  backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                  borderColor: isDark ? '#334155' : '#cbd5e1',
                  color: isDark ? '#f8fafc' : '#0f172a',
                },
              ]}
              placeholder="e.g. Field boundary already validated with satellite imagery..."
              placeholderTextColor="#94a3b8"
              multiline
              value={rejectReason}
              onChangeText={setRejectReason}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[styles.modalCancelBtn, { backgroundColor: isDark ? '#334155' : '#f1f5f9' }]}
                onPress={() => setRejectModalVisible(false)}
              >
                <Text style={[styles.modalCancelText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmRejectBtn}
                activeOpacity={0.85}
                onPress={handleConfirmReject}
              >
                <Ionicons name="close-circle" size={14} color="#ffffff" />
                <Text style={styles.modalConfirmRejectText}>Confirm Rejection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  statValue: { fontSize: 22, fontFamily: FONT.extraBold },
  statLabel: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 3 },
  queueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 14,
    paddingHorizontal: SPACING.lg,
  },
  queueBtnText: { flex: 1, color: '#ffffff', fontSize: 14, fontFamily: FONT.bold },

  sectionCard: {
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  sectionSubtitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  badgePending: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  badgePendingText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#b45309',
  },

  tabBar: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#64748b',
  },
  tabTextActive: {
    fontFamily: FONT.bold,
    color: '#0f172a',
  },

  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  emptySub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },

  requestCard: {
    borderRadius: 12,
    borderWidth: 1.2,
    padding: SPACING.md,
    gap: 10,
  },
  requestTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  timeText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  reqIdText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },

  cropDetailsBox: {
    gap: 3,
  },
  farmerName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  farmerPhone: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  cropName: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    marginTop: 2,
  },
  locationText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#0284c7',
    marginTop: 1,
  },

  reasonBox: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  reasonLabel: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  reasonValue: {
    fontSize: 12,
    fontFamily: FONT.medium,
    lineHeight: 16,
  },

  reviewedRemarkBox: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 6,
  },
  reviewedRemarkText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
  },

  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  approveBtn: {
    flex: 1.6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingVertical: 9,
    borderRadius: 8,
  },
  approveBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  rejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#dc2626',
    paddingVertical: 9,
    borderRadius: 8,
  },
  rejectBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#dc2626',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    gap: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  modalSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  modalInput: {
    borderWidth: 1.2,
    borderRadius: 10,
    padding: 12,
    fontSize: 12.5,
    height: 80,
    textAlignVertical: 'top',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
  },
  modalConfirmRejectBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#dc2626',
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalConfirmRejectText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
