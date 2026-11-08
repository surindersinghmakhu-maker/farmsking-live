import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
  Animated as RNAnimated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BrandLogo } from '@/src/components/BrandLogo';
import { useAuth } from '@/src/store/auth-context';
import { useCart } from '@/src/store/cart-context';
import { FONT, RADIUS } from '@/constants/theme';

export interface MobileHomeViewProps {
  themeMode: 'day' | 'night';
  onToggleTheme: () => void;
  cartCount: number;
}

// ── Mobile App Quick Action Icons ──
const QUICK_APP_ACTIONS = [
  {
    id: 'ai-doctor',
    title: 'AI Doctor',
    badge: 'FREE',
    badgeColor: '#10b981',
    icon: 'scan-outline',
    bg: '#ecfdf5',
    color: '#059669',
    route: '/ai-doctor',
  },
  {
    id: 'mandi-rates',
    title: 'Live Mandi',
    badge: 'LIVE',
    badgeColor: '#f59e0b',
    icon: 'trending-up',
    bg: '#fef3c7',
    color: '#d97706',
    route: '/topic/Mandi-Rates',
  },
  {
    id: 'agristore',
    title: 'Agri Store',
    badge: '500+',
    badgeColor: '#0284c7',
    icon: 'cart-outline',
    bg: '#e0f2fe',
    color: '#0284c7',
    route: '/shop',
  },
  {
    id: 'farming',
    title: 'Farming',
    badge: null,
    badgeColor: '',
    icon: 'leaf-outline',
    bg: '#f0fdf4',
    color: '#16a34a',
    route: '/topic/Farming',
  },
  {
    id: 'gardening',
    title: 'Gardening',
    badge: null,
    badgeColor: '',
    icon: 'flower-outline',
    bg: '#fff1f2',
    color: '#e11d48',
    route: '/topic/Gardening',
  },
  {
    id: 'weather',
    title: 'Satellite',
    badge: 'NDVI',
    badgeColor: '#8b5cf6',
    icon: 'planet-outline',
    bg: '#f5f3ff',
    color: '#7c3aed',
    route: '/topic/Farming',
  },
];

// ── Four Pillars of FarmsKing ──
const FOUR_PILLARS = [
  {
    id: 'farming',
    title: 'Smart Farming',
    desc: 'Satellite NDVI & Precision Advisory',
    iconImg: require('@/assets/images/icon_farming_3d_clean.png'),
    badge: '48k+ Acres',
    color: '#10b981',
    route: '/topic/Farming',
  },
  {
    id: 'doctors',
    title: 'Crop Doctors',
    desc: 'Instant AI Leaf Diagnostic & Dosages',
    iconImg: require('@/assets/images/icon_cropdoctors_3d_clean.png'),
    badge: '0.8s Scan',
    color: '#06b6d4',
    route: '/topic/Crop-Doctors',
  },
  {
    id: 'gardening',
    title: 'Urban Gardening',
    desc: 'Terrace, Balcony & Organic Food Kits',
    iconImg: require('@/assets/images/icon_gardening_3d_clean.png'),
    badge: '100% Organic',
    color: '#e11d48',
    route: '/topic/Gardening',
  },
  {
    id: 'agristore',
    title: 'Agri Store',
    desc: 'Farmer-Made Food & Certified Inputs',
    iconImg: require('@/assets/images/icon_agristore_3d_clean.png'),
    badge: 'Doorstep',
    color: '#0284c7',
    route: '/shop',
  },
];

// ── Real Mandi Data Sample ──
const MANDI_CROPS = [
  { id: 'Wheat', name: 'Wheat', rate: '₹2,275/q', change: '+3.2%', mandi: 'Khanna, Punjab' },
  { id: 'Basmati', name: 'Basmati 1121', rate: '₹4,150/q', change: '+5.4%', mandi: 'Amritsar, Punjab' },
  { id: 'Cotton', name: 'Bt Cotton', rate: '₹7,120/q', change: '+1.8%', mandi: 'Bathinda, Punjab' },
  { id: 'Mustard', name: 'Mustard', rate: '₹5,420/q', change: '-0.8%', mandi: 'Sirsa, Haryana' },
  { id: 'Potato', name: 'Potato', rate: '₹1,240/q', change: '+2.1%', mandi: 'Jalandhar, Punjab' },
];

