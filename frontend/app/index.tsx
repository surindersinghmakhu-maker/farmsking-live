import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, useWindowDimensions, Pressable, Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PublicHeader from '@/components/PublicHeader';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withSequence, withRepeat, withTiming, withDelay,
} from 'react-native-reanimated';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Floating animated crop image ────────────────────────────────────────────
function AnimatedCropAsset({
  imgSrc, style, index = 0,
}: { imgSrc: any; style?: any; index?: number }) {
  const translateY = useSharedValue(0);
  const rotation  = useSharedValue(0);
  const scale     = useSharedValue(1);

  useEffect(() => {
    const dur = 2800;
    const offset = index % 2 === 0 ? -5 : 5;
    const delay  = index * 350;
    translateY.value = withDelay(delay, withRepeat(withSequence(withTiming(offset, { duration: dur }), withTiming(-offset, { duration: dur })), -1, true));
    rotation.value   = withDelay(delay, withRepeat(withSequence(withTiming(4,  { duration: dur }), withTiming(-4, { duration: dur })), -1, true));
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, anim]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(1.18, { damping: 10 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10 }); }}
        onHoverIn={() => { scale.value = withSpring(1.18, { damping: 10 }); }}
        onHoverOut={() => { scale.value = withSpring(1, { damping: 10 }); }}
        style={{ alignItems: 'center' }}
      >
        <Image source={imgSrc} style={styles.cropAsset} resizeMode="cover" />
      </Pressable>
    </Animated.View>
  );
}

// ─── Glass service card ───────────────────────────────────────────────────────
function GlassCard({
  imgSrcs, title, desc, accentColor, onPress,
}: { imgSrcs: any[]; title: string; desc: string; accentColor: string; onPress: () => void }) {
  const { width } = useWindowDimensions();
  const isMobile  = width <= 768;
  const cardWidth = isMobile ? (width / 2) - 24 : 200;
  const scale     = useSharedValue(1);

  const cardAnim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onHoverIn={() => { scale.value = withSpring(1.04, { damping: 12 }); }}
      onHoverOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 12 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 12 }); }}
      onPress={onPress}
    >
      <Animated.View style={[styles.glassCard, cardAnim, { width: cardWidth }]}>
        <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
        {/* Accent glow bar at top */}
        <View style={[styles.glassAccentBar, { backgroundColor: accentColor }]} />

        <View style={styles.glassImgRow}>
          {imgSrcs.map((src, i) => (
            <AnimatedCropAsset key={i} index={i} imgSrc={src} />
          ))}
        </View>

        <Text style={[styles.glassTitle, { color: accentColor }]}>{title}</Text>
        <Text style={styles.glassDesc}>{desc}</Text>

        <TouchableOpacity
          style={[styles.glassBtn, { borderColor: accentColor }]}
          onPress={onPress}
        >
          <Text style={[styles.glassBtnText, { color: accentColor }]}>Explore →</Text>
        </TouchableOpacity>
      </Animated.View>
    </Pressable>
  );
}

// ─── Feature pill (Why FarmsKing) ────────────────────────────────────────────
function FeaturePill({ icon, label, desc }: { icon: string; label: string; desc: string }) {
  return (
    <View style={styles.featurePill}>
      <View style={styles.featurePillIcon}>
        <Ionicons name={icon as any} size={20} color="#10b981" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.featurePillLabel}>{label}</Text>
        <Text style={styles.featurePillDesc}>{desc}</Text>
      </View>
    </View>
  );
}

