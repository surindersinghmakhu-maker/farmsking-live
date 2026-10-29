import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { BrandLogo } from '@/src/components/BrandLogo';

export default function AgriHubIndexScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <BrandLogo size={36} useHdQuality style={{ marginRight: 4 }} />
          <View>
            <Text style={styles.title}>Agri-Hub Command</Text>
            <Text style={styles.subtitle}>Intelligence for Every Field • Crop Radar & Mandi Analytics</Text>
          </View>
        </View>
      </View>

      {/* Metric Cards Row */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { borderColor: 'rgba(22, 163, 74, 0.35)' }]}>
          <Ionicons name="people" size={20} color="#16a34a" />
          <Text style={styles.metricVal}>1,240+</Text>
          <Text style={styles.metricLabel}>Registered Farmers</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: 'rgba(132, 204, 22, 0.35)' }]}>
          <Ionicons name="analytics" size={20} color="#84cc16" />
          <Text style={styles.metricVal}>98.4%</Text>
          <Text style={styles.metricLabel}>Crop Health Index</Text>
        </View>

        <View style={[styles.metricCard, { borderColor: 'rgba(14, 165, 233, 0.35)' }]}>
          <Ionicons name="planet" size={20} color="#0ea5e9" />
          <Text style={styles.metricVal}>450 Ha</Text>
          <Text style={styles.metricLabel}>Satellite Radar Area</Text>
        </View>
      </View>

      {/* Quick Launchpad */}
      <Text style={styles.sectionTitle}>Field Operations Launchpad</Text>
      <View style={styles.launchpadGrid}>
        <TouchableOpacity
          style={styles.launchCard}
          activeOpacity={0.8}
          onPress={() => router.push('/farmer/(tabs)/crop-intelligence' as any)}
        >
          <View style={[styles.launchIconBox, { backgroundColor: '#16a34a' }]}>
            <Ionicons name="analytics" size={22} color="#ffffff" />
          </View>
          <Text style={styles.launchTitle}>Crop Intelligence</Text>
          <Text style={styles.launchSub}>Sowing calendar, weather, harvest advisory</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.launchCard}
          activeOpacity={0.8}
          onPress={() => router.push('/farmer/(tabs)/satellite-map' as any)}
        >
          <View style={[styles.launchIconBox, { backgroundColor: '#0ea5e9' }]}>
            <Ionicons name="planet" size={22} color="#ffffff" />
          </View>
          <Text style={styles.launchTitle}>Satellite Radar</Text>
          <Text style={styles.launchSub}>Live NDVI boundary & moisture scans</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.launchCard}
          activeOpacity={0.8}
          onPress={() => router.push('/farmer/(tabs)/farmers' as any)}
        >
          <View style={[styles.launchIconBox, { backgroundColor: '#eab308' }]}>
            <Ionicons name="people" size={22} color="#ffffff" />
          </View>
          <Text style={styles.launchTitle}>Farmers Directory</Text>
          <Text style={styles.launchSub}>Farmer profiles, land parcels & crops</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.launchCard}
          activeOpacity={0.8}
          onPress={() => router.push('/farmer/(tabs)/workforce' as any)}
        >
          <View style={[styles.launchIconBox, { backgroundColor: '#8b5cf6' }]}>
            <Ionicons name="construct" size={22} color="#ffffff" />
          </View>
          <Text style={styles.launchTitle}>Workforce & Labour</Text>
          <Text style={styles.launchSub}>Field supervisors, attendance & tasks</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07170c',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    padding: 16,
    backgroundColor: '#0c2414',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.25)',
  },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#f0fdf4',
  },
  subtitle: {
    fontSize: 11.5,
    fontFamily: FONT.regular,
    color: '#86efac',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#0c2414',
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
    color: '#f0fdf4',
    marginTop: 8,
  },
  launchpadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  launchCard: {
    width: '48%',
    backgroundColor: '#0c2414',
    borderRadius: RADIUS.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
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
