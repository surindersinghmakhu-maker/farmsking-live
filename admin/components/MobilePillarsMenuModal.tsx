import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, RADIUS, THEME_4D, premiumShadow } from '@/constants/theme';
import { ADMIN_PILLARS, NavigationPillar, SubTabItem } from '@/constants/navigationPillars';
import { useExecutiveTheme } from '@/src/store/theme-context';

interface Props {
  visible: boolean;
  onClose: () => void;
  activePillarId?: string;
}

export const MobilePillarsMenuModal: React.FC<Props> = ({
  visible,
  onClose,
  activePillarId,
}) => {
  const router = useRouter();
  const { themeMode, setThemeMode, isLight, isDarkTheme } = useExecutiveTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>(() => {
    // Expand active pillar or first two by default
    const initial: Record<string, boolean> = {};
    ADMIN_PILLARS.forEach((p, idx) => {
      initial[p.id] = p.id === activePillarId || idx < 2;
    });
    return initial;
  });

  const toggleExpand = (pillarId: string) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [pillarId]: !prev[pillarId],
    }));
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
      const matchPillar = pillar.title.toLowerCase().includes(q) || pillar.shortTitle.toLowerCase().includes(q);
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />

        <View
          style={[
            styles.sheetContainer,
            isLight && {
              backgroundColor: '#ffffff',
              borderTopColor: 'rgba(22, 163, 74, 0.35)',
            },
            isDarkTheme && {
              backgroundColor: '#020617',
              borderTopColor: 'rgba(56, 189, 248, 0.35)',
            },
          ]}
        >
          {/* Header Indicator Pull Bar */}
          <View style={styles.pullIndicatorBox}>
            <View style={[styles.pullIndicator, isLight && { backgroundColor: '#cbd5e1' }]} />
          </View>

          {/* Modal Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleBlock}>
              <View style={[styles.headerBadge, isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }]}>
                <View style={[styles.badgePulseDot, isLight && { backgroundColor: '#16a34a' }]} />
                <Text style={[styles.headerBadgeText, isLight && { color: '#16a34a' }]}>7 DOMAIN PILLARS</Text>
              </View>
              <Text style={[styles.sheetTitle, isLight && { color: '#0f172a' }]}>Command Navigation</Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={isLight ? '#64748b' : '#94a3b8'} />
            </TouchableOpacity>
          </View>

          {/* 🎨 2-Way Mobile Theme Switcher Bar */}
          <View
            style={[
              styles.themeSwitchRow,
              isLight && styles.themeSwitchRowLight,
            ]}
          >
            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                themeMode === 'LIGHT' && styles.themeOptionBtnActiveLight,
              ]}
              onPress={() => setThemeMode('LIGHT')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={themeMode === 'LIGHT' ? 'sunny' : 'sunny-outline'}
                size={14}
                color={themeMode === 'LIGHT' ? '#16a34a' : isLight ? '#64748b' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode === 'LIGHT' && styles.themeOptionTextActiveLight,
                ]}
              >
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.themeOptionBtn,
                themeMode !== 'LIGHT' && styles.themeOptionBtnActiveMedium,
              ]}
              onPress={() => setThemeMode('DARK')}
              activeOpacity={0.8}
            >
              <Ionicons
                name={themeMode !== 'LIGHT' ? 'leaf' : 'leaf-outline'}
                size={14}
                color={themeMode !== 'LIGHT' ? '#22c55e' : isLight ? '#64748b' : '#94a3b8'}
              />
              <Text
                style={[
                  styles.themeOptionText,
                  themeMode !== 'LIGHT' && styles.themeOptionTextActiveMedium,
                ]}
              >
                Dark (Parrot & Gold)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Search Bar */}
          <View
            style={[
              styles.searchBarWrap,
              isLight && {
                backgroundColor: '#f8fafc',
                borderColor: '#e2e8f0',
              },
            ]}
          >
            <Ionicons name="search" size={16} color={isLight ? '#16a34a' : '#00ff87'} />
            <TextInput
              style={[styles.searchInput, isLight && { color: '#0f172a' }]}
              placeholder="Search 25+ tools (e.g. Products, Ledger, Doctors)..."
              placeholderTextColor={isLight ? '#94a3b8' : '#64748b'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={16} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Pillars List */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollInner}
            showsVerticalScrollIndicator={false}
          >
            {filteredPillars.map((pillar) => {
              const isExpanded = searchQuery.trim().length > 0 ? true : !!expandedPillars[pillar.id];
              const isActive = pillar.id === activePillarId;

              return (
                <View
                  key={pillar.id}
                  style={[
                    styles.pillarCard,
                    isLight && {
                      backgroundColor: '#f8fafc',
                      borderColor: '#e2e8f0',
                    },
                  ]}
                >
                  {/* Pillar Header (Accordion Toggle) */}
                  <TouchableOpacity
                    style={[
                      styles.pillarCardHeader,
                      isActive && styles.pillarCardHeaderActive,
                      isLight && isActive && { backgroundColor: 'rgba(22, 163, 74, 0.08)' },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => toggleExpand(pillar.id)}
                  >
                    <View
                      style={[
                        styles.pillarIconWrap,
                        { borderColor: `${pillar.color}50` },
                        isActive && { backgroundColor: `${pillar.color}25` },
                        isLight && { backgroundColor: 'rgba(241, 245, 249, 0.9)' },
                      ]}
                    >
                      <Ionicons
                        name={isExpanded ? pillar.iconFilled : pillar.icon}
                        size={17}
                        color={pillar.color}
                      />
                    </View>

                    <View style={styles.pillarMetaCol}>
                      <Text
                        style={[
                          styles.pillarTitleText,
                          isLight && { color: '#0f172a' },
                          isActive && { color: isLight ? '#16a34a' : '#00ff87' },
                        ]}
                        numberOfLines={1}
                      >
                        {pillar.title}
                      </Text>
                      <Text style={[styles.pillarSubtitleText, isLight && { color: '#64748b' }]}>
                        {pillar.subTabs.length} Administrative Tools
                      </Text>
                    </View>

                    <View style={styles.pillarHeaderRight}>
                      <View
                        style={[
                          styles.pillarBadgePill,
                          { borderColor: `${pillar.color}40`, backgroundColor: `${pillar.color}15` },
                        ]}
                      >
                        <Text style={[styles.pillarBadgeText, { color: pillar.color }]}>
                          {pillar.badge}
                        </Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#64748b"
                      />
                    </View>
                  </TouchableOpacity>

                  {/* Sub-Tabs Grid / Pills */}
                  {isExpanded && (
                    <View style={[styles.subTabsContainer, isLight && { borderTopColor: '#e2e8f0' }]}>
                      {pillar.subTabs.map((subTab) => (
                        <TouchableOpacity
                          key={subTab.id}
                          style={[
                            styles.subTabPill,
                            isLight && {
                              backgroundColor: '#ffffff',
                              borderColor: '#e2e8f0',
                            },
                          ]}
                          activeOpacity={0.75}
                          onPress={() => handleSelectSubTab(subTab)}
                        >
                          <Ionicons
                            name={subTab.icon}
                            size={14}
                            color={isLight ? '#16a34a' : '#00ff87'}
                          />
                          <Text
                            style={[
                              styles.subTabTitleText,
                              isLight && { color: '#1e293b' },
                            ]}
                            numberOfLines={1}
                          >
                            {subTab.title}
                          </Text>
                          <Ionicons
                            name="arrow-forward"
                            size={12}
                            color={isLight ? '#94a3b8' : '#64748b'}
                            style={{ marginLeft: 'auto' }}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>

          {/* Bottom Fast Action Footer */}
          <View style={[styles.footerRow, isLight && { borderTopColor: '#e2e8f0' }]}>
            <TouchableOpacity
              style={styles.footerLinkBtn}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                router.push('/admin/(tabs)/super-settings');
              }}
            >
              <Ionicons name="settings-outline" size={14} color={isLight ? '#16a34a' : '#00ff87'} />
              <Text style={[styles.footerLinkText, isLight && { color: '#16a34a' }]}>Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerLinkBtn}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                router.push('/admin/(tabs)/admin_more');
              }}
            >
              <Ionicons name="grid-outline" size={14} color={isLight ? '#16a34a' : '#00ff87'} />
              <Text style={[styles.footerLinkText, isLight && { color: '#16a34a' }]}>Master Hub</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.footerLinkBtn}
              activeOpacity={0.8}
              onPress={() => {
                onClose();
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('admin-open-health-radar'));
                }
              }}
            >
              <Ionicons name="pulse-outline" size={14} color="#10b981" />
              <Text style={styles.footerLinkText}>99.9% Radar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  backdropPressable: {
    flex: 1,
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '88%',
    backgroundColor: '#020905',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 255, 135, 0.35)',
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    ...premiumShadow('#00ff87', 'lg'),
    ...(Platform.OS === 'web'
      ? ({
        backdropFilter: 'blur(24px)',
      } as any)
      : {}),
  },
  pullIndicatorBox: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  pullIndicator: {
    width: 44,
    height: 4.5,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 12,
  },
  headerTitleBlock: {
    gap: 3,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  badgePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff87',
  },
  headerBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.8,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  themeSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    borderRadius: RADIUS.lg,
    padding: 3,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 4,
  },
  themeSwitchRowLight: {
    backgroundColor: '#f1f5f9',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  themeSwitchRowDark: {
    backgroundColor: 'rgba(11, 19, 41, 0.8)',
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  themeOptionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
  },
  themeOptionBtnActiveLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  themeOptionBtnActiveMedium: {
    backgroundColor: 'rgba(34, 197, 94, 0.22)',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  themeOptionBtnActiveDark: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderWidth: 1,
    borderColor: '#38bdf8',
  },
  themeOptionText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#94a3b8',
  },
  themeOptionTextActiveLight: {
    color: '#16a34a',
  },
  themeOptionTextActiveMedium: {
    color: '#fbbf24',
  },
  themeOptionTextActiveDark: {
    color: '#38bdf8',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 7 : 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#ffffff',
    paddingVertical: 3,
  },
  scrollContent: {
    maxHeight: 460,
  },
  scrollInner: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 5,
  },
  pillarCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.15)',
    overflow: 'hidden',
  },
  pillarCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
  },
  pillarCardHeaderActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.06)',
  },
  pillarIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarMetaCol: {
    flex: 1,
  },
  pillarTitleText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  pillarSubtitleText: {
    fontSize: 9.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 1,
  },
  pillarHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillarBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  pillarBadgeText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
  },
  subTabsContainer: {
    paddingHorizontal: 8,
    paddingBottom: 6,
    paddingTop: 3,
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  subTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.12)',
  },
  subTabTitleText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#e2e8f0',
    flex: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  footerLinkText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
});
