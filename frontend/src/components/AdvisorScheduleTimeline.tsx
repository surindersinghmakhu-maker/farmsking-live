import React, { useState } from 'react';
import { ActivityIndicator, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useBulkCreateSchedules, useSchedulesForCropCycle } from '@/src/hooks/useCropActivitySchedules';
import { useMySprayItemTemplates } from '@/src/hooks/useSprayItemTemplates';
import { QuickAddDoseItemModal } from '@/src/components/QuickAddDoseItemModal';
import { ActivityType, CropActivitySchedule } from '@/src/types/api';

const theme = RoleThemes.FARM_ADVISOR;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const ACTIVITY_TYPES: { value: ActivityType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'SPRAY', label: 'Spray', icon: 'water' },
  { value: 'FERTILIZER', label: 'Fertilizer', icon: 'leaf' },
  { value: 'IRRIGATION', label: 'Irrigation', icon: 'rainy' },
  { value: 'MONITORING', label: 'Monitoring', icon: 'eye' },
  { value: 'HARVEST', label: 'Harvest', icon: 'basket' },
  { value: 'OTHER', label: 'Other', icon: 'ellipsis-horizontal' },
];

type RowStatus = 'DONE_ON_TIME' | 'DONE_LATE' | 'SKIPPED' | 'DELAYED' | 'TODAY' | 'UPCOMING';

