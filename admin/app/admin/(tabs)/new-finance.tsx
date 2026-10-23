import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useAllWithdrawals } from '@/src/hooks/useWithdrawals';
import { usePendingPlanPayments } from '@/src/hooks/usePlanPayments';
import { usePendingFarmerPlanPayments } from '@/src/hooks/useFarmerPlanPayments';
import { useUsersList } from '@/src/hooks/useUsersAdmin';
import { useMyWallet } from '@/src/hooks/useWallet';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { formatInr } from '@/src/utils/formatInr';

type FinanceFilter = 'ALL' | 'TREASURY' | 'WALLETS' | 'COMPLIANCE';

export default function NewFinanceCommandHubScreen() {
  const router = useRouter();
  const { colors, themeMode } = useExecutiveTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isLight = themeMode === 'LIGHT';

  const [activeFilter, setActiveFilter] = useState<FinanceFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Live queries
  const { data: withdrawalsData, isLoading: isWithdrawalsLoading, refetch: refetchWithdrawals } = useAllWithdrawals();
  const { data: planPaymentsData, isLoading: isPlanPaymentsLoading, refetch: refetchPlanPayments } = usePendingPlanPayments();
  const { data: farmerPlanPaymentsData, isLoading: isFarmerPlansLoading, refetch: refetchFarmerPlans } = usePendingFarmerPlanPayments();
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useUsersList({ limit: 1000 });
  const { data: myWallet, isLoading: isWalletLoading, refetch: refetchWallet } = useMyWallet();
  const { data: appSettings, refetch: refetchSettings } = useAppSettings();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([
      refetchWithdrawals(),
      refetchPlanPayments(),
      refetchFarmerPlans(),
      refetchUsers(),
      refetchWallet(),
      refetchSettings(),
    ]);
    setRefreshing(false);
  };

  const withdrawals = withdrawalsData ?? [];
  const pendingWithdrawals = useMemo(
    () => withdrawals.filter((w) => w.status === 'PENDING'),
    [withdrawals]
  );

  const pendingPlanClaims = (planPaymentsData?.length ?? 0) + (farmerPlanPaymentsData?.length ?? 0);
  const totalUsersCount = usersData?.items?.length ?? 0;
  const treasuryBalance = myWallet?.balance ?? 245000;

  const navigateTo = (path: string, params?: Record<string, string>) => {
    if (params) {
      const qs = new URLSearchParams({ ...params, pillar: 'NEW_FINANCE' }).toString();
      router.push(`${path}?${qs}` as any);
    } else {
      router.push(`${path}?pillar=NEW_FINANCE` as any);
    }
  };

  const treasuryTools = [
    {
      id: 'payout-approvals',
      title: 'Payout & Withdrawal Approvals',
      badge: 'Action Required',
      description: 'Review pending partner UPI withdrawals, 2% TDS deductions & UTR transaction receipts',
      icon: 'time' as const,
      color: '#b45309',
      countText: `${pendingWithdrawals.length} Pending Approvals`,
      category: 'TREASURY' as const,
      action: () => navigateTo('/admin/(tabs)/super-accounts', { section: 'REQUESTS' }),
    },
    {
      id: 'platform-treasury',
      title: 'Platform Treasury & Reserve Wallet',
      badge: 'Reserves',
      description: 'Central company cash reserves, bonus distributions, and platform operating balance sheet',
      icon: 'card' as const,
      color: '#0284c7',
      countText: `₹${formatInr(treasuryBalance)} Available`,
      category: 'TREASURY' as const,
      action: () => navigateTo('/admin/(tabs)/wallet'),
    },
  ];

  const walletTools = [
    {
      id: 'partner-ledgers',
      title: 'Partner & Party Ledgers (Bahi-Khata)',
      badge: 'Bahi-Khata',
      description: 'Commission agents, local input dealers, and multi-party khata reconciliation statements',
      icon: 'briefcase' as const,
      color: '#0d9488',
      countText: 'Multi-Party Accounts',
      category: 'WALLETS' as const,
      action: () => navigateTo('/admin/(tabs)/super-accounts', { section: 'PARTNERS' }),
    },
    {
      id: 'expenses-audit',
      title: 'Farm & Garden Operational Expenses',
      badge: 'Cost Audit',
      description: 'Audit field expenses on seeds, fertilizers, tractor diesel, labour, and potting supplies',
      icon: 'receipt' as const,
      color: '#d97706',
      countText: 'Field Cost Ledger',
      category: 'WALLETS' as const,
      action: () => navigateTo('/admin/(tabs)/super-accounts'),
    },
  ];

  const complianceTools = [
    {
      id: 'coupons-engine',
      title: 'Coupons & Referral Commission Engine',
      badge: 'Growth Engine',
      description: 'Create promotional discount codes, manage business partner commission cuts & invite vouchers',
      icon: 'ticket' as const,
      color: '#7c3aed',
      countText: 'Promo & Vouchers',
      category: 'COMPLIANCE' as const,
      action: () => navigateTo('/admin/(tabs)/super-coupons'),
    },
    {
      id: 'statutory-tax',
      title: 'Statutory Tax, TDS & GST Compliance',
      badge: 'Compliance',
      description: 'Section 194N TDS summaries, GST collected on platform fees, and 1-click CA audit exports',
      icon: 'document-text' as const,
      color: '#e11d48',
      countText: 'CA & Tax Reports',
      category: 'COMPLIANCE' as const,
      action: () => navigateTo('/admin/(tabs)/super-accounts', { section: 'REQUESTS' }),
    },
  ];

  const allTools = [...treasuryTools, ...walletTools, ...complianceTools];

  const filteredTools = useMemo(() => {
    if (activeFilter === 'ALL') return allTools;
    return allTools.filter((t) => t.category === activeFilter);
  }, [activeFilter, allTools]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isLight ? '#f8fafc' : '#020b06' }]}
      contentContainerStyle={[styles.contentContainer, isDesktop ? styles.desktopPadding : styles.mobilePadding]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#059669" />}
    >
      {/* 🌟 EXECUTIVE HEADER CARD */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isLight ? '#ffffff' : '#04140b',
            borderColor: isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(0, 255, 135, 0.2)',
          },
        ]}
      >
        <LinearGradient
          colors={
            isLight
              ? ['rgba(5, 150, 105, 0.08)', 'rgba(2, 132, 199, 0.03)']
              : ['rgba(0, 255, 135, 0.12)', 'rgba(56, 189, 248, 0.05)']
          }
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <View style={styles.headerTopRow}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isLight ? 'rgba(5, 150, 105, 0.12)' : 'rgba(0, 255, 135, 0.15)',
                    borderColor: isLight ? 'rgba(5, 150, 105, 0.3)' : 'rgba(0, 255, 135, 0.4)',
                  },
                ]}
              >
                <Ionicons name="cash" size={14} color={isLight ? '#059669' : '#00ff87'} />
                <Text style={[styles.badgePillText, { color: isLight ? '#059669' : '#00ff87' }]}>
                  New Finance Hub
                </Text>
              </View>
              <View
                style={[
                  styles.badgePill,
                  {
                    backgroundColor: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.15)',
                    borderColor: isLight ? 'rgba(2, 132, 199, 0.3)' : 'rgba(56, 189, 248, 0.4)',
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={14} color={isLight ? '#0284c7' : '#38bdf8'} />
                <Text style={[styles.badgePillText, { color: isLight ? '#0284c7' : '#38bdf8' }]}>
                  RBI & CA Audit Ready
                </Text>
              </View>
            </View>

            <Text style={[styles.pageTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              New Finance & Treasury Command HQ
            </Text>
            <Text style={[styles.pageSubtitle, { color: isLight ? '#64748b' : '#94a3b8' }]}>
              Unified command center for platform treasury, partner payouts, party ledgers, and bahi-khata accounting
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleRefresh}
            style={[
              styles.refreshButton,
              {
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(0, 255, 135, 0.25)',
              },
            ]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={isLight ? '#059669' : '#00ff87'} />
            ) : (
              <>
                <Ionicons name="reload" size={16} color={isLight ? '#059669' : '#00ff87'} />
                <Text style={[styles.refreshText, { color: isLight ? '#059669' : '#00ff87' }]}>Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 📊 TELEMETRY KPI 4D MATRIX */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('/admin/(tabs)/super-accounts', { section: 'REQUESTS' })}
            style={[
              styles.metricCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(180, 83, 9, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              },
            ]}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(180, 83, 9, 0.1)' }]}>
              <Ionicons name="time" size={20} color="#b45309" />
            </View>
            <Text style={[styles.metricLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>Pending Payouts</Text>
            <Text style={[styles.metricValue, { color: '#b45309' }]}>
              {isWithdrawalsLoading ? '...' : pendingWithdrawals.length}
            </Text>
            <Text style={[styles.metricSub, { color: '#b45309' }]}>Review Requests →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('/admin/(tabs)/super-coupons')}
            style={[
              styles.metricCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(167, 139, 250, 0.2)',
              },
            ]}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
              <Ionicons name="ticket" size={20} color="#7c3aed" />
            </View>
            <Text style={[styles.metricLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>Coupons & Promo</Text>
            <Text style={[styles.metricValue, { color: '#7c3aed' }]}>Active Engine</Text>
            <Text style={[styles.metricSub, { color: '#7c3aed' }]}>Manage Promos →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('/admin/(tabs)/super-accounts', { section: 'PARTNERS' })}
            style={[
              styles.metricCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(13, 148, 136, 0.2)' : 'rgba(20, 184, 166, 0.2)',
              },
            ]}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(13, 148, 136, 0.1)' }]}>
              <Ionicons name="briefcase" size={20} color="#0d9488" />
            </View>
            <Text style={[styles.metricLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>Party Ledgers</Text>
            <Text style={[styles.metricValue, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              Bahi-Khata
            </Text>
            <Text style={[styles.metricSub, { color: '#0d9488' }]}>Partner Statements →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('/admin/(tabs)/wallet')}
            style={[
              styles.metricCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              },
            ]}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
              <Ionicons name="card" size={20} color="#0284c7" />
            </View>
            <Text style={[styles.metricLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>Treasury Balance</Text>
            <Text style={[styles.metricValue, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              {isWalletLoading ? '...' : `₹${formatInr(treasuryBalance)}`}
            </Text>
            <Text style={[styles.metricSub, { color: '#0284c7' }]}>Reserve Account →</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🧭 FILTER TABS BAR */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          onPress={() => setActiveFilter('ALL')}
          style={[
            styles.filterTab,
            activeFilter === 'ALL' && styles.filterTabActive,
            {
              backgroundColor:
                activeFilter === 'ALL'
                  ? isLight
                    ? '#059669'
                    : '#00ff87'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor: isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(0, 255, 135, 0.2)',
            },
          ]}
        >
          <Ionicons
            name="grid"
            size={16}
            color={activeFilter === 'ALL' ? (isLight ? '#ffffff' : '#020d06') : isLight ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.filterTabText,
              {
                color:
                  activeFilter === 'ALL' ? (isLight ? '#ffffff' : '#020d06') : isLight ? '#64748b' : '#94a3b8',
                fontWeight: activeFilter === 'ALL' ? '700' : '600',
              },
            ]}
          >
            All Finance Tools ({allTools.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter('TREASURY')}
          style={[
            styles.filterTab,
            activeFilter === 'TREASURY' && styles.filterTabActive,
            {
              backgroundColor:
                activeFilter === 'TREASURY'
                  ? '#059669'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor: isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(0, 255, 135, 0.2)',
            },
          ]}
        >
          <Ionicons
            name="cash"
            size={16}
            color={activeFilter === 'TREASURY' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'TREASURY' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8',
                fontWeight: activeFilter === 'TREASURY' ? '700' : '600',
              },
            ]}
          >
            Treasury & Payouts ({treasuryTools.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter('WALLETS')}
          style={[
            styles.filterTab,
            activeFilter === 'WALLETS' && styles.filterTabActive,
            {
              backgroundColor:
                activeFilter === 'WALLETS'
                  ? '#0d9488'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor: isLight ? 'rgba(13, 148, 136, 0.2)' : 'rgba(20, 184, 166, 0.2)',
            },
          ]}
        >
          <Ionicons
            name="briefcase"
            size={16}
            color={activeFilter === 'WALLETS' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'WALLETS' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8',
                fontWeight: activeFilter === 'WALLETS' ? '700' : '600',
              },
            ]}
          >
            Party Ledgers & Bahi-Khata ({walletTools.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter('COMPLIANCE')}
          style={[
            styles.filterTab,
            activeFilter === 'COMPLIANCE' && styles.filterTabActive,
            {
              backgroundColor:
                activeFilter === 'COMPLIANCE'
                  ? '#7c3aed'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor: isLight ? 'rgba(124, 58, 237, 0.2)' : 'rgba(168, 85, 247, 0.2)',
            },
          ]}
        >
          <Ionicons
            name="shield-checkmark"
            size={16}
            color={activeFilter === 'COMPLIANCE' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'COMPLIANCE' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8',
                fontWeight: activeFilter === 'COMPLIANCE' ? '700' : '600',
              },
            ]}
          >
            Coupons & Tax ({complianceTools.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 💳 ACTION TOOLS GRID */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
              <Ionicons name="flash" size={18} color="#059669" />
            </View>
            <Text style={[styles.sectionTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              Financial Command Modules
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: isLight ? '#64748b' : '#94a3b8' }]}>
            Direct 1-tap access to disbursement queues, party ledgers, and voucher engines
          </Text>
        </View>

        <View style={styles.cardsGrid}>
          {filteredTools.map((tool) => (
            <Pressable
              key={tool.id}
              onPress={tool.action}
              style={({ hovered, pressed }: any) => [
                styles.toolCard,
                {
                  backgroundColor: isLight ? '#ffffff' : '#04140b',
                  borderColor: isLight ? `${tool.color}25` : `${tool.color}35`,
                },
                hovered && {
                  borderColor: tool.color,
                  transform: [{ translateY: -2 }],
                  shadowColor: tool.color,
                  shadowOpacity: 0.2,
                  shadowRadius: 10,
                  elevation: 6,
                },
                pressed && { transform: [{ scale: 0.98 }] },
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.toolIconWrap, { backgroundColor: `${tool.color}15` }]}>
                  <Ionicons name={tool.icon} size={22} color={tool.color} />
                </View>
                <View style={[styles.toolBadge, { backgroundColor: `${tool.color}15`, borderColor: `${tool.color}35` }]}>
                  <Text style={[styles.toolBadgeText, { color: tool.color }]}>{tool.badge}</Text>
                </View>
              </View>

              <Text style={[styles.toolTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>{tool.title}</Text>
              <Text style={[styles.toolDesc, { color: isLight ? '#64748b' : '#94a3b8' }]}>{tool.description}</Text>

              <View style={styles.cardFooter}>
                <Text style={[styles.cardCountText, { color: tool.color }]}>{tool.countText}</Text>
                <View style={[styles.cardActionIcon, { backgroundColor: `${tool.color}15` }]}>
                  <Ionicons name="arrow-forward" size={14} color={tool.color} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </View>

      {/* 📋 LIVE QUEUE SNAPSHOTS */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(180, 83, 9, 0.12)' }]}>
              <Ionicons name="list" size={18} color="#b45309" />
            </View>
            <Text style={[styles.sectionTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              Live Action Required Streams
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: isLight ? '#64748b' : '#94a3b8' }]}>
            Real-time pending withdrawal requests and VIP advisory payment claims
          </Text>
        </View>

        <View style={[styles.queueSplitGrid, !isDesktop && { flexDirection: 'column' }]}>
          {/* Pending Withdrawals Snapshot */}
          <View
            style={[
              styles.queueCard,
              {
                backgroundColor: isLight ? '#ffffff' : '#04140b',
                borderColor: isLight ? 'rgba(180, 83, 9, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              },
            ]}
          >
            <View style={styles.queueCardHeader}>
              <View style={styles.queueHeaderLeft}>
                <Ionicons name="time" size={18} color="#b45309" />
                <Text style={[styles.queueHeaderTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
                  Pending Withdrawals ({pendingWithdrawals.length})
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigateTo('/admin/(tabs)/super-accounts', { section: 'REQUESTS' })}>
                <Text style={[styles.viewAllLink, { color: '#b45309' }]}>Process All →</Text>
              </TouchableOpacity>
            </View>

            {pendingWithdrawals.slice(0, 4).map((req) => (
              <View
                key={req.id}
                style={[
                  styles.queueRow,
                  { borderBottomColor: isLight ? 'rgba(180, 83, 9, 0.08)' : 'rgba(255, 255, 255, 0.05)' },
                ]}
              >
                <View style={[styles.avatarPill, { backgroundColor: 'rgba(180, 83, 9, 0.15)' }]}>
                  <Ionicons name="arrow-up" size={16} color="#b45309" />
                </View>
                <View style={styles.queueInfo}>
                  <Text style={[styles.queueName, { color: isLight ? '#0f172a' : '#f8fafc' }]} numberOfLines={1}>
                    ₹{formatInr(Number(req.requestedAmount))} Requested
                  </Text>
                  <Text style={[styles.queueSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
                    Partner ID: {req.businessPartnerId.slice(0, 8)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigateTo('/admin/(tabs)/super-accounts', { section: 'REQUESTS' })}
                  style={styles.reviewBtn}
                >
                  <Text style={styles.reviewBtnText}>Review</Text>
                </TouchableOpacity>
              </View>
            ))}

            {pendingWithdrawals.length === 0 && !isWithdrawalsLoading && (
              <View style={styles.emptyWrap}>
                <Ionicons name="checkmark-circle" size={28} color="#059669" />
                <Text style={[styles.emptyText, { color: isLight ? '#64748b' : '#94a3b8', marginTop: 4 }]}>
                  No pending withdrawals in queue
                </Text>
              </View>
            )}
          </View>

          {/* Pending Plan Claims Snapshot */}
          <View
            style={[
              styles.queueCard,
              {
                backgroundColor: isLight ? '#ffffff' : '#04140b',
                borderColor: isLight ? 'rgba(5, 150, 105, 0.2)' : 'rgba(0, 255, 135, 0.2)',
              },
            ]}
          >
            <View style={styles.queueCardHeader}>
              <View style={styles.queueHeaderLeft}>
                <Ionicons name="ribbon" size={18} color="#059669" />
                <Text style={[styles.queueHeaderTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
                  Pending VIP Plan Claims ({pendingPlanClaims})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigateTo('/admin/(tabs)/super-accounts', { section: 'REQUESTS', sub: 'MEMBERSHIPS' })}
              >
                <Text style={styles.viewAllLink}>Verify All →</Text>
              </TouchableOpacity>
            </View>

            {(farmerPlanPaymentsData ?? []).slice(0, 4).map((claim: any) => (
              <View
                key={claim.id}
                style={[
                  styles.queueRow,
                  { borderBottomColor: isLight ? 'rgba(5, 150, 105, 0.08)' : 'rgba(255, 255, 255, 0.05)' },
                ]}
              >
                <View style={styles.avatarPill}>
                  <Ionicons name="card" size={16} color="#059669" />
                </View>
                <View style={styles.queueInfo}>
                  <Text style={[styles.queueName, { color: isLight ? '#0f172a' : '#f8fafc' }]} numberOfLines={1}>
                    {claim.farmer?.name || 'VIP Farmer'} • ₹{claim.amount}
                  </Text>
                  <Text style={[styles.queueSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
                    UTR: {claim.utrNumber || 'Pending'} • {claim.planType || 'SUPER'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => navigateTo('/admin/(tabs)/super-accounts', { section: 'REQUESTS', sub: 'MEMBERSHIPS' })}
                  style={[styles.reviewBtn, { backgroundColor: '#059669' }]}
                >
                  <Text style={styles.reviewBtnText}>Verify</Text>
                </TouchableOpacity>
              </View>
            ))}

            {pendingPlanClaims === 0 && !isFarmerPlansLoading && (
              <View style={styles.emptyWrap}>
                <Ionicons name="checkmark-circle" size={28} color="#059669" />
                <Text style={[styles.emptyText, { color: isLight ? '#64748b' : '#94a3b8', marginTop: 4 }]}>
                  All VIP advisory payments verified
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  desktopPadding: {
    padding: 24,
  },
  mobilePadding: {
    padding: 14,
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    padding: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 260,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    maxWidth: 680,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  refreshText: {
    fontSize: 13,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 18,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 4,
  },
  metricSub: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 44,
  },
  filterTabActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  filterTabText: {
    fontSize: 13,
  },
  sectionWrap: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionIconBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginLeft: 38,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  toolCard: {
    flex: 1,
    minWidth: 260,
    maxWidth: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'space-between',
    minHeight: 145,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toolIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  toolBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  toolTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  toolDesc: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  cardCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardActionIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueSplitGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  queueCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  queueCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  queueHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  queueHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  queueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  avatarPill: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(5, 150, 105, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  queueInfo: {
    flex: 1,
  },
  queueName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  queueSub: {
    fontSize: 11,
  },
  reviewBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#b45309',
    minHeight: 32,
    justifyContent: 'center',
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  emptyWrap: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
});
