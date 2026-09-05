import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Modal, TextInput, Alert, Image as RNImage, Switch } from 'react-native';
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
} from '@/app/(tabs)/super-accounts';
import { UserGuidesModal, SuperAdminWorkspaceModal, AdminInfoModal } from '@/app/(tabs)/more';
import { SuperAdminExpenseCategoriesModal } from '../SuperAdminExpenseCategoriesModal';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAdminConversations } from '@/src/hooks/useAdminChat';
import { AdminChatModal } from '@/src/components/AdminChatModal';
import { Avatar } from '@/src/components/Avatar';
import { useCrops } from '@/src/store/crops-context';
import { useGroupVoiceCall } from '@/src/hooks/useGroupVoiceCall';
import { GroupVoiceCallModal } from '@/src/components/chat/GroupVoiceCallModal';

const theme = RoleThemes.SUPER_ADMIN;
const LIVE_REQUESTS_POLL_MS = 20000;

type ActionRequiredTabKey = 'SUBMISSIONS' | 'WITHDRAWALS' | 'PLAN_CLAIMS' | 'CPANEL' | 'SETTINGS' | 'HISTORY';

const ACTION_TAB_META: Record<ActionRequiredTabKey, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string; border: string }> = {
  SUBMISSIONS: { label: 'Requests', icon: 'cloud-upload-outline', color: '#2563eb', bg: '#eff6ff', border: '#dbeafe' },
  WITHDRAWALS: { label: 'Withdrawals', icon: 'cash-outline', color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' },
  PLAN_CLAIMS: { label: 'Plan Claims', icon: 'receipt-outline', color: '#b45309', bg: '#fffbeb', border: '#fde68a' },
  CPANEL: { label: 'C-Panel', icon: 'server-outline', color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
  SETTINGS: { label: 'Settings', icon: 'options-outline', color: '#0d9488', bg: '#ccfbf1', border: '#99f6e4' },
  HISTORY: { label: 'History', icon: 'checkmark-done-circle-outline', color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
};
const ACTION_TAB_ORDER: ActionRequiredTabKey[] = ['SUBMISSIONS', 'WITHDRAWALS', 'PLAN_CLAIMS', 'CPANEL', 'SETTINGS', 'HISTORY'];

interface ResolvedRequestItem {
  id: string;
  farmerName: string;
  farmerMobile: string;
  lastMessage: string;
  comment: string;
  resolvedAt: string;
}

export const SuperAdminDashboardView: React.FC = () => {
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
  const [isRequestsCollapsed, setIsRequestsCollapsed] = useState(true);
  const [activeChatTarget, setActiveChatTarget] = useState<{ farmerId: string; farmerName: string } | null>(null);

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
    refetchInterval: 3000,
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
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <RoleHeader
        currentRole="SUPER_ADMIN"
        profileName={user?.name || 'Super Admin'}
        subtitle="Platform Command Center"
        avatarUrl={user?.photoUrl || undefined}
      />

      <View style={styles.content}>
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
            ) : activeActionTab === 'CPANEL' ? (
              <View style={{ width: '100%', gap: 10, paddingVertical: 4 }}>

                {/* ── Sub-Tab Nav Bar ── */}
                <View style={{ flexDirection: 'row', gap: 6, marginBottom: 2 }}>
                  {([
                    { id: 'SWITCHES',       label: '🔀 Switches',       icon: 'toggle' },
                    { id: 'MODIFICATIONS',  label: '✏️ Modifications',   icon: 'create' },
                    { id: 'OTHERS',         label: '📦 Others',          icon: 'grid' },
                  ] as const).map((tab) => {
                    const active = cpanelSubTab === tab.id;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setCpanelSubTab(tab.id);
                        }}
                        style={{
                          flex: 1,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 5,
                          paddingVertical: 7,
                          borderRadius: RADIUS.pill,
                          backgroundColor: active ? '#dc2626' : '#f1f5f9',
                          borderWidth: 1,
                          borderColor: active ? '#dc2626' : '#e2e8f0',
                        }}
                      >
                        <Ionicons name={tab.icon as any} size={13} color={active ? '#fff' : '#475569'} />
                        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: active ? '#fff' : '#334155' }}>
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* ── SWITCHES Tab ── */}
                {cpanelSubTab === 'SWITCHES' ? (
                  <View style={{ gap: 10 }}>
                    {/* 🎙️ Group Voice Call */}
                    <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bbf7d0', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
                            <Ionicons name="mic-outline" size={18} color="#ffffff" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' }}>🎙️ Group Voice Call</Text>
                            <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                              Allow Advisors & Admins to host live audio conferences
                            </Text>
                          </View>
                        </View>
                        <Switch
                          value={isGroupVoiceCallEnabled}
                          onValueChange={handleToggleGroupVoiceCall}
                          trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                          thumbColor="#ffffff"
                        />
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#dcfce7' }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isGroupVoiceCallEnabled ? '#16a34a' : '#dc2626' }} />
                        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: isGroupVoiceCallEnabled ? '#15803d' : '#dc2626' }}>
                          {isGroupVoiceCallEnabled ? 'STATUS: ACTIVE' : 'STATUS: DISABLED'}
                        </Text>
                      </View>
                    </View>
                   </View>

                ) : cpanelSubTab === 'MODIFICATIONS' ? (
                  /* ── MODIFICATIONS Tab ── */
                  <View style={{ gap: 10 }}>
                    {/* 🏷️ Expense Categories */}
                    <View style={{ backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#fecaca', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="pricetags" size={18} color="#ffffff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' }}>🏷️ Expense Categories</Text>
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                            Add, edit names & priority, or deactivate categories
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#dc2626', paddingVertical: 10, borderRadius: 10 }}
                        onPress={() => setShowCategoriesModal(true)}
                      >
                        <Ionicons name="open-outline" size={15} color="#ffffff" />
                        <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>Open Category Manager</Text>
                      </TouchableOpacity>
                    </View>

                    {/* 👑 Admin Info */}
                    <View style={{ backgroundColor: '#eff6ff', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bfdbfe', gap: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' }}>
                          <Ionicons name="shield-checkmark" size={18} color="#ffffff" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' }}>👑 Admin Info & Brand Details</Text>
                          <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                            App Name, Brand Logo, Tagline, Payment UPI & Super Admin Profile
                          </Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2563eb', paddingVertical: 10, borderRadius: 10 }}
                        onPress={() => setShowAdminInfoModal(true)}
                      >
                        <Ionicons name="create-outline" size={15} color="#ffffff" />
                        <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>Open Admin Info Console</Text>
                      </TouchableOpacity>
                    </View>

                    {/* ⚙️ System Settings */}
                    <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#cbd5e1', gap: 8 }}>
                      <Text style={{ fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' }}>⚙️ System Settings & Feature Controls</Text>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0d9488', paddingVertical: 10, borderRadius: 10 }}
                        onPress={() => router.push('/(tabs)/super-settings' as never)}
                      >
                        <Ionicons name="options" size={16} color="#ffffff" />
                        <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>Open System Settings Console</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                ) : (
                  /* ── OTHERS Tab ── */
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => setShowWorkspaceModal(true)}>
                      <View style={[styles.pillIconBg, { backgroundColor: '#ccfbf1' }]}>
                        <Ionicons name="briefcase" size={16} color="#0d9488" />
                      </View>
                      <Text style={styles.pillText}>Workspace</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => setShowGuidesModal(true)}>
                      <View style={[styles.pillIconBg, { backgroundColor: '#f0fdf4' }]}>
                        <Ionicons name="book" size={16} color="#15803d" />
                      </View>
                      <Text style={styles.pillText}>User Guides</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/super-orders' as never)}>
                      <View style={[styles.pillIconBg, { backgroundColor: '#eef2ff' }]}>
                        <Ionicons name="receipt" size={16} color="#4f46e5" />
                      </View>
                      <Text style={styles.pillText}>Sales Orders</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : activeActionTab === 'SETTINGS' ? (
              <View style={{ width: '100%', gap: 12, paddingVertical: 4 }}>
                <View style={{ backgroundColor: '#f0fdf4', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#bbf7d0', gap: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#059669', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="mic-outline" size={18} color="#ffffff" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' }}>
                          🎙️ Group Voice Call Feature
                        </Text>
                        <Text style={{ fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 }}>
                          Allow Advisors & Admins to host live audio conferences for active farmers
                        </Text>
                      </View>
                    </View>

                    <Switch
                      value={isGroupVoiceCallEnabled}
                      onValueChange={handleToggleGroupVoiceCall}
                      trackColor={{ false: '#cbd5e1', true: '#10b981' }}
                      thumbColor="#ffffff"
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#dcfce7' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: isGroupVoiceCallEnabled ? '#16a34a' : '#dc2626' }} />
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: isGroupVoiceCallEnabled ? '#15803d' : '#dc2626' }}>
                      {isGroupVoiceCallEnabled ? 'STATUS: ACTIVE (Group Call Enabled)' : 'STATUS: DISABLED (Group Call Disabled)'}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#dc2626',
                    paddingVertical: 10,
                    borderRadius: 10,
                    marginTop: 4,
                  }}
                  onPress={() => setShowCategoriesModal(true)}
                >
                  <Ionicons name="pricetags" size={16} color="#ffffff" />
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>
                    Manage Farm Expense Categories
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: '#0d9488',
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                  onPress={() => router.push('/(tabs)/super-settings' as never)}
                >
                  <Ionicons name="options" size={16} color="#ffffff" />
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' }}>
                    Open Full System Settings Console
                  </Text>
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
          <Text style={styles.quickActionsTitle}>Super Admin Shortcuts</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => router.push('/(tabs)/super-orders' as never)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#eef2ff' }]}>
                <Ionicons name="receipt" size={16} color="#4f46e5" />
              </View>
              <Text style={styles.pillText}>Sales Orders</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => setShowCategoriesModal(true)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#fef2f2' }]}>
                <Ionicons name="pricetags" size={16} color="#dc2626" />
              </View>
              <Text style={styles.pillText}>Categories</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickPill} activeOpacity={0.8} onPress={() => setShowWorkspaceModal(true)}>
              <View style={[styles.pillIconBg, { backgroundColor: '#ccfbf1' }]}>
                <Ionicons name="briefcase" size={16} color="#0d9488" />
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
      <AdminInfoModal visible={showAdminInfoModal} onClose={() => setShowAdminInfoModal(false)} />

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
  sectionCard: { backgroundColor: '#ffffff', borderRadius: 14, padding: 8, borderWidth: 1, borderColor: '#f1f5f9' },
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
});
