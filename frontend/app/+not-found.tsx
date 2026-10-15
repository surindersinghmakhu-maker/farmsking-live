import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '@/src/components/BrandLogo';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';
import YouPage from './you/index';

export default function NotFoundScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('farmsking_theme_mode');
      if (savedTheme === 'night' || savedTheme === 'day') {
        setThemeMode(savedTheme);
      }
      const handleStorage = () => {
        const t = localStorage.getItem('farmsking_theme_mode');
        if (t === 'night' || t === 'day') setThemeMode(t);
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const toggleTheme = (mode: 'day' | 'night') => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmsking_theme_mode', mode);
      window.dispatchEvent(new Event('storage'));
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('you') || path.includes('dose') || path.includes('my')) {
        router.replace('/you');
      }
    }
  }, []);

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('you') || path.includes('dose') || path.includes('my')) {
      return <YouPage />;
    }
  }

  const isDay = themeMode === 'day';

  return (
    <View style={[styles.container, isDay ? styles.containerDay : styles.containerNight]}>
      <Stack.Screen options={{ title: 'Page Not Found • FarmsKing', headerShown: false }} />

      {/* Floating Public Header */}
      <PublicHeader themeMode={themeMode} onThemeToggle={toggleTheme} />

      {/* Ambient background glows */}
      <View style={styles.glowOrbMint} pointerEvents="none" />
      <View style={styles.glowOrbBlue} pointerEvents="none" />

      <View style={[styles.contentCard, isDay ? styles.cardDay : styles.cardNight, isMobile && styles.cardMobile]}>
        <BrandLogo size={64} useHdQuality style={{ marginBottom: 16 }} />

        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>ERROR 404</Text>
        </View>

        <Text style={[styles.title, isDay ? styles.titleDay : styles.titleNight]}>
          Page Not Found
        </Text>

        <Text style={[styles.subtitle, isDay ? styles.subtitleDay : styles.subtitleNight]}>
          The agronomy page or portal screen you are looking for might have been relocated, renamed, or is temporarily unavailable.
        </Text>

        {/* Quick Navigation Action Grid */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionBtnPrimary}
            onPress={() => router.push('/')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#059669', '#047857']}
              style={styles.actionBtnGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="home" size={17} color="#ffffff" />
              <Text style={styles.actionBtnPrimaryText}>Return to Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtnSecondary, isDay ? styles.btnSecDay : styles.btnSecNight]}
            onPress={() => router.push('/support')}
            activeOpacity={0.8}
          >
            <Ionicons name="headset-outline" size={17} color={isDay ? '#059669' : '#34d399'} />
            <Text style={[styles.actionBtnSecText, isDay ? styles.btnSecTextDay : styles.btnSecTextNight]}>
              Farmer Support Desk
            </Text>
          </TouchableOpacity>
        </View>

        {/* Popular destinations */}
        <View style={styles.destinationsRow}>
          <Text style={[styles.destinationsTitle, isDay ? styles.destDay : styles.destNight]}>
            Explore FarmsKing Portals:
          </Text>
          <View style={styles.linksRow}>
            <TouchableOpacity onPress={() => router.push('/#mandi-rates')} activeOpacity={0.7}>
              <Text style={styles.linkText}>Mandi Rates</Text>
            </TouchableOpacity>
            <Text style={styles.dotSeparator}>•</Text>
            <TouchableOpacity onPress={() => router.push('/#agri-store')} activeOpacity={0.7}>
              <Text style={styles.linkText}>Agri Store</Text>
            </TouchableOpacity>
            <Text style={styles.dotSeparator}>•</Text>
            <TouchableOpacity onPress={() => router.push('/order-tracking')} activeOpacity={0.7}>
              <Text style={styles.linkText}>Order Tracking</Text>
            </TouchableOpacity>
            <Text style={styles.dotSeparator}>•</Text>
            <TouchableOpacity onPress={() => router.push('/contact-us')} activeOpacity={0.7}>
              <Text style={styles.linkText}>Contact Us</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    position: 'relative',
  },
  containerDay: {
    backgroundColor: '#f8fafc',
  },
  containerNight: {
    backgroundColor: '#031a16',
  },
  glowOrbMint: {
    position: 'absolute',
    top: -120,
    right: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    ...(Platform.OS === 'web' ? { filter: 'blur(90px)' } : {}),
  },
  glowOrbBlue: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(14, 165, 233, 0.1)',
    ...(Platform.OS === 'web' ? { filter: 'blur(80px)' } : {}),
  },
  contentCard: {
    width: '100%',
    maxWidth: 540,
    borderRadius: 24,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    marginTop: 60,
  },
  cardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.08)' }
      : { elevation: 6 }),
  },
  cardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }
      : { elevation: 8 }),
  },
  cardMobile: {
    padding: 24,
    borderRadius: 20,
  },
  codeBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    marginBottom: 12,
  },
  codeText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ef4444',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 26,
    fontFamily: FONT.extraBold,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  titleDay: {
    color: '#0f172a',
  },
  titleNight: {
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: FONT.regular,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 420,
    marginBottom: 26,
  },
  subtitleDay: {
    color: '#64748b',
  },
  subtitleNight: {
    color: '#94a3b8',
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  actionBtnPrimary: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  actionBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
  },
  actionBtnPrimaryText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
  },
  btnSecDay: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  btnSecNight: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  actionBtnSecText: {
    fontSize: 14,
    fontFamily: FONT.bold,
  },
  btnSecTextDay: {
    color: '#059669',
  },
  btnSecTextNight: {
    color: '#34d399',
  },
  destinationsRow: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    width: '100%',
  },
  destinationsTitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
  },
  destDay: {
    color: '#94a3b8',
  },
  destNight: {
    color: '#64748b',
  },
  linksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#059669',
  },
  dotSeparator: {
    fontSize: 12,
    color: '#94a3b8',
  },
});
