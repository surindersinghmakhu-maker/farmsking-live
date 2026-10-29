import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
  updateAppSettings,
} from '@/src/api/appSettings.api';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS } from '@/constants/theme';
import SettingOtherSetup from '@/components/settings/SettingOtherSetup';

export type MasterDataSubTab =
  | 'basic-details'
  | 'app-download'
  | 'social'
  | 'email-templates'
  | 'maintenance'
  | 'tax-gst'
  | 'other';

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
    key: 'app-download',
    label: 'App Download & QR Links',
    icon: 'phone-portrait-outline',
    description: 'Android APK / Play Store URL & auto QR generator',
  },
  {
    key: 'social',
    label: 'Social Profiles & Location',
    icon: 'share-social-outline',
    description: 'Official social profiles & Google Maps location',
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
  {
    key: 'other',
    label: 'Other System Settings',
    icon: 'options-outline',
    description: 'Referral bonuses, wallet taxes, telecom, storage & unexposed rules',
  },
];

export const THEME_PRESETS = [
  { name: 'Emerald Agritech (Default)', primary: '#16a34a', secondary: '#0284c7', button: '#10b981' },
  { name: 'Golden Mandi Harvest', primary: '#d97706', secondary: '#2563eb', button: '#f59e0b' },
  { name: 'Deep Eco-Forest', primary: '#059669', secondary: '#0891b2', button: '#10b981' },
  { name: 'Obsidian Executive Dark', primary: '#0f172a', secondary: '#6366f1', button: '#10b981' },
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [activeEmailTmpl, setActiveEmailTmpl] = useState<EmailTemplateKey>('registration');
  const [emailViewMode, setEmailViewMode] = useState<'editor' | 'preview'>('editor');
  const [masterSearchQuery, setMasterSearchQuery] = useState('');
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
      const pmd = localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      await updateMutation.mutateAsync({
        projectMasterData: pmd,
      });
      if (pmd.appDownloadUrl) {
        try {
          await updateAppSettings({ appDownloadUrl: pmd.appDownloadUrl });
        } catch {}
      }
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


      {/* Executive Module Dropdown Selector Bar */}
      {(() => {
        const activeTabItem = MASTER_DATA_TABS.find((t) => t.key === masterSubTab) || MASTER_DATA_TABS[0];
        const activeIndex = MASTER_DATA_TABS.findIndex((t) => t.key === masterSubTab);
        return (
          <View style={[styles.dropdownContainer, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <TouchableOpacity
              style={styles.dropdownHeader}
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownHeaderLeft}>
                <View style={[styles.dropdownIconBadge, { backgroundColor: isLight ? '#eef2ff' : '#1e1b4b' }]}>
                  <Ionicons name={activeTabItem.icon} size={20} color="#6366f1" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.dropdownTitleRow}>
                    <Text style={[styles.dropdownModuleLabel, { color: subTextColor }]}>ACTIVE SETTING MODULE</Text>
                    <View style={[styles.dropdownCountBadge, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                      <Text style={[styles.dropdownCountText, { color: subTextColor }]}>
                        {activeIndex + 1} of {MASTER_DATA_TABS.length}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.dropdownTitle, { color: textColor }]}>{activeTabItem.label}</Text>
                </View>
              </View>

              <View style={[styles.dropdownChevronBtn, { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: cardBorder }]}>
                <Text style={[styles.dropdownChevronText, { color: '#6366f1' }]}>Switch Module</Text>
                <Ionicons
                  name={isDropdownOpen ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color="#6366f1"
                />
              </View>
            </TouchableOpacity>

            {/* Dropdown Options List */}
            {isDropdownOpen && (
              <View style={[styles.dropdownList, { borderTopColor: cardBorder }]}>
                {MASTER_DATA_TABS.map((tab) => {
                  const isSelected = masterSubTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      style={[
                        styles.dropdownItem,
                        isSelected && (isLight ? styles.dropdownItemActiveLight : styles.dropdownItemActiveDark),
                      ]}
                      onPress={() => {
                        setMasterSubTab(tab.key);
                        setIsDropdownOpen(false);
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.tabIconBadge,
                          {
                            backgroundColor: isSelected
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
                          size={17}
                          color={isSelected ? '#ffffff' : subTextColor}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.dropdownItemTitle,
                            { color: isSelected ? (isLight ? '#4f46e5' : '#818cf8') : textColor },
                            isSelected && { fontFamily: FONT.bold },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.activeCheckBadge}>
                          <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
      })()}

      {/* Main Full-Width Content Pane */}
      <View style={[styles.masterContentPane, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          {/* TAB 1: Basic Details & Identity */}
          {masterSubTab === 'basic-details' && (
            <View style={styles.masterTabPane}>
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
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 46 }]}>
                      <TextInput
                        style={[styles.input, { color: textColor, height: 38 }]}
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
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 46 }]}>
                      <TextInput
                        style={[styles.input, { color: textColor, height: 38 }]}
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

                <View style={styles.fourCol}>
                  <View style={styles.col4}>
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

                  <View style={styles.col4}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>CIN Number</Text>
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

                  <View style={styles.col4}>
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

                  <View style={styles.col4}>
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

                <View style={styles.threeCol}>
                  <View style={styles.col3}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Helpline Phone Number</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="call-outline" size={15} color={subTextColor} style={{ marginRight: 6 }} />
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

                  <View style={styles.col3}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Official Support Email</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="mail-outline" size={15} color={subTextColor} style={{ marginRight: 6 }} />
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

                  <View style={styles.col3}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Operational HQ / Admin Office</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="location-outline" size={15} color={subTextColor} style={{ marginRight: 6 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.operationalHq || ''}
                        onChangeText={(txt) => handleUpdateMasterField('operationalHq', txt)}
                        placeholder="Near Grain Market, Makhu, Punjab - 142044"
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

          {/* TAB: App Download & Mobile QR Settings */}
          {masterSubTab === 'app-download' && (
            <View style={styles.masterTabPane}>
              {/* Group 1: Mobile App Links */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>FarmsKing Mobile App Distribution Links</Text>
                  <View style={[styles.pillBadge, { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>Live Automatic QR Sync</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 13, color: subTextColor, marginBottom: 16, lineHeight: 19 }}>
                  Configure the official download link for the FarmsKing Mobile App. The QR code on the public website homepage automatically regenerates from this link in real-time so farmers and visitors can scan and install the app seamlessly.
                </Text>

                <View style={styles.twoCol}>
                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Android App Download URL / Direct APK Link</Text>
                      {masterData.appDownloadUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.appDownloadUrl || '')}>
                          <Text style={styles.openLink}>Test Link</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-android" size={17} color="#10b981" style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.appDownloadUrl || ''}
                        onChangeText={(txt) => handleUpdateMasterField('appDownloadUrl', txt)}
                        placeholder="https://farmsking.in/download/farmsking.apk"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                    <Text style={{ fontSize: 11, color: subTextColor, marginTop: 4 }}>
                      Direct APK download link or Google Play Store URL. If left blank, defaults to https://www.farmsking.in
                    </Text>
                  </View>

                  <View style={styles.col}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Latest Mobile App Version</Text>
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="git-branch-outline" size={16} color="#6366f1" style={{ marginRight: 8 }} />
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.latestAppVersion || '2.1.0'}
                        onChangeText={(txt) => handleUpdateMasterField('latestAppVersion', txt)}
                        placeholder="2.1.0"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                    <Text style={{ fontSize: 11, color: subTextColor, marginTop: 4 }}>
                      Current released production build version displayed to farmers.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Group 2: Live QR Code Preview */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Live Auto-Generated QR Code Preview</Text>
                </View>

                <View style={{ flexDirection: isDesktop ? 'row' : 'column', alignItems: 'center', gap: 24, paddingVertical: 12 }}>
                  <View style={{
                    padding: 16,
                    backgroundColor: '#ffffff',
                    borderRadius: 16,
                    borderWidth: 1.5,
                    borderColor: '#10b981',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                  }}>
                    {/* Live QR Image */}
                    <Image
                      source={{
                        uri: `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                          masterData.appDownloadUrl && masterData.appDownloadUrl.trim()
                            ? masterData.appDownloadUrl.trim()
                            : 'https://www.farmsking.in'
                        )}&margin=4`,
                      }}
                      style={{ width: 140, height: 140, borderRadius: 8 }}
                      resizeMode="contain"
                    />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#0f172a', marginTop: 10 }}>
                      SCAN TO DOWNLOAD APP
                    </Text>
                    <Text style={{ fontSize: 10, color: '#64748b', marginTop: 2, maxWidth: 170, textAlign: 'center' }} numberOfLines={1}>
                      {masterData.appDownloadUrl || 'https://www.farmsking.in'}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                      <Text style={{ fontSize: 14, fontWeight: '700', color: textColor }}>
                        Automatic Homepage Synchronization
                      </Text>
                    </View>
                    <Text style={{ fontSize: 13, color: subTextColor, lineHeight: 20, marginBottom: 12 }}>
                      Any changes saved to the App Download URL here will instantly reflect on the public website homepage. Visitors scanning the QR code with their mobile cameras will be routed directly to this download address.
                    </Text>

                    <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                          borderRadius: 8,
                          backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                          borderWidth: 1,
                          borderColor: cardBorder,
                        }}
                        onPress={() => handleCopyValue('App Download URL', masterData.appDownloadUrl || 'https://www.farmsking.in')}
                      >
                        <Ionicons name="copy-outline" size={14} color={textColor} />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: textColor }}>Copy Link</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingVertical: 8,
                          paddingHorizontal: 14,
                          borderRadius: 8,
                          backgroundColor: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)',
                          borderWidth: 1,
                          borderColor: '#10b981',
                        }}
                        onPress={() => handleOpenLink(masterData.appDownloadUrl || 'https://www.farmsking.in')}
                      >
                        <Ionicons name="open-outline" size={14} color="#10b981" />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: '#10b981' }}>Open & Test Link</Text>
                      </TouchableOpacity>
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
                  <LinearGradient colors={['#10b981', '#059669']} style={styles.saveActionGradient}>
                    {updateMutation.isPending ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                    )}
                    <Text style={styles.saveActionText}>
                      {updateMutation.isPending ? 'Saving...' : 'Save App Download Settings'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* TAB 2: Social Media & Maps */}
          {masterSubTab === 'social' && (
            <View style={styles.masterTabPane}>
              {/* Group: Social Channels */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Official Social Channels & Maps</Text>
                </View>

                {/* Row 1: Facebook, Instagram, YouTube */}
                <View style={styles.threeCol}>
                  <View style={styles.col3}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Facebook Page</Text>
                      {masterData.socialMedia?.facebook || masterData.socialMedia?.facebookUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.facebook || masterData.socialMedia?.facebookUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-facebook" size={16} color="#1877f2" style={{ marginRight: 6 }} />
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

                  <View style={styles.col3}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Instagram Profile</Text>
                      {masterData.socialMedia?.instagram || masterData.socialMedia?.instagramUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.instagram || masterData.socialMedia?.instagramUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-instagram" size={16} color="#e1306c" style={{ marginRight: 6 }} />
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

                  <View style={styles.col3}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>YouTube Channel</Text>
                      {masterData.socialMedia?.youtube || masterData.socialMedia?.youtubeUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.youtube || masterData.socialMedia?.youtubeUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-youtube" size={16} color="#ff0000" style={{ marginRight: 6 }} />
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
                </View>

                {/* Row 2: Twitter, LinkedIn, Google Maps */}
                <View style={styles.threeCol}>
                  <View style={styles.col3}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Twitter / X</Text>
                      {masterData.socialMedia?.twitter || masterData.socialMedia?.twitterUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.twitter || masterData.socialMedia?.twitterUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-twitter" size={16} color="#0284c7" style={{ marginRight: 6 }} />
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

                  <View style={styles.col3}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>LinkedIn Organization</Text>
                      {masterData.socialMedia?.linkedin || masterData.socialMedia?.linkedinUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.linkedin || masterData.socialMedia?.linkedinUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="logo-linkedin" size={16} color="#0a66c2" style={{ marginRight: 6 }} />
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

                  <View style={styles.col3}>
                    <View style={styles.labelRow}>
                      <Text style={[styles.inputLabel, { color: textColor }]}>Google Maps Link</Text>
                      {masterData.socialMedia?.googleBusinessUrl || (masterData.socialMedia as any)?.mapsUrl ? (
                        <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.googleBusinessUrl || (masterData.socialMedia as any)?.mapsUrl || '')}>
                          <Text style={styles.openLink}>Open</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <Ionicons name="location-outline" size={16} color="#10b981" style={{ marginRight: 6 }} />
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



          {/* TAB 3: Email Templates */}
          {masterSubTab === 'email-templates' && (
            <View style={styles.masterTabPane}>
              {/* Template Selectors */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
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
                      <Ionicons name={item.icon} size={14} color={isSelected ? '#6366f1' : subTextColor} />
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
                    <Ionicons name="create-outline" size={13} color={emailViewMode === 'editor' ? '#6366f1' : subTextColor} />
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
                    <Ionicons name="eye-outline" size={13} color={emailViewMode === 'preview' ? '#6366f1' : subTextColor} />
                    <Text style={[styles.toggleSegmentText, { color: emailViewMode === 'preview' ? textColor : subTextColor }]}>
                      Live Email Preview
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {emailViewMode === 'editor' ? (
                <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                  {/* Subject Line */}
                  <View style={{ marginBottom: 8 }}>
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
                  <View style={{ marginBottom: 8 }}>
                    <Text style={[styles.inputLabel, { color: subTextColor, fontSize: 11 }]}>
                      AVAILABLE DYNAMIC TOKENS (CLICK TO APPEND TO SUBJECT):
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
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
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 110 }]}>
                    <TextInput
                      style={[styles.input, { color: textColor, height: 100, textAlignVertical: 'top', paddingTop: 6 }]}
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
                    <Text style={{ fontSize: 11.5, color: subTextColor }}>
                      From: {masterData.smtp?.fromName || 'FarmsKing'} &lt;{masterData.smtp?.fromEmail || 'noreply@farmsking.in'}&gt;
                    </Text>
                  </View>

                  <View style={[styles.previewEmailCard, { backgroundColor: isLight ? '#ffffff' : '#0f172a', borderColor: cardBorder }]}>
                    <View style={styles.previewEmailBrandHeader}>
                      <Text style={{ fontSize: 16, fontFamily: FONT.bold, color: '#16a34a' }}>
                        {masterData.brandName || 'FarmsKing™'}
                      </Text>
                      <Text style={{ fontSize: 10.5, color: subTextColor }}>Official Notification</Text>
                    </View>

                    <View style={{ marginVertical: 8 }}>
                      <Text style={{ fontSize: 13, color: textColor, lineHeight: 20 }}>
                        {masterData.emailTemplates?.[activeEmailTmpl]?.body
                          ?.replace(/<[^>]+>/g, ' ')
                          ?.replace(/\s+/g, ' ')
                          ?.trim() || 'No email body preview available.'}
                      </Text>
                    </View>

                    <View style={[styles.previewEmailFooter, { borderTopColor: cardBorder }]}>
                      <Text style={{ fontSize: 10.5, color: subTextColor }}>
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

          {/* TAB 4: Maintenance Mode */}
          {masterSubTab === 'maintenance' && (
            <View style={styles.masterTabPane}>
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
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

                <View style={{ marginBottom: 8 }}>
                  <Text style={[styles.inputLabel, { color: subTextColor, fontSize: 11 }]}>
                    QUICK NOTICE PRESETS:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                    {[
                      'Scheduled agritech platform upgrades in progress. We will be back shortly.',
                      'Database migration & security patch in progress. Normal operations resume at 06:00 AM IST.',
                      'Emergency server maintenance. Our engineering team is restoring services.',
                    ].map((presetMsg, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={[styles.presetCard, { borderColor: cardBorder, backgroundColor: innerBg, paddingVertical: 6, paddingHorizontal: 10 }]}
                        onPress={() => handleUpdateMasterNested('maintenance', 'message', presetMsg)}
                      >
                        <Text style={{ fontSize: 11.5, color: textColor }} numberOfLines={1}>
                          Preset {idx + 1}: {presetMsg.slice(0, 36)}...
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Displayed Public Notice</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 44 }]}>
                    <TextInput
                      style={[styles.input, { color: textColor, height: 36 }]}
                      value={masterData.maintenance?.message || ''}
                      onChangeText={(txt) => handleUpdateMasterNested('maintenance', 'message', txt)}
                      placeholder="Public maintenance notice shown on web and mobile..."
                      placeholderTextColor={subTextColor}
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

          {/* TAB 5: Tax / GST Settings */}
          {masterSubTab === 'tax-gst' && (
            <View style={styles.masterTabPane}>
              {/* Group: Statutory GST Identifiers */}
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={styles.groupHeader}>
                  <Text style={[styles.groupTitle, { color: textColor }]}>Goods & Services Tax (GST) Identification</Text>
                  <View style={[styles.pillBadge, { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>GST Act Compliance</Text>
                  </View>
                </View>

                <View style={styles.fourCol}>
                  <View style={styles.col4}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Company GSTIN</Text>
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

                  <View style={styles.col4}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Default Rate (%)</Text>
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

                  <View style={styles.col4}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Invoice Prefix</Text>
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

                  <View style={styles.col4}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>HSN / SAC Code</Text>
                    <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                      <TextInput
                        style={[styles.input, { color: textColor }]}
                        value={masterData.taxGst?.hsnSacCode || '998314'}
                        onChangeText={(txt) => handleUpdateMasterNested('taxGst', 'hsnSacCode', txt)}
                        placeholder="998314"
                        placeholderTextColor={subTextColor}
                      />
                    </View>
                  </View>
                </View>

                {/* Quick Tax Rate Selectors */}
                <View style={{ marginTop: 4, marginBottom: 8 }}>
                  <Text style={[styles.inputLabel, { color: subTextColor, fontSize: 11 }]}>
                    STANDARD GST SLABS:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
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
                          <Text style={{ fontSize: 11.5, color: isCurrent ? '#10b981' : textColor, fontFamily: FONT.semiBold }}>
                            {rate}% GST
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Statutory Agricultural Exemption Notice */}
              <View style={[styles.exemptionNotice, { borderColor: cardBorder, backgroundColor: innerBg }]}>
                <Ionicons name="information-circle-outline" size={17} color="#10b981" />
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

          {/* TAB 7: Other System Settings */}
          {masterSubTab === 'other' && (
            <View style={styles.masterTabPane}>
              <SettingOtherSetup />
            </View>
          )}
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
  dropdownContainer: {
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 10,
  },
  dropdownHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  dropdownIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dropdownTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dropdownModuleLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  dropdownCountBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  dropdownCountText: {
    fontSize: 9,
    fontWeight: '700',
  },
  dropdownTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  dropdownSubtitle: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  dropdownChevronBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  dropdownChevronText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  dropdownList: {
    borderTopWidth: 1,
    padding: 6,
    gap: 3,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 6,
  },
  dropdownItemActiveLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  dropdownItemActiveDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  dropdownItemTitle: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  dropdownItemDesc: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  activeCheckBadge: {
    marginLeft: 6,
  },
  tabIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  masterContentPane: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  masterTabPane: {
    width: '100%',
  },
  subPaneHeader: {
    marginBottom: 8,
  },
  paneTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  paneIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subPaneTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  subPaneSubtitle: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  groupSection: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  pillBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  threeCol: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  fourCol: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  col: {
    flex: 1,
    minWidth: 220,
  },
  col3: {
    flex: 1,
    minWidth: 200,
  },
  col4: {
    flex: 1,
    minWidth: 160,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
    marginBottom: 2,
  },
  copyLink: {
    fontSize: 10.5,
    color: '#6366f1',
    fontFamily: FONT.medium,
  },
  openLink: {
    fontSize: 10.5,
    color: '#10b981',
    fontFamily: FONT.medium,
  },
  inputBox: {
    borderWidth: 1,
    borderRadius: 7,
    paddingHorizontal: 10,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontFamily: FONT.regular,
    fontSize: 12.5,
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
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  previewMetaHeader: {
    marginBottom: 8,
    gap: 2,
  },
  previewMetaSubject: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  previewEmailCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  previewEmailBrandHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.2)',
    paddingBottom: 6,
  },
  previewEmailFooter: {
    borderTopWidth: 1,
    paddingTop: 6,
    marginTop: 6,
  },
  maintenanceStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
    gap: 8,
  },
  maintenanceStatusTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  maintenanceStatusDesc: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  ratePill: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  exemptionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  exemptionTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    marginBottom: 1,
  },
  exemptionDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
    lineHeight: 15,
  },
  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  outlineActionText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  paneFooterRight: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  paneFooterBetween: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveActionBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  saveActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  saveActionText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
});
