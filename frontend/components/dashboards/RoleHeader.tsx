import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, RADIUS } from '@/constants/theme';

interface RoleHeaderProps {
  currentRole: UserRole;
  profileName: string;
  subtitle?: string;
  avatarUrl?: string;
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
}) => {
  const theme = RoleThemes[currentRole];
  const router = useRouter();
  const showShopShortcut = currentRole !== 'CUSTOMER' && currentRole !== 'ADMIN';
  const greeting = getTimeBasedGreeting();

  return (
    <LinearGradient colors={theme.gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.headerContainer}>
      {/* Top Banner Row: Logo + Role Selector + Bell */}
      <View style={styles.topRow}>
        <View style={styles.brandContainer}>
          <View style={styles.brandIconBadge}>
            <Ionicons name="leaf" size={16} color={theme.primary} />
          </View>
          <Text style={styles.brandText}>FarmsKing</Text>
        </View>

        <View style={styles.actionsRight}>
          {showShopShortcut && (
            <TouchableOpacity
              style={styles.iconButton}
              activeOpacity={0.75}
              onPress={() => router.push('/(tabs)/categories')}
            >
              <Ionicons name="cart-outline" size={19} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
            <Ionicons name="notifications-outline" size={19} color="#fff" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        </View>
      </View>

      {/* User Info Row */}
      <View style={styles.userRow}>
        <View style={styles.userInfoLeft}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.nameText}>{profileName}</Text>
          {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        </View>

        <TouchableOpacity style={styles.avatarRing} activeOpacity={0.8} onPress={() => router.push('/profile')}>
          <Image
            source={{
              uri: avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            }}
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    paddingTop: Platform.OS === 'web' ? 22 : 40,
    paddingHorizontal: 20,
    paddingBottom: 22,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#ffffff',
    fontSize: 19,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.2,
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
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fb7185',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    position: 'absolute',
    top: 5,
    right: 5,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 23,
    fontFamily: FONT.extraBold,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontFamily: FONT.medium,
    marginTop: 3,
  },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
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
