import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  useCreateAccountant,
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
  usePartnerApplications,
  useVerifiedLeads,
} from '@/src/hooks/useUsersAdmin';
import { formatInr } from '@/src/utils/formatInr';
import { ASSIGNABLE_CHECKBOX_ROLES, lookupByKingId } from '@/src/api/users.api';
import { assignTrainerState, getAdminTrainerReports } from '@/src/api/trainers.api';
import { Role, AdminUser, OperatorPermission, AdvisorType } from '@/src/types/api';
import { useAuth } from '@/src/store/auth-context';
import { useExecutiveTheme } from '@/src/store/theme-context';
import { PickerModal } from '@/src/components/PickerModal';
import { PartnerApplicationsPanel } from '@/components/PartnerApplicationsPanel';
import { VerifiedLeadsPanel } from '@/components/VerifiedLeadsPanel';
import { UnifiedAddUserModal } from '@/components/UnifiedAddUserModal';
import { exportUsersToExcel } from '@/src/utils/excelExport';

const theme = RoleThemes.SUPER_ADMIN;

const tap = () => {
  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
};

const ADMIN_STAFF_SET = new Set(['ADMIN', 'MANAGER', 'OPERATOR', 'TECHNICAL_TRAINER', 'ACCOUNTANT']);
const PARTNER_ROLES_SET = new Set(['AGENT', 'ADVISOR', 'SELLER', 'TRADER']);

function getActiveRoleStrings(u: AdminUser): string[] {
  const roles: string[] = Array.isArray(u.roles) && u.roles.length > 0 ? (u.roles as string[]) : [String(u.role)];
  const deactivated = new Set((u.deactivatedRoles ?? []) as string[]);
  return roles.filter((r) => !deactivated.has(r));
}

function classifyDirectoryBucket(u: AdminUser): 'ADMINS' | 'PARTNERS' | 'CLIENTS' | 'HIDDEN_SUPER_ADMIN' {
  const active = getActiveRoleStrings(u);
  if (u.role === 'SUPER_ADMIN' || active.includes('SUPER_ADMIN')) return 'HIDDEN_SUPER_ADMIN';
  if (active.some((r) => ADMIN_STAFF_SET.has(r))) return 'ADMINS';
  if (active.some((r) => PARTNER_ROLES_SET.has(r))) return 'PARTNERS';
  return 'CLIENTS';
}

type UserGroup = 'CLIENTS' | 'PARTNERS' | 'ADMINS';

const GROUPS: { value: UserGroup; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'ADMINS', label: 'Staff', icon: 'shield-checkmark' },
  { value: 'PARTNERS', label: 'Partners', icon: 'briefcase' },
  { value: 'CLIENTS', label: 'Clients', icon: 'people' },
];

type UserFilter =
  | 'ALL'
  | 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'TECHNICAL_TRAINER' | 'ACCOUNTANT'
  | 'AGENT' | 'SELLER' | 'TRADER' | 'FARM_ADVISOR' | 'GARDEN_ADVISOR'
  | 'CUSTOMER' | 'FARMER' | 'GARDENER' | 'SUPERVISOR' | 'LABOUR';

const FILTERS_BY_GROUP: Record<UserGroup, { value: UserFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[]> = {
  CLIENTS: [
    { value: 'ALL', label: 'All Clients', icon: 'people-outline' },
    { value: 'FARMER', label: 'Farmers', icon: 'leaf-outline' },
    { value: 'GARDENER', label: 'Gardeners', icon: 'flower-outline' },
    { value: 'SUPERVISOR', label: 'Supervisors', icon: 'shield-checkmark-outline' },
    { value: 'LABOUR', label: 'Labour Workers', icon: 'body-outline' },
    { value: 'CUSTOMER', label: 'Customers', icon: 'cart-outline' },
  ],
  PARTNERS: [
    { value: 'ALL', label: 'All Partners', icon: 'briefcase-outline' },
    { value: 'AGENT', label: 'Sales Managers', icon: 'briefcase-outline' },
    { value: 'SELLER', label: 'Sellers', icon: 'storefront-outline' },
    { value: 'FARM_ADVISOR', label: 'Crop Doctors', icon: 'medical-outline' },
    { value: 'GARDEN_ADVISOR', label: 'Garden Advisors', icon: 'sunny-outline' },
    { value: 'TRADER', label: 'Traders & Buyers', icon: 'storefront-outline' },
  ],
  ADMINS: [
    { value: 'ALL', label: 'All Staff', icon: 'shield-outline' },
    { value: 'ADMIN', label: 'Admins', icon: 'shield-checkmark-outline' },
    { value: 'MANAGER', label: 'Managers', icon: 'briefcase-outline' },
    { value: 'OPERATOR', label: 'Operators', icon: 'print-outline' },
    { value: 'TECHNICAL_TRAINER', label: 'Technical Staff', icon: 'school-outline' },
    { value: 'ACCOUNTANT', label: 'Accountants (CA)', icon: 'calculator-outline' },
  ],
};

function filterToBackendRole(filter: UserFilter): Role | undefined {
  if (filter === 'ALL') return undefined;
  if (filter === 'MANAGER') return 'MANAGER' as Role;
  if (filter === 'TECHNICAL_TRAINER') return 'TECHNICAL_TRAINER' as Role;
  if (filter === 'ACCOUNTANT') return 'ACCOUNTANT' as Role;
  if (filter === 'TRADER') return 'TRADER' as Role;
  if (filter === 'SELLER') return 'SELLER' as Role;
  if (filter === 'SUPERVISOR') return 'SUPERVISOR' as Role;
  if (filter === 'LABOUR') return 'LABOUR' as Role;
  return filter === 'FARM_ADVISOR' || filter === 'GARDEN_ADVISOR' ? 'ADVISOR' : (filter as Role);
}

type CustomSubFilter =
  | 'ONLINE'
  | 'RECENTLY_ADDED'
  | 'TODAY'
  | 'THIS_WEEK'
  | 'THIS_MONTH'
  | 'THIS_YEAR'
  | 'CUSTOM_DATE';

const CUSTOM_SUB_FILTERS: { value: CustomSubFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'ONLINE', label: 'Online', icon: 'radio' },
  { value: 'RECENTLY_ADDED', label: 'Recently Added', icon: 'sparkles-outline' },
  { value: 'TODAY', label: 'Today', icon: 'today-outline' },
  { value: 'THIS_WEEK', label: 'This Week', icon: 'calendar-outline' },
  { value: 'THIS_MONTH', label: 'This Month', icon: 'calendar-number-outline' },
  { value: 'THIS_YEAR', label: 'This Year', icon: 'time-outline' },
  { value: 'CUSTOM_DATE', label: 'Custom Date', icon: 'options-outline' },
];

