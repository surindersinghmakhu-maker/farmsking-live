import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, Animated, Easing } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

export function SplashView() {
  const progressAnim = useRef(new Animated.Value(0.12)).current;
  const logoScale = useRef(new Animated.Value(0.92)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 90,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 560,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [logoOpacity, logoScale, progressAnim]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['12%', '100%'],
  });

  return (
    <LinearGradient
      colors={['#022c22', '#064e3b', '#047857']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Brand Logo & Favicon Cluster */}
      <Animated.View
        style={[
          styles.logoCluster,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <View style={[styles.logoCard, premiumShadow('#000000', 'lg')]}>
          <Image
            source={require('@/assets/images/farmsking_logo_round_goldring.png')}
            style={styles.brandLogoImg}
            resizeMode="contain"
          />
          {/* Official Favicon Micro-Emblem Badge */}
          <View style={styles.faviconBadge}>
            <Image
              source={require('@/assets/images/favicon.png')}
              style={styles.faviconImg}
              resizeMode="contain"
            />
          </View>
        </View>
      </Animated.View>

      {/* Brand Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>FarmsKing</Text>
      </View>

      {/* Official Slogan & Tagline */}
      <Text style={styles.tagline}>Farming Easy, Farming Smart</Text>

      {/* Sub-Pill */}
      <View style={styles.subPill}>
        <Text style={styles.subPillText}>🌾 India’s Intelligent Agriculture Platform</Text>
      </View>

      {/* Luxury Loading Indicator */}
      <View style={styles.loadingWrap}>
        <View style={styles.loadingTrack}>
          <Animated.View style={[styles.loadingFill, { width: progressWidth }]} />
        </View>
        <Text style={styles.loadingText}>Initializing Safe Agriculture OS…</Text>
        <Text style={styles.securitySub}>🔒 100% Verified Inputs • AI Crop Doctor • Live Mandi</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#022c22',
  },
  logoCluster: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoCard: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#facc15',
    position: 'relative',
  },
  brandLogoImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  faviconBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#047857',
    ...premiumShadow('#000000', 'sm'),
  },
  faviconImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#ffffff',
    fontSize: 34,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.5,
  },
  tagline: {
    color: '#fef08a',
    fontSize: 15,
    fontFamily: FONT.bold,
    marginTop: 6,
    letterSpacing: 0.3,
  },
  subPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    marginTop: 10,
  },
  subPillText: {
    color: '#d1fae5',
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  loadingWrap: {
    position: 'absolute',
    bottom: 54,
    alignItems: 'center',
    width: '80%',
    maxWidth: 340,
    gap: 6,
  },
  loadingTrack: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#facc15',
  },
  loadingText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontFamily: FONT.bold,
    marginTop: 4,
  },
  securitySub: {
    color: 'rgba(209, 250, 229, 0.8)',
    fontSize: 10.5,
    fontFamily: FONT.medium,
  },
});
