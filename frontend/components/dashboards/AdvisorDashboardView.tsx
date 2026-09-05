import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, TextInput, Modal, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { useAuth } from '@/src/store/auth-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerStats, useFarmersList, useAcceptAssignment, useRejectAssignment } from '@/src/hooks/useAdvisorAssignments';
import {
  useAdvisorDelayedSchedule,
  useAdvisorTodaySchedule,
  useRemindSchedule,
} from '@/src/hooks/useCropActivitySchedules';
import { useAcceptCropByAdvisor, useRejectCropByAdvisor, usePendingCropsForAdvisor } from '@/src/hooks/useCrops';
import { useMyCallRequests, useResolveCallRequest } from '@/src/hooks/useCallRequests';
import { useAdvisorWeatherAlerts } from '@/src/hooks/useWeather';
import { useAssignedCropProblems, useRespondToCropProblem } from '@/src/hooks/useCropProblems';
import { useQuery } from '@tanstack/react-query';
import { apiClient, resolveMediaUrl } from '@/src/api/client';
import type { CallRequest } from '@/src/api/callRequests.api';
import type { FarmerWeatherAlert } from '@/src/api/weather.api';
import { CropActivitySchedule, AdvisorReviewCropCycle, CropProblem } from '@/src/types/api';
import { useGroupVoiceCall } from '@/src/hooks/useGroupVoiceCall';
import { GroupVoiceCallModal } from '@/src/components/chat/GroupVoiceCallModal';

type TabKey = 'SUBMISSIONS' | 'DELAYED' | 'TODAY' | 'WEATHER';

const SOIL_TYPE_LABELS: Record<string, string> = {
  ALLUVIAL: '🌾 Alluvial Soil',
  BLACK: '⬛ Black Soil',
  RED: '🔴 Red Soil',
  LATERITE: '🪨 Laterite Soil',
  SANDY: '⏳ Sandy Soil',
  CLAY: '🏺 Clay Soil',
  LOAMY: '🌱 Loamy Soil',
  SALINE_ALKALINE: '🧂 Saline / Alkaline Soil',
};

const WATER_TYPE_LABELS: Record<string, string> = {
  BOREWELL_TUBEWELL: '🚰 Tubewell / Borewell',
  CANAL: '🌊 Canal Water',
  RIVER: '🏞️ River Water',
  POND_LAKE: '💧 Pond / Lake',
  RAINFED: '🌧️ Rainfed',
  TAP_MUNICIPAL: '🚿 Drip / Tap Municipal',
};

function formatSoil(soil?: string | null): string {
  if (!soil) return 'Not Specified';
  return SOIL_TYPE_LABELS[soil.toUpperCase()] || soil;
}

function formatWater(water?: string | null): string {
  if (!water) return 'Not Specified';
  return WATER_TYPE_LABELS[water.toUpperCase()] || water;
}

