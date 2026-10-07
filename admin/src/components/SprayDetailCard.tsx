import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { SprayScheduleItem } from '@/src/types/api';
import { useSprayItemTemplatesForMyAdvisor } from '@/src/hooks/useSprayItemTemplates';

const STATUS_META: Record<SprayScheduleItem['status'], { label: string; color: string; bg: string }> = {
  PENDING: { label: 'Pending', color: '#0369a1', bg: '#f0f9ff' },
  OVERDUE: { label: 'Overdue', color: '#b45309', bg: '#fffbeb' },
  COMPLETED: { label: 'Completed', color: '#15803d', bg: '#f0fdf4' },
  SKIPPED: { label: 'Skipped', color: '#dc2626', bg: '#fef2f2' },
};

/** Professional, information-dense detail view for one spray schedule item — used by both the
 * farmer's "My Advisor" screen and the advisor's "Farms" roster. If the recommended product is
 * missing, the alternative(s) are promoted into the primary recommendation slot instead of being
 * shown as a disconnected footnote. */
export function SprayDetailCard({ item }: { item: SprayScheduleItem }) {
  const statusMeta = STATUS_META[item.status] ?? STATUS_META.PENDING;
  const hasPrimary = !!item.recommendedProduct;
  const alternatives = [item.alternativeOption, item.alternativeOption2].filter(Boolean) as string[];
  const scheduledLabel = new Date(item.scheduledDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  // recommendedProduct can name multiple Dose Items (e.g. "DAP (50 KG), npk 19-19-19 (5 gram)") —
  // resolve each against the advisor's Dose Items library to surface their own alternative1/alternative2.
  const { data: doseItems } = useSprayItemTemplatesForMyAdvisor(hasPrimary);
  const matchedItemAlts = useMemo(() => {
    if (!hasPrimary || !doseItems) return [];
    const names = item.recommendedProduct!.split(',').map((s) => s.trim().replace(/\s*\([^)]*\)\s*$/, '').toLowerCase()).filter(Boolean);
    return doseItems
      .filter((tpl) => names.includes(tpl.item.toLowerCase()) && (tpl.alternative1 || tpl.alternative2))
      .map((tpl) => ({ item: tpl.item, alts: [tpl.alternative1, tpl.alternative2].filter(Boolean).join(', ') }));
  }, [hasPrimary, doseItems, item.recommendedProduct]);

  return (
    <View style={{ gap: 12 }}>
      <View style={styles.metaRow}>
        <View style={[styles.statusChip, { backgroundColor: statusMeta.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
          <Text style={[styles.statusChipText, { color: statusMeta.color }]}>{statusMeta.label}</Text>
        </View>
        <View style={styles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color="#64748b" />
          <Text style={styles.metaItemText}>{scheduledLabel}</Text>
        </View>
        {item.sprayType ? (
          <View style={styles.metaItem}>
            <Ionicons name="flask-outline" size={13} color="#64748b" />
            <Text style={styles.metaItemText}>{item.sprayType}</Text>
          </View>
        ) : null}
      </View>

      {hasPrimary ? (
        <View style={styles.primaryCard}>
          <Text style={styles.primaryEyebrow}>Recommended Spray</Text>
          <Text style={styles.primaryProduct}>{item.recommendedProduct}</Text>
          {item.dosageInstructions ? (
            <View style={styles.dosageRow}>
              <Ionicons name="beaker-outline" size={13} color="#15803d" />
              <Text style={styles.dosageText}>{item.dosageInstructions}</Text>
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.missingCard}>
          <Ionicons name="alert-circle-outline" size={16} color="#b45309" />
          <Text style={styles.missingText}>No recommended spray on file for this date.</Text>
        </View>
      )}

      {matchedItemAlts.length > 0 ? (
        <View style={styles.itemAltCard}>
          <View style={styles.altHeaderRow}>
            <Ionicons name="swap-horizontal-outline" size={14} color="#7c3aed" />
            <Text style={[styles.altEyebrow, { color: '#7c3aed' }]}>Item Alternatives</Text>
          </View>
          {matchedItemAlts.map((row, idx) => (
            <View key={idx} style={styles.itemAltRow}>
              <Text style={styles.itemAltName}>{row.item}</Text>
              <Text style={styles.itemAltValue}>{row.alts}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {alternatives.length > 0 ? (
        <View style={[styles.altCard, !hasPrimary && styles.altCardPromoted]}>
          <View style={styles.altHeaderRow}>
            <Ionicons name="swap-horizontal-outline" size={14} color={hasPrimary ? '#1d4ed8' : '#15803d'} />
            <Text style={[styles.altEyebrow, { color: hasPrimary ? '#1d4ed8' : '#15803d' }]}>
              {hasPrimary ? 'If Unavailable, Use Instead' : 'Use This Instead'}
            </Text>
          </View>
          {alternatives.map((alt, idx) => (
            <View key={idx} style={styles.altItemRow}>
              <View style={[styles.altBullet, { backgroundColor: hasPrimary ? '#1d4ed8' : '#15803d' }]} />
              <Text style={styles.altItemText}>{alt}</Text>
            </View>
          ))}
        </View>
      ) : !hasPrimary ? (
        <View style={styles.missingCard}>
          <Ionicons name="close-circle-outline" size={16} color="#dc2626" />
          <Text style={[styles.missingText, { color: '#b91c1c' }]}>No alternative spray has been set either. Please contact your advisor.</Text>
        </View>
      ) : null}

      {item.notes ? (
        <View style={styles.notesCard}>
          <Text style={styles.notesEyebrow}>Advisor Notes</Text>
          <Text style={styles.notesText}>{item.notes}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  statusChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusChipText: { fontSize: 10.5, fontFamily: FONT.extraBold, textTransform: 'uppercase', letterSpacing: 0.3 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaItemText: { fontSize: 11.5, fontFamily: FONT.semiBold, color: '#64748b' },

  primaryCard: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 4,
  },
  primaryEyebrow: { fontSize: 10, fontFamily: FONT.extraBold, color: '#15803d', textTransform: 'uppercase', letterSpacing: 0.4 },
  primaryProduct: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  dosageRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  dosageText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#166534', flex: 1 },

  missingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  missingText: { flex: 1, fontSize: 12, fontFamily: FONT.semiBold, color: '#92400e' },

  itemAltCard: {
    backgroundColor: '#faf5ff',
    borderWidth: 1,
    borderColor: '#e9d5ff',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 6,
  },
  itemAltRow: { gap: 1 },
  itemAltName: { fontSize: 11.5, fontFamily: FONT.bold, color: '#0f172a' },
  itemAltValue: { fontSize: 11.5, fontFamily: FONT.medium, color: '#6b21a8' },
  altCard: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 8,
  },
  altCardPromoted: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
  altHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  altEyebrow: { fontSize: 10, fontFamily: FONT.extraBold, textTransform: 'uppercase', letterSpacing: 0.4 },
  altItemRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  altBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  altItemText: { flex: 1, fontSize: 12.5, fontFamily: FONT.semiBold, color: '#0f172a' },

  notesCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    gap: 3,
  },
  notesEyebrow: { fontSize: 10, fontFamily: FONT.extraBold, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4 },
  notesText: { fontSize: 12, fontFamily: FONT.medium, color: '#334155', lineHeight: 17 },
});
