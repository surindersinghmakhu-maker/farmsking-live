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
import { useUsersList } from '@/src/hooks/useUsersAdmin';
import { useAvailableAdvisors, useFarmerStats } from '@/src/hooks/useAdvisorAssignments';

type HubFilter = 'ALL' | 'FARMERS' | 'DOCTORS';

export default function FarmersCommandHubScreen() {
  const router = useRouter();
  const { colors, themeMode } = useExecutiveTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const isLight = themeMode === 'LIGHT';

  const [activeFilter, setActiveFilter] = useState<HubFilter>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  // Live telemetry queries
  const { data: usersData, isLoading: isUsersLoading, refetch: refetchUsers } = useUsersList({ limit: 1000 });
  const { data: advisorsData, isLoading: isAdvisorsLoading, refetch: refetchAdvisors } = useAvailableAdvisors();
  const { data: farmerStats, refetch: refetchStats } = useFarmerStats();

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchUsers(), refetchAdvisors(), refetchStats()]);
    setRefreshing(false);
  };

  const allUsers = usersData?.items ?? [];

  // Computed live metrics
  const farmersList = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.role === 'FARMER' ||
        (Array.isArray(u.roles) && u.roles.includes('FARMER'))
    );
  }, [allUsers]);

  const doctorsList = useMemo(() => {
    return allUsers.filter(
      (u) =>
        u.role === 'ADVISOR' ||
        (Array.isArray(u.roles) && u.roles.includes('ADVISOR'))
    );
  }, [allUsers]);

  const totalFarmersCount = farmersList.length;
  const totalDoctorsCount = doctorsList.length;
  const availableDoctorsCount = advisorsData?.length ?? doctorsList.filter((d) => !d.deletedAt).length;

  const navigateTo = (path: string, params?: Record<string, string>) => {
    if (params) {
      const qs = new URLSearchParams({ ...params, pillar: 'FARMERS' }).toString();
      router.push(`${path}?${qs}` as any);
    } else {
      router.push(`${path}?pillar=FARMERS` as any);
    }
  };

  const farmerTools = [
    {
      id: 'farmers-directory',
      title: 'Farmers Directory',
      badge: 'Growers',
      description: 'View registered farmers, land acreage, King IDs, and passbooks',
      icon: 'people' as const,
      color: '#16a34a',
      countText: `${totalFarmersCount} Active`,
      action: () => navigateTo('/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'FARMER' }),
    },
    {
      id: 'crop-registry',
      title: 'Crop & Field Registry',
      badge: 'Agronomy',
      description: 'Track crop varieties, sowing dates, plot areas, and field GPS',
      icon: 'leaf' as const,
      color: '#059669',
      countText: 'Field Registry',
      action: () => navigateTo('/admin/(tabs)/super-crop-edit'),
    },
    {
      id: 'ai-disease-scanner',
      title: 'AI Crop Disease Diagnostics',
      badge: 'AI Vision',
      description: 'Neural leaf disease scanner, severity logs, and remedies',
      icon: 'scan' as const,
      color: '#0284c7',
      countText: 'AI Diagnostics',
      action: () => navigateTo('/admin/(tabs)/crop-disease-scanner'),
    },
    {
      id: 'satellite-radar',
      title: 'Satellite Farm Radar',
      badge: 'ISRO GPS',
      description: 'Satellite NDVI vegetation health, soil moisture, and farm boundary radar',
      icon: 'planet' as const,
      color: '#7c3aed',
      countText: 'Space Telemetry',
      action: () => navigateTo('/admin/(tabs)/satellite-map'),
    },
    {
      id: 'spray-doses',
      title: 'Plant Nutrition & Spray Doses',
      badge: 'Dosage',
      description: 'Fertilizer calculator, crop nutrition guide, and spray schedules',
      icon: 'flask' as const,
      color: '#d97706',
      countText: '20-Stage Dose',
      action: () => navigateTo('/admin/(tabs)/dose'),
    },
    {
      id: 'crop-intelligence',
      title: 'Crop Intelligence Engine',
      badge: 'Advisory',
      description: 'Seasonal crop calendar, sowing advisories, and weather insights',
      icon: 'sparkles' as const,
      color: '#0891b2',
      countText: 'Live Advisory',
      action: () => navigateTo('/admin/(tabs)/crop-intelligence'),
    },
    {
      id: 'farmer-orders',
      title: 'Farmer Orders & Supplies',
      badge: 'Fulfillment',
      description: 'Certified seeds, fertilizers, and pesticide shipments to villages',
      icon: 'receipt' as const,
      color: '#e11d48',
      countText: 'Farm Store',
      action: () => navigateTo('/admin/(tabs)/admin-orders'),
    },
    {
      id: 'farmer-wallets',
      title: 'Farmer Wallets & Cashbacks',
      badge: 'Ledgers',
      description: 'Farmer wallet balance sheets, referral bonuses, and cash passbooks',
      icon: 'wallet' as const,
      color: '#4f46e5',
      countText: 'Wallet Accounts',
      action: () => navigateTo('/admin/(tabs)/super-accounts', { section: 'WALLETS' }),
    },
  ];

  const doctorTools = [
    {
      id: 'doctors-directory',
      title: 'Crop Doctors Directory',
      badge: 'Specialists',
      description: 'Registered agronomists, qualifications, verified credentials, and shifts',
      icon: 'medkit' as const,
      color: '#0284c7',
      countText: `${totalDoctorsCount} Verified`,
      action: () => navigateTo('/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'ADVISOR' }),
    },
    {
      id: 'doctor-dispatch',
      title: 'Doctor Dispatch & VIP Visits',
      badge: 'VIP Care',
      description: 'Farmer consultation bookings, emergency farm visits, and VIP passes',
      icon: 'calendar' as const,
      color: '#16a34a',
      countText: 'Consultations',
      action: () => navigateTo('/admin/(tabs)/memberships'),
    },
    {
      id: 'treatment-approval',
      title: 'Disease Treatment Approvals',
      badge: 'Prescriptions',
      description: 'Doctor review of AI diagnostic logs and chemical/organic treatment approval',
      icon: 'shield-checkmark' as const,
      color: '#059669',
      countText: 'Quality Gate',
      action: () => navigateTo('/admin/(tabs)/crop-disease-scanner'),
    },
    {
      id: 'dosage-protocols',
      title: 'Standard Spray Protocols',
      badge: 'Formulas',
      description: 'Doctor-certified standardized spray doses for wheat, paddy, and vegetables',
      icon: 'flask' as const,
      color: '#d97706',
      countText: 'Protocols',
      action: () => navigateTo('/admin/(tabs)/dose'),
    },
    {
      id: 'doctor-payouts',
      title: 'Doctor Fees & Payout Ledgers',
      badge: 'Settlements',
      description: 'Consultation fee disbursements, visit allowances, and partner withdrawals',
      icon: 'card' as const,
      color: '#7c3aed',
      countText: 'Doctor Ledgers',
      action: () => navigateTo('/admin/(tabs)/super-accounts', { section: 'WALLETS' }),
    },
    {
      id: 'mandi-broadcasts',
      title: 'Mandi Rates & Advisory Alerts',
      badge: 'Broadcast',
      description: 'Publish daily mandi commodity prices, weather alerts, and crop advisories',
      icon: 'megaphone' as const,
      color: '#ea580c',
      countText: 'Live Broadcast',
      action: () => navigateTo('/admin/(tabs)/admin_shop'),
    },
  ];

  const visibleFarmerTools = activeFilter === 'DOCTORS' ? [] : farmerTools;
  const visibleDoctorTools = activeFilter === 'FARMERS' ? [] : doctorTools;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: isLight ? '#f8fafc' : '#020b06' }]}
      contentContainerStyle={[styles.contentContainer, isDesktop ? styles.desktopPadding : styles.mobilePadding]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#16a34a" />}
    >
      {/* 🌟 HEADER BANNER */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: isLight ? '#ffffff' : '#04140b',
            borderColor: isLight ? 'rgba(22, 163, 74, 0.2)' : 'rgba(0, 255, 135, 0.2)',
          },
        ]}
      >
        <LinearGradient
          colors={
            isLight
              ? ['rgba(22, 163, 74, 0.08)', 'rgba(2, 132, 199, 0.03)']
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
                    backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.15)',
                    borderColor: isLight ? 'rgba(22, 163, 74, 0.3)' : 'rgba(0, 255, 135, 0.4)',
                  },
                ]}
              >
                <Ionicons name="leaf" size={14} color={isLight ? '#16a34a' : '#00ff87'} />
                <Text style={[styles.badgePillText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
                  Unified Command Hub
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
                  Live Production Data
                </Text>
              </View>
            </View>

            <Text style={[styles.pageTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              Farmers & Crop Doctors Command HQ
            </Text>
            <Text style={[styles.pageSubtitle, { color: isLight ? '#64748b' : '#94a3b8' }]}>
              Unified operations center for farmer fields, crop agronomists, AI diagnostics, and VIP consultations
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleRefresh}
            style={[
              styles.refreshButton,
              {
                backgroundColor: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.05)',
                borderColor: isLight ? 'rgba(22, 163, 74, 0.2)' : 'rgba(0, 255, 135, 0.25)',
              },
            ]}
          >
            {refreshing ? (
              <ActivityIndicator size="small" color={isLight ? '#16a34a' : '#00ff87'} />
            ) : (
              <>
                <Ionicons name="reload" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
                <Text style={[styles.refreshText, { color: isLight ? '#16a34a' : '#00ff87' }]}>Refresh</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 📊 TELEMETRY METRICS 4D ROW */}
        <View style={styles.metricsGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'FARMER' })}
            style={[
              styles.metricCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)',
              },
            ]}
          >
            <View style={styles.metricIconWrap}>
              <Ionicons name="people" size={20} color="#16a34a" />
            </View>
            <Text style={[styles.metricLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>Registered Farmers</Text>
            <Text style={[styles.metricValue, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              {isUsersLoading ? '...' : totalFarmersCount}
            </Text>
            <Text style={[styles.metricSub, { color: '#16a34a' }]}>View Directory →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'ADVISOR' })}
            style={[
              styles.metricCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(2, 132, 199, 0.15)' : 'rgba(56, 189, 248, 0.15)',
              },
            ]}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(2, 132, 199, 0.1)' }]}>
              <Ionicons name="medkit" size={20} color="#0284c7" />
            </View>
            <Text style={[styles.metricLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>Crop Doctors On-Duty</Text>
            <Text style={[styles.metricValue, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              {isAdvisorsLoading ? '...' : totalDoctorsCount}
            </Text>
            <Text style={[styles.metricSub, { color: '#0284c7' }]}>Active Agronomists →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('/admin/(tabs)/memberships')}
            style={[
              styles.metricCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(124, 58, 237, 0.15)' : 'rgba(168, 85, 247, 0.15)',
              },
            ]}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(124, 58, 237, 0.1)' }]}>
              <Ionicons name="calendar" size={20} color="#7c3aed" />
            </View>
            <Text style={[styles.metricLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>VIP Consultations</Text>
            <Text style={[styles.metricValue, { color: isLight ? '#0f172a' : '#f8fafc' }]}>Active</Text>
            <Text style={[styles.metricSub, { color: '#7c3aed' }]}>Doctor Dispatch →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigateTo('/admin/(tabs)/crop-disease-scanner')}
            style={[
              styles.metricCard,
              {
                backgroundColor: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)',
                borderColor: isLight ? 'rgba(217, 119, 6, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              },
            ]}
          >
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(217, 119, 6, 0.1)' }]}>
              <Ionicons name="scan" size={20} color="#d97706" />
            </View>
            <Text style={[styles.metricLabel, { color: isLight ? '#64748b' : '#94a3b8' }]}>AI Plant Diagnostics</Text>
            <Text style={[styles.metricValue, { color: isLight ? '#0f172a' : '#f8fafc' }]}>Online</Text>
            <Text style={[styles.metricSub, { color: '#d97706' }]}>Launch Scanner →</Text>
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
                    ? '#16a34a'
                    : '#00ff87'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor: isLight ? 'rgba(22, 163, 74, 0.2)' : 'rgba(0, 255, 135, 0.2)',
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
            All Command Tools ({farmerTools.length + doctorTools.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter('FARMERS')}
          style={[
            styles.filterTab,
            activeFilter === 'FARMERS' && styles.filterTabActive,
            {
              backgroundColor:
                activeFilter === 'FARMERS'
                  ? '#16a34a'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor: isLight ? 'rgba(22, 163, 74, 0.2)' : 'rgba(0, 255, 135, 0.2)',
            },
          ]}
        >
          <Ionicons
            name="leaf"
            size={16}
            color={activeFilter === 'FARMERS' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'FARMERS' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8',
                fontWeight: activeFilter === 'FARMERS' ? '700' : '600',
              },
            ]}
          >
            Farmer Operations ({farmerTools.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveFilter('DOCTORS')}
          style={[
            styles.filterTab,
            activeFilter === 'DOCTORS' && styles.filterTabActive,
            {
              backgroundColor:
                activeFilter === 'DOCTORS'
                  ? '#0284c7'
                  : isLight
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.05)',
              borderColor: isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(56, 189, 248, 0.2)',
            },
          ]}
        >
          <Ionicons
            name="medkit"
            size={16}
            color={activeFilter === 'DOCTORS' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.filterTabText,
              {
                color: activeFilter === 'DOCTORS' ? '#ffffff' : isLight ? '#64748b' : '#94a3b8',
                fontWeight: activeFilter === 'DOCTORS' ? '700' : '600',
              },
            ]}
          >
            Crop Doctors & Advisory ({doctorTools.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 🌾 SECTION 1: FARMER OPERATIONS TOOLS */}
      {visibleFarmerTools.length > 0 && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(22, 163, 74, 0.12)' }]}>
                <Ionicons name="leaf" size={18} color="#16a34a" />
              </View>
              <Text style={[styles.sectionTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
                Farmer Operations & Field Management
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: isLight ? '#64748b' : '#94a3b8' }]}>
              Manage farmer records, sown acreage, satellite radar telemetry, and fertilizer dosage
            </Text>
          </View>

          <View style={styles.cardsGrid}>
            {visibleFarmerTools.map((tool) => (
              <Pressable
                key={tool.id}
                onPress={tool.action}
                style={({ hovered, pressed }: any) => [
                  styles.toolCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : '#04140b',
                    borderColor: isLight ? 'rgba(22, 163, 74, 0.15)' : 'rgba(0, 255, 135, 0.15)',
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
      )}

      {/* 🩺 SECTION 2: CROP DOCTOR & ADVISORY OPERATIONS */}
      {visibleDoctorTools.length > 0 && (
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                <Ionicons name="medkit" size={18} color="#0284c7" />
              </View>
              <Text style={[styles.sectionTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
                Crop Doctors, Advisory & Dispatch
              </Text>
            </View>
            <Text style={[styles.sectionSubtitle, { color: isLight ? '#64748b' : '#94a3b8' }]}>
              Manage agronomist rosters, farm visit requests, AI diagnosis reviews, and doctor payout ledgers
            </Text>
          </View>

          <View style={styles.cardsGrid}>
            {visibleDoctorTools.map((tool) => (
              <Pressable
                key={tool.id}
                onPress={tool.action}
                style={({ hovered, pressed }: any) => [
                  styles.toolCard,
                  {
                    backgroundColor: isLight ? '#ffffff' : '#04140b',
                    borderColor: isLight ? 'rgba(2, 132, 199, 0.15)' : 'rgba(56, 189, 248, 0.15)',
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
      )}

      {/* 📋 ROSTER PREVIEW SECTION */}
      <View style={styles.sectionWrap}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={[styles.sectionIconBadge, { backgroundColor: 'rgba(124, 58, 237, 0.12)' }]}>
              <Ionicons name="list" size={18} color="#7c3aed" />
            </View>
            <Text style={[styles.sectionTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
              Live Quick Rosters
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: isLight ? '#64748b' : '#94a3b8' }]}>
            Real-time directory snapshots of registered farmers and verified crop agronomists
          </Text>
        </View>

        <View style={[styles.rosterSplitGrid, !isDesktop && { flexDirection: 'column' }]}>
          {/* Farmers Snapshot */}
          <View
            style={[
              styles.rosterCard,
              {
                backgroundColor: isLight ? '#ffffff' : '#04140b',
                borderColor: isLight ? 'rgba(22, 163, 74, 0.2)' : 'rgba(0, 255, 135, 0.2)',
              },
            ]}
          >
            <View style={styles.rosterCardHeader}>
              <View style={styles.rosterHeaderLeft}>
                <Ionicons name="leaf" size={18} color="#16a34a" />
                <Text style={[styles.rosterHeaderTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
                  Recent Farmers ({totalFarmersCount})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigateTo('/admin/(tabs)/super-users', { group: 'CLIENTS', filter: 'FARMER' })}
              >
                <Text style={styles.viewAllLink}>View All →</Text>
              </TouchableOpacity>
            </View>

            {farmersList.slice(0, 4).map((farmer) => (
              <View
                key={farmer.id}
                style={[
                  styles.rosterRow,
                  { borderBottomColor: isLight ? 'rgba(22, 163, 74, 0.08)' : 'rgba(255, 255, 255, 0.05)' },
                ]}
              >
                <View style={styles.avatarPill}>
                  <Text style={styles.avatarPillText}>
                    {(farmer.name || farmer.mobile || 'F').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rosterInfo}>
                  <Text style={[styles.rosterName, { color: isLight ? '#0f172a' : '#f8fafc' }]} numberOfLines={1}>
                    {farmer.name || 'Registered Farmer'}
                  </Text>
                  <Text style={[styles.rosterSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
                    ID: {farmer.kingId || farmer.id.slice(0, 8)} • {farmer.mobile || 'No Phone'}
                  </Text>
                </View>
                <View style={styles.statusPillActive}>
                  <Text style={styles.statusPillActiveText}>Active</Text>
                </View>
              </View>
            ))}

            {farmersList.length === 0 && !isUsersLoading && (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: isLight ? '#94a3b8' : '#64748b' }]}>
                  No registered farmers found
                </Text>
              </View>
            )}
          </View>

          {/* Crop Doctors Snapshot */}
          <View
            style={[
              styles.rosterCard,
              {
                backgroundColor: isLight ? '#ffffff' : '#04140b',
                borderColor: isLight ? 'rgba(2, 132, 199, 0.2)' : 'rgba(56, 189, 248, 0.2)',
              },
            ]}
          >
            <View style={styles.rosterCardHeader}>
              <View style={styles.rosterHeaderLeft}>
                <Ionicons name="medkit" size={18} color="#0284c7" />
                <Text style={[styles.rosterHeaderTitle, { color: isLight ? '#0f172a' : '#f8fafc' }]}>
                  Crop Doctors Roster ({totalDoctorsCount})
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => navigateTo('/admin/(tabs)/super-users', { group: 'PARTNERS', filter: 'ADVISOR' })}
              >
                <Text style={[styles.viewAllLink, { color: '#0284c7' }]}>View All →</Text>
              </TouchableOpacity>
            </View>

            {doctorsList.slice(0, 4).map((doctor) => (
              <View
                key={doctor.id}
                style={[
                  styles.rosterRow,
                  { borderBottomColor: isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(255, 255, 255, 0.05)' },
                ]}
              >
                <View style={[styles.avatarPill, { backgroundColor: 'rgba(2, 132, 199, 0.15)' }]}>
                  <Text style={[styles.avatarPillText, { color: '#0284c7' }]}>
                    {(doctor.name || doctor.mobile || 'D').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.rosterInfo}>
                  <Text style={[styles.rosterName, { color: isLight ? '#0f172a' : '#f8fafc' }]} numberOfLines={1}>
                    Dr. {doctor.name || 'Crop Agronomist'}
                  </Text>
                  <Text style={[styles.rosterSub, { color: isLight ? '#64748b' : '#94a3b8' }]}>
                    ID: {doctor.kingId || doctor.id.slice(0, 8)} • Crop Advisor
                  </Text>
                </View>
                <View style={[styles.statusPillActive, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                  <Text style={[styles.statusPillActiveText, { color: '#0284c7' }]}>Verified</Text>
                </View>
              </View>
            ))}

            {doctorsList.length === 0 && !isUsersLoading && (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: isLight ? '#94a3b8' : '#64748b' }]}>
                  No registered crop doctors found
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
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
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
  rosterSplitGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  rosterCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
  },
  rosterCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rosterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rosterHeaderTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  viewAllLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16a34a',
  },
  rosterRow: {
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
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPillText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
  },
  rosterInfo: {
    flex: 1,
  },
  rosterName: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  rosterSub: {
    fontSize: 11,
  },
  statusPillActive: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  statusPillActiveText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
  },
});
