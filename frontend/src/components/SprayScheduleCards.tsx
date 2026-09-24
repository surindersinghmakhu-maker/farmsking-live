import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useSprayScheduleForCrop, useUpdateSprayScheduleItem } from '@/src/hooks/useSpraySchedules';
import { SprayScheduleItem } from '@/src/types/api';

/** Which of the 3 outcome colors a completed/skipped spray item earns, based on how close its last
 * update landed to the originally scheduled date (>3 days late = delayed blue, SKIPPED = red, <=3 days = green). */
export function pastSprayOutcome(item: SprayScheduleItem): { color: string; bg: string; border: string; label: string } {
  if (item.status === 'SKIPPED') {
    return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Skipped' };
  }
  const scheduled = new Date(item.scheduledDate);
  scheduled.setHours(0, 0, 0, 0);
  const updated = new Date(item.updatedAt);
  updated.setHours(0, 0, 0, 0);
  const diffDays = Math.round((updated.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 3) {
    return { color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe', label: 'Delayed' };
  }
  return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'Completed' };
}

/** Two-card spray-schedule summary for one crop cycle: a "Previous Schedule" card (last completed/skipped
 * item, color-coded by how on-time it was) and a highlighted "Upcoming Schedule" card (next pending item).
 * Includes Mark as Done & Skip action buttons for items due Today or up to 5 days late.
 * Automatically marks items as SKIPPED on the 6th day (after 5 days late).
 * Shared between the farmer's "My Advisor" view and the advisor's "Farmers" roster. */
export function SprayScheduleCards({
  cropCycleId,
  accentColor,
  onViewDetail,
}: {
  cropCycleId: string;
  accentColor: string;
  onViewDetail: (item: SprayScheduleItem) => void;
}) {
  const { data: itemsRaw } = useSprayScheduleForCrop(cropCycleId);
  const updateItemMutation = useUpdateSprayScheduleItem();

  const items = useMemo(
    () => [...(itemsRaw ?? [])].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    [itemsRaw],
  );
  const [isAltRevealed, setIsAltRevealed] = useState(false);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Process items: Auto-skip any pending item that is > 5 days late (6th day or later)
  const processedItems = useMemo(() => {
    return items.map((item) => {
      if (item.status === 'PENDING' || item.status === 'OVERDUE') {
        const scheduled = new Date(item.scheduledDate);
        scheduled.setHours(0, 0, 0, 0);
        const daysLate = Math.round((today.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
        if (daysLate >= 6) {
          return { ...item, status: 'SKIPPED' as const };
        }
      }
      return item;
    });
  }, [items, today]);

  // Persist auto-skipped items (>= 6 days late) to backend DB
  useEffect(() => {
    if (!itemsRaw) return;
    const todayMs = new Date().setHours(0, 0, 0, 0);
    itemsRaw.forEach((item) => {
      if (item.status === 'PENDING' || item.status === 'OVERDUE') {
        const schedMs = new Date(item.scheduledDate).setHours(0, 0, 0, 0);
        const daysLate = Math.round((todayMs - schedMs) / (1000 * 60 * 60 * 24));
        if (daysLate >= 6) {
          updateItemMutation.mutate({
            id: item.id,
            payload: { status: 'SKIPPED' },
          });
        }
      }
    });
  }, [itemsRaw]);

  if (items.length === 0) {
    return (
      <View style={[styles.linkBtn, { borderColor: accentColor, backgroundColor: accentColor + '14', justifyContent: 'center' }]}>
        <Ionicons name="flask-outline" size={14} color={accentColor} />
        <Text style={[styles.linkText, { color: accentColor }]}>No schedule available</Text>
      </View>
    );
  }

  const upcomingIdx = processedItems.findIndex((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
  const upcoming = upcomingIdx === -1 ? null : processedItems[upcomingIdx];
  const pastItems = upcomingIdx === -1 ? processedItems : processedItems.slice(0, upcomingIdx);
  const previous = pastItems.length > 0 ? pastItems[pastItems.length - 1] : null;

  const upcomingDaysLate = upcoming
    ? Math.round((today.getTime() - new Date(new Date(upcoming.scheduledDate).setHours(0, 0, 0, 0)).getTime()) / (1000 * 60 * 60 * 24))
    : -1;

  const upcomingDiffDays = upcoming
    ? Math.round((new Date(new Date(upcoming.scheduledDate).setHours(0, 0, 0, 0)).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const upcomingDateLabel = upcoming
    ? new Date(upcoming.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const upcomingPendingLabel =
    upcoming?.status === 'OVERDUE' || upcomingDaysLate > 0
      ? `${upcomingDaysLate} Days Overdue`
      : upcomingDiffDays === 0
        ? 'Today'
        : `${upcomingDiffDays} Days Left`;

  const previousOutcome = previous ? pastSprayOutcome(previous) : null;
  const previousDateLabel = previous ? new Date(previous.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

  const hasAlt = !!(upcoming?.alternativeOption || upcoming?.alternativeOption2);
  const altText = upcoming ? [upcoming.alternativeOption, upcoming.alternativeOption2].filter(Boolean).join(', ') : '';
  const webHoverProps =
    Platform.OS === 'web'
      ? { onMouseEnter: () => setIsAltRevealed(true), onMouseLeave: () => setIsAltRevealed(false) }
      : {};

  const handleMarkDone = async (item: SprayScheduleItem, daysLate: number) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: { status: 'COMPLETED' },
      });
      const note = daysLate > 3 ? '✔️ Marked as Done! (Status: Delayed)' : '✔️ Marked as Done!';
      if (Platform.OS === 'web') alert(note);
      else Alert.alert('Status Updated', note);
    } catch {
      if (Platform.OS === 'web') alert('Could not update status. Please try again.');
      else Alert.alert('Error', 'Could not update status. Please try again.');
    }
  };

  const handleSkip = async (item: SprayScheduleItem) => {
    try {
      await updateItemMutation.mutateAsync({
        id: item.id,
        payload: { status: 'SKIPPED' },
      });
      if (Platform.OS === 'web') alert('✕ Marked as Skipped!');
      else Alert.alert('Status Updated', '✕ Marked as Skipped!');
    } catch {
      if (Platform.OS === 'web') alert('Could not update status. Please try again.');
      else Alert.alert('Error', 'Could not update status. Please try again.');
    }
  };

  return (
    <View style={styles.dualCardRow}>
      {upcoming ? (
        <View
          style={[styles.sprayCard, styles.sprayCardHighlighted, { backgroundColor: accentColor, borderColor: accentColor, ...premiumShadow(accentColor, 'sm') }]}
        >
          <View style={styles.sprayCardHeaderRow}>
            <TouchableOpacity
              style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, paddingRight: 6 }}
              activeOpacity={hasAlt ? 0.7 : 1}
              disabled={!hasAlt}
              onPress={() => setIsAltRevealed((v) => !v)}
              {...webHoverProps}
            >
              <Text style={[styles.sprayCardEyebrow, { color: '#ffffff' }]}>Upcoming Schedule:</Text>
              <Text style={[styles.sprayCardProductInline, { color: '#ffffff' }]} numberOfLines={1}>
                {upcoming.recommendedProduct || 'Spray Item'}
              </Text>
              {hasAlt ? <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.9)" /> : null}
            </TouchableOpacity>

            <TouchableOpacity style={styles.detailBtn} activeOpacity={0.8} onPress={() => onViewDetail(upcoming)}>
              <Text style={styles.detailBtnText}>Detail</Text>
              <Ionicons name="chevron-forward" size={12} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={hasAlt ? 0.7 : 1}
            disabled={!hasAlt}
            onPress={() => setIsAltRevealed((v) => !v)}
            {...webHoverProps}
          >
            <View style={styles.highlightBadge}>
              <View style={styles.dateContrastBox}>
                <Ionicons name="calendar" size={12} color="#ca8a04" />
                <Text style={styles.dateContrastText}>{upcomingDateLabel}</Text>
              </View>
              <View style={styles.pendingContrastBox}>
                <Ionicons name="time-outline" size={12} color="#ffffff" />
                <Text style={styles.pendingContrastText}>{upcomingPendingLabel}</Text>
              </View>
            </View>
            {upcoming.dosageInstructions ? (
              <View style={styles.doseRow}>
                <Ionicons name="flask-outline" size={12} color="#ffffff" />
                <Text style={styles.doseText} numberOfLines={1}>
                  Dose: {upcoming.dosageInstructions}
                </Text>
              </View>
            ) : null}
            {hasAlt && isAltRevealed ? (
              <Text style={[styles.sprayCardAlt, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>
                Alt: {altText}
              </Text>
            ) : null}
          </TouchableOpacity>

          {/* Action Row: Shown when due Today or up to 5 days late (0 <= upcomingDaysLate <= 5) */}
          {upcomingDaysLate >= 0 && upcomingDaysLate <= 5 ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.25)' }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  backgroundColor: '#ffffff',
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: RADIUS.pill,
                }}
                activeOpacity={0.8}
                disabled={updateItemMutation.isPending}
                onPress={() => handleMarkDone(upcoming, upcomingDaysLate)}
              >
                <Ionicons name="checkmark-circle" size={15} color={upcomingDaysLate > 3 ? '#2563eb' : '#16a34a'} />
                <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: upcomingDaysLate > 3 ? '#2563eb' : '#16a34a' }}>
                  {upcomingDaysLate > 3 ? '✓ Mark Done (Delayed)' : '✓ Mark as Done'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 0.8,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  backgroundColor: 'rgba(239, 68, 68, 0.95)',
                  paddingVertical: 6,
                  paddingHorizontal: 10,
                  borderRadius: RADIUS.pill,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.4)',
                }}
                activeOpacity={0.8}
                disabled={updateItemMutation.isPending}
                onPress={() => handleSkip(upcoming)}
              >
                <Ionicons name="close-circle" size={15} color="#ffffff" />
                <Text style={{ fontSize: 11.5, fontFamily: FONT.extraBold, color: '#ffffff' }}>
                  ✕ Skip
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={[styles.sprayCard, { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}>
          <Text style={[styles.sprayCardEyebrow, { color: '#94a3b8' }]}>Upcoming Schedule</Text>
          <Text style={[styles.sprayCardMeta, { color: '#94a3b8', marginTop: 6 }]}>Nothing scheduled</Text>
        </View>
      )}

      {previous && previousOutcome ? (
        <View style={[styles.sprayCard, { backgroundColor: previousOutcome.bg, borderColor: previousOutcome.border }]}>
          <View style={styles.sprayCardHeaderRow}>
            <Text style={[styles.sprayCardEyebrow, { color: previousOutcome.color }]}>Previous Schedule</Text>
            <View style={[styles.outcomeDot, { backgroundColor: previousOutcome.color }]} />
          </View>
          <Text style={[styles.sprayCardProduct, { color: previousOutcome.color }]} numberOfLines={1}>
            {previous.recommendedProduct || 'Spray Item'}
          </Text>
          <Text style={[styles.sprayCardMeta, { color: previousOutcome.color }]}>
            📅 {previousDateLabel} · {previousOutcome.label}
          </Text>
        </View>
      ) : (
        <View style={styles.sprayCardCollapsed}>
          <Text style={styles.sprayCardCollapsedText}>Previous Schedule · No history yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 8,
  },
  linkText: { fontSize: 11.5, fontFamily: FONT.bold },
  dualCardRow: { flexDirection: 'column', gap: 8, marginTop: 8 },
  sprayCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    padding: 10,
    minHeight: 68,
  },
  sprayCardHighlighted: {},
  sprayCardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sprayCardEyebrow: { fontSize: 9.5, fontFamily: FONT.extraBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  detailBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  detailBtnText: { fontSize: 10, fontFamily: FONT.bold, color: '#ffffff' },
  outcomeDot: { width: 7, height: 7, borderRadius: 3.5 },
  sprayCardProduct: { fontSize: 12.5, fontFamily: FONT.bold, marginTop: 5 },
  sprayCardProductInline: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    flexShrink: 1,
  },
  sprayCardMeta: { fontSize: 10.5, fontFamily: FONT.semiBold, marginTop: 2 },
  sprayCardAlt: { fontSize: 9.5, fontFamily: FONT.medium, marginTop: 2 },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginTop: 6,
  },
  dateContrastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef9c3',
    borderWidth: 1,
    borderColor: '#fef08a',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  dateContrastText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#854d0e',
  },
  pendingContrastBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingContrastText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  doseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  doseText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: 'rgba(255, 255, 255, 0.95)',
    flexShrink: 1,
  },
  sprayCardCollapsed: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  sprayCardCollapsedText: { fontSize: 10, fontFamily: FONT.semiBold, color: '#94a3b8' },
});
