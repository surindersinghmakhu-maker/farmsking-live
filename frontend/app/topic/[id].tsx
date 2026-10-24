import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';
import { useAuth } from '@/src/store/auth-context';

// ── Per-topic 3D/4D digital picture config ─────────────────────────────────────
const TOPIC_CONFIG: Record<
  string,
  {
    color: string;
    bg: string;
    lightBg: string;
    tint: string;
    image: any;
    badge: string;
    subtitle: string;
    details: string;
    features: string[];
  }
> = {
  Farming: {
    color: '#10b981',
    bg: '#f0fdf4',
    lightBg: '#ecfdf5',
    tint: 'rgba(16,185,129,0.08)',
    image: require('@/assets/images/icon_farming_3d_clean.png'),
    badge: '🌾 SMART DIGITAL FARMING',
    subtitle: 'Empowering farmers with modern high-yield seeds, live plants, and expert advisory.',
    details:
      'FarmsKing provides a complete end-to-end ecosystem for farmers. From advanced crop intelligence to the highest quality natural seeds and fertilizers, we aim to maximize your yield and profit. Join thousands of progressive farmers revolutionizing Indian agriculture.',
    features: [
      'High-Yield Certified Seeds',
      'Live Plants & Nursery',
      'Expert Agronomist Advisory',
      'Digital Soil Health Mapping',
      'Real-Time APMC Mandi Rates',
    ],
  },
  Gardening: {
    color: '#e11d48',
    bg: '#fff1f2',
    lightBg: '#fdf2f8',
    tint: 'rgba(225,29,72,0.08)',
    image: require('@/assets/images/icon_gardening_3d_clean.png'),
    badge: '🌸 URBAN & HOME GARDENING',
    subtitle: 'Everything you need to build and maintain a beautiful, blooming garden.',
    details:
      'Whether you are a hobbyist or a professional landscaper, our gardening section brings you the finest live plants, organic composts, and exotic seeds. Grow your own organic vegetables or create stunning floral landscapes effortlessly with our premium supplies.',
    features: [
      'Organic Composts & Nutrients',
      'Live Plants & Ornamental Saplings',
      'Exotic & Flower Plant Seeds',
      'Potting Soil & Cocopeat Blocks',
      'Home Garden Plant Care Guides',
    ],
  },
  'Crop-Doctors': {
    color: '#06b6d4',
    bg: '#ecfeff',
    lightBg: '#f0f9ff',
    tint: 'rgba(6,182,212,0.08)',
    image: require('@/assets/images/icon_cropdoctors_3d_clean.png'),
    badge: '🩺 24/7 AI CROP DIAGNOSTICS',
    subtitle: 'Instant diagnosis and expert solutions for all your crop diseases.',
    details:
      'Our Kisan Crop Intelligence Engine and expert agronomists are available 24/7. Upload a picture of your infected crop, and get immediate recommendations on the exact crop protection chemicals and dosages required to save your harvest.',
    features: [
      'AI Instant Disease Detection',
      '1200+ Verified Crop Specialists',
      'Precise Chemical & Dosage Guidance',
      'Digital Prescription Tracking',
      'Zero Delay Consultation Response',
    ],
  },
  'Crop Doctors': {
    color: '#06b6d4',
    bg: '#ecfeff',
    lightBg: '#f0f9ff',
    tint: 'rgba(6,182,212,0.08)',
    image: require('@/assets/images/icon_cropdoctors_3d_clean.png'),
    badge: '🩺 24/7 AI CROP DIAGNOSTICS',
    subtitle: 'Instant diagnosis and expert solutions for all your crop diseases.',
    details:
      'Our Kisan Crop Intelligence Engine and expert agronomists are available 24/7. Upload a picture of your infected crop, and get immediate recommendations on the exact crop protection chemicals and dosages required to save your harvest.',
    features: [
      'AI Instant Disease Detection',
      '1200+ Verified Crop Specialists',
      'Precise Chemical & Dosage Guidance',
      'Digital Prescription Tracking',
      'Zero Delay Consultation Response',
    ],
  },
  'Agri Store': {
    color: '#f97316',
    bg: '#fff7ed',
    lightBg: '#fffbeb',
    tint: 'rgba(249,115,22,0.08)',
    image: require('@/assets/images/icon_agristore_new.png'),
    badge: '🏪 CERTIFIED DIRECT STORE',
    subtitle: 'Your one-stop destination for genuine, lab-tested agricultural products.',
    details:
      'Shop from a wide range of verified crop protection chemicals, fertilizers, organic inputs, and live plants. We guarantee 100% original products delivered directly to your farm, eliminating middlemen and ensuring the best market prices.',
    features: [
      '100% Genuine Lab-Tested Products',
      'Direct Farm Doorstep Delivery',
      'Wholesale & Factory Direct Rates',
      'Cash on Delivery (COD) Available',
      'Hassle-Free Replacement Policy',
    ],
  },
};

