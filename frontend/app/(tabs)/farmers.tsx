import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, TextInput, ActivityIndicator, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmersList, useFarmerDetails } from '@/src/hooks/useAdvisorAssignments';
import { useAssignedCropProblems, useRespondToCropProblem } from '@/src/hooks/useCropProblems';
import { AdvisorScheduleTimeline } from '@/src/components/AdvisorScheduleTimeline';
import { RenewModal } from '@/src/components/RenewPlanCard';
import { SprayScheduleCards } from '@/src/components/SprayScheduleCards';
import { SprayDetailCard } from '@/src/components/SprayDetailCard';
import { useMySprayItemTemplates } from '@/src/hooks/useSprayItemTemplates';
import { useUserWeather } from '@/src/hooks/useWeather';
import { resolveMediaUrl } from '@/src/api/client';
import { CropProblem, SprayScheduleItem } from '@/src/types/api';

type FarmSubTab = 'PLOTS' | 'PROBLEMS';

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

/** Compact per-farmer weather chip — this farmer's local weather, not the advisor's own. */
function FarmerWeatherChip({ farmerId }: { farmerId: string }) {
  const { data, isLoading, isError } = useUserWeather(farmerId);
  if (isLoading) return <ActivityIndicator size="small" color={theme.primary} style={{ marginHorizontal: 6 }} />;
  if (isError || !data) return null;
  return (
    <View style={styles.weatherChip}>
      <Ionicons name={WEATHER_ICON[data.condition] ?? 'partly-sunny'} size={14} color="#0369a1" />
      <Text style={styles.weatherChipText}>{data.temperatureC}°C</Text>
    </View>
  );
}

export default function AdvisorFarmsScreen() {
  const [activeTab, setActiveTab] = useState<FarmSubTab>('PLOTS');
  const [expandedCropCycleId, setExpandedCropCycleId] = useState<string | null>(null);
  const [expandedFarmerId, setExpandedFarmerId] = useState<string | null>(null);
  const [sprayDetailItem, setSprayDetailItem] = useState<SprayScheduleItem | null>(null);
  const [sprayDetailTitle, setSprayDetailTitle] = useState('');

  const { data: activeAssignments, isLoading: isLoadingAssignments } = useFarmersList('ACTIVE');
  const farmerIds = useMemo(() => (activeAssignments ?? []).map((a) => a.farmerId), [activeAssignments]);
  const farmerDetailQueries = useFarmerDetails(farmerIds);
  const isLoadingDetails = farmerDetailQueries.some((q) => q.isLoading);

  const { data: assignedProblems, isLoading: isLoadingProblems } = useAssignedCropProblems();
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
  const [isProblemHistoryOpen, setIsProblemHistoryOpen] = useState(false);

  // "ALL" includes farmers whose plan has lapsed (they drop out of the ACTIVE list above but their assignment.status is still ACTIVE) —
  // used only to surface a renew action for them, since they'd otherwise become unreachable once hidden from the roster.
  const { data: allAssignments } = useFarmersList('ALL');
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
  }, [plotRows, farmerProfileById]);

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
                      <View style={styles.plotCardInfo}>
                        <Text style={styles.plotCardFarmer} numberOfLines={1}>{group.farmerName}</Text>
                        <Text style={styles.plotCardMeta} numberOfLines={1}>
                          {group.kingId ? `🔑 ${group.kingId} · ` : ''}🌾 {group.rows.length} crop{group.rows.length === 1 ? '' : 's'}
                        </Text>
                        <Text style={styles.plotCardMeta} numberOfLines={1}>
                          {group.mobile ? `📱 ${group.mobile}` : ''}{group.mobile && group.state ? ' · ' : ''}{group.state ? `📍 ${group.state}` : ''}
                        </Text>
                      </View>
                      <FarmerWeatherChip farmerId={group.farmerId} />
                      <View style={[styles.expandBtn, !isCollapsed && { backgroundColor: theme.primary }]}>
                        <Ionicons name={isCollapsed ? 'chevron-down' : 'chevron-up'} size={15} color={!isCollapsed ? '#ffffff' : theme.primary} />
                      </View>
                    </TouchableOpacity>

                    {!isCollapsed ? (
                      <View style={styles.farmerGroupBody}>
                        {group.rows.map((row) => {
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
                        })}
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </View>
          )
        ) : (
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
                    {isProblemHistoryOpen
                      ? historyProblems.map((problem) => <ProblemCard key={problem.id} problem={problem} />)
                      : null}
                  </View>
                ) : null}
              </>
            )}
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
    </View>
  );
}

function ProblemCard({ problem }: { problem: CropProblem }) {
  const respond = useRespondToCropProblem();
  const [isRespondOpen, setIsRespondOpen] = useState(false);
  const [advisorResponse, setAdvisorResponse] = useState('');
  const [productQuery, setProductQuery] = useState('');
  const [recommendedProducts, setRecommendedProducts] = useState<string[]>([]);
  const { data: itemTemplatesForSearch } = useMySprayItemTemplates();

  const severityMeta = SEVERITY_META[problem.severity ?? 'MEDIUM'];
  const productQueryLower = productQuery.trim().toLowerCase();
  const doseSuggestions = productQueryLower
    ? (itemTemplatesForSearch ?? []).filter((t) => t.item.toLowerCase().includes(productQueryLower)).slice(0, 6)
    : [];

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
      <View style={styles.cardHeaderRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          <Text style={styles.plotTitle}>{problem.title}</Text>
          <View style={[styles.severityBadge, { backgroundColor: severityMeta.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: severityMeta.color }]} />
            <Text style={[styles.severityBadgeText, { color: severityMeta.color }]}>{problem.severity ?? 'MEDIUM'}</Text>
          </View>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>{problem.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.problemIdentityRow}>
        <InitialsAvatar name={problem.reportedBy?.name ?? 'Farmer'} size={28} />
        <Text style={styles.farmerSub} numberOfLines={1}>
          {problem.reportedBy?.name ?? 'Farmer'} · 🌾 {problem.cropCycle?.cropName ?? '—'}
        </Text>
      </View>
      <Text style={styles.problemDescription}>{problem.description}</Text>

      {problem.advisorResponse ? (
        <View style={styles.responseBox}>
          <Ionicons name="checkmark-circle" size={12} color="#16a34a" />
          <Text style={styles.responseText} numberOfLines={1}>{problem.advisorResponse}</Text>
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
});
