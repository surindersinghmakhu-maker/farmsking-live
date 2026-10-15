import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, RADIUS, THEME_4D } from '@/constants/theme';
import { useUnreadNotificationCount } from '@/src/hooks/useNotifications';
import { Avatar } from '@/src/components/Avatar';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { MobilePillarsMenuModal } from '@/components/MobilePillarsMenuModal';

interface RoleHeaderProps {
  currentRole: UserRole;
  profileName: string;
  subtitle?: string;
  avatarUrl?: string;
  secondaryAvatarUrl?: string;
  secondaryName?: string;
  /** Optional badge to render below the subtitle (e.g. plan name pill) */
  planBadge?: React.ReactNode;
  onAvatarPress?: () => void;
  onSecondaryAvatarPress?: () => void;
}

const ROLE_DISPLAY: Record<string, { label: string; icon: string }> = {
  FARMER: { label: 'Farmer', icon: '🌾' },
  GARDENER: { label: 'Gardener', icon: '🏡' },
  FARM_ADVISOR: { label: 'Crop Doctor / Advisor', icon: '🩺' },
  GARDEN_ADVISOR: { label: 'Garden Advisor', icon: '🌱' },
  TECHNICAL_TRAINER: { label: 'Technical Trainer', icon: '🎓' },
  BUSINESS_PARTNER: { label: 'Business Partner', icon: '💼' },
  CUSTOMER: { label: 'Customer', icon: '🛒' },
  ADMIN: { label: 'Admin', icon: '🛡️' },
  SUPER_ADMIN: { label: 'Super Admin', icon: '👑' },
  OPERATOR: { label: 'Operator', icon: '⚙️' },
  LABOUR: { label: 'Labour / Worker', icon: '👷' },
};

