import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { RoleThemes, UserRole } from '@/constants/Colors';
import { FONT, RADIUS, SPACING } from '@/constants/theme';
import { useRole } from '@/src/store/role-context';

const ROLE_ICONS: Record<UserRole, string> = {
  CUSTOMER: 'cart',
  FARMER: 'leaf',
  GARDENER: 'flower',
  FARM_ADVISOR: 'school',
  GARDEN_ADVISOR: 'flower-outline',
  BUSINESS_PARTNER: 'briefcase',
  ADMIN: 'shield-checkmark',
};

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

/**
 * Persistent dashboard switcher shown on Home — every role assigned to this
 * user gets a tab here, so switching dashboards never needs a separate modal.
 */
export const DashboardRoleTabs: React.FC = () => {
  const { role, setRole, assignedRoles } = useRole();

  if (assignedRoles.length <= 1) return null;

  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {assignedRoles.map((r) => {
          const theme = RoleThemes[r];
          const isActive = r === role;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.tab, isActive && { backgroundColor: theme.primary, borderColor: theme.primary }]}
              activeOpacity={0.8}
              onPress={() => {
                if (r === role) return;
                tap();
                setRole(r);
              }}
            >
              <Ionicons name={ROLE_ICONS[r] as any} size={14} color={isActive ? '#ffffff' : '#64748b'} />
              <Text style={[styles.tabText, isActive && { color: '#ffffff', fontFamily: FONT.bold }]}>
                {theme.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#0f172a',
    paddingTop: Platform.OS === 'web' ? 10 : 6,
    paddingBottom: 10,
  },
  row: { paddingHorizontal: SPACING.lg, gap: 8 },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  tabText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#cbd5e1' },
});
