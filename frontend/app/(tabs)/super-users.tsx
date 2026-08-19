import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import {
  useAdminUpdateUser,
  useCreateAdmin,
  useCreateAdvisor,
  useCreateOperator,
  useDeactivateUser,
  useReactivateUser,
  useResetUserPassword,
  useUpdateActiveRoles,
  useUpdateOperatorPermissions,
  useUserDetail,
  useUsersList,
} from '@/src/hooks/useUsersAdmin';
import { formatInr } from '@/src/utils/formatInr';
import { ASSIGNABLE_CHECKBOX_ROLES } from '@/src/api/users.api';
import { useAuth } from '@/src/store/auth-context';
import { AdminUser, AdvisorType, OperatorPermission, Role } from '@/src/types/api';

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
  | 'SUPER_ADMIN' | 'ADMIN' | 'OPERATOR'
  | 'BUSINESS_PARTNER' | 'FARM_ADVISOR' | 'GARDEN_ADVISOR'
  | 'CUSTOMER' | 'FARMER' | 'GARDENER';

const FILTERS_BY_GROUP: Record<UserGroup, { value: UserFilter; label: string; icon: keyof typeof Ionicons.glyphMap }[]> = {
  ADMINS: [
    { value: 'SUPER_ADMIN', label: 'Super Admin', icon: 'shield-half-outline' },
    { value: 'ADMIN', label: 'Admin', icon: 'shield-checkmark-outline' },
    { value: 'OPERATOR', label: 'Operator', icon: 'print-outline' },
  ],
  PARTNERS: [
    { value: 'BUSINESS_PARTNER', label: 'Business Partners', icon: 'briefcase-outline' },
    { value: 'FARM_ADVISOR', label: 'Farm Advisors', icon: 'school-outline' },
    { value: 'GARDEN_ADVISOR', label: 'Garden Advisors', icon: 'sunny-outline' },
  ],
  CLIENTS: [
    { value: 'CUSTOMER', label: 'Customers', icon: 'cart-outline' },
    { value: 'FARMER', label: 'Farmers', icon: 'leaf-outline' },
    { value: 'GARDENER', label: 'Gardeners', icon: 'flower-outline' },
  ],
};

function filterToBackendRole(filter: UserFilter): Role {
  return filter === 'FARM_ADVISOR' || filter === 'GARDEN_ADVISOR' ? 'ADVISOR' : (filter as Role);
}

