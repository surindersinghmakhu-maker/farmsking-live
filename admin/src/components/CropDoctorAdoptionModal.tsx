import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
  Platform,
  Alert,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { resolveMediaUrl } from '@/src/api/client';
import { useAvailableAdvisorsForCrop, useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useMyCrops, useSubmitCropToAdvisor } from '@/src/hooks/useCrops';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useInitiateFarmerPlanPayment, useSubmitFarmerPlanPayment } from '@/src/hooks/useFarmerPlanPayments';
import { validateCropGalleryCompleteness } from '@/src/utils/crop-media';
import { CropCycle } from '@/src/types/api';

interface CropDoctorAdoptionModalProps {
  visible: boolean;
  crop: CropCycle | null;
  onClose: () => void;
  isSecondOpinion?: boolean;
  onUpgradePlan?: (doctorId?: string) => void;
}

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

type SelectedPlanType = 'INCLUDED_FREE' | 'PER_CROP' | 'MONTHLY_SUBSCRIPTION' | 'PAY_PER_CONSULTATION' | 'ADDITIONAL_CROP';

function getPlanLabel(plan: SelectedPlanType): string {
  switch (plan) {
    case 'INCLUDED_FREE':
      return 'Monthly Retainer Included Slot (FREE)';
    case 'ADDITIONAL_CROP':
      return 'Additional Crop Monthly Care';
    case 'PER_CROP':
      return 'Per Crop Season (120-Day Cycle)';
    case 'MONTHLY_SUBSCRIPTION':
      return 'Monthly Care Retainer';
    case 'PAY_PER_CONSULTATION':
      return 'Single Prescription / Second Opinion';
    default:
      return 'Consultation Plan';
  }
}

