import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RegisteredCropField, CropCompletionReview } from '@/src/store/crops-context';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';

interface CropCompletionReviewModalProps {
  visible: boolean;
  crop: RegisteredCropField | null;
  onClose: () => void;
  onSubmitReview: (cropId: string, review: CropCompletionReview) => Promise<void>;
}

const DOCTOR_GRADES = [
  { key: 'EXCELLENT', label: '🏅 Excellent (5★)', color: '#16a34a', bg: '#f0fdf4' },
  { key: 'GOOD', label: '🎖️ Good (4★)', color: '#0284c7', bg: '#f0f9ff' },
  { key: 'AVERAGE', label: '👍 Average (3★)', color: '#d97706', bg: '#fffbe finished' },
  { key: 'NEEDS_IMPROVEMENT', label: '⚠️ Needs Improvement (2★)', color: '#ea580c', bg: '#fff7ed' },
  { key: 'POOR', label: '❌ Poor (1★)', color: '#dc2626', bg: '#fef2f2' },
];

export function CropCompletionReviewModal({
  visible,
  crop,
  onClose,
  onSubmitReview,
}: CropCompletionReviewModalProps) {
  const [farmskingRating, setFarmskingRating] = useState<number>(5);
  const [benefitAmount, setBenefitAmount] = useState<string>('');
  const [farmskingFeedback, setFarmskingFeedback] = useState<string>('');

  const [doctorRating, setDoctorRating] = useState<number>(5);
  const [doctorGrade, setDoctorGrade] = useState<string>('EXCELLENT');
  const [doctorFeedback, setDoctorFeedback] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!crop) return null;

  const hasAssignedDoctor = crop.advisorStatus !== 'NONE' || Boolean(crop.assignedSchedule);
  const doctorName = crop.assignedSchedule ? 'Dr. Assigned Advisor' : 'Crop Doctor / Advisor';

  const tap = () => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRatingChange = (stars: number, target: 'FARMSKING' | 'DOCTOR') => {
    tap();
    if (target === 'FARMSKING') {
      setFarmskingRating(stars);
    } else {
      setDoctorRating(stars);
      if (stars === 5) setDoctorGrade('EXCELLENT');
      else if (stars === 4) setDoctorGrade('GOOD');
      else if (stars === 3) setDoctorGrade('AVERAGE');
      else if (stars === 2) setDoctorGrade('NEEDS_IMPROVEMENT');
      else setDoctorGrade('POOR');
    }
  };

  const handleSubmit = async () => {
    tap();
    setIsSubmitting(true);
    try {
      const reviewPayload: CropCompletionReview = {
        farmskingRating,
        farmskingBenefitAmount: benefitAmount.trim() ? `₹${benefitAmount.replace(/[^0-9]/g, '')}` : undefined,
        farmskingFeedback: farmskingFeedback.trim() || undefined,
        doctorRating: hasAssignedDoctor ? doctorRating : undefined,
        doctorGrade: hasAssignedDoctor ? doctorGrade : undefined,
        doctorFeedback: hasAssignedDoctor && doctorFeedback.trim() ? doctorFeedback.trim() : undefined,
        doctorName: hasAssignedDoctor ? doctorName : undefined,
        completedAt: new Date().toISOString(),
      };

      await onSubmitReview(crop.id, reviewPayload);
      onClose();
    } catch {
      // handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, premiumShadow('#000000', 'lg')]}>
          {/* Header */}
          <LinearGradient colors={['#16a34a', '#15803d']} style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerBadge}>🏁 CROP COMPLETION & REVIEW</Text>
              </View>
              <Text style={styles.cropTitle} numberOfLines={1}>
                {crop.cropName} ({crop.fieldName})
              </Text>
              <Text style={styles.headerSub}>
                ਫਸਲ ਪੂਰੀ ਹੋਣ 'ਤੇ ਆਪਣਾ ਅਨੁਭਵ ਅਤੇ ਡਾਕਟਰ ਦੀ ਗ੍ਰੇਡਿੰਗ ਦਿਓ
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
            {/* SECTION 1: FARMSKING APP BENEFIT & RATING */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={18} color="#16a34a" />
                <Text style={styles.sectionTitle}>1. FarmsKing App Benefit & Rating</Text>
              </View>
              <Text style={styles.questionText}>
                FarmsKing App ਨਾਲ ਇਸ ਫਸਲ ਵਿੱਚ ਤੁਹਾਨੂੰ ਕਿੰਨਾ ਫਾਇਦਾ ਹੋਇਆ?
              </Text>

              {/* Star Rating Bar */}
              <View style={styles.starRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => handleRatingChange(star, 'FARMSKING')}
                    style={styles.starBtn}
                  >
                    <Ionicons
                      name={star <= farmskingRating ? 'star' : 'star-outline'}
                      size={28}
                      color={star <= farmskingRating ? '#f59e0b' : '#cbd5e1'}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.starLabel}>{farmskingRating} / 5 Stars</Text>
              </View>

              {/* Profit / Benefit Input */}
              <Text style={styles.fieldLabel}>ਮੁਨਾਫਾ / ਬਚਤ (Estimated Extra Profit / Benefit ₹):</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.currencySymbol}>₹</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 25000"
                  placeholderTextColor="#94a3b8"
                  keyboardType="numeric"
                  value={benefitAmount}
                  onChangeText={setBenefitAmount}
                />
              </View>

              {/* Feedback Input */}
              <Text style={styles.fieldLabel}>ਤੁਹਾਡਾ ਅਨੁਭਵ / ਸੁਝਾਅ (Feedback Comments):</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="FarmsKing app ਨਾਲ ਤੁਹਾਡਾ ਅਨੁਭਵ ਕਿਵੇਂ ਰਿਹਾ? ਸੁਝਾਅ ਲਿਖੋ..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={3}
                value={farmskingFeedback}
                onChangeText={setFarmskingFeedback}
              />
            </View>

            {/* SECTION 2: DOCTOR / ADVISOR GRADING & RATING */}
            {hasAssignedDoctor && (
              <View style={[styles.sectionBox, styles.doctorSectionBox]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="medical" size={18} color="#0284c7" />
                  <Text style={[styles.sectionTitle, { color: '#0369a1' }]}>
                    2. Crop Doctor / Advisor Rating & Grading
                  </Text>
                </View>
                <View style={styles.doctorInfoCard}>
                  <Ionicons name="person-circle-outline" size={24} color="#0284c7" />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.doctorNameText}>{doctorName}</Text>
                    <Text style={styles.doctorSubText}>Assigned Advisor for {crop.cropName}</Text>
                  </View>
                </View>

                <Text style={styles.questionText}>
                  ਤੁਹਾਡੇ Doctor ਦੀ ਸਲਾਹ ਅਤੇ ਗਾਈਡੈਂਸ ਕਿਵੇਂ ਰਹੀ? (Doctor Rating):
                </Text>

                {/* Doctor Star Rating Bar */}
                <View style={styles.starRow}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      activeOpacity={0.7}
                      onPress={() => handleRatingChange(star, 'DOCTOR')}
                      style={styles.starBtn}
                    >
                      <Ionicons
                        name={star <= doctorRating ? 'star' : 'star-outline'}
                        size={26}
                        color={star <= doctorRating ? '#f59e0b' : '#cbd5e1'}
                      />
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.starLabel}>{doctorRating} / 5 Stars</Text>
                </View>

                {/* Doctor Grade Pills */}
                <Text style={styles.fieldLabel}>Doctor Grading Tag:</Text>
                <View style={styles.gradeGrid}>
                  {DOCTOR_GRADES.map((g) => {
                    const isSelected = doctorGrade === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.gradePill,
                          { backgroundColor: g.bg, borderColor: isSelected ? g.color : '#e2e8f0' },
                          isSelected && { borderWidth: 2 },
                        ]}
                        activeOpacity={0.8}
                        onPress={() => {
                          tap();
                          setDoctorGrade(g.key);
                        }}
                      >
                        <Text style={[styles.gradePillText, { color: g.color }]}>{g.label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Doctor Feedback Comment */}
                <Text style={styles.fieldLabel}>Doctor Feedback Comment:</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Doctor ਦੀਆਂ ਦਿੱਤੀਆਂ ਸਲਾਹਾਂ ਬਾਰੇ ਆਪਣੀ ਰਾਇ ਦੱਸੋ..."
                  placeholderTextColor="#94a3b8"
                  multiline
                  numberOfLines={2}
                  value={doctorFeedback}
                  onChangeText={setDoctorFeedback}
                />
              </View>
            )}

            {/* ACTION BUTTON */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
              activeOpacity={0.85}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <LinearGradient colors={['#16a34a', '#15803d']} style={styles.submitGradient}>
                <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Submitting...' : 'Complete Crop & Submit Review 🏁'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
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
    padding: SPACING.md,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBadge: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#dcfce7',
    letterSpacing: 0.5,
  },
  cropTitle: {
    fontSize: 17,
    fontFamily: FONT.bold,
    color: '#ffffff',
    marginTop: 2,
  },
  headerSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#f0fdf4',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: SPACING.md,
  },
  sectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  doctorSectionBox: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
  questionText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
    marginBottom: 8,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  starBtn: {
    padding: 2,
  },
  starLabel: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#f59e0b',
    marginLeft: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#475569',
    marginTop: 8,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.sm,
    paddingHorizontal: 10,
    height: 40,
  },
  currencySymbol: {
    fontSize: 15,
    fontFamily: FONT.bold,
    color: '#16a34a',
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  multilineInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.sm,
    padding: 8,
    height: 64,
    textAlignVertical: 'top',
  },
  doctorInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    padding: 8,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: '#e0f2fe',
    marginBottom: 10,
  },
  doctorNameText: {
    fontSize: 13,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  doctorSubText: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 6,
  },
  gradePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  gradePillText: {
    fontSize: 11,
    fontFamily: FONT.bold,
  },
  submitBtn: {
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginTop: 4,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