export default function SuperUsersScreen() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const [group, setGroup] = useState<UserGroup>('CLIENTS');
  const [filter, setFilter] = useState<UserFilter>('FARMER');
  const [search, setSearch] = useState('');
  const [isAddAdvisorOpen, setIsAddAdvisorOpen] = useState(false);
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [permissionsTarget, setPermissionsTarget] = useState<AdminUser | null>(null);
  const [rolesTarget, setRolesTarget] = useState<AdminUser | null>(null);
  const [detailTargetId, setDetailTargetId] = useState<string | null>(null);
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  const selectGroup = (g: UserGroup) => {
    tap();
    setGroup(g);
    setFilter(FILTERS_BY_GROUP[g][0].value);
  };

  const { data, isLoading } = useUsersList({ role: filterToBackendRole(filter), search: search.trim() || undefined, limit: 100 });
  const deactivate = useDeactivateUser();
  const reactivate = useReactivateUser();

  const items = (data?.items ?? []).filter((u) =>
    filter === 'FARM_ADVISOR' ? u.advisorType === 'FARM' : filter === 'GARDEN_ADVISOR' ? u.advisorType === 'GARDEN' : true,
  );

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const visibleItems = items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradient} style={styles.hero}>
        <Text style={styles.heroTitle}>User Management</Text>
        <Text style={styles.heroSubtitle}>Every role on the platform, in one place</Text>

        <View style={styles.searchWrap}>
          <Ionicons name="search" size={16} color="rgba(255,255,255,0.8)" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name or mobile..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <View style={styles.groupRow}>
          {GROUPS.map((g) => (
            <TouchableOpacity
              key={g.value}
              style={[styles.groupChip, group === g.value && styles.groupChipActive]}
              activeOpacity={0.8}
              onPress={() => selectGroup(g.value)}
            >
              <Ionicons name={g.icon} size={14} color={group === g.value ? theme.primary : '#fff'} />
              <Text style={[styles.groupChipText, group === g.value && { color: theme.primary }]}>{g.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }} contentContainerStyle={{ gap: 8 }}>
          {FILTERS_BY_GROUP[group].map((f) => (
            <TouchableOpacity
              key={f.value}
              style={[styles.filterChip, filter === f.value && styles.filterChipActive]}
              activeOpacity={0.8}
              onPress={() => {
                tap();
                setFilter(f.value);
              }}
            >
              <Ionicons name={f.icon} size={13} color={filter === f.value ? theme.primary : '#fff'} />
              <Text style={[styles.filterChipText, filter === f.value && { color: theme.primary }]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {(filter === 'FARM_ADVISOR' || filter === 'GARDEN_ADVISOR') && (
          <TouchableOpacity
            style={[styles.addAdvisorBtn, premiumShadow(theme.primary, 'sm')]}
            activeOpacity={0.85}
            onPress={() => setIsAddAdvisorOpen(true)}
          >
            <Ionicons name="add-circle" size={16} color="#ffffff" />
            <Text style={styles.addAdvisorBtnText}>Add {filter === 'FARM_ADVISOR' ? 'Farm' : 'Garden'} Advisor</Text>
          </TouchableOpacity>
        )}

        {(filter === 'OPERATOR' || (filter === 'ADMIN' && isSuperAdmin)) && (
          <TouchableOpacity
            style={[styles.addAdvisorBtn, premiumShadow(theme.primary, 'sm')]}
            activeOpacity={0.85}
            onPress={() => setIsAddStaffOpen(true)}
          >
            <Ionicons name="add-circle" size={16} color="#ffffff" />
            <Text style={styles.addAdvisorBtnText}>Add {filter === 'OPERATOR' ? 'Operator' : 'Admin'}</Text>
          </TouchableOpacity>
        )}
        {filter === 'ADMIN' && !isSuperAdmin ? (
          <Text style={styles.emptyText}>Only the Super Admin can add new Admin accounts.</Text>
        ) : null}

        {isLoading ? (
          <ActivityIndicator color={theme.primary} style={{ marginTop: 30 }} />
        ) : items.length === 0 ? (
          <View style={styles.emptyCenter}>
            <Ionicons name="people-outline" size={40} color="#cbd5e1" />
            <Text style={styles.emptyText}>No users found.</Text>
          </View>
        ) : (
          <>
          {visibleItems.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isOperator={filter === 'OPERATOR'}
              onDeactivate={() => deactivate.mutate(u.id)}
              onReactivate={() => reactivate.mutate(u.id)}
              onEditPermissions={filter === 'OPERATOR' ? () => setPermissionsTarget(u) : undefined}
              onEditRoles={filter !== 'OPERATOR' && filter !== 'ADMIN' && filter !== 'SUPER_ADMIN' ? () => setRolesTarget(u) : undefined}
              onOpenDetail={() => setDetailTargetId(u.id)}
            />
          ))}
          {totalPages > 1 ? (
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
              <Text style={styles.pagerText}>Page {page} of {totalPages}</Text>
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
          ) : null}
          </>
        )}
      </ScrollView>

      <AddAdvisorModal
        visible={isAddAdvisorOpen}
        advisorType={filter === 'GARDEN_ADVISOR' ? 'GARDEN' : 'FARM'}
        onClose={() => setIsAddAdvisorOpen(false)}
      />

      <AddStaffModal
        visible={isAddStaffOpen}
        kind={filter === 'OPERATOR' ? 'OPERATOR' : 'ADMIN'}
        onClose={() => setIsAddStaffOpen(false)}
      />

      <OperatorPermissionsModal target={permissionsTarget} onClose={() => setPermissionsTarget(null)} />
      <EditRolesModal target={rolesTarget} onClose={() => setRolesTarget(null)} />
      <UserDetailModal userId={detailTargetId} onClose={() => setDetailTargetId(null)} />
    </View>
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
              <Text style={styles.detailMeta}>Role: {data.user.role}{data.user.roles && data.user.roles.length > 1 ? ` (also: ${data.user.roles.filter((r) => r !== data.user.role).join(', ')})` : ''}</Text>
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

  const activeRoles = (user.roles ?? [user.role]).filter((r) => !(user.deactivatedRoles ?? []).includes(r));
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
        <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#e2e8f0' }]} onPress={onDone}>
          <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
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
        <TouchableOpacity style={[styles.submitBtn, { flex: 1, backgroundColor: '#e2e8f0' }]} onPress={onDone}>
          <Text style={[styles.submitBtnText, { color: '#475569' }]}>Cancel</Text>
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
};

function EditRolesModal({ target, onClose }: { target: AdminUser | null; onClose: () => void }) {
  const updateActiveRoles = useUpdateActiveRoles();
  const updateUser = useAdminUpdateUser();
  const [selected, setSelected] = useState<Role[]>([]);
  const [advisorType, setAdvisorType] = useState<AdvisorType | null>(null);

  useEffect(() => {
    if (!target) return;
    const active = (target.roles ?? [target.role]).filter((r) => !(target.deactivatedRoles ?? []).includes(r));
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
    const message = `${target.name} ke roles update ho jayenge:\n${roleLabels.join(', ') || 'None'}\n\nConfirm karein?`;
    const doSave = async () => {
      await updateActiveRoles.mutateAsync({ id: target.id, activeRoles: selected });
      if (selected.includes('ADVISOR') && advisorType) {
        await updateUser.mutateAsync({ id: target.id, payload: { advisorType } });
      }
      onClose();
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
  isOperator,
  onDeactivate,
  onReactivate,
  onEditPermissions,
  onEditRoles,
  onOpenDetail,
}: {
  user: AdminUser;
  isOperator?: boolean;
  onDeactivate: () => void;
  onReactivate: () => void;
  onEditPermissions?: () => void;
  onEditRoles?: () => void;
  onOpenDetail?: () => void;
}) {
  const isDeactivated = !!user.deletedAt;
  const initials = (user.name ?? '').trim().split(/\s+/).slice(0, 2).map((p) => p[0] ?? '').join('').toUpperCase() || '?';

  return (
    <View style={[styles.userCard, premiumShadow('#0f172a', 'sm'), isDeactivated && styles.userCardDeactivated]}>
      <TouchableOpacity style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 }} activeOpacity={0.7} onPress={onOpenDetail} disabled={!onOpenDetail}>
        <View style={[styles.userAvatar, isDeactivated && { backgroundColor: '#f1f5f9' }]}>
          <Text style={[styles.userAvatarText, isDeactivated && { color: '#94a3b8' }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
            {isDeactivated ? (
              <View style={styles.deactivatedBadge}>
                <View style={styles.deactivatedDot} />
                <Text style={styles.deactivatedBadgeText}>Disabled</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.userMeta} numberOfLines={1}>
            {user.kingId ? `🔑 ${user.kingId} · ` : ''}📱 {user.mobile}
          </Text>
        </View>
        {onOpenDetail ? <Ionicons name="chevron-forward" size={16} color="#cbd5e1" /> : null}
      </TouchableOpacity>

      <View style={styles.userActionRow}>
        {isOperator && onEditPermissions ? (
          <TouchableOpacity style={[styles.actionBtnText, { backgroundColor: '#eff6ff' }]} activeOpacity={0.8} onPress={onEditPermissions}>
            <Text style={[styles.actionBtnLabel, { color: '#1d4ed8' }]}>Permissions</Text>
          </TouchableOpacity>
        ) : null}
        {onEditRoles ? (
          <TouchableOpacity style={[styles.actionBtnText, { backgroundColor: '#eef2ff' }]} activeOpacity={0.8} onPress={onEditRoles}>
            <Text style={[styles.actionBtnLabel, { color: '#4338ca' }]}>Role</Text>
          </TouchableOpacity>
        ) : null}
        {isDeactivated ? (
          <TouchableOpacity style={[styles.actionBtnText, { backgroundColor: '#dcfce7' }]} activeOpacity={0.8} onPress={onReactivate}>
            <Text style={[styles.actionBtnLabel, { color: '#16a34a' }]}>Reactivate</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtnText, { backgroundColor: '#fee2e2' }]} activeOpacity={0.8} onPress={onDeactivate}>
            <Text style={[styles.actionBtnLabel, { color: '#dc2626' }]}>Deactivate</Text>
          </TouchableOpacity>
        )}
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
            <Text style={styles.modalTitle}>Add {advisorType === 'FARM' ? 'Farm' : 'Garden'} Advisor</Text>
            <TouchableOpacity onPress={() => { reset(); onClose(); }}>
              <Ionicons name="close-circle" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {tempPasswordResult ? (
            <View style={{ gap: 10 }}>
              <View style={styles.successBox}>
                <Ionicons name="checkmark-circle" size={20} color="#16a34a" />
                <Text style={styles.successText}>
                  Advisor created. Temporary password: <Text style={{ fontFamily: FONT.extraBold }}>{tempPasswordResult}</Text>
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

function AddStaffModal({ visible, kind, onClose }: { visible: boolean; kind: 'OPERATOR' | 'ADMIN'; onClose: () => void }) {
  const createOperator = useCreateOperator();
  const createAdmin = useCreateAdmin();
  const createStaff = kind === 'OPERATOR' ? createOperator : createAdmin;
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
      setError(err?.response?.data?.message ?? `Could not create ${kind === 'OPERATOR' ? 'operator' : 'admin'}.`);
    }
  };

  const label = kind === 'OPERATOR' ? 'Operator' : 'Admin';

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

const styles = StyleSheet.create({
  label: { fontSize: 11.5, fontFamily: FONT.bold, color: '#334155', marginTop: 4 },
  container: { flex: 1, backgroundColor: '#f8fafc' },
  hero: { paddingTop: 20, paddingBottom: 16, paddingHorizontal: SPACING.xxl },
  heroTitle: { color: '#fff', fontSize: 20, fontFamily: FONT.extraBold, letterSpacing: -0.2 },
  heroSubtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 12, fontFamily: FONT.medium, marginTop: 2 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 14,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 13, fontFamily: FONT.medium },
  groupRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.pill,
    padding: 4,
  },
  groupChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
    borderRadius: RADIUS.pill,
  },
  groupChipActive: { backgroundColor: '#ffffff' },
  groupChipText: { fontSize: 12, fontFamily: FONT.bold, color: '#ffffff' },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  filterChipActive: { backgroundColor: '#ffffff' },
  filterChipText: { fontSize: 11.5, fontFamily: FONT.bold, color: '#ffffff' },
  list: { padding: SPACING.lg, gap: 10, paddingBottom: SPACING.xxl },
  addAdvisorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: theme.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
  },
  addAdvisorBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13.5 },
  emptyCenter: { alignItems: 'center', justifyContent: 'center', padding: 50, gap: 8, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1, borderColor: '#f1f5f9', borderStyle: 'dashed' },
  pagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 10,
    marginTop: 4,
  },
  pagerBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  pagerBtnDisabled: { opacity: 0.5 },
  pagerText: { fontSize: 12.5, fontFamily: FONT.bold, color: '#334155' },
  emptyText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8' },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  userCardDeactivated: { backgroundColor: '#fafbfc', opacity: 0.85 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { fontSize: 12.5, fontFamily: FONT.extraBold, color: theme.primary },
  userActionRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', marginLeft: 8 },
  userName: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a', flexShrink: 1 },
  userMeta: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  userKingId: { fontSize: 10.5, fontFamily: FONT.bold, color: theme.primary, marginTop: 2, letterSpacing: 0.3 },
  deactivatedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#fee2e2', paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: RADIUS.pill },
  deactivatedDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#dc2626' },
  deactivatedBadgeText: { fontSize: 9, fontFamily: FONT.extraBold, color: '#dc2626' },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: { fontSize: 10.5, fontFamily: FONT.bold },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.6)', justifyContent: 'center', alignItems: 'center', padding: SPACING.lg },
  modalCard: { width: '100%', maxWidth: 440, maxHeight: '85%', backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.lg, ...premiumShadow('#000000', 'lg') },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  modalTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13.5, fontFamily: FONT.medium, backgroundColor: '#f8fafc', color: '#0f172a' },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 12 },
  submitBtn: { backgroundColor: theme.primary, borderRadius: RADIUS.md, paddingVertical: 13, alignItems: 'center', marginTop: 4 },
  submitBtnText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  helperText: { fontSize: 11.5, fontFamily: FONT.medium, color: '#64748b' },
  permissionRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  permissionRowText: { fontSize: 13.5, fontFamily: FONT.semiBold, color: '#0f172a', flex: 1 },
  deactivatedHint: { fontSize: 10.5, fontFamily: FONT.bold, color: '#dc2626', backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  lockedHint: { fontSize: 10.5, fontFamily: FONT.bold, color: '#16a34a', backgroundColor: '#dcfce7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  sectionTitle: { fontSize: 13.5, fontFamily: FONT.bold, color: '#0f172a' },
  detailName: { fontSize: 17, fontFamily: FONT.extraBold, color: '#0f172a' },
  detailMeta: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b' },
  detailStatsRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  detailStatBox: { flex: 1, backgroundColor: '#f8fafc', borderRadius: RADIUS.md, paddingVertical: 10, alignItems: 'center' },
  detailStatValue: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a' },
  detailStatLabel: { fontSize: 10.5, fontFamily: FONT.medium, color: '#64748b', marginTop: 2 },
  successBox: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: RADIUS.md, padding: 12, borderWidth: 1, borderColor: '#bbf7d0' },
  successText: { flex: 1, fontSize: 12.5, fontFamily: FONT.medium, color: '#15803d' },
});
