import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, TextInput, ActivityIndicator, Alert, Image, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmersList, useFarmerDetails, useAcceptAssignment, useRejectAssignment } from '@/src/hooks/useAdvisorAssignments';
import { useAssignedCropProblems, useRespondToCropProblem } from '@/src/hooks/useCropProblems';
import { useMyCallRequests, useResolveCallRequest } from '@/src/hooks/useCallRequests';
import { AdvisorScheduleTimeline } from '@/src/components/AdvisorScheduleTimeline';
import { RenewModal } from '@/src/components/RenewPlanCard';
import { SprayScheduleCards } from '@/src/components/SprayScheduleCards';
import { SprayDetailCard } from '@/src/components/SprayDetailCard';
import { FarmerProfileModal } from '@/src/components/FarmerProfileModal';
import { useMySprayItemTemplates } from '@/src/hooks/useSprayItemTemplates';
import { WeatherForecastModal } from '@/src/components/WeatherForecastModal';
import { useUserWeather } from '@/src/hooks/useWeather';
import { resolveMediaUrl } from '@/src/api/client';
import { CropProblem, SprayScheduleItem } from '@/src/types/api';

type FarmSubTab = 'PLOTS' | 'PROBLEMS' | 'CALL_REQUESTS';

const theme = RoleThemes.FARM_ADVISOR;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface PlotRow {
  key: string;
  farmerId: string;
  farmerName: string;
  plotName: string;
  cropCategory: string;
  variety: string;
  cropCycleId: string;
  cropName: string;
  area?: number | null;
  sowingDate?: string | null;
}

interface FarmerGroup {
  farmerId: string;
  farmerName: string;
  kingId?: string | null;
  mobile?: string | null;
  state?: string | null;
  photoUrl?: string | null;
  rows: PlotRow[];
}

const SEVERITY_META: Record<string, { color: string; bg: string }> = {
  LOW: { color: '#15803d', bg: '#dcfce7' },
  MEDIUM: { color: '#b45309', bg: '#fef3c7' },
  HIGH: { color: '#c2410c', bg: '#ffedd5' },
  CRITICAL: { color: '#dc2626', bg: '#fee2e2' },
};

