import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useRedeemFarmerPlanCoupon } from '@/src/hooks/useFarmerPlan';
import { useInitiateFarmerPlanPayment, useSubmitFarmerPlanPayment } from '@/src/hooks/useFarmerPlanPayments';
import { useAvailableAdvisors } from '@/src/hooks/useAdvisorAssignments';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { previewFarmerPlanCoupon, FarmerPlanCouponPreview } from '@/src/api/farmerPlans.api';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface CropCarePlanModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CropCarePlanModal({ visible, onClose }: CropCarePlanModalProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors, isDark } = useExecutiveTheme();
  const redeemCoupon = useRedeemFarmerPlanCoupon();
  const initiatePayment = useInitiateFarmerPlanPayment();
  const submitPayment = useSubmitFarmerPlanPayment();
  const { data: availableAdvisors = [] } = useAvailableAdvisors();
  const { data: appSettings } = useAppSettings();

  const [selectedPackage, setSelectedPackage] = useState<'PRESCRIPTION' | 'SEASON' | 'VIP'>('SEASON');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);

  // Coupon state (collapsible)
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<FarmerPlanCouponPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Payment states
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activatedConsultation, setActivatedConsultation] = useState<{
    doctorName: string;
    doctorRole: string;
    specialization: string;
    kingId?: string;
    phone?: string | null;
    planKey: string;
    packageName: string;
    validUntil: string;
    isTestMode?: boolean;
  } | null>(null);

  const selectedAdv = availableAdvisors.find((a) => a.id === selectedAdvisorId);
  const isSeniorDoctor = (selectedAdv?.role as any) === 'DOCTOR' || !!(selectedAdv as any)?.isSeniorDoctor;

  const packagePricing: Record<'PRESCRIPTION' | 'SEASON' | 'VIP', number> = {
    PRESCRIPTION: Number((selectedAdv as any)?.feePerConsultation) || 99,
    SEASON: Number((selectedAdv as any)?.feePerCropSeason) || 499,
    VIP: Number((selectedAdv as any)?.feeVipMonthly) || 1999,
  };

  const totalPayable = packagePricing[selectedPackage];

  const handleLivePayment = async () => {
    tap();
    setIsProcessing(true);
    setStatusMessage(null);
    try {
      const res = await initiatePayment.mutateAsync({
        targetPlan: 'GOLD',
        billingPeriodDays: selectedPackage === 'PRESCRIPTION' ? 30 : selectedPackage === 'SEASON' ? 120 : 365,
        selectedDoctorId: isSeniorDoctor ? selectedAdv?.id : undefined,
        selectedAdvisorId: !isSeniorDoctor ? selectedAdv?.id : undefined,
        doctorKingId: isSeniorDoctor ? (selectedAdv?.kingId ?? undefined) : undefined,
        advisorKingId: !isSeniorDoctor ? (selectedAdv?.kingId ?? undefined) : undefined,
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
      await redeemCoupon.mutateAsync({ code: previewData.code });
      queryClient.invalidateQueries({ queryKey: ['my-advisor'] });
      queryClient.invalidateQueries({ queryKey: ['advisor-assignment'] });
      queryClient.invalidateQueries({ queryKey: ['subscription-status'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-plan'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });

      setActivatedConsultation({
        doctorName: selectedAdv?.name || 'Dr. FarmsKing Agronomist',
        doctorRole: isSeniorDoctor ? 'Senior Crop Doctor' : 'Certified Farm Advisor',
        specialization: selectedAdv?.specialization || 'Crop Pathology & Field Health',
        kingId: selectedAdv?.kingId || previewData.code,
        phone: (selectedAdv as any)?.mobile || (selectedAdv as any)?.phone || null,
        planKey: (previewData.plan as any) || 'GOLD',
        packageName: 'Coupon Redeemed Plan',
        validUntil: new Date(Date.now() + (previewData.daysGranted || 30) * 24 * 3600 * 1000).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      });
      setCouponStatus(`🎉 Coupon "${previewData.code}" redeemed! Doctor Plan activated.`);
      setPreviewData(null);
      setCouponInput('');
    } catch (err: any) {
      setCouponStatus(`❌ ${err?.response?.data?.message || 'Failed to redeem coupon.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetModal = () => {
    setCouponInput('');
    setCouponStatus(null);
    setStatusMessage(null);
    setActivatedConsultation(null);
    setShowCouponInput(false);
    setPreviewData(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetModal}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: isDark ? '#0b1320' : '#ffffff', borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : '#cbd5e1' }]}>
          {/* Header Banner */}
          <LinearGradient colors={['#0f172a', '#0284c7']} style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="medical" size={20} color="#38bdf8" />
                <Text style={styles.headerTitle}>CROP CARE SCHEME</Text>
              </View>
              <Text style={styles.headerSub}>Specialist Doctor Supervision for Your Crops</Text>
            </View>
            <TouchableOpacity onPress={resetModal} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {activatedConsultation ? (
              /* ACTIVATION CELEBRATION VIEW */
              <View style={styles.activatedWrap}>
                <View style={styles.successIconBadge}>
                  <Ionicons name="checkmark-circle" size={48} color="#10b981" />
                </View>

                <View style={styles.activatedTag}>
                  <Text style={styles.activatedTagText}>🎉 PLAN ACTIVATED</Text>
                </View>

                <Text style={[styles.activatedTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                  Crop Doctor Plan is Now Active!
                </Text>
                <Text style={[styles.activatedSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  Your package <Text style={{ fontFamily: FONT.bold, color: '#0284c7' }}>{activatedConsultation.packageName}</Text> is confirmed. Your assigned specialist is available for guidance.
                </Text>

                {/* Doctor Assigned Card */}
                <View style={[styles.doctorCardActive, { backgroundColor: isDark ? 'rgba(2, 132, 199, 0.1)' : '#f0f9ff', borderColor: isDark ? '#0284c7' : '#bae6fd' }]}>
                  <View style={styles.doctorAvatarBox}>
                    <Ionicons name="medkit" size={24} color="#0284c7" />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.doctorActiveName, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        {activatedConsultation.doctorName}
                      </Text>
                      <View style={styles.doctorVerifiedBadge}>
                        <Ionicons name="shield-checkmark" size={10} color="#15803d" />
                        <Text style={styles.doctorVerifiedText}>Verified Doctor</Text>
                      </View>
                    </View>
                    <Text style={styles.doctorActiveSpecialty}>{activatedConsultation.specialization}</Text>
                    <Text style={[styles.doctorActiveMeta, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      King ID: #{activatedConsultation.kingId} · Valid till {activatedConsultation.validUntil}
                    </Text>
                  </View>
                </View>

                {/* Direct Action Buttons */}
                <View style={{ width: '100%', gap: 8, marginTop: 8 }}>
                  <TouchableOpacity
                    style={styles.primaryActionButton}
                    onPress={() => {
                      resetModal();
                      router.push('/(user)/(tabs)/ai-doctor' as any);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="chatbubbles" size={18} color="#ffffff" />
                    <Text style={styles.primaryActionButtonText}>Start Doctor Consultation Now →</Text>
                  </TouchableOpacity>

                  {activatedConsultation.phone ? (
                    <TouchableOpacity
                      style={styles.whatsAppButton}
                      onPress={() => {
                        const clean = activatedConsultation.phone!.replace(/[^0-9]/g, '');
                        const msg = `Hello ${activatedConsultation.doctorName}! I have activated my Crop Care Plan on FarmsKing. I need advice for my crop.`;
                        Linking.openURL(`https://wa.me/${clean.startsWith('91') ? clean : '91' + clean}?text=${encodeURIComponent(msg)}`).catch(() => {});
                      }}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
                      <Text style={styles.whatsAppButtonText}>Connect on Doctor WhatsApp</Text>
                    </TouchableOpacity>
                  ) : null}

                  <TouchableOpacity style={[styles.secondaryButton, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} onPress={resetModal}>
                    <Text style={[styles.secondaryButtonText, { color: isDark ? '#cbd5e1' : '#475569' }]}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              /* MAIN COMPACT PLAN SELECTION VIEW */
              <View style={{ gap: 12 }}>
                {/* 1. SELECT PACKAGE (3 Clean Options) */}
                <View style={{ gap: 6 }}>
                  <Text style={[styles.labelTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    1. Choose Crop Care Package:
                  </Text>
                  <View style={{ gap: 8 }}>
                    {/* Option 1: SOS Consultation */}
                    <TouchableOpacity
                      style={[
                        styles.packageCard,
                        selectedPackage === 'PRESCRIPTION' && styles.packageCardSelected,
                        { backgroundColor: isDark ? (selectedPackage === 'PRESCRIPTION' ? 'rgba(56, 189, 248, 0.12)' : 'rgba(255, 255, 255, 0.03)') : (selectedPackage === 'PRESCRIPTION' ? '#f0f9ff' : '#ffffff') },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => { tap(); setSelectedPackage('PRESCRIPTION'); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.packageTitle, { color: '#0284c7' }]}>Pay Per Prescription</Text>
                          <View style={[styles.badgePill, { backgroundColor: '#e0f2fe' }]}>
                            <Text style={[styles.badgePillText, { color: '#0369a1' }]}>Instant SOS</Text>
                          </View>
                        </View>
                        <Ionicons
                          name={selectedPackage === 'PRESCRIPTION' ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={selectedPackage === 'PRESCRIPTION' ? '#0284c7' : '#94a3b8'}
                        />
                      </View>
                      <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Emergency photo diagnosis & instant spray prescription
                      </Text>
                      <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        ₹{packagePricing.PRESCRIPTION} <Text style={styles.packagePriceUnit}>/ Single Consultation</Text>
                      </Text>
                    </TouchableOpacity>

                    {/* Option 2: Full Crop Season Care (Recommended) */}
                    <TouchableOpacity
                      style={[
                        styles.packageCard,
                        selectedPackage === 'SEASON' && [styles.packageCardSelected, { borderColor: '#10b981' }],
                        { backgroundColor: isDark ? (selectedPackage === 'SEASON' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.03)') : (selectedPackage === 'SEASON' ? '#f0fdf4' : '#ffffff') },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => { tap(); setSelectedPackage('SEASON'); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.packageTitle, { color: '#16a34a' }]}>Full Crop Season Care</Text>
                          <View style={[styles.badgePill, { backgroundColor: '#dcfce7' }]}>
                            <Text style={[styles.badgePillText, { color: '#15803d' }]}>⭐ RECOMMENDED</Text>
                          </View>
                        </View>
                        <Ionicons
                          name={selectedPackage === 'SEASON' ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={selectedPackage === 'SEASON' ? '#16a34a' : '#94a3b8'}
                        />
                      </View>
                      <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Complete 120-day seed-to-harvest spray calendar & doctor monitoring
                      </Text>
                      <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        ₹{packagePricing.SEASON} <Text style={styles.packagePriceUnit}>/ Full 120-Day Cycle</Text>
                      </Text>
                    </TouchableOpacity>

                    {/* Option 3: VIP Farm Care */}
                    <TouchableOpacity
                      style={[
                        styles.packageCard,
                        selectedPackage === 'VIP' && [styles.packageCardSelected, { borderColor: '#8b5cf6' }],
                        { backgroundColor: isDark ? (selectedPackage === 'VIP' ? 'rgba(139, 92, 246, 0.12)' : 'rgba(255, 255, 255, 0.03)') : (selectedPackage === 'VIP' ? '#f5f3ff' : '#ffffff') },
                      ]}
                      activeOpacity={0.85}
                      onPress={() => { tap(); setSelectedPackage('VIP'); }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.packageTitle, { color: '#8b5cf6' }]}>VIP Farm Doctor</Text>
                          <View style={[styles.badgePill, { backgroundColor: '#ede9fe' }]}>
                            <Text style={[styles.badgePillText, { color: '#6d28d9' }]}>VIP Retainer</Text>
                          </View>
                        </View>
                        <Ionicons
                          name={selectedPackage === 'VIP' ? 'radio-button-on' : 'radio-button-off'}
                          size={18}
                          color={selectedPackage === 'VIP' ? '#8b5cf6' : '#94a3b8'}
                        />
                      </View>
                      <Text style={[styles.packageDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Priority phone calls, physical farm visits & customized estate guidance
                      </Text>
                      <Text style={[styles.packagePrice, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                        ₹{packagePricing.VIP} <Text style={styles.packagePriceUnit}>/ Month</Text>
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. SELECT DOCTOR / ADVISOR */}
                <View style={{ gap: 6 }}>
                  <Text style={[styles.labelTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                    2. Dedicated Specialist:
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    <TouchableOpacity
                      style={[
                        styles.doctorSelectPill,
                        selectedAdvisorId === null && styles.doctorSelectPillActive,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' },
                      ]}
                      onPress={() => setSelectedAdvisorId(null)}
                    >
                      <Text style={[styles.doctorSelectText, selectedAdvisorId === null && styles.doctorSelectTextActive]}>
                        ⚡ Auto-Assign Best Specialist
                      </Text>
                    </TouchableOpacity>
                    {availableAdvisors.map((adv) => (
                      <TouchableOpacity
                        key={adv.id}
                        style={[
                          styles.doctorSelectPill,
                          selectedAdvisorId === adv.id && styles.doctorSelectPillActive,
                          { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' },
                        ]}
                        onPress={() => setSelectedAdvisorId(adv.id)}
                      >
                        <Text style={[styles.doctorSelectText, selectedAdvisorId === adv.id && styles.doctorSelectTextActive]}>
                          {(adv.role as any) === 'DOCTOR' || (adv as any)?.isSeniorDoctor ? '🩺' : '👨‍⚕️'} {adv.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* 3. KEY SCHEME BENEFITS STRIP */}
                <View style={[styles.benefitsStrip, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#f0fdf4', borderColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#bbf7d0' }]}>
                  <Text style={[styles.benefitsHeading, { color: isDark ? '#a7f3d0' : '#166534' }]}>
                    🌿 Included with this Scheme:
                  </Text>
                  <View style={{ gap: 4 }}>
                    <View style={styles.benefitBullet}>
                      <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                      <Text style={[styles.benefitBulletText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                        1-on-1 Assigned Certified Agronomist Doctor
                      </Text>
                    </View>
                    <View style={styles.benefitBullet}>
                      <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                      <Text style={[styles.benefitBulletText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                        Customized Spray & Nutrition Schedule
                      </Text>
                    </View>
                    <View style={styles.benefitBullet}>
                      <Ionicons name="checkmark-circle" size={14} color="#16a34a" />
                      <Text style={[styles.benefitBulletText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                        Direct Phone Call & WhatsApp Consultations
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Status Message */}
                {statusMessage ? (
                  <Text style={[styles.statusMsgText, { color: statusMessage.startsWith('❌') ? '#ef4444' : '#10b981' }]}>
                    {statusMessage}
                  </Text>
                ) : null}

                {/* 4. ONLINE PAYMENT (Cashfree / UPI Gateway) */}
                <TouchableOpacity
                  style={[styles.livePayBtn, isProcessing && { opacity: 0.6 }]}
                  disabled={isProcessing}
                  onPress={handleLivePayment}
                  activeOpacity={0.88}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={17} color="#ffffff" />
                      <Text style={styles.livePayBtnText}>
                        Proceed to Pay ₹{totalPayable} Securely
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* 6. COLLAPSIBLE COUPON ACCORDION */}
                <TouchableOpacity
                  style={styles.couponToggleRow}
                  onPress={() => setShowCouponInput(!showCouponInput)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="pricetag-outline" size={14} color="#64748b" />
                  <Text style={styles.couponToggleText}>
                    {showCouponInput ? 'Hide Coupon Box ▲' : 'Have a Doctor Coupon Code? Tap here ▼'}
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
                        style={styles.couponApplyBtnCompact}
                        onPress={handleApplyCoupon}
                        disabled={isPreviewLoading}
                      >
                        {isPreviewLoading ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.couponApplyBtnTextCompact}>Apply</Text>
                        )}
                      </TouchableOpacity>
                    </View>

                    {couponStatus ? <Text style={styles.couponStatusText}>{couponStatus}</Text> : null}

                    {previewData ? (
                      <View style={styles.couponConfirmCard}>
                        <Text style={styles.couponConfirmTitle}>
                          Valid Coupon: {previewData.code} ({previewData.daysGranted} Days)
                        </Text>
                        <TouchableOpacity style={styles.couponRedeemBtn} onPress={handleConfirmRedeem}>
                          <Text style={styles.couponRedeemBtnText}>Activate via Coupon</Text>
                        </TouchableOpacity>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            )}
          </ScrollView>
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
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    ...premiumShadow('#000000', 'lg'),
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#bae6fd',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  scrollBody: {
    padding: 14,
  },
  labelTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  packageCard: {
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 4,
  },
  packageCardSelected: {
    borderColor: '#0284c7',
  },
  packageTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  badgePillText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  packageDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
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
  doctorSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doctorSelectPillActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#10b981',
  },
  doctorSelectText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  doctorSelectTextActive: {
    color: '#166534',
  },
  benefitsStrip: {
    padding: 10,
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
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  statusMsgText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    textAlign: 'center',
  },
  livePayBtn: {
    width: '100%',
    backgroundColor: '#0284c7',
    paddingVertical: 11,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  livePayBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
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
    fontFamily: FONT.medium,
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
    paddingHorizontal: 10,
    fontSize: 12,
    fontFamily: FONT.bold,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  couponApplyBtnCompact: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  couponApplyBtnTextCompact: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  couponStatusText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0284c7',
  },
  couponConfirmCard: {
    backgroundColor: '#f0fdf4',
    padding: 8,
    borderRadius: RADIUS.sm,
    gap: 6,
  },
  couponConfirmTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  couponRedeemBtn: {
    backgroundColor: '#16a34a',
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  couponRedeemBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  activatedWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  successIconBadge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#10b981',
  },
  activatedTag: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  activatedTagText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  activatedTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    textAlign: 'center',
  },
  activatedSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    textAlign: 'center',
    lineHeight: 17,
  },
  doctorCardActive: {
    width: '100%',
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  doctorAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#7dd3fc',
  },
  doctorActiveName: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  doctorVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  doctorVerifiedText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  doctorActiveSpecialty: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#0284c7',
  },
  doctorActiveMeta: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
  },
  primaryActionButton: {
    width: '100%',
    height: 44,
    backgroundColor: '#0284c7',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...premiumShadow('#0284c7', 'sm'),
  },
  primaryActionButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  whatsAppButton: {
    width: '100%',
    height: 42,
    backgroundColor: '#25D366',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  whatsAppButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  secondaryButton: {
    width: '100%',
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
});
