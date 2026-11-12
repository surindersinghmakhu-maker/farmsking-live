import React from 'react';
import { View, Text, StyleSheet, Image, Platform } from 'react-native';
import { FONT, RADIUS } from '@/constants/theme';

export function SplashView() {
  const imgSrc = Platform.OS === 'web' ? { uri: '/favicon.png?v=7' } : require('@/assets/images/favicon.png');

  return (
    <View style={styles.container}>
      <Image
        source={imgSrc}
        style={[
          styles.faviconImg,
          Platform.OS === 'web'
            ? ({
                filter: 'drop-shadow(0 4px 20px rgba(16, 185, 129, 0.45))',
              } as any)
            : {},
        ]}
        resizeMode="contain"
      />

      {/* Slogan requested: Smart Farming */}
      <Text style={styles.tagline}>Smart Farming</Text>

      {/* Sub-Pill: India's Intelligent Agriculture Platform */}
      <View style={styles.subPill}>
        <Text style={styles.subPillText}>🌾 India’s Intelligent Agriculture Platform</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#022c22',
    padding: 20,
  },
  faviconImg: {
    width: 72,
    height: 72,
    borderRadius: 18,
    marginBottom: 16,
  },
  tagline: {
    color: '#fef08a',
    fontSize: 16,
    fontFamily: FONT.bold,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  subPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  subPillText: {
    color: '#d1fae5',
    fontSize: 12.5,
    fontFamily: FONT.semiBold,
  },
});
