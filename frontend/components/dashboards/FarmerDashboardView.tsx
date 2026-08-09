import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { MarketRatesCard } from '@/src/components/MarketRatesCard';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const FarmerDashboardView: React.FC = () => {
  const theme = RoleThemes.FARMER;
  const router = useRouter();

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="FARMER"
        profileName="Balwinder Singh"
        subtitle="Bathinda, Punjab"
        avatarUrl="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
      />

      <View style={styles.content}>
        {/* Today's Crop Prices (real data - last 24h local vs national average) */}
        <MarketRatesCard />

        {/* Farm Action Grid */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionCard, premiumShadow('#000000', 'sm')]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              router.push('/farm');
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#f0fdf4' }]}>
              <Ionicons name="leaf" size={22} color="#16a34a" />
            </View>
            <Text style={styles.actionCardTitle}>My Active Crops</Text>
            <Text style={styles.actionCardSub}>3 Crop Plots</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionCard, premiumShadow('#000000', 'sm')]}
            activeOpacity={0.8}
            onPress={() => {
              tap();
              router.push('/records');
            }}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="document-text" size={22} color="#d97706" />
            </View>
            <Text style={styles.actionCardTitle}>Sales & Expenses</Text>
            <Text style={styles.actionCardSub}>Log Records</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.md },
  actionGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  actionIconBg: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  actionCardTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  actionCardSub: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
});
