import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.FARM_ADVISOR;

const TIMELINE = [
  { date: '25 Mar', task: 'Plantation', status: 'Completed' },
  { date: '30 Mar', task: 'Root Booster', status: 'Completed' },
  { date: '05 Apr', task: 'DAP', status: 'Completed' },
  { date: '12 Apr', task: 'Micronutrient', status: 'Completed' },
  { date: '18 Apr', task: 'Fungicide Spray', status: 'Completed' },
  { date: '25 Apr', task: 'Insecticide Spray', status: 'Pending' },
];

const STATUS_COLOR: Record<string, string> = {
  Completed: '#22c55e',
  Pending: '#f59e0b',
};

export default function ScheduleScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Schedule Timeline</Text>
        <Text style={styles.heroSubtitle}>Kisan Veer · Marigold (Thailand Marigold)</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.timelineCard, premiumShadow('#0f172a', 'sm')]}>
          {TIMELINE.map((item, idx) => (
            <View key={item.date} style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
                {idx !== TIMELINE.length - 1 && <View style={styles.line} />}
              </View>
              <View style={styles.timelineContent}>
                <Text style={styles.timelineDate}>{item.date}</Text>
                <Text style={styles.timelineTask}>{item.task}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${STATUS_COLOR[item.status]}20` }]}>
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>{item.status}</Text>
              </View>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.addButton} activeOpacity={0.85}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addButtonText}>Insert New Schedule</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.bg },
  hero: { paddingTop: 20, paddingBottom: 20, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontFamily: FONT.medium, marginTop: 3 },
  body: { padding: SPACING.xxl },
  timelineCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start' },
  timelineLeft: { alignItems: 'center', width: 20 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  line: { width: 2, flex: 1, backgroundColor: '#e2e8f0', marginVertical: 2, minHeight: 24 },
  timelineContent: { flex: 1, marginLeft: 12, paddingBottom: 18 },
  timelineDate: { fontSize: 11.5, color: '#94a3b8', fontFamily: FONT.medium },
  timelineTask: { fontSize: 14, fontFamily: FONT.bold, color: '#0f172a', marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill, height: 22 },
  statusText: { fontSize: 10.5, fontFamily: FONT.bold },
  addButton: {
    flexDirection: 'row', gap: 8, backgroundColor: theme.primary, borderRadius: RADIUS.md,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  addButtonText: { color: '#fff', fontSize: 15, fontFamily: FONT.bold },
});
