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
import { useMyAdvisor } from '@/src/hooks/useAdvisorAssignments';

interface CropCompletionReviewModalProps {
  visible: boolean;
  crop: RegisteredCropField | null;
  onClose: () => void;
  onSubmitReview: (cropId: string, review: CropCompletionReview) => Promise<void>;
}

const DOCTOR_GRADES = [
  { key: 'EXCELLENT', label: '🏅 Excellent', color: '#15803d', bg: '#f0fdf4', border: '#86efac' },
  { key: 'GOOD', label: '🎖️ Good', color: '#0369a1', bg: '#f0f9ff', border: '#7dd3fc' },
  { key: 'AVERAGE', label: '👍 Average', color: '#b45309', bg: '#fefce8', border: '#fde047' },
  { key: 'NEEDS_IMPROVEMENT', label: '⚠️ Needs Work', color: '#c2410c', bg: '#fff7ed', border: '#fdba74' },
  { key: 'POOR', label: '❌ Poor', color: '#b91c1c', bg: '#fef2f2', border: '#fca5a5' },
];

export function CropCompletionReviewModal({
  visible,
  crop,
  onClose,
  onSubmitReview,
}: CropCompletionReviewModalProps) {
  const { data: myAdvisor } = useMyAdvisor();

  const [farmskingRating, setFarmskingRating] = useState<number>(5);
  const [benefitAmount, setBenefitAmount] = useState<string>('');
  const [farmskingFeedback, setFarmskingFeedback] = useState<string>('');

  const [doctorRating, setDoctorRating] = useState<number>(5);
  const [doctorGrade, setDoctorGrade] = useState<string>('EXCELLENT');
  const [doctorFeedback, setDoctorFeedback] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!crop) return null;

  // Doctor rating section ONLY shows if this specific crop was adopted/assigned by a doctor
  const hasAssignedDoctor =
    (crop.advisorStatus && crop.advisorStatus !== 'NONE') ||
    Boolean(crop.assignedSchedule);

  const doctorName = myAdvisor?.name
    ? `Dr. ${myAdvisor.name}`
    : 'Assigned Crop Doctor';

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, premiumShadow('#000000', 'lg')]}>
          {/* Header */}
          <LinearGradient colors={['#15803d', '#166534']} style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.headerBadgeWrap}>
                <Ionicons name="checkmark-done-circle" size={14} color="#86efac" />
                <Text style={styles.headerBadge}>CROP COMPLETION REVIEW</Text>
              </View>
              <Text style={styles.cropTitle} numberOfLines={1}>
                {crop.cropName} <Text style={styles.fieldSub}>({crop.fieldName})</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
              <Ionicons name="close" size={18} color="#ffffff" />
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.body} contentContainerStyle={{ gap: 12, paddingBottom: 16 }} keyboardShouldPersistTaps="handled">
            {/* SECTION 1: FARMSKING APP BENEFIT & RATING */}
            <View style={styles.sectionBox}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sparkles" size={16} color="#16a34a" />
                <Text style={styles.sectionTitle}>App Rating & Extra Profit</Text>
              </View>

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
                      size={24}
                      color={star <= farmskingRating ? '#f59e0b' : '#cbd5e1'}
                    />
                  </TouchableOpacity>
                ))}
                <Text style={styles.starLabel}>{farmskingRating}/5</Text>
              </View>

              {/* Profit Input */}
              <Text style={styles.fieldLabel}>Estimated Extra Profit / Savings (₹)</Text>
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
              <Text style={styles.fieldLabel}>App Feedback (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="Share your experience with FarmsKing..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
                value={farmskingFeedback}
                onChangeText={setFarmskingFeedback}
              />
            </View>

            {/* SECTION 2: DOCTOR / ADVISOR GRADING & RATING (ONLY IF DOCTOR ADOPTED/ASSIGNED THIS CROP) */}
            {hasAssignedDoctor && (
              <View style={[styles.sectionBox, styles.doctorSectionBox]}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="medical" size={16} color="#0284c7" />
                  <Text style={[styles.sectionTitle, { color: '#0369a1' }]}>Doctor Rating & Grading</Text>
                  <View style={styles.doctorBadge}>
                    <Text style={styles.doctorBadgeText}>{doctorName}</Text>
                  </View>
                </View>

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
                        size={24}
                        color={star <= doctorRating ? '#f59e0b' : '#cbd5e1'}
                      />
                    </TouchableOpacity>
                  ))}
                  <Text style={styles.starLabel}>{doctorRating}/5</Text>
                </View>

                {/* Doctor Grade Pills */}
                <Text style={styles.fieldLabel}>Doctor Performance Tag</Text>
                <View style={styles.gradeGrid}>
                  {DOCTOR_GRADES.map((g) => {
                    const isSelected = doctorGrade === g.key;
                    return (
                      <TouchableOpacity
                        key={g.key}
                        style={[
                          styles.gradePill,
                          { backgroundColor: g.bg, borderColor: isSelected ? g.color : g.border },
                          isSelected && { borderWidth: 1.5 },
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
                <Text style={styles.fieldLabel}>Doctor Feedback (Optional)</Text>
                <TextInput
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Feedback for advisor guidance..."
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
                <Ionicons name="checkmark-circle" size={18} color="#ffffff" />
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Submitting...' : 'Submit & Complete Crop 🏁'}
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
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    padding: SPACING.md,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.xl,
    maxHeight: '88%',
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  headerBadge: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#86efac',
    letterSpacing: 0.5,
  },
  cropTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  fieldSub: {
    fontSize: 13,
    fontFamily: FONT.medium,
    color: '#dcfce7',
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    padding: SPACING.md,
  },
  sectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
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
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#15803d',
    flex: 1,
  },
  doctorBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  doctorBadgeText: {
    fontSize: 11,
    fontFamily: FONT.bold,
    color: '#0369a1',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  starBtn: {
    padding: 1,
  },
  starLabel: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#d97706',
    marginLeft: 6,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#475569',
    marginTop: 6,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: RADIUS.md,
    paddingHorizontal: 10,
    height: 38,
  },
  currencySymbol: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#16a34a',
    marginRight: 4,
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
    borderRadius: RADIUS.md,
    padding: 8,
    height: 48,
    textAlignVertical: 'top',
  },
  gradeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginVertical: 4,
  },
  gradePill: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
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
    gap: 6,
  },
  submitBtnText: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
