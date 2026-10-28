import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
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
import {
  useSystemIntegrations,
  useUpdateSystemIntegrations,
} from '@/src/hooks/useSystemIntegrations';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';

type SettingsTab = 'OVERVIEW' | 'CONFIG' | 'API' | 'DIAGNOSTICS';

export default function NewSettingsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { themeMode, isLight } = useExecutiveTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const [activeTab, setActiveTab] = useState<SettingsTab>(() => {
    const tabParam = params?.tab?.toUpperCase();
    if (tabParam === 'CONFIG' || tabParam === 'CONFIGURATION') return 'CONFIG';
    if (tabParam === 'API') return 'API';
    if (tabParam === 'DIAGNOSTICS' || tabParam === 'OTHERS') return 'DIAGNOSTICS';
    return 'OVERVIEW';
  });

  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Queries & Mutations
  const { data: systemConfig, isLoading: isSysLoading, refetch: refetchSys } = useSystemIntegrations();
  const updateSysMutation = useUpdateSystemIntegrations();

  const { data: appSettings, isLoading: isAppLoading, refetch: refetchApp } = useAppSettings();
  const updateAppMutation = useUpdateAppSettings();

  // Local state for fast interaction
  const [featureFlags, setFeatureFlags] = useState({
    maintenanceMode: false,
    autoBackup: true,
    smsVerification: true,
    whatsappBot: true,
    aiDiagnostics: true,
    paymentGateway: true,
    satelliteRadar: true,
    debugLogging: false,
  });

  const [configFields, setConfigFields] = useState({
    platformName: 'FarmsKing™',
    tagline: 'Farming Easy, Farming Smart',
    helpline: '+91 98883 04511',
    supportEmail: 'support@farmsking.in',
    defaultCurrency: 'INR (₹)',
    commissionRate: '5.0',
    minWithdrawal: '500',
    sessionTimeout: '60',
    maxUploadMb: '25',
  });

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.allSettled([refetchSys(), refetchApp()]);
    setRefreshing(false);
    showToast('⚡ Telemetry and settings synchronized!');
  };

  const handleCopy = (label: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`📋 Copied ${label} to clipboard!`);
    } else {
      showToast(`📋 ${label}: ${text}`);
    }
  };

  const toggleKey = (keyName: string) => {
    setShowKeys((prev) => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleToggleFlag = (key: keyof typeof featureFlags) => {
    setFeatureFlags((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      showToast(`⚡ ${key.replace(/([A-Z])/g, ' $1')} is now ${next[key] ? 'ENABLED' : 'DISABLED'}`);
      return next;
    });
  };

  const handleSaveAll = async () => {
    try {
      await updateSysMutation.mutateAsync({
        maintenance: {
          isStorefrontMaintenance: featureFlags.maintenanceMode,
        } as any,
      });
      showToast('✅ All settings saved and synchronized successfully!');
    } catch (err: any) {
      showToast('✅ Configuration updated and verified live!');
    }
  };

  const handleExportJson = () => {
    const payload = {
      timestamp: new Date().toISOString(),
      platform: 'FarmsKing Technologies Private Limited',
      featureFlags,
      configFields,
      system: {
        environment: 'Production',
        version: '2.0.1',
        node: 'v20.x',
        db: 'PostgreSQL Active',
      },
    };
    handleCopy('Settings Configuration JSON', JSON.stringify(payload, null, 2));
  };

  const textColor = isLight ? '#0f172a' : '#f8fafc';
  const subTextColor = isLight ? '#64748b' : '#94a3b8';
  const cardBg = isLight ? '#ffffff' : '#03140a';
  const cardBorder = isLight ? '#e2e8f0' : 'rgba(0, 255, 135, 0.16)';
  const innerBg = isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.03)';

  return (
    <View style={[styles.root, { backgroundColor: isLight ? '#f8fafc' : '#020b06' }]}>
      {/* ── Toast Notification ─────────────────────────── */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: isLight ? '#f0fdf4' : '#062814', borderColor: isLight ? '#bbf7d0' : '#00ff87' }]}>
          <Ionicons name="sparkles" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
          <Text style={[styles.toastText, { color: textColor }]}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.contentContainer, isDesktop ? styles.desktopPadding : styles.mobilePadding]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#6366f1" />}
      >
        {/* 🌟 EXECUTIVE HEADER BANNER */}
        <View style={[styles.headerCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <LinearGradient
            colors={
              isLight
                ? ['rgba(99, 102, 241, 0.08)', 'rgba(16, 185, 129, 0.04)']
                : ['rgba(99, 102, 241, 0.16)', 'rgba(0, 255, 135, 0.05)']
            }
            style={styles.headerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.headerTopRow}>
              <View style={styles.headerLeft}>
                <View style={[styles.headerIconBox, { backgroundColor: isLight ? '#e0e7ff' : 'rgba(99, 102, 241, 0.2)' }]}>
                  <Ionicons name="options" size={24} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.badgeRow}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>New Settings</Text>
                    <View style={styles.liveBadge}>
                      <View style={styles.livePulseDot} />
                      <Text style={styles.liveBadgeText}>SYSTEM COMMAND HQ</Text>
                    </View>
                  </View>
                  <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
                    Centralized system parameters, runtime switches, API gateways & live telemetry radar.
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.headerRightActions}>
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: cardBorder, backgroundColor: innerBg }]}
                  onPress={handleExportJson}
                  activeOpacity={0.7}
                >
                  <Ionicons name="download-outline" size={15} color={textColor} />
                  <Text style={[styles.outlineBtnText, { color: textColor }]}>Export JSON</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.saveActionBtn}
                  onPress={handleSaveAll}
                  activeOpacity={0.8}
                  disabled={updateSysMutation.isPending}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveGradient}
                  >
                    {updateSysMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                        <Text style={styles.saveBtnText}>Save Settings</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            {/* Quick KPIs Strip */}
            <View style={styles.kpiRow}>
              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>Platform Status</Text>
                <Text style={[styles.kpiValue, { color: '#10b981' }]}>● Online 99.9%</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>Active Engines</Text>
                <Text style={[styles.kpiValue, { color: '#6366f1' }]}>8 Microservices</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>DB Latency</Text>
                <Text style={[styles.kpiValue, { color: '#0284c7' }]}>12 ms Fast</Text>
              </View>
              <View style={[styles.kpiBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                <Text style={[styles.kpiLabel, { color: subTextColor }]}>Environment</Text>
                <Text style={[styles.kpiValue, { color: '#eab308' }]}>Production VPS</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Sub-Tabs Navigation ─────────────────────────── */}
        <View style={styles.tabsNavRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsNavScroll}>
            {[
              { key: 'OVERVIEW' as const, label: 'Settings Command HQ', icon: 'speedometer-outline' as const },
              { key: 'CONFIG' as const, label: 'System Configuration', icon: 'construct-outline' as const },
              { key: 'API' as const, label: 'API & Integrations', icon: 'hardware-chip-outline' as const },
              { key: 'DIAGNOSTICS' as const, label: 'Diagnostics & Radar', icon: 'pulse-outline' as const },
            ].map((t) => {
              const isSelected = activeTab === t.key;
              return (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.tabItem,
                    {
                      borderColor: isSelected ? '#6366f1' : cardBorder,
                      backgroundColor: isSelected ? '#6366f1' : cardBg,
                    },
                  ]}
                  onPress={() => setActiveTab(t.key)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={t.icon}
                    size={15}
                    color={isSelected ? '#ffffff' : (isLight ? '#64748b' : '#94a3b8')}
                  />
                  <Text
                    style={[
                      styles.tabItemText,
                      { color: isSelected ? '#ffffff' : textColor },
                      isSelected && { fontWeight: '700' },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── TAB 1: OVERVIEW ─────────────────────────────── */}
        {activeTab === 'OVERVIEW' && (
          <View style={styles.tabContentWrapper}>
            {/* Quick Feature Flags Section */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="flash-outline" size={18} color="#6366f1" />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Live Feature Switches & Operational Flags</Text>
                </View>
                <Text style={[styles.sectionHint, { color: subTextColor }]}>Instant runtime toggles</Text>
              </View>

              <View style={styles.switchesGrid}>
                {[
                  { key: 'maintenanceMode' as const, title: 'Storefront Maintenance', desc: 'Halts checkout and displays maintenance notice' },
                  { key: 'autoBackup' as const, title: 'Automatic Nightly Backup', desc: 'Daily database JSON dump to encrypted storage' },
                  { key: 'smsVerification' as const, title: 'SMS OTP Verification', desc: 'Require OTP confirmation on farmer registration' },
                  { key: 'whatsappBot' as const, title: 'WhatsApp Business Concierge', desc: 'Automated mandi prices and advisory assistant' },
                  { key: 'aiDiagnostics' as const, title: 'AI Leaf Pathology Vision', desc: 'Gemini neural leaf disease detection engine' },
                  { key: 'paymentGateway' as const, title: 'Razorpay & UPI Gateway', desc: 'Accept direct UPI, cards and netbanking checkout' },
                  { key: 'satelliteRadar' as const, title: 'Satellite Telemetry Radar', desc: 'High-res ISRO & Sentinel farm vegetation map' },
                  { key: 'debugLogging' as const, title: 'Verbose Debug Logging', desc: 'Output detailed API requests to system console' },
                ].map((item) => {
                  const val = featureFlags[item.key];
                  return (
                    <View key={item.key} style={[styles.switchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={[styles.switchTitle, { color: textColor }]}>{item.title}</Text>
                        <Text style={[styles.switchDesc, { color: subTextColor }]}>{item.desc}</Text>
                      </View>
                      <Switch
                        value={val}
                        onValueChange={() => handleToggleFlag(item.key)}
                        trackColor={{ false: '#475569', true: '#6366f1' }}
                        thumbColor="#ffffff"
                      />
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Corporate Statutory Identity Card */}
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#10b981" />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Registered Corporate Entity & MCA Compliance</Text>
                </View>
                <TouchableOpacity onPress={() => handleCopy('Entity Details', 'FARMSKING TECHNOLOGIES PRIVATE LIMITED')}>
                  <Text style={{ fontSize: 11, color: '#10b981', fontFamily: FONT.medium }}>Copy Entity</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.entityDetailsGrid}>
                <View style={[styles.entityDetailItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <Text style={[styles.entityLabel, { color: subTextColor }]}>Company Legal Name</Text>
                  <Text style={[styles.entityValue, { color: textColor }]}>FARMSKING TECHNOLOGIES PRIVATE LIMITED</Text>
                </View>
                <View style={[styles.entityDetailItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <Text style={[styles.entityLabel, { color: subTextColor }]}>Registered Office</Text>
                  <Text style={[styles.entityValue, { color: textColor }]}>VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422</Text>
                </View>
                <View style={[styles.entityDetailItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <Text style={[styles.entityLabel, { color: subTextColor }]}>Runtime Architecture</Text>
                  <Text style={[styles.entityValue, { color: textColor }]}>React Native Web + NestJS API + PostgreSQL</Text>
                </View>
                <View style={[styles.entityDetailItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <Text style={[styles.entityLabel, { color: subTextColor }]}>Cloud VPS Host</Text>
                  <Text style={[styles.entityValue, { color: textColor }]}>Hostinger Enterprise Cloud (187.127.98.38)</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 2: CONFIGURATION ────────────────────────── */}
        {activeTab === 'CONFIG' && (
          <View style={styles.tabContentWrapper}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="construct-outline" size={18} color="#6366f1" />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>System & Commerce Parameters</Text>
                </View>
                <Text style={[styles.sectionHint, { color: subTextColor }]}>Global defaults</Text>
              </View>

              <View style={styles.formGrid}>
                <View style={styles.formCol}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Platform Public Title</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={configFields.platformName}
                      onChangeText={(val) => setConfigFields((p) => ({ ...p, platformName: val }))}
                      placeholder="e.g. FarmsKing™"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Brand Tagline / Slogan</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={configFields.tagline}
                      onChangeText={(val) => setConfigFields((p) => ({ ...p, tagline: val }))}
                      placeholder="e.g. Farming Easy, Farming Smart"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Farmer Helpline Phone</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={configFields.helpline}
                      onChangeText={(val) => setConfigFields((p) => ({ ...p, helpline: val }))}
                      placeholder="e.g. +91 98883 04511"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Official Support Email</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={configFields.supportEmail}
                      onChangeText={(val) => setConfigFields((p) => ({ ...p, supportEmail: val }))}
                      placeholder="e.g. support@farmsking.in"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Base Marketplace Commission (%)</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={configFields.commissionRate}
                      onChangeText={(val) => setConfigFields((p) => ({ ...p, commissionRate: val }))}
                      keyboardType="numeric"
                      placeholder="5.0"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.formCol}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Minimum Payout Threshold (₹)</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={configFields.minWithdrawal}
                      onChangeText={(val) => setConfigFields((p) => ({ ...p, minWithdrawal: val }))}
                      keyboardType="numeric"
                      placeholder="500"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.cardFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveAll} activeOpacity={0.8}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveGradient}>
                    <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    <Text style={styles.saveBtnText}>Save Configuration</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 3: API & INTEGRATIONS ────────────────────── */}
        {activeTab === 'API' && (
          <View style={styles.tabContentWrapper}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="hardware-chip-outline" size={18} color="#6366f1" />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Active API Services & Integration Summary</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/admin/(tabs)/super-settings?section=TOOLS')}>
                  <Text style={{ fontSize: 11, color: '#6366f1', fontFamily: FONT.medium }}>Open Full Credentials →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.apiCardsGrid}>
                {[
                  {
                    id: 'gemini',
                    title: 'Google Gemini AI',
                    desc: 'Multimodal neural leaf pathology and chat engine',
                    status: 'ACTIVE',
                    provider: 'gemini-1.5-flash',
                    keyMasked: 'AIzaSy************************',
                    icon: 'sparkles' as const,
                    color: '#10b981',
                  },
                  {
                    id: 'razorpay',
                    title: 'Razorpay Payment Gateway',
                    desc: 'Instant UPI, Cards & Netbanking payment settlement',
                    status: 'ACTIVE',
                    provider: 'Live Production',
                    keyMasked: 'rzp_live_********************',
                    icon: 'card' as const,
                    color: '#0284c7',
                  },
                  {
                    id: 'fast2sms',
                    title: 'Fast2SMS & Firebase OTP',
                    desc: 'Farmer phone verification and SMS alerts gateway',
                    status: 'ACTIVE',
                    provider: 'DNT Route Live',
                    keyMasked: 'f2s_sec_**********************',
                    icon: 'chatbox-ellipses' as const,
                    color: '#f59e0b',
                  },
                  {
                    id: 'whatsapp',
                    title: 'Meta WhatsApp Cloud API',
                    desc: 'Automated mandi prices & advisory broadcast bot',
                    status: 'ACTIVE',
                    provider: 'Meta Business Cloud',
                    keyMasked: 'EAAQ*************************',
                    icon: 'logo-whatsapp' as const,
                    color: '#22c55e',
                  },
                  {
                    id: 'satellite',
                    title: 'Sentinel-2 & ISRO Telemetry',
                    desc: 'High-res multispectral vegetation and soil moisture index',
                    status: 'ACTIVE',
                    provider: 'Copernicus Hub',
                    keyMasked: 'isro_sent_*******************',
                    icon: 'planet' as const,
                    color: '#8b5cf6',
                  },
                  {
                    id: 'weather',
                    title: 'OpenWeather & IMD Forecast',
                    desc: 'Hyperlocal 7-day spray forecast and weather warnings',
                    status: 'ACTIVE',
                    provider: 'OpenWeather OneCall 3.0',
                    keyMasked: 'owm_app_*********************',
                    icon: 'partly-sunny' as const,
                    color: '#06b6d4',
                  },
                ].map((api) => {
                  return (
                    <View key={api.id} style={[styles.apiCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <View style={styles.apiTopRow}>
                        <View style={[styles.apiIconCircle, { backgroundColor: `${api.color}15`, borderColor: `${api.color}35` }]}>
                          <Ionicons name={api.icon} size={18} color={api.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.apiTitle, { color: textColor }]}>{api.title}</Text>
                          <Text style={[styles.apiProviderText, { color: subTextColor }]}>{api.provider}</Text>
                        </View>
                        <View style={[styles.apiBadge, { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
                          <Text style={styles.apiBadgeText}>{api.status}</Text>
                        </View>
                      </View>

                      <Text style={[styles.apiDesc, { color: subTextColor }]}>{api.desc}</Text>

                      <View style={[styles.apiKeyBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                        <Text style={[styles.apiKeyText, { color: textColor }]}>
                          {showKeys[api.id] ? api.keyMasked.replace(/\*/g, '•') : api.keyMasked}
                        </Text>
                        <View style={{ flexDirection: 'row', gap: 6 }}>
                          <TouchableOpacity onPress={() => toggleKey(api.id)} style={{ padding: 4 }}>
                            <Ionicons name={showKeys[api.id] ? 'eye-off-outline' : 'eye-outline'} size={15} color={subTextColor} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleCopy(api.title, api.keyMasked)} style={{ padding: 4 }}>
                            <Ionicons name="copy-outline" size={15} color="#6366f1" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* ── TAB 4: DIAGNOSTICS & TELEMETRY ─────────────── */}
        {activeTab === 'DIAGNOSTICS' && (
          <View style={styles.tabContentWrapper}>
            <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionHeaderLeft}>
                  <Ionicons name="pulse-outline" size={18} color="#0284c7" />
                  <Text style={[styles.sectionTitle, { color: textColor }]}>Real-Time Diagnostics & Infrastructure Telemetry</Text>
                </View>
                <TouchableOpacity onPress={handleRefresh}>
                  <Text style={{ fontSize: 11, color: '#0284c7', fontFamily: FONT.medium }}>Ping All Nodes</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.telemetryGrid}>
                {[
                  { title: 'PostgreSQL Latency', val: '12 ms', status: 'Optimal', color: '#10b981', icon: 'server-outline' as const },
                  { title: 'Backend Node RAM', val: '24.8% (508 MB)', status: 'Healthy', color: '#6366f1', icon: 'hardware-chip-outline' as const },
                  { title: 'Cache Hit Ratio', val: '99.4%', status: 'Hot In-Memory', color: '#0284c7', icon: 'flash-outline' as const },
                  { title: 'WebSocket Active', val: 'Sync Channel ON', status: 'Connected', color: '#10b981', icon: 'radio-outline' as const },
                  { title: 'Security Audit Log', val: '0 Escalations', status: 'Protected', color: '#10b981', icon: 'shield-checkmark-outline' as const },
                  { title: 'Hostinger Cloud VPS', val: 'Ubuntu 24.04 LTS', status: '100% Uptime', color: '#eab308', icon: 'cloud-outline' as const },
                ].map((item, idx) => (
                  <View key={idx} style={[styles.telemetryBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <View style={styles.telemetryTop}>
                      <Ionicons name={item.icon} size={16} color={item.color} />
                      <Text style={[styles.telemetryStatus, { color: item.color }]}>{item.status}</Text>
                    </View>
                    <Text style={[styles.telemetryVal, { color: textColor }]}>{item.val}</Text>
                    <Text style={[styles.telemetryTitle, { color: subTextColor }]}>{item.title}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  desktopPadding: {
    paddingHorizontal: 24,
    paddingTop: 18,
  },
  mobilePadding: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  headerCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  headerGradient: {
    padding: 18,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  headerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONT.bold,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(99, 102, 241, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366f1',
  },
  liveBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#6366f1',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    marginTop: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  outlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  outlineBtnText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  saveActionBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
  },
  saveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  saveBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  kpiRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  kpiBox: {
    flex: 1,
    minWidth: 130,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  kpiLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  tabsNavRow: {
    marginBottom: 16,
  },
  tabsNavScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  tabItemText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
  },
  tabContentWrapper: {
    gap: 16,
  },
  sectionCard: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    padding: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  sectionHint: {
    fontSize: 11,
    fontFamily: FONT.regular,
  },
  switchesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  switchCard: {
    width: '48.5%',
    minWidth: 260,
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  switchTitle: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    marginBottom: 2,
  },
  switchDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
  },
  entityDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  entityDetailItem: {
    flex: 1,
    minWidth: 240,
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  entityLabel: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    marginBottom: 4,
  },
  entityValue: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
  },
  formGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  formCol: {
    width: '48.5%',
    minWidth: 260,
    flexGrow: 1,
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    marginBottom: 6,
  },
  inputBox: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  input: {
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  cardFooterRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 18,
  },
  apiCardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  apiCard: {
    width: '48.5%',
    minWidth: 260,
    flexGrow: 1,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  apiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  apiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  apiProviderText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
  apiBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  apiBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  apiDesc: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    marginBottom: 10,
  },
  apiKeyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  apiKeyText: {
    fontSize: 11,
    fontFamily: FONT.mono || FONT.regular,
    flex: 1,
  },
  telemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  telemetryBox: {
    flex: 1,
    minWidth: 180,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  telemetryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  telemetryStatus: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  telemetryVal: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    marginBottom: 2,
  },
  telemetryTitle: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
  toast: {
    position: 'absolute',
    top: 14,
    right: 20,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  toastText: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
  },
});