export function CropDoctorAdoptionModal({
  visible,
  crop,
  onClose,
  isSecondOpinion = false,
  onUpgradePlan,
}: CropDoctorAdoptionModalProps) {
  const { data: advisors, isLoading } = useAvailableAdvisorsForCrop(crop?.id, visible);
  const { data: myAdvisor } = useMyAdvisor();
  const { data: myCrops = [] } = useMyCrops();
  const { data: appSettings } = useAppSettings();
  const submitCrop = useSubmitCropToAdvisor();
  const initiatePayment = useInitiateFarmerPlanPayment();
  const submitPayment = useSubmitFarmerPlanPayment();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedPlanModel, setSelectedPlanModel] = useState<SelectedPlanType>('PER_CROP');
  const [farmerComment, setFarmerComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllDoctors, setShowAllDoctors] = useState(false);

  // Gallery completeness check state
  const [galleryCheckResult, setGalleryCheckResult] = useState<{
    isComplete: boolean;
    photoCount: number;
    hasVideo: boolean;
    hasVoiceOrNotes: boolean;
    missingItems: string[];
  } | null>(null);
  const [isCheckingGallery, setIsCheckingGallery] = useState(false);

  // UPI payment state
  const [upiCheckoutData, setUpiCheckoutData] = useState<{
    id: string;
    amount: number;
    upiLink: string;
    payeeVpa: string;
    payeeName: string;
    doctorName: string;
    planName: string;
  } | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // Validate gallery completeness on modal open
  useEffect(() => {
    let cancelled = false;
    if (visible && crop?.id) {
      setCurrentStep(1);
      setFarmerComment('');
      setUpiCheckoutData(null);
      setUtrInput('');
      setIsCheckingGallery(true);

      validateCropGalleryCompleteness(crop.id, (crop as any).gpsData)
        .then((res) => {
          if (!cancelled) {
            setGalleryCheckResult(res);
            setIsCheckingGallery(false);
          }
        })
        .catch(() => {
          if (!cancelled) setIsCheckingGallery(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [visible, crop?.id]);

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Filter for hired doctors (active monthly subscription, assigned advisor, or assigned on any crop)
  const hiredDoctors = useMemo(() => {
    const list = Array.isArray(advisors) ? advisors : [];
    return list.filter((a) => {
      const hasMonthly = Boolean(a.quota?.hasActiveMonthlySubscription);
      const isMyAdvisor = Boolean(myAdvisor?.advisor?.id === a.id);
      const isHiredOnCrops = Array.isArray(myCrops) && myCrops.some(
        (c) => c.assignedAdvisorId === a.id || (c as any).assignedAdvisor?.id === a.id
      );
      return hasMonthly || isMyAdvisor || isHiredOnCrops;
    });
  }, [advisors, myAdvisor, myCrops]);

  const displayedDoctors = useMemo(() => {
    const list = Array.isArray(advisors) ? advisors : [];
    if (hiredDoctors.length > 0 && !showAllDoctors) {
      return hiredDoctors;
    }
    return list;
  }, [advisors, hiredDoctors, showAllDoctors]);

  const selectedDoctor = useMemo(() => {
    const list = displayedDoctors || [];
    if (!Array.isArray(list) || list.length === 0) return null;
    if (selectedDoctorId) {
      const found = list?.find((a) => a.id === selectedDoctorId);
      if (found) return found;
    }
    // Pick first doctor who is not already assigned to this crop
    const firstAvailable = list?.find(
      (a) => !((a as any).isAlreadyAssignedToThisCrop || (crop?.assignedAdvisorId === a.id && crop?.advisorReviewStatus !== 'NONE')),
    );
    return firstAvailable || list[0];
  }, [displayedDoctors, selectedDoctorId, crop]);

  // Determine running plan level with this doctor or for this crop
  // Hierarchy:
  // Rank 1: PAY_PER_CONSULTATION
  // Rank 2: PER_CROP
  // Rank 3: MONTHLY_SUBSCRIPTION
  const runningPlanRank = useMemo(() => {
    if (!selectedDoctor) return 0;
    if (selectedDoctor.quota?.hasActiveMonthlySubscription) {
      return 3; // Monthly active
    }
    const cropHiringModel = (crop as any)?.hiringModel;
    if (crop?.assignedAdvisorId === selectedDoctor.id) {
      if (cropHiringModel === 'MONTHLY_SUBSCRIPTION') return 3;
      if (cropHiringModel === 'PER_CROP') return 2;
      if (cropHiringModel === 'PAY_PER_CONSULTATION') return 1;
    }
    return 0;
  }, [selectedDoctor, crop]);

  // Set default plan model when doctor changes, taking active plan into account
  useEffect(() => {
    if (selectedDoctor) {
      if (isSecondOpinion) {
        setSelectedPlanModel('PAY_PER_CONSULTATION');
      } else if (runningPlanRank === 3) {
        if (selectedDoctor.quota?.quotaStatus === 'INCLUDED_FREE') {
          setSelectedPlanModel('INCLUDED_FREE');
        } else {
          setSelectedPlanModel('ADDITIONAL_CROP');
        }
      } else if (runningPlanRank === 2) {
        // PER_CROP active -> can only upgrade to MONTHLY_SUBSCRIPTION
        setSelectedPlanModel('MONTHLY_SUBSCRIPTION');
      } else if (runningPlanRank === 1) {
        // PAY_PER_CONSULTATION active -> upgrade to PER_CROP
        setSelectedPlanModel('PER_CROP');
      } else {
        setSelectedPlanModel('PER_CROP');
      }
    }
  }, [selectedDoctor, isSecondOpinion, runningPlanRank]);

  const pricingBreakdown = useMemo(() => {
    if (!selectedDoctor) {
      return {
        advisorFee: 0,
        platformFee: 0,
        gstTax: 0,
        totalPayable: 0,
      };
    }

    let baseAdvisorFee = 0;
    if (selectedPlanModel === 'INCLUDED_FREE') {
      baseAdvisorFee = 0;
    } else if (selectedPlanModel === 'ADDITIONAL_CROP') {
      baseAdvisorFee = parsePlanFee(selectedDoctor.quota?.additionalCropFee, 300);
    } else if (selectedPlanModel === 'PER_CROP') {
      baseAdvisorFee = parsePlanFee(selectedDoctor.feePerCropSeason, 499);
    } else if (selectedPlanModel === 'MONTHLY_SUBSCRIPTION') {
      baseAdvisorFee = parsePlanFee(selectedDoctor.feeVipMonthly, 1999);
    } else if (selectedPlanModel === 'PAY_PER_CONSULTATION') {
      baseAdvisorFee = parsePlanFee(selectedDoctor.feePerConsultation, 99);
    }

    if (baseAdvisorFee === 0) {
      return {
        advisorFee: 0,
        platformFee: 0,
        gstTax: 0,
        totalPayable: 0,
      };
    }

    const advisorFee = baseAdvisorFee;
    const PLATFORM_INFRA_FEE_PERCENT = 10.0;
    const platformFee = Math.max(1, Math.round((advisorFee * PLATFORM_INFRA_FEE_PERCENT) / 100));

    const GST_RATE_PERCENT = 18.0;
    const taxableBase = advisorFee + platformFee;
    const gstTax = Math.max(1, Math.round((taxableBase * GST_RATE_PERCENT) / 100));
    const totalPayable = taxableBase + gstTax;

    return {
      advisorFee,
      platformFee,
      gstTax,
      totalPayable,
    };
  }, [selectedDoctor, selectedPlanModel]);

  // Gallery verification guard — ONLY enforced for ONE-TIME / PAY-PER-CONSULTATION / Second Opinion
  const ensureGalleryComplete = (): boolean => {
    const isOneTime = selectedPlanModel === 'PAY_PER_CONSULTATION' || isSecondOpinion;
    if (!isOneTime) return true; // Continuous doctor adoption can be assigned without gallery completeness!

    if (galleryCheckResult && !galleryCheckResult.isComplete) {
      const msg = `⚠️ Crop Media Required: ${galleryCheckResult.missingItems.join(', ')}. Complete in Crop Gallery for one-time consultation.`;
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Crop Gallery Incomplete', msg);
      return false;
    }
    return true;
  };

  const handleStep1Next = () => {
    tap();
    if (!ensureGalleryComplete()) return;
    if (!selectedDoctor) {
      const msg = 'Please select an available Crop Doctor.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Notice', msg);
      return;
    }
    setCurrentStep(2);
  };

  const handleStep2Next = () => {
    tap();
    if (!ensureGalleryComplete()) return;
    setCurrentStep(3);
  };

  const handleSubmit = async () => {
    if (!crop || !selectedDoctor) return;
    if (!ensureGalleryComplete()) return;

    if (!farmerComment.trim()) {
      const msg = '⚠️ Please write a brief message or describe symptoms for the doctor before submitting adoption.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Farmer Note Required', msg);
      return;
    }

    tap();
    setIsSubmitting(true);

    try {
      const hiringModel =
        selectedPlanModel === 'PAY_PER_CONSULTATION'
          ? 'PAY_PER_CONSULTATION'
          : selectedPlanModel === 'MONTHLY_SUBSCRIPTION' || selectedPlanModel === 'INCLUDED_FREE' || selectedPlanModel === 'ADDITIONAL_CROP'
          ? 'MONTHLY_SUBSCRIPTION'
          : 'PER_CROP';

      // ── IF PAYMENT REQUIRED: PROCESS VIA PAYMENT GATEWAY ──
      if (pricingBreakdown.totalPayable > 0) {
        const billingPeriodDays =
          selectedPlanModel === 'PAY_PER_CONSULTATION' ? 1 : selectedPlanModel === 'PER_CROP' ? 120 : 30;

        const res = await initiatePayment.mutateAsync({
          targetPlan: 'GOLD' as any,
          billingPeriodDays,
          selectedDoctorId: selectedDoctor.isSeniorDoctor ? selectedDoctor.id : undefined,
          selectedAdvisorId: !selectedDoctor.isSeniorDoctor ? selectedDoctor.id : undefined,
          doctorKingId: selectedDoctor.isSeniorDoctor ? (selectedDoctor.kingId ?? undefined) : undefined,
          advisorKingId: !selectedDoctor.isSeniorDoctor ? (selectedDoctor.kingId ?? undefined) : undefined,
          cropCycleId: crop.id,
          customAmount: pricingBreakdown.totalPayable,
        });

        const targetGatewayUrl =
          (res as any)?.paymentLink ||
          (res as any)?.phonepeRedirectUrl ||
          (res as any)?.cashfreePaymentLink ||
          (res.cashfreeSessionId ? `https://payments.cashfree.com/order/#${res.cashfreeSessionId}` : null) ||
          (res as any)?.razorpayShortUrl;

        // 1. Direct Web/Online Payment Gateway
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

        // 2. Direct Official UPI Gateway (QR + UTR verification)
        if (res.upiLink) {
          const vpa = (res as any)?.payeeVpa || (appSettings as any)?.upiId || 'surindersinghmakhu-8@okicici';
          const payee = (appSettings as any)?.upiPayeeName || 'FarmsKing India';
          setUpiCheckoutData({
            id: res.id,
            amount: pricingBreakdown.totalPayable,
            upiLink: res.upiLink,
            payeeVpa: vpa,
            payeeName: payee,
            doctorName: selectedDoctor.name,
            planName: getPlanLabel(selectedPlanModel),
          });
          return;
        }
      }

      // ── ZERO COST (FREE QUOTA) OR DIRECT ADOPTION ──
      await submitCrop.mutateAsync({
        id: crop.id,
        payload: {
          advisorId: selectedDoctor.id,
          hiringModel,
          notes: farmerComment.trim(),
        },
      });

      const message = `Adoption request and your crop notes sent to Dr. ${selectedDoctor.name}! You will be notified as soon as they review your crop.`;
      if (Platform.OS === 'web') alert(message);
      else Alert.alert('Request Sent 🤝', message);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send adoption request. Please try again.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // UTR submission handler for UPI Gateway
  const handleSubmitUtr = async () => {
    if (!upiCheckoutData || !crop || !selectedDoctor) return;
    if (!utrInput.trim()) {
      const msg = 'Please enter the 12-digit UPI UTR / Transaction Reference Number.';
      Platform.OS === 'web' ? alert(msg) : Alert.alert('Notice', msg);
      return;
    }

    tap();
    setIsSubmittingUtr(true);
    try {
      await submitPayment.mutateAsync({
        id: upiCheckoutData.id,
        utr: utrInput.trim(),
      });

      const hiringModel =
        selectedPlanModel === 'PAY_PER_CONSULTATION'
          ? 'PAY_PER_CONSULTATION'
          : selectedPlanModel === 'MONTHLY_SUBSCRIPTION' || selectedPlanModel === 'ADDITIONAL_CROP'
          ? 'MONTHLY_SUBSCRIPTION'
          : 'PER_CROP';

      await submitCrop.mutateAsync({
        id: crop.id,
        payload: {
          advisorId: selectedDoctor.id,
          hiringModel,
          notes: farmerComment.trim() || 'Paid consultation adoption request',
        },
      });

      const msg = `✅ Payment verified with UTR ${utrInput.trim()}! Adoption request sent to Dr. ${selectedDoctor.name}.`;
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Payment & Adoption Sent 🤝', msg);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not verify payment UTR. Please check the reference number.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('UTR Verification Error', msg);
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleCopyVpa = () => {
    tap();
    if (!upiCheckoutData) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiCheckoutData.payeeVpa);
    }
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  if (!visible || !crop) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <LinearGradient colors={['#090e17', '#0f172a', '#062817']} style={styles.header}>
            <View style={styles.modalCorporateStrip}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, flex: 1 }}>
                <Ionicons name="shield-checkmark" size={11} color="#4ade80" />
                <Text style={styles.modalCorporateText} numberOfLines={1}>
                  FARMSKING TECHNOLOGIES PRIVATE LIMITED · CIN: U62013PB2026PTC070389
                </Text>
              </View>
              <View style={styles.modalIcarBadge}>
                <Text style={styles.modalIcarText}>ISO 9001 & 27001 AUDITED</Text>
              </View>
            </View>

            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconBox}>
                <Ionicons name={isSecondOpinion ? 'medkit' : 'shield-checkmark'} size={20} color="#00ff87" />
              </View>
              <View style={styles.headerTextCol}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={styles.headerTitle}>
                    {isSecondOpinion ? 'Get Second Opinion' : 'Adopt Certified Crop Doctor'}
                  </Text>
                  {isSecondOpinion ? (
                    <View style={styles.secondOpinionPill}>
                      <Text style={styles.secondOpinionPillText}>INDEPENDENT AUDIT</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.headerSubtitle}>
                  {isSecondOpinion
                    ? `Second opinion review for ${crop.cropName}`
                    : `Direct doctor supervision for ${crop.cropName}`}
                </Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                <Ionicons name="close" size={22} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Crop Info Pill */}
            <View style={styles.cropMetaStrip}>
              <View style={styles.cropMetaItem}>
                <Text style={styles.cropMetaLabel}>Crop</Text>
                <Text style={styles.cropMetaVal}>{crop.cropName}</Text>
              </View>
              <View style={styles.cropMetaDivider} />
              <View style={styles.cropMetaItem}>
                <Text style={styles.cropMetaLabel}>Category</Text>
                <Text style={styles.cropMetaVal}>{crop.category || 'General'}</Text>
              </View>
              <View style={styles.cropMetaDivider} />
              <View style={styles.cropMetaItem}>
                <Text style={styles.cropMetaLabel}>Variety</Text>
                <Text style={styles.cropMetaVal}>{crop.variety || 'Standard'}</Text>
              </View>
              <View style={styles.cropMetaDivider} />
              <View style={styles.cropMetaItem}>
                <Text style={styles.cropMetaLabel}>Stage</Text>
                <Text style={styles.cropMetaVal}>{crop.stage}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* 3-STEP PROGRESSIVE STEP BAR */}
          {!upiCheckoutData && (
            <View style={styles.stepProgressBar}>
              <TouchableOpacity
                style={[styles.stepTab, currentStep === 1 && styles.stepTabActive]}
                onPress={() => {
                  tap();
                  setCurrentStep(1);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.stepNumCircle, currentStep === 1 ? styles.stepNumCircleActive : currentStep > 1 ? styles.stepNumCircleDone : null]}>
                  {currentStep > 1 ? (
                    <Ionicons name="checkmark" size={12} color="#090e17" />
                  ) : (
                    <Text style={[styles.stepNumText, currentStep === 1 && styles.stepNumTextActive]}>1</Text>
                  )}
                </View>
                <Text style={[styles.stepTabText, currentStep === 1 && styles.stepTabTextActive]}>1. Doctor</Text>
              </TouchableOpacity>

              <View style={[styles.stepLine, currentStep >= 2 && styles.stepLineActive]} />

              <TouchableOpacity
                style={[styles.stepTab, currentStep === 2 && styles.stepTabActive]}
                disabled={!selectedDoctor}
                onPress={() => {
                  if (selectedDoctor && ensureGalleryComplete()) {
                    tap();
                    setCurrentStep(2);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.stepNumCircle, currentStep === 2 ? styles.stepNumCircleActive : currentStep > 2 ? styles.stepNumCircleDone : null]}>
                  {currentStep > 2 ? (
                    <Ionicons name="checkmark" size={12} color="#090e17" />
                  ) : (
                    <Text style={[styles.stepNumText, currentStep === 2 && styles.stepNumTextActive]}>2</Text>
                  )}
                </View>
                <Text style={[styles.stepTabText, currentStep === 2 && styles.stepTabTextActive]}>2. Package</Text>
              </TouchableOpacity>

              <View style={[styles.stepLine, currentStep >= 3 && styles.stepLineActive]} />

              <TouchableOpacity
                style={[styles.stepTab, currentStep === 3 && styles.stepTabActive]}
                disabled={!selectedDoctor || !selectedPlanModel}
                onPress={() => {
                  if (selectedDoctor && selectedPlanModel && ensureGalleryComplete()) {
                    tap();
                    setCurrentStep(3);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.stepNumCircle, currentStep === 3 ? styles.stepNumCircleActive : null]}>
                  <Text style={[styles.stepNumText, currentStep === 3 && styles.stepNumTextActive]}>3</Text>
                </View>
                <Text style={[styles.stepTabText, currentStep === 3 && styles.stepTabTextActive]}>3. Notes & Bill</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* GALLERY VERIFICATION WARNING BANNER (ONLY FOR ONE-TIME / PAY_PER_CONSULTATION) */}
          {(selectedPlanModel === 'PAY_PER_CONSULTATION' || isSecondOpinion) &&
            galleryCheckResult &&
            !galleryCheckResult.isComplete &&
            !upiCheckoutData && (
              <View style={styles.galleryWarningBoxCompact}>
                <Ionicons name="warning" size={14} color="#f59e0b" style={{ marginTop: 1 }} />
                <Text style={styles.galleryWarningTextCompact}>
                  <Text style={{ fontFamily: FONT.bold, color: '#fbbf24' }}>Crop Media Required: </Text>
                  {galleryCheckResult.missingItems.join(', ')}. Complete in Crop Gallery for one-time review.
                </Text>
              </View>
            )}

          {/* Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {/* UPI GATEWAY CHECKOUT SCREEN */}
            {upiCheckoutData ? (
              <View style={{ gap: 14 }}>
                <TouchableOpacity
                  style={styles.backBtnRow}
                  onPress={() => {
                    tap();
                    setUpiCheckoutData(null);
                  }}
                >
                  <Ionicons name="arrow-back" size={16} color="#00ff87" />
                  <Text style={styles.backBtnText}>Change Package or Notes</Text>
                </TouchableOpacity>

                <View style={styles.trustStripBox}>
                  <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.trustStripTitle}>Official UPI Direct Payment Gateway</Text>
                    <Text style={styles.trustStripSub}>FARMSKING TECHNOLOGIES PRIVATE LIMITED · 0% Additional Fee</Text>
                  </View>
                </View>

                <View style={styles.checkoutSummaryCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <Text style={styles.checkoutSummaryLabel}>Total Amount Payable:</Text>
                    <Text style={styles.checkoutSummaryAmount}>₹{upiCheckoutData.amount.toLocaleString('en-IN')}</Text>
                  </View>
                  <Text style={styles.checkoutSummarySub}>
                    Doctor: Dr. {upiCheckoutData.doctorName} · {upiCheckoutData.planName}
                  </Text>
                </View>

                {/* Step 1: QR Code Card */}
                <View style={styles.qrCodeContainer}>
                  <Text style={styles.qrHeaderTitle}>Step 1: Scan QR Code with Any UPI App</Text>
                  <Text style={styles.qrHeaderSub}>Google Pay · PhonePe · Paytm · BHIM · Amazon Pay</Text>
                  <View style={styles.qrImageWrapper}>
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=1&ecc=H&data=${encodeURIComponent(upiCheckoutData.upiLink)}`,
                      }}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                  </View>

                  <View style={styles.vpaPillRow}>
                    <Text style={styles.vpaLabel}>UPI ID:</Text>
                    <Text style={styles.vpaValue}>{upiCheckoutData.payeeVpa}</Text>
                    <TouchableOpacity style={styles.copyVpaBtn} onPress={handleCopyVpa}>
                      <Ionicons name={copiedVpa ? 'checkmark' : 'copy-outline'} size={13} color="#ffffff" />
                      <Text style={styles.copyVpaBtnText}>{copiedVpa ? 'Copied!' : 'Copy'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Mobile direct intent */}
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
                <View style={styles.utrStepBox}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>2</Text>
                    </View>
                    <Text style={styles.utrStepTitle}>Enter 12-Digit UPI Transaction / UTR Number</Text>
                  </View>
                  <Text style={styles.utrStepDesc}>
                    After paying in your UPI app, enter the 12-digit UTR reference number from your receipt:
                  </Text>
                  <TextInput
                    style={styles.utrInput}
                    placeholder="e.g. 431289567812"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    maxLength={16}
                    value={utrInput}
                    onChangeText={setUtrInput}
                  />

                  <TouchableOpacity
                    style={[styles.submitUtrBtn, (!utrInput.trim() || isSubmittingUtr) && styles.submitBtnDisabled]}
                    onPress={handleSubmitUtr}
                    disabled={!utrInput.trim() || isSubmittingUtr}
                  >
                    {isSubmittingUtr ? (
                      <ActivityIndicator size="small" color="#090e17" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark" size={16} color="#090e17" />
                        <Text style={styles.submitBtnText}>Confirm Payment & Activate Doctor</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#00ff87" />
                <Text style={styles.loadingText}>Finding certified specialists for {crop.category || crop.cropName}...</Text>
              </View>
            ) : !advisors || advisors.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="alert-circle-outline" size={44} color="#f59e0b" />
                <Text style={styles.emptyTitle}>No Matching Specialists Found</Text>
                <Text style={styles.emptyDesc}>
                  Currently no certified doctors have registered for the {crop.category || crop.cropName} category. Please contact FarmsKing Agronomy Support.
                </Text>
              </View>
            ) : (
              <>
                {/* STEP 1: SELECT DOCTOR (HIRED DOCTORS FILTER) */}
                {currentStep === 1 && (
                  <>
                    <View style={styles.stepHeaderRow}>
                      <Text style={styles.sectionHeader}>
                        {showAllDoctors
                          ? `All Available Specialists (${advisors.length})`
                          : `Hired Specialists (${hiredDoctors.length})`}
                      </Text>
                      {hiredDoctors.length > 0 && (
                        <TouchableOpacity
                          style={styles.toggleAllBtn}
                          onPress={() => {
                            tap();
                            setShowAllDoctors((prev) => !prev);
                          }}
                        >
                          <Text style={styles.toggleAllBtnText}>
                            {showAllDoctors ? 'Hired Only' : 'Browse All'}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {hiredDoctors.length === 0 && !showAllDoctors ? (
                      <View style={styles.noHiredCard}>
                        <View style={styles.noHiredIconBox}>
                          <Ionicons name="medkit" size={24} color="#00ff87" />
                        </View>
                        <Text style={styles.noHiredTitle}>No Hired Doctor Found</Text>
                        <Text style={styles.noHiredSub}>
                          Hire a dedicated Crop Doctor first under Crop Doctor Care to adopt this crop under direct supervision.
                        </Text>
                        <TouchableOpacity
                          style={styles.hireDoctorCtaBtn}
                          onPress={() => {
                            tap();
                            onClose();
                            if (onUpgradePlan) onUpgradePlan();
                          }}
                        >
                          <Ionicons name="add-circle" size={15} color="#090e17" />
                          <Text style={styles.hireDoctorCtaText}>Hire a Crop Doctor</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.browseAllLinkBtn}
                          onPress={() => {
                            tap();
                            setShowAllDoctors(true);
                          }}
                        >
                          <Text style={styles.browseAllLinkText}>Browse all available doctors ▼</Text>
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <View style={styles.doctorsList}>
                        {displayedDoctors.map((advisor) => {
                          const isAlreadyAssigned = Boolean(
                            (advisor as any).isAlreadyAssignedToThisCrop ||
                            (crop?.assignedAdvisorId === advisor.id && crop?.advisorReviewStatus !== 'NONE'),
                          );
                          const isSelected = selectedDoctor?.id === advisor.id;
                          const avatar = resolveMediaUrl(advisor.photoUrl) || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120';
                          const quota = advisor.quota;

                          return (
                            <TouchableOpacity
                              key={advisor.id}
                              style={[
                                styles.doctorCard,
                                isSelected && styles.doctorCardSelected,
                                isAlreadyAssigned && styles.doctorCardDisabled,
                              ]}
                              disabled={isAlreadyAssigned}
                              onPress={() => {
                                tap();
                                setSelectedDoctorId(advisor.id);
                              }}
                            >
                              <View style={styles.doctorHeaderRow}>
                                <Image source={{ uri: avatar }} style={styles.doctorAvatar} />
                                <View style={styles.doctorInfoCol}>
                                  <View style={styles.doctorNameRow}>
                                    <Text style={styles.doctorName}>{advisor.name}</Text>
                                    <View style={styles.verifiedBadge}>
                                      <Ionicons name="checkmark-circle" size={13} color="#00ff87" />
                                      <Text style={styles.verifiedText}>Verified</Text>
                                    </View>
                                  </View>

                                  <Text style={styles.doctorSpecialty} numberOfLines={1}>
                                    {advisor.profileTitle || advisor.specialization || 'Agronomy Specialist'}
                                  </Text>

                                  <View style={styles.doctorRatingRow}>
                                    <Ionicons name="star" size={13} color="#f59e0b" />
                                    <Text style={styles.doctorRatingVal}>{advisor.rating ? advisor.rating.toFixed(1) : '5.0'}</Text>
                                    <Text style={styles.doctorRatingCount}>({advisor.ratingCount || 12} reviews)</Text>
                                    <Text style={styles.doctorKingId}>• {advisor.kingId || 'FK-DOC'}</Text>
                                  </View>
                                </View>

                                {isAlreadyAssigned ? (
                                  <View style={styles.alreadyAssignedBadge}>
                                    <Ionicons name="shield-checkmark" size={12} color="#f59e0b" />
                                    <Text style={styles.alreadyAssignedText}>Assigned</Text>
                                  </View>
                                ) : (
                                  <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                                    {isSelected && <View style={styles.radioInner} />}
                                  </View>
                                )}
                              </View>

                              {/* Quota / Status Badges */}
                              {isAlreadyAssigned ? (
                                <View style={styles.alreadyAssignedPill}>
                                  <Ionicons name="checkmark-done" size={13} color="#f59e0b" />
                                  <Text style={styles.alreadyAssignedPillText}>
                                    Already assigned to this crop.
                                  </Text>
                                </View>
                              ) : quota?.quotaStatus === 'INCLUDED_FREE' ? (
                                <View style={styles.freeQuotaPill}>
                                  <Ionicons name="gift" size={13} color="#10b981" />
                                  <Text style={styles.freeQuotaText}>
                                    Monthly Retainer ({quota.freeSlotsRemaining} free slot left)
                                  </Text>
                                </View>
                              ) : quota?.quotaStatus === 'ADDITIONAL_CROP_FEE' ? (
                                <View style={styles.extraQuotaPill}>
                                  <Ionicons name="layers" size={13} color="#6366f1" />
                                  <Text style={styles.extraQuotaText}>
                                    Monthly Active • Add-on: ₹{quota.additionalCropFee}/mo
                                  </Text>
                                </View>
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </>
                )}

                {/* STEP 2: CHOOSE PACKAGE */}
                {currentStep === 2 && selectedDoctor && (
                  <View style={styles.plansSection}>
                    {/* Active Selected Doctor Banner */}
                    <View style={styles.activeSelectionBanner}>
                      <Image source={{ uri: resolveMediaUrl(selectedDoctor.photoUrl) || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120' }} style={styles.activeSelectionAvatar} />
                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.activeSelectionName}>Dr. {selectedDoctor.name}</Text>
                          <View style={styles.verifiedBadge}>
                            <Ionicons name="checkmark-circle" size={11} color="#00ff87" />
                            <Text style={styles.verifiedText}>Verified</Text>
                          </View>
                        </View>
                        <Text style={styles.activeSelectionSpec} numberOfLines={1}>
                          {selectedDoctor.profileTitle || selectedDoctor.specialization || 'Agronomy Specialist'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.changeSelectionBtn}
                        onPress={() => {
                          tap();
                          setCurrentStep(1);
                        }}
                      >
                        <Ionicons name="swap-horizontal" size={13} color="#00ff87" />
                        <Text style={styles.changeSelectionText}>Change</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={[styles.sectionHeader, { marginTop: 4 }]}>Step 2: Choose Consultation Package</Text>

                    {/* CASE 1: FARMER HAS RUNNING MONTHLY CARE (RANK 3 - HIGHEST) */}
                    {runningPlanRank === 3 && !isSecondOpinion ? (
                      <>
                        <View style={styles.planNoticeCard}>
                          <Ionicons name="information-circle" size={15} color="#38bdf8" />
                          <Text style={styles.planNoticeText}>
                            Active Monthly Retainer with Dr. {selectedDoctor.name}. Lower tiers closed.
                          </Text>
                        </View>

                        {selectedDoctor.quota?.quotaStatus === 'INCLUDED_FREE' ? (
                          <TouchableOpacity
                            style={[styles.planCard, selectedPlanModel === 'INCLUDED_FREE' && styles.planCardActive]}
                            onPress={() => {
                              tap();
                              setSelectedPlanModel('INCLUDED_FREE');
                            }}
                          >
                            <View style={styles.planCardLeft}>
                              <View style={styles.planBadgeGreen}>
                                <Text style={styles.planBadgeTextGreen}>ACTIVE MONTHLY BENEFIT</Text>
                              </View>
                              <Text style={styles.planName}>Monthly Retainer Included Slot</Text>
                              <Text style={styles.planDesc}>
                                This crop will be added under your active Monthly Care Plan with Dr. {selectedDoctor.name} at zero additional cost.
                              </Text>
                            </View>
                            <View style={styles.planPriceBox}>
                              <Text style={styles.planPriceFree}>FREE</Text>
                              <Text style={styles.planPriceSub}>Included</Text>
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <>
                            <View style={styles.quotaFullUpgradeCard}>
                              <View style={{ flex: 1, gap: 3 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                                  <Ionicons name="alert-circle" size={15} color="#7c3aed" />
                                  <Text style={styles.quotaFullUpgradeTitle}>
                                    All Included Crop Slots Active ({selectedDoctor.quota?.activeCropsUnderAdvisor}/{selectedDoctor.quota?.monthlyIncludedCrops})
                                  </Text>
                                </View>
                                <Text style={styles.quotaFullUpgradeDesc}>
                                  All included crop slots under Dr. {selectedDoctor.name} are active. Add this crop as a monthly add-on below.
                                </Text>
                              </View>
                            </View>

                            <TouchableOpacity
                              style={[styles.planCard, selectedPlanModel === 'ADDITIONAL_CROP' && styles.planCardActive]}
                              onPress={() => {
                                tap();
                                setSelectedPlanModel('ADDITIONAL_CROP');
                              }}
                            >
                              <View style={styles.planCardLeft}>
                                <View style={styles.planBadgeIndigo}>
                                  <Text style={styles.planBadgeTextIndigo}>MONTHLY ADD-ON</Text>
                                </View>
                                <Text style={styles.planName}>Additional Crop Monthly Care</Text>
                                <Text style={styles.planDesc}>
                                  Extends your monthly care coverage to this extra crop with full weekly spray charts.
                                </Text>
                              </View>
                              <View style={styles.planPriceBox}>
                                <Text style={styles.planPriceVal}>
                                  {isExplicitlyFree(selectedDoctor.quota?.additionalCropFee) ? '₹0 (FREE)' : `₹${parsePlanFee(selectedDoctor.quota?.additionalCropFee, 300)}`}
                                </Text>
                                <Text style={styles.planPriceSub}>/ month</Text>
                              </View>
                            </TouchableOpacity>
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        {/* CASE 2 & 3: STANDARD HIERARCHY (NO ACTIVE MONTHLY) */}
                        {/* Notice if Per Crop or SOS is already running */}
                        {runningPlanRank === 2 ? (
                          <View style={styles.planNoticeCard}>
                            <Ionicons name="information-circle" size={15} color="#38bdf8" />
                            <Text style={styles.planNoticeText}>
                              Season Care active on this crop. Upgrade to Monthly Care anytime.
                            </Text>
                          </View>
                        ) : runningPlanRank === 1 ? (
                          <View style={styles.planNoticeCard}>
                            <Ionicons name="information-circle" size={15} color="#38bdf8" />
                            <Text style={styles.planNoticeText}>
                              Single consultation completed. Upgrade to Season or Monthly Care.
                            </Text>
                          </View>
                        ) : null}

                        {!isSecondOpinion && (
                          <View style={styles.planGrid}>
                            {/* Per-Crop Season (Rank 2) - Disabled if already running */}
                            <TouchableOpacity
                              style={[
                                styles.planGridCard,
                                selectedPlanModel === 'PER_CROP' && styles.planCardActive,
                                runningPlanRank >= 2 && styles.planCardDisabled,
                              ]}
                              disabled={runningPlanRank >= 2}
                              onPress={() => {
                                tap();
                                setSelectedPlanModel('PER_CROP');
                              }}
                            >
                              <View style={styles.planBadgeBlue}>
                                <Text style={styles.planBadgeTextBlue}>
                                  {runningPlanRank >= 2 ? 'ACTIVE / ALREADY TAKEN' : 'POPULAR'}
                                </Text>
                              </View>
                              <Text style={styles.planGridTitle}>Per Crop Season</Text>
                              <Text style={styles.planGridDesc}>Full 120-day cycle supervision from sowing to harvest.</Text>
                              <Text style={styles.planGridPrice}>
                                {isExplicitlyFree(selectedDoctor.feePerCropSeason) ? '₹0 (FREE)' : `₹${parsePlanFee(selectedDoctor.feePerCropSeason, 499)}`}
                              </Text>
                              <Text style={styles.planGridSub}>per crop cycle</Text>
                            </TouchableOpacity>

                            {/* Monthly Retainer (Rank 3) - Higher Tier */}
                            <TouchableOpacity
                              style={[
                                styles.planGridCard,
                                selectedPlanModel === 'MONTHLY_SUBSCRIPTION' && styles.planCardActive,
                              ]}
                              onPress={() => {
                                tap();
                                setSelectedPlanModel('MONTHLY_SUBSCRIPTION');
                              }}
                            >
                              <View style={styles.planBadgePurple}>
                                <Text style={styles.planBadgeTextPurple}>MULTI-CROP VIP</Text>
                              </View>
                              <Text style={styles.planGridTitle}>Monthly Care</Text>
                              <Text style={styles.planGridDesc}>
                                Retainer covers up to {selectedDoctor.monthlyIncludedCrops || 3} crops with VOIP consultations.
                              </Text>
                              <Text style={styles.planGridPrice}>
                                {isExplicitlyFree(selectedDoctor.feeVipMonthly) ? '₹0 (FREE)' : `₹${parsePlanFee(selectedDoctor.feeVipMonthly, 1999)}`}
                              </Text>
                              <Text style={styles.planGridSub}>per month</Text>
                            </TouchableOpacity>
                          </View>
                        )}

                        {/* One-Time Consultation (Rank 1 - Smallest) */}
                        {/* Disabled if a larger plan (Rank 2 or 3) is running */}
                        <TouchableOpacity
                          style={[
                            styles.planCard,
                            selectedPlanModel === 'PAY_PER_CONSULTATION' && styles.planCardActive,
                            runningPlanRank >= 1 && styles.planCardDisabled,
                            { marginTop: 10 },
                          ]}
                          disabled={runningPlanRank >= 1}
                          onPress={() => {
                            tap();
                            setSelectedPlanModel('PAY_PER_CONSULTATION');
                          }}
                        >
                          <View style={styles.planCardLeft}>
                            <View style={styles.planBadgeAmber}>
                              <Text style={styles.planBadgeTextAmber}>
                                {runningPlanRank >= 1 ? 'CLOSED (HIGHER TIER ACTIVE)' : 'ONE-TIME SOS'}
                              </Text>
                            </View>
                            <Text style={styles.planName}>Single Prescription / Second Opinion</Text>
                            <Text style={styles.planDesc}>
                              Instant leaf diagnosis, prescription chart, and direct in-app VOIP consultation for this specific issue.
                            </Text>
                          </View>
                          <View style={styles.planPriceBox}>
                            <Text style={styles.planPriceVal}>
                              {isExplicitlyFree(selectedDoctor.feePerConsultation) ? '₹0 (FREE)' : `₹${parsePlanFee(selectedDoctor.feePerConsultation, 99)}`}
                            </Text>
                            <Text style={styles.planPriceSub}>one-time</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                )}

                {/* STEP 3: NOTES & STATUTORY BILL */}
                {currentStep === 3 && selectedDoctor && (
                  <View style={styles.plansSection}>
                    {/* Review Summary Card */}
                    <View style={styles.reviewSummaryCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <Image source={{ uri: resolveMediaUrl(selectedDoctor.photoUrl) || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120' }} style={styles.reviewAvatar} />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.reviewDoctorName}>Dr. {selectedDoctor.name}</Text>
                            <Text style={styles.reviewPlanName}>{getPlanLabel(selectedPlanModel)}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.changeSelectionBtn}
                          onPress={() => {
                            tap();
                            setCurrentStep(2);
                          }}
                        >
                          <Ionicons name="create-outline" size={13} color="#00ff87" />
                          <Text style={styles.changeSelectionText}>Edit</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* MANDATORY FARMER COMMENT BOX */}
                    <View style={styles.commentBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Ionicons name="chatbubble-ellipses" size={15} color="#00ff87" />
                        <Text style={styles.commentBoxTitle}>
                          Farmer Message / Symptoms for Dr. {selectedDoctor.name} *
                        </Text>
                      </View>
                      <Text style={styles.commentBoxSub}>
                        Describe current crop health, leaf symptoms, recent sprays, or questions for the doctor:
                      </Text>
                      <TextInput
                        style={styles.commentTextInput}
                        placeholder="e.g. Yellow leaf spots appeared 3 days ago. Sprayed neem bio-spray yesterday. Need guidance on next spray..."
                        placeholderTextColor="#64748b"
                        multiline
                        numberOfLines={3}
                        value={farmerComment}
                        onChangeText={setFarmerComment}
                      />
                    </View>

                    {/* ITEMIZED STATUTORY BILLING & LEGAL INVOICE BREAKDOWN */}
                    <View style={styles.statutoryCard}>
                      <View style={styles.statutoryHeaderRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="receipt" size={14} color="#4ade80" />
                          <Text style={styles.statutoryTitle}>Itemized Statutory Fee Breakdown</Text>
                        </View>
                        <View style={styles.statutoryIcarPill}>
                          <Ionicons name="shield-checkmark" size={10} color="#38bdf8" />
                          <Text style={styles.statutoryIcarText}>ISO 9001 & 27001 COMPLIANT</Text>
                        </View>
                      </View>

                      {/* LINE 1: DOCTOR ADVISORY FEE */}
                      <View style={styles.statutoryRow}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <Text style={styles.statutoryLabel}>
                            {isSecondOpinion ? 'Doctor Second Opinion Consultation Fee' : 'Certified Doctor Agronomy Fee'}
                          </Text>
                          <Text style={styles.statutorySub}>
                            Professional advisory fee decided by Dr. {selectedDoctor.name}
                          </Text>
                        </View>
                        <Text style={styles.statutoryVal}>₹{pricingBreakdown.advisorFee}</Text>
                      </View>

                      {/* LINE 2: SECURE CLOUD STORAGE & PLATFORM INFRASTRUCTURE FEE (10%) */}
                      <View style={styles.statutoryRow}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Text style={styles.statutoryLabel}>
                              Secure Cloud Server & Diagnostic Storage (10%)
                            </Text>
                            <View style={styles.mandatoryPill}>
                              <Text style={styles.mandatoryPillText}>Mandatory</Text>
                            </View>
                          </View>
                          <Text style={styles.statutorySub}>
                            Encrypted leaf photo/video storage, high-speed telemetry & 24/7 server infrastructure
                          </Text>
                        </View>
                        <Text style={styles.statutoryVal}>₹{pricingBreakdown.platformFee}</Text>
                      </View>

                      {/* LINE 3: STATUTORY GST (18%) */}
                      <View style={styles.statutoryRow}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Text style={styles.statutoryLabel}>
                              Statutory GST (18% Govt. Tax)
                            </Text>
                            <View style={styles.govtTaxPill}>
                              <Text style={styles.govtTaxPillText}>CGST 9% + SGST 9%</Text>
                            </View>
                          </View>
                          <Text style={styles.statutorySub}>
                            Government recognized digital tax invoice generated under statutory corporate law
                          </Text>
                        </View>
                        <Text style={styles.statutoryVal}>₹{pricingBreakdown.gstTax}</Text>
                      </View>

                      <View style={styles.statutoryDivider} />

                      {/* TOTAL AMOUNT PAYABLE */}
                      <View style={styles.statutoryTotalRow}>
                        <View>
                          <Text style={styles.statutoryTotalLabel}>Total Amount Payable</Text>
                          <Text style={styles.statutoryTotalSub}>All statutory taxes & secure cloud hosting included</Text>
                        </View>
                        <Text style={styles.statutoryTotalVal}>₹{pricingBreakdown.totalPayable}</Text>
                      </View>

                      {/* INSTITUTIONAL CORPORATE TRUST FOOTNOTE */}
                      <View style={styles.statutoryFooterStrip}>
                        <Ionicons name="business" size={11} color="#86efac" />
                        <Text style={styles.statutoryFooterText}>
                          FARMSKING TECHNOLOGIES PRIVATE LIMITED · CIN: U62013PB2026PTC070389 · B2C LEGAL INVOICE
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer Actions */}
          {!upiCheckoutData && (
            <View style={styles.footer}>
              {currentStep === 1 ? (
                <>
                  <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.submitBtn, !selectedDoctor && styles.submitBtnDisabled]}
                    onPress={handleStep1Next}
                    disabled={!selectedDoctor}
                  >
                    <Text style={styles.submitBtnText}>Next: Choose Package</Text>
                    <Ionicons name="arrow-forward" size={16} color="#090e17" />
                  </TouchableOpacity>
                </>
              ) : currentStep === 2 ? (
                <>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      tap();
                      setCurrentStep(1);
                    }}
                  >
                    <Text style={styles.cancelBtnText}>← Back to Doctors</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.submitBtn} onPress={handleStep2Next}>
                    <Text style={styles.submitBtnText}>Next: Notes & Bill</Text>
                    <Ionicons name="arrow-forward" size={16} color="#090e17" />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      tap();
                      setCurrentStep(2);
                    }}
                    disabled={isSubmitting}
                  >
                    <Text style={styles.cancelBtnText}>← Back to Packages</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.submitBtn,
                      (!selectedDoctor || isSubmitting) && styles.submitBtnDisabled,
                    ]}
                    onPress={handleSubmit}
                    disabled={!selectedDoctor || isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#090e17" />
                    ) : (
                      <>
                        <Ionicons name="shield-checkmark" size={16} color="#090e17" />
                        <Text style={styles.submitBtnText}>
                          {pricingBreakdown.totalPayable === 0
                            ? 'Activate Free Adoption (₹0)'
                            : `Pay & Adopt via Payment Gateway • ₹${pricingBreakdown.totalPayable}`}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    backgroundColor: '#090e17',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCorporateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.07)',
    marginBottom: 10,
  },
  modalCorporateText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#86efac',
    letterSpacing: 0.3,
  },
  modalIcarBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  modalIcarText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
    letterSpacing: 0.4,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  secondOpinionPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  secondOpinionPillText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cropMetaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  cropMetaItem: {
    flex: 1,
  },
  cropMetaLabel: {
    fontSize: 9,
    fontFamily: FONT.semiBold,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  cropMetaVal: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#00ff87',
    marginTop: 1,
  },
  cropMetaDivider: {
    width: 1,
    height: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 8,
  },

  // 3-Step Progress Bar
  stepProgressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#0c1424',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  stepTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: RADIUS.pill,
  },
  stepTabActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
  },
  stepNumCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumCircleActive: {
    backgroundColor: '#00ff87',
  },
  stepNumCircleDone: {
    backgroundColor: '#00ff87',
  },
  stepNumText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  stepNumTextActive: {
    color: '#090e17',
    fontFamily: FONT.extraBold,
  },
  stepTabText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  stepTabTextActive: {
    color: '#00ff87',
    fontFamily: FONT.extraBold,
  },
  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#00ff87',
  },

  // Gallery verification box (compact)
  galleryWarningBoxCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  galleryWarningTextCompact: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  toggleAllBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  toggleAllBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  noHiredCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
    marginVertical: 10,
  },
  noHiredIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  noHiredTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  noHiredSub: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 16,
  },
  hireDoctorCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00ff87',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    marginTop: 6,
  },
  hireDoctorCtaText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#090e17',
  },
  browseAllLinkBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginTop: 2,
  },
  browseAllLinkText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    textDecorationLine: 'underline',
  },
  galleryWarningBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderBottomWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  galleryWarningTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  galleryWarningDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginTop: 2,
  },
  galleryWarningItem: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#fde68a',
  },
  galleryWarningFootnote: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Body
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: 18,
    gap: 14,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  emptyDesc: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 380,
  },
  sectionHeader: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#cbd5e1',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  doctorsList: {
    gap: 10,
  },
  doctorCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  doctorCardSelected: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.05)',
  },
  doctorCardDisabled: {
    opacity: 0.55,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  doctorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1e293b',
  },
  doctorInfoCol: {
    flex: 1,
    gap: 2,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  doctorName: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  doctorSpecialty: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  doctorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doctorRatingVal: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#f59e0b',
  },
  doctorRatingCount: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  doctorKingId: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#38bdf8',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleSelected: {
    borderColor: '#00ff87',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00ff87',
  },
  alreadyAssignedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  alreadyAssignedText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  alreadyAssignedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  alreadyAssignedPillText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#fde68a',
    flex: 1,
  },
  freeQuotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  freeQuotaText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  extraQuotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  extraQuotaText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#818cf8',
  },

  // Step 2
  plansSection: {
    gap: 12,
  },
  activeSelectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.06)',
    borderColor: 'rgba(0, 255, 135, 0.25)',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 10,
    gap: 10,
  },
  activeSelectionAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1e293b',
  },
  activeSelectionName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  activeSelectionSpec: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  changeSelectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  changeSelectionText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  planNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: RADIUS.md,
    padding: 10,
  },
  planNoticeText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#bae6fd',
    lineHeight: 16,
  },
  quotaFullUpgradeCard: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  quotaFullUpgradeTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#c084fc',
  },
  quotaFullUpgradeDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    marginTop: 2,
  },
  planGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  planGridCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planCardActive: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.05)',
  },
  planCardDisabled: {
    opacity: 0.45,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  planCardLeft: {
    flex: 1,
    gap: 3,
  },
  planBadgeGreen: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  planBadgeTextGreen: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#10b981',
  },
  planBadgeIndigo: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  planBadgeTextIndigo: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#818cf8',
  },
  planBadgeBlue: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  planBadgeTextBlue: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
  },
  planBadgePurple: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  planBadgeTextPurple: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#c084fc',
  },
  planBadgeAmber: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
  },
  planBadgeTextAmber: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#fbbf24',
  },
  planName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  planDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 15,
  },
  planGridTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  planGridDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 15,
    minHeight: 30,
  },
  planGridPrice: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  planGridSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  planPriceBox: {
    alignItems: 'flex-end',
  },
  planPriceVal: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  planPriceFree: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#10b981',
  },
  planPriceSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },

  // Step 3 Review & Notes
  reviewSummaryCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 8,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
  },
  reviewDoctorName: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  reviewPlanName: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    color: '#4ade80',
    marginTop: 2,
  },
  commentBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  commentBoxTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  commentBoxSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginBottom: 8,
  },
  commentTextInput: {
    backgroundColor: '#050a12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.md,
    padding: 10,
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.medium,
    minHeight: 65,
    textAlignVertical: 'top',
  },
  statutoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 10,
  },
  statutoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  statutoryTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  statutoryIcarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statutoryIcarText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
  },
  statutoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statutoryLabel: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  mandatoryPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  mandatoryPillText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  govtTaxPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  govtTaxPillText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  statutorySub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  statutoryVal: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  statutoryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statutoryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statutoryTotalLabel: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  statutoryTotalSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  statutoryTotalVal: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  statutoryFooterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  statutoryFooterText: {
    fontSize: 8.5,
    fontFamily: FONT.semiBold,
    color: '#64748b',
    letterSpacing: 0.3,
  },

  // UPI Gateway Checkout
  backBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  trustStripBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  trustStripTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#34d399',
  },
  trustStripSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  checkoutSummaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  checkoutSummaryLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  checkoutSummaryAmount: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  checkoutSummarySub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 4,
  },
  qrCodeContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  qrHeaderTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  qrHeaderSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
  qrImageWrapper: {
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: RADIUS.md,
    marginVertical: 4,
  },
  qrImage: {
    width: 170,
    height: 170,
  },
  vpaPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#050a12',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 6,
  },
  vpaLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  vpaValue: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#38bdf8',
  },
  copyVpaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  copyVpaBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  openUpiAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284c7',
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  openUpiAppBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  utrStepBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  stepNumberBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#090e17',
  },
  utrStepTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  utrStepDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 15,
  },
  utrInput: {
    backgroundColor: '#050a12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: RADIUS.md,
    padding: 10,
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  submitUtrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00ff87',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    marginTop: 4,
  },

  // Footer Actions
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#070b13',
  },
  cancelBtn: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00ff87',
    paddingVertical: 9,
    paddingHorizontal: 18,
    borderRadius: RADIUS.md,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#090e17',
  },
});
