import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Image, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  useAdminUpdateUser,
  useCreateAdmin,
  useCreateAdvisor,
  useCreateTrainer,
  useCreateOperator,
  useDeactivateUser,
  useDeleteUser,
  useReactivateUser,
  useResetUserPassword,
  useUpdateActiveRoles,
  useUpdateOperatorPermissions,
  useUserDetail,
  useUsersList,
} from '@/src/hooks/useUsersAdmin';
import { formatInr } from '@/src/utils/formatInr';
import { ASSIGNABLE_CHECKBOX_ROLES, lookupByKingId } from '@/src/api/users.api';
import { assignTrainerState, getAdminTrainerReports } from '@/src/api/trainers.api';
import { Role, AdminUser, OperatorPermission, AdvisorType } from '@/src/types/api';
import { useAuth } from '@/src/store/auth-context';
import { PickerModal } from '@/src/components/PickerModal';
import { exportUsersToExcel } from '@/src/utils/excelExport';

const theme = RoleThemes.SUPER_ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

type UserGroup = 'ADMINS' | 'PARTNERS' | 'CLIENTS';

const GROUPS: { value: UserGroup; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'ADMINS', label: 'Admins', icon: 'shield-checkmark' },
  { value: 'PARTNERS', label: 'Partners', icon: 'briefcase' },
  { value: 'CLIENTS', label: 'Clients', icon: 'people' },
];

type UserFilter =
  | 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR' | 'TECHNICAL_TRAINER'
  | 'BUSINESS_PARTNER' | 'TRADER' | 'FARM_ADVISOR' | 'GARDEN_ADVISOR'
  | 'CUSTOMER' | 'FARMER' | 'GARDENER';

