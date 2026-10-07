import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, SPACING } from '../constants/theme';

interface CalendarDatePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (formattedDate: string, season: string) => void;
  initialDate?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SHORT_MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function getAgriSeason(monthIndex: number): string {
  // Month 0 = Jan, 1 = Feb, ..., 11 = Dec
  if (monthIndex >= 5 && monthIndex <= 9) {
    return 'Kharif';
  } else if (monthIndex >= 10 || monthIndex <= 3) {
    return 'Rabi';
  } else {
    return 'Zaid';
  }
}

export function formatDateString(date: Date): string {
  const day = date.getDate();
  const monthStr = SHORT_MONTH_NAMES[date.getMonth()];
  const year = date.getFullYear();
  return `${day < 10 ? '0' + day : day} ${monthStr} ${year}`;
}

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

export function CalendarDatePickerModal({
  visible,
  onClose,
  onSelectDate,
  initialDate,
}: CalendarDatePickerModalProps) {
  const [currentViewDate, setCurrentViewDate] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (visible) {
      const now = new Date();
      setCurrentViewDate(now);
      setSelectedDate(now);
    }
  }, [visible]);

  const year = currentViewDate.getFullYear();
  const month = currentViewDate.getMonth();

  // First day of month & number of days
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    tap();
    setCurrentViewDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    tap();
    setCurrentViewDate(new Date(year, month + 1, 1));
  };

  const handleDaySelect = (dayNum: number) => {
    tap();
    const picked = new Date(year, month, dayNum);
    setSelectedDate(picked);
  };

  const handleConfirm = () => {
    tap();
    const formatted = formatDateString(selectedDate);
    const season = getAgriSeason(selectedDate.getMonth());
    onSelectDate(formatted, season);
    onClose();
  };

  const handleApplyPreset = (daysAgo: number) => {
    tap();
    const target = new Date();
    target.setDate(target.getDate() - daysAgo);
    setSelectedDate(target);
    setCurrentViewDate(new Date(target.getFullYear(), target.getMonth(), 1));
  };

  // Build grid days array
  const gridCells: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push(d);
  }

  const activeSeason = getAgriSeason(selectedDate.getMonth());

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="calendar-outline" size={22} color="#16a34a" />
              <Text style={styles.headerTitle}>Select Sowing Date</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Active Selection Banner */}
          <View style={styles.selectionBanner}>
            <View>
              <Text style={styles.bannerLabel}>Selected Sowing Date:</Text>
              <Text style={styles.bannerDateText}>{formatDateString(selectedDate)}</Text>
            </View>
            <View style={styles.seasonBadge}>
              <Ionicons name="leaf-outline" size={13} color="#15803d" />
              <Text style={styles.seasonBadgeText}>{activeSeason}</Text>
            </View>
          </View>

          {/* Quick Presets */}
          <Text style={styles.sectionLabel}>Quick Presets:</Text>
          <View style={styles.presetsRow}>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleApplyPreset(0)}>
              <Text style={styles.presetChipText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleApplyPreset(15)}>
              <Text style={styles.presetChipText}>15 Days Ago</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleApplyPreset(30)}>
              <Text style={styles.presetChipText}>1 Month Ago</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.presetChip} onPress={() => handleApplyPreset(60)}>
              <Text style={styles.presetChipText}>2 Months Ago</Text>
            </TouchableOpacity>
          </View>

          {/* Month / Year Navigator */}
          <View style={styles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
              <Ionicons name="chevron-back" size={20} color="#0f172a" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {MONTH_NAMES[month]} {year}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
              <Ionicons name="chevron-forward" size={20} color="#0f172a" />
            </TouchableOpacity>
          </View>

          {/* Weekday Headers */}
          <View style={styles.weekdayRow}>
            {WEEKDAYS.map((w) => (
              <Text key={w} style={styles.weekdayText}>
                {w}
              </Text>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.daysGrid}>
            {gridCells.map((day, idx) => {
              if (day === null) {
                return <View key={`empty-${idx}`} style={styles.dayCell} />;
              }

              const isSelected =
                selectedDate.getDate() === day &&
                selectedDate.getMonth() === month &&
                selectedDate.getFullYear() === year;

              const isToday =
                new Date().getDate() === day &&
                new Date().getMonth() === month &&
                new Date().getFullYear() === year;

              return (
                <TouchableOpacity
                  key={`day-${day}`}
                  style={[
                    styles.dayCell,
                    isSelected && styles.dayCellSelected,
                    isToday && !isSelected && styles.dayCellToday,
                  ]}
                  onPress={() => handleDaySelect(day)}
                >
                  <Text
                    style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && styles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
            <Text style={styles.confirmBtnText}>Set Sowing Date</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  selectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.md,
    padding: 10,
    marginBottom: 12,
  },
  bannerLabel: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  bannerDateText: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#16a34a',
    marginTop: 1,
  },
  seasonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#86efac',
  },
  seasonBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  sectionLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#475569',
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  presetChip: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
  },
  presetChipText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  weekdayRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 6,
  },
  weekdayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  dayCell: {
    width: '14.28%',
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 19,
  },
  dayCellSelected: {
    backgroundColor: '#16a34a',
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: '#16a34a',
  },
  dayText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontFamily: FONT.bold,
  },
  dayTextToday: {
    color: '#16a34a',
    fontFamily: FONT.bold,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingVertical: 13,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 14.5,
    fontFamily: FONT.bold,
  },
});
