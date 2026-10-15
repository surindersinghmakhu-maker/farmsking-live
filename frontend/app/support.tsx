import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
  TextInput,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';

interface FAQItem {
  id: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  question: string;
  answer: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: 'f1',
    category: 'Orders & Delivery',
    icon: 'cart-outline',
    question: 'How do I track my agricultural inputs and seed orders?',
    answer: 'You can track your orders in real time by visiting the "Order Tracking" section on our website or app with your Order ID or phone number. You also receive automated SMS and WhatsApp milestone notifications at dispatch, transit, and out-for-delivery.',
  },
  {
    id: 'f2',
    category: 'Crop Doctor & AI',
    icon: 'scan-outline',
    question: 'How does the 5-Second AI Crop Doctor disease scanner work?',
    answer: 'Simply upload or take a clear photo of the infected crop leaf or stem. Our computer vision neural network analyzes the lesion patterns and symptoms against 80+ agricultural pathogens, providing instant diagnosis, chemical prescriptions, and biological treatment steps within 5 seconds.',
  },
  {
    id: 'f3',
    category: 'Crop Doctor & AI',
    icon: 'medkit-outline',
    question: 'Can I get a human agronomist second opinion on diagnosis?',
    answer: 'Yes! After your initial AI scan, tap "Request Agronomist Review". A certified agricultural university specialist will inspect your diagnostic report and verify the chemical dosage within 30 minutes during field hours.',
  },
  {
    id: 'f4',
    category: 'Mandi Rates',
    icon: 'trending-up-outline',
    question: 'How frequently are the APMC Mandi rates updated on FarmsKing?',
    answer: 'Our mandi rate feed synchronizes directly with eNAM and Agmarknet government market yards twice daily. You can inspect minimum, maximum, and modal auction rates across 1,000+ regulated mandis by crop variety and state.',
  },
  {
    id: 'f5',
    category: 'Payments & COD',
    icon: 'card-outline',
    question: 'What payment methods are supported for farm inputs?',
    answer: 'FarmsKing supports UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards, Net Banking, and Cash on Delivery (COD) for eligible agricultural pin codes across India.',
  },
  {
    id: 'f6',
    category: 'Returns & Refund',
    icon: 'return-down-back-outline',
    question: 'What is the return and replacement policy for seeds and chemicals?',
    answer: 'All sealed products damaged in transit or bearing manufacturing defects are eligible for replacement or full refund within 7 days of delivery. In accordance with statutory biosecurity standards, opened seed packets cannot be returned.',
  },
  {
    id: 'f7',
    category: 'Digital Farm Records',
    icon: 'calendar-outline',
    question: 'Is my farm land and financial ledger data kept private?',
    answer: 'Absolutely. In accordance with the Digital Personal Data Protection Act 2023, your farm boundaries, spray logs, and expense cashbooks are encrypted with 256-bit SSL and are never sold or shared with unauthorized commercial parties.',
  },
  {
    id: 'f8',
    category: 'Partnership',
    icon: 'people-outline',
    question: 'How can input dealers, nursery owners, and agronomists partner with FarmsKing?',
    answer: 'Input dealers can apply through the Seller Portal to list certified seeds and fertilizers. Agronomists can register under our Partner Program to provide verified village advisory and earn consultation honorariums.',
  },
];

