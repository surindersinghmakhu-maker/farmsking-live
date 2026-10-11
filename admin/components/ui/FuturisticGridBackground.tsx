import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { THEME_4D } from '@/constants/theme';

interface Props {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export const FuturisticGridBackground: React.FC<Props> = ({ children, style }) => {
  return (
    <View style={[styles.container, style]}>
      {/* Deep Forest Radial Aura Gradients */}
      <View style={styles.ambientGlowTop} />
      <View style={styles.ambientGlowCenter} />
      <View style={styles.ambientGlowRight} />

      {/* Cyber Mesh Grid Overlay */}
      {Platform.OS === 'web' && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(0, 255, 135, 0.03) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 135, 0.03) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            backgroundPosition: '-1px -1px',
            pointerEvents: 'none',
            zIndex: 2,
            opacity: 0.85,
          }}
        />
      )}

      {/* Main Content Layer */}
      <View style={styles.contentLayer}>{children}</View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME_4D.bgAbyss,
    position: 'relative',
    overflow: 'hidden',
  },
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
  ambientGlowTop: {
    position: 'absolute',
    top: -120,
    left: '20%',
    width: 600,
    height: 380,
    borderRadius: 300,
    backgroundColor: 'rgba(0, 255, 135, 0.05)',
    ...(Platform.OS === 'web'
      ? {
        filter: 'blur(90px)',
        pointerEvents: 'none' as any,
      }
      : {}),
    zIndex: 1,
  },
  ambientGlowCenter: {
    position: 'absolute',
    top: '35%',
    left: '50%',
    transform: [{ translateX: -300 }],
    width: 600,
    height: 500,
    borderRadius: 300,
    backgroundColor: 'rgba(5, 46, 25, 0.45)',
    ...(Platform.OS === 'web'
      ? {
        filter: 'blur(120px)',
        pointerEvents: 'none' as any,
      }
      : {}),
    zIndex: 1,
  },
  ambientGlowRight: {
    position: 'absolute',
    bottom: '10%',
    right: -100,
    width: 500,
    height: 400,
    borderRadius: 250,
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
    ...(Platform.OS === 'web'
      ? {
        filter: 'blur(100px)',
        pointerEvents: 'none' as any,
      }
      : {}),
    zIndex: 1,
  },
});