const DEFAULT_CONFIG = {
  color: '#10b981',
  bg: '#ecfdf5',
  lightBg: '#f0fdf4',
  tint: 'rgba(16,185,129,0.08)',
  image: require('@/assets/images/icon_farming_new.png'),
  badge: '👑 FARMSKING PLATFORM',
  subtitle: 'Explore our agricultural platform.',
  details:
    'Explore our vast catalogue of verified agricultural products and services tailored for your specific needs.',
  features: ['Smart Agriculture Ecosystem', 'Direct Farm Support', 'Verified Inputs'],
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
    {
      label: 'Agri Store',
      path: '/shop',
      image: require('@/assets/images/icon_agristore_new.png'),
      color: '#f97316',
      subtitle: 'Certified Seeds & Inputs',
    },
    {
      label: 'Farming',
      path: '/topic/Farming',
      image: require('@/assets/images/icon_farming_new.png'),
      color: '#10b981',
      subtitle: 'Yield & Crop Intelligence',
    },
    {
      label: 'Gardening',
      path: '/topic/Gardening',
      image: require('@/assets/images/icon_gardening_new.png'),
      color: '#e11d48',
      subtitle: 'Flowers & Home Growing',
    },
    {
      label: 'Crop Doctors',
      path: '/topic/Crop-Doctors',
      image: require('@/assets/images/icon_cropdoctors_new.png'),
      color: '#06b6d4',
      subtitle: 'AI Disease Diagnostics',
    },
  ];

  return (
    <View style={[styles.container, { backgroundColor: cfg.bg }]}>
      <PublicHeader />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: isMobile ? 110 : 70 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HERO 3D PICTURE SHOWCASE ── */}
        <View
          style={[
            styles.hero,
            { backgroundColor: cfg.lightBg, borderBottomWidth: 1, borderBottomColor: `${cfg.color}25` },
          ]}
        >
          {/* Official Module Badge */}
          <View style={[styles.moduleBadge, { borderColor: `${cfg.color}40`, backgroundColor: `${cfg.color}15` }]}>
            <Text style={[styles.moduleBadgeText, { color: cfg.color }]}>{cfg.badge}</Text>
          </View>

          {/* 3D/4D Picture Showcase Frame */}
          <View
            style={[
              styles.showcaseCard,
              {
                width: isMobile ? 140 : 190,
                height: isMobile ? 140 : 190,
                borderColor: `${cfg.color}35`,
                shadowColor: cfg.color,
              },
            ]}
          >
            <LinearGradient
              colors={[`${cfg.color}20`, 'rgba(255,255,255,0.95)']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Image
              source={cfg.image}
              style={[
                styles.showcaseImage,
                { width: isMobile ? 130 : 176, height: isMobile ? 130 : 176 },
              ]}
              resizeMode="contain"
            />
          </View>

          <Text style={[styles.pageTitle, { color: cfg.color, fontSize: isMobile ? 26 : 38 }]}>
            {title}
          </Text>
          <Text style={[styles.pageSubtitle, { fontSize: isMobile ? 13.5 : 15.5 }]}>
            {cfg.subtitle}
          </Text>

          {/* Action CTAs */}
          <View style={styles.ctaRow}>
            <TouchableOpacity
              style={[styles.ctaPrimary, { backgroundColor: cfg.color }]}
              onPress={() => router.push('/shop')}
              activeOpacity={0.85}
            >
              <Ionicons name="storefront-outline" size={17} color="#fff" />
              <Text style={styles.ctaPrimaryText}>Browse Agri Store</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.ctaSecondary, { borderColor: cfg.color }]}
              onPress={() => router.push(user ? ('/(user)/(tabs)' as any) : ('/(auth)/login' as any))}
              activeOpacity={0.85}
            >
              <Ionicons name="person-outline" size={17} color={cfg.color} />
              <Text style={[styles.ctaSecondaryText, { color: cfg.color }]}>
                {user ? 'Open Dashboard' : 'Login / Register'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── DETAILS & VALUE PROPOSITION ── */}
        <View style={styles.section}>
          <View style={[styles.detailsCard, { borderColor: `${cfg.color}25`, backgroundColor: '#ffffff' }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardHeaderIconBox, { backgroundColor: `${cfg.color}15` }]}>
                <Ionicons name="information-circle" size={20} color={cfg.color} />
              </View>
              <View>
                <Text style={[styles.cardHeaderText, { color: cfg.color }]}>About {title}</Text>
                <Text style={styles.cardHeaderSub}>Direct platform solutions & services</Text>
              </View>
            </View>
            <Text style={styles.detailsText}>{cfg.details}</Text>

            {/* Feature Pills */}
            {cfg.features.length > 0 && (
              <View style={styles.featuresList}>
                {cfg.features.map((feat, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.featureItem,
                      { backgroundColor: `${cfg.color}0c`, borderColor: `${cfg.color}28` },
                    ]}
                  >
                    <Ionicons name="checkmark-circle" size={16} color={cfg.color} />
                    <Text style={[styles.featureText, { color: cfg.color }]}>{feat}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* ── 3D VISUAL MENU IDENTIFIERS (EXPLORE MORE) ── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Explore Other Modules</Text>
          <View style={styles.quickLinksGrid}>
            {QUICK_LINKS.filter((l) => !l.path.includes(String(id))).map((link) => (
              <TouchableOpacity
                key={link.path}
                style={[
                  styles.quickLinkCard,
                  { borderColor: `${link.color}28`, backgroundColor: '#ffffff' },
                ]}
                onPress={() => router.push(link.path as any)}
                activeOpacity={0.88}
              >
                {/* 3D Digital Thumbnail */}
                <View
                  style={[
                    styles.quickLinkImgFrame,
                    { borderColor: `${link.color}35`, backgroundColor: `${link.color}10` },
                  ]}
                >
                  <Image source={link.image} style={styles.quickLinkImg} resizeMode="contain" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={[styles.quickLinkTitle, { color: link.color }]}>{link.label}</Text>
                  <Text style={styles.quickLinkSub} numberOfLines={1}>
                    {link.subtitle}
                  </Text>
                </View>

                <View style={[styles.quickLinkArrow, { backgroundColor: `${link.color}15` }]}>
                  <Ionicons name="arrow-forward" size={14} color={link.color} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── BACK TO HOME ── */}
        <View style={{ alignItems: 'center', marginTop: 14, marginBottom: 20 }}>
          <TouchableOpacity
            style={[styles.backHome, { borderColor: `${cfg.color}35` }]}
            onPress={() => router.push('/')}
            activeOpacity={0.85}
          >
            <Ionicons name="home-outline" size={16} color={cfg.color} />
            <Text style={[styles.backHomeText, { color: cfg.color }]}>Back to Homepage</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingTop: 78, zIndex: 10 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 34,
    gap: 10,
  },
  moduleBadge: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    marginBottom: 4,
  },
  moduleBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 1.2,
  },
  showcaseCard: {
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 6,
    ...premiumShadow('rgba(0,0,0,0.12)', 'md'),
  },
  showcaseImage: {
    borderRadius: 20,
  },
  pageTitle: {
    fontFamily: FONT.extraBold,
    textAlign: 'center',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  pageSubtitle: {
    fontFamily: FONT.medium,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 580,
    lineHeight: 22,
    paddingHorizontal: 12,
  },
  ctaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  ctaPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: RADIUS.pill,
    ...premiumShadow('rgba(0,0,0,0.12)', 'sm'),
  },
  ctaPrimaryText: {
    color: '#ffffff',
    fontFamily: FONT.extraBold,
    fontSize: 13.5,
  },
  ctaSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  ctaSecondaryText: {
    fontFamily: FONT.extraBold,
    fontSize: 13.5,
  },

  // Section
  section: {
    paddingHorizontal: 16,
    paddingTop: 22,
    maxWidth: 860,
    width: '100%',
    alignSelf: 'center',
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: FONT.extraBold,
    color: '#64748b',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },

  // Details card
  detailsCard: {
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    ...premiumShadow('rgba(0,0,0,0.06)', 'sm'),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  cardHeaderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderText: {
    fontSize: 16,
    fontFamily: FONT.extraBold,
  },
  cardHeaderSub: {
    fontSize: 11,
    color: '#64748b',
    fontFamily: FONT.medium,
  },
  detailsText: {
    fontSize: 14,
    color: '#334155',
    fontFamily: FONT.medium,
    lineHeight: 23,
    marginBottom: 18,
  },
  featuresList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  featureText: {
    fontFamily: FONT.bold,
    fontSize: 12.5,
  },

  // 3D Visual Quick Links Grid
  quickLinksGrid: {
    gap: 10,
  },
  quickLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1.5,
    ...premiumShadow('rgba(0,0,0,0.04)', 'sm'),
  },
  quickLinkImgFrame: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  quickLinkImg: {
    width: 44,
    height: 44,
  },
  quickLinkTitle: {
    fontSize: 14.5,
    fontFamily: FONT.extraBold,
  },
  quickLinkSub: {
    fontSize: 11.5,
    color: '#64748b',
    fontFamily: FONT.medium,
    marginTop: 1,
  },
  quickLinkArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Back
  backHome: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.pill,
    borderWidth: 1.5,
    backgroundColor: '#ffffff',
  },
  backHomeText: {
    fontFamily: FONT.extraBold,
    fontSize: 13,
  },
});