export default function SupportPage() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expandedId, setExpandedId] = useState<string | null>('f1');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('farmsking_theme_mode');
      if (saved === 'night' || saved === 'day') setThemeMode(saved);
      const handleStorage = () => {
        const t = localStorage.getItem('farmsking_theme_mode');
        if (t === 'night' || t === 'day') setThemeMode(t);
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const isDay = themeMode === 'day';

  const categories = useMemo(() => {
    return ['All', 'Orders & Delivery', 'Crop Doctor & AI', 'Mandi Rates', 'Payments & COD', 'Returns & Refund', 'Digital Farm Records', 'Partnership'];
  }, []);

  const filteredFaqs = useMemo(() => {
    return FAQS_DATA.filter((item) => {
      const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.question.toLowerCase().includes(q) ||
        item.answer.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      {/* Ambient Glow */}
      <View style={isDay ? styles.glowOrbMintDay : styles.glowOrbMintNight} />
      <View style={isDay ? styles.glowOrbBlueDay : styles.glowOrbBlueNight} />

      <PublicHeader themeMode={themeMode} onThemeToggle={(m) => setThemeMode(m)} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>
          {/* Breadcrumb / Back Link */}
          <TouchableOpacity style={styles.backRow} onPress={() => router.push('/')} activeOpacity={0.75}>
            <Ionicons name="arrow-back" size={15} color={isDay ? '#059669' : '#34d399'} />
            <Text style={[styles.backText, isDay ? styles.backTextDay : styles.backTextNight]}>
              Back to FarmsKing
            </Text>
          </TouchableOpacity>

          {/* Hero Header */}
          <View style={[styles.heroCard, isDay ? styles.heroCardDay : styles.heroCardNight]}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.centerBadge, isDay ? styles.centerBadgeDay : styles.centerBadgeNight]}>
                <Ionicons name="help-buoy" size={13} color={isDay ? '#059669' : '#34d399'} />
                <Text style={[styles.centerBadgeText, isDay ? styles.centerBadgeTextDay : styles.centerBadgeTextNight]}>
                  KNOWLEDGE BASE &amp; ADVISORY HELP CENTER
                </Text>
              </View>
            </View>

            <Text style={[styles.heroTitle, isDay ? styles.heroTitleDay : styles.heroTitleNight]}>
              FarmsKing Help Center
            </Text>
            <Text style={[styles.heroSub, isDay ? styles.heroSubDay : styles.heroSubNight]}>
              Comprehensive guidance and 24/7 support for cultivators, farmers, agronomists, and agri-dealers across India.
            </Text>

            {/* Live Search Input */}
            <View style={[styles.searchWrap, isDay ? styles.searchWrapDay : styles.searchWrapNight]}>
              <Ionicons name="search" size={18} color={isDay ? '#059669' : '#34d399'} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, isDay ? styles.searchInputDay : styles.searchInputNight]}
                placeholder="Search queries (e.g. tracking, crop scan, mandi rates, COD, returns)..."
                placeholderTextColor={isDay ? '#94a3b8' : '#64748b'}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={18} color={isDay ? '#94a3b8' : '#64748b'} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Category Filter Chips */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catChipsRow}>
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.catChip,
                    active
                      ? styles.catChipActive
                      : (isDay ? styles.catChipDay : styles.catChipNight),
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      active
                        ? styles.catChipTextActive
                        : (isDay ? styles.catChipTextDay : styles.catChipTextNight),
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* FAQ Accordion List */}
          <View style={styles.faqList}>
            {filteredFaqs.length === 0 ? (
              <View style={[styles.emptyBox, isDay ? styles.emptyBoxDay : styles.emptyBoxNight]}>
                <Ionicons name="information-circle-outline" size={32} color={isDay ? '#94a3b8' : '#64748b'} />
                <Text style={[styles.emptyTitle, isDay ? styles.emptyTitleDay : styles.emptyTitleNight]}>
                  No matching questions found
                </Text>
                <Text style={[styles.emptySub, isDay ? styles.emptySubDay : styles.emptySubNight]}>
                  Try a different search term or select "All" categories above.
                </Text>
              </View>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = expandedId === faq.id;
                return (
                  <View
                    key={faq.id}
                    style={[
                      styles.faqCard,
                      isDay ? styles.faqCardDay : styles.faqCardNight,
                      isOpen && (isDay ? styles.faqCardOpenDay : styles.faqCardOpenNight),
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => toggleAccordion(faq.id)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.faqIconCircle, { backgroundColor: isDay ? '#ecfdf5' : 'rgba(16,185,129,0.15)' }]}>
                        <Ionicons name={faq.icon} size={18} color={isDay ? '#059669' : '#34d399'} />
                      </View>
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.faqCategory, isDay ? styles.faqCategoryDay : styles.faqCategoryNight]}>
                          {faq.category}
                        </Text>
                        <Text style={[styles.faqQuestion, isDay ? styles.faqQuestionDay : styles.faqQuestionNight]}>
                          {faq.question}
                        </Text>
                      </View>
                      <Ionicons
                        name={isOpen ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={isDay ? '#059669' : '#34d399'}
                      />
                    </TouchableOpacity>

                    {isOpen && (
                      <View style={styles.faqBody}>
                        <View style={[styles.faqDivider, isDay ? styles.faqDividerDay : styles.faqDividerNight]} />
                        <Text style={[styles.faqAnswer, isDay ? styles.faqAnswerDay : styles.faqAnswerNight]}>
                          {faq.answer}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>

          {/* Quick Helpline Callout Strip */}
          <View style={[styles.helplineBanner, isDay ? styles.helplineBannerDay : styles.helplineBannerNight]}>
            <View style={styles.helplineBannerLeft}>
              <View style={styles.helplineIconWrap}>
                <Ionicons name="call" size={20} color="#ffffff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.helplineBannerTitle}>Still Have Questions or Need Urgent Field Guidance?</Text>
                <Text style={styles.helplineBannerSub}>
                  Call our dedicated helpline at <Text style={{ fontFamily: FONT.extraBold }}>95776-22000</Text> or message on WhatsApp.
                </Text>
              </View>
            </View>

            <View style={styles.helplineActions}>
              <TouchableOpacity
                style={styles.callNowBtn}
                onPress={() => Linking.openURL('tel:9577622000')}
                activeOpacity={0.85}
              >
                <Ionicons name="call-outline" size={14} color="#064e3b" />
                <Text style={styles.callNowBtnText}>Call 9577622000</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.whatsAppBtn}
                onPress={() => Linking.openURL('https://wa.me/919577622000?text=Hello%20FarmsKing%2C%20I%20have%20a%20support%20query')}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={14} color="#ffffff" />
                <Text style={styles.whatsAppBtnText}>WhatsApp Chat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: 'relative' },
  rootDay: { backgroundColor: '#f8fafc' },
  rootNight: { backgroundColor: '#091310' },

  glowOrbMintDay: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(167, 243, 208, 0.28)',
    top: 40,
    left: -100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbMintNight: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    top: 40,
    left: -100,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbBlueDay: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(186, 230, 253, 0.22)',
    bottom: 60,
    right: -80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },
  glowOrbBlueNight: {
    position: 'absolute',
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    bottom: 60,
    right: -80,
    ...(Platform.OS === 'web' ? ({ filter: 'blur(110px)', pointerEvents: 'none' } as any) : {}),
  },

  scrollContent: { paddingBottom: 60, paddingTop: 90 },
  container: { width: '100%', maxWidth: 1040, alignSelf: 'center', paddingHorizontal: 16 },

  backRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 14, alignSelf: 'flex-start' },
  backText: { fontSize: 13, fontFamily: FONT.bold },
  backTextDay: { color: '#059669' },
  backTextNight: { color: '#34d399' },

  heroCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    ...premiumShadow('rgba(0,0,0,0.05)', 'sm'),
  },
  heroCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  heroCardNight: { backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)' },

  heroBadgeRow: { flexDirection: 'row', marginBottom: 10 },
  centerBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: RADIUS.pill, borderWidth: 1 },
  centerBadgeDay: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  centerBadgeNight: { backgroundColor: 'rgba(16,185,129,0.15)', borderColor: 'rgba(52,211,153,0.3)' },
  centerBadgeText: { fontSize: 10.5, fontFamily: FONT.extraBold, letterSpacing: 0.4 },
  centerBadgeTextDay: { color: '#047857' },
  centerBadgeTextNight: { color: '#34d399' },

  heroTitle: { fontSize: 28, fontFamily: FONT.extraBold, marginBottom: 6 },
  heroTitleDay: { color: '#0f172a' },
  heroTitleNight: { color: '#ffffff' },
  heroSub: { fontSize: 14, fontFamily: FONT.medium, lineHeight: 21, maxWidth: 760, marginBottom: 18 },
  heroSubDay: { color: '#475569' },
  heroSubNight: { color: '#cbd5e1' },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 14,
  },
  searchWrapDay: { backgroundColor: '#f8fafc', borderColor: '#cbd5e1' },
  searchWrapNight: { backgroundColor: '#111e19', borderColor: 'rgba(16,185,129,0.3)' },
  searchInput: { flex: 1, fontSize: 14, fontFamily: FONT.medium },
  searchInputDay: { color: '#0f172a' },
  searchInputNight: { color: '#ffffff' },

  catChipsRow: { flexDirection: 'row', gap: 8, paddingBottom: 14, paddingHorizontal: 2 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: RADIUS.pill, borderWidth: 1 },
  catChipDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  catChipNight: { backgroundColor: '#111e19', borderColor: 'rgba(255,255,255,0.12)' },
  catChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  catChipText: { fontSize: 12.5, fontFamily: FONT.bold },
  catChipTextDay: { color: '#475569' },
  catChipTextNight: { color: '#cbd5e1' },
  catChipTextActive: { color: '#ffffff' },

  faqList: { gap: 10, marginBottom: 20 },
  faqCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    ...premiumShadow('rgba(0,0,0,0.03)', 'xs'),
  },
  faqCardDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  faqCardNight: { backgroundColor: '#111e19', borderColor: 'rgba(255,255,255,0.08)' },
  faqCardOpenDay: { borderColor: '#a7f3d0' },
  faqCardOpenNight: { borderColor: 'rgba(52,211,153,0.35)' },

  faqHeader: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  faqIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  faqCategory: { fontSize: 10, fontFamily: FONT.extraBold, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  faqCategoryDay: { color: '#059669' },
  faqCategoryNight: { color: '#34d399' },
  faqQuestion: { fontSize: 15, fontFamily: FONT.bold, lineHeight: 20 },
  faqQuestionDay: { color: '#0f172a' },
  faqQuestionNight: { color: '#f8fafc' },

  faqBody: { paddingHorizontal: 16, paddingBottom: 16 },
  faqDivider: { height: 1, marginBottom: 12 },
  faqDividerDay: { backgroundColor: '#f1f5f9' },
  faqDividerNight: { backgroundColor: 'rgba(255,255,255,0.08)' },
  faqAnswer: { fontSize: 13.5, fontFamily: FONT.medium, lineHeight: 21 },
  faqAnswerDay: { color: '#475569' },
  faqAnswerNight: { color: '#cbd5e1' },

  emptyBox: { padding: 32, alignItems: 'center', borderRadius: 16, borderWidth: 1 },
  emptyBoxDay: { backgroundColor: '#ffffff', borderColor: '#e2e8f0' },
  emptyBoxNight: { backgroundColor: '#111e19', borderColor: 'rgba(255,255,255,0.08)' },
  emptyTitle: { fontSize: 16, fontFamily: FONT.bold, marginTop: 8 },
  emptyTitleDay: { color: '#0f172a' },
  emptyTitleNight: { color: '#ffffff' },
  emptySub: { fontSize: 13, fontFamily: FONT.medium, marginTop: 4, textAlign: 'center' },
  emptySubDay: { color: '#64748b' },
  emptySubNight: { color: '#94a3b8' },

  // Helpline Banner
  helplineBanner: {
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    flexDirection: 'column',
    gap: 16,
    ...premiumShadow('rgba(16,185,129,0.2)', 'md'),
  },
  helplineBannerDay: { backgroundColor: '#064e3b', borderColor: '#047857' },
  helplineBannerNight: { backgroundColor: '#042f2e', borderColor: '#065f46' },
  helplineBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  helplineIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  helplineBannerTitle: { fontSize: 16.5, fontFamily: FONT.extraBold, color: '#ffffff', marginBottom: 2 },
  helplineBannerSub: { fontSize: 13, fontFamily: FONT.medium, color: '#a7f3d0' },

  helplineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  callNowBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#a7f3d0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.pill },
  callNowBtnText: { color: '#064e3b', fontSize: 13, fontFamily: FONT.bold },
  whatsAppBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#16a34a', paddingHorizontal: 16, paddingVertical: 10, borderRadius: RADIUS.pill },
  whatsAppBtnText: { color: '#ffffff', fontSize: 13, fontFamily: FONT.bold },
});
