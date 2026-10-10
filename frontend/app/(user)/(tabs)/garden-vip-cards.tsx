import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

export default function GardenVipCardsScreen() {
  const router = useRouter();
  const { colors } = useExecutiveTheme();

  useEffect(() => {
    router.replace('/garden/advisors');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={['#14532d', '#166534', '#15803d']} style={styles.headerArea}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={styles.headerTitle}>Garden Advisor Support</Text>
          <Text style={styles.headerSub}>ਬਾਗਬਾਨੀ ਮਾਹਿਰਾਂ ਦੀ ਸਹਾਇਤਾ</Text>
        </View>
        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, premiumShadow('#15803d', 'sm')]}>
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={32} color="#15803d" />
          </View>
          <Text style={styles.title}>🌿 Dedicated Garden Expert Advisory</Text>
          <Text style={styles.desc}>
            As a Gardener, you can connect directly with our certified Garden Advisors for personalized plant guidance, terrace gardening tips, and disease diagnoses.
          </Text>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/garden/advisors')}
          >
            <Ionicons name="leaf" size={18} color="#ffffff" />
            <Text style={styles.actionBtnText}>Connect with Garden Advisor</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
  },
  backBtn: { width: 40, height: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontFamily: FONT.extraBold, color: '#fff', textAlign: 'center' },
  headerSub: { fontSize: 11, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.75)', textAlign: 'center' },
  scrollContent: { padding: SPACING.md, paddingBottom: 120, alignItems: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: 24,
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    marginTop: 20,
    gap: 12,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
    textAlign: 'center',
  },
  desc: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#15803d',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: RADIUS.pill,
    width: '100%',
    marginTop: 8,
  },
  actionBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 14,
  },
});
