import React, { useRef, useState, useMemo } from 'react';
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
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  useFarmerPlan,
  useFarmerPlanPricing,
  usePreviewFarmerPlanCoupon,
  useRedeemFarmerPlanCoupon,
  useActivateTrial,
  useFarmerPlanConfigs,
  useUpgradeQuote,
  useCancelFarmerPlan,
} from '@/src/hooks/useFarmerPlan';
import { ENABLE_COUPON_SYSTEM } from '@/src/constants/featureFlags';
import { useInitiateFarmerPlanPayment, useSubmitFarmerPlanPayment } from '@/src/hooks/useFarmerPlanPayments';
import { useAvailableAdvisors, useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useMyWallet } from '@/src/hooks/useWallet';
import type { FarmerPlanType, FarmerPlanPricing, FarmerPlanTierConfig } from '@/src/api/farmerPlans.api';

const theme = RoleThemes.FARMER;

const PLAN_RANK: Record<FarmerPlanType, number> = {
  FREE: 0,
  BASIC: 0,
  PRO: 1,
  SILVER: 1,
  SMART: 2,
  GOLD: 2,
  VIP: 3,
  SUPER: 3,
  ROYAL: 3,
  PLATINUM: 3,
  DIAMOND: 4,
};

const PLAN_COLUMN_META: Record<FarmerPlanType, { label: string; emoji: string; color: string; price: string }> = {
  FREE: { label: 'Free Plan', emoji: '🌱', color: '#166534', price: '₹0' },
  PRO: { label: 'Kisan Plan', emoji: '🌾', color: '#0284c7', price: '₹199/yr' },
  SMART: { label: 'Boss Plan', emoji: '👷', color: '#1d4ed8', price: '₹499/yr' },
  VIP: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
  BASIC: { label: 'Free Plan', emoji: '🌱', color: '#166534', price: '₹0' },
  SUPER: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
  PLATINUM: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
  DIAMOND: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
  SILVER: { label: 'Kisan Plan', emoji: '🌾', color: '#0284c7', price: '₹199/yr' },
  GOLD: { label: 'Boss Plan', emoji: '👷', color: '#1d4ed8', price: '₹499/yr' },
  ROYAL: { label: 'Farmer VIP Plan', emoji: '👑', color: '#b45309', price: '₹999/yr' },
};

const FEATURE_LABEL_MAP: Record<string, string> = {
  bahiKhata: 'Digital Bahi-Khata Ledger',
  cropLogs: 'Crop Cultivation Logs & Acreage',
  voiceAiMic: 'Voice AI Mic Recording',
  weatherEnabled: 'Hyperlocal Weather Alerts',
  arhtiyaCalc: 'Arhtiya Commission & Interest Calc',
  labourMgmt: 'Labour Wages & Attendance',
  workerLogin: 'Worker & Supervisor App Login',
  mandiAi: 'Live Mandi AI Forecasts',
  satelliteNDVI: 'Satellite NDVI Field Health',
  unlimitedCrops: 'Unlimited Active Crops',
  advisorIncluded: 'Dedicated Certified Farm Advisor',
  storeDiscount: 'AgriStore Certified Product Discounts',
};

