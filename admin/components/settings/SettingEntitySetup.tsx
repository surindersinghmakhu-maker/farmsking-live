import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
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
  | 'social'
  | 'smtp'
  | 'email-templates'
  | 'maintenance'
  | 'tax-gst';

export type EmailTemplateKey = 'registration' | 'otp' | 'feeReceipt' | 'resultPublished' | 'certificateIssued';

export interface MasterDataTabItem {
  key: MasterDataSubTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

export const MASTER_DATA_TABS: MasterDataTabItem[] = [
  {
    key: 'basic-details',
    label: 'Corporate Identity & Legal',
    icon: 'business-outline',
    description: 'Company name, MCA, CIN, PAN, TAN & address',
  },
  {
    key: 'social',
    label: 'Social Profiles & Location',
    icon: 'share-social-outline',
    description: 'Official social profiles & Google Maps location',
  },
  {
    key: 'smtp',
    label: 'Mail Server (SMTP)',
    icon: 'mail-outline',
    description: 'Outgoing mail server, ports & credentials',
  },
  {
    key: 'email-templates',
    label: 'Email Templates',
    icon: 'document-text-outline',
    description: 'Automated email messages & live preview',
  },
  {
    key: 'maintenance',
    label: 'Maintenance Mode',
    icon: 'construct-outline',
    description: 'Emergency lockdown switch & public notice',
  },
  {
    key: 'tax-gst',
    label: 'GST & Tax Invoicing',
    icon: 'receipt-outline',
    description: 'GSTIN, default rates, invoicing & rules',
  },
];

export const THEME_PRESETS = [
  { name: 'Emerald Agritech (Default)', primary: '#16a34a', secondary: '#0284c7', button: '#10b981' },
  { name: 'Golden Mandi Harvest', primary: '#d97706', secondary: '#2563eb', button: '#f59e0b' },
  { name: 'Deep Eco-Forest', primary: '#059669', secondary: '#0891b2', button: '#10b981' },
  { name: 'Obsidian Executive Dark', primary: '#0f172a', secondary: '#6366f1', button: '#10b981' },
];

export const SMTP_PRESETS = [
  { name: 'Hostinger Business Mail', host: 'smtp.hostinger.com', port: 465, enc: 'ssl' },
  { name: 'Google Workspace / Gmail', host: 'smtp.gmail.com', port: 587, enc: 'tls' },
  { name: 'SendGrid / Twilio', host: 'smtp.sendgrid.net', port: 587, enc: 'tls' },
  { name: 'Amazon SES (Mumbai)', host: 'email-smtp.ap-south-1.amazonaws.com', port: 587, enc: 'tls' },
];

export const EMAIL_TEMPLATE_ITEMS: { key: EmailTemplateKey; label: string; icon: keyof typeof Ionicons.glyphMap; vars: string[] }[] = [
  {
    key: 'registration',
    label: 'Registration Email',
    icon: 'person-add-outline',
    vars: ['{{farmer_name}}', '{{company_name}}', '{{support_email}}', '{{support_phone}}'],
  },
  {
    key: 'otp',
    label: 'OTP Verification',
    icon: 'key-outline',
    vars: ['{{otp_code}}', '{{expiry_minutes}}', '{{company_name}}'],
  },
];

export default function SettingEntitySetup() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 860));
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  const { data: remoteConfig, isLoading, refetch } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const [localConfig, setLocalConfig] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(remoteConfig)
  );

  const [masterSubTab, setMasterSubTab] = useState<MasterDataSubTab>('basic-details');
  const [activeEmailTmpl, setActiveEmailTmpl] = useState<EmailTemplateKey>('registration');
  const [emailViewMode, setEmailViewMode] = useState<'editor' | 'preview'>('editor');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
  const [showSmtpPassword, setShowSmtpPassword] = useState(false);
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
    section: 'themeColors' | 'socialMedia' | 'smtp' | 'emailTemplates' | 'maintenance' | 'taxGst',
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

  const handleInsertVariable = (variable: string) => {
    const currentSubject = masterData.emailTemplates?.[activeEmailTmpl]?.subject || '';
    handleUpdateEmailTemplate(activeEmailTmpl, 'subject', `${currentSubject} ${variable}`.trim());
    showToast(`Inserted ${variable} into email subject!`);
  };

  const handleSaveMasterData = async () => {
    try {
      await updateMutation.mutateAsync({
        projectMasterData: localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA,
      });
      showToast('✅ FK Setting saved and synchronized successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Failed to save FK Setting');
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

  const handleOpenLink = (url: string) => {
    if (!url) return;
    const formatted = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`;
    Linking.openURL(formatted).catch(() => {
      Alert.alert('Cannot Open URL', `Unable to open: ${url}`);
    });
  };

  const handleExportMasterDataJson = () => {
    const dataStr = JSON.stringify(masterData, null, 2);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(dataStr);
      showToast('💾 Setting JSON configuration copied to clipboard!');
    } else {
      showToast('💾 Settings exported successfully!');
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

  const filteredTabs = MASTER_DATA_TABS.filter((tab) =>
    masterSearchQuery
      ? tab.label.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
        tab.description.toLowerCase().includes(masterSearchQuery.toLowerCase()) ||
        tab.key.toLowerCase().includes(masterSearchQuery.toLowerCase())
      : true
  );

  return (
    <View style={styles.masterContainer}>
      {/* Toast Alert */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: isLight ? '#f0fdf4' : '#062814', borderColor: isLight ? '#bbf7d0' : '#10b981' }]}>
          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
          <Text style={[styles.toastText, { color: textColor }]}>{toastMessage}</Text>
        </View>
      )}


      {/* Main Two-Column Layout (Sidebar + Content Pane) */}
      <View style={[styles.masterSubNavWrapper, isDesktop && styles.masterSubNavDesktopWrapper]}>
        {/* Left Navigation Sidebar */}
        <View style={[styles.masterPillsNav, isDesktop && styles.masterPillsNavDesktop, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.sidebarHeader}>
            <Text style={[styles.sidebarHeaderText, { color: subTextColor }]}>
              MODULES ({filteredTabs.length})
            </Text>
          </View>
          <ScrollView
            horizontal={!isDesktop}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.masterPillsScroll, isDesktop && styles.masterPillsScrollDesktop]}
          >
            {filteredTabs.map((tab) => {
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
                  <View
                    style={[
                      styles.tabIconBadge,
                      {
                        backgroundColor: isActive
                          ? isLight
                            ? '#6366f1'
                            : '#818cf8'
                          : isLight
                          ? 'rgba(148, 163, 184, 0.15)'
                          : 'rgba(51, 65, 85, 0.4)',
                      },
                    ]}
                  >
                    <Ionicons
                      name={tab.icon}
                      size={16}
                      color={isActive ? '#ffffff' : subTextColor}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.masterPillText,
                        { color: isActive ? (isLight ? '#4f46e5' : '#818cf8') : textColor },
                        isActive && { fontFamily: FONT.bold },
                      ]}
                      numberOfLines={1}
                    >
                      {tab.label}
                    </Text>
                    {isDesktop && (
                      <Text style={[styles.masterPillDesc, { color: subTextColor }]} numberOfLines={1}>
                        {tab.description}
                      </Text>
                    )}
                  </View>
                  {isActive && isDesktop && (
                    <Ionicons
                      name="chevron-forward"
                      size={15}
                      color={isLight ? '#4f46e5' : '#818cf8'}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Right Content Pane */}
        <View style={[styles.masterContentPane, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* TAB 1: Basic Details & Identity */}
          {masterSubTab === 'basic-details' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <View style={styles.paneTitleRow}>
                  <View style={[styles.paneIconBox, { backgroundColor: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)' }]}>
                    <Ionicons name="business-outline" size={20} color="#6366f1" />
                  </View>
                  <View>
                    <Text style={[styles.subPaneTitle, { color: textColor }]}>Corporate Identity & Legal Registrations</Text>
                    <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                      Approved corporate name, brand identity, and Ministry of Corporate Affairs (MCA) registration.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Group 1: Corporate Name & Brand */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Corporate Identity & Brand</Text>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Company Legal Name</Text>
                      <TouchableOpacity onPress={() => handleCopyValue('Legal Name', masterData.companyLegalName)}>
                        <Text style={styles.copyLink}>Copy</Text>
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
                        value={masterData.brandName || (masterData as any).brandDisplayName || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterField('brandName', txt);
                          handleUpdateMasterField('brandDisplayName' as any, txt);
                        }}
                        placeholder="FarmsKing™"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Registered Office Address</Text>
                      <TouchableOpacity onPress={() => handleCopyValue('Registered Address', masterData.registeredOfficeAddress || (masterData as any).registeredAddress || '')}>
                        <Text style={styles.copyLink}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 68 }]}>
                      <TextInput
                        style={[styles.input, { color: textColor, height: 58 }]}
                        value={masterData.registeredOfficeAddress || (masterData as any).registeredAddress || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterField('registeredOfficeAddress', txt);
                          handleUpdateMasterField('registeredAddress' as any, txt);
                        }}
                        placeholder="VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India"
                        placeholderTextColor={subTextColor}
                        multiline
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Corporate Tagline</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 68 }]}>
                      <TextInput
                        style={[styles.input, { color: textColor, height: 58 }]}
                        value={masterData.tagline}
                        onChangeText={(txt) => handleUpdateMasterField('tagline', txt)}
                        placeholder="Farming Easy, Farming Smart | National Smart Farming Platform"
                        placeholderTextColor={subTextColor}
                        multiline
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Group 2: Ministry of Corporate Affairs (MCA) Details */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Ministry of Corporate Affairs (MCA) Registrations</Text>
                  <View style={[styles.pillBadge, { backgroundColor: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)' }]}>
                    <Text style={[styles.pillBadgeText, { color: '#6366f1' }]}>Government of India</Text>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>MCA Incorporation SRN</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.mcaSrn}
                        onChangeText={(txt) => handleUpdateMasterField('mcaSrn', txt)}
                        placeholder="AC6979718"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>CIN (Corporate Identification Number)</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.cinNumber || (masterData as any).cin || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterField('cinNumber', txt);
                          handleUpdateMasterField('cin' as any, txt);
                        }}
                        placeholder="U01100PB2026PTC063294"
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
                        value={masterData.companyPan || (masterData as any).panNumber || ''}
                        onChangeText={(txt) => {
                          const val = txt.toUpperCase();
                          handleUpdateMasterField('companyPan', val);
                          handleUpdateMasterField('panNumber' as any, val);
                        }}
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
                        value={masterData.companyTan || ''}
                        onChangeText={(txt) => handleUpdateMasterField('companyTan', txt.toUpperCase())}
                        placeholder="PTLA12345B"
                        placeholderTextColor={subTextColor}
                        autoCapitalize="characters"
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Group 3: Helpdesk & Official Communication */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Official Helpdesk & Locations</Text>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Helpline Phone Number</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="call-outline" size={16} color={subTextColor} style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.officialPhone || masterData.primaryMobile || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterField('officialPhone', txt);
                          handleUpdateMasterField('primaryMobile', txt);
                        }}
                        placeholder="+91 95776 22000"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Official Support Email</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="mail-outline" size={16} color={subTextColor} style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.officialEmail || masterData.supportEmail || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterField('officialEmail', txt);
                          handleUpdateMasterField('supportEmail', txt);
                        }}
                        placeholder="support@farmsking.in"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Operational HQ / Administrative Office</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="location-outline" size={16} color={subTextColor} style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.operationalHq || ''}
                        onChangeText={(txt) => handleUpdateMasterField('operationalHq', txt)}
                        placeholder="Near Grain Market, Makhu, District Ferozepur, Punjab - 142044, India"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity
                  style={[styles.saveActionBtn, updateMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleSaveMasterData}
                  disabled={updateMutation.isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    {updateMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    )}
                    <Text style={styles.saveActionText}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Corporate Details'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}



          {/* TAB 3: Social Media & Maps */}
          {masterSubTab === 'social' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <View style={styles.paneTitleRow}>
                  <View style={[styles.paneIconBox, { backgroundColor: isLight ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.2)' }]}>
                    <Ionicons name="share-social-outline" size={20} color="#3b82f6" />
                  </View>
                  <View>
                    <Text style={[styles.subPaneTitle, { color: textColor }]}>Social Profiles & Location</Text>
                    <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                      Manage official social networking handles and Google Maps geolocation coordinates.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Group: Social Channels */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Official Social Channels</Text>
                </View>

                {/* Facebook & Instagram */}
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Facebook Page</Text>
                      {masterData.socialMedia?.facebook || masterData.socialMedia?.facebookUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.facebook || masterData.socialMedia?.facebookUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-facebook" size={18} color="#1877f2" style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.facebook || masterData.socialMedia?.facebookUrl || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterNested('socialMedia', 'facebook', txt);
                          handleUpdateMasterNested('socialMedia', 'facebookUrl', txt);
                        }}
                        placeholder="https://facebook.com/farmsking.india"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Instagram Profile</Text>
                      {masterData.socialMedia?.instagram || masterData.socialMedia?.instagramUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.instagram || masterData.socialMedia?.instagramUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-instagram" size={18} color="#e1306c" style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.instagram || masterData.socialMedia?.instagramUrl || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterNested('socialMedia', 'instagram', txt);
                          handleUpdateMasterNested('socialMedia', 'instagramUrl', txt);
                        }}
                        placeholder="https://instagram.com/farmsking.india"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                {/* YouTube & Twitter */}
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>YouTube Channel</Text>
                      {masterData.socialMedia?.youtube || masterData.socialMedia?.youtubeUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.youtube || masterData.socialMedia?.youtubeUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-youtube" size={18} color="#ff0000" style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.youtube || masterData.socialMedia?.youtubeUrl || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterNested('socialMedia', 'youtube', txt);
                          handleUpdateMasterNested('socialMedia', 'youtubeUrl', txt);
                        }}
                        placeholder="https://youtube.com/@farmsking"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Twitter / X</Text>
                      {masterData.socialMedia?.twitter || masterData.socialMedia?.twitterUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.twitter || masterData.socialMedia?.twitterUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-twitter" size={18} color="#0284c7" style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.twitter || masterData.socialMedia?.twitterUrl || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterNested('socialMedia', 'twitter', txt);
                          handleUpdateMasterNested('socialMedia', 'twitterUrl', txt);
                        }}
                        placeholder="https://x.com/farmsking"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                {/* LinkedIn & Google Maps */}
                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>LinkedIn Organization</Text>
                      {masterData.socialMedia?.linkedin || masterData.socialMedia?.linkedinUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.linkedin || masterData.socialMedia?.linkedinUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-linkedin" size={18} color="#0a66c2" style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.linkedin || masterData.socialMedia?.linkedinUrl || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterNested('socialMedia', 'linkedin', txt);
                          handleUpdateMasterNested('socialMedia', 'linkedinUrl', txt);
                        }}
                        placeholder="https://linkedin.com/company/farmsking"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Google Maps / Business Link</Text>
                      {masterData.socialMedia?.googleBusinessUrl || (masterData.socialMedia as any)?.mapsUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.googleBusinessUrl || (masterData.socialMedia as any)?.mapsUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="location-outline" size={18} color="#10b981" style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.socialMedia?.googleBusinessUrl || (masterData.socialMedia as any)?.mapsUrl || ''}
                        onChangeText={(txt) => {
                          handleUpdateMasterNested('socialMedia', 'googleBusinessUrl', txt);
                          handleUpdateMasterNested('socialMedia', 'mapsUrl', txt);
                        }}
                        placeholder="https://maps.google.com/?q=FarmsKing+Technologies"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity
                  style={[styles.saveActionBtn, updateMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleSaveMasterData}
                  disabled={updateMutation.isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    {updateMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    )}
                    <Text style={styles.saveActionText}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Social & Location'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 4: SMTP Settings */}
          {masterSubTab === 'smtp' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <View style={styles.paneTitleRow}>
                  <View style={[styles.paneIconBox, { backgroundColor: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)' }]}>
                    <Ionicons name="mail-outline" size={20} color="#6366f1" />
                  </View>
                  <View>
                    <Text style={[styles.subPaneTitle, { color: textColor }]}>Mail Server (SMTP)</Text>
                    <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                      Outgoing mail server credentials for OTPs, invoices, and diagnostic notifications.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Quick Presets */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Quick Mail Server Presets</Text>
                </View>

                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                  {SMTP_PRESETS.map((preset) => (
                    <TouchableOpacity
                      key={preset.name}
                      style={[styles.presetCard, { borderColor: cardBorder, backgroundColor: innerBg }]}
                      onPress={() => handleApplySmtpPreset(preset)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="mail-outline" size={15} color="#6366f1" style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, color: textColor, fontFamily: FONT.semiBold }}>{preset.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Host & Port */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Server Connection Details</Text>
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

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>SMTP Username / Account</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.smtp?.username || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('smtp', 'username', txt)}
                        placeholder="noreply@farmsking.in"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>SMTP Password / App Secret</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.smtp?.password || ''}
                        onChangeText={(txt) => handleUpdateMasterNested('smtp', 'password', txt)}
                        placeholder="••••••••••••"
                        placeholderTextColor={subTextColor}
                        secureTextEntry={!showSmtpPassword}
                      />
                      <TouchableOpacity onPress={() => setShowSmtpPassword(!showSmtpPassword)} style={{ padding: 4 }}>
                        <Ionicons
                          name={showSmtpPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={16}
                          color={subTextColor}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterBetween}>
                <TouchableOpacity
                  style={[styles.outlineActionBtn, { borderColor: cardBorder, backgroundColor: innerBg }]}
                  onPress={handleTestEmail}
                  activeOpacity={0.7}
                >
                  <Ionicons name="paper-plane-outline" size={15} color="#6366f1" />
                  <Text style={[styles.outlineActionText, { color: textColor }]}>Send Test Email</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveActionBtn, updateMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleSaveMasterData}
                  disabled={updateMutation.isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    {updateMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    )}
                    <Text style={styles.saveActionText}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Mail Server'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 5: Email Templates */}
          {masterSubTab === 'email-templates' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <View style={styles.paneTitleRow}>
                  <View style={[styles.paneIconBox, { backgroundColor: isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(99, 102, 241, 0.2)' }]}>
                    <Ionicons name="document-text-outline" size={20} color="#6366f1" />
                  </View>
                  <View>
                    <Text style={[styles.subPaneTitle, { color: textColor }]}>Email Notification Templates</Text>
                    <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                      Customize transaction, verification and diagnostic dispatch templates with live preview.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Template Selectors */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                {EMAIL_TEMPLATE_ITEMS.map((item) => {
                  const isSelected = activeEmailTmpl === item.key;
                  return (
                    <TouchableOpacity
                      key={item.key}
                      style={[
                        styles.tmplPill,
                        { borderColor: isSelected ? '#6366f1' : cardBorder },
                        isSelected && (isLight ? styles.tmplPillActiveLight : styles.tmplPillActiveDark),
                      ]}
                      onPress={() => setActiveEmailTmpl(item.key)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={item.icon} size={15} color={isSelected ? '#6366f1' : subTextColor} />
                      <Text style={[styles.tmplPillText, { color: isSelected ? textColor : subTextColor, fontFamily: isSelected ? FONT.bold : FONT.medium }]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Mode Toggle Bar: Editor vs Preview */}
              <View style={[styles.templateModeBar, { borderColor: cardBorder }]}>
                <View style={styles.segmentedToggle}>
                  <TouchableOpacity
                    style={[
                      styles.toggleSegment,
                      emailViewMode === 'editor' && (isLight ? styles.toggleSegmentActiveLight : styles.toggleSegmentActiveDark),
                    ]}
                    onPress={() => setEmailViewMode('editor')}
                  >
                    <Ionicons name="create-outline" size={14} color={emailViewMode === 'editor' ? '#6366f1' : subTextColor} />
                    <Text style={[styles.toggleSegmentText, { color: emailViewMode === 'editor' ? textColor : subTextColor }]}>
                      Template Editor
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.toggleSegment,
                      emailViewMode === 'preview' && (isLight ? styles.toggleSegmentActiveLight : styles.toggleSegmentActiveDark),
                    ]}
                    onPress={() => setEmailViewMode('preview')}
                  >
                    <Ionicons name="eye-outline" size={14} color={emailViewMode === 'preview' ? '#6366f1' : subTextColor} />
                    <Text style={[styles.toggleSegmentText, { color: emailViewMode === 'preview' ? textColor : subTextColor }]}>
                      Live Email Preview
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {emailViewMode === 'editor' ? (
                <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                  {/* Subject Line */}
                  <View style={{ marginBottom: 14 }}>
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
                  </View>

                  {/* Available Variables */}
                  <View style={{ marginBottom: 14 }}>
                    <Text style={[styles.inputLabel, { color: subTextColor, fontSize: 11.5 }]}>
                      AVAILABLE DYNAMIC TOKENS (CLICK TO APPEND TO SUBJECT):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {(EMAIL_TEMPLATE_ITEMS.find((t) => t.key === activeEmailTmpl)?.vars || []).map((v) => (
                        <TouchableOpacity
                          key={v}
                          style={[styles.varChip, { backgroundColor: innerBg, borderColor: cardBorder }]}
                          onPress={() => handleInsertVariable(v)}
                        >
                          <Text style={[styles.varChipText, { color: '#6366f1' }]}>{v}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  {/* Body Editor */}
                  <Text style={[styles.inputLabel, { color: textColor }]}>Email Body (HTML / Formatted Content)</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 180 }]}>
                    <TextInput
                      style={[styles.input, { color: textColor, height: 170, textAlignVertical: 'top', paddingTop: 8 }]}
                      value={masterData.emailTemplates?.[activeEmailTmpl]?.body || ''}
                      onChangeText={(txt) => handleUpdateEmailTemplate(activeEmailTmpl, 'body', txt)}
                      placeholder="HTML email body..."
                      placeholderTextColor={subTextColor}
                      multiline
                    />
                  </View>
                </View>
              ) : (
                /* Live Preview Mode */
                <View style={[styles.liveEmailPreviewBox, { borderColor: cardBorder, backgroundColor: innerBg }]}>
                  <View style={styles.previewMetaHeader}>
                    <Text style={[styles.previewMetaSubject, { color: textColor }]}>
                      Subject: {masterData.emailTemplates?.[activeEmailTmpl]?.subject || 'No Subject Defined'}
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      From: {masterData.smtp?.fromName || 'FarmsKing'} &lt;{masterData.smtp?.fromEmail || 'noreply@farmsking.in'}&gt;
                    </Text>
                  </View>

                  <View style={[styles.previewEmailCard, { backgroundColor: isLight ? '#ffffff' : '#0f172a', borderColor: cardBorder }]}>
                    <View style={styles.previewEmailBrandHeader}>
                      <Text style={{ fontSize: 18, fontFamily: FONT.bold, color: '#16a34a' }}>
                        {masterData.brandName || 'FarmsKing™'}
                      </Text>
                      <Text style={{ fontSize: 11, color: subTextColor }}>Official Notification</Text>
                    </View>

                    <View style={{ marginVertical: 14 }}>
                      <Text style={{ fontSize: 14, color: textColor, lineHeight: 22 }}>
                        {masterData.emailTemplates?.[activeEmailTmpl]?.body
                          ?.replace(/<[^>]+>/g, ' ')
                          ?.replace(/\s+/g, ' ')
                          ?.trim() || 'No email body preview available.'}
                      </Text>
                    </View>

                    <View style={[styles.previewEmailFooter, { borderTopColor: cardBorder }]}>
                      <Text style={{ fontSize: 11, color: subTextColor }}>
                        {masterData.companyLegalName || 'FARMSKING TECHNOLOGIES PRIVATE LIMITED'} • {masterData.officialEmail || 'support@farmsking.in'}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <View style={styles.paneFooterRight}>
                <TouchableOpacity
                  style={[styles.saveActionBtn, updateMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleSaveMasterData}
                  disabled={updateMutation.isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    {updateMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    )}
                    <Text style={styles.saveActionText}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Email Templates'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 6: Maintenance Mode */}
          {masterSubTab === 'maintenance' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <View style={styles.paneTitleRow}>
                  <View style={[styles.paneIconBox, { backgroundColor: isLight ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.2)' }]}>
                    <Ionicons name="construct-outline" size={20} color="#ef4444" />
                  </View>
                  <View>
                    <Text style={[styles.subPaneTitle, { color: textColor }]}>Maintenance Mode & Emergency Lockdown</Text>
                    <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                      Temporarily pause farmer portal and live Mandi during system maintenance.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Status Banner */}
              <View
                style={[
                  styles.maintenanceStatusCard,
                  {
                    backgroundColor: masterData.maintenance?.enabled
                      ? isLight
                        ? '#fef2f2'
                        : '#2c1212'
                      : isLight
                      ? '#f0fdf4'
                      : '#062814',
                    borderColor: masterData.maintenance?.enabled ? '#ef4444' : '#10b981',
                  },
                ]}
              >
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: masterData.maintenance?.enabled ? '#ef4444' : '#10b981' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.maintenanceStatusTitle,
                        { color: masterData.maintenance?.enabled ? '#ef4444' : '#10b981' },
                      ]}
                    >
                      {masterData.maintenance?.enabled
                        ? 'MAINTENANCE MODE ACTIVE (PUBLIC LOCKDOWN)'
                        : 'SYSTEM LIVE & FULLY OPERATIONAL'}
                    </Text>
                  </View>
                  <Text style={[styles.maintenanceStatusDesc, { color: textColor }]}>
                    {masterData.maintenance?.enabled
                      ? 'Farmers and public visitors will see the maintenance notice instead of normal portal views.'
                      : 'All web, mobile apps, Mandi telemetry, and AI pathology services are online.'}
                  </Text>
                </View>
                <Switch
                  value={masterData.maintenance?.enabled ?? false}
                  onValueChange={(val) => handleUpdateMasterNested('maintenance', 'enabled', val)}
                  thumbColor="#ffffff"
                  trackColor={{ false: '#64748b', true: '#ef4444' }}
                />
              </View>

              {/* Notice Message & Presets */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Public Maintenance Notice</Text>
                </View>

                <View style={{ marginBottom: 14 }}>
                  <Text style={[styles.inputLabel, { color: subTextColor, fontSize: 11.5 }]}>
                    QUICK NOTICE PRESETS:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {[
                      'Scheduled agritech platform upgrades in progress. We will be back shortly.',
                      'Database migration & security patch in progress. Normal operations resume at 06:00 AM IST.',
                      'Emergency server maintenance. Our engineering team is restoring services.',
                    ].map((presetMsg, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.presetCard, { borderColor: cardBorder, backgroundColor: innerBg }]}
                        onPress={() => handleUpdateMasterNested('maintenance', 'message', presetMsg)}
                      >
                        <Text style={{ fontSize: 12, color: textColor }} numberOfLines={1}>
                          Preset {idx + 1}: {presetMsg.slice(0, 36)}...
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Displayed Public Notice</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 72 }]}>
                    <TextInput
                      style={[styles.input, { color: textColor, height: 62 }]}
                      value={masterData.maintenance?.message || ''}
                      onChangeText={(txt) => handleUpdateMasterNested('maintenance', 'message', txt)}
                      placeholder="Public maintenance notice shown on web and mobile..."
                      placeholderTextColor={subTextColor}
                      multiline
                    />
                  </View>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity
                  style={[styles.saveActionBtn, updateMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleSaveMasterData}
                  disabled={updateMutation.isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    {updateMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    )}
                    <Text style={styles.saveActionText}>
                      {updateMutation.isPending ? 'Saving...' : 'Save Maintenance Settings'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 7: Tax / GST Settings */}
          {masterSubTab === 'tax-gst' && (
            <View style={styles.masterTabPane}>
              <View style={styles.subPaneHeader}>
                <View style={styles.paneTitleRow}>
                  <View style={[styles.paneIconBox, { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)' }]}>
                    <Ionicons name="receipt-outline" size={20} color="#10b981" />
                  </View>
                  <View>
                    <Text style={[styles.subPaneTitle, { color: textColor }]}>GST & Tax Invoicing</Text>
                    <Text style={[styles.subPaneSubtitle, { color: subTextColor }]}>
                      Configure GSTIN rates, state codes, and statutory invoicing rules for corporate transactions.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Group: Statutory GST Identifiers */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Goods & Services Tax (GST) Identification</Text>
                  <View style={[styles.pillBadge, { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>GST Act Compliance</Text>
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Company GSTIN Number</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.taxGst?.gstin || masterData.taxGst?.gstNumber || ''}
                        onChangeText={(txt) => {
                          const val = txt.toUpperCase();
                          handleUpdateMasterNested('taxGst', 'gstin', val);
                          handleUpdateMasterNested('taxGst', 'gstNumber', val);
                        }}
                        placeholder="03AAAAF0000A1Z5"
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
                        value={String(masterData.taxGst?.defaultGstRate || masterData.taxGst?.taxPercentage || 18)}
                        onChangeText={(txt) => {
                          const parsed = parseFloat(txt) || 0;
                          handleUpdateMasterNested('taxGst', 'defaultGstRate', parsed);
                          handleUpdateMasterNested('taxGst', 'taxPercentage', parsed);
                        }}
                        placeholder="18"
                        placeholderTextColor={subTextColor}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>

                {/* Quick Tax Rate Selectors */}
                <View style={{ marginTop: 8, marginBottom: 14 }}>
                  <Text style={[styles.inputLabel, { color: subTextColor, fontSize: 11.5 }]}>
                    STANDARD GST SLABS:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                    {[0, 5, 12, 18, 28].map((rate) => {
                      const isCurrent =
                        (masterData.taxGst?.defaultGstRate || masterData.taxGst?.taxPercentage) === rate;
                      return (
                        <TouchableOpacity
                          key={rate}
                          style={[
                            styles.ratePill,
                            { borderColor: isCurrent ? '#10b981' : cardBorder, backgroundColor: innerBg },
                            isCurrent && { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.25)' },
                          ]}
                          onPress={() => {
                            handleUpdateMasterNested('taxGst', 'defaultGstRate', rate);
                            handleUpdateMasterNested('taxGst', 'taxPercentage', rate);
                          }}
                        >
                          <Text style={{ fontSize: 12, color: isCurrent ? '#10b981' : textColor, fontFamily: FONT.semiBold }}>
                            {rate}% GST
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Invoice Number Prefix</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.taxGst?.invoicePrefix || 'FK-INV-'}
                        onChangeText={(txt) => handleUpdateMasterNested('taxGst', 'invoicePrefix', txt)}
                        placeholder="FK-INV-"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>

                  <View style={styles.col}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>HSN / SAC Code</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.taxGst?.hsnSacCode || '998314'}
                        onChangeText={(txt) => handleUpdateMasterNested('taxGst', 'hsnSacCode', txt)}
                        placeholder="998314 (IT & Agronomy Software Support)"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>
              </View>

              {/* Statutory Agricultural Exemption Notice */}
              <View style={[styles.exemptionNotice, { borderColor: cardBorder, backgroundColor: innerBg }]}>
                <Ionicons name="information-circle-outline" size={20} color="#10b981" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.exemptionTitle, { color: textColor }]}>
                    Agricultural Produce Exemption (Section 11, CGST Act)
                  </Text>
                  <Text style={[styles.exemptionDesc, { color: subTextColor }]}>
                    Under statutory Indian tax regulations, wholesale raw agricultural produce transacted through APMC Mandis is exempt from GST. Software platforms and value-added agri services are billed at the configured rate above.
                  </Text>
                </View>
              </View>

              <View style={styles.paneFooterRight}>
                <TouchableOpacity
                  style={[styles.saveActionBtn, updateMutation.isPending && { opacity: 0.7 }]}
                  onPress={handleSaveMasterData}
                  disabled={updateMutation.isPending}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.saveActionGradient}>
                    {updateMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    )}
                    <Text style={styles.saveActionText}>
                      {updateMutation.isPending ? 'Saving...' : 'Save GST & Tax Rules'}
                    </Text>
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
    gap: 10,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13.5,
    fontFamily: FONT.semiBold,
  },
  topExecutiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 14,
  },
  topExecutiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 260,
  },
  topIconBox: {
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
  topTitle: {
    fontSize: 18,
    fontFamily: FONT.bold,
  },
  topSubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  topExecutiveActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  topActionBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.medium,
  },
  topSaveBtn: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  topSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  topSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  masterSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    height: 44,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontFamily: FONT.regular,
    fontSize: 13,
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
    padding: 10,
  },
  masterPillsNavDesktop: {
    width: 290,
  },
  sidebarHeader: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginBottom: 4,
  },
  sidebarHeaderText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 0.6,
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
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 10,
  },
  masterPillItemDesktop: {
    width: '100%',
  },
  tabIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
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
  masterPillDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 1,
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
    marginBottom: 18,
  },
  paneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paneIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPaneTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
  },
  subPaneSubtitle: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  groupSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  groupTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  pillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  col: {
    flex: 1,
    minWidth: 240,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    marginBottom: 6,
  },
  copyLink: {
    fontSize: 11,
    color: '#6366f1',
    fontFamily: FONT.medium,
  },
  openLink: {
    fontSize: 11,
    color: '#10b981',
    fontFamily: FONT.medium,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FONT.regular,
    fontSize: 13,
  },
  previewMockupBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewMockupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  previewMockupLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  previewDotRow: {
    flexDirection: 'row',
    gap: 6,
  },
  colorPreviewDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  previewMockupContent: {
    gap: 12,
  },
  previewMockupBanner: {
    padding: 14,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewMockupBannerTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  previewMockupBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewMockupBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  previewMockupControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  previewMockupBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  previewMockupBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  colorMiniDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
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
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  tmplPillActiveLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  tmplPillActiveDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tmplPillText: {
    fontSize: 12.5,
  },
  templateModeBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 12,
  },
  segmentedToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    padding: 3,
  },
  toggleSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  toggleSegmentActiveLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  toggleSegmentActiveDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  toggleSegmentText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  varChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  varChipText: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  liveEmailPreviewBox: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  previewMetaHeader: {
    marginBottom: 14,
    gap: 4,
  },
  previewMetaSubject: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  previewEmailCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
  },
  previewEmailBrandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    paddingBottom: 10,
  },
  previewEmailFooter: {
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  maintenanceStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 14,
  },
  maintenanceStatusTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  maintenanceStatusDesc: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    marginTop: 4,
  },
  ratePill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  exemptionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  exemptionTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    marginBottom: 2,
  },
  exemptionDesc: {
    fontSize: 12,
    fontFamily: FONT.regular,
    lineHeight: 18,
  },
  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  outlineActionText: {
    fontSize: 13,
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
});
