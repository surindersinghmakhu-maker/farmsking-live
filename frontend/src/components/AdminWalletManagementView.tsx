import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { AdminBonusReportResponse, AdminUserWalletItem, creditWallet, debitWallet, getAdminAllWallets, getAdminBonusReport, getWalletForUser } from '@/src/api/wallet.api';
import { MyWallet, WalletTransaction } from '@/src/types/api';

export function AdminWalletManagementView() {
  const [activeTab, setActiveTab] = useState<'ALL_USERS' | 'BONUS_REPORT'>('ALL_USERS');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [users, setUsers] = useState<AdminUserWalletItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [bonusReport, setBonusReport] = useState<AdminBonusReportResponse | null>(null);

  // User detail ledger modal state
  const [selectedUser, setSelectedUser] = useState<AdminUserWalletItem | null>(null);
  const [userLedger, setUserLedger] = useState<MyWallet | null>(null);
  const [isLedgerLoading, setIsLedgerLoading] = useState(false);

  // Credit / Debit action modal
  const [actionTarget, setActionTarget] = useState<{ user: AdminUserWalletItem; type: 'CREDIT' | 'DEBIT' } | null>(null);
  const [actionAmount, setActionAmount] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [isActionPending, setIsActionPending] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [search, roleFilter, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'ALL_USERS') {
        const res = await getAdminAllWallets({ search: search.trim() || undefined, role: roleFilter !== 'ALL' ? roleFilter : undefined, limit: 100 });
        setUsers(res.items || []);
        setTotalCount(res.total || 0);
      } else {
        const res = await getAdminBonusReport();
        setBonusReport(res);
      }
    } catch {
      // Best effort
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenUserLedger = async (userItem: AdminUserWalletItem) => {
    setSelectedUser(userItem);
    setIsLedgerLoading(true);
    try {
      const data = await getWalletForUser(userItem.id);
      setUserLedger(data);
    } catch {
      // Best effort
    } finally {
      setIsLedgerLoading(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!actionTarget) return;
    const numAmt = Number(actionAmount);
    if (!numAmt || numAmt <= 0) {
      setActionError('Please enter a valid amount.');
      return;
    }
    setIsActionPending(true);
    setActionError(null);
    try {
      if (actionTarget.type === 'CREDIT') {
        await creditWallet(actionTarget.user.id, numAmt, actionReason || 'Admin Manual Credit');
      } else {
        await debitWallet(actionTarget.user.id, numAmt, actionReason || 'Admin Manual Deduction');
      }
      alert(`✅ Successfully ${actionTarget.type === 'CREDIT' ? 'credited' : 'debited'} ₹${numAmt} for ${actionTarget.user.name}`);
      setActionTarget(null);
      setActionAmount('');
      setActionReason('');
      loadData();
    } catch (err: any) {
      setActionError(err?.response?.data?.message || 'Transaction failed');
    } finally {
      setIsActionPending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Sub-Nav Bar */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ALL_USERS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ALL_USERS')}
        >
          <Ionicons name="people" size={15} color={activeTab === 'ALL_USERS' ? '#15803d' : '#64748b'} />
          <Text style={[styles.tabBtnText, activeTab === 'ALL_USERS' && styles.tabBtnTextActive]}>
            All User Wallets ({totalCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'BONUS_REPORT' && styles.tabBtnActive]}
          onPress={() => setActiveTab('BONUS_REPORT')}
        >
          <Ionicons name="stats-chart" size={15} color={activeTab === 'BONUS_REPORT' ? '#15803d' : '#64748b'} />
          <Text style={[styles.tabBtnText, activeTab === 'BONUS_REPORT' && styles.tabBtnTextActive]}>
            Bonus Audit Report
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'ALL_USERS' ? (
        <View style={{ gap: 10 }}>
          {/* Search & Role Filter Row */}
          <View style={styles.filterRow}>
            <View style={styles.searchBox}>
              <Ionicons name="search" size={16} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search user by name, mobile or King ID..."
                placeholderTextColor="#94a3b8"
                value={search}
                onChangeText={setSearch}
              />
            </View>
          </View>

          {/* Role Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {['ALL', 'FARMER', 'TECHNICAL_TRAINER', 'BUSINESS_PARTNER', 'ADVISOR', 'CUSTOMER', 'ADMIN'].map((r) => (
              <TouchableOpacity
                key={r}
                style={[styles.chip, roleFilter === r && styles.chipActive]}
                onPress={() => setRoleFilter(r)}
              >
                <Text style={[styles.chipText, roleFilter === r && styles.chipTextActive]}>
                  {r === 'ALL' ? 'All Roles' : r}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Users List */}
          {isLoading ? (
            <ActivityIndicator color="#15803d" size="large" style={{ marginTop: 20 }} />
          ) : users.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="wallet-outline" size={36} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No Wallets Found</Text>
              <Text style={styles.emptySub}>No users match the search filter.</Text>
            </View>
          ) : (
            users.map((u) => (
              <View key={u.id} style={[styles.userCard, premiumShadow('#0f172a', 'sm')]}>
                <View style={styles.userCardHeader}>
                  <View style={styles.avatarBg}>
                    <Text style={styles.avatarText}>{u.name ? u.name[0].toUpperCase() : 'U'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{u.name || 'User'}</Text>
                    <Text style={styles.userMeta}>📱 {u.mobile} {u.kingId ? `• 🔑 ${u.kingId}` : ''}</Text>
                    <Text style={styles.userRoleTag}>Role: {u.role}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.balanceText}>₹{u.balance.toFixed(2)}</Text>
                    {u.pendingWithdrawal > 0 ? (
                      <Text style={styles.pendingBadge}>⏳ ₹{u.pendingWithdrawal} Pending</Text>
                    ) : null}
                  </View>
                </View>

                {/* Account details */}
                {(u.upiId || u.bankAccountNumber) ? (
                  <View style={styles.payoutInfoBox}>
                    <Text style={styles.payoutInfoText}>
                      💳 UPI: {u.upiId || 'N/A'} | Bank: {u.bankAccountNumber ? `${u.bankAccountNumber} (${u.bankIfsc})` : 'N/A'}
                    </Text>
                  </View>
                ) : null}

                {/* Actions */}
                <View style={styles.userActionsRow}>
                  <TouchableOpacity
                    style={styles.ledgerBtn}
                    onPress={() => handleOpenUserLedger(u)}
                  >
                    <Ionicons name="receipt-outline" size={14} color="#0f172a" />
                    <Text style={styles.ledgerBtnText}>View Ledger</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.creditBtn}
                    onPress={() => setActionTarget({ user: u, type: 'CREDIT' })}
                  >
                    <Ionicons name="add-circle" size={14} color="#ffffff" />
                    <Text style={styles.actionBtnText}>+ Credit</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.debitBtn}
                    onPress={() => setActionTarget({ user: u, type: 'DEBIT' })}
                  >
                    <Ionicons name="remove-circle" size={14} color="#ffffff" />
                    <Text style={styles.actionBtnText}>- Deduct</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      ) : (
        /* Bonus Report Tab */
        <View style={{ gap: 10 }}>
          {isLoading ? (
            <ActivityIndicator color="#15803d" size="large" style={{ marginTop: 20 }} />
          ) : bonusReport ? (
            <>
              <View style={styles.summaryGrid}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>₹{bonusReport.summary.totalBonusIssued}</Text>
                  <Text style={styles.summaryLab}>Total Bonus Issued</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>₹{bonusReport.summary.totalWalletLiability}</Text>
                  <Text style={styles.summaryLab}>Total System Liability</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>₹{bonusReport.summary.totalWelcome}</Text>
                  <Text style={styles.summaryLab}>Welcome Signup Bonus</Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryVal}>₹{bonusReport.summary.totalReferralSignup}</Text>
                  <Text style={styles.summaryLab}>Referral Signup Bonus</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Recent Bonus Ledgers ({bonusReport.transactions.length})</Text>

              {bonusReport.transactions.map((tx) => (
                <View key={tx.id} style={styles.txRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.txUser}>{tx.user?.name || tx.user?.mobile}</Text>
                    <Text style={styles.txReason}>{tx.reason}</Text>
                    <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleDateString()}</Text>
                  </View>
                  <Text style={styles.txAmount}>+₹{tx.amount}</Text>
                </View>
              ))}
            </>
          ) : null}
        </View>
      )}

      {/* User Ledger Modal */}
      <Modal visible={!!selectedUser} transparent animationType="slide" onRequestClose={() => setSelectedUser(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedUser?.name}'s Wallet Ledger</Text>
                <Text style={styles.modalSub}>Mobile: {selectedUser?.mobile} • Balance: ₹{userLedger?.balance.toFixed(2) || '0.00'}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedUser(null)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {isLedgerLoading ? (
              <ActivityIndicator color="#15803d" size="large" style={{ marginVertical: 30 }} />
            ) : (
              <ScrollView contentContainerStyle={{ gap: 8 }}>
                {userLedger?.transactions.map((tx: WalletTransaction) => (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.txReason}>{tx.reason}</Text>
                      <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleString()}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: tx.type === 'CREDIT' ? '#15803d' : '#dc2626' }]}>
                      {tx.type === 'CREDIT' ? '+' : '-'}₹{tx.amount}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Credit / Debit Action Modal */}
      <Modal visible={!!actionTarget} transparent animationType="fade" onRequestClose={() => setActionTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 400 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionTarget?.type === 'CREDIT' ? '➕ Credit Balance' : '➖ Deduct Balance'}
              </Text>
              <TouchableOpacity onPress={() => setActionTarget(null)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSub}>
              User: <Text style={{ fontFamily: FONT.bold }}>{actionTarget?.user.name}</Text> ({actionTarget?.user.mobile})
            </Text>

            <View style={{ gap: 10, marginTop: 10 }}>
              <Text style={styles.inputLabel}>Amount (₹)</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter amount (e.g. 100)"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                value={actionAmount}
                onChangeText={setActionAmount}
              />

              <Text style={styles.inputLabel}>Reason / Reference Note</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Good performance bonus / Adjustment"
                placeholderTextColor="#94a3b8"
                value={actionReason}
                onChangeText={setActionReason}
              />

              {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}

              <TouchableOpacity
                style={[styles.actionSubmitBtn, { backgroundColor: actionTarget?.type === 'CREDIT' ? '#15803d' : '#dc2626' }]}
                disabled={isActionPending}
                onPress={handleExecuteAction}
              >
                {isActionPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.actionSubmitBtnText}>
                    Confirm {actionTarget?.type === 'CREDIT' ? 'Credit' : 'Deduction'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  tabNav: { flexDirection: 'row', backgroundColor: '#e2e8f0', borderRadius: RADIUS.pill, padding: 3, gap: 4 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: RADIUS.pill },
  tabBtnActive: { backgroundColor: '#ffffff' },
  tabBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  tabBtnTextActive: { color: '#15803d' },
  filterRow: { flexDirection: 'row', gap: 8 },
  searchBox: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#ffffff', borderRadius: RADIUS.md, paddingHorizontal: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  searchInput: { flex: 1, height: 40, fontSize: 13, fontFamily: FONT.medium, color: '#0f172a' },
  chip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill, backgroundColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#15803d' },
  chipText: { fontSize: 11, fontFamily: FONT.bold, color: '#475569' },
  chipTextActive: { color: '#ffffff' },
  emptyCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#334155' },
  emptySub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  userCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  userCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  avatarBg: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 15, fontFamily: FONT.extraBold, color: '#15803d' },
  userName: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  userMeta: { fontSize: 11.5, fontFamily: FONT.medium, color: '#475569', marginTop: 1 },
  userRoleTag: { fontSize: 10.5, fontFamily: FONT.bold, color: '#64748b', marginTop: 1 },
  balanceText: { fontSize: 17, fontFamily: FONT.extraBold, color: '#15803d' },
  pendingBadge: { fontSize: 10, fontFamily: FONT.bold, color: '#d97706', backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.pill, marginTop: 2 },
  payoutInfoBox: { backgroundColor: '#f8fafc', padding: 6, borderRadius: RADIUS.sm },
  payoutInfoText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#475569' },
  userActionsRow: { flexDirection: 'row', gap: 6, marginTop: 2 },
  ledgerBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#f1f5f9', paddingVertical: 6, borderRadius: RADIUS.md },
  ledgerBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' },
  creditBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#15803d', paddingVertical: 6, borderRadius: RADIUS.md },
  debitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: '#dc2626', paddingVertical: 6, borderRadius: RADIUS.md },
  actionBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  summaryCard: { flex: 1, minWidth: 140, backgroundColor: '#ffffff', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  summaryVal: { fontSize: 16, fontFamily: FONT.extraBold, color: '#15803d' },
  summaryLab: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2, textAlign: 'center' },
  sectionTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#f1f5f9' },
  txUser: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  txReason: { fontSize: 11.5, fontFamily: FONT.medium, color: '#475569' },
  txDate: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8' },
  txAmount: { fontSize: 14, fontFamily: FONT.extraBold, color: '#15803d' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.md },
  modalCard: { width: '100%', maxWidth: 500, maxHeight: '80%', backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.md, gap: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', paddingBottom: 8 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  inputLabel: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  errorText: { fontSize: 12, fontFamily: FONT.bold, color: '#dc2626' },
  actionSubmitBtn: { borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center', marginTop: 4 },
  actionSubmitBtnText: { fontSize: 13, fontFamily: FONT.bold, color: '#ffffff' },
});
