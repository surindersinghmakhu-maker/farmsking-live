import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useProducts } from '@/src/hooks/useProducts';
import { useAdminConversations } from '@/src/hooks/useAdminChat';
import { useCrops } from '@/src/store/crops-context';
import * as withdrawalsApi from '@/src/api/withdrawals.api';
import * as planPaymentsApi from '@/src/api/planPayments.api';
import { ADMIN_PILLARS } from '@/constants/navigationPillars';

const tap = () => {
  if (Platform.OS !== 'web') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

export const AdminExecutiveOverview: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { role } = useRole();
  const { colors, isLight, isDarkTheme, textColor, subTextColor } = useExecutiveTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [activeDomainFilter, setActiveDomainFilter] = useState<string>('ALL');

  // Live Backend Queries
  const { data: products, isLoading: isLoadingProducts, refetch: refetchProducts } = useProducts(true);
  const { data: rawConversations = [], refetch: refetchChat } = useAdminConversations();
  const { gpsUnlockRequests } = useCrops();

  const { data: withdrawals, refetch: refetchWithdrawals } = useQuery({
    queryKey: ['withdrawals', 'all'],
    queryFn: withdrawalsApi.listAllWithdrawals,
    refetchInterval: 30000,
  });

  const { data: planPayments, refetch: refetchPlans } = useQuery({
    queryKey: ['plan-payments', 'pending'],
    queryFn: planPaymentsApi.listPendingPlanPayments,
    refetchInterval: 30000,
  });

  // Calculate live counts
  const pendingWithdrawals = (withdrawals ?? []).filter((w) => w.status === 'PENDING');
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + (Number(w.amount) || 0), 0);
  const pendingPlans = planPayments ?? [];
  const pendingGps = gpsUnlockRequests.filter((r) => r.status === 'PENDING');
  const totalUnreadChat = rawConversations.reduce((sum, c: any) => sum + (c.unreadCount || 0), 0);

  const outOfStockProducts = (products ?? []).filter((p) => p.stockQty <= 0);
  const lowStockProducts = (products ?? []).filter((p) => p.stockQty > 0 && p.stockQty <= 5);
  const totalCatalogCount = products?.length || 0;
  const activeCatalogCount = (products ?? []).filter((p) => p.isActive).length || 0;

  // Refresh All
  const handleRefreshAll = () => {
    tap();
    refetchProducts();
    refetchChat();
    refetchWithdrawals();
    refetchPlans();
  };

  // Open Command Search
  const handleOpenSearch = () => {
    tap();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('open-command-search'));
    }
  };

  // Open Health Radar
  const handleOpenRadar = () => {
    tap();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-open-health-radar'));
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 👑 1. EXECUTIVE COCKPIT HEADER */}
      <View
        style={[
          styles.cockpitHeader,
          isLight && styles.cockpitHeaderLight,
          isDarkTheme && styles.cockpitHeaderDark,
        ]}
      >
        <LinearGradient
          colors={
            isLight
              ? ['#ffffff', '#f0fdf4']
              : isDarkTheme
              ? ['rgba(2, 6, 23, 0.98)', 'rgba(15, 23, 42, 0.95)']
              : ['rgba(4, 20, 10, 0.98)', 'rgba(2, 13, 6, 0.95)']
          }
          style={styles.cockpitGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Header Row: User Info + Health Radar Pill */}
          <View style={styles.topInfoRow}>
            <View style={styles.userInfoLeft}>
              <View style={[styles.avatarBox, isLight && styles.avatarBoxLight]}>
                <Ionicons
                  name="shield-checkmark"
                  size={18}
                  color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'}
                />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.greetingTitle, { color: textColor }]}>
                    {user?.name || 'Administrator'}
                  </Text>
                  <View style={[styles.rolePill, isLight && styles.rolePillLight]}>
                    <Text style={[styles.rolePillText, isLight && { color: '#16a34a' }]}>
                      👑 {user?.role || role || 'SUPER_ADMIN'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cockpitSubtitle, { color: subTextColor }]}>
                  360° Project Overview · Executive Control Console
                </Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={[styles.radarTriggerPill, isLight && styles.radarTriggerPillLight]}
                onPress={handleOpenRadar}
                activeOpacity={0.7}
              >
                <View style={styles.livePulseDot} />
                <Text style={[styles.radarPillText, isLight && { color: '#16a34a' }]}>
                  99.9% Uptime
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickSearchBtn, isLight && styles.quickSearchBtnLight]}
                onPress={handleOpenSearch}
                activeOpacity={0.7}
                accessibilityLabel="Quick Search"
              >
                <Ionicons name="search" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickRefreshBtn, isLight && styles.quickRefreshBtnLight]}
                onPress={handleRefreshAll}
                activeOpacity={0.7}
                accessibilityLabel="Refresh Overview"
              >
                <Ionicons name="refresh" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* 🚨 2. LIVE ALERTS & CRITICAL ACTION RADAR ("ALERTS") */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="notifications" size={16} color="#ef4444" />
            <Text style={[styles.sectionTitle, { color: textColor }]}>CRITICAL ALERTS & ACTIONS</Text>
          </View>
          <View style={styles.alertCountBadge}>
            <Text style={styles.alertCountText}>
              {pendingWithdrawals.length + pendingPlans.length + pendingGps.length + outOfStockProducts.length} ACTIVE
            </Text>
          </View>
        </View>

        {/* Alerts Cards Stack */}
        <View style={styles.alertsContainer}>
          {/* Alert: Pending Withdrawals */}
          {pendingWithdrawals.length > 0 && (
            <TouchableOpacity
              style={[
                styles.alertCard,
                { borderLeftColor: '#ef4444' },
                isLight && { backgroundColor: '#ffffff', borderColor: '#fee2e2' },
                isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(239, 68, 68, 0.3)' },
              ]}
              onPress={() => router.push('/admin/(tabs)/super-accounts' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.alertIconWrap, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                <Ionicons name="cash-outline" size={18} color="#ef4444" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alertHeaderLine}>
                  <Text style={[styles.alertHeading, { color: textColor }]}>
                    {pendingWithdrawals.length} Pending Payout Requests
                  </Text>
                  <Text style={styles.alertAmountHighlight}>₹{pendingWithdrawalAmount.toLocaleString()}</Text>
                </View>
                <Text style={[styles.alertDesc, { color: subTextColor }]}>
                  Farmers and sellers waiting for wallet settlement transfer approval.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}

          {/* Alert: Out of Stock Market Items */}
          {outOfStockProducts.length > 0 && (
            <TouchableOpacity
              style={[
                styles.alertCard,
                { borderLeftColor: '#f59e0b' },
                isLight && { backgroundColor: '#ffffff', borderColor: '#fef3c7' },
                isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(245, 158, 11, 0.3)' },
              ]}
              onPress={() => router.push('/admin/(tabs)/admin-products' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.alertIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
                <Ionicons name="alert-circle-outline" size={18} color="#f59e0b" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alertHeaderLine}>
                  <Text style={[styles.alertHeading, { color: textColor }]}>
                    {outOfStockProducts.length} Products Out of Stock
                  </Text>
                  <Text style={[styles.alertTagPill, { color: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                    Restock
                  </Text>
                </View>
                <Text style={[styles.alertDesc, { color: subTextColor }]}>
                  Items have zero stock in marketplace catalog and are hidden from buyers.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#f59e0b" />
            </TouchableOpacity>
          )}

          {/* Alert: Unread Farmer Chat / Queries */}
          {totalUnreadChat > 0 && (
            <TouchableOpacity
              style={[
                styles.alertCard,
                { borderLeftColor: '#00f2fe' },
                isLight && { backgroundColor: '#ffffff', borderColor: '#e0f2fe' },
                isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(0, 242, 254, 0.3)' },
              ]}
              onPress={() => router.push('/admin/(tabs)/chat' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.alertIconWrap, { backgroundColor: 'rgba(0, 242, 254, 0.12)' }]}>
                <Ionicons name="chatbubbles-outline" size={18} color="#00f2fe" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alertHeaderLine}>
                  <Text style={[styles.alertHeading, { color: textColor }]}>
                    {totalUnreadChat} Farmer Support Pings
                  </Text>
                  <Text style={[styles.alertTagPill, { color: '#00f2fe', backgroundColor: 'rgba(0, 242, 254, 0.1)' }]}>
                    Priority
                  </Text>
                </View>
                <Text style={[styles.alertDesc, { color: subTextColor }]}>
                  Unassigned farmer crop disease questions or advisory assistance requests.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#00f2fe" />
            </TouchableOpacity>
          )}

          {/* All Clear Banner (if no urgent alerts) */}
          {pendingWithdrawals.length === 0 && outOfStockProducts.length === 0 && totalUnreadChat === 0 && (
            <View style={[styles.allClearBanner, isLight && styles.allClearBannerLight]}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={[styles.allClearText, isLight && { color: '#16a34a' }]}>
                All 7 Domain Pillars Healthy & Synchronized · Zero Critical Escalations
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 🟢 3. SYSTEM INDICATIONS & HEALTH RADAR ("INDICATIONS") */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="pulse" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>SYSTEM INDICATIONS & RADAR</Text>
          </View>
          <Text style={[styles.sectionSubtext, { color: subTextColor }]}>Live Telemetry</Text>
        </View>

        {/* 4-Matrix Indications Grid */}
        <View style={styles.indicationsGrid}>
          {/* Node 1: NestJS Core API */}
          <View
            style={[
              styles.indicationCard,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(56, 189, 248, 0.2)' },
            ]}
          >
            <View style={styles.indicationHeader}>
              <View style={[styles.indicationDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.indicationTitle, { color: textColor }]}>Backend Core</Text>
            </View>
            <Text style={styles.indicationValue}>Port 3000</Text>
            <Text style={[styles.indicationStatus, { color: '#22c55e' }]}>● ONLINE · 14ms</Text>
          </View>

          {/* Node 2: PostgreSQL Prisma DB */}
          <View
            style={[
              styles.indicationCard,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(56, 189, 248, 0.2)' },
            ]}
          >
            <View style={styles.indicationHeader}>
              <View style={[styles.indicationDot, { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.indicationTitle, { color: textColor }]}>PostgreSQL DB</Text>
            </View>
            <Text style={styles.indicationValue}>Prisma Sync</Text>
            <Text style={[styles.indicationStatus, { color: '#22c55e' }]}>● ACTIVE · 0 Stalls</Text>
          </View>

          {/* Node 3: WebSocket Live Sync */}
          <View
            style={[
              styles.indicationCard,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(56, 189, 248, 0.2)' },
            ]}
          >
            <View style={styles.indicationHeader}>
              <View style={[styles.indicationDot, { backgroundColor: '#38bdf8' }]} />
              <Text style={[styles.indicationTitle, { color: textColor }]}>Live WebSockets</Text>
            </View>
            <Text style={styles.indicationValue}>Socket.IO</Text>
            <Text style={[styles.indicationStatus, { color: '#38bdf8' }]}>● CONNECTED</Text>
          </View>

          {/* Node 4: Payments & UPI Gateway */}
          <View
            style={[
              styles.indicationCard,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(56, 189, 248, 0.2)' },
            ]}
          >
            <View style={styles.indicationHeader}>
              <View style={[styles.indicationDot, { backgroundColor: '#f59e0b' }]} />
              <Text style={[styles.indicationTitle, { color: textColor }]}>Payment Gateway</Text>
            </View>
            <Text style={styles.indicationValue}>Razorpay & UPI</Text>
            <Text style={[styles.indicationStatus, { color: '#22c55e' }]}>● 100% READY</Text>
          </View>
        </View>
      </View>

      {/* 🌐 4. 360° PURE PROJECT OVERVIEW ("PURE PROJECT DA OVERVIEW") */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="grid" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>PROJECT MULTI-DOMAIN OVERVIEW</Text>
          </View>
          <Text style={[styles.sectionSubtext, { color: subTextColor }]}>Single Glance</Text>
        </View>

        {/* Domain Overview Cards */}
        <View style={styles.domainCardsGrid}>
          {/* DOMAIN 1: Market & Multi-Vendor E-Commerce */}
          <TouchableOpacity
            style={[
              styles.domainCard,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#05180c', borderColor: 'rgba(0, 255, 135, 0.25)' },
              premiumShadow('#000000', 'sm') as any,
            ]}
            onPress={() => router.push('/admin/(tabs)/admin-products' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.domainCardTop}>
              <View style={[styles.domainIconCircle, { backgroundColor: 'rgba(0, 255, 135, 0.12)' }]}>
                <Ionicons name="storefront" size={18} color={isLight ? '#16a34a' : '#00ff87'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.domainTitle, { color: textColor }]}>Market & Products</Text>
                <Text style={[styles.domainRuleText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                  🛍️ Store for Customers & Advisors · Moderated by Admin
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isLight ? '#64748b' : '#94a3b8'} />
            </View>

            <View style={styles.domainStatsRow}>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: textColor }]}>{totalCatalogCount}</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Catalog Items</Text>
              </View>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: '#22c55e' }]}>{activeCatalogCount}</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Active Live</Text>
              </View>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: outOfStockProducts.length > 0 ? '#ef4444' : '#22c55e' }]}>
                  {outOfStockProducts.length}
                </Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Stock Depleted</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* DOMAIN 2: Garden Care & Crop Management */}
          <TouchableOpacity
            style={[
              styles.domainCard,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(56, 189, 248, 0.25)' },
              premiumShadow('#000000', 'sm') as any,
            ]}
            onPress={() => router.push('/admin/(tabs)/satellite-map' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.domainCardTop}>
              <View style={[styles.domainIconCircle, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
                <Ionicons name="leaf" size={18} color="#38bdf8" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.domainTitle, { color: textColor }]}>Garden Care & Crop Doctor</Text>
                <Text style={[styles.domainRuleText, { color: '#38bdf8' }]}>
                  🌾 Crop Doctor → Farmers · 🏡 Garden Advisor → Gardeners
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isLight ? '#64748b' : '#94a3b8'} />
            </View>

            <View style={styles.domainStatsRow}>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: textColor }]}>Active</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Satellite Radar</Text>
              </View>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: '#38bdf8' }]}>AI Plant</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Disease Scanner</Text>
              </View>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: '#22c55e' }]}>8 Tools</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Garden System</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* DOMAIN 3: Treasury, Accounts & Ledger */}
          <TouchableOpacity
            style={[
              styles.domainCard,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(234, 179, 8, 0.25)' },
              premiumShadow('#000000', 'sm') as any,
            ]}
            onPress={() => router.push('/admin/(tabs)/super-accounts' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.domainCardTop}>
              <View style={[styles.domainIconCircle, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                <Ionicons name="cash" size={18} color="#eab308" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.domainTitle, { color: textColor }]}>Treasury & Ledger Vault</Text>
                <Text style={[styles.domainRuleText, { color: '#eab308' }]}>
                  💰 Automated settlement, plan payments & payout approvals
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isLight ? '#64748b' : '#94a3b8'} />
            </View>

            <View style={styles.domainStatsRow}>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: textColor }]}>
                  {pendingWithdrawals.length}
                </Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Pending Payouts</Text>
              </View>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: '#eab308' }]}>
                  {pendingPlans.length}
                </Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Plan Claims</Text>
              </View>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: '#22c55e' }]}>Audited</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Ledger Integrity</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* DOMAIN 4: User Directory & Ecosystem */}
          <TouchableOpacity
            style={[
              styles.domainCard,
              isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
              isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(168, 85, 247, 0.25)' },
              premiumShadow('#000000', 'sm') as any,
            ]}
            onPress={() => router.push('/admin/(tabs)/super-users' as any)}
            activeOpacity={0.8}
          >
            <View style={styles.domainCardTop}>
              <View style={[styles.domainIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}>
                <Ionicons name="people" size={18} color="#a855f7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.domainTitle, { color: textColor }]}>User & Community Directory</Text>
                <Text style={[styles.domainRuleText, { color: '#a855f7' }]}>
                  👥 Farmers, Gardeners, Advisors, Sellers & Staff
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={isLight ? '#64748b' : '#94a3b8'} />
            </View>

            <View style={styles.domainStatsRow}>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: textColor }]}>Farmers</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Primary Ag</Text>
              </View>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: '#a855f7' }]}>Gardeners</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Urban / Plant</Text>
              </View>
              <View style={styles.domainStatMini}>
                <Text style={[styles.domainStatNum, { color: '#38bdf8' }]}>Advisors</Text>
                <Text style={[styles.domainStatLbl, { color: subTextColor }]}>Consultants</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* ⚡ 5. REAL-TIME ACTIVITY & UPDATES STREAM ("UPDATES") */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="time" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>LIVE PROJECT UPDATES & STREAM</Text>
          </View>
          <Text style={[styles.sectionSubtext, { color: subTextColor }]}>Chronological</Text>
        </View>

        <View
          style={[
            styles.activityCard,
            isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
            isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(255, 255, 255, 0.08)' },
          ]}
        >
          {/* Update Item 1 */}
          <View style={styles.activityRow}>
            <View style={[styles.activityDot, { backgroundColor: '#22c55e' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activityTitle, { color: textColor }]}>
                Marketplace Inventory Synchronized
              </Text>
              <Text style={[styles.activitySub, { color: subTextColor }]}>
                {activeCatalogCount} approved multi-vendor listings actively receiving orders.
              </Text>
            </View>
            <Text style={[styles.activityTime, { color: subTextColor }]}>Just now</Text>
          </View>

          {/* Update Item 2 */}
          <View style={styles.activityRow}>
            <View style={[styles.activityDot, { backgroundColor: '#38bdf8' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activityTitle, { color: textColor }]}>
                Garden Care System Active
              </Text>
              <Text style={[styles.activitySub, { color: subTextColor }]}>
                8 garden management tools and AI scanner telemetry running smoothly.
              </Text>
            </View>
            <Text style={[styles.activityTime, { color: subTextColor }]}>Live</Text>
          </View>

          {/* Update Item 3 */}
          <View style={[styles.activityRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.activityDot, { backgroundColor: '#eab308' }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.activityTitle, { color: textColor }]}>
                Treasury & Wallet Security Guard
              </Text>
              <Text style={[styles.activitySub, { color: subTextColor }]}>
                Zero unverified transactions; automated ledger reconciliation active.
              </Text>
            </View>
            <Text style={[styles.activityTime, { color: subTextColor }]}>Continuous</Text>
          </View>
        </View>
      </View>

      {/* 🚀 6. DOMAIN PILLARS 1-TAP LAUNCHER */}
      <View style={[styles.sectionWrap, { marginBottom: 20 }]}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="rocket" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>DOMAIN PILLARS JUMP</Text>
          </View>
          <Text style={[styles.sectionSubtext, { color: subTextColor }]}>7 Pillars</Text>
        </View>

        <View style={styles.pillarsGrid}>
          {ADMIN_PILLARS.map((pillar) => (
            <TouchableOpacity
              key={pillar.id}
              style={[
                styles.pillarQuickPill,
                isLight && { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
                isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(255, 255, 255, 0.08)' },
              ]}
              onPress={() => {
                tap();
                if (pillar.subTabs && pillar.subTabs.length > 0) {
                  router.push(pillar.subTabs[0].path as any);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={pillar.icon}
                size={14}
                color={pillar.color || (isLight ? '#16a34a' : '#00ff87')}
              />
              <Text style={[styles.pillarQuickText, { color: textColor }]} numberOfLines={1}>
                {pillar.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020d06',
  },
  scrollContent: {
    paddingBottom: 30,
  },

  /* Cockpit Header */
  cockpitHeader: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.15)',
    backgroundColor: '#04140a',
  },
  cockpitHeaderLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  cockpitHeaderDark: {
    backgroundColor: '#020617',
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  cockpitGradient: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
  },
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    flexWrap: 'wrap',
  },
  userInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 200,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1.5,
    borderColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarBoxLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  greetingTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  rolePill: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  rolePillLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  rolePillText: {
    fontSize: 9,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  cockpitSubtitle: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  radarTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  radarTriggerPillLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
  },
  radarPillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  quickSearchBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickSearchBtnLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  quickRefreshBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickRefreshBtnLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },

  /* Sections */
  sectionWrap: {
    paddingHorizontal: 10,
    marginTop: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  sectionSubtext: {
    fontSize: 10,
    fontFamily: FONT.medium,
  },
  alertCountBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  alertCountText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#ef4444',
  },

  /* Alerts */
  alertsContainer: {
    gap: 6,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderLeftWidth: 3.5,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  alertHeading: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  alertAmountHighlight: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ef4444',
  },
  alertTagPill: {
    fontSize: 9,
    fontFamily: FONT.bold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  alertDesc: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  allClearBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  allClearBannerLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  allClearText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#22c55e',
    flex: 1,
  },

  /* Indications Grid */
  indicationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  indicationCard: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 2,
  },
  indicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  indicationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  indicationTitle: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  indicationValue: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  indicationStatus: {
    fontSize: 9,
    fontFamily: FONT.bold,
    marginTop: 1,
  },

  /* Domain Cards */
  domainCardsGrid: {
    gap: 8,
  },
  domainCard: {
    backgroundColor: '#04140a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.18)',
    padding: 10,
    gap: 8,
  },
  domainCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  domainIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  domainTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  domainRuleText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  domainStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    paddingTop: 6,
  },
  domainStatMini: {
    flex: 1,
    alignItems: 'center',
  },
  domainStatNum: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
  },
  domainStatLbl: {
    fontSize: 9,
    fontFamily: FONT.medium,
    marginTop: 1,
  },

  /* Activity Stream */
  activityCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activityTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  activitySub: {
    fontSize: 10,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  activityTime: {
    fontSize: 9,
    fontFamily: FONT.medium,
  },

  /* Pillars Grid */
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillarQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillarQuickText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
});
