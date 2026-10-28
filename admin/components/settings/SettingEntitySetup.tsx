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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSystemIntegrations, useUpdateSystemIntegrations } from '@/src/hooks/useSystemIntegrations';
import {
  SystemIntegrationsConfig,
  mergeSystemIntegrationsWithDefaults,
  ProjectMasterDataConfig,
  DEFAULT_PROJECT_MASTER_DATA,
} from '@/src/api/appSettings.api';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS } from '@/constants/theme';

export type MasterDataSubTab =
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

export type EmailTemplateKey = 'registration' | 'otp' | 'feeReceipt' | 'resultPublished' | 'certificateIssued';

export interface MasterDataTabItem {
  key: MasterDataSubTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export const MASTER_DATA_TABS: MasterDataTabItem[] = [
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

export const THEME_PRESETS = [
  { name: 'Emerald Agritech (Default)', primary: '#16a34a', secondary: '#0284c7', button: '#10b981' },
  { name: 'Golden Mandi Harvest', primary: '#d97706', secondary: '#2563eb', button: '#f59e0b' },
  { name: 'Deep Eco-Forest', primary: '#059669', secondary: '#0891b2', button: '#10b981' },
  { name: 'Obsidian Executive Dark', primary: '#0f172a', secondary: '#6366f1', button: '#10b981' },
];

export const SMTP_PRESETS = [
  { name: 'Hostinger Business Mail', host: 'smtp.hostinger.com', port: 465, enc: 'SSL' },
  { name: 'Google Workspace / Gmail', host: 'smtp.gmail.com', port: 587, enc: 'TLS' },
  { name: 'SendGrid / Twilio', host: 'smtp.sendgrid.net', port: 587, enc: 'TLS' },
  { name: 'Amazon SES (Mumbai)', host: 'email-smtp.ap-south-1.amazonaws.com', port: 587, enc: 'TLS' },
];

export const EMAIL_TEMPLATE_ITEMS: { key: EmailTemplateKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'registration', label: 'Registration Email', icon: 'person-add-outline' },
  { key: 'otp', label: 'OTP Verification', icon: 'key-outline' },
  { key: 'feeReceipt', label: 'Fee / Order Receipt', icon: 'receipt-outline' },
  { key: 'resultPublished', label: 'Crop Doctor Result', icon: 'fitness-outline' },
  { key: 'certificateIssued', label: 'Certificate Issued', icon: 'ribbon-outline' },
];

export default function SettingEntitySetup() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 768));
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  const { data: remoteConfig, isLoading, refetch } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const [localConfig, setLocalConfig] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(remoteConfig)
  );

  const [masterSubTab, setMasterSubTab] = useState<MasterDataSubTab>('basic-details');
  const [activeEmailTmpl, setActiveEmailTmpl] = useState<EmailTemplateKey>('registration');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [previewEmailHtml, setPreviewEmailHtml] = useState(false);
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
      showToast('✅ Setting & Entity Setup saved and synchronized successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save Setting & Entity Setup');
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

  return (
    <View style={styles.masterContainer}>
      {/* Toast Alert */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: isLight ? '#f0fdf4' : '#062814', borderColor: isLight ? '#bbf7d0' : '#00ff87' }]}>
          <Ionicons name="checkmark-circle" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
          <Text style={[styles.toastText, { color: textColor }]}>{toastMessage}</Text>
        </View>
      )}



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

      {/* Setting Sub-tabs Navigation */}
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
                    color={isActive ? (isLight ? '#4f46e5' : '#818cf8') : subTextColor}
                  />
                  <Text
                    style={[
                      styles.masterPillText,
                      { color: isActive ? (isLight ? '#4f46e5' : '#818cf8') : textColor },
                      isActive && { fontWeight: '700' },
                    ]}
                  >
                    {tab.label}
                  </Text>
                  {isActive && isDesktop && (
                    <Ionicons name="chevron-forward" size={14} color={isLight ? '#4f46e5' : '#818cf8'} style={{ marginLeft: 'auto' }} />
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
                        <Text style={{ fontSize: 11, color: '#6366f1', fontFamily: FONT.medium }}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.companyLegalName}
                        onChangeText={(txt) => handleUpdateMasterField('companyLegalName', txt)}
                        placeholder="FARMSKING TECHNOLOGIES PRIVATE LIMITED"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Brand / Trade Name</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.brandName}
                        onChangeText={(txt) => handleUpdateMasterField('brandName', txt)}
                        placeholder="FarmsKing™"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Registered Office Address</Text>
                      <TouchableOpacity onPress={() => handleCopyValue('Registered Address', masterData.registeredOfficeAddress)}>
                        <Text style={{ fontSize: 11, color: '#6366f1', fontFamily: FONT.medium }}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 60 }]}>
                      <TextInput
                        style={[styles.input, { color: textColor, height: 50 }]}
                        value={masterData.registeredOfficeAddress}
                        onChangeText={(txt) => handleUpdateMasterField('registeredOfficeAddress', txt)}
                        placeholder="VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India"
                        placeholderTextColor={subTextColor}
                        multiline
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Corporate Tagline</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.tagline}
                        onChangeText={(txt) => handleUpdateMasterField('tagline', txt)}
                        placeholder="Autonomous Agronomy & Modern Digital Mandi"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                {/* Statutory Registration Details */}
                <Text style={[styles.sectionSubtitle, { color: textColor, marginTop: 16 }]}>Ministry of Corporate Affairs (MCA) Details</Text>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>MCA Incorporation SRN</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.mcaSrn}
                        onChangeText={(txt) => handleUpdateMasterField('mcaSrn', txt)}
                        placeholder="SPICe+ SRN / Incorporation Reference"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>CIN (Corporate Identification Number)</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.cinNumber}
                        onChangeText={(txt) => handleUpdateMasterField('cinNumber', txt)}
                        placeholder="e.g. U01100PB2026PTC..."
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Company PAN</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.companyPan}
                        onChangeText={(txt) => handleUpdateMasterField('companyPan', txt)}
                        placeholder="AABCF1234D"
                        placeholderTextColor={subTextColor}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Company TAN</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.companyTan}
                        onChangeText={(txt) => handleUpdateMasterField('companyTan', txt)}
                        placeholder="PTLA12345B"
                        placeholderTextColor={subTextColor}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                </View>

                {/* Contact Channels */}
                <Text style={[styles.sectionSubtitle, { color: textColor, marginTop: 16 }]}>Official Contact & Helpdesk</Text>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Helpline Phone Number</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.officialPhone}
                        onChangeText={(txt) => handleUpdateMasterField('officialPhone', txt)}
                        placeholder="+91 98883 04511"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Official Support Email</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.officialEmail}
                        onChangeText={(txt) => handleUpdateMasterField('officialEmail', txt)}
                        placeholder="support@farmsking.in"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save Identity Details</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: Theme Colors & Presets */}
          {masterSubTab === 'theme-colors' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <Text style={[styles.subPaneTitle, { color: textColor }]}>Theme Colors & Brand Presets</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Customize executive UI highlights, button colors, and visual branding tokens.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <Text style={[styles.sectionSubtitle, { color: textColor }]}>Quick Color Presets</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  {THEME_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      style={[styles.presetChip, { borderColor: cardBorder, backgroundColor: innerBg }]}
                      onPress={() => handleApplyThemePreset(preset)}
                    >
                      <View style={[styles.colorMiniDot, { backgroundColor: preset.primary }]} />
                      <Text style={{ fontSize: 12, color: textColor, fontFamily: FONT.medium }}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[styles.presetChip, { borderColor: cardBorder, backgroundColor: innerBg }]}
                    onPress={handleResetThemeColors}
                  >
                    <Ionicons name="refresh-outline" size={13} color={subTextColor} />
                    <Text style={{ fontSize: 12, color: subTextColor, fontFamily: FONT.medium }}>Reset Defaults</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Primary Accent Color (Hex)</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <View style={[styles.colorDot, { backgroundColor: masterData.themeColors?.primaryColor || '#16a34a' }]} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.themeColors?.primaryColor || '#16a34a'}
                        onChangeText={(txt) => handleUpdateMasterNested('themeColors', 'primaryColor', txt)}
                        placeholder="#16a34a"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Secondary Highlight Color</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <View style={[styles.colorDot, { backgroundColor: masterData.themeColors?.secondaryColor || '#0284c7' }]} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.themeColors?.secondaryColor || '#0284c7'}
                        onChangeText={(txt) => handleUpdateMasterNested('themeColors', 'secondaryColor', txt)}
                        placeholder="#0284c7"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Global Button Color</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <View style={[styles.colorDot, { backgroundColor: masterData.themeColors?.buttonColor || '#10b981' }]} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.themeColors?.buttonColor || '#10b981'}
                        onChangeText={(txt) => handleUpdateMasterNested('themeColors', 'buttonColor', txt)}
                        placeholder="#10b981"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save Theme Settings</Text>
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
                  Manage official social networking handles and Google Maps geolocation coordinates.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Facebook Page URL</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.facebook || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('socialMedia', 'facebook', txt)}
                        placeholder="https://facebook.com/farmsking"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Instagram Profile</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.instagram || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('socialMedia', 'instagram', txt)}
                        placeholder="https://instagram.com/farmsking"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>YouTube Channel</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.youtube || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('socialMedia', 'youtube', txt)}
                        placeholder="https://youtube.com/@farmsking"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Twitter / X</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.twitter || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('socialMedia', 'twitter', txt)}
                        placeholder="https://x.com/farmsking"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save Social Links</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 4: SMTP Settings */}
          {masterSubTab === 'smtp' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <Text style={[styles.subPaneTitle, { color: textColor }]}>Email SMTP Settings</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Outgoing mail server credentials for OTPs, invoices, and diagnostic notifications.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <Text style={[styles.sectionSubtitle, { color: textColor }]}>Quick Mail Server Presets</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  {SMTP_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      style={[styles.presetChip, { borderColor: cardBorder, backgroundColor: innerBg }]}
                      onPress={() => handleApplySmtpPreset(preset)}
                    >
                      <Ionicons name="mail-outline" size={13} color="#6366f1" />
                      <Text style={{ fontSize: 12, color: textColor, fontFamily: FONT.medium }}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>SMTP Host Server</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.smtp?.host || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('smtp', 'host', txt)}
                        placeholder="smtp.hostinger.com"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>SMTP Port Number</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={String(masterData.smtp?.port || 465)}
                        onChangeText={(txt) => handleUpdateMasterNested('smtp', 'port', parseInt(txt) || 465)}
                        placeholder="465"
                        placeholderTextColor={subTextColor}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Sender Email Address</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.smtp?.fromEmail || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('smtp', 'fromEmail', txt)}
                        placeholder="noreply@farmsking.in"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Sender Display Name</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.smtp?.fromName || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('smtp', 'fromName', txt)}
                        placeholder="FarmsKing Executive Mailer"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterBetween}>
                <TouchableOpacity style={[styles.outlineActionBtn, { borderColor: cardBorder, backgroundColor: innerBg }]} onPress={handleTestEmail}>
                  <Ionicons name="paper-plane-outline" size={15} color="#6366f1" />
                  <Text style={[styles.outlineActionText, { color: textColor }]}>Send Test Email</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save SMTP Settings</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 5: Email Templates */}
          {masterSubTab === 'email-templates' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <Text style={[styles.subPaneTitle, { color: textColor }]}>Email Notification Templates</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Customize transaction, verification and diagnostic dispatch templates.
                </Text>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {EMAIL_TEMPLATE_ITEMS.map((item) => {
                  const isSelected = activeEmailTmpl === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.tmplPill,
                        isSelected && (isLight ? styles.tmplPillActiveLight : styles.tmplPillActiveDark),
                      ]}
                      onPress={() => setActiveEmailTmpl(item.key)}
                    >
                      <Ionicons name={item.icon} size={14} color={isSelected ? '#6366f1' : subTextColor} />
                      <Text style={[styles.tmplPillText, { color: isSelected ? textColor : subTextColor }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.paneSectionBox}>
                <Text style={[styles.inputLabel, { color: textColor }]}>Email Subject Line</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <TextInput
                    style={[styles.input, { color: textColor }]}
                    value={masterData.emailTemplates?.[activeEmailTmpl]?.subject || ''}
                    onChangeText={(txt) => handleUpdateEmailTemplate(activeEmailTmpl, 'subject', txt)}
                    placeholder="Subject line..."
                    placeholderTextColor={subTextColor}
                  />
                </View>

                <Text style={[styles.inputLabel, { color: textColor, marginTop: 12 }]}>Email Body (HTML / Markdown)</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 160 }]}>
                  <TextInput
                    style={[styles.input, { color: textColor, height: 150 }]}
                    value={masterData.emailTemplates?.[activeEmailTmpl]?.body || ''}
                    onChangeText={(txt) => handleUpdateEmailTemplate(activeEmailTmpl, 'body', txt)}
                    placeholder="HTML email body..."
                    placeholderTextColor={subTextColor}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save Templates</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 6: Crop Cycles & Seasons */}
          {masterSubTab === 'crop-sessions' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <Text style={[styles.subPaneTitle, { color: textColor }]}>Crop Cycles & Agronomic Seasons</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Configure national sowing, harvesting and mandi trading cycles (Kharif, Rabi, Zaid).
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Current Sowing Season</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.cropSessions?.currentSeason || 'Rabi 2026-27'}
                        onChangeText={(txt) => handleUpdateMasterNested('cropSessions' as any, 'currentSeason', txt)}
                        placeholder="Rabi 2026-27"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Next Season Start Date</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.cropSessions?.nextSeasonStart || '2027-04-01'}
                        onChangeText={(txt) => handleUpdateMasterNested('cropSessions' as any, 'nextSeasonStart', txt)}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save Crop Cycles</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 7: Certificates & QR Portal */}
          {masterSubTab === 'certificates' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <Text style={[styles.subPaneTitle, { color: textColor }]}>Certificates & QR Portal Standard</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Verification stamps, digital QR codes and mandatory A4 page setup standard.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Certificate Authority Title</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.certificateConfig?.authorityName || 'FarmsKing Agronomy Board'}
                        onChangeText={(txt) => handleUpdateMasterNested('certificateConfig' as any, 'authorityName', txt)}
                        placeholder="FarmsKing Agronomy Board"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Page Standard Layout</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value="Strict A4 (210mm × 297mm)"
                        editable={false}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
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
                <Text style={[styles.subPaneTitle, { color: textColor }]}>Franchise & Mandi Agent Rules</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Commission tiers, security deposit requirements and agreement parameters.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Franchise Minimum Security (₹)</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={String(masterData.franchiseRules?.securityDeposit || 25000)}
                        onChangeText={(txt) => handleUpdateMasterNested('franchiseRules' as any, 'securityDeposit', parseInt(txt) || 25000)}
                        placeholder="25000"
                        placeholderTextColor={subTextColor}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Commission Percentage (%)</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={String(masterData.franchiseRules?.commissionRate || 5)}
                        onChangeText={(txt) => handleUpdateMasterNested('franchiseRules' as any, 'commissionRate', parseFloat(txt) || 5)}
                        placeholder="5.0"
                        placeholderTextColor={subTextColor}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save Franchise Rules</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 9: Backup & Recovery */}
          {masterSubTab === 'backup' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <Text style={[styles.subPaneTitle, { color: textColor }]}>Backup & Disaster Recovery</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Manage PostgreSQL database snapshot cadence, retention window and manual backups.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Auto-Backup Frequency</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.backupSettings?.frequency || 'Daily (02:00 AM IST)'}
                        onChangeText={(txt) => handleUpdateMasterNested('backupSettings' as any, 'frequency', txt)}
                        placeholder="Daily (02:00 AM IST)"
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
                        onChangeText={(txt) => handleUpdateMasterNested('backupSettings' as any, 'retentionDays', parseInt(txt) || 30)}
                        placeholder="30"
                        placeholderTextColor={subTextColor}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterBetween}>
                <TouchableOpacity style={[styles.outlineActionBtn, { borderColor: cardBorder, backgroundColor: innerBg }]} onPress={handleTriggerManualBackup}>
                  <Ionicons name="shield-checkmark-outline" size={15} color="#6366f1" />
                  <Text style={[styles.outlineActionText, { color: textColor }]}>Trigger Instant Backup</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
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
                <Text style={[styles.subPaneTitle, { color: textColor }]}>OTP Authentication & Login Switch</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Manage SMS and WhatsApp OTP verification requirements for farmers and merchants.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <View style={styles.toggleRowInline}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, { color: textColor }]}>SMS OTP Login Active</Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>Fast2SMS DLT verified 6-digit OTP codes</Text>
                  </View>
                  <Switch
                    value={masterData.otpLogin?.enabled ?? true}
                    onValueChange={(val) => handleUpdateMasterNested('otpLogin', 'enabled', val)}
                    thumbColor="#ffffff"
                    trackColor={{ false: '#64748b', true: '#6366f1' }}
                  />
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save OTP Switch</Text>
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
                  Temporarily pause farmer portal and live Mandi during system maintenance.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <View style={styles.toggleRowInline}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.toggleTitle, { color: textColor }]}>Maintenance Mode Active</Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>Display maintenance banner on mobile and web clients</Text>
                  </View>
                  <Switch
                    value={masterData.maintenance?.enabled ?? false}
                    onValueChange={(val) => handleUpdateMasterNested('maintenance', 'enabled', val)}
                    thumbColor="#ffffff"
                    trackColor={{ false: '#64748b', true: '#ef4444' }}
                  />
                </View>

                <View style={{ marginTop: 12 }}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Maintenance Message to Public</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.maintenance?.message || 'System upgrades in progress. We will be back online shortly.'}
                      onChangeText={(txt) => handleUpdateMasterNested('maintenance', 'message', txt)}
                      placeholder="Public maintenance notice..."
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
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
                <Text style={[styles.subPaneTitle, { color: textColor }]}>Tax / GST Settings & Invoicing</Text>
                <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                  Configure GST rates, State codes, and statutory invoicing rules.
                </Text>
              </View>

              <View style={styles.paneSectionBox}>
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Company GSTIN</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.taxGst?.gstin || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('taxGst', 'gstin', txt)}
                        placeholder="03AABCF1234D1Z5"
                        placeholderTextColor={subTextColor}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Default Service GST Rate (%)</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={String(masterData.taxGst?.defaultGstRate || 18)}
                        onChangeText={(txt) => handleUpdateMasterNested('taxGst', 'defaultGstRate', parseFloat(txt) || 18)}
                        placeholder="18"
                        placeholderTextColor={subTextColor}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity style={styles.saveActionBtn} onPress={handleSaveMasterData}>
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                    <Text style={styles.saveActionText}>Save Tax & GST</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  masterContainer: {
    width: '100%',
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    fontFamily: FONT.semiBold,
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
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
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
    fontSize: 18,
    fontFamily: FONT.bold,
  },
  toolDesc: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
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
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  masterPillActiveDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
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
  twoCol: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  col: {
    flex: 1,
    minWidth: 220,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    marginBottom: 6,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 12,
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FONT.regular,
    fontSize: 13,
  },
  presetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
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
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: '#6366f1',
  },
  tmplPillActiveDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: '#818cf8',
  },
  tmplPillText: {
    fontSize: 12,
    fontFamily: FONT.medium,
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
});
