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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '../../constants/theme';
import { apiClient } from '../api/client';
import { auth } from '@/src/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

export type SupervisorPermission =
  | 'ASSIGNED_FARMS_ONLY'
  | 'MANAGE_SPRAY_SCHEDULE'
  | 'MANAGE_LABOUR_EXPENSES'
  | 'CROP_DOCTOR_CHAT'
  | 'MANAGE_HARVEST_SALES'
  | 'VIEW_FINANCES';

export interface SupervisorUser {
  id: string;
  kingId?: string;
  name: string;
  mobile: string;
  supervisorPermissions?: SupervisorPermission[];
  createdAt: string;
}

const PERMISSION_OPTIONS: { id: SupervisorPermission; label: string; sub: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'MANAGE_SPRAY_SCHEDULE', label: '🚜 Spray & Activity Logs', sub: 'Record sprays, fertilizer & irrigation', icon: 'water-outline' },
  { id: 'MANAGE_LABOUR_EXPENSES', label: '📝 Labour & Field Expenses', sub: 'Mark worker attendance & record field costs', icon: 'people-outline' },
  { id: 'CROP_DOCTOR_CHAT', label: '🩺 Crop Doctor Care', sub: 'Send disease photos & chat with Agri Doctors', icon: 'medical-outline' },
  { id: 'MANAGE_HARVEST_SALES', label: '🌾 Harvest & Mandi Sales', sub: 'Record daily harvests & mandi sale bills', icon: 'cash-outline' },
  { id: 'ASSIGNED_FARMS_ONLY', label: '📍 Restrict to Assigned Farms', sub: 'Supervisor can only access assigned fields', icon: 'location-outline' },
  { id: 'VIEW_FINANCES', label: '🔒 View Wallet & Bank Ledger', sub: 'Allow supervisor to view wallet & bank totals', icon: 'wallet-outline' },
];

