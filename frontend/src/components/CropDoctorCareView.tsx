import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
  TextInput,
} from 'react-native';
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
import { useMyAdvisor, useAvailableAdvisors, useMyPendingRequest, useCancelPendingRequest } from '@/src/hooks/useAdvisorAssignments';
import { useMyCrops, useSubmitCropToAdvisor, useCancelCropSubmission } from '@/src/hooks/useCrops';
import { useCreateCropProblem, useMyCropProblems, useRateCropProblem } from '@/src/hooks/useCropProblems';
import { uploadPhoto } from '@/src/api/uploads.api';
import { RenewModal } from '@/src/components/RenewPlanCard';
import { useFarmerPlan, useChooseAdvisor } from '@/src/hooks/useFarmerPlan';
import { FarmerPlanUpgradeModal } from '@/src/components/FarmerPlanUpgradeModal';
import { resolveMediaUrl } from '@/src/api/client';
import { AvailableAdvisor, CropProblem, SprayScheduleItem } from '@/src/types/api';
import { useChatUnreadCount } from '@/src/hooks/useChat';
import { SprayScheduleCards } from '@/src/components/SprayScheduleCards';
import { SprayDetailCard } from '@/src/components/SprayDetailCard';
import { useCreateCallRequest, useMyPendingCallRequest } from '@/src/hooks/useCallRequests';
import { useAuth } from '@/src/store/auth-context';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

type HireStatus = 'NONE' | 'PENDING' | 'AWAITING_ADVISOR' | 'ACTIVE';

const FALLBACK_ADVISOR = {
  name: 'Your Advisor',
  specialization: 'Farm Advisor',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
};

