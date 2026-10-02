import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '../../constants/theme';
import { apiClient } from '../api/client';

export type AdminStaffRole = 'ADMIN' | 'MANAGER' | 'OPERATOR';
export type AdminStaffPermission =
  | 'MANAGE_USERS'
  | 'MANAGE_STAFF'
  | 'MANAGE_PAYMENTS'
  | 'MANAGE_PLANS'
  | 'MANAGE_ADVISORS'
  | 'VIEW_FINANCES'
  | 'MANAGE_ORDERS'
  | 'MANAGE_WEATHER_MARKET'
  | 'MANAGE_DOCTORS'
  | 'VIEW_AUDIT_LOGS';

export interface AdminStaffUser {
  id: string;
  kingId?: string;
  name: string;
  mobile: string;
  role: string;
  adminStaffPermissions?: AdminStaffPermission[];
  createdAt: string;
}

const STAFF_PERMISSIONS: { id: AdminStaffPermission; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'MANAGE_USERS', label: '👥 User Accounts Management', sub: 'Edit, block, or reactivate platform users', icon: 'people-outline' },
  { id: 'MANAGE_STAFF', label: '👔 Staff & Roles Management', sub: 'Super admin only: manage staff privileges', icon: 'shield-half-outline' },
  { id: 'MANAGE_PAYMENTS', label: '💳 Payments & Withdrawals', sub: 'Approve advisor/partner withdrawal requests', icon: 'card-outline' },
  { id: 'MANAGE_PLANS', label: '📜 VIP Pass Plans & Coupons', sub: 'Create coupons and adjust plan prices', icon: 'pricetag-outline' },
  { id: 'MANAGE_DOCTORS', label: '🩺 Crop Doctors & Advisors', sub: 'Approve advisor profiles and consultation fees', icon: 'medical-outline' },
  { id: 'MANAGE_ORDERS', label: '📦 Store Orders & Dispatch', sub: 'Process customer orders, pack & dispatch', icon: 'cube-outline' },
  { id: 'VIEW_FINANCES', label: '📊 Financial Stats & Revenue', sub: 'View platform revenue and wallet ledgers', icon: 'stats-chart-outline' },
  { id: 'MANAGE_WEATHER_MARKET', label: '🌤️ Weather & Market Rates', sub: 'Update mandi crop rates & broadcast weather alerts', icon: 'cloud-outline' },
  { id: 'VIEW_AUDIT_LOGS', label: '🔍 System Audit Logs', sub: 'View activity logs of staff actions', icon: 'list-outline' },
];

