import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Platform, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useUpdateAdvisorProfile } from '@/src/hooks/useAdvisorProfile';
import { uploadPhoto } from '@/src/api/uploads.api';
import { resolveMediaUrl } from '@/src/api/client';
import { lookupPincode } from '@/src/api/pincode.api';

const theme = RoleThemes.FARM_ADVISOR;

export default function AdvisorProfileScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const updateProfile = useUpdateAdvisorProfile();

  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(user?.photoUrl ?? null);
  const [specialization, setSpecialization] = useState(user?.specialization ?? '');
  const [bio, setBio] = useState(user?.bio ?? '');
  const [yearsExperience, setYearsExperience] = useState(user?.yearsExperience?.toString() ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [village, setVillage] = useState(user?.village ?? '');
  const [pincode, setPincode] = useState(user?.pincode ?? '');
  const [postOffice, setPostOffice] = useState(user?.postOffice ?? '');
  const [district, setDistrict] = useState(user?.district ?? '');
  const [state, setState] = useState(user?.state ?? '');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isPincodeLoading, setIsPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.notificationsEnabled ?? true);

  const fetchPincodeAddress = async (code: string) => {
    setPincodeError(null);
    setIsPincodeLoading(true);
    try {
      const result = await lookupPincode(code);
      setPostOffice(result.postOffice);
      setDistrict(result.district);
      setState(result.state);
    } catch (err: any) {
      setPincodeError(err?.message ?? 'Could not fetch address for this PIN code.');
    } finally {
      setIsPincodeLoading(false);
    }
  };

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add your picture.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled || !result.assets[0]) return;

    const uri = result.assets[0].uri;
    setLocalPhotoUri(uri);
    setIsUploadingPhoto(true);
    try {
      const uploaded = await uploadPhoto(uri);
      setPhotoUrl(uploaded.fileUrl);
    } catch {
      Alert.alert('Upload failed', 'Could not upload your photo. Please try again.');
      setLocalPhotoUri(null);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    try {
      await updateProfile.mutateAsync({
        photoUrl: photoUrl ?? undefined,
        specialization: specialization.trim() || undefined,
        bio: bio.trim() || undefined,
        yearsExperience: yearsExperience ? Number(yearsExperience) : undefined,
        email: email.trim() || undefined,
        village: village.trim() || undefined,
        pincode: pincode.trim() || undefined,
        postOffice: postOffice.trim() || undefined,
        district: district.trim() || undefined,
        state: state.trim() || undefined,
        notificationsEnabled,
      });
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Could not save your profile.');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.bg }]} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Advisor Profile</Text>
        <View style={{ width: 34 }} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Your Photograph</Text>
        <TouchableOpacity style={styles.photoPicker} onPress={pickPhoto} activeOpacity={0.85}>
          {localPhotoUri || photoUrl ? (
            <Image source={{ uri: localPhotoUri ?? resolveMediaUrl(photoUrl) }} style={styles.photoPreview} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Ionicons name="camera" size={26} color={theme.primary} />
            </View>
          )}
          <View style={styles.photoPickerText}>
            <Text style={styles.photoPickerTitle}>{photoUrl ? 'Change photo' : 'Add a photo'}</Text>
            {isUploadingPhoto && <ActivityIndicator size="small" color={theme.primary} />}
          </View>
        </TouchableOpacity>
      </View>

      {user?.kingId ? (
        <View style={[styles.section, { flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
          <Ionicons name="key-outline" size={13} color={theme.primary} />
          <Text style={[styles.sectionLabel, { color: theme.primary }]}>King ID: {user.kingId}</Text>
        </View>
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Specialization</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Rose & Floriculture, Wheat & Cereals"
          placeholderTextColor="#94a3b8"
          value={specialization}
          onChangeText={setSpecialization}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 8"
          placeholderTextColor="#94a3b8"
          keyboardType="numeric"
          value={yearsExperience}
          onChangeText={setYearsExperience}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About / Bio</Text>
        <TextInput
          style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
          placeholder="Tell farmers about your background and expertise..."
          placeholderTextColor="#94a3b8"
          value={bio}
          onChangeText={setBio}
          multiline
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Contact Details</Text>
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#94a3b8" value={email} onChangeText={setEmail} />
        <TextInput style={[styles.input, { marginTop: 8 }]} placeholder="Village" placeholderTextColor="#94a3b8" value={village} onChangeText={setVillage} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PIN Code</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            style={[styles.input, { flex: 1 }]}
            placeholder="6-digit PIN"
            placeholderTextColor="#94a3b8"
            keyboardType="numeric"
            maxLength={6}
            value={pincode}
            onChangeText={(t) => {
              setPincode(t);
              if (t.length === 6) fetchPincodeAddress(t);
            }}
          />
          <TouchableOpacity
            style={[styles.fetchButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.85}
            disabled={isPincodeLoading || pincode.length !== 6}
            onPress={() => fetchPincodeAddress(pincode)}
          >
            {isPincodeLoading ? <ActivityIndicator color="#ffffff" size="small" /> : <Text style={styles.fetchButtonText}>Fetch</Text>}
          </TouchableOpacity>
        </View>
        {pincodeError ? <Text style={styles.errorText}>{pincodeError}</Text> : null}

        {postOffice ? (
          <>
            <Text style={[styles.sectionLabel, { marginTop: 8 }]}>Post Office</Text>
            <TextInput style={styles.input} value={postOffice} onChangeText={setPostOffice} />
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
              <View style={[styles.readOnlyBox, { flex: 1 }]}>
                <Text style={styles.readOnlyLabel}>District</Text>
                <Text style={styles.readOnlyValue}>{district}</Text>
              </View>
              <View style={[styles.readOnlyBox, { flex: 1 }]}>
                <Text style={styles.readOnlyLabel}>State</Text>
                <Text style={styles.readOnlyValue}>{state}</Text>
              </View>
            </View>
          </>
        ) : null}
      </View>

      <View style={styles.section}>
        <View style={styles.notificationRow}>
          <View style={styles.notificationIconBg}>
            <Ionicons name="notifications-outline" size={16} color={theme.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.notificationLabel}>Push Notifications</Text>
            <Text style={styles.notificationSubLabel}>Assignments, messages & updates</Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: '#cbd5e1', true: theme.primary }}
            thumbColor="#ffffff"
          />
        </View>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {saved ? <Text style={styles.savedText}>Profile saved ✓</Text> : null}

      <TouchableOpacity
        style={[styles.saveButton, premiumShadow(theme.primary, 'md')]}
        disabled={updateProfile.isPending}
        onPress={handleSave}
      >
        {updateProfile.isPending ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveButtonText}>Save Profile</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: SPACING.lg, paddingBottom: SPACING.xxl, gap: SPACING.lg },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  section: { gap: 8 },
  sectionLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  notificationRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  notificationIconBg: { width: 32, height: 32, borderRadius: RADIUS.md, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' },
  notificationLabel: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a' },
  notificationSubLabel: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  photoPicker: { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#ffffff', borderRadius: RADIUS.lg, borderWidth: 1.5, borderColor: '#e2e8f0', padding: SPACING.md },
  photoPreview: { width: 56, height: 56, borderRadius: RADIUS.pill },
  photoPlaceholder: { width: 56, height: 56, borderRadius: RADIUS.pill, backgroundColor: RoleThemes.FARM_ADVISOR.primaryLight, alignItems: 'center', justifyContent: 'center' },
  photoPickerText: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  photoPickerTitle: { fontSize: 14, fontFamily: FONT.bold, color: theme.primary },
  input: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: RADIUS.lg, paddingHorizontal: 12, paddingVertical: 12, fontSize: 14, fontFamily: FONT.medium, backgroundColor: '#ffffff', color: '#0f172a' },
  fetchButton: { paddingHorizontal: 18, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  fetchButtonText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 13 },
  readOnlyBox: { backgroundColor: '#f1f5f9', borderRadius: RADIUS.lg, padding: 10 },
  readOnlyLabel: { fontSize: 10.5, fontFamily: FONT.bold, color: '#94a3b8' },
  readOnlyValue: { fontSize: 13, fontFamily: FONT.semiBold, color: '#334155', marginTop: 2 },
  errorText: { color: '#dc2626', fontFamily: FONT.semiBold, fontSize: 13 },
  savedText: { color: '#16a34a', fontFamily: FONT.bold, fontSize: 13 },
  saveButton: { backgroundColor: theme.primary, borderRadius: RADIUS.lg, paddingVertical: 16, alignItems: 'center' },
  saveButtonText: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
});
