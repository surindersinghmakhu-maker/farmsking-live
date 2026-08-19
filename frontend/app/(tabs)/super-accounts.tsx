import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAllWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from '@/src/hooks/useWithdrawals';
import { WithdrawalRequest, WithdrawalStatus } from '@/src/types/api';
import { usePendingPlanPayments, useConfirmPlanPayment, useRejectPlanPayment } from '@/src/hooks/usePlanPayments';
import type { PlanPaymentRequest } from '@/src/api/planPayments.api';
import { usePendingFarmerPlanPayments, useConfirmFarmerPlanPayment, useRejectFarmerPlanPayment } from '@/src/hooks/useFarmerPlanPayments';
import type { FarmerPlanPaymentRequest } from '@/src/api/farmerPlanPayments.api';
import { useUsersList } from '@/src/hooks/useUsersAdmin';
import { useCreditWallet, useDebitWallet, useWalletForUser } from '@/src/hooks/useWallet';
import { AdminUser } from '@/src/types/api';

const theme = RoleThemes.SUPER_ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const STATUS_META: Record<WithdrawalStatus, { color: string; bg: string; label: string }> = {
  PENDING: { color: '#b45309', bg: '#fef3c7', label: 'Pending' },
  APPROVED: { color: '#15803d', bg: '#dcfce7', label: 'Approved' },
  REJECTED: { color: '#b91c1c', bg: '#fee2e2', label: 'Rejected' },
};

type SectionKey = 'REQUESTS' | 'PARTNERS' | 'SEARCH';

const SECTIONS: { value: SectionKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'REQUESTS', label: 'Requests', icon: 'time-outline' },
  { value: 'PARTNERS', label: 'Partner Wallets', icon: 'briefcase-outline' },
  { value: 'SEARCH', label: 'Find a User', icon: 'search-outline' },
];

function initials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')).toUpperCase() || name[0]?.toUpperCase() || '?';
}

function IdentityBadge({ name, sub, tint }: { name: string; sub?: string; tint?: string }) {
  return (
    <View style={styles.identityRow}>
      <View style={[styles.avatarCircle, tint ? { backgroundColor: tint } : null]}>
        <Text style={styles.avatarInitials}>{initials(name)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.partnerName} numberOfLines={1}>{name}</Text>
        {sub ? <Text style={styles.requestDate} numberOfLines={1}>{sub}</Text> : null}
      </View>
    </View>
  );
}

