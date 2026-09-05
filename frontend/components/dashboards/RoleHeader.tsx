import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useUnreadNotificationCount } from '@/src/hooks/useNotifications';
import { Avatar } from '@/src/components/Avatar';
import { useCart } from '@/src/store/cart-context';
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
  const showShopShortcut = currentRole !== 'CUSTOMER' && currentRole !== 'ADMIN';
  const greeting = getTimeBasedGreeting();
  const { data: unreadData } = useUnreadNotificationCount();
  const unreadCount = unreadData?.count ?? 0;
  const { itemCount: cartItemCount } = useCart();
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
          {/* Agri Store button removed as requested */}

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

      {/* 3-Column User Row */}
      <View style={styles.userRow}>
        {/* Left Column: Greeting, Name, Subtitle/Role */}
        <View style={styles.userInfoLeft}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.nameText} numberOfLines={1}>{profileName}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>

        {/* Center Column: Profile Photo */}
        <View style={styles.avatarCenter}>
          <View style={{ position: 'relative' }}>
            <TouchableOpacity
              style={styles.avatarRing}
              activeOpacity={currentRole === 'ADMIN' ? 1 : 0.8}
              disabled={currentRole === 'ADMIN'}
              onPress={() => router.push('/profile')}
            >
              <Avatar uri={avatarUrl} size={66} />
            </TouchableOpacity>

            {/* Verified Symbol Badge attached to Profile Photo */}
            {currentRole === 'FARM_ADVISOR' || currentRole === 'GARDEN_ADVISOR' ? (
              <View
                style={{
                  position: 'absolute',
                  bottom: -1,
                  right: -1,
                  backgroundColor: '#ffffff',
                  borderRadius: 9,
                  padding: 1,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 2,
                  elevation: 3,
                }}
              >
                <Ionicons name="checkmark-circle" size={17} color="#10b981" />
              </View>
            ) : null}
          </View>

          {/* Rating & Review count chip directly under Advisor Photo */}
          {currentRole === 'FARM_ADVISOR' || currentRole === 'GARDEN_ADVISOR' ? (
            <View
              style={{
                marginTop: 2,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 3,
                backgroundColor: 'rgba(255, 255, 255, 0.22)',
                paddingHorizontal: 7,
                paddingVertical: 1.5,
                borderRadius: 10,
              }}
            >
              <Ionicons name="star" size={10} color="#fde047" />
              <Text style={{ fontSize: 10, fontFamily: FONT.extraBold, color: '#ffffff' }}>4.9 ★</Text>
              <Text style={{ fontSize: 9, fontFamily: FONT.bold, color: '#e2e8f0' }}>(52)</Text>
            </View>
          ) : null}
        </View>

        {/* Right Column: Vertically Stacked Plan Items */}
        <View style={styles.planRight}>
          {planBadge ?? null}
        </View>
      </View>

    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'web' ? 4 : 2,
    paddingHorizontal: 16,
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
    marginBottom: 2,
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
  shopPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fbbf24',
    borderWidth: 1,
    borderColor: '#f59e0b',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    ...premiumShadow('#000000', 'sm'),
  },
  shopPillText: {
    color: '#78350f',
    fontSize: 11.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.1,
  },
  cartBadgeInline: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT.extraBold,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  userInfoLeft: {
    flex: 1.2,
    justifyContent: 'center',
  },
  greetingText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  nameText: {
    color: '#ffffff',
    fontSize: 17,
    fontFamily: FONT.extraBold,
    marginTop: 0,
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 11.5,
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  avatarCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    padding: 2.5,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRight: {
    flex: 1.2,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
});
