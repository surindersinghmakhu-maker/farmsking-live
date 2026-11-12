import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
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
  const [panDocUrl, setPanDocUrl] = useState(user?.panDocUrl || '');
  const [aadhaarLast4, setAadhaarLast4] = useState(user?.aadhaarLast4 || '');
  const [aadhaarDocUrl, setAadhaarDocUrl] = useState(user?.aadhaarDocUrl || '');
  const [termsAccepted, setTermsAccepted] = useState(Boolean(user?.termsAcceptedAt));
  const [submitting, setSubmitting] = useState(false);

  const pickKycPhoto = async (setter: (v: string) => void) => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        base64: true,
      });
      if (!res.canceled && res.assets?.[0]?.uri) {
        const uri = res.assets[0].base64
          ? `data:image/jpeg;base64,${res.assets[0].base64}`
          : res.assets[0].uri;
        setter(uri);
      }
    } catch {
      Alert.alert('Upload Failed', 'Could not pick image. Please try again.');
    }
  };

  const handleSubmit = async () => {
    const cleanPan = panNumber.trim().toUpperCase();
    const cleanIfsc = bankIfsc.trim().toUpperCase();
    const cleanAadhaar = aadhaarLast4.trim().replace(/\D/g, '');
    if (!qualification.trim() || !specialization.trim() || !upiId.trim()) {
      Alert.alert('Incomplete Form', 'Please fill in Qualification, Specialization, and UPI ID for payout verification.');
      return;
    }
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(cleanPan)) {
      Alert.alert('Valid PAN Required', 'Please enter a valid 10-character PAN (e.g. ABCDE1234F). PAN is mandatory under Income Tax TDS Sec 194-J/194-H to avoid 20% Sec 206AA deduction.');
      return;
    }
    if (!bankAccountNo.trim() || !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(cleanIfsc) || !bankAccountHolder.trim()) {
      Alert.alert('Bank Details Required', 'Please enter Account Holder Name, Bank Account Number, and valid 11-character IFSC Code.');
      return;
    }
    if (cleanAadhaar.length !== 4 || !aadhaarDocUrl) {
      Alert.alert('Aadhaar Verification Required', 'Please enter your Aadhaar last 4 digits and upload Aadhaar front/masked copy.');
      return;
    }
    if (!panDocUrl) {
      Alert.alert('PAN Photo Required', 'Please upload a clear photo of your PAN Card.');
      return;
    }
    if (!termsAccepted) {
      Alert.alert('Consent Required', 'Please accept FarmsKing Terms of Service, Privacy Policy & TDS Deduction Consent.');
      return;
    }

    try {
      setSubmitting(true);
      await apiClient.post('/users/submit-profile-completion', {
        qualification: qualification.trim(),
        profileTitle: profileTitle || user?.role,
        specialization: specialization.trim(),
        yearsExperience: Number(yearsExperience) || 1,
        bio: bio.trim(),
        photoUrl: photoUrl || undefined,
        upiId: upiId.trim(),
        bankAccountNumber: bankAccountNo.trim(),
        bankIfsc: cleanIfsc,
        bankAccountHolderName: bankAccountHolder.trim(),
        panNumber: cleanPan,
        panDocUrl,
        aadhaarLast4: cleanAadhaar,
        aadhaarDocUrl,
        termsAccepted: true,
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

        <Text style={styles.sectionHeader}>Statutory KYC, PAN &amp; Bank Verification</Text>

        <Text style={styles.inputLabel}>Profile Photo (Optional)</Text>
        <TouchableOpacity
          style={[styles.input, { flexDirection: 'row', alignItems: 'center', gap: 10 }]}
          onPress={() => pickKycPhoto(setPhotoUrl)}
        >
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={{ width: 32, height: 32, borderRadius: 16 }} />
          ) : (
            <Ionicons name="camera-outline" size={20} color="#38bdf8" />
          )}
          <Text style={{ color: '#cbd5e1', fontSize: 13 }}>
            {photoUrl ? 'Profile Photo Attached (Tap to change)' : 'Upload Profile / Passport Photo'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.inputLabel}>PAN Number (Mandatory for TDS Sec 194-J / 194-H) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. ABCDE1234F (10 chars)"
          placeholderTextColor="#64748b"
          value={panNumber}
          onChangeText={(t) => setPanNumber(t.toUpperCase())}
          maxLength={10}
          autoCapitalize="characters"
        />

        <TouchableOpacity
          style={[styles.input, { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
          onPress={() => pickKycPhoto(setPanDocUrl)}
        >
          <Ionicons name={panDocUrl ? 'checkmark-circle' : 'cloud-upload-outline'} size={20} color={panDocUrl ? '#16a34a' : '#f59e0b'} />
          <Text style={{ color: '#cbd5e1', fontSize: 13 }}>
            {panDocUrl ? 'PAN Card Photo Uploaded' : 'Upload PAN Card Photo *'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.inputLabel}>Aadhaar Last 4 Digits (Masked KYC Only) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Last 4 digits (e.g. 4321)"
          placeholderTextColor="#64748b"
          keyboardType="number-pad"
          maxLength={4}
          value={aadhaarLast4}
          onChangeText={(t) => setAadhaarLast4(t.replace(/\D/g, '').slice(0, 4))}
        />

        <TouchableOpacity
          style={[styles.input, { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 10 }]}
          onPress={() => pickKycPhoto(setAadhaarDocUrl)}
        >
          <Ionicons name={aadhaarDocUrl ? 'checkmark-circle' : 'cloud-upload-outline'} size={20} color={aadhaarDocUrl ? '#16a34a' : '#f59e0b'} />
          <Text style={{ color: '#cbd5e1', fontSize: 13 }}>
            {aadhaarDocUrl ? 'Aadhaar Copy Uploaded' : 'Upload Aadhaar Front / Masked Copy *'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.inputLabel}>UPI ID (For Direct Payouts) *</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. yourname@upi"
          placeholderTextColor="#64748b"
          value={upiId}
          onChangeText={setUpiId}
        />

        <Text style={styles.inputLabel}>Account Holder Name (As per Bank Passbook) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Full legal name matching PAN & Bank"
          placeholderTextColor="#64748b"
          value={bankAccountHolder}
          onChangeText={setBankAccountHolder}
        />

        <Text style={styles.inputLabel}>Bank Account Number *</Text>
        <TextInput
          style={styles.input}
          placeholder="Account Number"
          placeholderTextColor="#64748b"
          keyboardType="number-pad"
          value={bankAccountNo}
          onChangeText={setBankAccountNo}
        />

        <Text style={styles.inputLabel}>Bank IFSC Code *</Text>
        <TextInput
          style={styles.input}
          placeholder="IFSC Code (11 chars e.g. SBIN0001234)"
          placeholderTextColor="#64748b"
          maxLength={11}
          autoCapitalize="characters"
          value={bankIfsc}
          onChangeText={(t) => setBankIfsc(t.toUpperCase())}
        />

        <TouchableOpacity
          onPress={() => setTermsAccepted((v) => !v)}
          activeOpacity={0.85}
          style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 16, padding: 12, backgroundColor: '#0f172a', borderRadius: 10, borderWidth: 1, borderColor: termsAccepted ? '#16a34a' : '#334155' }}
        >
          <Ionicons name={termsAccepted ? 'checkbox' : 'square-outline'} size={20} color={termsAccepted ? '#16a34a' : '#64748b'} />
          <Text style={{ flex: 1, color: '#cbd5e1', fontSize: 12, lineHeight: 17 }}>
            I confirm that my KYC, PAN &amp; Bank details are genuine, consent to statutory Income Tax TDS deduction (Sec 194-J/194-H; 20% under Sec 206AA if PAN is invalid), and accept{' '}
            <Text style={{ color: '#38bdf8', textDecorationLine: 'underline' }} onPress={() => router.push('/terms' as any)}>Terms</Text>
            {' '}&amp;{' '}
            <Text style={{ color: '#38bdf8', textDecorationLine: 'underline' }} onPress={() => router.push('/privacy-policy' as any)}>Privacy Policy</Text>.
          </Text>
        </TouchableOpacity>

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
