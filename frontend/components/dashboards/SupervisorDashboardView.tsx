import React, { useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { RoleHeader } from './RoleHeader';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useExecutiveTheme } from '@/src/store/theme-context';
import {
  getSupervisorRequests,
  respondToSupervisorRequest,
  getActiveSupervisorAssignment,
  resignSupervisor,
} from '@/src/api/users.api';
import { SupervisorFeaturesConfig, SupervisorRequest } from '@/src/types/api';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const SupervisorDashboardView: React.FC = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, refreshUser } = useAuth();
  const { colors } = useExecutiveTheme();

  // Queries
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['my-supervisor-requests'],
    queryFn: getSupervisorRequests,
  });

  const {
    data: assignmentData,
    isLoading: isLoadingAssignment,
    refetch: refetchAssignment,
  } = useQuery({
    queryKey: ['active-supervisor-assignment'],
    queryFn: getActiveSupervisorAssignment,
  });

  // Mutations
  const respondMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'ACCEPT' | 'REJECT' }) =>
      respondToSupervisorRequest(requestId, action),
    onSuccess: async (res) => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['my-supervisor-requests'] });
      queryClient.invalidateQueries({ queryKey: ['active-supervisor-assignment'] });
      if (Platform.OS === 'web') alert('✅ ' + res.message);
      else Alert.alert('Request Updated', res.message);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to process appointment request.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    },
  });

  const resignMutation = useMutation({
    mutationFn: () => resignSupervisor(user?.id || ''),
    onSuccess: async () => {
      await refreshUser();
      queryClient.invalidateQueries({ queryKey: ['active-supervisor-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['my-supervisor-requests'] });
      if (Platform.OS === 'web') alert('✅ You have resigned from this farm employer.');
      else Alert.alert('Resigned', 'You have resigned from this farm employer.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to resign.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    },
  });

  const incomingRequests: SupervisorRequest[] = requestsData?.incoming ?? [];
  const isAssigned = assignmentData?.isAssigned || Boolean(user?.employerFarmerId);
  const employer = assignmentData?.employerFarmer || user?.employerFarmer;
  const featuresConfig: SupervisorFeaturesConfig =
    assignmentData?.featuresConfig || user?.supervisorFeaturesConfig || {};

  const handleResign = () => {
    tap();
    const action = () => resignMutation.mutate();
    if (Platform.OS === 'web') {
      if (confirm('Are you sure you want to resign as supervisor for this farmer? You will no longer have access to their farm.')) {
        action();
      }
    } else {
      Alert.alert(
        'Resign from Farm',
        'Are you sure you want to resign as supervisor for this farmer? You will no longer have access to their farm.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Resign Now', style: 'destructive', onPress: action },
        ],
      );
    }
  };

  const hasAnyFeature =
    featuresConfig.sales?.view ||
    featuresConfig.sales?.entry ||
    featuresConfig.labour?.view ||
    featuresConfig.labour?.entry ||
    featuresConfig.spray?.view ||
    featuresConfig.spray?.entry ||
    featuresConfig.purchases?.view ||
    featuresConfig.purchases?.entry ||
    featuresConfig.crops?.view ||
    featuresConfig.crops?.entry ||
    featuresConfig.advisory?.view ||
    featuresConfig.advisory?.entry;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="SUPERVISOR"
        profileName={user?.name || 'Supervisor'}
        subtitle={isAssigned ? `Farm Supervisor for ${employer?.name || 'Farmer'}` : 'Farm Operations Supervisor'}
        avatarUrl={user?.photoUrl || undefined}
        secondaryName={employer?.name || 'FarmsKing'}
        onAvatarPress={() => router.push('/profile' as never)}
      />

      <View style={styles.content}>
        {/* ================= SECTION 1: INCOMING APPOINTMENT INVITATIONS ================= */}
        {incomingRequests.length > 0 && (
          <View style={styles.invitationSection}>
            <View style={styles.invitationSectionHeader}>
              <View style={styles.bellPulseDot} />
              <Text style={styles.invitationSectionTitle}>
                🔔 Pending Farm Supervisor Invitation ({incomingRequests.length})
              </Text>
            </View>

            {incomingRequests.map((req) => {
              const cfg = req.featuresConfig || {};
              return (
                <View key={req.id} style={styles.invitationCard}>
                  <View style={styles.invitationTopRow}>
                    <View style={styles.invitationFarmerAvatar}>
                      <Ionicons name="leaf" size={20} color="#15803d" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.invitationFarmerName}>{req.farmerName || 'Farmer'}</Text>
                      <Text style={styles.invitationFarmerSub}>
                        👑 King ID: <Text style={{ fontFamily: FONT.bold }}>{req.farmerKingId || 'N/A'}</Text> • 📱 {req.farmerMobile || ''}
                      </Text>
                      {req.farmerFarmName && (
                        <Text style={styles.invitationFarmMeta}>
                          🏡 Farm: {req.farmerFarmName} {req.farmerVillage ? `(${req.farmerVillage})` : ''}
                        </Text>
                      )}
                    </View>
                  </View>

                  {req.note && (
                    <View style={styles.invitationNoteBox}>
                      <Text style={styles.invitationNoteText}>💬 "{req.note}"</Text>
                    </View>
                  )}

                  {/* Allowed Features Breakdown */}
                  <View style={styles.invitationFeaturesWrap}>
                    <Text style={styles.invitationFeaturesTitle}>Permitted Features Delegated by Farmer:</Text>
                    <View style={styles.featureChipsRow}>
                      {cfg.sales?.view && (
                        <View style={styles.featureChip}>
                          <Ionicons name="cash-outline" size={11} color="#15803d" />
                          <Text style={styles.featureChipText}>Sales: {cfg.sales.entry ? 'View+Entry' : 'View Only'}</Text>
                        </View>
                      )}
                      {cfg.labour?.view && (
                        <View style={styles.featureChip}>
                          <Ionicons name="people-outline" size={11} color="#15803d" />
                          <Text style={styles.featureChipText}>Labour: {cfg.labour.entry ? 'View+Entry' : 'View Only'}</Text>
                        </View>
                      )}
                      {cfg.spray?.view && (
                        <View style={styles.featureChip}>
                          <Ionicons name="water-outline" size={11} color="#15803d" />
                          <Text style={styles.featureChipText}>Sprays: {cfg.spray.entry ? 'View+Entry' : 'View Only'}</Text>
                        </View>
                      )}
                      {cfg.purchases?.view && (
                        <View style={styles.featureChip}>
                          <Ionicons name="cart-outline" size={11} color="#15803d" />
                          <Text style={styles.featureChipText}>Expenses: {cfg.purchases.entry ? 'View+Entry' : 'View Only'}</Text>
                        </View>
                      )}
                      {cfg.crops?.view && (
                        <View style={styles.featureChip}>
                          <Ionicons name="leaf-outline" size={11} color="#15803d" />
                          <Text style={styles.featureChipText}>Crops: {cfg.crops.entry ? 'View+Entry' : 'View Only'}</Text>
                        </View>
                      )}
                      {cfg.advisory?.view && (
                        <View style={styles.featureChip}>
                          <Ionicons name="medical-outline" size={11} color="#15803d" />
                          <Text style={styles.featureChipText}>Doctor: {cfg.advisory.entry ? 'View+Entry' : 'View Only'}</Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Accept & Reject Action Buttons */}
                  <View style={styles.invitationActionRow}>
                    <TouchableOpacity
                      style={styles.acceptBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        tap();
                        respondMutation.mutate({ requestId: req.id, action: 'ACCEPT' });
                      }}
                      disabled={respondMutation.isPending}
                    >
                      {respondMutation.isPending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                          <Text style={styles.acceptBtnText}>Accept Appointment</Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.declineBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        tap();
                        respondMutation.mutate({ requestId: req.id, action: 'REJECT' });
                      }}
                      disabled={respondMutation.isPending}
                    >
                      <Ionicons name="close-circle" size={16} color="#dc2626" />
                      <Text style={styles.declineBtnText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* ================= SECTION 2: ACTIVE EMPLOYER FARMER CARD ================= */}
        {isAssigned && employer ? (
          <View style={[styles.employerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.employerHeader}>
              <View style={styles.employerIconBg}>
                <Ionicons name="business" size={22} color="#15803d" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.employerName, { color: colors.text }]}>Farmer: {employer.name}</Text>
                  <View style={styles.activeTag}>
                    <Text style={styles.activeTagText}>ASSIGNED</Text>
                  </View>
                </View>
                <Text style={[styles.employerMeta, { color: colors.textMuted }]}>
                  👑 King ID: <Text style={{ fontFamily: FONT.bold, color: '#15803d' }}>{employer.kingId || 'N/A'}</Text> • 📱 {employer.mobile}
                </Text>
                {employer.farmName && (
                  <Text style={[styles.employerFarmMeta, { color: colors.textMuted }]}>
                    🏡 Farm: {employer.farmName} {employer.village ? `• 📍 ${employer.village}` : ''}
                  </Text>
                )}
              </View>

              <TouchableOpacity style={styles.resignBtn} activeOpacity={0.8} onPress={handleResign}>
                <Ionicons name="log-out-outline" size={14} color="#dc2626" />
                <Text style={styles.resignBtnText}>Resign</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : !incomingRequests.length ? (
          /* Empty / Unassigned Candidate Card */
          <View style={[styles.unassignedCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
            <View style={styles.unassignedIconWrap}>
              <Ionicons name="shield-outline" size={36} color="#15803d" />
            </View>
            <Text style={[styles.unassignedTitle, { color: colors.text }]}>Farm Supervisor Mode Active</Text>
            <Text style={[styles.unassignedSub, { color: colors.textMuted }]}>
              You are currently not appointed to any farmer's account. Share your FarmsKing ID with your farmer so they can appoint you:
            </Text>
            <View style={styles.myKingIdBadge}>
              <Ionicons name="copy-outline" size={16} color="#15803d" />
              <Text style={styles.myKingIdText}>King ID: {user?.kingId || 'N/A'}</Text>
            </View>
            <Text style={styles.unassignedFootnote}>
              Once a farmer enters your King ID, you will receive an instant invitation here with options to Accept or Decline. Zero Admin approval needed.
            </Text>
          </View>
        ) : null}

        {/* ================= SECTION 3: DELEGATED FEATURE TILES ================= */}
        {isAssigned && (
          <View style={{ gap: 12 }}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeading, { color: colors.text }]}>🚜 Permitted Farm Operations</Text>
              <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
                Only features allowed by the farmer are accessible. Non-permitted features remain hidden.
              </Text>
            </View>

            {/* 1. Mandi Sales & Crop Bills */}
            {(featuresConfig.sales?.view || featuresConfig.sales?.entry) && (
              <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.featureCardTop}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="cash" size={20} color="#15803d" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>🌾 Mandi Sales & Crop Bills</Text>
                    <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                      Record crop sales, generate mandi bills, and view party balances for this farm.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureActionRow}>
                  <TouchableOpacity
                    style={styles.viewRecordsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'SALES' } });
                    }}
                  >
                    <Ionicons name="eye-outline" size={14} color="#15803d" />
                    <Text style={styles.viewRecordsBtnText}>View Sales Bills</Text>
                  </TouchableOpacity>

                  {featuresConfig.sales?.entry && (
                    <TouchableOpacity
                      style={styles.addEntryBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'NEW_SALE', t: Date.now() } });
                      }}
                    >
                      <Ionicons name="add-circle" size={14} color="#ffffff" />
                      <Text style={styles.addEntryBtnText}>+ Add Sale Entry</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 2. Labour & Worker Daily Attendance */}
            {(featuresConfig.labour?.view || featuresConfig.labour?.entry) && (
              <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.featureCardTop}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#ffedd5' }]}>
                    <Ionicons name="people" size={20} color="#ea580c" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>👷 Labour & Daily Wages</Text>
                    <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                      Mark daily worker attendance, record task wages, and track labour balances.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureActionRow}>
                  <TouchableOpacity
                    style={styles.viewRecordsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'LABOUR' } });
                    }}
                  >
                    <Ionicons name="eye-outline" size={14} color="#15803d" />
                    <Text style={styles.viewRecordsBtnText}>View Labour Log</Text>
                  </TouchableOpacity>

                  {featuresConfig.labour?.entry && (
                    <TouchableOpacity
                      style={styles.addEntryBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'LABOUR', t: Date.now() } });
                      }}
                    >
                      <Ionicons name="add-circle" size={14} color="#ffffff" />
                      <Text style={styles.addEntryBtnText}>+ Record Labour</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 3. Sprays & Chemical Activities */}
            {(featuresConfig.spray?.view || featuresConfig.spray?.entry) && (
              <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.featureCardTop}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#e0f2fe' }]}>
                    <Ionicons name="water" size={20} color="#0284c7" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>🚜 Sprays & Field Activities</Text>
                    <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                      View doctor spray schedules, log spray operations, and track chemical dosages.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureActionRow}>
                  <TouchableOpacity
                    style={styles.viewRecordsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      router.push('/(user)/(tabs)/farm' as any);
                    }}
                  >
                    <Ionicons name="eye-outline" size={14} color="#15803d" />
                    <Text style={styles.viewRecordsBtnText}>View Spray Tasks</Text>
                  </TouchableOpacity>

                  {featuresConfig.spray?.entry && (
                    <TouchableOpacity
                      style={styles.addEntryBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        router.push('/(user)/(tabs)/farm' as any);
                      }}
                    >
                      <Ionicons name="add-circle" size={14} color="#ffffff" />
                      <Text style={styles.addEntryBtnText}>+ Log Spray Activity</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 4. Purchases & Farm Expenses */}
            {(featuresConfig.purchases?.view || featuresConfig.purchases?.entry) && (
              <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.featureCardTop}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="cart" size={20} color="#dc2626" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>💸 Purchases & Farm Expenses</Text>
                    <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                      Record fertilizer, seed, diesel, equipment rent, and field expenditures.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureActionRow}>
                  <TouchableOpacity
                    style={styles.viewRecordsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'EXPENSES' } });
                    }}
                  >
                    <Ionicons name="eye-outline" size={14} color="#15803d" />
                    <Text style={styles.viewRecordsBtnText}>View Expenses</Text>
                  </TouchableOpacity>

                  {featuresConfig.purchases?.entry && (
                    <TouchableOpacity
                      style={styles.addEntryBtn}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'NEW_EXPENSE', t: Date.now() } });
                      }}
                    >
                      <Ionicons name="add-circle" size={14} color="#ffffff" />
                      <Text style={styles.addEntryBtnText}>+ Add Expense</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* 5. Crops & Plot Registrations */}
            {(featuresConfig.crops?.view || featuresConfig.crops?.entry) && (
              <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.featureCardTop}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#fef3c7' }]}>
                    <Ionicons name="leaf" size={20} color="#b45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>🌱 Farm Crops & Fields</Text>
                    <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                      Track active crop stages (Vegetative, Flowering, Harvesting) across registered plots.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureActionRow}>
                  <TouchableOpacity
                    style={styles.viewRecordsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      router.push('/(user)/(tabs)/farm' as any);
                    }}
                  >
                    <Ionicons name="eye-outline" size={14} color="#15803d" />
                    <Text style={styles.viewRecordsBtnText}>View Crops & Fields</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 6. Crop Doctor Advisory & Care */}
            {(featuresConfig.advisory?.view || featuresConfig.advisory?.entry) && (
              <View style={[styles.featureCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={styles.featureCardTop}>
                  <View style={[styles.featureIconCircle, { backgroundColor: '#f3e8ff' }]}>
                    <Ionicons name="medical" size={20} color="#7e22ce" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.featureTitle, { color: colors.text }]}>🩺 Crop Doctor Advisory & Care</Text>
                    <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                      View crop health prescriptions & consult assigned Agricultural Doctors.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureActionRow}>
                  <TouchableOpacity
                    style={styles.viewRecordsBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      router.push('/(user)/(tabs)/farm' as any);
                    }}
                  >
                    <Ionicons name="eye-outline" size={14} color="#15803d" />
                    <Text style={styles.viewRecordsBtnText}>Open Doctor Care</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {!hasAnyFeature && (
              <View style={[styles.noFeaturesCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <Ionicons name="lock-closed" size={32} color="#94a3b8" />
                <Text style={[styles.noFeaturesTitle, { color: colors.text }]}>No Features Enabled Yet</Text>
                <Text style={[styles.noFeaturesSub, { color: colors.textMuted }]}>
                  The farmer has not yet granted any operational permissions to your supervisor account. Please ask the farmer to configure your permissions.
                </Text>
              </View>
            )}

            <View style={styles.securityFooterNotice}>
              <Ionicons name="lock-closed-outline" size={14} color="#64748b" />
              <Text style={styles.securityFooterText}>
                Farmer private wallet balances, bank accounts, and personal settings remain hidden from supervisors.
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: 14, paddingBottom: 40 },
  invitationSection: {
    gap: 8,
  },
  invitationSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bellPulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#dc2626',
  },
  invitationSectionTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#b91c1c',
  },
  invitationCard: {
    backgroundColor: '#fffbeb',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#fde68a',
    padding: 14,
    gap: 10,
    ...premiumShadow('#d97706', 'sm'),
  },
  invitationTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  invitationFarmerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  invitationFarmerName: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  invitationFarmerSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
    marginTop: 1,
  },
  invitationFarmMeta: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#15803d',
    marginTop: 1,
  },
  invitationNoteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: RADIUS.sm,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  invitationNoteText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#78350f',
    fontStyle: 'italic',
  },
  invitationFeaturesWrap: {
    gap: 5,
  },
  invitationFeaturesTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#92400e',
  },
  featureChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  featureChipText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  invitationActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  acceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#15803d',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  acceptBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  declineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  declineBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  employerCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    ...premiumShadow('#15803d', 'sm'),
  },
  employerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  employerIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  employerName: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
  },
  activeTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  activeTagText: {
    color: '#15803d',
    fontSize: 9,
    fontFamily: FONT.extraBold,
  },
  employerMeta: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  employerFarmMeta: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  resignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#fca5a5',
  },
  resignBtnText: {
    color: '#dc2626',
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  unassignedCard: {
    borderRadius: RADIUS.xl,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    gap: 10,
  },
  unassignedIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unassignedTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  unassignedSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 340,
  },
  myKingIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    marginVertical: 4,
  },
  myKingIdText: {
    color: '#15803d',
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
  },
  unassignedFootnote: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 15,
  },
  sectionHeaderRow: {
    gap: 2,
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
  },
  sectionSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  featureCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    gap: 12,
  },
  featureCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  featureDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    lineHeight: 16,
    marginTop: 2,
  },
  featureActionRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  viewRecordsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  viewRecordsBtnText: {
    color: '#15803d',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15803d',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  addEntryBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  noFeaturesCard: {
    borderRadius: RADIUS.lg,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    gap: 8,
  },
  noFeaturesTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  noFeaturesSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    textAlign: 'center',
    lineHeight: 17,
  },
  securityFooterNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  securityFooterText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
});
