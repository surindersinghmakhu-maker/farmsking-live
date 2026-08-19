import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useSprayScheduleForCrop } from '@/src/hooks/useSpraySchedules';
import { SprayScheduleItem } from '@/src/types/api';

/** Which of the 3 outcome colors a completed/skipped spray item earns, based on how close its last
 * update landed to the originally scheduled date (±2 days = on-time, later = late, SKIPPED = red). */
export function pastSprayOutcome(item: SprayScheduleItem): { color: string; bg: string; border: string; label: string } {
  if (item.status === 'SKIPPED') {
    return { color: '#dc2626', bg: '#fef2f2', border: '#fecaca', label: 'Skipped' };
  }
  const scheduled = new Date(item.scheduledDate);
  scheduled.setHours(0, 0, 0, 0);
  const updated = new Date(item.updatedAt);
  updated.setHours(0, 0, 0, 0);
  const diffDays = Math.round((updated.getTime() - scheduled.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 2) {
    return { color: '#1d4ed8', bg: '#eff6ff', border: '#bfdbfe', label: 'Late' };
  }
  return { color: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0', label: 'On Time' };
}

/** Two-card spray-schedule summary for one crop cycle: a "Previous Schedule" card (last completed/skipped
 * item, color-coded by how on-time it was) and a highlighted "Upcoming Schedule" card (next pending item).
 * The upcoming card itself is inert; a separate "Detail" button opens the full item detail (dosage,
 * alternatives...) via `onViewDetail`. Tapping/hovering the product name reveals its alt-text inline.
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
  const items = useMemo(
    () => [...(itemsRaw ?? [])].sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime()),
    [itemsRaw],
  );
  const [isAltRevealed, setIsAltRevealed] = useState(false);

  if (items.length === 0) {
    return (
      <View style={[styles.linkBtn, { borderColor: accentColor, backgroundColor: accentColor + '14', justifyContent: 'center' }]}>
        <Ionicons name="flask-outline" size={14} color={accentColor} />
        <Text style={[styles.linkText, { color: accentColor }]}>No schedule available</Text>
      </View>
    );
  }

  const upcomingIdx = items.findIndex((i) => i.status === 'PENDING' || i.status === 'OVERDUE');
  const upcoming = upcomingIdx === -1 ? null : items[upcomingIdx];
  const pastItems = upcomingIdx === -1 ? items : items.slice(0, upcomingIdx);
  const previous = pastItems.length > 0 ? pastItems[pastItems.length - 1] : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDiffDays = upcoming
    ? Math.round((new Date(new Date(upcoming.scheduledDate).setHours(0, 0, 0, 0)).getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const upcomingDateLabel = upcoming
    ? new Date(upcoming.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : '';
  const upcomingPendingLabel =
    upcoming?.status === 'OVERDUE'
      ? `${Math.abs(upcomingDiffDays)} din overdue`
      : upcomingDiffDays === 0
        ? 'Aaj'
        : upcomingDiffDays < 0
          ? `${Math.abs(upcomingDiffDays)} din overdue`
          : `${upcomingDiffDays} din baaki`;

  const previousOutcome = previous ? pastSprayOutcome(previous) : null;
  const previousDateLabel = previous ? new Date(previous.scheduledDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '';

  const hasAlt = !!(upcoming?.alternativeOption || upcoming?.alternativeOption2);
  const altText = upcoming ? [upcoming.alternativeOption, upcoming.alternativeOption2].filter(Boolean).join(', ') : '';
  const webHoverProps =
    Platform.OS === 'web'
      ? { onMouseEnter: () => setIsAltRevealed(true), onMouseLeave: () => setIsAltRevealed(false) }
      : {};

  return (
    <View style={styles.dualCardRow}>
      {upcoming ? (
        <View
          style={[styles.sprayCard, styles.sprayCardHighlighted, { backgroundColor: accentColor, borderColor: accentColor, ...premiumShadow(accentColor, 'sm') }]}
        >
          <View style={styles.sprayCardHeaderRow}>
            <Text style={[styles.sprayCardEyebrow, { color: '#ffffff' }]}>Upcoming Schedule</Text>
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.sprayCardProduct, { color: '#ffffff' }]} numberOfLines={1}>
                {upcoming.recommendedProduct || 'Spray Item'}
              </Text>
              {hasAlt ? <Ionicons name="information-circle-outline" size={13} color="rgba(255,255,255,0.85)" /> : null}
            </View>
            <Text style={[styles.sprayCardMeta, { color: 'rgba(255,255,255,0.85)' }]}>
              📅 {upcomingDateLabel} · {upcomingPendingLabel}
            </Text>
            {hasAlt && isAltRevealed ? (
              <Text style={[styles.sprayCardAlt, { color: 'rgba(255,255,255,0.9)' }]} numberOfLines={2}>
                Alt: {altText}
              </Text>
            ) : null}
          </TouchableOpacity>
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
  sprayCardMeta: { fontSize: 10.5, fontFamily: FONT.semiBold, marginTop: 2 },
  sprayCardAlt: { fontSize: 9.5, fontFamily: FONT.medium, marginTop: 2 },
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
