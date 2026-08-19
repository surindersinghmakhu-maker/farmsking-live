import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { useAuth } from '@/src/store/auth-context';
import { useQuery } from '@tanstack/react-query';
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
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.SUPER_ADMIN;

const LIVE_REQUESTS_POLL_MS = 20000;

export const SuperAdminDashboardView: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [activeWithdrawal, setActiveWithdrawal] = useState<WithdrawalRequest | null>(null);
  const [activePlanPayment, setActivePlanPayment] = useState<PlanPaymentRequest | null>(null);
  const [activeFarmerPlanPayment, setActiveFarmerPlanPayment] = useState<FarmerPlanPaymentRequest | null>(null);

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

  const pendingWithdrawals = (withdrawals ?? []).filter((w) => w.status === 'PENDING');
  const pendingPlanPayments = planPayments ?? [];
  const pendingFarmerPlanPayments = farmerPlanPayments ?? [];
  const totalRequests = pendingWithdrawals.length + pendingPlanPayments.length + pendingFarmerPlanPayments.length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <RoleHeader
        currentRole="SUPER_ADMIN"
        profileName={user?.name || 'Super Admin'}
        subtitle="Platform Oversight"
        avatarUrl={user?.photoUrl || undefined}
      />

      <View style={styles.content}>
        <View style={styles.statRow}>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={[styles.statIconBg, { backgroundColor: totalRequests > 0 ? '#fef3c7' : theme.primaryLight }]}>
              <Ionicons name="time-outline" size={16} color={totalRequests > 0 ? '#b45309' : theme.primary} />
            </View>
            <Text style={styles.statValue}>{totalRequests}</Text>
            <Text style={styles.statLabel}>Pending Requests</Text>
          </View>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={[styles.statIconBg, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="cash-outline" size={16} color={theme.primary} />
            </View>
            <Text style={styles.statValue}>{pendingWithdrawals.length}</Text>
            <Text style={styles.statLabel}>Withdrawals</Text>
          </View>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={[styles.statIconBg, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="receipt-outline" size={16} color={theme.primary} />
            </View>
            <Text style={styles.statValue}>{pendingPlanPayments.length + pendingFarmerPlanPayments.length}</Text>
            <Text style={styles.statLabel}>Payments</Text>
          </View>
        </View>

        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.requestsHeaderRow}>
            <Text style={styles.sectionTitle}>Partner & Client Requests</Text>
            {totalRequests > 0 ? <View style={styles.liveDot} /> : null}
          </View>

          {totalRequests === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-done-outline" size={22} color="#cbd5e1" />
              <Text style={styles.emptyText}>Nothing waiting on you right now.</Text>
            </View>
          ) : (
            <View style={{ gap: 14 }}>
              {pendingWithdrawals.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.groupLabel}>Partner Withdrawals ({pendingWithdrawals.length})</Text>
                  {pendingWithdrawals.map((w) => (
                    <WithdrawalCard key={w.id} request={w} onReview={() => setActiveWithdrawal(w)} />
                  ))}
                </View>
              ) : null}

              {pendingPlanPayments.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.groupLabel}>Advisor Plan Payment Claims ({pendingPlanPayments.length})</Text>
                  {pendingPlanPayments.map((p) => (
                    <PlanPaymentCard key={p.id} request={p} onReview={() => setActivePlanPayment(p)} />
                  ))}
                </View>
              ) : null}

              {pendingFarmerPlanPayments.length > 0 ? (
                <View style={{ gap: 8 }}>
                  <Text style={styles.groupLabel}>Farmer Plan Payment Claims ({pendingFarmerPlanPayments.length})</Text>
                  {pendingFarmerPlanPayments.map((p) => (
                    <FarmerPlanPaymentCard key={p.id} request={p} onReview={() => setActiveFarmerPlanPayment(p)} />
                  ))}
                </View>
              ) : null}
            </View>
          )}

          <TouchableOpacity style={styles.viewAllRow} activeOpacity={0.7} onPress={() => router.push('/(tabs)/super-accounts' as never)}>
            <Text style={styles.viewAllText}>View all in Accounts</Text>
            <Ionicons name="arrow-forward" size={14} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <Text style={styles.sectionTitle}>Quick Links</Text>
          <View style={styles.linkGrid}>
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/super-users' as never)}>
              <View style={styles.linkIconBg}>
                <Ionicons name="people-outline" size={19} color={theme.primary} />
              </View>
              <Text style={styles.linkLabel}>Users</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/super-coupons' as never)}>
              <View style={styles.linkIconBg}>
                <Ionicons name="pricetag-outline" size={19} color={theme.primary} />
              </View>
              <Text style={styles.linkLabel}>Coupons</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/super-accounts' as never)}>
              <View style={styles.linkIconBg}>
                <Ionicons name="wallet-outline" size={19} color={theme.primary} />
              </View>
              <Text style={styles.linkLabel}>Accounts</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.85} onPress={() => router.push('/(tabs)/super-settings' as never)}>
              <View style={styles.linkIconBg}>
                <Ionicons name="settings-outline" size={19} color={theme.primary} />
              </View>
              <Text style={styles.linkLabel}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ReviewModal request={activeWithdrawal} onClose={() => setActiveWithdrawal(null)} />
      <PlanPaymentReviewModal request={activePlanPayment} onClose={() => setActivePlanPayment(null)} />
      <FarmerPlanPaymentReviewModal request={activeFarmerPlanPayment} onClose={() => setActiveFarmerPlanPayment(null)} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  statRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 6 },
  statIconBg: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3 },
  statLabel: { fontSize: 10, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.2 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 12 },
  requestsHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#dc2626' },
  groupLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.4 },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 20 },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },
  viewAllRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingTop: 14 },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold, color: theme.primary },
  linkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  linkBtn: { width: '47%', backgroundColor: '#f8fafc', borderRadius: RADIUS.md, paddingVertical: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#f1f5f9' },
  linkIconBg: { width: 38, height: 38, borderRadius: 19, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  linkLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#334155' },
});
