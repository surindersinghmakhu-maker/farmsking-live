import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useMyCrops } from '@/src/hooks/useCrops';
import { useAvailableAdvisors, useChooseAdvisor, useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useSubscriptionStatus } from '@/src/hooks/useSubscriptionStatus';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useRedeemFarmerPlanCoupon } from '@/src/hooks/useFarmerPlan';
import { useInitiateFarmerPlanPayment } from '@/src/hooks/useFarmerPlanPayments';
import { previewFarmerPlanCoupon, FarmerPlanCouponPreview } from '@/src/api/farmerPlans.api';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

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
  const initiatePayment = useInitiateFarmerPlanPayment();
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

  // Set initial crop selection on show
  React.useEffect(() => {
    if (visible) {
      setStatusMessage(null);
      setActivatedNotice(null);
      if (initialCropId) {
        setSelectedCropId(initialCropId);
      } else if (myCrops.length > 0) {
        // Pick first unassigned crop by default
        const unassigned = myCrops.find(
          (c) => !c.assignedAdvisorId && !c.assignedAdvisor && c.advisorReviewStatus !== 'ACCEPTED',
        );
        setSelectedCropId(unassigned?.id ?? myCrops[0]?.id ?? null);
      }
    }
  }, [visible, initialCropId, myCrops]);

  // Selected Crop Object
  const selectedCrop = useMemo(() => {
    if (!selectedCropId) return null;
    return myCrops.find((c) => c.id === selectedCropId) ?? null;
  }, [selectedCropId, myCrops]);

  // Filter Doctors Matching Selected Crop
  const matchingCropDoctors = useMemo(() => {
    if (!selectedCrop) return availableAdvisors;
    return availableAdvisors.filter((advisor) => {
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
    if (!selectedAdvisorId) {
      if (consultationMode === 'CROP_WISE') {
        return matchingCropDoctors[0] ?? availableAdvisors[0] ?? null;
      }
      return availableAdvisors[0] ?? null;
    }
    return availableAdvisors.find((a) => a.id === selectedAdvisorId) ?? null;
  }, [selectedAdvisorId, matchingCropDoctors, availableAdvisors, consultationMode]);

  const isSeniorDoctor = (selectedAdv?.role as any) === 'DOCTOR' || !!(selectedAdv as any)?.isSeniorDoctor;

  // Active Advisor check (for renewal & credit adjustment)
  const isSelectedDoctorAlreadyActive = Boolean(
    myAdvisor && selectedAdv && myAdvisor.advisor?.id === selectedAdv.id,
  );

  // Pricing Calculations
  const pricingData = useMemo(() => {
    if (consultationMode === 'CROP_WISE') {
      const feeConsultation =
        selectedAdv?.feePerConsultation !== undefined && selectedAdv?.feePerConsultation !== null
          ? Number(selectedAdv.feePerConsultation)
          : 99;
      const feeSeason =
        selectedAdv?.feePerCropSeason !== undefined && selectedAdv?.feePerCropSeason !== null
          ? Number(selectedAdv.feePerCropSeason)
          : 499;

      const grossAmount = selectedCropPackage === 'PRESCRIPTION' ? feeConsultation : feeSeason;
      const isFree = grossAmount === 0;

      return {
        grossAmount,
        unusedCredit: 0,
        netPayable: grossAmount,
        isFree,
        billingPeriodDays: selectedCropPackage === 'PRESCRIPTION' ? 30 : 120,
      };
    } else {
      // Monthly VIP Retainer Mode
      const baseMonthly =
        selectedAdv?.feeVipMonthly !== undefined && selectedAdv?.feeVipMonthly !== null
          ? Number(selectedAdv.feeVipMonthly)
          : 1999;

      const discountFactor =
        monthlyDuration === 1 ? 1 : monthlyDuration === 3 ? 0.95 : monthlyDuration === 6 ? 0.9 : 0.8;
      const grossAmount = Math.round(baseMonthly * monthlyDuration * discountFactor);

      // Prorated Unused Credit Adjustment from active smaller plan
      let unusedCredit = 0;
      if (subscription?.endDate) {
        const now = new Date();
        const end = new Date(subscription.endDate);
        if (end.getTime() > now.getTime()) {
          const daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          // Calculate credit pro-rata
          const dailyRate = baseMonthly / 30;
          unusedCredit = Math.round(Math.min(grossAmount, daysRemaining * dailyRate));
        }
      }

      const netPayable = Math.max(0, grossAmount - unusedCredit);
      const billingPeriodDays =
        monthlyDuration === 1 ? 30 : monthlyDuration === 3 ? 90 : monthlyDuration === 6 ? 180 : 365;

      return {
        grossAmount,
        unusedCredit,
        netPayable,
        isFree: netPayable === 0,
        billingPeriodDays,
      };
    }
  }, [consultationMode, selectedAdv, selectedCropPackage, monthlyDuration, subscription]);

  // Handler: Free Consultation Direct Activation (No Payment Gateway needed)
  const handleFreeActivation = async () => {
    if (!selectedAdv) {
      setStatusMessage('⚠️ Please select a doctor first.');
      return;
    }
    tap();
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      await chooseAdvisorMutation.mutateAsync({
        advisorId: selectedAdv.id,
        cropId: selectedCropId ?? undefined,
      });

      queryClient.invalidateQueries({ queryKey: ['advisor-assignments'] });
      queryClient.invalidateQueries({ queryKey: ['crops'] });

      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);

      setActivatedNotice({
        doctorName: selectedAdv.name,
        cropName: selectedCrop?.cropName,
        packageName: 'Free Introductory SOS Consultation',
        validUntil: expiry.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        isFree: true,
      });
    } catch (err: any) {
      setStatusMessage(`❌ ${err?.response?.data?.message || 'Could not activate free consultation.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handler: Paid Consultation (PhonePe / Cashfree / Online Payment Gateway)
  const handleProceedToPayment = async () => {
    if (pricingData.netPayable === 0) {
      handleFreeActivation();
      return;
    }
    if (!selectedAdv) {
      setStatusMessage('⚠️ Please select a doctor first.');
      return;
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
      });

      const targetGatewayUrl =
        (res as any)?.paymentLink ||
        (res as any)?.phonepeRedirectUrl ||
        (res as any)?.cashfreePaymentLink ||
        (res.cashfreeSessionId ? `https://payments.cashfree.com/order/#${res.cashfreeSessionId}` : null) ||
        (res as any)?.razorpayShortUrl;

      if (targetGatewayUrl) {
        if (Platform.OS === 'web') {
          window.location.href = targetGatewayUrl;
        } else {
          await Linking.openURL(targetGatewayUrl);
        }
        return;
      }

      if (res.upiLink) {
        if (Platform.OS === 'web') {
          setStatusMessage('⚠️ Payment gateway connecting. Please try again in a moment.');
        } else {
          await Linking.openURL(res.upiLink).catch(() => {});
        }
      } else {
        setStatusMessage('⚠️ Payment gateway initialized. Please complete payment to activate.');
      }
    } catch (err: any) {
      setStatusMessage(`❌ ${err?.response?.data?.message || 'Could not initiate payment gateway.'}`);
    } finally {
      setIsProcessing(false);
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
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.topBadgeRow}>
                <Ionicons name="sparkles" size={13} color="#f59e0b" />
                <Text style={styles.topBadgeText}>FARMSKING CROP DOCTOR SCHEME</Text>
              </View>
              <Text style={styles.bannerTitle}>Crop Doctor & Agronomist Care</Text>
              <Text style={styles.bannerSub}>1-on-1 Certified Agronomist Consultation & Field Diagnostics</Text>
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
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 18, gap: 16 }}>
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
                    size={14}
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
                    size={14}
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
                  MODE 1: CROP-WISE CARE (Select Crop -> Related Doctors)
                  ═══════════════════════════════════════════════════════ */}
              {consultationMode === 'CROP_WISE' ? (
                <View style={{ gap: 14 }}>
                  {/* STEP 1: SELECT CROP */}
                  <View style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        1. Select Your Crop:
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                        {myCrops.length} Registered Crop(s)
                      </Text>
                    </View>

                    {isLoadingCrops ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : myCrops.length === 0 ? (
                      <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                        <Ionicons name="leaf-outline" size={24} color="#64748b" />
                        <Text style={[styles.emptyNoticeText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                          No active crops found. Proceeding with General Agronomy Consultation.
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 6 }}>
                        {myCrops.map((crop) => {
                          const isAssigned =
                            Boolean(crop.assignedAdvisorId) ||
                            Boolean(crop.assignedAdvisor) ||
                            crop.advisorReviewStatus === 'ACCEPTED';
                          const isSelected = selectedCropId === crop.id;

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
                              }}
                            >
                              <View style={{ flex: 1, gap: 2 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                  <Text
                                    style={[
                                      styles.cropCardTitle,
                                      { color: isAssigned ? '#94a3b8' : isDark ? '#ffffff' : '#0f172a' },
                                    ]}
                                  >
                                    🌾 {crop.cropName} {crop.variety ? `(${crop.variety})` : ''}
                                  </Text>
                                  {crop.area ? (
                                    <View style={styles.acreBadge}>
                                      <Text style={styles.acreBadgeText}>
                                        {crop.area} {crop.unit || 'Acre'}
                                      </Text>
                                    </View>
                                  ) : null}
                                </View>
                                <Text style={styles.cropCardSub}>
                                  Plot: {crop.plot?.name || 'Field Plot'} · Category: {crop.category || 'General'}
                                </Text>

                                {/* Duplicate Guard Badge */}
                                {isAssigned ? (
                                  <View style={styles.assignedGuardBadge}>
                                    <Ionicons name="lock-closed" size={12} color="#15803d" />
                                    <Text style={styles.assignedGuardText}>
                                      ✓ Doctor Already Active: Dr. {crop.assignedAdvisor?.name || 'Assigned Specialist'} (Direct Consult Available)
                                    </Text>
                                  </View>
                                ) : null}
                              </View>

                              {!isAssigned ? (
                                <Ionicons
                                  name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                                  size={20}
                                  color={isSelected ? '#16a34a' : '#cbd5e1'}
                                />
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* STEP 2: RELATED DOCTORS */}
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      2. Matching Doctors for {selectedCrop?.cropName || 'Your Crop'}:
                    </Text>

                    {isLoadingAdvisors ? (
                      <ActivityIndicator size="small" color="#16a34a" />
                    ) : matchingCropDoctors.length === 0 ? (
                      <View style={[styles.emptyNoticeBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                        <Text style={[styles.emptyNoticeText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                          No specialist specifically tagged. Showing all certified agronomy doctors.
                        </Text>
                      </View>
                    ) : (
                      <View style={{ gap: 8 }}>
                        {matchingCropDoctors.map((advisor) => {
                          const isSelected = selectedAdv?.id === advisor.id;
                          const isCropAssignedToThisDoctor = selectedCrop?.assignedAdvisorId === advisor.id;
                          const isFreeConsult = Number(advisor.feePerConsultation) === 0;

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
                                  size={18}
                                  color="#0284c7"
                                />
                              </View>

                              <View style={{ flex: 1, gap: 2 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <Text style={[styles.doctorName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                                    Dr. {advisor.name}
                                  </Text>
                                  <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedBadgeText}>
                                      {advisor.isSeniorDoctor ? '🩺 Senior Doctor' : '✓ Verified Agronomist'}
                                    </Text>
                                  </View>
                                </View>

                                <Text style={styles.doctorSpecText} numberOfLines={1}>
                                  🏷️ {advisor.specialization || 'All Crops Agronomy Specialist'}
                                </Text>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                  <Text style={styles.doctorMetaSmall}>
                                    ⭐ {advisor.rating ? `${advisor.rating} (${advisor.ratingCount})` : 'New Specialist'}
                                  </Text>
                                  <Text style={styles.doctorMetaSmall}>· {advisor.yearsExperience || 5}+ yrs exp</Text>
                                  {isFreeConsult ? (
                                    <View style={styles.freeBadgePill}>
                                      <Text style={styles.freeBadgeText}>🎁 Free 1st Consult</Text>
                                    </View>
                                  ) : null}
                                </View>

                                {isCropAssignedToThisDoctor ? (
                                  <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#dc2626', marginTop: 2 }}>
                                    🔒 Already assigned to this crop. Free chat available directly.
                                  </Text>
                                ) : null}
                              </View>

                              {!isCropAssignedToThisDoctor ? (
                                <Ionicons
                                  name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                                  size={22}
                                  color={isSelected ? '#0284c7' : '#cbd5e1'}
                                />
                              ) : null}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>

                  {/* STEP 3: SELECT PACKAGE */}
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      3. Select Consultation Package:
                    </Text>

                    <View style={{ gap: 8 }}>
                      {/* Package 1: Single Prescription */}
                      <TouchableOpacity
                        style={[
                          styles.packageCard,
                          selectedCropPackage === 'PRESCRIPTION' && styles.packageCardSelected,
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
                        onPress={() => {
                          tap();
                          setSelectedCropPackage('PRESCRIPTION');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.packageTitle, { color: '#0284c7' }]}>Pay Per Prescription</Text>
                            <View style={[styles.badgePill, { backgroundColor: '#e0f2fe' }]}>
                              <Text style={[styles.badgePillText, { color: '#0369a1' }]}>Instant SOS</Text>
                            </View>
                          </View>
                          <Ionicons
                            name={selectedCropPackage === 'PRESCRIPTION' ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={selectedCropPackage === 'PRESCRIPTION' ? '#0284c7' : '#94a3b8'}
                          />
                        </View>
                        <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          Emergency photo diagnosis, disease detection & spray prescription
                        </Text>
                        <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          {Number(selectedAdv?.feePerConsultation) === 0
                            ? '₹0 (FREE)'
                            : `₹${Number(selectedAdv?.feePerConsultation || 99)}`}{' '}
                          <Text style={styles.packagePriceUnit}>/ Single Consultation</Text>
                        </Text>
                      </TouchableOpacity>

                      {/* Package 2: Full Crop Season Care */}
                      <TouchableOpacity
                        style={[
                          styles.packageCard,
                          selectedCropPackage === 'SEASON' && [styles.packageCardSelected, { borderColor: '#10b981' }],
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
                        onPress={() => {
                          tap();
                          setSelectedCropPackage('SEASON');
                        }}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={[styles.packageTitle, { color: '#16a34a' }]}>Full Crop Season Care</Text>
                            <View style={[styles.badgePill, { backgroundColor: '#dcfce7' }]}>
                              <Text style={[styles.badgePillText, { color: '#15803d' }]}>⭐ RECOMMENDED</Text>
                            </View>
                          </View>
                          <Ionicons
                            name={selectedCropPackage === 'SEASON' ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={selectedCropPackage === 'SEASON' ? '#16a34a' : '#94a3b8'}
                          />
                        </View>
                        <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                          Complete 120-day seed-to-harvest spray calendar, nutrition schedule & continuous doctor monitoring
                        </Text>
                        <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                          ₹{Number(selectedAdv?.feePerCropSeason || 499)}{' '}
                          <Text style={styles.packagePriceUnit}>/ Full 120-Day Cycle</Text>
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                /* ═══════════════════════════════════════════════════════
                   MODE 2: MONTHLY FARM VIP (Doctor List First -> Plans)
                   ═══════════════════════════════════════════════════════ */
                <View style={{ gap: 14 }}>
                  {/* STEP 1: SELECT DOCTOR */}
                  <View style={{ gap: 8 }}>
                    <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      1. Select Your Dedicated Farm Doctor:
                    </Text>

                    <View style={{ gap: 8 }}>
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
                              <Ionicons name="medkit" size={18} color="#7c3aed" />
                            </View>

                            <View style={{ flex: 1, gap: 2 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                <Text style={[styles.doctorName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                                  Dr. {advisor.name}
                                </Text>
                                {isCurrentlyMyDoctor ? (
                                  <View style={styles.activeDoctorBadge}>
                                    <Text style={styles.activeDoctorBadgeText}>🌟 Your Active Doctor</Text>
                                  </View>
                                ) : (
                                  <View style={styles.verifiedBadge}>
                                    <Text style={styles.verifiedBadgeText}>
                                      {advisor.isSeniorDoctor ? '🩺 Senior Doctor' : '✓ Verified Doctor'}
                                    </Text>
                                  </View>
                                )}
                              </View>

                              <Text style={styles.doctorSpecText} numberOfLines={2}>
                                🏷️ {advisor.specialization || 'All Crops Agronomy Specialist'}
                              </Text>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                                <Text style={styles.doctorMetaSmall}>
                                  ⭐ {advisor.rating ? `${advisor.rating} (${advisor.ratingCount})` : 'New Specialist'}
                                </Text>
                                <Text style={styles.doctorMetaSmall}>· {advisor.yearsExperience || 8}+ yrs exp</Text>
                                <Text style={[styles.doctorMetaSmall, { color: '#7c3aed', fontWeight: '700' }]}>
                                  · ₹{Number(advisor.feeVipMonthly || 1999)}/mo
                                </Text>
                              </View>

                              {advisor.bio ? (
                                <Text style={{ fontSize: 10.5, fontFamily: FONT.regular, color: '#64748b', marginTop: 2 }} numberOfLines={1}>
                                  {advisor.bio}
                                </Text>
                              ) : null}
                            </View>

                            <Ionicons
                              name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                              size={22}
                              color={isSelected ? '#7c3aed' : '#cbd5e1'}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* STEP 2: DOCTOR'S MONTHLY VIP PLANS & FEATURES */}
                  <View style={{ gap: 10 }}>
                    <Text style={[styles.sectionHeading, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                      2. Monthly VIP Features & Duration (Dr. {selectedAdv?.name}):
                    </Text>

                    {/* Features Strip */}
                    <View style={[styles.benefitsStrip, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.08)' : '#f5f3ff', borderColor: isDark ? 'rgba(139, 92, 246, 0.2)' : '#ddd6fe' }]}>
                      <Text style={[styles.benefitsHeading, { color: '#6d28d9' }]}>
                        👑 Monthly VIP Retainer Inclusions:
                      </Text>
                      <View style={{ gap: 4 }}>
                        <View style={styles.benefitBullet}>
                          <Ionicons name="checkmark-circle" size={14} color="#7c3aed" />
                          <Text style={[styles.benefitBulletText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            Direct Phone Call & WhatsApp Advisory with Dr. {selectedAdv?.name}
                          </Text>
                        </View>
                        <View style={styles.benefitBullet}>
                          <Ionicons name="checkmark-circle" size={14} color="#7c3aed" />
                          <Text style={[styles.benefitBulletText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            Covers up to {selectedAdv?.monthlyIncludedCrops || 3} crops on your farm simultaneously
                          </Text>
                        </View>
                        <View style={styles.benefitBullet}>
                          <Ionicons name="checkmark-circle" size={14} color="#7c3aed" />
                          <Text style={[styles.benefitBulletText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                            Satellite NDVI Crop Health & Hyperlocal Disease Outbreak Alerts
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Duration Selector: 1, 3, 6, 12 Months */}
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isDark ? '#cbd5e1' : '#334155' }}>
                        Select Retainer Duration:
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                        {[
                          { months: 1 as const, label: '1 Month', tag: 'Standard' },
                          { months: 3 as const, label: '3 Months', tag: '5% OFF' },
                          { months: 6 as const, label: '6 Months', tag: '10% OFF' },
                          { months: 12 as const, label: '12 Months', tag: '20% OFF' },
                        ].map((d) => {
                          const isDurActive = monthlyDuration === d.months;
                          const base = Number(selectedAdv?.feeVipMonthly || 1999);
                          const factor = d.months === 1 ? 1 : d.months === 3 ? 0.95 : d.months === 6 ? 0.9 : 0.8;
                          const price = Math.round(base * d.months * factor);

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
                                ₹{price}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    {/* Prorated Credit Adjustment Notice */}
                    {pricingData.unusedCredit > 0 ? (
                      <View style={[styles.creditAdjustmentBox, { backgroundColor: isDark ? '#1e293b' : '#eff6ff' }]}>
                        <Ionicons name="card" size={16} color="#0284c7" />
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#0369a1' }}>
                            Prorated Plan Credit Applied: -₹{pricingData.unusedCredit}
                          </Text>
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>
                            Your remaining active days from your previous plan have been adjusted.
                          </Text>
                        </View>
                      </View>
                    ) : null}

                    {isSelectedDoctorAlreadyActive ? (
                      <View style={{ backgroundColor: '#f0fdf4', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bbf7d0', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="refresh-circle" size={16} color="#16a34a" />
                        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#166534' }}>
                          ✓ Subscription will be extended on top of your current active expiry date.
                        </Text>
                      </View>
                    ) : null}
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
                      {pricingData.isFree
                        ? 'Activate Free Consultation (₹0)'
                        : `Proceed to Pay ₹${pricingData.netPayable} Securely`}
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
    maxWidth: 580,
    maxHeight: '92%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    ...premiumShadow('#000000', 'lg'),
  },
  bannerHeader: {
    padding: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: RADIUS.pill,
  },
  topBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#fef3c7',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  bannerSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#a7f3d0',
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabSwitchContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.lg,
    padding: 3,
    gap: 4,
  },
  tabSwitchBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  tabSwitchBtnActive: {
    backgroundColor: '#0f172a',
    ...premiumShadow('#0f172a', 'sm'),
  },
  tabSwitchBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  tabSwitchBtnTextActive: {
    color: '#ffffff',
  },

  sectionHeading: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  cropCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
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
    fontSize: 13.5,
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
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: RADIUS.sm,
    marginTop: 3,
    alignSelf: 'flex-start',
  },
  assignedGuardText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#15803d',
  },

  doctorCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  doctorCardRowActive: {
    borderColor: '#0284c7',
  },
  doctorAvatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  doctorName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  verifiedBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  verifiedBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  activeDoctorBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  activeDoctorBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#b45309',
  },
  doctorSpecText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#0284c7',
  },
  doctorMetaSmall: {
    fontSize: 10.5,
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
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  packageCardSelected: {
    borderColor: '#0284c7',
  },
  packageTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  packageDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    lineHeight: 15,
  },
  packagePrice: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    marginTop: 2,
  },
  packagePriceUnit: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  badgePillText: {
    fontSize: 9.5,
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
    height: 46,
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
});
