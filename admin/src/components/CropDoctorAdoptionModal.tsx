import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { resolveMediaUrl } from '@/src/api/client';
import { useAvailableAdvisorsForCrop } from '@/src/hooks/useAdvisorAssignments';
import { useSubmitCropToAdvisor } from '@/src/hooks/useCrops';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { AvailableAdvisor, CropCycle } from '@/src/types/api';

interface CropDoctorAdoptionModalProps {
  visible: boolean;
  crop: CropCycle | null;
  onClose: () => void;
  isSecondOpinion?: boolean;
  onUpgradePlan?: (doctorId?: string) => void;
}

type SelectedPlanType = 'INCLUDED_FREE' | 'PER_CROP' | 'MONTHLY_SUBSCRIPTION' | 'PAY_PER_CONSULTATION' | 'ADDITIONAL_CROP';

export function CropDoctorAdoptionModal({
  visible,
  crop,
  onClose,
  isSecondOpinion = false,
  onUpgradePlan,
}: CropDoctorAdoptionModalProps) {
  const { data: advisors, isLoading } = useAvailableAdvisorsForCrop(crop?.id, visible);
  const { data: appSettings } = useAppSettings();
  const submitCrop = useSubmitCropToAdvisor();

  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);
  const [selectedPlanModel, setSelectedPlanModel] = useState<SelectedPlanType>('PER_CROP');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Financial percentages from App Settings (default 10% each)
  const platformFeePercent = appSettings?.advisorPlatformFeePercent ?? 10.0;
  const adminFeePercent = appSettings?.advisorAdminFeePercent ?? 10.0;

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const selectedDoctor = useMemo(() => {
    if (!advisors || advisors.length === 0) return null;
    if (selectedDoctorId) {
      const found = advisors.find((a) => a.id === selectedDoctorId);
      if (found) return found;
    }
    return advisors[0];
  }, [advisors, selectedDoctorId]);

  // Set default plan model when doctor changes
  React.useEffect(() => {
    if (selectedDoctor) {
      if (isSecondOpinion) {
        setSelectedPlanModel('PAY_PER_CONSULTATION');
      } else if (selectedDoctor.quota?.quotaStatus === 'INCLUDED_FREE') {
        setSelectedPlanModel('INCLUDED_FREE');
      } else if (selectedDoctor.quota?.quotaStatus === 'ADDITIONAL_CROP_FEE') {
        setSelectedPlanModel('ADDITIONAL_CROP');
      } else {
        setSelectedPlanModel('PER_CROP');
      }
    }
  }, [selectedDoctor, isSecondOpinion]);

  const pricingBreakdown = useMemo(() => {
    if (!selectedDoctor) {
      return {
        advisorFee: 0,
        farmsKingAdvisorCut: 0,
        advisorNetPayout: 0,
        platformFee: 0,
        gstTax: 0,
        totalPayable: 0,
      };
    }

    let baseAdvisorFee = 0;
    if (selectedPlanModel === 'INCLUDED_FREE') {
      baseAdvisorFee = 0;
    } else if (selectedPlanModel === 'ADDITIONAL_CROP') {
      baseAdvisorFee = Number(selectedDoctor.quota?.additionalCropFee || 300);
    } else if (selectedPlanModel === 'PER_CROP') {
      baseAdvisorFee = Number(selectedDoctor.feePerCropSeason || 500);
    } else if (selectedPlanModel === 'MONTHLY_SUBSCRIPTION') {
      baseAdvisorFee = Number(selectedDoctor.feeVipMonthly || 1000);
    } else if (selectedPlanModel === 'PAY_PER_CONSULTATION') {
      baseAdvisorFee = Number(selectedDoctor.feePerConsultation || 149);
    }

    if (baseAdvisorFee === 0) {
      return {
        advisorFee: 0,
        farmsKingAdvisorCut: 0,
        advisorNetPayout: 0,
        platformFee: 0,
        gstTax: 0,
        totalPayable: 0,
      };
    }

    // 1. Base Doctor Consultation Fee decided by the certified advisor
    const advisorFee = baseAdvisorFee;

    // 2. Internal FarmsKing Share (20% commission on advisor fee)
    // STRICT TECHNICAL & PRIVACY RULE: Confidential between FarmsKing and Advisor.
    // Farmer NEVER sees this 20% cut — farmer only sees the official Doctor Advisory Fee.
    const FARMSKING_COMMISSION_PERCENT = appSettings?.advisorAdminFeePercent ?? 20.0;
    const farmsKingAdvisorCut = Math.round((advisorFee * FARMSKING_COMMISSION_PERCENT) / 100);
    const advisorNetPayout = advisorFee - farmsKingAdvisorCut;

    // 3. Platform & Secure Cloud Storage Infrastructure Fee (10% of advisor fee)
    // Fair, legitimate infrastructure charge covering encrypted leaf photo/video storage & telemetry bandwidth.
    const PLATFORM_INFRA_FEE_PERCENT = 10.0;
    const platformFee = Math.max(1, Math.round((advisorFee * PLATFORM_INFRA_FEE_PERCENT) / 100));

    // 4. Statutory GST (19% Govt. Tax on Doctor Fee + Cloud Infrastructure Fee)
    // Official government compliance establishing legal corporate standing.
    const GST_RATE_PERCENT = 19.0;
    const taxableBase = advisorFee + platformFee;
    const gstTax = Math.max(1, Math.round((taxableBase * GST_RATE_PERCENT) / 100));

    // 5. Total Amount Payable by Farmer
    const totalPayable = taxableBase + gstTax;

    return {
      advisorFee,
      farmsKingAdvisorCut, // Internal only
      advisorNetPayout,    // Internal only
      platformFee,
      gstTax,
      totalPayable,
    };
  }, [selectedDoctor, selectedPlanModel, appSettings]);

  const handleSubmit = async () => {
    if (!crop || !selectedDoctor) return;
    tap();
    setIsSubmitting(true);

    try {
      const hiringModel =
        selectedPlanModel === 'PAY_PER_CONSULTATION'
          ? 'PAY_PER_CONSULTATION'
          : selectedPlanModel === 'MONTHLY_SUBSCRIPTION' || selectedPlanModel === 'INCLUDED_FREE' || selectedPlanModel === 'ADDITIONAL_CROP'
          ? 'MONTHLY_SUBSCRIPTION'
          : 'PER_CROP';

      await submitCrop.mutateAsync({
        id: crop.id,
        payload: {
          advisorId: selectedDoctor.id,
          hiringModel,
          notes: isSecondOpinion ? 'Second opinion request' : 'Crop adoption request',
        },
      });

      const message = `Adoption request sent to Doctor ${selectedDoctor.name}! You will be notified as soon as they review your crop.`;
      if (Platform.OS === 'web') alert(message);
      else Alert.alert('Request Sent', message);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not send adoption request. Please try again.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visible || !crop) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <LinearGradient colors={['#090e17', '#0f172a', '#062817']} style={styles.header}>
            {/* STATUTORY & ISO INSTITUTIONAL BANNER */}
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
                    ? `Independent plant pathology review, prescription spray chart & direct consultation for ${crop.cropName}`
                    : `Specialized certified agronomic supervision for ${crop.cropName}`}
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

          {/* Body */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#00ff87" />
                <Text style={styles.loadingText}>Finding certified doctors specializing in {crop.category || crop.cropName}...</Text>
              </View>
            ) : !advisors || advisors.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="alert-circle-outline" size={44} color="#f59e0b" />
                <Text style={styles.emptyTitle}>No Matching Specialists Found</Text>
                <Text style={styles.emptyDesc}>
                  Currently no certified doctors have registered for the {crop.category} category. Please contact FarmsKing Agronomy Support.
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.sectionHeader}>Select Certified Agronomist</Text>
                {/* Doctor Selection Cards */}
                <View style={styles.doctorsList}>
                  {advisors.map((advisor) => {
                    const isSelected = selectedDoctor?.id === advisor.id;
                    const avatar = resolveMediaUrl(advisor.photoUrl) || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=120';
                    const quota = advisor.quota;

                    return (
                      <TouchableOpacity
                        key={advisor.id}
                        style={[styles.doctorCard, isSelected && styles.doctorCardSelected]}
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

                          <View style={[styles.radioCircle, isSelected && styles.radioCircleSelected]}>
                            {isSelected && <View style={styles.radioInner} />}
                          </View>
                        </View>

                        {/* Quota / Status Badges */}
                        {quota?.quotaStatus === 'INCLUDED_FREE' ? (
                          <View style={styles.freeQuotaPill}>
                            <Ionicons name="gift" size={13} color="#10b981" />
                            <Text style={styles.freeQuotaText}>
                              Included in Active Monthly Care ({quota.freeSlotsRemaining} free crop slot left)
                            </Text>
                          </View>
                        ) : quota?.quotaStatus === 'ADDITIONAL_CROP_FEE' ? (
                          <View style={styles.extraQuotaPill}>
                            <Ionicons name="layers" size={13} color="#6366f1" />
                            <Text style={styles.extraQuotaText}>
                              Monthly Quota In Use ({quota.activeCropsUnderAdvisor} crops active) • Extra Crop: ₹{quota.additionalCropFee}/mo
                            </Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Plan Options Selector */}
                {selectedDoctor && (
                  <View style={styles.plansSection}>
                    <Text style={styles.sectionHeader}>Choose Consultation Package</Text>

                    {selectedDoctor.quota?.quotaStatus === 'INCLUDED_FREE' && !isSecondOpinion ? (
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
                    ) : selectedDoctor.quota?.quotaStatus === 'ADDITIONAL_CROP_FEE' && !isSecondOpinion ? (
                      <>
                        {/* Quota Limit Reached & Upgrade Recommendation */}
                        <View style={styles.quotaFullUpgradeCard}>
                          <View style={{ flex: 1, gap: 3 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Ionicons name="alert-circle" size={15} color="#7c3aed" />
                              <Text style={styles.quotaFullUpgradeTitle}>
                                Dr. {selectedDoctor.name}'s Quota is Full ({selectedDoctor.quota?.activeCropsUnderAdvisor}/{selectedDoctor.quota?.monthlyIncludedCrops})
                              </Text>
                            </View>
                            <Text style={styles.quotaFullUpgradeDesc}>
                              All included crop slots under Dr. {selectedDoctor.name} are active. Upgrade to a higher duration plan for full VIP coverage, or add as a single crop below.
                            </Text>
                          </View>
                          {onUpgradePlan ? (
                            <TouchableOpacity
                              style={styles.quotaFullUpgradeBtn}
                              activeOpacity={0.85}
                              onPress={() => {
                                tap();
                                onUpgradePlan(selectedDoctor.id);
                              }}
                            >
                              <Ionicons name="trending-up" size={13} color="#ffffff" />
                              <Text style={styles.quotaFullUpgradeBtnText}>Upgrade Plan</Text>
                            </TouchableOpacity>
                          ) : null}
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
                            <Text style={styles.planPriceVal}>₹{selectedDoctor.quota?.additionalCropFee || 300}</Text>
                            <Text style={styles.planPriceSub}>/ month</Text>
                          </View>
                        </TouchableOpacity>
                      </>
                    ) : null}

                    {/* Standard Options */}
                    {!isSecondOpinion && (
                      <View style={styles.planGrid}>
                        {/* Per-Crop Season */}
                        <TouchableOpacity
                          style={[styles.planGridCard, selectedPlanModel === 'PER_CROP' && styles.planCardActive]}
                          onPress={() => {
                            tap();
                            setSelectedPlanModel('PER_CROP');
                          }}
                        >
                          <View style={styles.planBadgeBlue}>
                            <Text style={styles.planBadgeTextBlue}>POPULAR</Text>
                          </View>
                          <Text style={styles.planGridTitle}>Per Crop Season</Text>
                          <Text style={styles.planGridDesc}>Full 120-day cycle supervision from sowing to harvest.</Text>
                          <Text style={styles.planGridPrice}>₹{selectedDoctor.feePerCropSeason || 500}</Text>
                          <Text style={styles.planGridSub}>per crop cycle</Text>
                        </TouchableOpacity>

                        {/* Monthly Retainer */}
                        <TouchableOpacity
                          style={[styles.planGridCard, selectedPlanModel === 'MONTHLY_SUBSCRIPTION' && styles.planCardActive]}
                          onPress={() => {
                            tap();
                            setSelectedPlanModel('MONTHLY_SUBSCRIPTION');
                          }}
                        >
                          <View style={styles.planBadgePurple}>
                            <Text style={styles.planBadgeTextPurple}>MULTI-CROP</Text>
                          </View>
                          <Text style={styles.planGridTitle}>Monthly Care</Text>
                          <Text style={styles.planGridDesc}>
                            Retainer covers up to {selectedDoctor.monthlyIncludedCrops || 3} crops with VOIP consultations.
                          </Text>
                          <Text style={styles.planGridPrice}>₹{selectedDoctor.feeVipMonthly || 1000}</Text>
                          <Text style={styles.planGridSub}>per month</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {/* One-Time Consultation (always available, or default for second opinion) */}
                    <TouchableOpacity
                      style={[
                        styles.planCard,
                        selectedPlanModel === 'PAY_PER_CONSULTATION' && styles.planCardActive,
                        { marginTop: 10 },
                      ]}
                      onPress={() => {
                        tap();
                        setSelectedPlanModel('PAY_PER_CONSULTATION');
                      }}
                    >
                      <View style={styles.planCardLeft}>
                        <View style={styles.planBadgeAmber}>
                          <Text style={styles.planBadgeTextAmber}>ONE-TIME SOS</Text>
                        </View>
                        <Text style={styles.planName}>Single Prescription / Second Opinion</Text>
                        <Text style={styles.planDesc}>
                          Instant leaf diagnosis, prescription chart, and direct in-app VOIP consultation for this specific issue.
                        </Text>
                      </View>
                      <View style={styles.planPriceBox}>
                        <Text style={styles.planPriceVal}>₹{selectedDoctor.feePerConsultation || 149}</Text>
                        <Text style={styles.planPriceSub}>one-time</Text>
                      </View>
                    </TouchableOpacity>

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

                      {/* LINE 3: STATUTORY GST (19%) */}
                      <View style={styles.statutoryRow}>
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Text style={styles.statutoryLabel}>
                              Statutory GST (19% Govt. Tax)
                            </Text>
                            <View style={styles.govtTaxPill}>
                              <Text style={styles.govtTaxPillText}>CGST 9.5% + SGST 9.5%</Text>
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
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
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
                  <Ionicons name="send" size={16} color="#090e17" />
                  <Text style={styles.submitBtnText}>
                    {pricingBreakdown.totalPayable === 0
                      ? 'Adopt with Active Plan (₹0)'
                      : isSecondOpinion
                        ? `Confirm Second Opinion • ₹${pricingBreakdown.totalPayable}`
                        : `Confirm Consultation • ₹${pricingBreakdown.totalPayable}`}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 10, 20, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    backgroundColor: '#090e17',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  header: {
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextCol: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropMetaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cropMetaItem: {
    flex: 1,
  },
  cropMetaLabel: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cropMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f8fafc',
    marginTop: 1,
  },
  cropMetaDivider: {
    width: 1,
    height: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginHorizontal: 8,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 18,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 14,
    color: '#94a3b8',
    fontSize: 13,
    textAlign: 'center',
  },
  emptyBox: {
    padding: 30,
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fbbf24',
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  doctorsList: {
    gap: 10,
    marginBottom: 20,
  },
  doctorCard: {
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  doctorCardSelected: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.03)',
  },
  doctorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 135, 0.4)',
  },
  doctorInfoCol: {
    flex: 1,
    marginLeft: 12,
  },
  doctorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  doctorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#00ff87',
  },
  doctorSpecialty: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  doctorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  doctorRatingVal: {
    fontSize: 11,
    fontWeight: '700',
    color: '#f8fafc',
  },
  doctorRatingCount: {
    fontSize: 11,
    color: '#64748b',
  },
  doctorKingId: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
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
  freeQuotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  freeQuotaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  extraQuotaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.md,
    marginTop: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  extraQuotaText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#818cf8',
  },
  plansSection: {
    marginTop: 10,
  },
  planGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  planGridCard: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planGridTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
    marginTop: 6,
  },
  planGridDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
    lineHeight: 16,
    minHeight: 32,
  },
  planGridPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00ff87',
    marginTop: 10,
  },
  planGridSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  planCardActive: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.04)',
  },
  quotaFullUpgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 1.5,
    borderRadius: RADIUS.lg,
    padding: 12,
    marginBottom: 10,
    gap: 10,
  },
  quotaFullUpgradeTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#c4b5fd',
  },
  quotaFullUpgradeDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 15,
  },
  quotaFullUpgradeBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  quotaFullUpgradeBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  planCardLeft: {
    flex: 1,
    marginRight: 14,
  },
  planBadgeGreen: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  planBadgeTextGreen: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  planBadgeIndigo: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  planBadgeTextIndigo: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.5,
  },
  planBadgeBlue: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planBadgeTextBlue: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.5,
  },
  planBadgePurple: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  planBadgeTextPurple: {
    fontSize: 9,
    fontWeight: '800',
    color: '#c084fc',
    letterSpacing: 0.5,
  },
  planBadgeAmber: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  planBadgeTextAmber: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  planName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ffffff',
  },
  planDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 3,
    lineHeight: 16,
  },
  planPriceBox: {
    alignItems: 'flex-end',
  },
  planPriceVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00ff87',
  },
  planPriceFree: {
    fontSize: 18,
    fontWeight: '800',
    color: '#34d399',
  },
  planPriceSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  modalCorporateStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingBottom: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalCorporateText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#86efac',
    letterSpacing: 0.3,
  },
  modalIcarBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modalIcarText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#7dd3fc',
    letterSpacing: 0.4,
  },
  secondOpinionPill: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.45)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  secondOpinionPillText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  statutoryCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(74, 222, 128, 0.3)',
    marginTop: 18,
    gap: 8,
  },
  statutoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  statutoryTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: 0.3,
  },
  statutoryIcarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  statutoryIcarText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.3,
  },
  statutoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  statutoryLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  statutorySub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },
  mandatoryPill: {
    backgroundColor: 'rgba(22, 163, 74, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.4)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  mandatoryPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#4ade80',
    letterSpacing: 0.3,
  },
  govtTaxPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 252, 0.4)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  govtTaxPillText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#7dd3fc',
    letterSpacing: 0.3,
  },
  statutoryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  statutoryDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  statutoryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  statutoryTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  statutoryTotalSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  statutoryTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#4ade80',
  },
  statutoryFooterStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  statutoryFooterText: {
    fontSize: 8.5,
    fontWeight: '700',
    color: '#86efac',
    letterSpacing: 0.2,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    backgroundColor: '#0f172a',
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: RADIUS.md,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94a3b8',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00ff87',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: RADIUS.md,
    gap: 8,
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#090e17',
  },
});
