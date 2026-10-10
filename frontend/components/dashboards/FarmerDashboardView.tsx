import React, { useState, useRef } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Alert, Modal, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/src/store/auth-context';
import { RoleHeader } from './RoleHeader';
import { MarketRatesCard } from '@/src/components/MarketRatesCard';
import { FarmerPlanUpgradeModal } from '@/src/components/FarmerPlanUpgradeModal';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useFarmerPlan, useFarmerPlanPricing, PLAN_META, usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon, useActivateTrial } from '@/src/hooks/useFarmerPlan';
import { formatInr } from '@/src/utils/formatInr';
import { useReminderAlertOnLoad } from '@/src/hooks/useNotifications';
import { useGroupVoiceCall } from '@/src/hooks/useGroupVoiceCall';
import { GroupVoiceCallModal } from '@/src/components/chat/GroupVoiceCallModal';
import { PaymentVoucherModal, VoucherType } from '@/src/components/PaymentVoucherModal';
import { useLabourWorkers } from '@/src/hooks/useLabour';
import { useParties } from '@/src/hooks/useParties';
import { KisanCropIntelligenceCard } from '@/src/components/KisanCropIntelligenceCard';
import { CropAdvisoryPromoCard } from '@/src/components/CropAdvisoryPromoCard';
import { OpenMeteoWeatherCard } from '@/src/components/OpenMeteoWeatherCard';
import { AgriAiChatbot } from '@/src/components/AgriAiChatbot';
import { FarmLocationProfileModal } from '@/src/components/FarmLocationProfileModal';
import { FarmerPortalUpgradeSection, FarmerPortalUpgradeSectionRef } from '@/src/components/FarmerPortalUpgradeSection';
import { SupervisorManagementModal } from '@/src/components/SupervisorManagementModal';
import { WelcomeBonusModal } from '@/src/components/WelcomeBonusModal';
import { FarmerTrainingRatingBanner } from '@/src/components/FarmerTrainingRatingBanner';
import { useExecutiveTheme } from '@/src/store/theme-context';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface FarmerDashboardViewProps {
  onOpenAdminChat?: () => void;
}

const PLAN_ICON_MAP: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  FREE: { icon: 'leaf', color: '#15803d' },
  PRO: { icon: 'flash', color: '#0284c7' },
  SMART: { icon: 'star', color: '#1d4ed8' },
  SUPER: { icon: 'star', color: '#d97706' },
  SILVER: { icon: 'medical', color: '#475569' },
  GOLD: { icon: 'ribbon', color: '#d97706' },
  ROYAL: { icon: 'sparkles', color: '#7c3aed' },
};

