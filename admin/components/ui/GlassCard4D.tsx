import React, { useRef, useState, useEffect } from 'react';
import { View, Pressable, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';
import { RADIUS, THEME_4D } from '@/constants/theme';

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
  glowColor = THEME_4D.neonEmerald,
  intensity = 'medium',
  tiltMaxAngle = 8,
  interactive = true,
  variant = 'glass',
  accessibilityLabel,
}) => {
  const cardRef = useRef<any>(null);
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
        : `perspective(900px) rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) ${isHovered ? 'scale3d(1.02, 1.02, 1.02) translateZ(10px)' : 'none'
        }`,
      transition: isHovered
        ? 'transform 0.12s cubic-bezier(0.2, 0, 0.1, 1), box-shadow 0.25s ease, border-color 0.25s ease'
        : 'transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.35s ease, border-color 0.35s ease',
      boxShadow: active
        ? `0 0 24px ${glowColor}50, 0 8px 32px rgba(0, 0, 0, 0.6), inset 0 0 12px ${glowColor}25`
        : isHovered
          ? `0 12px 36px rgba(0, 0, 0, 0.7), 0 0 18px ${glowColor}35, inset 0 1px 0 rgba(255, 255, 255, 0.12)`
          : '0 4px 20px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
      backdropFilter: 'blur(24px) saturate(160%)',
      WebkitBackdropFilter: 'blur(24px) saturate(160%)',
      cursor: onPress ? 'pointer' : 'default',
    }
    : {};

  const backgroundStyle =
    variant === 'accent'
      ? { backgroundColor: 'rgba(8, 38, 22, 0.85)' }
      : variant === 'cyber'
        ? { backgroundColor: 'rgba(5, 18, 12, 0.9)' }
        : { backgroundColor: THEME_4D.bgCardGlass };

  const borderStyle = active
    ? { borderColor: glowColor }
    : isHovered
      ? { borderColor: THEME_4D.borderGlassHover }
      : { borderColor: THEME_4D.borderGlass };

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
            backgroundImage: `radial-gradient(circle 180px at ${lightPos.x}% ${lightPos.y}%, ${glowColor}20, transparent 75%)`,
          }}
        />
      )}

      {/* Luminous Top Neon Shimmer Line */}
      <View
        style={[
          styles.shimmerLine,
          {
            backgroundColor: isHovered || active ? glowColor : 'rgba(255, 255, 255, 0.08)',
            opacity: isHovered || active ? 0.8 : 0.35,
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
