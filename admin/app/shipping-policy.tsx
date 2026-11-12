import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { FONT } from '@/constants/theme';

export default function AdminShippingPolicyScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const [isDay] = useState(true);

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      <Stack.Screen options={{ headerShown: false, title: 'Shipping & Delivery Policy • FarmsKing' }} />
      <ScrollView contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}>
        <View style={styles.container}>
          <TouchableOpacity style={styles.backRow} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={16} color="#059669" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <View style={styles.card}>
            <Text style={styles.title}>Shipping & Delivery Policy</Text>
            <Text style={styles.sub}>FARMSKING TECHNOLOGIES PRIVATE LIMITED • CIN: U01100PB2026PTC063294</Text>
            <Text style={styles.body}>
              • Dispatch Window: Orders verified before 2:00 PM IST are packed and dispatched within 24–48 business hours.{'\n\n'}
              • Delivery Timelines: 2–5 business days across Punjab/North India and 4–7 business days Pan-India via Shiprocket/Delhivery/BlueDart/Xpressbees/India Post.{'\n\n'}
              • Shipping & Heavy Inputs: Free delivery applies over ₹499 where eligible; heavy bags (25 kg+) and liquid sprays require prepaid checkout (Cashfree, Razorpay, PhonePe, UPI).{'\n\n'}
              • Support: support@farmsking.in • +91 95776-22000 • Regd. Office: VPO Goindwal Sahib, Tarn Taran, Punjab - 143422 • HQ: Makhu, Ferozepur, Punjab - 142044.
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rootDay: { backgroundColor: '#f8fafc' },
  rootNight: { backgroundColor: '#040a17' },
  scrollContent: { paddingTop: 32, paddingBottom: 60 },
  scrollContentMobile: { paddingTop: 20, paddingBottom: 80 },
  container: { width: '92%', maxWidth: 880, alignSelf: 'center', gap: 16 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  backText: { fontSize: 13, fontFamily: FONT.bold, color: '#059669' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, padding: 24, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 },
  title: { fontSize: 22, fontFamily: FONT.extraBold, color: '#0f172a' },
  sub: { fontSize: 12, fontFamily: FONT.bold, color: '#059669' },
  body: { fontSize: 14, fontFamily: FONT.regular, color: '#334155', lineHeight: 22 },
});

