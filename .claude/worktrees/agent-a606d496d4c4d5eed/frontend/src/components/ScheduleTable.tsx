import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { parseScheduleText, ScheduleTaskStatus } from '@/src/utils/parseSchedule';

interface ScheduleTableProps {
  scheduleText?: string;
  sowingDate?: string;
}

const STATUS_META: Record<
  ScheduleTaskStatus,
  { label: string; color: string; bg: string; border: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  DONE_ON_TIME: { label: 'Done', color: '#15803d', bg: '#dcfce7', border: '#86efac', icon: 'checkmark-circle' },
  DONE_LATE: { label: 'Delay', color: '#1d4ed8', bg: '#dbeafe', border: '#93c5fd', icon: 'time' },
  SKIPPED: { label: 'Skipped', color: '#dc2626', bg: '#fee2e2', border: '#fca5a5', icon: 'close-circle' },
  PENDING: { label: 'Pending', color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0', icon: 'ellipse-outline' },
};

export function ScheduleTable({ scheduleText, sowingDate }: ScheduleTableProps) {
  const tasks = parseScheduleText(scheduleText, sowingDate);

  if (tasks.length === 0) {
    return <Text style={styles.emptyText}>{scheduleText || 'No schedule assigned yet.'}</Text>;
  }

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.headerCell, styles.dayCol]}>Day / Date</Text>
        <Text style={[styles.headerCell, styles.taskCol]}>Task</Text>
        <Text style={[styles.headerCell, styles.remarksCol]}>Remarks</Text>
      </View>

      {tasks.map((task) => {
        const meta = STATUS_META[task.status];
        return (
          <View key={task.id} style={[styles.row, { backgroundColor: meta.bg }]}>
            <View style={styles.dayCol}>
              <Text style={styles.dayNumber}>Day {task.dayNumber}</Text>
              <Text style={styles.dayDate}>{task.dueDateStr}</Text>
            </View>

            <View style={styles.taskCol}>
              <Text style={styles.taskTitle}>{task.taskTitle}</Text>
              {task.status === 'DONE_LATE' && task.completedDate ? (
                <Text style={styles.metaText}>Completed on {task.completedDate}</Text>
              ) : null}
              {task.status === 'SKIPPED' && task.skipReason ? (
                <Text style={styles.metaText}>Reason: {task.skipReason}</Text>
              ) : null}
            </View>

            <View style={[styles.remarksCol, styles.remarksBadge, { borderColor: meta.border }]}>
              <Ionicons name={meta.icon} size={13} color={meta.color} />
              <Text style={[styles.remarksText, { color: meta.color }]}>{meta.label}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyText: { fontSize: 12.5, fontFamily: FONT.medium, color: '#64748b' },
  table: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    paddingVertical: 8,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerCell: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: '#ffffff',
    gap: 4,
  },
  dayCol: { width: 78 },
  taskCol: { flex: 1, paddingRight: 6 },
  remarksCol: { width: 78 },
  dayNumber: { fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' },
  dayDate: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 1 },
  taskTitle: { fontSize: 12, fontFamily: FONT.semiBold, color: '#0f172a' },
  metaText: { fontSize: 9.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
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
  remarksText: { fontSize: 10, fontFamily: FONT.bold },
});
