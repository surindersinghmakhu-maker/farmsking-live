import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
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
import * as ImagePicker from 'expo-image-picker';
import { uploadPhoto, UploadResponse } from '@/src/api/uploads.api';
import { apiClient, resolveMediaUrl } from '@/src/api/client';
import { updateWebFavicon } from '@/src/hooks/useAppSettings';
import { BrandLogo } from '@/src/components/BrandLogo';

export type MasterDataSubTab =
  | 'basic-details'
  | 'brand-assets'
  | 'social'
  | 'email-templates'
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
    label: 'Company Profile',
    icon: 'business-outline',
    description: 'Legal identity, capital & leadership',
  },
  {
    key: 'brand-assets',
    label: 'Brand Assets',
    icon: 'images-outline',
    description: 'Official logo & browser favicon',
  },
  {
    key: 'social',
    label: 'Social & App',
    icon: 'share-social-outline',
    description: 'Channels, maps & APK download',
  },
  {
    key: 'email-templates',
    label: 'Email Templates',
    icon: 'mail-outline',
    description: 'OTP & account notifications',
  },
  {
    key: 'tax-gst',
    label: 'Tax & GST',
    icon: 'receipt-outline',
    description: 'GSTIN, slabs & invoicing rules',
  },
];

export const EMAIL_TEMPLATE_ITEMS: { key: EmailTemplateKey; label: string; icon: keyof typeof Ionicons.glyphMap; vars: string[] }[] = [
  {
    key: 'registration',
    label: 'Registration',
    icon: 'person-add-outline',
    vars: ['{{farmer_name}}', '{{company_name}}', '{{support_email}}', '{{support_phone}}'],
  },
  {
    key: 'otp',
    label: 'OTP Verify',
    icon: 'key-outline',
    vars: ['{{otp_code}}', '{{expiry_minutes}}', '{{company_name}}'],
  },
  {
    key: 'feeReceipt',
    label: 'Fee Receipt',
    icon: 'receipt-outline',
    vars: ['{{farmer_name}}', '{{amount}}', '{{invoice_no}}'],
  },
  {
    key: 'resultPublished',
    label: 'Lab Result',
    icon: 'flask-outline',
    vars: ['{{farmer_name}}', '{{crop_name}}', '{{diagnosis}}'],
  },
  {
    key: 'certificateIssued',
    label: 'Certificate',
    icon: 'ribbon-outline',
    vars: ['{{farmer_name}}', '{{certificate_id}}', '{{portal_url}}'],
  },
];

