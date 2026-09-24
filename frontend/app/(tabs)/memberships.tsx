import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerPlan, useFarmerPlanPricing, useRedeemFarmerPlanCoupon, useActivateTrial } from '@/src/hooks/useFarmerPlan';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useMyAdvisor, useAvailableAdvisors, useChooseAdvisor, useMyPendingRequest } from '@/src/hooks/useAdvisorAssignments';
import { useCrops } from '@/src/store/crops-context';
import { useAuth } from '@/src/store/auth-context';
import { CopyButton } from '@/src/components/CopyButton';
import { DoctorChangeDisclaimerModal } from '@/src/components/DoctorChangeDisclaimerModal';
import { CropCarePlanModal } from '@/src/components/CropCarePlanModal';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function MembershipsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { plan, limits, endDate, isExpired } = useFarmerPlan();
  const { data: settings } = useAppSettings();
  const activateTrialMutation = useActivateTrial();
  const { data: allPricing = [], isLoading: isLoadingPricing } = useFarmerPlanPricing();
  const { data: myAdvisorData } = useMyAdvisor();
  const { data: availableAdvisors = [] } = useAvailableAdvisors();
  const { data: pendingRequest } = useMyPendingRequest();
  const chooseAdvisor = useChooseAdvisor();
  const redeemCouponMutation = useRedeemFarmerPlanCoupon();
  const { cropFields } = useCrops();

  const [activeTab, setActiveTab] = useState<'FARMER_SOFTWARE' | 'CROP_CARE'>('FARMER_SOFTWARE');
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [appliedCouponNotice, setAppliedCouponNotice] = useState<string | null>(null);
  const [isChoosingAdvisor, setIsChoosingAdvisor] = useState(false);
  const [isCropCareModalOpen, setIsCropCareModalOpen] = useState(false);
  const [disclaimerModalVisible, setDisclaimerModalVisible] = useState(false);
  const [targetAdvisorToRequest, setTargetAdvisorToRequest] = useState<{ id: string; name: string } | null>(null);

  const activeAdvisor = myAdvisorData?.advisor;
  const activeCropsCount = cropFields.filter((c) => c.status === 'ACTIVE').length;

  const freeTrialEnabled = settings?.freeTrialEnabled ?? true;
  const freeTrialDays = settings?.freeTrialDays ?? 14;

  const handleActivateFreeTrial = async () => {
    tap();
    try {
      const res = await activateTrialMutation.mutateAsync();
      const msg = `🎉 Free Trial Activated! You have received free trial access for ${freeTrialDays} days.`;
      setAppliedCouponNotice(msg);
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Free Trial Activated', msg);
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || 'Could not activate free trial.';
      setAppliedCouponNotice(`❌ ${errMsg}`);
      if (Platform.OS === 'web') alert(errMsg);
      else Alert.alert('Error', errMsg);
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCodeInput.trim()) {
      setAppliedCouponNotice('⚠️ Please enter a coupon code.');
      return;
    }
    tap();
    const code = couponCodeInput.trim().toUpperCase();
    try {
      const res = await redeemCouponMutation.mutateAsync({ code });
      setAppliedCouponNotice(`🎉 Coupon "${code}" Redeemed Successfully! Your plan / doctor care has been updated.`);
      setCouponCodeInput('');
    } catch (err: any) {
      const msg = err?.response?.data?.message || `Invalid or expired coupon code "${code}".`;
      setAppliedCouponNotice(`❌ ${msg}`);
    }
  };

  const handleInitiateAdvisorRequest = (adv: { id: string; name: string }) => {
    tap();
    setTargetAdvisorToRequest(adv);
    if (activeAdvisor) {
      setDisclaimerModalVisible(true);
    } else {
      executeAdvisorRequest(adv.id);
    }
  };

  const executeAdvisorRequest = async (advisorId: string) => {
    try {
      await chooseAdvisor.mutateAsync(advisorId);
      setIsChoosingAdvisor(false);
      setDisclaimerModalVisible(false);
      setTargetAdvisorToRequest(null);
      if (Platform.OS === 'web') alert('✅ Request submitted! Super Admin will review doctor change request and notify your doctor.');
      else Alert.alert('Success', 'Request submitted! Super Admin will review doctor change request and notify your doctor.');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Could not request doctor.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    }
  };

  return (
    <View style={styles.container}>
      {/* Hero Header */}
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>👑 FarmsKing Memberships</Text>
            <Text style={styles.heroSubtitle}>Farmer App Access & Doctor Advisory Care Plans</Text>
          </View>
        </View>

        {/* Section Tabs Switcher */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'FARMER_SOFTWARE' && styles.tabItemActive]}
            onPress={() => { tap(); setActiveTab('FARMER_SOFTWARE'); }}
          >
            <Ionicons name="ticket" size={15} color={activeTab === 'FARMER_SOFTWARE' ? '#ffffff' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === 'FARMER_SOFTWARE' && styles.tabTextActive]}>
              🎫 Farmer Pass
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'CROP_CARE' && styles.tabItemActive]}
            onPress={() => { tap(); setActiveTab('CROP_CARE'); }}
          >
            <Ionicons name="medical" size={15} color={activeTab === 'CROP_CARE' ? '#ffffff' : '#94a3b8'} />
            <Text style={[styles.tabText, activeTab === 'CROP_CARE' && styles.tabTextActive]}>
              🩺 Hire Doctor
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1. FARMER PASS MEMBERSHIPS PART */}
        {activeTab === 'FARMER_SOFTWARE' ? (
          <View style={{ gap: 14 }}>
            {/* Current Active Plan Status */}
            <View style={[styles.statusCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.statusBadgeIcon}>
                    <Ionicons name="ribbon" size={20} color="#16a34a" />
                  </View>
                  <View>
                    <Text style={styles.statusLabel}>CURRENT FARMER PASS</Text>
                    <Text style={styles.statusPlanName}>
                      {!isExpired && plan !== 'FREE'
                        ? `${plan === 'PRO' ? 'Lite VIP Plan 👑' : plan === 'SMART' ? 'Pro VIP Plan 👑' : 'Super VIP Plan 👑'} (Free Trial)`
                        : plan === 'PRO' ? 'Lite VIP Plan 👑' : plan === 'SMART' ? 'Pro VIP Plan 👑' : 'Free Starter Plan'}
                    </Text>
                  </View>
                </View>
                <View style={[styles.activePill, { backgroundColor: isExpired ? '#fef2f2' : '#ecfdf5' }]}>
                  <Text style={[styles.activePillText, { color: isExpired ? '#dc2626' : '#059669' }]}>
                    {isExpired ? 'EXPIRED' : plan !== 'FREE' ? 'Free Trial' : 'ACTIVE'}
                  </Text>
                </View>
              </View>

              <View style={styles.statusMetricsRow}>
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{activeCropsCount} / {limits?.maxActiveCrops ?? '∞'}</Text>
                  <Text style={styles.metricLabel}>Active Crop Slots</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{limits?.maxTotalCrops ?? 'Unlimited'}</Text>
                  <Text style={styles.metricLabel}>Total Crops Limit</Text>
                </View>
                <View style={styles.metricDivider} />
                <View style={styles.metricItem}>
                  <Text style={styles.metricValue}>{endDate ? new Date(endDate).toLocaleDateString('en-IN') : 'Lifetime'}</Text>
                  <Text style={styles.metricLabel}>Plan Expiry Date</Text>
                </View>
              </View>
            </View>

            {/* Quick Coupon Code Redeemer Card */}
            <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
              <Text style={styles.cardHeaderTitle}>🎟️ Have a Discount Coupon?</Text>
              <Text style={styles.cardHeaderSub}>Redeem promo keys or coupon cards for instant discount</Text>
              <View style={styles.couponInputRow}>
                <TextInput
                  style={styles.couponInput}
                  placeholder="Enter Coupon Code (e.g. FARMS2026)"
                  placeholderTextColor="#94a3b8"
                  value={couponCodeInput}
                  onChangeText={setCouponCodeInput}
                  autoCapitalize="characters"
                />
                <TouchableOpacity style={styles.applyBtn} onPress={handleApplyCoupon}>
                  <Text style={styles.applyBtnText}>Apply</Text>
                </TouchableOpacity>
              </View>
              {appliedCouponNotice ? <Text style={styles.noticeText}>{appliedCouponNotice}</Text> : null}
            </View>

            {/* Software Plan Pricing Cards */}
            <Text style={styles.sectionHeaderTitle}>SELECT FARMER PASS PLAN</Text>

            {/* Plan 1: Free Plan */}
            <View style={[styles.planCard, premiumShadow('#000000', 'sm')]}>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.planTitle}>🌱 Free Starter Plan</Text>
                  <Text style={styles.planPrice}>₹0 <Text style={styles.planPeriod}>/ forever</Text></Text>
                </View>
                {plan === 'FREE' && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current</Text></View>}
              </View>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✓ Register up to 1 Active Crop Field</Text>
                <Text style={styles.featureItem}>✓ Share up to 50 Sale Invoices / Bills</Text>
                <Text style={styles.featureItem}>✓ Basic AI Crop Disease Scanner</Text>
                <Text style={styles.featureItem}>✕ No Satellite NDVI Field Heatmaps</Text>
              </View>

              {/* Free Trial Button */}
              {freeTrialEnabled && (plan === 'FREE' || isExpired) ? (
                <TouchableOpacity
                  style={[styles.upgradeBtn, { backgroundColor: '#166534', marginTop: 6 }]}
                  disabled={activateTrialMutation.isPending}
                  onPress={handleActivateFreeTrial}
                >
                  <Text style={styles.upgradeBtnText}>
                    {activateTrialMutation.isPending ? 'Activating Demo...' : `Get Free Demo 10 Days 🎁`}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Plan 2: Lite Plan */}
            <View style={[styles.planCard, { borderColor: '#38bdf8', borderWidth: 1.5 }, premiumShadow('#0284c7', 'sm')]}>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planTitle, { color: '#0284c7' }]}>⚡ Lite Plan (Recommended)</Text>
                  <Text style={styles.planPrice}>₹299 <Text style={styles.planPeriod}>/ 180 Days (6 Months)</Text></Text>
                </View>
                {plan === 'PRO' && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current Plan</Text></View>}
              </View>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✓ Register up to 5 Active Crops Concurrent</Text>
                <Text style={styles.featureItem}>✓ Unlimited Sale Invoices & Bill Sharing</Text>
                <Text style={styles.featureItem}>✓ Full AI Crop Disease Scanner Access</Text>
                <Text style={styles.featureItem}>✓ ISRO Satellite Field Map & Soil Moisture</Text>
                <Text style={styles.featureItem}>✓ Complete Financial Records & Ledger</Text>
              </View>
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: '#0284c7' }]}
                onPress={() => router.push('/(tabs)/farm')}
              >
                <Text style={styles.upgradeBtnText}>Upgrade to Lite Plan ⚡</Text>
              </TouchableOpacity>
            </View>

            {/* Plan 3: Pro VIP Plan */}
            <View style={[styles.planCard, { borderColor: '#10b981', borderWidth: 2 }, premiumShadow('#10b981', 'sm')]}>
              <View style={styles.vipTag}>
                <Text style={styles.vipTagText}>👑 MOST POPULAR VIP PLAN</Text>
              </View>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planTitle, { color: '#059669' }]}>👑 Pro VIP Plan</Text>
                  <Text style={styles.planPrice}>₹699 <Text style={styles.planPeriod}>/ 365 Days (1 Year)</Text></Text>
                </View>
                {plan === 'SMART' && <View style={styles.currentBadge}><Text style={styles.currentBadgeText}>Current Plan</Text></View>}
              </View>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✓ Unlimited Active Crops & Farm Plots</Text>
                <Text style={styles.featureItem}>✓ Priority AI Disease First-Aid Treatment</Text>
                <Text style={styles.featureItem}>✓ Full ISRO Satellite Health Heatmap Sync</Text>
                <Text style={styles.featureItem}>✓ Multi-Worker Labour & Expense Tracker</Text>
                <Text style={styles.featureItem}>✓ Priority VIP Support & Free Cloud Backup</Text>
              </View>
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: '#10b981' }]}
                onPress={() => router.push('/(tabs)/farm')}
              >
                <Text style={styles.upgradeBtnText}>Upgrade to Pro VIP Plan 👑</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* 2. DOCTOR CROP CARE MEMBERSHIPS PART */
          <View style={{ gap: 14 }}>
            {/* Pending Doctor Change Request Status Banner */}
            {pendingRequest ? (
              pendingRequest.status === 'PENDING' ? (
                <View style={[styles.statusCard, { backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1.5 }, premiumShadow('#000000', 'sm')]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="time" size={22} color="#d97706" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#92400e' }}>⏳ Doctor Change Under Admin Review</Text>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#b45309', marginTop: 2 }}>
                        Your request to switch doctor to Dr. {pendingRequest.advisor?.name} is submitted to Super Admin. Admin will inform your previous doctor before approving.
                      </Text>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={[styles.statusCard, { backgroundColor: '#f0f9ff', borderColor: '#bae6fd', borderWidth: 1.5 }, premiumShadow('#000000', 'sm')]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Ionicons name="checkmark-circle" size={24} color="#0284c7" />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#0369a1' }}>🎉 Doctor Approved Your Request!</Text>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#0284c7', marginTop: 2 }}>
                        Dr. {pendingRequest.advisor?.name} has approved your request! Enter the coupon code provided by your doctor, OR share your King ID with your doctor/admin to assign coupon directly.
                      </Text>
                    </View>
                  </View>
                  {user?.kingId ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, padding: 10, backgroundColor: '#ffffff', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bae6fd' }}>
                      <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>King ID: {user.kingId}</Text>
                      <CopyButton value={user.kingId} />
                    </View>
                  ) : null}
                </View>
              )
            ) : null}

            {/* Active Doctor Status Card */}
            <View style={[styles.doctorCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={styles.doctorAvatarCircle}>
                  <Ionicons name="medical" size={28} color="#0284c7" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.doctorCardSub}>ASSIGNED CROP DOCTOR</Text>
                  <Text style={styles.doctorCardName}>
                    {activeAdvisor ? activeAdvisor.name : 'No Doctor Assigned Yet'}
                  </Text>
                  <Text style={styles.doctorCardSpec}>
                    {activeAdvisor?.specialization || 'Specialized Farm & Crop Care Doctor'} · ⭐ {activeAdvisor?.ratingLabel || (activeAdvisor?.rating ? `${activeAdvisor.rating} ★ (${activeAdvisor.ratingCount || 1})` : 'No rating till now')}
                  </Text>
                </View>
              </View>

              {activeAdvisor ? (
                <View style={{ gap: 8, marginTop: 12 }}>
                  <View style={styles.doctorActionsRow}>
                    <TouchableOpacity
                      style={[styles.doctorActionBtn, { backgroundColor: '#e0f2fe' }]}
                      onPress={() => router.push('/(tabs)/chat')}
                    >
                      <Ionicons name="chatbubble-ellipses" size={16} color="#0284c7" />
                      <Text style={[styles.doctorActionText, { color: '#0284c7' }]}>Chat Doctor</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.doctorActionBtn, { backgroundColor: '#dcfce7' }]}
                      onPress={() => router.push('/(tabs)/market')}
                    >
                      <Ionicons name="call" size={16} color="#16a34a" />
                      <Text style={[styles.doctorActionText, { color: '#16a34a' }]}>Call Doctor</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.doctorActionsRow}>
                    <TouchableOpacity
                      style={[styles.doctorActionBtn, { backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }]}
                      onPress={() => setIsCropCareModalOpen(true)}
                    >
                      <Ionicons name="medical" size={16} color="#16a34a" />
                      <Text style={[styles.doctorActionText, { color: '#16a34a' }]}>Crops Care Plan 🩺</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.doctorActionBtn, { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a' }]}
                      onPress={() => setIsChoosingAdvisor(true)}
                    >
                      <Ionicons name="swap-horizontal" size={16} color="#d97706" />
                      <Text style={[styles.doctorActionText, { color: '#d97706' }]}>Change Doctor 🩺</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ gap: 8, marginTop: 12 }}>
                  <TouchableOpacity
                    style={[styles.upgradeBtn, { backgroundColor: '#16a34a' }]}
                    onPress={() => setIsCropCareModalOpen(true)}
                  >
                    <Text style={styles.upgradeBtnText}>Crops Care Plan & Coupon 🩺</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.upgradeBtn, { backgroundColor: '#0284c7' }]}
                    onPress={() => setIsChoosingAdvisor(true)}
                  >
                    <Text style={styles.upgradeBtnText}>+ Choose & Assign Crop Doctor 🩺</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Doctor Crop Care Advisory Packages */}
            <Text style={styles.sectionHeaderTitle}>SPECIALIST DOCTOR ADVISORY PACKAGES</Text>

            {/* Advisory Package 1: 5-Crop Advisory */}
            <View style={[styles.planCard, { borderColor: '#0284c7', borderWidth: 1.5 }, premiumShadow('#000000', 'sm')]}>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planTitle, { color: '#0284c7' }]}>🩺 5-Crop Care Advisory</Text>
                  <Text style={styles.planPrice}>₹499 <Text style={styles.planPeriod}>/ Full Crop Season</Text></Text>
                </View>
              </View>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✓ 1-on-1 Assigned Crop Care Doctor</Text>
                <Text style={styles.featureItem}>✓ Up to 5 Crop Plots Monitored</Text>
                <Text style={styles.featureItem}>✓ Stage-wise Spray & Fertilizer Schedules</Text>
                <Text style={styles.featureItem}>✓ Direct Phone & Chat Advisory</Text>
              </View>
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: '#0284c7' }]}
                onPress={() => setIsCropCareModalOpen(true)}
              >
                <Text style={styles.upgradeBtnText}>Subscribe 5-Crop Care Advisory 🩺</Text>
              </TouchableOpacity>
            </View>

            {/* Advisory Package 2: 10-Crop VIP Advisory */}
            <View style={[styles.planCard, { borderColor: '#7c3aed', borderWidth: 2 }, premiumShadow('#7c3aed', 'sm')]}>
              <View style={[styles.vipTag, { backgroundColor: '#7c3aed' }]}>
                <Text style={styles.vipTagText}>🌟 VIP FULL FARM ADVISORY</Text>
              </View>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planTitle, { color: '#7c3aed' }]}>🩺 10-Crop VIP Advisory</Text>
                  <Text style={styles.planPrice}>₹999 <Text style={styles.planPeriod}>/ Full Crop Season</Text></Text>
                </View>
              </View>
              <View style={styles.featureList}>
                <Text style={styles.featureItem}>✓ Up to 10 Crop Plots Monitored Daily</Text>
                <Text style={styles.featureItem}>✓ High-Resolution ISRO Satellite Health Sync</Text>
                <Text style={styles.featureItem}>✓ Direct Audio/Video Doctor Calls</Text>
                <Text style={styles.featureItem}>✓ Emergency Disease Diagnosis & Visit Support</Text>
              </View>
              <TouchableOpacity
                style={[styles.upgradeBtn, { backgroundColor: '#7c3aed' }]}
                onPress={() => setIsCropCareModalOpen(true)}
              >
                <Text style={styles.upgradeBtnText}>Subscribe 10-Crop VIP Advisory 🌟</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Choose Doctor Modal */}
      <Modal visible={isChoosingAdvisor} transparent animationType="slide" onRequestClose={() => setIsChoosingAdvisor(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>🩺 Available Crop Care Doctors</Text>
              <TouchableOpacity onPress={() => setIsChoosingAdvisor(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 8 }}>
              {availableAdvisors.length === 0 ? (
                <Text style={styles.emptyText}>No crop care doctors available right now.</Text>
              ) : (
                availableAdvisors.map((adv) => (
                  <View key={adv.id} style={styles.advisorItemRow}>
                    <View style={styles.doctorAvatarCircleSmall}>
                      <Ionicons name="person" size={18} color="#0284c7" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.advisorName}>{adv.name}</Text>
                      <Text style={styles.advisorSub}>
                        {adv.specialization || 'Specialized Farm Doctor'} · ⭐ {adv.ratingLabel || (adv.rating ? `${adv.rating} ★ (${adv.ratingCount || 1})` : 'No rating till now')} · 📍 {adv.district || 'Punjab'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.chooseBtn}
                      disabled={chooseAdvisor.isPending}
                      onPress={() => handleInitiateAdvisorRequest(adv)}
                    >
                      <Text style={styles.chooseBtnText}>Assign 🩺</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Doctor Change Disclaimer & Terms Modal */}
      <DoctorChangeDisclaimerModal
        visible={disclaimerModalVisible}
        onClose={() => setDisclaimerModalVisible(false)}
        onConfirm={() => targetAdvisorToRequest && executeAdvisorRequest(targetAdvisorToRequest.id)}
        currentDoctorName={activeAdvisor?.name}
        newDoctorName={targetAdvisorToRequest?.name}
        isLoading={chooseAdvisor.isPending}
      />

      {/* Crops Care Plan & Coupon Modal */}
      <CropCarePlanModal
        visible={isCropCareModalOpen}
        onClose={() => setIsCropCareModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 40, paddingBottom: 16, paddingHorizontal: 16 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#ffffff' },
  heroSubtitle: { fontSize: 11.5, fontFamily: FONT.medium, color: '#cbd5e1', marginTop: 1 },
  tabBar: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', padding: 3, borderRadius: RADIUS.pill },
  tabItem: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: RADIUS.pill },
  tabItemActive: { backgroundColor: theme.primary },
  tabText: { fontSize: 12, fontFamily: FONT.bold, color: '#94a3b8' },
  tabTextActive: { color: '#ffffff' },
  scrollContent: { padding: 14, paddingBottom: 32 },
  statusCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  statusBadgeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  statusLabel: { fontSize: 10, fontFamily: FONT.bold, color: '#64748b', letterSpacing: 0.5 },
  statusPlanName: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  activePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  activePillText: { fontSize: 10, fontFamily: FONT.extraBold },
  statusMetricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  metricLabel: { fontSize: 10, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  metricDivider: { width: 1, height: 24, backgroundColor: '#e2e8f0' },
  couponCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeaderTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  cardHeaderSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  couponInputRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  couponInput: { flex: 1, height: 42, backgroundColor: '#f1f5f9', borderRadius: RADIUS.md, paddingHorizontal: 12, fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  applyBtn: { backgroundColor: '#0f172a', paddingHorizontal: 16, height: 42, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  noticeText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#059669', marginTop: 8 },
  sectionHeaderTitle: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b', letterSpacing: 0.5, marginTop: 6 },
  planCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  vipTag: { position: 'absolute', top: -10, right: 16, backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 3, borderRadius: RADIUS.pill },
  vipTagText: { fontSize: 9.5, fontFamily: FONT.extraBold, color: '#ffffff', letterSpacing: 0.5 },
  planHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  planTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  planPrice: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 2 },
  planPeriod: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  currentBadge: { backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.sm },
  currentBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: '#475569' },
  featureList: { gap: 6, marginBottom: 14 },
  featureItem: { fontSize: 12.5, fontFamily: FONT.medium, color: '#334155' },
  upgradeBtn: { height: 44, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  upgradeBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },
  doctorCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  doctorAvatarCircle: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  doctorCardSub: { fontSize: 9.5, fontFamily: FONT.bold, color: '#0284c7', letterSpacing: 0.5 },
  doctorCardName: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  doctorCardSpec: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  doctorActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  doctorActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: RADIUS.md },
  doctorActionText: { fontSize: 12, fontFamily: FONT.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: 16, maxHeight: '80%' },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  emptyText: { textAlign: 'center', color: '#94a3b8', fontSize: 12.5, fontFamily: FONT.medium, marginVertical: 20 },
  advisorItemRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  doctorAvatarCircleSmall: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  advisorName: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  advisorSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  chooseBtn: { backgroundColor: '#0284c7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.md },
  chooseBtnText: { color: '#ffffff', fontSize: 11.5, fontFamily: FONT.bold },
});
