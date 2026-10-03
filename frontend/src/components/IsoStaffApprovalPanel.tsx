import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';

export const IsoStaffApprovalPanel: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const fetchPending = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get<any[]>('/users/pending-approvals');
      setPendingUsers(res.data);
    } catch (e) {
      console.warn('Failed to fetch pending profile approvals:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (userId: string) => {
    try {
      setProcessingId(userId);
      await apiClient.post(`/users/${userId}/approve-profile`);
      Alert.alert('Approved', 'Staff/Expert profile approved successfully.');
      await fetchPending();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to approve profile.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (userId: string) => {
    if (!rejectionReason.trim()) {
      Alert.alert('Reason Required', 'Please provide a reason for rejecting the profile.');
      return;
    }

    try {
      setProcessingId(userId);
      await apiClient.post(`/users/${userId}/reject-profile`, { reason: rejectionReason });
      Alert.alert('Rejected', 'Profile submission rejected.');
      setRejectingId(null);
      setRejectionReason('');
      await fetchPending();
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.message || 'Failed to reject profile.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerBox}>
        <ActivityIndicator color="#16a34a" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons name="checkmark-done-circle" size={24} color="#16a34a" />
        <Text style={styles.headerTitle}>ISO Staff & Expert Profile Approval Center ({pendingUsers.length})</Text>
      </View>

      {pendingUsers.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="shield-checkmark" size={48} color="#16a34a" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>All Staff & Expert profiles are verified and approved!</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
          {pendingUsers.map((user) => {
            const isProcessing = processingId === user.id;
            const isRejecting = rejectingId === user.id;

            return (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.userInfoRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.userName}>{user.name}</Text>
                    <Text style={styles.userRole}>
                      Role: <Text style={{ color: '#38bdf8' }}>{user.role}</Text> | ID: {user.assignedStaffId || user.kingId}
                    </Text>
                    <Text style={styles.userMobile}>Mobile: {user.mobile}</Text>
                  </View>
                  <View style={styles.reviewBadge}>
                    <Text style={styles.reviewBadgeText}>UNDER REVIEW</Text>
                  </View>
                </View>

                {/* Profile Details */}
                <View style={styles.detailsBox}>
                  <Text style={styles.detailItem}>🎓 Qualification: {user.qualification || 'N/A'}</Text>
                  <Text style={styles.detailItem}>🌾 Specialization: {user.specialization || 'N/A'}</Text>
                  <Text style={styles.detailItem}>⭐ Experience: {user.yearsExperience || 1} years</Text>
                  <Text style={styles.detailItem}>💳 UPI ID: {user.upiId || 'N/A'}</Text>
                  {user.bankAccountNumber && (
                    <Text style={styles.detailItem}>
                      🏦 Bank: {user.bankAccountNumber} (IFSC: {user.bankIfsc})
                    </Text>
                  )}
                  {user.bio && <Text style={styles.detailBio}>Bio: "{user.bio}"</Text>}
                </View>

                {/* Actions */}
                {isProcessing ? (
                  <ActivityIndicator color="#16a34a" style={{ marginTop: 12 }} />
                ) : (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(user.id)}>
                      <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.approveBtnText}>Approve ISO Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => {
                        setRejectingId(user.id);
                        setRejectionReason('');
                      }}
                    >
                      <Ionicons name="close-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isRejecting && (
                  <View style={styles.rejectForm}>
                    <TextInput
                      style={styles.reasonInput}
                      placeholder="Reason for rejection..."
                      placeholderTextColor="#64748b"
                      value={rejectionReason}
                      onChangeText={setRejectionReason}
                    />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <TouchableOpacity style={styles.confirmRejectBtn} onPress={() => handleReject(user.id)}>
                        <Text style={styles.btnText}>Confirm Rejection</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => setRejectingId(null)}>
                        <Text style={styles.btnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },
  emptyBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyText: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  userInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  userRole: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
  },
  userMobile: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  reviewBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewBadgeText: {
    color: '#f59e0b',
    fontWeight: '800',
    fontSize: 10,
  },
  detailsBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  detailItem: {
    color: '#e2e8f0',
    fontSize: 12,
    marginBottom: 4,
  },
  detailBio: {
    color: '#94a3b8',
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  approveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    paddingVertical: 10,
    borderRadius: 8,
  },
  approveBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  rejectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  rejectBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  rejectForm: {
    marginTop: 10,
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 8,
  },
  reasonInput: {
    backgroundColor: '#1e293b',
    borderRadius: 6,
    padding: 8,
    color: '#ffffff',
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  confirmRejectBtn: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtn: {
    backgroundColor: '#475569',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 12,
  },
});