function formatLocalYmd(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function SuperUsersScreen() {
  const { user } = useAuth();
  const { colors, isLight, cardBg, cardBorder, textColor, subTextColor } = useExecutiveTheme();
  const { filter: initialFilter, group: initialGroup } = useLocalSearchParams<{ filter?: UserFilter, group?: UserGroup }>();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const parseSafeGroup = (rawGroup?: any): UserGroup => {
    if (rawGroup === 'ADMINS' || rawGroup === 'PARTNERS' || rawGroup === 'CLIENTS') return rawGroup;
    return 'ADMINS';
  };

  const [group, setGroup] = useState<UserGroup>(() => parseSafeGroup(initialGroup));
  const [filter, setFilter] = useState<UserFilter>(initialFilter || 'ALL');

  useEffect(() => {
    if (initialGroup) setGroup(parseSafeGroup(initialGroup));
    if (initialFilter) setFilter(initialFilter);
  }, [initialGroup, initialFilter]);

  const router = useRouter();
  const [search, setSearch] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [addStaffKind, setAddStaffKind] = useState<'ADMIN' | 'OPERATOR' | 'TECHNICAL_TRAINER' | 'ACCOUNTANT'>('ADMIN');
  const [addAdvisorType, setAddAdvisorType] = useState<AdvisorType>('FARM');
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
    const safeG = parseSafeGroup(g);
    setGroup(safeG);
    const availableFilters = FILTERS_BY_GROUP[safeG] || FILTERS_BY_GROUP.CLIENTS;
    if (availableFilters && availableFilters.length > 0) {
      setFilter(availableFilters[0].value);
    }
  };

  const [statusTab, setStatusTab] = useState<'ACTIVE' | 'DELETED' | 'PARTNER_APPS' | 'VERIFIED_LEADS' | 'CUSTOM'>('ACTIVE');
  const [customSubFilter, setCustomSubFilter] = useState<CustomSubFilter>('ONLINE');
  const [customFromDate, setCustomFromDate] = useState<string>(() => formatLocalYmd(new Date()));
  const [customToDate, setCustomToDate] = useState<string>(() => formatLocalYmd(new Date()));

  const backendRoleFilter = filterToBackendRole(filter);
  const trimmedSearch = search.trim() || undefined;
  const needsFilteredUsersQuery = Boolean(backendRoleFilter || trimmedSearch);

  const { data: allUsersData, isLoading: allUsersLoading } = useUsersList({ limit: 1000 });
  const { data: pendingPartnerApps = [] } = usePartnerApplications('PENDING');
  const { data: waitingVerifiedLeads } = useVerifiedLeads({ status: 'OTP_CONFIRMED' });
  const { data: filteredUsersData, isLoading: filteredUsersLoading } = useUsersList(
    { role: backendRoleFilter, search: trimmedSearch, limit: 1000 },
    { enabled: needsFilteredUsersQuery },
  );
  const data = needsFilteredUsersQuery ? filteredUsersData : allUsersData;
  const isLoading = needsFilteredUsersQuery ? filteredUsersLoading : allUsersLoading;
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();
  const deleteUser = useDeleteUser();

  const allUsersList = allUsersData?.items ?? [];
  const totalActiveUsersCount = allUsersList.filter((u) => !u.deletedAt).length;
  const totalDeletedUsersCount = allUsersList.filter((u) => !!u.deletedAt).length;

  const getSubCategoryCount = (subFilter: UserFilter): number => {
    return allUsersList.filter((u) => {
      if (!!u.deletedAt) return false;
      if (classifyDirectoryBucket(u) !== group) return false;
      const activeRoles = getActiveRoleStrings(u);
      if (subFilter === 'ALL') return true;
      if (subFilter === 'SUPER_ADMIN') return activeRoles.includes('SUPER_ADMIN');
      if (subFilter === 'ADMIN') return activeRoles.includes('ADMIN');
      if (subFilter === 'MANAGER') return activeRoles.includes('MANAGER');
      if (subFilter === 'OPERATOR') return activeRoles.includes('OPERATOR');
      if (subFilter === 'TECHNICAL_TRAINER') return activeRoles.includes('TECHNICAL_TRAINER');
      if (subFilter === 'ACCOUNTANT') return activeRoles.includes('ACCOUNTANT');
      if (subFilter === 'AGENT') return activeRoles.includes('AGENT');
      if (subFilter === 'SELLER') return activeRoles.includes('SELLER');
      if (subFilter === 'TRADER') return activeRoles.includes('TRADER');
      if (subFilter === 'FARM_ADVISOR') return activeRoles.includes('ADVISOR') && u.advisorType !== 'GARDEN';
      if (subFilter === 'GARDEN_ADVISOR') return activeRoles.includes('ADVISOR') && u.advisorType === 'GARDEN';
      if (subFilter === 'CUSTOMER') return activeRoles.includes('CUSTOMER');
      if (subFilter === 'FARMER') return activeRoles.includes('FARMER');
      if (subFilter === 'GARDENER') return activeRoles.includes('GARDENER');
      if (subFilter === 'SUPERVISOR') return activeRoles.includes('SUPERVISOR');
      if (subFilter === 'LABOUR') return activeRoles.includes('LABOUR');
      return false;
    }).length;
  };

  const getGroupCount = (groupKey: UserGroup): number => {
    return allUsersList.filter((u) => {
      if (!!u.deletedAt) return false;
      return classifyDirectoryBucket(u) === groupKey;
    }).length;
  };

  const [blockVerificationTarget, setBlockVerificationTarget] = useState<AdminUser | null>(null);

  const handleBlockUser = (targetUser: AdminUser) => {
    if (targetUser.mobile === '9872066901') {
      const msg = 'Primary Super Admin account 9872066901 cannot be blocked.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Cannot Block', msg);
      return;
    }
    if (targetUser.deletedAt || targetUser.isPermanentlyBlocked || targetUser.name === 'Deleted Account') {
      const msg = 'This account is already blocked or deleted.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Already Blocked', msg);
      return;
    }
    setBlockVerificationTarget(targetUser);
  };

  const currentRoleRawUsers = (data?.items ?? []).filter((u) => {
    if (classifyDirectoryBucket(u) !== group) return false;
    if (filter === 'ALL') return true;
    return filter === 'FARM_ADVISOR' ? u.advisorType !== 'GARDEN' : filter === 'GARDEN_ADVISOR' ? u.advisorType === 'GARDEN' : true;
  });

  const stripDelMobile = (raw: string) =>
    raw.replace(/^DEL_/i, '').replace(/_del_[a-z0-9_]+$/i, '').replace(/_\d{10,}$/i, '');

  const activeMobileSet = new Set<string>();
  for (const activeU of allUsersList) {
    if (activeU.deletedAt) continue;
    const clean = stripDelMobile(activeU.mobile);
    if (clean) activeMobileSet.add(clean);
    const digits10 = clean.replace(/\D/g, '').slice(-10);
    if (digits10.length === 10) activeMobileSet.add(digits10);
  }

  const hasNewActiveAccountOnMobile = (u: AdminUser): boolean => {
    if (!u.deletedAt) return false;
    const clean = stripDelMobile(u.mobile);
    const digits10 = clean.replace(/\D/g, '').slice(-10);
    return activeMobileSet.has(clean) || (digits10.length === 10 && activeMobileSet.has(digits10));
  };

  const filteredUsers = currentRoleRawUsers.filter((u) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const cleanMob = stripDelMobile(u.mobile);
    const location = [u.village, u.district, u.state].filter(Boolean).join(' ').toLowerCase();
    const rolesStr = (Array.isArray(u.roles) ? u.roles.join(' ') : u.role || '').toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.mobile.toLowerCase().includes(q) ||
      cleanMob.toLowerCase().includes(q) ||
      (u.kingId && u.kingId.toLowerCase().includes(q)) ||
      location.includes(q) ||
      rolesStr.includes(q)
    );
  });

  const currentRoleActiveUsers = filteredUsers.filter((u) => !u.deletedAt);

  const allDeletedUsers = allUsersList.filter((u) => {
    if (!u.deletedAt) return false;
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const cleanMob = stripDelMobile(u.mobile);
    const location = [u.village, u.district, u.state].filter(Boolean).join(' ').toLowerCase();
    const rolesStr = (Array.isArray(u.roles) ? u.roles.join(' ') : u.role || '').toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      u.mobile.toLowerCase().includes(q) ||
      cleanMob.toLowerCase().includes(q) ||
      (u.kingId && u.kingId.toLowerCase().includes(q)) ||
      location.includes(q) ||
      rolesStr.includes(q)
    );
  });

  const matchesCustomSubFilter = (u: AdminUser, sub: CustomSubFilter): boolean => {
    if (u.deletedAt || u.isPermanentlyBlocked) return false;
    if (sub === 'ONLINE') return Boolean(u.isOnline);
    const createdMs = new Date(u.createdAt).getTime();
    if (Number.isNaN(createdMs)) return false;
    const now = new Date();
    if (sub === 'RECENTLY_ADDED') {
      return Date.now() - createdMs <= 48 * 60 * 60 * 1000;
    }
    if (sub === 'TODAY') {
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return createdMs >= startOfToday;
    }
    if (sub === 'THIS_WEEK') {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday).getTime();
      return createdMs >= startOfWeek;
    }
    if (sub === 'THIS_MONTH') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return createdMs >= startOfMonth;
    }
    if (sub === 'THIS_YEAR') {
      const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
      return createdMs >= startOfYear;
    }
    // CUSTOM_DATE
    const fromValid = /^\d{4}-\d{2}-\d{2}$/.test(customFromDate.trim());
    const toValid = /^\d{4}-\d{2}-\d{2}$/.test(customToDate.trim());
    const startMs = fromValid ? new Date(`${customFromDate.trim()}T00:00:00`).getTime() : -Infinity;
    const endMs = toValid ? new Date(`${customToDate.trim()}T23:59:59.999`).getTime() : Infinity;
    return createdMs >= startMs && createdMs <= endMs;
  };

  const getCustomSubCount = (sub: CustomSubFilter): number =>
    allUsersList.filter((u) => matchesCustomSubFilter(u, sub)).length;

  const customFilteredUsers = allUsersList
    .filter((u) => {
      if (!matchesCustomSubFilter(u, customSubFilter)) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const cleanMob = stripDelMobile(u.mobile);
      const location = [u.village, u.district, u.state].filter(Boolean).join(' ').toLowerCase();
      const rolesStr = (Array.isArray(u.roles) ? u.roles.join(' ') : u.role || '').toLowerCase();
      return (
        (u.name && u.name.toLowerCase().includes(q)) ||
        u.mobile.toLowerCase().includes(q) ||
        cleanMob.toLowerCase().includes(q) ||
        (u.kingId && u.kingId.toLowerCase().includes(q)) ||
        location.includes(q) ||
        rolesStr.includes(q)
      );
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalOnlineUsersCount = allUsersList.filter((u) => !u.deletedAt && !u.isPermanentlyBlocked && Boolean(u.isOnline)).length;

  const items =
    statusTab === 'CUSTOM'
      ? customFilteredUsers
      : statusTab === 'ACTIVE'
      ? currentRoleActiveUsers
      : allDeletedUsers;

  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  useEffect(() => {
    setPage(1);
  }, [filter, search, statusTab, customSubFilter, customFromDate, customToDate]);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const visibleItems = items.slice((page - 1) * pageSize, page * pageSize);

  const currentCustomSubLabel =
    CUSTOM_SUB_FILTERS.find((c) => c.value === customSubFilter)?.label || 'Custom';

  const currentFilterLabel = filter === 'ALL'
    ? (group === 'CLIENTS' ? 'Clients' : group === 'PARTNERS' ? 'Partners' : 'Staff')
    : Object.values(FILTERS_BY_GROUP).flat().find(f => f.value === filter)?.label || 'Users';

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[
        styles.premiumHero,
        isLight && {
          backgroundColor: '#ffffff',
          borderBottomColor: '#e2e8f0',
        },
      ]}>
        <View style={[styles.premiumHeroContent, isDesktop && { maxWidth: 1280, width: '100%', alignSelf: 'center' }]}>
          {/* Top Row: Executive Title + Subtitle + Action Buttons */}
          <View style={styles.heroHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flexWrap: 'wrap', flex: 1 }}>
              <View style={[styles.titleIconBadge, isLight && { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                <Ionicons name="people" size={22} color={isLight ? '#16a34a' : '#00ff87'} />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Text style={[styles.compactHeroTitle, isLight && { color: '#0f172a' }]} numberOfLines={1}>
                    Users Directory
                  </Text>
                  <View style={[styles.compactCountBadge, isLight && { backgroundColor: 'rgba(22, 163, 74, 0.1)', borderColor: 'rgba(22, 163, 74, 0.3)' }]}>
                    <Text style={[styles.compactCountBadgeText, isLight && { color: '#16a34a' }]}>
                      {items.length} {items.length === 1 ? 'User' : 'Users'}
                    </Text>
                  </View>
                  <View style={[styles.activeFilterPill, isLight && { backgroundColor: '#f1f5f9', borderColor: '#cbd5e1' }]}>
                    <Text style={[styles.activeFilterPillText, isLight && { color: '#475569' }]}>
                      {statusTab === 'PARTNER_APPS'
                        ? 'Partner Approvals & KYC'
                        : statusTab === 'DELETED'
                        ? 'Deleted & Blocked Archive'
                        : statusTab === 'CUSTOM'
                        ? `Custom: ${currentCustomSubLabel}`
                        : `View: ${currentFilterLabel}`}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.heroSubtitle, isLight && { color: '#64748b' }]}>
                  Unified Enterprise Directory • Identity, Verification & Access Governance
                </Text>
              </View>
            </View>

            {/* Quick Actions Strip */}
            <View style={styles.heroActionsRow}>
              <TouchableOpacity
                style={styles.topAddUserBtn}
                activeOpacity={0.85}
                onPress={() => {
                  tap();
                  setIsAddUserModalOpen(true);
                }}
              >
                <Ionicons name="person-add" size={13} color="#ffffff" />
                <Text style={styles.topAddUserBtnText}>+ Add New User</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.compactExportBtn,
                  isLight && { backgroundColor: 'rgba(245, 158, 11, 0.1)', borderColor: 'rgba(245, 158, 11, 0.35)' },
                  statusTab === 'PARTNER_APPS' && { backgroundColor: 'rgba(245, 158, 11, 0.22)', borderColor: '#f59e0b' },
                ]}
                activeOpacity={0.85}
                onPress={() => {
                  tap();
                  setStatusTab(statusTab === 'PARTNER_APPS' ? 'ACTIVE' : 'PARTNER_APPS');
                }}
              >
                <Ionicons name="document-attach" size={13} color="#f59e0b" />
                <Text style={[styles.compactExportBtnText, { color: '#f59e0b' }]}>
                  Partner Approvals ({pendingPartnerApps.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.compactExportBtn, isLight && { backgroundColor: 'rgba(22, 163, 74, 0.08)', borderColor: 'rgba(22, 163, 74, 0.3)' }]}
                activeOpacity={0.85}
                onPress={() => {
                  tap();
                  exportUsersToExcel(items, `${currentFilterLabel}_Users_Export`);
                }}
              >
                <Ionicons name="download-outline" size={13} color={isLight ? '#16a34a' : '#00ff87'} />
                <Text style={[styles.compactExportBtnText, isLight && { color: '#16a34a' }]}>
                  Export Excel ({items.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 5-Card Category Telemetry Bar: 3 User Categories + Deleted + Unread OTP Follow-Ups */}
          <View style={styles.telemetryBarContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.telemetryBarContent}
            >
              {[
                {
                  id: 'STAFF',
                  title: '1. Staff',
                  count: getGroupCount('ADMINS'),
                  icon: 'shield-checkmark' as const,
                  color: '#6366f1',
                  isSelected: statusTab === 'ACTIVE' && group === 'ADMINS',
                  hasUnreadDot: false,
                  action: () => {
                    tap();
                    setStatusTab('ACTIVE');
                    setGroup('ADMINS');
                    setFilter('ALL');
                  },
                },
                {
                  id: 'PARTNERS',
                  title: '2. Partners',
                  count: getGroupCount('PARTNERS'),
                  icon: 'briefcase' as const,
                  color: '#f59e0b',
                  isSelected: statusTab === 'ACTIVE' && group === 'PARTNERS',
                  hasUnreadDot: false,
                  action: () => {
                    tap();
                    setStatusTab('ACTIVE');
                    setGroup('PARTNERS');
                    setFilter('ALL');
                  },
                },
                {
                  id: 'CLIENTS',
                  title: '3. Clients',
                  count: getGroupCount('CLIENTS'),
                  icon: 'people' as const,
                  color: '#16a34a',
                  isSelected: statusTab === 'ACTIVE' && group === 'CLIENTS',
                  hasUnreadDot: false,
                  action: () => {
                    tap();
                    setStatusTab('ACTIVE');
                    setGroup('CLIENTS');
                    setFilter('ALL');
                  },
                },
                {
                  id: 'DELETED',
                  title: '4. Deleted / Blocked',
                  count: totalDeletedUsersCount,
                  icon: 'trash-bin' as const,
                  color: '#ef4444',
                  isSelected: statusTab === 'DELETED',
                  hasUnreadDot: false,
                  action: () => {
                    tap();
                    setStatusTab('DELETED');
                  },
                },
                {
                  id: 'OTP_FOLLOWUPS',
                  title: '5. OTP Follow-Ups (Unread)',
                  count: waitingVerifiedLeads?.counts?.otpConfirmed ?? 0,
                  icon: 'mail-unread' as const,
                  color: '#10b981',
                  isSelected: statusTab === 'VERIFIED_LEADS',
                  hasUnreadDot: (waitingVerifiedLeads?.counts?.otpConfirmed ?? 0) > 0,
                  action: () => {
                    tap();
                    setStatusTab('VERIFIED_LEADS');
                  },
                },
                {
                  id: 'CUSTOM',
                  title: '6. Custom',
                  count: statusTab === 'CUSTOM' ? customFilteredUsers.length : totalOnlineUsersCount,
                  icon: 'funnel' as const,
                  color: '#06b6d4',
                  isSelected: statusTab === 'CUSTOM',
                  hasUnreadDot: totalOnlineUsersCount > 0,
                  action: () => {
                    tap();
                    setStatusTab('CUSTOM');
                  },
                },
              ].map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.telemetryCard,
                    isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' },
                    item.isSelected && (isLight
                      ? { borderColor: item.color, backgroundColor: 'rgba(22, 163, 74, 0.08)', borderWidth: 1.5 }
                      : { borderColor: item.color, backgroundColor: 'rgba(0, 255, 135, 0.1)', borderWidth: 1.5 }),
                  ]}
                  activeOpacity={0.8}
                  onPress={item.action}
                >
                  <View style={[styles.telemetryIconChip, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={15} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.telemetryCount, isLight && { color: '#0f172a' }]}>
                      {item.count.toLocaleString()}
                    </Text>
                    <Text style={[styles.telemetryLabel, isLight && { color: '#64748b' }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                  </View>
                  {item.hasUnreadDot ? (
                    <View style={[styles.telemetryActiveDot, { backgroundColor: '#f59e0b' }]} />
                  ) : item.isSelected ? (
                    <View style={[styles.telemetryActiveDot, { backgroundColor: item.color }]} />
                  ) : null}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Search Bar Only (5 Category Cards above handle all directory views) */}
          <View style={[styles.compactControlBar, isDesktop && styles.compactControlBarDesktop]}>
            <View style={[styles.compactSearchBox, isLight && { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' }]}>
              <Ionicons name="search" size={14} color={isLight ? '#16a34a' : '#00ff87'} style={{ marginRight: 6 }} />
              <TextInput
                style={[styles.compactSearchInput, isLight && { color: '#0f172a' }]}
                placeholder={`Search by name, mobile, King ID, role, or location...`}
                placeholderTextColor={isLight ? '#94a3b8' : 'rgba(148, 163, 184, 0.6)'}
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
          </View>

          {/* Custom Sub-Category Filter Buttons — shown when 6. Custom card is selected */}
          {statusTab === 'CUSTOM' && (
            <View style={{ marginTop: 6, gap: 6 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 6, alignItems: 'center' }}
              >
                {CUSTOM_SUB_FILTERS.map((cf) => {
                  const subCount = getCustomSubCount(cf.value);
                  const isActive = customSubFilter === cf.value;
                  const isOnlineChip = cf.value === 'ONLINE';
                  return (
                    <TouchableOpacity
                      key={cf.value}
                      style={[
                        styles.compactFilterChip,
                        isLight && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                        isActive && (isLight ? { backgroundColor: 'rgba(6, 182, 212, 0.14)', borderColor: '#06b6d4' } : styles.compactFilterChipActive),
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        tap();
                        setCustomSubFilter(cf.value);
                      }}
                    >
                      {isOnlineChip ? (
                        <View
                          style={{
                            width: 7,
                            height: 7,
                            borderRadius: 4,
                            backgroundColor: subCount > 0 ? '#00ff87' : '#64748b',
                          }}
                        />
                      ) : (
                        <Ionicons name={cf.icon} size={12} color={isActive ? (isLight ? '#0891b2' : '#00ff87') : '#94a3b8'} />
                      )}
                      <Text
                        style={[
                          styles.compactFilterChipText,
                          isLight && { color: '#64748b' },
                          isActive && { color: isLight ? '#0891b2' : '#00ff87' },
                        ]}
                      >
                        {cf.label} ({subCount})
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {customSubFilter === 'CUSTOM_DATE' && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 8,
                    paddingVertical: 6,
                    paddingHorizontal: 10,
                    borderRadius: 10,
                    backgroundColor: isLight ? '#f8fafc' : 'rgba(6, 182, 212, 0.08)',
                    borderWidth: 1,
                    borderColor: isLight ? '#cbd5e1' : 'rgba(6, 182, 212, 0.3)',
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: isLight ? '#334155' : '#67e8f9' }}>
                    Created Date Range:
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: isLight ? '#475569' : '#94a3b8' }}>From</Text>
                    {Platform.OS === 'web' ? (
                      <input
                        type="date"
                        value={customFromDate}
                        onChange={(e: any) => setCustomFromDate(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: isLight ? '#ffffff' : '#020d06',
                          color: isLight ? '#0f172a' : '#f8fafc',
                          fontSize: 12,
                        }}
                      />
                    ) : (
                      <TextInput
                        style={[styles.compactSearchInput, { minWidth: 105, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#334155', borderRadius: 6 }]}
                        value={customFromDate}
                        onChangeText={setCustomFromDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#64748b"
                      />
                    )}
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: isLight ? '#475569' : '#94a3b8' }}>To</Text>
                    {Platform.OS === 'web' ? (
                      <input
                        type="date"
                        value={customToDate}
                        onChange={(e: any) => setCustomToDate(e.target.value)}
                        style={{
                          padding: '4px 8px',
                          borderRadius: 6,
                          border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.2)',
                          backgroundColor: isLight ? '#ffffff' : '#020d06',
                          color: isLight ? '#0f172a' : '#f8fafc',
                          fontSize: 12,
                        }}
                      />
                    ) : (
                      <TextInput
                        style={[styles.compactSearchInput, { minWidth: 105, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: '#334155', borderRadius: 6 }]}
                        value={customToDate}
                        onChangeText={setCustomToDate}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#64748b"
                      />
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.compactFilterChip, isLight && { backgroundColor: '#ffffff', borderColor: '#cbd5e1' }]}
                    onPress={() => {
                      tap();
                      const today = formatLocalYmd(new Date());
                      setCustomFromDate(today);
                      setCustomToDate(today);
                    }}
                  >
                    <Ionicons name="refresh" size={11} color={isLight ? '#0891b2' : '#67e8f9'} />
                    <Text style={[styles.compactFilterChipText, { color: isLight ? '#0891b2' : '#67e8f9' }]}>Today</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {/* Role Sub-Filter Chips — shown only for Active users */}
          {statusTab === 'ACTIVE' && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 6 }}
              contentContainerStyle={{ gap: 6, alignItems: 'center' }}
            >
              {(FILTERS_BY_GROUP[group] || FILTERS_BY_GROUP.CLIENTS).map((f) => {
                const subCount = getSubCategoryCount(f.value);
                const isActive = filter === f.value;
                return (
                  <TouchableOpacity
                    key={f.value}
                    style={[
                      styles.compactFilterChip,
                      isLight && { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0' },
                      isActive && (isLight ? { backgroundColor: 'rgba(22, 163, 74, 0.15)', borderColor: '#16a34a' } : styles.compactFilterChipActive),
                    ]}
                    activeOpacity={0.8}
                    onPress={() => {
                      tap();
                      setFilter(f.value);
                    }}
                  >
                    <Ionicons name={f.icon} size={12} color={isActive ? (isLight ? '#16a34a' : '#00ff87') : '#94a3b8'} />
                    <Text
                      style={[
                        styles.compactFilterChipText,
                        isLight && { color: '#64748b' },
                        isActive && { color: isLight ? '#16a34a' : '#00ff87' },
                      ]}
                    >
                      {f.label} ({subCount})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={[styles.premiumList, { backgroundColor: colors.bg }]} showsVerticalScrollIndicator={false}>
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

        {statusTab === 'ACTIVE' && (filter === 'OPERATOR' || filter === 'ACCOUNTANT' || (filter === 'ADMIN' && isSuperAdmin)) && (
          <TouchableOpacity
            style={[styles.addAdvisorBtn, premiumShadow(theme.primary, 'sm')]}
            activeOpacity={0.85}
            onPress={() => {
              setAddStaffKind(filter === 'OPERATOR' ? 'OPERATOR' : filter === 'ACCOUNTANT' ? 'ACCOUNTANT' : 'ADMIN');
              setIsAddStaffOpen(true);
            }}
          >
            <Ionicons name="add-circle" size={16} color="#ffffff" />
            <Text style={styles.addAdvisorBtnText}>Add {filter === 'OPERATOR' ? 'Operator' : filter === 'ACCOUNTANT' ? 'Accountant (CA)' : 'Admin'}</Text>
          </TouchableOpacity>
        )}

        {statusTab === 'ACTIVE' && filter === 'TECHNICAL_TRAINER' && (
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              style={[styles.addAdvisorBtn, { flex: 1 }, premiumShadow(theme.primary, 'sm')]}
              activeOpacity={0.85}
              onPress={() => {
                setAddStaffKind('TECHNICAL_TRAINER');
                setIsAddStaffOpen(true);
              }}
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

        {statusTab === 'VERIFIED_LEADS' ? (
          <VerifiedLeadsPanel />
        ) : statusTab === 'PARTNER_APPS' ? (
          <PartnerApplicationsPanel />
        ) : isLoading ? (
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
                ? 'There are no deleted or blocked user accounts.'
                : search.trim()
                  ? `No accounts matching "${search}".`
                  : statusTab === 'CUSTOM'
                  ? `No users found for "${currentCustomSubLabel}".`
                  : `No active ${currentFilterLabel.toLowerCase()} registered.`}
            </Text>
          </View>
        ) : (
          <>
            <View style={[styles.usersGridContainer, isDesktop && styles.usersGridContainerDesktop]}>
              {visibleItems.map((u) => {
                const isUserOperator = u.role === 'OPERATOR' || (Array.isArray(u.roles) && u.roles.includes('OPERATOR'));
                const isDeletedUser = Boolean(u.deletedAt);
                const isSelfDeletedUser = Boolean(u.isPermanentlyDeleted || u.name === 'Deleted Account' || (!u.isPermanentlyBlocked && isDeletedUser));
                const canRestoreUser = isDeletedUser && !isSelfDeletedUser && !hasNewActiveAccountOnMobile(u);
                return (
                  <View key={u.id} style={[styles.userGridItem, isDesktop && styles.userGridItemDesktop]}>
                    <UserRow
                      user={u}
                      isDesktop={isDesktop}
                      isOperator={isUserOperator}
                      canRestore={canRestoreUser}
                      onDeactivate={() => handleBlockUser(u)}
                      onReactivate={() => {
                        reactivate.mutate(u.id, {
                          onSuccess: () => {
                            const msg = `Account for ${u.name} unblocked successfully and mobile number restored.`;
                            if (Platform.OS === 'web') alert(msg);
                            else Alert.alert('Unblocked', msg);
                          },
                          onError: (err: any) => {
                            const msg = err?.response?.data?.message || err?.message || 'Cannot restore this account.';
                            if (Platform.OS === 'web') alert(msg);
                            else Alert.alert('Restore Blocked', msg);
                          },
                        });
                      }}
                      onEditPermissions={isUserOperator ? () => setPermissionsTarget(u) : undefined}
                      onEditRoles={u.role !== 'SUPER_ADMIN' ? () => setRolesTarget(u) : undefined}
                      onOpenDetail={() => setDetailTargetId(u.id)}
                    />
                  </View>
                );
              })}
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

      <UnifiedAddUserModal
        visible={isAddUserModalOpen}
        isSuperAdmin={isSuperAdmin}
        onClose={() => setIsAddUserModalOpen(false)}
      />

      <AddAdvisorModal
        visible={isAddAdvisorOpen}
        advisorType={addAdvisorType}
        onClose={() => setIsAddAdvisorOpen(false)}
      />

      <AddStaffModal
        visible={isAddStaffOpen}
        kind={addStaffKind}
        onClose={() => setIsAddStaffOpen(false)}
      />

      <OperatorPermissionsModal target={permissionsTarget} onClose={() => setPermissionsTarget(null)} />
      <EditRolesModal target={rolesTarget} onClose={() => setRolesTarget(null)} />
      <UserDetailModal userId={detailTargetId} onClose={() => setDetailTargetId(null)} />
      <BlockUserSecurityModal target={blockVerificationTarget} onClose={() => setBlockVerificationTarget(null)} />
      <AddTrainerModal visible={isAddTrainerOpen} onClose={() => setIsAddTrainerOpen(false)} />
      <TrainerReportsModal visible={isTrainerReportsOpen} onClose={() => setIsTrainerReportsOpen(false)} />
    </View>
  );
}

function AddUserTypePickerModal({
  visible,
  onClose,
  onSelectType,
}: {
  visible: boolean;
  onClose: () => void;
  onSelectType: (type: 'FARMER' | 'DOCTOR' | 'STAFF' | 'TRAINER' | 'ACCOUNTANT') => void;
}) {
  const options = [
    {
      id: 'FARMER' as const,
      title: 'Farmer / Client Profile',
      subtitle: 'Register new farm client, grower or landholder',
      icon: 'leaf' as const,
      color: '#16a34a',
      bgColor: 'rgba(22, 163, 74, 0.12)',
    },
    {
      id: 'DOCTOR' as const,
      title: 'Crop Doctor / Plant Advisor',
      subtitle: 'Onboard certified agronomy expert or consultant',
      icon: 'medical' as const,
      color: '#0284c7',
      bgColor: 'rgba(2, 132, 199, 0.12)',
    },
    {
      id: 'STAFF' as const,
      title: 'Platform Staff / Operator',
      subtitle: 'Create operator, platform manager or admin account',
      icon: 'shield-half' as const,
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.12)',
    },
    {
      id: 'ACCOUNTANT' as const,
      title: 'Accountant (CA / Statutory Audit)',
      subtitle: 'Dedicated accounts login for GSTR-8 TCS, TDS 194-O/H/J & Legal Desk',
      icon: 'calculator' as const,
      color: '#059669',
      bgColor: 'rgba(5, 150, 105, 0.12)',
    },
    {
      id: 'TRAINER' as const,
      title: 'Field Trainer Coordinator',
      subtitle: 'Assign regional agricultural trainer & reports',
      icon: 'school' as const,
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.12)',
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxWidth: 440 }]}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ backgroundColor: 'rgba(22, 163, 74, 0.15)', padding: 6, borderRadius: RADIUS.md }}>
                <Ionicons name="person-add" size={18} color="#16a34a" />
              </View>
              <View>
                <Text style={styles.modalTitle}>Add New User</Text>
                <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 }}>
                  Select account role to onboard
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={{ gap: 8, marginTop: 4 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 12,
                  backgroundColor: '#071f12',
                  borderRadius: RADIUS.lg,
                  borderWidth: 1,
                  borderColor: 'rgba(255, 255, 255, 0.08)',
                }}
                activeOpacity={0.75}
                onPress={() => onSelectType(opt.id)}
              >
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    backgroundColor: opt.bgColor,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={opt.icon} size={20} color={opt.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#f8fafc' }}>{opt.title}</Text>
                  <Text style={{ fontSize: 11, fontFamily: FONT.regular, color: '#94a3b8', marginTop: 2 }} numberOfLines={1}>
                    {opt.subtitle}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#64748b" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

function BlockUserSecurityModal({ target, onClose }: { target: AdminUser | null; onClose: () => void }) {
  const deactivate = useDeactivateUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
  }, [target]);

  if (!target) return null;

  const handleConfirmBlock = async () => {
    setError(null);
    try {
      const res: any = await deactivate.mutateAsync(target.id);
      const msg = res?.message || (res?.wasHardDeleted
        ? `Account for ${target.name} had zero records and was permanently removed from database.`
        : `Account for ${target.name} blocked and mobile number unlinked.`);
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('User Blocked', msg);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Could not block user account.');
    }
  };

  return (
    <Modal visible={!!target} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { borderColor: '#fca5a5', borderWidth: 1.5 }]}>
          <View style={styles.modalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
              <Ionicons name="ban-outline" size={20} color="#dc2626" />
              <Text style={[styles.modalTitle, { color: '#dc2626' }]}>Block User Account</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={{ backgroundColor: '#fef2f2', padding: 12, borderRadius: RADIUS.md, borderWidth: 1, borderColor: '#fecaca', marginVertical: 6 }}>
            <Text style={{ fontSize: 13, fontFamily: FONT.bold, color: '#991b1b' }}>
              Confirm Account Block
            </Text>
            <Text style={{ fontSize: 12, fontFamily: FONT.regular, color: '#7f1d1d', marginTop: 4, lineHeight: 17 }}>
              Are you sure you want to block <Text style={{ fontFamily: FONT.bold }}>{target.name}</Text> ({target.mobile})?
            </Text>
            <Text style={{ fontSize: 11.5, fontFamily: FONT.regular, color: '#991b1b', marginTop: 6, lineHeight: 16 }}>
              • If this user has platform entries (orders, bills, ledger entries), their mobile number will be unlinked &amp; freed, while historical audit records remain safely preserved.{'\n'}
              • If this user has zero entries, the empty account will be permanently removed from the database.
            </Text>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <TouchableOpacity
              style={[styles.submitBtn, { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }]}
              onPress={onClose}
              disabled={deactivate.isPending}
            >
              <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitBtn,
                { flex: 1.4, backgroundColor: '#dc2626' },
              ]}
              disabled={deactivate.isPending}
              onPress={handleConfirmBlock}
            >
              {deactivate.isPending ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>🛑 Block User</Text>
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

              {data.user.isPermanentlyDeleted || data.user.name === 'Deleted Account' ? (
                <View style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.35)', borderRadius: RADIUS.md, padding: 10, marginTop: 6 }}>
                  <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: '#ef4444' }}>
                    Account Permanently Deleted
                  </Text>
                  <Text style={{ fontSize: 11.5, fontFamily: FONT.regular, color: '#94a3b8', marginTop: 2 }}>
                    King ID and linked historical records remain retained for audit and cross-account linking.
                  </Text>
                </View>
              ) : (
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
              )}

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
  const isPartner = activeRoles.includes('AGENT');
  const showPayoutFields = isAdvisor || isPartner;

  // Advisor-only
  const [advisorType, setAdvisorType] = useState<AdvisorType>(user.advisorType === 'GARDEN' ? 'GARDEN' : 'FARM');
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

  // Agent / Advisor payout profile
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
              advisorType,
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

          <Text style={styles.label}>Advisor Domain Specialization</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginVertical: 4 }}>
            <TouchableOpacity
              style={[
                styles.permissionRow,
                { flex: 1, justifyContent: 'center' },
                advisorType === 'FARM' && { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
              ]}
              onPress={() => setAdvisorType('FARM')}
            >
              <Ionicons name={advisorType === 'FARM' ? 'radio-button-on' : 'radio-button-off'} size={18} color={advisorType === 'FARM' ? '#16a34a' : '#94a3b8'} />
              <Text style={[styles.permissionRowText, advisorType === 'FARM' && { color: '#16a34a', fontFamily: FONT.bold }]}>
                🌾 Crop Doctor (Farmers)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.permissionRow,
                { flex: 1, justifyContent: 'center' },
                advisorType === 'GARDEN' && { borderColor: '#ec4899', backgroundColor: '#fdf2f8' },
              ]}
              onPress={() => setAdvisorType('GARDEN')}
            >
              <Ionicons name={advisorType === 'GARDEN' ? 'radio-button-on' : 'radio-button-off'} size={18} color={advisorType === 'GARDEN' ? '#ec4899' : '#94a3b8'} />
              <Text style={[styles.permissionRowText, advisorType === 'GARDEN' && { color: '#ec4899', fontFamily: FONT.bold }]}>
                🌸 Garden Advisor (Gardeners)
              </Text>
            </TouchableOpacity>
          </View>

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
  ADVISOR: 'Crop Doctor / Advisor',
  AGENT: 'Sales Manager',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super Admin',
  OPERATOR: 'Operator',
  LABOUR: 'Labour Worker',
  TECHNICAL_TRAINER: 'Technical Trainer',
  ACCOUNTANT: 'Accountant (CA)',
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
  const [ruleNote, setRuleNote] = useState<string | null>(null);

  const FARM_STAFF_ROLES: Role[] = ['SUPERVISOR' as Role, 'LABOUR' as Role];
  const OPERATIONAL_NON_STAFF_ROLES: Role[] = [
    'FARMER',
    'GARDENER',
    'AGENT',
    'SELLER' as Role,
    'ADVISOR',
    'TRADER' as Role,
  ];

  const isTargetStaff = Boolean(
    target &&
      ['SUPER_ADMIN', 'ADMIN', 'OPERATOR', 'TECHNICAL_TRAINER', 'MANAGER', 'ACCOUNTANT'].some(
        (r) => target.role === r || (target.roles ?? []).includes(r as Role)
      )
  );

  useEffect(() => {
    if (!target) return;
    setError(null);
    setRuleNote(null);
    let active = (target.roles ?? [target.role]).filter((r: any) => !(target.deactivatedRoles ?? []).includes(r));
    if (isTargetStaff) {
      active = active.filter((r) => !['FARMER', 'GARDENER', 'SUPERVISOR', 'LABOUR'].includes(r));
    }
    setSelected(active.includes('CUSTOMER') ? active : [...active, 'CUSTOMER']);
    setAdvisorType(target.advisorType ?? null);
  }, [target, isTargetStaff]);

  if (!target) return null;

  const hasFarmStaffSelected = selected.some((r) => FARM_STAFF_ROLES.includes(r));
  const hasOperationalSelected = selected.some((r) => OPERATIONAL_NON_STAFF_ROLES.includes(r));

  const toggle = (role: Role) => {
    if (isTargetStaff) {
      setError('Admin Panel staff accounts are single-role only and cannot be combined here.');
      return;
    }
    tap();
    setError(null);

    if (FARM_STAFF_ROLES.includes(role)) {
      setSelected((prev) => {
        const exists = prev.includes(role);
        if (exists) {
          setRuleNote(null);
          return prev.filter((r) => r !== role);
        }
        setAdvisorType(null);
        setRuleNote(
          `${ROLE_LABELS[role]} is a single-role Farmer Staff account — Farmer, Gardener, Agent, Seller, Advisor, and Trader roles have been cleared automatically.`
        );
        return ['CUSTOMER', role];
      });
      return;
    }

    setRuleNote(null);
    setSelected((prev) => {
      const exists = prev.includes(role);
      const withoutFarmStaff = prev.filter((r) => !FARM_STAFF_ROLES.includes(r));
      if (exists) {
        return withoutFarmStaff.filter((r) => r !== role);
      }
      // Mutually exclusive: User can only have either Farmer OR Gardener
      if (role === 'FARMER') {
        return [...withoutFarmStaff.filter((r) => r !== 'GARDENER'), 'FARMER'];
      }
      if (role === 'GARDENER') {
        return [...withoutFarmStaff.filter((r) => r !== 'FARMER'), 'GARDENER'];
      }
      return [...withoutFarmStaff, role];
    });
  };

  const toggleAdvisorType = (type: AdvisorType) => {
    if (isTargetStaff) {
      setError('Admin Panel staff accounts are single-role only and cannot be combined here.');
      return;
    }
    tap();
    setError(null);
    setRuleNote(null);
    if (advisorType === type) {
      setAdvisorType(null);
      setSelected((prev) => prev.filter((r) => r !== 'ADVISOR'));
    } else {
      setAdvisorType(type);
      setSelected((prev) => {
        const withoutFarmStaff = prev.filter((r) => !FARM_STAFF_ROLES.includes(r));
        return withoutFarmStaff.includes('ADVISOR') ? withoutFarmStaff : [...withoutFarmStaff, 'ADVISOR'];
      });
    }
  };

  const visibleSelectedForSummary = selected.filter(
    (r) => r !== 'CUSTOMER' || selected.every((x) => x === 'CUSTOMER')
  );
  const roleLabels = visibleSelectedForSummary.map((r) =>
    r === 'ADVISOR' ? (advisorType === 'GARDEN' ? 'Garden Advisor' : 'Farm Advisor') : ROLE_LABELS[r]
  );

  const handleSave = () => {
    setError(null);
    if (isTargetStaff) {
      setError('Admin Panel staff accounts are strictly single-role only.');
      return;
    }
    const message = `Confirm role updates for ${target.name}:\n\n${roleLabels.join(', ') || 'Customer (Buyer Only)'}\n\nDo you want to save these changes?`;
    const doSave = async () => {
      try {
        const assignableSelected = Array.from(
          new Set([
            ...selected.filter((r) => ASSIGNABLE_CHECKBOX_ROLES.includes(r)),
            'CUSTOMER' as Role,
          ])
        );
        await updateActiveRoles.mutateAsync({ id: target.id, activeRoles: assignableSelected });
        if (assignableSelected.includes('ADVISOR') && advisorType) {
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

  const allRoleGroups: {
    title: string;
    subtitle?: string;
    items: {
      key: string;
      label: string;
      isChecked: boolean;
      isLocked: boolean;
      isIncompatible?: boolean;
      wasEverGranted: boolean;
      onPress: () => void;
    }[];
  }[] = [
    {
      title: 'Clients (User Login)',
      subtitle: 'Pick Farmer OR Gardener (never both)',
      items: [
        {
          key: 'FARMER',
          label: 'Farmer',
          isChecked: selected.includes('FARMER'),
          isLocked: isTargetStaff,
          isIncompatible: hasFarmStaffSelected || selected.includes('GARDENER'),
          wasEverGranted: (target.roles ?? []).includes('FARMER'),
          onPress: () => toggle('FARMER'),
        },
        {
          key: 'GARDENER',
          label: 'Gardener',
          isChecked: selected.includes('GARDENER'),
          isLocked: isTargetStaff,
          isIncompatible: hasFarmStaffSelected || selected.includes('FARMER'),
          wasEverGranted: (target.roles ?? []).includes('GARDENER'),
          onPress: () => toggle('GARDENER'),
        },
      ],
    },
    {
      title: 'Farmer Staff (Single Role Only)',
      subtitle: 'Hired staff — cannot mix with Farmer, Agent, Seller, or Advisor',
      items: [
        {
          key: 'SUPERVISOR',
          label: 'Supervisor',
          isChecked: selected.includes('SUPERVISOR' as Role),
          isLocked: isTargetStaff,
          isIncompatible: hasOperationalSelected || selected.includes('LABOUR' as Role),
          wasEverGranted: (target.roles ?? []).includes('SUPERVISOR' as Role),
          onPress: () => toggle('SUPERVISOR' as Role),
        },
        {
          key: 'LABOUR',
          label: 'Labour Worker',
          isChecked: selected.includes('LABOUR' as Role),
          isLocked: isTargetStaff,
          isIncompatible: hasOperationalSelected || selected.includes('SUPERVISOR' as Role),
          wasEverGranted: (target.roles ?? []).includes('LABOUR' as Role),
          onPress: () => toggle('LABOUR' as Role),
        },
      ],
    },
    {
      title: 'Partners (Seller, Doctor & Sales Mgr)',
      subtitle: 'Can combine with Farmer / Gardener on one number',
      items: [
        {
          key: 'AGENT',
          label: 'Sales Manager',
          isChecked: selected.includes('AGENT'),
          isLocked: isTargetStaff,
          isIncompatible: hasFarmStaffSelected,
          wasEverGranted: (target.roles ?? []).includes('AGENT'),
          onPress: () => toggle('AGENT'),
        },
        {
          key: 'SELLER',
          label: 'Seller Store',
          isChecked: selected.includes('SELLER' as Role),
          isLocked: isTargetStaff,
          isIncompatible: hasFarmStaffSelected,
          wasEverGranted: (target.roles ?? []).includes('SELLER' as Role),
          onPress: () => toggle('SELLER' as Role),
        },
        {
          key: 'FARM_ADVISOR',
          label: 'Farm Advisor',
          isChecked: advisorType === 'FARM' && selected.includes('ADVISOR'),
          isLocked: isTargetStaff,
          isIncompatible: hasFarmStaffSelected,
          wasEverGranted: (target.roles ?? []).includes('ADVISOR') && target.advisorType === 'FARM',
          onPress: () => toggleAdvisorType('FARM'),
        },
        {
          key: 'GARDEN_ADVISOR',
          label: 'Garden Advisor',
          isChecked: advisorType === 'GARDEN' && selected.includes('ADVISOR'),
          isLocked: isTargetStaff,
          isIncompatible: hasFarmStaffSelected,
          wasEverGranted: (target.roles ?? []).includes('ADVISOR') && target.advisorType === 'GARDEN',
          onPress: () => toggleAdvisorType('GARDEN'),
        },
        {
          key: 'TRADER',
          label: 'Trader & Buyer',
          isChecked: selected.includes('TRADER' as Role),
          isLocked: isTargetStaff,
          isIncompatible: hasFarmStaffSelected,
          wasEverGranted: (target.roles ?? []).includes('TRADER' as Role),
          onPress: () => toggle('TRADER' as Role),
        },
      ],
    },
  ];

  // If target is Admin Staff, hide all operational role checkboxes completely
  const ROLE_GROUPS = isTargetStaff ? [] : allRoleGroups;

  return (
    <Modal visible={!!target} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { maxWidth: 540, maxHeight: '90%', padding: 16 }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeaderRow, { marginBottom: 8, paddingBottom: 8 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={styles.modalTitle}>{target.name}'s Roles</Text>
              <View style={{ backgroundColor: 'rgba(0, 255, 135, 0.12)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12 }}>
                <Text style={{ color: '#00ff87', fontSize: 11, fontFamily: FONT.bold }}>{roleLabels.length} Active</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={[styles.helperText, { marginBottom: 10, fontSize: 11 }]}>
            Unchecking a role deactivates it cleanly (history is preserved). Buyer access stays active automatically.
          </Text>

          {isTargetStaff ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(56, 189, 248, 0.1)', borderWidth: 1, borderColor: 'rgba(56, 189, 248, 0.25)', paddingHorizontal: 12, paddingVertical: 10, borderRadius: RADIUS.md, marginBottom: 10 }}>
              <Ionicons name="shield-checkmark" size={16} color="#38bdf8" />
              <Text style={{ fontSize: 11.5, fontFamily: FONT.medium, color: '#38bdf8', flex: 1, lineHeight: 16 }}>
                Admin Panel Staff Account ({ROLE_LABELS[target.role] || target.role}): Super Admin, Admin, Manager, Operator, Accountant, and Technical Staff are strictly single-role Admin accounts created by Admin and cannot hold Farmer, Partner, Sales Manager, or Seller roles.
              </Text>
            </View>
          ) : null}

          {!isTargetStaff && (hasFarmStaffSelected || ruleNote) ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245, 158, 11, 0.12)', borderWidth: 1, borderColor: 'rgba(245, 158, 11, 0.30)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: RADIUS.md, marginBottom: 10 }}>
              <Ionicons name="lock-closed" size={14} color="#fbbf24" />
              <Text style={{ fontSize: 11, fontFamily: FONT.medium, color: '#fcd34d', flex: 1, lineHeight: 15 }}>
                {ruleNote || 'Farmer Staff Rule Active: Supervisor and Labour Worker are dedicated single-role accounts. Tapping any non-staff role automatically clears the staff role.'}
              </Text>
            </View>
          ) : null}

          {/* Compact Scrollable Roles Grid */}
          {ROLE_GROUPS.length > 0 ? (
            <ScrollView
              style={{ maxHeight: 360, flexGrow: 0 }}
              contentContainerStyle={{ gap: 10, paddingBottom: 4 }}
              showsVerticalScrollIndicator={true}
            >
              {ROLE_GROUPS.map((grp) => (
                <View key={grp.title} style={{ gap: 6 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 4 }}>
                    <Text style={{ fontSize: 10, fontFamily: FONT.extraBold, color: '#64748b', letterSpacing: 0.8, textTransform: 'uppercase' }}>
                      {grp.title}
                    </Text>
                    {grp.subtitle ? (
                      <Text style={{ fontSize: 9.5, fontFamily: FONT.medium, color: '#94a3b8' }}>
                        {grp.subtitle}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {grp.items.map((item) => (
                      <TouchableOpacity
                        key={item.key}
                        style={[
                          styles.roleGridItem,
                          item.isChecked && styles.roleGridItemChecked,
                          item.isIncompatible && !item.isChecked && { opacity: 0.55 },
                          item.isLocked && { opacity: 0.7 },
                        ]}
                        activeOpacity={item.isLocked ? 1 : 0.75}
                        disabled={item.isLocked}
                        onPress={item.onPress}
                      >
                        <Ionicons
                          name={item.isChecked ? 'checkbox' : 'square-outline'}
                          size={16}
                          color={item.isChecked ? '#00ff87' : '#64748b'}
                        />
                        <Text
                          style={[
                            styles.roleGridItemText,
                            item.isChecked && { color: '#ffffff', fontFamily: FONT.bold },
                          ]}
                          numberOfLines={1}
                        >
                          {item.label}
                        </Text>
                        {item.isLocked ? (
                          <Text style={styles.lockedHint}>Locked</Text>
                        ) : item.wasEverGranted && !item.isChecked ? (
                          <Text style={styles.deactivatedHint}>Off</Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : null}

          {error ? <Text style={[styles.errorText, { marginTop: 6 }]}>{error}</Text> : null}

          {/* Pinned Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              style={[styles.cancelBtn, { flex: 1 }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelBtnText}>{isTargetStaff ? 'Close' : 'Cancel'}</Text>
            </TouchableOpacity>

            {!isTargetStaff ? (
              <TouchableOpacity
                style={[styles.submitBtn, { flex: 2, marginTop: 0 }]}
                disabled={updateActiveRoles.isPending}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                {updateActiveRoles.isPending ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Roles</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getRoleTheme = (role: string) => {
  switch (role) {
    case 'SUPER_ADMIN':
      return { border: '#e11d48', bg: '#fff1f2', text: '#e11d48', darkBg: 'rgba(225, 29, 72, 0.15)', darkBorder: '#e11d48', darkText: '#fb7185' };
    case 'ADMIN':
      return { border: '#4f46e5', bg: '#eef2ff', text: '#4f46e5', darkBg: 'rgba(79, 70, 229, 0.15)', darkBorder: '#4f46e5', darkText: '#818cf8' };
    case 'OPERATOR':
      return { border: '#0891b2', bg: '#ecfeff', text: '#0891b2', darkBg: 'rgba(8, 145, 178, 0.15)', darkBorder: '#0891b2', darkText: '#38bdf8' };
    case 'TECHNICAL_TRAINER':
      return { border: '#ea580c', bg: '#fff7ed', text: '#ea580c', darkBg: 'rgba(234, 88, 12, 0.15)', darkBorder: '#ea580c', darkText: '#fb923c' };
    case 'ACCOUNTANT':
      return { border: '#059669', bg: '#ecfdf5', text: '#059669', darkBg: 'rgba(5, 150, 105, 0.15)', darkBorder: '#059669', darkText: '#34d399' };
    case 'ADVISOR':
    case 'FARM_ADVISOR':
      return { border: '#0284c7', bg: '#f0f9ff', text: '#0284c7', darkBg: 'rgba(2, 132, 199, 0.15)', darkBorder: '#0284c7', darkText: '#38bdf8' };
    case 'GARDEN_ADVISOR':
      return { border: '#0d9488', bg: '#f0fdfa', text: '#0d9488', darkBg: 'rgba(13, 148, 136, 0.15)', darkBorder: '#0d9488', darkText: '#2dd4bf' };
    case 'AGENT':
      return { border: '#7c3aed', bg: '#faf5ff', text: '#7c3aed', darkBg: 'rgba(124, 58, 237, 0.15)', darkBorder: '#7c3aed', darkText: '#c084fc' };
    case 'TRADER':
      return { border: '#d97706', bg: '#fffbeb', text: '#d97706', darkBg: 'rgba(217, 119, 6, 0.15)', darkBorder: '#d97706', darkText: '#fbbf24' };
    case 'FARMER':
      return { border: '#16a34a', bg: '#f0fdf4', text: '#16a34a', darkBg: 'rgba(22, 163, 74, 0.15)', darkBorder: '#16a34a', darkText: '#4ade80' };
    case 'GARDENER':
      return { border: '#c026d3', bg: '#fdf4ff', text: '#c026d3', darkBg: 'rgba(192, 38, 211, 0.15)', darkBorder: '#c026d3', darkText: '#e879f9' };
    case 'CUSTOMER':
    default:
      return { border: '#64748b', bg: '#f8fafc', text: '#475569', darkBg: 'rgba(71, 85, 105, 0.15)', darkBorder: '#64748b', darkText: '#94a3b8' };
  }
};

function UserRow({
  user,
  isDesktop,
  isOperator,
  canRestore = true,
  onDeactivate,
  onReactivate,
  onEditPermissions,
  onEditRoles,
  onOpenDetail,
}: {
  user: AdminUser;
  isDesktop?: boolean;
  isOperator?: boolean;
  canRestore?: boolean;
  onDeactivate: () => void;
  onReactivate: () => void;
  onEditPermissions?: () => void;
  onEditRoles?: () => void;
  onOpenDetail?: () => void;
}) {
  const { isLight } = useExecutiveTheme();
  const isBlocked = Boolean(user.isPermanentlyBlocked);
  const isDeactivated = Boolean(user.deletedAt) || isBlocked;
  const isSelfDeleted = Boolean(user.isPermanentlyDeleted || user.name === 'Deleted Account' || (!isBlocked && Boolean(user.deletedAt)));
  const isOnline = !isDeactivated && Boolean(user.isOnline);
  const isPrimarySuperAdmin = user.mobile === '9872066901';
  const initials = (user.name ?? '').trim().split(/\s+/).slice(0, 2).map((p: any) => p[0] ?? '').join('').toUpperCase() || '?';
  const activeAssignedRoles = Array.from(
    new Set(
      isDeactivated
        ? [user.role, ...(user.roles ?? [])].filter(Boolean)
        : [
            user.role,
            ...(user.roles ?? []).filter((r: any) => !(user.deactivatedRoles ?? []).includes(r)),
          ],
    ),
  );

  const locationStr = [user.village, user.district, user.state].filter(Boolean).join(', ');
  const joinedDateStr = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const deletedDateStr = user.deletedAt ? new Date(user.deletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  const cleanMobile = user.mobile.replace(/^DEL_/i, '').replace(/_del_[a-z0-9_]+$/i, '').replace(/_\d{10,}$/i, '');
  const displayMobile = isDeactivated ? user.mobile : cleanMobile;

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
    <View style={[
      styles.userCard,
      premiumShadow('#0f172a', 'sm'),
      isLight && {
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0',
      },
      isOnline && {
        borderColor: isLight ? 'rgba(22, 163, 74, 0.5)' : 'rgba(0, 255, 135, 0.45)',
      },
      isDeactivated && styles.userCardDeactivated,
    ]}>
      {/* 1. Compact Header Row: Avatar + Identity + Status + Quick Actions */}
      <View style={styles.cardHeaderRowCompact}>
        {/* Compact Avatar with Status Dot */}
        <TouchableOpacity
          style={styles.avatarWrapCompact}
          activeOpacity={0.8}
          onPress={onOpenDetail}
          disabled={!onOpenDetail}
        >
          <View style={[
            styles.userAvatarCompact,
            { borderColor: isDeactivated ? '#ef4444' : (isLight ? getRoleTheme(user.role).border : getRoleTheme(user.role).darkBorder) },
            isDeactivated && styles.userAvatarDeactivated,
          ]}>
            {user.photoUrl ? (
              <Image source={{ uri: user.photoUrl }} style={styles.userAvatarImageCompact} resizeMode="cover" />
            ) : (
              <Text style={[
                styles.userAvatarTextCompact,
                { color: isDeactivated ? '#ef4444' : (isLight ? getRoleTheme(user.role).text : getRoleTheme(user.role).darkText) },
              ]}>{initials}</Text>
            )}
          </View>
          <View
            style={[
              styles.statusDotCompact,
              isDeactivated
                ? styles.statusDotOffline
                : isOnline
                ? styles.statusDotOnline
                : { backgroundColor: '#64748b' },
            ]}
          />
        </TouchableOpacity>

        {/* Name + King ID + Online/Status */}
        <TouchableOpacity
          style={{ flex: 1, flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}
          activeOpacity={0.8}
          onPress={onOpenDetail}
          disabled={!onOpenDetail}
        >
          <Text style={[styles.userNameCompact, isLight && { color: '#0f172a' }, isDeactivated && styles.userNameDeactivated]} numberOfLines={1}>
            {user.name === 'Deleted Account' ? `Deleted (${user.kingId || cleanMobile})` : user.name}
          </Text>

          {user.kingId ? (
            <TouchableOpacity
              style={[
                styles.kingIdChipCompact,
                isLight && { backgroundColor: '#f1f5f9', borderColor: 'rgba(22, 163, 74, 0.3)' },
                isOnline && {
                  borderColor: isLight ? '#16a34a' : '#00ff87',
                  backgroundColor: isLight ? 'rgba(22, 163, 74, 0.12)' : 'rgba(0, 255, 135, 0.14)',
                },
              ]}
              onPress={() => copyToClipboard(user.kingId!, 'King ID')}
              activeOpacity={0.7}
            >
              {isOnline ? (
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isLight ? '#16a34a' : '#00ff87' }} />
              ) : (
                <Ionicons name="key" size={9} color={isLight ? '#16a34a' : '#00ff87'} />
              )}
              <Text style={[styles.kingIdChipTextCompact, isLight && { color: '#16a34a' }]}>{user.kingId}</Text>
              <Ionicons name="copy-outline" size={9} color={isLight ? '#16a34a' : '#00ff87'} />
            </TouchableOpacity>
          ) : null}

          {isDeactivated ? (
            <View style={styles.deactivatedBadgeCompact}>
              <Ionicons name={isBlocked ? 'ban' : 'trash'} size={9} color="#ef4444" />
              <Text style={styles.deactivatedBadgeTextCompact}>{isBlocked ? 'Blocked' : 'Deleted'}</Text>
            </View>
          ) : isOnline ? (
            <View
              style={[
                styles.activePillBadgeCompact,
                {
                  backgroundColor: isLight ? 'rgba(22, 163, 74, 0.14)' : 'rgba(0, 255, 135, 0.16)',
                  borderColor: isLight ? '#16a34a' : '#00ff87',
                  borderWidth: 1,
                },
              ]}
            >
              <View style={[styles.activePillDotCompact, { backgroundColor: isLight ? '#16a34a' : '#00ff87' }]} />
              <Text style={[styles.activePillTextCompact, { color: isLight ? '#15803d' : '#00ff87' }]}>Online</Text>
            </View>
          ) : (
            <View
              style={[
                styles.activePillBadgeCompact,
                {
                  backgroundColor: isLight ? '#f1f5f9' : 'rgba(100, 116, 139, 0.14)',
                  borderColor: isLight ? '#cbd5e1' : 'rgba(148, 163, 184, 0.25)',
                },
              ]}
            >
              <View style={[styles.activePillDotCompact, { backgroundColor: '#64748b' }]} />
              <Text style={[styles.activePillTextCompact, { color: isLight ? '#475569' : '#94a3b8' }]}>Active</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Compact Right-Side Action Pills */}
        <View style={styles.compactActionsRow}>
          {onOpenDetail ? (
            <TouchableOpacity
              style={[styles.actionBtnCompact, styles.actionBtnSecondary, isLight && { backgroundColor: '#f1f5f9' }]}
              activeOpacity={0.8}
              onPress={onOpenDetail}
            >
              <Ionicons name="eye-outline" size={12} color={isLight ? '#475569' : '#94a3b8'} />
              <Text style={[styles.actionBtnTextCompact, { color: isLight ? '#334155' : '#cbd5e1' }]}>Details</Text>
            </TouchableOpacity>
          ) : null}

          {!isDeactivated && onEditRoles ? (
            <TouchableOpacity
              style={[styles.actionBtnCompact, styles.actionBtnIndigo, isLight && { backgroundColor: 'rgba(99, 102, 241, 0.08)' }]}
              activeOpacity={0.8}
              onPress={onEditRoles}
            >
              <Ionicons name="shield-outline" size={12} color={isLight ? '#4f46e5' : '#a5b4fc'} />
              <Text style={[styles.actionBtnTextCompact, { color: isLight ? '#4f46e5' : '#a5b4fc' }]}>Role</Text>
            </TouchableOpacity>
          ) : null}

          {!isDeactivated && isOperator && onEditPermissions ? (
            <TouchableOpacity
              style={[styles.actionBtnCompact, styles.actionBtnBlue]}
              activeOpacity={0.8}
              onPress={onEditPermissions}
            >
              <Ionicons name="options-outline" size={12} color="#60a5fa" />
              <Text style={[styles.actionBtnTextCompact, { color: '#60a5fa' }]}>Perms</Text>
            </TouchableOpacity>
          ) : null}

          {isDeactivated ? (
            isSelfDeleted ? (
              <View
                style={[
                  styles.actionBtnCompact,
                  { backgroundColor: isLight ? '#f1f5f9' : 'rgba(100, 116, 139, 0.14)', borderColor: isLight ? '#cbd5e1' : 'rgba(100, 116, 139, 0.35)' },
                ]}
              >
                <Ionicons name="archive-outline" size={12} color={isLight ? '#64748b' : '#94a3b8'} />
                <Text style={[styles.actionBtnTextCompact, { color: isLight ? '#64748b' : '#94a3b8' }]}>
                  Self-Deleted (Audit)
                </Text>
              </View>
            ) : canRestore ? (
              <TouchableOpacity
                style={[styles.actionBtnCompact, styles.actionBtnRestore]}
                activeOpacity={0.8}
                onPress={onReactivate}
              >
                <Ionicons name="lock-open-outline" size={12} color="#00ff87" />
                <Text style={[styles.actionBtnTextCompact, { color: '#00ff87' }]}>
                  Unblock
                </Text>
              </TouchableOpacity>
            ) : (
              <View
                style={[
                  styles.actionBtnCompact,
                  { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.35)' },
                ]}
              >
                <Ionicons name="ban-outline" size={12} color="#f87171" />
                <Text style={[styles.actionBtnTextCompact, { color: '#f87171' }]}>Mobile Reused</Text>
              </View>
            )
          ) : !isPrimarySuperAdmin ? (
            <TouchableOpacity
              style={[styles.actionBtnCompact, styles.actionBtnDeactivate]}
              activeOpacity={0.8}
              onPress={onDeactivate}
            >
              <Ionicons name="ban-outline" size={12} color="#f87171" />
              <Text style={[styles.actionBtnTextCompact, { color: '#f87171' }]}>Block</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* 2. Compact Info Strip: Contact + Location + Roles + Joined */}
      <View style={[styles.cardBodyCompact, isLight && { borderTopColor: '#f1f5f9' }]}>
        {/* Mobile Number Chip */}
        <TouchableOpacity
          style={[styles.mobileChipCompact, isLight && { backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }]}
          onPress={() => copyToClipboard(cleanMobile, 'Mobile Number')}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={11} color={isLight ? '#16a34a' : '#10b981'} />
          <Text style={[styles.mobileChipTextCompact, isLight && { color: '#0f172a' }]}>{displayMobile}</Text>
          <Ionicons name="copy-outline" size={9} color="#64748b" />
        </TouchableOpacity>

        {/* Location (if any) */}
        {locationStr ? (
          <View style={styles.infoItemRowCompact}>
            <Ionicons name="location-outline" size={11} color="#64748b" />
            <Text style={[styles.infoItemTextCompact, isLight && { color: '#475569' }]} numberOfLines={1}>{locationStr}</Text>
          </View>
        ) : null}

        {/* Role Tags */}
        <View style={styles.rolesRowCompact}>
          {activeAssignedRoles.map((r) => {
            const rTheme = getRoleTheme(r);
            return (
              <View
                key={r}
                style={[
                  styles.roleBadgeCompact,
                  {
                    backgroundColor: isDeactivated ? 'rgba(239, 68, 68, 0.08)' : (isLight ? rTheme.bg : rTheme.darkBg),
                    borderColor: isDeactivated ? 'rgba(239, 68, 68, 0.3)' : (isLight ? rTheme.border : rTheme.darkBorder),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.roleBadgeTextCompact,
                    {
                      color: isDeactivated ? '#f87171' : (isLight ? rTheme.text : rTheme.darkText),
                    },
                  ]}
                >
                  {r.replace('_', ' ')}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Joined Date */}
        {joinedDateStr ? (
          <View style={styles.joinedBadgeCompact}>
            <Ionicons name="calendar-outline" size={10} color="#64748b" />
            <Text style={styles.joinedBadgeTextCompact}>{joinedDateStr}</Text>
          </View>
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

function AddStaffModal({ visible, kind, onClose }: { visible: boolean; kind: 'OPERATOR' | 'ADMIN' | 'TECHNICAL_TRAINER' | 'ACCOUNTANT'; onClose: () => void }) {
  const createOperator = useCreateOperator();
  const createAdmin = useCreateAdmin();
  const createTrainer = useCreateTrainer();
  const createAccountant = useCreateAccountant();
  const createStaff =
    kind === 'OPERATOR'
      ? createOperator
      : kind === 'ADMIN'
        ? createAdmin
        : kind === 'ACCOUNTANT'
          ? createAccountant
          : createTrainer;
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

  const label =
    kind === 'OPERATOR'
      ? 'Operator'
      : kind === 'ADMIN'
        ? 'Admin'
        : kind === 'ACCOUNTANT'
          ? 'Accountant (CA)'
          : 'Technical Trainer';

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
  titleIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#071f12',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroSubtitle: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    marginTop: 2,
  },
  activeFilterPill: {
    backgroundColor: '#071f12',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 1.5,
    borderRadius: RADIUS.pill,
  },
  activeFilterPillText: {
    color: '#cbd5e1',
    fontSize: 10.5,
    fontFamily: FONT.semiBold,
  },
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  telemetryBarContainer: {
    marginVertical: 8,
  },
  telemetryBarContent: {
    gap: 8,
    paddingVertical: 2,
  },
  telemetryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#04180d',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    minWidth: 130,
    position: 'relative',
  },
  telemetryIconChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  telemetryCount: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  telemetryLabel: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  telemetryActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
    top: 6,
    right: 6,
  },

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
  topAddUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: RADIUS.pill,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  topAddUserBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
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
    paddingBottom: Platform.OS === 'web' ? 24 : 32,
    gap: 14,
    backgroundColor: '#020d06',
  },
  usersGridContainer: {
    flexDirection: 'column',
    gap: 14,
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
    borderRadius: 14,
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
  cardHeaderRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  avatarWrapCompact: {
    position: 'relative',
  },
  userAvatarCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 255, 135, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
  },
  userAvatarImageCompact: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  userAvatarTextCompact: {
    fontSize: 12,
    fontFamily: FONT.extraBold,
    color: '#00ff87',
  },
  statusDotCompact: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#04180d',
  },
  userNameCompact: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#f8fafc',
    letterSpacing: -0.2,
  },
  kingIdChipCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#020d06',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  kingIdChipTextCompact: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
    letterSpacing: 0.3,
  },
  activePillBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 255, 135, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.3)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  activePillDotCompact: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#00ff87',
  },
  activePillTextCompact: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  deactivatedBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.pill,
  },
  deactivatedBadgeTextCompact: {
    fontSize: 9,
    fontFamily: FONT.bold,
    color: '#f87171',
  },
  compactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  actionBtnCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 7,
    borderWidth: 1,
  },
  actionBtnTextCompact: {
    fontSize: 10,
    fontFamily: FONT.bold,
  },
  cardBodyCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  mobileChipCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#020d06',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mobileChipTextCompact: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#cbd5e1',
  },
  infoItemRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoItemTextCompact: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#94a3b8',
  },
  rolesRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  roleBadgeCompact: {
    backgroundColor: 'rgba(0, 255, 135, 0.08)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 135, 0.25)',
  },
  roleBadgeTextCompact: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#00ff87',
  },
  joinedBadgeCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginLeft: 'auto',
  },
  joinedBadgeTextCompact: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
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
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    flexWrap: 'wrap',
  },
  actionBtn: {
    flex: 1,
    minWidth: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    paddingHorizontal: 12,
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
  roleGridItem: {
    width: '49%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  roleGridItemChecked: {
    backgroundColor: 'rgba(0, 255, 135, 0.09)',
    borderColor: 'rgba(0, 255, 135, 0.35)',
  },
  roleGridItemText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#cbd5e1',
    flex: 1,
  },
  cancelBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: RADIUS.md,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cancelBtnText: {
    color: '#cbd5e1',
    fontFamily: FONT.semiBold,
    fontSize: 13,
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
