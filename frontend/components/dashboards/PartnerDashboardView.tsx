import React from 'react';
import { ActivityIndicator, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useMyWallet } from '@/src/hooks/useWallet';
import { useMyWithdrawals } from '@/src/hooks/useWithdrawals';
import { useMyReferrals } from '@/src/hooks/useReferrals';
import { useExecutiveTheme } from '@/src/store/theme-context';

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export const PartnerDashboardView: React.FC = () => {
  const theme = RoleThemes.AGENT;
  const { colors: tConfig } = useExecutiveTheme();
  const router = useRouter();
  const { user } = useAuth();
  const { data: wallet, isLoading: isLoadingWallet } = useMyWallet();
  const { data: withdrawals } = useMyWithdrawals();
  const { data: referrals, isLoading: isLoadingReferrals } = useMyReferrals();

  const transactions = wallet?.transactions ?? [];
  const creditTx = transactions.filter((t) => t.type === 'CREDIT');

  const now = new Date();
  const thisMonthEarnings = creditTx
    .filter((t) => {
      const d = new Date(t.createdAt);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalEarnings = creditTx.reduce((sum, t) => sum + Number(t.amount), 0);

  // Last 7 days' credited amounts, for the bar chart — real data, normalized to the tallest day.
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const day = startOfDay(new Date(now.getTime() - (6 - i) * 86_400_000));
    const total = creditTx
      .filter((t) => startOfDay(new Date(t.createdAt)).getTime() === day.getTime())
      .reduce((sum, t) => sum + Number(t.amount), 0);
    return total;
  });
  const maxDay = Math.max(...last7Days, 1);
  const barHeights = last7Days.map((v) => Math.max((v / maxDay) * 60, 4));

  const paid = (withdrawals ?? [])
    .filter((w) => w.status === 'APPROVED')
    .reduce((sum, w) => sum + Number(w.approvedAmount ?? w.requestedAmount), 0);
  const pending = (withdrawals ?? [])
    .filter((w) => w.status === 'PENDING')
    .reduce((sum, w) => sum + Number(w.requestedAmount), 0);

  const totalReferrals = referrals?.length ?? 0;
  const activeReferrals = (referrals ?? []).filter((r) => r.commissionEarned > 0).length;
  const recentReferrals = (referrals ?? []).slice(0, 5);

  const isAlsoSeller =
    user?.role === 'SELLER' ||
    (Array.isArray(user?.roles) &&
      user.roles.includes('SELLER') &&
      !(Array.isArray((user as any)?.deactivatedRoles) && (user as any).deactivatedRoles.includes('SELLER'))) ||
    Boolean((user as any)?.sellerStore);

  return (
    <ScrollView style={[styles.container, { backgroundColor: tConfig.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="AGENT"
        profileName={user?.name || 'Agent'}
        subtitle="Agent"
        avatarUrl={user?.photoUrl || undefined}
      />

      <View style={styles.content}>
        {isAlsoSeller ? (
          <TouchableOpacity
            style={styles.sellerShortcutCard}
            activeOpacity={0.85}
            onPress={() => router.push('/seller-dashboard' as any)}
          >
            <View style={styles.sellerShortcutIcon}>
              <Ionicons name="storefront" size={20} color="#10b981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sellerShortcutTitle}>Open Seller Store & Orders</Text>
              <Text style={styles.sellerShortcutSub}>Manage products, dispatch orders & bank payouts</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#10b981" />
          </TouchableOpacity>
        ) : null}

        {/* Nursery Coordination Hub Shortcut for Agents */}
        <TouchableOpacity
          style={styles.nurseryShortcutCard}
          activeOpacity={0.85}
          onPress={() => router.push('/nursery' as any)}
        >
          <View style={styles.nurseryShortcutIcon}>
            <Ionicons name="leaf" size={20} color="#22c55e" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nurseryHeaderRow}>
              <Text style={styles.nurseryShortcutTitle}>Nursery Seedling Hub</Text>
              <View style={styles.commissionBadge}>
                <Text style={styles.commissionBadgeText}>2% AGENT COMM</Text>
              </View>
            </View>
            <Text style={styles.nurseryShortcutSub}>
              Direct flower & vegetable seedling bookings, dispatch tracking & 2% partner commission
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#22c55e" />
        </TouchableOpacity>

        {/* Earnings Card */}
        <LinearGradient colors={theme.heroGradient} style={[styles.earningsCard, premiumShadow(theme.primary, 'md')]}>
          <Ionicons name="wallet" size={104} color={theme.primary} style={styles.watermark} />
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelText}>This Month Earnings</Text>
          </View>
          {isLoadingWallet ? (
            <ActivityIndicator color={theme.primary} style={{ marginTop: 10 }} />
          ) : (
            <Text style={styles.earningsAmount}>₹{thisMonthEarnings.toLocaleString('en-IN')}</Text>
          )}

          <View style={styles.barChartContainer}>
            <View style={styles.barsRow}>
              {barHeights.map((heightVal, idx) => (
                <LinearGradient key={idx} colors={[theme.accent, theme.primary]} style={[styles.barItem, { height: heightVal }]} />
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* 3 Metrics Row */}
        <View style={[styles.metricsRow, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Referrals</Text>
            <Text style={styles.metricValue}>{totalReferrals}</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorderLeft]}>
            <Text style={styles.metricLabel}>Active Referrals</Text>
            <Text style={styles.metricValue}>{activeReferrals}</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorderLeft]}>
            <Text style={styles.metricLabel}>Total Earnings</Text>
            <Text style={[styles.metricValue, { color: theme.primary }]}>₹{totalEarnings.toLocaleString('en-IN')}</Text>
          </View>
        </View>

        {/* Earnings Overview */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earnings & Payout Breakdown</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(partner)/(tabs)/wallet' as never)}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View Wallet</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.overviewStatsGrid}>
            <View style={[styles.statBox, { backgroundColor: 'rgba(0, 255, 135, 0.08)', borderColor: 'rgba(0, 255, 135, 0.22)' }]}>
              <Text style={styles.statSubText}>💼 Sales Commission</Text>
              <Text style={[styles.statBigText, { color: '#00ff87' }]}>₹{(wallet?.commissionEarnings ?? 0).toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }]}>
              <Text style={styles.statSubText}>👥 Referral Bonus</Text>
              <Text style={[styles.statBigText, { color: '#60a5fa' }]}>₹{(wallet?.referralEarnings ?? 0).toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: 'rgba(245, 158, 11, 0.08)', borderColor: 'rgba(245, 158, 11, 0.25)' }]}>
              <Text style={styles.statSubText}>🎁 Welcome Bonus</Text>
              <Text style={[styles.statBigText, { color: '#fbbf24' }]}>₹{(wallet?.welcomeEarnings ?? 0).toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: 'rgba(245, 158, 11, 0.14)', borderColor: 'rgba(245, 158, 11, 0.35)' }]}>
              <Text style={styles.statSubText}>💶 Available Balance</Text>
              <Text style={[styles.statBigText, { color: theme.primary }]}>₹{(wallet?.balance ?? 0).toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <View style={[styles.overviewStatsRow, { marginTop: 10 }]}>
            <View style={[styles.statBox, { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(255, 255, 255, 0.08)', flex: 1 }]}>
              <Text style={styles.statSubText}>Paid Payouts</Text>
              <Text style={[styles.statBigText, { color: '#e2e8f0' }]}>₹{paid.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.25)', flex: 1 }]}>
              <Text style={styles.statSubText}>Pending Payouts</Text>
              <Text style={[styles.statBigText, { color: '#f87171' }]}>₹{pending.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Recent Referrals */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/(partner)/(tabs)/referrals' as never)}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {isLoadingReferrals ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
          ) : recentReferrals.length === 0 ? (
            <Text style={styles.emptyText}>No referrals yet — share your referral code to start earning.</Text>
          ) : (
            recentReferrals.map((ref, idx) => (
              <View key={ref.id} style={[styles.referralItem, idx === recentReferrals.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={[styles.userIconBg, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name="person-outline" size={17} color={theme.primary} />
                </View>
                <View style={styles.refInfo}>
                  <Text style={styles.refName}>{ref.name}</Text>
                  <Text style={styles.refDate}>Joined on {new Date(ref.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
                </View>
                <Text style={[styles.refComm, { color: theme.primary }]}>₹{ref.commissionEarned.toLocaleString('en-IN')}</Text>
              </View>
            ))
          )}
        </View>

      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  earningsCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, overflow: 'hidden' },
  watermark: { position: 'absolute', top: -12, right: -16, opacity: 0.08 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabelText: { fontSize: 13.5, color: '#64748b', fontFamily: FONT.semiBold },
  earningsAmount: { fontSize: 34, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6, letterSpacing: -0.6 },
  barChartContainer: { marginTop: 18, height: 60, justifyContent: 'flex-end' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 },
  barItem: { width: 18, borderRadius: 6 },
  metricsRow: {
    flexDirection: 'row',
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.2,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    ...premiumShadow('#f59e0b', 'sm'),
  },
  metricItem: { flex: 1, alignItems: 'center' },
  metricBorderLeft: { borderLeftWidth: 1, borderLeftColor: 'rgba(245, 158, 11, 0.18)' },
  metricLabel: { fontSize: 11.5, color: '#94a3b8', fontFamily: FONT.medium },
  metricValue: { fontSize: 15.5, fontFamily: FONT.bold, color: '#ffffff', marginTop: 5 },
  sectionCard: {
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.20)',
    ...premiumShadow('#00ff87', 'sm'),
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#ffffff', letterSpacing: -0.1 },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold },
  overviewStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  overviewStatsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statBox: { minWidth: '47%', flex: 1, borderRadius: RADIUS.md, padding: 10, alignItems: 'center', borderWidth: 1 },
  statSubText: { fontSize: 10.5, color: '#94a3b8', fontFamily: FONT.medium },
  statBigText: { fontSize: 13.5, fontFamily: FONT.extraBold, marginTop: 4 },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8' },
  referralItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.06)' },
  userIconBg: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  refInfo: { flex: 1, marginLeft: 12 },
  sellerShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.3,
    borderColor: 'rgba(16, 185, 129, 0.45)',
    ...premiumShadow('#10b981', 'sm'),
  },
  sellerShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerShortcutTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  sellerShortcutSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  nurseryShortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#04160c',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1.3,
    borderColor: 'rgba(34, 197, 94, 0.45)',
    ...premiumShadow('#22c55e', 'sm'),
  },
  nurseryShortcutIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nurseryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nurseryShortcutTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  commissionBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#22c55e',
  },
  commissionBadgeText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#22c55e', letterSpacing: 0.5 },
  nurseryShortcutSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  refName: { fontSize: 13.5, fontFamily: FONT.bold, color: '#ffffff' },
  refDate: { fontSize: 11.5, color: '#94a3b8', fontFamily: FONT.medium, marginTop: 2 },
  refComm: { fontSize: 13.5, fontFamily: FONT.extraBold },
});
