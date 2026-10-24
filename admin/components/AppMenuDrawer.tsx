import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Pressable,
  Animated,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, usePathname } from 'expo-router';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { ADMIN_PILLARS, NavigationPillar, SubTabItem } from '@/constants/navigationPillars';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAuth } from '@/src/store/auth-context';
import { useRole } from '@/src/store/role-context';

interface AppMenuDrawerProps {
  visible: boolean;
  onClose: () => void;
  activePillarId?: string;
}

export const AppMenuDrawer: React.FC<AppMenuDrawerProps> = ({
  visible,
  onClose,
  activePillarId,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { role } = useRole();
  const { themeMode, setThemeMode, isLight, isDarkTheme } = useExecutiveTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ADMIN_PILLARS.forEach((p) => {
      initial[p.id] = p.id === activePillarId;
    });
    return initial;
  });

  const drawerWidth = Math.min(340, Math.floor(width * 0.88));
  const slideAnim = useRef(new Animated.Value(-drawerWidth)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -drawerWidth,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, drawerWidth]);

  // Keep expanded pillar updated when activePillarId changes
  useEffect(() => {
    if (activePillarId) {
      setExpandedPillars((prev) => ({
        ...prev,
        [activePillarId]: true,
      }));
    }
  }, [activePillarId]);

  const toggleExpand = (pillarId: string) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [pillarId]: !prev[pillarId],
    }));
  };

  const handleSelectPillar = (pillar: NavigationPillar) => {
    if (pillar.subTabs && pillar.subTabs.length > 0) {
      const firstTab = pillar.subTabs[0];
      handleSelectSubTab(firstTab);
    }
  };

  const handleSelectSubTab = (subTab: SubTabItem) => {
    onClose();
    if (subTab.params) {
      const queryString = new URLSearchParams(subTab.params as Record<string, string>).toString();
      router.push(`${subTab.path}?${queryString}` as any);
    } else {
      router.push(subTab.path as any);
    }
  };

  const filteredPillars = useMemo(() => {
    if (!searchQuery.trim()) return ADMIN_PILLARS;
    const q = searchQuery.toLowerCase();
    return ADMIN_PILLARS.map((pillar) => {
      const matchPillar =
        pillar.title.toLowerCase().includes(q) ||
        pillar.shortTitle.toLowerCase().includes(q);
      const matchTabs = pillar.subTabs.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.shortTitle && t.shortTitle.toLowerCase().includes(q))
      );
      if (matchPillar || matchTabs.length > 0) {
        return {
          ...pillar,
          subTabs: matchTabs.length > 0 ? matchTabs : pillar.subTabs,
        };
      }
      return null;
    }).filter(Boolean) as NavigationPillar[];
  }, [searchQuery]);

  const isSellerRole =
    (role as string) === 'SELLER' ||
    (user?.role as string) === 'SELLER' ||
    Boolean((user as any)?.isSeller);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalRoot}>
        {/* Semi-transparent Backdrop with Fade */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <Pressable style={styles.backdropPressable} onPress={onClose} />
        </Animated.View>

        {/* Slide-out Left Drawer Panel */}
        <Animated.View
          style={[
            styles.drawerPanel,
            { width: drawerWidth },
            isLight ? styles.drawerPanelLight : isDarkTheme ? styles.drawerPanelDark : styles.drawerPanelNeon,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          {/* Drawer Top Header Row */}
          <View
            style={[
              styles.drawerHeader,
              isLight && styles.drawerHeaderLight,
              isDarkTheme && styles.drawerHeaderDark,
            ]}
          >
            <View style={styles.brandRow}>
              <View
                style={[
                  styles.logoBox,
                  {
                    backgroundColor: isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87',
                  },
                ]}
              >
                <BrandLogo size={20} iconColor={isLight ? '#ffffff' : isDarkTheme ? '#020617' : '#020d06'} />
              </View>
              <View style={styles.brandTextCol}>
                <Text style={[styles.brandTitleText, isLight && { color: '#0f172a' }]}>
                  FarmsKing{' '}
                  <Text
                    style={[
                      styles.brandBadge,
                      isLight && {
                        color: '#16a34a',
                        backgroundColor: 'rgba(22, 163, 74, 0.12)',
                        borderColor: 'rgba(234, 179, 8, 0.4)',
                      },
                      isDarkTheme && {
                        color: '#38bdf8',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        borderColor: 'rgba(56, 189, 248, 0.4)',
                      },
                    ]}
                  >
                    4D
                  </Text>
                </Text>
                <Text
                  style={[
                    styles.brandSubtitleText,
                    isLight && { color: '#64748b' },
                    isDarkTheme && { color: '#94a3b8' },
                  ]}
                >
                  Executive App Menu
                </Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={[
                styles.closeButton,
                isLight && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
              ]}
              onPress={onClose}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={19} color={isLight ? '#475569' : '#94a3b8'} />
            </TouchableOpacity>
          </View>

          {/* Quick Search Tool Filter */}
          <View style={styles.searchSection}>
            <View
              style={[
                styles.searchBox,
                isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
                isDarkTheme && { backgroundColor: 'rgba(255, 255, 255, 0.04)', borderColor: 'rgba(56, 189, 248, 0.2)' },
              ]}
            >
              <Ionicons name="search" size={15} color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87'} />
              <TextInput
                style={[styles.searchInput, isLight && { color: '#0f172a' }]}
                placeholder="Search tools & hubs..."
                placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={15} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Hubs Section Title */}
          <View style={styles.sectionHeadingRow}>
            <Text
              style={[
                styles.sectionHeadingText,
                isLight && { color: '#16a34a' },
                isDarkTheme && { color: '#38bdf8' },
              ]}
            >
              COMMAND HUBS
            </Text>
            <View
              style={[
                styles.hubsCountPill,
                isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.25)' },
                isDarkTheme && { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.25)' },
              ]}
            >
              <Text
                style={[
                  styles.hubsCountText,
                  isLight && { color: '#16a34a' },
                  isDarkTheme && { color: '#38bdf8' },
                ]}
              >
                {ADMIN_PILLARS.length} HUBS
              </Text>
            </View>
          </View>

          {/* Navigation Hubs ScrollView */}
          <ScrollView
            style={styles.drawerScroll}
            contentContainerStyle={styles.drawerScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredPillars.map((pillar) => {
              const isExpanded = searchQuery.trim().length > 0 ? true : !!expandedPillars[pillar.id];
              const isActivePillar = pillar.id === activePillarId;

              return (
                <View
                  key={pillar.id}
                  style={[
                    styles.pillarWrapper,
                    isLight && {
                      backgroundColor: '#f8fafc',
                      borderColor: 'rgba(22, 163, 74, 0.15)',
                    },
                    isDarkTheme && {
                      backgroundColor: 'rgba(255, 255, 255, 0.03)',
                      borderColor: 'rgba(56, 189, 248, 0.16)',
                    },
                  ]}
                >
                  {/* Pillar Main Row */}
                  <TouchableOpacity
                    style={[
                      styles.pillarHeaderBtn,
                      isActivePillar && (
                        isLight
                          ? { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }
                          : isDarkTheme
                          ? { backgroundColor: 'rgba(56, 189, 248, 0.12)', borderColor: '#38bdf8' }
                          : { backgroundColor: 'rgba(0, 255, 135, 0.12)', borderColor: '#00ff87' }
                      ),
                    ]}
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(pillar.id)}
                  >
                    <View
                      style={[
                        styles.pillarIconSquircle,
                        { borderColor: `${pillar.color}50` },
                        isActivePillar && { backgroundColor: `${pillar.color}25` },
                        isLight && { backgroundColor: 'rgba(241, 245, 249, 0.95)' },
                      ]}
                    >
                      <Ionicons
                        name={isExpanded ? pillar.iconFilled : pillar.icon}
                        size={17}
                        color={pillar.color}
                      />
                    </View>

                    <View style={styles.pillarInfoCol}>
                      <Text
                        style={[
                          styles.pillarTitleText,
                          isLight && { color: '#0f172a' },
                          isActivePillar && { color: isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87' },
                        ]}
                        numberOfLines={1}
                      >
                        {pillar.title}
                      </Text>
                      <Text
                        style={[
                          styles.pillarSubText,
                          isLight && { color: '#64748b' },
                          isDarkTheme && { color: '#94a3b8' },
                        ]}
                      >
                        {pillar.subTabs.length} Options
                      </Text>
                    </View>

                    <View style={styles.pillarRightCol}>
                      <View
                        style={[
                          styles.badgePill,
                          {
                            borderColor: `${pillar.color}40`,
                            backgroundColor: `${pillar.color}15`,
                          },
                        ]}
                      >
                        <Text style={[styles.badgePillText, { color: pillar.color }]}>
                          {pillar.badge}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-down' : 'chevron-forward-outline'}
                        size={15}
                        color={isLight ? '#94a3b8' : '#64748b'}
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Sub-Tabs Direct Links */}
                  {isExpanded && pillar.subTabs && (
                    <View
                      style={[
                        styles.subTabsContainer,
                        isLight && { borderTopColor: 'rgba(22, 163, 74, 0.15)', backgroundColor: '#ffffff' },
                        isDarkTheme && { borderTopColor: 'rgba(56, 189, 248, 0.15)' },
                      ]}
                    >
                      {pillar.subTabs.map((subTab) => {
                        const isIndexActive =
                          subTab.path === '/admin/(tabs)' &&
                          (pathname === '/' || pathname === '/(tabs)' || pathname === '/(tabs)/index');
                        const isOtherActive =
                          subTab.path !== '/admin/(tabs)' &&
                          pathname.includes(subTab.path.split('/').pop() || '');
                        const isSubActive = isIndexActive || isOtherActive;

                        return (
                          <TouchableOpacity
                            key={subTab.id}
                            style={[
                              styles.subTabOptionItem,
                              isLight && { backgroundColor: '#ffffff', borderColor: '#f1f5f9' },
                              isSubActive && (
                                isLight
                                  ? { backgroundColor: '#f0fdf4', borderColor: '#16a34a' }
                                  : isDarkTheme
                                  ? { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: '#38bdf8' }
                                  : { backgroundColor: 'rgba(0, 255, 135, 0.12)', borderColor: '#00ff87' }
                              ),
                            ]}
                            activeOpacity={0.75}
                            onPress={() => handleSelectSubTab(subTab)}
                          >
                            <View
                              style={[
                                styles.subTabBullet,
                                isLight && { backgroundColor: '#cbd5e1' },
                                isSubActive && {
                                  backgroundColor: isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87',
                                },
                              ]}
                            />
                            <Ionicons
                              name={subTab.icon}
                              size={14}
                              color={
                                isSubActive
                                  ? isLight
                                    ? '#16a34a'
                                    : isDarkTheme
                                    ? '#38bdf8'
                                    : '#00ff87'
                                  : isLight
                                  ? '#64748b'
                                  : '#94a3b8'
                              }
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.subTabTitle,
                                  isLight && { color: '#334155' },
                                  isSubActive && {
                                    color: isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#00ff87',
                                    fontFamily: FONT.bold,
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {subTab.title}
                              </Text>
                              {subTab.description ? (
                                <Text
                                  style={[
                                    styles.subTabDesc,
                                    isLight && { color: '#64748b' },
                                    isDarkTheme && { color: '#94a3b8' },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {subTab.description}
                                </Text>
                              ) : null}
                            </View>
                            <Ionicons
                              name="chevron-forward"
                              size={12}
                              color={isLight ? '#cbd5e1' : '#64748b'}
                            />
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Drawer Footer: Global Theme Switcher & Quick Navigation */}
          <View
            style={[
              styles.drawerFooter,
              isLight && styles.drawerFooterLight,
              isDarkTheme && styles.drawerFooterDark,
            ]}
          >
            {isSellerRole && (
              <TouchableOpacity
                style={[
                  styles.sellerHubBtn,
                  isLight && { backgroundColor: '#f0fdf4', borderColor: 'rgba(22, 163, 74, 0.3)' },
                  isDarkTheme && { backgroundColor: 'rgba(56, 189, 248, 0.1)', borderColor: 'rgba(56, 189, 248, 0.3)' },
                ]}
                onPress={() => {
                  onClose();
                  router.push('/seller-dashboard');
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="storefront-outline" size={15} color={isDarkTheme ? '#38bdf8' : '#16a34a'} />
                <Text
                  style={[
                    styles.sellerHubText,
                    isDarkTheme && { color: '#38bdf8' },
                  ]}
                >
                  🏪 Open Seller Hub
                </Text>
              </TouchableOpacity>
            )}

            {/* Global Theme Selector */}
            <View
              style={[
                styles.themeBox,
                isLight && styles.themeBoxLight,
                isDarkTheme && styles.themeBoxDark,
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  themeMode === 'LIGHT' && styles.themeBtnActiveLight,
                ]}
                onPress={() => setThemeMode('LIGHT')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={themeMode === 'LIGHT' ? 'sunny' : 'sunny-outline'}
                  size={13}
                  color={themeMode === 'LIGHT' ? '#16a34a' : isLight ? '#64748b' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.themeBtnText,
                    isLight && { color: '#64748b' },
                    themeMode === 'LIGHT' && styles.themeBtnTextActiveLight,
                  ]}
                >
                  Light Mode
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.themeBtn,
                  themeMode === 'DARK' && styles.themeBtnActiveDark,
                ]}
                onPress={() => setThemeMode('DARK')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={themeMode === 'DARK' ? 'leaf' : 'leaf-outline'}
                  size={13}
                  color={themeMode === 'DARK' ? '#22c55e' : isLight ? '#64748b' : '#94a3b8'}
                />
                <Text
                  style={[
                    styles.themeBtnText,
                    isLight && { color: '#64748b' },
                    themeMode === 'DARK' && styles.themeBtnTextActiveDark,
                  ]}
                >
                  Dark Mode
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Dismiss / Status */}
            <TouchableOpacity
              style={styles.closeBottomBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={[styles.closeBottomText, isLight && { color: '#64748b' }]}>
                ✕ Close Menu
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(8px)' } as any) : {}),
  },
  backdropPressable: {
    flex: 1,
  },
  drawerPanel: {
    height: '100%',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    shadowColor: '#000000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
    ...(Platform.OS === 'web'
      ? ({
          height: '100dvh',
          maxHeight: '100dvh',
        } as any)
      : {}),
  },
  drawerPanelLight: {
    backgroundColor: '#ffffff',
    borderRightWidth: 1,
    borderRightColor: 'rgba(22, 163, 74, 0.2)',
  },
  drawerPanelDark: {
    backgroundColor: '#0b1329',
    borderRightWidth: 1,
    borderRightColor: 'rgba(56, 189, 248, 0.25)',
  },
  drawerPanelNeon: {
    backgroundColor: '#020905',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0, 255, 135, 0.25)',
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 48 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.15)',
  },
  drawerHeaderLight: {
    borderBottomColor: 'rgba(22, 163, 74, 0.15)',
  },
  drawerHeaderDark: {
    borderBottomColor: 'rgba(56, 189, 248, 0.2)',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTextCol: {
    flex: 1,
  },
  brandTitleText: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  brandBadge: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  brandSubtitleText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#6ee7b7',
    marginTop: 1,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchSection: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#ffffff',
    paddingVertical: 0,
  },
  sectionHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 6,
  },
  sectionHeadingText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 1.1,
  },
  hubsCountPill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
  },
  hubsCountText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  drawerScroll: {
    flex: 1,
  },
  drawerScrollContent: {
    paddingHorizontal: 10,
    paddingBottom: 16,
    gap: 6,
  },
  pillarWrapper: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.16)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    overflow: 'hidden',
  },
  pillarHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 9,
    gap: 8,
  },
  pillarIconSquircle: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  pillarInfoCol: {
    flex: 1,
  },
  pillarTitleText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#e2e8f0',
  },
  pillarSubText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 1,
  },
  pillarRightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgePill: {
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  badgePillText: {
    fontSize: 8,
    fontFamily: FONT.bold,
  },
  subTabsContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 135, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    gap: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  subTabOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  subTabBullet: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#64748b',
  },
  subTabTitle: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  subTabDesc: {
    fontSize: 9,
    fontFamily: FONT.regular,
    color: '#64748b',
    marginTop: 1,
  },
  drawerFooter: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 255, 135, 0.15)',
    gap: 8,
  },
  drawerFooterLight: {
    borderTopColor: 'rgba(22, 163, 74, 0.15)',
  },
  drawerFooterDark: {
    borderTopColor: 'rgba(56, 189, 248, 0.2)',
  },
  sellerHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  sellerHubText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#16a34a',
  },
  themeBox: {
    flexDirection: 'row',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    padding: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  themeBoxLight: {
    backgroundColor: '#f1f5f9',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  themeBoxDark: {
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  themeBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeBtnActiveLight: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.5)',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  themeBtnActiveDark: {
    backgroundColor: 'rgba(0, 255, 135, 0.22)',
    borderWidth: 1,
    borderColor: '#00ff87',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  themeBtnText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  themeBtnTextActiveLight: {
    color: '#16a34a',
    fontFamily: FONT.extraBold,
  },
  themeBtnTextActiveDark: {
    color: '#00ff87',
    fontFamily: FONT.extraBold,
  },
  closeBottomBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  closeBottomText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
});
