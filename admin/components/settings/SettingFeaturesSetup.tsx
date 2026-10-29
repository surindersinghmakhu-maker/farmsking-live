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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS } from '@/constants/theme';
import { useAppSettings, useUpdateAppSettings } from '@/src/hooks/useAppSettings';
import { useSystemIntegrations, useUpdateSystemIntegrations } from '@/src/hooks/useSystemIntegrations';
import {
  AppSettings,
  UpdateAppSettingsPayload,
  SystemIntegrationsConfig,
  mergeSystemIntegrationsWithDefaults,
} from '@/src/api/appSettings.api';

type FeatureCategoryFilter = 'ALL' | 'WHATSAPP_CALLS' | 'SUB_MAINTENANCE' | 'OTP_RULES';

interface FeatureCategoryPill {
  key: FeatureCategoryFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const FEATURE_PILLS: FeatureCategoryPill[] = [
  { key: 'ALL', label: 'All Features', icon: 'sparkles-outline' },
  { key: 'WHATSAPP_CALLS', label: 'Calls & WhatsApp Automation', icon: 'call-outline' },
  { key: 'SUB_MAINTENANCE', label: 'Granular Module Lockdowns', icon: 'lock-closed-outline' },
  { key: 'OTP_RULES', label: 'OTP Security & Rate Limiting', icon: 'key-outline' },
];

export default function SettingFeaturesSetup() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 860));
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  // Queries
  const { data: rawAppSettings, isLoading: isAppLoading, refetch: refetchApp } = useAppSettings();
  const { data: rawIntegrations, isLoading: isIntLoading, refetch: refetchInt } = useSystemIntegrations();

  // Mutations
  const updateAppMutation = useUpdateAppSettings();
  const updateIntMutation = useUpdateSystemIntegrations();

  // Local state
  const [appForm, setAppForm] = useState<Partial<AppSettings>>({});
  const [intForm, setIntForm] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(rawIntegrations)
  );

  const [activeCategory, setActiveCategory] = useState<FeatureCategoryFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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

  const updateAppField = (field: keyof UpdateAppSettingsPayload, val: any) => {
    setAppForm((prev) => ({ ...prev, [field]: val }));
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

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      const appPayload: UpdateAppSettingsPayload = {
        storefrontMaintenanceMode: Boolean(appForm.storefrontMaintenanceMode),
        agriMaintenanceMode: Boolean(appForm.agriMaintenanceMode),
        gardenMaintenanceMode: Boolean(appForm.gardenMaintenanceMode),
        walletMaintenanceMode: Boolean(appForm.walletMaintenanceMode),
        trainerMaintenanceMode: Boolean(appForm.trainerMaintenanceMode),
        groupVoiceCallEnabled: Boolean(appForm.groupVoiceCallEnabled ?? true),
        whatsappGroupSyncEnabled: Boolean(appForm.whatsappGroupSyncEnabled ?? true),
        whatsappAutoAddEnabled: Boolean(appForm.whatsappAutoAddEnabled ?? true),
        whatsappAutoRemoveEnabled: Boolean(appForm.whatsappAutoRemoveEnabled ?? true),
        whatsappGroupJid: appForm.whatsappGroupJid || '',
        otpDeliveryChannel: appForm.otpDeliveryChannel || 'WHATSAPP',
      };

      await Promise.all([
        updateAppMutation.mutateAsync(appPayload),
        updateIntMutation.mutateAsync({
          otp: intForm.otp,
        }),
      ]);

      showToast('✅ Feature settings saved successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save feature settings');
    } finally {
      setIsSaving(false);
    }
  };

  if ((isAppLoading || isIntLoading) && !appForm.id && !intForm.otp) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: innerBg }]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading Platform Feature Settings...</Text>
      </View>
    );
  }

  const query = searchQuery.toLowerCase().trim();
  const isVisible = (catKey: FeatureCategoryFilter, keywords: string) => {
    const matchCategory = activeCategory === 'ALL' || activeCategory === catKey;
    const matchQuery = !query || keywords.toLowerCase().includes(query);
    return matchCategory && matchQuery;
  };

  return (
    <View style={styles.container}>
      {/* Toast Alert */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={[styles.toastCard, { backgroundColor: isLight ? '#064e3b' : '#022c22' }]}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

      {/* Header Banner */}
      <View style={[styles.bannerCard, { backgroundColor: isLight ? '#f0fdf4' : 'rgba(16, 185, 129, 0.08)', borderColor: isLight ? '#bbf7d0' : '#059669' }]}>
        <View style={{ flex: 1 }}>
          <View style={styles.bannerTitleRow}>
            <Ionicons name="sparkles" size={22} color="#10b981" />
            <Text style={[styles.bannerTitle, { color: textColor }]}>Platform Operational Features</Text>
            <View style={[styles.badgePill, { backgroundColor: isLight ? '#dcfce7' : '#064e3b' }]}>
              <Text style={[styles.badgeText, { color: isLight ? '#166534' : '#6ee7b7' }]}>Active Controls</Text>
            </View>
          </View>
          <Text style={[styles.bannerSub, { color: subTextColor }]}>
            Manage automated communication, voice calls, emergency module lockdowns, and OTP anti-spam rate limiting.
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
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Features'}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills & Search Bar */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={[styles.searchBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
          <Ionicons name="search-outline" size={18} color={subTextColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search features (calls, whatsapp, lockdown, otp, rate limit)..."
            placeholderTextColor={subTextColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={subTextColor} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {FEATURE_PILLS.map((pill) => {
            const isActive = activeCategory === pill.key;
            return (
              <TouchableOpacity
                key={pill.key}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isActive ? (isLight ? '#16a34a' : '#10b981') : innerBg,
                    borderColor: isActive ? (isLight ? '#16a34a' : '#10b981') : cardBorder,
                  },
                ]}
                onPress={() => setActiveCategory(pill.key)}
                activeOpacity={0.7}
              >
                <Ionicons name={pill.icon} size={14} color={isActive ? '#ffffff' : subTextColor} />
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isActive ? '#ffffff' : textColor },
                    isActive && { fontWeight: '700' },
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Feature Cards Grid */}
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        {/* 1. Calls & WhatsApp Automation */}
        {isVisible('WHATSAPP_CALLS', 'group call voice whatsapp jid sync auto add remove otp channel') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="call" size={20} color="#15803d" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Calls & WhatsApp Automation</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Group advisory calls & official WhatsApp farmer sync</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Group Voice Calling</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Enable multi-farmer audio call conferences</Text>
                </View>
                <Switch
                  value={Boolean(appForm.groupVoiceCallEnabled ?? true)}
                  onValueChange={(v) => updateAppField('groupVoiceCallEnabled', v)}
                  trackColor={{ false: '#475569', true: '#15803d' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>WhatsApp Group Sync</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Synchronize farmer directory with official broadcast groups</Text>
                </View>
                <Switch
                  value={Boolean(appForm.whatsappGroupSyncEnabled ?? true)}
                  onValueChange={(v) => updateAppField('whatsappGroupSyncEnabled', v)}
                  trackColor={{ false: '#475569', true: '#15803d' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Auto-Add on Verification</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Automatically add verified growers to community group</Text>
                </View>
                <Switch
                  value={Boolean(appForm.whatsappAutoAddEnabled ?? true)}
                  onValueChange={(v) => updateAppField('whatsappAutoAddEnabled', v)}
                  trackColor={{ false: '#475569', true: '#15803d' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Auto-Remove on Deactivation</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Auto-remove blocked or deactivated accounts</Text>
                </View>
                <Switch
                  value={Boolean(appForm.whatsappAutoRemoveEnabled ?? true)}
                  onValueChange={(v) => updateAppField('whatsappAutoRemoveEnabled', v)}
                  trackColor={{ false: '#475569', true: '#15803d' }}
                />
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Official WhatsApp Group JID</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={appForm.whatsappGroupJid || ''}
                  placeholder="e.g. 12036302839201928@g.us"
                  placeholderTextColor={subTextColor}
                  onChangeText={(t) => updateAppField('whatsappGroupJid', t)}
                />
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Preferred OTP Channel</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={appForm.otpDeliveryChannel || 'WHATSAPP'}
                  placeholder="WHATSAPP / SMS / EMAIL"
                  placeholderTextColor={subTextColor}
                  onChangeText={(t) => updateAppField('otpDeliveryChannel', t.toUpperCase())}
                />
              </View>
            </View>
          </View>
        )}

        {/* 2. Granular Module Lockdown Switches */}
        {isVisible('SUB_MAINTENANCE', 'lockdown maintenance storefront agri garden wallet trainer') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="lock-closed" size={20} color="#dc2626" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Granular Module Lockdowns</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Isolate individual sections during targeted server maintenance</Text>
              </View>
            </View>

            <View style={{ gap: 12 }}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Storefront Maintenance</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Pause public checkout and cart actions</Text>
                </View>
                <Switch
                  value={Boolean(appForm.storefrontMaintenanceMode)}
                  onValueChange={(v) => updateAppField('storefrontMaintenanceMode', v)}
                  trackColor={{ false: '#475569', true: '#dc2626' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Live Mandi Maintenance</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Pause mandi bidding and live rate feeds</Text>
                </View>
                <Switch
                  value={Boolean(appForm.agriMaintenanceMode)}
                  onValueChange={(v) => updateAppField('agriMaintenanceMode', v)}
                  trackColor={{ false: '#475569', true: '#dc2626' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Garden King Maintenance</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Pause balcony plant and urban garden appointments</Text>
                </View>
                <Switch
                  value={Boolean(appForm.gardenMaintenanceMode)}
                  onValueChange={(v) => updateAppField('gardenMaintenanceMode', v)}
                  trackColor={{ false: '#475569', true: '#dc2626' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Wallet Withdrawals Maintenance</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Pause bank payouts and UPI fund withdrawals</Text>
                </View>
                <Switch
                  value={Boolean(appForm.walletMaintenanceMode)}
                  onValueChange={(v) => updateAppField('walletMaintenanceMode', v)}
                  trackColor={{ false: '#475569', true: '#dc2626' }}
                />
              </View>

              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Technical Trainer Maintenance</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>Pause onboarding and trainer exams</Text>
                </View>
                <Switch
                  value={Boolean(appForm.trainerMaintenanceMode)}
                  onValueChange={(v) => updateAppField('trainerMaintenanceMode', v)}
                  trackColor={{ false: '#475569', true: '#dc2626' }}
                />
              </View>
            </View>
          </View>
        )}

        {/* 3. OTP Delivery & Anti-Spam Security Rules */}
        {isVisible('OTP_RULES', 'otp delivery code length expiry rate limit spam') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                <Ionicons name="key" size={20} color="#0284c7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>OTP Security & Rate Limiting</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Code length, timeout duration & flood protection</Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Delivery Mode</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={intForm.otp?.deliveryMode || 'ANY_SINGLE'}
                  placeholder="ANY_SINGLE / EMAIL_ONLY / SMS_ONLY"
                  placeholderTextColor={subTextColor}
                  onChangeText={(t) => updateOtpField('deliveryMode', t.toUpperCase() as any)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>OTP Code Length (Digits)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.otp?.codeLength ?? 6)}
                  onChangeText={(t) => updateOtpField('codeLength', parseInt(t, 10) === 4 ? 4 : 6)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Expiry Duration (Seconds)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.otp?.expirySeconds ?? 300)}
                  onChangeText={(t) => updateOtpField('expirySeconds', parseInt(t, 10) || 300)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Max Resend Attempts</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.otp?.maxResendAttempts ?? 3)}
                  onChangeText={(t) => updateOtpField('maxResendAttempts', parseInt(t, 10) || 3)}
                />
              </View>
            </View>

            <View style={{ marginTop: 12 }}>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Enable IP & Mobile Rate Limiting</Text>
                <Switch
                  value={Boolean(intForm.otp?.enableRateLimiting ?? true)}
                  onValueChange={(v) => updateOtpField('enableRateLimiting', v)}
                  trackColor={{ false: '#475569', true: '#0284c7' }}
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
            Saves directly to database AppSettings and SystemIntegrations OTP schema
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
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving Changes...' : 'Save Features'}</Text>
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
    borderWidth: 1,
    borderColor: '#10b981',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  bannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 16,
    gap: 16,
    flexWrap: 'wrap',
  },
  bannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  bannerTitle: {
    fontSize: 17,
    fontWeight: '800',
    fontFamily: FONT.bold,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  bannerSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  filterBar: {
    padding: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  categoryScroll: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    gap: 16,
  },
  gridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  card: {
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  cardHalf: {
    width: '49%',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: FONT.bold,
  },
  cardSub: {
    fontSize: 12,
    marginTop: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 10,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 1,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fieldItem: {
    flex: 1,
    minWidth: 160,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 13,
  },
  bottomSaveBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: 20,
    gap: 12,
    flexWrap: 'wrap',
  },
  bottomSaveTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bottomSaveSub: {
    fontSize: 11,
    marginTop: 2,
  },
});