export function CropDoctorCareView() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: subscription, isLoading: isLoadingSubscription } = useSubscriptionStatus();
  const { data: myAdvisor } = useMyAdvisor();
  const { data: myPendingRequest } = useMyPendingRequest();
  const cancelPendingRequest = useCancelPendingRequest();
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isReviewSectionExpanded, setIsReviewSectionExpanded] = useState(false);

  const handleCancelHireRequest = async () => {
    tap();
    try {
      await cancelPendingRequest.mutateAsync();
      if (Platform.OS === 'web') alert('✅ Hire request cancelled successfully.');
      else Alert.alert('Cancelled', 'Your hire request has been cancelled.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not cancel request.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  const { plan } = useFarmerPlan();
  const advisorIncluded = plan === 'PRO' || plan === 'SMART' || plan === 'SUPER';

  const hireStatus: HireStatus = myAdvisor
    ? 'ACTIVE'
    : myPendingRequest
      ? 'AWAITING_ADVISOR'
      : subscription?.status === 'PENDING'
        ? 'PENDING'
        : 'NONE';

  const { cropFields } = useCrops();

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
    Linking.openURL(`https://wa.me/${withCountryCode}?text=${encodeURIComponent(greeting)}`).catch(() => { });
  };

  // Mandatory Profile Setup State
  const [farmPhotoUri, setFarmPhotoUri] = useState<string | null>(
    'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=300'
  );
  const [sprayTankSize, setSprayTankSize] = useState<number | null>(20);
  const [soilTypeVal, setSoilTypeVal] = useState<string | null>('LOAMY');
  const [waterTypeVal, setWaterTypeVal] = useState<string | null>('BOREWELL_TUBEWELL');

  // Spray Detail Modal State
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
  const [problemHeading, setProblemHeading] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [problemPhotoUris, setProblemPhotoUris] = useState<string[]>([]);
  const [problemPhotoUrls, setProblemPhotoUrls] = useState<string[]>([]);
  const [isUploadingProblemPhoto, setIsUploadingProblemPhoto] = useState(false);
  const [selectedRealCropId, setSelectedRealCropId] = useState<string>('');

  const { data: myCrops } = useMyCrops();
  const createCropProblem = useCreateCropProblem();
  const { data: myCropProblems } = useMyCropProblems();
  const rateCropProblem = useRateCropProblem();
  const [viewingProblem, setViewingProblem] = useState<CropProblem | null>(null);
  const [viewingProblemPhoto, setViewingProblemPhoto] = useState<string | null>(null);
  const [farmerRatingVal, setFarmerRatingVal] = useState<number>(5);
  const [farmerFeedbackVal, setFarmerFeedbackVal] = useState<string>('');

  const activeProblemByCropId = useMemo(() => {
    const map = new Map<string, CropProblem>();
    (myCropProblems ?? []).forEach((p) => {
      if (p.status === 'REPORTED' || p.status === 'UNDER_REVIEW') map.set(p.cropCycleId, p);
    });
    return map;
  }, [myCropProblems]);

  const unratedSolvedProblemByCropId = useMemo(() => {
    const map = new Map<string, CropProblem>();
    (myCropProblems ?? []).forEach((p) => {
      if ((p.status === 'ADVISOR_RESPONDED' || p.status === 'RESOLVED') && !p.farmerRating) {
        if (!map.has(p.cropCycleId)) map.set(p.cropCycleId, p);
      }
    });
    return map;
  }, [myCropProblems]);

  const submitCropToAdvisor = useSubmitCropToAdvisor();
  const cancelCropSubmission = useCancelCropSubmission();
  const [submittingCropId, setSubmittingCropId] = useState<string | null>(null);
  const [cancellingCropId, setCancellingCropId] = useState<string | null>(null);

  const shareableCrops = useMemo(
    () => (myCrops ?? []).filter((c) => c.status !== 'COMPLETED' && c.status !== 'FAILED' && c.advisorReviewStatus !== 'ACCEPTED'),
    [myCrops],
  );

  const acceptedRealCrops = useMemo(() => (myCrops ?? []).filter((c) => c.advisorReviewStatus === 'ACCEPTED'), [myCrops]);

  const handleRequestAdvisorReview = async (cropId: string, label: string) => {
    tap();
    if (hireStatus !== 'ACTIVE') {
      const message = 'You must have an active Advisor Plan and assigned Advisor to submit crops for advisor review.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Advisor Required', message);
      return;
    }
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
  const isFarmProfileComplete = !!farmPhotoUri && !!sprayTankSize;

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
    if (problemPhotoUrls.length >= 3) {
      const msg = 'Maximum 3 photos allowed.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Limit Reached', msg);
      return;
    }
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
    setIsUploadingProblemPhoto(true);
    try {
      const uploaded = await uploadPhoto(uri);
      setProblemPhotoUris((prev) => [...prev, uri]);
      setProblemPhotoUrls((prev) => [...prev, uploaded.fileUrl]);
    } catch {
      const message = 'Could not upload the photo. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Upload failed', message);
    } finally {
      setIsUploadingProblemPhoto(false);
    }
  };

  const removeProblemPhoto = (index: number) => {
    tap();
    setProblemPhotoUris((prev) => prev.filter((_, i) => i !== index));
    setProblemPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleApplyProblemRemedy = async () => {
    if (problemPhotoUrls.length === 0) {
      if (Platform.OS === 'web') {
        alert('📸 Photo Upload Mandatory!\nPlease upload at least 1 photo of the affected crop.');
      } else {
        Alert.alert('Photo Mandatory 📸', 'Please upload at least 1 photo of the affected crop.');
      }
      return;
    }

    if (!selectedRealCropId) {
      const message = 'Please register a crop in your farm/plot first — only then can an alert be sent to your advisor.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('No Crop Found', message);
      return;
    }

    if (problemDescription.trim().length < 30) {
      const message = 'Please write a description of your problem with at least 30 characters.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Description Too Short', message);
      return;
    }

    tap();
    try {
      await createCropProblem.mutateAsync({
        cropCycleId: selectedRealCropId,
        title: problemHeading.trim().slice(0, 20) || problemDescription.trim().slice(0, 20) || 'Crop Disease Problem',
        description: problemDescription.trim(),
        severity: 'MEDIUM',
        photoUrls: problemPhotoUrls,
      });
      setProblemHeading('');
      setProblemPhotoUris([]);
      setProblemPhotoUrls([]);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? 'Could not send the problem request. Please try again.';
      Platform.OS === 'web' ? alert(message) : Alert.alert('Error', message);
      return;
    }

    setIsProblemTreatmentModalOpen(false);
    const message = `Your advisor has been notified about your problem and will respond soon.`;
    if (Platform.OS === 'web') {
      alert(`✅ Problem Request Sent!\n${message}`);
    } else {
      Alert.alert('Advisor Notified ✅', message);
    }
  };

  return (
    <View style={styles.container}>
      {isLoadingSubscription ? (
        <View style={styles.body}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : null}

      {!isLoadingSubscription && hireStatus === 'NONE' && !advisorIncluded && (
        <View style={styles.body}>
          <View style={styles.iconCircle}>
            <Ionicons name="school-outline" size={40} color={theme.primary} />
          </View>
          <Text style={styles.title}>PRO Software Plan Required</Text>
          <Text style={styles.description}>
            Step 1: Activate the PRO Software Plan to unlock Expert Advisor hiring and personalized consultations.
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <TouchableOpacity style={[styles.hireBtnWrap, { flex: 1 }]} activeOpacity={0.85} onPress={handleHire}>
              <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.hireBtn}>
                <Ionicons name="person-add" size={18} color="#fff" />
                <Text style={styles.hireBtnText}>Upgrade to PRO</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.hireBtnWrap, { flex: 1 }]} activeOpacity={0.85} onPress={() => setIsUpgradeModalOpen(true)}>
              <View style={[styles.hireBtn, { backgroundColor: '#25D366' }]}>
                <Ionicons name="qr-code-outline" size={18} color="#fff" />
                <Text style={styles.hireBtnText}>Get Plan Coupon</Text>
              </View>
            </TouchableOpacity>
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
              Your Pro plan comes with an advisor — choose one from below.
            </Text>
          </View>

          {isLoadingAvailableAdvisors ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ alignSelf: 'center', marginTop: 20 }} />
          ) : !availableAdvisors || availableAdvisors.length === 0 ? (
            <Text style={[styles.description, { textAlign: 'center', marginTop: 12 }]}>
              No Farm Advisor is currently available. Please try again later.
            </Text>
          ) : (
            <View style={{ gap: 12, paddingHorizontal: SPACING.lg }}>
              {availableAdvisors.map((advisor) => {
                const isSenior = !!advisor.isSeniorDoctor;
                const designation = isSenior ? 'Crop Doctor' : 'Crop Advisor';
                const designationIcon = isSenior ? 'medical' : 'leaf';
                const buttonLabel = isSenior ? 'Hire Doctor' : 'Hire Advisor';

                return (
                  <View key={advisor.id} style={[styles.advisorPickCard, premiumShadow(theme.primary, 'sm'), { padding: 12, borderRadius: RADIUS.md }]}>
                    <View style={{ position: 'relative' }}>
                      <Image source={{ uri: resolveMediaUrl(advisor.photoUrl) || FALLBACK_ADVISOR.avatarUrl }} style={styles.advisorAvatar} />
                      <View style={{ position: 'absolute', bottom: -1, right: -1, backgroundColor: '#ffffff', borderRadius: 8, padding: 1 }}>
                        <Ionicons name="checkmark-circle" size={15} color="#10b981" />
                      </View>
                    </View>

                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.advisorName}>{advisor.name}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: isSenior ? '#eff6ff' : '#f0fdf4', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: isSenior ? '#bfdbfe' : '#bbf7d0' }}>
                          <Ionicons name={designationIcon} size={10} color={isSenior ? '#1d4ed8' : '#15803d'} />
                          <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: isSenior ? '#1d4ed8' : '#15803d' }}>
                            {designation}
                          </Text>
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#fef9c3', paddingHorizontal: 5, paddingVertical: 1, borderRadius: 6 }}>
                          <Ionicons name="star" size={10} color="#ca8a04" />
                          <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#854d0e' }}>
                            {advisor.ratingLabel || (advisor.rating ? `${advisor.rating} ★ (${advisor.ratingCount || 1})` : 'No rating till now')}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.advisorSpec} numberOfLines={1}>
                        🔬 {advisor.specialization || FALLBACK_ADVISOR.specialization}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.choosePickBtn, { backgroundColor: isSenior ? '#2563eb' : theme.primary, paddingHorizontal: 12 }]}
                      activeOpacity={0.85}
                      disabled={chooseAdvisor.isPending}
                      onPress={() => handleChooseAdvisor(advisor.id)}
                    >
                      {chooseAdvisor.isPending ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name="person-add-outline" size={13} color="#ffffff" />
                          <Text style={styles.choosePickBtnText}>{buttonLabel}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
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
            Your subscription is awaiting admin approval. An advisor will be assigned once approved.
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
            Your hire request has been sent. Once accepted by the advisor, you will be able to chat and use the schedule.
          </Text>
          <View style={styles.pendingChip}>
            <Ionicons name="time-outline" size={14} color="#b45309" />
            <Text style={styles.pendingChipText}>Awaiting Advisor's Response...</Text>
          </View>

          <TouchableOpacity
            style={{
              marginTop: 16,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              backgroundColor: '#fef2f2',
              borderWidth: 1,
              borderColor: '#fecaca',
              paddingVertical: 10,
              paddingHorizontal: 20,
              borderRadius: RADIUS.pill,
            }}
            disabled={cancelPendingRequest.isPending}
            onPress={handleCancelHireRequest}
          >
            {cancelPendingRequest.isPending ? (
              <ActivityIndicator size="small" color="#dc2626" />
            ) : (
              <>
                <Ionicons name="close-circle" size={18} color="#dc2626" />
                <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#dc2626' }}>❌ Cancel Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {hireStatus === 'ACTIVE' && (
        <ScrollView style={styles.activeScroll} contentContainerStyle={styles.activeContent} showsVerticalScrollIndicator={false}>
          {/* Hired Advisor Card */}
          <View style={[styles.advisorCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.advisorHeaderRow}>
              <View style={{ position: 'relative' }}>
                <View style={styles.advisorAvatarRing}>
                  <Image source={{ uri: advisorAvatarUrl }} style={styles.advisorAvatar} />
                </View>
                <View style={{ position: 'absolute', bottom: -1, right: -1, backgroundColor: '#ffffff', borderRadius: 9, padding: 1 }}>
                  <Ionicons name="checkmark-circle" size={17} color="#10b981" />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <View style={styles.advisorNameRow}>
                  <Text style={styles.advisorName} numberOfLines={1}>{advisorName}</Text>
                  {advisorMobile ? <Text style={styles.advisorMobileInline}>· {advisorMobile}</Text> : null}
                  {subMetrics.status === 'ACTIVE' ? <View style={styles.onlineDot} /> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                  <View style={styles.advisorRoleBadge}>
                    <Ionicons name="school-outline" size={11} color={theme.primary} />
                    <Text style={styles.advisorRoleBadgeText}>{advisorSpec}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#fef9c3', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#fef08a' }}>
                    <Ionicons name="star" size={11} color="#ca8a04" />
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.extraBold, color: '#854d0e' }}>
                      {myAdvisor?.advisor?.ratingLabel || (myAdvisor?.advisor?.rating ? `${myAdvisor.advisor.rating} ★ (${myAdvisor.advisor.ratingCount || 1})` : 'No rating till now')}
                    </Text>
                  </View>
                </View>
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
              {/* ADVISOR ACCEPTED PLOTS & SPRAY SCHEDULE DISPLAY */}
              <View style={[styles.progressCard, premiumShadow('#0f172a', 'sm')]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <Text style={{ fontSize: 16 }}>🟢</Text>
                  <Text style={styles.progressTitle}>Active Advisory Crops ({acceptedRealCrops.length})</Text>
                </View>

                {acceptedRealCrops.length > 0 ? (
                  acceptedRealCrops.map((crop) => {
                    return (
                      <View key={crop.id} style={styles.acceptedPlotCard}>
                        <View style={styles.acceptedPlotHeader}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <Text style={styles.acceptedPlotTitle}>
                                📍 {crop.plot.name} <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>(ID: {crop.cropId || (crop.id?.startsWith('CR-') ? crop.id : `CR-${crop.id?.slice(0, 6).toUpperCase()}`)})</Text>
                              </Text>
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

                          {(() => {
                            const activeProb = activeProblemByCropId.get(crop.id);
                            const unratedSolvedProb = unratedSolvedProblemByCropId.get(crop.id);

                            return (
                              <TouchableOpacity
                                style={[
                                  styles.problemReportChip,
                                  activeProb && styles.problemReportChipWaiting,
                                  unratedSolvedProb && styles.problemReportChipSolved,
                                ]}
                                activeOpacity={0.85}
                                onPress={() => {
                                  tap();
                                  if (activeProb) {
                                    setViewingProblem(activeProb);
                                    return;
                                  }
                                  if (unratedSolvedProb) {
                                    setViewingProblem(unratedSolvedProb);
                                    return;
                                  }
                                  setSelectedCropForProblem(crop.id);
                                  setProblemHeading('');
                                  setProblemPhotoUris([]);
                                  setProblemPhotoUrls([]);
                                  setProblemDescription('');
                                  setSelectedRealCropId(crop.id);
                                  setIsProblemTreatmentModalOpen(true);
                                }}
                              >
                                <Ionicons
                                  name={activeProb ? 'time-outline' : unratedSolvedProb ? 'checkmark-circle' : 'medical-outline'}
                                  size={12}
                                  color={activeProb ? '#b45309' : unratedSolvedProb ? '#15803d' : '#dc2626'}
                                />
                                <Text
                                  style={[
                                    styles.problemReportChipText,
                                    activeProb && styles.problemReportChipTextWaiting,
                                    unratedSolvedProb && styles.problemReportChipTextSolved,
                                  ]}
                                >
                                  {activeProb ? 'Waiting Solution' : unratedSolvedProb ? '✅ Solved (Click to Rate)' : 'Problem Report'}
                                </Text>
                              </TouchableOpacity>
                            );
                          })()}
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
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => {
                    tap();
                    setIsReviewSectionExpanded((prev) => !prev);
                  }}
                  style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 16, color: '#dc2626' }}>🔴</Text>
                    <Text style={styles.progressTitle}>Crops Needing Advisor Review ({shareableCrops.length})</Text>
                  </View>
                  <Ionicons
                    name={isReviewSectionExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="#64748b"
                  />
                </TouchableOpacity>

                {isReviewSectionExpanded && (
                  <View style={{ marginTop: 10 }}>
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
                                <Text style={styles.cropSharePlot}>
                                  📍 {crop.plot.name} <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>(ID: {crop.cropId || (crop.id?.startsWith('CR-') ? crop.id : `CR-${crop.id?.slice(0, 6).toUpperCase()}`)})</Text>
                                </Text>
                                <Text style={styles.cropShareName}>🌾 {crop.cropName}</Text>
                              </View>
                              {crop.area || crop.sowingDate ? (
                                <Text style={styles.cropShareMeta}>
                                  {crop.area ? `📏 ${crop.area}` : ''}{crop.area && crop.sowingDate ? ' · ' : ''}{crop.sowingDate ? `📅 Sown: ${crop.sowingDate.replace(/\s*\([^)]*\)/g, '').trim()}` : ''}
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
              {(!selectedCropForProblem && (myCrops?.length ?? 0) > 1) && (
                <View style={{ gap: 6 }}>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                    Which Crop? *
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
                            📍 {crop.plot.name} (ID: {crop.cropId || (crop.id?.startsWith('CR-') ? crop.id : `CR-${crop.id?.slice(0, 6).toUpperCase()}`)}) · 🌾 {crop.cropName}
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
                  Problem Heading
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: '#cbd5e1',
                    borderRadius: RADIUS.md,
                    padding: 10,
                    fontSize: 13,
                    fontFamily: FONT.medium,
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                  }}
                  placeholder="e.g. Yellow leaves (Max 20 letters)"
                  placeholderTextColor="#94a3b8"
                  maxLength={20}
                  value={problemHeading}
                  onChangeText={setProblemHeading}
                />
                <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>
                  {problemHeading.length}/20 characters max
                </Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  Describe the Problem *
                </Text>
                <TextInput
                  style={{
                    borderWidth: 1.5,
                    borderColor: problemDescription.trim().length >= 30 ? '#cbd5e1' : '#fca5a5',
                    borderRadius: RADIUS.md,
                    padding: 12,
                    fontSize: 13,
                    fontFamily: FONT.medium,
                    color: '#0f172a',
                    backgroundColor: '#ffffff',
                    minHeight: 100,
                    textAlignVertical: 'top',
                  }}
                  placeholder="Describe your crop problem in detail - such as leaf color, spots, insects, or wilting. This will be sent directly to your advisor."
                  placeholderTextColor="#94a3b8"
                  value={problemDescription}
                  onChangeText={setProblemDescription}
                  multiline
                />
                <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: problemDescription.trim().length >= 30 ? '#16a34a' : '#dc2626' }}>
                  {problemDescription.trim().length}/30 characters minimum
                </Text>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>
                  Crop & Problem Photos
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, backgroundColor: '#fff1f2', padding: 10, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#fca5a5' }}>
                  {problemPhotoUris.map((uri, idx) => (
                    <View key={idx} style={{ position: 'relative' }}>
                      <Image source={{ uri }} style={{ width: 56, height: 56, borderRadius: RADIUS.sm }} />
                      <TouchableOpacity
                        style={{
                          position: 'absolute',
                          top: -6,
                          right: -6,
                          backgroundColor: '#dc2626',
                          width: 18,
                          height: 18,
                          borderRadius: 9,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                        onPress={() => removeProblemPhoto(idx)}
                      >
                        <Ionicons name="close" size={11} color="#ffffff" />
                      </TouchableOpacity>
                    </View>
                  ))}

                  <View style={{ flex: 1 }}>
                    {selectedCropForProblem && (
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#dc2626' }} numberOfLines={1}>
                        📍 {targetPlotForProblem?.plot?.name} · 🌾 {targetPlotForProblem?.cropName}
                      </Text>
                    )}
                    {problemPhotoUrls.length < 3 && (
                      <TouchableOpacity
                        style={{ backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.sm, opacity: isUploadingProblemPhoto ? 0.6 : 1, marginTop: 4, alignSelf: 'flex-start' }}
                        disabled={isUploadingProblemPhoto}
                        onPress={pickProblemPhoto}
                      >
                        <Text style={{ color: '#fff', fontSize: 11.5, fontFamily: FONT.bold }}>
                          {isUploadingProblemPhoto ? 'Uploading...' : `+ Add Photo (${problemPhotoUrls.length}/3)`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
                {problemPhotoUrls.length === 0 && (
                  <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#dc2626' }}>
                    * Upload at least 1 photo (up to 3 photos allowed).
                  </Text>
                )}
              </View>
            </ScrollView>

            <TouchableOpacity
              style={[
                styles.modalSubmitBtn,
                {
                  backgroundColor:
                    problemPhotoUrls.length > 0 && problemDescription.trim().length >= 30 && !createCropProblem.isPending
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

      {/* FARMER VIEWING PROBLEM DETAIL MODAL */}
      <Modal
        visible={!!viewingProblem}
        transparent
        animationType="slide"
        onRequestClose={() => setViewingProblem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.modalTitle}>⚠️ Crop Disease Details</Text>
                  {viewingProblem && (
                    <View
                      style={{
                        backgroundColor:
                          viewingProblem.status === 'REPORTED' || viewingProblem.status === 'UNDER_REVIEW'
                            ? '#fef3c7'
                            : '#dcfce7',
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: RADIUS.pill,
                        borderWidth: 1,
                        borderColor:
                          viewingProblem.status === 'REPORTED' || viewingProblem.status === 'UNDER_REVIEW'
                            ? '#fde68a'
                            : '#86efac',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10.5,
                          fontFamily: FONT.bold,
                          color:
                            viewingProblem.status === 'REPORTED' || viewingProblem.status === 'UNDER_REVIEW'
                              ? '#b45309'
                              : '#15803d',
                        }}
                      >
                        {viewingProblem.status === 'REPORTED' || viewingProblem.status === 'UNDER_REVIEW'
                          ? '⌛ Waiting Advisor Response'
                          : '✅ Advisor Responded'}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: theme.primary, marginTop: 2 }}>
                  🌾 Crop: {viewingProblem?.cropCycle?.cropName || 'Farm Crop'}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setViewingProblem(null)}>
                <Ionicons name="close" size={20} color="#475569" />
              </TouchableOpacity>
            </View>

            <View style={{ height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 }} />

            {viewingProblem ? (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingBottom: 10 }}>
                <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', gap: 6 }}>
                  <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' }}>
                    📌 {viewingProblem.title}
                  </Text>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.medium, color: '#334155', lineHeight: 18 }}>
                    {viewingProblem.description}
                  </Text>
                </View>

                {viewingProblem.photos && viewingProblem.photos.length > 0 ? (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
                      📷 Attached Disease Photos ({viewingProblem.photos.length}):
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                      {viewingProblem.photos.map((p: { id?: string; photoUrl: string }, idx: number) => {
                        const fullUrl = resolveMediaUrl(p.photoUrl);
                        return (
                          <TouchableOpacity
                            key={p.id || idx}
                            activeOpacity={0.85}
                            onPress={() => fullUrl && setViewingProblemPhoto(fullUrl)}
                            style={{ position: 'relative', borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1.5, borderColor: '#cbd5e1' }}
                          >
                            <Image source={{ uri: fullUrl }} style={{ width: 90, height: 90 }} />
                            <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                              <Ionicons name="expand" size={11} color="#ffffff" />
                              <Text style={{ color: '#fff', fontSize: 9, fontFamily: FONT.bold }}>Zoom</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : null}

                {viewingProblem.advisorResponse ? (
                  <View style={{ backgroundColor: '#f0fdf4', padding: 12, borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#86efac', gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                      <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#15803d' }}>
                        👨‍🌾 Advisor Solution & Prescription:
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12.5, fontFamily: FONT.medium, color: '#166534', lineHeight: 18 }}>
                      {viewingProblem.advisorResponse}
                    </Text>

                    <View style={{ backgroundColor: '#ffffff', padding: 10, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#cbd5e1', marginTop: 6, gap: 8 }}>
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
                        ⭐ Rate & Feedback for Advisor:
                      </Text>

                      {viewingProblem.farmerRating ? (
                        <View style={{ gap: 4, backgroundColor: '#fffbeb', padding: 8, borderRadius: RADIUS.xs, borderWidth: 1, borderColor: '#fde68a' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name={star <= (viewingProblem.farmerRating || 0) ? 'star' : 'star-outline'}
                                size={16}
                                color="#d97706"
                              />
                            ))}
                            <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#b45309', marginLeft: 4 }}>
                              {viewingProblem.farmerRating}/5 Stars Rated
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                            {[1, 2, 3, 4, 5].map((star) => (
                              <TouchableOpacity
                                key={star}
                                activeOpacity={0.8}
                                onPress={() => setFarmerRatingVal(star)}
                              >
                                <Ionicons
                                  name={star <= farmerRatingVal ? 'star' : 'star-outline'}
                                  size={26}
                                  color={star <= farmerRatingVal ? '#eab308' : '#cbd5e1'}
                                />
                              </TouchableOpacity>
                            ))}
                          </View>

                          <TextInput
                            style={{
                              borderWidth: 1,
                              borderColor: '#cbd5e1',
                              borderRadius: RADIUS.sm,
                              padding: 8,
                              fontSize: 12,
                              fontFamily: FONT.medium,
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              minHeight: 45,
                            }}
                            placeholder="Write your feedback..."
                            placeholderTextColor="#94a3b8"
                            value={farmerFeedbackVal}
                            onChangeText={setFarmerFeedbackVal}
                            multiline
                          />

                          <TouchableOpacity
                            style={{
                              backgroundColor: '#16a34a',
                              paddingVertical: 9,
                              borderRadius: RADIUS.sm,
                              alignItems: 'center',
                              flexDirection: 'row',
                              justifyContent: 'center',
                              gap: 6,
                              opacity: rateCropProblem.isPending ? 0.6 : 1,
                            }}
                            disabled={rateCropProblem.isPending}
                            onPress={async () => {
                              if (!viewingProblem) return;
                              tap();
                              try {
                                await rateCropProblem.mutateAsync({
                                  id: viewingProblem.id,
                                  rating: farmerRatingVal,
                                  feedback: farmerFeedbackVal,
                                });
                                setViewingProblem(null);
                                setFarmerFeedbackVal('');
                                setFarmerRatingVal(5);
                                const msg = '⭐ Rating & Feedback submitted successfully!';
                                Platform.OS === 'web' ? alert(msg) : Alert.alert('Submitted ⭐', msg);
                              } catch (err: any) {
                                const msg = err?.response?.data?.message ?? 'Could not submit rating.';
                                Platform.OS === 'web' ? alert(msg) : Alert.alert('Error', msg);
                              }
                            }}
                          >
                            {rateCropProblem.isPending ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <Ionicons name="star" size={14} color="#ffffff" />
                            )}
                            <Text style={{ color: '#ffffff', fontSize: 12, fontFamily: FONT.bold }}>
                              {rateCropProblem.isPending ? 'Submitting...' : 'Submit Rating & Mark Solved ⭐'}
                            </Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                ) : null}
              </ScrollView>
            ) : null}
          </View>
        </View>
      </Modal>

      {/* Fullscreen Photo Zoom Modal */}
      <Modal visible={!!viewingProblemPhoto} transparent animationType="fade" onRequestClose={() => setViewingProblemPhoto(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <TouchableOpacity
            style={{ position: 'absolute', top: 40, right: 20, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.25)', padding: 10, borderRadius: 25 }}
            onPress={() => setViewingProblemPhoto(null)}
          >
            <Ionicons name="close" size={26} color="#ffffff" />
          </TouchableOpacity>
          {viewingProblemPhoto ? (
            <Image source={{ uri: viewingProblemPhoto }} style={{ width: '100%', height: '82%' }} resizeMode="contain" />
          ) : null}
        </View>
      </Modal>

      {/* SPRAY SCHEDULE ITEM DETAIL MODAL */}
      <Modal
        visible={!!sprayDetailItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSprayDetailItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.tableModalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>🧪 Spray Schedule Detail</Text>
                <Text style={styles.modalSub}>{sprayDetailTitle}</Text>
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

      <FarmerPlanUpgradeModal visible={isUpgradeModalOpen} onClose={() => setIsUpgradeModalOpen(false)} tiers={['PRO']} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
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
  choosePickBtn: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: RADIUS.pill, minWidth: 72, alignItems: 'center' },
  choosePickBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#ffffff' },
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
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
  },
  problemReportChipTextWaiting: {
    color: '#b45309',
  },
  problemReportChipSolved: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  problemReportChipTextSolved: {
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
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
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
