import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useWindowDimensions,
  RefreshControl,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS } from '@/constants/theme';
import { useSystemIntegrations } from '@/src/hooks/useSystemIntegrations';
import {
  mergeSystemIntegrationsWithDefaults,
  DEFAULT_PROJECT_MASTER_DATA,
  DEFAULT_SYSTEM_INTEGRATIONS_CONFIG,
} from '@/src/api/appSettings.api';
import SettingEntitySetup from '@/components/settings/SettingEntitySetup';
import { ThirdPartyServicesSection } from '@/src/components/ThirdPartyServicesSection';
import SettingOtherSetup from '@/components/settings/SettingOtherSetup';
import SettingFeaturesSetup from '@/components/settings/SettingFeaturesSetup';
import SettingPaymentShareSetup from '@/components/settings/SettingPaymentShareSetup';
import SettingPlanOffersSetup from '@/components/settings/SettingPlanOffersSetup';

// Tab configuration array — allows adding new tabs cleanly whenever needed
export interface SettingsTabItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export const SETTINGS_TABS: SettingsTabItem[] = [
  {
    id: 'ABOUT',
    label: 'About',
    icon: 'information-circle-outline',
    description: 'Corporate profile, technology architecture, statutory details & legal compliance',
  },
  {
    id: 'ENTITY_SETUP',
    label: 'FK Setting',
    icon: 'settings-outline',
    description: 'Master corporate registry, registered address, directors, branding, tax/GST, communication & system rules',
  },
  {
    id: 'FEATURES',
    label: 'Features',
    icon: 'sparkles-outline',
    description: 'Calls & WhatsApp automation, module lockdowns, OTP security & rate limiting',
  },
  {
    id: 'PLAN_OFFERS',
    label: 'Plan & Offers',
    icon: 'pricetag-outline',
    description: 'Subscription plans, free trials, membership passes, referral rewards & promotional offers',
  },
  {
    id: 'PAYMENT_SHARE',
    label: 'Payment Share',
    icon: 'cash-outline',
    description: 'Referral rewards, wallet taxes & TDS, garden expert fee share, marketplace commissions & store rules',
  },
  {
    id: 'TOOLS_API',
    label: 'Tools API',
    icon: 'hardware-chip-outline',
    description: 'Third-party API providers, credentials, gateways & live service configurations',
  },
  {
    id: 'OTHER',
    label: 'Other',
    icon: 'options-outline',
    description: 'Telecom, cloud storage, crop calendars, certificates, backup recovery & system rules',
  },
];

