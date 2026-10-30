import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS } from '@/constants/theme';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import { useSystemIntegrations, useUpdateSystemIntegrations } from '@/src/hooks/useSystemIntegrations';
import {
  AppSettings,
  UpdateAppSettingsPayload,
  SystemIntegrationsConfig,
  mergeSystemIntegrationsWithDefaults,
  DEFAULT_PROJECT_MASTER_DATA,
  DEFAULT_SYSTEM_INTEGRATIONS_CONFIG,
} from '@/src/api/appSettings.api';

type OtherCategoryFilter =
  | 'ALL'
  | 'CROP_LEAF_SCANNER'
  | 'CROP_SEASONS'
  | 'BACKUP_RECOVERY'
  | 'CERTIFICATES'
  | 'FRANCHISE_RULES'
  | 'STORAGE_TELECOM';

interface CategoryPill {
  key: OtherCategoryFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORY_PILLS: CategoryPill[] = [
  { key: 'ALL', label: 'All Unexposed Settings', icon: 'apps-outline' },
  { key: 'CROP_LEAF_SCANNER', label: 'Scan Any Crop / Leaf Photo Directly', icon: 'scan-outline' },
  { key: 'CROP_SEASONS', label: 'Crop Cycles & Seasons', icon: 'calendar-outline' },
  { key: 'BACKUP_RECOVERY', label: 'Backup & Recovery', icon: 'server-outline' },
  { key: 'CERTIFICATES', label: 'Certificates & QR', icon: 'shield-checkmark-outline' },
  { key: 'FRANCHISE_RULES', label: 'Mandi Franchise', icon: 'storefront-outline' },
  { key: 'STORAGE_TELECOM', label: 'Cloud Storage & Agora', icon: 'cloud-outline' },
];

export default function SettingOtherSetup() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 860));
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  // Queries
  const { data: rawAppSettings, isLoading: isAppLoading, refetch: refetchApp } = useAppSettings();
  const { data: rawIntegrations, isLoading: isIntLoading, refetch: refetchInt } = useSystemIntegrations();

  // Mutations
  const updateAppMutation = useUpdateAppSettings();
  const updateIntMutation = useUpdateSystemIntegrations();

  // Local state for edits
  const [appForm, setAppForm] = useState<Partial<AppSettings>>({});
  const [intForm, setIntForm] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(rawIntegrations)
  );

  const [activeCategory, setActiveCategory] = useState<OtherCategoryFilter>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync state with remote queries
  useEffect(() => {
    if (rawAppSettings) {
      setAppForm(rawAppSettings);
    }
  }, [rawAppSettings]);

  useEffect(() => {
    if (rawIntegrations) {
      setIntForm(mergeSystemIntegrationsWithDefaults(rawIntegrations));
    }
  }, [rawIntegrations]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Handler helpers
  const updateAppField = (field: keyof UpdateAppSettingsPayload, val: any) => {
    setAppForm((prev) => ({ ...prev, [field]: val }));
  };

  const updateMasterField = (field: keyof typeof DEFAULT_PROJECT_MASTER_DATA, val: any) => {
    setIntForm((prev) => {
      const pm = prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      return {
        ...prev,
        projectMasterData: {
          ...pm,
          [field]: val,
        },
      };
    });
  };

  const updateMasterNested = (
    section: 'cropSessions' | 'backupSettings' | 'certificateConfig' | 'franchiseRules' | 'promotersAndCapital' | 'themeColors' | 'smtp',
    field: string,
    val: any
  ) => {
    setIntForm((prev) => {
      const pm = prev.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;
      const curSection = (pm as any)[section] || (DEFAULT_PROJECT_MASTER_DATA as any)[section] || {};
      return {
        ...prev,
        projectMasterData: {
          ...pm,
          [section]: {
            ...curSection,
            [field]: val,
          },
        },
      };
    });
  };

  const updateProductField = (field: keyof SystemIntegrationsConfig['product'], val: any) => {
    setIntForm((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        [field]: val,
      },
    }));
  };

  const updateOtpField = (field: keyof SystemIntegrationsConfig['otp'], val: any) => {
    setIntForm((prev) => ({
      ...prev,
      otp: {
        ...prev.otp,
        [field]: val,
      },
    }));
  };

  const updateStorageField = (provider: 'cloudflareR2', field: string, val: any) => {
    setIntForm((prev) => {
      const curProvider = prev.storage?.providers?.[provider] || (DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.storage.providers as any)[provider];
      return {
        ...prev,
        storage: {
          ...prev.storage,
          providers: {
            ...prev.storage.providers,
            [provider]: {
              ...curProvider,
              [field]: val,
            },
          },
        },
      };
    });
  };

  const updateTelecomField = (provider: 'agora', field: string, val: any) => {
    setIntForm((prev) => {
      const curProvider = prev.telecom?.providers?.[provider] || (DEFAULT_SYSTEM_INTEGRATIONS_CONFIG.telecom.providers as any)[provider];
      return {
        ...prev,
        telecom: {
          ...prev.telecom,
          providers: {
            ...prev.telecom.providers,
            [provider]: {
              ...curProvider,
              [field]: val,
            },
          },
        },
      };
    });
  };

  const updateAiField = (field: string, val: any) => {
    setIntForm((prev) => ({
      ...prev,
      ai: {
        ...prev.ai,
        [field]: val,
      },
    }));
  };

  // Master Save Handler
  const handleSaveAll = async () => {
    try {
      setIsSaving(true);

      const appPayload: UpdateAppSettingsPayload = {
        newUserSignupBonusAmount: Number(appForm.newUserSignupBonusAmount ?? 10),
        referralSignupBonusAmount: Number(appForm.referralSignupBonusAmount ?? 10),
        referralPaidPlanBonusAmount: Number(appForm.referralPaidPlanBonusAmount ?? 50),
        partnerRefereeSignupBonusAmount: Number(appForm.partnerRefereeSignupBonusAmount ?? 20),
        partnerReferralCommissionAmount: Number(appForm.partnerReferralCommissionAmount ?? 100),
        partnerReferralPaidPlanBonusAmount: Number(appForm.partnerReferralPaidPlanBonusAmount ?? 100),
        referralOfferSchemeEnabled: Boolean(appForm.referralOfferSchemeEnabled),
        referralOfferSchemeName: appForm.referralOfferSchemeName || '',
        referralOfferExpiryDate: appForm.referralOfferExpiryDate || '',
        walletTaxEnabled: Boolean(appForm.walletTaxEnabled ?? true),
        withdrawalPlatformFeePercent: Number(appForm.withdrawalPlatformFeePercent ?? 2.0),
        withdrawalGstPercent: Number(appForm.withdrawalGstPercent ?? 18.0),
        walletUsagePlatformFeePercent: Number(appForm.walletUsagePlatformFeePercent ?? 2.0),
        walletUsageGstPercent: Number(appForm.walletUsageGstPercent ?? 18.0),
        freeTrialEnabled: Boolean(appForm.freeTrialEnabled ?? true),
        freeTrialDays: Number(appForm.freeTrialDays ?? 10),
        freeTrialPlan: (appForm.freeTrialPlan as any) || 'SUPER',
        advisorCertificationFee: Number(appForm.advisorCertificationFee ?? 999),
        advisorCertificationDiscount: Number(appForm.advisorCertificationDiscount ?? 0),
        gardenExpertPlatformFeePercent: Number(appForm.gardenExpertPlatformFeePercent ?? 20.0),
        gardenerProCardPrice: Number(appForm.gardenerProCardPrice ?? 299.0),
        gardenerVipCardPrice: Number(appForm.gardenerVipCardPrice ?? 999.0),
        allowDirectPlatformSales: Boolean(appForm.allowDirectPlatformSales ?? false),
        storefrontMaintenanceMode: Boolean(appForm.storefrontMaintenanceMode ?? false),
        agriMaintenanceMode: Boolean(appForm.agriMaintenanceMode ?? false),
        gardenMaintenanceMode: Boolean(appForm.gardenMaintenanceMode ?? false),
        walletMaintenanceMode: Boolean(appForm.walletMaintenanceMode ?? false),
        doctorMaintenanceMode: Boolean(appForm.doctorMaintenanceMode ?? false),
        trainerMaintenanceMode: Boolean(appForm.trainerMaintenanceMode ?? false),
        groupVoiceCallEnabled: Boolean(appForm.groupVoiceCallEnabled ?? true),
        whatsappGroupSyncEnabled: Boolean(appForm.whatsappGroupSyncEnabled ?? true),
        whatsappAutoAddEnabled: Boolean(appForm.whatsappAutoAddEnabled ?? true),
        whatsappAutoRemoveEnabled: Boolean(appForm.whatsappAutoRemoveEnabled ?? true),
        whatsappGroupJid: appForm.whatsappGroupJid || '',
        otpDeliveryChannel: appForm.otpDeliveryChannel || 'WHATSAPP',
        appDownloadUrl: appForm.appDownloadUrl || (intForm.projectMasterData as any)?.appDownloadUrl || '',
        latestAppVersion: appForm.latestAppVersion || (intForm.projectMasterData as any)?.latestAppVersion || '2.1.0',
      };

      await Promise.all([
        updateAppMutation.mutateAsync(appPayload),
        updateIntMutation.mutateAsync({
          product: intForm.product,
          otp: intForm.otp,
          ai: intForm.ai,
          storage: intForm.storage,
          telecom: intForm.telecom,
          projectMasterData: intForm.projectMasterData,
        }),
      ]);

      showToast('✅ All unexposed system settings saved successfully!');
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const isLoading = isAppLoading || isIntLoading;
  if (isLoading && !appForm.id && !intForm.projectMasterData) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: innerBg }]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading Unexposed System Parameters...</Text>
      </View>
    );
  }

  const pm = intForm.projectMasterData || DEFAULT_PROJECT_MASTER_DATA;

  const isVisible = (cat: OtherCategoryFilter) => {
    return activeCategory === 'ALL' || activeCategory === cat;
  };

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={[styles.toastCard, { backgroundColor: isLight ? '#064e3b' : '#022c22' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

      {/* Category Filter Pills & Quick Save */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CATEGORY_PILLS.map((pill) => {
            const isSelected = activeCategory === pill.key;
            return (
              <TouchableOpacity
                key={pill.key}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? (isLight ? '#16a34a' : '#10b981') : innerBg,
                    borderColor: isSelected ? (isLight ? '#16a34a' : '#10b981') : cardBorder,
                  },
                ]}
                onPress={() => setActiveCategory(pill.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={pill.icon}
                  size={14}
                  color={isSelected ? '#ffffff' : subTextColor}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? '#ffffff' : textColor },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <TouchableOpacity
          style={[styles.saveBtnTop, isSaving && { opacity: 0.7 }]}
          onPress={handleSaveAll}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="save-outline" size={14} color="#ffffff" />
          )}
          <Text style={styles.saveBtnTopText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </View>

      {/* Main Grid of Settings Cards */}
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        {/* Universal AI Crop & Leaf Photo Scanner */}
        {isVisible('CROP_LEAF_SCANNER') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardFull]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#ecfdf5' }]}>
                <Ionicons name="scan" size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[styles.cardTitle, { color: textColor }]}>Scan Any Crop / Leaf Photo Directly</Text>
                  <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: '#10b981' }}>Universal 1-Step Detection</Text>
                  </View>
                </View>
                <Text style={[styles.cardSub, { color: subTextColor }]}>
                  Automatic 1-step crop and disease identification from any field leaf photo. No crop selection needed. Deep neural network identifies crop species and detects fungal, bacterial, viral, or pest infections in 2 seconds.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#16a34a',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 8,
                }}
                onPress={() => router.push('/admin/crop-disease-scanner')}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={15} color="#ffffff" />
                <Text style={{ color: '#ffffff', fontSize: 12, fontWeight: '700' }}>Open Live Scanner ↗</Text>
              </TouchableOpacity>
            </View>

            {/* Toggle Switches Row */}
            <View style={{ flexDirection: isDesktop ? 'row' : 'column', gap: 14, borderBottomWidth: 1, borderBottomColor: cardBorder, paddingBottom: 14, marginBottom: 14 }}>
              <View style={[styles.toggleRow, { flex: 1, borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Universal Leaf Scanner Active</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Enable instant leaf photo diagnostic scans for farmers and field advisors</Text>
                </View>
                <Switch
                  value={Boolean(intForm.ai?.isEnabled ?? true)}
                  onValueChange={(v) => updateAiField('isEnabled', v)}
                  trackColor={{ false: '#475569', true: '#16a34a' }}
                />
              </View>

              <View style={[styles.toggleRow, { flex: 1, borderBottomWidth: 0, paddingBottom: 0 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Crop Doctor Emergency Lockdown</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Temporarily pause public leaf scanner during model maintenance or updates</Text>
                </View>
                <Switch
                  value={Boolean(appForm.doctorMaintenanceMode ?? false)}
                  onValueChange={(v) => updateAppField('doctorMaintenanceMode' as any, v)}
                  trackColor={{ false: '#475569', true: '#dc2626' }}
                />
              </View>
            </View>

            {/* Parameters Grid */}
            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Vision Engine Provider</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={intForm.ai?.activeProvider || 'GEMINI'}
                  onChangeText={(t) => updateAiField('activeProvider', t.toUpperCase() as any)}
                  placeholder="GEMINI / GROQ / HUGGINGFACE / OPENAI"
                  placeholderTextColor={subTextColor}
                />
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Diagnostic Confidence Threshold (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value="85"
                  placeholder="85"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Diagnosis Timeout (Seconds)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value="5"
                  placeholder="5"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Default Vision Model</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={intForm.ai?.providers?.gemini?.model || 'gemini-1.5-flash'}
                  onChangeText={(t) => {
                    setIntForm((prev) => ({
                      ...prev,
                      ai: {
                        ...prev.ai,
                        providers: {
                          ...prev.ai.providers,
                          gemini: {
                            ...prev.ai.providers.gemini,
                            model: t,
                          },
                        },
                      },
                    }));
                  }}
                  placeholder="gemini-1.5-flash"
                  placeholderTextColor={subTextColor}
                />
              </View>
            </View>

            {/* Universal Supported Crops Directory */}
            <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: cardBorder }}>
              <Text style={{ fontSize: 11.5, fontWeight: '700', color: textColor, marginBottom: 8 }}>
                Supported Universal Crop Varieties (Fine-Tuned on 50,000+ Indian Farm Photos):
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { name: 'Paddy / Rice', icon: 'leaf-outline' },
                  { name: 'Wheat', icon: 'nutrition-outline' },
                  { name: 'Cotton (Narma)', icon: 'flower-outline' },
                  { name: 'Sugarcane', icon: 'git-commit-outline' },
                  { name: 'Potato & Tubers', icon: 'ellipse-outline' },
                  { name: 'Tomato, Chilli & Vegetables', icon: 'basket-outline' },
                  { name: 'Mustard (Sarson)', icon: 'color-palette-outline' },
                  { name: 'Citrus (Kinnow & Lemon)', icon: 'aperture-outline' },
                ].map((item, i) => (
                  <View
                    key={i}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 5,
                      backgroundColor: innerBg,
                      borderWidth: 1,
                      borderColor: cardBorder,
                      paddingHorizontal: 9,
                      paddingVertical: 5,
                      borderRadius: 6,
                    }}
                  >
                    <Ionicons name={item.icon as any} size={12} color="#16a34a" />
                    <Text style={{ fontSize: 11, color: textColor, fontWeight: '500' }}>{item.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* Crop Cycles & Farming Seasons */}
        {isVisible('CROP_SEASONS') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="calendar" size={20} color="#b45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Crop Cycles & Farming Seasons</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Active season, sowing window, and crop life-cycles</Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Active Season Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.cropSessions?.activeSessionName || 'Rabi 2026-27 (Winter Sowing)'}
                  onChangeText={(t) => updateMasterNested('cropSessions', 'activeSessionName', t)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Season Type</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.cropSessions?.activeSeasonType || 'RABI'}
                  placeholder="RABI / KHARIF / ZAID / ANNUAL"
                  placeholderTextColor={subTextColor}
                  onChangeText={(t) => updateMasterNested('cropSessions', 'activeSeasonType', t.toUpperCase())}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Season Start Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.cropSessions?.startDate || '01/10/2026'}
                  onChangeText={(t) => updateMasterNested('cropSessions', 'startDate', t)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Season End Date</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.cropSessions?.endDate || '15/04/2027'}
                  onChangeText={(t) => updateMasterNested('cropSessions', 'endDate', t)}
                />
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={[styles.label, { color: textColor }]}>Major Target Crops</Text>
              <TextInput
                style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                value={pm.cropSessions?.majorCrops || 'Wheat, Mustard, Barley, Gram, Potato, Peas'}
                onChangeText={(t) => updateMasterNested('cropSessions', 'majorCrops', t)}
              />
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Isolate Historical Records</Text>
                <Switch
                  value={Boolean(pm.cropSessions?.isDataIsolated ?? true)}
                  onValueChange={(v) => updateMasterNested('cropSessions', 'isDataIsolated', v)}
                  trackColor={{ false: '#475569', true: '#b45309' }}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Auto-Switch Mandi Rates by Season</Text>
                <Switch
                  value={Boolean(pm.cropSessions?.autoSwitchMandiRates ?? true)}
                  onValueChange={(v) => updateMasterNested('cropSessions', 'autoSwitchMandiRates', v)}
                  trackColor={{ false: '#475569', true: '#b45309' }}
                />
              </View>
            </View>
          </View>
        )}

        {/* 11. Automated Backup & Recovery */}
        {isVisible('BACKUP_RECOVERY') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="server" size={20} color="#334155" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Automated Backup & Disaster Recovery</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Scheduled PostgreSQL database and cloud snapshot retention</Text>
              </View>
            </View>

            <View style={[styles.toggleRow, { borderBottomColor: cardBorder, borderBottomWidth: 1, paddingBottom: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Auto-Backup Enabled</Text>
                <Text style={[styles.toggleSub, { color: subTextColor }]}>Run daily encrypted database backup snapshots</Text>
              </View>
              <Switch
                value={Boolean(pm.backupSettings?.autoBackupEnabled ?? true)}
                onValueChange={(v) => updateMasterNested('backupSettings', 'autoBackupEnabled', v)}
                trackColor={{ false: '#475569', true: '#10b981' }}
              />
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Frequency</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.backupSettings?.frequency || 'DAILY'}
                  placeholder="DAILY / WEEKLY / MONTHLY"
                  placeholderTextColor={subTextColor}
                  onChangeText={(t) => updateMasterNested('backupSettings', 'frequency', t.toUpperCase())}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Retention Days</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(pm.backupSettings?.retentionDays ?? 30)}
                  onChangeText={(t) => updateMasterNested('backupSettings', 'retentionDays', parseInt(t, 10) || 30)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Storage Target</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.backupSettings?.storageTarget || 'R2_AND_LOCAL'}
                  onChangeText={(t) => updateMasterNested('backupSettings', 'storageTarget', t)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Encryption Standard</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.backupSettings?.encryptionStandard || 'AES-256-GCM'}
                  onChangeText={(t) => updateMasterNested('backupSettings', 'encryptionStandard', t)}
                />
              </View>
            </View>

            <View style={{ marginTop: 10 }}>
              <Text style={[styles.label, { color: subTextColor }]}>Last Backup Timestamp</Text>
              <Text style={[{ color: textColor, fontWeight: '600', fontSize: 13 }]}>{pm.backupSettings?.lastBackupTimestamp || '24/10/2026 22:30 IST'}</Text>
            </View>
          </View>
        )}

        {/* 12. Certificates & Public Verification QR Portal */}
        {isVisible('CERTIFICATES') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#e0f2fe' }]}>
                <Ionicons name="ribbon-outline" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Certificates & QR Verification</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Official agronomist and farmer certificate issuing standards</Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Certificate Serial Prefix</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.certificateConfig?.certificatePrefix || 'FK-CERT-'}
                  onChangeText={(t) => updateMasterNested('certificateConfig', 'certificatePrefix', t)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Public Verification Link</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.certificateConfig?.verificationPortalUrl || 'https://farmsking.in/verify'}
                  onChangeText={(t) => updateMasterNested('certificateConfig', 'verificationPortalUrl', t)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Default Validity (Years)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(pm.certificateConfig?.defaultValidityYears ?? 3)}
                  onChangeText={(t) => updateMasterNested('certificateConfig', 'defaultValidityYears', parseInt(t, 10) || 3)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Certificate Issuing Authority</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.certificateConfig?.certificateAuthority || 'FARMSKING TECHNOLOGIES PRIVATE LIMITED'}
                  onChangeText={(t) => updateMasterNested('certificateConfig', 'certificateAuthority', t)}
                />
              </View>
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Require Admin Approval Before Issuance</Text>
                <Switch
                  value={Boolean(pm.certificateConfig?.requireApproval ?? true)}
                  onValueChange={(v) => updateMasterNested('certificateConfig', 'requireApproval', v)}
                  trackColor={{ false: '#475569', true: '#0284c7' }}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Embed Digital Verification QR Code</Text>
                <Switch
                  value={Boolean(pm.certificateConfig?.digitalQrEnabled ?? true)}
                  onValueChange={(v) => updateMasterNested('certificateConfig', 'digitalQrEnabled', v)}
                  trackColor={{ false: '#475569', true: '#0284c7' }}
                />
              </View>
            </View>
          </View>
        )}

        {/* 13. Franchise & Mandi Network Rules */}
        {isVisible('FRANCHISE_RULES') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="storefront" size={20} color="#b45309" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Franchise & Mandi Agent Rules</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Commission rates, security deposits & territory allocation</Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Mandi Agent Commission (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(pm.franchiseRules?.mandiAgentCommissionPercent ?? 1.5)}
                  onChangeText={(t) => updateMasterNested('franchiseRules', 'mandiAgentCommissionPercent', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Territory Allocation Type</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={pm.franchiseRules?.dealerAreaAllocationType || 'TEHSIL'}
                  placeholder="VILLAGE / TEHSIL / DISTRICT"
                  placeholderTextColor={subTextColor}
                  onChangeText={(t) => updateMasterNested('franchiseRules', 'dealerAreaAllocationType', t.toUpperCase())}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Security Deposit (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(pm.franchiseRules?.securityDepositInr ?? 25000)}
                  onChangeText={(t) => updateMasterNested('franchiseRules', 'securityDepositInr', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Minimum Monthly GMV Turnover (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(pm.franchiseRules?.minimumMonthlyTurnoverInr ?? 100000)}
                  onChangeText={(t) => updateMasterNested('franchiseRules', 'minimumMonthlyTurnoverInr', parseFloat(t) || 0)}
                />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Centralized HQ Approval Required</Text>
                <Switch
                  value={Boolean(pm.franchiseRules?.centralizedApprovalRequired ?? true)}
                  onValueChange={(v) => updateMasterNested('franchiseRules', 'centralizedApprovalRequired', v)}
                  trackColor={{ false: '#475569', true: '#b45309' }}
                />
              </View>
            </View>
          </View>
        )}


        {/* 15. Media Storage & Agora Telecom */}
        {isVisible('STORAGE_TELECOM') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#f0fdf4' }]}>
                <Ionicons name="cloud" size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Cloud Storage & Agora Video Infrastructure</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Cloudflare R2 media storage & Agora RTC credentials</Text>
              </View>
            </View>

            <Text style={[styles.sectionSubtitle, { color: textColor }]}>Cloudflare R2 Media Bucket</Text>
            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Bucket Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={intForm.storage?.providers?.cloudflareR2?.bucketName || 'farmsking-media'}
                  onChangeText={(t) => updateStorageField('cloudflareR2', 'bucketName', t)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Public CDN Domain</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={intForm.storage?.providers?.cloudflareR2?.publicUrl || 'https://media.farmsking.in'}
                  onChangeText={(t) => updateStorageField('cloudflareR2', 'publicUrl', t)}
                />
              </View>
            </View>

            <Text style={[styles.sectionSubtitle, { color: textColor, marginTop: 14 }]}>Agora Voice & Video Call Engine</Text>
            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Agora App ID</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={intForm.telecom?.providers?.agora?.appId || ''}
                  onChangeText={(t) => updateTelecomField('agora', 'appId', t)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Agora Certificate</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  secureTextEntry
                  value={intForm.telecom?.providers?.agora?.appCertificate || ''}
                  onChangeText={(t) => updateTelecomField('agora', 'appCertificate', t)}
                />
              </View>
            </View>
          </View>
        )}

      </View>

      {/* Floating Bottom Bar for Fast Desktop Saving */}
      <View style={[styles.bottomSaveBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.bottomSaveTitle, { color: textColor }]}>Changes ready to save</Text>
          <Text style={[styles.bottomSaveSub, { color: subTextColor }]}>
            Saves directly to database AppSettings singleton and ProjectMasterData featureFlags
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
          onPress={handleSaveAll}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="save-outline" size={18} color="#ffffff" />
          )}
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving Changes...' : 'Save All Settings'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 40,
  },
  loadingBox: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.lg,
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FONT.medium,
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    right: 20,
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.semiBold,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#16a34a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  saveBtnTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  saveBtnTopText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: FONT.bold,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  grid: {
    gap: 16,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    padding: 18,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  cardHalf: {
    width: '48.8%',
  },
  cardFull: {
    width: '100%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldItem: {
    flex: 1,
    minWidth: 140,
  },
  label: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginBottom: 6,
  },
  input: {
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    fontFamily: FONT.regular,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  toggleLabel: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  toggleSub: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    marginBottom: 8,
  },
  bottomSaveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  bottomSaveTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  bottomSaveSub: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
});
