import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/store/auth-context';
import { useCart } from '@/src/store/cart-context';
import { FONT, RADIUS } from '@/constants/theme';

export default function PublicBottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const { user } = useAuth();
  const { items } = useCart();

  const totalCartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Only render on mobile view
  if (!isMobile) return null;

  // Do not render inside authenticated tabs or auth flows
  const inAuthGroup = pathname.startsWith('/(auth)') || pathname === '/login' || pathname === '/register';
  const inUserTabs = pathname.startsWith('/(user)') || pathname.startsWith('/(partner)');
  if (inAuthGroup || inUserTabs) {
    return null;
  }

  // Active route helpers
  const isHomeActive = pathname === '/' || pathname === '/index' || pathname === '';
  const isStoreActive = pathname.startsWith('/shop');
  const isScanActive = pathname.startsWith('/crop-intelligence') || pathname.startsWith('/crop-disease-scanner');
  const isTopicActive = pathname.startsWith('/topic');

  const handleTabPress = (targetPath: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.push(targetPath as any);
  };

  const handleUserTabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (user) {
      if (['BUSINESS_PARTNER', 'ADVISOR', 'FARM_ADVISOR', 'GARDEN_ADVISOR', 'TECHNICAL_TRAINER'].includes(user.role || '')) {
        router.push('/(partner)/(tabs)' as any);
      } else {
        router.push('/(user)/(tabs)' as any);
      }
    } else {
      router.push('/(auth)/login' as any);
    }
  };

  return (
    <View style={styles.fixedWrapper} pointerEvents="box-none">
      <View style={styles.barContainer}>
        {Platform.OS === 'web' && (
          <BlurView intensity={35} tint="dark" style={StyleSheet.absoluteFill} />
        )}

        {/* Top Glowing Laser Accent Bar */}
        <LinearGradient
          colors={['#00ff87', '#10b981', '#059669']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.topLaserBar}
        />

        {/* 1. Home Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress('/')}
          activeOpacity={0.75}
        >
          {isHomeActive && <View style={styles.activePillGlow} />}
          <Ionicons
            name={isHomeActive ? 'home' : 'home-outline'}
            size={21}
            color={isHomeActive ? '#00ff87' : '#94a3b8'}
          />
          <Text style={[styles.tabLabel, isHomeActive && styles.tabLabelActive]}>
            Home
          </Text>
        </TouchableOpacity>

        {/* 2. Store Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress('/shop')}
          activeOpacity={0.75}
        >
          {isStoreActive && <View style={styles.activePillGlow} />}
          <View style={styles.iconContainer}>
            <Ionicons
              name={isStoreActive ? 'cart' : 'cart-outline'}
              size={22}
              color={isStoreActive ? '#00ff87' : '#94a3b8'}
            />
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>
                  {totalCartCount > 99 ? '99+' : totalCartCount}
                </Text>
              </View>
            )}
          </View>
          <Text style={[styles.tabLabel, isStoreActive && styles.tabLabelActive]}>
            Store
          </Text>
        </TouchableOpacity>

        {/* 3. Center AI Scanner Button */}
        <TouchableOpacity
          style={styles.centerScanWrap}
          onPress={() => handleTabPress('/crop-intelligence')}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={['#00ff87', '#059669', '#047857']}
            style={styles.centerScanInner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="scan" size={24} color="#02120a" />
          </LinearGradient>
          <Text style={[styles.tabLabel, isScanActive && styles.tabLabelActive, { marginTop: 2 }]}>
            AI Scan
          </Text>
        </TouchableOpacity>

        {/* 4. Doctors / Topics Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={() => handleTabPress('/topic/Crop-Doctors')}
          activeOpacity={0.75}
        >
          {isTopicActive && <View style={styles.activePillGlow} />}
          <Ionicons
            name={isTopicActive ? 'medkit' : 'medkit-outline'}
            size={21}
            color={isTopicActive ? '#00ff87' : '#94a3b8'}
          />
          <Text style={[styles.tabLabel, isTopicActive && styles.tabLabelActive]}>
            Doctors
          </Text>
        </TouchableOpacity>

        {/* 5. Account / Login Tab */}
        <TouchableOpacity
          style={styles.tabBtn}
          onPress={handleUserTabPress}
          activeOpacity={0.75}
        >
          <Ionicons
            name={user ? 'grid-outline' : 'person-circle-outline'}
            size={22}
            color="#94a3b8"
          />
          <Text style={styles.tabLabel} numberOfLines={1}>
            {user ? 'Dashboard' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fixedWrapper: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
  },
  barContainer: {
    flexDirection: 'row',
    height: 64,
    maxWidth: 540,
    width: '100%',
    backgroundColor: 'rgba(2, 13, 6, 0.96)',
    borderTopWidth: 1.5,
    borderTopColor: 'rgba(0, 255, 135, 0.28)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: 'rgba(0, 255, 135, 0.15)',
    borderRightColor: 'rgba(0, 255, 135, 0.15)',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingTop: 4,
    paddingBottom: 6,
    position: 'relative',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 12,
  },
  topLaserBar: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: 2.5,
    borderRadius: 2,
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 4,
    position: 'relative',
  },
  activePillGlow: {
    position: 'absolute',
    top: 3,
    bottom: 3,
    left: 8,
    right: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 135, 0.10)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -5,
    right: -10,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#020d06',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: FONT.extraBold,
    lineHeight: 11,
  },
  centerScanWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -16,
  },
  centerScanInner: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#020d06',
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    letterSpacing: -0.2,
    textAlign: 'center',
  },
  tabLabelActive: {
    color: '#00ff87',
  },
});
