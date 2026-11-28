import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Platform, Alert, TextInput, Modal, Linking, Image, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { useAuth } from '@/src/store/auth-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  useFarmerStats,
  useFarmersList,
  useAcceptAssignment,
  useRejectAssignment,
  useMyAdvisorPlans,
  useSaveAdvisorPlan,
  useScheduleGroupCall,
  useSendGroupCallAlert,
  useAdvisorGroupEvents,
} from '@/src/hooks/useAdvisorAssignments';
import {
  useAdvisorDelayedSchedule,
  useAdvisorTodaySchedule,
  useRemindSchedule,
} from '@/src/hooks/useCropActivitySchedules';
import { useAcceptCropByAdvisor, useRejectCropByAdvisor, usePendingCropsForAdvisor, useAcceptedCropsForAdvisor, useCompleteCropRequirement } from '@/src/hooks/useCrops';
import { useMyCallRequests, useResolveCallRequest } from '@/src/hooks/useCallRequests';
import { useAdvisorWeatherAlerts, useUserWeather } from '@/src/hooks/useWeather';
import { useAssignedCropProblems, useRespondToCropProblem } from '@/src/hooks/useCropProblems';
import { useQuery } from '@tanstack/react-query';
import { apiClient, resolveMediaUrl } from '@/src/api/client';
import type { CallRequest } from '@/src/api/callRequests.api';
import type { FarmerWeatherAlert } from '@/src/api/weather.api';
import { CropActivitySchedule, AdvisorReviewCropCycle, CropProblem } from '@/src/types/api';
import { useGroupVoiceCall } from '@/src/hooks/useGroupVoiceCall';
import { GroupVoiceCallModal } from '@/src/components/chat/GroupVoiceCallModal';
import { DoctorMessengerModal } from '@/src/components/chat/DoctorMessengerModal';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useMyWallet } from '@/src/hooks/useWallet';
import { useDoctorSettings } from '@/src/hooks/useDoctorSettings';
import { AdvisorScheduleTimeline } from '@/src/components/AdvisorScheduleTimeline';

type TabKey = 'SUBMISSIONS' | 'DELAYED' | 'TODAY' | 'WEATHER' | 'NO_SCHEDULE' | 'PROBLEMS';

function isScheduleFinishedOrMissing(crop: AdvisorReviewCropCycle): boolean {
  if (!crop.assignedSchedule || !crop.assignedSchedule.trim()) {
    return true;
  }
  const scheduleStr = crop.assignedSchedule;
  if (scheduleStr.toLowerCase().includes('completed') || scheduleStr.toLowerCase().includes('finished')) {
    return true;
  }
  const dateRegex = /\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4}|\d{4}-\d{2}-\d{2})\b/g;
  const matches = [...scheduleStr.matchAll(dateRegex)];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (matches.length > 0) {
    let hasFutureDate = false;
    for (const match of matches) {
      const parsedDate = new Date(match[0]);
      if (!isNaN(parsedDate.getTime())) {
        parsedDate.setHours(0, 0, 0, 0);
        if (parsedDate.getTime() >= today.getTime()) {
          hasFutureDate = true;
          break;
        }
      }
    }
    if (!hasFutureDate) return true;
  }
  return false;
}

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

