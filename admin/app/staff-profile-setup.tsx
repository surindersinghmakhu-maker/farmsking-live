import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { apiClient } from '@/src/api/client';

const ROLE_LABELS: Record<string, { title: string; color: string; icon: string; description: string }> = {
  TECHNICAL_TRAINER: {
    title: 'Technical Trainer (Employee)',
    color: '#7c3aed',
    icon: 'school',
    description: 'Provide web application training to staff and farmers. Only basic employee information is required.',
  },
  DOCTOR: {
    title: 'Crop Doctor / Farm Doctor',
    color: '#dc2626',
    icon: 'medkit',
    description: 'Provide expert crop health consultations. Complete your profile for admin approval.',
  },
  FARM_ADVISOR: {
    title: 'Crop Advisor',
    color: '#0369a1',
    icon: 'leaf',
    description: 'Advise farmers on crop management. Complete your profile for admin approval.',
  },
};

const SPECIALIZATION_OPTIONS: Record<string, string[]> = {
  TECHNICAL_TRAINER: ['Web Application Training', 'Digital Tools', 'System Support', 'Other'],
  DOCTOR: ['Crop Disease Diagnosis', 'Pest Management', 'Soil Health', 'Organic Farming', 'Vegetable Crops', 'Fruit Crops', 'Other'],
  FARM_ADVISOR: ['Wheat/Paddy', 'Vegetables', 'Fruit Crops', 'Organic Farming', 'Water Management', 'Other'],
};

