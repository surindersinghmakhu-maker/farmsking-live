import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { useAuditLogs } from '@/src/hooks/useAudit';
import { AuditLogEntry } from '@/src/api/audit.api';

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const CATEGORIES = [
  { id: 'ALL', label: 'All Actions', prefix: '' },
  { id: 'ORDERS', label: 'Orders & Payments', prefix: 'order' },
  { id: 'PRODUCTS', label: 'Products & Store', prefix: 'product' },
  { id: 'USERS', label: 'Users & Auth', prefix: 'user' },
  { id: 'WALLETS', label: 'Wallets & Payouts', prefix: 'wallet' },
  { id: 'COUPONS', label: 'Coupons & Plans', prefix: 'coupon' },
  { id: 'SETTINGS', label: 'System Settings', prefix: 'setting' },
];

export default function SettingAuditLogsView() {
  const { isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(25);

  const activePrefix = useMemo(() => {
    const found = CATEGORIES.find((c) => c.id === selectedCategory);
    return found?.prefix || undefined;
  }, [selectedCategory]);

  const { data, isLoading, isFetching, refetch } = useAuditLogs({
    action: activePrefix,
    limit: 100,
  });

  const filteredItems = useMemo(() => {
    const list = data?.items || [];
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter((item) => {
      const matchAction = item.action?.toLowerCase().includes(q);
      const matchPath = item.path?.toLowerCase().includes(q);
      const matchActor = item.actor?.name?.toLowerCase().includes(q) || item.actor?.kingId?.toLowerCase().includes(q);
      const matchMethod = item.method?.toLowerCase().includes(q);
      return matchAction || matchPath || matchActor || matchMethod;
    });
  }, [data?.items, searchQuery]);

  return (
    <View style={styles.container}>
      {/* KPI Stats Banner */}
      <View
        style={[
          styles.kpiBanner,
          { backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.7)', borderColor: cardBorder },
        ]}
      >
        <View style={styles.kpiItem}>
          <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#ecfdf5' : 'rgba(16, 185, 129, 0.15)' }]}>
            <Ionicons name="server-outline" size={18} color="#16a34a" />
          </View>
          <View>
            <Text style={[styles.kpiValue, { color: textColor }]}>103 Tables</Text>
            <Text style={[styles.kpiLabel, { color: subTextColor }]}>100% Timestamped with Auto-Clock</Text>
          </View>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiItem}>
          <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#eff6ff' : 'rgba(59, 130, 246, 0.15)' }]}>
            <Ionicons name="time-outline" size={18} color="#2563eb" />
          </View>
          <View>
            <Text style={[styles.kpiValue, { color: textColor }]}>Every Mutation</Text>
            <Text style={[styles.kpiLabel, { color: subTextColor }]}>POST • PUT • PATCH • DELETE Logged</Text>
          </View>
        </View>

        <View style={styles.kpiDivider} />

        <View style={styles.kpiItem}>
          <View style={[styles.kpiIconBox, { backgroundColor: isLight ? '#fef3c7' : 'rgba(245, 158, 11, 0.15)' }]}>
            <Ionicons name="receipt-outline" size={18} color="#d97706" />
          </View>
          <View>
            <Text style={[styles.kpiValue, { color: textColor }]}>{data?.total ?? 0} Recorded</Text>
            <Text style={[styles.kpiLabel, { color: subTextColor }]}>Audit Ledger Entries</Text>
          </View>
        </View>
      </View>

      {/* Filter Chips Bar */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.8}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isActive
                    ? '#16a34a'
                    : isLight
                    ? '#ffffff'
                    : 'rgba(30, 41, 59, 0.6)',
                  borderColor: isActive ? '#16a34a' : cardBorder,
                },
              ]}
              onPress={() => {
                tap();
                setSelectedCategory(cat.id);
                setVisibleCount(25);
              }}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  { color: isActive ? '#ffffff' : textColor },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Search Input Bar */}
      <View
        style={[
          styles.searchBar,
          { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: cardBorder },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={subTextColor} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search by action, path, actor name or King ID..."
          placeholderTextColor={subTextColor}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color={subTextColor} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          onPress={() => refetch()}
          style={[styles.refreshSmallBtn, { backgroundColor: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)' }]}
        >
          <Ionicons name="refresh" size={14} color="#16a34a" />
          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#16a34a' }}>
            {isFetching ? 'Syncing...' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Audit Log Entries List */}
      {isLoading ? (
        <ActivityIndicator color="#16a34a" size="large" style={{ marginTop: 40 }} />
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="shield-checkmark-outline" size={40} color={subTextColor} />
          <Text style={[styles.emptyTitle, { color: textColor }]}>No Audit Logs Found</Text>
          <Text style={[styles.emptySub, { color: subTextColor }]}>
            No mutating database activity matched this filter category.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {filteredItems.slice(0, visibleCount).map((entry) => (
            <AuditLogRow
              key={entry.id}
              entry={entry}
              isExpanded={expandedId === entry.id}
              onToggle={() => {
                tap();
                setExpandedId((cur) => (cur === entry.id ? null : entry.id));
              }}
            />
          ))}

          {filteredItems.length > visibleCount ? (
            <TouchableOpacity
              style={[
                styles.showMoreBtn,
                { backgroundColor: isLight ? '#ffffff' : cardBg, borderColor: cardBorder },
              ]}
              onPress={() => {
                tap();
                setVisibleCount((c) => c + 25);
              }}
            >
              <Text style={{ color: '#16a34a', fontFamily: FONT.bold, fontSize: 13 }}>
                Load More Entries ({filteredItems.length - visibleCount} remaining)
              </Text>
              <Ionicons name="chevron-down" size={16} color="#16a34a" />
            </TouchableOpacity>
          ) : null}
        </View>
      )}
    </View>
  );
}

function AuditLogRow({
  entry,
  isExpanded,
  onToggle,
}: {
  entry: AuditLogEntry;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();

  const isSuccess = entry.statusCode >= 200 && entry.statusCode < 300;
  const isClientError = entry.statusCode >= 400 && entry.statusCode < 500;
  const statusColor = isSuccess ? '#16a34a' : isClientError ? '#d97706' : '#dc2626';

  const methodBg =
    entry.method === 'POST'
      ? '#2563eb'
      : entry.method === 'PUT' || entry.method === 'PATCH'
      ? '#d97706'
      : '#dc2626';

  const formattedDate = useMemo(() => {
    try {
      const d = new Date(entry.createdAt);
      return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
    } catch {
      return entry.createdAt;
    }
  }, [entry.createdAt]);

  return (
    <View
      style={[
        styles.rowCard,
        {
          backgroundColor: isLight ? '#ffffff' : cardBg,
          borderColor: cardBorder,
        },
        premiumShadow(isLight ? 'rgba(0,0,0,0.04)' : '#0f172a', 'xs'),
      ]}
    >
      <TouchableOpacity activeOpacity={0.85} onPress={onToggle} style={styles.rowMain}>
        {/* Method Pill & Status Code */}
        <View style={styles.badgeCol}>
          <View style={[styles.methodBadge, { backgroundColor: methodBg }]}>
            <Text style={styles.methodText}>{entry.method}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}18`, borderColor: statusColor }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{entry.statusCode}</Text>
          </View>
        </View>

        {/* Action & Path */}
        <View style={{ flex: 1, minWidth: 200 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={[styles.actionTitle, { color: textColor }]}>{entry.action}</Text>
            {entry.targetId ? (
              <View style={styles.targetBadge}>
                <Text style={styles.targetText}>ID: {entry.targetId.slice(0, 8)}...</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.pathText, { color: subTextColor }]} numberOfLines={1}>
            {entry.path}
          </Text>
        </View>

        {/* Actor Info & Date */}
        <View style={styles.metaCol}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="person-circle-outline" size={14} color="#16a34a" />
            <Text style={[styles.actorName, { color: textColor }]}>
              {entry.actor?.name || 'System / Guest'}
            </Text>
            {entry.actor?.role ? (
              <View style={styles.roleBadge}>
                <Text style={styles.roleBadgeText}>{entry.actor.role}</Text>
              </View>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
            <Ionicons name="time-outline" size={12} color={subTextColor} />
            <Text style={[styles.dateText, { color: subTextColor }]}>{formattedDate}</Text>
          </View>
        </View>

        <Ionicons
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={subTextColor}
          style={{ marginLeft: 6 }}
        />
      </TouchableOpacity>

      {/* Expanded JSON Payload Drawer */}
      {isExpanded ? (
        <View
          style={[
            styles.detailsDrawer,
            {
              backgroundColor: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
              borderTopColor: cardBorder,
            },
          ]}
        >
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: subTextColor }]}>Full Record ID:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{entry.id}</Text>
          </View>
          {entry.actor?.kingId ? (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: subTextColor }]}>Actor King ID:</Text>
              <Text style={[styles.detailValue, { color: textColor }]}>{entry.actor.kingId}</Text>
            </View>
          ) : null}
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: subTextColor }]}>Endpoint Path:</Text>
            <Text style={[styles.detailValue, { color: textColor }]}>{entry.path}</Text>
          </View>

          <Text style={[styles.detailLabel, { color: subTextColor, marginTop: 8, marginBottom: 4 }]}>
            Sanitized Request Payload (Modified Values):
          </Text>
          <View
            style={[
              styles.jsonBox,
              { backgroundColor: isLight ? '#0f172a' : '#020617', borderColor: cardBorder },
            ]}
          >
            <Text style={styles.jsonText}>
              {JSON.stringify(entry.metadata?.body ?? {}, null, 2)}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingBottom: 24,
  },
  kpiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 160,
  },
  kpiDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#cbd5e1',
    opacity: 0.5,
  },
  kpiIconBox: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
  },
  kpiLabel: {
    fontSize: 11,
    fontFamily: FONT.medium,
  },
  categoryScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    padding: 0,
  },
  refreshSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  list: {
    gap: 8,
  },
  rowCard: {
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    gap: 10,
    flexWrap: 'wrap',
  },
  badgeCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  methodBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  methodText: {
    fontSize: 10,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  actionTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  targetBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: RADIUS.xs,
  },
  targetText: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#475569',
  },
  pathText: {
    fontSize: 11,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  metaCol: {
    alignItems: 'flex-end',
  },
  actorName: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
  },
  roleBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  roleBadgeText: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  dateText: {
    fontSize: 10.5,
    fontFamily: FONT.regular,
  },
  detailsDrawer: {
    borderTopWidth: 1,
    padding: 12,
    gap: 4,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  detailValue: {
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
  },
  jsonBox: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    padding: 10,
    maxHeight: 200,
    overflow: 'scroll',
  },
  jsonText: {
    fontSize: 11,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'Courier',
    color: '#34d399',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: 4,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  emptySub: {
    fontSize: 12,
    fontFamily: FONT.regular,
    textAlign: 'center',
  },
});

