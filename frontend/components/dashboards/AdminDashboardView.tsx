import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

export const AdminDashboardView: React.FC = () => {
  const theme = RoleThemes.ADMIN;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      <RoleHeader
        currentRole="ADMIN"
        profileName="Admin"
        subtitle="Platform Overview"
        avatarUrl="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150"
      />

      <View style={styles.content}>
        {/* 4 Stat Cards */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Total Users', value: '2,568', icon: 'people-outline' },
            { label: 'Advisors', value: '1,256', icon: 'school-outline' },
            { label: 'Orders', value: '3,256', icon: 'receipt-outline' },
            { label: 'Partners', value: '256', icon: 'briefcase-outline' },
          ].map((s) => (
            <View key={s.label} style={[styles.statCard, premiumShadow('#0f172a', 'sm')]}>
              <View style={styles.statIconBg}>
                <Ionicons name={s.icon as any} size={17} color={theme.primary} />
              </View>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Sales Overview Hero */}
        <LinearGradient colors={theme.heroGradient} style={[styles.salesCard, premiumShadow(theme.primary, 'md')]}>
          <Ionicons name="stats-chart" size={104} color={theme.primary} style={styles.watermark} />
          <Text style={styles.cardLabelText}>Total Platform Sales</Text>
          <Text style={styles.salesAmount}>₹12,45,560</Text>
          <View style={styles.sparklineContainer}>
            <View style={styles.sparklineBarRow}>
              {[40, 55, 48, 65, 58, 78, 92].map((h, index) => (
                <LinearGradient key={index} colors={[theme.accent, theme.primary]} style={[styles.sparklineBar, { height: h }]} />
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* Recent Orders */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Orders</Text>
            <TouchableOpacity activeOpacity={0.7}><Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text></TouchableOpacity>
          </View>

          {[
            { id: 'Order #1254', name: 'Aman Kumar', amount: '₹500', time: 'Today' },
            { id: 'Order #1255', name: 'Rakesh Kumar', amount: '₹780', time: 'Today' },
            { id: 'Order #1253', name: 'Sukhdeep Singh', amount: '₹1,240', time: 'Yesterday', last: true },
          ].map((o) => (
            <View key={o.id} style={[styles.row, o.last && { borderBottomWidth: 0 }]}>
              <View style={styles.rowIconBg}>
                <Ionicons name="receipt-outline" size={17} color={theme.primary} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle}>{o.id}</Text>
                <Text style={styles.rowSubtitle}>{o.name} · {o.time}</Text>
              </View>
              <Text style={styles.rowAmount}>{o.amount}</Text>
            </View>
          ))}
        </View>

        {/* Management Shortcuts */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Management</Text>
          <View style={styles.toolsGrid}>
            {[
              { label: 'Users', icon: 'people-outline' },
              { label: 'Products', icon: 'cube-outline' },
              { label: 'Orders', icon: 'receipt-outline' },
              { label: 'Reports', icon: 'bar-chart-outline' },
            ].map((t) => (
              <TouchableOpacity key={t.label} style={styles.toolBtn} activeOpacity={0.7}>
                <Ionicons name={t.icon as any} size={20} color={theme.primary} />
                <Text style={styles.toolLabel}>{t.label}</Text>
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
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47.5%', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg,
  },
  statIconBg: {
    width: 32, height: 32, borderRadius: 11, backgroundColor: '#dcfce7',
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  statValue: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.3 },
  statLabel: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  salesCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, overflow: 'hidden' },
  watermark: { position: 'absolute', top: -12, right: -16, opacity: 0.08 },
  cardLabelText: { fontSize: 13.5, color: '#64748b', fontFamily: FONT.semiBold },
  salesAmount: { fontSize: 32, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6, letterSpacing: -0.6 },
  sparklineContainer: { marginTop: 18, height: 56, justifyContent: 'flex-end' },
  sparklineBarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 },
  sparklineBar: { width: 20, borderRadius: 6 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  rowIconBg: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  rowInfo: { flex: 1, marginLeft: 12 },
  rowTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  rowSubtitle: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  rowAmount: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  toolsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  toolBtn: { flex: 1, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', gap: 6 },
  toolLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#334155' },
});
