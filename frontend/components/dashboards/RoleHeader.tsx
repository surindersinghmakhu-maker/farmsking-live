import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, RADIUS } from '@/constants/theme';
import { useUnreadNotificationCount } from '@/src/hooks/useNotifications';
import { Avatar } from '@/src/components/Avatar';
import { useCart } from '@/src/store/cart-context';

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
  const showShopShortcut = currentRole !== 'CUSTOMER' && currentRole !== 'ADMIN';
  const greeting = getTimeBasedGreeting();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;
  const { itemCount: cartItemCount } = useCart();

  return (
    <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerContainer}>
      {/* Top Banner Row: Bell */}
      <View style={[styles.topRow, styles.topRowEnd]}>
        <View style={styles.actionsRight}>
          {showShopShortcut && (
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.75}
              onPress={() => router.push('/(tabs)/categories')}
            >
              <Ionicons name="cart-outline" size={19} color="#fff" />
              {cartItemCount > 0 ? (
                <View style={styles.notifDot}>
                  {cartItemCount <= 9 ? <Text style={styles.notifDotText}>{cartItemCount}</Text> : null}
                </View>
              ) : null}
            </TouchableOpacity>
          )}

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

      {/* User Info Row */}
      <View style={styles.userRow}>
        <View style={styles.userInfoLeft}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.nameText}>{profileName}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
          {planBadge ?? null}
        </View>

        <TouchableOpacity
          style={styles.avatarRing}
          activeOpacity={currentRole === 'ADMIN' ? 1 : 0.8}
          disabled={currentRole === 'ADMIN'}
          onPress={() => router.push('/profile')}
        >
          <Avatar uri={avatarUrl} size={47} />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'web' ? 6 : 4,
    paddingHorizontal: 20,
    paddingBottom: 6,
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
    marginBottom: 0,
  },
  topRowEnd: {
    justifyContent: 'flex-end',
  },
  actionsRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  userInfoLeft: {
    flex: 1,
  },
  greetingText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
    fontFamily: FONT.medium,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 21,
    fontFamily: FONT.extraBold,
    marginTop: 0,
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12.5,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  avatarRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2.5,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
});
