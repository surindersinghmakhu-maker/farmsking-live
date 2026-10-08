import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, useWindowDimensions, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import PublicHeader from '@/components/PublicHeader';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withSequence, withRepeat, withTiming, withDelay,
} from 'react-native-reanimated';
import { FONT, premiumShadow } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Tilt Card (4D Hover Effect) ─────────────────────────────────────────────
function TiltCard({ children, style, onPress, intensity = 1.04 }: any) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onHoverIn={() => { scale.value = withSpring(intensity, { damping: 14 }); }}
      onHoverOut={() => { scale.value = withSpring(1, { damping: 14 }); }}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      onPress={onPress}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Float Widget ─────────────────────────────────────────────────────────────
function Float({ children, style, delay = 0, dist = 8, dur = 3500 }: any) {
  const ty = useSharedValue(0);
  useEffect(() => {
    ty.value = withDelay(delay,
      withRepeat(withSequence(withTiming(-dist, { duration: dur }), withTiming(dist, { duration: dur })), -1, true)
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

// ─── Live Pulse Dot ───────────────────────────────────────────────────────────
function LiveDot() {
  const sc = useSharedValue(1);
  useEffect(() => {
    sc.value = withRepeat(withSequence(withTiming(1.6, { duration: 900 }), withTiming(1, { duration: 900 })), -1, true);
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: sc.value }] }));
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(16,185,129,0.35)' }, anim]} />
      <View style={{ position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' }} />
    </View>
  );
}

// ─── Stat Counter Card ───────────────────────────────────────────────────────
function StatCard({ val, label, color = '#00ff87', icon }: any) {
  return (
    <View style={S.statCard}>
      <Text style={[S.statVal, { color }]}>{val}</Text>
      <Text style={S.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Service Card ─────────────────────────────────────────────────────────────
function ServiceCard({ img, title, subtitle, color, onPress }: any) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const cardW = isMobile ? (width - 60) / 2 : 220;
  return (
    <TiltCard onPress={onPress} style={[S.serviceCard, { width: cardW, borderColor: `${color}30` }]}>
      <BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[`${color}18`, 'transparent']} style={[StyleSheet.absoluteFill, { borderRadius: 20 }]} />
      <View style={[S.serviceIconBg, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
        <Image source={img} style={S.serviceImg} resizeMode="contain" />
      </View>
      <Text style={[S.serviceTitle, { color }]}>{title}</Text>
      <Text style={S.serviceSubtitle}>{subtitle}</Text>
      <View style={[S.serviceArrow, { borderColor: `${color}50` }]}>
        <Ionicons name="arrow-forward" size={14} color={color} />
      </View>
    </TiltCard>
  );
}

// ─── Feature Pill ────────────────────────────────────────────────────────────
function FeaturePill({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={S.featurePill}>
      <Ionicons name={icon} size={16} color="#10b981" />
      <Text style={S.featurePillText}>{label}</Text>
    </View>
  );
}

// ─── Role Badge ──────────────────────────────────────────────────────────────
function RoleBadge({ emoji, title, color }: any) {
  return (
    <TiltCard style={[S.roleBadge, { borderColor: `${color}40`, backgroundColor: `${color}12` }]}>
      <Text style={{ fontSize: 22, marginBottom: 6 }}>{emoji}</Text>
      <Text style={[S.roleTitle, { color }]}>{title}</Text>
    </TiltCard>
  );
}

// ─── Trust Badge Card (ISO) ───────────────────────────────────────────────────
function TrustBadgeCard({ icon, title, desc, color }: any) {
  return (
    <TiltCard style={[S.trustCard, { borderColor: `${color}25`, backgroundColor: `${color}05` }]}>
      <View style={[S.trustIconBox, { backgroundColor: `${color}15`, borderColor: `${color}30` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={[S.trustTitle, { color }]}>{title}</Text>
      <Text style={S.trustDesc}>{desc}</Text>
    </TiltCard>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PublicLandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;
  const isMobile = width <= 768;

  return (
    <View style={S.root}>

      <PublicHeader />

      <ScrollView
        contentContainerStyle={[S.scroll, { paddingBottom: isMobile ? 100 : 80 }]}
        showsVerticalScrollIndicator={false}
      >

        {/* ══ HERO ══ */}
        <View style={[S.hero, isDesktop ? S.heroDesktop : S.heroMobile]}>

          {/* Left / Center Content */}
          <View style={[S.heroContent, isDesktop ? { flex: 6, alignItems: 'flex-start' } : { alignItems: 'center' }]}>
            {/* Live badge */}
            <View style={S.liveBadge}>
              <LiveDot />
              <Text style={S.liveBadgeText}>LIVE · India's Smart Agri Platform</Text>
            </View>

            <Text style={[S.heroTitle, isMobile && { textAlign: 'center', fontSize: 26, lineHeight: 34 }]}>
              Grow Smarter.{'\n'}
              <Text style={S.heroGreen}>Earn More.</Text>
            </Text>
            <Text style={[S.heroSub, isMobile && { textAlign: 'center', fontSize: 13, lineHeight: 20, marginBottom: 20, paddingHorizontal: 8 }]}>
              FarmsKing is India's complete digital farming ecosystem — real-time mandi prices, AI crop diagnostics, expert consultations, farm bookkeeping, and an agri-store. All in one platform.
            </Text>

            {/* CTA Buttons */}
            <View style={[S.ctaRow, isMobile && { justifyContent: 'center' }]}>
              <TiltCard intensity={1.06}>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.9}>
                  <LinearGradient colors={['#00ff87', '#059669']} style={S.btnPrimary} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                    <Ionicons name="leaf" size={18} color="#02120a" />
                    <Text style={S.btnPrimaryText}>Start for Free</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </TiltCard>
              <TouchableOpacity style={S.btnSecondary} onPress={() => router.push('/shop')}>
                <Ionicons name="storefront-outline" size={16} color="#10b981" />
                <Text style={S.btnSecondaryText}>Browse Store</Text>
              </TouchableOpacity>
            </View>

            {/* ISO Enterprise Badges */}
            <View style={[S.isoBadgeRow, isMobile && { justifyContent: 'center' }]}>
              <View style={S.isoBadgeItem}>
                <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                <Text style={S.isoBadgeText}>ISO 27001 Certified</Text>
              </View>
              <View style={S.isoDot} />
              <View style={S.isoBadgeItem}>
                <Ionicons name="lock-closed" size={14} color="#10b981" />
                <Text style={S.isoBadgeText}>256-Bit SSL</Text>
              </View>
              <View style={S.isoDot} />
              <View style={S.isoBadgeItem}>
                <Ionicons name="ribbon" size={14} color="#10b981" />
                <Text style={S.isoBadgeText}>ISO 9001 Quality</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={[S.statsRow, isMobile && { justifyContent: 'center' }]}>
              <StatCard val="50,000+" label="Active Farmers" color="#10b981" />
              <View style={S.statDivider} />
              <StatCard val="1,200+" label="Agri Experts" color="#0ea5e9" />
              <View style={S.statDivider} />
              <StatCard val="28 States" label="India-wide" color="#f59e0b" />
            </View>
          </View>

          {/* Right Side: Floating Crop Asset + Widgets */}
          {isDesktop && (
            <View style={[S.heroRight]}>
              <Float delay={0} dist={14} dur={4000} style={{ alignItems: 'center' }}>
                <Image source={require('@/assets/images/farmsking_allcrops_mockup.png')} style={S.heroImage} resizeMode="contain" />
              </Float>

              {/* Floating live mandi price widget */}
              <Float delay={800} dist={8} dur={3500} style={S.floatWidget1}>
                <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="trending-up" size={16} color="#10b981" />
                  <Text style={S.widgetTitle}>Mandi Price Live</Text>
                </View>
                <Text style={S.widgetBig}>₹2,140</Text>
                <Text style={S.widgetSub}>Wheat / Quintal · ↑ 8.4% today</Text>
              </Float>

              {/* Floating AI diagnosis widget */}
              <Float delay={1500} dist={10} dur={4200} style={S.floatWidget2}>
                <BlurView intensity={35} tint="light" style={StyleSheet.absoluteFill} />
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <Ionicons name="scan" size={16} color="#0ea5e9" />
                  <Text style={S.widgetTitle}>AI Crop Scan</Text>
                </View>
                <Text style={[S.widgetSub, { color: '#0ea5e9' }]}>Disease: Late Blight</Text>
                <Text style={[S.widgetSub, { color: '#64748b', marginTop: 2 }]}>Treatment found in 3s ✓</Text>
              </Float>
            </View>
          )}
        </View>

        {/* Mobile crop image */}
        {!isDesktop && (
          <Float dist={10} dur={3800} style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
            <Image source={require('@/assets/images/farmsking_allcrops_mockup.png')} style={[S.heroImage, { width: width * 0.75, height: 160 }]} resizeMode="contain" />
          </Float>
        )}

        {/* ══ SERVICES ══ */}
        <View style={S.section}>
          <Text style={S.eyebrow}>WHAT WE OFFER</Text>
          <Text style={S.sectionTitle}>Four Pillars of FarmsKing</Text>
          <View style={[S.serviceRow, isMobile && { flexWrap: 'wrap', justifyContent: 'center' }]}>
            <ServiceCard
              img={require('@/assets/images/icon_farming_new.png')}
              title="Farming" subtitle="Crop planning, yield tracking & expert advice"
              color="#10b981" onPress={() => router.push('/topic/Farming')}
            />
            <ServiceCard
              img={require('@/assets/images/icon_gardening_new.png')}
              title="Gardening" subtitle="Home gardens, nurseries & urban growing"
              color="#ec4899" onPress={() => router.push('/topic/Gardening')}
            />
            <ServiceCard
              img={require('@/assets/images/icon_cropdoctors_new.png')}
              title="Crop Doctors" subtitle="AI diagnosis + 1-on-1 expert consultations"
              color="#3b82f6" onPress={() => router.push('/topic/Crop-Doctors')}
            />
            <ServiceCard
              img={require('@/assets/images/icon_agristore_new.png')}
              title="Agri Store" subtitle="Seeds, fertilizers & farming equipment"
              color="#f59e0b" onPress={() => router.push('/shop')}
            />
          </View>
        </View>

        {/* ══ FEATURES GRID ══ */}
        <View style={S.section}>
          <Text style={S.eyebrow}>WHY FARMSKING</Text>
          <Text style={S.sectionTitle}>Everything in One Ecosystem</Text>
          <View style={[S.featuresGrid, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
            <FeaturePill icon="stats-chart" label="Real-Time Mandi Rates" />
            <FeaturePill icon="scan" label="AI Disease Scanner" />
            <FeaturePill icon="book" label="Farm Bookkeeping & Records" />
            <FeaturePill icon="people" label="1200+ Verified Agri Experts" />
            <FeaturePill icon="satellite" label="Satellite Crop Monitoring" />
            <FeaturePill icon="cart" label="Certified Seeds & Inputs Store" />
            <FeaturePill icon="school" label="AgriLearn — Training Courses" />
            <FeaturePill icon="wallet" label="Business Partner Earnings" />
          </View>
        </View>

        {/* ══ WHO IS IT FOR ══ */}
        <View style={S.section}>
          <Text style={S.eyebrow}>FOR EVERYONE</Text>
          <Text style={S.sectionTitle}>Your FarmsKing Role</Text>
          <View style={S.rolesGrid}>
            <RoleBadge emoji="🌾" title="Farmer" color="#10b981" />
            <RoleBadge emoji="🌺" title="Gardener" color="#ec4899" />
            <RoleBadge emoji="🧑‍⚕️" title="Crop Doctor" color="#3b82f6" />
            <RoleBadge emoji="🏪" title="Seller" color="#f59e0b" />
            <RoleBadge emoji="🤝" title="Biz Partner" color="#f97316" />
            <RoleBadge emoji="🛒" title="Customer" color="#8b5cf6" />
          </View>
        </View>

        {/* ══ HOW IT WORKS ══ */}
        <View style={[S.section, { paddingBottom: 20 }]}>
          <Text style={S.eyebrow}>GET STARTED</Text>
          <Text style={S.sectionTitle}>Up & Running in 3 Steps</Text>
          <View style={[S.stepsRow, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
            {[
              { n: '01', icon: 'person-add', title: 'Register Free', desc: 'Sign up in under a minute — no credit card needed.' },
              { n: '02', icon: 'options', title: 'Pick Your Role', desc: 'Choose Farmer, Advisor, Gardener, Seller & more.' },
              { n: '03', icon: 'trending-up', title: 'Start Growing', desc: 'Access live prices, AI tools, experts & the store.' },
            ].map((s, i) => (
              <TiltCard key={i} style={S.stepCard}>
                <LinearGradient colors={['rgba(16,185,129,0.05)', 'transparent']} style={StyleSheet.absoluteFill} />
                <Text style={S.stepNum}>{s.n}</Text>
                <View style={S.stepIconBox}>
                  <Ionicons name={s.icon as any} size={24} color="#10b981" />
                </View>
                <Text style={S.stepTitle}>{s.title}</Text>
                <Text style={S.stepDesc}>{s.desc}</Text>
              </TiltCard>
            ))}
          </View>
        </View>

        {/* ══ ENTERPRISE TRUST & ISO COMPLIANCE ══ */}
        <View style={[S.section, { backgroundColor: 'rgba(0,255,135,0.02)', marginVertical: 40, borderTopWidth: 1, borderBottomWidth: 1, borderColor: 'rgba(0,255,135,0.1)' }]}>
          <Text style={S.eyebrow}>ENTERPRISE GRADE</Text>
          <Text style={S.sectionTitle}>ISO Standards & Security</Text>
          <View style={[S.trustRow, isMobile && { flexDirection: 'column', alignItems: 'center' }]}>
            <TrustBadgeCard
              icon="shield-checkmark-outline"
              title="ISO 27001 Compliant"
              desc="Bank-level data encryption ensuring 100% privacy and security for all farm data, bookkeeping, and personal records."
              color="#00ff87"
            />
            <TrustBadgeCard
              icon="leaf-outline"
              title="ISO 9001 Quality"
              desc="Rigorous quality management systems in place for our certified Agri Store products and verified crop consultations."
              color="#2dd4bf"
            />
            <TrustBadgeCard
              icon="server-outline"
              title="99.99% Uptime SLA"
              desc="Cloud-native infrastructure guaranteeing uninterrupted real-time mandi prices and AI crop diagnosis 24/7."
              color="#f59e0b"
            />
          </View>
        </View>

        {/* ══ CTA STRIP ══ */}
        <View style={S.ctaStrip}>
          <LinearGradient colors={['#e2e8f0', '#f1f5f9', '#e2e8f0']} style={StyleSheet.absoluteFill} />
          <View style={S.ctaStripDeco1} />
          <View style={S.ctaStripDeco2} />
          <Text style={S.ctaStripTitle}>Join 50,000+ Smart Farmers</Text>
          <Text style={S.ctaStripSub}>India's agri-revolution starts at FarmsKing.in</Text>
          <TouchableOpacity style={S.ctaStripBtn} onPress={() => router.push('/(auth)/login')}>
            <LinearGradient colors={['#00ff87', '#059669']} style={S.ctaStripBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={S.ctaStripBtnText}>Create Free Account →</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ══ FOOTER ══ */}
        <View style={S.footer}>
          <Image source={require('@/assets/images/farmsking_logo_transparent_bg.png')} style={S.footerLogo} resizeMode="contain" />
          <Text style={S.footerTagline}>Farm · Garden · Learn · Manage · Buy · Grow</Text>
          <View style={S.footerDivider} />
          <View style={[S.footerLinks, isMobile && { gap: 12 }]}>
            {['About', 'Privacy', 'Terms', 'Contact', 'Careers'].map((l, i) => (
              <Text key={i} style={S.footerLink}>{l}</Text>
            ))}
          </View>
          <Text style={S.footerCopy}>© 2026 FarmsKing. All rights reserved. Made with ♥ for Indian Farmers.</Text>
        </View>

      </ScrollView>

      {/* ══ MOBILE BOTTOM NAV DOCK ══ */}
      {isMobile && (
        <View style={S.dock}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={S.dockBtn} onPress={() => router.push('/market')}>
            <Ionicons name="bar-chart-outline" size={22} color="#64748b" />
            <Text style={S.dockLabel}>Market</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.dockBtn} onPress={() => router.push('/shop')}>
            <Ionicons name="cart-outline" size={22} color="#64748b" />
            <Text style={S.dockLabel}>Store</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.dockCenterWrap} onPress={() => router.push('/crop-disease-scanner')}>
            <LinearGradient colors={['#00ff87', '#059669']} style={S.dockCenter}>
              <Ionicons name="scan" size={28} color="#02120a" />
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity style={S.dockBtn} onPress={() => router.push('/topic/Crop-Doctors')}>
            <Ionicons name="medkit-outline" size={22} color="#64748b" />
            <Text style={S.dockLabel}>Experts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={S.dockBtn} onPress={() => router.push('/(auth)/login')}>
            <Ionicons name="person-outline" size={22} color="#64748b" />
            <Text style={S.dockLabel}>Login</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f8fafc' },
  scroll: { paddingTop: 72, zIndex: 10 },

  // Hero
  hero: { alignItems: 'center', paddingHorizontal: 16, paddingBottom: 10, zIndex: 10 },
  heroDesktop: { flexDirection: 'row', alignItems: 'center', minHeight: 580, maxWidth: 1300, alignSelf: 'center', paddingTop: 40, gap: 40, paddingHorizontal: '5%' },
  heroMobile: { flexDirection: 'column', paddingTop: 16, paddingHorizontal: 16 },
  heroContent: { justifyContent: 'center' },
  heroRight: { flex: 5, alignItems: 'center', position: 'relative', minHeight: 400 },
  heroImage: { width: 400, height: 300 },

  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(16,185,129,0.1)', borderWidth: 1, borderColor: 'rgba(16,185,129,0.25)', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99, marginBottom: 22 },
  liveBadgeText: { color: '#059669', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 0.8 },

  heroTitle: { fontSize: 44, fontFamily: FONT.extraBold, color: '#0f172a', lineHeight: 54, marginBottom: 12 },
  heroGreen: { color: '#10b981' },
  heroSub: { fontSize: 15, fontFamily: FONT.medium, color: '#475569', lineHeight: 24, marginBottom: 24, maxWidth: 520 },

  ctaRow: { flexDirection: 'row', gap: 14, marginBottom: 20, flexWrap: 'wrap' },
  btnPrimary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 30, paddingVertical: 15, borderRadius: 99, ...premiumShadow('rgba(16,185,129,0.3)', 'lg') },
  btnPrimaryText: { color: '#ffffff', fontFamily: FONT.extraBold, fontSize: 16 },
  btnSecondary: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1.5, borderColor: '#cbd5e1', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 99, backgroundColor: '#ffffff', ...premiumShadow('rgba(0,0,0,0.05)', 'sm') },
  btnSecondaryText: { color: '#0f172a', fontFamily: FONT.bold, fontSize: 15 },

  // ISO Enterprise Badges
  isoBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 40, flexWrap: 'wrap' },
  isoBadgeItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  isoBadgeText: { fontSize: 11, fontFamily: FONT.bold, color: '#64748b' },
  isoDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: '#cbd5e1' },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 24, flexWrap: 'wrap' },
  statCard: { alignItems: 'flex-start' },
  statVal: { fontSize: 22, fontFamily: FONT.extraBold },
  statLabel: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#e2e8f0' },

  // Float widgets on desktop hero
  floatWidget1: { position: 'absolute', right: -20, top: 30, width: 220, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', ...premiumShadow('rgba(0,0,0,0.1)', 'lg') },
  floatWidget2: { position: 'absolute', left: 0, bottom: 20, width: 210, backgroundColor: 'rgba(255,255,255,0.9)', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', ...premiumShadow('rgba(0,0,0,0.1)', 'lg') },
  widgetTitle: { color: '#334155', fontSize: 12, fontFamily: FONT.bold },
  widgetBig: { color: '#10b981', fontSize: 26, fontFamily: FONT.extraBold, marginVertical: 4 },
  widgetSub: { color: '#64748b', fontSize: 11, fontFamily: FONT.medium },

  // Section commons
  section: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: '5%', zIndex: 10 },
  eyebrow: { color: '#10b981', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 2.5, marginBottom: 10 },
  sectionTitle: { fontSize: 32, fontFamily: FONT.extraBold, color: '#0f172a', textAlign: 'center', marginBottom: 36 },

  // Services
  serviceRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  serviceCard: { borderRadius: 20, padding: 20, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', overflow: 'hidden', ...premiumShadow('rgba(0,0,0,0.05)', 'lg') },
  serviceIconBg: { width: 64, height: 64, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 14, overflow: 'hidden' },
  serviceImg: { width: 50, height: 50 },
  serviceTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 6 },
  serviceSubtitle: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', lineHeight: 18, marginBottom: 16 },
  serviceArrow: { width: 30, height: 30, borderRadius: 15, borderWidth: 1, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },

  // Features
  featuresGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 1000 },
  featurePill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 18, paddingVertical: 12, borderRadius: 99, ...premiumShadow('rgba(0,0,0,0.03)', 'sm') },
  featurePillText: { color: '#334155', fontFamily: FONT.semiBold, fontSize: 13 },

  // Roles
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center', maxWidth: 800 },
  roleBadge: { width: 110, paddingVertical: 20, borderRadius: 16, borderWidth: 1.5, backgroundColor: '#ffffff', alignItems: 'center', overflow: 'hidden', ...premiumShadow('rgba(0,0,0,0.03)', 'sm') },
  roleTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },

  // Steps
  stepsRow: { flexDirection: 'row', gap: 20, flexWrap: 'wrap', justifyContent: 'center' },
  stepCard: { width: 280, backgroundColor: '#ffffff', borderRadius: 24, padding: 28, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', ...premiumShadow('rgba(0,0,0,0.05)', 'lg') },
  stepNum: { fontSize: 11, fontFamily: FONT.extraBold, color: '#10b981', letterSpacing: 2, marginBottom: 14 },
  stepIconBox: { width: 48, height: 48, borderRadius: 14, backgroundColor: 'rgba(16,185,129,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  stepTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 8 },
  stepDesc: { fontSize: 13, fontFamily: FONT.medium, color: '#64748b', lineHeight: 20 },

  // Trust Badges
  trustRow: { flexDirection: 'row', gap: 16, flexWrap: 'wrap', justifyContent: 'center' },
  trustCard: { width: 300, backgroundColor: '#ffffff', borderRadius: 20, padding: 24, borderWidth: 1, overflow: 'hidden', ...premiumShadow('rgba(0,0,0,0.04)', 'md') },
  trustIconBox: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, marginBottom: 16 },
  trustTitle: { fontSize: 16, fontFamily: FONT.extraBold, marginBottom: 8 },
  trustDesc: { fontSize: 13, fontFamily: FONT.medium, color: '#64748b', lineHeight: 20 },

  // CTA strip
  ctaStrip: { margin: 24, borderRadius: 28, padding: 48, alignItems: 'center', overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#ffffff', ...premiumShadow('rgba(0,0,0,0.08)', 'lg') },
  ctaStripDeco1: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(16,185,129,0.08)', top: -80, right: -80, ...(Platform.OS === 'web' ? { filter: 'blur(60px)' } as any : {}) },
  ctaStripDeco2: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(59,130,246,0.05)', bottom: -60, left: -60, ...(Platform.OS === 'web' ? { filter: 'blur(60px)' } as any : {}) },
  ctaStripTitle: { fontSize: 28, fontFamily: FONT.extraBold, color: '#0f172a', textAlign: 'center', marginBottom: 10 },
  ctaStripSub: { fontSize: 14, fontFamily: FONT.medium, color: '#475569', textAlign: 'center', marginBottom: 28 },
  ctaStripBtn: { borderRadius: 99, overflow: 'hidden', ...premiumShadow('rgba(16,185,129,0.4)', 'lg') },
  ctaStripBtnInner: { paddingHorizontal: 36, paddingVertical: 15 },
  ctaStripBtnText: { color: '#ffffff', fontFamily: FONT.extraBold, fontSize: 16 },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24, borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 20, backgroundColor: '#ffffff' },
  footerLogo: { width: 80, height: 80, marginBottom: 8 },
  footerTagline: { color: '#64748b', fontSize: 12, fontFamily: FONT.medium, letterSpacing: 0.5, marginBottom: 20 },
  footerDivider: { width: '80%', height: 1, backgroundColor: '#e2e8f0', marginBottom: 20 },
  footerLinks: { flexDirection: 'row', gap: 24, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 20 },
  footerLink: { color: '#475569', fontSize: 13, fontFamily: FONT.medium },
  footerCopy: { color: '#94a3b8', fontSize: 11, fontFamily: FONT.medium, textAlign: 'center' },

  // Mobile dock
  dock: { position: 'absolute', bottom: 16, left: 16, right: 16, height: 68, backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 8, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', ...premiumShadow('rgba(0,0,0,0.1)', 'lg') },
  dockBtn: { alignItems: 'center', justifyContent: 'center', padding: 8 },
  dockLabel: { color: '#64748b', fontSize: 10, fontFamily: FONT.bold, marginTop: 2 },
  dockCenterWrap: { marginTop: -30 },
  dockCenter: { width: 58, height: 58, borderRadius: 29, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#ffffff', ...premiumShadow('rgba(16,185,129,0.4)', 'lg') },
});
