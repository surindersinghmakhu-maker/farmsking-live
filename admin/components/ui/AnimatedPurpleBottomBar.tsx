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
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

export function AnimatedPurpleBottomBar({ state, descriptors, navigation }: any) {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;
  const { themeMode, colors } = useExecutiveTheme();
  const isLight = themeMode === 'LIGHT';
  const isDark = themeMode === 'DARK';

  // Filter only visible routes (Expo Router uses options.href === null to hide screens)
  const visibleRoutes = state.routes.filter((route: any) => {
    const { options } = descriptors[route.key];
    const opt = options as any;
    if (opt.href === null) return false;
    if (opt.tabBarItemStyle?.display === 'none') return false;
    return true;
  });

  const activeVisibleIndex = Math.max(
    0,
    visibleRoutes.findIndex((r: any) => r.key === state.routes[state.index]?.key)
  );

  const [containerWidth, setContainerWidth] = useState(0);
  const slideAnim = useRef(new Animated.Value(activeVisibleIndex)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeVisibleIndex,
      tension: 68,
      friction: 10,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [activeVisibleIndex]);

  // Don't render bottom tab bar on desktop where the sidebar or top nav is used
  if (isDesktop) return null;
  if (visibleRoutes.length === 0) return null;

  const totalTabs = visibleRoutes.length;
  const tabItemWidth = containerWidth > 0 ? containerWidth / totalTabs : 0;
  const pillPadding = 6;
  const pillWidth = Math.max(0, tabItemWidth - pillPadding * 2);

  const indicatorTranslateX = slideAnim.interpolate({
    inputRange: visibleRoutes.map((_: any, i: number) => i),
    outputRange: visibleRoutes.map((_: any, i: number) => i * tabItemWidth + pillPadding),
    extrapolate: 'clamp',
  });

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && w !== containerWidth) {
      setContainerWidth(w);
    }
  };

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
          styles.barContainer,
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
        ]}
        onLayout={handleContainerLayout}
      >
        {/* Continuous Smooth-Moving Active Highlight / Pill Indicator */}
        {tabItemWidth > 0 && (
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                width: pillWidth,
                transform: [{ translateX: indicatorTranslateX }],
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
            ]}
            pointerEvents="none"
          >
            {/* Ambient Glass Glow */}
            <LinearGradient
              colors={indicatorGradientColors}
              style={styles.indicatorGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            {/* Top Glowing Laser Accent Bar */}
            <LinearGradient
              colors={indicatorTopGlowColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.indicatorTopGlow,
                isLight && { shadowColor: '#16a34a' },
                isDark && { shadowColor: '#38bdf8' },
                !isLight && !isDark && { shadowColor: '#22c55e' },
              ]}
            />
          </Animated.View>
        )}

        {/* Tab Items */}
        {visibleRoutes.map((route: any, index: number) => {
          const isFocused = index === activeVisibleIndex;
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
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TabItemButton
              key={route.key}
              isFocused={isFocused}
              options={options}
              label={typeof label === 'string' ? label : route.name}
              onPress={onPress}
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
  isLight,
  isDark,
}: {
  isFocused: boolean;
  options: any;
  label: string;
  onPress: () => void;
  isLight: boolean;
  isDark: boolean;
}) {
  const animValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isFocused ? 1 : 0,
      tension: 65,
      friction: 9,
      useNativeDriver: Platform.OS !== 'web',
    }).start();
  }, [isFocused]);

  const iconScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.15],
  });

  const iconTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -1.5],
  });

  const labelScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1.02],
  });

  const labelOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.65, 1.0],
  });

  const activeColor = isLight ? '#16a34a' : isDark ? '#38bdf8' : '#22c55e';
  const inactiveColor = isLight ? '#64748b' : '#94a3b8';
  const labelActiveColor = isLight ? '#0f172a' : '#ffffff';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tabItem,
        pressed && { transform: [{ scale: 0.94 }] },
      ]}
    >
      {/* Icon with smooth spring scale & subtle lift */}
      <Animated.View
        style={{
          transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
        }}
      >
        {options.tabBarIcon ? (
          options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? activeColor : inactiveColor,
            size: 23,
          })
        ) : null}
      </Animated.View>

      {/* Label with smooth scale & opacity */}
      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? labelActiveColor : inactiveColor,
            opacity: labelOpacity,
            transform: [{ scale: labelScale }],
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
    height: Platform.OS === 'ios' ? 76 : 64,
    maxWidth: 540,
    width: '100%',
    backgroundColor: 'rgba(3, 15, 20, 0.96)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(34, 197, 94, 0.35)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: 'rgba(251, 191, 36, 0.28)',
    borderRightColor: 'rgba(251, 191, 36, 0.28)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 6,
    paddingBottom: Platform.OS === 'ios' ? 18 : 6,
    position: 'relative',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 12,
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    bottom: Platform.OS === 'ios' ? 18 : 6,
    borderRadius: 14,
    borderWidth: 1.2,
    borderColor: 'rgba(0, 255, 135, 0.40)',
    overflow: 'hidden',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
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
    fontFamily: FONT.bold,
    letterSpacing: -0.2,
    textAlign: 'center',
  },
});
