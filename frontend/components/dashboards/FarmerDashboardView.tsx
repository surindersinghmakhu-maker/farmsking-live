import React, { useState, useRef } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform, Alert, Modal, SafeAreaView, useWindowDimensions } from 'react-native';
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
import { FarmLocationProfileModal } from '@/src/components/FarmLocationProfileModal';
import { FarmerPortalUpgradeSection, FarmerPortalUpgradeSectionRef } from '@/src/components/FarmerPortalUpgradeSection';
import { WelcomeBonusModal } from '@/src/components/WelcomeBonusModal';
import { FarmerTrainingRatingBanner } from '@/src/components/FarmerTrainingRatingBanner';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useLanguage } from '@/src/store/language-context';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface FarmerDashboardViewProps {
  onOpenAdminChat?: () => void;
}

const SMART_AGRONOMY_TOOLS = [
  {
    id: 'copilot',
    titleKey: 'aiCopilot',
    title: 'AI Copilot',
    icon: 'sparkles' as const,
    accent: '#059669',
    iconGradient: ['#10b981', '#047857'] as [string, string],
    lightBg: ['#ffffff', '#ecfdf5'] as [string, string],
    darkBg: ['rgba(6, 78, 59, 0.45)', 'rgba(15, 23, 42, 0.9)'] as [string, string],
    borderLight: '#a7f3d0',
    borderDark: 'rgba(52, 211, 153, 0.5)',
    shadow: '#10b981',
  },
  {
    id: 'doctor',
    titleKey: 'cropDoctor',
    title: 'Crop Doctor',
    icon: 'scan' as const,
    accent: '#0284c7',
    iconGradient: ['#0ea5e9', '#0369a1'] as [string, string],
    lightBg: ['#ffffff', '#f0f9ff'] as [string, string],
    darkBg: ['rgba(7, 89, 133, 0.45)', 'rgba(15, 23, 42, 0.9)'] as [string, string],
    borderLight: '#bae6fd',
    borderDark: 'rgba(56, 189, 248, 0.5)',
    shadow: '#0284c7',
  },
  {
    id: 'gps',
    titleKey: 'farmGps',
    title: 'Farm GPS',
    icon: 'location' as const,
    accent: '#d97706',
    iconGradient: ['#f59e0b', '#b45309'] as [string, string],
    lightBg: ['#ffffff', '#fffbeb'] as [string, string],
    darkBg: ['rgba(120, 53, 15, 0.45)', 'rgba(15, 23, 42, 0.9)'] as [string, string],
    borderLight: '#fde68a',
    borderDark: 'rgba(251, 191, 36, 0.5)',
    shadow: '#d97706',
  },
  {
    id: 'crops',
    titleKey: 'myCrops',
    title: 'My Crops',
    icon: 'leaf' as const,
    accent: '#15803d',
    iconGradient: ['#22c55e', '#15803d'] as [string, string],
    lightBg: ['#ffffff', '#f0fdf4'] as [string, string],
    darkBg: ['rgba(20, 83, 45, 0.45)', 'rgba(15, 23, 42, 0.9)'] as [string, string],
    borderLight: '#bbf7d0',
    borderDark: 'rgba(74, 222, 128, 0.5)',
    shadow: '#15803d',
  },
  {
    id: 'chat',
    titleKey: 'supportChat',
    title: 'Support Chat',
    icon: 'chatbubbles' as const,
    accent: '#7c3aed',
    iconGradient: ['#8b5cf6', '#6d28d9'] as [string, string],
    lightBg: ['#ffffff', '#f5f3ff'] as [string, string],
    darkBg: ['rgba(76, 29, 149, 0.45)', 'rgba(15, 23, 42, 0.9)'] as [string, string],
    borderLight: '#ddd6fe',
    borderDark: 'rgba(168, 85, 247, 0.5)',
    shadow: '#7c3aed',
  },
  {
    id: 'verify',
    titleKey: 'govtAdvisory',
    title: 'Govt Advisory',
    icon: 'shield-checkmark' as const,
    accent: '#e11d48',
    iconGradient: ['#f43f5e', '#be123c'] as [string, string],
    lightBg: ['#ffffff', '#fff1f2'] as [string, string],
    darkBg: ['rgba(136, 19, 55, 0.45)', 'rgba(15, 23, 42, 0.9)'] as [string, string],
    borderLight: '#fecdd3',
    borderDark: 'rgba(251, 113, 133, 0.5)',
    shadow: '#e11d48',
  },
];

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
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const upgradeSectionRef = useRef<FarmerPortalUpgradeSectionRef>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useLanguage();
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
    <ScrollView
      ref={scrollViewRef}
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingBottom: isDesktop ? 32 : 115 },
      ]}
      showsVerticalScrollIndicator={Platform.OS === 'web' ? true : false}
    >
      {/* Header */}
      <RoleHeader
        currentRole="FARMER"
        profileName={user?.name || 'Farmer'}
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
              style={[
                styles.combinedMembershipCard,
                !colors.isDark && {
                  backgroundColor: '#ffffff',
                  borderWidth: 1.5,
                  borderColor: '#cbd5e1',
                  shadowColor: 'rgba(0, 0, 0, 0.08)',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              activeOpacity={0.88}
              onPress={() => {
                tap();
                setModalInitialMode('GET_COUPON');
                setIsPlanModalOpen(true);
              }}
            >
              <View style={styles.combinedCardTopRow}>
                <Ionicons name={currentPlanMeta.icon} size={14} color="#d97706" />
                <Text
                  style={[
                    styles.combinedCardPlanText,
                    { color: colors.isDark ? '#ffffff' : '#0f172a' },
                  ]}
                  numberOfLines={1}
                >
                  {meta.label}
                </Text>
              </View>

              {plan !== 'FREE' && !isExpired && (daysUntilExpiry !== null || formattedExpiry) ? (
                <View style={styles.combinedCardValidRow}>
                  <Ionicons name="time-outline" size={11} color={colors.isDark ? '#fef08a' : '#d97706'} />
                  <Text
                    style={[
                      styles.combinedCardValidText,
                      { color: colors.isDark ? '#fef08a' : '#b45309' },
                    ]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                  >
                    {daysUntilExpiry !== null ? `${daysUntilExpiry}d left` : ''}
                    {formattedExpiry ? ` (Till: ${formattedExpiry})` : ''}
                  </Text>
                </View>
              ) : (
                <View style={styles.combinedCardValidRow}>
                  <Text
                    style={[
                      styles.combinedCardValidText,
                      { color: colors.isDark ? '#fef08a' : '#15803d', fontFamily: FONT.extraBold },
                    ]}
                  >
                    Farmer Pass 🎟️
                  </Text>
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




        



        {/* Live Open-Meteo Weather Card */}
        <OpenMeteoWeatherCard />

        {/* Quick Accounts & Payments Action Grid */}
        <View style={[styles.quickAccountsCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.quickAccountsTitle, { color: colors.text }]}>📊 {t('quickActions', 'Quick Accounts & Payments')}</Text>
          <View style={styles.quickAccountsGrid}>
            {/* Button 1: + Add Sale */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { width: isDesktop ? '23.8%' : '48.5%', backgroundColor: '#16a34a' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'NEW_SALE', t: Date.now() } });
              }}
            >
              <Ionicons name="add-circle" size={15} color="#ffffff" />
              <Text style={styles.quickAccountsBtnText} numberOfLines={1}>{t('addSaleBtn', '+ Add Sale')}</Text>
            </TouchableOpacity>

            {/* Button 2: + Add Expense */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { width: isDesktop ? '23.8%' : '48.5%', backgroundColor: '#dc2626' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                router.push({ pathname: '/(user)/(tabs)/records' as any, params: { action: 'NEW_EXPENSE', t: Date.now() } });
              }}
            >
              <Ionicons name="remove-circle" size={15} color="#ffffff" />
              <Text style={styles.quickAccountsBtnText} numberOfLines={1}>{t('addExpenseBtn', '+ Add Expense')}</Text>
            </TouchableOpacity>

            {/* Button 3: Payment In */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { width: isDesktop ? '23.8%' : '48.5%', backgroundColor: '#0284c7' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                setVoucherInitialType('RECEIPT_IN');
                setShowPaymentVoucherModal(true);
              }}
            >
              <Ionicons name="arrow-down-circle" size={15} color="#ffffff" />
              <Text style={styles.quickAccountsBtnText} numberOfLines={1}>{t('receivable', 'Payment In')}</Text>
            </TouchableOpacity>

            {/* Button 4: Payment Out */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { width: isDesktop ? '23.8%' : '48.5%', backgroundColor: '#ea580c' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                setVoucherInitialType('PAYMENT_OUT');
                setShowPaymentVoucherModal(true);
              }}
            >
              <Ionicons name="arrow-up-circle" size={15} color="#ffffff" />
              <Text style={styles.quickAccountsBtnText} numberOfLines={1}>{t('payable', 'Payment Out')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 🎓 Technical Trainer Rating Banner */}
        <FarmerTrainingRatingBanner />

        {/* Your Crop Prices LIVE */}
        <MarketRatesCard />

        {/* 🚜 Essential Farm Tools & Agronomy Hub Section (Compact) */}
        <View style={[styles.toolsSectionWrapper, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }, premiumShadow(colors.shadowColor, 'sm')]}>
          {/* Compact Section Header */}
          <View style={styles.toolsSectionHeader}>
            <View style={styles.toolsSectionHeaderLeft}>
              <Ionicons name="apps" size={15} color="#16a34a" />
              <Text style={[styles.toolsSectionTitle, { color: colors.text }]}>{t('cropIntelligence', 'Smart Agronomy Hub & Tools')}</Text>
            </View>
            <View style={[styles.toolsSectionCountBadge, { backgroundColor: colors.isDark ? 'rgba(22, 163, 74, 0.2)' : '#dcfce7' }]}>
              <Text style={styles.toolsSectionCountText}>6 Quick Tools</Text>
            </View>
          </View>

          {/* Action Grid (4D Depth Cards with Natural Vibrant Colors) */}
          <View style={styles.actionGridInner}>
            {SMART_AGRONOMY_TOOLS.map((tool) => {
              const bgColors = colors.isDark ? tool.darkBg : tool.lightBg;
              const borderColor = colors.isDark ? tool.borderDark : tool.borderLight;
              return (
                <TouchableOpacity
                  key={tool.id}
                  style={[
                    styles.actionCard4DWrapper,
                    { width: isDesktop ? '31.8%' : '48.4%' },
                  ]}
                  activeOpacity={0.84}
                  onPress={() => {
                    tap();
                    if (tool.id === 'copilot') router.push('/crop-intelligence' as any);
                    else if (tool.id === 'doctor') router.push('/crop-disease-scanner' as any);
                    else if (tool.id === 'gps') setShowLocationProfileModal(true);
                    else if (tool.id === 'crops') router.push('/(user)/(tabs)/farm' as any);
                    else if (tool.id === 'chat') onOpenAdminChat?.();
                    else if (tool.id === 'verify') upgradeSectionRef.current?.openScanner();
                  }}
                >
                  <LinearGradient
                    colors={bgColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.actionCard4DInner,
                      {
                        borderColor,
                        shadowColor: tool.shadow,
                      },
                      Platform.OS === 'web' ? ({
                        boxShadow: colors.isDark
                          ? `0 8px 20px -4px ${tool.shadow}45, inset 0 1px 1px rgba(255, 255, 255, 0.25)`
                          : `0 4px 14px -2px ${tool.shadow}35, inset 0 1px 1px rgba(255, 255, 255, 0.9)`,
                        transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                      } as any) : {},
                    ]}
                  >
                    {/* 4D Embossed Natural Squircle Icon */}
                    <LinearGradient
                      colors={tool.iconGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[
                        styles.actionIcon4D,
                        Platform.OS === 'web' ? ({
                          boxShadow: `0 3px 10px -1px ${tool.shadow}80, inset 0 1px 1px rgba(255, 255, 255, 0.7)`,
                        } as any) : {},
                      ]}
                    >
                      <Ionicons name={tool.icon} size={13} color="#ffffff" />
                    </LinearGradient>

                    {/* Title */}
                    <View style={styles.actionCardBodyCompact}>
                      <Text
                        style={[
                          styles.actionCardTitle4D,
                          { color: colors.isDark ? '#ffffff' : '#0f172a' },
                        ]}
                        numberOfLines={1}
                      >
                        {t((tool as any).titleKey || tool.id, tool.title)}
                      </Text>
                    </View>

                    {/* Right Forward Chevron Pill */}
                    <View
                      style={[
                        styles.chevronPill4D,
                        {
                          backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.07)',
                          borderColor: colors.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.16)',
                        },
                      ]}
                    >
                      <Ionicons name="chevron-forward" size={9} color={tool.accent} />
                    </View>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
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
  scrollContent: { flexGrow: 1 },
  content: { padding: SPACING.lg, paddingTop: 6, gap: SPACING.sm, paddingBottom: 20 },
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
    backgroundColor: '#04160c',
    borderRadius: 24, // iOS Squircle
    padding: 16,
    gap: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.22)',
    ...premiumShadow('#00ff87', 'md'),
  },
  quickAccountsTitle: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
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
    backgroundColor: '#04160c',
    borderRadius: 20, // iOS Squircle
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'column', // iOS style cards usually stack icon and text
    alignItems: 'flex-start',
    gap: 12,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.18)',
    ...premiumShadow('#00ff87', 'sm'),
  },
  toolsSectionWrapper: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    marginVertical: 2,
  },
  toolsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 2,
  },
  toolsSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toolsSectionTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.2,
  },
  toolsSectionCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  toolsSectionCountText: {
    color: '#15803d',
    fontSize: 9,
    fontFamily: FONT.extraBold,
  },
  actionGridInner: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard4DWrapper: {
    borderRadius: 14,
    marginVertical: 1,
  },
  actionCard4DInner: {
    borderRadius: 14,
    paddingHorizontal: 8,
    paddingVertical: 8,
    minHeight: 46,
    borderWidth: 1.2,
    borderTopWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon4D: {
    width: 24,
    height: 24,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.45)',
  },
  actionCardBodyCompact: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  actionCardTitle4D: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.2,
  },
  chevronPill4D: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
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
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
    marginTop: 10,
    marginBottom: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.20)',
    ...premiumShadow('#00ff87', 'sm'),
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
    backgroundColor: '#04160c',
  },
  launcherDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
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
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.28)',
  },
  featureChipGreenText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  featureChipAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.28)',
  },
  featureChipAmberText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#fbbf24',
  },
  featureChipBlue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
  },
  featureChipBlueText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#38bdf8',
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
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: 12,
    marginVertical: 4,
    gap: 8,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.20)',
    ...premiumShadow('#00ff87', 'sm'),
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
  aiDoctorIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  aiDoctorBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  aiDoctorPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  aiDoctorBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#10b981',
    letterSpacing: 0.5,
  },
  aiDoctorBannerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    marginBottom: 2,
  },
  aiDoctorBannerSub: {
    fontSize: 12,
    fontFamily: FONT.regular,
    lineHeight: 17,
  },
  aiDoctorBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 260,
  },
  aiDoctorScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    backgroundColor: '#10b981',
    ...premiumShadow('#10b981', 'md'),
  },
  aiDoctorScanBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  aiDoctorBannerCard: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    flexWrap: 'wrap',
    ...premiumShadow('#000000', 'sm'),
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
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: 10,
    marginVertical: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    ...premiumShadow('#00ff87', 'sm'),
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
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAiTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
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
    color: '#94a3b8',
    marginTop: 1,
  },
  compactAskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00ff87',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  compactAskBtnText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#020d06',
  },
  aiModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#04160c',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.20)',
  },
  aiModalCloseBtn: {
    padding: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 18,
  },
});




