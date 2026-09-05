import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAllCoupons, useCouponRedemptions, useCreateCoupon, useIssuePartnerCoupon, useRemoveCoupon } from '@/src/hooks/useCoupons';
import {
  useAllFarmerPlanCoupons,
  useCreateFarmerPlanCoupon,
  useDeactivateFarmerPlanCoupon,
  useFarmerPlanPricing,
  useGrantFarmerPlanDays,
  useUpdateFarmerPlanPricing,
  useDeleteFarmerPlanPricing,
  useCouponFinancialSummary,
  useAdminDocsList,
  useDownloadAdminDoc,
} from '@/src/hooks/useFarmerPlan';

import { LANGUAGE_OPTIONS } from '@/src/constants/translations';
import { useCouponSettings, useUpdateCouponSettings } from '@/src/hooks/useCouponSettings';

import type { CouponSettings } from '@/src/api/couponSettings.api';
import { useUsersList } from '@/src/hooks/useUsersAdmin';
import { Coupon, DiscountValueType } from '@/src/types/api';
import type { FarmerPlanPricing, FarmerPlanType } from '@/src/api/farmerPlans.api';
import { CopyButton } from '@/src/components/CopyButton';
import { PlanPricingSection } from './super-settings';
import { RedeemForFarmerModal } from '@/src/components/RedeemForFarmerModal';
import { CouponCardPreview, FarmerPlanCouponCardPreview, useShareCouponAsJpg } from '@/src/components/CouponCardPreview';
import { usePendingFarmerPlanPayments } from '@/src/hooks/useFarmerPlanPayments';
import { FarmerPlanPaymentCard, FarmerPlanPaymentReviewModal } from './super-accounts';
import type { FarmerPlanPaymentRequest } from '@/src/api/farmerPlanPayments.api';

