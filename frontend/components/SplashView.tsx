import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT } from '@/constants/theme';

const theme = RoleThemes.FARMER;

export function SplashView() {
  return (
    <LinearGradient colors={['#0a2417', theme.primary]} style={styles.container}>
      <View style={styles.badge}>
        <MaterialCommunityIcons name="crown" size={40} color="#f59e0b" />
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
    width: 88, height: 88, borderRadius: 44, backgroundColor: '#ffffff',
    alignItems: 'center', justifyContent: 'center', marginBottom: 18,
  },
  title: { color: '#ffffff', fontSize: 30, fontFamily: FONT.extraBold, letterSpacing: 0.3 },
  tagline: { color: 'rgba(255,255,255,0.75)', fontSize: 14, fontFamily: FONT.medium, marginTop: 6 },
  loadingWrap: { position: 'absolute', bottom: 64, alignItems: 'center', width: '70%' },
  loadingTrack: { width: '100%', height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)', overflow: 'hidden' },
  loadingFill: { width: '55%', height: '100%', borderRadius: 2, backgroundColor: '#ffffff' },
  loadingText: { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: FONT.medium, marginTop: 10 },
});
