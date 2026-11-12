import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import { useAuth } from '@/src/store/auth-context';
import { useProductReviews, useSubmitProductReview } from '@/src/hooks/useProducts';

interface ProductReviewsSectionProps {
  productId: string;
}

/**
 * Displays live product reviews from Postgres with verified-buyer badges
 * and allows signed-in customers to submit or update their honest review.
 */
export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ productId }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data, isLoading } = useProductReviews(productId);
  const submitReview = useSubmitProductReview(productId);

  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const total = data?.total ?? 0;
  const avgRating = data?.avgRating ?? null;
  const verifiedBuyerCount = data?.verifiedBuyerCount ?? 0;
  const reviews = data?.reviews ?? [];

  const handleSubmit = async () => {
    if (!comment.trim()) {
      setFeedbackMsg({ type: 'err', text: 'Please share a few words about your experience with this product.' });
      return;
    }
    setFeedbackMsg(null);
    try {
      await submitReview.mutateAsync({
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      setTitle('');
      setComment('');
      setShowForm(false);
      setFeedbackMsg({ type: 'ok', text: 'Thank you. Your genuine review is now live.' });
    } catch (err: any) {
      setFeedbackMsg({
        type: 'err',
        text: err?.response?.data?.message || 'Unable to submit review right now. Please try again.',
      });
    }
  };

  return (
    <View style={[styles.card, premiumShadow('rgba(0,0,0,0.08)', 'sm')]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionTitle}>Customer Reviews & Feedback</Text>
          <Text style={styles.sectionSub}>
            {total > 0
              ? `${avgRating?.toFixed(1)} out of 5 · ${total} review${total === 1 ? '' : 's'} (${verifiedBuyerCount} verified buyer${verifiedBuyerCount === 1 ? '' : 's'})`
              : 'No customer reviews yet. Verified buyers can share honest feedback.'}
          </Text>
        </View>

        {avgRating !== null ? (
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={14} color="#d97706" />
            <Text style={styles.ratingPillText}>{avgRating.toFixed(1)}</Text>
          </View>
        ) : null}
      </View>

      {feedbackMsg ? (
        <View style={[styles.feedbackBox, feedbackMsg.type === 'ok' ? styles.feedbackOk : styles.feedbackErr]}>
          <Text style={[styles.feedbackText, { color: feedbackMsg.type === 'ok' ? '#047857' : '#dc2626' }]}>
            {feedbackMsg.text}
          </Text>
        </View>
      ) : null}

      {user ? (
        <TouchableOpacity
          style={styles.writeToggleBtn}
          activeOpacity={0.85}
          onPress={() => setShowForm((v) => !v)}
        >
          <Ionicons name={showForm ? 'close-circle-outline' : 'create-outline'} size={16} color="#047857" />
          <Text style={styles.writeToggleText}>
            {showForm ? 'Cancel Review' : 'Write a Genuine Review'}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.writeToggleBtn}
          activeOpacity={0.85}
          onPress={() => router.push('/(auth)/login?redirect=/shop' as any)}
        >
          <Ionicons name="log-in-outline" size={16} color="#047857" />
          <Text style={styles.writeToggleText}>Sign In to Write a Review</Text>
        </TouchableOpacity>
      )}

      {showForm && user ? (
        <View style={styles.formBox}>
          <Text style={styles.fieldLabel}>Select Rating</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starTouch}
                activeOpacity={0.75}
              >
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={24}
                  color={star <= rating ? '#f59e0b' : '#cbd5e1'}
                />
              </TouchableOpacity>
            ))}
            <Text style={styles.starHint}>{rating}/5 Stars</Text>
          </View>

          <Text style={styles.fieldLabel}>Headline (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="Example: Clean packing and good germination"
            placeholderTextColor="#94a3b8"
            value={title}
            onChangeText={setTitle}
            maxLength={120}
          />

          <Text style={styles.fieldLabel}>Your Review</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Share product quality, delivery condition, or crop results..."
            placeholderTextColor="#94a3b8"
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1200}
          />

          <TouchableOpacity
            style={[styles.submitBtn, submitReview.isPending && { opacity: 0.7 }]}
            disabled={submitReview.isPending}
            onPress={handleSubmit}
          >
            {submitReview.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="#ffffff" />
                <Text style={styles.submitBtnText}>Publish Review</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      ) : null}

      {isLoading ? (
        <ActivityIndicator color="#059669" style={{ marginVertical: 12 }} />
      ) : reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#94a3b8" />
          <Text style={styles.emptyText}>No reviews published yet for this item.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {reviews.slice(0, 10).map((item) => (
            <View key={item.id} style={styles.reviewRow}>
              <View style={styles.reviewTop}>
                <View style={styles.reviewerMeta}>
                  <Text style={styles.reviewerName}>{item.user?.name || 'FarmsKing Customer'}</Text>
                  {item.isVerifiedBuyer ? (
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="shield-checkmark" size={11} color="#047857" />
                      <Text style={styles.verifiedBadgeText}>Verified Buyer</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.miniStarBox}>
                  <Ionicons name="star" size={11} color="#d97706" />
                  <Text style={styles.miniStarText}>{item.rating}</Text>
                </View>
              </View>

              {item.title ? <Text style={styles.reviewTitle}>{item.title}</Text> : null}
              {item.comment ? <Text style={styles.reviewComment}>{item.comment}</Text> : null}
              <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    color: '#0f172a',
  },
  sectionSub: {
    fontSize: 11.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  ratingPillText: {
    fontSize: 13,
    fontFamily: FONT.extraBold,
    color: '#b45309',
  },
  writeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  writeToggleText: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#047857',
  },
  formBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontFamily: FONT.bold,
    color: '#334155',
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  starTouch: { padding: 2 },
  starHint: {
    marginLeft: 6,
    fontSize: 12,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    fontFamily: FONT.medium,
    color: '#0f172a',
  },
  textArea: {
    minHeight: 74,
    textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  feedbackBox: {
    padding: 10,
    borderRadius: 8,
  },
  feedbackOk: { backgroundColor: '#ecfdf5', borderWidth: 1, borderColor: '#a7f3d0' },
  feedbackErr: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca' },
  feedbackText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  emptyText: {
    fontSize: 12,
    fontFamily: FONT.medium,
    color: '#64748b',
  },
  list: {
    gap: 10,
  },
  reviewRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 4,
  },
  reviewTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  reviewerName: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#0f172a',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#d1fae5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontFamily: FONT.bold,
    color: '#047857',
  },
  miniStarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.pill,
  },
  miniStarText: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#b45309',
  },
  reviewTitle: {
    fontSize: 12.5,
    fontFamily: FONT.bold,
    color: '#1e293b',
  },
  reviewComment: {
    fontSize: 12,
    fontFamily: FONT.regular,
    color: '#334155',
    lineHeight: 17,
  },
  reviewDate: {
    fontSize: 10.5,
    fontFamily: FONT.medium,
    color: '#64748b',
    marginTop: 2,
  },
});

