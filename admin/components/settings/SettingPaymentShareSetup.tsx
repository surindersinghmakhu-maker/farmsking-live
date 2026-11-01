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
  | 'ECOMMERCE_RULES';

interface PaymentShareCategoryPill {
  key: PaymentShareCategoryFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

interface RoleOption {
  key: string;
  name: string;
  roleBadge: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const ALL_SYSTEM_ROLES: RoleOption[] = [
  {
    key: 'BUSINESS_PARTNER',
    name: 'Business Partner / Franchise',
    roleBadge: 'PARTNER',
    description: 'Franchise owners, district distributors & commission partners',
    icon: 'briefcase-outline',
    color: '#4f46e5',
  },
  {
    key: 'ADVISOR',
    name: 'Agri Doctor / Agronomist',
    roleBadge: 'ADVISOR',
    description: 'Verified crop doctors, agronomists & farm consultants',
    icon: 'medkit-outline',
    color: '#059669',
  },
  {
    key: 'GARDENER',
    name: 'Urban Garden Expert',
    roleBadge: 'GARDENER',
    description: 'Urban gardening, landscape consultants & balcony specialists',
    icon: 'flower-outline',
    color: '#16a34a',
  },
  {
    key: 'FARMER',
    name: 'Farmer (Cultivator)',
    roleBadge: 'FARMER',
    description: 'Direct agricultural producers and farm account holders',
    icon: 'leaf-outline',
    color: '#ca8a04',
  },
  {
    key: 'CUSTOMER',
    name: 'Buyer / Retail Customer',
    roleBadge: 'CUSTOMER',
    description: 'Consumers purchasing fresh farm produce and retail inputs',
    icon: 'cart-outline',
    color: '#0284c7',
  },
  {
    key: 'SELLER',
    name: 'AgriStore Vendor / Seller',
    roleBadge: 'SELLER',
    description: 'Marketplace merchants, equipment sellers & seed providers',
    icon: 'storefront-outline',
    color: '#ea580c',
  },
  {
    key: 'TRADER',
    name: 'Mandi Trader / Merchant',
    roleBadge: 'TRADER',
    description: 'Mandi commission agents, crop traders & bulk procurement agents',
    icon: 'cash-outline',
    color: '#d97706',
  },
  {
    key: 'MANAGER',
    name: 'Operations Manager',
    roleBadge: 'MANAGER',
    description: 'Territory heads, operational managers & district supervisors',
    icon: 'people-outline',
    color: '#2563eb',
  },
  {
    key: 'SUPERVISOR',
    name: 'Field Supervisor',
    roleBadge: 'SUPERVISOR',
    description: 'Field inspection staff, harvest monitors & audit officers',
    icon: 'eye-outline',
    color: '#0d9488',
  },
  {
    key: 'OPERATOR',
    name: 'System Operator',
    roleBadge: 'OPERATOR',
    description: 'Data entry operators, helpline support & account executives',
    icon: 'desktop-outline',
    color: '#7c3aed',
  },
  {
    key: 'LABOUR',
    name: 'Field Labour',
    roleBadge: 'LABOUR',
    description: 'Physical farm workers, sprayers & warehouse handling staff',
    icon: 'hammer-outline',
    color: '#475569',
  },
  {
    key: 'TECHNICAL_TRAINER',
    name: 'Technical Trainer',
    roleBadge: 'TRAINER',
    description: 'Agricultural training instructors & partner educators',
    icon: 'school-outline',
    color: '#0891b2',
  },
  {
    key: 'ADMIN',
    name: 'Administrator',
    roleBadge: 'ADMIN',
    description: 'Operations administrators with elevated system access',
    icon: 'shield-checkmark-outline',
    color: '#dc2626',
  },
  {
    key: 'SUPER_ADMIN',
    name: 'Super Administrator',
    roleBadge: 'SUPER_ADMIN',
    description: 'Company directors and root platform controllers',
    icon: 'key-outline',
    color: '#9333ea',
  },
];

const PAYMENT_SHARE_PILLS: PaymentShareCategoryPill[] = [
  { key: 'ALL', label: 'All Share Rules', icon: 'cash-outline' },
  { key: 'REWARDS', label: 'Referral & Welcome Rewards', icon: 'gift-outline' },
  { key: 'WALLET_FEES', label: 'Wallet TDS & Role Withdrawals', icon: 'wallet-outline' },
  { key: 'ECOMMERCE_RULES', label: 'AgriStore Marketplace Rules', icon: 'cart-outline' },
];

export interface LogisticsPartnerOption {
  id: string;
  name: string;
  logo: string;
  defaultFee: number;
  deliveryType: string;
}

export const LOGISTICS_PARTNERS: LogisticsPartnerOption[] = [
  { id: 'SHIPROCKET', name: 'Shiprocket', logo: '🚀', defaultFee: 65, deliveryType: 'Surface Express (25+ Couriers)' },
  { id: 'DELHIVERY', name: 'Delhivery', logo: '🚚', defaultFee: 70, deliveryType: 'Direct Hub & Spoke (Pan-India)' },
  { id: 'ECOM_EXPRESS', name: 'Ecom Express', logo: '📦', defaultFee: 60, deliveryType: 'Specialized E-commerce' },
  { id: 'XPRESSBEES', name: 'XpressBees', logo: '🐝', defaultFee: 55, deliveryType: 'Fast Dispatch Network' },
  { id: 'BLUEDART', name: 'Blue Dart', logo: '⚡', defaultFee: 90, deliveryType: 'Premium Air Express' },
  { id: 'SHADOWFAX', name: 'Shadowfax', logo: '🛵', defaultFee: 50, deliveryType: 'Hyperlocal & Regional' },
  { id: 'LOCAL', name: 'Local Fleet', logo: '🚜', defaultFee: 40, deliveryType: 'Direct Farm Transport' },
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

    const allowedWithdrawalRoles: string[] = Array.isArray(appForm.allowedWithdrawalRoles)
    ? appForm.allowedWithdrawalRoles
    : [];

  const isRoleAllowed = (roleKey: string) => allowedWithdrawalRoles.includes(roleKey);

  const toggleRoleWithdrawal = (roleKey: string) => {
    if (isRoleAllowed(roleKey)) {
      updateAppField(
        'allowedWithdrawalRoles',
        allowedWithdrawalRoles.filter((r) => r !== roleKey)
      );
    } else {
      updateAppField('allowedWithdrawalRoles', [...allowedWithdrawalRoles, roleKey]);
    }
  };

  const handleSelectAllWithdrawalRoles = () => {
    updateAppField(
      'allowedWithdrawalRoles',
      ALL_SYSTEM_ROLES.map((r) => r.key)
    );
    showToast('All 14 user roles permitted for wallet withdrawals');
  };

  const handleSelectPartnersAndAdvisorsOnly = () => {
    updateAppField('allowedWithdrawalRoles', ['BUSINESS_PARTNER', 'ADVISOR', 'ADMIN', 'SUPER_ADMIN']);
    showToast('Permitted commercial partners and crop doctors only');
  };

  const handleClearAllWithdrawalRoles = () => {
    updateAppField('allowedWithdrawalRoles', []);
    showToast('All withdrawals banned for every user role');
  };

  const currentActivePartnerKey = (intForm.logistics?.activeProvider || 'SHIPROCKET').toUpperCase();
  const activeLogisticsPartner =
    LOGISTICS_PARTNERS.find((p) => p.id === currentActivePartnerKey) || LOGISTICS_PARTNERS[0];

  const partnerDeliveryFees: Record<string, number> = {
    SHIPROCKET: 65,
    DELHIVERY: 70,
    ECOM_EXPRESS: 60,
    XPRESSBEES: 55,
    BLUEDART: 90,
    SHADOWFAX: 50,
    LOCAL: 40,
    ...(intForm.product?.partnerDeliveryFees || {}),
  };

  const handleSelectActiveLogistics = (partner: LogisticsPartnerOption) => {
    const feeForPartner = partnerDeliveryFees[partner.id] ?? partner.defaultFee;
    setIntForm((prev) => ({
      ...prev,
      logistics: {
        ...prev.logistics,
        activeProvider: partner.id as any,
      },
      product: {
        ...prev.product,
        baseShippingCharge: feeForPartner,
        partnerDeliveryFees: {
          ...partnerDeliveryFees,
          [partner.id]: feeForPartner,
        },
      },
    }));
    showToast(`Active logistics partner switched to ${partner.name} (₹${feeForPartner})`);
  };

  const handleUpdateStandardFee = (val: number) => {
    setIntForm((prev) => ({
      ...prev,
      product: {
        ...prev.product,
        baseShippingCharge: val,
        partnerDeliveryFees: {
          ...partnerDeliveryFees,
          [activeLogisticsPartner.id]: val,
        },
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
        walletWithdrawalEnabled: Boolean(appForm.walletWithdrawalEnabled),
        allowedWithdrawalRoles: Array.isArray(appForm.allowedWithdrawalRoles)
          ? appForm.allowedWithdrawalRoles
          : [],

      };

      await Promise.all([
        updateAppMutation.mutateAsync(appPayload),
        updateIntMutation.mutateAsync({
          product: intForm.product,
          logistics: intForm.logistics,
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

  const isVisible = (catKey: PaymentShareCategoryFilter) => {
    return activeCategory === 'ALL' || activeCategory === catKey;
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

      {/* Category Pills & Quick Save */}
      <View style={[styles.filterBar, { backgroundColor: cardBg, borderColor: cardBorder }]}>
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

      {/* Cards Grid */}
      <View style={[styles.grid, isDesktop && styles.gridDesktop]}>
        {/* 1. Referral & Welcome Rewards */}
        {isVisible('REWARDS') && (
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
        {isVisible('WALLET_FEES') && (
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

        {/* 3. Role-Based Wallet Withdrawal Permissions */}
        {isVisible('WALLET_FEES') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="cash-outline" size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Role-Based Wallet Withdrawal Permissions</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Configure which user roles can request wallet payouts</Text>
              </View>
            </View>

            {/* Master Withdrawal Switch */}
            <View style={[styles.toggleRow, { borderBottomColor: cardBorder, borderBottomWidth: 1, paddingBottom: 12, marginBottom: 12 }]}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Enable Wallet Withdrawals</Text>
                  <View
                    style={{
                      backgroundColor: appForm.walletWithdrawalEnabled ? '#dcfce7' : '#fee2e2',
                      paddingHorizontal: 8,
                      paddingVertical: 2,
                      borderRadius: 6,
                      borderWidth: 1,
                      borderColor: appForm.walletWithdrawalEnabled ? '#86efac' : '#fca5a5',
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '800',
                        color: appForm.walletWithdrawalEnabled ? '#15803d' : '#b91c1c',
                      }}
                    >
                      {appForm.walletWithdrawalEnabled ? 'ENABLED' : 'BANNED / DISABLED'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.toggleSub, { color: subTextColor }]}>
                  {appForm.walletWithdrawalEnabled
                    ? 'Withdrawals active for permitted user roles selected below'
                    : 'All wallet amount withdrawals are banned system-wide'}
                </Text>
              </View>
              <Switch
                value={Boolean(appForm.walletWithdrawalEnabled)}
                onValueChange={(v) => updateAppField('walletWithdrawalEnabled', v)}
                trackColor={{ false: '#475569', true: '#16a34a' }}
              />
            </View>

            {/* Quick Preset Buttons */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
              <TouchableOpacity
                onPress={handleSelectAllWithdrawalRoles}
                style={{
                  backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: cardBorder,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: textColor }}>Select All Roles</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSelectPartnersAndAdvisorsOnly}
                style={{
                  backgroundColor: '#e0e7ff',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: '#c7d2fe',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#4338ca' }}>Partners & Doctors Only</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleClearAllWithdrawalRoles}
                style={{
                  backgroundColor: '#fee2e2',
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: '#fca5a5',
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#b91c1c' }}>Clear All (Ban All)</Text>
              </TouchableOpacity>
            </View>

            {/* Role Checkboxes List */}
            <View style={{ gap: 8, maxHeight: 420 }}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {ALL_SYSTEM_ROLES.map((role) => {
                  const allowed = isRoleAllowed(role.key);
                  return (
                    <TouchableOpacity
                      key={role.key}
                      activeOpacity={0.75}
                      onPress={() => toggleRoleWithdrawal(role.key)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: 10,
                        borderRadius: RADIUS.md,
                        backgroundColor: allowed ? (isDark ? '#064e3b22' : '#f0fdf4') : innerBg,
                        borderWidth: 1,
                        borderColor: allowed ? '#10b981' : cardBorder,
                        gap: 10,
                      }}
                    >
                      {/* Checkbox and Role Info */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <Ionicons
                          name={allowed ? 'checkbox' : 'square-outline'}
                          size={22}
                          color={allowed ? '#10b981' : '#94a3b8'}
                        />
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: role.color + '22',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name={role.icon} size={15} color={role.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={{ fontSize: 12.5, fontWeight: '700', color: textColor }}>{role.name}</Text>
                            <View
                              style={{
                                backgroundColor: isDark ? '#334155' : '#e2e8f0',
                                paddingHorizontal: 5,
                                paddingVertical: 1,
                                borderRadius: 4,
                              }}
                            >
                              <Text style={{ fontSize: 9.5, fontWeight: '800', color: subTextColor }}>{role.roleBadge}</Text>
                            </View>
                          </View>
                          <Text style={{ fontSize: 11, color: subTextColor, marginTop: 1 }} numberOfLines={1}>
                            {role.description}
                          </Text>
                        </View>
                      </View>

                      {/* Status Pill Badge */}
                      <View
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 3,
                          borderRadius: 6,
                          backgroundColor: allowed ? '#dcfce7' : (isDark ? '#334155' : '#f1f5f9'),
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: '800',
                            color: allowed ? '#15803d' : '#94a3b8',
                          }}
                        >
                          {allowed ? 'PERMITTED' : 'BLOCKED'}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Summary Count Bar */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginTop: 12,
                paddingTop: 10,
                borderTopWidth: 1,
                borderTopColor: cardBorder,
              }}
            >
              <Text style={{ fontSize: 11, color: subTextColor, fontWeight: '600' }}>
                Active Authorization: {allowedWithdrawalRoles.length} of {ALL_SYSTEM_ROLES.length} roles permitted
              </Text>
              {!appForm.walletWithdrawalEnabled && (
                <Text style={{ fontSize: 11, color: '#ef4444', fontWeight: '700' }}>
                  ⚠️ Master toggle is OFF
                </Text>
              )}
            </View>
          </View>
        )}



        {/* 5. AgriStore Marketplace Rules */}
        {isVisible('ECOMMERCE_RULES') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }, isDesktop && styles.cardHalf]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#ffedd5' }]}>
                <Ionicons name="cart" size={20} color="#ea580c" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>AgriStore Marketplace Rules</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>Logistics partner rates, free shipping limits, COD & seller rules</Text>
              </View>
            </View>

            {/* Active Logistics Partner Section */}
            <View style={[styles.logisticsBox, { backgroundColor: innerBg, borderColor: cardBorder }]}>
              <View style={styles.logisticsHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={{ fontSize: 16 }}>{activeLogisticsPartner.logo}</Text>
                  <Text style={[styles.logisticsTitle, { color: textColor }]}>
                    Active Logistics Partner: <Text style={{ color: '#16a34a', fontWeight: '800' }}>{activeLogisticsPartner.name}</Text>
                  </Text>
                </View>
                <View style={[styles.activeRateBadge, { backgroundColor: isLight ? '#dcfce7' : '#052e16' }]}>
                  <Text style={[styles.activeRateBadgeText, { color: '#16a34a' }]}>
                    Active Rate: ₹{(intForm.product?.baseShippingCharge ?? activeLogisticsPartner.defaultFee).toFixed(2)}
                  </Text>
                </View>
              </View>
              <Text style={[styles.logisticsSub, { color: subTextColor }]}>
                Standard delivery fee is dynamically determined by the active courier partner. Select a courier below to auto-switch standard delivery fees:
              </Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.partnerScroll}>
                {LOGISTICS_PARTNERS.map((p) => {
                  const isSelected = p.id === activeLogisticsPartner.id;
                  const partnerRate = partnerDeliveryFees[p.id] ?? p.defaultFee;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.partnerChip,
                        {
                          backgroundColor: isSelected ? (isLight ? '#f0fdf4' : '#14532d33') : (isLight ? '#ffffff' : '#1e293b'),
                          borderColor: isSelected ? '#16a34a' : cardBorder,
                        },
                      ]}
                      onPress={() => handleSelectActiveLogistics(p)}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 15 }}>{p.logo}</Text>
                        <Text style={[styles.partnerName, { color: isSelected ? '#16a34a' : textColor }]}>{p.name}</Text>
                        {isSelected && <Ionicons name="checkmark-circle" size={14} color="#16a34a" />}
                      </View>
                      <Text style={[styles.partnerFeeText, { color: isSelected ? '#15803d' : subTextColor }]}>
                        ₹{partnerRate}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                  <Text style={[styles.label, { color: textColor, marginBottom: 0 }]}>Standard Delivery Fee (₹)</Text>
                  <View style={[styles.miniBadge, { backgroundColor: isLight ? '#dcfce7' : '#064e3b' }]}>
                    <Text style={{ fontSize: 10, color: '#16a34a', fontWeight: '700' }}>{activeLogisticsPartner.name}</Text>
                  </View>
                </View>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: '#16a34a', color: textColor, fontWeight: '700' }]}
                  keyboardType="numeric"
                  value={String(intForm.product?.baseShippingCharge ?? activeLogisticsPartner.defaultFee)}
                  onChangeText={(t) => handleUpdateStandardFee(parseFloat(t) || 0)}
                />
                <Text style={{ fontSize: 10.5, color: subTextColor, marginTop: 3 }}>
                  Determined by {activeLogisticsPartner.name}. Customizing here updates the partner rate.
                </Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Free Delivery Minimum (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(intForm.product?.freeDeliveryThreshold ?? 499)}
                  onChangeText={(t) => updateProductField('freeDeliveryThreshold', parseFloat(t) || 0)}
                />
                <Text style={{ fontSize: 10.5, color: subTextColor, marginTop: 3 }}>
                  Orders at or above this cart value get free delivery automatically.
                </Text>
              </View>

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
    gap: 10,
    flexWrap: 'wrap',
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
  logisticsBox: {
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginBottom: 14,
    gap: 8,
  },
  logisticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  logisticsTitle: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: FONT.bold,
  },
  activeRateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.sm,
  },
  activeRateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  logisticsSub: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  partnerScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  partnerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    minWidth: 130,
  },
  partnerName: {
    fontSize: 12,
    fontWeight: '700',
  },
  partnerFeeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  miniBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
  },
});
