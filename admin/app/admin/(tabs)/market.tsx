import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, SPACING } from '@/constants/theme';
import { CropDoctorCareView } from '@/src/components/CropDoctorCareView';
import { useFarmerPlan } from '@/src/hooks/useFarmerPlan';
import { Ionicons } from '@expo/vector-icons';

const theme = RoleThemes.FARMER;

export default function MarketScreen() {
  const { plan, meta, limits } = useFarmerPlan();
  const advisorIncluded = limits?.advisorIncluded ?? (plan === 'SILVER' || plan === 'GOLD' || plan === 'ROYAL');

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <View style={styles.heroTitleRow}>
          <Text style={styles.heroTitle}>Crop Doctor</Text>
          {advisorIncluded ? (
            <View style={styles.planBadge}>
              <Ionicons name="ribbon-outline" size={12} color="#ffffff" />
              <Text style={styles.planBadgeText}>{meta.label}</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.heroSubtitle}>Expert guidance for your farm & crop schedules</Text>
      </LinearGradient>

      <CropDoctorCareView />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: SPACING.lg },
  heroTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroTitle: { color: '#fff', fontSize: 22, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: FONT.medium, marginTop: 2 },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  planBadgeText: { color: '#ffffff', fontSize: 11.5, fontFamily: FONT.bold },
});
