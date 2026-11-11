import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Platform, useWindowDimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, RADIUS } from '@/constants/theme';
import { useUnreadNotificationCount } from '@/src/hooks/useNotifications';
import { Avatar } from '@/src/components/Avatar';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useAuth } from '@/src/store/auth-context';
import { useLanguage } from '@/src/store/language-context';

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
  AGENT: { label: 'Agent', icon: '💼' },
  SELLER: { label: 'Seller Partner', icon: '🏪' },
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
  const theme = RoleThemes[currentRole] || RoleThemes.FARM_ADVISOR || RoleThemes.FARMER;
  const { colors, toggleThemeMode, isDark } = useExecutiveTheme();
  const { t } = useLanguage();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const router = useRouter();
  
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return t('goodMorning', 'Good Morning');
    if (hour < 17) return t('goodAfternoon', 'Good Afternoon');
    if (hour < 21) return t('goodEvening', 'Good Evening');
    return t('goodNight', 'Good Night');
  };
  const greeting = getGreeting();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: settings } = useAppSettings();
  const { logout } = useAuth();

  const roleMeta = ROLE_DISPLAY[currentRole] || { label: currentRole, icon: '👤' };

  const getRoleLabel = (r: string): string => {
    switch (r) {
      case 'FARMER': return t('tabFarmers', 'Farmer');
      case 'GARDENER': return t('tabGardens', 'Gardener');
      case 'FARM_ADVISOR': return t('cropDoctor', 'Crop Doctor');
      case 'ADMIN': return t('tabAdminHome', 'Admin');
      case 'SUPER_ADMIN': return t('tabSuperAdminHome', 'Super Admin');
      case 'LABOUR': return t('tabLabour', 'Labour');
      case 'CUSTOMER': return t('tabCustomerHome', 'Customer');
      default: return roleMeta.label || r;
    }
  };

  const isRedundantSubtitle =
    !subtitle ||
    subtitle.trim().toLowerCase() === `${roleMeta.label.toLowerCase()} profile` ||
    subtitle.trim().toLowerCase() === roleMeta.label.toLowerCase();

  return (
    <LinearGradient colors={colors.headerGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.headerContainer, isDesktop && styles.headerContainerDesktop, { borderColor: colors.cardBorder, borderWidth: isDesktop ? 1 : 0 }]}>
      {/* User Header Block */}
      <View style={[styles.userHeaderBlock, isDesktop && styles.userHeaderBlockDesktop]}>
        <View style={styles.mainUserRow}>
          {/* Left Block: Greeting + Name + Assigned Role Tag + Subtitle */}
          <View style={styles.userInfoLeftBlock}>
            <Text style={[styles.greetingText, { color: colors.isDark ? 'rgba(255,255,255,0.85)' : '#0f172a' }]}>{greeting}</Text>
            <Text style={[styles.nameText, { color: colors.isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>{profileName}</Text>
            
            {/* Role Tag Badge */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 3, flexWrap: 'wrap' }}>
              <View style={[
                styles.roleTagPill,
                {
                  backgroundColor: colors.isDark ? 'rgba(255, 255, 255, 0.22)' : '#dcfce7',
                  borderColor: colors.isDark ? 'rgba(255, 255, 255, 0.35)' : '#86efac',
                }
              ]}>
                <Text style={[styles.roleTagText, { color: colors.isDark ? '#ffffff' : '#14532d' }]}>{roleMeta.icon} {getRoleLabel(currentRole)}</Text>
              </View>
            </View>

            {!isRedundantSubtitle && currentRole !== 'FARMER' ? (
              <Text style={[styles.subtitleText, { color: colors.isDark ? 'rgba(255,255,255,0.95)' : '#0f172a' }]}>{subtitle}</Text>
            ) : null}
          </View>

          {/* Center Block: Profile Photo Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={[
                styles.avatarRing,
                {
                  borderColor: colors.isDark ? 'rgba(255,255,255,0.2)' : '#cbd5e1',
                  borderWidth: 1.5,
                }
              ]}
              activeOpacity={currentRole === 'ADMIN' ? 1 : 0.8}
              disabled={currentRole === 'ADMIN'}
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
                <Ionicons name="checkmark-circle" size={15} color="#10b981" />
              </View>
            ) : null}
          </View>

          {/* Right Block: Secondary Avatar or Plan Badge + Light/Dark Theme Switcher */}
          <View style={styles.headerRightActions}>
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
                <Text style={[styles.secondaryAvatarName, { color: colors.isDark ? '#ffffff' : '#0f172a' }]} numberOfLines={1}>
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
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'web' ? 6 : 4,
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  headerContainerDesktop: {
    paddingTop: 14,
    paddingBottom: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.lg,
    marginHorizontal: 16,
    marginTop: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 0,
    marginBottom: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandNameText: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  logoutText: {
    color: '#fca5a5',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 2,
    backgroundColor: '#fb7185',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 2,
    right: 2,
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
    marginTop: 2,
    marginBottom: 2,
  },
  userHeaderBlockDesktop: {
    marginTop: 0,
    marginBottom: 0,
  },
  mainUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  userInfoLeftBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  greetingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginVertical: 1,
  },
  roleTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
    marginVertical: 2,
  },
  roleTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 12,
    fontFamily: FONT.extraBold,
    marginTop: 2,
  },
  avatarContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  avatarRing: {
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
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
    backgroundColor: '#16a34a',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
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
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerCropBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ffffff',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#16a34a',
  },
  secondaryAvatarName: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginTop: 2,
    maxWidth: 80,
    textAlign: 'center',
  },
  headerRightActions: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  mobileThemeToggle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  mobileThemeToggleDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  mobileThemeToggleLight: {
    backgroundColor: '#ffffff',
    borderColor: '#cbd5e1',
  },
});
