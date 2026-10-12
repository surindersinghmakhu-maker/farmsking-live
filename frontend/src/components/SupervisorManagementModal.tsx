import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import {
  lookupByKingId,
  appointSupervisorRequest,
  getSupervisorRequests,
  updateSupervisorFeatures,
  resignSupervisor,
} from '../api/users.api';
import { SupervisorFeaturesConfig, SupervisorRequest, FeaturePermission } from '../types/api';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface SupervisorUser {
  id: string;
  kingId?: string;
  name: string;
  mobile: string;
  supervisorPermissions?: string[];
  supervisorFeaturesConfig?: SupervisorFeaturesConfig;
  createdAt: string;
}

const DEFAULT_CONFIG: SupervisorFeaturesConfig = {
  sales: { view: true, entry: true },
  labour: { view: true, entry: true },
  spray: { view: true, entry: true },
  purchases: { view: true, entry: true },
  crops: { view: true, entry: false },
  advisory: { view: true, entry: true },
};

const FEATURE_DEFINITIONS: {
  key: keyof SupervisorFeaturesConfig;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  viewLabel: string;
  entryLabel: string;
}[] = [
  {
    key: 'sales',
    title: '🌾 Mandi Sales & Crop Bills',
    subtitle: 'Daily harvest entries, buyer mandi bills & crop sales',
    icon: 'cash-outline',
    viewLabel: 'View Sales',
    entryLabel: 'Add / Edit Sales',
  },
  {
    key: 'labour',
    title: '👷 Labour Daily Logs & Wages',
    subtitle: 'Worker attendance, daily wage tracking & field task payouts',
    icon: 'people-outline',
    viewLabel: 'View Labour',
    entryLabel: 'Add / Edit Labour',
  },
  {
    key: 'spray',
    title: '🚜 Spray & Activity Schedules',
    subtitle: 'Pesticide/fungicide sprays, irrigation & field activities',
    icon: 'water-outline',
    viewLabel: 'View Sprays',
    entryLabel: 'Add / Edit Sprays',
  },
  {
    key: 'purchases',
    title: '💸 Farm Purchases & Expenses',
    subtitle: 'Fertilizer, seed, diesel, machinery rent & farm expenses',
    icon: 'cart-outline',
    viewLabel: 'View Expenses',
    entryLabel: 'Add / Edit Expenses',
  },
  {
    key: 'crops',
    title: '🌱 Crops & Plot Management',
    subtitle: 'Registered farm fields, crop cycles & stage progression',
    icon: 'leaf-outline',
    viewLabel: 'View Crops',
    entryLabel: 'Add / Edit Crops',
  },
  {
    key: 'advisory',
    title: '🩺 Crop Doctor Care & Chat',
    subtitle: 'Report disease symptoms & consult Agri Doctors',
    icon: 'medical-outline',
    viewLabel: 'View Advisory',
    entryLabel: 'Ask Doctor / Submit Care',
  },
];

