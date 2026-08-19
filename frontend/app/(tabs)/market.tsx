import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, ScrollView, Image, Alert, Modal, ActivityIndicator, Linking, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useCrops, RegisteredCropField } from '@/src/store/crops-context';
import { SOIL_TYPE_OPTIONS, WATER_TYPE_OPTIONS, SPRAY_TANK_SIZE_OPTIONS } from '@/src/constants/farmerProfileOptions';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import { useMyAdvisor, useAvailableAdvisors, useMyPendingRequest } from '@/src/hooks/useAdvisorAssignments';
import { useMyCrops, useSubmitCropToAdvisor, useCancelCropSubmission } from '@/src/hooks/useCrops';
import { useCreateCropProblem, useMyCropProblems } from '@/src/hooks/useCropProblems';
import { uploadPhoto } from '@/src/api/uploads.api';
import { RenewModal } from '@/src/components/RenewPlanCard';
import { useFarmerPlan, useChooseAdvisor } from '@/src/hooks/useFarmerPlan';
import { FarmerPlanUpgradeModal } from '@/src/components/FarmerPlanUpgradeModal';
import { resolveMediaUrl } from '@/src/api/client';
import { AvailableAdvisor, SprayScheduleItem } from '@/src/types/api';
import { useChatUnreadCount } from '@/src/hooks/useChat';
import { SprayScheduleCards } from '@/src/components/SprayScheduleCards';
import { SprayDetailCard } from '@/src/components/SprayDetailCard';
import { useCreateCallRequest, useMyPendingCallRequest } from '@/src/hooks/useCallRequests';
import { useAuth } from '@/src/store/auth-context';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const marketSprayStyles = StyleSheet.create({
  tableModalCard: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '80%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: 24,
  },
  table: {
    marginTop: 8,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    gap: 6,
  },
  tableHeaderRow: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#e2e8f0',
  },
  tableCell: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#334155',
  },
  tableHeaderText: {
    fontFamily: FONT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontSize: 9.5,
    letterSpacing: 0.2,
  },
  tableDateText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  emptyText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    paddingVertical: 24,
  },
  modalSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
});

type HireStatus = 'NONE' | 'PENDING' | 'AWAITING_ADVISOR' | 'ACTIVE';

const FALLBACK_ADVISOR = {
  name: 'Your Advisor',
  specialization: 'Farm Advisor',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
};

/** Parse date string like "15 Nov 2025" or "2025-11-15" into Date */
const parsePlantationDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;

  const parts = dateStr.split(' ');
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.findIndex((m) => m.toLowerCase() === monthStr.substring(0, 3).toLowerCase());
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      return new Date(year, monthIndex, day);
    }
  }
  return new Date();
};

/** Calculate calendar date given plantation date and day number */
const calculateTaskDateObj = (plantationDate: Date, dayNumber: number): Date => {
  const d = new Date(plantationDate);
  d.setDate(d.getDate() + (dayNumber - 1));
  return d;
};