export default function NewSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { themeMode, isLight } = useExecutiveTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState<string>(() => {
    const tabParam = params?.tab?.toUpperCase();
    if (tabParam === 'ENTITY_SETUP' || tabParam === 'ENTITY' || tabParam === 'MASTER_DATA' || tabParam === 'SETTING') {
      return 'ENTITY_SETUP';
    }
    if (tabParam === 'FEATURES' || tabParam === 'FEATURE') {
      return 'FEATURES';
    }
    if (tabParam === 'PLAN_OFFERS' || tabParam === 'PLANS' || tabParam === 'OFFERS' || tabParam === 'PLAN' || tabParam === 'OFFER') {
      return 'PLAN_OFFERS';
    }
    if (tabParam === 'PAYMENT_SHARE' || tabParam === 'PAYMENT' || tabParam === 'SHARE') {
      return 'PAYMENT_SHARE';
    }
    if (tabParam === 'TOOLS_API' || tabParam === 'TOOLS' || tabParam === 'SERVICES' || tabParam === 'API') {
      return 'TOOLS_API';
    }
    if (tabParam === 'OTHER' || tabParam === 'OTHERS' || tabParam === 'SYSTEM' || tabParam === 'MISC') {
      return 'OTHER';
    }
    const found = SETTINGS_TABS.find((t) => t.id === tabParam);
    return found ? found.id : 'ABOUT';
  });

  React.useEffect(() => {
    const tabParam = params?.tab?.toUpperCase();
    if (tabParam === 'ENTITY_SETUP' || tabParam === 'ENTITY' || tabParam === 'MASTER_DATA' || tabParam === 'SETTING') {
      setActiveTab('ENTITY_SETUP');
    } else if (tabParam === 'FEATURES' || tabParam === 'FEATURE') {
      setActiveTab('FEATURES');
    } else if (tabParam === 'PLAN_OFFERS' || tabParam === 'PLANS' || tabParam === 'OFFERS' || tabParam === 'PLAN' || tabParam === 'OFFER') {
      setActiveTab('PLAN_OFFERS');
    } else if (tabParam === 'PAYMENT_SHARE' || tabParam === 'PAYMENT' || tabParam === 'SHARE') {
      setActiveTab('PAYMENT_SHARE');
    } else if (tabParam === 'TOOLS_API' || tabParam === 'TOOLS' || tabParam === 'SERVICES' || tabParam === 'API') {
      setActiveTab('TOOLS_API');
    } else if (tabParam === 'OTHER' || tabParam === 'OTHERS' || tabParam === 'SYSTEM' || tabParam === 'MISC') {
      setActiveTab('OTHER');
    } else if (tabParam === 'ABOUT') {
      setActiveTab('ABOUT');
    }
  }, [params?.tab]);

  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // System integrations query
  const { data: systemConfig, isLoading: isSysLoading, refetch: refetchSys } = useSystemIntegrations();
  const config = useMemo(() => mergeSystemIntegrationsWithDefaults(systemConfig), [systemConfig]);
  const masterData = config.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
  const aboutData = config.about || DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.about;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetchSys();
    setRefreshing(false);
    showToast('⚡ System status and telemetry synchronized!');
  };

  const handleCopy = (label: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`📋 Copied ${label} to clipboard!`);
    } else {
      showToast(`📋 ${label}: ${text}`);
    }
  };

  // Color palette matching FarmsKing Executive Theme
  const textColor = isLight ? '#0f172a' : '#f8fafc';
  const subTextColor = isLight ? '#64748b' : '#94a3b8';
  const cardBg = isLight ? '#ffffff' : '#0f172a';
  const cardBorder = isLight ? '#e2e8f0' : '#1e293b';
  const pageBg = isLight ? '#f8fafc' : '#030712';
  const activeTabBg = isLight ? '#4f46e5' : '#6366f1';
  const accentGreen = isLight ? '#16a34a' : '#10b981';

  return (
    <View style={[styles.container, { backgroundColor: pageBg }]}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={styles.toastCard}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

      {/* Tab Switcher */}
      <View style={[styles.header, { backgroundColor: cardBg, borderBottomColor: cardBorder, paddingTop: 10, paddingBottom: 0 }]}>
        <View style={styles.tabBar}>
          {SETTINGS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                style={[
                  styles.tabItem,
                  isActive && { borderBottomColor: activeTabBg, borderBottomWidth: 3 },
                ]}
                onPress={() => setActiveTab(tab.id)}
              >
                <Ionicons
                  name={tab.icon}
                  size={18}
                  color={isActive ? (isLight ? '#4f46e5' : '#818cf8') : subTextColor}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? (isLight ? '#4f46e5' : '#818cf8') : subTextColor,
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[styles.contentContainer, !isDesktop && styles.contentContainerMobile]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />
        }
      >
        {activeTab === 'ABOUT' && (
          <View style={styles.aboutTabWrapper}>
            {/* 1. Ultra-Compact Executive Hero Bar */}
            <LinearGradient
              colors={isLight ? ['#1e1b4b', '#312e81'] : ['#0f172a', '#020617']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroBanner}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroLeftWrap}>
                  <View style={styles.heroIconBadge}>
                    <Ionicons name="business" size={15} color="#ffffff" />
                  </View>
                  <Text style={styles.heroOrgTitle} numberOfLines={1}>
                    {masterData.companyLegalName || aboutData.companyName || 'FARMSKING TECHNOLOGIES PRIVATE LIMITED'}
                  </Text>
                  <View style={styles.heroBrandChip}>
                    <Text style={styles.heroBrandText}>
                      {masterData.brandDisplayName || masterData.brandName || 'FarmsKing™'}
                    </Text>
                  </View>
                </View>

                {isDesktop && (
                  <View style={styles.heroRightWrap}>
                    <View style={styles.heroStatusBadge}>
                      <View style={styles.liveGreenDot} />
                      <Text style={styles.heroStatusText}>MCA Incorporated</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.heroCinBadge}
                      onPress={() => handleCopy('CIN', masterData.cinNumber || (masterData as any).cin || 'U01100PB2026PTC063294')}
                    >
                      <Text style={styles.heroCinText}>
                        CIN: {masterData.cinNumber || (masterData as any).cin || 'U01100PB2026PTC063294'}
                      </Text>
                      <Ionicons name="copy-outline" size={11} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
                    </TouchableOpacity>
                    <View style={styles.versionChip}>
                      <Text style={styles.versionChipText}>{aboutData.appVersion ? `v${aboutData.appVersion}` : 'v2.4.0'}</Text>
                    </View>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* 2. Compact 4-KPI Metric Strip */}
            <View style={[styles.kpiRow, !isDesktop && styles.kpiRowMobile]}>
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#eef2ff' : '#1e1b4b' }]}>
                  <Ionicons name="shield-checkmark" size={15} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kpiLabel, { color: subTextColor }]}>STATUTORY REGISTRY</Text>
                  <Text style={[styles.kpiValue, { color: textColor }]}>Active & Verified</Text>
                  <Text style={[styles.kpiSub, { color: subTextColor }]} numberOfLines={1}>SRN: {masterData.mcaSrn || 'AC6979718'} · ROC Chd</Text>
                </View>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#ecfdf5' : '#064e3b' }]}>
                  <Ionicons name="cash" size={15} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kpiLabel, { color: subTextColor }]}>AUTHORIZED CAPITAL</Text>
                  <Text style={[styles.kpiValue, { color: textColor }]}>₹1,00,000 INR</Text>
                  <Text style={[styles.kpiSub, { color: subTextColor }]} numberOfLines={1}>1 Lakh Shares @ ₹1 (Clause V)</Text>
                </View>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#f3e8ff' : '#3b0764' }]}>
                  <Ionicons name="leaf" size={15} color="#9333ea" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kpiLabel, { color: subTextColor }]}>APPROVED SCOPE</Text>
                  <Text style={[styles.kpiValue, { color: textColor }]}>Agritech & Mandi</Text>
                  <Text style={[styles.kpiSub, { color: subTextColor }]} numberOfLines={1}>NIC 01612 · 62013 · 63112</Text>
                </View>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                  <Ionicons name="pulse" size={15} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kpiLabel, { color: subTextColor }]}>PLATFORM SLA</Text>
                  <Text style={[styles.kpiValue, { color: '#10b981' }]}>99.9% Uptime</Text>
                  <Text style={[styles.kpiSub, { color: subTextColor }]} numberOfLines={1}>Node 20 · Expo 52 · Prod</Text>
                </View>
              </View>
            </View>

            {/* 3. High-Density 2-Column Bento Grid */}
            <View style={[styles.gridRow, !isDesktop && styles.gridRowMobile]}>
              {/* Left Column: Corporate & Statutory Governance */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#eff6ff' : '#1e293b' }]}>
                    <Ionicons name="shield-checkmark" size={16} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Corporate & Statutory Entity</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]} numberOfLines={1}>
                      Companies Act, 2013 · MCA CRC Manesar & ROC Punjab / Chandigarh
                    </Text>
                  </View>
                  <View style={styles.verifiedTag}>
                    <Ionicons name="checkmark-seal" size={12} color="#10b981" />
                    <Text style={styles.verifiedTagText}>Govt. Regd</Text>
                  </View>
                </View>

                {/* 4-Item Statutory Codes (SRN, CIN, PAN, TAN) */}
                <View style={styles.statCodeGrid}>
                  <TouchableOpacity
                    style={[styles.statCodeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}
                    onPress={() => handleCopy('MCA SRN', masterData.mcaSrn || 'AC6979718')}
                  >
                    <Text style={[styles.statCodeLabel, { color: subTextColor }]}>MCA SRN</Text>
                    <View style={styles.statCodeValWrap}>
                      <Text style={[styles.statCodeValue, { color: textColor }]}>{masterData.mcaSrn || 'AC6979718'}</Text>
                      <Ionicons name="copy-outline" size={11} color="#6366f1" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statCodeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}
                    onPress={() => handleCopy('CIN', masterData.cinNumber || (masterData as any).cin || 'U01100PB2026PTC063294')}
                  >
                    <Text style={[styles.statCodeLabel, { color: subTextColor }]}>CIN</Text>
                    <View style={styles.statCodeValWrap}>
                      <Text style={[styles.statCodeValue, { color: textColor }]}>{masterData.cinNumber || (masterData as any).cin || 'U01100PB2026PTC063294'}</Text>
                      <Ionicons name="copy-outline" size={11} color="#6366f1" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statCodeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}
                    onPress={() => handleCopy('PAN', masterData.companyPan || (masterData as any).panNumber || 'AAJCF0540K')}
                  >
                    <Text style={[styles.statCodeLabel, { color: subTextColor }]}>PAN</Text>
                    <View style={styles.statCodeValWrap}>
                      <Text style={[styles.statCodeValue, { color: textColor }]}>{masterData.companyPan || (masterData as any).panNumber || 'AAJCF0540K'}</Text>
                      <Ionicons name="copy-outline" size={11} color="#6366f1" />
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.statCodeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}
                    onPress={() => handleCopy('TAN', masterData.companyTan || 'ASRF04294G')}
                  >
                    <Text style={[styles.statCodeLabel, { color: subTextColor }]}>TAN</Text>
                    <View style={styles.statCodeValWrap}>
                      <Text style={[styles.statCodeValue, { color: textColor }]}>{masterData.companyTan || 'ASRF04294G'}</Text>
                      <Ionicons name="copy-outline" size={11} color="#6366f1" />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Addresses - Compact Rows */}
                <View style={[styles.addressBlock, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                  <View style={styles.addressHead}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="location-outline" size={13} color="#3b82f6" />
                      <Text style={[styles.addressLabel, { color: subTextColor }]}>REGISTERED OFFICE</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyInlineBtn}
                      onPress={() => handleCopy('Registered Address', masterData.registeredAddress || masterData.registeredOfficeAddress || 'VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India')}
                    >
                      <Ionicons name="copy-outline" size={11} color="#6366f1" />
                      <Text style={styles.copyInlineText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.addressText, { color: textColor }]} numberOfLines={2}>
                    {masterData.registeredAddress || masterData.registeredOfficeAddress || 'VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India'}
                  </Text>
                </View>

                <View style={[styles.addressBlock, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                  <View style={styles.addressHead}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="business-outline" size={13} color="#10b981" />
                      <Text style={[styles.addressLabel, { color: subTextColor }]}>OPERATIONAL HEAD OFFICE</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyInlineBtn}
                      onPress={() => handleCopy('Operational HQ', masterData.operationalHq || 'Near Grain Market, Makhu, Tehsil Zira, District Ferozepur, Punjab - 142044, India')}
                    >
                      <Ionicons name="copy-outline" size={11} color="#6366f1" />
                      <Text style={styles.copyInlineText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.addressText, { color: textColor }]} numberOfLines={2}>
                    {masterData.operationalHq || 'Near Grain Market, Makhu, Tehsil Zira, District Ferozepur, Punjab - 142044, India'}
                  </Text>
                </View>

                {/* Key Leadership & Promoters */}
                <View style={{ gap: 4 }}>
                  <Text style={[styles.sectionMiniLabel, { color: subTextColor }]}>LEADERSHIP & FIRST DIRECTORS</Text>
                  <View style={styles.directorsRow}>
                    <View style={[styles.directorBadge, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <View style={[styles.avatarInitials, { backgroundColor: '#10b981' }]}>
                        <Text style={styles.avatarText}>BS</Text>
                      </View>
                      <View>
                        <Text style={[styles.directorName, { color: textColor }]}>Bakhshish Singh</Text>
                        <Text style={[styles.directorRole, { color: '#10b981' }]}>First Director</Text>
                      </View>
                    </View>

                    <View style={[styles.directorBadge, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <View style={[styles.avatarInitials, { backgroundColor: '#f59e0b' }]}>
                        <Text style={styles.avatarText}>GK</Text>
                      </View>
                      <View>
                        <Text style={[styles.directorName, { color: textColor }]}>Gagandeep Kaur</Text>
                        <Text style={[styles.directorRole, { color: '#f59e0b' }]}>First Director</Text>
                      </View>
                    </View>

                    <View style={[styles.directorBadge, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <View style={[styles.avatarInitials, { backgroundColor: '#3b82f6' }]}>
                        <Text style={styles.avatarText}>GS</Text>
                      </View>
                      <View>
                        <Text style={[styles.directorName, { color: textColor }]}>Gurnam Singh</Text>
                        <Text style={[styles.directorRole, { color: subTextColor }]}>General Manager</Text>
                      </View>
                    </View>

                    <View style={[styles.directorBadge, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <View style={[styles.avatarInitials, { backgroundColor: '#8b5cf6' }]}>
                        <Text style={styles.avatarText}>SS</Text>
                      </View>
                      <View>
                        <Text style={[styles.directorName, { color: textColor }]}>Surinder Singh</Text>
                        <Text style={[styles.directorRole, { color: '#8b5cf6' }]}>Grievance Officer</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Quick Contacts Strip */}
                <View style={styles.compactContactsRow}>
                  <TouchableOpacity
                    style={[styles.compactContactChip, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}
                    onPress={() => handleCopy('Helpline', masterData.primaryMobile || masterData.officialPhone || '+91 95776 22000')}
                  >
                    <Ionicons name="call-outline" size={13} color="#6366f1" />
                    <Text style={[styles.compactContactVal, { color: textColor }]}>{masterData.primaryMobile || '+91 95776 22000'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.compactContactChip, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}
                    onPress={() => handleCopy('Support Email', masterData.supportEmail || 'support@farmsking.in')}
                  >
                    <Ionicons name="mail-outline" size={13} color="#10b981" />
                    <Text style={[styles.compactContactVal, { color: textColor }]}>{masterData.supportEmail || 'support@farmsking.in'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.compactContactChip, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}
                    onPress={() => handleCopy('Legal Email', masterData.legalEmail || 'legal@farmsking.in')}
                  >
                    <Ionicons name="shield-outline" size={13} color="#8b5cf6" />
                    <Text style={[styles.compactContactVal, { color: textColor }]}>{masterData.legalEmail || 'legal@farmsking.in'}</Text>
                  </TouchableOpacity>
                </View>

                {/* Compliance & Standards Single Line */}
                <View style={styles.compliancePillsRow}>
                  <View style={[styles.compPill, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                    <Ionicons name="document-text-outline" size={12} color="#6366f1" />
                    <Text style={[styles.compPillText, { color: textColor }]}>A4 Standard (210×297mm)</Text>
                  </View>
                  <View style={[styles.compPill, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                    <Ionicons name="lock-closed-outline" size={12} color="#10b981" />
                    <Text style={[styles.compPillText, { color: textColor }]}>Isolated KYC Security</Text>
                  </View>
                  <View style={[styles.compPill, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                    <Ionicons name="sync-outline" size={12} color="#3b82f6" />
                    <Text style={[styles.compPillText, { color: textColor }]}>MCA V3 Synced</Text>
                  </View>
                </View>
              </View>

              {/* Right Column: Approved Business Scope & Technology Stack */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#ecfdf5' : '#064e3b' }]}>
                    <Ionicons name="leaf" size={16} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Approved Scope & Architecture</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]} numberOfLines={1}>
                      e-MoA Objects · NIC {masterData.nicCodes || '01612, 62013, 63112'}
                    </Text>
                  </View>
                  <View style={styles.nicPill}>
                    <Text style={styles.nicPillText}>MCA Approved</Text>
                  </View>
                </View>

                {/* 4 Core Pillars - 2x2 Bento Grid */}
                <View style={styles.scopeGrid}>
                  <View style={[styles.scopeCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeBadge, { backgroundColor: isLight ? '#dcfce7' : '#064e3b' }]}>
                      <Ionicons name="fitness" size={15} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, { color: textColor }]}>AI Crop Doctor</Text>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]} numberOfLines={2}>
                        Leaf computer vision, plant pathology & dosage guide
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeBadge, { backgroundColor: isLight ? '#dbeafe' : '#1e3a8a' }]}>
                      <Ionicons name="trending-up" size={15} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, { color: textColor }]}>Live Mandi Exchange</Text>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]} numberOfLines={2}>
                        Direct grain trading, APMC rates & spot settlement
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeBadge, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                      <Ionicons name="cart" size={15} color="#f59e0b" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, { color: textColor }]}>Agri E-Commerce</Text>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]} numberOfLines={2}>
                        Certified hybrid seeds, fertilizers & farm inputs
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeBadge, { backgroundColor: isLight ? '#f3e8ff' : '#4c1d95' }]}>
                      <Ionicons name="planet" size={15} color="#8b5cf6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, { color: textColor }]}>Satellite Telemetry</Text>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]} numberOfLines={2}>
                        Sentinel-2 NDVI vegetative indices & soil moisture
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Technology Stack - 8 Compact Micro-Cards */}
                <View style={{ gap: 4 }}>
                  <Text style={[styles.sectionMiniLabel, { color: subTextColor }]}>ENTERPRISE STACK & INFRASTRUCTURE</Text>
                  <View style={styles.techGrid}>
                    <View style={[styles.techCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <Ionicons name="sparkles" size={14} color="#ec4899" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techName, { color: textColor }]}>Gemini 1.5 Pro</Text>
                        <Text style={[styles.techDetail, { color: subTextColor }]}>AI Agronomy</Text>
                      </View>
                    </View>

                    <View style={[styles.techCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <Ionicons name="code-slash" size={14} color="#6366f1" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techName, { color: textColor }]}>React Native Web</Text>
                        <Text style={[styles.techDetail, { color: subTextColor }]}>Expo 52 Client</Text>
                      </View>
                    </View>

                    <View style={[styles.techCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <Ionicons name="server" size={14} color="#10b981" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techName, { color: textColor }]}>NestJS 10</Text>
                        <Text style={[styles.techDetail, { color: subTextColor }]}>Core API (3000)</Text>
                      </View>
                    </View>

                    <View style={[styles.techCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <Ionicons name="layers" size={14} color="#3b82f6" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techName, { color: textColor }]}>PostgreSQL 16</Text>
                        <Text style={[styles.techDetail, { color: subTextColor }]}>Prisma ORM v6</Text>
                      </View>
                    </View>

                    <View style={[styles.techCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <Ionicons name="card" size={14} color="#10b981" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techName, { color: textColor }]}>PhonePe UPI</Text>
                        <Text style={[styles.techDetail, { color: subTextColor }]}>Direct Payout</Text>
                      </View>
                    </View>

                    <View style={[styles.techCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <Ionicons name="cloud" size={14} color="#f59e0b" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techName, { color: textColor }]}>Hostinger VPS</Text>
                        <Text style={[styles.techDetail, { color: subTextColor }]}>Nginx Edge & PM2</Text>
                      </View>
                    </View>

                    <View style={[styles.techCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <Ionicons name="chatbubbles" size={14} color="#0d9488" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techName, { color: textColor }]}>Fast2SMS & WA</Text>
                        <Text style={[styles.techDetail, { color: subTextColor }]}>DLT Approved</Text>
                      </View>
                    </View>

                    <View style={[styles.techCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                      <Ionicons name="planet" size={14} color="#0284c7" />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.techName, { color: textColor }]}>Sentinel-2</Text>
                        <Text style={[styles.techDetail, { color: subTextColor }]}>Radar Telemetry</Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Footer Telemetry & Legal Strip */}
                <View style={[styles.govVerificationCard, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                  <Ionicons name="checkmark-done-circle" size={15} color="#10b981" />
                  <Text style={[styles.govVerificationText, { color: textColor }]} numberOfLines={1}>
                    Indian Companies Act, 2013 Verified · MCA V3 · High Availability Production SLA 99.9%
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'ENTITY_SETUP' && (
          <View style={{ width: '100%' }}>
            <SettingEntitySetup />
          </View>
        )}

        {activeTab === 'FEATURES' && (
          <View style={{ width: '100%' }}>
            <SettingFeaturesSetup />
          </View>
        )}

        {activeTab === 'PLAN_OFFERS' && (
          <View style={{ width: '100%' }}>
            <SettingPlanOffersSetup />
          </View>
        )}

        {activeTab === 'PAYMENT_SHARE' && (
          <View style={{ width: '100%' }}>
            <SettingPaymentShareSetup />
          </View>
        )}

        {activeTab === 'TOOLS_API' && (
          <View style={{ width: '100%' }}>
            <ThirdPartyServicesSection />
          </View>
        )}

        {activeTab === 'OTHER' && (
          <View style={{ width: '100%' }}>
            <SettingOtherSetup />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  toastContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    borderBottomWidth: 1,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  headerIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  syncBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBar: {
    flexDirection: 'row',
    gap: 14,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 13.5,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  contentContainerMobile: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  aboutTabWrapper: {
    gap: 10,
  },
  heroBanner: {
    borderRadius: 8,
    paddingVertical: 7,
    paddingHorizontal: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  heroLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 240,
  },
  heroIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOrgTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  heroBrandChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroBrandText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  liveGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  heroStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  heroCinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroCinText: {
    fontSize: 10.5,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  versionChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  versionChipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    gap: 8,
  },
  kpiRowMobile: {
    flexDirection: 'column',
    gap: 8,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  kpiIconBox: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  kpiValue: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 1,
  },
  kpiSub: {
    fontSize: 10,
    marginTop: 1,
  },

  // Grid
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridRowMobile: {
    flexDirection: 'column',
    gap: 10,
  },
  gridCol: {
    flex: 1,
  },
  card: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 11,
    gap: 9,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.12)',
  },
  cardHeaderIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 10.5,
    marginTop: 1,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  verifiedTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },

  // Stat Codes Grid
  statCodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  statCodeItem: {
    flex: 1,
    minWidth: 115,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  statCodeLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  statCodeValWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statCodeValue: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    letterSpacing: 0.3,
  },

  // Address
  addressBlock: {
    padding: 7,
    borderRadius: 6,
    borderWidth: 1,
    gap: 3,
  },
  addressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  addressText: {
    fontSize: 11,
    lineHeight: 15,
  },
  copyInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  copyInlineText: {
    fontSize: 10,
    color: '#6366f1',
    fontWeight: '600',
  },

  // Directors
  sectionMiniLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  directorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  directorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  avatarInitials: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  directorName: {
    fontSize: 11,
    fontWeight: '700',
  },
  directorRole: {
    fontSize: 9.5,
  },

  // Contacts Strip
  compactContactsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compactContactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  compactContactVal: {
    fontSize: 10.5,
    fontWeight: '600',
  },

  // Compliance
  compliancePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  compPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 999,
  },
  compPillText: {
    fontSize: 10,
    fontWeight: '600',
  },

  // NIC Pill
  nicPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  nicPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Scope Cards
  scopeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  scopeCard: {
    width: '48.8%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 7,
    borderRadius: 6,
    borderWidth: 1,
  },
  scopeBadge: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  scopeDesc: {
    fontSize: 9.5,
    lineHeight: 13,
    marginTop: 1,
  },

  // Tech Cards
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  techCard: {
    width: '23.8%',
    minWidth: 105,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  techName: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  techDetail: {
    fontSize: 9,
    marginTop: 0.5,
  },

  // Footer Verification Note
  govVerificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  govVerificationText: {
    fontSize: 10,
    lineHeight: 14,
    flex: 1,
  },
  statutoryFooterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  statutoryFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 280,
  },
  statutoryShieldBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statutoryCopyrightTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statutoryCopyrightSub: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  statutoryLawBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statutoryLawText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
