import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useProducts } from '@/src/hooks/useProducts';
import { FONT, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';
import { useAuth } from '@/src/store/auth-context';

// ── Per-topic brand color config ─────────────────────────────────────────────
const TOPIC_CONFIG: Record<string, {
  color: string; bg: string; lightBg: string; tint: string;
  icon: any; emoji: string;
  subtitle: string; details: string; features: string[];
}> = {
  Farming: {
    color: '#10b981', bg: '#ecfdf5', lightBg: '#f0fdf4', tint: 'rgba(16,185,129,0.08)',
    icon: 'leaf', emoji: '🌾',
    subtitle: 'Empowering farmers with modern tools, high-yield seeds, and expert advisory.',
    details: 'FarmsKing provides a complete end-to-end ecosystem for farmers. From advanced crop intelligence to the highest quality natural seeds and fertilizers, we aim to maximize your yield and profit. Join thousands of progressive farmers revolutionizing Indian agriculture.',
    features: ['High-Yield Seeds', 'Modern Farm Machinery', 'Expert Crop Advisory'],
  },
  Gardening: {
    color: '#e11d48', bg: '#fff1f2', lightBg: '#fdf2f8', tint: 'rgba(225,29,72,0.08)',
    icon: 'flower', emoji: '🌸',
    subtitle: 'Everything you need to build and maintain a beautiful, blooming garden.',
    details: 'Whether you are a hobbyist or a professional landscaper, our gardening section brings you the finest tools, organic composts, and exotic seeds. Grow your own organic vegetables or create stunning floral landscapes effortlessly with our premium supplies.',
    features: ['Organic Composts', 'Premium Garden Tools', 'Exotic Plant Seeds'],
  },
  'Crop-Doctors': {
    color: '#06b6d4', bg: '#ecfeff', lightBg: '#f0f9ff', tint: 'rgba(6,182,212,0.08)',
    icon: 'medkit', emoji: '🩺',
    subtitle: 'Instant diagnosis and expert solutions for all your crop diseases.',
    details: 'Our Kisan Crop Intelligence Engine and expert agronomists are available 24/7. Upload a picture of your infected crop, and get immediate recommendations on the exact crop protection chemicals and dosages required to save your harvest.',
    features: ['AI Crop Disease Detection', 'Expert Agronomists', 'Precise Chemical Dosages'],
  },
  'Crop Doctors': {
    color: '#06b6d4', bg: '#ecfeff', lightBg: '#f0f9ff', tint: 'rgba(6,182,212,0.08)',
    icon: 'medkit', emoji: '🩺',
    subtitle: 'Instant diagnosis and expert solutions for all your crop diseases.',
    details: 'Our Kisan Crop Intelligence Engine and expert agronomists are available 24/7. Upload a picture of your infected crop, and get immediate recommendations on the exact crop protection chemicals and dosages required to save your harvest.',
    features: ['AI Crop Disease Detection', 'Expert Agronomists', 'Precise Chemical Dosages'],
  },
  'Agri Store': {
    color: '#f97316', bg: '#fff7ed', lightBg: '#fffbeb', tint: 'rgba(249,115,22,0.08)',
    icon: 'storefront', emoji: '🏪',
    subtitle: 'Your one-stop destination for genuine, lab-tested agricultural products.',
    details: 'Shop from a wide range of verified crop protection chemicals, fertilizers, and farm equipment. We guarantee 100% original products delivered directly to your farm, eliminating middlemen and ensuring the best market prices.',
    features: ['100% Genuine Products', 'Direct Farm Delivery', 'Best Market Prices'],
  },
};

const DEFAULT_CONFIG = {
  color: '#10b981', bg: '#ecfdf5', lightBg: '#f0fdf4', tint: 'rgba(16,185,129,0.08)',
  icon: 'apps' as any, emoji: '🌿',
  subtitle: 'Explore our agricultural platform.',
  details: 'Explore our vast catalogue of verified agricultural products and services tailored for your specific needs.',
  features: [],
};

export default function TopicPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;
  const { user } = useAuth();

  const title = id ? id.replace('-', ' ') : 'Topic';
  const cfg = TOPIC_CONFIG[id || ''] || DEFAULT_CONFIG;

  const QUICK_LINKS = [
    { label: 'Agri Store', path: '/shop', icon: 'storefront-outline', color: '#f97316' },
    { label: 'Farming', path: '/topic/Farming', icon: 'leaf-outline', color: '#10b981' },
    { label: 'Gardening', path: '/topic/Gardening', icon: 'flower-outline', color: '#e11d48' },
    { label: 'Crop Doctors', path: '/topic/Crop-Doctors', icon: 'medkit-outline', color: '#06b6d4' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: cfg.bg }]}>
      <PublicHeader />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isMobile ? 80 : 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO SECTION ── */}
        <View style={[styles.hero, { backgroundColor: cfg.lightBg, borderBottomWidth: 1, borderBottomColor: `${cfg.color}20` }]}>
          {/* Icon circle */}
          <View style={[styles.iconCircle, { backgroundColor: `${cfg.color}15`, borderColor: `${cfg.color}30` }]}>
            <Ionicons name={cfg.icon} size={isMobile ? 36 : 48} color={cfg.color} />
          </View>

          <Text style={[styles.emoji]}>{cfg.emoji}</Text>

          <Text style={[styles.pageTitle, { color: cfg.color, fontSize: isMobile ? 28 : 40 }]}>
            {title}
          </Text>
          <Text style={[styles.pageSubtitle, { fontSize: isMobile ? 14 : 16 }]}>
            {cfg.subtitle}
          </Text>

          {/* CTA */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.ctaPrimary, { backgroundColor: cfg.color }]}
              onPress={() => router.push('/shop')}
            >
              <Ionicons name="storefront-outline" size={16} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Browse Store</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ctaSecondary, { borderColor: cfg.color }]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Ionicons name="person-outline" size={16} color={cfg.color} />
              <Text style={[styles.ctaSecondaryText, { color: cfg.color }]}>Get Started</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── DETAILS CARD ── */}
        <View style={styles.section}>
          <View style={[styles.detailsCard, { borderColor: `${cfg.color}20`, backgroundColor: '#ffffff' }]}>
            <View style={styles.cardHeader}>
              <Ionicons name="information-circle" size={20} color={cfg.color} />
              <Text style={[styles.cardHeaderText, { color: cfg.color }]}>About {title}</Text>
            </View>
            <Text style={styles.detailsText}>{cfg.details}</Text>

            {/* Feature Pills */}
            {cfg.features.length > 0 && (
              <View style={styles.featuresList}>
                {cfg.features.map((feat, idx) => (
                  <View key={idx} style={[styles.featureItem, { backgroundColor: `${cfg.color}10`, borderColor: `${cfg.color}25` }]}>
                    <Ionicons name="checkmark-circle" size={16} color={cfg.color} />
                    <Text style={[styles.featureText, { color: cfg.color }]}>{feat}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── QUICK LINKS ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Explore More</Text>
          <View style={styles.quickLinks}>
            {QUICK_LINKS.filter(l => !l.path.includes(String(id))).map(link => (
              <TouchableOpacity
                key={link.path}
                style={[styles.quickLink, { borderColor: `${link.color}25`, backgroundColor: `${link.color}08` }]}
                onPress={() => router.push(link.path as any)}
              >
                <View style={[styles.quickLinkIcon, { backgroundColor: `${link.color}15` }]}>
                  <Ionicons name={link.icon as any} size={20} color={link.color} />
                </View>
                <Text style={[styles.quickLinkText, { color: link.color }]}>{link.label}</Text>
                <Ionicons name="chevron-forward" size={14} color={link.color} style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── BACK HOME ── */}
        <View style={{ alignItems: 'center', marginTop: 8, marginBottom: 20 }}>
          <TouchableOpacity
            style={[styles.backHome, { borderColor: `${cfg.color}30` }]}
            onPress={() => router.push('/')}
          >
            <Ionicons name="home-outline" size={16} color={cfg.color} />
            <Text style={[styles.backHomeText, { color: cfg.color }]}>Go to Home</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 80, zIndex: 10 },

  // Hero
  hero: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 36, gap: 10 },
  iconCircle: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, marginBottom: 4 },
  emoji: { fontSize: 32, marginBottom: 0 },
  pageTitle: { fontFamily: FONT.extraBold, textAlign: 'center', textTransform: 'capitalize', marginBottom: 4 },
  pageSubtitle: { fontFamily: FONT.medium, color: '#475569', textAlign: 'center', maxWidth: 560, lineHeight: 24 },
  ctaRow: { flexDirection: 'row', gap: 12, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' },
  ctaPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 99, ...premiumShadow('rgba(0,0,0,0.1)', 'sm') },
  ctaPrimaryText: { color: '#ffffff', fontFamily: FONT.bold, fontSize: 14 },
  ctaSecondary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 22, paddingVertical: 11, borderRadius: 99, borderWidth: 1.5, backgroundColor: '#ffffff' },
  ctaSecondaryText: { fontFamily: FONT.bold, fontSize: 14 },

  // Section
  section: { paddingHorizontal: 16, paddingTop: 24, maxWidth: 860, width: '100%', alignSelf: 'center' },
  sectionLabel: { fontSize: 11, fontFamily: FONT.bold, color: '#94a3b8', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 },

  // Details card
  detailsCard: { borderRadius: 20, padding: 22, borderWidth: 1, ...premiumShadow('rgba(0,0,0,0.05)', 'sm') },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  cardHeaderText: { fontSize: 15, fontFamily: FONT.bold },
  detailsText: { fontSize: 14, color: '#475569', fontFamily: FONT.medium, lineHeight: 23, marginBottom: 18 },
  featuresList: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99, borderWidth: 1 },
  featureText: { fontFamily: FONT.bold, fontSize: 13 },

  // Quick links
  quickLinks: { gap: 10 },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  quickLinkIcon: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  quickLinkText: { fontSize: 14, fontFamily: FONT.bold },

  // Back
  backHome: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 99, borderWidth: 1, backgroundColor: '#ffffff' },
  backHomeText: { fontFamily: FONT.bold, fontSize: 13 },
});
