import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSystemIntegrations, useUpdateSystemIntegrations } from '@/src/hooks/useSystemIntegrations';
import {
  SystemIntegrationsConfig,
  mergeSystemIntegrationsWithDefaults,
  SupportedPaymentGateway,
  ProjectMasterDataConfig,
  DEFAULT_PROJECT_MASTER_DATA,
} from '@/src/api/appSettings.api';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS, SPACING } from '@/constants/theme';

type ToolCategory =
  | 'MASTER_DATA'
  | 'AI'
  | 'PAYMENTS'
  | 'SMS'
  | 'WHATSAPP'
  | 'SATELLITE'
  | 'WEATHER'
  | 'LOGISTICS'
  | 'PUSH';

type MasterDataSubTab =
  | 'basic-details'
  | 'theme-colors'
  | 'social'
  | 'smtp'
  | 'email-templates'
  | 'crop-sessions'
  | 'certificates'
  | 'franchise'
  | 'backup'
  | 'otp-login'
  | 'maintenance'
  | 'tax-gst';

type EmailTemplateKey = 'registration' | 'otp' | 'feeReceipt' | 'resultPublished' | 'certificateIssued';

interface MasterDataTabItem {
  key: MasterDataSubTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface CategoryFilter {
  key: ToolCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

type SectionTab = 'MASTER_DATA' | 'TOOLS';

const TOOL_SERVICES_FILTERS: CategoryFilter[] = [
  { key: 'AI', label: 'AI Intelligence & Crop Doctor', icon: 'sparkles-outline' },
  { key: 'PAYMENTS', label: 'Payment Gateway & Checkout', icon: 'card-outline' },
  { key: 'SMS', label: 'SMS & OTP Service', icon: 'chatbox-ellipses-outline' },
  { key: 'WHATSAPP', label: 'WhatsApp Business Bot', icon: 'logo-whatsapp' },
  { key: 'SATELLITE', label: 'Satellite Farm Radar', icon: 'planet-outline' },
  { key: 'WEATHER', label: 'Weather & Spray Forecast', icon: 'partly-sunny-outline' },
  { key: 'LOGISTICS', label: 'Courier & Logistics', icon: 'cube-outline' },
  { key: 'PUSH', label: 'Push Notifications (FCM)', icon: 'notifications-outline' },
];

const CATEGORY_FILTERS: CategoryFilter[] = [
  { key: 'MASTER_DATA', label: 'Project Master Data & Entity Setup', icon: 'business-outline' },
  ...TOOL_SERVICES_FILTERS,
];

const MASTER_DATA_TABS: MasterDataTabItem[] = [
  { key: 'basic-details', label: 'Basic Details & Identity', icon: 'business-outline' },
  { key: 'theme-colors', label: 'Theme Colors & Presets', icon: 'color-palette-outline' },
  { key: 'social', label: 'Social Media & Maps', icon: 'share-social-outline' },
  { key: 'smtp', label: 'Email SMTP Settings', icon: 'mail-outline' },
  { key: 'email-templates', label: 'Email Templates', icon: 'document-text-outline' },
  { key: 'crop-sessions', label: 'Crop Cycles & Seasons', icon: 'calendar-outline' },
  { key: 'certificates', label: 'Certificates & QR Portal', icon: 'ribbon-outline' },
  { key: 'franchise', label: 'Franchise & Mandi Agents', icon: 'storefront-outline' },
  { key: 'backup', label: 'Backup & Recovery', icon: 'server-outline' },
  { key: 'otp-login', label: 'OTP Login ON/OFF', icon: 'shield-checkmark-outline' },
  { key: 'maintenance', label: 'Maintenance Mode', icon: 'construct-outline' },
  { key: 'tax-gst', label: 'Tax / GST Settings', icon: 'receipt-outline' },
];

const THEME_PRESETS = [
  { name: 'Emerald Agritech (Default)', primary: '#16a34a', secondary: '#0284c7', button: '#10b981' },
  { name: 'Golden Mandi Harvest', primary: '#d97706', secondary: '#2563eb', button: '#f59e0b' },
  { name: 'Deep Eco-Forest', primary: '#059669', secondary: '#0891b2', button: '#10b981' },
  { name: 'Obsidian Executive Dark', primary: '#0f172a', secondary: '#6366f1', button: '#10b981' },
];

const SMTP_PRESETS = [
  { name: 'Hostinger Business Mail', host: 'smtp.hostinger.com', port: 465, enc: 'SSL' },
  { name: 'Google Workspace / Gmail', host: 'smtp.gmail.com', port: 587, enc: 'TLS' },
  { name: 'SendGrid / Twilio', host: 'smtp.sendgrid.net', port: 587, enc: 'TLS' },
  { name: 'Amazon SES (Mumbai)', host: 'email-smtp.ap-south-1.amazonaws.com', port: 587, enc: 'TLS' },
];

const EMAIL_TEMPLATE_ITEMS: { key: EmailTemplateKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'registration', label: 'Registration Email', icon: 'person-add-outline' },
  { key: 'otp', label: 'OTP Verification', icon: 'key-outline' },
  { key: 'feeReceipt', label: 'Fee / Order Receipt', icon: 'receipt-outline' },
  { key: 'resultPublished', label: 'Crop Doctor Result', icon: 'fitness-outline' },
  { key: 'certificateIssued', label: 'Certificate Issued', icon: 'ribbon-outline' },
];

export default function SuperSettingsScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 768));
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  const params = useLocalSearchParams<{ section?: string }>();
  const { data: remoteConfig, isLoading, refetch } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const [localConfig, setLocalConfig] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(remoteConfig)
  );
  const isToolsSection = params?.section === 'TOOLS' || params?.section === 'API';
  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>(() => {
    return isToolsSection ? 'TOOLS' : 'MASTER_DATA';
  });
  const [activeFilter, setActiveFilter] = useState<ToolCategory>(() => {
    return 'AI';
  });

  useEffect(() => {
    if (params?.section === 'TOOLS' || params?.section === 'API') {
      setActiveSectionTab('TOOLS');
    } else if (params?.section === 'MASTER_DATA') {
      setActiveSectionTab('MASTER_DATA');
    }
  }, [params?.section]);
  const [masterSubTab, setMasterSubTab] = useState<MasterDataSubTab>('basic-details');
  const [activeEmailTmpl, setActiveEmailTmpl] = useState<EmailTemplateKey>('registration');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [previewEmailHtml, setPreviewEmailHtml] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (remoteConfig) {
      setLocalConfig(mergeSystemIntegrationsWithDefaults(remoteConfig));
    }
  }, [remoteConfig]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const toggleShowSecret = (fieldKey: string) => {
    setShowSecrets((prev) => ({ ...prev, [fieldKey]: !prev[fieldKey] }));
  };

  const masterData: ProjectMasterDataConfig = localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;

  const handleUpdateMasterField = (field: keyof ProjectMasterDataConfig, value: any) => {
    setLocalConfig((prev) => ({
      ...prev,
      projectMasterData: {
        ...DEFAULT_PROJECT_MASTER_DATA,
        ...(prev.projectMasterData || {}),
        [field]: value,
      },
    }));
  };

  const handleUpdateMasterNested = (
    section: 'themeColors' | 'socialMedia' | 'smtp' | 'emailTemplates' | 'otpLogin' | 'maintenance' | 'taxGst',
    field: string,
    value: any
  ) => {
    setLocalConfig((prev) => {
      const currentMaster = prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      const currentSection = (currentMaster as any)[section] || {};
      return {
        ...prev,
        projectMasterData: {
          ...currentMaster,
          [section]: {
            ...currentSection,
            [field]: value,
          },
        },
      };
    });
  };

  const handleUpdateEmailTemplate = (templateKey: EmailTemplateKey, field: 'subject' | 'body', value: string) => {
    setLocalConfig((prev) => {
      const currentMaster = prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      const currentTemplates = currentMaster.emailTemplates || DEFAULT_PROJECT_MASTER_DATA.emailTemplates;
      const targetTemplate = currentTemplates[templateKey] || DEFAULT_PROJECT_MASTER_DATA.emailTemplates[templateKey];
      return {
        ...prev,
        projectMasterData: {
          ...currentMaster,
          emailTemplates: {
            ...currentTemplates,
            [templateKey]: {
              ...targetTemplate,
              [field]: value,
            },
          },
        },
      };
    });
  };

  const handleSaveMasterData = async () => {
    try {
      await updateMutation.mutateAsync({
        projectMasterData: localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA,
      });
      showToast('✅ Project Master Data saved and synchronized successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save Project Master Data');
    }
  };

  const handleCopyValue = (label: string, text: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast(`📋 Copied ${label} to clipboard!`);
    } else {
      showToast(`📋 ${label}: ${text}`);
    }
  };

  const handleExportMasterDataJson = () => {
    const dataStr = JSON.stringify(masterData, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(dataStr);
      showToast('💾 Master Data JSON copied to clipboard for export!');
    } else {
      showToast('💾 Master Data export generated successfully!');
    }
  };

  const handleApplyThemePreset = (preset: typeof THEME_PRESETS[0]) => {
    setLocalConfig((prev) => ({
      ...prev,
      projectMasterData: {
        ...(prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
        themeColors: {
          primaryColor: preset.primary,
          secondaryColor: preset.secondary,
          buttonColor: preset.button,
        },
      },
    }));
    showToast(`🎨 Applied "${preset.name}" color preset!`);
  };

  const handleApplySmtpPreset = (preset: typeof SMTP_PRESETS[0]) => {
    setLocalConfig((prev) => {
      const currentMaster = prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      return {
        ...prev,
        projectMasterData: {
          ...currentMaster,
          smtp: {
            ...currentMaster.smtp,
            host: preset.host,
            port: preset.port,
            encryption: preset.enc.toLowerCase() as any,
          },
        },
      };
    });
    showToast(`📧 Applied ${preset.name} SMTP configuration!`);
  };

  const handleTriggerManualBackup = () => {
    const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    handleUpdateMasterNested('backupSettings' as any, 'lastBackupTimestamp', `${timestamp} (Manual Verified)`);
    showToast(`🛡️ Instant backup snapshot generated: ${timestamp}`);
  };

  const handleResetThemeColors = () => {
    setLocalConfig((prev) => ({
      ...prev,
      projectMasterData: {
        ...(prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
        themeColors: {
          primaryColor: '#16a34a',
          secondaryColor: '#0284c7',
          buttonColor: '#10b981',
        },
      },
    }));
    showToast('🎨 Theme colors reset to FarmsKing standard emerald & sky palette.');
  };

  const handleTestEmail = () => {
    const smtp = localConfig.projectMasterData?.smtp || DEFAULT_PROJECT_MASTER_DATA.smtp;
    if (!smtp?.host || !smtp?.fromEmail) {
      Alert.alert('Incomplete SMTP', 'Please enter SMTP Host and From Email before sending test email.');
      return;
    }
    showToast(`📧 Test email ping queued to ${smtp.fromEmail} via ${smtp.host}:${smtp.port}`);
  };

  const handleToggleTool = async (category: keyof SystemIntegrationsConfig, toolName: string) => {
    const currentVal = (localConfig[category] as any)?.isEnabled ?? true;
    const newVal = !currentVal;

    const updated = {
      ...localConfig,
      [category]: {
        ...(localConfig[category] as any),
        isEnabled: newVal,
      },
    };
    setLocalConfig(updated);

    try {
      await updateMutation.mutateAsync({
        [category]: {
          ...(localConfig[category] as any),
          isEnabled: newVal,
        },
      });
      showToast(`⚡ ${toolName} is now ${newVal ? 'ACTIVE' : 'INACTIVE'}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to update tool state');
      refetch();
    }
  };

  const handleUpdateField = (category: keyof SystemIntegrationsConfig, providerKey: string, field: string, value: string) => {
    setLocalConfig((prev) => {
      const cat = (prev[category] as any) || {};
      const providers = cat.providers || {};
      const target = providers[providerKey] || {};
      return {
        ...prev,
        [category]: {
          ...cat,
          providers: {
            ...providers,
            [providerKey]: {
              ...target,
              [field]: value,
            },
          },
        },
      };
    });
  };

  const handleSetProvider = (category: keyof SystemIntegrationsConfig, providerKey: string) => {
    setLocalConfig((prev) => {
      const cat = (prev[category] as any) || {};
      return {
        ...prev,
        [category]: {
          ...cat,
          activeProvider: providerKey,
        },
      };
    });
  };

  const handleSetGateway = (gateway: SupportedPaymentGateway) => {
    setLocalConfig((prev) => ({
      ...prev,
      gateway: {
        ...prev.gateway,
        activeGateway: gateway,
      },
    }));
  };

  const handleToggleSandbox = async (isSandbox: boolean) => {
    setLocalConfig((prev) => ({
      ...prev,
      gateway: {
        ...prev.gateway,
        isSandbox,
      },
    }));
    try {
      await updateMutation.mutateAsync({
        gateway: {
          ...localConfig.gateway,
          isSandbox,
        },
      });
      showToast(`⚡ Payment mode switched to ${isSandbox ? 'SANDBOX TEST' : 'LIVE PRODUCTION'}`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to switch payment mode');
    }
  };

  const handleSaveTool = async (category: keyof SystemIntegrationsConfig, toolName: string) => {
    try {
      await updateMutation.mutateAsync({
        [category]: localConfig[category],
      });
      showToast(`✅ ${toolName} settings saved successfully!`);
    } catch (err: any) {
      Alert.alert('Error', err?.message || `Failed to save ${toolName} settings`);
    }
  };

  if (isLoading || !localConfig) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <ActivityIndicator size="large" color={isLight ? '#16a34a' : '#00ff87'} />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading API Tools & Services...</Text>
      </View>
    );
  }

  const selectedCategory = TOOL_SERVICES_FILTERS.find((c) => c.key === activeFilter) || TOOL_SERVICES_FILTERS[0];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg }]}>
      {/* ── Top Header ─────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderBottomColor: cardBorder }]}>
        <View style={styles.headerInfo}>
          <View style={[styles.badge, { backgroundColor: isLight ? 'rgba(22, 163, 74, 0.08)' : 'rgba(0, 255, 135, 0.08)', borderColor: isLight ? 'rgba(22, 163, 74, 0.25)' : 'rgba(0, 255, 135, 0.25)' }]}>
            <Ionicons
              name={activeSectionTab === 'MASTER_DATA' ? 'business-outline' : 'hardware-chip-outline'}
              size={15}
              color={isLight ? '#16a34a' : '#00ff87'}
            />
            <Text style={[styles.badgeText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
              {activeSectionTab === 'MASTER_DATA' ? 'CENTRAL REGISTRY' : 'TOOL & API ACTIVATOR'}
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            {activeSectionTab === 'MASTER_DATA' ? 'Project Master Data' : 'Platform Tools & Services'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
            {activeSectionTab === 'MASTER_DATA'
              ? 'Company identity, statutory address, tax/GST, contact & platform configuration.'
              : 'Select a tool from the dropdown to configure credentials and toggle activation.'}
          </Text>
        </View>

        {/* ── Primary Settings Section Switcher ── */}
        <View style={[styles.sectionTabsWrapper, !isDesktop && { width: '100%', marginTop: 8 }, { backgroundColor: isLight ? '#f1f5f9' : '#03180c', borderColor: cardBorder }]}>
          <TouchableOpacity
            style={[
              styles.sectionTabBtn,
              !isDesktop && { flex: 1, justifyContent: 'center' },
              activeSectionTab === 'MASTER_DATA' && (isLight ? styles.sectionTabBtnActiveLight : styles.sectionTabBtnActiveDark),
            ]}
            onPress={() => setActiveSectionTab('MASTER_DATA')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="business"
              size={15}
              color={activeSectionTab === 'MASTER_DATA' ? (isLight ? '#ffffff' : '#00ff87') : subTextColor}
            />
            <Text
              style={[
                styles.sectionTabText,
                { color: activeSectionTab === 'MASTER_DATA' ? (isLight ? '#ffffff' : '#00ff87') : subTextColor },
                activeSectionTab === 'MASTER_DATA' && { fontWeight: '700' },
              ]}
            >
              Project Master Data
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.sectionTabBtn,
              !isDesktop && { flex: 1, justifyContent: 'center' },
              activeSectionTab === 'TOOLS' && (isLight ? styles.sectionTabBtnActiveLight : styles.sectionTabBtnActiveDark),
            ]}
            onPress={() => setActiveSectionTab('TOOLS')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="hardware-chip"
              size={15}
              color={activeSectionTab === 'TOOLS' ? (isLight ? '#ffffff' : '#00ff87') : subTextColor}
            />
            <Text
              style={[
                styles.sectionTabText,
                { color: activeSectionTab === 'TOOLS' ? (isLight ? '#ffffff' : '#00ff87') : subTextColor },
                activeSectionTab === 'TOOLS' && { fontWeight: '700' },
              ]}
            >
              Platform Tools & Services
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Toast Alert ─────────────────────────────────────────── */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: isLight ? '#f0fdf4' : '#062814', borderColor: isLight ? '#bbf7d0' : '#00ff87' }]}>
          <Ionicons name="sparkles" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
          <Text style={[styles.toastText, { color: textColor }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Category Dropdown Selector (Only rendered when in TOOLS tab) ── */}
      {activeSectionTab === 'TOOLS' && (
        <View style={[styles.filterBar, { backgroundColor: isLight ? '#f8fafc' : '#021008', borderBottomColor: cardBorder, zIndex: 100 }]}>
          <View style={styles.dropdownContainer}>
            <Text style={[styles.filterLabel, { color: subTextColor }]}>Select Service / Tool:</Text>
            <View style={styles.dropdownRelativeBox}>
              <TouchableOpacity
                style={[styles.dropdownTrigger, { backgroundColor: isLight ? '#ffffff' : '#04170c', borderColor: cardBorder }]}
                onPress={() => setIsDropdownOpen(!isDropdownOpen)}
                activeOpacity={0.8}
              >
                <View style={styles.dropdownLeft}>
                  <Ionicons name={selectedCategory.icon} size={16} color={isLight ? '#16a34a' : '#00ff87'} />
                  <Text style={[styles.dropdownSelectedText, { color: textColor }]}>
                    {selectedCategory.label}
                  </Text>
                </View>
                <Ionicons
                  name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={subTextColor}
                />
              </TouchableOpacity>

              {isDropdownOpen && (
                <View style={[styles.dropdownMenu, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder }]}>
                  {TOOL_SERVICES_FILTERS.map((cat) => {
                    const isSelected = activeFilter === cat.key;
                    return (
                      <TouchableOpacity
                        key={cat.key}
                        style={[
                          styles.dropdownItem,
                          isSelected && (isLight ? styles.dropdownItemActiveLight : styles.dropdownItemActiveDark),
                        ]}
                        onPress={() => {
                          setActiveFilter(cat.key);
                          setIsDropdownOpen(false);
                        }}
                        activeOpacity={0.7}
                      >
                        <View style={styles.dropdownItemLeft}>
                          <Ionicons
                            name={cat.icon}
                            size={16}
                            color={isSelected ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
                          />
                          <Text
                            style={[
                              styles.dropdownItemText,
                              { color: isSelected ? (isLight ? '#16a34a' : '#00ff87') : textColor },
                              isSelected && { fontWeight: '700' },
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* ── Single Active Tool Card Workspace ──────────────────── */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
          {/* 0. Project Master Data & Entity Setup */}
          {activeSectionTab === 'MASTER_DATA' && (
            <View style={[styles.masterContainer, isDesktop && styles.masterContainerDesktop]}>
              {/* Header Banner */}
              <View style={[styles.masterHeaderBanner, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <View style={styles.masterHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Ionicons name="business" size={24} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Project Master Data & Entity Setup</Text>
                      <View style={[styles.statusBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: '#10b981' }]}>CENTRAL REGISTRY</Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Master corporate registry, capital structure, registered address, branding, tax/GST, communication channels and platform rules.
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    style={[styles.outlineActionBtn, { borderColor: cardBorder, backgroundColor: innerBg }]}
                    onPress={handleExportMasterDataJson}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="download-outline" size={15} color={textColor} />
                    <Text style={[styles.outlineActionText, { color: textColor, fontSize: 12.5 }]}>Export JSON</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.globalSaveBtn}
                    onPress={handleSaveMasterData}
                    activeOpacity={0.8}
                    disabled={updateMutation.isPending}
                  >
                    <LinearGradient
                      colors={['#10b981', '#059669']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.globalSaveGradient}
                    >
                      {updateMutation.isPending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <>
                          <Ionicons name="checkmark-done" size={17} color="#ffffff" />
                          <Text style={styles.globalSaveText}>Save Master Data</Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Quick Search & Master Navigation Bar */}
              <View style={[styles.masterSearchBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Ionicons name="search" size={16} color={subTextColor} />
                <TextInput
                  style={[styles.input, { color: textColor, fontSize: 13 }]}
                  value={masterSearchQuery}
                  onChangeText={setMasterSearchQuery}
                  placeholder="Search master settings (e.g. GST, SRN, SMTP, Logo, Backup, Director, Rabi, Session)..."
                  placeholderTextColor={subTextColor}
                />
                {masterSearchQuery ? (
                  <TouchableOpacity onPress={() => setMasterSearchQuery('')} style={{ padding: 4 }}>
                    <Ionicons name="close-circle" size={16} color={subTextColor} />
                  </TouchableOpacity>
                ) : null}
              </View>

              {/* Master Data Sub-tabs Navigation */}
              <View style={[styles.masterSubNavWrapper, isDesktop && styles.masterSubNavDesktopWrapper]}>
                {/* Tab Pills / Sidebar */}
                <View style={[styles.masterPillsNav, isDesktop && styles.masterPillsNavDesktop, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  <ScrollView
                    horizontal={!isDesktop}
                    showsHorizontalScrollIndicator={false}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={[styles.masterPillsScroll, isDesktop && styles.masterPillsScrollDesktop]}
                  >
                    {MASTER_DATA_TABS.filter((tab) =>
                      masterSearchQuery
                        ? tab.label.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
                          tab.key.toLowerCase().includes(masterSearchQuery.toLowerCase())
                        : true
                    ).map((tab) => {
                      const isActive = masterSubTab === tab.key;
                      return (
                        <TouchableOpacity
                          key={tab.key}
                          style={[
                            styles.masterPillItem,
                            isDesktop && styles.masterPillItemDesktop,
                            isActive && (isLight ? styles.masterPillActiveLight : styles.masterPillActiveDark),
                          ]}
                          onPress={() => setMasterSubTab(tab.key)}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={tab.icon}
                            size={16}
                            color={isActive ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
                          />
                          <Text
                            style={[
                              styles.masterPillText,
                              { color: isActive ? (isLight ? '#16a34a' : '#00ff87') : textColor },
                              isActive && { fontWeight: '700' },
                            ]}
                          >
                            {tab.label}
                          </Text>
                          {isActive && isDesktop && (
                            <Ionicons name="chevron-forward" size={14} color={isLight ? '#16a34a' : '#00ff87'} style={{ marginLeft: 'auto' }} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Tab Content Panes */}
                <View style={[styles.masterContentPane, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                  {/* TAB 1: Basic Details & Identity */}
                  {masterSubTab === 'basic-details' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Institute & Company Identity</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Approved corporate name, brand identity, and Ministry of Corporate Affairs (MCA) registration.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.twoCol}>
                          <View style={styles.col}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={[styles.inputLabel, { color: textColor }]}>Institute / Company Legal Name</Text>
                              <TouchableOpacity onPress={() => handleCopyValue('Company Name', masterData.companyLegalName)}>
                                <Text style={{ fontSize: 11, color: '#10b981', fontFamily: FONT.medium }}>Copy</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.companyLegalName}
                                onChangeText={(val) => handleUpdateMasterField('companyLegalName', val)}
                                placeholder="e.g. FARMSKING TECHNOLOGIES PRIVATE LIMITED"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Short Name / Brand Display Name</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.brandDisplayName}
                                onChangeText={(val) => {
                                  handleUpdateMasterField('brandDisplayName', val);
                                  handleUpdateMasterField('shortName', val);
                                }}
                                placeholder="e.g. FarmsKing™"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={{ marginTop: 10 }}>
                          <Text style={[styles.inputLabel, { color: textColor }]}>Tagline / Motto (optional)</Text>
                          <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <TextInput
                              style={[styles.input, { color: textColor }]}
                              value={masterData.tagline}
                              onChangeText={(val) => handleUpdateMasterField('tagline', val)}
                              placeholder="e.g. Farming Easy, Farming Smart | National Smart Farming Platform"
                              placeholderTextColor={subTextColor}
                            />
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 10 }]}>
                          <View style={styles.col}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={[styles.inputLabel, { color: textColor }]}>MCA SRN (Service Request Number)</Text>
                              <TouchableOpacity onPress={() => handleCopyValue('MCA SRN', masterData.mcaSrn)}>
                                <Text style={{ fontSize: 11, color: '#10b981', fontFamily: FONT.medium }}>Copy</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.mcaSrn}
                                onChangeText={(val) => handleUpdateMasterField('mcaSrn', val)}
                                placeholder="e.g. AC6979718"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>CRC Approval Status</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.crcApprovalStatus}
                                onChangeText={(val) => handleUpdateMasterField('crcApprovalStatus', val)}
                                placeholder="e.g. OFFICIALLY APPROVED BY CRC MANESAR"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 10 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Industrial NIC Activity Codes</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.nicCodes}
                                onChangeText={(val) => handleUpdateMasterField('nicCodes', val)}
                                placeholder="e.g. 62013, 01619"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Activity Description</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.activityDescription}
                                onChangeText={(val) => handleUpdateMasterField('activityDescription', val)}
                                placeholder="Agritech Software & Crop Support Services"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Promoters & Statutory Capital Structure Card */}
                      <View style={[styles.paneSectionBox, { marginTop: 18 }]}>
                        <Text style={[styles.sectionSubtitle, { color: textColor }]}>Corporate Capital & Promoters Directory</Text>
                        <View style={[styles.twoCol, { marginTop: 10 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Authorized Equity Capital (INR)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.promotersAndCapital?.authorizedEquityCapitalInr || 100000)}
                                onChangeText={(val) => handleUpdateMasterNested('promotersAndCapital' as any, 'authorizedEquityCapitalInr', parseInt(val, 10) || 100000)}
                                placeholder="100000"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Subscribed & Paid-Up Capital (INR)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.promotersAndCapital?.paidUpCapitalInr || 100000)}
                                onChangeText={(val) => handleUpdateMasterNested('promotersAndCapital' as any, 'paidUpCapitalInr', parseInt(val, 10) || 100000)}
                                placeholder="100000"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 10 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>First Directors (Board of Directors)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.promotersAndCapital?.firstDirectors}
                                onChangeText={(val) => handleUpdateMasterNested('promotersAndCapital' as any, 'firstDirectors', val)}
                                placeholder="Bakhshish Singh, Gagandeep Kaur"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Founder & Chief AI Architect</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.promotersAndCapital?.founderAndChiefAiArchitect}
                                onChangeText={(val) => handleUpdateMasterNested('promotersAndCapital' as any, 'founderAndChiefAiArchitect', val)}
                                placeholder="Surinder Singh"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Logo & Favicon Card */}
                      <View style={[styles.paneSectionBox, { marginTop: 18 }]}>
                        <Text style={[styles.sectionSubtitle, { color: textColor }]}>Logo & Favicon</Text>
                        <View style={[styles.twoCol, { marginTop: 10 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Upload / URL Institute Logo</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.logoUrl}
                                onChangeText={(val) => handleUpdateMasterField('logoUrl', val)}
                                placeholder="https://farmsking.in/assets/logo.png"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                            <View style={[styles.previewFrame, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              {masterData.logoUrl ? (
                                <Image source={{ uri: masterData.logoUrl }} style={styles.logoPreviewImg} resizeMode="contain" />
                              ) : (
                                <Text style={[styles.previewHint, { color: subTextColor }]}>Logo preview</Text>
                              )}
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Upload / URL Favicon</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.faviconUrl}
                                onChangeText={(val) => handleUpdateMasterField('faviconUrl', val)}
                                placeholder="https://farmsking.in/favicon.ico"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                            <View style={[styles.previewFrame, { height: 80, backgroundColor: innerBg, borderColor: cardBorder }]}>
                              {masterData.faviconUrl ? (
                                <Image source={{ uri: masterData.faviconUrl }} style={{ width: 36, height: 36 }} resizeMode="contain" />
                              ) : (
                                <Text style={[styles.previewHint, { color: subTextColor }]}>Favicon preview</Text>
                              )}
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Address & Contact */}
                      <View style={[styles.paneSectionBox, { marginTop: 18 }]}>
                        <Text style={[styles.sectionSubtitle, { color: textColor }]}>Address & Statutory Location</Text>
                        <View style={{ marginTop: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Registered Office Full Address</Text>
                            <TouchableOpacity onPress={() => handleCopyValue('Registered Address', masterData.registeredAddress)}>
                              <Text style={{ fontSize: 11, color: '#10b981', fontFamily: FONT.medium }}>Copy</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={[styles.inputBox, { height: 60, backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <TextInput
                              style={[styles.input, { color: textColor, height: 50 }]}
                              value={masterData.registeredAddress}
                              onChangeText={(val) => handleUpdateMasterField('registeredAddress', val)}
                              placeholder="Enter full registered address"
                              placeholderTextColor={subTextColor}
                              multiline
                            />
                          </View>
                        </View>

                        <View style={{ marginTop: 10 }}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Operational Headquarters Address</Text>
                            <TouchableOpacity onPress={() => handleCopyValue('Operational HQ', masterData.operationalHq)}>
                              <Text style={{ fontSize: 11, color: '#10b981', fontFamily: FONT.medium }}>Copy</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={[styles.inputBox, { height: 60, backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <TextInput
                              style={[styles.input, { color: textColor, height: 50 }]}
                              value={masterData.operationalHq}
                              onChangeText={(val) => handleUpdateMasterField('operationalHq', val)}
                              placeholder="Enter operational headquarters address"
                              placeholderTextColor={subTextColor}
                              multiline
                            />
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 10 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>City / Town</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.city}
                                onChangeText={(val) => handleUpdateMasterField('city', val)}
                                placeholder="e.g. Goindwal Sahib / Makhu"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>State</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.state}
                                onChangeText={(val) => handleUpdateMasterField('state', val)}
                                placeholder="Punjab"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Country</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.country}
                                onChangeText={(val) => handleUpdateMasterField('country', val)}
                                placeholder="India"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>PIN Code</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.pincode}
                                onChangeText={(val) => handleUpdateMasterField('pincode', val)}
                                placeholder="143422"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 10 }]}>
                          <View style={styles.col}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={[styles.inputLabel, { color: textColor }]}>Primary Mobile Number</Text>
                              <TouchableOpacity onPress={() => handleCopyValue('Helpline Phone', masterData.primaryMobile)}>
                                <Text style={{ fontSize: 11, color: '#10b981', fontFamily: FONT.medium }}>Copy</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.primaryMobile}
                                onChangeText={(val) => handleUpdateMasterField('primaryMobile', val)}
                                placeholder="+91 95776 22000"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Alternate Mobile (optional)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.alternateMobile}
                                onChangeText={(val) => handleUpdateMasterField('alternateMobile', val)}
                                placeholder="+91 98720 66901"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Business Contact Email</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.contactEmail}
                                onChangeText={(val) => handleUpdateMasterField('contactEmail', val)}
                                placeholder="farmskingindia@gmail.com"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Customer Support Email</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.supportEmail}
                                onChangeText={(val) => handleUpdateMasterField('supportEmail', val)}
                                placeholder="support@farmsking.in"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Date / Time / Currency */}
                      <View style={[styles.paneSectionBox, { marginTop: 18 }]}>
                        <Text style={[styles.sectionSubtitle, { color: textColor }]}>Date / Time / Currency</Text>
                        <View style={[styles.twoCol, { marginTop: 10 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Date Format</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.dateFormat}
                                onChangeText={(val) => handleUpdateMasterField('dateFormat', val)}
                                placeholder="DD/MM/YYYY"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Time Format</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.timeFormat}
                                onChangeText={(val) => handleUpdateMasterField('timeFormat', val)}
                                placeholder="12 or 24"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Time Zone</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.timezone}
                                onChangeText={(val) => handleUpdateMasterField('timezone', val)}
                                placeholder="Asia/Kolkata"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Currency & Symbol</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={`${masterData.currency} (${masterData.currencySymbol})`}
                                onChangeText={(val) => {
                                  const parts = val.split(' ');
                                  handleUpdateMasterField('currency', parts[0] || 'INR');
                                  if (parts[1]) handleUpdateMasterField('currencySymbol', parts[1].replace(/[()]/g, ''));
                                }}
                                placeholder="INR (₹)"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Basic Details</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 2: Theme Colors & Presets */}
                  {masterSubTab === 'theme-colors' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Theme & Branding Colors</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Select from verified agritech presets or customize corporate brand accents and button styling.
                        </Text>
                      </View>

                      {/* 1-Click Theme Presets */}
                      <Text style={[styles.inputLabel, { color: textColor, marginBottom: 8 }]}>Curated Agritech Color Presets:</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                        {THEME_PRESETS.map((preset) => (
                          <TouchableOpacity
                            key={preset.name}
                            style={[styles.presetChip, { borderColor: cardBorder, backgroundColor: innerBg }]}
                            onPress={() => handleApplyThemePreset(preset)}
                          >
                            <View style={{ flexDirection: 'row', gap: 4, marginRight: 6 }}>
                              <View style={[styles.colorMiniDot, { backgroundColor: preset.primary }]} />
                              <View style={[styles.colorMiniDot, { backgroundColor: preset.secondary }]} />
                              <View style={[styles.colorMiniDot, { backgroundColor: preset.button }]} />
                            </View>
                            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: textColor }}>{preset.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.twoCol}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Primary Brand Color</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <View style={[styles.colorDot, { backgroundColor: masterData.themeColors?.primaryColor || '#16a34a' }]} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.themeColors?.primaryColor}
                                onChangeText={(val) => handleUpdateMasterNested('themeColors', 'primaryColor', val)}
                                placeholder="#16a34a"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Secondary Color</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <View style={[styles.colorDot, { backgroundColor: masterData.themeColors?.secondaryColor || '#0284c7' }]} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.themeColors?.secondaryColor}
                                onChangeText={(val) => handleUpdateMasterNested('themeColors', 'secondaryColor', val)}
                                placeholder="#0284c7"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Button / Action Color</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <View style={[styles.colorDot, { backgroundColor: masterData.themeColors?.buttonColor || '#10b981' }]} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.themeColors?.buttonColor}
                                onChangeText={(val) => handleUpdateMasterNested('themeColors', 'buttonColor', val)}
                                placeholder="#10b981"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      {/* Live Theme Preview Card */}
                      <View style={[styles.paneSectionBox, { marginTop: 18 }]}>
                        <Text style={[styles.sectionSubtitle, { color: textColor }]}>Live Interactive UI Preview</Text>
                        <View style={[styles.themePreviewCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                          <View style={[styles.themePreviewHeader, { backgroundColor: masterData.themeColors?.primaryColor || '#16a34a' }]}>
                            <Text style={{ color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 }}>FarmsKing™ Header Banner</Text>
                            <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                              <Text style={{ color: '#ffffff', fontSize: 11 }}>Active</Text>
                            </View>
                          </View>
                          <View style={{ padding: 14, gap: 10 }}>
                            <Text style={{ color: textColor, fontSize: 13, fontFamily: FONT.medium }}>
                              Direct farmer agricultural inputs, satellite remote telemetry & AI crop pathology.
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                              <View style={{ backgroundColor: masterData.themeColors?.secondaryColor || '#0284c7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                                <Text style={{ color: '#ffffff', fontSize: 11, fontFamily: FONT.bold }}>Secondary Tag</Text>
                              </View>
                              <TouchableOpacity style={{ backgroundColor: masterData.themeColors?.buttonColor || '#10b981', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}>
                                <Text style={{ color: '#ffffff', fontSize: 12, fontFamily: FONT.bold }}>Action Button</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={[styles.paneFooterBetween, { marginTop: 24 }]}>
                        <TouchableOpacity style={[styles.outlineActionBtn, { borderColor: cardBorder }]} onPress={handleResetThemeColors}>
                          <Text style={[styles.outlineActionText, { color: textColor }]}>Reset to Default</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Colors</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 3: Social Media & Maps */}
                  {masterSubTab === 'social' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Social Media & Maps Integration</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Verified links to YouTube channel, Facebook, Instagram, and Google Maps business listing.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.twoCol}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Facebook Page URL</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <Ionicons name="logo-facebook" size={18} color="#1877f2" style={{ marginRight: 8 }} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.socialMedia?.facebookUrl}
                                onChangeText={(val) => handleUpdateMasterNested('socialMedia', 'facebookUrl', val)}
                                placeholder="https://facebook.com/farmsking.india"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>Example: https://facebook.com/farmsking.india</Text>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Instagram Profile URL</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <Ionicons name="logo-instagram" size={18} color="#e1306c" style={{ marginRight: 8 }} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.socialMedia?.instagramUrl}
                                onChangeText={(val) => handleUpdateMasterNested('socialMedia', 'instagramUrl', val)}
                                placeholder="https://instagram.com/farmsking.india"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>Example: https://instagram.com/farmsking.india</Text>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 14 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>YouTube Channel URL</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <Ionicons name="logo-youtube" size={18} color="#ff0000" style={{ marginRight: 8 }} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.socialMedia?.youtubeUrl}
                                onChangeText={(val) => handleUpdateMasterNested('socialMedia', 'youtubeUrl', val)}
                                placeholder="https://youtube.com/@farmsking"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>Example: https://youtube.com/@farmsking</Text>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Google Business Profile URL</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <Ionicons name="location-outline" size={18} color="#ea4335" style={{ marginRight: 8 }} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.socialMedia?.googleBusinessUrl}
                                onChangeText={(val) => handleUpdateMasterNested('socialMedia', 'googleBusinessUrl', val)}
                                placeholder="https://maps.google.com/?q=FarmsKing+Technologies"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>Example: Link to your Google Business listing on Maps</Text>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 14 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Twitter / X Profile URL</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <Ionicons name="logo-twitter" size={18} color="#1da1f2" style={{ marginRight: 8 }} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.socialMedia?.twitterUrl}
                                onChangeText={(val) => handleUpdateMasterNested('socialMedia', 'twitterUrl', val)}
                                placeholder="https://twitter.com/farmsking"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>LinkedIn Company URL</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <Ionicons name="logo-linkedin" size={18} color="#0a66c2" style={{ marginRight: 8 }} />
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.socialMedia?.linkedinUrl}
                                onChangeText={(val) => handleUpdateMasterNested('socialMedia', 'linkedinUrl', val)}
                                placeholder="https://linkedin.com/company/farmsking"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Social Media</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 4: Email SMTP Settings */}
                  {masterSubTab === 'smtp' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Email SMTP Settings</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Configure outbound email gateway for password resets, order invoices, and AI diagnostic reports.
                        </Text>
                      </View>

                      {/* 1-Click SMTP Presets */}
                      <Text style={[styles.inputLabel, { color: textColor, marginBottom: 8 }]}>Quick-Setup Outbound SMTP Presets:</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
                        {SMTP_PRESETS.map((preset) => (
                          <TouchableOpacity
                            key={preset.name}
                            style={[styles.presetChip, { borderColor: cardBorder, backgroundColor: innerBg }]}
                            onPress={() => handleApplySmtpPreset(preset)}
                          >
                            <Ionicons name="mail-outline" size={14} color="#10b981" style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: textColor }}>{preset.name}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.twoCol}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>SMTP Host</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.smtp?.host}
                                onChangeText={(val) => handleUpdateMasterNested('smtp', 'host', val)}
                                placeholder="smtp.example.com"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>SMTP Port</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.smtp?.port || 465)}
                                onChangeText={(val) => handleUpdateMasterNested('smtp', 'port', parseInt(val, 10) || 465)}
                                placeholder="465"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Encryption</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.smtp?.encryption?.toUpperCase() || 'SSL'}
                                onChangeText={(val) => handleUpdateMasterNested('smtp', 'encryption', val.toLowerCase())}
                                placeholder="SSL / TLS"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>From Email</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.smtp?.fromEmail}
                                onChangeText={(val) => handleUpdateMasterNested('smtp', 'fromEmail', val)}
                                placeholder="noreply@farmsking.in"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 12 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>SMTP Username</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.smtp?.username}
                                onChangeText={(val) => handleUpdateMasterNested('smtp', 'username', val)}
                                placeholder="SMTP username"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>SMTP Password</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.smtp?.password}
                                onChangeText={(val) => handleUpdateMasterNested('smtp', 'password', val)}
                                placeholder="••••••••••••"
                                placeholderTextColor={subTextColor}
                                secureTextEntry={!showSecrets['smtpPass']}
                              />
                              <TouchableOpacity onPress={() => toggleShowSecret('smtpPass')} style={{ padding: 4 }}>
                                <Ionicons
                                  name={showSecrets['smtpPass'] ? 'eye-off-outline' : 'eye-outline'}
                                  size={18}
                                  color={subTextColor}
                                />
                              </TouchableOpacity>
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>From Name</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.smtp?.fromName}
                                onChangeText={(val) => handleUpdateMasterNested('smtp', 'fromName', val)}
                                placeholder="FarmsKing Agritech"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={[styles.paneFooterBetween, { marginTop: 24 }]}>
                        <TouchableOpacity style={[styles.outlineActionBtn, { borderColor: '#10b981' }]} onPress={handleTestEmail}>
                          <Ionicons name="paper-plane-outline" size={16} color="#10b981" />
                          <Text style={[styles.outlineActionText, { color: '#10b981', fontWeight: '700' }]}>Test Email</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save SMTP</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 5: Email Templates */}
                  {masterSubTab === 'email-templates' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={[styles.subPaneTitle, { color: textColor }]}>Automated Email Templates</Text>
                          <TouchableOpacity
                            style={[styles.outlineActionBtn, { borderColor: cardBorder, backgroundColor: innerBg, paddingVertical: 4, paddingHorizontal: 10 }]}
                            onPress={() => setPreviewEmailHtml(!previewEmailHtml)}
                          >
                            <Ionicons name={previewEmailHtml ? 'code-slash' : 'eye-outline'} size={14} color="#10b981" />
                            <Text style={{ fontSize: 12, color: textColor, fontFamily: FONT.medium }}>
                              {previewEmailHtml ? 'Code Editor' : 'Live Preview'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Customize dynamic HTML transactional notifications with variable tags.
                        </Text>
                      </View>

                      {/* Template Pills */}
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          {EMAIL_TEMPLATE_ITEMS.map((item) => {
                            const isCur = activeEmailTmpl === item.key;
                            return (
                              <TouchableOpacity
                                key={item.key}
                                style={[
                                  styles.tmplPill,
                                  isCur && (isLight ? styles.tmplPillActiveLight : styles.tmplPillActiveDark),
                                ]}
                                onPress={() => setActiveEmailTmpl(item.key)}
                              >
                                <Ionicons
                                  name={item.icon}
                                  size={15}
                                  color={isCur ? (isLight ? '#16a34a' : '#00ff87') : subTextColor}
                                />
                                <Text
                                  style={[
                                    styles.tmplPillText,
                                    { color: isCur ? (isLight ? '#16a34a' : '#00ff87') : textColor },
                                    isCur && { fontWeight: '700' },
                                  ]}
                                >
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </ScrollView>

                      {/* Active Template Editor or Preview */}
                      {previewEmailHtml ? (
                        <View style={[styles.paneSectionBox, { padding: 16, backgroundColor: innerBg, borderRadius: 10, borderWidth: 1, borderColor: cardBorder }]}>
                          <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: '#10b981', marginBottom: 10 }}>
                            Subject: {masterData.emailTemplates?.[activeEmailTmpl]?.subject || ''}
                          </Text>
                          <View style={{ padding: 16, backgroundColor: '#ffffff', borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0' }}>
                            <Text style={{ color: '#1e293b', fontSize: 13, lineHeight: 20 }}>
                              {masterData.emailTemplates?.[activeEmailTmpl]?.body
                                ?.replace(/<[^>]*>?/gm, '')
                                .replace(/{{farmer_name}}/g, 'Surinder Singh')
                                .replace(/{{otp_code}}/g, '849201')
                                .replace(/{{amount}}/g, '2,450')
                                .replace(/{{order_id}}/g, 'FK-9842')
                                .replace(/{{crop_name}}/g, 'Wheat PBW-824')
                                .replace(/{{disease_name}}/g, 'Yellow Rust')
                                .replace(/{{severity}}/g, 'Moderate (Tier 2)')
                                .replace(/{{remedy}}/g, 'Apply Propiconazole 25% EC @ 200ml per acre.')
                                .replace(/{{cert_number}}/g, 'FK-CERT-2026-9812')
                                .replace(/{{member_name}}/g, 'Surinder Singh') || 'Template is empty.'}
                            </Text>
                          </View>
                        </View>
                      ) : (
                        <View style={styles.paneSectionBox}>
                          <Text style={[styles.inputLabel, { color: textColor }]}>Subject Line</Text>
                          <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <TextInput
                              style={[styles.input, { color: textColor }]}
                              value={masterData.emailTemplates?.[activeEmailTmpl]?.subject || ''}
                              onChangeText={(val) => handleUpdateEmailTemplate(activeEmailTmpl, 'subject', val)}
                              placeholder="Enter email subject"
                              placeholderTextColor={subTextColor}
                            />
                          </View>

                          <Text style={[styles.inputLabel, { color: textColor, marginTop: 14 }]}>HTML Email Body</Text>
                          <View style={[styles.inputBox, { height: 180, alignItems: 'flex-start', paddingVertical: 10, backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <TextInput
                              style={[styles.input, { color: textColor, height: 160, fontFamily: 'monospace', fontSize: 12.5 }]}
                              value={masterData.emailTemplates?.[activeEmailTmpl]?.body || ''}
                              onChangeText={(val) => handleUpdateEmailTemplate(activeEmailTmpl, 'body', val)}
                              placeholder="Enter HTML email template body..."
                              placeholderTextColor={subTextColor}
                              multiline
                            />
                          </View>

                          <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>1-Click Insert Tag:</Text>
                            {['{{farmer_name}}', '{{otp_code}}', '{{amount}}', '{{order_id}}', '{{crop_name}}', '{{disease_name}}', '{{cert_number}}', '{{expiry_minutes}}'].map((tag) => (
                              <TouchableOpacity
                                key={tag}
                                style={[styles.variableChip, { backgroundColor: innerBg, borderColor: cardBorder }]}
                                onPress={() => {
                                  const curBody = masterData.emailTemplates?.[activeEmailTmpl]?.body || '';
                                  handleUpdateEmailTemplate(activeEmailTmpl, 'body', curBody + ' ' + tag);
                                  showToast(`Inserted ${tag}`);
                                }}
                              >
                                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#10b981' }}>+ {tag}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Template</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 6: Crop Cycles & Sowing Sessions */}
                  {masterSubTab === 'crop-sessions' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Crop Cycles & Agricultural Sowing Sessions</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Configure agricultural seasons (Rabi / Kharif / Zaid), active sowing windows, and mandi price synchronizations.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.twoCol}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Active Season / Cycle Name</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.cropSessions?.activeSessionName}
                                onChangeText={(val) => handleUpdateMasterNested('cropSessions' as any, 'activeSessionName', val)}
                                placeholder="Rabi 2026-27 (Winter Sowing)"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Season Type</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.cropSessions?.activeSeasonType}
                                onChangeText={(val) => handleUpdateMasterNested('cropSessions' as any, 'activeSeasonType', val.toUpperCase())}
                                placeholder="RABI / KHARIF / ZAID"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 12 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Season Start Date</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.cropSessions?.startDate}
                                onChangeText={(val) => handleUpdateMasterNested('cropSessions' as any, 'startDate', val)}
                                placeholder="01/10/2026"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Season Harvest / End Date</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.cropSessions?.endDate}
                                onChangeText={(val) => handleUpdateMasterNested('cropSessions' as any, 'endDate', val)}
                                placeholder="15/04/2027"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={{ marginTop: 12 }}>
                          <Text style={[styles.inputLabel, { color: textColor }]}>Major Sowing Crops in Active Cycle</Text>
                          <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <TextInput
                              style={[styles.input, { color: textColor }]}
                              value={masterData.cropSessions?.majorCrops}
                              onChangeText={(val) => handleUpdateMasterNested('cropSessions' as any, 'majorCrops', val)}
                              placeholder="Wheat, Mustard, Barley, Gram, Potato, Peas"
                              placeholderTextColor={subTextColor}
                            />
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 16 }]}>
                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={[styles.channelLabel, { color: textColor }]}>Session-Wise Data Isolation</Text>
                              <Text style={[styles.fieldHint, { color: subTextColor }]}>Isolate seasonal mandi & crop logs</Text>
                            </View>
                            <Switch
                              value={masterData.cropSessions?.isDataIsolated ?? true}
                              onValueChange={(val) => handleUpdateMasterNested('cropSessions' as any, 'isDataIsolated', val)}
                              trackColor={{ false: '#475569', true: '#10b981' }}
                              thumbColor="#ffffff"
                            />
                          </View>

                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={[styles.channelLabel, { color: textColor }]}>Auto-Switch Mandi Rates</Text>
                              <Text style={[styles.fieldHint, { color: subTextColor }]}>Prioritize in-season crops in price feed</Text>
                            </View>
                            <Switch
                              value={masterData.cropSessions?.autoSwitchMandiRates ?? true}
                              onValueChange={(val) => handleUpdateMasterNested('cropSessions' as any, 'autoSwitchMandiRates', val)}
                              trackColor={{ false: '#475569', true: '#10b981' }}
                              thumbColor="#ffffff"
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Crop Session</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 7: Certificates & QR Verification Portal */}
                  {masterSubTab === 'certificates' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Certificates, Numbering & QR Verification</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Manage soil health certificates, agronomist credentials, and public QR verification portals.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.twoCol}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Certificate Numbering Prefix</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.certificateConfig?.certificatePrefix}
                                onChangeText={(val) => handleUpdateMasterNested('certificateConfig' as any, 'certificatePrefix', val)}
                                placeholder="FK-CERT-"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Public QR Verification Portal URL</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.certificateConfig?.verificationPortalUrl}
                                onChangeText={(val) => handleUpdateMasterNested('certificateConfig' as any, 'verificationPortalUrl', val)}
                                placeholder="https://farmsking.in/verify"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 12 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Issuing Authority Name</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.certificateConfig?.certificateAuthority}
                                onChangeText={(val) => handleUpdateMasterNested('certificateConfig' as any, 'certificateAuthority', val)}
                                placeholder="FARMSKING TECHNOLOGIES PRIVATE LIMITED"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Default Validity Period (Years)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.certificateConfig?.defaultValidityYears || 3)}
                                onChangeText={(val) => handleUpdateMasterNested('certificateConfig' as any, 'defaultValidityYears', parseInt(val, 10) || 3)}
                                placeholder="3"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 16 }]}>
                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={[styles.channelLabel, { color: textColor }]}>Require Admin Approval Before Issue</Text>
                              <Text style={[styles.fieldHint, { color: subTextColor }]}>Two-tier verification for agronomist certificates</Text>
                            </View>
                            <Switch
                              value={masterData.certificateConfig?.requireApproval ?? true}
                              onValueChange={(val) => handleUpdateMasterNested('certificateConfig' as any, 'requireApproval', val)}
                              trackColor={{ false: '#475569', true: '#10b981' }}
                              thumbColor="#ffffff"
                            />
                          </View>

                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <View style={{ flex: 1, paddingRight: 8 }}>
                              <Text style={[styles.channelLabel, { color: textColor }]}>Enable Digital QR Verification Code</Text>
                              <Text style={[styles.fieldHint, { color: subTextColor }]}>Embed scannable QR on generated PDF certificates</Text>
                            </View>
                            <Switch
                              value={masterData.certificateConfig?.digitalQrEnabled ?? true}
                              onValueChange={(val) => handleUpdateMasterNested('certificateConfig' as any, 'digitalQrEnabled', val)}
                              trackColor={{ false: '#475569', true: '#10b981' }}
                              thumbColor="#ffffff"
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Certificate Rules</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 8: Franchise & Mandi Agents */}
                  {masterSubTab === 'franchise' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Franchise, Dealers & Mandi Commission Structure</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Configure rural franchise clusters, commission rules for Mandi Arhtiyas, and centralized approval workflows.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.twoCol}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Mandi Agent Commission Rate (%)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.franchiseRules?.mandiAgentCommissionPercent ?? 1.5)}
                                onChangeText={(val) => handleUpdateMasterNested('franchiseRules' as any, 'mandiAgentCommissionPercent', parseFloat(val) || 0)}
                                placeholder="1.5"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Area Allocation Unit</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.franchiseRules?.dealerAreaAllocationType || 'TEHSIL'}
                                onChangeText={(val) => handleUpdateMasterNested('franchiseRules' as any, 'dealerAreaAllocationType', val.toUpperCase() as any)}
                                placeholder="TEHSIL / DISTRICT / VILLAGE"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 12 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Franchise Security Deposit (INR)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.franchiseRules?.securityDepositInr || 25000)}
                                onChangeText={(val) => handleUpdateMasterNested('franchiseRules' as any, 'securityDepositInr', parseInt(val, 10) || 25000)}
                                placeholder="25000"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Minimum Monthly Procurement Target (INR)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.franchiseRules?.minimumMonthlyTurnoverInr || 100000)}
                                onChangeText={(val) => handleUpdateMasterNested('franchiseRules' as any, 'minimumMonthlyTurnoverInr', parseInt(val, 10) || 100000)}
                                placeholder="100000"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.channelSwitchCard, { marginTop: 16, backgroundColor: innerBg, borderColor: cardBorder }]}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={[styles.channelLabel, { color: textColor }]}>Centralized Franchise Approval System</Text>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>Every franchise and dealer onboarding must be approved by Super Admin</Text>
                          </View>
                          <Switch
                            value={masterData.franchiseRules?.centralizedApprovalRequired ?? true}
                            onValueChange={(val) => handleUpdateMasterNested('franchiseRules' as any, 'centralizedApprovalRequired', val)}
                            trackColor={{ false: '#475569', true: '#10b981' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Franchise Rules</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 9: Backup & Disaster Recovery */}
                  {masterSubTab === 'backup' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Backup & Disaster Recovery</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Automated and manual database snapshots, Cloudflare R2 cloud sync, and point-in-time recovery logs.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={[styles.themePreviewCard, { backgroundColor: innerBg, borderColor: cardBorder, marginBottom: 16 }]}>
                          <View style={{ padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                            <View>
                              <Text style={{ fontSize: 13.5, fontFamily: FONT.bold, color: textColor }}>
                                Last Verified System Backup:
                              </Text>
                              <Text style={{ fontSize: 12, color: '#10b981', fontFamily: FONT.medium, marginTop: 2 }}>
                                {masterData.backupSettings?.lastBackupTimestamp || '24/10/2026 22:30 IST (Cloudflare R2)'}
                              </Text>
                            </View>
                            <TouchableOpacity style={styles.saveActionBtn} onPress={handleTriggerManualBackup}>
                              <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                                <Ionicons name="cloud-upload-outline" size={16} color="#ffffff" />
                                <Text style={styles.saveActionText}>Create Instant Backup</Text>
                              </LinearGradient>
                            </TouchableOpacity>
                          </View>
                        </View>

                        <View style={styles.twoCol}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Backup Schedule Frequency</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.backupSettings?.frequency || 'DAILY'}
                                onChangeText={(val) => handleUpdateMasterNested('backupSettings' as any, 'frequency', val.toUpperCase() as any)}
                                placeholder="DAILY / WEEKLY / MONTHLY"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Retention Window (Days)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.backupSettings?.retentionDays || 30)}
                                onChangeText={(val) => handleUpdateMasterNested('backupSettings' as any, 'retentionDays', parseInt(val, 10) || 30)}
                                placeholder="30"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.twoCol, { marginTop: 12 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Primary Cloud Storage Target</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.backupSettings?.storageTarget || 'R2_AND_LOCAL'}
                                onChangeText={(val) => handleUpdateMasterNested('backupSettings' as any, 'storageTarget', val as any)}
                                placeholder="R2_AND_LOCAL"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Encryption Standard</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.backupSettings?.encryptionStandard || 'AES-256-GCM'}
                                onChangeText={(val) => handleUpdateMasterNested('backupSettings' as any, 'encryptionStandard', val)}
                                placeholder="AES-256-GCM"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>

                        <View style={[styles.channelSwitchCard, { marginTop: 16, backgroundColor: innerBg, borderColor: cardBorder }]}>
                          <View style={{ flex: 1, paddingRight: 8 }}>
                            <Text style={[styles.channelLabel, { color: textColor }]}>Enable Automated Nightly Cloud Backup</Text>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>Scheduled cron job executes daily at 02:00 AM IST</Text>
                          </View>
                          <Switch
                            value={masterData.backupSettings?.autoBackupEnabled ?? true}
                            onValueChange={(val) => handleUpdateMasterNested('backupSettings' as any, 'autoBackupEnabled', val)}
                            trackColor={{ false: '#475569', true: '#10b981' }}
                            thumbColor="#ffffff"
                          />
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Backup Settings</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 10: OTP Login ON/OFF */}
                  {masterSubTab === 'otp-login' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>OTP Authentication & Login Security</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Configure passwordless farmer mobile login, verification codes, and multi-channel OTP delivery.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.toggleRowInline}>
                          <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={[styles.toggleTitle, { color: textColor }]}>Enable OTP Login</Text>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>
                              Allow farmers, agronomists and merchants to log in with 1-click mobile verification codes
                            </Text>
                          </View>
                          <Switch
                            value={masterData.otpLogin?.enabled ?? true}
                            onValueChange={(val) => handleUpdateMasterNested('otpLogin', 'enabled', val)}
                            trackColor={{ false: '#475569', true: '#10b981' }}
                            thumbColor="#ffffff"
                          />
                        </View>

                        <View style={[styles.twoCol, { marginTop: 18 }]}>
                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>OTP Expiry Time (Minutes)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.otpLogin?.expiryMinutes || 5)}
                                onChangeText={(val) => handleUpdateMasterNested('otpLogin', 'expiryMinutes', parseInt(val, 10) || 5)}
                                placeholder="5"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>OTP Attempts Limit</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.otpLogin?.attemptsLimit || 3)}
                                onChangeText={(val) => handleUpdateMasterNested('otpLogin', 'attemptsLimit', parseInt(val, 10) || 3)}
                                placeholder="3"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>
                        </View>

                        <Text style={[styles.inputLabel, { color: textColor, marginTop: 18 }]}>Active OTP Delivery Channels</Text>
                        <View style={[styles.twoCol, { marginTop: 8 }]}>
                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <Text style={[styles.channelLabel, { color: textColor }]}>SMS Gateway</Text>
                            <Switch
                              value={masterData.otpLogin?.channels?.sms ?? true}
                              onValueChange={(val) => handleUpdateMasterNested('otpLogin', 'channels', { ...(masterData.otpLogin?.channels || {}), sms: val })}
                              trackColor={{ false: '#475569', true: '#10b981' }}
                              thumbColor="#ffffff"
                            />
                          </View>

                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <Text style={[styles.channelLabel, { color: textColor }]}>WhatsApp Business Bot</Text>
                            <Switch
                              value={masterData.otpLogin?.channels?.whatsapp ?? true}
                              onValueChange={(val) => handleUpdateMasterNested('otpLogin', 'channels', { ...(masterData.otpLogin?.channels || {}), whatsapp: val })}
                              trackColor={{ false: '#475569', true: '#10b981' }}
                              thumbColor="#ffffff"
                            />
                          </View>

                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <Text style={[styles.channelLabel, { color: textColor }]}>Email Dispatch</Text>
                            <Switch
                              value={masterData.otpLogin?.channels?.email ?? true}
                              onValueChange={(val) => handleUpdateMasterNested('otpLogin', 'channels', { ...(masterData.otpLogin?.channels || {}), email: val })}
                              trackColor={{ false: '#475569', true: '#10b981' }}
                              thumbColor="#ffffff"
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save OTP Settings</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 11: Maintenance Mode */}
                  {masterSubTab === 'maintenance' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Maintenance Mode & Emergency Lockdown</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Temporarily pause platform operations for server upgrades, schema migrations, or scheduled maintenance.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.toggleRowInline}>
                          <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={[styles.toggleTitle, { color: textColor }]}>Maintenance Mode ON/OFF</Text>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>
                              When active, public storefront and client apps will display the maintenance message
                            </Text>
                          </View>
                          <Switch
                            value={masterData.maintenance?.enabled ?? false}
                            onValueChange={(val) => handleUpdateMasterNested('maintenance', 'enabled', val)}
                            trackColor={{ false: '#475569', true: '#ef4444' }}
                            thumbColor="#ffffff"
                          />
                        </View>

                        <View style={{ marginTop: 14 }}>
                          <Text style={[styles.inputLabel, { color: textColor }]}>Maintenance Message</Text>
                          <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <TextInput
                              style={[styles.input, { color: textColor }]}
                              value={masterData.maintenance?.message}
                              onChangeText={(val) => handleUpdateMasterNested('maintenance', 'message', val)}
                              placeholder="We'll be back soon. Performing scheduled maintenance..."
                              placeholderTextColor={subTextColor}
                            />
                          </View>
                        </View>

                        <Text style={[styles.inputLabel, { color: textColor, marginTop: 18 }]}>Granular Sub-System Maintenance</Text>
                        <View style={[styles.twoCol, { marginTop: 8 }]}>
                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <Text style={[styles.channelLabel, { color: textColor }]}>Storefront & Cart</Text>
                            <Switch
                              value={masterData.maintenance?.storefrontMaintenance ?? false}
                              onValueChange={(val) => handleUpdateMasterNested('maintenance', 'storefrontMaintenance', val)}
                              trackColor={{ false: '#475569', true: '#ef4444' }}
                              thumbColor="#ffffff"
                            />
                          </View>
                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <Text style={[styles.channelLabel, { color: textColor }]}>AI Crop Scanner</Text>
                            <Switch
                              value={masterData.maintenance?.scannerMaintenance ?? false}
                              onValueChange={(val) => handleUpdateMasterNested('maintenance', 'scannerMaintenance', val)}
                              trackColor={{ false: '#475569', true: '#ef4444' }}
                              thumbColor="#ffffff"
                            />
                          </View>
                          <View style={[styles.channelSwitchCard, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                            <Text style={[styles.channelLabel, { color: textColor }]}>Treasury & Wallets</Text>
                            <Switch
                              value={masterData.maintenance?.walletMaintenance ?? false}
                              onValueChange={(val) => handleUpdateMasterNested('maintenance', 'walletMaintenance', val)}
                              trackColor={{ false: '#475569', true: '#ef4444' }}
                              thumbColor="#ffffff"
                            />
                          </View>
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Maintenance Mode</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* TAB 12: Tax / GST Settings */}
                  {masterSubTab === 'tax-gst' && (
                    <View style={styles.masterTabPane}>
                      <View style={styles.subPaneHeader}>
                        <Text style={[styles.subPaneTitle, { color: textColor }]}>Tax, GST & Invoicing Settings</Text>
                        <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                          Configure GSTIN, company PAN, HSN/SAC service codes, and commercial invoice numbering prefixes.
                        </Text>
                      </View>

                      <View style={styles.paneSectionBox}>
                        <View style={styles.toggleRowInline}>
                          <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={[styles.toggleTitle, { color: textColor }]}>Enable Tax / GST</Text>
                            <Text style={[styles.fieldHint, { color: subTextColor }]}>
                              Apply statutory GST tax calculations on marketplace orders and service billing
                            </Text>
                          </View>
                          <Switch
                            value={masterData.taxGst?.enabled ?? true}
                            onValueChange={(val) => handleUpdateMasterNested('taxGst', 'enabled', val)}
                            trackColor={{ false: '#475569', true: '#10b981' }}
                            thumbColor="#ffffff"
                          />
                        </View>

                        <View style={[styles.twoCol, { marginTop: 18 }]}>
                          <View style={styles.col}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={[styles.inputLabel, { color: textColor }]}>GST Number (GSTIN)</Text>
                              <TouchableOpacity onPress={() => handleCopyValue('GSTIN', masterData.taxGst?.gstNumber)}>
                                <Text style={{ fontSize: 11, color: '#10b981', fontFamily: FONT.medium }}>Copy</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.taxGst?.gstNumber}
                                onChangeText={(val) => handleUpdateMasterNested('taxGst', 'gstNumber', val)}
                                placeholder="03AAAAF0000A1Z5"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Default Tax Percentage (%)</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={String(masterData.taxGst?.taxPercentage ?? 5.0)}
                                onChangeText={(val) => handleUpdateMasterNested('taxGst', 'taxPercentage', parseFloat(val) || 0)}
                                placeholder="5.0"
                                placeholderTextColor={subTextColor}
                                keyboardType="numeric"
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>Invoice Prefix</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.taxGst?.invoicePrefix}
                                onChangeText={(val) => handleUpdateMasterNested('taxGst', 'invoicePrefix', val)}
                                placeholder="FK-INV-"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Text style={[styles.inputLabel, { color: textColor }]}>Company PAN Number</Text>
                              <TouchableOpacity onPress={() => handleCopyValue('PAN', masterData.taxGst?.panNumber)}>
                                <Text style={{ fontSize: 11, color: '#10b981', fontFamily: FONT.medium }}>Copy</Text>
                              </TouchableOpacity>
                            </View>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.taxGst?.panNumber}
                                onChangeText={(val) => handleUpdateMasterNested('taxGst', 'panNumber', val)}
                                placeholder="AAAAF0000A"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>

                          <View style={styles.col}>
                            <Text style={[styles.inputLabel, { color: textColor }]}>HSN / SAC Code</Text>
                            <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                              <TextInput
                                style={[styles.input, { color: textColor }]}
                                value={masterData.taxGst?.hsnSacCode}
                                onChangeText={(val) => handleUpdateMasterNested('taxGst', 'hsnSacCode', val)}
                                placeholder="998314"
                                placeholderTextColor={subTextColor}
                              />
                            </View>
                          </View>
                        </View>
                      </View>

                      <View style={styles.paneFooterRight}>
                        <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                          <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                            <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                            <Text style={styles.saveActionText}>Save Tax & GST Settings</Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ── TAB 2: Platform Tools & Services ────────────────── */}
          {activeSectionTab === 'TOOLS' && (
            <>
              {/* 1. AI Vision & Crop Doctor */}
              {activeFilter === 'AI' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Ionicons name="sparkles" size={22} color="#10b981" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>AI Crop Doctor & Vision</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.ai?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.ai?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.ai?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Multimodal neural leaf pathology and smart agronomy chat.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.ai?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('ai', 'AI Crop Doctor')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Active AI Engine:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'GEMINI', label: 'Google Gemini' },
                    { key: 'OPENAI', label: 'OpenAI GPT-4' },
                    { key: 'CLAUDE', label: 'Anthropic Claude' },
                  ].map((p) => {
                    const isSelected = localConfig.ai?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelected,
                        ]}
                        onPress={() => handleSetProvider('ai', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#10b981' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Key Inputs */}
              {localConfig.ai?.activeProvider === 'GEMINI' && (
                <View style={styles.fieldsContainer}>
                  <Text style={[styles.inputLabel, { color: subTextColor }]}>Gemini API Key</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder="Enter Google AI Studio API Key..."
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showSecrets['gemini_key']}
                      value={localConfig.ai?.providers?.gemini?.apiKey || ''}
                      onChangeText={(val) => handleUpdateField('ai', 'gemini', 'apiKey', val)}
                    />
                    <TouchableOpacity onPress={() => toggleShowSecret('gemini_key')}>
                      <Ionicons
                        name={showSecrets['gemini_key'] ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={subTextColor}
                      />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.fieldHint, { color: subTextColor }]}>
                    Model: {localConfig.ai?.providers?.gemini?.model || 'gemini-1.5-flash'}
                  </Text>
                </View>
              )}

              {localConfig.ai?.activeProvider === 'OPENAI' && (
                <View style={styles.fieldsContainer}>
                  <Text style={[styles.inputLabel, { color: subTextColor }]}>OpenAI API Secret Key</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder="sk-..."
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showSecrets['openai_key']}
                      value={localConfig.ai?.providers?.openai?.apiKey || ''}
                      onChangeText={(val) => handleUpdateField('ai', 'openai', 'apiKey', val)}
                    />
                    <TouchableOpacity onPress={() => toggleShowSecret('openai_key')}>
                      <Ionicons
                        name={showSecrets['openai_key'] ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={subTextColor}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {localConfig.ai?.activeProvider === 'CLAUDE' && (
                <View style={styles.fieldsContainer}>
                  <Text style={[styles.inputLabel, { color: subTextColor }]}>Anthropic Claude API Key</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      placeholder="sk-ant-..."
                      placeholderTextColor={subTextColor}
                      secureTextEntry={!showSecrets['claude_key']}
                      value={localConfig.ai?.providers?.claude?.apiKey || ''}
                      onChangeText={(val) => handleUpdateField('ai', 'claude', 'apiKey', val)}
                    />
                    <TouchableOpacity onPress={() => toggleShowSecret('claude_key')}>
                      <Ionicons
                        name={showSecrets['claude_key'] ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={subTextColor}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('ai', 'AI Vision & Crop Doctor')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={isLight ? ['#16a34a', '#15803d'] : ['#00ff87', '#00b050']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color={isLight ? '#ffffff' : '#020d06'} />
                    <Text style={[styles.toolSaveBtnText, { color: isLight ? '#ffffff' : '#020d06' }]}>
                      Save AI Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 2. Payment Gateway */}
          {activeFilter === 'PAYMENTS' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(2, 132, 199, 0.12)' }]}>
                    <Ionicons name="card" size={22} color="#0284c7" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Payment Gateway</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.gateway?.isSandbox ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.gateway?.isSandbox ? '#f59e0b' : '#10b981' }]}>
                          {localConfig.gateway?.isSandbox ? 'SANDBOX TEST' : 'LIVE PRODUCTION'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Customer checkout, UPI direct QR, and automated settlements.
                    </Text>
                  </View>
                </View>
                <View style={styles.sandboxToggleRow}>
                  <Text style={[styles.modeLabel, { color: subTextColor }]}>Sandbox</Text>
                  <Switch
                    value={localConfig.gateway?.isSandbox ?? true}
                    onValueChange={handleToggleSandbox}
                    trackColor={{ false: '#10b981', true: '#f59e0b' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>

              {/* Gateway Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Active Gateway:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'RAZORPAY', label: 'Razorpay' },
                    { key: 'CASHFREE', label: 'Cashfree' },
                    { key: 'PHONEPE', label: 'PhonePe' },
                    { key: 'UPI_DIRECT', label: 'Direct UPI (0% Fee)' },
                  ].map((g) => {
                    const isSelected = localConfig.gateway?.activeGateway === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelectedBlue,
                        ]}
                        onPress={() => handleSetGateway(g.key as SupportedPaymentGateway)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#0284c7' : textColor }]}>
                          {g.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Gateway Inputs */}
              {localConfig.gateway?.activeGateway === 'RAZORPAY' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Razorpay Key ID</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="rzp_live_..."
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.razorpay?.keyId || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'razorpay', 'keyId', val)}
                        />
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Razorpay Key Secret</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="Key Secret..."
                          placeholderTextColor={subTextColor}
                          secureTextEntry={!showSecrets['rzp_sec']}
                          value={localConfig.gateway?.providers?.razorpay?.keySecret || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'razorpay', 'keySecret', val)}
                        />
                        <TouchableOpacity onPress={() => toggleShowSecret('rzp_sec')}>
                          <Ionicons
                            name={showSecrets['rzp_sec'] ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={subTextColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {localConfig.gateway?.activeGateway === 'CASHFREE' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Cashfree App ID</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="App ID..."
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.cashfree?.appId || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'cashfree', 'appId', val)}
                        />
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Secret Key</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="Secret Key..."
                          placeholderTextColor={subTextColor}
                          secureTextEntry={!showSecrets['cf_sec']}
                          value={localConfig.gateway?.providers?.cashfree?.secretKey || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'cashfree', 'secretKey', val)}
                        />
                        <TouchableOpacity onPress={() => toggleShowSecret('cf_sec')}>
                          <Ionicons
                            name={showSecrets['cf_sec'] ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={subTextColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {localConfig.gateway?.activeGateway === 'PHONEPE' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Merchant ID</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="M22KMYD10AWD8..."
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.phonepe?.merchantId || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'phonepe', 'merchantId', val)}
                        />
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Salt Key</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="Salt key..."
                          placeholderTextColor={subTextColor}
                          secureTextEntry={!showSecrets['pp_salt']}
                          value={localConfig.gateway?.providers?.phonepe?.saltKey || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'phonepe', 'saltKey', val)}
                        />
                        <TouchableOpacity onPress={() => toggleShowSecret('pp_salt')}>
                          <Ionicons
                            name={showSecrets['pp_salt'] ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={subTextColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {localConfig.gateway?.activeGateway === 'UPI_DIRECT' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>UPI ID (VPA)</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="username@okaxis..."
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.upiDirect?.upiId || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'upiDirect', 'upiId', val)}
                        />
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Payee Business Name</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="FarmsKing Technologies Pvt Ltd"
                          placeholderTextColor={subTextColor}
                          value={localConfig.gateway?.providers?.upiDirect?.payeeName || ''}
                          onChangeText={(val) => handleUpdateField('gateway', 'upiDirect', 'payeeName', val)}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('gateway', 'Payment Gateway')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#0284c7', '#0369a1']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save Payment Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 3. SMS & OTP */}
          {activeFilter === 'SMS' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.12)' }]}>
                    <Ionicons name="chatbox-ellipses" size={22} color="#6366f1" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>SMS & Phone OTP</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.sms?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.sms?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.sms?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Login verification codes and transaction SMS alerts.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.sms?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('sms', 'SMS Gateway')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Active SMS Gateway:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'FIREBASE', label: 'Firebase Phone' },
                    { key: 'FAST2SMS', label: 'Fast2SMS' },
                    { key: 'MSG91', label: 'MSG91' },
                    { key: 'TWILIO', label: 'Twilio' },
                  ].map((p) => {
                    const isSelected = localConfig.sms?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelectedIndigo,
                        ]}
                        onPress={() => handleSetProvider('sms', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#6366f1' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Fields */}
              {localConfig.sms?.activeProvider === 'FAST2SMS' && (
                <View style={styles.fieldsContainer}>
                  <View style={styles.twoCol}>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Fast2SMS API Key</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="Fast2SMS Key..."
                          placeholderTextColor={subTextColor}
                          secureTextEntry={!showSecrets['fast2sms_key']}
                          value={localConfig.sms?.providers?.fast2sms?.apiKey || ''}
                          onChangeText={(val) => handleUpdateField('sms', 'fast2sms', 'apiKey', val)}
                        />
                        <TouchableOpacity onPress={() => toggleShowSecret('fast2sms_key')}>
                          <Ionicons
                            name={showSecrets['fast2sms_key'] ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color={subTextColor}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.col}>
                      <Text style={[styles.inputLabel, { color: subTextColor }]}>Sender ID</Text>
                      <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <TextInput
                          style={[styles.input, { color: textColor }]}
                          placeholder="FRMKNG"
                          placeholderTextColor={subTextColor}
                          value={localConfig.sms?.providers?.fast2sms?.senderId || 'FRMKNG'}
                          onChangeText={(val) => handleUpdateField('sms', 'fast2sms', 'senderId', val)}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {localConfig.sms?.activeProvider === 'FIREBASE' && (
                <View style={styles.fieldsContainer}>
                  <Text style={[styles.fieldHint, { color: subTextColor }]}>
                    Firebase Phone Auth is active and integrated with Google Play Services.
                  </Text>
                </View>
              )}

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('sms', 'SMS & OTP Service')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save SMS Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 4. WhatsApp Business */}
          {activeFilter === 'WHATSAPP' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(37, 211, 102, 0.12)' }]}>
                    <Ionicons name="logo-whatsapp" size={22} color="#25D366" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>WhatsApp Business Bot</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.whatsapp?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.whatsapp?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.whatsapp?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Automated order receipts, PDF reports, and village broadcasts.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.whatsapp?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('whatsapp', 'WhatsApp Bot')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Provider:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'META_CLOUD', label: 'Meta Cloud API' },
                    { key: 'GUPSHUP', label: 'Gupshup' },
                    { key: 'WATI', label: 'WATI' },
                  ].map((p) => {
                    const isSelected = localConfig.whatsapp?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelectedGreen,
                        ]}
                        onPress={() => handleSetProvider('whatsapp', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#25D366' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Fields */}
              <View style={styles.fieldsContainer}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: subTextColor }]}>Phone Number ID</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="109823471..."
                        placeholderTextColor={subTextColor}
                        value={localConfig.whatsapp?.providers?.metaCloud?.phoneNumberId || ''}
                        onChangeText={(val) => handleUpdateField('whatsapp', 'metaCloud', 'phoneNumberId', val)}
                      />
                    </View>
                  </View>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: subTextColor }]}>Access Token</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="EAAB..."
                        placeholderTextColor={subTextColor}
                        secureTextEntry={!showSecrets['wa_token']}
                        value={localConfig.whatsapp?.providers?.metaCloud?.accessToken || ''}
                        onChangeText={(val) => handleUpdateField('whatsapp', 'metaCloud', 'accessToken', val)}
                      />
                      <TouchableOpacity onPress={() => toggleShowSecret('wa_token')}>
                        <Ionicons
                          name={showSecrets['wa_token'] ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={subTextColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('whatsapp', 'WhatsApp Business Bot')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#16a34a', '#15803d']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save WhatsApp Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 5. Satellite & Farm Radar */}
          {activeFilter === 'SATELLITE' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}>
                    <Ionicons name="planet" size={22} color="#10b981" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Satellite Farm Radar</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.satellite?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.satellite?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.satellite?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Sentinel-2 & ISRO NDVI crop vigor, moisture, and soil health maps.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.satellite?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('satellite', 'Satellite Radar')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Satellite Provider:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'AGROMONITORING', label: 'Agromonitoring' },
                    { key: 'SENTINEL_HUB', label: 'Sentinel Hub' },
                    { key: 'ISRO_BHUVAN', label: 'ISRO Bhuvan' },
                  ].map((p) => {
                    const isSelected = localConfig.satellite?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelected,
                        ]}
                        onPress={() => handleSetProvider('satellite', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#10b981' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldsContainer}>
                <Text style={[styles.inputLabel, { color: subTextColor }]}>Agromonitoring / Satellite API Key</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="API Key..."
                    placeholderTextColor={subTextColor}
                    secureTextEntry={!showSecrets['sat_key']}
                    value={localConfig.satellite?.providers?.agromonitoring?.apiKey || ''}
                    onChangeText={(val) => handleUpdateField('satellite', 'agromonitoring', 'apiKey', val)}
                  />
                  <TouchableOpacity onPress={() => toggleShowSecret('sat_key')}>
                    <Ionicons
                      name={showSecrets['sat_key'] ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={subTextColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('satellite', 'Satellite Farm Radar')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={isLight ? ['#16a34a', '#15803d'] : ['#00ff87', '#00b050']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color={isLight ? '#ffffff' : '#020d06'} />
                    <Text style={[styles.toolSaveBtnText, { color: isLight ? '#ffffff' : '#020d06' }]}>
                      Save Satellite Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 6. Weather Telemetry */}
          {activeFilter === 'WEATHER' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(5, 150, 105, 0.12)' }]}>
                    <Ionicons name="partly-sunny" size={22} color="#059669" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Weather & Spray Forecast</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.weather?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.weather?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.weather?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Hyperlocal rainfall, wind speed spray advisories, and weather warnings.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.weather?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('weather', 'Weather Telemetry')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Weather Source:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'OPEN_METEO', label: 'Open-Meteo (Free No-Key)' },
                    { key: 'OPEN_WEATHER_MAP', label: 'OpenWeather' },
                    { key: 'IMD', label: 'IMD Agromet' },
                  ].map((p) => {
                    const isSelected = localConfig.weather?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelected,
                        ]}
                        onPress={() => handleSetProvider('weather', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#059669' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldsContainer}>
                {localConfig.weather?.activeProvider === 'OPEN_METEO' ? (
                  <Text style={[styles.fieldHint, { color: subTextColor }]}>
                    ✅ Open-Meteo is active with zero cost and no API key required (10,000 daily free calls).
                  </Text>
                ) : (
                  <>
                    <Text style={[styles.inputLabel, { color: subTextColor }]}>Weather API Key</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        placeholder="API Key..."
                        placeholderTextColor={subTextColor}
                        value={localConfig.weather?.providers?.openWeatherMap?.apiKey || ''}
                        onChangeText={(val) => handleUpdateField('weather', 'openWeatherMap', 'apiKey', val)}
                      />
                    </View>
                  </>
                )}
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('weather', 'Weather Telemetry')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#059669', '#047857']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save Weather Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 7. Logistics & Couriers */}
          {activeFilter === 'LOGISTICS' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(217, 119, 6, 0.12)' }]}>
                    <Ionicons name="cube" size={22} color="#d97706" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Courier & Logistics</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.logistics?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.logistics?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.logistics?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Automated courier dispatch, AWB label generation, and live tracking.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.logistics?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('logistics', 'Logistics Courier')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              {/* Provider Selection */}
              <View style={styles.sectionRow}>
                <Text style={[styles.fieldLabel, { color: subTextColor }]}>Courier Engine:</Text>
                <View style={styles.optionsGroup}>
                  {[
                    { key: 'SHIPROCKET', label: 'Shiprocket (Recommended)' },
                    { key: 'DELHIVERY', label: 'Delhivery' },
                    { key: 'BORZO', label: 'Borzo Hyperlocal' },
                  ].map((p) => {
                    const isSelected = localConfig.logistics?.activeProvider === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.optionPill,
                          { backgroundColor: innerBg, borderColor: cardBorder },
                          isSelected && styles.optionPillSelectedAmber,
                        ]}
                        onPress={() => handleSetProvider('logistics', p.key)}
                      >
                        <Text style={[styles.optionPillText, { color: isSelected ? '#d97706' : textColor }]}>
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={styles.fieldsContainer}>
                <Text style={[styles.inputLabel, { color: subTextColor }]}>Shiprocket / Courier Auth Token</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Courier API Token..."
                    placeholderTextColor={subTextColor}
                    secureTextEntry={!showSecrets['ship_token']}
                    value={localConfig.logistics?.providers?.shiprocket?.token || ''}
                    onChangeText={(val) => handleUpdateField('logistics', 'shiprocket', 'token', val)}
                  />
                  <TouchableOpacity onPress={() => toggleShowSecret('ship_token')}>
                    <Ionicons
                      name={showSecrets['ship_token'] ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={subTextColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('logistics', 'Logistics & Couriers')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#d97706', '#b45309']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save Logistics Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* 8. Push Notifications */}
          {activeFilter === 'PUSH' && (
            <View style={[styles.toolCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
                    <Ionicons name="notifications" size={22} color="#ef4444" />
                  </View>
                  <View>
                    <View style={styles.titleRow}>
                      <Text style={[styles.toolTitle, { color: textColor }]}>Push Notifications</Text>
                      <View style={[styles.statusBadge, { backgroundColor: localConfig.push?.isEnabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(148, 163, 184, 0.15)' }]}>
                        <Text style={[styles.statusText, { color: localConfig.push?.isEnabled ? '#10b981' : subTextColor }]}>
                          {localConfig.push?.isEnabled ? 'ACTIVE' : 'INACTIVE'}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.toolDesc, { color: subTextColor }]}>
                      Firebase Cloud Messaging for order alerts, mandi rates, and rain sirens.
                    </Text>
                  </View>
                </View>
                <Switch
                  value={localConfig.push?.isEnabled ?? true}
                  onValueChange={() => handleToggleTool('push', 'Push Notifications')}
                  trackColor={{ false: '#475569', true: '#10b981' }}
                  thumbColor="#ffffff"
                />
              </View>

              <View style={styles.fieldsContainer}>
                <Text style={[styles.inputLabel, { color: subTextColor }]}>FCM Server Key / Web Push VAPID Key</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    placeholder="Firebase Cloud Messaging Server Key..."
                    placeholderTextColor={subTextColor}
                    secureTextEntry={!showSecrets['push_key']}
                    value={localConfig.push?.providers?.firebaseFcm?.serverKey || ''}
                    onChangeText={(val) => handleUpdateField('push', 'firebaseFcm', 'serverKey', val)}
                  />
                  <TouchableOpacity onPress={() => toggleShowSecret('push_key')}>
                    <Ionicons
                      name={showSecrets['push_key'] ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color={subTextColor}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dedicated Save Button */}
              <View style={styles.cardFooter}>
                <TouchableOpacity
                  style={[styles.toolSaveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
                  onPress={() => handleSaveTool('push', 'Push Notifications')}
                  disabled={updateMutation.isPending}
                >
                  <LinearGradient
                    colors={['#ef4444', '#dc2626']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.toolSaveGradient}
                  >
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={[styles.toolSaveBtnText, { color: '#ffffff' }]}>
                      Save Push Settings
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  header: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  headerInfo: {
    flex: 1,
    minWidth: 260,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: FONT.bold,
    marginBottom: 2,
  },
  sectionTabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  sectionTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
  },
  sectionTabBtnActiveLight: {
    backgroundColor: '#16a34a',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTabBtnActiveDark: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
  },
  sectionTabText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  headerSubtitle: {
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  filterBar: {
    borderBottomWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    flex: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  dropdownRelativeBox: {
    position: 'relative',
    minWidth: 260,
    flex: 1,
    maxWidth: 380,
    zIndex: 110,
  },
  dropdownTrigger: {
    height: 42,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownSelectedText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 46,
    left: 0,
    right: 0,
    minWidth: 260,
    borderRadius: 10,
    borderWidth: 1,
    paddingVertical: 5,
    zIndex: 999,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
    gap: 10,
  },
  dropdownItemActiveLight: {
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  dropdownItemActiveDark: {
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
  },
  dropdownItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dropdownItemText: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  cardsGrid: {
    gap: 16,
  },
  cardsGridDesktop: {
    display: 'flex',
  },
  toolCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  toolTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  toolDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  sandboxToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modeLabel: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  sectionRow: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  optionsGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionPillSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  optionPillSelectedBlue: {
    borderColor: '#0284c7',
    backgroundColor: 'rgba(2, 132, 199, 0.1)',
  },
  optionPillSelectedIndigo: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionPillSelectedGreen: {
    borderColor: '#25D366',
    backgroundColor: 'rgba(37, 211, 102, 0.1)',
  },
  optionPillSelectedAmber: {
    borderColor: '#d97706',
    backgroundColor: 'rgba(217, 119, 6, 0.1)',
  },
  optionPillText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  fieldsContainer: {
    gap: 8,
    marginTop: 4,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  col: {
    flex: 1,
    minWidth: 200,
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
  },
  input: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.regular,
    paddingVertical: 0,
  },
  fieldHint: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  cardFooter: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  toolSaveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveBtnDisabled: {
    opacity: 0.6,
  },
  toolSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toolSaveBtnText: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  masterContainer: {
    width: '100%',
    marginBottom: 20,
  },
  masterContainerDesktop: {
    width: '100%',
  },
  masterHeaderBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 12,
  },
  masterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  globalSaveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  globalSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  globalSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  masterSubNavWrapper: {
    flexDirection: 'column',
    gap: 16,
  },
  masterSubNavDesktopWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
  },
  masterPillsNav: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
  },
  masterPillsNavDesktop: {
    width: 250,
  },
  masterPillsScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  masterPillsScrollDesktop: {
    flexDirection: 'column',
    gap: 6,
  },
  masterPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  masterPillItemDesktop: {
    width: '100%',
  },
  masterPillActiveLight: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
  },
  masterPillActiveDark: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
  },
  masterPillText: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  masterContentPane: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 20,
    minWidth: 320,
  },
  masterTabPane: {
    width: '100%',
  },
  subPaneHeader: {
    marginBottom: 16,
  },
  subPaneTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
  },
  subPaneSubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    marginTop: 3,
  },
  paneSectionBox: {
    borderRadius: 10,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    marginBottom: 6,
  },
  previewFrame: {
    borderRadius: 10,
    borderWidth: 1,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    overflow: 'hidden',
  },
  logoPreviewImg: {
    width: '80%',
    height: 70,
  },
  previewHint: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  colorDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginRight: 8,
  },
  tmplPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
  },
  tmplPillActiveLight: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    borderColor: '#16a34a',
  },
  tmplPillActiveDark: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderColor: '#00ff87',
  },
  tmplPillText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  variableChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleRowInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  channelSwitchCard: {
    flex: 1,
    minWidth: 180,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  channelLabel: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
  },
  paneFooterRight: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  paneFooterBetween: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveActionBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  saveActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  saveActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  outlineActionText: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  masterSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    height: 42,
    gap: 8,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  colorMiniDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  themePreviewCard: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  themePreviewHeader: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
