import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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
  const theme = RoleThemes[currentRole] || RoleThemes.FARM_ADVISOR || RoleThemes.FARMER;
  const { colors } = useExecutiveTheme();
  const router = useRouter();
  const greeting = getTimeBasedGreeting();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: settings } = useAppSettings();

  const roleMeta = ROLE_DISPLAY[currentRole] || { label: currentRole, icon: '👤' };

  return (
    <View style={styles.headerContainer}>
      {/* Top Banner Row: Super Admin Logo + Action Icons */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <BrandLogo size={28} iconColor="#10b981" />
          <Text style={styles.brandNameText}>{settings?.appName || 'FarmsKing'}</Text>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.75}
            onPress={() => router.push('/notifications' as never)}
          >
            <Ionicons name="notifications-outline" size={19} color="#475569" />
            {unreadCount > 0 ? (
              <View style={styles.notifDot}>
                {unreadCount <= 9 ? <Text style={styles.notifDotText}>{unreadCount}</Text> : null}
              </View>
            ) : null}
          </TouchableOpacity>
        </View>
      </View>

      {/* User Header Block */}
      <View style={styles.userHeaderBlock}>
        <View style={styles.mainUserRow}>
          {/* Left Block: Greeting + Name + Assigned Role Tag + Subtitle */}
          <View style={styles.userInfoLeftBlock}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.nameText} numberOfLines={1}>{profileName}</Text>
            
            {/* 🏷️ Role Tag Badge directly under user's name */}
            <View style={styles.roleTagPill}>
              <Text style={styles.roleTagText}>{roleMeta.icon} {roleMeta.label}</Text>
            </View>

            {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
          </View>

          {/* Center Block: Profile Photo Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatarRing}
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
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'web' ? 12 : 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomLeftRadius: RADIUS.xl,
    borderBottomRightRadius: RADIUS.xl,
    backgroundColor: '#04180d',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.3)',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
    overflow: 'visible',
    position: 'relative',
    zIndex: 10,
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
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    paddingHorizontal: 2,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
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
    marginTop: 8,
    marginBottom: 4,
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
    color: '#94a3b8',
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 20,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.3,
    lineHeight: 24,
    marginVertical: 2,
  },
  roleTagPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.4)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginVertical: 4,
  },
  roleTagText: {
    color: '#00ff87',
    fontSize: 11,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
  },
  subtitleText: {
    color: '#34d399',
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
    width: 62,
    height: 62,
    borderRadius: 31,
    padding: 2.5,
    backgroundColor: 'rgba(0, 255, 135, 0.3)',
    borderWidth: 1.5,
    borderColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#04180d',
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
    backgroundColor: '#00ff87',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#04180d',
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
    backgroundColor: 'rgba(0, 255, 135, 0.2)',
    borderWidth: 1,
    borderColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmerCropBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#04180d',
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#00ff87',
  },
  secondaryAvatarName: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginTop: 2,
    maxWidth: 80,
    textAlign: 'center',
  },
});