export function FarmerPlanUpgradeModal({
  visible,
  onClose,
  tiers = ['PRO', 'SMART', 'SUPER'],
  initialMode = 'GET_COUPON',
}: {
  visible: boolean;
  onClose: () => void;
  tiers?: FarmerPlanType[];
  initialMode?: 'GET_COUPON' | 'REDEEM_CODE';
}) {
  const { plan: currentPlan, isExpired, inGrace, hasUsedTrial, startDate } = useFarmerPlan();
  const { data: rawPricing } = useFarmerPlanPricing();
  const { data: settings } = useAppSettings();
  const { data: configsData } = useFarmerPlanConfigs();
  const { data: walletData, refetch: refetchWallet } = useMyWallet();

  const freeTrialDays = settings?.freeTrialDays ?? 10;
  const freeTrialPlan = settings?.freeTrialPlan || 'Super VIP';
  const pricingList = Array.isArray(rawPricing) ? rawPricing : (rawPricing as any)?.items || (rawPricing as any)?.data || [];
  const isTrialEligible = !hasUsedTrial && currentPlan === 'FREE';

  const preview = usePreviewFarmerPlanCoupon();
  const redeem = useRedeemFarmerPlanCoupon();
  const activateTrial = useActivateTrial();
  const initiate = useInitiateFarmerPlanPayment();
  const submitPayment = useSubmitFarmerPlanPayment();
  const cancelPlanMutation = useCancelFarmerPlan();
  const { data: myAdvisor } = useMyAdvisor();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<Awaited<ReturnType<typeof preview.mutateAsync>> | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof redeem.mutateAsync>> | null>(null);
  const [showCouponInput, setShowCouponInput] = useState(initialMode === 'REDEEM_CODE');
  const [pickedPlan, setPickedPlan] = useState<FarmerPlanType>('PRO');
  const [selectedDaysMap, setSelectedDaysMap] = useState<Record<string, number>>({});
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);
  const [useWalletPoints, setUseWalletPoints] = useState(false);

  // In-Modal UPI QR State (PC Web Friendly)
  const [upiCheckoutData, setUpiCheckoutData] = useState<{
    id: string;
    amount: number;
    upiLink: string;
    payeeVpa: string;
    payeeName: string;
    planName: string;
  } | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [copiedVpa, setCopiedVpa] = useState(false);

  // 24-Hour Cancellation State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const codeInputRef = useRef<TextInput>(null);

  const availablePoints = Math.max(0, Number(walletData?.balance ?? 0));

  // Determine current active plan rank
  const currentPlanRank = PLAN_RANK[currentPlan || 'FREE'] ?? 0;
  const isCurrentActive = Boolean(currentPlan && currentPlan !== 'FREE' && !isExpired);

  // 24-Hour cancellation window check
  const hoursSinceActivation = useMemo(() => {
    if (!startDate || currentPlan === 'FREE') return 999;
    const diffMs = Date.now() - new Date(startDate).getTime();
    return diffMs / (1000 * 60 * 60);
  }, [startDate, currentPlan]);

  const canCancelWithin24h = isCurrentActive && hoursSinceActivation <= 24;

  React.useEffect(() => {
    if (visible) {
      setError(null);
      setShowCouponInput(initialMode === 'REDEEM_CODE');
      setUpiCheckoutData(null);
      setUtrInput('');
      setUseWalletPoints(false);

      if (currentPlan && currentPlan !== 'FREE' && tiers.includes(currentPlan)) {
        setPickedPlan(currentPlan);
      } else {
        setPickedPlan('PRO');
      }
    }
  }, [visible, initialMode, currentPlan]);

  const needsAdvisorPick = !!previewResult?.includesAdvisor && !myAdvisor;
  const { data: availableAdvisors, isLoading: isLoadingAvailableAdvisors } = useAvailableAdvisors(needsAdvisorPick);

  // Dynamic upgrade quote calculation
  const activeVariants = useMemo(() => {
    return (Array.isArray(pricingList) ? pricingList : [])
      .filter((it: FarmerPlanPricing) => it && it.plan === pickedPlan && it.isActive !== false)
      .sort((a: FarmerPlanPricing, b: FarmerPlanPricing) => Number(a?.billingPeriodDays || 0) - Number(b?.billingPeriodDays || 0));
  }, [pricingList, pickedPlan]);

  const selectedDays = selectedDaysMap[pickedPlan] || (activeVariants || [])[0]?.billingPeriodDays || 365;
  const { data: upgradeQuote } = useUpgradeQuote(pickedPlan, selectedDays, visible && pickedPlan !== 'FREE');

  // Dynamic tier configuration from Admin
  const tierConfigs = configsData?.configs || {};
  const currentTierConfig: FarmerPlanTierConfig | undefined = tierConfigs[pickedPlan];

  // Base price resolution (accounting for admin special offer if active)
  const basePrice = useMemo(() => {
    if (pickedPlan === 'FREE') return 0;
    if (currentTierConfig?.offer?.enabled && Number(currentTierConfig.offer?.offerPrice) > 0) {
      return Number(currentTierConfig.offer.offerPrice);
    }
    if (upgradeQuote?.netPayableAmount != null) {
      return upgradeQuote.netPayableAmount;
    }
    const variant = (activeVariants || []).find((v: any) => Number(v?.billingPeriodDays) === Number(selectedDays)) || (activeVariants || [])[0];
    return variant ? Number(variant.price) : Number(currentTierConfig?.price || 199);
  }, [pickedPlan, currentTierConfig, upgradeQuote, activeVariants, selectedDays]);

  // Points deduction calculation
  const pointsRedeemable = useMemo(() => {
    if (!useWalletPoints || basePrice <= 0) return 0;
    return Math.min(availablePoints, basePrice);
  }, [useWalletPoints, basePrice, availablePoints]);

  const finalPayable = Math.max(0, Math.round((basePrice - pointsRedeemable) * 100) / 100);

  const reset = () => {
    setCode('');
    setError(null);
    setPreviewResult(null);
    setResult(null);
    setShowCouponInput(false);
    setSelectedAdvisorId(null);
    setIsPaying(false);
    setUpiCheckoutData(null);
    setUtrInput('');
    setShowCancelModal(false);
    setCancelReason('');
  };

  const closeAndReset = () => {
    reset();
    onClose();
  };

  const handlePickPlan = async (plan: FarmerPlanType) => {
    if (plan === 'FREE') {
      try {
        await activateTrial.mutateAsync();
        const msg = '🎉 Free Demo Trial Activated successfully!';
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Trial Activated', msg);
        closeAndReset();
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Trial already active or used.';
        if (Platform.OS === 'web') alert(`Notice: ${msg}`);
        else Alert.alert('Notice', msg);
        closeAndReset();
      }
      return;
    }

    // Downgrade Guard check
    const targetRank = PLAN_RANK[plan] ?? 0;
    if (isCurrentActive && targetRank < currentPlanRank) {
      setError(`Downgrades are not permitted. Your active ${currentPlan} tier has higher privileges than ${plan}.`);
      return;
    }

    setPickedPlan(plan);
    const variants = pricingList.filter((it: FarmerPlanPricing) => it.plan === plan && it.isActive !== false);
    if (variants.length > 0 && !selectedDaysMap[plan]) {
      setSelectedDaysMap((prev: Record<string, number>) => ({ ...prev, [plan]: Number(variants[0].billingPeriodDays) }));
    }
  };

  const handleProceedToPayment = async () => {
    if (pickedPlan === 'FREE') {
      handlePickPlan('FREE');
      return;
    }

    // Downgrade Guard verification
    const targetRank = PLAN_RANK[pickedPlan] ?? 0;
    if (isCurrentActive && targetRank < currentPlanRank) {
      setError(`Cannot downgrade active ${currentPlan} subscription to ${pickedPlan}.`);
      return;
    }

    setError(null);
    setIsPaying(true);
    try {
      const days = selectedDaysMap[pickedPlan] || activeVariants[0]?.billingPeriodDays || 365;

      const res: any = await initiate.mutateAsync({
        targetPlan: pickedPlan,
        billingPeriodDays: Number(days),
        useWalletPoints,
        pointsToDeduct: pointsRedeemable,
      });

      // 1. Instant Activation via Wallet Points (100% covered, ₹0 payable)
      if (res?.confirmed || res?.activated || finalPayable === 0) {
        const msg = `🎉 ${pickedPlan} plan activated successfully! ${pointsRedeemable > 0 ? `(${pointsRedeemable} FarmsKing Points redeemed)` : ''}`;
        if (Platform.OS === 'web') alert(msg);
        else Alert.alert('Plan Activated', msg);
        refetchWallet();
        closeAndReset();
        return;
      }

      // 2. Online Payment Gateway (PhonePe / Cashfree web portal - ONLY if valid HTTP/HTTPS URL)
      const targetGatewayUrl =
        res?.paymentLink ||
        res?.phonepeRedirectUrl ||
        res?.cashfreePaymentLink ||
        (res?.cashfreeSessionId ? `https://payments.cashfree.com/order/#${res.cashfreeSessionId}` : null) ||
        res?.razorpayShortUrl;

      const isHttpGateway = typeof targetGatewayUrl === 'string' && (targetGatewayUrl.startsWith('https://') || targetGatewayUrl.startsWith('http://'));
      if (isHttpGateway) {
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.location.href = targetGatewayUrl;
        } else {
          await Linking.openURL(targetGatewayUrl);
        }
        return;
      }

      // 3. Direct UPI Flow (Embedded in Modal - ZERO blank new tab on PC Web!)
      if (res?.upiLink) {
        const vpa = res?.payeeVpa || (settings as any)?.upiId || 'surindersinghmakhu-8@okicici';
        const payee = res?.payeeName || (settings as any)?.upiPayeeName || 'FarmsKing Technologies';

        setUpiCheckoutData({
          id: res.id,
          amount: finalPayable,
          upiLink: res.upiLink,
          payeeVpa: vpa,
          payeeName: payee,
          planName: currentTierConfig?.name || `${pickedPlan} Plan`,
        });
      } else {
        setError('Payment gateway link could not be generated. Please try again.');
      }
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not initiate payment gateway.');
    } finally {
      setIsPaying(false);
    }
  };

  const handleCopyVpa = () => {
    if (!upiCheckoutData) return;
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(upiCheckoutData.payeeVpa);
    }
    setCopiedVpa(true);
    setTimeout(() => setCopiedVpa(false), 2500);
  };

  const handleSubmitUtr = async () => {
    if (!upiCheckoutData) return;
    if (!utrInput.trim()) {
      setError('Please enter the 12-digit UPI UTR / Transaction Reference Number.');
      return;
    }
    setIsSubmittingUtr(true);
    setError(null);
    try {
      await submitPayment.mutateAsync({
        id: upiCheckoutData.id,
        utr: utrInput.trim(),
      });
      const msg = '⚡ Payment details submitted! Your VIP pass is activated instantly.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Plan Activated', msg);
      refetchWallet();
      closeAndReset();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not verify transaction UTR.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  const handleExecuteCancelPlan = async () => {
    setIsCancelling(true);
    setError(null);
    try {
      const res: any = await cancelPlanMutation.mutateAsync({ reason: cancelReason.trim() });
      const msg = `✅ ${res?.message || 'Plan cancelled successfully. 100% of amount credited to your wallet as Points.'}`;
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Plan Cancelled', msg);
      setShowCancelModal(false);
      refetchWallet();
      closeAndReset();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not cancel plan.');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCheckCode = async () => {
    if (!code.trim()) {
      setError('Enter your plan coupon code.');
      return;
    }
    setError(null);
    try {
      const res = await preview.mutateAsync({ code: code.trim().toUpperCase() });
      setPreviewResult(res);
    } catch (err: any) {
      setPreviewResult(null);
      setError(err?.response?.data?.message ?? 'Invalid or already-used code.');
    }
  };

  const handleConfirmCoupon = async () => {
    setError(null);
    try {
      const res = await redeem.mutateAsync({
        code: code.trim().toUpperCase(),
        advisorId: selectedAdvisorId ?? undefined,
      });
      setResult(res);
    } catch (err: any) {
      setPreviewResult(null);
      setError(err?.response?.data?.message ?? 'Invalid or already-used code.');
    }
  };

  const planOptions = [
    {
      id: 'PRO',
      key: 'PRO' as FarmerPlanType,
      label: tierConfigs.PRO?.name || '🌾 Kisan Plan',
      iconName: 'flash',
      color: '#0284c7',
      sub: tierConfigs.PRO?.subtitle || 'Digital Bahi-Khata, crop logs & Voice AI recording',
      badge: tierConfigs.PRO?.badge || 'POPULAR',
      offer: tierConfigs.PRO?.offer,
      features: tierConfigs.PRO?.features,
    },
    {
      id: 'SMART',
      key: 'SMART' as FarmerPlanType,
      label: tierConfigs.SMART?.name || '👷 Boss Plan',
      iconName: 'sparkles',
      color: '#1d4ed8',
      sub: tierConfigs.SMART?.subtitle || 'Complete farm management + labour tracking & worker login',
      badge: tierConfigs.SMART?.badge || 'RECOMMENDED',
      offer: tierConfigs.SMART?.offer,
      features: tierConfigs.SMART?.features,
    },
    {
      id: 'SUPER',
      key: 'SUPER' as FarmerPlanType,
      label: tierConfigs.SUPER?.name || '👑 Farmer VIP Plan',
      iconName: 'shield-checkmark',
      color: '#b45309',
      sub: tierConfigs.SUPER?.subtitle || 'VIP satellite telemetry, mandi intelligence & dedicated advisor',
      badge: tierConfigs.SUPER?.badge || 'BEST VALUE',
      offer: tierConfigs.SUPER?.offer,
      features: tierConfigs.SUPER?.features,
    },
    ...(isTrialEligible
      ? [
          {
            id: 'FREE',
            key: 'FREE' as FarmerPlanType,
            label: '🌱 Free Plan Trial 🎁',
            iconName: 'leaf',
            color: '#166534',
            sub: `Full ${freeTrialPlan} Plan Access (${freeTrialDays}-Day Free Demo Trial) 🎁`,
            badge: 'FREE DEMO',
            offer: null,
            features: null,
          },
        ]
      : []),
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAndReset}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#022c22', '#065f46', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBanner}
          >
            <View style={{ flex: 1, gap: 4 }}>
              <View style={styles.highlightVipLabelWrap}>
                <Ionicons name="sparkles" size={13} color="#f59e0b" />
                <Text style={styles.highlightVipLabelText}>FARMSKING PLATFORM USAGE PLANS</Text>
              </View>
              {currentPlan && currentPlan !== 'FREE' ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#86efac' }}>
                    Currently Active: {currentPlan} Tier
                  </Text>
                  {canCancelWithin24h && (
                    <TouchableOpacity
                      onPress={() => setShowCancelModal(true)}
                      style={{
                        backgroundColor: '#dc2626',
                        paddingHorizontal: 7,
                        paddingVertical: 2,
                        borderRadius: RADIUS.pill,
                      }}
                    >
                      <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>
                        Cancel (24h)
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : null}
            </View>
            <TouchableOpacity onPress={closeAndReset} style={styles.closeBtnIcon}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          {/* 24-HOUR CANCELLATION MODAL */}
          {showCancelModal ? (
            <View style={{ gap: 14, paddingVertical: 10 }}>
              <View style={{ backgroundColor: '#fef2f2', padding: 14, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#f87171', gap: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="alert-circle" size={22} color="#dc2626" />
                  <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#991b1b' }}>
                    Cancel Plan (24-Hour Statutory Window)
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: '#7f1d1d', lineHeight: 17 }}>
                  If you activated this subscription by mistake, you can cancel it within 24 hours.
                  {'\n\n'}
                  <Text style={{ fontFamily: FONT.bold }}>Statutory Refund Policy:</Text> 100% of your paid amount will be refunded directly to your <Text style={{ fontFamily: FONT.bold }}>FarmsKing Wallet as Points (1 Point = ₹1)</Text>. No cash or bank transfers are permitted. Any assigned advisor will be unlinked.
                </Text>
                <TextInput
                  style={[styles.input, { marginTop: 6, fontSize: 12, backgroundColor: '#ffffff' }]}
                  placeholder="Optional cancellation reason (e.g. ordered by mistake)"
                  placeholderTextColor="#94a3b8"
                  value={cancelReason}
                  onChangeText={setCancelReason}
                />
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity
                  style={[styles.submitBtn, { flex: 1, backgroundColor: '#dc2626' }]}
                  onPress={handleExecuteCancelPlan}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Confirm Cancellation & Wallet Refund</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, { flex: 0.6, backgroundColor: '#64748b' }]}
                  onPress={() => setShowCancelModal(false)}
                >
                  <Text style={styles.submitBtnText}>Keep Plan</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : upiCheckoutData ? (
            /* IN-MODAL OFFICIAL UPI CHECKOUT (Zero blank tab on PC Web!) */
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                onPress={() => setUpiCheckoutData(null)}
              >
                <Ionicons name="arrow-back" size={15} color="#0284c7" />
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0284c7' }}>Back to Plans</Text>
              </TouchableOpacity>

              <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', borderRadius: RADIUS.md, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={18} color="#16a34a" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#166534' }}>Official UPI Direct Checkout</Text>
                  <Text style={{ fontSize: 10, fontFamily: FONT.medium, color: '#15803d' }}>FARMSKING TECHNOLOGIES PRIVATE LIMITED</Text>
                </View>
              </View>

              {/* Amount Box */}
              <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#475569' }}>Net Payable Amount:</Text>
                <Text style={{ fontSize: 20, fontFamily: FONT.extraBold, color: '#16a34a' }}>₹{upiCheckoutData.amount}</Text>
              </View>

              {/* QR Code */}
              <View style={{ alignItems: 'center', backgroundColor: '#ffffff', padding: 14, borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#e2e8f0', gap: 8 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>Scan with GPay, PhonePe, Paytm or BHIM</Text>
                <Image
                  source={{
                    uri: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=1&ecc=H&data=${encodeURIComponent(upiCheckoutData.upiLink)}`,
                  }}
                  style={{ width: 170, height: 170, borderRadius: 8 }}
                  resizeMode="contain"
                />

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f1f5f9', paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>UPI ID: {upiCheckoutData.payeeVpa}</Text>
                  <TouchableOpacity onPress={handleCopyVpa} style={{ backgroundColor: '#0284c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.pill }}>
                    <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' }}>{copiedVpa ? 'Copied!' : 'Copy'}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Step 2: UTR Reference Submission */}
              <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#cbd5e1', gap: 6 }}>
                <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>Enter 12-Digit UPI Transaction / UTR Number</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: '#ffffff' }]}
                  placeholder="e.g. 432109876543"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  maxLength={12}
                  value={utrInput}
                  onChangeText={setUtrInput}
                />
              </View>

              {error ? <Text style={styles.errorText}>❌ {error}</Text> : null}

              <TouchableOpacity
                style={[styles.submitBtn, isSubmittingUtr && { opacity: 0.7 }]}
                disabled={isSubmittingUtr}
                onPress={handleSubmitUtr}
              >
                {isSubmittingUtr ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Verify & Activate Plan</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          ) : result ? (
            <View style={{ gap: 12, paddingVertical: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                <Text style={styles.successText}>
                  {result.plan.plan} VIP Pass active! New expiry: {new Date(result.newEndDate).toLocaleDateString('en-IN')}
                </Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={closeAndReset}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              <Text style={styles.label}>SELECT PLATFORM USAGE PLAN:</Text>

              {/* Plans List */}
              <View style={{ gap: 8 }}>
                {planOptions.map((item) => {
                  const p = item.key;
                  const isSelected = pickedPlan === p;
                  const targetRank = PLAN_RANK[p] ?? 0;
                  const isDowngradeDisabled = isCurrentActive && targetRank < currentPlanRank;

                  // Active Offer banner
                  const hasOffer = Boolean(item.offer?.enabled && Number(item.offer?.offerPrice) > 0);
                  const displayPrice = p === 'FREE'
                    ? '₹0'
                    : hasOffer
                    ? `₹${item.offer.offerPrice}`
                    : `₹${currentTierConfig?.price || '199'}`;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.advisorPickRow,
                        isSelected && { borderColor: item.color, backgroundColor: '#f0fdf4' },
                        isDowngradeDisabled && { opacity: 0.5, backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
                      ]}
                      activeOpacity={isDowngradeDisabled ? 1 : 0.85}
                      onPress={() => !isDowngradeDisabled && handlePickPlan(p)}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Ionicons name={item.iconName as any} size={15} color={item.color} />
                          <Text style={[styles.advisorPickName, { color: item.color }]}>
                            {item.label}
                          </Text>

                          {isDowngradeDisabled ? (
                            <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.pill }}>
                              <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#dc2626' }}>🔒 Lower Tier Disabled</Text>
                            </View>
                          ) : currentPlan === p ? (
                            <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.pill }}>
                              <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#166534' }}>Current Active</Text>
                            </View>
                          ) : item.badge ? (
                            <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 1, borderRadius: RADIUS.pill }}>
                              <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#b45309' }}>{item.badge}</Text>
                            </View>
                          ) : null}
                        </View>

                        {/* Price & Offer Display */}
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 3 }}>
                          <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' }}>
                            {displayPrice}
                          </Text>
                          {p !== 'FREE' && (
                            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>
                              / 365 days
                            </Text>
                          )}
                          {hasOffer && (
                            <View style={{ backgroundColor: '#ffedd5', paddingHorizontal: 5, paddingVertical: 1, borderRadius: RADIUS.pill, flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                              <Ionicons name="flame" size={11} color="#ea580c" />
                              <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: '#c2410c' }}>
                                {item.offer?.name || 'Festival Offer'}
                              </Text>
                            </View>
                          )}
                        </View>

                        <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>
                          {item.sub}
                        </Text>

                        {/* Feature Badges from Admin Checkboxes */}
                        {item.features && isSelected && (
                          <View style={{ marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', gap: 4 }}>
                            <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#475569', textTransform: 'uppercase' }}>
                              Included Features:
                            </Text>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
                              {Object.entries(item.features)
                                .filter(([_, enabled]) => Boolean(enabled))
                                .map(([fKey]) => (
                                  <View key={fKey} style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                    <Ionicons name="checkmark-circle" size={10} color="#16a34a" />
                                    <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#166534' }}>
                                      {FEATURE_LABEL_MAP[fKey] || fKey}
                                    </Text>
                                  </View>
                                ))}
                            </View>
                          </View>
                        )}
                      </View>

                      <View style={{ alignItems: 'flex-end', justifyContent: 'center' }}>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={isDowngradeDisabled ? '#cbd5e1' : isSelected ? item.color : '#cbd5e1'}
                        />
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* PRORATED UPGRADE SAVINGS CARD */}
              {upgradeQuote?.isUpgrade && (upgradeQuote.unusedCreditAmount || 0) > 0 ? (
                <View style={{ backgroundColor: '#eff6ff', borderWidth: 1.5, borderColor: '#3b82f6', borderRadius: RADIUS.md, padding: 10, gap: 4 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="sparkles" size={14} color="#1d4ed8" />
                    <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#1e40af' }}>
                      Prorated Upgrade Credit Applied
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#1e3a8a' }}>
                    {upgradeQuote.daysRemaining} days remaining from active {upgradeQuote.currentPlan} plan.
                    {'\n'}
                    Plan Base Price: ₹{upgradeQuote.targetPlanPrice}
                    {'\n'}
                    Unused Active Credit: <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>-₹{upgradeQuote.unusedCreditAmount}</Text>
                    {'\n'}
                    Net Upgrade Balance: <Text style={{ fontFamily: FONT.bold, color: '#1d4ed8' }}>₹{upgradeQuote.netPayableAmount}</Text>
                  </Text>
                </View>
              ) : null}

              {/* SAME TIER EXTENSION NOTICE */}
              {upgradeQuote?.isSameTierRenewal ? (
                <View style={{ backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac', borderRadius: RADIUS.md, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time" size={14} color="#16a34a" />
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#14532d', flex: 1 }}>
                    {upgradeQuote.extensionNotice || `Your subscription will be extended by +${upgradeQuote.daysGranted} days on top of your current expiry date.`}
                  </Text>
                </View>
              ) : null}

              {/* WALLET POINTS REDEMPTION CHECKBOX (1 Point = ₹1 INR) */}
              {availablePoints > 0 && pickedPlan !== 'FREE' ? (
                <TouchableOpacity
                  style={{
                    backgroundColor: useWalletPoints ? '#f0fdf4' : '#f8fafc',
                    borderWidth: 1.5,
                    borderColor: useWalletPoints ? '#16a34a' : '#e2e8f0',
                    borderRadius: RADIUS.md,
                    padding: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                  }}
                  onPress={() => setUseWalletPoints((v) => !v)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={useWalletPoints ? 'checkbox' : 'square-outline'}
                    size={20}
                    color={useWalletPoints ? '#16a34a' : '#94a3b8'}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>
                      Redeem FarmsKing Points ({availablePoints} Points Available)
                    </Text>
                    <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' }}>
                      1 Point = ₹1 INR · Deducts ₹{pointsRedeemable} from total amount
                    </Text>
                  </View>
                  {useWalletPoints && pointsRedeemable > 0 && (
                    <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#16a34a' }}>
                      -₹{pointsRedeemable}
                    </Text>
                  )}
                </TouchableOpacity>
              ) : null}

              {/* Error Display */}
              {error ? (
                <View style={{ backgroundColor: '#fef2f2', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fecaca' }}>
                  <Text style={styles.errorText}>❌ {error}</Text>
                </View>
              ) : null}

              {/* DIRECT PAYMENT / INSTANT ACTIVATION BUTTON */}
              <TouchableOpacity
                style={[styles.submitBtn, isPaying && { opacity: 0.7 }]}
                disabled={isPaying}
                onPress={handleProceedToPayment}
                activeOpacity={0.88}
              >
                {isPaying ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
                    <Text style={styles.submitBtnText}>
                      {pickedPlan === 'FREE'
                        ? 'Activate Free Demo Trial 🎁'
                        : finalPayable === 0
                        ? `⚡ Activate Instantly with ${pointsRedeemable} Points (₹0 to pay)`
                        : `Proceed to Pay ₹${finalPayable} Securely`}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* COLLAPSIBLE COUPON ACCORDION */}
              {ENABLE_COUPON_SYSTEM ? (
                <View style={{ marginTop: 4 }}>
                  <TouchableOpacity
                    style={styles.seePlansBtn}
                    onPress={() => setShowCouponInput((v: boolean) => !v)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pricetag-outline" size={14} color={theme.primary} />
                    <Text style={styles.seePlansBtnText}>
                      {showCouponInput ? 'Hide Coupon Box ▲' : 'Have a VIP Pass Coupon Code? Tap here ▼'}
                    </Text>
                  </TouchableOpacity>

                  {showCouponInput ? (
                    <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', gap: 8, marginTop: 4 }}>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#475569' }}>
                        Enter your VIP Pass coupon code below:
                      </Text>
                      <TextInput
                        ref={codeInputRef}
                        style={styles.input}
                        placeholder="e.g. PLAN-A1B2C3"
                        placeholderTextColor="#94a3b8"
                        autoCapitalize="characters"
                        value={code}
                        onChangeText={setCode}
                      />
                      <TouchableOpacity
                        style={[styles.submitBtn, { backgroundColor: '#0f172a', paddingVertical: 10 }]}
                        disabled={preview.isPending}
                        onPress={handleCheckCode}
                      >
                        {preview.isPending ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.submitBtnText}>Check Coupon Code</Text>}
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    gap: 8,
    overflow: 'hidden',
    ...premiumShadow('#000000', 'lg'),
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: -SPACING.lg,
    marginTop: -SPACING.lg,
    marginBottom: 8,
    borderBottomWidth: 1.5,
    borderBottomColor: '#10b981',
  },
  highlightVipLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  highlightVipLabelText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#92400e',
    letterSpacing: 0.5,
  },
  closeBtnIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FONT.bold,
    backgroundColor: '#ffffff',
    color: '#0f172a',
  },
  errorText: {
    color: '#dc2626',
    fontFamily: FONT.bold,
    fontSize: 11.5,
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    ...premiumShadow('#16a34a', 'sm'),
  },
  submitBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 13,
  },
  seePlansBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
  },
  seePlansBtnText: {
    color: theme.primary,
    fontFamily: FONT.bold,
    fontSize: 12,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  successText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#15803d',
  },
  advisorPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    padding: 11,
    backgroundColor: '#ffffff',
  },
  advisorPickName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  advisorPickMeta: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
});
