import React, { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
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
import {
  useFarmerPlanPricing,
  useUpdateFarmerPlanPricing,
  useAllFarmerPlanCoupons,
} from '@/src/hooks/useFarmerPlan';
import { useAllCoupons } from '@/src/hooks/useCoupons';
import { AppSettings, UpdateAppSettingsPayload } from '@/src/api/appSettings.api';
import { FarmerPlanPricing, FarmerPlanType } from '@/src/api/farmerPlans.api';
import { formatInr } from '@/src/utils/formatInr';

type PlanOffersCategoryFilter =
  | 'ALL'
  | 'SUBSCRIPTION_PLANS'
  | 'MEMBERSHIP_PASSES'
  | 'REFERRAL_REWARDS'
  | 'PARTNER_SCHEMES'
  | 'DISCOUNT_COUPONS';

interface CategoryPill {
  key: PlanOffersCategoryFilter;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORY_PILLS: CategoryPill[] = [
  { key: 'ALL', label: 'All Plans & Offers', icon: 'grid-outline' },
  { key: 'SUBSCRIPTION_PLANS', label: 'Subscription Plans & Trial', icon: 'ribbon-outline' },
  { key: 'MEMBERSHIP_PASSES', label: 'Membership Passes', icon: 'card-outline' },
  { key: 'REFERRAL_REWARDS', label: 'Referral Rewards', icon: 'gift-outline' },
  { key: 'PARTNER_SCHEMES', label: 'Partner Schemes', icon: 'people-outline' },
  { key: 'DISCOUNT_COUPONS', label: 'Coupons & Market Deals', icon: 'pricetag-outline' },
];

export default function SettingPlanOffersSetup() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 860));
  const { isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  // Queries
  const { data: rawAppSettings, isLoading: isAppLoading, refetch: refetchApp } = useAppSettings();
  const { data: pricingList, isLoading: isPricingLoading, refetch: refetchPricing } = useFarmerPlanPricing();
  const { data: couponsList } = useAllCoupons();
  const { data: farmerCouponsList } = useAllFarmerPlanCoupons();

  // Mutations
  const updateAppMutation = useUpdateAppSettings();
  const updatePricingMutation = useUpdateFarmerPlanPricing();

  // Local state
  const [appForm, setAppForm] = useState<Partial<AppSettings>>({});
  const [activeCategory, setActiveCategory] = useState<PlanOffersCategoryFilter>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Modal for editing plan pricing
  const [editingPricing, setEditingPricing] = useState<FarmerPlanPricing | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editMrp, setEditMrp] = useState('');
  const [editDays, setEditDays] = useState('');
  const [editPartnerShare, setEditPartnerShare] = useState('');
  const [isSavingPricing, setIsSavingPricing] = useState(false);

  useEffect(() => {
    if (rawAppSettings) {
      setAppForm(rawAppSettings);
    }
  }, [rawAppSettings]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const updateAppField = (field: keyof UpdateAppSettingsPayload, val: any) => {
    setAppForm((prev) => ({ ...prev, [field]: val }));
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      const payload: UpdateAppSettingsPayload = {
        // Free Trial
        freeTrialEnabled: Boolean(appForm.freeTrialEnabled ?? true),
        freeTrialDays: Number(appForm.freeTrialDays ?? 10),
        freeTrialPlan: ((appForm.freeTrialPlan as any) === 'FARMER_FREE' || !appForm.freeTrialPlan) ? 'SUPER' : appForm.freeTrialPlan,

        // Membership & Certification Fees
        gardenerProCardPrice: Number(appForm.gardenerProCardPrice ?? 299),
        gardenerVipCardPrice: Number(appForm.gardenerVipCardPrice ?? 999),
        advisorCertificationFee: Number(appForm.advisorCertificationFee ?? 999),
        advisorCertificationDiscount: Number(appForm.advisorCertificationDiscount ?? 0),

        // Farmer Referral Rewards
        newUserSignupBonusAmount: Number(appForm.newUserSignupBonusAmount ?? 10),
        referralSignupBonusAmount: Number(appForm.referralSignupBonusAmount ?? 10),
        referralPaidPlanBonusAmount: Number(appForm.referralPaidPlanBonusAmount ?? 50),

        // Seasonal Referral Campaign
        referralOfferSchemeEnabled: Boolean(appForm.referralOfferSchemeEnabled),
        referralOfferSchemeName: appForm.referralOfferSchemeName || '',
        referralOfferExpiryDate: appForm.referralOfferExpiryDate || '',
        referralOfferReferrerBonus: Number(appForm.referralOfferReferrerBonus ?? 1),
        referralOfferNewUserBonus: Number(appForm.referralOfferNewUserBonus ?? 5),
        referralOfferPaidPlanBonus: Number(appForm.referralOfferPaidPlanBonus ?? 9),

        // Partner Schemes
        partnerRefereeSignupBonusAmount: Number(appForm.partnerRefereeSignupBonusAmount ?? 20),
        partnerReferralCommissionAmount: Number(appForm.partnerReferralCommissionAmount ?? 100),
        partnerReferralPaidPlanBonusAmount: Number(appForm.partnerReferralPaidPlanBonusAmount ?? 100),

        // Seasonal Partner Campaign
        partnerOfferSchemeEnabled: Boolean(appForm.partnerOfferSchemeEnabled),
        partnerOfferSchemeName: appForm.partnerOfferSchemeName || '',
        partnerOfferExpiryDate: appForm.partnerOfferExpiryDate || '',
        partnerOfferReferrerBonus: Number(appForm.partnerOfferReferrerBonus ?? 100),
        partnerOfferNewUserBonus: Number(appForm.partnerOfferNewUserBonus ?? 20),
        partnerOfferPaidPlanBonus: Number(appForm.partnerOfferPaidPlanBonus ?? 100),
      };

      await updateAppMutation.mutateAsync(payload);
      await refetchApp();
      showToast('All plan & offer settings saved successfully!');
    } catch (err: any) {
      const errorDetail = err?.response?.data?.message || err?.message || 'Network error';
      const msg = Array.isArray(errorDetail) ? errorDetail.join(', ') : String(errorDetail);
      showToast(`Save failed: ${msg}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openPricingModal = (pricing: FarmerPlanPricing) => {
    setEditingPricing(pricing);
    setEditPrice(String(pricing.price || ''));
    setEditMrp(String(pricing.mrp || ''));
    setEditDays(String(pricing.billingPeriodDays || ''));
    setEditPartnerShare(String(pricing.partnerShareValue || ''));
  };

  const handleSavePricing = async () => {
    if (!editingPricing) return;
    try {
      setIsSavingPricing(true);
      await updatePricingMutation.mutateAsync({
        plan: editingPricing.plan,
        payload: {
          price: parseFloat(editPrice) || 0,
          mrp: parseFloat(editMrp) || 0,
          billingPeriodDays: parseInt(editDays, 10) || 30,
          partnerShareValue: parseFloat(editPartnerShare) || 0,
        },
      });
      await refetchPricing();
      setEditingPricing(null);
      showToast(`Updated pricing for ${editingPricing.plan} plan!`);
    } catch (err: any) {
      Alert.alert('Update Failed', err.message || 'Could not update pricing');
    } finally {
      setIsSavingPricing(false);
    }
  };

  const isVisible = (cat: PlanOffersCategoryFilter) => {
    return activeCategory === 'ALL' || activeCategory === cat;
  };

  const totalCouponsCount = (couponsList?.length || 0) + (farmerCouponsList?.length || 0);

  return (
    <View style={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={styles.toastCard}>
            <Ionicons name="checkmark-circle" size={18} color="#10b981" />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

      {/* Top Action Bar */}
      <View
        style={[
          styles.topBarCard,
          {
            backgroundColor: cardBg,
            borderColor: cardBorder,
            flexDirection: isDesktop ? 'row' : 'column',
            alignItems: isDesktop ? 'center' : 'stretch',
          },
        ]}
      >
        <View style={styles.topBarLeft}>
          <View style={[styles.topBarIcon, { backgroundColor: isLight ? '#f3e8ff' : '#3b0764' }]}>
            <Ionicons name="pricetags" size={20} color="#9333ea" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.topBarTitle, { color: textColor }]}>Plan & Offers</Text>
              <View style={[styles.syncBadge, { backgroundColor: isLight ? '#dcfce7' : '#064e3b' }]}>
                <View style={styles.syncDot} />
                <Text style={[styles.syncText, { color: '#16a34a' }]}>Live Central Sync</Text>
              </View>
            </View>
            <Text style={[styles.topBarSubtitle, { color: subTextColor }]}>
              Subscription plans, free trials, VIP membership passes, referral rewards & promo schemes
            </Text>
          </View>
        </View>

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            onPress={handleSaveSettings}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Ionicons name="checkmark-done-outline" size={16} color="#ffffff" />
            )}
            <Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save All Changes'}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter Pills */}
      <View style={styles.categoryPillsWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryPillsScroll}>
          {CATEGORY_PILLS.map((pill) => {
            const isActive = activeCategory === pill.key;
            return (
              <TouchableOpacity
                key={pill.key}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isActive ? (isLight ? '#9333ea' : '#7e22ce') : isLight ? '#ffffff' : '#1e293b',
                    borderColor: isActive ? '#9333ea' : cardBorder,
                  },
                ]}
                onPress={() => setActiveCategory(pill.key)}
              >
                <Ionicons
                  name={pill.icon}
                  size={15}
                  color={isActive ? '#ffffff' : isLight ? '#475569' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isActive ? '#ffffff' : isLight ? '#334155' : '#cbd5e1' },
                  ]}
                >
                  {pill.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Main Content Sections */}
      <View style={{ gap: 16 }}>
        {/* 1. Free Trial & Subscription Plans */}
        {isVisible('SUBSCRIPTION_PLANS') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#fce7f3' }]}>
                <Ionicons name="ribbon" size={20} color="#db2777" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Free Trial & Subscription Plans</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>
                  Signup trial access duration, tier assignment and live farmer membership rates
                </Text>
              </View>
            </View>

            {/* Trial Toggle Row */}
            <View style={[styles.toggleRow, { borderBottomColor: cardBorder, borderBottomWidth: 1, paddingBottom: 12, marginBottom: 12 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleLabel, { color: textColor }]}>Enable Free Trial on Signup</Text>
                <Text style={[styles.toggleSub, { color: subTextColor }]}>
                  Automatically grant new farmers instant access upon registration
                </Text>
              </View>
              <Switch
                value={Boolean(appForm.freeTrialEnabled ?? true)}
                onValueChange={(v) => updateAppField('freeTrialEnabled', v)}
                trackColor={{ false: '#475569', true: '#db2777' }}
              />
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Free Trial Duration (Days)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.freeTrialDays ?? 10)}
                  onChangeText={(t) => updateAppField('freeTrialDays', parseInt(t, 10) || 0)}
                />
              </View>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Trial Plan Tier</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  value={String(appForm.freeTrialPlan || 'SUPER')}
                  placeholder="SUPER / SMART / PRO"
                  placeholderTextColor={subTextColor}
                  onChangeText={(t) => updateAppField('freeTrialPlan', t.toUpperCase() as any)}
                />
              </View>
            </View>

            {/* Live Pricing Tiers Table / Cards */}
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <View>
                  <Text style={[styles.sectionSubtitle, { color: textColor }]}>Live Farmer Membership Pricing</Text>
                  <Text style={{ fontSize: 12, color: subTextColor }}>Configured duration rates, MRP and partner commissions</Text>
                </View>
                <TouchableOpacity
                  style={[styles.smallLinkBtn, { borderColor: cardBorder }]}
                  onPress={() => router.push('/admin/(tabs)/super-coupons' as any)}
                >
                  <Ionicons name="open-outline" size={13} color="#9333ea" />
                  <Text style={{ fontSize: 12, color: '#9333ea', fontWeight: '600' }}>Manage Coupons</Text>
                </TouchableOpacity>
              </View>

              {isPricingLoading ? (
                <ActivityIndicator size="small" color="#9333ea" style={{ marginVertical: 16 }} />
              ) : !pricingList || pricingList.length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: cardBorder }]}>
                  <Text style={{ color: subTextColor, fontSize: 13 }}>No pricing plans found. Configure via server seed.</Text>
                </View>
              ) : (
                <View style={[styles.pricingGrid, isDesktop && styles.pricingGridDesktop]}>
                  {pricingList.map((item) => (
                    <View
                      key={item.id}
                      style={[
                        styles.pricingCard,
                        { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: cardBorder },
                      ]}
                    >
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <View>
                          <View style={styles.planBadge}>
                            <Text style={styles.planBadgeText}>{item.plan}</Text>
                          </View>
                          <Text style={[styles.pricingPeriod, { color: textColor }]}>
                            {item.billingPeriodDays} Days Duration
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.editIconBtn, { backgroundColor: isLight ? '#f3e8ff' : '#3b0764' }]}
                          onPress={() => openPricingModal(item)}
                        >
                          <Ionicons name="pencil" size={13} color="#9333ea" />
                        </TouchableOpacity>
                      </View>

                      <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                        <Text style={[styles.pricingPrice, { color: textColor }]}>₹{item.price}</Text>
                        {item.mrp ? (
                          <Text style={[styles.pricingMrp, { color: subTextColor }]}>MRP ₹{item.mrp}</Text>
                        ) : null}
                      </View>

                      <View style={{ marginTop: 8, paddingTop: 8, borderTopColor: cardBorder, borderTopWidth: 1 }}>
                        <Text style={{ fontSize: 11, color: subTextColor }}>
                          Partner Share: {item.partnerShareType === 'PERCENTAGE' ? `${item.partnerShareValue}%` : `₹${item.partnerShareValue}`}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* 2. Membership Passes & Professional Certifications */}
        {isVisible('MEMBERSHIP_PASSES') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#dcfce7' }]}>
                <Ionicons name="card" size={20} color="#16a34a" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Membership Passes & Certifications</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>
                  Gardener Pro & VIP membership cards and agronomist verification exams
                </Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Gardener Pro Card Price (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.gardenerProCardPrice ?? 299)}
                  onChangeText={(t) => updateAppField('gardenerProCardPrice', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Annual membership card for urban home garden care</Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Gardener VIP Lifetime Card Price (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.gardenerVipCardPrice ?? 999)}
                  onChangeText={(t) => updateAppField('gardenerVipCardPrice', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>VIP membership with priority doctor appointments</Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Advisor Certification Exam Fee (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.advisorCertificationFee ?? 999)}
                  onChangeText={(t) => updateAppField('advisorCertificationFee', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Licensing & background verification fee for plant doctors</Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Certification Discount (%)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.advisorCertificationDiscount ?? 0)}
                  onChangeText={(t) => updateAppField('advisorCertificationDiscount', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Early registration discount applied at exam checkout</Text>
              </View>
            </View>
          </View>
        )}

        {/* 3. Farmer Referral Rewards */}
        {isVisible('REFERRAL_REWARDS') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Ionicons name="gift" size={20} color="#d97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Farmer Referral & Welcome Rewards</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>
                  Instant signup wallet credits and bonuses for inviting new farmers
                </Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>New Farmer Welcome Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.newUserSignupBonusAmount ?? 10)}
                  onChangeText={(t) => updateAppField('newUserSignupBonusAmount', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Credited to new farmer wallet immediately on registration</Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Referrer Farmer Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.referralSignupBonusAmount ?? 10)}
                  onChangeText={(t) => updateAppField('referralSignupBonusAmount', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Credited to referring farmer when their contact joins</Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Paid Plan Upgrade Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.referralPaidPlanBonusAmount ?? 50)}
                  onChangeText={(t) => updateAppField('referralPaidPlanBonusAmount', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Reward when referred user buys their first subscription</Text>
              </View>
            </View>

            {/* Seasonal Referral Scheme */}
            <View style={[styles.subSchemeBox, { backgroundColor: isLight ? '#fffbeb' : '#1c1917', borderColor: '#fde68a' }]}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Seasonal Promotional Referral Campaign</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>
                    Override standard rewards with a limited-time bonus scheme
                  </Text>
                </View>
                <Switch
                  value={Boolean(appForm.referralOfferSchemeEnabled)}
                  onValueChange={(v) => updateAppField('referralOfferSchemeEnabled', v)}
                  trackColor={{ false: '#475569', true: '#d97706' }}
                />
              </View>

              {appForm.referralOfferSchemeEnabled && (
                <View style={[styles.fieldsGrid, { marginTop: 12 }]}>
                  <View style={styles.fieldItem}>
                    <Text style={[styles.label, { color: textColor }]}>Campaign Scheme Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                      value={appForm.referralOfferSchemeName || ''}
                      placeholder="e.g. Rabi Harvest Rewards 2026"
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
                  <View style={styles.fieldItem}>
                    <Text style={[styles.label, { color: textColor }]}>Campaign Referrer Bonus (₹)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                      keyboardType="numeric"
                      value={String(appForm.referralOfferReferrerBonus ?? 1)}
                      onChangeText={(t) => updateAppField('referralOfferReferrerBonus', parseFloat(t) || 0)}
                    />
                  </View>
                  <View style={styles.fieldItem}>
                    <Text style={[styles.label, { color: textColor }]}>Campaign New User Bonus (₹)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                      keyboardType="numeric"
                      value={String(appForm.referralOfferNewUserBonus ?? 5)}
                      onChangeText={(t) => updateAppField('referralOfferNewUserBonus', parseFloat(t) || 0)}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 4. Business Partner Schemes */}
        {isVisible('PARTNER_SCHEMES') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#eff6ff' }]}>
                <Ionicons name="briefcase" size={20} color="#2563eb" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Business Partner & Franchise Schemes</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>
                  Commissions, onboarding rewards and paid plan conversions for business partners
                </Text>
              </View>
            </View>

            <View style={styles.fieldsGrid}>
              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Partner Referee Welcome Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.partnerRefereeSignupBonusAmount ?? 20)}
                  onChangeText={(t) => updateAppField('partnerRefereeSignupBonusAmount', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Credited to client joining through partner referral link</Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Partner Referral Commission (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.partnerReferralCommissionAmount ?? 100)}
                  onChangeText={(t) => updateAppField('partnerReferralCommissionAmount', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Commission paid to partner on client registration</Text>
              </View>

              <View style={styles.fieldItem}>
                <Text style={[styles.label, { color: textColor }]}>Partner Paid Plan Conversion Bonus (₹)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                  keyboardType="numeric"
                  value={String(appForm.partnerReferralPaidPlanBonusAmount ?? 100)}
                  onChangeText={(t) => updateAppField('partnerReferralPaidPlanBonusAmount', parseFloat(t) || 0)}
                />
                <Text style={styles.fieldHint}>Additional commission on subscriber conversion</Text>
              </View>
            </View>

            {/* Seasonal Partner Campaign */}
            <View style={[styles.subSchemeBox, { backgroundColor: isLight ? '#f0f9ff' : '#082f49', borderColor: '#bae6fd' }]}>
              <View style={styles.toggleRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleLabel, { color: textColor }]}>Seasonal Partner Incentive Campaign</Text>
                  <Text style={[styles.toggleSub, { color: subTextColor }]}>
                    Special incentive scheme for partners and franchise holders
                  </Text>
                </View>
                <Switch
                  value={Boolean(appForm.partnerOfferSchemeEnabled)}
                  onValueChange={(v) => updateAppField('partnerOfferSchemeEnabled', v)}
                  trackColor={{ false: '#475569', true: '#2563eb' }}
                />
              </View>

              {appForm.partnerOfferSchemeEnabled && (
                <View style={[styles.fieldsGrid, { marginTop: 12 }]}>
                  <View style={styles.fieldItem}>
                    <Text style={[styles.label, { color: textColor }]}>Campaign Scheme Name</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                      value={appForm.partnerOfferSchemeName || ''}
                      placeholder="e.g. Master Franchise Accelerator"
                      placeholderTextColor={subTextColor}
                      onChangeText={(t) => updateAppField('partnerOfferSchemeName', t)}
                    />
                  </View>
                  <View style={styles.fieldItem}>
                    <Text style={[styles.label, { color: textColor }]}>Campaign Expiry Date</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                      value={appForm.partnerOfferExpiryDate || ''}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={subTextColor}
                      onChangeText={(t) => updateAppField('partnerOfferExpiryDate', t)}
                    />
                  </View>
                  <View style={styles.fieldItem}>
                    <Text style={[styles.label, { color: textColor }]}>Campaign Partner Bonus (₹)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                      keyboardType="numeric"
                      value={String(appForm.partnerOfferReferrerBonus ?? 100)}
                      onChangeText={(t) => updateAppField('partnerOfferReferrerBonus', parseFloat(t) || 0)}
                    />
                  </View>
                  <View style={styles.fieldItem}>
                    <Text style={[styles.label, { color: textColor }]}>Campaign Client Bonus (₹)</Text>
                    <TextInput
                      style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                      keyboardType="numeric"
                      value={String(appForm.partnerOfferNewUserBonus ?? 20)}
                      onChangeText={(t) => updateAppField('partnerOfferNewUserBonus', parseFloat(t) || 0)}
                    />
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* 5. Discount Coupons & Market Deals Central Hub */}
        {isVisible('DISCOUNT_COUPONS') && (
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: '#f3e8ff' }]}>
                <Ionicons name="pricetag" size={20} color="#9333ea" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: textColor }]}>Promo Vouchers & Market Deals</Text>
                <Text style={[styles.cardSub, { color: subTextColor }]}>
                  Platform discount coupons, seed vouchers and AgriStore flash deals
                </Text>
              </View>
            </View>

            {/* Quick Stats Grid */}
            <View style={[styles.statsRow, !isDesktop && styles.statsRowMobile]}>
              <View style={[styles.statBox, { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: cardBorder }]}>
                <Ionicons name="ticket-outline" size={20} color="#9333ea" />
                <View>
                  <Text style={[styles.statValue, { color: textColor }]}>{totalCouponsCount}</Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>Coupons & Passes Active</Text>
                </View>
              </View>

              <View style={[styles.statBox, { backgroundColor: isLight ? '#f8fafc' : '#0f172a', borderColor: cardBorder }]}>
                <Ionicons name="flash-outline" size={20} color="#f59e0b" />
                <View>
                  <Text style={[styles.statValue, { color: textColor }]}>Live Deals</Text>
                  <Text style={[styles.statLabel, { color: subTextColor }]}>AgriStore Flash Offers</Text>
                </View>
              </View>
            </View>

            {/* Action Launchers */}
            <View style={[styles.launchersGrid, isDesktop && styles.launchersGridDesktop]}>
              <TouchableOpacity
                style={[styles.launcherCard, { backgroundColor: isLight ? '#ffffff' : '#1e293b', borderColor: cardBorder }]}
                onPress={() => router.push('/admin/(tabs)/super-coupons' as any)}
              >
                <View style={[styles.launcherIcon, { backgroundColor: isLight ? '#f3e8ff' : '#3b0764' }]}>
                  <Ionicons name="ticket" size={22} color="#9333ea" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.launcherTitle, { color: textColor }]}>Coupons & Subscription Passes</Text>
                  <Text style={[styles.launcherDesc, { color: subTextColor }]}>
                    Create promo codes, grant plan days, and issue partner coupon batches
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#9333ea" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.launcherCard, { backgroundColor: isLight ? '#ffffff' : '#1e293b', borderColor: cardBorder }]}
                onPress={() => router.push('/admin/(tabs)/admin-offers' as any)}
              >
                <View style={[styles.launcherIcon, { backgroundColor: isLight ? '#fef3c7' : '#78350f' }]}>
                  <Ionicons name="flash" size={22} color="#d97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.launcherTitle, { color: textColor }]}>Market Offers & Flash Deals</Text>
                  <Text style={[styles.launcherDesc, { color: subTextColor }]}>
                    Configure flash sales, bundle discounts, and promotional banners
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={18} color="#d97706" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Pricing Edit Modal */}
      {editingPricing && (
        <Modal transparent animationType="fade" visible={Boolean(editingPricing)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={[styles.modalTitle, { color: textColor }]}>
                    Edit Pricing: {editingPricing.plan}
                  </Text>
                  <Text style={[styles.modalSub, { color: subTextColor }]}>
                    Adjust duration, subscriber price, and partner commission
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditingPricing(null)}>
                  <Ionicons name="close" size={22} color={subTextColor} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 12, marginTop: 16 }}>
                <View>
                  <Text style={[styles.label, { color: textColor }]}>Billing Period (Days)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                    keyboardType="numeric"
                    value={editDays}
                    onChangeText={setEditDays}
                  />
                </View>

                <View>
                  <Text style={[styles.label, { color: textColor }]}>Price (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                    keyboardType="numeric"
                    value={editPrice}
                    onChangeText={setEditPrice}
                  />
                </View>

                <View>
                  <Text style={[styles.label, { color: textColor }]}>MRP (₹)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                    keyboardType="numeric"
                    value={editMrp}
                    onChangeText={setEditMrp}
                  />
                </View>

                <View>
                  <Text style={[styles.label, { color: textColor }]}>
                    Partner Share ({editingPricing.partnerShareType === 'PERCENTAGE' ? '%' : '₹'})
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: innerBg, borderColor: cardBorder, color: textColor }]}
                    keyboardType="numeric"
                    value={editPartnerShare}
                    onChangeText={setEditPartnerShare}
                  />
                </View>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalCancelBtn, { borderColor: cardBorder }]}
                  onPress={() => setEditingPricing(null)}
                >
                  <Text style={[styles.modalCancelText, { color: subTextColor }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalSaveBtn, isSavingPricing && { opacity: 0.7 }]}
                  onPress={handleSavePricing}
                  disabled={isSavingPricing}
                >
                  {isSavingPricing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.modalSaveText}>Update Pricing</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 40,
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  toastText: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  topBarCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
    marginBottom: 16,
    justifyContent: 'space-between',
    gap: 12,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topBarIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  topBarSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16a34a',
  },
  syncText: {
    fontSize: 11,
    fontWeight: '700',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#9333ea',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  categoryPillsWrap: {
    marginBottom: 16,
  },
  categoryPillsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 16,
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
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  smallLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  toggleLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  fieldsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  fieldItem: {
    flex: 1,
    minWidth: 240,
    gap: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
  },
  fieldHint: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  pricingGrid: {
    gap: 10,
  },
  pricingGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pricingCard: {
    flex: 1,
    minWidth: 200,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  planBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#9333ea',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  planBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
  },
  pricingPeriod: {
    fontSize: 12,
    fontWeight: '600',
  },
  pricingPrice: {
    fontSize: 18,
    fontWeight: '800',
  },
  pricingMrp: {
    fontSize: 12,
    textDecorationLine: 'line-through',
  },
  editIconBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: RADIUS.md,
    padding: 20,
    alignItems: 'center',
  },
  subSchemeBox: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statsRowMobile: {
    flexDirection: 'column',
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
  },
  launchersGrid: {
    gap: 12,
  },
  launchersGridDesktop: {
    flexDirection: 'row',
  },
  launcherCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  launcherIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launcherTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  launcherDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalSub: {
    fontSize: 12,
    marginTop: 2,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalSaveBtn: {
    backgroundColor: '#9333ea',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
  },
  modalSaveText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

