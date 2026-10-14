import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';

export default function OperationsDeskIndexScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={styles.logoBadge}>
            <Ionicons name="compass" size={20} color="#ffffff" />
          </View>
          <View>
            <Text style={styles.title}>Operations Desk</Text>
            <Text style={styles.subtitle}>Command • Coordinate • Deliver • Technical Training & Dispatch</Text>
          </View>
        </View>
      </View>

      {/* Metrics Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderColor: 'rgba(99, 102, 241, 0.35)' }]}>
          <Ionicons name="briefcase" size={20} color="#6366f1" />
          <Text style={styles.metricVal}>12</Text>
          <Text style={styles.metricLabel}>Active Managers</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: 'rgba(167, 139, 250, 0.35)' }]}>
          <Ionicons name="school" size={20} color="#a78bfa" />
          <Text style={styles.metricVal}>48</Text>
          <Text style={styles.metricLabel}>Field Trainers</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: 'rgba(34, 197, 94, 0.35)' }]}>
          <Ionicons name="swap-horizontal" size={20} color="#22c55e" />
          <Text style={styles.metricVal}>99.1%</Text>
          <Text style={styles.metricLabel}>Dispatch SLA</Text>
        </View>
      </View>

      {/* Operations Launchpad */}
      <Text style={styles.sectionTitle}>Operations Launchpad</Text>
      <View style={styles.launchpadGrid}>
        <TouchableOpacity
          style={styles.launchCard}
          activeOpacity={0.8}
          onPress={() => router.push('/staff/(tabs)/trainers' as any)}
        >
          <View style={[styles.launchIconBox, { backgroundColor: '#6366f1' }]}>
            <Ionicons name="school" size={22} color="#ffffff" />
          </View>
          <Text style={styles.launchTitle}>Technical Trainers</Text>
          <Text style={styles.launchSub}>Field workshops, agronomy training & staff certifications</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.launchCard}
          activeOpacity={0.8}
          onPress={() => router.push('/staff/(tabs)/operators' as any)}
        >
          <View style={[styles.launchIconBox, { backgroundColor: '#0284c7' }]}>
            <Ionicons name="swap-horizontal" size={22} color="#ffffff" />
          </View>
          <Text style={styles.launchTitle}>Logistics & Dispatch</Text>
          <Text style={styles.launchSub}>Warehouse fulfilment, waybills & order assignments</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.launchCard}
          activeOpacity={0.8}
          onPress={() => router.push('/staff/(tabs)/managers' as any)}
        >
          <View style={[styles.launchIconBox, { backgroundColor: '#a855f7' }]}>
            <Ionicons name="briefcase" size={22} color="#ffffff" />
          </View>
          <Text style={styles.launchTitle}>Operations Managers</Text>
          <Text style={styles.launchSub}>Branch supervisors, regional escalations & KPI reviews</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.launchCard}
          activeOpacity={0.8}
          onPress={() => router.push('/staff/(tabs)/partners' as any)}
        >
          <View style={[styles.launchIconBox, { backgroundColor: '#f59e0b' }]}>
            <Ionicons name="people" size={22} color="#ffffff" />
          </View>
          <Text style={styles.launchTitle}>Strategic Partners</Text>
          <Text style={styles.launchSub}>Business partner alliances, payouts & commission tiers</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0c0a21',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#141038',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#e0e7ff',
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#a5b4fc',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#141038',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
    ...premiumShadow('#000000', 'sm'),
  },
  metricVal: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  metricLabel: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#e0e7ff',
    marginTop: 8,
  },
  launchpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  launchCard: {
    width: '48%',
    backgroundColor: '#141038',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
    gap: 8,
    ...premiumShadow('#000000', 'sm'),
  },
  launchIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  launchTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  launchSub: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
    color: '#94a3b8',
    lineHeight: 14,
  },
});
