import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RegisteredCropField } from '@/src/store/crops-context';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

const theme = RoleThemes.FARMER;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export interface ParsedScheduleTask {
  id: string;
  dayNumber: number;
  taskTitle: string;
  dueDateStr: string;
  dueDateObj: Date;
  status: 'DONE' | 'SKIPPED' | 'PENDING';
  completedDate?: string;
  skipReason?: string;
  autoSkipped?: boolean;
}

interface CropScheduleViewerModalProps {
  visible: boolean;
  crop: RegisteredCropField | null;
  onClose: () => void;
  onUpdateSchedule: (cropId: string, updatedScheduleStr: string) => void;
}

/** Parse date string like "15 Nov 2025" or "2025-11-15" into Date object */
const parsePlantationDate = (dateStr?: string): Date => {
  if (!dateStr) return new Date();
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) return parsed;

  const parts = dateStr.split(' ');
  if (parts.length >= 3) {
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1];
    const year = parseInt(parts[2], 10);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = monthNames.findIndex((m) => m.toLowerCase() === monthStr.substring(0, 3).toLowerCase());
    if (!isNaN(day) && monthIndex !== -1 && !isNaN(year)) {
      return new Date(year, monthIndex, day);
    }
  }
  return new Date();
};

/** Calculate calendar date given plantation date and day number */
const calculateTaskDateObj = (plantationDate: Date, dayNumber: number): Date => {
  const d = new Date(plantationDate);
  d.setDate(d.getDate() + (dayNumber - 1));
  return d;
};

