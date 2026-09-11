import React, { useState } from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Platform } from 'react-native';
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
import { useFarmerPlan, useFarmerPlanPricing, PLAN_META, usePreviewFarmerPlanCoupon, useRedeemFarmerPlanCoupon } from '@/src/hooks/useFarmerPlan';
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


const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface FarmerDashboardViewProps {
  onOpenAdminChat?: () => void;
}

export const FarmerDashboardView: React.FC<FarmerDashboardViewProps> = ({ onOpenAdminChat }) => {
  const theme = RoleThemes.FARMER;
  const router = useRouter();
  const { user } = useAuth();
  const { plan, meta, startDate, endDate, isExpired, inGrace, daysUntilExpiry } = useFarmerPlan();
  const { data: pricing } = useFarmerPlanPricing();
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const voiceCallHook = useGroupVoiceCall();
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  useReminderAlertOnLoad(true);

  // Quick Payment Voucher Modal State
  const [showPaymentVoucherModal, setShowPaymentVoucherModal] = useState(false);
  const [voucherInitialType, setVoucherInitialType] = useState<VoucherType>('RECEIPT_IN');
  const { data: labourWorkers = [] } = useLabourWorkers();
  const { data: parties = [] } = useParties();

  // Formatted apply/expiry dates + full amount for paid plans
  const formattedApplyDate = startDate
    ? new Date(startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const formattedExpiry = endDate
    ? new Date(endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;
  const planPrice = pricing?.find((p) => p.plan === plan)?.price;

  const planActionLabel = 'Renew/Upgrade';

  const [modalInitialMode, setModalInitialMode] = useState<'GET_COUPON' | 'REDEEM_CODE'>('GET_COUPON');

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="FARMER"
        profileName={user?.name || 'Farmer'}
        subtitle={user?.village ? `🌾 ${user.village}` : 'Farmer Profile'}
        avatarUrl={user?.photoUrl || undefined}
        planBadge={
          <View style={{ alignItems: 'flex-end', gap: 3 }}>
            <View style={styles.planBadge}>
              <View style={[styles.planDot, { backgroundColor: meta.color }]} />
              <Text style={styles.planBadgeText} numberOfLines={1}>
                Plan: {meta.label}
              </Text>
            </View>

            {plan !== 'FREE' && !isExpired && daysUntilExpiry !== null ? (
              <Text style={[styles.planDaysLeftText, { fontSize: 10, textAlign: 'right' }]}>
                ⏳ {daysUntilExpiry}d left{formattedExpiry ? ` (Till: ${formattedExpiry})` : ''}
              </Text>
            ) : null}

            <TouchableOpacity
              style={styles.planActionBtn}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                setModalInitialMode('REDEEM_CODE');
                setIsPlanModalOpen(true);
              }}
            >
              <Text style={styles.planActionBtnText} numberOfLines={1}>{planActionLabel}</Text>
              <Ionicons name="chevron-forward" size={10} color="#166534" />
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
                  Hosted by {voiceCallHook.activeCall.host?.name || 'Advisor'} (4.9 ★ Verified Advisor) · Tap to join
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
        <View style={styles.quickAccountsCard}>
          <Text style={styles.quickAccountsTitle}>📊 Quick Accounts & Payments</Text>
          <View style={styles.quickAccountsGrid}>
            {/* Button 1: + Add Sale */}
            <TouchableOpacity
              style={[styles.quickAccountsBtn, { backgroundColor: '#16a34a' }]}
              activeOpacity={0.85}
              onPress={() => {
                tap();
                router.push({ pathname: '/(tabs)/records', params: { action: 'NEW_SALE', t: Date.now() } });
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
                router.push({ pathname: '/(tabs)/records', params: { action: 'NEW_EXPENSE', t: Date.now() } });
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

        {/* Your Crop Prices LIVE */}
        <MarketRatesCard />

        {/* Farm Action Grid — Executive Compact Tool Layout */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, premiumShadow('#0f172a', 'sm')]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              router.push('/(tabs)/satellite-map' as any);
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="location" size={19} color="#b45309" />
            </View>
            <View style={styles.actionCardTextGroup}>
              <Text style={styles.actionCardTitle} numberOfLines={1}>Farm GPS Location</Text>
              <Text style={styles.actionCardSub} numberOfLines={1}>1-Tap GPS Lock</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, premiumShadow('#0f172a', 'sm')]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              router.push('/(tabs)/satellite-map' as any);
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#e0f2fe' }]}>
              <Ionicons name="planet" size={19} color="#0284c7" />
            </View>
            <View style={styles.actionCardTextGroup}>
              <Text style={styles.actionCardTitle} numberOfLines={1}>Satellite Scanner</Text>
              <Text style={styles.actionCardSub} numberOfLines={1}>NDVI Heatmap</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, premiumShadow('#0f172a', 'sm')]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              router.push('/(tabs)/crop-disease-scanner' as any);
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="scan-circle" size={19} color="#15803d" />
            </View>
            <View style={styles.actionCardTextGroup}>
              <Text style={styles.actionCardTitle} numberOfLines={1}>AI Disease Scanner</Text>
              <Text style={styles.actionCardSub} numberOfLines={1}>Instant Leaf Scan</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, premiumShadow('#0f172a', 'sm')]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              onOpenAdminChat?.();
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="chatbubbles" size={19} color="#15803d" />
            </View>
            <View style={styles.actionCardTextGroup}>
              <Text style={styles.actionCardTitle} numberOfLines={1}>Admin Support</Text>
              <Text style={styles.actionCardSub} numberOfLines={1}>Chat Live</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 📊 Kisan Unified Crop & Sowing Intelligence Engine Launcher Card */}
        <TouchableOpacity
          style={[styles.intelligenceLauncherCard, premiumShadow('#0f172a', 'md')]}
          activeOpacity={0.88}
          onPress={() => {
            tap();
            router.push('/crop-intelligence');
          }}
        >
          <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.launcherBannerHeader}>
            <View style={styles.launcherHeaderLeft}>
              <View style={styles.launcherIconBadge}>
                <Ionicons name="analytics" size={22} color="#38bdf8" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={styles.launcherTitle}>📈 Crop Engine (Demand & Sowing)</Text>
                  <View style={styles.livePulsePill}>
                    <Text style={styles.livePulsePillText}>🔴 LIVE</Text>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
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
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingTop: 6, gap: SPACING.sm, paddingBottom: 24 },
  quickAccountsCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 8,
    ...premiumShadow('#0f172a', 'sm'),
  },
  quickAccountsTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  quickAccountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickAccountsBtn: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  quickAccountsBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionCard: {
    width: '48.8%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  actionIconBg: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTextGroup: {
    flex: 1,
    justifyContent: 'center',
  },
  actionCardTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
    letterSpacing: -0.1,
  },
  actionCardSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 0.5,
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
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
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
});
