import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { useRole } from '@/src/store/role-context';
import { UnderMaintenanceView } from '@/src/components/UnderMaintenanceView';

export function TechnicalTrainerDashboardView() {
  const { colors } = useExecutiveTheme();
  const { data: settings } = useAppSettings();
  const { role } = useRole();

  const isAdminOrSuperAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN';
  const isMaintenanceOn = Boolean(settings?.agriMaintenanceMode);

  if (isMaintenanceOn && !isAdminOrSuperAdmin) {
    return <UnderMaintenanceView moduleName="Technical Trainer" />;
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header Banner */}
      <LinearGradient colors={['#312e81', '#4338ca', '#4f46e5']} style={styles.headerBanner}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingText}>Welcome Back,</Text>
            <Text style={styles.roleTitle}>Technical Trainer ✨</Text>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="school" size={24} color="#4f46e5" />
          </View>
        </View>
        <Text style={styles.subtext}>Your mission: Train new farmers & verify expertise.</Text>
      </LinearGradient>

      {/* Quick Stats Row */}
      <View style={styles.statsContainer}>
        <View style={[styles.statBox, { backgroundColor: '#f0fdf4', borderColor: '#86efac' }]}>
          <Ionicons name="people" size={24} color="#166534" style={styles.statIcon} />
          <Text style={styles.statNumber}>124</Text>
          <Text style={styles.statLabel}>New Farmers</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#fff7ed', borderColor: '#fdba74' }]}>
          <Ionicons name="call" size={24} color="#c2410c" style={styles.statIcon} />
          <Text style={styles.statNumber}>18</Text>
          <Text style={styles.statLabel}>Pending Calls</Text>
        </View>
        <View style={[styles.statBox, { backgroundColor: '#eff6ff', borderColor: '#93c5fd' }]}>
          <Ionicons name="checkmark-done-circle" size={24} color="#1d4ed8" style={styles.statIcon} />
          <Text style={styles.statNumber}>89</Text>
          <Text style={styles.statLabel}>Trained</Text>
        </View>
      </View>

      {/* Action Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Action Center</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={[styles.gridItem, premiumShadow('#0f172a', 'sm'), { backgroundColor: colors.cardBg }]} activeOpacity={0.8}>
            <LinearGradient colors={['#e0e7ff', '#c7d2fe']} style={styles.gridIconBox}>
              <Ionicons name="headset" size={28} color="#4338ca" />
            </LinearGradient>
            <Text style={[styles.gridItemTitle, { color: colors.text }]}>Call Farmers</Text>
            <Text style={styles.gridItemDesc}>Pending training calls</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.gridItem, premiumShadow('#0f172a', 'sm'), { backgroundColor: colors.cardBg }]} activeOpacity={0.8}>
            <LinearGradient colors={['#dcfce7', '#bbf7d0']} style={styles.gridIconBox}>
              <Ionicons name="document-text" size={28} color="#15803d" />
            </LinearGradient>
            <Text style={[styles.gridItemTitle, { color: colors.text }]}>Training Logs</Text>
            <Text style={styles.gridItemDesc}>View session history</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.gridItem, premiumShadow('#0f172a', 'sm'), { backgroundColor: colors.cardBg }]} activeOpacity={0.8}>
            <LinearGradient colors={['#ffedd5', '#fed7aa']} style={styles.gridIconBox}>
              <Ionicons name="ribbon" size={28} color="#c2410c" />
            </LinearGradient>
            <Text style={[styles.gridItemTitle, { color: colors.text }]}>Certifications</Text>
            <Text style={styles.gridItemDesc}>Verify expert farmers</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.gridItem, premiumShadow('#0f172a', 'sm'), { backgroundColor: colors.cardBg }]} activeOpacity={0.8}>
            <LinearGradient colors={['#f3e8ff', '#e9d5ff']} style={styles.gridIconBox}>
              <Ionicons name="analytics" size={28} color="#7e22ce" />
            </LinearGradient>
            <Text style={[styles.gridItemTitle, { color: colors.text }]}>Performance</Text>
            <Text style={styles.gridItemDesc}>My training metrics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Recent Training List Placeholder */}
      <View style={[styles.section, { marginBottom: 30 }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Pending Calls</Text>
          <TouchableOpacity><Text style={{ color: '#4f46e5', fontFamily: FONT.bold, fontSize: 13 }}>View All</Text></TouchableOpacity>
        </View>
        <View style={[styles.listCard, premiumShadow('#0f172a', 'sm'), { backgroundColor: colors.cardBg }]}>
          {[1,2,3].map((i, index) => (
            <View key={i} style={[styles.listItem, index === 2 && { borderBottomWidth: 0 }]}>
              <View style={styles.listAvatar}>
                <Ionicons name="person" size={20} color="#64748b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.listName, { color: colors.text }]}>Farmer #{1024 + i}</Text>
                <Text style={styles.listDesc}>Registered 2 hrs ago</Text>
              </View>
              <TouchableOpacity style={styles.callBtn}>
                <Ionicons name="call" size={16} color="#fff" />
                <Text style={styles.callBtnText}>Call</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBanner: { padding: 20, paddingTop: 30, paddingBottom: 35, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greetingText: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: FONT.bold },
  roleTitle: { color: '#ffffff', fontSize: 22, fontFamily: FONT.extraBold, marginTop: 2 },
  iconCircle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  subtext: { color: 'rgba(255,255,255,0.9)', fontSize: 12, fontFamily: FONT.medium, marginTop: 8 },
  
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, marginTop: -25, gap: 10 },
  statBox: { flex: 1, padding: 12, borderRadius: RADIUS.lg, borderWidth: 1.5, alignItems: 'center' },
  statIcon: { marginBottom: 4 },
  statNumber: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a' },
  statLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#475569', textAlign: 'center' },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: { fontSize: 16, fontFamily: FONT.extraBold, marginBottom: 12 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  gridItem: { width: '48%', padding: 16, borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center' },
  gridIconBox: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  gridItemTitle: { fontSize: 14, fontFamily: FONT.bold, marginBottom: 4 },
  gridItemDesc: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' },

  listCard: { borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 10, paddingHorizontal: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listName: { fontSize: 14, fontFamily: FONT.bold },
  listDesc: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 2 },
  callBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#16a34a', paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.pill, gap: 4 },
  callBtnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
});
