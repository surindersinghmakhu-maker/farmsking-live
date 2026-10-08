import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Alert, Image as RNImage, Switch, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { useAuth } from '@/src/store/auth-context';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/api/client';
import * as withdrawalsApi from '@/src/api/withdrawals.api';
import * as planPaymentsApi from '@/src/api/planPayments.api';
import * as farmerPlanPaymentsApi from '@/src/api/farmerPlanPayments.api';
import type { WithdrawalRequest } from '@/src/types/api';
import type { PlanPaymentRequest } from '@/src/api/planPayments.api';
import type { FarmerPlanPaymentRequest } from '@/src/api/farmerPlanPayments.api';
import {
  WithdrawalCard,
  ReviewModal,
  PlanPaymentCard,
  PlanPaymentReviewModal,
  FarmerPlanPaymentCard,
  FarmerPlanPaymentReviewModal,
} from '@/app/admin/(tabs)/super-accounts';
import { UserGuidesModal, SuperAdminWorkspaceModal, AdminInfoModal } from '@/app/admin/(tabs)/more';
import { SuperAdminExpenseCategoriesModal } from '../SuperAdminExpenseCategoriesModal';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAdminConversations } from '@/src/hooks/useAdminChat';
import { AdminChatModal } from '@/src/components/AdminChatModal';
import { Avatar } from '@/src/components/Avatar';
import { useCrops } from '@/src/store/crops-context';
import { useGroupVoiceCall } from '@/src/hooks/useGroupVoiceCall';
import { GroupVoiceCallModal } from '@/src/components/chat/GroupVoiceCallModal';
import { SwitchDashboardSection } from '@/src/components/SwitchDashboardSection';
import { useExecutiveTheme } from '@/src/store/theme-context';

const theme = RoleThemes.SUPER_ADMIN;
const LIVE_REQUESTS_POLL_MS = 20000;

type ActionRequiredTabKey = 'SUBMISSIONS' | 'WITHDRAWALS' | 'PLAN_CLAIMS' | 'APPROVALS' | 'HISTORY';

