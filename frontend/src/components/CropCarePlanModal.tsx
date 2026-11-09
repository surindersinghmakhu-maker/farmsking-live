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
import { useExecutiveTheme } from '@/src/store/theme-context';
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
  const { colors, isDark } = useExecutiveTheme();
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
  const [landTier, setLandTier] = useState<'SMALL' | 'LARGE'>('SMALL'); // < 5 Acres vs >= 5 Acres
  const [isFreeTrialMode, setIsFreeTrialMode] = useState<boolean>(false);
  const [isAutoDebit, setIsAutoDebit] = useState<boolean>(false); // Auto-Debit (UPI Mandate) vs Manual Recharge
  const [utrInput, setUtrInput] = useState('');
  const [showUpiPay, setShowUpiPay] = useState(false);
  const [paymentData, setPaymentData] = useState<any | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState<string | null>(null);

  const baseAdvisorFee = isFreeTrialMode ? 0 : (landTier === 'SMALL' ? 500 : 1000);
  const platformFee = 99;
  const gstAmount = 17.82; // 18% GST on ₹99
  const totalPayable = isFreeTrialMode ? 116.82 : Math.round((baseAdvisorFee + platformFee + gstAmount) * 100) / 100;
  const adminCommission = isFreeTrialMode ? 0 : Math.round(baseAdvisorFee * 0.10);
  const doctorNetPayout = isFreeTrialMode ? 0 : (baseAdvisorFee - adminCommission);

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

      if (res.cashfreeSessionId) {
        if (Platform.OS === 'web') {
          window.location.href = `https://payments.cashfree.com/order/#${res.cashfreeSessionId}`;
        } else {
          await Linking.openURL(`https://payments.cashfree.com/order/#${res.cashfreeSessionId}`);
        }
      }
    } catch (err: any) {
      setCouponStatus(`❌ ${err?.response?.data?.message || 'Could not initiate Cashfree payment.'}`);
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
        <View style={[styles.card, { backgroundColor: isDark ? '#061a0e' : '#ffffff', borderColor: isDark ? 'rgba(0, 255, 135, 0.25)' : '#cbd5e1', borderWidth: isDark ? 1 : 0 }]}>
          {/* Modal Header Banner */}
          <LinearGradient colors={['#0f172a', '#0284c7']} style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="medical" size={20} color="#38bdf8" />
                <Text style={styles.headerTitle}>CROP CARE SCHEME</Text>
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
                <View style={[styles.couponSectionCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1' }]}>
                  <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>🎟️ Apply Crops Care Coupon</Text>
                  <Text style={[styles.sectionSub, { color: isDark ? colors.textMuted : '#334155' }]}>Enter your doctor or partner coupon code below:</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={[styles.couponInput, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#f1f5f9', color: isDark ? '#ffffff' : '#0f172a', borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#cbd5e1', borderWidth: 1 }]}
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
                  <View style={[styles.confirmBox, { backgroundColor: isDark ? '#04160c' : '#f0fdf4', borderColor: isDark ? 'rgba(0, 255, 135, 0.25)' : '#86efac' }]}>
                    <View style={styles.confirmHeader}>
                      <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                      <Text style={[styles.confirmHeaderTitle, { color: isDark ? '#ffffff' : '#166534' }]}>Coupon Details Confirmation</Text>
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
                    <View style={[styles.doctorCard, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff', borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#cbd5e1' }]}>
                      <View style={styles.doctorIconBg}>
                        <Text style={{ fontSize: 16 }}>🩺</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.doctorRoleTag}>SENIOR CROP DOCTOR</Text>
                        <Text style={[styles.doctorNameText, { color: isDark ? '#ffffff' : '#0f172a' }]}>{previewData.doctor?.name || 'Dr. Specialist Doctor'}</Text>
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
                      <Text style={[styles.confirmSectionTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>🌟 Included Plan Features:</Text>
                      {(previewData.features || [
                        '360° VIP Specialist Doctor Advisory',
                        'Direct Phone & Chat Advisory with Doctor',
                        'Customized Crop Spray & Fertilization Schedules',
                        'Disease Diagnostic Prescriptions & Remedies',
                      ]).map((feat, idx) => (
                        <View key={idx} style={styles.featRow}>
                          <Ionicons name="checkmark-circle-outline" size={14} color="#16a34a" />
                          <Text style={[styles.featText, { color: isDark ? '#cbd5e1' : '#334155' }]}>{feat}</Text>
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
                <View style={[styles.tabNavRow, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9' }]}>
                  <TouchableOpacity
                    style={[styles.tabNavBtn, tabMode === 'FEATURES' && (isDark ? { backgroundColor: '#04160c', borderWidth: 1, borderColor: 'rgba(0, 255, 135, 0.3)' } : styles.tabNavBtnActive)]}
                    onPress={() => { tap(); setTabMode('FEATURES'); }}
                  >
                    <Ionicons name="star" size={14} color={tabMode === 'FEATURES' ? (isDark ? '#00ff87' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b')} />
                    <Text style={[styles.tabNavText, tabMode === 'FEATURES' && (isDark ? { color: '#00ff87' } : styles.tabNavTextActive)]}>
                      🌟 Plan Features
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.tabNavBtn, tabMode === 'BUY' && (isDark ? { backgroundColor: '#04160c', borderWidth: 1, borderColor: 'rgba(0, 255, 135, 0.3)' } : styles.tabNavBtnActive)]}
                    onPress={() => { tap(); setTabMode('BUY'); }}
                  >
                    <Ionicons name="cart" size={14} color={tabMode === 'BUY' ? (isDark ? '#00ff87' : '#0f172a') : (isDark ? '#94a3b8' : '#64748b')} />
                    <Text style={[styles.tabNavText, tabMode === 'BUY' && (isDark ? { color: '#00ff87' } : styles.tabNavTextActive)]}>
                      🛒 Buy Coupon
                    </Text>
                  </TouchableOpacity>
                </View>

                {tabMode === 'FEATURES' ? (
                  /* TAB 1: PLAN FEATURES */
                  <View style={[styles.benefitsCard, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : '#f0fdf4', borderColor: isDark ? 'rgba(0, 255, 135, 0.25)' : '#bbf7d0' }]}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>🌟 Crops Care Plan Features & Supervision</Text>
                    <View style={styles.benefitsList}>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={[styles.benefitText, { color: isDark ? '#e2e8f0' : '#166534' }]}>1-on-1 Assigned Specialist Senior Crop Doctor</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={[styles.benefitText, { color: isDark ? '#e2e8f0' : '#166534' }]}>Junior Field Advisor Supervision under Senior Doctor</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={[styles.benefitText, { color: isDark ? '#e2e8f0' : '#166534' }]}>5 or 10 Crop Plots Monitored Daily</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={[styles.benefitText, { color: isDark ? '#e2e8f0' : '#166534' }]}>Stage-wise Chemical & Organic Spray Schedules</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={[styles.benefitText, { color: isDark ? '#e2e8f0' : '#166534' }]}>Direct Phone Calls & WhatsApp Chat Advisory</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={[styles.benefitText, { color: isDark ? '#e2e8f0' : '#166534' }]}>ISRO Satellite Field Health & Soil Moisture Sync</Text>
                      </View>
                      <View style={styles.benefitItem}>
                        <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                        <Text style={[styles.benefitText, { color: isDark ? '#e2e8f0' : '#166534' }]}>Emergency Crop Disease Diagnostic Prescriptions</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  /* TAB 2: BUY COUPON (SELECT PLAN & DOCTOR/ADVISOR) */
                  <View style={{ gap: 12 }}>
                    <Text style={[styles.sectionTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>🩺 CROP CARE & ADVISORY PLAN (TIER 3)</Text>
                    <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: isDark ? colors.textMuted : '#64748b', marginTop: -4 }}>
                      Continuous seed-to-harvest crop monitoring & personalized spray schedules
                    </Text>

                    {/* Land-Based Pricing Tier Selector */}
                    <View style={{ gap: 6, marginTop: 4 }}>
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>
                        1. Select Farm Land Size (Land-Based Pricing):
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.planOptionCard,
                            {
                              flex: 1,
                              padding: 10,
                              backgroundColor: isDark ? (landTier === 'SMALL' ? 'rgba(16, 185, 129, 0.14)' : 'rgba(255, 255, 255, 0.03)') : (landTier === 'SMALL' ? '#f0fdf4' : '#ffffff'),
                              borderColor: isDark ? (landTier === 'SMALL' ? '#00ff87' : 'rgba(255, 255, 255, 0.08)') : (landTier === 'SMALL' ? '#16a34a' : '#cbd5e1'),
                            }
                          ]}
                          activeOpacity={0.88}
                          onPress={() => { tap(); setLandTier('SMALL'); }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#16a34a' }}>Small Farmer</Text>
                            <Ionicons name={landTier === 'SMALL' ? 'radio-button-on' : 'radio-button-off'} size={18} color={landTier === 'SMALL' ? '#16a34a' : '#94a3b8'} />
                          </View>
                          <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: isDark ? '#cbd5e1' : '#475569', marginTop: 2 }}>
                            &lt; 5 Acres Land
                          </Text>
                          <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: isDark ? '#ffffff' : '#0f172a', marginTop: 4 }}>
                            ₹500 <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#64748b' }}>/month Base</Text>
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[
                            styles.planOptionCard,
                            {
                              flex: 1,
                              padding: 10,
                              backgroundColor: isDark ? (landTier === 'LARGE' ? 'rgba(217, 119, 6, 0.14)' : 'rgba(255, 255, 255, 0.03)') : (landTier === 'LARGE' ? '#fffbeb' : '#ffffff'),
                              borderColor: isDark ? (landTier === 'LARGE' ? '#fbbf24' : 'rgba(255, 255, 255, 0.08)') : (landTier === 'LARGE' ? '#d97706' : '#cbd5e1'),
                            }
                          ]}
                          activeOpacity={0.88}
                          onPress={() => { tap(); setLandTier('LARGE'); }}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#d97706' }}>Large Farmer</Text>
                            <Ionicons name={landTier === 'LARGE' ? 'radio-button-on' : 'radio-button-off'} size={18} color={landTier === 'LARGE' ? '#d97706' : '#94a3b8'} />
                          </View>
                          <Text style={{ fontSize: 11, fontFamily: FONT.semiBold, color: isDark ? '#cbd5e1' : '#475569', marginTop: 2 }}>
                            ≥ 5 Acres Land
                          </Text>
                          <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: isDark ? '#ffffff' : '#0f172a', marginTop: 4 }}>
                            ₹1,000 <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#64748b' }}>/month Base</Text>
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Free Trial Architecture Toggle */}
                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        borderRadius: RADIUS.md,
                        backgroundColor: isDark ? (isFreeTrialMode ? 'rgba(0, 255, 135, 0.12)' : 'rgba(255, 255, 255, 0.03)') : (isFreeTrialMode ? '#ecfdf5' : '#f8fafc'),
                        borderWidth: 1.5,
                        borderColor: isDark ? (isFreeTrialMode ? '#00ff87' : 'rgba(255, 255, 255, 0.08)') : (isFreeTrialMode ? '#10b981' : '#e2e8f0'),
                      }}
                      activeOpacity={0.85}
                      onPress={() => { tap(); setIsFreeTrialMode(!isFreeTrialMode); }}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>
                            🎁 1-Month Advisor Free Trial
                          </Text>
                          <View style={{ backgroundColor: '#16a34a', paddingHorizontal: 5, paddingVertical: 1.5, borderRadius: 4 }}>
                            <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#ffffff' }}>TRIAL OPTION</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: isDark ? colors.textMuted : '#64748b', marginTop: 2 }}>
                          Advisor base fee is ₹0 during trial. Farmer pays only FarmsKing platform charge: ₹99/mo + 18% GST (₹116.82).
                        </Text>
                      </View>
                      <Ionicons
                        name={isFreeTrialMode ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isFreeTrialMode ? '#16a34a' : '#94a3b8'}
                      />
                    </TouchableOpacity>

                    {/* SELECT DOCTOR OR ADVISOR */}
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>
                        2. Select Crop Doctor / Advisor:
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
                              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0' },
                              selectedAdvisorId === null && (isDark ? { backgroundColor: 'rgba(0, 255, 135, 0.16)', borderColor: '#00ff87' } : styles.advSelectPillActive),
                            ]}
                            onPress={() => setSelectedAdvisorId(null)}
                          >
                            <Text style={[styles.advSelectText, { color: isDark ? colors.textMuted : '#334155' }, selectedAdvisorId === null && { color: isDark ? '#00ff87' : '#166534', fontFamily: FONT.extraBold }]}>
                              Auto-Assign Doctor
                            </Text>
                          </TouchableOpacity>
                          {availableAdvisors.map((adv) => (
                            <TouchableOpacity
                              key={adv.id}
                              style={[
                                styles.advSelectPill,
                                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9', borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#e2e8f0' },
                                selectedAdvisorId === adv.id && (isDark ? { backgroundColor: 'rgba(0, 255, 135, 0.16)', borderColor: '#00ff87' } : styles.advSelectPillActive),
                              ]}
                              onPress={() => setSelectedAdvisorId(adv.id)}
                            >
                              <Text style={[styles.advSelectText, { color: isDark ? colors.textMuted : '#334155' }, selectedAdvisorId === adv.id && { color: isDark ? '#00ff87' : '#166534', fontFamily: FONT.extraBold }]}>
                                {(adv.role as any) === 'DOCTOR' || (adv as any)?.isSeniorDoctor ? '🩺' : '👨‍⚕️'} {adv.name}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}
                    </View>

                    {/* Subscription Payment Logic (Rule 3): Manual Recharge vs Auto-Debit */}
                    <View style={{ gap: 6 }}>
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>
                        3. Payment Method:
                      </Text>
                      <View style={{ width: '100%', flexDirection: 'row', gap: 6, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9', padding: 3, borderRadius: RADIUS.pill }}>
                        <TouchableOpacity
                          style={{
                            flex: 1,
                            paddingVertical: 7,
                            paddingHorizontal: 8,
                            borderRadius: RADIUS.pill,
                            backgroundColor: !isAutoDebit ? '#16a34a' : 'transparent',
                            alignItems: 'center',
                          }}
                          onPress={() => setIsAutoDebit(false)}
                        >
                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: !isAutoDebit ? '#ffffff' : (isDark ? '#cbd5e1' : '#64748b') }}>
                            💳 Manual Recharge (One-Time)
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={{
                            flex: 1,
                            paddingVertical: 7,
                            paddingHorizontal: 8,
                            borderRadius: RADIUS.pill,
                            backgroundColor: isAutoDebit ? '#16a34a' : 'transparent',
                            alignItems: 'center',
                          }}
                          onPress={() => setIsAutoDebit(true)}
                        >
                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: isAutoDebit ? '#ffffff' : (isDark ? '#cbd5e1' : '#64748b') }}>
                            ⚡ Auto-Debit (UPI Mandate)
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Post-Trial Monthly Breakdown & Revenue Share Card */}
                    <View style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#f8fafc', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0', gap: 6 }}>
                      <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>
                        📊 Monthly Financial Breakdown & Settlement:
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: isDark ? colors.textMuted : '#64748b' }}>Advisor Base Fee:</Text>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>
                          {isFreeTrialMode ? '₹0 (Waived for Trial)' : `₹${baseAdvisorFee}`}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: isDark ? colors.textMuted : '#64748b' }}>FarmsKing Platform Fee:</Text>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>₹{platformFee}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: isDark ? colors.textMuted : '#64748b' }}>GST (18% on ₹99):</Text>
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: isDark ? '#ffffff' : '#0f172a' }}>₹{gstAmount}</Text>
                      </View>
                      <View style={{ height: 1, backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0', marginVertical: 2 }} />
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 12.5, fontFamily: FONT.extraBold, color: isDark ? '#ffffff' : '#0f172a' }}>Total Monthly Charge:</Text>
                        <Text style={{ fontSize: 15, fontFamily: FONT.extraBold, color: '#16a34a' }}>₹{totalPayable}</Text>
                      </View>

                      {/* Revenue split transparency */}
                      <View style={{ backgroundColor: isDark ? 'rgba(0, 255, 135, 0.08)' : '#ecfdf5', padding: 8, borderRadius: 6, marginTop: 4, gap: 2 }}>
                        <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#166534' }}>
                          REVENUE SHARE ALLOCATION:
                        </Text>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: isDark ? '#cbd5e1' : '#14532d' }}>
                          • FarmsKing Retains: ₹{platformFee} Platform Fee + 10% Commission ({isFreeTrialMode ? '₹0' : `₹${adminCommission}`})
                        </Text>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: isDark ? '#cbd5e1' : '#14532d' }}>
                          • Doctor Net Payout: {isFreeTrialMode ? '₹0 during free trial' : `₹${doctorNetPayout} (90% of base fee credited to Doctor Wallet)`}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[styles.buyBtn, { backgroundColor: '#16a34a' }]}
                      disabled={isGeneratingQr}
                      onPress={() => handleInitiatePayment(selectedPlanKey)}
                    >
                      {isGeneratingQr ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Ionicons name={isAutoDebit ? 'repeat' : 'card-outline'} size={18} color="#ffffff" />
                          <Text style={styles.buyBtnText}>
                            {isAutoDebit ? `Setup UPI AutoPay (₹${totalPayable}/mo)` : `Pay ₹${totalPayable} via Cashfree`}
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
