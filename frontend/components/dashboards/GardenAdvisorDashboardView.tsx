import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleHeader } from './RoleHeader';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { apiClient } from '@/src/api/client';

interface AdvisorTask {
  id: string;
  title: string;
  client: string;
  time: string;
  icon: string;
  color: string;
  completed: boolean;
}

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export const GardenAdvisorDashboardView: React.FC = () => {
  const theme = RoleThemes.GARDEN_ADVISOR;

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [tasks, setTasks] = useState<AdvisorTask[]>([
    { id: '1', title: 'Garden Visit & Assessment', client: 'Sukh Villas - Rose Garden', time: '09:30 AM', icon: 'navigate-outline', color: theme.primary, completed: true },
    { id: '2', title: 'Plant Health Review', client: 'Ranjeet Kumar', time: '11:00 AM', icon: 'search-outline', color: '#3b82f6', completed: false },
    { id: '3', title: 'Schedule Pruning & Care', client: 'Green Valley Lawn', time: '01:30 PM', icon: 'calendar-outline', color: '#166534', completed: false },
    { id: '4', title: 'Landscape Follow-up', client: 'Palm Resort Landscape', time: '04:00 PM', icon: 'call-outline', color: '#a855f7', completed: false },
  ]);

  const [modalType, setModalType] = useState<'TASK' | 'RECOMMEND' | null>(null);
  const [clientName, setClientName] = useState('');
  const [noteText, setNoteText] = useState('');

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const { data } = await apiClient.get('/dashboards/garden-advisor');
        if (isMounted && data) {
          setDashboardData(data);
          if (data.todayTasks) {
            setTasks(
              data.todayTasks.map((t: any, idx: number) => ({
                id: t.id ?? String(idx + 1),
                title: t.title ?? 'Task',
                client: t.client ?? 'Client Garden',
                time: t.time ?? '10:00 AM',
                icon: idx % 2 === 0 ? 'navigate-outline' : 'search-outline',
                color: t.color ?? theme.primary,
                completed: false,
              }))
            );
          }
        }
      } catch (_err) {
        // Fallback gracefully
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const toggleTask = (id: string) => {
    tap();
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleSaveModal = () => {
    if (!noteText.trim()) return;
    tap();
    if (modalType === 'TASK') {
      const newTask: AdvisorTask = {
        id: Date.now().toString(),
        title: noteText,
        client: clientName.trim() || 'Custom Client',
        time: 'Just now',
        icon: 'calendar-outline',
        color: theme.primary,
        completed: false,
      };
      setTasks([newTask, ...tasks]);
    }
    setClientName('');
    setNoteText('');
    setModalType(null);
  };

  const completedCount = tasks.filter((t) => t.completed).length;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <RoleHeader
        currentRole="GARDEN_ADVISOR"
        profileName={dashboardData?.profile?.name ?? 'Meena Sharma'}
        subtitle={dashboardData?.profile?.roleTitle ?? 'My Gardeners Specialist'}
        avatarUrl={dashboardData?.profile?.avatarUrl ?? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150'}
      />

      <View style={styles.content}>
        {/* Assigned Gardeners Card */}
        <LinearGradient colors={theme.heroGradient} style={[styles.assignedCard, premiumShadow(theme.primary, 'md')]}>
          <Ionicons name="flower" size={104} color={theme.primary} style={styles.watermark} />
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardLabelText}>Assigned Gardeners</Text>
            <View style={[styles.badgePill, { backgroundColor: theme.primaryLight }]}>
              <Text style={[styles.badgePillText, { color: theme.primary }]}>Active This Month</Text>
            </View>
          </View>
          <Text style={styles.assignedCount}>{dashboardData?.assignedGardeners?.count ?? 18}</Text>

          <View style={styles.sparklineContainer}>
            <View style={styles.sparklineBarRow}>
              {[25, 35, 30, 45, 50, 65].map((h, index) => (
                <LinearGradient key={index} colors={[theme.accent, theme.primary]} style={[styles.sparklineBar, { height: h }]} />
              ))}
            </View>
          </View>
        </LinearGradient>

        {/* 3 Metrics Row */}
        <View style={[styles.metricsRow, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Active Gardens</Text>
            <Text style={styles.metricValue}>{dashboardData?.metrics?.activeGardens ?? 29}</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorderLeft]}>
            <Text style={styles.metricLabel}>Consultations</Text>
            <Text style={styles.metricValue}>{dashboardData?.metrics?.consultations ?? 76}</Text>
          </View>
          <View style={[styles.metricItem, styles.metricBorderLeft]}>
            <Text style={styles.metricLabel}>Follow-ups</Text>
            <Text style={[styles.metricValue, { color: theme.primary }]}>{dashboardData?.metrics?.followUps ?? 21}</Text>
          </View>
        </View>

        {/* Quick Actions Row */}
        <View style={styles.quickActionRow}>
          {[
            { label: '+ Add Task', icon: 'add-circle-outline', modal: 'TASK', bg: theme.primaryLight, color: theme.primary },
            { label: '+ Recommendation', icon: 'chatbox-ellipses-outline', modal: 'RECOMMEND', bg: '#eff6ff', color: '#2563eb' },
          ].map((act, idx) => (
            <TouchableOpacity
              key={idx}
              style={[styles.actionBtn, { backgroundColor: act.bg }]}
              activeOpacity={0.75}
              onPress={() => {
                tap();
                setModalType(act.modal as any);
              }}
            >
              <Ionicons name={act.icon as any} size={18} color={act.color} />
              <Text style={[styles.actionBtnText, { color: act.color }]}>{act.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Today's Tasks */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Advisory Tasks ({completedCount}/{tasks.length})</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => setModalType('TASK')}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>+ New Task</Text>
            </TouchableOpacity>
          </View>

          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              activeOpacity={0.8}
              onPress={() => toggleTask(task.id)}
              style={[styles.taskItem, task.completed && { opacity: 0.7 }]}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => toggleTask(task.id)}
                style={[
                  styles.checkbox,
                  task.completed ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: '#cbd5e1' },
                ]}
              >
                {task.completed && <Ionicons name="checkmark" size={13} color="#ffffff" />}
              </TouchableOpacity>

              <View style={[styles.taskIconBg, { backgroundColor: task.completed ? '#f1f5f9' : theme.primaryLight }]}>
                <Ionicons name={task.icon as any} size={17} color={task.completed ? '#94a3b8' : task.color} />
              </View>

              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, task.completed && styles.strikethrough]}>{task.title}</Text>
                <Text style={styles.taskSubtitle}>{task.client}</Text>
              </View>

              <Text style={styles.taskTime}>{task.time}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Garden Health Overview */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Garden Health Status</Text>
            <View style={[styles.badgePill, { backgroundColor: '#f0fdf4' }]}>
              <Text style={{ color: '#166534', fontFamily: FONT.bold, fontSize: 11.5 }}>29 Total</Text>
            </View>
          </View>

          <View style={styles.healthStatsRow}>
            <View style={[styles.healthBox, { backgroundColor: '#f0fdf4' }]}>
              <Text style={[styles.healthVal, { color: '#166534' }]}>{dashboardData?.gardenHealth?.excellent ?? 21}</Text>
              <Text style={styles.healthSub}>Excellent</Text>
            </View>
            <View style={[styles.healthBox, { backgroundColor: '#fffbeb' }]}>
              <Text style={[styles.healthVal, { color: '#d97706' }]}>{dashboardData?.gardenHealth?.attention ?? 6}</Text>
              <Text style={styles.healthSub}>Attention</Text>
            </View>
            <View style={[styles.healthBox, { backgroundColor: '#fef2f2' }]}>
              <Text style={[styles.healthVal, { color: '#dc2626' }]}>{dashboardData?.gardenHealth?.critical ?? 2}</Text>
              <Text style={styles.healthSub}>Critical</Text>
            </View>
          </View>
        </View>

        {/* Recent Activities */}
        <View style={[styles.sectionCard, premiumShadow('#0f172a', 'sm')]}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Advisory Activity</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={[styles.viewAllText, { color: theme.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {(dashboardData?.recentActivities ?? [
            { title: 'New Care Request', desc: 'Ranjeet Kumar - Rose Garden', time: '5m ago' },
            { title: 'Pruning Schedule Added', desc: 'Green Valley Lawn', time: '20m ago' },
            { title: 'Recommendation Sent', desc: 'Palm Resort Landscape', time: '1h ago' },
          ]).map((act: any, idx: number) => (
            <View key={idx} style={styles.activityItem}>
              <View style={[styles.activityDot, { backgroundColor: theme.accent }]} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.actTitle}>{act.title}</Text>
                <Text style={styles.actDesc}>{act.desc ?? act.detail}</Text>
              </View>
              <Text style={styles.actTime}>{act.time ?? act.timeAgo}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Interactive Modal */}
      <Modal visible={modalType !== null} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalType === 'TASK' ? 'Add Advisory Task' : 'Send Garden Recommendation'}
              </Text>
              <TouchableOpacity onPress={() => setModalType(null)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Client / Garden Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="e.g. Sukhdham Estate"
              value={clientName}
              onChangeText={setClientName}
            />

            <Text style={styles.inputLabel}>
              {modalType === 'TASK' ? 'Task Title' : 'Recommendation Details'}
            </Text>
            <TextInput
              style={[styles.modalInput, { height: 75, textAlignVertical: 'top' }]}
              multiline
              placeholder={modalType === 'TASK' ? 'e.g. Inspect Marigold Pest Attack' : 'e.g. Apply 5kg Organic Vermicompost this week'}
              value={noteText}
              onChangeText={setNoteText}
            />

            <TouchableOpacity style={[styles.modalSubmitBtn, { backgroundColor: theme.primary }]} onPress={handleSaveModal}>
              <Text style={styles.modalSubmitText}>Save & Send</Text>
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
  assignedCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, overflow: 'hidden' },
  watermark: { position: 'absolute', top: -12, right: -16, opacity: 0.08 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabelText: { fontSize: 13.5, color: '#64748b', fontFamily: FONT.semiBold },
  badgePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  badgePillText: { fontSize: 11, fontFamily: FONT.bold },
  assignedCount: { fontSize: 34, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 6, letterSpacing: -0.6 },
  sparklineContainer: { marginTop: 18, height: 50, justifyContent: 'flex-end' },
  sparklineBarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 10 },
  sparklineBar: { width: 22, borderRadius: 7 },
  metricsRow: { flexDirection: 'row', backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  metricItem: { flex: 1, alignItems: 'center' },
  metricBorderLeft: { borderLeftWidth: 1, borderLeftColor: '#f1f5f9' },
  metricLabel: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium },
  metricValue: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a', marginTop: 5 },
  quickActionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 12, borderRadius: RADIUS.md },
  actionBtnText: { fontSize: 12.5, fontFamily: FONT.bold },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 15.5, fontFamily: FONT.bold, color: '#0f172a', letterSpacing: -0.1 },
  viewAllText: { fontSize: 12.5, fontFamily: FONT.bold },
  taskItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  checkbox: { width: 20, height: 20, borderRadius: 5, borderWidth: 1.8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  taskIconBg: { width: 38, height: 38, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  taskInfo: { flex: 1, marginLeft: 10 },
  taskTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  strikethrough: { textDecorationLine: 'line-through', color: '#94a3b8' },
  taskSubtitle: { fontSize: 12, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  taskTime: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  healthStatsRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  healthBox: { flex: 1, padding: 14, borderRadius: RADIUS.md, alignItems: 'center' },
  healthVal: { fontSize: 22, fontFamily: FONT.extraBold },
  healthSub: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium, marginTop: 2 },
  activityItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  activityDot: { width: 8, height: 8, borderRadius: 4 },
  actTitle: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  actDesc: { fontSize: 11.5, color: '#64748b', fontFamily: FONT.medium },
  actTime: { fontSize: 11, color: '#94a3b8', fontFamily: FONT.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { width: '100%', maxWidth: 440, backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 17, fontFamily: FONT.bold, color: '#0f172a' },
  inputLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#334155', marginTop: 10, marginBottom: 6 },
  modalInput: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0f172a', backgroundColor: '#f8fafc' },
  modalSubmitBtn: { marginTop: 20, borderRadius: RADIUS.md, paddingVertical: 14, alignItems: 'center' },
  modalSubmitText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 15 },
});

