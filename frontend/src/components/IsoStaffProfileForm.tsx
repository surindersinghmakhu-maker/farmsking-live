import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../api/client';

interface IsoStaffProfileFormProps {
  user: any;
  onProfileSubmitted: () => void;
}

export const IsoStaffProfileForm: React.FC<IsoStaffProfileFormProps> = ({ user, onProfileSubmitted }) => {
  const [qualification, setQualification] = useState(user?.qualification || '');
  const [profileTitle, setProfileTitle] = useState(user?.profileTitle || '');
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  const [yearsExperience, setYearsExperience] = useState(user?.yearsExperience ? String(user.yearsExperience) : '');
  const [bio, setBio] = useState(user?.bio || '');
  const [photoUrl, setPhotoUrl] = useState(user?.photoUrl || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [bankAccountNo, setBankAccountNo] = useState(user?.bankAccountNumber || '');
  const [bankIfsc, setBankIfsc] = useState(user?.bankIfsc || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(user?.bankAccountHolderName || '');
  const [panNumber, setPanNumber] = useState(user?.panNumber || '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!qualification.trim() || !specialization.trim() || !upiId.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in Qualification, Specialization, and UPI ID for payout verification.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/users/submit-profile-completion', {
        qualification,
        profileTitle: profileTitle || user?.role,
        specialization,
        yearsExperience: Number(yearsExperience) || 1,
        bio,
        photoUrl,
        upiId,
        bankAccountNumber: bankAccountNo,
        bankIfsc,
        bankAccountHolderName: bankAccountHolder,
        panNumber,
      });

      Alert.alert(
        'Profile Submitted',
        'Your profile credentials have been submitted to the Admin for ISO verification & approval.',
      );
      onProfileSubmitted();
    } catch (e: any) {
      Alert.alert('Submission Error', e?.response?.data?.message || 'Failed to submit profile details.');
    } finally {
      setSubmitting(false);
    }
  };

  const isUnderReview = user?.profileStatus === 'UNDER_REVIEW';
  const isRejected = user?.profileStatus === 'REJECTED';

  if (isUnderReview) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Ionicons name="time" size={64} color="#f59e0b" style={{ alignSelf: 'center', marginBottom: 16 }} />
          <Text style={styles.title}>Profile Under Review</Text>
          <Text style={styles.subtitle}>
            Your staff/expert profile credentials have been received and are currently being verified by the ISO Compliance Admin.
          </Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>STATUS: UNDER ADMIN VERIFICATION</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Ionicons name="ribbon" size={28} color="#16a34a" />
          <Text style={styles.headerTitle}>ISO Staff & Expert Profile Verification</Text>
        </View>
        <Text style={styles.headerSubtitle}>
          Complete your professional profile credentials to get approved by Admin and unlock full role permissions.
        </Text>

        {isRejected && (
          <View style={styles.rejectedBanner}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
            <Text style={styles.rejectedText}>
              Previous submission rejected: {user?.profileRejectionReason || 'Please update your credentials.'}
            </Text>
          </View>
        )}

        <Text style={styles.inputLabel}>Staff ID / Assigned Role</Text>
        <View style={styles.readOnlyBox}>
          <Text style={styles.readOnlyText}>
            ID: {user?.assignedStaffId || user?.kingId} | Role: {user?.role}
          </Text>
        </View>

        <Text style={styles.inputLabel}>Qualification / Degree *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. B.Sc Agriculture, M.Sc Horticulture, Certified Trainer"
          placeholderTextColor="#64748b"
          value={qualification}
          onChangeText={setQualification}
        />

        <Text style={styles.inputLabel}>Specialization *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Pest Management, Organic Gardening, Irrigation"
          placeholderTextColor="#64748b"
          value={specialization}
          onChangeText={setSpecialization}
        />

        <Text style={styles.inputLabel}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 5"
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={yearsExperience}
          onChangeText={setYearsExperience}
        />

        <Text style={styles.inputLabel}>Professional Bio / Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="Brief introduction about your experience and expertise..."
          placeholderTextColor="#64748b"
          multiline
          value={bio}
          onChangeText={setBio}
        />

        <Text style={styles.sectionHeader}>Payout & Bank Verification</Text>

        <Text style={styles.inputLabel}>UPI ID (For Direct Payouts) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. yourname@upi"
          placeholderTextColor="#64748b"
          value={upiId}
          onChangeText={setUpiId}
        />

        <Text style={styles.inputLabel}>Bank Account Number</Text>
        <TextInput
          style={styles.input}
          placeholder="Account Number"
          placeholderTextColor="#64748b"
          value={bankAccountNo}
          onChangeText={setBankAccountNo}
        />

        <Text style={styles.inputLabel}>Bank IFSC Code</Text>
        <TextInput
          style={styles.input}
          placeholder="IFSC Code"
          placeholderTextColor="#64748b"
          value={bankIfsc}
          onChangeText={setBankIfsc}
        />

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Profile For ISO Approval</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    padding: 16,
  },
  card: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    marginLeft: 10,
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  title: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  statusBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  statusText: {
    color: '#f59e0b',
    fontWeight: '700',
    fontSize: 12,
  },
  rejectedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  rejectedText: {
    color: '#f87171',
    fontSize: 13,
    flex: 1,
  },
  inputLabel: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  readOnlyBox: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  readOnlyText: {
    color: '#38bdf8',
    fontWeight: '700',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#ffffff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    color: '#f59e0b',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
    paddingBottom: 6,
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 28,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 15,
  },
});
