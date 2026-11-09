import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

export function AnimatedPurpleBottomBar({ state, descriptors, navigation, onTabPressTrigger }: any) {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768 && (Platform.OS !== 'web' || (typeof window !== 'undefined' && window.innerWidth >= 768));
  const { themeMode, colors } = useExecutiveTheme();
  const isLight = themeMode === 'LIGHT';
  const isDark = themeMode === 'DARK';
  const pathname = usePathname();

  // Filter only visible routes (Expo Router uses options.href === null to hide screens)
  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    const opt = options as any;
    if (opt.href === null) return false;
    if (opt.tabBarItemStyle?.display === 'none') return false;
    return true;
  });

  const getActiveTabKey = (): string => {
    const currentRoute = state.routes[state.index];
    if (currentRoute && visibleRoutes.some((r: any) => r.name === currentRoute.name)) {
      return currentRoute.name;
    }

    const segments = (pathname || '').replace(/^\/+|\/+$/g, '').split('/');
    const matched = visibleRoutes.find((r: any) => {
      if (r.name === 'index') return false;
      return (
        segments.includes(r.name) ||
        pathname === `/${r.name}` ||
        pathname.startsWith(`/${r.name}/`)
      );
    });

    return matched ? matched.name : (visibleRoutes[0]?.name || 'index');
  };

  const activeTabKey = getActiveTabKey();

  const tabLayouts = useRef<{ [key: string]: { x: number; width: number } }>({});
  const slideAnim = useRef(new Animated.Value(0)).current;
  const widthAnim = useRef(new Animated.Value(0)).current;
  const pillOpacity = useRef(new Animated.Value(0)).current;

  const animatePillToKey = (key: string, immediate = false) => {
    const layout = tabLayouts.current[key];
    if (layout && layout.width > 0) {
      const targetX = layout.x + 3;
      const targetW = layout.width - 6;
      if (immediate) {
        slideAnim.setValue(targetX);
        widthAnim.setValue(targetW);
        pillOpacity.setValue(1);
      } else {
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: targetX,
            tension: 80,
            friction: 9,
            useNativeDriver: false,
          }),
          Animated.spring(widthAnim, {
            toValue: targetW,
            tension: 80,
            friction: 9,
            useNativeDriver: false,
          }),
          Animated.timing(pillOpacity, {
            toValue: 1,
            duration: 120,
            useNativeDriver: false,
          }),
        ]).start();
      }
    }
  };

  useEffect(() => {
    animatePillToKey(activeTabKey, false);
  }, [activeTabKey]);

  // Don't render bottom tab bar on desktop where the sidebar or top nav is used
  if (isDesktop) return null;
  if (visibleRoutes.length === 0) return null;

  const indicatorGradientColors: [string, string, string] = isLight
    ? ['rgba(22, 163, 74, 0.16)', 'rgba(234, 179, 8, 0.14)', 'rgba(22, 163, 74, 0.06)']
    : isDark
    ? ['rgba(56, 189, 248, 0.25)', 'rgba(129, 140, 248, 0.18)', 'rgba(56, 189, 248, 0.10)']
    : ['rgba(34, 197, 94, 0.28)', 'rgba(251, 191, 36, 0.22)', 'rgba(34, 197, 94, 0.08)'];

  const indicatorTopGlowColors: [string, string, string] = isLight
    ? ['#16a34a', '#eab308', '#22c55e']
    : isDark
    ? ['#38bdf8', '#818cf8', '#00f2fe']
    : ['#22c55e', '#fbbf24', '#10e060'];

  return (
    <View style={styles.barOuterWrapper}>
      <View
        style={[
          styles.barContainer as any,
          isLight && {
            backgroundColor: 'rgba(255, 255, 255, 0.96)',
            borderTopColor: 'rgba(22, 163, 74, 0.22)',
            borderLeftColor: 'rgba(234, 179, 8, 0.25)',
            borderRightColor: 'rgba(22, 163, 74, 0.20)',
            shadowColor: '#16a34a',
          },
          isDark && {
            backgroundColor: 'rgba(2, 6, 23, 0.96)',
            borderTopColor: 'rgba(56, 189, 248, 0.25)',
            borderLeftColor: 'rgba(129, 140, 248, 0.22)',
            borderRightColor: 'rgba(56, 189, 248, 0.22)',
            shadowColor: '#38bdf8',
          },
        ] as any}
      >
        {/* Continuous Smooth-Moving Active Highlight / Pill Indicator */}
        <Animated.View
          style={[
            styles.activeIndicator as any,
            {
              left: slideAnim,
              width: widthAnim,
              opacity: pillOpacity,
            },
            isLight && {
              borderColor: 'rgba(234, 179, 8, 0.45)',
              shadowColor: '#f59e0b',
            },
            isDark && {
              borderColor: 'rgba(56, 189, 248, 0.45)',
              shadowColor: '#38bdf8',
            },
            !isLight && !isDark && {
              borderColor: 'rgba(251, 191, 36, 0.55)',
              shadowColor: '#22c55e',
            },
          ] as any}
          pointerEvents="none"
        >
          {/* Ambient Glass Glow */}
          <LinearGradient
            colors={indicatorGradientColors}
            style={styles.indicatorGradient as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Top Glowing Laser Accent Bar */}
          <LinearGradient
            colors={indicatorTopGlowColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorTopGlow as any}
          />
        </Animated.View>

        {/* Tab Items */}
        {visibleRoutes.map((route: any) => {
          const isFocused = route.name === activeTabKey;
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const onPress = () => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
            onTabPressTrigger?.();
            animatePillToKey(route.name, false);
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const handleTabLayout = (e: LayoutChangeEvent) => {
            const { x, width } = e.nativeEvent.layout;
            if (width > 0) {
              tabLayouts.current[route.name] = { x, width };
              if (route.name === activeTabKey) {
                animatePillToKey(route.name, true);
              }
            }
          };

          return (
            <TabItemButton
              key={route.key}
              isFocused={isFocused}
              options={options}
              label={typeof label === 'string' ? label : route.name}
              onPress={onPress}
              onLayout={handleTabLayout}
              isLight={isLight}
              isDark={isDark}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItemButton({
  isFocused,
  options,
  label,
  onPress,
  onLayout,
  isLight,
  isDark,
}: {
  isFocused: boolean;
  options: any;
  label: string;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
  isLight: boolean;
  isDark: boolean;
}) {
  const animValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isFocused ? 1 : 0,
      tension: 65,
      friction: 9,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const iconScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.15],
  });

  const labelScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  const labelOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.75, 1],
  });

  const activeColor = isLight ? '#15803d' : isDark ? '#38bdf8' : '#22c55e';
  const inactiveColor = isLight ? '#64748b' : isDark ? '#64748b' : '#6b7280';

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.tabItem,
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
    >
      {/* Icon with smooth scale */}
      <Animated.View
        style={{
          transform: [{ scale: iconScale }],
        }}
      >
        {options.tabBarIcon ? (
          options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? activeColor : inactiveColor,
            size: 22,
          })
        ) : null}
      </Animated.View>

      {/* Label with smooth scale & opacity */}
      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? activeColor : inactiveColor,
            opacity: labelOpacity,
            transform: [{ scale: labelScale }],
            fontFamily: isFocused ? FONT.extraBold : FONT.semiBold,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  barOuterWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  barContainer: {
    flexDirection: 'row',
    height: 60,
    maxWidth: 540,
    width: '100%',
    backgroundColor: 'rgba(2, 13, 6, 0.96)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 255, 135, 0.28)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: 'rgba(124, 58, 237, 0.22)',
    borderRightColor: 'rgba(0, 255, 135, 0.22)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingTop: 4,
    paddingBottom: 6,
    paddingHorizontal: 6,
    position: 'relative',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
    zIndex: 1,
  },
  indicatorGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  indicatorTopGlow: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 2.5,
    borderRadius: 2,
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 2,
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
