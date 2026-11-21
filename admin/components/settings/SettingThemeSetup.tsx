import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useExecutiveTheme, ExecutiveTheme, ThemeConfig } from '@/src/store/theme-context';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { RoleThemes, UserRole } from '@/constants/Colors';

interface ThemePresetOption {
  key: ExecutiveTheme;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  primaryColor: string;
  accentColor: string;
  bgPreview: string;
  isDark: boolean;
}

const THEME_PRESETS: ThemePresetOption[] = [
  {
    key: 'DARK',
    title: '4D Cyber Obsidian Dark',
    subtitle: 'Deep obsidian emerald (#030f14) with vivid parrot green & radiant gold accents',
    icon: 'moon',
    primaryColor: '#22c55e',
    accentColor: '#fbbf24',
    bgPreview: '#030f14',
    isDark: true,
  },
  {
    key: 'LIGHT',
    title: '4D Futuristic Porcelain Light',
    subtitle: 'Pristine porcelain white with fresh green highlights & gold trims (Executive default)',
    icon: 'sunny',
    primaryColor: '#16a34a',
    accentColor: '#f59e0b',
    bgPreview: '#fbfdfa',
    isDark: false,
  },
  {
    key: 'EMERALD',
    title: 'Royal Emerald Green',
    subtitle: 'Vibrant agriculture emerald with mint laser edges',
    icon: 'leaf',
    primaryColor: '#059669',
    accentColor: '#10b981',
    bgPreview: '#f0fdf4',
    isDark: false,
  },
  {
    key: 'GOLD',
    title: 'Harvest Imperial Gold',
    subtitle: 'Rich wheat harvest gold with amber glow highlights',
    icon: 'ribbon',
    primaryColor: '#d97706',
    accentColor: '#f59e0b',
    bgPreview: '#fffbeb',
    isDark: false,
  },
  {
    key: 'SAPPHIRE',
    title: 'Enterprise Sapphire Blue',
    subtitle: 'Corporate deep sapphire with neon sky-blue accents',
    icon: 'diamond',
    primaryColor: '#2563eb',
    accentColor: '#38bdf8',
    bgPreview: '#eff6ff',
    isDark: false,
  },
  {
    key: 'AMETHYST',
    title: 'Executive Amethyst Purple',
    subtitle: 'Royal deep violet with glowing lilac telemetry rings',
    icon: 'sparkles',
    primaryColor: '#7c3aed',
    accentColor: '#c084fc',
    bgPreview: '#faf5ff',
    isDark: false,
  },
  {
    key: 'OCEAN',
    title: 'Deep Ocean Teal',
    subtitle: 'Coastal lagoon teal with aquatic fresh energy',
    icon: 'water',
    primaryColor: '#0d9488',
    accentColor: '#14b8a6',
    bgPreview: '#f0fdfa',
    isDark: false,
  },
  {
    key: 'PLATINUM',
    title: 'Statutory Platinum Slate',
    subtitle: 'Ultra-clean institutional slate with high-contrast text',
    icon: 'shield',
    primaryColor: '#475569',
    accentColor: '#64748b',
    bgPreview: '#f8fafc',
    isDark: false,
  },
];

