import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AdvisorRatingModalProps {
  visible: boolean;
  onClose: () => void;
  advisorName?: string;
  cropName?: string;
  onSubmitRating: (stars: number, comment: string) => Promise<void>;
}

export const AdvisorRatingModal: React.FC<AdvisorRatingModalProps> = ({
  visible,
  onClose,
  advisorName = 'Farm Advisor',
  cropName = 'Active Crop',
  onSubmitRating,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleStarPress = (starIndex: number) => {
    setRating(starIndex);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmitRating(rating, comment);
      setIsSubmitting(false);
      Alert.alert('Thank You!', 'Your feedback has been submitted successfully.');
      setComment('');
      onClose();
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('Error', 'Unable to submit feedback. Please try again.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Ionicons name="star" size={24} color="#eab308" />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.title}>Rate Your Advisor</Text>
          <Text style={styles.subtitle}>
            Provide rating & feedback for the advice received from {advisorName} on {cropName}
          </Text>

          {/* Star Selector */}
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => handleStarPress(star)}
                activeOpacity={0.7}
                style={styles.starTouch}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={36}
                  color={star <= rating ? '#eab308' : '#cbd5e1'}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingText}>
            {rating === 5 && '🌟 Excellent (5 Stars)'}
            {rating === 4 && '👍 Very Good (4 Stars)'}
            {rating === 3 && '🙂 Average (3 Stars)'}
            {rating === 2 && '😐 Below Average (2 Stars)'}
            {rating === 1 && '😞 Poor (1 Star)'}
          </Text>

          {/* Comment Box */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Write your feedback (e.g. Advice was very helpful...)"
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
            />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitText}>Submit Rating</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fef9c3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 8,
  },
  starTouch: {
    padding: 4,
  },
  ratingText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 16,
  },
  inputContainer: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 10,
    marginBottom: 18,
  },
  textInput: {
    fontSize: 13,
    color: '#0f172a',
    minHeight: 60,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#475569',
  },
  submitBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#16a34a',
    alignItems: 'center',
  },
  submitText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