const theme = RoleThemes.SUPER_ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/** Coupon-card preview with a Download-as-JPG / native share button — for the generic Coupon model (Referral/Commission/Special). */
function ShareCouponModal({ coupon, visible, onClose }: { coupon: Coupon | null; visible: boolean; onClose: () => void }) {
  const { cardShotRef, isSharing, shareCouponAsJpg } = useShareCouponAsJpg();
  if (!coupon) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { alignItems: 'center' }]}>
          <View style={[styles.modalHeaderRow, { width: '100%' }]}>
            <Text style={styles.modalTitle}>Share Coupon</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ViewShot ref={cardShotRef} options={{ format: 'jpg', quality: 0.95 }}>
            <CouponCardPreview coupon={coupon} />
          </ViewShot>

          <TouchableOpacity
            style={[styles.submitBtn, { width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
            activeOpacity={0.85}
            disabled={isSharing}
            onPress={() => shareCouponAsJpg(`Coupon-${coupon.code}`)}
          >
            {isSharing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Download as JPG</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/** Same as ShareCouponModal, but for a Farmer/Advisor Plan coupon (days-granted headline instead of a discount). */
function ShareFarmerPlanCouponModal({
  coupon,
  visible,
  onClose,
}: {
  coupon: { code: string; plan: string; daysGranted: number; expiresAt?: string | Date | null; mrp?: number | string | null } | null;
  visible: boolean;
  onClose: () => void;
}) {
  const { cardShotRef, isSharing, shareCouponAsJpg } = useShareCouponAsJpg();
  if (!coupon) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { alignItems: 'center' }]}>
          <View style={[styles.modalHeaderRow, { width: '100%' }]}>
            <Text style={styles.modalTitle}>Share Coupon</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ViewShot ref={cardShotRef} options={{ format: 'jpg', quality: 0.95 }}>
            <FarmerPlanCouponCardPreview coupon={coupon} />
          </ViewShot>

          <TouchableOpacity
            style={[styles.submitBtn, { width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
            activeOpacity={0.85}
            disabled={isSharing}
            onPress={() => shareCouponAsJpg(`Coupon-${coupon.code}`)}
          >
            {isSharing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="download-outline" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Download as JPG</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/** Big collapsible section for one of the 4 coupon categories under the Coupon Master heading. */
function CategoryCollapse({
  title,
  icon,
  defaultExpanded,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  return (
    <View style={[styles.categoryCard, premiumShadow('#0f172a', 'sm'), expanded && styles.categoryCardExpanded]}>
      <TouchableOpacity
        style={styles.categoryHeaderRow}
        activeOpacity={0.85}
        onPress={() => {
          tap();
          setExpanded((e) => !e);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.categoryIconBg}>
            <Ionicons name={icon} size={16} color={theme.primary} />
          </View>
          <Text style={styles.categoryTitle}>{title}</Text>
        </View>
        <View style={[styles.categoryChevronBg, expanded && { backgroundColor: theme.primary }]}>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color={expanded ? '#ffffff' : theme.primary} />
        </View>
      </TouchableOpacity>
      {expanded ? <View style={{ gap: 12, marginTop: 12 }}>{children}</View> : null}
    </View>
  );
}

type CouponsTab = 'GENERATE' | 'COUPONS' | 'PRICING' | 'FEATURES' | 'REFERRAL_SETTINGS' | 'REQUESTS';

const MAIN_SUB_TABS: {
  value: CouponsTab;
  title: string;
  sub: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
  color: string;
  softBg: string;
}[] = [
  {
    value: 'REQUESTS',
    title: 'Payment Requests',
    sub: 'Approve Claims & Issue Coupons',
    icon: 'paper-plane-outline',
    activeIcon: 'paper-plane',
    color: '#8b5cf6',
    softBg: '#f3e8ff',
  },
  {
    value: 'GENERATE',
    title: 'Generate',
    sub: 'Create & Issue Codes',
    icon: 'add-circle-outline',
    activeIcon: 'add-circle',
    color: '#10b981',
    softBg: '#ecfdf5',
  },
  {
    value: 'COUPONS',
    title: 'All Coupons',
    sub: 'Browse Codes & History',
    icon: 'pricetag-outline',
    activeIcon: 'pricetag',
    color: '#0284c7',
    softBg: '#e0f2fe',
  },
  {
    value: 'PRICING',
    title: 'Plan Pricing & Splits',
    sub: 'Prices & Commission Cuts',
    icon: 'cash-outline',
    activeIcon: 'cash',
    color: '#d97706',
    softBg: '#fffbe6',
  },
  {
    value: 'FEATURES',
    title: 'Plan Features',
    sub: 'Limits & Advisory Toggles',
    icon: 'options-outline',
    activeIcon: 'options',
    color: '#6d28d9',
    softBg: '#f3e8ff',
  },
  {
    value: 'REFERRAL_SETTINGS',
    title: 'Partner Referral Coupon',
    sub: 'Referral Discount & Rates',
    icon: 'people-outline',
    activeIcon: 'people',
    color: '#e11d48',
    softBg: '#fff1f2',
  },
];

export default function SuperCouponsScreen() {
  const { data: coupons, isLoading } = useAllCoupons();
  const { data: farmerPlanCoupons } = useAllFarmerPlanCoupons();
  const { data: pendingPayments = [], isLoading: isLoadingPendingPayments } = usePendingFarmerPlanPayments();
  const [activeFarmerPlanPayment, setActiveFarmerPlanPayment] = useState<FarmerPlanPaymentRequest | null>(null);
  const [activeTab, setActiveTab] = useState<CouponsTab | null>(null);

  const allCoupons = coupons ?? [];
  const allPlanCoupons = farmerPlanCoupons ?? [];
  const now = new Date();
  const activeGenericCount = allCoupons.filter((c) => c.isActive && new Date(c.expiresAt) >= now).length;
  const activePlanCount = allPlanCoupons.filter((c) => !c.isUsed && (!c.expiresAt || new Date(c.expiresAt) >= now)).length;
  const totalActive = activeGenericCount + activePlanCount;
  const totalRedeemed = allCoupons.reduce((sum, c) => sum + c.usedCount, 0) + allPlanCoupons.filter((c) => c.isUsed).length;

  const activeMeta = MAIN_SUB_TABS.find((t) => t.value === activeTab);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Coupons & Plans</Text>
        <Text style={styles.heroSubtitle}>Generate codes, track redemptions & manage pricing</Text>

        <View style={styles.inlineStatBadge}>
          <Ionicons name="pricetag-outline" size={12} color="rgba(255,255,255,0.9)" />
          <Text style={styles.inlineStatText}>
            Active Codes: <Text style={styles.inlineStatValue}>{isLoading ? '—' : totalActive}</Text>
          </Text>
          <Text style={styles.inlineStatDot}>•</Text>
          <Ionicons name="checkmark-done-circle-outline" size={13} color="rgba(255,255,255,0.9)" />
          <Text style={styles.inlineStatText}>
            Redeemed: <Text style={styles.inlineStatValue}>{isLoading ? '—' : totalRedeemed}</Text>
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {/* If no section is open, show ONLY the Colorful Icon Cards Menu */}
        {activeTab === null ? (
          <View style={{ gap: 16 }}>
            <View style={styles.iconTabGrid}>
              {MAIN_SUB_TABS.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.iconTabCard,
                    premiumShadow(t.color, 'sm'),
                  ]}
                  activeOpacity={0.88}
                  onPress={() => {
                    tap();
                    setActiveTab(t.value);
                  }}
                >
                  <View style={[styles.iconCircleBadge, { backgroundColor: t.softBg }]}>
                    <Ionicons name={t.activeIcon} size={24} color={t.color} />
                  </View>
                  <Text style={styles.iconTabTitle}>{t.title}</Text>
                  <Text style={styles.iconTabSub}>{t.sub}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.selectPromptCard, premiumShadow('#0f172a', 'sm')]}>
              <Ionicons name="hand-left-outline" size={20} color={theme.primary} />
              <Text style={styles.selectPromptText}>Tap any icon card above to open section</Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {/* Header bar inside opened card view with BACK BUTTON */}
            <View style={[styles.openedCardHeader, { borderColor: `${activeMeta?.color}35` }]}>
              <TouchableOpacity
                style={[styles.backToTabsBtn, { backgroundColor: activeMeta?.softBg, borderColor: `${activeMeta?.color}40` }]}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  setActiveTab(null);
                }}
              >
                <Ionicons name="arrow-back" size={16} color={activeMeta?.color} />
                <Text style={[styles.backToTabsText, { color: activeMeta?.color }]}>← Back</Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[styles.headerCircleBadge, { backgroundColor: activeMeta?.color }]}>
                  <Ionicons name={activeMeta?.activeIcon} size={14} color="#ffffff" />
                </View>
                <Text style={[styles.openedCardTitle, { color: activeMeta?.color }]}>{activeMeta?.title}</Text>
              </View>
            </View>

            {activeTab === 'REQUESTS' ? (
              <View style={{ gap: 12 }}>
                <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#475569' }}>
                  Pending Payment Claims ({pendingPayments.length}):
                </Text>

                {isLoadingPendingPayments ? (
                  <ActivityIndicator color={theme.primary} />
                ) : pendingPayments.length === 0 ? (
                  <View style={[styles.categoryCard, { padding: 20, alignItems: 'center', gap: 6 }]}>
                    <Ionicons name="checkmark-done-circle-outline" size={32} color="#16a34a" />
                    <Text style={{ fontSize: 13, fontFamily: FONT.medium, color: '#64748b' }}>
                      No pending payment claims to verify. All payment requests are resolved!
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {pendingPayments.map((p) => (
                      <FarmerPlanPaymentCard key={p.id} request={p} onReview={() => setActiveFarmerPlanPayment(p)} />
                    ))}
                  </View>
                )}
              </View>
            ) : activeTab === 'GENERATE' ? (
              <GenerateCouponSection />
            ) : activeTab === 'COUPONS' ? (
              <View style={{ gap: 12 }}>
                <CategoryCollapse title="Referral" icon="people-outline">
                  <CouponKindListSection
                    coupons={coupons}
                    isLoading={isLoading}
                    kind="PARTNER_REFERRAL"
                    title="Referral Coupons"
                    helperText="Every Business Partner referral code, with its rate, business partner share, customer discount, and admin margin."
                    emptyText="No referral coupons issued yet."
                    usedOnly
                  />
                </CategoryCollapse>
                <CategoryCollapse title="Commission Based" icon="cash-outline">
                  <CouponKindListSection
                    coupons={coupons}
                    isLoading={isLoading}
                    kind="GENERIC"
                    title="Commission-Based Coupons"
                    helperText="Custom coupons with your own discount and commission for one partner."
                    emptyText="No commission-based coupons issued yet."
                  />
                </CategoryCollapse>
                <CategoryCollapse title="Special" icon="sparkles-outline">
                  <CouponKindListSection
                    coupons={coupons}
                    isLoading={isLoading}
                    kind="PERSONAL_INVITE"
                    title="Special (Personal Invite) Coupons"
                    helperText="Personal invite codes, issued automatically on referral signup."
                    emptyText="No personal invite coupons yet."
                  />
                </CategoryCollapse>
                <CategoryCollapse title="Farmer Plan" icon="leaf-outline">
                  <FarmerPlanCouponBrowseSection
                    title="Farmer Plan Coupons"
                    plans={['PRO', 'SMART']}
                    emptyText="No Farmer Plan coupons generated yet."
                  />
                </CategoryCollapse>
                <CategoryCollapse title="Advisor Plan" icon="school-outline">
                  <FarmerPlanCouponBrowseSection
                    title="Advisor Plan Coupons"
                    plans={['SMART', 'SUPER']}
                    emptyText="No Advisor Plan coupons generated yet."
                  />
                </CategoryCollapse>
              </View>
            ) : activeTab === 'PRICING' ? (
              <PlanPricingSection />
            ) : activeTab === 'FEATURES' ? (
              <View style={{ gap: 12 }}>
                <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
                  <Text style={styles.sectionTitle}>🌾 Farmer Plan Features</Text>
                  <PlanFeaturesSection category="FARMER" only={['PRO', 'SMART']} />
                </View>

                <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
                  <Text style={styles.sectionTitle}>🎓 Advisor Plan Features</Text>
                  <PlanFeaturesSection category="ADVISOR" only={['SMART', 'SUPER']} />
                </View>
              </View>
            ) : activeTab === 'REFERRAL_SETTINGS' ? (
              <ReferralRateSettingSection />
            ) : null}
          </View>
        )}
      </ScrollView>

      <FarmerPlanPaymentReviewModal request={activeFarmerPlanPayment} onClose={() => setActiveFarmerPlanPayment(null)} />
    </View>
  );
}

/** Plan Features & Benefits Section — feature toggles per plan tier */
function PlanFeaturesSection({ category, only }: { category?: 'FARMER' | 'ADVISOR'; only?: FarmerPlanType[] }) {
  const { data: allPricing, isLoading } = useFarmerPlanPricing();
  const pricing = only ? allPricing?.filter((p) => only.includes(p.plan)) : allPricing;
  const [editingFeature, setEditingFeature] = useState<FarmerPlanPricing | null>(null);

  // Group by unique plan tier
  const uniquePlans = Array.from(new Set((pricing ?? []).map((p) => p.plan)));

  return (
    <View style={{ gap: 10 }}>
      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
      ) : uniquePlans.length === 0 ? (
        <Text style={styles.emptyText}>No plan features configured.</Text>
      ) : (
        uniquePlans.map((planKey) => {
          const sample = pricing?.find((p) => p.plan === planKey);
          if (!sample) return null;
          const displayTitle =
            category === 'FARMER'
              ? (planKey === 'PRO' ? 'Lite Plan' : 'Pro Plan')
              : (planKey === 'SMART' ? 'Smart Plan' : 'Super Plan');

          return (
            <TouchableOpacity key={planKey} style={styles.rateCard} activeOpacity={0.85} onPress={() => setEditingFeature(sample)}>
              <View style={styles.rateCardHeaderRow}>
                <Text style={styles.rateCardTitle}>⚙️ {displayTitle} Features</Text>
                <Ionicons name="create-outline" size={16} color={theme.primary} />
              </View>
              <View style={styles.rateCardGrid}>
                <View style={styles.rateCardItem}>
                  <Text style={styles.rateCardItemLabel}>Advisor Status</Text>
                  <Text style={styles.rateCardItemValue}>{sample.advisorIncluded ? '✓ Included' : '✕ None'}</Text>
                </View>
                <View style={styles.rateCardItem}>
                  <Text style={styles.rateCardItemLabel}>Total Crops Allowed</Text>
                  <Text style={styles.rateCardItemValue}>{sample.maxTotalCrops != null ? `${sample.maxTotalCrops} Crops` : 'Unlimited'}</Text>
                </View>
                <View style={styles.rateCardItem}>
                  <Text style={styles.rateCardItemLabel}>Active Crops Allowed</Text>
                  <Text style={styles.rateCardItemValue}>{sample.maxActiveCrops != null ? `${sample.maxActiveCrops} Active` : 'Unlimited'}</Text>
                </View>
                <View style={styles.rateCardItem}>
                  <Text style={styles.rateCardItemLabel}>Advisor Chat</Text>
                  <Text style={styles.rateCardItemValue}>{sample.chatEnabled ? '✓ Enabled' : '✕ Disabled'}</Text>
                </View>
                <View style={styles.rateCardItem}>
                  <Text style={styles.rateCardItemLabel}>Weather Advisory</Text>
                  <Text style={styles.rateCardItemValue}>{sample.weatherEnabled ? '✓ Enabled' : '✕ Disabled'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        })
      )}
      <EditPlanFeaturesModal pricing={editingFeature} onClose={() => setEditingFeature(null)} />
    </View>
  );
}

/** 1. Compact Edit Modal for Plan Features & Benefits */
function EditPlanFeaturesModal({ pricing, onClose }: { pricing: FarmerPlanPricing | null; onClose: () => void }) {
  const update = useUpdateFarmerPlanPricing();
  const [maxTotalCrops, setMaxTotalCrops] = useState('');
  const [maxActiveCrops, setMaxActiveCrops] = useState('');
  const [advisorIncluded, setAdvisorIncluded] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [weatherEnabled, setWeatherEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (pricing) {
      setMaxTotalCrops(pricing.maxTotalCrops != null ? String(pricing.maxTotalCrops) : '');
      setMaxActiveCrops(pricing.maxActiveCrops != null ? String(pricing.maxActiveCrops) : '');
      setAdvisorIncluded(pricing.advisorIncluded ?? true);
      setChatEnabled(pricing.chatEnabled ?? true);
      setWeatherEnabled(pricing.weatherEnabled ?? true);
      setError(null);
    }
  }, [pricing]);

  if (!pricing) return null;

  const handleSave = async () => {
    try {
      await update.mutateAsync({
        plan: pricing.plan,
        payload: {
          billingPeriodDays: pricing.billingPeriodDays,
          maxTotalCrops: maxTotalCrops ? Number(maxTotalCrops) : undefined,
          maxActiveCrops: maxActiveCrops ? Number(maxActiveCrops) : undefined,
          advisorIncluded,
          chatEnabled,
          weatherEnabled,
        },
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save plan features.');
    }
  };

  return (
    <Modal visible={!!pricing} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>⚙️ {pricing.plan === 'PRO' ? 'Lite' : pricing.plan === 'SMART' ? 'Pro / Smart' : 'Super'} Plan Features</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
            <Text style={styles.label}>Farm Advisor Included</Text>
            <View style={styles.chipRow}>
              {[true, false].map((val) => (
                <TouchableOpacity
                  key={String(val)}
                  style={[styles.partnerChip, advisorIncluded === val && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setAdvisorIncluded(val)}
                >
                  <Text style={[styles.partnerChipText, advisorIncluded === val && { color: '#ffffff' }]}>
                    {val ? '✓ Advisor Included' : '✕ No Advisor'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Advisor Chat Option</Text>
            <View style={styles.chipRow}>
              {[true, false].map((val) => (
                <TouchableOpacity
                  key={String(val)}
                  style={[styles.partnerChip, chatEnabled === val && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setChatEnabled(val)}
                >
                  <Text style={[styles.partnerChipText, chatEnabled === val && { color: '#ffffff' }]}>
                    {val ? '✓ Chat Enabled' : '✕ Chat Disabled'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Weather Advisory Option</Text>
            <View style={styles.chipRow}>
              {[true, false].map((val) => (
                <TouchableOpacity
                  key={String(val)}
                  style={[styles.partnerChip, weatherEnabled === val && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setWeatherEnabled(val)}
                >
                  <Text style={[styles.partnerChipText, weatherEnabled === val && { color: '#ffffff' }]}>
                    {val ? '✓ Weather Advisory' : '✕ Disabled'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>1. Total Crops Allowed (Cumulative Limit)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 10 or leave blank for Unlimited" placeholderTextColor="#94a3b8" value={maxTotalCrops} onChangeText={setMaxTotalCrops} />

            <Text style={styles.label}>2. Active Crops Allowed (Concurrent Limit)</Text>
            <TextInput style={styles.input} keyboardType="numeric" placeholder="e.g. 5 or leave blank for Unlimited" placeholderTextColor="#94a3b8" value={maxActiveCrops} onChangeText={setMaxActiveCrops} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} disabled={update.isPending} onPress={handleSave}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Features</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Plan Duration Rates & Pricing Section — single consolidated card per plan tier with all-in-one duration pricing modal */
function PlanDurationRatesSection({ only }: { only?: FarmerPlanType[] }) {
  const { data: allPricing, isLoading } = useFarmerPlanPricing();
  const pricing = only ? allPricing?.filter((p) => only.includes(p.plan)) : allPricing;
  const [editingPlanKey, setEditingPlanKey] = useState<FarmerPlanType | null>(null);

  const uniquePlans = Array.from(new Set((pricing ?? []).map((p) => p.plan)));

  return (
    <View style={{ gap: 10 }}>
      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 12 }} />
      ) : uniquePlans.length === 0 ? (
        <Text style={styles.emptyText}>No pricing rates configured.</Text>
      ) : (
        uniquePlans.map((planKey) => {
          const planVariants = (pricing ?? []).filter((p) => p.plan === planKey);
          const displayTitle =
            planKey === 'PRO' ? 'Lite Plan' : planKey === 'SMART' ? 'Pro / Smart Plan' : 'Super Plan';

          return (
            <TouchableOpacity key={planKey} style={styles.rateCard} activeOpacity={0.85} onPress={() => setEditingPlanKey(planKey)}>
              <View style={styles.rateCardHeaderRow}>
                <Text style={styles.rateCardTitle}>💵 {displayTitle} Duration Rates</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: theme.primary }}>Edit All Durations</Text>
                  <Ionicons name="create-outline" size={16} color={theme.primary} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                {planVariants.map((v) => {
                  const d = Number(v.billingPeriodDays);
                  const isEnabled = v.isActive !== false;
                  return (
                    <View
                      key={v.id}
                      style={{
                        backgroundColor: isEnabled ? '#f0fdf4' : '#fef2f2',
                        borderWidth: 1,
                        borderColor: isEnabled ? '#bbf7d0' : '#fecaca',
                        borderRadius: RADIUS.md,
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        minWidth: '47%',
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: '#64748b', textTransform: 'uppercase' }}>
                          {d} Days ({d >= 365 ? `${Math.round(d / 365)} Yr` : `${Math.round(d / 30)} Mo`})
                        </Text>
                        <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: isEnabled ? '#15803d' : '#dc2626' }}>
                          {isEnabled ? '🟢 Active' : '🔴 Disabled'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: isEnabled ? '#166534' : '#991b1b', marginTop: 2 }}>
                        ₹{v.price}
                      </Text>
                    </View>
                  );
                })}
                {planVariants.length === 0 ? <Text style={styles.emptyText}>No duration rates added yet. Click to add.</Text> : null}
              </View>
            </TouchableOpacity>
          );
        })
      )}
      <EditPlanMultiDurationPricingModal
        planKey={editingPlanKey}
        pricingList={pricing ?? []}
        isAdvisorPlan={only?.includes('SUPER') || (only?.includes('SMART') && !only.includes('PRO'))}
        onClose={() => setEditingPlanKey(null)}
      />
    </View>
  );
}

interface DurationRateRow {
  id?: string;
  days: number;
  price: string;
  adminShareValue: string;
  partnerShareValue: string;
  advisorShareValue: string;
  isActive: boolean;
}

/** 2. Full Multi-Duration Rate Edit Modal: Add, Remove, and Enable & Disable Options */
function EditPlanMultiDurationPricingModal({
  planKey,
  pricingList,
  isAdvisorPlan,
  onClose,
}: {
  planKey: FarmerPlanType | null;
  pricingList: FarmerPlanPricing[];
  isAdvisorPlan?: boolean;
  onClose: () => void;
}) {
  const update = useUpdateFarmerPlanPricing();
  const deletePricing = useDeleteFarmerPlanPricing();

  const [rateRows, setRateRows] = useState<DurationRateRow[]>([]);
  const [partnerShareType, setPartnerShareType] = useState<'PERCENTAGE' | 'FIXED'>('FIXED');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (planKey) {
      const planVariants = pricingList.filter((p) => p.plan === planKey);
      if (planVariants.length > 0) {
        const rows: DurationRateRow[] = planVariants.map((v) => ({
          id: v.id,
          days: Number(v.billingPeriodDays),
          price: String(v.price ?? ''),
          adminShareValue: String(v.adminShareValue ?? ''),
          partnerShareValue: String(v.partnerShareValue ?? '10'),
          advisorShareValue: String(v.advisorShareValue ?? ''),
          isActive: v.isActive !== false,
        }));
        setRateRows(rows.sort((a, b) => a.days - b.days));
        setPartnerShareType(planVariants[0].partnerShareType ?? 'FIXED');
      } else {
        const defaultDays = !isAdvisorPlan && planKey !== 'SUPER' ? [180, 365] : [30, 90, 180, 365];
        setRateRows(
          defaultDays.map((days) => ({
            days,
            price: '',
            adminShareValue: '',
            partnerShareValue: '10',
            advisorShareValue: '',
            isActive: true,
          }))
        );
      }
      setError(null);
    }
  }, [planKey, pricingList]);

  if (!planKey) return null;

  const isAdvisorType = isAdvisorPlan || planKey === 'SUPER';
  const displayTitle =
    planKey === 'PRO' ? 'Lite Plan' : planKey === 'SMART' ? (isAdvisorType ? 'Smart Plan (Advisor)' : 'Pro Plan (Farmer)') : 'Super Plan (Advisor)';

  const handleSaveAll = async () => {
    setError(null);
    try {
      const tasks: Promise<any>[] = [];
      for (const row of rateRows) {
        if (row.price && Number(row.price) > 0) {
          tasks.push(
            update.mutateAsync({
              plan: planKey,
              payload: {
                billingPeriodDays: row.days,
                price: Number(row.price),
                adminShareValue: Number(row.adminShareValue || 0),
                partnerShareType: isAdvisorType ? 'FIXED' : partnerShareType,
                partnerShareValue: isAdvisorType ? 0 : Number(row.partnerShareValue || 0),
                advisorShareValue: isAdvisorType ? (row.advisorShareValue ? Number(row.advisorShareValue) : 0) : undefined,
                isActive: row.isActive,
              },
            })
          );
        }
      }

      if (tasks.length === 0) {
        setError('Please enter a price for at least one duration rate.');
        return;
      }

      await Promise.all(tasks);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save pricing rates.');
    }
  };

  const handleRemoveRate = async (index: number) => {
    const row = rateRows[index];
    if (row.id) {
      try {
        await deletePricing.mutateAsync(row.id);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Could not delete duration rate.');
        return;
      }
    }
    setRateRows((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddRate = () => {
    const existingDays = rateRows.map((r) => r.days);
    const nextDays = [30, 60, 90, 180, 365, 730].find((d) => !existingDays.includes(d)) || 30;
    setRateRows((prev) => [...prev, { days: nextDays, price: '', adminShareValue: '', partnerShareValue: '10', advisorShareValue: '', isActive: true }]);
  };

  return (
    <Modal visible={!!planKey} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>💵 {displayTitle} Duration Pricing</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
            {!isAdvisorType ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={styles.label}>Partner Commission Type</Text>
                <View style={styles.chipRow}>
                  {(['FIXED', 'PERCENTAGE'] as const).map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.partnerChip, partnerShareType === t && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={() => setPartnerShareType(t)}
                    >
                      <Text style={[styles.partnerChipText, partnerShareType === t && { color: '#ffffff' }]}>
                        {t === 'FIXED' ? 'Fixed ₹' : 'Percentage %'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ) : null}

            {rateRows.map((row, idx) => (
              <View
                key={row.id || `row-${idx}`}
                style={{
                  backgroundColor: row.isActive ? '#f8fafc' : '#fef2f2',
                  padding: 10,
                  borderRadius: RADIUS.md,
                  borderWidth: 1,
                  borderColor: row.isActive ? '#e2e8f0' : '#fecaca',
                  gap: 8,
                }}
              >
                {/* Header Row: Duration Days + Enable/Disable Toggle + Delete Button */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569' }}>Days:</Text>
                    <TextInput
                      style={[styles.input, { height: 32, width: 70, paddingVertical: 2, textAlign: 'center' }]}
                      keyboardType="numeric"
                      value={String(row.days)}
                      onChangeText={(v) => {
                        const val = Number(v) || 0;
                        setRateRows((prev) => prev.map((r, i) => (i === idx ? { ...r, days: val } : r)));
                      }}
                    />
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {/* Enable & Disable Toggle Switch */}
                    <TouchableOpacity
                      style={{
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: RADIUS.pill,
                        backgroundColor: row.isActive ? '#dcfce7' : '#fee2e2',
                        borderWidth: 1,
                        borderColor: row.isActive ? '#86efac' : '#fca5a5',
                      }}
                      onPress={() => setRateRows((prev) => prev.map((r, i) => (i === idx ? { ...r, isActive: !r.isActive } : r)))}
                    >
                      <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: row.isActive ? '#15803d' : '#dc2626' }}>
                        {row.isActive ? '🟢 Enabled' : '🔴 Disabled'}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete Option */}
                    <TouchableOpacity
                      style={{ padding: 4 }}
                      disabled={deletePricing.isPending}
                      onPress={() => handleRemoveRate(idx)}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Inputs Row: Price + Platform Fee (Admin Cut) + Partner/Advisor Cut (Auto-Calculated) */}
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.semiBold, color: '#64748b' }}>Plan Price (₹)</Text>
                    <TextInput
                      style={[styles.input, { height: 38, paddingVertical: 4, paddingHorizontal: 6 }]}
                      keyboardType="numeric"
                      placeholder="Price ₹"
                      placeholderTextColor="#94a3b8"
                      value={row.price}
                      onChangeText={(v) => {
                        const priceNum = Number(v) || 0;
                        const feeNum = Number(row.adminShareValue) || 0;
                        const autoRemaining = String(Math.max(0, priceNum - feeNum));
                        setRateRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                ...r,
                                price: v,
                                ...(isAdvisorType ? { advisorShareValue: autoRemaining } : { partnerShareValue: autoRemaining }),
                              }
                              : r
                          )
                        );
                      }}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 9.5, fontFamily: FONT.semiBold, color: '#64748b' }}>Platform Fee (₹)</Text>
                    <TextInput
                      style={[styles.input, { height: 38, paddingVertical: 4, paddingHorizontal: 6 }]}
                      keyboardType="numeric"
                      placeholder="Fee ₹"
                      placeholderTextColor="#94a3b8"
                      value={row.adminShareValue}
                      onChangeText={(v) => {
                        const priceNum = Number(row.price) || 0;
                        const feeNum = Number(v) || 0;
                        const autoRemaining = String(Math.max(0, priceNum - feeNum));
                        setRateRows((prev) =>
                          prev.map((r, i) =>
                            i === idx
                              ? {
                                ...r,
                                adminShareValue: v,
                                ...(isAdvisorType ? { advisorShareValue: autoRemaining } : { partnerShareValue: autoRemaining }),
                              }
                              : r
                          )
                        );
                      }}
                    />
                  </View>

                  {!isAdvisorType ? (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9.5, fontFamily: FONT.semiBold, color: '#64748b' }}>
                        Business Partner Share ({partnerShareType === 'FIXED' ? '₹' : '%'})
                      </Text>
                      <TextInput
                        style={[styles.input, { height: 38, paddingVertical: 4, paddingHorizontal: 6 }]}
                        keyboardType="numeric"
                        placeholder="BP Share"
                        placeholderTextColor="#94a3b8"
                        value={row.partnerShareValue}
                        onChangeText={(v) => setRateRows((prev) => prev.map((r, i) => (i === idx ? { ...r, partnerShareValue: v } : r)))}
                      />
                    </View>
                  ) : (
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 9.5, fontFamily: FONT.semiBold, color: '#64748b' }}>Advisor Share (₹)</Text>
                      <TextInput
                        style={[styles.input, { height: 38, paddingVertical: 4, paddingHorizontal: 6 }]}
                        keyboardType="numeric"
                        placeholder="Advisor Share"
                        placeholderTextColor="#94a3b8"
                        value={row.advisorShareValue}
                        onChangeText={(v) => setRateRows((prev) => prev.map((r, i) => (i === idx ? { ...r, advisorShareValue: v } : r)))}
                      />
                    </View>
                  )}
                </View>
              </View>
            ))}

            {/* Add Plan Option Button */}
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderWidth: 1.5,
                borderColor: theme.primary,
                borderStyle: 'dashed',
                borderRadius: RADIUS.md,
                backgroundColor: '#f8fafc',
                marginTop: 4,
              }}
              onPress={handleAddRate}
            >
              <Ionicons name="add-circle-outline" size={18} color={theme.primary} />
              <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: theme.primary }}>+ Add New Duration Rate</Text>
            </TouchableOpacity>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} disabled={update.isPending || deletePricing.isPending} onPress={handleSaveAll}>
              {update.isPending || deletePricing.isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>Save All Pricing Rates</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Defaults for the auto-issued Business Partner Referral coupon — same tap-to-edit-card style as Plan Setting. */
function ReferralRateSettingSection({ bare }: { bare?: boolean } = {}) {
  const { data: settings, isLoading } = useCouponSettings();
  const [isEditing, setIsEditing] = useState(false);

  const card = isLoading ? (
    <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
  ) : (
    <TouchableOpacity style={styles.rateCard} activeOpacity={0.85} onPress={() => setIsEditing(true)}>
      <View style={styles.rateCardHeaderRow}>
        <Text style={styles.rateCardTitle}>Referral Coupon</Text>
        <Ionicons name="create-outline" size={16} color={theme.primary} />
      </View>
      <Text style={styles.rateCardPrice}>
        {settings?.partnerCouponDiscountPercent ?? 10}% discount upto ₹{settings?.partnerCouponMaxDiscountCap ?? 100}
      </Text>
      <View style={styles.rateCardGrid}>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Partner Commission</Text>
          <Text style={styles.rateCardItemValue}>{settings?.partnerCouponCommissionPercent ?? 5}%</Text>
        </View>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Min Order</Text>
          <Text style={styles.rateCardItemValue}>₹{settings?.partnerCouponMinOrderAmount ?? 500}</Text>
        </View>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Validity</Text>
          <Text style={styles.rateCardItemValue}>{settings?.partnerCouponValidityDays ?? 365}d</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (bare) {
    return (
      <>
        {card}
        <EditReferralRateModal visible={isEditing} settings={settings} onClose={() => setIsEditing(false)} />
      </>
    );
  }

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Referral Coupon Setting</Text>
      {card}
      <EditReferralRateModal visible={isEditing} settings={settings} onClose={() => setIsEditing(false)} />
    </View>
  );
}

function EditReferralRateModal({ visible, settings, onClose }: { visible: boolean; settings: CouponSettings | undefined; onClose: () => void }) {
  const update = useUpdateCouponSettings();
  const [discountPercent, setDiscountPercent] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountCap, setMaxDiscountCap] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setDiscountPercent(settings?.partnerCouponDiscountPercent ?? '10');
      setCommissionPercent(settings?.partnerCouponCommissionPercent ?? '5');
      setMinOrderAmount(settings?.partnerCouponMinOrderAmount ?? '500');
      setMaxDiscountCap(settings?.partnerCouponMaxDiscountCap ?? '100');
      setValidityDays(String(settings?.partnerCouponValidityDays ?? 365));
      setError(null);
    }
  }, [visible, settings]);

  const handleSave = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        partnerCouponDiscountPercent: Number(discountPercent),
        partnerCouponCommissionPercent: Number(commissionPercent),
        partnerCouponMinOrderAmount: Number(minOrderAmount),
        partnerCouponMaxDiscountCap: Number(maxDiscountCap),
        partnerCouponValidityDays: Number(validityDays),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save this setting.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Referral Coupon Setting</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Text style={styles.label}>Customer Discount (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={discountPercent} onChangeText={setDiscountPercent} />
            <Text style={styles.label}>Partner Commission (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={commissionPercent} onChangeText={setCommissionPercent} />
            <Text style={styles.label}>Minimum Order Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={minOrderAmount} onChangeText={setMinOrderAmount} />
            <Text style={styles.label}>Maximum Customer Discount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={maxDiscountCap} onChangeText={setMaxDiscountCap} />
            <Text style={styles.label}>Validity (days from issue)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={validityDays} onChangeText={setValidityDays} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} disabled={update.isPending} onPress={handleSave}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Setting</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Defaults that prefill a new Commission Based (custom/GENERIC) coupon — same tap-to-edit-card style as Plan Setting. */
function CommissionCouponSettingSection({ bare }: { bare?: boolean } = {}) {
  const { data: settings, isLoading } = useCouponSettings();
  const [isEditing, setIsEditing] = useState(false);

  const card = isLoading ? (
    <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
  ) : (
    <TouchableOpacity style={styles.rateCard} activeOpacity={0.85} onPress={() => setIsEditing(true)}>
      <View style={styles.rateCardHeaderRow}>
        <Text style={styles.rateCardTitle}>Commission-Based Coupon</Text>
        <Ionicons name="create-outline" size={16} color={theme.primary} />
      </View>
      <Text style={styles.rateCardPrice}>
        {settings?.commissionCouponDiscountPercent ?? 10}% discount upto ₹{settings?.commissionCouponMaxDiscountCap ?? 100}
      </Text>
      <View style={styles.rateCardGrid}>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Partner Commission</Text>
          <Text style={styles.rateCardItemValue}>{settings?.commissionCouponCommissionPercent ?? 5}%</Text>
        </View>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Min Order</Text>
          <Text style={styles.rateCardItemValue}>₹{settings?.commissionCouponMinOrderAmount ?? 0}</Text>
        </View>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Validity</Text>
          <Text style={styles.rateCardItemValue}>{settings?.commissionCouponValidityDays ?? 30}d</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (bare) {
    return (
      <>
        {card}
        <EditCommissionCouponSettingModal visible={isEditing} settings={settings} onClose={() => setIsEditing(false)} />
      </>
    );
  }

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Commission-Based Coupon Setting</Text>
      {card}
      <EditCommissionCouponSettingModal visible={isEditing} settings={settings} onClose={() => setIsEditing(false)} />
    </View>
  );
}

function EditCommissionCouponSettingModal({ visible, settings, onClose }: { visible: boolean; settings: CouponSettings | undefined; onClose: () => void }) {
  const update = useUpdateCouponSettings();
  const [discountPercent, setDiscountPercent] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [maxDiscountCap, setMaxDiscountCap] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setDiscountPercent(settings?.commissionCouponDiscountPercent ?? '10');
      setCommissionPercent(settings?.commissionCouponCommissionPercent ?? '5');
      setMinOrderAmount(settings?.commissionCouponMinOrderAmount ?? '0');
      setMaxDiscountCap(settings?.commissionCouponMaxDiscountCap ?? '100');
      setValidityDays(String(settings?.commissionCouponValidityDays ?? 30));
      setError(null);
    }
  }, [visible, settings]);

  const handleSave = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        commissionCouponDiscountPercent: Number(discountPercent),
        commissionCouponCommissionPercent: Number(commissionPercent),
        commissionCouponMinOrderAmount: Number(minOrderAmount),
        commissionCouponMaxDiscountCap: Number(maxDiscountCap),
        commissionCouponValidityDays: Number(validityDays),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save this setting.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Commission-Based Coupon Setting</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Text style={styles.label}>Customer Discount (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={discountPercent} onChangeText={setDiscountPercent} />
            <Text style={styles.label}>Partner Commission (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={commissionPercent} onChangeText={setCommissionPercent} />
            <Text style={styles.label}>Minimum Order Amount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={minOrderAmount} onChangeText={setMinOrderAmount} />
            <Text style={styles.label}>Maximum Customer Discount (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={maxDiscountCap} onChangeText={setMaxDiscountCap} />
            <Text style={styles.label}>Validity (days from issue)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={validityDays} onChangeText={setValidityDays} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} disabled={update.isPending} onPress={handleSave}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Setting</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Defaults for the auto-issued Special (Personal Invite) coupon every user gets — same tap-to-edit-card style as Plan Setting. */
function SpecialCouponSettingSection({ bare }: { bare?: boolean } = {}) {
  const { data: settings, isLoading } = useCouponSettings();
  const [isEditing, setIsEditing] = useState(false);

  const card = isLoading ? (
    <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
  ) : (
    <TouchableOpacity style={styles.rateCard} activeOpacity={0.85} onPress={() => setIsEditing(true)}>
      <View style={styles.rateCardHeaderRow}>
        <Text style={styles.rateCardTitle}>Special (Personal Invite) Coupon</Text>
        <Ionicons name="create-outline" size={16} color={theme.primary} />
      </View>
      <Text style={styles.rateCardPrice}>{settings?.inviteCouponDiscountPercent ?? 5}% discount</Text>
      <View style={styles.rateCardGrid}>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Partner Commission</Text>
          <Text style={styles.rateCardItemValue}>{settings?.inviteCouponCommissionPercent ?? 5}%</Text>
        </View>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Usage Limit</Text>
          <Text style={styles.rateCardItemValue}>{settings?.inviteCouponUsageLimit ?? 100000}</Text>
        </View>
        <View style={styles.rateCardItem}>
          <Text style={styles.rateCardItemLabel}>Validity</Text>
          <Text style={styles.rateCardItemValue}>{settings?.inviteCouponValidityDays ?? 3650}d</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (bare) {
    return (
      <>
        {card}
        <EditSpecialCouponSettingModal visible={isEditing} settings={settings} onClose={() => setIsEditing(false)} />
      </>
    );
  }

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Special Coupon Setting</Text>
      {card}
      <EditSpecialCouponSettingModal visible={isEditing} settings={settings} onClose={() => setIsEditing(false)} />
    </View>
  );
}

function EditSpecialCouponSettingModal({ visible, settings, onClose }: { visible: boolean; settings: CouponSettings | undefined; onClose: () => void }) {
  const update = useUpdateCouponSettings();
  const [discountPercent, setDiscountPercent] = useState('');
  const [commissionPercent, setCommissionPercent] = useState('');
  const [validityDays, setValidityDays] = useState('');
  const [usageLimit, setUsageLimit] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setDiscountPercent(settings?.inviteCouponDiscountPercent ?? '5');
      setCommissionPercent(settings?.inviteCouponCommissionPercent ?? '5');
      setValidityDays(String(settings?.inviteCouponValidityDays ?? 3650));
      setUsageLimit(String(settings?.inviteCouponUsageLimit ?? 100000));
      setError(null);
    }
  }, [visible, settings]);

  const handleSave = async () => {
    setError(null);
    try {
      await update.mutateAsync({
        inviteCouponDiscountPercent: Number(discountPercent),
        inviteCouponCommissionPercent: Number(commissionPercent),
        inviteCouponValidityDays: Number(validityDays),
        inviteCouponUsageLimit: Number(usageLimit),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save this setting.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Special Coupon Setting</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Text style={styles.label}>Customer Discount (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={discountPercent} onChangeText={setDiscountPercent} />
            <Text style={styles.label}>Partner Commission (%)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={commissionPercent} onChangeText={setCommissionPercent} />
            <Text style={styles.label}>Validity (days from issue)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={validityDays} onChangeText={setValidityDays} />
            <Text style={styles.label}>Usage Limit</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={usageLimit} onChangeText={setUsageLimit} />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} disabled={update.isPending} onPress={handleSave}>
              {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Setting</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/** Collapsible "Unused"/"Used" grouping wrapper — keeps long coupon lists from turning into a wall of mixed rows. */
function CollapsibleGroup({
  title,
  count,
  defaultExpanded,
  accentColor,
  children,
}: {
  title: string;
  count: number;
  defaultExpanded: boolean;
  accentColor: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <View style={{ gap: 8 }}>
      <TouchableOpacity
        style={[styles.groupHeaderRow, { borderColor: accentColor + '33' }]}
        activeOpacity={0.8}
        onPress={() => {
          tap();
          setExpanded((e) => !e);
        }}
      >
        <Text style={[styles.groupHeaderText, { color: accentColor }]}>{title} ({count})</Text>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color={accentColor} />
      </TouchableOpacity>
      {expanded ? <View style={{ gap: 8 }}>{children}</View> : null}
    </View>
  );
}

function formatValue(type: DiscountValueType, value: string, maxCap?: string | null) {
  const base = type === 'PERCENTAGE' ? `${value}%` : `₹${value}`;
  return type === 'PERCENTAGE' && maxCap ? `${base} (max ₹${maxCap})` : base;
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <TouchableOpacity
        activeOpacity={0.7}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        onPress={() => setShowDetails((v) => !v)}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={styles.couponCode}>{coupon.code}</Text>
          <CopyButton value={coupon.code} color={theme.primary} />
          <TouchableOpacity onPress={() => setIsSharing(true)} style={{ padding: 4 }}>
            <Ionicons name="share-social-outline" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>
        <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={16} color="#64748b" />
      </TouchableOpacity>

      <ShareCouponModal coupon={isSharing ? coupon : null} visible={isSharing} onClose={() => setIsSharing(false)} />

      {showDetails ? (
        <>
          <View style={styles.couponMetaRow}>
            <Text style={styles.couponMetaText}>📅 Issued: {new Date(coupon.createdAt).toLocaleDateString('en-IN')} · Expires: {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}</Text>
          </View>
          <View style={styles.couponMetaRow}>
            <Text style={styles.couponMetaText}>🔢 Used: {coupon.usedCount} / {coupon.usageLimit}</Text>
          </View>
        </>
      ) : null}
    </View>
  );
}

function CreateCouponModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const createCoupon = useCreateCoupon();
  const { data: partnersData } = useUsersList({ role: 'BUSINESS_PARTNER', limit: 200 });
  const partners = partnersData?.items ?? [];

  const [partnerSearch, setPartnerSearch] = useState('');
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState<string[]>([]);
  const [commissionType, setCommissionType] = useState<DiscountValueType>('PERCENTAGE');
  const [commissionValue, setCommissionValue] = useState('');
  const [commissionMaxCap, setCommissionMaxCap] = useState('');
  const [discountType, setDiscountType] = useState<DiscountValueType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [discountMaxCap, setDiscountMaxCap] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [successCodes, setSuccessCodes] = useState<{ name: string; code: string }[] | null>(null);

  const filteredPartners = partners.filter((p) => {
    const q = partnerSearch.trim().toLowerCase();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || (p.kingId ?? '').toLowerCase().includes(q) || p.mobile.includes(q);
  });
  const allSelected = partners.length > 0 && selectedPartnerIds.length === partners.length;
  const togglePartner = (id: string) =>
    setSelectedPartnerIds((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  const toggleSelectAll = () => setSelectedPartnerIds(allSelected ? [] : partners.map((p) => p.id));

  const reset = () => {
    setPartnerSearch('');
    setPartnerDropdownOpen(false);
    setSelectedPartnerIds([]);
    setCommissionValue('');
    setCommissionMaxCap('');
    setDiscountValue('');
    setDiscountMaxCap('');
    setMinOrderAmount('');
    setExpiresAt('');
    setUsageLimit('100');
    setError(null);
    setSuccessCodes(null);
  };

  const handleSubmit = async () => {
    if (selectedPartnerIds.length === 0) {
      setError('Select at least one business partner.');
      return;
    }
    if (!commissionValue || !discountValue || !expiresAt || !usageLimit) {
      setError('Fill in all fields.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
      setError('Enter expiry date as YYYY-MM-DD.');
      return;
    }
    setError(null);
    try {
      const codes = await Promise.all(
        selectedPartnerIds.map((businessPartnerId) =>
          createCoupon.mutateAsync({
            businessPartnerId,
            commissionType,
            commissionValue: Number(commissionValue),
            commissionMaxCap: commissionType === 'PERCENTAGE' && commissionMaxCap ? Number(commissionMaxCap) : undefined,
            discountType,
            discountValue: Number(discountValue),
            discountMaxCap: discountType === 'PERCENTAGE' && discountMaxCap ? Number(discountMaxCap) : undefined,
            minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
            expiresAt,
            usageLimit: Number(usageLimit),
          }),
        ),
      );
      setSuccessCodes(
        codes.map((c, i) => ({ name: partners.find((p) => p.id === selectedPartnerIds[i])?.name ?? 'Partner', code: c.code })),
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create coupon(s).');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Issue New Coupon</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {successCodes ? (
            <View style={{ gap: 10 }}>
              <ScrollView style={{ maxHeight: 300 }} contentContainerStyle={{ gap: 8 }}>
                {successCodes.map((sc) => (
                  <View key={sc.code} style={styles.successBox}>
                    <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                    <Text style={styles.successText}>
                      {sc.name}: <Text style={{ fontFamily: FONT.extraBold }}>{sc.code}</Text>
                    </Text>
                  </View>
                ))}
              </ScrollView>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Text style={styles.label}>Business Partner</Text>
              <TextInput
                style={styles.input}
                placeholder="Search by name, king id or mobile..."
                placeholderTextColor="#94a3b8"
                value={partnerSearch}
                onChangeText={setPartnerSearch}
                onFocus={() => setPartnerDropdownOpen(true)}
              />
              {selectedPartnerIds.length > 0 ? (
                <Text style={styles.helperText}>{selectedPartnerIds.length} partner(s) selected — a separate code will be issued to each.</Text>
              ) : null}

              {partnerDropdownOpen ? (
                <View style={styles.dropdownPanel}>
                  <TouchableOpacity style={styles.dropdownRow} activeOpacity={0.7} onPress={toggleSelectAll}>
                    <Ionicons name={allSelected ? 'checkbox' : 'square-outline'} size={18} color={theme.primary} />
                    <Text style={[styles.dropdownRowText, { fontFamily: FONT.bold }]}>Select All ({partners.length})</Text>
                  </TouchableOpacity>
                  <ScrollView style={{ maxHeight: 220 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
                    {filteredPartners.map((p) => (
                      <TouchableOpacity key={p.id} style={styles.dropdownRow} activeOpacity={0.7} onPress={() => togglePartner(p.id)}>
                        <Ionicons name={selectedPartnerIds.includes(p.id) ? 'checkbox' : 'square-outline'} size={18} color={theme.primary} />
                        <Text style={styles.dropdownRowText}>
                          {p.name} {p.kingId ? `(${p.kingId})` : ''} · {p.mobile}
                        </Text>
                      </TouchableOpacity>
                    ))}
                    {filteredPartners.length === 0 ? <Text style={styles.emptyText}>No matches.</Text> : null}
                  </ScrollView>
                  <TouchableOpacity style={[styles.submitBtn, { marginTop: 8 }]} onPress={() => setPartnerDropdownOpen(false)}>
                    <Text style={styles.submitBtnText}>Done</Text>
                  </TouchableOpacity>
                </View>
              ) : null}

              <Text style={styles.label}>Commission (to partner)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ToggleType value={commissionType} onChange={setCommissionType} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={commissionType === 'PERCENTAGE' ? 'e.g. 5' : 'e.g. 50'}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={commissionValue}
                  onChangeText={setCommissionValue}
                />
              </View>
              {commissionType === 'PERCENTAGE' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Max amount ₹ (optional cap)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={commissionMaxCap}
                  onChangeText={setCommissionMaxCap}
                />
              ) : null}

              <Text style={styles.label}>Discount (to customer)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ToggleType value={discountType} onChange={setDiscountType} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 100'}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={discountValue}
                  onChangeText={setDiscountValue}
                />
              </View>
              {discountType === 'PERCENTAGE' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Max amount ₹ (optional cap)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={discountMaxCap}
                  onChangeText={setDiscountMaxCap}
                />
              ) : null}

              <Text style={styles.label}>Minimum Order Amount (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={minOrderAmount}
                onChangeText={setMinOrderAmount}
              />

              <Text style={styles.label}>Expiry Date</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={expiresAt} onChangeText={setExpiresAt} />

              <Text style={styles.label}>Usage Limit</Text>
              <TextInput style={styles.input} placeholder="e.g. 100" placeholderTextColor="#94a3b8" keyboardType="numeric" value={usageLimit} onChangeText={setUsageLimit} />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.submitBtn} disabled={createCoupon.isPending} onPress={handleSubmit}>
                {createCoupon.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Create Coupon</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

type GenerateKind = 'FARMER_PLAN' | 'ADVISOR_PLAN' | 'COMMISSION' | 'SPECIAL';

const GENERATE_KIND_LABELS: Record<GenerateKind, string> = {
  FARMER_PLAN: 'Farmer Plan',
  ADVISOR_PLAN: 'Advisor Plan',
  COMMISSION: 'Commission Based',
  SPECIAL: 'Special',
};

/** Single entry point to generate any manually-issued coupon — sleek consolidated category architecture */
function GenerateCouponSection() {
  const [kind, setKind] = useState<GenerateKind>('FARMER_PLAN');

  const CATEGORIES: {
    key: GenerateKind;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    emoji: string;
    sub: string;
    badge: string;
    color: string;
  }[] = [
      { key: 'FARMER_PLAN', title: 'Farmer Plan Coupon', icon: 'leaf', emoji: '🌾', sub: 'Lite & Pro Bookkeeping Plans (365 Days)', badge: 'Yearly Plan', color: '#16a34a' },
      { key: 'ADVISOR_PLAN', title: 'Advisor Plan Coupon', icon: 'school', emoji: '🎓', sub: 'Smart & Super Advisory Plans (30 Days)', badge: 'Advisor Support', color: '#0284c7' },
      { key: 'COMMISSION', title: 'Commission-Based Coupon', icon: 'briefcase', emoji: '💼', sub: 'Custom discount & commission per partner', badge: 'Custom Rate', color: '#7c3aed' },
      { key: 'SPECIAL', title: 'Special Invite Coupon', icon: 'star', emoji: '⭐', sub: 'Personal invite code auto-issued on signup', badge: 'Personal', color: '#b45309' },
    ];

  return (
    <View style={{ gap: 12 }}>
      <View style={{ gap: 10 }}>
        {CATEGORIES.map((cat) => {
          const isActive = kind === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[
                styles.categoryCard,
                isActive && { borderColor: theme.primary, borderWidth: 1.5, backgroundColor: '#f8fafc' },
                premiumShadow('#0f172a', 'sm'),
              ]}
              activeOpacity={0.88}
              onPress={() => {
                tap();
                setKind(cat.key);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: `${cat.color}15`, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={cat.icon} size={18} color={cat.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={[styles.categoryTitle, { fontSize: 13.5 }]}>{cat.title}</Text>
                      <View style={{ backgroundColor: `${cat.color}15`, paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.pill }}>
                        <Text style={{ fontSize: 9.5, fontFamily: FONT.bold, color: cat.color }}>{cat.badge}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>{cat.sub}</Text>
                  </View>
                </View>
                <Ionicons name={isActive ? 'radio-button-on' : 'radio-button-off'} size={18} color={isActive ? theme.primary : '#94a3b8'} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {kind === 'FARMER_PLAN' ? (
        <FarmerBasicPremiumCouponSection initialCategory="FARMER" />
      ) : kind === 'ADVISOR_PLAN' ? (
        <FarmerBasicPremiumCouponSection initialCategory="ADVISOR" />
      ) : kind === 'COMMISSION' ? (
        <CommissionCouponGenerateSection />
      ) : (
        <SpecialCouponGenerateSection />
      )}
    </View>
  );
}

/** Quick-issue the Settings-default referral coupon to one partner or every active partner at once. */
function ReferralCouponGenerateSection() {
  const issueCoupon = useIssuePartnerCoupon();
  const { data: partnersData } = useUsersList({ role: 'BUSINESS_PARTNER', limit: 200 });
  const partners = partnersData?.items ?? [];
  const [partnerId, setPartnerId] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleIssue = async (target: 'ONE' | 'ALL') => {
    setError(null);
    setSuccessMsg(null);
    if (target === 'ONE' && !partnerId) {
      setError('Pick a business partner first.');
      return;
    }
    tap();
    try {
      const res = await issueCoupon.mutateAsync(target === 'ONE' ? partnerId : undefined);
      setSuccessMsg(
        target === 'ONE'
          ? `Issued coupon ${res.coupons[0]?.code} to ${partners.find((p) => p.id === partnerId)?.name ?? 'the partner'}.`
          : `Issued ${res.issuedCount} coupon(s) to every active business partner.`,
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not issue coupon(s).');
    }
  };

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Generate Referral Coupon</Text>
      <Text style={styles.helperText}>
        Uses the discount %, commission %, min order amount, max discount cap and validity set in Settings. Every account already gets one automatically when it becomes a Business Partner — use this to issue an additional one on demand.
      </Text>

      <Text style={[styles.label, { marginTop: 6 }]}>Business Partner</Text>
      <View style={styles.chipRow}>
        {partners.map((p) => (
          <TouchableOpacity
            key={p.id}
            style={[styles.partnerChip, partnerId === p.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setPartnerId(p.id)}
          >
            <Text style={[styles.partnerChipText, partnerId === p.id && { color: '#ffffff' }]}>{p.name}</Text>
          </TouchableOpacity>
        ))}
        {partners.length === 0 ? <Text style={styles.emptyText}>No business partners yet.</Text> : null}
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {successMsg ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
        <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginTop: 0 }]} disabled={issueCoupon.isPending} onPress={() => handleIssue('ONE')}>
          {issueCoupon.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Issue to Selected</Text>}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.submitBtn, { flex: 1, marginTop: 0, backgroundColor: '#1d4ed8' }]}
          disabled={issueCoupon.isPending}
          onPress={() => handleIssue('ALL')}
        >
          {issueCoupon.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Issue to All Partners</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

/** Opens the full custom form — your own discount, commission, min order, expiry, usage limit for one partner. */
function CommissionCouponGenerateSection() {
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <TouchableOpacity
        style={styles.submitBtn}
        activeOpacity={0.85}
        onPress={() => {
          tap();
          setIsCustomOpen(true);
        }}
      >
        <Text style={styles.submitBtnText}>Generate</Text>
      </TouchableOpacity>

      <CreateCouponModal visible={isCustomOpen} onClose={() => setIsCustomOpen(false)} />
    </View>
  );
}

/** Opens the full custom form for a Special (personal invite) coupon — your own code, discount, commission, min order, expiry, usage limit for one partner. */
function SpecialCouponGenerateSection() {
  const [isCustomOpen, setIsCustomOpen] = useState(false);

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <TouchableOpacity
        style={styles.submitBtn}
        activeOpacity={0.85}
        onPress={() => {
          tap();
          setIsCustomOpen(true);
        }}
      >
        <Text style={styles.submitBtnText}>Generate</Text>
      </TouchableOpacity>

      <CreateSpecialCouponModal visible={isCustomOpen} onClose={() => setIsCustomOpen(false)} />
    </View>
  );
}

function CreateSpecialCouponModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const createCoupon = useCreateCoupon();
  const { data: partnersData } = useUsersList({ role: 'BUSINESS_PARTNER', limit: 200 });
  const partners = partnersData?.items ?? [];

  const [businessPartnerId, setBusinessPartnerId] = useState('');
  const [code, setCode] = useState('');
  const [commissionType, setCommissionType] = useState<DiscountValueType>('PERCENTAGE');
  const [commissionValue, setCommissionValue] = useState('');
  const [commissionMaxCap, setCommissionMaxCap] = useState('');
  const [discountType, setDiscountType] = useState<DiscountValueType>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [discountMaxCap, setDiscountMaxCap] = useState('');
  const [minOrderAmount, setMinOrderAmount] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [usageLimit, setUsageLimit] = useState('100');
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);

  const reset = () => {
    setBusinessPartnerId('');
    setCode('');
    setCommissionValue('');
    setCommissionMaxCap('');
    setDiscountValue('');
    setDiscountMaxCap('');
    setMinOrderAmount('');
    setExpiresAt('');
    setUsageLimit('100');
    setError(null);
    setSuccessCode(null);
  };

  const handleSubmit = async () => {
    if (!businessPartnerId) {
      setError('Select a business partner.');
      return;
    }
    if (!code.trim()) {
      setError('Enter a coupon code.');
      return;
    }
    if (!/^[A-Z0-9]{4,20}$/i.test(code.trim())) {
      setError('Code must be 4-20 letters/numbers.');
      return;
    }
    if (!commissionValue || !discountValue || !expiresAt || !usageLimit) {
      setError('Fill in all fields.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(expiresAt)) {
      setError('Enter expiry date as YYYY-MM-DD.');
      return;
    }
    try {
      const coupon = await createCoupon.mutateAsync({
        businessPartnerId,
        kind: 'PERSONAL_INVITE',
        code: code.trim().toUpperCase(),
        commissionType,
        commissionValue: Number(commissionValue),
        commissionMaxCap: commissionType === 'PERCENTAGE' && commissionMaxCap ? Number(commissionMaxCap) : undefined,
        discountType,
        discountValue: Number(discountValue),
        discountMaxCap: discountType === 'PERCENTAGE' && discountMaxCap ? Number(discountMaxCap) : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined,
        expiresAt,
        usageLimit: Number(usageLimit),
      });
      setSuccessCode(coupon.code);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create coupon.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Issue Special Coupon</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {successCode ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  Coupon created: <Text style={{ fontFamily: FONT.extraBold }}>{successCode}</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Text style={styles.label}>Business Partner</Text>
              <View style={styles.chipRow}>
                {partners.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.partnerChip, businessPartnerId === p.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setBusinessPartnerId(p.id)}
                  >
                    <Text style={[styles.partnerChipText, businessPartnerId === p.id && { color: '#ffffff' }]}>{p.name}</Text>
                  </TouchableOpacity>
                ))}
                {partners.length === 0 ? <Text style={styles.emptyText}>No business partners yet.</Text> : null}
              </View>

              <Text style={styles.label}>Coupon Code</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. DIWALI25"
                placeholderTextColor="#94a3b8"
                autoCapitalize="characters"
                value={code}
                onChangeText={setCode}
              />

              <Text style={styles.label}>Commission (to partner)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ToggleType value={commissionType} onChange={setCommissionType} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={commissionType === 'PERCENTAGE' ? 'e.g. 5' : 'e.g. 50'}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={commissionValue}
                  onChangeText={setCommissionValue}
                />
              </View>
              {commissionType === 'PERCENTAGE' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Max amount ₹ (optional cap)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={commissionMaxCap}
                  onChangeText={setCommissionMaxCap}
                />
              ) : null}

              <Text style={styles.label}>Discount (to customer)</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <ToggleType value={discountType} onChange={setDiscountType} />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder={discountType === 'PERCENTAGE' ? 'e.g. 10' : 'e.g. 100'}
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={discountValue}
                  onChangeText={setDiscountValue}
                />
              </View>
              {discountType === 'PERCENTAGE' ? (
                <TextInput
                  style={styles.input}
                  placeholder="Max amount ₹ (optional cap)"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={discountMaxCap}
                  onChangeText={setDiscountMaxCap}
                />
              ) : null}

              <Text style={styles.label}>Minimum Order Amount (Optional)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 500"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={minOrderAmount}
                onChangeText={setMinOrderAmount}
              />

              <Text style={styles.label}>Expiry Date</Text>
              <TextInput style={styles.input} placeholder="YYYY-MM-DD" placeholderTextColor="#94a3b8" value={expiresAt} onChangeText={setExpiresAt} />

              <Text style={styles.label}>Usage Limit</Text>
              <TextInput style={styles.input} placeholder="e.g. 100" placeholderTextColor="#94a3b8" keyboardType="numeric" value={usageLimit} onChangeText={setUsageLimit} />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.submitBtn} disabled={createCoupon.isPending} onPress={handleSubmit}>
                {createCoupon.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Create Coupon</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Farmer/Advisor Plan coupons in the All Coupon browser — who generated it, when, who it was shared with, and what got debited. */
function FarmerPlanCouponBrowseSection({
  title,
  plans,
  emptyText,
}: {
  title: string;
  plans: FarmerPlanType[];
  emptyText: string;
}) {
  const { data: coupons, isLoading } = useAllFarmerPlanCoupons();
  const { data: pricing = [] } = useFarmerPlanPricing();
  const [statusTab, setStatusTab] = useState<'UNUSED' | 'USED' | 'EXPIRED'>('UNUSED');
  const [shareCoupon, setShareCoupon] = useState<{ code: string; plan: string; daysGranted: number; expiresAt?: string | Date | null; mrp?: number | string | null } | null>(null);

  const filtered = (coupons ?? []).filter((c) => plans.includes(c.plan));

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>{title}</Text>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : (
        (() => {
          const now = new Date();
          const isExpired = (c: (typeof filtered)[number]) => !!c.expiresAt && new Date(c.expiresAt) < now;
          const groups = {
            UNUSED: filtered.filter((c) => !isExpired(c) && !c.isUsed),
            USED: filtered.filter((c) => c.isUsed),
            EXPIRED: filtered.filter((c) => !c.isUsed && isExpired(c)),
          } as const;
          const statusLabels: Record<keyof typeof groups, string> = { UNUSED: 'Unused', USED: 'Used', EXPIRED: 'Expired' };
          const active = groups[statusTab];
          return (
            <View style={{ gap: 10 }}>
              <View style={styles.chipRow}>
                {(Object.keys(groups) as (keyof typeof groups)[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.partnerChip, statusTab === key && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => {
                      tap();
                      setStatusTab(key);
                    }}
                  >
                    <Text style={[styles.partnerChipText, statusTab === key && { color: '#ffffff' }]}>
                      {statusLabels[key]} ({groups[key].length})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {active.length === 0 ? (
                <Text style={styles.emptyText}>None {statusLabels[statusTab].toLowerCase()}.</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {active.map((c) => {
                    const sharedWith = c.assignedFarmer
                      ? `Farmer: ${c.assignedFarmer.name}`
                      : c.assignedAdvisor
                        ? `Advisor: ${c.assignedAdvisor.name}`
                        : c.assignedBusinessPartner
                          ? `Partner: ${c.assignedBusinessPartner.name}`
                          : 'Open code';
                    return (
                      <View key={c.id} style={styles.codeRow}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.couponCode}>{c.code}</Text>
                            <CopyButton value={c.code} color={theme.primary} />
                            <TouchableOpacity
                              onPress={() => setShareCoupon({ code: c.code, plan: c.plan, daysGranted: c.daysGranted, expiresAt: c.expiresAt, mrp: couponPlanAmount(pricing, c.plan, c.daysGranted) })}
                              style={{ padding: 4 }}
                            >
                              <Ionicons name="share-social-outline" size={16} color={theme.primary} />
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.couponMetaText}>
                            {c.plan} · {c.daysGranted} days
                            {(() => {
                              const amount = couponPlanAmount(pricing, c.plan, c.daysGranted);
                              return amount != null ? ` · ₹${amount.toLocaleString('en-IN')} value` : '';
                            })()}{' '}
                            · {sharedWith}
                          </Text>
                          <Text style={styles.couponMetaText}>
                            Generated by {c.createdBy?.name ?? 'Unknown'} on {new Date(c.createdAt).toLocaleDateString('en-IN')}
                            {c.generationCostAmount ? ` · ₹${c.generationCostAmount} debited` : ''}
                          </Text>
                        </View>
                        <View style={[styles.statusBadge, c.isUsed ? { backgroundColor: '#f1f5f9' } : { backgroundColor: '#dcfce7' }]}>
                          <Text style={[styles.statusBadgeText, c.isUsed ? { color: '#64748b' } : { color: '#16a34a' }]}>
                            {c.isUsed ? 'Used' : 'Unused'}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })()
      )}
      <ShareFarmerPlanCouponModal coupon={shareCoupon} visible={!!shareCoupon} onClose={() => setShareCoupon(null)} />
    </View>
  );
}

/** Referral coupons (kind === 'PARTNER_REFERRAL') kept separate from custom-issued partner coupons — same fields per coupon: rate, business partner share, customer discount, and the implied admin margin. */
/** One coupon-kind's Unused/Used list — reused for Referral, Commission Based, and Special categories. */
function CouponKindListSection({
  coupons,
  isLoading,
  kind,
  title,
  helperText,
  emptyText,
  usedOnly,
}: {
  coupons: Coupon[] | undefined;
  isLoading: boolean;
  kind: NonNullable<Coupon['kind']>;
  title: string;
  helperText: string;
  emptyText: string;
  /** Skips the Unused/Used/Expired tabs and just lists redeemed coupons — for kinds like PARTNER_REFERRAL
   * where one static, reusable code per partner makes "unused" a meaningless bucket. */
  usedOnly?: boolean;
}) {
  const filtered = (coupons ?? []).filter((c) => c.kind === kind);
  const [statusTab, setStatusTab] = useState<'UNUSED' | 'USED' | 'EXPIRED'>('UNUSED');

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.helperText}>{helperText}</Text>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
      ) : filtered.length === 0 ? (
        <Text style={styles.emptyText}>{emptyText}</Text>
      ) : usedOnly ? (
        (() => {
          const used = filtered.filter((c) => c.usedCount > 0);
          return used.length === 0 ? (
            <Text style={styles.emptyText}>None used yet.</Text>
          ) : (
            <View style={{ gap: 8 }}>
              {used.map((coupon) => (
                <CouponCard key={coupon.id} coupon={coupon} />
              ))}
            </View>
          );
        })()
      ) : (
        (() => {
          const now = new Date();
          const isExpired = (c: Coupon) => new Date(c.expiresAt) < now;
          const groups = {
            UNUSED: filtered.filter((c) => !isExpired(c) && c.isActive && c.usedCount === 0),
            USED: filtered.filter((c) => !isExpired(c) && (!c.isActive || c.usedCount > 0)),
            EXPIRED: filtered.filter((c) => isExpired(c)),
          } as const;
          const statusLabels: Record<keyof typeof groups, string> = { UNUSED: 'Unused', USED: 'Used', EXPIRED: 'Expired' };
          const active = groups[statusTab];
          return (
            <View style={{ gap: 10 }}>
              <View style={styles.chipRow}>
                {(Object.keys(groups) as (keyof typeof groups)[]).map((key) => (
                  <TouchableOpacity
                    key={key}
                    style={[styles.partnerChip, statusTab === key && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => {
                      tap();
                      setStatusTab(key);
                    }}
                  >
                    <Text style={[styles.partnerChipText, statusTab === key && { color: '#ffffff' }]}>
                      {statusLabels[key]} ({groups[key].length})
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {active.length === 0 ? (
                <Text style={styles.emptyText}>None {statusLabels[statusTab].toLowerCase()}.</Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {active.map((coupon) => (
                    <CouponCard key={coupon.id} coupon={coupon} />
                  ))}
                </View>
              )}
            </View>
          );
        })()
      )}
    </View>
  );
}

type CouponLockMode = 'OPEN' | 'ADVISOR' | 'PARTNER';

/** BASIC/PREMIUM farmer-plan coupons — new farmers get their first plan, existing ones extend/renew, and it can be issued to an advisor to hand out. */
function couponPlanAmount(pricing: FarmerPlanPricing[], plan: FarmerPlanType, daysGranted: number): number | null {
  const p = pricing.find((row) => row.plan === plan);
  if (!p) return null;
  const amount = Math.round(Number(p.price) * (daysGranted / p.billingPeriodDays) * 100) / 100;
  return amount > 0 ? amount : null;
}

function FarmerBasicPremiumCouponSection({ initialCategory }: { initialCategory?: 'FARMER' | 'ADVISOR' }) {
  const { data: coupons, isLoading } = useAllFarmerPlanCoupons();
  const { data: pricing = [] } = useFarmerPlanPricing();
  const { data: finSummary } = useCouponFinancialSummary();
  const deactivateCoupon = useDeactivateFarmerPlanCoupon();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRedeemForFarmerOpen, setIsRedeemForFarmerOpen] = useState(false);
  const [shareCoupon, setShareCoupon] = useState<{ code: string; plan: string; daysGranted: number } | null>(null);

  const handleDeactivate = (id: string, code: string) => {
    const message = `Deactivate coupon ${code}? It will no longer be redeemable — this cannot be undone, but the coupon stays visible in history.`;
    const doDeactivate = () => deactivateCoupon.mutate(id);
    if (Platform.OS === 'web') {
      if (confirm(message)) doDeactivate();
    } else {
      Alert.alert('Deactivate Coupon', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Deactivate', style: 'destructive', onPress: doDeactivate },
      ]);
    }
  };

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      {finSummary ? (
        <View style={styles.finSummaryCard}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="cash-outline" size={16} color="#15803d" />
            <Text style={styles.finSummaryTitle}>Coupon Accounting & Direct Income Summary</Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
            <View style={styles.finSummaryItem}>
              <Text style={styles.finSummaryLabel}>Grand Total Income</Text>
              <Text style={[styles.finSummaryValue, { color: '#16a34a' }]}>₹{finSummary.totalCouponIncome.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.finSummaryItem}>
              <Text style={styles.finSummaryLabel}>Admin Direct (100%)</Text>
              <Text style={styles.finSummaryValue}>₹{finSummary.directAdminIncome.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.finSummaryItem}>
              <Text style={styles.finSummaryLabel}>Partner Payments</Text>
              <Text style={styles.finSummaryValue}>₹{finSummary.partnerDebitsCollected.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.finSummaryItem}>
              <Text style={styles.finSummaryLabel}>Advisor Platform Fees</Text>
              <Text style={styles.finSummaryValue}>₹{finSummary.advisorPlatformFeesCollected.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 6 }}>
        <TouchableOpacity
          style={[styles.createBtn, { backgroundColor: '#1d4ed8', flex: 1 }]}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setIsRedeemForFarmerOpen(true);
          }}
        >
          <Ionicons name="pricetag" size={15} color="#ffffff" />
          <Text style={styles.createBtnText}>Apply</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.createBtn, { flex: 1 }]}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setIsCreateOpen(true);
          }}
        >
          <Ionicons name="add-circle" size={15} color="#ffffff" />
          <Text style={styles.createBtnText}>Generate</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
      ) : !coupons || coupons.length === 0 ? (
        <Text style={styles.emptyText}>No plan coupons generated yet.</Text>
      ) : (
        (() => {
          const unusedCoupons = coupons.filter((c) => !c.isUsed);
          const usedCoupons = coupons.filter((c) => c.isUsed);
          const renderRow = (c: (typeof coupons)[number]) => (
            <View key={c.id} style={styles.codeRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.couponCode}>
                  {c.code} <Text style={{ fontSize: 10, color: '#64748b' }}>· {c.plan}</Text>
                </Text>
                <Text style={styles.couponMetaText}>
                  {c.daysGranted} days
                  {(() => {
                    const amount = couponPlanAmount(pricing, c.plan, c.daysGranted);
                    return amount != null ? ` · ₹${amount.toLocaleString('en-IN')} value` : '';
                  })()}{' '}
                  {c.assignedFarmer
                    ? `· For ${c.assignedFarmer.name}`
                    : c.assignedAdvisor
                      ? `· For advisor ${c.assignedAdvisor.name}`
                      : c.assignedBusinessPartner
                        ? `· For partner ${c.assignedBusinessPartner.name}`
                        : '· Open code'}
                </Text>
              </View>
              <CopyButton value={c.code} color={theme.primary} />
              <TouchableOpacity onPress={() => setShareCoupon({ code: c.code, plan: c.plan, daysGranted: c.daysGranted })} style={{ padding: 4 }}>
                <Ionicons name="share-social-outline" size={16} color={theme.primary} />
              </TouchableOpacity>
              <View style={[styles.statusBadge, c.isUsed ? { backgroundColor: '#f1f5f9' } : { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.statusBadgeText, c.isUsed ? { color: '#64748b' } : { color: '#16a34a' }]}>
                  {c.isUsed ? 'Used' : 'Unused'}
                </Text>
              </View>
              {!c.isUsed ? (
                <TouchableOpacity onPress={() => handleDeactivate(c.id, c.code)} style={{ padding: 4 }}>
                  <Ionicons name="close-circle-outline" size={18} color="#dc2626" />
                </TouchableOpacity>
              ) : null}
            </View>
          );
          return (
            <View style={{ gap: 12 }}>
              <CollapsibleGroup title="Unused" count={unusedCoupons.length} defaultExpanded accentColor="#16a34a">
                {unusedCoupons.length === 0 ? <Text style={styles.emptyText}>No unused codes.</Text> : unusedCoupons.map(renderRow)}
              </CollapsibleGroup>
              <CollapsibleGroup title="Used" count={usedCoupons.length} defaultExpanded={false} accentColor="#64748b">
                {usedCoupons.map(renderRow)}
              </CollapsibleGroup>
            </View>
          );
        })()
      )}

      <CreateFarmerPlanCouponModal visible={isCreateOpen} onClose={() => setIsCreateOpen(false)} initialCategory={initialCategory} />
      <RedeemForFarmerModal visible={isRedeemForFarmerOpen} onClose={() => setIsRedeemForFarmerOpen(false)} theme={theme} />
      <ShareFarmerPlanCouponModal coupon={shareCoupon} visible={!!shareCoupon} onClose={() => setShareCoupon(null)} />
    </View>
  );
}

function CreateFarmerPlanCouponModal({
  visible,
  onClose,
  initialCategory = 'FARMER',
}: {
  visible: boolean;
  onClose: () => void;
  initialCategory?: 'FARMER' | 'ADVISOR';
}) {
  const createCoupon = useCreateFarmerPlanCoupon();
  const { data: advisorsData } = useUsersList({ role: 'ADVISOR', limit: 200 });
  const advisors = advisorsData?.items ?? [];
  const { data: partnersData } = useUsersList({ role: 'BUSINESS_PARTNER', limit: 200 });
  const partners = partnersData?.items ?? [];

  const { data: pricing = [] } = useFarmerPlanPricing();

  const [planCategory, setPlanCategory] = useState<'FARMER' | 'ADVISOR'>(initialCategory);
  const [plan, setPlan] = useState<FarmerPlanType>('PRO');
  const [daysGranted, setDaysGranted] = useState('30');
  const [quantity, setQuantity] = useState('1');
  const [lockMode, setLockMode] = useState<CouponLockMode>('OPEN');
  const [assignedAdvisorId, setAssignedAdvisorId] = useState<string | undefined>(undefined);
  const [assignedBusinessPartnerId, setAssignedBusinessPartnerId] = useState<string | undefined>(undefined);
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [partnerSearch, setPartnerSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successCodes, setSuccessCodes] = useState<string[] | null>(null);

  React.useEffect(() => {
    if (visible) {
      setPlanCategory(initialCategory);
      setPlan('PRO');
    }
  }, [visible, initialCategory]);

  const availableLockModes: CouponLockMode[] = ['OPEN', 'ADVISOR', 'PARTNER'];

  const planPricing = pricing.find((p) => p.plan === plan && Number(p.billingPeriodDays) === Number(daysGranted)) || pricing.find((p) => p.plan === plan);
  const planAmount = (() => {
    const days = Number(daysGranted);
    if (!planPricing || !days) return null;
    const ratio = days / planPricing.billingPeriodDays;
    const amount = Math.round(Number(planPricing.price) * ratio * 100) / 100;
    return amount > 0 ? amount : null;
  })();
  const qty = Math.max(1, parseInt(quantity, 10) || 1);
  const debitPreview = (() => {
    const days = Number(daysGranted);
    if (!planPricing || !days) return null;
    const ratio = days / planPricing.billingPeriodDays;
    const basePrice = Math.round(Number(planPricing.price) * ratio * 100) / 100;
    
    let commission = 0;
    if (lockMode === 'PARTNER') {
      commission = planPricing.partnerShareType === 'PERCENTAGE'
        ? (basePrice * Number(planPricing.partnerShareValue)) / 100
        : Number(planPricing.partnerShareValue || 0) * ratio;
    } else if (lockMode === 'ADVISOR') {
      commission = Number(planPricing.advisorShareValue || 0) * ratio;
    } else {
      return null;
    }

    const netPricePerCoupon = Math.max(0, Math.round((basePrice - commission) * 100) / 100);
    const totalDebit = netPricePerCoupon * qty;
    return { basePrice, commission, netPricePerCoupon, totalDebit };
  })();

  const reset = () => {
    setPlanCategory(initialCategory);
    setPlan('PRO');
    setDaysGranted('30');
    setQuantity('1');
    setLockMode('OPEN');
    setAssignedAdvisorId(undefined);
    setAssignedBusinessPartnerId(undefined);
    setAdvisorSearch('');
    setPartnerSearch('');
    setError(null);
    setSuccessCodes(null);
  };

  const filteredAdvisors = advisors.filter((a) => a.name.toLowerCase().includes(advisorSearch.toLowerCase()));
  const filteredPartners = partners.filter((p) => p.name.toLowerCase().includes(partnerSearch.toLowerCase()));

  const handleSubmit = async () => {
    const days = Number(daysGranted);
    if (!days || days <= 0) {
      setError('Enter a valid number of days.');
      return;
    }
    if (lockMode === 'ADVISOR' && !assignedAdvisorId) {
      setError('Pick an advisor to issue this code to.');
      return;
    }
    if (lockMode === 'PARTNER' && !assignedBusinessPartnerId) {
      setError('Pick a business partner to issue this code to.');
      return;
    }
    const qty = Number(quantity) || 1;
    try {
      const coupons = await createCoupon.mutateAsync({
        plan,
        daysGranted: days,
        quantity: qty,
        assignedAdvisorId: lockMode === 'ADVISOR' ? assignedAdvisorId : undefined,
        assignedBusinessPartnerId: lockMode === 'PARTNER' ? assignedBusinessPartnerId : undefined,
      });
      setSuccessCodes(coupons.map((c) => c.code));
    } catch (err: any) {
      const isNetworkErr = err?.message?.includes('Network Error') || err?.code === 'ERR_NETWORK';
      setError(
        isNetworkErr
          ? 'Network error — could not reach the server. Check your Server IP setting (Login screen → Server IP).'
          : err?.response?.data?.message ?? 'Could not generate code.',
      );
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Generate {planCategory === 'FARMER' ? 'Farmer' : 'Advisor'} Plan Coupon</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {successCodes ? (
            <View style={{ gap: 10 }}>
              {successCodes.map((code) => (
                <View key={code} style={styles.successBox}>
                  <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                  <Text style={styles.successText}>
                    Code generated: <Text style={{ fontFamily: FONT.extraBold }}>{code}</Text>
                  </Text>
                </View>
              ))}
              <TouchableOpacity style={styles.submitBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Text style={styles.label}>Plan Category</Text>
              <View style={styles.chipRow}>
                {(['FARMER', 'ADVISOR'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.partnerChip, planCategory === cat && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => {
                      setPlanCategory(cat);
                      setPlan(cat === 'FARMER' ? 'PRO' : 'SMART');
                      setDaysGranted(cat === 'FARMER' ? '365' : '30');
                    }}
                  >
                    <Text style={[styles.partnerChipText, planCategory === cat && { color: '#ffffff' }]}>
                      {cat === 'FARMER' ? '🌾 Farmer Plan' : '🎓 Advisor Plan'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Plan Option</Text>
              <View style={styles.chipRow}>
                {(planCategory === 'FARMER' ? (['PRO', 'SMART'] as const) : (['SMART', 'SUPER'] as const)).map((p) => {
                  const label = planCategory === 'FARMER' ? (p === 'PRO' ? 'Lite Plan' : 'Pro Plan') : (p === 'SMART' ? 'Smart Plan' : 'Super Plan');
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.partnerChip, plan === p && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={() => setPlan(p)}
                    >
                      <Text style={[styles.partnerChipText, plan === p && { color: '#ffffff' }]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.label}>Days to Grant</Text>
              <View style={styles.chipRow}>
                {(() => {
                  const activeDbVariants = pricing
                    .filter((it) => it.plan === plan && it.isActive !== false)
                    .sort((a, b) => Number(a.billingPeriodDays) - Number(b.billingPeriodDays))
                    .map((it) => String(it.billingPeriodDays));
                  const daysList = activeDbVariants.length > 0
                    ? activeDbVariants
                    : (planCategory === 'FARMER' ? ['180', '365'] : ['30', '90', '180']);

                  return daysList.map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.partnerChip, daysGranted === d && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={() => setDaysGranted(d)}
                    >
                      <Text style={[styles.partnerChipText, daysGranted === d && { color: '#ffffff' }]}>{d} days</Text>
                    </TouchableOpacity>
                  ));
                })()}
              </View>
              {planAmount != null ? (
                <Text style={styles.helperText}>Coupon amount: ₹{planAmount.toLocaleString('en-IN')} for {daysGranted} days</Text>
              ) : null}

              <Text style={styles.label}>Quantity (how many codes to issue)</Text>
              <TextInput style={styles.input} keyboardType="numeric" value={quantity} onChangeText={setQuantity} />

              <Text style={styles.label}>Assign To</Text>
              <View style={styles.chipRow}>
                {availableLockModes.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[styles.partnerChip, lockMode === mode && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                    onPress={() => setLockMode(mode)}
                  >
                    <Text style={[styles.partnerChipText, lockMode === mode && { color: '#ffffff' }]}>
                      {mode === 'OPEN' ? 'Open code' : mode === 'ADVISOR' ? 'Issue to advisor' : 'Issue to partner'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {debitPreview ? (
                <View style={styles.debitPreviewBox}>
                  <Ionicons name="wallet-outline" size={14} color="#b45309" />
                  <Text style={styles.debitPreviewText}>
                    MRP ₹{debitPreview.basePrice} - Comm ₹{debitPreview.commission} = Net ₹{debitPreview.netPricePerCoupon}/code. Total wallet debit ₹{debitPreview.totalDebit.toLocaleString('en-IN')} ({qty}x) from {lockMode === 'ADVISOR' ? 'advisor' : 'partner'}'s wallet on issue (allows negative balance).
                  </Text>
                </View>
              ) : null}

              {lockMode === 'ADVISOR' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Search advisor by name..."
                    placeholderTextColor="#94a3b8"
                    value={advisorSearch}
                    onChangeText={setAdvisorSearch}
                  />
                  {advisorSearch ? (
                    <View style={styles.chipRow}>
                      {filteredAdvisors.slice(0, 8).map((a) => (
                        <TouchableOpacity
                          key={a.id}
                          style={[styles.partnerChip, assignedAdvisorId === a.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                          onPress={() => setAssignedAdvisorId(a.id)}
                        >
                          <Text style={[styles.partnerChipText, assignedAdvisorId === a.id && { color: '#ffffff' }]}>{a.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  {assignedAdvisorId ? (
                    <Text style={styles.helperText}>
                      Issued to advisor: {advisors.find((a) => a.id === assignedAdvisorId)?.name} — they can apply it to any of their farmers.
                    </Text>
                  ) : (
                    <Text style={styles.helperText}>Search and pick an advisor above.</Text>
                  )}
                </>
              ) : lockMode === 'PARTNER' ? (
                <>
                  <TextInput
                    style={styles.input}
                    placeholder="Search business partner by name..."
                    placeholderTextColor="#94a3b8"
                    value={partnerSearch}
                    onChangeText={setPartnerSearch}
                  />
                  {partnerSearch ? (
                    <View style={styles.chipRow}>
                      {filteredPartners.slice(0, 8).map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.partnerChip, assignedBusinessPartnerId === p.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                          onPress={() => setAssignedBusinessPartnerId(p.id)}
                        >
                          <Text style={[styles.partnerChipText, assignedBusinessPartnerId === p.id && { color: '#ffffff' }]}>{p.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  {assignedBusinessPartnerId ? (
                    <Text style={styles.helperText}>
                      Issued to partner: {partners.find((p) => p.id === assignedBusinessPartnerId)?.name} — they earn a commission when a farmer redeems it.
                    </Text>
                  ) : (
                    <Text style={styles.helperText}>Search and pick a business partner above.</Text>
                  )}
                </>
              ) : (
                <Text style={styles.helperText}>Any farmer can redeem this code once.</Text>
              )}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.submitBtn} disabled={createCoupon.isPending} onPress={handleSubmit}>
                {createCoupon.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Generate Code</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function FarmerPlanAddDaysSection() {
  const grantDays = useGrantFarmerPlanDays();
  const { data: farmersData } = useUsersList({ role: 'FARMER', limit: 200 });
  const farmers = farmersData?.items ?? [];
  const { data: advisorsData } = useUsersList({ role: 'ADVISOR', limit: 200 });
  const advisors = advisorsData?.items ?? [];

  const [farmerSearch, setFarmerSearch] = useState('');
  const [farmerId, setFarmerId] = useState<string | undefined>(undefined);
  const [selectedPlan, setSelectedPlan] = useState<FarmerPlanType>('PRO');
  const [advisorSearch, setAdvisorSearch] = useState('');
  const [advisorId, setAdvisorId] = useState<string | undefined>(undefined);
  const [days, setDays] = useState('30');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Awaited<ReturnType<typeof grantDays.mutateAsync>> | null>(null);

  const filteredFarmers = farmers.filter((f) => f.name.toLowerCase().includes(farmerSearch.toLowerCase()));
  const filteredAdvisors = advisors.filter((a) => a.name.toLowerCase().includes(advisorSearch.toLowerCase()));

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);
    const daysValue = Number(days);
    if (!farmerId) {
      setError('Search and pick a farmer.');
      return;
    }
    if (!daysValue || daysValue <= 0) {
      setError('Enter a valid number of days.');
      return;
    }
    try {
      const res = await grantDays.mutateAsync({ farmerId, daysGranted: daysValue, plan: selectedPlan, advisorId });
      setSuccess(res);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not activate plan.');
    }
  };

  return (
    <View style={[styles.couponCard, premiumShadow('#0f172a', 'sm')]}>
      <Text style={styles.sectionTitle}>Direct Plan Activation & Grant Days</Text>
      <Text style={styles.helperText}>Activates or extends a farmer's plan directly. Selecting an Advisor will link them and automatically credit the Advisor Share into their active wallet.</Text>

      <Text style={styles.label}>Farmer</Text>
      <TextInput
        style={styles.input}
        placeholder="Search farmer by name..."
        placeholderTextColor="#94a3b8"
        value={farmerSearch}
        onChangeText={setFarmerSearch}
      />
      {farmerSearch ? (
        <View style={styles.chipRow}>
          {filteredFarmers.slice(0, 8).map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[styles.partnerChip, farmerId === f.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => setFarmerId(f.id)}
            >
              <Text style={[styles.partnerChipText, farmerId === f.id && { color: '#ffffff' }]}>{f.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {farmerId ? <Text style={styles.helperText}>Selected Farmer: {farmers.find((f) => f.id === farmerId)?.name}</Text> : null}

      <Text style={styles.label}>Plan Tier</Text>
      <View style={styles.chipRow}>
        {(['PRO', 'SMART', 'SUPER'] as const).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.partnerChip, selectedPlan === p && { backgroundColor: theme.primary, borderColor: theme.primary }]}
            onPress={() => setSelectedPlan(p)}
          >
            <Text style={[styles.partnerChipText, selectedPlan === p && { color: '#ffffff' }]}>
              {p === 'PRO' ? 'Lite (PRO)' : p === 'SMART' ? 'Pro (SMART)' : 'Super (SUPER)'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Select Advisor (Optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Search advisor by name to link & credit share..."
        placeholderTextColor="#94a3b8"
        value={advisorSearch}
        onChangeText={setAdvisorSearch}
      />
      {advisorSearch ? (
        <View style={styles.chipRow}>
          {filteredAdvisors.slice(0, 8).map((a) => (
            <TouchableOpacity
              key={a.id}
              style={[styles.partnerChip, advisorId === a.id && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => setAdvisorId(a.id)}
            >
              <Text style={[styles.partnerChipText, advisorId === a.id && { color: '#ffffff' }]}>{a.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {advisorId ? (
        <Text style={styles.helperText}>
          Selected Advisor: {advisors.find((a) => a.id === advisorId)?.name} — Advisor Share will be credited to their wallet.
        </Text>
      ) : null}

      <Text style={styles.label}>Days to Grant</Text>
      <TextInput style={styles.input} keyboardType="numeric" value={days} onChangeText={setDays} />

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {success ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={styles.successText}>
            Plan activated successfully! +{success.daysAdded} day(s) added. Expiry: {new Date(success.newEndDate).toLocaleDateString('en-IN')}
          </Text>
        </View>
      ) : null}

      <TouchableOpacity style={[styles.submitBtn, { marginTop: 10 }]} disabled={grantDays.isPending} onPress={handleSubmit}>
        {grantDays.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Activate / Grant Days</Text>}
      </TouchableOpacity>
    </View>
  );
}


function ToggleType({ value, onChange }: { value: DiscountValueType; onChange: (v: DiscountValueType) => void }) {
  return (
    <View style={styles.toggleWrap}>
      <TouchableOpacity
        style={[styles.toggleOption, value === 'PERCENTAGE' && { backgroundColor: theme.primary }]}
        onPress={() => onChange('PERCENTAGE')}
      >
        <Text style={[styles.toggleOptionText, value === 'PERCENTAGE' && { color: '#fff' }]}>%</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.toggleOption, value === 'FIXED' && { backgroundColor: theme.primary }]}
        onPress={() => onChange('FIXED')}
      >
        <Text style={[styles.toggleOptionText, value === 'FIXED' && { color: '#fff' }]}>₹</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  inlineStatBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginTop: 8,
    gap: 6,
  },
  inlineStatText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 11,
    fontFamily: FONT.semiBold,
  },
  inlineStatValue: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: FONT.extraBold,
  },
  inlineStatDot: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginHorizontal: 2,
  },
  tabRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  tabChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  tabChipActive: { backgroundColor: '#ffffff' },
  tabChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' },
  tabChipTextActive: { color: theme.primary },
  list: { padding: SPACING.lg, gap: 12, paddingBottom: SPACING.xxl },
  categoryCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: '#f1f5f9' },
  categoryCardExpanded: { borderColor: theme.primaryLight },
  categoryHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  categoryIconBg: { width: 30, height: 30, borderRadius: 15, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  categoryChevronBg: { width: 24, height: 24, borderRadius: 12, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  categoryTitle: { fontSize: 14.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  createBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: theme.primary, paddingVertical: 12, borderRadius: RADIUS.md },
  createBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 50, gap: 6 },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8' },
  sectionTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a' },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  groupHeaderText: { fontSize: 12.5, fontFamily: FONT.extraBold },
  helperText: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', lineHeight: 15 },
  codeRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fbfcfd', borderRadius: RADIUS.md, padding: 11, borderWidth: 1, borderColor: '#eef1f5', gap: 6 },
  couponCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 8 },
  rateCard: { backgroundColor: '#fbfcfd', borderRadius: RADIUS.md, padding: SPACING.md, borderWidth: 1, borderColor: '#eef1f5', gap: 7 },
  rateCardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rateCardTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  rateCardPrice: { fontSize: 13, fontFamily: FONT.extraBold, color: theme.primary },
  rateCardGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 2, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#eef1f5' },
  rateCardItem: { minWidth: '28%' },
  winFolderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
    marginBottom: 4,
  },
  winFolderTile: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  winFolderTileActive: {
    backgroundColor: '#e0f2fe',
    borderColor: '#0284c7',
  },
  winFolderTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  winFolderTitleActive: {
    color: '#0369a1',
  },
  winFolderSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  iconTabGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  iconTabCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#f1f5f9',
  },
  iconCircleBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconTabTitle: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#1e293b',
    textAlign: 'center',
  },
  iconTabSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
    textAlign: 'center',
  },
  openedCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  backToTabsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  backToTabsText: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
  },
  headerCircleBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openedCardTitle: {
    fontSize: 13.5,
    fontFamily: FONT.extraBold,
  },
  selectPromptCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginTop: 4,
  },
  selectPromptText: {
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
    color: '#64748b',
  },
  rateCardItemLabel: { fontSize: 9.5, fontFamily: FONT.bold, color: '#94a3b8', letterSpacing: 0.2, textTransform: 'uppercase' },
  rateCardItemValue: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a', marginTop: 2 },
  couponHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  couponCode: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: 0.6 },
  couponPartner: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: RADIUS.pill },
  statusBadgeText: { fontSize: 10, fontFamily: FONT.extraBold, letterSpacing: 0.2 },
  couponMetaRow: { flexDirection: 'row', gap: 16 },
  couponMetaText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#334155' },
  couponActionRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  viewUsageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.primaryLight, paddingVertical: 9, borderRadius: RADIUS.md },
  viewUsageBtnText: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary },
  removeBtn: { width: 38, height: 38, borderRadius: RADIUS.md, backgroundColor: '#fee2e2', alignItems: 'center', justifyContent: 'center' },
  usagePanel: { borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 8, gap: 8 },
  usageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: RADIUS.sm, padding: 8 },
  usageCustomer: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  usageDate: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8' },
  usageAmount: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#334155' },
  usageCommission: { fontSize: 11.5, fontFamily: FONT.bold, color: '#16a34a' },
  usagePending: { fontSize: 11.5, fontFamily: FONT.bold, color: '#d97706' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 460, maxHeight: '88%', backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  label: { fontSize: 11.5, fontFamily: FONT.extraBold, color: '#475569', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.2 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  dropdownPanel: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, backgroundColor: '#f8fafc', padding: 6 },
  dropdownRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8, paddingHorizontal: 6 },
  dropdownRowText: { fontSize: 13, fontFamily: FONT.medium, color: '#0f172a', flex: 1 },
  partnerChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  partnerChipText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#334155' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  toggleWrap: { flexDirection: 'row', borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1.5, borderColor: '#e2e8f0' },
  toggleOption: { width: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
  toggleOptionText: { fontSize: 14, fontFamily: FONT.bold, color: '#334155' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#15803d' },
  debitPreviewBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#fde68a' },
  debitPreviewText: { flex: 1, fontSize: 11.5, fontFamily: FONT.medium, color: '#92400e' },
  finSummaryCard: { backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 8 },
  finSummaryTitle: { fontSize: 13, fontFamily: FONT.extraBold, color: '#166534' },
  finSummaryItem: { minWidth: '45%', flex: 1, backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#dcfce7' },
  mainFolderGrid: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 4,
  },
  mainFolderCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 3,
    position: 'relative',
  },
  mainFolderIconBox: {
    width: 48,
    height: 44,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 2,
  },
  mainFolderEmoji: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    fontSize: 10,
  },
  mainFolderCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  mainFolderTitle: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    textAlign: 'center',
  },
  mainFolderSub: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
  },
  finSummaryLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  finSummaryValue: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    marginTop: 2,
  },
});

/** Super Admin User Guides & Documentation Books Download Section */
function AdminUserGuidesSection() {
  const { data: docsList = [], isLoading } = useAdminDocsList();
  const downloadDoc = useDownloadAdminDoc();

  const [selectedLang, setSelectedLang] = useState<'pa' | 'en' | 'hi'>('pa');
  const [selectedDoc, setSelectedDoc] = useState<{ title: string; fileName: string; content: string } | null>(null);

  const handleDownloadPdf = async (docKey: string) => {
    tap();
    try {
      const result = await downloadDoc.mutateAsync({ docKey, lang: selectedLang });
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(result.htmlPdfContent || result.content);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 300);
        }
      } else {
        setSelectedDoc(result);
      }
    } catch {
      alert('Could not generate PDF download.');
    }
  };


  if (isLoading) return <ActivityIndicator color={theme.primary} style={{ marginVertical: 15 }} />;

  return (
    <View style={{ gap: 10, paddingVertical: 4 }}>
      {/* Multi-Language Selector Bar */}
      <View style={{ backgroundColor: '#f8fafc', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0' }}>
        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#475569', marginBottom: 6 }}>
          🌐 Choose Guide Language for PDF Generation:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {LANGUAGE_OPTIONS.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.partnerChip,
                { paddingHorizontal: 10, paddingVertical: 6 },
                selectedLang === lang.code && { backgroundColor: theme.primary, borderColor: theme.primary },
              ]}
              onPress={() => setSelectedLang(lang.code as any)}
            >
              <Text style={[styles.partnerChipText, selectedLang === lang.code && { color: '#ffffff' }]}>
                {lang.icon} {lang.nativeName} ({lang.englishName})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>


      {/* Docs List */}
      {docsList.map((doc: any) => (
        <View key={doc.key} style={[styles.couponCard, premiumShadow('#0f172a', 'sm'), { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12 }]}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={{ fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' }}>{doc.title}</Text>
            <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 }}>{doc.description}</Text>
            <Text style={{ fontSize: 10, fontFamily: FONT.bold, color: theme.primary, marginTop: 4 }}>📄 {doc.fileName.replace('.md', `_${selectedLang.toUpperCase()}.pdf`)}</Text>
          </View>

          <TouchableOpacity
            style={[styles.partnerChip, { backgroundColor: '#15803d', borderColor: '#15803d' }]}
            activeOpacity={0.8}
            onPress={() => handleDownloadPdf(doc.key)}
            disabled={downloadDoc.isPending}
          >
            <Text style={[styles.partnerChipText, { color: '#ffffff', fontSize: 11 }]}>📄 Download PDF</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Mobile Text Viewer Modal */}
      <Modal visible={!!selectedDoc} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>{selectedDoc?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedDoc(null)}>
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ flex: 1 }}>
              <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#334155', lineHeight: 18 }}>{selectedDoc?.content}</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}



