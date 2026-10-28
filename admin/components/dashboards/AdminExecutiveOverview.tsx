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
  const [selectedMobilePillar, setSelectedMobilePillar] = useState<string>('EXECUTIVE');

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
      {isDesktop ? (
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
                    Executive Command HQ · 6 Executive Hubs Synchronized
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
      ) : (
        /* 📱 NATIVE APP MOBILE EXECUTIVE HEADER (Slim, non-redundant, app-like elevation) */
        <View
          style={[
            styles.mobileCockpitBar,
            isLight && styles.mobileCockpitBarLight,
            isDarkTheme && styles.mobileCockpitBarDark,
          ]}
        >
          <View style={styles.mobileUserIdentity}>
            <View style={[styles.mobileAvatarBox, isLight && styles.mobileAvatarBoxLight]}>
              <Ionicons
                name="shield-checkmark"
                size={14}
                color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'}
              />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.mobileGreetingTitle, { color: textColor }]} numberOfLines={1}>
                  {user?.name?.split(' ')[0] || 'Administrator'}
                </Text>
                <View style={[styles.mobileRoleBadge, isLight && styles.mobileRoleBadgeLight]}>
                  <Text style={[styles.mobileRoleBadgeText, isLight && { color: '#16a34a' }]}>
                    👑 {user?.role || role || 'SUPER_ADMIN'}
                  </Text>
                </View>
              </View>
              <Text style={[styles.mobileSubtitle, { color: subTextColor }]} numberOfLines={1}>
                Command HQ · 5 Executive Hubs Real-Time
              </Text>
            </View>
          </View>

          <View style={styles.mobileRightActions}>
            <TouchableOpacity
              style={[styles.mobileRadarBadge, isLight && styles.mobileRadarBadgeLight]}
              onPress={handleOpenRadar}
              activeOpacity={0.75}
            >
              <View style={styles.livePulseDot} />
              <Text style={[styles.mobileRadarBadgeText, isLight && { color: '#16a34a' }]}>99.9%</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileRefreshBtn, isLight && styles.mobileRefreshBtnLight]}
              onPress={handleRefreshAll}
              activeOpacity={0.75}
              accessibilityLabel="Refresh Overview"
            >
              <Ionicons name="refresh" size={14} color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 📊 2. TOP EXECUTIVE 4-METRIC STRIP */}
      <View style={styles.sectionWrap}>
        <View style={[styles.kpiGrid, !isDesktop && styles.kpiGridMobile]}>
          {/* KPI 1: Catalog & Products */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              !isDesktop && styles.kpiCardMobile,
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
              !isDesktop && styles.kpiCardMobile,
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
              !isDesktop && styles.kpiCardMobile,
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
              !isDesktop && styles.kpiCardMobile,
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
                All 5 Executive Hubs Synchronized & Healthy · Zero Critical Escalations
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
            <Text style={[styles.sectionTitle, { color: textColor }]}>{ADMIN_PILLARS.length} COMMAND HUBS</Text>
          </View>
          {!isDesktop && (
            <TouchableOpacity
              style={[
                styles.mobileHubsToggleBtn,
                isLight && styles.mobileHubsToggleBtnLight,
                isDarkTheme && styles.mobileHubsToggleBtnDark,
              ]}
              onPress={() => {
                tap();
                setSelectedMobilePillar(selectedMobilePillar === 'ALL' ? 'EXECUTIVE' : 'ALL');
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={selectedMobilePillar === 'ALL' ? 'layers' : 'grid'}
                size={11}
                color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'}
              />
              <Text
                style={[
                  styles.mobileHubsToggleText,
                  isLight && { color: '#16a34a' },
                  isDarkTheme && { color: '#38bdf8' },
                ]}
              >
                {selectedMobilePillar === 'ALL' ? 'Tab View' : 'All Hubs'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {!isDesktop && selectedMobilePillar !== 'ALL' ? (
          /* 📱 NATIVE APP MOBILE HUB WORKSPACE (Segmented Bar + 2-Column App Action Grid) */
          <View style={styles.mobileHubsWrapper}>
            {/* Horizontal Hub Switcher Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mobileHubSelectorScroll}
            >
              {ADMIN_PILLARS.map((hub) => {
                const isSelected = selectedMobilePillar === hub.id;
                return (
                  <TouchableOpacity
                    key={hub.id}
                    style={[
                      styles.mobileHubTabBtn,
                      isSelected && [
                        styles.mobileHubTabBtnActive,
                        { borderColor: hub.color, backgroundColor: `${hub.color}18` },
                      ],
                      isLight && !isSelected && styles.mobileHubTabBtnLight,
                    ]}
                    onPress={() => {
                      tap();
                      setSelectedMobilePillar(hub.id);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={isSelected ? (hub.iconFilled || hub.icon) : hub.icon}
                      size={13}
                      color={isSelected ? hub.color : isLight ? '#64748b' : '#94a3b8'}
                    />
                    <Text
                      style={[
                        styles.mobileHubTabText,
                        isSelected && { color: hub.color, fontFamily: FONT.bold },
                        isLight && !isSelected && { color: '#64748b' },
                      ]}
                    >
                      {hub.shortTitle || hub.title}
                    </Text>
                    <View style={[styles.mobileHubCountBadge, isSelected && { backgroundColor: `${hub.color}25` }]}>
                      <Text style={[styles.mobileHubCountText, isSelected && { color: hub.color }]}>
                        {hub.subTabs.length}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Active Hub Card Summary */}
            {(() => {
              const currentHub = ADMIN_PILLARS.find((p) => p.id === selectedMobilePillar) || ADMIN_PILLARS[0];
              return (
                <View
                  style={[
                    styles.activeHubHeroCard,
                    isLight && styles.activeHubHeroCardLight,
                    isDarkTheme && styles.activeHubHeroCardDark,
                    { borderLeftColor: currentHub.color },
                  ]}
                >
                  <View style={styles.activeHubHeroTop}>
                    <View style={[styles.hubHeroIconBox, { backgroundColor: `${currentHub.color}15`, borderColor: `${currentHub.color}35` }]}>
                      <Ionicons name={currentHub.iconFilled || currentHub.icon} size={18} color={currentHub.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.activeHubHeroTitle, { color: textColor }]}>
                        {currentHub.title}
                      </Text>
                      <Text style={[styles.activeHubHeroDesc, { color: subTextColor }]}>
                        {currentHub.badge} · {currentHub.subTabs.length} Master Tools
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.openHubWorkspaceBtn, { backgroundColor: `${currentHub.color}15`, borderColor: `${currentHub.color}40` }]}
                      onPress={() => {
                        if (currentHub.subTabs.length > 0) {
                          handleNavigateTab(currentHub.subTabs[0]);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.openHubBtnText, { color: currentHub.color }]}>Launch</Text>
                      <Ionicons name="arrow-forward" size={11} color={currentHub.color} />
                    </TouchableOpacity>
                  </View>

                  {/* 2-Column App Grid of Tools */}
                  <View style={styles.mobileToolsGrid}>
                    {currentHub.subTabs.map((tab) => (
                      <TouchableOpacity
                        key={tab.id}
                        style={[
                          styles.mobileToolCard,
                          isLight && styles.mobileToolCardLight,
                          isDarkTheme && styles.mobileToolCardDark,
                        ]}
                        onPress={() => handleNavigateTab(tab)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.mobileToolIconSquircle, { backgroundColor: `${currentHub.color}12` }]}>
                          <Ionicons name={tab.icon} size={15} color={currentHub.color} />
                        </View>
                        <View style={styles.mobileToolTextCol}>
                          <Text style={[styles.mobileToolTitle, { color: textColor }]} numberOfLines={1}>
                            {tab.shortTitle || tab.title}
                          </Text>
                          <Text style={[styles.mobileToolSubtitle, { color: subTextColor }]} numberOfLines={1}>
                            {tab.description || tab.title}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={12} color={isLight ? '#94a3b8' : '#64748b'} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              );
            })()}
          </View>
        ) : (
          /* Desktop or All-Hubs Grid */
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
                  {hub.subTabs.map((tab) => (
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
        )}
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
    paddingBottom: Platform.OS === 'web' ? 16 : (Platform.OS === 'ios' ? 68 : 52),
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
    paddingTop: 8,
    paddingBottom: 8,
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
    paddingHorizontal: 14,
    marginTop: 18,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  sectionSubtext: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
  },
  alertCountBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  alertCountText: {
    fontSize: 8,
    fontFamily: FONT.extraBold,
    color: '#ef4444',
  },

  /* 4-KPI Grid */
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#04150b',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    padding: 13,
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
    marginBottom: 4,
  },
  kpiIconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
  },
  kpiValue: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.3,
  },
  kpiSubtext: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    marginTop: 1.5,
  },

  /* Alerts */
  alertsContainer: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#03140a',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    borderLeftWidth: 3.5,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  alertIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 7,
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
    gap: 12,
  },
  hubCard: {
    backgroundColor: '#04150b',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    padding: 14,
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
    width: 30,
    height: 30,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTitle: {
    fontSize: 12,
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
    gap: 8,
  },
  hubChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 11,
    paddingVertical: 7,
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
    gap: 10,
    marginTop: 10,
  },
  telemetryCard: {
    flex: 1,
    minWidth: 140,
    backgroundColor: '#020b06',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.12)',
    padding: 12,
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

  /* 📱 Dedicated Mobile Executive Bar Styles */
  mobileCockpitBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#03140a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.16)',
  },
  mobileCockpitBarLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  mobileCockpitBarDark: {
    backgroundColor: '#020617',
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  mobileUserIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  mobileAvatarBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1.2,
    borderColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileAvatarBoxLight: {
    backgroundColor: '#f0fdf4',
    borderColor: '#16a34a',
  },
  mobileGreetingTitle: {
    fontSize: 12.5,
    fontFamily: FONT.extraBold,
  },
  mobileRoleBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 4,
    paddingVertical: 0.5,
    borderRadius: RADIUS.pill,
  },
  mobileRoleBadgeLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  mobileRoleBadgeText: {
    fontSize: 8,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  mobileSubtitle: {
    fontSize: 9,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  mobileRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mobileRadarBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3.5,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
  },
  mobileRadarBadgeLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  mobileRadarBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  mobileRefreshBtn: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileRefreshBtnLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },

  /* 📱 2x2 Mobile KPI Grid Styles */
  kpiGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  kpiCardMobile: {
    flex: undefined,
    width: '48.5%',
    minWidth: 0,
    padding: 12,
    borderRadius: RADIUS.lg,
  },

  /* 📱 Mobile Hubs Switcher & Grid */
  mobileHubsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  mobileHubsToggleBtnLight: {
    backgroundColor: '#f0fdf4',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  mobileHubsToggleBtnDark: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  mobileHubsToggleText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  mobileHubsWrapper: {
    gap: 10,
  },
  mobileHubSelectorScroll: {
    gap: 6,
    paddingVertical: 2,
  },
  mobileHubTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mobileHubTabBtnActive: {
    borderWidth: 1.2,
  },
  mobileHubTabBtnLight: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  mobileHubTabText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  mobileHubCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 0.5,
    borderRadius: 8,
  },
  mobileHubCountText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  activeHubHeroCard: {
    backgroundColor: '#04150b',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    borderLeftWidth: 3.5,
    padding: 15,
  },
  activeHubHeroCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  activeHubHeroCardDark: {
    backgroundColor: '#020617',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  activeHubHeroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  hubHeroIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeHubHeroTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  activeHubHeroDesc: {
    fontSize: 10,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  openHubWorkspaceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  openHubBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  mobileToolsGrid: {
    gap: 10,
  },
  mobileToolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mobileToolCardLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  mobileToolCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(56, 189, 248, 0.12)',
  },
  mobileToolIconSquircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileToolTextCol: {
    flex: 1,
  },
  mobileToolTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  mobileToolSubtitle: {
    fontSize: 9.5,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
});
