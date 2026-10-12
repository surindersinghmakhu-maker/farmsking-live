import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS } from '@/constants/theme';

export function AnimatedPurpleBottomBar({ state, descriptors, navigation }: any) {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;

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

  return (
    <View style={styles.barOuterWrapper}>
      <View style={styles.barContainer} onLayout={handleContainerLayout}>
        {/* Continuous Smooth-Moving Purple Active Highlight / Pill Indicator */}
        {tabItemWidth > 0 && (
          <Animated.View
            style={[
              styles.activeIndicator,
              {
                width: pillWidth,
                transform: [{ translateX: indicatorTranslateX }],
              },
            ]}
            pointerEvents="none"
          >
            {/* Ambient Purple Glass Glow */}
            <LinearGradient
              colors={['rgba(124, 58, 237, 0.32)', 'rgba(79, 70, 229, 0.18)', 'rgba(0, 255, 135, 0.22)']}
              style={styles.indicatorGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
            {/* Top Glowing Laser Accent Bar with Purple-to-Mint Gradient */}
            <LinearGradient
              colors={['#a855f7', '#6366f1', '#00ff87']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.indicatorTopGlow}
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
}: {
  isFocused: boolean;
  options: any;
  label: string;
  onPress: () => void;
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

  const activeColor = '#00ff87';
  const inactiveColor = '#94a3b8';

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
            color: isFocused ? '#ffffff' : inactiveColor,
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
    height: 64,
    maxWidth: 540,
    width: '100%',
    backgroundColor: 'rgba(2, 13, 6, 0.96)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 255, 135, 0.28)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: 'rgba(124, 58, 237, 0.22)',
    borderRightColor: 'rgba(0, 255, 135, 0.22)',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 6,
    paddingBottom: 8,
    position: 'relative',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 10,
  },
  activeIndicator: {
    position: 'absolute',
    top: 6,
    bottom: 6,
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
