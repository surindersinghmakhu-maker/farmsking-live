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

interface RoleHeaderProps {
  currentRole: UserRole;
  profileName: string;
  subtitle?: string;
  avatarUrl?: string;
  /** Optional badge to render below the subtitle (e.g. plan name pill) */
  planBadge?: React.ReactNode;
}

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
  planBadge,
}) => {
  const theme = RoleThemes[currentRole];
  const router = useRouter();
  const greeting = getTimeBasedGreeting();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;
  const { data: settings } = useAppSettings();

  return (
    <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerContainer}>
      {/* Top Banner Row: Super Admin Logo + Action Icons */}
      <View style={styles.topRow}>
        <View style={styles.brandRow}>
          <BrandLogo size={28} iconColor="#ffffff" />
          <Text style={styles.brandNameText}>{settings?.appName || 'FarmsKing'}</Text>
        </View>

        <View style={styles.actionsRight}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.75}
            onPress={() => router.push('/notifications' as never)}
          >
            <Ionicons name="notifications-outline" size={19} color="#fff" />
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
          {/* Left Block: Greeting + Name + Subtitle (Grouped together with zero gap) */}
          <View style={styles.userInfoLeftBlock}>
            <Text style={styles.greetingText}>{greeting}</Text>
            <Text style={styles.nameText} numberOfLines={1}>{profileName}</Text>
            {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
          </View>

          {/* Center Block: Elevated Profile Photo Avatar */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity
              style={styles.avatarRing}
              activeOpacity={currentRole === 'ADMIN' ? 1 : 0.8}
              disabled={currentRole === 'ADMIN'}
              onPress={() => router.push('/profile')}
            >
              <Avatar uri={avatarUrl} size={56} />
            </TouchableOpacity>

            {/* Verified Symbol Badge attached to Profile Photo */}
            {currentRole === 'FARM_ADVISOR' || currentRole === 'GARDEN_ADVISOR' ? (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={15} color="#10b981" />
              </View>
            ) : null}
          </View>

          {/* Right Block: Renew/Upgrade Plan Badge */}
          {planBadge ? (
            <View style={styles.planRightBlock}>
              {planBadge}
            </View>
          ) : null}
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
  mainUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  userInfoLeftBlock: {
    flex: 1.4,
    justifyContent: 'center',
  },
  greetingText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.3,
    lineHeight: 22,
    marginVertical: 0.5,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 11.5,
    fontFamily: FONT.bold,
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
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
