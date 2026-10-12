import React, { useRef, useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { RADIUS, THEME_4D } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

interface GlassCard4DProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  active?: boolean;
  glowColor?: string;
  intensity?: 'low' | 'medium' | 'high';
  tiltMaxAngle?: number;
  interactive?: boolean;
  variant?: 'glass' | 'accent' | 'cyber';
  accessibilityLabel?: string;
}

export const GlassCard4D: React.FC<GlassCard4DProps> = ({
  children,
  style,
  onPress,
  active = false,
  glowColor,
  intensity = 'medium',
  tiltMaxAngle = 8,
  interactive = true,
  variant = 'glass',
  accessibilityLabel,
}) => {
  const cardRef = useRef<any>(null);
  const { themeMode } = useExecutiveTheme();
  const isLight = themeMode === 'LIGHT';
  const isDark = themeMode === 'DARK';

  const resolvedGlowColor = glowColor || (isLight ? '#16a34a' : isDark ? '#38bdf8' : '#22c55e');

  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
  const [lightPos, setLightPos] = useState({ x: 50, y: 50 });
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      setReducedMotion(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
      mediaQuery.addEventListener?.('change', listener);
      return () => mediaQuery.removeEventListener?.('change', listener);
    }
  }, []);

  const handlePointerMove = (e: any) => {
    if (Platform.OS !== 'web' || reducedMotion || !interactive) return;
    const rect = e.currentTarget?.getBoundingClientRect?.();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const percentX = (mouseX / rect.width) * 100;
    const percentY = (mouseY / rect.height) * 100;

    const rotateY = ((mouseX - centerX) / centerX) * tiltMaxAngle;
    const rotateX = -((mouseY - centerY) / centerY) * tiltMaxAngle;

    setTilt({ rotateX, rotateY });
    setLightPos({ x: percentX, y: percentY });
  };

  const handlePointerEnter = () => {
    setIsHovered(true);
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    setTilt({ rotateX: 0, rotateY: 0 });
  };

  const isWeb = Platform.OS === 'web';

  const webDynamicStyle = isWeb
    ? {
        transform: reducedMotion
          ? isHovered
            ? 'scale(1.015)'
            : 'none'
          : `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${
              isHovered ? 'scale3d(1.02, 1.02, 1.02) translateZ(10px)' : 'none'
            }`,
        transition: isHovered
          ? 'transform 0.12s cubic-bezier(0.2, 0, 0.1, 1), box-shadow 0.25s ease, border-color 0.25s ease'
          : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.35s ease',
        boxShadow: isLight
          ? active
            ? '0 0 20px rgba(22, 163, 74, 0.25), 0 8px 24px rgba(0, 0, 0, 0.06)'
            : isHovered
            ? '0 12px 32px rgba(0, 0, 0, 0.08), 0 0 16px rgba(234, 179, 8, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9)'
            : '0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.02)'
          : isDark
          ? active
            ? `0 0 24px ${resolvedGlowColor}50, 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 12px ${resolvedGlowColor}25`
            : isHovered
            ? `0 12px 36px rgba(0, 0, 0, 0.7), 0 0 18px ${resolvedGlowColor}35, inset 0 1px 0 rgba(255, 255, 255, 0.12)`
            : '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)'
          : active
          ? '0 0 24px rgba(251, 191, 36, 0.45), 0 8px 32px rgba(0, 0, 0, 0.65), inset 0 0 14px rgba(34, 197, 94, 0.25)'
          : isHovered
          ? '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 22px rgba(34, 197, 94, 0.4), 0 0 10px rgba(251, 191, 36, 0.25), inset 0 1px 0 rgba(251, 191, 36, 0.4)'
          : '0 4px 20px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(251, 191, 36, 0.18)',
        backdropFilter: 'blur(24px) saturate(160%)',
        WebkitBackdropFilter: 'blur(24px) saturate(160%)',
        cursor: onPress ? 'pointer' : 'default',
      }
    : {};

  const backgroundStyle = isLight
    ? { backgroundColor: 'rgba(255, 255, 255, 0.95)' }
    : isDark
    ? { backgroundColor: 'rgba(11, 19, 41, 0.88)' }
    : variant === 'accent'
    ? { backgroundColor: 'rgba(8, 36, 38, 0.90)' }
    : variant === 'cyber'
    ? { backgroundColor: 'rgba(4, 22, 26, 0.92)' }
    : { backgroundColor: 'rgba(6, 26, 30, 0.82)' }; // Shaded Parrot & Gold glass card

  const borderStyle = isLight
    ? active
      ? { borderColor: '#16a34a' }
      : isHovered
      ? { borderColor: 'rgba(234, 179, 8, 0.6)' }
      : { borderColor: 'rgba(22, 163, 74, 0.20)' }
    : isDark
    ? active
      ? { borderColor: '#38bdf8' }
      : isHovered
      ? { borderColor: 'rgba(56, 189, 248, 0.65)' }
      : { borderColor: 'rgba(56, 189, 248, 0.22)' }
    : active
    ? { borderColor: '#fbbf24' } // Radiant Gold active
    : isHovered
    ? { borderColor: 'rgba(34, 197, 94, 0.85)' } // Glowing Parrot Green hover
    : { borderColor: 'rgba(34, 197, 94, 0.30)' };

  return (
    <Pressable
      ref={cardRef}
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      accessibilityLabel={accessibilityLabel}
      style={[
        styles.cardContainer,
        backgroundStyle,
        borderStyle,
        webDynamicStyle as any,
        isPressed && { transform: [{ scale: 0.98 }] },
        style,
      ]}
      {...(isWeb
        ? ({
            onPointerMove: handlePointerMove,
            onPointerEnter: handlePointerEnter,
            onPointerLeave: handlePointerLeave,
          } as any)
        : {})}
    >
      {/* Specular Light Reflection Follower on Web */}
      {isWeb && isHovered && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: RADIUS.lg,
            pointerEvents: 'none',
            zIndex: 1,
            backgroundImage: isLight
              ? `radial-gradient(circle 180px at ${lightPos.x}% ${lightPos.y}%, rgba(234, 179, 8, 0.15), transparent 75%)`
              : `radial-gradient(circle 180px at ${lightPos.x}% ${lightPos.y}%, ${resolvedGlowColor}20, transparent 75%)`,
          }}
        />
      )}

      {/* Luminous Top Neon Shimmer Line */}
      <View
        style={[
          styles.shimmerLine,
          {
            backgroundColor:
              isLight
                ? isHovered || active
                  ? '#eab308'
                  : 'rgba(22, 163, 74, 0.2)'
                : isHovered || active
                ? resolvedGlowColor
                : 'rgba(255, 255, 255, 0.08)',
            opacity: isHovered || active ? 0.9 : 0.4,
          },
        ]}
      />

      {children}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  specularLight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as any,
    zIndex: 1,
  },
  shimmerLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1.2,
    zIndex: 2,
    pointerEvents: 'none' as any,
  },
});
