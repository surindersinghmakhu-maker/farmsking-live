import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, Modal, Platform, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import ViewShot from 'react-native-view-shot';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useMyWallet, useReferralStatement } from '@/src/hooks/useWallet';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useCreateWithdrawal, useMyWithdrawals } from '@/src/hooks/useWithdrawals';
import { useCouponRedemptions, useMyCoupons } from '@/src/hooks/useCoupons';
import { useMineFarmerPlanCoupons, useMinePartnerFarmerPlanCoupons, useFarmerPlanPricing } from '@/src/hooks/useFarmerPlan';
import { useFarmersList } from '@/src/hooks/useAdvisorAssignments';
import { useSearchBusinessPartners } from '@/src/hooks/useUsersAdmin';
import type { FarmerPlanPricing, FarmerPlanType } from '@/src/api/farmerPlans.api';
import type { RefereeStatementItem } from '@/src/api/wallet.api';
import { useAvailableBasicPlanCoupons, useMyPurchasedBasicPlanCoupons, usePurchaseBasicPlanCoupon } from '@/src/hooks/useBasicPlanCoupons';
import { Coupon, DiscountValueType, WalletTransaction } from '@/src/types/api';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';
import { CopyButton } from '@/src/components/CopyButton';
import { RedeemForFarmerModal } from '@/src/components/RedeemForFarmerModal';
import { CouponCardPreview, FarmerPlanCouponCardPreview, useShareCouponAsJpg } from '@/src/components/CouponCardPreview';

import { useExecutiveTheme } from '@/src/store/theme-context';

import { apiClient } from '@/src/api/client';
import { useQueryClient } from '@tanstack/react-query';

import { WelcomeBonusModal } from '@/src/components/WelcomeBonusModal';
import { AdminWalletManagementView } from '@/src/components/AdminWalletManagementView';

type RoleTheme = (typeof RoleThemes)[keyof typeof RoleThemes];
const staticTheme = RoleThemes.BUSINESS_PARTNER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

function formatValue(type: DiscountValueType, value: string, maxCap?: string | null) {
  const base = type === 'PERCENTAGE' ? `${value}%` : `₹${value}`;
  return type === 'PERCENTAGE' && maxCap ? `${base} (max ₹${maxCap})` : base;
}

export function maskMobileNumber(val?: string): string {
  if (!val) return 'XXX-XXX-XXXX';
  const cleaned = val.replace(/\D/g, '');
  if (cleaned.length >= 7) {
    const first3 = cleaned.slice(0, 3);
    const last4 = cleaned.slice(-4);
    return `${first3}XXX${last4}`;
  }
  return `${val}`;
}

