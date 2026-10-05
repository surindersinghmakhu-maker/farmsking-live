import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { FONT } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';
import { useAppSettings } from '@/src/hooks/useAppSettings';
import { ActivityIndicator } from 'react-native';

export default function ContactUsPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;
  const { data: settings, isLoading } = useAppSettings();

  const phone = settings?.contactPhone || '+91-9876543210';
  const whatsapp = settings?.whatsappNumber || phone;
  const email = settings?.contactEmail || 'support@farmsking.in';
  const address = settings?.contactAddress || 'FarmsKing AgriTech Pvt Ltd\nMakhu, Punjab, India - 142044';

  return (
    <View style={styles.container}>
      <PublicHeader />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40, paddingTop: 100 }}>
        <View style={styles.content}>
          <Ionicons name="call-outline" size={70} color="#10b981" style={{ marginBottom: 16 }} />
          <Text style={styles.title}>Get in Touch</Text>
          <Text style={styles.subtitle}>We would love to hear from you. Reach out to our agricultural experts!</Text>

          {isLoading ? (
            <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
          ) : (
            <View style={styles.contactGrid}>
              
              <View style={styles.contactCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="call" size={24} color="#10b981" />
                </View>
                <Text style={styles.cardTitle}>Phone Support</Text>
                <Text style={styles.cardText}>{phone}</Text>
                <Text style={styles.cardSubText}>Mon-Sat, 9:00 AM to 6:00 PM</Text>
              </View>

              <View style={styles.contactCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="logo-whatsapp" size={24} color="#10b981" />
                </View>
                <Text style={styles.cardTitle}>WhatsApp</Text>
                <Text style={styles.cardText}>{whatsapp}</Text>
                <Text style={styles.cardSubText}>24/7 Automated Assistant</Text>
              </View>

              <View style={styles.contactCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="mail" size={24} color="#10b981" />
                </View>
                <Text style={styles.cardTitle}>Email</Text>
                <Text style={styles.cardText}>{email}</Text>
                <Text style={styles.cardSubText}>We reply within 24 hours</Text>
              </View>

              <View style={styles.contactCard}>
                <View style={styles.iconCircle}>
                  <Ionicons name="location" size={24} color="#10b981" />
                </View>
                <Text style={styles.cardTitle}>Corporate Office</Text>
                <Text style={styles.cardText} adjustsFontSizeToFit numberOfLines={2}>{address.split('\n')[0]}</Text>
                <Text style={styles.cardSubText}>{address.split('\n').slice(1).join('\n') || 'India'}</Text>
              </View>

            </View>
          )}
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
  content: { alignItems: 'center', padding: 20, maxWidth: 900, alignSelf: 'center', width: '100%', marginTop: 20 },
  title: { fontSize: 32, fontFamily: FONT.extraBold, color: '#fff', marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, fontFamily: FONT.medium, color: '#cbd5e1', textAlign: 'center', marginBottom: 40, maxWidth: 500 },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 20, justifyContent: 'center', width: '100%' },
  contactCard: { backgroundColor: '#1e293b', padding: 24, borderRadius: 20, width: 280, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(16, 185, 129, 0.15)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 18, fontFamily: FONT.bold, color: '#fff', marginBottom: 8 },
  cardText: { fontSize: 16, fontFamily: FONT.bold, color: '#10b981', marginBottom: 4, textAlign: 'center' },
  cardSubText: { fontSize: 13, fontFamily: FONT.medium, color: '#94a3b8', textAlign: 'center' },
});
