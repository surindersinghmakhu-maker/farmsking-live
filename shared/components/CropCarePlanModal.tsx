import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
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
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useMyCrops, useSubmitCropToAdvisor } from '@/src/hooks/useCrops';
import { useAvailableAdvisors, useChooseAdvisor, useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useRedeemFarmerPlanCoupon } from '@/src/hooks/useFarmerPlan';
import { useInitiateFarmerPlanPayment, useSubmitFarmerPlanPayment } from '@/src/hooks/useFarmerPlanPayments';
import { previewFarmerPlanCoupon, FarmerPlanCouponPreview } from '@/src/api/farmerPlans.api';
import { resolveMediaUrl } from '@/src/api/client';
import { validateCropGalleryCompleteness } from '@/src/utils/crop-media';

const FALLBACK_ADVISOR = {
  name: 'Certified Doctor',
  specialization: 'Crop Doctor & Plant Pathologist',
  avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
};

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function isExplicitlyFree(val: any): boolean {
  if (val === undefined || val === null || val === '') return false;
  const num = Number(val);
  return !isNaN(num) && num === 0;
}

function parsePlanFee(val: any, defaultFee: number): number {
  if (isExplicitlyFree(val)) return 0;
  if (val === undefined || val === null || val === '') return defaultFee;
  const num = Number(val);
  return isNaN(num) ? defaultFee : Math.max(0, num);
}

interface CropCarePlanModalProps {
  visible: boolean;
  onClose: () => void;
  initialCropId?: string;
}