function CropReviewWeatherSection({ farmerId, isLight, textColor, subTextColor }: { farmerId?: string; isLight: boolean; textColor: string; subTextColor: string }) {
  const { data: weather, isLoading } = useUserWeather(farmerId);

  return (
    <View style={[styles.proCardSection, { backgroundColor: isLight ? '#f0f9ff' : '#042238', borderColor: isLight ? '#bae6fd' : 'rgba(56, 189, 248, 0.25)' }]}>
      <View style={[styles.proCardSectionHeader, { borderBottomColor: isLight ? '#bae6fd' : 'rgba(255, 255, 255, 0.08)' }]}>
        <Ionicons name="partly-sunny" size={14} color="#0284c7" />
        <Text style={[styles.proCardSectionTitle, { color: '#0284c7' }]}>Farmer Live Weather Telemetry</Text>
        {weather?.locationLabel ? (
          <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: subTextColor, marginLeft: 'auto' }}>
            📍 {weather.locationLabel}
          </Text>
        ) : null}
      </View>

      {isLoading ? (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#0284c7" />
        </View>
      ) : weather ? (
        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons
                name={weather.isRaining ? 'rainy' : weather.condition?.toLowerCase().includes('cloud') ? 'cloudy' : 'sunny'}
                size={22}
                color={weather.isRaining ? '#0284c7' : '#f59e0b'}
              />
              <View>
                <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: textColor }}>
                  {weather.temperatureC}°C <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor }}>({weather.condition})</Text>
                </Text>
                <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: subTextColor }}>
                  Feels like {weather.feelsLikeC}°C
                </Text>
              </View>
            </View>

            {weather.isRaining ? (
              <View style={{ backgroundColor: '#0284c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill }}>
                <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' }}>🌧️ Rain Active</Text>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <View style={[styles.proGridBox, { flex: 1, backgroundColor: isLight ? '#ffffff' : '#082f49', borderColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.2)' }]}>
              <Text style={[styles.proGridLabel, { color: subTextColor }]}>💧 Humidity</Text>
              <Text style={[styles.proGridVal, { color: textColor }]}>{weather.humidityPct}%</Text>
            </View>

            <View style={[styles.proGridBox, { flex: 1, backgroundColor: isLight ? '#ffffff' : '#082f49', borderColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.2)' }]}>
              <Text style={[styles.proGridLabel, { color: subTextColor }]}>💨 Wind Speed</Text>
              <Text style={[styles.proGridVal, { color: textColor }]}>{(weather.windSpeedMs * 3.6).toFixed(1)} km/h</Text>
            </View>

            <View style={[styles.proGridBox, { flex: 1, backgroundColor: isLight ? '#ffffff' : '#082f49', borderColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.2)' }]}>
              <Text style={[styles.proGridLabel, { color: subTextColor }]}>🌧️ 3-Day Rain</Text>
              <Text style={[styles.proGridVal, { color: (weather.forecast ?? []).some(f => f.isRaining || f.precipitationMm >= 2) ? '#0284c7' : textColor }]}>
                {(weather.forecast ?? []).some(f => f.isRaining || f.precipitationMm >= 2) ? 'Expected' : 'None'}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor, fontStyle: 'italic', paddingVertical: 4 }}>
          Live micro-climate telemetry unavailable for this plot.
        </Text>
      )}
    </View>
  );
}

const TAB_META: Record<TabKey, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string }> = {
  SUBMISSIONS: { label: 'Requests', icon: 'cloud-upload', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)', border: 'rgba(56, 189, 248, 0.35)' },
  DELAYED: { label: 'Delayed Sprays', icon: 'alert-circle', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' },
  TODAY: { label: "Today's Schedule", icon: 'today', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
  WEATHER: { label: 'Weather Alerts', icon: 'rainy', color: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.12)', border: 'rgba(14, 165, 233, 0.35)' },
  NO_SCHEDULE: { label: 'Unscheduled Crops', icon: 'warning', color: '#fb923c', bg: 'rgba(251, 146, 60, 0.12)', border: 'rgba(251, 146, 60, 0.35)' },
  PROBLEMS: { label: 'Problem Tickets', icon: 'medkit', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.35)' },
};
const TAB_ORDER: TabKey[] = ['SUBMISSIONS', 'DELAYED', 'TODAY', 'WEATHER', 'NO_SCHEDULE', 'PROBLEMS'];

export interface AuditTableRow {
  id: string;
  type: 'CROPS' | 'CALLS' | 'FARMERS' | 'PROBLEMS';
  typeLabel: string;
  typeIcon: keyof typeof Ionicons.glyphMap;
  typeColor: string;
  farmerName: string;
  farmerMobile?: string;
  farmerKingId?: string;
  location?: string;
  title: string;
  details: string;
  dateStr: string;
  dateTimestamp: number;
  status: string;
  severity?: string;
  raw: any;
}

const theme = RoleThemes.FARM_ADVISOR;

export const AdvisorDashboardView: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { colors: tConfig, isDark, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { data: wallet } = useMyWallet();
  const { data: appSettings } = useAppSettings();
  const platformFeePercent = appSettings?.advisorPlatformFeePercent ?? 10.0;
  const adminFeePercent = appSettings?.advisorAdminFeePercent ?? 10.0;
  const doctorPayoutPercent = Math.max(0, 100 - (platformFeePercent + adminFeePercent));
  const { data: farmerStats } = useFarmerStats();
  const stats = farmerStats ?? { total: 0, active: 0, inactive: 0 };

  const { data: todaySchedule, isLoading: isLoadingToday } = useAdvisorTodaySchedule();
  const { data: delayedSchedule, isLoading: isLoadingDelayed } = useAdvisorDelayedSchedule();
  const { data: pendingCrops, isLoading: isLoadingPendingCrops } = usePendingCropsForAdvisor();
  const { data: acceptedCrops, isLoading: isLoadingAcceptedCrops } = useAcceptedCropsForAdvisor();
  const acceptCrop = useAcceptCropByAdvisor();
  const rejectCrop = useRejectCropByAdvisor();
  const completeCropReq = useCompleteCropRequirement();
  const { data: callRequests, isLoading: isLoadingCallRequests } = useMyCallRequests();
  const pendingCallRequests = (callRequests ?? []).filter((r) => r.status === 'PENDING');
  const { data: weatherAlerts, isLoading: isLoadingWeatherAlerts } = useAdvisorWeatherAlerts();

  const noScheduleCrops = useMemo(() => (acceptedCrops ?? []).filter(isScheduleFinishedOrMissing), [acceptedCrops]);

  const { data: pendingFarmersList, isLoading: isLoadingPendingFarmers } = useFarmersList('PENDING');
  const { data: assignedProblems, isLoading: isLoadingProblems } = useAssignedCropProblems();
  const acceptAssignment = useAcceptAssignment();
  const rejectAssignment = useRejectAssignment();
  const respondProblem = useRespondToCropProblem();

  const pendingFarmerRequests = pendingFarmersList ?? [];
  const pendingProblems = (assignedProblems ?? []).filter((p) => p.status === 'REPORTED' || p.status === 'UNDER_REVIEW');
  const resolvedProblems = (assignedProblems ?? []).filter((p) => p.status !== 'REPORTED' && p.status !== 'UNDER_REVIEW');

  const isGroupVoiceCallEnabled = (appSettings as any)?.groupVoiceCallEnabled ?? true;
  const { data: doctorSettings } = useDoctorSettings(user?.id);

  const voiceCallHook = useGroupVoiceCall();
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [selectedReviewCrop, setSelectedReviewCrop] = useState<AdvisorReviewCropCycle | null>(null);
  const [requestsAuditTab, setRequestsAuditTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [resolvingCallReq, setResolvingCallReq] = useState<CallRequest | null>(null);
  const [resolvingCallComment, setResolvingCallComment] = useState('');
  const resolveCallMutation = useResolveCallRequest();

  const [submissionSubFilter, setSubmissionSubFilter] = useState<'CROPS' | 'CALLS' | 'FARMERS' | 'PROBLEMS'>('CROPS');
  const [isProblemHistoryOpen, setIsProblemHistoryOpen] = useState(false);
  const [selectedProblemToRespond, setSelectedProblemToRespond] = useState<CropProblem | null>(null);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<string | null>(null);
  const [expandedProblemId, setExpandedProblemId] = useState<string | null>(null);
  const [expandedResolvedId, setExpandedResolvedId] = useState<string | null>(null);
  const [resolvedHistoryPage, setResolvedHistoryPage] = useState<number>(1);
  const [problemResponseText, setProblemResponseText] = useState('');
  const [problemProductText, setProblemProductText] = useState('');

  const [pendingFarmerToConfirm, setPendingFarmerToConfirm] = useState<any | null>(null);
  const [selectedCropCareTier, setSelectedCropCareTier] = useState<'CROP_ADVISOR_5' | 'CROP_DOCTOR_5' | 'CROP_DOCTOR_10'>('CROP_ADVISOR_5');

  // Pre-acceptance calibration state (plant count & stage modification before accept)
  const [cropToAcceptConfirm, setCropToAcceptConfirm] = useState<AdvisorReviewCropCycle | null>(null);
  const [acceptPlantCount, setAcceptPlantCount] = useState<string>('');
  const [acceptStage, setAcceptStage] = useState<string>('VEGETATIVE');

  // Single Consultation solution dispatch state
  const [solutionModalCrop, setSolutionModalCrop] = useState<AdvisorReviewCropCycle | null>(null);
  const [solutionTitle, setSolutionTitle] = useState('');
  const [solutionDosage, setSolutionDosage] = useState('');
  const [solutionDate, setSolutionDate] = useState(new Date().toISOString().slice(0, 10));

  const handleInitiateAcceptCrop = (crop: AdvisorReviewCropCycle) => {
    // If it's one-time consultation, accept directly without modification prompt ("one time wale nu shad ke")
    if ((crop as any).hiringModel === 'PAY_PER_CONSULTATION') {
      acceptCrop.mutate(crop.id, {
        onSuccess: () => {
          if (selectedReviewCrop?.id === crop.id) setSelectedReviewCrop(null);
          const msg = `✅ Request Accepted!\nThe farmer has been notified that you are actively working on "${crop.cropName}".`;
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Request Accepted', msg);
        },
      });
      return;
    }

    // For continuous doctor adoption, allow doctor to adjust plants and stage before accepting!
    setAcceptPlantCount(crop.plantCount ? String(crop.plantCount) : '');
    setAcceptStage(crop.stage || 'VEGETATIVE');
    setCropToAcceptConfirm(crop);
  };

  const handleConfirmAcceptWithDetails = () => {
    if (!cropToAcceptConfirm) return;
    const id = cropToAcceptConfirm.id;
    const name = cropToAcceptConfirm.cropName;
    const parsedPlants = acceptPlantCount.trim() ? parseInt(acceptPlantCount.trim(), 10) : undefined;

    acceptCrop.mutate(
      {
        id,
        payload: {
          plantCount: parsedPlants && !isNaN(parsedPlants) && parsedPlants > 0 ? parsedPlants : undefined,
          stage: acceptStage,
        },
      },
      {
        onSuccess: () => {
          setCropToAcceptConfirm(null);
          if (selectedReviewCrop?.id === id) setSelectedReviewCrop(null);
          const msg = `✅ Crop Added to Doctor Care!\nNumber of plants (${parsedPlants ?? 'Standard'}) and Stage (${acceptStage}) have been calibrated and locked. The farmer has been notified.`;
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Doctor Care Accepted', msg);
        },
      }
    );
  };

  const RESOLVED_PAGE_SIZE = 10;
  const totalResolvedPages = Math.ceil(resolvedProblems.length / RESOLVED_PAGE_SIZE) || 1;
  const paginatedResolvedProblems = useMemo(() => {
    const start = (resolvedHistoryPage - 1) * RESOLVED_PAGE_SIZE;
    return resolvedProblems.slice(start, start + RESOLVED_PAGE_SIZE);
  }, [resolvedProblems, resolvedHistoryPage]);

  // Unified Request & Audit Rows: PENDING
  const pendingTableRows = useMemo<AuditTableRow[]>(() => {
    const rows: AuditTableRow[] = [];

    // 1. Pending Crops
    (pendingCrops ?? []).forEach((crop) => {
      const farmer = crop.plot?.farm?.owner;
      const loc = [farmer?.village, farmer?.district].filter(Boolean).join(', ') || crop.plot?.farm?.name || crop.plot?.name;
      const dateObj = crop.createdAt ? new Date(crop.createdAt) : crop.sowingDate ? new Date(crop.sowingDate) : new Date();
      rows.push({
        id: `crop-${crop.id}`,
        type: 'CROPS',
        typeLabel: 'Crop Review',
        typeIcon: 'leaf',
        typeColor: '#38bdf8',
        farmerName: farmer?.name || 'Farmer',
        farmerMobile: farmer?.mobile,
        farmerKingId: farmer?.kingId,
        location: loc,
        title: crop.cropName + (crop.variety ? ` (${crop.variety})` : ''),
        details: `${crop.category || 'General Crop'}${crop.sowingDate ? ` · Sown: ${new Date(crop.sowingDate).toLocaleDateString('en-IN')}` : ''}`,
        dateStr: dateObj.toLocaleDateString('en-IN'),
        dateTimestamp: dateObj.getTime(),
        status: 'Awaiting Audit',
        raw: crop,
      });
    });

    // 2. Pending Calls
    (pendingCallRequests ?? []).forEach((call) => {
      const loc = [call.farmer?.village, call.farmer?.district].filter(Boolean).join(', ');
      const dateObj = call.createdAt ? new Date(call.createdAt) : new Date();
      rows.push({
        id: `call-${call.id}`,
        type: 'CALLS',
        typeLabel: 'Call Request',
        typeIcon: 'call',
        typeColor: '#f59e0b',
        farmerName: call.farmer?.name || 'Farmer',
        farmerMobile: call.farmer?.mobile,
        farmerKingId: call.farmer?.kingId,
        location: loc,
        title: call.topic || call.reason || 'Advisory Call Consultation',
        details: call.notes || 'Requested phone assistance',
        dateStr: dateObj.toLocaleDateString('en-IN'),
        dateTimestamp: dateObj.getTime(),
        status: 'Call Pending',
        raw: call,
      });
    });

    // 3. Pending Farmer Hire
    (pendingFarmerRequests ?? []).forEach((req: any) => {
      const farmer = req.farmer;
      const loc = [farmer?.village, farmer?.district, farmer?.state].filter(Boolean).join(', ');
      const dateObj = req.createdAt ? new Date(req.createdAt) : new Date();
      rows.push({
        id: `farmer-${req.id}`,
        type: 'FARMERS',
        typeLabel: 'Farmer Hire',
        typeIcon: 'person-add',
        typeColor: '#10b981',
        farmerName: farmer?.name || 'Farmer',
        farmerMobile: farmer?.mobile,
        farmerKingId: farmer?.kingId,
        location: loc,
        title: 'Farmer Advisory Attachment',
        details: `Tier: ${req.tier || 'Crop Care Package'}`,
        dateStr: dateObj.toLocaleDateString('en-IN'),
        dateTimestamp: dateObj.getTime(),
        status: 'New Request',
        raw: req,
      });
    });

    // 4. Pending Problems
    (pendingProblems ?? []).forEach((prob) => {
      const loc = [prob.reportedBy?.village, prob.reportedBy?.district].filter(Boolean).join(', ');
      const dateObj = prob.createdAt ? new Date(prob.createdAt) : new Date();
      rows.push({
        id: `prob-${prob.id}`,
        type: 'PROBLEMS',
        typeLabel: 'Crop Problem',
        typeIcon: 'alert-circle',
        typeColor: '#ef4444',
        farmerName: prob.reportedBy?.name || 'Farmer',
        farmerMobile: prob.reportedBy?.mobile,
        farmerKingId: prob.reportedBy?.kingId,
        location: loc,
        title: prob.title,
        details: `${prob.cropCycle?.cropName ? prob.cropCycle.cropName + ' · ' : ''}${prob.description || 'Reported crop issue'}`,
        dateStr: dateObj.toLocaleDateString('en-IN'),
        dateTimestamp: dateObj.getTime(),
        status: prob.severity || 'Reported',
        severity: prob.severity,
        raw: prob,
      });
    });

    return rows.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
  }, [pendingCrops, pendingCallRequests, pendingFarmerRequests, pendingProblems]);

  // Unified Request & Audit Rows: HISTORY
  const historyTableRows = useMemo<AuditTableRow[]>(() => {
    const rows: AuditTableRow[] = [];

    // 1. Accepted/Audited Crops
    (acceptedCrops ?? []).forEach((crop) => {
      const farmer = crop.plot?.farm?.owner;
      const loc = [farmer?.village, farmer?.district].filter(Boolean).join(', ') || crop.plot?.farm?.name || crop.plot?.name;
      const dateObj = crop.updatedAt ? new Date(crop.updatedAt) : crop.createdAt ? new Date(crop.createdAt) : new Date();
      rows.push({
        id: `crop-${crop.id}`,
        type: 'CROPS',
        typeLabel: 'Crop Audited',
        typeIcon: 'leaf',
        typeColor: '#10b981',
        farmerName: farmer?.name || 'Farmer',
        farmerMobile: farmer?.mobile,
        farmerKingId: farmer?.kingId,
        location: loc,
        title: crop.cropName + (crop.variety ? ` (${crop.variety})` : ''),
        details: `Field: ${crop.plot?.name || 'Main Plot'} · Verified & Monitored`,
        dateStr: dateObj.toLocaleDateString('en-IN'),
        dateTimestamp: dateObj.getTime(),
        status: 'Audited & Active',
        raw: crop,
      });
    });

    // 2. Resolved Calls
    (callRequests ?? []).filter((r) => r.status !== 'PENDING').forEach((call) => {
      const loc = [call.farmer?.village, call.farmer?.district].filter(Boolean).join(', ');
      const dateObj = call.updatedAt ? new Date(call.updatedAt) : call.createdAt ? new Date(call.createdAt) : new Date();
      rows.push({
        id: `call-${call.id}`,
        type: 'CALLS',
        typeLabel: 'Call Resolved',
        typeIcon: 'checkmark-circle',
        typeColor: '#38bdf8',
        farmerName: call.farmer?.name || 'Farmer',
        farmerMobile: call.farmer?.mobile,
        farmerKingId: call.farmer?.kingId,
        location: loc,
        title: call.topic || 'Voice Advisory Call',
        details: call.resolvedComment || 'Call completed and documented',
        dateStr: dateObj.toLocaleDateString('en-IN'),
        dateTimestamp: dateObj.getTime(),
        status: 'Resolved',
        raw: call,
      });
    });

    // 3. Resolved Problems
    (resolvedProblems ?? []).forEach((prob) => {
      const loc = [prob.reportedBy?.village, prob.reportedBy?.district].filter(Boolean).join(', ');
      const dateObj = prob.updatedAt ? new Date(prob.updatedAt) : prob.createdAt ? new Date(prob.createdAt) : new Date();
      rows.push({
        id: `prob-${prob.id}`,
        type: 'PROBLEMS',
        typeLabel: 'Problem Resolved',
        typeIcon: 'medkit',
        typeColor: '#8b5cf6',
        farmerName: prob.reportedBy?.name || 'Farmer',
        farmerMobile: prob.reportedBy?.mobile,
        farmerKingId: prob.reportedBy?.kingId,
        location: loc,
        title: prob.title,
        details: prob.advisorResponse || prob.diagnosis || 'Prescription provided & resolved',
        dateStr: dateObj.toLocaleDateString('en-IN'),
        dateTimestamp: dateObj.getTime(),
        status: 'Resolved',
        raw: prob,
      });
    });

    return rows.sort((a, b) => b.dateTimestamp - a.dateTimestamp);
  }, [acceptedCrops, callRequests, resolvedProblems]);

  const totalSubmissionsCount = (pendingCrops?.length ?? 0) + pendingCallRequests.length + pendingFarmerRequests.length + pendingProblems.length;

  const counts: Record<TabKey, number> = {
    SUBMISSIONS: totalSubmissionsCount,
    DELAYED: delayedSchedule?.length ?? 0,
    TODAY: todaySchedule?.length ?? 0,
    WEATHER: weatherAlerts?.length ?? 0,
    NO_SCHEDULE: noScheduleCrops.length,
    PROBLEMS: pendingProblems.length,
  };
  const isLoadingByTab: Record<TabKey, boolean> = {
    SUBMISSIONS: isLoadingPendingCrops || isLoadingCallRequests || isLoadingPendingFarmers || isLoadingProblems,
    DELAYED: isLoadingDelayed,
    TODAY: isLoadingToday,
    WEATHER: isLoadingWeatherAlerts,
    NO_SCHEDULE: isLoadingAcceptedCrops,
    PROBLEMS: isLoadingProblems,
  };

  const { data: myPlans = [], refetch: refetchMyPlans } = useMyAdvisorPlans();
  const savePlanMutation = useSaveAdvisorPlan();
  const { data: groupEvents = [], refetch: refetchGroupEvents } = useAdvisorGroupEvents();
  const scheduleGroupCallMutation = useScheduleGroupCall();
  const sendGroupAlertMutation = useSendGroupCallAlert();

  const [planForm, setPlanForm] = useState<Record<string, any>>({
    VIP_MONTHLY: { price: 299, callRequestLimit: 5, inAppCallLimit: 3, videoCallAllowed: false, videoCallLimit: 0, chatEnabled: true },
    PER_CROP: { price: 499, callRequestLimit: 10, inAppCallLimit: 5, videoCallAllowed: true, videoCallLimit: 2, chatEnabled: true },
    CONSULTATION: { price: 150, callRequestLimit: 1, inAppCallLimit: 1, videoCallAllowed: false, videoCallLimit: 0, chatEnabled: true },
  });

  const [groupCallForm, setGroupCallForm] = useState({
    title: '',
    scheduledAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 16),
    targetAudienceType: 'ALL_FARMERS',
    targetCropName: '',
    alertMessage: '',
  });

  // Sync loaded plans into form
  React.useEffect(() => {
    if (myPlans && myPlans.length > 0) {
      const updated = { ...planForm };
      myPlans.forEach((p: any) => {
        if (p.planType) {
          updated[p.planType] = {
            price: p.price,
            callRequestLimit: p.callRequestLimit ?? 5,
            inAppCallLimit: p.inAppCallLimit ?? 3,
            videoCallAllowed: p.videoCallAllowed ?? false,
            videoCallLimit: p.videoCallLimit ?? 0,
            chatEnabled: p.chatEnabled ?? true,
            approvalStatus: p.approvalStatus,
            adminNotes: p.adminNotes,
          };
        }
      });
      setPlanForm(updated);
    }
  }, [myPlans]);

  const defaultTab = useMemo<TabKey>(() => (Array.isArray(TAB_ORDER) ? TAB_ORDER?.find((k) => (counts?.[k] ?? 0) > 0) : undefined) ?? 'TODAY', []); // eslint-disable-line react-hooks/exhaustive-deps
  const [activeTab, setActiveTab] = useState<TabKey>(defaultTab);
  const [isMessengerOpen, setIsMessengerOpen] = useState(false);

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
    <View style={{ flex: 1, backgroundColor: isLight ? '#f1f5f9' : (tConfig.bg || '#020d06') }}>
      <ScrollView style={[styles.container, { backgroundColor: isLight ? '#f1f5f9' : (tConfig.bg || '#020d06') }]} contentContainerStyle={{ flexGrow: 1, paddingBottom: isDesktop ? 32 : 115 }} showsVerticalScrollIndicator={false}>
        <RoleHeader
          currentRole="FARM_ADVISOR"
          profileName={user?.name || 'Advisor'}
          avatarUrl={user?.photoUrl || undefined}
          onMessengerPress={() => setIsMessengerOpen(true)}
        />

        <View style={styles.content}>
          {/* Executive Agronomy Command Console Banner */}
          <LinearGradient
            colors={isLight ? ['#ffffff', '#f0fdf4', '#dcfce7'] : (isDark ? ['#061a10', '#0a2e1d', '#03140c'] : [cardBg, tConfig.bg, cardBg])}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.executiveHeroCard,
              {
                backgroundColor: isLight ? '#ffffff' : cardBg,
                borderColor: isLight ? '#bbf7d0' : cardBorder,
                shadowColor: tConfig.shadowColor || '#00ff87',
              },
            ]}
          >
            <View style={styles.heroTopRow}>
              <Text style={[styles.heroMainTitle, { color: textColor }]}>Agronomy Command Console</Text>
            </View>

            {/* Quick KPI Telemetry Grid */}
            <View style={[styles.kpiGrid, isDesktop && styles.kpiGridDesktop]}>
              {/* Card 1: Farmers */}
              <TouchableOpacity
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : (isDark ? '#071f14' : cardBg),
                    borderColor: isLight ? '#bbf7d0' : (isDark ? 'rgba(0, 255, 135, 0.22)' : cardBorder),
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => router.push('/(partner)/(tabs)/farmers' as never)}
              >
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)' }]}>
                  <Ionicons name="people" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
                </View>
                <View style={styles.kpiContentCol}>
                  <View style={styles.kpiValueRow}>
                    <Text style={[styles.kpiVal, { color: textColor }]}>{stats.total}</Text>
                    <View style={[styles.kpiTrendBadge, { backgroundColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.12)' }]}>
                      <Text style={[styles.kpiTrendText, { color: isLight ? '#15803d' : '#00ff87' }]}>
                        {stats.active} Active
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>Farmers</Text>
                </View>
              </TouchableOpacity>

              {/* Card 2: Crops */}
              <TouchableOpacity
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : (isDark ? '#071f14' : cardBg),
                    borderColor: isLight ? '#bae6fd' : (isDark ? 'rgba(56, 189, 248, 0.22)' : cardBorder),
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  setActiveTab('SUBMISSIONS');
                }}
              >
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.15)' }]}>
                  <Ionicons name="leaf" size={15} color={isLight ? '#0284c7' : '#38bdf8'} />
                </View>
                <View style={styles.kpiContentCol}>
                  <View style={styles.kpiValueRow}>
                    <Text style={[styles.kpiVal, { color: textColor }]}>{acceptedCrops?.length ?? 0}</Text>
                    <View style={[styles.kpiTrendBadge, { backgroundColor: pendingCrops?.length ? (isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)') : (isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.12)') }]}>
                      <Text style={[styles.kpiTrendText, { color: pendingCrops?.length ? (isLight ? '#b45309' : '#fbbf24') : (isLight ? '#0369a1' : '#38bdf8') }]}>
                        {pendingCrops?.length ? `${pendingCrops.length} New` : 'Audited'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>Crops</Text>
                </View>
              </TouchableOpacity>

              {/* Card 3: Operations */}
              <TouchableOpacity
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : (isDark ? '#071f14' : cardBg),
                    borderColor: isLight ? (delayedSchedule?.length ? '#fecaca' : '#bbf7d0') : (isDark ? (delayedSchedule?.length ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 255, 135, 0.22)') : cardBorder),
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => setActiveTab(delayedSchedule?.length ? 'DELAYED' : 'TODAY')}
              >
                <View style={[styles.kpiIconBox, { backgroundColor: delayedSchedule?.length ? (isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)') : (isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)') }]}>
                  <Ionicons
                    name={delayedSchedule?.length ? 'alert-circle' : 'calendar'}
                    size={15}
                    color={delayedSchedule?.length ? '#ef4444' : (isLight ? '#16a34a' : '#00ff87')}
                  />
                </View>
                <View style={styles.kpiContentCol}>
                  <View style={styles.kpiValueRow}>
                    <Text style={[styles.kpiVal, { color: delayedSchedule?.length ? '#ef4444' : textColor }]}>
                      {delayedSchedule?.length ? delayedSchedule.length : (todaySchedule?.length ?? 0)}
                    </Text>
                    <View style={[styles.kpiTrendBadge, { backgroundColor: delayedSchedule?.length ? (isLight ? '#fee2e2' : 'rgba(239, 68, 68, 0.15)') : (isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.12)') }]}>
                      <Text style={[styles.kpiTrendText, { color: delayedSchedule?.length ? (isLight ? '#b91c1c' : '#f87171') : (isLight ? '#15803d' : '#00ff87') }]}>
                        {delayedSchedule?.length ? 'Overdue' : 'On Track'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>Operations</Text>
                </View>
              </TouchableOpacity>

              {/* Card 4: Balance */}
              <TouchableOpacity
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : (isDark ? '#071f14' : cardBg),
                    borderColor: isLight ? '#fef08a' : (isDark ? 'rgba(245, 158, 11, 0.22)' : cardBorder),
                  },
                ]}
                activeOpacity={0.85}
                onPress={() => router.push('/(partner)/(tabs)/wallet' as never)}
              >
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)' }]}>
                  <Ionicons name="wallet" size={15} color={isLight ? '#b45309' : '#fbbf24'} />
                </View>
                <View style={styles.kpiContentCol}>
                  <View style={styles.kpiValueRow}>
                    <Text style={[styles.kpiVal, { color: isLight ? '#b45309' : '#fbbf24' }]}>
                      ₹{(wallet?.balance ?? 0).toLocaleString('en-IN')}
                    </Text>
                    <View style={[styles.kpiTrendBadge, { backgroundColor: isLight ? '#dcfce7' : 'rgba(16, 185, 129, 0.15)' }]}>
                      <Text style={[styles.kpiTrendText, { color: isLight ? '#15803d' : '#34d399' }]}>Wallet</Text>
                    </View>
                  </View>
                  <Text style={[styles.kpiTitle, { color: subTextColor }]} numberOfLines={1}>Balance</Text>
                </View>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          <GroupVoiceCallModal
            visible={showVoiceCallModal}
            onClose={() => setShowVoiceCallModal(false)}
            voiceCallHook={voiceCallHook}
            currentUserId={user?.id}
            isHostOrAdmin={true}
          />

          <DoctorMessengerModal
            visible={isMessengerOpen}
            onClose={() => setIsMessengerOpen(false)}
            onOpenGroupCall={() => setShowVoiceCallModal(true)}
          />

          {/* Executive Doctor Advisory Plans & Crop Specialization Console Banner */}
          <View
            style={{
              backgroundColor: isLight ? '#ffffff' : cardBg,
              borderRadius: RADIUS.lg,
              padding: 14,
              borderWidth: 1,
              borderColor: isLight ? '#e2e8f0' : cardBorder,
              gap: 10,
              marginBottom: 10,
              ...premiumShadow('#000000', 'xs'),
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="pricetags" size={17} color="#3b82f6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontFamily: FONT.bold, color: textColor }}>
                    Doctor Advisory Packs &amp; Crop Specialization
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor }}>
                    {doctorSettings?.allCropsSelected
                      ? '🌐 Universal Doctor · All Indian Crops'
                      : `🌾 ${(doctorSettings?.specializedCrops || []).length} Specialized Crops Active`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 5,
                  backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: RADIUS.pill,
                  borderWidth: 1,
                  borderColor: isLight ? '#bbf7d0' : '#059669',
                }}
                onPress={() => router.push('/(partner)/(tabs)/settings' as never)}
                activeOpacity={0.8}
              >
                <Ionicons name="options" size={13} color="#10b981" />
                <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: isLight ? '#15803d' : '#34d399' }}>
                  Manage in C-Panel →
                </Text>
              </TouchableOpacity>
            </View>

            {/* 6 Plan Status Badges Strip */}
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: doctorSettings?.monthlyPlanEnabled !== false ? (isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.12)') : (isLight ? '#f1f5f9' : '#0f172a'), borderWidth: 1, borderColor: isLight ? '#bfdbfe' : '#1e3a8a' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: doctorSettings?.monthlyPlanEnabled !== false ? '#2563eb' : subTextColor }}>
                  {doctorSettings?.monthlyPlanEnabled !== false ? '🟢' : '⚪'} Monthly (3 Tiers): ₹{doctorSettings?.monthlyPlan1Fee ?? doctorSettings?.monthlyFee ?? 299} / ₹{doctorSettings?.monthlyPlan2Fee ?? 599} / ₹{doctorSettings?.monthlyPlan3Fee ?? 999}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: doctorSettings?.plan3MonthsEnabled !== false ? (isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.12)') : (isLight ? '#f1f5f9' : '#0f172a'), borderWidth: 1, borderColor: isLight ? '#a7f3d0' : '#065f46' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: doctorSettings?.plan3MonthsEnabled !== false ? '#10b981' : subTextColor }}>
                  {doctorSettings?.plan3MonthsEnabled !== false ? '🟢' : '⚪'} 3-Mo: {doctorSettings?.discount3Months ?? 10}% OFF (From ₹{doctorSettings?.fee3Months ?? 799})
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: doctorSettings?.plan6MonthsEnabled !== false ? (isLight ? '#fdf2f8' : 'rgba(236, 72, 153, 0.12)') : (isLight ? '#f1f5f9' : '#0f172a'), borderWidth: 1, borderColor: isLight ? '#fbcfe8' : '#831843' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: doctorSettings?.plan6MonthsEnabled !== false ? '#ec4899' : subTextColor }}>
                  {doctorSettings?.plan6MonthsEnabled !== false ? '🟢' : '⚪'} 6-Mo: {doctorSettings?.discount6Months ?? 15}% OFF (From ₹{doctorSettings?.fee6Months ?? 1499})
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: doctorSettings?.plan12MonthsEnabled !== false ? (isLight ? '#fff7ed' : 'rgba(249, 115, 22, 0.12)') : (isLight ? '#f1f5f9' : '#0f172a'), borderWidth: 1, borderColor: isLight ? '#fed7aa' : '#7c2d12' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: doctorSettings?.plan12MonthsEnabled !== false ? '#f97316' : subTextColor }}>
                  {doctorSettings?.plan12MonthsEnabled !== false ? '🟢' : '⚪'} 12-Mo: {doctorSettings?.discount12Months ?? 25}% OFF (From ₹{doctorSettings?.fee12Months ?? 2699})
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: doctorSettings?.cropSeasonPlanEnabled !== false ? (isLight ? '#fff7ed' : 'rgba(249, 115, 22, 0.12)') : (isLight ? '#f1f5f9' : '#0f172a'), borderWidth: 1, borderColor: isLight ? '#fed7aa' : '#7c2d12' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: doctorSettings?.cropSeasonPlanEnabled !== false ? '#ea580c' : subTextColor }}>
                  {doctorSettings?.cropSeasonPlanEnabled !== false ? '🟢' : '⚪'} Season: ₹{doctorSettings?.cropSeasonFee ?? 499}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: doctorSettings?.singleConsultationPlanEnabled !== false ? (isLight ? '#f5f3ff' : 'rgba(139, 92, 246, 0.12)') : (isLight ? '#f1f5f9' : '#0f172a'), borderWidth: 1, borderColor: isLight ? '#ddd6fe' : '#4c1d95' }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: doctorSettings?.singleConsultationPlanEnabled !== false ? '#7c3aed' : subTextColor }}>
                  {doctorSettings?.singleConsultationPlanEnabled !== false ? '🟢' : '⚪'} SOS Visit: ₹{doctorSettings?.singleConsultationFee ?? 150}
                </Text>
              </View>
            </View>

            {/* Specialized Crop Chips Preview */}
            {!doctorSettings?.allCropsSelected && (doctorSettings?.specializedCrops || []).length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', paddingTop: 2 }}>
                <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: subTextColor }}>Specialist In:</Text>
                {(doctorSettings?.specializedCrops || []).slice(0, 10).map((crop: string) => (
                  <View key={crop} style={{ backgroundColor: isLight ? '#f1f5f9' : '#0f172a', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: isLight ? '#cbd5e1' : '#334155' }}>
                    <Text style={{ fontSize: 10, fontFamily: FONT.semiBold, color: textColor }}>{crop}</Text>
                  </View>
                ))}
                {(doctorSettings?.specializedCrops || []).length > 10 && (
                  <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: subTextColor }}>
                    +{(doctorSettings?.specializedCrops || []).length - 10} more
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Single tabbed card replaces 4 stacked sections — one clear focus at a time */}
          <View style={[styles.sectionCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder, shadowColor: tConfig.shadowColor || '#00ff87' }]}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
              {TAB_ORDER.map((key) => {
                const meta = TAB_META[key];
                const isActive = activeTab === key;
                const count = counts[key] ?? 0;
                const hasUrgent = count > 0 && (key === 'DELAYED' || key === 'PROBLEMS');

                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.tabChip,
                      {
                        backgroundColor: isActive
                          ? (isLight ? '#f0fdf4' : 'rgba(0, 255, 135, 0.16)')
                          : (isLight ? '#f8fafc' : '#072414'),
                        borderColor: isActive ? meta.color : (isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.18)'),
                      },
                      isActive && {
                        borderWidth: 1.5,
                        shadowColor: meta.color,
                        shadowOpacity: isLight ? 0.15 : 0.35,
                        shadowRadius: 8,
                      },
                    ]}
                    activeOpacity={0.85}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setActiveTab(key);
                    }}
                  >
                    <Ionicons
                      name={hasUrgent ? 'alert-circle' : meta.icon}
                      size={14}
                      color={isActive ? meta.color : (isLight ? '#64748b' : '#94a3b8')}
                    />
                    <Text
                      style={[
                        styles.tabChipText,
                        {
                          color: isActive ? (isLight ? '#15803d' : '#ffffff') : (isLight ? '#475569' : '#cbd5e1'),
                          fontFamily: isActive ? FONT.extraBold : FONT.semiBold,
                        },
                      ]}
                    >
                      {meta.label}
                    </Text>
                    {count > 0 ? (
                      <View
                        style={[
                          styles.tabChipCount,
                          {
                            backgroundColor: hasUrgent ? '#ef4444' : isActive ? meta.color : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)'),
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tabChipCountText,
                            {
                              color: hasUrgent || isActive ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8'),
                              fontFamily: FONT.extraBold,
                            },
                          ]}
                        >
                          {count}
                        </Text>
                      </View>
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={[styles.tabBody, { borderTopColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)' }]}>
              {isLoadingByTab[activeTab] ? (
                <ActivityIndicator color={activeMeta.color} style={{ marginVertical: 16 }} />
              ) : activeTab === 'SUBMISSIONS' ? (
                (() => {
                  const displayedRows = requestsAuditTab === 'PENDING' ? pendingTableRows : historyTableRows;

                  return (
                    <View style={[styles.tableCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder, shadowColor: tConfig.shadowColor || '#00ff87' }]}>
                      {/* 1. Requests & Audits: 2 Main Tabs (Pending & History) */}
                      <View style={[styles.requestsMainTabsRow, { borderBottomColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)' }]}>
                        <TouchableOpacity
                          style={[
                            styles.requestsMainTabBtn,
                            {
                              backgroundColor: requestsAuditTab === 'PENDING'
                                ? (isLight ? '#ecfdf5' : 'rgba(0, 255, 135, 0.12)')
                                : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'),
                              borderColor: requestsAuditTab === 'PENDING'
                                ? (isLight ? '#10b981' : 'rgba(0, 255, 135, 0.4)')
                                : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'),
                            },
                          ]}
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setRequestsAuditTab('PENDING');
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="time-outline"
                            size={16}
                            color={requestsAuditTab === 'PENDING' ? (isLight ? '#059669' : '#00ff87') : (isLight ? '#64748b' : '#94a3b8')}
                          />
                          <Text style={[styles.requestsMainTabText, { color: requestsAuditTab === 'PENDING' ? (isLight ? '#065f46' : '#ffffff') : (isLight ? '#64748b' : '#94a3b8') }]}>
                            Pending
                          </Text>
                          <View style={[
                            styles.requestsMainTabBadge,
                            {
                              backgroundColor: requestsAuditTab === 'PENDING'
                                ? (isLight ? '#10b981' : '#00ff87')
                                : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'),
                            },
                          ]}>
                            <Text style={[
                              styles.requestsMainTabBadgeText,
                              { color: requestsAuditTab === 'PENDING' ? '#ffffff' : (isLight ? '#475569' : '#94a3b8') },
                            ]}>
                              {pendingTableRows.length}
                            </Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.requestsMainTabBtn,
                            {
                              backgroundColor: requestsAuditTab === 'HISTORY'
                                ? (isLight ? '#ecfdf5' : 'rgba(0, 255, 135, 0.12)')
                                : (isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)'),
                              borderColor: requestsAuditTab === 'HISTORY'
                                ? (isLight ? '#10b981' : 'rgba(0, 255, 135, 0.4)')
                                : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)'),
                            },
                          ]}
                          onPress={() => {
                            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setRequestsAuditTab('HISTORY');
                          }}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name="file-tray-full-outline"
                            size={16}
                            color={requestsAuditTab === 'HISTORY' ? (isLight ? '#059669' : '#00ff87') : (isLight ? '#64748b' : '#94a3b8')}
                          />
                          <Text style={[styles.requestsMainTabText, { color: requestsAuditTab === 'HISTORY' ? (isLight ? '#065f46' : '#ffffff') : (isLight ? '#64748b' : '#94a3b8') }]}>
                            History
                          </Text>
                          <View style={[
                            styles.requestsMainTabBadge,
                            {
                              backgroundColor: requestsAuditTab === 'HISTORY'
                                ? (isLight ? '#10b981' : '#00ff87')
                                : (isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.1)'),
                            },
                          ]}>
                            <Text style={[
                              styles.requestsMainTabBadgeText,
                              { color: requestsAuditTab === 'HISTORY' ? '#ffffff' : (isLight ? '#475569' : '#94a3b8') },
                            ]}>
                              {historyTableRows.length}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      </View>

                      {/* 2. High-Density Responsive Table View */}
                      {displayedRows.length === 0 ? (
                        <View style={styles.emptyTableState}>
                          <Ionicons name="documents-outline" size={32} color={subTextColor} />
                          <Text style={[styles.emptyTableText, { color: subTextColor }]}>
                            {requestsAuditTab === 'PENDING' ? 'No pending requests found.' : 'No audit history records found.'}
                          </Text>
                        </View>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={true} contentContainerStyle={{ minWidth: isDesktop ? '100%' : 920 }}>
                          <View style={{ flex: 1 }}>
                            {/* Table Header Row */}
                            <View style={[styles.tableHeaderRow, { backgroundColor: isLight ? '#f1f5f9' : '#03140c', borderBottomColor: isLight ? '#cbd5e1' : 'rgba(0, 255, 135, 0.15)' }]}>
                              <Text style={[styles.tableHeaderCell, { width: 140, color: isLight ? '#0f172a' : '#00ff87' }]}>REQUEST TYPE</Text>
                              <Text style={[styles.tableHeaderCell, { width: 190, color: isLight ? '#0f172a' : '#00ff87' }]}>FARMER & CONTACT</Text>
                              <Text style={[styles.tableHeaderCell, { flex: 1, minWidth: 220, color: isLight ? '#0f172a' : '#00ff87' }]}>REQUEST DETAILS</Text>
                              <Text style={[styles.tableHeaderCell, { width: 100, color: isLight ? '#0f172a' : '#00ff87' }]}>DATE</Text>
                              <Text style={[styles.tableHeaderCell, { width: 110, color: isLight ? '#0f172a' : '#00ff87' }]}>STATUS</Text>
                              <Text style={[styles.tableHeaderCell, { width: 220, textAlign: 'right', color: isLight ? '#0f172a' : '#00ff87' }]}>ACTIONS</Text>
                            </View>

                            {/* Table Body Rows */}
                            {displayedRows.map((row, index) => {
                              const isEven = index % 2 === 0;
                              return (
                                <View
                                  key={row.id}
                                  style={[
                                    styles.tableRow,
                                    {
                                      backgroundColor: isLight
                                        ? (isEven ? '#ffffff' : '#f8fafc')
                                        : (isEven ? '#05190f' : '#071f14'),
                                      borderBottomColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.05)',
                                    },
                                  ]}
                                >
                                  {/* Type Column */}
                                  <View style={[styles.tableCell, { width: 140 }]}>
                                    <View style={[styles.typeBadge, { backgroundColor: `${row.typeColor}18`, borderColor: `${row.typeColor}44` }]}>
                                      <Ionicons name={row.typeIcon} size={12} color={row.typeColor} />
                                      <Text style={[styles.typeBadgeText, { color: row.typeColor }]}>
                                        {row.typeLabel}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Farmer & Contact Column */}
                                  <View style={[styles.tableCell, { width: 190, gap: 1 }]}>
                                    <Text style={[styles.tableFarmerName, { color: textColor }]} numberOfLines={1}>
                                      {row.farmerName}
                                    </Text>
                                    {row.farmerMobile ? (
                                      <TouchableOpacity
                                        onPress={() => Linking.openURL(`tel:${row.farmerMobile}`)}
                                        activeOpacity={0.7}
                                        style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                                      >
                                        <Ionicons name="call" size={10} color={isLight ? '#059669' : '#00ff87'} />
                                        <Text style={[styles.tableFarmerMobile, { color: isLight ? '#047857' : '#00ff87' }]}>{row.farmerMobile}</Text>
                                        {row.farmerKingId ? <Text style={[styles.tableFarmerKingId, { color: subTextColor }]}>· {row.farmerKingId}</Text> : null}
                                      </TouchableOpacity>
                                    ) : null}
                                    {row.location ? (
                                      <Text style={[styles.tableFarmerLocation, { color: isLight ? '#64748b' : '#94a3b8' }]} numberOfLines={1}>
                                        📍 {row.location}
                                      </Text>
                                    ) : null}
                                  </View>

                                  {/* Details Column */}
                                  <View style={[styles.tableCell, { flex: 1, minWidth: 220, gap: 2 }]}>
                                    <Text style={[styles.tableTitleText, { color: textColor }]} numberOfLines={1}>
                                      {row.title}
                                    </Text>
                                    <Text style={[styles.tableDetailsText, { color: subTextColor }]} numberOfLines={1}>
                                      {row.details}
                                    </Text>
                                  </View>

                                  {/* Date Column */}
                                  <View style={[styles.tableCell, { width: 100 }]}>
                                    <Text style={[styles.tableDateText, { color: subTextColor }]}>{row.dateStr}</Text>
                                  </View>

                                  {/* Status Column */}
                                  <View style={[styles.tableCell, { width: 110 }]}>
                                    <View style={[styles.statusBadge, {
                                      backgroundColor: row.status.includes('ACTIVE') || row.status.includes('Resolved') || row.status.includes('Audited')
                                        ? 'rgba(16, 185, 129, 0.15)'
                                        : row.severity === 'HIGH' || row.severity === 'CRITICAL'
                                        ? 'rgba(239, 68, 68, 0.18)'
                                        : 'rgba(245, 158, 11, 0.15)',
                                      borderColor: row.status.includes('ACTIVE') || row.status.includes('Resolved') || row.status.includes('Audited')
                                        ? 'rgba(16, 185, 129, 0.35)'
                                        : row.severity === 'HIGH' || row.severity === 'CRITICAL'
                                        ? 'rgba(239, 68, 68, 0.4)'
                                        : 'rgba(245, 158, 11, 0.35)',
                                    }]}>
                                      <Text style={[styles.statusBadgeText, {
                                        color: row.status.includes('ACTIVE') || row.status.includes('Resolved') || row.status.includes('Audited')
                                          ? '#10b981'
                                          : row.severity === 'HIGH' || row.severity === 'CRITICAL'
                                          ? '#f87171'
                                          : '#f59e0b',
                                      }]}>
                                        {row.status}
                                      </Text>
                                    </View>
                                  </View>

                                  {/* Actions Column */}
                                  <View style={[styles.tableCell, { width: 220, flexDirection: 'row', justifyContent: 'flex-end', gap: 5 }]}>
                                    {requestsAuditTab === 'PENDING' ? (
                                      row.type === 'CROPS' ? (
                                        <>
                                          <TouchableOpacity
                                            style={[styles.tableActionBtn, { backgroundColor: '#2563eb' }]}
                                            onPress={() => setSelectedReviewCrop(row.raw)}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="eye" size={11} color="#ffffff" />
                                            <Text style={styles.tableActionBtnText}>Review</Text>
                                          </TouchableOpacity>

                                          <TouchableOpacity
                                            style={[styles.tableActionBtn, { backgroundColor: '#059669' }]}
                                            disabled={acceptCrop.isPending || rejectCrop.isPending}
                                            onPress={() => handleInitiateAcceptCrop(row.raw)}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="checkmark" size={11} color="#ffffff" />
                                            <Text style={styles.tableActionBtnText}>Accept</Text>
                                          </TouchableOpacity>

                                          <TouchableOpacity
                                            style={[styles.tableIconActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                                            disabled={rejectCrop.isPending || acceptCrop.isPending}
                                            onPress={() => handleReject(row.raw.id, row.raw.cropName)}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="close" size={12} color="#f87171" />
                                          </TouchableOpacity>
                                        </>
                                      ) : row.type === 'CALLS' ? (
                                        <>
                                          <TouchableOpacity
                                            style={[styles.tableActionBtn, { backgroundColor: '#10b981' }]}
                                            onPress={() => Linking.openURL(`tel:${row.farmerMobile}`)}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="call" size={11} color="#ffffff" />
                                            <Text style={styles.tableActionBtnText}>Call</Text>
                                          </TouchableOpacity>

                                          <TouchableOpacity
                                            style={[styles.tableActionBtn, { backgroundColor: '#0284c7' }]}
                                            onPress={() => {
                                              setResolvingCallReq(row.raw);
                                              setResolvingCallComment('');
                                            }}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="checkmark-done" size={11} color="#ffffff" />
                                            <Text style={styles.tableActionBtnText}>Resolve</Text>
                                          </TouchableOpacity>
                                        </>
                                      ) : row.type === 'FARMERS' ? (
                                        <>
                                          <TouchableOpacity
                                            style={[styles.tableActionBtn, { backgroundColor: '#059669' }]}
                                            disabled={acceptAssignment.isPending || rejectAssignment.isPending}
                                            onPress={() => {
                                              setSelectedCropCareTier((user as any)?.isSeniorDoctor ? 'CROP_DOCTOR_5' : 'CROP_ADVISOR_5');
                                              setPendingFarmerToConfirm(row.raw);
                                            }}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="checkmark" size={11} color="#ffffff" />
                                            <Text style={styles.tableActionBtnText}>Confirm</Text>
                                          </TouchableOpacity>

                                          <TouchableOpacity
                                            style={[styles.tableIconActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}
                                            disabled={rejectAssignment.isPending || acceptAssignment.isPending}
                                            onPress={() => rejectAssignment.mutate({ id: row.raw.id })}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="close" size={12} color="#f87171" />
                                          </TouchableOpacity>
                                        </>
                                      ) : (
                                        <>
                                          <TouchableOpacity
                                            style={[styles.tableActionBtn, { backgroundColor: '#e11d48' }]}
                                            onPress={() => {
                                              setSelectedProblemToRespond(row.raw);
                                              setProblemResponseText(row.raw.advisorResponse || '');
                                              setProblemProductText(row.raw.recommendedProduct || '');
                                            }}
                                            activeOpacity={0.8}
                                          >
                                            <Ionicons name="medical" size={11} color="#ffffff" />
                                            <Text style={styles.tableActionBtnText}>Prescribe</Text>
                                          </TouchableOpacity>
                                        </>
                                      )
                                    ) : (
                                      /* History Actions */
                                      <TouchableOpacity
                                        style={[
                                          styles.tableActionBtn,
                                          {
                                            backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)',
                                            borderWidth: 1,
                                            borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.2)',
                                          },
                                        ]}
                                        onPress={() => {
                                          if (row.type === 'CROPS') setSelectedReviewCrop(row.raw);
                                          else if (row.type === 'PROBLEMS') setSelectedProblemToRespond(row.raw);
                                          else if (row.type === 'CALLS' && row.raw.resolvedComment) {
                                            Platform.OS === 'web' ? alert(`Call Summary: ${row.raw.resolvedComment}`) : Alert.alert('Call Summary', row.raw.resolvedComment);
                                          }
                                        }}
                                        activeOpacity={0.8}
                                      >
                                        <Ionicons name="eye-outline" size={11} color={isLight ? '#475569' : '#cbd5e1'} />
                                        <Text style={[styles.tableActionBtnText, { color: isLight ? '#334155' : '#e2e8f0' }]}>View Record</Text>
                                      </TouchableOpacity>
                                    )}
                                  </View>
                                </View>
                              );
                            })}
                          </View>
                        </ScrollView>
                      )}
                    </View>
                  );
                })()
              ) : activeTab === 'WEATHER' ? (
                <WeatherAlertsList alerts={weatherAlerts} meta={activeMeta} />
              ) : activeTab === 'NO_SCHEDULE' ? (
                noScheduleCrops.length === 0 ? (
                  <Text style={[styles.emptyText, { color: subTextColor }]}>All active crops have valid upcoming schedules! 🎉</Text>
                ) : (
                  <View style={{ gap: 10 }}>
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#b45309', backgroundColor: '#fff7ed', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#fed7aa' }}>
                      ⚠️ Alert: The following crops currently have no active schedule assigned or their existing schedule has expired/finished. Please allocate a schedule.
                    </Text>
                    {noScheduleCrops.map((crop) => {
                      const farmer = crop.plot?.farm?.owner;
                      const locationStr = [farmer?.village, farmer?.district, farmer?.state].filter(Boolean).join(', ');
                      const isMissing = !crop.assignedSchedule || !crop.assignedSchedule.trim();

                      return (
                        <View key={crop.id} style={[styles.reviewCard, { borderColor: isLight ? '#fed7aa' : 'rgba(245, 158, 11, 0.3)', backgroundColor: isLight ? '#fffbf5' : cardBg }]}>
                          <View style={styles.reviewCardHeader}>
                            <View style={{ flex: 1, gap: 2 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text style={[styles.reviewCropTitle, { color: textColor }]}>
                                  🌾 {crop.cropName}{' '}
                                  <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#1d4ed8' }}>
                                    (ID: {crop.cropId || (crop.id.startsWith('CR-') ? crop.id : `CR-${crop.id.slice(0, 6).toUpperCase()}`)})
                                  </Text>
                                </Text>
                                {crop.variety ? <Text style={[styles.reviewCropVariety, { color: subTextColor }]}>({crop.variety})</Text> : null}
                                <View style={[styles.pendingBadge, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
                                  <Ionicons name="alert-circle" size={10} color="#dc2626" />
                                  <Text style={[styles.pendingBadgeText, { color: '#dc2626' }]}>
                                    {isMissing ? 'NO SCHEDULE ALOTTED' : 'SCHEDULE FINISHED / EXPIRED'}
                                  </Text>
                                </View>
                              </View>
                              <Text style={[styles.reviewCropCategory, { color: subTextColor }]}>
                                📂 {crop.category || 'General Crop'} {crop.sowingDate ? `· 📅 Sown: ${new Date(crop.sowingDate).toLocaleDateString('en-IN')}` : ''}
                              </Text>
                            </View>
                          </View>

                          <View style={[styles.submissionFarmerHighlight, { backgroundColor: isLight ? '#f8fafc' : '#072414', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.2)' }]}>
                            <Text style={[styles.submissionFarmerText, { color: textColor }]}>
                              👨‍🌾 Farmer: <Text style={{ fontFamily: FONT.bold, color: isLight ? '#1e40af' : '#60a5fa' }}>{farmer?.name || 'Farmer'}</Text>
                              {farmer?.mobile ? ` (📞 ${farmer.mobile})` : ''}
                            </Text>
                            {crop.plot?.name ? (
                              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor, marginTop: 2 }}>
                                📍 Plot: {crop.plot.name} {locationStr ? `· ${locationStr}` : ''}
                              </Text>
                            ) : null}
                          </View>

                          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                            <TouchableOpacity
                              style={[styles.acceptCropBtn, { backgroundColor: '#10b981', paddingHorizontal: 12, height: 34 }]}
                              disabled={completeCropReq.isPending}
                              onPress={() => {
                                completeCropReq.mutate(
                                  { id: crop.id, notes: 'Advisory consultation finalized.' },
                                  {
                                    onSuccess: () => {
                                      const msg = `✅ Requirement Completed!\nConfirmation message and review request have been sent to the farmer for "${crop.cropName}".`;
                                      Platform.OS === 'web' ? alert(msg) : Alert.alert('Requirement Completed', msg);
                                    },
                                  }
                                );
                              }}
                            >
                              {completeCropReq.isPending ? (
                                <ActivityIndicator color="#ffffff" size="small" />
                              ) : (
                                <>
                                  <Ionicons name="checkmark-done-circle" size={15} color="#ffffff" />
                                  <Text style={styles.acceptCropBtnText}>Complete Requirement ✅</Text>
                                </>
                              )}
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={[styles.acceptCropBtn, { backgroundColor: theme.primary, paddingHorizontal: 14, height: 34 }]}
                              onPress={() => router.push('/(partner)/(tabs)/schedule' as never)}
                            >
                              <Ionicons name="calendar-outline" size={15} color="#ffffff" />
                              <Text style={styles.acceptCropBtnText}>Assign / Update Schedule 📅</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )
              ) : activeTab === 'PROBLEMS' ? (
                <View style={{ gap: 10 }}>
                  {pendingProblems.length === 0 ? (
                    <Text style={[styles.emptyText, { color: subTextColor }]}>No active pending crop problem reports. All caught up!</Text>
                  ) : (
                    <View style={{ gap: 10 }}>
                      {pendingProblems.map((prob) => {
                        const isHigh = prob.severity === 'HIGH' || prob.severity === 'CRITICAL';
                        const isExpanded = expandedProblemId === prob.id;
                        const photoCount = prob.photos?.length ?? 0;

                        return (
                          <View key={prob.id} style={[styles.reviewCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isHigh ? (isLight ? '#fca5a5' : 'rgba(239, 68, 68, 0.4)') : (isLight ? '#e2e8f0' : cardBorder) }]}>
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
                                  <Text style={[styles.reviewCropTitle, { color: textColor }]}>⚠️ {prob.title}</Text>
                                  <View style={[styles.pendingBadge, { backgroundColor: isHigh ? '#fef2f2' : '#eff6ff', borderColor: isHigh ? '#fecaca' : '#bfdbfe' }]}>
                                    <Text style={[styles.pendingBadgeText, { color: isHigh ? '#dc2626' : '#1d4ed8' }]}>
                                      {prob.severity || 'REPORTED'}
                                    </Text>
                                  </View>
                                </View>
                                <Text style={[styles.reviewCropCategory, { color: subTextColor }]}>
                                  👨‍🌾 {prob.reportedBy?.name || 'Farmer'} · 🌾 {prob.cropCycle?.cropName || 'Crop Issue'} · 📅 {new Date(prob.createdAt).toLocaleDateString('en-IN')}
                                  {photoCount > 0 ? ` · 📷 ${photoCount} Photo${photoCount > 1 ? 's' : ''}` : ''}
                                </Text>
                              </View>
                              <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color={subTextColor} />
                            </TouchableOpacity>

                            {isExpanded ? (
                              <>
                                <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: isLight ? '#334155' : '#cbd5e1', marginVertical: 4 }}>
                                  {prob.description}
                                </Text>
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                                  <TouchableOpacity
                                    style={[styles.acceptCropBtn, { backgroundColor: '#e11d48', paddingHorizontal: 14, height: 34 }]}
                                    onPress={() => {
                                      setSelectedProblemToRespond(prob);
                                      setProblemResponseText(prob.advisorResponse || '');
                                      setProblemProductText(prob.recommendedProduct || '');
                                    }}
                                  >
                                    <Ionicons name="chatbox-ellipses" size={15} color="#ffffff" />
                                    <Text style={styles.acceptCropBtnText}>Provide Advice & Remedy</Text>
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

      {/* QUICK CALL RESOLUTION MODAL */}
      <Modal
        visible={Boolean(resolvingCallReq)}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setResolvingCallReq(null);
          setResolvingCallComment('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.proModalCard, { maxWidth: 440, backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#cbd5e1' : cardBorder }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderBottomWidth: 1, borderBottomColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)' }}>
              <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.2)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="call" size={17} color={isLight ? '#0284c7' : '#38bdf8'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: textColor }}>Resolve Call Request</Text>
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor }}>
                  Farmer: {resolvingCallReq?.farmer?.name || 'Farmer'} {resolvingCallReq?.farmer?.mobile ? `(📞 ${resolvingCallReq.farmer.mobile})` : ''}
                </Text>
              </View>
            </View>

            <View style={{ padding: 14, gap: 8 }}>
              <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: subTextColor }}>
                Consultation Advice / Call Summary:
              </Text>
              <TextInput
                style={{
                  backgroundColor: isLight ? '#f8fafc' : '#0a1a12',
                  borderWidth: 1,
                  borderColor: isLight ? '#cbd5e1' : 'rgba(0, 255, 135, 0.3)',
                  borderRadius: RADIUS.sm,
                  padding: 10,
                  color: textColor,
                  fontSize: 12.5,
                  fontFamily: FONT.regular,
                  minHeight: 70,
                  textAlignVertical: 'top',
                }}
                placeholder="Enter spray recommendations, advice provided, or outcome..."
                placeholderTextColor={subTextColor}
                multiline
                value={resolvingCallComment}
                onChangeText={setResolvingCallComment}
              />

              <View style={{ flexDirection: 'row', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
                <TouchableOpacity
                  style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: RADIUS.xs, backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.08)' }}
                  onPress={() => {
                    setResolvingCallReq(null);
                    setResolvingCallComment('');
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: subTextColor }}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: RADIUS.xs,
                    backgroundColor: '#059669',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    opacity: !resolvingCallComment.trim() ? 0.6 : 1,
                  }}
                  disabled={resolveCallMutation.isPending || !resolvingCallComment.trim()}
                  onPress={async () => {
                    if (!resolvingCallReq || !resolvingCallComment.trim()) return;
                    try {
                      await resolveCallMutation.mutateAsync({
                        id: resolvingCallReq.id,
                        comment: resolvingCallComment.trim(),
                      });
                      setResolvingCallReq(null);
                      setResolvingCallComment('');
                    } catch (err: any) {
                      const msg = err?.response?.data?.message || err?.message || 'Failed to resolve call';
                      Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
                    }
                  }}
                >
                  {resolveCallMutation.isPending ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={14} color="#ffffff" />
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>Save & Resolve</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* CROP CARE COUPON ASSIGNMENT & FARMER CONFIRMATION MODAL */}
      <Modal
        visible={!!pendingFarmerToConfirm}
        transparent
        animationType="fade"
        onRequestClose={() => setPendingFarmerToConfirm(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.proModalCard, { maxWidth: 460, backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#cbd5e1' : cardBorder }]}>
            <LinearGradient colors={['#1e3a8a', '#1d4ed8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.proModalHeaderBanner}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.proModalHeaderTag}>CROP CARE VIP PASS PLAN</Text>
                <Text style={styles.proModalHeaderTitle} numberOfLines={1}>
                  🩺 Confirm & Attach Farmer
                </Text>
              </View>
              <TouchableOpacity style={styles.proModalCloseBtn} onPress={() => setPendingFarmerToConfirm(null)}>
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>

            {pendingFarmerToConfirm ? (
              <View style={{ padding: 16, gap: 14 }}>
                {/* Farmer Highlight */}
                <View style={[styles.proFarmerStrip, { backgroundColor: isLight ? '#f8fafc' : '#072414', borderLeftWidth: 3, borderLeftColor: '#2563eb' }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.proFarmerName}>
                      👨‍🌾 <Text style={{ fontFamily: FONT.extraBold, color: textColor }}>{pendingFarmerToConfirm.farmer?.name || 'Farmer'}</Text>
                    </Text>
                    <Text style={[styles.proFarmerMeta, { color: subTextColor }]} numberOfLines={1}>
                      📞 {pendingFarmerToConfirm.farmer?.mobile || 'No Mobile'} {pendingFarmerToConfirm.farmer?.kingId ? `· King ID: ${pendingFarmerToConfirm.farmer.kingId}` : ''}
                    </Text>
                  </View>
                </View>

                {/* Plan Selection Header */}
                <View style={{ gap: 4 }}>
                  <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: textColor }}>
                    Select "Crop Care" Coupon Plan:
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor }}>
                    {(user as any)?.isSeniorDoctor
                      ? 'As a Crop Doctor (Senior Specialist), you have 2 Crop Care plan options:'
                      : 'As a Crop Advisor, assign the 5-Crop Crop Care plan:'}
                  </Text>
                </View>

                {/* Plan Options */}
                <View style={{ gap: 10 }}>
                  {(user as any)?.isSeniorDoctor ? (
                    <>
                      {/* Option 1: Senior Doctor 5 Crops */}
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: RADIUS.md,
                          borderWidth: 2,
                          borderColor: selectedCropCareTier === 'CROP_DOCTOR_5' ? '#2563eb' : '#e2e8f0',
                          backgroundColor: selectedCropCareTier === 'CROP_DOCTOR_5' ? '#eff6ff' : '#ffffff',
                        }}
                        activeOpacity={0.85}
                        onPress={() => setSelectedCropCareTier('CROP_DOCTOR_5')}
                      >
                        <Ionicons
                          name={selectedCropCareTier === 'CROP_DOCTOR_5' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={selectedCropCareTier === 'CROP_DOCTOR_5' ? '#2563eb' : '#94a3b8'}
                        />
                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#1e3a8a' }}>
                              🩺 Crop Doctor (5 Crops)
                            </Text>
                            <View style={{ backgroundColor: '#fef08a', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                              <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#854d0e' }}>PRO 5 CROPS</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569' }}>
                            Up to 5 active crops · Senior Doctor 1-on-1 Guidance
                          </Text>
                        </View>
                      </TouchableOpacity>

                      {/* Option 2: Senior Doctor 10 Crops */}
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: RADIUS.md,
                          borderWidth: 2,
                          borderColor: selectedCropCareTier === 'CROP_DOCTOR_10' ? '#2563eb' : '#e2e8f0',
                          backgroundColor: selectedCropCareTier === 'CROP_DOCTOR_10' ? '#eff6ff' : '#ffffff',
                        }}
                        activeOpacity={0.85}
                        onPress={() => setSelectedCropCareTier('CROP_DOCTOR_10')}
                      >
                        <Ionicons
                          name={selectedCropCareTier === 'CROP_DOCTOR_10' ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={selectedCropCareTier === 'CROP_DOCTOR_10' ? '#2563eb' : '#94a3b8'}
                        />
                        <View style={{ flex: 1, gap: 2 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#1e3a8a' }}>
                              👑 Crop Doctor (10 Crops)
                            </Text>
                            <View style={{ backgroundColor: '#fbcfe8', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                              <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#9d174d' }}>VIP 10 CROPS</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569' }}>
                            Up to 10 active crops · 360° VIP Doctor Advisory Care
                          </Text>
                        </View>
                      </TouchableOpacity>
                    </>
                  ) : (
                    /* Crop Advisor Option */
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 12,
                        padding: 12,
                        borderRadius: RADIUS.md,
                        borderWidth: 2,
                        borderColor: '#16a34a',
                        backgroundColor: '#f0fdf4',
                      }}
                      activeOpacity={1}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#14532d' }}>
                            🌱 Crop Advisor (5 Crops)
                          </Text>
                          <View style={{ backgroundColor: '#bbf7d0', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 }}>
                            <Text style={{ fontSize: 9, fontFamily: FONT.extraBold, color: '#15803d' }}>5 CROPS</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#166534' }}>
                          Up to 5 active crops · Personalized Crop Advisor Support
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Submit Confirmation Button */}
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    backgroundColor: '#16a34a',
                    paddingVertical: 12,
                    borderRadius: RADIUS.md,
                    marginTop: 4,
                  }}
                  activeOpacity={0.85}
                  disabled={acceptAssignment.isPending}
                  onPress={() => {
                    const reqId = pendingFarmerToConfirm.id;
                    const farmerName = pendingFarmerToConfirm.farmer?.name || 'Farmer';
                    acceptAssignment.mutate(reqId, {
                      onSuccess: () => {
                        setPendingFarmerToConfirm(null);
                        const msg = `✅ ${farmerName} has been attached and assigned the Crop Care plan!`;
                        Platform.OS === 'web' ? alert(msg) : Alert.alert('Farmer Attached ✅', msg);
                      },
                    });
                  }}
                >
                  {acceptAssignment.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-circle" size={18} color="#ffffff" />
                      <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>
                        Confirm Attachment & Assign Crop Care Plan
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>

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
          <View style={[styles.proModalCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#cbd5e1' : cardBorder }]}>
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
                <View style={[styles.proFarmerStrip, { backgroundColor: isLight ? '#f8fafc' : '#072414', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)' }]}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={styles.proFarmerName}>
                      👨‍🌾 <Text style={{ fontFamily: FONT.extraBold, color: textColor }}>{selectedReviewCrop.plot?.farm?.owner?.name || 'Farmer'}</Text>
                    </Text>
                    <Text style={[styles.proFarmerMeta, { color: subTextColor }]} numberOfLines={1}>
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
                <View style={[styles.proCardSection, { backgroundColor: isLight ? '#f8fafc' : '#072414', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)' }]}>
                  <View style={[styles.proCardSectionHeader, { borderBottomColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.08)' }]}>
                    <Ionicons name="leaf-outline" size={14} color={isLight ? '#15803d' : '#00ff87'} />
                    <Text style={[styles.proCardSectionTitle, { color: isLight ? '#15803d' : '#00ff87' }]}>Crop Technical Audit</Text>
                  </View>

                  <View style={styles.proGridContainer}>
                    <View style={[styles.proGridBox, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proGridLabel, { color: subTextColor }]}>📅 Sowing Date</Text>
                      <Text style={[styles.proGridVal, { color: textColor }]}>
                        {selectedReviewCrop.sowingDate ? new Date(selectedReviewCrop.sowingDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not specified'}
                      </Text>
                    </View>

                    <View style={[styles.proGridBox, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proGridLabel, { color: subTextColor }]}>📐 Plot & Land Area</Text>
                      <Text style={[styles.proGridVal, { color: textColor }]}>
                        {selectedReviewCrop.plot?.name} ({selectedReviewCrop.area || selectedReviewCrop.plot?.area || '—'} {selectedReviewCrop.plot?.areaUnit || 'ACRE'})
                      </Text>
                    </View>

                    <View style={[styles.proGridBox, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proGridLabel, { color: subTextColor }]}>🌾 Harvesting Type</Text>
                      <Text style={[styles.proGridVal, { color: textColor }]}>
                        {selectedReviewCrop.harvestType === 'CONTINUOUS' ? 'Continuous' : 'One-time'}
                      </Text>
                    </View>

                    <View style={[styles.proGridBox, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proGridLabel, { color: subTextColor }]}>🌿 Growth Stage</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={[styles.proGridVal, { color: textColor }]}>
                          {selectedReviewCrop.stage || 'Vegetative'}
                        </Text>
                        {selectedReviewCrop.advisorReviewStatus === 'ACCEPTED' && (
                          <View style={styles.lockedBadgeMini}>
                            <Text style={styles.lockedBadgeTextMini}>🔒 LOCKED</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <View style={[styles.proGridBox, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proGridLabel, { color: subTextColor }]}>🌱 Number of Plants</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <Text style={[styles.proGridVal, { color: textColor }]}>
                          {selectedReviewCrop.plantCount ? `${selectedReviewCrop.plantCount} Plants` : 'Standard Acreage'}
                        </Text>
                        {selectedReviewCrop.advisorReviewStatus === 'ACCEPTED' && (
                          <View style={styles.lockedBadgeMini}>
                            <Text style={styles.lockedBadgeTextMini}>🔒 LOCKED</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>

                  {selectedReviewCrop.notes ? (
                    <View style={[styles.proNotesCard, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proGridLabel, { color: subTextColor }]}>📝 Farmer Special Notes:</Text>
                      <Text style={[styles.proNotesContent, { color: textColor }]}>{selectedReviewCrop.notes}</Text>
                    </View>
                  ) : null}
                </View>

                {/* Section 2: Farmer Land & Soil/Water Profile */}
                <View style={[styles.proCardSection, { backgroundColor: isLight ? '#f0fdf4' : '#072414', borderColor: isLight ? '#bbf7d0' : 'rgba(0, 255, 135, 0.15)' }]}>
                  <View style={[styles.proCardSectionHeader, { borderBottomColor: isLight ? '#bbf7d0' : 'rgba(255, 255, 255, 0.08)' }]}>
                    <Ionicons name="earth-outline" size={14} color="#15803d" />
                    <Text style={[styles.proCardSectionTitle, { color: '#15803d' }]}>
                      Land, Soil & Water Audit
                    </Text>
                  </View>

                  <View style={{ gap: 6 }}>
                    <View style={[styles.proHighlightRow, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proHighlightLabel, { color: subTextColor }]}>🌱 Soil Type:</Text>
                      <Text style={styles.proHighlightValGreen}>
                        {formatSoil(selectedReviewCrop.plot?.soilType)}
                      </Text>
                    </View>

                    <View style={[styles.proHighlightRow, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proHighlightLabel, { color: subTextColor }]}>💧 Irrigation Source:</Text>
                      <Text style={styles.proHighlightValBlue}>
                        {formatWater(selectedReviewCrop.plot?.waterSource)}
                      </Text>
                    </View>

                    <View style={[styles.proHighlightRow, { backgroundColor: isLight ? '#ffffff' : '#0b291a', borderColor: isLight ? '#dcfce7' : 'rgba(0, 255, 135, 0.15)' }]}>
                      <Text style={[styles.proHighlightLabel, { color: subTextColor }]}>🧪 Water Quality:</Text>
                      <Text style={styles.proHighlightValSlate}>
                        {selectedReviewCrop.plot?.waterQuality || 'Normal TDS / Potable'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Section 2.5: Farmer Live Weather Telemetry */}
                <CropReviewWeatherSection
                  farmerId={selectedReviewCrop.plot?.farm?.ownerId || (selectedReviewCrop as any).farmerId}
                  isLight={isLight}
                  textColor={textColor}
                  subTextColor={subTextColor}
                />

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
                        router.push('/(partner)/(tabs)/satellite-map' as any);
                      }}
                    >
                      <Ionicons name="planet-outline" size={16} color="#ffffff" />
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>
                        🛰️ Inspect Full Satellite Heatmap & Advise Farmer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Section 4: Crop Activities Detail (Sprays, Fertilizers, Irrigation & Field Tasks - Strictly Agronomy Only) */}
                <View style={[styles.proCardSection, { backgroundColor: isLight ? '#f8fafc' : '#072414', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.15)', padding: 12 }]}>
                  <AdvisorScheduleTimeline
                    cropCycleId={selectedReviewCrop.id}
                    cropName={selectedReviewCrop.cropName}
                    farmerName={selectedReviewCrop.plot?.farm?.owner?.name}
                    sowingDate={selectedReviewCrop.sowingDate}
                  />
                </View>

                {/* Professional Footer Buttons */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 6 }}>
                  {selectedReviewCrop.advisorReviewStatus === 'ACCEPTED' ? (
                    (() => {
                      const isSingle = (selectedReviewCrop as any).hiringModel === 'PAY_PER_CONSULTATION';
                      const isLocked = isSingle && (
                        selectedReviewCrop.notes?.includes('[SINGLE_CONSULTATION_LOCKED: true]') ||
                        selectedReviewCrop.notes?.includes('[DOCTOR_SOLUTION:')
                      );

                      if (isLocked) {
                        return (
                          <View style={{
                            flex: 1,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                            backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.12)',
                            paddingVertical: 12,
                            paddingHorizontal: 14,
                            borderRadius: RADIUS.md,
                            borderWidth: 1.5,
                            borderColor: '#10b981',
                          }}>
                            <Ionicons name="lock-closed" size={16} color="#10b981" />
                            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#10b981' }}>
                              🔒 Single Consultation Resolved & Locked (Advisory Dispatched)
                            </Text>
                          </View>
                        );
                      }

                      if (isSingle) {
                        return (
                          <View style={{ flex: 1, flexDirection: 'row', gap: 10 }}>
                            <TouchableOpacity
                              style={[styles.proAcceptBtn, { backgroundColor: '#10b981', flex: 1 }]}
                              activeOpacity={0.85}
                              onPress={() => {
                                setSolutionTitle(`Prescription: ${selectedReviewCrop.cropName} Care`);
                                setSolutionDosage('');
                                setSolutionDate(new Date().toISOString().slice(0, 10));
                                setSolutionModalCrop(selectedReviewCrop);
                              }}
                            >
                              <Ionicons name="medkit" size={17} color="#ffffff" />
                              <Text style={styles.proAcceptBtnText}>Provide Solution & Lock Consultation 🩺</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      }

                      return (
                        <>
                          <TouchableOpacity
                            style={[styles.proRejectBtn, { borderColor: '#0284c7', backgroundColor: isLight ? '#f0f9ff' : 'rgba(2, 132, 199, 0.15)' }]}
                            activeOpacity={0.85}
                            onPress={() => {
                              setSelectedReviewCrop(null);
                              router.push('/(partner)/(tabs)/schedule' as never);
                            }}
                          >
                            <Ionicons name="calendar" size={16} color="#0284c7" />
                            <Text style={[styles.proRejectBtnText, { color: '#0284c7' }]}>Update Schedule</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.proAcceptBtn, { backgroundColor: '#10b981' }]}
                            activeOpacity={0.85}
                            disabled={completeCropReq.isPending}
                            onPress={() => {
                              const id = selectedReviewCrop.id;
                              const name = selectedReviewCrop.cropName;
                              completeCropReq.mutate(
                                { id, notes: 'Agronomy advisory & treatment finalized.' },
                                {
                                  onSuccess: () => {
                                    setSelectedReviewCrop(null);
                                    const msg = `✅ Requirement Completed!\nConfirmation message and review request have been sent to the farmer for "${name}".`;
                                    Platform.OS === 'web' ? alert(msg) : Alert.alert('Requirement Completed', msg);
                                  },
                                }
                              );
                            }}
                          >
                            {completeCropReq.isPending ? (
                              <ActivityIndicator color="#ffffff" size="small" />
                            ) : (
                              <>
                                <Ionicons name="checkmark-done-circle" size={18} color="#ffffff" />
                                <Text style={styles.proAcceptBtnText}>Complete Requirement ✅</Text>
                              </>
                            )}
                          </TouchableOpacity>
                        </>
                      );
                    })()
                  ) : (
                    <>
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
                          handleInitiateAcceptCrop(selectedReviewCrop);
                        }}
                      >
                        {acceptCrop.isPending ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle-sharp" size={18} color="#ffffff" />
                            <Text style={styles.proAcceptBtnText}>Accept & Start Work</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* CROP ADOPTION CALIBRATION & ACCEPT MODAL */}
      <Modal visible={!!cropToAcceptConfirm} transparent animationType="fade" onRequestClose={() => setCropToAcceptConfirm(null)}>
        <View style={styles.proModalBackdrop}>
          <View style={[styles.proModalCard, { backgroundColor: isLight ? '#ffffff' : '#071f13', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.25)', maxWidth: 480 }]}>
            <LinearGradient colors={['#062817', '#0f172a']} style={styles.proModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name="shield-checkmark" size={18} color="#00ff87" />
                <View>
                  <Text style={styles.proModalTitle}>Calibrate & Accept Doctor Care</Text>
                  <Text style={styles.proModalSubtitle}>
                    {cropToAcceptConfirm?.cropName} · {cropToAcceptConfirm?.plot?.farm?.owner?.name || 'Farmer'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.proModalCloseBtn} onPress={() => setCropToAcceptConfirm(null)}>
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={{ padding: 18, gap: 14 }}>
              <View style={{ backgroundColor: isLight ? '#fffbeb' : 'rgba(245, 158, 11, 0.12)', borderWidth: 1, borderColor: isLight ? '#fde68a' : 'rgba(245, 158, 11, 0.3)', borderRadius: RADIUS.md, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Ionicons name="lock-closed" size={15} color="#f59e0b" style={{ marginTop: 1 }} />
                <Text style={{ flex: 1, fontSize: 11.5, fontFamily: FONT.medium, color: isLight ? '#92400e' : '#fde68a', lineHeight: 16 }}>
                  <Text style={{ fontFamily: FONT.bold }}>One-Time Calibration: </Text>
                  Review and adjust the plant count and current growth stage. These values will be permanently locked once you accept this crop into doctor care.
                </Text>
              </View>

              {/* Number of Plants Input */}
              <View style={{ gap: 5 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: textColor }}>
                  Estimated Number of Plants (Count)
                </Text>
                <TextInput
                  style={[
                    styles.acceptInput,
                    {
                      backgroundColor: isLight ? '#f8fafc' : '#04180d',
                      borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
                      color: textColor,
                    },
                  ]}
                  value={acceptPlantCount}
                  onChangeText={setAcceptPlantCount}
                  keyboardType="numeric"
                  placeholder="e.g. 2400"
                  placeholderTextColor={subTextColor}
                />
              </View>

              {/* Growth Stage Selector */}
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: textColor }}>
                  Current Growth Stage
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {(['PLANTATION', 'VEGETATIVE', 'FLOWERING', 'HARVESTING'] as const).map((st) => {
                    const isSelected = acceptStage === st;
                    return (
                      <TouchableOpacity
                        key={st}
                        style={[
                          styles.stageChip,
                          isSelected && styles.stageChipSelected,
                          {
                            backgroundColor: isSelected
                              ? '#00ff87'
                              : isLight
                              ? '#f1f5f9'
                              : 'rgba(255, 255, 255, 0.05)',
                            borderColor: isSelected
                              ? '#00ff87'
                              : isLight
                              ? '#cbd5e1'
                              : 'rgba(255, 255, 255, 0.1)',
                          },
                        ]}
                        onPress={() => setAcceptStage(st)}
                      >
                        <Text
                          style={[
                            styles.stageChipText,
                            isSelected ? { color: '#090e17', fontFamily: FONT.extraBold } : { color: textColor },
                          ]}
                        >
                          {st === 'PLANTATION'
                            ? '🌱 Plantation'
                            : st === 'VEGETATIVE'
                            ? '🌿 Vegetative'
                            : st === 'FLOWERING'
                            ? '🌸 Flowering'
                            : '🌾 Harvesting'}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Footer Actions */}
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  style={[styles.proRejectBtn, { flex: 1 }]}
                  onPress={() => setCropToAcceptConfirm(null)}
                >
                  <Text style={styles.proRejectBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.proAcceptBtn, { flex: 2 }]}
                  disabled={acceptCrop.isPending}
                  onPress={handleConfirmAcceptWithDetails}
                >
                  {acceptCrop.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done-circle" size={16} color="#ffffff" />
                      <Text style={styles.proAcceptBtnText}>Confirm & Accept Care</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* DOCTOR SINGLE CONSULTATION SOLUTION DISPATCH MODAL */}
      <Modal visible={!!solutionModalCrop} transparent animationType="fade" onRequestClose={() => setSolutionModalCrop(null)}>
        <View style={styles.proModalBackdrop}>
          <View style={[styles.proModalCard, { backgroundColor: isLight ? '#ffffff' : '#071f13', borderColor: isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.25)', maxWidth: 500 }]}>
            <LinearGradient colors={['#062817', '#0f172a']} style={styles.proModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name="medkit" size={18} color="#00ff87" />
                <View>
                  <Text style={styles.proModalTitle}>Provide Prescription & Solution</Text>
                  <Text style={styles.proModalSubtitle}>
                    {solutionModalCrop?.cropName} · {solutionModalCrop?.plot?.farm?.owner?.name || 'Farmer'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.proModalCloseBtn} onPress={() => setSolutionModalCrop(null)}>
                <Ionicons name="close" size={16} color="#ffffff" />
              </TouchableOpacity>
            </LinearGradient>

            <View style={{ padding: 18, gap: 14 }}>
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: textColor }}>
                  Prescription / Treatment Title *
                </Text>
                <TextInput
                  style={[
                    styles.proModalInput,
                    {
                      backgroundColor: isLight ? '#f8fafc' : '#04180d',
                      borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
                      color: textColor,
                    },
                  ]}
                  value={solutionTitle}
                  onChangeText={setSolutionTitle}
                  placeholder="e.g. Chlorpyrifos 20% EC + Mancozeb Spray"
                  placeholderTextColor={subTextColor}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: textColor }}>
                  Dosage, Water Ratio & Application Instructions *
                </Text>
                <TextInput
                  style={[
                    styles.proModalInput,
                    {
                      backgroundColor: isLight ? '#f8fafc' : '#04180d',
                      borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
                      color: textColor,
                      minHeight: 75,
                      textAlignVertical: 'top',
                    },
                  ]}
                  value={solutionDosage}
                  onChangeText={setSolutionDosage}
                  multiline
                  placeholder="e.g. Mix 2.5ml per liter of water. Spray during cool evening hours. Repeat spray after 7 days if pest density exceeds threshold."
                  placeholderTextColor={subTextColor}
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: textColor }}>
                  Scheduled Application Date
                </Text>
                <TextInput
                  style={[
                    styles.proModalInput,
                    {
                      backgroundColor: isLight ? '#f8fafc' : '#04180d',
                      borderColor: isLight ? '#cbd5e1' : 'rgba(255, 255, 255, 0.15)',
                      color: textColor,
                    },
                  ]}
                  value={solutionDate}
                  onChangeText={setSolutionDate}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={subTextColor}
                />
              </View>

              <View style={{ backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: isLight ? '#bbf7d0' : 'rgba(16, 185, 129, 0.2)' }}>
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: isLight ? '#15803d' : '#4ade80', lineHeight: 16 }}>
                  ℹ️ Once submitted, this prescription will appear as a Pending Activity in the farmer's calendar. The Single Consultation care will be permanently locked on your side.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={[styles.proRejectBtn, { flex: 1 }]}
                  onPress={() => setSolutionModalCrop(null)}
                >
                  <Text style={styles.proRejectBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.proAcceptBtn, { flex: 2 }]}
                  disabled={completeCropReq.isPending}
                  onPress={() => {
                    if (!solutionTitle.trim()) {
                      const msg = 'Please enter a prescription / treatment title.';
                      Platform.OS === 'web' ? alert(msg) : Alert.alert('Required', msg);
                      return;
                    }
                    if (!solutionModalCrop) return;
                    completeCropReq.mutate(
                      {
                        id: solutionModalCrop.id,
                        solutionTitle: solutionTitle.trim(),
                        solutionDosage: solutionDosage.trim(),
                        solutionDate: solutionDate.trim(),
                        notes: `Single consultation completed: ${solutionTitle.trim()}`,
                      },
                      {
                        onSuccess: () => {
                          setSolutionModalCrop(null);
                          setSelectedReviewCrop(null);
                          const msg = '✅ Solution Dispatched & Consultation Locked!\nThe prescription has been scheduled as a Pending activity for the farmer. Your consultation session is now locked.';
                          Platform.OS === 'web' ? alert(msg) : Alert.alert('Solution Dispatched', msg);
                        },
                        onError: (err: any) => {
                          const msg = err?.response?.data?.message || err?.message || 'Could not dispatch solution.';
                          Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
                        },
                      }
                    );
                  }}
                >
                  {completeCropReq.isPending ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={15} color="#ffffff" />
                      <Text style={styles.proAcceptBtnText}>Dispatch & Lock Session 🔒</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
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
          <View style={[styles.modalCard, { maxWidth: 420, padding: 14, backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#cbd5e1' : cardBorder }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: textColor }]}>💊 Respond to Problem</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedProblemToRespond(null)}>
                <Ionicons name="close" size={18} color={subTextColor} />
              </TouchableOpacity>
            </View>
            <View style={[styles.modalHeaderDivider, { backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)' }]} />

            {selectedProblemToRespond ? (
              <View style={{ gap: 10 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: textColor }}>
                  Issue: {selectedProblemToRespond.title}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor }}>
                  Farmer: {selectedProblemToRespond.reportedBy?.name} (📞 {selectedProblemToRespond.reportedBy?.mobile})
                </Text>

                <View style={{ gap: 4 }}>
                  <Text style={[styles.proGridLabel, { color: subTextColor }]}>Advisor Solution / Advice:</Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: isLight ? '#cbd5e1' : 'rgba(0, 255, 135, 0.25)',
                      borderRadius: RADIUS.sm,
                      padding: 8,
                      fontSize: 12,
                      minHeight: 60,
                      backgroundColor: isLight ? '#f8fafc' : '#0a1a12',
                      color: textColor,
                    }}
                    multiline
                    placeholder="Enter your expert advice..."
                    placeholderTextColor={subTextColor}
                    value={problemResponseText}
                    onChangeText={setProblemResponseText}
                  />
                </View>

                <View style={{ gap: 4 }}>
                  <Text style={[styles.proGridLabel, { color: subTextColor }]}>Recommended Product / Spray (Optional):</Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: isLight ? '#cbd5e1' : 'rgba(0, 255, 135, 0.25)',
                      borderRadius: RADIUS.sm,
                      padding: 8,
                      fontSize: 12,
                      backgroundColor: isLight ? '#f8fafc' : '#0a1a12',
                      color: textColor,
                    }}
                    placeholder="e.g. Neem Oil 5ml/L or Chlorpyrifos"
                    placeholderTextColor={subTextColor}
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
  const { isLight, textColor, subTextColor, cardBg, cardBorder, innerBg } = useExecutiveTheme();
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
        <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: textColor }}>
          📞 Call Requests
        </Text>

        <View style={{ flexDirection: 'row', backgroundColor: isLight ? '#f8fafc' : '#072414', borderRadius: RADIUS.pill, padding: 2, borderWidth: 1, borderColor: isLight ? '#cbd5e1' : 'rgba(0, 255, 135, 0.2)' }}>
          <TouchableOpacity
            style={[
              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill, flexDirection: 'row', alignItems: 'center', gap: 5 },
              subTab === 'PENDING' && { backgroundColor: meta.color },
            ]}
            onPress={() => setSubTab('PENDING')}
          >
            <Text style={[{ fontSize: 10, fontFamily: FONT.bold, color: subTextColor }, subTab === 'PENDING' && { color: '#ffffff' }]}>
              Pending
            </Text>
            <View style={[{ minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }, subTab === 'PENDING' && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={[{ fontSize: 9.5, fontFamily: FONT.extraBold, color: isLight ? '#475569' : '#cbd5e1' }, subTab === 'PENDING' && { color: '#ffffff' }]}>
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
            <Text style={[{ fontSize: 10, fontFamily: FONT.bold, color: subTextColor }, subTab === 'HISTORY' && { color: '#ffffff' }]}>
              History
            </Text>
            <View style={[{ minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', backgroundColor: isLight ? '#e2e8f0' : 'rgba(255,255,255,0.1)' }, subTab === 'HISTORY' && { backgroundColor: 'rgba(255,255,255,0.25)' }]}>
              <Text style={[{ fontSize: 9.5, fontFamily: FONT.extraBold, color: isLight ? '#475569' : '#cbd5e1' }, subTab === 'HISTORY' && { color: '#ffffff' }]}>
                {history.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {active.length === 0 ? (
        <Text style={[styles.emptyText, { color: subTextColor }]}>{subTab === 'PENDING' ? 'No pending call requests.' : 'No resolved requests yet.'}</Text>
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
                      backgroundColor: isLight ? '#f8fafc' : innerBg,
                      paddingHorizontal: 10,
                      paddingVertical: 8,
                      borderRadius: RADIUS.sm,
                      borderWidth: 1,
                      borderColor: isLight ? '#e2e8f0' : cardBorder,
                      gap: 4,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: textColor }} numberOfLines={1}>
                          👨‍🌾 {req.farmer?.name ?? 'Farmer'}
                        </Text>
                        {kingId ? (
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: isLight ? '#1d4ed8' : '#38bdf8' }}>
                            🔑 {kingId}
                          </Text>
                        ) : null}
                        {mobile ? (
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: subTextColor }}>
                            · 📞 {mobile}
                          </Text>
                        ) : null}
                      </View>

                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: subTextColor }}>
                        {new Date(req.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    </View>

                    {/* Call Summary Box */}
                    {!isGeneric && summaryText ? (
                      <View style={{ backgroundColor: isLight ? '#f0fdf4' : 'rgba(0, 255, 135, 0.08)', padding: 6, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: isLight ? '#bbf7d0' : 'rgba(0, 255, 135, 0.25)', marginTop: 2 }}>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: isLight ? '#15803d' : '#00ff87', marginBottom: 1 }}>
                          📋 Call Summary:
                        </Text>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: isLight ? '#166534' : '#dcfce7', lineHeight: 15 }}>
                          {summaryText}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                );
              }

              return (
                <View key={req.id} style={[styles.reviewCard, { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: isLight ? '#e2e8f0' : cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.reviewCropTitle, { color: textColor }]} numberOfLines={1}>
                          📞 {req.farmer?.name ?? 'Farmer Call Request'}
                        </Text>
                        {kingId ? (
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: isLight ? '#1d4ed8' : '#38bdf8' }}>
                            🔑 {kingId}
                          </Text>
                        ) : null}
                      </View>
                      {mobile ? (
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: subTextColor }}>
                          📱 {mobile}
                        </Text>
                      ) : null}
                    </View>

                    <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: subTextColor }}>
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
                        style={[styles.acceptCropBtn, { backgroundColor: isExpanded ? (isLight ? '#64748b' : '#475569') : (isLight ? '#2563eb' : '#1d4ed8'), height: 32, paddingHorizontal: 12 }]}
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
                      <View style={{ gap: 6, marginTop: 4, backgroundColor: isLight ? '#f8fafc' : innerBg, padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: isLight ? '#e2e8f0' : cardBorder }}>
                        <TextInput
                          style={{ borderWidth: 1, borderColor: isLight ? '#cbd5e1' : 'rgba(0, 255, 135, 0.25)', borderRadius: RADIUS.xs, padding: 6, fontSize: 11.5, backgroundColor: isLight ? '#ffffff' : '#0a1a12', color: textColor, minHeight: 48 }}
                          placeholder="Enter call notes / summary..."
                          placeholderTextColor={subTextColor}
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
  const { isLight, textColor, subTextColor } = useExecutiveTheme();
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
    <View style={[styles.taskRow, { backgroundColor: isLight ? '#f8fafc' : meta.bg, borderColor: isLight ? '#e2e8f0' : meta.border }]}>
      <View style={{ flex: 1 }}>
        <View style={styles.taskRowTop}>
          <Text style={[styles.taskFarmer, { color: textColor }]} numberOfLines={1}>
            👨‍🌾 {item.cropCycle?.plot?.farm?.owner?.name ?? 'Farmer'}
          </Text>
          <Text style={[styles.taskDate, { color: meta.color }]}>
            {new Date(item.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </Text>
        </View>
        <Text style={[styles.taskTitle, { color: isLight ? '#1e293b' : '#e2e8f0' }]}>{item.title}</Text>
        <Text style={[styles.taskPlot, { color: subTextColor }]} numberOfLines={1}>
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
  const { isLight, textColor, subTextColor } = useExecutiveTheme();
  if (!alerts || alerts.length === 0) {
    return <Text style={[styles.emptyText, { color: subTextColor }]}>No farmers currently crossing their weather-alert limits.</Text>;
  }
  return (
    <View style={{ gap: 8 }}>
      {alerts.map((alert) => (
        <View key={alert.farmerId} style={[styles.weatherRow, { backgroundColor: isLight ? '#f0fdf4' : meta.bg, borderColor: isLight ? '#bbf7d0' : meta.border }]}>
          <View style={styles.weatherRowTop}>
            <Text style={[styles.taskFarmer, { color: textColor }]} numberOfLines={1}>👨‍🌾 {alert.farmerName}</Text>
            <View style={[styles.weatherTempPill, isLight && { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0' }]}>
              <Ionicons name={alert.isRaining ? 'rainy' : 'thermometer-outline'} size={12} color={meta.color} />
              <Text style={[styles.weatherTempText, { color: meta.color }]}>{alert.currentTemperatureC}°C · {alert.condition}</Text>
            </View>
          </View>
          <Text style={[styles.taskPlot, { color: subTextColor }]} numberOfLines={1}>📍 {alert.locationLabel}</Text>
          <View style={styles.weatherChipRow}>
            {alert.triggers.map((trigger) => {
              const t = TRIGGER_META[trigger];
              return (
                <View key={trigger} style={[styles.weatherChip, { borderColor: t.color, backgroundColor: isLight ? '#ffffff' : 'rgba(255, 255, 255, 0.08)' }]}>
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

  executiveHeroCard: {
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.30)',
    gap: 5,
    ...premiumShadow('#00ff87', 'xs'),
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
  },
  heroMainTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },

  /* KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kpiGridDesktop: {
    flexWrap: 'nowrap',
  },
  kpiCard: {
    flex: 1,
    minWidth: 110,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#071f14',
    borderRadius: RADIUS.xs,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.22)',
    gap: 6,
  },
  kpiIconBox: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kpiContentCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  kpiTrendBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  kpiTrendText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
  },
  kpiVal: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.3,
    lineHeight: 16,
  },
  kpiTitle: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    marginTop: 0.5,
    lineHeight: 12,
  },
  kpiMeta: {
    fontSize: 8.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
    lineHeight: 10,
  },

  /* Quick Precision Tools Ribbon */
  quickToolsContainer: {
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.20)',
    gap: 10,
    ...premiumShadow('#00ff87', 'xs'),
  },
  quickToolsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quickToolsTitle: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.4,
  },
  quickToolsSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  quickToolsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickToolsRowDesktop: {
    flexWrap: 'nowrap',
  },
  quickToolBtn: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#071f14',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.18)',
  },
  quickToolBtnCallActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
  },
  quickToolIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickToolBtnTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  quickToolBtnMeta: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },

  sectionCard: {
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.20)',
    ...premiumShadow('#00ff87', 'sm'),
  },
  tabRow: { gap: 6, paddingBottom: 10 },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.18)',
    backgroundColor: '#072414',
  },
  tabChipText: { fontSize: 11.5, fontFamily: FONT.bold },
  tabChipCount: { minWidth: 16, height: 16, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabChipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabChipCountText: { fontSize: 9.5, fontFamily: FONT.extraBold },
  tabBody: { borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.08)', paddingTop: 10 },

  emptyText: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', paddingVertical: 20, textAlign: 'center' },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: RADIUS.md,
    padding: 11,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.18)',
    backgroundColor: '#072414',
  },
  taskRowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskFarmer: { flex: 1, fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },
  taskDate: { fontSize: 11, fontFamily: FONT.extraBold },
  taskTitle: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#e2e8f0', marginTop: 3 },
  taskPlot: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
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
    backgroundColor: '#04160c',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.20)',
    borderRadius: RADIUS.md,
    padding: 7,
    gap: 2,
    marginTop: 3,
  },
  submissionFarmerText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  submissionLocText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  reviewCard: {
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 10,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.20)',
    ...premiumShadow('#00ff87', 'sm'),
  },
  reviewCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  reviewCropTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  reviewCropVariety: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
    color: '#94a3b8',
  },
  reviewCropCategory: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  landProfileBox: {
    backgroundColor: '#072414',
    borderRadius: RADIUS.md,
    padding: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
  },
  landProfileHeaderTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
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
    color: '#94a3b8',
    width: 130,
  },
  landProfileVal: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#ffffff',
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
    backgroundColor: 'rgba(2, 13, 6, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '90%',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    ...premiumShadow('#00ff87', 'lg'),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  closeBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proModalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#04160c',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    maxHeight: '88%',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    ...premiumShadow('#00ff87', 'lg'),
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
  proModalInput: {
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  proFarmerStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#072414',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
  },
  proFarmerName: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#ffffff',
  },
  proFarmerMeta: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
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
    backgroundColor: '#072414',
    borderRadius: RADIUS.md,
    padding: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
  },
  proCardSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 4,
  },
  proCardSectionTitle: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  proGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  proGridBox: {
    width: '48%',
    backgroundColor: '#0b291a',
    borderRadius: RADIUS.sm,
    padding: 6,
    gap: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
  },
  proGridLabel: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  proGridVal: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  proNotesCard: {
    backgroundColor: '#0b291a',
    borderRadius: RADIUS.sm,
    padding: 6,
    marginTop: 2,
    gap: 1,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
  },
  proNotesContent: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#e2e8f0',
  },
  proHighlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0b291a',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
  },
  proHighlightLabel: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
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
    backgroundColor: '#072414',
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 3,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.18)',
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
    backgroundColor: '#0d3820',
    borderWidth: 1,
    borderColor: '#00ff87',
    elevation: 2,
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  subFilterText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
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

  /* Requests & Audits Unified Table Styles */
  tableCard: {
    borderRadius: RADIUS.md,
    backgroundColor: '#04160c',
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.20)',
    overflow: 'hidden',
    padding: 12,
    gap: 10,
    ...premiumShadow('#00ff87', 'xs'),
  },
  requestsMainTabsRow: {
    flexDirection: 'row',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 10,
  },
  requestsMainTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  requestsMainTabBtnActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderColor: 'rgba(0, 255, 135, 0.4)',
  },
  requestsMainTabText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  requestsMainTabTextActive: {
    color: '#ffffff',
  },
  requestsMainTabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  requestsMainTabBadgeActive: {
    backgroundColor: '#00ff87',
  },
  requestsMainTabBadgeInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  requestsMainTabBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#94a3b8',
  },
  requestsMainTabBadgeTextActive: {
    color: '#04160c',
  },
  typeFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typePill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  typePillActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderColor: 'rgba(0, 255, 135, 0.35)',
  },
  typePillText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  typePillTextActive: {
    color: '#00ff87',
    fontFamily: FONT.bold,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#03140c',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.15)',
  },
  tableHeaderCell: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: '#05190f',
  },
  tableRowEven: {
    backgroundColor: '#071f14',
  },
  tableCell: {
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  tableFarmerName: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  tableFarmerMobile: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#00ff87',
  },
  tableFarmerKingId: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  tableFarmerLocation: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    color: '#64748b',
  },
  tableTitleText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#e2e8f0',
  },
  tableDetailsText: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
  },
  tableDateText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
  tableActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 5,
  },
  tableActionBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  tableIconActionBtn: {
    width: 24,
    height: 24,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyTableState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTableText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  acceptInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  stageChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  stageChipSelected: {
    borderColor: '#00ff87',
  },
  stageChipText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  lockedBadgeMini: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(234, 179, 8, 0.4)',
  },
  lockedBadgeTextMini: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#eab308',
  },
});

