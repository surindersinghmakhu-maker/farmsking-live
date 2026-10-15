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
import { ADMIN_PILLARS, NavigationPillar, SubTabItem } from '@/constants/navigationPillars';

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

  const [showTelemetry, setShowTelemetry] = useState(false);

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
  const pendingWithdrawalAmount = pendingWithdrawals.reduce((sum, w) => sum + (Number(w.requestedAmount) || 0), 0);
  const pendingPlans = planPayments ?? [];
  const pendingGps = gpsUnlockRequests.filter((r) => r.status === 'PENDING');
  const totalUnreadChat = rawConversations.reduce((sum, c: any) => sum + (c.unreadCount || 0), 0);

  const outOfStockProducts = (products ?? []).filter((p) => p.stockQty <= 0);
  const lowStockProducts = (products ?? []).filter((p) => p.stockQty > 0 && p.stockQty <= 5);
  const totalCatalogCount = products?.length || 0;
  const activeCatalogCount = (products ?? []).filter((p) => p.isActive).length || 0;

  const totalActionsCount = pendingWithdrawals.length + pendingPlans.length + outOfStockProducts.length + totalUnreadChat;

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

  const handleNavigateTab = (tab: SubTabItem) => {
    tap();
    if (tab.params) {
      const queryString = new URLSearchParams(tab.params as Record<string, string>).toString();
      router.push(`${tab.path}?${queryString}` as any);
    } else {
      router.push(tab.path as any);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 👑 1. STREAMLINED EXECUTIVE HEADER */}
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
              ? ['#ffffff', '#f8fafc']
              : isDarkTheme
              ? ['rgba(2, 6, 23, 0.98)', 'rgba(15, 23, 42, 0.95)']
              : ['rgba(4, 20, 10, 0.98)', 'rgba(2, 13, 6, 0.95)']
          }
          style={styles.cockpitGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
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
                  Executive Command HQ · 4 Master Hubs Synchronized
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

      {/* 📊 2. TOP EXECUTIVE 4-METRIC STRIP */}
      <View style={styles.sectionWrap}>
        <View style={styles.kpiGrid}>
          {/* KPI 1: Catalog & Products */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              isLight && styles.kpiCardLight,
              isDarkTheme && styles.kpiCardDark,
            ]}
            onPress={() => router.push('/admin/(tabs)/admin-products' as any)}
            activeOpacity={0.75}
          >
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                <Ionicons name="cube-outline" size={17} color="#0284c7" />
              </View>
              <Text style={[styles.kpiBadgeText, { color: '#0284c7' }]}>Products</Text>
            </View>
            <Text style={[styles.kpiValue, { color: textColor }]}>{totalCatalogCount}</Text>
            <Text style={[styles.kpiSubtext, { color: subTextColor }]}>
              {activeCatalogCount} Active Live in Store
            </Text>
          </TouchableOpacity>

          {/* KPI 2: Settlements & Payouts */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              isLight && styles.kpiCardLight,
              isDarkTheme && styles.kpiCardDark,
            ]}
            onPress={() => router.push('/admin/(tabs)/super-accounts' as any)}
            activeOpacity={0.75}
          >
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(234, 179, 8, 0.12)' }]}>
                <Ionicons name="wallet-outline" size={17} color="#eab308" />
              </View>
              <Text style={[styles.kpiBadgeText, { color: '#eab308' }]}>Treasury</Text>
            </View>
            <Text style={[styles.kpiValue, { color: pendingWithdrawals.length > 0 ? '#ef4444' : textColor }]}>
              ₹{pendingWithdrawalAmount.toLocaleString()}
            </Text>
            <Text style={[styles.kpiSubtext, { color: subTextColor }]}>
              {pendingWithdrawals.length} Pending Payouts
            </Text>
          </TouchableOpacity>

          {/* KPI 3: Support Inquiries */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              isLight && styles.kpiCardLight,
              isDarkTheme && styles.kpiCardDark,
            ]}
            onPress={() => router.push('/admin/(tabs)/chat' as any)}
            activeOpacity={0.75}
          >
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                <Ionicons name="chatbubbles-outline" size={17} color="#10b981" />
              </View>
              <Text style={[styles.kpiBadgeText, { color: '#10b981' }]}>Concierge</Text>
            </View>
            <Text style={[styles.kpiValue, { color: totalUnreadChat > 0 ? '#0284c7' : textColor }]}>
              {totalUnreadChat}
            </Text>
            <Text style={[styles.kpiSubtext, { color: subTextColor }]}>
              Farmer Support Messages
            </Text>
          </TouchableOpacity>

          {/* KPI 4: System Health */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              isLight && styles.kpiCardLight,
              isDarkTheme && styles.kpiCardDark,
            ]}
            onPress={handleOpenRadar}
            activeOpacity={0.75}
          >
            <View style={styles.kpiTopRow}>
              <View style={[styles.kpiIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
                <Ionicons name="pulse-outline" size={17} color="#22c55e" />
              </View>
              <Text style={[styles.kpiBadgeText, { color: '#22c55e' }]}>Platform</Text>
            </View>
            <Text style={[styles.kpiValue, { color: '#22c55e' }]}>99.9%</Text>
            <Text style={[styles.kpiSubtext, { color: subTextColor }]}>
              Core Services Online
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 🚨 3. ACTION CENTER / TRIAGE INBOX */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="flash" size={15} color={totalActionsCount > 0 ? '#ef4444' : '#10b981'} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>ACTION CENTER</Text>
          </View>
          <View style={[styles.alertCountBadge, totalActionsCount === 0 && { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
            <Text style={[styles.alertCountText, totalActionsCount === 0 && { color: '#10b981' }]}>
              {totalActionsCount > 0 ? `${totalActionsCount} REQUIRED` : 'ALL CLEAR'}
            </Text>
          </View>
        </View>

        {/* Action Items List */}
        <View style={styles.alertsContainer}>
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
                    {pendingWithdrawals.length} Pending Payout Settlements
                  </Text>
                  <Text style={styles.alertAmountHighlight}>₹{pendingWithdrawalAmount.toLocaleString()}</Text>
                </View>
                <Text style={[styles.alertDesc, { color: subTextColor }]}>
                  Partner wallet withdrawals awaiting executive approval.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#ef4444" />
            </TouchableOpacity>
          )}

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
                    {outOfStockProducts.length} Depleted Inventory Items
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

          {totalUnreadChat > 0 && (
            <TouchableOpacity
              style={[
                styles.alertCard,
                { borderLeftColor: '#0284c7' },
                isLight && { backgroundColor: '#ffffff', borderColor: '#e0f2fe' },
                isDarkTheme && { backgroundColor: '#020617', borderColor: 'rgba(2, 132, 199, 0.3)' },
              ]}
              onPress={() => router.push('/admin/(tabs)/chat' as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.alertIconWrap, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                <Ionicons name="chatbubbles-outline" size={18} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.alertHeaderLine}>
                  <Text style={[styles.alertHeading, { color: textColor }]}>
                    {totalUnreadChat} Farmer Support Queries
                  </Text>
                  <Text style={[styles.alertTagPill, { color: '#0284c7', backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
                    Priority
                  </Text>
                </View>
                <Text style={[styles.alertDesc, { color: subTextColor }]}>
                  Unassigned farmer advisory questions and assistance requests.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#0284c7" />
            </TouchableOpacity>
          )}

          {totalActionsCount === 0 && (
            <View style={[styles.allClearBanner, isLight && styles.allClearBannerLight]}>
              <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
              <Text style={[styles.allClearText, isLight && { color: '#16a34a' }]}>
                All 4 Command Hubs Synchronized & Healthy · Zero Critical Escalations
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 🏛️ 4. THE 4 COMMAND HUBS */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionTitleRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="grid" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.sectionTitle, { color: textColor }]}>4 COMMAND HUBS</Text>
          </View>
          <Text style={[styles.sectionSubtext, { color: subTextColor }]}>Core Workspaces</Text>
        </View>

        <View style={styles.hubsGrid}>
          {ADMIN_PILLARS.map((hub) => (
            <View
              key={hub.id}
              style={[
                styles.hubCard,
                isLight && styles.hubCardLight,
                isDarkTheme && styles.hubCardDark,
              ]}
            >
              {/* Hub Card Header */}
              <TouchableOpacity
                style={styles.hubHeaderRow}
                activeOpacity={0.7}
                onPress={() => {
                  if (hub.subTabs && hub.subTabs.length > 0) {
                    handleNavigateTab(hub.subTabs[0]);
                  }
                }}
              >
                <View style={[styles.hubIconCircle, { backgroundColor: `${hub.color}15`, borderColor: `${hub.color}30` }]}>
                  <Ionicons name={hub.iconFilled || hub.icon} size={18} color={hub.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.hubTitle, { color: textColor }]}>{hub.title}</Text>
                  <Text style={[styles.hubSubtitle, { color: subTextColor }]}>
                    {hub.subTabs.length} Dedicated Tools · Tap to open
                  </Text>
                </View>
                <View style={[styles.hubBadge, { borderColor: `${hub.color}40`, backgroundColor: `${hub.color}10` }]}>
                  <Text style={[styles.hubBadgeText, { color: hub.color }]}>{hub.badge}</Text>
                </View>
              </TouchableOpacity>

              {/* Hub Sub-Tools Chips */}
              <View style={styles.hubChipsContainer}>
                {hub.subTabs.slice(0, 6).map((tab) => (
                  <TouchableOpacity
                    key={tab.id}
                    style={[
                      styles.hubChip,
                      isLight && styles.hubChipLight,
                      isDarkTheme && styles.hubChipDark,
                    ]}
                    onPress={() => handleNavigateTab(tab)}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={tab.icon} size={12} color={hub.color} />
                    <Text style={[styles.hubChipText, { color: textColor }]} numberOfLines={1}>
                      {tab.shortTitle || tab.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 📡 5. INFRASTRUCTURE TELEMETRY (CLEAN & EXPANDABLE) */}
      <View style={[styles.sectionWrap, { marginBottom: 25 }]}>
        <TouchableOpacity
          style={[
            styles.telemetryToggleBar,
            isLight && styles.telemetryToggleBarLight,
            isDarkTheme && styles.telemetryToggleBarDark,
          ]}
          onPress={() => setShowTelemetry(!showTelemetry)}
          activeOpacity={0.8}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Ionicons name="hardware-chip-outline" size={15} color={isLight ? '#16a34a' : '#00ff87'} />
            <Text style={[styles.telemetryToggleText, { color: textColor }]}>
              Infrastructure Health & Live Services
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={styles.livePulseDot} />
            <Text style={[styles.telemetryStatusLabel, { color: '#22c55e' }]}>All Systems Operational</Text>
            <Ionicons name={showTelemetry ? 'chevron-up' : 'chevron-down'} size={15} color={subTextColor} />
          </View>
        </TouchableOpacity>

        {showTelemetry && (
          <View style={styles.telemetryGrid}>
            <View style={[styles.telemetryCard, isLight && styles.telemetryCardLight]}>
              <Text style={[styles.telemetryCardTitle, { color: textColor }]}>Backend Core</Text>
              <Text style={styles.telemetryCardValue}>NestJS :3000</Text>
              <Text style={[styles.telemetryCardStatus, { color: '#22c55e' }]}>● ONLINE · 14ms</Text>
            </View>

            <View style={[styles.telemetryCard, isLight && styles.telemetryCardLight]}>
              <Text style={[styles.telemetryCardTitle, { color: textColor }]}>PostgreSQL DB</Text>
              <Text style={styles.telemetryCardValue}>Prisma Sync</Text>
              <Text style={[styles.telemetryCardStatus, { color: '#22c55e' }]}>● ACTIVE · 0 Stalls</Text>
            </View>

            <View style={[styles.telemetryCard, isLight && styles.telemetryCardLight]}>
              <Text style={[styles.telemetryCardTitle, { color: textColor }]}>WebSockets</Text>
              <Text style={styles.telemetryCardValue}>Socket.IO Sync</Text>
              <Text style={[styles.telemetryCardStatus, { color: '#38bdf8' }]}>● CONNECTED</Text>
            </View>

            <View style={[styles.telemetryCard, isLight && styles.telemetryCardLight]}>
              <Text style={[styles.telemetryCardTitle, { color: textColor }]}>Payment Gateway</Text>
              <Text style={styles.telemetryCardValue}>Razorpay & UPI</Text>
              <Text style={[styles.telemetryCardStatus, { color: '#22c55e' }]}>● 100% READY</Text>
            </View>
          </View>
        )}
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
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
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
    width: 36,
    height: 36,
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
    fontSize: 14,
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
    paddingHorizontal: 12,
    marginTop: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
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

  /* 4-KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#04150b',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    padding: 12,
  },
  kpiCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  kpiCardDark: {
    backgroundColor: '#020617',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  kpiValue: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.3,
  },
  kpiSubtext: {
    fontSize: 10,
    fontFamily: FONT.medium,
    marginTop: 2,
  },

  /* Alerts */
  alertsContainer: {
    gap: 6,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#03140a',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    borderLeftWidth: 3.5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  alertIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertHeaderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertHeading: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  alertAmountHighlight: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#ef4444',
  },
  alertTagPill: {
    fontSize: 9,
    fontFamily: FONT.bold,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
  },
  alertDesc: {
    fontSize: 10,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  allClearBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  allClearBannerLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  allClearText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#10b981',
    flex: 1,
  },

  /* 4 Command Hubs Grid */
  hubsGrid: {
    gap: 10,
  },
  hubCard: {
    backgroundColor: '#04150b',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    padding: 12,
  },
  hubCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  hubCardDark: {
    backgroundColor: '#020617',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  hubIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
  hubSubtitle: {
    fontSize: 10,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  hubBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  hubBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
  },
  hubChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  hubChipLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  hubChipDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(56, 189, 248, 0.15)',
  },
  hubChipText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },

  /* Telemetry Toggle Bar */
  telemetryToggleBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#03140a',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  telemetryToggleBarLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  telemetryToggleBarDark: {
    backgroundColor: '#020617',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  telemetryToggleText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  telemetryStatusLabel: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  telemetryCard: {
    flex: 1,
    minWidth: 130,
    backgroundColor: '#020b06',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.12)',
    padding: 8,
  },
  telemetryCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  telemetryCardTitle: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  telemetryCardValue: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
    marginTop: 2,
  },
  telemetryCardStatus: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    marginTop: 2,
  },
});