export default function SuperAccountsScreen() {
  const { data: withdrawals, isLoading } = useAllWithdrawals();
  const { data: planPayments, isLoading: isLoadingPlanPayments } = usePendingPlanPayments();
  const { data: farmerPlanPayments, isLoading: isLoadingFarmerPlanPayments } = usePendingFarmerPlanPayments();
  const [activeRequest, setActiveRequest] = useState<WithdrawalRequest | null>(null);
  const [activePlanPayment, setActivePlanPayment] = useState<PlanPaymentRequest | null>(null);
  const [activeFarmerPlanPayment, setActiveFarmerPlanPayment] = useState<FarmerPlanPaymentRequest | null>(null);
  const [walletPartner, setWalletPartner] = useState<AdminUser | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [section, setSection] = useState<SectionKey>('REQUESTS');

  const pending = (withdrawals ?? []).filter((w) => w.status === 'PENDING');
  const processed = (withdrawals ?? []).filter((w) => w.status !== 'PENDING');

  const { data: partnersData, isLoading: isLoadingPartners } = useUsersList({ role: 'BUSINESS_PARTNER', limit: 100 });
  const { data: searchResults, isLoading: isSearching } = useUsersList({ search: userSearch.trim() || undefined, limit: 20 });

  const pendingPlanPayments = planPayments ?? [];
  const pendingFarmerPlanPayments = farmerPlanPayments ?? [];
  const totalPendingRequests = pending.length + pendingPlanPayments.length + pendingFarmerPlanPayments.length;
  const pendingPayout = pending.reduce((sum, w) => sum + Number(w.requestedAmount), 0);
  const pendingRevenue =
    pendingPlanPayments.reduce((sum, p) => sum + Number(p.amount), 0) +
    pendingFarmerPlanPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  const isLoadingAnyRequests = isLoading || isLoadingPlanPayments || isLoadingFarmerPlanPayments;

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Partner Accounts</Text>
        <Text style={styles.heroSubtitle}>Review payouts, verify payments & manage partner wallets</Text>

        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <View style={styles.statTopRow}>
              <Text style={styles.statLabel}>Awaiting You</Text>
              {totalPendingRequests > 0 ? <View style={styles.liveDot} /> : null}
            </View>
            <Text style={styles.statValue}>{isLoadingAnyRequests ? '—' : totalPendingRequests}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Payout Requested</Text>
            <Text style={styles.statValue}>₹{pendingPayout.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Revenue to Verify</Text>
            <Text style={styles.statValue}>₹{pendingRevenue.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <View style={styles.sectionTabRow}>
          {SECTIONS.map((s) => {
            const badgeCount = s.value === 'REQUESTS' ? totalPendingRequests : undefined;
            const active = section === s.value;
            return (
              <TouchableOpacity
                key={s.value}
                style={[styles.sectionTab, active && styles.sectionTabActive]}
                activeOpacity={0.85}
                onPress={() => { tap(); setSection(s.value); }}
              >
                <Ionicons name={s.icon} size={14} color={active ? theme.primary : '#fff'} />
                <Text style={[styles.sectionTabText, active && { color: theme.primary }]}>{s.label}</Text>
                {badgeCount ? (
                  <View style={[styles.tabBadge, active && { backgroundColor: theme.primary }]}>
                    <Text style={[styles.tabBadgeText, active && { color: '#fff' }]}>{badgeCount}</Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {section === 'SEARCH' ? (
          <>
            <View style={styles.searchWrap}>
              <Ionicons name="search" size={16} color="#94a3b8" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search any user by name or mobile..."
                placeholderTextColor="#94a3b8"
                value={userSearch}
                onChangeText={setUserSearch}
              />
            </View>
            {!userSearch.trim() ? (
              <EmptyState icon="search-outline" text="Search across every role to open their wallet ledger." />
            ) : isSearching ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
            ) : (searchResults?.items ?? []).length === 0 ? (
              <EmptyState icon="person-remove-outline" text="No users found." />
            ) : (
              <View style={{ gap: 8 }}>
                {(searchResults?.items ?? []).map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    style={[styles.card, premiumShadow('#0f172a', 'sm')]}
                    activeOpacity={0.85}
                    onPress={() => { tap(); setWalletPartner(u); }}
                  >
                    <IdentityBadge name={u.name} sub={`${u.role.replace('_', ' ')} · 📱 ${u.mobile}${u.kingId ? ` · 🔑 ${u.kingId}` : ''}`} />
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </>
        ) : null}

        {section === 'PARTNERS' ? (
          isLoadingPartners ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
          ) : (partnersData?.items ?? []).length === 0 ? (
            <EmptyState icon="briefcase-outline" text="No business partners yet." />
          ) : (
            <View style={{ gap: 8 }}>
              {(partnersData?.items ?? []).map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.card, premiumShadow('#0f172a', 'sm')]}
                  activeOpacity={0.85}
                  onPress={() => { tap(); setWalletPartner(p); }}
                >
                  <IdentityBadge name={p.name} sub={`📱 ${p.mobile}${p.kingId ? ` · 🔑 ${p.kingId}` : ''}`} />
                  <View style={styles.ledgerBtn}>
                    <Ionicons name="wallet-outline" size={13} color={theme.primary} />
                    <Text style={styles.ledgerBtnText}>Ledger</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )
        ) : null}

        {section === 'REQUESTS' ? (
          <>
            <SectionHeader
              title="Farmer Plan Upgrades"
              count={pendingFarmerPlanPayments.length}
              subtitle="Awaiting UPI verification"
            />
            {isLoadingFarmerPlanPayments ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 4, marginBottom: 12 }} />
            ) : pendingFarmerPlanPayments.length === 0 ? (
              <EmptyState icon="checkmark-done-outline" text="No upgrade claims to verify." compact />
            ) : (
              <View style={{ gap: 8, marginBottom: 18 }}>
                {pendingFarmerPlanPayments.map((p) => (
                  <FarmerPlanPaymentCard key={p.id} request={p} onReview={() => setActiveFarmerPlanPayment(p)} />
                ))}
              </View>
            )}

            <SectionHeader
              title="Plan Payments"
              count={pendingPlanPayments.length}
              subtitle="Awaiting UPI verification"
            />
            {isLoadingPlanPayments ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 4, marginBottom: 12 }} />
            ) : pendingPlanPayments.length === 0 ? (
              <EmptyState icon="checkmark-done-outline" text="No UPI payment claims to verify." compact />
            ) : (
              <View style={{ gap: 8, marginBottom: 18 }}>
                {pendingPlanPayments.map((p) => (
                  <PlanPaymentCard key={p.id} request={p} onReview={() => setActivePlanPayment(p)} />
                ))}
              </View>
            )}

            <SectionHeader
              title="Withdrawals"
              count={pending.length}
              subtitle="Pending payout to partner"
            />
            {isLoading ? (
              <ActivityIndicator color={theme.primary} style={{ marginTop: 4, marginBottom: 12 }} />
            ) : pending.length === 0 ? (
              <EmptyState icon="checkmark-done-outline" text="No pending withdrawal requests." compact />
            ) : (
              <View style={{ gap: 8, marginBottom: 18 }}>
                {pending.map((w) => <WithdrawalCard key={w.id} request={w} onReview={() => setActiveRequest(w)} />)}
              </View>
            )}

            {processed.length > 0 ? (
              <>
                <SectionHeader title="History" count={processed.length} subtitle="Resolved withdrawals" />
                <View style={{ gap: 8 }}>
                  {processed.map((w) => <WithdrawalCard key={w.id} request={w} />)}
                </View>
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>

      <ReviewModal request={activeRequest} onClose={() => setActiveRequest(null)} />
      <PlanPaymentReviewModal request={activePlanPayment} onClose={() => setActivePlanPayment(null)} />
      <FarmerPlanPaymentReviewModal request={activeFarmerPlanPayment} onClose={() => setActiveFarmerPlanPayment(null)} />
      <PartnerWalletModal partner={walletPartner} onClose={() => setWalletPartner(null)} />
    </View>
  );
}

function SectionHeader({ title, count, subtitle }: { title: string; count: number; subtitle: string }) {
  return (
    <View style={styles.sectionHeaderRow}>
      <View>
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {count > 0 ? (
            <View style={styles.countPill}>
              <Text style={styles.countPillText}>{count}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

function EmptyState({ icon, text, compact }: { icon: keyof typeof Ionicons.glyphMap; text: string; compact?: boolean }) {
  return (
    <View style={[styles.emptyState, compact && { paddingVertical: 16, marginBottom: 18 }]}>
      <Ionicons name={icon} size={compact ? 20 : 28} color="#cbd5e1" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

function PartnerWalletModal({ partner, onClose }: { partner: AdminUser | null; onClose: () => void }) {
  const { data: wallet, isLoading } = useWalletForUser(partner?.id);
  const creditWallet = useCreditWallet();
  const debitWallet = useDebitWallet();
  const [balanceMode, setBalanceMode] = useState<'CREDIT' | 'DEBIT' | null>(null);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const closeAddBalance = () => {
    setBalanceMode(null);
    setAmount('');
    setReason('');
    setError(null);
  };

  const handleSubmitBalance = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    try {
      const mutation = balanceMode === 'CREDIT' ? creditWallet : debitWallet;
      await mutation.mutateAsync({ userId: partner!.id, amount: value, reason: reason.trim() || undefined });
      closeAddBalance();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not update balance.');
    }
  };
  const isSubmittingBalance = creditWallet.isPending || debitWallet.isPending;

  return (
    <Modal visible={!!partner} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <IdentityBadge name={partner?.name ?? ''} sub={`📱 ${partner?.mobile ?? ''}`} tint="#ecfdf5" />
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
          ) : (
            <>
              <View style={styles.balanceBox}>
                <Text style={styles.balanceLabel}>Current Balance</Text>
                <Text style={styles.balanceValue}>₹{Number(wallet?.balance ?? 0).toLocaleString('en-IN')}</Text>
              </View>

              {balanceMode ? (
                <View style={{ gap: 8, marginBottom: 8 }}>
                  <Text style={styles.label}>Amount (₹)</Text>
                  <TextInput style={styles.input} keyboardType="numeric" value={amount} onChangeText={setAmount} placeholder="e.g. 500" placeholderTextColor="#94a3b8" />
                  <Text style={styles.label}>Reason (optional)</Text>
                  <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="Cash top-up, correction, etc." placeholderTextColor="#94a3b8" />
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity style={styles.rejectBtn} onPress={closeAddBalance}>
                      <Text style={styles.rejectBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.approveBtn, balanceMode === 'DEBIT' && { backgroundColor: '#dc2626' }]}
                      disabled={isSubmittingBalance}
                      onPress={handleSubmitBalance}
                    >
                      {isSubmittingBalance ? (
                        <ActivityIndicator color="#ffffff" />
                      ) : (
                        <Text style={styles.approveBtnText}>{balanceMode === 'CREDIT' ? 'Add Balance' : 'Deduct Balance'}</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TouchableOpacity style={[styles.addBalanceBtn, { flex: 1, marginBottom: 0 }]} activeOpacity={0.85} onPress={() => { tap(); setBalanceMode('CREDIT'); }}>
                    <Ionicons name="add-circle-outline" size={16} color={theme.primary} />
                    <Text style={[styles.addBalanceBtnText, { color: theme.primary }]}>Add Balance</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.addBalanceBtn, { flex: 1, marginBottom: 0, borderColor: '#dc2626' }]}
                    activeOpacity={0.85}
                    onPress={() => { tap(); setBalanceMode('DEBIT'); }}
                  >
                    <Ionicons name="remove-circle-outline" size={16} color="#dc2626" />
                    <Text style={[styles.addBalanceBtnText, { color: '#dc2626' }]}>Deduct Balance</Text>
                  </TouchableOpacity>
                </View>
              )}

              <Text style={styles.ledgerHeading}>Transaction Ledger</Text>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {!wallet || wallet.transactions.length === 0 ? (
                  <Text style={styles.emptyText}>No transactions yet.</Text>
                ) : (
                  wallet.transactions.map((tx) => (
                    <View key={tx.id} style={styles.txRow}>
                      <View style={[styles.txIconBg, { backgroundColor: tx.type === 'CREDIT' ? '#dcfce7' : '#fee2e2' }]}>
                        <Ionicons name={tx.type === 'CREDIT' ? 'arrow-down' : 'arrow-up'} size={13} color={tx.type === 'CREDIT' ? '#15803d' : '#b91c1c'} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.txReason} numberOfLines={2}>{tx.reason}</Text>
                        <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleString('en-IN')}</Text>
                      </View>
                      <Text style={[styles.txAmount, { color: tx.type === 'CREDIT' ? '#15803d' : '#b91c1c' }]}>
                        {tx.type === 'CREDIT' ? '+' : '-'}₹{Number(tx.amount).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

export function PlanPaymentCard({ request, onReview }: { request: PlanPaymentRequest; onReview: () => void }) {
  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <IdentityBadge
        name={request.farmer.name}
        sub={`${request.subscription.plan.name} · ${request.farmer.kingId ?? request.farmerId}`}
      />
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={styles.amount}>₹{Number(request.amount).toLocaleString('en-IN')}</Text>
        {request.utr ? <Text style={styles.utrChip} numberOfLines={1}>UTR {request.utr}</Text> : null}
        <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.85} onPress={onReview}>
          <Text style={styles.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function PlanPaymentReviewModal({ request, onClose }: { request: PlanPaymentRequest | null; onClose: () => void }) {
  const confirm = useConfirmPlanPayment();
  const reject = useRejectPlanPayment();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (request) {
      setReason('');
      setError(null);
    }
  }, [request]);

  if (!request) return null;

  const handleConfirm = async () => {
    try {
      await confirm.mutateAsync(request.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not confirm this payment.');
    }
  };

  const handleReject = async () => {
    tap();
    await reject.mutateAsync({ id: request.id, reason: reason.trim() || undefined });
    onClose();
  };

  return (
    <Modal visible={!!request} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Verify UPI Payment</Text>
              <Text style={styles.modalSub}>{request.farmer.name} · {request.farmer.kingId ?? request.farmerId}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>₹{Number(request.amount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{request.subscription.plan.name}</Text>
            </View>
            {request.utr ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>UTR / Reference</Text>
                <Text style={styles.summaryValue}>{request.utr}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.hintText}>Check your UPI/bank passbook for this amount and the farmer's ID as remark before confirming.</Text>

          <Text style={styles.label}>Rejection reason (optional)</Text>
          <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="No matching transaction found, etc." placeholderTextColor="#94a3b8" />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={styles.rejectBtn} disabled={reject.isPending} onPress={handleReject}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} disabled={confirm.isPending} onPress={handleConfirm}>
              {confirm.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveBtnText}>Confirm Payment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function FarmerPlanPaymentCard({ request, onReview }: { request: FarmerPlanPaymentRequest; onReview: () => void }) {
  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <IdentityBadge
        name={request.farmer.name}
        sub={`Upgrade to ${request.targetPlan} · ${request.farmer.kingId ?? request.farmerId}`}
      />
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={styles.amount}>₹{Number(request.amount).toLocaleString('en-IN')}</Text>
        {request.utr ? <Text style={styles.utrChip} numberOfLines={1}>UTR {request.utr}</Text> : null}
        <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.85} onPress={onReview}>
          <Text style={styles.reviewBtnText}>Review</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function FarmerPlanPaymentReviewModal({ request, onClose }: { request: FarmerPlanPaymentRequest | null; onClose: () => void }) {
  const confirm = useConfirmFarmerPlanPayment();
  const reject = useRejectFarmerPlanPayment();
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (request) {
      setReason('');
      setError(null);
    }
  }, [request]);

  if (!request) return null;

  const handleConfirm = async () => {
    try {
      await confirm.mutateAsync(request.id);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not confirm this payment.');
    }
  };

  const handleReject = async () => {
    tap();
    await reject.mutateAsync({ id: request.id, reason: reason.trim() || undefined });
    onClose();
  };

  return (
    <Modal visible={!!request} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Verify Plan Upgrade Payment</Text>
              <Text style={styles.modalSub}>{request.farmer.name} · {request.farmer.kingId ?? request.farmerId}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Amount</Text>
              <Text style={styles.summaryValue}>₹{Number(request.amount).toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Plan</Text>
              <Text style={styles.summaryValue}>{request.targetPlan}</Text>
            </View>
            {request.utr ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>UTR / Reference</Text>
                <Text style={styles.summaryValue}>{request.utr}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.hintText}>Check your UPI/bank passbook for this amount and the farmer's ID as remark before confirming.</Text>

          <Text style={styles.label}>Rejection reason (optional)</Text>
          <TextInput style={styles.input} value={reason} onChangeText={setReason} placeholder="No matching transaction found, etc." placeholderTextColor="#94a3b8" />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={styles.rejectBtn} disabled={reject.isPending} onPress={handleReject}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} disabled={confirm.isPending} onPress={handleConfirm}>
              {confirm.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveBtnText}>Confirm Payment</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function WithdrawalCard({ request, onReview }: { request: WithdrawalRequest; onReview?: () => void }) {
  const meta = STATUS_META[request.status];

  return (
    <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
      <IdentityBadge
        name={request.businessPartner?.name ?? 'Business Partner'}
        sub={new Date(request.requestedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
      />
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={styles.amount}>₹{Number(request.requestedAmount).toLocaleString('en-IN')}</Text>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: meta.color }]} />
          <Text style={[styles.statusBadgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
        {request.status !== 'PENDING' && request.approvedAmount ? (
          <Text style={styles.approvedNote}>Paid ₹{Number(request.approvedAmount).toLocaleString('en-IN')}</Text>
        ) : null}
        {onReview ? (
          <TouchableOpacity style={styles.reviewBtn} activeOpacity={0.85} onPress={onReview}>
            <Text style={styles.reviewBtnText}>Review</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

export function ReviewModal({ request, onClose }: { request: WithdrawalRequest | null; onClose: () => void }) {
  const approve = useApproveWithdrawal();
  const reject = useRejectWithdrawal();
  const [approvedAmount, setApprovedAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (request) {
      setApprovedAmount(request.requestedAmount);
      setNotes('');
      setError(null);
    }
  }, [request]);

  if (!request) return null;

  const handleApprove = async () => {
    const amount = Number(approvedAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid payout amount.');
      return;
    }
    try {
      await approve.mutateAsync({ id: request.id, approvedAmount: amount, notes: notes.trim() || undefined });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not approve this request.');
    }
  };

  const handleReject = async () => {
    tap();
    await reject.mutateAsync({ id: request.id, notes: notes.trim() || undefined });
    onClose();
  };

  return (
    <Modal visible={!!request} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>Review Withdrawal</Text>
              <Text style={styles.modalSub}>{request.businessPartner?.name}</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Requested</Text>
              <Text style={styles.summaryValue}>₹{Number(request.requestedAmount).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <Text style={styles.label}>Payout Amount (editable)</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={approvedAmount}
            onChangeText={setApprovedAmount}
          />

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput style={styles.input} value={notes} onChangeText={setNotes} placeholder="Payment reference, reason for rejection, etc." placeholderTextColor="#94a3b8" />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={styles.rejectBtn} disabled={reject.isPending} onPress={handleReject}>
              <Text style={styles.rejectBtnText}>Reject</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.approveBtn} disabled={approve.isPending} onPress={handleApprove}>
              {approve.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.approveBtnText}>Approve Payout</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },

  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 12,
    marginTop: 16,
  },
  statCard: { flex: 1, alignItems: 'center', gap: 4 },
  statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.2)' },
  statTopRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 10.5, fontFamily: FONT.bold, textTransform: 'uppercase', letterSpacing: 0.3 },
  statValue: { color: '#fff', fontSize: 18, fontFamily: FONT.extraBold, letterSpacing: -0.3 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },

  sectionTabRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  sectionTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sectionTabActive: { backgroundColor: '#ffffff' },
  sectionTabText: { color: '#fff', fontSize: 11.5, fontFamily: FONT.bold },
  tabBadge: { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  tabBadgeText: { color: '#fff', fontSize: 9.5, fontFamily: FONT.extraBold },

  list: { padding: SPACING.lg, paddingBottom: SPACING.xxl },

  sectionHeaderRow: { marginBottom: 10, marginTop: 2 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  sectionTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  sectionSubtitle: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  countPill: { backgroundColor: theme.primaryLight, borderRadius: RADIUS.pill, paddingHorizontal: 7, paddingVertical: 1.5 },
  countPillText: { fontSize: 10.5, fontFamily: FONT.extraBold, color: theme.primary },

  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 36, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#f1f5f9', borderStyle: 'dashed' },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },

  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 10 },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatarCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 12.5, fontFamily: FONT.extraBold, color: theme.primary },
  partnerName: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  requestDate: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  approvedNote: { fontSize: 10.5, fontFamily: FONT.semiBold, color: '#15803d' },
  amount: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  utrChip: { fontSize: 9.5, fontFamily: FONT.semiBold, color: '#64748b', maxWidth: 130 },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  statusDot: { width: 5, height: 5, borderRadius: 2.5 },
  statusBadgeText: { fontSize: 10, fontFamily: FONT.bold },

  reviewBtn: { backgroundColor: theme.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill },
  reviewBtnText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.bold },
  ledgerBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.primaryLight, paddingHorizontal: 11, paddingVertical: 7, borderRadius: RADIUS.pill },
  ledgerBtnText: { color: theme.primary, fontSize: 11, fontFamily: FONT.bold },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, gap: 4, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary, marginTop: 2 },

  summaryBox: { backgroundColor: '#f8fafc', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, gap: 7, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  summaryLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.2 },
  summaryValue: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  hintText: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginBottom: 6, lineHeight: 15 },

  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginTop: 6, marginBottom: 4 },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12, marginTop: 6 },
  rejectBtn: { flex: 1, backgroundColor: '#fee2e2', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center' },
  rejectBtnText: { color: '#dc2626', fontFamily: FONT.bold, fontSize: 13.5 },
  approveBtn: { flex: 1, backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center' },
  approveBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },

  balanceBox: { backgroundColor: '#f0fdf4', borderRadius: RADIUS.lg, padding: SPACING.md, alignItems: 'center', marginVertical: 8, borderWidth: 1, borderColor: '#bbf7d0' },
  balanceLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.3 },
  balanceValue: { fontSize: 26, fontFamily: FONT.extraBold, color: '#15803d', marginTop: 3 },
  addBalanceBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 10, marginBottom: 8 },
  addBalanceBtnText: { fontSize: 13, fontFamily: FONT.bold },

  ledgerHeading: { fontSize: 11.5, fontFamily: FONT.extraBold, color: '#334155', textTransform: 'uppercase', letterSpacing: 0.3, marginTop: 6, marginBottom: 4 },

  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: RADIUS.md, borderWidth: 1.5, borderColor: '#e2e8f0', paddingHorizontal: 12, paddingVertical: 4, marginBottom: 12 },
  searchInput: { flex: 1, paddingVertical: 10, fontSize: 13, fontFamily: FONT.medium, color: '#0f172a' },

  txRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txIconBg: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  txReason: { fontSize: 12.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  txDate: { fontSize: 10.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  txAmount: { fontSize: 13.5, fontFamily: FONT.extraBold },
});
