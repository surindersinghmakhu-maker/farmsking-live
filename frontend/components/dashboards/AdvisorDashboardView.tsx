import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { useAuth } from '@/src/store/auth-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerStats } from '@/src/hooks/useAdvisorAssignments';
import {
  useAdvisorDelayedSchedule,
  useAdvisorTodaySchedule,
  useRemindSchedule,
} from '@/src/hooks/useCropActivitySchedules';
import { useAcceptCropByAdvisor, useRejectCropByAdvisor, usePendingCropsForAdvisor } from '@/src/hooks/useCrops';
import { useMyCallRequests, useResolveCallRequest } from '@/src/hooks/useCallRequests';
import { useAdvisorWeatherAlerts } from '@/src/hooks/useWeather';
import type { CallRequest } from '@/src/api/callRequests.api';
import type { FarmerWeatherAlert } from '@/src/api/weather.api';
import { CropActivitySchedule } from '@/src/types/api';

type TabKey = 'SUBMISSIONS' | 'CALLS' | 'DELAYED' | 'TODAY' | 'WEATHER';

const TAB_META: Record<TabKey, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string }> = {
  SUBMISSIONS: { label: 'Submissions', icon: 'cloud-upload-outline', color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe' },
  CALLS: { label: 'Calls', icon: 'call-outline', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  DELAYED: { label: 'Delayed', icon: 'alert-circle', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  TODAY: { label: 'Today', icon: 'today', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  WEATHER: { label: 'Weather Alerts', icon: 'rainy-outline', color: '#0284c7', bg: '#eff6ff', border: '#bae6fd' },
};
const TAB_ORDER: TabKey[] = ['SUBMISSIONS', 'CALLS', 'DELAYED', 'TODAY', 'WEATHER'];

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

  const counts: Record<TabKey, number> = {
    SUBMISSIONS: pendingCrops?.length ?? 0,
    CALLS: pendingCallRequests.length,
    DELAYED: delayedSchedule?.length ?? 0,
    TODAY: todaySchedule?.length ?? 0,
    WEATHER: weatherAlerts?.length ?? 0,
  };
  const isLoadingByTab: Record<TabKey, boolean> = {
    SUBMISSIONS: isLoadingPendingCrops,
    CALLS: isLoadingCallRequests,
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
          {/* Farmer Roster — compact gradient stat bar */}
          <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.statsBar, premiumShadow(theme.primary, 'md')]}>
            <View style={styles.statsBarHeaderRow}>
              <Text style={styles.statsBarTitle}>My Farmer Roster</Text>
              <TouchableOpacity style={styles.statViewAllBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/farmers')}>
                <Text style={styles.statViewAllText}>View All</Text>
                <Ionicons name="chevron-forward" size={13} color="#ffffff" />
              </TouchableOpacity>
            </View>
            <View style={styles.statsBarRow}>
              <TouchableOpacity style={styles.statCell} activeOpacity={0.85} onPress={() => router.push('/(tabs)/farmers')}>
                <Text style={styles.statValue}>{stats.total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statCell} activeOpacity={0.85} onPress={() => router.push('/(tabs)/farmers')}>
                <Text style={styles.statValue}>{stats.active}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </TouchableOpacity>
              <View style={styles.statDivider} />
              <TouchableOpacity style={styles.statCell} activeOpacity={0.85} onPress={() => router.push('/(tabs)/farmers')}>
                <Text style={styles.statValue}>{stats.inactive}</Text>
                <Text style={styles.statLabel}>Inactive</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Single tabbed card replaces 4 stacked sections — one clear focus at a time */}
          <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
              {TAB_ORDER.map((key) => {
                const meta = TAB_META[key];
                const isActive = activeTab === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.tabChip, isActive && { backgroundColor: meta.color, borderColor: meta.color }]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(key);
                    }}
                  >
                    <Ionicons name={meta.icon} size={13} color={isActive ? '#ffffff' : meta.color} />
                    <Text style={[styles.tabChipText, { color: isActive ? '#ffffff' : meta.color }]}>{meta.label}</Text>
                    {counts[key] > 0 ? (
                      <View style={[styles.tabChipCount, isActive && styles.tabChipCountActive]}>
                        <Text style={[styles.tabChipCountText, { color: isActive ? '#ffffff' : meta.color }]}>{counts[key]}</Text>
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
                !pendingCrops || pendingCrops.length === 0 ? (
                  <Text style={styles.emptyText}>No crops awaiting review.</Text>
                ) : (
                  <View style={{ gap: 8 }}>
                    {pendingCrops.map((crop) => (
                      <View key={crop.id} style={[styles.taskRow, { backgroundColor: activeMeta.bg, borderColor: activeMeta.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.taskTitle}>{crop.cropName}{crop.variety ? ` · ${crop.variety}` : ''}</Text>
                          <Text style={styles.taskPlot} numberOfLines={1}>
                            📍 {crop.plot?.farm?.name} · {crop.plot?.name}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
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
                              <Ionicons name="close-circle" size={14} color="#dc2626" />
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
                                <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                                <Text style={styles.acceptCropBtnText}>Accept</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))}
                  </View>
                )
              ) : activeTab === 'CALLS' ? (
                <CallRequestsPanel requests={callRequests} meta={activeMeta} />
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
      <View style={styles.callSubTabRow}>
        {(['PENDING', 'HISTORY'] as const).map((key) => (
          <TouchableOpacity
            key={key}
            style={[styles.callSubTabChip, subTab === key && { backgroundColor: meta.color, borderColor: meta.color }]}
            onPress={() => setSubTab(key)}
          >
            <Text style={[styles.callSubTabChipText, subTab === key && { color: '#ffffff' }]}>
              {key === 'PENDING' ? `Pending (${pending.length})` : `History (${history.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {active.length === 0 ? (
        <Text style={styles.emptyText}>{subTab === 'PENDING' ? 'No pending call requests.' : 'No resolved requests yet.'}</Text>
      ) : (
        <ScrollView style={{ maxHeight: 320 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          <View style={{ gap: 6 }}>
            {active.map((req) => {
              const isExpanded = resolvingId === req.id;
              return (
                <View key={req.id} style={[styles.callListRow, { borderColor: meta.border }]}>
                  <TouchableOpacity
                    style={styles.callListRowMain}
                    activeOpacity={req.status === 'PENDING' ? 0.7 : 1}
                    onPress={() => {
                      if (req.status !== 'PENDING') return;
                      if (isExpanded) {
                        setResolvingId(null);
                        setComment('');
                      } else {
                        setResolvingId(req.id);
                        setComment('');
                      }
                    }}
                  >
                    <View style={[styles.callListDot, { backgroundColor: req.status === 'RESOLVED' ? '#16a34a' : meta.color }]} />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.callListName} numberOfLines={1}>{req.farmer?.name ?? 'Farmer'}</Text>
                      {req.farmer?.mobile ? <Text style={styles.callListMobile} numberOfLines={1}>{req.farmer.mobile}</Text> : null}
                    </View>
                    <Text style={styles.callListDate}>
                      {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                    {req.status === 'PENDING' ? (
                      <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#94a3b8" />
                    ) : null}
                  </TouchableOpacity>

                  {req.status === 'RESOLVED' ? (
                    <Text style={styles.callListResolvedNote} numberOfLines={1}>✅ {req.resolvedComment}</Text>
                  ) : isExpanded ? (
                    <View style={{ marginTop: 6, gap: 6 }}>
                      <TextInput
                        style={styles.callCommentInput}
                        placeholder="Add a resolve comment..."
                        placeholderTextColor="#94a3b8"
                        value={comment}
                        onChangeText={setComment}
                        multiline
                      />
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={[styles.callResolveBtn, { flex: 1, backgroundColor: '#f1f5f9' }]}
                          onPress={() => { setResolvingId(null); setComment(''); }}
                        >
                          <Text style={[styles.acceptCropBtnText, { color: '#475569' }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.callResolveBtn, { flex: 1, backgroundColor: meta.color }]}
                          disabled={resolve.isPending || !comment.trim()}
                          onPress={() => handleResolve(req.id)}
                        >
                          {resolve.isPending ? (
                            <ActivityIndicator color="#ffffff" size="small" />
                          ) : (
                            <Text style={styles.acceptCropBtnText}>Submit</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : null}
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

  statsBar: { borderRadius: RADIUS.lg, paddingVertical: 9, paddingHorizontal: 14, gap: 6 },
  statsBarHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsBarTitle: { fontSize: 11, fontFamily: FONT.extraBold, color: 'rgba(255,255,255,0.9)', textTransform: 'uppercase', letterSpacing: 0.3 },
  statsBarRow: { flexDirection: 'row', alignItems: 'center' },
  statCell: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: 16, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: -0.4 },
  statLabel: { fontSize: 9, fontFamily: FONT.semiBold, color: 'rgba(255,255,255,0.8)', marginTop: 0 },
  statDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.25)' },
  statViewAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: RADIUS.pill, paddingHorizontal: 8, paddingVertical: 4 },
  statViewAllText: { fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' },

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
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
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
});
