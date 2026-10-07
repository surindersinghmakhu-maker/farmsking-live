import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Image, Platform, useWindowDimensions, Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
  withSequence, withRepeat, withTiming, withDelay,
} from 'react-native-reanimated';
import { FONT, premiumShadow } from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';

// ─── Floating animated 3D Admin Asset ─────────────────────────────────────────
function Animated3DAsset({ imgSrc, style }: { imgSrc: any; style?: any }) {
  const translateY = useSharedValue(0);
  const rotation  = useSharedValue(0);
  const scale     = useSharedValue(1);

  useEffect(() => {
    const dur = 3000;
    translateY.value = withRepeat(withSequence(withTiming(-12, { duration: dur }), withTiming(0, { duration: dur })), -1, true);
    rotation.value   = withRepeat(withSequence(withTiming(2, { duration: dur }), withTiming(-2, { duration: dur })), -1, true);
  }, []);

  const anim = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { rotate: `${rotation.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[style, anim]}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(1.05, { damping: 10 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10 }); }}
        onHoverIn={() => { scale.value = withSpring(1.05, { damping: 10 }); }}
        onHoverOut={() => { scale.value = withSpring(1, { damping: 10 }); }}
      >
        <Image source={imgSrc} style={styles.admin3dAsset} resizeMode="contain" />
      </Pressable>
    </Animated.View>
  );
}

// ─── Admin Landing Page ───────────────────────────────────────────────────────
export default function AdminLandingPage() {
  const router    = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={styles.container}>
      {/* Background */}
      <Image
        source={require('@/assets/images/farmsking_hero_bg_new.png')}
        style={[StyleSheet.absoluteFill, { width: '100%', height: '100%' }]}
        resizeMode="cover"
      />
      <LinearGradient
        colors={['rgba(4,15,28,0.75)', 'rgba(4,15,28,0.95)', '#040f1c']}
        style={StyleSheet.absoluteFill}
      />

      {/* Floating glowing orbs */}
      {Platform.OS === 'web' && (
        <>
          <View style={[styles.orb, { top: 40, left: '5%', width: 400, height: 400, backgroundColor: 'rgba(16,185,129,0.15)' }]} />
          <View style={[styles.orb, { bottom: 40, right: '5%', width: 350, height: 350, backgroundColor: 'rgba(14,165,233,0.15)' }]} />
        </>
      )}

      {/* Main Content */}
      <View style={[styles.contentRow, !isDesktop && styles.contentCol]}>
        
        {/* Left Side: Text & Actions */}
        <View style={styles.leftCol}>
          <View style={styles.heroBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#10b981" />
            <Text style={styles.heroBadgeText}> SECURE ADMIN ENVIRONMENT</Text>
          </View>
          
          <Text style={[styles.heroTitle, !isDesktop && styles.heroTitleMobile]}>
            FarmsKing <Text style={{ color: '#10b981' }}>Command</Text>{'\n'}Center
          </Text>
          
          <Text style={[styles.heroSubtitle, !isDesktop && styles.heroSubtitleMobile]}>
            Advanced platform management, real-time analytics, and operational control for Super Admins & Managers.
          </Text>

          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => router.push('/(auth)/login')}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#10b981', '#059669']} style={styles.ctaGradient} start={{x: 0, y: 0}} end={{x: 1, y: 0}}>
              <Ionicons name="lock-closed" size={18} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Authenticate & Enter</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.securityNoteRow}>
            <Ionicons name="finger-print" size={18} color="#64748b" />
            <Text style={styles.securityNote}>Authorized personnel only. All access is logged.</Text>
          </View>
        </View>

        {/* Right Side: 3D Illustration & Glass Panel */}
        <View style={styles.rightCol}>
          <Animated3DAsset 
            imgSrc={require('@/assets/images/admin_3d.png')} 
            style={styles.illustrationWrap}
          />
          
          <View style={[styles.glassInfoPanel, premiumShadow('rgba(0,0,0,0.5)', 'xl')]}>
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.infoRow}>
              <View style={styles.infoIconBox}><Ionicons name="analytics" size={24} color="#3b82f6" /></View>
              <View>
                <Text style={styles.infoTitle}>Live Metrics</Text>
                <Text style={styles.infoDesc}>Monitor platform health & sales</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <View style={[styles.infoIconBox, { backgroundColor: 'rgba(245,158,11,0.15)' }]}><Ionicons name="people" size={24} color="#f59e0b" /></View>
              <View>
                <Text style={styles.infoTitle}>User Management</Text>
                <Text style={styles.infoDesc}>Control roles and permissions</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#040f1c', justifyContent: 'center' },
  orb: {
    position: 'absolute',
    borderRadius: 999,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(100px)' } as any) : {}),
    zIndex: 0,
  },
  
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 60,
    paddingHorizontal: 40,
    maxWidth: 1300,
    alignSelf: 'center',
    zIndex: 10,
  },
  contentCol: {
    flexDirection: 'column-reverse',
    paddingHorizontal: 20,
    paddingVertical: 60,
    gap: 40,
  },
  
  leftCol: {
    flex: 1,
    maxWidth: 500,
    alignItems: 'flex-start',
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.3)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 99,
    marginBottom: 24,
  },
  heroBadgeText: { color: '#10b981', fontFamily: FONT.bold, fontSize: 12, letterSpacing: 1 },
  heroTitle: {
    fontSize: 52,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    lineHeight: 60,
    marginBottom: 20,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  heroTitleMobile: { fontSize: 40, lineHeight: 48 },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    lineHeight: 26,
    marginBottom: 40,
  },
  heroSubtitleMobile: { fontSize: 15 },
  
  ctaPrimary: {
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 24,
    ...premiumShadow('#10b981', 'lg'),
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 36,
    paddingVertical: 18,
  },
  ctaPrimaryText: { color: '#fff', fontFamily: FONT.bold, fontSize: 16, letterSpacing: 0.5 },
  
  securityNoteRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  securityNote: { color: '#64748b', fontSize: 12, fontFamily: FONT.medium },

  rightCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 400,
  },
  illustrationWrap: {
    zIndex: 2,
    marginBottom: -40,
  },
  admin3dAsset: {
    width: 380,
    height: 380,
    ...(Platform.OS === 'web' ? ({ filter: 'drop-shadow(0px 20px 30px rgba(0,0,0,0.5))' } as any) : {}),
  },
  
  glassInfoPanel: {
    backgroundColor: 'rgba(16,25,40,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 24,
    width: 320,
    overflow: 'hidden',
    zIndex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  infoIconBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(59,130,246,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTitle: { color: '#f8fafc', fontSize: 15, fontFamily: FONT.bold, marginBottom: 2 },
  infoDesc: { color: '#94a3b8', fontSize: 12, fontFamily: FONT.medium },
});
