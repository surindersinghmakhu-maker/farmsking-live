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
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';

interface ScheduleItem {
  id: string;
  task: string;
  loc: string;
  time: string;
  icon: keyof typeof Ionicons.glyphMap;
  completed: boolean;
}

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export default function GardenSystemScreen() {
  const router = useRouter();
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor, innerBg } = useExecutiveTheme();

  // Interactive Schedule state
  const [schedule, setSchedule] = useState<ScheduleItem[]>([
    { id: '1', task: 'Garden Maintenance & Lawn Mowing', loc: 'Sukh Villas - Rose Garden', time: '09:00 AM', icon: 'flower-outline', completed: true },
    { id: '2', task: 'Plant Pruning & Shrub Trimming', loc: 'Green Valley - Front Lawn', time: '11:00 AM', icon: 'cut-outline', completed: false },
    { id: '3', task: 'Plant Nutrition & Organic Spray Dosing', loc: 'City Flora Park - Flower Beds', time: '02:00 PM', icon: 'flask-outline', completed: false },
    { id: '4', task: 'Smart Irrigation & Soil Moisture Audit', loc: 'Palm Resort - Landscape Area', time: '04:00 PM', icon: 'water-outline', completed: false },
  ]);

  // Modals state
  const [activeModal, setActiveModal] = useState<'VISIT' | 'TOOL' | 'HEALTH' | null>(null);
  const [visitLoc, setVisitLoc] = useState('');
  const [visitTask, setVisitTask] = useState('');
  const [toolName, setToolName] = useState('');
  const [toolQty, setToolQty] = useState('1');
  const [selectedHealthFilter, setSelectedHealthFilter] = useState<'ALL' | 'EXCELLENT' | 'GOOD' | 'ATTENTION'>('ALL');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleTask = (id: string) => {
    tap();
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? { ...item, completed: !item.completed } : item))
    );
  };

  const handleAddVisit = () => {
    if (!visitLoc.trim() || !visitTask.trim()) return;
    tap();
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      task: visitTask.trim(),
      loc: visitLoc.trim(),
      time: 'Flexible Today',
      icon: 'calendar-outline',
      completed: false,
    };
    setSchedule((prev) => [newItem, ...prev]);
    setVisitLoc('');
    setVisitTask('');
    setActiveModal(null);
    showToast('✅ Garden visit scheduled successfully');
  };

  const handleAddTool = () => {
    if (!toolName.trim()) return;
    tap();
    setActiveModal(null);
    setToolName('');
    setToolQty('1');
    showToast(`🛠️ Equipment recorded: ${toolName}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* ── Header ────────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderBottomColor: cardBorder }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.crownBadge, { backgroundColor: isLight ? 'rgba(236, 72, 153, 0.08)' : 'rgba(236, 72, 153, 0.15)', borderColor: isLight ? 'rgba(236, 72, 153, 0.3)' : 'rgba(236, 72, 153, 0.4)' }]}>
            <Ionicons name="flower" size={15} color="#ec4899" />
            <Text style={styles.crownText}>GARDEN CARE & HORTICULTURE</Text>
          </View>
          <Text style={[styles.headerTitle, { color: textColor }]}>Garden Care & Plant Health System</Text>
          <Text style={[styles.headerSubtitle, { color: subTextColor }]}>
            Landscape maintenance, plant nutrition doses, automated irrigation schedules, and flora health telemetry.
          </Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, { backgroundColor: '#ec4899' }]}
            onPress={() => setActiveModal('VISIT')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={16} color="#ffffff" />
            <Text style={styles.primaryActionBtnText}>New Garden Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Toast ──────────────────────────────────────────────── */}
      {toastMessage && (
        <View style={[styles.toast, isLight && styles.toastLight]}>
          <Ionicons name="sparkles" size={16} color="#ec4899" />
          <Text style={[styles.toastText, isLight && { color: '#0f172a' }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Main Scrollable Area ──────────────────────────────── */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* KPI Metrics Strip */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.12)' }]}>
              <Ionicons name="flower" size={20} color="#ec4899" />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: textColor }]}>1,420+</Text>
              <Text style={[styles.metricLabel, { color: subTextColor }]}>Plants Monitored</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}>
              <Ionicons name="water" size={20} color="#38bdf8" />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: '#38bdf8' }]}>Optimal</Text>
              <Text style={[styles.metricLabel, { color: subTextColor }]}>Moisture & Water</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(34, 197, 94, 0.12)' }]}>
              <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: '#22c55e' }]}>98.4%</Text>
              <Text style={[styles.metricLabel, { color: subTextColor }]}>Flora Health Index</Text>
            </View>
          </View>

          <View style={[styles.metricCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={[styles.metricIconWrap, { backgroundColor: 'rgba(245, 158, 11, 0.12)' }]}>
              <Ionicons name="calendar" size={20} color="#f59e0b" />
            </View>
            <View>
              <Text style={[styles.metricValue, { color: '#f59e0b' }]}>{schedule.filter(s => !s.completed).length} Pending</Text>
              <Text style={[styles.metricLabel, { color: subTextColor }]}>Active Tasks Today</Text>
            </View>
          </View>
        </View>

        {/* Quick Tools Launch Strip */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Ionicons name="apps" size={18} color="#ec4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Integrated Garden Modules & Tools</Text>
              <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                Direct access to spray dose calculator, landscape radar, AI diagnostics, and garden supplies.
              </Text>
            </View>
          </View>

          <View style={styles.toolsGrid}>
            <TouchableOpacity
              style={[styles.toolChip, { backgroundColor: innerBg, borderColor: cardBorder }]}
              onPress={() => router.push('/admin/(tabs)/dose' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="nutrition" size={20} color="#ec4899" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.toolTitle, { color: textColor }]}>Nutrition & Spray Doses</Text>
                <Text style={[styles.toolSub, { color: subTextColor }]}>Plant dosage & micronutrients</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={subTextColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolChip, { backgroundColor: innerBg, borderColor: cardBorder }]}
              onPress={() => router.push('/admin/(tabs)/satellite-map?mode=GARDEN' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="planet" size={20} color="#38bdf8" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.toolTitle, { color: textColor }]}>Garden Landscape Radar</Text>
                <Text style={[styles.toolSub, { color: subTextColor }]}>Satellite canopy & vegetation</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={subTextColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolChip, { backgroundColor: innerBg, borderColor: cardBorder }]}
              onPress={() => router.push('/admin/(tabs)/crop-disease-scanner' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="scan" size={20} color="#22c55e" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.toolTitle, { color: textColor }]}>AI Plant Disease Scanner</Text>
                <Text style={[styles.toolSub, { color: subTextColor }]}>Instant leaf & leaf-spot analysis</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={subTextColor} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolChip, { backgroundColor: innerBg, borderColor: cardBorder }]}
              onPress={() => router.push('/admin/(tabs)/admin-products?category=GARDEN' as any)}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-handle" size={20} color="#f59e0b" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.toolTitle, { color: textColor }]}>Flora & Garden Store</Text>
                <Text style={[styles.toolSub, { color: subTextColor }]}>Tools, pots, seeds & organic spray</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={subTextColor} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Garden Operations & Task Schedule */}
        <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={[styles.sectionHeader, { borderBottomColor: cardBorder }]}>
            <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
              <Ionicons name="list" size={18} color="#ec4899" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>Daily Garden Operations & Tasks</Text>
              <Text style={[styles.sectionSubtitle, { color: subTextColor }]}>
                Track real-time maintenance routines, pruning, spray treatments, and moisture inspections.
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toolBtn, { backgroundColor: innerBg, borderColor: cardBorder }]}
              onPress={() => setActiveModal('TOOL')}
            >
              <Ionicons name="construct-outline" size={14} color={textColor} />
              <Text style={[styles.toolBtnText, { color: textColor }]}>Equipment</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.taskList}>
            {schedule.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.taskRow,
                  { backgroundColor: innerBg, borderColor: cardBorder },
                  item.completed && styles.taskRowCompleted,
                ]}
                activeOpacity={0.8}
                onPress={() => toggleTask(item.id)}
              >
                <View
                  style={[
                    styles.checkbox,
                    item.completed && { backgroundColor: '#22c55e', borderColor: '#22c55e' },
                    !item.completed && { borderColor: subTextColor },
                  ]}
                >
                  {item.completed && <Ionicons name="checkmark" size={13} color="#ffffff" />}
                </View>

                <View style={[styles.taskIconCircle, { backgroundColor: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)' }]}>
                  <Ionicons name={item.icon} size={18} color={item.completed ? '#22c55e' : '#ec4899'} />
                </View>

                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.taskTitle,
                      { color: textColor },
                      item.completed && styles.taskTitleCompleted,
                    ]}
                  >
                    {item.task}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="location-outline" size={12} color={subTextColor} />
                      <Text style={[styles.taskMeta, { color: subTextColor }]}>{item.loc}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="time-outline" size={12} color={subTextColor} />
                      <Text style={[styles.taskMeta, { color: subTextColor }]}>{item.time}</Text>
                    </View>
                  </View>
                </View>

                <View
                  style={[
                    styles.taskBadge,
                    item.completed ? styles.taskBadgeDone : styles.taskBadgePending,
                  ]}
                >
                  <Text
                    style={[
                      styles.taskBadgeText,
                      item.completed ? { color: '#22c55e' } : { color: '#f59e0b' },
                    ]}
                  >
                    {item.completed ? 'COMPLETED' : 'IN PROGRESS'}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Modal: Schedule Garden Visit ──────────────────────── */}
      <Modal visible={activeModal === 'VISIT'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
                <Ionicons name="calendar" size={18} color="#ec4899" />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>Schedule Garden Visit / Task</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginTop: 8 }}>
              <View>
                <Text style={[styles.inputLabel, { color: textColor }]}>Location / Garden Name</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  placeholder="e.g. Model Town Lawn, Villa Rose Bed"
                  placeholderTextColor={subTextColor}
                  value={visitLoc}
                  onChangeText={setVisitLoc}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: textColor }]}>Operation / Task Details</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  placeholder="e.g. Plant trimming & organic spray dosing"
                  placeholderTextColor={subTextColor}
                  value={visitTask}
                  onChangeText={setVisitTask}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: cardBorder }]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.cancelBtnText, { color: subTextColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#ec4899' }]}
                onPress={handleAddVisit}
              >
                <Text style={styles.submitBtnText}>Add to Schedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal: Equipment & Tools Log ──────────────────────── */}
      <Modal visible={activeModal === 'TOOL'} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.modalHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                <Ionicons name="construct" size={18} color="#38bdf8" />
              </View>
              <Text style={[styles.modalTitle, { color: textColor }]}>Add Garden Equipment</Text>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={{ padding: 4 }}>
                <Ionicons name="close" size={20} color={subTextColor} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12, marginTop: 8 }}>
              <View>
                <Text style={[styles.inputLabel, { color: textColor }]}>Tool / Machine Name</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  placeholder="e.g. Electric Hedge Trimmer, Lawn Mower"
                  placeholderTextColor={subTextColor}
                  value={toolName}
                  onChangeText={setToolName}
                />
              </View>

              <View>
                <Text style={[styles.inputLabel, { color: textColor }]}>Quantity Available</Text>
                <TextInput
                  style={[styles.inputField, { backgroundColor: isLight ? '#ffffff' : '#03140a', borderColor: cardBorder, color: textColor }]}
                  placeholder="1"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                  value={toolQty}
                  onChangeText={setToolQty}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: cardBorder }]}
                onPress={() => setActiveModal(null)}
              >
                <Text style={[styles.cancelBtnText, { color: subTextColor }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: '#38bdf8' }]}
                onPress={handleAddTool}
              >
                <Text style={styles.submitBtnText}>Save Equipment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    minWidth: 240,
  },
  crownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 6,
  },
  crownText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#ec4899',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  toast: {
    position: 'absolute',
    top: 90,
    right: 24,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1e1b4b',
    borderWidth: 1,
    borderColor: '#ec4899',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 8,
  },
  toastLight: {
    backgroundColor: '#fdf2f8',
    borderColor: '#ec4899',
  },
  toastText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 14,
    gap: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  sectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    paddingBottom: 10,
    flexWrap: 'wrap',
  },
  sectionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolChip: {
    flex: 1,
    minWidth: 220,
    borderRadius: 9,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toolTitle: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  toolSub: {
    fontSize: 10.5,
    marginTop: 1,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  toolBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  taskList: {
    gap: 8,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
  },
  taskRowCompleted: {
    opacity: 0.65,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  taskTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    fontSize: 10.5,
  },
  taskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  taskBadgeDone: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
  },
  taskBadgePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
  },
  taskBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalBox: {
    width: '100%',
    maxWidth: 440,
    borderRadius: 14,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 5,
  },
  inputField: {
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 13,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '800',
  },
});