const FILTERS_BY_GROUP: Record<UserGroup, { value: UserFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[]> = {
  ADMINS: [
    { value: 'SUPER_ADMIN', label: 'Super Admin', icon: 'shield-half-outline' },
    { value: 'OPERATOR', label: 'Operator', icon: 'print-outline' },
    { value: 'TECHNICAL_TRAINER', label: 'Technical Staff', icon: 'school-outline' },
  ],
  PARTNERS: [
    { value: 'BUSINESS_PARTNER', label: 'Business Partners', icon: 'briefcase-outline' },
    { value: 'FARM_ADVISOR', label: 'Crop Doctors', icon: 'medical-outline' },
    { value: 'GARDEN_ADVISOR', label: 'Garden Advisors', icon: 'sunny-outline' },
  ],
  CLIENTS: [
    { value: 'CUSTOMER', label: 'Customers', icon: 'cart-outline' },
    { value: 'FARMER', label: 'Farmers', icon: 'leaf-outline' },
    { value: 'TRADER', label: 'Traders & Buyers', icon: 'storefront-outline' },
    { value: 'GARDENER', label: 'Gardeners', icon: 'flower-outline' },
  ],
};

function filterToBackendRole(filter: UserFilter): Role {
  if (filter === 'TECHNICAL_TRAINER') return 'TECHNICAL_TRAINER' as Role;
  if (filter === 'TRADER') return 'TRADER' as Role;
  return filter === 'FARM_ADVISOR' || filter === 'GARDEN_ADVISOR' ? 'ADVISOR' : (filter as Role);
}

export default function SuperUsersScreen() {
  const { user } = useAuth();
  const { filter: initialFilter, group: initialGroup } = useLocalSearchParams<{ filter?: UserFilter, group?: UserGroup }>();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [group, setGroup] = useState<UserGroup>(initialGroup || 'CLIENTS');
  const [filter, setFilter] = useState<UserFilter>(initialFilter || 'FARMER');

  useEffect(() => {
    if (initialGroup) setGroup(initialGroup);
    if (initialFilter) setFilter(initialFilter);
  }, [initialGroup, initialFilter]);

  const [search, setSearch] = useState('');
  const [isAddAdvisorOpen, setIsAddAdvisorOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [isAddTrainerOpen, setIsAddTrainerOpen] = useState(false);
  const [isTrainerReportsOpen, setIsTrainerReportsOpen] = useState(false);
  const [permissionsTarget, setPermissionsTarget] = useState<AdminUser | null>(null);
  const [rolesTarget, setRolesTarget] = useState<AdminUser | null>(null);
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<number>(50);
  const [isPageSizePickerOpen, setIsPageSizePickerOpen] = useState(false);
  const [page, setPage] = useState(1);

  const selectGroup = (g: UserGroup) => {
    tap();
    setGroup(g);
    setFilter(FILTERS_BY_GROUP[g][0].value);
  };

  const [statusTab, setStatusTab] = useState<'ACTIVE' | 'DELETED'>('ACTIVE');
  const [deletedFilterMode, setDeletedFilterMode] = useState<'ALL_ROLES' | 'CURRENT_ROLE'>('ALL_ROLES');

  const { data: allUsersData } = useUsersList({ limit: 1000 });
  const { data, isLoading } = useUsersList({ role: filterToBackendRole(filter), search: search.trim() || undefined, limit: 1000 });
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();
  const deleteUser = useDeleteUser();

  const allUsersList = allUsersData?.items ?? [];
  const totalActiveUsersCount = allUsersList.filter((u) => !u.deletedAt).length;
  const totalDeletedUsersCount = allUsersList.filter((u) => !!u.deletedAt).length;

  const getSubCategoryCount = (subFilter: UserFilter): number => {
    return allUsersList.filter((u) => {
      if (statusTab === 'ACTIVE' ? !!u.deletedAt : !u.deletedAt) return false;
      const roles: string[] = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role];
      const activeRoles = roles.filter((r) => !(u.deactivatedRoles ?? []).includes(r as any));
      if (subFilter === 'SUPER_ADMIN') return activeRoles.includes('SUPER_ADMIN') || u.role === 'SUPER_ADMIN';
      if (subFilter === 'OPERATOR') return activeRoles.includes('OPERATOR') || u.role === 'OPERATOR';
      if (subFilter === 'TECHNICAL_TRAINER') return activeRoles.includes('TECHNICAL_TRAINER') || u.role === 'TECHNICAL_TRAINER';
      if (subFilter === 'BUSINESS_PARTNER') return activeRoles.includes('BUSINESS_PARTNER') || u.role === 'BUSINESS_PARTNER';
      if (subFilter === 'TRADER') return activeRoles.includes('TRADER') || u.role === 'TRADER';
      if (subFilter === 'FARM_ADVISOR') return (activeRoles.includes('ADVISOR') || u.role === 'ADVISOR') && u.advisorType !== 'GARDEN';
      if (subFilter === 'GARDEN_ADVISOR') return (activeRoles.includes('ADVISOR') || u.role === 'ADVISOR') && u.advisorType === 'GARDEN';
      if (subFilter === 'CUSTOMER') return activeRoles.includes('CUSTOMER') || u.role === 'CUSTOMER';
      if (subFilter === 'FARMER') return activeRoles.includes('FARMER') || u.role === 'FARMER';
      if (subFilter === 'GARDENER') return activeRoles.includes('GARDENER') || u.role === 'GARDENER';
      return false;
    }).length;
  };

  const getGroupCount = (groupKey: UserGroup): number => {
    const filters = FILTERS_BY_GROUP[groupKey];
    const uniqueUserIds = new Set<string>();
    filters.forEach((f) => {
      allUsersList.forEach((u) => {
        if (statusTab === 'ACTIVE' ? !!u.deletedAt : !u.deletedAt) return;
        const roles: string[] = Array.isArray(u.roles) && u.roles.length > 0 ? u.roles : [u.role];
        const activeRoles = roles.filter((r) => !(u.deactivatedRoles ?? []).includes(r as any));
        let matches = false;
        if (f.value === 'SUPER_ADMIN' && (activeRoles.includes('SUPER_ADMIN') || u.role === 'SUPER_ADMIN')) matches = true;
        if (f.value === 'OPERATOR' && (activeRoles.includes('OPERATOR') || u.role === 'OPERATOR')) matches = true;
        if (f.value === 'TECHNICAL_TRAINER' && (activeRoles.includes('TECHNICAL_TRAINER') || u.role === 'TECHNICAL_TRAINER')) matches = true;
        if (f.value === 'BUSINESS_PARTNER' && (activeRoles.includes('BUSINESS_PARTNER') || u.role === 'BUSINESS_PARTNER')) matches = true;
        if (f.value === 'TRADER' && (activeRoles.includes('TRADER') || u.role === 'TRADER')) matches = true;
        if (f.value === 'FARM_ADVISOR' && (activeRoles.includes('ADVISOR') || u.role === 'ADVISOR') && u.advisorType !== 'GARDEN') matches = true;
        if (f.value === 'GARDEN_ADVISOR' && (activeRoles.includes('ADVISOR') || u.role === 'ADVISOR') && u.advisorType === 'GARDEN') matches = true;
        if (f.value === 'CUSTOMER' && (activeRoles.includes('CUSTOMER') || u.role === 'CUSTOMER')) matches = true;
        if (f.value === 'FARMER' && (activeRoles.includes('FARMER') || u.role === 'FARMER')) matches = true;
        if (f.value === 'GARDENER' && (activeRoles.includes('GARDENER') || u.role === 'GARDENER')) matches = true;
        if (matches) uniqueUserIds.add(u.id);
      });
    });
    return uniqueUserIds.size;
  };

  const [deleteVerificationTarget, setDeleteVerificationTarget] = useState<AdminUser | null>(null);

  const handleDeleteUser = (targetUser: AdminUser) => {
    if (targetUser.mobile === '9872066901') {
      const msg = 'Primary Super Admin account 9872066901 cannot be deleted.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Cannot Delete', msg);
      return;
    }
    if (!targetUser.deletedAt) {
      const msg = '⚠️ User must be deactivated first before permanent deletion. Please click "Deactivate" first.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Deactivation Required', msg);
      return;
    }
    setDeleteVerificationTarget(targetUser);
  };

  const currentRoleRawUsers = (data?.items ?? []).filter((u) =>
    filter === 'FARM_ADVISOR' ? u.advisorType !== 'GARDEN' : filter === 'GARDEN_ADVISOR' ? u.advisorType === 'GARDEN' : true,
  );
  const currentRoleActiveUsers = currentRoleRawUsers.filter((u) => !u.deletedAt);
  const currentRoleDeletedUsers = currentRoleRawUsers.filter((u) => !!u.deletedAt);

  const allDeletedUsers = allUsersList.filter((u) => {
    if (!u.deletedAt) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const cleanMob = u.mobile.replace(/DEL_/gi, '').replace(/_del_\d+/gi, '');
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.mobile.toLowerCase().includes(q) ||
      cleanMob.includes(q) ||
      (u.kingId && u.kingId.toLowerCase().includes(q))
    );
  });

  const items = statusTab === 'ACTIVE'
    ? currentRoleActiveUsers
    : (deletedFilterMode === 'ALL_ROLES' ? allDeletedUsers : currentRoleDeletedUsers);

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    setPage(1);
  }, [filter, search, statusTab, deletedFilterMode]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const visibleItems = items.slice((page - 1) * pageSize, page * pageSize);

  const currentFilterLabel = Object.values(FILTERS_BY_GROUP).flat().find(f => f.value === filter)?.label || 'Users';

  return (
    <View style={[styles.container, { backgroundColor: '#020d06' }]}>
      <View style={styles.premiumHero}>
        <View style={[styles.premiumHeroContent, isDesktop && { maxWidth: 1240, width: '100%', alignSelf: 'center' }]}>
          <View style={styles.heroHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
              <Text style={styles.compactHeroTitle} numberOfLines={1}>
                {statusTab === 'DELETED'
                  ? 'Deleted Users Archive'
                  : `${currentFilterLabel} Directory`}
              </Text>
              <View style={styles.compactCountBadge}>
                <Text style={styles.compactCountBadgeText}>{items.length}</Text>
              </View>
            </View>

            {/* Quick Stats Pill Strip & 1-Click Exports */}
            <View style={styles.heroStatsContainer}>
              <View style={styles.heroStatsPill}>
                <Ionicons name="people" size={11} color="#00ff87" />
                <Text style={styles.heroStatsText}>Total {allUsersList.length}</Text>
              </View>
              <View style={[styles.heroStatsPill, { borderColor: 'rgba(16, 185, 129, 0.4)' }]}>
                <Ionicons name="checkmark-circle" size={11} color="#10b981" />
                <Text style={[styles.heroStatsText, { color: '#10b981' }]}>Active {totalActiveUsersCount}</Text>
              </View>
              <View style={[styles.heroStatsPill, { borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
                <Ionicons name="trash" size={11} color="#ef4444" />
                <Text style={[styles.heroStatsText, { color: '#f87171' }]}>Del {totalDeletedUsersCount}</Text>
              </View>

              {/* Inline Compact Export Buttons */}
              <TouchableOpacity
                style={styles.compactExportBtn}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  exportUsersToExcel(items, `${currentFilterLabel}_Users`);
                }}
              >
                <Ionicons name="download-outline" size={12} color="#00ff87" />
                <Text style={styles.compactExportBtnText}>Export ({items.length})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactExportBtn, { borderColor: 'rgba(16, 185, 129, 0.4)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  const farmers = allUsersList.filter(
                    (u) => u.role === 'FARMER' || (Array.isArray(u.roles) && u.roles.includes('FARMER'))
                  );
                  exportUsersToExcel(farmers, 'All_Farmers');
                }}
              >
                <Ionicons name="leaf" size={11} color="#10b981" />
                <Text style={[styles.compactExportBtnText, { color: '#10b981' }]}>
                  Farmers ({allUsersList.filter((u) => u.role === 'FARMER' || (Array.isArray(u.roles) && u.roles.includes('FARMER'))).length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.compactExportBtn, { borderColor: 'rgba(245, 158, 11, 0.4)', backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  const sellers = allUsersList.filter(
                    (u) => u.role === 'TRADER' || (Array.isArray(u.roles) && u.roles.includes('TRADER'))
                  );
                  exportUsersToExcel(sellers, 'All_Sellers');
                }}
              >
                <Ionicons name="storefront" size={11} color="#f59e0b" />
                <Text style={[styles.compactExportBtnText, { color: '#f59e0b' }]}>
                  Sellers ({allUsersList.filter((u) => u.role === 'TRADER' || (Array.isArray(u.roles) && u.roles.includes('TRADER'))).length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Unified Compact Control Bar: Status Switch + Search + Group Chips */}
          <View style={[styles.compactControlBar, isDesktop && styles.compactControlBarDesktop]}>
            {/* Status Switch (Active vs Deleted) */}
            <View style={styles.compactStatusSwitch}>
              <TouchableOpacity
                style={[styles.compactStatusTab, statusTab === 'ACTIVE' && styles.compactStatusTabActive]}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  setStatusTab('ACTIVE');
                }}
              >
                <Ionicons name="checkmark-circle" size={12} color={statusTab === 'ACTIVE' ? '#00ff87' : '#64748b'} />
                <Text style={[styles.compactStatusText, statusTab === 'ACTIVE' && styles.compactStatusTextActive]}>
                  Active ({totalActiveUsersCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compactStatusTab, statusTab === 'DELETED' && styles.compactStatusTabDeletedActive]}
                activeOpacity={0.8}
                onPress={() => {
                  tap();
                  setStatusTab('DELETED');
                }}
              >
                <Ionicons name="trash-bin" size={12} color={statusTab === 'DELETED' ? '#ef4444' : '#64748b'} />
                <Text style={[styles.compactStatusText, statusTab === 'DELETED' && styles.compactStatusTextDeletedActive]}>
                  Deleted ({totalDeletedUsersCount})
                </Text>
              </TouchableOpacity>
            </View>

            {/* Search Box */}
            <View style={styles.compactSearchBox}>
              <Ionicons name="search" size={13} color="#00ff87" style={{ marginRight: 6 }} />
              <TextInput
                style={styles.compactSearchInput}
                placeholder={`Search ${statusTab === 'DELETED' ? 'deleted accounts' : currentFilterLabel.toLowerCase()}...`}
                placeholderTextColor="rgba(148, 163, 184, 0.6)"
                value={search}
                onChangeText={setSearch}
              />
              {search.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    tap();
                    setSearch('');
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close-circle" size={14} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Group Tabs (Clients, Partners, Admins) */}
            <View style={styles.compactGroupRow}>
              {GROUPS.map((g) => {
                const groupCount = getGroupCount(g.value);
                const isActive = group === g.value;
                return (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.compactGroupChip, isActive && styles.compactGroupChipActive]}
                    activeOpacity={0.8}
                    onPress={() => selectGroup(g.value)}
                  >
                    <Ionicons name={g.icon} size={12} color={isActive ? '#00ff87' : '#64748b'} />
                    <Text style={[styles.compactGroupChipText, isActive && { color: '#00ff87' }]} numberOfLines={1}>
                      {g.label} ({groupCount})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {statusTab === 'DELETED' && (
            <View style={styles.compactDeletedBannerBox}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="archive" size={13} color="#f87171" />
                <Text style={styles.deletedBannerTitle}>Deleted Accounts Archive</Text>
              </View>
              <View style={styles.deletedScopePills}>
                <TouchableOpacity
                  style={[styles.deletedScopePill, deletedFilterMode === 'ALL_ROLES' && styles.deletedScopePillActive]}
                  onPress={() => { tap(); setDeletedFilterMode('ALL_ROLES'); }}
                >
                  <Text style={[styles.deletedScopePillText, deletedFilterMode === 'ALL_ROLES' && styles.deletedScopePillTextActive]}>
                    All Roles ({totalDeletedUsersCount})
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.deletedScopePill, deletedFilterMode === 'CURRENT_ROLE' && styles.deletedScopePillActive]}
                  onPress={() => { tap(); setDeletedFilterMode('CURRENT_ROLE'); }}
                >
                  <Text style={[styles.deletedScopePillText, deletedFilterMode === 'CURRENT_ROLE' && styles.deletedScopePillTextActive]}>
                    {currentFilterLabel} ({currentRoleDeletedUsers.length})
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Role Sub-Filter Chips — Single Sleek Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 6 }}
            contentContainerStyle={{ gap: 6, alignItems: 'center' }}
          >
            {FILTERS_BY_GROUP[group].map((f) => {
              const subCount = getSubCategoryCount(f.value);
              const isActive = filter === f.value;
              return (
                <TouchableOpacity
                  key={f.value}
                  style={[styles.compactFilterChip, isActive && styles.compactFilterChipActive]}
                  activeOpacity={0.8}
                  onPress={() => {
                    tap();
                    setFilter(f.value);
                  }}
                >
                  <Ionicons name={f.icon} size={12} color={isActive ? '#00ff87' : '#94a3b8'} />
                  <Text style={[styles.compactFilterChipText, isActive && { color: '#00ff87' }]}>
                    {f.label} ({subCount})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.premiumList} showsVerticalScrollIndicator={false}>
        {statusTab === 'ACTIVE' && (filter === 'FARM_ADVISOR' || filter === 'GARDEN_ADVISOR') && (
          <TouchableOpacity
            style={[styles.addAdvisorBtn, premiumShadow(theme.primary, 'sm')]}
            activeOpacity={0.85}
            onPress={() => setIsAddAdvisorOpen(true)}
          >
            <Ionicons name="add-circle" size={16} color="#ffffff" />
            <Text style={styles.addAdvisorBtnText}>Add {filter === 'FARM_ADVISOR' ? 'Crop Doctor' : 'Garden Advisor'}</Text>
          </TouchableOpacity>
        )}

        {statusTab === 'ACTIVE' && (filter === 'OPERATOR' || (filter === 'ADMIN' && isSuperAdmin)) && (
          <TouchableOpacity
            style={[styles.addAdvisorBtn, premiumShadow(theme.primary, 'sm')]}
            activeOpacity={0.85}
            onPress={() => setIsAddStaffOpen(true)}
          >
            <Ionicons name="add-circle" size={16} color="#ffffff" />
            <Text style={styles.addAdvisorBtnText}>Add {filter === 'OPERATOR' ? 'Operator' : 'Admin'}</Text>
          </TouchableOpacity>
        )}

        {statusTab === 'ACTIVE' && filter === 'TECHNICAL_TRAINER' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.addAdvisorBtn, { flex: 1 }, premiumShadow(theme.primary, 'sm')]}
              activeOpacity={0.85}
              onPress={() => setIsAddStaffOpen(true)}
            >
              <Ionicons name="add-circle" size={16} color="#ffffff" />
              <Text style={styles.addAdvisorBtnText}>Appoint Technical Staff</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addAdvisorBtn, { flex: 1, backgroundColor: '#059669' }, premiumShadow('#059669', 'sm')]}
              activeOpacity={0.85}
              onPress={() => setIsTrainerReportsOpen(true)}
            >
              <Ionicons name="bar-chart" size={16} color="#ffffff" />
              <Text style={styles.addAdvisorBtnText}>Staff Reports</Text>
            </TouchableOpacity>
          </View>
        )}
        {statusTab === 'ACTIVE' && filter === 'ADMIN' && !isSuperAdmin ? (
          <Text style={styles.emptyText}>Only the Super Admin can add new Admin accounts.</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <View style={{ alignItems: 'center', marginVertical: 40, paddingHorizontal: 20 }}>
            <Ionicons
              name={statusTab === 'DELETED' ? 'shield-checkmark-outline' : 'people-outline'}
              size={48}
              color={statusTab === 'DELETED' ? '#10b981' : '#64748b'}
            />
            <Text style={{ fontSize: 15, fontFamily: FONT.bold, color: statusTab === 'DELETED' ? '#00ff87' : '#94a3b8', marginTop: 12 }}>
              {statusTab === 'DELETED' ? 'No Deleted Accounts Found' : 'No Users Found'}
            </Text>
            <Text style={[styles.emptyText, { marginTop: 4, textAlign: 'center' }]}>
              {statusTab === 'DELETED'
                ? deletedFilterMode === 'ALL_ROLES'
                  ? 'There are no deleted or soft-deleted user accounts in the system.'
                  : `There are no deleted accounts in ${currentFilterLabel}.`
                : search.trim()
                  ? `No active accounts matching "${search}".`
                  : `No active ${currentFilterLabel.toLowerCase()} registered.`}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.usersGridContainer, isDesktop && styles.usersGridContainerDesktop]}>
              {visibleItems.map((u) => (
                <View key={u.id} style={[styles.userGridItem, isDesktop && styles.userGridItemDesktop]}>
                  <UserRow
                    user={u}
                    isDesktop={isDesktop}
                    isOperator={filter === 'OPERATOR'}
                    onDeactivate={() => deactivate.mutate(u.id)}
                    onReactivate={() => reactivate.mutate(u.id)}
                    onDelete={isSuperAdmin ? () => handleDeleteUser(u) : undefined}
                    onEditPermissions={filter === 'OPERATOR' ? () => setPermissionsTarget(u) : undefined}
                    onEditRoles={filter !== 'OPERATOR' && filter !== 'ADMIN' && filter !== 'SUPER_ADMIN' ? () => setRolesTarget(u) : undefined}
                    onOpenDetail={() => setDetailTargetId(u.id)}
                  />
                </View>
              ))}
            </View>

            {/* Pagination Controls Row with Page Size Selector Dropdown */}
            <View style={styles.paginationContainer}>
              <TouchableOpacity
                style={styles.pageSizeDropdownBtn}
                activeOpacity={0.8}
                onPress={() => setIsPageSizePickerOpen(true)}
              >
                <Text style={styles.pageSizeDropdownText}>📄 {pageSize} Users per page ▾</Text>
              </TouchableOpacity>

              <View style={styles.pagerRow}>
                <TouchableOpacity
                  style={[styles.pagerBtn, page === 1 && styles.pagerBtnDisabled]}
                  activeOpacity={0.8}
                  disabled={page === 1}
                  onPress={() => {
                    tap();
                    setPage((p) => Math.max(1, p - 1));
                  }}
                >
                  <Ionicons name="chevron-back" size={15} color={page === 1 ? '#cbd5e1' : theme.primary} />
                </TouchableOpacity>
                <Text style={styles.pagerText}>Page {page} of {totalPages} ({items.length} Users)</Text>
                <TouchableOpacity
                  style={[styles.pagerBtn, page === totalPages && styles.pagerBtnDisabled]}
                  activeOpacity={0.8}
                  disabled={page === totalPages}
                  onPress={() => {
                    tap();
                    setPage((p) => Math.min(totalPages, p + 1));
                  }}
                >
                  <Ionicons name="chevron-forward" size={15} color={page === totalPages ? '#cbd5e1' : theme.primary} />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      <PickerModal
        visible={isPageSizePickerOpen}
        title="Select Users Per Page"
        options={[
          { value: 10, label: '10 Users per page' },
          { value: 20, label: '20 Users per page' },
          { value: 50, label: '50 Users per page (Default)' },
          { value: 100, label: '100 Users per page' },
          { value: 200, label: '200 Users per page' },
          { value: 500, label: '500 Users per page' },
        ]}
        selectedValue={pageSize}
        onSelect={(val) => {
          setPageSize(Number(val));
          setPage(1);
        }}
        onClose={() => setIsPageSizePickerOpen(false)}
      />

      <AddAdvisorModal
        visible={isAddAdvisorOpen}
        advisorType={filter === 'GARDEN_ADVISOR' ? 'GARDEN' : 'FARM'}
        onClose={() => setIsAddAdvisorOpen(false)}
      />

      <AddStaffModal
        visible={isAddStaffOpen}
        kind={filter === 'OPERATOR' ? 'OPERATOR' : filter === 'TECHNICAL_TRAINER' ? 'TECHNICAL_TRAINER' : 'ADMIN'}
        onClose={() => setIsAddStaffOpen(false)}
      />

      <OperatorPermissionsModal target={permissionsTarget} onClose={() => setPermissionsTarget(null)} />
      <EditRolesModal target={rolesTarget} onClose={() => setRolesTarget(null)} />
      <UserDetailModal userId={detailTargetId} onClose={() => setDetailTargetId(null)} />
      <DeleteUserSecurityModal target={deleteVerificationTarget} onClose={() => setDeleteVerificationTarget(null)} />
      <AddTrainerModal visible={isAddTrainerOpen} onClose={() => setIsAddTrainerOpen(false)} />
      <TrainerReportsModal visible={isTrainerReportsOpen} onClose={() => setIsTrainerReportsOpen(false)} />
    </View>
  );
}

