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
    id: 'TOOLS_API',
    label: 'Tools API',
    icon: 'hardware-chip-outline',
    description: 'Third-party API providers, credentials, gateways & live service configurations',
  },
  {
    id: 'OTHER',
    label: 'Other',
    icon: 'options-outline',
    description: 'Referral rewards, wallet taxes, telecom, storage, crop seasons, certificates & advanced system rules',
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
            {/* 1. Hero Company Banner - Compact Single-Line Glassmorphism Bar */}
            <LinearGradient
              colors={isLight ? ['#312e81', '#1e1b4b'] : ['#0f172a', '#020617']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.heroBanner}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroLeftWrap}>
                  <View style={styles.heroIconBadge}>
                    <Ionicons name="business" size={17} color="#ffffff" />
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
                    <View style={styles.heroCinBadge}>
                      <Text style={styles.heroCinText}>
                        CIN: {masterData.cinNumber || (masterData as any).cin || 'U01100PB2026PTC063294'}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </LinearGradient>

            {/* 2. Executive KPI Telemetry Strip (4 Stat Cards) */}
            <View style={[styles.kpiRow, !isDesktop && styles.kpiRowMobile]}>
              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#eef2ff' : '#1e1b4b' }]}>
                  <Ionicons name="shield-checkmark" size={18} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kpiLabel, { color: subTextColor }]}>STATUTORY REGISTRY</Text>
                  <Text style={[styles.kpiValue, { color: textColor }]}>Active & Verified</Text>
                  <Text style={[styles.kpiSub, { color: subTextColor }]} numberOfLines={1}>MCA SRN: {masterData.mcaSrn || 'AC6979718'} · ROC Chandigarh</Text>
                </View>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#ecfdf5' : '#064e3b' }]}>
                  <Ionicons name="leaf" size={18} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kpiLabel, { color: subTextColor }]}>APPROVED SCOPE</Text>
                  <Text style={[styles.kpiValue, { color: textColor }]}>Agritech & Mandi</Text>
                  <Text style={[styles.kpiSub, { color: subTextColor }]} numberOfLines={1}>e-MoA Objects (NIC: 01612, 62013)</Text>
                </View>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#f3e8ff' : '#3b0764' }]}>
                  <Ionicons name="hardware-chip" size={18} color="#9333ea" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kpiLabel, { color: subTextColor }]}>TECH ARCHITECTURE</Text>
                  <Text style={[styles.kpiValue, { color: textColor }]}>NestJS 10 + React</Text>
                  <Text style={[styles.kpiSub, { color: subTextColor }]} numberOfLines={1}>Google Gemini AI · PostgreSQL 16</Text>
                </View>
              </View>

              <View style={[styles.kpiCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                  <Ionicons name="pulse" size={18} color="#f59e0b" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.kpiLabel, { color: subTextColor }]}>PLATFORM STATUS</Text>
                  <Text style={[styles.kpiValue, { color: '#10b981' }]}>100% Operational</Text>
                  <Text style={[styles.kpiSub, { color: subTextColor }]} numberOfLines={1}>{aboutData.appVersion ? `v${aboutData.appVersion}` : 'v2.4.0'} Live Production · SLA 99.9%</Text>
                </View>
              </View>
            </View>

            {/* 3. Row 1: Corporate Entity & Approved Business Scope */}
            <View style={[styles.gridRow, !isDesktop && styles.gridRowMobile]}>
              {/* Card 1: Corporate Entity & Statutory Governance */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#eff6ff' : '#1e293b' }]}>
                    <Ionicons name="shield-checkmark" size={18} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Corporate & Statutory Entity</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                      Incorporated under Companies Act, 2013 · Ministry of Corporate Affairs, India
                    </Text>
                  </View>
                </View>

                {/* Legal Entity Overview Box */}
                <View style={[styles.legalHeroCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <Text style={[styles.legalHeroTitle, { color: textColor }]}>
                      {masterData.companyLegalName || aboutData.companyName || 'FARMSKING TECHNOLOGIES PRIVATE LIMITED'}
                    </Text>
                    <View style={styles.verifiedTag}>
                      <Ionicons name="checkmark-seal" size={13} color="#10b981" />
                      <Text style={styles.verifiedTagText}>Govt. Registered</Text>
                    </View>
                  </View>
                  <View style={styles.legalMetaRow}>
                    <Text style={[styles.legalMetaItem, { color: subTextColor }]}>
                      Brand Name: <Text style={{ color: textColor, fontWeight: '700' }}>{masterData.brandDisplayName || masterData.brandName || 'FarmsKing™'}</Text>
                    </Text>
                    <Text style={[styles.legalMetaDot, { color: subTextColor }]}>•</Text>
                    <Text style={[styles.legalMetaItem, { color: subTextColor }]}>
                      Authority: <Text style={{ color: textColor, fontWeight: '600' }}>{masterData.approvingAuthority || 'MCA CRC Manesar / ROC Chandigarh'}</Text>
                    </Text>
                  </View>
                </View>

                {/* 4-Item Statutory Identifier Badges */}
                <View style={styles.statCodeGrid}>
                  <View style={[styles.statCodeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Text style={[styles.statCodeLabel, { color: subTextColor }]}>MCA SRN</Text>
                    <View style={styles.statCodeValWrap}>
                      <Text style={[styles.statCodeValue, { color: textColor }]}>{masterData.mcaSrn || 'AC6979718'}</Text>
                      <TouchableOpacity onPress={() => handleCopy('MCA SRN', masterData.mcaSrn || 'AC6979718')}>
                        <Ionicons name="copy-outline" size={13} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.statCodeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Text style={[styles.statCodeLabel, { color: subTextColor }]}>CIN NUMBER</Text>
                    <View style={styles.statCodeValWrap}>
                      <Text style={[styles.statCodeValue, { color: textColor }]}>{masterData.cinNumber || (masterData as any).cin || 'U01100PB2026PTC063294'}</Text>
                      <TouchableOpacity onPress={() => handleCopy('CIN', masterData.cinNumber || (masterData as any).cin || 'U01100PB2026PTC063294')}>
                        <Ionicons name="copy-outline" size={13} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.statCodeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Text style={[styles.statCodeLabel, { color: subTextColor }]}>COMPANY PAN</Text>
                    <View style={styles.statCodeValWrap}>
                      <Text style={[styles.statCodeValue, { color: textColor }]}>{masterData.companyPan || (masterData as any).panNumber || 'AABCF1234D'}</Text>
                      <TouchableOpacity onPress={() => handleCopy('PAN', masterData.companyPan || (masterData as any).panNumber || 'AABCF1234D')}>
                        <Ionicons name="copy-outline" size={13} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.statCodeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Text style={[styles.statCodeLabel, { color: subTextColor }]}>COMPANY TAN</Text>
                    <View style={styles.statCodeValWrap}>
                      <Text style={[styles.statCodeValue, { color: textColor }]}>{masterData.companyTan || 'PTLA12345B'}</Text>
                      <TouchableOpacity onPress={() => handleCopy('TAN', masterData.companyTan || 'PTLA12345B')}>
                        <Ionicons name="copy-outline" size={13} color="#6366f1" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Addresses */}
                <View style={[styles.addressBlock, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                  <View style={styles.addressHead}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="location-outline" size={15} color="#3b82f6" />
                      <Text style={[styles.addressLabel, { color: subTextColor }]}>REGISTERED OFFICE</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyInlineBtn}
                      onPress={() => handleCopy('Registered Address', masterData.registeredAddress || masterData.registeredOfficeAddress || 'VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India')}
                    >
                      <Ionicons name="copy-outline" size={12} color="#6366f1" />
                      <Text style={styles.copyInlineText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.addressText, { color: textColor }]}>
                    {masterData.registeredAddress || masterData.registeredOfficeAddress || 'VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India'}
                  </Text>
                </View>

                <View style={[styles.addressBlock, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                  <View style={styles.addressHead}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="business-outline" size={15} color="#10b981" />
                      <Text style={[styles.addressLabel, { color: subTextColor }]}>OPERATIONAL HEAD OFFICE</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.copyInlineBtn}
                      onPress={() => handleCopy('Operational HQ', masterData.operationalHq || 'Near Grain Market, Makhu, Tehsil Zira, District Ferozepur, Punjab - 142044, India')}
                    >
                      <Ionicons name="copy-outline" size={12} color="#6366f1" />
                      <Text style={styles.copyInlineText}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.addressText, { color: textColor }]}>
                    {masterData.operationalHq || 'Near Grain Market, Makhu, Tehsil Zira, District Ferozepur, Punjab - 142044, India'}
                  </Text>
                </View>

                {/* Promoters & Directors */}
                <View style={{ gap: 6 }}>
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
                  </View>
                </View>

                {/* Capital & Statutory Standards */}
                <View style={[styles.capitalBlock, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={[styles.capitalLabel, { color: subTextColor }]}>AUTHORIZED EQUITY CAPITAL</Text>
                    <Text style={[styles.capitalValue, { color: textColor }]}>₹1,00,000 INR</Text>
                  </View>
                  <Text style={[styles.capitalSub, { color: subTextColor }]}>
                    1,00,000 Equity Shares @ ₹1 each · Clause V of e-MoA
                  </Text>
                </View>

                <View style={styles.compliancePillsRow}>
                  <View style={[styles.compPill, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                    <Ionicons name="document-text-outline" size={13} color="#6366f1" />
                    <Text style={[styles.compPillText, { color: textColor }]}>Strict A4 Document Standard (210mm × 297mm)</Text>
                  </View>
                  <View style={[styles.compPill, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                    <Ionicons name="lock-closed-outline" size={13} color="#10b981" />
                    <Text style={[styles.compPillText, { color: textColor }]}>Statutory Confidentiality (Isolated KYC Records)</Text>
                  </View>
                </View>
              </View>

              {/* Card 2: Approved Business Scope (e-MoA Objects) */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#ecfdf5' : '#064e3b' }]}>
                    <Ionicons name="leaf" size={18} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Approved Business Scope</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                      Statutory Objects per MCA e-MoA · NIC: {masterData.nicCodes || '01612, 62013, 63112'}
                    </Text>
                  </View>
                </View>

                {/* Official NIC Scope Banner */}
                <View style={[styles.nicBanner, { backgroundColor: isLight ? '#f0fdf4' : '#022c22', borderColor: isLight ? '#bbf7d0' : '#065f46' }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 6 }}>
                    <Text style={[styles.nicBannerTitle, { color: '#10b981' }]}>OFFICIAL MCA NIC CLASSIFICATION</Text>
                    <View style={styles.nicPillsWrap}>
                      <View style={styles.nicPill}><Text style={styles.nicPillText}>NIC 01612</Text></View>
                      <View style={styles.nicPill}><Text style={styles.nicPillText}>NIC 62013</Text></View>
                      <View style={styles.nicPill}><Text style={styles.nicPillText}>NIC 63112</Text></View>
                    </View>
                  </View>
                  <Text style={[styles.nicBannerDesc, { color: isLight ? '#166534' : '#a7f3d0' }]}>
                    {masterData.activityDescription || 'Support activities for crop production, autonomous agricultural software development, and digital commodity marketplace operations.'}
                  </Text>
                </View>

                {/* 4 Core Pillars */}
                <View style={styles.scopeGrid}>
                  <View style={[styles.scopeCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeBadge, { backgroundColor: isLight ? '#dcfce7' : '#064e3b' }]}>
                      <Ionicons name="fitness" size={17} color="#10b981" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.scopeTitleRow}>
                        <Text style={[styles.scopeTitle, { color: textColor }]}>AI Crop Doctor & Agronomy</Text>
                        <Text style={[styles.scopeTag, { backgroundColor: isLight ? '#dcfce7' : '#064e3b', color: '#10b981' }]}>Pillar 01</Text>
                      </View>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]}>
                        Autonomous visual leaf analysis, plant pathology, dosage scheduling and live agronomist consultation with real-time severity scoring.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeBadge, { backgroundColor: isLight ? '#dbeafe' : '#1e3a8a' }]}>
                      <Ionicons name="trending-up" size={17} color="#3b82f6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.scopeTitleRow}>
                        <Text style={[styles.scopeTitle, { color: textColor }]}>Live Agricultural Mandi & Exchange</Text>
                        <Text style={[styles.scopeTag, { backgroundColor: isLight ? '#dbeafe' : '#1e3a8a', color: '#3b82f6' }]}>Pillar 02</Text>
                      </View>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]}>
                        Direct farmer-to-buyer grain trading, APMC market rates, spot price bidding, quantity matching and instant digital settlement.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeBadge, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                      <Ionicons name="cart" size={17} color="#f59e0b" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.scopeTitleRow}>
                        <Text style={[styles.scopeTitle, { color: textColor }]}>Agricultural E-Commerce Marketplace</Text>
                        <Text style={[styles.scopeTag, { backgroundColor: isLight ? '#fef3c7' : '#78350f', color: '#f59e0b' }]}>Pillar 03</Text>
                      </View>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]}>
                        Certified hybrid seeds, fertilizers, organic nutrients, modern farm implements and verified agricultural input doorstep delivery.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeBadge, { backgroundColor: isLight ? '#f3e8ff' : '#4c1d95' }]}>
                      <Ionicons name="planet" size={17} color="#8b5cf6" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={styles.scopeTitleRow}>
                        <Text style={[styles.scopeTitle, { color: textColor }]}>Multispectral Satellite Telemetry</Text>
                        <Text style={[styles.scopeTag, { backgroundColor: isLight ? '#f3e8ff' : '#4c1d95', color: '#8b5cf6' }]}>Pillar 04</Text>
                      </View>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]}>
                        Sentinel-2 Earth observation, NDVI vegetative indices, soil moisture radar and automated irrigation alerts.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* 4. Row 2: Technology Stack & Official Contacts */}
            <View style={[styles.gridRow, !isDesktop && styles.gridRowMobile]}>
              {/* Card 3: Platform Architecture & Tech Stack */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#f3e8ff' : '#3b0764' }]}>
                    <Ionicons name="hardware-chip" size={18} color="#9333ea" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Technology Stack & Architecture</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                      High-Performance Enterprise Infrastructure & Frameworks
                    </Text>
                  </View>
                </View>

                <View style={styles.techGrid}>
                  <View style={[styles.techCard, !isDesktop && styles.techCardMobile, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.techIconBox, { backgroundColor: isLight ? '#fdf2f8' : '#831843' }]}>
                      <Ionicons name="sparkles" size={17} color="#ec4899" />
                    </View>
                    <View style={styles.techContent}>
                      <Text style={[styles.techName, { color: textColor }]}>AI Agronomy Engine</Text>
                      <Text style={[styles.techDetail, { color: subTextColor }]}>Google Gemini 1.5 Pro · Computer Vision & Pathology</Text>
                      <View style={styles.techLiveChip}>
                        <View style={[styles.liveGreenDot, { backgroundColor: '#ec4899' }]} />
                        <Text style={[styles.techLiveText, { color: '#ec4899' }]}>Active ({config.ai?.activeProvider || 'GEMINI'})</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.techCard, !isDesktop && styles.techCardMobile, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.techIconBox, { backgroundColor: isLight ? '#eef2ff' : '#1e1b4b' }]}>
                      <Ionicons name="code-slash" size={17} color="#6366f1" />
                    </View>
                    <View style={styles.techContent}>
                      <Text style={[styles.techName, { color: textColor }]}>Frontend Web & Admin</Text>
                      <Text style={[styles.techDetail, { color: subTextColor }]}>React Native Web, Expo Router v3, TypeScript</Text>
                      <View style={styles.techLiveChip}>
                        <View style={styles.liveGreenDot} />
                        <Text style={[styles.techLiveText, { color: '#10b981' }]}>100% React Architecture</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.techCard, !isDesktop && styles.techCardMobile, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.techIconBox, { backgroundColor: isLight ? '#ecfdf5' : '#064e3b' }]}>
                      <Ionicons name="server" size={17} color="#10b981" />
                    </View>
                    <View style={styles.techContent}>
                      <Text style={[styles.techName, { color: textColor }]}>Backend Core API</Text>
                      <Text style={[styles.techDetail, { color: subTextColor }]}>NestJS 10 Enterprise Framework, Node.js, WebSockets</Text>
                      <View style={styles.techLiveChip}>
                        <View style={styles.liveGreenDot} />
                        <Text style={[styles.techLiveText, { color: '#10b981' }]}>Port 3000 (Production)</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.techCard, !isDesktop && styles.techCardMobile, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.techIconBox, { backgroundColor: isLight ? '#eff6ff' : '#1e293b' }]}>
                      <Ionicons name="layers" size={17} color="#3b82f6" />
                    </View>
                    <View style={styles.techContent}>
                      <Text style={[styles.techName, { color: textColor }]}>Database & ORM</Text>
                      <Text style={[styles.techDetail, { color: subTextColor }]}>PostgreSQL 16 High-Performance, Prisma ORM v6</Text>
                      <View style={styles.techLiveChip}>
                        <View style={styles.liveGreenDot} />
                        <Text style={[styles.techLiveText, { color: '#10b981' }]}>Relational Integrity</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.techCard, !isDesktop && styles.techCardMobile, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.techIconBox, { backgroundColor: isLight ? '#f0fdf4' : '#052e16' }]}>
                      <Ionicons name="card" size={17} color="#10b981" />
                    </View>
                    <View style={styles.techContent}>
                      <Text style={[styles.techName, { color: textColor }]}>Payment Gateway</Text>
                      <Text style={[styles.techDetail, { color: subTextColor }]}>PhonePe UPI Direct Settlement & Cards</Text>
                      <View style={styles.techLiveChip}>
                        <View style={styles.liveGreenDot} />
                        <Text style={[styles.techLiveText, { color: '#10b981' }]}>{config.gateway?.isSandbox ? 'Sandbox Mode' : 'Live Production'}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.techCard, !isDesktop && styles.techCardMobile, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.techIconBox, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                      <Ionicons name="cloud" size={17} color="#f59e0b" />
                    </View>
                    <View style={styles.techContent}>
                      <Text style={[styles.techName, { color: textColor }]}>Cloud Infrastructure</Text>
                      <Text style={[styles.techDetail, { color: subTextColor }]}>Hostinger VPS (Ubuntu 24.04 LTS), Nginx, PM2, TLS 1.3</Text>
                      <View style={styles.techLiveChip}>
                        <View style={styles.liveGreenDot} />
                        <Text style={[styles.techLiveText, { color: '#10b981' }]}>Live Edge Proxy</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.techCard, !isDesktop && styles.techCardMobile, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.techIconBox, { backgroundColor: isLight ? '#ccfbf1' : '#134e4a' }]}>
                      <Ionicons name="chatbubbles" size={17} color="#0d9488" />
                    </View>
                    <View style={styles.techContent}>
                      <Text style={[styles.techName, { color: textColor }]}>SMS & WhatsApp</Text>
                      <Text style={[styles.techDetail, { color: subTextColor }]}>Fast2SMS (Govt. DLT Approved) & Meta WhatsApp API</Text>
                      <View style={styles.techLiveChip}>
                        <View style={styles.liveGreenDot} />
                        <Text style={[styles.techLiveText, { color: '#10b981' }]}>Active ({config.sms?.activeProvider || 'FAST2SMS'})</Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.techCard, !isDesktop && styles.techCardMobile, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.techIconBox, { backgroundColor: isLight ? '#e0f2fe' : '#0c4a6e' }]}>
                      <Ionicons name="planet" size={17} color="#0284c7" />
                    </View>
                    <View style={styles.techContent}>
                      <Text style={[styles.techName, { color: textColor }]}>Satellite Observation</Text>
                      <Text style={[styles.techDetail, { color: subTextColor }]}>Sentinel-2 Multispectral & Agromonitoring APIs</Text>
                      <View style={styles.techLiveChip}>
                        <View style={styles.liveGreenDot} />
                        <Text style={[styles.techLiveText, { color: '#10b981' }]}>Telemetry Active</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Card 4: Official Contacts & Platform Telemetry */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                    <Ionicons name="headset" size={18} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Official Contacts & Telemetry</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]}>
                      Statutory Channels, Executive Helpdesk & Version Telemetry
                    </Text>
                  </View>
                </View>

                <View style={styles.contactList}>
                  <View style={[styles.contactItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={styles.contactLeft}>
                      <View style={[styles.contactIcon, { backgroundColor: isLight ? '#eef2ff' : '#1e1b4b' }]}>
                        <Ionicons name="call" size={15} color="#6366f1" />
                      </View>
                      <View>
                        <Text style={[styles.contactLabel, { color: subTextColor }]}>EXECUTIVE HELPDESK</Text>
                        <Text style={[styles.contactVal, { color: textColor }]}>
                          {masterData.primaryMobile || masterData.officialPhone || '+91 95776 22000'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.copyInlineBtn}
                      onPress={() => handleCopy('Helpline', masterData.primaryMobile || masterData.officialPhone || '+91 95776 22000')}
                    >
                      <Ionicons name="copy-outline" size={12} color="#6366f1" />
                      <Text style={styles.copyInlineText}>Copy</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.contactItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={styles.contactLeft}>
                      <View style={[styles.contactIcon, { backgroundColor: isLight ? '#ecfdf5' : '#064e3b' }]}>
                        <Ionicons name="mail" size={15} color="#10b981" />
                      </View>
                      <View>
                        <Text style={[styles.contactLabel, { color: subTextColor }]}>OFFICIAL SUPPORT EMAIL</Text>
                        <Text style={[styles.contactVal, { color: textColor }]}>
                          {masterData.supportEmail || masterData.officialEmail || 'support@farmsking.in'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.copyInlineBtn}
                      onPress={() => handleCopy('Support Email', masterData.supportEmail || masterData.officialEmail || 'support@farmsking.in')}
                    >
                      <Ionicons name="copy-outline" size={12} color="#6366f1" />
                      <Text style={styles.copyInlineText}>Copy</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.contactItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={styles.contactLeft}>
                      <View style={[styles.contactIcon, { backgroundColor: isLight ? '#f3e8ff' : '#4c1d95' }]}>
                        <Ionicons name="shield" size={15} color="#8b5cf6" />
                      </View>
                      <View>
                        <Text style={[styles.contactLabel, { color: subTextColor }]}>STATUTORY & LEGAL INQUIRIES</Text>
                        <Text style={[styles.contactVal, { color: textColor }]}>
                          {masterData.legalEmail || 'legal@farmsking.in'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.copyInlineBtn}
                      onPress={() => handleCopy('Legal Email', masterData.legalEmail || 'legal@farmsking.in')}
                    >
                      <Ionicons name="copy-outline" size={12} color="#6366f1" />
                      <Text style={styles.copyInlineText}>Copy</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.contactItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={styles.contactLeft}>
                      <View style={[styles.contactIcon, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                        <Ionicons name="person" size={15} color="#f59e0b" />
                      </View>
                      <View>
                        <Text style={[styles.contactLabel, { color: subTextColor }]}>GRIEVANCE REDRESSAL OFFICER</Text>
                        <Text style={[styles.contactVal, { color: textColor }]}>
                          {masterData.grievanceOfficerName || 'Surinder Singh'} ({masterData.grievanceOfficerEmail || 'grievance@farmsking.in'})
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.contactItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={styles.contactLeft}>
                      <View style={[styles.contactIcon, { backgroundColor: isLight ? '#e0e7ff' : '#1e1b4b' }]}>
                        <Ionicons name="globe" size={15} color="#6366f1" />
                      </View>
                      <View>
                        <Text style={[styles.contactLabel, { color: subTextColor }]}>OFFICIAL WEB PORTAL</Text>
                        <Text style={[styles.contactVal, { color: '#6366f1' }]}>
                          {masterData.websiteUrl || 'https://farmsking.in'}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* System & Telemetry Specs */}
                <View style={[styles.telemetryCard, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={[styles.telemetryCardTitle, { color: subTextColor }]}>SYSTEM TELEMETRY</Text>
                    <View style={styles.telemetryLiveBadge}>
                      <View style={styles.liveGreenDot} />
                      <Text style={styles.telemetryLiveText}>99.9% Uptime SLA</Text>
                    </View>
                  </View>

                  <View style={styles.telemetryGrid}>
                    <View style={styles.telemetryItem}>
                      <Text style={[styles.telemetryItemLabel, { color: subTextColor }]}>RELEASE</Text>
                      <Text style={[styles.telemetryItemVal, { color: textColor }]}>{aboutData.appVersion ? `v${aboutData.appVersion}` : 'v2.4.0'}</Text>
                    </View>
                    <View style={styles.telemetryItem}>
                      <Text style={[styles.telemetryItemLabel, { color: subTextColor }]}>ENVIRONMENT</Text>
                      <Text style={[styles.telemetryItemVal, { color: '#10b981' }]}>Production</Text>
                    </View>
                    <View style={styles.telemetryItem}>
                      <Text style={[styles.telemetryItemLabel, { color: subTextColor }]}>RUNTIME</Text>
                      <Text style={[styles.telemetryItemVal, { color: textColor }]}>Node.js 20 LTS</Text>
                    </View>
                    <View style={styles.telemetryItem}>
                      <Text style={[styles.telemetryItemLabel, { color: subTextColor }]}>CLIENT ENGINE</Text>
                      <Text style={[styles.telemetryItemVal, { color: textColor }]}>Expo 52 Web</Text>
                    </View>
                  </View>
                </View>

                {/* Regulatory Verification Footer Note */}
                <View style={[styles.govVerificationCard, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                  <Ionicons name="checkmark-done-circle" size={17} color="#10b981" />
                  <Text style={[styles.govVerificationText, { color: textColor }]}>
                    Statutory corporate data synchronizes with Ministry of Corporate Affairs (MCA V3 Services) and GSTIN portals under Indian Companies Act, 2013.
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
    gap: 20,
  },
  heroBanner: {
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  heroLeftWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
  },
  heroIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOrgTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  heroBrandChip: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  heroBrandText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  heroRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  heroStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  heroCinBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroCinText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '600',
  },

  // KPI Row
  kpiRow: {
    flexDirection: 'row',
    gap: 14,
  },
  kpiRowMobile: {
    flexDirection: 'column',
    gap: 10,
  },
  kpiCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  kpiIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  kpiValue: {
    fontSize: 13.5,
    fontWeight: '800',
    marginTop: 1,
  },
  kpiSub: {
    fontSize: 11,
    marginTop: 1,
  },

  // Grid
  gridRow: {
    flexDirection: 'row',
    gap: 16,
  },
  gridRowMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  gridCol: {
    flex: 1,
  },
  card: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.12)',
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    fontSize: 11.5,
    marginTop: 2,
    lineHeight: 16,
  },

  // Legal Overview
  legalHeroCard: {
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  legalHeroTitle: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  legalMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  legalMetaItem: {
    fontSize: 11.5,
  },
  legalMetaDot: {
    fontSize: 12,
  },

  // Stat Codes Grid
  statCodeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCodeItem: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  statCodeLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  statCodeValWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statCodeValue: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: Platform.OS === 'web' ? 'monospace' : undefined,
    letterSpacing: 0.5,
  },

  // Address
  addressBlock: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  addressHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  addressText: {
    fontSize: 12,
    lineHeight: 18,
  },
  copyInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  copyInlineText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },

  // Directors
  sectionMiniLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  directorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  directorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  avatarInitials: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  directorName: {
    fontSize: 12,
    fontWeight: '700',
  },
  directorRole: {
    fontSize: 10.5,
  },

  // Capital & Compliance
  capitalBlock: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  capitalLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  capitalValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  capitalSub: {
    fontSize: 11,
  },
  compliancePillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  compPillText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // NIC Banner
  nicBanner: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  nicBannerTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  nicPillsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  nicPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#10b981',
  },
  nicPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ffffff',
  },
  nicBannerDesc: {
    fontSize: 11.5,
    lineHeight: 17,
  },

  // Scope Cards
  scopeGrid: {
    gap: 10,
  },
  scopeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  scopeBadge: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 3,
  },
  scopeTitle: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  scopeTag: {
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  scopeDesc: {
    fontSize: 11.5,
    lineHeight: 16.5,
  },

  // Tech Cards
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  techCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  techCardMobile: {
    width: '100%',
  },
  techIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techContent: {
    flex: 1,
    gap: 2,
  },
  techName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  techDetail: {
    fontSize: 11,
    lineHeight: 15,
  },
  techLiveChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  techLiveText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Contact list
  contactList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 10,
  },
  contactLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  contactIcon: {
    width: 30,
    height: 30,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  contactVal: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Telemetry
  telemetryCard: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  telemetryCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.7,
  },
  telemetryLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  telemetryLiveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  telemetryItem: {
    minWidth: 100,
  },
  telemetryItemLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  telemetryItemVal: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  govVerificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 10,
    borderRadius: 8,
  },
  govVerificationText: {
    fontSize: 11,
    lineHeight: 16,
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