function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export const RoleHeader: React.FC<RoleHeaderProps> = ({
  currentRole,
  profileName,
  subtitle,
  avatarUrl,
  secondaryAvatarUrl,
  secondaryName,
  planBadge,
  onAvatarPress,
  onSecondaryAvatarPress,
}) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { colors, themeMode, setThemeMode } = useExecutiveTheme();
  const isLight = themeMode === 'LIGHT';
  const isDarkTheme = themeMode === 'DARK';
  const router = useRouter();
  const greeting = getTimeBasedGreeting();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: settings } = useAppSettings();

  const roleMeta = ROLE_DISPLAY[currentRole] || { label: currentRole, icon: '👤' };
  const [showPillarsModal, setShowPillarsModal] = useState(false);

  // Animated sliding pill for mobile theme switch
  const themeAnim = useRef(new Animated.Value(themeMode === 'LIGHT' ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(themeAnim, {
      toValue: themeMode === 'LIGHT' ? 0 : 1,
      friction: 9,
      tension: 65,
      useNativeDriver: false,
    }).start();
  }, [themeMode]);

  const handleToggleTheme = (mode: 'LIGHT' | 'DARK') => {
    setThemeMode(mode);
  };

  return (
    <View
      style={[
        styles.headerContainer,
        isLight && {
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          borderBottomColor: 'rgba(22, 163, 74, 0.18)',
          shadowColor: '#16a34a',
        },
        isDarkTheme && {
          backgroundColor: 'rgba(11, 19, 41, 0.92)',
          borderBottomColor: 'rgba(56, 189, 248, 0.22)',
          shadowColor: '#38bdf8',
        },
      ]}
    >
      {/* Top Banner Row: Only show brand on Mobile where sidebar is hidden */}
      {!isDesktop && (
        <View style={styles.topRow}>
          <View style={styles.brandRow}>
            <BrandLogo size={28} iconColor={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#059669'} />
            <Text style={[styles.brandNameText, isLight && { color: '#0f172a' }]}>{settings?.appName || 'FarmsKing'}</Text>
          </View>

          <View style={styles.actionsRight}>
            {/* 🎨 Mobile 2-Way Theme Switcher (Light · Dark) */}
            <View
              style={[
                styles.mobileThemePillWrap,
                isLight && styles.mobileThemePillWrapLight,
                isDarkTheme && styles.mobileThemePillWrapDark,
              ]}
            >
              <Animated.View
                style={[
                  styles.slidingMobileThemePill,
                  isLight ? styles.slidingMobileThemePillLight : styles.slidingMobileThemePillDark,
                  {
                    left: themeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['2%', '52%'],
                    }),
                  },
                ]}
              />
              <TouchableOpacity
                style={styles.mobileThemeSegmentBtn}
                onPress={() => handleToggleTheme('LIGHT')}
                activeOpacity={0.75}
                accessibilityLabel="Switch to Light Theme"
              >
                <Ionicons
                  name={themeMode === 'LIGHT' ? 'sunny' : 'sunny-outline'}
                  size={13}
                  color={themeMode === 'LIGHT' ? '#16a34a' : isLight ? '#64748b' : '#94a3b8'}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mobileThemeSegmentBtn}
                onPress={() => handleToggleTheme('DARK')}
                activeOpacity={0.75}
                accessibilityLabel="Switch to Dark Theme"
              >
                <Ionicons
                  name={themeMode === 'DARK' ? 'leaf' : 'leaf-outline'}
                  size={13}
                  color={themeMode === 'DARK' ? '#22c55e' : isLight ? '#64748b' : '#94a3b8'}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.iconButton,
                isLight && {
                  backgroundColor: '#f1f5f9',
                  borderColor: 'rgba(22, 163, 74, 0.2)',
                },
                isDarkTheme && {
                  backgroundColor: 'rgba(2, 6, 23, 0.75)',
                  borderColor: 'rgba(56, 189, 248, 0.25)',
                },
              ]}
              activeOpacity={0.75}
              onPress={() => router.push('/notifications' as never)}
            >
              <Ionicons name="notifications-outline" size={18} color={isLight ? '#16a34a' : isDarkTheme ? '#38bdf8' : '#059669'} />
              {unreadCount > 0 ? (
                <View style={styles.notifDot}>
                  {unreadCount <= 9 ? <Text style={styles.notifDotText}>{unreadCount}</Text> : null}
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* User Header Block */}
      <View style={styles.userHeaderBlock}>
        <View style={styles.mainUserRow}>
          {/* Left Block: Greeting + Name + Assigned Role Tag + Subtitle */}
          <View style={styles.userInfoLeftBlock}>
            <Text style={[styles.greetingText, isLight && { color: '#64748b' }]}>{greeting}</Text>
            <Text style={[styles.nameText, isLight && { color: '#0f172a' }]} numberOfLines={1}>{profileName}</Text>

            {/* 🏷️ Role Tag Badge directly under user's name */}
            <View
              style={[
                styles.roleTagPill,
                isLight && {
                  backgroundColor: 'rgba(22, 163, 74, 0.10)',
                  borderColor: 'rgba(234, 179, 8, 0.35)',
                },
                isDarkTheme && {
                  backgroundColor: 'rgba(56, 189, 248, 0.12)',
                  borderColor: 'rgba(56, 189, 248, 0.35)',
                },
              ]}
            >
              <Text style={[styles.roleTagText, isLight && { color: '#16a34a' }, isDarkTheme && { color: '#38bdf8' }]}>
                {roleMeta.icon} {roleMeta.label}
              </Text>
            </View>

            {subtitle ? <Text style={[styles.subtitleText, isLight && { color: '#059669' }]}>{subtitle}</Text> : null}
          </View>

          {/* Center Block: Profile Photo Avatar (Hidden for Admin / Super Admin) */}
          {currentRole !== 'ADMIN' && currentRole !== 'SUPER_ADMIN' && (
            <View style={styles.avatarContainer}>
              <TouchableOpacity
                style={styles.avatarRing}
                activeOpacity={0.8}
                onPress={onAvatarPress || (() => router.push('/profile'))}
              >
                <Avatar uri={avatarUrl} size={54} />
                {currentRole === 'LABOUR' && (
                  <View style={styles.cameraIconBadge}>
                    <Ionicons name="camera" size={9} color="#ffffff" />
                  </View>
                )}
              </TouchableOpacity>

              {/* Verified Symbol Badge attached to Profile Photo */}
              {currentRole === 'FARM_ADVISOR' || currentRole === 'GARDEN_ADVISOR' ? (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={15} color={THEME_4D.neonEmerald} />
                </View>
              ) : null}
            </View>
          )}

          {/* Right Block: Secondary Avatar or Plan Badge */}
          {secondaryAvatarUrl !== undefined || secondaryName ? (
            <View style={styles.secondaryAvatarBlock}>
              <TouchableOpacity
                style={styles.secondaryAvatarRing}
                activeOpacity={0.85}
                onPress={onSecondaryAvatarPress}
              >
                <Avatar uri={secondaryAvatarUrl} size={46} />
                <View style={styles.farmerCropBadge}>
                  <Text style={{ fontSize: 8 }}>🌾</Text>
                </View>
              </TouchableOpacity>
              <Text style={styles.secondaryAvatarName} numberOfLines={1}>
                {secondaryName || 'Farmer'}
              </Text>
            </View>
          ) : planBadge ? (
            <View style={styles.planRightBlock}>
              {planBadge}
            </View>
          ) : null}
        </View>
      </View>

      {/* 📱 4D Mobile Domain Pillars Command Sheet */}
      <MobilePillarsMenuModal
        visible={showPillarsModal}
        onClose={() => setShowPillarsModal(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  pillarsMenuTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  pillarsMenuTriggerText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
    letterSpacing: 0.3,
  },
  headerContainer: {
    paddingTop: Platform.OS === 'web' ? 14 : 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    backgroundColor: 'rgba(4, 18, 10, 0.88)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.22)',
    shadowColor: THEME_4D.neonEmerald,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'visible',
    position: 'relative',
    zIndex: 10,
    ...(Platform.OS === 'web' ? ({ backdropFilter: 'blur(16px)' } as any) : {}),
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 6,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  brandNameText: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: THEME_4D.textPrimary,
    letterSpacing: 0.2,
  },
  telemetryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  telemetryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME_4D.neonEmerald,
    shadowColor: THEME_4D.neonEmerald,
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 2,
  },
  telemetryText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: THEME_4D.neonEmerald,
    letterSpacing: 0.8,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mobileThemePillWrap: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: RADIUS.pill,
    padding: 2,
    width: 56,
  },
  mobileThemePillWrapLight: {
    backgroundColor: '#f1f5f9',
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  mobileThemePillWrapDark: {
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  slidingMobileThemePill: {
    position: 'absolute',
    top: 2,
    bottom: 2,
    width: 24,
    borderRadius: 12,
    zIndex: 0,
  },
  slidingMobileThemePillLight: {
    backgroundColor: '#ffffff',
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  slidingMobileThemePillDark: {
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    borderWidth: 1.2,
    borderColor: '#fbbf24',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  mobileThemeSegmentBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    zIndex: 1,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(8, 34, 20, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 2,
    backgroundColor: THEME_4D.criticalRed,
    borderWidth: 1.5,
    borderColor: '#020905',
    position: 'absolute',
    top: -2,
    right: -2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDotText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT.bold,
    lineHeight: 11,
  },
  userHeaderBlock: {
    marginTop: 6,
    marginBottom: 4,
  },
  mainUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userInfoLeftBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    color: THEME_4D.textMuted,
    fontSize: 11.5,
    fontFamily: FONT.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  nameText: {
    color: THEME_4D.textPrimary,
    fontSize: 21,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.3,
    lineHeight: 26,
    marginVertical: 2,
  },
  roleTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginVertical: 4,
  },
  roleTagText: {
    color: THEME_4D.neonEmerald,
    fontSize: 11,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.3,
  },
  subtitleText: {
    color: '#a7f3d0',
    fontSize: 12,
    fontFamily: FONT.bold,
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: 32,
    padding: 2.5,
    backgroundColor: 'rgba(6, 26, 15, 0.95)',
    borderWidth: 2,
    borderColor: THEME_4D.neonEmerald,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: THEME_4D.neonEmerald,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#020905',
    borderRadius: 10,
    padding: 1,
    elevation: 3,
  },
  planRightBlock: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  cameraIconBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: THEME_4D.neonEmerald,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#020905',
  },
  secondaryAvatarBlock: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  secondaryAvatarRing: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    backgroundColor: 'rgba(6, 26, 15, 0.95)',
    borderWidth: 1.5,
    borderColor: THEME_4D.cyberGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerCropBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#020905',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: THEME_4D.neonEmerald,
  },
  secondaryAvatarName: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: THEME_4D.textSecondary,
    marginTop: 2,
    maxWidth: 80,
    textAlign: 'center',
  },
});
