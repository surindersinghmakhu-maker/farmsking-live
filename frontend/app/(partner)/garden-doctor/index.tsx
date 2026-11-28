import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useDoctorGardenDashboard } from '@/src/hooks/useGardens';
import { useAcceptAssignment, useRejectAssignment } from '@/src/hooks/useAdvisorAssignments';
import { DoctorBotanicalInspectionModal } from '@/src/components/DoctorBotanicalInspectionModal';
import { resolveMediaUrl } from '@/src/api/client';

const theme = RoleThemes.GARDEN_ADVISOR;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

type DoctorStudioTab = 'QUEUE' | 'PATHOLOGY_FEED' | 'EARNINGS';

export default function GardenDoctorStudioScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useRole();
  const { colors, isLight } = useExecutiveTheme();

  React.useEffect(() => {
    if (role !== 'GARDEN_ADVISOR') {
      router.replace('/(partner)/(tabs)' as any);
    }
  }, [role, router]);

  if (role !== 'GARDEN_ADVISOR') {
    return null;
  }

  const { data: dashboard, isLoading, refetch } = useDoctorGardenDashboard();
  const acceptAssignment = useAcceptAssignment();
  const rejectAssignment = useRejectAssignment();

  const [activeTab, setActiveTab] = useState<DoctorStudioTab>('QUEUE');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [processingAssignId, setProcessingAssignId] = useState<string | null>(null);

  const activePatients = dashboard?.activeAssignments || [];
  const pendingRequests = dashboard?.pendingAssignments || [];
  const recentDiagnoses = dashboard?.recentDiagnoses || [];
  const wallet = dashboard?.wallet || { balance: 0, totalEarnings: 0 };

  const filteredPatients = activePatients.filter((a: any) => {
    const name = a.farmer?.name?.toLowerCase() || '';
    const phone = a.farmer?.mobile || '';
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || phone.includes(query);
  });

  const handleAcceptRequest = async (assignmentId: string) => {
    tap();
    setProcessingAssignId(assignmentId);
    try {
      await acceptAssignment.mutateAsync(assignmentId);
      const msg = 'Gardener hire request accepted. Patient profile added to active care queue!';
      if (Platform.OS === 'web') alert('✅ ' + msg);
      else Alert.alert('Accepted', msg);
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not accept hire request.';
      if (Platform.OS === 'web') alert('❌ ' + msg);
      else Alert.alert('Error', msg);
    } finally {
      setProcessingAssignId(null);
    }
  };

  const handleRejectRequest = async (assignmentId: string) => {
    tap();
    setProcessingAssignId(assignmentId);
    try {
      await rejectAssignment.mutateAsync({ id: assignmentId, reason: 'Doctor schedule currently at capacity.' });
      const msg = 'Hire request rejected.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Declined', msg);
      refetch();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not decline request.';
      if (Platform.OS === 'web') alert('❌ ' + msg);
      else Alert.alert('Error', msg);
    } finally {
      setProcessingAssignId(null);
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: isLight ? '#f8fafc' : '#030712' }]}>
      {/* Top Navigation Bar */}
      <View
        style={[
          styles.topNav,
          {
            backgroundColor: isLight ? '#ffffff' : '#090e17',
            borderBottomColor: isLight ? '#e2e8f0' : 'rgba(168, 85, 247, 0.25)',
          },
        ]}
      >
        <View style={styles.navLeft}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color={isLight ? '#0f172a' : '#ffffff'} />
          </TouchableOpacity>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.pageTitle, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                Garden Doctor Studio
              </Text>
              <View style={styles.isoBadge}>
                <Ionicons name="shield-checkmark" size={11} color="#a855f7" />
                <Text style={styles.isoBadgeText}>ISO 9001 Certified</Text>
              </View>
            </View>
            <Text style={styles.pageSub}>
              Certified Horticultural Pathology, Prescription Center & Urban Plant Health Desk
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          onPress={() => {
            tap();
            refetch();
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={17} color="#a855f7" />
          <Text style={styles.refreshBtnText}>Refresh Data</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pcContainer}>
          {/* Executive Telemetry Strip */}
          <View style={styles.telemetryStrip}>
            {/* Metric 1: Active Patients */}
            <LinearGradient
              colors={['#1a0b2e', '#0f051d']}
              style={[styles.metricCard, premiumShadow('#a855f7', 'sm')]}
            >
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>Active Patients</Text>
                <Ionicons name="people-outline" size={20} color="#a855f7" />
              </View>
              <Text style={styles.metricValue}>{dashboard?.activeGardenersCount ?? 0}</Text>
              <Text style={styles.metricSub}>Urban Gardeners Monitored</Text>
            </LinearGradient>

            {/* Metric 2: Monitored Botanical Pots */}
            <LinearGradient
              colors={['#061a1f', '#030f14']}
              style={[styles.metricCard, premiumShadow('#38bdf8', 'sm')]}
            >
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>Botanical Pots</Text>
                <Ionicons name="leaf-outline" size={20} color="#38bdf8" />
              </View>
              <Text style={[styles.metricValue, { color: '#38bdf8' }]}>
                {dashboard?.monitoredPlantsCount ?? 0}
              </Text>
              <Text style={styles.metricSub}>
                Across {dashboard?.monitoredGardensCount ?? 0} Balconies & Terraces
              </Text>
            </LinearGradient>

            {/* Metric 3: Critical Health Attention */}
            <LinearGradient
              colors={['#1f0b12', '#14050a']}
              style={[styles.metricCard, premiumShadow('#f43f5e', 'sm')]}
            >
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>Critical Foliage</Text>
                <Ionicons name="warning-outline" size={20} color="#f43f5e" />
              </View>
              <Text style={[styles.metricValue, { color: '#f87171' }]}>
                {dashboard?.criticalPlantsCount ?? 0}
              </Text>
              <Text style={styles.metricSub}>Pots Flagged For Treatment</Text>
            </LinearGradient>

            {/* Metric 4: Advisory Consultation Payouts */}
            <LinearGradient
              colors={['#061e12', '#03120a']}
              style={[styles.metricCard, premiumShadow('#4ade80', 'sm')]}
            >
              <View style={styles.metricCardHeader}>
                <Text style={styles.metricLabel}>Doctor Wallet</Text>
                <Ionicons name="wallet-outline" size={20} color="#4ade80" />
              </View>
              <Text style={[styles.metricValue, { color: '#4ade80' }]}>
                ₹{wallet.balance.toLocaleString()}
              </Text>
              <Text style={styles.metricSub}>
                ₹{wallet.totalEarnings.toLocaleString()} Lifetime Earnings
              </Text>
            </LinearGradient>
          </View>

          {/* Pending Hire Requests Alert Banner */}
          {pendingRequests.length > 0 && (
            <View
              style={[
                styles.pendingBanner,
                {
                  backgroundColor: isLight ? '#fdf4ff' : 'rgba(168, 85, 247, 0.08)',
                  borderColor: isLight ? '#f0abfc' : 'rgba(168, 85, 247, 0.35)',
                },
              ]}
            >
              <View style={styles.pendingBannerHeader}>
                <View style={styles.pendingBadge}>
                  <Ionicons name="notifications" size={14} color="#a855f7" />
                  <Text style={styles.pendingBadgeText}>
                    {pendingRequests.length} Pending Gardener Consultation Requests
                  </Text>
                </View>
                <Text style={styles.pendingBannerDesc}>
                  Review client requests seeking your expert plant care and diagnostic guidance.
                </Text>
              </View>

              <View style={styles.pendingList}>
                {pendingRequests.map((req: any) => (
                  <View
                    key={req.id}
                    style={[
                      styles.pendingCard,
                      {
                        backgroundColor: isLight ? '#ffffff' : '#0f172a',
                        borderColor: isLight ? '#e2e8f0' : '#1e293b',
                      },
                    ]}
                  >
                    <View style={styles.pendingCardInfo}>
                      <Text style={[styles.pendingName, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                        {req.farmer?.name || 'Gardener Client'}
                      </Text>
                      <Text style={styles.pendingDetails}>
                        {[req.farmer?.kingId, req.farmer?.village, req.farmer?.state]
                          .filter(Boolean)
                          .join(' • ') || 'Verified Client'}
                      </Text>
                    </View>

                    <View style={styles.pendingActions}>
                      <TouchableOpacity
                        style={[
                          styles.acceptBtn,
                          processingAssignId === req.id && { opacity: 0.5 },
                        ]}
                        onPress={() => handleAcceptRequest(req.id)}
                        disabled={processingAssignId === req.id}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="checkmark-circle-outline" size={16} color="#ffffff" />
                        <Text style={styles.acceptBtnText}>Accept Consultation</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.declineBtn,
                          processingAssignId === req.id && { opacity: 0.5 },
                        ]}
                        onPress={() => handleRejectRequest(req.id)}
                        disabled={processingAssignId === req.id}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Tab Filter Strip */}
          <View
            style={[
              styles.tabSelectorBar,
              {
                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
              },
            ]}
          >
            <View style={styles.tabButtonsRow}>
              {(
                [
                  { key: 'QUEUE', label: '👨‍⚕️ Patient Triage Queue', count: activePatients.length },
                  { key: 'PATHOLOGY_FEED', label: '🔬 Leaf Pathology Feed', count: recentDiagnoses.length },
                  { key: 'EARNINGS', label: '💰 Advisory Payouts & Fees', count: undefined },
                ] as const
              ).map((tab) => (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
                  onPress={() => {
                    tap();
                    setActiveTab(tab.key);
                  }}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      activeTab === tab.key && styles.tabButtonTextActive,
                    ]}
                  >
                    {tab.label}
                    {tab.count !== undefined ? ` (${tab.count})` : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Quick Search */}
            {activeTab === 'QUEUE' && (
              <View
                style={[
                  styles.searchBox,
                  {
                    backgroundColor: isLight ? '#f1f5f9' : '#090e17',
                    borderColor: isLight ? '#cbd5e1' : '#334155',
                  },
                ]}
              >
                <Ionicons name="search" size={16} color="#94a3b8" />
                <TextInput
                  style={[styles.searchInput, { color: isLight ? '#0f172a' : '#ffffff' }]}
                  placeholder="Search patients by name or phone..."
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery ? (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={16} color="#94a3b8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            )}
          </View>

          {/* Loading Indicator */}
          {isLoading ? (
            <View style={styles.centerLoading}>
              <ActivityIndicator size="large" color="#a855f7" />
              <Text style={[styles.loadingLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>
                Syncing Doctor Clinical Console...
              </Text>
            </View>
          ) : (
            <View style={styles.tabContentWrap}>
              {/* TAB 1: PATIENT TRIAGE QUEUE */}
              {activeTab === 'QUEUE' && (
                <View style={styles.queueContainer}>
                  {filteredPatients.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons name="leaf-outline" size={48} color="#64748b" />
                      <Text style={[styles.emptyHeader, { color: isLight ? '#334155' : '#94a3b8' }]}>
                        No Active Gardener Patients
                      </Text>
                      <Text style={styles.emptyDesc}>
                        When gardeners choose you as their Garden Doctor, their botanical health records will be listed here.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.patientGrid}>
                      {filteredPatients.map((assignment: any) => {
                        const gardener = assignment.farmer;
                        const gardenList = gardener?.gardens || [];
                        const plantCount =
                          gardenList.reduce((sum: number, g: any) => sum + (g.plants?.length || 0), 0) +
                          (gardener?.plants?.length || 0);

                        return (
                          <View
                            key={assignment.id}
                            style={[
                              styles.patientCard,
                              {
                                backgroundColor: isLight ? '#ffffff' : '#0f172a',
                                borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                              },
                            ]}
                          >
                            <View style={styles.patientHeader}>
                              {gardener?.photoUrl ? (
                                <Image
                                  source={{ uri: resolveMediaUrl(gardener.photoUrl) }}
                                  style={styles.patientAvatar}
                                />
                              ) : (
                                <View style={styles.avatarPlaceholder}>
                                  <Text style={styles.avatarInitial}>
                                    {gardener?.name ? gardener.name[0].toUpperCase() : 'G'}
                                  </Text>
                                </View>
                              )}

                              <View style={styles.patientMainText}>
                                <Text
                                  style={[
                                    styles.patientName,
                                    { color: isLight ? '#0f172a' : '#ffffff' },
                                  ]}
                                >
                                  {gardener?.name || 'Gardener Patient'}
                                </Text>
                                <Text style={styles.patientLocation}>
                                  {[gardener?.kingId, gardener?.village, gardener?.state]
                                    .filter(Boolean)
                                    .join(' • ') || 'Verified Member'}
                                </Text>
                                <View style={styles.planBadgeRow}>
                                  <View style={styles.planBadgePill}>
                                    <Text style={styles.planBadgePillText}>
                                      {gardener?.gardenerPlan?.plan || 'VIP PASS'}
                                    </Text>
                                  </View>
                                </View>
                              </View>
                            </View>

                            <View
                              style={[
                                styles.patientMetricsRow,
                                {
                                  backgroundColor: isLight ? '#f8fafc' : '#090e17',
                                  borderColor: isLight ? '#e2e8f0' : '#1e293b',
                                },
                              ]}
                            >
                              <View style={styles.patientMetric}>
                                <Text style={styles.patientMetricVal}>{gardenList.length}</Text>
                                <Text style={styles.patientMetricLbl}>Spaces</Text>
                              </View>
                              <View style={styles.patientMetric}>
                                <Text style={[styles.patientMetricVal, { color: '#38bdf8' }]}>
                                  {plantCount}
                                </Text>
                                <Text style={styles.patientMetricLbl}>Pots in Care</Text>
                              </View>
                              <View style={styles.patientMetric}>
                                <Text style={[styles.patientMetricVal, { color: '#4ade80' }]}>Active</Text>
                                <Text style={styles.patientMetricLbl}>Status</Text>
                              </View>
                            </View>

                            <View style={styles.patientActionsRow}>
                              <TouchableOpacity
                                style={styles.inspectBtn}
                                onPress={() => {
                                  tap();
                                  setSelectedPatientId(gardener.id);
                                }}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="medical" size={15} color="#ffffff" />
                                <Text style={styles.inspectBtnText}>Inspect Botanical Health</Text>
                              </TouchableOpacity>

                              {gardener?.mobile ? (
                                <TouchableOpacity
                                  style={styles.callPatientBtn}
                                  onPress={() => Linking.openURL(`tel:${gardener.mobile}`)}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons name="call-outline" size={16} color="#38bdf8" />
                                </TouchableOpacity>
                              ) : null}
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* TAB 2: LEAF PATHOLOGY FEED */}
              {activeTab === 'PATHOLOGY_FEED' && (
                <View style={styles.pathologyFeedWrap}>
                  {recentDiagnoses.length === 0 ? (
                    <View style={styles.emptyCard}>
                      <Ionicons name="scan-outline" size={48} color="#64748b" />
                      <Text style={[styles.emptyHeader, { color: isLight ? '#334155' : '#94a3b8' }]}>
                        No Leaf Scans Logged Yet
                      </Text>
                      <Text style={styles.emptyDesc}>
                        When your assigned gardeners scan foliage using the AI Plant Doctor, their pathology cards will stream into this feed.
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.diagnosesGrid}>
                      {recentDiagnoses.map((diag: any) => (
                        <View
                          key={diag.id}
                          style={[
                            styles.diagFeedCard,
                            {
                              backgroundColor: isLight ? '#ffffff' : '#0f172a',
                              borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)',
                            },
                          ]}
                        >
                          <View style={styles.diagFeedHeader}>
                            {diag.leafPhotoUrl ? (
                              <Image
                                source={{ uri: resolveMediaUrl(diag.leafPhotoUrl) }}
                                style={styles.diagFeedThumb}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={[styles.diagFeedThumb, styles.avatarPlaceholder]}>
                                <Ionicons name="image-outline" size={24} color="#64748b" />
                              </View>
                            )}

                            <View style={styles.diagFeedInfo}>
                              <View style={styles.diagFeedTopRow}>
                                <View style={styles.diagCategoryTag}>
                                  <Text style={styles.diagCategoryTagText}>{diag.category}</Text>
                                </View>
                                <Text style={styles.diagConfidenceText}>{diag.confidence} AI score</Text>
                              </View>

                              <Text
                                style={[
                                  styles.diagFeedIssue,
                                  { color: isLight ? '#0f172a' : '#ffffff' },
                                ]}
                              >
                                {diag.detectedIssue}
                              </Text>

                              <Text style={styles.diagFeedClient}>
                                Patient: {diag.gardener?.name || 'Assigned Client'} • {diag.plant?.name || 'Unbound Pot'}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.diagFeedRemedy,
                              { backgroundColor: isLight ? '#f0fdf4' : 'rgba(74, 222, 128, 0.08)' },
                            ]}
                          >
                            <Text style={styles.remedyHead}>🌿 Organic Remedy:</Text>
                            <Text
                              style={[
                                styles.remedyText,
                                { color: isLight ? '#166534' : '#86efac' },
                              ]}
                              numberOfLines={3}
                            >
                              {diag.organicRemedy}
                            </Text>
                          </View>

                          <TouchableOpacity
                            style={styles.diagOpenPatientBtn}
                            onPress={() => {
                              tap();
                              setSelectedPatientId(diag.gardenerId);
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="create-outline" size={15} color="#a855f7" />
                            <Text style={styles.diagOpenPatientBtnText}>
                              Review Patient & Prescribe Care
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* TAB 3: ADVISORY PAYOUTS & FEES */}
              {activeTab === 'EARNINGS' && (
                <View style={styles.earningsContainer}>
                  <View
                    style={[
                      styles.earningsHeroCard,
                      {
                        backgroundColor: isLight ? '#ffffff' : '#0f172a',
                        borderColor: isLight ? '#e2e8f0' : 'rgba(168, 85, 247, 0.25)',
                      },
                    ]}
                  >
                    <View style={styles.earningsHeroHeader}>
                      <View>
                        <Text style={[styles.earningsHeroTitle, { color: isLight ? '#0f172a' : '#ffffff' }]}>
                          Horticultural Advisory Payouts
                        </Text>
                        <Text style={styles.earningsHeroSub}>
                          Verified doctor earnings from direct consultation fees, seasonal passes, and diagnosis packages.
                        </Text>
                      </View>
                      <View style={styles.payoutBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#4ade80" />
                        <Text style={styles.payoutBadgeText}>Direct Bank Payout Active</Text>
                      </View>
                    </View>

                    <View style={styles.walletMetricsGrid}>
                      <View style={styles.walletMetricBox}>
                        <Text style={styles.walletMetricVal}>₹{wallet.balance.toLocaleString()}</Text>
                        <Text style={styles.walletMetricLbl}>Available Wallet Balance</Text>
                      </View>

                      <View style={styles.walletMetricBox}>
                        <Text style={[styles.walletMetricVal, { color: '#a855f7' }]}>
                          ₹{wallet.totalEarnings.toLocaleString()}
                        </Text>
                        <Text style={styles.walletMetricLbl}>Total Lifetime Payouts</Text>
                      </View>

                      <View style={styles.walletMetricBox}>
                        <Text style={[styles.walletMetricVal, { color: '#38bdf8' }]}>
                          {activePatients.length} Gardeners
                        </Text>
                        <Text style={styles.walletMetricLbl}>Monitored Client Roster</Text>
                      </View>
                    </View>

                    <View style={styles.payoutActionRow}>
                      <TouchableOpacity
                        style={styles.requestPayoutBtn}
                        onPress={() => router.push('/(partner)/(tabs)/wallet' as any)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="card-outline" size={16} color="#ffffff" />
                        <Text style={styles.requestPayoutBtnText}>View Detailed Payout Ledger</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.editProfileBtn}
                        onPress={() => router.push('/advisor-profile' as any)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="settings-outline" size={16} color="#a855f7" />
                        <Text style={styles.editProfileBtnText}>Edit Consultation Fee & Rates</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Patient Botanical Health Inspection Modal */}
      <DoctorBotanicalInspectionModal
        visible={!!selectedPatientId}
        gardenerId={selectedPatientId}
        onClose={() => setSelectedPatientId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
  },
  isoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  isoBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#c084fc',
    textTransform: 'uppercase',
  },
  pageSub: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  refreshBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  pcContainer: {
    width: '100%',
    maxWidth: 1360,
    alignSelf: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  telemetryStrip: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  metricCard: {
    flex: 1,
    minWidth: 240,
    borderRadius: RADIUS.lg,
    padding: 18,
    gap: 6,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 28,
    fontFamily: FONT.extraBold,
    color: '#c084fc',
  },
  metricSub: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  pendingBanner: {
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 12,
  },
  pendingBannerHeader: {
    gap: 4,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pendingBadgeText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
  pendingBannerDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  pendingList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  pendingCard: {
    flex: 1,
    minWidth: 320,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  pendingCardInfo: {
    flex: 1,
  },
  pendingName: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  pendingDetails: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: 8,
  },
  acceptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#a855f7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  acceptBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  declineBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  declineBtnText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#f87171',
  },
  tabSelectorBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  tabButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
  },
  tabButtonText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  tabButtonTextActive: {
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    minWidth: 260,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    padding: 0,
  },
  centerLoading: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingLabel: {
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  tabContentWrap: {
    gap: 16,
  },
  queueContainer: {
    gap: 16,
  },
  emptyCard: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  emptyHeader: {
    fontSize: 17,
    fontFamily: FONT.bold,
  },
  emptyDesc: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 420,
  },
  patientGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  patientCard: {
    width: '49%',
    minWidth: 320,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 14,
  },
  patientHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
  patientMainText: {
    flex: 1,
    justifyContent: 'center',
  },
  patientName: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  patientLocation: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 2,
  },
  planBadgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  planBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(168, 85, 247, 0.12)',
  },
  planBadgePillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#c084fc',
    textTransform: 'uppercase',
  },
  patientMetricsRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingVertical: 8,
  },
  patientMetric: {
    flex: 1,
    alignItems: 'center',
  },
  patientMetricVal: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  patientMetricLbl: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  patientActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  inspectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#a855f7',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  inspectBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  callPatientBtn: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pathologyFeedWrap: {
    gap: 14,
  },
  diagnosesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  diagFeedCard: {
    width: '49%',
    minWidth: 320,
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 12,
  },
  diagFeedHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  diagFeedThumb: {
    width: 64,
    height: 64,
    borderRadius: RADIUS.md,
  },
  diagFeedInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  diagFeedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  diagCategoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  diagCategoryTagText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#f87171',
    textTransform: 'uppercase',
  },
  diagConfidenceText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  diagFeedIssue: {
    fontSize: 14,
    fontFamily: FONT.bold,
    marginTop: 4,
  },
  diagFeedClient: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#38bdf8',
    marginTop: 2,
  },
  diagFeedRemedy: {
    padding: 10,
    borderRadius: RADIUS.md,
    gap: 4,
  },
  remedyHead: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#4ade80',
  },
  remedyText: {
    fontSize: 12,
    fontFamily: FONT.regular,
    lineHeight: 18,
  },
  diagOpenPatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.3)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  diagOpenPatientBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
  earningsContainer: {
    gap: 16,
  },
  earningsHeroCard: {
    padding: 24,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    gap: 20,
  },
  earningsHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  earningsHeroTitle: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
  },
  earningsHeroSub: {
    fontSize: 13,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 4,
    maxWidth: 520,
  },
  payoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(74, 222, 128, 0.12)',
  },
  payoutBadgeText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#4ade80',
  },
  walletMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  walletMetricBox: {
    flex: 1,
    minWidth: 200,
    padding: 16,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 4,
  },
  walletMetricVal: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  walletMetricLbl: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  payoutActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  requestPayoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#a855f7',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  requestPayoutBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.35)',
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  editProfileBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
});