const STATUS_META: Record<RowStatus, { label: string; color: string; bg: string; border: string; icon: keyof typeof Ionicons.glyphMap }> = {
  DONE_ON_TIME: { label: 'Done', color: '#15803d', bg: '#dcfce7', border: '#86efac', icon: 'checkmark-circle' },
  DONE_LATE: { label: 'Delay', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd', icon: 'time' },
  SKIPPED: { label: 'Skipped', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: 'close-circle' },
  DELAYED: { label: 'Delayed', color: '#c2410c', bg: '#ffedd5', border: '#fdba74', icon: 'alert-circle' },
  TODAY: { label: 'Today', color: '#7c3aed', bg: '#ede9fe', border: '#c4b5fd', icon: 'today' },
  UPCOMING: { label: 'Upcoming', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: 'ellipse-outline' },
};

function classify(task: CropActivitySchedule): RowStatus {
  const scheduled = new Date(task.scheduledDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  scheduled.setHours(0, 0, 0, 0);

  if (task.status === 'SKIPPED') return 'SKIPPED';
  if (task.status === 'COMPLETED') {
    const completed = task.completedAt ? new Date(task.completedAt) : null;
    if (completed) completed.setHours(0, 0, 0, 0);
    return completed && completed > scheduled ? 'DONE_LATE' : 'DONE_ON_TIME';
  }
  // PENDING / OVERDUE
  if (scheduled < today) return 'DELAYED';
  if (scheduled.getTime() === today.getTime()) return 'TODAY';
  return 'UPCOMING';
}

interface AdvisorScheduleTimelineProps {
  cropCycleId: string;
  cropName?: string;
  farmerName?: string;
  sowingDate?: string | null;
}

/** "Full Plot Timeline & Activity Audit" — real CropActivitySchedule rows, color-coded, plus a quick add-task form. */
export function AdvisorScheduleTimeline({ cropCycleId, cropName, farmerName }: AdvisorScheduleTimelineProps) {
  const { data: tasks, isLoading } = useSchedulesForCropCycle(cropCycleId);
  const bulkCreate = useBulkCreateSchedules();
  const { data: itemTemplatesForSearch } = useMySprayItemTemplates();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuickAddDoseOpen, setIsQuickAddDoseOpen] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('SPRAY');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const query = title.trim().toLowerCase();
  const doseSuggestions = query
    ? (itemTemplatesForSearch ?? []).filter((t) => t.item.toLowerCase().includes(query) || (t.dose && t.dose.toLowerCase().includes(query))).slice(0, 5)
    : [];

  const resetForm = () => {
    setActivityType('SPRAY');
    setTitle('');
    setDescription('');
    setScheduledDate(new Date().toISOString().slice(0, 10));
    setError(null);
  };

  const handleAddTask = async () => {
    if (!title.trim()) {
      setError('Enter a Task / Activity title.');
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(scheduledDate)) {
      setError('Enter the date as YYYY-MM-DD.');
      return;
    }
    try {
      await bulkCreate.mutateAsync({
        cropCycleId,
        items: [{ activityType, title: title.trim(), description: description.trim() || undefined, scheduledDate }],
      });
      resetForm();
      setIsAddOpen(false);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not add the task.');
    }
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Ionicons name="search" size={14} color={theme.primary} />
          <Text style={styles.headerTitle}>Full Plot Timeline & Activity Audit</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          <TouchableOpacity
            style={styles.addBtn}
            activeOpacity={0.85}
            onPress={() => {
              tap();
              setIsAddOpen(true);
            }}
          >
            <Ionicons name="add-circle" size={15} color="#ffffff" />
            <Text style={styles.addBtnText}>Add Task</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={theme.primary} style={{ marginVertical: 16 }} />
      ) : !tasks || tasks.length === 0 ? (
        <Text style={styles.emptyText}>No schedule tasks yet for this plot. Tap "Add Task" to create the first one.</Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.tableHeaderCell, styles.dateCol]}>Date</Text>
            <Text style={[styles.tableHeaderCell, styles.taskCol]}>Task / Activity</Text>
            <Text style={[styles.tableHeaderCell, styles.remarksCol]}>Remarks</Text>
          </View>
          {[...tasks]
            .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
            .map((task) => {
              const status = classify(task);
              const meta = STATUS_META[status];
              return (
                <View key={task.id} style={[styles.tableRow, { backgroundColor: meta.bg }]}>
                  <View style={styles.dateCol}>
                    <Text style={styles.dateText}>
                      {new Date(task.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </Text>
                  </View>
                  <View style={styles.taskCol}>
                    <Text style={styles.taskTitle}>{task.title}</Text>
                    {task.status === 'COMPLETED' && task.completedAt ? (
                      <Text style={styles.metaText}>
                        Completed {new Date(task.completedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.remarksCol, styles.remarksBadge, { borderColor: meta.border }]}>
                    <Ionicons name={meta.icon} size={12} color={meta.color} />
                    <Text style={[styles.remarksText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                </View>
              );
            })}
        </View>
      )}

      {/* Add Task Modal */}
      <Modal visible={isAddOpen} transparent animationType="slide" onRequestClose={() => setIsAddOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add Schedule Task</Text>
                <Text style={styles.modalSub}>
                  {cropName ? `🌾 ${cropName}` : ''} {farmerName ? `· 👨‍🌾 ${farmerName}` : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddOpen(false)}>
                <Ionicons name="close-circle" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 6 }}>
              <Text style={styles.label}>Activity Type</Text>
              <View style={styles.chipRow}>
                {ACTIVITY_TYPES.map((t) => {
                  const isSelected = t.value === activityType;
                  return (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.chip, isSelected && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      onPress={() => setActivityType(t.value)}
                    >
                      <Ionicons name={t.icon} size={13} color={isSelected ? '#ffffff' : theme.primary} />
                      <Text style={[styles.chipText, isSelected && { color: '#ffffff' }]}>{t.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.labelHeaderRow}>
                <Text style={styles.label}>Task / Activity</Text>
                <TouchableOpacity
                  style={styles.quickAddDoseBtn}
                  activeOpacity={0.8}
                  onPress={() => setIsQuickAddDoseOpen(true)}
                >
                  <Ionicons name="add-circle" size={13} color={theme.primary} />
                  <Text style={styles.quickAddDoseBtnText}>+ Add New Dose Item</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="e.g. Imidacloprid Foliar Spray or Dose Item"
                placeholderTextColor="#94a3b8"
                value={title}
                onChangeText={setTitle}
              />

              {doseSuggestions.length > 0 ? (
                <View style={styles.itemSuggestBox}>
                  {doseSuggestions.map((s) => (
                    <TouchableOpacity
                      key={s.id}
                      style={styles.itemSuggestRow}
                      onPress={() => {
                        tap();
                        const composed = s.dose ? `${s.item} (${s.dose})` : s.item;
                        setTitle(composed);
                      }}
                    >
                      <Ionicons name="flask-outline" size={14} color={theme.primary} />
                      <Text style={styles.itemSuggestText}>
                        {s.item}
                        {s.dose ? <Text style={styles.itemSuggestDose}> · {s.dose}</Text> : null}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              <Text style={styles.label}>Description (optional)</Text>
              <TextInput
                style={[styles.input, { minHeight: 60, textAlignVertical: 'top' }]}
                placeholder="Dosage, method, notes..."
                placeholderTextColor="#94a3b8"
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={styles.label}>Scheduled Date</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#94a3b8"
                value={scheduledDate}
                onChangeText={setScheduledDate}
              />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.submitBtn, premiumShadow(theme.primary, 'md')]}
                activeOpacity={0.85}
                disabled={bulkCreate.isPending}
                onPress={handleAddTask}
              >
                {bulkCreate.isPending ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Task</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Quick Add Dose Item Modal */}
      <QuickAddDoseItemModal
        visible={isQuickAddDoseOpen}
        onClose={() => setIsQuickAddDoseOpen(false)}
        themeColor={theme.primary}
        onCreated={(newItem) => {
          const composed = newItem.dose ? `${newItem.item} (${newItem.dose})` : newItem.item;
          setTitle(composed);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { fontSize: 12.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  addBtnText: { fontSize: 11, fontFamily: FONT.bold, color: '#ffffff' },
  emptyText: { fontSize: 12, fontFamily: FONT.medium, color: '#94a3b8', paddingVertical: 10 },
  table: { borderRadius: RADIUS.md, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 7,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  tableHeaderCell: { fontSize: 9.5, fontFamily: FONT.bold, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.3 },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#ffffff',
    gap: 4,
  },
  dateCol: { width: 56 },
  taskCol: { flex: 1, paddingRight: 6 },
  remarksCol: { width: 74 },
  dateText: { fontSize: 11, fontFamily: FONT.bold, color: '#0f172a' },
  taskTitle: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#0f172a' },
  metaText: { fontSize: 9, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  remarksBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    backgroundColor: '#ffffff',
  },
  remarksText: { fontSize: 9.5, fontFamily: FONT.bold },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  modalTitle: { fontSize: 15.5, fontFamily: FONT.extraBold, color: '#0f172a' },
  modalSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  labelHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155' },
  quickAddDoseBtn: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  quickAddDoseBtnText: { fontSize: 11, fontFamily: FONT.bold, color: theme.primary },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#f8fafc',
  },
  chipText: { fontSize: 11, fontFamily: FONT.semiBold, color: '#334155' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    backgroundColor: '#f8fafc',
    color: '#0f172a',
  },
  itemSuggestBox: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.md,
    backgroundColor: '#ffffff',
    marginTop: -4,
    maxHeight: 150,
    overflow: 'hidden',
    ...premiumShadow('#000000', 'sm'),
  },
  itemSuggestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemSuggestText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  itemSuggestDose: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#15803d',
  },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
});

