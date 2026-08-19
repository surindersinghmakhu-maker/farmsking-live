import React, { useState } from 'react';
import { ActivityIndicator, Alert, View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '../../constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '../../constants/theme';
import { useRole } from '../store/role-context';
import { useAuth } from '../store/auth-context';
import { useBecomeFarmer, useBecomeGardener } from '../hooks/useBecomeRole';

const ROLE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  CUSTOMER: 'cart',
  FARMER: 'leaf',
  GARDENER: 'flower',
  FARM_ADVISOR: 'school',
  GARDEN_ADVISOR: 'flower-outline',
  BUSINESS_PARTNER: 'briefcase',
  ADMIN: 'shield-checkmark',
  SUPER_ADMIN: 'shield-half',
  OPERATOR: 'print',
};

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Shows the dashboard-switch list when this account already holds more than one granted role (e.g. a
 * Farmer who was also made a Business Partner). For a Customer-only account, instead offers self-service
 * "Become a Farmer" / "Become a Gardener" — granting that role immediately activates its dashboard too.
 */
type ExtraRow = { key: string; label: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void };

export function SwitchDashboardSection({ extraRows }: { extraRows?: ExtraRow[] } = {}) {
  const { role, setRole, assignedRoles } = useRole();
  const { user, updateUser } = useAuth();
  const becomeFarmer = useBecomeFarmer();
  const becomeGardener = useBecomeGardener();
  const [pending, setPending] = useState<'FARMER' | 'GARDENER' | null>(null);

  const isCustomerOnly = user?.role === 'CUSTOMER' && assignedRoles.length <= 1;

  const grantRole = async (target: 'FARMER' | 'GARDENER') => {
    tap();
    setPending(target);
    try {
      const updated = target === 'FARMER' ? await becomeFarmer.mutateAsync() : await becomeGardener.mutateAsync();
      await updateUser(updated);
      setRole(target);
    } catch (err: any) {
      const message = err?.response?.data?.message ?? `Could not activate the ${target === 'FARMER' ? 'Farmer' : 'Gardener'} dashboard.`;
      if (Platform.OS === 'web') {
        alert(message);
      } else {
        Alert.alert('Could not switch', message);
      }
    } finally {
      setPending(null);
    }
  };

  if (isCustomerOnly) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grow With FarmsKing</Text>
        <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
          <TouchableOpacity
            style={[styles.row, styles.rowDivider]}
            activeOpacity={0.7}
            disabled={pending !== null}
            onPress={() => grantRole('FARMER')}
          >
            <View style={[styles.iconBg, { backgroundColor: RoleThemes.FARMER.primaryLight }]}>
              <Ionicons name="leaf" size={17} color={RoleThemes.FARMER.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Become a Farmer</Text>
              <Text style={styles.rowSub}>Track your farm, crops, and accounts</Text>
            </View>
            {pending === 'FARMER' ? <ActivityIndicator color={RoleThemes.FARMER.primary} size="small" /> : <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            disabled={pending !== null}
            onPress={() => grantRole('GARDENER')}
          >
            <View style={[styles.iconBg, { backgroundColor: RoleThemes.GARDENER.primaryLight }]}>
              <Ionicons name="flower" size={17} color={RoleThemes.GARDENER.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Become a Gardener</Text>
              <Text style={styles.rowSub}>Manage your home garden and plants</Text>
            </View>
            {pending === 'GARDENER' ? <ActivityIndicator color={RoleThemes.GARDENER.primary} size="small" /> : <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (assignedRoles.length <= 1 && !extraRows?.length) return null;

  const roleLabels = assignedRoles.map((r) => RoleThemes[r].name).join(', ');
  const rowCount = assignedRoles.length + (extraRows?.length ?? 0);

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Switch Dashboard</Text>
      {user?.name && assignedRoles.length > 1 ? (
        <Text style={styles.userRolesText}>
          {user.name} <Text style={styles.userRolesBracket}>({roleLabels})</Text>
        </Text>
      ) : null}
      <View style={[styles.card, premiumShadow('#0f172a', 'sm')]}>
        {assignedRoles.length > 1
          ? assignedRoles.map((r, idx) => {
              const theme = RoleThemes[r];
              const isActive = r === role;
              return (
                <TouchableOpacity
                  key={r}
                  style={[styles.row, idx < rowCount - 1 && styles.rowDivider]}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (isActive) return;
                    tap();
                    setRole(r);
                  }}
                >
                  <View style={[styles.iconBg, { backgroundColor: theme.primaryLight }]}>
                    <Ionicons name={ROLE_ICONS[r]} size={17} color={theme.primary} />
                  </View>
                  <Text style={styles.rowLabel}>{theme.name}</Text>
                  {isActive ? (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                  )}
                </TouchableOpacity>
              );
            })
          : null}
        {(extraRows ?? []).map((item, idx) => {
          const activeTheme = RoleThemes[role];
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.row, assignedRoles.length + idx < rowCount - 1 && styles.rowDivider]}
              activeOpacity={0.7}
              onPress={() => {
                tap();
                item.onPress();
              }}
            >
              <View style={[styles.iconBg, { backgroundColor: activeTheme.primaryLight }]}>
                <Ionicons name={item.icon} size={17} color={activeTheme.primary} />
              </View>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: SPACING.lg },
  sectionTitle: { fontSize: 12.5, fontFamily: FONT.bold, color: '#64748b', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.3 },
  userRolesText: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a', marginTop: -4, marginBottom: 8 },
  userRolesBracket: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  card: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: SPACING.md },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  iconBg: { width: 34, height: 34, borderRadius: RADIUS.md, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontSize: 14, fontFamily: FONT.semiBold, color: '#0f172a' },
  rowSub: { fontSize: 11.5, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  activeBadge: { backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: RADIUS.pill },
  activeBadgeText: { fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a' },
});
