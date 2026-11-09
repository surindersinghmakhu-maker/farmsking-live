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
import { usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useLanguage } from '@/src/store/language-context';
import { useRole } from '@/src/store/role-context';
import { getTabsForRole, RoleTabItem } from '@/constants/RoleTabs';

export function AnimatedPurpleBottomBar({
  state,
  descriptors,
  navigation,
  allowedTabs,
  onTabPressTrigger,
}: any) {
  const { isDark } = useExecutiveTheme();
  const { t } = useLanguage();
  const { role } = useRole();
  const roleTabs = getTabsForRole(role);
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = windowWidth >= 768;
  const pathname = usePathname();

  const getTranslatedLabel = (name: string, rawLabel: string) => {
    switch (name) {
      case 'index': return t('tabHome', 'Home');
      case 'farm': return t('tabCrops', 'Crops');
      case 'records': return t('tabRecords', 'Accounts');
      case 'shop': return t('tabStore', 'Store');
      case 'more':
      case 'admin_more': return t('tabMore', 'More');
      case 'garden': return t('tabGardens', 'Gardens');
      case 'farmers': return t('tabFarmers', 'Farmers');
      case 'chat': return t('tabChat', 'Chat');
      case 'wallet': return t('tabMyBusiness', 'Wallet');
      case 'admin_shop': return t('agristoreHub', 'E-Commerce');
      case 'ai-doctor': return t('cropDoctor', 'AI Doctor');
      case 'categories': return t('tabCategories', 'Categories');
      case 'cart': return t('tabCart', 'Cart');
      case 'orders': return t('tabOrders', 'Orders');
      case 'super-users': return t('tabUsers', 'Users');
      case 'super-accounts': return t('tabAccounts', 'Finance');
      default: return typeof rawLabel === 'string' ? rawLabel : name;
    }
  };

  // Filter only visible routes. If allowedTabs is passed (e.g. ['index', 'farm', 'records', 'shop', 'more']),
  // strictly filter and order by allowedTabs so ONLY the exact configured dashboard tabs appear.
  let visibleRoutes = state.routes.filter((route: any) => {
    if (allowedTabs && Array.isArray(allowedTabs)) {
      return allowedTabs.includes(route.name);
    }
    const { options } = descriptors[route.key];
    const opt = options as any;
    if (opt.href === null) return false;
    if (opt.tabBarItemStyle?.display === 'none') return false;
    return true;
  });

  if (allowedTabs && Array.isArray(allowedTabs)) {
    visibleRoutes.sort(
      (a: any, b: any) => allowedTabs.indexOf(a.name) - allowedTabs.indexOf(b.name)
    );
  }

  // Exact active tab identification matching URL pathname and navigation state with 100% precision
  const getActiveTabKey = (): string => {
    const isHome =
      !pathname ||
      pathname === '/' ||
      pathname === '/(user)/(tabs)' ||
      pathname === '/(user)/(tabs)/index' ||
      pathname === '/(tabs)' ||
      pathname === '/(tabs)/index';
    if (isHome) {
      return 'index';
    }

    // Match by pathname segments
    const segments = pathname.replace(/^\/+|\/+$/g, '').split('/');
    const matched = visibleRoutes.find((r: any) => {
      if (r.name === 'index') return false;
      return (
        segments.includes(r.name) ||
        pathname === `/${r.name}` ||
        pathname.startsWith(`/${r.name}/`) ||
        pathname.includes(`/(tabs)/${r.name}`)
      );
    });
    if (matched) return matched.name;

    // Fallback to active route in state
    const currentRoute = state.routes[state.index];
    if (currentRoute && visibleRoutes.some((r: any) => r.name === currentRoute.name)) {
      return currentRoute.name;
    }

    return visibleRoutes[0]?.name || 'index';
  };

  const activeTabKey = getActiveTabKey();
  const currentTab = roleTabs.find((t) => t.tabName === activeTabKey) || roleTabs[0];

  // Direct pixel measurement of each tab item (zero math drift, zero index skip)
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

  // Don't render bottom tab bar on desktop where the top header menu is used
  if (isDesktop) return null;
  if (visibleRoutes.length === 0) return null;

  return (
    <View style={styles.barOuterWrapper}>
      <View
        style={[
          styles.barContainer,
          isDark ? styles.barContainerDark : styles.barContainerLight,
        ]}
      >
        {/* Continuous 4D Smooth Gliding Pill placed with 100% pixel precision on EXACT active tab */}
        <Animated.View
          style={[
            styles.activeIndicator,
            {
              left: slideAnim,
              width: widthAnim,
              opacity: pillOpacity,
              borderColor: currentTab?.border || (isDark ? 'rgba(0, 255, 135, 0.45)' : 'rgba(22, 163, 74, 0.45)'),
              shadowColor: currentTab?.shadow || (isDark ? '#00ff87' : '#15803d'),
            },
          ]}
          pointerEvents="none"
        >
          {/* Ambient Glass Glow matching the exact active tab metadata */}
          <LinearGradient
            colors={
              (currentTab?.glow as [string, string, ...string[]]) ||
              (isDark
                ? ['rgba(16, 185, 129, 0.32)', 'rgba(5, 150, 105, 0.18)', 'rgba(16, 185, 129, 0.05)']
                : ['rgba(16, 185, 129, 0.18)', 'rgba(5, 150, 105, 0.08)', 'transparent'])
            }
            style={styles.indicatorGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />
          {/* Top Glowing Laser Accent Bar matching the exact active tab */}
          <LinearGradient
            colors={
              (currentTab?.laser as [string, string, ...string[]]) ||
              (isDark ? ['#00ff87', '#10b981', '#059669'] : ['#10b981', '#059669', '#047857'])
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.indicatorTopGlow}
          />
        </Animated.View>

        {/* Tab Items */}
        {visibleRoutes.map((route: any) => {
          const isFocused = route.name === activeTabKey;
          const { options } = descriptors[route.key];
          const tabMeta = roleTabs.find((t) => t.tabName === route.name);

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
              isDark={isDark}
              tabMeta={tabMeta}
              routeName={route.name}
              options={options}
              label={getTranslatedLabel(route.name, typeof label === 'string' ? label : route.name)}
              onPress={onPress}
              onLayout={handleTabLayout}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItemButton({
  isFocused,
  isDark,
  tabMeta,
  routeName,
  options,
  label,
  onPress,
  onLayout,
}: {
  isFocused: boolean;
  isDark: boolean;
  tabMeta?: RoleTabItem;
  routeName: string;
  options: any;
  label: string;
  onPress: () => void;
  onLayout: (e: LayoutChangeEvent) => void;
}) {
  const animValue = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(animValue, {
      toValue: isFocused ? 1 : 0,
      tension: 80,
      friction: 9,
      useNativeDriver: false,
    }).start();
  }, [isFocused]);

  const iconScale = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.15],
  });

  const iconTranslateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  const labelOpacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [isDark ? 0.75 : 0.95, 1.0],
  });

  const getActiveTabColor = () => {
    if (isDark) return tabMeta?.color || '#00ff87';
    switch (routeName) {
      case 'index':
      case 'farm':
        return '#15803d';
      case 'records':
        return '#0284c7';
      case 'shop':
        return '#c2410c';
      case 'more':
      case 'admin_more':
        return '#7e22ce';
      default:
        return '#15803d';
    }
  };

  const activeColor = getActiveTabColor();
  const inactiveColor = isDark ? '#94a3b8' : '#0f172a';

  return (
    <Pressable
      onPress={onPress}
      onLayout={onLayout}
      style={({ pressed }) => [
        styles.tabItem,
        pressed && { transform: [{ scale: 0.92 }] },
      ]}
    >
      {/* Icon with smooth spring scale & subtle lift */}
      <Animated.View
        style={[
          styles.tabIconWrap,
          {
            transform: [{ scale: iconScale }, { translateY: iconTranslateY }],
          },
        ]}
      >
        {options.tabBarIcon ? (
          options.tabBarIcon({
            focused: isFocused,
            color: isFocused ? activeColor : inactiveColor,
            size: 20,
          })
        ) : null}
      </Animated.View>

      {/* Label with responsive styling */}
      <Animated.Text
        style={[
          styles.tabLabel,
          {
            color: isFocused ? activeColor : inactiveColor,
            fontFamily: isFocused ? FONT.extraBold : FONT.semiBold,
            opacity: labelOpacity,
            fontWeight: isFocused ? '800' : '600',
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
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    backgroundColor: 'transparent',
    pointerEvents: 'box-none',
  },
  barContainer: {
    flexDirection: 'row',
    height: 60,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    paddingTop: 3,
    paddingBottom: Platform.OS === 'ios' ? 14 : 2,
    paddingHorizontal: 6,
    position: 'relative',
  },
  barContainerDark: {
    backgroundColor: 'rgba(6, 14, 32, 0.96)',
    borderTopColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('#000000', 'lg'),
  },
  barContainerLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopColor: '#cbd5e1',
    ...premiumShadow('#0f172a', 'md'),
  },
  activeIndicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1.2,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.55,
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
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
    zIndex: 2,
  },
  tabIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 24,
    height: 24,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
    letterSpacing: -0.1,
  },
});
