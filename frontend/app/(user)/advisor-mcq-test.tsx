import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Dimensions, Platform, Share
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { getRandomQuestions, Question } from '@/constants/AdvisorQuestions';
import * as SecureStore from '@/src/lib/storage';
import { apiClient } from '@/src/api/client';
import { useAuth } from '@/src/store/auth-context';
import ViewShot from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';

const theme = RoleThemes.GARDENER;
const { width } = Dimensions.get('window');

// ─── Certificate Component ───────────────────────────────────────────────────
function CertificateView({
  userName,
  score,
  date,
  certRef,
}: {
  userName: string;
  score: number;
  date: string;
  certRef: React.RefObject<any>;
}) {
  return (
    <ViewShot ref={certRef} options={{ format: 'jpg', quality: 0.95 }}>
      <View style={cert.container}>
        {/* Gold border frame */}
        <View style={cert.outerBorder}>
          <LinearGradient
            colors={['#14532d', '#15803d', '#166534']}
            style={cert.headerBand}
          >
            <Text style={cert.orgName}>🌿 FarmsKing</Text>
            <Text style={cert.orgTagline}>Certified Garden Experts Network</Text>
          </LinearGradient>

          <View style={cert.body}>
            <Text style={cert.certTitle}>Certificate of Achievement</Text>
            <Text style={cert.certSubtitle}>Garden Advisor Certification</Text>

            <View style={cert.divider} />

            <Text style={cert.presentedTo}>This is to certify that</Text>
            <Text style={cert.candidateName}>{userName}</Text>
            <Text style={cert.presentedTo}>
              has successfully passed the Garden Advisor Certification Test
            </Text>

            <View style={cert.scoreBox}>
              <Text style={cert.scoreLabel}>Score Achieved</Text>
              <Text style={cert.scoreValue}>{score} / 100</Text>
              <Text style={cert.scoreGrade}>
                {score >= 95 ? 'With Distinction 🌟' : score >= 85 ? 'With Merit 🏅' : 'Pass ✅'}
              </Text>
            </View>

            <View style={cert.divider} />

            <View style={cert.footerRow}>
              <View style={cert.footerItem}>
                <Text style={cert.footerLabel}>Issue Date</Text>
                <Text style={cert.footerValue}>{date}</Text>
              </View>
              <View style={cert.footerItem}>
                <Text style={cert.footerLabel}>Valid For</Text>
                <Text style={cert.footerValue}>Lifetime</Text>
              </View>
              <View style={cert.footerItem}>
                <Text style={cert.footerLabel}>Issued By</Text>
                <Text style={cert.footerValue}>FarmsKing</Text>
              </View>
            </View>

            <View style={cert.sealRow}>
              <View style={cert.seal}>
                <Text style={cert.sealIcon}>🌿</Text>
                <Text style={cert.sealText}>CERTIFIED</Text>
              </View>
            </View>
          </View>

          <LinearGradient
            colors={['#14532d', '#15803d']}
            style={cert.footerBand}
          >
            <Text style={cert.footerBandText}>
              farmsking.in | Garden Advisor Programme | ISO Registered
            </Text>
          </LinearGradient>
        </View>
      </View>
    </ViewShot>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
export default function AdvisorMCQTestScreen() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Results
  const [testComplete, setTestComplete] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [passed, setPassed] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const certRef = useRef<any>(null);
  const issueDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  useEffect(() => {
    setQuestions(getRandomQuestions(25));
  }, []);

  const handleSelectOption = (optionIndex: number) => {
    setSelectedAnswers(prev => ({ ...prev, [currentIndex]: optionIndex }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSubmitTest = async () => {
    if (Object.keys(selectedAnswers).length < questions.length) {
      Alert.alert('Incomplete Test', `Please answer all ${questions.length} questions before submitting.`);
      return;
    }

    setIsSubmitting(true);

    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctIndex) correct += 1;
    });

    const finalScore = correct * 4; // 4 marks each, max 100
    setScore(finalScore);
    setCorrectCount(correct);

    const isPass = finalScore >= 80;
    setPassed(isPass);

    if (isPass) {
      try {
        await apiClient.post('/users/upgrade-role', { role: 'GARDEN_ADVISOR' });
        await refreshUser();
        await SecureStore.deleteItemAsync('advisorLastFailed');
        // Notify admin
        try {
          await apiClient.post('/notifications/admin', {
            title: '🏅 New Garden Advisor Certified',
            message: `${user?.name || 'A user'} has passed the Garden Advisor Certification Test with ${finalScore}/100. Certificate issued automatically.`,
            type: 'ADVISOR_CERTIFIED',
          });
        } catch {}
      } catch (e) {
        console.error('Failed to upgrade role', e);
      }
    } else {
      await SecureStore.setItemAsync('advisorLastFailed', new Date().toISOString());
      await SecureStore.setItemAsync('advisorHasFailedBefore', 'true');
    }

    setIsSubmitting(false);
    setTestComplete(true);
  };

  const handleDownloadCertificate = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const uri = await (certRef.current as any).capture();
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'Save or Share Your Certificate',
          UTI: 'public.jpeg',
        });
      } else {
        Alert.alert('Saved', 'Certificate captured. Use the Share option to save it.');
      }
    } catch (e) {
      Alert.alert('Error', 'Could not capture certificate. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // ─── RESULT SCREEN ────────────────────────────────────────────────────────
  if (testComplete) {
    const wrongCount = 25 - correctCount;
    const percentage = score;

    if (showCertificate && passed) {
      return (
        <ScrollView style={{ flex: 1, backgroundColor: '#f0fdf4' }} contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <TouchableOpacity onPress={() => setShowCertificate(false)} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color="#0f172a" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontFamily: FONT.bold, color: '#0f172a' }}>Your Certificate</Text>
          </View>

          <CertificateView
            certRef={certRef}
            userName={user?.name || 'Garden Advisor'}
            score={score}
            date={issueDate}
          />

          <TouchableOpacity
            style={[styles.downloadBtn, downloading && { opacity: 0.7 }]}
            onPress={handleDownloadCertificate}
            disabled={downloading}
          >
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.downloadBtnText}>
              {downloading ? 'Preparing...' : '📥 Download Certificate (JPG)'}
            </Text>
          </TouchableOpacity>

          <Text style={{ textAlign: 'center', fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 12 }}>
            Certificate is saved to your advisor profile automatically.
          </Text>
        </ScrollView>
      );
    }

    return (
      <ScrollView style={{ flex: 1, backgroundColor: '#f8fafc' }} contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Result Header */}
        <LinearGradient
          colors={passed ? ['#14532d', '#15803d'] : ['#7f1d1d', '#dc2626']}
          style={styles.resultHeader}
        >
          <Ionicons name={passed ? 'trophy' : 'close-circle'} size={64} color="#ffffff" />
          <Text style={styles.resultHeaderTitle}>
            {passed ? '🎉 Test Passed!' : '❌ Test Failed'}
          </Text>
          <Text style={styles.resultHeaderSub}>
            {passed
              ? 'Congratulations! You are now a Certified Garden Advisor'
              : 'You need 80+ marks to pass. Review and try again.'}
          </Text>
        </LinearGradient>

        <View style={{ padding: SPACING.lg, gap: 16 }}>

          {/* Score Card */}
          <View style={[styles.scoreCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.scoreCardTitle}>📊 Test Report Card</Text>

            <View style={styles.scoreGrid}>
              <View style={styles.scoreItem}>
                <Text style={styles.scoreItemValue}>{score}</Text>
                <Text style={styles.scoreItemLabel}>Total Score</Text>
                <Text style={styles.scoreItemSub}>out of 100</Text>
              </View>
              <View style={[styles.scoreItem, { borderLeftWidth: 1, borderColor: '#e2e8f0' }]}>
                <Text style={[styles.scoreItemValue, { color: '#16a34a' }]}>{correctCount}</Text>
                <Text style={styles.scoreItemLabel}>Correct</Text>
                <Text style={styles.scoreItemSub}>out of 25</Text>
              </View>
              <View style={[styles.scoreItem, { borderLeftWidth: 1, borderColor: '#e2e8f0' }]}>
                <Text style={[styles.scoreItemValue, { color: '#dc2626' }]}>{wrongCount}</Text>
                <Text style={styles.scoreItemLabel}>Wrong</Text>
                <Text style={styles.scoreItemSub}>questions</Text>
              </View>
            </View>

            {/* Score Bar */}
            <View style={styles.scoreBarBg}>
              <View style={[styles.scoreBarFill, {
                width: `${percentage}%` as any,
                backgroundColor: passed ? '#16a34a' : '#dc2626'
              }]} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.scoreBarLabel}>0</Text>
              <Text style={[styles.scoreBarLabel, { color: '#d97706' }]}>Pass Mark: 80</Text>
              <Text style={styles.scoreBarLabel}>100</Text>
            </View>

            {/* Grade */}
            <View style={[styles.gradeBadge, { backgroundColor: passed ? '#f0fdf4' : '#fef2f2', borderColor: passed ? '#bbf7d0' : '#fecaca' }]}>
              <Text style={{ fontSize: 14, fontFamily: FONT.bold, color: passed ? '#14532d' : '#991b1b', textAlign: 'center' }}>
                {score >= 95 ? '⭐ Distinction (95+)' :
                  score >= 85 ? '🏅 Merit (85-94)' :
                    score >= 80 ? '✅ Pass (80-84)' :
                      score >= 60 ? '⚠️ Near Pass (60-79)' : '❌ Fail (Below 60)'}
              </Text>
            </View>
          </View>

          {/* Per-Question Review */}
          <View style={[styles.reviewCard, premiumShadow('#0f172a', 'sm')]}>
            <Text style={styles.reviewTitle}>📋 Question-wise Review</Text>
            {questions.map((q, idx) => {
              const userAns = selectedAnswers[idx];
              const isCorrect = userAns === q.correctIndex;
              return (
                <View key={idx} style={[styles.reviewItem, { borderLeftColor: isCorrect ? '#16a34a' : '#dc2626', borderLeftWidth: 3 }]}>
                  <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                    <Ionicons
                      name={isCorrect ? 'checkmark-circle' : 'close-circle'}
                      size={18}
                      color={isCorrect ? '#16a34a' : '#dc2626'}
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewQ}>Q{idx + 1}. {q.text}</Text>
                      {!isCorrect && (
                        <>
                          <Text style={styles.reviewWrong}>Your answer: {q.options[userAns] || 'Not answered'}</Text>
                          <Text style={styles.reviewCorrect}>Correct: {q.options[q.correctIndex]}</Text>
                        </>
                      )}
                      {isCorrect && (
                        <Text style={styles.reviewRight}>✓ {q.options[q.correctIndex]}</Text>
                      )}
                    </View>
                    <Text style={{ fontSize: 12, fontFamily: FONT.bold, color: isCorrect ? '#16a34a' : '#dc2626' }}>
                      {isCorrect ? '+4' : '0'}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Action Buttons */}
          {passed ? (
            <View style={{ gap: 12 }}>
              <TouchableOpacity
                style={styles.certBtn}
                onPress={() => setShowCertificate(true)}
              >
                <Ionicons name="ribbon" size={20} color="#fff" />
                <Text style={styles.certBtnText}>View & Download Certificate 🏅</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dashBtn}
                onPress={() => router.replace('/(partner)/(tabs)' as any)}
              >
                <Ionicons name="leaf" size={18} color="#fff" />
                <Text style={styles.dashBtnText}>Go to Advisor Dashboard →</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: 12 }}>
              <View style={styles.retakeInfoCard}>
                <Ionicons name="information-circle" size={20} color="#d97706" />
                <Text style={styles.retakeInfoText}>
                  You can retake the test after 15 days. The retake fee will be 30% of the original fee.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.retakeBtn}
                onPress={() => router.replace('/(user)/become-advisor' as any)}
              >
                <Ionicons name="refresh" size={18} color="#fff" />
                <Text style={styles.retakeBtnText}>Go Back (Retake after 15 days)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    );
  }

  // ─── TEST SCREEN ──────────────────────────────────────────────────────────
  if (questions.length === 0) return null;

  const currentQ = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const answeredCount = Object.keys(selectedAnswers).length;

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => {
            Alert.alert('Quit Test?', 'Your progress will be lost.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Quit', onPress: () => router.back(), style: 'destructive' }
            ]);
          }} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Garden Advisor Test</Text>
          <View style={styles.answerBadge}>
            <Text style={styles.answerBadgeText}>{answeredCount}/{questions.length}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
            <Text style={styles.progressText}>Question {currentIndex + 1} of {questions.length}</Text>
            <Text style={styles.progressText}>{score > 0 ? `${score} marks` : `4 marks each`}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progress}%` as any }]} />
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <View style={styles.questionCard}>
          <Text style={styles.questionLabel}>Q{currentIndex + 1}.</Text>
          <Text style={styles.questionText}>{currentQ.text}</Text>
        </View>

        <View style={styles.optionsContainer}>
          {currentQ.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentIndex] === idx;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.optionBtn, isSelected && styles.optionBtnSelected]}
                onPress={() => handleSelectOption(idx)}
                activeOpacity={0.7}
              >
                <View style={[styles.optionRadio, isSelected && styles.optionRadioSelected]}>
                  {isSelected && <View style={styles.optionRadioInner} />}
                </View>
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.footer, premiumShadow('#0f172a', 'md')]}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && { opacity: 0.3 }]}
          onPress={handlePrevious}
          disabled={currentIndex === 0}
        >
          <Ionicons name="arrow-back" size={20} color="#334155" />
          <Text style={styles.navBtnText}>Prev</Text>
        </TouchableOpacity>

        {currentIndex === questions.length - 1 ? (
          <TouchableOpacity
            style={[styles.navBtn, styles.submitBtn, isSubmitting && { opacity: 0.6 }]}
            onPress={handleSubmitTest}
            disabled={isSubmitting}
          >
            <Text style={[styles.navBtnText, { color: '#fff' }]}>
              {isSubmitting ? 'Submitting...' : 'Submit Test'}
            </Text>
            {!isSubmitting && <Ionicons name="checkmark-done" size={20} color="#fff" />}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.navBtn, styles.nextBtn]} onPress={handleNext}>
            <Text style={[styles.navBtnText, { color: '#fff' }]}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Certificate Styles ───────────────────────────────────────────────────────
const cert = StyleSheet.create({
  container: { padding: 8, backgroundColor: '#f0fdf4' },
  outerBorder: {
    borderWidth: 3, borderColor: '#d97706', borderRadius: RADIUS.lg,
    overflow: 'hidden', backgroundColor: '#ffffff',
  },
  headerBand: { padding: 20, alignItems: 'center' },
  orgName: { fontSize: 22, fontFamily: FONT.extraBold, color: '#ffffff' },
  orgTagline: { fontSize: 12, fontFamily: FONT.medium, color: '#bbf7d0', marginTop: 2 },
  body: { padding: 24, alignItems: 'center', gap: 10 },
  certTitle: { fontSize: 20, fontFamily: FONT.extraBold, color: '#92400e', textAlign: 'center' },
  certSubtitle: { fontSize: 14, fontFamily: FONT.bold, color: '#d97706', textAlign: 'center' },
  divider: { height: 1.5, backgroundColor: '#d97706', width: '80%', marginVertical: 8 },
  presentedTo: { fontSize: 13, fontFamily: FONT.medium, color: '#475569', textAlign: 'center' },
  candidateName: { fontSize: 26, fontFamily: FONT.extraBold, color: '#14532d', textAlign: 'center', marginVertical: 6 },
  scoreBox: {
    backgroundColor: '#f0fdf4', borderWidth: 2, borderColor: '#16a34a',
    borderRadius: RADIUS.lg, padding: 16, alignItems: 'center', width: '80%',
  },
  scoreLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#64748b' },
  scoreValue: { fontSize: 32, fontFamily: FONT.extraBold, color: '#14532d' },
  scoreGrade: { fontSize: 14, fontFamily: FONT.bold, color: '#16a34a', marginTop: 2 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-around', width: '100%', marginTop: 8 },
  footerItem: { alignItems: 'center' },
  footerLabel: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8' },
  footerValue: { fontSize: 12, fontFamily: FONT.bold, color: '#0f172a', marginTop: 2 },
  sealRow: { marginTop: 8 },
  seal: {
    width: 70, height: 70, borderRadius: 35, borderWidth: 3, borderColor: '#16a34a',
    alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0fdf4',
  },
  sealIcon: { fontSize: 24 },
  sealText: { fontSize: 8, fontFamily: FONT.bold, color: '#14532d', marginTop: 2 },
  footerBand: { padding: 10, alignItems: 'center' },
  footerBandText: { fontSize: 11, fontFamily: FONT.medium, color: '#bbf7d0' },
});

// ─── Screen Styles ────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: SPACING.lg, paddingTop: SPACING.xxl },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xl },
  closeBtn: { padding: SPACING.xs },
  headerTitle: { fontSize: 17, fontFamily: FONT.bold, color: '#fff' },
  answerBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: RADIUS.pill },
  answerBadgeText: { fontSize: 12, fontFamily: FONT.bold, color: '#fff' },
  progressContainer: { marginBottom: SPACING.sm },
  progressText: { fontSize: 12, fontFamily: FONT.semiBold, color: '#cbd5e1' },
  progressBarBg: { height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden', marginTop: 4 },
  progressBarFill: { height: '100%', backgroundColor: '#10b981', borderRadius: 3 },
  body: { padding: SPACING.lg, paddingBottom: 100 },
  questionCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.xl, marginBottom: SPACING.xl, ...premiumShadow('#0f172a', 'sm') },
  questionLabel: { fontSize: 14, fontFamily: FONT.extraBold, color: theme.primary, marginBottom: 8 },
  questionText: { fontSize: 17, fontFamily: FONT.bold, color: '#0f172a', lineHeight: 26 },
  optionsContainer: { gap: SPACING.md },
  optionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 2, borderColor: '#e2e8f0', borderRadius: RADIUS.lg, padding: SPACING.lg },
  optionBtnSelected: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
  optionRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: '#94a3b8', marginRight: SPACING.md, alignItems: 'center', justifyContent: 'center' },
  optionRadioSelected: { borderColor: theme.primary },
  optionRadioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: theme.primary },
  optionText: { flex: 1, fontSize: 15, fontFamily: FONT.semiBold, color: '#334155', lineHeight: 22 },
  optionTextSelected: { color: theme.primary },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', padding: SPACING.md, paddingHorizontal: SPACING.lg, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  navBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 18, borderRadius: RADIUS.pill, backgroundColor: '#f1f5f9' },
  navBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#334155' },
  nextBtn: { backgroundColor: '#0f172a' },
  submitBtn: { backgroundColor: '#10b981', flex: 1, marginLeft: 10, justifyContent: 'center' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },

  // Result Screen
  resultHeader: { padding: 36, alignItems: 'center', gap: 12, paddingTop: 60 },
  resultHeaderTitle: { fontSize: 26, fontFamily: FONT.extraBold, color: '#fff', textAlign: 'center' },
  resultHeaderSub: { fontSize: 14, fontFamily: FONT.medium, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 20 },

  scoreCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 14 },
  scoreCardTitle: { fontSize: 16, fontFamily: FONT.extraBold, color: '#0f172a' },
  scoreGrid: { flexDirection: 'row', alignItems: 'center' },
  scoreItem: { flex: 1, alignItems: 'center', paddingVertical: 10 },
  scoreItemValue: { fontSize: 28, fontFamily: FONT.extraBold, color: '#0f172a' },
  scoreItemLabel: { fontSize: 12, fontFamily: FONT.bold, color: '#475569', marginTop: 2 },
  scoreItemSub: { fontSize: 10, fontFamily: FONT.medium, color: '#94a3b8', marginTop: 1 },
  scoreBarBg: { height: 10, backgroundColor: '#e2e8f0', borderRadius: 5, overflow: 'hidden' },
  scoreBarFill: { height: '100%', borderRadius: 5 },
  scoreBarLabel: { fontSize: 11, fontFamily: FONT.medium, color: '#64748b', marginTop: 4 },
  gradeBadge: { borderWidth: 1, borderRadius: RADIUS.md, padding: 12 },

  reviewCard: { backgroundColor: '#fff', borderRadius: RADIUS.lg, padding: SPACING.lg, gap: 12 },
  reviewTitle: { fontSize: 15, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: 4 },
  reviewItem: { paddingLeft: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  reviewQ: { fontSize: 13, fontFamily: FONT.bold, color: '#0f172a', lineHeight: 18, marginBottom: 4 },
  reviewWrong: { fontSize: 12, fontFamily: FONT.medium, color: '#dc2626', marginTop: 2 },
  reviewCorrect: { fontSize: 12, fontFamily: FONT.bold, color: '#16a34a', marginTop: 2 },
  reviewRight: { fontSize: 12, fontFamily: FONT.medium, color: '#16a34a', marginTop: 2 },

  certBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#d97706', padding: 16, borderRadius: RADIUS.lg },
  certBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#fff' },
  dashBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#14532d', padding: 15, borderRadius: RADIUS.lg },
  dashBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#fff' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#16a34a', padding: 16, borderRadius: RADIUS.lg, marginTop: 16 },
  downloadBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#fff' },
  retakeInfoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: '#fffbeb', borderRadius: RADIUS.md, padding: 14, borderWidth: 1, borderColor: '#fde68a' },
  retakeInfoText: { flex: 1, fontSize: 13, fontFamily: FONT.medium, color: '#92400e', lineHeight: 20 },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#ef4444', padding: 15, borderRadius: RADIUS.lg },
  retakeBtnText: { fontSize: 14, fontFamily: FONT.bold, color: '#fff' },
});