const formatDateStr = (dateObj: Date): string => {
  return dateObj.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export function CropScheduleViewerModal({
  visible,
  crop,
  onClose,
  onUpdateSchedule,
}: CropScheduleViewerModalProps) {
  const [completionDateInput, setCompletionDateInput] = useState<string>(
    new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
  );

  const [skipReasonInput, setSkipReasonInput] = useState<string>('');
  const [isSkipModalOpen, setIsSkipModalOpen] = useState<boolean>(false);
  const [activeTaskToSkip, setActiveTaskToSkip] = useState<ParsedScheduleTask | null>(null);

  // Parse raw schedule string into structured tasks with 5-day auto-skip check
  const parsedTasks = useMemo<ParsedScheduleTask[]>(() => {
    if (!crop || !crop.assignedSchedule) return [];

    const plantDateObj = parsePlantationDate(crop.sowingDate);
    const lines = crop.assignedSchedule.split('\n');
    const tasks: ParsedScheduleTask[] = [];

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    lines.forEach((line, idx) => {
      if (!line.trim()) return;

      // Extract day number, status tags if any
      const match = line.match(/\[?Day\s*(\d+).*?\]?:\s*(.*)/i);
      let dayNumber = (idx + 1) * 3;
      let taskTitle = line.trim();

      if (match) {
        dayNumber = parseInt(match[1], 10) || dayNumber;
        taskTitle = match[2].trim();
      }

      const dueDateObj = calculateTaskDateObj(plantDateObj, dayNumber);
      const dueDateStr = formatDateStr(dueDateObj);

      let status: 'DONE' | 'SKIPPED' | 'PENDING' = 'PENDING';
      let completedDate: string | undefined;
      let skipReason: string | undefined;
      let autoSkipped = false;

      if (taskTitle.includes('✔️ DONE')) {
        status = 'DONE';
        const doneMatch = taskTitle.match(/Done on (.*?)\)/i);
        if (doneMatch) completedDate = doneMatch[1];
        taskTitle = taskTitle.replace(/\s*\(✔️ DONE.*?\)/i, '').replace(/✔️ DONE:\s*/i, '');
      } else if (taskTitle.includes('⏭️ SKIPPED')) {
        status = 'SKIPPED';
        if (taskTitle.includes('Auto-Skipped')) autoSkipped = true;
        taskTitle = taskTitle.replace(/\s*\(⏭️ SKIPPED.*?\)/i, '').replace(/⏭️ SKIPPED:\s*/i, '');
      } else {
        // Auto 5-Day Expiry Check: If task is pending and overdue > 5 days, auto-mark as SKIPPED
        const dueWithoutTime = new Date(dueDateObj);
        dueWithoutTime.setHours(0, 0, 0, 0);
        const diffTime = now.getTime() - dueWithoutTime.getTime();
        const overdueDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (overdueDays >= 5) {
          status = 'SKIPPED';
          autoSkipped = true;
          skipReason = 'Auto-Skipped (5 Days Limit Expired)';
        }
      }

      tasks.push({
        id: `task_${idx}_${dayNumber}`,
        dayNumber,
        taskTitle,
        dueDateStr,
        dueDateObj,
        status,
        completedDate,
        skipReason,
        autoSkipped,
      });
    });

    return tasks.sort((a, b) => a.dayNumber - b.dayNumber);
  }, [crop]);

  // Separate into Previous Schedule Tasks & Next Upcoming Schedule Task
  const previousTasks = useMemo(() => parsedTasks.filter((t) => t.status !== 'PENDING'), [parsedTasks]);
  const upcomingTasks = useMemo(() => parsedTasks.filter((t) => t.status === 'PENDING'), [parsedTasks]);

  // Display only 1 most recent history entry
  const displayPreviousTasks = useMemo(() => {
    if (previousTasks.length === 0) return [];
    return [previousTasks[previousTasks.length - 1]];
  }, [previousTasks]);

  // Display only 1 next upcoming task
  const nextTask = useMemo(() => {
    return upcomingTasks[0] || null;
  }, [upcomingTasks]);

  const handleMarkTaskAsDone = (task: ParsedScheduleTask) => {
    if (!crop) return;
    tap();

    const doneDate = completionDateInput.trim() || formatDateStr(new Date());

    const updatedTasks = parsedTasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          status: 'DONE' as const,
          completedDate: doneDate,
        };
      }
      return t;
    });

    saveUpdatedTasksString(updatedTasks);

    if (Platform.OS === 'web') {
      alert(`✅ Task "Day ${task.dayNumber}: ${task.taskTitle}" marked as DONE on ${doneDate}!`);
    } else {
      Alert.alert('Task Completed ✅', `Marked as Done on ${doneDate}.`);
    }
  };

  const handleConfirmSkipTask = () => {
    if (!crop || !activeTaskToSkip) return;
    tap();

    const reasonStr = skipReasonInput.trim() || 'Skipped by farmer';

    const updatedTasks = parsedTasks.map((t) => {
      if (t.id === activeTaskToSkip.id) {
        return {
          ...t,
          status: 'SKIPPED' as const,
          skipReason: reasonStr,
        };
      }
      return t;
    });

    saveUpdatedTasksString(updatedTasks);
    setIsSkipModalOpen(false);
    setActiveTaskToSkip(null);
    setSkipReasonInput('');

    if (Platform.OS === 'web') {
      alert(`⏭️ Task "Day ${activeTaskToSkip.dayNumber}" marked as SKIPPED.`);
    } else {
      Alert.alert('Task Skipped ⏭️', 'Schedule task marked as skipped.');
    }
  };

  const saveUpdatedTasksString = (tasks: ParsedScheduleTask[]) => {
    if (!crop) return;

    const plantDateObj = parsePlantationDate(crop.sowingDate);
    const lines = tasks.map((t) => {
      const dateStr = formatDateStr(calculateTaskDateObj(plantDateObj, t.dayNumber));
      if (t.status === 'DONE') {
        return `[Day ${t.dayNumber} · ${dateStr}]: ${t.taskTitle} (✔️ DONE: Done on ${t.completedDate || dateStr})`;
      } else if (t.status === 'SKIPPED') {
        const reasonTag = t.autoSkipped ? 'Auto-Skipped after 5 days' : t.skipReason || 'Skipped';
        return `[Day ${t.dayNumber} · ${dateStr}]: ${t.taskTitle} (⏭️ SKIPPED: ${reasonTag})`;
      } else {
        return `[Day ${t.dayNumber} · ${dateStr}]: ${t.taskTitle}`;
      }
    });

    onUpdateSchedule(crop.id, lines.join('\n'));
  };

  if (!crop) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxHeight: '92%' }]}>
          {/* Header */}
          <View style={styles.modalHeaderRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.modalTitle}>📅 Crop Advisory Schedule</Text>
              <Text style={styles.modalSub}>
                📍 {crop.fieldName} · 🌾 {crop.cropName} (Day 1 = {crop.sowingDate})
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color="#475569" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingVertical: 8 }}>
            {/* Auto 5-Day Expiry Banner */}
            <View style={styles.infoBanner}>
              <Ionicons name="time-outline" size={16} color="#0284c7" />
              <Text style={styles.infoBannerText}>
                ⚠️ <Text style={{ fontFamily: FONT.bold }}>5-Day Rule:</Text> Agar koi schedule task 5 din tak mark nahi kiya gaya, to vo automatically <Text style={{ fontFamily: FONT.bold, color: '#d97706' }}>Skipped</Text> ho jayega.
              </Text>
            </View>

            {/* NEXT UPCOMING SCHEDULE TASK SECTION */}
            <View style={[styles.sectionCard, premiumShadow(theme.primary, 'sm')]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="sparkles" size={16} color={theme.primary} />
                  <Text style={styles.sectionTitle}>Next Upcoming Schedule Task</Text>
                </View>
                <View style={styles.nextBadge}>
                  <Text style={styles.nextBadgeText}>⏰ DUE NOW</Text>
                </View>
              </View>

              {nextTask ? (
                <View style={styles.nextTaskCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={styles.dayTag}>
                      <Text style={styles.dayTagText}>Day {nextTask.dayNumber}</Text>
                    </View>
                    <Text style={styles.dueDateText}>📅 Due: {nextTask.dueDateStr}</Text>
                  </View>

                  <Text style={styles.nextTaskTitle}>{nextTask.taskTitle}</Text>

                  {/* Date Input & Mark Actions */}
                  <View style={{ marginTop: 8, gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#334155' }}>
                        Completion Date:
                      </Text>
                      <TextInput
                        style={styles.dateInput}
                        value={completionDateInput}
                        onChangeText={setCompletionDateInput}
                        placeholder="DD MMM YYYY"
                      />
                    </View>

                    <View style={styles.btnRow}>
                      <TouchableOpacity
                        style={styles.doneBtn}
                        activeOpacity={0.85}
                        onPress={() => handleMarkTaskAsDone(nextTask)}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                        <Text style={styles.btnText}>✔️ Mark as Done</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.skipBtn}
                        activeOpacity={0.85}
                        onPress={() => {
                          tap();
                          setActiveTaskToSkip(nextTask);
                          setIsSkipModalOpen(true);
                        }}
                      >
                        <Ionicons name="play-forward-outline" size={16} color="#b45309" />
                        <Text style={[styles.btnText, { color: '#b45309' }]}>⏭️ Mark as Skipped</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.allDoneBox}>
                  <Ionicons name="checkmark-done-circle" size={32} color="#16a34a" />
                  <Text style={styles.allDoneTitle}>All Schedule Tasks Completed!</Text>
                  <Text style={styles.allDoneSub}>You have finished or completed all advisory schedule tasks for this crop.</Text>
                </View>
              )}
            </View>

            {/* PREVIOUS SCHEDULE TASKS SECTION */}
            <View style={styles.sectionCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="time" size={16} color="#475569" />
                <Text style={styles.sectionTitle}>Previous Schedule History ({displayPreviousTasks.length})</Text>
              </View>

              {displayPreviousTasks.length > 0 ? (
                displayPreviousTasks.map((t) => (
                  <View key={t.id} style={styles.historyTaskItem}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                      <View
                        style={[
                          styles.historyStatusDot,
                          t.status === 'DONE' ? { backgroundColor: '#16a34a' } : { backgroundColor: '#d97706' },
                        ]}
                      />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.historyDayText}>Day {t.dayNumber} ({t.dueDateStr})</Text>
                          {t.status === 'DONE' ? (
                            <View style={styles.doneChip}>
                              <Text style={styles.doneChipText}>✔️ DONE</Text>
                            </View>
                          ) : (
                            <View style={styles.skipChip}>
                              <Text style={styles.skipChipText}>
                                {t.autoSkipped ? '⏭️ AUTO-SKIPPED (5 Days)' : '⏭️ SKIPPED'}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.historyTaskTitle}>{t.taskTitle}</Text>

                        {t.status === 'DONE' && t.completedDate ? (
                          <Text style={styles.historyMetaText}>Completed on: {t.completedDate}</Text>
                        ) : null}

                        {t.status === 'SKIPPED' && t.skipReason ? (
                          <Text style={[styles.historyMetaText, { color: '#b45309' }]}>Reason: {t.skipReason}</Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                ))
              ) : (
                <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', padding: 8 }}>
                  No previous completed or skipped tasks yet.
                </Text>
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* SKIP REASON MODAL */}
      <Modal visible={isSkipModalOpen} transparent animationType="fade" onRequestClose={() => setIsSkipModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxWidth: 360 }]}>
            <Text style={{ fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 4 }}>
              ⏭️ Skip Schedule Task
            </Text>
            <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginBottom: 10 }}>
              Day {activeTaskToSkip?.dayNumber}: {activeTaskToSkip?.taskTitle}
            </Text>

            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#334155', marginBottom: 4 }}>
              Reason for skipping (Optional):
            </Text>
            <TextInput
              style={styles.reasonInput}
              value={skipReasonInput}
              onChangeText={setSkipReasonInput}
              placeholder="e.g. Rain delayed spray / Material unavailable"
            />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={[styles.cancelBtn, { flex: 1 }]}
                onPress={() => setIsSkipModalOpen(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmSkipBtn, { flex: 1 }]}
                onPress={handleConfirmSkipTask}
              >
                <Text style={styles.confirmSkipBtnText}>Confirm Skip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a', marginTop: 2 },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#f0f9ff', padding: 10, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#bae6fd' },
  infoBannerText: { flex: 1, fontSize: 11.5, fontFamily: FONT.medium, color: '#0369a1' },
  sectionCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  sectionTitle: { fontSize: 13.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  nextBadge: { backgroundColor: '#f0fdf4', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill, borderWidth: 1, borderColor: '#bbf7d0' },
  nextBadgeText: { fontSize: 10, fontFamily: FONT.bold, color: '#16a34a' },
  nextTaskCard: { backgroundColor: '#f8fafc', borderRadius: RADIUS.md, padding: 12, borderWidth: 1.5, borderColor: '#bbf7d0', gap: 6 },
  dayTag: { backgroundColor: theme.primary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  dayTagText: { color: '#ffffff', fontSize: 11, fontFamily: FONT.bold },
  dueDateText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#15803d' },
  nextTaskTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a', marginTop: 2 },
  dateInput: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.sm, paddingHorizontal: 10, paddingVertical: 5, fontSize: 12, color: '#0f172a' },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  doneBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: theme.primary, paddingVertical: 10, borderRadius: RADIUS.md },
  skipBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a', paddingVertical: 10, borderRadius: RADIUS.md },
  btnText: { color: '#ffffff', fontSize: 12, fontFamily: FONT.bold },
  allDoneBox: { alignItems: 'center', justifyContent: 'center', padding: 16, gap: 4 },
  allDoneTitle: { fontSize: 14, fontFamily: FONT.bold, color: '#16a34a' },
  allDoneSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center' },
  historyTaskItem: { backgroundColor: '#f8fafc', borderRadius: RADIUS.md, padding: 10, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 6 },
  historyStatusDot: { width: 10, height: 10, borderRadius: 5 },
  historyDayText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' },
  doneChip: { backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs },
  doneChipText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#15803d' },
  skipChip: { backgroundColor: '#fffbeb', paddingHorizontal: 6, paddingVertical: 2, borderRadius: RADIUS.xs },
  skipChipText: { fontSize: 9.5, fontFamily: FONT.bold, color: '#b45309' },
  historyTaskTitle: { fontSize: 12, fontFamily: FONT.medium, color: '#334155', marginTop: 2 },
  historyMetaText: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  reasonInput: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 8, fontSize: 13, color: '#0f172a' },
  cancelBtn: { backgroundColor: '#f1f5f9', paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  cancelBtnText: { color: '#0f172a', fontSize: 12.5, fontFamily: FONT.bold },
  confirmSkipBtn: { backgroundColor: '#d97706', paddingVertical: 10, borderRadius: RADIUS.md, alignItems: 'center' },
  confirmSkipBtnText: { color: '#ffffff', fontSize: 12.5, fontFamily: FONT.bold },
});
