import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuditLogs } from '@/src/hooks/useAudit';
import { AuditLogEntry } from '@/src/api/audit.api';

const theme = RoleThemes.SUPER_ADMIN;

const STATUS_COLOR = (statusCode: number) => (statusCode >= 200 && statusCode < 300 ? '#16a34a' : statusCode >= 400 ? '#dc2626' : '#d97706');

export default function SuperAuditLogScreen() {
  const [actionFilter, setActionFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(20);
  const { data, isLoading, isFetching, refetch } = useAuditLogs({ action: actionFilter.trim() || undefined, limit: 100 });

  React.useEffect(() => {
    setVisibleCount(20);
  }, [actionFilter]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>Audit Log</Text>
        <Text style={styles.heroSubtitle}>Every mutating action on the platform, who did it, and when</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Filter by action (e.g. users, coupons, wallet)..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={actionFilter}
            onChangeText={setActionFilter}
          />
        </View>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={undefined}
      >
        <TouchableOpacity style={styles.refreshBtn} activeOpacity={0.8} onPress={() => refetch()}>
          <Ionicons name="refresh" size={14} color={theme.primary} />
          <Text style={styles.refreshBtnText}>{isFetching ? 'Refreshing...' : 'Refresh'}</Text>
        </TouchableOpacity>

        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
        ) : !data || data.items.length === 0 ? (
          <View style={styles.emptyCenter}>
            <Ionicons name="time-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No matching activity yet.</Text>
          </View>
        ) : (
          <>
            {data.items.slice(0, visibleCount).map((entry) => (
              <LogRow key={entry.id} entry={entry} isExpanded={expandedId === entry.id} onToggle={() => setExpandedId((cur) => (cur === entry.id ? null : entry.id))} />
            ))}
            {data.items.length > visibleCount ? (
              <TouchableOpacity style={styles.showMoreBtn} activeOpacity={0.8} onPress={() => setVisibleCount((c) => c + 20)}>
                <Text style={styles.showMoreBtnText}>Show More ({data.items.length - visibleCount} more)</Text>
                <Ionicons name="chevron-down" size={15} color={theme.primary} />
              </TouchableOpacity>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function LogRow({ entry, isExpanded, onToggle }: { entry: AuditLogEntry; isExpanded: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={[styles.logCard, premiumShadow('#0f172a', 'sm')]} activeOpacity={0.85} onPress={onToggle}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={[styles.methodBadge, { backgroundColor: STATUS_COLOR(entry.statusCode) + '20' }]}>
          <Text style={[styles.methodBadgeText, { color: STATUS_COLOR(entry.statusCode) }]}>{entry.method}</Text>
        </View>
        <Text style={styles.actionText} numberOfLines={1}>{entry.action}</Text>
        <Text style={[styles.statusText, { color: STATUS_COLOR(entry.statusCode) }]}>{entry.statusCode}</Text>
      </View>
      <Text style={styles.metaText}>
        {entry.actor ? `${entry.actor.name} (${entry.actor.role})` : 'Unauthenticated'} · {new Date(entry.createdAt).toLocaleString('en-IN')}
      </Text>
      {isExpanded ? (
        <View style={styles.expandedBox}>
          <Text style={styles.expandedPath}>{entry.path}</Text>
          {entry.metadata?.body ? (
            <Text style={styles.expandedBody}>{JSON.stringify(entry.metadata.body, null, 2)}</Text>
          ) : null}
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 18, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13.5, fontFamily: FONT.medium },
  list: { padding: SPACING.lg, gap: 8, paddingBottom: SPACING.xxl },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-end', marginBottom: 4 },
  refreshBtnText: { fontSize: 12, fontFamily: FONT.bold, color: theme.primary },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 40, gap: 8 },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  showMoreBtnText: { fontSize: 12.5, fontFamily: FONT.bold, color: theme.primary },
  emptyText: { color: '#64748b', fontSize: 13, fontFamily: FONT.medium },
  logCard: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.md, gap: 4 },
  methodBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.xs },
  methodBadgeText: { fontSize: 10.5, fontFamily: FONT.extraBold },
  actionText: { flex: 1, fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  statusText: { fontSize: 12, fontFamily: FONT.extraBold },
  metaText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  expandedBox: { marginTop: 6, backgroundColor: '#f8fafc', borderRadius: RADIUS.sm, padding: 8, gap: 4 },
  expandedPath: { fontSize: 11, fontFamily: FONT.bold, color: '#334155' },
  expandedBody: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b' },
});