export function CropCarePlanModal({ visible, onClose, initialCropId }: CropCarePlanModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useExecutiveTheme();

  // Data queries
  const { data: myCrops = [], isLoading: isLoadingCrops } = useMyCrops();
  const { data: availableAdvisors = [], isLoading: isLoadingAdvisors } = useAvailableAdvisors();
  const { data: myAdvisor } = useMyAdvisor();
  const { data: subscription } = useSubscriptionStatus();
  const { data: appSettings } = useAppSettings();

  // Mutations
  const chooseAdvisorMutation = useChooseAdvisor();
  const submitCrop = useSubmitCropToAdvisor();
  const initiatePayment = useInitiateFarmerPlanPayment();
  const submitPayment = useSubmitFarmerPlanPayment();
  const redeemCoupon = useRedeemFarmerPlanCoupon();

  // Mode Selection: 'CROP_WISE' (Pay Per Crop) vs 'MONTHLY_VIP' (Monthly Doctor Retainer)
  const [consultationMode, setConsultationMode] = useState<'CROP_WISE' | 'MONTHLY_VIP'>('CROP_WISE');

  // Crop-Wise state
  const [selectedCropId, setSelectedCropId] = useState<string | null>(initialCropId ?? null);
  const [selectedCropPackage, setSelectedCropPackage] = useState<'PRESCRIPTION' | 'SEASON'>('SEASON');

  // Monthly VIP state
  const [monthlyDuration, setMonthlyDuration] = useState<1 | 3 | 6 | 12>(1);

  // Common Selected Doctor
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);

  const realCropsList = useMemo(() => (Array.isArray(myCrops) ? myCrops : []), [myCrops]);

  // Active Doctor Information & Plan Quota
  const activeDoctorInfo = useMemo(() => {
    const doctor = myAdvisor?.advisor;
    if (!doctor && !subscription) {
      const cropWithDoc = realCropsList.find(
        (c) => c.advisorReviewStatus === 'ACCEPTED' && c.assignedAdvisor,
      );
      if (cropWithDoc?.assignedAdvisor) {
        const doc = cropWithDoc.assignedAdvisor;
        const supervised = realCropsList.filter(
          (c) =>
            c.advisorReviewStatus === 'ACCEPTED' &&
            (c.assignedAdvisorId === doc.id || c.assignedAdvisor?.id === doc.id),
        );
        const maxIncluded = Number((doc as any).monthlyIncludedCrops || 3);
        const freeSlotsRemaining = Math.max(0, maxIncluded - supervised.length);
        return {
          doctor: doc,
          supervised,
          maxIncluded,
          freeSlotsRemaining,
          hasActiveMonthly: false,
          diffDays: null,
          formattedExpiry: null,
        };
      }
      return null;
    }
    if (!doctor) return null;

    const supervised = realCropsList.filter(
      (c) =>
        (c.advisorReviewStatus === 'ACCEPTED' &&
          (c.assignedAdvisorId === doctor.id || c.assignedAdvisor?.id === doctor.id)) ||
        (myAdvisor?.status === 'ACTIVE' && c.advisorReviewStatus === 'ACCEPTED'),
    );

    const maxIncluded = Number((doctor as any).monthlyIncludedCrops || 3);
    const freeSlotsRemaining = Math.max(0, maxIncluded - supervised.length);
    const hasActiveMonthly = subscription?.status === 'ACTIVE';

    const endDate = subscription?.endDate ? new Date(subscription.endDate) : null;
    let diffDays: number | null = null;
    let formattedExpiry: string | null = null;
    if (endDate) {
      const now = new Date();
      diffDays = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      formattedExpiry = endDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    return {
      doctor,
      supervised,
      maxIncluded,
      freeSlotsRemaining,
      hasActiveMonthly,
      diffDays,
      formattedExpiry,
    };
  }, [myAdvisor, subscription, myCrops]);

  // Coupon state
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<FarmerPlanCouponPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Processing & Success State
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activatedNotice, setActivatedNotice] = useState<{
    doctorName: string;
    cropName?: string;
    packageName: string;
    validUntil: string;
    isFree?: boolean;
  } | null>(null);

  // In-Modal UPI Direct & QR Code Checkout State (for PC & Mobile)
  const [upiCheckoutData, setUpiCheckoutData] = useState<{
    id: string;
    amount: number;
    upiLink: string;
    payeeVpa: string;
    payeeName: string;
    doctorName: string;
    planName: string;
    cropName?: string;
  } | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Set initial crop selection on show
  React.useEffect(() => {
    if (visible) {
      setStatusMessage(null);
      setActivatedNotice(null);
      setUpiCheckoutData(null);
      setUtrInput('');
      setCopiedVpa(false);
      if (initialCropId) {
        setSelectedCropId(initialCropId);
      } else if (realCropsList.length > 0) {
        // Pick first unassigned crop by default
        const unassigned = realCropsList.find(
          (c) => !c.assignedAdvisorId && !c.assignedAdvisor && c.advisorReviewStatus !== 'ACCEPTED',
        );
        setSelectedCropId(unassigned?.id ?? realCropsList[0]?.id ?? null);
      }
    }
  }, [visible, initialCropId, realCropsList]);

  // Selected Crop Object
  const selectedCrop = useMemo(() => {
    if (!selectedCropId) return null;
    return realCropsList.find((c) => c.id === selectedCropId) ?? null;
  }, [selectedCropId, realCropsList]);

  // Filter Doctors Matching Selected Crop
  const matchingCropDoctors = useMemo(() => {
    const list = Array.isArray(availableAdvisors) ? availableAdvisors : [];
    if (!selectedCrop) return list;
    return list.filter((advisor) => {
      const specializedCrops = Array.isArray(advisor.specializedCrops) ? advisor.specializedCrops : [];
      const specializedCats = Array.isArray(advisor.specializedCategories) ? advisor.specializedCategories : [];

      // Check "All Crops" indicator
      const isAllCrops =
        specializedCrops.length === 0 ||
        specializedCrops.some((sc) => {
          const up = String(sc).toUpperCase().trim();
          return up === 'ALL' || up === 'ALL_CROPS' || up === 'ALL CROPS' || up.includes('ALL CROP');
        });
      if (isAllCrops) return true;

      // Category match
      let catMatch = false;
      if (specializedCats.length > 0 && selectedCrop.category) {
        catMatch = specializedCats.includes(selectedCrop.category);
      }

      // Crop name match
      let nameMatch = false;
      if (specializedCrops.length > 0 && selectedCrop.cropName) {
        const cLower = selectedCrop.cropName.toLowerCase();
        nameMatch = specializedCrops.some(
          (sc) => sc.toLowerCase().includes(cLower) || cLower.includes(sc.toLowerCase()),
        );
      }

      return catMatch || nameMatch;
    });
  }, [selectedCrop, availableAdvisors]);

  // Currently Selected Advisor Object
  const selectedAdv = useMemo(() => {
    const list = Array.isArray(availableAdvisors) ? availableAdvisors : [];
    if (!selectedAdvisorId) {
      if (consultationMode === 'CROP_WISE') {
        return matchingCropDoctors[0] ?? list[0] ?? null;
      }
      return list[0] ?? null;
    }
    return list.find((a) => a.id === selectedAdvisorId) ?? null;
  }, [selectedAdvisorId, matchingCropDoctors, availableAdvisors, consultationMode]);

  const isSeniorDoctor = (selectedAdv?.role as any) === 'DOCTOR' || !!(selectedAdv as any)?.isSeniorDoctor;

  // Active Advisor check (for renewal & credit adjustment)
  const isSelectedDoctorAlreadyActive = Boolean(
    myAdvisor && selectedAdv && myAdvisor.advisor?.id === selectedAdv.id,
  );

  // Pricing Calculations (Doctor Fee + 10% Platform & Cloud Fee + 19% Statutory GST)
  const pricingData = useMemo(() => {
    // Check if this crop can be adopted 100% free under the active doctor's monthly included quota
    const isIncludedInActivePlan = Boolean(
      consultationMode === 'CROP_WISE' &&
      activeDoctorInfo &&
      activeDoctorInfo.freeSlotsRemaining > 0 &&
      selectedAdv?.id === activeDoctorInfo.doctor.id &&
      selectedCropId &&
      !(realCropsList.find((c) => c.id === selectedCropId)?.advisorReviewStatus === 'ACCEPTED'),
    );

    if (isIncludedInActivePlan) {
      return {
        doctorFee: 0,
        platformFee: 0,
        taxableAmount: 0,
        gstAmount: 0,
        netPayable: 0,
        totalPayable: 0,
        isFree: true,
        isIncludedInActivePlan: true,
        billingPeriodDays: 120,
        unusedCredit: 0,
      };
    }

    let baseDoctorFee = 0;
    let billingPeriodDays = 30;

    if (consultationMode === 'CROP_WISE') {
      const feeConsultation = parsePlanFee(selectedAdv?.feePerConsultation, 99);
      const feeSeason = parsePlanFee(selectedAdv?.feePerCropSeason, 499);

      baseDoctorFee = selectedCropPackage === 'PRESCRIPTION' ? feeConsultation : feeSeason;
      billingPeriodDays = selectedCropPackage === 'PRESCRIPTION' ? 30 : 120;
    } else {
      // Monthly VIP Retainer Mode
      const baseMonthly = parsePlanFee(selectedAdv?.feeVipMonthly, 1999);

      const discountFactor =
        monthlyDuration === 1 ? 1 : monthlyDuration === 3 ? 0.95 : monthlyDuration === 6 ? 0.9 : 0.8;
      baseDoctorFee = Math.round(baseMonthly * monthlyDuration * discountFactor);
      billingPeriodDays =
        monthlyDuration === 1 ? 30 : monthlyDuration === 3 ? 90 : monthlyDuration === 6 ? 180 : 365;
    }

    // Prorated Unused Credit Adjustment from active smaller plan
    let unusedCredit = 0;
    if (consultationMode === 'MONTHLY_VIP' && subscription?.endDate) {
      const now = new Date();
      const end = new Date(subscription.endDate);
      if (end.getTime() > now.getTime()) {
        const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        const baseMonthly = parsePlanFee(selectedAdv?.feeVipMonthly, 1999);
        const dailyRate = baseMonthly / 30;
        unusedCredit = Math.round(Math.min(baseDoctorFee, daysRemaining * dailyRate));
      }
    }

    const adjustedDoctorFee = Math.max(0, baseDoctorFee - unusedCredit);

    if (adjustedDoctorFee === 0) {
      return {
        doctorFee: 0,
        platformFee: 0,
        taxableAmount: 0,
        gstAmount: 0,
        netPayable: 0,
        totalPayable: 0,
        isFree: true,
        isIncludedInActivePlan: false,
        billingPeriodDays,
        unusedCredit,
      };
    }

    // 1. Doctor Advisory Fee
    const doctorFee = adjustedDoctorFee;

    // 2. Platform & Secure Cloud Infrastructure Fee (10% of Doctor Fee, min ₹10)
    const platformFee = Math.max(10, Math.round(doctorFee * 0.10));

    // 3. Taxable Subtotal = Doctor Fee + Platform Fee
    const taxableAmount = doctorFee + platformFee;

    // 4. Statutory 18% GST (Govt. Compliance Tax)
    const gstAmount = Math.round((taxableAmount * 18) / 100);

    // 5. Total Payable Amount
    const totalPayable = taxableAmount + gstAmount;

    return {
      doctorFee,
      platformFee,
      taxableAmount,
      gstAmount,
      netPayable: totalPayable,
      totalPayable,
      isFree: totalPayable === 0,
      isIncludedInActivePlan: false,
      billingPeriodDays,
      unusedCredit,
    };
  }, [
    consultationMode,
    selectedAdv,
    selectedCropPackage,
    monthlyDuration,
    subscription,
    activeDoctorInfo,
    selectedCropId,
    myCrops,
  ]);

  // Handler: Free Consultation Direct Activation (No Payment Gateway needed)
  const handleFreeActivation = async () => {
    if (!selectedAdv) {
      setStatusMessage('⚠️ Please select a doctor first.');
      return;
    }
    if (selectedCropId) {
      try {
        const galleryCheck = await validateCropGalleryCompleteness(selectedCropId, (selectedCrop as any)?.gpsData);
        if (!galleryCheck.isComplete) {
          const msg = `⚠️ Crop Gallery Incomplete\n\nTo adopt a certified Crop Doctor, your crop must have complete current cycle media records:\n\n• ${galleryCheck.missingItems.join('\n• ')}\n\nPlease upload these in Crop Gallery first before adopting.`;
          setStatusMessage(msg);
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Crop Gallery Incomplete', msg);
          return;
        }
      } catch {
        // proceed
      }
    }
    tap();
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      if (selectedCropId) {
        await submitCrop.mutateAsync({
          id: selectedCropId,
          payload: { advisorId: selectedAdv.id, hiringModel: 'PER_CROP' },
        });
      } else {
        await chooseAdvisorMutation.mutateAsync({
          advisorId: selectedAdv.id,
          cropId: selectedCropId ?? undefined,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['crops'] });
      queryClient.invalidateQueries({ queryKey: ['my-crops'] });

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 120);

      setActivatedNotice({
        doctorName: selectedAdv.name,
        cropName: selectedCrop?.cropName,
        packageName: pricingData.isIncludedInActivePlan
          ? `Free Adoption under Active Monthly Plan (${activeDoctorInfo?.freeSlotsRemaining ?? 1} slot used)`
          : 'Free Introductory SOS Consultation',
        validUntil:
          activeDoctorInfo?.formattedExpiry ??
          expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        isFree: true,
      });
    } catch (err: any) {
      setStatusMessage(`❌ ${err?.response?.data?.message || 'Could not activate free adoption.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Paid Consultation (PhonePe / Cashfree / Online Payment Gateway / UPI Direct)
  const handleProceedToPayment = async () => {
    if (pricingData.isFree || pricingData.netPayable === 0) {
      handleFreeActivation();
      return;
    }
    if (!selectedAdv) {
      setStatusMessage('⚠️ Please select a doctor first.');
      return;
    }
    if (selectedCropId) {
      try {
        const galleryCheck = await validateCropGalleryCompleteness(selectedCropId, (selectedCrop as any)?.gpsData);
        if (!galleryCheck.isComplete) {
          const msg = `⚠️ Crop Gallery Incomplete\n\nTo adopt a certified Crop Doctor, your crop must have complete current cycle media records:\n\n• ${galleryCheck.missingItems.join('\n• ')}\n\nPlease upload these in Crop Gallery first before adopting.`;
          setStatusMessage(msg);
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Crop Gallery Incomplete', msg);
          return;
        }
      } catch {
        // proceed
      }
    }
    tap();
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await initiatePayment.mutateAsync({
        targetPlan: 'GOLD',
        billingPeriodDays: pricingData.billingPeriodDays,
        selectedDoctorId: isSeniorDoctor ? selectedAdv.id : undefined,
        selectedAdvisorId: !isSeniorDoctor ? selectedAdv.id : undefined,
        doctorKingId: isSeniorDoctor ? (selectedAdv.kingId ?? undefined) : undefined,
        advisorKingId: !isSeniorDoctor ? (selectedAdv.kingId ?? undefined) : undefined,
        cropCycleId: selectedCropId ?? undefined,
        customAmount: pricingData.totalPayable,
      });

      const targetGatewayUrl =
        (res as any)?.paymentLink ||
        (res as any)?.phonepeRedirectUrl ||
        (res as any)?.cashfreePaymentLink ||
        (res.cashfreeSessionId ? `https://payments.cashfree.com/order/#${res.cashfreeSessionId}` : null) ||
        (res as any)?.razorpayShortUrl;

      // 1. Direct Online Payment Gateway (PhonePe Checkout / Cashfree Portal - ONLY if valid HTTP/HTTPS URL)
      const isHttpGateway =
        typeof targetGatewayUrl === 'string' &&
        (targetGatewayUrl.startsWith('https://') || targetGatewayUrl.startsWith('http://'));
      if (isHttpGateway) {
        if (Platform.OS === 'web') {
          window.location.href = targetGatewayUrl;
        } else {
          await Linking.openURL(targetGatewayUrl);
        }
        return;
      }

      // 2. Direct UPI / QR Code Flow (NEVER open empty new tab with upi:// on PC Web)
      if (res.upiLink) {
        const vpa = (res as any)?.payeeVpa || (appSettings as any)?.upiId || 'surindersinghmakhu-8@okicici';
        const payee = (appSettings as any)?.upiPayeeName || 'FarmsKing India';
        const packageName =
          consultationMode === 'CROP_WISE'
            ? `${selectedCropPackage === 'PRESCRIPTION' ? 'Single Consultation' : 'Full Season Crop Care'} (${selectedCrop?.cropName || 'Crop'})`
            : `${monthlyDuration} Month(s) Farm VIP Retainer`;

        setUpiCheckoutData({
          id: res.id,
          amount: pricingData.totalPayable,
          upiLink: res.upiLink,
          payeeVpa: vpa,
          payeeName: payee,
          doctorName: selectedAdv.name,
          planName: packageName,
          cropName: selectedCrop?.cropName,
        });
      } else {
        setStatusMessage('⚠️ Payment gateway initialized. Please complete payment to activate.');
      }
    } catch (err: any) {
      setStatusMessage(`❌ ${err?.response?.data?.message || 'Could not initiate payment gateway.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Copy UPI ID
  const handleCopyVpa = () => {
    tap();
    if (!upiCheckoutData) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiCheckoutData.payeeVpa);
    }
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  // Handler: Submit UTR for Instant Activation
  const handleSubmitUtr = async () => {
    if (!upiCheckoutData) return;
    if (!utrInput.trim()) {
      setStatusMessage('⚠️ Please enter the 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }
    tap();
    setIsSubmittingUtr(true);
    setStatusMessage(null);
    try {
      await submitPayment.mutateAsync({
        id: upiCheckoutData.id,
        utr: utrInput.trim(),
      });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['farmerPlan'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-plan-payments'] });
      queryClient.invalidateQueries({ queryKey: ['my-crops'] });

      setActivatedNotice({
        doctorName: upiCheckoutData.doctorName,
        cropName: upiCheckoutData.cropName,
        packageName: upiCheckoutData.planName,
        validUntil: 'Active · Doctor Assigned Successfully',
      });
      setUpiCheckoutData(null);
      setUtrInput('');
    } catch (err: any) {
      setStatusMessage(`❌ ${err?.response?.data?.message || 'Could not submit payment verification. Please check the UTR number.'}`);
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  // Handler: Coupon Check & Apply
  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) {
      setCouponStatus('⚠️ Please enter a Crop Care coupon code.');
      return;
    }
    tap();
    const code = couponInput.trim().toUpperCase();
    setIsPreviewLoading(true);
    setCouponStatus(null);
    try {
      const data = await previewFarmerPlanCoupon(code);
      setPreviewData(data);
    } catch (err: any) {
      setCouponStatus(`❌ ${err?.response?.data?.message || 'Invalid or expired coupon code.'}`);
      setPreviewData(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmRedeem = async () => {
    if (!previewData) return;
    tap();
    setIsProcessing(true);
    try {
      const res = await redeemCoupon.mutateAsync({
        code: previewData.code,
        advisorId: selectedAdv?.id,
      });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['crops'] });

      setActivatedNotice({
        doctorName: selectedAdv?.name || 'Assigned Specialist',
        cropName: selectedCrop?.cropName,
        packageName: `${previewData.plan} VIP Pass Scheme`,
        validUntil: new Date(res.newEndDate).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      });
      setPreviewData(null);
      setCouponInput('');
    } catch (err: any) {
      setStatusMessage(`❌ ${err?.response?.data?.message || 'Failed to redeem coupon.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          {/* Header Banner */}
          <LinearGradient
            colors={['#064e3b', '#065f46', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerHeader}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.bannerTitle}>Crop Doctor Care</Text>
              <Text style={styles.bannerSub}>1-on-1 Certified Agronomist Consultation</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* Success Activated Screen */}
          {activatedNotice ? (
            <ScrollView contentContainerStyle={{ padding: 20, gap: 14, alignItems: 'center' }}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-circle" size={44} color="#16a34a" />
              </View>
              <Text style={[styles.successTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                {activatedNotice.isFree ? '🎉 Free Consultation Activated!' : '🎉 Consultation Plan Active!'}
              </Text>
              <Text style={[styles.successDesc, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                Your Crop Doctor <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>Dr. {activatedNotice.doctorName}</Text>{' '}
                is now successfully assigned{activatedNotice.cropName ? ` to your ${activatedNotice.cropName} crop` : ''}.
              </Text>

              <View style={[styles.summaryBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Package:</Text>
                  <Text style={[styles.summaryVal, { color: isDark ? '#ffffff' : '#0f172a' }]}>{activatedNotice.packageName}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Valid Until:</Text>
                  <Text style={[styles.summaryVal, { color: '#16a34a' }]}>{activatedNotice.validUntil}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Direct Calling & Chat:</Text>
                  <Text style={[styles.summaryVal, { color: '#0284c7' }]}>✓ Unlocked</Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primarySubmitBtn, { backgroundColor: '#16a34a' }]}
                onPress={() => {
                  onClose();
                  router.push('/(partner)/(tabs)/farmers' as any);
                }}
              >
                <Ionicons name="chatbubble-ellipses" size={16} color="#ffffff" />
                <Text style={styles.primarySubmitBtnText}>Start Doctor Consultation</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : upiCheckoutData ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, gap: 14 }}>
              {/* Back to Selection */}
              <TouchableOpacity
                style={styles.backBtnRow}
                onPress={() => {
                  tap();
                  setUpiCheckoutData(null);
                  setStatusMessage(null);
                }}
              >
                <Ionicons name="arrow-back" size={16} color="#0284c7" />
                <Text style={styles.backBtnText}>Change Doctor or Package</Text>
              </TouchableOpacity>

              {/* Verified Trust Strip */}
              <View style={styles.trustStripBox}>
                <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trustStripTitle}>Official UPI Direct Payment Gateway</Text>
                  <Text style={styles.trustStripSub}>FARMSKING TECHNOLOGIES PRIVATE LIMITED · 0% Additional Fee</Text>
                </View>
              </View>

              {/* Amount Card */}
              <View style={[styles.checkoutSummaryCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Text style={styles.checkoutSummaryLabel}>Total Amount Payable:</Text>
                  <Text style={styles.checkoutSummaryAmount}>₹{upiCheckoutData.amount.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.checkoutSummarySub}>
                  Assigned: Dr. {upiCheckoutData.doctorName} · {upiCheckoutData.planName}
                </Text>
              </View>

              {/* Step 1: QR Code Card */}
              <View style={styles.qrCodeContainer}>
                <Text style={styles.qrHeaderTitle}>Step 1: Scan QR Code with Any UPI App</Text>
                <Text style={styles.qrHeaderSub}>Google Pay · PhonePe · Paytm · BHIM · Amazon Pay · Mobile Banking</Text>
                <View style={styles.qrImageWrapper}>
                  <Image
                    source={{
                      uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&ecc=H&data=${encodeURIComponent(upiCheckoutData.upiLink)}`,
                    }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>

                {/* VPA Copy Pill */}
                <View style={styles.vpaPillRow}>
                  <Text style={styles.vpaLabel}>UPI ID:</Text>
                  <Text style={styles.vpaValue}>{upiCheckoutData.payeeVpa}</Text>
                  <TouchableOpacity style={styles.copyVpaBtn} onPress={handleCopyVpa}>
                    <Ionicons name={copiedVpa ? 'checkmark' : 'copy-outline'} size={13} color="#ffffff" />
                    <Text style={styles.copyVpaBtnText}>{copiedVpa ? 'Copied!' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Mobile Direct App Intent (Only on native mobile) */}
              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={styles.openUpiAppBtn}
                  onPress={() => {
                    tap();
                    Linking.openURL(upiCheckoutData.upiLink).catch(() => {
                      Alert.alert('Notice', 'No UPI app found on this device. Please scan the QR code above.');
                    });
                  }}
                >
                  <Ionicons name="flash" size={16} color="#ffffff" />
                  <Text style={styles.openUpiAppBtnText}>Open UPI App on Phone</Text>
                </TouchableOpacity>
              )}

              {/* Step 2: UTR Reference Submission */}
              <View style={[styles.utrStepBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#cbd5e1' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={[styles.utrStepTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    Enter 12-Digit UPI Transaction / UTR Number
                  </Text>
                </View>
                <Text style={styles.utrStepDesc}>
                  After paying in your UPI app, find the 12-digit UTR on your receipt and enter it below to activate:
                </Text>
                <TextInput
                  style={[styles.utrInput, { backgroundColor: isDark ? '#0f172a' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? '#475569' : '#cbd5e1' }]}
                  placeholder="e.g. 431289567812"
                  placeholderTextColor="#94a3b8"
                  value={utrInput}
                  onChangeText={setUtrInput}
                  keyboardType="number-pad"
                  maxLength={22}
                />
                {statusMessage && (
                  <Text style={[styles.statusMsgText, { color: statusMessage.startsWith('❌') ? '#dc2626' : '#16a34a' }]}>
                    {statusMessage}
                  </Text>
                )}
                <TouchableOpacity
                  style={[styles.primarySubmitBtn, { backgroundColor: '#16a34a' }]}
                  disabled={isSubmittingUtr}
                  onPress={handleSubmitUtr}
                >
                  {isSubmittingUtr ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-done" size={18} color="#ffffff" />
                      <Text style={styles.primarySubmitBtnText}>Verify & Activate Plan</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, gap: 10 }}>
              {/* ─── ACTIVE DOCTOR STRIP ───────────────── */}
              {activeDoctorInfo && (
                <View
                  style={[
                    styles.activePlanHeroCard,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f0fdf4',
                      borderColor: isDark ? 'rgba(34, 197, 94, 0.4)' : '#86efac',
                    },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Image
                        source={{
                          uri:
                            resolveMediaUrl(activeDoctorInfo.doctor.photoUrl) ||
                            FALLBACK_ADVISOR.avatarUrl,
                        }}
                        style={styles.activeHeroAvatar}
                      />
                      <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <Text style={[styles.activeHeroName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                            Dr. {activeDoctorInfo.doctor.name}
                          </Text>
                          <View style={styles.activeHeroBadge}>
                            <Text style={styles.activeHeroBadgeText}>Active Doctor</Text>
                          </View>
                        </View>
                        <Text style={styles.activeHeroSpec}>
                          {activeDoctorInfo.freeSlotsRemaining > 0
                            ? `🎁 ${activeDoctorInfo.freeSlotsRemaining} Free Crop Slot(s) Available`
                            : `Quota Full (${activeDoctorInfo.maxIncluded}/${activeDoctorInfo.maxIncluded})`}
                        </Text>
                      </View>
                    </View>
                    {activeDoctorInfo.formattedExpiry && (
                      <View style={styles.expiryBadge}>
                        <Text style={styles.expiryBadgeText}>
                          {activeDoctorInfo.diffDays !== null && activeDoctorInfo.diffDays > 0
                            ? `${activeDoctorInfo.diffDays}d left`
                            : 'Active'}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* ─── TWO CONSULTATION TABS ─────────────────────────── */}
              <View style={styles.tabSwitchContainer}>
                <TouchableOpacity
                  style={[styles.tabSwitchBtn, consultationMode === 'CROP_WISE' && styles.tabSwitchBtnActive]}
                  onPress={() => {
                    tap();
                    setConsultationMode('CROP_WISE');
                  }}
                >
                  <Ionicons
                    name="leaf"
                    size={13}
                    color={consultationMode === 'CROP_WISE' ? '#ffffff' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.tabSwitchBtnText,
                      consultationMode === 'CROP_WISE' && styles.tabSwitchBtnTextActive,
                    ]}
                  >
                    Pay Per Crop
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.tabSwitchBtn, consultationMode === 'MONTHLY_VIP' && styles.tabSwitchBtnActive]}
                  onPress={() => {
                    tap();
                    setConsultationMode('MONTHLY_VIP');
                  }}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={13}
                    color={consultationMode === 'MONTHLY_VIP' ? '#ffffff' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.tabSwitchBtnText,
                      consultationMode === 'MONTHLY_VIP' && styles.tabSwitchBtnTextActive,
                    ]}
                  >
                    Monthly Farm VIP
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ═══════════════════════════════════════════════════════
                  MODE 1: CROP-WISE CARE
                  ═══════════════════════════════════════════════════════ */}
              {consultationMode === 'CROP_WISE' ? (
                <View style={{ gap: 10 }}>
                  {/* STEP 1: SELECT CROP */}
                  <View style={{ gap: 6 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        1. Select Crop:
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                        {myCrops.length} Registered
                      </Text>
                    </View>

                    {isLoadingCrops ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : myCrops.length === 0 ? (
                      <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                        <Text style={[styles.emptyNoticeText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                          No crops registered. Proceeding with General Consultation.
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 4 }}>
                        {myCrops.map((crop) => {
                          const isAssigned =
                            Boolean(crop.assignedAdvisorId) ||
                            Boolean(crop.assignedAdvisor) ||
                            crop.advisorReviewStatus === 'ACCEPTED';
                          const isSelected = selectedCropId === crop.id;
                          const isEligibleForActiveFreeSlot =
                            !isAssigned && activeDoctorInfo && activeDoctorInfo.freeSlotsRemaining > 0;

                          return (
                            <TouchableOpacity
                              key={crop.id}
                              disabled={isAssigned}
                              style={[
                                styles.cropCardRow,
                                isAssigned && styles.cropCardRowDisabled,
                                isSelected && !isAssigned && styles.cropCardRowActive,
                                {
                                  backgroundColor: isDark
                                    ? isSelected
                                      ? 'rgba(22, 163, 74, 0.15)'
                                      : 'rgba(255, 255, 255, 0.03)'
                                    : isSelected
                                    ? '#f0fdf4'
                                    : '#ffffff',
                                },
                              ]}
                              onPress={() => {
                                tap();
                                setSelectedCropId(crop.id);
                                if (isEligibleForActiveFreeSlot && activeDoctorInfo) {
                                  setSelectedAdvisorId(activeDoctorInfo.doctor.id);
                                }
                              }}
                            >
                              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text
                                  style={[
                                    styles.cropCardTitle,
                                    { color: isAssigned ? '#94a3b8' : isDark ? '#ffffff' : '#0f172a' },
                                  ]}
                                >
                                  🌾 {crop.cropName} {crop.variety ? `(${crop.variety})` : ''}
                                </Text>
                                {crop.area ? (
                                  <Text style={styles.cropCardSub}>· {crop.area} {crop.unit || 'Acre'}</Text>
                                ) : null}
                                {isAssigned ? (
                                  <View style={styles.assignedGuardBadge}>
                                    <Text style={styles.assignedGuardText}>Active: Dr. {crop.assignedAdvisor?.name || 'Doctor'}</Text>
                                  </View>
                                ) : isEligibleForActiveFreeSlot ? (
                                  <View style={styles.freeSlotEligibleBadge}>
                                    <Text style={styles.freeSlotEligibleText}>🎁 Free Slot</Text>
                                  </View>
                                ) : null}
                              </View>

                              {!isAssigned && (
                                <Ionicons
                                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                  size={18}
                                  color={isSelected ? '#16a34a' : '#cbd5e1'}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* STEP 2: RELATED DOCTORS */}
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      2. Choose Doctor:
                    </Text>

                    {isLoadingAdvisors ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : matchingCropDoctors.length === 0 ? (
                      <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                        <Text style={[styles.emptyNoticeText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                          No specialist found for this crop. Showing all available doctors.
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 5 }}>
                        {matchingCropDoctors.map((advisor) => {
                          const isSelected = selectedAdv?.id === advisor.id;
                          const isCropAssignedToThisDoctor = selectedCrop?.assignedAdvisorId === advisor.id;
                          const isCurrentlyMyActiveDoctor = activeDoctorInfo?.doctor?.id === advisor.id;
                          const canAdoptFree = Boolean(
                            isCurrentlyMyActiveDoctor &&
                              activeDoctorInfo &&
                              activeDoctorInfo.freeSlotsRemaining > 0 &&
                              !isCropAssignedToThisDoctor,
                          );
                          const isFreeConsult = isExplicitlyFree(advisor.feePerConsultation);
                          const feeSeason = parsePlanFee(advisor.feePerCropSeason, 499);

                          return (
                            <TouchableOpacity
                              key={advisor.id}
                              disabled={isCropAssignedToThisDoctor}
                              style={[
                                styles.doctorCardRow,
                                isCropAssignedToThisDoctor && { opacity: 0.55 },
                                isSelected && !isCropAssignedToThisDoctor && styles.doctorCardRowActive,
                                {
                                  backgroundColor: isDark
                                    ? isSelected
                                      ? 'rgba(2, 132, 199, 0.15)'
                                      : 'rgba(255, 255, 255, 0.03)'
                                    : isSelected
                                    ? '#f0f9ff'
                                    : '#ffffff',
                                },
                              ]}
                              onPress={() => {
                                tap();
                                setSelectedAdvisorId(advisor.id);
                              }}
                            >
                              <View style={styles.doctorAvatarBox}>
                                <Ionicons
                                  name={(advisor.role as any) === 'DOCTOR' || advisor.isSeniorDoctor ? 'medkit' : 'person'}
                                  size={16}
                                  color="#0284c7"
                                />
                              </View>

                              <View style={{ flex: 1 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <Text style={[styles.doctorName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                                    Dr. {advisor.name}
                                  </Text>
                                  {isCurrentlyMyActiveDoctor ? (
                                    <View style={styles.activeDoctorBadge}>
                                      <Text style={styles.activeDoctorBadgeText}>Active Doctor</Text>
                                    </View>
                                  ) : canAdoptFree ? (
                                    <View style={styles.freeAdoptionBadge}>
                                      <Text style={styles.freeAdoptionBadgeText}>Free Slot</Text>
                                    </View>
                                  ) : null}
                                </View>
                                <Text style={styles.doctorSpecText} numberOfLines={1}>
                                  {advisor.specialization || 'Agronomy Specialist'} · {advisor.yearsExperience || 5}+ yrs exp · {canAdoptFree || isFreeConsult ? '₹0 Free' : `₹${feeSeason}/season`}
                                </Text>
                              </View>

                              {!isCropAssignedToThisDoctor && (
                                <Ionicons
                                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                  size={18}
                                  color={isSelected ? '#0284c7' : '#cbd5e1'}
                                />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* STEP 3: SELECT PACKAGE OR FREE ADOPTION */}
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      3. Choose Package:
                    </Text>

                    {pricingData.isIncludedInActivePlan ? (
                      <View
                        style={[
                          styles.freePlanHeroBanner,
                          {
                            backgroundColor: isDark ? 'rgba(22, 163, 74, 0.15)' : '#f0fdf4',
                            borderColor: isDark ? 'rgba(74, 222, 128, 0.3)' : '#86efac',
                          },
                        ]}
                      >
                        <Ionicons name="gift" size={20} color="#16a34a" />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.freePlanHeroTitle, { color: isDark ? '#ffffff' : '#15803d' }]}>
                            Free Adoption (₹0 Payment)
                          </Text>
                          <Text style={[styles.freePlanHeroSub, { color: isDark ? '#cbd5e1' : '#166534' }]}>
                            Covered under Dr. {selectedAdv?.name}'s active plan quota.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <View style={{ gap: 6 }}>
                          {/* Active Plan Hierarchy Guards */}
                          {(() => {
                            const cropHiringModel = (selectedCrop as any)?.hiringModel;
                            const isSeasonPlanRunning = cropHiringModel === 'PER_CROP';
                            const isSosPlanRunning = cropHiringModel === 'PAY_PER_CONSULTATION';
                            const isDoctorMonthlyActive = Boolean(activeDoctorInfo && selectedAdv?.id === activeDoctorInfo.doctor.id);

                            const isPrescriptionDisabled = isSeasonPlanRunning || isSosPlanRunning || isDoctorMonthlyActive;
                            const isSeasonDisabled = isSeasonPlanRunning || isDoctorMonthlyActive;

                            return (
                              <>
                                {isDoctorMonthlyActive ? (
                                  <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#e0f2fe', borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#bae6fd', marginBottom: 4 }]}>
                                    <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: isDark ? '#bae6fd' : '#0369a1', lineHeight: 16 }}>
                                      ℹ️ Active Monthly VIP Care running with Dr. {selectedAdv?.name}. Lower tier plans are closed. Please use your monthly included slot or monthly add-on.
                                    </Text>
                                  </View>
                                ) : isSeasonPlanRunning ? (
                                  <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#dcfce7', borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0', marginBottom: 4 }]}>
                                    <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: isDark ? '#86efac' : '#15803d', lineHeight: 16 }}>
                                      ℹ️ Full Season Care (120 Days) is currently active on this crop. Lower-tier SOS is closed. You can upgrade to Monthly Farm VIP Care.
                                    </Text>
                                  </View>
                                ) : null}

                                {/* Package 1: Single Prescription */}
                                <TouchableOpacity
                                  style={[
                                    styles.packageCard,
                                    selectedCropPackage === 'PRESCRIPTION' && styles.packageCardSelected,
                                    isPrescriptionDisabled && { opacity: 0.45 },
                                    {
                                      backgroundColor: isDark
                                        ? selectedCropPackage === 'PRESCRIPTION'
                                          ? 'rgba(56, 189, 248, 0.12)'
                                          : 'rgba(255, 255, 255, 0.03)'
                                        : selectedCropPackage === 'PRESCRIPTION'
                                        ? '#f0f9ff'
                                        : '#ffffff',
                                    },
                                  ]}
                                  disabled={isPrescriptionDisabled}
                                  onPress={() => {
                                    tap();
                                    setSelectedCropPackage('PRESCRIPTION');
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.packageTitle, { color: '#0284c7' }]}>Pay Per Prescription</Text>
                                        <View style={[styles.badgePill, { backgroundColor: isPrescriptionDisabled ? 'rgba(239, 68, 68, 0.15)' : '#e0f2fe' }]}>
                                          <Text style={[styles.badgePillText, { color: isPrescriptionDisabled ? '#ef4444' : '#0369a1' }]}>
                                            {isPrescriptionDisabled ? 'CLOSED' : 'Instant SOS'}
                                          </Text>
                                        </View>
                                      </View>
                                      <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                        {isPrescriptionDisabled ? 'Higher tier plan active or already used' : '1-time photo diagnosis & spray prescription'}
                                      </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                      <Ionicons
                                        name={selectedCropPackage === 'PRESCRIPTION' ? 'radio-button-on' : 'radio-button-off'}
                                        size={18}
                                        color={selectedCropPackage === 'PRESCRIPTION' ? '#0284c7' : '#94a3b8'}
                                      />
                                      <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                                        {isExplicitlyFree(selectedAdv?.feePerConsultation)
                                          ? '₹0 (FREE)'
                                          : `₹${parsePlanFee(selectedAdv?.feePerConsultation, 99)}`}
                                      </Text>
                                    </View>
                                  </View>
                                </TouchableOpacity>

                                {/* Package 2: Full Crop Season Care */}
                                <TouchableOpacity
                                  style={[
                                    styles.packageCard,
                                    selectedCropPackage === 'SEASON' && [styles.packageCardSelected, { borderColor: '#10b981' }],
                                    isSeasonDisabled && { opacity: 0.45 },
                                    {
                                      backgroundColor: isDark
                                        ? selectedCropPackage === 'SEASON'
                                          ? 'rgba(16, 185, 129, 0.14)'
                                          : 'rgba(255, 255, 255, 0.03)'
                                        : selectedCropPackage === 'SEASON'
                                        ? '#f0fdf4'
                                        : '#ffffff',
                                    },
                                  ]}
                                  disabled={isSeasonDisabled}
                                  onPress={() => {
                                    tap();
                                    setSelectedCropPackage('SEASON');
                                  }}
                                >
                                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <View style={{ flex: 1 }}>
                                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Text style={[styles.packageTitle, { color: '#16a34a' }]}>Full Season Care (120 Days)</Text>
                                        <View style={[styles.badgePill, { backgroundColor: isSeasonDisabled ? 'rgba(245, 158, 11, 0.15)' : '#dcfce7' }]}>
                                          <Text style={[styles.badgePillText, { color: isSeasonDisabled ? '#d97706' : '#15803d' }]}>
                                            {isSeasonDisabled ? 'ACTIVE' : 'RECOMMENDED'}
                                          </Text>
                                        </View>
                                      </View>
                                      <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                                        {isSeasonDisabled ? 'Season plan currently running on this crop' : 'Full seed-to-harvest spray calendar & monitoring'}
                                      </Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end', gap: 2 }}>
                                      <Ionicons
                                        name={selectedCropPackage === 'SEASON' ? 'radio-button-on' : 'radio-button-off'}
                                        size={18}
                                        color={selectedCropPackage === 'SEASON' ? '#16a34a' : '#94a3b8'}
                                      />
                                      <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                                        {isExplicitlyFree(selectedAdv?.feePerCropSeason)
                                          ? '₹0 (FREE)'
                                          : `₹${parsePlanFee(selectedAdv?.feePerCropSeason, 499)}`}
                                      </Text>
                                    </View>
                                  </View>
                                </TouchableOpacity>
                              </>
                            );
                          })()}
                        </View>

                        {/* Bill Breakdown */}
                        <View
                          style={[
                            styles.priceBreakdownCard,
                            {
                              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                              borderColor: isDark ? '#334155' : '#e2e8f0',
                            },
                          ]}
                        >
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Doctor Fee:</Text>
                            <Text style={[styles.breakdownValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                              ₹{pricingData.doctorFee}
                            </Text>
                          </View>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>Platform Fee (10%):</Text>
                            <Text style={[styles.breakdownValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                              +₹{pricingData.platformFee}
                            </Text>
                          </View>
                          <View style={styles.breakdownRow}>
                            <Text style={styles.breakdownLabel}>GST (18%):</Text>
                            <Text style={[styles.breakdownValue, { color: '#0284c7' }]}>
                              +₹{pricingData.gstAmount}
                            </Text>
                          </View>
                          <View style={[styles.breakdownDividerBold, { backgroundColor: isDark ? '#475569' : '#cbd5e1' }]} />
                          <View style={styles.breakdownRow}>
                            <Text style={[styles.breakdownTotalLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                              Total Payable:
                            </Text>
                            <Text style={[styles.breakdownTotalValue, { color: '#16a34a' }]}>
                              ₹{pricingData.totalPayable}
                            </Text>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                </View>
              ) : (
                /* ═══════════════════════════════════════════════════════
                   MODE 2: MONTHLY FARM VIP
                   ═══════════════════════════════════════════════════════ */
                <View style={{ gap: 10 }}>
                  {/* STEP 1: SELECT DOCTOR */}
                  <View style={{ gap: 6 }}>
                    <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      1. Select Dedicated Farm Doctor:
                    </Text>

                    <View style={{ gap: 5 }}>
                      {availableAdvisors.map((advisor) => {
                        const isSelected = selectedAdv?.id === advisor.id;
                        const isCurrentlyMyDoctor = myAdvisor?.advisor?.id === advisor.id;

                        return (
                          <TouchableOpacity
                            key={advisor.id}
                            style={[
                              styles.doctorCardRow,
                              isSelected && styles.doctorCardRowActive,
                              {
                                backgroundColor: isDark
                                  ? isSelected
                                    ? 'rgba(139, 92, 246, 0.15)'
                                    : 'rgba(255, 255, 255, 0.03)'
                                  : isSelected
                                  ? '#f5f3ff'
                                  : '#ffffff',
                              },
                            ]}
                            onPress={() => {
                              tap();
                              setSelectedAdvisorId(advisor.id);
                            }}
                          >
                            <View style={[styles.doctorAvatarBox, { backgroundColor: '#f3e8ff', borderColor: '#d8b4fe' }]}>
                              <Ionicons name="medkit" size={16} color="#7c3aed" />
                            </View>

                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text style={[styles.doctorName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                                  Dr. {advisor.name}
                                </Text>
                                {isCurrentlyMyDoctor ? (
                                  <View style={styles.activeDoctorBadge}>
                                    <Text style={styles.activeDoctorBadgeText}>Active Doctor</Text>
                                  </View>
                                ) : (
                                  <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedBadgeText}>Verified</Text>
                                  </View>
                                )}
                              </View>
                              <Text style={styles.doctorSpecText} numberOfLines={1}>
                                {advisor.specialization || 'Agronomy Specialist'} · ₹{Number(advisor.feeVipMonthly || 1999)}/mo
                              </Text>
                            </View>

                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                              size={18}
                              color={isSelected ? '#7c3aed' : '#cbd5e1'}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* STEP 2: VIP DURATION */}
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      2. Retainer Duration (Dr. {selectedAdv?.name}):
                    </Text>

                    {/* Features Strip */}
                    <View style={[styles.benefitsStrip, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#f5f3ff', borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#ddd6fe' }]}>
                      <Text style={[styles.benefitBulletText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                        ✓ Direct phone & WhatsApp support · Up to {selectedAdv?.monthlyIncludedCrops || 3} crops · Health alerts
                      </Text>
                    </View>

                    {/* Duration Selector */}
                    <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                      {[
                        { months: 1 as const, label: '1 Month', tag: 'Standard' },
                        { months: 3 as const, label: '3 Months', tag: '5% OFF' },
                        { months: 6 as const, label: '6 Months', tag: '10% OFF' },
                        { months: 12 as const, label: '12 Months', tag: '20% OFF' },
                      ].map((d) => {
                        const isDurActive = monthlyDuration === d.months;
                        const isFreeMonthly = isExplicitlyFree(selectedAdv?.feeVipMonthly);
                        const base = parsePlanFee(selectedAdv?.feeVipMonthly, 1999);
                        const factor = d.months === 1 ? 1 : d.months === 3 ? 0.95 : d.months === 6 ? 0.9 : 0.8;
                        const price = isFreeMonthly ? 0 : Math.round(base * d.months * factor);

                        return (
                          <TouchableOpacity
                            key={d.months}
                            style={[
                              styles.durationChip,
                              isDurActive && styles.durationChipActive,
                              { backgroundColor: isDurActive ? '#7c3aed' : isDark ? '#1e293b' : '#f1f5f9' },
                            ]}
                            onPress={() => {
                              tap();
                              setMonthlyDuration(d.months);
                            }}
                          >
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                              <Text style={[styles.durationChipTitle, isDurActive && { color: '#ffffff' }]}>
                                {d.label}
                              </Text>
                              <View style={[styles.chipDiscountTag, isDurActive && { backgroundColor: '#ffffff' }]}>
                                <Text style={[styles.chipDiscountTagText, isDurActive && { color: '#7c3aed' }]}>
                                  {d.tag}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.durationChipPrice, isDurActive && { color: '#ffffff' }]}>
                              {price === 0 ? '₹0 (FREE)' : `₹${price}`}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Prorated Credit Adjustment Notice */}
                    {pricingData.unusedCredit > 0 ? (
                      <View style={[styles.creditAdjustmentBox, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
                        <Ionicons name="card" size={14} color="#0284c7" />
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#0369a1' }}>
                          Prorated Plan Credit: -₹{pricingData.unusedCredit}
                        </Text>
                      </View>
                    ) : null}

                    {/* Bill Breakdown */}
                    <View
                      style={[
                        styles.priceBreakdownCard,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                          borderColor: isDark ? '#334155' : '#e2e8f0',
                        },
                      ]}
                    >
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Doctor Fee ({monthlyDuration} mo):</Text>
                        <Text style={[styles.breakdownValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          ₹{pricingData.doctorFee}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>Platform Fee (10%):</Text>
                        <Text style={[styles.breakdownValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          +₹{pricingData.platformFee}
                        </Text>
                      </View>
                      <View style={styles.breakdownRow}>
                        <Text style={styles.breakdownLabel}>GST (18%):</Text>
                        <Text style={[styles.breakdownValue, { color: '#7c3aed' }]}>
                          +₹{pricingData.gstAmount}
                        </Text>
                      </View>
                      <View style={[styles.breakdownDividerBold, { backgroundColor: isDark ? '#475569' : '#cbd5e1' }]} />
                      <View style={styles.breakdownRow}>
                        <Text style={[styles.breakdownTotalLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          Total Payable:
                        </Text>
                        <Text style={[styles.breakdownTotalValue, { color: '#16a34a' }]}>
                          ₹{pricingData.totalPayable}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Status Message */}
              {statusMessage ? (
                <Text style={[styles.statusMsgText, { color: statusMessage.startsWith('❌') ? '#ef4444' : '#10b981' }]}>
                  {statusMessage}
                </Text>
              ) : null}

              {/* ─── ACTION BUTTON: PAYMENT / FREE ACTIVATION ────────── */}
              <TouchableOpacity
                style={[
                  styles.primarySubmitBtn,
                  pricingData.isFree && { backgroundColor: '#16a34a' },
                  isProcessing && { opacity: 0.6 },
                ]}
                disabled={isProcessing}
                onPress={pricingData.isFree ? handleFreeActivation : handleProceedToPayment}
                activeOpacity={0.88}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons
                      name={pricingData.isFree ? 'gift' : 'shield-checkmark'}
                      size={17}
                      color="#ffffff"
                    />
                    <Text style={styles.primarySubmitBtnText}>
                      {pricingData.isIncludedInActivePlan
                        ? `Adopt Crop with Dr. ${selectedAdv?.name} (Free · ₹0)`
                        : pricingData.isFree
                        ? 'Activate Free Consultation (₹0)'
                        : `Proceed to Pay ₹${pricingData.totalPayable} Securely`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {/* ─── COLLAPSIBLE COUPON CODE ACCORDION ───────────────── */}
              <TouchableOpacity
                style={styles.couponToggleRow}
                onPress={() => setShowCouponInput(!showCouponInput)}
                activeOpacity={0.8}
              >
                <Ionicons name="pricetag-outline" size={14} color="#64748b" />
                <Text style={styles.couponToggleText}>
                  {showCouponInput ? 'Hide Coupon Box ▲' : 'Have a Doctor VIP Coupon Code? Tap here ▼'}
                </Text>
              </TouchableOpacity>

              {showCouponInput ? (
                <View style={[styles.couponBox, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#cbd5e1' }]}>
                  <View style={styles.couponInputRow}>
                    <TextInput
                      style={[styles.couponInputCompact, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#ffffff', color: isDark ? '#ffffff' : '#0f172a' }]}
                      placeholder="ENTER COUPON CODE"
                      placeholderTextColor="#94a3b8"
                      value={couponInput}
                      onChangeText={setCouponInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.couponApplyBtn}
                      disabled={isPreviewLoading}
                      onPress={handleApplyCoupon}
                    >
                      {isPreviewLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.couponApplyBtnText}>Apply</Text>
                      )}
                    </TouchableOpacity>
                  </View>

                  {couponStatus ? (
                    <Text style={[styles.couponNotice, { color: couponStatus.startsWith('❌') ? '#ef4444' : '#10b981' }]}>
                      {couponStatus}
                    </Text>
                  ) : null}

                  {previewData ? (
                    <View style={styles.previewCard}>
                      <Text style={styles.previewText}>
                        🎉 Valid Coupon! Grants <Text style={{ fontFamily: FONT.bold }}>{previewData.plan}</Text> Doctor Access for{' '}
                        <Text style={{ fontFamily: FONT.bold }}>{previewData.daysGranted} days</Text>.
                      </Text>
                      <TouchableOpacity
                        style={styles.redeemConfirmBtn}
                        disabled={isProcessing}
                        onPress={handleConfirmRedeem}
                      >
                        <Text style={styles.redeemConfirmBtnText}>Redeem Code & Activate</Text>
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </View>
              ) : null}
            </ScrollView>
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
    padding: SPACING.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '92%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    ...premiumShadow('#000000', 'lg'),
  },
  bannerHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  topBadgeRow: {
    display: 'none',
  },
  topBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#fef3c7',
  },
  bannerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#a7f3d0',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    padding: 3,
    gap: 4,
  },
  tabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
  },
  tabSwitchBtnActive: {
    backgroundColor: '#0f172a',
    ...premiumShadow('#0f172a', 'sm'),
  },
  tabSwitchBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  tabSwitchBtnTextActive: {
    color: '#ffffff',
  },

  sectionHeading: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  cropCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cropCardRowActive: {
    borderColor: '#16a34a',
  },
  cropCardRowDisabled: {
    opacity: 0.65,
    backgroundColor: '#f8fafc',
    borderColor: '#cbd5e1',
  },
  cropCardTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  cropCardSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  acreBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  acreBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  assignedGuardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
  },
  assignedGuardText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },

  doctorCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doctorCardRowActive: {
    borderColor: '#0284c7',
  },
  doctorAvatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  doctorName: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  verifiedBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  activeDoctorBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  activeDoctorBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  doctorSpecText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#0284c7',
    marginTop: 1,
  },
  doctorMetaSmall: {
    fontSize: 10,
    fontFamily: FONT.semiBold,
    color: '#64748b',
  },
  freeBadgePill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  freeBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#15803d',
  },

  packageCard: {
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 3,
  },
  packageCardSelected: {
    borderColor: '#0284c7',
  },
  packageTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  packageDesc: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    lineHeight: 14,
  },
  packagePrice: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
  },
  packagePriceUnit: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  badgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  badgePillText: {
    fontSize: 9,
    fontFamily: FONT.bold,
  },

  benefitsStrip: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  benefitsHeading: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  benefitBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  benefitBulletText: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },

  durationChip: {
    flex: 1,
    minWidth: 110,
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 2,
  },
  durationChipActive: {
    borderColor: '#7c3aed',
  },
  durationChipTitle: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  durationChipPrice: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  chipDiscountTag: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  chipDiscountTagText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },

  creditAdjustmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },

  primarySubmitBtn: {
    backgroundColor: '#0284c7',
    height: 42,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...premiumShadow('#0284c7', 'sm'),
  },
  primarySubmitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },

  couponToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  couponToggleText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#64748b',
  },
  couponBox: {
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 8,
  },
  couponInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  couponInputCompact: {
    flex: 1,
    height: 38,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  couponApplyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  couponNotice: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
  },
  previewCard: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 6,
  },
  previewText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#166534',
  },
  redeemConfirmBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  redeemConfirmBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },

  emptyNoticeBox: {
    padding: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyNoticeText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    textAlign: 'center',
  },

  statusMsgText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    textAlign: 'center',
  },

  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
  },
  successDesc: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
    textAlign: 'center',
    lineHeight: 18,
  },
  summaryBox: {
    width: '100%',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  summaryVal: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },

  // UPI QR Code & Direct Checkout Styles
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  trustStripBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  trustStripTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  trustStripSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#15803d',
  },
  checkoutSummaryCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 4,
  },
  checkoutSummaryLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  checkoutSummaryAmount: {
    fontSize: 22,
    fontFamily: FONT.extraBold,
    color: '#16a34a',
  },
  checkoutSummarySub: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  qrCodeContainer: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  qrHeaderTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  qrHeaderSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
  qrImageWrapper: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  qrImage: {
    width: 200,
    height: 200,
  },
  vpaPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  vpaLabel: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  vpaValue: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  copyVpaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0f172a',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  copyVpaBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  openUpiAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  openUpiAppBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  utrStepBox: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.extraBold,
  },
  utrStepTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    flex: 1,
  },
  utrStepDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    lineHeight: 16,
  },
  utrInput: {
    height: 44,
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 13.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },

  // Active Doctor Hero Summary Styles
  activePlanHeroCard: {
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    gap: 10,
  },
  activeHeroAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#16a34a',
  },
  activeHeroName: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
  },
  activeHeroBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  activeHeroBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  activeHeroSpec: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  expiryBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  expiryBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  activeQuotaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
    flexWrap: 'wrap',
    gap: 6,
  },
  activeQuotaLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  freeSlotPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  freeSlotPillText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  quotaFullPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  quotaFullPillText: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: '#64748b',
  },
  quotaUpgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderColor: 'rgba(124, 58, 237, 0.3)',
    borderWidth: 1.5,
    borderRadius: RADIUS.md,
    padding: 10,
    marginTop: 6,
    gap: 8,
  },
  quotaUpgradeTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#6d28d9',
  },
  quotaUpgradeDesc: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#475569',
    lineHeight: 14,
  },
  quotaUpgradeBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quotaUpgradeBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  cropWiseQuotaWarningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderColor: '#fde68a',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginTop: 8,
    marginBottom: 6,
    gap: 10,
  },
  cropWiseQuotaWarningTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  cropWiseQuotaWarningText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#78350f',
    lineHeight: 15,
  },
  cropWiseUpgradeBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cropWiseUpgradeBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  supervisedCropsList: {
    marginTop: 4,
    gap: 4,
  },
  supervisedTitle: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  supervisedCropPill: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  supervisedCropText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },

  // Free Slot & Adoption Badges
  freeSlotEligibleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  freeSlotEligibleText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  freeAdoptionBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  freeAdoptionBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  freePlanHeroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  freePlanHeroTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
  },
  freePlanHeroSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    lineHeight: 16,
  },

  // Price Breakdown Styles with 18% GST
  priceBreakdownCard: {
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 4,
    marginTop: 4,
  },
  breakdownHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  breakdownHeaderTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    flex: 1,
    paddingRight: 8,
  },
  breakdownValue: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  breakdownDivider: {
    height: 1,
    marginVertical: 2,
  },
  breakdownDividerBold: {
    height: 1.5,
    marginVertical: 3,
  },
  breakdownTotalLabel: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    flex: 1,
  },
  breakdownTotalValue: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
});
