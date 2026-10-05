import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useAuth } from '@/src/store/auth-context';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useBuyGardenerPlan, useMyGardenerPlan, useActivateVipTrial } from '@/src/hooks/useGardenerPlan';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import * as Linking from 'expo-linking';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function GardenVipCardsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useExecutiveTheme();
  const { data: settings } = useAppSettings();
  const { data: planData, refetch: refetchPlan } = useMyGardenerPlan();
  const buyPlanMutation = useBuyGardenerPlan();
  const activateTrialMutation = useActivateVipTrial();

  const [selectedPlan, setSelectedPlan] = useState<'FREE' | 'PRO' | 'VIP'>('VIP');
  const [loading, setLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);

  const hasUsedTrial = planData?.hasUsedVipTrial ?? false;
  const currentPlan = planData?.plan ?? 'FREE';
  const trialEndDate = planData?.trialStartedAt
    ? new Date(new Date(planData.trialStartedAt).getTime() + 30 * 24 * 60 * 60 * 1000)
    : null;
  const isTrialActive = currentPlan === 'VIP' && trialEndDate && trialEndDate > new Date() && hasUsedTrial;
  const trialDaysLeft = trialEndDate
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  const handleBuyPlan = async () => {
    if (selectedPlan === 'FREE') return;
    setLoading(true);
    try {
      const res = await buyPlanMutation.mutateAsync(selectedPlan);
      if (res.paymentSessionId) {
        if (Platform.OS === 'web') {
          window.location.href = `https://payments.cashfree.com/order/#${res.paymentSessionId}`;
        } else {
          await Linking.openURL(`https://payments.cashfree.com/order/#${res.paymentSessionId}`);
        }
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Payment initiation failed.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateTrial = async () => {
    tap();
    setTrialLoading(true);
    try {
      const res = await activateTrialMutation.mutateAsync();
      refetchPlan();
      if (Platform.OS === 'web') {
        alert(res.message || '🎉 VIP Trial Activated!');
      } else {
        Alert.alert('🎉 Welcome to VIP!', res.message || 'Your 30-day VIP trial is now active!');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Could not activate trial.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Trial Error', msg);
    } finally {
      setTrialLoading(false);
    }
  };

  // 3D Tilt animation
  const tiltX = useSharedValue(0);
  const tiltY = useSharedValue(0);
  const vipAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${tiltX.value}deg` },
      { rotateY: `${tiltY.value}deg` },
    ],
  }));
  const handlePointerMove = (e: any) => {
    if (Platform.OS === 'web' && selectedPlan === 'VIP') {
      const { offsetX, offsetY, target } = e.nativeEvent;
      const { clientWidth, clientHeight } = target as any;
      if (clientWidth && clientHeight) {
        tiltY.value = withSpring((offsetX / clientWidth - 0.5) * 20);
        tiltX.value = withSpring((offsetY / clientHeight - 0.5) * -20);
      }
    }
  };
  const handlePointerLeave = () => {
    tiltX.value = withSpring(0);
    tiltY.value = withSpring(0);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* HEADER */}
      <LinearGradient colors={['#14532d', '#166534', '#15803d']} style={styles.headerArea}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Garden VIP Cards</Text>
          <Text style={styles.headerSub}>ਬਾਗਬਾਨੀ ਦੀ ਅਸਲੀ ਪਛਾਣ</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ===== WELCOME OFFER BANNER (only if trial not used) ===== */}
        {!hasUsedTrial && (
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={handleActivateTrial}
            disabled={trialLoading}
          >
            <LinearGradient
              colors={['#7c3aed', '#6d28d9', '#4c1d95']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.welcomeBanner, premiumShadow('#7c3aed', 'lg')]}
            >
              {/* Shimmer overlay */}
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0)', 'rgba(255,255,255,0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />

              <View style={styles.welcomeLeft}>
                <View style={styles.welcomeTag}>
                  <Ionicons name="gift" size={12} color="#7c3aed" />
                  <Text style={styles.welcomeTagText}>WELCOME OFFER</Text>
                </View>
                <Text style={styles.welcomeTitle}>VIP Card ਮੁਫ਼ਤ ਅਜ਼ਮਾਓ!</Text>
                <Text style={styles.welcomeSubtitle}>
                  ਪਹਿਲੇ 30 ਦਿਨ ਬਿਲਕੁਲ ਫ਼੍ਰੀ · ਕੋਈ ਪੈਸਾ ਨਹੀਂ
                </Text>
                <View style={styles.welcomeFeatures}>
                  {['AI Garden Expert', 'Unlimited Plants', '3D VIP Card'].map(f => (
                    <View key={f} style={styles.welcomeFeatureChip}>
                      <Ionicons name="checkmark" size={10} color="#a78bfa" />
                      <Text style={styles.welcomeFeatureText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.welcomeRight}>
                {trialLoading ? (
                  <ActivityIndicator color="#fff" size="large" />
                ) : (
                  <>
                    <View style={styles.freeBadge}>
                      <Text style={styles.freeBadgeTop}>FREE</Text>
                      <Text style={styles.freeBadgeBottom}>30 DAYS</Text>
                    </View>
                    <Text style={styles.tapText}>Tap to Activate →</Text>
                  </>
                )}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ===== ACTIVE TRIAL STATUS BANNER ===== */}
        {isTrialActive && (
          <LinearGradient
            colors={['#f59e0b', '#d97706', '#b45309']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.trialActiveBanner, premiumShadow('#f59e0b', 'md')]}
          >
            <View style={styles.trialActiveLeft}>
              <Ionicons name="star" size={20} color="#fff" />
              <View>
                <Text style={styles.trialActiveTitle}>🎉 VIP Trial ਐਕਟਿਵ ਹੈ!</Text>
                <Text style={styles.trialActiveSub}>
                  {trialDaysLeft} ਦਿਨ ਬਾਕੀ · Welcome Offer
                </Text>
              </View>
            </View>
            <View style={styles.trialDaysBox}>
              <Text style={styles.trialDaysNum}>{trialDaysLeft}</Text>
              <Text style={styles.trialDaysLabel}>Days Left</Text>
            </View>
          </LinearGradient>
        )}

        {/* ===== TRIAL EXPIRED — UPGRADE NOW ===== */}
        {hasUsedTrial && !isTrialActive && (
          <View style={[styles.expiredBanner, { backgroundColor: '#fef2f2', borderColor: '#fecaca' }]}>
            <Ionicons name="time-outline" size={18} color="#ef4444" />
            <View style={{ flex: 1 }}>
              <Text style={styles.expiredTitle}>ਤੁਹਾਡਾ 30-ਦਿਨ Trial ਖਤਮ ਹੋ ਗਿਆ</Text>
              <Text style={styles.expiredSub}>VIP ਜਾਂ PRO Card ਖਰੀਦ ਕੇ ਜਾਰੀ ਰੱਖੋ</Text>
            </View>
          </View>
        )}

        <Text style={[styles.sectionSubtitle, { color: colors.textMuted, marginTop: 16 }]}>
          ਆਪਣਾ FarmsKing Gardener Card ਚੁਣੋ
        </Text>

        {/* PLANS TOGGLE */}
        <View style={[styles.toggleContainer, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          {(['FREE', 'PRO', 'VIP'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.toggleBtn,
                selectedPlan === p && {
                  backgroundColor: p === 'VIP' ? '#f59e0b' : p === 'PRO' ? '#0ea5e9' : '#64748b',
                },
              ]}
              onPress={() => { tap(); setSelectedPlan(p); }}
            >
              {p === 'VIP' && <Ionicons name="star" size={12} color={selectedPlan === p ? '#fff' : '#94a3b8'} />}
              <Text style={[styles.toggleText, { color: selectedPlan === p ? '#fff' : colors.textMuted }]}>
                {p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* CARD PREVIEW */}
        <View
          style={styles.cardPreviewContainer}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
        >
          {selectedPlan === 'FREE' && (
            <View style={[styles.cardBase, { backgroundColor: '#e2e8f0', borderColor: '#cbd5e1' }]}>
              <View style={styles.cardHeader}>
                <Ionicons name="leaf" size={24} color="#475569" />
                <Text style={[styles.brandName, { color: '#334155' }]}>FarmsKing</Text>
              </View>
              <Text style={[styles.cardTypeTitle, { color: '#475569' }]}>GARDENER CARD</Text>
              <Text style={[styles.cardUserName, { color: '#0f172a' }]}>{user?.name?.toUpperCase() || 'GARDENER'}</Text>
              <Text style={[styles.cardNumber, { color: '#64748b' }]}>ID: {user?.kingId || 'FK-12345'}</Text>
            </View>
          )}

          {selectedPlan === 'PRO' && (
            <LinearGradient
              colors={['#1e293b', '#0f172a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.cardBase, styles.proCard]}
            >
              <View style={styles.cardHeader}>
                <Ionicons name="flower" size={24} color="#38bdf8" />
                <Text style={[styles.brandName, { color: '#fff' }]}>FarmsKing</Text>
              </View>
              <View style={styles.proMiddle}>
                {user?.photoUrl ? (
                  <Image source={{ uri: user.photoUrl }} style={styles.cardAvatar} />
                ) : (
                  <View style={styles.cardAvatarPlaceholder}>
                    <Ionicons name="person" size={24} color="#94a3b8" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTypeTitle, { color: '#38bdf8' }]}>PRO GARDENER</Text>
                  <Text style={[styles.cardUserName, { color: '#fff' }]}>{user?.name?.toUpperCase() || 'PRO GARDENER'}</Text>
                  <Text style={[styles.cardNumber, { color: '#94a3b8' }]}>ID: {user?.kingId || 'FK-12345'}</Text>
                </View>
              </View>
            </LinearGradient>
          )}

          {selectedPlan === 'VIP' && (
            <Animated.View style={[styles.cardBase, styles.vipCard, vipAnimatedStyle]}>
              <LinearGradient
                colors={['#f59e0b', '#d97706', '#b45309']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.0)', 'rgba(0,0,0,0.2)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardHeader}>
                <Ionicons name="star" size={24} color="#fff" />
                <Text style={[styles.brandName, { color: '#fff' }]}>FarmsKing</Text>
                <View style={styles.vipBadgeBox}>
                  <Text style={styles.vipBadgeText}>✦ VIP</Text>
                </View>
                {isTrialActive && (
                  <View style={[styles.vipBadgeBox, { backgroundColor: '#7c3aed', marginLeft: 4 }]}>
                    <Text style={[styles.vipBadgeText, { color: '#fff' }]}>TRIAL</Text>
                  </View>
                )}
              </View>
              <View style={styles.proMiddle}>
                {user?.photoUrl ? (
                  <Image source={{ uri: user.photoUrl }} style={[styles.cardAvatar, { borderColor: '#fff' }]} />
                ) : (
                  <View style={[styles.cardAvatarPlaceholder, { borderColor: '#fff' }]}>
                    <Ionicons name="person" size={24} color="#fff" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cardTypeTitle, { color: '#fff' }]}>VIP GARDENER</Text>
                  <Text style={[styles.cardUserName, { color: '#fff' }]}>{user?.name?.toUpperCase() || 'VIP GARDENER'}</Text>
                  <Text style={[styles.cardNumber, { color: 'rgba(255,255,255,0.8)' }]}>ID: {user?.kingId || 'FK-12345'}</Text>
                </View>
              </View>
              {isTrialActive && (
                <View style={styles.trialCardFooter}>
                  <Ionicons name="time-outline" size={12} color="rgba(255,255,255,0.85)" />
                  <Text style={styles.trialCardFooterText}>
                    Welcome Offer — {trialDaysLeft} ਦਿਨ ਬਾਕੀ
                  </Text>
                </View>
              )}
            </Animated.View>
          )}
        </View>

        {/* BENEFITS BOX */}
        <View style={[styles.benefitsBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
          <Text style={[styles.benefitsTitle, { color: colors.text }]}>
            {selectedPlan} Card ਦੇ ਫ਼ਾਇਦੇ
          </Text>

          {selectedPlan === 'FREE' && (
            <>
              <BenefitItem icon="leaf" text="ਵੱਧ ਤੋਂ ਵੱਧ 5 Plants" colors={colors} />
              <BenefitItem icon="document-text" text="Basic Plant Tracking" colors={colors} />
              <BenefitItem icon="lock-closed" text="AI Garden Advisor ਨਹੀਂ" colors={colors} dimmed />
              <BenefitItem icon="lock-closed" text="ਕੋਈ Photo Card ਨਹੀਂ" colors={colors} dimmed />
            </>
          )}

          {selectedPlan === 'PRO' && (
            <>
              <BenefitItem icon="gift" text="2 Flower Seed Packets (Home Delivery)" colors={colors} highlight />
              <BenefitItem icon="infinite" text="Unlimited Plants" colors={colors} />
              <BenefitItem icon="image" text="Digital PRO Card ਵਿੱਚ Photo" colors={colors} />
              <BenefitItem icon="pie-chart" text="Advanced Garden Expenses Tracker" colors={colors} />
            </>
          )}

          {selectedPlan === 'VIP' && (
            <>
              <BenefitItem icon="gift" text="Premium Seeds & Tools Kit (Home Delivery)" colors={colors} highlight />
              <BenefitItem icon="star" text="Exclusive 3D VIP Digital Card" colors={colors} highlight />
              <BenefitItem icon="infinite" text="Unlimited Plants & Tracking" colors={colors} />
              <BenefitItem icon="camera" text="Plant Photo Time-Lapse Upload" colors={colors} />
              <BenefitItem icon="chatbubbles" text="AI Garden Expert Chat (Unlimited)" colors={colors} />
              <BenefitItem icon="cash" text="Garden Expenses Full Dashboard" colors={colors} />
            </>
          )}
        </View>

        {/* PURCHASE / TRIAL SECTION */}
        {selectedPlan !== 'FREE' && (
          <View style={[styles.purchaseBox, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>

            {/* Price */}
            <View style={styles.priceRow}>
              <Text style={[styles.priceText, { color: colors.text }]}>
                ₹{selectedPlan === 'VIP'
                  ? ((settings as any)?.gardenerVipCardPrice ?? '999')
                  : ((settings as any)?.gardenerProCardPrice ?? '299')}
              </Text>
              <View>
                <Text style={[styles.priceDuration, { color: colors.textMuted }]}>/ Lifetime</Text>
                {selectedPlan === 'VIP' && !hasUsedTrial && (
                  <View style={styles.freeTrialPill}>
                    <Text style={styles.freeTrialPillText}>🎁 30 ਦਿਨ ਫ਼੍ਰੀ Trial ਵੀ ਉਪਲਬਧ</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Try Free Trial Button — Only for VIP, only if not used */}
            {selectedPlan === 'VIP' && !hasUsedTrial && (
              <TouchableOpacity
                style={styles.trialBtn}
                onPress={handleActivateTrial}
                disabled={trialLoading}
              >
                <LinearGradient
                  colors={['#7c3aed', '#6d28d9', '#4c1d95']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.trialBtnGradient}
                >
                  {trialLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="gift" size={20} color="#fff" />
                      <Text style={styles.trialBtnText}>30 ਦਿਨ ਮੁਫ਼ਤ ਅਜ਼ਮਾਓ</Text>
                      <View style={styles.freeBadgeSmall}>
                        <Text style={styles.freeBadgeSmallText}>FREE</Text>
                      </View>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            )}

            {/* Divider */}
            {selectedPlan === 'VIP' && !hasUsedTrial && (
              <View style={styles.orRow}>
                <View style={styles.orLine} />
                <Text style={[styles.orText, { color: colors.textMuted }]}>ਜਾਂ ਸਿੱਧਾ ਖਰੀਦੋ</Text>
                <View style={styles.orLine} />
              </View>
            )}

            {/* Pay with Cashfree */}
            <TouchableOpacity
              style={[styles.buyBtn, selectedPlan === 'VIP' && { backgroundColor: '#f59e0b' }]}
              onPress={handleBuyPlan}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="card" size={20} color="#fff" />
                  <Text style={styles.buyBtnText}>Cashfree ਨਾਲ ਖਰੀਦੋ</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={[styles.secureText, { color: colors.textMuted }]}>
              <Ionicons name="lock-closed" size={12} /> 100% Secure · Seeds Home Delivery ਸ਼ਾਮਲ
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

function BenefitItem({ icon, text, colors, dimmed, highlight }: any) {
  return (
    <View style={[styles.benefitRow, dimmed && { opacity: 0.45 }]}>
      <View style={[styles.benefitIconBox, { backgroundColor: highlight ? '#fef3c7' : '#f0fdf4' }]}>
        <Ionicons name={icon} size={16} color={highlight ? '#f59e0b' : '#16a34a'} />
      </View>
      <Text style={[styles.benefitText, { color: colors.text }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 11, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  scrollContent: { padding: SPACING.md, paddingBottom: 120 },

  // Welcome Banner
  welcomeBanner: {
    borderRadius: RADIUS.xl, padding: 18,
    flexDirection: 'row', alignItems: 'center', gap: 16,
    overflow: 'hidden', marginBottom: 14,
  },
  welcomeLeft: { flex: 1, gap: 6 },
  welcomeTag: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff', borderRadius: RADIUS.pill,
    paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start',
  },
  welcomeTagText: { fontSize: 9, fontFamily: FONT.extraBold, color: '#7c3aed', letterSpacing: 1 },
  welcomeTitle: { fontSize: 20, fontFamily: FONT.extraBold, color: '#fff' },
  welcomeSubtitle: { fontSize: 12, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.85)' },
  welcomeFeatures: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  welcomeFeatureChip: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: RADIUS.pill,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  welcomeFeatureText: { fontSize: 10, fontFamily: FONT.bold, color: '#fff' },
  welcomeRight: { alignItems: 'center', gap: 6 },
  freeBadge: {
    backgroundColor: '#fff', borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center',
    ...premiumShadow('#fff', 'sm'),
  },
  freeBadgeTop: { fontSize: 20, fontFamily: FONT.extraBold, color: '#7c3aed' },
  freeBadgeBottom: { fontSize: 10, fontFamily: FONT.bold, color: '#6d28d9', letterSpacing: 1 },
  tapText: { fontSize: 11, fontFamily: FONT.bold, color: 'rgba(255,255,255,0.85)' },

  // Trial Active Banner
  trialActiveBanner: {
    borderRadius: RADIUS.lg, padding: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 14, overflow: 'hidden',
  },
  trialActiveLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  trialActiveTitle: { fontSize: 14, fontFamily: FONT.extraBold, color: '#fff' },
  trialActiveSub: { fontSize: 11, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.85)' },
  trialDaysBox: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 6 },
  trialDaysNum: { fontSize: 22, fontFamily: FONT.extraBold, color: '#fff' },
  trialDaysLabel: { fontSize: 10, fontFamily: FONT.bold, color: 'rgba(255,255,255,0.85)' },

  // Expired Banner
  expiredBanner: {
    borderRadius: RADIUS.lg, padding: 12,
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1, marginBottom: 12,
  },
  expiredTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#ef4444' },
  expiredSub: { fontSize: 11, fontFamily: FONT.medium, color: '#f87171' },

  sectionSubtitle: { fontSize: 13, fontFamily: FONT.medium, textAlign: 'center', marginBottom: 16 },

  // Plans Toggle
  toggleContainer: {
    flexDirection: 'row', borderRadius: RADIUS.pill, borderWidth: 1,
    padding: 4, marginBottom: 24,
  },
  toggleBtn: {
    flex: 1, paddingVertical: 10, alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.pill, flexDirection: 'row', gap: 4,
  },
  toggleText: { fontSize: 13, fontFamily: FONT.bold },

  // Card Preview
  cardPreviewContainer: {
    alignItems: 'center', justifyContent: 'center',
    marginVertical: 10, height: 220,
  },
  cardBase: {
    width: '95%', maxWidth: 360, height: 200,
    borderRadius: RADIUS.xl, padding: 20,
    justifyContent: 'space-between', overflow: 'hidden',
    ...premiumShadow('#000', 'md'),
  },
  proCard: { },
  vipCard: { ...premiumShadow('#f59e0b', 'lg') },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandName: { fontSize: 18, fontFamily: FONT.extraBold, letterSpacing: 1 },
  vipBadgeBox: {
    marginLeft: 'auto', backgroundColor: '#fff',
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: RADIUS.sm,
  },
  vipBadgeText: { color: '#b45309', fontFamily: FONT.extraBold, fontSize: 11 },
  cardTypeTitle: { fontSize: 11, fontFamily: FONT.bold, letterSpacing: 2, marginBottom: 3 },
  cardUserName: { fontSize: 18, fontFamily: FONT.extraBold, marginBottom: 2 },
  cardNumber: { fontSize: 12, fontFamily: FONT.medium, letterSpacing: 1 },
  proMiddle: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  cardAvatar: { width: 56, height: 56, borderRadius: 28, },
  cardAvatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.2)',
  },
  trialCardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: RADIUS.pill,
    paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start',
  },
  trialCardFooterText: { fontSize: 10, fontFamily: FONT.bold, color: 'rgba(255,255,255,0.85)' },

  // Benefits
  benefitsBox: { marginTop: 24, borderRadius: RADIUS.lg, padding: 18 },
  benefitsTitle: { fontSize: 16, fontFamily: FONT.bold, marginBottom: 14 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  benefitIconBox: { width: 32, height: 32, borderRadius: RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  benefitText: { fontSize: 13.5, fontFamily: FONT.medium, flex: 1 },

  // Purchase
  purchaseBox: { marginTop: 20, borderRadius: RADIUS.lg, padding: 20, alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, marginBottom: 16 },
  priceText: { fontSize: 36, fontFamily: FONT.extraBold },
  priceDuration: { fontSize: 13, fontFamily: FONT.medium, marginBottom: 8 },
  freeTrialPill: {
    backgroundColor: '#ede9fe', borderRadius: RADIUS.pill,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  freeTrialPillText: { fontSize: 10, fontFamily: FONT.bold, color: '#7c3aed' },

  trialBtn: { width: '100%', borderRadius: RADIUS.pill, marginBottom: 12, overflow: 'hidden' },
  trialBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15,
  },
  trialBtnText: { fontSize: 16, fontFamily: FONT.bold, color: '#fff' },
  freeBadgeSmall: {
    backgroundColor: '#fff', borderRadius: 4,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  freeBadgeSmallText: { fontSize: 10, fontFamily: FONT.extraBold, color: '#7c3aed' },

  orRow: { flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', marginBottom: 12 },
  orLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  orText: { fontSize: 12, fontFamily: FONT.medium },

  buyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, backgroundColor: '#059669', width: '100%',
    paddingVertical: 14, borderRadius: RADIUS.pill, marginBottom: 12,
  },
  buyBtnText: { color: '#fff', fontSize: 16, fontFamily: FONT.bold },
  secureText: { fontSize: 12, fontFamily: FONT.regular },
});
