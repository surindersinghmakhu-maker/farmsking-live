import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { getFarmerPendingBanner, submitFarmerTrainingRating } from '@/src/api/trainers.api';

export function FarmerTrainingRatingBanner() {
  const [pendingInfo, setPendingInfo] = useState<{
    hasPending: boolean;
    training: { id: string; trainerName: string; trainerMobile: string; status: string } | null;
  } | null>(null);
  const [selectedRating, setSelectedRating] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingBanner();
  }, []);

  const fetchPendingBanner = async () => {
    try {
      const res = await getFarmerPendingBanner();
      if (res?.hasPending && res.training) {
        setPendingInfo(res);
      }
    } catch {
      // Best effort
    }
  };

  const handleSubmitRating = async (rating: number) => {
    setIsSubmitting(true);
    try {
      const res = await submitFarmerTrainingRating(rating);
      setSuccessMsg(res.message || '✨ Thank you! Your training feedback has been submitted successfully.');
      setTimeout(() => {
        setPendingInfo(null);
      }, 2000);
    } catch {
      setIsSubmitting(false);
    }
  };

  if (!pendingInfo?.hasPending || !pendingInfo.training) return null;

  return (
    <View style={[styles.container, premiumShadow('#15803d', 'sm')]}>
      <View style={styles.headerRow}>
        <View style={styles.iconBg}>
          <Ionicons name="school" size={20} color="#15803d" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>🎓 FarmsKing App Training Feedback</Text>
          <Text style={styles.subTitle}>
            Technical Staff <Text style={{ fontFamily: FONT.bold }}>{pendingInfo.training.trainerName}</Text> ji guided you on FarmsKing App. Rate your training:
          </Text>
        </View>
      </View>

      {successMsg ? (
        <View style={styles.successBox}>
          <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
          <Text style={styles.successText}>{successMsg}</Text>
        </View>
      ) : (
        <View style={styles.ratingBox}>
          <Text style={styles.ratingLabel}>Rate your training experience (1 to 5 Stars):</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                activeOpacity={0.7}
                onPress={() => setSelectedRating(star)}
                style={styles.starBtn}
              >
                <Ionicons
                  name={star <= selectedRating ? 'star' : 'star-outline'}
                  size={28}
                  color={star <= selectedRating ? '#f59e0b' : '#cbd5e1'}
                />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.submitBtn}
            disabled={isSubmitting}
            onPress={() => handleSubmitRating(selectedRating)}
            activeOpacity={0.85}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Submit Rating ({selectedRating} Stars)</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#bbf7d0',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: 12,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBg: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#15803d',
  },
  subTitle: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#166534',
    marginTop: 1,
  },
  ratingBox: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.md,
    padding: 12,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  ratingLabel: {
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  starBtn: {
    padding: 4,
  },
  submitBtn: {
    backgroundColor: '#16a34a',
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#dcfce7',
    borderRadius: RADIUS.md,
    padding: 10,
  },
  successText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#15803d',
  },
});
