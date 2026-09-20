import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, TextInput, ActivityIndicator, Alert, Image, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useCreateAssistantDoctor, useMyAssistantDoctors } from '@/src/hooks/useUsersAdmin';
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
import { useChatUnreadCount, useConversations, useConversationsPresenceSync } from '@/src/hooks/useChat';
import { apiClient, resolveMediaUrl } from '@/src/api/client';
import { CropProblem, SprayScheduleItem } from '@/src/types/api';
import { ScheduleScreen } from './schedule';

type FarmSubTab = 'PLOTS' | 'PROBLEMS' | 'CALL_REQUESTS' | 'ASSISTANTS';

const theme = RoleThemes.FARM_ADVISOR;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface PlotRow {
  key: string;
  farmerId: string;
  farmerName: string;
  farmerState?: string | null;
  farmerMobile?: string | null;
  farmerKingId?: string | null;
  farmerPhotoUrl?: string | null;
  plotName: string;
  cropCategory: string;
  variety: string;
  cropCycleId: string;
  cropCode?: string;
  cropName: string;
  stage?: string | null;
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

type GroupByMode = 'FARMER_WISE' | 'CROP_WISE' | 'STATE_WISE' | 'DATE_WISE' | 'STAGE_WISE';

interface GroupByDropdownOption {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  groupByMode: GroupByMode;
  stageRadio?: string;
  isStageOption?: boolean;
}

const GROUP_BY_DROPDOWN_OPTIONS: GroupByDropdownOption[] = [
  { key: 'FARMER_WISE', label: '👨‍🌾 Farmer Wise', icon: 'person-outline', groupByMode: 'FARMER_WISE' },
  { key: 'CROP_WISE', label: '🌾 Crop Wise', icon: 'leaf-outline', groupByMode: 'CROP_WISE' },
  { key: 'STATE_WISE', label: '📍 State Wise', icon: 'location-outline', groupByMode: 'STATE_WISE' },
  { key: 'DATE_WISE', label: '📅 Plantation Date Wise', icon: 'calendar-outline', groupByMode: 'DATE_WISE' },
  { key: 'STAGE_ALL', label: '🌱 Stage: All Stages', icon: 'apps-outline', groupByMode: 'STAGE_WISE', stageRadio: 'ALL', isStageOption: true },
  { key: 'STAGE_PLANTATION', label: '🌱 Stage: Sowing / Plantation', icon: 'leaf-outline', groupByMode: 'STAGE_WISE', stageRadio: 'PLANTATION', isStageOption: true },
  { key: 'STAGE_VEGETATIVE', label: '🌱 Stage: Vegetative Growth', icon: 'trending-up-outline', groupByMode: 'STAGE_WISE', stageRadio: 'VEGETATIVE', isStageOption: true },
  { key: 'STAGE_FLOWERING', label: '🌱 Stage: Flowering & Budding', icon: 'flower-outline', groupByMode: 'STAGE_WISE', stageRadio: 'FLOWERING', isStageOption: true },
  { key: 'STAGE_HARVESTING', label: '🌱 Stage: Fruiting & Harvest', icon: 'basket-outline', groupByMode: 'STAGE_WISE', stageRadio: 'HARVESTING', isStageOption: true },
];

const STAGE_RADIO_OPTIONS = [
  { key: 'ALL', label: 'All Stages', icon: 'apps-outline' },
  { key: 'PLANTATION', label: 'Sowing / Plantation 🌿', icon: 'leaf-outline' },
  { key: 'VEGETATIVE', label: 'Vegetative Growth 🌱', icon: 'trending-up-outline' },
  { key: 'FLOWERING', label: 'Flowering & Budding 🌸', icon: 'flower-outline' },
  { key: 'HARVESTING', label: 'Fruiting & Harvest 🌾', icon: 'basket-outline' },
];

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

function CropCardItem({
  row,
  expandedCropCycleId,
  toggleExpand,
  openSprayDetail,
  router,
  showFarmerInfo = true,
}: {
  row: PlotRow;
  expandedCropCycleId: string | null;
  toggleExpand: (id: string) => void;
  openSprayDetail: (item: SprayScheduleItem, title: string) => void;
  router: any;
  showFarmerInfo?: boolean;
}) {
  const isExpanded = expandedCropCycleId === row.cropCycleId;
  const stageRaw = (row.stage || '').toUpperCase();
  const stageDisplay =
    stageRaw.includes('PLANT') || stageRaw.includes('SOW') ? '🌿 Sowing' :
    stageRaw.includes('VEG') ? '🌱 Vegetative' :
    stageRaw.includes('FLOWER') || stageRaw.includes('BUD') ? '🌸 Flowering' :
    stageRaw.includes('HARVEST') || stageRaw.includes('FRUIT') ? '🌾 Harvest' :
    row.stage || '🌱 Active Stage';

  return (
    <View style={styles.cropCard}>
      <View style={styles.cropCardHeaderRow}>
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={styles.cropCardTitle} numberOfLines={1}>
              📍 {row.plotName} · 🌾 {row.cropName} <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: '#1d4ed8' }}>(ID: {row.cropCode || (row.cropCycleId.startsWith('CR-') ? row.cropCycleId : `CR-${row.cropCycleId.slice(0, 6).toUpperCase()}`)})</Text>
            </Text>
            <View style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0', borderWidth: 1, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
              <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#047857' }}>{stageDisplay}</Text>
            </View>
          </View>
          {showFarmerInfo ? (
            <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#1e40af' }} numberOfLines={1}>
              👨‍🌾 {row.farmerName}{row.farmerMobile ? ` (📞 ${row.farmerMobile})` : ''}{row.farmerState ? ` · 📍 ${row.farmerState}` : ''}
            </Text>
          ) : null}
          <Text style={styles.plotCardMeta} numberOfLines={1}>
            {row.cropCategory}{row.variety && row.variety !== '—' ? ` · ${row.variety}` : ''}
            {row.area ? ` · 📏 ${row.area}` : ''}
            {row.sowingDate ? ` · 📅 Sown: ${new Date(row.sowingDate).toLocaleDateString('en-IN')}` : ''}
          </Text>
        </View>

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
          <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: '#1d4ed8' }}>🛰️ Satellite View</Text>
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
          <AdvisorScheduleTimeline cropCycleId={row.cropCycleId} cropName={row.cropName} farmerName={row.farmerName} />
        </View>
      ) : null}
    </View>
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

  const activeProblems = useMemo(
    () => (assignedProblems ?? []).filter((p) => p.status === 'REPORTED' || p.status === 'UNDER_REVIEW'),
    [assignedProblems],
  );
  const historyProblems = useMemo(
    () => (assignedProblems ?? []).filter((p) => p.status !== 'REPORTED' && p.status !== 'UNDER_REVIEW'),
    [assignedProblems],
  );

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

  const { data: chatUnreadData } = useChatUnreadCount();
  const unreadChatCount = chatUnreadData?.count ?? 0;
  const { data: conversationsList, isLoading: isLoadingConversations } = useConversations();

  const { defaultTab } = useLocalSearchParams<{ defaultTab?: string }>();
  const [mainTab, setMainTab] = useState<'FARMS' | 'SCHEDULE'>(defaultTab === 'SCHEDULE' ? 'SCHEDULE' : 'FARMS');
  const [groupByMode, setGroupByMode] = useState<GroupByMode>('FARMER_WISE');

  useEffect(() => {
    if (defaultTab === 'SCHEDULE') {
      setMainTab('SCHEDULE');
    }
  }, [defaultTab]);

  useConversationsPresenceSync(false);
  const [selectedStageRadio, setSelectedStageRadio] = useState<string>('ALL');
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [expandedGroupKeys, setExpandedGroupKeys] = useState<Record<string, boolean>>({});

  const activeDropdownKey = useMemo(() => {
    if (groupByMode !== 'STAGE_WISE') return groupByMode;
    return `STAGE_${selectedStageRadio}`;
  }, [groupByMode, selectedStageRadio]);

  const currentOption = useMemo(() => {
    return GROUP_BY_DROPDOWN_OPTIONS.find((opt) => opt.key === activeDropdownKey) || GROUP_BY_DROPDOWN_OPTIONS[0];
  }, [activeDropdownKey]);

  const toggleGroupCollapse = (groupKey: string) => {
    tap();
    setExpandedGroupKeys((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

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
              farmerState: detail.farmer.state,
              farmerMobile: detail.farmer.mobile,
              farmerKingId: detail.farmer.kingId,
              farmerPhotoUrl: detail.farmer.photoUrl,
              plotName: plot.name,
              cropCategory: cropCycle.category ?? '—',
              variety: cropCycle.variety ?? '—',
              cropCycleId: cropCycle.id,
              cropCode: cropCycle.cropId || (cropCycle.id.startsWith('CR-') ? cropCycle.id : `CR-${cropCycle.id.slice(0, 6).toUpperCase()}`),
              cropName: cropCycle.cropName,
              stage: cropCycle.stage,
              area: cropCycle.area,
              sowingDate: cropCycle.sowingDate,
            });
          });
        });
      });
    });
    return rows;
  }, [farmerDetailQueries]);

  const cropsGroupedByName = useMemo(() => {
    const map = new Map<string, PlotRow[]>();
    plotRows.forEach((row) => {
      const name = row.cropName || 'Unspecified Crop';
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(row);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [plotRows]);

  const cropsGroupedByState = useMemo(() => {
    const map = new Map<string, PlotRow[]>();
    plotRows.forEach((row) => {
      const state = row.farmerState || 'State Not Specified';
      if (!map.has(state)) map.set(state, []);
      map.get(state)!.push(row);
    });
    return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [plotRows]);

  const cropsGroupedByDate = useMemo(() => {
    const groups: Record<string, PlotRow[]> = {
      'Sown in Last 15 Days (Recent Sowing)': [],
      '15 to 45 Days Ago (Vegetative Growth)': [],
      '45 to 90 Days Ago (Mid-Season)': [],
      'Older than 90 Days (Pre-Harvest)': [],
      'Plantation Date Not Specified': [],
    };

    const now = Date.now();
    plotRows.forEach((row) => {
      if (!row.sowingDate) {
        groups['Plantation Date Not Specified'].push(row);
        return;
      }
      const sown = new Date(row.sowingDate).getTime();
      if (isNaN(sown)) {
        groups['Plantation Date Not Specified'].push(row);
        return;
      }
      const diffDays = Math.floor((now - sown) / (1000 * 60 * 60 * 24));
      if (diffDays <= 15) {
        groups['Sown in Last 15 Days (Recent Sowing)'].push(row);
      } else if (diffDays <= 45) {
        groups['15 to 45 Days Ago (Vegetative Growth)'].push(row);
      } else if (diffDays <= 90) {
        groups['45 to 90 Days Ago (Mid-Season)'].push(row);
      } else {
        groups['Older than 90 Days (Pre-Harvest)'].push(row);
      }
    });

    return Object.entries(groups).filter(([_, list]) => list.length > 0);
  }, [plotRows]);

  const filteredByStageRows = useMemo(() => {
    if (selectedStageRadio === 'ALL') return plotRows;
    return plotRows.filter((row) => {
      const st = (row.stage || '').toUpperCase();
      if (selectedStageRadio === 'PLANTATION') return st.includes('PLANT') || st.includes('SOW') || st.includes('SEED');
      if (selectedStageRadio === 'VEGETATIVE') return st.includes('VEG') || st.includes('GROWTH');
      if (selectedStageRadio === 'FLOWERING') return st.includes('FLOWER') || st.includes('BUD');
      if (selectedStageRadio === 'HARVESTING') return st.includes('HARVEST') || st.includes('FRUIT');
      return st.includes(selectedStageRadio);
    });
  }, [plotRows, selectedStageRadio]);

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
        <Text style={styles.heroSubtitle}>Real-Time Farmer Plots, Crop Health & Advisory Schedules</Text>
      </LinearGradient>

      {/* Top Main Segmented Control: Farms & Crops vs Schedule & Calendar */}
      <View style={styles.mainTabHeaderContainer}>
        <TouchableOpacity
          style={[styles.mainTabBtn, mainTab === 'FARMS' && styles.mainTabBtnActive]}
          activeOpacity={0.85}
          onPress={() => { tap(); setMainTab('FARMS'); }}
        >
          <Ionicons name="leaf" size={15} color={mainTab === 'FARMS' ? '#ffffff' : theme.primary} />
          <Text style={[styles.mainTabBtnText, mainTab === 'FARMS' && styles.mainTabBtnTextActive]}>
            🌾 Farms & Crops
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainTabBtn, mainTab === 'SCHEDULE' && styles.mainTabBtnActive]}
          activeOpacity={0.85}
          onPress={() => { tap(); setMainTab('SCHEDULE'); }}
        >
          <Ionicons name="calendar" size={15} color={mainTab === 'SCHEDULE' ? '#ffffff' : theme.primary} />
          <Text style={[styles.mainTabBtnText, mainTab === 'SCHEDULE' && styles.mainTabBtnTextActive]}>
            📅 Schedule & Calendar
          </Text>
        </TouchableOpacity>
      </View>

      {mainTab === 'SCHEDULE' ? (
        <View style={{ flex: 1 }}>
          <ScheduleScreen />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
          <View style={{ gap: 12 }}>
            {/* View & Grouping Dropdown Selector */}
            <View style={styles.dropdownSelectorContainer}>
              <Text style={styles.dropdownSelectorHeaderLabel}>View & Filter By:</Text>
              <TouchableOpacity
                style={styles.dropdownSelectorButton}
                activeOpacity={0.8}
                onPress={() => { tap(); setDropdownOpen(true); }}
              >
                <View style={styles.dropdownSelectorLeft}>
                  <Ionicons name={currentOption.icon} size={18} color={theme.primary} />
                  <Text style={styles.dropdownSelectorText} numberOfLines={1}>
                    {currentOption.label}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* FARMER WISE VIEW */}
            {groupByMode === 'FARMER_WISE' ? (
              <>
                {pendingAssignments && pendingAssignments.length > 0 ? (
                  <View style={styles.pendingSection}>
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
                            rejectAssignment.mutate(a.id);
                          }}
                        >
                          <Ionicons name="close-circle" size={14} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                ) : null}

                {farmerGroups.map((group) => {
                  const isExpanded = expandedFarmerId === group.farmerId;
                  return (
                    <View key={group.farmerId} style={[styles.farmerCard, premiumShadow('#0f172a', 'sm')]}>
                      <TouchableOpacity
                        style={styles.farmerCardHeader}
                        activeOpacity={0.75}
                        onPress={() => toggleFarmerCollapse(group.farmerId)}
                      >
                        <InitialsAvatar name={group.farmerName} size={36} />
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.farmerCardName}>{group.farmerName}</Text>
                            <TouchableOpacity
                              style={styles.viewProfileChip}
                              onPress={() => {
                                tap();
                                setProfileModalFarmerId(group.farmerId);
                              }}
                            >
                              <Ionicons name="eye-outline" size={10} color="#15803d" />
                              <Text style={styles.viewProfileChipText}>Profile</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.farmerCardMeta}>
                            {group.kingId ? `🔑 ${group.kingId} · ` : ''}
                            {group.mobile ? `📱 ${group.mobile}` : ''}
                          </Text>
                          <View
                            style={{
                              backgroundColor: group.rows.length === 0 ? '#eff6ff' : '#fef2f2',
                              borderColor: group.rows.length === 0 ? '#93c5fd' : '#fca5a5',
                              borderWidth: 1,
                              paddingHorizontal: 7,
                              paddingVertical: 3,
                              borderRadius: RADIUS.xs,
                              alignSelf: 'flex-start',
                              marginTop: 4,
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 10.5,
                                fontFamily: FONT.extraBold,
                                color: group.rows.length === 0 ? '#2563eb' : '#dc2626',
                              }}
                            >
                              {group.rows.length === 0 ? '🟦 0 Active Crops (Empty Roster)' : `🟥 ${group.rows.length} Active Crop${group.rows.length !== 1 ? 's' : ''}`}
                            </Text>
                          </View>
                        </View>
                        <FarmerWeatherChip farmerId={group.farmerId} />
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={20} color="#64748b" />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={{ gap: 10, marginTop: 10 }}>
                          {group.rows.length === 0 ? (
                            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', fontStyle: 'italic', paddingHorizontal: 12 }}>
                              No active plots or crop cycles listed for this farmer.
                            </Text>
                          ) : (
                            group.rows.map((row) => (
                              <CropCardItem
                                key={row.key}
                                row={row}
                                expandedCropCycleId={expandedCropCycleId}
                                toggleExpand={toggleExpand}
                                openSprayDetail={openSprayDetail}
                                router={router}
                                showFarmerInfo={false}
                              />
                            ))
                          )}
                        </View>
                      )}
                    </View>
                  );
                })}
              </>
            ) : null}

            {/* CROP WISE VIEW */}
            {groupByMode === 'CROP_WISE' ? (
              <View style={{ gap: 12 }}>
                {cropsGroupedByName.map(([cropName, rows]) => {
                  const groupKey = `crop-${cropName}`;
                  const isExpanded = expandedGroupKeys[groupKey] !== false;
                  return (
                    <View key={cropName} style={[styles.farmerCard, premiumShadow('#0f172a', 'sm')]}>
                      <TouchableOpacity
                        style={styles.collapsibleGroupHeader}
                        activeOpacity={0.75}
                        onPress={() => toggleGroupCollapse(groupKey)}
                      >
                        <Text style={styles.groupHeaderTitle}>🌾 {cropName} ({rows.length} Plot{rows.length !== 1 ? 's' : ''})</Text>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                      </TouchableOpacity>

                      {isExpanded ? (
                        <View style={{ gap: 10, marginTop: 8 }}>
                          {rows.map((row) => (
                            <CropCardItem
                              key={row.key}
                              row={row}
                              expandedCropCycleId={expandedCropCycleId}
                              toggleExpand={toggleExpand}
                              openSprayDetail={openSprayDetail}
                              router={router}
                              showFarmerInfo={true}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* STATE WISE VIEW */}
            {groupByMode === 'STATE_WISE' ? (
              <View style={{ gap: 12 }}>
                {cropsGroupedByState.map(([stateName, rows]) => {
                  const groupKey = `state-${stateName}`;
                  const isExpanded = expandedGroupKeys[groupKey] !== false;
                  return (
                    <View key={stateName} style={[styles.farmerCard, premiumShadow('#0f172a', 'sm')]}>
                      <TouchableOpacity
                        style={styles.collapsibleGroupHeader}
                        activeOpacity={0.75}
                        onPress={() => toggleGroupCollapse(groupKey)}
                      >
                        <Text style={styles.groupHeaderTitle}>📍 {stateName} ({rows.length} Farm{rows.length !== 1 ? 's' : ''})</Text>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                      </TouchableOpacity>

                      {isExpanded ? (
                        <View style={{ gap: 10, marginTop: 8 }}>
                          {rows.map((row) => (
                            <CropCardItem
                              key={row.key}
                              row={row}
                              expandedCropCycleId={expandedCropCycleId}
                              toggleExpand={toggleExpand}
                              openSprayDetail={openSprayDetail}
                              router={router}
                              showFarmerInfo={true}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* PLANTATION DATE WISE VIEW */}
            {groupByMode === 'DATE_WISE' ? (
              <View style={{ gap: 12 }}>
                {cropsGroupedByDate.map(([groupLabel, rows]) => {
                  const groupKey = `date-${groupLabel}`;
                  const isExpanded = expandedGroupKeys[groupKey] !== false;
                  return (
                    <View key={groupLabel} style={[styles.farmerCard, premiumShadow('#0f172a', 'sm')]}>
                      <TouchableOpacity
                        style={styles.collapsibleGroupHeader}
                        activeOpacity={0.75}
                        onPress={() => toggleGroupCollapse(groupKey)}
                      >
                        <Text style={styles.groupHeaderTitle}>📅 {groupLabel} ({rows.length})</Text>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                      </TouchableOpacity>

                      {isExpanded ? (
                        <View style={{ gap: 10, marginTop: 8 }}>
                          {rows.map((row) => (
                            <CropCardItem
                              key={row.key}
                              row={row}
                              expandedCropCycleId={expandedCropCycleId}
                              toggleExpand={toggleExpand}
                              openSprayDetail={openSprayDetail}
                              router={router}
                              showFarmerInfo={true}
                            />
                          ))}
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            ) : null}

            {/* STAGE WISE VIEW */}
            {groupByMode === 'STAGE_WISE' ? (
              <View style={{ gap: 12 }}>
                {filteredByStageRows.length === 0 ? (
                  <View style={styles.emptyCenter}>
                    <Ionicons name="leaf-outline" size={36} color="#cbd5e1" />
                    <Text style={styles.emptyTitle}>No Crops in Selected Stage</Text>
                    <Text style={styles.emptySub}>No active crop cycles match this growth stage.</Text>
                  </View>
                ) : (
                  (() => {
                    const groupKey = `stage-${selectedStageRadio}`;
                    const isExpanded = expandedGroupKeys[groupKey] !== false;
                    const stageLabel = STAGE_RADIO_OPTIONS.find((s) => s.key === selectedStageRadio)?.label || 'Growth Stage';
                    return (
                      <View style={[styles.farmerCard, premiumShadow('#0f172a', 'sm')]}>
                        <TouchableOpacity
                          style={styles.collapsibleGroupHeader}
                          activeOpacity={0.75}
                          onPress={() => toggleGroupCollapse(groupKey)}
                        >
                          <Text style={styles.groupHeaderTitle}>🌱 {stageLabel} ({filteredByStageRows.length})</Text>
                          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                        </TouchableOpacity>

                        {isExpanded ? (
                          <View style={{ gap: 10, marginTop: 8 }}>
                            {filteredByStageRows.map((row) => (
                              <CropCardItem
                                key={row.key}
                                row={row}
                                expandedCropCycleId={expandedCropCycleId}
                                toggleExpand={toggleExpand}
                                openSprayDetail={openSprayDetail}
                                router={router}
                                showFarmerInfo={true}
                              />
                            ))}
                          </View>
                        ) : null}
                      </View>
                    );
                  })()
                )}
              </View>
            ) : null}
          </View>
        </ScrollView>
      )}

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

      {/* Dropdown Options Modal */}
      <Modal
        visible={isDropdownOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownOpen(false)}
      >
        <TouchableOpacity
          style={styles.dropdownModalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownOpen(false)}
        >
          <TouchableOpacity activeOpacity={1} style={styles.dropdownModalCard}>
            <View style={styles.dropdownModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="filter" size={18} color={theme.primary} />
                <Text style={styles.dropdownModalTitle}>Select View & Filter</Text>
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDropdownOpen(false)}
              >
                <Ionicons name="close" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalHeaderDivider} />

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text style={styles.dropdownSectionTitle}>GENERAL VIEWS</Text>
              {GROUP_BY_DROPDOWN_OPTIONS.filter((o) => !o.isStageOption).map((opt) => {
                const isSelected = activeDropdownKey === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    onPress={() => {
                      tap();
                      setGroupByMode(opt.groupByMode);
                      if (opt.stageRadio) setSelectedStageRadio(opt.stageRadio);
                      setDropdownOpen(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Ionicons name={opt.icon} size={18} color={isSelected ? theme.primary : '#475569'} />
                      <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                        {opt.label}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              <Text style={[styles.dropdownSectionTitle, { marginTop: 14 }]}>GROWTH STAGE FILTERS</Text>
              {GROUP_BY_DROPDOWN_OPTIONS.filter((o) => o.isStageOption).map((opt) => {
                const isSelected = activeDropdownKey === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[styles.dropdownItem, isSelected && styles.dropdownItemActive]}
                    onPress={() => {
                      tap();
                      setGroupByMode(opt.groupByMode);
                      if (opt.stageRadio) setSelectedStageRadio(opt.stageRadio);
                      setDropdownOpen(false);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <Ionicons name={opt.icon} size={18} color={isSelected ? theme.primary : '#475569'} />
                      <Text style={[styles.dropdownItemText, isSelected && styles.dropdownItemTextActive]}>
                        {opt.label}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={20} color={theme.primary} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 14, paddingBottom: 12, paddingHorizontal: SPACING.lg },
  heroTitle: { color: '#fff', fontSize: 17, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 11, fontFamily: FONT.medium, marginTop: 1 },
  list: { padding: SPACING.md, gap: 8, paddingBottom: SPACING.xl },
  subGroupChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  subGroupChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  subGroupChipText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#475569',
  },
  subGroupChipTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  stageTabContainer: {
    backgroundColor: '#ffffff',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 2,
  },
  stageTabHeaderTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stageTabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  stageTabChipActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  stageTabChipText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: theme.primary,
  },
  stageTabChipTextActive: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  pendingSection: { backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 10, borderWidth: 1.5, borderColor: '#86efac', gap: 8 },
  pendingTitle: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#15803d' },
  pendingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#dcfce7' },
  pendingFarmerName: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  pendingFarmerMeta: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
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
  acceptBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill },
  acceptBtnText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.bold },
  rejectBtn: { padding: 4 },
  farmerCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#f1f5f9', padding: 12, gap: 8 },
  farmerCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  farmerCardName: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  farmerCardMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  collapsibleGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  groupHeaderTitle: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 30, gap: 6 },
  emptyTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#334155' },
  emptySub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },
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
  mainTabHeaderContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 5,
    marginHorizontal: 12,
    marginTop: 10,
    marginBottom: 4,
    borderRadius: RADIUS.lg,
    gap: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...premiumShadow('#000000', 'sm'),
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
  },
  mainTabBtnActive: {
    backgroundColor: theme.primary,
  },
  mainTabBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  mainTabBtnTextActive: {
    color: '#ffffff',
  },
  dropdownSelectorContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
    ...premiumShadow('#000000', 'sm'),
  },
  dropdownSelectorHeaderLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dropdownSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownSelectorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownSelectorText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  dropdownModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  dropdownModalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    gap: 4,
    ...premiumShadow('#000000', 'lg'),
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownModalTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  dropdownSectionTitle: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: RADIUS.sm,
    marginBottom: 4,
    backgroundColor: '#f8fafc',
  },
  dropdownItemActive: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  dropdownItemText: {
    fontSize: 13.5,
    fontFamily: FONT.semibold,
    color: '#334155',
  },
  dropdownItemTextActive: {
    fontFamily: FONT.bold,
    color: theme.primary,
  },
});