export const FarmerDashboardView: React.FC<FarmerDashboardViewProps> = ({ onOpenAdminChat }) => {
  const upgradeSectionRef = useRef<FarmerPortalUpgradeSectionRef>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { executiveTheme, setExecutiveTheme, colors } = useExecutiveTheme();
  const theme = {
    ...RoleThemes.FARMER,
    primary: colors.primary,
    primaryDark: colors.headerBg,
    primaryLight: colors.primaryLight,
    bg: colors.bg,
    cardBg: colors.cardBg,
    cardBorder: colors.cardBorder,
    text: colors.text,
  };
  const { plan, meta, startDate, endDate, isExpired, inGrace, daysUntilExpiry } = useFarmerPlan();
  const { data: pricing } = useFarmerPlanPricing();
  const activateTrialMutation = useActivateTrial();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const currentPlanMeta = PLAN_ICON_MAP[plan] || { icon: 'crown', color: '#d97706' };

  const isTrialActive =
    plan === 'SUPER' &&
    Boolean(endDate && new Date(endDate).getTime() >= new Date('2026-09-30T00:00:00.000Z').getTime());

  const handleActivateTrial = async () => {
    tap();
    try {
      const res = await activateTrialMutation.mutateAsync();
      Alert.alert('Trial Activated', res.message || 'you app trial is activated till 30/9/2026');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to activate trial';
      Alert.alert('Error', msg);
    }
  };

  const voiceCallHook = useGroupVoiceCall();
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  useReminderAlertOnLoad(true);

  // Quick Payment Voucher Modal State
  const [showPaymentVoucherModal, setShowPaymentVoucherModal] = useState(false);
  const [showLocationProfileModal, setShowLocationProfileModal] = useState(false);
  const [showSupervisorModal, setShowSupervisorModal] = useState(false);
  const [showAiChatModal, setShowAiChatModal] = useState(false);
  const [voucherInitialType, setVoucherInitialType] = useState<VoucherType>('RECEIPT_IN');
  const { data: labourWorkers = [] } = useLabourWorkers();
  const { data: parties = [] } = useParties();

  // Formatted apply/expiry dates + full amount for paid plans
  const formattedApplyDate = startDate
    ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const formattedExpiry = endDate
    ? (() => {
      const d = new Date(endDate);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = String(d.getFullYear()).slice(-2);
      return `${day}/${month}/${year}`;
    })()
    : null;
  const pricingList = Array.isArray(pricing) ? pricing : (pricing as any)?.items || (pricing as any)?.data || [];
  const planPrice = pricingList.find((p: any) => p.plan === plan)?.price;

  const planActionLabel = 'VIP Pass';

  const [modalInitialMode, setModalInitialMode] = useState<'GET_COUPON' | 'REDEEM_CODE'>('GET_COUPON');

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="FARMER"
        profileName={user?.name || 'Farmer'}
        subtitle={
          user?.village
            ? `📍 ${user.village}${user?.district ? `, ${user.district}` : ''}`
            : user?.district
            ? `📍 ${user.district}`
            : (user as any)?.farmName
            ? `🏡 ${(user as any).farmName}`
            : user?.kingId
            ? `👑 ID: ${user.kingId}`
            : undefined
        }
        avatarUrl={user?.photoUrl || undefined}
        planBadge={
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            {isTrialActive ? (
              <View style={styles.topTrialPill}>
                <Ionicons name="sparkles" size={10} color="#ffffff" />
                <Text style={styles.topTrialPillText}>TRIAL ACTIVATED</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={styles.combinedMembershipCard}
              activeOpacity={0.88}
              onPress={() => {
                tap();
                setModalInitialMode('GET_COUPON');
                setIsPlanModalOpen(true);
              }}
            >
              <View style={styles.combinedCardTopRow}>
                <Ionicons name={currentPlanMeta.icon} size={13} color="#f59e0b" />
                <Text style={styles.combinedCardPlanText} numberOfLines={1}>
                  {meta.label}
                </Text>
              </View>

              {plan !== 'FREE' && !isExpired && (daysUntilExpiry !== null || formattedExpiry) ? (
                <View style={styles.combinedCardValidRow}>
                  <Ionicons name="time-outline" size={10} color="#fef08a" />
                  <Text style={styles.combinedCardValidText} numberOfLines={1} adjustsFontSizeToFit>
                    {daysUntilExpiry !== null ? `${daysUntilExpiry}d left` : ''}
                    {formattedExpiry ? ` (Till: ${formattedExpiry})` : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.combinedCardValidRow}>
                  <Text style={styles.combinedCardValidText}>Farmer Pass 🎟️</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        }

      />

      <FarmerPlanUpgradeModal
        visible={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        tiers={['PRO', 'SMART', 'SUPER']}
        initialMode={modalInitialMode}
      />

      <View style={styles.content}>
        {/* Active Group Voice Call Alert Banner for Farmer */}
        {voiceCallHook.activeCall ? (
          <TouchableOpacity
            style={[styles.activeCallBanner, premiumShadow('#16a34a', 'md')]}
            activeOpacity={0.88}
            onPress={() => setShowVoiceCallModal(true)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={styles.activeCallLiveBadge}>
                <Ionicons name="mic" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.activeCallTitle}>🎙️ Live Advisor Group Call</Text>
                  <View style={styles.livePulseDot} />
                  <Text style={styles.livePulseText}>LIVE</Text>
                </View>
                <Text style={styles.activeCallSub} numberOfLines={1}>
                  Hosted by {voiceCallHook.activeCall.host?.name || 'Advisor'} · Tap to join
                </Text>
              </View>
            </View>

            <View style={styles.joinCallBtn}>
              <Ionicons name="call" size={13} color="#ffffff" />
              <Text style={styles.joinCallBtnText}>Join Call</Text>
            </View>
          </TouchableOpacity>
        ) : null}




        {/* AI Chat Popup Modal */}
        <Modal
          visible={showAiChatModal}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowAiChatModal(false)}
        >
          <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }}>
            <View style={styles.aiModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={styles.compactAiAvatar}>
                  <Ionicons name="sparkles" size={18} color="#ffffff" />
                </View>
                <View>
                  <Text style={{ fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' }}>
                    ✨ Farmsking Kisan AI Doctor
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#16a34a' }}>
                    Google Search Grounded · Agriculture & FarmsKing
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.aiModalCloseBtn}
                onPress={() => setShowAiChatModal(false)}
              >
                <Ionicons name="close" size={22} color="#0f172a" />
              </TouchableOpacity>
            </View>
            <AgriAiChatbot isModal={true} />
          </SafeAreaView>
        </Modal>

        {/* Live Open-Meteo Weather Card */}
        <OpenMeteoWeatherCard />

        {/* Quick Accounts & Payments Action Grid */}
        <View style={[styles.quickAccountsCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.quickAccountsTitle, { color: colors.text }]}>📊 Quick Accounts & Payments</Text>
          <View style={styles.quickAccountsGrid}>
            {/* Button 1: + Add Sale */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { backgroundColor: '#16a34a' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'NEW_SALE', t: Date.now() } });
              }}
            >
              <Ionicons name="add-circle" size={15} color="#ffffff" />
              <Text style={styles.quickAccountsBtnText}>+ Add Sale</Text>
            </TouchableOpacity>

            {/* Button 2: + Add Expense */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { backgroundColor: '#dc2626' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'NEW_EXPENSE', t: Date.now() } });
              }}
            >
              <Ionicons name="remove-circle" size={15} color="#ffffff" />
              <Text style={styles.quickAccountsBtnText}>+ Add Expense</Text>
            </TouchableOpacity>

            {/* Button 3: 💰 Payment In (Receipt) */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { backgroundColor: '#0284c7' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                setVoucherInitialType('RECEIPT_IN');
                setShowPaymentVoucherModal(true);
              }}
            >
              <Ionicons name="arrow-down-circle" size={15} color="#ffffff" />
              <Text style={styles.quickAccountsBtnText}>💰 Payment In</Text>
            </TouchableOpacity>

            {/* Button 4: 💸 Payment Out (Payment) */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { backgroundColor: '#ea580c' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                setVoucherInitialType('PAYMENT_OUT');
                setShowPaymentVoucherModal(true);
              }}
            >
              <Ionicons name="arrow-up-circle" size={15} color="#ffffff" />
              <Text style={styles.quickAccountsBtnText}>💸 Payment Out</Text>
            </TouchableOpacity>

          </View>
        </View>

        {/* 🎓 Technical Trainer Rating Banner */}
        <FarmerTrainingRatingBanner />

        {/* Your Crop Prices LIVE */}
        <MarketRatesCard />

        {/* Farm Action Grid — All buttons in ONE unified card */}
        <View style={[styles.toolsContainerCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, premiumShadow(colors.shadowColor, 'sm')]}>
          <View style={styles.actionGridInner}>
            <TouchableOpacity
              style={[styles.actionCardUnified, { backgroundColor: 'rgba(148, 163, 184, 0.08)' }]}
              activeOpacity={0.8}
              onPress={() => {
                tap();
                router.push('/crop-intelligence' as any as any);
              }}
            >
              <View style={[styles.actionIconBgUnified, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="sparkles" size={16} color="#15803d" />
              </View>
              <View style={styles.actionCardTextGroup}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]} numberOfLines={1}>Kisan AI</Text>
                <Text style={[styles.actionCardSub, { color: colors.textMuted }]} numberOfLines={1}>Ask Expert</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCardUnified, { backgroundColor: 'rgba(148, 163, 184, 0.08)' }]}
              activeOpacity={0.8}
              onPress={() => {
                tap();
                setShowLocationProfileModal(true);
              }}
            >
              <View style={[styles.actionIconBgUnified, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="location" size={16} color="#b45309" />
              </View>
              <View style={styles.actionCardTextGroup}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]} numberOfLines={1}>Farm GPS</Text>
                <Text style={[styles.actionCardSub, { color: colors.textMuted }]} numberOfLines={1}>1-Tap Lock</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCardUnified, { backgroundColor: 'rgba(148, 163, 184, 0.08)' }]}
              activeOpacity={0.8}
              onPress={() => {
                tap();
                onOpenAdminChat?.();
              }}
            >
              <View style={[styles.actionIconBgUnified, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="chatbubbles" size={16} color="#15803d" />
              </View>
              <View style={styles.actionCardTextGroup}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]} numberOfLines={1}>Admin Support</Text>
                <Text style={[styles.actionCardSub, { color: colors.textMuted }]} numberOfLines={1}>Chat Live</Text>
              </View>
            </TouchableOpacity>



            <TouchableOpacity
              style={[styles.actionCardUnified, { backgroundColor: 'rgba(148, 163, 184, 0.08)', opacity: 0.7 }]}
              activeOpacity={1}
              disabled={true}
              onPress={() => {
                tap();
                upgradeSectionRef.current?.openScanner();
              }}
            >
              <View style={[styles.actionIconBgUnified, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="qr-code" size={16} color="#0284c7" />
              </View>
              <View style={styles.actionCardTextGroup}>
                <Text style={[styles.actionCardTitle, { color: colors.text }]} numberOfLines={1}>Verify Product</Text>
                <Text style={[styles.actionCardSub, { color: colors.textMuted }]} numberOfLines={1}>Scan Barcode</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🌟 Executive Smart Farming Portal 7-Feature Upgrade Section */}
        <FarmerPortalUpgradeSection ref={upgradeSectionRef} />


      </View>

      <GroupVoiceCallModal
        visible={showVoiceCallModal}
        onClose={() => setShowVoiceCallModal(false)}
        voiceCallHook={voiceCallHook}
        currentUserId={user?.id}
        isHostOrAdmin={false}
      />

      {/* Payment Voucher Modal Component for Quick Payments In/Out */}
      <PaymentVoucherModal
        visible={showPaymentVoucherModal}
        initialType={voucherInitialType}
        parties={parties}
        labourWorkers={labourWorkers}
        onClose={() => setShowPaymentVoucherModal(false)}
      />

      {/* Farm Location & Personal Profile Dialogue Modal */}
      <FarmLocationProfileModal
        visible={showLocationProfileModal}
        onClose={() => setShowLocationProfileModal(false)}
      />

      {/* 🎁 Welcome Bonus & Referral Modal */}
      <WelcomeBonusModal
        visible={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingTop: 6, gap: SPACING.sm, paddingBottom: 24 },
  welcomeBannerCard: {
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginVertical: 2,
    ...premiumShadow('#16a34a', 'sm'),
  },
  welcomeBannerGradient: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  welcomeBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  welcomeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  welcomeBannerTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  welcomeBannerSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 1,
  },
  welcomeBannerBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  welcomeBannerBtnText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  quickAccountsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24, // iOS Squircle
    padding: 16,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
      default: premiumShadow('#0f172a', 'sm'),
    }),
  },
  quickAccountsTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  quickAccountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickAccountsBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: 16,
  },
  quickAccountsBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 20, // iOS Squircle
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'column', // iOS style cards usually stack icon and text
    alignItems: 'flex-start',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: { elevation: 2 },
    }),
  },
  toolsContainerCard: {
    borderRadius: 24, // iOS Squircle style
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginTop: 4,
  },
  actionGridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCardUnified: {
    width: '48.5%',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBgUnified: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  actionCardSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  // Plan badge styles — frosted-glass pills so they read cleanly against the gradient header, in any theme.
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    gap: 5,
  },
  planDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  planBadgeText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  planDaysLeftText: {
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 1,
  },
  planActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
    gap: 3,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
    ...premiumShadow('#000000', 'sm'),
  },
  planActionBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  activeCallBanner: {
    backgroundColor: '#15803d',
    borderRadius: RADIUS.lg,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  activeCallLiveBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCallTitle: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
  },
  livePulseText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    backgroundColor: '#dc2626',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  activeCallSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 1,
  },
  joinCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#166534',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  joinCallBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  intelligenceLauncherCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 16,
  },
  launcherBannerHeader: {
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  launcherHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  launcherIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  launcherTitle: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  launcherSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  livePulsePill: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  livePulsePillText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  openBtnPill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  openBtnPillText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  launcherBody: {
    padding: 12,
    gap: 8,
    backgroundColor: '#ffffff',
  },
  launcherDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#475569',
    lineHeight: 16,
  },
  launcherFeaturesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  featureChipGreen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  featureChipGreenText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  featureChipAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fffbe6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  featureChipAmberText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#92400e',
  },
  featureChipBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  featureChipBlueText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#1e40af',
  },
  trialBannerCard: {
    backgroundColor: '#fffbeb',
    borderRadius: RADIUS.lg,
    padding: 12,
    gap: 10,
  },
  trialBannerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  trialIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fcd34d',
    marginTop: 2,
  },
  trialBannerTitle: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#92400e',
  },
  trialBadgePill: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  trialBadgePillText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#b45309',
  },
  highlightPlanBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    ...premiumShadow('#000000', 'sm'),
  },
  highlightPlanBadgeText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#92400e',
  },
  highlightPlanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    ...premiumShadow('#000000', 'sm'),
  },
  compactTrialBannerCard: {
    backgroundColor: '#fffbeb',
    borderRadius: RADIUS.md,
    padding: 10,
  },
  compactTrialIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  compactTrialBannerTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    color: '#92400e',
  },
  compactTrialBannerSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#b45309',
    marginTop: 1,
  },
  activateTrialBtnRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#d97706',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.md,
  },
  activateTrialBtnRightText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  activateTrialBtnDisabled: {
    backgroundColor: '#94a3b8',
    opacity: 0.8,
  },
  topTrialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#b45309',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#f59e0b',
    marginBottom: 1,
  },
  topTrialPillText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  combinedMembershipCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 9,
    paddingVertical: 5,
    alignItems: 'flex-end',
    gap: 2,
    ...premiumShadow('#000000', 'sm'),
  },
  combinedCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  combinedCardPlanText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  combinedCardTrialPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#15803d',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  combinedCardTrialText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  combinedCardValidRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  combinedCardValidText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#fef08a',
  },
  verticalThemeCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginVertical: 4,
    gap: 8,
  },
  verticalThemeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verticalThemeTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  verticalThemePillCol: {
    flexDirection: 'column',
    gap: 6,
  },
  verticalThemePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  verticalThemePillText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  aiDoctorBannerCard: {
    backgroundColor: '#14532d',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginVertical: 2,
    ...premiumShadow('#16a34a', 'sm'),
  },
  aiBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  aiBotIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#86efac',
  },
  aiBannerTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  aiBannerSub: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#dcfce7',
    marginTop: 2,
    lineHeight: 15,
  },
  freePill: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  freePillText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#854d0e',
  },
  compactAiCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
  },
  compactAiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactAiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAiTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  compactFreeBadge: {
    backgroundColor: '#fef08a',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  compactFreeBadgeText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#854d0e',
  },
  compactAiSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  compactAskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  compactAskBtnText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  aiModalCloseBtn: {
    padding: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
  },
});




