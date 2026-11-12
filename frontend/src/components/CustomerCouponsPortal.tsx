import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { CopyButton } from '@/src/components/CopyButton';
import { useAvailablePromotions, useCouponPreview } from '@/src/hooks/useCoupons';
import { useMyReferralNetwork } from '@/src/hooks/useReferralNetwork';
import { useRedeemBasicPlanCoupon } from '@/src/hooks/useBasicPlanCoupons';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

interface CustomerCouponsPortalProps {
  roleLabel?: string;
}

/**
 * Real-data Offers, Promo Verification & Customer Referral Rewards view.
 * Verifies store coupon codes and plan gift keys directly against live backend APIs.
 */
export const CustomerCouponsPortal: React.FC<CustomerCouponsPortalProps> = ({
  roleLabel = 'Customer',
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const [inputCode, setInputCode] = useState('');
  const [status, setStatus] = useState<{ type: 'SUCCESS' | 'ERROR' | null; message: string }>({
    type: null,
    message: '',
  });
  const [copiedLink, setCopiedLink] = useState(false);

  const { data: availablePromos, isLoading: promosLoading } = useAvailablePromotions(Boolean(user));
  const { data: referralNet } = useMyReferralNetwork();
  const previewMutation = useCouponPreview();
  const redeemPlanMutation = useRedeemBasicPlanCoupon();

  const kingId = referralNet?.kingId || user?.kingId || '';
  const inviteUrl = referralNet?.inviteUrl || (kingId ? `https://farmsking.in/register?ref=${kingId}` : '');

  const handleVerifyOrRedeem = async () => {
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) {
      setStatus({ type: 'ERROR', message: 'Please enter a valid promo code or plan activation key.' });
      return;
    }
    tap();
    setStatus({ type: null, message: '' });

    // 1. Check live store discount/partner coupon first
    try {
      const res = await previewMutation.mutateAsync({ code: cleanCode, amount: 1000 });
      setStatus({
        type: 'SUCCESS',
        message: `Verified! Code "${cleanCode}" is active and saves ₹${res.discountAmount} on a ₹1,000 Agri Store order. Copy and apply it at checkout.`,
      });
      return;
    } catch {
      // Not a store checkout coupon — check if it is a Plan Activation Key
    }

    try {
      const planRes = await redeemPlanMutation.mutateAsync(cleanCode);
      setStatus({
        type: 'SUCCESS',
        message: `Activated! Plan key "${cleanCode}" added ${planRes.daysAdded} day(s) to your FarmsKing membership.`,
      });
    } catch (err: any) {
      setStatus({
        type: 'ERROR',
        message:
          err?.response?.data?.message ||
          `Code "${cleanCode}" is not active, expired, or does not meet minimum eligibility.`,
      });
    }
  };

  const handleCopyInviteLink = async () => {
    if (!inviteUrl) return;
    tap();
    await Clipboard.setStringAsync(inviteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const isChecking = previewMutation.isPending || redeemPlanMutation.isPending;
  const promos = availablePromos || [];

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.hero}>
        <View style={styles.heroHeaderRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={20} color="#ffffff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Verified Offers & Referral Rewards</Text>
            <Text style={styles.heroSubtitle}>
              {roleLabel} Savings Hub · Live Coupon Check & King ID Sharing
            </Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{promos.length} Live</Text>
            <Text style={styles.statLbl}>Public Offers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statVal}>{referralNet?.totalNetworkCount ?? 0}</Text>
            <Text style={styles.statLbl}>Friends Invited</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={[styles.statVal, { color: '#34d399' }]}>
              ₹{(referralNet?.totalRoyaltiesEarned ?? 0).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.statLbl}>Rewards Earned</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Section 1: Real Backend Coupon & Plan Key Verifier */}
        <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
          <Text style={styles.cardTitle}>Verify Promo Code or Redeem Plan Key</Text>
          <Text style={styles.cardSub}>
            Enter a FarmsKing store promo code, partner invite code, or pre-paid plan pass key:
          </Text>

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="ENTER CODE"
              placeholderTextColor="#94a3b8"
              value={inputCode}
              onChangeText={setInputCode}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.submitBtn, isChecking && { opacity: 0.7 }]}
              disabled={isChecking}
              onPress={handleVerifyOrRedeem}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                  <Text style={styles.submitBtnText}>Verify</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {status.type ? (
            <View
              style={[
                styles.statusBox,
                { backgroundColor: status.type === 'SUCCESS' ? '#ecfdf5' : '#fef2f2' },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  { color: status.type === 'SUCCESS' ? '#047857' : '#dc2626' },
                ]}
              >
                {status.message}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Section 2: Share King ID Referral Rewards */}
        {kingId ? (
          <View style={[styles.referralCard, premiumShadow('#0f172a', 'sm')]}>
            <View style={styles.referralHeader}>
              <Ionicons name="gift-outline" size={20} color="#047857" />
              <Text style={styles.referralTitle}>Invite Farmers & Customers · Earn Real Royalties</Text>
            </View>
            <Text style={styles.referralDesc}>
              Share your verified King ID ({kingId}). Friends receive trusted agronomy & Agri Store access, and your connected farm network earns genuine platform rewards.
            </Text>
            <View style={styles.referralActions}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeBadgeText}>King ID: {kingId}</Text>
                <CopyButton value={kingId} />
              </View>
              <TouchableOpacity style={styles.inviteLinkBtn} onPress={handleCopyInviteLink} activeOpacity={0.85}>
                <Ionicons name={copiedLink ? 'checkmark-circle' : 'link-outline'} size={15} color="#ffffff" />
                <Text style={styles.inviteLinkBtnText}>
                  {copiedLink ? 'Invite Link Copied' : 'Copy Invite Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* Section 3: Live Database Active Offers */}
        <Text style={styles.sectionHeaderTitle}>ACTIVE STORE PROMOTIONS (LIVE)</Text>

        {promosLoading ? (
          <ActivityIndicator color="#059669" style={{ marginVertical: 16 }} />
        ) : promos.length === 0 ? (
          <View style={[styles.emptyOfferCard, premiumShadow('#0f172a', 'sm')]}>
            <Ionicons name="pricetags-outline" size={26} color="#64748b" />
            <Text style={styles.emptyOfferTitle}>No Public Store Campaigns Active Right Now</Text>
            <Text style={styles.emptyOfferSub}>
              If your advisor or FarmsKing sales partner gave you an invite code, enter it above to check your discount and apply it during Agri Store checkout.
            </Text>
          </View>
        ) : (
          promos.map((promo) => {
            const badgeText =
              promo.discountType === 'PERCENTAGE'
                ? `${Number(promo.discountValue)}% OFF`
                : `₹${Number(promo.discountValue)} OFF`;
            const minOrder = promo.minOrderAmount ? `Min. Order ₹${Number(promo.minOrderAmount)}` : 'No minimum order';
            const maxCap = promo.discountMaxCap ? ` · Up to ₹${Number(promo.discountMaxCap)} off` : '';
            const expiryStr = new Date(promo.expiresAt).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            });

            return (
              <View key={promo.id} style={[styles.offerCard, premiumShadow('#000000', 'sm')]}>
                <View style={styles.offerCardHeader}>
                  <View style={styles.codeBadge}>
                    <Ionicons name="pricetag" size={14} color="#0f172a" />
                    <Text style={styles.codeBadgeText}>{promo.code}</Text>
                  </View>
                  <View style={styles.discountPill}>
                    <Text style={styles.discountPillText}>{badgeText}</Text>
                  </View>
                </View>

                <Text style={styles.offerTitle}>Save {badgeText} at Agri Store</Text>
                <Text style={styles.offerDesc}>
                  {minOrder}
                  {maxCap} · {promo.remainingUses} redemptions remaining
                </Text>

                <View style={styles.offerFooter}>
                  <Text style={styles.validText}>Valid until: {expiryStr}</Text>
                  <CopyButton value={promo.code} />
                </View>
              </View>
            );
          })
        )}

        <TouchableOpacity
          style={styles.shopBanner}
          activeOpacity={0.88}
          onPress={() => router.push('/shop' as any)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Browse KYC-Verified Agri Store</Text>
            <Text style={styles.bannerSub}>
              Apply verified promo codes at checkout with instant GST invoice & order tracking.
            </Text>
          </View>
          <View style={styles.bannerArrow}>
            <Ionicons name="arrow-forward" size={18} color="#ffffff" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 28, paddingBottom: 16, paddingHorizontal: 16 },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#ffffff' },
  heroSubtitle: { fontSize: 11.5, fontFamily: FONT.medium, color: '#cbd5e1', marginTop: 1 },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    marginTop: 4,
  },
  statItem: { flex: 1, alignItems: 'center' },
  statVal: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  statLbl: { fontSize: 10, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  statDivider: { width: 1, height: 22, backgroundColor: 'rgba(255,255,255,0.2)' },
  scrollContent: { padding: 14, paddingBottom: 32, gap: 14, maxWidth: 960, width: '100%', alignSelf: 'center' },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a' },
  cardSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  input: {
    flex: 1,
    height: 44,
    backgroundColor: '#f1f5f9',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    height: 44,
    borderRadius: RADIUS.md,
  },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  statusBox: { marginTop: 10, padding: 10, borderRadius: RADIUS.md },
  statusText: { fontSize: 12, fontFamily: FONT.bold },
  referralCard: {
    backgroundColor: '#ecfdf5',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    gap: 8,
  },
  referralHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  referralTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#065f46', flex: 1 },
  referralDesc: { fontSize: 12, fontFamily: FONT.medium, color: '#047857', lineHeight: 17 },
  referralActions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 4 },
  inviteLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#047857',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
  },
  inviteLinkBtnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
  sectionHeaderTitle: { fontSize: 11.5, fontFamily: FONT.bold, color: '#64748b', letterSpacing: 0.5, marginTop: 4 },
  emptyOfferCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: 6,
  },
  emptyOfferTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a', textAlign: 'center' },
  emptyOfferSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', lineHeight: 17 },
  offerCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  offerCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  codeBadgeText: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  discountPill: { backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  discountPillText: { fontSize: 10.5, fontFamily: FONT.extraBold, color: '#ffffff' },
  offerTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  offerDesc: { fontSize: 12, fontFamily: FONT.medium, color: '#475569', marginTop: 2 },
  offerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  validText: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: RADIUS.lg,
    padding: 14,
    marginTop: 6,
  },
  bannerTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#ffffff' },
  bannerSub: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  bannerArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