const AVATAR_PALETTE = ['#16a34a', '#0d9488', '#2563eb', '#9333ea', '#c2410c', '#be123c'];

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function InitialsAvatar({ name, size = 34 }: { name: string; size?: number }) {
  const bg = colorForName(name || '?');
  return (
    <View style={[styles.initialsAvatar, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.initialsAvatarText, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const WEATHER_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  Clear: 'sunny',
  Clouds: 'cloudy',
  Rain: 'rainy',
  Drizzle: 'rainy',
  Thunderstorm: 'thunderstorm',
  Snow: 'snow',
  Mist: 'cloud-outline',
  Fog: 'cloud-outline',
  Haze: 'cloud-outline',
};

/** Compact per-farmer weather chip — opens 7-day forecast modal on tap with blinking alert indicator. */
function FarmerWeatherChip({ farmerId }: { farmerId: string }) {
  const { data, isLoading, isError } = useUserWeather(farmerId);
  const [modalVisible, setModalVisible] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const alertInfo = useMemo(() => {
    if (!data) return null;
    const forecast = data.forecast ?? [];

    const isRain = data.isRaining || forecast.some((d) => d.isRaining || d.precipitationMm >= 3.0);
    const isHeat = forecast.some((d) => d.maxTempC >= 37);
    const isCold = forecast.some((d) => d.minTempC <= 10);
    const isWind = forecast.some((d) => d.windSpeedMs >= 7.0 || (d.windSpeedMs >= 25.0 && d.windSpeedMs < 100));

    const isHighRain = forecast.some((d) => d.precipitationMm >= 15.0) || (data.isRaining && forecast.some((d) => d.precipitationMm >= 10.0));
    const isHighHeat = forecast.some((d) => d.maxTempC >= 41);
    const isHighCold = forecast.some((d) => d.minTempC <= 5);
    const isHighWind = forecast.some((d) => d.windSpeedMs >= 15.0);

    if (isRain) return { icon: 'rainy' as const, text: `${data.temperatureC}°C 🌧️`, bg: '#0284c7', border: '#0369a1', textColor: '#ffffff', isHigh: isHighRain };
    if (isHeat) return { icon: 'sunny' as const, text: `${data.temperatureC}°C 🔥`, bg: '#dc2626', border: '#991b1b', textColor: '#ffffff', isHigh: isHighHeat };
    if (isCold) return { icon: 'snow' as const, text: `${data.temperatureC}°C ❄️`, bg: '#1d4ed8', border: '#1e40af', textColor: '#ffffff', isHigh: isHighCold };
    if (isWind) return { icon: 'flag' as const, text: `${data.temperatureC}°C 💨`, bg: '#d97706', border: '#b45309', textColor: '#ffffff', isHigh: isHighWind };

    return null;
  }, [data]);

  const shouldBlink = alertInfo?.isHigh === true;

  useEffect(() => {
    if (shouldBlink) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.15,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      );
      animation.start();
      return () => animation.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [shouldBlink, blinkAnim]);

  if (isLoading) return <ActivityIndicator size="small" color={theme.primary} style={{ marginHorizontal: 6 }} />;
  if (isError || !data) return null;
  return (
    <>
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={() => {
          tap();
          setModalVisible(true);
        }}
      >
        <Animated.View
          style={[
            styles.weatherChip,
            alertInfo
              ? { backgroundColor: alertInfo.bg, borderColor: alertInfo.border, opacity: shouldBlink ? blinkAnim : 1 }
              : null,
          ]}
        >
          <Ionicons
            name={alertInfo ? alertInfo.icon : (WEATHER_ICON[data.condition] ?? 'partly-sunny')}
            size={14}
            color={alertInfo ? alertInfo.textColor : '#0369a1'}
          />
          <Text
            style={[
              styles.weatherChipText,
              { color: alertInfo ? alertInfo.textColor : '#0369a1', fontFamily: FONT.extraBold },
            ]}
          >
            {alertInfo ? alertInfo.text : `${data.temperatureC}°C`}
          </Text>
        </Animated.View>
      </TouchableOpacity>

      <WeatherForecastModal visible={modalVisible} weather={data} onClose={() => setModalVisible(false)} />
    </>
  );
}

export default function AdvisorFarmsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FarmSubTab>('PLOTS');
  const [expandedFarmerId, setExpandedFarmerId] = useState<string | null>(null);
  const [expandedCropCycleId, setExpandedCropCycleId] = useState<string | null>(null);
  const [isProblemHistoryOpen, setIsProblemHistoryOpen] = useState(false);
  const [historyPage, setHistoryPage] = useState<number>(1);
  const [sprayDetailItem, setSprayDetailItem] = useState<SprayScheduleItem | null>(null);
  const [sprayDetailTitle, setSprayDetailTitle] = useState('');
  const [profileModalFarmerId, setProfileModalFarmerId] = useState<string | null>(null);
  const [profileModalAssignmentId, setProfileModalAssignmentId] = useState<string | null>(null);

  const { data: activeAssignments, isLoading: isLoadingAssignments } = useFarmersList('ACTIVE');
  const farmerIds = useMemo(() => (activeAssignments ?? []).map((a) => a.farmerId), [activeAssignments]);
  const farmerDetailQueries = useFarmerDetails(farmerIds);
  const isLoadingDetails = farmerDetailQueries.some((q) => q.isLoading);

  const { data: assignedProblems, isLoading: isLoadingProblems } = useAssignedCropProblems();
  const { data: callRequests } = useMyCallRequests();
  const resolveCallRequest = useResolveCallRequest();
  const pendingCallRequests = useMemo(() => (callRequests ?? []).filter((r) => r.status === 'PENDING'), [callRequests]);
  const resolvedCallRequests = useMemo(() => (callRequests ?? []).filter((r) => r.status === 'RESOLVED'), [callRequests]);

  // "Active" = still waiting on the advisor (new report or under review) — these drive the notification/badge
  // count. Once the advisor responds (status moves to ADVISOR_RESPONDED) or it's later closed/resolved, it
  // moves to History — this is the signal the advisor has "cleared" it.
  const activeProblems = useMemo(
    () => (assignedProblems ?? []).filter((p) => p.status === 'REPORTED' || p.status === 'UNDER_REVIEW'),
    [assignedProblems],
  );
  const historyProblems = useMemo(
    () => (assignedProblems ?? []).filter((p) => p.status !== 'REPORTED' && p.status !== 'UNDER_REVIEW'),
    [assignedProblems],
  );

  // "ALL" includes farmers whose plan has lapsed (they drop out of the ACTIVE list above but their assignment.status is still ACTIVE) —
  // used only to surface a renew action for them, since they'd otherwise become unreachable once hidden from the roster.
  const { data: allAssignments } = useFarmersList('ALL');
  const { data: pendingAssignments } = useFarmersList('PENDING');
  const acceptAssignment = useAcceptAssignment();
  const rejectAssignment = useRejectAssignment();
  const expiredAssignments = useMemo(
    () =>
      (allAssignments ?? []).filter((a) => {
        const endDate = a.subscription?.endDate ? new Date(a.subscription.endDate) : null;
        return a.status === 'ACTIVE' && endDate && endDate.getTime() < Date.now();
      }),
    [allAssignments],
  );
  const [renewingFarmerId, setRenewingFarmerId] = useState<string | null>(null);

  const plotRows = useMemo<PlotRow[]>(() => {
    const rows: PlotRow[] = [];
    farmerDetailQueries.forEach((query) => {
      const detail = query.data;
      if (!detail) return;
      detail.farmer.farms.forEach((farm) => {
        farm.plots.forEach((plot) => {
          plot.cropCycles.forEach((cropCycle) => {
            if (cropCycle.stage === 'COMPLETED' || cropCycle.status === 'COMPLETED' || cropCycle.status === 'FAILED') return;
            rows.push({
              key: cropCycle.id,
              farmerId: detail.farmer.id,
              farmerName: detail.farmer.name,
              plotName: plot.name,
              cropCategory: cropCycle.category ?? '—',
              variety: cropCycle.variety ?? '—',
              cropCycleId: cropCycle.id,
              cropName: cropCycle.cropName,
              area: cropCycle.area,
              sowingDate: cropCycle.sowingDate,
            });
          });
        });
      });
    });
    return rows;
  }, [farmerDetailQueries]);

  const farmerProfileById = useMemo(() => {
    const map = new Map<string, { kingId?: string | null; mobile?: string | null; state?: string | null; photoUrl?: string | null }>();
    farmerDetailQueries.forEach((query) => {
      const farmer = query.data?.farmer;
      if (farmer) map.set(farmer.id, { kingId: farmer.kingId, mobile: farmer.mobile, state: farmer.state, photoUrl: farmer.photoUrl });
    });
    return map;
  }, [farmerDetailQueries]);

  const farmerGroups = useMemo<FarmerGroup[]>(() => {
    const map = new Map<string, FarmerGroup>();

    (activeAssignments ?? []).forEach((assignment) => {
      const f = assignment.farmer;
      if (f && !map.has(f.id)) {
        map.set(f.id, {
          farmerId: f.id,
          farmerName: f.name ?? 'Farmer',
          kingId: f.kingId,
          mobile: f.mobile,
          state: f.state,
          photoUrl: f.photoUrl,
          rows: [],
        });
      }
    });

    plotRows.forEach((row) => {
      if (!map.has(row.farmerId)) {
        const profile = farmerProfileById.get(row.farmerId);
        map.set(row.farmerId, {
          farmerId: row.farmerId,
          farmerName: row.farmerName,
          kingId: profile?.kingId,
          mobile: profile?.mobile,
          state: profile?.state,
          photoUrl: profile?.photoUrl,
          rows: [],
        });
      }
      map.get(row.farmerId)!.rows.push(row);
    });
    return Array.from(map.values());
  }, [activeAssignments, plotRows, farmerProfileById]);

  const toggleExpand = (cropCycleId: string) => {
    tap();
    setExpandedCropCycleId((current) => (current === cropCycleId ? null : cropCycleId));
  };

  const toggleFarmerCollapse = (farmerId: string) => {
    tap();
    setExpandedFarmerId((current) => (current === farmerId ? null : farmerId));
  };

  const openSprayDetail = (item: SprayScheduleItem, title: string) => {
    setSprayDetailItem(item);
    setSprayDetailTitle(title);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Farms & Crop Supervision</Text>
        <Text style={styles.heroSubtitle}>Manage farmer plots, advisory schedules & problem reports</Text>

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'PLOTS' && styles.tabChipActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setActiveTab('PLOTS');
            }}
          >
            <Ionicons name="people-outline" size={14} color={activeTab === 'PLOTS' ? theme.primary : '#fff'} />
            <Text style={[styles.tabChipText, activeTab === 'PLOTS' && { color: theme.primary }]}>
              Farmers ({farmerGroups.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabChip, activeTab === 'PROBLEMS' && styles.tabChipActive]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              setActiveTab('PROBLEMS');
            }}
          >
            <Ionicons name="medkit-outline" size={14} color={activeTab === 'PROBLEMS' ? theme.primary : '#fff'} />
            <Text style={[styles.tabChipText, activeTab === 'PROBLEMS' && { color: theme.primary }]}>
              Problem Reports ({activeProblems.length})
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>

        {pendingAssignments && pendingAssignments.length > 0 ? (
          <View style={[styles.pendingCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.pendingTitle}>🔔 New Farmer Hire Requests ({pendingAssignments.length})</Text>
            {pendingAssignments.map((a) => (
              <View key={a.id} style={styles.pendingRow}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}
                  activeOpacity={0.7}
                  onPress={() => {
                    tap();
                    setProfileModalFarmerId(a.farmerId);
                    setProfileModalAssignmentId(a.id);
                  }}
                >
                  <InitialsAvatar name={a.farmer?.name ?? 'Farmer'} size={32} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.pendingFarmerName} numberOfLines={1}>{a.farmer?.name ?? 'Farmer'}</Text>
                      <View style={styles.viewProfileChip}>
                        <Ionicons name="eye-outline" size={10} color="#15803d" />
                        <Text style={styles.viewProfileChipText}>Profile</Text>
                      </View>
                    </View>
                    <Text style={styles.pendingFarmerMeta} numberOfLines={1}>
                      {a.farmer?.kingId ? `🔑 ${a.farmer.kingId} · ` : ''}{a.farmer?.mobile ? `📱 ${a.farmer.mobile}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptBtn}
                  activeOpacity={0.85}
                  disabled={acceptAssignment.isPending}
                  onPress={() => {
                    tap();
                    acceptAssignment.mutate(a.id);
                  }}
                >
                  <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                  <Text style={styles.acceptBtnText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectBtn}
                  activeOpacity={0.85}
                  disabled={rejectAssignment.isPending}
                  onPress={() => {
                    tap();
                    rejectAssignment.mutate({ id: a.id });
                  }}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {expiredAssignments.length > 0 ? (
          <View style={[styles.expiredCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.expiredTitle}>⚠️ Plans Expired — Renew to Restore Access</Text>
            {expiredAssignments.map((a) => (
              <View key={a.id} style={styles.expiredRow}>
                <Text style={styles.expiredFarmerName} numberOfLines={1}>{a.farmer?.name ?? 'Farmer'}</Text>
                <TouchableOpacity
                  style={styles.expiredRenewBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    tap();
                    setRenewingFarmerId(a.farmerId);
                  }}
                >
                  <Ionicons name="refresh-circle" size={14} color="#ffffff" />
                  <Text style={styles.expiredRenewBtnText}>Renew</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null}

        {activeTab === 'PLOTS' ? (
          isLoadingAssignments || isLoadingDetails ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
          ) : farmerGroups.length === 0 ? (
            <View style={styles.emptyCenter}>
              <Ionicons name="leaf-outline" size={36} color="#cbd5e1" />
              <Text style={styles.emptyTitle}>No Active Farms Under Advisor</Text>
              <Text style={styles.emptySub}>Once farmers subscribe and get assigned to you, their plots appear here.</Text>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {farmerGroups.map((group) => {
                const isCollapsed = expandedFarmerId !== group.farmerId;
                return (
                  <View key={group.farmerId} style={[styles.farmerGroupCard, premiumShadow('#0f172a', 'sm')]}>
                    <TouchableOpacity
                      style={styles.farmerGroupHeaderRow}
                      activeOpacity={0.7}
                      onPress={() => toggleFarmerCollapse(group.farmerId)}
                    >
                      {group.photoUrl ? (
                        <Image source={{ uri: resolveMediaUrl(group.photoUrl) }} style={styles.farmerPhoto} />
                      ) : (
                        <InitialsAvatar name={group.farmerName} />
                      )}
                      <TouchableOpacity
                        style={styles.plotCardInfo}
                        activeOpacity={0.7}
                        onPress={() => {
                          tap();
                          setProfileModalFarmerId(group.farmerId);
                          setProfileModalAssignmentId(null);
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.plotCardFarmer} numberOfLines={1}>{group.farmerName}</Text>
                          <View style={styles.viewProfileChip}>
                            <Ionicons name="eye-outline" size={10} color="#15803d" />
                            <Text style={styles.viewProfileChipText}>Profile</Text>
                          </View>
                        </View>
                        <Text style={styles.plotCardMeta} numberOfLines={1}>
                          {group.kingId ? `🔑 ${group.kingId} · ` : ''}🌾 {group.rows.length} crop{group.rows.length === 1 ? '' : 's'}
                        </Text>
                        <Text style={styles.plotCardMeta} numberOfLines={1}>
                          {group.mobile ? `📱 ${group.mobile}` : ''}{group.mobile && group.state ? ' · ' : ''}{group.state ? `📍 ${group.state}` : ''}
                        </Text>
                      </TouchableOpacity>
                      <FarmerWeatherChip farmerId={group.farmerId} />
                      <View style={[styles.expandBtn, !isCollapsed && { backgroundColor: theme.primary }]}>
                        <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={15} color={!isCollapsed ? '#ffffff' : theme.primary} />
                      </View>
                    </TouchableOpacity>

                    {!isCollapsed ? (
                      <View style={styles.farmerGroupBody}>
                        {group.rows.length === 0 ? (
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', paddingVertical: 8 }}>
                            No crops added yet by this farmer.
                          </Text>
                        ) : (
                          group.rows.map((row) => {
                          const isExpanded = expandedCropCycleId === row.cropCycleId;
                          return (
                            <View key={row.key} style={styles.cropCard}>
                              <View style={styles.cropCardHeaderRow}>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.cropCardTitle} numberOfLines={1}>
                                    📍 {row.plotName} · 🌾 {row.cropName}
                                  </Text>
                                  <Text style={styles.plotCardMeta} numberOfLines={1}>
                                    {row.cropCategory}{row.variety && row.variety !== '—' ? ` · ${row.variety}` : ''}
                                    {row.area ? ` · 📏 ${row.area}` : ''}
                                    {row.sowingDate ? ` · 📅 Sown: ${new Date(row.sowingDate).toLocaleDateString('en-IN')}` : ''}
                                  </Text>
                                </View>

                                {/* Satellite Information Button in Empty Space */}
                                <TouchableOpacity
                                  style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                    backgroundColor: '#eff6ff',
                                    borderWidth: 1.5,
                                    borderColor: '#bfdbfe',
                                    paddingHorizontal: 9,
                                    paddingVertical: 6,
                                    borderRadius: RADIUS.pill,
                                    marginLeft: 6,
                                  }}
                                  activeOpacity={0.85}
                                  onPress={() => {
                                    tap();
                                    router.push({
                                      pathname: '/(tabs)/satellite-map',
                                      params: {
                                        cropId: row.cropCycleId,
                                        cropName: row.cropName,
                                        farmerName: row.farmerName,
                                        plotName: row.plotName,
                                        area: row.area,
                                        sowingDate: row.sowingDate,
                                      },
                                    } as any);
                                  }}
                                >
                                  <Ionicons name="planet" size={13} color="#2563eb" />
                                  <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: '#1d4ed8' }}>
                                    🛰️ Satellite View
                                  </Text>
                                </TouchableOpacity>
                              </View>

                              <SprayScheduleCards
                                cropCycleId={row.cropCycleId}
                                accentColor={theme.primary}
                                onViewDetail={(item) => openSprayDetail(item, `${row.plotName} (${row.cropName})`)}
                              />

                              <TouchableOpacity
                                style={styles.viewTimelineBtn}
                                activeOpacity={0.85}
                                onPress={() => toggleExpand(row.cropCycleId)}
                              >
                                <Ionicons name={isExpanded ? 'chevron-up' : 'list-outline'} size={13} color={theme.primary} />
                                <Text style={styles.viewTimelineBtnText}>{isExpanded ? 'Hide Full Timeline' : 'View Full Timeline'}</Text>
                              </TouchableOpacity>

                              {isExpanded ? (
                                <View style={styles.expandedPanel}>
                                  <AdvisorScheduleTimeline
                                    cropCycleId={row.cropCycleId}
                                    cropName={row.cropName}
                                    farmerName={row.farmerName}
                                  />
                                </View>
                              ) : null}
                            </View>
                          );
                        })
                        )}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )
        ) : activeTab === 'PROBLEMS' ? (
          /* PROBLEM REPORTS TAB */
          <View style={{ gap: 12 }}>
            {isLoadingProblems ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
            ) : !assignedProblems || assignedProblems.length === 0 ? (
              <View style={styles.emptyCenter}>
                <Ionicons name="checkmark-done-circle-outline" size={36} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>No Problem Reports</Text>
                <Text style={styles.emptySub}>Problems your farmers report will show up here.</Text>
              </View>
            ) : (
              <>
                {activeProblems.length === 0 ? (
                  <View style={styles.emptyCenter}>
                    <Ionicons name="checkmark-done-circle-outline" size={36} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>All Caught Up</Text>
                    <Text style={styles.emptySub}>No problem reports waiting on you right now.</Text>
                  </View>
                ) : (
                  activeProblems.map((problem) => <ProblemCard key={problem.id} problem={problem} />)
                )}

                {historyProblems.length > 0 ? (
                  <View style={{ gap: 10 }}>
                    <TouchableOpacity
                      style={styles.historyHeaderRow}
                      activeOpacity={0.7}
                      onPress={() => {
                        tap();
                        setIsProblemHistoryOpen((v) => !v);
                      }}
                    >
                      <Text style={styles.historyHeaderText}>Problems History ({historyProblems.length})</Text>
                      <Ionicons name={isProblemHistoryOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#64748b" />
                    </TouchableOpacity>
                    {isProblemHistoryOpen ? (
                      <View style={{ gap: 10 }}>
                        {(() => {
                          const HISTORY_PAGE_SIZE = 10;
                          const totalHistoryPages = Math.ceil(historyProblems.length / HISTORY_PAGE_SIZE) || 1;
                          const start = (historyPage - 1) * HISTORY_PAGE_SIZE;
                          const paginatedHistory = historyProblems.slice(start, start + HISTORY_PAGE_SIZE);

                          return (
                            <>
                              {paginatedHistory.map((problem) => (
                                <ProblemCard key={problem.id} problem={problem} />
                              ))}

                              {/* Pagination Bar (10 items per page) */}
                              {totalHistoryPages > 1 && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4 }}>
                                  <TouchableOpacity
                                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.xs, backgroundColor: historyPage > 1 ? theme.primary : '#cbd5e1', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    disabled={historyPage <= 1}
                                    onPress={() => setHistoryPage((p) => Math.max(p - 1, 1))}
                                  >
                                    <Ionicons name="chevron-back" size={14} color="#ffffff" />
                                    <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: FONT.bold }}>Prev</Text>
                                  </TouchableOpacity>

                                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>
                                    Page {historyPage} of {totalHistoryPages} ({historyProblems.length} Items)
                                  </Text>

                                  <TouchableOpacity
                                    style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.xs, backgroundColor: historyPage < totalHistoryPages ? theme.primary : '#cbd5e1', flexDirection: 'row', alignItems: 'center', gap: 4 }}
                                    disabled={historyPage >= totalHistoryPages}
                                    onPress={() => setHistoryPage((p) => Math.min(p + 1, totalHistoryPages))}
                                  >
                                    <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: FONT.bold }}>Next</Text>
                                    <Ionicons name="chevron-forward" size={14} color="#ffffff" />
                                  </TouchableOpacity>
                                </View>
                              )}
                            </>
                          );
                        })()}
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </>
            )}
          </View>
        ) : (
          /* CALL REQUESTS TAB */
          <View style={{ gap: 12 }}>
            <View style={[styles.callBannerCard, premiumShadow('#0f172a', 'sm')]}>
              <Text style={styles.callBannerTitle}>📞 Pending Call Requests ({pendingCallRequests.length})</Text>
              {pendingCallRequests.length === 0 ? (
                <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', marginVertical: 10 }}>
                  No pending call requests right now.
                </Text>
              ) : (
                pendingCallRequests.map((req) => (
                  <View key={req.id} style={styles.callBannerRow}>
                    <InitialsAvatar name={req.farmer?.name ?? 'Farmer'} size={32} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.callFarmerName} numberOfLines={1}>{req.farmer?.name ?? 'Farmer'}</Text>
                      <Text style={styles.callFarmerMeta} numberOfLines={1}>
                        {req.farmer?.kingId ? `🔑 ${req.farmer.kingId} · ` : ''}{req.farmer?.mobile ? `📱 ${req.farmer.mobile}` : ''}
                      </Text>
                    </View>
                    {req.farmer?.mobile ? (
                      <TouchableOpacity
                        style={styles.callNowBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                          tap();
                          Linking.openURL(`tel:${req.farmer?.mobile}`);
                        }}
                      >
                        <Ionicons name="call" size={13} color="#ffffff" />
                        <Text style={styles.callNowBtnText}>Call</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={styles.doneCallBtn}
                      activeOpacity={0.85}
                      disabled={resolveCallRequest.isPending}
                      onPress={() => {
                        tap();
                        resolveCallRequest.mutate({ id: req.id, comment: 'Done' });
                      }}
                    >
                      <Ionicons name="checkmark-done" size={14} color="#15803d" />
                      <Text style={styles.doneCallBtnText}>Done</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            {resolvedCallRequests.length > 0 ? (
              <View style={[styles.callBannerCard, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
                <Text style={[styles.callBannerTitle, { color: '#64748b' }]}>Resolved History ({resolvedCallRequests.length})</Text>
                {resolvedCallRequests.map((req) => (
                  <View key={req.id} style={[styles.callBannerRow, { opacity: 0.75 }]}>
                    <InitialsAvatar name={req.farmer?.name ?? 'Farmer'} size={28} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.callFarmerName} numberOfLines={1}>{req.farmer?.name ?? 'Farmer'}</Text>
                      <Text style={styles.callFarmerMeta} numberOfLines={1}>
                        Resolved · {req.resolvedAt ? new Date(req.resolvedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        )}
      </ScrollView>

      <RenewModal
        visible={!!renewingFarmerId}
        farmerId={renewingFarmerId ?? undefined}
        onClose={() => setRenewingFarmerId(null)}
      />

      <Modal visible={!!sprayDetailItem} transparent animationType="slide" onRequestClose={() => setSprayDetailItem(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>🧪 Spray Schedule Detail</Text>
                <Text style={styles.modalSub}>{sprayDetailTitle}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSprayDetailItem(null)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalHeaderDivider} />

            {sprayDetailItem ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <SprayDetailCard item={sprayDetailItem} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      <FarmerProfileModal
        visible={!!profileModalFarmerId}
        farmerId={profileModalFarmerId}
        assignmentId={profileModalAssignmentId}
        onClose={() => {
          setProfileModalFarmerId(null);
          setProfileModalAssignmentId(null);
        }}
      />
    </View>
  );
}

function ProblemCard({ problem }: { problem: CropProblem }) {
  const respond = useRespondToCropProblem();
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [advisorResponse, setAdvisorResponse] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState<string[]>([]);
  const { data: itemTemplatesForSearch } = useMySprayItemTemplates();

  const severityMeta = SEVERITY_META[problem.severity ?? 'MEDIUM'];
  const productQueryLower = productQuery.trim().toLowerCase();
  const doseSuggestions = productQueryLower
    ? (itemTemplatesForSearch ?? []).filter((t) => t.item.toLowerCase().includes(productQueryLower)).slice(0, 6)
    : [];

  const photoCount = problem.photos?.length ?? 0;

  const addRecommendedProduct = (composed: string) => {
    tap();
    setRecommendedProducts((prev) => [...prev, composed]);
    setProductQuery('');
  };

  const removeRecommendedProduct = (idx: number) => {
    tap();
    setRecommendedProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const submitResponse = async () => {
    if (!advisorResponse.trim()) return;
    const recommendedProduct = [...recommendedProducts, productQuery.trim()].filter(Boolean).join(', ');
    try {
      const result = await respond.mutateAsync({
        id: problem.id,
        payload: { advisorResponse: advisorResponse.trim(), recommendedProduct: recommendedProduct || undefined },
      });
      setIsRespondOpen(false);
      setAdvisorResponse('');
      setProductQuery('');
      setRecommendedProducts([]);
      const message = result.insertedScheduleDate
        ? `Solution inserted in schedule for ${new Date(result.insertedScheduleDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}.`
        : 'Response sent to the farmer.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Response Sent', message);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not send response.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    }
  };

  return (
    <View style={[styles.problemCard, premiumShadow('#0f172a', 'sm')]}>
      <TouchableOpacity
        style={styles.cardHeaderRow}
        activeOpacity={0.7}
        onPress={() => {
          tap();
          setIsExpanded((prev) => !prev);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <Text style={styles.plotTitle}>⚠️ {problem.title}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severityMeta.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: severityMeta.color }]} />
            <Text style={[styles.severityBadgeText, { color: severityMeta.color }]}>{problem.severity ?? 'MEDIUM'}</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{problem.status.replace('_', ' ')}</Text>
          </View>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.problemIdentityRow}
        activeOpacity={0.7}
        onPress={() => {
          tap();
          setIsExpanded((prev) => !prev);
        }}
      >
        <InitialsAvatar name={problem.reportedBy?.name ?? 'Farmer'} size={28} />
        <Text style={styles.farmerSub} numberOfLines={1}>
          {problem.reportedBy?.name ?? 'Farmer'} · 🌾 {problem.cropCycle?.cropName ?? '—'}
        </Text>
        {photoCount > 0 && (
          <View style={{ backgroundColor: '#fff1f2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: '#fca5a5', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="camera-outline" size={11} color="#dc2626" />
            <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#dc2626' }}>{photoCount} Photo{photoCount > 1 ? 's' : ''}</Text>
          </View>
        )}
        {problem.farmerRating ? (
          <View style={{ backgroundColor: '#fffbeb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: '#fde68a', flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="star" size={10} color="#d97706" />
            <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#b45309' }}>{problem.farmerRating}/5 ⭐</Text>
          </View>
        ) : null}
      </TouchableOpacity>

      {isExpanded ? (
        <>
          <Text style={styles.problemDescription}>{problem.description}</Text>

          {/* Disease Photo Attachments Gallery */}
          {problem.photos && problem.photos.length > 0 ? (
            <View style={{ marginVertical: 6, gap: 4 }}>
              <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>
                📷 Disease Photos ({problem.photos.length}):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {problem.photos.map((p, idx) => {
                  const fullUrl = resolveMediaUrl(p.photoUrl);
                  return (
                    <TouchableOpacity
                      key={p.id || idx}
                      activeOpacity={0.85}
                      onPress={() => fullUrl && setSelectedPreviewImage(fullUrl)}
                      style={{ position: 'relative', borderRadius: RADIUS.sm, overflow: 'hidden', borderWidth: 1, borderColor: '#cbd5e1' }}
                    >
                      <Image source={{ uri: fullUrl }} style={{ width: 68, height: 68 }} />
                      <View style={{ position: 'absolute', bottom: 3, right: 3, backgroundColor: 'rgba(0,0,0,0.6)', padding: 3, borderRadius: 10 }}>
                        <Ionicons name="expand" size={10} color="#ffffff" />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          ) : null}

          {problem.advisorResponse ? (
            <View style={styles.responseBox}>
              <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
              <Text style={styles.responseText} numberOfLines={1}>{problem.advisorResponse}</Text>
            </View>
          ) : null}

          {/* Farmer Rating & Feedback */}
          {problem.farmerRating ? (
            <View style={{ backgroundColor: '#fffbeb', padding: 8, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: '#fde68a', marginVertical: 4, gap: 3 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= (problem.farmerRating || 0) ? 'star' : 'star-outline'}
                    size={14}
                    color="#d97706"
                  />
                ))}
                <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#b45309', marginLeft: 2 }}>
                  Farmer Rating: {problem.farmerRating}/5 Stars
                </Text>
              </View>
              {problem.farmerFeedback ? (
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#92400e', fontStyle: 'italic' }}>
                  💬 Feedback: "{problem.farmerFeedback}"
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.actionBtnRow}>
            <TouchableOpacity
              style={styles.respondBtn}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                setIsRespondOpen(true);
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.primary} />
              <Text style={styles.respondBtnText}>{problem.advisorResponse ? 'Update Response' : 'Respond'}</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : null}

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

      {/* Respond Modal */}
      <Modal visible={isRespondOpen} transparent animationType="fade" onRequestClose={() => setIsRespondOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Respond to Problem</Text>
                <Text style={styles.modalSub}>{problem.title}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsRespondOpen(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalHeaderDivider} />

            <Text style={styles.label}>Your Response</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Diagnosis & advice for the farmer..."
              placeholderTextColor="#94a3b8"
              value={advisorResponse}
              onChangeText={setAdvisorResponse}
              multiline
            />

            <Text style={styles.label}>Recommended Product (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="Type to search Dose Items, or write free text"
              placeholderTextColor="#94a3b8"
              value={productQuery}
              onChangeText={setProductQuery}
            />
            {doseSuggestions.length > 0 ? (
              <View style={styles.itemSuggestBox}>
                {doseSuggestions.map((s) => (
                  <TouchableOpacity
                    key={s.id}
                    style={styles.itemSuggestRow}
                    onPress={() => addRecommendedProduct(s.dose ? `${s.item} (${s.dose})` : s.item)}
                  >
                    <Ionicons name="add-circle-outline" size={14} color={theme.primary} />
                    <Text style={styles.itemSuggestText}>
                      {s.item}
                      {s.dose ? <Text style={styles.itemSuggestDose}> · {s.dose}</Text> : null}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
            {recommendedProducts.length > 0 ? (
              <View style={styles.itemChipRow}>
                {recommendedProducts.map((it, idx) => (
                  <View key={idx} style={styles.itemChip}>
                    <Text style={styles.itemChipText}>{it}</Text>
                    <TouchableOpacity onPress={() => removeRecommendedProduct(idx)}>
                      <Ionicons name="close-circle" size={14} color="#94a3b8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : null}
            {recommendedProducts.length > 0 || productQuery.trim() ? (
              <Text style={styles.recommendedProductHint}>
                <Ionicons name="calendar-outline" size={11} color="#64748b" /> Will be added to the farmer's spray schedule on send.
              </Text>
            ) : null}

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
              disabled={respond.isPending}
              onPress={submitResponse}
            >
              {respond.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="send" size={16} color="#ffffff" />
                  <Text style={styles.modalSubmitBtnText}>Send Response</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  tabChipActive: { backgroundColor: '#ffffff' },
  tabChipText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },
  list: { padding: SPACING.lg, gap: 12, paddingBottom: SPACING.xxl },
  pendingCard: { backgroundColor: '#f0fdf4', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1.5, borderColor: '#86efac', gap: 10 },
  pendingTitle: { fontSize: 13, fontFamily: FONT.extraBold, color: '#15803d' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#dcfce7' },
  pendingFarmerName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  pendingFarmerMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  viewProfileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  viewProfileChipText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill },
  acceptBtnText: { color: '#ffffff', fontSize: 11.5, fontFamily: FONT.bold },
  rejectBtn: { padding: 4 },
  expiredCard: { backgroundColor: '#fef2f2', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#fca5a5', gap: 8 },
  expiredTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#dc2626' },
  expiredRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  expiredFarmerName: { flex: 1, fontSize: 13, fontFamily: FONT.semiBold, color: '#7f1d1d' },
  expiredRenewBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill },
  expiredRenewBtnText: { color: '#ffffff', fontSize: 11.5, fontFamily: FONT.bold },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  historyHeaderText: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#334155' },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 6 },
  emptyTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#334155' },
  emptySub: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },

  initialsAvatar: { alignItems: 'center', justifyContent: 'center' },
  initialsAvatarText: { color: '#ffffff', fontFamily: FONT.extraBold, letterSpacing: 0.2 },
  farmerPhoto: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#e2e8f0' },
  weatherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 4,
  },
  weatherChipText: { fontSize: 11, fontFamily: FONT.bold, color: '#0369a1' },

  farmerGroupCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#f1f5f9', overflow: 'hidden' },
  farmerGroupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: SPACING.md,
  },
  farmerGroupBody: {
    backgroundColor: '#fafbfc',
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 10,
  },
  plotCardInfo: { flex: 1, minWidth: 0 },
  plotCardFarmer: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  plotCardMeta: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  expandBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: theme.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', padding: SPACING.md, gap: 4 },
  cropCardHeaderRow: { flexDirection: 'row', alignItems: 'flex-start' },
  cropCardTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  viewTimelineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginTop: 8,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: theme.primaryLight,
  },
  viewTimelineBtnText: { fontSize: 11.5, fontFamily: FONT.bold, color: theme.primary },
  expandedPanel: {
    backgroundColor: '#fafbfc',
    marginTop: 8,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  problemCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  plotTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  badgeDot: { width: 5, height: 5, borderRadius: 2.5 },
  severityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  severityBadgeText: { fontSize: 10, fontFamily: FONT.bold },
  statusBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  statusBadgeText: { fontSize: 10, fontFamily: FONT.bold, color: '#475569' },
  problemIdentityRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  farmerSub: { flex: 1, fontSize: 12, color: '#475569', fontFamily: FONT.medium },
  problemDescription: { fontSize: 12.5, color: '#334155', fontFamily: FONT.medium, lineHeight: 18 },
  responseBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#f0fdf4', borderRadius: RADIUS.pill,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: '#bbf7d0', alignSelf: 'flex-start',
  },
  responseText: { fontSize: 11, fontFamily: FONT.semiBold, color: '#15803d', flexShrink: 1 },
  actionBtnRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  respondBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: theme.primaryLight,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  respondBtnText: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary },
  itemSuggestBox: { marginTop: 6, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: RADIUS.md, overflow: 'hidden', backgroundColor: '#f8fafc' },
  itemSuggestRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#eef2f7' },
  itemSuggestText: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  itemSuggestDose: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  itemChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  itemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  itemChipText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#15803d' },
  recommendedProductHint: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 4 },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: 4,
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center' },
  modalHeaderDivider: { height: 1, backgroundColor: '#f1f5f9', marginTop: 10, marginBottom: 8 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary, marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginTop: 8, marginBottom: 4 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0f172a',
  },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    marginTop: 14,
  },
  modalSubmitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },
  callBannerCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  callBannerTitle: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  callBannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  callFarmerName: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  callFarmerMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  callNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  callNowBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
  doneCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    borderWidth: 1,
    borderColor: '#86efac',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  doneCallBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#15803d' },
});
