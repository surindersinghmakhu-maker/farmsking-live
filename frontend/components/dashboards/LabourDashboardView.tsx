import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { Avatar } from '@/src/components/Avatar';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useLabourDashboard } from '@/src/hooks/useLabour';
import { formatInr } from '@/src/utils/formatInr';

export const LabourDashboardView: React.FC = () => {
  const theme = RoleThemes.LABOUR;
  const { user } = useAuth();
  const { data, isLoading } = useLabourDashboard();

  // View modes: DOUBLE_ENTRY (T-Ledger Debit/Credit format) vs ITEMIZED (Tabbed lists)
  const [viewMode, setViewMode] = useState<'DOUBLE_ENTRY' | 'ITEMIZED'>('DOUBLE_ENTRY');
  const [activeTab, setActiveTab] = useState<'WORK' | 'PAYMENTS'>('WORK');
  const [visibleLedgerCount, setVisibleLedgerCount] = useState(10);

  const router = useRouter();

  const summary = data?.summary || { totalEarned: 0, totalPaid: 0, pendingBalance: 0 };
  const worker = data?.worker;
  const farmer = worker?.farmer;
  const workEntries = data?.workEntries || [];
  const payments = data?.payments || [];

  // Compute Double Entry Ledger Timeline with Running Balance
  const doubleEntryLedger = useMemo(() => {
    const combined = [
      ...workEntries.map((w) => ({
        id: w.id,
        type: 'WORK' as const,
        date: w.workDate,
        particulars: `${w.workType} (${w.quantity} ${w.unit} @ ₹${w.rate})`,
        credit: Number(w.totalAmount),
        debit: 0,
        notes: w.notes,
      })),
      ...payments.map((p) => ({
        id: p.id,
        type: 'PAYMENT' as const,
        date: p.paymentDate,
        particulars: `Payment Received (${p.paymentMode || 'CASH'})`,
        credit: 0,
        debit: Number(p.amount),
        notes: p.notes,
      })),
    ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let running = 0;
    const calculated = combined.map((item) => {
      running += item.credit - item.debit;
      return {
        ...item,
        runningBalance: running,
      };
    });

    // Datewise descending order (latest date first)
    return calculated.reverse();
  }, [workEntries, payments]);

  const callFarmer = () => {
    if (farmer?.mobile) {
      Linking.openURL(`tel:${farmer.mobile}`);
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="LABOUR"
        profileName={user?.name || worker?.name || 'Labourer'}
        subtitle="Labour Worker Account"
        avatarUrl={user?.photoUrl || undefined}
      />



      <View style={styles.content}>
        {/* 1. Employer / Farmer Profile Banner - Prominent at TOP */}
        {farmer ? (
          <View style={[styles.farmerTopCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {/* Farmer Profile Picture */}
              <Avatar uri={farmer.photoUrl} size={48} />

              {/* Farmer Info */}
              <View style={{ flex: 1 }}>
                <Text style={styles.farmerLabel}>Employer / Farmer</Text>
                <Text style={styles.farmerName}>{farmer.name}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 3 }}>
                  {farmer.mobile ? (
                    <Text style={styles.farmerMetaText}>📱 {farmer.mobile}</Text>
                  ) : null}
                  {farmer.village ? (
                    <Text style={styles.farmerMetaText}>📍 {farmer.village}</Text>
                  ) : null}
                </View>
              </View>

              {/* Call Farmer Button */}
              {farmer.mobile ? (
                <TouchableOpacity style={styles.callBtn} activeOpacity={0.8} onPress={callFarmer}>
                  <Ionicons name="call" size={16} color="#ffffff" />
                  <Text style={styles.callBtnText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* 2. Top Balance Card - Ultra Compact & Vividly Highlighted */}
        <View
          style={[
            {
              backgroundColor: '#ffffff',
              borderRadius: RADIUS.lg,
              padding: 10,
              borderWidth: 1.5,
              borderColor: summary.pendingBalance > 0 ? '#ffedd5' : '#dcfce7',
            },
            premiumShadow('#ea580c', 'sm'),
          ]}
        >
          {/* Highlight Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  backgroundColor: summary.pendingBalance > 0 ? '#fff7ed' : '#f0fdf4',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons
                  name="wallet-outline"
                  size={15}
                  color={summary.pendingBalance > 0 ? '#c2410c' : '#166534'}
                />
              </View>
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#334155' }}>
                Total Balance:
              </Text>
            </View>

            {/* Highlighted Vivid Pill */}
            {isLoading ? (
              <ActivityIndicator color={theme.primary} size="small" />
            ) : (
              <View
                style={{
                  backgroundColor: summary.pendingBalance > 0 ? '#dc2626' : '#16a34a',
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: RADIUS.pill,
                }}
              >
                <Text style={{ fontSize: 14.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>
                  {formatInr(summary.pendingBalance)}
                </Text>
              </View>
            )}
          </View>

          {/* Compact 2-column metrics */}
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#fff7ed',
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: RADIUS.md,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#9a3412' }}>Total Earned</Text>
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#c2410c' }}>
                {formatInr(summary.totalEarned)}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                backgroundColor: '#f0fdf4',
                paddingHorizontal: 8,
                paddingVertical: 5,
                borderRadius: RADIUS.md,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#166534' }}>Received Payment</Text>
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#166534' }}>
                {formatInr(summary.totalPaid)}
              </Text>
            </View>
          </View>
        </View>

        {/* 3. View Mode Toggle: Double Entry vs Itemized */}
        <View style={styles.viewModeToggleRow}>
          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'DOUBLE_ENTRY' && styles.viewModeBtnActive]}
            activeOpacity={0.8}
            onPress={() => setViewMode('DOUBLE_ENTRY')}
          >
            <Ionicons
              name="book-outline"
              size={15}
              color={viewMode === 'DOUBLE_ENTRY' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.viewModeText, viewMode === 'DOUBLE_ENTRY' && styles.viewModeTextActive]}>
              Double Entry Ledger
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewModeBtn, viewMode === 'ITEMIZED' && styles.viewModeBtnActive]}
            activeOpacity={0.8}
            onPress={() => setViewMode('ITEMIZED')}
          >
            <Ionicons
              name="list-outline"
              size={15}
              color={viewMode === 'ITEMIZED' ? '#ffffff' : '#64748b'}
            />
            <Text style={[styles.viewModeText, viewMode === 'ITEMIZED' && styles.viewModeTextActive]}>
              Itemized List
            </Text>
          </TouchableOpacity>
        </View>

        {/* 4. Display Selected View Mode */}
        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 24 }} size="large" />
        ) : viewMode === 'DOUBLE_ENTRY' ? (
          /* DOUBLE ENTRY VIEW (T-LEDGER FORMAT) */
          <View style={styles.doubleEntryContainer}>
            <View style={styles.doubleEntryHeader}>
              <Text style={{ width: 56, fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>Date</Text>
              <Text style={{ flex: 1, fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>Particulars</Text>
              <Text style={{ width: 58, fontSize: 11, fontFamily: FONT.bold, color: '#c2410c', textAlign: 'right' }}>Credit (+)</Text>
              <Text style={{ width: 58, fontSize: 11, fontFamily: FONT.bold, color: '#166534', textAlign: 'right' }}>Debit (-)</Text>
              <Text style={{ width: 64, fontSize: 11, fontFamily: FONT.bold, color: '#0f172a', textAlign: 'right' }}>Balance</Text>
            </View>

            {doubleEntryLedger.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="book-outline" size={36} color="#cbd5e1" />
                <Text style={styles.emptyText}>No ledger entries found.</Text>
              </View>
            ) : (
              <>
                {doubleEntryLedger.slice(0, visibleLedgerCount).map((row) => (
                  <View key={row.id} style={styles.doubleEntryRow}>
                    {/* Left Column: Date */}
                    <Text style={{ width: 56, fontSize: 11, fontFamily: FONT.bold, color: '#64748b' }}>
                      {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>

                    {/* Middle Column: Particulars */}
                    <View style={{ flex: 1, paddingRight: 4 }}>
                      <Text style={styles.rowParticulars}>{row.particulars}</Text>
                      {row.notes ? <Text style={styles.rowDate}>📝 {row.notes}</Text> : null}
                    </View>

                    {/* Right Columns: Credit (+), Debit (-), Balance */}
                    <Text style={[styles.rowCredit, { width: 58 }]}>
                      {row.credit > 0 ? `+${formatInr(row.credit)}` : '—'}
                    </Text>
                    <Text style={[styles.rowDebit, { width: 58 }]}>
                      {row.debit > 0 ? `-${formatInr(row.debit)}` : '—'}
                    </Text>
                    <Text style={[styles.rowBalance, { width: 64, color: row.runningBalance > 0 ? '#dc2626' : '#16a34a' }]}>
                      ₹{row.runningBalance.toLocaleString('en-IN')}
                    </Text>
                  </View>
                ))}

                {doubleEntryLedger.length > visibleLedgerCount ? (
                  <TouchableOpacity
                    style={{
                      paddingVertical: 9,
                      backgroundColor: '#fff7ed',
                      borderRadius: RADIUS.md,
                      alignItems: 'center',
                      borderWidth: 1,
                      borderColor: '#ffedd5',
                      marginTop: 4,
                    }}
                    onPress={() => setVisibleLedgerCount((prev) => prev + 10)}
                  >
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#c2410c' }}>
                      🔽 Load More ({doubleEntryLedger.length - visibleLedgerCount} remaining)
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </>
            )}
          </View>
        ) : (
          /* ITEMIZED TAB VIEW */
          <View style={{ gap: 12 }}>
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'WORK' && styles.tabBtnActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab('WORK')}
              >
                <Ionicons name="construct-outline" size={15} color={activeTab === 'WORK' ? '#fff' : '#64748b'} />
                <Text style={[styles.tabBtnText, activeTab === 'WORK' && styles.tabBtnTextActive]}>
                  Work Records ({workEntries.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'PAYMENTS' && styles.tabBtnActive]}
                activeOpacity={0.8}
                onPress={() => setActiveTab('PAYMENTS')}
              >
                <Ionicons name="cash-outline" size={15} color={activeTab === 'PAYMENTS' ? '#fff' : '#64748b'} />
                <Text style={[styles.tabBtnText, activeTab === 'PAYMENTS' && styles.tabBtnTextActive]}>
                  Payment History ({payments.length})
                </Text>
              </TouchableOpacity>
            </View>

            {activeTab === 'WORK' ? (
              workEntries.length === 0 ? (
                <View style={styles.emptyCard}>
                  <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
                  <Text style={styles.emptyText}>No work records found.</Text>
                </View>
              ) : (
                <View style={{ gap: 10 }}>
                  {workEntries.map((w) => (
                    <View key={w.id} style={[styles.itemCard, premiumShadow('#0f172a', 'sm')]}>
                      <View style={styles.itemHeader}>
                        <View style={styles.itemTypeBadge}>
                          <Ionicons name="hammer-outline" size={14} color="#ea580c" />
                          <Text style={styles.itemTypeText}>{w.workType}</Text>
                        </View>
                        <Text style={styles.itemDate}>
                          {new Date(w.workDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </Text>
                      </View>
                      <View style={styles.itemBody}>
                        <Text style={styles.itemQtyRate}>
                          {w.quantity} {w.unit} @ ₹{w.rate}/{w.unit}
                        </Text>
                        <Text style={styles.itemAmount}>+{formatInr(w.totalAmount)}</Text>
                      </View>
                      {w.notes ? <Text style={styles.itemNotes}>📝 {w.notes}</Text> : null}
                    </View>
                  ))}
                </View>
              )
            ) : payments.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="wallet-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No payment records found.</Text>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                {payments.map((p) => (
                  <View key={p.id} style={[styles.itemCard, premiumShadow('#0f172a', 'sm')]}>
                    <View style={styles.itemHeader}>
                      <View style={[styles.itemTypeBadge, { backgroundColor: '#dcfce7' }]}>
                        <Ionicons name="checkmark-circle-outline" size={14} color="#166534" />
                        <Text style={[styles.itemTypeText, { color: '#166534' }]}>{p.paymentMode || 'CASH'}</Text>
                      </View>
                      <Text style={styles.itemDate}>
                        {new Date(p.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.itemBody}>
                      <Text style={{ fontSize: 13, color: '#64748b', fontFamily: FONT.medium }}>Payment Received</Text>
                      <Text style={[styles.itemAmount, { color: '#166534' }]}>-{formatInr(p.amount)}</Text>
                    </View>
                    {p.notes ? <Text style={styles.itemNotes}>📝 {p.notes}</Text> : null}
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: 14, paddingBottom: SPACING.xxl },
  farmerTopCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fed7aa',
  },
  farmerPhoto: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#ea580c',
  },
  farmerAvatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ffedd5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#fdba74',
  },
  farmerAvatarInitials: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#c2410c',
  },
  farmerLabel: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
  farmerName: { fontSize: 15.5, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 1 },
  farmerMetaText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#ea580c' },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ea580c',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  callBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },

  balanceCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, overflow: 'hidden' },
  watermark: { position: 'absolute', top: -12, right: -16, opacity: 0.08 },
  cardSubTitle: { fontSize: 13, fontFamily: FONT.semiBold, color: '#64748b' },
  balanceAmount: { fontSize: 34, fontFamily: FONT.extraBold, marginTop: 4, letterSpacing: -0.6 },
  heroRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  heroBox: { flex: 1, borderRadius: RADIUS.md, padding: 12, alignItems: 'center' },
  heroBoxLabel: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  heroBoxVal: { fontSize: 15, fontFamily: FONT.extraBold, marginTop: 4 },

  viewModeToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: RADIUS.pill,
    padding: 3,
    gap: 4,
  },
  viewModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  viewModeBtnActive: { backgroundColor: '#ea580c' },
  viewModeText: { fontSize: 12, fontFamily: FONT.bold, color: '#475569' },
  viewModeTextActive: { color: '#ffffff' },

  doubleEntryContainer: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  doubleEntryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.sm,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  doubleEntryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  rowParticulars: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  rowDate: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  rowCredit: { fontSize: 12.5, fontFamily: FONT.bold, color: '#c2410c', textAlign: 'right' },
  rowDebit: { fontSize: 12.5, fontFamily: FONT.bold, color: '#166534', textAlign: 'right' },
  rowBalance: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#0f172a', textAlign: 'right' },

  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    padding: 4,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  tabBtnActive: { backgroundColor: '#ea580c' },
  tabBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#64748b' },
  tabBtnTextActive: { color: '#ffffff' },
  emptyCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 13.5, fontFamily: FONT.medium, color: '#94a3b8' },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffedd5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  itemTypeText: { fontSize: 12, fontFamily: FONT.bold, color: '#c2410c' },
  itemDate: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8' },
  itemBody: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemQtyRate: { fontSize: 14, fontFamily: FONT.semiBold, color: '#334155' },
  itemAmount: { fontSize: 16, fontFamily: FONT.extraBold, color: '#ea580c' },
  itemNotes: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 6 },
});
