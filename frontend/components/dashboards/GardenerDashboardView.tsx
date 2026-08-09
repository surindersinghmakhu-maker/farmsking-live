import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { apiClient } from '@/src/api/client';

interface ScheduleItem {
  id: string;
  task: string;
  loc: string;
  time: string;
  icon: string;
  completed: boolean;
}

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const GardenerDashboardView: React.FC = () => {
  const theme = RoleThemes.GARDENER;

  const [isLoading, setIsLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Interactive Schedule state
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { id: '1', task: 'Garden Maintenance', loc: 'Sukh Villas - Rose Garden', time: '09:00 AM', icon: 'flower-outline', completed: true },
    { id: '2', task: 'Plant Pruning & Trimming', loc: 'Green Valley - Lawn Area', time: '11:00 AM', icon: 'cut-outline', completed: false },
    { id: '3', task: 'Fertilizer & Pesticide Spray', loc: 'City Park - Flower Beds', time: '02:00 PM', icon: 'flask-outline', completed: false },
    { id: '4', task: 'Irrigation & Moisture Check', loc: 'Palm Resort - Landscape', time: '04:00 PM', icon: 'water-outline', completed: false },
  ]);

  // Modals state
  const [activeModal, setActiveModal] = useState<'VISIT' | 'TOOL' | 'HEALTH' | null>(null);
  const [visitLoc, setVisitLoc] = useState('');
  const [visitTask, setVisitTask] = useState('');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<'ALL' | 'EXCELLENT' | 'GOOD' | 'ATTENTION'>('ALL');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const { data } = await apiClient.get('/dashboards/gardener');
        if (isMounted && data) {
          setDashboardData(data);
          if (data.todaySchedule) {
            setSchedule(
              data.todaySchedule.map((s: any, idx: number) => ({
                id: s.id ?? String(idx + 1),
                task: s.title ?? s.task ?? 'Garden Task',
                loc: s.location ?? s.loc ?? 'Main Garden',
                time: s.time ?? '10:00 AM',
                icon: idx % 2 === 0 ? 'flower-outline' : 'water-outline',
                completed: false,
              }))
            );
          }
        }
      } catch (_err) {
        // Graceful fallback to rich local state if offline
      } finally {
        if (isMounted) setIsLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTask = (id: string) => {
    tap();
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const addVisit = () => {
    if (!visitTask.trim()) return;
    tap();
    const newTask: ScheduleItem = {
      id: Date.now().toString(),
      task: visitTask,
      loc: visitLoc.trim() || 'Custom Garden Site',
      time: 'Just now',
      icon: 'leaf-outline',
      completed: false,
    };
    setSchedule([newTask, ...schedule]);
    setVisitTask('');
    setVisitLoc('');
    setActiveModal(null);
  };

  const completedCount = schedule.filter((s) => s.completed).length;
  const progressPercent = Math.round((completedCount / (schedule.length || 1)) * 100);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="GARDENER"
        profileName={dashboardData?.profile?.name ?? 'Ranjeet Kumar'}
        subtitle={dashboardData?.profile?.roleTitle ?? 'My Garden Care Expert'}
        avatarUrl={dashboardData?.profile?.avatarUrl ?? 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150'}
      />

      <View style={styles.content}>
        {/* Today's Garden Visits Hero Banner */}
        <LinearGradient colors={theme.heroGradient} style={[styles.bannerCard, premiumShadow(theme.primary, 'md')]}>
          <View style={styles.bannerTextCol}>
            <Text style={styles.bannerLabel}>Today's Garden Visits</Text>
            <View style={styles.countRow}>
              <Text style={styles.bannerCount}>{dashboardData?.todayVisits?.count ?? schedule.length}</Text>
              <View style={[styles.badgePill, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="checkmark-circle" size={14} color={theme.primary} />
                <Text style={[styles.badgePillText, { color: theme.primary }]}>
                  {completedCount}/{schedule.length} Done
                </Text>
              </View>
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${progressPercent}%`, backgroundColor: theme.primary }]} />
            </View>
          </View>

          <LinearGradient colors={theme.gradient} style={[styles.bannerIconBox, premiumShadow(theme.primary, 'sm')]}>
            <MaterialCommunityIcons name="flower-tulip" size={36} color="#ffffff" />
          </LinearGradient>
        </LinearGradient>

        {/* Quick Stats Metrics Row */}
        <View style={[styles.metricsRow, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Active Gardens</Text>
            <Text style={styles.metricValue}>{dashboardData?.metrics?.activeGardens ?? 16}</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorderLeft]}>
            <Text style={styles.metricLabel}>In Maintenance</Text>
            <Text style={[styles.metricValue, { color: '#d97706' }]}>{dashboardData?.metrics?.maintenance ?? 5}</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorderLeft]}>
            <Text style={styles.metricLabel}>Completed</Text>
            <Text style={[styles.metricValue, { color: theme.primary }]}>{completedCount + 10}</Text>
          </View>
        </View>

        {/* Today's Interactive Schedule */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={18} color={theme.primary} />
              <Text style={styles.sectionTitle}>Today's Work Schedule</Text>
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setActiveModal('VISIT')}>
              <Text style={[styles.addBtnText, { color: theme.primary }]}>+ Add Task</Text>
            </TouchableOpacity>
          </View>

          {schedule.map((item, idx) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.8}
              onPress={() => toggleTask(item.id)}
              style={[
                styles.scheduleItem,
                idx === schedule.length - 1 && { borderBottomWidth: 0 },
                item.completed && styles.scheduleItemCompleted,
              ]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleTask(item.id)}
                style={[
                  styles.checkbox,
                  item.completed ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: '#cbd5e1' },
                ]}
              >
                {item.completed && <Ionicons name="checkmark" size={14} color="#ffffff" />}
              </TouchableOpacity>

              <View style={[styles.schedIconBg, { backgroundColor: item.completed ? '#f1f5f9' : theme.primaryLight }]}>
                <Ionicons
                  name={item.icon as any}
                  size={17}
                  color={item.completed ? '#94a3b8' : theme.primary}
                />
              </View>

              <View style={styles.schedInfo}>
                <Text style={[styles.schedTask, item.completed && styles.strikethrough]}>{item.task}</Text>
                <Text style={styles.schedLoc}>{item.loc}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.schedTime}>{item.time}</Text>
                <Text style={[styles.statusChip, { color: item.completed ? theme.primary : '#d97706' }]}>
                  {item.completed ? 'Done' : 'Pending'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tools & Inventory Quick Action Grid */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>Garden Actions & Tools</Text>
          <View style={styles.toolsGrid}>
            {[
              { label: '+ Log Visit', icon: 'add-circle-outline', modal: 'VISIT', color: theme.primary },
              { label: 'Tools Kit', icon: 'construct-outline', modal: 'TOOL', color: '#0284c7' },
              { label: 'Fertilizers', icon: 'flask-outline', modal: 'TOOL', color: '#16a34a' },
              { label: 'Health Check', icon: 'heart-pulse-outline', modal: 'HEALTH', color: '#ea580c' },
            ].map((t, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.toolBtn}
                activeOpacity={0.7}
                onPress={() => {
                  tap();
                  setActiveModal(t.modal as any);
                }}
              >
                <Ionicons name={t.icon as any} size={22} color={t.color} />
                <Text style={styles.toolLabel}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Garden Health Gauge & Breakdown */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Garden Health Rating</Text>
            <View style={[styles.healthChip, { backgroundColor: '#f0fdf4' }]}>
              <Text style={{ color: '#166534', fontFamily: FONT.bold, fontSize: 12 }}>85% Overall</Text>
            </View>
          </View>

          <View style={styles.healthGaugeRow}>
            <View style={[styles.gaugeCircle, { borderColor: theme.accent, backgroundColor: '#f8fafc' }]}>
              <Text style={[styles.gaugeScore, { color: theme.primary }]}>85</Text>
              <Text style={[styles.gaugeRating, { color: theme.primary }]}>Excellent</Text>
            </View>

            <View style={styles.gaugeLegendCol}>
              {[
                { label: 'Excellent', count: 10, color: '#10b981', key: 'EXCELLENT' },
                { label: 'Good', count: 4, color: '#3b82f6', key: 'GOOD' },
                { label: 'Needs Attention', count: 2, color: '#f59e0b', key: 'ATTENTION' },
              ].map((h, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.legendLine,
                    selectedHealthFilter === h.key && { backgroundColor: '#f1f5f9', borderRadius: RADIUS.xs, paddingHorizontal: 4 },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    tap();
                    setSelectedHealthFilter(selectedHealthFilter === h.key ? 'ALL' : (h.key as any));
                  }}
                >
                  <View style={[styles.legendDot, { backgroundColor: h.color }]} />
                  <Text style={styles.legendText}>{h.label}</Text>
                  <Text style={styles.legendCount}>{h.count} Gardens</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Add Visit / Task Modal */}
      <Modal visible={activeModal === 'VISIT'} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Garden Visit / Task</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Task Description</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Lawn Irrigation & Pruning"
              value={visitTask}
              onChangeText={setVisitTask}
            />

            <Text style={styles.inputLabel}>Location / Client Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Rose Villa Garden"
              value={visitLoc}
              onChangeText={setVisitLoc}
            />

            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={addVisit}>
              <Text style={styles.modalSubmitText}>Save Garden Visit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Tools & Health Info Modal */}
      <Modal visible={activeModal === 'TOOL' || activeModal === 'HEALTH'} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {activeModal === 'TOOL' ? 'Tools & Equipment Inventory' : 'Garden Health Analytics'}
              </Text>
              <TouchableOpacity onPress={() => setActiveModal(null)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {activeModal === 'TOOL' ? (
              <View style={{ gap: 10, marginVertical: 10 }}>
                <Text style={styles.infoRowText}>✂ Pruning Shears: 4 Units (Good Condition)</Text>
                <Text style={styles.infoRowText}>💧 Water Pumps: 2 Units Active</Text>
                <Text style={styles.infoRowText}>🌱 Vermicompost Stock: 45 kg</Text>
                <Text style={styles.infoRowText}>🧪 Organic Pest Spray: 5 Liters</Text>
              </View>
            ) : (
              <View style={{ gap: 10, marginVertical: 10 }}>
                <Text style={styles.infoRowText}>✅ 10 Gardens: Soil Moisture Optimal</Text>
                <Text style={styles.infoRowText}>ℹ 4 Gardens: Light Trimming Recommended</Text>
                <Text style={styles.infoRowText}>⚠ 2 Gardens: Scheduled for Neem Spray</Text>
              </View>
            )}

            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={() => setActiveModal(null)}>
              <Text style={styles.modalSubmitText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, gap: SPACING.lg, paddingBottom: SPACING.xxl },
  bannerCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bannerTextCol: { flex: 1, paddingRight: 12 },
  bannerLabel: { fontSize: 13, color: '#64748b', fontFamily: FONT.semiBold },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 4 },
  bannerCount: { fontSize: 36, fontFamily: FONT.extraBold, color: '#0f172a', letterSpacing: -0.6 },
  badgePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgePillText: { fontSize: 11.5, fontFamily: FONT.bold },
  progressBarBg: { height: 6, width: '100%', backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },
  bannerIconBox: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  metricsRow: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  metricItem: { flex: 1, alignItems: 'center' },
  metricBorderLeft: { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' },
  metricLabel: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium },
  metricValue: { fontSize: 18, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 4 },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  addBtnText: { fontSize: 13, fontFamily: FONT.bold },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  scheduleItemCompleted: { opacity: 0.75 },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  schedIconBg: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  schedInfo: { flex: 1, marginLeft: 10 },
  schedTask: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  strikethrough: { textDecorationLine: 'line-through', color: '#94a3b8' },
  schedLoc: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  schedTime: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  statusChip: { fontSize: 11, fontFamily: FONT.bold, marginTop: 2 },
  toolsGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  toolBtn: { flex: 1, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: 6 },
  toolLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#334155' },
  healthChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  healthGaugeRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 4 },
  gaugeCircle: { width: 94, height: 94, borderRadius: 47, borderWidth: 6, alignItems: 'center', justifyContent: 'center' },
  gaugeScore: { fontSize: 26, fontFamily: FONT.extraBold },
  gaugeRating: { fontSize: 11, fontFamily: FONT.bold },
  gaugeLegendCol: { flex: 1, gap: 8 },
  legendLine: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3 },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendText: { flex: 1, fontSize: 12.5, color: '#475569', fontFamily: FONT.medium },
  legendCount: { fontSize: 12.5, fontFamily: FONT.bold, color: '#0f172a' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontFamily: FONT.bold, color: '#0f172a' },
  inputLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#334155', marginTop: 10, marginBottom: 6 },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  modalSubmitBtn: { marginTop: 20, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 15 },
  infoRowText: { fontSize: 13.5, fontFamily: FONT.medium, color: '#334155', paddingVertical: 4 },
});

