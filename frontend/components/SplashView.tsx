import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';

const theme = RoleThemes.FARMER;

export function SplashView() {
  return (
    <LinearGradient colors={['#0a2417', '#15803d', theme.primary]} style={styles.container}>
      <View style={[styles.badge, premiumShadow('#000000', 'md')]}>
        <BrandLogo size={84} useHdQuality={true} useFastBundledOnly={true} />
      </View>
      <Text style={styles.title}>FarmsKing</Text>
      <Text style={styles.tagline}>Smart Farming, Better Future</Text>

      <View style={styles.loadingWrap}>
        <View style={styles.loadingTrack}>
          <View style={styles.loadingFill} />
        </View>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  badge: {
    width: 92, height: 92, borderRadius: 46, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
    borderWidth: 2, borderColor: '#facc15',
  },
  title: { color: '#ffffff', fontSize: 32, fontFamily: FONT.extraBold, letterSpacing: 0.5 },
  tagline: { color: 'rgba(255,255,255,0.85)', fontSize: 14, fontFamily: FONT.semiBold, marginTop: 6 },
  loadingWrap: { position: 'absolute', bottom: 64, alignItems: 'center', width: '70%' },
  loadingTrack: { width: '100%', height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  loadingFill: { width: '65%', height: '100%', borderRadius: 3, backgroundColor: '#facc15' },
  loadingText: { color: 'rgba(255,255,255,0.85)', fontSize: 12, fontFamily: FONT.bold, marginTop: 10 },
});
