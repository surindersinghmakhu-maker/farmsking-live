import React, { useEffect, useState } from 'react';
import {
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

type ComplianceTab = 'moa' | 'roc' | 'regulatory' | 'grievance';

export default function ComplianceScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isMobile = width <= 768;

  const [activeTab, setActiveTab] = useState<ComplianceTab>('moa');
  const [themeMode, setThemeMode] = useState<'day' | 'night'>('day');

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
      <Stack.Screen options={{ headerShown: false, title: 'MCA & Statutory Disclosures • FarmsKing' }} />

      {/* Unified Public Floating Header */}
      <PublicHeader themeMode={themeMode} onThemeToggle={toggleTheme} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, isMobile && styles.scrollContentMobile]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.container}>
          {/* Top Breadcrumb / Back Link */}
          <TouchableOpacity
            style={styles.backRow}
            onPress={() => router.back()}
            activeOpacity={0.75}
          >
            <Ionicons name="arrow-back" size={16} color={isDay ? '#059669' : '#34d399'} />
            <Text style={[styles.backText, isDay ? styles.backTextDay : styles.backTextNight]}>
              Back to FarmsKing
            </Text>
          </TouchableOpacity>

          {/* Hero Banner */}
          <View style={[styles.heroCard, isDay ? styles.heroCardDay : styles.heroCardNight]}>
            <View style={styles.heroBadgeRow}>
              <View style={[styles.govBadge, isDay ? styles.govBadgeDay : styles.govBadgeNight]}>
                <Ionicons name="shield-checkmark" size={14} color={isDay ? '#059669' : '#00ff87'} />
                <Text style={[styles.govBadgeText, isDay ? styles.govBadgeTextDay : styles.govBadgeTextNight]}>
                  MCA & REGULATORY STATUTORY DISCLOSURES
                </Text>
              </View>
              <View style={[styles.statuteBadge, isDay ? styles.statuteBadgeDay : styles.statuteBadgeNight]}>
                <Text style={[styles.statuteBadgeText, isDay ? styles.statuteBadgeTextDay : styles.statuteBadgeTextNight]}>
                  SPICe+ MoA INC-33 • COMPANIES ACT 2013
                </Text>
              </View>
            </View>

            <Text style={[styles.heroTitle, isDay ? styles.heroTitleDay : styles.heroTitleNight]}>
              Corporate Statutory Compliance & Regulatory Disclosures
            </Text>
            <Text style={[styles.heroSubtitle, isDay ? styles.heroSubtitleDay : styles.heroSubtitleNight]}>
              FarmsKing India Private Limited • Registered Jurisdiction: Punjab, India • Official Web Touchpoints: farmsking.in & www.farmsking.in
            </Text>
            <Text style={[styles.cinNotice, isDay ? styles.cinNoticeDay : styles.cinNoticeNight]}>
              Incorporated under Ministry of Corporate Affairs (Govt. of India) • ROC Chandigarh
            </Text>

            {/* Interactive Tab Selector */}
            <View style={[styles.tabBar, isDay ? styles.tabBarDay : styles.tabBarNight]}>
              {[
                { id: 'moa', label: 'SPICe+ MoA INC-33', icon: 'document-text-outline' },
                { id: 'roc', label: 'ROC Master Data', icon: 'business-outline' },
                { id: 'regulatory', label: 'Statutory Regulations', icon: 'shield-outline' },
                { id: 'grievance', label: 'Legal & Grievance Desk', icon: 'person-outline' },
              ].map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.tabItem,
                    activeTab === t.id && (isDay ? styles.tabItemActiveDay : styles.tabItemActiveNight),
                  ]}
                  onPress={() => setActiveTab(t.id as ComplianceTab)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={14}
                    color={activeTab === t.id ? (isDay ? '#059669' : '#34d399') : (isDay ? '#64748b' : '#94a3b8')}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      isDay ? styles.tabTextDay : styles.tabTextNight,
                      activeTab === t.id && (isDay ? styles.tabTextActiveDay : styles.tabTextActiveNight),
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 1: OFFICIAL SPICe+ MoA (FORM NO. INC-33)                      */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'moa' && (
            <>
              {/* MoA Header Box */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                    <Ionicons name="ribbon-outline" size={18} color={isDay ? '#059669' : '#34d399'} />
                  </View>
                  <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                    Form No. INC-33 • SPICe+ e-MoA (Memorandum of Association)
                  </Text>
                </View>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  Pursuant to Section 4 and Section 13(1) of the Companies Act, 2013, read with Rule 13 of the Companies (Incorporation) Rules, 2014.
                </Text>
                <View style={[styles.highlightBox, isDay ? styles.highlightBoxDay : styles.highlightBoxNight]}>
                  <Text style={[styles.highlightTitle, isDay ? styles.highlightTitleDay : styles.highlightTitleNight]}>
                    Table A • Regulations for Management of a Company Limited by Shares
                  </Text>
                  <Text style={[styles.highlightDesc, isDay ? styles.highlightDescDay : styles.highlightDescNight]}>
                    MEMORANDUM OF ASSOCIATION OF FARMSKING INDIA PRIVATE LIMITED
                  </Text>
                </View>
              </View>

              {/* Clause I & II */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <Text style={[styles.clauseHeading, isDay ? styles.clauseHeadingDay : styles.clauseHeadingNight]}>
                  Clause I — Corporate Name
                </Text>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  The name of the company is <Text style={{ fontFamily: FONT.extraBold, color: isDay ? '#059669' : '#34d399' }}>FARMSKING INDIA PRIVATE LIMITED</Text>.
                </Text>

                <View style={[styles.divider, isDay ? styles.dividerDay : styles.dividerNight]} />

                <Text style={[styles.clauseHeading, isDay ? styles.clauseHeadingDay : styles.clauseHeadingNight]}>
                  Clause II — Registered Office Jurisdiction
                </Text>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  The registered office of the company will be situated in the <Text style={{ fontFamily: FONT.bold }}>State of Punjab</Text> (under the jurisdiction of the Registrar of Companies, ROC Chandigarh, Punjab & Himachal Pradesh).
                </Text>
              </View>

              {/* Clause III(A): Main Objects */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(2,132,199,0.1)' : 'rgba(56,189,248,0.15)' }]}>
                    <Ionicons name="apps-outline" size={18} color={isDay ? '#0284c7' : '#38bdf8'} />
                  </View>
                  <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                    Clause III(A) — Main Objects to be Pursued on Incorporation
                  </Text>
                </View>

                <View style={styles.objectItem}>
                  <Text style={[styles.objectNum, isDay ? styles.objectNumDay : styles.objectNumNight]}>1.</Text>
                  <Text style={[styles.objectText, isDay ? styles.objectTextDay : styles.objectTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Integrated Agri-Tech Digital Platform & Marketplace: </Text>
                    To establish, operate, maintain, and develop an integrated digital agriculture platform, mobile applications, e-commerce infrastructure, and enterprise SaaS solutions connecting cultivators, farmers, agricultural input producers, certified agronomists, crop advisors, and retail/wholesale consumers across All India.
                  </Text>
                </View>

                <View style={styles.objectItem}>
                  <Text style={[styles.objectNum, isDay ? styles.objectNumDay : styles.objectNumNight]}>2.</Text>
                  <Text style={[styles.objectText, isDay ? styles.objectTextDay : styles.objectTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>AI Crop Doctors & Plant Pathology Diagnostic Systems: </Text>
                    To develop, deploy, and patent proprietary Artificial Intelligence (AI) plant health diagnostic engines, real-time leaf disease computer vision scanning, tank-mix dosage calculation engines, reverse sowing scheduling algorithms, and digital agronomic advisory desks benchmarked against ICAR and State Agricultural University standards.
                  </Text>
                </View>

                <View style={styles.objectItem}>
                  <Text style={[styles.objectNum, isDay ? styles.objectNumDay : styles.objectNumNight]}>3.</Text>
                  <Text style={[styles.objectText, isDay ? styles.objectTextDay : styles.objectTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>APMC Mandi Intelligence & Direct Farmer Listings: </Text>
                    To aggregate, analyze, publish, and disseminate real-time APMC mandi arrival intelligence, daily crop pricing trends, and transparent direct-from-farm commodity listings, enabling cultivators from Punjab and all Indian states to list and sell artisanal, organic, handmade, and natural farm produce without commission exploitation.
                  </Text>
                </View>

                <View style={styles.objectItem}>
                  <Text style={[styles.objectNum, isDay ? styles.objectNumDay : styles.objectNumNight]}>4.</Text>
                  <Text style={[styles.objectText, isDay ? styles.objectTextDay : styles.objectTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Certified Agri Inputs, Seeds & Nutrients Supply Chain: </Text>
                    To carry on the retail, wholesale, distribution, marketing, and warehousing of genuine agricultural inputs including certified hybrid seeds, bio-fertilizers, organic manure, crop nutrients, plant doctor kits, gardening gear, and farming implements in full compliance with the Seeds Act 1966, Fertilizer Control Order 1985, and Insecticides Act 1968.
                  </Text>
                </View>
              </View>

              {/* Clause III(B): Ancillary Objects */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)' }]}>
                    <Ionicons name="construct-outline" size={18} color={isDay ? '#d97706' : '#fbbf24'} />
                  </View>
                  <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                    Clause III(B) — Ancillary Objects for Furtherance of Main Objects
                  </Text>
                </View>

                <View style={styles.objectItem}>
                  <Text style={[styles.objectNum, isDay ? styles.objectNumDay : styles.objectNumNight]}>1.</Text>
                  <Text style={[styles.objectText, isDay ? styles.objectTextDay : styles.objectTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Cloud Infrastructure & Secure Escrow: </Text>
                    To develop, acquire, license, and maintain cloud server networks, secure digital payment integrations, automated UPI wallets, and digital escrow accounts compliant with the Information Technology Act 2000 and DPDPA 2023.
                  </Text>
                </View>

                <View style={styles.objectItem}>
                  <Text style={[styles.objectNum, isDay ? styles.objectNumDay : styles.objectNumNight]}>2.</Text>
                  <Text style={[styles.objectText, isDay ? styles.objectTextDay : styles.objectTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Agronomic R&D & Demonstration Hubs: </Text>
                    To establish and operate agricultural research hubs, demonstration fields (such as Surinder Agro Farm Makhu), soil and water testing laboratories, and crop pathology clinics to formulate sustainable bio-solutions.
                  </Text>
                </View>

                <View style={styles.objectItem}>
                  <Text style={[styles.objectNum, isDay ? styles.objectNumDay : styles.objectNumNight]}>3.</Text>
                  <Text style={[styles.objectText, isDay ? styles.objectTextDay : styles.objectTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Farmer Literacy & Training Academies: </Text>
                    To organize farmer training bootcamps, digital literacy workshops, Kisan Mitra advisor certification courses, and youth agricultural skill training programs.
                  </Text>
                </View>

                <View style={styles.objectItem}>
                  <Text style={[styles.objectNum, isDay ? styles.objectNumDay : styles.objectNumNight]}>4.</Text>
                  <Text style={[styles.objectText, isDay ? styles.objectTextDay : styles.objectTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Agri Logistics & Rural Cold Chain: </Text>
                    To construct, lease, or operate logistics corridors, temperature-controlled transit, and last-mile pickup points across rural and semi-urban hubs.
                  </Text>
                </View>
              </View>

              {/* Clause IV, V & Subscribers */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <Text style={[styles.clauseHeading, isDay ? styles.clauseHeadingDay : styles.clauseHeadingNight]}>
                  Clause IV — Liability of Members
                </Text>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  The liability of the members is limited, and this liability is limited to the amount unpaid, if any, on the shares held by them.
                </Text>

                <View style={[styles.divider, isDay ? styles.dividerDay : styles.dividerNight]} />

                <Text style={[styles.clauseHeading, isDay ? styles.clauseHeadingDay : styles.clauseHeadingNight]}>
                  Clause V — Share Capital Clause
                </Text>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  The share capital of the company is <Text style={{ fontFamily: FONT.bold }}>₹10,00,000/- (Rupees Ten Lakhs Only)</Text> divided into <Text style={{ fontFamily: FONT.bold }}>1,00,000 (One Lakh)</Text> Equity Shares of <Text style={{ fontFamily: FONT.bold }}>₹10/- (Rupees Ten)</Text> each.
                </Text>

                <View style={[styles.divider, isDay ? styles.dividerDay : styles.dividerNight]} />

                <Text style={[styles.clauseHeading, isDay ? styles.clauseHeadingDay : styles.clauseHeadingNight]}>
                  Founding Subscribers & Management
                </Text>
                <View style={styles.subscriberList}>
                  <View style={[styles.subCard, isDay ? styles.subCardDay : styles.subCardNight]}>
                    <Text style={[styles.subName, isDay ? styles.subNameDay : styles.subNameNight]}>Surinder Singh</Text>
                    <Text style={[styles.subRole, isDay ? styles.subRoleDay : styles.subRoleNight]}>Founder & Managing Director • Makhu, Punjab</Text>
                  </View>
                  <View style={[styles.subCard, isDay ? styles.subCardDay : styles.subCardNight]}>
                    <Text style={[styles.subName, isDay ? styles.subNameDay : styles.subNameNight]}>Core Founding Team</Text>
                    <Text style={[styles.subRole, isDay ? styles.subRoleDay : styles.subRoleNight]}>Gurjant Singh • Charanjit Singh • Lovepreet Singh • Sudhir Kumar Mahato • Gurnam Singh</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 2: ROC MASTER DATA                                             */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'roc' && (
            <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(5,150,105,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                  <Ionicons name="file-tray-full" size={18} color={isDay ? '#059669' : '#34d399'} />
                </View>
                <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                  MCA Company Master Data Record
                </Text>
              </View>

              <View style={styles.tableContainer}>
                {[
                  { k: 'Corporate Identification Number (CIN)', v: 'U62013PB2026PTC060000' },
                  { k: 'Company Name', v: 'FARMSKING INDIA PRIVATE LIMITED' },
                  { k: 'ROC Office', v: 'RoC - Chandigarh (Punjab)' },
                  { k: 'Company Category', v: 'Company limited by Shares' },
                  { k: 'Company Sub Category', v: 'Non-government company' },
                  { k: 'Class of Company', v: 'Private' },
                  { k: 'Authorized Capital', v: '₹10,00,000 INR' },
                  { k: 'Paid up Capital', v: '₹1,00,000 INR' },
                  { k: 'National Industry Classification (NIC)', v: '62013, 01611, 47912' },
                  { k: 'Principal Activities', v: 'Agri-Tech Platforms, E-Commerce, Crop Advisory & AI Pathology' },
                  { k: 'Registered Office Address', v: 'Makhu, District Ferozepur, Punjab, India - 142044' },
                  { k: 'Official Email ID', v: 'farmskingindia@gmail.com' },
                  { k: 'Company Status', v: 'Active (Incorporated under Companies Act 2013)' },
                ].map((row, idx) => (
                  <View
                    key={row.k}
                    style={[
                      styles.tableRow,
                      idx % 2 === 1 && (isDay ? styles.tableRowAltDay : styles.tableRowAltNight),
                    ]}
                  >
                    <Text style={[styles.tableKey, isDay ? styles.tableKeyDay : styles.tableKeyNight]}>
                      {row.k}
                    </Text>
                    <Text style={[styles.tableVal, isDay ? styles.tableValDay : styles.tableValNight]}>
                      {row.v}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ══════════════════════════════════════════════════════════════════ */}
          {/* TAB 3: STATUTORY & REGULATORY DISCLOSURES                          */}
          {/* ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'regulatory' && (
            <>
              {/* APMC Disclosures */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(2,132,199,0.1)' : 'rgba(56,189,248,0.15)' }]}>
                    <Ionicons name="trending-up" size={18} color={isDay ? '#0284c7' : '#38bdf8'} />
                  </View>
                  <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                    1. Mandi Price Intelligence & APMC Disclosures
                  </Text>
                </View>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  Daily agricultural commodity rates, historical arrival graphs, and price discovery projections displayed across the FarmsKing ecosystem are compiled from verified platform transactions, licensed APMC arrivals, and agricultural market intelligence feeds for informational, analytical, and crop-cycle planning purposes.
                </Text>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  Physical trading, mandi floor auctions, and official financial settlements are strictly governed by respective State Agricultural Produce Market Committee (APMC) Acts and regulated mandi board rules. FarmsKing functions as an information aggregator and digital enabler, not as an auctioneer or commodity exchange.
                </Text>
              </View>

              {/* Agronomic Science Disclosures */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(217,119,6,0.1)' : 'rgba(251,191,36,0.15)' }]}>
                    <Ionicons name="medkit" size={18} color={isDay ? '#d97706' : '#fbbf24'} />
                  </View>
                  <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                    2. Agronomic Science & AI Diagnostic Disclosures
                  </Text>
                </View>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  AI plant pathology diagnostics, tank mix dosage calculators, and certified agronomist consultations provide scientific recommendations benchmarked against Indian Council of Agricultural Research (ICAR) guidelines and State Agricultural University (PAU, HAU, IARI) package of practices.
                </Text>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  Actual field outcomes vary significantly with soil chemistry, water salinity, local weather conditions, and micro-climates. Cultivators are advised to verify manufacturer product labels, conduct spot tests, and adhere to statutory pre-harvest intervals (PHI) and safety waiting periods before application.
                </Text>
              </View>

              {/* Quality Assurance */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(16,185,129,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                    <Ionicons name="checkmark-done-circle" size={18} color={isDay ? '#059669' : '#34d399'} />
                  </View>
                  <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                    3. Certified Agricultural Input Quality Assurance
                  </Text>
                </View>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  All hybrid seeds, bio-fertilizers, water-soluble NPK nutrients, micronutrients, and crop protection formulations listed on the FarmsKing Agri Store strictly comply with:
                </Text>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                  <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>The Seeds Act, 1966 & Seeds Rules, 1968: </Text>
                    All seed batches are verified for germination percentage, purity, and certified seed certification tags.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                  <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>Fertilizer (Inorganic, Organic or Mixed) (Control) Order, 1985 (FCO): </Text>
                    Only laboratory-tested, nutrient-certified fertilizers with verified batch numbers are distributed.
                  </Text>
                </View>
                <View style={styles.bulletRow}>
                  <Text style={[styles.bulletDot, isDay ? styles.bulletDotDay : styles.bulletDotNight]}>•</Text>
                  <Text style={[styles.bulletText, isDay ? styles.bulletTextDay : styles.bulletTextNight]}>
                    <Text style={{ fontFamily: FONT.bold }}>The Insecticides Act, 1968 & Central Insecticides Board (CIB&RC): </Text>
                    Strictly sourced from licensed manufacturers with valid CIB registration numbers.
                  </Text>
                </View>
              </View>

              {/* Data Protection */}
              <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(16,185,129,0.1)' : 'rgba(52,211,153,0.15)' }]}>
                    <Ionicons name="lock-closed" size={18} color={isDay ? '#059669' : '#34d399'} />
                  </View>
                  <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                    4. IT Act 2000 & Data Protection Compliance
                  </Text>
                </View>
                <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                  FarmsKing strictly complies with the Information Technology Act, 2000, and the Digital Personal Data Protection Act (DPDPA), 2023. User data, farm geographic boundaries, and trade financial logs are encrypted with AES-256 bit algorithms and housed within verified, CERT-In compliant Indian data centers.
                </Text>
                <View style={styles.quickLinksRow}>
                  <TouchableOpacity
                    style={[styles.quickLinkBtn, isDay ? styles.quickLinkBtnDay : styles.quickLinkBtnNight]}
                    onPress={() => router.push('/privacy-policy')}
                  >
                    <Text style={[styles.quickLinkText, isDay ? styles.quickLinkTextDay : styles.quickLinkTextNight]}>
                      Privacy Policy (DPDPA 2023) →
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickLinkBtn, isDay ? styles.quickLinkBtnDay : styles.quickLinkBtnNight]}
                    onPress={() => router.push('/terms' as any)}
                  >
                    <Text style={[styles.quickLinkText, isDay ? styles.quickLinkTextDay : styles.quickLinkTextNight]}>
                      Terms of Service →
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickLinkBtn, isDay ? styles.quickLinkBtnDay : styles.quickLinkBtnNight]}
                    onPress={() => router.push('/refund-policy' as any)}
                  >
                    <Text style={[styles.quickLinkText, isDay ? styles.quickLinkTextDay : styles.quickLinkTextNight]}>
                      Refund & Return Policy →
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
            <View style={[styles.sectionCard, isDay ? styles.sectionCardDay : styles.sectionCardNight]}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.iconCircle, { backgroundColor: isDay ? 'rgba(99,102,241,0.1)' : 'rgba(129,140,248,0.15)' }]}>
                  <Ionicons name="person-circle" size={18} color={isDay ? '#4f46e5' : '#818cf8'} />
                </View>
                <Text style={[styles.cardTitle, isDay ? styles.cardTitleDay : styles.cardTitleNight]}>
                  Statutory Grievance Redressal Desk
                </Text>
              </View>
              <Text style={[styles.bodyText, isDay ? styles.bodyTextDay : styles.bodyTextNight]}>
                In accordance with the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and Consumer Protection (E-Commerce) Rules, 2020, the contact details of the designated Statutory Grievance Officer are provided below:
              </Text>
              <View style={[styles.officerBox, isDay ? styles.officerBoxDay : styles.officerBoxNight]}>
                <Text style={[styles.officerName, isDay ? styles.officerNameDay : styles.officerNameNight]}>
                  Surinder Singh
                </Text>
                <Text style={[styles.officerRole, isDay ? styles.officerRoleDay : styles.officerRoleNight]}>
                  Head of Legal, Regulatory & Agronomy Compliance Desk
                </Text>
                <View style={styles.officerDetailRow}>
                  <Ionicons name="mail-outline" size={15} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[styles.officerDetailText, isDay ? styles.officerDetailTextDay : styles.officerDetailTextNight]}>
                    farmskingindia@gmail.com / grievance@farmsking.in
                  </Text>
                </View>
                <View style={styles.officerDetailRow}>
                  <Ionicons name="call-outline" size={15} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[styles.officerDetailText, isDay ? styles.officerDetailTextDay : styles.officerDetailTextNight]}>
                    95776-22000 (Farmer Helpline • 6:00 AM – 10:00 PM IST)
                  </Text>
                </View>
                <View style={styles.officerDetailRow}>
                  <Ionicons name="location-outline" size={15} color={isDay ? '#059669' : '#34d399'} />
                  <Text style={[styles.officerDetailText, isDay ? styles.officerDetailTextDay : styles.officerDetailTextNight]}>
                    Makhu, District Ferozepur & Ludhiana / Chandigarh, Punjab, India - 142044
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
                colors={isDay ? ['#059669', '#047857'] : ['#10b981', '#059669']}
                style={styles.homeBtnInner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="home" size={17} color="#ffffff" />
                <Text style={styles.homeBtnText}>Return to FarmsKing Homepage</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
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
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  tabItemActiveDay: {
    backgroundColor: '#ffffff',
    ...premiumShadow('rgba(0,0,0,0.06)', 'xs'),
  },
  tabItemActiveNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    ...premiumShadow('rgba(0,0,0,0.2)', 'xs'),
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
    gap: 12,
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
    gap: 10,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FONT.bold,
    flex: 1,
  },
  cardTitleDay: {
    color: '#0f172a',
  },
  cardTitleNight: {
    color: '#f8fafc',
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
  highlightBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  highlightBoxDay: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  highlightBoxNight: {
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  highlightTitle: {
    fontSize: 12,
    fontFamily: FONT.bold,
    letterSpacing: 0.4,
  },
  highlightTitleDay: {
    color: '#166534',
  },
  highlightTitleNight: {
    color: '#34d399',
  },
  highlightDesc: {
    fontSize: 14,
    fontFamily: FONT.extraBold,
    marginTop: 2,
  },
  highlightDescDay: {
    color: '#15803d',
  },
  highlightDescNight: {
    color: '#a7f3d0',
  },
  clauseHeading: {
    fontSize: 14.5,
    fontFamily: FONT.bold,
    marginTop: 4,
  },
  clauseHeadingDay: {
    color: '#0f172a',
  },
  clauseHeadingNight: {
    color: '#ffffff',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  dividerDay: {
    backgroundColor: '#e2e8f0',
  },
  dividerNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  objectItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingLeft: 4,
    marginTop: 4,
  },
  objectNum: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  objectNumDay: {
    color: '#059669',
  },
  objectNumNight: {
    color: '#34d399',
  },
  objectText: {
    flex: 1,
    fontSize: 13,
    fontFamily: FONT.regular,
    lineHeight: 20,
  },
  objectTextDay: {
    color: '#334155',
  },
  objectTextNight: {
    color: '#cbd5e1',
  },
  subscriberList: {
    gap: 8,
    marginTop: 6,
  },
  subCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  subCardDay: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  subCardNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  subName: {
    fontSize: 13.5,
    fontFamily: FONT.bold,
  },
  subNameDay: {
    color: '#0f172a',
  },
  subNameNight: {
    color: '#ffffff',
  },
  subRole: {
    fontSize: 12,
    fontFamily: FONT.medium,
    marginTop: 2,
  },
  subRoleDay: {
    color: '#059669',
  },
  subRoleNight: {
    color: '#34d399',
  },

  // Table styles
  tableContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 8,
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
    marginTop: 4,
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