const formatDateStr = (dateObj: Date): string => {
  return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

/** Extract Present & Next Upcoming Schedule Tasks */
interface ScheduleTaskItemResult {
  lineIndex: number;
  dayNumber: number;
  taskTitle: string;
  dueDateStr: string;
  rawLine: string;
}

interface SchedulePairResult {
  presentTask: ScheduleTaskItemResult | null;
  nextUpcomingTask: ScheduleTaskItemResult | null;
}

const getPresentAndUpcomingTasks = (assignedSchedule?: string, sowingDate?: string): SchedulePairResult => {
  if (!assignedSchedule) return { presentTask: null, nextUpcomingTask: null };

  const plantDateObj = parsePlantationDate(sowingDate);
  const lines = assignedSchedule.split('\n');
  const pendingTasks: ScheduleTaskItemResult[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];
    if (!line.trim() || line.includes('✔️ DONE') || line.includes('⏭️ SKIPPED')) continue;

    const match = line.match(/\[?Day\s*(\d+).*?\]?:\s*(.*)/i);
    let dayNumber = (idx + 1) * 3;
    let taskTitle = line.trim();

    if (match) {
      dayNumber = parseInt(match[1], 10) || dayNumber;
      taskTitle = match[2].trim();
    }

    const dueDateObj = calculateTaskDateObj(plantDateObj, dayNumber);
    const dueDateStr = formatDateStr(dueDateObj);

    pendingTasks.push({
      lineIndex: idx,
      dayNumber,
      taskTitle,
      dueDateStr,
      rawLine: line,
    });
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const candidateNext = pendingTasks[1] || null;
  let nextUpcomingTask: ScheduleTaskItemResult | null = null;

  if (candidateNext) {
    const candidateDateObj = calculateTaskDateObj(plantDateObj, candidateNext.dayNumber);
    candidateDateObj.setHours(0, 0, 0, 0);

    const diffTime = candidateDateObj.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Next schedule ONLY shows if due within 7 days (maximum 1 task)
    if (daysRemaining <= 7) {
      nextUpcomingTask = candidateNext;
    }
  }

  return {
    presentTask: pendingTasks[0] || null,
    nextUpcomingTask,
  };
};

export default function MarketScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscriptionStatus();
  const { data: myAdvisor } = useMyAdvisor();
  const { data: myPendingRequest } = useMyPendingRequest();
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  const { plan } = useFarmerPlan();
  const advisorIncluded = plan === 'STANDARD' || plan === 'PREMIUM';

  // A real AdvisorAssignment (myAdvisor) is the source of truth for "hired". A still-open request awaiting
  // the advisor's accept/reject shows a distinct "waiting" state. Falls back to the legacy pending-subscription
  // state only while neither exists yet.
  const hireStatus: HireStatus = myAdvisor
    ? 'ACTIVE'
    : myPendingRequest
    ? 'AWAITING_ADVISOR'
    : subscription?.status === 'PENDING'
    ? 'PENDING'
    : 'NONE';

  const { cropFields, shareCropWithAdvisor, acceptFarmRequest } = useCrops();

  const activeCropFields = useMemo(() => cropFields.filter((c) => c.status === 'ACTIVE' && c.stage !== 'COMPLETED'), [cropFields]);
  const acceptedPlots = useMemo(() => cropFields.filter((c) => c.advisorStatus === 'ACCEPTED'), [cropFields]);
  const unacceptedCropFields = useMemo(() => cropFields.filter((c) => c.status === 'ACTIVE' && c.stage !== 'COMPLETED' && c.advisorStatus !== 'ACCEPTED'), [cropFields]);

  // Real plan expiry, computed live from the farmer's actual AdvisorSubscription (same logic as RenewPlanCard).
  const subMetrics = useMemo(() => {
    const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
    if (!endDate) {
      return { status: 'ACTIVE' as const, diffDays: null as number | null, formattedExpiry: null as string | null };
    }
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const exp = new Date(endDate);
    exp.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    const status: 'ACTIVE' | 'EXPIRING_SOON' | 'EXPIRED' = diffDays < 0 ? 'EXPIRED' : diffDays <= 5 ? 'EXPIRING_SOON' : 'ACTIVE';
    const formattedExpiry = exp.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

    return { diffDays, status, formattedExpiry };
  }, [subscription]);

  const isExpired = subMetrics.status === 'EXPIRED';
  const advisorName = myAdvisor?.advisor?.name ?? FALLBACK_ADVISOR.name;
  const advisorSpec = myAdvisor?.advisor?.specialization || FALLBACK_ADVISOR.specialization;
  const advisorAvatarUrl = resolveMediaUrl(myAdvisor?.advisor?.photoUrl) || FALLBACK_ADVISOR.avatarUrl;
  const advisorMobile = myAdvisor?.advisor?.mobile;

  const { data: chatUnread } = useChatUnreadCount(hireStatus === 'ACTIVE');
  const requestCall = useCreateCallRequest();
  const { data: pendingCallRequest, refetch: refetchPendingCallRequest } = useMyPendingCallRequest(hireStatus === 'ACTIVE');
  const [callRequestError, setCallRequestError] = useState<string | null>(null);
  const isCallRequestPending = !!pendingCallRequest;
  const handleRequestCall = async () => {
    tap();
    setCallRequestError(null);
    try {
      await requestCall.mutateAsync();
      refetchPendingCallRequest();
    } catch (err: any) {
      setCallRequestError(err?.response?.data?.message ?? 'Could not send the request.');
    }
  };
  const handleOpenWhatsapp = () => {
    if (!advisorMobile) return;
    tap();
    const digits = advisorMobile.replace(/\D/g, '');
    const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
    const greeting = `Hello Sir, I am ${user?.name ?? 'a farmer'}${user?.kingId ? ` (King ID: ${user.kingId})` : ''}.`;
    Linking.openURL(`https://wa.me/${withCountryCode}?text=${encodeURIComponent(greeting)}`).catch(() => {});
  };

  // Mandatory Advisor Profile Setup State
  const [farmPhotoUri, setFarmPhotoUri] = useState<string | null>(
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300'
  );
  const [sprayTankSize, setSprayTankSize] = useState<number | null>(20);
  const [soilTypeVal, setSoilTypeVal] = useState<string | null>('LOAMY');
  const [waterTypeVal, setWaterTypeVal] = useState<string | null>('BOREWELL_TUBEWELL');

  const [isFarmProfileModalOpen, setIsFarmProfileModalOpen] = useState(false);

  // Spray Schedule Detail Modal State — shows exactly one item's full data
  const [sprayDetailItem, setSprayDetailItem] = useState<SprayScheduleItem | null>(null);
  const [sprayDetailTitle, setSprayDetailTitle] = useState('');
  const openSprayItemDetail = (item: SprayScheduleItem, title: string) => {
    tap();
    setSprayDetailItem(item);
    setSprayDetailTitle(title);
  };

  // Farmer Crop Problem State
  const [isProblemTreatmentModalOpen, setIsProblemTreatmentModalOpen] = useState(false);
  const [selectedCropForProblem, setSelectedCropForProblem] = useState<string>('');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemPhotoUri, setProblemPhotoUri] = useState<string | null>(null);
  const [problemPhotoUrl, setProblemPhotoUrl] = useState<string | null>(null);
  const [isUploadingProblemPhoto, setIsUploadingProblemPhoto] = useState(false);
  const [selectedRealCropId, setSelectedRealCropId] = useState<string>('');

  // Real (backend) crop cycles — used so a "New Disease" report can actually reach the advisor.
  const { data: myCrops } = useMyCrops();
  const createCropProblem = useCreateCropProblem();
  const { data: myCropProblems } = useMyCropProblems();
  // A crop cycle "has an active problem" only while it's still waiting on the advisor to respond —
  // once the advisor responds (or it's resolved/closed), the chip reverts to "Problem Report" so a
  // new problem can be submitted for that crop.
  const activeProblemByCropId = useMemo(() => {
    const map = new Map<string, boolean>();
    (myCropProblems ?? []).forEach((p) => {
      if (p.status === 'REPORTED' || p.status === 'UNDER_REVIEW') map.set(p.cropCycleId, true);
    });
    return map;
  }, [myCropProblems]);
  const submitCropToAdvisor = useSubmitCropToAdvisor();
  const cancelCropSubmission = useCancelCropSubmission();
  const [submittingCropId, setSubmittingCropId] = useState<string | null>(null);
  const [cancellingCropId, setCancellingCropId] = useState<string | null>(null);

  const shareableCrops = useMemo(
    () => (myCrops ?? []).filter((c) => c.status === 'ACTIVE' && c.advisorReviewStatus !== 'ACCEPTED'),
    [myCrops],
  );

  /** Real backend crops the advisor has accepted — replaces the old local-only mock's `acceptedPlots`. */
  const acceptedRealCrops = useMemo(() => (myCrops ?? []).filter((c) => c.advisorReviewStatus === 'ACCEPTED'), [myCrops]);

  const handleRequestAdvisorReview = async (cropId: string, label: string) => {
    tap();
    setSubmittingCropId(cropId);
    try {
      await submitCropToAdvisor.mutateAsync(cropId);
      const message = `${label} request sent to your advisor!`;
      Platform.OS === 'web' ? alert(`🤝 ${message}`) : Alert.alert('Request Sent 🤝', message);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not send this request. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    } finally {
      setSubmittingCropId(null);
    }
  };

  const handleCancelAdvisorReview = async (cropId: string) => {
    tap();
    setCancellingCropId(cropId);
    try {
      await cancelCropSubmission.mutateAsync(cropId);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not cancel this request. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    } finally {
      setCancellingCropId(null);
    }
  };

  const soilTypeLabel = useMemo(() => SOIL_TYPE_OPTIONS.find((o) => o.value === soilTypeVal)?.label, [soilTypeVal]);
  const waterTypeLabel = useMemo(() => WATER_TYPE_OPTIONS.find((o) => o.value === waterTypeVal)?.label, [waterTypeVal]);

  const isFarmProfileComplete = !!farmPhotoUri && !!sprayTankSize && !!soilTypeVal && !!waterTypeVal;

  const targetPlotForProblem = useMemo(() => {
    const idToFind = selectedCropForProblem || acceptedRealCrops[0]?.id;
    return (myCrops ?? []).find((c) => c.id === idToFind);
  }, [selectedCropForProblem, acceptedRealCrops, myCrops]);

  const chooseAdvisor = useChooseAdvisor();
  const { data: availableAdvisors, isLoading: isLoadingAvailableAdvisors } = useAvailableAdvisors(
    !isLoadingSubscription && hireStatus === 'NONE' && advisorIncluded,
  );

  const handleHire = () => {
    tap();
    if (!advisorIncluded) {
      setIsUpgradeModalOpen(true);
    }
  };

  const handleChooseAdvisor = async (advisorId: string) => {
    tap();
    try {
      await chooseAdvisor.mutateAsync(advisorId);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not assign this advisor. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
    }
  };

  const pickProblemPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to attach a picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setProblemPhotoUri(uri);
    setIsUploadingProblemPhoto(true);
    try {
      const uploaded = await uploadPhoto(uri);
      setProblemPhotoUrl(uploaded.fileUrl);
    } catch {
      const message = 'Could not upload the photo. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Upload failed', message);
      setProblemPhotoUri(null);
    } finally {
      setIsUploadingProblemPhoto(false);
    }
  };

  const handleApplyProblemRemedy = async () => {
    if (!problemPhotoUrl) {
      if (Platform.OS === 'web') {
        alert('📸 Photo Upload Mandatory!\nKripya samasya-grast fasal ki photo upload karein.');
      } else {
        Alert.alert('Photo Mandatory 📸', 'Kripya samasya-grast fasal ki photo upload karein.');
      }
      return;
    }

    if (!selectedRealCropId) {
      const message = 'Kripya pehle koi crop farm/plot me register karein — tabhi advisor ko alert bheja ja sakta hai.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('No Crop Found', message);
      return;
    }

    if (problemDescription.trim().length < 50) {
      const message = 'Kripya apni samasya ka kam se kam 50 characters ka vivaran likhein.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Description Too Short', message);
      return;
    }

    tap();
    try {
      await createCropProblem.mutateAsync({
        cropCycleId: selectedRealCropId,
        title: problemDescription.trim().slice(0, 80),
        description: problemDescription.trim(),
        severity: 'MEDIUM',
        photoUrls: [problemPhotoUrl],
      });
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not send the problem request. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      return;
    }

    const cropIdToUse = selectedCropForProblem || acceptedPlots[0]?.id || activeCropFields[0]?.id;
    setIsProblemTreatmentModalOpen(false);
    const targetCrop = cropFields.find((c) => c.id === cropIdToUse);
    const message = `Your advisor has been notified about your problem on ${targetCrop?.fieldName || 'your crop'} and will respond soon.`;

    if (Platform.OS === 'web') {
      alert(`✅ Problem Request Sent!\n${message}`);
    } else {
      Alert.alert('Advisor Notified ✅', message);
    }
  };

  // Inline Actions for Present Pending Schedule Task on Plot Card
  const handleMarkPresentTaskDone = async (plot: RegisteredCropField, presentTask: ScheduleTaskItemResult) => {
    if (!presentTask || !plot.assignedSchedule) return;
    tap();

    const todayStr = formatDateStr(new Date());
    const lines = plot.assignedSchedule.split('\n');
    lines[presentTask.lineIndex] = `[Day ${presentTask.dayNumber} · ${presentTask.dueDateStr}]: ${presentTask.taskTitle} (✔️ DONE: Done on ${todayStr})`;

    const updatedScheduleStr = lines.join('\n');
    try {
      await acceptFarmRequest(plot.id, updatedScheduleStr);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not update this task. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      return;
    }

    if (Platform.OS === 'web') alert(`✅ Present Task "Day ${presentTask.dayNumber}: ${presentTask.taskTitle}" marked as DONE on ${todayStr}!`);
    else Alert.alert('Task Completed ✅', `Marked as Done on ${todayStr}. Next task updated.`);
  };

  const handleSkipPresentTask = async (plot: RegisteredCropField, presentTask: ScheduleTaskItemResult) => {
    if (!presentTask || !plot.assignedSchedule) return;
    tap();

    const lines = plot.assignedSchedule.split('\n');
    lines[presentTask.lineIndex] = `[Day ${presentTask.dayNumber} · ${presentTask.dueDateStr}]: ${presentTask.taskTitle} (⏭️ SKIPPED: Skipped by farmer)`;

    const updatedScheduleStr = lines.join('\n');
    try {
      await acceptFarmRequest(plot.id, updatedScheduleStr);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not update this task. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      return;
    }

    if (Platform.OS === 'web') alert(`⏭️ Present Task "Day ${presentTask.dayNumber}" marked as SKIPPED.`);
    else Alert.alert('Task Skipped ⏭️', 'Present schedule task marked as skipped.');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <Text style={styles.heroTitle}>My Advisor</Text>
          {advisorIncluded ? (
            <View style={styles.planBadge}>
              <Ionicons name="ribbon-outline" size={12} color="#ffffff" />
              <Text style={styles.planBadgeText}>{plan === 'PREMIUM' ? 'Premium' : 'Standard'}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.heroSubtitle}>Expert guidance for your farm & crop schedules</Text>
      </LinearGradient>

      {isLoadingSubscription ? (
        <View style={styles.body}>
          <Ionicons name="hourglass-outline" size={32} color={theme.primary} />
        </View>
      ) : null}

      {!isLoadingSubscription && hireStatus === 'NONE' && !advisorIncluded && (
        <View style={styles.body}>
          <View style={styles.iconCircle}>
            <Ionicons name="school-outline" size={40} color={theme.primary} />
          </View>
          <Text style={styles.title}>You Don't Have an Advisor Plan</Text>
          <Text style={styles.description}>
            Upgrade to Standard or Premium to hire an expert Farm Advisor — an advisor is included with those plans.
          </Text>

          <TouchableOpacity style={styles.hireBtnWrap} activeOpacity={0.85} onPress={handleHire}>
            <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hireBtn}>
              <Ionicons name="person-add" size={18} color="#fff" />
              <Text style={styles.hireBtnText}>Hire an Advisor</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.previewRow}>
            {[
              { label: 'Farm Visits', icon: 'navigate-outline' },
              { label: 'Consultations', icon: 'chatbubbles-outline' },
              { label: 'Spray Plans', icon: 'flask-outline' },
            ].map((item) => (
              <View key={item.label} style={styles.previewCard}>
                <Ionicons name={item.icon as any} size={20} color={theme.primary} />
                <Text style={styles.previewLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!isLoadingSubscription && hireStatus === 'NONE' && advisorIncluded && (
        <ScrollView style={styles.activeScroll} contentContainerStyle={styles.activeContent} showsVerticalScrollIndicator={false}>
          <View style={styles.body}>
            <View style={styles.iconCircle}>
              <Ionicons name="people-outline" size={40} color={theme.primary} />
            </View>
            <Text style={styles.title}>Choose Your Advisor</Text>
            <Text style={styles.description}>
              Aapka {plan === 'PREMIUM' ? 'Premium' : 'Standard'} plan advisor ke saath aata hai — neeche se koi ek advisor choose karein.
            </Text>
          </View>

          {isLoadingAvailableAdvisors ? (
            <Ionicons name="hourglass-outline" size={28} color={theme.primary} style={{ alignSelf: 'center', marginTop: 20 }} />
          ) : !availableAdvisors || availableAdvisors.length === 0 ? (
            <Text style={[styles.description, { textAlign: 'center', marginTop: 12 }]}>
              Abhi koi Farm Advisor available nahi hai. Kripya baad mein try karein.
            </Text>
          ) : (
            <View style={{ gap: 10, paddingHorizontal: SPACING.lg }}>
              {availableAdvisors.map((advisor) => (
                <View key={advisor.id} style={[styles.advisorPickCard, premiumShadow(theme.primary, 'sm')]}>
                  <Image source={{ uri: resolveMediaUrl(advisor.photoUrl) || FALLBACK_ADVISOR.avatarUrl }} style={styles.advisorAvatar} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.advisorName}>{advisor.name}</Text>
                    <Text style={styles.advisorSpec} numberOfLines={1}>
                      {advisor.specialization || FALLBACK_ADVISOR.specialization}
                    </Text>
                    <Text style={styles.advisorPickMeta}>
                      {advisor.yearsExperience ? `${advisor.yearsExperience} yrs exp · ` : ''}
                      {advisor.activeFarmerCount} farmers
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.choosePickBtn, { backgroundColor: theme.primary }]}
                    activeOpacity={0.85}
                    disabled={chooseAdvisor.isPending}
                    onPress={() => handleChooseAdvisor(advisor.id)}
                  >
                    {chooseAdvisor.isPending ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.choosePickBtnText}>Choose</Text>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      {hireStatus === 'PENDING' && (
        <View style={styles.body}>
          <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="hourglass-outline" size={40} color="#d97706" />
          </View>
          <Text style={styles.title}>Request Sent to Admin</Text>
          <Text style={styles.description}>
            Aapki subscription admin approval ke intezaar me hai. Approve hote hi advisor assign ho jayega.
          </Text>

          <View style={styles.pendingChip}>
            <Ionicons name="time-outline" size={14} color="#b45309" />
            <Text style={styles.pendingChipText}>Awaiting Admin Approval...</Text>
          </View>
        </View>
      )}

      {hireStatus === 'AWAITING_ADVISOR' && (
        <View style={styles.body}>
          <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="hourglass-outline" size={40} color="#d97706" />
          </View>
          <Text style={styles.title}>Waiting for {myPendingRequest?.advisor?.name ?? 'Advisor'}</Text>
          <Text style={styles.description}>
            Aapki hire request bhej di gayi hai. Advisor accept karega to aap chat aur advisory schedule use kar sakenge.
          </Text>

          <View style={styles.pendingChip}>
            <Ionicons name="time-outline" size={14} color="#b45309" />
            <Text style={styles.pendingChipText}>Awaiting Advisor's Response...</Text>
          </View>
        </View>
      )}

      {hireStatus === 'ACTIVE' && (
        <ScrollView style={styles.activeScroll} contentContainerStyle={styles.activeContent} showsVerticalScrollIndicator={false}>
          {/* Advisor Card — profile + Call/WhatsApp/Chat actions, unified */}
          <View style={[styles.advisorCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.advisorHeaderRow}>
              <View style={styles.advisorAvatarRing}>
                <Image source={{ uri: advisorAvatarUrl }} style={styles.advisorAvatar} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.advisorNameRow}>
                  <Text style={styles.advisorName} numberOfLines={1}>{advisorName}</Text>
                  {advisorMobile ? <Text style={styles.advisorMobileInline}>· {advisorMobile}</Text> : null}
                  {subMetrics.status === 'ACTIVE' ? <View style={styles.onlineDot} /> : null}
                </View>
                <View style={styles.advisorRoleBadge}>
                  <Ionicons name="school-outline" size={11} color={theme.primary} />
                  <Text style={styles.advisorRoleBadgeText}>{advisorSpec}</Text>
                </View>
                {subMetrics.status === 'EXPIRING_SOON' || subMetrics.status === 'EXPIRED' || subMetrics.formattedExpiry ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                    {subMetrics.status === 'EXPIRING_SOON' && (
                      <View style={[styles.activeBadge, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
                        <Ionicons name="alert-circle" size={12} color="#d97706" />
                        <Text style={[styles.activeBadgeText, { color: '#b45309' }]}>Expires in {subMetrics.diffDays} Days</Text>
                      </View>
                    )}
                    {subMetrics.status === 'EXPIRED' && (
                      <View style={[styles.activeBadge, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
                        <Ionicons name="lock-closed" size={12} color="#dc2626" />
                        <Text style={[styles.activeBadgeText, { color: '#dc2626' }]}>Plan Expired (Locked)</Text>
                      </View>
                    )}
                    {subMetrics.formattedExpiry ? (
                      <View style={styles.expiryBadge}>
                        <Ionicons name="calendar-outline" size={11} color="#b45309" />
                        <Text style={styles.expiryBadgeText}>Expires: {subMetrics.formattedExpiry}</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </View>

            <View style={styles.advisorDivider} />

            <View style={styles.advisorActionRow}>
              <TouchableOpacity
                style={[styles.advisorActionBtn, styles.advisorActionBtnFill, isCallRequestPending && styles.advisorActionBtnPending]}
                activeOpacity={0.85}
                disabled={requestCall.isPending || isCallRequestPending}
                onPress={handleRequestCall}
              >
                {requestCall.isPending ? (
                  <ActivityIndicator color={theme.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="call-outline" size={16} color={isCallRequestPending ? '#16a34a' : theme.primary} />
                    <Text style={[styles.advisorActionBtnText, isCallRequestPending && { color: '#16a34a' }]}>
                      {isCallRequestPending ? 'Requested' : 'Call Request'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              <View style={styles.advisorActionDivider} />

              {advisorMobile ? (
                <>
                  <TouchableOpacity style={[styles.advisorActionBtn, styles.advisorActionBtnFill]} activeOpacity={0.85} onPress={handleOpenWhatsapp}>
                    <Ionicons name="logo-whatsapp" size={16} color="#16a34a" />
                    <Text style={styles.advisorActionBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                  <View style={styles.advisorActionDivider} />
                </>
              ) : null}

              <TouchableOpacity
                style={[styles.advisorActionBtn, styles.advisorActionBtnFill]}
                activeOpacity={0.85}
                onPress={() =>
                  myAdvisor?.advisor &&
                  router.push({
                    pathname: '/chat-thread/[userId]',
                    params: { userId: myAdvisor.advisor.id, name: myAdvisor.advisor.name },
                  } as never)
                }
              >
                <View>
                  <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.primary} />
                  {chatUnread && chatUnread.count > 0 ? <View style={styles.advisorActionDot} /> : null}
                </View>
                <Text style={styles.advisorActionBtnText}>Chat</Text>
              </TouchableOpacity>
            </View>

            {callRequestError ? <Text style={styles.callRequestError}>{callRequestError}</Text> : null}
          </View>

          {/* MANDATORY FARM PROFILE FOR ADVISOR CARD (Hides automatically once completed!) */}
          {!isExpired && !isFarmProfileComplete && (
            <View style={[styles.progressCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="clipboard" size={18} color={theme.primary} />
                  <Text style={styles.progressTitle}>Mandatory Farm Profile</Text>
                </View>
                <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#fde68a' }}>
                  <Text style={{ fontSize: 10.5, fontFamily: FONT.bold, color: '#b45309' }}>
                    ⚠️ Action Required
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginBottom: 12 }}>
                Advisor assign hone par ye 4 details (Farmer Photo, Spray Tank 15/20/25L, Soil & Water Type) bharna zaroori hain:
              </Text>

              <View style={styles.profileSummaryGrid}>
                <View style={styles.profileSummaryChip}>
                  <Ionicons name="person-outline" size={14} color="#16a34a" />
                  <Text style={styles.profileSummaryText}>
                    {farmPhotoUri ? '📷 Farmer Photo Uploaded' : '❌ Farmer Photo Missing'}
                  </Text>
                </View>

                <View style={styles.profileSummaryChip}>
                  <Ionicons name="flask-outline" size={14} color="#d97706" />
                  <Text style={styles.profileSummaryText}>
                    🧪 Tank: {sprayTankSize ? `${sprayTankSize} Litre` : 'Not Selected'}
                  </Text>
                </View>

                <View style={styles.profileSummaryChip}>
                  <Ionicons name="leaf-outline" size={14} color="#15803d" />
                  <Text style={styles.profileSummaryText}>
                    🌱 Soil: {soilTypeLabel || 'Not Selected'}
                  </Text>
                </View>

                <View style={styles.profileSummaryChip}>
                  <Ionicons name="water-outline" size={14} color="#0284c7" />
                  <Text style={styles.profileSummaryText}>
                    💧 Water: {waterTypeLabel || 'Not Selected'}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.editProfileBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
                onPress={() => {
                  tap();
                  router.push('/farmer-profile-setup');
                }}
              >
                <Ionicons name="add-circle-outline" size={16} color="#ffffff" />
                <Text style={[styles.editProfileBtnText, { color: '#ffffff' }]}>
                  Complete Advance Profile
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* RENEWAL ALERT BANNER */}
          {subMetrics.status !== 'ACTIVE' && (
            <View style={[styles.renewalBannerBox, isExpired && { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons
                    name={isExpired ? 'lock-closed' : 'alert-circle'}
                    size={17}
                    color={isExpired ? '#dc2626' : '#b45309'}
                  />
                  <Text style={[styles.renewalBannerTitle, isExpired && { color: '#dc2626' }]}>
                    {isExpired ? 'Plan Expired — Renew to Continue' : 'Plan Expiring Soon'}
                  </Text>
                </View>
                <Text style={[styles.renewalBannerSub, isExpired && { color: '#991b1b' }]}>
                  {isExpired
                    ? `Expired on ${subMetrics.formattedExpiry}. Enter a renewal code below to restore your advisor service.`
                    : `Plan expires on ${subMetrics.formattedExpiry} (${subMetrics.diffDays} days left). Renew now to continue.`}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.renewBtn, isExpired && { backgroundColor: '#dc2626' }]}
                onPress={() => {
                  tap();
                  setIsRenewModalOpen(true);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="refresh-circle" size={16} color="#ffffff" />
                <Text style={styles.renewBtnText}>Renew Plan</Text>
              </TouchableOpacity>
            </View>
          )}

          {isExpired ? null : (
          <>
          {/* ADVISOR ACCEPTED PLOTS & PRESENT SCHEDULE DISPLAY WITH INLINE ACTIONS */}
          <View style={[styles.progressCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Text style={{ fontSize: 16 }}>🟢</Text>
              <Text style={styles.progressTitle}>Active Advisory Crops ({acceptedRealCrops.length})</Text>
            </View>

            {acceptedRealCrops.length > 0 ? (
              acceptedRealCrops.map((crop) => {
                const hasActiveProblem = activeProblemByCropId.has(crop.id);
                return (
                <View key={crop.id} style={styles.acceptedPlotCard}>
                  <View style={styles.acceptedPlotHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.acceptedPlotTitle}>📍 {crop.plot.name}</Text>
                        <View style={styles.cropBadgeMini}>
                          <Text style={styles.cropBadgeMiniText}>🌾 {crop.cropName}</Text>
                        </View>
                      </View>
                      <Text style={styles.acceptedPlotSub}>
                        {crop.area ? `📏 ${crop.area}` : ''}{crop.area && crop.sowingDate ? ' · ' : ''}
                        {crop.sowingDate ? `📅 Sown: ${new Date(crop.sowingDate).toLocaleDateString('en-IN')}` : ''}
                        {crop.variety ? ` · 🌱 ${crop.variety}` : ''}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.problemReportChip, hasActiveProblem && styles.problemReportChipWaiting]}
                      activeOpacity={0.85}
                      onPress={() => {
                        tap();
                        if (hasActiveProblem) {
                          const message = 'One problem already submitted to advisor.';
                          Platform.OS === 'web' ? alert(message) : Alert.alert('Already Submitted', message);
                          return;
                        }
                        setSelectedCropForProblem(crop.id);
                        setProblemPhotoUri(null);
                        setProblemPhotoUrl(null);
                        setProblemDescription('');
                        setSelectedRealCropId(crop.id);
                        setIsProblemTreatmentModalOpen(true);
                      }}
                    >
                      <Ionicons
                        name={hasActiveProblem ? 'checkmark-circle' : 'medical-outline'}
                        size={12}
                        color={hasActiveProblem ? '#16a34a' : '#dc2626'}
                      />
                      <Text style={[styles.problemReportChipText, hasActiveProblem && styles.problemReportChipTextWaiting]}>
                        {hasActiveProblem ? 'Waiting Solution' : 'Problem Report'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <SprayScheduleCards
                    cropCycleId={crop.id}
                    accentColor={theme.primary}
                    onViewDetail={(item) => openSprayItemDetail(item, `${crop.plot.name} (${crop.cropName})`)}
                  />
                </View>
                );
              })
            ) : (
              <View style={styles.noAcceptedBox}>
                <Ionicons name="alert-circle-outline" size={24} color="#cbd5e1" />
                <Text style={styles.noAcceptedText}>No plots currently accepted by advisor.</Text>
                <Text style={styles.noAcceptedSub}>Crops accepted by your advisor will appear here with active schedules.</Text>
              </View>
            )}
          </View>

          {/* SHARE CROP FARMS WITH ADVISOR FOR SCHEDULE */}
          <View style={[styles.progressCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Text style={{ fontSize: 16, color: '#dc2626' }}>🔴</Text>
              <Text style={styles.progressTitle}>No Advisory Crops ({shareableCrops.length})</Text>
            </View>
            <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginBottom: 12 }}>
              Share crops with {FALLBACK_ADVISOR.name} to unlock advisory scheduling.
            </Text>

            {shareableCrops.length === 0 ? (
              <View style={{ padding: 12, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#15803d', flex: 1 }}>
                  All registered crop plots have been accepted by your advisor!
                </Text>
              </View>
            ) : (
              shareableCrops.map((crop) => {
                const advStatus = crop.advisorReviewStatus || 'NONE';
                const label = `${crop.plot.name} (${crop.cropName})`;

                return (
                  <View key={crop.id} style={styles.cropShareItem}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.cropSharePlot}>📍 {crop.plot.name}</Text>
                        <Text style={styles.cropShareName}>🌾 {crop.cropName}</Text>
                      </View>
                      {crop.area || crop.sowingDate ? (
                        <Text style={styles.cropShareMeta}>
                          {crop.area ? `📏 ${crop.area}` : ''}{crop.area && crop.sowingDate ? ' · ' : ''}{crop.sowingDate ? `📅 Sown: ${crop.sowingDate}` : ''}
                        </Text>
                      ) : null}
                    </View>

                    {advStatus === 'NONE' && (
                      <TouchableOpacity
                        style={styles.shareBtn}
                        activeOpacity={0.8}
                        disabled={submittingCropId === crop.id}
                        onPress={() => handleRequestAdvisorReview(crop.id, label)}
                      >
                        {submittingCropId === crop.id ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <>
                            <Ionicons name="person-add-outline" size={14} color="#ffffff" />
                            <Text style={styles.shareBtnText}>Request Advisor</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    )}

                    {advStatus === 'PENDING' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={styles.pendingBadge}>
                          <Ionicons name="time-outline" size={13} color="#d97706" />
                          <Text style={styles.pendingBadgeText}>⏳ Pending</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.cancelPendingBtn}
                          activeOpacity={0.8}
                          disabled={cancellingCropId === crop.id}
                          onPress={() => handleCancelAdvisorReview(crop.id)}
                        >
                          {cancellingCropId === crop.id ? (
                            <ActivityIndicator color="#dc2626" size="small" />
                          ) : (
                            <Ionicons name="close" size={14} color="#dc2626" />
                          )}
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
          </>
          )}

          <RenewModal visible={isRenewModalOpen} onClose={() => setIsRenewModalOpen(false)} />
        </ScrollView>
      )}

      {/* PLOT-SPECIFIC CROP PROBLEM REQUEST MODAL */}
      <Modal visible={isProblemTreatmentModalOpen} transparent animationType="slide" onRequestClose={() => setIsProblemTreatmentModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>🚨 New Disease</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsProblemTreatmentModalOpen(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 8 }}>
              {selectedCropForProblem ? (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                    1. Crop & Problem Photo * (Upload Mandatory)
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff1f2', padding: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#fca5a5' }}>
                    {problemPhotoUri ? (
                      <Image source={{ uri: problemPhotoUri }} style={{ width: 52, height: 52, borderRadius: RADIUS.sm }} />
                    ) : (
                      <View style={{ width: 52, height: 52, borderRadius: RADIUS.sm, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
                        {isUploadingProblemPhoto ? (
                          <ActivityIndicator size="small" color="#dc2626" />
                        ) : (
                          <Ionicons name="camera-outline" size={22} color="#dc2626" />
                        )}
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#dc2626' }} numberOfLines={1}>
                        📍 {targetPlotForProblem?.plot?.name} · 🌾 {targetPlotForProblem?.cropName}
                      </Text>
                      <TouchableOpacity
                        style={{ backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.sm, opacity: isUploadingProblemPhoto ? 0.6 : 1, marginTop: 6, alignSelf: 'flex-start' }}
                        disabled={isUploadingProblemPhoto}
                        onPress={pickProblemPhoto}
                      >
                        <Text style={{ color: '#fff', fontSize: 11.5, fontFamily: FONT.bold }}>
                          {isUploadingProblemPhoto ? 'Uploading...' : problemPhotoUrl ? 'Change Photo' : 'Upload Crop Photo *'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  {!problemPhotoUrl && (
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#dc2626' }}>
                      * Crop photo upload is mandatory before submitting request.
                    </Text>
                  )}
                </View>
              ) : (
                <>
                  {(myCrops?.length ?? 0) > 1 && (
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                        1. Which Crop? *
                      </Text>
                      <View style={{ gap: 6 }}>
                        {myCrops!.map((crop) => {
                          const isSelected = selectedRealCropId === crop.id;
                          return (
                            <TouchableOpacity
                              key={crop.id}
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: 10,
                                borderRadius: RADIUS.md,
                                borderWidth: 1.5,
                                borderColor: isSelected ? '#dc2626' : '#cbd5e1',
                                backgroundColor: isSelected ? '#fff1f2' : '#ffffff',
                              }}
                              activeOpacity={0.85}
                              onPress={() => {
                                tap();
                                setSelectedRealCropId(crop.id);
                              }}
                            >
                              <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: isSelected ? '#dc2626' : '#0f172a', flex: 1 }}>
                                📍 {crop.plot.name} · 🌾 {crop.cropName}
                              </Text>
                              {isSelected && <Ionicons name="checkmark-circle" size={16} color="#dc2626" />}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                      2. Crop Problem Photo * (Upload Mandatory)
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff1f2', padding: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#fca5a5' }}>
                      {problemPhotoUri ? (
                        <Image source={{ uri: problemPhotoUri }} style={{ width: 56, height: 56, borderRadius: RADIUS.sm }} />
                      ) : (
                        <View style={{ width: 56, height: 56, borderRadius: RADIUS.sm, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' }}>
                          {isUploadingProblemPhoto ? (
                            <ActivityIndicator size="small" color="#dc2626" />
                          ) : (
                            <Ionicons name="camera-outline" size={26} color="#dc2626" />
                          )}
                        </View>
                      )}
                      <TouchableOpacity
                        style={{ backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm, opacity: isUploadingProblemPhoto ? 0.6 : 1 }}
                        disabled={isUploadingProblemPhoto}
                        onPress={pickProblemPhoto}
                      >
                        <Text style={{ color: '#fff', fontSize: 11.5, fontFamily: FONT.bold }}>
                          {isUploadingProblemPhoto ? 'Uploading...' : problemPhotoUrl ? 'Change Photo' : 'Upload Crop Photo *'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                    {!problemPhotoUrl && (
                      <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#dc2626' }}>
                        * Crop photo upload is mandatory before submitting request.
                      </Text>
                    )}
                  </View>
                </>
              )}

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  3. Describe the Problem *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: problemDescription.trim().length >= 50 ? '#cbd5e1' : '#fca5a5',
                    borderRadius: RADIUS.md,
                    padding: 12,
                    fontSize: 13,
                    fontFamily: FONT.medium,
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Apni fasal ki samasya vistaar se batayein — jaise patton ka rang, dhabbe, keede, ya sukhna. Yeh seedha advisor ko jayega."
                  placeholderTextColor="#94a3b8"
                  value={problemDescription}
                  onChangeText={setProblemDescription}
                  multiline
                />
                <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: problemDescription.trim().length >= 50 ? '#16a34a' : '#dc2626' }}>
                  {problemDescription.trim().length}/50 characters minimum
                </Text>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                {
                  backgroundColor:
                    problemPhotoUrl && problemDescription.trim().length >= 50 && !createCropProblem.isPending
                      ? '#dc2626'
                      : '#94a3b8',
                  marginTop: 10,
                },
              ]}
              activeOpacity={0.85}
              disabled={createCropProblem.isPending}
              onPress={handleApplyProblemRemedy}
            >
              {createCropProblem.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="send" size={16} color="#ffffff" />
              )}
              <Text style={styles.modalSubmitBtnText}>
                {createCropProblem.isPending ? 'Sending...' : 'Send Problem Request & Alert Advisor'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SPRAY SCHEDULE ITEM DETAIL MODAL — full data for exactly the one selected item */}
      <Modal
        visible={!!sprayDetailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSprayDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={marketSprayStyles.tableModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>🧪 Spray Schedule Detail</Text>
                <Text style={marketSprayStyles.modalSub}>{sprayDetailTitle}</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setSprayDetailItem(null)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            {sprayDetailItem ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <SprayDetailCard item={sprayDetailItem} />
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* MANDATORY FARM PROFILE SETUP MODAL */}
      <Modal visible={isFarmProfileModalOpen} transparent animationType="slide" onRequestClose={() => setIsFarmProfileModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📋 Mandatory Farm Details</Text>
                <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>
                  Required for {FALLBACK_ADVISOR.name}'s spray & irrigation schedule
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setIsFarmProfileModalOpen(false)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 10 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  1. Farmer's Photograph (किसान की फोटो) *
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f8fafc', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1' }}>
                  {farmPhotoUri ? (
                    <Image source={{ uri: farmPhotoUri }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                  ) : (
                    <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="person-circle-outline" size={28} color="#64748b" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.sm }}
                    onPress={() => {
                      tap();
                      setFarmPhotoUri('https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150');
                      if (Platform.OS === 'web') alert('📸 Farmer Photo Uploaded Successfully! (किसान की फोटो अपलोड हो गई)');
                      else Alert.alert('Farmer Photo Uploaded 📸', 'Aapki kisan photo save ho gayi hai.');
                    }}
                  >
                    <Text style={{ color: '#fff', fontSize: 11.5, fontFamily: FONT.bold }}>
                      {farmPhotoUri ? 'Change Photo' : 'Upload Farmer Photo'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  2. Spray Tank Size (Litre) *
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {SPRAY_TANK_SIZE_OPTIONS.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={{
                        flex: 1,
                        paddingVertical: 10,
                        borderRadius: RADIUS.md,
                        borderWidth: 1.5,
                        borderColor: sprayTankSize === size ? theme.primary : '#cbd5e1',
                        backgroundColor: sprayTankSize === size ? theme.primaryLight : '#ffffff',
                        alignItems: 'center',
                      }}
                      onPress={() => {
                        tap();
                        setSprayTankSize(size);
                      }}
                    >
                      <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: sprayTankSize === size ? theme.primary : '#334155' }}>
                        {size} Litre
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  3. Soil Type (मिट्टी का प्रकार) *
                </Text>
                <View style={{ gap: 6 }}>
                  {SOIL_TYPE_OPTIONS.map((soil) => (
                    <TouchableOpacity
                      key={soil.value}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: RADIUS.md,
                        borderWidth: 1,
                        borderColor: soilTypeVal === soil.value ? theme.primary : '#e2e8f0',
                        backgroundColor: soilTypeVal === soil.value ? '#f0fdf4' : '#ffffff',
                      }}
                      onPress={() => {
                        tap();
                        setSoilTypeVal(soil.value);
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: soilTypeVal === soil.value ? '#15803d' : '#334155' }}>
                        🌱 {soil.label}
                      </Text>
                      {soilTypeVal === soil.value && <Ionicons name="checkmark-circle" size={16} color="#16a34a" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  4. Water / Irrigation Source (पानी का स्रोत) *
                </Text>
                <View style={{ gap: 6 }}>
                  {WATER_TYPE_OPTIONS.map((water) => (
                    <TouchableOpacity
                      key={water.value}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingHorizontal: 12,
                        paddingVertical: 9,
                        borderRadius: RADIUS.md,
                        borderWidth: 1,
                        borderColor: waterTypeVal === water.value ? '#0284c7' : '#e2e8f0',
                        backgroundColor: waterTypeVal === water.value ? '#f0f9ff' : '#ffffff',
                      }}
                      onPress={() => {
                        tap();
                        setWaterTypeVal(water.value);
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: waterTypeVal === water.value ? '#0369a1' : '#334155' }}>
                        💧 {water.label}
                      </Text>
                      {waterTypeVal === water.value && <Ionicons name="checkmark-circle" size={16} color="#0284c7" />}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { backgroundColor: theme.primary, marginTop: 10 }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                setIsFarmProfileModalOpen(false);
                if (Platform.OS === 'web') alert('✅ Mandatory Farm Details Saved!');
                else Alert.alert('Saved ✅', 'Aapki farm details advisor ke paas save ho gayi hain.');
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
              <Text style={styles.modalSubmitBtnText}>Save Farm Profile Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <FarmerPlanUpgradeModal visible={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} tiers={['STANDARD', 'PREMIUM']} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 24, paddingHorizontal: SPACING.xxl },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13.5, fontFamily: FONT.medium, marginTop: 2 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  planBadgeText: { color: '#ffffff', fontSize: 11.5, fontFamily: FONT.bold },
  body: { flex: 1, alignItems: 'center', padding: SPACING.xxl, paddingTop: 40 },
  iconCircle: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: theme.primaryLight,
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  description: {
    fontSize: 13.5, color: '#64748b', fontFamily: FONT.medium, textAlign: 'center',
    marginTop: 8, lineHeight: 20, maxWidth: 320,
  },
  hireBtnWrap: { width: '100%', maxWidth: 320, borderRadius: RADIUS.md, marginTop: 22, ...premiumShadow(theme.primary, 'sm') },
  hireBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: RADIUS.md },
  hireBtnText: { color: '#fff', fontSize: 15, fontFamily: FONT.bold },
  previewRow: { flexDirection: 'row', gap: 10, marginTop: 28, width: '100%' },
  previewCard: {
    flex: 1, backgroundColor: '#ffffff', borderRadius: RADIUS.md, paddingVertical: 16,
    alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#eef2f6',
  },
  previewLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#334155', textAlign: 'center' },
  pendingChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a',
    borderRadius: RADIUS.pill, paddingHorizontal: 14, paddingVertical: 8, marginTop: 22,
  },
  pendingChipText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#b45309' },
  activeScroll: { flex: 1 },
  activeContent: { padding: SPACING.lg, gap: SPACING.md, paddingBottom: SPACING.xxl },
  advisorCard: {
    backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md,
    borderWidth: 1, borderColor: '#f1f5f9',
  },
  advisorHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  advisorDivider: { height: 1, backgroundColor: '#f1f5f9', marginTop: 10, marginBottom: 8 },
  advisorActionRow: { flexDirection: 'row', alignItems: 'stretch' },
  advisorActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 7 },
  advisorActionBtnFill: { flex: 1 },
  advisorActionBtnPending: { backgroundColor: '#f0fdf4', borderRadius: RADIUS.md },
  advisorActionBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
  advisorActionDivider: { width: 1, backgroundColor: '#f1f5f9' },
  advisorActionDot: { position: 'absolute', top: -2, right: -3, width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#dc2626' },
  advisorAvatarRing: {
    width: 52, height: 52, borderRadius: 26,
    padding: 2, borderWidth: 1.5, borderColor: theme.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  advisorAvatar: { width: 46, height: 46, borderRadius: 23 },
  advisorNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  advisorName: { fontSize: 15.5, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.2, flexShrink: 1 },
  advisorMobileInline: { fontSize: 12, fontFamily: FONT.semiBold, color: '#64748b' },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#22c55e' },
  advisorRoleBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    backgroundColor: theme.primaryLight, borderRadius: RADIUS.pill,
    paddingHorizontal: 8, paddingVertical: 2, marginTop: 4,
  },
  advisorRoleBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: theme.primary },
  advisorSpec: { fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  callRequestError: { fontSize: 11.5, fontFamily: FONT.medium, color: '#dc2626', marginTop: 8 },
  advisorPickCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md,
  },
  advisorPickMeta: { fontSize: 11, fontFamily: FONT.semiBold, color: '#94a3b8', marginTop: 3 },
  choosePickBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.pill, minWidth: 72, alignItems: 'center' },
  choosePickBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },
  activeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill,
  },
  activeBadgeText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a' },
  planLimitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  planLimitBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  expiryBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  profileSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  profileSummaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  profileSummaryText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    marginTop: 10,
  },
  editProfileBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  renewalBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 10,
  },
  renewalBannerTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  renewalBannerSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#78350f',
    marginTop: 2,
    lineHeight: 16,
  },
  renewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  renewBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  progressCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  progressTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  acceptedPlotCard: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  acceptedPlotHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  acceptedPlotTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  cropBadgeMini: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  cropBadgeMiniText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  acceptedPlotSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 3,
  },
  problemReportChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  problemReportChipText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#dc2626',
  },
  problemReportChipWaiting: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  problemReportChipTextWaiting: {
    color: '#16a34a',
  },
  presentScheduleCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 8,
    gap: 6,
  },
  presentScheduleHeader: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  duePill: {
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  duePillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  presentScheduleTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
    marginTop: 2,
  },
  taskBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  taskDoneBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  taskSkipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  taskBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  allCompletedScheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    marginTop: 8,
  },
  allCompletedText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  noAcceptedBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 4,
  },
  noAcceptedText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  noAcceptedSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },
  cropShareItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#f8fafc', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 10, gap: 8,
  },
  cropSharePlot: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  cropShareName: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a' },
  cropShareMeta: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.md,
  },
  shareBtnText: { color: '#ffffff', fontSize: 11.5, fontFamily: FONT.bold },
  pendingBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 6, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#fde68a',
  },
  pendingBadgeText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#d97706' },
  cancelPendingBtn: {
    width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fca5a5',
  },
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
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  modalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  modalSubmitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },
});