export function SupervisorManagementModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { data: supervisors = [], isLoading, refetch: fetchSupervisors } = useQuery({
    queryKey: ['my-supervisors'],
    queryFn: async () => {
      const res = await apiClient.get<SupervisorUser[]>('/users/my-supervisors');
      return res.data;
    },
    enabled: visible,
  });

  const [showAddForm, setShowAddForm] = useState(false);

  // Form & OTP State
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [pin, setPin] = useState('');
  const [selectedPerms, setSelectedPerms] = useState<SupervisorPermission[]>([
    'MANAGE_SPRAY_SCHEDULE',
    'MANAGE_LABOUR_EXPENSES',
    'CROP_DOCTOR_CHAT',
    'MANAGE_HARVEST_SALES',
  ]);
  const [otpStep, setOtpStep] = useState<'FORM' | 'VERIFY_OTP'>('FORM');
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState<string | null>(null);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdInfo, setCreatedInfo] = useState<{ supervisor: SupervisorUser; tempPassword: string } | null>(null);

  const addSupervisorMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiClient.post<{ supervisor: SupervisorUser; tempPassword: string }>('/users/my-supervisors', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supervisors'] });
    }
  });

  const deleteSupervisorMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/users/my-supervisors/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-supervisors'] });
    }
  });

  useEffect(() => {
    if (visible) {
      setCreatedInfo(null);
      setShowAddForm(false);
      setOtpStep('FORM');
      setOtpError(null);
      setOtpInput('');
    }
  }, [visible]);

  const togglePerm = (perm: SupervisorPermission) => {
    setSelectedPerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const handleSendOtp = async () => {
    const cleanName = name.trim();
    const cleanMobile = mobile.trim().replace(/\D/g, '');

    if (!cleanName) {
      const msg = 'Please enter Supervisor Name.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Notice', msg);
      return;
    }
    if (!cleanMobile || cleanMobile.length !== 10) {
      const msg = 'Please enter a valid 10-digit Mobile Number.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Notice', msg);
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);
    try {
      if (typeof window !== 'undefined' && !(window as any).recaptchaVerifierSupervisor) {
        (window as any).recaptchaVerifierSupervisor = new RecaptchaVerifier(
          auth,
          'recaptcha-container-supervisor',
          { size: 'invisible' }
        );
      }
      const confirmation = await signInWithPhoneNumber(
        auth,
        `+91${cleanMobile}`,
        (window as any).recaptchaVerifierSupervisor
      );
      setConfirmationResult(confirmation);
      setOtpStep('VERIFY_OTP');
      setOtpInput('');
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to send OTP via Firebase.';
      if (Platform.OS === 'web') alert(msg);
      else Alert.alert('Error', msg);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtpAndCreate = async () => {
    if (!otpInput.trim() || otpInput.trim().length < 4) {
      setOtpError('Please enter the 4-digit OTP received on Supervisor mobile.');
      return;
    }

    setIsSubmitting(true);
    setOtpError(null);
    
    let idToken = '';
    try {
      if (!confirmationResult) throw new Error('OTP Session Expired. Request a new OTP.');
      const resFirebase = await confirmationResult.confirm(otpInput.trim());
      idToken = await resFirebase.user.getIdToken();
    } catch (err: any) {
      setOtpError(err?.message ?? 'Invalid OTP code.');
      setIsSubmitting(false);
      return;
    }
    try {
      const res = await addSupervisorMutation.mutateAsync({
        name: name.trim(),
        mobile: mobile.trim(),
        password: pin.trim() || undefined,
        permissions: selectedPerms,
        firebaseIdToken: idToken,
      });

      setCreatedInfo(res.data);
      setName('');
      setMobile('');
      setPin('');
      setOtpStep('FORM');
      setShowAddForm(false);
      fetchSupervisors();
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Failed to add supervisor. Mobile number may already exist.';
      setOtpError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSupervisor = async (id: string, supName: string) => {
    const doDelete = async () => {
      try {
        await deleteSupervisorMutation.mutateAsync(id);
      } catch (err: any) {
        alert('Failed to remove supervisor.');
      }
    };

    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to remove supervisor "${supName}"?`)) {
        doDelete();
      }
    } else {
      Alert.alert('Remove Supervisor', `Are you sure you want to remove ${supName}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <LinearGradient
            colors={['#1e1b4b', '#312e81', '#0f172a']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerBanner}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <View style={styles.vipBadgeRow}>
                <Ionicons name="shield-checkmark" size={13} color="#f59e0b" />
                <Text style={styles.vipBadgeText}>VIP PASS SCHEME EXCLUSIVE</Text>
              </View>
              <Text style={styles.headerTitle}>My Farm Supervisors 🚜</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView contentContainerStyle={{ gap: 12, paddingVertical: 10 }} showsVerticalScrollIndicator={false}>
            {createdInfo ? (
              <View style={styles.createdBox}>
                <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.createdTitle}>Supervisor Added Successfully!</Text>
                  <Text style={styles.createdSub}>Name: {createdInfo.supervisor.name}</Text>
                  <Text style={styles.createdSub}>Mobile: {createdInfo.supervisor.mobile}</Text>
                  <Text style={styles.createdSub}>Login Password / PIN: <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>{createdInfo.tempPassword}</Text></Text>
                </View>
              </View>
            ) : null}

            {showAddForm ? (
              <View style={styles.formContainer}>
                {otpStep === 'FORM' ? (
                  <>
                    <Text style={styles.sectionTitle}>Add New Supervisor Sub-Account</Text>

                    <View style={{ gap: 8 }}>
                      <Text style={styles.inputLabel}>Supervisor Name *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. Ramesh Kumar"
                        value={name}
                        onChangeText={setName}
                      />

                      <Text style={styles.inputLabel}>Mobile Number (For Login & OTP Confirmation) *</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. 9876543210"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={mobile}
                        onChangeText={setMobile}
                      />

                      <Text style={styles.inputLabel}>Security Password / 4-Digit PIN (Optional)</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Auto-generated if left blank"
                        secureTextEntry
                        value={pin}
                        onChangeText={setPin}
                      />

                      <Text style={styles.inputLabel}>Delegate Granted Powers / Permissions:</Text>
                      <View style={{ gap: 6 }}>
                        {PERMISSION_OPTIONS.map((opt) => {
                          const isChecked = selectedPerms.includes(opt.id);
                          return (
                            <TouchableOpacity
                              key={opt.id}
                              style={[styles.permRow, isChecked && styles.permRowChecked]}
                              activeOpacity={0.8}
                              onPress={() => togglePerm(opt.id)}
                            >
                              <Ionicons name={opt.icon} size={18} color={isChecked ? '#4f46e5' : '#64748b'} />
                              <View style={{ flex: 1 }}>
                                <Text style={[styles.permTitle, isChecked && { color: '#1e1b4b' }]}>{opt.label}</Text>
                                <Text style={styles.permSub}>{opt.sub}</Text>
                              </View>
                              <Ionicons
                                name={isChecked ? 'checkbox' : 'square-outline'}
                                size={20}
                                color={isChecked ? '#4f46e5' : '#cbd5e1'}
                              />
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={[styles.cancelBtn, { flex: 1 }]}
                        onPress={() => setShowAddForm(false)}
                      >
                        <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveBtn, { flex: 2 }]}
                        disabled={isSendingOtp}
                        onPress={handleSendOtp}
                      >
                        {isSendingOtp ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <Ionicons name="send" size={16} color="#ffffff" />
                            <Text style={styles.saveBtnText}>Send OTP to Supervisor</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <View style={{ alignItems: 'center', gap: 6, paddingVertical: 6 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="chatbox-ellipses" size={24} color="#16a34a" />
                      </View>
                      <Text style={{ fontSize: 15, fontFamily: FONT.extraBold, color: '#1e1b4b', textAlign: 'center' }}>
                        Confirm Supervisor Mobile Number
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: FONT.medium, color: '#475569', textAlign: 'center' }}>
                        4-digit OTP code sent to Supervisor mobile: <Text style={{ fontFamily: FONT.bold, color: '#16a34a' }}>+91 {mobile}</Text>
                      </Text>
                    </View>

                    <View style={{ gap: 8, marginVertical: 6 }}>
                      <Text style={styles.inputLabel}>Enter 4-Digit OTP Code *</Text>
                      <TextInput
                        style={[styles.input, { textAlign: 'center', fontSize: 22, letterSpacing: 8, fontFamily: FONT.extraBold, borderColor: '#4f46e5', backgroundColor: '#eef2ff' }]}
                        placeholder="••••"
                        placeholderTextColor="#a5b4fc"
                        keyboardType="number-pad"
                        maxLength={4}
                        value={otpInput}
                        onChangeText={(v) => { setOtpInput(v); setOtpError(null); }}
                      />

                      {otpError ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fef2f2', padding: 8, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: '#fecaca' }}>
                          <Ionicons name="alert-circle" size={16} color="#dc2626" />
                          <Text style={{ fontSize: 11, fontFamily: FONT.bold, color: '#dc2626', flex: 1 }}>{otpError}</Text>
                        </View>
                      ) : null}
                    </View>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 2 }}>
                      <TouchableOpacity onPress={() => setOtpStep('FORM')} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="arrow-back" size={14} color="#4f46e5" />
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#4f46e5' }}>Edit Details</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={handleSendOtp} disabled={isSendingOtp} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="refresh" size={14} color="#16a34a" />
                        <Text style={{ fontSize: 11.5, fontFamily: FONT.bold, color: '#16a34a' }}>
                          {isSendingOtp ? 'Sending...' : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                      <TouchableOpacity
                        style={[styles.cancelBtn, { flex: 1 }]}
                        onPress={() => setOtpStep('FORM')}
                      >
                        <Text style={styles.cancelBtnText}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.saveBtn, { flex: 2, backgroundColor: '#16a34a' }]}
                        disabled={isSubmitting}
                        onPress={handleVerifyOtpAndCreate}
                      >
                        {isSubmitting ? (
                          <ActivityIndicator color="#ffffff" />
                        ) : (
                          <>
                            <Ionicons name="checkmark-circle" size={17} color="#ffffff" />
                            <Text style={styles.saveBtnText}>Verify OTP & Create</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            ) : (
              <View style={{ gap: 10 }}>
                <View style={styles.topActionsRow}>
                  <Text style={styles.supervisorCountText}>
                    Active Supervisors ({supervisors.length})
                  </Text>
                  <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddForm(true)}>
                    <Ionicons name="add" size={16} color="#ffffff" />
                    <Text style={styles.addBtnText}>+ Add Supervisor</Text>
                  </TouchableOpacity>
                </View>

                {isLoading ? (
                  <ActivityIndicator color="#4f46e5" style={{ marginVertical: 20 }} />
                ) : supervisors.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="people-outline" size={36} color="#94a3b8" />
                    <Text style={styles.emptyTitle}>No Supervisors Added Yet</Text>
                    <Text style={styles.emptySub}>
                      As a VIP Pass holder, you can add sub-accounts for your farm supervisors and delegate powers to them.
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 8 }}>
                    {supervisors.map((sup) => (
                      <View key={sup.id} style={styles.supCard}>
                        <View style={styles.supCardHeader}>
                          <View style={styles.supAvatar}>
                            <Ionicons name="person" size={18} color="#4f46e5" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.supName}>{sup.name}</Text>
                            <Text style={styles.supMobile}>📱 {sup.mobile} {sup.kingId ? `· ID: ${sup.kingId}` : ''}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleDeleteSupervisor(sup.id, sup.name)}
                            style={styles.deleteBtn}
                          >
                            <Ionicons name="trash-outline" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                        <View style={styles.permsBadgeWrap}>
                          {(sup.supervisorPermissions ?? []).map((p) => {
                            const match = PERMISSION_OPTIONS.find((o) => o.id === p);
                            return (
                              <View key={p} style={styles.permBadge}>
                                <Text style={styles.permBadgeText}>{match?.label ?? p}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Login System Information Box */}
            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color="#4338ca" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={styles.infoTitle}>Supervisor Login Modes (Option C):</Text>
                <Text style={styles.infoText}>
                  1. <Text style={{ fontFamily: FONT.bold }}>Independent Phone Login:</Text> Supervisor logs into FarmsKing app on their own phone using Mobile Number & Password/OTP.
                </Text>
                <Text style={styles.infoText}>
                  2. <Text style={{ fontFamily: FONT.bold }}>Shared Field Tablet PIN Switch:</Text> Enter 4-digit PIN on farmer device to instantly switch into Supervisor mode.
                </Text>
              </View>
            </View>
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
    maxWidth: 520,
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
  vipBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
    alignSelf: 'flex-start',
  },
  vipBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.extraBold,
    color: '#fbbf24',
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
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  createdTitle: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#166534',
  },
  createdSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#1e293b',
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
    color: '#1e1b4b',
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: FONT.semiBold,
    color: '#475569',
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
    borderColor: '#818cf8',
    backgroundColor: '#eef2ff',
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
    backgroundColor: '#4f46e5',
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
  supervisorCountText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#1e293b',
  },
  addBtn: {
    backgroundColor: '#4f46e5',
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
  supCard: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  supCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  supAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  supName: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  supMobile: {
    fontSize: 11,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  deleteBtn: {
    padding: 6,
  },
  permsBadgeWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  permBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  permBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.semiBold,
    color: '#3730a3',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#eef2ff',
    padding: 10,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#c7d2fe',
    marginTop: 4,
  },
  infoTitle: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#312e81',
  },
  infoText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#4338ca',
  },
});
