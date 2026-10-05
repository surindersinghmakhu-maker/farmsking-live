import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import * as SecureStore from '@/src/lib/storage';

const theme = RoleThemes.GARDENER;

export default function BecomeAdvisorIntroScreen() {
  const router = useRouter();
  const { data: appSettings } = useAppSettings();
  const [isProcessing, setIsProcessing] = useState(false);

  const [lastFailedDate, setLastFailedDate] = useState<Date | null>(null);
  const [hasFailedBefore, setHasFailedBefore] = useState(false);
  const [daysRemaining, setDaysRemaining] = useState(0);

  useEffect(() => {
    const checkFailureStatus = async () => {
      const failedAtStr = await SecureStore.getItemAsync('advisorLastFailed');
      const failedBeforeStr = await SecureStore.getItemAsync('advisorHasFailedBefore');
      
      if (failedBeforeStr === 'true') {
        setHasFailedBefore(true);
      }

      if (failedAtStr) {
        const failedDate = new Date(failedAtStr);
        setLastFailedDate(failedDate);
        
        const now = new Date();
        const diffMs = now.getTime() - failedDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const requiredDays = 15;
        
        if (diffDays < requiredDays) {
          setDaysRemaining(requiredDays - diffDays);
        } else {
          setDaysRemaining(0);
        }
      }
    };
    checkFailureStatus();
  }, []);

  // Fallbacks if admin hasn't set them yet
  const baseFee = appSettings?.advisorCertificationFee ?? 999;
  
  // If they have failed before, fee is 30% of base fee
  const fee = hasFailedBefore ? Math.round(baseFee * 0.3) : baseFee;
  const originalFee = hasFailedBefore ? baseFee : (appSettings?.advisorCertificationDiscount ? fee + appSettings.advisorCertificationDiscount : 2999);

  const handlePayFee = () => {
    setIsProcessing(true);
    // Simulate payment process (e.g. Cashfree)
    setTimeout(() => {
      setIsProcessing(false);
      // On success, go to the MCQ test
      router.push('/(user)/advisor-mcq-test');
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[theme.primary, '#0f172a']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Image 
          source={{ uri: 'https://cdn-icons-png.flaticon.com/512/1972/1972539.png' }} 
          style={styles.heroIcon} 
        />
        <Text style={styles.headerTitle}>Become a Garden Advisor</Text>
        <Text style={styles.headerSubtitle}>Earn money by helping others grow beautiful gardens.</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        
        <View style={styles.stepsBox}>
          <Text style={styles.stepsTitle}>How it works:</Text>
          
          <View style={styles.step}>
            <View style={styles.stepCircle}><Text style={styles.stepCircleText}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>Pay Certification Fee (₹{fee})</Text>
              <Text style={styles.stepSub}>
                {hasFailedBefore 
                  ? "Since you are retaking the test, you get a 70% discount (fee is only 30%)." 
                  : "One-time fee to register for the expert test."}
              </Text>
            </View>
          </View>
          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepCircle}><Text style={styles.stepCircleText}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>Pass the Digital MCQ Test</Text>
              <Text style={styles.stepSub}>Score 80%+ on our horticulture knowledge test.</Text>
            </View>
          </View>
          <View style={styles.stepLine} />

          <View style={styles.step}>
            <View style={styles.stepCircle}><Text style={styles.stepCircleText}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.stepLabel}>Start Earning!</Text>
              <Text style={styles.stepSub}>Get listed in the marketplace and manage clients.</Text>
            </View>
          </View>
        </View>

        <View style={styles.benefitsBox}>
          <Text style={styles.benefitsTitle}>Why join FarmsKing?</Text>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
            <Text style={styles.benefitText}>Set your own monthly/yearly fees.</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
            <Text style={styles.benefitText}>Earn commission on product prescriptions.</Text>
          </View>
          <View style={styles.benefitItem}>
            <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
            <Text style={styles.benefitText}>Access to thousands of active gardeners.</Text>
          </View>
        </View>

      </ScrollView>

      <View style={[styles.footer, premiumShadow('#0f172a', 'md')]}>
        {daysRemaining > 0 ? (
          <View style={styles.timeoutBox}>
            <Ionicons name="time" size={24} color="#dc2626" />
            <Text style={styles.timeoutTitle}>Test Locked</Text>
            <Text style={styles.timeoutSub}>
              You did not pass your previous attempt. You can retake the test after {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}.
            </Text>
          </View>
        ) : (
          <>
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>Certification Fee</Text>
                {hasFailedBefore && <Text style={styles.discountBadge}>Retake Discount Applied</Text>}
              </View>
              <Text style={styles.priceValue}>₹{fee} <Text style={styles.priceStrike}>₹{originalFee}</Text></Text>
            </View>
            
            <TouchableOpacity 
              style={styles.payBtn} 
              onPress={handlePayFee}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.payBtnText}>Pay ₹{fee} Securely</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.secureText}><Ionicons name="lock-closed" size={10} /> Secured by Cashfree Payments</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { padding: SPACING.xl, paddingTop: SPACING.xxl, alignItems: 'center', borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl },
  backBtn: { position: 'absolute', top: SPACING.xl * 1.5, left: SPACING.lg, padding: 8 },
  heroIcon: { width: 60, height: 60, tintColor: '#ffffff', marginBottom: SPACING.md, marginTop: SPACING.md },
  headerTitle: { fontSize: 22, fontFamily: FONT.extraBold, color: '#ffffff', textAlign: 'center' },
  headerSubtitle: { fontSize: 14, fontFamily: FONT.medium, color: '#cbd5e1', textAlign: 'center', marginTop: 8 },
  
  body: { padding: SPACING.lg, paddingBottom: 150 },
  
  stepsBox: { backgroundColor: '#ffffff', borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.xl },
  stepsTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#0f172a', marginBottom: SPACING.lg },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: theme.primaryLight, alignItems: 'center', justifyContent: 'center' },
  stepCircleText: { fontSize: 13, fontFamily: FONT.bold, color: theme.primary },
  stepLabel: { fontSize: 14, fontFamily: FONT.bold, color: '#334155' },
  stepSub: { fontSize: 12, fontFamily: FONT.medium, color: '#64748b', marginTop: 2, lineHeight: 18 },
  stepLine: { width: 2, height: 24, backgroundColor: '#e2e8f0', marginLeft: 13, marginVertical: 4 },
  
  benefitsBox: { backgroundColor: '#f0fdf4', borderRadius: RADIUS.lg, padding: SPACING.lg, borderWidth: 1, borderColor: '#bbf7d0' },
  benefitsTitle: { fontSize: 15, fontFamily: FONT.bold, color: '#166534', marginBottom: SPACING.md },
  benefitItem: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  benefitText: { fontSize: 13, fontFamily: FONT.medium, color: '#15803d' },

  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#ffffff', padding: SPACING.lg, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  priceLabel: { fontSize: 14, fontFamily: FONT.bold, color: '#475569' },
  priceValue: { fontSize: 20, fontFamily: FONT.extraBold, color: '#0f172a' },
  priceStrike: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8', textDecorationLine: 'line-through' },
  discountBadge: { fontSize: 10, fontFamily: FONT.bold, color: '#16a34a', marginTop: 2 },
  
  payBtn: { backgroundColor: '#0f172a', paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center', justifyContent: 'center' },
  payBtnText: { fontSize: 15, fontFamily: FONT.bold, color: '#ffffff' },
  secureText: { fontSize: 11, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center', marginTop: 12 },

  timeoutBox: { backgroundColor: '#fef2f2', borderWidth: 1, borderColor: '#fecaca', borderRadius: RADIUS.lg, padding: SPACING.lg, alignItems: 'center' },
  timeoutTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#dc2626', marginTop: 8, marginBottom: 4 },
  timeoutSub: { fontSize: 13, fontFamily: FONT.medium, color: '#991b1b', textAlign: 'center', lineHeight: 20 }
});