export function AdminStaffManagementModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const [staffList, setStaffList] = useState<AdminStaffUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [selectedRole, setSelectedRole] = useState<AdminStaffRole>('MANAGER');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<AdminStaffPermission[]>([
    'MANAGE_USERS',
    'MANAGE_ORDERS',
    'MANAGE_WEATHER_MARKET',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ user: AdminStaffUser; tempPassword: string } | null>(null);

  const fetchStaff = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get<{ items: AdminStaffUser[] }>('/users?limit=50');
      const filtered = (res.data?.items ?? []).filter(
        (u: any) => u.role === 'ADMIN' || u.role === 'MANAGER' || u.role === 'OPERATOR',
      );
      setStaffList(filtered);
    } catch (err: any) {
      console.error('Failed to fetch staff:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchStaff();
      setCreatedInfo(null);
      setShowAddForm(false);
    }
  }, [visible]);

  const togglePerm = (perm: AdminStaffPermission) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleCreateStaff = async () => {
    if (!name.trim() || !mobile.trim()) {
      const msg = 'Please enter Staff Name and 10-digit Mobile Number.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Notice', msg);
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = selectedRole === 'ADMIN' ? '/users/admins' : selectedRole === 'MANAGER' ? '/users/managers' : '/users/operators';
      const res = await apiClient.post<{ user: AdminStaffUser; tempPassword: string }>(endpoint, {
        name: name.trim(),
        mobile: mobile.trim(),
        email: email.trim() || undefined,
      });

      // Update permissions if selected
      if (selectedPerms.length > 0) {
        await apiClient.patch(`/users/${res.data.user.id}/admin-staff-permissions`, {
          permissions: selectedPerms,
        });
      }

      setCreatedInfo(res.data);
      setName('');
      setMobile('');
      setEmail('');
      setShowAddForm(false);
      fetchStaff();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to create staff member. Mobile number may already exist.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#0f172a', '#1e293b', '#334155']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBanner}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.superBadgeRow}>
                <Ionicons name="key" size={13} color="#38bdf8" />
                <Text style={styles.superBadgeText}>SUPER ADMIN EXCLUSIVE</Text>
              </View>
              <Text style={styles.headerTitle}>FarmsKing Admin Staff Portal 👔</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
            {createdInfo ? (
              <View style={styles.createdBox}>
                <Ionicons name="checkmark-circle" size={24} color="#0284c7" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.createdTitle}>Staff Account Created!</Text>
                  <Text style={styles.createdSub}>Role: {createdInfo.user.role} · Name: {createdInfo.user.name}</Text>
                  <Text style={styles.createdSub}>Mobile: {createdInfo.user.mobile}</Text>
                  <Text style={styles.createdSub}>Temp Password: <Text style={{ fontFamily: FONT.bold, color: '#0284c7' }}>{createdInfo.tempPassword}</Text></Text>
                </View>
              </View>
            ) : null}

            {showAddForm ? (
              <View style={styles.formContainer}>
                <Text style={styles.sectionTitle}>Add FarmsKing Staff Member</Text>

                <Text style={styles.inputLabel}>Select Staff Role:</Text>
                <View style={styles.roleChipsRow}>
                  {(['ADMIN', 'MANAGER', 'OPERATOR'] as const).map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.roleChip, selectedRole === r && styles.roleChipActive]}
                      onPress={() => setSelectedRole(r)}
                    >
                      <Text style={[styles.roleChipText, selectedRole === r && { color: '#ffffff' }]}>
                        {r === 'ADMIN' ? '👑 Admin' : r === 'MANAGER' ? '👔 Manager' : '⚡ Operator'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={{ gap: 8, marginTop: 4 }}>
                  <Text style={styles.inputLabel}>Full Name</Text>
                  <TextInput style={styles.input} placeholder="e.g. Harpreet Singh" value={name} onChangeText={setName} />

                  <Text style={styles.inputLabel}>Mobile Number</Text>
                  <TextInput style={styles.input} placeholder="e.g. 98720XXXXX" keyboardType="phone-pad" value={mobile} onChangeText={setMobile} />

                  <Text style={styles.inputLabel}>Email Address (Optional)</Text>
                  <TextInput style={styles.input} placeholder="e.g. harpreet@farmsking.com" keyboardType="email-address" value={email} onChangeText={setEmail} />

                  <Text style={styles.inputLabel}>Assign Granular Staff Powers / Permissions:</Text>
                  <View style={{ gap: 6 }}>
                    {STAFF_PERMISSIONS.map((opt) => {
                      const isChecked = selectedPerms.includes(opt.id);
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          style={[styles.permRow, isChecked && styles.permRowChecked]}
                          activeOpacity={0.8}
                          onPress={() => togglePerm(opt.id)}
                        >
                          <Ionicons name={opt.icon} size={18} color={isChecked ? '#0284c7' : '#64748b'} />
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.permTitle, isChecked && { color: '#0369a1' }]}>{opt.label}</Text>
                            <Text style={styles.permSub}>{opt.sub}</Text>
                          </View>
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={isChecked ? '#0284c7' : '#cbd5e1'}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                  <TouchableOpacity style={[styles.cancelBtn, { flex: 1 }]} onPress={() => setShowAddForm(false)}>
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { flex: 2 }]} disabled={isSubmitting} onPress={handleCreateStaff}>
                    {isSubmitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>Create Staff Account</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <View style={styles.topActionsRow}>
                  <Text style={styles.staffCountText}>Active Admin Staff ({staffList.length})</Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
                    <Ionicons name="add" size={16} color="#ffffff" />
                    <Text style={styles.addBtnText}>+ Create Staff</Text>
                  </TouchableOpacity>
                </View>

                {isLoading ? (
                  <ActivityIndicator color="#0284c7" style={{ marginVertical: 20 }} />
                ) : staffList.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="shield-outline" size={36} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Staff Members Created Yet</Text>
                    <Text style={styles.emptySub}>Super Admin can create Admin, Manager, and Operator accounts and assign custom powers to them.</Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {staffList.map((st) => (
                      <View key={st.id} style={styles.staffCard}>
                        <View style={styles.staffHeader}>
                          <View style={styles.staffAvatar}>
                            <Ionicons name="person-circle" size={24} color="#0284c7" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                              <Text style={styles.staffName}>{st.name}</Text>
                              <View style={styles.roleTag}>
                                <Text style={styles.roleTagText}>{st.role}</Text>
                              </View>
                            </View>
                            <Text style={styles.staffMobile}>📱 {st.mobile} {st.kingId ? `· ID: ${st.kingId}` : ''}</Text>
                          </View>
                        </View>
                        {st.adminStaffPermissions && st.adminStaffPermissions.length > 0 ? (
                          <View style={styles.permsWrap}>
                            {st.adminStaffPermissions.map((p) => {
                              const match = STAFF_PERMISSIONS.find((s) => s.id === p);
                              return (
                                <View key={p} style={styles.permBadge}>
                                  <Text style={styles.permBadgeText}>{match?.label ?? p}</Text>
                                </View>
                              );
                            })}
                          </View>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: 16,
    gap: 10,
    ...premiumShadow('#0f172a', 'md'),
  },
  headerBanner: {
    borderRadius: RADIUS.md,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  superBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  superBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#38bdf8',
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
    color: '#ffffff',
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  createdBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#e0f2fe',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  createdTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  createdSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  formContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#475569',
  },
  roleChipsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  roleChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    alignItems: 'center',
  },
  roleChipActive: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  roleChipText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  permRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ffffff',
    padding: 9,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  permRowChecked: {
    borderColor: '#38bdf8',
    backgroundColor: '#f0f9ff',
  },
  permTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  permSub: {
    fontSize: 10,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  saveBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 9,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  topActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffCountText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  addBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
  },
  addBtnText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 6,
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#475569',
  },
  emptySub: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#94a3b8',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  staffCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  staffHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  staffAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  roleTag: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  roleTagText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  staffMobile: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  permsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  permBadge: {
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  permBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.semiBold,
    color: '#0369a1',
  },
});
