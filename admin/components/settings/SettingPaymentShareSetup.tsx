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

type PaymentShareCategoryFilter =
  | 'ALL'
  | 'REWARDS'
  | 'WALLET_FEES'
  | 'SUB_MAINTENANCE'
  | 'GARDEN_FEES'
  | 'ECOMMERCE_RULES';

interface PaymentShareCategoryPill {
  key: PaymentShareCategoryFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const PAYMENT_SHARE_PILLS: PaymentShareCategoryPill[] = [
  { key: 'ALL', label: 'All Share Rules', icon: 'cash-outline' },
  { key: 'REWARDS', label: 'Referral & Welcome Rewards', icon: 'gift-outline' },
  { key: 'WALLET_FEES', label: 'Wallet TDS & Platform Fees', icon: 'wallet-outline' },
  { key: 'SUB_MAINTENANCE', label: 'Granular Module Lockdowns', icon: 'lock-closed-outline' },
  { key: 'GARDEN_FEES', label: 'Urban Garden & Direct Sales', icon: 'flower-outline' },
  { key: 'ECOMMERCE_RULES', label: 'AgriStore Marketplace Rules', icon: 'cart-outline' },
];

export default function SettingPaymentShareSetup() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 860));
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  // Queries
  const { data: rawAppSettings, isLoading: isAppLoading } = useAppSettings();
  const { data: rawIntegrations, isLoading: isIntLoading } = useSystemIntegrations();

  // Mutations
  const updateAppMutation = useUpdateAppSettings();
  const updateIntMutation = useUpdateSystemIntegrations();

  // Local state
  const [appForm, setAppForm] = useState<Partial<AppSettings>>({});
  const [intForm, setIntForm] = useState<SystemIntegrationsConfig>(() =>
    mergeSystemIntegrationsWithDefaults(rawIntegrations)
  );

  const [activeCategory, setActiveCategory] = useState<PaymentShareCategoryFilter>('ALL');
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

  const updateProductField = (field: keyof SystemIntegrationsConfig['product'], val: any) => {
    setIntForm((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        [field]: val,
      },
    }));
  };

  const handleSaveAll = async () => {
    try {
      setIsSaving(true);
      const appPayload: UpdateAppSettingsPayload = {
        // Referral & Rewards
        newUserSignupBonusAmount: Number(appForm.newUserSignupBonusAmount ?? 10),
        referralSignupBonusAmount: Number(appForm.referralSignupBonusAmount ?? 10),
        referralPaidPlanBonusAmount: Number(appForm.referralPaidPlanBonusAmount ?? 50),
        partnerRefereeSignupBonusAmount: Number(appForm.partnerRefereeSignupBonusAmount ?? 20),
        partnerReferralCommissionAmount: Number(appForm.partnerReferralCommissionAmount ?? 100),
        partnerReferralPaidPlanBonusAmount: Number(appForm.partnerReferralPaidPlanBonusAmount ?? 100),
        referralOfferSchemeEnabled: Boolean(appForm.referralOfferSchemeEnabled),
        referralOfferSchemeName: appForm.referralOfferSchemeName || '',
        referralOfferExpiryDate: appForm.referralOfferExpiryDate || '',

        // Wallet TDS & Fees
        walletTaxEnabled: Boolean(appForm.walletTaxEnabled ?? true),
        withdrawalPlatformFeePercent: Number(appForm.withdrawalPlatformFeePercent ?? 2.0),
        withdrawalGstPercent: Number(appForm.withdrawalGstPercent ?? 18.0),
        walletUsagePlatformFeePercent: Number(appForm.walletUsagePlatformFeePercent ?? 2.0),
        walletUsageGstPercent: Number(appForm.walletUsageGstPercent ?? 18.0),

        // Granular Module Lockdowns
        storefrontMaintenanceMode: Boolean(appForm.storefrontMaintenanceMode),
        agriMaintenanceMode: Boolean(appForm.agriMaintenanceMode),
        gardenMaintenanceMode: Boolean(appForm.gardenMaintenanceMode),
        walletMaintenanceMode: Boolean(appForm.walletMaintenanceMode),
        trainerMaintenanceMode: Boolean(appForm.trainerMaintenanceMode),

        // Urban Garden & Platform Sales
        allowDirectPlatformSales: Boolean(appForm.allowDirectPlatformSales ?? false),
        gardenExpertPlatformFeePercent: Number(appForm.gardenExpertPlatformFeePercent ?? 20.0),
        gardenerProCardPrice: Number(appForm.gardenerProCardPrice ?? 299.0),
        gardenerVipCardPrice: Number(appForm.gardenerVipCardPrice ?? 999.0),
      };

      await Promise.all([
        updateAppMutation.mutateAsync(appPayload),
        updateIntMutation.mutateAsync({
          product: intForm.product,
        }),
      ]);

      showToast('✅ Payment Share & Platform Commission rules saved successfully!');
    } catch (err: any) {
      Alert.alert('Save Failed', err?.message || 'Could not save payment share settings');
    } finally {
      setIsSaving(false);
    }
  };

  if ((isAppLoading || isIntLoading) && !appForm.id && !intForm.product) {
    return (
      <View style={[styles.loadingBox, { backgroundColor: innerBg }]}>
        <ActivityIndicator size="large" color="#16a34a" />
        <Text style={[styles.loadingText, { color: subTextColor }]}>Loading Payment Share & Fee Rules...</Text>
      </View>
    );
  }

  const query = searchQuery.toLowerCase().trim();
  const isVisible = (catKey: PaymentShareCategoryFilter, keywords: string) => {
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
            <Ionicons name="cash" size={22} color="#10b981" />
            <Text style={[styles.bannerTitle, { color: textColor }]}>Payment Share & Platform Commissions</Text>
            <View style={[styles.badgePill, { backgroundColor: isLight ? '#dcfce7' : '#064e3b' }]}>
              <Text style={[styles.badgeText, { color: isLight ? '#166534' : '#6ee7b7' }]}>Financial Parameters</Text>
            </View>
          </View>
          <Text style={[styles.bannerSub, { color: subTextColor }]}>
            Configure wallet TDS, transaction processing fees, referral bonuses, marketplace commissions, direct sales, and operational payment modules.
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
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Settings'}</Text>
        </TouchableOpacity>
      </View>

      {/* Category Pills & Search Bar */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
        <View style={[styles.searchBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
          <Ionicons name="search-outline" size={18} color={subTextColor} />
          <TextInput
            style={[styles.searchInput, { color: textColor }]}
            placeholder="Search fees, referral, bonus, commission, TDS, GST, marketplace..."
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
          {PAYMENT_SHARE_PILLS.map((pill) => {
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

      {/* Cards Grid */}
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        {/* 1. Referral & Welcome Rewards */}
        {isVisible('REWARDS', 'referral welcome bonus rewards partner offer signup commission') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="gift" size={20} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Referral & Welcome Rewards</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Signup and purchase bonuses credited to farmer wallets</Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>New User Welcome Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.newUserSignupBonusAmount ?? 10)}
                  onChangeText={(t) => updateAppField('newUserSignupBonusAmount', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Farmer Referral Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.referralSignupBonusAmount ?? 10)}
                  onChangeText={(t) => updateAppField('referralSignupBonusAmount', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Paid Plan Referral Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.referralPaidPlanBonusAmount ?? 50)}
                  onChangeText={(t) => updateAppField('referralPaidPlanBonusAmount', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Partner Signup Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.partnerRefereeSignupBonusAmount ?? 20)}
                  onChangeText={(t) => updateAppField('partnerRefereeSignupBonusAmount', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Partner Commission (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.partnerReferralCommissionAmount ?? 100)}
                  onChangeText={(t) => updateAppField('partnerReferralCommissionAmount', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Partner Paid Plan Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.partnerReferralPaidPlanBonusAmount ?? 100)}
                  onChangeText={(t) => updateAppField('partnerReferralPaidPlanBonusAmount', parseFloat(t) || 0)}
                />
              </View>
            </View>

            <View style={[styles.toggleRow, { borderTopColor: cardBorder, borderTopWidth: 1, marginTop: 8 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Seasonal Promotional Scheme</Text>
                <Text style={[styles.toggleSub, { color: subTextColor }]}>Activate special limited-time referral campaign</Text>
              </View>
              <Switch
                value={Boolean(appForm.referralOfferSchemeEnabled)}
                onValueChange={(v) => updateAppField('referralOfferSchemeEnabled', v)}
                trackColor={{ false: '#475569', true: '#10b981' }}
              />
            </View>
            {appForm.referralOfferSchemeEnabled && (
              <View style={{ marginTop: 10, gap: 10 }}>
                <View style={styles.fieldItem}>
                  <Text style={[styles.label, { color: textColor }]}>Campaign Name</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                    value={appForm.referralOfferSchemeName || ''}
                    placeholder="e.g. Rabi Harvest Rewards"
                    placeholderTextColor={subTextColor}
                    onChangeText={(t) => updateAppField('referralOfferSchemeName', t)}
                  />
                </View>
                <View style={styles.fieldItem}>
                  <Text style={[styles.label, { color: textColor }]}>Campaign Expiry Date</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                    value={appForm.referralOfferExpiryDate || ''}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={subTextColor}
                    onChangeText={(t) => updateAppField('referralOfferExpiryDate', t)}
                  />
                </View>
              </View>
            )}
          </View>
        )}

        {/* 2. Wallet TDS, Taxes & Platform Fees */}
        {isVisible('WALLET_FEES', 'wallet taxes fees tds gst withdrawal checkout') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#e0e7ff' }]}>
                <Ionicons name="wallet" size={20} color="#4f46e5" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Wallet TDS, Taxes & Platform Fees</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Statutory Section 194N TDS & payment processing GST</Text>
              </View>
            </View>

            <View style={[styles.toggleRow, { borderBottomColor: cardBorder, borderBottomWidth: 1, paddingBottom: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Apply Wallet Taxes & Platform Fees</Text>
                <Text style={[styles.toggleSub, { color: subTextColor }]}>Master switch to enforce TDS and checkout platform charges</Text>
              </View>
              <Switch
                value={Boolean(appForm.walletTaxEnabled ?? true)}
                onValueChange={(v) => updateAppField('walletTaxEnabled', v)}
                trackColor={{ false: '#475569', true: '#4f46e5' }}
              />
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Withdrawal TDS / Platform Fee (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.withdrawalPlatformFeePercent ?? 2.0)}
                  onChangeText={(t) => updateAppField('withdrawalPlatformFeePercent', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>GST on Withdrawal Fee (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.withdrawalGstPercent ?? 18.0)}
                  onChangeText={(t) => updateAppField('withdrawalGstPercent', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Checkout Wallet Processing Fee (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.walletUsagePlatformFeePercent ?? 2.0)}
                  onChangeText={(t) => updateAppField('walletUsagePlatformFeePercent', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>GST on Checkout Fee (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.walletUsageGstPercent ?? 18.0)}
                  onChangeText={(t) => updateAppField('walletUsageGstPercent', parseFloat(t) || 0)}
                />
              </View>
            </View>
          </View>
        )}

        {/* 3. Granular Module Lockdowns */}
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

        {/* 4. Urban Garden & Platform Direct Sales */}
        {isVisible('GARDEN_FEES', 'garden expert fee cards pro vip direct sales platform') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="flower" size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Urban Garden & Platform Direct Sales</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Consultation commission, VIP cards & inventory dispatch</Text>
              </View>
            </View>

            <View style={[styles.toggleRow, { borderBottomColor: cardBorder, borderBottomWidth: 1, paddingBottom: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Allow Direct Platform Sales</Text>
                <Text style={[styles.toggleSub, { color: subTextColor }]}>Allow platform inventory sales alongside vendor products</Text>
              </View>
              <Switch
                value={Boolean(appForm.allowDirectPlatformSales ?? false)}
                onValueChange={(v) => updateAppField('allowDirectPlatformSales', v)}
                trackColor={{ false: '#475569', true: '#16a34a' }}
              />
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Garden Expert Fee Share (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.gardenExpertPlatformFeePercent ?? 20.0)}
                  onChangeText={(t) => updateAppField('gardenExpertPlatformFeePercent', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Gardener Pro Card (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.gardenerProCardPrice ?? 299.0)}
                  onChangeText={(t) => updateAppField('gardenerProCardPrice', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Gardener VIP Card (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.gardenerVipCardPrice ?? 999.0)}
                  onChangeText={(t) => updateAppField('gardenerVipCardPrice', parseFloat(t) || 0)}
                />
              </View>
            </View>
          </View>
        )}

        {/* 5. AgriStore Marketplace Rules */}
        {isVisible('ECOMMERCE_RULES', 'ecommerce store shipping delivery threshold cod reviews kyc seller') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#ffedd5' }]}>
                <Ionicons name="cart" size={20} color="#ea580c" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>AgriStore Marketplace Rules</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Free shipping limits, COD switches, returns & seller rules</Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Marketplace Commission (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.product?.platformFeePercent ?? 5)}
                  onChangeText={(t) => updateProductField('platformFeePercent', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Default Produce GST (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.product?.defaultGstPercent ?? 0)}
                  onChangeText={(t) => updateProductField('defaultGstPercent', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Free Delivery Minimum (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.product?.freeDeliveryThreshold ?? 499)}
                  onChangeText={(t) => updateProductField('freeDeliveryThreshold', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Standard Delivery Fee (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.product?.baseShippingCharge ?? 40)}
                  onChangeText={(t) => updateProductField('baseShippingCharge', parseFloat(t) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Low Stock Alert Threshold (Units)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.product?.lowStockThreshold ?? 10)}
                  onChangeText={(t) => updateProductField('lowStockThreshold', parseInt(t, 10) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Return Window (Days)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.product?.returnReplacementDays ?? 7)}
                  onChangeText={(t) => updateProductField('returnReplacementDays', parseInt(t, 10) || 0)}
                />
              </View>
            </View>

            <View style={{ gap: 10, marginTop: 12 }}>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Allow Cash on Delivery (COD)</Text>
                <Switch
                  value={Boolean(intForm.product?.enableCod ?? true)}
                  onValueChange={(v) => updateProductField('enableCod', v)}
                  trackColor={{ false: '#475569', true: '#ea580c' }}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Auto-Approve Customer Reviews</Text>
                <Switch
                  value={Boolean(intForm.product?.autoApproveReviews ?? false)}
                  onValueChange={(v) => updateProductField('autoApproveReviews', v)}
                  trackColor={{ false: '#475569', true: '#ea580c' }}
                />
              </View>
              <View style={styles.toggleRow}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Require KYC to List Products</Text>
                <Switch
                  value={Boolean(intForm.product?.requireKycForSellers ?? false)}
                  onValueChange={(v) => updateProductField('requireKycForSellers', v)}
                  trackColor={{ false: '#475569', true: '#ea580c' }}
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
            Saves directly to database AppSettings and SystemIntegrations Marketplace schema
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
          <Text style={styles.saveBtnText}>{isSaving ? 'Saving Changes...' : 'Save Settings'}</Text>
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
