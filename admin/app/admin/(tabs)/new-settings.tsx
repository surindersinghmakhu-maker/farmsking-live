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
    const found = SETTINGS_TABS.find((t) => t.id === tabParam);
    return found ? found.id : 'ABOUT';
  });

  React.useEffect(() => {
    const tabParam = params?.tab?.toUpperCase();
    if (tabParam === 'ENTITY_SETUP' || tabParam === 'ENTITY' || tabParam === 'MASTER_DATA' || tabParam === 'SETTING') {
      setActiveTab('ENTITY_SETUP');
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
            {/* Hero Company Banner - Compact Single Line */}
            <LinearGradient
              colors={isLight ? ['#4f46e5', '#3730a3'] : ['#1e1b4b', '#0f172a']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroBanner}
            >
              <View style={styles.heroContent}>
                <View style={styles.heroIconBadge}>
                  <Ionicons name="business" size={18} color="#ffffff" />
                </View>
                <Text style={styles.heroOrgTitle} numberOfLines={1}>
                  {masterData.companyLegalName || aboutData.companyName || 'FARMSKING TECHNOLOGIES PRIVATE LIMITED'}
                </Text>
              </View>
            </LinearGradient>

            {/* 2-Column Grid on Desktop, 1-Column on Mobile */}
            <View style={[styles.gridRow, !isDesktop && styles.gridRowMobile]}>
              {/* Card 1: Corporate Entity & Statutory Governance */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#eff6ff' : '#1e293b' }]}>
                    <Ionicons name="shield-checkmark" size={18} color="#3b82f6" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Corporate & Statutory Entity</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]}>Official Registration & Registered Office</Text>
                  </View>
                </View>

                <View style={styles.infoList}>
                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Legal Entity Name</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontWeight: '700' }]}>
                      {masterData.companyLegalName || aboutData.companyName || 'FARMSKING TECHNOLOGIES PRIVATE LIMITED'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Brand / Trade Name</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontWeight: '600' }]}>
                      {masterData.brandDisplayName || masterData.brandName || aboutData.brandName || 'FarmsKing™'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Incorporation Authority</Text>
                    <Text style={[styles.infoValue, { color: textColor }]}>
                      {masterData.approvingAuthority || 'Ministry of Corporate Affairs (MCA), CRC Manesar'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>MCA SRN</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontFamily: FONT.medium }]}>
                      {masterData.mcaSrn || 'AC6979718'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>CIN Number</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontFamily: FONT.medium }]}>
                      {masterData.cinNumber || (masterData as any).cin || aboutData.cin || 'U01100PB2026PTC063294'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Company PAN / TAN</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontFamily: FONT.medium }]}>
                      PAN: {masterData.companyPan || (masterData as any).panNumber || aboutData.pan || 'AABCF1234D'} | TAN: {masterData.companyTan || 'PTLA12345B'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Registered Office</Text>
                    <View style={styles.addressWrap}>
                      <Text style={[styles.infoValue, { color: textColor, lineHeight: 20 }]}>
                        {masterData.registeredAddress || masterData.registeredOfficeAddress || aboutData.registeredAddress || 'VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India'}
                      </Text>
                      <TouchableOpacity
                        style={styles.copyInlineBtn}
                        onPress={() => handleCopy('Registered Address', masterData.registeredAddress || masterData.registeredOfficeAddress || aboutData.registeredAddress || 'VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India')}
                      >
                        <Ionicons name="copy-outline" size={13} color="#6366f1" />
                        <Text style={styles.copyInlineText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Operational HQ</Text>
                    <Text style={[styles.infoValue, { color: textColor, lineHeight: 19 }]}>
                      {masterData.operationalHq || aboutData.headquarters || 'Near Grain Market, Makhu, Tehsil Zira, District Ferozepur, Punjab - 142044, India'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>First Directors & Promoters</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontWeight: '600' }]}>
                      {masterData.promotersAndCapital?.firstDirectors || 'Bakhshish Singh, Gagandeep Kaur'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Founder & Chief AI Architect</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontWeight: '600' }]}>
                      {masterData.promotersAndCapital?.founderAndChiefAiArchitect || 'Surinder Singh'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Authorized Share Capital</Text>
                    <Text style={[styles.infoValue, { color: textColor }]}>
                      ₹{(masterData.promotersAndCapital?.authorizedEquityCapitalInr || 100000).toLocaleString('en-IN')} Authorized Capital ({(masterData.promotersAndCapital?.authorizedSharesCount || 100000).toLocaleString('en-IN')} Equity Shares @ ₹{masterData.promotersAndCapital?.faceValuePerShareInr || 1} each)
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Statutory Rules</Text>
                    <View style={styles.tagsRow}>
                      <View style={[styles.tagPill, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                        <Text style={[styles.tagText, { color: textColor }]}>Standard A4 Documents (210mm × 297mm)</Text>
                      </View>
                      <View style={[styles.tagPill, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                        <Text style={[styles.tagText, { color: textColor }]}>Zero Public KYC Leakage</Text>
                      </View>
                    </View>
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
                      Statutory Objects per MCA e-MoA (NIC: {masterData.nicCodes || '62013, 01619'})
                    </Text>
                  </View>
                </View>

                {masterData.activityDescription ? (
                  <View style={{ marginBottom: 14, padding: 12, borderRadius: RADIUS.md, backgroundColor: isLight ? '#f8fafc' : '#020617', borderWidth: 1, borderColor: cardBorder }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#10b981', marginBottom: 4 }}>
                      OFFICIAL NIC SCOPE SUMMARY
                    </Text>
                    <Text style={{ fontSize: 12, color: textColor, lineHeight: 18 }}>
                      {masterData.activityDescription}
                    </Text>
                  </View>
                ) : null}

                <View style={styles.scopeList}>
                  <View style={[styles.scopeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeNumBox, { backgroundColor: isLight ? '#e0e7ff' : '#1e1b4b' }]}>
                      <Text style={styles.scopeNumText}>01</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, { color: textColor }]}>AI Crop Doctor & Agronomy Diagnosis</Text>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]}>
                        Autonomous visual leaf analysis, plant pathology, dosage scheduling and live agronomist consultation.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeNumBox, { backgroundColor: isLight ? '#dcfce7' : '#064e3b' }]}>
                      <Text style={[styles.scopeNumText, { color: '#10b981' }]}>02</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, { color: textColor }]}>Live Agricultural Mandi & Commodity Exchange</Text>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]}>
                        Direct farmer-to-buyer grain trading, APMC market rates, spot price bidding and instant digital settlement.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeNumBox, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                      <Text style={[styles.scopeNumText, { color: '#f59e0b' }]}>03</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, { color: textColor }]}>Agricultural E-Commerce Marketplace</Text>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]}>
                        Certified hybrid seeds, fertilizers, organic nutrients, modern farm implements and doorstep delivery.
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.scopeItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <View style={[styles.scopeNumBox, { backgroundColor: isLight ? '#fae8ff' : '#581c87' }]}>
                      <Text style={[styles.scopeNumText, { color: '#c026d3' }]}>04</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.scopeTitle, { color: textColor }]}>Multispectral Satellite Telemetry</Text>
                      <Text style={[styles.scopeDesc, { color: subTextColor }]}>
                        Sentinel-2 Earth observation, NDVI vegetative indices, soil moisture radar and automated irrigation alerts.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Row 2: Technology Stack & Executive Contact */}
            <View style={[styles.gridRow, !isDesktop && styles.gridRowMobile]}>
              {/* Card 3: Platform Architecture & Tech Stack */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#f3e8ff' : '#3b0764' }]}>
                    <Ionicons name="hardware-chip" size={18} color="#9333ea" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Technology Stack & Architecture</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]}>Full-Stack Enterprise Infrastructure</Text>
                  </View>
                </View>

                <View style={styles.techGrid}>
                  <View style={[styles.techItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Ionicons name="code-slash" size={20} color="#6366f1" />
                    <Text style={[styles.techName, { color: textColor }]}>Frontend & Admin</Text>
                    <Text style={[styles.techDetail, { color: subTextColor }]}>React Native Web, Expo Router v3, TypeScript</Text>
                  </View>

                  <View style={[styles.techItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Ionicons name="server" size={20} color="#10b981" />
                    <Text style={[styles.techName, { color: textColor }]}>Backend Core</Text>
                    <Text style={[styles.techDetail, { color: subTextColor }]}>NestJS 10 Enterprise API, Node.js, WebSockets</Text>
                  </View>

                  <View style={[styles.techItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Ionicons name="server-outline" size={20} color="#3b82f6" />
                    <Text style={[styles.techName, { color: textColor }]}>Database & ORM</Text>
                    <Text style={[styles.techDetail, { color: subTextColor }]}>PostgreSQL 16 High-Performance, Prisma ORM v6</Text>
                  </View>

                  <View style={[styles.techItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Ionicons name="cloud-done" size={20} color="#f59e0b" />
                    <Text style={[styles.techName, { color: textColor }]}>Cloud Host</Text>
                    <Text style={[styles.techDetail, { color: subTextColor }]}>Hostinger Ubuntu 24.04 LTS, Nginx, PM2, TLS 1.3</Text>
                  </View>

                  <View style={[styles.techItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Ionicons name="sparkles" size={20} color="#ec4899" />
                    <Text style={[styles.techName, { color: textColor }]}>AI Engine ({config.ai?.activeProvider || 'GEMINI'})</Text>
                    <Text style={[styles.techDetail, { color: subTextColor }]}>Google Gemini 1.5 Pro / Flash & Computer Vision</Text>
                  </View>

                  <View style={[styles.techItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Ionicons name="card-outline" size={20} color="#10b981" />
                    <Text style={[styles.techName, { color: textColor }]}>Payment Gateway ({config.gateway?.activeGateway || 'PHONEPE'})</Text>
                    <Text style={[styles.techDetail, { color: subTextColor }]}>
                      {config.gateway?.isSandbox ? 'Sandbox / Test Mode' : 'Live Production Mode'} • UPI Direct
                    </Text>
                  </View>

                  <View style={[styles.techItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Ionicons name="chatbubbles" size={20} color="#14b8a6" />
                    <Text style={[styles.techName, { color: textColor }]}>SMS & WhatsApp ({config.sms?.activeProvider || 'FIREBASE'})</Text>
                    <Text style={[styles.techDetail, { color: subTextColor }]}>Fast2SMS DLT-Approved, Meta WhatsApp Cloud API</Text>
                  </View>

                  <View style={[styles.techItem, { backgroundColor: isLight ? '#f8fafc' : '#020617', borderColor: cardBorder }]}>
                    <Ionicons name="planet-outline" size={20} color="#0284c7" />
                    <Text style={[styles.techName, { color: textColor }]}>Satellite Telemetry ({config.satellite?.activeProvider || 'AGROMONITORING'})</Text>
                    <Text style={[styles.techDetail, { color: subTextColor }]}>Sentinel-2 Earth Observation & Soil Indices</Text>
                  </View>
                </View>
              </View>

              {/* Card 4: Official Contacts & Platform Telemetry */}
              <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.gridCol]}>
                <View style={styles.cardHeader}>
                  <View style={[styles.cardHeaderIcon, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                    <Ionicons name="call" size={18} color="#f59e0b" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: textColor }]}>Contact & Operating Telemetry</Text>
                    <Text style={[styles.cardSubtitle, { color: subTextColor }]}>Helpdesk, Support Channels & Build Version</Text>
                  </View>
                </View>

                <View style={styles.infoList}>
                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Helpline Number</Text>
                    <View style={styles.addressWrap}>
                      <Text style={[styles.infoValue, { color: textColor, fontWeight: '700' }]}>
                        {masterData.primaryMobile || masterData.officialPhone || aboutData.supportPhone || '+91 95776 22000'}
                      </Text>
                      <TouchableOpacity
                        style={styles.copyInlineBtn}
                        onPress={() => handleCopy('Helpline', masterData.primaryMobile || masterData.officialPhone || aboutData.supportPhone || '+91 95776 22000')}
                      >
                        <Ionicons name="copy-outline" size={13} color="#6366f1" />
                        <Text style={styles.copyInlineText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Official Email</Text>
                    <View style={styles.addressWrap}>
                      <Text style={[styles.infoValue, { color: textColor, fontWeight: '600' }]}>
                        {masterData.supportEmail || masterData.officialEmail || aboutData.supportEmail || 'support@farmsking.in'}
                      </Text>
                      <TouchableOpacity
                        style={styles.copyInlineBtn}
                        onPress={() => handleCopy('Support Email', masterData.supportEmail || masterData.officialEmail || aboutData.supportEmail || 'support@farmsking.in')}
                      >
                        <Ionicons name="copy-outline" size={13} color="#6366f1" />
                        <Text style={styles.copyInlineText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Grievance Officer</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontWeight: '600' }]}>
                      {masterData.grievanceOfficerName || 'Surinder Singh'} ({masterData.grievanceOfficerEmail || 'grievance@farmsking.in'})
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Official Web Portal</Text>
                    <Text style={[styles.infoValue, { color: '#6366f1', fontWeight: '600' }]}>
                      {masterData.websiteUrl || 'https://farmsking.in'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Platform Version</Text>
                    <Text style={[styles.infoValue, { color: textColor, fontWeight: '700' }]}>
                      {aboutData.appVersion ? `v${aboutData.appVersion}-production` : 'v2.4.0-production'}
                    </Text>
                  </View>

                  <View style={[styles.infoRow, { borderBottomColor: cardBorder }]}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>System SLA</Text>
                    <View style={styles.statusPill}>
                      <View style={[styles.liveDot, { backgroundColor: '#10b981' }]} />
                      <Text style={[styles.statusPillText, { color: '#10b981' }]}>100% Operational (Production)</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Developer Guide</Text>
                    <Text style={[styles.infoValue, { color: subTextColor, fontSize: 12, lineHeight: 18 }]}>
                      To append new settings tabs, register their metadata inside the SETTINGS_TABS array and configure corresponding paths in navigationPillars.ts.
                    </Text>
                  </View>
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
    gap: 20,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  tabLabel: {
    fontSize: 14,
  },
  contentScroll: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    maxWidth: 1400,
    alignSelf: 'center',
    width: '100%',
  },
  contentContainerMobile: {
    padding: 16,
  },
  aboutTabWrapper: {
    gap: 20,
  },
  heroBanner: {
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  heroIconBadge: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroOrgTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  modularNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  modularNoticeTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  modularNoticeDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 17,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 20,
  },
  gridRowMobile: {
    flexDirection: 'column',
    gap: 16,
  },
  gridCol: {
    flex: 1,
  },
  card: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  cardHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
  },
  addressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  copyInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  copyInlineText: {
    fontSize: 11,
    color: '#6366f1',
    fontWeight: '600',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scopeList: {
    gap: 12,
  },
  scopeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  scopeNumBox: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scopeNumText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#4f46e5',
  },
  scopeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  scopeDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 16,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  techItem: {
    width: '48%',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    gap: 6,
  },
  techName: {
    fontSize: 13,
    fontWeight: '700',
  },
  techDetail: {
    fontSize: 11,
    lineHeight: 15,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