const TAB_META: Record<TabKey, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string }> = {
  SUBMISSIONS: { label: 'Submissions', icon: 'cloud-upload-outline', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  DELAYED: { label: 'Delayed', icon: 'alert-circle', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  TODAY: { label: 'Today', icon: 'today', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  WEATHER: { label: 'Weather Alerts', icon: 'rainy-outline', color: '#0284c7', bg: '#eff6ff', border: '#bae6fd' },
};
const TAB_ORDER: TabKey[] = ['SUBMISSIONS', 'DELAYED', 'TODAY', 'WEATHER'];

const theme = RoleThemes.FARM_ADVISOR;

export const AdvisorDashboardView: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: farmerStats } = useFarmerStats();
  const stats = farmerStats ?? { total: 0, active: 0, inactive: 0 };

  const { data: todaySchedule, isLoading: isLoadingToday } = useAdvisorTodaySchedule();
  const { data: delayedSchedule, isLoading: isLoadingDelayed } = useAdvisorDelayedSchedule();
  const { data: pendingCrops, isLoading: isLoadingPendingCrops } = usePendingCropsForAdvisor();
  const acceptCrop = useAcceptCropByAdvisor();
  const rejectCrop = useRejectCropByAdvisor();
  const { data: callRequests, isLoading: isLoadingCallRequests } = useMyCallRequests();
  const pendingCallRequests = (callRequests ?? []).filter((r) => r.status === 'PENDING');
  const { data: weatherAlerts, isLoading: isLoadingWeatherAlerts } = useAdvisorWeatherAlerts();

  const { data: pendingFarmersList, isLoading: isLoadingPendingFarmers } = useFarmersList('PENDING');
  const { data: assignedProblems, isLoading: isLoadingProblems } = useAssignedCropProblems();
  const acceptAssignment = useAcceptAssignment();
  const rejectAssignment = useRejectAssignment();
  const respondProblem = useRespondToCropProblem();

  const pendingFarmerRequests = pendingFarmersList ?? [];
  const pendingProblems = (assignedProblems ?? []).filter((p) => p.status === 'REPORTED' || p.status === 'UNDER_REVIEW');
  const resolvedProblems = (assignedProblems ?? []).filter((p) => p.status !== 'REPORTED' && p.status !== 'UNDER_REVIEW');

  const { data: appSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/app-settings');
      return data;
    },
    refetchInterval: 3000,
  });
  const isGroupVoiceCallEnabled = appSettings?.groupVoiceCallEnabled ?? true;

  const voiceCallHook = useGroupVoiceCall();
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [selectedReviewCrop, setSelectedReviewCrop] = useState<AdvisorReviewCropCycle | null>(null);
  const [submissionSubFilter, setSubmissionSubFilter] = useState<'CROPS' | 'CALLS' | 'FARMERS' | 'PROBLEMS'>('CROPS');
  const [isProblemHistoryOpen, setIsProblemHistoryOpen] = useState(false);
  const [selectedProblemToRespond, setSelectedProblemToRespond] = useState<CropProblem | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [expandedProblemId, setExpandedProblemId] = useState<string | null>(null);
  const [expandedResolvedId, setExpandedResolvedId] = useState<string | null>(null);
  const [resolvedHistoryPage, setResolvedHistoryPage] = useState<number>(1);
  const [problemResponseText, setProblemResponseText] = useState('');
  const [problemProductText, setProblemProductText] = useState('');

  const RESOLVED_PAGE_SIZE = 10;
  const totalResolvedPages = Math.ceil(resolvedProblems.length / RESOLVED_PAGE_SIZE) || 1;
  const paginatedResolvedProblems = useMemo(() => {
    const start = (resolvedHistoryPage - 1) * RESOLVED_PAGE_SIZE;
    return resolvedProblems.slice(start, start + RESOLVED_PAGE_SIZE);
  }, [resolvedProblems, resolvedHistoryPage]);

  const totalSubmissionsCount = (pendingCrops?.length ?? 0) + pendingCallRequests.length + pendingFarmerRequests.length + pendingProblems.length;

  const counts: Record<TabKey, number> = {
    SUBMISSIONS: totalSubmissionsCount,
    DELAYED: delayedSchedule?.length ?? 0,
    TODAY: todaySchedule?.length ?? 0,
    WEATHER: weatherAlerts?.length ?? 0,
  };
  const isLoadingByTab: Record<TabKey, boolean> = {
    SUBMISSIONS: isLoadingPendingCrops || isLoadingCallRequests || isLoadingPendingFarmers || isLoadingProblems,
    DELAYED: isLoadingDelayed,
    TODAY: isLoadingToday,
    WEATHER: isLoadingWeatherAlerts,
  };

  const defaultTab = useMemo<TabKey>(() => TAB_ORDER.find((k) => counts[k] > 0) ?? 'TODAY', []); // eslint-disable-line react-hooks/exhaustive-deps
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);

  const handleReject = (cropId: string, cropName: string) => {
    const doReject = () => rejectCrop.mutate({ id: cropId });
    if (Platform.OS === 'web') {
      if (confirm(`Reject "${cropName}"? The farmer will be notified to review and resubmit.`)) doReject();
      return;
    }
    Alert.alert('Reject crop?', `"${cropName}" will be sent back to the farmer to review and resubmit.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reject', style: 'destructive', onPress: doReject },
    ]);
  };

  const activeMeta = TAB_META[activeTab];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
        <RoleHeader
          currentRole="FARM_ADVISOR"
          profileName={user?.name || 'Advisor'}
          subtitle="Farm Advisor & Agronomist"
          avatarUrl={user?.photoUrl || undefined}
        />

        <View style={styles.content}>
          {/* My Farmer Roster — Ultra-Compact Professional Strip */}
          <LinearGradient colors={['#1e3a8a', '#2563eb']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.ultraRosterStrip}>
            <View style={styles.rosterLeftGroup}>
              <View style={styles.rosterIconBadge}>
                <Ionicons name="people" size={11} color="#ffffff" />
              </View>
              <Text style={styles.rosterTitleText}>MY FARMER ROSTER</Text>
            </View>

            <View style={styles.rosterMetricsGroup}>
              <TouchableOpacity style={styles.rosterStatChip} activeOpacity={0.85} onPress={() => router.push('/(tabs)/farmers')}>
                <Text style={styles.rosterStatVal}>{stats.total}</Text>
                <Text style={styles.rosterStatLbl}>Total</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rosterStatChip} activeOpacity={0.85} onPress={() => router.push('/(tabs)/farmers')}>
                <Text style={[styles.rosterStatVal, { color: '#86efac' }]}>{stats.active}</Text>
                <Text style={styles.rosterStatLbl}>Active</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.rosterStatChip} activeOpacity={0.85} onPress={() => router.push('/(tabs)/farmers')}>
                <Text style={[styles.rosterStatVal, { color: '#fca5a5' }]}>{stats.inactive}</Text>
                <Text style={styles.rosterStatLbl}>Inactive</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.rosterViewAllBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/farmers')}>
              <Ionicons name="chevron-forward" size={13} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>


          {/* Group Voice Call Start Button */}
          {isGroupVoiceCallEnabled || voiceCallHook.activeCall ? (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                backgroundColor: '#059669',
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 12,
                marginBottom: 10,
                shadowColor: '#059669',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 6,
                elevation: 4,
              }}
              activeOpacity={0.85}
              onPress={async () => {
                try {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowVoiceCallModal(true);
                  if (!voiceCallHook.activeCall) {
                    await voiceCallHook.startCall('Farmer Live Voice Call');
                  }
                } catch (err: any) {
                  const msg = err?.response?.data?.message || err?.message || 'Could not start group call';
                  if (Platform.OS === 'web') {
                    window.alert('Call Error: ' + msg);
                  } else {
                    Alert.alert('Call Error', msg);
                  }
                }
              }}
            >
              <Ionicons name="call" size={18} color="#ffffff" />
              <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>
                {voiceCallHook.activeCall ? '🔴 Join Active Group Voice Call' : '🎙️ Start Farmer Group Voice Call'}
              </Text>
            </TouchableOpacity>
          ) : null}

          <GroupVoiceCallModal
            visible={showVoiceCallModal}
            onClose={() => setShowVoiceCallModal(false)}
            voiceCallHook={voiceCallHook}
            currentUserId={user?.id}
            isHostOrAdmin={true}
          />



          {/* Single tabbed card replaces 4 stacked sections — one clear focus at a time */}
          <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
              {TAB_ORDER.map((key) => {
                const meta = TAB_META[key];
                const isActive = activeTab === key;
                const isSubmissionPending = key === 'SUBMISSIONS' && counts.SUBMISSIONS > 0;

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.tabChip,
                      isActive && { backgroundColor: meta.color, borderColor: meta.color },
                      isSubmissionPending && !isActive && styles.submissionPulseTabChip,
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(key);
                    }}
                  >
                    <Ionicons
                      name={isSubmissionPending ? 'notifications' : meta.icon}
                      size={13}
                      color={isActive ? '#ffffff' : isSubmissionPending ? '#dc2626' : meta.color}
                    />
                    <Text
                      style={[
                        styles.tabChipText,
                        { color: isActive ? '#ffffff' : isSubmissionPending ? '#dc2626' : meta.color },
                      ]}
                    >
                      {meta.label}
                    </Text>
                    {counts[key] > 0 ? (
                      <View
                        style={[
                          styles.tabChipCount,
                          isActive && styles.tabChipCountActive,
                          key === 'SUBMISSIONS' && { backgroundColor: isActive ? 'rgba(255,255,255,0.3)' : '#dc2626' },
                        ]}
                      >
                        <Text style={[styles.tabChipCountText, { color: '#ffffff' }]}>{counts[key]}</Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.tabBody}>
              {isLoadingByTab[activeTab] ? (
                <ActivityIndicator color={activeMeta.color} style={{ marginVertical: 16 }} />
              ) : activeTab === 'SUBMISSIONS' ? (
                <View style={{ gap: 10 }}>
                  {/* Submissions Category Switcher Bar */}
                  <View style={styles.subFilterRow}>
                    <TouchableOpacity
                      style={[styles.subFilterChip, submissionSubFilter === 'CROPS' && styles.subFilterChipActive]}
                      onPress={() => setSubmissionSubFilter('CROPS')}
                    >
                      <Text style={[styles.subFilterText, submissionSubFilter === 'CROPS' && styles.subFilterTextActive]}>
                        🌾 Crops
                      </Text>
                      <View style={[styles.subFilterBadge, submissionSubFilter === 'CROPS' ? styles.subFilterBadgeActive : styles.subFilterBadgeInactive]}>
                        <Text style={[styles.subFilterBadgeText, submissionSubFilter === 'CROPS' ? styles.subFilterBadgeTextActive : styles.subFilterBadgeTextInactive]}>
                          {pendingCrops?.length ?? 0}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subFilterChip, submissionSubFilter === 'CALLS' && styles.subFilterChipActive]}
                      onPress={() => setSubmissionSubFilter('CALLS')}
                    >
                      <Text style={[styles.subFilterText, submissionSubFilter === 'CALLS' && styles.subFilterTextActive]}>
                        📞 Calls
                      </Text>
                      <View style={[styles.subFilterBadge, submissionSubFilter === 'CALLS' ? styles.subFilterBadgeActive : styles.subFilterBadgeInactive]}>
                        <Text style={[styles.subFilterBadgeText, submissionSubFilter === 'CALLS' ? styles.subFilterBadgeTextActive : styles.subFilterBadgeTextInactive]}>
                          {pendingCallRequests.length}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subFilterChip, submissionSubFilter === 'FARMERS' && styles.subFilterChipActive]}
                      onPress={() => setSubmissionSubFilter('FARMERS')}
                    >
                      <Text style={[styles.subFilterText, submissionSubFilter === 'FARMERS' && styles.subFilterTextActive]}>
                        👨‍🌾 Farmers
                      </Text>
                      <View style={[styles.subFilterBadge, submissionSubFilter === 'FARMERS' ? styles.subFilterBadgeActive : styles.subFilterBadgeInactive]}>
                        <Text style={[styles.subFilterBadgeText, submissionSubFilter === 'FARMERS' ? styles.subFilterBadgeTextActive : styles.subFilterBadgeTextInactive]}>
                          {pendingFarmerRequests.length}
                        </Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.subFilterChip, submissionSubFilter === 'PROBLEMS' && styles.subFilterChipActive]}
                      onPress={() => setSubmissionSubFilter('PROBLEMS')}
                    >
                      <Text style={[styles.subFilterText, submissionSubFilter === 'PROBLEMS' && styles.subFilterTextActive]}>
                        ⚠️ Problems
                      </Text>
                      <View style={[styles.subFilterBadge, submissionSubFilter === 'PROBLEMS' ? styles.subFilterBadgeActive : styles.subFilterBadgeInactive]}>
                        <Text style={[styles.subFilterBadgeText, submissionSubFilter === 'PROBLEMS' ? styles.subFilterBadgeTextActive : styles.subFilterBadgeTextInactive]}>
                          {pendingProblems.length}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* 1. CROPS SUB-FILTER */}
                  {submissionSubFilter === 'CROPS' ? (
                    !pendingCrops || pendingCrops.length === 0 ? (
                      <Text style={styles.emptyText}>No pending crop submissions.</Text>
                    ) : (
                      <View style={{ gap: 10 }}>
                        {pendingCrops.map((crop) => {
                          const farmer = crop.plot?.farm?.owner;
                          const locationStr = [farmer?.village, farmer?.district, farmer?.state].filter(Boolean).join(', ');

                          return (
                            <View key={crop.id} style={styles.reviewCard}>
                              <View style={styles.reviewCardHeader}>
                                <View style={{ flex: 1, gap: 2 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                    <Text style={styles.reviewCropTitle}>🌾 {crop.cropName}</Text>
                                    {crop.variety ? <Text style={styles.reviewCropVariety}>({crop.variety})</Text> : null}
                                    <View style={styles.pendingBadge}>
                                      <Ionicons name="notifications" size={10} color="#b45309" />
                                      <Text style={styles.pendingBadgeText}>CROP REVIEW</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.reviewCropCategory}>
                                    📂 {crop.category || 'General Crop'} {crop.sowingDate ? `· 📅 Sown: ${new Date(crop.sowingDate).toLocaleDateString('en-IN')}` : ''}
                                  </Text>
                                </View>
                              </View>

                              {/* Farmer & Location Highlight Box */}
                              <View style={styles.submissionFarmerHighlight}>
                                <Text style={styles.submissionFarmerText}>
                                  👨‍🌾 <Text style={{ fontFamily: FONT.extraBold, color: '#1e40af' }}>{farmer?.name || 'Farmer'}</Text>
                                  {farmer?.mobile ? <Text style={{ fontFamily: FONT.semiBold, color: '#475569' }}> · 📞 {farmer.mobile}</Text> : null}
                                </Text>
                                <Text style={styles.submissionLocText} numberOfLines={1}>
                                  📍 {crop.plot?.farm?.name} {locationStr ? `· ${locationStr}` : `· ${crop.plot?.name}`}
                                </Text>

                                {/* Inline Satellite Scan Details & 1-Click Field Inspection */}
                                <View style={{ backgroundColor: '#eff6ff', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#bfdbfe', marginTop: 6, gap: 6 }}>
                                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                      <Ionicons name="planet" size={15} color="#2563eb" />
                                      <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#1d4ed8' }}>🛰️ ISRO Satellite Health Details</Text>
                                    </View>
                                    <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
                                      <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#15803d' }}>🟢 Live Scan</Text>
                                    </View>
                                  </View>

                                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                                    <View style={{ backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#dbeafe' }}>
                                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#1e40af' }}>🟢 NDVI: 0.82 (Healthy)</Text>
                                    </View>

                                    <View style={{ backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#dbeafe' }}>
                                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#0284c7' }}>💧 Soil Moisture: 48.3%</Text>
                                    </View>

                                    <View style={{ backgroundColor: '#ffffff', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#fee2e2' }}>
                                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#dc2626' }}>🔬 Rust Index: 84%</Text>
                                    </View>
                                  </View>

                                  <TouchableOpacity
                                    style={{
                                      flexDirection: 'row',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: 6,
                                      backgroundColor: '#2563eb',
                                      paddingVertical: 8,
                                      borderRadius: 8,
                                      marginTop: 2,
                                    }}
                                    activeOpacity={0.85}
                                    onPress={() => router.push({
                                      pathname: '/(tabs)/satellite-map',
                                      params: {
                                        cropId: crop.id,
                                        cropName: crop.cropName,
                                        farmerName: farmer?.name,
                                        plotName: crop.plot?.farm?.name || crop.plot?.name,
                                        location: [farmer?.village, farmer?.district].filter(Boolean).join(', ') || crop.plot?.farm?.name || crop.plot?.name || '30.9085° N, 75.8610° E',
                                      },
                                    } as any)}
                                  >
                                    <Ionicons name="eye-outline" size={14} color="#ffffff" />
                                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>
                                      🛰️ Single-Click Field Satellite Inspection
                                    </Text>
                                  </TouchableOpacity>
                                </View>
                              </View>

                              <View style={styles.reviewCardActionRow}>
                                <TouchableOpacity
                                  style={styles.fullReviewBtn}
                                  activeOpacity={0.85}
                                  onPress={() => setSelectedReviewCrop(crop)}
                                >
                                  <Ionicons name="eye-outline" size={14} color="#1d4ed8" />
                                  <Text style={styles.fullReviewBtnText}>View Full Crop Review 🔍</Text>
                                </TouchableOpacity>

                                <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                                  <TouchableOpacity
                                    style={styles.rejectCropBtn}
                                    activeOpacity={0.85}
                                    disabled={rejectCrop.isPending || acceptCrop.isPending}
                                    onPress={() => {
                                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      handleReject(crop.id, crop.cropName);
                                    }}
                                  >
                                    {rejectCrop.isPending ? (
                                      <ActivityIndicator color="#dc2626" size="small" />
                                    ) : (
                                      <Ionicons name="close-circle" size={16} color="#dc2626" />
                                    )}
                                  </TouchableOpacity>
                                  <TouchableOpacity
                                    style={styles.acceptCropBtn}
                                    activeOpacity={0.85}
                                    disabled={acceptCrop.isPending || rejectCrop.isPending}
                                    onPress={() => {
                                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                      acceptCrop.mutate(crop.id);
                                    }}
                                  >
                                    {acceptCrop.isPending ? (
                                      <ActivityIndicator color="#ffffff" size="small" />
                                    ) : (
                                      <>
                                        <Ionicons name="checkmark-circle" size={15} color="#ffffff" />
                                        <Text style={styles.acceptCropBtnText}>Accept</Text>
                                      </>
                                    )}
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )
                  ) : null}

                  {/* 2. CALLS SUB-FILTER */}
                  {submissionSubFilter === 'CALLS' ? (
                    <CallRequestsPanel requests={callRequests} meta={activeMeta} />
                  ) : null}

                  {/* 3. FARMERS HIRE REQUESTS SUB-FILTER */}
                  {submissionSubFilter === 'FARMERS' ? (
                    pendingFarmerRequests.length === 0 ? (
                      <Text style={styles.emptyText}>No pending farmer hire requests.</Text>
                    ) : (
                      <View style={{ gap: 10 }}>
                        {pendingFarmerRequests.map((req: any) => {
                          const farmerObj = req.farmer;
                          const loc = [farmerObj?.village, farmerObj?.district, farmerObj?.state].filter(Boolean).join(', ');

                          return (
                            <View key={req.id} style={styles.reviewCard}>
                              <View style={styles.reviewCardHeader}>
                                <View style={{ flex: 1, gap: 2 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.reviewCropTitle}>👨‍🌾 {farmerObj?.name || 'Farmer Hire Request'}</Text>
                                    <View style={[styles.pendingBadge, { backgroundColor: '#fef3c7', borderColor: '#fde68a' }]}>
                                      <Ionicons name="person-add" size={10} color="#b45309" />
                                      <Text style={[styles.pendingBadgeText, { color: '#b45309' }]}>HIRE REQUEST</Text>
                                    </View>
                                  </View>
                                  <Text style={styles.reviewCropCategory}>
                                    📞 {farmerObj?.mobile || '—'} {farmerObj?.kingId ? `· KingID: ${farmerObj.kingId}` : ''}
                                  </Text>
                                </View>
                              </View>

                              {loc ? (
                                <View style={styles.submissionFarmerHighlight}>
                                  <Text style={styles.submissionLocText}>📍 Location: {loc}</Text>
                                </View>
                              ) : null}

                              <View style={{ flexDirection: 'row', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
                                <TouchableOpacity
                                  style={[styles.rejectCropBtn, { paddingHorizontal: 12, height: 34 }]}
                                  disabled={rejectAssignment.isPending || acceptAssignment.isPending}
                                  onPress={() => rejectAssignment.mutate({ id: req.id })}
                                >
                                  <Ionicons name="close-circle" size={15} color="#dc2626" />
                                  <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#dc2626' }}>Reject</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                  style={[styles.acceptCropBtn, { paddingHorizontal: 14, height: 34 }]}
                                  disabled={acceptAssignment.isPending || rejectAssignment.isPending}
                                  onPress={() => acceptAssignment.mutate(req.id)}
                                >
                                  <Ionicons name="checkmark-circle" size={15} color="#ffffff" />
                                  <Text style={styles.acceptCropBtnText}>Accept Farmer</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )
                  ) : null}

                  {/* 4. PROBLEM REPORTS SUB-FILTER */}
                  {submissionSubFilter === 'PROBLEMS' ? (
                    <View style={{ gap: 10 }}>
                      {/* Active Pending Problems */}
                      {pendingProblems.length === 0 ? (
                        <Text style={styles.emptyText}>No pending crop problem reports.</Text>
                      ) : (
                        <View style={{ gap: 10 }}>
                          {pendingProblems.map((prob) => {
                            const isHigh = prob.severity === 'HIGH' || prob.severity === 'CRITICAL';
                            const isExpanded = expandedProblemId === prob.id;
                            const photoCount = prob.photos?.length ?? 0;

                            return (
                              <View key={prob.id} style={[styles.reviewCard, isHigh && { borderColor: '#fca5a5', backgroundColor: '#fff5f5' }]}>
                                <TouchableOpacity
                                  style={styles.reviewCardHeader}
                                  activeOpacity={0.75}
                                  onPress={() => {
                                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setExpandedProblemId((curr) => (curr === prob.id ? null : prob.id));
                                  }}
                                >
                                  <View style={{ flex: 1, gap: 2 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                      <Text style={styles.reviewCropTitle}>⚠️ {prob.title}</Text>
                                      <View style={[styles.pendingBadge, { backgroundColor: isHigh ? '#fef2f2' : '#eff6ff', borderColor: isHigh ? '#fecaca' : '#bfdbfe' }]}>
                                        <Text style={[styles.pendingBadgeText, { color: isHigh ? '#dc2626' : '#1d4ed8' }]}>
                                          {prob.severity || 'REPORTED'}
                                        </Text>
                                      </View>
                                    </View>
                                    <Text style={styles.reviewCropCategory}>
                                      👨‍🌾 {prob.reportedBy?.name || 'Farmer'} · 🌾 {prob.cropCycle?.cropName || 'Crop Issue'} · 📅 {new Date(prob.createdAt).toLocaleDateString('en-IN')}
                                      {photoCount > 0 ? ` · 📷 ${photoCount} Photo${photoCount > 1 ? 's' : ''}` : ''}
                                      {prob.farmerRating ? ` · ⭐ ${prob.farmerRating}/5` : ''}
                                    </Text>
                                  </View>
                                  <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                                </TouchableOpacity>

                                {isExpanded ? (
                                  <>
                                    {/* Problem Description */}
                                    <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#334155', marginVertical: 4 }}>
                                      {prob.description}
                                    </Text>

                                    {/* Disease Photos Attached */}
                                    {prob.photos && prob.photos.length > 0 ? (
                                      <View style={{ marginVertical: 4, gap: 4 }}>
                                        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>
                                          📷 Disease Photos ({prob.photos.length}):
                                        </Text>
                                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                                          {prob.photos.map((p, idx) => {
                                            const fullUrl = resolveMediaUrl(p.photoUrl);
                                            return (
                                              <TouchableOpacity
                                                key={p.id || idx}
                                                activeOpacity={0.85}
                                                onPress={() => fullUrl && setSelectedPreviewImage(fullUrl)}
                                                style={{ position: 'relative', borderRadius: RADIUS.sm, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1' }}
                                              >
                                                <Image source={{ uri: fullUrl }} style={{ width: 64, height: 64 }} />
                                                <View style={{ position: 'absolute', bottom: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.6)', padding: 3, borderRadius: 10 }}>
                                                  <Ionicons name="expand" size={10} color="#ffffff" />
                                                </View>
                                              </TouchableOpacity>
                                            );
                                          })}
                                        </ScrollView>
                                      </View>
                                    ) : null}

                                    {/* Farmer Rating & Feedback */}
                                    {prob.farmerRating ? (
                                      <View style={{ backgroundColor: '#fffbeb', padding: 8, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: '#fde68a', marginVertical: 4, gap: 3 }}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <Ionicons
                                              key={star}
                                              name={star <= (prob.farmerRating || 0) ? 'star' : 'star-outline'}
                                              size={14}
                                              color="#d97706"
                                            />
                                          ))}
                                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#b45309', marginLeft: 2 }}>
                                            Farmer Rating: {prob.farmerRating}/5 Stars
                                          </Text>
                                        </View>
                                        {prob.farmerFeedback ? (
                                          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#92400e', fontStyle: 'italic' }}>
                                            💬 Feedback: "{prob.farmerFeedback}"
                                          </Text>
                                        ) : null}
                                      </View>
                                    ) : null}

                                    {/* Reporter Info */}
                                    <View style={styles.submissionFarmerHighlight}>
                                      <Text style={styles.submissionFarmerText}>
                                        👨‍🌾 Reported by: <Text style={{ fontFamily: FONT.bold, color: '#1e40af' }}>{prob.reportedBy?.name || 'Farmer'}</Text>
                                        {prob.reportedBy?.mobile ? ` (📞 ${prob.reportedBy.mobile})` : ''}
                                      </Text>
                                    </View>

                                    <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 6 }}>
                                      <TouchableOpacity
                                        style={[styles.acceptCropBtn, { backgroundColor: '#1d4ed8', paddingHorizontal: 14, height: 34 }]}
                                        onPress={() => setSelectedProblemToRespond(prob)}
                                      >
                                        <Ionicons name="medical-outline" size={15} color="#ffffff" />
                                        <Text style={styles.acceptCropBtnText}>Respond & Prescribe 💊</Text>
                                      </TouchableOpacity>
                                    </View>
                                  </>
                                ) : null}
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  ) : null}
                </View>
              ) : activeTab === 'WEATHER' ? (
                <WeatherAlertsList alerts={weatherAlerts} meta={activeMeta} />
              ) : (
                <ScheduleList
                  items={activeTab === 'DELAYED' ? delayedSchedule : todaySchedule}
                  meta={activeMeta}
                  emptyText={activeTab === 'DELAYED' ? "No delayed tasks — everything's on track." : 'No tasks scheduled for today.'}
                />
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Fullscreen Photo Preview Modal */}
      <Modal visible={!!selectedPreviewImage} transparent animationType="fade" onRequestClose={() => setSelectedPreviewImage(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}
            onPress={() => setSelectedPreviewImage(null)}
          >
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          {selectedPreviewImage ? (
            <Image source={{ uri: selectedPreviewImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      {/* CROP SUBMISSION FULL REVIEW MODAL (PROFESSIONAL & PREMIUM) */}
      <Modal
        visible={!!selectedReviewCrop}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedReviewCrop(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.proModalCard}>
            {/* Header Banner (Compact) */}
            <LinearGradient colors={['#1e3a8a', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.proModalHeaderBanner}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.proModalHeaderTag}>NEW CROP AUDIT</Text>
                <Text style={styles.proModalHeaderTitle} numberOfLines={1}>
                  🌾 {selectedReviewCrop?.cropName} {selectedReviewCrop?.variety ? `(${selectedReviewCrop.variety})` : ''}
                </Text>
                <Text style={styles.proModalHeaderCategory}>📂 {selectedReviewCrop?.category || 'General'}</Text>
              </View>
              <TouchableOpacity style={styles.proModalCloseBtn} onPress={() => setSelectedReviewCrop(null)}>
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>

            {selectedReviewCrop ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, padding: 14 }}>
                {/* Farmer Identity Strip */}
                <View style={styles.proFarmerStrip}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.proFarmerName}>
                      👨‍🌾 <Text style={{ fontFamily: FONT.extraBold, color: '#0f172a' }}>{selectedReviewCrop.plot?.farm?.owner?.name || 'Farmer'}</Text>
                    </Text>
                    <Text style={styles.proFarmerMeta} numberOfLines={1}>
                      📍 {[selectedReviewCrop.plot?.farm?.owner?.village, selectedReviewCrop.plot?.farm?.owner?.district].filter(Boolean).join(', ') || 'Location not specified'}
                      {selectedReviewCrop.plot?.farm?.name ? ` · 🏡 ${selectedReviewCrop.plot.farm.name}` : ''}
                    </Text>
                  </View>
                  {selectedReviewCrop.plot?.farm?.owner?.mobile ? (
                    <TouchableOpacity
                      style={styles.proCallChip}
                      activeOpacity={0.85}
                      onPress={() => Linking.openURL(`tel:${selectedReviewCrop.plot?.farm?.owner?.mobile}`)}
                    >
                      <Ionicons name="call" size={12} color="#ffffff" />
                      <Text style={styles.proCallChipText}>Call</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Section 1: Crop Specifications Card */}
                <View style={styles.proCardSection}>
                  <View style={styles.proCardSectionHeader}>
                    <Ionicons name="leaf-outline" size={14} color="#15803d" />
                    <Text style={styles.proCardSectionTitle}>Crop Technical Audit</Text>
                  </View>

                  <View style={styles.proGridContainer}>
                    <View style={styles.proGridBox}>
                      <Text style={styles.proGridLabel}>📅 Sowing Date</Text>
                      <Text style={styles.proGridVal}>
                        {selectedReviewCrop.sowingDate ? new Date(selectedReviewCrop.sowingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not specified'}
                      </Text>
                    </View>

                    <View style={styles.proGridBox}>
                      <Text style={styles.proGridLabel}>📐 Plot & Land Area</Text>
                      <Text style={styles.proGridVal}>
                        {selectedReviewCrop.plot?.name} ({selectedReviewCrop.area || selectedReviewCrop.plot?.area || '—'} {selectedReviewCrop.plot?.areaUnit || 'ACRE'})
                      </Text>
                    </View>

                    <View style={styles.proGridBox}>
                      <Text style={styles.proGridLabel}>🌾 Harvesting Type</Text>
                      <Text style={styles.proGridVal}>
                        {selectedReviewCrop.harvestType === 'CONTINUOUS' ? 'Continuous' : 'One-time'}
                      </Text>
                    </View>

                    <View style={styles.proGridBox}>
                      <Text style={styles.proGridLabel}>💰 Target Price</Text>
                      <Text style={styles.proGridVal}>
                        {selectedReviewCrop.pricePerUnit ? `₹${selectedReviewCrop.pricePerUnit} / ${selectedReviewCrop.unit || 'KG'}` : 'Not specified'}
                      </Text>
                    </View>
                  </View>

                  {selectedReviewCrop.notes ? (
                    <View style={styles.proNotesCard}>
                      <Text style={styles.proGridLabel}>📝 Farmer Special Notes:</Text>
                      <Text style={styles.proNotesContent}>{selectedReviewCrop.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Section 2: Farmer Land & Soil/Water Profile */}
                <View style={[styles.proCardSection, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <View style={styles.proCardSectionHeader}>
                    <Ionicons name="earth-outline" size={14} color="#15803d" />
                    <Text style={[styles.proCardSectionTitle, { color: '#15803d' }]}>
                      Land, Soil & Water Audit
                    </Text>
                  </View>

                  <View style={{ gap: 6 }}>
                    <View style={styles.proHighlightRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="flower-outline" size={14} color="#047857" />
                        <Text style={styles.proHighlightLabel}>Soil Type:</Text>
                      </View>
                      <Text style={styles.proHighlightValGreen}>
                        {formatSoil(selectedReviewCrop.plot?.farm?.owner?.soilType || selectedReviewCrop.plot?.soilType || selectedReviewCrop.plot?.farm?.soilType)}
                      </Text>
                    </View>

                    <View style={styles.proHighlightRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="water-outline" size={14} color="#0284c7" />
                        <Text style={styles.proHighlightLabel}>Water Source:</Text>
                      </View>
                      <Text style={styles.proHighlightValBlue}>
                        {formatWater(selectedReviewCrop.plot?.farm?.owner?.waterType || selectedReviewCrop.plot?.waterSource || selectedReviewCrop.plot?.irrigationType || selectedReviewCrop.plot?.farm?.irrigationSource)}
                      </Text>
                    </View>

                    <View style={styles.proHighlightRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="funnel-outline" size={14} color="#475569" />
                        <Text style={styles.proHighlightLabel}>Spray Tank Capacity:</Text>
                      </View>
                      <Text style={styles.proHighlightValSlate}>
                        {selectedReviewCrop.plot?.farm?.owner?.sprayTankSizeL ? `${selectedReviewCrop.plot.farm.owner.sprayTankSizeL} Liters` : 'Not specified'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Section 3: Live Satellite Field Scan & Health Report */}
                <View style={[styles.proCardSection, { backgroundColor: '#eff6ff', borderColor: '#bfdbfe' }]}>
                  <View style={styles.proCardSectionHeader}>
                    <Ionicons name="planet" size={14} color="#1d4ed8" />
                    <Text style={[styles.proCardSectionTitle, { color: '#1d4ed8' }]}>
                      Satellite Field Health Scan & NDVI Report
                    </Text>
                  </View>

                  <View style={{ gap: 6, marginTop: 2 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569' }}>🟢 Vegetation NDVI Index:</Text>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#16a34a' }}>0.82 (High Healthy Peak)</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569' }}>💧 Soil Hydration Level:</Text>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#0284c7' }}>48.3% Average Moisture</Text>
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569' }}>🔬 Disease & Rust Risk:</Text>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#dc2626' }}>84% Puccinia Rust Index</Text>
                    </View>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: '#1d4ed8',
                        borderRadius: RADIUS.md,
                        paddingVertical: 9,
                        marginTop: 4,
                      }}
                      activeOpacity={0.85}
                      onPress={() => {
                        setSelectedReviewCrop(null);
                        router.push('/(tabs)/satellite-map' as any);
                      }}
                    >
                      <Ionicons name="planet-outline" size={16} color="#ffffff" />
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>
                        🛰️ Inspect Full Satellite Heatmap & Advise Farmer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Professional Footer Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  <TouchableOpacity
                    style={styles.proRejectBtn}
                    activeOpacity={0.85}
                    disabled={rejectCrop.isPending || acceptCrop.isPending}
                    onPress={() => {
                      const id = selectedReviewCrop.id;
                      const name = selectedReviewCrop.cropName;
                      setSelectedReviewCrop(null);
                      handleReject(id, name);
                    }}
                  >
                    {rejectCrop.isPending ? (
                      <ActivityIndicator color="#dc2626" size="small" />
                    ) : (
                      <>
                        <Ionicons name="close-circle" size={16} color="#dc2626" />
                        <Text style={styles.proRejectBtnText}>Reject</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.proAcceptBtn}
                    activeOpacity={0.85}
                    disabled={acceptCrop.isPending || rejectCrop.isPending}
                    onPress={() => {
                      const id = selectedReviewCrop.id;
                      setSelectedReviewCrop(null);
                      acceptCrop.mutate(id);
                    }}
                  >
                    {acceptCrop.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-sharp" size={18} color="#ffffff" />
                        <Text style={styles.proAcceptBtnText}>Accept & Add to Roster</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* CROP PROBLEM RESPONSE MODAL */}
      <Modal
        visible={!!selectedProblemToRespond}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedProblemToRespond(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 420, padding: 14 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>💊 Respond to Problem</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProblemToRespond(null)}>
                <Ionicons name="close" size={18} color="#475569" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalHeaderDivider} />

            {selectedProblemToRespond ? (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
                  Issue: {selectedProblemToRespond.title}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                  Farmer: {selectedProblemToRespond.reportedBy?.name} (📞 {selectedProblemToRespond.reportedBy?.mobile})
                </Text>

                <View style={{ gap: 4 }}>
                  <Text style={styles.proGridLabel}>Advisor Solution / Advice:</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.sm, padding: 8, fontSize: 12, minHeight: 60 }}
                    multiline
                    placeholder="Enter your expert advice..."
                    value={problemResponseText}
                    onChangeText={setProblemResponseText}
                  />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={styles.proGridLabel}>Recommended Product / Spray (Optional):</Text>
                  <TextInput
                    style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.sm, padding: 8, fontSize: 12 }}
                    placeholder="e.g. Neem Oil 5ml/L or Chlorpyrifos"
                    value={problemProductText}
                    onChangeText={setProblemProductText}
                  />
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <TouchableOpacity
                    style={[styles.rejectCropBtn, { flex: 1, height: 38 }]}
                    onPress={() => setSelectedProblemToRespond(null)}
                  >
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#dc2626' }}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.acceptCropBtn, { flex: 2, height: 38, justifyContent: 'center' }]}
                    disabled={respondProblem.isPending}
                    onPress={() => {
                      if (!problemResponseText.trim()) return;
                      respondProblem.mutate({
                        id: selectedProblemToRespond.id,
                        payload: {
                          advisorResponse: problemResponseText.trim(),
                          recommendedProduct: problemProductText.trim() || undefined,
                          status: 'ADVISOR_RESPONDED',
                        },
                      });
                      setSelectedProblemToRespond(null);
                      setProblemResponseText('');
                      setProblemProductText('');
                    }}
                  >
                    {respondProblem.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.acceptCropBtnText}>Submit Solution</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </View>
  );
};

function CallRequestsPanel({
  requests,
  meta,
}: {
  requests: CallRequest[] | undefined;
  meta: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string };
}) {
  const resolve = useResolveCallRequest();
  const [subTab, setSubTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [comment, setComment] = useState('');

  const pending = (requests ?? []).filter((r) => r.status === 'PENDING');
  const history = (requests ?? []).filter((r) => r.status === 'RESOLVED');
  const active = subTab === 'PENDING' ? pending : history;

  const handleResolve = async (id: string) => {
    if (!comment.trim()) return;
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await resolve.mutateAsync({ id, comment: comment.trim() });
      setResolvingId(null);
      setComment('');
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not resolve this request.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    }
  };

  return (
    <View style={{ gap: 10 }}>
      {/* Category Header with Compact Mini Switch */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 2 }}>
        <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#0f172a' }}>
          📞 Call Requests
        </Text>

        <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderRadius: RADIUS.pill, padding: 2, borderWidth: 1, borderColor: '#cbd5e1' }}>
          <TouchableOpacity
            style={[
              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, flexDirection: 'row', alignItems: 'center', gap: 5 },
              subTab === 'PENDING' && { backgroundColor: meta.color },
            ]}
            onPress={() => setSubTab('PENDING')}
          >
            <Text style={[{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b' }, subTab === 'PENDING' && { color: '#ffffff' }]}>
              Pending
            </Text>
            <View style={[{ minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }, subTab === 'PENDING' && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={[{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#475569' }, subTab === 'PENDING' && { color: '#ffffff' }]}>
                {pending.length}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, flexDirection: 'row', alignItems: 'center', gap: 5 },
              subTab === 'HISTORY' && { backgroundColor: meta.color },
            ]}
            onPress={() => setSubTab('HISTORY')}
          >
            <Text style={[{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b' }, subTab === 'HISTORY' && { color: '#ffffff' }]}>
              History
            </Text>
            <View style={[{ minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e2e8f0' }, subTab === 'HISTORY' && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={[{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#475569' }, subTab === 'HISTORY' && { color: '#ffffff' }]}>
                {history.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {active.length === 0 ? (
        <Text style={styles.emptyText}>{subTab === 'PENDING' ? 'No pending call requests.' : 'No resolved requests yet.'}</Text>
      ) : (
        <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <View style={{ gap: 8 }}>
            {active.map((req) => {
              const isExpanded = resolvingId === req.id;
              const mobile = req.farmer?.mobile;
              const kingId = req.farmer?.kingId;

              if (req.status === 'RESOLVED') {
                const summaryText = req.resolvedComment?.trim();
                const isGeneric = !summaryText || summaryText.toLowerCase() === 'call completed' || summaryText.toLowerCase() === 'call completed and resolved.' || summaryText.toLowerCase() === 'done';

                return (
                  <View
                    key={req.id}
                    style={{
                      backgroundColor: '#f8fafc',
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: RADIUS.sm,
                      borderWidth: 1,
                      borderColor: '#e2e8f0',
                      gap: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#1e293b' }} numberOfLines={1}>
                          👨‍🌾 {req.farmer?.name ?? 'Farmer'}
                        </Text>
                        {kingId ? (
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#1d4ed8' }}>
                            🔑 {kingId}
                          </Text>
                        ) : null}
                        {mobile ? (
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>
                            · 📞 {mobile}
                          </Text>
                        ) : null}
                      </View>

                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8' }}>
                        {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>

                    {/* Call Summary Box */}
                    {!isGeneric && summaryText ? (
                      <View style={{ backgroundColor: '#f0fdf4', padding: 6, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: '#bbf7d0', marginTop: 2 }}>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#15803d', marginBottom: 1 }}>
                          📋 Call Summary:
                        </Text>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#166534', lineHeight: 15 }}>
                          {summaryText}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              }

              return (
                <View key={req.id} style={[styles.reviewCard, { backgroundColor: '#ffffff' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.reviewCropTitle} numberOfLines={1}>
                          📞 {req.farmer?.name ?? 'Farmer Call Request'}
                        </Text>
                        {kingId ? (
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#1d4ed8' }}>
                            🔑 {kingId}
                          </Text>
                        ) : null}
                      </View>
                      {mobile ? (
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                          📱 {mobile}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8' }}>
                      {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>

                  <View style={{ gap: 6, marginTop: 8 }}>
                    <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'flex-end' }}>
                      {mobile ? (
                        <TouchableOpacity
                          style={[styles.proCallChip, { height: 32, paddingHorizontal: 12 }]}
                          activeOpacity={0.85}
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            Linking.openURL(`tel:${mobile}`);
                          }}
                        >
                          <Ionicons name="call" size={13} color="#ffffff" />
                          <Text style={styles.proCallChipText}>Call Now</Text>
                        </TouchableOpacity>
                      ) : null}

                      <TouchableOpacity
                        style={[styles.acceptCropBtn, { backgroundColor: isExpanded ? '#475569' : '#1d4ed8', height: 32, paddingHorizontal: 12 }]}
                        activeOpacity={0.85}
                        onPress={() => {
                          if (isExpanded) {
                            setResolvingId(null);
                            setComment('');
                          } else {
                            setResolvingId(req.id);
                            setComment('');
                          }
                        }}
                      >
                        <Ionicons name={isExpanded ? 'close-circle' : 'checkmark-done-circle'} size={14} color="#ffffff" />
                        <Text style={styles.acceptCropBtnText}>{isExpanded ? 'Cancel' : 'Resolve Call'}</Text>
                      </TouchableOpacity>
                    </View>

                    {isExpanded ? (
                      <View style={{ gap: 6, marginTop: 4, backgroundColor: '#f8fafc', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#e2e8f0' }}>
                        <TextInput
                          style={{ borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.xs, padding: 6, fontSize: 11.5, backgroundColor: '#ffffff', minHeight: 48 }}
                          placeholder="Enter call notes / summary..."
                          placeholderTextColor="#94a3b8"
                          value={comment}
                          onChangeText={setComment}
                          multiline
                        />
                        <TouchableOpacity
                          style={[styles.acceptCropBtn, { height: 32, backgroundColor: '#16a34a', justifyContent: 'center' }]}
                          disabled={resolve.isPending || !comment.trim()}
                          onPress={() => handleResolve(req.id)}
                        >
                          {resolve.isPending ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <Text style={styles.acceptCropBtnText}>Submit Notes & Resolve</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function ScheduleList({
  items,
  meta,
  emptyText,
}: {
  items: CropActivitySchedule[] | undefined;
  meta: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string };
  emptyText: string;
}) {
  const [remindedIds, setRemindedIds] = useState<Set<string>>(new Set());
  const visibleItems = (items ?? []).filter((item) => !remindedIds.has(item.id));

  if (visibleItems.length === 0) {
    return <Text style={styles.emptyText}>{emptyText}</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {visibleItems.map((item) => (
        <ScheduleTaskRow
          key={item.id}
          item={item}
          meta={meta}
          onReminded={() => setRemindedIds((prev) => new Set(prev).add(item.id))}
        />
      ))}
    </View>
  );
}

function ScheduleTaskRow({
  item,
  meta,
  onReminded,
}: {
  item: CropActivitySchedule;
  meta: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string };
  onReminded: () => void;
}) {
  const remind = useRemindSchedule();
  const [sent, setSent] = useState(false);

  const handleRemind = async () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await remind.mutateAsync(item.id);
      setSent(true);
      setTimeout(onReminded, 900);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not send reminder.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    }
  };

  return (
    <View style={[styles.taskRow, { backgroundColor: meta.bg, borderColor: meta.border }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.taskRowTop}>
          <Text style={styles.taskFarmer} numberOfLines={1}>
            👨‍🌾 {item.cropCycle?.plot?.farm?.owner?.name ?? 'Farmer'}
          </Text>
          <Text style={[styles.taskDate, { color: meta.color }]}>
            {new Date(item.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
        <Text style={styles.taskTitle}>{item.title}</Text>
        <Text style={styles.taskPlot} numberOfLines={1}>
          📍 {item.cropCycle?.plot?.name} · 🌾 {item.cropCycle?.cropName}
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.remindBtn, { borderColor: meta.color }, sent && styles.remindBtnSent]}
        activeOpacity={0.8}
        disabled={remind.isPending || sent}
        onPress={handleRemind}
      >
        {remind.isPending ? (
          <ActivityIndicator size="small" color={meta.color} />
        ) : sent ? (
          <>
            <Ionicons name="checkmark" size={12} color="#16a34a" />
            <Text style={[styles.remindBtnText, { color: '#16a34a' }]}>Sent</Text>
          </>
        ) : (
          <>
            <Ionicons name="notifications-outline" size={12} color={meta.color} />
            <Text style={[styles.remindBtnText, { color: meta.color }]}>Remind</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const TRIGGER_META: Record<FarmerWeatherAlert['triggers'][number], { label: (a: FarmerWeatherAlert) => string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  RAIN: { label: () => 'Rain expected', icon: 'rainy', color: '#0284c7' },
  MIN_TEMP: { label: (a) => `Below min ${a.minTempC}°C`, icon: 'snow', color: '#2563eb' },
  MAX_TEMP: { label: (a) => `Above max ${a.maxTempC}°C`, icon: 'sunny', color: '#ea580c' },
  WIND: { label: () => 'High wind expected', icon: 'flag', color: '#ca8a04' },
};

function WeatherAlertsList({
  alerts,
  meta,
}: {
  alerts: FarmerWeatherAlert[] | undefined;
  meta: { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string };
}) {
  if (!alerts || alerts.length === 0) {
    return <Text style={styles.emptyText}>No farmers currently crossing their weather-alert limits.</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {alerts.map((alert) => (
        <View key={alert.farmerId} style={[styles.weatherRow, { backgroundColor: meta.bg, borderColor: meta.border }]}>
          <View style={styles.weatherRowTop}>
            <Text style={styles.taskFarmer} numberOfLines={1}>👨‍🌾 {alert.farmerName}</Text>
            <View style={styles.weatherTempPill}>
              <Ionicons name={alert.isRaining ? 'rainy' : 'thermometer-outline'} size={12} color={meta.color} />
              <Text style={[styles.weatherTempText, { color: meta.color }]}>{alert.currentTemperatureC}°C · {alert.condition}</Text>
            </View>
          </View>
          <Text style={styles.taskPlot} numberOfLines={1}>📍 {alert.locationLabel}</Text>
          <View style={styles.weatherChipRow}>
            {alert.triggers.map((trigger) => {
              const t = TRIGGER_META[trigger];
              return (
                <View key={trigger} style={[styles.weatherChip, { borderColor: t.color }]}>
                  <Ionicons name={t.icon} size={11} color={t.color} />
                  <Text style={[styles.weatherChipText, { color: t.color }]}>{t.label(alert)}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },

  ultraRosterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: RADIUS.md,
    paddingVertical: 7,
    paddingHorizontal: 10,
    gap: 6,
  },
  rosterLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  rosterIconBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rosterTitleText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  rosterMetricsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rosterStatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.xs,
  },
  rosterStatVal: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  rosterStatLbl: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: 'rgba(255,255,255,0.85)',
  },
  rosterViewAllBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#f1f5f9' },
  tabRow: { gap: 6, paddingBottom: 10 },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  tabChipText: { fontSize: 11.5, fontFamily: FONT.bold },
  tabChipCount: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabChipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabChipCountText: { fontSize: 9.5, fontFamily: FONT.extraBold },
  tabBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10 },

  emptyText: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', paddingVertical: 20, textAlign: 'center' },
  taskRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: RADIUS.md, padding: 11, borderWidth: 1 },
  taskRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskFarmer: { flex: 1, fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  taskDate: { fontSize: 11, fontFamily: FONT.extraBold },
  taskTitle: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#0f172a', marginTop: 3 },
  taskPlot: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  remindBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
    minWidth: 66,
    justifyContent: 'center',
  },
  remindBtnSent: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  remindBtnText: { fontSize: 10.5, fontFamily: FONT.bold },
  acceptCropBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#1d4ed8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.pill },
  acceptCropBtnText: { color: '#ffffff', fontSize: 11.5, fontFamily: FONT.bold },
  rejectCropBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  callSubTabRow: { flexDirection: 'row', gap: 6 },
  callSubTabChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  callSubTabChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  callListRow: { borderRadius: RADIUS.md, borderWidth: 1, backgroundColor: '#ffffff', paddingHorizontal: 10, paddingVertical: 7 },
  callListRowMain: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  callListDot: { width: 6, height: 6, borderRadius: 3, flex: 0 },
  callListName: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  callListMobile: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  callListDate: { fontSize: 10, fontFamily: FONT.semiBold, color: '#94a3b8' },
  callListResolvedNote: { fontSize: 10.5, fontFamily: FONT.medium, color: '#16a34a', marginTop: 4, marginLeft: 14 },
  callCommentInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    backgroundColor: '#ffffff',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  callResolveBtn: { paddingVertical: 8, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },

  weatherRow: { borderRadius: RADIUS.md, padding: 11, borderWidth: 1, gap: 4 },
  weatherRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  weatherTempPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ffffff', borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3 },
  weatherTempText: { fontSize: 10.5, fontFamily: FONT.extraBold },
  weatherChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  weatherChip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#ffffff' },
  weatherChipText: { fontSize: 10, fontFamily: FONT.bold },

  submissionNotificationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    borderRadius: RADIUS.lg,
    padding: 12,
  },
  notificationBellBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBannerTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#991b1b',
  },
  notificationBannerSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#b91c1c',
    marginTop: 1,
  },
  notificationBannerActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#dc2626',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  notificationBannerActionText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  submissionPulseTabChip: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#b45309',
    letterSpacing: 0.3,
  },
  submissionFarmerHighlight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 7,
    gap: 2,
    marginTop: 3,
  },
  submissionFarmerText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  submissionLocText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#bfdbfe',
    gap: 10,
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewCropTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  reviewCropVariety: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#475569',
  },
  reviewCropCategory: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  landProfileBox: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  landProfileHeaderTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#1e40af',
  },
  landProfileGrid: {
    gap: 4,
  },
  landProfileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  landProfileLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#475569',
    width: 130,
  },
  landProfileVal: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
    flex: 1,
  },
  reviewCardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  fullReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  fullReviewBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#1d4ed8',
  },
  reviewModalSection: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  reviewModalSectionTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 6,
  },
  reviewDetailGrid: {
    gap: 6,
  },
  reviewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 2,
  },
  reviewDetailLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  reviewDetailVal: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  reviewDetailValBold: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  highlightedProfileRow: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    marginVertical: 1,
  },
  reviewNotesText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#334155',
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: RADIUS.xs,
    width: '100%',
    marginTop: 2,
  },
  modalHeaderDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 8,
  },
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
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    maxHeight: '88%',
    ...premiumShadow('#000000', 'lg'),
  },
  proModalHeaderBanner: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  proModalHeaderTag: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#93c5fd',
    letterSpacing: 0.4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  proModalHeaderCategory: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  proModalHeaderTitle: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  proModalCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  proFarmerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  proFarmerName: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  proFarmerMeta: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  proCallChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  proCallChipText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  proCardSection: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  proCardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4,
  },
  proCardSectionTitle: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  proGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  proGridBox: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 1,
  },
  proGridLabel: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  proGridVal: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  proNotesCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    padding: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 2,
    gap: 1,
  },
  proNotesContent: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  proHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  proHighlightLabel: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  proHighlightValGreen: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#047857',
  },
  proHighlightValBlue: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#0284c7',
  },
  proHighlightValSlate: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  proRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fef2f2',
    borderWidth: 1.5,
    borderColor: '#fca5a5',
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  proRejectBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#dc2626',
  },
  proAcceptBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  proAcceptBtnText: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  subFilterRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subFilterChip: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  subFilterChipActive: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
  },
  subFilterText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    textAlign: 'center',
  },
  subFilterTextActive: {
    color: '#1d4ed8',
    fontFamily: FONT.extraBold,
  },
  subFilterBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  subFilterBadgeActive: {
    backgroundColor: '#1d4ed8',
  },
  subFilterBadgeInactive: {
    backgroundColor: '#e2e8f0',
  },
  subFilterBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
  },
  subFilterBadgeTextActive: {
    color: '#ffffff',
  },
  subFilterBadgeTextInactive: {
    color: '#475569',
  },
  performanceAuditStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.sm,
  },
  perfLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  perfRatingText: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#fde047',
  },
  perfReviewsCount: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#dcfce7',
  },
  perfBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  perfBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  perfResponseTime: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#bbf7d0',
  },
});

