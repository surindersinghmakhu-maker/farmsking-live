import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

export function SplashView() {
  return (
    <LinearGradient
      colors={['#022c22', '#0f172a', '#064e3b']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Brand Logo & Favicon Cluster */}
      <View style={styles.logoCluster}>
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
      </View>

      {/* Brand Title */}
      <View style={styles.titleRow}>
        <Text style={styles.title}>FarmsKing</Text>
      </View>

      {/* Admin Executive Tagline */}
      <Text style={styles.tagline}>Executive Command &amp; Operations Portal</Text>

      {/* Security Sub-Pill */}
      <View style={styles.subPill}>
        <Text style={styles.subPillText}>🛡️ Encrypted Enterprise Access • Multi-Role Security</Text>
      </View>

      {/* Luxury Loading Indicator */}
      <View style={styles.loadingWrap}>
        <View style={styles.loadingTrack}>
          <View style={styles.loadingFill} />
        </View>
        <Text style={styles.loadingText}>Authenticating Executive Console…</Text>
        <Text style={styles.securitySub}>FarmsKing Technologies Private Limited</Text>
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
    width: '70%',
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