export function SupervisorManagementModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { colors } = useExecutiveTheme();

  const [activeTab, setActiveTab] = useState<'SEARCH' | 'ACTIVE' | 'PENDING'>('SEARCH');

  // Search by King ID State
  const [searchKingId, setSearchKingId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<any | null>(null);

  // Features Config State for Candidate
  const [featuresConfig, setFeaturesConfig] = useState<SupervisorFeaturesConfig>(DEFAULT_CONFIG);
  const [note, setNote] = useState('');

  // Editing Permissions for Active Supervisor
  const [editingSupervisor, setEditingSupervisor] = useState<SupervisorUser | null>(null);
  const [editConfig, setEditConfig] = useState<SupervisorFeaturesConfig>(DEFAULT_CONFIG);

  // Queries
  const { data: supervisors = [], isLoading: isLoadingSupervisors, refetch: refetchSupervisors } = useQuery({
    queryKey: ['my-supervisors'],
    queryFn: async () => {
      const res = await (await import('../api/client')).apiClient.get<SupervisorUser[]>('/users/my-supervisors');
      return res.data;
    },
    enabled: visible,
  });

  const { data: requestsData, isLoading: isLoadingRequests, refetch: refetchRequests } = useQuery({
    queryKey: ['my-supervisor-requests'],
    queryFn: getSupervisorRequests,
    enabled: visible,
  });

  const outgoingRequests = requestsData?.outgoing ?? [];

  // Mutations
  const appointMutation = useMutation({
    mutationFn: appointSupervisorRequest,
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['my-supervisors'] });
      queryClient.invalidateQueries({ queryKey: ['my-supervisor-requests'] });
      const msg = res.message || 'Appointment request sent successfully!';
      if (Platform.OS === 'web') alert('✅ ' + msg);
      else Alert.alert('Request Sent', msg);
      setCandidate(null);
      setSearchKingId('');
      setNote('');
      setActiveTab('PENDING');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err.message || 'Failed to send appointment request.';
      if (Platform.OS === 'web') alert('❌ ' + msg);
      else Alert.alert('Notice', msg);
    },
  });

  const updateFeaturesMutation = useMutation({
    mutationFn: ({ id, config }: { id: string; config: SupervisorFeaturesConfig }) =>
      updateSupervisorFeatures(id, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supervisors'] });
      setEditingSupervisor(null);
      if (Platform.OS === 'web') alert('✅ Supervisor features updated!');
      else Alert.alert('Updated', 'Supervisor feature permissions updated successfully.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to update permissions.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    },
  });

  const resignMutation = useMutation({
    mutationFn: resignSupervisor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supervisors'] });
      queryClient.invalidateQueries({ queryKey: ['my-supervisor-requests'] });
      if (Platform.OS === 'web') alert('✅ Supervisor has been released from your account.');
      else Alert.alert('Supervisor Released', 'The supervisor has been released from your account.');
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || 'Failed to release supervisor.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    },
  });

  useEffect(() => {
    if (visible) {
      setCandidate(null);
      setSearchError(null);
      setSearchKingId('');
      setFeaturesConfig(DEFAULT_CONFIG);
      setEditingSupervisor(null);
    }
  }, [visible]);

  const handleSearch = async () => {
    const q = searchKingId.trim();
    if (!q) {
      setSearchError('Please enter candidate King ID or Mobile Number.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setCandidate(null);

    try {
      const result = await lookupByKingId(q);
      setCandidate(result);
      setFeaturesConfig(DEFAULT_CONFIG);
    } catch (err: any) {
      setSearchError(err?.response?.data?.message || 'No user found with that King ID or Mobile number.');
    } finally {
      setIsSearching(false);
    }
  };

  const togglePermission = (
    mode: 'CANDIDATE' | 'EDIT',
    featureKey: keyof SupervisorFeaturesConfig,
    permType: 'view' | 'entry',
  ) => {
    tap();
    const updater = mode === 'CANDIDATE' ? setFeaturesConfig : setEditConfig;
    updater((prev) => {
      const current = prev[featureKey] || { view: false, entry: false };
      const nextVal = !current[permType];
      // If entry is enabled, view should automatically be enabled
      const newView = permType === 'entry' && nextVal ? true : permType === 'view' ? nextVal : current.view;
      // If view is disabled, entry must also be disabled
      const newEntry = permType === 'view' && !nextVal ? false : permType === 'entry' ? nextVal : current.entry;

      return {
        ...prev,
        [featureKey]: { view: newView, entry: newEntry },
      };
    });
  };

  const handleSendAppointment = () => {
    if (!candidate) return;
    tap();
    appointMutation.mutate({
      supervisorKingId: candidate.kingId || candidate.mobile,
      featuresConfig,
      note: note.trim() || undefined,
    });
  };

  const handleConfirmResign = (supervisor: SupervisorUser) => {
    tap();
    const action = () => resignMutation.mutate(supervisor.id);
    if (Platform.OS === 'web') {
      if (confirm(`Are you sure you want to release ${supervisor.name} from supervisor duties?`)) {
        action();
      }
    } else {
      Alert.alert(
        'Release Supervisor',
        `Are you sure you want to release ${supervisor.name} from supervisor duties? They will no longer have access to your farm.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Release Now', style: 'destructive', onPress: action },
        ],
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.dialog, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          {/* Header */}
          <LinearGradient colors={['#14532d', '#15803d', '#16a34a']} style={styles.headerGradient}>
            <View style={styles.headerRow}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  <Ionicons name="shield-checkmark" size={20} color="#ffffff" />
                </View>
                <View>
                  <Text style={styles.headerTitle}>Appoint Farm Supervisor</Text>
                  <Text style={styles.headerSub}>Peer-to-Peer Delegation via King ID • 0% Admin Delay</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'SEARCH' && styles.tabBtnActive]}
                onPress={() => { tap(); setActiveTab('SEARCH'); }}
              >
                <Ionicons name="search" size={13} color={activeTab === 'SEARCH' ? '#14532d' : '#ffffff'} />
                <Text style={[styles.tabText, activeTab === 'SEARCH' && styles.tabTextActive]}>
                  Appoint Candidate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'ACTIVE' && styles.tabBtnActive]}
                onPress={() => { tap(); setActiveTab('ACTIVE'); refetchSupervisors(); }}
              >
                <Ionicons name="people" size={13} color={activeTab === 'ACTIVE' ? '#14532d' : '#ffffff'} />
                <Text style={[styles.tabText, activeTab === 'ACTIVE' && styles.tabTextActive]}>
                  Active ({supervisors.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'PENDING' && styles.tabBtnActive]}
                onPress={() => { tap(); setActiveTab('PENDING'); refetchRequests(); }}
              >
                <Ionicons name="time" size={13} color={activeTab === 'PENDING' ? '#14532d' : '#ffffff'} />
                <Text style={[styles.tabText, activeTab === 'PENDING' && styles.tabTextActive]}>
                  Pending ({outgoingRequests.filter((r) => r.status === 'PENDING').length})
                </Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Body Content */}
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            {/* ================= TAB 1: SEARCH & APPOINT ================= */}
            {activeTab === 'SEARCH' && (
              <View style={styles.tabContent}>
                {/* Search Card */}
                <View style={[styles.boxCard, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                  <Text style={[styles.boxTitle, { color: colors.text }]}>🔍 Search Supervisor by King ID</Text>
                  <Text style={[styles.boxSub, { color: colors.textMuted }]}>
                    Enter the candidate's FarmsKing ID (or registered 10-digit mobile number) to delegate farm entries.
                  </Text>

                  <View style={styles.searchRow}>
                    <View style={[styles.searchInputWrapper, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                      <Ionicons name="person-circle-outline" size={20} color="#15803d" style={{ marginRight: 6 }} />
                      <TextInput
                        style={[styles.searchInput, { color: colors.text }]}
                        placeholder="e.g. FK-100234 or 9876543210"
                        placeholderTextColor="#94a3b8"
                        value={searchKingId}
                        onChangeText={(t) => {
                          setSearchKingId(t);
                          setSearchError(null);
                        }}
                        autoCapitalize="characters"
                        onSubmitEditing={handleSearch}
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.searchBtn}
                      activeOpacity={0.85}
                      onPress={handleSearch}
                      disabled={isSearching}
                    >
                      {isSearching ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="search" size={15} color="#ffffff" />
                          <Text style={styles.searchBtnText}>Search</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {searchError && (
                    <View style={styles.errorAlert}>
                      <Ionicons name="alert-circle" size={16} color="#dc2626" />
                      <Text style={styles.errorAlertText}>{searchError}</Text>
                    </View>
                  )}
                </View>

                {/* Candidate Found Profile Card */}
                {candidate && (
                  <View style={[styles.candidateCard, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
                    <View style={styles.candidateHeader}>
                      <View style={styles.candidateAvatar}>
                        <Text style={styles.candidateAvatarText}>
                          {(candidate.name || 'S').slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.candidateName}>{candidate.name}</Text>
                          <View style={styles.verifiedTag}>
                            <Ionicons name="checkmark-circle" size={12} color="#15803d" />
                            <Text style={styles.verifiedTagText}>Verified</Text>
                          </View>
                        </View>
                        <Text style={styles.candidateKingId}>
                          👑 King ID: <Text style={{ fontFamily: FONT.extraBold }}>{candidate.kingId || 'N/A'}</Text>
                        </Text>
                        <Text style={styles.candidateMobile}>
                          📱 Mobile: {candidate.mobile} {candidate.village ? `• 📍 ${candidate.village}` : ''}
                        </Text>
                      </View>
                    </View>

                    {candidate.currentEmployerName ? (
                      <View style={styles.conflictBox}>
                        <Ionicons name="warning" size={18} color="#b45309" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.conflictTitle}>Currently Employed</Text>
                          <Text style={styles.conflictText}>
                            This supervisor is currently working under {candidate.currentEmployerName}. A supervisor cannot work for 2 farmers simultaneously.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.availableBox}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={styles.availableText}>Available to Appoint as Farm Supervisor</Text>
                      </View>
                    )}

                    {/* Permissions Matrix Header */}
                    {!candidate.currentEmployerName && (
                      <View style={{ marginTop: 12 }}>
                        <View style={styles.permMatrixHeader}>
                          <Text style={styles.permMatrixTitle}>📋 Select Allowed Features (View & Entry)</Text>
                          <Text style={styles.permMatrixSub}>
                            Supervisor will ONLY have access to checked features. All other features remain hidden.
                          </Text>
                        </View>

                        {/* Dual Checkbox List */}
                        <View style={styles.permList}>
                          {FEATURE_DEFINITIONS.map((def) => {
                            const current = featuresConfig[def.key] || { view: false, entry: false };
                            return (
                              <View key={def.key} style={styles.permItemCard}>
                                <View style={styles.permItemLeft}>
                                  <View style={styles.permIconBg}>
                                    <Ionicons name={def.icon} size={16} color="#15803d" />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.permItemTitle}>{def.title}</Text>
                                    <Text style={styles.permItemSub}>{def.subtitle}</Text>
                                  </View>
                                </View>

                                {/* Checkbox Buttons: View & Entry */}
                                <View style={styles.checkboxRow}>
                                  {/* View Checkbox */}
                                  <TouchableOpacity
                                    style={[styles.checkboxPill, current.view && styles.checkboxPillActive]}
                                    activeOpacity={0.8}
                                    onPress={() => togglePermission('CANDIDATE', def.key, 'view')}
                                  >
                                    <Ionicons
                                      name={current.view ? 'checkbox' : 'square-outline'}
                                      size={15}
                                      color={current.view ? '#15803d' : '#64748b'}
                                    />
                                    <Text style={[styles.checkboxPillText, current.view && styles.checkboxPillTextActive]}>
                                      {def.viewLabel}
                                    </Text>
                                  </TouchableOpacity>

                                  {/* Entry Checkbox */}
                                  <TouchableOpacity
                                    style={[styles.checkboxPill, current.entry && styles.checkboxPillActiveGreen]}
                                    activeOpacity={0.8}
                                    onPress={() => togglePermission('CANDIDATE', def.key, 'entry')}
                                  >
                                    <Ionicons
                                      name={current.entry ? 'checkbox' : 'square-outline'}
                                      size={15}
                                      color={current.entry ? '#15803d' : '#64748b'}
                                    />
                                    <Text style={[styles.checkboxPillText, current.entry && styles.checkboxPillTextActiveGreen]}>
                                      {def.entryLabel}
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            );
                          })}
                        </View>

                        {/* Optional Invitation Note */}
                        <View style={styles.noteBox}>
                          <Text style={styles.noteLabel}>📝 Optional Note for Candidate:</Text>
                          <TextInput
                            style={styles.noteInput}
                            placeholder="e.g. Please manage the upcoming paddy harvest and daily labour records"
                            placeholderTextColor="#94a3b8"
                            value={note}
                            onChangeText={setNote}
                          />
                        </View>

                        {/* Send Appointment Button */}
                        <TouchableOpacity
                          style={styles.appointActionBtn}
                          activeOpacity={0.85}
                          onPress={handleSendAppointment}
                          disabled={appointMutation.isPending}
                        >
                          {appointMutation.isPending ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <>
                              <Ionicons name="paper-plane" size={17} color="#ffffff" />
                              <Text style={styles.appointActionBtnText}>
                                Appoint & Send Invitation Directly
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>

                        <Text style={styles.adminFreeNotice}>
                          🔒 Zero Admin Approvals: The supervisor receives the request directly and becomes active once accepted.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            )}

            {/* ================= TAB 2: ACTIVE SUPERVISORS ================= */}
            {activeTab === 'ACTIVE' && (
              <View style={styles.tabContent}>
                {isLoadingSupervisors ? (
                  <View style={styles.centerBox}>
                    <ActivityIndicator size="small" color="#15803d" />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Loading active supervisors...</Text>
                  </View>
                ) : supervisors.length === 0 ? (
                  <View style={styles.centerBox}>
                    <Ionicons name="people-outline" size={40} color="#94a3b8" />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Supervisors</Text>
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                      You haven't appointed any supervisors yet. Use the "Appoint Candidate" tab to add one using their King ID.
                    </Text>
                    <TouchableOpacity
                      style={styles.actionBtnSmall}
                      onPress={() => { tap(); setActiveTab('SEARCH'); }}
                    >
                      <Ionicons name="search" size={14} color="#ffffff" />
                      <Text style={styles.actionBtnSmallText}>Search by King ID</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ gap: 12 }}>
                    {supervisors.map((s) => {
                      const cfg = s.supervisorFeaturesConfig || {};
                      return (
                        <View key={s.id} style={[styles.supervisorCard, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                          <View style={styles.supervisorCardHeader}>
                            <View style={styles.supervisorAvatar}>
                              <Text style={styles.supervisorAvatarText}>{(s.name || 'S').slice(0, 1)}</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <Text style={[styles.supervisorCardName, { color: colors.text }]}>{s.name}</Text>
                                <View style={styles.activePill}>
                                  <Text style={styles.activePillText}>ACTIVE</Text>
                                </View>
                              </View>
                              <Text style={[styles.supervisorCardKing, { color: colors.textMuted }]}>
                                👑 King ID: <Text style={{ fontFamily: FONT.bold, color: '#15803d' }}>{s.kingId || 'N/A'}</Text> • 📱 {s.mobile}
                              </Text>
                            </View>
                          </View>

                          {/* Permitted Features Badges */}
                          <View style={styles.featuresBadgeWrap}>
                            {FEATURE_DEFINITIONS.map((def) => {
                              const f = cfg[def.key];
                              if (!f?.view && !f?.entry) return null;
                              return (
                                <View key={def.key} style={styles.featureBadge}>
                                  <Ionicons name={def.icon} size={11} color="#15803d" />
                                  <Text style={styles.featureBadgeText}>
                                    {def.title.split(' ')[1]}: {f.entry ? 'View+Entry' : 'View Only'}
                                  </Text>
                                </View>
                              );
                            })}
                          </View>

                          {/* Action Buttons: Edit Features & Release */}
                          <View style={styles.supervisorActionsRow}>
                            <TouchableOpacity
                              style={styles.editPermsBtn}
                              activeOpacity={0.8}
                              onPress={() => {
                                tap();
                                setEditingSupervisor(s);
                                setEditConfig(s.supervisorFeaturesConfig || DEFAULT_CONFIG);
                              }}
                            >
                              <Ionicons name="options-outline" size={14} color="#15803d" />
                              <Text style={styles.editPermsBtnText}>Edit Permissions</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.releaseBtn}
                              activeOpacity={0.8}
                              onPress={() => handleConfirmResign(s)}
                            >
                              <Ionicons name="log-out-outline" size={14} color="#dc2626" />
                              <Text style={styles.releaseBtnText}>Release / Revoke</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* ================= TAB 3: PENDING INVITATIONS ================= */}
            {activeTab === 'PENDING' && (
              <View style={styles.tabContent}>
                {isLoadingRequests ? (
                  <View style={styles.centerBox}>
                    <ActivityIndicator size="small" color="#15803d" />
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>Loading invitations...</Text>
                  </View>
                ) : outgoingRequests.length === 0 ? (
                  <View style={styles.centerBox}>
                    <Ionicons name="mail-open-outline" size={40} color="#94a3b8" />
                    <Text style={[styles.emptyTitle, { color: colors.text }]}>No Pending Invitations</Text>
                    <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                      All appointment requests have either been accepted or you have not sent any requests yet.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 10 }}>
                    {outgoingRequests.map((req) => (
                      <View key={req.id} style={[styles.requestCard, { backgroundColor: colors.bg, borderColor: colors.cardBorder }]}>
                        <View style={styles.requestCardHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.requestCandidateName, { color: colors.text }]}>
                              {req.supervisorName || 'Supervisor Candidate'}
                            </Text>
                            <Text style={[styles.requestCandidateSub, { color: colors.textMuted }]}>
                              👑 King ID: {req.supervisorKingId || 'N/A'} • 📱 {req.supervisorMobile || ''}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.reqStatusTag,
                              req.status === 'PENDING' ? styles.reqStatusPending : req.status === 'ACCEPTED' ? styles.reqStatusAccepted : styles.reqStatusDeclined,
                            ]}
                          >
                            <Text
                              style={[
                                styles.reqStatusText,
                                req.status === 'PENDING' ? styles.reqStatusTextPending : req.status === 'ACCEPTED' ? styles.reqStatusTextAccepted : styles.reqStatusTextDeclined,
                              ]}
                            >
                              {req.status === 'PENDING' ? 'WAITING ACCEPTANCE' : req.status}
                            </Text>
                          </View>
                        </View>

                        {req.note && (
                          <Text style={[styles.requestNoteText, { color: colors.textMuted }]}>
                            💬 Note: "{req.note}"
                          </Text>
                        )}
                        <Text style={styles.requestDateText}>
                          Sent on {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>

          {/* Edit Supervisor Permissions Dialogue Modal */}
          {editingSupervisor && (
            <Modal visible={true} transparent animationType="fade" onRequestClose={() => setEditingSupervisor(null)}>
              <View style={styles.editOverlay}>
                <View style={[styles.editDialog, { backgroundColor: colors.cardBg }]}>
                  <View style={styles.editHeaderRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.editTitle, { color: colors.text }]}>Edit Permissions: {editingSupervisor.name}</Text>
                      <Text style={[styles.editSub, { color: colors.textMuted }]}>Update features allowed for this supervisor.</Text>
                    </View>
                    <TouchableOpacity onPress={() => setEditingSupervisor(null)}>
                      <Ionicons name="close-circle" size={24} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 380 }}>
                    <View style={styles.permList}>
                      {FEATURE_DEFINITIONS.map((def) => {
                        const current = editConfig[def.key] || { view: false, entry: false };
                        return (
                          <View key={def.key} style={styles.permItemCard}>
                            <View style={styles.permItemLeft}>
                              <View style={styles.permIconBg}>
                                <Ionicons name={def.icon} size={15} color="#15803d" />
                              </View>
                              <View style={{ flex: 1 }}>
                                <Text style={styles.permItemTitle}>{def.title}</Text>
                                <Text style={styles.permItemSub}>{def.subtitle}</Text>
                              </View>
                            </View>

                            <View style={styles.checkboxRow}>
                              <TouchableOpacity
                                style={[styles.checkboxPill, current.view && styles.checkboxPillActive]}
                                onPress={() => togglePermission('EDIT', def.key, 'view')}
                              >
                                <Ionicons name={current.view ? 'checkbox' : 'square-outline'} size={15} color={current.view ? '#15803d' : '#64748b'} />
                                <Text style={[styles.checkboxPillText, current.view && styles.checkboxPillTextActive]}>{def.viewLabel}</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[styles.checkboxPill, current.entry && styles.checkboxPillActiveGreen]}
                                onPress={() => togglePermission('EDIT', def.key, 'entry')}
                              >
                                <Ionicons name={current.entry ? 'checkbox' : 'square-outline'} size={15} color={current.entry ? '#15803d' : '#64748b'} />
                                <Text style={[styles.checkboxPillText, current.entry && styles.checkboxPillTextActiveGreen]}>{def.entryLabel}</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.savePermsBtn}
                    onPress={() => {
                      updateFeaturesMutation.mutate({ id: editingSupervisor.id, config: editConfig });
                    }}
                    disabled={updateFeaturesMutation.isPending}
                  >
                    {updateFeaturesMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.savePermsBtnText}>Save Updated Permissions</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  dialog: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '92%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    ...premiumShadow('#000000', 'lg'),
  },
  headerGradient: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  headerSub: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  closeBtn: {
    padding: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: RADIUS.pill,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  tabTextActive: {
    color: '#14532d',
    fontFamily: FONT.extraBold,
  },
  scrollContent: {
    padding: 14,
  },
  tabContent: {
    gap: 12,
  },
  boxCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    gap: 8,
  },
  boxTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  boxSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    lineHeight: 16,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#15803d',
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    height: 42,
  },
  searchBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  errorAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: RADIUS.sm,
  },
  errorAlertText: {
    color: '#b91c1c',
    fontSize: 11.5,
    fontFamily: FONT.medium,
    flex: 1,
  },
  candidateCard: {
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    gap: 10,
  },
  candidateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  candidateAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidateAvatarText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: FONT.extraBold,
  },
  candidateName: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  candidateKingId: {
    fontSize: 11.5,
    color: '#334155',
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  candidateMobile: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  conflictBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fde68a',
    padding: 10,
    borderRadius: RADIUS.md,
  },
  conflictTitle: {
    color: '#92400e',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  conflictText: {
    color: '#b45309',
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  availableBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
  },
  availableText: {
    color: '#15803d',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  permMatrixHeader: {
    marginBottom: 8,
    gap: 2,
  },
  permMatrixTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  permMatrixSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  permList: {
    gap: 8,
  },
  permItemCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    gap: 8,
  },
  permItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  permIconBg: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permItemTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  permItemSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
  },
  checkboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  checkboxPillActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#86efac',
  },
  checkboxPillActiveGreen: {
    backgroundColor: '#dcfce7',
    borderColor: '#4ade80',
  },
  checkboxPillText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  checkboxPillTextActive: {
    color: '#15803d',
    fontFamily: FONT.bold,
  },
  checkboxPillTextActiveGreen: {
    color: '#14532d',
    fontFamily: FONT.extraBold,
  },
  noteBox: {
    marginTop: 6,
    gap: 4,
  },
  noteLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  noteInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  appointActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    marginTop: 8,
    ...premiumShadow('#15803d', 'sm'),
  },
  appointActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  adminFreeNotice: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#166534',
    textAlign: 'center',
    marginTop: 4,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  emptySub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 16,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  actionBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#15803d',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    marginTop: 8,
  },
  actionBtnSmallText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  supervisorCard: {
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    gap: 10,
  },
  supervisorCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  supervisorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#15803d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supervisorAvatarText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  supervisorCardName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  supervisorCardKing: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  activePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  activePillText: {
    color: '#15803d',
    fontSize: 9,
    fontFamily: FONT.extraBold,
  },
  featuresBadgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  featureBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  supervisorActionsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  editPermsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  editPermsBtnText: {
    color: '#15803d',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  releaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  releaseBtnText: {
    color: '#dc2626',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  requestCard: {
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    gap: 6,
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  requestCandidateName: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  requestCandidateSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  reqStatusTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  reqStatusPending: {
    backgroundColor: '#fef3c7',
  },
  reqStatusAccepted: {
    backgroundColor: '#dcfce7',
  },
  reqStatusDeclined: {
    backgroundColor: '#fee2e2',
  },
  reqStatusText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
  },
  reqStatusTextPending: {
    color: '#b45309',
  },
  reqStatusTextAccepted: {
    color: '#15803d',
  },
  reqStatusTextDeclined: {
    color: '#dc2626',
  },
  requestNoteText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    fontStyle: 'italic',
  },
  requestDateText: {
    fontSize: 10,
    color: '#94a3b8',
    fontFamily: FONT.medium,
  },
  editOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 14,
  },
  editDialog: {
    width: '100%',
    maxWidth: 520,
    borderRadius: RADIUS.xl,
    padding: 16,
    gap: 12,
  },
  editHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
  },
  editSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  savePermsBtn: {
    backgroundColor: '#15803d',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  savePermsBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
});
