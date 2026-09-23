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
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useRedeemFarmerPlanCoupon, useFarmerPlanPricing } from '@/src/hooks/useFarmerPlan';
import { useInitiateFarmerPlanPayment, useSubmitFarmerPlanPayment } from '@/src/hooks/useFarmerPlanPayments';
import { useAvailableAdvisors } from '@/src/hooks/useAdvisorAssignments';
import { useAuth } from '@/src/store/auth-context';
import QRCode from 'react-native-qrcode-svg';

import { previewFarmerPlanCoupon, FarmerPlanCouponPreview } from '@/src/api/farmerPlans.api';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface CropCarePlanModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CropCarePlanModal({ visible, onClose }: CropCarePlanModalProps) {
  const { user } = useAuth();
  const redeemCoupon = useRedeemFarmerPlanCoupon();
  const initiatePayment = useInitiateFarmerPlanPayment();
  const submitPayment = useSubmitFarmerPlanPayment();
  const { data: pricingList = [] } = useFarmerPlanPricing();
  const { data: availableAdvisors = [] } = useAvailableAdvisors();

  const [couponInput, setCouponInput] = useState('');
  const [couponStatus, setCouponStatus] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<FarmerPlanCouponPreview | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [tabMode, setTabMode] = useState<'FEATURES' | 'BUY'>('FEATURES');
  const [selectedPlanKey, setSelectedPlanKey] = useState<'SILVER' | 'GOLD' | 'ROYAL'>('GOLD');
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [showUpiPay, setShowUpiPay] = useState(false);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

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
      setCouponStatus(`❌ ${err?.response?.data?.message || 'Invalid or expired Crop Care coupon.'}`);
      setPreviewData(null);
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleConfirmRedeem = async () => {
    if (!previewData) return;
    tap();
    try {
      await redeemCoupon.mutateAsync({ code: previewData.code });
      setCouponStatus(`🎉 Crop Care Coupon "${previewData.code}" Redeemed Successfully! Doctor Plan Activated.`);
      setPreviewData(null);
      setCouponInput('');
    } catch (err: any) {
      setCouponStatus(`❌ ${err?.response?.data?.message || 'Failed to redeem coupon.'}`);
    }
  };

  const handleInitiatePayment = async (planKey: 'SILVER' | 'GOLD' | 'ROYAL') => {
    tap();
    setIsGeneratingQr(true);
    setCouponStatus(null);
    setSubmitSuccessMsg(null);
    try {
      const selectedAdv = availableAdvisors.find((a) => a.id === selectedAdvisorId);
      const isSeniorDoctor = (selectedAdv?.role as any) === 'DOCTOR' || !!(selectedAdv as any)?.isSeniorDoctor;

      const res = await initiatePayment.mutateAsync({
        targetPlan: planKey,
        billingPeriodDays: 365,
        selectedDoctorId: isSeniorDoctor ? selectedAdv?.id : undefined,
        selectedAdvisorId: !isSeniorDoctor ? selectedAdv?.id : undefined,
        doctorKingId: isSeniorDoctor ? (selectedAdv?.kingId ?? undefined) : undefined,
        advisorKingId: !isSeniorDoctor ? (selectedAdv?.kingId ?? undefined) : undefined,
      });

      setPaymentData(res);
      setShowUpiPay(true);
    } catch (err: any) {
      setCouponStatus(`❌ ${err?.response?.data?.message || 'Could not generate UPI QR code.'}`);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const handleSubmitUtrClaim = async () => {
    if (!paymentData?.id) return;
    if (!utrInput.trim()) {
      alert('Please enter your UPI UTR / Transaction Reference Number.');
      return;
    }
    tap();
    setIsSubmittingPayment(true);
    try {
      await submitPayment.mutateAsync({
        id: paymentData.id,
        utr: utrInput.trim(),
      });
      setSubmitSuccessMsg(`✅ Payment submitted! Coupon is generated in PENDING status. Admin will verify payment and auto-activate your Crop Care Plan.`);
      setUtrInput('');
      setShowUpiPay(false);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to submit payment claim. Please try again.');
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleOpenUpiApp = async () => {
    if (paymentData?.upiLink) {
      try {
        await Linking.openURL(paymentData.upiLink);
      } catch {
        alert('No UPI app found on device.');
      }
    }
  };

  const resetModal = () => {
    setCouponInput('');
    setCouponStatus(null);
    setSubmitSuccessMsg(null);
    setShowUpiPay(false);
    setPaymentData(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={resetModal}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Modal Header Banner */}
          <LinearGradient colors={['#0f172a', '#0284c7']} style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="medical" size={20} color="#38bdf8" />
                <Text style={styles.headerTitle}>Crops Care Plan & Doctor Advisory</Text>
              </View>
              <Text style={styles.headerSub}>Specialist Doctor Supervision for Your Crops</Text>
            </View>
            <TouchableOpacity onPress={resetModal}>
              <Ionicons name="close-circle" size={26} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {showUpiPay && paymentData ? (
              /* UPI PAYMENT & UTR SUBMISSION VIEW */
              <View style={{ gap: 12, alignItems: 'center' }}>
                <Text style={styles.sectionTitle}>💳 Admin UPI QR Code & Payment Confirmation</Text>
                <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' }}>
                  Scan QR code or use Admin UPI ID to pay exact amount. After paying, enter your UTR number below and submit.
                </Text>
                
                <View style={styles.qrBox}>
                  <QRCode value={paymentData.upiLink} size={170} />
                </View>

                <View style={styles.upiInfoBox}>
                  <Text style={styles.upiInfoText}>Admin UPI ID: surindersinghmakhu-5@oksbi</Text>
                  <Text style={styles.upiPriceText}>Amount to Pay: ₹{paymentData.amount}</Text>
                </View>

                <TouchableOpacity style={styles.payBtn} onPress={handleOpenUpiApp}>
                  <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
                  <Text style={styles.payBtnText}>Open UPI App (GPay / PhonePe / Paytm)</Text>
                </TouchableOpacity>

                {/* UTR Reference Input */}
                <View style={{ width: '100%', marginTop: 8, gap: 6 }}>
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>Enter UPI UTR / Transaction Reference No.:</Text>
                  <TextInput
                    style={styles.utrInput}
                    placeholder="e.g. 426189012345 (12-digit UTR)"
                    placeholderTextColor="#94a3b8"
                    value={utrInput}
                    onChangeText={setUtrInput}
                    keyboardType="number-pad"
                  />
                  <TouchableOpacity
                    style={[styles.submitUtrBtn, isSubmittingPayment && { opacity: 0.6 }]}
                    onPress={handleSubmitUtrClaim}
                    disabled={isSubmittingPayment}
                  >
                    {isSubmittingPayment ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.submitUtrBtnText}>Submit Payment & Request Activation</Text>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.backLinkBtn} onPress={() => setShowUpiPay(false)}>
                  <Text style={styles.backLinkText}>← Back to Crops Care Plans</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* 1. APPLY CROP CARE COUPON SECTION */}
                <View style={styles.couponSectionCard}>
                  <Text style={styles.sectionTitle}>🎟️ Apply Crops Care Coupon</Text>
                  <Text style={styles.sectionSub}>Enter your doctor or partner coupon code below:</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.couponInput}
                      placeholder="ENTER CROP CARE CODE (e.g. DOCTOR100)"
                      placeholderTextColor="#94a3b8"
                      value={couponInput}
                      onChangeText={setCouponInput}
                      autoCapitalize="characters"
                    />
                    <TouchableOpacity
                      style={styles.applyBtn}
                      onPress={handleApplyCoupon}
                      disabled={isPreviewLoading}
                    >
                      {isPreviewLoading ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <Text style={styles.applyBtnText}>Check Code</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                  {couponStatus ? <Text style={styles.statusText}>{couponStatus}</Text> : null}
                  {submitSuccessMsg ? <Text style={[styles.statusText, { color: '#0284c7' }]}>{submitSuccessMsg}</Text> : null}
                </View>

                {/* COUPON CONFIRMATION PREVIEW CARD */}
                {previewData ? (
                  <View style={styles.confirmBox}>
                    <View style={styles.confirmHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                      <Text style={styles.confirmHeaderTitle}>Coupon Details Confirmation</Text>
                    </View>

                    <View style={styles.confirmRow}>
                      <View style={styles.planPill}>
                        <Text style={styles.planPillText}>{previewData.plan} PLAN</Text>
                      </View>
                      <Text style={styles.confirmPrice}>MRP: ₹{previewData.price ?? 1999}</Text>
                    </View>

                    <View style={styles.validityBox}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="calendar-outline" size={15} color="#0284c7" />
                        <Text style={styles.validityText}>
                          Validity: <Text style={{ fontFamily: FONT.bold }}>{previewData.daysGranted} Days</Text>
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        <Ionicons name="time-outline" size={15} color="#16a34a" />
                        <Text style={styles.validityText}>
                          Valid Till: <Text style={{ fontFamily: FONT.bold, color: '#166534' }}>{new Date(previewData.newEndDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* Doctor Details (Name & Specialization ONLY) */}
                    <View style={styles.doctorCard}>
                      <View style={styles.doctorIconBg}>
                        <Text style={{ fontSize: 16 }}>🩺</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.doctorRoleTag}>SENIOR CROP DOCTOR</Text>
                        <Text style={styles.doctorNameText}>{previewData.doctor?.name || 'Dr. Specialist Doctor'}</Text>
                        <Text style={styles.doctorSpecText}>{previewData.doctor?.specialization || 'Crop Protection & Advisory Specialist'}</Text>
                      </View>
                    </View>

                    {/* Advisor Details (Name & Specialization ONLY, if assigned) */}
                    {previewData.advisor ? (
                      <View style={[styles.doctorCard, { marginTop: 6, backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }]}>
                        <View style={[styles.doctorIconBg, { backgroundColor: '#e0f2fe' }]}>
                          <Text style={{ fontSize: 16 }}>👨‍⚕️</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.doctorRoleTag, { color: '#0284c7' }]}>JUNIOR CROP ADVISOR</Text>
                          <Text style={styles.doctorNameText}>{previewData.advisor.name}</Text>
                          <Text style={styles.doctorSpecText}>{previewData.advisor.specialization}</Text>
                        </View>
                      </View>
                    ) : null}

                    {/* Features List */}
                    <View style={{ marginTop: 10 }}>
                      <Text style={styles.confirmSectionTitle}>🌟 Included Plan Features:</Text>
                      {(previewData.features || [
                        '360° VIP Specialist Doctor Advisory',
                        'Direct Phone & Chat Advisory with Doctor',
                        'Customized Crop Spray & Fertilization Schedules',
                        'Disease Diagnostic Prescriptions & Remedies',
                      ]).map((feat, idx) => (
                        <View key={idx} style={styles.featRow}>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
                          <Text style={styles.featText}>{feat}</Text>
                        </View>
                      ))}
                    </View>

                    <View style={styles.confirmActionRow}>
                      <TouchableOpacity
                        style={[styles.confirmActionBtn, { flex: 1, backgroundColor: '#16a34a' }]}
                        onPress={handleConfirmRedeem}
                        disabled={redeemCoupon.isPending}
                      >
                        {redeemCoupon.isPending ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text style={styles.confirmActionBtnText}>Confirm & Activate Plan</Text>
                        )}
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.confirmActionBtn, { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }]}
                        onPress={() => setPreviewData(null)}
                      >
                        <Text style={[styles.confirmActionBtnText, { color: '#475569' }]}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : null}

                {/* 2 TABS BELOW APPLY COUPON BUTTON */}
                <View style={styles.tabNavRow}>
                  <TouchableOpacity
                    style={[styles.tabNavBtn, tabMode === 'FEATURES' && styles.tabNavBtnActive]}
                    onPress={() => { tap(); setTabMode('FEATURES'); }}
                  >
                    <Ionicons name="star" size={14} color={tabMode === 'FEATURES' ? '#0f172a' : '#64748b'} />
                    <Text style={[styles.tabNavText, tabMode === 'FEATURES' && styles.tabNavTextActive]}>
                      🌟 Plan Features
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabNavBtn, tabMode === 'BUY' && styles.tabNavBtnActive]}
                    onPress={() => { tap(); setTabMode('BUY'); }}
                  >
                    <Ionicons name="cart" size={14} color={tabMode === 'BUY' ? '#0f172a' : '#64748b'} />
                    <Text style={[styles.tabNavText, tabMode === 'BUY' && styles.tabNavTextActive]}>
                      🛒 Buy Coupon
                    </Text>
                  </TouchableOpacity>
                </View>

                {tabMode === 'FEATURES' ? (
                  /* TAB 1: PLAN FEATURES */
                  <View style={styles.benefitsCard}>
                    <Text style={styles.sectionTitle}>🌟 Crops Care Plan Features & Supervision</Text>
                    <View style={styles.benefitsList}>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={styles.benefitText}>1-on-1 Assigned Specialist Senior Crop Doctor</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={styles.benefitText}>Junior Field Advisor Supervision under Senior Doctor</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={styles.benefitText}>5 or 10 Crop Plots Monitored Daily</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={styles.benefitText}>Stage-wise Chemical & Organic Spray Schedules</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={styles.benefitText}>Direct Phone Calls & WhatsApp Chat Advisory</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={styles.benefitText}>ISRO Satellite Field Health & Soil Moisture Sync</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={styles.benefitText}>Emergency Crop Disease Diagnostic Prescriptions</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* TAB 2: BUY COUPON (SELECT PLAN & DOCTOR/ADVISOR) */
                  <View style={{ gap: 12 }}>
                    <Text style={styles.sectionTitle}>🩺 SELECT CROPS CARE PLAN & ADVISOR</Text>

                    {/* Plan A: 5-Crop Doctor Care */}
                    <TouchableOpacity
                      style={[
                        styles.planOptionCard,
                        selectedPlanKey === 'GOLD' && { borderColor: '#0284c7', backgroundColor: '#f0f9ff' },
                      ]}
                      activeOpacity={0.88}
                      onPress={() => setSelectedPlanKey('GOLD')}
                    >
                      <View style={styles.planHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.planTitleText, { color: '#0284c7' }]}>🩺 5-Crop Care Advisory</Text>
                          <Text style={styles.planPriceText}>₹499 <Text style={styles.planPeriodText}>/ Full Crop Season</Text></Text>
                        </View>
                        <Ionicons
                          name={selectedPlanKey === 'GOLD' ? 'radio-button-on' : 'radio-button-off'}
                          size={22}
                          color={selectedPlanKey === 'GOLD' ? '#0284c7' : '#cbd5e1'}
                        />
                      </View>
                      <Text style={styles.planDescText}>
                        Covers up to 5 active crops with 1-on-1 dedicated Doctor supervision and spray guidance.
                      </Text>
                    </TouchableOpacity>

                    {/* Plan B: 10-Crop VIP Doctor Care */}
                    <TouchableOpacity
                      style={[
                        styles.planOptionCard,
                        selectedPlanKey === 'ROYAL' && { borderColor: '#7c3aed', backgroundColor: '#f5f3ff' },
                      ]}
                      activeOpacity={0.88}
                      onPress={() => setSelectedPlanKey('ROYAL')}
                    >
                      <View style={styles.vipTagPill}>
                        <Text style={styles.vipTagText}>🌟 VIP FULL FARM ADVISORY</Text>
                      </View>
                      <View style={styles.planHeaderRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.planTitleText, { color: '#7c3aed' }]}>🩺 10-Crop VIP Advisory</Text>
                          <Text style={styles.planPriceText}>₹999 <Text style={styles.planPeriodText}>/ Full Crop Season</Text></Text>
                        </View>
                        <Ionicons
                          name={selectedPlanKey === 'ROYAL' ? 'radio-button-on' : 'radio-button-off'}
                          size={22}
                          color={selectedPlanKey === 'ROYAL' ? '#7c3aed' : '#cbd5e1'}
                        />
                      </View>
                      <Text style={styles.planDescText}>
                        Covers up to 10 crop plots daily, direct audio/video call requests, and emergency disease visits.
                      </Text>
                    </TouchableOpacity>

                    {/* SELECT DOCTOR OR ADVISOR */}
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
                        Select Crop Doctor / Advisor (Optional):
                      </Text>
                      {availableAdvisors.length === 0 ? (
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                          FarmsKing Senior Specialist Doctor will be automatically assigned.
                        </Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                          <TouchableOpacity
                            style={[
                              styles.advSelectPill,
                              selectedAdvisorId === null && styles.advSelectPillActive,
                            ]}
                            onPress={() => setSelectedAdvisorId(null)}
                          >
                            <Text style={[styles.advSelectText, selectedAdvisorId === null && styles.advSelectTextActive]}>
                              Auto-Assign Doctor
                            </Text>
                          </TouchableOpacity>
                          {availableAdvisors.map((adv) => (
                            <TouchableOpacity
                              key={adv.id}
                              style={[
                                styles.advSelectPill,
                                selectedAdvisorId === adv.id && styles.advSelectPillActive,
                              ]}
                              onPress={() => setSelectedAdvisorId(adv.id)}
                            >
                              <Text style={[styles.advSelectText, selectedAdvisorId === adv.id && styles.advSelectTextActive]}>
                                {(adv.role as any) === 'DOCTOR' || (adv as any)?.isSeniorDoctor ? '🩺' : '👨‍⚕️'} {adv.name}
                              </Text>

                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[styles.buyBtn, { backgroundColor: selectedPlanKey === 'ROYAL' ? '#7c3aed' : '#0284c7' }]}
                      disabled={isGeneratingQr}
                      onPress={() => handleInitiatePayment(selectedPlanKey)}
                    >
                      {isGeneratingQr ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name="qr-code-outline" size={18} color="#ffffff" />
                          <Text style={styles.buyBtnText}>
                            Generate Admin QR Code ({selectedPlanKey === 'ROYAL' ? '₹999' : '₹499'})
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}
              </>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.md,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
    ...premiumShadow('#000000', 'lg'),
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#ffffff' },
  headerSub: { fontSize: 11, fontFamily: FONT.medium, color: '#bae6fd', marginTop: 2 },
  scrollBody: { padding: 14, gap: 12 },
  sectionTitle: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: 0.3 },
  sectionSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  couponSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  couponInput: {
    flex: 1,
    height: 42,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  applyBtn: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    height: 42,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  statusText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#059669', marginTop: 8 },
  benefitsCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  benefitsList: { gap: 6, marginTop: 8 },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitText: { fontSize: 12, fontFamily: FONT.medium, color: '#166534' },
  planOptionCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  vipTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#7c3aed',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    marginBottom: 4,
  },
  vipTagText: { fontSize: 9, fontFamily: FONT.extraBold, color: '#ffffff' },
  planHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planTitleText: { fontSize: 15, fontFamily: FONT.extraBold },
  planPriceText: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 2 },
  planPeriodText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  planDescText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#475569' },
  buyBtn: {
    height: 46,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  buyBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  qrBox: {
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  upiInfoBox: { alignItems: 'center', gap: 2, marginVertical: 4 },
  upiInfoText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  upiPriceText: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0284c7' },
  payBtn: {
    width: '100%',
    height: 44,
    backgroundColor: '#0284c7',
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  payBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  backLinkBtn: { paddingVertical: 8 },
  backLinkText: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  confirmBox: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#16a34a',
    gap: 8,
    ...premiumShadow('#16a34a', 'sm'),
  },
  confirmHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmHeaderTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#166534' },
  confirmRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  planPill: { backgroundColor: '#dcfce7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  planPillText: { fontSize: 11, fontFamily: FONT.extraBold, color: '#166534' },
  confirmPrice: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  validityBox: { backgroundColor: '#f8fafc', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', marginVertical: 4 },
  validityText: { fontSize: 12, fontFamily: FONT.medium, color: '#334155' },
  doctorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  doctorIconBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  doctorRoleTag: { fontSize: 9, fontFamily: FONT.extraBold, color: '#16a34a', letterSpacing: 0.5 },
  doctorNameText: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a', marginTop: 1 },
  doctorSpecText: { fontSize: 11, fontFamily: FONT.medium, color: '#475569' },
  confirmSectionTitle: { fontSize: 11.5, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 4 },
  featRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 2 },
  featText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#334155' },
  confirmActionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  confirmActionBtn: { height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  confirmActionBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 12.5 },
  tabNavRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.lg,
    padding: 4,
    marginVertical: 4,
  },
  tabNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  tabNavBtnActive: {
    backgroundColor: '#ffffff',
    ...premiumShadow('#0f172a', 'sm'),
  },
  tabNavText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  tabNavTextActive: {
    color: '#0f172a',
  },
  utrInput: {
    height: 42,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  submitUtrBtn: {
    height: 44,
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  submitUtrBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 13,
  },
  advSelectPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  advSelectPillActive: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
  },
  advSelectText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  advSelectTextActive: {
    color: '#166534',
  },
});
