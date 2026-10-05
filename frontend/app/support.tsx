import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';

export default function SupportPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  return (
    <View style={styles.container}>
      <PublicHeader />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 100 }}>
        <View style={styles.content}>
          <Ionicons name="headset-outline" size={70} color="#f59e0b" style={{ marginBottom: 16 }} />
          <Text style={styles.title}>FarmsKing Help Center</Text>
          <Text style={styles.subtitle}>24/7 Support for our Kisan Veers & Partners</Text>

          <View style={styles.faqSection}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            
            <View style={styles.faqCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="cart" size={20} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={styles.faqQuestion}>How do I track my agricultural orders?</Text>
              </View>
              <Text style={styles.faqAnswer}>You can track your seeds, fertilizers, and machinery orders by logging into your account and visiting the 'My Orders' section. You will also receive WhatsApp updates.</Text>
            </View>

            <View style={styles.faqCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="leaf" size={20} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={styles.faqQuestion}>How to consult a Crop Doctor?</Text>
              </View>
              <Text style={styles.faqAnswer}>Upload a photo of your diseased crop using our AI Crop Intelligence tool in the app. A certified agronomist will review it and provide a prescription within 24 hours.</Text>
            </View>

            <View style={styles.faqCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="cash" size={20} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={styles.faqQuestion}>What are the payment methods accepted?</Text>
              </View>
              <Text style={styles.faqAnswer}>We accept direct UPI transfers, Credit/Debit cards, Cash on Delivery (COD) for eligible pincodes, and FarmsKing Wallet payments.</Text>
            </View>

            <View style={styles.faqCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="return-down-back" size={20} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={styles.faqQuestion}>What is the return policy for seeds and chemicals?</Text>
              </View>
              <Text style={styles.faqAnswer}>Due to the sensitive nature of agri-inputs, sealed products can be returned within 7 days of delivery. Open chemicals or seeds cannot be returned.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 40, paddingVertical: 20,
    backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155'
  },
  headerMobile: { paddingHorizontal: 20, paddingTop: 50 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center', marginRight: 16
  },
  headerTitle: { fontSize: 20, fontFamily: FONT.bold, color: '#fff' },
  content: { alignItems: 'center', padding: 20, maxWidth: 800, alignSelf: 'center', width: '100%', marginTop: 20 },
  title: { fontSize: 32, fontFamily: FONT.extraBold, color: '#fff', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: FONT.medium, color: '#cbd5e1', textAlign: 'center', marginBottom: 40 },
  faqSection: { width: '100%' },
  sectionTitle: { fontSize: 22, fontFamily: FONT.bold, color: '#f59e0b', marginBottom: 20 },
  faqCard: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  faqQuestion: { fontSize: 16, fontFamily: FONT.bold, color: '#fff' },
  faqAnswer: { fontSize: 14, fontFamily: FONT.medium, color: '#94a3b8', lineHeight: 22, marginTop: 4, paddingLeft: 28 },
});