export function downloadJpgCouponCard({
  safeKingId,
  welcomeRewardAmount,
  inviteLink,
  logoUrl,
}: {
  safeKingId: string;
  welcomeRewardAmount: number;
  inviteLink: string;
  logoUrl?: string;
}) {
  tap();
  try {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const renderAndDownload = (imgElement?: HTMLImageElement) => {
        const canvas = document.createElement('canvas');
        canvas.width = 800;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Light Fresh Mint Green Background Gradient (matching Invite Card)
        const bgGrad = ctx.createLinearGradient(0, 0, 800, 480);
        bgGrad.addColorStop(0, '#f0fdf4');
        bgGrad.addColorStop(0.5, '#dcfce7');
        bgGrad.addColorStop(1, '#bbf7d0');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 800, 480);

        // Radial Center Light Glow Effect
        const radialGlow = ctx.createRadialGradient(400, 240, 50, 400, 240, 400);
        radialGlow.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
        radialGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = radialGlow;
        ctx.fillRect(0, 0, 800, 480);

        // 2. Crisp Emerald Frame Border
        const borderGrad = ctx.createLinearGradient(0, 0, 800, 480);
        borderGrad.addColorStop(0, '#16a34a');
        borderGrad.addColorStop(0.5, '#15803d');
        borderGrad.addColorStop(1, '#047857');
        ctx.strokeStyle = borderGrad;
        ctx.lineWidth = 6;
        ctx.strokeRect(14, 14, 772, 452);

        // Inner Fine Green Line
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(20, 20, 760, 440);

        // Inner Dashed Voucher Ticket Border
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 6]);
        ctx.strokeRect(28, 28, 744, 424);
        ctx.setLineDash([]);

        // Ticket Side Semi-Circle Notch Cutouts
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(28, 240, 16, -Math.PI / 2, Math.PI / 2);
        ctx.fill();
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(772, 240, 16, Math.PI / 2, -Math.PI / 2);
        ctx.fill();
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 2;
        ctx.stroke();

        // 3. Logo Image (if available)
        if (imgElement) {
          try {
            ctx.save();
            ctx.beginPath();
            ctx.arc(68, 62, 28, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(imgElement, 40, 34, 56, 56);
            ctx.restore();
          } catch {}
        }

        // 4. Header Title & Subtitle (Dark Emerald Text)
        ctx.fillStyle = '#14532d';
        ctx.font = 'bold 26px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('👑 FARMSKING OFFICIAL WELCOME VOUCHER 🎁', 400, 60);

        ctx.fillStyle = '#15803d';
        ctx.font = '600 14px sans-serif';
        ctx.fillText('⭐ EXCLUSIVE NEW FARMER SIGNUP BENEFIT CARD ⭐', 400, 86);

        // 5. Big Royal Highlighted Cash Benefit Box (Emerald & Gold Highlight)
        const benefitBoxGrad = ctx.createLinearGradient(50, 105, 750, 165);
        benefitBoxGrad.addColorStop(0, '#15803d');
        benefitBoxGrad.addColorStop(0.5, '#16a34a');
        benefitBoxGrad.addColorStop(1, '#047857');
        ctx.fillStyle = benefitBoxGrad;
        ctx.fillRect(60, 106, 680, 62);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.strokeRect(60, 106, 680, 62);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(`🎉 YOU GET ₹${welcomeRewardAmount} INSTANT WELCOME CASH BONUS! 🎉`, 400, 145);

        // 6. White Golden Coupon Code Box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(170, 185, 460, 82);
        ctx.strokeStyle = '#16a34a';
        ctx.lineWidth = 3.5;
        ctx.strokeRect(170, 185, 460, 82);

        // Inner dashed line inside code box
        ctx.strokeStyle = '#bbf7d0';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 4]);
        ctx.strokeRect(176, 191, 448, 70);
        ctx.setLineDash([]);

        ctx.fillStyle = '#64748b';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('YOUR KING ID / INVITE CODE', 400, 212);

        ctx.fillStyle = '#14532d';
        ctx.font = 'bold 34px monospace';
        ctx.fillText(safeKingId, 400, 252);

        // 7. How to Benefit Steps (Clear messaging)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(80, 285, 640, 52);
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(80, 285, 640, 52);

        ctx.fillStyle = '#14532d';
        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`💡 HOW TO GET BENEFIT: Register on FarmsKing platform`, 400, 310);
        ctx.fillStyle = '#15803d';
        ctx.font = '600 12px sans-serif';
        ctx.fillText(`✨ Instant ₹${welcomeRewardAmount} Welcome Bonus will be credited directly to your Wallet!`, 400, 328);

        // 8. Register Link Box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(100, 350, 600, 34);
        ctx.strokeStyle = '#86efac';
        ctx.lineWidth = 1;
        ctx.strokeRect(100, 350, 600, 34);

        ctx.fillStyle = '#14532d';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`👉 Register Link: ${inviteLink}`, 400, 372);

        // 9. Royal Footer Guarantee
        ctx.fillStyle = '#166534';
        ctx.font = 'italic 12.5px sans-serif';
        ctx.fillText('👑 FarmsKing Agriculture Platform · Smart Farming, Higher Profits & Digital Tools 🌾', 400, 420);

        // Download PNG / JPG File
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
        const link = document.createElement('a');
        link.download = `farmsking-invite-card-${safeKingId}.jpg`;
        link.href = dataUrl;
        link.click();
      };

      if (logoUrl) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => renderAndDownload(img);
        img.onerror = () => renderAndDownload();
        img.src = logoUrl;
      } else {
        renderAndDownload();
      }
    } else {
      alert('Invite Code (King ID): ' + safeKingId + '\nJoin FarmsKing Platform using this ID!');
    }
  } catch {
    alert('Could not generate JPG coupon.');
  }
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
  const { colors } = useExecutiveTheme();
  const { data: appSettings } = useAppSettings();
  const queryClient = useQueryClient();
  const theme = RoleThemes[currentRole] || RoleThemes.FARM_ADVISOR || RoleThemes.FARMER;
  const { data: wallet, isLoading: isLoadingWallet } = useMyWallet();
  const { data: referralData } = useReferralStatement();
  const { data: withdrawals } = useMyWithdrawals();
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isRedeemForFarmerOpen, setIsRedeemForFarmerOpen] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const welcomeRewardAmount = Number(appSettings?.newUserSignupBonusAmount ?? 10);
  const kingId = user?.kingId || user?.mobile?.slice(-6) || 'KING';
  const inviteLink = `https://farmsking.in/register?ref=${kingId}`;

  const handleCopyLink = async () => {
    tap();
    await Clipboard.setStringAsync(inviteLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleDownloadJpgCoupon = () => {
    downloadJpgCouponCard({
      safeKingId: kingId || 'KING',
      welcomeRewardAmount,
      inviteLink,
      logoUrl: appSettings?.logoUrl,
    });
  };

  // Animated gift icon pulsing effect
  const giftScaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(giftScaleAnim, { toValue: 1.2, duration: 750, useNativeDriver: true }),
        Animated.timing(giftScaleAnim, { toValue: 1.0, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, [giftScaleAnim]);

  const pendingWithdrawals = (withdrawals ?? []).filter((w) => w.status === 'PENDING');

  const userDeactivated = user?.deactivatedRoles ?? [];
  const userRoles: string[] = (Array.isArray(user?.roles) && user.roles.length > 0 ? user.roles : [user?.role || currentRole])
    .filter((r) => r && !userDeactivated.includes(r as any)) as string[];

  const isAdminOrOperator = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN' || user?.role === 'OPERATOR';
  const [adminWalletTab, setAdminWalletTab] = useState<'MY_WALLET' | 'ALL_USERS_MANAGEMENT'>('MY_WALLET');

  const isAdvisor = userRoles.includes('ADVISOR') || userRoles.includes('FARM_ADVISOR') || userRoles.includes('GARDEN_ADVISOR') || currentRole === 'FARM_ADVISOR' || currentRole === 'GARDEN_ADVISOR';
  const isPartner = userRoles.includes('BUSINESS_PARTNER') || currentRole === 'BUSINESS_PARTNER';
  const isAdvisorOrPartner = isAdvisor || isPartner;

  const isWelcomeClaimed = (wallet?.transactions ?? []).some(
    (t) => t.type === 'CREDIT' && t.reason?.toLowerCase().includes('welcome')
  );

  const isEligibleForWelcomeBonus = Boolean(
    user?.referredById || (user as any)?.referralWelcomeCouponCode || referralData?.myReferralInfo
  );

  const showClaimBonusButton = isEligibleForWelcomeBonus && !isWelcomeClaimed;

  const handleShareWhatsApp = async () => {
    tap();
    const shareMessage = `🌾 *FarmsKing (फ़ार्मਸਕਿੰਗ) — भारत का भरोसेमंद स्मार्ट डिजिटल कृषि प्लेटफॉर्म* 🚜✨\n\nनमस्ते! 👨‍🌾\nमैं FarmsKing App का उपयोग अपनी खेती के प्रबंधन और फसल सुरक्षा के लिए कर रहा हूँ। आप भी इस फ्री ऐप को जॉइन करें और पाएँ ये बेहतरीन सुविधाएँ:\n\n📊 *1. लाइव मंडी भाव व सटीक मौसम जानकारी:*\nपंजाब व देश की सभी मंडियों के रोजाना भाव और आपके गाँव के मौसम की पल-पल अपडेट।\n\n🩺 *2. AI Crop Doctor व रोग पहचान:*\nपौधे/फसल की फोटो खींचकर 2 सेकंड में रोग की पहचान करें और एक्सपर्ट डॉक्टरों से दवा/स्प्रे सलाह पाएँ।\n\n🏪 *3. एग्रीस्टोर व डायरेक्ट फसल बिक्री:*\nअसली बीज, खाद व कीटनाशक बेस्ट रेट पर ऑर्डर करें और अपनी फसल सीधे खरीदारों को बेचें।\n\n📘 *4. डिजिटल फार्म खाता व लेबर मैनेजमेंट:*\nखेती का पूरा हिसाब-किताब, डीजल-स्प्रे का खर्चा और मजदूरों की हाजिरी आसानी से मैनेज करें।\n\n👇 *नीचे दिए गए लिंक से मुफ़्त में ऐप डाउनलोड व रजिस्टर करें:*\n👉 ${inviteLink}\n\n---\n👑 *FarmsKing Platform* · _स्मार्ट खेती, बेहतर उपज, अधिक मुनाफ़ा!_ 🌾`;
    if (Platform.OS === 'web') {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;
      window.open(whatsappUrl, '_blank');
      return;
    }
    try {
      await Share.share({ message: shareMessage });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* 👑 Clean Responsive Royal Header Row (No outer grouping card) */}
        <View style={styles.royalTitleRow}>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#064e3b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.royalTitlePill}
          >
            <Ionicons name="wallet-outline" size={15} color="#fef08a" />
            <Text style={styles.royalTitleText} numberOfLines={1} adjustsFontSizeToFit>
              FARMSKING ROYAL WALLET
            </Text>
          </LinearGradient>

          {user?.kingId ? (
            <View style={styles.royalKingIdBadge}>
              <Text style={styles.royalKingIdText} numberOfLines={1}>
                ID: {user.kingId}
              </Text>
            </View>
          ) : null}
        </View>

        {isAdminOrOperator ? (
          <AdminWalletManagementView />
        ) : (
          <>
            {/* 👑 Royal Compact Highlighted Available Balance Card */}
            <LinearGradient
              colors={['#062016', '#094e39', '#031d17']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.royalBalanceCard}
            >
              {/* Top Row: Balance & Action Buttons (Claim Bonus + Withdraw) */}
              <View style={styles.royalContentRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.royalBalanceLabel}>Available Balance</Text>
                  {isLoadingWallet ? (
                    <ActivityIndicator color="#fbbf24" style={{ alignSelf: 'flex-start', marginVertical: 6 }} />
                  ) : (
                    <View style={styles.balanceAmountRow}>
                      <Text style={styles.royalCurrencySymbol}>₹</Text>
                      <Text style={styles.royalBalanceValue} adjustsFontSizeToFit numberOfLines={1}>
                        {(wallet?.balance ?? 0).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}

                  {pendingWithdrawals.length > 0 ? (
                    <Text style={styles.royalPendingNote}>
                      ⏳ ₹{pendingWithdrawals.reduce((sum, w) => sum + Number(w.requestedAmount), 0).toLocaleString('en-IN')} pending
                    </Text>
                  ) : null}
                </View>

                {/* Right Action Column: Claim Bonus + Withdraw */}
                <View style={{ gap: 8, alignItems: 'flex-end' }}>
                  {showClaimBonusButton && (
                    <TouchableOpacity
                      style={styles.royalWithdrawBtn}
                      activeOpacity={0.85}
                      onPress={() => {
                        tap();
                        setShowWelcomeModal(true);
                      }}
                    >
                      <LinearGradient colors={['#22c55e', '#16a34a', '#15803d']} style={styles.royalWithdrawGradient}>
                        <Ionicons name="gift" size={15} color="#ffffff" />
                        <Text style={[styles.royalWithdrawBtnText, { color: '#ffffff' }]}>Claim Bonus</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.royalWithdrawBtn}
                    activeOpacity={0.85}
                    onPress={() => {
                      tap();
                      if (Platform.OS === 'web') {
                        alert('Coming Soon! 🚀 Direct Bank & UPI payouts will be available soon.');
                      } else {
                        Alert.alert(
                          'Coming Soon 🚀',
                          'Direct Bank & UPI wallet payouts will be available soon! Payout processing is being automated.'
                        );
                      }
                    }}
                  >
                    <LinearGradient colors={['#fbbf24', '#d97706', '#b45309']} style={styles.royalWithdrawGradient}>
                      <Ionicons name="cash-outline" size={15} color="#0f172a" />
                      <Text style={styles.royalWithdrawBtnText}>Withdraw</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>

            </LinearGradient>

            {/* 🎁 Light Fresh & Effective Green Banner Card */}
            <LinearGradient colors={['#f0fdf4', '#dcfce7', '#bbf7d0']} style={[styles.claimBanner, premiumShadow('#16a34a', 'sm')]}>
              {/* Top Title Row */}
              <View style={styles.claimBannerTitleRow}>
                <Animated.View style={[styles.claimBannerIcon, { transform: [{ scale: giftScaleAnim }] }]}>
                  <Ionicons name="gift-outline" size={18} color="#16a34a" />
                </Animated.View>
                <Text style={styles.claimBannerTitle}>Invite Others & Earn Cash Rewards</Text>
              </View>

              {/* Action Buttons Row */}
              <View style={styles.claimBannerActionsRow}>
                <TouchableOpacity
                  style={styles.claimBannerBtnSecondary}
                  onPress={handleCopyLink}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={copiedLink ? 'checkmark-circle' : 'link-outline'}
                    size={14}
                    color={copiedLink ? '#15803d' : '#0f172a'}
                  />
                  <Text style={[styles.claimBannerBtnSecondaryText, copiedLink ? { color: '#15803d' } : { color: '#0f172a' }]}>
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.claimBannerBtnJpg}
                  onPress={handleDownloadJpgCoupon}
                  activeOpacity={0.85}
                >
                  <Ionicons name="image-outline" size={14} color="#b45309" />
                  <Text style={styles.claimBannerBtnJpgText}>Invite Card</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.claimBannerBtn}
                  onPress={() => {
                    tap();
                    if (showClaimBonusButton) {
                      setShowWelcomeModal(true); // Opens WelcomeBonusModal popup box!
                    } else {
                      handleShareWhatsApp();
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={showClaimBonusButton ? 'sparkles' : 'logo-whatsapp'}
                    size={14}
                    color={showClaimBonusButton ? '#b45309' : '#ffffff'}
                  />
                  <Text style={[styles.claimBannerBtnText, showClaimBonusButton ? { color: '#b45309' } : { color: '#ffffff' }]}>
                    {showClaimBonusButton ? 'Claim Bonus' : 'Invite'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Dual Benefits Breakdown Cards inside Green Banner */}
              <View style={styles.bannerBenefitsContainer}>
                <View style={styles.bannerBenefitBoxYour}>
                  <View style={styles.bannerBenefitHeaderRow}>
                    <Ionicons name="trophy" size={13} color="#15803d" />
                    <Text style={styles.bannerBenefitTitleYour}>Your Earnings</Text>
                  </View>
                  <Text style={styles.bannerBenefitTextYour}>• <Text style={{ fontFamily: FONT.extraBold }}>₹{appSettings?.referralSignupBonusAmount ?? 10}</Text> Instant on Registration</Text>
                  <Text style={styles.bannerBenefitTextYour}>• <Text style={{ fontFamily: FONT.extraBold }}>₹{appSettings?.referralPaidPlanBonusAmount ?? 50}</Text> on Paid Plan Upgrade</Text>
                </View>

                <View style={styles.bannerBenefitBoxNew}>
                  <View style={styles.bannerBenefitHeaderRow}>
                    <Ionicons name="gift" size={13} color="#0369a1" />
                    <Text style={styles.bannerBenefitTitleNew}>New User Benefits</Text>
                  </View>
                  <Text style={styles.bannerBenefitTextNew}>• <Text style={{ fontFamily: FONT.extraBold }}>₹{welcomeRewardAmount}</Text> Welcome Cash Bonus</Text>
                  <Text style={styles.bannerBenefitSubNew}>(When joining with your King ID)</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Detailed Referral & Bonus Statement Table */}
            <ReferralStatementTable theme={theme} />

            {/* Unified Plan Coupons Hub for Advisors & Business Partners */}
            {isAdvisorOrPartner ? <MyUnifiedPlanCouponsSection theme={theme} /> : null}

            {/* Unified Wallet & Referral History Table */}
            <WalletHistoryTable
              transactions={wallet?.transactions ?? []}
              referees={referralData?.referees ?? []}
              theme={theme}
            />
          </>
        )}
      </ScrollView>

      {/* 🎁 Welcome Bonus Popup Box */}
      <WelcomeBonusModal
        visible={showWelcomeModal}
        onClose={() => {
          setShowWelcomeModal(false);
          queryClient.invalidateQueries({ queryKey: ['my-wallet'] });
        }}
      />

      <WithdrawModal visible={isWithdrawOpen} balance={wallet?.balance ?? 0} onClose={() => setIsWithdrawOpen(false)} />
      <RedeemForFarmerModal visible={isRedeemForFarmerOpen} onClose={() => setIsRedeemForFarmerOpen(false)} theme={theme} />
    </View>
  );
}

function ReferralInviteCard({
  theme,
  kingId,
  isWelcomeClaimed,
  isClaimingBonus,
  onClaimWelcomeBonus,
}: {
  theme: RoleTheme;
  kingId: string;
  isWelcomeClaimed?: boolean;
  isClaimingBonus?: boolean;
  onClaimWelcomeBonus?: () => void;
}) {
  const { data: appSettings } = useAppSettings();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const referralBonusAmount = appSettings?.referralSignupBonusAmount ?? 10;
  const welcomeRewardAmount = appSettings?.newUserSignupBonusAmount ?? 10;
  const referralPaidPlanBonusAmount = appSettings?.referralPaidPlanBonusAmount ?? 50;
  const safeKingId = kingId || 'KING';
  const inviteLink = `https://farmsking.in/register?ref=${safeKingId}`;

  const fullShareMessage = `*WELCOME TO FARMSKING (Smart Farming Platform)!*\n_Smart Farming · Better Yield · Higher Profits_\n\n*Special Welcome Offer*\nRegister using my referral link and claim your *₹${welcomeRewardAmount} Welcome Cash Bonus!*\n\n*Click link to register & claim bonus:*\n${inviteLink}\n\n*Referral Code / King ID:* \`${safeKingId}\`\n\n---\n*FarmsKing (Smart Farming Platform)* · _Smart Farming, Better Future!_`;

  const handleCopyCode = async () => {
    tap();
    await Clipboard.setStringAsync(safeKingId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const handleCopyLink = async () => {
    tap();
    await Clipboard.setStringAsync(fullShareMessage);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  const handleShareWhatsApp = async () => {
    tap();
    if (Platform.OS === 'web') {
      const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareMessage)}`;
      window.open(whatsappUrl, '_blank');
      return;
    }

    try {
      await Share.share({ message: fullShareMessage });
    } catch {
      // share dismissed
    }
  };

  const handleDownloadJpgCoupon = () => {
    downloadJpgCouponCard({
      safeKingId,
      welcomeRewardAmount,
      inviteLink,
      logoUrl: appSettings?.logoUrl,
    });
  };

  return (
    <View style={[styles.referralCard, premiumShadow('#16a34a', 'sm')]}>
      <LinearGradient colors={['#f0fdf4', '#dcfce7']} style={styles.referralGradient}>
        {/* Unclaimed Welcome Bonus Strip if user hasn't claimed yet */}
        {!isWelcomeClaimed && onClaimWelcomeBonus ? (
          <View style={styles.cardClaimRow}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="gift-outline" size={20} color="#d97706" />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardClaimTitle}>Welcome Bonus Ready (₹{welcomeRewardAmount})</Text>
                <Text style={styles.cardClaimSub}>Tap button to credit bonus into your wallet</Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.cardClaimBtn}
              onPress={onClaimWelcomeBonus}
              disabled={isClaimingBonus}
              activeOpacity={0.85}
            >
              {isClaimingBonus ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.cardClaimBtnText}>Claim Bonus</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Card Header — Title & Benefits */}
        <View style={styles.refHeader}>
          <View style={styles.refIconCircle}>
            <Ionicons name="gift" size={20} color="#16a34a" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.refTitle}>Invite Others & Earn Cash Rewards</Text>
            <Text style={styles.refSub}>Share your referral link & code with farmers to earn cash rewards!</Text>
          </View>
        </View>

        {/* Dual Benefits Breakdown Cards (Referrer & New User) */}
        <View style={styles.benefitsContainer}>
          <View style={styles.benefitBoxYour}>
            <View style={styles.benefitHeaderRow}>
              <Ionicons name="trophy" size={13} color="#15803d" />
              <Text style={styles.benefitBoxTitleYour}>Your Earnings</Text>
            </View>
            <Text style={styles.benefitItemText}>• <Text style={{ fontFamily: FONT.extraBold }}>₹{referralBonusAmount}</Text> Instant on Registration</Text>
            <Text style={styles.benefitItemText}>• <Text style={{ fontFamily: FONT.extraBold }}>₹{referralPaidPlanBonusAmount}</Text> on Paid Plan Upgrade</Text>
          </View>

          <View style={styles.benefitBoxNew}>
            <View style={styles.benefitHeaderRow}>
              <Ionicons name="gift" size={13} color="#0369a1" />
              <Text style={styles.benefitBoxTitleNew}>New User Benefits</Text>
            </View>
            <Text style={styles.benefitItemTextNew}>• <Text style={{ fontFamily: FONT.extraBold }}>₹{welcomeRewardAmount}</Text> Welcome Cash Bonus</Text>
            <Text style={styles.benefitItemSubNew}>(When joining with your King ID)</Text>
          </View>
        </View>

        {/* Code & Coupon Box */}
        <View style={styles.refCodeBox}>
          <View style={{ flex: 1 }}>
            <Text style={styles.refCodeLabel}>YOUR KING ID / INVITE CODE</Text>
            <Text style={styles.refCodeValue}>{safeKingId}</Text>
          </View>
          <TouchableOpacity
            style={[styles.refBtn, copiedCode ? styles.refBtnSuccess : null]}
            onPress={handleCopyCode}
            activeOpacity={0.8}
          >
            <Ionicons name={copiedCode ? 'checkmark' : 'copy-outline'} size={14} color={copiedCode ? '#15803d' : '#ffffff'} />
            <Text style={[styles.refBtnText, copiedCode ? { color: '#15803d' } : null]}>
              {copiedCode ? 'Copied!' : 'Copy Code'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Invite Link Box */}
        <View style={styles.refLinkBox}>
          <Text style={styles.refLinkLabel}>YOUR UNIQUE SHAREABLE LINK</Text>
          <Text style={styles.refLinkText} numberOfLines={1}>
            {inviteLink}
          </Text>
        </View>

        {/* Action Buttons Column (Vertical Stack: Invite -> Copy Link -> Invite Card) */}
        <View style={styles.refActionsCol}>
          {/* 1. Invite via WhatsApp Button */}
          <TouchableOpacity
            style={styles.refWaBtnStacked}
            onPress={handleShareWhatsApp}
            activeOpacity={0.85}
          >
            <Ionicons name="logo-whatsapp" size={18} color="#ffffff" />
            <Text style={styles.refWaBtnTextStacked}>Invite via WhatsApp</Text>
          </TouchableOpacity>

          {/* 2. Copy Link Button */}
          <TouchableOpacity
            style={styles.refCopyLinkBtnStacked}
            onPress={handleCopyLink}
            activeOpacity={0.8}
          >
            <Ionicons name={copiedLink ? 'checkmark-circle' : 'link-outline'} size={16} color="#0f172a" />
            <Text style={styles.refCopyLinkBtnTextStacked}>
              {copiedLink ? 'Link Copied!' : 'Copy Link'}
            </Text>
          </TouchableOpacity>

          {/* 3. Invite Card Button (JPG Coupon) */}
          <TouchableOpacity
            style={styles.refCouponBtnStacked}
            onPress={handleDownloadJpgCoupon}
            activeOpacity={0.8}
          >
            <Ionicons name="image-outline" size={16} color="#b45309" />
            <Text style={styles.refCouponBtnTextStacked}>
              Invite Card (JPG)
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

function TablePaginationControls({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'entries',
}: {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemLabel?: string;
}) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const start = totalItems > 0 ? (currentPage - 1) * pageSize + 1 : 0;
  const end = Math.min(currentPage * pageSize, totalItems);

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const startP = Math.max(2, currentPage - 1);
      const endP = Math.min(totalPages - 1, currentPage + 1);
      for (let i = startP; i <= endP; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <View style={styles.paginationContainer}>
      <View style={styles.paginationInfoRow}>
        <Text style={styles.paginationText}>
          Showing {start}-{end} of {totalItems} {itemLabel}
        </Text>
        <View style={styles.pageSizeSelectWrapper}>
          <Text style={styles.pageSizeLabel}>Per page:</Text>
          {Platform.OS === 'web' ? (
            <select
              value={pageSize}
              onChange={(e) => {
                tap();
                onPageSizeChange(Number(e.target.value));
              }}
              style={{
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '12px',
                fontFamily: 'sans-serif',
                backgroundColor: '#ffffff',
                color: '#0f172a',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          ) : (
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {[10, 20, 50, 100].map((sz) => (
                <TouchableOpacity
                  key={sz}
                  style={[styles.pageSizePill, pageSize === sz && styles.pageSizePillActive]}
                  onPress={() => {
                    tap();
                    onPageSizeChange(sz);
                  }}
                >
                  <Text style={[styles.pageSizePillText, pageSize === sz && styles.pageSizePillTextActive]}>{sz}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.pageButtonsRow}>
        <TouchableOpacity
          style={[styles.pageNavBtn, currentPage <= 1 && styles.pageNavBtnDisabled]}
          disabled={currentPage <= 1}
          onPress={() => {
            tap();
            onPageChange(currentPage - 1);
          }}
        >
          <Ionicons name="chevron-back" size={14} color={currentPage <= 1 ? '#94a3b8' : '#0f172a'} />
          <Text style={[styles.pageNavBtnText, currentPage <= 1 && styles.pageNavBtnTextDisabled]}>Prev</Text>
        </TouchableOpacity>

        {getPageNumbers().map((p, idx) => {
          if (typeof p === 'string') {
            return (
              <Text key={`ellipsis-${idx}`} style={styles.ellipsisText}>
                ...
              </Text>
            );
          }
          const isCurrent = p === currentPage;
          return (
            <TouchableOpacity
              key={`page-${p}`}
              style={[styles.pageNumberBtn, isCurrent && styles.pageNumberBtnActive]}
              onPress={() => {
                tap();
                onPageChange(p as number);
              }}
            >
              <Text style={[styles.pageNumberText, isCurrent && styles.pageNumberTextActive]}>{p}</Text>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={[styles.pageNavBtn, currentPage >= totalPages && styles.pageNavBtnDisabled]}
          disabled={currentPage >= totalPages}
          onPress={() => {
            tap();
            onPageChange(currentPage + 1);
          }}
        >
          <Text style={[styles.pageNavBtnText, currentPage >= totalPages && styles.pageNavBtnTextDisabled]}>Next</Text>
          <Ionicons name="chevron-forward" size={14} color={currentPage >= totalPages ? '#94a3b8' : '#0f172a'} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function ReferralStatementTable({ theme }: { theme: RoleTheme }) {
  const { data: referralData, isLoading } = useReferralStatement();
  const { data: appSettings } = useAppSettings();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isLedgerExpanded, setIsLedgerExpanded] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<'ALL' | 'PAID' | 'PENDING'>('ALL');

  const summary = referralData?.summary;
  const myReferralInfo = referralData?.myReferralInfo;
  const referees = useMemo(() => referralData?.referees || [], [referralData]);

  const signupBonusDefault = appSettings?.referralSignupBonusAmount ?? 10;
  const planBonusDefault = appSettings?.referralPaidPlanBonusAmount ?? 50;

  const filteredReferees = useMemo(() => {
    if (ledgerFilter === 'PAID') {
      return referees.filter((ref) => ref.status === 'SUCCESS' || ref.planBonusIssued > 0);
    }
    if (ledgerFilter === 'PENDING') {
      return referees.filter((ref) => ref.status === 'PENDING' && ref.planBonusIssued === 0);
    }
    return referees;
  }, [referees, ledgerFilter]);

  const totalItems = filteredReferees.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReferees = filteredReferees.slice(startIndex, startIndex + pageSize);

  if (isLoading) {
    return (
      <View style={{ marginTop: 16, alignItems: 'center', padding: 20 }}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (!referralData || !summary) return null;

  return (
    <View style={{ marginTop: 16, width: '100%' }}>
      {/* Referral Rewards Title outside top summary card */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Ionicons name="gift-outline" size={18} color="#15803d" />
        <Text style={styles.sectionTitle}>Referral Rewards</Text>
      </View>

      {/* Upper Header Summary Cards */}
      <View style={styles.refSummaryCard}>
        <View style={styles.refSummaryCol}>
          <Text style={styles.refSummaryLabel}>Total Referees</Text>
          <Text style={styles.refSummaryVal}>{summary.totalReferees}</Text>
        </View>
        <View style={styles.refSummaryDivider} />
        <View style={styles.refSummaryCol}>
          <Text style={styles.refSummaryLabel}>Issued Bonus</Text>
          <Text style={[styles.refSummaryVal, { color: '#16a34a' }]}>₹{summary.totalIssuedBonus}</Text>
        </View>
        <View style={styles.refSummaryDivider} />
        <View style={styles.refSummaryCol}>
          <Text style={styles.refSummaryLabel}>Pending Bonus</Text>
          <Text style={[styles.refSummaryVal, { color: '#d97706' }]}>₹{summary.totalPendingBonus}</Text>
        </View>
      </View>

      {/* My Referrer Info Card if referred by someone */}
      {myReferralInfo ? (
        <View style={styles.mySponsorCard}>
          <View style={styles.mySponsorHeader}>
            <Ionicons name="person-circle-outline" size={20} color="#0284c7" />
            <Text style={styles.mySponsorTitle}>Referred By (Sponsor / Inviter)</Text>
            <View style={[styles.statusBadge, { backgroundColor: myReferralInfo.status === 'SUCCESS' ? '#dcfce7' : '#fef3c7' }]}>
              <Text style={[styles.statusBadgeText, { color: myReferralInfo.status === 'SUCCESS' ? '#15803d' : '#b45309' }]}>
                {myReferralInfo.status === 'SUCCESS' ? 'PAID PLAN ACTIVE ✅' : 'FREE PLAN ⏳'}
              </Text>
            </View>
          </View>
          <View style={styles.mySponsorBody}>
            <Text style={styles.mySponsorName}>{myReferralInfo.referredByName} ({maskMobileNumber(myReferralInfo.referredByKingId)})</Text>
            <Text style={styles.mySponsorSub}>Reference Code Used: {myReferralInfo.referenceCode}</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              <Text style={styles.mySponsorBonusText}>Your Welcome Bonus: <Text style={{ color: '#16a34a', fontFamily: FONT.bold }}>₹{myReferralInfo.welcomeBonusIssued} ✅</Text></Text>
              <Text style={styles.mySponsorBonusText}>Sponsor's Paid Plan Referral Income: <Text style={{ color: myReferralInfo.status === 'SUCCESS' ? '#16a34a' : '#d97706', fontFamily: FONT.bold }}>₹{myReferralInfo.planBonusPending} {myReferralInfo.status === 'SUCCESS' ? '✅' : '⏳'}</Text></Text>
            </View>
          </View>
        </View>
      ) : null}

      {/* 🤝 View Ledger Collapsible Header */}
      <TouchableOpacity
        style={styles.collapseHeaderRow}
        activeOpacity={0.8}
        onPress={() => {
          tap();
          setIsLedgerExpanded(!isLedgerExpanded);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="receipt-outline" size={18} color="#d97706" />
          <Text style={styles.sectionTitle}>View Ledger</Text>
          <View style={styles.collapseBadge}>
            <Text style={styles.collapseBadgeText}>{referees.length} Referees</Text>
          </View>
        </View>
        <View style={styles.collapseTogglePill}>
          <Text style={styles.collapseTogglePillText}>{isLedgerExpanded ? '-' : '+'}</Text>
        </View>
      </TouchableOpacity>

      {/* Referees Table Card (Collapsible) */}
      {isLedgerExpanded && (
        <View style={{ marginTop: 6 }}>
          {/* Filter Chips inside View Ledger */}
          <View style={styles.filterChipGroup}>
            <TouchableOpacity
              style={[styles.filterChip, ledgerFilter === 'ALL' && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              onPress={() => {
                tap();
                setLedgerFilter('ALL');
                setCurrentPage(1);
              }}
            >
              <Text style={[styles.filterChipText, ledgerFilter === 'ALL' && { color: '#fff' }]}>All ({referees.length})</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, ledgerFilter === 'PAID' && { backgroundColor: '#16a34a', borderColor: '#16a34a' }]}
              onPress={() => {
                tap();
                setLedgerFilter('PAID');
                setCurrentPage(1);
              }}
            >
              <Text style={[styles.filterChipText, ledgerFilter === 'PAID' && { color: '#fff' }]}>Paid Bonus ✅</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterChip, ledgerFilter === 'PENDING' && { backgroundColor: '#d97706', borderColor: '#d97706' }]}
              onPress={() => {
                tap();
                setLedgerFilter('PENDING');
                setCurrentPage(1);
              }}
            >
              <Text style={[styles.filterChipText, ledgerFilter === 'PENDING' && { color: '#fff' }]}>Pending ⏳</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.txCard, premiumShadow('#0f172a', 'sm'), { marginTop: 8, padding: 0, overflow: 'hidden', borderWidth: 1.5, borderColor: '#cbd5e1' }]}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeadCell, { flex: 1.4 }]}>Name & Mobile</Text>
              <Text style={[styles.tableHeadCell, { flex: 1 }]}>Reg Date</Text>
              <Text style={[styles.tableHeadCell, { flex: 1.1, textAlign: 'center' }]}>Registration</Text>
              <Text style={[styles.tableHeadCell, { flex: 1.1, textAlign: 'center' }]}>Paid Bonus</Text>
            </View>

            {filteredReferees.length === 0 ? (
              <Text style={[styles.emptyText, { paddingVertical: 14, paddingHorizontal: 12, textAlign: 'center' }]}>
                No referees found for this filter.
              </Text>
            ) : (
              paginatedReferees.map((item, idx) => {
                const isLast = idx === paginatedReferees.length - 1;
                const regDateStr = new Date(item.registrationDate).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: '2-digit',
                });

                const signupBonusVal = item.signupBonusIssued > 0 ? item.signupBonusIssued : signupBonusDefault;
                const planBonusVal = item.planBonusIssued > 0 ? item.planBonusIssued : (item.pendingAmount > 0 ? item.pendingAmount : planBonusDefault);
                const isPlanPaid = item.status === 'SUCCESS' || item.planBonusIssued > 0;

                return (
                  <View key={item.refereeId} style={[styles.tableRow, !isLast && styles.tableRowBorder]}>
                    {/* Referee Name & Masked Mobile */}
                    <View style={{ flex: 1.4 }}>
                      <Text style={styles.tableNameText} numberOfLines={1}>{item.refereeName}</Text>
                      <Text style={styles.tableSubText}>{maskMobileNumber(item.refereeKingId)}</Text>
                    </View>

                    {/* Registration Date */}
                    <View style={{ flex: 1, justifyContent: 'center' }}>
                      <Text style={styles.tableDateText}>{regDateStr}</Text>
                    </View>

                    {/* Registration Bonus */}
                    <View style={{ flex: 1.1, justifyContent: 'center', alignItems: 'center' }}>
                      <View style={styles.bonusStatusPillSuccess}>
                        <Text style={styles.bonusStatusTextSuccess}>₹{signupBonusVal} ✅</Text>
                      </View>
                    </View>

                    {/* Paid Plan Bonus */}
                    <View style={{ flex: 1.1, justifyContent: 'center', alignItems: 'center' }}>
                      <View style={isPlanPaid ? styles.bonusStatusPillSuccess : styles.bonusStatusPillWaiting}>
                        <Text style={isPlanPaid ? styles.bonusStatusTextSuccess : styles.bonusStatusTextWaiting}>
                          ₹{planBonusVal} {isPlanPaid ? '✅' : '⏳'}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            )}

            {/* Pagination Controls */}
            <TablePaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              itemLabel="referees"
            />
          </View>
        </View>
      )}
    </View>
  );
}

function WalletHistoryTable({
  transactions,
  referees,
  theme,
}: {
  transactions: WalletTransaction[];
  referees: RefereeStatementItem[];
  theme: RoleTheme;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [isTxHistoryExpanded, setIsTxHistoryExpanded] = useState(false);

  const unifiedLedger = useMemo(() => {
    const items: Array<{
      id: string;
      date: Date;
      type: string;
      referenceName: string;
      referenceKingId: string;
      amount: number;
      pendingAmount: number;
      status: 'SUCCESS' | 'PENDING';
      isCredit: boolean;
      rawReason: string;
      relatedUserMobile?: string;
    }> = [];

    // Processed successful transactions
    for (const tx of transactions) {
      if (tx.status && tx.status !== 'SUCCESS') continue;
      const isCredit = tx.type === 'CREDIT';
      let displayType = isCredit ? 'Credit' : 'Debit';
      if (tx.reason.includes('Welcome')) displayType = 'Welcome Bonus';
      else if (tx.reason.includes('Plan Bonus') || tx.reason.includes('Plan')) displayType = 'Referral Plan Bonus';
      else if (tx.reason.includes('Referral')) displayType = 'Referral Bonus';
      else if (tx.reason.includes('Withdrawal')) displayType = 'Withdrawal';
      else if (tx.reason.includes('Manual')) displayType = 'Admin Credit';

      items.push({
        id: tx.id,
        date: new Date(tx.createdAt),
        type: displayType,
        referenceName: tx.relatedUser?.name || 'FarmsKing System',
        referenceKingId: tx.relatedUser?.kingId || 'N/A',
        amount: Number(tx.amount),
        pendingAmount: 0,
        status: 'SUCCESS',
        isCredit,
        rawReason: tx.reason,
        relatedUserMobile: tx.relatedUser?.mobile,
      });
    }

    return items.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [transactions]);

  const totalItems = unifiedLedger.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedItems = unifiedLedger.slice(startIndex, startIndex + pageSize);

  return (
    <View style={{ width: '100%', marginTop: 16 }}>
      {/* Collapsible Header for Transaction History */}
      <TouchableOpacity
        style={styles.collapseHeaderRow}
        activeOpacity={0.8}
        onPress={() => {
          tap();
          setIsTxHistoryExpanded(!isTxHistoryExpanded);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
          <Ionicons name="journal-outline" size={18} color="#0284c7" />
          <Text style={styles.sectionTitle}>Transaction History</Text>
          <View style={styles.collapseBadge}>
            <Text style={styles.collapseBadgeText}>{unifiedLedger.length} Records</Text>
          </View>
        </View>
        <View style={styles.collapseTogglePill}>
          <Text style={styles.collapseTogglePillText}>{isTxHistoryExpanded ? '-' : '+'}</Text>
        </View>
      </TouchableOpacity>

      {/* History Table (Collapsible) */}
      {isTxHistoryExpanded && (
        <View style={{ marginTop: 6 }}>
          <View style={[styles.txCard, premiumShadow('#0f172a', 'sm'), { padding: 0, overflow: 'hidden', borderWidth: 1.5, borderColor: '#cbd5e1' }]}>
            <View style={styles.historyTableHeader}>
              <Text style={[styles.historyHeadCell, { flex: 1.4 }]}>Name & Mobile</Text>
              <Text style={[styles.tableHeadCell, { flex: 1 }]}>Reg Date</Text>
              <Text style={[styles.tableHeadCell, { flex: 1.2 }]}>Type</Text>
              <Text style={[styles.tableHeadCell, { flex: 1.1, textAlign: 'center' }]}>Credit Amount</Text>
            </View>

            {unifiedLedger.length === 0 ? (
              <Text style={[styles.emptyText, { padding: 20, textAlign: 'center' }]}>
                No history records found.
              </Text>
            ) : (
              paginatedItems.map((item, idx) => {
                const isLast = idx === paginatedItems.length - 1;
                const isExpanded = expandedId === item.id;
                const dateStr = item.date.toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: '2-digit',
                });

                return (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      style={[styles.historyTableRow, !isLast && styles.tableRowBorder, isExpanded && { backgroundColor: '#f8fafc' }]}
                      activeOpacity={0.7}
                      onPress={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      {/* Referee & Mobile */}
                      <View style={{ flex: 1.4 }}>
                        <Text style={styles.tableNameText} numberOfLines={1}>{item.referenceName}</Text>
                        <Text style={styles.tableSubText}>{maskMobileNumber(item.referenceKingId !== 'N/A' ? item.referenceKingId : item.relatedUserMobile)}</Text>
                      </View>

                      {/* Reg Date */}
                      <View style={{ flex: 1, justifyContent: 'center' }}>
                        <Text style={styles.tableDateText}>{dateStr}</Text>
                      </View>

                      {/* Type */}
                      <View style={{ flex: 1.2, justifyContent: 'center' }}>
                        <Text style={styles.tableNameText} numberOfLines={1}>{item.type}</Text>
                      </View>

                      {/* Credit Amount */}
                      <View style={{ flex: 1.1, justifyContent: 'center', alignItems: 'center' }}>
                        <View style={item.status === 'SUCCESS' ? styles.bonusStatusPillSuccess : styles.bonusStatusTextWaiting}>
                          <Text style={item.status === 'SUCCESS' ? styles.bonusStatusTextSuccess : styles.bonusStatusTextWaiting}>
                            {item.status === 'PENDING' ? `₹${item.pendingAmount} ⏳` : `${item.isCredit ? '+' : '-'}₹${item.amount} ${item.isCredit ? '✅' : ''}`}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>

                    {isExpanded ? (
                      <View style={styles.historyDetailBox}>
                        <Text style={styles.historyDetailReason}>{item.rawReason}</Text>
                        {item.relatedUserMobile ? (
                          <Text style={styles.historyDetailSub}>Contact: {item.relatedUserMobile}</Text>
                        ) : null}
                        <Text style={styles.historyDetailSub}>
                          Timestamp: {item.date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {item.date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </View>
                    ) : null}
                  </React.Fragment>
                );
              })
            )}

            {/* Pagination Controls */}
            <TablePaginationControls
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setCurrentPage}
              onPageSizeChange={(sz) => {
                setPageSize(sz);
                setCurrentPage(1);
              }}
              itemLabel="transactions"
            />
          </View>
        </View>
      )}
    </View>
  );
}
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
            <Text style={[styles.txDetailValue, { flex: 1, textAlign: 'right' }]}>{positive ? 'Credit (Money In)' : 'Debit (Money Out)'}</Text>
          </View>
          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Date & Time</Text>
            <Text style={[styles.txDetailValue, { flex: 1, textAlign: 'right' }]}>
              {created.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} · {created.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
          <View style={styles.txDetailRow}>
            <Text style={styles.txDetailLabel}>Amount</Text>
            <Text style={[styles.txDetailValue, { flex: 1, textAlign: 'right' }]}>₹{Number(tx.amount).toLocaleString('en-IN')}</Text>
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
            <Text style={[styles.txDetailValue, { flex: 1, textAlign: 'right', fontSize: 9.5 }]} numberOfLines={1} ellipsizeMode="middle">{tx.id}</Text>
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

      <RedeemForFarmerModal visible={isRedeemForFarmerOpen} onClose={() => setIsRedeemForFarmerOpen(false)} theme={theme} />
      <ShareFarmerPlanCouponModal coupon={shareCoupon} visible={!!shareCoupon} onClose={() => setShareCoupon(null)} theme={theme} />
    </>
  );
}

/** Plan coupons (issued by admin) sitting in this advisor's own account — they apply these to any of their assigned farmers. */
function MyRenewalCouponsSection() {
  return null;
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
  hero: { paddingTop: 10, paddingBottom: 8, paddingHorizontal: 16, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  heroTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a' },
  kingIdBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6, flexWrap: 'wrap' },
  kingIdText: { fontSize: 11.5, fontFamily: FONT.bold, color: staticTheme.primary, letterSpacing: 0.3, flexShrink: 1 },
  body: { paddingHorizontal: 16, paddingVertical: 10, maxWidth: 1200, alignSelf: 'center', width: '100%' },
  balanceCard: { borderRadius: RADIUS.xl, padding: 16, width: '100%' },
  balanceLabel: { color: 'rgba(255,255,255,0.75)', fontSize: 13, fontFamily: FONT.medium },
  balanceValue: { color: '#fff', fontSize: 32, fontFamily: FONT.extraBold, marginTop: 6, letterSpacing: -0.6, flexShrink: 1 },
  pendingNote: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: FONT.semiBold, marginTop: 8, flexShrink: 1 },
  withdrawButton: { backgroundColor: '#ffffff', borderRadius: RADIUS.md, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', marginTop: 16 },
  withdrawText: { color: staticTheme.primary, fontSize: 14, fontFamily: FONT.bold },
  sectionTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#64748b' },
  txCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, width: '100%' },
  applyCouponBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderRadius: RADIUS.lg, paddingVertical: 12, marginTop: 12 },
  applyCouponBtnText: { fontSize: 13, fontFamily: FONT.bold },
  txRowWrap: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  txRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, width: '100%' },
  txIconBg: { width: 34, height: 34, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  txInfo: { flex: 1, marginLeft: 10, flexShrink: 1 },
  txLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a', flexShrink: 1 },
  txDate: { fontSize: 11, color: '#64748b', fontFamily: FONT.medium, marginTop: 2, flexShrink: 1 },
  txAmount: { fontSize: 13.5, fontFamily: FONT.extraBold, flexShrink: 0 },
  txDetailBox: { backgroundColor: '#f8fafc', borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', padding: 10, marginBottom: 10, gap: 6, width: '100%' },
  txDetailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, width: '100%' },
  txDetailLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#94a3b8', flexShrink: 0 },
  txDetailValue: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#0f172a', flex: 1, textAlign: 'right', flexWrap: 'wrap' },
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#94a3b8', flexShrink: 1 },
  couponCode: { fontSize: 14, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: 0.4, flexShrink: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, flexShrink: 0 },
  statusBadgeText: { fontSize: 10, fontFamily: FONT.bold },
  viewUsageBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  viewUsageBtnText: { fontSize: 12, fontFamily: FONT.bold, color: staticTheme.primary },
  usageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: RADIUS.sm, padding: 8, width: '100%' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 420, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: 16, gap: 8, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a', flexShrink: 1 },
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
  claimBanner: {
    padding: 14,
    borderRadius: RADIUS.xl,
    marginTop: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#86efac',
  },
  claimBannerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  claimBannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#86efac',
    alignItems: 'center',
    justifyContent: 'center',
  },
  claimBannerTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#14532d', letterSpacing: 0.2 },
  claimBannerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
  },
  bannerBenefitsContainer: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  bannerBenefitBoxYour: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 2,
  },
  bannerBenefitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  bannerBenefitTitleYour: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  bannerBenefitTextYour: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#166534',
    lineHeight: 13,
  },
  bannerBenefitBoxNew: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 2,
  },
  bannerBenefitTitleNew: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#0369a1',
  },
  bannerBenefitTextNew: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#0369a1',
    lineHeight: 13,
  },
  bannerBenefitSubNew: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
    marginTop: 1,
  },
  claimBannerBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  claimBannerBtnText: { fontSize: 11.5, fontFamily: FONT.extraBold, color: '#15803d' },
  cardClaimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#86efac',
    marginBottom: 4,
  },
  cardClaimTitle: { fontSize: 12, fontFamily: FONT.extraBold, color: '#15803d' },
  cardClaimSub: { fontSize: 10, fontFamily: FONT.medium, color: '#64748b' },
  cardClaimBtn: {
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  cardClaimBtnText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.extraBold },
  referralCard: { borderRadius: RADIUS.xl, marginTop: 14, overflow: 'hidden' },
  referralGradient: { padding: 14, borderRadius: RADIUS.xl, borderWidth: 1.5, borderColor: '#bbf7d0', gap: 10 },
  refHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  refIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  refTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#14532d' },
  refSub: { fontSize: 10.5, fontFamily: FONT.medium, color: '#166534', marginTop: 1 },
  rewardBadge: { backgroundColor: '#16a34a', paddingHorizontal: 8, paddingVertical: 4, borderRadius: RADIUS.pill },
  rewardBadgeText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#ffffff' },
  refCodeBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff', padding: 10, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#86efac' },
  refCodeLabel: { fontSize: 9.5, fontFamily: FONT.bold, color: '#64748b', letterSpacing: 0.3 },
  refCodeValue: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: 1, marginTop: 2 },
  refBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 8, borderRadius: RADIUS.md },
  refBtnSuccess: { backgroundColor: '#dcfce7', borderWidth: 1, borderColor: '#86efac' },
  refBtnText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' },
  refLinkBox: { backgroundColor: '#ffffff', padding: 8, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#e2e8f0', gap: 2 },
  refLinkLabel: { fontSize: 9, fontFamily: FONT.bold, color: '#94a3b8', letterSpacing: 0.3 },
  refLinkText: { fontSize: 11, fontFamily: FONT.semiBold, color: '#0f172a' },
  refActionsRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  refShareLinkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#cbd5e1', paddingVertical: 10, borderRadius: RADIUS.md },
  refShareLinkBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  refWaBtn: { flex: 1.2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#25d366', paddingVertical: 10, borderRadius: RADIUS.md },
  refWaBtnText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },
  refSummaryCard: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 14, alignItems: 'center', justifyContent: 'space-around', borderWidth: 1, borderColor: '#e2e8f0', marginTop: 4 },
  refSummaryCol: { flex: 1, alignItems: 'center' },
  refSummaryLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#64748b' },
  refSummaryVal: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 2 },
  refSummaryDivider: { width: 1, height: 24, backgroundColor: '#cbd5e1' },
  mySponsorCard: { backgroundColor: '#f0f9ff', borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: '#bae6fd', marginTop: 10 },
  mySponsorHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  mySponsorTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0369a1', flex: 1 },
  mySponsorBody: { marginTop: 2 },
  mySponsorName: { fontSize: 13, fontFamily: FONT.extraBold, color: '#0f172a' },
  mySponsorSub: { fontSize: 11, fontFamily: FONT.medium, color: '#475569', marginTop: 1 },
  mySponsorBonusText: { fontSize: 11, fontFamily: FONT.medium, color: '#334155' },
  tableHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1.5, borderBottomColor: '#e2e8f0' },
  tableHeadCell: { fontSize: 10.5, fontFamily: FONT.bold, color: '#475569', textTransform: 'uppercase' },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  tableRowBorder: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  tableNameText: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a' },
  tableSubText: { fontSize: 10, fontFamily: FONT.medium, color: '#64748b' },
  tableCodeText: { fontSize: 9.5, fontFamily: FONT.bold, color: staticTheme.primary },
  tableDateText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#475569' },
  tableAmountText: { fontSize: 12, fontFamily: FONT.extraBold },
  tableControlRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, marginBottom: 8, flexWrap: 'wrap', gap: 8 },
  filterChipGroup: { flexDirection: 'row', gap: 6 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff' },
  filterChipText: { fontSize: 11, fontFamily: FONT.bold, color: '#64748b' },
  historyTableHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f8fafc', borderBottomWidth: 1.5, borderBottomColor: '#e2e8f0' },
  historyHeadCell: { fontSize: 10.5, fontFamily: FONT.bold, color: '#475569', textTransform: 'uppercase' },
  historyTableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12 },
  historyCellText: { fontSize: 11, fontFamily: FONT.medium, color: '#475569' },
  historyDetailBox: { backgroundColor: '#f1f5f9', padding: 10, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 4 },
  historyDetailSub: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b' },
  benefitsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  benefitBoxYour: {
    flex: 1,
    backgroundColor: '#f0fdf4',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 2,
  },
  benefitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  benefitBoxTitleYour: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  benefitItemText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#166534',
    lineHeight: 13,
  },
  benefitBoxNew: {
    flex: 1,
    backgroundColor: '#f0f9ff',
    borderRadius: RADIUS.md,
    padding: 8,
    borderWidth: 1,
    borderColor: '#bae6fd',
    gap: 2,
  },
  benefitBoxTitleNew: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    color: '#0369a1',
  },
  benefitItemTextNew: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#0369a1',
    lineHeight: 13,
  },
  benefitItemSubNew: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#0284c7',
    marginTop: 1,
  },
  royalBalanceCard: {
    borderRadius: RADIUS.xl,
    padding: 16,
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    gap: 12,
    ...premiumShadow('#f59e0b', 'sm'),
  },
  cardInviteSection: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(245, 158, 11, 0.25)',
    gap: 8,
    width: '100%',
  },
  royalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 8,
    gap: 6,
  },
  royalTitlePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
    flexShrink: 1,
    maxWidth: '74%',
    ...premiumShadow('#f59e0b', 'xs'),
  },
  royalTitleText: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#fef08a',
    letterSpacing: 0.4,
    flexShrink: 1,
  },
  royalKingIdBadge: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#f59e0b',
    flexShrink: 0,
    ...premiumShadow('#f59e0b', 'xs'),
  },
  royalKingIdText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  royalCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  royalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  royalPillText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#fef08a',
    letterSpacing: 0.5,
  },
  royalKingId: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  royalContentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  royalBalanceLabel: {
    color: '#cbd5e1',
    fontSize: 12,
    fontFamily: FONT.medium,
    letterSpacing: 0.3,
  },
  balanceAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
    marginTop: 4,
  },
  royalCurrencySymbol: {
    color: '#f59e0b',
    fontSize: 24,
    fontFamily: FONT.extraBold,
  },
  royalBalanceValue: {
    color: '#ffffff',
    fontSize: 34,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.5,
  },
  royalPendingNote: {
    color: '#fef08a',
    fontSize: 11,
    fontFamily: FONT.semiBold,
    marginTop: 4,
  },
  royalWithdrawBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
    ...premiumShadow('#eab308', 'xs'),
  },
  royalWithdrawGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
  },
  royalWithdrawBtnText: {
    color: '#0f172a',
    fontSize: 13,
    fontFamily: FONT.extraBold,
  },
  claimBannerBtnSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
  },
  claimBannerBtnSecondaryText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  claimBannerBtnJpg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#fffbe6',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#f59e0b',
  },
  claimBannerBtnJpgText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#b45309',
  },
  claimBannerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    borderColor: '#15803d',
  },
  claimBannerBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  bonusStatusPillSuccess: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  bonusStatusTextSuccess: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  bonusStatusPillWaiting: {
    backgroundColor: '#fffbeb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  bonusStatusTextWaiting: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#b45309',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#f8fafc',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    flexWrap: 'wrap',
    gap: 8,
  },
  paginationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  paginationText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  pageSizeSelectWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageSizeLabel: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  pageSizePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pageSizePillActive: {
    backgroundColor: '#15803d',
    borderColor: '#15803d',
  },
  pageSizePillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  pageSizePillTextActive: {
    color: '#ffffff',
  },
  pageButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 2,
  },
  pageNavBtnDisabled: {
    backgroundColor: '#f1f5f9',
    borderColor: '#e2e8f0',
  },
  pageNavBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  pageNavBtnTextDisabled: {
    color: '#cbd5e1',
  },
  pageNumberBtn: {
    minWidth: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  pageNumberBtnActive: {
    backgroundColor: '#0f172a',
    borderColor: '#0f172a',
  },
  pageNumberText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  pageNumberTextActive: {
    color: '#ffffff',
  },
  ellipsisText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    paddingHorizontal: 2,
  },
  collapseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  collapseBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  collapseBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  collapseTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  collapseTogglePillText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  adminTabModeRow: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: RADIUS.pill,
    padding: 4,
    gap: 4,
    marginBottom: 8,
  },
  adminTabModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
  },
  adminTabModeBtnActive: {
    backgroundColor: '#ffffff',
  },
  adminTabModeText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  adminTabModeTextActive: {
    color: '#15803d',
  },
});
