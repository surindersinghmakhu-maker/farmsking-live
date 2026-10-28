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
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  | 'tools'
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
  { key: 'MASTER_DATA', label: 'Setting & Entity Setup', icon: 'settings-outline' },
  ...TOOL_SERVICES_FILTERS,
];

const MASTER_DATA_TABS: MasterDataTabItem[] = [
  { key: 'basic-details', label: 'Basic Details & Identity', icon: 'business-outline' },
  { key: 'tools', label: 'Platform Tools & Services', icon: 'hardware-chip-outline' },
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
  const router = useRouter();
  const params = useLocalSearchParams<{ section?: string }>();
  const { data: remoteConfig, isLoading, refetch } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const [localConfig, setLocalConfig] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(remoteConfig)
  );
  const [activeFilter, setActiveFilter] = useState<ToolCategory>(() => {
    return 'AI';
  });

  const [masterSubTab, setMasterSubTab] = useState<MasterDataSubTab>(() => {
    if (params?.section === 'TOOLS' || params?.section === 'API' || (params as any)?.tab === 'tools') {
      return 'tools';
    }
    return 'basic-details';
  });

  useEffect(() => {
    if (params?.section === 'TOOLS' || params?.section === 'API' || (params as any)?.tab === 'tools') {
      setMasterSubTab('tools');
    }
  }, [params?.section, (params as any)?.tab]);
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
      showToast('✅ Setting saved and synchronized successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save Setting');
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
      showToast('💾 Setting JSON copied to clipboard for export!');
    } else {
      showToast('💾 Setting export generated successfully!');
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
              name="hardware-chip-outline"
              size={15}
              color={isLight ? '#16a34a' : '#00ff87'}
            />
            <Text style={[styles.badgeText, { color: isLight ? '#16a34a' : '#00ff87' }]}>
              PLATFORM TOOLS & SERVICES
            </Text>
          </View>
          <Text style={[styles.headerTitle, { color: textColor }]}>
            Platform Tools & Services
          </Text>
          <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
            Third-party API providers, credentials, and live telemetry toggles for AI, Payments, SMS, WhatsApp, Satellite, Weather, Logistics, and Push Notifications.
          </Text>
        </View>
      </View>

      {/* ── Toast Alert ─────────────────────────────────────────── */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: isLight ? '#f0fdf4' : '#062814', borderColor: isLight ? '#bbf7d0' : '#00ff87' }]}>
          <Ionicons name="sparkles" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
          <Text style={[styles.toastText, { color: textColor }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Settings & Tools Workspace ──────────────────── */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        <View style={[styles.cardsGrid, isDesktop && styles.cardsGridDesktop]}>
          {/* Banner linking to New Settings */}
          <TouchableOpacity
            style={[styles.movedBanner, { backgroundColor: isLight ? '#f5f3ff' : 'rgba(99, 102, 241, 0.1)', borderColor: isLight ? '#ddd6fe' : '#4f46e5' }]}
            onPress={() => router.push('/admin/(tabs)/new-settings?tab=ENTITY_SETUP')}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <Ionicons name="business" size={20} color="#6366f1" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.movedBannerTitle, { color: textColor }]}>Setting & Entity Setup moved to New Settings</Text>
                <Text style={[styles.movedBannerSubtitle, { color: subTextColor }]}>
                  Company identity, MCA SRN, CIN, PAN/TAN, registered address, tax/GST and branding are now managed in New Settings.
                </Text>
              </View>
            </View>
            <View style={styles.movedBannerAction}>
              <Text style={styles.movedBannerActionText}>Open New Settings →</Text>
            </View>
          </TouchableOpacity>

          {/* Tool Category Switcher Pills */}
                      <View style={[styles.toolsSelectorRow, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.toolsSelectorScroll}>
                          {TOOL_SERVICES_FILTERS.map((cat) => {
                            const isSelected = activeFilter === cat.key;
                            return (
                              <TouchableOpacity
                                key={cat.key}
                                style={[
                                  styles.toolPillItem,
                                  {
                                    borderColor: isSelected ? (isLight ? '#16a34a' : '#00ff87') : cardBorder,
                                    backgroundColor: isSelected ? (isLight ? '#16a34a' : '#00ff87') : cardBg,
                                  },
                                ]}
                                onPress={() => setActiveFilter(cat.key)}
                                activeOpacity={0.7}
                              >
                                <Ionicons
                                  name={cat.icon}
                                  size={15}
                                  color={isSelected ? (isLight ? '#ffffff' : '#020d06') : (isLight ? '#64748b' : '#94a3b8')}
                                />
                                <Text
                                  style={[
                                    styles.toolPillText,
                                    { color: isSelected ? (isLight ? '#ffffff' : '#020d06') : textColor },
                                    isSelected && { fontWeight: '700' },
                                  ]}
                                >
                                  {cat.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>

                      {/* Active Tool Configuration Cards */}
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
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  movedBanner: {
    width: '100%',
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
  movedBannerTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  movedBannerSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  movedBannerAction: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  movedBannerActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
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
  toolsSelectorRow: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 6,
    marginBottom: 16,
  },
  toolsSelectorScroll: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  toolPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  toolPillText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
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