export default function StaffProfileSetupScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const roleKey = user?.role || 'TECHNICAL_TRAINER';
  const isTechnicalTrainer = roleKey === 'TECHNICAL_TRAINER';
  const roleMeta = ROLE_LABELS[roleKey] || ROLE_LABELS['TECHNICAL_TRAINER'];
  const specializationList = SPECIALIZATION_OPTIONS[roleKey] || [];

  const [fullName, setFullName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [qualification, setQualification] = useState('');
  const [experience, setExperience] = useState('');
  const [specialization, setSpecialization] = useState(isTechnicalTrainer ? 'Web Application Training' : '');
  const [phone, setPhone] = useState(user?.mobile || '');
  const [area, setArea] = useState('');
  const [city, setCity] = useState(user?.district || '');
  const [state, setState] = useState(user?.state || '');
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isAlreadySubmitted = !!(user as any)?.staffProfileSubmitted || user?.profileStatus === 'UNDER_REVIEW' || user?.profileStatus === 'APPROVED';

  const handleSubmit = async () => {
    if (!fullName.trim()) return alert('Please enter your full name.');
    if (!city.trim()) return alert('Please enter your city/district.');

    if (!isTechnicalTrainer) {
      if (!bio.trim() || bio.trim().length < 30) return alert('Please write a bio of at least 30 characters.');
      if (!qualification.trim()) return alert('Please enter your qualification.');
      if (!experience.trim()) return alert('Please enter your years of experience.');
      if (!specialization) return alert('Please select your specialization.');
    }

    setSaving(true);
    try {
      await apiClient.post('/users/submit-profile-completion', {
        name: fullName.trim(),
        bio: isTechnicalTrainer ? 'Technical Trainer employee for web application training.' : bio.trim(),
        qualification: isTechnicalTrainer ? 'Technical Employee' : qualification.trim(),
        yearsExperience: isTechnicalTrainer ? 1 : (Number(experience) || 0),
        specialization: specialization || 'Web Application Training',
        mobile: phone.trim() || undefined,
        area: area.trim() || undefined,
        city: city.trim(),
        state: state.trim() || undefined,
      });

      await refreshUser();
      setSubmitted(true);
    } catch (err: any) {
      setSubmitted(true);
    } finally {
      setSaving(false);
    }
  };

  if (isAlreadySubmitted || submitted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[roleMeta.color, '#0f172a']} style={styles.header}>
          <View style={{ alignItems: 'center', paddingTop: 30, paddingBottom: 16 }}>
            <Ionicons name="checkmark-circle" size={54} color="#ffffff" />
            <Text style={styles.headerTitle}>{isTechnicalTrainer ? 'Basic Employee Info Saved!' : 'Profile Submitted!'}</Text>
          </View>
        </LinearGradient>

        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.pendingCard}>
            <View style={[styles.pendingIcon, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="school" size={32} color="#16a34a" />
            </View>
            <Text style={styles.pendingTitle}>Technical Trainer Ready</Text>
            <Text style={styles.pendingText}>
              Basic information updated for Technical Trainer.{'\n'}
              You can now proceed to conduct web application training.
            </Text>

            <TouchableOpacity
              style={[styles.backHomeBtn, { backgroundColor: roleMeta.color }]}
              onPress={() => router.replace('/(partner)/(tabs)' as any)}
            >
              <Ionicons name="home" size={18} color="#fff" />
              <Text style={styles.backHomeBtnText}>Go to Web Training Dashboard</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[roleMeta.color, '#0f172a']} style={styles.header}>
        <View style={{ alignItems: 'center', paddingTop: Platform.OS === 'ios' ? 50 : 30, paddingBottom: 16 }}>
          <Ionicons name={roleMeta.icon as any} size={40} color="#ffffff" />
          <Text style={styles.headerTitle}>{roleMeta.title}</Text>
          <Text style={styles.headerSub}>
            {isTechnicalTrainer ? 'Basic Employee Information' : 'Complete Profile to Get Approved'}
          </Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle" size={20} color="#0369a1" />
          <Text style={styles.infoBannerText}>{roleMeta.description}</Text>
        </View>

        {/* Section: Basic Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Basic Information</Text>

          <Text style={styles.label}>Full Name *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} placeholder="Your full name" />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} placeholder="Contact number" keyboardType="phone-pad" />

          <Text style={styles.label}>City / District *</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} placeholder="e.g. Bathinda, Ludhiana" />

          <Text style={styles.label}>State</Text>
          <TextInput style={styles.input} value={state} onChangeText={setState} placeholder="e.g. Punjab" />
        </View>

        {/* Section: Professional details only for non-trainers */}
        {!isTechnicalTrainer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎓 Professional Details</Text>

            <Text style={styles.label}>Qualification / Education *</Text>
            <TextInput style={styles.input} value={qualification} onChangeText={setQualification} placeholder="e.g. B.Sc. Agriculture" />

            <Text style={styles.label}>Years of Experience *</Text>
            <TextInput style={styles.input} value={experience} onChangeText={setExperience} placeholder="e.g. 5" keyboardType="numeric" />

            <Text style={styles.label}>Specialization *</Text>
            <View style={styles.specGrid}>
              {specializationList.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.specChip, specialization === s && { backgroundColor: roleMeta.color, borderColor: roleMeta.color }]}
                  onPress={() => setSpecialization(s)}
                >
                  <Text style={[styles.specChipText, specialization === s && { color: '#fff' }]}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Professional Bio * (min. 30 characters)</Text>
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top', paddingTop: 10 }]}
              value={bio}
              onChangeText={setBio}
              placeholder="Tell us about your experience..."
              multiline
            />
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: roleMeta.color }, saving && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save" size={18} color="#fff" />
              <Text style={styles.submitBtnText}>
                {isTechnicalTrainer ? 'Save Basic Information' : 'Submit Profile for Admin Approval'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { paddingBottom: SPACING.xl },
  headerTitle: { fontSize: 22, fontFamily: FONT.extraBold, color: '#fff', marginTop: 8, textAlign: 'center' },
  headerSub: { fontSize: 13, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },

  body: { padding: SPACING.lg, paddingBottom: 60, gap: 16 },

  infoBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#e0f2fe', borderRadius: RADIUS.md, padding: 14 },
  infoBannerText: { flex: 1, fontSize: 13, fontFamily: FONT.medium, color: '#0369a1', lineHeight: 20 },

  section: {
    backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 12,
    borderWidth: 1, borderColor: '#e2e8f0', ...premiumShadow('#0f172a', 'sm'),
  },
  sectionTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 4 },

  label: { fontSize: 12, fontFamily: FONT.bold, color: '#475569' },
  input: {
    borderWidth: 1, borderColor: '#cbd5e1', borderRadius: RADIUS.md,
    paddingHorizontal: 14, paddingVertical: 11,
    fontSize: 14, fontFamily: FONT.medium, color: '#0f172a',
    backgroundColor: '#f8fafc',
  },

  specGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  specChip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: RADIUS.pill, borderWidth: 1.5, borderColor: '#e2e8f0',
    backgroundColor: '#f1f5f9',
  },
  specChipText: { fontSize: 12, fontFamily: FONT.bold, color: '#475569' },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 16, borderRadius: RADIUS.lg, marginTop: 8,
  },
  submitBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#fff' },

  pendingCard: {
    backgroundColor: '#ffffff', borderRadius: RADIUS.xl, padding: SPACING.xl, gap: 16,
    alignItems: 'center', ...premiumShadow('#0f172a', 'md'), marginTop: 20,
  },
  pendingIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  pendingTitle: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a' },
  pendingText: { fontSize: 14, fontFamily: FONT.medium, color: '#475569', textAlign: 'center', lineHeight: 22 },
  backHomeBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 14, paddingHorizontal: 32, borderRadius: RADIUS.pill, marginTop: 8,
  },
  backHomeBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#fff' },
});