const ACTION_TAB_META: Record<ActionRequiredTabKey, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string }> = {
  SUBMISSIONS: { label: 'Requests', icon: 'cloud-upload-outline', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' },
  WITHDRAWALS: { label: 'Withdrawals', icon: 'cash-outline', color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' },
  PLAN_CLAIMS: { label: 'Plan Claims', icon: 'receipt-outline', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  APPROVALS: { label: 'Approvals', icon: 'shield-checkmark-outline', color: '#ea580c', bg: '#fff7ed', border: '#ffedd5' },
  HISTORY: { label: 'History', icon: 'checkmark-done-circle-outline', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};
const ACTION_TAB_ORDER: ActionRequiredTabKey[] = ['SUBMISSIONS', 'WITHDRAWALS', 'PLAN_CLAIMS', 'APPROVALS', 'HISTORY'];

interface ResolvedRequestItem {
  id: string;
  farmerName: string;
  farmerMobile: string;
  lastMessage: string;
  comment: string;
  resolvedAt: string;
}

export const SuperAdminDashboardView: React.FC = () => {
  const { colors: tConfig } = useExecutiveTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { gpsUnlockRequests, acceptGpsUnlockRequest, declineGpsUnlockRequest } = useCrops();
  const [activeWithdrawal, setActiveWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [activePlanPayment, setActivePlanPayment] = useState<PlanPaymentRequest | null>(null);
  const [activeFarmerPlanPayment, setActiveFarmerPlanPayment] = useState<FarmerPlanPaymentRequest | null>(null);

  const [activeActionTab, setActiveActionTab] = useState<ActionRequiredTabKey>('SUBMISSIONS');
  const [cpanelSubTab, setCpanelSubTab] = useState<'SWITCHES' | 'MODIFICATIONS' | 'OTHERS'>('SWITCHES');
  const [gpsRequestStatus, setGpsRequestStatus] = useState<'PENDING' | 'APPROVED_RESET' | 'DECLINED'>('PENDING');
  const voiceCallHook = useGroupVoiceCall();
  const [showVoiceCallModal, setShowVoiceCallModal] = useState(false);
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [showGuidesModal, setShowGuidesModal] = useState(false);
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [showAdminInfoModal, setShowAdminInfoModal] = useState(false);
  const [showAiUpgradeModal, setShowAiUpgradeModal] = useState(false);
  const [showAiTelemetryModal, setShowAiTelemetryModal] = useState(false);
  const [isRequestsCollapsed, setIsRequestsCollapsed] = useState(true);
  const [activeChatTarget, setActiveChatTarget] = useState<{ farmerId: string; farmerName: string } | null>(null);

  // Faked AI Quota States
  const [aiTier, setAiTier] = useState<'PRO' | 'ULTRA'>('PRO');
  const [aiDaysLeft, setAiDaysLeft] = useState(28);
  const [isUpgradingAi, setIsUpgradingAi] = useState(false);
  const [isRenewingAi, setIsRenewingAi] = useState(false);

  const [resolvingTarget, setResolvingTarget] = useState<{ id: string; name: string } | null>(null);
  const [resolveComment, setResolveComment] = useState('');
  const [resolvedRequests, setResolvedRequests] = useState<ResolvedRequestItem[]>([]);

  const { data: rawConversations = [] } = useAdminConversations();

  const { data: appSettings, refetch: refetchAppSettings } = useQuery({
    queryKey: ['app-settings'],
    queryFn: async () => {
      const { data } = await apiClient.get('/app-settings');
      return data;
    },
    staleTime: 15_000,
    refetchInterval: 30_000,
  });

  const isGroupVoiceCallEnabled = appSettings?.groupVoiceCallEnabled ?? true;

  const handleToggleGroupVoiceCall = async (val: boolean) => {
    try {
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await apiClient.patch('/app-settings', { groupVoiceCallEnabled: val });
      refetchAppSettings();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Could not update setting');
    }
  };

  const { data: withdrawals } = useQuery({
    queryKey: ['withdrawals', 'all'],
    queryFn: withdrawalsApi.listAllWithdrawals,
    refetchInterval: LIVE_REQUESTS_POLL_MS,
  });
  const { data: planPayments } = useQuery({
    queryKey: ['plan-payments', 'pending'],
    queryFn: planPaymentsApi.listPendingPlanPayments,
    refetchInterval: LIVE_REQUESTS_POLL_MS,
  });
  const { data: farmerPlanPayments } = useQuery({
    queryKey: ['farmer-plan-payments', 'pending'],
    queryFn: farmerPlanPaymentsApi.listPendingFarmerPlanPayments,
    refetchInterval: LIVE_REQUESTS_POLL_MS,
  });

  const resolvedIds = new Set(resolvedRequests.map((r) => r.id));
  const conversations = rawConversations.filter((c: any) => !resolvedIds.has(c.farmerId || c.id));

  const pendingWithdrawals = (withdrawals ?? []).filter((w) => w.status === 'PENDING');
  const processedWithdrawals = (withdrawals ?? []).filter((w) => w.status !== 'PENDING');
  const pendingPlanPayments = planPayments ?? [];
  const pendingFarmerPlanPayments = farmerPlanPayments ?? [];
  const pendingGpsRequests = gpsUnlockRequests.filter((r) => r.status === 'PENDING');

  const totalRequests = conversations.length + pendingWithdrawals.length + pendingPlanPayments.length + pendingFarmerPlanPayments.length + pendingGpsRequests.length;
  const historyTotal = processedWithdrawals.length + resolvedRequests.length;

  const activeMeta = ACTION_TAB_META[activeActionTab];

  const handleConfirmResolve = () => {
    if (!resolvingTarget) return;
    const targetConv = rawConversations.find((c: any) => (c.farmerId || c.id) === resolvingTarget.id);
    const newResolved: ResolvedRequestItem = {
      id: resolvingTarget.id,
      farmerName: resolvingTarget.name,
      farmerMobile: targetConv?.farmerMobile || targetConv?.farmer?.mobile || 'N/A',
      lastMessage: targetConv?.lastMessage || targetConv?.message || 'General user request',
      comment: resolveComment.trim() || 'Resolved by Super Admin',
      resolvedAt: new Date().toISOString(),
    };

    setResolvedRequests((prev) => [newResolved, ...prev]);
    setResolvingTarget(null);
    setResolveComment('');
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: tConfig.bg }]} showsVerticalScrollIndicator={false}>
      <RoleHeader
        currentRole="SUPER_ADMIN"
        profileName={user?.name || 'Super Admin'}
        subtitle="Platform Command Center"
        avatarUrl={user?.photoUrl || undefined}
      />

      <View style={styles.content}>
        
        {/* ⭐ PREMIUM ECOSYSTEM COMMAND CENTER ⭐ */}
        <View style={styles.ecoHubContainer}>
          <View style={styles.ecoHubHeader}>
            <Ionicons name="git-network-outline" size={20} color="#059669" />
            <Text style={styles.ecoHubTitle}>Ecosystem Command Center</Text>
          </View>
          <Text style={styles.ecoHubSubtitle}>Manage platform systems per flowchart hierarchy</Text>

          <View style={styles.ecoGrid}>
            <TouchableOpacity style={styles.ecoCard} activeOpacity={0.8} onPress={() => router.push('/admin/(tabs)/super-users' as any)}>
              <View style={[styles.ecoIconBox, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="people" size={24} color="#2563eb" />
              </View>
              <Text style={styles.ecoCardTitle}>Admin & Users</Text>
              <Text style={styles.ecoCardDesc}>Manage all 5 Admin Roles & Users</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ecoCard} activeOpacity={0.8} onPress={() => router.push('/admin/(tabs)/admin_shop' as any)}>
              <View style={[styles.ecoIconBox, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="storefront" size={24} color="#dc2626" />
              </View>
              <Text style={styles.ecoCardTitle}>E-Commerce</Text>
              <Text style={styles.ecoCardDesc}>Products, Stores, Inventory</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ecoCard} activeOpacity={0.8} onPress={() => router.push('/admin/(tabs)/super-accounts' as any)}>
              <View style={[styles.ecoIconBox, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="wallet" size={24} color="#16a34a" />
              </View>
              <Text style={styles.ecoCardTitle}>Wallet & Finance</Text>
              <Text style={styles.ecoCardDesc}>Commissions, Payouts & Transactions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.ecoCard} activeOpacity={0.8} onPress={() => { setActiveActionTab('SUBMISSIONS'); setIsRequestsCollapsed(false); }}>
              <View style={[styles.ecoIconBox, { backgroundColor: '#fffbeb' }]}>
                <Ionicons name="leaf" size={24} color="#d97706" />
              </View>
              <Text style={styles.ecoCardTitle}>Advisory & AI</Text>
              <Text style={styles.ecoCardDesc}>Crop Doctors, Gardeners, AI Consults</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* ⭐ END PREMIUM ECOSYSTEM COMMAND CENTER ⭐ */}

        <SwitchDashboardSection />

        {/* 🤖 Admin System Tool Widget: Google AI Telemetry & Quota Button */}
        <TouchableOpacity
          style={[styles.compactAdminAiCard, premiumShadow('#4f46e5', 'sm')]}
          activeOpacity={0.88}
          onPress={() => setShowAiTelemetryModal(true)}
        >
          <View style={styles.iosAiQuotaHeader}>
            <View style={styles.iosAiIconCircle}>
              <Ionicons name="sparkles" size={18} color="#ffffff" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.iosAiQuotaTitle}>Google AI Telemetry & Quota</Text>
                <View style={styles.iosEngineBadge}>
                  <View style={styles.iosEngineDot} />
                  <Text style={styles.iosEngineBadgeText}>Gemini 2.5 Flash</Text>
                </View>
              </View>
              <Text style={styles.compactAdminAiSub} numberOfLines={1}>
                🟢 {aiTier === 'ULTRA' ? '7,150 / 25,000' : '1,420 / 5,000'} queries today · Grounding Active · {aiDaysLeft}d left
              </Text>
            </View>

            <View style={styles.compactOpenTelemetryBtn}>
              <Ionicons name="stats-chart" size={13} color="#ffffff" />
              <Text style={styles.compactOpenTelemetryText}>Open Meter</Text>
            </View>
          </View>
        </TouchableOpacity>

        <View style={[styles.kpiBar, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.kpiCol}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <View style={[styles.miniDot, { backgroundColor: totalRequests > 0 ? '#d97706' : '#16a34a' }]} />
              <Text style={styles.kpiLabel}>Pending</Text>
            </View>
            <Text style={[styles.kpiVal, totalRequests > 0 && { color: '#d97706' }]}>{totalRequests}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>Withdrawals</Text>
            <Text style={styles.kpiVal}>{pendingWithdrawals.length}</Text>
          </View>
          <View style={styles.kpiDivider} />
          <View style={styles.kpiCol}>
            <Text style={styles.kpiLabel}>Payments</Text>
            <Text style={styles.kpiVal}>{pendingPlanPayments.length + pendingFarmerPlanPayments.length}</Text>
          </View>
        </View>

        {/* Admin Group Voice Call Start Button */}
        {isGroupVoiceCallEnabled || voiceCallHook.activeCall ? (
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              backgroundColor: '#059669',
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderRadius: 12,
              marginBottom: 6,
              shadowColor: '#059669',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
            activeOpacity={0.85}
            onPress={async () => {
              try {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowVoiceCallModal(true);
                if (!voiceCallHook.activeCall) {
                  await voiceCallHook.startCall('Super Admin Farmer Conference');
                }
              } catch (err: any) {
                const msg = err?.response?.data?.message || err?.message || 'Could not start group call';
                if (Platform.OS === 'web') {
                  window.alert('Call Error: ' + msg);
                } else {
                  Alert.alert('Call Error', msg);
                }
              }
            }}
          >
            <Ionicons name="call" size={18} color="#ffffff" />
            <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>
              {voiceCallHook.activeCall ? '🔴 Join Active Admin Voice Call' : '🎙️ Start Farmer Group Voice Call'}
            </Text>
          </TouchableOpacity>
        ) : null}

        <GroupVoiceCallModal
          visible={showVoiceCallModal}
          onClose={() => setShowVoiceCallModal(false)}
          voiceCallHook={voiceCallHook}
          currentUserId={user?.id}
          isHostOrAdmin={true}
        />

        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
            {ACTION_TAB_ORDER.map((key) => {
              const meta = ACTION_TAB_META[key];
              const isActive = activeActionTab === key;
              const count =
                key === 'SUBMISSIONS'
                  ? conversations.length + pendingGpsRequests.length
                  : key === 'WITHDRAWALS'
                    ? pendingWithdrawals.length
                    : key === 'PLAN_CLAIMS'
                      ? pendingPlanPayments.length + pendingFarmerPlanPayments.length
                      : historyTotal;

              const isSubmissionAlert = key === 'SUBMISSIONS' && (conversations.length > 0 || pendingGpsRequests.length > 0);

              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.tabChip,
                    isActive && { backgroundColor: meta.color, borderColor: meta.color },
                    isSubmissionAlert && !isActive && styles.submissionPulseTabChip,
                  ]}
                  activeOpacity={0.85}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setActiveActionTab(key);
                  }}
                >
                  <Ionicons
                    name={isSubmissionAlert ? 'notifications' : meta.icon}
                    size={13}
                    color={isActive ? '#ffffff' : isSubmissionAlert ? '#dc2626' : meta.color}
                  />
                  <Text
                    style={[
                      styles.tabChipText,
                      { color: isActive ? '#ffffff' : meta.color },
                    ]}
                  >
                    {meta.label}
                  </Text>
                  {count > 0 ? (
                    <View
                      style={[
                        styles.tabChipCount,
                        isActive && styles.tabChipCountActive,
                        isSubmissionAlert && !isActive && { backgroundColor: '#dc2626' },
                      ]}
                    >
                      <Text style={[styles.tabChipCountText, { color: '#ffffff' }]}>{count}</Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.tabBody}>
            {activeActionTab === 'SUBMISSIONS' ? (
              <View style={{ gap: 10, width: '100%' }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: '#eff6ff',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: '#dbeafe',
                  }}
                  activeOpacity={0.7}
                  onPress={() => setIsRequestsCollapsed(!isRequestsCollapsed)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="cloud-upload-outline" size={16} color="#2563eb" />
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#1e40af' }}>
                      Active Support Requests ({conversations.length})
                    </Text>
                  </View>
                  <Ionicons name={isRequestsCollapsed ? 'chevron-down-circle' : 'chevron-up-circle'} size={18} color="#2563eb" />
                </TouchableOpacity>

                {conversations.length === 0 ? (
                  <Text style={styles.emptyText}>No support conversations scheduled.</Text>
                ) : !isRequestsCollapsed ? (
                  <View style={{ gap: 10, width: '100%' }}>
                    {conversations.map((conv: any) => {
                      const farmerId = conv.farmerId || conv.farmer?.id || conv.id;
                      const farmerName = conv.farmerName || conv.farmer?.name || 'User/Partner';
                      const farmerMobile = conv.farmerMobile || conv.farmer?.mobile || 'N/A';
                      const kingId = conv.kingId || conv.farmer?.kingId;
                      const rawPhotoUrl = conv.photoUrl || conv.farmer?.photoUrl;

                      return (
                        <View key={farmerId} style={styles.profRequestCardFit}>
                          {/* 1. VERY TOP ROW: Profile Photo -> King ID -> Name -> Mobile */}
                          <View style={styles.cardVeryTopBarFit}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {/* Profile Photo on Left of King ID */}
                              <View style={styles.profAvatarWrapper}>
                                <Avatar uri={rawPhotoUrl} size={36} />
                                <View style={styles.onlineDot} />
                              </View>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', flex: 1 }}>
                                <View style={styles.profKingBadge}>
                                  <Ionicons name="key" size={10} color="#92400e" />
                                  <Text style={styles.profKingBadgeText}>{kingId || 'FK-USER'}</Text>
                                </View>
                                <Text style={styles.profName}>{farmerName}</Text>
                                <View style={styles.profMobileBadge}>
                                  <Ionicons name="call" size={10} color="#475569" />
                                  <Text style={styles.profMobileText}>{farmerMobile}</Text>
                                </View>
                              </View>
                            </View>
                          </View>

                          {/* 2. BODY ROW: Message Box + Stacked Action Buttons */}
                          <View style={styles.profCardBodyRowFit}>
                            <View style={styles.profMsgBoxFit}>
                              <Text style={styles.profMsgTextFit} numberOfLines={2}>
                                💬 "{conv.lastMessage || conv.message || 'Help & Support Request'}"
                              </Text>
                            </View>

                            {/* Right Stacked Buttons: Resolve on top, Chat under */}
                            <View style={{ flexDirection: 'column', gap: 4, alignItems: 'flex-end', justifyContent: 'center' }}>
                              <TouchableOpacity
                                style={styles.profResolveBtnAction}
                                activeOpacity={0.85}
                                onPress={() => {
                                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setResolvingTarget({ id: farmerId, name: farmerName });
                                }}
                              >
                                <Ionicons name="checkmark-done" size={12} color="#ffffff" />
                                <Text style={styles.profResolveBtnText}>Resolve</Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={styles.profChatBtnFit}
                                activeOpacity={0.85}
                                onPress={() => {
                                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                  setActiveChatTarget({ farmerId, farmerName });
                                }}
                              >
                                <Ionicons name="chatbubbles" size={12} color="#2563eb" />
                                <Text style={styles.profChatBtnTextFit}>Chat</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                ) : null}
              </View>
            ) : activeActionTab === 'WITHDRAWALS' ? (
              pendingWithdrawals.length === 0 ? (
                <Text style={styles.emptyText}>No pending partner withdrawal requests.</Text>
              ) : (
                <View style={{ gap: 8, width: '100%' }}>
                  {pendingWithdrawals.map((w) => (
                    <WithdrawalCard key={w.id} request={w} onReview={() => setActiveWithdrawal(w)} />
                  ))}
                </View>
              )
            ) : activeActionTab === 'PLAN_CLAIMS' ? (
              pendingPlanPayments.length === 0 && pendingFarmerPlanPayments.length === 0 ? (
                <Text style={styles.emptyText}>No pending plan payment claims.</Text>
              ) : (
                <View style={{ gap: 10, width: '100%' }}>
                  {pendingFarmerPlanPayments.map((p) => (
                    <FarmerPlanPaymentCard key={p.id} request={p} onReview={() => setActiveFarmerPlanPayment(p)} />
                  ))}
                  {pendingPlanPayments.map((p) => (
                    <PlanPaymentCard key={p.id} request={p} onReview={() => setActivePlanPayment(p)} />
                  ))}
                </View>
              )
            ) : activeActionTab === 'APPROVALS' ? (
              <View style={{ width: '100%', gap: 12, paddingVertical: 4 }}>
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff7ed', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ffedd5', gap: 12 }}
                  onPress={() => router.push('/admin-sellers' as never)}
                  activeOpacity={0.8}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#ea580c', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="storefront" size={20} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#9a3412' }}>Seller KYC & Approvals</Text>
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#c2410c', marginTop: 2 }}>Review and approve new store registrations</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#fb923c" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#eff6ff', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#dbeafe', gap: 12 }}
                  onPress={() => router.push('/(tabs)/super-users' as never)}
                  activeOpacity={0.8}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="medkit" size={20} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontFamily: FONT.extraBold, color: '#1e40af' }}>Expert Approvals (Agri/Garden)</Text>
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#2563eb', marginTop: 2 }}>Verify and approve new crop doctors & garden experts</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#60a5fa" />
                </TouchableOpacity>
              </View>

            ) : activeActionTab === 'HISTORY' ? (
              historyTotal === 0 ? (
                <Text style={styles.emptyText}>No resolved history records yet.</Text>
              ) : (
                <View style={{ gap: 5, width: '100%' }}>
                  {resolvedRequests.map((req) => (
                    <View key={req.id} style={styles.compactHistoryRow}>
                      <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'nowrap' }}>
                        <Text style={styles.compactHistoryName} numberOfLines={1}>👨‍🌾 {req.farmerName}</Text>
                        <Text style={styles.compactHistoryMobile} numberOfLines={1}>📱 {req.farmerMobile}</Text>
                        <Text style={styles.compactHistoryComment} numberOfLines={1}>· 📝 {req.comment}</Text>
                      </View>
                      <View style={styles.compactResolvedBadge}>
                        <Ionicons name="checkmark-circle" size={10} color="#15803d" />
                        <Text style={styles.compactResolvedBadgeText}>RESOLVED</Text>
                      </View>
                    </View>
                  ))}
                  {processedWithdrawals.map((w) => (
                    <WithdrawalCard key={w.id} request={w} />
                  ))}
                </View>
              )
            ) : null}
          </View>
        </View>

        <View style={[styles.quickActionsCard, premiumShadow('#0f172a', 'sm')]}>
          <Text style={styles.quickActionsTitle}>Super Admin Shortcuts & Tools</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/crop-intelligence' as any as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="sparkles" size={16} color="#15803d" />
              </View>
              <Text style={styles.pillText}>AI Doctor</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/super-orders' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#eef2ff' }]}>
                <Ionicons name="receipt" size={16} color="#4f46e5" />
              </View>
              <Text style={styles.pillText}>Sales Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/admin-products' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="cube" size={16} color="#2563eb" />
              </View>
              <Text style={styles.pillText}>Products</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/admin-orders' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#f5f3ff' }]}>
                <Ionicons name="storefront" size={16} color="#7c3aed" />
              </View>
              <Text style={styles.pillText}>Store Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/admin-sellers' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#fff7ed' }]}>
                <Ionicons name="shield-checkmark" size={16} color="#ea580c" />
              </View>
              <Text style={styles.pillText}>Seller KYC</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/seller-payouts' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="wallet" size={16} color="#059669" />
              </View>
              <Text style={styles.pillText}>Seller Payouts</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/super-coupons' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#fdf4ff' }]}>
                <Ionicons name="ticket" size={16} color="#c026d3" />
              </View>
              <Text style={styles.pillText}>VIP Passes</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/super-crop-edit' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="leaf" size={16} color="#16a34a" />
              </View>
              <Text style={styles.pillText}>Edit Crops</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/super-audit-log' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#f8fafc' }]}>
                <Ionicons name="time" size={16} color="#475569" />
              </View>
              <Text style={styles.pillText}>Audit Log</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/super-settings' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#ccfbf1' }]}>
                <Ionicons name="options" size={16} color="#0d9488" />
              </View>
              <Text style={styles.pillText}>C-Panel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => setShowCategoriesModal(true)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="pricetags" size={16} color="#dc2626" />
              </View>
              <Text style={styles.pillText}>Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => setShowWorkspaceModal(true)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="briefcase" size={16} color="#0284c7" />
              </View>
              <Text style={styles.pillText}>Workspace</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => setShowGuidesModal(true)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="book" size={16} color="#15803d" />
              </View>
              <Text style={styles.pillText}>User Guides</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ReviewModal request={activeWithdrawal} onClose={() => setActiveWithdrawal(null)} />
      <PlanPaymentReviewModal request={activePlanPayment} onClose={() => setActivePlanPayment(null)} />
      <FarmerPlanPaymentReviewModal request={activeFarmerPlanPayment} onClose={() => setActiveFarmerPlanPayment(null)} />

      <SuperAdminExpenseCategoriesModal visible={showCategoriesModal} onClose={() => setShowCategoriesModal(false)} />
      <SuperAdminWorkspaceModal visible={showWorkspaceModal} onClose={() => setShowWorkspaceModal(false)} />
      <UserGuidesModal visible={showGuidesModal} onClose={() => setShowGuidesModal(false)} />
      {/* 🤖 Google AI Telemetry & Quota Monitor Modal */}
      <Modal visible={showAiTelemetryModal} transparent animationType="slide" onRequestClose={() => setShowAiTelemetryModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 480 }]}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.iosAiIconCircle}>
                <Ionicons name="sparkles" size={18} color="#ffffff" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalTitle}>Google AI Telemetry & Quota</Text>
                  <View style={styles.iosEngineBadge}>
                    <View style={styles.iosEngineDot} />
                    <Text style={styles.iosEngineBadgeText}>Gemini 2.5 Flash</Text>
                  </View>
                </View>
                <Text style={styles.modalSub}>Real-time API Telemetry, Search Grounding & License Renewal</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiTelemetryModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* iOS Meter Stats Grid */}
            <View style={styles.iosMeterGrid}>
              <View style={styles.iosMeterCard}>
                <Text style={styles.iosMeterLabel}>Daily AI Queries</Text>
                <Text style={styles.iosMeterVal}>{aiTier === 'ULTRA' ? '7,150' : '1,420'} <Text style={styles.iosMeterLimit}>/ {aiTier === 'ULTRA' ? '25,000' : '5,000'}</Text></Text>
                <View style={styles.iosProgressTrack}>
                  <View style={[styles.iosProgressFill, { width: aiTier === 'ULTRA' ? '28.6%' : '28.4%' }]} />
                </View>
              </View>

              <View style={styles.iosMeterCard}>
                <Text style={styles.iosMeterLabel}>Search Grounding</Text>
                <Text style={[styles.iosMeterVal, { color: '#059669' }]}>100% Active</Text>
                <Text style={styles.iosMeterSub}>Real-time Web Grounding ON</Text>
              </View>

              <View style={styles.iosMeterCard}>
                <Text style={styles.iosMeterLabel}>License Renewal</Text>
                <Text style={[styles.iosMeterVal, { color: '#d97706' }]}>{aiDaysLeft} Days Left</Text>
                <Text style={styles.iosMeterSub}>Renews: {new Date(new Date().getTime() + aiDaysLeft * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
              </View>
            </View>

            {/* Action Buttons inside Modal */}
            <View style={{ gap: 8, marginTop: 14 }}>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: '#4f46e5',
                  paddingVertical: 10,
                  borderRadius: RADIUS.pill,
                }}
                activeOpacity={0.85}
                onPress={() => {
                  setShowAiTelemetryModal(false);
                  setShowAiUpgradeModal(true);
                }}
              >
                <Ionicons name="arrow-up-circle" size={16} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontSize: 13, fontFamily: FONT.extraBold }}>Renew / Upgrade Quota Tier</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: '#f1f5f9',
                  paddingVertical: 10,
                  borderRadius: RADIUS.pill,
                  borderWidth: 1,
                  borderColor: '#cbd5e1',
                }}
                activeOpacity={0.8}
                onPress={() => {
                  setShowAiTelemetryModal(false);
                  router.push('/(tabs)/super-settings' as never);
                }}
              >
                <Ionicons name="key-outline" size={16} color="#334155" />
                <Text style={{ color: '#334155', fontSize: 12.5, fontFamily: FONT.bold }}>Configure Gemini API Keys in C-Panel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 🤖 iOS Model: AI Usage Renew & Upgrade Modal */}
      <Modal visible={showAiUpgradeModal} transparent animationType="slide" onRequestClose={() => setShowAiUpgradeModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 460 }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>✨ Google AI License & Quota Upgrade</Text>
                <Text style={styles.modalSub}>Manage API Quota Tiers & License Renewals</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAiUpgradeModal(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10, marginVertical: 10 }}>
              {/* Current Tier Badge */}
              <View style={{ backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bfdbfe' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: '#1d4ed8', textTransform: 'uppercase' }}>Current Active Tier</Text>
                  <View style={{ backgroundColor: '#2563eb', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>{aiTier === 'ULTRA' ? 'ENTERPRISE ULTRA' : 'PRO TIER'}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 4 }}>
                  {aiTier === 'ULTRA' ? '25,000 Queries / Day (Gemini 2.5 Flash)' : '5,000 Queries / Day (Gemini 2.5 Flash)'}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#475569', marginTop: 2 }}>
                  Search Grounding Enabled · Auto-Renewal on {new Date(new Date().getTime() + aiDaysLeft * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>

              {/* Upgrade Tiers */}
              <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#334155', marginTop: 4 }}>Select Upgrade Quota Plan:</Text>

              <TouchableOpacity
                style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#86efac', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', opacity: aiTier === 'ULTRA' ? 0.5 : 1 }}
                activeOpacity={0.8}
                disabled={aiTier === 'ULTRA' || isUpgradingAi}
                onPress={() => {
                  setIsUpgradingAi(true);
                  setTimeout(() => {
                    setAiTier('ULTRA');
                    setIsUpgradingAi(false);
                    Alert.alert('Quota Upgraded', 'Successfully upgraded to Enterprise Ultra Tier (25,000 Queries/Day)!');
                    setShowAiUpgradeModal(false);
                  }, 1000);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#15803d' }}>
                    🚀 Enterprise Ultra Tier
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#166534', marginTop: 1 }}>
                    25,000 Queries/Day · High-Priority Gemini 2.5 Flash
                  </Text>
                </View>
                <View style={{ backgroundColor: aiTier === 'ULTRA' ? '#94a3b8' : '#16a34a', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                  {isUpgradingAi ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: '#ffffff' }}>{aiTier === 'ULTRA' ? 'Active' : 'Upgrade'}</Text>}
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ backgroundColor: '#faf5ff', borderRadius: 12, padding: 12, borderWidth: 1.5, borderColor: '#d8b4fe', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                activeOpacity={0.8}
                disabled={isRenewingAi}
                onPress={() => {
                  setIsRenewingAi(true);
                  setTimeout(() => {
                    setAiDaysLeft((prev) => prev + 365);
                    setIsRenewingAi(false);
                    Alert.alert('Subscription Renewed', 'Google AI Gemini 2.5 License extended by 365 Days!');
                    setShowAiUpgradeModal(false);
                  }, 1000);
                }}
              >
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#7e22ce' }}>
                    🔄 Instant 1-Year License Renewal
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#6b21a8', marginTop: 1 }}>
                    Extend current subscription for 365 Days
                  </Text>
                </View>
                <View style={{ backgroundColor: '#9333ea', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 }}>
                  {isRenewingAi ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={{ fontSize: 11, fontFamily: FONT.extraBold, color: '#ffffff' }}>Renew Now</Text>}
                </View>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.rejectBtn} onPress={() => setShowAiUpgradeModal(false)}>
              <Text style={styles.rejectBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {activeChatTarget && (
        <AdminChatModal
          visible={!!activeChatTarget}
          onClose={() => setActiveChatTarget(null)}
          farmerId={activeChatTarget.farmerId}
          farmerName={activeChatTarget.farmerName}
        />
      )}

      {resolvingTarget && (
        <Modal visible={!!resolvingTarget} transparent animationType="slide" onRequestClose={() => setResolvingTarget(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Resolve Request</Text>
                  <Text style={styles.modalSub}>{resolvingTarget.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setResolvingTarget(null)}>
                  <Ionicons name="close-circle" size={24} color="#64748b" />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Resolution Comment / Admin Remark</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                multiline
                value={resolveComment}
                onChangeText={setResolveComment}
                placeholder="e.g. Query answered, guided farmer on call, issue fixed..."
                placeholderTextColor="#94a3b8"
              />

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                <TouchableOpacity style={styles.rejectBtn} onPress={() => setResolvingTarget(null)}>
                  <Text style={styles.rejectBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.approveBtn, !resolveComment.trim() && { opacity: 0.5 }]}
                  disabled={!resolveComment.trim()}
                  onPress={handleConfirmResolve}
                >
                  <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                  <Text style={styles.approveBtnText}>Save & Move to History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 8, gap: 8, paddingBottom: SPACING.xl },
  kpiBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  kpiCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 1,
  },
  miniDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  kpiLabel: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.2,
  },
  kpiVal: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  kpiDivider: {
    width: 1,
    height: 22,
    backgroundColor: '#f1f5f9',
  },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 8, },
  tabRow: { gap: 6, paddingVertical: 2, paddingBottom: 6, alignItems: 'center' },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  tabChipText: { fontSize: 11.5, fontFamily: FONT.bold },
  tabChipCount: { minWidth: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  tabChipCountActive: { backgroundColor: 'rgba(255,255,255,0.25)' },
  tabChipCountText: { fontSize: 9, fontFamily: FONT.extraBold },
  tabBody: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 10, paddingBottom: 8, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 12 },
  emptyText: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 6, marginTop: 2, borderTopWidth: 1, borderTopColor: '#f8fafc', width: '100%' },
  viewAllText: { fontSize: 11, fontFamily: FONT.bold, color: theme.primary },
  quickActionsCard: { backgroundColor: '#ffffff', borderRadius: 12, padding: 8, gap: 6 },
  quickActionsTitle: { fontSize: 10.5, fontFamily: FONT.extraBold, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.3 },
  quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  quickPill: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pillIconBg: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: { fontSize: 10.5, fontFamily: FONT.extraBold, color: '#1e293b' },
  profRequestCardFit: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    gap: 5,
    width: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardVeryTopBarFit: {
    width: '100%',
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  profCardBodyRowFit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  profMsgBoxFit: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderLeftWidth: 2.5,
    borderLeftColor: '#2563eb',
  },
  profMsgTextFit: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#334155',
    lineHeight: 15,
  },
  queryLabelText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#2563eb',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  profChatBtnFit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  profChatBtnTextFit: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#2563eb',
  },
  profRequestCard: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    gap: 8,
    width: '100%',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardVeryTopBar: {
    width: '100%',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 2,
  },
  profCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  profAvatarWrapper: {
    position: 'relative',
  },
  blackMaskedAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22c55e',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  profKingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  profKingBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#92400e',
  },
  profName: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  profMobileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  profMobileText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  profMsgBox: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#3b82f6',
  },
  profMsgText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  profChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  profCardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 4,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    width: '100%',
  },
  profChatBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  profResolveBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#16a34a',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  profChatBtnVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
  },
  profResolveBtnVertical: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
  },
  profChatBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#2563eb',
  },
  profResolveBtnText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  profResolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  cleanRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 10,
    gap: 10,
    width: '100%',
  },
  cleanAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  cleanAvatarText: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#2563eb',
  },
  cleanName: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  cleanMobileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  cleanMobileText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  cleanMsgSnippet: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  cleanChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  cleanChatBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#2563eb',
  },
  cleanResolveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  cleanResolveBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  compactHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
    width: '100%',
  },
  compactHistoryName: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  compactHistoryMobile: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  compactHistoryComment: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#15803d',
    flex: 1,
  },
  compactResolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  compactResolvedBadgeText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  resolvedCommentBox: {
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
  },
  resolvedCommentText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, gap: 6, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#475569', marginTop: 4 },
  input: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0f172a' },
  rejectBtn: { flex: 1, backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { color: '#64748b', fontSize: 12.5, fontFamily: FONT.bold },
  approveBtn: { flex: 1, flexDirection: 'row', gap: 5, backgroundColor: theme.primary, paddingVertical: 10, borderRadius: RADIUS.pill, alignItems: 'center', justifyContent: 'center' },
  approveBtnText: { color: '#ffffff', fontSize: 12.5, fontFamily: FONT.extraBold },
  submissionPulseTabChip: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff1f2',
  },
  compactAdminAiCard: {
    backgroundColor: '#312e81',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#6366f1',
    marginVertical: 4,
  },
  compactAdminAiSub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#c7d2fe',
    marginTop: 2,
  },
  compactOpenTelemetryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#4f46e5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  compactOpenTelemetryText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  iosMeterSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  iosAiQuotaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iosAiQuotaTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  iosAiIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e7ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iosEngineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    gap: 4,
  },
  iosEngineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  iosEngineBadgeText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  iosMeterGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  iosMeterCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iosMeterLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
    textTransform: 'uppercase',
  },
  iosMeterVal: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    marginTop: 2,
  },
  iosMeterLimit: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  iosProgressTrack: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  iosProgressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 2,
  },
  ecoHubContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...premiumShadow('#cbd5e1', 'md'),
  },
  ecoHubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  ecoHubTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  ecoHubSubtitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginBottom: 16,
  },
  ecoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  ecoCard: {
    width: '48%',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    alignItems: 'flex-start',
  },
  ecoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  ecoCardTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#1e293b',
    marginBottom: 4,
  },
  ecoCardDesc: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
    lineHeight: 16,
  },
});