export default function SettingThemeSetup() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const {
    executiveTheme,
    setExecutiveTheme,
    themeMode,
    setThemeMode,
    colors,
    isDark,
    isLight,
    cardBg,
    cardBorder,
    textColor,
    subTextColor,
    innerBg,
  } = useExecutiveTheme();

  const [activeTabSub, setActiveTabSub] = useState<'PRESETS' | 'ROLES' | 'PREVIEW'>('PRESETS');
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const handleSelectTheme = (themeKey: ExecutiveTheme) => {
    setExecutiveTheme(themeKey);
    setSuccessToast(`Applied theme: ${themeKey}`);
    setTimeout(() => setSuccessToast(null), 2500);
  };

  return (
    <View style={styles.container}>
      {/* 1. Header Banner */}
      <LinearGradient
        colors={isDark ? ['#041d0f', '#090e17'] : ['#f0fdf4', '#ffffff']}
        style={[styles.headerBanner, { borderColor: cardBorder }]}
      >
        <View style={styles.bannerRow}>
          <View style={styles.bannerIconBox}>
            <Ionicons name="color-palette" size={24} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.bannerTitle, { color: textColor }]}>
                Executive Theme &amp; Visual Appearance
              </Text>
              <View style={[styles.activePill, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.activePillText, { color: colors.primary }]}>
                  {executiveTheme} ACTIVE
                </Text>
              </View>
            </View>
            <Text style={[styles.bannerSub, { color: subTextColor }]}>
              Manage platform aesthetics, obsidian dark modes, cyber neon accents, typography &amp; role colors across the entire console.
            </Text>
          </View>

          {/* Quick Light/Dark Toggle */}
          <View style={styles.modeToggleWrap}>
            <TouchableOpacity
              style={[
                styles.modeBtn,
                !isDark && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleSelectTheme('LIGHT')}
            >
              <Ionicons name="sunny" size={15} color={!isDark ? '#ffffff' : subTextColor} />
              <Text style={[styles.modeBtnText, { color: !isDark ? '#ffffff' : subTextColor }]}>
                Light
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.modeBtn,
                isDark && { backgroundColor: colors.primary },
              ]}
              onPress={() => handleSelectTheme('DARK')}
            >
              <Ionicons name="moon" size={15} color={isDark ? '#ffffff' : subTextColor} />
              <Text style={[styles.modeBtnText, { color: isDark ? '#ffffff' : subTextColor }]}>
                Dark (4D)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {successToast && (
          <View style={styles.toastBox}>
            <Ionicons name="checkmark-circle" size={16} color="#10b981" />
            <Text style={styles.toastText}>{successToast}</Text>
          </View>
        )}
      </LinearGradient>

      {/* 2. Sub-Tabs */}
      <View style={[styles.subTabsRow, { borderBottomColor: cardBorder }]}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeTabSub === 'PRESETS' && [styles.subTabBtnActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTabSub('PRESETS')}
        >
          <Ionicons
            name="layers-outline"
            size={16}
            color={activeTabSub === 'PRESETS' ? colors.primary : subTextColor}
          />
          <Text style={[styles.subTabText, activeTabSub === 'PRESETS' && { color: colors.primary, fontFamily: FONT.bold }]}>
            Theme Presets ({THEME_PRESETS.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeTabSub === 'PREVIEW' && [styles.subTabBtnActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTabSub('PREVIEW')}
        >
          <Ionicons
            name="tv-outline"
            size={16}
            color={activeTabSub === 'PREVIEW' ? colors.primary : subTextColor}
          />
          <Text style={[styles.subTabText, activeTabSub === 'PREVIEW' && { color: colors.primary, fontFamily: FONT.bold }]}>
            Live 4D Palette Preview
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeTabSub === 'ROLES' && [styles.subTabBtnActive, { borderBottomColor: colors.primary }]]}
          onPress={() => setActiveTabSub('ROLES')}
        >
          <Ionicons
            name="people-outline"
            size={16}
            color={activeTabSub === 'ROLES' ? colors.primary : subTextColor}
          />
          <Text style={[styles.subTabText, activeTabSub === 'ROLES' && { color: colors.primary, fontFamily: FONT.bold }]}>
            Role Color Matrix ({Object.keys(RoleThemes).length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Tab Contents */}
      {activeTabSub === 'PRESETS' && (
        <View style={styles.presetsGrid}>
          {THEME_PRESETS.map((preset) => {
            const isSelected = executiveTheme === preset.key;
            return (
              <TouchableOpacity
                key={preset.key}
                style={[
                  styles.presetCard,
                  { backgroundColor: cardBg, borderColor: isSelected ? preset.primaryColor : cardBorder },
                  isSelected && styles.presetCardSelected,
                ]}
                onPress={() => handleSelectTheme(preset.key)}
                activeOpacity={0.85}
              >
                <View style={styles.presetTopRow}>
                  <View style={[styles.presetIconWrap, { backgroundColor: preset.primaryColor + '18' }]}>
                    <Ionicons name={preset.icon} size={20} color={preset.primaryColor} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.presetTitle, { color: textColor }]}>
                      {preset.title}
                    </Text>
                    <Text style={[styles.presetSub, { color: subTextColor }]} numberOfLines={2}>
                      {preset.subtitle}
                    </Text>
                  </View>
                  {isSelected && (
                    <View style={[styles.selectedBadge, { backgroundColor: preset.primaryColor }]}>
                      <Ionicons name="checkmark" size={13} color="#ffffff" />
                    </View>
                  )}
                </View>

                {/* Swatch Mini Strip */}
                <View style={styles.swatchRow}>
                  <View style={[styles.swatchDot, { backgroundColor: preset.primaryColor }]} />
                  <Text style={[styles.swatchLabel, { color: subTextColor }]}>
                    Primary: {preset.primaryColor}
                  </Text>
                  <View style={[styles.swatchDot, { backgroundColor: preset.accentColor, marginLeft: 12 }]} />
                  <Text style={[styles.swatchLabel, { color: subTextColor }]}>
                    Accent: {preset.accentColor}
                  </Text>
                  <View
                    style={[
                      styles.modeBadgeMini,
                      { backgroundColor: preset.isDark ? '#0f172a' : '#f1f5f9' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeBadgeMiniText,
                        { color: preset.isDark ? '#38bdf8' : '#475569' },
                      ]}
                    >
                      {preset.isDark ? 'DARK' : 'LIGHT'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {activeTabSub === 'PREVIEW' && (
        <View style={styles.previewContainer}>
          {/* Card 1: Interactive Component Sandbox */}
          <View style={[styles.previewCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.previewCardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={[styles.previewDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.previewCardTitle, { color: textColor }]}>
                  Live UI Components Preview
                </Text>
              </View>
              <Text style={[styles.previewCardTag, { color: colors.accent }]}>
                {colors.name}
              </Text>
            </View>

            <View style={styles.previewSection}>
              <Text style={[styles.previewSectionLabel, { color: subTextColor }]}>Buttons &amp; Badges:</Text>
              <View style={styles.previewRow}>
                <TouchableOpacity style={[styles.sampleBtnPrimary, { backgroundColor: colors.primary }]}>
                  <Ionicons name="flash" size={14} color="#ffffff" />
                  <Text style={styles.sampleBtnPrimaryText}>Primary CTA</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.sampleBtnOutline, { borderColor: colors.primary }]}>
                  <Text style={[styles.sampleBtnOutlineText, { color: colors.primary }]}>Outline Action</Text>
                </TouchableOpacity>

                <View style={[styles.sampleBadge, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                  <Text style={[styles.sampleBadgeText, { color: colors.primary }]}>Status Active</Text>
                </View>

                <View style={[styles.sampleBadge, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b' }]}>
                  <Text style={[styles.sampleBadgeText, { color: '#f59e0b' }]}>Gold Highlight</Text>
                </View>
              </View>
            </View>

            <View style={[styles.previewSection, { borderTopWidth: 1, borderTopColor: cardBorder, paddingTop: 14 }]}>
              <Text style={[styles.previewSectionLabel, { color: subTextColor }]}>Surface Tokens &amp; Color Hex:</Text>
              <View style={styles.swatchGrid}>
                <View style={[styles.swatchItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <View style={[styles.swatchColorBox, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.swatchItemName, { color: textColor }]}>Primary</Text>
                  <Text style={[styles.swatchItemHex, { color: subTextColor }]}>{colors.primary}</Text>
                </View>

                <View style={[styles.swatchItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <View style={[styles.swatchColorBox, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.swatchItemName, { color: textColor }]}>Accent</Text>
                  <Text style={[styles.swatchItemHex, { color: subTextColor }]}>{colors.accent}</Text>
                </View>

                <View style={[styles.swatchItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <View style={[styles.swatchColorBox, { backgroundColor: colors.bg }]} />
                  <Text style={[styles.swatchItemName, { color: textColor }]}>Background</Text>
                  <Text style={[styles.swatchItemHex, { color: subTextColor }]}>{colors.bg}</Text>
                </View>

                <View style={[styles.swatchItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <View style={[styles.swatchColorBox, { backgroundColor: colors.cardBg }]} />
                  <Text style={[styles.swatchItemName, { color: textColor }]}>Card Glass</Text>
                  <Text style={[styles.swatchItemHex, { color: subTextColor }]}>Glassmorphic</Text>
                </View>

                <View style={[styles.swatchItem, { backgroundColor: innerBg, borderColor: cardBorder }]}>
                  <View style={[styles.swatchColorBox, { backgroundColor: colors.cardBorder }]} />
                  <Text style={[styles.swatchItemName, { color: textColor }]}>Laser Border</Text>
                  <Text style={[styles.swatchItemHex, { color: subTextColor }]}>Neon Edge</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      )}

      {activeTabSub === 'ROLES' && (
        <View style={styles.rolesGrid}>
          {Object.entries(RoleThemes).map(([roleKey, roleConfig]) => (
            <View
              key={roleKey}
              style={[
                styles.roleCard,
                { backgroundColor: cardBg, borderColor: cardBorder },
              ]}
            >
              <View style={styles.roleCardTop}>
                <View style={[styles.roleBadgeDot, { backgroundColor: roleConfig.primary }]} />
                <Text style={[styles.roleKeyText, { color: roleConfig.primary }]}>
                  {roleKey}
                </Text>
              </View>
              <Text style={[styles.roleNameText, { color: textColor }]}>
                {roleConfig.name}
              </Text>
              <Text style={[styles.roleBadgeSub, { color: subTextColor }]} numberOfLines={1}>
                {roleConfig.badge}
              </Text>
              <View style={styles.roleSwatchStrip}>
                <View style={[styles.miniSquare, { backgroundColor: roleConfig.primary }]} />
                <View style={[styles.miniSquare, { backgroundColor: roleConfig.accent }]} />
                <View style={[styles.miniSquare, { backgroundColor: roleConfig.headerBg }]} />
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 40,
  },
  headerBanner: {
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    ...premiumShadow('#00ff87', 'xs'),
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  bannerIconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
  },
  bannerSub: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    marginTop: 4,
    lineHeight: 18,
  },
  activePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activePillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  modeToggleWrap: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    padding: 4,
    borderRadius: RADIUS.md,
    gap: 4,
    marginLeft: 'auto',
  },
  modeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  modeBtnText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  toastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  toastText: {
    color: '#10b981',
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  subTabsRow: {
    flexDirection: 'row',
    gap: 20,
    borderBottomWidth: 1,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  subTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabBtnActive: {
    borderBottomWidth: 2,
  },
  subTabText: {
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  presetCard: {
    width: '49%',
    minWidth: 280,
    borderRadius: RADIUS.md,
    padding: 14,
    borderWidth: 1.5,
    justifyContent: 'space-between',
  },
  presetCardSelected: {
    ...premiumShadow('#00ff87', 'xs'),
  },
  presetTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  presetIconWrap: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  presetSub: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    marginTop: 2,
    lineHeight: 16,
  },
  selectedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  swatchDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  swatchLabel: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    marginLeft: 4,
  },
  modeBadgeMini: {
    marginLeft: 'auto',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  modeBadgeMiniText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  previewContainer: {
    gap: 16,
  },
  previewCard: {
    borderRadius: RADIUS.lg,
    padding: 18,
    borderWidth: 1,
  },
  previewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  previewDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  previewCardTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  previewCardTag: {
    fontSize: 12,
    fontFamily: FONT.medium,
  },
  previewSection: {
    marginBottom: 14,
  },
  previewSectionLabel: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  sampleBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: RADIUS.sm,
  },
  sampleBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  sampleBtnOutline: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1.5,
  },
  sampleBtnOutlineText: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  sampleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  sampleBadgeText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
  },
  swatchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  swatchItem: {
    width: '18%',
    minWidth: 110,
    padding: 10,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    alignItems: 'center',
  },
  swatchColorBox: {
    width: 28,
    height: 28,
    borderRadius: RADIUS.xs,
    marginBottom: 6,
  },
  swatchItemName: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
  },
  swatchItemHex: {
    fontSize: 10,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  rolesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  roleCard: {
    width: '32%',
    minWidth: 220,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
  },
  roleCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  roleBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  roleKeyText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
  },
  roleNameText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    marginTop: 2,
  },
  roleBadgeSub: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  roleSwatchStrip: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  miniSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
  },
});
