const fs = require('fs');

const content = `import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Platform, useWindowDimensions, Pressable, TextInput,
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

// ─── 4D Hoverable Tilt Card ──────────────────────────────────────────────────
function TiltCard({ children, style, intensity = 1.05 }: any) {
  const scale = useSharedValue(1);
  const shadowOpacity = useSharedValue(0.1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: shadowOpacity.value,
  }));
  return (
    <Pressable
      onHoverIn={() => {
        scale.value = withSpring(intensity, { damping: 12 });
        shadowOpacity.value = withSpring(0.4);
      }}
      onHoverOut={() => {
        scale.value = withSpring(1, { damping: 12 });
        shadowOpacity.value = withSpring(0.1);
      }}
      onPressIn={() => { scale.value = withSpring(0.98); }}
      onPressOut={() => { scale.value = withSpring(1); }}
    >
      <Animated.View style={[style, anim]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}

// ─── Floating Animations ─────────────────────────────────────────────────────
function FloatingWidget({ children, delay = 0, distance = 8, duration = 3000, style }: any) {
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withDelay(delay, 
      withRepeat(withSequence(
        withTiming(-distance, { duration }), 
        withTiming(distance, { duration })
      ), -1, true)
    );
  }, []);
  const anim = useAnimatedStyle(() => ({ transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

// ─── Bento Feature Card ──────────────────────────────────────────────────────
function BentoCard({ icon, title, desc, color, colSpan = 1, delay = 0 }: any) {
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  return (
    <TiltCard style={[styles.bentoCard, isMobile ? { width: '100%' } : { flex: colSpan }]}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient colors={[\`\${color}15\`, 'transparent']} style={StyleSheet.absoluteFill} />
      <View style={[styles.bentoIconBox, { backgroundColor: \`\${color}25\`, borderColor: \`\${color}50\` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.bentoTitle}>{title}</Text>
      <Text style={styles.bentoDesc}>{desc}</Text>
    </TiltCard>
  );
}

// ─── Main Landing Page ───────────────────────────────────────────────────────
export default function PublicLandingPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 1024;
  const isTablet = width > 768 && width <= 1024;
  const isMobile = width <= 768;

  // Live Simulator State
  const [simulatorCrop, setSimulatorCrop] = useState('Wheat');
  const [simulatorAcres, setSimulatorAcres] = useState('5');
  const simulatedProfit = (Number(simulatorAcres) || 0) * (simulatorCrop === 'Wheat' ? 45000 : simulatorCrop === 'Rice' ? 52000 : 85000);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#02120a', '#062013', '#02120a']} style={StyleSheet.absoluteFill} />
      
      {/* Bioluminescent Orbs */}
      {Platform.OS === 'web' && (
        <>
          <View style={[styles.orb, { top: -100, left: '-10%', width: 600, height: 600, backgroundColor: 'rgba(0,255,135,0.08)' }]} />
          <View style={[styles.orb, { top: '30%', right: '-5%', width: 500, height: 500, backgroundColor: 'rgba(45,212,191,0.06)' }]} />
          <View style={[styles.orb, { bottom: -100, left: '20%', width: 700, height: 700, backgroundColor: 'rgba(251,191,36,0.05)' }]} />
        </>
      )}

      {/* Sticky Glass Header */}
      <View style={styles.stickyHeaderWrap}>
        <PublicHeader />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* ── 7:5 HERO SECTION ── */}
        <View style={[styles.heroRow, isMobile && styles.heroRowMobile]}>
          <View style={[styles.heroLeft, isMobile && { width: '100%', alignItems: 'center' }]}>
            <View style={styles.liveBadge}>
              <View style={styles.liveDot} />
              <Text style={styles.liveBadgeText}>SYSTEM ONLINE · V2.4</Text>
            </View>
            <Text style={[styles.heroTitle, isMobile && { textAlign: 'center', fontSize: 38, lineHeight: 46 }]}>
              The Future of <Text style={styles.textNeon}>AgriTech</Text>{'\\n'}is Here.
            </Text>
            <Text style={[styles.heroSubtitle, isMobile && { textAlign: 'center' }]}>
              FarmsKing.in is the ultimate bioluminescent ecosystem for smart crop intelligence, real-time mandi prices, and expert 1-on-1 consultations.
            </Text>
            <View style={[styles.heroActions, isMobile && { justifyContent: 'center' }]}>
              <TiltCard intensity={1.08}>
                <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push('/(auth)/login')}>
                  <LinearGradient colors={['#00ff87', '#10b981']} style={styles.btnPrimaryGradient} start={{x:0, y:0}} end={{x:1, y:1}}>
                    <Text style={styles.btnPrimaryText}>Start Free Trial</Text>
                    <Ionicons name="rocket" size={16} color="#02120a" />
                  </LinearGradient>
                </TouchableOpacity>
              </TiltCard>
              <TiltCard intensity={1.08}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push('/shop')}>
                  <Text style={styles.btnSecondaryText}>View Pricing</Text>
                </TouchableOpacity>
              </TiltCard>
            </View>
            
            <View style={[styles.trustMetrics, isMobile && { justifyContent: 'center' }]}>
              <View style={styles.metricItem}><Text style={styles.metricVal}>1.2M+</Text><Text style={styles.metricLabel}>Active Farmers</Text></View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}><Text style={styles.metricVal}>₹500Cr</Text><Text style={styles.metricLabel}>Trade Volume</Text></View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}><Text style={styles.metricVal}>99.9%</Text><Text style={styles.metricLabel}>Uptime</Text></View>
            </View>
          </View>

          <View style={[styles.heroRight, isMobile && { width: '100%', marginTop: 40 }]}>
            {/* 3D Glass Mockups */}
            <FloatingWidget delay={0} distance={12} duration={4000} style={[styles.mockupCard, { right: 0, top: 0, zIndex: 3 }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.mockupHeader}><Ionicons name="calendar" size={16} color="#2dd4bf" /><Text style={styles.mockupTitle}>30-Day Crop Calendar</Text></View>
              <View style={styles.mockupBody}>
                <View style={styles.mockupRow}><View style={[styles.mockupDot, {backgroundColor: '#2dd4bf'}]}/><Text style={styles.mockupText}>Day 12: Apply NPK Fertilizer</Text></View>
                <View style={styles.mockupRow}><View style={[styles.mockupDot, {backgroundColor: '#fbbf24'}]}/><Text style={styles.mockupText}>Day 15: Mild Pest Warning</Text></View>
              </View>
            </FloatingWidget>

            <FloatingWidget delay={1500} distance={8} duration={3500} style={[styles.mockupCard, { left: isMobile ? 0 : -40, top: 120, zIndex: 2, borderColor: 'rgba(0,255,135,0.4)' }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.mockupHeader}><Ionicons name="trending-up" size={16} color="#00ff87" /><Text style={styles.mockupTitle}>Live Mandi Surge</Text></View>
              <Text style={{ fontSize: 24, fontFamily: FONT.extraBold, color: '#00ff87', marginTop: 10 }}>₹2,450 <Text style={{ fontSize: 12, color: '#94a3b8' }}>/ Quintal</Text></Text>
              <Text style={{ fontSize: 11, color: '#2dd4bf', fontFamily: FONT.bold, marginTop: 4 }}>+12.4% Surge in 24h</Text>
            </FloatingWidget>

            <FloatingWidget delay={800} distance={10} duration={4500} style={[styles.mockupCard, { right: 20, top: 220, zIndex: 4, borderColor: 'rgba(251,191,36,0.3)' }]}>
              <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
              <View style={styles.mockupHeader}><Ionicons name="videocam" size={16} color="#fbbf24" /><Text style={styles.mockupTitle}>1-on-1 Expert Connect</Text></View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#fbbf24', alignItems: 'center', justifyContent: 'center' }}><Text>👨‍🌾</Text></View>
                <View><Text style={{ color: '#fff', fontFamily: FONT.bold, fontSize: 12 }}>Dr. Sharma</Text><Text style={{ color: '#94a3b8', fontSize: 10 }}>Agronomist (Live)</Text></View>
              </View>
            </FloatingWidget>
          </View>
        </View>

        {/* ── BENTO GRID FEATURES ── */}
        <View style={styles.section}>
          <Text style={styles.sectionBadge}>ECOSYSTEM MODULES</Text>
          <Text style={styles.sectionTitle}>Everything You Need to Scale.</Text>
          <View style={[styles.bentoGrid, isMobile && { flexDirection: 'column' }]}>
            <BentoCard icon="scan" title="AI Crop Disease Scanner" desc="Instantly diagnose plant diseases using your phone camera." color="#00ff87" colSpan={2} />
            <BentoCard icon="satellite" title="Satellite Farm Mapping" desc="Geofence your land & track NDVI health." color="#2dd4bf" colSpan={1} />
            <BentoCard icon="wallet" title="Smart Ledger & Books" desc="Track every rupee spent and earned." color="#fbbf24" colSpan={1} />
            <BentoCard icon="cart" title="B2B E-Commerce Store" desc="Buy authentic seeds & fertilizers directly." color="#10b981" colSpan={2} />
          </View>
        </View>

        {/* ── INTERACTIVE ROI SIMULATOR ── */}
        <View style={styles.section}>
          <Text style={styles.sectionBadge}>LIVE SIMULATOR</Text>
          <Text style={styles.sectionTitle}>Calculate Your Profit Potential</Text>
          
          <TiltCard style={styles.simulatorCard}>
            <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={[styles.simRow, isMobile && { flexDirection: 'column' }]}>
              <View style={styles.simInputGroup}>
                <Text style={styles.simLabel}>Select Crop</Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['Wheat', 'Rice', 'Cotton'].map(c => (
                    <TouchableOpacity key={c} style={[styles.simChip, simulatorCrop === c && styles.simChipActive]} onPress={() => setSimulatorCrop(c)}>
                      <Text style={[styles.simChipText, simulatorCrop === c && { color: '#00ff87' }]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.simInputGroup}>
                <Text style={styles.simLabel}>Land Size (Acres)</Text>
                <TextInput
                  style={styles.simInput}
                  value={simulatorAcres}
                  onChangeText={setSimulatorAcres}
                  keyboardType="numeric"
                  placeholderTextColor="#64748b"
                />
              </View>
            </View>
            
            <View style={styles.simResultBox}>
              <Text style={styles.simResultLabel}>Estimated Seasonal Profit with FarmsKing Intelligence</Text>
              <Text style={styles.simResultValue}>₹{simulatedProfit.toLocaleString('en-IN')}</Text>
            </View>
          </TiltCard>
        </View>

        {/* ── TIERED PRICING ── */}
        <View style={styles.section}>
          <Text style={styles.sectionBadge}>PRICING</Text>
          <Text style={styles.sectionTitle}>Simple Plans. Massive Value.</Text>
          
          <View style={[styles.pricingRow, isMobile && { flexDirection: 'column' }]}>
            {/* Free */}
            <TiltCard style={[styles.pricingCard, { borderColor: 'rgba(255,255,255,0.1)' }]}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={styles.pricingName}>Basic</Text>
              <Text style={styles.pricingPrice}>Free <Text style={styles.pricingInterval}>/forever</Text></Text>
              <View style={styles.pricingDivider} />
              <View style={styles.pricingList}>
                <Text style={styles.pricingItem}>✓ Live Mandi Prices</Text>
                <Text style={styles.pricingItem}>✓ Weather Alerts</Text>
                <Text style={styles.pricingItem}>✓ Community Access</Text>
              </View>
              <TouchableOpacity style={styles.pricingBtn}><Text style={styles.pricingBtnText}>Start Free</Text></TouchableOpacity>
            </TiltCard>

            {/* Pro */}
            <TiltCard style={[styles.pricingCard, styles.pricingCardPro]}>
              <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
              <LinearGradient colors={['rgba(0,255,135,0.1)', 'transparent']} style={StyleSheet.absoluteFill} />
              <View style={styles.proBadge}><Text style={styles.proBadgeText}>MOST POPULAR</Text></View>
              <Text style={[styles.pricingName, { color: '#00ff87' }]}>Pro</Text>
              <Text style={styles.pricingPrice}>₹499 <Text style={styles.pricingInterval}>/month</Text></Text>
              <View style={styles.pricingDivider} />
              <View style={styles.pricingList}>
                <Text style={styles.pricingItem}>✓ AI Disease Scanner (Unlimited)</Text>
                <Text style={styles.pricingItem}>✓ Satellite Farm Mapping</Text>
                <Text style={styles.pricingItem}>✓ priority 1-on-1 Expert Calls</Text>
                <Text style={styles.pricingItem}>✓ Custom Crop Calendar</Text>
              </View>
              <TouchableOpacity style={[styles.pricingBtn, { backgroundColor: '#00ff87', borderColor: '#00ff87' }]}>
                <Text style={[styles.pricingBtnText, { color: '#02120a' }]}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </TiltCard>

            {/* Enterprise */}
            <TiltCard style={[styles.pricingCard, { borderColor: 'rgba(251,191,36,0.3)' }]}>
              <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              <Text style={[styles.pricingName, { color: '#fbbf24' }]}>Enterprise</Text>
              <Text style={styles.pricingPrice}>Custom</Text>
              <View style={styles.pricingDivider} />
              <View style={styles.pricingList}>
                <Text style={styles.pricingItem}>✓ B2B API Access</Text>
                <Text style={styles.pricingItem}>✓ Multi-Farm Management</Text>
                <Text style={styles.pricingItem}>✓ Dedicated Account Manager</Text>
              </View>
              <TouchableOpacity style={[styles.pricingBtn, { borderColor: '#fbbf24' }]}><Text style={[styles.pricingBtnText, { color: '#fbbf24' }]}>Contact Sales</Text></TouchableOpacity>
            </TiltCard>
          </View>
        </View>

        {/* ── FOOTER ── */}
        <View style={styles.footer}>
          <Text style={styles.footerLogo}>FarmsKing.in</Text>
          <Text style={styles.footerText}>© 2026 FarmsKing. Bioluminescent AgriTech Ecosystem.</Text>
        </View>

      </ScrollView>

      {/* ── MOBILE BOTTOM NAV DOCK ── */}
      {isMobile && (
        <View style={styles.bottomDock}>
          <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
          <TouchableOpacity style={styles.dockBtn} onPress={() => router.push('/')}>
            <Ionicons name="home" size={24} color="#00ff87" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dockBtn} onPress={() => router.push('/market')}>
            <Ionicons name="bar-chart" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <View style={styles.dockCenterBtnWrap}>
            <LinearGradient colors={['#00ff87', '#10b981']} style={styles.dockCenterBtn}>
              <Ionicons name="scan" size={28} color="#02120a" />
            </LinearGradient>
          </View>
          <TouchableOpacity style={styles.dockBtn} onPress={() => router.push('/shop')}>
            <Ionicons name="cart" size={24} color="#94a3b8" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dockBtn} onPress={() => router.push('/(auth)/login')}>
            <Ionicons name="person" size={24} color="#94a3b8" />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating WhatsApp Action */}
      <TouchableOpacity style={styles.fabWhatsapp}>
        <LinearGradient colors={['#25D366', '#128C7E']} style={styles.fabInner}>
          <Ionicons name="logo-whatsapp" size={28} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#02120a' },
  orb: { position: 'absolute', borderRadius: 999, filter: 'blur(120px)', zIndex: 0 },
  stickyHeaderWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 },
  scrollContent: { paddingTop: 100, paddingBottom: 120 },
  
  // Hero
  heroRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: '5%', minHeight: 600, maxWidth: 1400, alignSelf: 'center', zIndex: 10 },
  heroRowMobile: { flexDirection: 'column', paddingTop: 40 },
  heroLeft: { flex: 7, paddingRight: 40, justifyContent: 'center' },
  heroRight: { flex: 5, height: 400, position: 'relative' },
  
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(0,255,135,0.1)', borderWidth: 1, borderColor: 'rgba(0,255,135,0.3)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 99, alignSelf: 'flex-start', marginBottom: 24 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#00ff87', shadowColor: '#00ff87', shadowOpacity: 1, shadowRadius: 6 },
  liveBadgeText: { color: '#00ff87', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 1 },
  
  heroTitle: { fontSize: 62, fontFamily: FONT.extraBold, color: '#ffffff', lineHeight: 70, marginBottom: 20 },
  textNeon: { color: '#00ff87', textShadowColor: '#00ff87', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  heroSubtitle: { fontSize: 16, fontFamily: FONT.medium, color: '#94a3b8', lineHeight: 26, marginBottom: 32, maxWidth: 540 },
  
  heroActions: { flexDirection: 'row', gap: 16, marginBottom: 40, flexWrap: 'wrap' },
  btnPrimary: { borderRadius: 99, overflow: 'hidden', ...premiumShadow('#00ff87', 'lg') },
  btnPrimaryGradient: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 32, paddingVertical: 16 },
  btnPrimaryText: { color: '#02120a', fontFamily: FONT.extraBold, fontSize: 16 },
  btnSecondary: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 99 },
  btnSecondaryText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 16 },
  
  trustMetrics: { flexDirection: 'row', alignItems: 'center', gap: 20 },
  metricItem: { alignItems: 'flex-start' },
  metricVal: { fontSize: 22, fontFamily: FONT.extraBold, color: '#ffffff' },
  metricLabel: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  metricDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },
  
  // Mockups
  mockupCard: { position: 'absolute', width: 280, backgroundColor: 'rgba(10,46,28,0.65)', borderRadius: 24, padding: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', overflow: 'hidden', ...premiumShadow('rgba(0,0,0,0.8)', 'xl') },
  mockupHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  mockupTitle: { color: '#e2e8f0', fontSize: 13, fontFamily: FONT.bold },
  mockupBody: { gap: 10 },
  mockupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 12 },
  mockupDot: { width: 10, height: 10, borderRadius: 5 },
  mockupText: { color: '#cbd5e1', fontSize: 12, fontFamily: FONT.medium },
  
  // Sections
  section: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: '5%', zIndex: 10 },
  sectionBadge: { color: '#2dd4bf', fontSize: 11, fontFamily: FONT.bold, letterSpacing: 2, marginBottom: 12 },
  sectionTitle: { fontSize: 36, fontFamily: FONT.extraBold, color: '#ffffff', textAlign: 'center', marginBottom: 40 },
  
  // Bento
  bentoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, maxWidth: 1200, width: '100%' },
  bentoCard: { backgroundColor: 'rgba(10,46,28,0.4)', borderRadius: 24, padding: 30, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', overflow: 'hidden', minWidth: 300 },
  bentoIconBox: { width: 48, height: 48, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  bentoTitle: { fontSize: 20, fontFamily: FONT.extraBold, color: '#ffffff', marginBottom: 8 },
  bentoDesc: { fontSize: 14, fontFamily: FONT.medium, color: '#94a3b8', lineHeight: 22 },
  
  // Simulator
  simulatorCard: { width: '100%', maxWidth: 800, backgroundColor: 'rgba(10,46,28,0.65)', borderRadius: 32, padding: 40, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  simRow: { flexDirection: 'row', gap: 40, marginBottom: 30 },
  simInputGroup: { flex: 1, gap: 12 },
  simLabel: { color: '#e2e8f0', fontSize: 14, fontFamily: FONT.bold },
  simChip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  simChipActive: { backgroundColor: 'rgba(0,255,135,0.1)', borderColor: '#00ff87' },
  simChipText: { color: '#94a3b8', fontFamily: FONT.bold, fontSize: 13 },
  simInput: { backgroundColor: 'rgba(0,0,0,0.3)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#fff', fontSize: 16, fontFamily: FONT.bold },
  simResultBox: { backgroundColor: 'rgba(0,255,135,0.1)', borderRadius: 20, padding: 24, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,255,135,0.3)' },
  simResultLabel: { color: '#10b981', fontSize: 13, fontFamily: FONT.bold, marginBottom: 8 },
  simResultValue: { color: '#00ff87', fontSize: 42, fontFamily: FONT.extraBold, textShadowColor: '#00ff87', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },

  // Pricing
  pricingRow: { flexDirection: 'row', gap: 24, maxWidth: 1200, width: '100%', justifyContent: 'center' },
  pricingCard: { flex: 1, minWidth: 280, backgroundColor: 'rgba(10,46,28,0.4)', borderRadius: 32, padding: 32, borderWidth: 1, overflow: 'hidden' },
  pricingCardPro: { borderColor: '#00ff87', transform: [{ scale: 1.05 }], zIndex: 10, ...premiumShadow('#00ff87', 'xl') },
  proBadge: { position: 'absolute', top: 0, right: 0, backgroundColor: '#00ff87', paddingHorizontal: 12, paddingVertical: 6, borderBottomLeftRadius: 16 },
  proBadgeText: { color: '#02120a', fontSize: 10, fontFamily: FONT.extraBold, letterSpacing: 1 },
  pricingName: { fontSize: 22, fontFamily: FONT.extraBold, color: '#ffffff', marginBottom: 12 },
  pricingPrice: { fontSize: 40, fontFamily: FONT.extraBold, color: '#ffffff' },
  pricingInterval: { fontSize: 14, color: '#64748b' },
  pricingDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 24 },
  pricingList: { gap: 16, marginBottom: 32 },
  pricingItem: { color: '#cbd5e1', fontSize: 14, fontFamily: FONT.medium },
  pricingBtn: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', paddingVertical: 14, borderRadius: 99, alignItems: 'center' },
  pricingBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 15 },

  // Footer
  footer: { alignItems: 'center', paddingVertical: 60, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)', marginTop: 40 },
  footerLogo: { fontSize: 24, fontFamily: FONT.extraBold, color: '#ffffff', marginBottom: 10 },
  footerText: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium },

  // Mobile Nav Dock
  bottomDock: { position: 'absolute', bottom: 20, left: 20, right: 20, height: 70, backgroundColor: 'rgba(10,46,28,0.7)', borderRadius: 35, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  dockBtn: { padding: 10 },
  dockCenterBtnWrap: { marginTop: -35 },
  dockCenterBtn: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', ...premiumShadow('#00ff87', 'lg'), borderWidth: 4, borderColor: '#02120a' },
  
  // WhatsApp FAB
  fabWhatsapp: { position: 'absolute', bottom: Platform.OS === 'web' ? 40 : 110, right: 20, zIndex: 999 },
  fabInner: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', ...premiumShadow('#25D366', 'lg') },
});
`;

fs.writeFileSync('d:/FarmsKing/frontend/app/index.tsx', content, 'utf8');
console.log('Homepage redesign injected successfully!');
