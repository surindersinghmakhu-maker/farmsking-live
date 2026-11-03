import React, { useEffect, useState, useRef } from 'react';
import {
  Animated,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useRouter } from 'expo-router';
import { FONT, RADIUS, premiumShadow } from '@/constants/theme';
import PublicHeader from '@/components/PublicHeader';

type ComplianceTab = 'corporate' | 'roc' | 'standards' | 'grievance';

interface TabItemConfig {
  id: ComplianceTab;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const COMPLIANCE_TABS: TabItemConfig[] = [
  { id: 'corporate', label: 'Corporate Profile', icon: 'business-outline' },
  { id: 'roc', label: 'ROC Master Data', icon: 'file-tray-full-outline' },
  { id: 'standards', label: 'Statutory Standards', icon: 'shield-checkmark-outline' },
  { id: 'grievance', label: 'Grievance Desk', icon: 'person-outline' },
];

export default function ComplianceScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const [activeTab, setActiveTab] = useState<ComplianceTab>('corporate');
  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');

  // Animated sliding pill for compliance tabs
  const tabSlideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const idx =
      activeTab === 'corporate'
        ? 0
        : activeTab === 'roc'
        ? 1
        : activeTab === 'standards'
        ? 2
        : 3;
    Animated.spring(tabSlideAnim, {
      toValue: idx,
      friction: 9,
      tension: 65,
      useNativeDriver: false,
    }).start();
  }, [activeTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('farmsking_theme_mode');
      if (savedTheme === 'night' || savedTheme === 'day') {
        setThemeMode(savedTheme);
      }
      const handleStorage = () => {
        const t = localStorage.getItem('farmsking_theme_mode');
        if (t === 'night' || t === 'day') setThemeMode(t);
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const toggleTheme = (mode: 'day' | 'night') => {
    setThemeMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('farmsking_theme_mode', mode);
      window.dispatchEvent(new Event('storage'));
    }
  };

  const isDay = themeMode === 'day';

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Corporate Compliance & Statutory Disclosures • FarmsKing',
        }}
      />

      {/* Unified Public Floating Header */}
      <PublicHeader themeMode={themeMode} onThemeToggle={toggleTheme} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isMobile && styles.scrollContentMobile,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Top Breadcrumb / Back Link */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons
              name="arrow-back"
              size={16}
              color={isDay ? '#059669' : '#34d399'}
            />
            <Text
              style={[
                styles.backText,
                isDay ? styles.backTextDay : styles.backTextNight,
              ]}
            >
              Back to FarmsKing
            </Text>
          </TouchableOpacity>

          {/* Hero Banner */}
          <View
            style={[
              styles.heroCard,
              isDay ? styles.heroCardDay : styles.heroCardNight,
            ]}
          >
            <View style={styles.heroBadgeRow}>
              <View
                style={[
                  styles.govBadge,
                  isDay ? styles.govBadgeDay : styles.govBadgeNight,
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={14}
                  color={isDay ? '#059669' : '#00ff87'}
                />
                <Text
                  style={[
                    styles.govBadgeText,
                    isDay ? styles.govBadgeTextDay : styles.govBadgeTextNight,
                  ]}
                >
                  VERIFIED STATUTORY COMPLIANCE
                </Text>
              </View>
              <View
                style={[
                  styles.statuteBadge,
                  isDay ? styles.statuteBadgeDay : styles.statuteBadgeNight,
                ]}
              >
                <Text
                  style={[
                    styles.statuteBadgeText,
                    isDay ? styles.statuteBadgeTextDay : styles.statuteBadgeTextNight,
                  ]}
                >
                  COMPANIES ACT, 2013 • MCA INDIA
                </Text>
              </View>
            </View>

            <Text
              style={[
                styles.heroTitle,
                isDay ? styles.heroTitleDay : styles.heroTitleNight,
              ]}
            >
              Corporate Governance & Compliance Disclosures
            </Text>
            <Text
              style={[
                styles.heroSubtitle,
                isDay ? styles.heroSubtitleDay : styles.heroSubtitleNight,
              ]}
            >
              FARMSKING TECHNOLOGIES PRIVATE LIMITED • CIN: U01100PB2026PTC063294 • Regd. Jurisdiction: Punjab, India
            </Text>
            <Text
              style={[
                styles.cinNotice,
                isDay ? styles.cinNoticeDay : styles.cinNoticeNight,
              ]}
            >
              Incorporated under Ministry of Corporate Affairs (Govt. of India) • ROC Chandigarh
            </Text>

            {/* Interactive Tab Selector with Liquid Spring Sliding Pill */}
            <View
              style={[
                styles.tabBar,
                isDay ? styles.tabBarDay : styles.tabBarNight,
              ]}
            >
              {!isMobile && (
                <Animated.View
                  style={[
                    styles.slidingCompliancePill,
                    isDay
                      ? styles.slidingCompliancePillDay
                      : styles.slidingCompliancePillNight,
                    {
                      left: tabSlideAnim.interpolate({
                        inputRange: [0, 1, 2, 3],
                        outputRange: ['0.8%', '25.6%', '50.4%', '75.2%'],
                      }),
                    },
                  ]}
                />
              )}
              {COMPLIANCE_TABS.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.tabItem,
                    isMobile &&
                      activeTab === t.id &&
                      (isDay
                        ? styles.tabItemActiveDay
                        : styles.tabItemActiveNight),
                  ]}
                  onPress={() => setActiveTab(t.id)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={t.icon}
                    size={14}
                    color={
                      activeTab === t.id
                        ? isDay
                          ? '#059669'
                          : '#34d399'
                        : isDay
                        ? '#64748b'
                        : '#94a3b8'
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      isDay ? styles.tabTextDay : styles.tabTextNight,
                      activeTab === t.id &&
                        (isDay
                          ? styles.tabTextActiveDay
                          : styles.tabTextActiveNight),
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: CORPORATE PROFILE (CLEAN, 5-STAR EXECUTIVE SUMMARY)         */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'corporate' && (
            <>
              {/* Corporate Identity Summary Card */}
              <View
                style={[
                  styles.sectionCard,
                  isDay ? styles.sectionCardDay : styles.sectionCardNight,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDay
                          ? 'rgba(5,150,105,0.1)'
                          : 'rgba(52,211,153,0.15)',
                      },
                    ]}
                  >
                    <Ionicons
                      name="business"
                      size={18}
                      color={isDay ? '#059669' : '#34d399'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.cardTitle,
                        isDay ? styles.cardTitleDay : styles.cardTitleNight,
                      ]}
                    >
                      Company Profile &amp; Governance
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        isDay ? styles.cardSubtitleDay : styles.cardSubtitleNight,
                      ]}
                    >
                      Statutory legal entity information registered with ROC Chandigarh
                    </Text>
                  </View>
                </View>

                <View style={styles.profileGrid}>
                  <View
                    style={[
                      styles.profileItem,
                      isDay ? styles.profileItemDay : styles.profileItemNight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.profileLabel,
                        isDay ? styles.profileLabelDay : styles.profileLabelNight,
                      ]}
                    >
                      Registered Company
                    </Text>
                    <Text
                      style={[
                        styles.profileValue,
                        isDay ? styles.profileValueDay : styles.profileValueNight,
                      ]}
                    >
                      FARMSKING TECHNOLOGIES PRIVATE LIMITED
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.profileItem,
                      isDay ? styles.profileItemDay : styles.profileItemNight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.profileLabel,
                        isDay ? styles.profileLabelDay : styles.profileLabelNight,
                      ]}
                    >
                      Corporate Identification Number (CIN)
                    </Text>
                    <Text
                      style={[
                        styles.profileValueHighlight,
                        isDay ? styles.profileValueHighlightDay : styles.profileValueHighlightNight,
                      ]}
                    >
                      U01100PB2026PTC063294
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.profileItem,
                      isDay ? styles.profileItemDay : styles.profileItemNight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.profileLabel,
                        isDay ? styles.profileLabelDay : styles.profileLabelNight,
                      ]}
                    >
                      Jurisdiction &amp; Regulatory Body
                    </Text>
                    <Text
                      style={[
                        styles.profileValue,
                        isDay ? styles.profileValueDay : styles.profileValueNight,
                      ]}
                    >
                      ROC Chandigarh • Ministry of Corporate Affairs (Govt. of India)
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.profileItem,
                      isDay ? styles.profileItemDay : styles.profileItemNight,
                    ]}
                  >
                    <Text
                      style={[
                        styles.profileLabel,
                        isDay ? styles.profileLabelDay : styles.profileLabelNight,
                      ]}
                    >
                      Official Web Touchpoints
                    </Text>
                    <Text
                      style={[
                        styles.profileValue,
                        isDay ? styles.profileValueDay : styles.profileValueNight,
                      ]}
                    >
                      farmsking.in • www.farmsking.in
                    </Text>
                  </View>
                </View>

                <View style={[styles.addressBox, isDay ? styles.addressBoxDay : styles.addressBoxNight]}>
                  <View style={styles.addressRow}>
                    <Ionicons name="location" size={17} color={isDay ? '#059669' : '#34d399'} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.addressTitle, isDay ? styles.addressTitleDay : styles.addressTitleNight]}>
                        Registered Corporate Office:
                      </Text>
                      <Text style={[styles.addressText, isDay ? styles.addressTextDay : styles.addressTextNight]}>
                        VPO Goindwal Sahib, Tehsil Khadur Sahib, District Tarn Taran, Punjab, India - 143422
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.addressDivider, isDay ? styles.addressDividerDay : styles.addressDividerNight]} />

                  <View style={styles.addressRow}>
                    <Ionicons name="business-outline" size={17} color={isDay ? '#0284c7' : '#38bdf8'} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.addressTitle, isDay ? styles.addressTitleDay : styles.addressTitleNight]}>
                        Corporate Operations Hub:
                      </Text>
                      <Text style={[styles.addressText, isDay ? styles.addressTextDay : styles.addressTextNight]}>
                        Near Grain Market, Makhu, District Ferozepur, Punjab, India - 142044
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Core Approved Business Activities */}
              <View
                style={[
                  styles.sectionCard,
                  isDay ? styles.sectionCardDay : styles.sectionCardNight,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDay
                          ? 'rgba(2,132,199,0.1)'
                          : 'rgba(56,189,248,0.15)',
                      },
                    ]}
                  >
                    <Ionicons
                      name="layers"
                      size={18}
                      color={isDay ? '#0284c7' : '#38bdf8'}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[
                        styles.cardTitle,
                        isDay ? styles.cardTitleDay : styles.cardTitleNight,
                      ]}
                    >
                      Approved Core Business Scope
                    </Text>
                    <Text
                      style={[
                        styles.cardSubtitle,
                        isDay ? styles.cardSubtitleDay : styles.cardSubtitleNight,
                      ]}
                    >
                      Executive overview of approved technological and agricultural services
                    </Text>
                  </View>
                </View>

                <View style={styles.capabilitiesList}>
                  <View
                    style={[
                      styles.capabilityCard,
                      isDay ? styles.capabilityCardDay : styles.capabilityCardNight,
                    ]}
                  >
                    <View style={[styles.capIconCircle, { backgroundColor: isDay ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                      <Ionicons name="leaf" size={18} color={isDay ? '#059669' : '#34d399'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.capTitle, isDay ? styles.capTitleDay : styles.capTitleNight]}>
                        Smart Agriculture Platform &amp; Marketplace
                      </Text>
                      <Text style={[styles.capDesc, isDay ? styles.capDescDay : styles.capDescNight]}>
                        Digital agronomy portal connecting cultivators, certified input manufacturers, and trade buyers across India for fair, transparent agricultural commerce.
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.capabilityCard,
                      isDay ? styles.capabilityCardDay : styles.capabilityCardNight,
                    ]}
                  >
                    <View style={[styles.capIconCircle, { backgroundColor: isDay ? 'rgba(2,132,199,0.1)' : 'rgba(56,189,248,0.15)' }]}>
                      <Ionicons name="scan-circle" size={18} color={isDay ? '#0284c7' : '#38bdf8'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.capTitle, isDay ? styles.capTitleDay : styles.capTitleNight]}>
                        AI Crop Doctor &amp; Plant Pathology Diagnostics
                      </Text>
                      <Text style={[styles.capDesc, isDay ? styles.capDescDay : styles.capDescNight]}>
                        Instant visual leaf disease diagnosis, scientific tank-mix dosage calculation, and crop health advisory benchmarked against ICAR and state university guidelines.
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.capabilityCard,
                      isDay ? styles.capabilityCardDay : styles.capabilityCardNight,
                    ]}
                  >
                    <View style={[styles.capIconCircle, { backgroundColor: isDay ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)' }]}>
                      <Ionicons name="trending-up" size={18} color={isDay ? '#d97706' : '#fbbf24'} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.capTitle, isDay ? styles.capTitleDay : styles.capTitleNight]}>
                        APMC Mandi Intelligence &amp; Certified Inputs
                      </Text>
                      <Text style={[styles.capDesc, isDay ? styles.capDescDay : styles.capDescNight]}>
                        Real-time mandi price trends, arrival analysis, and distribution of laboratory-tested seeds, bio-fertilizers, and organic nutrients.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: ROC MASTER DATA                                             */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'roc' && (
            <View
              style={[
                styles.sectionCard,
                isDay ? styles.sectionCardDay : styles.sectionCardNight,
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDay
                        ? 'rgba(5,150,105,0.1)'
                        : 'rgba(52,211,153,0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name="file-tray-full"
                    size={18}
                    color={isDay ? '#059669' : '#34d399'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isDay ? styles.cardTitleDay : styles.cardTitleNight,
                    ]}
                  >
                    MCA Company Master Data Record
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      isDay ? styles.cardSubtitleDay : styles.cardSubtitleNight,
                    ]}
                  >
                    Public statutory corporate details registered with Registrar of Companies
                  </Text>
                </View>
              </View>

              <View style={styles.tableContainer}>
                {[
                  { k: 'Corporate Identification Number (CIN)', v: 'U01100PB2026PTC063294' },
                  { k: 'Company Name', v: 'FARMSKING TECHNOLOGIES PRIVATE LIMITED' },
                  { k: 'ROC Registration Jurisdiction', v: 'ROC - Chandigarh (Punjab)' },
                  { k: 'Company Category', v: 'Company limited by Shares' },
                  { k: 'Class of Company', v: 'Private Company' },
                  { k: 'Operating Status', v: 'Active (Incorporated under Companies Act, 2013)' },
                  { k: 'Principal Sector', v: 'Agri-Tech Digital Platforms, AI Crop Diagnostics & Farm Commerce' },
                  { k: 'Registered Office Address', v: 'VPO Goindwal Sahib, Tehsil Khadur Sahib, Tarn Taran, Punjab, India - 143422' },
                  { k: 'Corporate / Operations Office', v: 'Near Grain Market, Makhu, District Ferozepur, Punjab, India - 142044' },
                  { k: 'Official Email Contact', v: 'farmskingindia@gmail.com / support@farmsking.in' },
                  { k: 'Farmer Support Helpline', v: '+91 95776-22000 (Mon - Sat, 10:00 AM – 5:00 PM IST)' },
                ].map((row, idx) => (
                  <View
                    key={row.k}
                    style={[
                      styles.tableRow,
                      idx % 2 === 1 &&
                        (isDay ? styles.tableRowAltDay : styles.tableRowAltNight),
                    ]}
                  >
                    <Text
                      style={[
                        styles.tableKey,
                        isDay ? styles.tableKeyDay : styles.tableKeyNight,
                      ]}
                    >
                      {row.k}
                    </Text>
                    <Text
                      style={[
                        styles.tableVal,
                        isDay ? styles.tableValDay : styles.tableValNight,
                      ]}
                    >
                      {row.v}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: STATUTORY & REGULATORY STANDARDS                            */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'standards' && (
            <>
              {/* Quality Assurance */}
              <View
                style={[
                  styles.sectionCard,
                  isDay ? styles.sectionCardDay : styles.sectionCardNight,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDay
                          ? 'rgba(16,185,129,0.1)'
                          : 'rgba(52,211,153,0.15)',
                      },
                    ]}
                  >
                    <Ionicons
                      name="checkmark-done-circle"
                      size={18}
                      color={isDay ? '#059669' : '#34d399'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      isDay ? styles.cardTitleDay : styles.cardTitleNight,
                    ]}
                  >
                    1. Certified Agricultural Input Quality Assurance
                  </Text>
                </View>
                <Text
                  style={[
                    styles.bodyText,
                    isDay ? styles.bodyTextDay : styles.bodyTextNight,
                  ]}
                >
                  All hybrid seeds, crop nutrients, bio-fertilizers, and plant protection formulations cataloged on FarmsKing strictly comply with statutory national frameworks:
                </Text>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                  <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Seeds Act, 1966 &amp; Seeds Rules, 1968: </Text>
                    Verified germination percentage, genetic purity, and official certification standards.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                  <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Fertilizer Control Order, 1985 (FCO): </Text>
                    Laboratory-tested nutrient formulations with verified batch standards.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                  <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Insecticides Act, 1968 (CIB&amp;RC): </Text>
                    Supplied strictly through registered manufacturers with authorized certifications.
                  </Text>
                </View>
              </View>

              {/* APMC Mandi Intelligence */}
              <View
                style={[
                  styles.sectionCard,
                  isDay ? styles.sectionCardDay : styles.sectionCardNight,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDay
                          ? 'rgba(2,132,199,0.1)'
                          : 'rgba(56,189,248,0.15)',
                      },
                    ]}
                  >
                    <Ionicons
                      name="trending-up"
                      size={18}
                      color={isDay ? '#0284c7' : '#38bdf8'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      isDay ? styles.cardTitleDay : styles.cardTitleNight,
                    ]}
                  >
                    2. Mandi Price Intelligence &amp; APMC Framework
                  </Text>
                </View>
                <Text
                  style={[
                    styles.bodyText,
                    isDay ? styles.bodyTextDay : styles.bodyTextNight,
                  ]}
                >
                  Agricultural commodity prices and mandi arrival trends displayed across FarmsKing are aggregated from verified arrivals and market intelligence feeds for informational and crop planning purposes. Physical auctions and mandi settlements remain subject to respective State APMC Acts and local regulated market committees.
                </Text>
              </View>

              {/* Data Protection & Privacy */}
              <View
                style={[
                  styles.sectionCard,
                  isDay ? styles.sectionCardDay : styles.sectionCardNight,
                ]}
              >
                <View style={styles.cardHeaderRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isDay
                          ? 'rgba(16,185,129,0.1)'
                          : 'rgba(52,211,153,0.15)',
                      },
                    ]}
                  >
                    <Ionicons
                      name="lock-closed"
                      size={18}
                      color={isDay ? '#059669' : '#34d399'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.cardTitle,
                      isDay ? styles.cardTitleDay : styles.cardTitleNight,
                    ]}
                  >
                    3. IT Act 2000 &amp; Digital Data Protection (DPDPA 2023)
                  </Text>
                </View>
                <Text
                  style={[
                    styles.bodyText,
                    isDay ? styles.bodyTextDay : styles.bodyTextNight,
                  ]}
                >
                  FarmsKing complies with the Information Technology Act, 2000, and the Digital Personal Data Protection Act (DPDPA), 2023. User data is protected by enterprise 256-bit encryption on secure, CERT-In aligned infrastructure.
                </Text>
                <View style={styles.quickLinksRow}>
                  <TouchableOpacity
                    style={[
                      styles.quickLinkBtn,
                      isDay ? styles.quickLinkBtnDay : styles.quickLinkBtnNight,
                    ]}
                    onPress={() => router.push('/privacy-policy')}
                  >
                    <Text
                      style={[
                        styles.quickLinkText,
                        isDay ? styles.quickLinkTextDay : styles.quickLinkTextNight,
                      ]}
                    >
                      Privacy Policy (DPDPA 2023) →
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.quickLinkBtn,
                      isDay ? styles.quickLinkBtnDay : styles.quickLinkBtnNight,
                    ]}
                    onPress={() => router.push('/terms' as any)}
                  >
                    <Text
                      style={[
                        styles.quickLinkText,
                        isDay ? styles.quickLinkTextDay : styles.quickLinkTextNight,
                      ]}
                    >
                      Terms of Service →
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.quickLinkBtn,
                      isDay ? styles.quickLinkBtnDay : styles.quickLinkBtnNight,
                    ]}
                    onPress={() => router.push('/refund-policy' as any)}
                  >
                    <Text
                      style={[
                        styles.quickLinkText,
                        isDay ? styles.quickLinkTextDay : styles.quickLinkTextNight,
                      ]}
                    >
                      Refund Policy →
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 4: GRIEVANCE REDRESSAL DESK                                    */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'grievance' && (
            <View
              style={[
                styles.sectionCard,
                isDay ? styles.sectionCardDay : styles.sectionCardNight,
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isDay
                        ? 'rgba(99,102,241,0.1)'
                        : 'rgba(129,140,248,0.15)',
                    },
                  ]}
                >
                  <Ionicons
                    name="person-circle"
                    size={18}
                    color={isDay ? '#4f46e5' : '#818cf8'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.cardTitle,
                      isDay ? styles.cardTitleDay : styles.cardTitleNight,
                    ]}
                  >
                    Statutory Grievance Redressal Desk
                  </Text>
                  <Text
                    style={[
                      styles.cardSubtitle,
                      isDay ? styles.cardSubtitleDay : styles.cardSubtitleNight,
                    ]}
                  >
                    Pursuant to IT Rules 2021 &amp; Consumer Protection (E-Commerce) Rules 2020
                  </Text>
                </View>
              </View>

              <Text
                style={[
                  styles.bodyText,
                  isDay ? styles.bodyTextDay : styles.bodyTextNight,
                ]}
              >
                In compliance with the Information Technology (Intermediary Guidelines) Rules, 2021 and Consumer Protection (E-Commerce) Rules, 2020, users and farmers may reach the designated Nodal Grievance Desk for prompt assistance:
              </Text>

              <View
                style={[
                  styles.officerBox,
                  isDay ? styles.officerBoxDay : styles.officerBoxNight,
                ]}
              >
                <Text
                  style={[
                    styles.officerName,
                    isDay ? styles.officerNameDay : styles.officerNameNight,
                  ]}
                >
                  Nodal Grievance &amp; Compliance Desk
                </Text>
                <Text
                  style={[
                    styles.officerRole,
                    isDay ? styles.officerRoleDay : styles.officerRoleNight,
                  ]}
                >
                  FARMSKING TECHNOLOGIES PRIVATE LIMITED • Regulatory Affairs
                </Text>

                <View style={styles.officerDetailRow}>
                  <Ionicons
                    name="mail-outline"
                    size={15}
                    color={isDay ? '#059669' : '#34d399'}
                  />
                  <Text
                    style={[
                      styles.officerDetailText,
                      isDay ? styles.officerDetailTextDay : styles.officerDetailTextNight,
                    ]}
                  >
                    grievance@farmsking.in / farmskingindia@gmail.com
                  </Text>
                </View>

                <View style={styles.officerDetailRow}>
                  <Ionicons
                    name="call-outline"
                    size={15}
                    color={isDay ? '#059669' : '#34d399'}
                  />
                  <Text
                    style={[
                      styles.officerDetailText,
                      isDay ? styles.officerDetailTextDay : styles.officerDetailTextNight,
                    ]}
                  >
                    +91 95776-22000 (Farmer Helpline • 10:00 AM – 5:00 PM IST)
                  </Text>
                </View>

                <View style={styles.officerDetailRow}>
                  <Ionicons
                    name="time-outline"
                    size={15}
                    color={isDay ? '#059669' : '#34d399'}
                  />
                  <Text
                    style={[
                      styles.officerDetailText,
                      isDay ? styles.officerDetailTextDay : styles.officerDetailTextNight,
                    ]}
                  >
                    Response SLA: Acknowledged within 48 hours • Resolved within statutory timelines
                  </Text>
                </View>

                <View style={styles.officerDetailRow}>
                  <Ionicons
                    name="location-outline"
                    size={15}
                    color={isDay ? '#059669' : '#34d399'}
                  />
                  <Text
                    style={[
                      styles.officerDetailText,
                      isDay ? styles.officerDetailTextDay : styles.officerDetailTextNight,
                    ]}
                  >
                    Regd: VPO Goindwal Sahib, Tarn Taran, Punjab - 143422
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Bottom Back Button */}
          <View style={styles.bottomCtaRow}>
            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => router.push('/')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  isDay ? ['#059669', '#047857'] : ['#10b981', '#059669']
                }
                style={styles.homeBtnInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="home" size={17} color="#ffffff" />
                <Text style={styles.homeBtnText}>
                  Return to FarmsKing Homepage
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  rootDay: {
    backgroundColor: '#f8fafc',
  },
  rootNight: {
    backgroundColor: '#040a17',
  },
  scrollContent: {
    paddingTop: 84,
    paddingBottom: 60,
  },
  scrollContentMobile: {
    paddingTop: 68,
    paddingBottom: 80,
  },
  container: {
    width: '92%',
    maxWidth: 960,
    alignSelf: 'center',
    gap: 18,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  backText: {
    fontSize: 13,
    fontFamily: FONT.bold,
  },
  backTextDay: {
    color: '#059669',
  },
  backTextNight: {
    color: '#34d399',
  },

  // Hero Card
  heroCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    gap: 10,
  },
  heroCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.06)', 'md'),
  },
  heroCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    ...premiumShadow('rgba(0,0,0,0.4)', 'md'),
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  govBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.pill,
  },
  govBadgeDay: {
    backgroundColor: 'rgba(5,150,105,0.1)',
  },
  govBadgeNight: {
    backgroundColor: 'rgba(0,255,135,0.12)',
  },
  govBadgeText: {
    fontSize: 10.5,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.6,
  },
  govBadgeTextDay: {
    color: '#059669',
  },
  govBadgeTextNight: {
    color: '#34d399',
  },
  statuteBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: RADIUS.pill,
  },
  statuteBadgeDay: {
    backgroundColor: '#f1f5f9',
  },
  statuteBadgeNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statuteBadgeText: {
    fontSize: 9.5,
    fontFamily: FONT.bold,
  },
  statuteBadgeTextDay: {
    color: '#64748b',
  },
  statuteBadgeTextNight: {
    color: '#94a3b8',
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: FONT.extraBold,
    lineHeight: 30,
  },
  heroTitleDay: {
    color: '#0f172a',
  },
  heroTitleNight: {
    color: '#ffffff',
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FONT.medium,
    lineHeight: 19,
  },
  heroSubtitleDay: {
    color: '#475569',
  },
  heroSubtitleNight: {
    color: '#94a3b8',
  },
  cinNotice: {
    fontSize: 11.5,
    fontFamily: FONT.semiBold,
  },
  cinNoticeDay: {
    color: '#059669',
  },
  cinNoticeNight: {
    color: '#6ee7b7',
  },

  // Interactive Tab Bar
  tabBar: {
    position: 'relative',
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  tabBarDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  tabBarNight: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  slidingCompliancePill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    width: '24.2%',
    borderRadius: 10,
    zIndex: 0,
  },
  slidingCompliancePillDay: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.06)', 'sm'),
  },
  slidingCompliancePillNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    ...premiumShadow('rgba(0,0,0,0.3)', 'sm'),
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    position: 'relative',
    zIndex: 1,
  },
  tabItemActiveDay: {
    backgroundColor: '#ffffff',
    ...premiumShadow('rgba(0,0,0,0.06)', 'sm'),
  },
  tabItemActiveNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('rgba(0,0,0,0.2)', 'sm'),
  },
  tabText: {
    fontSize: 12,
    fontFamily: FONT.semiBold,
  },
  tabTextDay: {
    color: '#64748b',
  },
  tabTextNight: {
    color: '#94a3b8',
  },
  tabTextActiveDay: {
    color: '#059669',
    fontFamily: FONT.bold,
  },
  tabTextActiveNight: {
    color: '#34d399',
    fontFamily: FONT.bold,
  },

  // Section Cards
  sectionCard: {
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    gap: 14,
  },
  sectionCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    ...premiumShadow('rgba(0,0,0,0.04)', 'sm'),
  },
  sectionCardNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
    ...premiumShadow('rgba(0,0,0,0.3)', 'sm'),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
  },
  cardTitleDay: {
    color: '#0f172a',
  },
  cardTitleNight: {
    color: '#f8fafc',
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: FONT.regular,
    marginTop: 2,
  },
  cardSubtitleDay: {
    color: '#64748b',
  },
  cardSubtitleNight: {
    color: '#94a3b8',
  },
  bodyText: {
    fontSize: 13.5,
    fontFamily: FONT.regular,
    lineHeight: 21,
  },
  bodyTextDay: {
    color: '#334155',
  },
  bodyTextNight: {
    color: '#cbd5e1',
  },

  // Profile Grid
  profileGrid: {
    gap: 10,
  },
  profileItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  profileItemDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  profileItemNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  profileLabel: {
    fontSize: 11,
    fontFamily: FONT.bold,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  profileLabelDay: {
    color: '#64748b',
  },
  profileLabelNight: {
    color: '#94a3b8',
  },
  profileValue: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  profileValueDay: {
    color: '#0f172a',
  },
  profileValueNight: {
    color: '#f8fafc',
  },
  profileValueHighlight: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    letterSpacing: 0.8,
  },
  profileValueHighlightDay: {
    color: '#059669',
  },
  profileValueHighlightNight: {
    color: '#34d399',
  },

  // Address Box
  addressBox: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    gap: 10,
    marginTop: 4,
  },
  addressBoxDay: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  addressBoxNight: {
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
    borderColor: 'rgba(52, 211, 153, 0.2)',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  addressTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  addressTitleDay: {
    color: '#166534',
  },
  addressTitleNight: {
    color: '#6ee7b7',
  },
  addressText: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    marginTop: 2,
    lineHeight: 18,
  },
  addressTextDay: {
    color: '#1e293b',
  },
  addressTextNight: {
    color: '#cbd5e1',
  },
  addressDivider: {
    height: 1,
  },
  addressDividerDay: {
    backgroundColor: '#dcfce7',
  },
  addressDividerNight: {
    backgroundColor: 'rgba(52, 211, 153, 0.15)',
  },

  // Capabilities List
  capabilitiesList: {
    gap: 10,
  },
  capabilityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  capabilityCardDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  capabilityCardNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  capIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  capTitle: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  capTitleDay: {
    color: '#0f172a',
  },
  capTitleNight: {
    color: '#f8fafc',
  },
  capDesc: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
    lineHeight: 18,
    marginTop: 3,
  },
  capDescDay: {
    color: '#475569',
  },
  capDescNight: {
    color: '#94a3b8',
  },

  // Table styles
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  tableRowAltDay: {
    backgroundColor: '#f8fafc',
  },
  tableRowAltNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  tableKey: {
    width: '42%',
    fontSize: 12.5,
    fontFamily: FONT.bold,
  },
  tableKeyDay: {
    color: '#334155',
  },
  tableKeyNight: {
    color: '#cbd5e1',
  },
  tableVal: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FONT.regular,
  },
  tableValDay: {
    color: '#0f172a',
  },
  tableValNight: {
    color: '#f8fafc',
  },

  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 14,
    marginTop: -2,
  },
  bulletDotDay: {
    color: '#059669',
  },
  bulletDotNight: {
    color: '#34d399',
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.regular,
    lineHeight: 19,
  },
  bulletTextDay: {
    color: '#334155',
  },
  bulletTextNight: {
    color: '#cbd5e1',
  },

  // Officer Box
  officerBox: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  officerBoxDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  officerBoxNight: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  officerName: {
    fontSize: 15,
    fontFamily: FONT.extraBold,
  },
  officerNameDay: {
    color: '#0f172a',
  },
  officerNameNight: {
    color: '#ffffff',
  },
  officerRole: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginTop: -4,
    marginBottom: 4,
  },
  officerRoleDay: {
    color: '#059669',
  },
  officerRoleNight: {
    color: '#34d399',
  },
  officerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  officerDetailText: {
    fontSize: 12.5,
    fontFamily: FONT.regular,
  },
  officerDetailTextDay: {
    color: '#475569',
  },
  officerDetailTextNight: {
    color: '#94a3b8',
  },

  // Quick links
  quickLinksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 6,
  },
  quickLinkBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  quickLinkBtnDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  quickLinkBtnNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  quickLinkText: {
    fontSize: 12,
    fontFamily: FONT.bold,
  },
  quickLinkTextDay: {
    color: '#059669',
  },
  quickLinkTextNight: {
    color: '#34d399',
  },

  // Bottom CTA
  bottomCtaRow: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  homeBtn: {
    borderRadius: RADIUS.pill,
    overflow: 'hidden',
  },
  homeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  homeBtnText: {
    fontSize: 14,
    fontFamily: FONT.bold,
    color: '#ffffff',
  },
});