function DeleteUserSecurityModal({ target, onClose }: { target: AdminUser | null; onClose: () => void }) {
  const deleteUser = useDeleteUser();
  const [confirmInput, setConfirmInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfirmInput('');
    setError(null);
  }, [target]);

  if (!target) return null;

  const expectedMobile = target.mobile.trim();
  const isMatch = confirmInput.trim() === expectedMobile || confirmInput.trim().toUpperCase() === 'DELETE';

  const handleConfirmDelete = async () => {
    if (!isMatch) {
      setError(`Verification failed. Please type "${expectedMobile}" or "DELETE" to confirm.`);
      return;
    }
    setError(null);
    try {
      await deleteUser.mutateAsync(target.id);
      if (Platform.OS === 'web') alert(`Account for ${target.name} permanently deleted.`);
      else Alert.alert('Account Deleted', `Account for ${target.name} deleted successfully.`);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Could not delete user account.');
    }
  };

  return (
    <Modal visible={!!target} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { borderColor: '#fca5a5', borderWidth: 1.5 }]}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="shield-checkmark" size={20} color="#dc2626" />
              <Text style={[styles.modalTitle, { color: '#dc2626' }]}>Security Verification</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fecaca', marginVertical: 6 }}>
            <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#991b1b' }}>
              ⚠️ Anti-Hacker & Accidental Protection Safeguard
            </Text>
            <Text style={{ fontSize: 11.5, fontFamily: FONT.regular, color: '#7f1d1d', marginTop: 4, lineHeight: 16 }}>
              You are about to permanently delete <Text style={{ fontFamily: FONT.bold }}>{target.name}</Text> ({target.mobile}). All associated data will be removed.
            </Text>
          </View>

          <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#334155', marginTop: 8 }}>
            Type user's mobile number <Text style={{ color: '#dc2626' }}>{expectedMobile}</Text> or <Text style={{ color: '#dc2626' }}>DELETE</Text> to verify:
          </Text>

          <TextInput
            style={[
              styles.input,
              { marginTop: 6, borderColor: isMatch ? '#16a34a' : '#cbd5e1', borderWidth: 1.5, fontFamily: FONT.bold, color: '#0f172a' },
            ]}
            value={confirmInput}
            onChangeText={setConfirmInput}
            placeholder={`Enter ${expectedMobile} or DELETE`}
            placeholderTextColor="#94a3b8"
            autoCapitalize="characters"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }]} onPress={onClose}>
              <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { flex: 1.4, backgroundColor: isMatch ? '#dc2626' : '#cbd5e1' },
              ]}
              disabled={!isMatch || deleteUser.isPending}
              onPress={handleConfirmDelete}
            >
              {deleteUser.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>🛑 Verify & Delete</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function UserDetailModal({ userId, onClose }: { userId: string | null; onClose: () => void }) {
  const { data, isLoading } = useUserDetail(userId ?? undefined);
  const [isEditing, setIsEditing] = useState(false);
  const [isResettingPw, setIsResettingPw] = useState(false);
  const [showAllCoupons, setShowAllCoupons] = useState(false);

  const closeAndReset = () => {
    setIsEditing(false);
    setIsResettingPw(false);
    setShowAllCoupons(false);
    onClose();
  };

  return (
    <Modal visible={!!userId} transparent animationType="slide" onRequestClose={closeAndReset}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{isEditing ? 'Edit User' : isResettingPw ? 'Reset Password' : 'User Detail'}</Text>
            <TouchableOpacity onPress={closeAndReset}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading || !data ? (
            <ActivityIndicator color={theme.primary} style={{ marginVertical: 20 }} />
          ) : isResettingPw ? (
            <ResetPasswordForm userId={data.user.id} onDone={() => setIsResettingPw(false)} />
          ) : isEditing ? (
            <EditUserForm user={data.user} onDone={() => setIsEditing(false)} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              <Text style={styles.detailName}>{data.user.name}</Text>
              <Text style={styles.detailMeta}>📱 {data.user.mobile} {data.user.kingId ? `· 🔑 ${data.user.kingId}` : ''}</Text>
              <Text style={styles.detailMeta}>Role: {data.user.role}{data.user.roles && data.user.roles.length > 1 ? ` (also: ${data.user.roles.filter((r: any) => r !== data.user.role).join(', ')})` : ''}</Text>
              {data.user.village ? <Text style={styles.detailMeta}>📍 {data.user.village}, {data.user.district}, {data.user.state}</Text> : null}
              <Text style={styles.detailMeta}>Joined: {new Date(data.user.createdAt).toLocaleDateString('en-IN')}</Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                <TouchableOpacity style={[styles.submitBtn, { flex: 1, marginTop: 0 }]} onPress={() => { tap(); setIsEditing(true); }}>
                  <Text style={styles.submitBtnText}>✏️ Edit Details</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, { flex: 1, marginTop: 0, backgroundColor: '#dc2626' }]}
                  onPress={() => { tap(); setIsResettingPw(true); }}
                >
                  <Text style={styles.submitBtnText}>🔒 Reset Password</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.detailStatsRow}>
                <View style={styles.detailStatBox}>
                  <Text style={styles.detailStatValue}>{data.farmCount}</Text>
                  <Text style={styles.detailStatLabel}>Farms</Text>
                </View>
                <View style={styles.detailStatBox}>
                  <Text style={styles.detailStatValue}>{formatInr(data.walletBalance)}</Text>
                  <Text style={styles.detailStatLabel}>Wallet</Text>
                </View>
                <View style={styles.detailStatBox}>
                  <Text style={styles.detailStatValue}>{data.orderCount}</Text>
                  <Text style={styles.detailStatLabel}>Orders</Text>
                </View>
              </View>

              <Text style={[styles.sectionTitle, { marginTop: 10 }]}>Coupons Redeemed ({data.couponsUsed.length})</Text>
              {data.couponsUsed.length === 0 ? (
                <Text style={styles.helperText}>None yet.</Text>
              ) : (
                <>
                  {(showAllCoupons ? data.couponsUsed : data.couponsUsed.slice(0, 5)).map((c) => (
                    <Text key={c.id} style={styles.detailMeta}>
                      {c.code} · {c.plan} · {c.daysGranted}d · {c.usedAt ? new Date(c.usedAt).toLocaleDateString('en-IN') : '—'}
                    </Text>
                  ))}
                  {data.couponsUsed.length > 5 ? (
                    <TouchableOpacity onPress={() => { tap(); setShowAllCoupons((s) => !s); }} style={{ marginTop: 2 }}>
                      <Text style={[styles.helperText, { color: theme.primary, fontFamily: FONT.bold }]}>
                        {showAllCoupons ? 'Show Less' : `Show All (${data.couponsUsed.length})`}
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

/** Full-profile edit — shared fields plus whichever role-specific fields apply to this user. */
function EditUserForm({ user, onDone }: { user: AdminUser; onDone: () => void }) {
  const update = useAdminUpdateUser();
  const [name, setName] = useState(user.name);
  const [mobile, setMobile] = useState(user.mobile);
  const [email, setEmail] = useState(user.email ?? '');
  const [village, setVillage] = useState(user.village ?? '');
  const [district, setDistrict] = useState(user.district ?? '');
  const [state, setState] = useState(user.state ?? '');

  const activeRoles = (user.roles ?? [user.role]).filter((r: any) => !(user.deactivatedRoles ?? []).includes(r));
  const isFarmer = activeRoles.includes('FARMER');
  const isAdvisor = activeRoles.includes('ADVISOR');
  const isPartner = activeRoles.includes('BUSINESS_PARTNER');
  const showPayoutFields = isAdvisor || isPartner;

  // Advisor-only
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl ?? '');
  const [specialization, setSpecialization] = useState(user.specialization ?? '');
  const [bio, setBio] = useState(user.bio ?? '');
  const [yearsExperience, setYearsExperience] = useState(user.yearsExperience != null ? String(user.yearsExperience) : '');
  const [qualification, setQualification] = useState(user.qualification ?? '');
  const [profileTitle, setProfileTitle] = useState(user.profileTitle ?? '');
  const [isSeniorDoctor, setIsSeniorDoctor] = useState(user.isSeniorDoctor ?? false);
  const [seniorDoctorId, setSeniorDoctorId] = useState(user.seniorDoctorId ?? '');
  const [doctorConsultationFee, setDoctorConsultationFee] = useState(
    user.doctorConsultationFee != null ? String(user.doctorConsultationFee) : ''
  );

  const { data: advisorsList } = useUsersList({ role: 'ADVISOR', limit: 100 });
  const seniorDoctors = (advisorsList?.items ?? []).filter((a) => a.id !== user.id && (a.isSeniorDoctor || a.role === 'SUPER_ADMIN'));

  // Farmer-only
  const [soilType, setSoilType] = useState(user.soilType ?? '');
  const [waterType, setWaterType] = useState(user.waterType ?? '');

  // Business Partner / Advisor payout profile
  const [upiId, setUpiId] = useState(user.upiId ?? '');
  const [panNumber, setPanNumber] = useState(user.panNumber ?? '');
  const [alternativeMobile, setAlternativeMobile] = useState(user.alternativeMobile ?? '');
  const [bankAccountNumber, setBankAccountNumber] = useState(user.bankAccountNumber ?? '');
  const [bankIfsc, setBankIfsc] = useState(user.bankIfsc ?? '');
  const [bankAccountHolderName, setBankAccountHolderName] = useState(user.bankAccountHolderName ?? '');

  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setError(null);
    if (!name.trim() || !mobile.trim()) {
      setError('Name and mobile number are required.');
      return;
    }
    try {
      await update.mutateAsync({
        id: user.id,
        payload: {
          name: name.trim(),
          mobile: mobile.trim(),
          email: email.trim() || undefined,
          village: village.trim() || undefined,
          district: district.trim() || undefined,
          state: state.trim() || undefined,
          ...(isAdvisor
            ? {
              photoUrl: photoUrl.trim() || undefined,
              specialization: specialization.trim() || undefined,
              bio: bio.trim() || undefined,
              yearsExperience: yearsExperience.trim() ? Number(yearsExperience.trim()) : undefined,
              qualification: qualification.trim() || undefined,
              profileTitle: profileTitle.trim() || undefined,
              isSeniorDoctor,
              seniorDoctorId: seniorDoctorId.trim() || undefined,
              doctorConsultationFee: doctorConsultationFee.trim() ? Number(doctorConsultationFee.trim()) : undefined,
            }
            : {}),
          ...(isFarmer
            ? {
              soilType: soilType || undefined,
              waterType: waterType || undefined,
            }
            : {}),
          ...(showPayoutFields
            ? {
              upiId: upiId.trim() || undefined,
              panNumber: panNumber.trim() ? panNumber.trim().toUpperCase() : undefined,
              alternativeMobile: alternativeMobile.trim() || undefined,
              bankAccountNumber: bankAccountNumber.trim() || undefined,
              bankIfsc: bankIfsc.trim() ? bankIfsc.trim().toUpperCase() : undefined,
              bankAccountHolderName: bankAccountHolderName.trim() || undefined,
            }
            : {}),
        },
      });
      onDone();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save changes.');
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      <Text style={styles.label}>Full Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor="#94a3b8" />
      <Text style={styles.label}>Mobile Number</Text>
      <TextInput style={styles.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholderTextColor="#94a3b8" />
      <Text style={styles.label}>Email</Text>
      <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Optional" placeholderTextColor="#94a3b8" />
      <Text style={styles.label}>Village</Text>
      <TextInput style={styles.input} value={village} onChangeText={setVillage} placeholder="Optional" placeholderTextColor="#94a3b8" />
      <Text style={styles.label}>District</Text>
      <TextInput style={styles.input} value={district} onChangeText={setDistrict} placeholder="Optional" placeholderTextColor="#94a3b8" />
      <Text style={styles.label}>State</Text>
      <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="Optional" placeholderTextColor="#94a3b8" />

      {isAdvisor ? (
        <>
          <Text style={styles.sectionTitle}>Advisor Profile</Text>
          <Text style={styles.label}>Profile Photo URL</Text>
          <TextInput style={styles.input} value={photoUrl} onChangeText={setPhotoUrl} placeholder="Optional" placeholderTextColor="#94a3b8" />
          <Text style={styles.label}>Profile Title</Text>
          <TextInput style={styles.input} value={profileTitle} onChangeText={setProfileTitle} placeholder="e.g. Senior Farm Advisor" placeholderTextColor="#94a3b8" />
          <Text style={styles.label}>Qualification</Text>
          <TextInput style={styles.input} value={qualification} onChangeText={setQualification} placeholder="e.g. B.Sc Agriculture" placeholderTextColor="#94a3b8" />
          <Text style={styles.label}>Specialization</Text>
          <TextInput style={styles.input} value={specialization} onChangeText={setSpecialization} placeholder="Optional" placeholderTextColor="#94a3b8" />
          <Text style={styles.label}>Bio</Text>
          <TextInput style={styles.input} value={bio} onChangeText={setBio} placeholder="Optional" placeholderTextColor="#94a3b8" multiline />
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput style={styles.input} value={yearsExperience} onChangeText={setYearsExperience} keyboardType="number-pad" placeholder="Optional" placeholderTextColor="#94a3b8" />
          <Text style={styles.label}>Doctor Consultation Fee (₹)</Text>
          <TextInput style={styles.input} value={doctorConsultationFee} onChangeText={setDoctorConsultationFee} keyboardType="number-pad" placeholder="e.g. 500, 300" placeholderTextColor="#94a3b8" />

          <TouchableOpacity style={styles.permissionRow} activeOpacity={0.8} onPress={() => setIsSeniorDoctor(!isSeniorDoctor)}>
            <Ionicons name={isSeniorDoctor ? 'checkbox' : 'square-outline'} size={20} color={isSeniorDoctor ? theme.primary : '#94a3b8'} />
            <Text style={styles.permissionRowText}>Is Senior Doctor (Can manage Junior Doctors & receive forwarded problems)</Text>
          </TouchableOpacity>

          {!isSeniorDoctor && seniorDoctors.length > 0 ? (
            <>
              <Text style={styles.label}>Assign Senior Doctor</Text>
              <View style={{ gap: 6 }}>
                {seniorDoctors.map((doc) => {
                  const isSelected = seniorDoctorId === doc.id;
                  return (
                    <TouchableOpacity
                      key={doc.id}
                      style={[styles.permissionRow, isSelected && { borderColor: theme.primary, backgroundColor: '#f0fdf4' }]}
                      onPress={() => setSeniorDoctorId(isSelected ? '' : doc.id)}
                    >
                      <Ionicons name={isSelected ? 'radio-button-on' : 'radio-button-off'} size={18} color={isSelected ? theme.primary : '#94a3b8'} />
                      <Text style={styles.permissionRowText}>👴 {doc.name} ({doc.mobile})</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          ) : null}
        </>
      ) : null}

      {isFarmer ? (
        <>
          <Text style={styles.sectionTitle}>Farmer Profile</Text>
          <Text style={styles.label}>Soil Type</Text>
          <TextInput style={styles.input} value={soilType} onChangeText={(v) => setSoilType(v as any)} placeholder="e.g. ALLUVIAL" placeholderTextColor="#94a3b8" autoCapitalize="characters" />
          <Text style={styles.label}>Water Type</Text>
          <TextInput style={styles.input} value={waterType} onChangeText={(v) => setWaterType(v as any)} placeholder="e.g. BOREWELL_TUBEWELL" placeholderTextColor="#94a3b8" autoCapitalize="characters" />
        </>
      ) : null}

      {showPayoutFields ? (
        <>
          <Text style={styles.sectionTitle}>Payout Profile</Text>
          <Text style={styles.helperText}>Required before this user's wallet can be withdrawn from.</Text>
          <Text style={styles.label}>UPI ID</Text>
          <TextInput style={styles.input} value={upiId} onChangeText={setUpiId} placeholder="name@bank" placeholderTextColor="#94a3b8" autoCapitalize="none" />
          <Text style={styles.label}>PAN Number</Text>
          <TextInput style={styles.input} value={panNumber} onChangeText={setPanNumber} placeholder="ABCDE1234F" placeholderTextColor="#94a3b8" autoCapitalize="characters" />
          <Text style={styles.label}>Alternative Mobile Number</Text>
          <TextInput style={styles.input} value={alternativeMobile} onChangeText={setAlternativeMobile} keyboardType="phone-pad" placeholder="Optional" placeholderTextColor="#94a3b8" />
          <Text style={styles.label}>Bank Account Holder Name</Text>
          <TextInput style={styles.input} value={bankAccountHolderName} onChangeText={setBankAccountHolderName} placeholder="Optional" placeholderTextColor="#94a3b8" />
          <Text style={styles.label}>Bank Account Number</Text>
          <TextInput style={styles.input} value={bankAccountNumber} onChangeText={setBankAccountNumber} placeholder="Optional" placeholderTextColor="#94a3b8" keyboardType="number-pad" />
          <Text style={styles.label}>Bank IFSC Code</Text>
          <TextInput style={styles.input} value={bankIfsc} onChangeText={setBankIfsc} placeholder="Optional" placeholderTextColor="#94a3b8" autoCapitalize="characters" />
        </>
      ) : null}

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#071f12', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }]} onPress={onDone}>
          <Text style={[styles.submitBtnText, { color: '#cbd5e1' }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, { flex: 1 }]} disabled={update.isPending} onPress={handleSave}>
          {update.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

/** Sets a new password directly — the old one is a one-way hash and can never be shown, only replaced. */
function ResetPasswordForm({ userId, onDone }: { userId: string; onDone: () => void }) {
  const resetPassword = useResetUserPassword();
  const [customPassword, setCustomPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultPassword, setResultPassword] = useState<string | null>(null);

  const handleReset = async () => {
    setError(null);
    if (customPassword && customPassword.length < 8) {
      setError('Password must be at least 8 characters — or leave blank to auto-generate one.');
      return;
    }
    try {
      const res = await resetPassword.mutateAsync({ id: userId, newPassword: customPassword.trim() || undefined });
      setResultPassword(res.tempPassword);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not reset the password.');
    }
  };

  if (resultPassword) {
    return (
      <View style={{ gap: 10 }}>
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
          <Text style={styles.successText}>
            Password reset. New password: <Text style={{ fontFamily: FONT.extraBold }}>{resultPassword}</Text> — share this with the user securely.
          </Text>
        </View>
        <TouchableOpacity style={styles.submitBtn} onPress={onDone}>
          <Text style={styles.submitBtnText}>Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.helperText}>
        The old password can never be shown — it's a one-way hash. Set a new one below, or leave blank to auto-generate one.
      </Text>
      <Text style={styles.label}>New Password (optional, min 8 characters)</Text>
      <TextInput
        style={styles.input}
        value={customPassword}
        onChangeText={setCustomPassword}
        placeholder="Leave blank to auto-generate"
        placeholderTextColor="#94a3b8"
        autoCapitalize="none"
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#071f12', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.12)' }]} onPress={onDone}>
          <Text style={[styles.submitBtnText, { color: '#cbd5e1' }]}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#dc2626' }]} disabled={resetPassword.isPending} onPress={handleReset}>
          {resetPassword.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Reset Password</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const OPERATOR_PERMISSION_LABELS: { value: OperatorPermission; label: string }[] = [
  { value: 'VIEW_ORDERS', label: 'View Orders' },
  { value: 'VIEW_COUPONS', label: 'View Coupons' },
  { value: 'VIEW_USERS', label: 'View Users' },
  { value: 'VIEW_WALLETS', label: 'View Wallets' },
  { value: 'VIEW_FARMER_PLANS', label: 'View Farmer Plans' },
];

function OperatorPermissionsModal({ target, onClose }: { target: AdminUser | null; onClose: () => void }) {
  const updatePermissions = useUpdateOperatorPermissions();
  const [selected, setSelected] = useState<OperatorPermission[]>([]);

  React.useEffect(() => {
    setSelected(target?.operatorPermissions ?? []);
  }, [target]);

  if (!target) return null;

  const toggle = (perm: OperatorPermission) => {
    tap();
    setSelected((prev) => (prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]));
  };

  const handleSave = async () => {
    await updatePermissions.mutateAsync({ id: target.id, permissions: selected });
    onClose();
  };

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{target.name}'s Permissions</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>What this Operator can view — nothing beyond what's checked here.</Text>

          <View style={{ gap: 8, marginTop: 8 }}>
            {OPERATOR_PERMISSION_LABELS.map((p) => {
              const isChecked = selected.includes(p.value);
              return (
                <TouchableOpacity key={p.value} style={styles.permissionRow} activeOpacity={0.8} onPress={() => toggle(p.value)}>
                  <Ionicons name={isChecked ? 'checkbox' : 'square-outline'} size={20} color={isChecked ? theme.primary : '#94a3b8'} />
                  <Text style={styles.permissionRowText}>{p.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity style={styles.submitBtn} disabled={updatePermissions.isPending} onPress={handleSave}>
            {updatePermissions.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Permissions</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const ROLE_LABELS: Record<Role, string> = {
  CUSTOMER: 'Customer',
  FARMER: 'Farmer',
  GARDENER: 'Gardener',
  ADVISOR: 'Advisor',
  BUSINESS_PARTNER: 'Business Partner',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  OPERATOR: 'Operator',
  LABOUR: 'Labour Worker',
  TECHNICAL_TRAINER: 'Technical Trainer',
  TRADER: 'Trader & Buyer',
  MANAGER: 'Manager',
  SUPERVISOR: 'Supervisor',
  SELLER: 'Seller',
};

function EditRolesModal({ target, onClose }: { target: AdminUser | null; onClose: () => void }) {
  const updateActiveRoles = useUpdateActiveRoles();
  const updateUser = useAdminUpdateUser();
  const [selected, setSelected] = useState<Role[]>([]);
  const [advisorType, setAdvisorType] = useState<AdvisorType | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setError(null);
    const active = (target.roles ?? [target.role]).filter((r: any) => !(target.deactivatedRoles ?? []).includes(r));
    setSelected(active.includes('CUSTOMER') ? active : [...active, 'CUSTOMER']);
    setAdvisorType(target.advisorType ?? null);
  }, [target]);

  if (!target) return null;

  const toggle = (role: Role) => {
    if (role === 'CUSTOMER') return;
    tap();
    setSelected((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  const toggleAdvisorType = (type: AdvisorType) => {
    tap();
    if (advisorType === type) {
      setAdvisorType(null);
      setSelected((prev) => prev.filter((r) => r !== 'ADVISOR'));
    } else {
      setAdvisorType(type);
      setSelected((prev) => (prev.includes('ADVISOR') ? prev : [...prev, 'ADVISOR']));
    }
  };

  const roleLabels = selected.map((r) => (r === 'ADVISOR' ? (advisorType === 'GARDEN' ? 'Garden Advisor' : 'Farm Advisor') : ROLE_LABELS[r]));

  const handleSave = () => {
    setError(null);
    const message = `${target.name} ke roles update ho jayenge:\n${roleLabels.join(', ') || 'None'}\n\nConfirm karein?`;
    const doSave = async () => {
      try {
        // Filter to only roles the backend allows via checkbox assignment
        const assignableSelected = selected.filter((r) => ASSIGNABLE_CHECKBOX_ROLES.includes(r));
        await updateActiveRoles.mutateAsync({ id: target.id, activeRoles: assignableSelected });
        if (selected.includes('ADVISOR') && advisorType) {
          await updateUser.mutateAsync({ id: target.id, payload: { advisorType } });
        }
        onClose();
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Could not update user roles.');
      }
    };
    if (Platform.OS === 'web') {
      if (confirm(message)) doSave();
    } else {
      Alert.alert('Confirm Role Update', message, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: doSave },
      ]);
    }
  };

  return (
    <Modal visible={!!target} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>{target.name}'s Roles</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>
            Unchecking a role deactivates it (it can be reactivated later) — roles are never deleted from history.
          </Text>

          <View style={{ gap: 8, marginTop: 8 }}>
            {ASSIGNABLE_CHECKBOX_ROLES.filter((role) => role !== 'ADVISOR').map((role) => {
              const isChecked = selected.includes(role);
              const wasEverGranted = (target.roles ?? []).includes(role);
              const isLocked = role === 'CUSTOMER';
              return (
                <TouchableOpacity
                  key={role}
                  style={[styles.permissionRow, isLocked && { opacity: 0.6 }]}
                  activeOpacity={isLocked ? 1 : 0.8}
                  disabled={isLocked}
                  onPress={() => toggle(role)}
                >
                  <Ionicons name={isChecked ? 'checkbox' : 'square-outline'} size={20} color={isChecked ? theme.primary : '#94a3b8'} />
                  <Text style={styles.permissionRowText}>{ROLE_LABELS[role]}</Text>
                  {isLocked ? <Text style={styles.lockedHint}>Always active</Text> : wasEverGranted && !isChecked ? <Text style={styles.deactivatedHint}>Deactivated</Text> : null}
                </TouchableOpacity>
              );
            })}
            {(['FARM', 'GARDEN'] as AdvisorType[]).map((type) => {
              const isChecked = advisorType === type;
              const wasEverGranted = (target.roles ?? []).includes('ADVISOR') && target.advisorType === type;
              return (
                <TouchableOpacity key={type} style={styles.permissionRow} activeOpacity={0.8} onPress={() => toggleAdvisorType(type)}>
                  <Ionicons name={isChecked ? 'checkbox' : 'square-outline'} size={20} color={isChecked ? theme.primary : '#94a3b8'} />
                  <Text style={styles.permissionRowText}>{type === 'FARM' ? 'Farm Advisor' : 'Garden Advisor'}</Text>
                  {wasEverGranted && !isChecked ? <Text style={styles.deactivatedHint}>Deactivated</Text> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity style={styles.submitBtn} disabled={updateActiveRoles.isPending} onPress={handleSave}>
            {updateActiveRoles.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Save Roles</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function UserRow({
  user,
  isDesktop,
  isOperator,
  onDeactivate,
  onReactivate,
  onDelete,
  onEditPermissions,
  onEditRoles,
  onOpenDetail,
}: {
  user: AdminUser;
  isDesktop?: boolean;
  isOperator?: boolean;
  onDeactivate: () => void;
  onReactivate: () => void;
  onDelete?: () => void;
  onEditPermissions?: () => void;
  onEditRoles?: () => void;
  onOpenDetail?: () => void;
}) {
  const isDeactivated = !!user.deletedAt;
  const initials = (user.name ?? '').trim().split(/\s+/).slice(0, 2).map((p: any) => p[0] ?? '').join('').toUpperCase() || '?';
  const activeAssignedRoles = Array.from(
    new Set([
      user.role,
      ...(user.roles ?? []).filter((r: any) => !(user.deactivatedRoles ?? []).includes(r)),
    ]),
  );

  const locationStr = [user.village, user.district, user.state].filter(Boolean).join(', ');
  const joinedDateStr = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const deletedDateStr = user.deletedAt ? new Date(user.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const cleanMobile = user.mobile.replace(/^DEL_/i, '').replace(/_del_\d+$/i, '').replace(/_\d+$/i, '');

  const copyToClipboard = (text: string, label: string) => {
    tap();
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      alert(`Copied ${label}: ${text}`);
    } else {
      Alert.alert('Copied', `${label} ${text} copied to clipboard.`);
    }
  };

  return (
    <View style={[styles.userCard, premiumShadow('#0f172a', 'sm'), isDeactivated && styles.userCardDeactivated]}>
      {/* 1. Header: Avatar + Identity + Status Pill */}
      <View style={styles.cardHeaderRow}>
        {/* Avatar with Status Dot */}
        <TouchableOpacity
          style={styles.avatarWrap}
          activeOpacity={0.8}
          onPress={onOpenDetail}
          disabled={!onOpenDetail}
        >
          <View style={[styles.userAvatar, isDeactivated && styles.userAvatarDeactivated]}>
            {user.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.userAvatarImage} resizeMode="cover" />
            ) : (
              <Text style={[styles.userAvatarText, isDeactivated && { color: '#ef4444' }]}>{initials}</Text>
            )}
          </View>
          <View style={[styles.statusDot, isDeactivated ? styles.statusDotOffline : styles.statusDotOnline]} />
        </TouchableOpacity>

        {/* Name + King ID */}
        <TouchableOpacity
          style={{ flex: 1, gap: 2 }}
          activeOpacity={0.8}
          onPress={onOpenDetail}
          disabled={!onOpenDetail}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
            <Text style={[styles.userName, isDeactivated && styles.userNameDeactivated]} numberOfLines={1}>
              {user.name === 'Deleted Account' ? `Deleted (${user.kingId || cleanMobile})` : user.name}
            </Text>
            {isDeactivated ? (
              <View style={styles.deactivatedBadge}>
                <Ionicons name="trash" size={10} color="#ef4444" />
                <Text style={styles.deactivatedBadgeText}>
                  {deletedDateStr ? `Deleted ${deletedDateStr}` : 'Deleted'}
                </Text>
              </View>
            ) : (
              <View style={styles.activePillBadge}>
                <View style={styles.activePillDot} />
                <Text style={styles.activePillText}>Active</Text>
              </View>
            )}
          </View>

          {/* King ID with Copy Button */}
          {user.kingId ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <TouchableOpacity
                style={styles.kingIdChip}
                onPress={() => copyToClipboard(user.kingId!, 'King ID')}
                activeOpacity={0.7}
              >
                <Ionicons name="key" size={10} color="#00ff87" />
                <Text style={styles.kingIdChipText}>{user.kingId}</Text>
                <Ionicons name="copy-outline" size={10} color="#00ff87" />
              </TouchableOpacity>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {/* 2. Body Info: Contact + Location + Joined + Roles */}
      <View style={styles.cardBody}>
        {/* Mobile Number Row */}
        <View style={styles.infoRow}>
          <TouchableOpacity
            style={styles.mobileChip}
            onPress={() => copyToClipboard(cleanMobile, 'Mobile Number')}
            activeOpacity={0.7}
          >
            <Ionicons name="call" size={12} color="#10b981" />
            <Text style={styles.mobileChipText}>{cleanMobile}</Text>
            <Ionicons name="copy-outline" size={10} color="#64748b" />
          </TouchableOpacity>

          {joinedDateStr ? (
            <View style={styles.joinedBadge}>
              <Ionicons name="calendar-outline" size={11} color="#64748b" />
              <Text style={styles.joinedBadgeText}>{joinedDateStr}</Text>
            </View>
          ) : null}
        </View>

        {/* Email Row (if any) */}
        {user.email ? (
          <View style={styles.infoItemRow}>
            <Ionicons name="mail-outline" size={12} color="#64748b" />
            <Text style={styles.infoItemText} numberOfLines={1}>
              {user.email.replace(/^DEL_/i, '').replace(/_del_\d+$/i, '')}
            </Text>
          </View>
        ) : null}

        {/* Location Row (if any) */}
        {locationStr ? (
          <View style={styles.infoItemRow}>
            <Ionicons name="location-outline" size={12} color="#64748b" />
            <Text style={styles.infoItemText} numberOfLines={1}>{locationStr}</Text>
          </View>
        ) : null}

        {/* Role Tags */}
        <View style={styles.rolesRow}>
          {activeAssignedRoles.map((r) => (
            <View key={r} style={[styles.roleBadge, isDeactivated && styles.roleBadgeDeactivated]}>
              <Text style={[styles.roleBadgeText, isDeactivated && styles.roleBadgeTextDeactivated]}>
                {r.replace('_', ' ')}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 3. Ergonomic Bottom Action Bar */}
      <View style={styles.cardActionBar}>
        {onOpenDetail ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnSecondary]}
            activeOpacity={0.8}
            onPress={onOpenDetail}
          >
            <Ionicons name="eye-outline" size={13} color="#94a3b8" />
            <Text style={[styles.actionBtnText, { color: '#cbd5e1' }]}>Details</Text>
          </TouchableOpacity>
        ) : null}

        {!isDeactivated && isOperator && onEditPermissions ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnBlue]}
            activeOpacity={0.8}
            onPress={onEditPermissions}
          >
            <Ionicons name="options-outline" size={13} color="#60a5fa" />
            <Text style={[styles.actionBtnText, { color: '#60a5fa' }]}>Perms</Text>
          </TouchableOpacity>
        ) : null}

        {!isDeactivated && onEditRoles ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnIndigo]}
            activeOpacity={0.8}
            onPress={onEditRoles}
          >
            <Ionicons name="shield-outline" size={13} color="#a5b4fc" />
            <Text style={[styles.actionBtnText, { color: '#a5b4fc' }]}>Role</Text>
          </TouchableOpacity>
        ) : null}

        {isDeactivated ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnRestore]}
            activeOpacity={0.8}
            onPress={onReactivate}
          >
            <Ionicons name="refresh" size={13} color="#00ff87" />
            <Text style={[styles.actionBtnText, { color: '#00ff87' }]}>Restore</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDeactivate]}
            activeOpacity={0.8}
            onPress={onDeactivate}
          >
            <Ionicons name="pause-circle-outline" size={13} color="#f87171" />
            <Text style={[styles.actionBtnText, { color: '#f87171' }]}>Deactivate</Text>
          </TouchableOpacity>
        )}

        {onDelete ? (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnDelete]}
            activeOpacity={0.8}
            onPress={onDelete}
          >
            <Ionicons name="trash-outline" size={13} color="#ffffff" />
            <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Delete</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

function AddAdvisorModal({ visible, advisorType, onClose }: { visible: boolean; advisorType: AdvisorType; onClose: () => void }) {
  const createAdvisor = useCreateAdvisor();
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tempPasswordResult, setTempPasswordResult] = useState<string | null>(null);

  const reset = () => {
    setMobile('');
    setName('');
    setEmail('');
    setVillage('');
    setDistrict('');
    setState('');
    setError(null);
    setTempPasswordResult(null);
  };

  const handleSubmit = async () => {
    if (!mobile.trim() || !name.trim()) {
      setError('Mobile number and name are required.');
      return;
    }
    try {
      const result = await createAdvisor.mutateAsync({
        mobile: mobile.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        advisorType,
      });
      setTempPasswordResult(result.tempPassword);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not create advisor.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Add {advisorType === 'FARM' ? 'Crop Doctor' : 'Garden Advisor'}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {tempPasswordResult ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  Crop Doctor created. Temporary password: <Text style={{ fontFamily: FONT.extraBold }}>{tempPasswordResult}</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TextInput style={styles.input} placeholder="Mobile number" placeholderTextColor="#94a3b8" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Email (optional)" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} />
              <TextInput style={styles.input} placeholder="Village (optional)" placeholderTextColor="#94a3b8" value={village} onChangeText={setVillage} />
              <TextInput style={styles.input} placeholder="District (optional)" placeholderTextColor="#94a3b8" value={district} onChangeText={setDistrict} />
              <TextInput style={styles.input} placeholder="State (optional)" placeholderTextColor="#94a3b8" value={state} onChangeText={setState} />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.submitBtn} disabled={createAdvisor.isPending} onPress={handleSubmit}>
                {createAdvisor.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Create Advisor</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function AddStaffModal({ visible, kind, onClose }: { visible: boolean; kind: 'OPERATOR' | 'ADMIN' | 'TECHNICAL_TRAINER'; onClose: () => void }) {
  const createOperator = useCreateOperator();
  const createAdmin = useCreateAdmin();
  const createTrainer = useCreateTrainer();
  const createStaff = kind === 'OPERATOR' ? createOperator : kind === 'ADMIN' ? createAdmin : createTrainer;
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [village, setVillage] = useState('');
  const [district, setDistrict] = useState('');
  const [state, setState] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tempPasswordResult, setTempPasswordResult] = useState<string | null>(null);

  const reset = () => {
    setMobile('');
    setName('');
    setEmail('');
    setVillage('');
    setDistrict('');
    setState('');
    setError(null);
    setTempPasswordResult(null);
  };

  const handleSubmit = async () => {
    if (!mobile.trim() || !name.trim()) {
      setError('Mobile number and name are required.');
      return;
    }
    try {
      const result = await createStaff.mutateAsync({
        mobile: mobile.trim(),
        name: name.trim(),
        email: email.trim() || undefined,
        village: village.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
      });
      setTempPasswordResult(result.tempPassword);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? `Could not create staff.`);
    }
  };

  const label = kind === 'OPERATOR' ? 'Operator' : kind === 'ADMIN' ? 'Admin' : 'Technical Trainer';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Add {label}</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {tempPasswordResult ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  {label} created. Temporary password: <Text style={{ fontFamily: FONT.extraBold }}>{tempPasswordResult}</Text>
                </Text>
              </View>
              <TouchableOpacity style={styles.submitBtn} onPress={() => { reset(); onClose(); }}>
                <Text style={styles.submitBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              <TextInput style={styles.input} placeholder="Mobile number" placeholderTextColor="#94a3b8" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
              <TextInput style={styles.input} placeholder="Full name" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />
              <TextInput style={styles.input} placeholder="Email (optional)" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} />
              <TextInput style={styles.input} placeholder="Village (optional)" placeholderTextColor="#94a3b8" value={village} onChangeText={setVillage} />
              <TextInput style={styles.input} placeholder="District (optional)" placeholderTextColor="#94a3b8" value={district} onChangeText={setDistrict} />
              <TextInput style={styles.input} placeholder="State (optional)" placeholderTextColor="#94a3b8" value={state} onChangeText={setState} />

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity style={styles.submitBtn} disabled={createStaff.isPending} onPress={handleSubmit}>
                {createStaff.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Create {label}</Text>}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

function AddTrainerModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [kingIdOrMobile, setKingIdOrMobile] = useState('');
  const [state, setState] = useState('Punjab');
  const [district, setDistrict] = useState('');
  const [commissionRate, setCommissionRate] = useState('20');
  const [userFound, setUserFound] = useState<{ id: string; name: string; mobile: string; kingId: string | null } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setKingIdOrMobile('');
    setState('Punjab');
    setDistrict('');
    setCommissionRate('20');
    setUserFound(null);
    setIsSearching(false);
    setIsSubmitting(false);
    setError(null);
  };

  const handleLookupUser = async () => {
    if (!kingIdOrMobile.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const res = await lookupByKingId(kingIdOrMobile.trim());
      setUserFound(res);
    } catch {
      setError('User not found by King ID or Mobile. Please verify.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!userFound && !kingIdOrMobile.trim()) {
      setError('Please search and select a user account.');
      return;
    }
    if (!state.trim()) {
      setError('State is required.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const userId = userFound?.id || kingIdOrMobile.trim();
      await assignTrainerState(userId, state.trim(), district.trim() || undefined, Number(commissionRate) || 20);
      alert('✅ Technical Staff role assigned successfully!');
      reset();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not assign Technical Staff.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => { reset(); onClose(); }}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeaderRow}>
            <Text style={styles.modalTitle}>Appoint Technical Staff</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <Text style={styles.helperText}>Enter user's King ID or Mobile Number to appoint them as State/District Technical Staff:</Text>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Enter King ID or Mobile"
                placeholderTextColor="#94a3b8"
                value={kingIdOrMobile}
                onChangeText={setKingIdOrMobile}
              />
              <TouchableOpacity
                style={[styles.submitBtn, { marginTop: 0, paddingHorizontal: 12 }]}
                onPress={handleLookupUser}
                disabled={isSearching}
              >
                {isSearching ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.submitBtnText}>Search</Text>}
              </TouchableOpacity>
            </View>

            {userFound && (
              <View style={styles.successBox}>
                <Ionicons name="person-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  Selected: <Text style={{ fontFamily: FONT.bold }}>{userFound.name}</Text> ({userFound.mobile})
                </Text>
              </View>
            )}

            <Text style={styles.label}>State Assignment</Text>
            <TextInput style={styles.input} placeholder="State (e.g. Punjab)" placeholderTextColor="#94a3b8" value={state} onChangeText={setState} />

            <Text style={styles.label}>District Assignment (Optional)</Text>
            <TextInput style={styles.input} placeholder="District (e.g. Firozpur or leave empty for state-level)" placeholderTextColor="#94a3b8" value={district} onChangeText={setDistrict} />

            <Text style={styles.label}>Commission Rate per Training (₹)</Text>
            <TextInput style={styles.input} placeholder="Default 20" placeholderTextColor="#94a3b8" value={commissionRate} onChangeText={setCommissionRate} keyboardType="number-pad" />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={styles.submitBtn} disabled={isSubmitting} onPress={handleSubmit}>
              {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.submitBtnText}>Assign Technical Staff Role</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function TrainerReportsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [reportsData, setReportsData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      fetchReports();
    }
  }, [visible]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await getAdminTrainerReports();
      setReportsData(data);
    } catch {
      // Best effort
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible) return null;

  const summary = reportsData?.summary || {};
  const logs = reportsData?.logs || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxWidth: 540, maxHeight: '90%' }]}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="bar-chart" size={20} color="#059669" />
              <Text style={styles.modalTitle}>Technical Staff System Reports</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <ActivityIndicator color="#059669" size="large" style={{ marginVertical: 30 }} />
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 12 }}>
              {/* Summary Stats Grid */}
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <View style={[styles.detailStatBox, { flex: 1, minWidth: 100, backgroundColor: '#071f12', borderColor: 'rgba(0, 255, 135, 0.2)' }]}>
                  <Text style={[styles.detailStatValue, { color: '#00ff87' }]}>{summary.totalTrainers || 0}</Text>
                  <Text style={styles.detailStatLabel}>Trainers</Text>
                </View>
                <View style={[styles.detailStatBox, { flex: 1, minWidth: 100, backgroundColor: '#071f12', borderColor: 'rgba(59, 130, 246, 0.2)' }]}>
                  <Text style={[styles.detailStatValue, { color: '#60a5fa' }]}>{summary.totalLogs || 0}</Text>
                  <Text style={styles.detailStatLabel}>Total Calls</Text>
                </View>
                <View style={[styles.detailStatBox, { flex: 1, minWidth: 100, backgroundColor: '#071f12', borderColor: 'rgba(245, 158, 11, 0.2)' }]}>
                  <Text style={[styles.detailStatValue, { color: '#fbbf24' }]}>{summary.pendingCalls || 0}</Text>
                  <Text style={styles.detailStatLabel}>Pending Calls</Text>
                </View>
                <View style={[styles.detailStatBox, { flex: 1, minWidth: 100, backgroundColor: '#071f12', borderColor: 'rgba(0, 255, 135, 0.2)' }]}>
                  <Text style={[styles.detailStatValue, { color: '#00ff87' }]}>₹{summary.totalPayoutDisbursed || 0}</Text>
                  <Text style={styles.detailStatLabel}>Wallet Paid</Text>
                </View>
              </View>

              <Text style={styles.sectionTitle}>Training & Call Logs ({logs.length})</Text>

              {logs.length === 0 ? (
                <Text style={styles.emptyText}>No training logs recorded yet.</Text>
              ) : (
                logs.map((log: any) => {
                  const isVerified = log.status === 'VERIFIED_AND_PAID';
                  return (
                    <View key={log.id} style={{ backgroundColor: '#020d06', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.08)', gap: 5 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#f8fafc' }}>
                          🌾 {log.farmer?.name || 'Farmer'} ({log.farmer?.mobile})
                        </Text>
                        <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: isVerified ? '#00ff87' : '#fbbf24' }}>
                          {isVerified ? `Verified (₹${log.payoutAmount})` : 'Pending'}
                        </Text>
                      </View>
                      <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#cbd5e1' }}>
                        Trainer: <Text style={{ fontFamily: FONT.bold, color: '#00ff87' }}>{log.trainer?.name || 'Assigned Trainer'}</Text> ({log.trainer?.mobile})
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8' }}>
                        Location: {log.farmer?.district || log.state || 'Punjab'} • Time Slot: {log.preferredCallSlot || 'ANYTIME'}
                      </Text>
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020d06',
  },
  premiumHero: {
    paddingTop: Platform.OS === 'ios' ? 44 : 10,
    backgroundColor: '#04140a',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 255, 135, 0.12)',
    ...premiumShadow('#000000', 'sm'),
  },
  premiumHeroContent: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  compactHeroTitle: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    letterSpacing: -0.4,
  },
  compactCountBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  compactCountBadgeText: {
    color: '#00ff87',
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  heroStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  heroStatsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#071f12',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
  },
  heroStatsText: {
    color: '#00ff87',
    fontFamily: FONT.bold,
    fontSize: 10.5,
  },
  compactExportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
  },
  compactExportBtnText: {
    color: '#00ff87',
    fontSize: 10.5,
    fontFamily: FONT.bold,
  },
  compactControlBar: {
    flexDirection: 'column',
    gap: 6,
  },
  compactControlBarDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactStatusSwitch: {
    flexDirection: 'row',
    backgroundColor: '#071f12',
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 2,
    alignSelf: 'flex-start',
  },
  compactStatusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
  },
  compactStatusTabActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.18)',
  },
  compactStatusTabDeletedActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  compactStatusText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#64748b',
  },
  compactStatusTextActive: {
    color: '#00ff87',
  },
  compactStatusTextDeletedActive: {
    color: '#f87171',
  },
  compactSearchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020d06',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 10,
    height: 32,
    minWidth: 180,
  },
  compactSearchInput: {
    flex: 1,
    color: '#f8fafc',
    fontFamily: FONT.medium,
    fontSize: 12,
  },
  compactGroupRow: {
    flexDirection: 'row',
    gap: 4,
  },
  compactGroupChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#071f12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  compactGroupChipActive: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.14)',
  },
  compactGroupChipText: {
    color: '#94a3b8',
    fontFamily: FONT.bold,
    fontSize: 11,
  },
  compactFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    backgroundColor: '#071f12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  compactFilterChipActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.18)',
    borderColor: '#00ff87',
  },
  compactFilterChipText: {
    color: '#94a3b8',
    fontFamily: FONT.bold,
    fontSize: 11,
  },
  compactDeletedBannerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  deletedBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  deletedBannerTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#f87171',
  },
  deletedScopePills: {
    flexDirection: 'row',
    gap: 6,
  },
  deletedScopePill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  deletedScopePillActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.25)',
    borderColor: '#ef4444',
  },
  deletedScopePillText: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#94a3b8',
  },
  deletedScopePillTextActive: {
    color: '#fca5a5',
    fontFamily: FONT.bold,
  },
  deletedBannerDesc: {
    fontSize: 11,
    fontFamily: FONT.regular,
    color: '#cbd5e1',
    lineHeight: 16,
    marginTop: 6,
  },
  groupRowPremium: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  groupChipPremium: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#071f12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    position: 'relative',
    overflow: 'hidden',
  },
  groupChipPremiumActive: {
    borderColor: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    ...premiumShadow('#00ff87', 'sm'),
  },
  groupChipTextPremium: {
    color: '#94a3b8',
    fontFamily: FONT.bold,
    fontSize: 12,
  },
  filterChipPremium: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: '#071f12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterChipPremiumActive: {
    backgroundColor: 'rgba(0, 255, 135, 0.16)',
    borderColor: '#00ff87',
    ...premiumShadow('#00ff87', 'sm'),
  },
  filterChipTextPremium: {
    color: '#94a3b8',
    fontFamily: FONT.semiBold,
    fontSize: 11.5,
  },
  premiumList: {
    padding: 16,
    paddingBottom: 110,
    gap: 12,
    backgroundColor: '#020d06',
  },
  usersGridContainer: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  usersGridContainerDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    justifyContent: 'space-between',
  },
  userGridItem: {
    width: '100%',
  },
  userGridItemDesktop: {
    width: '49%',
    minWidth: 320,
  },
  userCard: {
    backgroundColor: '#04180d',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.14)',
    gap: 10,
    width: '100%',
  },
  userCardDeactivated: {
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    opacity: 0.95,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    position: 'relative',
  },
  userAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  userAvatarDeactivated: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.4)',
  },
  userAvatarImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  userAvatarText: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#04180d',
  },
  statusDotOnline: {
    backgroundColor: '#00ff87',
  },
  statusDotOffline: {
    backgroundColor: '#ef4444',
  },
  userName: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    flexShrink: 1,
    letterSpacing: -0.2,
  },
  userNameDeactivated: {
    color: '#fca5a5',
  },
  activePillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00ff87',
  },
  activePillText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  deactivatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  deactivatedBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#f87171',
  },
  kingIdChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#020d06',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  kingIdChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#00ff87',
    letterSpacing: 0.4,
  },
  cardBody: {
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  mobileChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#020d06',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mobileChipText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
  },
  joinedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  joinedBadgeText: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  infoItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoItemText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    flex: 1,
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  roleBadge: {
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  roleBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#00ff87',
    letterSpacing: 0.3,
  },
  roleBadgeDeactivated: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  roleBadgeTextDeactivated: {
    color: '#fca5a5',
  },
  cardActionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionBtnSecondary: {
    backgroundColor: '#071f12',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnBlue: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  actionBtnIndigo: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  actionBtnRestore: {
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    borderColor: '#00ff87',
  },
  actionBtnDeactivate: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  actionBtnDelete: {
    backgroundColor: '#dc2626',
    borderColor: '#b91c1c',
  },
  actionBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 13, 6, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  modalCard: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '88%',
    backgroundColor: '#04180d',
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    ...premiumShadow('#000000', 'lg'),
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  label: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
    marginTop: 6,
  },
  input: {
    borderWidth: 1.5,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    fontFamily: FONT.medium,
    backgroundColor: '#020d06',
    color: '#f8fafc',
  },
  errorText: {
    color: '#f87171',
    fontFamily: FONT.semiBold,
    fontSize: 12,
  },
  submitBtn: {
    backgroundColor: theme.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 6,
    ...premiumShadow(theme.primary, 'sm'),
  },
  submitBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 14,
  },
  helperText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  permissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  permissionRowText: {
    fontSize: 13.5,
    fontFamily: FONT.semiBold,
    color: '#f8fafc',
    flex: 1,
  },
  deactivatedHint: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#fca5a5',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lockedHint: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
    backgroundColor: 'rgba(0, 255, 135, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  detailName: {
    fontSize: 18,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
  },
  detailMeta: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  detailStatsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  detailStatBox: {
    flex: 1,
    backgroundColor: '#020d06',
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  detailStatValue: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  detailStatLabel: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  successText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#00ff87',
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  pageSizeDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#071f12',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
  },
  pageSizeDropdownText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#f8fafc',
  },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 4,
  },
  pagerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.2)',
    backgroundColor: '#071f12',
  },
  pagerBtnDisabled: {
    opacity: 0.4,
  },
  pagerText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#cbd5e1',
  },
  emptyText: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  addAdvisorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  addAdvisorBtnText: {
    color: '#ffffff',
    fontFamily: FONT.bold,
    fontSize: 13.5,
  },
  relationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginTop: 4,
  },
  relationLabel: {
    fontSize: 10.5,
    fontFamily: FONT.bold,
    color: '#34d399',
    letterSpacing: 0.2,
  },
  relationValue: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
    color: '#f8fafc',
    marginTop: 1,
  },
  detailSectionHighlight: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: RADIUS.md,
    padding: 10,
    marginVertical: 4,
    gap: 3,
  },
  detailHighlightTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#10b981',
  },
  detailHighlightText: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
  },
  excelExportBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  excelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.35)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  excelBtnText: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
});
