import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, useWindowDimensions } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/store/auth-context';
import { FONT } from '@/constants/theme';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';

export default function PublicHeader({ 
  onCartPress, 
  cartItemCount 
}: { 
  onCartPress?: () => void;
  cartItemCount?: number;
} = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { user } = useAuth();

  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (!user) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 1500 }),
          withTiming(1, { duration: 1500 })
        ),
        -1, // infinite loop
        true // reverse
      );
    }
  }, [user]);

  const pulseStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }]
    };
  });

  const getLinkStyle = (path: string) => {
    const isActive = pathname === path || (path === '/' && pathname === '/index');
    return [
      styles.navLink, 
      isActive && { color: '#f59e0b', borderBottomWidth: 2, borderBottomColor: '#f59e0b', paddingBottom: 2 }
    ];
  };

  return (
    <View style={[styles.floatingHeader, !isDesktop && styles.floatingHeaderMobile]}>
      <TouchableOpacity style={styles.logoContainer} onPress={() => router.push('/')}>
        <Image source={require('@/assets/images/farmsking_logo_transparent_bg.png')} style={{ width: 36, height: 36, marginRight: 8 }} resizeMode="contain" />
        <Text style={styles.logoText}>FarmsKing</Text>
      </TouchableOpacity>

      {isDesktop && (
        <View style={styles.navLinks}>
          <TouchableOpacity onPress={() => router.push('/')}>
            <Text style={getLinkStyle('/')}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/shop')}>
            <Text style={getLinkStyle('/shop')}>Store</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/support')}>
            <Text style={getLinkStyle('/support')}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/contact-us')}>
            <Text style={getLinkStyle('/contact-us')}>Contact Us</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {onCartPress && (
          <TouchableOpacity
            style={{ backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', gap: 6 }}
            activeOpacity={0.85}
            onPress={onCartPress}
          >
            <Ionicons name="cart" size={18} color="#fff" />
            {cartItemCount && cartItemCount > 0 ? (
              <View style={{ backgroundColor: '#ef4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                <Text style={{ color: '#fff', fontSize: 10, fontFamily: FONT.bold }}>{cartItemCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        )}

        {user ? (
          <TouchableOpacity 
            style={[styles.loginBtn, { backgroundColor: '#10b981', borderColor: '#059669' }]}
            onPress={() => router.push('/(tabs)')}
            activeOpacity={0.8}
          >
            <Text style={[styles.loginBtnText, { color: '#ffffff' }]}>
              Welcome, {user.name ? user.name.split(' ')[0] : 'User'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Animated.View style={pulseStyle}>
            <TouchableOpacity 
              style={styles.loginBtn}
              onPress={() => router.push('/(auth)/login')}
              activeOpacity={0.8}
            >
              <Text style={styles.loginBtnText}>Login / App</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingHeader: {
    alignSelf: 'center',
    position: 'absolute',
    top: 20,
    width: '90%',
    maxWidth: 1200,
    backgroundColor: 'rgba(20, 30, 45, 0.85)',
    borderRadius: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 12,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  floatingHeaderMobile: {
    width: '95%',
    top: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 20,
    fontFamily: FONT.extraBold,
    color: '#fff',
    letterSpacing: 0.5,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navLink: {
    color: '#e2e8f0',
    fontSize: 15,
    fontFamily: FONT.bold,
  },
  loginBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  loginBtnText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
});