// ── Spotlit Products in Store ──
const SPOTLIGHT_PRODUCTS = [
  {
    id: 'prod-honey',
    name: 'Raw Organic Wildflower Honey',
    category: 'Farmer-Made Pure Food',
    price: 450,
    unit: '500g Jar',
    tag: '100% Raw',
    icon: 'cube-outline',
  },
  {
    id: 'prod-jaggery',
    name: 'Traditional Desi Organic Jaggery',
    category: 'Chemical-Free Gur',
    price: 120,
    unit: '1 Kg Kraft Pouch',
    tag: 'Natural',
    icon: 'leaf-outline',
  },
  {
    id: 'prod-gulkand',
    name: 'Artisanal Damask Rose Gulkand',
    category: 'Ayurvedic Sun-Cooked',
    price: 280,
    unit: '400g Glass Jar',
    tag: 'Pure Rose',
    icon: 'rose-outline',
  },
  {
    id: 'prod-fungicide',
    name: 'Tilt 25% EC Propiconazole',
    category: 'Crop Doctor Calibrated',
    price: 380,
    unit: '200ml Bottle',
    tag: 'Yellow Rust',
    icon: 'medkit-outline',
  },
];

// ── Farmer Reviews (Clean English, Verified) ──
const FARMER_REVIEWS = [
  {
    id: 'rev-1',
    name: 'Sardar Gurmeet Singh',
    location: 'Ludhiana, Punjab',
    quote: 'The satellite moisture maps helped us calibrate canal water cycles with precision. Our Basmati yield crossed 24 quintals per acre.',
    gain: '+24% Yield',
    avatarUrl: '',
  },
  {
    id: 'rev-2',
    name: 'Harpreet Singh Dhillon',
    location: 'Khanna, Punjab',
    quote: 'We detected Yellow Rust at the earliest pinhead stage using the Crop Doctor scanner. The exact spray dosage saved our 14-acre crop.',
    gain: 'Zero Disease',
    avatarUrl: '',
  },
  {
    id: 'rev-3',
    name: 'Baljinder Singh Brar',
    location: 'Bathinda, Punjab',
    quote: 'Instant mandi pricing allowed us to route our paddy directly to Khanna, securing ₹140 more per quintal transparently.',
    gain: '+₹140/q Best Rate',
    avatarUrl: '',
  },
];

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  themeMode,
  onToggleTheme,
  cartCount,
}) => {
  const router = useRouter();
  const { user } = useAuth();
  const { addItem } = useCart();
  const isDay = themeMode === 'day';

  // Language state: Only component displaying regional scripts is dedicated box
  const [lang, setLang] = useState<'EN' | 'PA' | 'HI'>('EN');
  const [selectedCropIndex, setSelectedCropIndex] = useState(0);
  const [activeBottomNav, setActiveBottomNav] = useState(0);
  const [addedNotice, setAddedNotice] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('farmsking_user_language');
        if (stored) {
          const u = stored.toUpperCase();
          if (u === 'EN' || u === 'PA' || u === 'HI') setLang(u as any);
        }
      }
    } catch {}
  }, []);

  const handleLangSelect = (l: 'EN' | 'PA' | 'HI') => {
    setLang(l);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem('farmsking_user_language', l.toLowerCase());
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new CustomEvent('farmsking_language_change', { detail: l }));
    }
  };

  const selectedCrop = MANDI_CROPS[selectedCropIndex];

  const handleAddToCart = (item: typeof SPOTLIGHT_PRODUCTS[0]) => {
    addItem({
      productId: item.id,
      name: item.name,
      price: item.price,
      unit: item.unit,
    });
    setAddedNotice(`Added "${item.name}" to Cart!`);
    setTimeout(() => setAddedNotice(null), 2500);
  };

  const handleOpenWhatsApp = () => {
    const text = encodeURIComponent('Hello FarmsKing Agronomy Team, I need assistance with crop advisory and mandi rates.');
    Linking.openURL(`https://wa.me/919577622000?text=${text}`);
  };

  const handleOpenCall = () => {
    Linking.openURL('tel:9577622000');
  };

  return (
    <View style={[styles.root, isDay ? styles.rootDay : styles.rootNight]}>
      {/* ══ STICKY TOP MOBILE APP BAR ══ */}
      <View style={[styles.topBar, isDay ? styles.topBarDay : styles.topBarNight]}>
        {/* Brand Logo: Compact Jewel Emblem on Mobile */}
        <TouchableOpacity
          onPress={() => router.push('/')}
          activeOpacity={0.8}
          style={styles.logoWrap}
        >
          <BrandLogo size={32} emblem={true} dark={!isDay} />
        </TouchableOpacity>

        {/* Right Header Actions */}
        <View style={styles.topBarActions}>
          {/* Dedicated Language Selector Box [ EN | PA | HI ] */}
          <View style={[styles.langBox, isDay ? styles.langBoxDay : styles.langBoxNight]}>
            <TouchableOpacity
              style={[styles.langSeg, lang === 'EN' && styles.langSegActive]}
              onPress={() => handleLangSelect('EN')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langSegText, lang === 'EN' && styles.langSegTextActive]}>EN</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langSeg, lang === 'PA' && styles.langSegActive]}
              onPress={() => handleLangSelect('PA')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langSegText, lang === 'PA' && styles.langSegTextActive]}>ਪੰਜਾਬੀ</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.langSeg, lang === 'HI' && styles.langSegActive]}
              onPress={() => handleLangSelect('HI')}
              activeOpacity={0.8}
            >
              <Text style={[styles.langSegText, lang === 'HI' && styles.langSegTextActive]}>हिंदी</Text>
            </TouchableOpacity>
          </View>

          {/* Theme Switcher Toggle */}
          <TouchableOpacity
            style={[styles.themeBtn, isDay ? styles.themeBtnDay : styles.themeBtnNight]}
            onPress={() => onToggleTheme()}
            activeOpacity={0.8}
          >
            <Ionicons name={isDay ? 'moon' : 'sunny'} size={15} color={isDay ? '#475569' : '#fef08a'} />
          </TouchableOpacity>

          {/* Cart Icon with Live Count */}
          <TouchableOpacity
            style={[styles.cartBtn, isDay ? styles.cartBtnDay : styles.cartBtnNight]}
            onPress={() => router.push('/shop')}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={17} color={isDay ? '#0f172a' : '#ffffff'} />
            {cartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* User Account / Login Button */}
          <TouchableOpacity
            style={[styles.profileBtn, isDay ? styles.profileBtnDay : styles.profileBtnNight]}
            onPress={() => {
              if (user) router.push('/profile' as any);
              else router.push('/login' as any);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="person-outline" size={15} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Cart Toast Notice */}
      {addedNotice && (
        <View style={styles.toastNotice}>
          <Ionicons name="checkmark-circle" size={16} color="#10b981" />
          <Text style={styles.toastNoticeText}>{addedNotice}</Text>
        </View>
      )}

      {/* ══ SCROLLABLE MAIN MOBILE CONTENT ══ */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Hero Banner Card ── */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['#047857', '#065f46', '#064e3b']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            <View style={styles.heroTopTagRow}>
              <View style={styles.heroTagPill}>
                <Ionicons name="sparkles" size={12} color="#fef08a" />
                <Text style={styles.heroTagText}>India's Intelligent Agriculture</Text>
              </View>
              <View style={styles.heroRatingPill}>
                <Ionicons name="star" size={11} color="#f59e0b" />
                <Text style={styles.heroRatingText}>4.9/5</Text>
              </View>
            </View>

            <Text style={styles.heroHeadline}>
              AI Crop Doctor &amp; Live Mandi Rates
            </Text>
            <Text style={styles.heroSub}>
              Detect leaf diseases in 1 second, check official APMC auctions, and order 100% certified farm inputs delivered direct.
            </Text>

            {/* Quick Action Buttons in Hero */}
            <View style={styles.heroBtnRow}>
              <TouchableOpacity
                style={styles.heroPrimaryBtn}
                onPress={() => router.push('/ai-doctor')}
                activeOpacity={0.85}
              >
                <Ionicons name="camera" size={16} color="#ffffff" />
                <Text style={styles.heroPrimaryBtnText}>Scan Leaf Free</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroSecondaryBtn}
                onPress={() => router.push('/shop')}
                activeOpacity={0.85}
              >
                <Ionicons name="bag-handle-outline" size={15} color="#a7f3d0" />
                <Text style={styles.heroSecondaryBtnText}>Agri Store</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* ── 2. Quick Action App Icons Hub (Horizontal Carousel) ── */}
        <View style={styles.quickHubSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickHubContent}
          >
            {QUICK_APP_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={styles.quickActionItem}
                onPress={() => router.push(action.route as any)}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionCircle, { backgroundColor: action.bg }]}>
                  <Ionicons name={action.icon as any} size={22} color={action.color} />
                  {action.badge && (
                    <View style={[styles.quickActionBadge, { backgroundColor: action.badgeColor }]}>
                      <Text style={styles.quickActionBadgeText}>{action.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.quickActionLabel, isDay ? styles.textDayMain : styles.textNightMain]} numberOfLines={1}>
                  {action.title}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ── 3. The Four Pillars of FarmsKing (Modern 2x2 Grid) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="layers" size={16} color="#059669" />
              <Text style={[styles.sectionTitle, isDay ? styles.textDayMain : styles.textNightMain]}>
                Core Pillars
              </Text>
            </View>
            <Text style={styles.sectionHint}>Explore Solutions</Text>
          </View>

          <View style={styles.pillarsGrid}>
            {FOUR_PILLARS.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.pillarCard, isDay ? styles.pillarCardDay : styles.pillarCardNight]}
                onPress={() => router.push(p.route as any)}
                activeOpacity={0.85}
              >
                <View style={[styles.pillarIconBox, isDay ? styles.pillarIconBoxDay : styles.pillarIconBoxNight]}>
                  <View style={[styles.pillarBadge, { backgroundColor: `${p.color}18`, borderColor: `${p.color}40` }]}>
                    <Text style={[styles.pillarBadgeText, { color: p.color }]}>{p.badge}</Text>
                  </View>
                  <Image source={p.iconImg} style={styles.pillarThumbImg} resizeMode="contain" />
                </View>
                <View style={styles.pillarInfo}>
                  <Text style={[styles.pillarTitle, isDay ? styles.textDayMain : styles.textNightMain]} numberOfLines={1}>
                    {p.title}
                  </Text>
                  <Text style={styles.pillarDesc} numberOfLines={2}>
                    {p.desc}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 4. Live APMC Mandi Rates Mobile Widget ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={styles.livePulseDot} />
              <Text style={[styles.sectionTitle, isDay ? styles.textDayMain : styles.textNightMain]}>
                Live APMC Mandi Rates
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/topic/Mandi-Rates')}>
              <Text style={styles.viewAllText}>View All →</Text>
            </TouchableOpacity>
          </View>

          {/* Crop Selector Horizontal Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mandiTabsRow}
          >
            {MANDI_CROPS.map((crop, idx) => {
              const active = idx === selectedCropIndex;
              return (
                <TouchableOpacity
                  key={crop.id}
                  style={[
                    styles.cropTabPill,
                    active
                      ? styles.cropTabPillActive
                      : isDay
                      ? styles.cropTabPillDay
                      : styles.cropTabPillNight,
                  ]}
                  onPress={() => setSelectedCropIndex(idx)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.cropTabPillText,
                      active ? styles.cropTabPillTextActive : isDay ? styles.textDaySub : styles.textNightSub,
                    ]}
                  >
                    {crop.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Mandi Showcase Card */}
          <View style={[styles.mandiCard, isDay ? styles.mandiCardDay : styles.mandiCardNight]}>
            <View style={styles.mandiCardTop}>
              <View>
                <Text style={styles.mandiCropTitle}>{selectedCrop.name}</Text>
                <Text style={styles.mandiLocationText}>📍 {selectedCrop.mandi}</Text>
              </View>
              <View style={styles.mandiRateCol}>
                <Text style={styles.mandiRateValue}>{selectedCrop.rate}</Text>
                <View
                  style={[
                    styles.trendBadge,
                    {
                      backgroundColor: selectedCrop.change.startsWith('+') ? '#ecfdf5' : '#fef2f2',
                    },
                  ]}
                >
                  <Ionicons
                    name={selectedCrop.change.startsWith('+') ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={selectedCrop.change.startsWith('+') ? '#059669' : '#dc2626'}
                  />
                  <Text
                    style={[
                      styles.trendBadgeText,
                      {
                        color: selectedCrop.change.startsWith('+') ? '#059669' : '#dc2626',
                      },
                    ]}
                  >
                    {selectedCrop.change} Today
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.mandiCardDivider} />

            <View style={styles.mandiCardBottom}>
              <View style={styles.mandiPerkItem}>
                <Ionicons name="checkmark-circle" size={14} color="#10b981" />
                <Text style={styles.mandiPerkText}>Verified APMC Auction</Text>
              </View>
              <TouchableOpacity
                style={styles.mandiDetailBtn}
                onPress={() => router.push('/topic/Mandi-Rates')}
                activeOpacity={0.8}
              >
                <Text style={styles.mandiDetailBtnText}>View Trend →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ── 5. Instant AI Crop Doctor Quick Card ── */}
        <View style={styles.sectionWrap}>
          <View style={[styles.scannerBanner, isDay ? styles.scannerBannerDay : styles.scannerBannerNight]}>
            <View style={styles.scannerBadgeRow}>
              <View style={styles.scannerBadge}>
                <Ionicons name="scan" size={12} color="#059669" />
                <Text style={styles.scannerBadgeText}>Sub-Second Leaf Diagnosis</Text>
              </View>
            </View>

            <Text style={[styles.scannerTitle, isDay ? styles.textDayMain : styles.textNightMain]}>
              Is your crop affected by rust, blight, or pests?
            </Text>
            <Text style={styles.scannerSub}>
              Take or upload a photo of any leaf. The neural AI identifies the disease and gives PAU-calibrated per-acre tank spray formulas in seconds.
            </Text>

            <TouchableOpacity
              style={styles.scannerActionBtn}
              onPress={() => router.push('/ai-doctor')}
              activeOpacity={0.85}
            >
              <Ionicons name="camera" size={18} color="#ffffff" />
              <Text style={styles.scannerActionBtnText}>Open Camera &amp; Scan Leaf</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 6. FarmsKing Certified Agri Store (Farmer-Made & Inputs) ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="basket" size={16} color="#0284c7" />
              <Text style={[styles.sectionTitle, isDay ? styles.textDayMain : styles.textNightMain]}>
                Certified Store &amp; Pure Food
              </Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/shop')}>
              <Text style={styles.viewAllText}>Shop All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.productsGrid}>
            {SPOTLIGHT_PRODUCTS.map((prod) => (
              <View
                key={prod.id}
                style={[styles.productCard, isDay ? styles.productCardDay : styles.productCardNight]}
              >
                <View style={styles.productTagBadge}>
                  <Text style={styles.productTagBadgeText}>{prod.tag}</Text>
                </View>

                <View style={styles.productIconCircle}>
                  <Ionicons name={prod.icon as any} size={24} color="#0284c7" />
                </View>

                <Text style={[styles.productName, isDay ? styles.textDayMain : styles.textNightMain]} numberOfLines={2}>
                  {prod.name}
                </Text>
                <Text style={styles.productCategory}>{prod.category}</Text>
                <Text style={styles.productUnit}>{prod.unit}</Text>

                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>₹{prod.price}</Text>
                  <TouchableOpacity
                    style={styles.productAddBtn}
                    onPress={() => handleAddToCart(prod)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="add" size={16} color="#ffffff" />
                    <Text style={styles.productAddBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ── 7. Verified Cultivator Stories & Real Reviews ── */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="shield-checkmark" size={16} color="#10b981" />
              <Text style={[styles.sectionTitle, isDay ? styles.textDayMain : styles.textNightMain]}>
                Verified Cultivator Stories
              </Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.reviewsScroll}
          >
            {FARMER_REVIEWS.map((rev) => (
              <View
                key={rev.id}
                style={[styles.reviewCard, isDay ? styles.reviewCardDay : styles.reviewCardNight]}
              >
                <View style={styles.reviewGainRow}>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Ionicons key={s} name="star" size={12} color="#f59e0b" />
                    ))}
                  </View>
                  <View style={styles.reviewGainBadge}>
                    <Text style={styles.reviewGainBadgeText}>{rev.gain}</Text>
                  </View>
                </View>

                <Text style={[styles.reviewQuote, isDay ? styles.textDaySub : styles.textNightSub]} numberOfLines={4}>
                  "{rev.quote}"
                </Text>

                <View style={styles.reviewAuthorRow}>
                  <View style={styles.blankAvatarWrap}>
                    <Ionicons name="person" size={16} color="#94a3b8" />
                    <View style={styles.reviewVerifiedBadge}>
                      <Ionicons name="checkmark-circle" size={10} color="#10b981" />
                    </View>
                  </View>
                  <View style={styles.reviewAuthorInfo}>
                    <Text style={[styles.reviewAuthorName, isDay ? styles.textDayMain : styles.textNightMain]}>
                      {rev.name}
                    </Text>
                    <Text style={styles.reviewAuthorLoc}>{rev.location}</Text>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* ── 8. Quick Helpline & WhatsApp Support Bar ── */}
        <View style={styles.helplineWrap}>
          <View style={[styles.helplineCard, isDay ? styles.helplineCardDay : styles.helplineCardNight]}>
            <View style={styles.helplineLeft}>
              <Text style={[styles.helplineTitle, isDay ? styles.textDayMain : styles.textNightMain]}>
                Need Expert Farm Guidance?
              </Text>
              <Text style={styles.helplineSub}>
                Talk with PAU-certified agronomists 24/7
              </Text>
            </View>

            <View style={styles.helplineBtns}>
              <TouchableOpacity
                style={styles.whatsappActionBtn}
                onPress={handleOpenWhatsApp}
                activeOpacity={0.85}
              >
                <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
                <Text style={styles.helplineBtnText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callActionBtn}
                onPress={handleOpenCall}
                activeOpacity={0.85}
              >
                <Ionicons name="call" size={15} color="#ffffff" />
                <Text style={styles.helplineBtnText}>Call</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Bottom Spacing to avoid Docked Bar overlap */}
        <View style={{ height: 85 }} />
      </ScrollView>

      {/* ══ MOBILE DOCKED BOTTOM APP BAR ══ */}
      <View style={[styles.bottomBar, isDay ? styles.bottomBarDay : styles.bottomBarNight]}>
        {/* 1: Home */}
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => {
            setActiveBottomNav(0);
            if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeBottomNav === 0 ? 'home' : 'home-outline'}
            size={21}
            color={activeBottomNav === 0 ? '#10b981' : isDay ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.bottomTabLabel,
              activeBottomNav === 0 && { color: '#10b981', fontWeight: '700' },
            ]}
          >
            Home
          </Text>
        </TouchableOpacity>

        {/* 2: Mandi Rates */}
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => {
            setActiveBottomNav(1);
            router.push('/topic/Mandi-Rates');
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeBottomNav === 1 ? 'trending-up' : 'trending-up-outline'}
            size={21}
            color={activeBottomNav === 1 ? '#eab308' : isDay ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.bottomTabLabel,
              activeBottomNav === 1 && { color: '#eab308', fontWeight: '700' },
            ]}
          >
            Mandi
          </Text>
        </TouchableOpacity>

        {/* 3: Prominent Center AI Doctor Scan Action Button */}
        <TouchableOpacity
          style={styles.centerDoctorTab}
          onPress={() => router.push('/ai-doctor')}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#10b981', '#059669', '#047857']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.centerDoctorCircle}
          >
            <Ionicons name="camera" size={24} color="#ffffff" />
          </LinearGradient>
          <Text style={styles.centerDoctorLabel}>AI Doctor</Text>
        </TouchableOpacity>

        {/* 4: Agri Store */}
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => {
            setActiveBottomNav(3);
            router.push('/shop');
          }}
          activeOpacity={0.8}
        >
          <View style={{ position: 'relative' }}>
            <Ionicons
              name={activeBottomNav === 3 ? 'bag-handle' : 'bag-handle-outline'}
              size={21}
              color={activeBottomNav === 3 ? '#0284c7' : isDay ? '#64748b' : '#94a3b8'}
            />
            {cartCount > 0 && (
              <View style={styles.bottomCartDot} />
            )}
          </View>
          <Text
            style={[
              styles.bottomTabLabel,
              activeBottomNav === 3 && { color: '#0284c7', fontWeight: '700' },
            ]}
          >
            Store
          </Text>
        </TouchableOpacity>

        {/* 5: Account / Profile */}
        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => {
            setActiveBottomNav(4);
            if (user) router.push('/profile' as any);
            else router.push('/login' as any);
          }}
          activeOpacity={0.8}
        >
          <Ionicons
            name={activeBottomNav === 4 ? 'person' : 'person-outline'}
            size={21}
            color={activeBottomNav === 4 ? '#8b5cf6' : isDay ? '#64748b' : '#94a3b8'}
          />
          <Text
            style={[
              styles.bottomTabLabel,
              activeBottomNav === 4 && { color: '#8b5cf6', fontWeight: '700' },
            ]}
          >
            {user ? 'Profile' : 'Login'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    minHeight: '100vh' as any,
  },
  rootDay: {
    backgroundColor: '#f8fafc',
  },
  rootNight: {
    backgroundColor: '#090d16',
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ── Sticky Top Bar ──
  topBar: {
    position: 'sticky' as any,
    top: 0,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  topBarDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderBottomColor: '#e2e8f0',
  },
  topBarNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoWrap: {
    flexShrink: 0,
  },
  topBarActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  // ── Language Selector Box ──
  langBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.pill,
    padding: 2,
    borderWidth: 1,
  },
  langBoxDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  langBoxNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  langSeg: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  langSegActive: {
    backgroundColor: '#059669',
  },
  langSegText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  langSegTextActive: {
    color: '#ffffff',
  },

  themeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  themeBtnDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  themeBtnNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },

  cartBtn: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  cartBtnDay: {
    backgroundColor: '#f1f5f9',
    borderColor: '#cbd5e1',
  },
  cartBtnNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },

  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileBtnDay: {},
  profileBtnNight: {},

  toastNotice: {
    position: 'fixed' as any,
    top: 55,
    left: 20,
    right: 20,
    zIndex: 99999,
    backgroundColor: '#064e3b',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
  },
  toastNoticeText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '600',
  },

  // ── Hero Section ──
  heroSection: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  heroCard: {
    borderRadius: 20,
    padding: 16,
    boxShadow: '0 8px 24px rgba(5, 150, 105, 0.25)',
  },
  heroTopTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  heroTagText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  heroRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: RADIUS.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heroRatingText: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '700',
  },
  heroHeadline: {
    fontSize: 19,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 25,
    marginBottom: 6,
  },
  heroSub: {
    fontSize: 12,
    color: '#d1fae5',
    lineHeight: 17,
    marginBottom: 14,
  },
  heroBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  heroPrimaryBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroPrimaryBtnText: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '800',
  },
  heroSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  heroSecondaryBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },

  // ── Quick Action App Circles ──
  quickHubSection: {
    paddingVertical: 14,
  },
  quickHubContent: {
    paddingHorizontal: 12,
    gap: 14,
  },
  quickActionItem: {
    alignItems: 'center',
    width: 62,
  },
  quickActionCircle: {
    position: 'relative',
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  },
  quickActionBadge: {
    position: 'absolute',
    top: -3,
    right: -4,
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1.5,
  },
  quickActionBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '800',
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  // ── Sections Wrap & Header ──
  sectionWrap: {
    paddingHorizontal: 12,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionHint: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 12,
    color: '#0284c7',
    fontWeight: '700',
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },

  // ── 4 Pillars Grid (2x2) ──
  pillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  pillarCard: {
    width: 'calc(50% - 5px)' as any,
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  pillarCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  },
  pillarCardNight: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  pillarIconBox: {
    width: '100%',
    height: 82,
    borderRadius: 12,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  pillarIconBoxDay: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  pillarIconBoxNight: {
    backgroundColor: 'rgba(255, 255, 255, 0.035)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  pillarThumbImg: {
    width: 74,
    height: 74,
  },
  pillarInfo: {
    width: '100%',
  },
  pillarBadge: {
    position: 'absolute',
    top: 5,
    left: 5,
    zIndex: 2,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderWidth: 1,
  },
  pillarBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  pillarTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    marginBottom: 2,
  },
  pillarDesc: {
    fontSize: 10.5,
    color: '#64748b',
    lineHeight: 14,
  },

  // ── Mandi Card ──
  mandiTabsRow: {
    gap: 8,
    marginBottom: 10,
  },
  cropTabPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
  },
  cropTabPillActive: {
    backgroundColor: '#eab308',
    borderColor: '#ca8a04',
  },
  cropTabPillDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  cropTabPillNight: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cropTabPillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cropTabPillTextActive: {
    color: '#ffffff',
  },
  mandiCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  mandiCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  mandiCardNight: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  mandiCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mandiCropTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  mandiLocationText: {
    fontSize: 11.5,
    color: '#64748b',
    marginTop: 2,
  },
  mandiRateCol: {
    alignItems: 'flex-end',
  },
  mandiRateValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#059669',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 3,
  },
  trendBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  mandiCardDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.06)',
    marginVertical: 10,
  },
  mandiCardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mandiPerkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  mandiPerkText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  mandiDetailBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  mandiDetailBtnText: {
    fontSize: 11.5,
    color: '#059669',
    fontWeight: '700',
  },

  // ── AI Scanner Banner ──
  scannerBanner: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
  },
  scannerBannerDay: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  scannerBannerNight: {
    backgroundColor: '#064e3b33',
    borderColor: '#05966955',
  },
  scannerBadgeRow: {
    marginBottom: 8,
  },
  scannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.pill,
  },
  scannerBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#059669',
  },
  scannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  scannerSub: {
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 12,
  },
  scannerActionBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.35)',
  },
  scannerActionBtnText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // ── Agri Store Products Grid ──
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  productCard: {
    width: 'calc(50% - 5px)' as any,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    position: 'relative',
  },
  productCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    boxShadow: '0 2px 10px rgba(0,0,0,0.04)',
  },
  productCardNight: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  productTagBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
  },
  productTagBadgeText: {
    fontSize: 9,
    color: '#16a34a',
    fontWeight: '700',
  },
  productIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  productName: {
    fontSize: 12.5,
    fontWeight: '800',
    minHeight: 32,
    marginBottom: 2,
  },
  productCategory: {
    fontSize: 10,
    color: '#64748b',
    marginBottom: 1,
  },
  productUnit: {
    fontSize: 10,
    color: '#94a3b8',
    marginBottom: 6,
  },
  productPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0284c7',
  },
  productAddBtn: {
    backgroundColor: '#0284c7',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  productAddBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Reviews ──
  reviewsScroll: {
    gap: 10,
  },
  reviewCard: {
    width: 260,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  reviewCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  reviewCardNight: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  reviewGainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewGainBadge: {
    backgroundColor: '#ecfdf5',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  reviewGainBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  reviewQuote: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 10,
  },
  reviewAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  blankAvatarWrap: {
    position: 'relative',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  reviewVerifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#ffffff',
    borderRadius: 6,
  },
  reviewAuthorInfo: {},
  reviewAuthorName: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  reviewAuthorLoc: {
    fontSize: 10,
    color: '#64748b',
  },

  // ── Helpline Card ──
  helplineWrap: {
    paddingHorizontal: 12,
  },
  helplineCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    flexDirection: 'column',
    gap: 12,
  },
  helplineCardDay: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  helplineCardNight: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  helplineLeft: {},
  helplineTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  helplineSub: {
    fontSize: 11,
    color: '#64748b',
  },
  helplineBtns: {
    flexDirection: 'row',
    gap: 10,
  },
  whatsappActionBtn: {
    flex: 1,
    backgroundColor: '#25d366',
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  callActionBtn: {
    flex: 1,
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  helplineBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontWeight: '700',
  },

  // ── Docked Bottom Bar ──
  bottomBar: {
    position: 'fixed' as any,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 62,
    borderTopWidth: 1,
    boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
  },
  bottomBarDay: {
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    borderTopColor: '#e2e8f0',
  },
  bottomBarNight: {
    backgroundColor: 'rgba(15, 23, 42, 0.96)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  bottomTabLabel: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  bottomCartDot: {
    position: 'absolute',
    top: -2,
    right: -3,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
  },
  centerDoctorTab: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
    paddingHorizontal: 8,
  },
  centerDoctorCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.45)',
  },
  centerDoctorLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    marginTop: 3,
  },

  // ── Common Text ──
  textDayMain: {
    color: '#0f172a',
  },
  textNightMain: {
    color: '#ffffff',
  },
  textDaySub: {
    color: '#475569',
  },
  textNightSub: {
    color: '#94a3b8',
  },
});