export default function SettingEntitySetup() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 860));
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  const { data: remoteConfig } = useSystemIntegrations();
  const updateMutation = useUpdateSystemIntegrations();

  const [localConfig, setLocalConfig] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(remoteConfig)
  );

  const [masterSubTab, setMasterSubTab] = useState<MasterDataSubTab>('basic-details');
  const [activeEmailTmpl, setActiveEmailTmpl] = useState<EmailTemplateKey>('registration');
  const [emailViewMode, setEmailViewMode] = useState<'editor' | 'preview'>('editor');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isSavingFavicon, setIsSavingFavicon] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [favImageError, setFavImageError] = useState(false);

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

  // Resolve favicon URL cleanly
  const resolvedFaviconUri = useMemo(() => {
    const raw = masterData.faviconUrl || '/favicon.png';
    const resolved = resolveMediaUrl(raw) || raw;
    return resolved;
  }, [masterData.faviconUrl]);

  // Resolve logo URL cleanly
  const resolvedLogoUri = useMemo(() => {
    const raw = masterData.logoUrl || 'https://farmsking.in/brand_logo.png';
    const resolved = resolveMediaUrl(raw) || raw;
    return resolved;
  }, [masterData.logoUrl]);

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
    section: 'themeColors' | 'socialMedia' | 'smtp' | 'emailTemplates' | 'maintenance' | 'taxGst' | 'promotersAndCapital',
    field: string,
    value: any
  ) => {
    setLocalConfig((prev) => {
      const currentMaster = prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      const currentSection = (currentMaster as any)[section] || (DEFAULT_PROJECT_MASTER_DATA as any)[section] || {};
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

  const handleUpdateAboutField = (field: string, value: any) => {
    setLocalConfig((prev) => ({
      ...prev,
      about: {
        ...(prev.about || {}),
        [field]: value,
      },
    }));
  };

  const handlePickAndUploadLogo = async () => {
    try {
      setIsUploadingLogo(true);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            setIsUploadingLogo(false);
            return;
          }
          try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await apiClient.post<UploadResponse>('/uploads', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            const resolved = resolveMediaUrl(data.fileUrl) || data.fileUrl;
            handleUpdateMasterField('logoUrl', resolved);
            handleUpdateAboutField('logoUrl', resolved);

            // Auto-save logo immediately
            await updateMutation.mutateAsync({
              projectMasterData: {
                ...(localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
                logoUrl: resolved,
              },
              about: {
                ...(localConfig.about || {}),
                logoUrl: resolved,
              },
            });
            try {
              await updateAppSettings({ logoUrl: resolved });
            } catch { }

            showToast('✅ Brand Logo uploaded and saved globally!');
          } catch (e: any) {
            Alert.alert('Upload Failed', e?.message || 'Could not upload logo');
          } finally {
            setIsUploadingLogo(false);
          }
        };
        input.oncancel = () => setIsUploadingLogo(false);
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.95,
        });
        if (result.canceled || !result.assets || !result.assets[0]) {
          setIsUploadingLogo(false);
          return;
        }
        const uploaded = await uploadPhoto(result.assets[0].uri);
        const resolved = resolveMediaUrl(uploaded.fileUrl) || uploaded.fileUrl;
        handleUpdateMasterField('logoUrl', resolved);
        handleUpdateAboutField('logoUrl', resolved);

        await updateMutation.mutateAsync({
          projectMasterData: {
            ...(localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
            logoUrl: resolved,
          },
          about: {
            ...(localConfig.about || {}),
            logoUrl: resolved,
          },
        });
        try {
          await updateAppSettings({ logoUrl: resolved });
        } catch { }

        showToast('✅ Brand Logo uploaded and saved globally!');
        setIsUploadingLogo(false);
      }
    } catch (err: any) {
      setIsUploadingLogo(false);
      Alert.alert('Upload Failed', err?.message || 'Could not open file picker');
    }
  };

  const handlePickAndUploadFavicon = async () => {
    try {
      setIsUploadingFavicon(true);
      setFavImageError(false);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml,image/webp,.ico,.png,.svg,.webp';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (!file) {
            setIsUploadingFavicon(false);
            return;
          }
          try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await apiClient.post<UploadResponse>('/uploads', formData, {
              headers: { 'Content-Type': 'multipart/form-data' },
            });
            const resolved = resolveMediaUrl(data.fileUrl) || data.fileUrl;
            handleUpdateMasterField('faviconUrl', resolved);
            handleUpdateAboutField('faviconUrl', resolved);

            // Auto-save favicon immediately to both backend tables
            await updateMutation.mutateAsync({
              projectMasterData: {
                ...(localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
                faviconUrl: resolved,
              },
              about: {
                ...(localConfig.about || {}),
                faviconUrl: resolved,
              },
            });
            try {
              await updateAppSettings({ faviconUrl: resolved });
            } catch { }

            // Update browser document immediately
            if (Platform.OS === 'web') {
              updateWebFavicon(resolved);
            }
            showToast('✅ Website Favicon uploaded & saved globally!');
          } catch (e: any) {
            Alert.alert('Upload Failed', e?.message || 'Could not upload favicon');
          } finally {
            setIsUploadingFavicon(false);
          }
        };
        input.oncancel = () => setIsUploadingFavicon(false);
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.95,
        });
        if (result.canceled || !result.assets || !result.assets[0]) {
          setIsUploadingFavicon(false);
          return;
        }
        const uploaded = await uploadPhoto(result.assets[0].uri);
        const resolved = resolveMediaUrl(uploaded.fileUrl) || uploaded.fileUrl;
        handleUpdateMasterField('faviconUrl', resolved);
        handleUpdateAboutField('faviconUrl', resolved);

        await updateMutation.mutateAsync({
          projectMasterData: {
            ...(localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
            faviconUrl: resolved,
          },
          about: {
            ...(localConfig.about || {}),
            faviconUrl: resolved,
          },
        });
        try {
          await updateAppSettings({ faviconUrl: resolved });
        } catch { }

        if (Platform.OS === 'web') {
          updateWebFavicon(resolved);
        }
        showToast('✅ Website Favicon uploaded & saved globally!');
        setIsUploadingFavicon(false);
      }
    } catch (err: any) {
      setIsUploadingFavicon(false);
      Alert.alert('Upload Failed', err?.message || 'Could not open file picker');
    }
  };

  const handleSaveFaviconOnly = async () => {
    try {
      setIsSavingFavicon(true);
      const favUrl = masterData.faviconUrl || '/favicon.png';
      const resolved = resolveMediaUrl(favUrl) || favUrl;

      // 1. Update projectMasterData in system integrations
      await updateMutation.mutateAsync({
        projectMasterData: {
          ...(localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
          faviconUrl: resolved,
        },
        about: {
          ...(localConfig.about || {}),
          faviconUrl: resolved,
        },
      });

      // 2. Update appSettings table
      try {
        await updateAppSettings({ faviconUrl: resolved });
      } catch { }

      // 3. Immediately apply to browser document tab
      if (Platform.OS === 'web') {
        updateWebFavicon(resolved);
      }

      showToast('✅ Website Favicon saved & applied to browser tab!');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save favicon');
    } finally {
      setIsSavingFavicon(false);
    }
  };

  const handleResetFavicon = async () => {
    const defaultUrl = '/favicon.png';
    handleUpdateMasterField('faviconUrl', defaultUrl);
    handleUpdateAboutField('faviconUrl', defaultUrl);
    setFavImageError(false);
    try {
      await updateMutation.mutateAsync({
        projectMasterData: {
          ...(localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
          faviconUrl: defaultUrl,
        },
        about: {
          ...(localConfig.about || {}),
          faviconUrl: defaultUrl,
        },
      });
      await updateAppSettings({ faviconUrl: defaultUrl });
      if (Platform.OS === 'web') {
        updateWebFavicon(defaultUrl);
      }
      showToast('✅ Favicon reset to official default emblem!');
    } catch (err: any) {
      showToast('Reset applied in local form.');
    }
  };

  const handleSaveMasterData = async () => {
    try {
      const pmd = localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      await updateMutation.mutateAsync({
        projectMasterData: pmd,
        about: {
          ...(localConfig.about || {}),
          logoUrl: pmd.logoUrl,
          faviconUrl: pmd.faviconUrl,
        },
      });
      if (pmd.logoUrl || pmd.faviconUrl || pmd.appDownloadUrl !== undefined || pmd.latestAppVersion !== undefined) {
        try {
          await updateAppSettings({
            ...(pmd.logoUrl ? { logoUrl: pmd.logoUrl } : {}),
            ...(pmd.faviconUrl ? { faviconUrl: pmd.faviconUrl } : {}),
            ...(pmd.appDownloadUrl !== undefined ? { appDownloadUrl: pmd.appDownloadUrl || '' } : {}),
            ...(pmd.latestAppVersion !== undefined ? { latestAppVersion: pmd.latestAppVersion || '2.1.0' } : {}),
          });
          if (Platform.OS === 'web' && pmd.faviconUrl) {
            updateWebFavicon(pmd.faviconUrl);
          }
        } catch { }
      }
      showToast('✅ Settings saved successfully across the system!');
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
      showToast('💾 Setting JSON copied to clipboard!');
    } else {
      showToast('💾 Settings exported!');
    }
  };

  return (
    <View style={styles.masterContainer}>
      {/* Toast Alert */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: isLight ? '#f0fdf4' : '#062814', borderColor: isLight ? '#bbf7d0' : '#10b981' }]}>
          <Ionicons name="checkmark-circle" size={17} color="#10b981" />
          <Text style={[styles.toastText, { color: textColor }]}>{toastMessage}</Text>
        </View>
      )}

      {/* Modern Horizontal Executive Tab Pills & Quick Actions */}
      <View style={[styles.tabBarCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabScrollContent}
        >
          {MASTER_DATA_TABS.map((tab) => {
            const isSelected = masterSubTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.modulePill,
                  { borderColor: isSelected ? '#6366f1' : cardBorder },
                  isSelected && (isLight ? styles.modulePillActiveLight : styles.modulePillActiveDark),
                ]}
                onPress={() => setMasterSubTab(tab.key)}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={tab.icon}
                  size={16}
                  color={isSelected ? (isLight ? '#4f46e5' : '#818cf8') : subTextColor}
                />
                <Text
                  style={[
                    styles.modulePillText,
                    {
                      color: isSelected ? (isLight ? '#4f46e5' : '#818cf8') : textColor,
                      fontFamily: isSelected ? FONT.bold : FONT.medium,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
                {isSelected && (
                  <View style={styles.moduleActiveDot} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.tabBarActions}>
          <TouchableOpacity
            style={[styles.outlineActionBtn, { borderColor: cardBorder, backgroundColor: innerBg }]}
            onPress={handleExportMasterDataJson}
            activeOpacity={0.75}
          >
            <Ionicons name="copy-outline" size={13} color={subTextColor} />
            <Text style={[styles.outlineActionText, { color: textColor }]}>Copy JSON</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.topSaveBtn, updateMutation.isPending && { opacity: 0.7 }]}
            onPress={handleSaveMasterData}
            disabled={updateMutation.isPending}
            activeOpacity={0.8}
          >
            <LinearGradient colors={['#6366f1', '#4f46e5']} style={styles.topSaveGradient}>
              {updateMutation.isPending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Ionicons name="checkmark-done" size={15} color="#ffffff" />
              )}
              <Text style={styles.topSaveText}>
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Full-Width Content Pane */}
      <View style={[styles.masterContentPane, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        {/* TAB 1: Company Profile & Legal */}
        {masterSubTab === 'basic-details' && (
          <View style={styles.masterTabPane}>
            {/* Group 1: Company Profile */}
            <View style={[styles.groupSection, { borderColor: cardBorder }]}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="business-outline" size={16} color="#6366f1" />
                  <Text style={[styles.groupTitle, { color: textColor }]}>Company Profile</Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                  <Text style={[styles.pillBadgeText, { color: subTextColor }]}>Core Identity</Text>
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Legal Entity Name</Text>
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
                  <Text style={[styles.inputLabel, { color: textColor }]}>Brand Name</Text>
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
                    <Text style={[styles.inputLabel, { color: textColor }]}>Registered Office</Text>
                    <TouchableOpacity onPress={() => handleCopyValue('Registered Address', masterData.registeredOfficeAddress || (masterData as any).registeredAddress || '')}>
                      <Text style={styles.copyLink}>Copy</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.registeredOfficeAddress || (masterData as any).registeredAddress || ''}
                      onChangeText={(txt) => {
                        handleUpdateMasterField('registeredOfficeAddress', txt);
                        handleUpdateMasterField('registeredAddress' as any, txt);
                      }}
                      placeholder="VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422, India"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.col}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Brand Tagline</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.tagline}
                      onChangeText={(txt) => handleUpdateMasterField('tagline', txt)}
                      placeholder="Farming Easy, Farming Smart | National Smart Farming Platform"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Group 2: Capital & Leadership */}
            <View style={[styles.groupSection, { borderColor: cardBorder }]}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="people-outline" size={16} color="#0284c7" />
                  <Text style={[styles.groupTitle, { color: textColor }]}>Capital & Leadership</Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.22)' }]}>
                  <Text style={[styles.pillBadgeText, { color: '#0284c7' }]}>MoA Registered</Text>
                </View>
              </View>

              <View style={styles.fourCol}>
                <View style={styles.col4}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Authorized Capital (₹)</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      keyboardType="numeric"
                      value={String(masterData.promotersAndCapital?.authorizedEquityCapitalInr ?? 100000)}
                      onChangeText={(txt) => handleUpdateMasterNested('promotersAndCapital', 'authorizedEquityCapitalInr', parseFloat(txt) || 0)}
                      placeholder="100000"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.col4}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Total Shares</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      keyboardType="numeric"
                      value={String(masterData.promotersAndCapital?.authorizedSharesCount ?? 100000)}
                      onChangeText={(txt) => handleUpdateMasterNested('promotersAndCapital', 'authorizedSharesCount', parseInt(txt, 10) || 0)}
                      placeholder="100000"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.col4}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Face Value (₹)</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      keyboardType="numeric"
                      value={String(masterData.promotersAndCapital?.faceValuePerShareInr ?? 1)}
                      onChangeText={(txt) => handleUpdateMasterNested('promotersAndCapital', 'faceValuePerShareInr', parseFloat(txt) || 0)}
                      placeholder="1"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.col4}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Paid-Up Capital (₹)</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      keyboardType="numeric"
                      value={String(masterData.promotersAndCapital?.paidUpCapitalInr ?? 100000)}
                      onChangeText={(txt) => handleUpdateMasterNested('promotersAndCapital', 'paidUpCapitalInr', parseFloat(txt) || 0)}
                      placeholder="100000"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>
              </View>

              <View style={[styles.twoCol, { marginTop: 8 }]}>
                <View style={styles.col}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Directors</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.promotersAndCapital?.firstDirectors || 'Bakhshish Singh, Gagandeep Kaur'}
                      onChangeText={(txt) => handleUpdateMasterNested('promotersAndCapital', 'firstDirectors', txt)}
                      placeholder="Bakhshish Singh, Gagandeep Kaur"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.col}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Founder & AI Lead</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.promotersAndCapital?.founderAndChiefAiArchitect || 'Surinder Singh'}
                      onChangeText={(txt) => handleUpdateMasterNested('promotersAndCapital', 'founderAndChiefAiArchitect', txt)}
                      placeholder="Surinder Singh"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.twoCol}>
                <View style={styles.col}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>General Manager</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.promotersAndCapital?.generalManager || 'Gurnam Singh'}
                      onChangeText={(txt) => handleUpdateMasterNested('promotersAndCapital', 'generalManager', txt)}
                      placeholder="Gurnam Singh"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.col}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Lead Agronomists</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.promotersAndCapital?.leadAgronomists || 'Sudhir Kumar Mahato, Manjeet Sra'}
                      onChangeText={(txt) => handleUpdateMasterNested('promotersAndCapital', 'leadAgronomists', txt)}
                      placeholder="Sudhir Kumar Mahato, Manjeet Sra"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>
              </View>
            </View>

            {/* Group 3: MCA Registrations */}
            <View style={[styles.groupSection, { borderColor: cardBorder }]}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="shield-checkmark-outline" size={16} color="#10b981" />
                  <Text style={[styles.groupTitle, { color: textColor }]}>MCA Registrations</Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.22)' }]}>
                  <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>Govt. of India</Text>
                </View>
              </View>

              <View style={styles.fourCol}>
                <View style={styles.col4}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>MCA SRN</Text>
                    <TouchableOpacity onPress={() => handleCopyValue('MCA SRN', masterData.mcaSrn)}>
                      <Text style={styles.copyLink}>Copy</Text>
                    </TouchableOpacity>
                  </View>
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
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>CIN</Text>
                    <TouchableOpacity onPress={() => handleCopyValue('CIN', masterData.cinNumber || (masterData as any).cin || '')}>
                      <Text style={styles.copyLink}>Copy</Text>
                    </TouchableOpacity>
                  </View>
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
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>PAN</Text>
                    <TouchableOpacity onPress={() => handleCopyValue('PAN', masterData.companyPan || (masterData as any).panNumber || '')}>
                      <Text style={styles.copyLink}>Copy</Text>
                    </TouchableOpacity>
                  </View>
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
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>TAN</Text>
                    <TouchableOpacity onPress={() => handleCopyValue('TAN', masterData.companyTan || '')}>
                      <Text style={styles.copyLink}>Copy</Text>
                    </TouchableOpacity>
                  </View>
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

            {/* Group 4: Support & Office */}
            <View style={[styles.groupSection, { borderColor: cardBorder }]}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="call-outline" size={16} color="#f59e0b" />
                  <Text style={[styles.groupTitle, { color: textColor }]}>Support & Office</Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: isLight ? '#f1f5f9' : '#1e293b' }]}>
                  <Text style={[styles.pillBadgeText, { color: subTextColor }]}>Public Contact</Text>
                </View>
              </View>

              <View style={styles.threeCol}>
                <View style={styles.col3}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Support Phone</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="call-outline" size={14} color={subTextColor} style={{ marginRight: 6 }} />
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
                  <Text style={[styles.inputLabel, { color: textColor }]}>Support Email</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="mail-outline" size={14} color={subTextColor} style={{ marginRight: 6 }} />
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
                  <Text style={[styles.inputLabel, { color: textColor }]}>Operational HQ</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="location-outline" size={14} color={subTextColor} style={{ marginRight: 6 }} />
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
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                  )}
                  <Text style={styles.saveActionText}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Profile'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 2: Brand Assets (Brand Logo & Website Favicon) */}
        {masterSubTab === 'brand-assets' && (
          <View style={styles.masterTabPane}>
            <View style={[styles.groupSection, { borderColor: cardBorder }]}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="images-outline" size={16} color="#10b981" />
                  <Text style={[styles.groupTitle, { color: textColor }]}>Official Brand Assets</Text>
                </View>
                <View style={[styles.pillBadge, { backgroundColor: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.22)' }]}>
                  <Text style={[styles.pillBadgeText, { color: '#10b981' }]}>System-Wide Live</Text>
                </View>
              </View>

              <View style={styles.twoCol}>
                {/* 1. Official Brand Logo Card */}
                <View style={[styles.col, { backgroundColor: innerBg, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="image-outline" size={16} color="#10b981" />
                      <Text style={[styles.inputLabel, { color: textColor, fontWeight: '700', marginBottom: 0 }]}>
                        Brand Logo
                      </Text>
                    </View>
                    {masterData.logoUrl && masterData.logoUrl !== 'https://farmsking.in/brand_logo.png' ? (
                      <TouchableOpacity
                        onPress={() => {
                          handleUpdateMasterField('logoUrl', 'https://farmsking.in/brand_logo.png');
                          handleUpdateAboutField('logoUrl', 'https://farmsking.in/brand_logo.png');
                          updateAppSettings({ logoUrl: 'https://farmsking.in/brand_logo.png' }).catch(() => { });
                          showToast('Reset logo to default official emblem');
                        }}
                      >
                        <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600' }}>Reset Default</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Logo Live Preview Frame */}
                  <View style={{
                    height: 110,
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.35)',
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)',
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    padding: 8,
                    position: 'relative',
                  }}>
                    {masterData.logoUrl && !masterData.logoUrl.includes('farmsking.in/assets/logo.png') && masterData.logoUrl !== 'https://farmsking.in/brand_logo.png' ? (
                      <Image
                        source={{ uri: resolvedLogoUri }}
                        style={{ width: '85%', height: 90 }}
                        resizeMode="contain"
                      />
                    ) : (
                      <BrandLogo size={78} useHdQuality={true} />
                    )}
                    <View style={{ position: 'absolute', bottom: 5, right: 6, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                      <Text style={{ fontSize: 8.5, color: '#ffffff', fontWeight: '700' }}>HEADER LOGO PREVIEW</Text>
                    </View>
                  </View>

                  {/* Logo Action Buttons */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: '#10b981',
                        paddingVertical: 8,
                        borderRadius: 7,
                      }}
                      onPress={handlePickAndUploadLogo}
                      disabled={isUploadingLogo}
                      activeOpacity={0.85}
                    >
                      {isUploadingLogo ? (
                        <ActivityIndicator size="small" color="#022c22" />
                      ) : (
                        <Ionicons name="cloud-upload-outline" size={15} color="#022c22" />
                      )}
                      <Text style={{ color: '#022c22', fontSize: 12, fontWeight: '700' }}>
                        {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 7,
                        borderWidth: 1,
                        borderColor: cardBorder,
                      }}
                      onPress={async () => {
                        setIsSavingLogo(true);
                        try {
                          await updateMutation.mutateAsync({
                            projectMasterData: {
                              ...(localConfig.projectMasterData || DEFAULT_PROJECT_MASTER_DATA),
                              logoUrl: masterData.logoUrl,
                            },
                            about: {
                              ...(localConfig.about || {}),
                              logoUrl: masterData.logoUrl,
                            },
                          });
                          await updateAppSettings({ logoUrl: masterData.logoUrl || '' });
                          showToast('✅ Brand Logo saved globally!');
                        } catch (err: any) {
                          Alert.alert('Save Failed', err?.message || 'Could not save logo');
                        } finally {
                          setIsSavingLogo(false);
                        }
                      }}
                      disabled={isSavingLogo}
                      activeOpacity={0.8}
                    >
                      {isSavingLogo ? (
                        <ActivityIndicator size="small" color="#10b981" />
                      ) : (
                        <Ionicons name="checkmark-done" size={15} color="#10b981" />
                      )}
                      <Text style={{ color: textColor, fontSize: 12, fontWeight: '700' }}>
                        {isSavingLogo ? 'Saving...' : 'Save Logo'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={[styles.inputBox, { backgroundColor: cardBg, borderColor: cardBorder, height: 34 }]}>
                    <Ionicons name="link-outline" size={13} color={subTextColor} style={{ marginRight: 6 }} />
                    <TextInput
                      style={[styles.input, { color: textColor, fontSize: 11 }]}
                      value={masterData.logoUrl || ''}
                      onChangeText={(txt) => {
                        handleUpdateMasterField('logoUrl', txt);
                        handleUpdateAboutField('logoUrl', txt);
                      }}
                      placeholder="https://farmsking.in/brand_logo.png"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                {/* 2. Official Website Favicon Card */}
                <View style={[styles.col, { backgroundColor: innerBg, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: cardBorder }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="globe-outline" size={16} color="#10b981" />
                      <Text style={[styles.inputLabel, { color: textColor, fontWeight: '700', marginBottom: 0 }]}>
                        Website Favicon
                      </Text>
                    </View>
                    {masterData.faviconUrl && masterData.faviconUrl !== '/favicon.png' && masterData.faviconUrl !== 'https://farmsking.in/favicon.ico' ? (
                      <TouchableOpacity
                        onPress={handleResetFavicon}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '600' }}>Reset Default</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {/* Favicon Live Preview Frame - matches Brand Logo Card */}
                  <View style={{
                    height: 110,
                    backgroundColor: isLight ? '#ffffff' : 'rgba(0, 0, 0, 0.35)',
                    borderRadius: 8,
                    borderWidth: 1.5,
                    borderColor: isLight ? '#e2e8f0' : 'rgba(255, 255, 255, 0.12)',
                    borderStyle: 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                    padding: 8,
                    position: 'relative',
                  }}>
                    {favImageError ? (
                      <BrandLogo size={52} useHdQuality={true} />
                    ) : (
                      <Image
                        source={{ uri: resolvedFaviconUri }}
                        style={{ width: 56, height: 56, borderRadius: 8 }}
                        resizeMode="contain"
                        onError={() => setFavImageError(true)}
                      />
                    )}
                    <View style={{ position: 'absolute', bottom: 5, right: 6, backgroundColor: 'rgba(0,0,0,0.65)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
                      <Text style={{ fontSize: 8.5, color: '#ffffff', fontWeight: '700' }}>BROWSER TAB FAVICON PREVIEW</Text>
                    </View>
                  </View>

                  {/* Favicon Action Buttons - matches Brand Logo Card */}
                  <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                    <TouchableOpacity
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        backgroundColor: '#10b981',
                        paddingVertical: 8,
                        borderRadius: 7,
                      }}
                      onPress={handlePickAndUploadFavicon}
                      disabled={isUploadingFavicon}
                      activeOpacity={0.85}
                    >
                      {isUploadingFavicon ? (
                        <ActivityIndicator size="small" color="#022c22" />
                      ) : (
                        <Ionicons name="cloud-upload-outline" size={15} color="#022c22" />
                      )}
                      <Text style={{ color: '#022c22', fontSize: 12, fontWeight: '700' }}>
                        {isUploadingFavicon ? 'Uploading...' : 'Upload Favicon'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                        backgroundColor: isLight ? '#f1f5f9' : '#1e293b',
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        borderRadius: 7,
                        borderWidth: 1,
                        borderColor: cardBorder,
                      }}
                      onPress={handleSaveFaviconOnly}
                      disabled={isSavingFavicon}
                      activeOpacity={0.8}
                    >
                      {isSavingFavicon ? (
                        <ActivityIndicator size="small" color="#10b981" />
                      ) : (
                        <Ionicons name="checkmark-done" size={15} color="#10b981" />
                      )}
                      <Text style={{ color: textColor, fontSize: 12, fontWeight: '700' }}>
                        {isSavingFavicon ? 'Saving...' : 'Save Favicon'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Direct URL Input - matches Brand Logo Card */}
                  <View style={[styles.inputBox, { backgroundColor: cardBg, borderColor: cardBorder, height: 34 }]}>
                    <Ionicons name="link-outline" size={13} color={subTextColor} style={{ marginRight: 6 }} />
                    <TextInput
                      style={[styles.input, { color: textColor, fontSize: 11 }]}
                      value={masterData.faviconUrl || ''}
                      onChangeText={(txt) => {
                        handleUpdateMasterField('faviconUrl', txt);
                        handleUpdateAboutField('faviconUrl', txt);
                        setFavImageError(false);
                      }}
                      placeholder="https://farmsking.in/favicon.png"
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
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                  )}
                  <Text style={styles.saveActionText}>
                    {updateMutation.isPending ? 'Saving...' : 'Save All Brand Assets'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 3: Social & App */}
        {masterSubTab === 'social' && (
          <View style={styles.masterTabPane}>
            <View style={[styles.groupSection, { borderColor: cardBorder }]}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="share-social-outline" size={16} color="#6366f1" />
                  <Text style={[styles.groupTitle, { color: textColor }]}>Social Channels & Maps</Text>
                </View>
              </View>

              <View style={styles.threeCol}>
                <View style={styles.col3}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Facebook</Text>
                    {masterData.socialMedia?.facebook || masterData.socialMedia?.facebookUrl ? (
                      <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.facebook || masterData.socialMedia?.facebookUrl || '')}>
                        <Text style={styles.openLink}>Open</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="logo-facebook" size={15} color="#1877f2" style={{ marginRight: 6 }} />
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
                    <Text style={[styles.inputLabel, { color: textColor }]}>Instagram</Text>
                    {masterData.socialMedia?.instagram || masterData.socialMedia?.instagramUrl ? (
                      <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.instagram || masterData.socialMedia?.instagramUrl || '')}>
                        <Text style={styles.openLink}>Open</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="logo-instagram" size={15} color="#e1306c" style={{ marginRight: 6 }} />
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
                    <Text style={[styles.inputLabel, { color: textColor }]}>YouTube</Text>
                    {masterData.socialMedia?.youtube || masterData.socialMedia?.youtubeUrl ? (
                      <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.youtube || masterData.socialMedia?.youtubeUrl || '')}>
                        <Text style={styles.openLink}>Open</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="logo-youtube" size={15} color="#ff0000" style={{ marginRight: 6 }} />
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
                    <Ionicons name="logo-twitter" size={15} color="#0284c7" style={{ marginRight: 6 }} />
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
                    <Text style={[styles.inputLabel, { color: textColor }]}>LinkedIn</Text>
                    {masterData.socialMedia?.linkedin || masterData.socialMedia?.linkedinUrl ? (
                      <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.linkedin || masterData.socialMedia?.linkedinUrl || '')}>
                        <Text style={styles.openLink}>Open</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="logo-linkedin" size={15} color="#0a66c2" style={{ marginRight: 6 }} />
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
                    <Text style={[styles.inputLabel, { color: textColor }]}>Google Maps</Text>
                    {masterData.socialMedia?.googleBusinessUrl || (masterData.socialMedia as any)?.mapsUrl ? (
                      <TouchableOpacity onPress={() => handleOpenLink(masterData.socialMedia?.googleBusinessUrl || (masterData as any)?.mapsUrl || '')}>
                        <Text style={styles.openLink}>Open</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="location-outline" size={15} color="#10b981" style={{ marginRight: 6 }} />
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.socialMedia?.googleBusinessUrl || (masterData as any)?.mapsUrl || ''}
                      onChangeText={(txt) => {
                        handleUpdateMasterNested('socialMedia', 'googleBusinessUrl', txt);
                        handleUpdateMasterNested('socialMedia', 'mapsUrl', txt);
                      }}
                      placeholder="https://maps.google.com/?q=FarmsKing"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>
              </View>

              {/* Mobile App Distribution */}
              <View style={[styles.twoCol, { marginTop: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: cardBorder }]}>
                <View style={styles.col}>
                  <View style={styles.labelRow}>
                    <Text style={[styles.inputLabel, { color: textColor }]}>Android App Link (APK / Store)</Text>
                    {masterData.appDownloadUrl ? (
                      <TouchableOpacity onPress={() => handleOpenLink(masterData.appDownloadUrl || '')}>
                        <Text style={styles.openLink}>Test Link</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="logo-android" size={16} color="#10b981" style={{ marginRight: 6 }} />
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.appDownloadUrl || ''}
                      onChangeText={(txt) => handleUpdateMasterField('appDownloadUrl', txt)}
                      placeholder="https://farmsking.in/download/farmsking.apk"
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={styles.col}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Production App Version</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <Ionicons name="git-branch-outline" size={15} color="#6366f1" style={{ marginRight: 6 }} />
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.latestAppVersion || '2.1.0'}
                      onChangeText={(txt) => handleUpdateMasterField('latestAppVersion', txt)}
                      placeholder="2.1.0"
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
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                  )}
                  <Text style={styles.saveActionText}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Social & App'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 4: Email Templates */}
        {masterSubTab === 'email-templates' && (
          <View style={styles.masterTabPane}>
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
                    activeOpacity={0.75}
                  >
                    <Ionicons name={item.icon} size={13} color={isSelected ? '#6366f1' : subTextColor} />
                    <Text style={[styles.tmplPillText, { color: isSelected ? textColor : subTextColor, fontFamily: isSelected ? FONT.bold : FONT.medium }]}>
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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
                    Editor
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
                    Preview
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {emailViewMode === 'editor' ? (
              <View style={[styles.groupSection, { borderColor: cardBorder }]}>
                <View style={{ marginBottom: 8 }}>
                  <Text style={[styles.inputLabel, { color: textColor }]}>Subject Line</Text>
                  <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                    <TextInput
                      style={[styles.input, { color: textColor }]}
                      value={masterData.emailTemplates?.[activeEmailTmpl]?.subject || ''}
                      onChangeText={(txt) => handleUpdateEmailTemplate(activeEmailTmpl, 'subject', txt)}
                      placeholder="Email subject..."
                      placeholderTextColor={subTextColor}
                    />
                  </View>
                </View>

                <View style={{ marginBottom: 8 }}>
                  <Text style={[styles.inputLabel, { color: subTextColor, fontSize: 10.5 }]}>
                    DYNAMIC TOKENS (CLICK TO APPEND TO SUBJECT):
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

                <Text style={[styles.inputLabel, { color: textColor }]}>Email Body (HTML / Text)</Text>
                <View style={[styles.inputBox, { backgroundColor: innerBg, borderColor: cardBorder, height: 110 }]}>
                  <TextInput
                    style={[styles.input, { color: textColor, height: 100, textAlignVertical: 'top', paddingTop: 6 }]}
                    value={masterData.emailTemplates?.[activeEmailTmpl]?.body || ''}
                    onChangeText={(txt) => handleUpdateEmailTemplate(activeEmailTmpl, 'body', txt)}
                    placeholder="HTML body..."
                    placeholderTextColor={subTextColor}
                    multiline
                  />
                </View>
              </View>
            ) : (
              <View style={[styles.liveEmailPreviewBox, { borderColor: cardBorder, backgroundColor: innerBg }]}>
                <View style={styles.previewMetaHeader}>
                  <Text style={[styles.previewMetaSubject, { color: textColor }]}>
                    {masterData.emailTemplates?.[activeEmailTmpl]?.subject || 'No Subject Defined'}
                  </Text>
                  <Text style={{ fontSize: 11, color: subTextColor }}>
                    From: {masterData.smtp?.fromName || 'FarmsKing'} &lt;{masterData.smtp?.fromEmail || 'noreply@farmsking.in'}&gt;
                  </Text>
                </View>

                <View style={[styles.previewEmailCard, { backgroundColor: isLight ? '#ffffff' : '#0f172a', borderColor: cardBorder }]}>
                  <View style={styles.previewEmailBrandHeader}>
                    <Text style={{ fontSize: 15, fontFamily: FONT.bold, color: '#16a34a' }}>
                      {masterData.brandName || 'FarmsKing™'}
                    </Text>
                    <Text style={{ fontSize: 10, color: subTextColor }}>Official Notification</Text>
                  </View>

                  <View style={{ marginVertical: 8 }}>
                    <Text style={{ fontSize: 12.5, color: textColor, lineHeight: 19 }}>
                      {masterData.emailTemplates?.[activeEmailTmpl]?.body
                        ?.replace(/<[^>]+>/g, ' ')
                        ?.replace(/\s+/g, ' ')
                        ?.trim() || 'No preview available.'}
                    </Text>
                  </View>

                  <View style={[styles.previewEmailFooter, { borderTopColor: cardBorder }]}>
                    <Text style={{ fontSize: 10, color: subTextColor }}>
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
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                  )}
                  <Text style={styles.saveActionText}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Templates'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* TAB 5: Tax & GST */}
        {masterSubTab === 'tax-gst' && (
          <View style={styles.masterTabPane}>
            <View style={[styles.groupSection, { borderColor: cardBorder }]}>
              <View style={styles.groupHeader}>
                <View style={styles.groupHeaderLeft}>
                  <Ionicons name="receipt-outline" size={16} color="#10b981" />
                  <Text style={[styles.groupTitle, { color: textColor }]}>GST & Invoicing</Text>
                </View>
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
                  <Text style={[styles.inputLabel, { color: textColor }]}>GST Rate (%)</Text>
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

              {/* Quick Tax Rate Slabs */}
              <View style={{ marginTop: 6, marginBottom: 8 }}>
                <Text style={[styles.inputLabel, { color: subTextColor, fontSize: 10.5 }]}>
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
                        <Text style={{ fontSize: 11, color: isCurrent ? '#10b981' : textColor, fontFamily: FONT.semiBold }}>
                          {rate}% GST
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* Exemption Notice */}
            <View style={[styles.exemptionNotice, { borderColor: cardBorder, backgroundColor: innerBg }]}>
              <Ionicons name="information-circle-outline" size={16} color="#10b981" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.exemptionTitle, { color: textColor }]}>
                  Agricultural Produce Exemption (Section 11, CGST Act)
                </Text>
                <Text style={[styles.exemptionDesc, { color: subTextColor }]}>
                  Wholesale agricultural produce transacted through APMC Mandis is exempt from GST. Software platforms and value-added agri services are billed at the configured rate above.
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
                    <Ionicons name="checkmark-done" size={15} color="#ffffff" />
                  )}
                  <Text style={styles.saveActionText}>
                    {updateMutation.isPending ? 'Saving...' : 'Save Tax Rules'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Statutory Running Footer Banner */}
      <View style={[styles.statutoryFooterBanner, { backgroundColor: isLight ? '#f8fafc' : '#030d07', borderColor: cardBorder }]}>
        <View style={styles.statutoryFooterLeft}>
          <View style={[styles.statutoryShieldBox, { backgroundColor: isLight ? '#e0f2fe' : 'rgba(2, 132, 199, 0.15)' }]}>
            <Ionicons name="shield-checkmark" size={17} color="#0284c7" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.statutoryCopyrightTitle, { color: textColor }]}>
              © 2026 FARMSKING TECHNOLOGIES PRIVATE LIMITED. All rights reserved.
            </Text>
            <Text style={[styles.statutoryCopyrightSub, { color: subTextColor }]}>
              MCA Incorporated under Companies Act, 2013 • CIN: U01100PB2026PTC063294 • Regd Office: VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab - 143422
            </Text>
          </View>
        </View>
        <View style={[styles.statutoryLawBadge, { backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.15)', borderColor: isLight ? '#bbf7d0' : '#10b981' }]}>
          <Ionicons name="document-text-outline" size={12} color="#10b981" />
          <Text style={[styles.statutoryLawText, { color: isLight ? '#166534' : '#6ee7b7' }]}>
            Protected
          </Text>
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
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
  },
  topExecutiveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 10,
  },
  topExecutiveLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
  },
  topIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
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
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  topSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    marginTop: 1,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  topExecutiveActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topSaveBtn: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  topSaveGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  topSaveText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  tabBarCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    padding: 6,
    marginBottom: 10,
    gap: 8,
    flexWrap: 'wrap',
  },
  tabBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  tabScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modulePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  modulePillActiveLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  modulePillActiveDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.22)',
  },
  modulePillText: {
    fontSize: 12,
  },
  moduleActiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#6366f1',
    marginLeft: 2,
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
  groupHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  groupTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  pillBadge: {
    paddingHorizontal: 6,
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
    minWidth: 150,
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
    fontSize: 12,
  },
  faviconShowcaseContainer: {
    gap: 8,
    marginBottom: 10,
  },
  faviconZoomBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  faviconZoomFrame: {
    width: 52,
    height: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(148, 163, 184, 0.25)',
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  faviconZoomMeta: {
    flex: 1,
    gap: 4,
  },
  faviconHdBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  faviconHdBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0284c7',
  },
  faviconMetaHint: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
  },
  browserWindowMockup: {
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  browserTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  trafficLightsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginRight: 10,
  },
  trafficLight: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeBrowserTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    maxWidth: 200,
  },
  activeBrowserTabTitle: {
    fontSize: 10,
    fontWeight: '600',
    maxWidth: 150,
  },
  browserAddressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  omniboxPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  omniboxUrlText: {
    fontSize: 10,
  },
  searchSnippetPreview: {
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  tmplPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  tmplPillActiveLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  tmplPillActiveDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
  },
  tmplPillText: {
    fontSize: 11.5,
  },
  templateModeBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 8,
  },
  segmentedToggle: {
    flexDirection: 'row',
    borderRadius: 6,
    padding: 2,
  },
  toggleSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  toggleSegmentActiveLight: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
  },
  toggleSegmentActiveDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
  },
  toggleSegmentText: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
  },
  varChip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  varChipText: {
    fontSize: 10.5,
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
    fontSize: 13,
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
  ratePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  exemptionNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 8,
    borderRadius: 7,
    borderWidth: 1,
    marginBottom: 8,
  },
  exemptionTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    marginBottom: 1,
  },
  exemptionDesc: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    lineHeight: 14,
  },
  outlineActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  outlineActionText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  paneFooterRight: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  saveActionBtn: {
    borderRadius: 7,
    overflow: 'hidden',
  },
  saveActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  saveActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  statutoryFooterBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  statutoryFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 260,
  },
  statutoryShieldBox: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statutoryCopyrightTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  statutoryCopyrightSub: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    marginTop: 1,
    lineHeight: 14,
  },
  statutoryLawBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  statutoryLawText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
});
