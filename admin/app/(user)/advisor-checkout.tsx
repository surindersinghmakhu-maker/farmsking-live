import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { RoleThemes } from '@/constants/Colors';
import { FONT, RADIUS, SPACING, premiumShadow } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const theme = RoleThemes.GARDENER;

export default function AdvisorCheckoutScreen() {
  const router = useRouter();
  const { advisorId, advisorName, planPrice, planType } = useLocalSearchParams();
  
  const [status, setStatus] = useState<'INITIAL' | 'PROCESSING' | 'SUCCESS'>('INITIAL');

  const startPayment = () => {
    setStatus('PROCESSING');
    
    // Simulate Cashfree Payment Gateway processing
    setTimeout(() => {
      setStatus('SUCCESS');
    }, 3000);
  };

  const handleDone = () => {
    router.replace('/(tabs)/garden' as never);
  };

  if (status === 'SUCCESS') {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={styles.successCircle}>
          <Ionicons name="checkmark" size={60} color="#ffffff" />
        </View>
        <Text style={styles.successTitle}>Payment Successful!</Text>
        <Text style={styles.successSub}>
          You have successfully hired {advisorName || 'the Advisor'}. They will now manage your garden.
        </Text>
        <TouchableOpacity style={[styles.payBtn, { marginTop: 40, width: '80%' }]} onPress={handleDone}>
          <Text style={styles.payBtnText}>Go to Garden Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0f172a', '#1e293b']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} disabled={status === 'PROCESSING'}>
          <Ionicons name="arrow-back" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cashfree Payments</Text>
        <View style={{ width: 24 }} />
      </LinearGradient>

      <View style={styles.body}>
        <View style={styles.orderSummary}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Hiring</Text>
            <Text style={styles.summaryValue}>{advisorName || 'Certified Garden Advisor'}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Plan</Text>
            <Text style={styles.summaryValue}>{planType === 'yearly' ? 'Yearly Subscription' : 'Monthly Subscription'}</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Total Payable</Text>
            <Text style={styles.totalValue}>{planPrice || '₹299'}</Text>
          </View>
        </View>

        <View style={styles.secureBox}>
          <Ionicons name="lock-closed" size={16} color="#16a34a" />
          <Text style={styles.secureText}>100% Secure & Encrypted by Cashfree</Text>
        </View>

        <TouchableOpacity 
          style={[styles.payBtn, status === 'PROCESSING' && { opacity: 0.7 }]} 
          onPress={startPayment}
          disabled={status === 'PROCESSING'}
        >
          {status === 'PROCESSING' ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.payBtnText}>Pay Securely {planPrice || '₹299'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: {
    paddingTop: SPACING.xl * 1.5,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: SPACING.xs },
  headerTitle: { fontSize: 18, fontFamily: FONT.bold, color: '#ffffff' },
  
  body: { padding: SPACING.lg },
  
  orderSummary: {
    backgroundColor: '#ffffff',
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    ...premiumShadow('#0f172a', 'sm'),
    marginBottom: SPACING.xl,
  },
  summaryTitle: { fontSize: 16, fontFamily: FONT.bold, color: '#0f172a', marginBottom: SPACING.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { fontSize: 14, fontFamily: FONT.medium, color: '#64748b' },
  summaryValue: { fontSize: 14, fontFamily: FONT.bold, color: '#334155' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: SPACING.sm },
  totalLabel: { fontSize: 16, fontFamily: FONT.bold, color: '#0f172a' },
  totalValue: { fontSize: 18, fontFamily: FONT.extraBold, color: '#059669' },
  
  secureBox: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: SPACING.xxl },
  secureText: { fontSize: 12, fontFamily: FONT.medium, color: '#16a34a' },
  
  payBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 16,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...premiumShadow('#0f172a', 'md'),
  },
  payBtnText: { fontSize: 16, fontFamily: FONT.bold, color: '#ffffff' },

  successCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#10b981',
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl,
    ...premiumShadow('#10b981', 'md')
  },
  successTitle: { fontSize: 24, fontFamily: FONT.extraBold, color: '#0f172a', marginBottom: SPACING.sm },
  successSub: { fontSize: 14, fontFamily: FONT.medium, color: '#64748b', textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