// ─── Role card ───────────────────────────────────────────────────────────────
function RoleCard({ emoji, title, desc, color }: { emoji: string; title: string; desc: string; color: string }) {
  const scale = useSharedValue(1);
  const anim  = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onHoverIn={() => { scale.value = withSpring(1.06); }}
      onHoverOut={() => { scale.value = withSpring(1); }}
      onPressIn={() => { scale.value = withSpring(0.95); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View style={[styles.roleCard, anim, { borderColor: color }]}>
        <LinearGradient colors={[`${color}22`, 'transparent']} style={StyleSheet.absoluteFill} />
        <Text style={{ fontSize: 28, marginBottom: 6 }}>{emoji}</Text>
        <Text style={[styles.roleTitle, { color }]}>{title}</Text>
        <Text style={styles.roleDesc}>{desc}</Text>
      </Animated.View>
    </Pressable>
  );
}

// ─── Step card ───────────────────────────────────────────────────────────────
function StepCard({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <View style={styles.stepCard}>
      <LinearGradient colors={['#10b981', '#059669']} style={styles.stepNum}>
        <Text style={styles.stepNumText}>{num}</Text>
      </LinearGradient>
      <Text style={styles.stepTitle}>{title}</Text>
      <Text style={styles.stepDesc}>{desc}</Text>
    </View>
  );
}

// ─── Main landing page ────────────────────────────────────────────────────────
export default function PublicLandingPage() {
  const router    = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const isMobile  = width <= 480;

  return (
    <View style={styles.container}>
      {/* Full-screen hero background */}
      <Image
        source={require('@/assets/images/farmsking_hero_bg_new.png')}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode="cover"
      />
      {/* Deep gradient overlay */}
      <LinearGradient
        colors={['rgba(4,15,28,0.72)', 'rgba(4,15,28,0.88)', '#040f1c']}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating glowing orbs — web only */}
      {Platform.OS === 'web' && (
        <>
          <View style={[styles.orb, { top: 60,  left: '8%',  width: 320, height: 320, backgroundColor: 'rgba(16,185,129,0.14)' }]} />
          <View style={[styles.orb, { top: 200, right: '6%', width: 260, height: 260, backgroundColor: 'rgba(14,165,233,0.12)' }]} />
          <View style={[styles.orb, { top: 500, left: '35%', width: 180, height: 180, backgroundColor: 'rgba(245,158,11,0.08)'  }]} />
        </>
      )}

      {/* Floating pill header */}
      <PublicHeader />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
      >
        {/* ── HERO ── */}
        <View style={styles.heroSection}>
          {/* Premium badge */}
          <View style={styles.heroBadge}>
            <Ionicons name="star" size={13} color="#f59e0b" />
            <Text style={styles.heroBadgeText}>  India's #1 Digital Agriculture Platform</Text>
            <Ionicons name="star" size={13} color="#f59e0b" />
          </View>

          <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile]}>
            <Text style={{ color: '#fef08a' }}>Revolutionizing</Text>{'\n'}Indian Agriculture
          </Text>
          <Text style={[styles.heroSubtitle, !isDesktop && styles.heroSubtitleMobile]}>
            Complete Agri-Platform · From Seeds to Harvest · Pure Farmer-Made Foods
          </Text>

          {/* Feature pills */}
          <View style={styles.heroPills}>
            {['🌱 Farm', '🌿 Garden', '📚 Learn', '⚙️ Manage', '🛒 Buy', '🚀 Grow'].map((p, i) => (
              <View key={i} style={styles.heroPill}>
                <Text style={styles.heroPillText}>{p}</Text>
              </View>
            ))}
          </View>

          {/* CTA buttons */}
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.ctaPrimary}
              onPress={() => router.push('/shop')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.ctaGradient}>
                <Ionicons name="storefront-outline" size={18} color="#fff" />
                <Text style={styles.ctaPrimaryText}>Shop Now</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.ctaSecondary}
              onPress={() => router.push('/topic/Crop-Doctors')}
              activeOpacity={0.85}
            >
              <Ionicons name="leaf-outline" size={18} color="#10b981" />
              <Text style={styles.ctaSecondaryText}>Ask Agri-AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── SERVICE CARDS ── */}
        <View style={[styles.cardsRow, !isDesktop && styles.cardsRowMobile]}>
          <GlassCard
            imgSrcs={[require('@/assets/images/icon_farming_new.png')]}
            title="Farming"
            desc="Precision Agriculture, Yield Max & Resource Efficiency."
            accentColor="#10b981"
            onPress={() => router.push('/topic/Farming')}
          />
          <GlassCard
            imgSrcs={[require('@/assets/images/icon_gardening_new.png')]}
            title="Gardening"
            desc="Home Kits, Urban Farming & Expert Plant Care."
            accentColor="#ec4899"
            onPress={() => router.push('/topic/Gardening')}
          />
          <GlassCard
            imgSrcs={[require('@/assets/images/icon_cropdoctors_new.png')]}
            title="Crop Doctors"
            desc="AI Diagnosis, Expert Consults & Soil Analysis."
            accentColor="#3b82f6"
            onPress={() => router.push('/topic/Crop-Doctors')}
          />
          <GlassCard
            imgSrcs={[require('@/assets/images/icon_agristore_new.png')]}
            title="Agri Store"
            desc="Certified Seeds, Fertilizers, Equipment & More."
            accentColor="#f59e0b"
            onPress={() => router.push('/shop')}
          />
        </View>

        {/* ── WHY FARMSKING ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>WHY FARMSKING?</Text>
          <Text style={styles.sectionTitle}>Everything in One Ecosystem</Text>
          <View style={[styles.featuresGrid, isMobile && { flexDirection: 'column' }]}>
            <FeaturePill icon="stats-chart-outline"   label="Real-Time Market Rates"  desc="Latest mandi rates & price trends" />
            <FeaturePill icon="people-outline"        label="Expert Advisors"         desc="Practical agriculture guidance" />
            <FeaturePill icon="book-outline"          label="Smart Bookkeeping"       desc="Income, expenses & profit/loss" />
            <FeaturePill icon="bulb-outline"          label="AI-Powered Solutions"    desc="Instant answers & suggestions" />
            <FeaturePill icon="cart-outline"          label="E-commerce Delivery"     desc="Quality products, fast delivery" />
            <FeaturePill icon="shield-checkmark-outline" label="Trusted Community"   desc="Learn, share & grow together" />
          </View>
        </View>

        {/* ── USER ROLES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>PERSONALIZED EXPERIENCE</Text>
          <Text style={styles.sectionTitle}>Choose Your FarmsKing Role</Text>
          <View style={styles.rolesGrid}>
            <RoleCard emoji="🛒" title="Customer"         desc="Buy Products"       color="#3b82f6" />
            <RoleCard emoji="🌾" title="Farmer"           desc="Manage Farm"        color="#10b981" />
            <RoleCard emoji="👑" title="Paid Farmer"      desc="Advanced Tools"     color="#f59e0b" />
            <RoleCard emoji="🧑‍⚕️" title="Advisor"        desc="Help Farmers"       color="#8b5cf6" />
            <RoleCard emoji="🌺" title="Gardener"         desc="Manage Gardens"     color="#ec4899" />
            <RoleCard emoji="🌸" title="Garden Advisor"   desc="Garden Expertise"   color="#d946ef" />
            <RoleCard emoji="🤝" title="Business Partner" desc="Earn & Grow"        color="#f97316" />
            <RoleCard emoji="⚙️" title="Admin"            desc="Manage Platform"    color="#64748b" />
          </View>
        </View>

        {/* ── HOW IT WORKS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>GET STARTED IN 4 STEPS</Text>
          <Text style={styles.sectionTitle}>How FarmsKing Works</Text>
          <View style={[styles.stepsRow, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
            <StepCard num="1" title="Register"        desc="Create your account in minutes." />
            {!isMobile && <Ionicons name="arrow-forward" size={24} color="#10b981" style={{ marginTop: 24 }} />}
            <StepCard num="2" title="Select Role"     desc="Choose your role & set up profile." />
            {!isMobile && <Ionicons name="arrow-forward" size={24} color="#10b981" style={{ marginTop: 24 }} />}
            <StepCard num="3" title="Explore Services" desc="Use farming, gardening, store & AI." />
            {!isMobile && <Ionicons name="arrow-forward" size={24} color="#10b981" style={{ marginTop: 24 }} />}
            <StepCard num="4" title="Grow Together"   desc="Better results, higher income." />
          </View>
        </View>

        {/* ── TRUST BADGES ── */}
        <View style={[styles.section, { paddingBottom: 0 }]}>
          <View style={[styles.trustGrid, isMobile && { flexDirection: 'column' }]}>
            {[
              { icon: 'shield-checkmark', label: 'Secure & Safe',        desc: 'Privacy-focused platform' },
              { icon: 'checkmark-circle', label: 'Verified Products',    desc: 'Quality from trusted sellers' },
              { icon: 'people',           label: 'Expert Verification',  desc: 'Professional advisory network' },
              { icon: 'lock-closed',      label: 'Privacy First',        desc: 'Your data always protected' },
            ].map((b, i) => (
              <View key={i} style={styles.trustBadge}>
                <Ionicons name={b.icon as any} size={26} color="#10b981" />
                <Text style={styles.trustLabel}>{b.label}</Text>
                <Text style={styles.trustDesc}>{b.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── CTA STRIP ── */}
        <LinearGradient
          colors={['#064e3b', '#065f46', '#047857']}
          style={styles.ctaStrip}
        >
          <Text style={styles.ctaStripTitle}>Start Your Smart Farming Journey Today</Text>
          <Text style={styles.ctaStripSub}>Join FarmsKing — India's growing agri-revolution.</Text>
          <TouchableOpacity
            style={styles.ctaStripBtn}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaStripBtnText}>Get Started →</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <View style={styles.footerTop}>
            <View style={{ maxWidth: 260 }}>
              <Text style={styles.footerBrand}>♕ FarmsKing</Text>
              <Text style={styles.footerBrandSub}>Farm · Garden · Learn · Manage · Buy · Grow</Text>
            </View>
            {isDesktop && (
              <>
                <View>
                  <Text style={styles.footerColHead}>Platform</Text>
                  {['Farming', 'Gardening', 'Advisors', 'Market Rates'].map((l, i) => (
                    <Text key={i} style={styles.footerLink}>{l}</Text>
                  ))}
                </View>
                <View>
                  <Text style={styles.footerColHead}>Store</Text>
                  {['Seeds & Plants', 'Farm Inputs', 'Tools', 'Farmer Foods'].map((l, i) => (
                    <Text key={i} style={styles.footerLink}>{l}</Text>
                  ))}
                </View>
                <View>
                  <Text style={styles.footerColHead}>Company</Text>
                  {['About', 'Contact', 'Privacy', 'Terms'].map((l, i) => (
                    <Text key={i} style={styles.footerLink}>{l}</Text>
                  ))}
                </View>
              </>
            )}
          </View>
          <View style={styles.footerDivider} />
          <View style={styles.footerBottom}>
            <Text style={styles.footerCopy}>© 2026 FarmsKing. All rights reserved.</Text>
            <View style={{ flexDirection: 'row', gap: 16 }}>
              {(['logo-facebook', 'logo-youtube', 'logo-instagram', 'logo-whatsapp'] as const).map((ic, i) => (
                <Ionicons key={i} name={ic} size={20} color="#64748b" />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040f1c' },

  // Glowing background orbs
  orb: {
    position: 'absolute',
    borderRadius: 999,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(80px)' } as any) : {}),
    zIndex: 0,
  },

  scrollContent: { flexGrow: 1, zIndex: 10 },

  // ── Hero ──
  heroSection: {
    alignItems: 'center',
    paddingTop: 130,
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    marginBottom: 20,
  },
  heroBadgeText: {
    color: '#fbbf24',
    fontFamily: FONT.bold,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  heroTitle: {
    fontSize: 44,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 52,
    marginBottom: 16,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 12,
  },
  heroTitleMobile: { fontSize: 28, lineHeight: 36 },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 28,
    maxWidth: 560,
  },
  heroSubtitleMobile: { fontSize: 14 },
  heroPills: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10, marginBottom: 32 },
  heroPill: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 99,
  },
  heroPillText: { color: '#e2e8f0', fontFamily: FONT.semiBold, fontSize: 13 },
  heroActions: { flexDirection: 'row', gap: 14, flexWrap: 'wrap', justifyContent: 'center' },
  ctaPrimary: { borderRadius: 32, overflow: 'hidden', ...premiumShadow('#10b981', 'lg') },
  ctaGradient: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 26, paddingVertical: 14, borderRadius: 32,
  },
  ctaPrimaryText: { color: '#fff', fontFamily: FONT.bold, fontSize: 15 },
  ctaSecondary: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.4)',
    paddingHorizontal: 26, paddingVertical: 13, borderRadius: 32,
  },
  ctaSecondaryText: { color: '#10b981', fontFamily: FONT.bold, fontSize: 15 },

  // ── Glass cards ──
  cardsRow: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 16, paddingHorizontal: 16, paddingBottom: 60,
  },
  cardsRowMobile: { flexWrap: 'wrap', gap: 12 },
  glassCard: {
    backgroundColor: 'rgba(16,25,40,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    padding: 14,
    overflow: 'hidden',
    ...premiumShadow('rgba(0,0,0,0.5)', 'lg'),
  },
  glassAccentBar: { height: 3, borderRadius: 99, marginBottom: 12 },
  glassImgRow: { flexDirection: 'row', gap: 10, justifyContent: 'center', marginBottom: 10 },
  cropAsset: {
    width: 52, height: 52, borderRadius: 26,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.18)',
    ...premiumShadow('#000', 'lg'),
  },
  glassTitle: { fontSize: 17, fontFamily: FONT.bold, marginBottom: 6 },
  glassDesc:  { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', lineHeight: 18, marginBottom: 14, flex: 1 },
  glassBtn: {
    borderWidth: 1, borderRadius: 20,
    paddingVertical: 9, alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  glassBtnText: { fontSize: 13, fontFamily: FONT.bold },

  // ── Shared section ──
  section: { paddingHorizontal: 20, paddingVertical: 60, alignItems: 'center' },
  sectionEyebrow: {
    color: '#10b981', fontSize: 11, fontFamily: FONT.bold,
    letterSpacing: 2.5, marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 28, fontFamily: FONT.extraBold, color: '#f8fafc',
    textAlign: 'center', marginBottom: 36,
  },

  // ── Feature pills ──
  featuresGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16, maxWidth: 900,
  },
  featurePill: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, padding: 16, width: 260,
  },
  featurePillIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(16,185,129,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  featurePillLabel: { fontSize: 14, fontFamily: FONT.bold, color: '#f1f5f9', marginBottom: 2 },
  featurePillDesc:  { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },

  // ── Roles ──
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, maxWidth: 900 },
  roleCard: {
    width: 130, padding: 18, borderRadius: 18, borderWidth: 1.5,
    alignItems: 'center', backgroundColor: 'rgba(16,25,40,0.5)',
    overflow: 'hidden',
    ...premiumShadow('rgba(0,0,0,0.4)', 'md'),
  },
  roleTitle: { fontSize: 13, fontFamily: FONT.bold, textAlign: 'center', marginBottom: 2 },
  roleDesc:  { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' },

  // ── Steps ──
  stepsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  stepCard: {
    width: 170, backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16, padding: 20, alignItems: 'center',
  },
  stepNum: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  stepNumText: { color: '#fff', fontFamily: FONT.extraBold, fontSize: 16 },
  stepTitle:   { fontSize: 14, fontFamily: FONT.bold, color: '#f1f5f9', textAlign: 'center', marginBottom: 6 },
  stepDesc:    { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' },

  // ── Trust ──
  trustGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 24, padding: 32, maxWidth: 900,
  },
  trustBadge: { alignItems: 'center', width: 170, gap: 6 },
  trustLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#f1f5f9', textAlign: 'center' },
  trustDesc:  { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' },

  // ── CTA strip ──
  ctaStrip: {
    marginHorizontal: 20, marginVertical: 40,
    borderRadius: 24, padding: 40, alignItems: 'center',
    ...premiumShadow('#10b981', 'lg'),
  },
  ctaStripTitle: { fontSize: 26, fontFamily: FONT.extraBold, color: '#fff', textAlign: 'center', marginBottom: 8 },
  ctaStripSub:   { fontSize: 15, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginBottom: 24 },
  ctaStripBtn: {
    backgroundColor: '#fff', paddingHorizontal: 36, paddingVertical: 14, borderRadius: 32,
    ...premiumShadow('#fff', 'md'),
  },
  ctaStripBtnText: { color: '#065f46', fontSize: 16, fontFamily: FONT.extraBold },

  // ── Footer ──
  footer: { backgroundColor: '#020c18', paddingHorizontal: 24, paddingVertical: 40 },
  footerTop: { flexDirection: 'row', flexWrap: 'wrap', gap: 40, justifyContent: 'space-between', marginBottom: 32 },
  footerBrand: { fontSize: 20, fontFamily: FONT.extraBold, color: '#f8fafc', marginBottom: 4 },
  footerBrandSub: { fontSize: 11, fontFamily: FONT.medium, color: '#475569' },
  footerColHead: { fontSize: 13, fontFamily: FONT.bold, color: '#94a3b8', marginBottom: 12 },
  footerLink:    { fontSize: 13, fontFamily: FONT.medium, color: '#475569', marginBottom: 8 },
  footerDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: 20 },
  footerBottom:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
  footerCopy:    { fontSize: 12, fontFamily: FONT.medium, color: '#475569' },
});
