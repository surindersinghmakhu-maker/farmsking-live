import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { RoleHeader } from './RoleHeader';
import { useAuth } from '@/src/store/auth-context';
import { useFulfillmentQueue } from '@/src/hooks/useOrders';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.OPERATOR;

export const OperatorDashboardView: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: queue } = useFulfillmentQueue();

  const confirmed = (queue ?? []).filter((o) => o.status === 'CONFIRMED').length;
  const packing = (queue ?? []).filter((o) => o.status === 'PACKING').length;
  const packed = (queue ?? []).filter((o) => o.status === 'PACKED').length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <RoleHeader currentRole="OPERATOR" profileName={user?.name || 'Operator'} subtitle="Printing, Packing & Dispatch" />

      <View style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.statValue}>{confirmed}</Text>
            <Text style={styles.statLabel}>Ready to Pack</Text>
          </View>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.statValue}>{packing}</Text>
            <Text style={styles.statLabel}>Packing</Text>
          </View>
          <View style={[styles.statCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.statValue}>{packed}</Text>
            <Text style={styles.statLabel}>Ready to Dispatch</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.queueBtn, premiumShadow(theme.primary, 'md')]}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/operator-orders' as never)}
        >
          <Ionicons name="cube" size={20} color="#ffffff" />
          <Text style={styles.queueBtnText}>Open Fulfillment Queue</Text>
          <Ionicons name="chevron-forward" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  statsGrid: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md },
  statValue: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a' },
  statLabel: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 3 },
  queueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: theme.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    paddingHorizontal: SPACING.lg,
  },
  queueBtnText: { flex: 1, color: '#ffffff', fontSize: 14.5, fontFamily: FONT.bold },
});
