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

function isCropSupportedByDoctor(crop: any, advisor: any): boolean {
  if (!advisor || !crop) return true;
  if ((advisor as any).allCropsSelected) return true;

  const specializedCrops = Array.isArray(advisor.specializedCrops) ? advisor.specializedCrops : [];
  const specializedCats = Array.isArray(advisor.specializedCategories) ? advisor.specializedCategories : [];

  // Check if doctor accepts all crops
  const isAllCrops =
    specializedCrops.length === 0 ||
    specializedCrops.some((sc: string) => {
      const up = String(sc).toUpperCase().trim();
      return up === 'ALL' || up === 'ALL_CROPS' || up === 'ALL CROPS' || up.includes('ALL CROP');
    });
  if (isAllCrops) return true;

  // Category match
  if (specializedCats.length > 0 && crop.category && specializedCats.includes(crop.category)) {
    return true;
  }

  // Crop name match
  if (specializedCrops.length > 0 && crop.cropName) {
    const cLower = String(crop.cropName).toLowerCase().trim();
    return specializedCrops.some((sc: string) => {
      const scLower = String(sc).toLowerCase().trim();
      return scLower === cLower || scLower.includes(cLower) || cLower.includes(scLower);
    });
  }

  return false;
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
      const cropWithDoc = (realCropsList || []).find(
        (c) => c.advisorReviewStatus === 'ACCEPTED' && c.assignedAdvisor,
      );
      if (cropWithDoc?.assignedAdvisor) {
        const doc = cropWithDoc.assignedAdvisor;
        const supervised = (realCropsList || []).filter(
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

  // In-Modal 3-Screen Progressive Flow: 'CROP' (Page 1) -> 'DOCTOR_PLAN' (Page 2) -> 'PAYMENT' (Page 3)
  const [currentStep, setCurrentStep] = useState<'CROP' | 'DOCTOR_PLAN' | 'PAYMENT'>('CROP');
  const [consultationType, setConsultationType] = useState<'HIRE_DOCTOR' | 'ONE_TIME'>('HIRE_DOCTOR');
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
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
      setCurrentStep('CROP');
      setConsultationType('HIRE_DOCTOR');
      setConsultationMode('CROP_WISE');
      setSelectedCropPackage('SEASON');
      setIsCropDropdownOpen(false);
      setStatusMessage(null);
      setActivatedNotice(null);
      setUpiCheckoutData(null);
      setUtrInput('');
      setCopiedVpa(false);
      if (initialCropId) {
        setSelectedCropId(initialCropId);
      } else if ((realCropsList || []).length > 0) {
        // Pick first unassigned crop by default
        const unassigned = (realCropsList || []).find(
          (c) => !c.assignedAdvisorId && !c.assignedAdvisor && c.advisorReviewStatus !== 'ACCEPTED',
        );
        setSelectedCropId(unassigned?.id ?? realCropsList[0]?.id ?? null);
      }
    }
  }, [visible, initialCropId, realCropsList]);

  // Currently Selected Advisor Object (Defaults to Active Doctor, or first Available Doctor)
  const selectedAdv = useMemo(() => {
    const list = Array.isArray(availableAdvisors)
      ? availableAdvisors
      : (availableAdvisors as any)?.items || (availableAdvisors as any)?.data || [];
    if (!selectedAdvisorId) {
      return activeDoctorInfo?.doctor ?? list[0] ?? null;
    }
    return (list || []).find((a: any) => a?.id === selectedAdvisorId) ?? activeDoctorInfo?.doctor ?? list[0] ?? null;
  }, [selectedAdvisorId, availableAdvisors, activeDoctorInfo]);

  // In Full Season Care (Dedicated Doctor): only show crops registered with the farmer AND selected by the doctor for care
  const eligibleSeasonCrops = useMemo(() => {
    if (consultationType === 'HIRE_DOCTOR' && selectedAdv) {
      return (realCropsList || []).filter((crop) => isCropSupportedByDoctor(crop, selectedAdv));
    }
    return realCropsList || [];
  }, [consultationType, selectedAdv, realCropsList]);

  // Automatically keep selectedCropId synced to a valid eligible crop
  React.useEffect(() => {
    if (consultationType === 'HIRE_DOCTOR' && (eligibleSeasonCrops || []).length > 0) {
      if (!selectedCropId || !eligibleSeasonCrops.some((c) => c.id === selectedCropId)) {
        const unassigned = (eligibleSeasonCrops || []).find(
          (c) => !c.assignedAdvisorId && !c.assignedAdvisor && c.advisorReviewStatus !== 'ACCEPTED',
        );
        setSelectedCropId(unassigned?.id ?? eligibleSeasonCrops[0]?.id ?? null);
      }
    }
  }, [consultationType, eligibleSeasonCrops, selectedCropId]);

  // Selected Crop Object
  const selectedCrop = useMemo(() => {
    if (!selectedCropId) return (eligibleSeasonCrops || [])[0] ?? null;
    return (
      (eligibleSeasonCrops || []).find((c) => c.id === selectedCropId) ??
      (realCropsList || []).find((c) => c.id === selectedCropId) ??
      null
    );
  }, [selectedCropId, eligibleSeasonCrops, realCropsList]);

  // Filter Doctors Matching Selected Crop
  const matchingCropDoctors = useMemo(() => {
    const list = Array.isArray(availableAdvisors)
      ? availableAdvisors
      : (availableAdvisors as any)?.items || (availableAdvisors as any)?.data || [];
    if (!selectedCrop) return list;
    return list.filter((advisor: any) => isCropSupportedByDoctor(selectedCrop, advisor));
  }, [selectedCrop, availableAdvisors]);

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
      !((realCropsList || []).find((c) => c.id === selectedCropId)?.advisorReviewStatus === 'ACCEPTED'),
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

    const feeConsultation = parsePlanFee(selectedAdv?.feePerConsultation, 99);
    const feeSeason = parsePlanFee(selectedAdv?.feePerCropSeason, 499);

    baseDoctorFee = consultationType === 'ONE_TIME' || selectedCropPackage === 'PRESCRIPTION' ? feeConsultation : feeSeason;
    billingPeriodDays = consultationType === 'ONE_TIME' || selectedCropPackage === 'PRESCRIPTION' ? 30 : 120;

    let unusedCredit = 0;
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
    const isOneTimeConsult = consultationType === 'ONE_TIME' || selectedCropPackage === 'PRESCRIPTION';
    if (selectedCropId && isOneTimeConsult) {
      try {
        const galleryCheck = await validateCropGalleryCompleteness(selectedCropId, (selectedCrop as any)?.gpsData);
        if (!galleryCheck.isComplete) {
          const msg = `⚠️ Crop Media Required: ${galleryCheck.missingItems.join(', ')}. Complete in Crop Gallery before one-time consultation.`;
          setStatusMessage(msg);
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Crop Media Required', msg);
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

  // Handler: Continue from Step 1 (Crop & Service) to Step 2 (Doctor & Plans)
  const handleContinueToDoctorAndPlan = () => {
    setConsultationMode('CROP_WISE');
    if (consultationType === 'ONE_TIME') {
      setSelectedCropPackage('PRESCRIPTION');
    } else {
      setSelectedCropPackage('SEASON');
    }
    if (consultationType === 'HIRE_DOCTOR' && eligibleSeasonCrops.length === 0) {
      setStatusMessage(`⚠️ Dr. ${selectedAdv?.name} does not provide care for your registered crops. Please switch doctor.`);
      return;
    }
    if (realCropsList.length > 0 && !selectedCropId) {
      setStatusMessage('⚠️ Please select a crop from your farm to proceed.');
      return;
    }
    tap();
    setStatusMessage(null);
    setCurrentStep('DOCTOR_PLAN');
  };

  // Handler: Continue from Step 2 (Doctor & Plans) to Step 3 (Final Payment)
  const handleContinueToPayment = async () => {
    if (!selectedAdv) {
      setStatusMessage('⚠️ Please choose a certified Crop Doctor first.');
      return;
    }
    if (pricingData.isFree || pricingData.netPayable === 0) {
      handleFreeActivation();
      return;
    }
    const isOneTimeConsult = consultationType === 'ONE_TIME' || selectedCropPackage === 'PRESCRIPTION';
    if (selectedCropId && isOneTimeConsult) {
      try {
        const galleryCheck = await validateCropGalleryCompleteness(selectedCropId, (selectedCrop as any)?.gpsData);
        if (!galleryCheck.isComplete) {
          const msg = `⚠️ Crop Media Required: ${galleryCheck.missingItems.join(', ')}. Complete in Crop Gallery before one-time consultation.`;
          setStatusMessage(msg);
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Crop Media Required', msg);
          return;
        }
      } catch {
        // proceed
      }
    }
    tap();
    setCurrentStep('PAYMENT');
    handleProceedToPayment();
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
    const isOneTimeConsult = consultationType === 'ONE_TIME' || selectedCropPackage === 'PRESCRIPTION';
    if (selectedCropId && isOneTimeConsult) {
      try {
        const galleryCheck = await validateCropGalleryCompleteness(selectedCropId, (selectedCrop as any)?.gpsData);
        if (!galleryCheck.isComplete) {
          const msg = `⚠️ Crop Media Required: ${galleryCheck.missingItems.join(', ')}. Complete in Crop Gallery before one-time consultation.`;
          setStatusMessage(msg);
          Platform.OS === 'web' ? alert(msg) : Alert.alert('Crop Media Required', msg);
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
          consultationType === 'ONE_TIME'
            ? `Single Prescription SOS (${selectedCrop?.cropName || 'Crop'})`
            : `Full Season Crop Care (${selectedCrop?.cropName || 'Crop'})`;

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
            colors={['#062817', '#064e3b', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bannerHeader}
          >
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              {currentStep !== 'CROP' && (
                <TouchableOpacity
                  onPress={() => {
                    tap();
                    if (currentStep === 'PAYMENT') {
                      setCurrentStep('DOCTOR_PLAN');
                      setUpiCheckoutData(null);
                    } else if (currentStep === 'DOCTOR_PLAN') {
                      setCurrentStep('CROP');
                    }
                    setStatusMessage(null);
                  }}
                  style={styles.headerBackBtn}
                  accessibilityLabel="Back"
                >
                  <Ionicons name="arrow-back" size={17} color="#ffffff" />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
                  <Text style={styles.bannerTitle}>Crop Doctor Care</Text>
                  <View style={styles.isoTagBadge}>
                    <Text style={styles.isoTagBadgeText}>ISO 9001:2015</Text>
                  </View>
                </View>
                <Text style={styles.bannerSub}>Certified Agronomist Consultation · Spray & Disease Protection</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* 3-Step Progress Indicator */}
          {!activatedNotice && (
            <View style={[styles.stepProgressContainer, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
              {/* Step 1: Crop & Service */}
              <TouchableOpacity
                style={[styles.stepTab, currentStep === 'CROP' && styles.stepTabActive]}
                onPress={() => {
                  tap();
                  setCurrentStep('CROP');
                  setUpiCheckoutData(null);
                  setStatusMessage(null);
                }}
              >
                <View style={[styles.stepCircle, currentStep === 'CROP' && styles.stepCircleActive, (currentStep === 'DOCTOR_PLAN' || currentStep === 'PAYMENT') && styles.stepCircleCompleted]}>
                  <Text style={styles.stepCircleText}>
                    {currentStep === 'DOCTOR_PLAN' || currentStep === 'PAYMENT' ? '✓' : '1'}
                  </Text>
                </View>
                <Text style={[styles.stepTabText, currentStep === 'CROP' && styles.stepTabTextActive]}>
                  1. Crop & Service
                </Text>
              </TouchableOpacity>

              <View style={[styles.stepConnectorLine, { backgroundColor: (currentStep === 'DOCTOR_PLAN' || currentStep === 'PAYMENT') ? '#16a34a' : (isDark ? '#334155' : '#cbd5e1') }]} />

              {/* Step 2: Doctor & Plan */}
              <TouchableOpacity
                style={[styles.stepTab, currentStep === 'DOCTOR_PLAN' && styles.stepTabActive]}
                onPress={() => {
                  if (currentStep === 'PAYMENT') {
                    tap();
                    setCurrentStep('DOCTOR_PLAN');
                    setUpiCheckoutData(null);
                    setStatusMessage(null);
                  } else if (currentStep === 'CROP') {
                    handleContinueToDoctorAndPlan();
                  }
                }}
              >
                <View style={[styles.stepCircle, currentStep === 'DOCTOR_PLAN' && styles.stepCircleActive, currentStep === 'PAYMENT' && styles.stepCircleCompleted]}>
                  <Text style={styles.stepCircleText}>
                    {currentStep === 'PAYMENT' ? '✓' : '2'}
                  </Text>
                </View>
                <Text style={[styles.stepTabText, currentStep === 'DOCTOR_PLAN' && styles.stepTabTextActive]}>
                  2. Doctor & Plan
                </Text>
              </TouchableOpacity>

              <View style={[styles.stepConnectorLine, { backgroundColor: currentStep === 'PAYMENT' ? '#16a34a' : (isDark ? '#334155' : '#cbd5e1') }]} />

              {/* Step 3: Final Payment */}
              <TouchableOpacity
                style={[styles.stepTab, currentStep === 'PAYMENT' && styles.stepTabActive]}
                disabled={currentStep !== 'PAYMENT'}
              >
                <View style={[styles.stepCircle, currentStep === 'PAYMENT' && styles.stepCircleActive]}>
                  <Text style={styles.stepCircleText}>3</Text>
                </View>
                <Text style={[styles.stepTabText, currentStep === 'PAYMENT' && styles.stepTabTextActive]}>
                  3. Payment
                </Text>
              </TouchableOpacity>
            </View>
          )}

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
          ) : currentStep === 'CROP' ? (
            /* ══════════════════════════════════════════════════════════
               SCREEN 1: SELECT CROP & SERVICE TYPE (PAGE 1)
               ══════════════════════════════════════════════════════════ */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, gap: 12 }}>
              {/* Active Doctor Banner (if any) */}
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

              {/* Feature Selection Cards: Hire Dedicated Doctor vs One-Time Consultation */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  1. Choose Consultation Feature:
                </Text>
                <View style={styles.serviceTypeRow}>
                  {/* Card 1: Hire Dedicated Doctor */}
                  <TouchableOpacity
                    style={[
                      styles.serviceTypeCard,
                      consultationType === 'HIRE_DOCTOR' && styles.serviceTypeCardActive,
                      {
                        backgroundColor: isDark
                          ? consultationType === 'HIRE_DOCTOR'
                            ? 'rgba(22, 163, 74, 0.15)'
                            : 'rgba(255, 255, 255, 0.03)'
                          : consultationType === 'HIRE_DOCTOR'
                          ? '#f0fdf4'
                          : '#ffffff',
                      },
                    ]}
                    onPress={() => {
                      tap();
                      setConsultationType('HIRE_DOCTOR');
                      setSelectedCropPackage('SEASON');
                    }}
                  >
                    <View style={styles.serviceTypeHeader}>
                      <View style={[styles.serviceTypeIconBox, { backgroundColor: '#dcfce7' }]}>
                        <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
                      </View>
                      <View style={[styles.badgePill, { backgroundColor: '#dcfce7' }]}>
                        <Text style={[styles.badgePillText, { color: '#15803d' }]}>Full Care</Text>
                      </View>
                    </View>
                    <Text style={[styles.serviceTypeTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      Hire Dedicated Doctor
                    </Text>
                    <Text style={styles.serviceTypeSub}>
                      Seed-to-harvest 120-day crop supervision or monthly VIP retainer with direct call/chat.
                    </Text>
                    <Text style={styles.serviceTypeHighlight}>✓ Continuous Supervision</Text>
                  </TouchableOpacity>

                  {/* Card 2: One-Time Consultation */}
                  <TouchableOpacity
                    style={[
                      styles.serviceTypeCard,
                      consultationType === 'ONE_TIME' && styles.serviceTypeCardActive,
                      {
                        backgroundColor: isDark
                          ? consultationType === 'ONE_TIME'
                            ? 'rgba(2, 132, 199, 0.15)'
                            : 'rgba(255, 255, 255, 0.03)'
                          : consultationType === 'ONE_TIME'
                          ? '#f0f9ff'
                          : '#ffffff',
                      },
                    ]}
                    onPress={() => {
                      tap();
                      setConsultationType('ONE_TIME');
                      setConsultationMode('CROP_WISE');
                      setSelectedCropPackage('PRESCRIPTION');
                    }}
                  >
                    <View style={styles.serviceTypeHeader}>
                      <View style={[styles.serviceTypeIconBox, { backgroundColor: '#e0f2fe' }]}>
                        <Ionicons name="flash" size={18} color="#0284c7" />
                      </View>
                      <View style={[styles.badgePill, { backgroundColor: '#e0f2fe' }]}>
                        <Text style={[styles.badgePillText, { color: '#0369a1' }]}>Instant SOS</Text>
                      </View>
                    </View>
                    <Text style={[styles.serviceTypeTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      One-Time Consultation
                    </Text>
                    <Text style={styles.serviceTypeSub}>
                      Quick 1-time crop photo diagnosis, disease detection & expert spray prescription.
                    </Text>
                    <Text style={[styles.serviceTypeHighlight, { color: '#0284c7' }]}>✓ Instant Spray Prescription</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Doctor Indicator Card (if Hire Doctor selected) */}
              {consultationType === 'HIRE_DOCTOR' && selectedAdv && (
                <View
                  style={[
                    styles.doctorHeaderStrip,
                    {
                      backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff',
                      borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#bae6fd',
                    },
                  ]}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Image
                      source={{
                        uri: resolveMediaUrl(selectedAdv.photoUrl) || FALLBACK_ADVISOR.avatarUrl,
                      }}
                      style={styles.doctorAvatarBoxSmall}
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={[styles.doctorStripName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          Dr. {selectedAdv.name}
                        </Text>
                        <View style={styles.verifiedBadge}>
                          <Text style={styles.verifiedBadgeText}>Selected Doctor</Text>
                        </View>
                      </View>
                      <Text style={styles.doctorStripSpecialty} numberOfLines={1}>
                        Doctor Care Crops:{' '}
                        {Array.isArray(selectedAdv.specializedCrops) && selectedAdv.specializedCrops.length > 0
                          ? selectedAdv.specializedCrops.join(', ')
                          : 'All Crops (Universal)'}
                      </Text>
                    </View>
                  </View>
                  {availableAdvisors.length > 1 && (
                    <TouchableOpacity
                      style={styles.switchDoctorBtn}
                      onPress={() => {
                        tap();
                        setCurrentStep('DOCTOR_PLAN');
                      }}
                    >
                      <Text style={styles.switchDoctorBtnText}>Change ▾</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Crop Selection */}
              <View style={{ gap: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    {consultationType === 'HIRE_DOCTOR'
                      ? '2. Select Crop for Full Season Care:'
                      : '2. Select Your Farm Crop:'}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                    {consultationType === 'HIRE_DOCTOR'
                      ? `${eligibleSeasonCrops.length} Registered & Supported`
                      : `${realCropsList.length} Registered`}
                  </Text>
                </View>

                {isLoadingCrops ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : realCropsList.length === 0 ? (
                  <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <Text style={[styles.emptyNoticeText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      No crops registered on your account. Please register a crop first.
                    </Text>
                  </View>
                ) : consultationType === 'HIRE_DOCTOR' && eligibleSeasonCrops.length === 0 ? (
                  <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : '#fffbeb', borderColor: '#fde68a' }]}>
                    <Ionicons name="alert-circle" size={24} color="#d97706" />
                    <Text style={[styles.emptyNoticeTitle, { color: isDark ? '#ffffff' : '#92400e' }]}>
                      No Matching Registered Crops for Dr. {selectedAdv?.name}
                    </Text>
                    <Text style={[styles.emptyNoticeText, { color: isDark ? '#cbd5e1' : '#b45309', textAlign: 'center' }]}>
                      Dr. {selectedAdv?.name} provides Full Season Care for: {Array.isArray(selectedAdv?.specializedCrops) && selectedAdv.specializedCrops.length > 0 ? selectedAdv.specializedCrops.join(', ') : 'Selected Crops'}. None of your registered farm crops ({realCropsList.map((c) => c.cropName).join(', ')}) match this doctor's care selection.
                    </Text>
                    <TouchableOpacity
                      style={styles.switchDoctorCTA}
                      onPress={() => {
                        tap();
                        setCurrentStep('DOCTOR_PLAN');
                      }}
                    >
                      <Text style={styles.switchDoctorCTAText}>Browse Other Certified Doctors ➔</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.cropCardGrid}>
                    {(consultationType === 'HIRE_DOCTOR' ? eligibleSeasonCrops : realCropsList).map((crop) => {
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
                          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                            <View style={styles.cropIconBadge}>
                              <Ionicons name="leaf" size={14} color="#16a34a" />
                            </View>
                            <View>
                              <Text
                                style={[
                                  styles.cropCardTitle,
                                  { color: isAssigned ? '#94a3b8' : isDark ? '#ffffff' : '#0f172a' },
                                ]}
                              >
                                {crop.cropName} {crop.variety ? `(${crop.variety})` : ''}
                              </Text>
                              {crop.area ? (
                                <Text style={styles.cropCardSub}>
                                  Acreage: {crop.area} {crop.unit || 'Acre'}
                                </Text>
                              ) : null}
                            </View>
                            {isAssigned ? (
                              <View style={styles.assignedGuardBadge}>
                                <Text style={styles.assignedGuardText}>Active: Dr. {crop.assignedAdvisor?.name || 'Specialist'}</Text>
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

              {/* Status Message */}
              {statusMessage ? (
                <Text style={[styles.statusMsgText, { color: statusMessage.startsWith('❌') ? '#ef4444' : '#10b981' }]}>
                  {statusMessage}
                </Text>
              ) : null}

              {/* Bottom Strip & CTA for Step 1 */}
              <View
                style={[
                  styles.selectedPlanSummaryStrip,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                    Selected Step 1:
                  </Text>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>
                    {selectedCrop ? `🌾 ${selectedCrop.cropName}` : 'Select Crop'} ·{' '}
                    {consultationType === 'HIRE_DOCTOR' ? 'Hire Dedicated Doctor' : 'One-Time Consultation'}
                  </Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={24} color="#16a34a" />
              </View>

              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={styles.secondaryBackBtn}
                  onPress={() => {
                    tap();
                    onClose();
                  }}
                >
                  <Ionicons name="close" size={15} color={isDark ? '#cbd5e1' : '#475569'} />
                  <Text style={[styles.secondaryBackBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.primarySubmitBtnFlex}
                  onPress={handleContinueToDoctorAndPlan}
                  activeOpacity={0.88}
                >
                  <Text style={styles.primarySubmitBtnText}>Proceed to Choose Doctor & Plans ➔</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : currentStep === 'DOCTOR_PLAN' ? (
            /* ══════════════════════════════════════════════════════════
               SCREEN 2: DOCTOR SELECTION & PLANS WITH DOCTOR PRICING (PAGE 2)
               ══════════════════════════════════════════════════════════ */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 14, gap: 12 }}>
              {/* Back to Step 1 Button */}
              <TouchableOpacity
                style={styles.backBtnRow}
                onPress={() => {
                  tap();
                  setCurrentStep('CROP');
                  setStatusMessage(null);
                }}
              >
                <Ionicons name="arrow-back" size={16} color="#0284c7" />
                <Text style={styles.backBtnText}>← Back to Crop & Service</Text>
              </TouchableOpacity>

              {/* Selected Crop & Service Tag Pill */}
              <View style={[styles.selectedPillRow, { backgroundColor: isDark ? '#1e293b' : '#f0fdf4', borderColor: isDark ? '#334155' : '#bbf7d0' }]}>
                <Ionicons name="leaf" size={14} color="#16a34a" />
                <Text style={[styles.selectedPillText, { color: isDark ? '#86efac' : '#15803d' }]}>
                  Crop: {selectedCrop ? selectedCrop.cropName : 'Select Crop'} · Service: {consultationType === 'HIRE_DOCTOR' ? 'Hire Dedicated Doctor' : 'One-Time Consultation'}
                </Text>
              </View>

              {/* 1. Choose Specialist Doctor */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  1. Choose Specialist Doctor:
                </Text>

                {isLoadingAdvisors ? (
                  <ActivityIndicator size="small" color="#16a34a" />
                ) : matchingCropDoctors.length === 0 ? (
                  <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                    <Text style={[styles.emptyNoticeText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      No specialist found specifically for this crop. Showing all certified agronomists.
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
                      const feeOneTime = parsePlanFee(advisor.feePerConsultation, 99);

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
                              ) : (
                                <View style={styles.verifiedBadge}>
                                  <Text style={styles.verifiedBadgeText}>Verified</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.doctorSpecText} numberOfLines={1}>
                              {advisor.specialization || 'Agronomy Specialist'} · {advisor.yearsExperience || 5}+ yrs exp · {consultationType === 'ONE_TIME' ? (isFreeConsult ? '₹0 Free' : `₹${feeOneTime} / prescription`) : `₹${feeSeason} / season`}
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

              {/* 2. Doctor Plans & Doctor Pricing (Usde Plans Doctor Price Smet) */}
              <View style={{ gap: 6 }}>
                <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  2. Consultation Plan & Doctor Fee:
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
                        Free Doctor Adoption (₹0 Doctor Fee)
                      </Text>
                      <Text style={[styles.freePlanHeroSub, { color: isDark ? '#cbd5e1' : '#166534' }]}>
                        Covered under Dr. {selectedAdv?.name}'s active plan quota ({activeDoctorInfo?.freeSlotsRemaining} free slot left).
                      </Text>
                    </View>
                  </View>
                ) : consultationType === 'ONE_TIME' ? (
                  /* ─── OPTION: ONE-TIME SOS PRESCRIPTION ─── */
                  <View style={{ gap: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.packageCard,
                        styles.packageCardSelected,
                        {
                          backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : '#f0f9ff',
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.packageTitle, { color: '#0284c7' }]}>
                              Pay Per Prescription (Instant SOS)
                            </Text>
                            <View style={[styles.badgePill, { backgroundColor: '#e0f2fe' }]}>
                              <Text style={[styles.badgePillText, { color: '#0369a1' }]}>1-Time Rx</Text>
                            </View>
                          </View>
                          <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            Upload crop leaf/stem photo to get confirmed disease diagnosis and exact chemical/organic spray dosage.
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <View style={styles.doctorPricePill}>
                            <Text style={styles.doctorPricePillText}>Doctor Fee</Text>
                          </View>
                          <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                            {isExplicitlyFree(selectedAdv?.feePerConsultation)
                              ? '₹0 (FREE)'
                              : `₹${parsePlanFee(selectedAdv?.feePerConsultation, 99)}`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* ─── OPTION: HIRE DEDICATED DOCTOR ─── */
                  <View style={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        styles.packageCard,
                        styles.packageCardSelected,
                        {
                          borderColor: '#10b981',
                          backgroundColor: isDark ? 'rgba(16, 185, 129, 0.14)' : '#f0fdf4',
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.packageTitle, { color: '#16a34a' }]}>
                              Full Crop Season Care (120 Days)
                            </Text>
                            <View style={[styles.badgePill, { backgroundColor: '#dcfce7' }]}>
                              <Text style={[styles.badgePillText, { color: '#15803d' }]}>RECOMMENDED</Text>
                            </View>
                          </View>
                          <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                            Seed-to-harvest crop monitoring, personalized spray calendar, disease protection & priority doctor calls.
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 2 }}>
                          <View style={[styles.doctorPricePill, { backgroundColor: '#dcfce7' }]}>
                            <Text style={[styles.doctorPricePillText, { color: '#15803d' }]}>Doctor Fee</Text>
                          </View>
                          <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                            {isExplicitlyFree(selectedAdv?.feePerCropSeason)
                              ? '₹0 (FREE)'
                              : `₹${parsePlanFee(selectedAdv?.feePerCropSeason, 499)}`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Status Message */}
              {statusMessage ? (
                <Text style={[styles.statusMsgText, { color: statusMessage.startsWith('❌') ? '#ef4444' : '#10b981' }]}>
                  {statusMessage}
                </Text>
              ) : null}

              {/* Selection Summary Strip & Proceed to Payment CTA */}
              <View
                style={[
                  styles.selectedPlanSummaryStrip,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                    Selected Doctor & Plan:
                  </Text>
                  <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>
                    {selectedAdv ? `Dr. ${selectedAdv.name}` : 'Select a Doctor'} ·{' '}
                    {consultationType === 'ONE_TIME'
                      ? 'One-Time SOS Prescription'
                      : 'Full Season Care (120 Days)'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#64748b' }}>Doctor Fee</Text>
                  <Text style={{ fontSize: 15, fontFamily: FONT.extraBold, color: '#16a34a' }}>
                    {pricingData.isIncludedInActivePlan || pricingData.isFree
                      ? '₹0 Free'
                      : `₹${pricingData.doctorFee}`}
                  </Text>
                </View>
              </View>

              <View style={styles.actionBtnRow}>
                <TouchableOpacity
                  style={styles.secondaryBackBtn}
                  onPress={() => {
                    tap();
                    setCurrentStep('CROP');
                    setStatusMessage(null);
                  }}
                >
                  <Ionicons name="arrow-back" size={15} color={isDark ? '#cbd5e1' : '#475569'} />
                  <Text style={[styles.secondaryBackBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primarySubmitBtnFlex,
                    (pricingData.isFree || pricingData.isIncludedInActivePlan) && { backgroundColor: '#16a34a' },
                    isProcessing && { opacity: 0.6 },
                  ]}
                  disabled={isProcessing}
                  onPress={
                    pricingData.isFree || pricingData.isIncludedInActivePlan
                      ? handleFreeActivation
                      : handleContinueToPayment
                  }
                  activeOpacity={0.88}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={pricingData.isFree || pricingData.isIncludedInActivePlan ? 'gift' : 'arrow-forward'}
                        size={17}
                        color="#ffffff"
                      />
                      <Text style={styles.primarySubmitBtnText}>
                        {pricingData.isIncludedInActivePlan
                          ? `Adopt Crop (Free · ₹0)`
                          : pricingData.isFree
                          ? 'Activate Free (₹0) 🎁'
                          : `Proceed to Final Payment (₹${pricingData.totalPayable}) ➔`}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* ══════════════════════════════════════════════════════════
               SCREEN 3: FINAL PAYMENT & ACTIVATION GATEWAY (PAGE 3)
               ══════════════════════════════════════════════════════════ */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 12 }}>
              {/* Back to Step 2 Button */}
              <TouchableOpacity
                style={styles.backBtnRow}
                onPress={() => {
                  tap();
                  setCurrentStep('DOCTOR_PLAN');
                  setUpiCheckoutData(null);
                  setStatusMessage(null);
                }}
              >
                <Ionicons name="arrow-back" size={16} color="#0284c7" />
                <Text style={styles.backBtnText}>← Back to Doctor & Plans</Text>
              </TouchableOpacity>

              {/* Verified Trust Strip */}
              <View style={styles.trustStripBox}>
                <Ionicons name="shield-checkmark" size={16} color="#16a34a" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.trustStripTitle}>Official UPI Direct Payment Gateway</Text>
                  <Text style={styles.trustStripSub}>FARMSKING TECHNOLOGIES PRIVATE LIMITED · 0% Additional Fee</Text>
                </View>
              </View>

              {/* Consultation Order Review Card */}
              <View style={[styles.orderReviewCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    Consultation Order Summary
                  </Text>
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>Verified Specialist</Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <Image
                    source={{
                      uri: resolveMediaUrl(selectedAdv?.photoUrl) || FALLBACK_ADVISOR.avatarUrl,
                    }}
                    style={styles.doctorAvatarBox}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.doctorName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      Dr. {selectedAdv?.name}
                    </Text>
                    <Text style={styles.doctorSpecText}>
                      {selectedAdv?.specialization || 'Agronomy Specialist'} · {selectedAdv?.yearsExperience || 5}+ yrs exp
                    </Text>
                  </View>
                </View>

                <View style={[styles.breakdownDivider, { backgroundColor: isDark ? '#334155' : '#e2e8f0' }]} />

                <View style={{ gap: 4 }}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Selected Crop:</Text>
                    <Text style={[styles.summaryVal, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      {selectedCrop
                        ? `🌾 ${selectedCrop.cropName} (${selectedCrop.area || '1'} ${selectedCrop.unit || 'Acre'})`
                        : 'Selected Farm Crop'}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Plan / Package:</Text>
                    <Text style={[styles.summaryVal, { color: '#0284c7' }]}>
                      {consultationType === 'ONE_TIME'
                        ? 'Pay Per Prescription (Instant SOS)'
                        : 'Full Season Care (120 Days)'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Price Breakdown Card with 18% GST */}
              <View
                style={[
                  styles.priceBreakdownCard,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <View style={styles.breakdownHeaderRow}>
                  <Ionicons name="receipt-outline" size={14} color="#16a34a" />
                  <Text style={[styles.breakdownHeaderTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    Itemized Billing Breakdown
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Doctor Fee:</Text>
                  <Text style={[styles.breakdownValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    ₹{pricingData.doctorFee}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Platform Infrastructure Fee (10%):</Text>
                  <Text style={[styles.breakdownValue, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    +₹{pricingData.platformFee}
                  </Text>
                </View>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Statutory GST (18%):</Text>
                  <Text style={[styles.breakdownValue, { color: '#0284c7' }]}>
                    +₹{pricingData.gstAmount}
                  </Text>
                </View>
                {pricingData.unusedCredit > 0 && (
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: '#16a34a' }]}>Prorated Plan Credit:</Text>
                    <Text style={[styles.breakdownValue, { color: '#16a34a' }]}>
                      -₹{pricingData.unusedCredit}
                    </Text>
                  </View>
                )}
                <View style={[styles.breakdownDividerBold, { backgroundColor: isDark ? '#475569' : '#cbd5e1' }]} />
                <View style={styles.breakdownRow}>
                  <Text style={[styles.breakdownTotalLabel, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    Total Amount Payable:
                  </Text>
                  <Text style={[styles.breakdownTotalValue, { color: '#16a34a' }]}>
                    ₹{pricingData.totalPayable.toLocaleString('en-IN')}
                  </Text>
                </View>
              </View>

              {/* Collapsible Coupon Section */}
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

              {/* Status Message */}
              {statusMessage ? (
                <Text style={[styles.statusMsgText, { color: statusMessage.startsWith('❌') ? '#ef4444' : '#10b981' }]}>
                  {statusMessage}
                </Text>
              ) : null}

              {/* UPI Payment Processing / Direct Gateway Section */}
              {isProcessing ? (
                <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc', paddingVertical: 24 }]}>
                  <ActivityIndicator size="large" color="#16a34a" />
                  <Text style={[styles.emptyNoticeText, { color: isDark ? '#cbd5e1' : '#475569', marginTop: 8 }]}>
                    Initializing Official UPI Gateway...
                  </Text>
                </View>
              ) : upiCheckoutData ? (
                <View style={{ gap: 12 }}>
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
                    <View style={styles.actionBtnRow}>
                      <TouchableOpacity
                        style={styles.secondaryBackBtn}
                        onPress={() => {
                          tap();
                          setUpiCheckoutData(null);
                          setCurrentStep('DOCTOR_PLAN');
                          setStatusMessage(null);
                        }}
                      >
                        <Ionicons name="arrow-back" size={15} color={isDark ? '#cbd5e1' : '#475569'} />
                        <Text style={[styles.secondaryBackBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.primarySubmitBtnFlex, { backgroundColor: '#16a34a' }]}
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
                  </View>
                </View>
              ) : (
                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={styles.secondaryBackBtn}
                    onPress={() => {
                      tap();
                      setCurrentStep('DOCTOR_PLAN');
                      setStatusMessage(null);
                    }}
                  >
                    <Ionicons name="arrow-back" size={15} color={isDark ? '#cbd5e1' : '#475569'} />
                    <Text style={[styles.secondaryBackBtnText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.primarySubmitBtnFlex, { backgroundColor: '#16a34a' }]}
                    onPress={handleProceedToPayment}
                  >
                    <Ionicons name="qr-code" size={18} color="#ffffff" />
                    <Text style={styles.primarySubmitBtnText}>
                      Generate UPI QR Code (₹{pricingData.totalPayable})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
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
    maxWidth: 560,
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
  isoTagBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  isoTagBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#a7f3d0',
    letterSpacing: 0.5,
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

  stepProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: RADIUS.sm,
  },
  stepTabActive: {
    opacity: 1,
  },
  stepCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#94a3b8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#16a34a',
  },
  stepCircleCompleted: {
    backgroundColor: '#16a34a',
  },
  stepCircleText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  stepCircleTextActive: {
    color: '#ffffff',
  },
  stepTabText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  stepTabTextActive: {
    color: '#16a34a',
  },
  stepConnectorLine: {
    flex: 1,
    height: 2,
    marginHorizontal: 10,
    borderRadius: 1,
  },

  serviceTypeRow: {
    flexDirection: 'row',
    gap: 10,
  },
  serviceTypeCard: {
    flex: 1,
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 4,
  },
  serviceTypeCardActive: {
    borderColor: '#16a34a',
    ...premiumShadow('#16a34a', 'sm'),
  },
  serviceTypeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  serviceTypeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceTypeTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
  },
  serviceTypeSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    lineHeight: 13,
  },
  serviceTypeHighlight: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#16a34a',
    marginTop: 2,
  },
  cropCardGrid: {
    gap: 6,
  },

  selectedPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  selectedPillText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  doctorPricePill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.xs,
  },
  doctorPricePillText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },

  cropDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    gap: 8,
  },
  cropIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cropDropdownSelectedTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  cropDropdownSelectedSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  cropDropdownList: {
    marginTop: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
    ...premiumShadow('#000000', 'sm'),
  },
  cropDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  cropDropdownItemActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  cropDropdownItemText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },

  selectedPlanSummaryStrip: {
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderReviewCard: {
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    gap: 6,
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

  doctorHeaderStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 10,
  },
  doctorAvatarBoxSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  doctorStripName: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  doctorStripSpecialty: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#0284c7',
    marginTop: 1,
  },
  switchDoctorBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: RADIUS.xs,
    backgroundColor: '#0284c7',
  },
  switchDoctorBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  emptyNoticeTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    marginTop: 4,
  },
  switchDoctorCTA: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.sm,
    backgroundColor: '#d97706',
    alignItems: 'center',
  },
  switchDoctorCTAText: {
    fontSize: 11,
    fontFamily: FONT.bold,
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

  headerBackBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    height: 42,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  secondaryBackBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  primarySubmitBtnFlex: {
    flex: 1,
    backgroundColor: '#0284c7',
    height: 42,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...premiumShadow('#0284c7', 'sm'),
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
