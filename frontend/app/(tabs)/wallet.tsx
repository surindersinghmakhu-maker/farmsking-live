import React, { useState } from 'react';
import { ActivityIndicator, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useMyWallet } from '@/src/hooks/useWallet';
import { useCreateWithdrawal, useMyWithdrawals } from '@/src/hooks/useWithdrawals';
import { useCouponRedemptions, useMyCoupons } from '@/src/hooks/useCoupons';
import { useMineFarmerPlanCoupons, useMinePartnerFarmerPlanCoupons, useGenerateOwnFarmerPlanCoupon, useFarmerPlanPricing } from '@/src/hooks/useFarmerPlan';
import { useFarmersList } from '@/src/hooks/useAdvisorAssignments';
import { useSearchBusinessPartners } from '@/src/hooks/useUsersAdmin';
import type { FarmerPlanPricing, FarmerPlanType } from '@/src/api/farmerPlans.api';
import { useAvailableBasicPlanCoupons, useMyPurchasedBasicPlanCoupons, usePurchaseBasicPlanCoupon } from '@/src/hooks/useBasicPlanCoupons';
import { Coupon, DiscountValueType, WalletTransaction } from '@/src/types/api';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { CopyButton } from '@/src/components/CopyButton';
import { RedeemForFarmerModal } from '@/src/components/RedeemForFarmerModal';
import { CouponCardPreview, FarmerPlanCouponCardPreview, useShareCouponAsJpg } from '@/src/components/CouponCardPreview';

const staticTheme = RoleThemes.BUSINESS_PARTNER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function formatValue(type: DiscountValueType, value: string, maxCap?: string | null) {
  const base = type === 'PERCENTAGE' ? `${value}%` : `₹${value}`;
  return type === 'PERCENTAGE' && maxCap ? `${base} (max ₹${maxCap})` : base;
}

function couponPlanAmount(pricing: FarmerPlanPricing[], plan: FarmerPlanType, daysGranted: number): number | null {
  const p = pricing.find((row) => row.plan === plan);
  if (!p) return null;
  const amount = Math.round(Number(p.price) * (daysGranted / p.billingPeriodDays) * 100) / 100;
  return amount > 0 ? amount : null;
}

