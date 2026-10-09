import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

interface Props {
  onOpenQuickView?: (type: 'SELLER_KYC' | 'PAYOUT_REQUEST') => void;
}

export function AdminKpiMetricCards({ onOpenQuickView }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <View style={styles.container}>
      {/* 🤖 Google AI Telemetry & Gemini Quota Banner */}
      <View style={[styles.aiBannerCard, premiumShadow('rgba(0,0,0,0.5)', 'md') as any]}>
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.15)', 'rgba(4, 24, 13, 0.9)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.aiBannerContent}>
          <View style={styles.aiIconBox}>
            <Ionicons name="hardware-chip" size={20} color="#00ff87" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.aiBannerTitle}>Google AI Telemetry & Quota</Text>
              <View style={styles.activeTag}>
                <View style={styles.activeDot} />
                <Text style={styles.activeTagText}>Gemini 2.5 Flash</Text>
              </View>
            </View>
            <Text style={styles.aiBannerSubtitle}>
              1,420 / 5,000 queries used today · Grounding Active · 28 days left on current plan cycle
            </Text>
          </View>
          {isDesktop && (
            <TouchableOpacity style={styles.meterBtn}>
              <Ionicons name="speedometer" size={14} color="#020d06" />
              <Text style={styles.meterBtnText}>Open Meter</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 4 3D KPI Metric Cards Grid */}
      <View style={[styles.kpiGrid, !isDesktop && styles.kpiGridMobile]}>
        {/* Card 1: Active Farmers */}
        <View style={[styles.kpiCard, premiumShadow('#000000', 'sm') as any]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiTitle}>ACTIVE FARMERS</Text>
            <View style={styles.pulsingBadge}>
              <View style={styles.pulsingDot} />
              <Text style={styles.pulsingText}>LIVE</Text>
            </View>
          </View>
          <Text style={styles.kpiValue}>1,240</Text>
          <Text style={styles.kpiSubtext}>+18 registered today across Punjab & India</Text>
        </View>

        {/* Card 2: Crop Doctor Consultations */}
        <View style={[styles.kpiCard, premiumShadow('#000000', 'sm') as any]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiTitle}>PENDING CONSULTATIONS</Text>
            <Ionicons name="medical" size={16} color="#f59e0b" />
          </View>
          <Text style={[styles.kpiValue, { color: '#f59e0b' }]}>4</Text>
          <Text style={styles.kpiSubtext}>Farmer crop disease diagnostics waiting</Text>
        </View>

        {/* Card 3: Seller KYC Approvals */}
        <TouchableOpacity
          style={[styles.kpiCard, styles.kpiCardInteractive, premiumShadow('#000000', 'sm') as any]}
          onPress={() => onOpenQuickView?.('SELLER_KYC')}
        >
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiTitle}>SELLER KYC APPROVALS</Text>
            <Ionicons name="shield-checkmark" size={16} color="#00ff87" />
          </View>
          <Text style={[styles.kpiValue, { color: '#00ff87' }]}>12</Text>
          <Text style={styles.kpiSubtext}>Click for 1-click Quick Approve drawer ➔</Text>
        </TouchableOpacity>

        {/* Card 4: Daily Sales Volume */}
        <View style={[styles.kpiCard, premiumShadow('#000000', 'sm') as any]}>
          <View style={styles.kpiHeaderRow}>
            <Text style={styles.kpiTitle}>TODAY'S SALES (₹)</Text>
            <Ionicons name="trending-up" size={16} color="#10b981" />
          </View>
          <Text style={[styles.kpiValue, { color: '#10b981' }]}>₹48,250</Text>
          <Text style={styles.kpiSubtext}>Agri-store purchases & mandi crop orders</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    gap: 16,
  },
  aiBannerCard: {
    backgroundColor: '#04180d',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    overflow: 'hidden',
    padding: 16,
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  aiIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiBannerTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff87',
  },
  activeTagText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  aiBannerSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 4,
  },
  meterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00ff87',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  meterBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#020d06',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 14,
  },
  kpiGridMobile: {
    flexDirection: 'column',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#04180d',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    borderRadius: RADIUS.lg,
    padding: 16,
  },
  kpiCardInteractive: {
    borderColor: 'rgba(0, 255, 135, 0.4)',
    backgroundColor: 'rgba(0, 255, 135, 0.04)',
  },
  kpiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiTitle: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: 'rgba(52, 211, 153, 0.8)',
    letterSpacing: 0.5,
  },
  pulsingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  pulsingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  pulsingText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  kpiValue: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  kpiSubtext: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 4,
  },
});
