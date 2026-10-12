import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, THEME_4D } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassCard4D } from './ui/GlassCard4D';
import { AnimatedCounter } from './ui/AnimatedCounter';
import { useExecutiveTheme } from '@/src/store/theme-context';

interface Props {
  onOpenQuickView?: (type: 'SELLER_KYC' | 'PAYOUT_REQUEST') => void;
  onOpenAiTelemetry?: () => void;
}

export function AdminKpiMetricCards({ onOpenQuickView, onOpenAiTelemetry }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;
  const { isLight, isMedium, textColor, subTextColor } = useExecutiveTheme();

  return (
    <View style={styles.container}>
      {/* 🤖 Google AI Telemetry & Gemini 2.5 Flash Command Banner */}
      <GlassCard4D
        variant="cyber"
        glowColor={isLight ? '#0284c7' : THEME_4D.cyberCyan}
        style={styles.aiBannerCard}
        onPress={onOpenAiTelemetry}
      >
        <LinearGradient
          colors={
            isLight
              ? ['rgba(2, 132, 199, 0.08)', 'rgba(240, 253, 244, 0.85)', 'rgba(22, 163, 74, 0.06)']
              : isMedium
              ? ['rgba(251, 191, 36, 0.08)', 'rgba(6, 26, 30, 0.85)', 'rgba(34, 197, 94, 0.12)']
              : ['rgba(0, 242, 254, 0.08)', 'rgba(5, 30, 20, 0.45)', 'rgba(0, 255, 135, 0.06)']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.aiBannerContent}>
          <View style={[styles.aiIconBox, isLight && { backgroundColor: 'rgba(2, 132, 199, 0.12)', borderColor: 'rgba(2, 132, 199, 0.3)' }]}>
            <Ionicons name="hardware-chip" size={20} color={isLight ? '#0284c7' : THEME_4D.cyberCyan} />
            <View style={[styles.chipGlowDot, isLight && { backgroundColor: '#0284c7' }]} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <Text style={[styles.aiBannerTitle, { color: textColor }]}>Google AI Telemetry & Quota</Text>
              <View style={[styles.activeTag, isLight && { backgroundColor: 'rgba(2, 132, 199, 0.1)', borderColor: 'rgba(2, 132, 199, 0.25)' }]}>
                <View style={[styles.activeDot, isLight && { backgroundColor: '#0284c7' }]} />
                <Text style={[styles.activeTagText, isLight && { color: '#0284c7' }]}>Gemini 2.5 Flash · Neural Mesh</Text>
              </View>
            </View>
            <Text style={[styles.aiBannerSubtitle, { color: subTextColor }]}>
              <Text style={{ color: isLight ? '#16a34a' : THEME_4D.neonEmerald, fontFamily: FONT.bold }}>1,420 / 5,000</Text> queries used today · PAU & ICAR Grounding Active · 28d left
            </Text>

            {/* Futuristic Progress Bar */}
            <View style={[styles.telemetryBarTrack, isLight && { backgroundColor: '#e2e8f0' }]}>
              <LinearGradient
                colors={isLight ? ['#0284c7', '#16a34a'] : ['#00f2fe', '#00ff87']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.telemetryBarFill, { width: '28.4%' }]}
              />
            </View>
          </View>
          {isDesktop && (
            <TouchableOpacity
              style={[styles.meterBtn, isLight && { backgroundColor: '#0284c7', borderColor: '#0284c7' }]}
              onPress={onOpenAiTelemetry}
              activeOpacity={0.8}
            >
              <Ionicons name="speedometer-outline" size={14} color="#ffffff" />
              <Text style={styles.meterBtnText}>Telemetry Meter</Text>
            </TouchableOpacity>
          )}
        </View>
      </GlassCard4D>

      {/* 4 4D Interactive Floating Metric Cards Grid */}
      <View style={[styles.kpiGrid, !isDesktop && styles.kpiGridMobile]}>
        {/* Card 1: Active Farmers */}
        <GlassCard4D
          glowColor={isLight ? '#16a34a' : isMedium ? '#22c55e' : THEME_4D.neonEmerald}
          style={styles.kpiCard}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="leaf" size={14} color={isLight ? '#16a34a' : isMedium ? '#22c55e' : THEME_4D.neonEmerald} />
              <Text style={[styles.kpiTitle, isLight && { color: '#64748b' }]}>ACTIVE FARMERS</Text>
            </View>
            <View style={[styles.pulsingBadge, isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }, isMedium && { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.4)' }]}>
              <View style={[styles.pulsingDot, isLight && { backgroundColor: '#16a34a' }, isMedium && { backgroundColor: '#22c55e' }]} />
              <Text style={[styles.pulsingText, isLight && { color: '#16a34a' }, isMedium && { color: '#22c55e' }]}>LIVE</Text>
            </View>
          </View>
          <AnimatedCounter
            value={1240}
            style={[styles.kpiValue, { color: textColor }]}
          />
          <Text style={[styles.kpiSubtext, { color: subTextColor }]}>
            <Text style={{ color: isLight ? '#16a34a' : isMedium ? '#22c55e' : THEME_4D.neonEmerald }}>+18</Text> registered today across Punjab
          </Text>
        </GlassCard4D>

        {/* Card 2: Crop Doctor Consultations */}
        <GlassCard4D
          glowColor={isLight ? '#d97706' : isMedium ? '#fbbf24' : THEME_4D.cyberGold}
          style={styles.kpiCard}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="medical" size={14} color={isMedium ? '#fbbf24' : THEME_4D.cyberGold} />
              <Text style={[styles.kpiTitle, isLight && { color: '#64748b' }]}>PENDING CONSULTATIONS</Text>
            </View>
            <View style={[styles.pulsingBadge, { backgroundColor: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }]}>
              <View style={[styles.pulsingDot, { backgroundColor: isMedium ? '#fbbf24' : THEME_4D.cyberGold }]} />
              <Text style={[styles.pulsingText, { color: isMedium ? '#fbbf24' : THEME_4D.cyberGold }]}>QUEUED</Text>
            </View>
          </View>
          <AnimatedCounter
            value={4}
            style={[styles.kpiValue, { color: isLight ? '#d97706' : isMedium ? '#fbbf24' : THEME_4D.cyberGold }]}
          />
          <Text style={[styles.kpiSubtext, { color: subTextColor }]}>Crop disease diagnostics awaiting reply</Text>
        </GlassCard4D>

        {/* Card 3: Seller KYC Approvals */}
        <GlassCard4D
          glowColor={isLight ? '#16a34a' : isMedium ? '#22c55e' : THEME_4D.laserMint}
          style={[styles.kpiCard, styles.kpiCardInteractive]}
          onPress={() => onOpenQuickView?.('SELLER_KYC')}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="shield-checkmark" size={14} color={isLight ? '#16a34a' : isMedium ? '#22c55e' : THEME_4D.laserMint} />
              <Text style={[styles.kpiTitle, isLight && { color: '#64748b' }]}>SELLER KYC APPROVALS</Text>
            </View>
            <View style={[styles.clickActionPill, isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }, isMedium && { backgroundColor: 'rgba(34, 197, 94, 0.12)', borderColor: 'rgba(34, 197, 94, 0.4)' }]}>
              <Text style={[styles.clickActionPillText, isLight && { color: '#16a34a' }, isMedium && { color: '#22c55e' }]}>DRAWER ➔</Text>
            </View>
          </View>
          <AnimatedCounter
            value={12}
            style={[styles.kpiValue, { color: isLight ? '#16a34a' : isMedium ? '#22c55e' : THEME_4D.laserMint }]}
          />
          <Text style={[styles.kpiSubtext, { color: subTextColor }]}>1-Click Quick Verification Drawer</Text>
        </GlassCard4D>

        {/* Card 4: Daily Sales Volume */}
        <GlassCard4D
          glowColor={isLight ? '#d97706' : isMedium ? '#fbbf24' : THEME_4D.neonEmerald}
          style={styles.kpiCard}
        >
          <View style={styles.kpiHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="trending-up" size={14} color={isLight ? '#d97706' : isMedium ? '#fbbf24' : THEME_4D.neonEmerald} />
              <Text style={[styles.kpiTitle, isLight && { color: '#64748b' }]}>TODAY'S VOLUME</Text>
            </View>
            <View style={[styles.pulsingBadge, isLight ? { backgroundColor: 'rgba(217, 119, 6, 0.1)', borderColor: 'rgba(217, 119, 6, 0.3)' } : isMedium ? { backgroundColor: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.4)' } : { backgroundColor: 'rgba(0, 255, 135, 0.12)', borderColor: 'rgba(0, 255, 135, 0.4)' }]}>
              <View style={[styles.pulsingDot, isLight ? { backgroundColor: '#d97706' } : isMedium ? { backgroundColor: '#fbbf24' } : undefined]} />
              <Text style={[styles.pulsingText, isLight ? { color: '#d97706' } : isMedium ? { color: '#fbbf24' } : undefined]}>24H GMV</Text>
            </View>
          </View>
          <AnimatedCounter
            value={48250}
            prefix="₹"
            style={[styles.kpiValue, { color: isMedium ? '#fbbf24' : textColor }]}
          />
          <Text style={[styles.kpiSubtext, { color: subTextColor }]}>Agri-store purchases & mandi orders</Text>
        </GlassCard4D>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
    gap: 14,
  },
  aiBannerCard: {
    padding: 16,
    borderRadius: RADIUS.xl,
    overflow: 'hidden',
  },
  aiBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    zIndex: 10,
  },
  aiIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 242, 254, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  chipGlowDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME_4D.cyberCyan,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.2,
  },
  activeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: THEME_4D.neonEmerald,
  },
  activeTagText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: THEME_4D.neonEmerald,
  },
  aiBannerSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: THEME_4D.textMuted,
    marginTop: 3,
  },
  telemetryBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  telemetryBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  meterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 242, 254, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 242, 254, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
  },
  meterBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  kpiGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  kpiGridMobile: {
    flexDirection: 'column',
  },
  kpiCard: {
    flex: 1,
    padding: 16,
    minHeight: 118,
    justifyContent: 'space-between',
  },
  kpiCardInteractive: {
    cursor: 'pointer',
  } as any,
  kpiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kpiTitle: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: THEME_4D.textMuted,
    letterSpacing: 0.6,
  },
  pulsingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
  },
  pulsingDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: THEME_4D.neonEmerald,
  },
  pulsingText: {
    fontSize: 8.5,
    fontFamily: FONT.extraBold,
    color: THEME_4D.neonEmerald,
    letterSpacing: 0.5,
  },
  clickActionPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  clickActionPillText: {
    fontSize: 8.5,
    fontFamily: FONT.bold,
    color: THEME_4D.laserMint,
  },
  kpiValue: {
    fontSize: 26,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    letterSpacing: -0.5,
    marginVertical: 4,
  },
  kpiSubtext: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: THEME_4D.textDim,
  },
});
