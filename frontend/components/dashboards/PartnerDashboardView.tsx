import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

export const PartnerDashboardView: React.FC = () => {
  const theme = RoleThemes.BUSINESS_PARTNER;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="BUSINESS_PARTNER"
        profileName="Vikram Malhotra"
        subtitle="Business Partner"
        avatarUrl="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
      />

      <View style={styles.content}>

        {/* Earnings Card */}
        <LinearGradient colors={theme.heroGradient} style={[styles.earningsCard, premiumShadow(theme.primary, 'md')]}>
          <Ionicons name="wallet" size={104} color={theme.primary} style={styles.watermark} />
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelText}>This Month Earnings</Text>
            <View style={[styles.badgePill, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="trending-up" size={13} color={theme.primary} />
              <Text style={[styles.badgePillText, { color: theme.primary }]}>+22.4%</Text>
            </View>
          </View>
          <Text style={styles.earningsAmount}>₹18,750</Text>

          <View style={styles.barChartContainer}>
            <View style={styles.barsRow}>
              {[30, 45, 60, 50, 70, 90, 100].map((heightVal, idx) => (
                <LinearGradient key={idx} colors={[theme.accent, theme.primary]} style={[styles.barItem, { height: heightVal }]} />
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* 3 Metrics Row */}
        <View style={[styles.metricsRow, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Total Referrals</Text>
            <Text style={styles.metricValue}>56</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorderLeft]}>
            <Text style={styles.metricLabel}>Active Referrals</Text>
            <Text style={styles.metricValue}>34</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorderLeft]}>
            <Text style={styles.metricLabel}>Total Earnings</Text>
            <Text style={[styles.metricValue, { color: theme.primary }]}>₹1,25,000</Text>
          </View>
        </View>

        {/* Earnings Overview */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Earnings Overview</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text></TouchableOpacity>
          </View>

          <View style={styles.overviewStatsRow}>
            <View style={[styles.statBox, { backgroundColor: theme.primaryLight }]}>
              <Text style={styles.statSubText}>Commission</Text>
              <Text style={[styles.statBigText, { color: theme.primary }]}>₹18,750</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#f0fdf4' }]}>
              <Text style={styles.statSubText}>Paid</Text>
              <Text style={[styles.statBigText, { color: '#166534' }]}>₹15,200</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: '#fffbeb' }]}>
              <Text style={styles.statSubText}>Pending</Text>
              <Text style={[styles.statBigText, { color: '#c2410c' }]}>₹3,550</Text>
            </View>
          </View>
        </View>

        {/* Recent Referrals */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Referrals</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text></TouchableOpacity>
          </View>

          {[
            { name: 'Rakesh Kumar', date: 'Joined on 18 May 2026', comm: '₹750' },
            { name: 'Sukhdeep Singh', date: 'Joined on 17 May 2026', comm: '₹750' },
            { name: 'Harpreet Kaur', date: 'Joined on 16 May 2026', comm: '₹750', last: true },
          ].map((ref, idx) => (
            <View key={idx} style={[styles.referralItem, ref.last && { borderBottomWidth: 0 }]}>
              <View style={[styles.userIconBg, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="person-outline" size={17} color={theme.primary} />
              </View>
              <View style={styles.refInfo}>
                <Text style={styles.refName}>{ref.name}</Text>
                <Text style={styles.refDate}>{ref.date}</Text>
              </View>
              <Text style={[styles.refComm, { color: theme.primary }]}>{ref.comm}</Text>
            </View>
          ))}
        </View>

        {/* Marketing Tools */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Marketing Tools</Text>
          <View style={styles.toolsGrid}>
            {[
              { label: 'Referral Link', icon: 'link-outline' },
              { label: 'Share Poster', icon: 'share-social-outline' },
              { label: 'Social Share', icon: 'globe-outline' },
              { label: 'Banners', icon: 'images-outline' },
            ].map((m, idx) => (
              <TouchableOpacity key={idx} style={styles.toolBtn} activeOpacity={0.7}>
                <Ionicons name={m.icon as any} size={20} color={theme.primary} />
                <Text style={styles.toolLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  earningsCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, overflow: 'hidden' },
  watermark: { position: 'absolute', top: -12, right: -16, opacity: 0.08 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabelText: { fontSize: 13.5, color: '#64748b', fontFamily: FONT.semiBold },
  badgePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill, gap: 4 },
  badgePillText: { fontSize: 11, fontFamily: FONT.bold },
  earningsAmount: { fontSize: 34, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6, letterSpacing: -0.6 },
  barChartContainer: { marginTop: 18, height: 60, justifyContent: 'flex-end' },
  barsRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 },
  barItem: { width: 18, borderRadius: 6 },
  metricsRow: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  metricItem: { flex: 1, alignItems: 'center' },
  metricBorderLeft: { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' },
  metricLabel: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium },
  metricValue: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', marginTop: 5 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold },
  overviewStatsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  statBox: { flex: 1, borderRadius: RADIUS.md, padding: 12, alignItems: 'center' },
  statSubText: { fontSize: 10.5, color: '#64748b', fontFamily: FONT.medium },
  statBigText: { fontSize: 13.5, fontFamily: FONT.extraBold, marginTop: 4 },
  referralItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  userIconBg: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  refInfo: { flex: 1, marginLeft: 12 },
  refName: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  refDate: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  refComm: { fontSize: 13.5, fontFamily: FONT.extraBold },
  toolsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  toolBtn: { flex: 1, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 6 },
  toolLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' },
});