export default function WalletScreen() {
  const { user } = useAuth();
  const { role: currentRole } = useRole();
  const theme = RoleThemes[currentRole];
  const { data: wallet, isLoading: isLoadingWallet } = useMyWallet();
  const { data: withdrawals } = useMyWithdrawals();
  const { data: coupons, isLoading: isLoadingCoupons } = useMyCoupons();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [expandedCouponId, setExpandedCouponId] = useState<string | null>(null);
  const [isRedeemForFarmerOpen, setIsRedeemForFarmerOpen] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const pendingWithdrawals = (withdrawals ?? []).filter((w) => w.status === 'PENDING');

  const userDeactivated = user?.deactivatedRoles ?? [];
  const userRoles: string[] = (Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles : [user?.role || currentRole])
    .filter((r) => r && !userDeactivated.includes(r as any)) as string[];

  const isAdvisor = userRoles.includes('ADVISOR') || userRoles.includes('FARM_ADVISOR') || userRoles.includes('GARDEN_ADVISOR') || currentRole === 'FARM_ADVISOR' || currentRole === 'GARDEN_ADVISOR';
  const isPartner = userRoles.includes('BUSINESS_PARTNER') || currentRole === 'BUSINESS_PARTNER';
  const isAdvisorOrPartner = isAdvisor || isPartner;

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>My Wallet</Text>
        {user?.kingId ? (
          <View style={styles.kingIdBadge}>
            <Ionicons name="key-outline" size={12} color={theme.primary} />
            <Text style={[styles.kingIdText, { color: theme.primary }]}>King ID: {user.kingId}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={theme.gradient} style={[styles.balanceCard, premiumShadow(theme.primary, 'md')]}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          {isLoadingWallet ? (
            <ActivityIndicator color="#ffffff" style={{ marginTop: 10 }} />
          ) : (
            <Text style={styles.balanceValue}>₹{(wallet?.balance ?? 0).toLocaleString('en-IN')}</Text>
          )}

          {pendingWithdrawals.length > 0 ? (
            <Text style={styles.pendingNote}>
              ₹{pendingWithdrawals.reduce((sum, w) => sum + Number(w.requestedAmount), 0).toLocaleString('en-IN')} pending approval
            </Text>
          ) : null}

          <TouchableOpacity
            style={styles.withdrawButton}
            activeOpacity={0.85}
            onPress={() => {
              tap();
              setIsWithdrawOpen(true);
            }}
          >
            <Text style={[styles.withdrawText, { color: theme.primary }]}>Withdraw</Text>
          </TouchableOpacity>
        </LinearGradient>

        <Text style={styles.sectionTitle}>My Discount & Referral Coupons</Text>
        {isLoadingCoupons ? (
          <ActivityIndicator color={theme.primary} />
        ) : !coupons || coupons.length === 0 ? (
          <View style={[styles.txCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.emptyText}>No discount coupons issued to you yet.</Text>
          </View>
        ) : (
          coupons.map((c) => (
            <MyCouponCard
              key={c.id}
              coupon={c}
              theme={theme}
              isExpanded={expandedCouponId === c.id}
              onToggle={() => setExpandedCouponId((cur) => (cur === c.id ? null : c.id))}
            />
          ))
        )}

        {/* Unified Plan Coupons Hub for Advisors & Business Partners */}
        {isAdvisorOrPartner ? <MyUnifiedPlanCouponsSection theme={theme} /> : null}

        <Text style={styles.sectionTitle}>Transaction History</Text>
        <View style={[styles.txCard, premiumShadow('#0f172a', 'sm')]}>
          {!wallet || wallet.transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet.</Text>
          ) : (
            wallet.transactions.map((tx, idx) => (
              <TransactionRow
                key={tx.id}
                tx={tx}
                theme={theme}
                isLast={idx === wallet.transactions.length - 1}
                isExpanded={expandedTxId === tx.id}
                onToggle={() => setExpandedTxId((cur) => (cur === tx.id ? null : tx.id))}
              />
            ))
          )}
        </View>
      </ScrollView>

      <WithdrawModal visible={isWithdrawOpen} balance={wallet?.balance ?? 0} onClose={() => setIsWithdrawOpen(false)} />
      <RedeemForFarmerModal visible={isRedeemForFarmerOpen} onClose={() => setIsRedeemForFarmerOpen(false)} theme={theme} />
    </View>
  );
}

type RoleTheme = (typeof RoleThemes)[keyof typeof RoleThemes];

function TransactionRow({
  tx,
  theme,
  isLast,
  isExpanded,
  onToggle,
}: {
  tx: WalletTransaction;
  theme: RoleTheme;
  isLast: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const positive = tx.type === 'CREDIT';
  const created = new Date(tx.createdAt);

  return (
    <View style={!isLast ? styles.txRowWrap : undefined}>
      <TouchableOpacity
        style={styles.txRow}
        activeOpacity={0.7}
        onPress={() => {
          tap();
          onToggle();
        }}
      >
        <View style={[styles.txIconBg, { backgroundColor: positive ? theme.primaryLight : '#fef2f2' }]}>
          <Ionicons name={positive ? 'arrow-down' : 'arrow-up'} size={15} color={positive ? theme.primary : '#dc2626'} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txLabel} numberOfLines={isExpanded ? undefined : 1}>{tx.reason}</Text>
          <Text style={styles.txDate}>{created.toLocaleDateString('en-IN')}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 2 }}>
          <Text style={[styles.txAmount, { color: positive ? theme.primary : '#dc2626' }]}>
            {positive ? '+' : '-'} ₹{Number(tx.amount).toLocaleString('en-IN')}
          </Text>
          <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color="#94a3b8" />
        </View>
      </TouchableOpacity>

      {isExpanded ? (
        <View style={[styles.txDetailBox, isLast && { marginBottom: 0 }]}>
          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Type</Text>
            <Text style={styles.txDetailValue}>{positive ? 'Credit (Money In)' : 'Debit (Money Out)'}</Text>
          </View>
          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Date & Time</Text>
            <Text style={styles.txDetailValue}>
              {created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Amount</Text>
            <Text style={styles.txDetailValue}>₹{Number(tx.amount).toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Reason</Text>
            <Text style={[styles.txDetailValue, { flex: 1, textAlign: 'right' }]}>{tx.reason}</Text>
          </View>
          {tx.relatedUser ? (
            <View style={styles.txDetailRow}>
              <Text style={styles.txDetailLabel}>Farmer</Text>
              <Text style={[styles.txDetailValue, { flex: 1, textAlign: 'right' }]}>
                {tx.relatedUser.name}{tx.relatedUser.kingId ? ` (ID: ${tx.relatedUser.kingId})` : ''}{'\n'}
                📞 {tx.relatedUser.mobile}
              </Text>
            </View>
          ) : null}
          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Transaction ID</Text>
            <Text style={[styles.txDetailValue, { fontSize: 9.5 }]} numberOfLines={1}>{tx.id}</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function MyCouponCard({
  coupon,
  theme,
  isExpanded,
  onToggle,
}: {
  coupon: Coupon;
  theme: RoleTheme;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { data: redemptions, isLoading } = useCouponRedemptions(coupon.id, isExpanded);
  const isExpired = new Date(coupon.expiresAt) < new Date();
  const [isShareOpen, setIsShareOpen] = useState(false);

  return (
    <View style={[styles.txCard, premiumShadow('#0f172a', 'sm'), { marginBottom: 10 }]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View>
          <Text style={styles.couponCode}>{coupon.code}</Text>
          <Text style={styles.txDate}>
            Commission {formatValue(coupon.commissionType, coupon.commissionValue, coupon.commissionMaxCap)} · Discount{' '}
            {formatValue(coupon.discountType, coupon.discountValue, coupon.discountMaxCap)}
          </Text>
          <Text style={styles.txDate}>
            Issued {new Date(coupon.createdAt).toLocaleDateString('en-IN')} · Expires {new Date(coupon.expiresAt).toLocaleDateString('en-IN')}
          </Text>
        </View>
        <View style={[styles.statusBadge, !coupon.isActive || isExpired ? { backgroundColor: '#fee2e2' } : { backgroundColor: '#dcfce7' }]}>
          <Text style={[styles.statusBadgeText, !coupon.isActive || isExpired ? { color: '#dc2626' } : { color: '#16a34a' }]}>
            {!coupon.isActive ? 'Removed' : isExpired ? 'Expired' : 'Active'}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', gap: 16, marginTop: 4 }}>
        <TouchableOpacity style={styles.viewUsageBtn} activeOpacity={0.85} onPress={onToggle}>
          <Ionicons name={isExpanded ? 'chevron-up' : 'receipt-outline'} size={13} color={theme.primary} />
          <Text style={[styles.viewUsageBtnText, { color: theme.primary }]}>
            {isExpanded ? 'Hide' : `Used ${coupon.usedCount}/${coupon.usageLimit} — View Bills`}
          </Text>
        </TouchableOpacity>
        {coupon.isActive && !isExpired ? (
          <TouchableOpacity style={styles.viewUsageBtn} activeOpacity={0.85} onPress={() => setIsShareOpen(true)}>
            <Ionicons name="share-social-outline" size={13} color={theme.primary} />
            <Text style={[styles.viewUsageBtnText, { color: theme.primary }]}>Share Coupon</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ShareCouponModal coupon={coupon} visible={isShareOpen} onClose={() => setIsShareOpen(false)} theme={theme} />

      {isExpanded ? (
        <View style={{ marginTop: 8, gap: 6 }}>
          {isLoading ? (
            <ActivityIndicator color={theme.primary} />
          ) : !redemptions || redemptions.length === 0 ? (
            <Text style={styles.emptyText}>No bills yet on this code.</Text>
          ) : (
            redemptions.map((r) => (
              <View key={r.id} style={styles.usageRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.txLabel}>{r.customer?.name ?? 'Customer'}</Text>
                  <Text style={styles.txDate}>{new Date(r.redeemedAt).toLocaleDateString('en-IN')}</Text>
                </View>
                <Text style={styles.txLabel}>Bill ₹{r.orderAmount}</Text>
                {r.creditedAt ? (
                  <Text style={[styles.txAmount, { color: theme.primary }]}>+₹{r.commissionAmount}</Text>
                ) : (
                  <Text style={[styles.txAmount, { color: '#d97706' }]}>Pending ₹{r.commissionAmount}</Text>
                )}
              </View>
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function ShareCouponModal({
  coupon,
  visible,
  onClose,
  theme,
}: {
  coupon: Coupon;
  visible: boolean;
  onClose: () => void;
  theme: RoleTheme;
}) {
  const { cardShotRef, isSharing, shareCouponAsJpg } = useShareCouponAsJpg();

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
            style={[styles.submitBtn, { backgroundColor: theme.primary, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
            activeOpacity={0.85}
            disabled={isSharing}
            onPress={() => shareCouponAsJpg(`Coupon-${coupon.code}`)}
          >
            {isSharing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Share</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function ShareFarmerPlanCouponModal({
  coupon,
  visible,
  onClose,
  theme,
}: {
  coupon: { code: string; plan: string; daysGranted: number; expiresAt?: string | Date | null; mrp?: number | string | null } | null;
  visible: boolean;
  onClose: () => void;
  theme: RoleTheme;
}) {
  const { cardShotRef, isSharing, shareCouponAsJpg } = useShareCouponAsJpg();
  if (!coupon) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { alignItems: 'center' }]}>
          <View style={[styles.modalHeaderRow, { width: '100%' }]}>
            <Text style={styles.modalTitle}>Share Plan Coupon Card</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ViewShot ref={cardShotRef} options={{ format: 'jpg', quality: 0.95 }}>
            <FarmerPlanCouponCardPreview coupon={coupon} />
          </ViewShot>

          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: theme.primary, width: '100%', flexDirection: 'row', justifyContent: 'center', gap: 8 }]}
            activeOpacity={0.85}
            disabled={isSharing}
            onPress={() => shareCouponAsJpg(`Coupon-${coupon.code}`)}
          >
            {isSharing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="share-social-outline" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Share JPG Card</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/** Unified Plan Coupons Section for Advisors & Business Partners — combines Advisor & Partner plan coupons into 1 single wallet hub */
function MyUnifiedPlanCouponsSection({ theme }: { theme: RoleTheme }) {
  const { data: advisorCoupons, isLoading: isLoadingAdvisor } = useMineFarmerPlanCoupons();
  const { data: partnerCoupons, isLoading: isLoadingPartner } = useMinePartnerFarmerPlanCoupons();
  const { data: pricing = [] } = useFarmerPlanPricing();
  
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isRedeemForFarmerOpen, setIsRedeemForFarmerOpen] = useState(false);
  const [statusTab, setStatusTab] = useState<'UNUSED' | 'USED'>('UNUSED');
  const [shareCoupon, setShareCoupon] = useState<{ code: string; plan: string; daysGranted: number; expiresAt?: string | Date | null; mrp?: number | string | null } | null>(null);

  const isLoading = isLoadingAdvisor || isLoadingPartner;

  // Merge and deduplicate by coupon ID
  const allMap = new Map<string, any>();
  (advisorCoupons ?? []).forEach((c) => allMap.set(c.id, c));
  (partnerCoupons ?? []).forEach((c) => allMap.set(c.id, c));
  const allCoupons = Array.from(allMap.values());

  const unused = allCoupons.filter((c) => !c.isUsed);
  const used = allCoupons.filter((c) => c.isUsed);
  const active = statusTab === 'UNUSED' ? unused : used;

  return (
    <>
      <Text style={styles.sectionTitle}>My Plan Coupons Wallet</Text>

      {/* Unified Action Buttons */}
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
        <TouchableOpacity
          style={[styles.generateBtn, { flex: 1, backgroundColor: theme.primary, marginTop: 0 }]}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setIsGenerateOpen(true);
          }}
        >
          <Ionicons name="add-circle" size={16} color="#ffffff" />
          <Text style={styles.generateBtnText}>Generate Coupon</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.generateBtn, { flex: 1, backgroundColor: '#f0fdf4', borderWidth: 1.5, borderColor: '#86efac', marginTop: 0 }]}
          activeOpacity={0.85}
          onPress={() => {
            tap();
            setIsRedeemForFarmerOpen(true);
          }}
        >
          <Ionicons name="pricetag" size={16} color="#15803d" />
          <Text style={[styles.generateBtnText, { color: '#15803d' }]}>Apply for Farmer</Text>
        </TouchableOpacity>
      </View>

      {!isLoading && allCoupons.length > 0 ? (
        <View style={styles.chipRow}>
          {(['UNUSED', 'USED'] as const).map((key) => (
            <TouchableOpacity
              key={key}
              style={[styles.chip, statusTab === key && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => {
                tap();
                setStatusTab(key);
              }}
            >
              <Text style={[styles.chipText, statusTab === key && { color: '#ffffff' }]}>
                {key === 'UNUSED' ? 'Unused' : 'Used'} ({key === 'UNUSED' ? unused.length : used.length})
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      <View style={[styles.txCard, premiumShadow('#0f172a', 'sm')]}>
        {isLoading ? (
          <ActivityIndicator color={theme.primary} />
        ) : allCoupons.length === 0 ? (
          <Text style={styles.emptyText}>No plan coupons generated or assigned to you yet.</Text>
        ) : active.length === 0 ? (
          <Text style={styles.emptyText}>None {statusTab === 'UNUSED' ? 'unused' : 'used'}.</Text>
        ) : (
          active.map((c, idx) => (
            <View key={c.id} style={[styles.txRow, idx === active.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.txInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.txLabel}>{c.code} · {c.plan}</Text>
                  <CopyButton value={c.code} color={theme.primary} />
                  <TouchableOpacity
                    style={{ padding: 2 }}
                    onPress={() => setShareCoupon({ code: c.code, plan: c.plan, daysGranted: c.daysGranted, expiresAt: c.expiresAt, mrp: couponPlanAmount(pricing, c.plan, c.daysGranted) })}
                  >
                    <Ionicons name="share-social-outline" size={16} color={theme.primary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.txDate}>
                  {c.daysGranted} days
                  {(() => {
                    const amount = couponPlanAmount(pricing, c.plan, c.daysGranted);
                    return amount != null ? ` · ₹${amount.toLocaleString('en-IN')} value` : '';
                  })()}
                </Text>
                <Text style={styles.txDate}>
                  {c.generationCostAmount ? `₹${c.generationCostAmount} debited · ` : ''}
                  Issued: {new Date(c.createdAt).toLocaleDateString('en-IN')}
                  {c.expiresAt ? ` · Expires: ${new Date(c.expiresAt).toLocaleDateString('en-IN')}` : ''}
                </Text>
              </View>

              <View style={[styles.statusBadge, c.isUsed ? { backgroundColor: '#f1f5f9' } : { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.statusBadgeText, c.isUsed ? { color: '#64748b' } : { color: '#16a34a' }]}>
                  {c.isUsed ? 'Used' : 'Unused'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <GenerateCouponModal visible={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} />
      <RedeemForFarmerModal visible={isRedeemForFarmerOpen} onClose={() => setIsRedeemForFarmerOpen(false)} theme={theme} />
      <ShareFarmerPlanCouponModal coupon={shareCoupon} visible={!!shareCoupon} onClose={() => setShareCoupon(null)} theme={theme} />
    </>
  );
}

/** Plan coupons (issued by admin) sitting in this advisor's own account — they apply these to any of their assigned farmers. */
function MyRenewalCouponsSection() {
  return null;
}

/** Advisor self-service: generate their own Farmer Plan (BASIC) or Advisor Plan (STANDARD/PREMIUM) coupon — price minus their Coupon Setting fee % is debited from their wallet. */
function GenerateCouponModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const generate = useGenerateOwnFarmerPlanCoupon();
  const { data: pricing = [] } = useFarmerPlanPricing();
  const { data: farmersData } = useFarmersList('ACTIVE');
  const farmers = farmersData ?? [];

  const [plan, setPlan] = useState<FarmerPlanType>('PRO');
  const [daysGranted, setDaysGranted] = useState('30');
  const [quantityStr, setQuantityStr] = useState('1');
  const [assignedFarmerId, setAssignedFarmerId] = useState<string | undefined>(undefined);
  const [farmerSearch, setFarmerSearch] = useState('');
  const [assignedPartnerId, setAssignedPartnerId] = useState<string | undefined>(undefined);
  const [partnerSearch, setPartnerSearch] = useState('');
  const { data: partnerResults = [] } = useSearchBusinessPartners(partnerSearch);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const { user } = useAuth();
  const { role: currentRole } = useRole();
  const userDeactivated = user?.deactivatedRoles ?? [];
  const userRoles: string[] = (Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles : [user?.role || currentRole])
    .filter((r) => r && !userDeactivated.includes(r as any)) as string[];

  const isAdvisorOrAdmin = userRoles.includes('ADVISOR') || userRoles.includes('FARM_ADVISOR') || userRoles.includes('GARDEN_ADVISOR') || userRoles.includes('ADMIN') || userRoles.includes('SUPER_ADMIN');
  const availablePlans = isAdvisorOrAdmin ? (['PRO', 'SMART', 'SUPER'] as const) : (['PRO', 'SMART'] as const);

  const reset = () => {
    setPlan('PRO');
    setDaysGranted('30');
    setQuantityStr('1');
    setAssignedFarmerId(undefined);
    setFarmerSearch('');
    setAssignedPartnerId(undefined);
    setPartnerSearch('');
    setError(null);
    setSuccessCode(null);
  };

  const quantity = Math.max(1, parseInt(quantityStr, 10) || 1);
  const planPricing = pricing.find((p) => p.plan === plan);
  const ratio = planPricing ? Number(daysGranted) / planPricing.billingPeriodDays : 0;
  const basePrice = planPricing ? Math.round(Number(planPricing.price) * ratio * 100) / 100 : 0;

  let commission = 0;
  if (planPricing) {
    if (!isAdvisorOrAdmin && userRoles.includes('BUSINESS_PARTNER')) {
      commission = planPricing.partnerShareType === 'PERCENTAGE'
        ? (basePrice * Number(planPricing.partnerShareValue)) / 100
        : Number(planPricing.partnerShareValue || 0) * ratio;
    } else {
      commission = Number(planPricing.advisorShareValue || 0) * ratio;
    }
  }
  const netPricePerCoupon = Math.max(0, Math.round((basePrice - commission) * 100) / 100);
  const totalNetDebit = netPricePerCoupon * quantity;

  const filteredFarmers = farmers.filter((f) => (f.farmer?.name ?? '').toLowerCase().includes(farmerSearch.toLowerCase()));

  const handleSubmit = async () => {
    setError(null);
    const days = Number(daysGranted);
    if (!days || days <= 0) {
      setError('Enter a valid number of days.');
      return;
    }
    try {
      const res = await generate.mutateAsync({
        plan,
        daysGranted: days,
        quantity,
        assignedFarmerId: assignedPartnerId ? undefined : assignedFarmerId,
        assignedBusinessPartnerId: assignedPartnerId,
      });
      const count = Array.isArray(res) ? res.length : 1;
      const firstCode = Array.isArray(res) ? res[0]?.code : res?.code;
      setSuccessCode(count > 1 ? `${count} Coupons generated successfully!` : firstCode);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not generate coupon.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Generate Plan Coupon</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {successCode ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  {successCode}
                </Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <Text style={styles.label}>Plan</Text>
              <View style={styles.chipRow}>
                {availablePlans.map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.chip, plan === p && { backgroundColor: staticTheme.primary, borderColor: staticTheme.primary }]}
                    onPress={() => setPlan(p)}
                  >
                    <Text style={[styles.chipText, plan === p && { color: '#ffffff' }]}>
                      {p === 'PRO' ? 'Lite Plan' : p === 'SMART' ? 'Pro Plan' : 'Smart Plan'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Days to Grant</Text>
              <View style={styles.chipRow}>
                {(['30', '90', '180', '365'] as const).map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, daysGranted === d && { backgroundColor: staticTheme.primary, borderColor: staticTheme.primary }]}
                    onPress={() => setDaysGranted(d)}
                  >
                    <Text style={[styles.chipText, daysGranted === d && { color: '#ffffff' }]}>{d} days</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Quantity</Text>
              <View style={styles.chipRow}>
                {(['1', '2', '5', '10'] as const).map((q) => (
                  <TouchableOpacity
                    key={q}
                    style={[styles.chip, quantityStr === q && { backgroundColor: staticTheme.primary, borderColor: staticTheme.primary }]}
                    onPress={() => setQuantityStr(q)}
                  >
                    <Text style={[styles.chipText, quantityStr === q && { color: '#ffffff' }]}>{q} Coupon{q !== '1' ? 's' : ''}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: RADIUS.md, marginTop: 4, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#64748b' }}>MRP Base Price:</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' }}>₹{basePrice.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#16a34a' }}>Your Commission Cut:</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' }}>-₹{commission.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 4, marginTop: 2 }}>
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' }}>Net Cost per Coupon:</Text>
                  <Text style={{ fontSize: 12, fontFamily: FONT.extraBold, color: '#0f172a' }}>₹{netPricePerCoupon.toLocaleString('en-IN')}</Text>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: staticTheme.primary }}>Total Wallet Debit ({quantity}x):</Text>
                  <Text style={{ fontSize: 13, fontFamily: FONT.extraBold, color: staticTheme.primary }}>₹{totalNetDebit.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {!assignedPartnerId ? (
                <>
                  <Text style={styles.label}>Lock to a Farmer (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Search your farmers by name..."
                    placeholderTextColor="#94a3b8"
                    value={farmerSearch}
                    onChangeText={setFarmerSearch}
                  />
                  {farmerSearch ? (
                    <View style={styles.chipRow}>
                      {filteredFarmers.slice(0, 8).map((f) => (
                        <TouchableOpacity
                          key={f.farmerId}
                          style={[styles.chip, assignedFarmerId === f.farmerId && { backgroundColor: staticTheme.primary, borderColor: staticTheme.primary }]}
                          onPress={() => setAssignedFarmerId(f.farmerId)}
                        >
                          <Text style={[styles.chipText, assignedFarmerId === f.farmerId && { color: '#ffffff' }]}>{f.farmer?.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  ) : null}
                  {assignedFarmerId ? (
                    <Text style={styles.emptyText}>Locked to: {farmers.find((f) => f.farmerId === assignedFarmerId)?.farmer?.name}</Text>
                  ) : (
                    <Text style={styles.emptyText}>Leave blank for an open code you can hand to any of your farmers.</Text>
                  )}
                </>
              ) : null}

              {!assignedFarmerId ? (
                <>
                  <Text style={styles.label}>Share with a Business Partner (optional)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Search by name or king id..."
                    placeholderTextColor="#94a3b8"
                    value={partnerSearch}
                    onChangeText={(v) => {
                      setPartnerSearch(v);
                      if (!v) setAssignedPartnerId(undefined);
                    }}
                  />
                  {partnerSearch && !assignedPartnerId ? (
                    <View style={styles.chipRow}>
                      {partnerResults.map((p) => (
                        <TouchableOpacity
                          key={p.id}
                          style={styles.chip}
                          onPress={() => {
                            setAssignedPartnerId(p.id);
                            setPartnerSearch(p.name);
                          }}
                        >
                          <Text style={styles.chipText}>
                            {p.name} {p.kingId ? `(${p.kingId})` : ''}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      {partnerResults.length === 0 ? <Text style={styles.emptyText}>No matches.</Text> : null}
                    </View>
                  ) : null}
                  {assignedPartnerId ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={styles.emptyText}>Sharing with: {partnerSearch}</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setAssignedPartnerId(undefined);
                          setPartnerSearch('');
                        }}
                      >
                        <Ionicons name="close-circle" size={16} color="#64748b" />
                      </TouchableOpacity>
                    </View>
                  ) : null}
                </>
              ) : null}

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.submitBtn} disabled={generate.isPending} onPress={handleSubmit}>
                {generate.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Generate Code</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Plan coupons issued by admin to this business partner — they earn a commission whenever a farmer redeems one. */
function BasicPlanCouponMarketSection({ theme, balance }: { theme: RoleTheme; balance: number }) {
  const { data: available, isLoading: isLoadingAvailable } = useAvailableBasicPlanCoupons();
  const { data: purchased, isLoading: isLoadingPurchased } = useMyPurchasedBasicPlanCoupons();
  const purchase = usePurchaseBasicPlanCoupon();
  const [error, setError] = useState<string | null>(null);
  const [buyingCode, setBuyingCode] = useState<string | null>(null);

  const handleBuy = async (code: string, price: number) => {
    setError(null);
    if (balance < price) {
      setError('Insufficient wallet balance for this coupon.');
      return;
    }
    setBuyingCode(code);
    try {
      await purchase.mutateAsync(code);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not purchase coupon.');
    } finally {
      setBuyingCode(null);
    }
  };

  return (
    <>
      <Text style={styles.sectionTitle}>Basic Plan Coupons — Buy at 10% Off</Text>
      <View style={[styles.txCard, premiumShadow('#0f172a', 'sm')]}>
        {isLoadingAvailable ? (
          <ActivityIndicator color={theme.primary} />
        ) : !available || available.length === 0 ? (
          <Text style={styles.emptyText}>No Basic Plan coupons available to buy right now.</Text>
        ) : (
          available.map((c, idx) => {
            const price = Number(c.listPrice) * 0.9;
            return (
              <View key={c.id} style={[styles.txRow, idx === available.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={styles.txInfo}>
                  <Text style={styles.txLabel}>{c.daysGranted} days · BASIC plan</Text>
                  <Text style={styles.txDate}>
                    List ₹{c.listPrice} · You pay ₹{price.toFixed(2)} (10% off)
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.withdrawButton, { backgroundColor: theme.primary, paddingHorizontal: 14 }]}
                  disabled={purchase.isPending && buyingCode === c.code}
                  onPress={() => handleBuy(c.code, price)}
                >
                  {purchase.isPending && buyingCode === c.code ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={[styles.withdrawText, { color: '#ffffff' }]}>Buy</Text>
                  )}
                </TouchableOpacity>
              </View>
            );
          })
        )}
        {error ? <Text style={[styles.emptyText, { color: '#dc2626' }]}>{error}</Text> : null}
      </View>

      <Text style={styles.sectionTitle}>My Purchased Basic Plan Coupons</Text>
      <View style={[styles.txCard, premiumShadow('#0f172a', 'sm')]}>
        {isLoadingPurchased ? (
          <ActivityIndicator color={theme.primary} />
        ) : !purchased || purchased.length === 0 ? (
          <Text style={styles.emptyText}>You haven't bought any Basic Plan coupons yet.</Text>
        ) : (
          purchased.map((c, idx) => (
            <View key={c.id} style={[styles.txRow, idx === purchased.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.txInfo}>
                <Text style={styles.txLabel}>{c.code} · {c.daysGranted} days</Text>
                <Text style={styles.txDate}>Paid ₹{c.purchasePrice} · Hand this code out to a farmer</Text>
              </View>
              <CopyButton value={c.code} color={theme.primary} />
              <View style={[styles.statusBadge, c.isUsed ? { backgroundColor: '#f1f5f9' } : { backgroundColor: '#dcfce7' }]}>
                <Text style={[styles.statusBadgeText, c.isUsed ? { color: '#64748b' } : { color: '#16a34a' }]}>
                  {c.isUsed ? 'Used' : 'Unused'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </>
  );
}

function MyPartnerPlanCouponsSection() {
  return null;
}



function WithdrawModal({ visible, balance, onClose }: { visible: boolean; balance: number; onClose: () => void }) {
  const createWithdrawal = useCreateWithdrawal();
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const reset = () => {
    setAmount('');
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async () => {
    const value = Number(amount);
    if (!value || value <= 0) {
      setError('Enter a valid amount.');
      return;
    }
    if (value > balance) {
      setError(`Amount exceeds your available balance of ₹${balance.toLocaleString('en-IN')}.`);
      return;
    }
    try {
      await createWithdrawal.mutateAsync(value);
      setSuccess(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not submit the request.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Withdraw Funds</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {success ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>Withdrawal request sent. The admin will review and approve it.</Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.label}>Available: ₹{balance.toLocaleString('en-IN')}</Text>
              <TextInput
                style={styles.input}
                placeholder="Amount to withdraw"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <TouchableOpacity style={styles.submitBtn} disabled={createWithdrawal.isPending} onPress={handleSubmit}>
                {createWithdrawal.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Submit Request</Text>}
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: staticTheme.bg },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 19, fontFamily: FONT.extraBold, color: '#0f172a' },
  kingIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  kingIdText: { fontSize: 11.5, fontFamily: FONT.bold, color: staticTheme.primary, letterSpacing: 0.3 },
  body: { padding: SPACING.xxl },
  balanceCard: { borderRadius: RADIUS.xl, padding: SPACING.xl },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: FONT.medium },
  balanceValue: { color: '#fff', fontSize: 34, fontFamily: FONT.extraBold, marginTop: 6, letterSpacing: -0.6 },
  pendingNote: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: FONT.semiBold, marginTop: 8 },
  withdrawButton: { backgroundColor: '#ffffff', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 20 },
  withdrawText: { color: staticTheme.primary, fontSize: 15, fontFamily: FONT.bold },
  sectionTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b', marginTop: 24, marginBottom: 10 },
  txCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  applyCouponBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: RADIUS.lg, paddingVertical: 12, marginTop: 12 },
  applyCouponBtnText: { fontSize: 13, fontFamily: FONT.bold },
  txRowWrap: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11 },
  txIconBg: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  txInfo: { flex: 1, marginLeft: 12 },
  txLabel: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  txDate: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  txAmount: { fontSize: 13.5, fontFamily: FONT.extraBold },
  txDetailBox: { backgroundColor: '#f8fafc', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', padding: 10, marginBottom: 10, gap: 6 },
  txDetailRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  txDetailLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#94a3b8' },
  txDetailValue: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8' },
  couponCode: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: 0.4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  statusBadgeText: { fontSize: 10, fontFamily: FONT.bold },
  viewUsageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  viewUsageBtnText: { fontSize: 12, fontFamily: FONT.bold, color: staticTheme.primary },
  usageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: RADIUS.sm, padding: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, gap: 8, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  label: { fontSize: 12, fontFamily: FONT.semiBold, color: '#64748b' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { backgroundColor: staticTheme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#15803d' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  chipText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#334155' },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: staticTheme.primary, borderRadius: RADIUS.md, paddingVertical: 11, marginTop: 8 },
  generateBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  costPreviewBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fffbeb', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#fde68a' },
  costPreviewText: { flex: 1, fontSize: 11.5, fontFamily: FONT.medium, color: '#92400e' },
});
